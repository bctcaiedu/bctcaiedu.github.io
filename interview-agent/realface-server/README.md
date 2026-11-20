# AI 면접관 — 실사 얼굴 서버 (MuseTalk 1.5)

AI 면접관 웹 페이지에서 **AI 실사 얼굴** 모드를 쓰기 위한 서버입니다.
면접관이 말할 문장을 받으면 **한국어 음성(edge-tts) → 입 모양을 맞춘 얼굴 영상(MuseTalk 1.5)** 을 만들어 돌려줍니다.

```
웹 페이지 ──문장──▶ 실사 얼굴 서버 ──▶ edge-tts(음성) ──▶ MuseTalk(입 모양 영상) ──mp4──▶ 웹 페이지에서 재생
```

## 1. 필요한 것

| 항목 | 내용 |
|---|---|
| GPU | NVIDIA RTX 3060 (VRAM 8GB) 이상 권장. 실시간 대화를 하려면 초당 25프레임 이상 만들어야 함 |
| 운영체제 | Windows 10/11 (Linux도 가능) |
| 프로그램 | Python **3.10**, git, ffmpeg, 최신 NVIDIA 드라이버 |
| 디스크 | 약 15GB (모델 가중치 약 6GB 포함) |
| 인터넷 | 음성 합성(edge-tts)에 필요 |

> ⚠️ **RTX 50 시리즈(5060~5090)** 는 MuseTalk가 쓰는 PyTorch 2.0.1(CUDA 11.8)에서 동작하지 않습니다. RTX 20~40 시리즈를 쓰세요.

### ffmpeg 설치 (Windows)
1. https://github.com/BtbN/FFmpeg-Builds/releases 에서 `ffmpeg-master-latest-win64-gpl.zip` 을 받습니다.
2. 압축을 `C:\ffmpeg` 에 풀고, `C:\ffmpeg\bin` 을 시스템 환경 변수 **Path** 에 추가합니다.
3. 새 명령 프롬프트에서 `ffmpeg -version` 이 나오면 됩니다.

## 2. 설치

이 폴더(`realface-server`)에서 **`setup_windows.bat`** 을 더블클릭합니다.
MuseTalk 내려받기 → 가상환경 → PyTorch · MMLab 패키지 → 모델 가중치 내려받기까지 자동으로 진행합니다 (20~40분).

## 3. 면접관 얼굴 넣기

`avatars` 폴더에 아래 이름으로 넣습니다. (웹 페이지의 면접관 선택과 이름이 같아야 함)

| 파일 | 면접관 |
|---|---|
| `avatars/female.mp4` | 한서윤 (여성) |
| `avatars/male.mp4` | 박준호 (남성) |

**좋은 원본 영상 조건**
- 정면을 보고 **입을 다문 채** 가만히 있는 5~10초 영상 (눈 깜빡임, 살짝 끄덕임 정도는 좋음)
- 얼굴이 화면의 1/3 이상으로 크게, 밝고 고르게 보이게. 25fps면 가장 좋음
- 사진(`female.jpg`)도 되지만 고개가 전혀 움직이지 않아 어색합니다

> **초상권 주의:** 실제 사람 얼굴은 반드시 본인 동의를 받으세요. 이미지 생성 AI로 만든 가상 인물 사진/영상을 쓰면 가장 안전합니다.

처음 실행할 때 얼굴마다 한 번 전처리(수십 초~몇 분)를 하고 `cache` 폴더에 저장합니다. 원본 파일을 바꾸면 자동으로 다시 준비합니다.

## 4. 실행

**`start_server.bat`** 을 실행하면 `http://127.0.0.1:8765` 에서 서버가 켜집니다.

웹 페이지(면접 준비 화면)에서:
1. **면접관 얼굴 표시** → `자동` 또는 `AI 실사 얼굴`
2. **실사 얼굴 서버 주소** `http://127.0.0.1:8765` → **연결 확인**
3. 한 번 연결에 성공하면, 그 다음부터는 `자동` 모드가 서버를 찾아 실사 얼굴을 켭니다.
   서버가 꺼져 있거나 너무 느리면 PC 사양에 맞춰 3D 또는 2D로 바뀝니다.

