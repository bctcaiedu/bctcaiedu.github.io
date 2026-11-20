# -*- coding: utf-8 -*-
"""
AI 면접관 - 실사 얼굴 서버 (MuseTalk 1.5 + edge-tts)

웹 페이지(bctcaiedu.github.io/interview-agent)가 면접관이 말할 문장을 보내면
  1) edge-tts로 한국어 음성을 만들고
  2) MuseTalk 1.5로 그 음성에 맞춰 입을 움직이는 얼굴 영상을 만들어
  3) 소리가 들어간 mp4로 돌려줍니다.

실행 (MuseTalk 폴더가 이 파일 옆의 MuseTalk/ 에 있을 때):
    python realface_server.py                      # 이 PC에서만 (http://127.0.0.1:8765)
    python realface_server.py --host 0.0.0.0       # 학과 서버로 공유 (README의 HTTPS 안내 참고)

면접관 얼굴은 avatars/ 폴더에 female.mp4, male.mp4 (또는 .jpg/.png)로 넣습니다.
"""
import argparse
import asyncio
import json
import os
import pickle
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent

ap = argparse.ArgumentParser(description="AI 면접관 실사 얼굴 서버 (MuseTalk 1.5)")
ap.add_argument("--musetalk", default=str(HERE / "MuseTalk"), help="MuseTalk 저장소 폴더")
ap.add_argument("--avatars", default=str(HERE / "avatars"), help="면접관 얼굴 영상/사진 폴더")
ap.add_argument("--host", default="127.0.0.1", help="0.0.0.0 으로 하면 다른 PC에서도 접속 가능")
ap.add_argument("--port", type=int, default=8765)
ap.add_argument("--gpu", type=int, default=0)
ap.add_argument("--batch", type=int, default=16, help="한 번에 처리할 프레임 수 (VRAM이 작으면 8)")
ap.add_argument("--fps", type=int, default=25)
ap.add_argument("--height", type=int, default=540, help="영상 세로 해상도 (낮추면 빨라짐)")
ap.add_argument("--max-seconds", type=float, default=8.0, help="아바타 원본 영상에서 쓸 최대 길이(초)")
ap.add_argument("--voice-female", default="ko-KR-SunHiNeural")
ap.add_argument("--voice-male", default="ko-KR-InJoonNeural")
ap.add_argument("--allow-origin", default="*", help="허용할 웹 페이지 주소 (예: https://bctcaiedu.github.io)")
args = ap.parse_args()

MT = Path(args.musetalk).resolve()
if not (MT / "musetalk").is_dir():
    sys.exit(f"[오류] MuseTalk 폴더를 찾지 못했어요: {MT}\n  --musetalk 경로를 확인하거나 setup_windows.bat 을 먼저 실행하세요.")
AVATAR_SRC = Path(args.avatars).resolve()
AVATAR_SRC.mkdir(parents=True, exist_ok=True)
CACHE = HERE / "cache"
CACHE.mkdir(exist_ok=True)

# MuseTalk 코드는 models/ 같은 상대 경로를 쓰므로 작업 폴더를 MuseTalk로 옮긴다
os.chdir(MT)
sys.path.insert(0, str(MT))

if not shutil.which("ffmpeg"):
    sys.exit("[오류] ffmpeg 를 찾지 못했어요. ffmpeg 를 설치하고 PATH에 추가하세요.")

print("[1/3] 모델을 불러오는 중… (처음에는 1분 정도 걸려요)")
import cv2  # noqa: E402
import numpy as np  # noqa: E402
import torch  # noqa: E402
from transformers import WhisperModel  # noqa: E402
from musetalk.utils.utils import load_all_model, datagen  # noqa: E402
from musetalk.utils.audio_processor import AudioProcessor  # noqa: E402
from musetalk.utils.face_parsing import FaceParsing  # noqa: E402
from musetalk.utils.preprocessing import get_landmark_and_bbox, read_imgs, coord_placeholder  # noqa: E402
from musetalk.utils.blending import get_image_prepare_material, get_image_blending  # noqa: E402

device = torch.device(f"cuda:{args.gpu}" if torch.cuda.is_available() else "cpu")
if device.type != "cuda":
    print("[경고] CUDA GPU를 찾지 못했어요. CPU로는 너무 느려서 실시간 대화가 어렵습니다.")

