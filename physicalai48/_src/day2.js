module.exports = {
  day: 2,
  title: '딥러닝 검출과 랜드마크',
  theme: '규칙을 사람이 적던 시대에서, 데이터가 규칙을 만드는 시대로',

  openingNar: `둘째 날입니다. 어제 마지막에 여러분은 얼굴 검출을 일부러 실패시켰습니다. 고개를 돌리면 못 찾고, 조명이 어두우면 못 찾고, 컵은 아예 찾지도 못했습니다. 그 이유는 하나였습니다. 사람이 손으로 적은 규칙으로 물체를 찾았기 때문입니다. 오늘은 그 방식을 버립니다. 규칙을 사람이 적는 대신 데이터에서 기계가 찾아내게 합니다. 오전에는 남이 학습시켜 둔 모델을 가져다 쓰고, 오후에는 여러분이 직접 학습을 시킵니다. 오늘 하루가 끝나면 세상에 없던 검출기를 하나 갖게 됩니다.`,

  goals: [
    ['YOLO로 80종의 물체를', '이미지·영상·웹캠에서 검출할 수 있다'],
    ['검출 결과 세 가지를', '클래스·좌표·신뢰도로 코드에서 꺼낼 수 있다'],
    ['MediaPipe 랜드마크를', '손·포즈·얼굴에서 실시간으로 추적할 수 있다'],
    ['랜드마크 좌표를', '각도·개수 같은 의미 있는 값으로 바꿀 수 있다'],
    ['내 데이터로 YOLO를', '라벨링부터 학습·평가까지 직접 돌릴 수 있다'],
    ['나만의 영상 AI 앱을', '한 개 완성해서 시연할 수 있다']
  ],
  goalsNar: `오늘의 목표는 여섯 가지입니다. 앞의 두 개는 욜로입니다. 팔십 종류의 물체를 찾고, 그 결과를 코드에서 꺼내 쓰는 법을 배웁니다. 가운데 두 개는 미디어파이프입니다. 손과 몸과 얼굴의 점을 추적하고, 그 점 좌표로 각도나 개수 같은 의미 있는 값을 계산합니다. 그리고 다섯 번째가 오늘의 고비입니다. 여러분의 데이터로 직접 학습을 시킵니다. 마지막 여섯 번째는 미니 프로젝트인데, 오후 마지막 블록에 앞의 다섯 가지를 조합해서 앱을 하나 만들어 시연하게 됩니다.`,

  blocks: [
    { time: '09:00–10:50', title: 'YOLO 물체 검출', desc: '80종 동시 검출 · 결과 3정보 읽기' },
    { time: '11:00–12:50', title: 'MediaPipe 랜드마크', desc: '손 21점 · 포즈 33점 · 얼굴 468점' },
    { time: '13:50–15:40', title: '커스텀 데이터 학습', desc: '수집 · 라벨링 · 학습 · 평가' },
    { time: '15:50–17:40', title: '미니프로젝트 #1', desc: '나만의 보는 AI 만들고 시연' }
  ],
  blocksNar: `오늘 하루는 네 블록입니다. 오전은 남이 만든 모델을 쓰는 시간이고, 오후는 내가 만드는 시간입니다. 세 번째 블록에서 커스텀 학습을 하는데 여기가 오늘 가장 어렵고 가장 남는 부분입니다. 라벨링이 지루하다고 느끼실 텐데, 그 지루함을 기억해 두십시오. 넷째 날에 시뮬레이터가 그 라벨링을 공짜로 해 주는 것을 보게 됩니다. 마지막 블록은 미니 프로젝트입니다. 완벽하게 만들려 하지 말고 돌아가는 것을 하나 만드십시오.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–10:50', h: 'YOLO 물체 검출',
      sub: '어제 무너진 그 자리에서 시작합니다.',
      nar: `첫 번째 블록입니다. 어제 하르 캐스케이드가 무너진 그 자리에서 시작합니다.` },

    { eb: 'Why Deep Learning', h: '무엇이 달라졌나',
      sub: '규칙을 누가 만드느냐 — 이 하나가 달라졌습니다.',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card warn"><span class="n">어제 · Haar</span><span class="t">사람이 규칙을 적는다</span><span class="d">"눈 주변은 어둡고 광대는 밝다" 같은 밝기 패턴을 사람이 설계. 조건이 바뀌면 사람이 다시 맞춰야 합니다</span></div>
        <div class="card"><span class="n">오늘 · YOLO</span><span class="t">데이터가 규칙을 만든다</span><span class="d">수십만 장의 사진과 정답을 보여주면 모델이 스스로 특징을 찾아냅니다. 옆모습도, 가려진 것도 데이터에 있었으면 찾습니다</span></div>
      </div>
      <div class="bannerG" style="margin-top:2.4cqh">그래서 "얼굴 하나"가 아니라 "80종을 한 번에" 가 가능해집니다.</div>`,
      foot: '대신 대가가 있습니다 — 데이터가 없으면 아무것도 못 합니다. 오후에 이 대가를 직접 치릅니다.',
      nar: `딥러닝이 바꾼 것은 딱 하나입니다. 규칙을 누가 만드느냐입니다. 어제 하르 방식은 사람이 밝기 패턴 규칙을 설계했습니다. 그래서 조건이 조금만 바뀌어도 사람이 다시 손을 봐야 했습니다. 욜로는 반대입니다. 수십만 장의 사진과 정답을 보여주면 모델이 스스로 특징을 찾아냅니다. 옆모습이든 일부가 가려졌든, 학습 데이터에 그런 사례가 있었으면 찾아냅니다. 그래서 얼굴 하나가 아니라 팔십 종류를 한 번에 찾는 것이 가능해집니다. 대신 대가가 있습니다. 데이터가 없으면 아무것도 못 합니다. 오늘 오후에 그 대가를 직접 치르게 됩니다.` },

    { eb: 'YOLO', h: 'You Only Look Once',
      sub: '이미지를 한 번만 보고 모든 물체의 위치와 종류를 동시에 답합니다.',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">History</span><span class="t">v1~v3 → v5·v8·v11</span><span class="d">원저자 Joseph Redmon이 시작, 지금은 Ultralytics가 개발·유지</span></div>
        <div class="card"><span class="n">COCO 80</span><span class="t">사전학습 완료</span><span class="d">사람·자동차·병·컵·노트북 등 80종. 학습 없이 바로 씁니다</span></div>
        <div class="card warn"><span class="n">AGPL-3.0</span><span class="t">라이선스 주의</span><span class="d">상업 제품에 넣으려면 소스 공개 또는 유료 라이선스</span></div>
      </div>
      <div class="chips" style="margin-top:2.4cqh">
        <span class="chip">person</span><span class="chip">car</span><span class="chip">bottle</span><span class="chip">cup</span>
        <span class="chip">laptop</span><span class="chip">cell phone</span><span class="chip">chair</span><span class="chip">book</span>
        <span class="chip">dog</span><span class="chip">… 총 80종</span>
      </div>`,
      nar: `욜로는 유 온리 룩 원스의 줄임말입니다. 이미지를 한 번만 보고 모든 물체의 위치와 종류를 동시에 답한다는 뜻입니다. 예전 방식은 이미지 여기저기를 잘라서 여러 번 검사했는데, 욜로는 한 번에 끝냅니다. 그래서 빠르고 실시간이 됩니다. 원래 조셉 레드먼이라는 연구자가 만들었고 지금은 울트라리틱스라는 회사가 이어받아 개발하고 있습니다. 우리가 쓸 모델은 코코라는 데이터셋으로 이미 학습이 끝나 있어서 팔십 종류를 바로 찾습니다. 다시 한 번 강조하지만 라이선스는 에이지피엘입니다. 수업에서는 문제없지만 회사 제품에 넣을 때는 확인이 필요합니다.` },

    { eb: 'Code · vlab3', h: '세 줄이면 검출이 끝납니다',
      sub: 'python vlab3_yolo_detect.py',
      body: `<pre style="margin-top:1.4cqh"><span class="c">from</span> ultralytics <span class="c">import</span> YOLO

model   = YOLO("yolov8n.pt")        <span class="c"># ① 사전학습 모델 불러오기</span>
results = model(frame)              <span class="c"># ② 검출 실행</span>

<span class="c">for</span> box <span class="c">in</span> results[0].boxes:          <span class="c"># ③ 결과 꺼내기</span>
    name = model.names[int(box.cls[0])]   <span class="c"># 클래스 이름</span>
    xyxy = box.xyxy[0].tolist()           <span class="c"># 상자 좌표 x1,y1,x2,y2</span>
    conf = float(box.conf[0])             <span class="c"># 신뢰도 0~1</span>
    print(name, xyxy, round(conf, 2))

annotated = results[0].plot()       <span class="c"># 상자를 그린 이미지</span></pre>`,
      foot: 'yolov8n.pt 의 n 은 nano — 가장 작고 빠른 모델입니다. s · m · l · x 로 갈수록 정확하지만 느려집니다.',
      nar: `코드는 정말 세 줄입니다. 욜로 괄호 안에 모델 파일 이름을 넣어 불러오고, 모델 괄호 프레임으로 검출을 실행하고, 결과를 반복문으로 꺼냅니다. 결과에서 꺼낼 수 있는 것이 세 가지입니다. 클래스 이름, 상자 좌표, 신뢰도입니다. 이 세 가지를 앞으로 계속 씁니다. 다섯째 날에 로봇이 물체를 집을 때도 여기서 나온 좌표를 씁니다. 그리고 모델 파일 이름 끝의 엔은 나노라는 뜻입니다. 가장 작고 빠른 모델입니다. 에스, 엠, 엘, 엑스로 갈수록 정확해지지만 느려집니다. 웹캠 실시간이면 나노나 에스를 쓰십시오.` },

    { eb: 'Confidence', h: '신뢰도는 확률이 아닙니다',
      sub: '"이 상자 안에 이 물체가 있다고 모델이 얼마나 확신하는가"의 점수입니다.',
      body: `<div class="rowlist" style="margin-top:1.2cqh">
        <div class="row"><span class="dot">↑</span><span class="t">임계값을 높이면 (0.7)</span><span class="d">확실한 것만 남습니다. 놓치는 물체가 늘어납니다</span></div>
        <div class="row"><span class="dot">↓</span><span class="t">임계값을 낮추면 (0.25)</span><span class="d">많이 잡습니다. 엉뚱한 상자도 늘어납니다</span></div>
      </div>
      <div class="banner" style="margin-top:2cqh">어제 minNeighbors 3 ↔ 8 과 똑같은 트레이드오프입니다. 기술이 바뀌어도 이 고민은 남습니다.</div>
      <pre style="margin-top:2cqh">results = model(frame, conf=<span class="p">0.5</span>, classes=[<span class="p">0</span>, <span class="p">39</span>, <span class="p">41</span>])
<span class="c">#                    ↑신뢰도 하한    ↑person, bottle, cup 만</span></pre>`,
      nar: `신뢰도는 확률이 아니라 모델이 얼마나 확신하는지를 나타내는 점수입니다. 영에서 일 사이 값입니다. 임계값을 높게 잡으면 확실한 것만 남지만 놓치는 물체가 늘어나고, 낮게 잡으면 많이 잡지만 엉뚱한 상자도 늘어납니다. 어제 민네이버스를 삼과 팔로 바꿔 봤던 것과 완전히 똑같은 트레이드오프입니다. 기술이 바뀌어도 이 고민은 그대로 남습니다. 그리고 클래시스 옵션으로 원하는 종류만 골라 받을 수도 있습니다. 컵 개수만 세는 앱을 만든다면 컵만 받으면 되겠지요.` },

    { section: true, eb: 'Block 2 · 11:00–12:50', h: 'MediaPipe 랜드마크',
      sub: 'YOLO가 "무엇이 어디에"라면, MediaPipe는 "어떤 모양으로"입니다.',
      nar: `두 번째 블록입니다. 욜로와는 완전히 다른 종류의 인식을 배웁니다.` },

    { eb: 'Difference', h: '상자가 아니라 점입니다',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">YOLO</span><span class="t">무엇이 · 어디에</span><span class="d">"여기에 사람이 있다"는 사각형 하나. 손을 들었는지 앉았는지는 알 수 없습니다</span></div>
        <div class="card"><span class="n">MediaPipe</span><span class="t">어떤 모양으로</span><span class="d">관절 하나하나의 좌표. 자세·제스처·표정을 판정할 수 있습니다</span></div>
      </div>
      <div class="grid g3" style="margin-top:2.4cqh">
        <div class="card"><span class="n">hands</span><span class="t">21점</span><span class="d">손가락 관절. 편 손가락 개수, 가위바위보</span></div>
        <div class="card"><span class="n">pose</span><span class="t">33점</span><span class="d">전신 관절. 스쿼트 판정, 자세 코칭</span></div>
        <div class="card"><span class="n">face</span><span class="t">468점</span><span class="d">얼굴 메시. 눈 깜빡임, 하품, 표정</span></div>
      </div>`,
      foot: 'MediaPipe는 Google이 만들었고 Apache 2.0 — 상용 제품에 그냥 넣어도 됩니다.',
      nar: `욜로와 미디어파이프는 답하는 질문이 다릅니다. 욜로는 무엇이 어디에 있는지를 사각형으로 답합니다. 그런데 사각형만으로는 그 사람이 손을 들었는지 앉아 있는지 알 수가 없습니다. 미디어파이프는 관절 하나하나의 좌표를 점으로 돌려줍니다. 손은 스물한 개, 전신은 서른세 개, 얼굴은 사백육십팔 개입니다. 이 점들이 있으면 자세를 판정하고 제스처를 알아보고 표정까지 읽을 수 있습니다. 참고로 미디어파이프는 구글이 만들었고 아파치 라이선스라서 상용 제품에 그냥 넣어도 됩니다.` },

    { eb: 'Code · vlab4', h: '손 랜드마크 추적',
      sub: 'python vlab4_mediapipe.py hands | pose | face',
      body: `<pre style="margin-top:1.4cqh"><span class="c">import</span> mediapipe <span class="c">as</span> mp, cv2

hands = mp.solutions.hands.Hands(max_num_hands=2)

rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)   <span class="c"># ★ BGR → RGB 변환 필수</span>
res = hands.process(rgb)

