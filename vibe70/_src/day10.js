/* Day 10 · 완성 · 발표 · 회고
   이 파일은 교안 "틀"입니다. TODO 표시된 곳(슬라이드 본문, 나레이션, 실습 단계)을 채워 나가세요.
   고친 뒤 vibe70 폴더에서:  node _src/build.js 10  */
module.exports = {
  day: 10,
  title: '완성 · 발표 · 회고',
  theme: '도구는 바뀌어도 남는 원리를 정리한다',

  openingNar: `10일차입니다. 오늘의 주제는 완성 · 발표 · 회고입니다. 도구는 바뀌어도 남는 원리를 정리한다.`,

  goals: [
    ['팀 프로젝트를', '테스트를 통과시켜 배포할 수 있다'],
    ['하네스가 막아 준 실수를', '근거와 함께 발표할 수 있다'],
    ['도구 선택 이유를', '비교 결과로 설명할 수 있다'],
    ['수료 이후', '스스로 배울 방향을 정할 수 있다']
  ],
  goalsNar: `오늘 끝났을 때 할 수 있어야 하는 것은 4가지입니다. 팀 프로젝트를 테스트를 통과시켜 배포하는 것, 하네스가 막아 준 실수를 근거와 함께 발표하는 것, 도구 선택 이유를 비교 결과로 설명하는 것, 수료 이후 스스로 배울 방향을 정하는 것입니다.`,

  // 하루 일곱 차시. no = 과정 전체 차시 번호
  blocks: [
    { no: 64, time: '09:00–09:50', title: '구현 2-1', desc: '세 도구 공통' },
    { no: 65, time: '10:00–10:50', title: '구현 2-2', desc: '세 도구 공통' },
    { no: 66, time: '11:00–11:50', title: '구현 2-3', desc: '세 도구 공통' },
    { no: 67, time: '12:00–12:50', title: '발표 리허설', desc: '세 도구 공통' },
    { no: 68, time: '13:50–14:40', title: '최종 발표 1', desc: '세 도구 공통' },
    { no: 69, time: '14:50–15:40', title: '최종 발표 2', desc: '세 도구 공통' },
    { no: 70, time: '15:50–16:40', title: '회고', desc: '세 도구 공통' }
  ],
  blocksNar: `오늘은 일곱 차시입니다. 오전 네 차시, 점심 뒤 세 차시로 진행합니다.`,

  slides: [
    { section: true, eb: '64차시 · 09:00–09:50 · 세 도구 공통', h: '구현 2-1',
      sub: '남은 기능 마무리',
      nar: `64차시, 구현 2-1입니다. 남은 기능 마무리.` },

    { eb: '64차시 · Key Points', h: '구현 2-1',
      sub: '남은 기능 마무리',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">남은 일 목록 정리</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">우선순위 정하기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">병렬 작업</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 남은 일 목록 정리, 우선순위 정하기, 병렬 작업.` },

    { section: true, eb: '65차시 · 10:00–10:50 · 세 도구 공통', h: '구현 2-2',
      sub: '테스트와 버그 수정',
      nar: `65차시, 구현 2-2입니다. 테스트와 버그 수정.` },

    { eb: '65차시 · Key Points', h: '구현 2-2',
      sub: '테스트와 버그 수정',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">테스트 전부 통과</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">짝 팀 사용 테스트</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">버그 수정</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 테스트 전부 통과, 짝 팀 사용 테스트, 버그 수정.` },

    { section: true, eb: '66차시 · 11:00–11:50 · 세 도구 공통', h: '구현 2-3',
      sub: '배포와 문서',
      nar: `66차시, 구현 2-3입니다. 배포와 문서.` },

    { eb: '66차시 · Key Points', h: '구현 2-3',
      sub: '배포와 문서',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">최종 배포</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">README 작성</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">시연 시나리오</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 최종 배포, README 작성, 시연 시나리오.` },

    { section: true, eb: '67차시 · 12:00–12:50 · 세 도구 공통', h: '발표 리허설',
      sub: '상호 피드백',
      nar: `67차시, 발표 리허설입니다. 상호 피드백.` },

    { eb: '67차시 · Key Points', h: '발표 리허설',
      sub: '상호 피드백',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">5분 발표 연습</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">다른 팀 피드백</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">발표 다듬기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 5분 발표 연습, 다른 팀 피드백, 발표 다듬기.` },

    { section: true, eb: '68차시 · 13:50–14:40 · 세 도구 공통', h: '최종 발표 1',
      sub: '시연과 하네스 이야기',
      nar: `68차시, 최종 발표 1입니다. 시연과 하네스 이야기.` },

    { eb: '68차시 · Key Points', h: '최종 발표 1',
      sub: '시연과 하네스 이야기',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">결과물 시연</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">"우리 하네스가 막아 준 실수"</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">도구 선택 이유</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 결과물 시연, "우리 하네스가 막아 준 실수", 도구 선택 이유.` },

    { section: true, eb: '69차시 · 14:50–15:40 · 세 도구 공통', h: '최종 발표 2',
      sub: '시연과 질의응답',
      nar: `69차시, 최종 발표 2입니다. 시연과 질의응답.` },

    { eb: '69차시 · Key Points', h: '최종 발표 2',
      sub: '시연과 질의응답',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">나머지 팀 발표</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">질의응답</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">상호 평가</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 나머지 팀 발표, 질의응답, 상호 평가.` },

    { section: true, eb: '70차시 · 15:50–16:40 · 세 도구 공통', h: '회고',
      sub: '도구는 바뀌어도 남는 것',
      nar: `70차시, 회고입니다. 도구는 바뀌어도 남는 것.` },

    { eb: '70차시 · Key Points', h: '회고',
      sub: '도구는 바뀌어도 남는 것',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">규칙 · 검증 · 권한 · 도구 연결</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">사람이 할 일과 AI에게 맡길 일</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">수료 이후 학습 방향</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 규칙 · 검증 · 권한 · 도구 연결, 사람이 할 일과 AI에게 맡길 일, 수료 이후 학습 방향.` }
  ],

  assignment: {
    title: '최종 산출물',
    lede: '팀 프로젝트와 개인 회고를 제출합니다.',
    subtitle: '각 항목마다 결과 화면 캡처와 사용한 요청문(프롬프트)을 함께 붙일 것',
    items: [
      '최종 배포 주소와 저장소',
      '발표 자료',
      '팀 하네스 최종본',
      '개인 회고 (가장 크게 배운 것 · 앞으로 할 것)'
    ],
    note: 'TODO 채점 기준. 결과물이 동작하는지, 그리고 어떻게 확인했는지를 함께 봅니다.',
    nar: `오늘의 과제는 최종 산출물입니다. 팀 프로젝트와 개인 회고를 제출합니다.` },

  wrap: {
    done: '발표 리허설 · 회고',
    next: '수료를 축하합니다',
    nextDesc: '도구는 바뀌어도 규칙 · 권한 · 도구 연결 · 검증의 원리는 남습니다.',
    nar: `열흘 동안 수고하셨습니다. 도구는 계속 바뀌지만, 규칙을 쓰고 권한을 정하고 도구를 연결하고 결과를 검증하는 원리는 그대로 남습니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '완성 · 발표 · 회고',
    standfirst: '도구는 바뀌어도 남는 원리를 정리한다. 차시 순서대로 쌓이니 건너뛰지 마세요.',
    rules: [
      ['요청은 4요소로', '목표 · 맥락 · 제약 · 완료 기준을 넣어 요청하세요.'],
      ['직접 확인한다', 'AI가 "완료"라고 해도 화면 · 테스트 · 로그로 직접 확인하세요.'],
      ['작게 커밋한다', '기능 하나가 끝날 때마다 커밋하세요. 잘못되면 바로 돌아올 수 있습니다.']
    ],
    parts: [
      {
        pn: '64차시', h: '구현 2-1', time: '09:00–09:50 · 세 도구 공통',
        lede: '남은 기능 마무리',
        missions: [
          { n: 1, h: '구현 2-1', body: `
      <ul>
        <li>남은 일 목록 정리</li>
        <li>우선순위 정하기</li>
        <li>병렬 작업</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '65차시', h: '구현 2-2', time: '10:00–10:50 · 세 도구 공통',
        lede: '테스트와 버그 수정',
        missions: [
          { n: 2, h: '구현 2-2', body: `
      <ul>
        <li>테스트 전부 통과</li>
        <li>짝 팀 사용 테스트</li>
        <li>버그 수정</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '66차시', h: '구현 2-3', time: '11:00–11:50 · 세 도구 공통',
        lede: '배포와 문서',
        missions: [
          { n: 3, h: '구현 2-3', body: `
      <ul>
        <li>최종 배포</li>
        <li>README 작성</li>
        <li>시연 시나리오</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '67차시', h: '발표 리허설', time: '12:00–12:50 · 세 도구 공통',
        lede: '상호 피드백',
        missions: [
          { n: 4, h: '발표 리허설', body: `
      <ul>
        <li>5분 발표 연습</li>
        <li>다른 팀 피드백</li>
        <li>발표 다듬기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '68차시', h: '최종 발표 1', time: '13:50–14:40 · 세 도구 공통',
        lede: '시연과 하네스 이야기',
        missions: [
          { n: 5, h: '최종 발표 1', body: `
      <ul>
        <li>결과물 시연</li>
        <li>"우리 하네스가 막아 준 실수"</li>
        <li>도구 선택 이유</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '69차시', h: '최종 발표 2', time: '14:50–15:40 · 세 도구 공통',
        lede: '시연과 질의응답',
        missions: [
          { n: 6, h: '최종 발표 2', body: `
      <ul>
        <li>나머지 팀 발표</li>
        <li>질의응답</li>
        <li>상호 평가</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '70차시', h: '회고', time: '15:50–16:40 · 세 도구 공통',
        lede: '도구는 바뀌어도 남는 것',
        missions: [
          { n: 7, h: '회고', body: `
      <ul>
        <li>규칙 · 검증 · 권한 · 도구 연결</li>
        <li>사람이 할 일과 AI에게 맡길 일</li>
        <li>수료 이후 학습 방향</li>
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
      '팀 프로젝트를 테스트를 통과시켜 배포할 수 있다',
      '하네스가 막아 준 실수를 근거와 함께 발표할 수 있다',
      '도구 선택 이유를 비교 결과로 설명할 수 있다',
      '수료 이후 스스로 배울 방향을 정할 수 있다',
      '오늘 결과물을 커밋하고 push했다'
    ]
  },

  quizTitle: 'Day 10 · 완성 · 발표 · 회고 퀴즈',
  // TODO 문항을 늘려 주세요. 형식은 README 참고
  quiz: [
    {
      "q": "도구가 바뀌어도 남는 하네스의 원리가 <strong>아닌</strong> 것은?",
      "o": [
        "특정 도구의 단축키 외우기",
        "규칙을 검증 가능하게 쓰기",
        "권한을 최소로 주기",
        "테스트로 완료를 확인하기"
      ],
      "a": 0,
      "e": "단축키는 도구마다 다르고 자주 바뀝니다. 규칙 · 권한 · 도구 연결 · 검증은 어느 도구에서나 같습니다."
    },
    {
      "q": "이 과정에서 AI에게 맡기기 가장 어려운, 사람이 해야 할 일은?",
      "o": [
        "무엇을 왜 만들지 정하고 결과를 책임지는 것",
        "반복적인 코드 작성",
        "포맷 맞추기",
        "테스트 실행"
      ],
      "a": 0,
      "e": "목표를 정하고, 검증하고, 책임지는 일은 여전히 사람의 몫입니다."
    },
    {
      "q": "하네스 엔지니어링을 한 문장으로 가장 잘 요약한 것은?",
      "o": [
        "AI가 매번 같은 품질로 일하도록 규칙 · 도구 · 검증을 설계하는 일",
        "가장 좋은 AI 모델을 고르는 일",
        "프롬프트를 길게 쓰는 일",
        "AI 없이 코딩하는 일"
      ],
      "a": 0,
      "e": "모델은 엔진, 하네스는 고삐 · 계기판 · 안전벨트입니다."
    }
  ]
};