vae, unet, pe = load_all_model(
    unet_model_path=os.path.join("models", "musetalkV15", "unet.pth"),
    vae_type="sd-vae",
    unet_config=os.path.join("models", "musetalkV15", "musetalk.json"),
    device=device,
)
timesteps = torch.tensor([0], device=device)
pe = pe.half().to(device)
vae.vae = vae.vae.half().to(device)
unet.model = unet.model.half().to(device)
audio_processor = AudioProcessor(feature_extractor_path="./models/whisper")
weight_dtype = unet.model.dtype
whisper = WhisperModel.from_pretrained("./models/whisper").to(device=device, dtype=weight_dtype).eval()
whisper.requires_grad_(False)
fp = FaceParsing(left_cheek_width=90, right_cheek_width=90)
EXTRA_MARGIN = 10

GPU_LOCK = threading.Lock()          # GPU 작업은 한 번에 하나씩
STATS = {"gen_fps": None, "last_ms": None, "requests": 0}


def gpu_info():
    if device.type != "cuda":
        return {"name": "CPU", "vram_gb": 0}
    p = torch.cuda.get_device_properties(device)
    return {"name": p.name, "vram_gb": round(p.total_memory / 1024 ** 3, 1)}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError("ffmpeg 오류: " + r.stderr.decode("utf-8", "ignore")[-400:])


