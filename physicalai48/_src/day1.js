module.exports = {
  day: 1,
  title: '영상 AI의 시작',
  theme: '화면 속 AI가 몸을 갖기 전에, 먼저 눈을 만든다',

  openingNar: `첫째 날입니다. 앞으로 엿새 동안 우리는 하나의 이야기를 따라갑니다. 인공지능에게 눈을 만들어 주고, 가상의 몸을 붙이고, 그 몸이 스스로 움직이는 법을 배우게 하는 이야기입니다. 오늘은 그 첫 단계인 눈입니다. 다만 코드를 치기 전에 십오 분만 큰 그림을 보겠습니다. 피지컬 에이아이가 무엇이고 왜 지금 이 말이 여기저기서 들리는지 알고 시작해야, 앞으로 여러분이 만드는 코드 한 줄 한 줄이 어디에 놓이는 조각인지 보이기 때문입니다.`,

  goals: [
    ['피지컬 AI가 무엇인지를', '인식·판단·행동 세 단어로 설명할 수 있다'],
    ['오픈소스 라이선스의 차이를', 'Apache 2.0과 AGPL-3.0으로 구분할 수 있다'],
    ['실습 환경 세 개를', '가상환경으로 분리해 만들고 검증할 수 있다'],
    ['웹캠 영상을', '읽어서 화면에 띄우고 파일로 저장할 수 있다'],
    ['기초 영상처리를', '흑백 변환과 외곽선 검출로 직접 해 볼 수 있다'],
    ['고전 얼굴검출의 한계를', '실패하는 조건을 만들어 눈으로 확인할 수 있다']
  ],
  goalsNar: `오늘의 목표는 여섯 가지입니다. 앞의 세 가지는 준비입니다. 피지컬 에이아이라는 말의 뜻을 잡고, 우리가 쓸 오픈소스들의 라이선스를 구분하고, 실습 환경을 만듭니다. 뒤의 세 가지가 오늘의 손입니다. 웹캠 영상을 읽어 화면에 띄우고, 흑백과 외곽선으로 바꿔 보고, 마지막으로 얼굴을 찾아봅니다. 특히 마지막 목표를 눈여겨보십시오. 얼굴을 찾는 데 성공하는 것이 아니라 실패하는 조건을 찾는 것이 목표입니다. 그 실패가 내일 배울 욜로의 이유가 되기 때문입니다.`,

  blocks: [
    { time: '09:00–10:50', title: '피지컬 AI 개요', desc: '정의 · 역사 · 현황 · 핵심 기술요소' },
    { time: '11:00–12:50', title: '개발환경 구축', desc: 'Miniconda · 가상환경 3종 · 검증' },
    { time: '13:50–15:40', title: '영상 입출력 기초', desc: '웹캠 · 흑백 · 외곽선 · 스냅샷' },
    { time: '15:50–17:40', title: '고전 얼굴 검출', desc: 'Haar Cascade와 그 한계' }
  ],
  blocksNar: `오늘 하루는 네 블록입니다. 오전 두 블록은 개념과 환경 준비이고, 오후 두 블록은 전부 손으로 하는 실습입니다. 오전에 환경이 제대로 만들어지지 않으면 엿새 내내 발목을 잡습니다. 그래서 두 번째 블록에는 여유를 넉넉히 뒀습니다. 설치가 빨리 끝난 분은 옆 사람을 도와주십시오. 오후에는 웹캠을 켜고 영상을 다루기 시작합니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–10:50', h: '피지컬 AI 개요',
      sub: '코드를 치기 전에, 우리가 무엇을 만들려는지부터 보겠습니다.',
      nar: `첫 번째 블록입니다. 개념 이야기입니다. 지루하게 느껴질 수 있지만 이 십오 분이 엿새의 방향을 잡아 줍니다.` },

    { eb: 'Definition', h: '피지컬 AI란 무엇인가',
      sub: '화면 속에만 있던 인공지능이 몸을 갖고 현실로 나온 것입니다.',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01 · Perception</span><span class="t">인식</span><span class="d">카메라·센서로 주변을 본다. 우리가 오늘부터 이틀 동안 만들 부분입니다.</span></div>
        <div class="card"><span class="n">02 · Decision</span><span class="t">판단</span><span class="d">어떻게 움직일지 스스로 정한다. Day 5의 LLM, Day 6의 강화학습입니다.</span></div>
        <div class="card"><span class="n">03 · Action</span><span class="t">행동</span><span class="d">모터·로봇팔로 실제로 움직인다. Day 3부터 시뮬레이터에서 다룹니다.</span></div>
      </div>
      <div class="bannerG" style="margin-top:2.4cqh">로봇청소기 · 자율주행차 · 공장의 로봇팔 — 전부 이 세 단어의 조합입니다.</div>`,
      foot: '이 세 단어가 엿새 동안 반복해서 돌아옵니다. 오늘 배우는 것은 첫 번째, 인식입니다.',
      nar: `피지컬 에이아이는 세 단어로 정의됩니다. 인식, 판단, 행동입니다. 카메라나 센서로 주변을 보고, 어떻게 움직일지 스스로 정하고, 모터로 실제로 움직입니다. 챗지피티처럼 화면 안에서 글자만 주고받던 인공지능이 몸을 갖고 현실로 나온 것이라고 생각하시면 됩니다. 로봇청소기도, 자율주행차도, 공장의 로봇팔도 전부 이 세 단어의 조합입니다. 우리 과정도 정확히 이 순서로 갑니다. 오늘과 내일은 인식을 만들고, 셋째 날부터 행동을 붙이고, 다섯째와 여섯째 날에 판단을 얹습니다. 오늘 배우는 것은 첫 번째, 인식입니다.` },

    { eb: 'History', h: '피지컬 AI가 걸어온 길',
      body: `<div class="rowlist" style="margin-top:1.2cqh">
        <div class="row"><span class="dot">1</span><span class="t">1960년대</span><span class="d">산업용 로봇 — 정해진 동작을 정확하게 반복. 보지는 못합니다</span></div>
        <div class="row"><span class="dot">2</span><span class="t">1990~2000년대</span><span class="d">센서와 컴퓨터비전 — 로봇이 카메라로 '보기' 시작. 오늘 배울 Haar가 이 시대의 기술입니다</span></div>
        <div class="row"><span class="dot">3</span><span class="t">2012년~</span><span class="d">딥러닝 혁명 — 이미지 인식 능력이 폭발. 내일 배울 YOLO가 여기서 나옵니다</span></div>
        <div class="row"><span class="dot">4</span><span class="t">2020년대~</span><span class="d">파운데이션 모델·휴머노이드 — 말을 이해하고 스스로 판단하는 로봇</span></div>
      </div>`,
      foot: '재미있는 것은, 우리 과정이 이 60년의 역사를 엿새에 압축해 똑같은 순서로 따라간다는 점입니다.',
      nar: `역사를 네 단계로 보겠습니다. 천구백육십년대에 산업용 로봇이 나왔습니다. 정해진 동작을 아주 정확하게 반복하지만 보지는 못합니다. 천구백구십년대부터 센서와 컴퓨터비전이 붙으면서 로봇이 주변을 보기 시작합니다. 오늘 오후에 배울 하르 캐스케이드가 바로 이 시대의 기술입니다. 이천십이년부터 딥러닝 혁명이 시작됩니다. 내일 배울 욜로가 여기서 나왔습니다. 그리고 이천이십년대부터는 파운데이션 모델과 휴머노이드의 시대입니다. 흥미로운 것은 우리 과정이 이 육십 년의 역사를 엿새에 압축해서 똑같은 순서로 따라간다는 점입니다.` },

    { eb: 'Now · 2026', h: '지금 무슨 일이 벌어지고 있나',
      sub: '"피지컬 AI의 시대가 왔다 — 모든 제조 기업이 로봇 기업이 된다" (젠슨 황)',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="t">휴머노이드 로봇</span><span class="d">Figure · Agility · 보스턴 다이내믹스 — 연구 단계를 지나 상용화 경쟁으로</span></div>
        <div class="card"><span class="t">로봇 파운데이션 모델</span><span class="d">NVIDIA Cosmos · GR00T 등 '로봇용 두뇌'가 오픈으로 확산</span></div>
        <div class="card"><span class="t">자율주행 · 물류</span><span class="d">창고 자율로봇이 이미 현장에 투입되어 돌아가는 중</span></div>
        <div class="card"><span class="t">엣지 컴퓨팅</span><span class="d">Jetson 같은 소형 고성능 칩으로 AI가 로봇에 직접 탑재</span></div>
      </div>`,
      nar: `지금 현장에서는 네 가지 흐름이 동시에 일어나고 있습니다. 첫째, 휴머노이드 로봇이 연구 단계를 지나 상용화 경쟁에 들어갔습니다. 둘째, 로봇용 두뇌라고 할 수 있는 파운데이션 모델이 오픈으로 풀리고 있습니다. 엔비디아의 코스모스와 그루트가 대표적입니다. 셋째, 자율주행과 물류 창고에는 이미 자율 로봇이 투입되어 돌아가고 있습니다. 넷째, 젯슨 같은 작고 강력한 칩 덕분에 인공지능이 서버가 아니라 로봇 몸체에 직접 올라가기 시작했습니다. 엔비디아 젠슨 황의 말처럼 모든 제조 기업이 로봇 기업이 되는 시기입니다.` },

    { eb: 'Components', h: '피지컬 AI를 이루는 여섯 조각',
      sub: '이 중 다섯 개를 엿새 동안 직접 만져 봅니다.',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">Day 1–2</span><span class="t">인식</span><span class="d">카메라 + 컴퓨터비전 (OpenCV · YOLO · MediaPipe)</span></div>
        <div class="card"><span class="n">Day 5–6</span><span class="t">판단</span><span class="d">LLM · 강화학습으로 행동 계획</span></div>
        <div class="card"><span class="n">Day 3–4</span><span class="t">제어 · 구동</span><span class="d">관절 각도와 역기구학으로 정밀한 움직임</span></div>
        <div class="card"><span class="n">Day 3–6</span><span class="t">시뮬레이션</span><span class="d">가상에서 학습하고 현실로 옮기기 (Sim-to-Real)</span></div>
        <div class="card"><span class="n">Day 6</span><span class="t">엣지 하드웨어</span><span class="d">로봇에 탑재되는 연산 장치 (Jetson 등) — 개념만</span></div>
        <div class="card warn"><span class="n">이 과정 범위 밖</span><span class="t">통신 · 통합 (ROS)</span><span class="d">부품 간 메시지 규약. 별도 과정에서 다룹니다</span></div>
      </div>`,
      nar: `피지컬 에이아이를 부품으로 나누면 여섯 조각입니다. 인식, 판단, 제어와 구동, 시뮬레이션, 엣지 하드웨어, 그리고 로스라고 부르는 통신 규약입니다. 이 중 다섯 개를 엿새 동안 직접 만져 보게 됩니다. 로스만 이 과정의 범위 밖인데, 실제 로봇을 연결할 때 필요한 통신 규약이라 별도 과정에서 다룹니다. 카드 왼쪽 위에 몇째 날에 다루는지 적어 뒀으니 지금 전체 지도를 한 번 눈에 넣어 두십시오.` },

    { section: true, eb: 'Block 2 · 11:00–12:50', h: '개발환경 구축',
      sub: '오늘 여기서 삐끗하면 엿새 내내 고생합니다. 천천히, 확실하게.',
      nar: `두 번째 블록은 환경 구축입니다. 재미없는 시간이지만 가장 중요한 시간이기도 합니다. 여기서 제대로 만들어 두지 않으면 앞으로 엿새 내내 원인 모를 오류에 시달리게 됩니다.` },

    { eb: 'Tools', h: '우리가 쓸 오픈소스 도구들',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">Apache 2.0</span><span class="t">OpenCV</span><span class="d">영상처리의 표준. 1999년 인텔에서 시작, 지금은 비영리 재단이 관리. 상업적 사용 자유</span></div>
        <div class="card warn"><span class="n">AGPL-3.0</span><span class="t">YOLO (Ultralytics)</span><span class="d">실시간 객체 검출 대표 모델. 상업 제품에 쓰려면 소스 공개 또는 유료 라이선스</span></div>
        <div class="card"><span class="n">Apache 2.0</span><span class="t">MediaPipe</span><span class="d">구글의 온디바이스 인식 프레임워크. 폐쇄소스 앱에도 사용 가능</span></div>
        <div class="card"><span class="n">Apache 2.0</span><span class="t">MuJoCo</span><span class="d">구글 딥마인드의 물리 엔진. Day 3부터 사용</span></div>
        <div class="card"><span class="n">MIT</span><span class="t">Stable-Baselines3</span><span class="d">검증된 강화학습 알고리즘 모음. Day 5–6</span></div>
        <div class="card"><span class="n">개별 EULA</span><span class="t">NVIDIA Isaac Sim</span><span class="d">실사급 시뮬레이터. 무료지만 오픈소스는 아닙니다. Day 6</span></div>
      </div>`,
      foot: '카드 왼쪽 위의 라이선스를 보세요. 회사에서 쓸 때 문제가 되는 것은 YOLO 하나입니다.',
      nar: `우리가 쓸 도구는 여섯 개입니다. 여기서 꼭 짚고 넘어갈 것이 라이선스입니다. 오픈씨브이, 미디어파이프, 무조코는 전부 아파치 이점영 라이선스입니다. 상업적으로 써도 되고 소스를 공개할 의무도 없습니다. 그런데 욜로는 다릅니다. 에이지피엘 삼점영이라서 여러분 회사 제품에 넣으면 그 제품의 소스를 전부 공개하거나, 울트라리틱스에 돈을 내고 상용 라이선스를 사야 합니다. 수업이나 연구에서는 아무 문제가 없지만, 나중에 실무에 가져갈 때 이 차이를 기억하셔야 합니다. 아이작 심은 무료로 쓸 수 있지만 오픈소스는 아니라는 점도 알아 두십시오.` },

    { eb: 'Why Windows', h: '왜 네이티브 Windows로 하나',
      sub: '4일차와 5일차에 웹캠을 씁니다. WSL은 웹캠에 직접 접근할 수 없습니다.',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="t">네이티브 Windows → 이 과정의 표준</span><span class="d">웹캠 바로 사용 · 시뮬레이터와 카메라를 한 곳에서 · 설치가 가장 단순</span></div>
        <div class="card warn"><span class="t">WSL / Docker → 심화·선택</span><span class="d">리눅스 환경과 재현성은 장점이지만 카메라 실습에 제약이 큽니다</span></div>
      </div>
      <div class="banner" style="margin-top:2.4cqh">WSL·Docker는 개념만 훑고 넘어갑니다. 실습은 전부 네이티브 Windows에서 진행합니다.</div>`,
      nar: `이 과정은 전부 네이티브 윈도우에서 진행합니다. 이유는 하나입니다. 웹캠 때문입니다. 리눅스 환경인 더블유에스엘에서는 윈도우에 붙은 웹캠에 직접 접근할 수 없습니다. 오늘 오후부터 다섯째 날까지 계속 웹캠을 쓰기 때문에 네이티브로 갑니다. 더블유에스엘과 도커가 나쁘다는 뜻은 아닙니다. 리눅스 환경을 그대로 쓸 수 있고 환경 재현성이 좋아서 팀 배포나 서버에는 훨씬 유리합니다. 다만 카메라 실습에는 맞지 않아서, 오늘은 개념만 훑고 넘어가겠습니다.` },

    { eb: 'Environments', h: '가상환경 세 개를 만듭니다',
      sub: '섞으면 반드시 충돌합니다. 파이썬 버전이 다르기 때문입니다.',
      body: `<pre style="margin-top:1.4cqh"><span class="c"># (1) physicalai — Day 1~5 메인 (영상AI + MuJoCo + LLM)</span>
<span class="p">$</span> conda create -n physicalai python=3.10 -y
<span class="p">$</span> conda activate physicalai
<span class="p">$</span> pip install opencv-python ultralytics mediapipe numpy mujoco robot_descriptions

<span class="c"># (2) rl — Day 5~6 강화학습</span>
<span class="p">$</span> conda create -n rl python=3.11 -y
<span class="p">$</span> pip install "gymnasium[mujoco]" "stable-baselines3[extra]" moviepy

<span class="c"># (3) isaac — Day 6 Isaac Sim (GPU 필요)</span>
<span class="p">$</span> conda create -n isaac python=3.11 -y
<span class="p">$</span> pip install "isaacsim[all]" --extra-index-url https://pypi.nvidia.com</pre>`,
      foot: 'MediaPipe는 Python 3.9~3.11만 지원합니다. 그래서 메인 환경을 3.10으로 고정합니다.',
      nar: `가상환경을 세 개 만듭니다. 첫 번째 피지컬에이아이는 오늘부터 다섯째 날까지 쓰는 메인 환경입니다. 파이썬 삼점십으로 만듭니다. 두 번째 알엘은 강화학습용이고 파이썬 삼점십일입니다. 세 번째 아이작은 여섯째 날 아이작 심 전용입니다. 왜 굳이 나누느냐고 물으실 수 있는데, 파이썬 버전 요구사항이 서로 다르기 때문입니다. 특히 미디어파이프는 삼점구에서 삼점십일까지만 지원합니다. 그래서 메인 환경을 삼점십으로 고정하는 것입니다. 한 환경에 다 넣으면 반드시 충돌이 납니다.` },

    { section: true, eb: 'Block 3 · 13:50–15:40', h: '영상 입출력 기초',
      sub: '이제 웹캠을 켭니다. 여기서부터 손으로 합니다.',
      nar: `세 번째 블록입니다. 이제부터 실습입니다. 웹캠을 켜고 영상을 다루기 시작합니다.` },

    { eb: 'Concept', h: '영상은 사진의 연속입니다',
      sub: '열고 · 계속 읽고 · 보여준다. 모든 영상 프로그램이 이 세 줄입니다.',
      body: `<div class="stack" style="margin-top:1.6cqh">
        <div class="lay"><b>① 열기</b><span>VideoCapture(0) — 카메라를 연다. 0은 첫 번째 카메라</span></div>
        <div class="lay" style="background:var(--soft)"><b>② 읽기</b><span>cap.read() — 프레임 한 장을 가져온다. 성공 여부와 이미지를 함께 돌려줍니다</span></div>
        <div class="lay" style="background:var(--soft)"><b>③ 보여주기</b><span>imshow() — 창에 띄운다. 이 셋을 while로 감싸면 '영상'이 됩니다</span></div>
        <div class="lay" style="background:var(--sand);border-color:#E7CDBF"><b>④ 닫기</b><span>release() — 카메라를 놓아준다. 빼먹으면 다음 실행에서 안 열립니다</span></div>
      </div>`,
      foot: '이 루프가 초당 몇 바퀴 도느냐가 FPS입니다. 처리를 무겁게 하면 이 숫자가 떨어집니다.',
      nar: `영상이라는 것은 결국 사진의 연속입니다. 그래서 프로그램 구조도 단순합니다. 카메라를 열고, 사진 한 장을 읽고, 화면에 보여주고, 이걸 계속 반복합니다. 비디오캡처 괄호 영에서 영은 첫 번째 카메라라는 뜻입니다. 캠 리드는 두 가지를 돌려주는데 하나는 성공했는지 여부이고 하나는 실제 이미지입니다. 성공 여부를 확인하지 않고 바로 쓰면 카메라가 잠깐 끊겼을 때 프로그램이 죽습니다. 마지막에 릴리즈로 카메라를 놓아주는 것도 중요합니다. 이걸 빼먹으면 다음 번에 실행할 때 카메라가 안 열립니다. 그리고 이 루프가 일 초에 몇 바퀴 도는지가 에프피에스입니다.` },

    { eb: 'Code · vlab1', h: '웹캠 열고 보여주기',
      sub: 'python vlab1_webcam_preview.py',
      body: `<pre style="margin-top:1.4cqh"><span class="c">import</span> cv2

cap = cv2.VideoCapture(0)             <span class="c"># 웹캠 열기</span>

<span class="c">while</span> True:
    ok, frame = cap.read()            <span class="c"># 프레임 읽기 (ok = 성공 여부)</span>
    <span class="c">if not</span> ok: <span class="c">break</span>
    cv2.imshow("cam", frame)          <span class="c"># 화면에 표시</span>
    <span class="c">if</span> cv2.waitKey(1) == ord('q'):  <span class="c"># q 로 종료</span>
        <span class="c">break</span>

cap.release(); cv2.destroyAllWindows()</pre>
      <div class="bannerG" style="margin-top:2cqh">키 전환 — 1 원본 · 2 흑백 · 3 외곽선(Canny) · s 스냅샷 저장 · q 종료</div>`,
      nar: `실제 코드는 열 줄이 채 안 됩니다. 임포트 씨브이투로 오픈씨브이를 불러오고, 비디오캡처로 카메라를 열고, 무한 루프를 돌면서 읽고 보여주는 것이 전부입니다. 웨이트키 괄호 일은 일 밀리초만 키 입력을 기다리라는 뜻인데, 사실 이 줄이 없으면 창이 아예 안 뜹니다. 화면을 갱신하는 역할도 겸하기 때문입니다. 오늘 실습 스크립트에는 키 전환이 붙어 있습니다. 숫자 일이 원본, 이가 흑백, 삼이 외곽선이고, 에스를 누르면 스냅샷이 저장됩니다.` },

    { eb: 'Canny', h: '외곽선은 밝기가 급하게 변하는 곳입니다',
      sub: '숫자 두 개로 민감도를 조절합니다. 오늘 여러분이 직접 만져 볼 첫 번째 파라미터입니다.',
      body: `<pre style="margin-top:1.4cqh">gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
edge = cv2.Canny(gray, <span class="p">80</span>, <span class="p">160</span>)
<span class="c">#                     ↑낮은 임계값  ↑높은 임계값</span></pre>
      <div class="grid g3" style="margin-top:2cqh">
        <div class="card"><span class="n">30, 60</span><span class="t">선이 너무 많다</span><span class="d">노이즈까지 전부 선으로 잡힙니다</span></div>
        <div class="card"><span class="n">80, 160</span><span class="t">기본값</span><span class="d">대체로 무난한 출발점</span></div>
        <div class="card"><span class="n">200, 400</span><span class="t">선이 거의 없다</span><span class="d">아주 강한 경계만 남습니다</span></div>
      </div>`,
      foot: '정답은 없습니다. 조명과 대상에 따라 매번 다릅니다 — 이것이 고전 방식의 본질적 약점입니다.',
      nar: `외곽선 검출은 밝기가 급하게 변하는 지점을 찾는 일입니다. 캐니 함수에 숫자를 두 개 넣는데 이게 임계값입니다. 낮게 주면 작은 변화까지 전부 선으로 잡혀서 화면이 지저분해지고, 높게 주면 아주 강한 경계만 남아서 선이 거의 사라집니다. 실습 시간에 이 숫자를 직접 바꿔 보십시오. 그리고 여기서 중요한 것을 하나 느끼셔야 합니다. 이 숫자에는 정답이 없습니다. 조명이 바뀌면 다시 맞춰야 하고, 대상이 바뀌면 또 다시 맞춰야 합니다. 사람이 일일이 숫자를 조절해 줘야 한다는 것, 이것이 고전 영상처리의 본질적인 약점입니다. 내일 배울 딥러닝은 이 숫자를 데이터에서 알아서 찾아냅니다.` },

    { section: true, eb: 'Block 4 · 15:50–17:40', h: '고전 얼굴 검출',
      sub: '오늘 마지막 블록의 목표는 성공이 아니라 실패를 찾는 것입니다.',
      nar: `마지막 블록입니다. 얼굴을 찾아봅니다. 그런데 오늘 이 블록의 진짜 목표는 얼굴을 잘 찾는 것이 아니라, 못 찾는 상황을 만들어 보는 것입니다.` },

    { eb: 'Haar Cascade', h: '규칙으로 얼굴을 찾는 방식',
      sub: '2001년에 나온 기술입니다. 딥러닝 이전 시대의 표준이었습니다.',
      body: `<pre style="margin-top:1.4cqh">xml = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
face = cv2.CascadeClassifier(xml)          <span class="c"># 학습된 검출기 불러오기</span>

gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
faces = face.detectMultiScale(gray, <span class="p">1.1</span>, <span class="p">5</span>)
<span class="c">#                                  ↑scaleFactor  ↑minNeighbors</span>

<span class="c">for</span> (x, y, w, h) <span class="c">in</span> faces:
    cv2.rectangle(frame, (x,y), (x+w,y+h), (0,200,0), 2)</pre>
      <div class="grid g2" style="margin-top:2cqh">
        <div class="card"><span class="n">scaleFactor</span><span class="t">1.1</span><span class="d">이미지를 조금씩 줄여가며 여러 크기의 얼굴을 찾습니다. 작을수록 정밀하고 느립니다</span></div>
        <div class="card"><span class="n">minNeighbors</span><span class="t">5</span><span class="d">몇 번 이상 겹쳐 검출되어야 진짜로 인정할지. 낮추면 오검출↑, 높이면 누락↑</span></div>
      </div>`,
      nar: `하르 캐스케이드는 이천일년에 나온 방식입니다. 눈 주변은 어둡고 광대뼈는 밝다, 같은 밝기 패턴 규칙을 수천 개 쌓아 올려서 얼굴을 찾습니다. 오픈씨브이에 이미 학습된 파일이 들어 있어서 우리는 불러다 쓰기만 하면 됩니다. 중요한 것은 디텍트멀티스케일에 넘기는 숫자 두 개입니다. 스케일팩터는 이미지를 조금씩 줄여 가면서 여러 크기의 얼굴을 찾는 비율입니다. 민네이버스는 같은 자리에서 몇 번 이상 겹쳐서 검출되어야 진짜 얼굴로 인정할지를 정합니다. 이 값을 낮추면 얼굴이 아닌 것도 얼굴이라고 하고, 높이면 진짜 얼굴을 놓칩니다. 여기서도 사람이 숫자를 맞춰야 하는군요.` },

    { eb: 'The Point', h: '일부러 실패시켜 보세요',
      sub: '이 네 가지 상황에서 검출이 무너집니다. 직접 만들어 보십시오.',
      body: `<div class="rowlist" style="margin-top:1.2cqh">
        <div class="row"><span class="dot">1</span><span class="t">옆얼굴</span><span class="d">정면 얼굴로만 학습된 분류기입니다. 90도 돌리면 거의 못 찾습니다</span></div>
        <div class="row"><span class="dot">2</span><span class="t">기울인 얼굴</span><span class="d">고개를 45도 기울이면 사라집니다. 회전에 취약합니다</span></div>
        <div class="row"><span class="dot">3</span><span class="t">어두운 조명</span><span class="d">밝기 패턴에 의존하므로 조명이 바뀌면 규칙이 깨집니다</span></div>
        <div class="row"><span class="dot">4</span><span class="t">얼굴이 아닌 것</span><span class="d">사람·자동차·컵은 아예 찾을 수 없습니다. 얼굴 전용이니까요</span></div>
      </div>
      <div class="banner" style="margin-top:2cqh">네 번째가 가장 중요합니다 — 이 검출기는 오직 '정면 얼굴' 하나만 압니다.</div>`,
      foot: '내일 배울 YOLO는 사람·자동차·병·컵 등 80종을 한 번에, 옆모습이어도 찾아냅니다.',
      nar: `실습하실 때 일부러 실패를 만들어 보십시오. 네 가지입니다. 첫째, 고개를 옆으로 돌려 보세요. 정면 얼굴로만 학습된 분류기라 거의 못 찾습니다. 둘째, 고개를 사십오도 기울여 보세요. 역시 사라집니다. 셋째, 조명을 어둡게 해 보세요. 밝기 패턴에 의존하는 방식이라 규칙이 깨집니다. 그리고 네 번째가 가장 중요합니다. 이 검출기는 오직 정면 얼굴 하나만 압니다. 컵이나 자동차는 아예 찾을 수가 없습니다. 이 네 가지 한계를 몸으로 느끼고 퇴근하시면, 내일 욜로를 배울 때 왜 이게 혁명이었는지 바로 이해하실 겁니다. 욜로는 팔십 종류의 물체를 한 번에, 옆모습이어도 찾아냅니다.` }
  ],

  assignment: {
    title: '환경 검증 보고서와 실패 사례 수집',
    lede: '설치가 제대로 끝났음을 증명하고, 오늘 만든 실패 장면을 증거로 남깁니다.',
    subtitle: '각 항목마다 실행 화면 캡처와 사용한 명령을 함께 붙일 것',
    items: [
      'conda env list 출력 캡처 (환경 3개 확인)',
      'import 검증 스크립트 실행 결과',
      '웹캠 스냅샷 3장 (원본 · 흑백 · 외곽선)',
      'Canny 임계값 3종 비교 캡처',
      'Haar 얼굴검출 성공 1장 + 실패 3장',
      '실패 3장 각각에 "왜 실패했는지" 한 줄 설명'
    ],
    note: '5번과 6번이 핵심입니다. 실패 장면을 많이 모아 온 사람이 내일 수업을 가장 잘 따라옵니다. 어떤 각도·조명에서 무너졌는지 구체적으로 적으세요.',
    sample: `<span class="o">학번 / 이름 : 20261234 / 홍길동

5-2. 실패 사례 (옆얼굴)
     상황 : 고개를 오른쪽으로 약 70도 회전
     결과 : 검출된 얼굴 0개 (정면에서는 1개)
     이유 : 정면 얼굴 패턴으로만 학습되어 측면 윤곽에 규칙이 맞지 않음</span>`,
    nar: `오늘의 과제입니다. 여섯 항목인데 앞의 네 개는 환경이 제대로 만들어졌다는 증거입니다. 콘다 환경 목록, 임포트 검증 결과, 웹캠 스냅샷 세 장, 캐니 임계값 비교입니다. 그리고 다섯 번째와 여섯 번째가 오늘의 진짜 과제입니다. 얼굴 검출이 성공한 장면 하나와 실패한 장면 세 개를 모아 오시고, 각각 왜 실패했는지 한 줄씩 적어 주십시오. 실패 장면을 많이 모아 온 분이 내일 수업을 가장 잘 따라옵니다. 어떤 각도였는지, 조명이 어땠는지 구체적으로 적으시면 좋습니다.` },

  wrap: {
    done: '피지컬 AI의 지도를 그리고, 환경을 만들고, 영상을 읽어 얼굴을 찾았습니다. 그리고 그 방법이 무너지는 지점까지 확인했습니다.',
    next: '내일 · Day 2 — 딥러닝 검출과 랜드마크',
    nextDesc: '오늘 무너진 그 자리에서 YOLO가 시작됩니다. 80종을 한 번에 찾고, MediaPipe로 손가락 관절까지 추적한 뒤, 내 데이터로 모델을 직접 학습시킵니다.',
    nar: `오늘 한 일을 정리하겠습니다. 피지컬 에이아이가 인식과 판단과 행동으로 이루어진다는 지도를 그렸고, 실습 환경 세 개를 만들었고, 웹캠 영상을 읽어 흑백과 외곽선으로 바꿔 봤고, 하르 캐스케이드로 얼굴을 찾았습니다. 그리고 그 방법이 어디서 무너지는지까지 확인했습니다. 내일은 바로 그 무너진 자리에서 시작합니다. 욜로가 팔십 종류의 물체를 한 번에 찾아내는 것을 보고, 미디어파이프로 손가락 관절 스물한 개를 추적하고, 마지막에는 여러분의 데이터로 모델을 직접 학습시킵니다. 수고하셨습니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '영상 AI의 시작',
    standfirst: '오늘은 두 가지를 손에 넣습니다. 엿새 동안 쓸 실습 환경, 그리고 웹캠 영상을 읽어 다루는 기본기입니다. 마지막 미션의 목표는 "잘 되게 하기"가 아니라 "안 되게 만들어 보기"입니다. 순서대로 쌓이니 건너뛰지 마세요.',
    rules: [
      ['환경부터 확실히', '설치가 애매한 채로 다음으로 넘어가지 마세요. 오늘의 애매함은 내일 원인 모를 오류로 돌아옵니다.'],
      ['예상하고 실행한다', '숫자를 바꾸기 전에 어떻게 달라질지 먼저 말해 보고 확인하세요. 이 습관이 학습 속도를 두 배로 만듭니다.'],
      ['실패를 기록한다', '안 되는 장면은 캡처해서 남기세요. 오늘의 실패가 내일 배울 기술의 이유가 됩니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '실습 환경 만들기', time: '11:00–12:50',
        lede: 'Anaconda Prompt를 열고 시작합니다. PowerShell이 아니라 Anaconda Prompt입니다.',
        missions: [
          { n: 1, h: 'Miniconda 설치 확인', body: `
      <p>시작 메뉴에서 <strong>Anaconda Prompt</strong>를 검색해 실행합니다. 프롬프트 맨 앞에 <code>(base)</code>가 보이면 정상입니다.</p>
      <pre><span class="p">$</span> conda --version
<span class="o">conda 24.x.x</span>
<span class="p">$</span> python --version
<span class="o">Python 3.x.x</span></pre>
      <div class="box warn"><span class="lbl">(base)가 안 보이면</span>
        <p>PowerShell이나 일반 CMD를 연 것입니다. 시작 메뉴에서 <strong>Anaconda Prompt</strong>를 다시 찾으세요. Miniconda 자체가 없으면 지금 설치합니다.</p></div>` },

          { n: 2, h: '메인 환경 physicalai 만들기', body: `
      <p>앞으로 5일 동안 가장 많이 쓸 환경입니다. 설치에 3~5분 걸립니다.</p>
      <pre><span class="p">$</span> conda create -n physicalai python=3.10 -y
<span class="p">$</span> conda activate physicalai
<span class="p">$</span> pip install opencv-python ultralytics mediapipe numpy</pre>
      <div class="box check"><span class="lbl">왜 3.10인가</span>
        <p>MediaPipe가 Python 3.9~3.11만 지원하기 때문입니다. 3.12 이상에서는 <code>pip install mediapipe</code>가 실패합니다.</p></div>
      <div class="box warn"><span class="lbl">headless 주의</span>
        <p>반드시 <code>opencv-python</code>입니다. <code>opencv-python-headless</code>를 설치하면 창이 안 뜨고 얼굴 검출용 Haar 파일도 들어 있지 않습니다.</p></div>` },

          { n: 3, h: '설치 검증 — 두 가지를 확인합니다', body: `
      <pre><span class="c"># ① 라이브러리가 제대로 올라왔는지</span>
<span class="p">$</span> python -c "import cv2, ultralytics, mediapipe, numpy; print('설치 완료!')"
<span class="o">설치 완료!</span>

<span class="c"># ② 웹캠이 잡히는지</span>
<span class="p">$</span> python -c "import cv2; c=cv2.VideoCapture(0); print('카메라 OK' if c.isOpened() else '카메라 실패'); c.release()"
<span class="o">카메라 OK</span></pre>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p><code>c.release()</code>를 빼고 실행하면 어떻게 될까요? 실제로 빼고 두 번 연속 실행해 보세요.</p></div>` },

          { n: 4, h: '나머지 환경 두 개 만들기', body: `
      <p>Day 5~6에 쓸 환경입니다. 지금 만들어 두면 그날 시간을 아낄 수 있습니다. 설치가 오래 걸리니 걸어두고 다음 미션으로 넘어가세요.</p>
      <pre><span class="p">$</span> conda create -n rl python=3.11 -y
<span class="p">$</span> conda activate rl
<span class="p">$</span> pip install "gymnasium[mujoco]" "stable-baselines3[extra]" moviepy
<span class="p">$</span> python -c "import gymnasium, mujoco, stable_baselines3; print('RL OK')"
<span class="o">RL OK</span>

<span class="p">$</span> conda activate physicalai      <span class="c"># 메인 환경으로 돌아오기</span>
<span class="p">$</span> conda env list                 <span class="c"># 만들어진 환경 전체 확인</span></pre>
      <div class="box check"><span class="lbl">지금 상태</span>
        <p><code>conda env list</code>에 <code>base</code> · <code>physicalai</code> · <code>rl</code> 세 개가 보여야 합니다. <code>isaac</code> 환경은 Day 6에 만듭니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '웹캠 영상 다루기', time: '13:50–15:40',
        lede: '실습 폴더로 이동한 뒤 진행합니다. 영상 창을 클릭하고 q 를 누르면 종료됩니다.',
        missions: [
          { n: 5, h: '첫 실행 — 영상이 뜨는지 확인', body: `
      <pre><span class="p">$</span> conda activate physicalai
<span class="p">$</span> cd 영상AI실습폴더경로
<span class="p">$</span> python vlab1_webcam_preview.py</pre>
      <p>창이 뜨고 본인 얼굴이 보이면 성공입니다. <strong>키를 눌러 가며</strong> 확인하세요.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">1</span><span class="v">원본 영상<small>카메라가 보내주는 그대로</small></span></div>
        <div class="dlrow"><span class="k">2</span><span class="v">흑백 변환<small>색 정보를 버리고 밝기만 남깁니다</small></span></div>
        <div class="dlrow"><span class="k">3</span><span class="v">외곽선 (Canny)<small>밝기가 급하게 변하는 지점만 흰 선으로</small></span></div>
        <div class="dlrow"><span class="k">s</span><span class="v">스냅샷 저장<small>현재 프레임을 파일로</small></span></div>
        <div class="dlrow"><span class="k">q</span><span class="v">종료<small>영상 창을 클릭한 상태에서 눌러야 합니다</small></span></div>
      </div>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>화면 구석의 FPS 숫자를 보세요. <strong>1번(원본)</strong>일 때와 <strong>3번(외곽선)</strong>일 때 숫자가 달라지나요? 왜 그럴까요?</p></div>` },

          { n: 6, h: '코드를 열고 구조 확인하기', body: `
      <p>메모장이든 VS Code든 좋습니다. <code>vlab1_webcam_preview.py</code>를 열고 <strong>네 곳</strong>을 찾으세요.</p>
      <div class="box q"><span class="lbl">찾을 것</span><ul>
        <li><code>VideoCapture</code> — 카메라를 여는 줄</li>
        <li><code>while</code> — 반복이 시작되는 줄</li>
        <li><code>imshow</code> — 화면에 그리는 줄</li>
        <li><code>release</code> — 카메라를 놓아주는 줄</li>
      </ul></div>
      <p>이 네 줄이 <strong>모든</strong> 영상 프로그램의 뼈대입니다. 내일 배울 YOLO도, 5일차의 ArUco도 전부 이 구조 안에 들어갑니다.</p>` },

          { n: 7, h: 'Canny 임계값 바꿔 보기 ★', body: `
      <p>코드에서 <code>cv2.Canny(gray, 80, 160)</code>를 찾습니다. 숫자를 바꾸고 저장한 뒤 다시 실행합니다.</p>
      <pre>cv2.Canny(gray, <span class="o">30</span>, <span class="o">60</span>)      <span class="c"># 선이 너무 많아진다</span>
cv2.Canny(gray, <span class="o">80</span>, <span class="o">160</span>)     <span class="c"># 기본값</span>
cv2.Canny(gray, <span class="o">200</span>, <span class="o">400</span>)    <span class="c"># 선이 거의 사라진다</span></pre>
      <p>세 가지 모두 <strong>스냅샷을 저장</strong>하세요. 과제 제출물입니다.</p>
      <div class="box check"><span class="lbl">오늘 꼭 느껴야 할 것</span>
        <p>조명을 바꾸면(형광등을 끄거나 창가로 가면) 방금 맞춘 숫자가 다시 안 맞습니다. <strong>사람이 매번 숫자를 조정해야 한다</strong> — 이것이 고전 영상처리의 한계이고, 내일 딥러닝을 배우는 이유입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '얼굴 검출과 그 한계', time: '15:50–17:40',
        lede: '오늘 마지막입니다. 성공시키는 데 5분, 실패시키는 데 나머지 시간을 쓰세요.',
        missions: [
          { n: 8, h: '얼굴 찾기 실행', body: `
      <pre><span class="p">$</span> python vlab2_face_detect.py              <span class="c"># 웹캠</span>
<span class="p">$</span> python vlab2_face_detect.py photo.jpg    <span class="c"># 사진 파일</span></pre>
      <p>정면을 보면 얼굴에 사각형이 그려지고, 얼굴 안에서 <strong>눈</strong>도 따로 검출됩니다. 화면에 검출된 얼굴 개수가 표시됩니다.</p>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>여러 사람이 함께 화면에 들어가면 개수가 맞게 올라가나요? 안경을 쓴 사람은 눈 검출이 어떻게 되나요?</p></div>` },

          { n: 9, h: 'minNeighbors 바꿔 보기', body: `
      <p>코드에서 <code>detectMultiScale(gray, 1.1, 5)</code>의 마지막 숫자를 바꿉니다.</p>
      <pre>detectMultiScale(gray, 1.1, <span class="o">3</span>)     <span class="c"># 느슨하게</span>
detectMultiScale(gray, 1.1, <span class="o">8</span>)     <span class="c"># 엄격하게</span></pre>
      <div class="dl">
        <div class="dlrow"><span class="k">3으로</span><span class="v">얼굴이 아닌 곳에도 사각형이 생깁니다<small>오검출(false positive) 증가</small></span></div>
        <div class="dlrow"><span class="k">8으로</span><span class="v">진짜 얼굴인데 사각형이 안 생깁니다<small>누락(false negative) 증가</small></span></div>
      </div>
      <div class="box check"><span class="lbl">트레이드오프</span>
        <p>둘 다 좋게 만드는 값은 없습니다. <strong>무엇을 더 싫어하는가</strong>로 정해야 합니다. 출입 통제라면 오검출이 위험하고, 실종자 탐색이라면 누락이 위험합니다.</p></div>` },

          { n: 10, h: '무너뜨리기 ★ 오늘의 핵심', body: `
      <p>검출이 실패하는 상황을 <strong>직접 만들고 캡처</strong>하세요. 최소 3장이 과제입니다.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">시도 1</span><span class="v">고개를 옆으로 70~90도 돌린다<small>정면 얼굴로만 학습된 분류기입니다</small></span></div>
        <div class="dlrow"><span class="k">시도 2</span><span class="v">고개를 45도 기울인다<small>회전에 대응하지 못합니다</small></span></div>
        <div class="dlrow"><span class="k">시도 3</span><span class="v">조명을 끄거나 역광에 선다<small>밝기 패턴에 의존하는 방식이라 무너집니다</small></span></div>
        <div class="dlrow"><span class="k">시도 4</span><span class="v">손으로 얼굴 절반을 가린다<small>부분 가림(occlusion)에 약합니다</small></span></div>
        <div class="dlrow"><span class="k">시도 5</span><span class="v">컵·휴대폰·책을 비춰 본다<small>아예 검출 대상이 아닙니다</small></span></div>
      </div>
      <div class="box warn"><span class="lbl">시도 5가 가장 중요합니다</span>
        <p>이 검출기는 <strong>오직 정면 얼굴 하나</strong>만 압니다. 컵을 찾으려면 컵 전용 분류기를 따로 구해야 합니다. 물체 종류마다 검출기를 하나씩 만드는 방식 — 이것이 딥러닝 이전의 세계였습니다.</p></div>
      <div class="box check"><span class="lbl">내일 예고</span>
        <p>내일 배울 YOLO는 사람·자동차·병·컵 등 <strong>80종을 한 번에</strong>, 옆모습이어도, 일부 가려져도 찾아냅니다. 오늘 모은 실패 장면을 내일 그대로 다시 넣어 보겠습니다.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>카메라 실패</code> / 검은 화면', 'Windows 카메라 권한 또는 다른 앱이 점유', '설정 → 개인정보 → 카메라 ON. Zoom·Teams 종료 후 재실행'],
      ['<code>ModuleNotFoundError: cv2</code>', '가상환경이 꺼져 있음', '<code>conda activate physicalai</code> 후 다시 실행'],
      ['창이 떴는데 <code>q</code>로 안 닫힘', '터미널에 포커스가 있음', '<strong>영상 창을 먼저 클릭</strong>하고 q. 안 되면 Ctrl+C'],
      ['얼굴 검출기 로드 실패', 'headless 버전 설치됨', '<code>pip uninstall opencv-python-headless</code> → <code>pip install opencv-python</code>'],
      ['<code>mediapipe</code> 설치 오류', 'Python 3.12 이상', '<code>python=3.10</code>으로 환경을 다시 만드세요'],
      ['두 번째 실행부터 카메라가 안 열림', '앞서 <code>release()</code> 없이 끝냄', '파이썬 프로세스를 완전히 종료 후 재실행. 코드에 release 추가'],
      ['창이 아예 안 뜸 (원격 접속)', '화면 출력이 없는 환경', '원격 데스크톱이 아닌 <strong>로컬 PC</strong>에서 실행']
    ],
    checklist: [
      '피지컬 AI를 <strong>인식·판단·행동</strong> 세 단어로 설명할 수 있다',
      'YOLO(AGPL-3.0)와 OpenCV(Apache 2.0)의 라이선스 차이를 말할 수 있다',
      '<code>conda env list</code>에 <code>physicalai</code>와 <code>rl</code>이 보인다',
      '<code>import cv2, ultralytics, mediapipe</code>가 오류 없이 통과한다',
      '<code>카메라 OK</code>를 확인했다',
      '웹캠 영상을 원본 · 흑백 · 외곽선으로 전환했다',
      'Canny 임계값 3종을 바꿔 보고 스냅샷을 저장했다',
      '<code>VideoCapture → read → imshow → release</code> 네 줄을 코드에서 찾았다',
      'Haar로 얼굴을 검출하고 <code>minNeighbors</code> 3과 8의 차이를 확인했다',
      '검출이 <strong>실패하는 장면 3장 이상</strong>을 캡처했고, 이유를 설명할 수 있다'
    ]
  },

  /* ================= 퀴즈 ================= */
  quizTitle: '피지컬 AI 개요와 영상 기초 퀴즈',
  quiz: [
    { q: '피지컬 AI를 이루는 세 단계를 순서대로 고르면?',
      o: ['인식 → 판단 → 행동', '학습 → 추론 → 배포', '입력 → 저장 → 출력', '설계 → 제작 → 검수'], a: 0,
      e: '센서로 보고(인식), 어떻게 움직일지 정하고(판단), 실제로 움직입니다(행동). 이 과정 전체가 이 순서로 구성되어 있습니다.' },

    { q: '다음 중 <strong>상업 제품에 넣을 때 소스 공개 의무나 유료 라이선스가 필요한</strong> 것은?',
      o: ['Ultralytics YOLO', 'OpenCV', 'MediaPipe', 'MuJoCo'], a: 0,
      e: 'Ultralytics YOLO는 AGPL-3.0 + 상용 이중 라이선스입니다. 나머지 셋은 Apache 2.0이라 상업적 사용이 자유롭습니다. 수업·연구에서는 넷 다 문제없습니다.' },

    { q: '이 과정을 네이티브 Windows에서 진행하는 가장 큰 이유는?',
      o: ['WSL은 웹캠에 직접 접근할 수 없어서', 'WSL에서는 파이썬이 느려서', 'Windows에서만 YOLO가 동작해서', 'conda가 리눅스를 지원하지 않아서'], a: 0,
      e: 'Day 1과 Day 5에서 웹캠을 직접 씁니다. WSL은 윈도우에 연결된 카메라에 직접 접근하지 못합니다. WSL/Docker는 재현성 면에서 장점이 있어 심화 주제로 다룹니다.' },

    { q: '메인 환경을 Python <strong>3.10</strong>으로 고정하는 이유는?',
      o: ['MediaPipe가 3.9~3.11만 지원해서', 'OpenCV가 3.10 전용이라서', 'conda가 3.10만 만들 수 있어서', '3.11부터 numpy가 없어서'], a: 0,
      e: 'MediaPipe의 지원 버전이 가장 좁습니다. 3.12 이상에서는 <code>pip install mediapipe</code>가 실패합니다.' },

    { q: '웹캠을 여는 코드는? (직접 입력 — 첫 번째 카메라)', t: true,
      acc: ['cv2.VideoCapture(0)', 'VideoCapture(0)', 'cap = cv2.VideoCapture(0)'], ans: 'cv2.VideoCapture(0)',
      e: '괄호 안의 0은 첫 번째 카메라라는 뜻입니다. 카메라가 두 대면 1을 넣어 두 번째를 엽니다. 파일 경로를 넣으면 동영상 파일이 열립니다.' },

    { q: '<code>ok, frame = cap.read()</code>에서 <code>ok</code>는 무엇인가요?',
      o: ['프레임을 정상적으로 읽었는지 여부', '남은 프레임 수', '현재 FPS', '카메라 번호'], a: 0,
      e: '읽기 성공 여부입니다. 확인하지 않고 바로 <code>frame</code>을 쓰면 카메라가 잠깐 끊겼을 때 프로그램이 죽습니다.' },

    { q: '<code>cap.release()</code>를 빼먹으면 생기는 대표적인 문제는?',
      o: ['다음 실행에서 카메라가 안 열린다', '영상이 흑백으로 나온다', 'FPS가 올라간다', '스냅샷이 저장되지 않는다'], a: 0,
      e: '카메라를 점유한 채 프로세스가 남아 다음 실행에서 열리지 않습니다. 이 과정에서 가장 자주 나오는 문제 중 하나입니다.' },

    { q: '<code>cv2.waitKey(1)</code>을 지우면 어떻게 되나요?',
      o: ['창이 아예 뜨지 않거나 멈춘다', '더 빨라진다', '키 입력만 안 받는다', '아무 변화 없다'], a: 0,
      e: '키 입력을 기다리는 함수이지만 <strong>화면 갱신</strong>도 이 함수가 처리합니다. 없으면 창이 제대로 그려지지 않습니다.' },

    { q: '<code>cv2.Canny(gray, 80, 160)</code>에서 두 숫자를 <strong>30, 60</strong>으로 낮추면?',
      o: ['노이즈까지 선으로 잡혀 화면이 지저분해진다', '선이 거의 사라진다', '영상이 흑백이 된다', '해상도가 낮아진다'], a: 0,
      e: '임계값이 낮을수록 작은 밝기 변화까지 외곽선으로 인정합니다. 반대로 200, 400으로 올리면 아주 강한 경계만 남습니다.' },

    { q: 'Canny 임계값에 <strong>정답값이 없는</strong> 이유는?',
      o: ['조명과 대상이 바뀌면 매번 다시 맞춰야 해서', '버전마다 의미가 달라서', '카메라 제조사마다 달라서', 'OpenCV의 버그 때문에'], a: 0,
      e: '고전 영상처리의 본질적 한계입니다. 사람이 매번 숫자를 조정해야 합니다. 딥러닝은 이 기준을 데이터에서 스스로 찾아냅니다.' },

    { q: '컬러 영상을 흑백으로 바꾸는 코드는? (직접 입력)', t: true,
      acc: ['cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)', 'cvtColor(frame, cv2.COLOR_BGR2GRAY)', 'cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)'], ans: 'cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)',
      e: 'OpenCV는 RGB가 아니라 <strong>BGR</strong> 순서를 씁니다. 그래서 상수 이름도 COLOR_BGR2GRAY입니다. 나중에 MediaPipe에 넘길 때는 BGR2RGB로 바꿔야 합니다.' },

    { q: 'Haar Cascade는 어느 시대의 기술인가요?',
      o: ['딥러닝 이전, 규칙 기반 컴퓨터비전', '2020년대 파운데이션 모델', '1960년대 산업용 로봇 제어', '강화학습 기반'], a: 0,
      e: '2001년에 발표된 방식입니다. 밝기 패턴 규칙을 쌓아 얼굴을 찾습니다. 오늘 배운 역사 4단계 중 2단계에 해당합니다.' },

    { q: '<code>detectMultiScale</code>의 <code>minNeighbors</code>를 <strong>3으로 낮추면</strong>?',
      o: ['얼굴이 아닌 곳에도 사각형이 생긴다(오검출 증가)', '진짜 얼굴을 더 많이 놓친다', '처리 속도가 느려진다', '흑백 변환이 필요 없어진다'], a: 0,
      e: '몇 번 겹쳐 검출되어야 인정할지의 기준입니다. 낮추면 느슨해져 오검출이 늘고, 높이면 엄격해져 누락이 늡니다. 둘 다 좋게 만드는 값은 없습니다.' },

    { q: 'Haar 얼굴검출이 <strong>실패하지 않는</strong> 상황은?',
      o: ['정면을 보는 밝은 조명의 얼굴', '고개를 90도 돌린 옆얼굴', '45도 기울인 얼굴', '역광으로 어두운 얼굴'], a: 0,
      e: '정면·정자세·밝은 조명이 이 방식이 잘 작동하는 유일한 조건입니다. 나머지 셋은 오늘 실습에서 직접 무너뜨려 봤어야 합니다.' },

    { q: 'Haar 얼굴검출기로 <strong>컵</strong>을 찾으려면?',
      o: ['컵 전용 분류기를 따로 구해야 한다', 'minNeighbors를 낮추면 된다', '흑백 변환을 생략하면 된다', '해상도를 높이면 된다'], a: 0,
      e: '이 검출기는 정면 얼굴 하나만 압니다. 물체 종류마다 검출기를 따로 만드는 방식 — 이것이 내일 배울 YOLO가 해결한 문제입니다.' },

    { q: '<code>opencv-python-headless</code>를 설치하면 안 되는 이유는?',
      o: ['창이 뜨지 않고 Haar 파일도 들어 있지 않다', '유료 버전이다', '파이썬 3.10을 지원하지 않는다', 'YOLO와 충돌한다'], a: 0,
      e: 'headless는 화면 없는 서버용입니다. GUI 창과 <code>cv2.data.haarcascades</code>가 빠져 있어 오늘 실습이 둘 다 안 됩니다.' },

    { q: '외곽선 모드(3번)일 때 FPS가 떨어지는 이유는?',
      o: ['프레임마다 변환·검출 연산이 추가되어서', '카메라 해상도가 자동으로 올라가서', '흑백이 컬러보다 무거워서', '창 크기가 커져서'], a: 0,
      e: '루프 한 바퀴에 하는 일이 늘면 초당 도는 횟수가 줄어듭니다. 앞으로 YOLO를 얹으면 이 차이가 훨씬 크게 벌어집니다.' },

    { q: '오늘 마지막 미션의 <strong>목표</strong>는 무엇이었나요?',
      o: ['검출이 실패하는 조건을 직접 만들어 확인하는 것', '가능한 많은 얼굴을 검출하는 것', 'FPS를 최대로 올리는 것', '가장 좋은 파라미터를 찾는 것'], a: 0,
      e: '오늘의 실패가 내일 YOLO를 배우는 이유가 됩니다. 한계를 몸으로 아는 사람이 다음 기술의 가치를 정확히 이해합니다.' }
  ]
};
