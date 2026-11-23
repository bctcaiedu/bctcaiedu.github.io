/* Day 4 · 서버와 AI 기능 붙이기
   이 파일은 교안 "틀"입니다. TODO 표시된 곳(슬라이드 본문, 나레이션, 실습 단계)을 채워 나가세요.
   고친 뒤 vibe70 폴더에서:  node _src/build.js 4  */
module.exports = {
  day: 4,
  title: '서버와 AI 기능 붙이기',
  theme: '누적 프로젝트에 서버와 LLM을 얹는다',

  openingNar: `4일차입니다. 오늘의 주제는 서버와 AI 기능 붙이기입니다. 누적 프로젝트에 서버와 LLM을 얹는다.`,

  goals: [
    ['프런트엔드와 백엔드를', '구분해 설명할 수 있다'],
    ['세 회사의 LLM API를', '각각 호출해 결과를 비교할 수 있다'],
    ['API 키를', '.env로 안전하게 보관할 수 있다'],
    ['서버를', '무료 호스팅에 배포할 수 있다']
  ],
  goalsNar: `오늘 끝났을 때 할 수 있어야 하는 것은 4가지입니다. 프런트엔드와 백엔드를 구분해 설명하는 것, 세 회사의 LLM API를 각각 호출해 결과를 비교하는 것, API 키를 .env로 안전하게 보관하는 것, 서버를 무료 호스팅에 배포하는 것입니다.`,

  // 하루 일곱 차시. no = 과정 전체 차시 번호
  blocks: [
    { no: 22, time: '09:00–09:50', title: '프런트엔드와 백엔드', desc: '세 도구 공통' },
    { no: 23, time: '10:00–10:50', title: '데이터베이스 맛보기', desc: '세 도구 공통' },
    { no: 24, time: '11:00–11:50', title: 'LLM API 세 가지 호출', desc: '세 도구 공통' },
    { no: 25, time: '12:00–12:50', title: '프로젝트에 AI 기능 넣기', desc: '세 도구 공통' },
    { no: 26, time: '13:50–14:40', title: '키 관리', desc: '세 도구 공통' },
    { no: 27, time: '14:50–15:40', title: '서버 배포', desc: '세 도구 공통' },
    { no: 28, time: '15:50–16:40', title: '정리와 공유', desc: '세 도구 공통' }
  ],
  blocksNar: `오늘은 일곱 차시입니다. 오전 네 차시, 점심 뒤 세 차시로 진행합니다.`,

  slides: [
    { section: true, eb: '22차시 · 09:00–09:50 · 세 도구 공통', h: '프런트엔드와 백엔드',
      sub: '왜 서버가 필요한가',
      nar: `22차시, 프런트엔드와 백엔드입니다. 왜 서버가 필요한가.` },

    { eb: '22차시 · Key Points', h: '프런트엔드와 백엔드',
      sub: '왜 서버가 필요한가',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">브라우저에서 할 일과 서버에서 할 일</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">간단한 서버를 AI로 만들기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">요청과 응답 보기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 브라우저에서 할 일과 서버에서 할 일, 간단한 서버를 AI로 만들기, 요청과 응답 보기.` },

    { section: true, eb: '23차시 · 10:00–10:50 · 세 도구 공통', h: '데이터베이스 맛보기',
      sub: 'SQLite로 데이터 쌓기',
      nar: `23차시, 데이터베이스 맛보기입니다. SQLite로 데이터 쌓기.` },

    { eb: '23차시 · Key Points', h: '데이터베이스 맛보기',
      sub: 'SQLite로 데이터 쌓기',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">표와 행</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">AI에게 스키마 설계 맡기기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">localStorage에서 DB로 옮기기</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 표와 행, AI에게 스키마 설계 맡기기, localStorage에서 DB로 옮기기.` },

    { section: true, eb: '24차시 · 11:00–11:50 · 세 도구 공통', h: 'LLM API 세 가지 호출',
      sub: 'Claude · Gemini · OpenAI API',
      nar: `24차시, LLM API 세 가지 호출입니다. Claude · Gemini · OpenAI API.` },

    { eb: '24차시 · Key Points', h: 'LLM API 세 가지 호출',
      sub: 'Claude · Gemini · OpenAI API',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">각 회사 API 키 발급</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">같은 질문을 세 API로</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">응답 형식 차이</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 각 회사 API 키 발급, 같은 질문을 세 API로, 응답 형식 차이.` },

    { section: true, eb: '25차시 · 12:00–12:50 · 세 도구 공통', h: '프로젝트에 AI 기능 넣기',
      sub: '할 일 자동 분류 · 퀴즈 자동 출제',
      nar: `25차시, 프로젝트에 AI 기능 넣기입니다. 할 일 자동 분류 · 퀴즈 자동 출제.` },

    { eb: '25차시 · Key Points', h: '프로젝트에 AI 기능 넣기',
      sub: '할 일 자동 분류 · 퀴즈 자동 출제',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">AI 기능 하나 고르기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">세 API 품질 · 속도 · 비용 비교</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">실패했을 때 대비</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. AI 기능 하나 고르기, 세 API 품질 · 속도 · 비용 비교, 실패했을 때 대비.` },

    { section: true, eb: '26차시 · 13:50–14:40 · 세 도구 공통', h: '키 관리',
      sub: '.env와 .gitignore',
      nar: `26차시, 키 관리입니다. .env와 .gitignore.` },

    { eb: '26차시 · Key Points', h: '키 관리',
      sub: '.env와 .gitignore',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">키를 절대 커밋하지 않기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">세 회사 키 따로 보관</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">키가 새면 바로 할 일</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 키를 절대 커밋하지 않기, 세 회사 키 따로 보관, 키가 새면 바로 할 일.` },

    { section: true, eb: '27차시 · 14:50–15:40 · 세 도구 공통', h: '서버 배포',
      sub: '무료 호스팅에 올리기',
      nar: `27차시, 서버 배포입니다. 무료 호스팅에 올리기.` },

    { eb: '27차시 · Key Points', h: '서버 배포',
      sub: '무료 호스팅에 올리기',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">호스팅 서비스 고르기</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">환경 변수 설정</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">배포 후 동작 확인</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 호스팅 서비스 고르기, 환경 변수 설정, 배포 후 동작 확인.` },

    { section: true, eb: '28차시 · 15:50–16:40 · 세 도구 공통', h: '정리와 공유',
      sub: '오늘 붙인 AI 기능 시연',
      nar: `28차시, 정리와 공유입니다. 오늘 붙인 AI 기능 시연.` },

    { eb: '28차시 · Key Points', h: '정리와 공유',
      sub: '오늘 붙인 AI 기능 시연',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">01</span><span class="t">짝에게 시연</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">02</span><span class="t">세 API 비교 결과 공유</span><span class="d">TODO 설명</span></div>
        <div class="card"><span class="n">03</span><span class="t">내일 할 검증 준비</span><span class="d">TODO 설명</span></div>
      </div>`,
      foot: 'TODO · 이 차시의 시연 화면, 예시 프롬프트, 확인 질문 슬라이드를 아래에 추가하세요.',
      nar: `TODO 나레이션. 이 차시의 핵심은 세 가지입니다. 짝에게 시연, 세 API 비교 결과 공유, 내일 할 검증 준비.` }
  ],

  assignment: {
    title: 'AI 기능이 붙은 누적 프로젝트',
    lede: '서버와 LLM API를 붙인 버전을 배포합니다.',
    subtitle: '각 항목마다 결과 화면 캡처와 사용한 요청문(프롬프트)을 함께 붙일 것',
    items: [
      '배포 주소와 AI 기능 시연 캡처',
      '세 API 비교표 (품질 · 속도 · 비용)',
      '.gitignore에 .env가 들어 있는 화면',
      '저장소에 키가 없다는 확인'
    ],
    note: 'TODO 채점 기준. 결과물이 동작하는지, 그리고 어떻게 확인했는지를 함께 봅니다.',
    nar: `오늘의 과제는 AI 기능이 붙은 누적 프로젝트입니다. 서버와 LLM API를 붙인 버전을 배포합니다.` },

  wrap: {
    done: '프런트엔드와 백엔드 · 데이터베이스 맛보기 · LLM API 세 가지 호출 · 프로젝트에 AI 기능 넣기 · 키 관리',
    next: '내일 · Day 5 — 바이브 코딩의 한계와 검증',
    nextDesc: '"됐다"는 말을 믿지 말고 직접 확인한다',
    nar: `오늘 수고하셨습니다. 내일은 바이브 코딩의 한계와 검증입니다. 오늘 마지막에 커밋하고 배포까지 해 두세요. 내일 첫 시간은 오늘 결과물을 여는 것으로 시작합니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '서버와 AI 기능 붙이기',
    standfirst: '누적 프로젝트에 서버와 LLM을 얹는다. 차시 순서대로 쌓이니 건너뛰지 마세요.',
    rules: [
      ['요청은 4요소로', '목표 · 맥락 · 제약 · 완료 기준을 넣어 요청하세요.'],
      ['직접 확인한다', 'AI가 "완료"라고 해도 화면 · 테스트 · 로그로 직접 확인하세요.'],
      ['작게 커밋한다', '기능 하나가 끝날 때마다 커밋하세요. 잘못되면 바로 돌아올 수 있습니다.']
    ],
    parts: [
      {
        pn: '22차시', h: '프런트엔드와 백엔드', time: '09:00–09:50 · 세 도구 공통',
        lede: '왜 서버가 필요한가',
        missions: [
          { n: 1, h: '프런트엔드와 백엔드', body: `
      <ul>
        <li>브라우저에서 할 일과 서버에서 할 일</li>
        <li>간단한 서버를 AI로 만들기</li>
        <li>요청과 응답 보기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '23차시', h: '데이터베이스 맛보기', time: '10:00–10:50 · 세 도구 공통',
        lede: 'SQLite로 데이터 쌓기',
        missions: [
          { n: 2, h: '데이터베이스 맛보기', body: `
      <ul>
        <li>표와 행</li>
        <li>AI에게 스키마 설계 맡기기</li>
        <li>localStorage에서 DB로 옮기기</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '24차시', h: 'LLM API 세 가지 호출', time: '11:00–11:50 · 세 도구 공통',
        lede: 'Claude · Gemini · OpenAI API',
        missions: [
          { n: 3, h: 'LLM API 세 가지 호출', body: `
      <ul>
        <li>각 회사 API 키 발급</li>
        <li>같은 질문을 세 API로</li>
        <li>응답 형식 차이</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '25차시', h: '프로젝트에 AI 기능 넣기', time: '12:00–12:50 · 세 도구 공통',
        lede: '할 일 자동 분류 · 퀴즈 자동 출제',
        missions: [
          { n: 4, h: '프로젝트에 AI 기능 넣기', body: `
      <ul>
        <li>AI 기능 하나 고르기</li>
        <li>세 API 품질 · 속도 · 비용 비교</li>
        <li>실패했을 때 대비</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '26차시', h: '키 관리', time: '13:50–14:40 · 세 도구 공통',
        lede: '.env와 .gitignore',
        missions: [
          { n: 5, h: '키 관리', body: `
      <ul>
        <li>키를 절대 커밋하지 않기</li>
        <li>세 회사 키 따로 보관</li>
        <li>키가 새면 바로 할 일</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '27차시', h: '서버 배포', time: '14:50–15:40 · 세 도구 공통',
        lede: '무료 호스팅에 올리기',
        missions: [
          { n: 6, h: '서버 배포', body: `
      <ul>
        <li>호스팅 서비스 고르기</li>
        <li>환경 변수 설정</li>
        <li>배포 후 동작 확인</li>
      </ul>
      <div class="box q"><span class="lbl">TODO · 실습 단계 작성</span>
        <p>단계별 절차, 예시 프롬프트, 실행 결과 예시, 확인 질문을 여기에 채웁니다.</p></div>` }
        ]
      },
      {
        pn: '28차시', h: '정리와 공유', time: '15:50–16:40 · 세 도구 공통',
        lede: '오늘 붙인 AI 기능 시연',
        missions: [
          { n: 7, h: '정리와 공유', body: `
      <ul>
        <li>짝에게 시연</li>
        <li>세 API 비교 결과 공유</li>
        <li>내일 할 검증 준비</li>
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
      '프런트엔드와 백엔드를 구분해 설명할 수 있다',
      '세 회사의 LLM API를 각각 호출해 결과를 비교할 수 있다',
      'API 키를 .env로 안전하게 보관할 수 있다',
      '서버를 무료 호스팅에 배포할 수 있다',
      '오늘 결과물을 커밋하고 push했다'
    ]
  },

  quizTitle: 'Day 4 · 서버와 AI 기능 붙이기 퀴즈',
  // TODO 문항을 늘려 주세요. 형식은 README 참고
  quiz: [
    {
      "q": "API 키를 보관하는 올바른 방법은?",
      "o": [
        ".env 파일에 두고 .gitignore에 추가",
        "코드에 직접 적고 커밋",
        "README에 적기",
        "HTML 주석에 적기"
      ],
      "a": 0,
      "e": "키가 GitHub에 올라가면 몇 분 안에 남이 가져다 씁니다. 절대 커밋하지 마세요."
    },
    {
      "q": "브라우저 코드에 LLM API 키를 넣으면 안 되는 이유는?",
      "o": [
        "누구나 페이지 소스에서 키를 볼 수 있어서",
        "속도가 느려져서",
        "디자인이 깨져서",
        "API가 거부해서"
      ],
      "a": 0,
      "e": "그래서 키가 필요한 호출은 서버에서 합니다. 오늘 서버를 만든 이유입니다."
    },
    {
      "q": "키를 실수로 커밋했을 때 가장 먼저 할 일은? (직접 입력, 두 글자 이상)",
      "t": true,
      "acc": [
        "키 폐기",
        "폐기",
        "키 재발급",
        "재발급",
        "키 삭제",
        "키 교체"
      ],
      "ans": "키 폐기",
      "e": "커밋을 지워도 이미 복사됐을 수 있습니다. 해당 회사 콘솔에서 키를 먼저 폐기하고 새로 발급합니다."
    }
  ]
};
