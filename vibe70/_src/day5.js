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
    ['AI에게', '테스트를 먼저 쓰게 하고 결과로 검증할 수 있다']
  ],
  goalsNar: `오늘 끝났을 때 할 수 있어야 하는 것은 4가지입니다. AI가 틀리는 방식을 환각 · 오래된 지식 · 자신감 있는 오답으로 구분하는 것, 맥락 창이 꽉 찰 때 압축과 새 세션으로 대응하는 것, 보안 기본을 키 · 입력 검증 · 샌드박스로 점검하는 것, AI에게 테스트를 먼저 쓰게 하고 결과로 검증하는 것입니다.`,

  // 하루 일곱 차시. no = 과정 전체 차시 번호
  blocks: [
    { no: 29, time: '09:00–09:50', title: 'AI가 틀리는 방식', desc: '세 도구 공통' },
    { no: 30, time: '10:00–10:50', title: '맥락 창 이해하기', desc: '세 도구 공통' },
    { no: 31, time: '11:00–11:50', title: '보안 기본', desc: '세 도구 공통' },
    { no: 32, time: '12:00–12:50', title: '저작권 · 라이선스 · 윤리', desc: '세 도구 공통' },
    { no: 33, time: '13:50–14:40', title: '테스트 입문', desc: '세 도구 공통' },
    { no: 34, time: '14:50–15:40', title: '검증 습관', desc: '세 도구 공통' },
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

    { section: true, eb: '34차시 · 14:50–15:40 · 세 도구 공통', h: '검증 습관',
      sub: '직접 확인하는 체크리스트',
      nar: `34차시, 검증 습관입니다. 직접 확인하는 체크리스트.` },

    { eb: '34차시 · Key Points', h: '검증 습관',
      sub: '직접 확인하는 체크리스트',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">"됐습니다"를 확인하는 법</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">화면 · 로그 · 테스트로 확인</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">확인 체크리스트 만들기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. "됐습니다"를 확인하는 법, 화면 · 로그 · 테스트로 확인, 확인 체크리스트 만들기.` },

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
      '"다음엔 규칙으로 막고 싶은 실수" 목록'
    ],
    note: 'TODO 채점 기준. 결과물이 동작하는지, 그리고 어떻게 확인했는지를 함께 봅니다.',
    nar: `오늘의 과제는 한계 사례 보고서입니다. AI가 틀린 장면을 모으고, 테스트로 막은 사례를 남깁니다.` },

  wrap: {
    done: 'AI가 틀리는 방식 · 맥락 창 이해하기 · 보안 기본 · 저작권 · 라이선스 · 윤리 · 테스트 입문',
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
        pn: '34차시', h: '검증 습관', time: '14:50–15:40 · 세 도구 공통',
        lede: '직접 확인하는 체크리스트',
        missions: [
          { n: 6, h: '검증 습관', body: `
      <ul>
        <li>"됐습니다"를 확인하는 법</li>
        <li>화면 · 로그 · 테스트로 확인</li>
        <li>확인 체크리스트 만들기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
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
      ['TODO', '이 날 자주 나오는 오류를 추가하세요', '']
    ],
    checklist: [
      'AI가 틀리는 방식을 환각 · 오래된 지식 · 자신감 있는 오답으로 구분할 수 있다',
      '맥락 창이 꽉 찰 때 압축과 새 세션으로 대응할 수 있다',
      '보안 기본을 키 · 입력 검증 · 샌드박스로 점검할 수 있다',
      'AI에게 테스트를 먼저 쓰게 하고 결과로 검증할 수 있다',
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
    }
  ]
};
