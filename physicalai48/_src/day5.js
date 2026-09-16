module.exports = {
  day: 5,
  title: '인식 · 판단 · 행동을 하나로',
  theme: '본 것을 집고, 말을 알아듣고, 스스로 배우기 시작한다',

  openingNar: `다섯째 날입니다. 첫날에 피지컬 에이아이는 인식하고 판단하고 행동하는 것이라고 말씀드렸습니다. 지난 나흘 동안 인식과 행동을 따로따로 만들었습니다. 눈은 눈대로, 팔은 팔대로 잘 작동합니다. 오늘 이 둘을 잇습니다. 카메라가 본 것을 로봇이 집습니다. 그리고 오후에는 가운데 빠져 있던 판단을 채웁니다. 말로 시키면 알아듣는 로봇을 만들고, 그 다음에는 아무도 가르쳐 주지 않아도 스스로 배우는 로봇의 원리를 배웁니다.`,

  goals: [
    ['카메라가 본 좌표를', '로봇 좌표로 변환해 실제로 집을 수 있다'],
    ['인식 오차와 여유의 관계를', '"몇 cm까지 틀려도 되는가"로 설명할 수 있다'],
    ['자연어 명령을', 'LLM으로 해석해 로봇 동작으로 바꿀 수 있다'],
    ['LLM 환각을 막는 설계를', '"있는 것만 알려주고 고르게 하기"로 구현할 수 있다'],
    ['딥러닝 학습 원리를', '손실 · 경사하강 · 역전파로 설명할 수 있다'],
    ['강화학습으로', '정책을 직접 학습시키고 결과를 재생할 수 있다']
  ],
  goalsNar: `오늘의 목표는 여섯 가지입니다. 앞의 두 개는 눈과 몸을 잇는 일입니다. 카메라 좌표를 로봇 좌표로 바꿔 실제로 집고, 오차가 얼마까지 허용되는지를 이해합니다. 가운데 두 개는 판단입니다. 자연어 명령을 로봇 동작으로 바꾸고, 엘엘엠이 없는 물건을 집으라고 하는 환각을 막는 설계를 배웁니다. 마지막 두 개가 오늘 오후의 큰 전환입니다. 딥러닝이 어떻게 배우는지를 이해하고, 강화학습으로 로봇을 직접 학습시킵니다.`,

  blocks: [
    { time: '09:00–10:50', title: '본 위치로 가서 집기', desc: 'ArUco · 좌표 변환 · 오차와 여유' },
    { time: '11:00–12:50', title: '말로 시키는 로봇', desc: 'LLM 연동 · 환각 방지 · 음성 명령' },
    { time: '13:50–15:40', title: '학습의 원리', desc: '손실 · 경사하강 · 보상 · 정책' },
    { time: '15:50–17:40', title: '강화학습 첫 실습', desc: '막대 세우기 성공 · 치타 학습 착수' }
  ],
  blocksNar: `오늘은 네 블록이고 하루 안에서 두 번 방향이 바뀝니다. 오전은 나흘간 만든 것을 합치는 시간입니다. 오후 첫 블록에서 개념이 크게 바뀌어서 학습이라는 주제로 넘어갑니다. 마지막 블록에서 강화학습을 직접 돌리는데, 여기서 시간 관리가 중요합니다. 가벼운 과제로 먼저 성공을 맛보고, 무거운 과제는 백그라운드로 걸어 두고 퇴근합니다. 내일 아침에 결과를 회수합니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–10:50', h: '본 위치로 가서 집기',
      sub: '나흘 동안 따로 만든 눈과 팔을 오늘 잇습니다.',
      nar: `첫 번째 블록입니다. 나흘 동안 따로 만들어 온 눈과 팔을 오늘 드디어 연결합니다.` },

    { eb: 'The Pipeline', h: '피지컬 AI의 기본 흐름',
      body: `<div class="stack" style="margin-top:1.6cqh">
        <div class="lay"><b>① 본다</b><span>카메라로 물체를 찾는다 — YOLO 또는 색 필터 또는 ArUco 마커</span></div>
        <div class="lay" style="background:var(--soft)"><b>② 재본다</b><span>깊이로 3D 좌표를 복원한다 — 어제 배운 역투영</span></div>
        <div class="lay" style="background:var(--soft)"><b>③ 옮긴다</b><span>카메라 좌표 → 로봇 좌표로 변환 — 오늘의 새 내용</span></div>
        <div class="lay" style="background:var(--sand);border-color:#E7CDBF"><b>④ 간다</b><span>그 좌표로 IK를 풀어 손끝을 보내고 집는다 — 어제 만든 것</span></div>
      </div>`,
      foot: '③번 하나만 새로 배우면 나머지는 이미 다 만들어 뒀습니다.',
      nar: `피지컬 에이아이의 기본 흐름은 네 단계입니다. 먼저 카메라로 물체를 찾습니다. 욜로를 쓰든 색으로 찾든 아루코 마커를 쓰든 상관없습니다. 그 다음 깊이로 삼차원 좌표를 복원합니다. 어제 배운 역투영입니다. 세 번째로 카메라 좌표를 로봇 좌표로 옮깁니다. 이게 오늘 새로 배우는 부분입니다. 마지막으로 그 좌표로 역기구학을 풀어 손끝을 보내고 집습니다. 어제 만든 것이죠. 그러니까 오늘 새로 배울 것은 세 번째 하나뿐이고 나머지는 이미 다 만들어 뒀습니다.` },

    { eb: 'ArUco', h: '마커 하나로 위치와 자세를 동시에',
      sub: '흑백 사각형 패턴에서 3D 위치와 기울기를 계산합니다.',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">왜 마커인가</span><span class="t">한 장으로 깊이까지</span><span class="d">마커의 <strong>실제 한 변 길이</strong>를 알고 있으므로, 화면에 찍힌 크기로 거리를 역산할 수 있습니다</span></div>
        <div class="card"><span class="n">solvePnP</span><span class="t">자세까지 나온다</span><span class="d">네 모서리의 화면 좌표 ↔ 실제 좌표를 맞춰 회전과 이동을 한 번에 구합니다</span></div>
      </div>
      <pre style="margin-top:2.4cqh"><span class="p">$</span> python lab5_1_aruco_robot.py           <span class="c"># ① 웹캠 + ArUco 마커</span>
<span class="p">$</span> python lab5_1_aruco_robot.py --sim     <span class="c"># ② 웹캠 없이 시뮬 카메라로</span>
<span class="c"># 영상 창에서 p = 그 위치로 집기, q = 종료</span></pre>`,
      foot: '마커 인쇄: chev.me/arucogen · 딕셔너리 4x4_50, ID 0',
      nar: `아루코는 흑백 사각형 패턴 마커입니다. 이걸 쓰는 이유가 있습니다. 어제 우리는 깊이 영상이 있어야 삼차원 좌표를 구할 수 있다고 배웠습니다. 그런데 아루코는 일반 카메라 한 장으로도 거리를 구할 수 있습니다. 마커의 실제 한 변 길이를 우리가 알고 있기 때문입니다. 화면에 작게 찍혔으면 멀리 있는 거고 크게 찍혔으면 가까이 있는 거죠. 그리고 솔브피엔피라는 함수로 네 모서리의 화면 좌표와 실제 좌표를 맞추면 위치뿐 아니라 기울기까지 한 번에 나옵니다. 실습은 두 가지 모드가 있습니다. 웹캠과 인쇄된 마커로 하는 방식과, 웹캠 없이 시뮬레이터 카메라로 하는 방식입니다.` },

    { eb: 'The Key Insight', h: '오차가 있어도 집힙니다',
      sub: '오늘 반드시 이해하고 넘어가야 할 것입니다.',
      body: `<div class="rowlist" style="margin-top:1.4cqh">
        <div class="row"><span class="dot">?</span><span class="t">어제 잰 오차가 4mm였습니다</span><span class="d">그런데 로봇은 그 틀린 좌표로 갑니다. 왜 집힐까요?</span></div>
        <div class="row"><span class="dot">!</span><span class="t">그리퍼에 여유가 있기 때문</span><span class="d">손가락 폭이 물체보다 넓으면, 오차가 그 차이 안에만 있으면 집힙니다</span></div>
      </div>
      <div class="bannerG" style="margin-top:2.4cqh">"정확도를 얼마나 올려야 하나?"가 아니라 "여유가 얼마나 되나?"를 먼저 묻습니다.</div>
      <pre style="margin-top:2cqh"><span class="c"># --sim 모드에서는 큐브를 진짜 위치에 그대로 두고</span>
<span class="c"># 로봇은 '카메라가 본 좌표'로 갑니다 → 오차의 효과를 눈으로 확인</span></pre>`,
      foot: '실무에서 "인식 정확도 목표"는 이렇게 역산합니다 — 허용 오차에서 요구 정확도를 뽑습니다.',
      nar: `오늘 가장 중요한 통찰입니다. 어제 여러분이 잰 인식 오차가 몇 밀리미터였을 겁니다. 그런데 로봇은 그 틀린 좌표로 갑니다. 그런데도 집힙니다. 왜일까요. 그리퍼에 여유가 있기 때문입니다. 손가락을 벌린 폭이 물체보다 넓으면, 오차가 그 차이 안에만 들어오면 집힙니다. 이게 실무에서 아주 중요한 사고방식입니다. 인식 정확도를 얼마나 올려야 하느냐고 묻기 전에, 여유가 얼마나 되느냐를 먼저 물어야 합니다. 허용 오차에서 요구 정확도를 역산하는 겁니다. 시뮬 모드에서는 큐브를 진짜 위치에 그대로 두고 로봇만 카메라가 본 좌표로 보내기 때문에, 오차의 효과를 눈으로 확인할 수 있습니다.` },

    { section: true, eb: 'Block 2 · 11:00–12:50', h: '말로 시키는 로봇',
      sub: '이제 가운데 빠져 있던 "판단"을 채웁니다.',
      nar: `두 번째 블록입니다. 인식과 행동 사이에 빠져 있던 판단을 채웁니다.` },

    { eb: 'LLM as Interpreter', h: 'LLM은 통역사입니다',
      sub: '"파란 블록을 상자에 넣어줘" → 구조화된 동작 계획',
      body: `<pre style="margin-top:1.4cqh"><span class="c"># 입력 (사람의 말)</span>
"파란 블록을 상자에 넣어줘"

<span class="c"># LLM이 내놓아야 하는 것 (기계가 읽을 수 있는 형태)</span>
{ "action": "pick_and_place",
  "target_color": "blue",
  "destination": "box" }

<span class="c"># 그 다음은 이미 만들어 둔 것</span>
색으로 탐색 → 3D 좌표 복원 → IK → 집기</pre>
      <div class="bannerG" style="margin-top:2.4cqh">LLM은 로봇을 움직이지 않습니다. 사람의 말을 프로그램이 읽을 수 있는 형태로 바꿔 줄 뿐입니다.</div>`,
      foot: '여기서 LLM이 자유롭게 말하게 두면 안 됩니다 — 반드시 정해진 형식(JSON)으로 답하게 해야 합니다.',
      nar: `여기서 엘엘엠의 역할을 정확히 이해하셔야 합니다. 엘엘엠은 로봇을 움직이지 않습니다. 사람의 말을 프로그램이 읽을 수 있는 형태로 바꿔 주는 통역사일 뿐입니다. 파란 블록을 상자에 넣어 달라는 말을 받으면, 동작은 픽앤플레이스, 대상 색은 블루, 목적지는 박스라는 구조화된 데이터를 내놓습니다. 그 다음부터는 우리가 이미 만들어 둔 파이프라인이 돌아갑니다. 색으로 찾고, 좌표 구하고, 역기구학 풀고, 집습니다. 그리고 중요한 것. 엘엘엠이 자유롭게 문장으로 답하게 두면 안 됩니다. 반드시 정해진 형식으로 답하게 해야 프로그램이 읽을 수 있습니다.` },

    { eb: 'Three Fallbacks', h: '세 단계 폴백 구조',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">1순위</span><span class="t">OpenAI API</span><span class="d">가장 똑똑. 유료·클라우드. 키는 <strong>환경변수</strong>로 (코드에 넣지 마세요)</span></div>
        <div class="card"><span class="n">2순위</span><span class="t">Ollama (로컬)</span><span class="d">무료·오프라인. <code>ollama pull llama3</code> 후 localhost:11434</span></div>
        <div class="card"><span class="n">3순위</span><span class="t">규칙기반</span><span class="d">"파란"이라는 단어가 있으면 blue. 항상 동작합니다</span></div>
      </div>
      <pre style="margin-top:2.4cqh"><span class="p">$</span> setx OPENAI_API_KEY "sk-여기에키"      <span class="c"># CMD (영구)</span>
<span class="p">$</span> $env:OPENAI_API_KEY="sk-여기에키"       <span class="c"># PowerShell (현재 창)</span></pre>`,
      foot: 'API 키를 코드에 직접 쓰면 그대로 GitHub에 올라갑니다. 실무에서 가장 흔한 사고입니다.',
      nar: `실습 코드는 세 단계 폴백 구조로 되어 있습니다. 오픈에이아이 키가 있으면 그걸 쓰고, 없으면 로컬에 설치된 올라마를 쓰고, 그것도 없으면 규칙기반으로 동작합니다. 규칙기반은 파란이라는 단어가 들어 있으면 블루라고 판단하는 단순한 방식인데, 대신 항상 동작합니다. 그래서 인터넷이 안 되거나 키가 없어도 수업에는 지장이 없습니다. 그리고 꼭 지켜 주셔야 할 것. 에이피아이 키를 코드에 직접 쓰지 마십시오. 환경변수로 넣으셔야 합니다. 코드에 키를 써 뒀다가 그대로 깃허브에 올리는 사고가 실무에서 가장 흔합니다.` },

    { eb: 'Hallucination', h: '없는 물건을 집으라고 하면',
      sub: 'LLM 연동에서 가장 중요한 설계 포인트입니다.',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card warn"><span class="n">나쁜 설계</span><span class="t">자유롭게 답하게 둔다</span><span class="d">"노란 공을 집어줘" → LLM: <code>{"target_color":"yellow"}</code><br>노란 물체가 없는데 로봇이 헤매거나 엉뚱한 곳으로 갑니다</span></div>
        <div class="card"><span class="n">좋은 설계</span><span class="t">있는 것만 알려주고 고르게 한다</span><span class="d">"지금 테이블에 red, blue, green 이 있다. 이 중에서만 골라라"<br>→ 없으면 <code>{"error":"없음"}</code>을 내놓게 합니다</span></div>
      </div>
      <div class="banner" style="margin-top:2.4cqh">선택지를 좁히는 것이 환각을 막는 가장 확실한 방법입니다.</div>`,
      foot: 'lab5_3_choose_and_pick.py — 빨강·파랑·초록 3개 중에서만 고르게 합니다.',
      nar: `엘엘엠 연동에서 가장 중요한 설계 포인트입니다. 엘엘엠에게 자유롭게 답하게 두면 없는 물건을 집으라고 합니다. 노란 공을 집어 달라고 했을 때, 테이블에 노란 물체가 없는데도 엘엘엠은 옐로우라고 답합니다. 그러면 로봇이 헤매거나 엉뚱한 곳으로 갑니다. 해법은 간단합니다. 프롬프트에 지금 테이블에 있는 것 목록을 넣고 이 중에서만 고르라고 하는 겁니다. 없으면 없다고 답하라고 명시합니다. 선택지를 좁히는 것이 환각을 막는 가장 확실한 방법입니다. 실습 파일 랩오삼에서 빨강 파랑 초록 세 개 중에서만 고르게 하는 것이 바로 이 설계입니다.` },

    { eb: 'Full Loop', h: '말 → 무엇을 → 어디에 → 집기',
      sub: 'lab5_3 — 물체가 3개면 로봇은 세 가지를 연달아 풀어야 합니다.',
      body: `<div class="rowlist" style="margin-top:1.2cqh">
        <div class="row"><span class="dot">1</span><span class="t">무엇을? (말 → 색)</span><span class="d">LLM이 "파란"을 blue로. 없는 색은 거부</span></div>
        <div class="row"><span class="dot">2</span><span class="t">어디에 있나? (카메라)</span><span class="d">시뮬 카메라로 파란 픽셀을 찾고 깊이로 3D 좌표 복원</span></div>
        <div class="row"><span class="dot">3</span><span class="t">간다 (IK + 그리퍼)</span><span class="d">그 좌표로 손끝을 보내 집고 상자에 넣는다</span></div>
      </div>
      <div class="bannerG" style="margin-top:2.4cqh">★ 로봇은 큐브의 '진짜 좌표'를 보지 않습니다. 카메라로 찍은 사진에서 찾아냅니다.</div>`,
      foot: 'MuJoCo는 실행 중에 물체를 추가할 수 없습니다 — MJCF 문자열을 조립해 다시 로드합니다.',
      nar: `랩오삼이 오늘 오전의 종합 실습입니다. 물체가 세 개 놓여 있어서 로봇이 세 가지를 연달아 풀어야 합니다. 무엇을 집을지를 말에서 뽑아내고, 그게 어디 있는지를 카메라로 찾고, 그 좌표로 가서 집습니다. 여기서 별표 친 부분이 중요합니다. 로봇은 큐브의 진짜 좌표를 훔쳐보지 않습니다. 시뮬레이터 안 카메라로 찍은 사진에서 그 색을 찾아 깊이로 삼차원 좌표를 복원해 씁니다. 어제 배운 방법 그대로입니다. 참고로 무조코는 실행 중에 물체를 새로 만들 수 없어서, 필요한 물체를 엑스엠엘 조각으로 만들어 불러올 때 끼워 넣습니다.` },

    { section: true, eb: 'Block 3 · 13:50–15:40', h: '학습의 원리',
      sub: '여기서 주제가 크게 바뀝니다. 이제 로봇이 스스로 배웁니다.',
      nar: `세 번째 블록입니다. 여기서 주제가 크게 바뀝니다. 지금까지는 우리가 로봇에게 무엇을 하라고 알려 줬습니다. 이제부터는 로봇이 스스로 배웁니다.` },

    { eb: 'Deep Learning', h: '신경망은 어떻게 배우나',
      sub: '예측하고 · 얼마나 틀렸는지 재고 · 덜 틀리는 쪽으로 조금 고친다',
      body: `<div class="rowlist" style="margin-top:1.2cqh">
        <div class="row"><span class="dot">1</span><span class="t">예측 (Forward)</span><span class="d">입력을 신경망에 넣어 출력을 계산</span></div>
        <div class="row"><span class="dot">2</span><span class="t">손실 (Loss)</span><span class="d">출력과 정답의 차이를 하나의 숫자로</span></div>
        <div class="row"><span class="dot">3</span><span class="t">역전파 (Backprop)</span><span class="d">각 가중치가 손실에 얼마나 기여했는지(기울기)를 계산</span></div>
        <div class="row"><span class="dot">4</span><span class="t">갱신 (Update)</span><span class="d">기울기 반대 방향으로 조금 이동 — 얼마나? 학습률만큼</span></div>
      </div>
      <div class="bannerG" style="margin-top:2cqh">안개 속에서 산을 내려가는 것과 같습니다. 발밑 경사만 보고 낮은 쪽으로 한 걸음씩.</div>`,
      foot: '어제 만든 IK도 같은 구조였습니다 — 오차를 보고 조금 다가가고 다시 보기.',
      nar: `신경망 학습은 네 단계 루프입니다. 입력을 넣어 출력을 계산하고, 정답과 얼마나 틀렸는지를 손실이라는 숫자 하나로 재고, 각 가중치가 그 손실에 얼마나 기여했는지를 계산하고, 덜 틀리는 방향으로 조금 고칩니다. 세 번째 단계가 역전파이고, 네 번째에서 얼마나 움직일지를 정하는 것이 학습률입니다. 비유하자면 안개 속에서 산을 내려가는 것과 같습니다. 전체 지형은 안 보이고 발밑 경사만 보이는데, 낮은 쪽으로 한 걸음씩 가면 결국 골짜기에 도착합니다. 이걸 경사하강법이라고 부릅니다. 재미있는 건 어제 만든 역기구학도 완전히 같은 구조였다는 겁니다. 오차 보고 조금 다가가고 다시 보기.` },

    { eb: 'RL', h: '정답이 없으면 어떻게 배우나',
      sub: '지도학습은 정답으로, 강화학습은 보상으로 배웁니다.',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">지도학습</span><span class="t">정답 라벨</span><span class="d">"이 사진은 고양이다" — Day 2 YOLO 학습이 이것이었습니다</span></div>
        <div class="card"><span class="n">강화학습</span><span class="t">보상 점수</span><span class="d">"앞으로 갔으면 +, 넘어졌으면 −" — 어떻게 걸어야 하는지는 아무도 안 알려줍니다</span></div>
      </div>
      <div class="banner" style="margin-top:2.4cqh">걷는 법에는 '정답 라벨'이 없습니다. 그래서 보행은 강화학습으로 배웁니다.</div>`,
      foot: '공통점: 둘 다 신경망 + 경사하강법입니다. 학습 신호가 정답이냐 보상이냐만 다릅니다.',
      nar: `그런데 문제가 있습니다. 걷는 법에는 정답 라벨이 없습니다. 왼쪽 다리를 정확히 몇 도로 들어야 한다는 정답을 누가 알려 줄 수 있겠습니까. 그래서 강화학습이 필요합니다. 정답 대신 보상을 씁니다. 앞으로 갔으면 플러스 점수, 넘어졌으면 마이너스 점수를 주고, 로봇이 알아서 점수를 높이는 방법을 찾게 합니다. 어떻게 걸어야 하는지는 아무도 안 알려 줍니다. 중요한 공통점이 있습니다. 지도학습이든 강화학습이든 둘 다 신경망을 경사하강법으로 고칩니다. 학습 신호가 정답이냐 보상이냐만 다를 뿐 원리는 같습니다.` },

    { eb: 'Vocabulary', h: '용어 다섯 개만 알면 됩니다',
      body: `<div class="stack" style="margin-top:1.4cqh">
        <div class="lay"><b>환경</b><span>로봇과 물리 세계 (MuJoCo). 행동을 받아 다음 상태와 보상을 돌려줍니다</span></div>
        <div class="lay" style="background:var(--soft)"><b>관측</b><span>에이전트가 보는 것 — 관절 각도·속도 등. HalfCheetah는 17개 숫자</span></div>
        <div class="lay" style="background:var(--soft)"><b>행동</b><span>에이전트의 결정 — 각 관절에 주는 토크. HalfCheetah는 6개 숫자</span></div>
        <div class="lay" style="background:var(--soft)"><b>보상</b><span>잘했는지 알려주는 점수 — 전진 속도↑, 넘어지면↓</span></div>
        <div class="lay" style="background:var(--sand);border-color:#E7CDBF"><b>정책</b><span>관측 → 행동을 정하는 신경망. <strong>RL이 학습하는 대상이 바로 이것</strong></span></div>
      </div>`,
      foot: '학습 루프: 관측 → 행동 → 보상 + 다음 관측 → 정책 개선 … 반복',
      nar: `용어 다섯 개만 알면 됩니다. 환경은 로봇과 물리 세계입니다. 우리는 무조코를 씁니다. 관측은 에이전트가 보는 것인데 관절 각도와 속도 같은 숫자들입니다. 하프치타의 경우 열일곱 개 숫자입니다. 행동은 에이전트의 결정인데 각 관절에 주는 토크입니다. 하프치타는 여섯 개입니다. 보상은 잘했는지 알려 주는 점수입니다. 그리고 정책이 가장 중요합니다. 관측을 받아 행동을 정하는 신경망인데, 강화학습이 학습하는 대상이 바로 이 정책입니다. 학습 루프는 관측하고, 행동하고, 보상과 다음 관측을 받고, 정책을 조금 고치는 것의 반복입니다.` },

    { eb: 'PPO vs SAC', h: '알고리즘은 두 개만 씁니다',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">PPO</span><span class="t">안정적 · 범용</span><span class="d">처음 배우기 좋고 튜닝이 쉽습니다. 막대 세우기 같은 단순 과제에 적합</span></div>
        <div class="card"><span class="n">SAC</span><span class="t">표본 효율이 높다</span><span class="d">같은 경험으로 더 많이 배웁니다. 보행·이동 같은 연속 제어에 강합니다</span></div>
      </div>
      <div class="bannerG" style="margin-top:2.4cqh">막대 세우기 = PPO · 치타 달리기 = SAC — 오늘은 이 조합만 기억하면 됩니다.</div>`,
      foot: '둘 다 MlpPolicy(다층 신경망) + 경사하강으로 학습합니다. 원리는 같습니다.',
      nar: `알고리즘은 두 개만 씁니다. 피피오는 안정적이고 범용적입니다. 처음 배우기 좋고 튜닝이 쉽습니다. 에스에이씨는 표본 효율이 높습니다. 같은 경험으로 더 많이 배운다는 뜻인데, 보행이나 이동처럼 연속적인 제어에 강합니다. 오늘은 이 조합만 기억하십시오. 막대 세우기는 피피오, 치타 달리기는 에스에이씨입니다. 둘 다 다층 신경망을 경사하강으로 학습한다는 점은 같습니다.` },

    { section: true, eb: 'Block 4 · 15:50–17:40', h: '강화학습 첫 실습',
      sub: '가벼운 것으로 먼저 성공하고, 무거운 것은 걸어 두고 퇴근합니다.',
      nar: `마지막 블록입니다. 강화학습을 직접 돌립니다. 시간 관리가 중요한 블록입니다.` },

    { eb: 'Before Training', h: '학습이 없으면 로봇은 아무것도 못 합니다',
      sub: 'python rl_understand_env.py --env InvertedPendulum-v5',
      body: `<pre style="margin-top:1.4cqh"><span class="c"># 학습하지 않고 무작위 행동만 넣어 봅니다</span>
<span class="p">$</span> python rl_understand_env.py --env InvertedPendulum-v5 --render

<span class="o">관측 공간: Box(4,)        ← 카트 위치·속도, 막대 각도·각속도
행동 공간: Box(1,)        ← 카트에 주는 힘
평균 보상: 18.3           ← 막대가 금방 쓰러진다</span></pre>
      <div class="bannerG" style="margin-top:2.4cqh">먼저 '못 하는 상태'를 봐야 학습의 효과가 보입니다.</div>`,
      foot: 'Day 3에서 로봇개가 쓰러지던 것과 같은 상황입니다.',
      nar: `학습을 시작하기 전에 먼저 못 하는 상태를 봅니다. 무작위 행동만 넣어 보면 막대가 금방 쓰러지고 보상이 낮게 나옵니다. 여기서 관측 공간과 행동 공간의 크기도 확인하십시오. 인버티드펜듈럼은 관측이 네 개, 행동이 하나입니다. 카트 위치와 속도, 막대 각도와 각속도를 보고, 카트에 줄 힘 하나를 정합니다. 셋째 날에 로봇개가 쓰러지던 것과 정확히 같은 상황입니다. 관절을 움직일 줄은 아는데 어떻게 움직여야 하는지를 모르는 상태입니다.` },

    { eb: 'First Success', h: '막대 세우기 — 몇 분이면 됩니다',
      body: `<pre style="margin-top:1.4cqh"><span class="p">$</span> python rl_train.py --env InvertedPendulum-v5 --algo ppo --steps 50000
<span class="c"># ... 수 분 후</span>
<span class="o">평균 보상: 1000.0   ← 막대를 계속 세우고 있다</span>

<span class="p">$</span> python rl_enjoy.py --env InvertedPendulum-v5 --algo ppo</pre>
      <div class="grid g2" style="margin-top:2.4cqh">
        <div class="card"><span class="n">보상 설계</span><span class="t">막대가 서 있으면 +1</span><span class="d">매 스텝마다 1점. 쓰러지면 에피소드 끝 → 오래 버틸수록 총점이 높습니다</span></div>
        <div class="card"><span class="n">결과</span><span class="t">1000점</span><span class="d">1000 스텝 동안 한 번도 안 쓰러졌다는 뜻입니다</span></div>
      </div>`,
      foot: '아주 단순한 보상 하나가 "막대를 세운다"는 행동을 만들어 냈습니다.',
      nar: `첫 학습은 가벼운 걸로 합니다. 인버티드펜듈럼은 카트 위의 막대를 쓰러뜨리지 않는 과제인데, 오만 스텝이면 수 분 만에 끝납니다. 보상 설계가 아주 단순합니다. 막대가 서 있으면 매 스텝마다 일 점입니다. 쓰러지면 에피소드가 끝나니까 오래 버틸수록 총점이 높아집니다. 학습이 끝나고 인조이로 보면 막대를 꼿꼿이 세우고 있습니다. 이 단순한 보상 하나가 막대를 세운다는 행동을 만들어 낸 겁니다. 아무도 어떻게 세우라고 알려 주지 않았는데요.` },

    { eb: 'Long Run', h: '치타 달리기는 걸어 두고 퇴근합니다',
      body: `<pre style="margin-top:1.4cqh"><span class="c"># ① 지금 걸어 두고 → 내일 아침에 회수</span>
<span class="p">$</span> python rl_train.py --env HalfCheetah-v5 --algo sac --steps 300000

<span class="c"># ② 학습이 도는 동안 사전 배포된 정책으로 결과 먼저 감상</span>
<span class="p">$</span> python rl_enjoy.py --env HalfCheetah-v5 --algo sac
<span class="p">$</span> python rl_enjoy.py --env Ant-v5 --algo sac</pre>
      <div class="grid g3" style="margin-top:2.4cqh">
        <div class="card"><span class="n">HalfCheetah</span><span class="t">관측 17 · 행동 6</span><span class="d">보상 = 전진 속도</span></div>
        <div class="card"><span class="n">Ant</span><span class="t">4족 보행</span><span class="d">Day 3의 로봇개와 같은 구조</span></div>
        <div class="card"><span class="n">Hopper</span><span class="t">외발 뛰기</span><span class="d">균형 잡기가 특히 어렵습니다</span></div>
      </div>`,
      foot: 'Day 3에서 쓰러지던 로봇개 — 이것을 RL이 스스로 해결합니다. 실제 Unitree Go2도 같은 원리입니다.',
      nar: `치타 달리기는 훨씬 무겁습니다. 삼십만 스텝이면 수십 분이 걸립니다. 그래서 지금 걸어 두고 내일 아침에 결과를 회수합니다. 학습이 도는 동안 놀지 마시고, 미리 배포해 드린 학습 완료 정책으로 결과를 먼저 보십시오. 하프치타가 달리는 것, 앤트가 네 다리로 걷는 것을 볼 수 있습니다. 여기서 셋째 날을 떠올리십시오. 로봇개가 계속 쓰러졌었죠. 앤트는 같은 사족 구조인데 강화학습으로 걷습니다. 실제 유니트리 고투의 보행도 정확히 같은 원리로 만들어집니다. 내일 그 이야기를 마저 하겠습니다.` }
  ],

  assignment: {
    title: '통합 파이프라인 시연과 학습 로그',
    lede: '본 것을 집는 전체 흐름을 완성하고, 첫 강화학습 결과를 기록합니다.',
    subtitle: '학습 로그는 보상이 올라가는 구간이 보이도록 캡처할 것',
    items: [
      'ArUco 또는 --sim 모드로 집기 성공 영상',
      '인식 오차를 키웠을 때 집히는 한계값',
      '자연어 명령 3개 실행 결과 (색 3종)',
      '없는 색을 시켰을 때의 동작 + 방지 설계 설명',
      'InvertedPendulum 학습 전/후 평균 보상',
      'HalfCheetah 학습 시작 로그 (내일 회수)'
    ],
    note: '2번이 오늘의 핵심입니다. 좌표에 일부러 오차를 더해 가며(1cm, 2cm, 3cm…) 언제부터 집히지 않는지 찾고, 그 값이 그리퍼 폭과 어떤 관계인지 쓰세요.',
    sample: `<span class="o">학번 / 이름 : 20261234 / 홍길동

2. 인식 오차 한계 실험
   오차 +0.5cm → 집힘      오차 +1.0cm → 집힘
   오차 +1.5cm → 집힘(아슬)  오차 +2.0cm → 실패(밀림)
   그리퍼 열림 폭 4.0cm, 큐브 한 변 2.5cm → 여유 편측 0.75cm
   해석 : 실험값 1.5cm가 이론 여유 0.75cm보다 큰 이유는
          손가락이 닫히며 큐브를 중앙으로 밀어 넣는 효과 때문</span>`,
    nar: `과제입니다. 두 번째가 오늘의 핵심입니다. 카메라가 준 좌표에 일부러 오차를 더해 보십시오. 일 센티, 이 센티, 삼 센티로 늘려 가며 언제부터 집히지 않는지 찾고, 그 값이 그리퍼 폭과 물체 크기의 차이와 어떤 관계인지 써 보십시오. 이게 실무에서 인식 정확도 목표를 정하는 방식입니다. 그리고 여섯 번째, 하프치타 학습을 반드시 걸어 두고 퇴근하십시오. 내일 아침 첫 시간에 그 결과를 씁니다.` },

  wrap: {
    done: '나흘 동안 따로 만든 눈과 몸을 이었고, 말로 시키면 알아듣게 만들었고, 로봇이 스스로 배우기 시작했습니다.',
    next: '내일 · Day 6 — 강화학습과 Isaac, 스스로 배우는 로봇',
    nextDesc: '어젯밤 걸어 둔 치타를 회수하고, 보상 설계가 행동을 어떻게 바꾸는지 실험합니다. 그리고 Isaac Sim에서 수백 개 환경을 동시에 굴리는 대규모 학습과 Sim-to-Real을 봅니다. 마지막은 최종 프로젝트입니다.',
    nar: `오늘 한 일을 정리하겠습니다. 카메라가 본 좌표를 로봇 좌표로 옮겨 실제로 물체를 집었고, 오차가 있어도 여유 안에 있으면 집힌다는 것을 확인했습니다. 자연어 명령을 엘엘엠으로 해석해 로봇을 움직였고, 환각을 막는 설계도 배웠습니다. 그리고 오후에는 신경망이 어떻게 배우는지, 강화학습이 무엇인지를 배우고 직접 학습을 시켰습니다. 내일은 걸어 둔 치타를 회수하는 것으로 시작합니다. 보상 설계를 바꾸면 행동이 어떻게 달라지는지 실험하고, 아이작 심에서 수백 개 환경을 동시에 굴리는 대규모 학습을 보고, 마지막에는 엿새 동안 배운 것을 모아 최종 프로젝트를 만듭니다. 수고하셨습니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '인식 · 판단 · 행동을 하나로',
    standfirst: '오늘 오전은 조립입니다. 나흘 동안 만든 부품을 하나로 잇습니다. 오후에는 전혀 다른 이야기가 시작됩니다 — 우리가 알려주지 않아도 스스로 배우는 로봇입니다. <strong>마지막 미션의 장기 학습은 반드시 걸어 두고 퇴실하세요.</strong>',
    rules: [
      ['오차를 두려워하지 않는다', '인식은 항상 틀립니다. 중요한 것은 "얼마나 틀려도 되는가"입니다. 오늘 그 한계를 숫자로 찾습니다.'],
      ['LLM에게 선택지를 준다', '자유롭게 답하게 두면 없는 물건을 집으라고 합니다. 있는 것만 알려주고 그 안에서 고르게 하세요.'],
      ['가벼운 것으로 먼저 성공한다', 'RL은 기다림의 연속입니다. InvertedPendulum으로 성공을 맛본 뒤 무거운 과제로 갑니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '본 위치로 가서 집기', time: '09:00–10:50',
        lede: '웹캠 + 인쇄 마커, 또는 웹캠 없이 시뮬 카메라 — 둘 중 하나로 진행합니다.',
        missions: [
          { n: 1, h: 'ArUco 마커로 위치 찾기', body: `
      <pre><span class="p">$</span> python lab5_1_aruco_robot.py           <span class="c"># ① 웹캠 + 인쇄 마커</span>
<span class="p">$</span> python lab5_1_aruco_robot.py --sim     <span class="c"># ② 웹캠 없이 시뮬 카메라</span></pre>
      <p>웹캠 모드는 마커(4x4_50, ID 0)를 비추면 3D 위치가 계산됩니다. 영상 창에서 <code>p</code> = 그 위치로 집기, <code>q</code> = 종료.</p>
      <div class="box check"><span class="lbl">왜 마커 한 장으로 거리를 알 수 있나</span>
        <p>마커의 <strong>실제 한 변 길이를 우리가 알고 있기 때문</strong>입니다. 화면에 작게 찍혔으면 멀리, 크게 찍혔으면 가까이 있는 것입니다. 어제 배운 "깊이 없이는 3D를 못 구한다"의 예외처럼 보이지만, 사실은 <strong>크기를 미리 알고 있는 것</strong>이 깊이 정보를 대신합니다.</p></div>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>마커를 기울이면 어떻게 되나요? <code>solvePnP</code>는 위치뿐 아니라 <strong>자세(회전)</strong>도 돌려줍니다. 화면에 그려지는 축(x·y·z)이 마커를 따라 도는지 보세요.</p></div>` },

          { n: 2, h: '오차의 한계 찾기 ★ 오늘의 핵심', body: `
      <p><code>--sim</code> 모드는 큐브를 <strong>진짜 위치에 그대로 두고</strong>, 로봇만 '카메라가 본 좌표'로 보냅니다. 그래서 오차의 효과를 눈으로 볼 수 있습니다.</p>
      <p>코드에서 목표 좌표에 <strong>일부러 오차를 더해</strong> 언제부터 실패하는지 찾으세요.</p>
      <pre>target = detected_pos + np.array([<span class="o">0.005</span>, 0, 0])   <span class="c"># +5mm</span>
target = detected_pos + np.array([<span class="o">0.010</span>, 0, 0])   <span class="c"># +1cm</span>
target = detected_pos + np.array([<span class="o">0.020</span>, 0, 0])   <span class="c"># +2cm</span>
target = detected_pos + np.array([<span class="o">0.030</span>, 0, 0])   <span class="c"># +3cm</span></pre>
      <div class="box q"><span class="lbl">기록할 것</span><ul>
        <li>집히는 최대 오차는 몇 cm인가?</li>
        <li>그리퍼 열림 폭과 큐브 한 변의 차이는 얼마인가? (MJCF에서 확인)</li>
        <li>둘 사이에 어떤 관계가 있는가?</li>
      </ul></div>
      <div class="box check"><span class="lbl">실무 감각</span>
        <p>"인식 정확도를 얼마나 올려야 하나?"가 아니라 <strong>"여유가 얼마나 되나?"</strong>를 먼저 묻습니다. 허용 오차에서 요구 정확도를 역산하는 것이 실무의 순서입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '말로 시키는 로봇', time: '11:00–12:50',
        lede: 'LLM이 없어도 규칙기반으로 항상 동작합니다. 없다고 막히지 마세요.',
        missions: [
          { n: 3, h: '자연어 명령 실행', body: `
      <pre><span class="p">$</span> python lab5_2_voice_command.py
<span class="p">$</span> python lab5_2_voice_command.py "파란 블록을 상자에 넣어줘"
<span class="p">$</span> python lab5_2_voice_command.py "로봇팔을 좌우로 흔들어줘"</pre>
      <p>실행하면 어떤 경로를 탔는지 표시됩니다: <code>[LLM: OpenAI]</code> / <code>[LLM: Ollama]</code> / <code>[규칙기반]</code></p>
      <div class="box check"><span class="lbl">LLM의 역할</span>
        <p>LLM은 로봇을 움직이지 않습니다. <strong>사람의 말을 프로그램이 읽을 수 있는 형태로 바꿔줄 뿐</strong>입니다.</p>
        <pre style="margin-top:8px">"파란 블록을 상자에 넣어줘"
  ↓ LLM
{ "action": "pick_and_place", "target_color": "blue", "destination": "box" }
  ↓ 이미 만들어 둔 파이프라인
색 탐색 → 3D 좌표 → IK → 집기</pre></div>` },

          { n: 4, h: '(선택) 실제 LLM 연결하기', body: `
      <p>셋 중 하나만 되면 됩니다. 시도 순서는 <strong>OpenAI → Ollama → 규칙기반</strong>입니다.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">OpenAI</span><span class="v"><code>pip install openai</code> 후 키를 환경변수로<small>유료·클라우드. 가장 똑똑합니다</small></span></div>
        <div class="dlrow"><span class="k">Ollama</span><span class="v">ollama.com에서 설치 → <code>ollama pull llama3</code><small>무료·로컬. 인터넷·과금 없음</small></span></div>
        <div class="dlrow"><span class="k">규칙기반</span><span class="v">아무것도 안 해도 동작<small>"파란"이라는 단어를 찾습니다</small></span></div>
      </div>
      <pre><span class="c"># CMD — 영구 등록</span>
<span class="p">$</span> setx OPENAI_API_KEY "sk-여기에키"
<span class="c"># PowerShell — 현재 창만</span>
<span class="p">$</span> $env:OPENAI_API_KEY="sk-여기에키"</pre>
      <div class="box warn"><span class="lbl">절대 하지 마세요</span>
        <p>API 키를 <strong>코드에 직접 쓰지 마세요.</strong> 그대로 GitHub에 올라가는 사고가 실무에서 가장 흔합니다. 반드시 환경변수로.</p></div>` },

          { n: 5, h: '여러 개 중에 골라 집기 ★', body: `
      <pre><span class="p">$</span> python lab5_3_choose_and_pick.py
<span class="p">$</span> python lab5_3_choose_and_pick.py "빨간 블록을 상자에 넣어줘"</pre>
      <p>빨강·파랑·초록 3개가 놓여 있습니다. 로봇이 <strong>세 단계를 연달아</strong> 풀어야 합니다.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">1단계</span><span class="v">무엇을? — 말에서 색을 뽑아낸다<small>LLM 또는 규칙기반</small></span></div>
        <div class="dlrow"><span class="k">2단계</span><span class="v">어디에? — 카메라로 그 색을 찾아 3D 좌표 복원<small>어제 배운 역투영 그대로</small></span></div>
        <div class="dlrow"><span class="k">3단계</span><span class="v">간다 — IK로 손끝을 보내고 집어 상자에<small>어제 만든 것</small></span></div>
      </div>
      <div class="box check"><span class="lbl">중요</span>
        <p>로봇은 큐브의 <strong>진짜 좌표를 훔쳐보지 않습니다.</strong> 시뮬 카메라로 찍은 사진에서 색을 찾아 깊이로 3D를 복원해 씁니다. 그래서 오차가 있고, 그래서 미션 2가 중요했습니다.</p></div>
      <p>세 색을 차례로 명령해 보세요. 색마다 놓는 자리가 달라 서로 쌓이지 않습니다.</p>` },

          { n: 6, h: '환각 만들어 보기 ★', body: `
      <p>테이블에 <strong>없는 색</strong>을 시켜 보세요.</p>
      <pre><span class="p">$</span> python lab5_3_choose_and_pick.py "노란 블록을 상자에 넣어줘"
<span class="p">$</span> python lab5_3_choose_and_pick.py "고양이를 집어줘"</pre>
      <div class="box q"><span class="lbl">관찰</span><ul>
        <li>로봇이 어떻게 반응하나요? 거부하나요, 헤매나요?</li>
        <li>코드에서 LLM에게 보내는 <strong>프롬프트</strong>를 찾아보세요. 무엇이 들어 있나요?</li>
      </ul></div>
      <div class="box check"><span class="lbl">환각을 막는 설계</span>
        <p><strong>나쁜 방법</strong>: "사용자가 원하는 색을 알려줘" → 없는 색도 자신 있게 답합니다<br>
        <strong>좋은 방법</strong>: "지금 테이블에 red, blue, green이 있다. <strong>이 중에서만</strong> 고르고, 없으면 error를 반환하라"</p>
        <p style="margin-top:8px">선택지를 좁히는 것이 환각을 막는 가장 확실한 방법입니다. 이것이 LLM을 실제 시스템에 붙일 때의 기본기입니다.</p></div>` },

          { n: 7, h: '(선택) 음성으로 명령하기', body: `
      <pre><span class="p">$</span> pip install sounddevice faster-whisper
<span class="p">$</span> python lab5_2_voice_command.py --voice</pre>
      <p><code>[마이크] 말하세요… (4초 녹음)</code>가 뜨면 명령을 말합니다. 흐름은 <strong>마이크 → STT → LLM → 로봇</strong>입니다.</p>
      <div class="box warn"><span class="lbl">첫 실행</span><p>음성인식 모델(small)을 자동 다운로드하므로 시간이 걸립니다. 무거우면 <code>base</code>로 낮추세요.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '학습의 원리 이해하기', time: '13:50–15:40',
        lede: '여기서 주제가 바뀝니다. rl 환경으로 전환하세요.',
        missions: [
          { n: 8, h: '환경 전환과 설치 확인', body: `
      <pre><span class="p">$</span> conda activate rl
<span class="p">$</span> python -c "import gymnasium, mujoco, stable_baselines3; print('OK')"
<span class="o">OK</span>
<span class="p">$</span> cd RL실습폴더경로</pre>
      <div class="box check"><span class="lbl">개념 정리 — 이것만 붙잡으세요</span>
        <p><strong>신경망 학습 4단계</strong>: 예측 → 손실(얼마나 틀렸나) → 역전파(각 가중치의 책임) → 갱신(덜 틀리는 쪽으로 조금)<br>
        안개 속에서 발밑 경사만 보고 산을 내려가는 것 = <strong>경사하강법</strong></p>
        <p style="margin-top:8px"><strong>어제 만든 IK도 같은 구조였습니다</strong> — 오차 보고 → 조금 다가가고 → 다시 보기.</p></div>` },

          { n: 9, h: '학습 전 환경 체험 ★', body: `
      <p>아직 학습하지 않고 <strong>무작위 행동</strong>만 넣어 봅니다.</p>
      <pre><span class="p">$</span> python rl_understand_env.py --env InvertedPendulum-v5 --render
<span class="o">관측 공간: Box(4,)     ← 카트 위치·속도, 막대 각도·각속도
행동 공간: Box(1,)     ← 카트에 주는 힘
평균 보상: 18.3        ← 막대가 금방 쓰러진다</span></pre>
      <div class="box q"><span class="lbl">용어를 화면과 맞춰 보세요</span><ul>
        <li><strong>환경</strong> = MuJoCo 물리 세계 (카트와 막대)</li>
        <li><strong>관측</strong> = 4개 숫자 — 에이전트가 보는 전부</li>
        <li><strong>행동</strong> = 1개 숫자 — 카트를 좌우로 미는 힘</li>
        <li><strong>보상</strong> = 막대가 서 있으면 매 스텝 +1</li>
        <li><strong>정책</strong> = 관측 → 행동을 정하는 신경망 (지금은 무작위)</li>
      </ul></div>
      <div class="box check"><span class="lbl">Day 3을 떠올리세요</span>
        <p>로봇개가 계속 쓰러졌던 그 상황과 같습니다. 관절을 움직일 줄은 아는데 <strong>어떻게</strong> 움직여야 하는지를 모릅니다.</p></div>` },

          { n: 10, h: '다른 환경도 둘러보기', body: `
      <pre><span class="p">$</span> python rl_understand_env.py --env HalfCheetah-v5
<span class="o">관측 공간: Box(17,)   행동 공간: Box(6,)</span>
<span class="p">$</span> python rl_understand_env.py --env Ant-v5
<span class="o">관측 공간: Box(105,)  행동 공간: Box(8,)</span></pre>
      <div class="box q"><span class="lbl">확인 질문</span><ul>
        <li>Ant의 관측이 105개나 되는 이유는? (힌트: 다리 4개 × 관절 2개, 그리고 접촉력)</li>
        <li>관측과 행동의 개수가 많아지면 학습은 쉬워질까요, 어려워질까요?</li>
      </ul></div>` }
        ]
      },
      {
        pn: 'PART 4', h: '강화학습 첫 실습', time: '15:50–17:40',
        lede: '가벼운 것으로 성공하고, 무거운 것은 걸어 둡니다. 시간 관리가 핵심입니다.',
        missions: [
          { n: 11, h: '막대 세우기 학습 — 첫 성공', body: `
      <pre><span class="p">$</span> python rl_train.py --env InvertedPendulum-v5 --algo ppo --steps 50000</pre>
      <p>수 분이면 끝납니다. 로그에서 <code>ep_rew_mean</code>이 올라가는 것을 지켜보세요.</p>
      <pre><span class="o">| ep_rew_mean    | 23.1   |   ← 처음
| ep_rew_mean    | 187.4  |   ← 중간
| ep_rew_mean    | 1000.0 |   ← 완료</span></pre>
      <pre><span class="p">$</span> python rl_enjoy.py --env InvertedPendulum-v5 --algo ppo</pre>
      <div class="box check"><span class="lbl">무슨 일이 일어났나</span>
        <p>보상은 단 하나였습니다 — <strong>"막대가 서 있으면 +1"</strong>. 어떻게 세우라고는 아무도 알려주지 않았습니다. 그런데 정책이 스스로 방법을 찾았습니다.</p>
        <p style="margin-top:8px">1000점 = 1000스텝 동안 한 번도 안 쓰러졌다는 뜻입니다.</p></div>
      <div class="box q"><span class="lbl">과제 5번</span><p>학습 <strong>전</strong> 평균 보상(미션 9)과 <strong>후</strong> 평균 보상을 나란히 적으세요.</p></div>` },

          { n: 12, h: '치타 학습 걸어 두기 ★ 퇴실 전 필수', body: `
      <p><strong>지금 시작해서 내일 아침에 회수합니다.</strong> 수십 분이 걸립니다.</p>
      <pre><span class="p">$</span> python rl_train.py --env HalfCheetah-v5 --algo sac --steps 300000</pre>
      <div class="box warn"><span class="lbl">반드시 확인</span><ul>
        <li>터미널 창을 <strong>닫지 마세요</strong> (닫으면 학습이 중단됩니다)</li>
        <li>PC 절전 모드를 꺼 두세요</li>
        <li>시작 로그를 캡처하세요 — 과제 6번입니다</li>
      </ul></div>
      <div class="box check"><span class="lbl">왜 SAC인가</span>
        <p>PPO는 안정적이지만 표본 효율이 낮습니다. SAC는 같은 경험에서 더 많이 배워서 보행·이동 같은 <strong>연속 제어</strong>에 강합니다.<br>
        <strong>막대 세우기 = PPO · 치타 달리기 = SAC</strong> — 오늘은 이 조합만 기억하세요.</p></div>` },

          { n: 13, h: '학습이 도는 동안 — 완성된 결과 감상', body: `
      <p>강사가 배포한 <strong>사전학습 정책</strong>으로 결과를 먼저 봅니다. (<code>RL/models/</code>)</p>
      <pre><span class="p">$</span> python rl_enjoy.py --env HalfCheetah-v5 --algo sac
<span class="p">$</span> python rl_enjoy.py --env Ant-v5 --algo sac
<span class="p">$</span> python rl_enjoy.py --env Hopper-v5 --algo ppo</pre>
      <div class="box check"><span class="lbl">Day 3과 연결하세요 ★</span>
        <p>셋째 날 <code>robot_zoo.py dog</code>에서 로봇개가 계속 쓰러졌습니다. <strong>Ant</strong>는 같은 4족 구조인데 강화학습으로 걷습니다.</p>
        <p style="margin-top:8px">실제 Unitree Go2의 보행도 사람이 수식으로 짠 것이 아니라 <strong>정확히 이 원리</strong>로 학습된 것입니다. 내일 그 이야기를 마저 합니다.</p></div>
      <div class="box q"><span class="lbl">관찰</span>
        <p>HalfCheetah가 달리는 자세를 보세요. <strong>사람이 보기엔 이상한 자세</strong>일 수 있습니다. 왜 그럴까요? (힌트: 보상이 "전진 속도"뿐이라면, 보기 좋을 필요가 없습니다)</p></div>` }
        ]
      }
    ],
    errors: [
      ['ArUco 마커가 인식 안 됨', '딕셔너리 불일치 또는 인쇄 품질', '4x4_50 · ID 0 확인. 구겨지지 않게 평평히. 조명 확보'],
      ['웹캠이 없거나 안 열림', '카메라 미연결', '<code>--sim</code> 모드로 진행하면 웹캠 없이 전 과정 가능'],
      ['로봇이 엉뚱한 곳으로 감', '카메라→로봇 좌표 변환값 오류', '보정값은 예시값입니다. <code>--sim</code>에서 먼저 검증하세요'],
      ['<code>[규칙기반]</code>만 뜸', 'OpenAI 키·Ollama 둘 다 없음', '<strong>정상입니다.</strong> 수업 진행에 지장 없습니다'],
      ['<code>OPENAI_API_KEY</code>를 넣었는데 인식 안 됨', 'setx는 <strong>다음 창부터</strong> 적용', '터미널을 새로 열거나 <code>set</code>으로 현재 창에 등록'],
      ['<code>No module named gymnasium</code>', 'rl 환경이 아님', '<code>conda activate rl</code>'],
      ['RL 렌더 창이 안 뜸 / OpenGL 오류', '그래픽 드라이버 또는 원격 환경', '<code>--record</code>로 mp4 저장 후 확인'],
      ['학습이 너무 느림', '정상입니다', 'InvertedPendulum으로 성공 경험 후 HalfCheetah는 백그라운드로'],
      ['보상이 안 오름', 'steps 부족 또는 알고리즘 부적합', 'steps를 늘리거나 SAC로 바꾸세요'],
      ['<code>--record</code> 오류', 'moviepy 미설치', '<code>pip install moviepy</code>']
    ],
    checklist: [
      'ArUco 또는 시뮬 카메라로 찾은 위치로 로봇이 물체를 집었다',
      '마커 한 장으로 거리를 알 수 있는 이유를 설명할 수 있다',
      '<strong>오차를 키워 가며</strong> 집히는 한계값을 찾았다',
      '그 한계값이 그리퍼 여유와 어떤 관계인지 설명할 수 있다',
      '자연어 명령으로 지정한 색 블록을 집어 상자에 넣었다',
      'LLM이 "로봇을 움직이는 것"이 아니라 "말을 번역하는 것"임을 안다',
      '없는 색을 시켜 보고, 환각을 막는 설계를 설명할 수 있다',
      'API 키를 환경변수로 관리해야 하는 이유를 안다',
      '손실 · 경사하강 · 역전파를 각각 한 문장으로 말할 수 있다',
      '환경 · 관측 · 행동 · 보상 · 정책의 의미를 설명할 수 있다',
      '학습 전 무작위 행동의 낮은 보상을 직접 확인했다',
      'InvertedPendulum을 학습시켜 평균 보상 1000에 도달했다',
      '<strong>HalfCheetah 장기 학습을 걸어 두고 퇴실했다</strong>',
      'Day 3에서 쓰러지던 로봇개와 RL로 걷는 Ant의 차이를 안다'
    ]
  },

  /* ================= 퀴즈 ================= */
  quizTitle: '통합 파이프라인과 강화학습 입문 퀴즈',
  quiz: [
    { q: '"본 것을 집는" 파이프라인의 순서로 맞는 것은?',
      o: ['찾기 → 3D 복원 → 좌표 변환 → IK로 이동·파지', '찾기 → IK → 3D 복원 → 좌표 변환', '좌표 변환 → 찾기 → 파지 → 3D 복원', 'IK → 찾기 → 파지 → 좌표 변환'], a: 0,
      e: '이 중 새로 배운 것은 "좌표 변환" 하나뿐입니다. 나머지는 Day 2와 Day 4에서 이미 만들었습니다.' },

    { q: 'ArUco 마커 한 장으로 거리를 알 수 있는 이유는?',
      o: ['마커의 실제 한 변 길이를 미리 알고 있어서', '마커가 적외선을 반사해서', '마커에 QR 코드가 들어 있어서', '카메라가 스테레오라서'], a: 0,
      e: '크기를 알고 있으면 화면에 찍힌 크기로 거리를 역산할 수 있습니다. "미리 아는 크기"가 깊이 정보를 대신합니다.' },

    { q: '<code>solvePnP</code>가 돌려주는 것은?',
      o: ['물체의 위치와 자세(회전)', '물체의 색상과 크기', '이미지의 선명도', '카메라의 셔터 속도'], a: 0,
      e: '네 모서리의 화면 좌표와 실제 좌표를 맞춰 회전과 이동을 한 번에 구합니다.' },

    { q: '인식 오차가 4mm 있는데도 물체가 집히는 이유는?',
      o: ['그리퍼 폭이 물체보다 넓어 여유가 있어서', '로봇이 오차를 자동 보정해서', '오차가 무시할 만큼 작아서', 'IK가 오차를 흡수해서'], a: 0,
      e: '오차가 그리퍼 여유 안에 있으면 집힙니다. 실무에서는 "허용 오차"에서 "요구 정확도"를 역산합니다.' },

    { q: '실무에서 인식 정확도 목표를 정하는 순서는?',
      o: ['허용 여유를 먼저 정하고 거기서 필요 정확도를 역산한다', '가능한 최고 정확도를 먼저 달성한다', '카메라 성능이 정하는 대로 따른다', '정확도는 높을수록 좋으므로 목표를 두지 않는다'], a: 0,
      e: '그리퍼 여유가 1.5cm인데 0.1mm 정확도를 목표로 하는 것은 낭비입니다. 시스템이 요구하는 만큼만 맞춥니다.' },

    { q: 'LLM 연동에서 LLM의 역할은?',
      o: ['사람의 말을 프로그램이 읽을 수 있는 형태로 번역', '로봇 관절을 직접 제어', '카메라 영상을 분석', '역기구학을 계산'], a: 0,
      e: 'LLM은 통역사입니다. 번역 결과를 받아 실제로 움직이는 것은 우리가 Day 4까지 만든 파이프라인입니다.' },

    { q: 'LLM에게 답하게 할 때 권장되는 형식은?',
      o: ['JSON 같은 정해진 구조', '자유로운 자연어 문장', '한 단어', '파이썬 코드'], a: 0,
      e: '프로그램이 읽어야 하므로 구조가 정해져 있어야 합니다. 자유 문장은 파싱이 불안정합니다.' },

    { q: '테이블에 없는 "노란 블록"을 시켰을 때 LLM이 자신 있게 yellow를 답하는 현상은?',
      o: ['환각(hallucination)', '과적합', '기울기 폭발', '모드 붕괴'], a: 0,
      e: 'LLM은 모르면 모른다고 하기보다 그럴듯한 답을 만들어 냅니다. 로봇에 붙이면 실제 사고로 이어집니다.' },

    { q: '환각을 막는 가장 확실한 설계는?',
      o: ['현재 있는 것만 알려주고 그 안에서만 고르게 한다', '더 큰 모델을 쓴다', '프롬프트를 길게 쓴다', '온도(temperature)를 1.0으로 올린다'], a: 0,
      e: '선택지를 좁히는 것입니다. 없으면 error를 반환하라고 명시하는 것도 함께 해야 합니다.' },

    { q: 'API 키를 관리하는 올바른 방법은?',
      o: ['환경변수에 등록한다', '코드 상단에 상수로 적는다', '주석 처리해 둔다', '파일명을 key.txt로 바꿔 둔다'], a: 0,
      e: '코드에 적으면 그대로 GitHub에 올라갑니다. 실무에서 가장 흔한 보안 사고입니다.' },

    { q: '신경망 학습 4단계의 순서는?',
      o: ['예측 → 손실 → 역전파 → 갱신', '손실 → 예측 → 갱신 → 역전파', '역전파 → 예측 → 손실 → 갱신', '갱신 → 손실 → 예측 → 역전파'], a: 0,
      e: '출력을 내고, 얼마나 틀렸는지 재고, 각 가중치의 책임을 계산하고, 덜 틀리는 쪽으로 조금 이동합니다.' },

    { q: '경사하강법을 비유하면?',
      o: ['안개 속에서 발밑 경사만 보고 산을 내려가는 것', '지도를 보고 최단 경로를 찾는 것', '모든 경우를 다 시도해 보는 것', '무작위로 점프하는 것'], a: 0,
      e: '전체 지형은 안 보이고 발밑 기울기만 압니다. Day 4에 만든 IK도 완전히 같은 구조였습니다.' },

    { q: '지도학습과 강화학습의 차이는?',
      o: ['학습 신호가 정답 라벨이냐 보상이냐', '신경망을 쓰냐 안 쓰냐', 'GPU가 필요하냐 아니냐', '데이터가 필요하냐 아니냐'], a: 0,
      e: '둘 다 신경망 + 경사하강입니다. 걷는 법에는 정답 라벨이 없어서 보상으로 배웁니다.' },

    { q: '강화학습이 <strong>학습하는 대상</strong>은?',
      o: ['정책(Policy) — 관측을 받아 행동을 정하는 신경망', '환경(Environment)', '보상 함수(Reward)', '관측 공간(Observation space)'], a: 0,
      e: '환경과 보상 함수는 우리가 설계해서 주는 것이고, 정책이 학습으로 바뀝니다.' },

    { q: 'HalfCheetah의 관측 17 · 행동 6이 뜻하는 것은?',
      o: ['보는 값이 17개, 각 관절에 주는 토크가 6개', '17개 관절과 6개 센서', '17프레임마다 6번 행동', '17개 신경망 층과 6개 출력'], a: 0,
      e: '관측은 관절 각도·속도 등, 행동은 각 관절 토크입니다. 정책은 17개를 받아 6개를 내놓는 함수입니다.' },

    { q: '막대 세우기(InvertedPendulum)에 권장되는 알고리즘은?',
      o: ['PPO', 'SAC', '둘 다 불가', 'YOLO'], a: 0,
      e: 'PPO는 안정적이고 범용적이라 단순 과제에 적합합니다. 보행·이동 같은 연속 제어에는 SAC가 표본 효율이 좋습니다.' },

    { q: '<code>rl_train.py</code>에서 알고리즘을 SAC로 지정하는 옵션은? (직접 입력)', t: true,
      acc: ['--algo sac', 'algo sac', '--algo=sac'], ans: '--algo sac',
      e: '치타 달리기처럼 연속 제어에는 SAC를, 막대 세우기 같은 단순 과제에는 <code>--algo ppo</code>를 씁니다.' },

    { q: 'Day 3에서 쓰러지던 로봇개와 오늘 걷는 Ant의 차이는?',
      o: ['Ant는 강화학습으로 정책을 학습했다', 'Ant가 다리가 더 많다', 'Ant는 중력이 약한 환경이다', 'Ant는 물리 계산을 끈 상태다'], a: 0,
      e: '균형은 정해진 각도가 아니라 매 순간의 반응입니다. 실제 Unitree Go2의 보행도 정확히 같은 원리로 학습됩니다.' }
  ]
};