<span class="c">if</span> res.multi_hand_landmarks:
    <span class="c">for</span> lm <span class="c">in</span> res.multi_hand_landmarks:
        mp.solutions.drawing_utils.draw_landmarks(
            frame, lm, mp.solutions.hands.HAND_CONNECTIONS)</pre>
      <div class="banner" style="margin-top:2cqh">OpenCV는 BGR, MediaPipe는 RGB — 이 변환을 빼먹으면 인식이 이상해집니다.</div>`,
      foot: '좌표는 0~1로 정규화되어 나옵니다. 픽셀로 쓰려면 화면 폭·높이를 곱하세요.',
      nar: `코드 구조는 욜로와 비슷합니다. 핸즈 객체를 만들고 프로세스에 이미지를 넣으면 랜드마크가 나옵니다. 다만 여기 별표 친 줄을 조심하십시오. 오픈씨브이는 색 순서를 비지알로 쓰는데 미디어파이프는 알지비를 기대합니다. 이 변환을 빼먹으면 오류는 안 나는데 인식이 이상해집니다. 초보자가 가장 많이 걸리는 함정입니다. 그리고 나오는 좌표는 픽셀이 아니라 영에서 일 사이로 정규화된 값입니다. 화면 위치로 쓰려면 폭과 높이를 곱해야 합니다.` },

    { eb: 'From Points to Meaning', h: '점 좌표를 의미로 바꾸기',
      sub: '랜드마크 자체는 숫자일 뿐입니다. 쓸모는 그 다음에 생깁니다.',
      body: `<div class="stack" style="margin-top:1.4cqh">
        <div class="lay"><b>개수 세기</b><span>손가락 끝이 관절보다 위에 있으면 편 것 → 펴진 손가락 개수</span></div>
        <div class="lay" style="background:var(--soft)"><b>각도 계산</b><span>세 점으로 벡터 두 개를 만들어 사이각 → 무릎 각도, 팔꿈치 각도</span></div>
        <div class="lay" style="background:var(--soft)"><b>거리 비율</b><span>눈꺼풀 위아래 거리 ÷ 눈 가로 길이 → 눈 감김 정도(EAR)</span></div>
        <div class="lay" style="background:var(--sand);border-color:#E7CDBF"><b>시간 변화</b><span>위 값이 일정 시간 유지되면 '동작'으로 판정 → 스쿼트 1회, 졸음 경고</span></div>
      </div>`,
      foot: '오후 미니프로젝트는 결국 이 네 가지 중 하나를 고르는 일입니다.',
      nar: `여기가 오늘 오전의 핵심입니다. 랜드마크 자체는 그냥 숫자 덩어리입니다. 쓸모는 그 숫자를 의미로 바꿀 때 생깁니다. 네 가지 방법이 있습니다. 첫째, 개수를 셉니다. 손가락 끝이 관절보다 위에 있으면 편 것으로 보고 개수를 셉니다. 둘째, 각도를 계산합니다. 세 점으로 벡터 두 개를 만들어 사잇각을 구하면 무릎 각도나 팔꿈치 각도가 나옵니다. 셋째, 거리의 비율을 봅니다. 눈꺼풀 위아래 거리를 눈 가로 길이로 나누면 눈을 얼마나 감았는지가 나옵니다. 넷째, 시간에 따른 변화를 봅니다. 앞의 값들이 일정 시간 유지되면 동작 하나로 셉니다. 스쿼트 한 개, 졸음 경고 같은 것이 여기서 나옵니다. 오후 미니 프로젝트는 결국 이 넷 중 하나를 고르는 일입니다.` },

    { section: true, eb: 'Block 3 · 13:50–15:40', h: '커스텀 데이터로 학습하기',
      sub: '세상에 없던 검출기를 하나 만듭니다. 오늘 가장 어려운 블록입니다.',
      nar: `세 번째 블록입니다. 오늘 가장 어렵고 가장 남는 시간입니다. 남이 학습시킨 모델을 쓰는 것에서 벗어나, 여러분이 직접 학습을 시킵니다.` },

    { eb: 'Why', h: 'COCO 80종에 없는 것을 찾아야 한다면',
      body: `<div class="chips" style="margin-top:1.4cqh">
        <span class="chip bad">우리 회사 제품</span><span class="chip bad">특정 부품 불량</span><span class="chip bad">작업자 안전모</span>
        <span class="chip bad">농작물 병해</span><span class="chip bad">우리 실습실 큐브</span><span class="chip bad">PCB 납땜 상태</span>
      </div>
      <div class="bannerG" style="margin-top:2.4cqh">실무에서 필요한 것은 대부분 COCO 80종에 없습니다.</div>
      <div class="stack" style="margin-top:2cqh">
        <div class="lay"><b>① 수집</b><span>웹캠으로 다양한 각도·조명에서 100~300장</span></div>
        <div class="lay" style="background:var(--soft)"><b>② 라벨링</b><span>사진마다 상자를 치고 이름을 붙인다 — 가장 오래 걸립니다</span></div>
        <div class="lay" style="background:var(--soft)"><b>③ 학습</b><span>사전학습 모델에서 이어서 학습 (전이학습)</span></div>
        <div class="lay" style="background:var(--sand);border-color:#E7CDBF"><b>④ 평가</b><span>mAP로 성능을 재고, 부족하면 ①로 돌아간다</span></div>
      </div>`,
      nar: `왜 직접 학습을 시켜야 하느냐면, 실무에서 필요한 것은 대부분 코코 팔십 종에 없기 때문입니다. 우리 회사 제품, 특정 부품의 불량, 작업자 안전모 착용 여부, 농작물 병해 같은 것들입니다. 절차는 네 단계입니다. 사진을 모으고, 라벨을 붙이고, 학습시키고, 평가합니다. 이 중 두 번째 라벨링이 압도적으로 오래 걸립니다. 사진 한 장 한 장에 상자를 치고 이름을 붙여야 하는데, 삼백 장이면 한두 시간이 그냥 갑니다. 이 지루함을 오늘 꼭 경험해 보십시오. 넷째 날에 시뮬레이터가 이 라벨링을 공짜로 해 주는 장면을 보게 되는데, 그때 이 지루함을 기억하고 있어야 그 가치가 보입니다.` },

    { eb: 'Transfer Learning', h: '처음부터 배우지 않습니다',
      sub: '이미 80종을 아는 모델에서 시작합니다 — 그래서 100장으로도 됩니다.',
      body: `<pre style="margin-top:1.4cqh"><span class="c"># data.yaml — 데이터셋 설명 파일</span>