# ---------------------------------------------------------------------------
# 아바타 (면접관 얼굴) 준비: 얼굴 위치 · 입 주변 마스크 · 잠재 벡터를 한 번만 계산해 저장
# ---------------------------------------------------------------------------
class Avatar:
    def __init__(self, aid, src: Path):
        self.id, self.src = aid, src
        self.dir = CACHE / aid
        self.ready = False
        self.preparing = False
        self.error = None
        self.idx = 0
        self.frames = []

    def signature(self):
        st = self.src.stat()
        return f"{self.src.name}|{st.st_size}|{int(st.st_mtime)}|{args.height}|{args.max_seconds}|{args.fps}"

    def frame_at(self, i):
        """앞으로 재생 → 거꾸로 재생을 반복 (메모리를 아끼려고 프레임은 한 번만 저장)"""
        n = len(self.frames)
        k = i % (2 * n)
        return k if k < n else 2 * n - 1 - k

    def prepare(self, force=False):
        self.preparing, self.error = True, None
        try:
            info = self.dir / "info.json"
            if not force and info.exists() and json.loads(info.read_text("utf-8")).get("sig") == self.signature():
                self._load()
            else:
                self._build()
            self.ready = True
            print(f"  ✔ 아바타 '{self.id}' 준비 완료 ({len(self.frames)}프레임, {self.w}x{self.h})")
        except Exception as e:  # noqa: BLE001
            traceback.print_exc()
            self.ready, self.error = False, str(e)
            print(f"  ✘ 아바타 '{self.id}' 준비 실패: {e}")
        finally:
            self.preparing = False

    def _build(self):
        print(f"  … 아바타 '{self.id}' 처음 준비 중 (원본: {self.src.name}) — 수십 초~몇 분 걸려요")
        if self.dir.exists():
            shutil.rmtree(self.dir)
        fdir = self.dir / "frames"
        fdir.mkdir(parents=True)
        H = args.height
        if self.src.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp", ".bmp"):
            img = cv2.imread(str(self.src))
            if img is None:
                raise RuntimeError("사진을 읽지 못했어요")
            s = H / img.shape[0]
            img = cv2.resize(img, (int(img.shape[1] * s) // 2 * 2, H), interpolation=cv2.INTER_AREA)
            cv2.imwrite(str(fdir / "00000000.png"), img)
        else:
            run(["ffmpeg", "-y", "-v", "error", "-i", str(self.src), "-t", str(args.max_seconds),
                 "-vf", f"fps={args.fps},scale=-2:{H}", "-start_number", "0", str(fdir / "%08d.png")])
        imgs = sorted(str(p) for p in fdir.glob("*.png"))
        if not imgs:
            raise RuntimeError("영상에서 프레임을 뽑지 못했어요")
        with GPU_LOCK:
            coords, frames = get_landmark_and_bbox(imgs, 0)
            keep_frames, keep_coords, latents = [], [], []
            for bbox, frame in zip(coords, frames):
                if bbox == coord_placeholder:
                    continue                       # 얼굴이 안 잡힌 프레임은 버림
                x1, y1, x2, y2 = bbox
                y2 = min(y2 + EXTRA_MARGIN, frame.shape[0])
                crop = cv2.resize(frame[y1:y2, x1:x2], (256, 256), interpolation=cv2.INTER_LANCZOS4)
                latents.append(vae.get_latents_for_unet(crop))
                keep_frames.append(frame)
                keep_coords.append([x1, y1, x2, y2])
            if not keep_frames:
                raise RuntimeError("얼굴을 찾지 못했어요. 정면 얼굴이 크게 보이는 영상/사진을 쓰세요.")
            masks, mask_boxes = [], []
            for frame, box in zip(keep_frames, keep_coords):
                m, cb = get_image_prepare_material(frame, box, fp=fp, mode="jaw")
                masks.append(m)
                mask_boxes.append(cb)
        shutil.rmtree(fdir)
        (self.dir / "full").mkdir()
        for i, f in enumerate(keep_frames):
            cv2.imwrite(str(self.dir / "full" / f"{i:08d}.png"), f)
        with open(self.dir / "data.pkl", "wb") as f:
            pickle.dump({"coords": keep_coords, "masks": masks, "mask_boxes": mask_boxes}, f)
        torch.save([l.cpu() for l in latents], self.dir / "latents.pt")
        self.frames, self.coords, self.masks, self.mask_boxes = keep_frames, keep_coords, masks, mask_boxes
        self.latents = [l.to(device) for l in latents]
        self.h, self.w = keep_frames[0].shape[:2]
        self._encode_idle()
        cv2.imwrite(str(self.dir / "poster.jpg"), keep_frames[0], [cv2.IMWRITE_JPEG_QUALITY, 88])
        (self.dir / "info.json").write_text(json.dumps({"sig": self.signature()}), "utf-8")

    def _load(self):
        imgs = sorted(str(p) for p in (self.dir / "full").glob("*.png"))
        self.frames = read_imgs(imgs)
        with open(self.dir / "data.pkl", "rb") as f:
            d = pickle.load(f)
        self.coords, self.masks, self.mask_boxes = d["coords"], d["masks"], d["mask_boxes"]
        self.latents = [l.to(device) for l in torch.load(self.dir / "latents.pt")]
        self.h, self.w = self.frames[0].shape[:2]
        if not (self.dir / "idle.mp4").exists():
            self._encode_idle()

    def _encode_idle(self):
        """말하지 않을 때 웹 페이지에서 반복 재생할 무음 영상"""
        out = self.dir / "idle.mp4"
        p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24",
                              "-s", f"{self.w}x{self.h}", "-r", str(args.fps), "-i", "-",
                              "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-pix_fmt", "yuv420p",
                              "-movflags", "+faststart", str(out)], stdin=subprocess.PIPE)
        for i in range(2 * len(self.frames)):
            p.stdin.write(self.frames[self.frame_at(i)].tobytes())
        p.stdin.close()
        p.wait()

    @torch.no_grad()
    def render(self, wav_path, audio_for_mux, out_path):
        feats, length = audio_processor.get_audio_feature(wav_path, weight_dtype=weight_dtype)
        chunks = audio_processor.get_whisper_chunk(feats, device, weight_dtype, whisper, length, fps=args.fps,
                                                   audio_padding_length_left=2, audio_padding_length_right=2)
        n = len(chunks)
        start = self.idx
        # 이번 문장에 쓸 잠재 벡터를 이어지는 위치부터 순서대로 준비 (문장 사이에 고개가 튀지 않게)
        order = [self.frame_at(start + i) for i in range(n)]
        lat_seq = [self.latents[k] for k in order]
        p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24",
                              "-s", f"{self.w}x{self.h}", "-r", str(args.fps), "-i", "-",
                              "-i", str(audio_for_mux), "-map", "0:v", "-map", "1:a",
                              "-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency", "-crf", "23",
                              "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-shortest",
                              "-movflags", "+faststart", str(out_path)], stdin=subprocess.PIPE, stderr=subprocess.PIPE)
        t0 = time.time()
        i = 0
        for wb, lb in datagen(chunks, lat_seq, args.batch, device=device):
            audio_feat = pe(wb.to(device))
            lb = lb.to(device=device, dtype=unet.model.dtype)
            pred = unet.model(lb, timesteps, encoder_hidden_states=audio_feat).sample
            recon = vae.decode_latents(pred.to(device=device, dtype=vae.vae.dtype))
            for face in recon:
                k = order[i]
                x1, y1, x2, y2 = self.coords[k]
                frame = self.frames[k].copy()
                try:
                    face = cv2.resize(face.astype(np.uint8), (x2 - x1, y2 - y1))
                    frame = get_image_blending(frame, face, [x1, y1, x2, y2], self.masks[k], self.mask_boxes[k])
                except Exception:  # noqa: BLE001
                    pass
                p.stdin.write(np.ascontiguousarray(frame).tobytes())
                i += 1
        gen = time.time() - t0
        p.stdin.close()
        err = p.stderr.read().decode("utf-8", "ignore")
        if p.wait() != 0:
            raise RuntimeError("영상 인코딩 실패: " + err[-300:])
        self.idx = start + n
        fps = n / gen if gen > 0 else None
        if fps:
            STATS["gen_fps"] = fps if STATS["gen_fps"] is None else STATS["gen_fps"] * .7 + fps * .3
        return n


