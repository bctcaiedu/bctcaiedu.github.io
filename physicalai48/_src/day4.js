module.exports = {
  day: 4,
  title: '로봇팔 제어와 시뮬레이터 센서',
  theme: '관절 각도가 아니라 좌표로 명령한다',

  openingNar: `넷째 날입니다. 어제 여러분은 슬라이더로 관절을 하나씩 움직이며 손끝을 원하는 자리에 보내려고 애쓰셨을 겁니다. 감으로 맞추는 건 재미있지만 실용적이지는 않습니다. 오늘은 그걸 계산으로 풉니다. 여기 좌표로 가라고 하면 관절 여섯 개가 알아서 맞춰지게 만듭니다. 그런데 무조코에는 그 기능이 없습니다. 없으니까 만들 겁니다. 삼십 줄이면 됩니다. 오후에는 시뮬레이터 안에 카메라를 답니다. 그리고 그 카메라가 이틀 전 여러분을 괴롭혔던 라벨링 작업을 공짜로 해 주는 것을 보게 됩니다.`,

  goals: [
    ['자코비안이 무엇인지를', '"관절을 조금 움직이면 손끝이 어디로 가는지"로 설명할 수 있다'],
    ['역기구학을', '내장 함수 없이 직접 구현해 목표 좌표로 보낼 수 있다'],
    ['그리퍼로 물체를', '마찰로 실제로 집어 옮길 수 있다'],
    ['시뮬레이터 카메라로', 'RGB·Depth·Segmentation 3종을 취득할 수 있다'],
    ['깊이 영상으로', '픽셀을 3D 좌표로 역투영할 수 있다'],
    ['합성 학습 데이터를', '시뮬레이터에서 라벨과 함께 자동 생성할 수 있다']
  ],
  goalsNar: `오늘의 목표는 여섯 가지입니다. 앞의 세 개는 로봇팔입니다. 자코비안이라는 개념을 잡고, 역기구학을 직접 만들고, 그리퍼로 물체를 집습니다. 뒤의 세 개는 센서입니다. 시뮬레이터 안에 카메라를 달아 세 종류의 영상을 얻고, 깊이 영상으로 픽셀을 삼차원 좌표로 되돌리고, 마지막으로 학습용 합성 데이터를 자동으로 만듭니다. 오늘이 끝나면 보는 것과 움직이는 것이 만날 준비가 끝납니다. 실제로 만나는 건 내일입니다.`,

  blocks: [
    { time: '09:00–10:50', title: '역기구학 직접 만들기', desc: '자코비안 · 30줄짜리 IK' },
    { time: '11:00–12:50', title: '픽 앤 플레이스', desc: '그리퍼 · 마찰로 진짜 집기' },
    { time: '13:50–15:40', title: '시뮬레이터 카메라', desc: 'RGB · Depth · Segmentation · 역투영' },
    { time: '15:50–17:40', title: '좌표 변환과 합성 데이터', desc: '캘리브레이션 · 자동 라벨 생성' }
  ],
  blocksNar: `오늘 하루는 네 블록입니다. 오전 두 블록은 로봇팔, 오후 두 블록은 카메라입니다. 오전 첫 블록이 오늘 유일하게 수식이 나오는 시간인데, 겁내지 마십시오. 수식은 한 줄이고 그 한 줄이 무슨 뜻인지만 알면 됩니다. 오후 마지막 블록은 조금 특별합니다. 이틀 전에 여러분이 손으로 했던 라벨링을 시뮬레이터가 대신 해 주는 것을 보게 되는데, 그때 이틀 전의 지루함을 기억하고 계셔야 그 가치가 보입니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–10:50', h: '역기구학 직접 만들기',
      sub: '어제 슬라이더로 감을 잡아 맞추던 일을, 오늘은 계산으로 풉니다.',
      nar: `첫 번째 블록입니다. 어제 슬라이더로 감을 잡아 맞추던 일을 오늘은 계산으로 풉니다.` },

    { eb: 'FK vs IK', h: '두 방향의 질문',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">순기구학 · FK</span><span class="t">관절 → 손끝</span><span class="d">"관절이 각각 30도, -45도, 60도일 때 손끝은 어디에 있나?"<br>계산이 쉽습니다. 각도를 차례로 곱해 나가면 답이 하나 나옵니다</span></div>
        <div class="card warn"><span class="n">역기구학 · IK</span><span class="t">손끝 → 관절</span><span class="d">"손끝을 (0.4, 0.1, 0.2)로 보내려면 관절을 각각 몇 도로?"<br>어렵습니다. 답이 여러 개일 수도, 아예 없을 수도 있습니다</span></div>
      </div>
      <div class="bannerG" style="margin-top:2.4cqh">우리가 실제로 하고 싶은 것은 언제나 IK입니다. "저 컵을 잡아라"이지 "3번 관절을 47도로"가 아니니까요.</div>`,
      nar: `기구학에는 두 방향이 있습니다. 순기구학은 관절 각도를 알 때 손끝 위치를 구하는 것입니다. 이건 쉽습니다. 각도를 차례로 곱해 나가면 답이 하나 딱 나옵니다. 역기구학은 반대입니다. 손끝을 여기로 보내고 싶은데 관절을 각각 몇 도로 해야 하느냐입니다. 이게 어렵습니다. 답이 여러 개일 수도 있고, 팔이 닿지 않는 곳이면 답이 아예 없을 수도 있습니다. 그런데 우리가 실제로 하고 싶은 일은 언제나 역기구학입니다. 저 컵을 잡아라이지, 삼번 관절을 사십칠도로 돌려라가 아니니까요.` },

    { eb: 'Jacobian', h: '자코비안 — 한 문장으로',
      sub: '"관절을 조금 움직이면 손끝이 어느 방향으로 얼마나 가는가"',
      body: `<div class="stack" style="margin-top:1.6cqh">
        <div class="lay"><b>입력</b><span>관절을 아주 조금 돌린 양 (Δq)</span></div>
        <div class="lay" style="background:var(--soft)"><b>자코비안 J</b><span>그 관계를 담은 표 — 행은 손끝의 x·y·z, 열은 각 관절</span></div>
        <div class="lay" style="background:var(--soft)"><b>출력</b><span>손끝이 움직인 양 (Δx = J · Δq)</span></div>
      </div>
      <div class="banner" style="margin-top:2.4cqh">우리가 알고 싶은 것은 반대 방향입니다 — 손끝을 이만큼 옮기려면 관절을 얼마나 돌려야 하나?</div>`,
      foot: 'MuJoCo에서는 mj_jacSite 한 줄이면 이 표를 받아 올 수 있습니다.',
      nar: `자코비안이라는 말이 어렵게 들리지만 뜻은 한 문장입니다. 관절을 아주 조금 움직이면 손끝이 어느 방향으로 얼마나 가는가, 그 관계를 담은 표입니다. 행은 손끝의 엑스 와이 제트이고 열은 각 관절입니다. 예를 들어 이번 관절을 일도 돌리면 손끝이 엑스로 삼 밀리미터 간다, 같은 정보가 들어 있습니다. 그런데 우리가 알고 싶은 건 반대 방향입니다. 손끝을 이만큼 옮기고 싶은데 관절을 얼마나 돌려야 하느냐입니다. 다행히 무조코에서는 엠제이 자크사이트라는 함수 한 줄로 이 표를 받아 올 수 있습니다.` },

    { eb: 'The One Line', h: '역기구학, 사실 이게 전부입니다',
      body: `<pre style="margin-top:1.4cqh"><span class="c"># 손끝 오차 e 를 줄이려면 관절을 이만큼 돌린다</span>
<span class="c">#</span>
<span class="c">#        Δq = Jᵀ (J Jᵀ + λ²I)⁻¹ e</span>
<span class="c">#</span>
<span class="c">for</span> _ <span class="c">in</span> range(300):
    mujoco.mj_jacSite(model, data, jacp, jacr, site_id)   <span class="c"># ① 자코비안 받기</span>
    e  = target - data.site_xpos[site_id]                 <span class="c"># ② 목표까지의 오차</span>
    dq = jacp.T @ np.linalg.solve(jacp @ jacp.T + lam**2*np.eye(3), e)
    q += dq                                               <span class="c"># ③ 관절을 조금 돌린다</span>
    mujoco.mj_kinematics(model, data)                     <span class="c"># ④ 다시 계산 → 반복</span></pre>
      <div class="bannerG" style="margin-top:2cqh">목표까지의 오차를 보고 → 조금 다가가고 → 다시 본다. 300번 반복하면 도착합니다.</div>`,
      foot: 'λ(람다)는 안전장치입니다. 팔이 쭉 펴진 특이점에서 관절이 폭주하는 것을 막습니다.',
      nar: `수식이 나왔지만 겁내지 마십시오. 의미는 단순합니다. 목표까지 얼마나 남았는지 보고, 그만큼 다가가도록 관절을 조금 돌리고, 다시 본다. 이걸 삼백 번 반복하면 도착합니다. 등산할 때 정상을 보고 한 걸음 가고 다시 보는 것과 똑같습니다. 수식에서 제이는 자코비안이고 이는 목표까지의 오차입니다. 제이에 티가 붙은 건 전치인데, 역행렬을 안전하게 구하기 위한 형태입니다. 람다는 안전장치입니다. 팔이 완전히 쭉 펴진 상태를 특이점이라고 하는데, 거기서는 계산이 무한대로 튀어서 관절이 폭주합니다. 람다가 그걸 막아 줍니다. 이 여섯 줄이 역기구학의 전부입니다.` },

    { eb: 'Limits', h: '팔이 닿지 않는 곳이 있습니다',
      sub: '이 로봇팔의 작업 반경 — 대략 반경 0.26~0.48 m, 높이 0.03~0.20 m',
      body: `<div class="rowlist" style="margin-top:1.4cqh">
        <div class="row"><span class="dot">×</span><span class="t">너무 멀다</span><span class="d">팔 길이를 넘어서면 아무리 반복해도 도달할 수 없습니다</span></div>
        <div class="row"><span class="dot">×</span><span class="t">너무 가깝다</span><span class="d">몸통에 부딪혀 접을 수 없는 구간이 있습니다</span></div>
        <div class="row"><span class="dot">×</span><span class="t">너무 낮거나 높다</span><span class="d">바닥 아래, 또는 팔이 완전히 펴져도 닿지 않는 높이</span></div>
      </div>
      <div class="banner" style="margin-top:2.4cqh">[주의] ... 닿기 어렵습니다 — 이 메시지가 뜨면 IK 버그가 아니라 좌표가 범위 밖인 것입니다.</div>`,
      foot: '실제 산업용 로봇의 카탈로그에도 이 작업 반경(reach)이 가장 먼저 적혀 있습니다.',
      nar: `역기구학에는 답이 없는 경우가 있습니다. 팔이 닿지 않는 곳입니다. 너무 멀면 팔 길이를 넘어서서 못 가고, 너무 가까우면 몸통에 부딪혀서 접을 수가 없습니다. 이 실습 로봇팔은 대략 반경 이십육 센티에서 사십팔 센티, 높이 삼 센티에서 이십 센티 구간을 정확히 커버합니다. 실습 중에 주의, 닿기 어렵습니다라는 메시지가 뜨면 코드 버그를 찾지 마십시오. 좌표가 범위 밖인 겁니다. 참고로 실제 산업용 로봇 카탈로그에도 이 작업 반경이 가장 먼저 적혀 있습니다. 로봇을 고를 때 첫 번째로 보는 숫자입니다.` },

    { section: true, eb: 'Block 2 · 11:00–12:50', h: '픽 앤 플레이스',
      sub: '집기를 흉내내지 않습니다. 손가락 두 개로 실제로 집습니다.',
      nar: `두 번째 블록입니다. 물체를 집습니다. 그런데 집는 시늉을 하는 게 아니라 진짜로 집습니다.` },

    { eb: 'Real Grasping', h: '붙이기가 아니라 집기',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card warn"><span class="n">PyBullet 방식</span><span class="t">제약으로 붙인다</span><span class="d">그리퍼가 없어 <code>createConstraint()</code>로 물체를 팔에 접착. 물리적으로는 가짜입니다</span></div>
        <div class="card"><span class="n">MuJoCo 방식</span><span class="t">마찰로 집는다</span><span class="d">손가락 2개(slide 관절)를 실제로 닫아 마찰력으로 붙잡습니다. 힘이 부족하면 미끄러집니다</span></div>
      </div>
      <pre style="margin-top:2.4cqh">data.ctrl[GRIP] = <span class="p">0.0</span>     <span class="c"># 열림</span>
data.ctrl[GRIP] = <span class="p">0.02</span>    <span class="c"># 닫힘 — 손가락이 물체를 누른다</span></pre>`,
      foot: '어제 만진 friction이 여기서 그대로 작동합니다. 미끄러지면 마찰을 올리거나 더 세게 쥡니다.',
      nar: `여기가 무조코와 다른 시뮬레이터의 결정적 차이입니다. 파이불렛 실습에서는 그리퍼가 없어서 크리에이트 컨스트레인트라는 함수로 물체를 팔에 붙였습니다. 물리적으로는 가짜입니다. 접착제를 바른 거죠. 무조코에서는 손가락 두 개를 실제로 닫아서 마찰로 붙잡습니다. 그래서 힘이 부족하면 미끄러져 떨어집니다. 실습 중에 물체가 떨어지면 두 가지를 바꾸면 됩니다. 어제 배운 마찰을 올리거나, 손가락을 더 세게 쥐게 하거나입니다. 어제 배운 게 오늘 바로 쓰이는군요.` },

    { eb: 'Sequence', h: '집어 옮기는 다섯 단계',
      body: `<div class="rowlist" style="margin-top:1.2cqh">
        <div class="row"><span class="dot">1</span><span class="t">접근</span><span class="d">물체 <strong>위쪽</strong>으로 이동 (바로 옆으로 가면 밀어 버립니다)</span></div>
        <div class="row"><span class="dot">2</span><span class="t">하강</span><span class="d">그리퍼를 벌린 채 내려간다</span></div>
        <div class="row"><span class="dot">3</span><span class="t">파지</span><span class="d">손가락을 닫는다 — 잠깐 기다려야 마찰이 붙습니다</span></div>
        <div class="row"><span class="dot">4</span><span class="t">이동</span><span class="d">들어올린 뒤 목표 위로 (들지 않고 끌면 걸립니다)</span></div>
        <div class="row"><span class="dot">5</span><span class="t">놓기</span><span class="d">내려가서 손가락을 연다</span></div>
      </div>`,
      foot: '1번과 4번의 "위로"가 핵심입니다. 최단 경로로 직진하면 반드시 부딪힙니다.',
      nar: `집어 옮기는 동작은 다섯 단계입니다. 먼저 물체 바로 위로 접근합니다. 여기서 초보자가 가장 많이 하는 실수가 물체 옆으로 곧장 가는 건데, 그러면 팔이 물체를 밀어서 넘어뜨립니다. 반드시 위로 접근해야 합니다. 그 다음 그리퍼를 벌린 채 내려가고, 손가락을 닫습니다. 닫자마자 바로 들어올리면 안 되고 잠깐 기다려야 마찰이 제대로 붙습니다. 그리고 들어올린 다음 목표 위로 이동합니다. 들지 않고 바닥을 끌면 어딘가에 걸립니다. 마지막으로 내려가서 손가락을 엽니다. 일번과 사번의 위로라는 단어가 핵심입니다.` },

    { section: true, eb: 'Block 3 · 13:50–15:40', h: '시뮬레이터 안에 카메라 달기',
      sub: '이제 로봇에게 눈을 붙입니다. 그것도 현실에는 없는 눈까지.',
      nar: `세 번째 블록입니다. 시뮬레이터 안의 로봇에게 눈을 붙입니다. 그것도 현실에는 없는 눈까지 붙일 수 있습니다.` },

    { eb: 'Three Images', h: '한 장면에서 세 종류의 영상',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">RGB</span><span class="t">컬러 영상</span><span class="d">사람 눈에 보이는 그대로. 그대로 YOLO에 넣을 수 있습니다</span></div>
        <div class="card"><span class="n">Depth</span><span class="t">깊이 영상</span><span class="d">픽셀마다 카메라로부터의 거리(m). 실제 RGB-D 카메라가 주는 것과 같습니다</span></div>
        <div class="card"><span class="n">Segmentation</span><span class="t">분할 영상</span><span class="d">픽셀마다 "이건 몇 번 물체"인지. <strong>현실 카메라에는 없는 정보</strong>입니다</span></div>
      </div>
      <pre style="margin-top:2.4cqh">r = mujoco.Renderer(model, height=480, width=640)
r.update_scene(data, camera="topdown")
rgb = r.render()

r.enable_depth_rendering();        depth = r.render()
r.enable_segmentation_rendering(); seg   = r.render()</pre>`,
      foot: 'Segmentation 영상은 라벨링이 이미 끝난 정답 데이터입니다 — 이틀 전 여러분이 손으로 하던 그 작업입니다.',
      nar: `무조코 렌더러로 한 장면에서 세 종류의 영상을 뽑을 수 있습니다. 알지비는 사람 눈에 보이는 그대로의 컬러 영상입니다. 이건 그대로 욜로에 넣으면 됩니다. 뎁스는 깊이 영상인데 픽셀마다 카메라로부터 몇 미터 떨어져 있는지가 들어 있습니다. 실제 알지비디 카메라가 주는 것과 같은 데이터입니다. 세 번째 세그멘테이션이 특별합니다. 픽셀마다 이게 몇 번 물체인지가 적혀 있습니다. 현실의 카메라에는 없는 정보입니다. 시뮬레이터니까 가능한 거죠. 그리고 이게 무슨 뜻이냐면, 이 영상은 라벨링이 이미 끝난 정답 데이터라는 뜻입니다. 이틀 전에 여러분이 마우스로 상자를 치고 이름을 붙이던 그 작업 말입니다.` },

    { eb: 'Back-projection', h: '픽셀을 3D 좌표로 되돌리기',
      sub: '이것이 오늘 오후의 핵심 기술입니다.',
      body: `<div class="stack" style="margin-top:1.4cqh">
        <div class="lay"><b>가진 것</b><span>픽셀 위치 (u, v) + 그 픽셀의 깊이 d</span></div>
        <div class="lay" style="background:var(--soft)"><b>필요한 것</b><span>카메라 내부 파라미터 — 화각(fovy)과 해상도로 초점거리 f 계산</span></div>
        <div class="lay" style="background:var(--soft)"><b>얻는 것</b><span>카메라 기준 3D 좌표 (X, Y, Z)</span></div>
        <div class="lay" style="background:var(--sand);border-color:#E7CDBF"><b>한 번 더</b><span>카메라 위치·자세(cam_xpos, cam_xmat)로 <strong>세계 좌표</strong>로 변환</span></div>
      </div>
      <pre style="margin-top:2cqh">f = (height/2) / tan(fovy/2)
X = (u - cx) * d / f
Y = (v - cy) * d / f
Z = d</pre>`,
      foot: '카메라 한 장만으로는 깊이를 알 수 없습니다. 깊이가 있어야 픽셀이 3D가 됩니다.',
      nar: `여기가 오늘 오후의 핵심입니다. 이틀 전 욜로가 알려 준 것은 픽셀 좌표였습니다. 화면에서 몇 번째 점인지죠. 그런데 로봇은 픽셀로는 움직일 수 없습니다. 삼차원 좌표가 필요합니다. 깊이 영상이 있으면 이 변환이 가능합니다. 픽셀 위치와 그 픽셀의 깊이를 알고, 카메라의 화각을 알면 초점거리를 구할 수 있고, 그걸로 카메라 기준 삼차원 좌표가 나옵니다. 여기서 한 번 더 변환합니다. 카메라가 세계 어디에 어떤 방향으로 놓여 있는지를 알면 세계 좌표로 바꿀 수 있습니다. 카메라 한 장만으로는 절대 깊이를 알 수 없다는 것도 기억하십시오. 깊이가 있어야 픽셀이 삼차원이 됩니다.` },

    { eb: 'Ground Truth', h: '시뮬레이터는 정답을 알고 있습니다',
      sub: '그래서 우리가 만든 인식이 몇 cm 틀렸는지 바로 채점할 수 있습니다.',
      body: `<pre style="margin-top:1.4cqh"><span class="c"># 카메라로 추정한 위치</span>
추정 = back_project(u, v, depth)        <span class="o">→ [0.352, 0.098, 0.043]</span>

<span class="c"># 시뮬레이터가 알고 있는 진짜 위치</span>
진짜 = data.body("cube").xpos           <span class="o">→ [0.350, 0.100, 0.040]</span>

오차 = np.linalg.norm(추정 - 진짜)      <span class="o">→ 0.0042 m (4.2 mm)</span></pre>
      <div class="bannerG" style="margin-top:2.4cqh">현실에서는 이 채점을 하려면 자로 재야 합니다. 시뮬레이터에서는 한 줄입니다.</div>`,
      foot: '내일 중요한 질문을 던집니다 — 오차가 몇 cm까지면 집을 수 있을까요?',
      nar: `시뮬레이터의 또 다른 장점이 여기서 나옵니다. 시뮬레이터는 물체가 실제로 어디 있는지 알고 있습니다. 그래서 우리가 카메라로 추정한 위치와 진짜 위치를 비교해서 몇 밀리미터 틀렸는지 바로 잴 수 있습니다. 현실에서는 이걸 하려면 자를 들고 재야 합니다. 시뮬레이터에서는 한 줄입니다. 내일 이 오차를 가지고 중요한 질문을 하나 던집니다. 오차가 몇 센티미터까지면 물체를 집을 수 있을까요. 답은 그리퍼의 폭에 달려 있습니다.` },

    { section: true, eb: 'Block 4 · 15:50–17:40', h: '좌표 변환과 합성 데이터',
      sub: '카메라가 본 것을 로봇의 언어로 옮기고, 학습 데이터를 공짜로 만듭니다.',
      nar: `마지막 블록입니다. 두 가지를 합니다. 카메라가 본 것을 로봇의 언어로 옮기는 법, 그리고 학습 데이터를 공짜로 만드는 법입니다.` },

    { eb: 'Calibration', h: '카메라와 로봇은 다른 세계에 삽니다',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">내부 파라미터 · Intrinsics</span><span class="t">카메라 자체의 성질</span><span class="d">초점거리 · 중심점 · 렌즈 왜곡. 체스보드를 여러 각도로 찍어 구합니다</span></div>
        <div class="card"><span class="n">외부 파라미터 · Extrinsics</span><span class="t">카메라가 어디에 있나</span><span class="d">로봇 기준으로 카메라의 위치와 방향. 이것이 없으면 좌표를 옮길 수 없습니다</span></div>
      </div>
      <div class="banner" style="margin-top:2.4cqh">"카메라가 본 (0.1, 0.2, 0.5)"는 로봇에게 아무 의미가 없습니다. 로봇 기준으로 바꿔 줘야 합니다.</div>`,
      foot: '실습 코드의 보정값은 예시값입니다. 실제 현장에서는 체스보드로 직접 구해야 합니다.',
      nar: `카메라와 로봇은 서로 다른 좌표계에 삽니다. 카메라가 본 좌표를 로봇에게 그냥 주면 아무 의미가 없습니다. 로봇 기준으로 바꿔 줘야 하는데, 이걸 하려면 두 가지가 필요합니다. 내부 파라미터는 카메라 자체의 성질입니다. 초점거리와 중심점과 렌즈 왜곡인데, 체스보드를 여러 각도로 찍어서 구합니다. 외부 파라미터는 카메라가 로봇 기준으로 어디에 어떤 방향으로 놓여 있는지입니다. 이 두 가지를 구하는 것이 캘리브레이션, 우리말로 보정입니다. 실습 코드에 들어 있는 보정값은 예시값입니다. 실제 현장에서는 직접 구해야 합니다. 내일 아루코 마커 실습에서 이 변환을 실제로 씁니다.` },

    { eb: 'Synthetic Data', h: '이틀 전의 그 라벨링을 기억하십니까',
      sub: '시뮬레이터는 이미지와 라벨을 동시에, 무한히 만들어 냅니다.',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card warn"><span class="n">Day 2 · 손으로</span><span class="t">100장에 40분</span><span class="d">사진을 찍고 → 마우스로 상자를 치고 → 이름을 붙이고. 실무에서는 수천 장</span></div>
        <div class="card"><span class="n">Day 4 · 시뮬레이터로</span><span class="t">1000장에 5분</span><span class="d">카메라 각도·조명·물체 위치를 바꿔가며 렌더링. Segmentation이 라벨을 자동으로 만듭니다</span></div>
      </div>
      <pre style="margin-top:2.4cqh"><span class="c">for</span> i <span class="c">in</span> range(1000):
    randomize_pose_and_light()          <span class="c"># 물체 위치·조명 랜덤</span>
    rgb = render_rgb()                  <span class="c"># 이미지</span>
    seg = render_segmentation()         <span class="c"># 라벨 (자동!)</span>
    save(rgb, seg_to_yolo_label(seg))</pre>`,
      foot: '이것이 NVIDIA Replicator, Isaac Sim이 파는 핵심 가치입니다 — Day 6에서 다시 만납니다.',
      nar: `이제 이틀 전 이야기로 돌아갑니다. 여러분은 사진 백 장에 라벨을 붙이느라 사십 분을 썼습니다. 실무에서는 수천 장을 붙여야 합니다. 그런데 시뮬레이터는 물체가 어디에 무엇이 있는지 이미 알고 있습니다. 그러니까 이미지와 라벨을 동시에 만들어 낼 수 있습니다. 물체 위치와 조명과 카메라 각도를 랜덤하게 바꿔 가며 천 장을 찍으면, 천 장의 라벨이 공짜로 따라옵니다. 오 분이면 됩니다. 이것을 합성 데이터라고 부릅니다. 엔비디아가 아이작 심과 리플리케이터로 파는 핵심 가치가 바로 이겁니다. 여섯째 날에 다시 만납니다.` },

    { eb: 'Reality Gap', h: '다만, 공짜에는 대가가 있습니다',
      body: `<div class="rowlist" style="margin-top:1.4cqh">
        <div class="row"><span class="dot">!</span><span class="t">시뮬 이미지는 너무 깨끗합니다</span><span class="d">먼지·흠집·모션 블러·센서 노이즈가 없습니다</span></div>
        <div class="row"><span class="dot">!</span><span class="t">조명이 단순합니다</span><span class="d">현실의 반사·그림자는 훨씬 복잡합니다</span></div>
        <div class="row"><span class="dot">→</span><span class="t">해법: 도메인 랜덤화</span><span class="d">일부러 조명·색·질감·노이즈를 무작위로 흔들어 학습시킵니다</span></div>
      </div>
      <div class="bannerG" style="margin-top:2.4cqh">"현실이 시뮬의 한 경우처럼 보이게" 만드는 것 — Day 6 Sim-to-Real의 핵심 아이디어입니다.</div>`,
      nar: `다만 공짜에는 대가가 있습니다. 시뮬레이터 이미지는 너무 깨끗합니다. 먼지도 흠집도 없고 카메라 노이즈도 없고 손이 흔들려 생기는 블러도 없습니다. 조명도 현실보다 단순합니다. 그래서 시뮬 데이터로만 학습시킨 모델을 현실에 가져가면 성능이 뚝 떨어집니다. 이걸 리얼리티 갭이라고 합니다. 해법이 있는데 도메인 랜덤화라고 부릅니다. 일부러 조명과 색과 질감과 노이즈를 무작위로 심하게 흔들어서 학습시키는 겁니다. 그러면 모델이 현실을 만났을 때 이것도 내가 본 여러 경우 중 하나네, 하고 넘어갑니다. 여섯째 날 심투리얼의 핵심 아이디어입니다.` }
  ],

  assignment: {
    title: '인식 오차 측정과 합성 데이터 생성',
    lede: '카메라로 추정한 위치가 진짜 위치와 얼마나 다른지 숫자로 재고, 학습 데이터를 자동 생성합니다.',
    subtitle: '오차는 반드시 숫자(mm 또는 m)로 기록할 것',
    items: [
      'IK로 지정한 3개 좌표에 손끝 보내기 성공 캡처',
      '도달 실패한 좌표 1개와 그 이유',
      '픽앤플레이스 성공 영상 (10초 이상)',
      'RGB · Depth · Segmentation 3종 이미지',
      '역투영 추정 좌표 vs 진짜 좌표 오차 (mm)',
      '카메라 각도 3종으로 수집한 합성 데이터 세트'
    ],
    note: '5번이 오늘의 핵심입니다. 최소 3개 물체에 대해 오차를 재고, 오차가 큰 경우 왜 그런지(물체 가장자리, 깊이 경계, 카메라 각도) 분석하세요. 6번은 20장 이상이면 충분합니다.',
    sample: `<span class="o">학번 / 이름 : 20261234 / 홍길동

5. 역투영 오차 측정
   빨강 큐브  추정 [0.352, 0.098, 0.043]  진짜 [0.350, 0.100, 0.040]  오차 4.2mm
   파랑 큐브  추정 [0.291, -0.147, 0.041] 진짜 [0.290, -0.150, 0.040] 오차 3.3mm
   초록 큐브  추정 [0.410, 0.052, 0.051]  진짜 [0.400, 0.050, 0.040]  오차 14.9mm

   분석 : 초록 큐브는 화면 가장자리에 있어 오차가 3배 이상 큼.
          중심부일수록 깊이 추정이 정확 → 카메라를 물체 쪽으로 돌리면 개선될 듯</span>`,
    nar: `과제입니다. 다섯 번째가 오늘의 핵심입니다. 최소 세 개 물체에 대해서 카메라로 추정한 좌표와 시뮬레이터가 알고 있는 진짜 좌표를 비교해 오차를 밀리미터 단위로 재 오십시오. 그리고 오차가 유난히 큰 경우가 있으면 왜 그런지 생각해 보십시오. 물체가 화면 가장자리에 있었는지, 깊이가 급하게 변하는 경계였는지, 카메라 각도가 비스듬했는지를요. 이 분석이 내일 아주 중요해집니다. 여섯 번째 합성 데이터는 스무 장 이상이면 충분합니다.` },

  wrap: {
    done: '관절이 아니라 좌표로 명령하는 법을 배웠고, 없는 역기구학을 직접 만들었고, 마찰로 물체를 집었고, 시뮬레이터 카메라로 픽셀을 3D 좌표로 되돌렸습니다.',
    next: '내일 · Day 5 — 인식·판단·행동을 하나로',
    nextDesc: '이제 눈과 몸이 준비됐습니다. 내일은 이 둘을 잇습니다. 카메라가 본 것을 로봇 좌표로 옮겨 집고, 말로 시키면 알아듣는 로봇을 만듭니다. 그리고 오후에는 강화학습을 시작합니다.',
    nar: `오늘 한 일을 정리하겠습니다. 순기구학과 역기구학의 차이를 알았고, 자코비안이라는 개념을 잡았고, 무조코에 없는 역기구학을 삼십 줄로 직접 만들었습니다. 그리퍼로 마찰을 이용해 물체를 진짜로 집었고, 시뮬레이터 안에 카메라를 달아 세 종류의 영상을 얻었고, 픽셀을 삼차원 좌표로 되돌렸습니다. 그리고 이틀 전 손으로 하던 라벨링을 시뮬레이터가 대신 해 주는 것을 봤습니다. 이제 눈도 몸도 준비됐습니다. 내일은 이 둘을 잇습니다. 카메라가 본 것을 로봇이 집고, 말로 시키면 알아듣게 만듭니다. 그리고 오후부터는 강화학습을 시작합니다. 수고하셨습니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '로봇팔 제어와 시뮬레이터 센서',
    standfirst: '오늘은 두 가지가 만납니다. 좌표로 명령하는 로봇팔과, 좌표를 알려주는 카메라입니다. 오전에 IK를 만들고 오후에 카메라를 달면, 내일 이 둘을 연결할 준비가 끝납니다. 오늘 측정하는 <strong>오차 숫자</strong>가 내일 가장 중요한 재료입니다.',
    rules: [
      ['수식보다 반복을 본다', 'IK 수식을 외우려 하지 마세요. "오차를 보고 조금 다가가고 다시 본다"는 루프만 이해하면 됩니다.'],
      ['위로 접근한다', '픽앤플레이스에서 물체 옆으로 곧장 가면 밀어 버립니다. 반드시 위로 접근하고 위로 들어 옮깁니다.'],
      ['오차를 숫자로 적는다', '"대충 맞았다"는 기록이 아닙니다. mm 단위로 재서 적으세요. 내일 이 숫자를 씁니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '역기구학 만들기', time: '09:00–10:50',
        lede: 'mj_helpers.py의 ik() 함수를 함께 읽고, 직접 좌표를 넣어 봅니다.',
        missions: [
          { n: 1, h: 'ik() 코드 읽기 ★', body: `
      <p><code>mj_helpers.py</code>를 열고 <code>ik()</code> 함수를 찾습니다. <strong>네 줄만</strong> 확인하세요.</p>
      <pre><span class="c"># ① 자코비안 받기</span>
mujoco.mj_jacSite(model, data, jacp, jacr, site_id)

<span class="c"># ② 목표까지 얼마나 남았나</span>
e = target - data.site_xpos[site_id]

<span class="c"># ③ 그만큼 다가가려면 관절을 얼마나 돌려야 하나</span>
dq = jacp.T @ np.linalg.solve(jacp @ jacp.T + lam**2 * np.eye(3), e)

<span class="c"># ④ 조금 돌리고 → 다시 ①로 (300번 반복)</span>
q += dq; mujoco.mj_kinematics(model, data)</pre>
      <div class="box check"><span class="lbl">한 문장으로</span>
        <p>정상을 보고 → 한 걸음 가고 → 다시 본다. 등산과 같습니다. 수식은 "한 걸음의 방향과 크기"를 정하는 부분일 뿐입니다.</p></div>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p><code>lam</code>(λ)을 0으로 만들면 어떻게 될까요? 힌트: 팔이 완전히 쭉 펴진 상태(특이점)에서 무슨 일이 일어날지 생각해 보세요.</p></div>` },

          { n: 2, h: '좌표로 손끝 보내기', body: `
      <p><code>lab3_2_pick_and_place.py</code>의 <code>PICK_POS</code>를 바꿔 여러 좌표로 보내 봅니다.</p>
      <pre>PICK_POS  = [<span class="o">0.35</span>, <span class="o">0.10</span>, <span class="o">0.05</span>]    <span class="c"># x, y, z (m)</span>
PLACE_POS = [<span class="o">0.30</span>, <span class="o">-0.15</span>, <span class="o">0.05</span>]</pre>
      <p>다음 세 좌표를 순서대로 시도하고 <strong>성공/실패를 기록</strong>하세요.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">A</span><span class="v">[0.35, 0.10, 0.05]<small>작업 반경 안 — 성공해야 정상</small></span></div>
        <div class="dlrow"><span class="k">B</span><span class="v">[0.45, 0.00, 0.15]<small>가장자리 — 아슬아슬</small></span></div>
        <div class="dlrow"><span class="k">C</span><span class="v">[0.80, 0.00, 0.05]<small>범위 밖 — 실패해야 정상</small></span></div>
      </div>
      <div class="box warn"><span class="lbl">이 메시지가 뜨면</span>
        <p><code>[주의] ... 닿기 어렵습니다</code> — <strong>코드 버그가 아닙니다.</strong> 좌표가 작업 반경 밖입니다.<br>
        이 팔의 범위: 대략 <strong>반경 0.26~0.48 m, 높이 0.03~0.20 m</strong></p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '픽 앤 플레이스', time: '11:00–12:50',
        lede: '집는 시늉이 아니라 마찰로 실제로 집습니다. 그래서 미끄러집니다.',
        missions: [
          { n: 3, h: '집어서 옮기기', body: `
      <pre><span class="p">$</span> python lab3_2_pick_and_place.py</pre>
      <p>조작 패널의 <code>집어서 옮기기</code> 버튼 → 빨간 큐브를 집어 파란 목표판으로 옮깁니다. <code>큐브 되돌리기</code>로 리셋.</p>
      <div class="box q"><span class="lbl">다섯 단계를 눈으로 따라가세요</span><ol>
        <li>물체 <strong>위</strong>로 접근 (옆으로 가면 밀어 버립니다)</li>
        <li>그리퍼를 벌린 채 하강</li>
        <li>손가락 닫기 — 잠깐 멈추는 구간이 보이나요?</li>
        <li>들어올려서 이동 (끌지 않습니다)</li>
        <li>하강 후 손가락 열기</li>
      </ol></div>` },

          { n: 4, h: '일부러 미끄러뜨리기 ★', body: `
      <p>PyBullet은 물체를 팔에 <strong>붙였지만</strong>, MuJoCo는 <strong>마찰로 집습니다</strong>. 그래서 조건이 나쁘면 떨어집니다.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">방법 1</span><span class="v"><code>assets/arm_scene.xml</code>의 큐브 <code>friction</code>을 0.1로 낮춘다<small>어제 만진 그 값입니다</small></span></div>
        <div class="dlrow"><span class="k">방법 2</span><span class="v"><code>GRIP_CLOSED</code>를 0.005로 낮춘다<small>손가락을 덜 쥡니다</small></span></div>
        <div class="dlrow"><span class="k">방법 3</span><span class="v">큐브의 <code>mass</code>를 5배로 올린다<small>무거워서 마찰로 못 버팁니다</small></span></div>
      </div>
      <div class="box check"><span class="lbl">복구</span>
        <p>미끄러지면 <code>friction</code>을 올리거나 <code>GRIP_CLOSED</code>를 키우면 됩니다. <strong>어제 배운 물리가 오늘 그대로 쓰입니다.</strong></p></div>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>실제 로봇 그리퍼도 같은 문제를 겪습니다. 공장에서는 어떻게 해결할까요? (힌트: 그리퍼 표면 재질, 흡착 패드, 형상 맞춤 지그)</p></div>` },

          { n: 5, h: '나만의 집기 시나리오', body: `
      <p><code>PICK_POS</code>와 <code>PLACE_POS</code>를 바꿔 <strong>3회 연속 성공</strong>하는 조합을 찾으세요.</p>
      <div class="box q"><span class="lbl">해볼 것</span><ul>
        <li>PLACE를 PICK보다 <strong>높은 곳</strong>으로 → 잘 되나요?</li>
        <li>PLACE를 작업 반경 <strong>가장자리</strong>로 → 어떤 일이 생기나요?</li>
        <li>접근 높이(물체 위 몇 cm에서 내려오는지)를 바꾸면?</li>
      </ul></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '시뮬레이터 카메라', time: '13:50–15:40',
        lede: '결과 이미지는 camera_out/ 폴더에 PNG로 저장됩니다.',
        missions: [
          { n: 6, h: '세 종류 영상 얻기', body: `
      <pre><span class="p">$</span> python lab4_2_mujoco_camera.py                 <span class="c"># overview 카메라</span>
<span class="p">$</span> python lab4_2_mujoco_camera.py topdown         <span class="c"># 위에서 내려다보기</span>
<span class="p">$</span> python lab4_2_mujoco_camera.py topdown --show  <span class="c"># 창으로 바로 보기</span></pre>
      <p><code>camera_out/</code> 폴더를 열어 세 장을 나란히 비교하세요.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">RGB</span><span class="v">사람 눈에 보이는 그대로<small>그대로 YOLO에 넣을 수 있습니다</small></span></div>
        <div class="dlrow"><span class="k">Depth</span><span class="v">밝을수록 멀거나 가까움(스케일 확인)<small>실제 RGB-D 카메라와 같은 데이터</small></span></div>
        <div class="dlrow"><span class="k">Segmentation</span><span class="v">물체마다 다른 색/ID<small>★ 현실 카메라에는 없는 정보</small></span></div>
      </div>
      <div class="box check"><span class="lbl">Day 2를 기억하세요</span>
        <p>Segmentation 영상은 <strong>라벨링이 이미 끝난 정답 데이터</strong>입니다. 이틀 전 여러분이 마우스로 40분 동안 하던 그 작업입니다.</p></div>` },

          { n: 7, h: '픽셀 → 3D 좌표 역투영 ★', body: `
      <p>스크립트가 깊이 영상으로 3D 좌표를 복원합니다. <strong>핵심 네 줄</strong>을 코드에서 찾으세요.</p>
      <pre>f = (height / 2) / np.tan(fovy / 2)   <span class="c"># 초점거리 (화각에서)</span>
X = (u - cx) * d / f                  <span class="c"># 카메라 기준 X</span>
Y = (v - cy) * d / f                  <span class="c"># 카메라 기준 Y</span>
Z = d                                 <span class="c"># 깊이 그대로</span>
<span class="c"># 그다음 cam_xpos / cam_xmat 로 세계 좌표로 변환</span></pre>
      <div class="box q"><span class="lbl">확인 질문</span><ul>
        <li>깊이 영상이 <strong>없다면</strong> 3D 좌표를 구할 수 있을까요?</li>
        <li>Day 2의 YOLO가 알려준 것은 픽셀 좌표였습니다. 로봇이 그 값으로 움직일 수 있나요?</li>
      </ul></div>` },

          { n: 8, h: '인식 오차 채점하기 ★ 오늘의 핵심', body: `
      <p>시뮬레이터는 <strong>물체의 진짜 위치</strong>를 알고 있습니다. 그래서 우리 추정이 몇 mm 틀렸는지 바로 잴 수 있습니다.</p>
      <pre>추정 = back_project(u, v, depth)      <span class="o">→ [0.352, 0.098, 0.043]</span>
진짜 = data.body("cube").xpos         <span class="o">→ [0.350, 0.100, 0.040]</span>
오차 = np.linalg.norm(추정 - 진짜)    <span class="o">→ 0.0042 m = 4.2 mm</span></pre>
      <div class="box warn"><span class="lbl">과제 5번</span>
        <p><strong>최소 3개 물체</strong>에 대해 오차를 재서 mm 단위로 적으세요. 그리고 오차가 큰 경우 왜 그런지 분석하세요.</p>
        <ul><li>물체가 화면 <strong>가장자리</strong>에 있었나?</li>
            <li>깊이가 급하게 변하는 <strong>경계</strong>였나?</li>
            <li>카메라 각도가 <strong>비스듬</strong>했나?</li></ul></div>
      <div class="box check"><span class="lbl">내일 예고</span>
        <p>내일 던질 질문: <strong>오차가 몇 cm까지면 물체를 집을 수 있을까요?</strong> 답은 그리퍼 폭에 달려 있습니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 4', h: '좌표 변환과 합성 데이터', time: '15:50–17:40',
        lede: '오늘 마지막입니다. 학습 데이터를 공짜로 만드는 법을 배웁니다.',
        missions: [
          { n: 9, h: '카메라 위치를 바꿔 보기', body: `
      <p><code>assets/arm_scene.xml</code>의 <code>&lt;camera&gt;</code> 태그를 찾아 위치와 방향을 바꿉니다.</p>
      <pre>&lt;camera name="topdown" pos="<span class="o">0.35 0 0.8</span>" euler="<span class="o">0 0 0</span>" fovy="<span class="o">45</span>"/&gt;
<span class="c">&lt;!--                        ↑위치 x y z    ↑회전     ↑화각(도) --&gt;</span></pre>
      <div class="box q"><span class="lbl">해볼 것</span><ul>
        <li><code>fovy</code>를 30 → 90으로: 무엇이 달라지나요? 오차는?</li>
        <li>카메라를 낮게(z=0.4) 놓으면 깊이 추정 정확도가 어떻게 되나요?</li>
        <li>비스듬한 각도(<code>euler</code> 변경)에서 오차가 커지나요?</li>
      </ul></div>` },

          { n: 10, h: '합성 학습 데이터 자동 생성 ★', body: `
      <p>Day 2에서 100장 라벨링에 40분이 걸렸습니다. 오늘은 <strong>20장을 2분에</strong> 만듭니다.</p>
      <pre><span class="c">for</span> i <span class="c">in</span> range(20):
    <span class="c"># ① 물체 위치를 랜덤하게</span>
    data.qpos[cube_qpos_idx:+3] = random_pos()
    mujoco.mj_forward(model, data)

    <span class="c"># ② 카메라 각도도 조금씩 바꾸기</span>
    renderer.update_scene(data, camera="topdown")

    <span class="c"># ③ 이미지와 라벨을 동시에 저장</span>
    rgb = renderer.render()
    renderer.enable_segmentation_rendering()
    seg = renderer.render()                      <span class="c"># ← 라벨이 공짜로!</span>
    save(f"synth/img{i}.png", rgb)
    save(f"synth/img{i}.txt", seg_to_yolo_bbox(seg))</pre>
      <div class="box check"><span class="lbl">Segmentation → YOLO 라벨</span>
        <p>분할 영상에서 특정 물체 ID의 픽셀들을 모아 <strong>최소·최대 x, y</strong>를 구하면 그것이 곧 바운딩 박스입니다. 정규화하면 YOLO 라벨 형식이 됩니다.</p></div>
      <div class="box q"><span class="lbl">순환이 완성됩니다</span>
        <p>Day 4에서 만든 합성 데이터 → Day 2에서 배운 YOLO 학습 → 시뮬레이터 안 물체 인식.<br>
        이것이 <strong>Day 6 최종 프로젝트 ③번</strong>의 내용입니다.</p></div>` },

          { n: 11, h: '리얼리티 갭 확인하기', body: `
      <p>합성 데이터로 학습한 모델은 <strong>현실에서 성능이 떨어집니다.</strong> 왜 그런지 눈으로 확인하세요.</p>
      <div class="dl">
        <div class="dlrow"><span class="k">시뮬 이미지</span><span class="v">먼지·흠집·모션블러·센서노이즈 없음<small>너무 깨끗합니다</small></span></div>
        <div class="dlrow"><span class="k">현실 이미지</span><span class="v">그림자·반사·역광·초점 흐림<small>훨씬 지저분합니다</small></span></div>
        <div class="dlrow"><span class="k">해법</span><span class="v">도메인 랜덤화<small>일부러 조명·색·질감·노이즈를 심하게 흔들어 학습</small></span></div>
      </div>
      <div class="box check"><span class="lbl">아이디어</span>
        <p>"현실이 <strong>시뮬의 여러 경우 중 하나처럼</strong> 보이게" 만드는 것입니다. Day 6 Sim-to-Real의 핵심입니다.</p></div>
      <div class="box q"><span class="lbl">해볼 것</span>
        <p>합성 이미지에 <code>cv2</code>로 가우시안 노이즈와 블러를 넣어 보세요. 몇 줄이면 됩니다. 이것도 도메인 랜덤화의 한 형태입니다.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>[주의] ... 닿기 어렵습니다</code>', '좌표가 작업 반경 밖', '버그가 아닙니다. 반경 0.26~0.48m, 높이 0.03~0.20m 안으로'],
      ['팔이 목표 근처에서 부르르 떨림', '특이점 부근 또는 kp 과다', '<code>lam</code>(λ)을 키우거나 목표를 조금 옮기세요'],
      ['집기가 미끄러짐', '마찰 부족 또는 파지력 부족', '<code>friction</code>↑ 또는 <code>GRIP_CLOSED</code>↑'],
      ['팔이 물체를 밀어서 넘어뜨림', '옆으로 직진 접근', '반드시 <strong>물체 위쪽</strong>으로 접근한 뒤 하강'],
      ['깊이 값이 전부 같거나 이상함', '깊이 렌더링 모드 미전환', '<code>enable_depth_rendering()</code> 호출 확인'],
      ['역투영 좌표가 터무니없음', 'fovy·해상도 불일치 또는 좌표계 혼동', 'cx·cy가 이미지 중심인지, 세계 변환을 빠뜨리지 않았는지 확인'],
      ['Segmentation이 전부 한 색', '물체마다 별도 body/geom이 아님', 'MJCF에서 물체가 각각 독립 body인지 확인'],
      ['<code>camera_out/</code> 폴더가 비어 있음', '실행 위치가 다름', '실습 파일 폴더에서 <code>cd</code> 후 실행']
    ],
    checklist: [
      '순기구학과 역기구학의 차이를 설명할 수 있다',
      '자코비안을 <strong>한 문장</strong>으로 설명할 수 있다',
      'IK가 "오차 보고 → 다가가고 → 다시 보기"의 반복임을 안다',
      'IK로 3개 좌표에 손끝을 보냈고, 실패하는 좌표도 확인했다',
      '작업 반경 밖 좌표에서 나는 메시지가 버그가 아님을 안다',
      '그리퍼로 큐브를 집어 옮기는 데 성공했다',
      '<strong>일부러 미끄러뜨려 보고</strong> 마찰·파지력으로 복구했다',
      'RGB · Depth · Segmentation 3종 영상을 저장했다',
      '깊이 없이는 3D 좌표를 구할 수 없음을 안다',
      '역투영 추정값과 진짜 위치의 <strong>오차를 mm로</strong> 측정했다',
      '오차가 큰 경우의 원인을 하나 이상 분석했다',
      '합성 데이터를 이미지+라벨로 20장 이상 생성했다',
      '리얼리티 갭과 도메인 랜덤화의 뜻을 안다'
    ]
  },

  /* ================= 퀴즈 ================= */
  quizTitle: '로봇팔 제어와 시뮬레이터 센서 퀴즈',
  quiz: [
    { q: '"손끝을 (0.4, 0.1, 0.2)로 보내려면 관절을 몇 도로?"를 푸는 것은?',
      o: ['역기구학 (IK)', '순기구학 (FK)', '동역학', '경로 계획'], a: 0,
      e: 'FK는 관절→손끝(쉬움), IK는 손끝→관절(어려움)입니다. 우리가 실제로 하고 싶은 것은 언제나 IK입니다.' },

    { q: '자코비안(Jacobian)을 한 문장으로 설명하면?',
      o: ['관절을 조금 움직이면 손끝이 어디로 얼마나 가는지의 관계', '로봇의 총 질량과 관성의 표', '관절의 최대 각도 범위', '카메라와 로봇 사이의 변환 행렬'], a: 0,
      e: '행은 손끝의 x·y·z, 열은 각 관절입니다. MuJoCo에서는 <code>mj_jacSite</code>로 받아 옵니다.' },

    { q: 'IK 반복 루프의 순서로 맞는 것은?',
      o: ['자코비안 받기 → 오차 계산 → 관절 조금 돌리기 → 반복', '오차 계산 → 한 번에 목표로 이동 → 종료', '모든 관절 조합을 전부 시도 → 가장 가까운 것 선택', '역행렬 한 번 계산 → 답 도출'], a: 0,
      e: '등산과 같습니다. 정상을 보고 한 걸음 가고 다시 봅니다. 보통 300번 정도 반복합니다.' },

    { q: 'IK 수식의 λ(람다)는 무엇을 막기 위한 것인가요?',
      o: ['특이점에서 관절이 폭주하는 것', '메모리 부족', '관절 각도 범위 초과', '중력에 의한 처짐'], a: 0,
      e: '팔이 완전히 쭉 펴진 특이점에서는 계산이 무한대로 튑니다. λ가 안전장치 역할을 합니다.' },

    { q: 'MuJoCo에서 자코비안을 받아 오는 함수는? (직접 입력)', t: true,
      acc: ['mj_jacSite', 'mujoco.mj_jacSite', 'mujoco.mj_jacSite(model, data, jacp, jacr, site_id)'], ans: 'mujoco.mj_jacSite',
      e: 'PyBullet의 <code>calculateInverseKinematics</code>에 해당하는 내장 IK가 MuJoCo에는 없어서, 이 함수로 직접 만듭니다.' },

    { q: '<code>[주의] ... 닿기 어렵습니다</code> 메시지가 뜨는 이유는?',
      o: ['목표 좌표가 팔의 작업 반경 밖이라서', 'IK 코드에 버그가 있어서', '마찰이 부족해서', '카메라 보정이 안 되어서'], a: 0,
      e: '버그가 아닙니다. 이 팔은 대략 반경 0.26~0.48m, 높이 0.03~0.20m를 커버합니다. 실제 로봇 카탈로그에도 이 reach가 가장 먼저 적혀 있습니다.' },

    { q: 'MuJoCo에서 물체를 집는 방식은?',
      o: ['손가락 2개를 닫아 마찰력으로 붙잡는다', '제약(constraint)으로 물체를 팔에 붙인다', '자석처럼 끌어당긴다', '진공 흡착한다'], a: 0,
      e: 'PyBullet은 <code>createConstraint</code>로 붙이는 가짜 파지였습니다. MuJoCo는 실제 마찰이라 조건이 나쁘면 미끄러집니다.' },

    { q: '집기가 미끄러질 때 해결 방법이 <strong>아닌</strong> 것은?',
      o: ['중력을 0으로 만든다', 'friction을 올린다', 'GRIP_CLOSED를 키운다', '물체의 질량을 줄인다'], a: 0,
      e: '중력을 없애는 건 물리를 망가뜨리는 것이지 파지 문제를 푸는 것이 아닙니다. 마찰·파지력·질량이 실제 변수입니다.' },

    { q: '픽앤플레이스에서 물체 <strong>옆으로 곧장</strong> 접근하면?',
      o: ['팔이 물체를 밀어 넘어뜨린다', '더 빨라서 좋다', '그리퍼가 자동으로 회피한다', '아무 차이 없다'], a: 0,
      e: '반드시 물체 <strong>위쪽</strong>으로 접근해 하강하고, 들어올려서 옮겨야 합니다. 끌면 걸립니다.' },

    { q: '<code>mujoco.Renderer</code>로 얻을 수 있는 영상 3종이 아닌 것은?',
      o: ['적외선(Thermal)', 'RGB', 'Depth', 'Segmentation'], a: 0,
      e: 'RGB · Depth · Segmentation 세 가지입니다. 앞의 둘은 실제 RGB-D 카메라와 같고, 세그멘테이션은 현실에는 없는 정보입니다.' },

    { q: 'Segmentation 영상이 특별한 이유는?',
      o: ['픽셀마다 "몇 번 물체"인지 적혀 있어 라벨링이 끝난 정답 데이터', '해상도가 가장 높아서', '용량이 가장 작아서', '컬러 정확도가 높아서'], a: 0,
      e: 'Day 2에서 100장에 40분 걸리던 라벨링을 시뮬레이터가 공짜로 해 줍니다. 이것이 합성 데이터의 핵심입니다.' },

    { q: '카메라 한 장(RGB)만으로 3D 좌표를 구할 수 <strong>없는</strong> 이유는?',
      o: ['깊이 정보가 없어서', '해상도가 부족해서', '색 정보가 왜곡되어서', '프레임레이트가 낮아서'], a: 0,
      e: '같은 픽셀에 작고 가까운 물체와 크고 먼 물체가 똑같이 찍힙니다. 깊이가 있어야 픽셀이 3D가 됩니다.' },

    { q: '역투영에서 초점거리 f를 구하는 데 필요한 것은?',
      o: ['화각(fovy)과 이미지 높이', '물체의 실제 크기', '조명 밝기', '프레임 번호'], a: 0,
      e: '<code>f = (height/2) / tan(fovy/2)</code>. 화각과 해상도만 알면 구할 수 있습니다.' },

    { q: '카메라 좌표를 <strong>로봇 좌표</strong>로 바꾸려면 무엇이 필요한가요?',
      o: ['카메라의 위치와 자세 (외부 파라미터)', '카메라의 화소 수', '물체의 색상', '로봇의 관절 개수'], a: 0,
      e: '내부 파라미터는 카메라 자체 성질(초점거리·왜곡), 외부 파라미터는 카메라가 어디에 어떤 방향으로 있는지입니다. 둘 다 캘리브레이션으로 구합니다.' },

    { q: '시뮬레이터에서 인식 오차를 바로 채점할 수 있는 이유는?',
      o: ['물체의 진짜 위치를 시뮬레이터가 알고 있어서', '카메라가 더 정확해서', '오차가 항상 0이라서', '자동 보정 기능이 있어서'], a: 0,
      e: '<code>data.body("cube").xpos</code>가 정답입니다. 현실에서는 자로 재야 하는 일을 한 줄로 합니다.' },

    { q: 'Segmentation에서 YOLO 바운딩 박스를 만드는 방법은?',
      o: ['해당 물체 ID 픽셀들의 최소·최대 x, y를 구한다', '물체의 중심 픽셀 하나만 쓴다', '이미지 전체를 박스로 쓴다', '수동으로 다시 그린다'], a: 0,
      e: '픽셀 집합의 경계를 구해 정규화하면 바로 YOLO 라벨 형식이 됩니다. 이것이 자동 라벨링입니다.' },

    { q: '합성 데이터로 학습한 모델이 현실에서 성능이 떨어지는 현상은?',
      o: ['리얼리티 갭 (Reality Gap)', '과적합', '기울기 소실', '모드 붕괴'], a: 0,
      e: '시뮬 이미지는 너무 깨끗합니다. 먼지·흠집·모션블러·센서노이즈가 없어서 현실과 차이가 납니다.' },

    { q: '도메인 랜덤화(Domain Randomization)의 아이디어는?',
      o: ['조명·색·질감·노이즈를 일부러 흔들어 현실이 시뮬의 한 경우처럼 보이게', '학습 데이터를 무작위로 섞는다', '신경망 가중치를 무작위로 초기화한다', '카메라를 무작위 위치에 설치한다'], a: 0,
      e: '모델이 현실을 만났을 때 "이것도 내가 본 여러 경우 중 하나"로 받아들이게 만드는 것입니다. Day 6 Sim-to-Real의 핵심입니다.' }
  ]
};
