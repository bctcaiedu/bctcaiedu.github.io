/* Day 1 · AI 코딩 이해와 세 도구 설치
   이 파일은 교안 "틀"입니다. TODO 표시된 곳(슬라이드 본문, 나레이션, 실습 단계)을 채워 나가세요.
   고친 뒤 vibe70 폴더에서:  node _src/build.js 1  */
module.exports = {
  day: 1,
  title: 'AI 코딩 이해와 세 도구 설치',
  theme: '세 개의 에이전트를 내 컴퓨터에 들이고, 같은 요청을 세 번 해 본다',

  openingNar: `1일차입니다. 오늘의 주제는 AI 코딩 이해와 세 도구 설치입니다. 세 개의 에이전트를 내 컴퓨터에 들이고, 같은 요청을 세 번 해 본다.`,

  goals: [
    ['AI 코딩의 흐름을', '자동완성 → 채팅 → 에이전트로 설명할 수 있다'],
    ['바이브 코딩과 하네스의 차이를', '한 문장으로 말할 수 있다'],
    ['세 도구를', '설치하고 로그인해 첫 대화를 할 수 있다'],
    ['첫 결과물을', 'Git으로 저장하고 GitHub Pages로 배포할 수 있다']
  ],
  goalsNar: `오늘 끝났을 때 할 수 있어야 하는 것은 4가지입니다. AI 코딩의 흐름을 자동완성 → 채팅 → 에이전트로 설명하는 것, 바이브 코딩과 하네스의 차이를 한 문장으로 말하는 것, 세 도구를 설치하고 로그인해 첫 대화를 하는 것, 첫 결과물을 Git으로 저장하고 GitHub Pages로 배포하는 것입니다.`,

  // 하루 일곱 차시. no = 과정 전체 차시 번호
  blocks: [
    { no: 1, time: '09:00–09:50', title: '오리엔테이션', desc: '세 도구 공통' },
    { no: 2, time: '10:00–10:50', title: '터미널 기초와 Node.js 설치', desc: '세 도구 공통' },
    { no: 3, time: '11:00–11:50', title: 'Claude Code 설치와 첫 대화', desc: 'Claude Code' },
    { no: 4, time: '12:00–12:50', title: 'Gemini CLI 설치와 첫 대화', desc: 'Gemini CLI' },
    { no: 5, time: '13:50–14:40', title: 'Codex CLI 설치와 첫 대화', desc: 'Codex CLI' },
    { no: 6, time: '14:50–15:40', title: '같은 요청, 세 가지 결과', desc: '세 도구 공통' },
    { no: 7, time: '15:50–16:40', title: 'Git 기초와 GitHub Pages 첫 배포', desc: '세 도구 공통' }
  ],
  blocksNar: `오늘은 일곱 차시입니다. 오전 네 차시, 점심 뒤 세 차시로 진행합니다.`,

  slides: [
    { section: true, eb: '1차시 · 09:00–09:50 · 세 도구 공통', h: '오리엔테이션',
      sub: 'AI 코딩의 흐름과 과정 지도',
      nar: `1차시, 오리엔테이션입니다. AI 코딩의 흐름과 과정 지도.` },

    { eb: '1차시 · Key Points', h: '오리엔테이션',
      sub: 'AI 코딩의 흐름과 과정 지도',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">자동완성 → 채팅 → 에이전트</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">바이브 코딩이란</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">하네스란: 모델이 엔진이면 하네스는 고삐</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 자동완성 → 채팅 → 에이전트, 바이브 코딩이란, 하네스란: 모델이 엔진이면 하네스는 고삐.` },

    { section: true, eb: '2차시 · 10:00–10:50 · 세 도구 공통', h: '터미널 기초와 Node.js 설치',
      sub: '에이전트가 사는 곳, 터미널',
      nar: `2차시, 터미널 기초와 Node.js 설치입니다. 에이전트가 사는 곳, 터미널.` },

    { eb: '2차시 · Key Points', h: '터미널 기초와 Node.js 설치',
      sub: '에이전트가 사는 곳, 터미널',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">폴더 이동 · 파일 보기 · 명령 실행</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">Node.js · npm 설치 확인</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">PowerShell과 Git Bash</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 폴더 이동 · 파일 보기 · 명령 실행, Node.js · npm 설치 확인, PowerShell과 Git Bash.` },

    { section: true, eb: '3차시 · 11:00–11:50 · Claude Code', h: 'Claude Code 설치와 첫 대화',
      sub: 'Anthropic의 코딩 에이전트',
      nar: `3차시, Claude Code 설치와 첫 대화입니다. Anthropic의 코딩 에이전트.` },

    { eb: '3차시 · Key Points', h: 'Claude Code 설치와 첫 대화',
      sub: 'Anthropic의 코딩 에이전트',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">설치와 로그인</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">첫 대화와 승인 화면 읽기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">/help · /clear 맛보기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 설치와 로그인, 첫 대화와 승인 화면 읽기, /help · /clear 맛보기.` },

    { section: true, eb: '4차시 · 12:00–12:50 · Gemini CLI', h: 'Gemini CLI 설치와 첫 대화',
      sub: 'Google의 코딩 에이전트',
      nar: `4차시, Gemini CLI 설치와 첫 대화입니다. Google의 코딩 에이전트.` },

    { eb: '4차시 · Key Points', h: 'Gemini CLI 설치와 첫 대화',
      sub: 'Google의 코딩 에이전트',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">설치와 Google 계정 로그인</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">무료 사용량 확인</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">첫 대화와 도구 승인</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 설치와 Google 계정 로그인, 무료 사용량 확인, 첫 대화와 도구 승인.` },

    { section: true, eb: '5차시 · 13:50–14:40 · Codex CLI', h: 'Codex CLI 설치와 첫 대화',
      sub: 'OpenAI의 코딩 에이전트',
      nar: `5차시, Codex CLI 설치와 첫 대화입니다. OpenAI의 코딩 에이전트.` },

    { eb: '5차시 · Key Points', h: 'Codex CLI 설치와 첫 대화',
      sub: 'OpenAI의 코딩 에이전트',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">설치와 ChatGPT 계정 로그인</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">승인 모드 확인</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">첫 대화</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 설치와 ChatGPT 계정 로그인, 승인 모드 확인, 첫 대화.` },

    { section: true, eb: '6차시 · 14:50–15:40 · 세 도구 공통', h: '같은 요청, 세 가지 결과',
      sub: '"자기소개 페이지 만들어줘"를 세 도구에 똑같이',
      nar: `6차시, 같은 요청, 세 가지 결과입니다. "자기소개 페이지 만들어줘"를 세 도구에 똑같이.` },

    { eb: '6차시 · Key Points', h: '같은 요청, 세 가지 결과',
      sub: '"자기소개 페이지 만들어줘"를 세 도구에 똑같이',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">같은 프롬프트로 세 폴더에 생성</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">결과 화면 · 코드 · 걸린 시간 비교</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">비교표 작성</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 같은 프롬프트로 세 폴더에 생성, 결과 화면 · 코드 · 걸린 시간 비교, 비교표 작성.` },

    { section: true, eb: '7차시 · 15:50–16:40 · 세 도구 공통', h: 'Git 기초와 GitHub Pages 첫 배포',
      sub: '커밋은 저장 지점이다',
      nar: `7차시, Git 기초와 GitHub Pages 첫 배포입니다. 커밋은 저장 지점이다.` },

    { eb: '7차시 · Key Points', h: 'Git 기초와 GitHub Pages 첫 배포',
      sub: '커밋은 저장 지점이다',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">init · add · commit · 되돌리기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">GitHub 저장소 만들고 push</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">Pages로 내 주소 붙이기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. init · add · commit · 되돌리기, GitHub 저장소 만들고 push, Pages로 내 주소 붙이기.` }
  ],

  assignment: {
    title: '세 도구 비교표와 첫 배포',
    lede: '세 도구에 같은 요청을 한 결과를 비교하고, 그중 하나를 배포합니다.',
    subtitle: '각 항목마다 결과 화면 캡처와 사용한 요청문(프롬프트)을 함께 붙일 것',
    items: [
      '세 도구 설치 확인 화면 캡처 (버전 출력)',
      '같은 프롬프트로 만든 세 결과물 캡처',
      '비교표: 결과 품질 · 걸린 시간 · 묻는 방식',
      '배포한 GitHub Pages 주소'
    ],
    note: 'TODO 채점 기준. 결과물이 동작하는지, 그리고 어떻게 확인했는지를 함께 봅니다.',
    nar: `오늘의 과제는 세 도구 비교표와 첫 배포입니다. 세 도구에 같은 요청을 한 결과를 비교하고, 그중 하나를 배포합니다.` },

  wrap: {
    done: '오리엔테이션 · 터미널 기초와 Node.js 설치 · Claude Code 설치와 첫 대화 · Gemini CLI 설치와 첫 대화 · Codex CLI 설치와 첫 대화',
    next: '내일 · Day 2 — 바이브 코딩 기초',
    nextDesc: '좋은 요청 하나가 좋은 결과물 하나를 만든다',
    nar: `오늘 수고하셨습니다. 내일은 바이브 코딩 기초입니다. 오늘 마지막에 커밋하고 배포까지 해 두세요. 내일 첫 시간은 오늘 결과물을 여는 것으로 시작합니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: 'AI 코딩 이해와 세 도구 설치',
    standfirst: '세 개의 에이전트를 내 컴퓨터에 들이고, 같은 요청을 세 번 해 본다. 차시 순서대로 쌓이니 건너뛰지 마세요.',
    rules: [
      ['요청은 4요소로', '목표 · 맥락 · 제약 · 완료 기준을 넣어 요청하세요.'],
      ['직접 확인한다', 'AI가 "완료"라고 해도 화면 · 테스트 · 로그로 직접 확인하세요.'],
      ['작게 커밋한다', '기능 하나가 끝날 때마다 커밋하세요. 잘못되면 바로 돌아올 수 있습니다.']
    ],
    parts: [
      {
        pn: '1차시', h: '오리엔테이션', time: '09:00–09:50 · 세 도구 공통',
        lede: 'AI 코딩의 흐름과 과정 지도',
        missions: [
          { n: 1, h: '오리엔테이션', body: `
      <ul>
        <li>자동완성 → 채팅 → 에이전트</li>
        <li>바이브 코딩이란</li>
        <li>하네스란: 모델이 엔진이면 하네스는 고삐</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '2차시', h: '터미널 기초와 Node.js 설치', time: '10:00–10:50 · 세 도구 공통',
        lede: '에이전트가 사는 곳, 터미널',
        missions: [
          { n: 2, h: '터미널 기초와 Node.js 설치', body: `
      <ul>
        <li>폴더 이동 · 파일 보기 · 명령 실행</li>
        <li>Node.js · npm 설치 확인</li>
        <li>PowerShell과 Git Bash</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '3차시', h: 'Claude Code 설치와 첫 대화', time: '11:00–11:50 · Claude Code',
        lede: 'Anthropic의 코딩 에이전트',
        missions: [
          { n: 3, h: 'Claude Code 설치와 첫 대화', body: `
      <ul>
        <li>설치와 로그인</li>
        <li>첫 대화와 승인 화면 읽기</li>
        <li>/help · /clear 맛보기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '4차시', h: 'Gemini CLI 설치와 첫 대화', time: '12:00–12:50 · Gemini CLI',
        lede: 'Google의 코딩 에이전트',
        missions: [
          { n: 4, h: 'Gemini CLI 설치와 첫 대화', body: `
      <ul>
        <li>설치와 Google 계정 로그인</li>
        <li>무료 사용량 확인</li>
        <li>첫 대화와 도구 승인</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '5차시', h: 'Codex CLI 설치와 첫 대화', time: '13:50–14:40 · Codex CLI',
        lede: 'OpenAI의 코딩 에이전트',
        missions: [
          { n: 5, h: 'Codex CLI 설치와 첫 대화', body: `
      <ul>
        <li>설치와 ChatGPT 계정 로그인</li>
        <li>승인 모드 확인</li>
        <li>첫 대화</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '6차시', h: '같은 요청, 세 가지 결과', time: '14:50–15:40 · 세 도구 공통',
        lede: '"자기소개 페이지 만들어줘"를 세 도구에 똑같이',
        missions: [
          { n: 6, h: '같은 요청, 세 가지 결과', body: `
      <ul>
        <li>같은 프롬프트로 세 폴더에 생성</li>
        <li>결과 화면 · 코드 · 걸린 시간 비교</li>
        <li>비교표 작성</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '7차시', h: 'Git 기초와 GitHub Pages 첫 배포', time: '15:50–16:40 · 세 도구 공통',
        lede: '커밋은 저장 지점이다',
        missions: [
          { n: 7, h: 'Git 기초와 GitHub Pages 첫 배포', body: `
      <ul>
        <li>init · add · commit · 되돌리기</li>
        <li>GitHub 저장소 만들고 push</li>
        <li>Pages로 내 주소 붙이기</li>
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
      'AI 코딩의 흐름을 자동완성 → 채팅 → 에이전트로 설명할 수 있다',
      '바이브 코딩과 하네스의 차이를 한 문장으로 말할 수 있다',
      '세 도구를 설치하고 로그인해 첫 대화를 할 수 있다',
      '첫 결과물을 Git으로 저장하고 GitHub Pages로 배포할 수 있다',
      '오늘 결과물을 커밋하고 push했다'
    ]
  },

  quizTitle: 'Day 1 · AI 코딩 이해와 세 도구 설치 퀴즈',
  // TODO 문항을 늘려 주세요. 형식은 README 참고
  quiz: [
    {
      "q": "바이브 코딩을 가장 잘 설명한 것은?",
      "o": [
        "원하는 결과를 자연어로 설명해 AI가 코드를 만들게 하는 방식",
        "코드를 한 줄씩 직접 타이핑하는 방식",
        "AI 모델을 직접 학습시키는 방식",
        "음악을 들으며 코딩하는 방식"
      ],
      "a": 0,
      "e": "무엇을 원하는지 말로 설명하고, 결과를 보며 고쳐 나가는 개발 방식입니다."
    },
    {
      "q": "하네스(harness)의 역할로 알맞은 것은?",
      "o": [
        "AI가 매번 같은 품질로 일하도록 규칙·도구·검증을 묶어 주는 틀",
        "AI 모델의 크기를 키우는 것",
        "인터넷 속도를 높이는 것",
        "코드를 압축하는 것"
      ],
      "a": 0,
      "e": "모델이 엔진이라면 하네스는 고삐, 계기판, 안전벨트입니다. 6일차부터 본격적으로 다룹니다."
    },
    {
      "q": "Google이 만든 터미널 코딩 에이전트는?",
      "o": [
        "Gemini CLI",
        "Codex CLI",
        "Claude Code",
        "GitHub Pages"
      ],
      "a": 0,
      "e": "Claude Code는 Anthropic, Codex CLI는 OpenAI가 만들었습니다."
    },
    {
      "q": "작업 중간 상태를 저장 지점으로 남기는 Git 명령은? (직접 입력)",
      "t": true,
      "acc": [
        "git commit",
        "commit"
      ],
      "ans": "git commit",
      "e": "git add로 담고 git commit으로 저장 지점을 만듭니다. 잘못되면 이 지점으로 돌아올 수 있습니다."
    }
  ]
};