AVATARS = {}


def scan_avatars():
    for f in sorted(AVATAR_SRC.iterdir()):
        if f.suffix.lower() in (".mp4", ".mov", ".mkv", ".webm", ".avi", ".jpg", ".jpeg", ".png", ".webp"):
            aid = f.stem.lower()
            if aid not in AVATARS or AVATARS[aid].src != f:
                AVATARS[aid] = Avatar(aid, f)


def prepare_all():
    for a in list(AVATARS.values()):
        if not a.ready and not a.preparing:
            a.prepare()
    benchmark()


def benchmark():
    """실시간으로 쓸 수 있는지 2초짜리 무음으로 생성 속도 측정"""
    a = next((a for a in AVATARS.values() if a.ready), None)
    if not a:
        return
    with tempfile.TemporaryDirectory() as td:
        wav = Path(td) / "s.wav"
        run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono", "-t", "2", str(wav)])
        with GPU_LOCK:
            keep = a.idx
            a.render(str(wav), wav, Path(td) / "o.mp4")
            a.idx = keep
    print(f"[3/3] 생성 속도: 초당 {STATS['gen_fps']:.1f}프레임 (실시간 기준 {args.fps}프레임)")


# ---------------------------------------------------------------------------
# 음성 합성 (edge-tts: Microsoft 온라인 한국어 음성, 무료 · 인터넷 필요)
# ---------------------------------------------------------------------------
def tts(text, voice, rate, out_mp3):
    import edge_tts
    pct = int(round((rate - 1.0) * 100))
    asyncio.run(edge_tts.Communicate(text, voice, rate=f"{pct:+d}%").save(str(out_mp3)))


# ---------------------------------------------------------------------------
# 웹 서버
# ---------------------------------------------------------------------------
from fastapi import FastAPI, HTTPException, Request, UploadFile, File  # noqa: E402
from fastapi.responses import FileResponse, JSONResponse, Response  # noqa: E402
from pydantic import BaseModel  # noqa: E402
import uvicorn  # noqa: E402

app = FastAPI(title="AI 면접관 실사 얼굴 서버")


@app.middleware("http")
async def cors(request: Request, call_next):
    origin = request.headers.get("origin", "")
    allow = "*" if args.allow_origin == "*" else (origin if origin == args.allow_origin else args.allow_origin)
    h = {
        "Access-Control-Allow-Origin": allow,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Expose-Headers": "x-frames, x-gen-ms, x-tts-ms",
        "Access-Control-Allow-Private-Network": "true",   # https 페이지 → 내 PC(localhost) 접근 허용
        "Vary": "Origin",
    }
    if request.method == "OPTIONS":
        return Response(status_code=204, headers=h)
    resp = await call_next(request)
    for k, v in h.items():
        resp.headers[k] = v
    return resp


@app.get("/health")
def health():
    g = gpu_info()
    gen = STATS["gen_fps"]
    return {
        "ok": True, "service": "interview-realface", "model": "MuseTalk 1.5", "tts": "edge-tts",
        "gpu": g["name"], "vram_gb": g["vram_gb"], "cuda": device.type == "cuda",
        "fps": args.fps, "gen_fps": round(gen, 1) if gen else None,
        "realtime_factor": round(gen / args.fps, 2) if gen else None,
        "last_ms": STATS["last_ms"], "requests": STATS["requests"],
        "avatars": {k: {"ready": a.ready, "preparing": a.preparing, "error": a.error,
                        "size": [a.w, a.h] if a.ready else None} for k, a in AVATARS.items()},
    }


