/* Day 5 · 바이브 코딩의 한계와 검증
   이 파일은 교안 "틀"입니다. TODO 표시된 곳(슬라이드 본문, 나레이션, 실습 단계)을 채워 나가세요.
   고친 뒤 vibe70 폴더에서:  node _src/build.js 5  */
module.exports = {
  day: 5,
  title: '바이브 코딩의 한계와 검증',
  theme: '"됐다"는 말을 믿지 말고 직접 확인한다',

  openingNar: `5일차입니다. 오늘의 주제는 바이브 코딩의 한계와 검증입니다. "됐다"는 말을 믿지 말고 직접 확인한다.`,

  goals: [
    ['AI가 틀리는 방식을', '환각 · 오래된 지식 · 자신감 있는 오답으로 구분할 수 있다'],
    ['맥락 창이 꽉 찰 때', '압축과 새 세션으로 대응할 수 있다'],
    ['보안 기본을', '키 · 입력 검증 · 샌드박스로 점검할 수 있다'],
    ['AI에게', '테스트를 먼저 쓰게 하고 결과로 검증할 수 있다'],
    ['AI가 바꾼 코드를', 'git diff와 Beyond Compare로 찾아 원하는 변경만 커밋할 수 있다']
  ],
  goalsNar: `오늘 끝났을 때 할 수 있어야 하는 것은 5가지입니다. AI가 틀리는 방식을 환각 · 오래된 지식 · 자신감 있는 오답으로 구분하는 것, 맥락 창이 꽉 찰 때 압축과 새 세션으로 대응하는 것, 보안 기본을 키 · 입력 검증 · 샌드박스로 점검하는 것, AI에게 테스트를 먼저 쓰게 하고 결과로 검증하는 것, 그리고 AI가 바꾼 코드를 git diff와 Beyond Compare로 찾아 원하는 변경만 커밋하는 것입니다.`,

  // 하루 일곱 차시. no = 과정 전체 차시 번호
  blocks: [
    { no: 29, time: '09:00–09:50', title: 'AI가 틀리는 방식', desc: '세 도구 공통' },
    { no: 30, time: '10:00–10:50', title: '맥락 창 이해하기', desc: '세 도구 공통' },
    { no: 31, time: '11:00–11:50', title: '보안 기본', desc: '세 도구 공통' },
    { no: 32, time: '12:00–12:50', title: '저작권 · 라이선스 · 윤리', desc: '세 도구 공통' },
    { no: 33, time: '13:50–14:40', title: '테스트 입문', desc: '세 도구 공통' },
    { no: 34, time: '14:50–15:40', title: '검증 습관 · AI 코드 검토', desc: '세 도구 공통 · git · Beyond Compare' },
    { no: 35, time: '15:50–16:40', title: '실습: 망가진 프로젝트 고치기', desc: '세 도구 공통' }
  ],
  blocksNar: `오늘은 일곱 차시입니다. 오전 네 차시, 점심 뒤 세 차시로 진행합니다.`,

  slides: [
    { section: true, eb: '29차시 · 09:00–09:50 · 세 도구 공통', h: 'AI가 틀리는 방식',
      sub: '환각 · 오래된 지식 · 자신감 있는 오답',
      nar: `29차시, AI가 틀리는 방식입니다. 환각 · 오래된 지식 · 자신감 있는 오답.` },

    { eb: '29차시 · Key Points', h: 'AI가 틀리는 방식',
      sub: '환각 · 오래된 지식 · 자신감 있는 오답',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">없는 함수를 지어내는 장면</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">세 도구가 같은 함정에 빠지는지 실험</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">틀린 걸 알아채는 신호</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 없는 함수를 지어내는 장면, 세 도구가 같은 함정에 빠지는지 실험, 틀린 걸 알아채는 신호.` },

    { section: true, eb: '30차시 · 10:00–10:50 · 세 도구 공통', h: '맥락 창 이해하기',
      sub: '대화가 길어지면 생기는 일',
      nar: `30차시, 맥락 창 이해하기입니다. 대화가 길어지면 생기는 일.` },

    { eb: '30차시 · Key Points', h: '맥락 창 이해하기',
      sub: '대화가 길어지면 생기는 일',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">맥락 창과 토큰</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">압축과 새 세션 (/compact · /clear 비교)</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">세션을 나누는 기준</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 맥락 창과 토큰, 압축과 새 세션 (/compact · /clear 비교), 세션을 나누는 기준.` },

    { section: true, eb: '31차시 · 11:00–11:50 · 세 도구 공통', h: '보안 기본',
      sub: '키 · 입력 검증 · 샌드박스',
      nar: `31차시, 보안 기본입니다. 키 · 입력 검증 · 샌드박스.` },

    { eb: '31차시 · Key Points', h: '보안 기본',
      sub: '키 · 입력 검증 · 샌드박스',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">모르는 코드 실행의 위험</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">Codex 샌드박스와 각 도구의 실행 제한</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">입력 검증 요청하기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 모르는 코드 실행의 위험, Codex 샌드박스와 각 도구의 실행 제한, 입력 검증 요청하기.` },

    { section: true, eb: '32차시 · 12:00–12:50 · 세 도구 공통', h: '저작권 · 라이선스 · 윤리',
      sub: '내가 책임지는 결과물',
      nar: `32차시, 저작권 · 라이선스 · 윤리입니다. 내가 책임지는 결과물.` },

    { eb: '32차시 · Key Points', h: '저작권 · 라이선스 · 윤리',
      sub: '내가 책임지는 결과물',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">AI가 만든 코드의 라이선스</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">세 회사의 데이터 정책 비교</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">과제에서 AI 사용 표시</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. AI가 만든 코드의 라이선스, 세 회사의 데이터 정책 비교, 과제에서 AI 사용 표시.` },

    { section: true, eb: '33차시 · 13:50–14:40 · 세 도구 공통', h: '테스트 입문',
      sub: 'AI에게 테스트를 먼저 쓰게 하기',
      nar: `33차시, 테스트 입문입니다. AI에게 테스트를 먼저 쓰게 하기.` },

    { eb: '33차시 · Key Points', h: '테스트 입문',
      sub: 'AI에게 테스트를 먼저 쓰게 하기',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">테스트가 무엇인가</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">테스트 먼저 → 구현</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">테스트 실행과 결과 읽기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 테스트가 무엇인가, 테스트 먼저 → 구현, 테스트 실행과 결과 읽기.` },

    { section: true, eb: '34차시 · 14:50–15:40 · 세 도구 공통 · git · Beyond Compare', h: '검증 습관 · AI 코드 검토',
      sub: '어디가 바뀌었는지 모르면 검증할 수 없다',
      nar: `34차시, 검증 습관입니다. 오늘은 그중에서도 AI가 만든 코드를 검토하는 법을 익힙니다. 어디가 바뀌었는지 모르면 검증할 수 없습니다.` },

    { eb: '34차시 · 왜', h: 'AI는 무엇을 바꿨는지 정확히 말해 주지 않는다',
      sub: '설명이 아니라 실제로 바뀐 줄을 본다',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card warn"><span class="n">01</span><span class="t">부탁 안 한 파일까지</span><span class="d">서식 정리 · 이름 바꾸기 · 코드 지우기. 진짜 바뀐 줄이 수백 줄 속에 묻힌다</span></div>
        <div class="card warn"><span class="n">02</span><span class="t">새 파일이 생긴다</span><span class="d">로그 · 메모 · 백업 · 테스트 파일. 그대로 커밋하면 저장소가 더러워진다</span></div>
        <div class="card warn"><span class="n">03</span><span class="t">"고쳤습니다"의 함정</span><span class="d">바꾼 파일 목록을 빠뜨리거나 틀리게 말한다. 비밀 값 · 의존성 변경도 끼어든다</span></div>
      </div>
      <div class="banner" style="margin-top:2.4cqh">원칙 — 내가 읽지 않은 줄은 커밋하지 않는다. 커밋하는 순간 AI 코드는 내 코드다.</div>`,
      nar: `Claude Code, Gemini CLI, Codex 같은 코딩 에이전트는 폴더의 파일을 직접 고칩니다. 문제는 무엇을 바꿨는지 정확히 알려 주지 않는다는 것입니다. 부탁하지 않은 파일의 서식을 정리하거나 이름을 바꾸고, 로그나 메모 파일을 새로 만들고, 바꾼 파일 목록을 빠뜨리거나 틀리게 말하기도 합니다. 그래서 원칙은 하나입니다. 내가 읽지 않은 줄은 커밋하지 않는다. 커밋하는 순간 AI 코드는 내 코드가 됩니다.` },

    { eb: '34차시 · 순서', h: 'AI에게 맡기는 안전한 순서',
      sub: '기준점이 있어야 비교할 수 있고, 돌아올 수 있다',
      body: `<div class="rowlist">
        <div class="row"><span class="dot">1</span><span class="t">폴더 정하기</span><span class="d">프로젝트 폴더 하나에서만 에이전트를 실행 (홈 · 바탕 화면 금지)</span></div>
        <div class="row"><span class="dot">2</span><span class="t">기준점</span><span class="d"><code>git commit</code> 후 <code>git switch -c ai-기능이름</code></span></div>
        <div class="row"><span class="dot">3</span><span class="t">맡기기</span><span class="d">고칠 파일과 고치지 말 것, 새 파일 금지를 요청에 적는다</span></div>
        <div class="row"><span class="dot">4</span><span class="t">찾기</span><span class="d"><code>git status</code> → <code>git diff --stat</code> → <code>git difftool -d</code> (Beyond Compare)</span></div>
        <div class="row"><span class="dot">5</span><span class="t">골라 담기</span><span class="d"><code>git restore</code> · <code>git clean -n/-f</code> · <code>git add 파일</code> · <code>git commit -m "AI: …"</code></span></div>
      </div>`,
      foot: '망쳤으면 → git switch main · git branch -D ai-기능이름 으로 통째로 버린다',
      nar: `순서는 다섯 단계입니다. 첫째, 에이전트는 프로젝트 폴더 하나에서만 실행합니다. 둘째, 맡기기 전에 커밋해서 기준점을 남기고 AI 전용 브랜치로 옮깁니다. 셋째, 요청에 고칠 파일과 고치지 말 것을 적습니다. 넷째, 끝나면 git status, git diff stat, 그리고 Beyond Compare로 바뀐 곳을 찾습니다. 다섯째, 원하지 않는 변경은 restore, 찌꺼기 파일은 clean으로 정리하고 원하는 파일만 add해서 커밋합니다. 결과가 엉망이면 main으로 돌아와 브랜치를 지우면 됩니다.` },

    { eb: '34차시 · 도구', h: 'Beyond Compare를 git에 연결하기',
      sub: '폴더 비교 한 화면으로 AI의 변경을 훑는다',
      body: `<div class="grid g2" style="align-items:start">
        <pre><span class="c"># Windows (경로는 설치 폴더에 맞게)</span>
git config --global diff.tool bc
git config --global difftool.bc.path "C:/Program Files/Beyond Compare 5/BComp.exe"
git config --global difftool.prompt false
git config --global merge.tool bc

<span class="c"># 쓰기</span>
<span class="p">git difftool -d</span>              <span class="c"># 바뀐 파일 전체를 폴더 비교로</span>
<span class="p">git difftool -d main ai-menu</span> <span class="c"># 합치기 전 브랜치 비교</span></pre>
        <div class="stack">
          <div class="lay"><b>빨강</b><span>다른 파일 · 다른 줄</span></div>
          <div class="lay"><b>보라 · 파랑</b><span>한쪽에만 있는 파일 (AI가 새로 만든 것)</span></div>
          <div class="lay"><b>화살표</b><span>덩어리 단위로 원래 내용을 되가져오기</span></div>
          <div class="lay"><b>무료 대안</b><span>WinMerge · VS Code 비교 · Meld</span></div>
        </div>
      </div>`,
      foot: 'Beyond Compare 는 30일 체험판 뒤 라이선스 필요 · 자세한 실습은 Git · GitHub 실습 L23',
      nar: `비교 도구는 Beyond Compare를 씁니다. 두 폴더나 두 파일을 나란히 놓고 다른 곳을 색으로 보여 줍니다. git config로 diff tool을 bc로 정해 두면 git difftool 대시 d 한 줄로 바뀐 파일 전체가 폴더 비교 화면에 열립니다. 빨간색은 다른 곳, 한쪽에만 있는 파일은 AI가 새로 만든 파일입니다. 원하지 않는 덩어리는 화살표로 원래 내용을 되가져올 수 있습니다. 무료로는 WinMerge나 VS Code 비교 화면을 써도 흐름은 같습니다.` },

    { eb: '34차시 · 실습', h: '세 도구로 같은 일을 시키고, 세 브랜치를 비교한다',
      sub: '누가 무엇을 몰래 바꿨는지 표로 남긴다',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">ai-claude</span><span class="t">Claude Code</span><span class="d">브랜치에서 <code>claude</code> 실행 → 같은 요청</span></div>
        <div class="card"><span class="n">ai-gemini</span><span class="t">Gemini CLI</span><span class="d">기준점에서 새 브랜치 → <code>gemini</code></span></div>
        <div class="card"><span class="n">ai-codex</span><span class="t">Codex CLI</span><span class="d">기준점에서 새 브랜치 → <code>codex</code></span></div>
      </div>
      <div class="bannerG" style="margin-top:2.4cqh">비교표 — AI가 말한 "바꾼 파일" vs <code>git diff --stat</code> · 부탁 안 한 변경 · 새 파일 · 최종 채택 여부</div>`,
      nar: `실습에서는 세 도구에게 같은 요청을 합니다. 기준점 커밋에서 ai claude, ai gemini, ai codex 세 브랜치를 만들고 각 브랜치에서 도구를 하나씩 실행합니다. 끝나면 AI가 말한 바꾼 파일 목록과 git diff stat의 실제 목록을 비교하고, 부탁하지 않은 변경과 새 파일을 표로 정리합니다. 가장 깨끗한 결과 하나만 골라 main에 합칩니다.` },

    { section: true, eb: '35차시 · 15:50–16:40 · 세 도구 공통', h: '실습: 망가진 프로젝트 고치기',
      sub: '하네스가 왜 필요한지 느끼는 시간',
      nar: `35차시, 실습: 망가진 프로젝트 고치기입니다. 하네스가 왜 필요한지 느끼는 시간.` },

    { eb: '35차시 · Key Points', h: '실습: 망가진 프로젝트 고치기',
      sub: '하네스가 왜 필요한지 느끼는 시간',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">일부러 망가뜨린 프로젝트 받기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">세 도구로 각각 고치기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">같은 실수가 반복된 지점 기록</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 일부러 망가뜨린 프로젝트 받기, 세 도구로 각각 고치기, 같은 실수가 반복된 지점 기록.` }
  ],

  assignment: {
    title: '한계 사례 보고서',
    lede: 'AI가 틀린 장면을 모으고, 테스트로 막은 사례를 남깁니다.',
    subtitle: '각 항목마다 결과 화면 캡처와 사용한 요청문(프롬프트)을 함께 붙일 것',
    items: [
      'AI가 틀린 장면 3개와 유형 (환각 · 오래된 지식 · 오답)',
      '누적 프로젝트에 추가한 테스트 3개 이상',
      '망가진 프로젝트를 고친 과정',
      '"다음엔 규칙으로 막고 싶은 실수" 목록',
      '34차시 세 도구 비교표와 Beyond Compare 폴더 비교 캡처 1장'
    ],
    note: 'TODO 채점 기준. 결과물이 동작하는지, 그리고 어떻게 확인했는지를 함께 봅니다.',
    nar: `오늘의 과제는 한계 사례 보고서입니다. AI가 틀린 장면을 모으고, 테스트로 막은 사례를 남깁니다.` },

  wrap: {
    done: 'AI가 틀리는 방식 · 맥락 창 이해하기 · 보안 기본 · 저작권 · 라이선스 · 윤리 · 테스트 입문 · AI 코드 검토',
    next: '내일 · Day 6 — 하네스 I · 규칙과 기억',
    nextDesc: '규칙 파일 하나로 세 도구를 같은 방향으로 움직인다',
    nar: `오늘 수고하셨습니다. 내일은 하네스 I · 규칙과 기억입니다. 오늘 마지막에 커밋하고 배포까지 해 두세요. 내일 첫 시간은 오늘 결과물을 여는 것으로 시작합니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '바이브 코딩의 한계와 검증',
    standfirst: '"됐다"는 말을 믿지 말고 직접 확인한다. 차시 순서대로 쌓이니 건너뛰지 마세요.',
    rules: [
      ['요청은 4요소로', '목표 · 맥락 · 제약 · 완료 기준을 넣어 요청하세요.'],
      ['직접 확인한다', 'AI가 "완료"라고 해도 화면 · 테스트 · 로그로 직접 확인하세요.'],
      ['작게 커밋한다', '기능 하나가 끝날 때마다 커밋하세요. 잘못되면 바로 돌아올 수 있습니다.']
    ],
    parts: [
      {
        pn: '29차시', h: 'AI가 틀리는 방식', time: '09:00–09:50 · 세 도구 공통',
        lede: '환각 · 오래된 지식 · 자신감 있는 오답',
        missions: [
          { n: 1, h: 'AI가 틀리는 방식', body: `
      <ul>
        <li>없는 함수를 지어내는 장면</li>
        <li>세 도구가 같은 함정에 빠지는지 실험</li>
        <li>틀린 걸 알아채는 신호</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '30차시', h: '맥락 창 이해하기', time: '10:00–10:50 · 세 도구 공통',
        lede: '대화가 길어지면 생기는 일',
        missions: [
          { n: 2, h: '맥락 창 이해하기', body: `
      <ul>
        <li>맥락 창과 토큰</li>
        <li>압축과 새 세션 (/compact · /clear 비교)</li>
        <li>세션을 나누는 기준</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '31차시', h: '보안 기본', time: '11:00–11:50 · 세 도구 공통',
        lede: '키 · 입력 검증 · 샌드박스',
        missions: [
          { n: 3, h: '보안 기본', body: `
      <ul>
        <li>모르는 코드 실행의 위험</li>
        <li>Codex 샌드박스와 각 도구의 실행 제한</li>
        <li>입력 검증 요청하기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '32차시', h: '저작권 · 라이선스 · 윤리', time: '12:00–12:50 · 세 도구 공통',
        lede: '내가 책임지는 결과물',
        missions: [
          { n: 4, h: '저작권 · 라이선스 · 윤리', body: `
      <ul>
        <li>AI가 만든 코드의 라이선스</li>
        <li>세 회사의 데이터 정책 비교</li>
        <li>과제에서 AI 사용 표시</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '33차시', h: '테스트 입문', time: '13:50–14:40 · 세 도구 공통',
        lede: 'AI에게 테스트를 먼저 쓰게 하기',
        missions: [
          { n: 5, h: '테스트 입문', body: `
      <ul>
        <li>테스트가 무엇인가</li>
        <li>테스트 먼저 → 구현</li>
        <li>테스트 실행과 결과 읽기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '34차시', h: '검증 습관 · AI 코드 검토', time: '14:50–15:40 · 세 도구 공통 · git · Beyond Compare',
        lede: 'AI가 무엇을 바꿨는지 git과 Beyond Compare로 직접 찾고, 원하는 변경만 커밋합니다. 버전 관리 없이 AI에게 코드를 맡기지 않습니다.',
        steps: [
          { sn: 'STEP 1', h: 'Beyond Compare 설치와 git 연결', body: `
      <ol>
        <li><a href="https://www.scootersoftware.com/download" target="_blank" rel="noopener">scootersoftware.com/download</a> 에서 Beyond Compare 5 를 받아 설치합니다. 30일 체험판으로 시작합니다(계속 쓰려면 라이선스, 무료 대안은 WinMerge).</li>
        <li>Git Bash 에서 git 과 연결합니다.</li>
      </ol>
      <pre><span class="p">git config --global diff.tool bc</span>
<span class="p">git config --global difftool.bc.path "C:/Program Files/Beyond Compare 5/BComp.exe"</span>
<span class="p">git config --global difftool.prompt false</span>
<span class="p">git config --global merge.tool bc</span>
<span class="p">git config --global mergetool.bc.path "C:/Program Files/Beyond Compare 5/BComp.exe"</span>
<span class="p">git config --global --get diff.tool</span>
<span class="o">bc</span></pre>
      <div class="box q"><span class="lbl">macOS</span><p>앱을 연 뒤 메뉴 Beyond Compare → Install Command Line Tools, 그다음 <code>git config --global diff.tool bc</code> 만 합니다.</p></div>` },
          { sn: 'STEP 2', h: '프로젝트 폴더 정하기와 기준점 커밋', body: `
      <p>누적 프로젝트 폴더로 이동합니다. 코딩 에이전트는 <b>실행한 폴더</b>를 작업 공간으로 삼으므로, 반드시 이 폴더 안에서 실행합니다. 홈 폴더나 바탕 화면에서 실행하지 않습니다.</p>
      <pre><span class="p">cd ~/vibe-project</span>          <span class="c"># 내 누적 프로젝트 폴더</span>
<span class="p">git status</span>                 <span class="c"># 커밋 안 한 것이 있으면 먼저 커밋</span>
<span class="p">git add -A</span>
<span class="p">git commit -m "AI 작업 전 기준점"</span>
<span class="p">git switch -c ai-claude</span></pre>
      <div class="box warn"><span class="lbl">기준점이 없으면</span><p>AI 결과가 마음에 들지 않아도 돌아갈 곳이 없습니다. AI 를 부르기 전에 커밋 — 이것이 오늘의 가장 중요한 습관입니다.</p></div>` },
          { sn: 'STEP 3', h: '세 도구에게 같은 일 맡기기', body: `
      <p>세 브랜치를 모두 <b>기준점에서</b> 만들고, 브랜치마다 도구 하나를 실행해 같은 요청을 합니다.</p>
      <pre><span class="p">git switch -c ai-claude main</span>   <span class="c"># → claude 실행</span>
<span class="p">git switch -c ai-gemini main</span>   <span class="c"># → gemini 실행</span>
<span class="p">git switch -c ai-codex main</span>    <span class="c"># → codex 실행</span></pre>
      <span class="prelbl">요청 예시 — 고칠 파일과 금지할 것을 적는다</span>
      <pre>내 프로젝트에 다크 모드 버튼을 추가해줘.
- index.html 에 버튼 하나, app.js 에 전환 함수, style.css 에 .dark 규칙만 추가
- 다른 파일과 기존 스타일은 고치지 말고, 새 파일은 만들지 마
- 끝나면 바꾼 파일과 바꾼 줄 수를 목록으로 알려줘</pre>
      <div class="box q"><span class="lbl">브랜치를 바꾸기 전에</span><p>도구 하나가 끝나면 그 결과를 <code>git add -A</code> · <code>git commit -m "AI(claude): 다크 모드 — 검토 전"</code> 으로 그 브랜치에 임시 커밋해 둡니다. 그래야 다음 브랜치로 옮겨도 결과가 섞이지 않습니다.</p></div>` },
          { sn: 'STEP 4', h: '무엇이 바뀌었나 찾기', body: `
      <p>넓은 것에서 좁은 것으로. 어떤 파일이 → 얼마나 → 어떻게.</p>
      <pre><span class="p">git diff --stat main ai-claude</span>       <span class="c"># 파일 목록과 줄 수</span>
<span class="p">git diff --name-status main ai-claude</span> <span class="c"># A 새 파일 · M 고침 · D 지움</span>
<span class="p">git difftool -d main ai-claude</span>       <span class="c"># Beyond Compare 폴더 비교</span></pre>
      <div class="tablewrap"><table>
        <thead><tr><th>확인할 것</th><th>보는 곳</th></tr></thead>
        <tbody>
          <tr><td>AI 가 말한 "바꾼 파일" 과 실제 목록이 같은가</td><td><code>--stat</code> · <code>--name-status</code></td></tr>
          <tr><td>부탁하지 않은 파일 · 서식 변경</td><td>Beyond Compare 폴더 비교의 빨간 파일</td></tr>
          <tr><td>새로 생긴 파일 (로그 · 메모 · 백업)</td><td><code>A</code> 표시, 한쪽에만 있는 파일</td></tr>
          <tr><td>지워진 코드 · 바뀐 함수 이름</td><td>줄 비교의 빨간 줄</td></tr>
          <tr><td>비밀 값 · 라이브러리 추가</td><td><code>.env</code> · <code>package.json</code> · <code>requirements.txt</code> 의 diff</td></tr>
        </tbody>
      </table></div>` },
          { sn: 'STEP 5', h: '골라 담아 main 에 합치기', body: `
      <p>세 결과 중 가장 깨끗한 브랜치 하나를 고릅니다. 그 브랜치에서 원하지 않는 변경만 되돌리고 다시 커밋한 뒤 main 에 합칩니다.</p>
      <pre><span class="p">git switch ai-claude</span>
<span class="p">git restore --source=main style.css</span>   <span class="c"># 부탁 안 한 변경을 기준점 내용으로</span>
<span class="p">git rm debug.log</span>                    <span class="c"># AI 가 만든 찌꺼기 (임시 커밋에 들어갔던 것)</span>
<span class="p">git commit -am "AI(claude): 다크 모드 — 검토 후 정리"</span>
<span class="p">git switch main</span>
<span class="p">git merge ai-claude</span>
<span class="p">git branch -D ai-gemini ai-codex</span>       <span class="c"># 쓰지 않은 시도는 버림</span></pre>
      <div class="box check"><span class="lbl">커밋 메시지에 남길 것</span><p>어느 AI 를 썼는지, 무엇을 부탁했는지, 무엇을 버렸는지. 나중에 이 커밋을 보는 사람이 어디를 더 의심해야 할지 알 수 있습니다.</p></div>` },
          { sn: 'STEP 6', h: '먼저 연습해 보기 — Git 실습 L23', body: `
      <p>명령이 익숙하지 않으면 설치 없이 브라우저에서 연습합니다. <a href="../../git/#l23" target="_blank" rel="noopener">Git · GitHub 실습 L23 · AI 가 만든 코드 검토하기</a> 의 미션 3개(기준점 만들기 · 원하는 변경만 담기 · 망친 시도 버리기)를 풀고 오면 이 차시가 훨씬 빠릅니다.</p>` }
        ],
        missions: [
          { n: 6, h: '세 도구 비교표 만들기', body: `
      <p>STEP 3 ~ 5 를 마치고 아래 표를 채워 과제 보고서에 붙입니다.</p>
      <div class="tablewrap"><table>
        <thead><tr><th>도구</th><th>AI 가 말한 바꾼 파일</th><th><code>git diff --stat</code> 실제 목록</th><th>부탁 안 한 변경 · 새 파일</th><th>채택</th></tr></thead>
        <tbody>
          <tr><td>Claude Code</td><td></td><td></td><td></td><td></td></tr>
          <tr><td>Gemini CLI</td><td></td><td></td><td></td><td></td></tr>
          <tr><td>Codex CLI</td><td></td><td></td><td></td><td></td></tr>
        </tbody>
      </table></div>
      <div class="box q"><span class="lbl">확인 질문</span><p>세 도구 중 지시를 가장 잘 지킨 것은? 부탁하지 않은 변경을 하나도 못 찾았다면, 정말 없었는지 Beyond Compare 폴더 비교로 다시 보세요.</p></div>` }
        ]
      },
      {
        pn: '35차시', h: '실습: 망가진 프로젝트 고치기', time: '15:50–16:40 · 세 도구 공통',
        lede: '하네스가 왜 필요한지 느끼는 시간',
        missions: [
          { n: 7, h: '실습: 망가진 프로젝트 고치기', body: `
      <ul>
        <li>일부러 망가뜨린 프로젝트 받기</li>
        <li>세 도구로 각각 고치기</li>
        <li>같은 실수가 반복된 지점 기록</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      }
    ],
    errors: [
      ['명령을 찾을 수 없음 (command not found)', '설치가 안 됐거나 PATH에 없음', '터미널을 새로 열고 버전 확인. 그래도 안 되면 다시 설치'],
      ['로그인 · 인증 오류', '계정 로그인이 풀렸거나 사용량 초과', '로그인 명령을 다시 실행하고 사용량 확인. 막히면 다른 도구로 진행'],
      ['AI가 같은 실수를 반복', '맥락이 길어져 규칙을 놓침', '요약 후 새 세션에서 핵심만 다시 전달'],
      ['git difftool 이 Beyond Compare 를 못 찾음', 'difftool.bc.path 경로가 설치 폴더와 다름', '설치 폴더의 BComp.exe 경로를 / 로 적어 다시 설정 (예: C:/Program Files/Beyond Compare 5/BComp.exe)'],
      ['AI 결과가 다른 브랜치와 섞임', '임시 커밋 없이 브랜치를 바꿈', '도구가 끝날 때마다 그 브랜치에 커밋한 뒤 switch'],
      ['git diff 에 아무것도 안 나옴', 'AI 가 이미 커밋했거나 비교 대상이 틀림', 'git log 로 확인하고 git diff main ai-브랜치 처럼 기준점과 비교'],
      ['TODO', '이 날 자주 나오는 오류를 추가하세요', '']
    ],
    checklist: [
      'AI가 틀리는 방식을 환각 · 오래된 지식 · 자신감 있는 오답으로 구분할 수 있다',
      '맥락 창이 꽉 찰 때 압축과 새 세션으로 대응할 수 있다',
      '보안 기본을 키 · 입력 검증 · 샌드박스로 점검할 수 있다',
      'AI에게 테스트를 먼저 쓰게 하고 결과로 검증할 수 있다',
      'AI 에게 맡기기 전에 기준점 커밋과 AI 전용 브랜치를 만들었다',
      'Beyond Compare(또는 WinMerge)를 git difftool 로 연결하고 AI 의 변경을 폴더 비교로 확인했다',
      '세 도구 비교표에서 부탁하지 않은 변경 · 새 파일을 찾아 정리했다',
      '오늘 결과물을 커밋하고 push했다'
    ]
  },

  quizTitle: 'Day 5 · 바이브 코딩의 한계와 검증 퀴즈',
  // TODO 문항을 늘려 주세요. 형식은 README 참고
  quiz: [
    {
      "q": "AI가 존재하지 않는 라이브러리 함수를 그럴듯하게 지어내는 현상은?",
      "o": [
        "환각",
        "압축",
        "샌드박스",
        "리팩터링"
      ],
      "a": 0,
      "e": "환각입니다. 공식 문서나 실행 결과로 확인해야 알아챌 수 있습니다."
    },
    {
      "q": "대화가 너무 길어져 AI가 앞의 규칙을 잊기 시작할 때 알맞은 대응은?",
      "o": [
        "요약해서 압축하거나 새 세션에서 핵심만 다시 전달",
        "더 길게 설명을 덧붙인다",
        "같은 요청을 반복한다",
        "컴퓨터를 재부팅한다"
      ],
      "a": 0,
      "e": "맥락 창에는 한계가 있습니다. 압축하거나 새 세션을 여는 것이 가장 확실합니다."
    },
    {
      "q": "AI가 \"완료했습니다\"라고 했을 때 가장 믿을 만한 확인 방법은?",
      "o": [
        "테스트 실행과 화면 직접 확인",
        "AI에게 \"정말이야?\"라고 묻기",
        "코드 줄 수 세기",
        "그냥 믿기"
      ],
      "a": 0,
      "e": "실행 결과가 증거입니다. 내일부터는 이 확인을 하네스로 자동화합니다."
    },
    {
      "q": "구현보다 먼저 테스트를 쓰는 개발 방식의 약자는? (직접 입력)",
      "t": true,
      "acc": [
        "tdd"
      ],
      "ans": "TDD",
      "e": "Test-Driven Development. 테스트가 완료 기준이 되어 AI가 언제 멈출지 분명해집니다."
    },
    {
      "q": "코딩 에이전트에게 일을 맡기기 직전에 가장 먼저 할 일은?",
      "o": [
        "지금 상태를 커밋해 기준점을 만들고 AI 전용 브랜치로 옮긴다",
        "AI에게 조심해서 고쳐 달라고 부탁한다",
        "Beyond Compare를 미리 열어 둔다",
        "프로젝트 폴더를 바탕 화면으로 옮긴다"
      ],
      "a": 0,
      "e": "기준점이 있어야 AI가 무엇을 바꿨는지 비교할 수 있고, 망쳤을 때 돌아올 수 있습니다."
    },
    {
      "q": "AI가 끝났다고 한 뒤, 바뀐 파일을 Beyond Compare 폴더 비교 한 화면으로 여는 git 명령은?",
      "o": [
        "git difftool -d",
        "git log --oneline",
        "git push",
        "git stash"
      ],
      "a": 0,
      "e": "diff.tool 을 bc 로 설정해 두면 git difftool -d 가 바뀐 파일 전체를 폴더 비교로 엽니다."
    },
    {
      "q": "AI가 부탁하지 않은 style.css 를 바꿨다. 아직 커밋 전이라면 원래대로 돌리는 명령은? (직접 입력)",
      "t": true,
      "acc": [
        "git restore style.css",
        "git checkout -- style.css",
        "git checkout style.css"
      ],
      "ans": "git restore style.css",
      "e": "restore 는 작업 폴더의 변경을 마지막 커밋 상태로 되돌립니다. 설명이 아니라 실제로 바뀐 줄을 보고 판단합니다."
    }
  ]
};
