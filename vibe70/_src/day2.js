/* Day 2 · 바이브 코딩 기초
   이 파일은 교안 "틀"입니다. TODO 표시된 곳(슬라이드 본문, 나레이션, 실습 단계)을 채워 나가세요.
   고친 뒤 vibe70 폴더에서:  node _src/build.js 2  */
module.exports = {
  day: 2,
  title: '바이브 코딩 기초',
  theme: '좋은 요청 하나가 좋은 결과물 하나를 만든다',

  openingNar: `2일차입니다. 오늘의 주제는 바이브 코딩 기초입니다. 좋은 요청 하나가 좋은 결과물 하나를 만든다.`,

  goals: [
    ['좋은 요청의 4요소를', '목표 · 맥락 · 제약 · 완료 기준으로 쓸 수 있다'],
    ['오류와 화면을', '그대로 전달해 고쳐 달라고 할 수 있다'],
    ['계획을 먼저 받고', '확인한 뒤 실행하게 할 수 있다'],
    ['세 도구의 승인 모드를', '상황에 맞게 고를 수 있다']
  ],
  goalsNar: `오늘 끝났을 때 할 수 있어야 하는 것은 4가지입니다. 좋은 요청의 4요소를 목표 · 맥락 · 제약 · 완료 기준으로 쓸 수 있다, 오류와 화면을 그대로 전달해 고쳐 달라고 하는 것, 계획을 먼저 받고 확인한 뒤 실행하게 하는 것, 세 도구의 승인 모드를 상황에 맞게 고를 수 있다입니다.`,

  // 하루 일곱 차시. no = 과정 전체 차시 번호
  blocks: [
    { no: 8, time: '09:00–09:50', title: '좋은 요청의 4요소', desc: '세 도구 공통' },
    { no: 9, time: '10:00–10:50', title: '고쳐 달라고 하기', desc: '세 도구 공통' },
    { no: 10, time: '11:00–11:50', title: '계획 먼저', desc: '세 도구 공통' },
    { no: 11, time: '12:00–12:50', title: '작게 쪼개기', desc: '세 도구 공통' },
    { no: 12, time: '13:50–14:40', title: '승인 모드 비교', desc: '세 도구 공통' },
    { no: 13, time: '14:50–15:40', title: '실습 1: 미니 웹앱 만들기', desc: '세 도구 공통' },
    { no: 14, time: '15:50–16:40', title: '실습 2: 미니 웹앱 만들기', desc: '세 도구 공통' }
  ],
  blocksNar: `오늘은 일곱 차시입니다. 오전 네 차시, 점심 뒤 세 차시로 진행합니다.`,

  slides: [
    { section: true, eb: '8차시 · 09:00–09:50 · 세 도구 공통', h: '좋은 요청의 4요소',
      sub: '목표 · 맥락 · 제약 · 완료 기준',
      nar: `8차시, 좋은 요청의 4요소입니다. 목표 · 맥락 · 제약 · 완료 기준.` },

    { eb: '8차시 · Key Points', h: '좋은 요청의 4요소',
      sub: '목표 · 맥락 · 제약 · 완료 기준',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">나쁜 요청과 좋은 요청 비교</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">완료 기준이 없으면 생기는 일</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">요청 템플릿 만들기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 나쁜 요청과 좋은 요청 비교, 완료 기준이 없으면 생기는 일, 요청 템플릿 만들기.` },

    { section: true, eb: '9차시 · 10:00–10:50 · 세 도구 공통', h: '고쳐 달라고 하기',
      sub: '스크린샷과 오류 메시지 전달',
      nar: `9차시, 고쳐 달라고 하기입니다. 스크린샷과 오류 메시지 전달.` },

    { eb: '9차시 · Key Points', h: '고쳐 달라고 하기',
      sub: '스크린샷과 오류 메시지 전달',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">오류 메시지는 통째로 붙인다</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">세 도구의 이미지 입력 방법</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">"이상해요" 대신 무엇이 어떻게</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 오류 메시지는 통째로 붙인다, 세 도구의 이미지 입력 방법, "이상해요" 대신 무엇이 어떻게.` },

    { section: true, eb: '10차시 · 11:00–11:50 · 세 도구 공통', h: '계획 먼저',
      sub: '만들기 전에 설계를 확인받기',
      nar: `10차시, 계획 먼저입니다. 만들기 전에 설계를 확인받기.` },

    { eb: '10차시 · Key Points', h: '계획 먼저',
      sub: '만들기 전에 설계를 확인받기',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">Claude Code 플랜 모드</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">Gemini · Codex에 "계획만 먼저" 요청</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">계획을 고치는 대화</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. Claude Code 플랜 모드, Gemini · Codex에 "계획만 먼저" 요청, 계획을 고치는 대화.` },

    { section: true, eb: '11차시 · 12:00–12:50 · 세 도구 공통', h: '작게 쪼개기',
      sub: '만들고 → 확인하고 → 커밋하는 리듬',
      nar: `11차시, 작게 쪼개기입니다. 만들고 → 확인하고 → 커밋하는 리듬.` },

    { eb: '11차시 · Key Points', h: '작게 쪼개기',
      sub: '만들고 → 확인하고 → 커밋하는 리듬',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">기능 하나 = 커밋 하나</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">잘못되면 바로 되돌리기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">커밋 메시지도 AI에게</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 기능 하나 = 커밋 하나, 잘못되면 바로 되돌리기, 커밋 메시지도 AI에게.` },

    { section: true, eb: '12차시 · 13:50–14:40 · 세 도구 공통', h: '승인 모드 비교',
      sub: '묻고 실행 · 자동 실행 · 읽기 전용',
      nar: `12차시, 승인 모드 비교입니다. 묻고 실행 · 자동 실행 · 읽기 전용.` },

    { eb: '12차시 · Key Points', h: '승인 모드 비교',
      sub: '묻고 실행 · 자동 실행 · 읽기 전용',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">세 도구의 권한·승인 설정</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">자동 실행이 위험한 순간</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">수업에서 쓸 기본값 정하기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 세 도구의 권한·승인 설정, 자동 실행이 위험한 순간, 수업에서 쓸 기본값 정하기.` },

    { section: true, eb: '13차시 · 14:50–15:40 · 세 도구 공통', h: '실습 1: 미니 웹앱 만들기',
      sub: '계산기는 Claude, 타이머는 Gemini',
      nar: `13차시, 실습 1: 미니 웹앱 만들기입니다. 계산기는 Claude, 타이머는 Gemini.` },

    { eb: '13차시 · Key Points', h: '실습 1: 미니 웹앱 만들기',
      sub: '계산기는 Claude, 타이머는 Gemini',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">계산기 — Claude Code</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">타이머 — Gemini CLI</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">각각 커밋하고 배포</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 계산기 — Claude Code, 타이머 — Gemini CLI, 각각 커밋하고 배포.` },

    { section: true, eb: '14차시 · 15:50–16:40 · 세 도구 공통', h: '실습 2: 미니 웹앱 만들기',
      sub: '명언 카드는 Codex, 그리고 비교',
      nar: `14차시, 실습 2: 미니 웹앱 만들기입니다. 명언 카드는 Codex, 그리고 비교.` },

    { eb: '14차시 · Key Points', h: '실습 2: 미니 웹앱 만들기',
      sub: '명언 카드는 Codex, 그리고 비교',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">명언 카드 — Codex CLI</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">세 앱 서로 바꿔 써 보기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">도구별 느낌 정리</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 명언 카드 — Codex CLI, 세 앱 서로 바꿔 써 보기, 도구별 느낌 정리.` }
  ],

  assignment: {
    title: '미니 웹앱 3종 배포',
    lede: '도구 하나씩 맡겨 만든 세 앱을 배포하고 요청문을 함께 제출합니다.',
    subtitle: '각 항목마다 결과 화면 캡처와 사용한 요청문(프롬프트)을 함께 붙일 것',
    items: [
      '세 앱의 배포 주소',
      '각 앱을 만들 때 쓴 첫 요청문 (4요소 표시)',
      '고쳐 달라고 한 대화 1개 캡처',
      '도구별 장단점 3줄'
    ],
    note: 'TODO 채점 기준. 결과물이 동작하는지, 그리고 어떻게 확인했는지를 함께 봅니다.',
    nar: `오늘의 과제는 미니 웹앱 3종 배포입니다. 도구 하나씩 맡겨 만든 세 앱을 배포하고 요청문을 함께 제출합니다.` },

  wrap: {
    done: '좋은 요청의 4요소 · 고쳐 달라고 하기 · 계획 먼저 · 작게 쪼개기 · 승인 모드 비교',
    next: '내일 · Day 3 — 바이브 코딩 실전',
    nextDesc: '오늘 시작한 프로젝트를 8일차까지 계속 키워 간다',
    nar: `오늘 수고하셨습니다. 내일은 바이브 코딩 실전입니다. 오늘 마지막에 커밋하고 배포까지 해 두세요. 내일 첫 시간은 오늘 결과물을 여는 것으로 시작합니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '바이브 코딩 기초',
    standfirst: '좋은 요청 하나가 좋은 결과물 하나를 만든다. 차시 순서대로 쌓이니 건너뛰지 마세요.',
    rules: [
      ['요청은 4요소로', '목표 · 맥락 · 제약 · 완료 기준을 넣어 요청하세요.'],
      ['직접 확인한다', 'AI가 "완료"라고 해도 화면 · 테스트 · 로그로 직접 확인하세요.'],
      ['작게 커밋한다', '기능 하나가 끝날 때마다 커밋하세요. 잘못되면 바로 돌아올 수 있습니다.']
    ],
    parts: [
      {
        pn: '8차시', h: '좋은 요청의 4요소', time: '09:00–09:50 · 세 도구 공통',
        lede: '목표 · 맥락 · 제약 · 완료 기준',
        missions: [
          { n: 1, h: '좋은 요청의 4요소', body: `
      <ul>
        <li>나쁜 요청과 좋은 요청 비교</li>
        <li>완료 기준이 없으면 생기는 일</li>
        <li>요청 템플릿 만들기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '9차시', h: '고쳐 달라고 하기', time: '10:00–10:50 · 세 도구 공통',
        lede: '스크린샷과 오류 메시지 전달',
        missions: [
          { n: 2, h: '고쳐 달라고 하기', body: `
      <ul>
        <li>오류 메시지는 통째로 붙인다</li>
        <li>세 도구의 이미지 입력 방법</li>
        <li>"이상해요" 대신 무엇이 어떻게</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '10차시', h: '계획 먼저', time: '11:00–11:50 · 세 도구 공통',
        lede: '만들기 전에 설계를 확인받기',
        missions: [
          { n: 3, h: '계획 먼저', body: `
      <ul>
        <li>Claude Code 플랜 모드</li>
        <li>Gemini · Codex에 "계획만 먼저" 요청</li>
        <li>계획을 고치는 대화</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '11차시', h: '작게 쪼개기', time: '12:00–12:50 · 세 도구 공통',
        lede: '만들고 → 확인하고 → 커밋하는 리듬',
        missions: [
          { n: 4, h: '작게 쪼개기', body: `
      <ul>
        <li>기능 하나 = 커밋 하나</li>
        <li>잘못되면 바로 되돌리기</li>
        <li>커밋 메시지도 AI에게</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '12차시', h: '승인 모드 비교', time: '13:50–14:40 · 세 도구 공통',
        lede: '묻고 실행 · 자동 실행 · 읽기 전용',
        missions: [
          { n: 5, h: '승인 모드 비교', body: `
      <ul>
        <li>세 도구의 권한·승인 설정</li>
        <li>자동 실행이 위험한 순간</li>
        <li>수업에서 쓸 기본값 정하기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '13차시', h: '실습 1: 미니 웹앱 만들기', time: '14:50–15:40 · 세 도구 공통',
        lede: '계산기는 Claude, 타이머는 Gemini',
        missions: [
          { n: 6, h: '실습 1: 미니 웹앱 만들기', body: `
      <ul>
        <li>계산기 — Claude Code</li>
        <li>타이머 — Gemini CLI</li>
        <li>각각 커밋하고 배포</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '14차시', h: '실습 2: 미니 웹앱 만들기', time: '15:50–16:40 · 세 도구 공통',
        lede: '명언 카드는 Codex, 그리고 비교',
        missions: [
          { n: 7, h: '실습 2: 미니 웹앱 만들기', body: `
      <ul>
        <li>명언 카드 — Codex CLI</li>
        <li>세 앱 서로 바꿔 써 보기</li>
        <li>도구별 느낌 정리</li>
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
      '좋은 요청의 4요소를 목표 · 맥락 · 제약 · 완료 기준으로 쓸 수 있다',
      '오류와 화면을 그대로 전달해 고쳐 달라고 할 수 있다',
      '계획을 먼저 받고 확인한 뒤 실행하게 할 수 있다',
      '세 도구의 승인 모드를 상황에 맞게 고를 수 있다',
      '오늘 결과물을 커밋하고 push했다'
    ]
  },

  quizTitle: 'Day 2 · 바이브 코딩 기초 퀴즈',
  // TODO 문항을 늘려 주세요. 형식은 README 참고
  quiz: [
    {
      "q": "좋은 요청의 4요소에 들어가지 <strong>않는</strong> 것은?",
      "o": [
        "AI의 기분",
        "목표",
        "제약",
        "완료 기준"
      ],
      "a": 0,
      "e": "목표 · 맥락 · 제약 · 완료 기준입니다. 완료 기준이 있어야 AI가 언제 멈출지 압니다."
    },
    {
      "q": "오류를 고쳐 달라고 할 때 가장 좋은 방법은?",
      "o": [
        "오류 메시지 전체와 재현 방법을 그대로 붙인다",
        "\"안 돼요\"라고만 쓴다",
        "오류 첫 줄만 요약해 쓴다",
        "새 대화를 열고 처음부터 다시 만든다"
      ],
      "a": 0,
      "e": "메시지 전체와 어떻게 하면 나는지가 있어야 원인을 정확히 찾습니다."
    },
    {
      "q": "큰 기능을 만들기 전에 설계를 먼저 확인받는 Claude Code 기능은? (직접 입력)",
      "t": true,
      "acc": [
        "플랜 모드",
        "plan mode",
        "플랜모드",
        "계획 모드"
      ],
      "ans": "플랜 모드",
      "e": "플랜 모드에서는 파일을 바꾸지 않고 계획만 보여 줍니다. 다른 도구에서는 \"계획만 먼저 보여줘\"로 요청합니다."
    },
    {
      "q": "\"작게 쪼개기\" 리듬으로 알맞은 것은?",
      "o": [
        "기능 하나 만들고 확인하고 커밋",
        "모든 기능을 한 번에 요청하고 마지막에 커밋",
        "커밋 없이 계속 진행",
        "확인 없이 바로 배포"
      ],
      "a": 0,
      "e": "작게 나눠야 문제가 생겼을 때 어디서 생겼는지 알고 되돌릴 수 있습니다."
    }
  ]
};