def get_avatar(aid):
    a = AVATARS.get(aid)
    if not a:
        raise HTTPException(404, f"아바타 '{aid}' 가 없어요. avatars 폴더에 {aid}.mp4 를 넣으세요.")
    if not a.ready:
        raise HTTPException(503, f"아바타 '{aid}' 준비 중이거나 실패했어요: {a.error or '준비 중'}")
    return a


@app.get("/avatar/{aid}/idle.mp4")
def idle(aid: str):
    return FileResponse(get_avatar(aid).dir / "idle.mp4", media_type="video/mp4")


@app.get("/avatar/{aid}/poster.jpg")
def poster(aid: str):
    return FileResponse(get_avatar(aid).dir / "poster.jpg", media_type="image/jpeg")


@app.post("/avatar/{aid}")
async def upload_avatar(aid: str, file: UploadFile = File(...)):
    """웹 페이지나 curl로 새 얼굴 영상/사진 올리기 → 백그라운드에서 준비"""
    aid = "".join(c for c in aid.lower() if c.isalnum() or c in "-_")[:32] or "custom"
    ext = Path(file.filename or "x.mp4").suffix.lower() or ".mp4"
    for old in AVATAR_SRC.glob(aid + ".*"):
        old.unlink()
    dst = AVATAR_SRC / f"{aid}{ext}"
    dst.write_bytes(await file.read())
    AVATARS[aid] = Avatar(aid, dst)
    threading.Thread(target=AVATARS[aid].prepare, daemon=True).start()
    return {"ok": True, "avatar": aid, "message": "준비를 시작했어요. /health 에서 상태를 확인하세요."}


class SpeakReq(BaseModel):
    text: str
    avatar: str = "female"
    rate: float = 1.0
    voice: str | None = None


@app.post("/speak")
def speak(req: SpeakReq):
    text = req.text.strip()[:400]
    if not text:
        raise HTTPException(400, "text 가 비어 있어요")
    a = get_avatar(req.avatar)
    voice = req.voice or (args.voice_male if req.avatar.startswith("male") else args.voice_female)
    rate = min(1.5, max(0.6, req.rate))
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        t0 = time.time()
        try:
            tts(text, voice, rate, td / "a.mp3")
        except Exception as e:  # noqa: BLE001
            raise HTTPException(502, f"음성 합성 실패 (인터넷 연결 확인): {e}")
        run(["ffmpeg", "-y", "-v", "error", "-i", str(td / "a.mp3"), "-ar", "16000", "-ac", "1", str(td / "a.wav")])
        t1 = time.time()
        with GPU_LOCK:
            n = a.render(str(td / "a.wav"), td / "a.mp3", td / "o.mp4")
        t2 = time.time()
        data = (td / "o.mp4").read_bytes()
    STATS["last_ms"] = int((t2 - t0) * 1000)
    STATS["requests"] += 1
    print(f"  ▶ [{req.avatar}] {n}프레임 · 음성 {int((t1-t0)*1000)}ms · 영상 {int((t2-t1)*1000)}ms · {text[:30]}")
    return Response(data, media_type="video/mp4",
                    headers={"x-frames": str(n), "x-gen-ms": str(int((t2 - t1) * 1000)), "x-tts-ms": str(int((t1 - t0) * 1000))})


if __name__ == "__main__":
    g = gpu_info()
    print(f"[2/3] GPU: {g['name']} ({g['vram_gb']}GB) · 아바타 폴더: {AVATAR_SRC}")
    scan_avatars()
    if not AVATARS:
        print("  [안내] avatars 폴더가 비어 있어요. female.mp4 / male.mp4 (또는 .jpg) 를 넣고 다시 실행하세요.")
    threading.Thread(target=prepare_all, daemon=True).start()
    print(f"\n  ▶ 서버 주소: http://{'127.0.0.1' if args.host in ('127.0.0.1', '0.0.0.0') else args.host}:{args.port}")
    print("  ▶ 웹 페이지의 '면접관 얼굴 표시'에서 'AI 실사' 또는 '자동'을 고르세요.\n")
    uvicorn.run(app, host=args.host, port=args.port, log_level="warning")
