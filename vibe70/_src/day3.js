/* Day 3 · 바이브 코딩 실전
   이 파일은 교안 "틀"입니다. TODO 표시된 곳(슬라이드 본문, 나레이션, 실습 단계)을 채워 나가세요.
   고친 뒤 vibe70 폴더에서:  node _src/build.js 3  */
module.exports = {
  day: 3,
  title: '바이브 코딩 실전',
  theme: '오늘 시작한 프로젝트를 8일차까지 계속 키워 간다',

  openingNar: `3일차입니다. 오늘의 주제는 바이브 코딩 실전입니다. 오늘 시작한 프로젝트를 8일차까지 계속 키워 간다.`,

  goals: [
    ['누적 프로젝트의', '주제와 기능 목록을 정할 수 있다'],
    ['데이터 저장과 API를', 'AI에게 요청해 붙일 수 있다'],
    ['버그를', '재현 → 원인 → 수정 순서로 고칠 수 있다'],
    ['주력 도구가 막혔을 때', '다른 도구로 문제를 풀 수 있다']
  ],
  goalsNar: `오늘 끝났을 때 할 수 있어야 하는 것은 4가지입니다. 누적 프로젝트의 주제와 기능 목록을 정하는 것, 데이터 저장과 API를 AI에게 요청해 붙일 수 있다, 버그를 재현 → 원인 → 수정 순서로 고칠 수 있다, 주력 도구가 막혔을 때 다른 도구로 문제를 풀 수 있다입니다.`,

  // 하루 일곱 차시. no = 과정 전체 차시 번호
  blocks: [
    { no: 15, time: '09:00–09:50', title: '누적 프로젝트 시작', desc: '세 도구 공통' },
    { no: 16, time: '10:00–10:50', title: '데이터 저장', desc: '세 도구 공통' },
    { no: 17, time: '11:00–11:50', title: '공개 API 불러오기', desc: 'Gemini CLI' },
    { no: 18, time: '12:00–12:50', title: '화면 늘려 가기', desc: '세 도구 공통' },
    { no: 19, time: '13:50–14:40', title: '버그 사냥', desc: '세 도구 공통' },
    { no: 20, time: '14:50–15:40', title: '다른 도구에게 물어보기', desc: '세 도구 공통' },
    { no: 21, time: '15:50–16:40', title: '중간 배포와 짝 리뷰', desc: '세 도구 공통' }
  ],
  blocksNar: `오늘은 일곱 차시입니다. 오전 네 차시, 점심 뒤 세 차시로 진행합니다.`,

  slides: [
    { section: true, eb: '15차시 · 09:00–09:50 · 세 도구 공통', h: '누적 프로젝트 시작',
      sub: '주제 정하기와 주력 도구 고르기',
      nar: `15차시, 누적 프로젝트 시작입니다. 주제 정하기와 주력 도구 고르기.` },

    { eb: '15차시 · Key Points', h: '누적 프로젝트 시작',
      sub: '주제 정하기와 주력 도구 고르기',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">할 일 관리 · 퀴즈 · 가계부 중 택1</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">기능 목록 작성</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">1~2일차 경험으로 주력 도구 선택</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 할 일 관리 · 퀴즈 · 가계부 중 택1, 기능 목록 작성, 1~2일차 경험으로 주력 도구 선택.` },

    { section: true, eb: '16차시 · 10:00–10:50 · 세 도구 공통', h: '데이터 저장',
      sub: 'JSON과 localStorage',
      nar: `16차시, 데이터 저장입니다. JSON과 localStorage.` },

    { eb: '16차시 · Key Points', h: '데이터 저장',
      sub: 'JSON과 localStorage',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">새로고침해도 남는 데이터</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">데이터 구조를 먼저 정하기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">내보내기 · 가져오기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 새로고침해도 남는 데이터, 데이터 구조를 먼저 정하기, 내보내기 · 가져오기.` },

    { section: true, eb: '17차시 · 11:00–11:50 · Gemini CLI', h: '공개 API 불러오기',
      sub: '바깥 데이터 붙이기',
      nar: `17차시, 공개 API 불러오기입니다. 바깥 데이터 붙이기.` },

    { eb: '17차시 · Key Points', h: '공개 API 불러오기',
      sub: '바깥 데이터 붙이기',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">날씨 · 환율 같은 공개 API</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">Gemini CLI 웹 검색으로 API 문서 찾기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">불러오기 실패 처리</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 날씨 · 환율 같은 공개 API, Gemini CLI 웹 검색으로 API 문서 찾기, 불러오기 실패 처리.` },

    { section: true, eb: '18차시 · 12:00–12:50 · 세 도구 공통', h: '화면 늘려 가기',
      sub: '상태 관리와 화면 구성',
      nar: `18차시, 화면 늘려 가기입니다. 상태 관리와 화면 구성.` },

    { eb: '18차시 · Key Points', h: '화면 늘려 가기',
      sub: '상태 관리와 화면 구성',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">화면이 여러 개가 될 때</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">반응형 · 다크 모드</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">접근성 요청하기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 화면이 여러 개가 될 때, 반응형 · 다크 모드, 접근성 요청하기.` },

    { section: true, eb: '19차시 · 13:50–14:40 · 세 도구 공통', h: '버그 사냥',
      sub: '재현 → 원인 → 수정',
      nar: `19차시, 버그 사냥입니다. 재현 → 원인 → 수정.` },

    { eb: '19차시 · Key Points', h: '버그 사냥',
      sub: '재현 → 원인 → 수정',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">재현 방법부터 적기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">AI에게 원인을 먼저 설명하게 하기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">고친 뒤 다시 재현해 확인</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 재현 방법부터 적기, AI에게 원인을 먼저 설명하게 하기, 고친 뒤 다시 재현해 확인.` },

    { section: true, eb: '20차시 · 14:50–15:40 · 세 도구 공통', h: '다른 도구에게 물어보기',
      sub: '막혔을 때 두 번째 의견',
      nar: `20차시, 다른 도구에게 물어보기입니다. 막혔을 때 두 번째 의견.` },

    { eb: '20차시 · Key Points', h: '다른 도구에게 물어보기',
      sub: '막혔을 때 두 번째 의견',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">같은 문제를 다른 도구에 넘기기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">맥락을 넘겨주는 법</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">답이 다를 때 판단하기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 같은 문제를 다른 도구에 넘기기, 맥락을 넘겨주는 법, 답이 다를 때 판단하기.` },

    { section: true, eb: '21차시 · 15:50–16:40 · 세 도구 공통', h: '중간 배포와 짝 리뷰',
      sub: '서로의 앱을 써 보고 피드백',
      nar: `21차시, 중간 배포와 짝 리뷰입니다. 서로의 앱을 써 보고 피드백.` },

    { eb: '21차시 · Key Points', h: '중간 배포와 짝 리뷰',
      sub: '서로의 앱을 써 보고 피드백',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">배포하고 주소 공유</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">짝의 앱에서 버그 찾기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">피드백을 다음 요청으로 바꾸기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 배포하고 주소 공유, 짝의 앱에서 버그 찾기, 피드백을 다음 요청으로 바꾸기.` }
  ],

  assignment: {
    title: '누적 프로젝트 1차 배포',
    lede: '주제와 기능 목록을 정하고 첫 버전을 배포합니다.',
    subtitle: '각 항목마다 결과 화면 캡처와 사용한 요청문(프롬프트)을 함께 붙일 것',
    items: [
      '프로젝트 주제와 기능 목록',
      '주력 도구와 고른 이유',
      '1차 배포 주소',
      '버그 하나를 고친 과정 (재현 → 원인 → 수정)'
    ],
    note: 'TODO 채점 기준. 결과물이 동작하는지, 그리고 어떻게 확인했는지를 함께 봅니다.',
    nar: `오늘의 과제는 누적 프로젝트 1차 배포입니다. 주제와 기능 목록을 정하고 첫 버전을 배포합니다.` },

  wrap: {
    done: '누적 프로젝트 시작 · 데이터 저장 · 공개 API 불러오기 · 화면 늘려 가기 · 버그 사냥',
    next: '내일 · Day 4 — 서버와 AI 기능 붙이기',
    nextDesc: '누적 프로젝트에 서버와 LLM을 얹는다',
    nar: `오늘 수고하셨습니다. 내일은 서버와 AI 기능 붙이기입니다. 오늘 마지막에 커밋하고 배포까지 해 두세요. 내일 첫 시간은 오늘 결과물을 여는 것으로 시작합니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '바이브 코딩 실전',
    standfirst: '오늘 시작한 프로젝트를 8일차까지 계속 키워 간다. 차시 순서대로 쌓이니 건너뛰지 마세요.',
    rules: [
      ['요청은 4요소로', '목표 · 맥락 · 제약 · 완료 기준을 넣어 요청하세요.'],
      ['직접 확인한다', 'AI가 "완료"라고 해도 화면 · 테스트 · 로그로 직접 확인하세요.'],
      ['작게 커밋한다', '기능 하나가 끝날 때마다 커밋하세요. 잘못되면 바로 돌아올 수 있습니다.']
    ],
    parts: [
      {
        pn: '15차시', h: '누적 프로젝트 시작', time: '09:00–09:50 · 세 도구 공통',
        lede: '주제 정하기와 주력 도구 고르기',
        missions: [
          { n: 1, h: '누적 프로젝트 시작', body: `
      <ul>
        <li>할 일 관리 · 퀴즈 · 가계부 중 택1</li>
        <li>기능 목록 작성</li>
        <li>1~2일차 경험으로 주력 도구 선택</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '16차시', h: '데이터 저장', time: '10:00–10:50 · 세 도구 공통',
        lede: 'JSON과 localStorage',
        missions: [
          { n: 2, h: '데이터 저장', body: `
      <ul>
        <li>새로고침해도 남는 데이터</li>
        <li>데이터 구조를 먼저 정하기</li>
        <li>내보내기 · 가져오기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '17차시', h: '공개 API 불러오기', time: '11:00–11:50 · Gemini CLI',
        lede: '바깥 데이터 붙이기',
        missions: [
          { n: 3, h: '공개 API 불러오기', body: `
      <ul>
        <li>날씨 · 환율 같은 공개 API</li>
        <li>Gemini CLI 웹 검색으로 API 문서 찾기</li>
        <li>불러오기 실패 처리</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '18차시', h: '화면 늘려 가기', time: '12:00–12:50 · 세 도구 공통',
        lede: '상태 관리와 화면 구성',
        missions: [
          { n: 4, h: '화면 늘려 가기', body: `
      <ul>
        <li>화면이 여러 개가 될 때</li>
        <li>반응형 · 다크 모드</li>
        <li>접근성 요청하기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '19차시', h: '버그 사냥', time: '13:50–14:40 · 세 도구 공통',
        lede: '재현 → 원인 → 수정',
        missions: [
          { n: 5, h: '버그 사냥', body: `
      <ul>
        <li>재현 방법부터 적기</li>
        <li>AI에게 원인을 먼저 설명하게 하기</li>
        <li>고친 뒤 다시 재현해 확인</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '20차시', h: '다른 도구에게 물어보기', time: '14:50–15:40 · 세 도구 공통',
        lede: '막혔을 때 두 번째 의견',
        missions: [
          { n: 6, h: '다른 도구에게 물어보기', body: `
      <ul>
        <li>같은 문제를 다른 도구에 넘기기</li>
        <li>맥락을 넘겨주는 법</li>
        <li>답이 다를 때 판단하기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '21차시', h: '중간 배포와 짝 리뷰', time: '15:50–16:40 · 세 도구 공통',
        lede: '서로의 앱을 써 보고 피드백',
        missions: [
          { n: 7, h: '중간 배포와 짝 리뷰', body: `
      <ul>
        <li>배포하고 주소 공유</li>
        <li>짝의 앱에서 버그 찾기</li>
        <li>피드백을 다음 요청으로 바꾸기</li>
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
      '누적 프로젝트의 주제와 기능 목록을 정할 수 있다',
      '데이터 저장과 API를 AI에게 요청해 붙일 수 있다',
      '버그를 재현 → 원인 → 수정 순서로 고칠 수 있다',
      '주력 도구가 막혔을 때 다른 도구로 문제를 풀 수 있다',
      '오늘 결과물을 커밋하고 push했다'
    ]
  },

  quizTitle: 'Day 3 · 바이브 코딩 실전 퀴즈',
  // TODO 문항을 늘려 주세요. 형식은 README 참고
  quiz: [
    {
      "q": "브라우저를 새로고침해도 데이터가 남도록 하는 가장 간단한 방법은?",
      "o": [
        "localStorage에 저장",
        "변수에만 저장",
        "콘솔에 출력",
        "CSS에 저장"
      ],
      "a": 0,
      "e": "localStorage는 브라우저에 데이터를 남겨 둡니다. 서버 없이도 쓸 수 있는 첫 단계입니다."
    },
    {
      "q": "버그를 고치는 올바른 순서는?",
      "o": [
        "재현 → 원인 → 수정 → 다시 확인",
        "수정 → 재현 → 원인",
        "원인 추측 → 바로 배포",
        "새로 만들기"
      ],
      "a": 0,
      "e": "다시 일어나게 만들 수 있어야 고쳐졌는지도 확인할 수 있습니다."
    },
    {
      "q": "주력 도구가 같은 실수를 반복할 때 해 볼 만한 것은?",
      "o": [
        "맥락을 정리해 다른 도구에 물어본다",
        "같은 요청을 열 번 반복한다",
        "프로젝트를 지운다",
        "오류를 무시한다"
      ],
      "a": 0,
      "e": "다른 모델은 다른 방식으로 문제를 봅니다. 맥락(목표, 오류, 시도한 것)을 함께 넘겨야 합니다."
    }
  ]
};
