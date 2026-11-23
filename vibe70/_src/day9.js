/* Day 9 · 종합 프로젝트 설계와 구현
   이 파일은 교안 "틀"입니다. TODO 표시된 곳(슬라이드 본문, 나레이션, 실습 단계)을 채워 나가세요.
   고친 뒤 vibe70 폴더에서:  node _src/build.js 9  */
module.exports = {
  day: 9,
  title: '종합 프로젝트 설계와 구현',
  theme: '팀의 하네스를 먼저 설계하고, 그 위에서 만든다',

  openingNar: `9일차입니다. 오늘의 주제는 종합 프로젝트 설계와 구현입니다. 팀의 하네스를 먼저 설계하고, 그 위에서 만든다.`,

  goals: [
    ['팀 프로젝트의', '요구사항과 화면을 문서로 정할 수 있다'],
    ['팀 공통 하네스를', '규칙 · 명령 · 훅 · 테스트로 설계할 수 있다'],
    ['세 도구에', '역할을 나눠 배치할 수 있다'],
    ['핵심 기능을', '하네스 안에서 구현할 수 있다']
  ],
  goalsNar: `오늘 끝났을 때 할 수 있어야 하는 것은 4가지입니다. 팀 프로젝트의 요구사항과 화면을 문서로 정하는 것, 팀 공통 하네스를 규칙 · 명령 · 훅 · 테스트로 설계하는 것, 세 도구에 역할을 나눠 배치하는 것, 핵심 기능을 하네스 안에서 구현하는 것입니다.`,

  // 하루 일곱 차시. no = 과정 전체 차시 번호
  blocks: [
    { no: 57, time: '09:00–09:50', title: '팀 구성과 주제 선정', desc: '세 도구 공통' },
    { no: 58, time: '10:00–10:50', title: '요구사항과 화면 설계', desc: '세 도구 공통' },
    { no: 59, time: '11:00–11:50', title: '팀 하네스 설계', desc: '세 도구 공통' },
    { no: 60, time: '12:00–12:50', title: '구현 1-1', desc: '세 도구 공통' },
    { no: 61, time: '13:50–14:40', title: '구현 1-2', desc: '세 도구 공통' },
    { no: 62, time: '14:50–15:40', title: '구현 1-3', desc: '세 도구 공통' },
    { no: 63, time: '15:50–16:40', title: '구현 1-4', desc: '세 도구 공통' }
  ],
  blocksNar: `오늘은 일곱 차시입니다. 오전 네 차시, 점심 뒤 세 차시로 진행합니다.`,

  slides: [
    { section: true, eb: '57차시 · 09:00–09:50 · 세 도구 공통', h: '팀 구성과 주제 선정',
      sub: '학과 안내 챗봇 · 실습실 예약 · 출결 대시보드',
      nar: `57차시, 팀 구성과 주제 선정입니다. 학과 안내 챗봇 · 실습실 예약 · 출결 대시보드.` },

    { eb: '57차시 · Key Points', h: '팀 구성과 주제 선정',
      sub: '학과 안내 챗봇 · 실습실 예약 · 출결 대시보드',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">팀 구성</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">주제 후보 비교</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">범위 정하기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 팀 구성, 주제 후보 비교, 범위 정하기.` },

    { section: true, eb: '58차시 · 10:00–10:50 · 세 도구 공통', h: '요구사항과 화면 설계',
      sub: '무엇을 만들지 글로 먼저',
      nar: `58차시, 요구사항과 화면 설계입니다. 무엇을 만들지 글로 먼저.` },

    { eb: '58차시 · Key Points', h: '요구사항과 화면 설계',
      sub: '무엇을 만들지 글로 먼저',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">요구사항 문서</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">화면 스케치</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">AI에게 빠진 점 묻기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 요구사항 문서, 화면 스케치, AI에게 빠진 점 묻기.` },

    { section: true, eb: '59차시 · 11:00–11:50 · 세 도구 공통', h: '팀 하네스 설계',
      sub: '공통 AGENTS.md · 명령 · 훅 · 테스트',
      nar: `59차시, 팀 하네스 설계입니다. 공통 AGENTS.md · 명령 · 훅 · 테스트.` },

    { eb: '59차시 · Key Points', h: '팀 하네스 설계',
      sub: '공통 AGENTS.md · 명령 · 훅 · 테스트',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">팀 규칙 합의</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">도구별 역할 배치 (구현 · 리뷰 · 문서와 검색)</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">저장소 세팅</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 팀 규칙 합의, 도구별 역할 배치 (구현 · 리뷰 · 문서와 검색), 저장소 세팅.` },

    { section: true, eb: '60차시 · 12:00–12:50 · 세 도구 공통', h: '구현 1-1',
      sub: '핵심 기능 시작',
      nar: `60차시, 구현 1-1입니다. 핵심 기능 시작.` },

    { eb: '60차시 · Key Points', h: '구현 1-1',
      sub: '핵심 기능 시작',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">기능 나누기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">워크트리로 병렬 작업</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">첫 PR</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 기능 나누기, 워크트리로 병렬 작업, 첫 PR.` },

    { section: true, eb: '61차시 · 13:50–14:40 · 세 도구 공통', h: '구현 1-2',
      sub: '핵심 기능 계속',
      nar: `61차시, 구현 1-2입니다. 핵심 기능 계속.` },

    { eb: '61차시 · Key Points', h: '구현 1-2',
      sub: '핵심 기능 계속',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">교차 리뷰</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">CI 확인</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">병합</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 교차 리뷰, CI 확인, 병합.` },

    { section: true, eb: '62차시 · 14:50–15:40 · 세 도구 공통', h: '구현 1-3',
      sub: '데이터와 AI 기능',
      nar: `62차시, 구현 1-3입니다. 데이터와 AI 기능.` },

    { eb: '62차시 · Key Points', h: '구현 1-3',
      sub: '데이터와 AI 기능',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">데이터 저장</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">LLM 기능 연결</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">테스트 추가</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 데이터 저장, LLM 기능 연결, 테스트 추가.` },

    { section: true, eb: '63차시 · 15:50–16:40 · 세 도구 공통', h: '구현 1-4',
      sub: '중간 점검',
      nar: `63차시, 구현 1-4입니다. 중간 점검.` },

    { eb: '63차시 · Key Points', h: '구현 1-4',
      sub: '중간 점검',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">팀별 진행 공유</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">막힌 곳 정리</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">내일 계획</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 팀별 진행 공유, 막힌 곳 정리, 내일 계획.` }
  ],

  assignment: {
    title: '팀 설계서와 중간 결과',
    lede: '요구사항, 하네스 설계, 오늘까지의 구현을 정리합니다.',
    subtitle: '각 항목마다 결과 화면 캡처와 사용한 요청문(프롬프트)을 함께 붙일 것',
    items: [
      '요구사항 문서와 화면 설계',
      '팀 하네스 설계서 (규칙 · 명령 · 훅 · 테스트 · 도구 배치)',
      '오늘 병합한 PR 목록',
      '내일 남은 일'
    ],
    note: 'TODO 채점 기준. 결과물이 동작하는지, 그리고 어떻게 확인했는지를 함께 봅니다.',
    nar: `오늘의 과제는 팀 설계서와 중간 결과입니다. 요구사항, 하네스 설계, 오늘까지의 구현을 정리합니다.` },

  wrap: {
    done: '팀 구성과 주제 선정 · 요구사항과 화면 설계 · 팀 하네스 설계',
    next: '내일 · Day 10 — 완성 · 발표 · 회고',
    nextDesc: '도구는 바뀌어도 남는 원리를 정리한다',
    nar: `오늘 수고하셨습니다. 내일은 완성 · 발표 · 회고입니다. 오늘 마지막에 커밋하고 배포까지 해 두세요. 내일 첫 시간은 오늘 결과물을 여는 것으로 시작합니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '종합 프로젝트 설계와 구현',
    standfirst: '팀의 하네스를 먼저 설계하고, 그 위에서 만든다. 차시 순서대로 쌓이니 건너뛰지 마세요.',
    rules: [
      ['요청은 4요소로', '목표 · 맥락 · 제약 · 완료 기준을 넣어 요청하세요.'],
      ['직접 확인한다', 'AI가 "완료"라고 해도 화면 · 테스트 · 로그로 직접 확인하세요.'],
      ['작게 커밋한다', '기능 하나가 끝날 때마다 커밋하세요. 잘못되면 바로 돌아올 수 있습니다.']
    ],
    parts: [
      {
        pn: '57차시', h: '팀 구성과 주제 선정', time: '09:00–09:50 · 세 도구 공통',
        lede: '학과 안내 챗봇 · 실습실 예약 · 출결 대시보드',
        missions: [
          { n: 1, h: '팀 구성과 주제 선정', body: `
      <ul>
        <li>팀 구성</li>
        <li>주제 후보 비교</li>
        <li>범위 정하기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '58차시', h: '요구사항과 화면 설계', time: '10:00–10:50 · 세 도구 공통',
        lede: '무엇을 만들지 글로 먼저',
        missions: [
          { n: 2, h: '요구사항과 화면 설계', body: `
      <ul>
        <li>요구사항 문서</li>
        <li>화면 스케치</li>
        <li>AI에게 빠진 점 묻기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '59차시', h: '팀 하네스 설계', time: '11:00–11:50 · 세 도구 공통',
        lede: '공통 AGENTS.md · 명령 · 훅 · 테스트',
        missions: [
          { n: 3, h: '팀 하네스 설계', body: `
      <ul>
        <li>팀 규칙 합의</li>
        <li>도구별 역할 배치 (구현 · 리뷰 · 문서와 검색)</li>
        <li>저장소 세팅</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '60차시', h: '구현 1-1', time: '12:00–12:50 · 세 도구 공통',
        lede: '핵심 기능 시작',
        missions: [
          { n: 4, h: '구현 1-1', body: `
      <ul>
        <li>기능 나누기</li>
        <li>워크트리로 병렬 작업</li>
        <li>첫 PR</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '61차시', h: '구현 1-2', time: '13:50–14:40 · 세 도구 공통',
        lede: '핵심 기능 계속',
        missions: [
          { n: 5, h: '구현 1-2', body: `
      <ul>
        <li>교차 리뷰</li>
        <li>CI 확인</li>
        <li>병합</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '62차시', h: '구현 1-3', time: '14:50–15:40 · 세 도구 공통',
        lede: '데이터와 AI 기능',
        missions: [
          { n: 6, h: '구현 1-3', body: `
      <ul>
        <li>데이터 저장</li>
        <li>LLM 기능 연결</li>
        <li>테스트 추가</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '63차시', h: '구현 1-4', time: '15:50–16:40 · 세 도구 공통',
        lede: '중간 점검',
        missions: [
          { n: 7, h: '구현 1-4', body: `
      <ul>
        <li>팀별 진행 공유</li>
        <li>막힌 곳 정리</li>
        <li>내일 계획</li>
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
      '팀 프로젝트의 요구사항과 화면을 문서로 정할 수 있다',
      '팀 공통 하네스를 규칙 · 명령 · 훅 · 테스트로 설계할 수 있다',
      '세 도구에 역할을 나눠 배치할 수 있다',
      '핵심 기능을 하네스 안에서 구현할 수 있다',
      '오늘 결과물을 커밋하고 push했다'
    ]
  },

  quizTitle: 'Day 9 · 종합 프로젝트 설계와 구현 퀴즈',
  // TODO 문항을 늘려 주세요. 형식은 README 참고
  quiz: [
    {
      "q": "팀 프로젝트에서 구현보다 하네스 설계를 먼저 하는 이유는?",
      "o": [
        "여러 사람과 여러 AI가 같은 규칙과 검사 아래에서 일하게 하려고",
        "시간을 끌려고",
        "발표 자료를 늘리려고",
        "코드를 덜 쓰려고"
      ],
      "a": 0,
      "e": "규칙과 검사가 먼저 있어야 사람마다, 도구마다 결과가 들쭉날쭉하지 않습니다."
    },
    {
      "q": "세 도구에 역할을 나누는 예로 알맞은 것은?",
      "o": [
        "구현은 A, 리뷰는 B, 문서와 검색은 C",
        "세 도구 모두 같은 파일을 동시에 수정",
        "한 도구만 쓰고 나머지는 삭제",
        "도구마다 다른 저장소 사용"
      ],
      "a": 0,
      "e": "역할을 나누되 같은 파일을 동시에 고치지 않게 하는 것이 핵심입니다."
    },
    {
      "q": "팀 공통 규칙을 두는 파일로 이 과정에서 권장한 것은? (직접 입력)",
      "t": true,
      "acc": [
        "agents.md"
      ],
      "ans": "AGENTS.md",
      "e": "특정 도구에 묶이지 않는 공통 규칙 파일입니다."
    }
  ]
};