> Chrome이 **"로컬 네트워크의 기기에 접근"** 허용 여부를 물으면 **허용**을 누르세요 (https 페이지에서 내 PC 서버에 접속하기 때문).

서버 창에 문장마다 `음성 ○○ms · 영상 ○○ms` 가 찍힙니다. 영상 시간이 문장 길이보다 짧으면 실시간으로 쓸 수 있는 속도입니다.

### 옵션
```
start_server.bat --batch 8            # VRAM이 부족할 때
start_server.bat --height 480         # 더 빠르게 (해상도 낮춤)
start_server.bat --voice-female ko-KR-SunHiNeural --voice-male ko-KR-InJoonNeural
```

## 5. 학과 GPU 서버 한 대로 함께 쓰기

```
start_server.bat --host 0.0.0.0 --allow-origin https://bctcaiedu.github.io
```

웹 페이지가 **https** 이므로, 브라우저는 다른 PC의 **http** 주소(예: `http://192.168.0.10:8765`) 접속을 막습니다.
서버에 **https 주소**를 붙여야 합니다. 가장 쉬운 방법은 Cloudflare Tunnel입니다.

```
winget install Cloudflare.cloudflared
cloudflared tunnel --url http://127.0.0.1:8765
```
화면에 나오는 `https://xxxx.trycloudflare.com` 주소를 학생들 페이지의 **실사 얼굴 서버 주소**에 넣습니다.
(임시 주소는 실행할 때마다 바뀝니다. 고정 주소가 필요하면 Cloudflare 계정에서 Named Tunnel을 만드세요.)

GPU 한 장은 한 번에 한 문장씩 처리합니다. 동시에 여러 명이 쓰면 그만큼 기다리므로, RTX 4070급 기준 **2~3명 동시 사용**이 적당합니다.

## 6. 서버 API (직접 연동할 때)

| 요청 | 설명 |
|---|---|
| `GET /health` | GPU, 생성 속도(`gen_fps`, `realtime_factor`), 얼굴 준비 상태 |
| `POST /speak` `{"text":"안녕하세요","avatar":"female","rate":1.0}` | 음성이 들어간 mp4 |
| `GET /avatar/{id}/idle.mp4` | 말하지 않을 때 반복 재생할 영상 |
| `POST /avatar/{id}` (multipart `file`) | 새 얼굴 영상/사진 올리기 → 백그라운드 준비 |

## 7. 문제 해결

| 증상 | 해결 |
|---|---|
| `mim install mmcv` 실패 | Python 3.10 + torch 2.0.1 + CUDA 11.8 조합인지 확인. 다른 버전이면 미리 빌드된 mmcv가 없음 |
| `CUDA 사용 가능: False` | NVIDIA 드라이버 업데이트, `venv` 를 지우고 다시 설치 |
| 얼굴을 찾지 못했어요 | 얼굴이 더 크고 정면으로 나온 영상 사용 |
| 음성 합성 실패 | 인터넷 연결 확인 (edge-tts는 Microsoft 온라인 음성 사용) |
| 웹 페이지에서 연결 실패 | 서버 창이 켜져 있는지, 주소/포트가 맞는지, Chrome의 로컬 네트워크 접근을 허용했는지 확인 |
| 말이 끊기거나 늦음 | `--height 480`, `--batch 8` 시도. 서버 창의 영상 생성 시간 확인 |

## 라이선스
- MuseTalk: MIT License (TMElyralab) — https://github.com/TMElyralab/MuseTalk
- 모델 가중치(sd-vae, whisper, dwpose 등)는 각 배포처의 라이선스를 따릅니다.
- edge-tts는 Microsoft Edge의 온라인 음성 서비스를 사용합니다. 수업 · 비상업 용도로 쓰세요.
