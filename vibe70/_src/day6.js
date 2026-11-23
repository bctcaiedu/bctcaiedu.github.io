/* Day 6 · 하네스 I · 규칙과 기억
   이 파일은 교안 "틀"입니다. TODO 표시된 곳(슬라이드 본문, 나레이션, 실습 단계)을 채워 나가세요.
   고친 뒤 vibe70 폴더에서:  node _src/build.js 6  */
module.exports = {
  day: 6,
  title: '하네스 I · 규칙과 기억',
  theme: '규칙 파일 하나로 세 도구를 같은 방향으로 움직인다',

  openingNar: `6일차입니다. 오늘의 주제는 하네스 I · 규칙과 기억입니다. 규칙 파일 하나로 세 도구를 같은 방향으로 움직인다.`,

  goals: [
    ['CLAUDE.md · GEMINI.md · AGENTS.md를', '구분하고 읽히는 위치를 설명할 수 있다'],
    ['AGENTS.md를 공통 규칙으로 두고', '세 도구에서 모두 쓰게 할 수 있다'],
    ['검증 가능한 규칙을', '구체적으로 쓸 수 있다'],
    ['권한과 메모리를', '설정 파일로 관리할 수 있다']
  ],
  goalsNar: `오늘 끝났을 때 할 수 있어야 하는 것은 4가지입니다. CLAUDE.md · GEMINI.md · AGENTS.md를 구분하고 읽히는 위치를 설명하는 것, AGENTS.md를 공통 규칙으로 두고 세 도구에서 모두 쓰게 하는 것, 검증 가능한 규칙을 구체적으로 쓸 수 있다, 권한과 메모리를 설정 파일로 관리하는 것입니다.`,

  // 하루 일곱 차시. no = 과정 전체 차시 번호
  blocks: [
    { no: 36, time: '09:00–09:50', title: '하네스란 무엇인가', desc: '세 도구 공통' },
    { no: 37, time: '10:00–10:50', title: '규칙 파일 세 가지', desc: '세 도구 공통' },
    { no: 38, time: '11:00–11:50', title: '규칙 하나로 세 도구', desc: '세 도구 공통' },
    { no: 39, time: '12:00–12:50', title: '좋은 규칙과 나쁜 규칙', desc: '세 도구 공통' },
    { no: 40, time: '13:50–14:40', title: '권한 설계', desc: '세 도구 공통' },
    { no: 41, time: '14:50–15:40', title: '메모리', desc: '세 도구 공통' },
    { no: 42, time: '15:50–16:40', title: '실습: 규칙 적용 전후 비교', desc: '세 도구 공통' }
  ],
  blocksNar: `오늘은 일곱 차시입니다. 오전 네 차시, 점심 뒤 세 차시로 진행합니다.`,

  slides: [
    { section: true, eb: '36차시 · 09:00–09:50 · 세 도구 공통', h: '하네스란 무엇인가',
      sub: '엔진과 고삐 · 계기판 · 안전벨트',
      nar: `36차시, 하네스란 무엇인가입니다. 엔진과 고삐 · 계기판 · 안전벨트.` },

    { eb: '36차시 · Key Points', h: '하네스란 무엇인가',
      sub: '엔진과 고삐 · 계기판 · 안전벨트',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">5일차 실패를 다시 보기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">하네스의 4요소: 규칙 · 권한 · 도구 · 검증</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">오늘부터 8일차까지의 지도</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 5일차 실패를 다시 보기, 하네스의 4요소: 규칙 · 권한 · 도구 · 검증, 오늘부터 8일차까지의 지도.` },

    { section: true, eb: '37차시 · 10:00–10:50 · 세 도구 공통', h: '규칙 파일 세 가지',
      sub: 'CLAUDE.md · GEMINI.md · AGENTS.md',
      nar: `37차시, 규칙 파일 세 가지입니다. CLAUDE.md · GEMINI.md · AGENTS.md.` },

    { eb: '37차시 · Key Points', h: '규칙 파일 세 가지',
      sub: 'CLAUDE.md · GEMINI.md · AGENTS.md',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">파일이 읽히는 위치와 순서</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">전역 규칙과 프로젝트 규칙</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">세 파일 구조 비교</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 파일이 읽히는 위치와 순서, 전역 규칙과 프로젝트 규칙, 세 파일 구조 비교.` },

    { section: true, eb: '38차시 · 11:00–11:50 · 세 도구 공통', h: '규칙 하나로 세 도구',
      sub: 'AGENTS.md를 공통 규칙으로',
      nar: `38차시, 규칙 하나로 세 도구입니다. AGENTS.md를 공통 규칙으로.` },

    { eb: '38차시 · Key Points', h: '규칙 하나로 세 도구',
      sub: 'AGENTS.md를 공통 규칙으로',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">AGENTS.md에 공통 규칙 쓰기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">다른 두 파일에서 연결하기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">세 도구가 같은 규칙을 따르는지 확인</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. AGENTS.md에 공통 규칙 쓰기, 다른 두 파일에서 연결하기, 세 도구가 같은 규칙을 따르는지 확인.` },

    { section: true, eb: '39차시 · 12:00–12:50 · 세 도구 공통', h: '좋은 규칙과 나쁜 규칙',
      sub: '구체적이고 검증 가능한 지시',
      nar: `39차시, 좋은 규칙과 나쁜 규칙입니다. 구체적이고 검증 가능한 지시.` },

    { eb: '39차시 · Key Points', h: '좋은 규칙과 나쁜 규칙',
      sub: '구체적이고 검증 가능한 지시',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">"깔끔하게" 대신 무엇을 어떻게</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">금지 사항과 이유</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">규칙은 짧을수록 잘 지켜진다</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. "깔끔하게" 대신 무엇을 어떻게, 금지 사항과 이유, 규칙은 짧을수록 잘 지켜진다.` },

    { section: true, eb: '40차시 · 13:50–14:40 · 세 도구 공통', h: '권한 설계',
      sub: '허용 목록과 차단 목록',
      nar: `40차시, 권한 설계입니다. 허용 목록과 차단 목록.` },

    { eb: '40차시 · Key Points', h: '권한 설계',
      sub: '허용 목록과 차단 목록',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">settings.json · config.toml 등 설정 파일</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">허용할 명령 · 막을 명령</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">프로젝트 설정과 개인 설정 나누기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. settings.json · config.toml 등 설정 파일, 허용할 명령 · 막을 명령, 프로젝트 설정과 개인 설정 나누기.` },

    { section: true, eb: '41차시 · 14:50–15:40 · 세 도구 공통', h: '메모리',
      sub: '세션이 바뀌어도 이어지는 지식',
      nar: `41차시, 메모리입니다. 세션이 바뀌어도 이어지는 지식.` },

    { eb: '41차시 · Key Points', h: '메모리',
      sub: '세션이 바뀌어도 이어지는 지식',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">세 도구의 메모리 방식 비교</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">무엇을 기억시키고 무엇은 안 하나</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">오래된 기억 정리</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 세 도구의 메모리 방식 비교, 무엇을 기억시키고 무엇은 안 하나, 오래된 기억 정리.` },

    { section: true, eb: '42차시 · 15:50–16:40 · 세 도구 공통', h: '실습: 규칙 적용 전후 비교',
      sub: '누적 프로젝트에 하네스 1단계',
      nar: `42차시, 실습: 규칙 적용 전후 비교입니다. 누적 프로젝트에 하네스 1단계.` },

    { eb: '42차시 · Key Points', h: '실습: 규칙 적용 전후 비교',
      sub: '누적 프로젝트에 하네스 1단계',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">공통 규칙 파일 작성</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">같은 요청을 규칙 전 · 후로</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">달라진 점 기록</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 공통 규칙 파일 작성, 같은 요청을 규칙 전 · 후로, 달라진 점 기록.` }
  ],

  assignment: {
    title: '공통 규칙 파일과 전후 비교',
    lede: '누적 프로젝트에 규칙 파일과 권한 설정을 적용하고 효과를 보입니다.',
    subtitle: '각 항목마다 결과 화면 캡처와 사용한 요청문(프롬프트)을 함께 붙일 것',
    items: [
      'AGENTS.md 전문과 연결한 CLAUDE.md · GEMINI.md',
      '권한 설정 파일 캡처',
      '같은 요청의 규칙 적용 전 · 후 결과 비교',
      '5일차 "막고 싶은 실수" 중 규칙으로 막은 것'
    ],
    note: 'TODO 채점 기준. 결과물이 동작하는지, 그리고 어떻게 확인했는지를 함께 봅니다.',
    nar: `오늘의 과제는 공통 규칙 파일과 전후 비교입니다. 누적 프로젝트에 규칙 파일과 권한 설정을 적용하고 효과를 보입니다.` },

  wrap: {
    done: '하네스란 무엇인가 · 규칙 파일 세 가지 · 규칙 하나로 세 도구 · 좋은 규칙과 나쁜 규칙 · 권한 설계',
    next: '내일 · Day 7 — 하네스 II · 재사용과 자동화',
    nextDesc: '반복되는 요청은 명령으로, 반복되는 검사는 훅으로',
    nar: `오늘 수고하셨습니다. 내일은 하네스 II · 재사용과 자동화입니다. 오늘 마지막에 커밋하고 배포까지 해 두세요. 내일 첫 시간은 오늘 결과물을 여는 것으로 시작합니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '하네스 I · 규칙과 기억',
    standfirst: '규칙 파일 하나로 세 도구를 같은 방향으로 움직인다. 차시 순서대로 쌓이니 건너뛰지 마세요.',
    rules: [
      ['요청은 4요소로', '목표 · 맥락 · 제약 · 완료 기준을 넣어 요청하세요.'],
      ['직접 확인한다', 'AI가 "완료"라고 해도 화면 · 테스트 · 로그로 직접 확인하세요.'],
      ['작게 커밋한다', '기능 하나가 끝날 때마다 커밋하세요. 잘못되면 바로 돌아올 수 있습니다.']
    ],
    parts: [
      {
        pn: '36차시', h: '하네스란 무엇인가', time: '09:00–09:50 · 세 도구 공통',
        lede: '엔진과 고삐 · 계기판 · 안전벨트',
        missions: [
          { n: 1, h: '하네스란 무엇인가', body: `
      <ul>
        <li>5일차 실패를 다시 보기</li>
        <li>하네스의 4요소: 규칙 · 권한 · 도구 · 검증</li>
        <li>오늘부터 8일차까지의 지도</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '37차시', h: '규칙 파일 세 가지', time: '10:00–10:50 · 세 도구 공통',
        lede: 'CLAUDE.md · GEMINI.md · AGENTS.md',
        missions: [
          { n: 2, h: '규칙 파일 세 가지', body: `
      <ul>
        <li>파일이 읽히는 위치와 순서</li>
        <li>전역 규칙과 프로젝트 규칙</li>
        <li>세 파일 구조 비교</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '38차시', h: '규칙 하나로 세 도구', time: '11:00–11:50 · 세 도구 공통',
        lede: 'AGENTS.md를 공통 규칙으로',
        missions: [
          { n: 3, h: '규칙 하나로 세 도구', body: `
      <ul>
        <li>AGENTS.md에 공통 규칙 쓰기</li>
        <li>다른 두 파일에서 연결하기</li>
        <li>세 도구가 같은 규칙을 따르는지 확인</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '39차시', h: '좋은 규칙과 나쁜 규칙', time: '12:00–12:50 · 세 도구 공통',
        lede: '구체적이고 검증 가능한 지시',
        missions: [
          { n: 4, h: '좋은 규칙과 나쁜 규칙', body: `
      <ul>
        <li>"깔끔하게" 대신 무엇을 어떻게</li>
        <li>금지 사항과 이유</li>
        <li>규칙은 짧을수록 잘 지켜진다</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '40차시', h: '권한 설계', time: '13:50–14:40 · 세 도구 공통',
        lede: '허용 목록과 차단 목록',
        missions: [
          { n: 5, h: '권한 설계', body: `
      <ul>
        <li>settings.json · config.toml 등 설정 파일</li>
        <li>허용할 명령 · 막을 명령</li>
        <li>프로젝트 설정과 개인 설정 나누기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '41차시', h: '메모리', time: '14:50–15:40 · 세 도구 공통',
        lede: '세션이 바뀌어도 이어지는 지식',
        missions: [
          { n: 6, h: '메모리', body: `
      <ul>
        <li>세 도구의 메모리 방식 비교</li>
        <li>무엇을 기억시키고 무엇은 안 하나</li>
        <li>오래된 기억 정리</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '42차시', h: '실습: 규칙 적용 전후 비교', time: '15:50–16:40 · 세 도구 공통',
        lede: '누적 프로젝트에 하네스 1단계',
        missions: [
          { n: 7, h: '실습: 규칙 적용 전후 비교', body: `
      <ul>
        <li>공통 규칙 파일 작성</li>
        <li>같은 요청을 규칙 전 · 후로</li>
        <li>달라진 점 기록</li>
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
      ['TODO', '이 날 자주 나오는 오류를 추가하세요', '']
    ],
    checklist: [
      'CLAUDE.md · GEMINI.md · AGENTS.md를 구분하고 읽히는 위치를 설명할 수 있다',
      'AGENTS.md를 공통 규칙으로 두고 세 도구에서 모두 쓰게 할 수 있다',
      '검증 가능한 규칙을 구체적으로 쓸 수 있다',
      '권한과 메모리를 설정 파일로 관리할 수 있다',
      '오늘 결과물을 커밋하고 push했다'
    ]
  },

  quizTitle: 'Day 6 · 하네스 I · 규칙과 기억 퀴즈',
  // TODO 문항을 늘려 주세요. 형식은 README 참고
  quiz: [
    {
      "q": "Codex CLI가 기본으로 읽는 프로젝트 규칙 파일은?",
      "o": [
        "AGENTS.md",
        "CLAUDE.md",
        "GEMINI.md",
        "README.md"
      ],
      "a": 0,
      "e": "Claude Code는 CLAUDE.md, Gemini CLI는 GEMINI.md, Codex CLI는 AGENTS.md를 읽습니다."
    },
    {
      "q": "다음 중 <strong>검증 가능한</strong> 규칙은?",
      "o": [
        "커밋 전에 npm test가 통과해야 한다",
        "코드를 깔끔하게 써라",
        "좋은 코드를 써라",
        "신경 써서 작업해라"
      ],
      "a": 0,
      "e": "지켰는지 아닌지 확인할 수 있어야 좋은 규칙입니다."
    },
    {
      "q": "세 도구에 같은 규칙을 적용하는 방법으로 알맞은 것은?",
      "o": [
        "공통 규칙을 AGENTS.md에 두고 다른 두 파일에서 연결",
        "세 파일에 서로 다른 규칙을 쓴다",
        "규칙 없이 매번 말로 설명",
        "README에만 적는다"
      ],
      "a": 0,
      "e": "규칙을 한 곳에 두면 고칠 때도 한 곳만 고치면 됩니다."
    }
  ]
};
