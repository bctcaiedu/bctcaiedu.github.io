@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ============================================================
echo  AI 면접관 실사 얼굴 서버 설치 (MuseTalk 1.5)
echo  필요: NVIDIA GPU(RTX 3060 이상 권장), Python 3.10, git, ffmpeg
echo  디스크 약 15GB, 설치 20~40분
echo ============================================================

where git >nul 2>nul || (echo [오류] git 이 없어요. https://git-scm.com 에서 설치하세요. & goto :fail)
where ffmpeg >nul 2>nul || (echo [오류] ffmpeg 가 없어요. README 의 ffmpeg 설치 방법을 보세요. & goto :fail)
py -3.10 --version >nul 2>nul || (echo [오류] Python 3.10 이 없어요. https://www.python.org/downloads/release/python-31011/ & goto :fail)
nvidia-smi >nul 2>nul || echo [경고] nvidia-smi 가 안 보여요. NVIDIA 드라이버를 확인하세요.

if not exist MuseTalk (
  echo [1/6] MuseTalk 내려받기
  git clone https://github.com/TMElyralab/MuseTalk || goto :fail
)

if not exist venv (
  echo [2/6] 파이썬 가상환경 만들기
  py -3.10 -m venv venv || goto :fail
)
call venv\Scripts\activate.bat
python -m pip install --upgrade pip

echo [3/6] PyTorch 2.0.1 (CUDA 11.8) 설치
pip install torch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 --index-url https://download.pytorch.org/whl/cu118 || goto :fail

echo [4/6] MuseTalk 패키지 설치
pip install -r MuseTalk\requirements.txt || goto :fail
pip install --no-cache-dir -U openmim || goto :fail
mim install mmengine || goto :fail
mim install "mmcv==2.0.1" || goto :fail
mim install "mmdet==3.1.0" || goto :fail
mim install "mmpose==1.1.0" || goto :fail
pip install -r requirements-server.txt || goto :fail
pip install "huggingface_hub[hf_xet]>=0.34,<1.0" || goto :fail

echo [5/6] 모델 가중치 내려받기 (약 6GB)
pushd MuseTalk
set M=models
for %%d in (musetalk musetalkV15 syncnet dwpose face-parse-bisent sd-vae whisper) do if not exist %M%\%%d mkdir %M%\%%d
hf download TMElyralab/MuseTalk --local-dir %M% || goto :failpop
hf download stabilityai/sd-vae-ft-mse --local-dir %M%\sd-vae --include "config.json" "diffusion_pytorch_model.bin" || goto :failpop
hf download openai/whisper-tiny --local-dir %M%\whisper --include "config.json" "pytorch_model.bin" "preprocessor_config.json" || goto :failpop
hf download yzd-v/DWPose --local-dir %M%\dwpose --include "dw-ll_ucoco_384.pth" || goto :failpop
hf download ManyOtherFunctions/face-parse-bisent --local-dir %M%\face-parse-bisent --include "79999_iter.pth" "resnet18-5c106cde.pth" || goto :failpop
popd

echo [6/6] 설치 확인
python -c "import torch;print('CUDA 사용 가능:', torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else '')"

echo.
echo 설치 완료! avatars 폴더에 female.mp4 / male.mp4 를 넣고 start_server.bat 을 실행하세요.
pause
exit /b 0

:failpop
popd
:fail
echo.
echo 설치 중 오류가 났어요. 위의 메시지를 확인하세요. (README 의 문제 해결 참고)
pause
exit /b 1
