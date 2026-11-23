/* Day 7 · 하네스 II · 재사용과 자동화
   이 파일은 교안 "틀"입니다. TODO 표시된 곳(슬라이드 본문, 나레이션, 실습 단계)을 채워 나가세요.
   고친 뒤 vibe70 폴더에서:  node _src/build.js 7  */
module.exports = {
  day: 7,
  title: '하네스 II · 재사용과 자동화',
  theme: '반복되는 요청은 명령으로, 반복되는 검사는 훅으로',

  openingNar: `7일차입니다. 오늘의 주제는 하네스 II · 재사용과 자동화입니다. 반복되는 요청은 명령으로, 반복되는 검사는 훅으로.`,

  goals: [
    ['자주 하는 요청을', '커스텀 명령과 스킬로 묶을 수 있다'],
    ['훅으로', '포맷 · 린트 · 위험 명령 차단을 자동화할 수 있다'],
    ['테스트 통과를', '완료 조건으로 강제할 수 있다'],
    ['비대화형 실행으로', '스크립트 안에서 AI를 부를 수 있다']
  ],
  goalsNar: `오늘 끝났을 때 할 수 있어야 하는 것은 4가지입니다. 자주 하는 요청을 커스텀 명령과 스킬로 묶을 수 있다, 훅으로 포맷 · 린트 · 위험 명령 차단을 자동화하는 것, 테스트 통과를 완료 조건으로 강제하는 것, 비대화형 실행으로 스크립트 안에서 AI를 부를 수 있다입니다.`,

  // 하루 일곱 차시. no = 과정 전체 차시 번호
  blocks: [
    { no: 43, time: '09:00–09:50', title: '사용자 정의 명령', desc: '세 도구 공통' },
    { no: 44, time: '10:00–10:50', title: '스킬', desc: '세 도구 공통' },
    { no: 45, time: '11:00–11:50', title: '훅 1: 자동 포맷과 린트', desc: 'Claude Code' },
    { no: 46, time: '12:00–12:50', title: '훅 2: 위험한 명령 차단', desc: '세 도구 공통' },
    { no: 47, time: '13:50–14:40', title: '테스트를 하네스로', desc: '세 도구 공통' },
    { no: 48, time: '14:50–15:40', title: '비대화형 실행', desc: '세 도구 공통' },
    { no: 49, time: '15:50–16:40', title: '실습: 내 개발 환경 완성', desc: '세 도구 공통' }
  ],
  blocksNar: `오늘은 일곱 차시입니다. 오전 네 차시, 점심 뒤 세 차시로 진행합니다.`,

  slides: [
    { section: true, eb: '43차시 · 09:00–09:50 · 세 도구 공통', h: '사용자 정의 명령',
      sub: '자주 하는 요청을 명령 하나로',
      nar: `43차시, 사용자 정의 명령입니다. 자주 하는 요청을 명령 하나로.` },

    { eb: '43차시 · Key Points', h: '사용자 정의 명령',
      sub: '자주 하는 요청을 명령 하나로',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">세 도구의 커스텀 슬래시 명령</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">인자 받는 명령</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">팀이 함께 쓰는 명령</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 세 도구의 커스텀 슬래시 명령, 인자 받는 명령, 팀이 함께 쓰는 명령.` },

    { section: true, eb: '44차시 · 10:00–10:50 · 세 도구 공통', h: '스킬',
      sub: '작업 절차를 재사용 가능한 지침으로',
      nar: `44차시, 스킬입니다. 작업 절차를 재사용 가능한 지침으로.` },

    { eb: '44차시 · Key Points', h: '스킬',
      sub: '작업 절차를 재사용 가능한 지침으로',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">스킬의 구조</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">도구별 지원 범위 비교</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">내 첫 스킬 만들기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 스킬의 구조, 도구별 지원 범위 비교, 내 첫 스킬 만들기.` },

    { section: true, eb: '45차시 · 11:00–11:50 · Claude Code', h: '훅 1: 자동 포맷과 린트',
      sub: '편집할 때마다 자동으로',
      nar: `45차시, 훅 1: 자동 포맷과 린트입니다. 편집할 때마다 자동으로.` },

    { eb: '45차시 · Key Points', h: '훅 1: 자동 포맷과 린트',
      sub: '편집할 때마다 자동으로',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">훅이 실행되는 시점</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">Claude Code 훅 중심 실습</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">다른 도구의 대응 기능</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 훅이 실행되는 시점, Claude Code 훅 중심 실습, 다른 도구의 대응 기능.` },

    { section: true, eb: '46차시 · 12:00–12:50 · 세 도구 공통', h: '훅 2: 위험한 명령 차단',
      sub: '커밋 전 검사',
      nar: `46차시, 훅 2: 위험한 명령 차단입니다. 커밋 전 검사.` },

    { eb: '46차시 · Key Points', h: '훅 2: 위험한 명령 차단',
      sub: '커밋 전 검사',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">위험한 명령 막기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">커밋 전 테스트 강제</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">기능이 없으면 Git pre-commit 훅으로</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 위험한 명령 막기, 커밋 전 테스트 강제, 기능이 없으면 Git pre-commit 훅으로.` },

    { section: true, eb: '47차시 · 13:50–14:40 · 세 도구 공통', h: '테스트를 하네스로',
      sub: '통과해야만 완료',
      nar: `47차시, 테스트를 하네스로입니다. 통과해야만 완료.` },

    { eb: '47차시 · Key Points', h: '테스트를 하네스로',
      sub: '통과해야만 완료',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">완료 기준을 테스트로</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">테스트 실패 시 자동으로 다시 고치게</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">세 도구 공통 적용</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 완료 기준을 테스트로, 테스트 실패 시 자동으로 다시 고치게, 세 도구 공통 적용.` },

    { section: true, eb: '48차시 · 14:50–15:40 · 세 도구 공통', h: '비대화형 실행',
      sub: 'claude -p · gemini -p · codex exec',
      nar: `48차시, 비대화형 실행입니다. claude -p · gemini -p · codex exec.` },

    { eb: '48차시 · Key Points', h: '비대화형 실행',
      sub: 'claude -p · gemini -p · codex exec',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">한 줄 명령으로 AI 부르기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">결과를 파일로 받기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">스크립트에 넣기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 한 줄 명령으로 AI 부르기, 결과를 파일로 받기, 스크립트에 넣기.` },

    { section: true, eb: '49차시 · 15:50–16:40 · 세 도구 공통', h: '실습: 내 개발 환경 완성',
      sub: '어느 도구로도 같은 검사',
      nar: `49차시, 실습: 내 개발 환경 완성입니다. 어느 도구로도 같은 검사.` },

    { eb: '49차시 · Key Points', h: '실습: 내 개발 환경 완성',
      sub: '어느 도구로도 같은 검사',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">명령 · 스킬 · 훅 묶기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">세 도구로 같은 작업 돌려 보기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">검사가 막아 준 실수 기록</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 명령 · 스킬 · 훅 묶기, 세 도구로 같은 작업 돌려 보기, 검사가 막아 준 실수 기록.` }
  ],

  assignment: {
    title: '자동화된 개발 환경',
    lede: '어느 도구를 써도 같은 검사가 도는 환경을 만듭니다.',
    subtitle: '각 항목마다 결과 화면 캡처와 사용한 요청문(프롬프트)을 함께 붙일 것',
    items: [
      '커스텀 명령 2개와 스킬 1개',
      '훅 또는 pre-commit 설정 파일',
      '검사가 실수를 막은 장면 캡처',
      '비대화형 실행 스크립트 1개'
    ],
    note: 'TODO 채점 기준. 결과물이 동작하는지, 그리고 어떻게 확인했는지를 함께 봅니다.',
    nar: `오늘의 과제는 자동화된 개발 환경입니다. 어느 도구를 써도 같은 검사가 도는 환경을 만듭니다.` },

  wrap: {
    done: '사용자 정의 명령 · 스킬 · 훅 1: 자동 포맷과 린트 · 훅 2: 위험한 명령 차단 · 테스트를 하네스로',
    next: '내일 · Day 8 — 하네스 III · 도구와 다중 에이전트',
    nextDesc: '도구를 연결하고, 에이전트끼리 서로 검토하게 한다',
    nar: `오늘 수고하셨습니다. 내일은 하네스 III · 도구와 다중 에이전트입니다. 오늘 마지막에 커밋하고 배포까지 해 두세요. 내일 첫 시간은 오늘 결과물을 여는 것으로 시작합니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '하네스 II · 재사용과 자동화',
    standfirst: '반복되는 요청은 명령으로, 반복되는 검사는 훅으로. 차시 순서대로 쌓이니 건너뛰지 마세요.',
    rules: [
      ['요청은 4요소로', '목표 · 맥락 · 제약 · 완료 기준을 넣어 요청하세요.'],
      ['직접 확인한다', 'AI가 "완료"라고 해도 화면 · 테스트 · 로그로 직접 확인하세요.'],
      ['작게 커밋한다', '기능 하나가 끝날 때마다 커밋하세요. 잘못되면 바로 돌아올 수 있습니다.']
    ],
    parts: [
      {
        pn: '43차시', h: '사용자 정의 명령', time: '09:00–09:50 · 세 도구 공통',
        lede: '자주 하는 요청을 명령 하나로',
        missions: [
          { n: 1, h: '사용자 정의 명령', body: `
      <ul>
        <li>세 도구의 커스텀 슬래시 명령</li>
        <li>인자 받는 명령</li>
        <li>팀이 함께 쓰는 명령</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '44차시', h: '스킬', time: '10:00–10:50 · 세 도구 공통',
        lede: '작업 절차를 재사용 가능한 지침으로',
        missions: [
          { n: 2, h: '스킬', body: `
      <ul>
        <li>스킬의 구조</li>
        <li>도구별 지원 범위 비교</li>
        <li>내 첫 스킬 만들기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '45차시', h: '훅 1: 자동 포맷과 린트', time: '11:00–11:50 · Claude Code',
        lede: '편집할 때마다 자동으로',
        missions: [
          { n: 3, h: '훅 1: 자동 포맷과 린트', body: `
      <ul>
        <li>훅이 실행되는 시점</li>
        <li>Claude Code 훅 중심 실습</li>
        <li>다른 도구의 대응 기능</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '46차시', h: '훅 2: 위험한 명령 차단', time: '12:00–12:50 · 세 도구 공통',
        lede: '커밋 전 검사',
        missions: [
          { n: 4, h: '훅 2: 위험한 명령 차단', body: `
      <ul>
        <li>위험한 명령 막기</li>
        <li>커밋 전 테스트 강제</li>
        <li>기능이 없으면 Git pre-commit 훅으로</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '47차시', h: '테스트를 하네스로', time: '13:50–14:40 · 세 도구 공통',
        lede: '통과해야만 완료',
        missions: [
          { n: 5, h: '테스트를 하네스로', body: `
      <ul>
        <li>완료 기준을 테스트로</li>
        <li>테스트 실패 시 자동으로 다시 고치게</li>
        <li>세 도구 공통 적용</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '48차시', h: '비대화형 실행', time: '14:50–15:40 · 세 도구 공통',
        lede: 'claude -p · gemini -p · codex exec',
        missions: [
          { n: 6, h: '비대화형 실행', body: `
      <ul>
        <li>한 줄 명령으로 AI 부르기</li>
        <li>결과를 파일로 받기</li>
        <li>스크립트에 넣기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '49차시', h: '실습: 내 개발 환경 완성', time: '15:50–16:40 · 세 도구 공통',
        lede: '어느 도구로도 같은 검사',
        missions: [
          { n: 7, h: '실습: 내 개발 환경 완성', body: `
      <ul>
        <li>명령 · 스킬 · 훅 묶기</li>
        <li>세 도구로 같은 작업 돌려 보기</li>
        <li>검사가 막아 준 실수 기록</li>
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
      '자주 하는 요청을 커스텀 명령과 스킬로 묶을 수 있다',
      '훅으로 포맷 · 린트 · 위험 명령 차단을 자동화할 수 있다',
      '테스트 통과를 완료 조건으로 강제할 수 있다',
      '비대화형 실행으로 스크립트 안에서 AI를 부를 수 있다',
      '오늘 결과물을 커밋하고 push했다'
    ]
  },

  quizTitle: 'Day 7 · 하네스 II · 재사용과 자동화 퀴즈',
  // TODO 문항을 늘려 주세요. 형식은 README 참고
  quiz: [
    {
      "q": "파일을 편집할 때마다 자동으로 포맷터를 실행하게 하는 장치는?",
      "o": [
        "훅",
        "메모리",
        "플랜 모드",
        "맥락 창"
      ],
      "a": 0,
      "e": "훅은 정해진 시점(편집 후, 명령 실행 전 등)에 자동으로 실행됩니다."
    },
    {
      "q": "도구에 훅 기능이 없을 때 커밋 전 검사를 대신하는 방법은?",
      "o": [
        "Git pre-commit 훅",
        "규칙 파일에 \"검사해 줘\"라고만 쓰기",
        "검사를 포기",
        "커밋을 하지 않기"
      ],
      "a": 0,
      "e": "부족한 기능을 다른 장치로 메우는 것 자체가 하네스 엔지니어링입니다."
    },
    {
      "q": "Codex CLI를 대화 없이 한 번만 실행하는 명령은? (직접 입력)",
      "t": true,
      "acc": [
        "codex exec"
      ],
      "ans": "codex exec",
      "e": "Claude Code는 claude -p, Gemini CLI는 gemini -p를 씁니다."
    }
  ]
};
