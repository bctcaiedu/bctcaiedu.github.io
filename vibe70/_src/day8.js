/* Day 8 · 하네스 III · 도구와 다중 에이전트
   이 파일은 교안 "틀"입니다. TODO 표시된 곳(슬라이드 본문, 나레이션, 실습 단계)을 채워 나가세요.
   고친 뒤 vibe70 폴더에서:  node _src/build.js 8  */
module.exports = {
  day: 8,
  title: '하네스 III · 도구와 다중 에이전트',
  theme: '도구를 연결하고, 에이전트끼리 서로 검토하게 한다',

  openingNar: `8일차입니다. 오늘의 주제는 하네스 III · 도구와 다중 에이전트입니다. 도구를 연결하고, 에이전트끼리 서로 검토하게 한다.`,

  goals: [
    ['MCP 서버 하나를', '세 도구에 모두 연결할 수 있다'],
    ['간단한 MCP 서버를', '직접 만들 수 있다'],
    ['워크트리로', '여러 에이전트를 동시에 돌릴 수 있다'],
    ['교차 리뷰와 CI로', 'PR마다 자동 검사를 할 수 있다']
  ],
  goalsNar: `오늘 끝났을 때 할 수 있어야 하는 것은 4가지입니다. MCP 서버 하나를 세 도구에 모두 연결하는 것, 간단한 MCP 서버를 직접 만들 수 있다, 워크트리로 여러 에이전트를 동시에 돌릴 수 있다, 교차 리뷰와 CI로 PR마다 자동 검사를 하는 것입니다.`,

  // 하루 일곱 차시. no = 과정 전체 차시 번호
  blocks: [
    { no: 50, time: '09:00–09:50', title: 'MCP 개념', desc: '세 도구 공통' },
    { no: 51, time: '10:00–10:50', title: 'MCP 서버 만들기', desc: '세 도구 공통' },
    { no: 52, time: '11:00–11:50', title: '역할 분담', desc: 'Claude Code' },
    { no: 53, time: '12:00–12:50', title: '병렬 작업', desc: '세 도구 공통' },
    { no: 54, time: '13:50–14:40', title: '교차 리뷰', desc: '세 도구 공통' },
    { no: 55, time: '14:50–15:40', title: 'CI 연동', desc: '세 도구 공통' },
    { no: 56, time: '15:50–16:40', title: '실습: PR 흐름으로 개선', desc: '세 도구 공통' }
  ],
  blocksNar: `오늘은 일곱 차시입니다. 오전 네 차시, 점심 뒤 세 차시로 진행합니다.`,

  slides: [
    { section: true, eb: '50차시 · 09:00–09:50 · 세 도구 공통', h: 'MCP 개념',
      sub: '하나의 MCP 서버를 세 도구에',
      nar: `50차시, MCP 개념입니다. 하나의 MCP 서버를 세 도구에.` },

    { eb: '50차시 · Key Points', h: 'MCP 개념',
      sub: '하나의 MCP 서버를 세 도구에',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">MCP가 해결하는 문제</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">세 도구의 MCP 설정 위치</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">브라우저 · 파일 MCP 연결</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. MCP가 해결하는 문제, 세 도구의 MCP 설정 위치, 브라우저 · 파일 MCP 연결.` },

    { section: true, eb: '51차시 · 10:00–10:50 · 세 도구 공통', h: 'MCP 서버 만들기',
      sub: '내 도구를 AI에게 주기',
      nar: `51차시, MCP 서버 만들기입니다. 내 도구를 AI에게 주기.` },

    { eb: '51차시 · Key Points', h: 'MCP 서버 만들기',
      sub: '내 도구를 AI에게 주기',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">가장 작은 MCP 서버</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">세 도구에서 호출</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">도구 설명 잘 쓰기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 가장 작은 MCP 서버, 세 도구에서 호출, 도구 설명 잘 쓰기.` },

    { section: true, eb: '52차시 · 11:00–11:50 · Claude Code', h: '역할 분담',
      sub: '서브에이전트와 세션 나누기',
      nar: `52차시, 역할 분담입니다. 서브에이전트와 세션 나누기.` },

    { eb: '52차시 · Key Points', h: '역할 분담',
      sub: '서브에이전트와 세션 나누기',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">Claude Code 서브에이전트</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">다른 도구는 세션을 나눠서</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">조사 · 구현 · 리뷰 분리</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. Claude Code 서브에이전트, 다른 도구는 세션을 나눠서, 조사 · 구현 · 리뷰 분리.` },

    { section: true, eb: '53차시 · 12:00–12:50 · 세 도구 공통', h: '병렬 작업',
      sub: 'Git 워크트리로 동시에',
      nar: `53차시, 병렬 작업입니다. Git 워크트리로 동시에.` },

    { eb: '53차시 · Key Points', h: '병렬 작업',
      sub: 'Git 워크트리로 동시에',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">워크트리 만들기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">세 도구를 각 워크트리에서</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">결과 합치기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 워크트리 만들기, 세 도구를 각 워크트리에서, 결과 합치기.` },

    { section: true, eb: '54차시 · 13:50–14:40 · 세 도구 공통', h: '교차 리뷰',
      sub: 'Claude가 짜고, Codex가 보고, Gemini가 테스트',
      nar: `54차시, 교차 리뷰입니다. Claude가 짜고, Codex가 보고, Gemini가 테스트.` },

    { eb: '54차시 · Key Points', h: '교차 리뷰',
      sub: 'Claude가 짜고, Codex가 보고, Gemini가 테스트',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">리뷰 요청문 쓰기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">리뷰 결과 판단하기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">서로 다른 모델의 장점</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 리뷰 요청문 쓰기, 리뷰 결과 판단하기, 서로 다른 모델의 장점.` },

    { section: true, eb: '55차시 · 14:50–15:40 · 세 도구 공통', h: 'CI 연동',
      sub: 'GitHub Actions로 PR마다',
      nar: `55차시, CI 연동입니다. GitHub Actions로 PR마다.` },

    { eb: '55차시 · Key Points', h: 'CI 연동',
      sub: 'GitHub Actions로 PR마다',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">PR과 Actions</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">AI 리뷰 자동 실행</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">세 회사 GitHub 연동 비교</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. PR과 Actions, AI 리뷰 자동 실행, 세 회사 GitHub 연동 비교.` },

    { section: true, eb: '56차시 · 15:50–16:40 · 세 도구 공통', h: '실습: PR 흐름으로 개선',
      sub: '누적 프로젝트 마무리',
      nar: `56차시, 실습: PR 흐름으로 개선입니다. 누적 프로젝트 마무리.` },

    { eb: '56차시 · Key Points', h: '실습: PR 흐름으로 개선',
      sub: '누적 프로젝트 마무리',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">기능 하나를 PR로</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">교차 리뷰 받고 반영</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">CI 통과 후 병합</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 기능 하나를 PR로, 교차 리뷰 받고 반영, CI 통과 후 병합.` }
  ],

  assignment: {
    title: 'PR · 교차 리뷰 · CI',
    lede: '누적 프로젝트를 PR 흐름으로 개선하고 기록을 남깁니다.',
    subtitle: '각 항목마다 결과 화면 캡처와 사용한 요청문(프롬프트)을 함께 붙일 것',
    items: [
      'MCP 설정 화면 (도구 2개 이상)',
      '직접 만든 MCP 서버 코드와 호출 결과',
      '교차 리뷰가 달린 PR 주소',
      'CI 통과 화면'
    ],
    note: 'TODO 채점 기준. 결과물이 동작하는지, 그리고 어떻게 확인했는지를 함께 봅니다.',
    nar: `오늘의 과제는 PR · 교차 리뷰 · CI입니다. 누적 프로젝트를 PR 흐름으로 개선하고 기록을 남깁니다.` },

  wrap: {
    done: 'MCP 개념 · MCP 서버 만들기 · 역할 분담 · 병렬 작업 · 교차 리뷰',
    next: '내일 · Day 9 — 종합 프로젝트 설계와 구현',
    nextDesc: '팀의 하네스를 먼저 설계하고, 그 위에서 만든다',
    nar: `오늘 수고하셨습니다. 내일은 종합 프로젝트 설계와 구현입니다. 오늘 마지막에 커밋하고 배포까지 해 두세요. 내일 첫 시간은 오늘 결과물을 여는 것으로 시작합니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '하네스 III · 도구와 다중 에이전트',
    standfirst: '도구를 연결하고, 에이전트끼리 서로 검토하게 한다. 차시 순서대로 쌓이니 건너뛰지 마세요.',
    rules: [
      ['요청은 4요소로', '목표 · 맥락 · 제약 · 완료 기준을 넣어 요청하세요.'],
      ['직접 확인한다', 'AI가 "완료"라고 해도 화면 · 테스트 · 로그로 직접 확인하세요.'],
      ['작게 커밋한다', '기능 하나가 끝날 때마다 커밋하세요. 잘못되면 바로 돌아올 수 있습니다.']
    ],
    parts: [
      {
        pn: '50차시', h: 'MCP 개념', time: '09:00–09:50 · 세 도구 공통',
        lede: '하나의 MCP 서버를 세 도구에',
        missions: [
          { n: 1, h: 'MCP 개념', body: `
      <ul>
        <li>MCP가 해결하는 문제</li>
        <li>세 도구의 MCP 설정 위치</li>
        <li>브라우저 · 파일 MCP 연결</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '51차시', h: 'MCP 서버 만들기', time: '10:00–10:50 · 세 도구 공통',
        lede: '내 도구를 AI에게 주기',
        missions: [
          { n: 2, h: 'MCP 서버 만들기', body: `
      <ul>
        <li>가장 작은 MCP 서버</li>
        <li>세 도구에서 호출</li>
        <li>도구 설명 잘 쓰기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '52차시', h: '역할 분담', time: '11:00–11:50 · Claude Code',
        lede: '서브에이전트와 세션 나누기',
        missions: [
          { n: 3, h: '역할 분담', body: `
      <ul>
        <li>Claude Code 서브에이전트</li>
        <li>다른 도구는 세션을 나눠서</li>
        <li>조사 · 구현 · 리뷰 분리</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '53차시', h: '병렬 작업', time: '12:00–12:50 · 세 도구 공통',
        lede: 'Git 워크트리로 동시에',
        missions: [
          { n: 4, h: '병렬 작업', body: `
      <ul>
        <li>워크트리 만들기</li>
        <li>세 도구를 각 워크트리에서</li>
        <li>결과 합치기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '54차시', h: '교차 리뷰', time: '13:50–14:40 · 세 도구 공통',
        lede: 'Claude가 짜고, Codex가 보고, Gemini가 테스트',
        missions: [
          { n: 5, h: '교차 리뷰', body: `
      <ul>
        <li>리뷰 요청문 쓰기</li>
        <li>리뷰 결과 판단하기</li>
        <li>서로 다른 모델의 장점</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '55차시', h: 'CI 연동', time: '14:50–15:40 · 세 도구 공통',
        lede: 'GitHub Actions로 PR마다',
        missions: [
          { n: 6, h: 'CI 연동', body: `
      <ul>
        <li>PR과 Actions</li>
        <li>AI 리뷰 자동 실행</li>
        <li>세 회사 GitHub 연동 비교</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '56차시', h: '실습: PR 흐름으로 개선', time: '15:50–16:40 · 세 도구 공통',
        lede: '누적 프로젝트 마무리',
        missions: [
          { n: 7, h: '실습: PR 흐름으로 개선', body: `
      <ul>
        <li>기능 하나를 PR로</li>
        <li>교차 리뷰 받고 반영</li>
        <li>CI 통과 후 병합</li>
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
      'MCP 서버 하나를 세 도구에 모두 연결할 수 있다',
      '간단한 MCP 서버를 직접 만들 수 있다',
      '워크트리로 여러 에이전트를 동시에 돌릴 수 있다',
      '교차 리뷰와 CI로 PR마다 자동 검사를 할 수 있다',
      '오늘 결과물을 커밋하고 push했다'
    ]
  },

  quizTitle: 'Day 8 · 하네스 III · 도구와 다중 에이전트 퀴즈',
  // TODO 문항을 늘려 주세요. 형식은 README 참고
  quiz: [
    {
      "q": "MCP의 역할로 알맞은 것은?",
      "o": [
        "외부 도구와 데이터를 AI 에이전트에 연결하는 공통 방식",
        "AI 모델을 학습시키는 방법",
        "코드 압축 형식",
        "웹페이지 디자인 규칙"
      ],
      "a": 0,
      "e": "MCP 서버 하나를 만들면 세 도구 모두에서 쓸 수 있습니다."
    },
    {
      "q": "한 저장소에서 여러 브랜치를 동시에 다른 폴더로 꺼내 쓰는 Git 기능은? (직접 입력)",
      "t": true,
      "acc": [
        "worktree",
        "git worktree",
        "워크트리"
      ],
      "ans": "worktree",
      "e": "워크트리마다 에이전트를 하나씩 붙이면 서로 파일을 덮어쓰지 않고 병렬로 일할 수 있습니다."
    },
    {
      "q": "다른 회사 모델에게 리뷰를 맡기는 이유는?",
      "o": [
        "같은 모델은 자기 실수를 놓치기 쉬워서",
        "더 빨라서",
        "항상 무료라서",
        "리뷰가 필요 없어서"
      ],
      "a": 0,
      "e": "다른 관점이 다른 실수를 잡습니다. 사람 팀의 코드 리뷰와 같은 원리입니다."
    }
  ]
};
