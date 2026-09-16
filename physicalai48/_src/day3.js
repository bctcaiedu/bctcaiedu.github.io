module.exports = {
  day: 3,
  title: '가상의 몸 · 시뮬레이터와 MJCF',
  theme: '로봇을 불러오는 것이 아니라, 로봇을 적는다',

  openingNar: `셋째 날입니다. 지난 이틀 동안 우리는 눈을 만들었습니다. 웹캠 영상에서 얼굴을 찾고, 팔십 종류의 물체를 검출하고, 손가락 관절을 추적하고, 어제는 직접 학습까지 시켰습니다. 그런데 아무리 잘 봐도 움직이지 않으면 소용이 없습니다. 오늘부터는 몸을 만듭니다. 다만 실물 로봇을 사서 시작하지 않습니다. 시뮬레이터 안에서 시작합니다. 왜 그래야 하는지, 그리고 시뮬레이터 안의 로봇이 사실은 텍스트 파일 한 장이라는 사실을 오늘 알게 되실 겁니다.`,

  goals: [
    ['시뮬레이터를 쓰는 이유를', '안전·반복·병렬 세 가지로 설명할 수 있다'],
    ['model과 data의 차이를', '설계도와 현재 상태로 구분할 수 있다'],
    ['MJCF(XML)를 읽고', 'body·joint·geom을 찾아 값을 고칠 수 있다'],
    ['중력·마찰·질량을', '실시간으로 바꿔 물리 변화를 관찰할 수 있다'],
    ['실측 로봇 모델을', 'Menagerie에서 불러와 띄울 수 있다'],
    ['로봇팔 6축 관절을', '슬라이더와 코드로 제어할 수 있다']
  ],
  goalsNar: `오늘의 목표는 여섯 가지입니다. 첫 두 개는 개념입니다. 시뮬레이터를 왜 쓰는지, 그리고 무조코의 가장 중요한 개념인 모델과 데이터의 차이를 잡습니다. 가운데 세 개는 세계를 만드는 일입니다. 엑스엠엘로 로봇과 세계를 적고, 중력과 마찰과 질량을 바꿔 보고, 실제로 팔리는 로봇 모델을 불러옵니다. 마지막 여섯 번째는 제어의 시작입니다. 로봇팔의 관절 여섯 개를 슬라이더로 하나씩 움직여 봅니다.`,

  blocks: [
    { time: '09:00–10:50', title: '왜 시뮬레이터인가', desc: 'MuJoCo 개요 · 설치 · model과 data' },
    { time: '11:00–12:50', title: 'MJCF로 세계 적기', desc: 'XML 수정 · 중력·마찰·질량 실험' },
    { time: '13:50–15:40', title: '로봇 바꿔 보기', desc: 'Menagerie · URDF 변환 · 다리 로봇의 한계' },
    { time: '15:50–17:40', title: '로봇팔 관절 제어', desc: '6축 슬라이더 · ctrl과 qpos의 차이' }
  ],
  blocksNar: `오늘 하루는 네 블록입니다. 첫 블록에서 개념과 설치를 끝내고, 두 번째부터는 계속 손으로 합니다. 세 번째 블록에서 로봇개와 휴머노이드를 띄워 보는데, 여기서 아주 중요한 실패를 하나 보게 됩니다. 로봇이 계속 쓰러집니다. 그 장면이 다섯째 날 강화학습의 이유가 됩니다. 마지막 블록에서는 로봇팔 관절을 하나씩 움직이며 시킨 각도와 실제 각도가 왜 다른지를 확인합니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–10:50', h: '왜 시뮬레이터인가',
      sub: '실물 로봇으로 시작하지 않는 데에는 분명한 이유가 있습니다.',
      nar: `첫 번째 블록입니다. 왜 실물 로봇이 아니라 시뮬레이터로 시작하는지부터 이야기하겠습니다.` },

    { eb: 'Why Simulation', h: '실물로 배우기에는 세 가지 문제가 있습니다',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">안전</span><span class="d">코드 한 줄 잘못 쓰면 로봇팔이 사람을 칩니다. 시뮬레이터에서는 다시 실행하면 그만입니다</span></div>
        <div class="card"><span class="n">02</span><span class="t">반복</span><span class="d">실물은 부품이 닳고 배터리가 떨어집니다. 시뮬은 하루에 만 번도 같은 실험을 합니다</span></div>
        <div class="card"><span class="n">03</span><span class="t">병렬</span><span class="d">실물은 한 대씩. GPU에서는 로봇 4096대를 동시에 굴립니다 — Day 6에서 직접 봅니다</span></div>
      </div>
      <div class="bannerG" style="margin-top:2.4cqh">그리고 하나 더 — 시뮬레이터는 '정답'을 알고 있습니다. 물체의 진짜 위치를 알기 때문에 인식 오차를 바로 채점할 수 있습니다.</div>`,
      foot: '가상에서 배운 것을 실물로 옮기는 것 = Sim-to-Real. Day 6의 마지막 주제입니다.',
      nar: `이유는 세 가지입니다. 첫째, 안전입니다. 코드 한 줄을 잘못 쓰면 실물 로봇팔은 사람을 칩니다. 시뮬레이터에서는 다시 실행하면 그만입니다. 둘째, 반복입니다. 실물은 부품이 닳고 배터리가 떨어지고 사람이 지킵니다. 시뮬레이터는 하루에 만 번도 같은 실험을 합니다. 셋째, 병렬입니다. 실물 로봇은 한 대씩밖에 못 씁니다. 지피유 위에서는 로봇 사천 대를 동시에 굴릴 수 있습니다. 여섯째 날에 직접 보게 됩니다. 그리고 하나 더 있습니다. 시뮬레이터는 정답을 알고 있습니다. 물체가 실제로 어디에 있는지 알기 때문에, 우리가 만든 인식이 얼마나 틀렸는지 바로 채점할 수 있습니다. 넷째 날에 이걸 씁니다.` },

    { eb: 'MuJoCo', h: 'Multi-Joint dynamics with Contact',
      sub: '관절과 접촉을 정확하고 빠르게 푸는 물리 엔진 — 구글 딥마인드, Apache 2.0',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="t">정확한 접촉 물리</span><span class="d">관절이 많고 서로 부딪히는 로봇을 안정적으로 계산. 잡기·걷기 같은 접촉 동작에 강합니다</span></div>
        <div class="card"><span class="t">가볍고 빠르다</span><span class="d">GPU 없이도 빠릅니다. 시행착오를 수없이 반복해야 하는 강화학습의 사실상 표준</span></div>
        <div class="card"><span class="t">설치가 한 줄</span><span class="d">pip install mujoco — 컴파일러도 GPU도 필요 없습니다</span></div>
        <div class="card"><span class="t">무료 오픈소스</span><span class="d">원래 유료였다가 딥마인드 인수 후 Apache 2.0으로 공개</span></div>
      </div>`,
      foot: 'PyBullet은 Windows에서 "Microsoft Visual C++ 14.0 required" 빌드 오류가 잦아 이 과정은 MuJoCo를 표준으로 씁니다.',
      nar: `우리가 쓸 시뮬레이터는 무조코입니다. 멀티 조인트 다이내믹스 위드 콘택트의 줄임말인데, 관절과 접촉을 정확하고 빠르게 푸는 물리 엔진이라는 뜻입니다. 로봇처럼 관절이 많고 서로 부딪히는 물체를 안정적으로 계산합니다. 특히 잡기나 걷기처럼 접촉이 핵심인 동작에 강합니다. 원래는 유료 소프트웨어였는데 구글 딥마인드가 인수한 뒤 아파치 라이선스로 공개했습니다. 설치는 핍 인스톨 무조코 한 줄이면 끝나고 지피유도 필요 없습니다. 참고로 파이불렛이라는 다른 시뮬레이터도 있는데, 윈도우에서 설치할 때 씨플플 빌드 도구를 요구해서 자주 막힙니다. 그래서 이 과정은 무조코를 표준으로 씁니다.` },

    { eb: 'Ecosystem', h: 'MuJoCo 주변에 무엇이 있나',
      body: `<div class="rowlist" style="margin-top:1.2cqh">
        <div class="row"><span class="dot">M</span><span class="t">MuJoCo</span><span class="d">물리 엔진 본체. 3D 뷰어와 오프스크린 렌더러를 함께 제공합니다</span></div>
        <div class="row"><span class="dot">Z</span><span class="t">Menagerie</span><span class="d">딥마인드가 관리하는 실측 기반 로봇 모델 60여 종 — Go2, H1, Franka, Shadow Hand</span></div>
        <div class="row"><span class="dot">X</span><span class="t">MJX</span><span class="d">GPU에서 수천 개 환경을 동시에 굴리는 버전. 대규모 강화학습용</span></div>
        <div class="row"><span class="dot">P</span><span class="t">Playground</span><span class="d">MJX 기반 학습 예제 모음. Day 6 Isaac Lab의 대안 경로</span></div>
      </div>`,
      foot: 'MuJoCo 기본 패키지에는 로봇이 없습니다. 로봇은 Menagerie에서 따로 받습니다.',
      nar: `무조코 생태계에는 네 가지가 있습니다. 본체인 무조코가 있고, 메나저리라는 로봇 모델 모음이 있습니다. 여기에 유니트리 고투 로봇개, 에이치원 휴머노이드, 프랑카 로봇팔, 섀도우 핸드 같은 실제로 팔리는 로봇 육십여 종이 실측 기반으로 들어 있습니다. 여기서 중요한 점 하나. 무조코 기본 패키지에는 로봇이 하나도 없습니다. 로봇은 메나저리에서 따로 받아야 합니다. 그리고 엠제이엑스는 지피유에서 수천 개 환경을 동시에 굴리는 버전이고, 플레이그라운드는 그 위에 만든 학습 예제 모음입니다. 여섯째 날에 다시 만납니다.` },

    { eb: 'Core Concept ①', h: 'model과 data — 이 둘만 기억하세요',
      sub: 'MuJoCo의 모든 코드는 결국 model을 읽고 data를 고치는 일입니다.',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">model</span><span class="t">변하지 않는 설계도</span><span class="d">질량 · 마찰 · 관절 구조 · 중력 설정 · 모터 성능<br><code>model.opt.gravity</code> · <code>model.body_mass</code> · <code>model.geom_friction</code></span></div>
        <div class="card"><span class="n">data</span><span class="t">지금 이 순간의 상태</span><span class="d">관절 각도 · 속도 · 모터 명령<br><code>data.qpos</code> · <code>data.qvel</code> · <code>data.ctrl</code></span></div>
      </div>
      <pre style="margin-top:2.4cqh">model = mujoco.MjModel.from_xml_path("arm_scene.xml")   <span class="c"># 설계도 컴파일</span>
data  = mujoco.MjData(model)                            <span class="c"># 상태 그릇 생성</span>
mujoco.mj_step(model, data)                             <span class="c"># 시간을 한 스텝 흘려보낸다</span></pre>`,
      foot: '집을 짓는 도면이 model, 지금 방 안의 온도와 사람 위치가 data — 라고 생각하면 편합니다.',
      nar: `오늘 가장 중요한 개념입니다. 무조코에는 모델과 데이터 두 가지가 있습니다. 모델은 변하지 않는 설계도입니다. 질량, 마찰, 관절 구조, 중력 설정, 모터 성능이 여기 들어 있습니다. 데이터는 지금 이 순간의 상태입니다. 관절이 몇 도인지, 얼마나 빠르게 움직이는지, 모터에 어떤 명령이 들어가 있는지입니다. 집에 비유하자면 도면이 모델이고 지금 방 안 온도와 사람 위치가 데이터입니다. 무조코 코드는 결국 모델을 읽고 데이터를 고치는 일이 전부입니다. 그리고 엠제이 스텝이라는 함수로 시간을 한 칸씩 흘려보냅니다. 이 세 줄이 모든 무조코 프로그램의 뼈대입니다.` },

    { section: true, eb: 'Block 2 · 11:00–12:50', h: 'MJCF로 세계 적기',
      sub: '로봇을 불러오는 것이 아니라 적는 것 — 이것이 MuJoCo의 방식입니다.',
      nar: `두 번째 블록입니다. 여기서 무조코의 가장 독특한 점을 배웁니다.` },

    { eb: 'Core Concept ②', h: 'MJCF — 로봇과 세계를 XML 한 장에',
      body: `<pre style="margin-top:1.4cqh">&lt;mujoco model="arm_scene"&gt;
  &lt;option gravity="0 0 -9.81" timestep="0.002"/&gt;

  &lt;worldbody&gt;
    &lt;geom type="plane" size="2 2 .1"/&gt;              <span class="c">&lt;!-- 바닥 --&gt;</span>

    &lt;body name="link1" pos="0 0 0.1"&gt;               <span class="c">&lt;!-- 물체 하나 --&gt;</span>
      &lt;joint name="j1" type="hinge" axis="0 0 1"/&gt;  <span class="c">&lt;!-- 어떻게 움직이나 --&gt;</span>
      &lt;geom type="capsule" size="0.03 0.15"/&gt;       <span class="c">&lt;!-- 어떻게 보이나 --&gt;</span>

      &lt;body name="link2" pos="0 0 0.3"&gt; ... &lt;/body&gt; <span class="c">&lt;!-- 중첩 = 관절 구조 --&gt;</span>
    &lt;/body&gt;
  &lt;/worldbody&gt;

  &lt;actuator&gt;&lt;position joint="j1" kp="80"/&gt;&lt;/actuator&gt;
&lt;/mujoco&gt;</pre>`,
      foot: 'PyBullet은 "로봇 파일을 불러오고", MuJoCo는 "로봇을 적습니다".',
      nar: `무조코에서는 로봇과 세계를 엠제이씨에프라는 엑스엠엘 한 장에 적습니다. 파이불렛 같은 다른 시뮬레이터는 로봇 파일을 밖에서 불러오는데, 무조코는 직접 적습니다. 처음에는 불편해 보이지만 익숙해지면 훨씬 자유롭습니다. 구조를 보십시오. 옵션에 중력과 시간 간격을 적고, 월드바디 안에 물체들을 넣습니다. 바디가 물체 하나이고, 그 안에 조인트와 지옴을 넣습니다. 조인트는 그 물체가 어떻게 움직이는지, 지옴은 어떻게 생겼고 부딪히는지를 정합니다. 그리고 바디 안에 바디를 넣어서 겹겹이 중첩하면 그게 팔이 되고 다리가 됩니다.` },

    { eb: 'Core Concept ③', h: 'MJCF를 이루는 세 가지',
      body: `<div class="stack" style="margin-top:1.6cqh">
        <div class="lay"><b>body</b><span>물체 하나. 안에 다른 body를 넣어 관절 구조(팔·다리)를 만듭니다</span></div>
        <div class="lay" style="background:var(--soft)"><b>joint</b><span>그 body가 어떻게 움직일 수 있는가 — hinge(회전) · slide(직선) · free(자유)</span></div>
        <div class="lay" style="background:var(--soft)"><b>geom</b><span>어떻게 생겼고 무엇과 부딪히는가 — box · sphere · capsule · mesh</span></div>
        <div class="lay" style="background:var(--sand);border-color:#E7CDBF"><b>actuator</b><span>어떻게 힘을 주는가 — position 모터를 달아야 data.ctrl 로 움직일 수 있습니다</span></div>
      </div>`,
      foot: 'geom만 있고 joint가 없으면 그 물체는 부모에 고정된 장식입니다. actuator가 없으면 명령을 줄 수 없습니다.',
      nar: `엠제이씨에프를 이루는 것은 사실상 네 가지입니다. 바디는 물체 하나입니다. 조인트는 그 물체가 어떻게 움직일 수 있는지를 정합니다. 힌지는 회전, 슬라이드는 직선 이동, 프리는 아무 제약 없이 떠다니는 것입니다. 지옴은 어떻게 생겼고 무엇과 부딪히는지입니다. 박스, 구, 캡슐, 그리고 외부 메시 파일을 쓸 수 있습니다. 마지막으로 액추에이터가 있어야 명령을 줄 수 있습니다. 조인트만 있고 액추에이터가 없으면 그 관절은 중력에 따라 축 늘어질 뿐 우리가 움직일 수 없습니다. 반대로 지옴만 있고 조인트가 없으면 부모 물체에 붙은 장식입니다.` },

    { eb: 'Physics', h: '중력·마찰·질량을 손으로 바꿔 보기',
      sub: 'python lab2_2_build_scene.py — 조작 패널에서 실시간으로',
      body: `<pre style="margin-top:1.4cqh">model.opt.gravity[:]     = [0, 0, -9.81]   <span class="c"># 0 으로 바꾸면 무중력</span>
model.geom_friction[gid] = [1.0, 0.005, 0.0001]
model.body_mass[bid]     = 0.5</pre>
      <div class="grid g3" style="margin-top:2.4cqh">
        <div class="card"><span class="n">마찰 0.05</span><span class="t">얼음판</span><span class="d">큐브를 밀면 멀리 미끄러집니다</span></div>
        <div class="card"><span class="n">마찰 1.0</span><span class="t">기본값</span><span class="d">적당히 밀립니다</span></div>
        <div class="card"><span class="n">마찰 1.5</span><span class="t">고무판</span><span class="d">거의 움직이지 않습니다</span></div>
      </div>`,
      foot: '오늘의 마찰이 내일 그리퍼로 물체를 집을 때 그대로 쓰입니다. 미끄러지면 마찰을 올립니다.',
      nar: `모델 안의 값을 코드에서 직접 바꿀 수 있습니다. 중력을 영으로 만들면 무중력이 되고, 마찰을 낮추면 얼음판이 되고, 질량을 키우면 무거워집니다. 실습 시간에 조작 패널에서 이 값들을 실시간으로 바꿔 보십시오. 마찰을 영점영오로 낮추고 큐브를 밀면 저 멀리 미끄러져 나가고, 일점오로 올리면 거의 움직이지 않습니다. 여기서 배운 마찰이 내일 아주 중요해집니다. 내일 로봇팔의 손가락으로 큐브를 집는데, 그건 마법이 아니라 손가락과 큐브 사이의 마찰로 집는 것입니다. 물체가 미끄러져 떨어지면 마찰을 올리면 됩니다.` },

    { section: true, eb: 'Block 3 · 13:50–15:40', h: '로봇 바꿔 보기',
      sub: '실제로 팔리는 로봇들을 띄워 봅니다. 그리고 중요한 실패를 하나 보게 됩니다.',
      nar: `세 번째 블록입니다. 실제로 판매되는 로봇 모델들을 띄워 봅니다. 그리고 오늘 가장 중요한 장면을 보게 됩니다.` },

    { eb: 'Menagerie', h: '실측 기반 로봇 60여 종',
      body: `<pre style="margin-top:1.4cqh"><span class="p">$</span> python robot_zoo.py              <span class="c"># 목록 보기</span>
<span class="p">$</span> python robot_zoo.py arm          <span class="c"># 직접 만든 로봇팔 (인터넷 불필요)</span>
<span class="p">$</span> python robot_zoo.py dog          <span class="c"># 유니트리 Go2 로봇개</span>
<span class="p">$</span> python robot_zoo.py h1           <span class="c"># 유니트리 H1 휴머노이드</span>
<span class="p">$</span> python robot_zoo.py hand         <span class="c"># 섀도우 로봇 핸드</span></pre>
      <div class="bannerG" style="margin-top:2.4cqh">최초 1회만 다운로드(1~2분). 이후에는 즉시 열립니다.</div>`,
      foot: 'Go2는 실제로 수천만 원에 팔리는 로봇개입니다. 그 정밀 모델을 지금 노트북에서 돌립니다.',
      nar: `로봇주라는 스크립트로 메나저리의 로봇들을 불러옵니다. 도그를 치면 유니트리 고투 로봇개가 뜨는데, 이건 실제로 수천만 원에 판매되는 로봇입니다. 그 정밀 모델을 지금 여러분 노트북에서 돌리는 겁니다. 에이치원은 유니트리 휴머노이드이고, 핸드는 손가락 관절이 스무 개가 넘는 섀도우 로봇 핸드입니다. 처음 한 번만 다운로드하고 그 다음부터는 바로 열립니다.` },

    { eb: 'The Failure', h: '로봇개가 계속 쓰러집니다',
      sub: '오늘 반드시 보고 가야 할 장면입니다.',
      body: `<div class="rowlist" style="margin-top:1.4cqh">
        <div class="row"><span class="dot">?</span><span class="t">관절 각도는 다 줬는데</span><span class="d">왜 서 있지 못하고 옆으로 넘어질까요</span></div>
        <div class="row"><span class="dot">!</span><span class="t">균형은 '자세'가 아니라 '반응'이기 때문</span><span class="d">기울어지는 순간마다 다리를 다시 놓아야 합니다. 정해진 각도로는 불가능합니다</span></div>
      </div>
      <div class="banner" style="margin-top:2.4cqh">개루프(수식만)로는 걷지 못합니다. 실제 Go2 보행도 강화학습으로 만듭니다 → Day 5·6</div>`,
      foot: 'robot_zoo.py는 기본 자세만 잡아 주는 데모입니다. 걷기 제어기가 없습니다.',
      nar: `여기서 오늘 가장 중요한 장면이 나옵니다. 로봇개를 띄우면 잠깐 서 있다가 옆으로 쓰러집니다. 관절 각도를 다 줬는데 왜 서 있지 못할까요. 균형이라는 것은 자세가 아니라 반응이기 때문입니다. 몸이 기울어지는 순간마다 다리를 다시 놓아야 하는데, 미리 정해 둔 각도로는 그게 불가능합니다. 정해진 수식만으로는, 그러니까 개루프로는 걸을 수 없습니다. 실제 유니트리 고투의 보행도 사람이 수식으로 짠 게 아니라 강화학습으로 만든 것입니다. 다섯째와 여섯째 날에 우리가 직접 그걸 학습시킵니다. 오늘은 이 쓰러지는 장면을 눈에 담아 두십시오.` },

    { eb: 'URDF → MJCF', h: '다른 형식의 로봇을 가져올 때',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">URDF</span><span class="t">ROS 계열의 표준</span><span class="d">PyBullet·ROS에서 쓰는 형식. 인터넷에 공개된 로봇은 대부분 이쪽</span></div>
        <div class="card"><span class="n">MJCF</span><span class="t">MuJoCo의 형식</span><span class="d">URDF를 읽을 수는 있지만 호환되지 않는 부분이 있습니다</span></div>
      </div>
      <pre style="margin-top:2.4cqh"><span class="p">$</span> python lab_mujoco_microtaur.py
<span class="c"># microtaur의 URDF에는 rpy 값이 3개가 아니라 4개인 부분이 있어</span>
<span class="c"># 그대로는 안 열립니다 → 스크립트가 자동으로 고쳐서 띄웁니다</span></pre>`,
      foot: '실무에서 로봇 모델을 가져올 때 가장 흔한 작업이 이 형식 변환입니다.',
      nar: `인터넷에 공개된 로봇 모델은 대부분 유알디에프 형식입니다. 로스 계열의 표준이거든요. 무조코는 유알디에프를 읽을 수는 있지만 호환되지 않는 부분이 있습니다. 마이크로타우어라는 로봇개 모델을 예로 들면, 유알디에프 안에 회전값이 세 개가 아니라 네 개로 적힌 부분이 있어서 무조코가 거부합니다. 실습 스크립트가 그 부분을 자동으로 고쳐서 띄웁니다. 실무에서 남이 만든 로봇 모델을 가져올 때 가장 흔하게 하는 작업이 바로 이 형식 변환입니다. 오늘 한 번 경험해 두십시오.` },

    { section: true, eb: 'Block 4 · 15:50–17:40', h: '로봇팔 관절 제어',
      sub: '이제 명령을 내립니다. 그런데 로봇은 시킨 대로 정확히 움직이지 않습니다.',
      nar: `마지막 블록입니다. 드디어 로봇에게 명령을 내립니다. 그런데 재미있는 것을 하나 발견하게 됩니다.` },

    { eb: 'Control', h: '관절을 움직이는 법',
      sub: 'MJCF에 모터를 정의해 두고, 파이썬에서는 목표값만 넣습니다.',
      body: `<pre style="margin-top:1.4cqh"><span class="c"># ① MJCF 안 — 모터를 미리 달아 둔다</span>
&lt;actuator&gt;
  &lt;position name="a1" joint="j1" kp="80" ctrlrange="-3.14 3.14"/&gt;
&lt;/actuator&gt;

<span class="c"># ② 파이썬에서 — 목표 각도만 넣는다 (라디안)</span>
data.ctrl[0] = np.deg2rad(45)
mujoco.mj_step(model, data)</pre>
      <div class="grid g2" style="margin-top:2.4cqh">
        <div class="card"><span class="n">kp</span><span class="t">모터의 힘</span><span class="d">클수록 목표를 강하게 따라갑니다. 너무 크면 부르르 떨립니다</span></div>
        <div class="card"><span class="n">ctrlrange</span><span class="t">움직일 수 있는 범위</span><span class="d">실제 로봇의 관절 한계를 흉내낸 것입니다</span></div>
      </div>`,
      foot: 'MuJoCo의 각도 단위는 라디안입니다. 도(°)로 생각했다면 반드시 변환하세요.',
      nar: `관절을 움직이려면 두 가지가 필요합니다. 먼저 엠제이씨에프 안에 모터를 달아 둬야 합니다. 포지션 액추에이터를 조인트에 붙이고 케이피라는 값을 줍니다. 케이피는 모터의 힘이라고 생각하시면 됩니다. 클수록 목표를 강하게 따라가는데 너무 크면 부르르 떨립니다. 그러고 나면 파이썬에서는 데이터 씨티알에 목표 각도만 넣으면 끝입니다. 여기서 주의할 게 있습니다. 무조코의 각도 단위는 도가 아니라 라디안입니다. 사십오도를 주고 싶으면 넘파이의 뎁투라드 함수로 변환해야 합니다.` },

    { eb: 'ctrl vs qpos', h: '시킨 각도와 실제 각도는 다릅니다',
      sub: '오늘 마지막 블록에서 반드시 관찰해야 할 것입니다.',
      body: `<div class="stack" style="margin-top:1.6cqh">
        <div class="lay"><b>data.ctrl</b><span>내가 시킨 각도 — "45도로 가라"</span></div>
        <div class="lay" style="background:var(--sand);border-color:#E7CDBF"><b>data.qpos</b><span>실제 각도 — "지금 42.7도입니다"</span></div>
      </div>
      <div class="rowlist" style="margin-top:2.4cqh">
        <div class="row"><span class="dot">1</span><span class="t">중력</span><span class="d">팔 자체 무게가 아래로 당깁니다</span></div>
        <div class="row"><span class="dot">2</span><span class="t">관성</span><span class="d">움직이던 것은 계속 움직이려 합니다</span></div>
        <div class="row"><span class="dot">3</span><span class="t">모터 힘의 한계</span><span class="d">kp가 유한하므로 완벽히 따라갈 수 없습니다</span></div>
      </div>`,
      foot: '실제 로봇도 똑같습니다. "시킨 대로 움직인다"는 가정이 깨지는 순간부터 로봇공학이 시작됩니다.',
      nar: `오늘 마지막으로 꼭 관찰해야 할 것입니다. 조작 패널 아래에 시킨 각도와 실제 각도가 함께 표시되는데, 이 둘이 항상 조금씩 다릅니다. 이유는 세 가지입니다. 중력이 팔 무게를 아래로 당기고, 관성 때문에 움직이던 것이 바로 멈추지 않고, 모터의 힘이 무한하지 않기 때문입니다. 실제 로봇도 똑같습니다. 시킨 대로 정확히 움직인다는 가정이 깨지는 순간부터 로봇공학이 시작됩니다. 내일 배울 역기구학도 결국 이 오차를 반복해서 줄여 나가는 방법입니다.` },

    { eb: 'What is Missing', h: 'MuJoCo에 없는 것들',
      sub: '없다고 못 하는 게 아니라, 직접 만들면 됩니다 — 오히려 원리를 배우게 됩니다.',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card warn"><span class="n">!</span><span class="t">역기구학(IK)</span><span class="d">내장 함수가 없습니다 → 자코비안으로 직접 구현. 내일 오전 첫 블록</span></div>
        <div class="card warn"><span class="n">!</span><span class="t">슬라이더 UI</span><span class="d">없습니다 → tkinter로 직접 (한글 라벨 가능). 실습 파일에 이미 있습니다</span></div>
        <div class="card warn"><span class="n">!</span><span class="t">런타임 물체 추가</span><span class="d">모델이 미리 컴파일되어 불가 → XML 조각을 조립해 다시 로드. Day 5</span></div>
      </div>`,
      foot: '내일 아침 첫 블록은 "없는 IK를 30줄로 만들기"입니다.',
      nar: `무조코에 없는 것도 알아 두셔야 합니다. 세 가지입니다. 첫째, 역기구학 내장 함수가 없습니다. 파이불렛에는 있는데 무조코에는 없어서 직접 만들어야 합니다. 그런데 이게 오히려 좋습니다. 내일 아침 첫 블록에서 삼십 줄로 직접 만들어 보면서 원리를 배우게 됩니다. 둘째, 슬라이더 같은 조작 UI가 없어서 티케이인터로 직접 만들어야 합니다. 실습 파일에 이미 만들어 뒀습니다. 셋째, 실행 중에 물체를 새로 만들 수 없습니다. 모델이 미리 컴파일되기 때문입니다. 대신 엑스엠엘이 그냥 텍스트라서 필요한 물체를 문자열로 조립해서 다시 로드하면 됩니다. 다섯째 날에 씁니다.` }
  ],

  assignment: {
    title: '나만의 씬과 물리 실험 보고서',
    lede: 'MJCF를 직접 고쳐 나만의 장면을 만들고, 물리 파라미터가 무엇을 바꾸는지 증명합니다.',
    subtitle: '변경 전/후 화면과 수정한 XML 부분을 함께 붙일 것',
    items: [
      'hello_scene.xml을 수정한 나만의 씬 캡처',
      '무중력(gravity 0) 실행 화면',
      '마찰 0.05 / 1.5 밀기 결과 비교',
      'Menagerie 로봇 3종 이상 실행 캡처',
      '로봇개가 쓰러지는 장면 + 이유 설명',
      '6축 관절 목표자세 2개 + ctrl/qpos 차이 기록'
    ],
    note: '5번이 오늘의 핵심입니다. "왜 관절 각도를 다 줬는데도 서 있지 못하는가"를 자기 말로 쓰세요. 6번은 시킨 각도와 실제 각도의 숫자를 실제로 적어 오셔야 합니다.',
    sample: `<span class="o">학번 / 이름 : 20261234 / 홍길동

6. 관절 제어 기록
   목표자세 A : [0, -30, 60, 0, 45, 0] (도)
   관절2 → 시킨 각도 -30.0°  /  실제 각도 -27.4°  (차이 2.6°)
   해석 : 관절2가 팔 전체 무게를 드는 위치라 중력 편차가 가장 큼.
          kp를 80 → 150으로 올리니 차이가 0.9°로 줄어듦</span>`,
    nar: `과제입니다. 앞의 네 개는 오늘 실습의 증거이고, 다섯 번째와 여섯 번째가 핵심입니다. 다섯 번째는 로봇개가 쓰러지는 장면을 캡처하고 왜 그런지를 자기 말로 쓰는 것입니다. 교재 문장을 베끼지 마시고 본인이 이해한 대로 쓰십시오. 여섯 번째는 시킨 각도와 실제 각도의 숫자를 실제로 적어 오는 것입니다. 어느 관절에서 차이가 가장 컸는지, 그 관절이 팔에서 어떤 위치에 있는지 함께 생각해 보시면 좋습니다.` },

  wrap: {
    done: '시뮬레이터를 왜 쓰는지 알았고, XML 한 장으로 세계를 적었고, 중력과 마찰을 손으로 바꿔 봤고, 로봇 관절을 움직였습니다. 그리고 로봇개가 쓰러지는 것을 봤습니다.',
    next: '내일 · Day 4 — 로봇팔 제어와 시뮬레이터 센서',
    nextDesc: '내일은 "여기로 가라"고 좌표로 명령합니다. MuJoCo에 없는 역기구학을 30줄로 직접 만들고, 그리퍼로 실제로 물체를 집고, 시뮬레이터 안에 카메라를 답니다.',
    nar: `오늘 한 일을 정리하겠습니다. 시뮬레이터를 쓰는 이유를 안전과 반복과 병렬로 정리했고, 무조코의 모델과 데이터 개념을 잡았고, 엠제이씨에프로 세계를 적고 고쳤고, 중력과 마찰과 질량을 바꿔 물리를 관찰했습니다. 실제로 팔리는 로봇들을 띄워 봤고, 그중 로봇개가 쓰러지는 장면도 봤습니다. 내일은 한 단계 올라갑니다. 관절 각도가 아니라 좌표로 명령합니다. 여기로 가라고 하면 관절 여섯 개가 알아서 맞춰지는 역기구학을 직접 만들고, 그리퍼로 물체를 집고, 시뮬레이터 안에 카메라를 답니다. 수고하셨습니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '가상의 몸 · 시뮬레이터와 MJCF',
    standfirst: '오늘부터 무대가 바뀝니다. 웹캠 대신 3D 창이 뜨고, 이미지 대신 XML을 고칩니다. 가장 먼저 열어 볼 파일은 코드가 아니라 <code>assets/arm_scene.xml</code>입니다. 이 XML을 이해하면 오늘의 절반은 끝난 것입니다.',
    rules: [
      ['XML부터 연다', '스크립트를 실행하기 전에 씬 XML을 먼저 열어 보세요. 무엇이 있는지 알고 실행하는 것과 아닌 것은 전혀 다릅니다.'],
      ['값을 바꿔 보고 되돌린다', '숫자를 바꿔 실행하고 원래대로 되돌리세요. 바꾼 채 다음 미션으로 가면 원인 모를 오류가 생깁니다.'],
      ['Alt+Tab을 기억한다', '조작 패널(슬라이더 창)은 3D 창 뒤에 숨습니다. 오늘 가장 많이 나올 질문입니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '설치와 첫 실행', time: '09:00–10:50',
        lede: 'MuJoCo 설치는 한 줄입니다. 컴파일러도 GPU도 필요 없습니다.',
        missions: [
          { n: 1, h: '설치와 확인', body: `
      <pre><span class="p">$</span> conda activate physicalai
<span class="p">$</span> pip install mujoco robot_descriptions
<span class="p">$</span> python -c "import mujoco; print(mujoco.__version__)"
<span class="o">3.x.x</span></pre>
      <p>실습 파일 폴더로 이동하고 설치 검증 스크립트를 실행합니다.</p>
      <pre><span class="p">$</span> cd MuJoCo실습폴더경로
<span class="p">$</span> python verify_setup.py</pre>
      <div class="box warn"><span class="lbl">중요</span>
        <p>반드시 <strong>실습 파일이 있는 폴더로 <code>cd</code></strong> 한 뒤 실행하세요. <code>mj_helpers.py</code>를 같은 폴더에서 찾기 때문에, 다른 위치에서 실행하면 <code>ModuleNotFoundError</code>가 납니다.</p></div>` },

          { n: 2, h: 'XML을 먼저 열어 본다 ★', body: `
      <p>코드보다 먼저 <code>assets/arm_scene.xml</code>을 엽니다. 다음 다섯 가지를 찾으세요.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">option</span><span class="v">gravity와 timestep<small>중력 -9.81, 한 스텝의 시간 간격</small></span></div>
        <div class="dlrow"><span class="k">body</span><span class="v">몇 개가 중첩되어 있나<small>body 안의 body가 팔의 관절 구조입니다</small></span></div>
        <div class="dlrow"><span class="k">joint</span><span class="v">type이 hinge인지 slide인지<small>회전 관절 6개 + 그리퍼 slide 2개</small></span></div>
        <div class="dlrow"><span class="k">geom</span><span class="v">type · size · rgba<small>모양·크기·색. 부딪히는 것도 geom입니다</small></span></div>
        <div class="dlrow"><span class="k">actuator</span><span class="v">position 모터가 몇 개인가<small>이게 있어야 data.ctrl로 명령할 수 있습니다</small></span></div>
      </div>
      <div class="box q"><span class="lbl">확인 질문</span><ul>
        <li>큐브(빨간 상자)에는 <code>joint</code>가 있나요? 있다면 type은 무엇인가요?</li>
        <li>바닥(plane)에는 왜 <code>joint</code>가 없을까요?</li>
      </ul></div>` },

          { n: 3, h: '첫 시뮬레이션', body: `
      <pre><span class="p">$</span> python lab2_1_first_sim.py</pre>
      <p>3D 창이 열리고 바닥 위의 로봇·공·상자가 중력에 의해 떨어집니다.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">드래그</span><span class="v">시점 회전</span></div>
        <div class="dlrow"><span class="k">휠</span><span class="v">확대 / 축소</span></div>
        <div class="dlrow"><span class="k">Space</span><span class="v">일시정지 / 재개</span></div>
      </div>
      <div class="box check"><span class="lbl">코드 3줄만 보세요</span>
        <pre style="margin-top:8px">model = mujoco.MjModel.from_xml_path(...)   # 설계도
data  = mujoco.MjData(model)                # 상태
mujoco.mj_step(model, data)                 # 시간 한 칸</pre>
        <p>모든 MuJoCo 프로그램이 이 셋으로 되어 있습니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: 'MJCF와 물리 실험', time: '11:00–12:50',
        lede: '값을 바꾸고 실행하고 관찰합니다. 바꾼 값은 반드시 기록해 두세요.',
        missions: [
          { n: 4, h: '무중력 만들기', body: `
      <p><code>lab2_1_first_sim.py</code>에서 중력 설정 줄을 찾아 0으로 바꿉니다.</p>
      <pre>model.opt.gravity[:] = [0, 0, <span class="o">-9.81</span>]   <span class="c"># 원래</span>
model.opt.gravity[:] = [0, 0, <span class="o">0</span>]       <span class="c"># 무중력</span>
model.opt.gravity[:] = [0, 0, <span class="o">-1.62</span>]   <span class="c"># 달 중력</span></pre>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>무중력에서 공은 어떻게 되나요? <strong>가만히 떠 있나요, 아니면 처음 속도대로 계속 가나요?</strong> 왜 그럴까요?</p></div>
      <div class="box warn"><span class="lbl">되돌리기</span><p>다음 미션 전에 <code>-9.81</code>로 되돌려 놓으세요.</p></div>` },

          { n: 5, h: 'XML을 직접 고쳐 나만의 씬 만들기 ★', body: `
      <p><code>assets/hello_scene.xml</code>을 열고 <code>&lt;geom&gt;</code>의 값을 바꿔 봅니다.</p>
      <pre>&lt;geom type="box" size="<span class="o">0.05 0.05 0.05</span>" rgba="<span class="o">1 0 0 1</span>" pos="<span class="o">0.3 0 0.2</span>"/&gt;
<span class="c">&lt;!--        ↑크기(반지름)          ↑색 R G B A       ↑위치 x y z --&gt;</span></pre>
      <div class="box check"><span class="lbl">해볼 것</span><ul>
        <li><code>size</code>를 2배로 → 물체가 커집니다 (size는 <strong>반</strong>지름입니다)</li>
        <li><code>rgba</code>를 <code>0 0 1 1</code>로 → 파란색</li>
        <li><code>pos</code>의 z를 0.5로 → 더 높은 곳에서 떨어집니다</li>
        <li><code>&lt;geom&gt;</code> 줄을 통째로 복사해 물체를 하나 더 추가</li>
      </ul></div>
      <div class="box q"><span class="lbl">핵심</span>
        <p>로봇을 <strong>'불러오는' 것이 아니라 '적는'</strong> 것 — 이것이 MuJoCo의 방식입니다. 지금 여러분은 세계를 텍스트로 쓰고 있습니다.</p></div>` },

          { n: 6, h: '중력·마찰·질량 실시간 실험', body: `
      <pre><span class="p">$</span> python lab2_2_build_scene.py</pre>
      <p><strong>별도의 조작 패널 창</strong>이 뜹니다. 안 보이면 <strong>Alt+Tab</strong>으로 찾으세요.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">마찰 0.05</span><span class="v">'큐브 밀기' → 멀리 미끄러짐<small>얼음판과 같습니다</small></span></div>
        <div class="dlrow"><span class="k">마찰 1.5</span><span class="v">'큐브 밀기' → 거의 안 움직임<small>고무판과 같습니다</small></span></div>
        <div class="dlrow"><span class="k">질량 ↑</span><span class="v">같은 힘으로 밀어도 덜 움직임</span></div>
      </div>
      <div class="box check"><span class="lbl">꼭 기억할 구분</span>
        <p><code>model</code> = 변하지 않는 <strong>설계도</strong> (질량·마찰·중력 설정·관절 구조)<br>
           <code>data</code> = 지금 이 순간의 <strong>상태</strong> (<code>qpos</code> 각도, <code>qvel</code> 속도, <code>ctrl</code> 명령)</p></div>
      <div class="box q"><span class="lbl">내일 예고</span>
        <p>내일 그리퍼로 큐브를 집습니다. 물체가 <strong>미끄러져 떨어지면</strong> 오늘 만진 <code>friction</code>을 올리면 됩니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '로봇 바꿔 보기', time: '13:50–15:40',
        lede: '실제로 판매되는 로봇 모델을 불러옵니다. 최초 1회 다운로드에 1~2분 걸립니다.',
        missions: [
          { n: 7, h: 'Menagerie 로봇 4종', body: `
      <pre><span class="p">$</span> python robot_zoo.py              <span class="c"># 목록</span>
<span class="p">$</span> python robot_zoo.py arm          <span class="c"># 로봇팔 (다운로드 불필요)</span>
<span class="p">$</span> python robot_zoo.py dog          <span class="c"># 유니트리 Go2</span>
<span class="p">$</span> python robot_zoo.py h1           <span class="c"># 유니트리 H1 휴머노이드</span>
<span class="p">$</span> python robot_zoo.py hand         <span class="c"># 섀도우 로봇 핸드</span></pre>
      <div class="box q"><span class="lbl">관찰</span><ul>
        <li><code>hand</code>의 관절은 몇 개로 보이나요? 사람 손과 비교하면?</li>
        <li><code>dog</code>의 다리 하나에 관절이 몇 개 있나요? (hip · thigh · calf)</li>
      </ul></div>` },

          { n: 8, h: '쓰러지는 로봇 관찰하기 ★ 오늘의 핵심', body: `
      <p><code>dog</code>와 <code>h1</code>을 띄워 두고 <strong>10초 이상 지켜보세요.</strong> 관절 각도를 다 줬는데도 옆으로 넘어집니다.</p>
      <div class="box q"><span class="lbl">스스로 답해 보세요</span><ol>
        <li>로봇은 '서 있는 자세'를 정확히 취하고 있습니다. 그런데 왜 쓰러질까요?</li>
        <li>사람은 눈을 감고도 서 있을 수 있습니다. 무엇을 하고 있는 걸까요?</li>
        <li>넘어지지 않게 하려면 무엇이 더 필요할까요?</li>
      </ol></div>
      <div class="box check"><span class="lbl">답</span>
        <p>균형은 <strong>'자세'가 아니라 '반응'</strong>입니다. 기울어지는 순간마다 다리를 다시 놓아야 하는데, 미리 정해 둔 각도로는 불가능합니다.<br>
        실제 Go2의 보행도 사람이 수식으로 짠 것이 아니라 <strong>강화학습</strong>으로 만든 것입니다. → <strong>Day 5·6</strong></p></div>
      <div class="box warn"><span class="lbl">과제</span><p>이 쓰러지는 장면을 캡처하세요. 오늘 과제 5번입니다.</p></div>` },

          { n: 9, h: 'URDF를 MJCF로 가져오기', body: `
      <pre><span class="p">$</span> python lab_mujoco_microtaur.py</pre>
      <p>PyBullet용 <strong>URDF</strong> 로봇을 MuJoCo로 가져옵니다. 그대로는 안 열려서 스크립트가 자동 보정합니다.</p>
      <div class="box check"><span class="lbl">무엇이 문제였나</span>
        <p>URDF 안에 회전값(<code>rpy</code>)이 3개여야 하는데 4개로 적힌 부분이 있어 MuJoCo가 거부합니다. 스크립트가 그 부분을 고쳐서 <code>microtaur_mjc/</code>에 저장한 뒤 엽니다.</p></div>
      <div class="box q"><span class="lbl">실무 감각</span>
        <p>인터넷에 공개된 로봇은 대부분 URDF입니다. 남의 모델을 가져올 때 <strong>형식 변환과 보정</strong>이 가장 흔한 작업입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 4', h: '로봇팔 관절 제어', time: '15:50–17:40',
        lede: '드디어 명령을 내립니다. 슬라이더 창은 Alt+Tab으로 찾으세요.',
        missions: [
          { n: 10, h: '슬라이더로 6축 움직이기', body: `
      <pre><span class="p">$</span> python lab3_1_joint_control.py</pre>
      <p>조작 패널의 슬라이더로 관절 6개를 하나씩 움직입니다. 단위는 <strong>도(°)</strong>입니다.</p>
      <div class="box q"><span class="lbl">관절 하나씩 확인</span><ul>
        <li>1번 관절만 움직이면 팔 전체가 회전하나요?</li>
        <li>6번(손목) 관절만 움직이면 무엇이 달라지나요?</li>
        <li>어느 관절이 손끝 위치를 가장 크게 바꾸나요?</li>
      </ul></div>
      <div class="box check"><span class="lbl">내일 복선</span>
        <p>"손끝을 저기로 보내려면 관절 6개를 각각 몇 도로?"를 지금은 슬라이더로 <strong>감으로</strong> 맞추고 있습니다. 이것을 계산으로 푸는 것이 내일 배울 <strong>역기구학</strong>입니다.</p></div>` },

          { n: 11, h: 'ctrl과 qpos의 차이 관찰 ★', body: `
      <p>패널 아래 상태줄에 <strong>시킨 각도</strong>(<code>data.ctrl</code>)와 <strong>실제 각도</strong>(<code>data.qpos</code>)가 함께 나옵니다.</p>
      <pre><span class="o">관절2  시킨 각도 -30.0°   실제 각도 -27.4°   (차이 2.6°)</span></pre>
      <div class="box q"><span class="lbl">확인 질문</span><ul>
        <li>어느 관절에서 차이가 가장 큰가요? 그 관절은 팔에서 어떤 위치인가요?</li>
        <li>팔을 수평으로 뻗었을 때와 아래로 내렸을 때, 차이가 달라지나요?</li>
      </ul></div>
      <div class="box check"><span class="lbl">이유 세 가지</span>
        <p><strong>중력</strong>(팔 무게가 아래로 당김) · <strong>관성</strong>(움직이던 것은 바로 안 멈춤) · <strong>모터 힘의 한계</strong>(<code>kp</code>가 유한함)</p></div>
      <div class="box warn"><span class="lbl">과제</span><p>두 자세에 대해 시킨 각도와 실제 각도를 <strong>숫자로</strong> 적어 오세요. 오늘 과제 6번입니다.</p></div>` },

          { n: 12, h: '나만의 자세 만들기', body: `
      <p>코드에서 <code>target_deg</code> 리스트를 찾아 값을 바꿉니다.</p>
      <pre>target_deg = [<span class="o">0</span>, <span class="o">-30</span>, <span class="o">60</span>, <span class="o">0</span>, <span class="o">45</span>, <span class="o">0</span>]   <span class="c"># 관절 1~6 목표 각도(도)</span></pre>
      <p><code>목표 자세로 이동</code> 버튼을 누르면 그 자세로 갑니다. 두 자세를 만들어 번갈아 실행해 보세요.</p>
      <div class="box check"><span class="lbl">심화 — kp 바꿔 보기</span>
        <p><code>assets/arm_scene.xml</code>의 <code>&lt;position ... kp="80"/&gt;</code>를 <strong>150</strong>으로 올려 보세요. 시킨 각도와 실제 각도의 차이가 줄어듭니다. <strong>300</strong>까지 올리면 어떻게 되나요?</p></div>` }
        ]
      }
    ],
    errors: [
      ['조작 패널(슬라이더 창)이 안 보임', 'MuJoCo 3D 창 뒤에 가려짐', '<strong>Alt+Tab</strong>으로 찾으세요. 오늘 가장 많은 질문입니다'],
      ['<code>ModuleNotFoundError: mj_helpers</code>', '실습 폴더 밖에서 실행', '<code>cd</code>로 실습 파일 폴더로 이동한 뒤 실행'],
      ['3D 창이 안 뜸 (원격 접속)', '화면 출력이 없는 환경', '로컬 PC에서 실행하세요'],
      ['Menagerie 다운로드가 느림/실패', '최초 1회 네트워크 다운로드', '네트워크 확인 후 재시도. 한 번 받으면 캐시됩니다'],
      ['로봇개·휴머노이드가 쓰러짐', '걷기 제어기가 없음', '<strong>정상입니다.</strong> 오늘 관찰할 대상입니다 → Day 5 강화학습'],
      ['XML 수정 후 <code>Error: XML parse</code>', '태그가 안 닫혔거나 따옴표 누락', '수정한 줄의 <code>&lt;</code> <code>/&gt;</code> <code>"</code>를 확인'],
      ['관절이 움직이지 않음', 'actuator가 없는 joint', 'MJCF에 <code>&lt;position joint="..."/&gt;</code>가 있는지 확인'],
      ['팔이 부르르 떨림', 'kp가 너무 큼', '<code>kp</code>를 낮추거나 <code>damping</code>을 추가']
    ],
    checklist: [
      '시뮬레이터를 쓰는 이유를 <strong>안전 · 반복 · 병렬</strong>로 말할 수 있다',
      '<code>model</code>과 <code>data</code>의 차이를 예를 들어 설명할 수 있다',
      '<code>MjModel</code> → <code>MjData</code> → <code>mj_step</code> 세 줄의 역할을 안다',
      'MJCF에서 <code>body</code> · <code>joint</code> · <code>geom</code> · <code>actuator</code>를 찾았다',
      '<code>hello_scene.xml</code>을 고쳐 나만의 씬을 만들었다',
      '중력을 0으로 만들어 무중력을 관찰했다',
      '마찰 0.05와 1.5에서 큐브 밀기 결과를 비교했다',
      'Menagerie 로봇을 3종 이상 띄워 봤다',
      '<strong>로봇개가 쓰러지는 이유</strong>를 자기 말로 설명할 수 있다',
      'URDF를 MuJoCo로 가져올 때 변환이 필요한 이유를 안다',
      '슬라이더로 6축 관절을 제어했다',
      '<code>ctrl</code>과 <code>qpos</code>가 다른 이유 3가지를 말할 수 있다'
    ]
  },

  /* ================= 퀴즈 ================= */
  quizTitle: '시뮬레이터와 MJCF 퀴즈',
  quiz: [
    { q: '실물 로봇 대신 시뮬레이터로 시작하는 이유가 <strong>아닌</strong> 것은?',
      o: ['시뮬레이터가 실물보다 물리적으로 더 정확해서', '안전 — 잘못된 코드가 사고로 이어지지 않아서', '반복 — 부품 마모 없이 무한히 실험할 수 있어서', '병렬 — GPU에서 수천 대를 동시에 굴릴 수 있어서'], a: 0,
      e: '시뮬레이터는 현실의 근사입니다. 이 차이를 리얼리티 갭이라 부르고, 이를 좁히는 것이 Day 6의 Sim-to-Real 주제입니다.' },

    { q: 'MuJoCo는 무엇의 줄임말인가요?',
      o: ['Multi-Joint dynamics with Contact', 'Multi-User Joint Controller', 'Modular Joint Computation', 'Mujoco Universal Joint Core'], a: 0,
      e: '관절이 많고 서로 부딪히는 로봇을 정확하고 빠르게 계산한다는 뜻입니다. 잡기·걷기 같은 접촉 동작에 강합니다.' },

    { q: '<code>model.body_mass</code>는 어느 쪽에 속하나요?',
      o: ['model — 변하지 않는 설계도', 'data — 지금 이 순간의 상태', '둘 다 아니다', '상황에 따라 다르다'], a: 0,
      e: '질량·마찰·관절 구조·중력 설정은 설계도(model)입니다. 관절 각도·속도·모터 명령이 상태(data)입니다.' },

    { q: '지금 관절이 몇 도인지 알려면 무엇을 읽어야 하나요?',
      o: ['data.qpos', 'model.qpos', 'data.ctrl', 'model.jnt_range'], a: 0,
      e: '<code>qpos</code>가 실제 각도, <code>ctrl</code>이 시킨 각도입니다. 이 둘은 중력·관성·모터 한계 때문에 항상 조금 다릅니다.' },

    { q: '시간을 한 스텝 진행시키는 함수는? (직접 입력)', t: true,
      acc: ['mujoco.mj_step(model, data)', 'mj_step(model, data)', 'mujoco.mj_step', 'mj_step'], ans: 'mujoco.mj_step(model, data)',
      e: 'MjModel → MjData → mj_step. 이 셋이 모든 MuJoCo 프로그램의 뼈대입니다.' },

    { q: 'MJCF에서 물체가 <strong>어떻게 움직일 수 있는지</strong>를 정하는 태그는?',
      o: ['joint', 'geom', 'body', 'actuator'], a: 0,
      e: '<code>joint</code>가 움직임의 자유도를 정합니다. hinge는 회전, slide는 직선, free는 제약 없음입니다.' },

    { q: 'MJCF에서 <strong>모양과 충돌</strong>을 담당하는 태그는?',
      o: ['geom', 'joint', 'body', 'option'], a: 0,
      e: 'geom은 보이는 모양이자 부딪히는 실체입니다. box · sphere · capsule · mesh 등을 씁니다.' },

    { q: '<code>joint</code>는 있는데 <code>actuator</code>가 없으면?',
      o: ['중력·충돌로 움직이지만 내가 명령할 수는 없다', '아예 움직이지 않는다', '오류가 난다', '자동으로 모터가 생성된다'], a: 0,
      e: '<code>data.ctrl</code>로 명령하려면 MJCF에 <code>&lt;position&gt;</code> 같은 actuator가 미리 정의되어 있어야 합니다.' },

    { q: 'body 안에 body를 중첩하면 무엇이 되나요?',
      o: ['관절로 이어진 구조 — 팔, 다리', '같은 위치의 복사본', '충돌하지 않는 그룹', '렌더링 레이어'], a: 0,
      e: 'body를 겹겹이 중첩하고 각각에 joint를 달면 그게 로봇 팔이고 다리입니다.' },

    { q: 'PyBullet과 비교했을 때 MuJoCo의 방식은?',
      o: ['로봇을 XML에 직접 적는다', '로봇 파일을 불러오기만 한다', '로봇을 GUI에서 그린다', '로봇 모델을 자동 생성한다'], a: 0,
      e: 'PyBullet은 URDF 파일을 "불러오고", MuJoCo는 MJCF에 "적습니다". 처음엔 불편해도 훨씬 자유롭습니다.' },

    { q: '중력을 없애는 코드는? (직접 입력)', t: true,
      acc: ['model.opt.gravity[:] = [0, 0, 0]', 'model.opt.gravity[:] = [0,0,0]', 'model.opt.gravity = [0, 0, 0]'], ans: 'model.opt.gravity[:] = [0, 0, 0]',
      e: '중력은 model(설계도)에 속합니다. z축이 위쪽이므로 평소에는 <code>[0, 0, -9.81]</code>입니다.' },

    { q: '마찰(<code>friction</code>)을 0.05로 낮추고 큐브를 밀면?',
      o: ['멀리 미끄러진다', '거의 움직이지 않는다', '공중에 뜬다', '변화가 없다'], a: 0,
      e: '얼음판과 같습니다. 반대로 1.5로 올리면 고무판처럼 거의 안 움직입니다. 내일 그리퍼로 집을 때 이 값이 결정적입니다.' },

    { q: 'MuJoCo 기본 패키지에 로봇 모델이 <strong>없다</strong>면 어디서 가져오나요?',
      o: ['MuJoCo Menagerie', 'MuJoCo Hub', 'PyPI robot 패키지', 'Isaac Sim 에셋'], a: 0,
      e: '딥마인드가 관리하는 실측 기반 로봇 60여 종 모음입니다. <code>robot_descriptions</code>로 받아 씁니다.' },

    { q: '로봇개(Go2)를 띄우면 잠시 후 쓰러지는 이유는?',
      o: ['균형은 정해진 각도가 아니라 매 순간의 반응이라서', '모델 파일이 손상되어서', '중력 설정이 잘못되어서', 'GPU가 없어서'], a: 0,
      e: '오늘 가장 중요한 장면입니다. 개루프(수식만)로는 걷지 못합니다. 실제 Go2 보행도 강화학습으로 만듭니다 → Day 5·6' },

    { q: 'URDF 로봇을 MuJoCo에서 열 때 변환·보정이 필요한 이유는?',
      o: ['형식이 달라 호환되지 않는 항목이 있어서', 'URDF가 유료 형식이라서', 'MuJoCo가 XML을 못 읽어서', '파일 크기가 커서'], a: 0,
      e: 'microtaur의 경우 rpy 값이 3개가 아니라 4개인 부분이 있어 그대로는 열리지 않습니다. 실무에서 가장 흔한 작업입니다.' },

    { q: '관절에 목표 각도를 주는 코드는? (직접 입력 — 0번 관절)', t: true,
      acc: ['data.ctrl[0] = 목표값', 'data.ctrl[0]', 'data.ctrl[0] = np.deg2rad(45)'], ans: 'data.ctrl[0] = np.deg2rad(45)',
      e: 'MuJoCo의 각도 단위는 <strong>라디안</strong>입니다. 도(°)로 생각했다면 반드시 변환해야 합니다.' },

    { q: '<code>data.ctrl</code>과 <code>data.qpos</code>가 다른 이유가 <strong>아닌</strong> 것은?',
      o: ['단위가 도와 라디안으로 달라서', '중력이 팔 무게를 당겨서', '관성 때문에 바로 멈추지 않아서', '모터 힘(kp)이 유한해서'], a: 0,
      e: '둘 다 라디안입니다. 차이는 물리적인 이유 — 중력·관성·모터 한계 — 때문에 생깁니다.' },

    { q: 'MuJoCo에 <strong>없어서</strong> 내일 직접 만들어야 하는 것은?',
      o: ['역기구학(IK)', '충돌 검사', '중력 계산', '3D 렌더링'], a: 0,
      e: 'PyBullet의 <code>calculateInverseKinematics</code>에 해당하는 함수가 없습니다. 자코비안으로 30줄이면 직접 만들 수 있고, 오히려 원리를 배우게 됩니다.' }
  ]
};