path: ./mydata
train: images/train
val:   images/val
names:
  0: cube_red
  1: cube_blue

<span class="c"># 학습 실행 (사전학습 가중치에서 이어서)</span>
<span class="p">$</span> yolo detect train data=data.yaml model=yolov8n.pt epochs=50 imgsz=640</pre>
      <div class="bannerG" style="margin-top:2cqh">model=yolov8n.pt 가 핵심입니다. 백지가 아니라 "이미 볼 줄 아는" 모델에서 출발합니다.</div>`,
      foot: '백지에서 학습하려면 수만 장이 필요합니다. 전이학습 덕분에 100~300장으로 끝납니다.',
      nar: `여기서 중요한 개념이 전이학습입니다. 우리는 백지에서 시작하지 않습니다. 이미 팔십 종류를 볼 줄 아는 모델을 가져와서, 거기에 새 물체만 추가로 가르칩니다. 명령에서 모델 이퀄 욜로브이팔엔 점 피티 부분이 그 뜻입니다. 백지에서 학습하려면 사진이 수만 장 필요하지만, 전이학습 덕분에 백 장에서 삼백 장이면 쓸 만한 성능이 나옵니다. 데이터 야믈 파일에는 사진이 어디 있고 클래스 이름이 무엇인지를 적습니다. 에폭스는 전체 데이터를 몇 번 반복해서 볼지입니다.` },

    { eb: 'Evaluation', h: 'mAP — 학습이 잘 됐는지 재는 자',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">mAP50</span><span class="t">느슨한 기준</span><span class="d">상자가 정답과 50%만 겹쳐도 맞다고 인정. 보통 0.8 이상이면 쓸 만합니다</span></div>
        <div class="card"><span class="n">mAP50-95</span><span class="t">엄격한 기준</span><span class="d">겹침 기준을 50~95%로 올려가며 평균. 실제 성능에 가깝습니다</span></div>
      </div>
      <div class="rowlist" style="margin-top:2.4cqh">
        <div class="row"><span class="dot">!</span><span class="t">train은 좋은데 val이 나쁘다</span><span class="d">과적합 — 외운 것입니다. 데이터를 늘리거나 다양하게 하세요</span></div>
        <div class="row"><span class="dot">!</span><span class="t">둘 다 나쁘다</span><span class="d">학습 부족 — epochs를 늘리거나 라벨이 틀리지 않았는지 확인하세요</span></div>
      </div>`,
      foot: '학습 결과는 runs/detect/train/ 폴더에 그래프와 함께 저장됩니다. 꼭 열어 보세요.',
      nar: `학습이 끝나면 엠에이피라는 숫자가 나옵니다. 검출 모델의 성능을 재는 표준 지표입니다. 엠에이피 오십은 느슨한 기준으로, 상자가 정답과 절반만 겹쳐도 맞다고 인정합니다. 보통 영점팔 이상이면 쓸 만하다고 봅니다. 엠에이피 오십에서 구십오는 겹침 기준을 점점 올려가며 평균을 낸 것이라 실제 성능에 더 가깝습니다. 그리고 두 가지 상황을 구분하실 줄 알아야 합니다. 학습 데이터 성능은 좋은데 검증 데이터 성능이 나쁘면 과적합입니다. 외운 것이지 배운 게 아닙니다. 둘 다 나쁘면 학습이 부족한 것이거나 라벨이 잘못된 것입니다. 결과 그래프가 런스 폴더에 저장되니 꼭 열어 보십시오.` },

    { section: true, eb: 'Block 4 · 15:50–17:40', h: '미니프로젝트 #1',
      sub: '오늘 배운 것 중 하나를 골라 돌아가는 앱을 만듭니다.',
      nar: `마지막 블록입니다. 미니 프로젝트입니다. 완벽하게 만들려고 하지 마십시오. 돌아가는 것을 하나 만드는 게 목표입니다.` },

    { eb: 'Choose One', h: '네 가지 중 하나를 고르세요',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">① 제스처 제어기</span><span class="t">MediaPipe hands</span><span class="d">가위바위보 판정, 또는 손동작으로 화면·음악 조작. Day 6 최종 프로젝트로 이어집니다</span></div>
        <div class="card"><span class="n">② 운동 코칭</span><span class="t">MediaPipe pose</span><span class="d">무릎 각도로 스쿼트 카운트, 자세가 무너지면 경고</span></div>
        <div class="card"><span class="n">③ 졸음 · 표정 감지</span><span class="t">MediaPipe face</span><span class="d">눈 감김 비율(EAR)이 일정 시간 유지되면 경고</span></div>
        <div class="card"><span class="n">④ 물체 카운터</span><span class="t">YOLO</span><span class="d">특정 클래스만 필터링해 개수 표시, 선을 넘으면 통과 카운트</span></div>
      </div>`,
      foot: '①을 고르면 Day 6 최종 프로젝트(제스처로 로봇팔 조종)와 자연스럽게 이어집니다.',
      nar: `네 가지 중 하나를 고르십시오. 첫 번째는 제스처 제어기입니다. 가위바위보를 판정하거나 손동작으로 화면을 조작합니다. 이걸 고르시면 여섯째 날 최종 프로젝트에서 손동작으로 로봇팔을 움직이는 과제로 자연스럽게 이어집니다. 두 번째는 운동 코칭입니다. 무릎 각도로 스쿼트를 세고 자세가 무너지면 경고합니다. 세 번째는 졸음 감지입니다. 눈 감김 비율이 일정 시간 유지되면 경고를 띄웁니다. 네 번째는 물체 카운터입니다. 욜로로 특정 물체만 골라 개수를 세거나 선을 넘는 것을 카운트합니다.` },

    { eb: 'Demo Rules', h: '시연은 90초입니다',
      body: `<div class="rowlist" style="margin-top:1.4cqh">
        <div class="row"><span class="dot">1</span><span class="t">무엇을 만들었나</span><span class="d">한 문장으로. "손가락 개수로 볼륨을 조절하는 앱입니다"</span></div>
        <div class="row"><span class="dot">2</span><span class="t">실제로 돌린다</span><span class="d">화면을 띄우고 직접 동작시킵니다. 슬라이드 금지</span></div>
        <div class="row"><span class="dot">3</span><span class="t">어디가 잘 안 되나</span><span class="d">실패 조건을 하나 말합니다 — 이 항목에 점수가 있습니다</span></div>
      </div>
      <div class="banner" style="margin-top:2.4cqh">완성도보다 "돌아가느냐"와 "한계를 아느냐"를 봅니다.</div>`,
      nar: `시연은 한 사람당 구십 초입니다. 세 가지만 말하면 됩니다. 무엇을 만들었는지 한 문장, 실제로 돌려서 보여주기, 그리고 어디가 잘 안 되는지 한 가지입니다. 세 번째 항목에 점수가 있다는 걸 기억하십시오. 어제부터 계속 강조하는 건데, 한계를 아는 사람이 그 다음 기술의 가치를 정확히 이해합니다. 슬라이드 만들지 마시고 실제로 돌려서 보여주십시오.` }
  ],

  assignment: {
    title: '커스텀 검출기와 미니프로젝트 제출',
    lede: '오늘 학습시킨 모델의 성능을 숫자로 증명하고, 만든 앱을 영상으로 남깁니다.',
    subtitle: '학습 결과 그래프와 실행 영상은 반드시 포함할 것',
    items: [
      'YOLO 검출 결과 3정보 출력 캡처',
      '어제 실패 사진을 YOLO에 넣은 결과 비교',
      'MediaPipe 3종(hands·pose·face) 실행 캡처',
      '커스텀 학습 data.yaml + mAP50 수치',
      'runs/detect/train/results.png 그래프',
      '미니프로젝트 코드 + 30초 시연 영상'
    ],
    note: '2번이 오늘의 핵심입니다. 어제 Haar가 못 찾은 옆얼굴·어두운 사진을 그대로 YOLO에 넣고, 무엇이 달라졌는지 한 문단으로 쓰세요. 4번 mAP가 낮아도 감점 없습니다 — 낮은 이유를 설명하면 만점입니다.',
    sample: `<span class="o">학번 / 이름 : 20261234 / 홍길동

4. 커스텀 학습 결과
   클래스 : cube_red, cube_blue  (학습 120장 / 검증 30장)
   mAP50 : 0.71   mAP50-95 : 0.44
   해석 : 파란 큐브가 그늘에서 검게 보여 자주 놓침.
          → 조명이 어두운 사진을 20장 더 모아 재학습 예정</span>`,
    nar: `과제입니다. 여섯 항목인데 두 번째와 네 번째가 핵심입니다. 두 번째는 어제 하르가 못 찾았던 사진들을 그대로 욜로에 넣어 보고 무엇이 달라졌는지 한 문단으로 쓰는 것입니다. 이걸 해 보셔야 어제와 오늘이 이어집니다. 네 번째는 커스텀 학습의 엠에이피 수치인데, 숫자가 낮아도 감점하지 않습니다. 대신 왜 낮은지를 설명하시면 만점입니다. 데이터가 부족했는지, 조명이 한쪽으로 치우쳤는지, 라벨을 잘못 붙였는지를 스스로 진단하는 것이 학습입니다.` },

  wrap: {
    done: '사람이 규칙을 적던 방식을 버리고, 데이터가 규칙을 만드는 쪽으로 넘어왔습니다. 그리고 세상에 없던 검출기를 직접 하나 만들었습니다.',
    next: '내일 · Day 3 — 가상의 몸, 시뮬레이터와 MJCF',
    nextDesc: '눈은 이제 충분합니다. 하지만 아무리 잘 봐도 움직이지 않으면 소용이 없습니다. 내일은 로봇의 몸을 만듭니다. XML 한 장으로 세계를 적고, 중력과 마찰을 손으로 바꿔 봅니다.',
    nar: `오늘 한 일을 정리하겠습니다. 욜로로 팔십 종류를 한 번에 찾았고, 미디어파이프로 손과 몸과 얼굴의 점을 추적했고, 그 점들을 각도와 개수라는 의미로 바꿨습니다. 그리고 여러분의 데이터로 직접 학습을 시켜 세상에 없던 검출기를 하나 만들었습니다. 이제 눈은 충분합니다. 그런데 아무리 잘 봐도 움직이지 않으면 소용이 없습니다. 내일부터는 몸을 만듭니다. 엑스엠엘 한 장으로 세계를 적고, 중력과 마찰을 손으로 바꿔 가며 물리를 실험합니다. 수고하셨습니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '딥러닝 검출과 랜드마크',
    standfirst: '오전에는 남이 학습시킨 모델을 가져다 쓰고, 오후에는 직접 학습시킵니다. 오늘 라벨링이 지루하다고 느끼셨다면 그 감각을 기억해 두세요 — 내일모레 시뮬레이터가 그 일을 공짜로 해 주는 것을 보게 됩니다.',
    rules: [
      ['어제 것과 비교한다', '어제 Haar가 실패한 사진을 오늘 YOLO에 그대로 넣어 보세요. 비교하지 않으면 아무것도 배우지 못합니다.'],
      ['숫자를 꺼내 쓴다', '화면에 상자만 그리고 끝내지 마세요. 클래스·좌표·신뢰도를 직접 print 해 보는 것이 목적입니다.'],
      ['먼저 돌리고 다듬는다', '미니프로젝트는 완성도보다 동작이 먼저입니다. 30분 안에 일단 돌아가게 만들고 남는 시간에 다듬으세요.']
    ],
    parts: [
      {
        pn: 'PART 1', h: 'YOLO 물체 검출', time: '09:00–10:50',
        lede: '첫 실행 시 yolov8n.pt 가 자동 다운로드됩니다(1회성). 느려도 기다리세요.',
        missions: [
          { n: 1, h: '세 가지 입력으로 돌려 보기', body: `
      <pre><span class="p">$</span> conda activate physicalai
<span class="p">$</span> cd 영상AI실습폴더경로
<span class="p">$</span> python vlab3_yolo_detect.py photo.jpg    <span class="c"># ① 이미지</span>
<span class="p">$</span> python vlab3_yolo_detect.py road.mp4     <span class="c"># ② 동영상</span>
<span class="p">$</span> python vlab3_yolo_detect.py              <span class="c"># ③ 웹캠 실시간</span></pre>
      <p>터미널에 <strong>클래스 이름 / 상자 좌표 / 신뢰도</strong> 세 가지가 출력되는지 확인하세요.</p>
      <div class="box q"><span class="lbl">확인 질문</span><ul>
        <li>웹캠으로 돌릴 때 FPS가 어제 Canny보다 얼마나 떨어지나요?</li>
        <li>화면에 없는 물체를 잘못 검출한 경우가 있나요? 그때 신뢰도는 얼마였나요?</li>
      </ul></div>` },

          { n: 2, h: '어제의 실패 사진을 넣어 보기 ★', body: `
      <p>어제 <strong>Haar가 못 찾았던 캡처 3장</strong>을 그대로 YOLO에 넣습니다.</p>
      <pre><span class="p">$</span> python vlab3_yolo_detect.py 어제_옆얼굴.jpg
<span class="p">$</span> python vlab3_yolo_detect.py 어제_어두운얼굴.jpg
<span class="p">$</span> python vlab3_yolo_detect.py 어제_컵.jpg</pre>
      <div class="box check"><span class="lbl">무엇을 확인하는가</span>
        <p>YOLO는 얼굴 검출기가 아니라 <code>person</code> 검출기입니다. 옆을 봐도, 어두워도 사람으로 잡아냅니다. 그리고 어제는 아예 불가능했던 <code>cup</code>이 이름과 함께 나옵니다.</p></div>
      <div class="box q"><span class="lbl">과제용 기록</span>
        <p>세 장의 전후 결과를 나란히 캡처하고, <strong>무엇이 달라졌는지 한 문단</strong>으로 적으세요. 오늘 과제 2번입니다.</p></div>` },

          { n: 3, h: '결과를 코드에서 꺼내 쓰기', body: `
      <p>화면에 그리는 것만으로는 부족합니다. <strong>숫자를 직접 꺼내야</strong> 나중에 로봇을 움직일 수 있습니다.</p>
      <pre><span class="p">$</span> python</pre>
      <pre><span class="c">>>></span> from ultralytics import YOLO
<span class="c">>>></span> m = YOLO("yolov8n.pt")
<span class="c">>>></span> r = m("photo.jpg")
<span class="c">>>></span> for b in r[0].boxes:
...     print(m.names[int(b.cls[0])], b.xyxy[0].tolist(), round(float(b.conf[0]),2))
<span class="o">person [102.3, 45.1, 288.7, 470.2] 0.91
cup    [330.5, 210.8, 402.1, 300.4] 0.67</span></pre>
      <div class="box check"><span class="lbl">Day 5 예고</span>
        <p>여기서 나온 <strong>상자 좌표</strong>가 5일차에 로봇팔이 갈 목표 좌표가 됩니다. 지금은 픽셀 좌표지만, 깊이 정보를 더하면 3D 좌표가 됩니다.</p></div>` },

          { n: 4, h: '필터링과 임계값 조절', body: `
      <p>실무에서는 전부 다 검출하지 않습니다. <strong>필요한 것만</strong> 받습니다.</p>
      <pre>results = model(frame, conf=<span class="o">0.5</span>)                 <span class="c"># 신뢰도 0.5 이상만</span>
results = model(frame, classes=[<span class="o">0</span>])              <span class="c"># person 만 (0번)</span>
results = model(frame, conf=0.3, classes=[<span class="o">39</span>, <span class="o">41</span>])  <span class="c"># bottle, cup 만</span></pre>
      <p>클래스 번호는 <code>model.names</code>로 전체를 출력해 확인하세요.</p>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p><code>conf</code>를 0.25 → 0.7로 올리면 검출 개수가 어떻게 변하나요? <strong>어제 minNeighbors 3↔8</strong>과 같은 성질인가요, 다른가요?</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: 'MediaPipe 랜드마크', time: '11:00–12:50',
        lede: '세 가지 모드를 모두 돌려 보고, 마지막에 좌표로 값을 계산해 봅니다.',
        missions: [
          { n: 5, h: '세 가지 모드 실행', body: `
      <pre><span class="p">$</span> python vlab4_mediapipe.py hands   <span class="c"># 손 21점 + 편 손가락 개수</span>
<span class="p">$</span> python vlab4_mediapipe.py pose    <span class="c"># 전신 33점</span>
<span class="p">$</span> python vlab4_mediapipe.py face    <span class="c"># 얼굴 468점 메시</span></pre>
      <div class="dl">
        <div class="dlrow"><span class="k">hands</span><span class="v">손가락을 하나씩 펴며 숫자가 맞게 올라가는지<small>주먹 0 → 다섯 손가락 5</small></span></div>
        <div class="dlrow"><span class="k">pose</span><span class="v">앉았다 일어서며 관절 점이 따라오는지<small>가려진 관절은 어떻게 표시되나요?</small></span></div>
        <div class="dlrow"><span class="k">face</span><span class="v">눈을 감았다 뜨고, 입을 벌려 보기<small>468점이 얼굴을 따라 늘어납니다</small></span></div>
      </div>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>세 모드 중 FPS가 가장 낮은 것은? 점의 개수와 관계가 있나요?</p></div>` },

          { n: 6, h: 'YOLO와 나란히 비교', body: `
      <p>같은 장면을 두 방식으로 봅니다. <strong>창 두 개를 동시에 띄워</strong> 놓고 비교하세요.</p>
      <pre><span class="c"># 터미널 1</span>
<span class="p">$</span> python vlab3_yolo_detect.py
<span class="c"># 터미널 2 (새 Anaconda Prompt)</span>
<span class="p">$</span> conda activate physicalai
<span class="p">$</span> python vlab4_mediapipe.py pose</pre>
      <div class="box check"><span class="lbl">핵심 차이</span>
        <p>손을 들어 보세요. YOLO는 <strong>상자 크기만 조금 바뀝니다</strong>. MediaPipe는 <strong>팔이 올라간 것이 보입니다</strong>. "무엇이 어디에" vs "어떤 모양으로"의 차이입니다.</p></div>` },

          { n: 7, h: '좌표를 의미로 바꾸기 ★', body: `
      <p>랜드마크 좌표로 <strong>각도</strong>를 계산합니다. 세 점 A–B–C의 B에서의 각도입니다.</p>
      <pre><span class="c">import</span> numpy as np

<span class="c">def</span> angle(a, b, c):
    ba = np.array(a) - np.array(b)
    bc = np.array(c) - np.array(b)
    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    <span class="c">return</span> np.degrees(np.arccos(np.clip(cos, -1, 1)))

<span class="c"># pose 기준: 엉덩이(23) - 무릎(25) - 발목(27)</span>
knee = angle(lm[23], lm[25], lm[27])
<span class="c">if</span> knee &lt; 100: print("스쿼트 내려감")</pre>
      <div class="box check"><span class="lbl">오늘 가장 쓸모 있는 10줄</span>
        <p>이 함수 하나로 무릎·팔꿈치·어깨 각도를 전부 잴 수 있습니다. 미니프로젝트 ②를 고르면 그대로 씁니다.</p></div>
      <div class="box q"><span class="lbl">해볼 것</span>
        <p>팔꿈치 각도(어깨 11 – 팔꿈치 13 – 손목 15)를 재서 화면에 숫자로 띄워 보세요.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '내 데이터로 YOLO 학습시키기', time: '13:50–15:40',
        lede: '오늘 가장 어려운 파트입니다. 수집 30분 · 라벨링 40분 · 학습 20분으로 시간을 배분하세요.',
        missions: [
          { n: 8, h: '데이터 수집', body: `
      <p>COCO 80종에 <strong>없는</strong> 물체를 하나 고르세요. 실습실 물건이면 무엇이든 좋습니다(공구, 명찰, 특정 색 블록 등).</p>
      <pre><span class="c"># 웹캠으로 연속 캡처 — s 키를 누를 때마다 저장</span>
<span class="p">$</span> python vlab1_webcam_preview.py</pre>
      <div class="box check"><span class="lbl">좋은 데이터의 조건</span><ul>
        <li><strong>각도를 바꾸며</strong> 찍기 — 정면만 찍으면 정면만 찾습니다</li>
        <li><strong>조명을 바꾸며</strong> 찍기 — 밝은 곳, 그늘, 역광</li>
        <li><strong>배경을 바꾸며</strong> 찍기 — 책상 위, 바닥, 손에 든 상태</li>
        <li>최소 100장. 학습 80장 / 검증 20장으로 나눕니다</li>
      </ul></div>
      <div class="box warn"><span class="lbl">시간 관리</span>
        <p>30분 안에 끝내세요. 완벽한 데이터를 모으려다 라벨링 시간을 잃는 것이 가장 흔한 실패입니다.</p></div>` },

          { n: 9, h: '라벨링', body: `
      <p>도구는 <strong>LabelImg</strong>(로컬) 또는 <strong>Roboflow</strong>(웹) 중 편한 것을 쓰세요.</p>
      <pre><span class="p">$</span> pip install labelImg
<span class="p">$</span> labelImg</pre>
      <p>저장 형식은 반드시 <strong>YOLO</strong>로 설정합니다. 이미지 한 장당 같은 이름의 <code>.txt</code>가 생깁니다.</p>
      <pre><span class="c"># mydata/labels/train/img001.txt 의 내용</span>
<span class="o">0 0.512 0.433 0.180 0.221</span>
<span class="c"># 클래스번호  중심x  중심y  너비  높이   (전부 0~1로 정규화)</span></pre>
      <div class="box check"><span class="lbl">폴더 구조</span>
        <pre style="margin-top:8px">mydata/
├── images/train/  ← 사진 80장
├── images/val/    ← 사진 20장
├── labels/train/  ← txt 80개
└── labels/val/    ← txt 20개</pre></div>
      <div class="box warn"><span class="lbl">지금 이 지루함을 기억하세요</span>
        <p>100장에 40분이 걸립니다. 실무에서는 수천 장입니다. <strong>Day 4에서 시뮬레이터가 이 라벨을 자동으로 만들어 주는 것</strong>을 보게 됩니다.</p></div>` },

          { n: 10, h: '학습과 평가', body: `
      <pre><span class="c"># data.yaml 작성</span>
path: ./mydata
train: images/train
val: images/val
names:
  0: 내물체이름</pre>
      <pre><span class="p">$</span> yolo detect train data=data.yaml model=yolov8n.pt epochs=50 imgsz=640
<span class="c"># ... 학습 진행 (CPU면 15~25분, GPU면 3~5분)</span>
<span class="o">all   100   0.83   0.71   0.79   0.52
                  ↑P    ↑R   ↑mAP50 ↑mAP50-95</span></pre>
      <p>학습이 끝나면 결과가 <code>runs/detect/train/</code>에 저장됩니다. <code>results.png</code>를 꼭 열어 보세요.</p>
      <pre><span class="c"># 학습된 모델로 검출해 보기</span>
<span class="p">$</span> yolo detect predict model=runs/detect/train/weights/best.pt source=0</pre>
      <div class="box q"><span class="lbl">결과 해석</span><ul>
        <li>train loss는 내려가는데 val mAP가 안 오르면 → <strong>과적합</strong>. 데이터를 다양하게</li>
        <li>둘 다 나쁘면 → <strong>학습 부족</strong> 또는 <strong>라벨 오류</strong>. 라벨부터 다시 확인</li>
        <li>특정 각도에서만 못 찾으면 → 그 각도 사진이 부족한 것</li>
      </ul></div>` }
        ]
      },
      {
        pn: 'PART 4', h: '미니프로젝트 #1', time: '15:50–17:40',
        lede: '90분 제작 + 20분 시연. 완성도보다 동작이 먼저입니다.',
        missions: [
          { n: 11, h: '주제 선택과 최소 버전 만들기', body: `
      <div class="dl">
        <div class="dlrow"><span class="k">① 제스처</span><span class="v">가위바위보 판정 / 손동작으로 조작<small>hands 21점 · 펴진 손가락 조합으로 판정 · Day 6으로 이어짐</small></span></div>
        <div class="dlrow"><span class="k">② 운동 코칭</span><span class="v">스쿼트 카운트 + 자세 경고<small>pose 33점 · 미션 7의 각도 함수를 그대로 사용</small></span></div>
        <div class="dlrow"><span class="k">③ 졸음 감지</span><span class="v">눈 감김이 2초 이상 유지되면 경고<small>face 468점 · 눈꺼풀 세로÷가로 비율(EAR)</small></span></div>
        <div class="dlrow"><span class="k">④ 물체 카운터</span><span class="v">특정 클래스 개수 표시 / 통과 카운트<small>YOLO · classes 필터 + 중심점이 선을 넘는지 판정</small></span></div>
      </div>
      <div class="box check"><span class="lbl">30분 규칙</span>
        <p>먼저 <strong>30분 안에 최소 버전</strong>을 돌아가게 만드세요. 화면에 숫자 하나만 떠도 됩니다. 나머지 60분에 다듬습니다.</p></div>` },

          { n: 12, h: '한계 찾고 시연 준비', body: `
      <p>이틀 내내 해 온 일을 여기서도 합니다. <strong>내 앱이 어디서 무너지는지</strong> 찾으세요.</p>
      <div class="box q"><span class="lbl">시연에서 말할 세 가지</span><ol>
        <li>무엇을 만들었나 — 한 문장</li>
        <li>실제로 돌린다 — 슬라이드 금지, 라이브 시연 90초</li>
        <li>어디가 잘 안 되나 — 실패 조건 1개 (배점 있음)</li>
      </ol></div>
      <div class="box check"><span class="lbl">예시</span>
        <p>"손가락 개수로 볼륨을 조절하는 앱입니다. 다만 <strong>손등을 보이면</strong> 편 손가락 판정이 뒤집힙니다. 손바닥 방향을 먼저 판별해야 해결됩니다."</p></div>` }
        ]
      }
    ],
    errors: [
      ['YOLO 첫 실행이 매우 느림', '모델 자동 다운로드 중', '1회성입니다. 완료 후에는 즉시 실행됩니다'],
      ['<code>AttributeError: multi_hand_landmarks</code>', 'BGR→RGB 변환 누락', '<code>cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)</code> 후 process에 넘기세요'],
      ['MediaPipe 랜드마크가 안 잡힘', '조명 부족 또는 손이 화면 밖', '밝은 곳에서, 손 전체가 프레임 안에 들어오게'],
      ['<code>yolo: command not found</code>', '가상환경 미활성 또는 ultralytics 미설치', '<code>conda activate physicalai</code> → <code>pip install ultralytics</code>'],
      ['학습 시 <code>No labels found</code>', '폴더 구조 또는 이름 불일치', 'images와 labels의 <strong>파일명이 동일</strong>해야 합니다(확장자만 다름)'],
      ['학습이 너무 느림 (CPU)', 'GPU 미사용', '<code>epochs</code>를 20으로 줄이거나 <code>imgsz=416</code>으로. 정상입니다'],
      ['mAP가 0에 가까움', '라벨 클래스 번호 오류', '<code>data.yaml</code>의 names 순서와 txt의 클래스 번호가 맞는지 확인'],
      ['<code>CUDA out of memory</code>', '배치 크기 과다', '<code>batch=8</code> 또는 <code>batch=4</code>로 낮추세요']
    ],
    checklist: [
      'YOLO를 이미지 · 동영상 · 웹캠 세 가지 입력으로 돌렸다',
      '클래스 이름 · 상자 좌표 · 신뢰도를 코드에서 <code>print</code> 했다',
      '<strong>어제 Haar가 실패한 사진</strong>을 YOLO에 넣어 결과를 비교했다',
      '<code>conf</code>와 <code>classes</code>로 검출 결과를 필터링했다',
      'MediaPipe hands · pose · face 세 모드를 모두 실행했다',
      'BGR→RGB 변환이 왜 필요한지 설명할 수 있다',
      '랜드마크 좌표로 <strong>관절 각도</strong>를 계산해 화면에 띄웠다',
      '내 물체 사진 100장 이상을 수집하고 라벨링했다',
      'YOLO 커스텀 학습을 완료하고 mAP50 수치를 확인했다',
      '학습된 <code>best.pt</code>로 웹캠 검출을 실행했다',
      '미니프로젝트가 돌아가고, <strong>실패 조건 1개</strong>를 말할 수 있다'
    ]
  },

  /* ================= 퀴즈 ================= */
  quizTitle: '딥러닝 검출과 랜드마크 퀴즈',
  quiz: [
    { q: 'Haar Cascade와 YOLO의 가장 본질적인 차이는?',
      o: ['규칙을 사람이 설계하느냐, 데이터에서 학습하느냐', '흑백이냐 컬러냐', '속도가 빠르냐 느리냐', '무료냐 유료냐'], a: 0,
      e: '이것이 딥러닝이 바꾼 단 하나입니다. 대신 데이터가 없으면 아무것도 못 한다는 대가가 따릅니다.' },

    { q: 'YOLO는 무엇의 줄임말인가요?',
      o: ['You Only Look Once', 'Your Object Location Output', 'Yield Layer Optimization', 'Yolo Object Learning Operation'], a: 0,
      e: '이미지를 한 번만 보고 모든 물체의 위치와 종류를 동시에 답한다는 뜻입니다. 그래서 실시간이 가능합니다.' },

    { q: '<code>yolov8n.pt</code>에서 <code>n</code>이 뜻하는 것은?',
      o: ['nano — 가장 작고 빠른 모델', 'new — 최신 버전', 'normal — 기본 설정', 'neural — 신경망 사용'], a: 0,
      e: 'n · s · m · l · x 순으로 커집니다. 클수록 정확하지만 느립니다. 웹캠 실시간에는 n이나 s를 씁니다.' },

    { q: 'YOLO 검출 결과에서 꺼낼 수 있는 <strong>세 가지</strong>가 아닌 것은?',
      o: ['물체까지의 거리', '클래스 이름', '상자 좌표', '신뢰도'], a: 0,
      e: '거리(깊이)는 일반 카메라 한 장으로는 알 수 없습니다. Day 4에서 깊이 영상을 더해 3D 좌표를 복원하게 됩니다.' },

    { q: '사전학습 YOLO 모델을 불러오는 코드는? (직접 입력)', t: true,
      acc: ['YOLO("yolov8n.pt")', "YOLO('yolov8n.pt')", 'model = YOLO("yolov8n.pt")'], ans: 'YOLO("yolov8n.pt")',
      e: '파일이 없으면 첫 실행 때 자동으로 다운로드됩니다. 이후에는 즉시 로드됩니다.' },

    { q: '<code>conf=0.7</code>로 높이면 어떻게 되나요?',
      o: ['확실한 것만 남고 놓치는 물체가 늘어난다', '검출 개수가 무조건 늘어난다', '처리 속도가 느려진다', '클래스 개수가 80종에서 늘어난다'], a: 0,
      e: '어제 <code>minNeighbors</code> 3↔8과 같은 트레이드오프입니다. 기술이 바뀌어도 이 고민은 그대로 남습니다.' },

    { q: 'Ultralytics YOLO의 라이선스는?',
      o: ['AGPL-3.0 + 상용 이중 라이선스', 'MIT', 'Apache 2.0', 'BSD-3'], a: 0,
      e: '상업 제품에 넣으려면 소스 공개 또는 유료 라이선스가 필요합니다. 수업·연구에서는 문제없습니다.' },

    { q: 'MediaPipe가 YOLO와 결정적으로 다른 점은?',
      o: ['상자가 아니라 관절 점 좌표를 준다', '컬러 영상만 처리한다', '학습을 직접 시켜야 한다', 'GPU가 반드시 필요하다'], a: 0,
      e: 'YOLO는 "무엇이 어디에", MediaPipe는 "어떤 모양으로"를 답합니다. 자세·제스처 판정은 점 좌표가 있어야 가능합니다.' },

    { q: 'MediaPipe의 랜드마크 개수를 바르게 짝지은 것은?',
      o: ['손 21 · 포즈 33 · 얼굴 468', '손 33 · 포즈 21 · 얼굴 468', '손 21 · 포즈 468 · 얼굴 33', '손 68 · 포즈 21 · 얼굴 33'], a: 0,
      e: '얼굴은 468점 메시라서 표정과 눈 깜빡임까지 읽어낼 수 있습니다.' },

    { q: 'MediaPipe에 프레임을 넘기기 전에 <strong>반드시</strong> 해야 하는 것은?',
      o: ['BGR → RGB 색 순서 변환', '흑백 변환', '해상도를 640으로 축소', '정규화(0~1)'], a: 0,
      e: 'OpenCV는 BGR, MediaPipe는 RGB입니다. 빼먹으면 오류는 안 나는데 인식이 이상해져서 원인을 찾기 어렵습니다.' },

    { q: 'BGR을 RGB로 바꾸는 코드는? (직접 입력)', t: true,
      acc: ['cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)', 'cvtColor(frame, cv2.COLOR_BGR2RGB)', 'cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)'], ans: 'cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)',
      e: '어제 쓴 BGR2GRAY와 상수만 다릅니다. 색 공간 변환은 전부 이 함수 하나로 합니다.' },

    { q: '무릎 각도를 계산하려면 최소 몇 개의 랜드마크가 필요한가요?',
      o: ['3개 (엉덩이 · 무릎 · 발목)', '1개 (무릎)', '2개 (무릎 · 발목)', '33개 전부'], a: 0,
      e: '각도는 세 점으로 벡터 두 개를 만들어 사잇각을 구합니다. 이 함수 하나로 팔꿈치·어깨 각도도 전부 잴 수 있습니다.' },

    { q: '커스텀 학습에서 <strong>전이학습</strong>이란?',
      o: ['이미 학습된 모델에서 이어서 학습하는 것', '학습 데이터를 다른 PC로 옮기는 것', '학습 결과를 ONNX로 내보내는 것', 'GPU에서 CPU로 바꿔 학습하는 것'], a: 0,
      e: '<code>model=yolov8n.pt</code>가 그 뜻입니다. 백지에서 배우면 수만 장이 필요하지만, 전이학습 덕분에 100~300장이면 됩니다.' },

    { q: 'YOLO 라벨 파일 한 줄 <code>0 0.512 0.433 0.180 0.221</code>의 의미는?',
      o: ['클래스번호 · 중심x · 중심y · 너비 · 높이 (0~1 정규화)', '클래스번호 · 좌상단x · 좌상단y · 우하단x · 우하단y (픽셀)', '이미지번호 · 신뢰도 · x · y · 크기', '클래스번호 · 회전각 · 폭 · 높이 · 신뢰도'], a: 0,
      e: 'YOLO 형식은 중심 좌표와 크기를 0~1로 정규화해 씁니다. 이미지 크기가 바뀌어도 라벨을 다시 만들 필요가 없습니다.' },

    { q: 'train 성능은 좋은데 val의 mAP가 나쁘다면?',
      o: ['과적합 — 데이터를 늘리거나 다양하게 해야 한다', '학습 부족 — epochs를 늘려야 한다', '정상이다 — val은 원래 낮다', 'GPU 메모리 부족'], a: 0,
      e: '외운 것이지 배운 것이 아닙니다. 각도·조명·배경이 한쪽으로 치우친 데이터에서 자주 나옵니다.' },

    { q: '<code>mAP50</code>과 <code>mAP50-95</code>의 차이는?',
      o: ['정답 상자와 겹쳐야 하는 비율 기준이 다르다', '학습용과 검증용의 차이다', '클래스 개수의 차이다', '속도 측정 방식의 차이다'], a: 0,
      e: 'mAP50은 50%만 겹쳐도 인정하는 느슨한 기준, mAP50-95는 기준을 올려가며 평균낸 엄격한 기준입니다.' },

    { q: 'YOLO 커스텀 학습을 시작하는 CLI 명령의 <strong>앞 세 단어</strong>는? (직접 입력)', t: true,
      acc: ['yolo detect train', 'yolo train'], ans: 'yolo detect train',
      e: '뒤에 <code>data=data.yaml model=yolov8n.pt epochs=50</code>이 붙습니다. <code>data</code>는 데이터셋 설명 파일, <code>model</code>은 출발점이 될 사전학습 가중치입니다.' },

    { q: '오늘 라벨링이 지루했던 경험이 Day 4와 어떻게 이어지나요?',
      o: ['시뮬레이터의 Segmentation 영상이 라벨링된 정답 데이터가 된다', '시뮬레이터가 학습 속도를 10배 빠르게 한다', 'Day 4에서는 라벨링 도구가 자동화된다', '이어지지 않는다'], a: 0,
      e: '시뮬레이터는 물체의 진짜 위치와 정체를 이미 알고 있습니다. 그래서 이미지와 라벨을 동시에, 무한히 만들어 낼 수 있습니다 — 이것이 합성 데이터입니다.' }
  ]
};
