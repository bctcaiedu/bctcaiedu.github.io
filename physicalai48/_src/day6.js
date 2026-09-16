module.exports = {
  day: 6,
  title: '강화학습과 Isaac · 스스로 배우는 로봇',
  theme: '보상을 설계하면 행동이 만들어진다 — 그리고 가상에서 배운 것이 현실로 나간다',

  openingNar: `마지막 날입니다. 어제 저녁에 걸어 두신 치타가 밤새 달리는 법을 배웠을 겁니다. 오늘 아침 첫 시간에 그 결과를 회수하는 것으로 시작하겠습니다. 오늘은 세 가지를 합니다. 먼저 보상을 설계하는 일이 사실은 문제를 정의하는 일이라는 것을 실험으로 확인합니다. 그 다음 엔비디아 아이작 심으로 넘어가서, 노트북 한 대가 아니라 지피유 위에서 로봇 수백 대를 동시에 학습시키는 세계를 봅니다. 마지막으로 가상에서 배운 것을 현실 로봇으로 옮기는 심투리얼 이야기를 하고, 엿새 동안 배운 모든 것을 모아 최종 프로젝트를 만듭니다.`,

  goals: [
    ['학습 곡선을 읽고', '보상이 오르지 않을 때의 처방을 고를 수 있다'],
    ['보상 설계가 행동을 결정함을', '보상을 바꿔 다른 행동을 만들어 확인할 수 있다'],
    ['Isaac Sim에서', '씬 생성·로봇 로드·관절 제어·카메라 취득을 할 수 있다'],
    ['병렬 환경 학습을', 'VRAM에 맞게 규모를 조절해 실행할 수 있다'],
    ['Sim-to-Real과 도메인 랜덤화를', '리얼리티 갭과 함께 설명할 수 있다'],
    ['6일간 배운 것을 통합해', '하나의 프로젝트로 만들어 시연할 수 있다']
  ],
  goalsNar: `오늘의 목표는 여섯 가지입니다. 앞의 두 개는 어제 이어서 하는 강화학습입니다. 학습 곡선을 읽고, 보상을 바꿔 행동이 달라지는 것을 확인합니다. 가운데 세 개는 아이작입니다. 실사급 시뮬레이터를 다루고, 수백 개 환경을 동시에 굴리고, 그것을 현실로 옮기는 개념을 배웁니다. 마지막 여섯 번째가 오늘의 마무리입니다. 엿새 동안 배운 것을 하나로 모아 프로젝트를 만들고 시연합니다.`,

  blocks: [
    { time: '09:00–10:50', title: 'RL 결과 회수와 보상 설계', desc: '학습 곡선 읽기 · 보상이 곧 문제 정의' },
    { time: '11:00–12:50', title: 'NVIDIA Isaac Sim', desc: 'USD · Franka · 카메라 · Replicator' },
    { time: '13:50–15:40', title: '대규모 학습과 Sim-to-Real', desc: '병렬 환경 · 도메인 랜덤화 · Go2 보행' },
    { time: '15:50–17:40', title: '최종 프로젝트와 발표', desc: '통합 · 시연 · 회고 · 수료' }
  ],
  blocksNar: `오늘 하루는 네 블록입니다. 오전 첫 블록은 어제의 연장이고, 두 번째부터 아이작으로 넘어갑니다. 아이작 심은 설치가 무거워서 강사 쪽에서 미리 준비해 뒀습니다. 만약 지피유 문제로 안 돌아가는 분이 계시면 무조코 엠제이엑스로 같은 개념을 실습할 수 있으니 걱정하지 마십시오. 마지막 블록은 최종 프로젝트입니다. 육십 분 만들고 사십 분 발표합니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–10:50', h: 'RL 결과 회수와 보상 설계',
      sub: '밤새 달리는 법을 배운 치타를 먼저 만나 봅시다.',
      nar: `첫 번째 블록입니다. 어제 걸어 두신 학습 결과부터 확인하겠습니다.` },

    { eb: 'Reading the Curve', h: '학습 곡선을 읽는 법',
      body: `<div class="rowlist" style="margin-top:1.2cqh">
        <div class="row"><span class="dot">↗</span><span class="t">꾸준히 오른다</span><span class="d">정상입니다. 더 오래 돌리면 더 올라갈 여지가 있는지 기울기를 보세요</span></div>
        <div class="row"><span class="dot">→</span><span class="t">평평하다 (낮은 값)</span><span class="d">보상 설계 문제이거나 알고리즘 부적합. steps만 늘려도 안 됩니다</span></div>
        <div class="row"><span class="dot">↘</span><span class="t">올랐다가 무너진다</span><span class="d">학습률이 너무 크거나 불안정. PPO로 바꾸거나 학습률을 낮춥니다</span></div>
        <div class="row"><span class="dot">〜</span><span class="t">심하게 진동한다</span><span class="d">보상 스케일이 너무 크거나 환경이 불안정합니다</span></div>
      </div>`,
      foot: '"보상이 안 오른다"는 증상 하나에 처방이 네 가지입니다 — 곡선 모양을 봐야 처방이 정해집니다.',
      nar: `학습 곡선을 읽는 법을 배우겠습니다. 보상이 안 오른다는 같은 증상이라도 곡선 모양에 따라 처방이 다릅니다. 꾸준히 오르는 중이면 정상이고 더 오래 돌리면 됩니다. 낮은 값에서 평평하면 스텝을 늘려도 소용없습니다. 보상 설계가 잘못됐거나 알고리즘이 안 맞는 겁니다. 올랐다가 무너지면 학습률이 너무 크거나 불안정한 것이고, 심하게 진동하면 보상 스케일이 너무 크거나 환경이 불안정한 겁니다. 증상 하나에 처방이 네 가지니까, 반드시 곡선 모양을 보고 판단하셔야 합니다.` },

    { eb: 'Reward is the Spec', h: '보상 설계가 곧 문제 정의입니다',
      sub: '오늘 반드시 실험해 보셔야 할 것입니다.',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">보상 = 전진 속도만</span><span class="t">빠르지만 이상한 자세</span><span class="d">사람 눈에 흉해도 상관없습니다. 빠르기만 하면 되니까요</span></div>
        <div class="card"><span class="n">+ 에너지 페널티</span><span class="t">효율적인 걸음</span><span class="d">토크를 적게 쓰는 쪽으로 자세가 바뀝니다</span></div>
        <div class="card"><span class="n">+ 자세 페널티</span><span class="t">몸통이 안정적</span><span class="d">몸통이 흔들리면 감점 → 보기에 자연스러워집니다</span></div>
        <div class="card warn"><span class="n">보상 해킹</span><span class="t">의도하지 않은 편법</span><span class="d">"넘어지지 않으면 +1" → 로봇이 그냥 가만히 서 있습니다</span></div>
      </div>`,
      foot: '"무엇을 원하는가"를 숫자로 정확히 적는 것 — 그것이 강화학습에서 가장 어려운 일입니다.',
      nar: `여기가 오늘 오전의 핵심입니다. 강화학습에서 가장 어려운 일은 알고리즘을 고르는 게 아니라 보상을 설계하는 일입니다. 보상이 전진 속도뿐이면 로봇은 빠르기만 하면 되니까 사람 눈에 흉한 자세로 달립니다. 여기에 에너지 페널티를 더하면 토크를 적게 쓰는 효율적인 걸음으로 바뀌고, 자세 페널티를 더하면 몸통이 안정적이 됩니다. 그런데 조심하셔야 할 게 있습니다. 보상 해킹이라는 현상입니다. 넘어지지 않으면 플러스 일 점이라고 보상을 주면, 로봇이 그냥 가만히 서 있어 버립니다. 넘어지지 않는 게 목표였으니 틀린 게 아니거든요. 무엇을 원하는지를 숫자로 정확히 적는 것, 그게 가장 어렵습니다.` },

    { section: true, eb: 'Block 2 · 11:00–12:50', h: 'NVIDIA Isaac Sim',
      sub: '이제 실사급 시뮬레이터로 올라갑니다.',
      nar: `두 번째 블록입니다. 무조코에서 아이작 심으로 올라갑니다.` },

    { eb: 'Ecosystem', h: 'NVIDIA Isaac 생태계',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">무대</span><span class="t">Isaac Sim</span><span class="d">USD 기반 실사급 시뮬레이터. RTX 레이트레이싱 · PhysX 5 물리</span></div>
        <div class="card"><span class="n">학습</span><span class="t">Isaac Lab</span><span class="d">로봇 학습 프레임워크(RL·모방학습). 30여 개 예제 태스크</span></div>
        <div class="card"><span class="n">배포</span><span class="t">Isaac ROS</span><span class="d">ROS 2 연동 · 실제 로봇에 올리기 (이 과정 범위 밖)</span></div>
        <div class="card"><span class="n">두뇌</span><span class="t">GR00T · Cosmos</span><span class="d">휴머노이드·로봇 파운데이션 모델. 첫날 소개한 그 흐름입니다</span></div>
      </div>`,
      foot: 'Isaac Sim은 무료로 쓸 수 있지만 오픈소스는 아닙니다 — MuJoCo(Apache 2.0)와 다른 점입니다.',
      nar: `아이작은 하나의 프로그램이 아니라 생태계입니다. 아이작 심이 무대입니다. 유에스디라는 표준 형식을 쓰고 알티엑스 레이트레이싱으로 실사급 렌더링을 합니다. 아이작 랩은 그 위에서 로봇을 학습시키는 프레임워크입니다. 강화학습과 모방학습 예제가 삼십 개 넘게 들어 있습니다. 아이작 로스는 실제 로봇에 올릴 때 쓰는데 이 과정 범위 밖입니다. 그루트와 코스모스는 첫날 소개했던 로봇 파운데이션 모델입니다. 한 가지 짚고 넘어가면, 아이작 심은 무료로 쓸 수 있지만 오픈소스는 아닙니다. 무조코가 아파치 라이선스인 것과 다릅니다.` },

    { eb: 'USD', h: 'MJCF 대신 USD',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">Stage</span><span class="t">전체 장면</span><span class="d">MuJoCo의 worldbody에 해당</span></div>
        <div class="card"><span class="n">Prim</span><span class="t">장면 속 각 물체</span><span class="d">MuJoCo의 body에 해당. 경로로 지정 — <code>/World/Franka</code></span></div>
        <div class="card"><span class="n">PhysX 5</span><span class="t">물리 엔진</span><span class="d">중력·충돌 담당. MuJoCo 엔진 자리</span></div>
      </div>
      <pre style="margin-top:2.4cqh"><span class="c">from</span> isaacsim <span class="c">import</span> SimulationApp
app = SimulationApp({"headless": <span class="c">False</span>})   <span class="c"># ★ 가장 먼저 실행해야 합니다</span>

<span class="c">from</span> isaacsim.core.api <span class="c">import</span> World
world = World()
world.scene.add_default_ground_plane()
world.reset()
<span class="c">for</span> _ <span class="c">in</span> range(200): world.step(render=<span class="c">True</span>)</pre>`,
      foot: 'SimulationApp을 다른 import보다 먼저 실행하지 않으면 오류가 납니다. 가장 흔한 실수입니다.',
      nar: `아이작 심은 엠제이씨에프 대신 유에스디라는 형식을 씁니다. 픽사가 만든 장면 기술 표준인데 영화 업계에서도 씁니다. 개념은 무조코와 대응됩니다. 스테이지가 전체 장면이고 무조코의 월드바디에 해당합니다. 프림이 장면 속 물체 하나인데 무조코의 바디입니다. 다만 프림은 경로로 지정합니다. 슬래시 월드 슬래시 프랑카 하는 식으로요. 물리는 피직스 오가 담당합니다. 코드에서 꼭 기억할 것은 시뮬레이션앱을 가장 먼저 실행해야 한다는 겁니다. 다른 임포트보다 먼저요. 이걸 안 지키면 오류가 나는데 가장 흔한 실수입니다.` },

    { eb: 'Four Labs', h: 'Isaac Sim 실습 네 단계',
      body: `<div class="rowlist" style="margin-top:1.2cqh">
        <div class="row"><span class="dot">1</span><span class="t">첫 씬</span><span class="d">빈 월드 + 바닥을 만들고 물리를 몇 스텝 돌린다</span></div>
        <div class="row"><span class="dot">2</span><span class="t">로봇 불러오기</span><span class="d">NVIDIA 에셋의 Franka 로봇팔 USD를 씬에 추가</span></div>
        <div class="row"><span class="dot">3</span><span class="t">관절 제어</span><span class="d">Articulation으로 목표 각도를 주어 자세를 바꾼다 — Day 3과 같은 개념</span></div>
        <div class="row"><span class="dot">4</span><span class="t">카메라 센서</span><span class="d">RGB·Depth 취득 → Replicator로 라벨까지 자동 생성</span></div>
      </div>`,
      foot: 'Day 3~4에서 MuJoCo로 한 것과 정확히 같은 순서입니다. 개념이 같으면 도구는 바꿔 탈 수 있습니다.',
      nar: `아이작 심 실습은 네 단계입니다. 빈 월드를 만들고, 로봇을 불러오고, 관절을 제어하고, 카메라를 답니다. 셋째 날과 넷째 날에 무조코로 했던 것과 정확히 같은 순서입니다. 이게 오늘 여러분이 느끼셔야 할 겁니다. 개념이 같으면 도구는 바꿔 탈 수 있습니다. 무조코에서 데이터 씨티알이었던 것이 아이작에서는 세트 조인트 포지션스가 되고, 무조코 렌더러였던 것이 카메라 클래스가 됩니다. 이름만 다르지 하는 일은 같습니다. 새 도구를 만났을 때 이 대응 관계를 찾는 것이 학습 속도를 결정합니다.` },

    { eb: 'Replicator', h: '합성 데이터, 이번엔 실사급으로',
      sub: '이틀 전 MuJoCo로 했던 그것 — 훨씬 사실적인 이미지로.',
      body: `<div class="stack" style="margin-top:1.4cqh">
        <div class="lay"><b>RGB</b><span>RTX 레이트레이싱 — 실제 사진과 구분이 어려운 수준</span></div>
        <div class="lay" style="background:var(--soft)"><b>Depth · Segmentation</b><span>MuJoCo와 같은 개념. 라벨이 자동으로 따라옵니다</span></div>
        <div class="lay" style="background:var(--soft)"><b>Bounding Box · Normal · Instance</b><span>YOLO 라벨 형식으로 바로 내보낼 수 있습니다</span></div>
        <div class="lay" style="background:var(--sand);border-color:#E7CDBF"><b>Randomization</b><span>조명·재질·배경·카메라를 무작위로 흔들어 수만 장 생성</span></div>
      </div>`,
      foot: 'Day 2에 100장 라벨링에 40분 → Day 4에 시뮬로 자동 → 오늘 실사급으로 수만 장.',
      nar: `리플리케이터는 아이작 심의 합성 데이터 도구입니다. 넷째 날에 무조코로 했던 그것을 훨씬 사실적인 이미지로 합니다. 알티엑스 레이트레이싱으로 렌더링하기 때문에 실제 사진과 구분하기 어려운 수준이 나옵니다. 그리고 바운딩 박스와 세그멘테이션 라벨을 욜로 형식으로 바로 내보낼 수 있습니다. 조명과 재질과 배경과 카메라 위치를 무작위로 흔들어서 수만 장을 자동 생성합니다. 정리해 보면 이렇습니다. 둘째 날에는 백 장 라벨링에 사십 분이 걸렸고, 넷째 날에는 시뮬레이터가 자동으로 만들어 줬고, 오늘은 실사급으로 수만 장을 만듭니다. 이게 나흘 동안의 이야기입니다.` },

    { section: true, eb: 'Block 3 · 13:50–15:40', h: '대규모 학습과 Sim-to-Real',
      sub: '노트북 한 대 vs GPU 위의 로봇 수백 대. 그리고 현실로 나가는 길.',
      nar: `세 번째 블록입니다. 오늘의 하이라이트입니다. 어제 여러분이 수십 분을 기다렸던 학습을, 다른 방식으로 하면 어떻게 되는지 보겠습니다.` },

    { eb: 'Parallel', h: '왜 병렬 환경인가',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card warn"><span class="n">어제 · 노트북</span><span class="t">환경 1개</span><span class="d">CPU에서 한 대의 치타가 혼자 30만 스텝. 수십 분 걸렸습니다</span></div>
        <div class="card"><span class="n">오늘 · GPU</span><span class="t">환경 512~4096개</span><span class="d">같은 시간에 수백 배의 경험. 물리 계산 전체가 GPU에서 돕니다</span></div>
      </div>
      <pre style="margin-top:2.4cqh"><span class="p">$</span> python scripts/reinforcement_learning/rsl_rl/train.py \\
      --task Isaac-Cartpole-v0 --num_envs <span class="p">512</span>
<span class="p">$</span> python scripts/reinforcement_learning/rsl_rl/play.py --task Isaac-Cartpole-v0</pre>
      <div class="banner" style="margin-top:2cqh">RTX 4070 12GB — OOM이 나면 <code>--num_envs 256</code>으로 낮추세요.</div>`,
      foot: '실제 Unitree Go2 보행 정책도 이런 방식으로 수천 개 환경에서 학습됩니다.',
      nar: `어제 여러분은 치타 한 마리를 삼십만 스텝 학습시키느라 수십 분을 기다리셨습니다. 아이작 랩에서는 환경을 오백열두 개, 많으면 사천구십육 개를 동시에 굴립니다. 물리 계산 전체가 지피유에서 돌기 때문에 가능합니다. 같은 시간에 수백 배의 경험이 쌓입니다. 이게 실제 산업에서 로봇 정책을 학습시키는 방식입니다. 유니트리 고투의 보행 정책도 이렇게 만들어집니다. 우리 실습 환경인 알티엑스 사공칠공 십이기가에서는 카트폴 같은 가벼운 태스크부터 시작하시고, 메모리 부족 오류가 나면 넘 엔브이에스를 이백오십육으로 낮추면 됩니다.` },

    { eb: 'Reality Gap', h: '가상과 현실 사이의 틈',
      sub: '시뮬에서 완벽한 정책이 현실 로봇에서는 넘어집니다.',
      body: `<div class="rowlist" style="margin-top:1.2cqh">
        <div class="row"><span class="dot">1</span><span class="t">물리가 다르다</span><span class="d">실제 마찰·관성·모터 지연은 시뮬의 숫자와 다릅니다</span></div>
        <div class="row"><span class="dot">2</span><span class="t">센서가 다르다</span><span class="d">실제 센서에는 노이즈와 지연이 있습니다</span></div>
        <div class="row"><span class="dot">3</span><span class="t">세상이 다르다</span><span class="d">바닥이 미끄럽거나 울퉁불퉁하고, 조명이 바뀝니다</span></div>
      </div>
      <div class="bannerG" style="margin-top:2.4cqh">Day 4에서 합성 이미지가 "너무 깨끗하다"고 했던 것 — 물리에서도 똑같이 일어납니다.</div>`,
      nar: `그런데 문제가 있습니다. 시뮬레이터에서 완벽하게 걷던 정책을 실제 로봇에 올리면 넘어집니다. 이걸 리얼리티 갭이라고 합니다. 이유는 세 가지입니다. 첫째, 물리가 다릅니다. 실제 마찰과 관성과 모터 지연은 우리가 엑스엠엘에 적어 둔 숫자와 다릅니다. 둘째, 센서가 다릅니다. 실제 센서에는 노이즈와 지연이 있는데 시뮬에는 없습니다. 셋째, 세상이 다릅니다. 바닥이 미끄럽거나 울퉁불퉁하고 조명이 계속 바뀝니다. 넷째 날에 합성 이미지가 너무 깨끗해서 문제라고 했던 것 기억하시죠. 물리에서도 똑같은 일이 일어납니다.` },

    { eb: 'Domain Randomization', h: '해법 — 일부러 흔든다',
      sub: '"현실이 시뮬의 여러 경우 중 하나처럼 보이게" 만듭니다.',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">물리 랜덤화</span><span class="t">마찰 · 질량 · 모터 지연</span><span class="d">환경마다 다른 값을 주고 학습 → 어떤 값이든 버티는 정책</span></div>
        <div class="card"><span class="n">시각 랜덤화</span><span class="t">조명 · 재질 · 배경</span><span class="d">Day 4의 합성 데이터에서 했던 것과 같은 아이디어</span></div>
        <div class="card"><span class="n">센서 랜덤화</span><span class="t">노이즈 · 지연 주입</span><span class="d">깨끗한 관측에 의존하지 않는 정책이 만들어집니다</span></div>
        <div class="card"><span class="n">외란 주입</span><span class="t">밀기 · 지형 변화</span><span class="d">학습 중에 로봇을 툭툭 밀어 버립니다</span></div>
      </div>`,
      foot: '핵심 발상: 하나의 완벽한 시뮬을 만드는 대신, 수많은 불완전한 시뮬을 만든다.',
      nar: `해법이 도메인 랜덤화입니다. 발상이 재미있습니다. 현실과 똑같은 완벽한 시뮬레이터를 만들려고 애쓰는 대신, 수많은 불완전한 시뮬레이터를 만듭니다. 환경마다 마찰과 질량과 모터 지연을 다르게 주고 학습시킵니다. 조명과 재질도 무작위로 바꾸고, 센서에 노이즈를 일부러 섞고, 학습 중에 로봇을 툭툭 밀어 버립니다. 그러면 어떤 조건에서도 버티는 정책이 만들어집니다. 그 정책을 현실에 가져가면 로봇이 이것도 내가 겪어 본 경우 중 하나네 하고 넘어갑니다. 현실을 시뮬의 여러 경우 중 하나로 만드는 겁니다.` },

    { eb: 'Alternative', h: 'GPU가 없다면 — MuJoCo MJX',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="t">MJX</span><span class="d">MuJoCo를 JAX로 다시 쓴 것. GPU/TPU에서 수천 환경 병렬. 개념은 Isaac Lab과 동일합니다</span></div>
        <div class="card"><span class="t">MuJoCo Playground</span><span class="d">MJX 기반 학습 예제 모음. 사족보행·조작 태스크 포함</span></div>
      </div>
      <div class="bannerG" style="margin-top:2.4cqh">도구가 달라도 배우는 것은 같습니다 — 병렬 환경 · 보상 설계 · 도메인 랜덤화.</div>`,
      foot: 'Isaac Sim이 안 돌아가도 오늘 배울 것은 하나도 놓치지 않습니다.',
      nar: `지피유 사정으로 아이작 심이 안 돌아가는 분도 계실 겁니다. 걱정하지 마십시오. 무조코에도 같은 것이 있습니다. 엠제이엑스는 무조코를 제이에이엑스로 다시 쓴 것인데 지피유에서 수천 환경을 병렬로 굴립니다. 플레이그라운드는 그 위의 예제 모음이고 사족보행과 조작 태스크가 들어 있습니다. 도구가 달라도 배우는 것은 같습니다. 병렬 환경, 보상 설계, 도메인 랜덤화입니다. 아이작 심이 안 돌아가도 오늘 배울 것은 하나도 놓치지 않습니다.` },

    { section: true, eb: 'Block 4 · 15:50–17:40', h: '최종 프로젝트와 발표',
      sub: '엿새 동안 만든 부품들을 하나로 묶습니다.',
      nar: `마지막 블록입니다. 엿새 동안 만든 부품들을 하나로 묶습니다.` },

    { eb: 'Choose One', h: '다섯 가지 중 하나',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">① Day 2 + Day 4</span><span class="t">제스처 조종 로봇팔</span><span class="d">MediaPipe 손 좌표 → IK 목표 좌표. 손을 움직이면 로봇팔이 따라옵니다</span></div>
        <div class="card"><span class="n">② Day 5</span><span class="t">자연어 분류 로봇</span><span class="d">"빨간 건 왼쪽, 파란 건 오른쪽" — 다중 명령을 순서대로 처리</span></div>
        <div class="card"><span class="n">③ Day 2 + Day 4</span><span class="t">합성 데이터 파이프라인</span><span class="d">시뮬 카메라로 수집 → YOLO 학습 → 시뮬 물체 인식. 순환이 완성됩니다</span></div>
        <div class="card"><span class="n">④ Day 5 + Day 6</span><span class="t">커스텀 보상 RL</span><span class="d">보상 함수를 바꿔 의도한 다른 행동을 만들어 냅니다</span></div>
      </div>
      <div class="bannerG" style="margin-top:2cqh">⑤ 자유 주제 — 현업 과제와 연결된 제안도 환영합니다.</div>`,
      foot: '채점의 절반은 "인식 + 판단 + 행동" 세 요소를 몇 개나 담았는가입니다.',
      nar: `최종 프로젝트는 다섯 가지 중 하나를 고르시면 됩니다. 첫째, 제스처로 로봇팔을 조종하는 것입니다. 둘째 날 미디어파이프와 넷째 날 역기구학을 잇습니다. 둘째, 자연어로 물건을 분류하는 로봇입니다. 빨간 건 왼쪽, 파란 건 오른쪽 같은 여러 명령을 순서대로 처리합니다. 셋째, 합성 데이터 파이프라인입니다. 시뮬 카메라로 데이터를 모아 욜로를 학습시키고 그 모델로 시뮬 안 물체를 인식합니다. 이걸 하면 엿새의 순환이 완성됩니다. 넷째, 보상 함수를 바꿔서 의도한 다른 행동을 만들어 내는 것입니다. 다섯째는 자유 주제입니다. 현업 과제와 연결된 제안이면 더 좋습니다. 채점의 절반은 인식과 판단과 행동 세 요소를 몇 개나 담았는가입니다.` },

    { eb: 'Six Days', h: '엿새 동안 우리가 한 일',
      body: `<div class="rowlist" style="margin-top:1.2cqh">
        <div class="row"><span class="dot">1</span><span class="t">눈을 만들었다</span><span class="d">웹캠 → Haar → 그 한계</span></div>
        <div class="row"><span class="dot">2</span><span class="t">눈이 똑똑해졌다</span><span class="d">YOLO → MediaPipe → 직접 학습</span></div>
        <div class="row"><span class="dot">3</span><span class="t">몸을 만들었다</span><span class="d">MJCF → 물리 → 관절 제어 → 쓰러지는 로봇개</span></div>
        <div class="row"><span class="dot">4</span><span class="t">몸이 정교해졌다</span><span class="d">역기구학 → 그리퍼 → 시뮬 카메라 → 합성 데이터</span></div>
        <div class="row"><span class="dot">5</span><span class="t">눈과 몸을 이었다</span><span class="d">좌표 변환 → 자연어 명령 → 강화학습 시작</span></div>
        <div class="row"><span class="dot">6</span><span class="t">스스로 배우게 했다</span><span class="d">보상 설계 → 병렬 학습 → Sim-to-Real</span></div>
      </div>`,
      foot: '첫날의 "인식 · 판단 · 행동" 세 단어가 엿새 동안 어디에 놓였는지 보이시나요?',
      nar: `엿새를 정리해 보겠습니다. 첫째 날 눈을 만들었고 그 눈의 한계를 봤습니다. 둘째 날 그 한계를 딥러닝으로 넘었고 직접 학습까지 시켰습니다. 셋째 날 몸을 만들었고 쓰러지는 로봇개를 봤습니다. 넷째 날 몸이 정교해졌고 시뮬 카메라로 합성 데이터를 만들었습니다. 다섯째 날 눈과 몸을 이었고 강화학습을 시작했습니다. 그리고 오늘 보상 설계와 병렬 학습과 심투리얼을 배웠습니다. 첫날 말씀드린 인식과 판단과 행동, 그 세 단어가 엿새 동안 어디에 놓였는지 이제 보이실 겁니다.` },

    { eb: 'What Next', h: '여기서 더 나아가려면',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">→</span><span class="t">ROS 2</span><span class="d">실제 로봇과 통신하는 표준. 이 과정에서 유일하게 다루지 못한 조각입니다</span></div>
        <div class="card"><span class="n">→</span><span class="t">Isaac Lab 심화</span><span class="d">Unitree Go2 보행 학습(unitree_rl_lab), 모방학습(IL)</span></div>
        <div class="card"><span class="n">→</span><span class="t">로봇 파운데이션 모델</span><span class="d">GR00T · Cosmos · VLA 모델 — 말과 영상을 함께 이해하는 로봇 두뇌</span></div>
        <div class="card"><span class="n">→</span><span class="t">엣지 배포</span><span class="d">Jetson에 모델 올리기 · ONNX·TensorRT 변환</span></div>
        <div class="card"><span class="n">→</span><span class="t">실물 로봇</span><span class="d">저가 로봇팔(6축 서보) · 로봇개 키트로 Sim-to-Real 직접 시도</span></div>
        <div class="card"><span class="n">→</span><span class="t">데이터 엔지니어링</span><span class="d">합성 데이터 파이프라인 구축이 현업에서 가장 수요가 많습니다</span></div>
      </div>`,
      nar: `마지막으로 여기서 더 나아가고 싶은 분들을 위한 안내입니다. 여섯 가지 방향이 있습니다. 로스 투는 실제 로봇과 통신하는 표준인데 이 과정에서 유일하게 다루지 못한 조각입니다. 아이작 랩 심화로 가면 유니트리 고투 보행 학습과 모방학습을 할 수 있습니다. 로봇 파운데이션 모델은 말과 영상을 함께 이해하는 로봇 두뇌인데 지금 가장 빠르게 움직이는 분야입니다. 엣지 배포는 젯슨에 모델을 올리는 일이고, 실물 로봇은 저가 로봇팔이나 로봇개 키트로 심투리얼을 직접 시도해 보는 겁니다. 그리고 마지막, 합성 데이터 파이프라인 구축은 현업에서 지금 가장 수요가 많은 일입니다. 엿새 동안 고생 많으셨습니다.` }
  ],

  assignment: {
    title: '최종 프로젝트 제출',
    due: '제출: 당일 17:00',
    lede: '6일간 배운 것을 하나로 묶어 만든 결과물을 제출합니다.',
    subtitle: '인식 · 판단 · 행동 중 몇 개를 담았는지 스스로 표시할 것',
    items: [
      '실행되는 코드 일체 (README 포함)',
      '30~60초 시연 영상',
      '5장 이내 발표자료',
      '사용한 기술 요소 표시 (인식/판단/행동)',
      '동작하지 않는 부분과 그 이유',
      '실무에 적용한다면 무엇이 더 필요한지'
    ],
    note: '5번과 6번에 배점이 있습니다. 완벽한 척하는 것보다 한계를 정확히 아는 것이 이 과정 6일간의 핵심 태도였습니다.',
    sample: `<span class="o">학번 / 이름 : 20261234 / 홍길동
주제 : ① 제스처 조종 로봇팔

기술 요소 : 인식(MediaPipe hands) ✓  판단(손가락 개수→모드 전환) ✓  행동(IK+그리퍼) ✓

동작하지 않는 부분
  - 손이 화면 밖으로 나가면 로봇팔이 마지막 좌표로 튐
  - 원인 : 랜드마크 미검출 시 이전 값을 그대로 쓰기 때문
  - 해결안 : 미검출 N프레임 이상이면 정지 상태로 전환

실무 적용 시 필요한 것
  - 좌표 스무딩(저역통과 필터), 작업 반경 밖 요청 거부, 비상 정지</span>`,
    nar: `최종 제출물입니다. 코드와 시연 영상과 발표자료, 그리고 사용한 기술 요소 표시입니다. 여기서 다섯 번째와 여섯 번째에 배점이 있다는 걸 다시 말씀드립니다. 동작하지 않는 부분이 무엇이고 왜 그런지, 그리고 이걸 실무에 가져간다면 무엇이 더 필요한지를 쓰십시오. 완벽한 척하는 것보다 한계를 정확히 아는 것, 그게 엿새 동안 우리가 계속 연습한 태도였습니다. 첫날 하르 캐스케이드를 일부러 무너뜨리는 것부터 시작했던 걸 기억하시죠.` },

  wrap: {
    done: '보상을 설계해 행동을 만들었고, GPU 위에서 수백 개 환경을 동시에 굴렸고, 가상에서 배운 것을 현실로 옮기는 길을 봤습니다. 그리고 엿새 동안 만든 부품들을 하나로 묶었습니다.',
    next: '수료를 축하합니다',
    nextDesc: '6일 전 여러분은 웹캠으로 얼굴 하나를 찾는 것에서 시작했습니다. 지금은 보고 · 판단하고 · 움직이는 시스템 전체를 만들 수 있습니다. 다음은 실물 로봇, ROS 2, 그리고 로봇 파운데이션 모델입니다.',
    nar: `엿새 동안의 여정이 끝났습니다. 육일 전 여러분은 웹캠으로 얼굴 하나를 찾는 것에서 시작했습니다. 그것도 옆얼굴은 못 찾는 방식으로요. 지금은 보고 판단하고 움직이는 시스템 전체를 만들 수 있습니다. 물체를 검출하고, 모델을 직접 학습시키고, 시뮬레이터에 로봇을 세우고, 역기구학을 풀고, 카메라와 로봇 좌표를 잇고, 말을 알아듣게 하고, 강화학습으로 정책을 만드는 일까지 전부 손으로 해 보셨습니다. 여기서 멈추지 마시고 실물 로봇과 로스와 로봇 파운데이션 모델로 나아가십시오. 수료를 축하드립니다. 고생 많으셨습니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '강화학습과 Isaac · 스스로 배우는 로봇',
    standfirst: '마지막 날입니다. 오전에는 어제 걸어 둔 학습을 회수하고, 보상을 바꿔 행동이 달라지는 것을 실험합니다. 오후에는 Isaac으로 올라갔다가, 마지막 블록에서 6일간의 부품을 하나로 묶습니다. <strong>Isaac Sim이 안 돌아가도 MJX로 같은 개념을 실습할 수 있습니다.</strong>',
    rules: [
      ['보상을 의심한다', '학습이 안 되면 알고리즘을 바꾸기 전에 보상 설계를 먼저 의심하세요. 대부분 거기에 원인이 있습니다.'],
      ['개념을 옮겨 탄다', 'Isaac은 이름만 다르지 Day 3~4에 한 것과 같습니다. 대응표를 만들며 따라가세요.'],
      ['한계를 적는다', '최종 프로젝트 배점의 상당 부분이 "무엇이 안 되는가"입니다. 6일 내내 연습한 태도입니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: 'RL 결과 회수와 보상 설계', time: '09:00–10:50',
        lede: '어제 걸어 둔 학습부터 확인합니다. rl 환경으로 전환하세요.',
        missions: [
          { n: 1, h: '치타 회수하기', body: `
      <pre><span class="p">$</span> conda activate rl
<span class="p">$</span> cd RL실습폴더경로
<span class="p">$</span> python rl_enjoy.py --env HalfCheetah-v5 --algo sac</pre>
      <p>어제 학습 전(<code>rl_understand_env.py</code>)과 비교하세요.</p>
      <pre><span class="o">학습 전 (무작위)  평균 보상  -300 ~ 0
학습 후 (SAC)     평균 보상  2000 ~ 5000</span></pre>
      <pre><span class="c"># 수업 자료용 영상으로 저장</span>
<span class="p">$</span> python rl_enjoy.py --env HalfCheetah-v5 --algo sac --record</pre>
      <div class="box q"><span class="lbl">관찰</span>
        <p>치타가 달리는 자세가 <strong>사람 눈에는 이상해 보이나요?</strong> 보상이 "전진 속도"뿐이라면 보기 좋을 이유가 없습니다. 이것이 다음 미션의 출발점입니다.</p></div>` },

          { n: 2, h: '학습 곡선 읽기', body: `
      <p>학습 로그의 <code>ep_rew_mean</code> 추이를 보고 <strong>어떤 모양인지</strong> 판단하세요.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">꾸준히 ↗</span><span class="v">정상 — 더 돌리면 더 오를 여지가 있는지 기울기를 본다</span></div>
        <div class="dlrow"><span class="k">평평 (낮음)</span><span class="v">보상 설계 문제 또는 알고리즘 부적합<small>steps만 늘려도 안 됩니다</small></span></div>
        <div class="dlrow"><span class="k">올랐다 무너짐</span><span class="v">학습률 과다 / 불안정<small>PPO로 바꾸거나 학습률↓</small></span></div>
        <div class="dlrow"><span class="k">심한 진동</span><span class="v">보상 스케일 과다 또는 환경 불안정</span></div>
      </div>
      <div class="box check"><span class="lbl">핵심</span>
        <p>"보상이 안 오른다"는 <strong>하나의 증상에 처방이 네 가지</strong>입니다. 곡선 모양을 봐야 처방이 정해집니다.</p></div>` },

          { n: 3, h: '보상을 바꿔 행동 바꾸기 ★ 오늘 오전의 핵심', body: `
      <p>Gymnasium 환경을 감싸(wrapper) 보상을 수정합니다. 짧게 학습시켜 <strong>행동이 달라지는지</strong>만 보면 됩니다.</p>
      <pre><span class="c">import</span> gymnasium <span class="c">as</span> gym

<span class="c">class</span> RewardTweak(gym.Wrapper):
    <span class="c">def</span> step(self, action):
        obs, rew, term, trunc, info = self.env.step(action)
        <span class="c"># ① 에너지 페널티 — 토크를 적게 쓰게</span>
        rew -= 0.1 * (action ** 2).sum()
        <span class="c"># ② 자세 페널티 — 몸통이 흔들리면 감점</span>
        <span class="c"># rew -= 0.5 * abs(obs[1])</span>
        <span class="c">return</span> obs, rew, term, trunc, info</pre>
      <div class="box q"><span class="lbl">실험</span><ul>
        <li>에너지 페널티를 넣으면 달리는 자세가 어떻게 바뀌나요?</li>
        <li>페널티 계수를 크게(1.0) 하면? — 아예 안 움직이지 않나요?</li>
      </ul></div>
      <div class="box warn"><span class="lbl">보상 해킹 (Reward Hacking)</span>
        <p>"넘어지지 않으면 +1"이라고만 주면 로봇은 <strong>그냥 가만히 서 있습니다.</strong> 목표를 달성한 것이니 틀린 것도 아닙니다.<br>
        <strong>보상 설계 = 문제 정의</strong> — 강화학습에서 가장 어려운 일입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: 'NVIDIA Isaac Sim', time: '11:00–12:50',
        lede: '설치본은 강사가 미리 배포했습니다. 첫 실행은 셰이더 컴파일로 수 분 걸립니다.',
        missions: [
          { n: 4, h: '실행과 UI 익히기', body: `
      <pre><span class="p">$</span> conda activate isaac
<span class="p">$</span> python lab_isaac1_hello.py     <span class="c"># 빈 월드 + 바닥</span></pre>
      <div class="dl">
        <div class="dlrow"><span class="k">Viewport</span><span class="v">3D 장면 — 마우스로 회전·확대·이동</span></div>
        <div class="dlrow"><span class="k">Stage</span><span class="v">씬 구조 트리<small>MuJoCo에서 XML로 보던 것을 트리로 봅니다</small></span></div>
        <div class="dlrow"><span class="k">Property</span><span class="v">선택한 Prim의 속성 편집<small>MuJoCo에서 XML 값 고치던 것</small></span></div>
        <div class="dlrow"><span class="k">Play</span><span class="v">누르면 물리 시작<small>mj_step에 해당</small></span></div>
      </div>
      <div class="box warn"><span class="lbl">가장 흔한 실수</span>
        <p><code>SimulationApp</code>을 <strong>다른 import보다 먼저</strong> 실행해야 합니다. 순서가 바뀌면 오류가 납니다.</p>
        <pre style="margin-top:8px">from isaacsim import SimulationApp
app = SimulationApp({"headless": False})   # ← 여기가 먼저
from isaacsim.core.api import World        # ← 그다음</pre></div>` },

          { n: 5, h: 'MuJoCo ↔ Isaac 대응표 만들기 ★', body: `
      <pre><span class="p">$</span> python lab_isaac2_load_robot.py    <span class="c"># Franka 로봇팔 로드</span>
<span class="p">$</span> python lab_isaac3_joint_control.py  <span class="c"># 관절 제어</span>
<span class="p">$</span> python lab_isaac4_camera.py         <span class="c"># 카메라 센서</span></pre>
      <p>Day 3~4에 MuJoCo로 한 것과 <strong>같은 순서</strong>입니다. 스스로 대응표를 채워 보세요.</p>
      <div class="tablewrap">
        <table>
          <thead><tr><th>하는 일</th><th>MuJoCo</th><th>Isaac Sim</th></tr></thead>
          <tbody>
            <tr><td>씬 기술</td><td><code>MJCF (.xml)</code></td><td><code>USD</code> (Stage / Prim)</td></tr>
            <tr><td>물체 하나</td><td><code>body</code></td><td><code>Prim</code> (<code>/World/Franka</code>)</td></tr>
            <tr><td>로봇 로드</td><td><code>from_xml_path</code></td><td><code>add_reference_to_stage</code></td></tr>
            <tr><td>관절 제어</td><td><code>data.ctrl[i]</code></td><td><code>set_joint_positions</code></td></tr>
            <tr><td>한 스텝</td><td><code>mj_step</code></td><td><code>world.step()</code></td></tr>
            <tr><td>카메라</td><td><code>mujoco.Renderer</code></td><td><code>Camera</code> + <code>get_rgba()</code></td></tr>
            <tr><td>물리 엔진</td><td>MuJoCo</td><td>PhysX 5</td></tr>
          </tbody>
        </table>
      </div>
      <div class="box check"><span class="lbl">오늘 느껴야 할 것</span>
        <p><strong>개념이 같으면 도구는 바꿔 탈 수 있습니다.</strong> 새 도구를 만났을 때 이 대응 관계를 얼마나 빨리 찾느냐가 학습 속도를 결정합니다.</p></div>` },

          { n: 6, h: 'Replicator 합성 데이터 (시연·선택)', body: `
      <p>Day 4에서 MuJoCo로 한 합성 데이터를 <strong>실사급</strong>으로 만듭니다.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">RGB</span><span class="v">RTX 레이트레이싱 — 실제 사진과 구분이 어려운 수준</span></div>
        <div class="dlrow"><span class="k">라벨</span><span class="v">Bounding Box · Segmentation · Normal<small>YOLO 형식으로 바로 내보내기</small></span></div>
        <div class="dlrow"><span class="k">랜덤화</span><span class="v">조명·재질·배경·카메라를 무작위로<small>수만 장 자동 생성</small></span></div>
      </div>
      <div class="box check"><span class="lbl">4일간의 이야기</span>
        <p>Day 2 — 100장 라벨링에 <strong>40분</strong> · Day 4 — 시뮬로 자동 생성 · Day 6 — 실사급으로 <strong>수만 장</strong></p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '대규모 학습과 Sim-to-Real', time: '13:50–15:40',
        lede: 'Isaac Lab이 안 되면 MJX 경로로 진행하세요. 배우는 것은 같습니다.',
        missions: [
          { n: 7, h: '병렬 환경 학습 ★', body: `
      <pre><span class="c"># Isaac Lab (권장)</span>
<span class="p">$</span> python scripts/reinforcement_learning/rsl_rl/train.py \\
      --task Isaac-Cartpole-v0 --num_envs <span class="o">512</span>
<span class="p">$</span> python scripts/reinforcement_learning/rsl_rl/play.py --task Isaac-Cartpole-v0</pre>
      <div class="box q"><span class="lbl">어제와 비교</span>
        <p>어제는 <strong>환경 1개</strong>로 30만 스텝에 수십 분이 걸렸습니다. 지금은 <strong>512개</strong>가 동시에 돕니다. 화면에서 카트폴이 몇 개나 보이나요?</p></div>
      <div class="box warn"><span class="lbl">RTX 4070 12GB 튜닝</span><ul>
        <li><code>CUDA out of memory</code> → <code>--num_envs 256</code>으로 낮추기</li>
        <li>다른 GPU 앱(브라우저 영상, 게임) 종료</li>
        <li>렌더 품질 프리셋 낮추기 / <code>--headless</code>로 실행</li>
      </ul></div>
      <div class="box check"><span class="lbl">대안 경로 — MJX</span>
        <p>Isaac Sim이 안 돌아가면 <strong>MuJoCo MJX / Playground</strong>로 동일한 개념을 실습합니다. MuJoCo를 JAX로 다시 써서 GPU에서 수천 환경을 병렬로 굴립니다.</p></div>` },

          { n: 8, h: '도메인 랜덤화 설계해 보기', body: `
      <p>코드를 다 짜지 않아도 됩니다. <strong>무엇을 흔들지 목록으로 설계</strong>하는 것이 미션입니다.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">물리</span><span class="v">마찰 · 질량 · 모터 지연<small>환경마다 다른 값 → 어떤 값이든 버티는 정책</small></span></div>
        <div class="dlrow"><span class="k">시각</span><span class="v">조명 · 재질 · 배경<small>Day 4 합성 데이터에서 한 것과 같은 아이디어</small></span></div>
        <div class="dlrow"><span class="k">센서</span><span class="v">노이즈 · 지연 주입<small>깨끗한 관측에 의존하지 않게</small></span></div>
        <div class="dlrow"><span class="k">외란</span><span class="v">학습 중에 로봇을 툭툭 밀기<small>지형도 바꿔 줍니다</small></span></div>
      </div>
      <div class="box check"><span class="lbl">발상의 전환</span>
        <p>현실과 똑같은 <strong>하나의 완벽한 시뮬</strong>을 만들려 애쓰는 대신, <strong>수많은 불완전한 시뮬</strong>을 만듭니다. 그러면 현실이 "겪어 본 경우 중 하나"가 됩니다.</p></div>
      <div class="box q"><span class="lbl">과제</span>
        <p>내 최종 프로젝트를 실물 로봇에 올린다면 무엇을 랜덤화해야 할까요? 3가지를 적으세요.</p></div>` },

          { n: 9, h: 'Day 3의 로봇개로 돌아가기', body: `
      <p>셋째 날 <code>robot_zoo.py dog</code>에서 쓰러지던 Unitree Go2를 기억하세요.</p>
      <div class="box check"><span class="lbl">이제 답을 말할 수 있습니다</span><ol>
        <li>왜 쓰러졌나 → 균형은 정해진 각도가 아니라 <strong>매 순간의 반응</strong>이라서</li>
        <li>어떻게 해결하나 → 보상을 주고 <strong>강화학습</strong>으로 정책을 만든다</li>
        <li>얼마나 걸리나 → 병렬 환경 수천 개로 <strong>수 시간~수일</strong></li>
        <li>실물에 올리려면 → <strong>도메인 랜덤화</strong>로 리얼리티 갭을 좁힌다</li>
      </ol></div>
      <p>실제 Go2 보행 학습은 Isaac Lab의 <code>unitree_rl_lab</code>에서 할 수 있습니다. 관심 있는 분은 수료 후 이어서 해 보세요.</p>` }
        ]
      },
      {
        pn: 'PART 4', h: '최종 프로젝트', time: '15:50–17:40',
        lede: '60분 제작 + 40분 발표. 완성도보다 통합 범위와 한계 인식을 봅니다.',
        missions: [
          { n: 10, h: '주제 선택과 제작', body: `
      <div class="dl">
        <div class="dlrow"><span class="k">①</span><span class="v"><strong>제스처 조종 로봇팔</strong> — MediaPipe 손 좌표 → IK 목표<small>Day 2 + Day 4 · 손목 랜드마크를 로봇 작업 반경으로 매핑</small></span></div>
        <div class="dlrow"><span class="k">②</span><span class="v"><strong>자연어 분류 로봇</strong> — "빨간 건 왼쪽, 파란 건 오른쪽"<small>Day 5 · 다중 명령을 순서대로 처리, 없는 색은 거부</small></span></div>
        <div class="dlrow"><span class="k">③</span><span class="v"><strong>합성 데이터 파이프라인</strong> — 수집 → YOLO 학습 → 시뮬 인식<small>Day 2 + Day 4 · 6일간의 순환이 완성됩니다</small></span></div>
        <div class="dlrow"><span class="k">④</span><span class="v"><strong>커스텀 보상 RL</strong> — 보상을 바꿔 의도한 행동 만들기<small>Day 5 + Day 6 · 미션 3을 확장</small></span></div>
        <div class="dlrow"><span class="k">⑤</span><span class="v"><strong>자유 주제</strong> — 현업 과제 연계 제안<small>시작 전 강사와 범위를 합의하세요</small></span></div>
      </div>
      <div class="box warn"><span class="lbl">20분 규칙</span>
        <p><strong>20분 안에 최소 버전</strong>을 돌아가게 만드세요. 예: ①번이면 "손을 좌우로 움직이면 로봇팔 x좌표가 바뀐다"까지. 나머지 40분에 확장합니다.</p></div>
      <div class="box check"><span class="lbl">①번 스타터 힌트</span>
        <pre style="margin-top:8px"># 손목 랜드마크(0번)의 정규화 좌표 → 로봇 작업 반경으로 매핑
x = 0.26 + lm[0].x * (0.48 - 0.26)     # 반경 0.26~0.48 m
y = (lm[0].y - 0.5) * 0.4              # 좌우 ±0.2 m
z = 0.10                               # 높이 고정으로 시작
ik(target=[x, y, z])</pre></div>` },

          { n: 11, h: '한계 찾고 발표 준비 ★', body: `
      <p>6일 내내 해 온 일을 마지막으로 한 번 더 합니다. <strong>무엇이 안 되는가.</strong></p>
      <div class="box q"><span class="lbl">발표 4분 구성</span><ol>
        <li><strong>무엇을 만들었나</strong> — 한 문장 (20초)</li>
        <li><strong>라이브 시연</strong> — 실제로 돌립니다 (90초)</li>
        <li><strong>기술 요소</strong> — 인식/판단/행동 중 무엇을 담았나 (30초)</li>
        <li><strong>안 되는 부분과 이유</strong> — 배점 있음 (60초)</li>
        <li><strong>실무 적용 시 더 필요한 것</strong> — 배점 있음 (40초)</li>
      </ol></div>
      <div class="box check"><span class="lbl">좋은 답의 예</span>
        <p>"손이 화면 밖으로 나가면 로봇팔이 마지막 좌표로 튑니다. 랜드마크 미검출 시 이전 값을 그대로 쓰기 때문입니다. 실무라면 <strong>좌표 스무딩, 작업 반경 밖 요청 거부, 비상 정지</strong>가 반드시 있어야 합니다."</p></div>` },

          { n: 12, h: '6일 회고', body: `
      <p>마지막으로 스스로 답해 보세요. 수료 후에도 남을 질문들입니다.</p>
      <div class="box q"><span class="lbl">회고</span><ol>
        <li>6일 중 <strong>가장 인상 깊었던 실패</strong>는 무엇이었나요? (Haar가 무너진 순간? 로봇개가 쓰러진 순간?)</li>
        <li>지금 현업 과제 하나를 고른다면, 이 중 무엇을 먼저 적용해 보겠습니까?</li>
        <li>"인식 · 판단 · 행동" 중 내가 가장 약한 부분은 어디인가요?</li>
      </ol></div>
      <div class="box check"><span class="lbl">다음 단계</span>
        <p><strong>ROS 2</strong>(이 과정에서 유일하게 다루지 못한 조각) · <strong>Isaac Lab 심화</strong>(Go2 보행·모방학습) · <strong>로봇 파운데이션 모델</strong>(GR00T·Cosmos·VLA) · <strong>엣지 배포</strong>(Jetson·TensorRT) · <strong>실물 로봇</strong>(저가 6축 로봇팔로 Sim-to-Real)</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>isaacsim</code> 명령 없음 (pip 설치)', '환경 미활성 또는 파이썬 버전', '<code>conda activate isaac</code> · Python 3.11인지 확인'],
      ['첫 실행이 멈춘 듯 매우 느림', '셰이더 캐시 생성 중', '최초 1회 수 분 걸립니다. 정상입니다'],
      ['검은 화면 / Vulkan 오류', '드라이버 또는 WSL에서 실행', 'GeForce 드라이버 최신화 · <strong>네이티브</strong>로 실행 · NVIDIA GPU 사용 확인'],
      ['<code>CUDA out of memory</code>', 'VRAM 부족', '씬 단순화 · 렌더 품질↓ · <code>--num_envs</code>↓ · 다른 GPU 앱 종료'],
      ['<code>ImportError</code> (모듈 경로)', 'Isaac Sim/Lab 버전 차이', '버전에 맞는 import인지 공식 문서 확인. 버전마다 경로가 다릅니다'],
      ['<code>SimulationApp</code> 관련 오류', 'import 순서', '<code>SimulationApp</code>을 <strong>다른 import보다 먼저</strong> 실행'],
      ['에셋 다운로드 느림/실패', 'NVIDIA 계정·네트워크', '로그인 확인. 강사 배포본이 있으면 그것을 사용'],
      ['Isaac Sim이 전혀 안 돌아감', 'GPU 요건 미달', '<strong>MJX / MuJoCo Playground</strong>로 대체 — 배우는 개념은 동일합니다'],
      ['보상을 바꿨는데 변화가 없음', 'wrapper가 적용 안 됨', '<code>gym.make</code> 후 wrapper로 감쌌는지, 학습에 그 env를 넘겼는지 확인']
    ],
    checklist: [
      '어제 학습한 HalfCheetah 정책을 재생하고 학습 전후를 비교했다',
      '학습 곡선 모양별 처방 4가지를 구분할 수 있다',
      '<strong>보상을 바꿔 행동이 달라지는 것</strong>을 직접 확인했다',
      '보상 해킹이 무엇인지 예를 들어 설명할 수 있다',
      'Isaac Sim에서 씬 생성 · 로봇 로드 · 관절 제어 · 카메라를 실행했다',
      '<strong>MuJoCo ↔ Isaac 대응표</strong>를 스스로 채울 수 있다',
      '<code>SimulationApp</code>을 먼저 실행해야 하는 이유를 안다',
      '병렬 환경 학습을 실행하고 VRAM에 맞게 규모를 조절했다',
      '어제(환경 1개)와 오늘(환경 512개)의 차이를 설명할 수 있다',
      '리얼리티 갭이 생기는 원인 3가지를 말할 수 있다',
      '도메인 랜덤화의 발상을 한 문장으로 설명할 수 있다',
      'Day 3의 쓰러지던 로봇개 문제에 <strong>끝까지 답할 수 있다</strong>',
      '최종 프로젝트가 돌아가고, 인식/판단/행동 중 담은 요소를 표시했다',
      '<strong>안 되는 부분과 그 이유</strong>를 말할 수 있다',
      '실무 적용 시 추가로 필요한 것을 3가지 이상 적었다'
    ]
  },

  /* ================= 퀴즈 ================= */
  quizTitle: '강화학습 심화와 Isaac 퀴즈',
  quiz: [
    { q: '학습 보상이 <strong>낮은 값에서 평평하게</strong> 유지된다면 가장 먼저 의심할 것은?',
      o: ['보상 설계 또는 알고리즘 부적합', 'GPU 메모리 부족', '데이터셋 라벨 오류', '렌더링 해상도'], a: 0,
      e: 'steps만 늘려도 오르지 않습니다. 반대로 꾸준히 오르는 중이라면 더 돌리는 것이 맞습니다. 곡선 모양에 따라 처방이 다릅니다.' },

    { q: '보상이 <strong>올랐다가 무너지는</strong> 경우의 처방은?',
      o: ['학습률을 낮추거나 PPO로 바꾼다', 'steps를 10배로 늘린다', '관측 개수를 줄인다', '렌더링을 끈다'], a: 0,
      e: '학습이 불안정한 상태입니다. PPO는 안정성을 위해 설계된 알고리즘이라 이런 경우에 유리합니다.' },

    { q: '"넘어지지 않으면 +1"이라고만 보상을 주면 로봇은?',
      o: ['그냥 가만히 서 있는다', '최대한 빨리 달린다', '학습에 실패한다', '무작위로 움직인다'], a: 0,
      e: '<strong>보상 해킹</strong>입니다. 목표를 달성한 것이니 틀린 것도 아닙니다. 원하는 것을 숫자로 정확히 적는 것이 가장 어렵습니다.' },

    { q: '보상에 <strong>에너지 페널티</strong>(토크 제곱합 감점)를 더하면?',
      o: ['토크를 적게 쓰는 효율적인 자세로 바뀐다', '더 빨라진다', '학습이 불가능해진다', '아무 변화 없다'], a: 0,
      e: '보상 설계가 곧 문제 정의입니다. 무엇을 원하는지를 숫자로 바꿔 넣으면 행동이 그에 맞춰 만들어집니다.' },

    { q: 'Isaac 생태계에서 <strong>로봇 학습 프레임워크</strong>에 해당하는 것은?',
      o: ['Isaac Lab', 'Isaac Sim', 'Isaac ROS', 'Omniverse'], a: 0,
      e: 'Isaac Sim은 무대(시뮬레이터), Isaac Lab은 학습, Isaac ROS는 실로봇 배포, GR00T·Cosmos는 로봇 파운데이션 모델입니다.' },

    { q: 'Isaac Sim의 씬 기술 형식은?',
      o: ['USD', 'MJCF', 'URDF', 'SDF'], a: 0,
      e: 'MuJoCo의 MJCF에 해당합니다. Stage는 전체 장면, Prim은 장면 속 각 물체이고 <code>/World/Franka</code> 같은 경로로 지정합니다.' },

    { q: 'Isaac Sim 스크립트에서 <code>SimulationApp</code>은 언제 실행해야 하나요?',
      o: ['다른 isaacsim import보다 먼저', '가장 마지막에', 'World 생성 직후', '순서는 상관없다'], a: 0,
      e: '가장 흔한 실수입니다. 순서가 바뀌면 오류가 납니다.' },

    { q: 'MuJoCo의 <code>data.ctrl[i]</code>에 해당하는 Isaac Sim의 것은?',
      o: ['set_joint_positions', 'add_reference_to_stage', 'world.step()', 'get_rgba()'], a: 0,
      e: '개념이 같으면 도구는 바꿔 탈 수 있습니다. 새 도구를 만났을 때 대응 관계를 찾는 것이 학습 속도를 결정합니다.' },

    { q: 'MuJoCo의 <code>mj_step</code>에 해당하는 Isaac Sim의 것은? (직접 입력)', t: true,
      acc: ['world.step()', 'world.step', 'world.step(render=True)'], ans: 'world.step()',
      e: '시간을 한 스텝 진행시킵니다. Isaac에서는 렌더 여부를 인자로 넘길 수 있습니다.' },

    { q: 'Replicator가 하는 일은?',
      o: ['이미지와 라벨을 함께 자동 생성 (합성 데이터)', '로봇을 여러 대 복제', '학습을 여러 GPU로 분산', '시뮬 결과를 실로봇에 복제'], a: 0,
      e: 'Day 4에서 MuJoCo Segmentation으로 한 것과 같은 개념을 실사급으로 합니다. Day 2에 손으로 40분 걸리던 일입니다.' },

    { q: '병렬 환경 학습(<code>--num_envs 512</code>)의 이점은?',
      o: ['같은 시간에 수백 배의 경험을 쌓는다', '정책 신경망이 512배 커진다', '보상이 512배가 된다', '렌더링 품질이 좋아진다'], a: 0,
      e: '물리 계산 전체가 GPU에서 돕니다. 어제 환경 1개로 수십 분 걸린 일을 훨씬 빠르게 합니다.' },

    { q: 'RTX 4070 12GB에서 <code>CUDA out of memory</code>가 났을 때 가장 먼저 할 일은?',
      o: ['--num_envs를 256으로 낮춘다', 'steps를 늘린다', '알고리즘을 PPO로 바꾼다', '관측 개수를 늘린다'], a: 0,
      e: '병렬 환경 수가 VRAM 사용량을 좌우합니다. 렌더 품질 낮추기, 다른 GPU 앱 종료도 함께 하세요.' },

    { q: '리얼리티 갭(Reality Gap)이 생기는 원인이 <strong>아닌</strong> 것은?',
      o: ['시뮬레이터의 시간이 현실보다 빠르게 흘러서', '실제 마찰·관성·모터 지연이 시뮬 값과 달라서', '실제 센서에 노이즈와 지연이 있어서', '실제 바닥·조명이 계속 바뀌어서'], a: 0,
      e: '시간 속도는 문제가 아닙니다. 물리·센서·환경의 차이가 원인입니다. Day 4에서 합성 이미지가 "너무 깨끗하다"고 한 것과 같은 문제입니다.' },

    { q: '도메인 랜덤화의 발상을 한 문장으로 말하면?',
      o: ['완벽한 시뮬 하나 대신 불완전한 시뮬을 수없이 만든다', '현실 데이터를 무작위로 섞는다', '신경망 가중치를 무작위 초기화한다', '학습률을 매번 무작위로 바꾼다'], a: 0,
      e: '마찰·질량·조명·노이즈를 환경마다 다르게 주면, 현실이 "겪어 본 경우 중 하나"가 됩니다.' },

    { q: 'Isaac Sim이 GPU 요건 때문에 안 돌아갈 때의 대안은?',
      o: ['MuJoCo MJX / Playground', 'PyBullet', 'OpenCV', 'Gazebo Classic'], a: 0,
      e: 'MJX는 MuJoCo를 JAX로 다시 쓴 것으로 GPU에서 수천 환경을 병렬로 굴립니다. 병렬 환경·보상 설계·도메인 랜덤화라는 배울 것은 같습니다.' },

    { q: 'Day 3에서 로봇개가 쓰러졌던 문제에 대한 <strong>완전한 답</strong>은?',
      o: ['보상을 주고 강화학습으로 정책을 만든 뒤, 도메인 랜덤화로 실물에 옮긴다', '관절 각도를 더 정확히 계산한다', 'kp를 크게 올린다', '마찰을 높인다'], a: 0,
      e: '균형은 매 순간의 반응이라 정해진 각도로는 불가능합니다. 실제 Unitree Go2 보행도 이 방식으로 만들어집니다.' },

    { q: '이 과정에서 <strong>다루지 않은</strong> 피지컬 AI의 조각은?',
      o: ['ROS 2 (로봇 통신·통합)', '컴퓨터비전', '시뮬레이션', '강화학습'], a: 0,
      e: '첫날 소개한 6개 기술요소 중 통신·통합(ROS)만 범위 밖이었습니다. 수료 후 이어서 배우기 좋은 다음 단계입니다.' },

    { q: '최종 프로젝트 채점에서 <strong>배점이 있는</strong> 항목은?',
      o: ['안 되는 부분과 그 이유를 설명하는 것', '코드 줄 수', '발표 슬라이드 디자인', '사용한 라이브러리 개수'], a: 0,
      e: '6일 내내 연습한 태도입니다 — Day 1에 Haar를 일부러 무너뜨리는 것부터 시작했습니다. 한계를 아는 사람이 다음 기술의 가치를 정확히 이해합니다.' }
  ]
};
