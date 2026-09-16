module.exports = {
  day: 10,
  title: '통합 프로젝트와 시연',
  theme: '10일간 쌓은 것을 하나의 서비스로 묶기',

  openingNar: `마지막 날입니다. 오늘은 새로 배우는 것이 없습니다. 아흐레 동안 배운 것을 하나로 묶습니다. 조건이 하나 있는데, 그게 오늘의 전부입니다. 다른 팀의 깨끗한 환경에서 여러분이 쓴 문서만 보고 그대로 되살아나야 합니다. 내 컴퓨터에서 도는 것은 완성이 아닙니다.`,

  goals: [
    ['setup 스크립트 하나로', '의존성부터 모델까지 설치되게 만들 수 있다'],
    ['서비스를', '재부팅 후에도 자동으로 기동되게 만들 수 있다'],
    ['프록시 뒤에서', '필요한 포트만 열어 노출할 수 있다'],
    ['전용 계정과 분리된 설정으로', '최소 권한 원칙을 지킬 수 있다'],
    ['점검 스크립트를', '예약 실행해 스스로 돌보게 만들 수 있다'],
    ['처음 보는 사람이', '따라 할 수 있는 문서를 쓸 수 있다']
  ],
  goalsNar: `오늘의 목표는 요구사항 여섯 개입니다. 한 번에 서는 설치, 상시 기동, 프록시 뒤 노출, 권한 분리, 스스로 돌보기, 그리고 읽히는 문서입니다. 여섯 개 모두 아흐레 동안 배운 것이고, 오늘은 그것을 하나의 산출물로 조립하는 일만 합니다.`,

  blocks: [
    { time: '09:00–12:00', title: '통합 프로젝트 구축', desc: '팀별로 요구사항 6개 구현' },
    { time: '13:00–15:00', title: '마무리와 교차 재현', desc: 'README 완성 · 옆 팀 환경에서 검증' },
    { time: '15:10–16:10', title: '시연', desc: '팀당 8분 · 설치부터 장애 복구까지' },
    { time: '16:10–17:10', title: '상호 평가와 총정리', desc: '다음 학습 경로 안내' }
  ],
  blocksNar: `오전 세 시간은 구축입니다. 오후 첫 두 시간에 문서를 완성하고 옆 팀 환경에서 실제로 돌려 봅니다. 여기서 대부분의 문제가 드러납니다. 그다음 시연을 하고, 마지막에 열흘을 정리하고 다음 학습 경로를 안내합니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–12:00', h: '통합 프로젝트',
      sub: '2~3인 팀 · 요구사항 6개 · 다른 환경에서 복원되어야 합니다.',
      nar: `첫 번째 블록입니다. 이삼 인 팀으로 진행합니다. 요구사항은 여섯 개이고 전부 아흐레 동안 배운 것입니다. 새로운 기술을 배워서 넣을 필요가 없습니다. 오히려 배우지 않은 것을 넣으면 감점입니다.` },

    { eb: 'REQ 1', h: '한 번에 서는 설치',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># setup.sh — 한 번 실행으로 끝나야 합니다</span>
<span class="p">#!/usr/bin/env bash</span>
<span class="p">set -euo pipefail</span>

<span class="c">① 필수 패키지 설치      (Day 5)
② 전용 계정 · 디렉터리   (Day 4)
③ 설정 파일 배치         (Day 7)
④ 서비스 등록 · 기동     (Day 7 또는 Day 8)
⑤ 모델 준비              (Day 7)
⑥ 동작 검증 후 결과 출력</span></pre>
      <div class="bannerG" style="margin-top:2cqh">중간에 사람 손이 한 번이라도 들어가면 실패입니다. 두 번 실행해도 안전해야 합니다.</div>`,
      foot: '같은 스크립트를 두 번 돌려도 깨지지 않는 성질을 멱등성이라고 합니다.',
      nar: `첫 번째 요구사항은 셋업 스크립트 하나로 설치가 끝나는 것입니다. 중간에 사람 손이 한 번이라도 들어가면 실패입니다. 그리고 한 가지 더 중요한 성질이 있습니다. 같은 스크립트를 두 번 돌려도 깨지지 않아야 합니다. 이미 있는 계정을 또 만들려다 실패하거나, 이미 받은 모델을 또 받느라 오래 걸리면 안 됩니다. 이 성질을 멱등성이라고 부릅니다. 여섯째 날에 배운 조건문으로 이미 있는지 먼저 확인하면 됩니다.` },

    { eb: 'REQ 2 · 3', h: '상시 기동과 프록시 노출',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">REQ 2</span><span class="t">상시 기동</span><span class="d">systemd(Day 7) 또는 compose(Day 8) 중 하나<br>재부팅 후 자동 시작<br>프로세스를 죽여도 되살아날 것</span></div>
        <div class="card"><span class="n">REQ 3</span><span class="t">프록시 뒤 노출</span><span class="d">Nginx를 거쳐 접근(Day 9)<br>추론 포트는 직접 열지 않을 것<br>방화벽은 필요한 것만</span></div>
      </div>
      <pre style="margin-top:2cqh"><span class="c"># 검증 방법을 README에 적어 두세요</span>
<span class="p">$ sudo reboot</span>  →  <span class="p">$ systemctl is-active 서비스</span>
<span class="p">$ curl -s localhost/api/tags</span>            <span class="c"># 80번으로 성공</span>
<span class="p">$ curl -s --max-time 3 IP:11434/api/tags</span>  <span class="c"># 직접 접근은 실패해야</span></pre>`,
      nar: `두 번째와 세 번째 요구사항입니다. 상시 기동은 시스템디나 컴포즈 중 하나를 고르면 됩니다. 둘 다 쓸 필요는 없습니다. 재부팅 후 자동으로 뜨고, 프로세스를 강제로 죽여도 되살아나야 합니다. 세 번째는 프록시 뒤 노출입니다. 여든번 포트로는 접근되고 만천사백삼십사번으로는 직접 접근이 안 되어야 합니다. 이 두 줄의 검증 명령을 리드미에 꼭 적어 두십시오. 심사할 때 그대로 칩니다.` },

    { eb: 'REQ 4 · 5', h: '권한 분리와 스스로 돌보기',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">REQ 4</span><span class="t">권한 분리</span><span class="d">전용 서비스 계정으로 구동(Day 4)<br>비밀값은 <code>.env</code> 또는 <code>EnvironmentFile</code>에<br>코드·unit 본문에 비밀값 없을 것(Day 9)</span></div>
        <div class="card"><span class="n">REQ 5</span><span class="t">스스로 돌보기</span><span class="d">디스크·헬스 점검 스크립트(Day 6)<br>cron 또는 timer로 예약<br>결과가 로그로 남을 것</span></div>
      </div>
      <pre style="margin-top:2cqh"><span class="c"># healthcheck.sh 예시 구조</span>
<span class="p">curl -sf localhost/api/tags &gt;/dev/null || echo "[경고] API 응답 없음"</span>
<span class="p">df -h / | awk 'NR==2 &amp;&amp; $5+0 &gt; 80 {print "[경고] 디스크 " $5}'</span>
<span class="p">systemctl is-active 서비스 | grep -q active || echo "[경고] 서비스 중지"</span></pre>`,
      foot: '점검 스크립트가 "이상 없음"만 찍는다면 반쪽입니다 — 이상을 만들어 경고가 나오는지 확인하세요.',
      nar: `네 번째는 권한 분리입니다. 루트가 아닌 전용 계정으로 서비스가 돌아야 하고, 비밀값이 코드나 유닛 파일 본문에 있으면 안 됩니다. 다섯 번째는 스스로 돌보기입니다. 디스크와 서비스 상태를 점검하는 스크립트를 만들고 예약 실행해서 결과를 로그로 남깁니다. 여기서 한 가지 당부드립니다. 점검 스크립트가 이상 없음만 찍는다면 반쪽입니다. 일부러 서비스를 멈추거나 디스크를 채워서 경고가 실제로 나오는지 확인하십시오.` },

    { eb: 'REQ 6', h: '읽히는 문서 — 배점의 절반',
      body: `<div class="rowlist" style="margin-top:1.6cqh">
        <div class="row"><span class="dot">1</span><span class="t">사양 요건</span><span class="d">메모리·디스크·OS 버전</span></div>
        <div class="row"><span class="dot">2</span><span class="t">구조도</span><span class="d">무엇이 어디서 어떻게 연결되는가</span></div>
        <div class="row"><span class="dot">3</span><span class="t">설치와 실행</span><span class="d">복사해서 붙여넣을 수 있는 형태로</span></div>
        <div class="row"><span class="dot">4</span><span class="t">검증 방법</span><span class="d">성공했는지 어떻게 아는가</span></div>
        <div class="row"><span class="dot">5</span><span class="t">트러블슈팅 3건</span><span class="d">증상 → 확인 → 조치 (Day 9의 RCA 형식)</span></div>
      </div>`,
      foot: '"저희 팀은 됩니다"는 통과 기준이 아닙니다. 옆 팀 환경에서 되어야 합니다.',
      nar: `여섯 번째 요구사항이자 배점의 절반이 문서입니다. 사양 요건, 구조도, 설치와 실행, 검증 방법, 그리고 트러블슈팅 세 건. 아홉째 날에 쓴 알씨에이 형식을 그대로 쓰시면 됩니다. 명심하실 것은 저희 팀은 됩니다가 통과 기준이 아니라는 점입니다. 옆 팀 환경에서 되어야 합니다.` },

    { section: true, eb: 'Block 2 · 13:00–15:00', h: '교차 재현',
      sub: '내 문서의 빈칸은 남이 실행해 봐야 보입니다.',
      nar: `두 번째 블록입니다. 이 시간이 오늘 가장 값진 두 시간입니다. 옆 팀과 환경을 바꿔서 서로의 문서만 보고 설치를 시도합니다. 여기서 드러나는 문제가 실무에서 여러분이 겪게 될 문제와 똑같습니다.` },

    { eb: 'Cross-test', h: '교차 재현에서 반드시 드러나는 것들',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card warn"><span class="t">"제 컴퓨터엔 이미 있었어요"</span><span class="d">설치 목록에서 빠진 패키지. 내 환경에 원래 있던 것은 눈에 안 보입니다.</span></div>
        <div class="card warn"><span class="t">"경로가 제 계정 이름이네요"</span><span class="d">하드코딩된 <code>/home/ubuntu</code>. 계정명이 다르면 깨집니다.</span></div>
        <div class="card warn"><span class="t">"이 파일은 어디서 받나요"</span><span class="d">문서에 없는 사전 준비물.</span></div>
        <div class="card warn"><span class="t">"순서가 반대인데요"</span><span class="d">실제로는 A를 먼저 해야 하는데 문서에는 B가 먼저.</span></div>
      </div>`,
      foot: '네 가지 중 최소 두 가지는 반드시 나옵니다. 나오는 게 정상이고, 그것을 고치는 것이 오늘의 일입니다.',
      nar: `교차 재현을 하면 네 가지가 거의 반드시 드러납니다. 내 컴퓨터엔 이미 깔려 있어서 설치 목록에서 빠진 패키지, 하드코딩된 내 계정 경로, 문서에 없는 사전 준비물, 그리고 실제 순서와 다른 문서. 최소 두 가지는 반드시 나옵니다. 나오는 게 정상입니다. 그걸 발견하고 고치는 것이 오늘 오후의 일입니다.` },

    { eb: 'Checklist', h: '제출 전 자가 점검',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># 이 순서로 직접 돌려 보세요</span>
<span class="p">1.</span> 깨끗한 환경(스냅샷 복원)에서 시작
<span class="p">2.</span> README만 보고 setup.sh 실행
<span class="p">3.</span> curl 로 API 응답 확인
<span class="p">4.</span> 재부팅 → 자동 기동 확인
<span class="p">5.</span> 추론 포트 직접 접근이 막히는지 확인
<span class="p">6.</span> 서비스 강제 종료 → 자동 복구 확인
<span class="p">7.</span> 점검 스크립트 로그 확인
<span class="p">8.</span> 트러블슈팅 3건을 실제로 재현</pre>
      <div class="bannerG" style="margin-top:2cqh">Day 1에 찍어 둔 <code>clean-install</code> 스냅샷이 여기서 쓰입니다.</div>`,
      nar: `제출 전에 이 여덟 단계를 직접 돌려 보십시오. 첫날에 찍어 둔 클린 인스톨 스냅샷을 복원해서 시작합니다. 열흘 전에 찍어 둔 그 스냅샷이 오늘 마지막 날에 쓰입니다. 그때 마음껏 망가뜨려도 된다고 말씀드린 이유가 이것입니다.` },

    { section: true, eb: 'Block 3 · 15:10–16:10', h: '시연',
      sub: '팀당 8분. 설치부터 장애 복구까지 한 흐름으로.',
      nar: `세 번째 블록은 시연입니다. 팀당 팔 분입니다. 슬라이드를 만들지 마시고 터미널을 보여 주십시오.` },

    { eb: 'Demo', h: '8분 시연 구성',
      body: `<div class="rowlist" style="margin-top:1.6cqh">
        <div class="row"><span class="dot">1</span><span class="t">1분 — 무엇을 만들었나</span><span class="d">구조도 한 장</span></div>
        <div class="row"><span class="dot">2</span><span class="t">2분 — 설치</span><span class="d">setup.sh 실행 (미리 돌려둔 화면도 가능)</span></div>
        <div class="row"><span class="dot">3</span><span class="t">2분 — 동작</span><span class="d">curl 호출과 응답</span></div>
        <div class="row"><span class="dot">4</span><span class="t">2분 — 장애 복구</span><span class="d">일부러 고장 내고 고치기</span></div>
        <div class="row"><span class="dot">5</span><span class="t">1분 — 가장 어려웠던 점</span><span class="d">솔직하게</span></div>
      </div>`,
      foot: '4번이 가장 중요합니다 — 잘 도는 것보다 고장 났을 때 대응할 수 있는 것이 실력입니다.',
      nar: `팔 분을 다섯 토막으로 나눕니다. 무엇을 만들었는지 일 분, 설치 이 분, 동작 이 분, 장애 복구 이 분, 그리고 가장 어려웠던 점 일 분입니다. 네 번째가 가장 중요합니다. 잘 도는 것을 보여 주는 것보다 고장 났을 때 대응할 수 있다는 것을 보여 주는 것이 실력입니다. 다섯 번째도 형식적으로 넘기지 마십시오. 어디서 막혔고 어떻게 풀었는지가 다른 팀에게 가장 도움이 되는 정보입니다.` },

    { section: true, eb: 'Block 4 · 16:10–17:10', h: '총정리',
      sub: '열흘 동안 무엇을 했고, 여기서 어디로 가는가.',
      nar: `마지막 블록입니다. 열흘 동안 무엇을 했는지 정리하고, 여기서 어디로 갈 수 있는지 안내하겠습니다.` },

    { eb: 'Review', h: '열흘의 흐름',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">Day 1–3</span><span class="t">다루기</span><span class="d">환경 · 파일시스템 · 파이프 · 텍스트 처리<br>10만 줄에서 답을 뽑아내는 능력</span></div>
        <div class="card"><span class="n">Day 4–6</span><span class="t">움직이기</span><span class="d">권한 · 프로세스 · 원격 · 자동화<br>손으로 하던 일을 기계에 넘기는 능력</span></div>
        <div class="card"><span class="n">Day 7–8</span><span class="t">세우기</span><span class="d">서비스 · 컨테이너<br>한 번 만든 것을 어디서든 되살리는 능력</span></div>
        <div class="card"><span class="n">Day 9–10</span><span class="t">지키기</span><span class="d">운영 · 보안 · 장애 · 통합<br>만든 것을 살려 두는 능력</span></div>
      </div>`,
      nar: `열흘을 네 덩어리로 보시면 됩니다. 처음 사흘은 다루기였습니다. 파일과 텍스트를 다뤄 십만 줄에서 답을 뽑아내는 능력. 그다음 사흘은 움직이기였습니다. 권한과 프로세스와 원격과 자동화, 손으로 하던 일을 기계에 넘기는 능력. 일곱째와 여덟째 날은 세우기였습니다. 서비스와 컨테이너, 한 번 만든 것을 어디서든 되살리는 능력. 그리고 마지막 이틀은 지키기였습니다. 만든 것을 살려 두는 능력입니다.` },

    { eb: 'Next', h: '여기서 어디로',
      body: `<div class="rowlist" style="margin-top:1.6cqh">
        <div class="row"><span class="dot">1</span><span class="t">추론 성능</span><span class="d">vLLM · 배치 처리 · 양자화 심화 — 처리량을 높이는 쪽</span></div>
        <div class="row"><span class="dot">2</span><span class="t">규모 확장</span><span class="d">쿠버네티스 · 로드밸런싱 — 서버가 여러 대가 될 때</span></div>
        <div class="row"><span class="dot">3</span><span class="t">환경 코드화</span><span class="d">Ansible · Terraform — setup.sh의 정식 버전</span></div>
        <div class="row"><span class="dot">4</span><span class="t">관측</span><span class="d">Prometheus · Grafana — Day 9 점검 스크립트의 정식 버전</span></div>
      </div>
      <div class="bannerG" style="margin-top:2cqh">네 가지 모두 오늘 만든 것의 <strong>정식 버전</strong>입니다. 여러분은 이미 원리를 손으로 만들어 봤습니다.</div>`,
      foot: '도구 이름이 바뀔 뿐, 오늘 배운 질문("무엇이 돌고 있나, 왜 안 되나, 어떻게 재현하나")은 그대로입니다.',
      nar: `여기서 갈 수 있는 길이 네 가지입니다. 추론 성능을 높이는 쪽, 서버가 여러 대가 될 때의 규모 확장, 환경을 코드로 관리하는 쪽, 그리고 관측입니다. 여기서 한 가지 말씀드리고 싶은 것이 있습니다. 네 가지 모두 여러분이 오늘 만든 것의 정식 버전입니다. 앤서블은 셋업 스크립트의 정식 버전이고, 프로메테우스는 점검 스크립트의 정식 버전입니다. 여러분은 이미 원리를 손으로 만들어 봤습니다. 도구 이름이 바뀔 뿐, 오늘 배운 질문은 그대로입니다. 무엇이 돌고 있나, 왜 안 되나, 어떻게 재현하나. 열흘 동안 수고 많으셨습니다.` }
  ],

  assignment: {
    title: '최종 산출물 제출',
    lede: '코드와 문서를 함께 제출합니다. 문서가 없으면 코드는 채점되지 않습니다.',
    items: [
      'setup.sh (한 번에 서는 설치)',
      '서비스 정의 (unit 파일 또는 compose.yaml)',
      'Nginx 설정과 방화벽 규칙',
      'healthcheck.sh 와 예약 설정',
      'README (사양·구조도·실행·검증·트러블슈팅 3건)',
      '교차 재현 결과 보고 (어느 팀 환경에서, 무엇이 막혔고, 무엇을 고쳤는가)'
    ],
    note: '6번이 실질 배점의 가장 큰 항목입니다. <strong>문제가 하나도 없었다면 교차 재현을 제대로 하지 않은 것</strong>으로 봅니다.',
    sample: `<span class="o">6. 교차 재현 보고
   대상 : B팀 VM (clean-install 스냅샷 복원 상태)
   막힌 곳 ① : jq 미설치 → setup.sh 패키지 목록에 누락
   막힌 곳 ② : /home/ubuntu 하드코딩 → $HOME 으로 수정
   소요 : 최초 22분 → 수정 후 재시도 6분</span>`,
    nar: `최종 제출물입니다. 셋업 스크립트, 서비스 정의, 프록시와 방화벽 설정, 점검 스크립트, 리드미, 그리고 교차 재현 결과 보고입니다. 여섯 번째가 실질 배점에서 가장 큰 항목입니다. 그리고 한 가지 분명히 말씀드립니다. 문제가 하나도 없었다고 적으면 교차 재현을 제대로 하지 않은 것으로 봅니다. 반드시 무언가 나옵니다.` },

  wrap: {
    done: '열흘 동안 명령어를 외운 게 아니라, 시스템을 세우고 지키는 방법을 익혔습니다.',
    next: '수고하셨습니다',
    nextDesc: '앞으로 어떤 도구를 만나든 질문은 같습니다 — 무엇이 돌고 있나, 왜 안 되나, 어떻게 재현하나.',
    nar: `열흘이 끝났습니다. 여러분은 명령어를 외운 것이 아니라 시스템을 세우고 지키는 방법을 익혔습니다. 첫날 터미널 프롬프트 하나에서 시작해서, 오늘 재현 가능한 서비스를 만들어 냈습니다. 앞으로 새로운 도구를 만나게 될 텐데, 질문은 항상 같습니다. 무엇이 돌고 있나. 왜 안 되나. 어떻게 재현하나. 이 세 가지를 물을 수 있으면 어떤 도구든 익힐 수 있습니다. 수고하셨습니다.` },

  lab: {
    h1: '통합 프로젝트',
    standfirst: '오늘은 새 명령어를 배우지 않습니다. <strong>아흐레 동안 만든 것을 조립</strong>합니다. 배우지 않은 기술을 넣으면 오히려 감점입니다.',
    rules: [
      ['깨끗한 환경에서 검증한다', 'Day 1의 clean-install 스냅샷을 복원해 처음부터 돌려 보세요.'],
      ['하드코딩을 찾는다', '/home/ubuntu, 특정 IP, 내 계정명 — 전부 변수로 빼세요.'],
      ['문서 없는 코드는 미완성', 'README가 없으면 채점하지 않습니다. 문서가 절반입니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '구축', time: '09:00–12:00',
        lede: '요구사항 6개를 순서대로 구현합니다. 각 항목의 근거가 되는 일차를 함께 적어 두었습니다.',
        steps: [
          { sn: 'REQ 1', h: 'setup.sh — 한 번에 서는 설치', body: `
      <pre><span class="p">#!/usr/bin/env bash</span>
set -euo pipefail

<span class="c"># 설정 (하드코딩 금지)</span>
SERVICE_USER="\${SERVICE_USER:-llmsvc}"
APP_DIR="\${APP_DIR:-/opt/llmstack}"
MODEL="\${MODEL:-qwen2.5:0.5b}"

log() { echo "[$(date +%T)] $*"; }

<span class="c"># ① 패키지 (Day 5)</span>
log "패키지 설치"
sudo apt-get update -qq
sudo apt-get install -y curl jq nginx

<span class="c"># ② 계정·디렉터리 (Day 4) — 멱등하게</span>
id "$SERVICE_USER" &amp;&gt;/dev/null || sudo useradd -r -s /usr/sbin/nologin "$SERVICE_USER"
sudo mkdir -p "$APP_DIR"/{models,logs,scripts}
sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

<span class="c"># ③ 설정 분리 (Day 7·9)</span>
...
<span class="c"># ⑥ 검증</span>
log "검증 중..."
curl -sf localhost/api/tags &gt;/dev/null &amp;&amp; log "✓ 설치 완료" || { log "✗ 실패"; exit 1; }</pre>
      <div class="box check"><span class="lbl">멱등성 확인</span>
        <p><code>./setup.sh</code>를 <strong>두 번 연속</strong> 실행하세요. 두 번째도 오류 없이 끝나야 합니다. <code>id ... || useradd</code> 패턴이 그 장치입니다.</p></div>` },
          { sn: 'REQ 2', h: '상시 기동 — systemd 또는 compose', body: `
      <p>둘 중 <strong>하나만</strong> 고르세요. 둘 다 쓸 필요 없습니다.</p>
      <div class="box check"><span class="lbl">검증 명령을 README에 적을 것</span>
      <pre style="margin-top:8px"><span class="p">$</span> systemctl is-enabled 서비스명
<span class="p">$</span> sudo reboot
<span class="p">$</span> systemctl is-active 서비스명        <span class="c"># 재부팅 후</span>
<span class="p">$</span> sudo pkill -f 프로세스 &amp;&amp; sleep 5
<span class="p">$</span> systemctl is-active 서비스명        <span class="c"># 자동 복구</span></pre></div>` },
          { sn: 'REQ 3', h: '프록시 뒤 노출', body: `
      <div class="box check"><span class="lbl">성공 조건은 두 줄입니다</span>
      <pre style="margin-top:8px"><span class="p">$</span> curl -s localhost/api/tags | jq -r '.models[].name'   <span class="c"># 성공</span>
<span class="p">$</span> curl -s --max-time 3 &lt;IP&gt;:11434/api/tags; echo $?     <span class="c"># 실패해야 정상</span></pre>
      <p style="margin-top:8px">추론 서비스는 <code>127.0.0.1</code>에만 바인딩하고, 방화벽은 22·80만 엽니다 (Day 9).</p></div>` },
          { sn: 'REQ 4', h: '권한 분리와 비밀값', body: `
      <pre><span class="p">$</span> systemctl show 서비스 -p User        <span class="c"># root 가 아니어야</span>
<span class="p">$</span> ls -l /etc/llmstack/env               <span class="c"># 600 또는 640</span>
<span class="p">$</span> grep -rn "TOKEN\\|SECRET\\|PASSWORD" ./ --include="*.sh" --include="*.yaml"
<span class="c"># → 아무것도 안 나와야 합니다</span></pre>` },
          { sn: 'REQ 5', h: 'healthcheck.sh 와 예약', body: `
      <pre><span class="p">#!/usr/bin/env bash</span>
set -uo pipefail          <span class="c"># 점검은 실패해도 계속 돌아야 하므로 -e 제외</span>
LOG="\${APP_DIR:-/opt/llmstack}/logs/health.log"
ts() { date +'%F %T'; }

msg=""
curl -sf --max-time 5 localhost/api/tags &gt;/dev/null || msg+="API무응답 "
systemctl is-active --quiet 서비스명 || msg+="서비스중지 "
USE=$(df -h / | awk 'NR==2 {print $5+0}')
[[ "$USE" -gt 80 ]] &amp;&amp; msg+="디스크\${USE}% "

if [[ -n "$msg" ]]; then
    echo "$(ts) [경고] $msg" &gt;&gt; "$LOG"
else
    echo "$(ts) [정상]" &gt;&gt; "$LOG"
fi</pre>
      <div class="box warn"><span class="lbl">경고가 실제로 찍히는지 확인</span>
        <p>서비스를 멈춘 뒤 점검을 돌려 <code>[경고]</code>가 남는지 보세요. "정상"만 찍히는 점검 스크립트는 아무 쓸모가 없습니다.</p></div>` },
          { sn: 'REQ 6', h: 'README 뼈대', body: `
      <pre># LLM 추론 스택

## 1. 요구 사양
- Ubuntu 24.04 LTS / RAM 8GB 이상 / 디스크 20GB 이상

## 2. 구조
사용자 → Nginx(80) → 추론 서비스(127.0.0.1:11434) → 모델

## 3. 설치
\`\`\`
git clone ... &amp;&amp; cd llmstack
./setup.sh
\`\`\`

## 4. 검증
\`\`\`
curl -s localhost/api/tags | jq -r '.models[].name'
systemctl is-active llmstack
\`\`\`

## 5. 트러블슈팅
### 5.1 502 Bad Gateway
증상 / 확인 / 원인 / 조치

### 5.2 ...
### 5.3 ...</pre>` }
        ]
      },
      {
        pn: 'PART 2', h: '교차 재현', time: '13:00–15:00',
        lede: '옆 팀과 환경을 바꿉니다. 구두 설명 금지 — README만 보고 진행합니다.',
        missions: [
          { n: 1, h: '깨끗한 환경 준비', body: `
      <p>VirtualBox에서 <strong>Day 1의 <code>clean-install</code> 스냅샷을 복원</strong>합니다.</p>
      <pre><span class="c"># 머신 → 스냅샷 → clean-install 선택 → 복원</span>
<span class="p">$</span> ls ~              <span class="c"># 비어 있어야 정상</span>
<span class="p">$</span> which jq docker   <span class="c"># 없어야 정상</span></pre>
      <div class="box check"><span class="lbl">열흘 전의 준비가 여기서</span>
        <p>Day 1에 "마음껏 망가뜨려도 된다"고 한 이유가 이것입니다. 되돌릴 수 있는 지점이 있어야 검증이 가능합니다.</p></div>` },
          { n: 2, h: '남의 문서만 보고 설치', body: `
      <div class="box warn"><span class="lbl">규칙</span>
        <ul>
          <li>상대 팀에게 <strong>질문하지 않습니다.</strong> 막히면 기록만 합니다</li>
          <li>문서에 없는 명령은 치지 않습니다</li>
          <li>막힌 시각과 증상을 그때그때 적습니다</li>
        </ul></div>
      <pre><span class="c"># 기록 양식</span>
[14:12] setup.sh 실행 → jq: command not found
        → 문서의 패키지 목록에 jq 누락
[14:20] 서비스 기동 실패 → /home/ubuntu 경로 하드코딩
        → 이 VM의 계정명이 달라서 실패</pre>` },
          { n: 3, h: '받은 피드백으로 고치기', body: `
      <p>옆 팀의 기록을 받아 돌아와서 고칩니다. 고친 뒤 <strong>다시 깨끗한 환경에서</strong> 검증합니다.</p>
      <div class="box check"><span class="lbl">흔한 수정 사항</span>
        <ul>
          <li>패키지 목록 보강 — 내 환경에 원래 있던 것</li>
          <li><code>/home/ubuntu</code> → <code>$HOME</code> 또는 변수</li>
          <li>고정 IP → 변수 또는 자동 탐지</li>
          <li>실행 순서 교정</li>
          <li>사전 준비물을 README에 명시</li>
        </ul></div>` },
          { n: 4, h: '최종 자가 점검 8단계', body: `
      <div class="selfcheck" style="margin-top:4px"><h3>제출 전 검증</h3><ul>
        <li>깨끗한 환경에서 <code>setup.sh</code> 한 번으로 완료된다</li>
        <li><code>setup.sh</code>를 두 번 실행해도 오류가 없다</li>
        <li><code>curl localhost/api/...</code>가 응답한다</li>
        <li>재부팅 후 자동 기동된다</li>
        <li>추론 포트로 직접 접근하면 막힌다</li>
        <li>프로세스를 죽이면 자동 복구된다</li>
        <li>점검 스크립트가 경고를 실제로 찍는다</li>
        <li>트러블슈팅 3건을 재현하고 복구할 수 있다</li>
      </ul></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '시연 준비', time: '15:00–15:10',
        steps: [
          { sn: 'DEMO', h: '8분을 다섯 토막으로', body: `
      <div class="tablewrap" style="margin-top:8px"><table>
        <thead><tr><th>시간</th><th>내용</th><th>준비물</th></tr></thead>
        <tbody>
          <tr><td class="num">1분</td><td>무엇을 만들었나</td><td>구조도 한 장</td></tr>
          <tr><td class="num">2분</td><td>설치</td><td>터미널 (미리 돌려둔 로그도 가능)</td></tr>
          <tr><td class="num">2분</td><td>동작</td><td>curl 호출</td></tr>
          <tr><td class="num">2분</td><td>장애 복구</td><td>고장 낼 시나리오 1개</td></tr>
          <tr><td class="num">1분</td><td>가장 어려웠던 점</td><td>—</td></tr>
        </tbody>
      </table></div>
      <div class="box check"><span class="lbl">슬라이드보다 터미널</span>
        <p>발표 자료를 만들지 마세요. 실제로 도는 화면이 가장 설득력 있습니다. 네 번째 항목에 가장 많은 점수가 걸려 있습니다.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>setup.sh</code> 두 번째 실행에서 실패', '멱등성 없음', '<code>id ... || useradd</code> 형태로 조건 추가'],
      ['다른 계정에서 경로 오류', '<code>/home/ubuntu</code> 하드코딩', '<code>$HOME</code> 또는 변수로 치환'],
      ['재부팅 후 서비스 없음', '<code>enable</code> 누락', '<code>setup.sh</code>에 <code>systemctl enable</code> 추가'],
      ['<code>502 Bad Gateway</code>', '백엔드 미기동 또는 주소 오류', 'Day 9 INCIDENT 5 절차대로'],
      ['점검 스크립트가 항상 정상', '조건식 오류', '서비스를 멈추고 직접 확인'],
      ['옆 팀 환경에서만 실패', '문서 누락', '그것이 바로 이 실습의 목적입니다 — 기록하고 고칩니다']
    ],
    checklist: [
      '요구사항 6개를 모두 구현했다',
      '<code>setup.sh</code>를 두 번 실행해도 안전하다',
      '하드코딩된 경로·IP·계정명이 없다',
      '재부팅 후 자동 기동을 확인했다',
      '추론 포트 직접 접근이 차단된다',
      '비밀값이 코드와 분리돼 있다',
      '점검 스크립트가 경고를 실제로 찍는다',
      'README만 보고 옆 팀이 설치를 시도했다',
      '교차 재현에서 나온 문제를 고쳤다',
      '고친 뒤 깨끗한 환경에서 다시 검증했다',
      '시연 5개 구간을 준비했다'
    ]
  },

  quizTitle: '10일 총정리 퀴즈',
  quiz: [
    { q: '현재 위치를 확인하는 명령은? (Day 1)', o: ['pwd', 'cd', 'ls', 'whoami'], a: 0,
      e: '열흘 전 첫 명령입니다. 지금도 길을 잃으면 가장 먼저 칩니다.' },
    { q: '오류 메시지만 파일로 보내는 표기는? (Day 2)', o: ['2> err.txt', '> err.txt', '1> err.txt', '&> err.txt'], a: 0,
      e: '표준 에러는 2번 통로입니다. <code>&amp;&gt;</code>는 둘 다 보냅니다.' },
    { q: '<code>grep -E</code>가 필요한 경우는? (Day 3)', o: ['| 나 + 같은 확장 문법을 쓸 때', '대소문자를 무시할 때', '줄 번호를 볼 때', '재귀 검색할 때'], a: 0,
      e: '<code>grep "a|b"</code>가 안 먹는 이유입니다.' },
    { q: '공유 디렉터리에서 그룹 소유권을 상속시키는 권한은? (Day 4)', o: ['2775', '0775', '4775', '1775'], a: 0,
      e: '앞자리 2가 setgid입니다. 없으면 팀원끼리 서로 파일을 못 고칩니다.' },
    { q: 'venv 활성화가 <code>source</code>여야 하는 이유는? (Day 5)', o: ['현재 셸의 PATH를 바꿔야 하므로', '권한 때문에', '더 빨라서', '문법상 규칙'], a: 0,
      e: '실행하면 자식 셸에서만 바뀌고 돌아오면 사라집니다.' },
    { q: '스크립트 두 번째 줄에 넣는 안전장치는? (Day 6) (직접 입력)', t: true, acc: ['set -euo pipefail', 'set -eu', 'set -e'], ans: 'set -euo pipefail',
      e: '실패 시 중단, 미정의 변수 오류, 파이프 실패 감지. 세 가지를 한 줄로 겁니다.' },
    { q: 'unit 파일을 고친 뒤 반드시 할 일은? (Day 7)', o: ['systemctl daemon-reload', 'systemctl restart만', '재부팅', 'nginx -t'], a: 0,
      e: '이걸 빼면 systemd가 옛 설정으로 계속 돕니다.' },
    { q: 'Dockerfile에서 requirements를 소스보다 먼저 COPY하는 이유는? (Day 8)', o: ['레이어 캐시로 재빌드를 빠르게', '보안 때문에', '문법 규칙', '이미지 크기 때문'], a: 0,
      e: '소스만 고쳤을 때 pip install을 건너뜁니다. 재빌드 시간이 10배 이상 차이납니다.' },
    { q: '용량이 남는데 <code>No space left</code>가 나는 원인은? (Day 9)', o: ['inode 고갈', '권한 문제', '메모리 부족', '네트워크 오류'], a: 0,
      e: '<code>df -i</code>로 확인합니다. 작은 파일이 대량으로 쌓였을 때 생깁니다.' },
    { q: '502 Bad Gateway가 뜻하는 것은? (Day 9)', o: ['프록시가 백엔드에 연결하지 못했다', '요청이 잘못됐다', '권한이 없다', '파일이 없다'], a: 0,
      e: '백엔드 생존 여부와 <code>proxy_pass</code> 주소를 확인합니다.' },
    { q: '<code>setup.sh</code>를 두 번 실행해도 안전한 성질을 무엇이라 하나요?', o: ['멱등성', '원자성', '재귀성', '휘발성'], a: 0,
      e: '<code>id 계정 || useradd</code>처럼 조건을 붙여 만듭니다.' },
    { q: '프로젝트에서 추론 포트를 직접 열지 않는 이유는?', o: ['인증 없는 API가 외부에 노출되기 때문', '속도가 느려서', '포트가 부족해서', '규칙이라서'], a: 0,
      e: '남이 내 GPU로 모델을 돌리는 사고가 실제로 자주 일어납니다.' },
    { q: '교차 재현에서 가장 흔하게 드러나는 문제는?', o: ['내 환경에 이미 있던 패키지가 문서에서 누락', '코드 버그', '네트워크 문제', '하드웨어 차이'], a: 0,
      e: '내 환경에 원래 있던 것은 눈에 보이지 않습니다. 그래서 남의 환경이 필요합니다.' },
    { q: '점검 스크립트가 "정상"만 찍는다면?', o: ['경고 조건을 실제로 만들어 검증해야 한다', '잘 만든 것이다', '로그를 줄여야 한다', '주기를 늘려야 한다'], a: 0,
      e: '서비스를 멈추고 돌려서 경고가 나오는지 확인해야 합니다.' },
    { q: '시연 8분에서 배점이 가장 큰 구간은?', o: ['장애 복구', '설치 과정', '구조 설명', '동작 시연'], a: 0,
      e: '잘 도는 것보다 고장 났을 때 대응할 수 있는 것이 실력입니다.' },
    { q: 'Ansible이 이 과정의 무엇에 해당하는 정식 버전인가요?', o: ['setup.sh', 'healthcheck.sh', 'Nginx 설정', 'Dockerfile'], a: 0,
      e: '환경 구성을 코드로 관리하는 도구입니다. 여러분은 이미 원리를 손으로 만들어 봤습니다.' },
    { q: 'Prometheus·Grafana가 대응하는 것은?', o: ['healthcheck.sh 와 로그', 'setup.sh', 'systemd unit', 'compose.yaml'], a: 0,
      e: '관측을 체계화한 도구입니다. Day 9의 점검 스크립트가 그 출발점입니다.' },
    { q: '앞으로 새 도구를 만났을 때 던질 세 가지 질문이 아닌 것은?', o: ['이 도구가 요즘 유행인가', '무엇이 돌고 있나', '왜 안 되나', '어떻게 재현하나'], a: 0,
      e: '도구 이름은 바뀌지만 이 세 질문은 그대로입니다. 열흘 동안 배운 것이 이것입니다.' }
  ]
};
