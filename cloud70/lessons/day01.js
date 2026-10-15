UBUNTU_COURSE.addChapter({
  id: 'day01',
  no: '01',
  icon: '☁️',
  title: '클라우드란 · 리눅스 첫걸음',
  subtitle: 'Cloud Basics & First Linux Commands',
  summary: '클라우드가 온프레미스와 무엇이 다른지, IaaS · PaaS · SaaS 가 각각 무엇을 대신해 주는지 정리합니다. 네 개 클라우드의 무료 조건을 공식 페이지에서 비교해 가입을 준비하고, 클라우드 서버를 다룰 리눅스 터미널과 기본 명령 20개를 익힙니다.',
  goals: [
    '클라우드와 온프레미스의 차이, IaaS · PaaS · SaaS 를 예를 들어 설명할 수 있다',
    '4개 클라우드의 무료 조건을 비교표로 정리하고 가입 준비를 끝낸다',
    '내 PC 에 리눅스 터미널(WSL Ubuntu)을 준비한다',
    '리눅스 기본 명령으로 파일 · 폴더 · 시스템 정보를 다룬다'
  ],
  sections: [
    // =====================================================================
    {
      id: 'day01-1',
      title: '클라우드란 무엇인가 · 계정 준비',
      minutes: 120,
      goals: [
        '온프레미스와 클라우드의 차이를 비용 · 속도 · 책임 관점에서 말할 수 있다',
        'IaaS · PaaS · SaaS 를 "내가 관리하는 범위"로 구분할 수 있다',
        '리전 · 가용영역 · 책임 공유 모델을 설명할 수 있다',
        '4개 클라우드의 무료 조건을 공식 페이지에서 확인해 비교표를 만든다'
      ],
      flow: [['도입: 서버를 빌린다는 것', 15], ['클라우드의 특징', 20], ['IaaS · PaaS · SaaS', 25], ['리전 · 가용영역 · 책임 공유', 20], ['무료 조건 비교 실습', 30], ['정리 · 퀴즈', 10]],
      content: [
        { type: 'p', html: '예전에는 서비스를 열려면 서버 컴퓨터를 사서 전산실에 두고, 전기 · 냉방 · 네트워크를 직접 관리해야 했습니다. 이것을 <b>온프레미스(on-premises)</b> 라고 합니다. <b>클라우드</b>는 이 서버를 인터넷 너머 거대한 데이터센터에서 <b>필요한 만큼, 필요한 동안만</b> 빌려 쓰는 방식입니다.' },
        { type: 'table', head: ['비교', '온프레미스', '클라우드'], rows: [['시작 비용', '서버 구입비 (수백만 원~)', '0원부터 · 쓴 만큼 (종량제)'], ['준비 시간', '주문 · 설치 · 배선에 수 주', '콘솔에서 몇 분'], ['늘리기 · 줄이기', '새로 사야 함', '클릭 · 명령 한 줄 (탄력성)'], ['장애 · 재해 대비', '직접 이중화', '여러 데이터센터(가용영역) 활용'], ['관리 책임', '전부 내 책임', '나누어 짐 (책임 공유 모델)']] },
        { type: 'h', text: '클라우드의 다섯 가지 특징' },
        { type: 'list', items: ['<b>온디맨드 셀프서비스</b> — 사람에게 요청하지 않고 콘솔 · CLI 로 내가 바로 만든다', '<b>넓은 네트워크 접근</b> — 인터넷만 되면 어디서든 관리한다', '<b>자원 풀링</b> — 거대한 데이터센터 자원을 여러 고객이 나눠 쓴다', '<b>빠른 탄력성</b> — 필요하면 늘리고, 끝나면 줄인다', '<b>종량제(측정 서비스)</b> — 쓴 시간 · 용량만큼 요금이 나온다. <b>지우지 않으면 계속 나온다</b>'] },
        { type: 'h', text: '서비스 모델 — 어디까지 내가 관리하나' },
        { type: 'figure', html: '<svg viewBox="0 0 680 270" style="width:100%;height:auto" font-family="var(--sans)"><g font-size="13" text-anchor="middle"><text x="110" y="22" font-weight="700" font-size="15" fill="var(--fg)">온프레미스</text><text x="280" y="22" font-weight="700" font-size="15" fill="var(--fg)">IaaS</text><text x="450" y="22" font-weight="700" font-size="15" fill="var(--fg)">PaaS</text><text x="610" y="22" font-weight="700" font-size="15" fill="var(--fg)">SaaS</text></g><g font-size="12" text-anchor="middle"><rect x="40" y="34" width="140" height="34" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="110" y="56" fill="var(--fg)">앱 · 데이터</text><rect x="40" y="72" width="140" height="34" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="110" y="94" fill="var(--fg)">런타임 · 미들웨어</text><rect x="40" y="110" width="140" height="34" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="110" y="132" fill="var(--fg)">운영체제</text><rect x="40" y="148" width="140" height="34" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="110" y="170" fill="var(--fg)">가상화 · 서버</text><rect x="40" y="186" width="140" height="34" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="110" y="208" fill="var(--fg)">네트워크 · 건물</text><rect x="210" y="34" width="140" height="34" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="280" y="56" fill="var(--fg)">앱 · 데이터</text><rect x="210" y="72" width="140" height="34" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="280" y="94" fill="var(--fg)">런타임 · 미들웨어</text><rect x="210" y="110" width="140" height="34" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="280" y="132" fill="var(--fg)">운영체제</text><rect x="210" y="148" width="140" height="34" rx="6" fill="var(--card2)" stroke="var(--line)"/><text x="280" y="170" fill="var(--muted)">가상화 · 서버</text><rect x="210" y="186" width="140" height="34" rx="6" fill="var(--card2)" stroke="var(--line)"/><text x="280" y="208" fill="var(--muted)">네트워크 · 건물</text><rect x="380" y="34" width="140" height="34" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="450" y="56" fill="var(--fg)">앱 · 데이터</text><rect x="380" y="72" width="140" height="34" rx="6" fill="var(--card2)" stroke="var(--line)"/><text x="450" y="94" fill="var(--muted)">런타임 · 미들웨어</text><rect x="380" y="110" width="140" height="34" rx="6" fill="var(--card2)" stroke="var(--line)"/><text x="450" y="132" fill="var(--muted)">운영체제</text><rect x="380" y="148" width="140" height="34" rx="6" fill="var(--card2)" stroke="var(--line)"/><text x="450" y="170" fill="var(--muted)">가상화 · 서버</text><rect x="380" y="186" width="140" height="34" rx="6" fill="var(--card2)" stroke="var(--line)"/><text x="450" y="208" fill="var(--muted)">네트워크 · 건물</text><rect x="545" y="34" width="130" height="186" rx="6" fill="var(--card2)" stroke="var(--line)"/><text x="610" y="130" fill="var(--muted)">전부 제공자</text></g><rect x="40" y="236" width="18" height="14" rx="3" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="66" y="248" font-size="12" fill="var(--fg)">내가 관리</text><rect x="150" y="236" width="18" height="14" rx="3" fill="var(--card2)" stroke="var(--line)"/><text x="176" y="248" font-size="12" fill="var(--fg)">클라우드 제공자가 관리</text></svg>', caption: '오른쪽으로 갈수록 클라우드가 대신해 주는 범위가 넓어집니다' },
        { type: 'table', head: ['모델', '빌리는 것', '예', '이 과정에서'], rows: [['IaaS', '가상 서버 · 디스크 · 네트워크', 'AWS EC2, Azure VM, GCP Compute Engine, OCI Compute', '3~8일차 내내'], ['PaaS', '앱을 올릴 플랫폼', 'Azure App Service, Cloud Run, Elastic Beanstalk', '4 · 9일차'], ['SaaS', '완성된 소프트웨어', 'Gmail, Microsoft 365, Notion', '이미 쓰고 있음']] },
        { type: 'h', text: '리전 · 가용영역 · 책임 공유 모델' },
        { type: 'p', html: '<b>리전(region)</b> 은 클라우드 데이터센터가 모여 있는 지역입니다(서울 <code>ap-northeast-2</code>, 오리건 <code>us-west1</code> 등). 리전 안에는 전원 · 네트워크가 분리된 데이터센터 묶음인 <b>가용영역(AZ)</b> 이 여러 개 있습니다. 사용자와 가까운 리전을 고르면 빠르고, 여러 가용영역에 나눠 두면 한 곳이 멈춰도 서비스가 이어집니다.' },
        { type: 'callout', kind: 'warn', title: '책임 공유 모델', html: '<p>클라우드 회사는 <b>클라우드 자체</b>(건물 · 하드웨어 · 가상화)의 보안을 책임지고, 사용자는 <b>클라우드 안에 올린 것</b>(OS 업데이트, 방화벽 설정, 비밀번호 · 키, 데이터)을 책임집니다. EC2 에 보안 업데이트를 안 해서 해킹당하면 그것은 <b>내 책임</b>입니다.</p>' },
        { type: 'h', text: '무료 조건 비교 — 공식 페이지에서 직접 확인' },
        { type: 'p', html: '조건은 자주 바뀝니다. 블로그가 아니라 <b>공식 페이지</b>를 열어 확인합니다. 2026년 10월 기준으로 기간 제한 없이 서버를 무료로 계속 켜 둘 수 있는 곳은 <b>Oracle Cloud 와 Google Cloud 두 곳</b>뿐이고, 이 두 곳이 6일차 이후 우리의 실습 서버가 됩니다.' },
        { type: 'table', head: ['클라우드', '공식 페이지', '신규 크레딧', '기간 제한 없는 무료 서버', '결제수단'], rows: [['AWS', '<code>aws.amazon.com/free</code>', '최대 $200, 무료 플랜 최대 6개월', '없음', '필요'], ['Azure for Students', '<code>azure.microsoft.com/free/students</code>', '$100, 12개월', '없음', '불필요 (학생 인증)'], ['Google Cloud', '<code>cloud.google.com/free</code>', '$300, 90일', 'e2-micro 1대 (미국 3개 리전)', '필요'], ['Oracle Cloud', '<code>oracle.com/cloud/free</code>', '$300 체험', 'Ampere A1 합계 2 OCPU · 12GB', '필요']] },
        { type: 'callout', kind: 'vm', title: '실제 클라우드에서 — 가입 준비물 점검', html: '<ul><li><b>해외 결제 카드</b> — VISA/Mastercard 표시 확인. 체크카드는 거절될 수 있습니다</li><li><b>개인 이메일</b> — Gmail 이면 <code>이름+aws@gmail.com</code> 처럼 별칭을 써도 같은 메일함으로 옵니다</li><li><b>학교 이메일</b> — Azure for Students 인증용</li><li><b>OTP 앱</b> — Google Authenticator 또는 Microsoft Authenticator. 내일 MFA 에 씁니다</li></ul><p>카드가 없으면 담당 교수에게 말하세요. Azure for Students 는 카드 없이 되고, 나머지는 조 계정으로 함께 실습합니다. <b>카드 번호를 캡처 · 메모에 남기지 마세요.</b></p>' },
        { type: 'cmd', title: '가상 서버에서 오늘 날짜와 내 위치 확인', code: 'date\nwhoami\nhostname', desc: '오른쪽 가상 터미널에 첫 명령을 입력해 봅니다. ▶ 버튼보다 직접 타이핑을 권장합니다.' }
      ],
      practice: [
        {
          title: '실습 1-1. 무료 조건 비교표 파일 만들기',
          level: 1,
          desc: '<p>가상 터미널에서 <code>~/cloud70/day1/free-tier.md</code> 파일을 만들고, AWS · Azure · Google Cloud · Oracle 네 줄을 적으세요. 각 줄에 크레딧과 무료 서버 여부를 쓰면 됩니다. (예: <code>AWS | $200 | 없음</code>)</p>',
          hint: '<code>mkdir -p ~/cloud70/day1</code> 후 <code>nano ~/cloud70/day1/free-tier.md</code>. 저장 Ctrl+S · 닫기 Ctrl+X',
          solution: 'mkdir -p ~/cloud70/day1\ncat > ~/cloud70/day1/free-tier.md <<\'EOF\'\nAWS | 최대 $200, 6개월 | 무료 서버 없음\nAzure for Students | $100, 12개월 | 무료 서버 없음\nGoogle Cloud | $300, 90일 | e2-micro 1대\nOracle | $300 체험 | Ampere A1 2 OCPU · 12GB\nEOF\ncat ~/cloud70/day1/free-tier.md',
          check: 'f=~/cloud70/day1/free-tier.md; test -f $f && grep -qi aws $f && grep -qi azure $f && grep -qi google $f && grep -qi oracle $f',
          checkOk: '네 클라우드가 모두 들어 있습니다.',
          checkFail: '<code>cat ~/cloud70/day1/free-tier.md</code> 로 AWS · Azure · Google · Oracle 이 모두 적혀 있는지 확인하세요.'
        }
      ],
      quiz: [
        { q: '다음 중 <b>IaaS</b> 에 해당하는 것은?', options: ['Gmail', 'Azure App Service', 'AWS EC2', 'Microsoft 365'], answer: 2, explain: 'EC2 는 가상 서버를 빌려 주고, OS 부터 위는 사용자가 관리합니다.' },
        { q: 'EC2 에 만든 Ubuntu 의 보안 업데이트를 하지 않아 해킹당했다. 책임 공유 모델에서 누구 책임인가?', options: ['AWS', '사용자', '반반', 'Canonical'], answer: 1, explain: 'OS 이상(클라우드 안에 올린 것)은 사용자 책임입니다.' },
        { q: '2026년 10월 기준, 기간 제한 없이 무료 VM 을 계속 켜 둘 수 있는 곳 두 곳은?', options: ['AWS · Azure', 'Azure · Google Cloud', 'Google Cloud · Oracle Cloud', 'AWS · Oracle Cloud'], answer: 2, explain: 'GCP e2-micro 와 OCI Always Free 가 기간 제한이 없습니다. AWS · Azure 는 크레딧 · 기간 한정입니다.' },
        { q: '"쓰지 않는 서버를 켜 두어도 요금이 나온다" 는 클라우드의 어떤 특징 때문인가?', options: ['자원 풀링', '종량제', '넓은 네트워크 접근', '셀프서비스'], answer: 1, explain: '켜져 있는 시간 · 사용량만큼 과금됩니다. 그래서 정리가 중요합니다.' }
      ],
      slides: [
        { layout: 'title', title: '클라우드란 무엇인가', subtitle: '서버를 사지 않고 빌린다', notes: '<p>"서비스를 하나 열려면 무엇이 필요할까요?" 로 시작합니다. 컴퓨터 · 전기 · 인터넷 · 관리 인력을 학생들이 말하게 합니다.</p>' },
        { layout: 'table', title: '온프레미스 vs 클라우드', head: ['비교', '온프레미스', '클라우드'], rows: [['시작 비용', '서버 구입', '0원부터 · 종량제'], ['준비 시간', '수 주', '몇 분'], ['늘리기', '새로 구매', '클릭 한 번'], ['책임', '전부 나', '나눠 짐']], notes: '<p>종량제는 장점이자 위험이라는 점을 꼭 짚습니다. 지우지 않으면 계속 나옵니다.</p>' },
        { layout: 'bullets', title: '서비스 모델', bullets: ['<b>IaaS</b> — 가상 서버를 빌린다 (EC2, VM, Compute Engine)', '<b>PaaS</b> — 앱만 올린다 (App Service, Cloud Run)', '<b>SaaS</b> — 완성된 서비스를 쓴다 (Gmail, M365)', '오른쪽으로 갈수록 내가 관리할 것이 줄어든다'], notes: '<p>피자 비유(집에서 만들기 · 배달 · 식당)를 써도 좋습니다.</p>' },
        { layout: 'bullets', title: '책임 공유 모델', bullets: ['클라우드 회사: 건물 · 하드웨어 · 가상화', '나: OS 업데이트 · 방화벽 · 키 · 데이터', 'EC2 해킹 = 대부분 사용자 설정 실수'], notes: '<p>실제 유출 사고 사례(공개 버킷)를 짧게 소개하면 효과적입니다.</p>' },
        { layout: 'summary', title: '정리', bullets: ['클라우드 = 필요할 때 빌리고 쓴 만큼 낸다', 'IaaS · PaaS · SaaS 는 관리 범위의 차이', '무료 서버를 계속 쓸 수 있는 곳: GCP · Oracle', '가입 준비: 해외 결제 카드 · 이메일 · OTP 앱'], notes: '<p>오후에는 클라우드 서버를 다룰 리눅스 터미널을 준비합니다.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day01-2',
      title: '내 PC 에 리눅스 터미널 만들기',
      minutes: 120,
      goals: [
        'WSL 로 Windows 에 Ubuntu 24.04 를 설치할 수 있다',
        'Windows Terminal 에서 복사 · 붙여넣기 · 중단 키를 구분해 쓸 수 있다',
        'apt 로 패키지 목록을 갱신하고 프로그램을 설치할 수 있다'
      ],
      flow: [['왜 리눅스 터미널인가', 15], ['WSL 설치', 35], ['Windows Terminal', 20], ['apt 패키지 관리', 35], ['정리 · 퀴즈', 15]],
      content: [
        { type: 'p', html: '클라우드 서버에는 모니터가 없습니다. 거의 모든 클라우드 서버는 <b>리눅스</b>이고, 우리는 내 PC 의 <b>터미널</b>에서 SSH 로 접속해 명령으로 관리합니다. 오늘은 내 PC 에 리눅스 터미널을 만들고, 오른쪽 가상 터미널과 같은 명령이 되는지 확인합니다.' },
        { type: 'h', text: 'WSL 로 Ubuntu 설치 (Windows)' },
        { type: 'cmd', vm: true, title: '관리자 PowerShell 에서', code: 'wsl --install -d Ubuntu-24.04', expect: '설치 중: Ubuntu 24.04 LTS\n...\n요청한 작업이 완료되었습니다. 시스템을 다시 시작해야 변경 내용이 적용됩니다.', desc: '재부팅하면 Ubuntu 창이 열리고 사용자 이름(영어 소문자)과 비밀번호를 묻습니다. <b>비밀번호는 입력해도 화면에 안 보이는 것이 정상</b>입니다. macOS 는 기본 "터미널" 앱을 쓰면 되므로 이 단계를 건너뜁니다.' },
        { type: 'callout', kind: 'tip', title: '실습실 PC 라 설치가 막히면', html: '<p>오른쪽 <b>가상 클라우드 서버 터미널</b>이나 강의실의 <a href="../ubuntu2404/" target="_blank">Ubuntu 24.04 가상 터미널</a>을 쓰세요. 오늘 명령은 모두 그 안에서도 됩니다.</p>' },
        { type: 'h', text: 'Windows Terminal' },
        { type: 'table', head: ['키', 'Windows Terminal', '뜻'], rows: [['<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd>', '복사', '선택한 글자 복사'], ['<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd>', '붙여넣기', '명령 붙여넣기'], ['<kbd>Ctrl</kbd>+<kbd>C</kbd>', '중단', '실행 중인 명령을 멈춤 — 복사가 아님!'], ['<kbd>Tab</kbd>', '자동 완성', '파일 · 명령 이름을 채움'], ['<kbd>↑</kbd> <kbd>↓</kbd>', '명령 기록', '이전 명령 다시 부르기']] },
        { type: 'cmd', title: '내가 어떤 리눅스에 있는지', code: 'whoami\ncat /etc/os-release | head -2', desc: '가상 터미널에서 실행해 보고, 집에서는 WSL 에서도 같은 결과가 나오는지 비교합니다.' },
        { type: 'h', text: 'apt — 리눅스의 앱 스토어' },
        { type: 'p', html: '리눅스에서 프로그램은 <code>apt</code> 로 설치합니다. <code>sudo</code> 는 "관리자 권한으로" 라는 뜻이고, 처음 한 번 비밀번호를 묻습니다(가상 터미널은 <code>ubuntu</code>).' },
        { type: 'cmd', title: '목록 갱신과 설치', code: 'sudo apt update\nsudo apt install -y tree htop\ntree --version', desc: '<code>apt update</code> 는 설치 가능한 목록을 새로 받고, <code>apt upgrade</code> 는 이미 깔린 프로그램을 최신으로 올립니다. 둘은 다른 일입니다.' },
        { type: 'callout', kind: 'info', title: 'update vs upgrade', html: '<p><code>update</code> 만 하면 <b>목록</b>만 새로워지고 프로그램은 그대로입니다. 실제 서버에서는 <code>sudo apt update &amp;&amp; sudo apt upgrade -y</code> 를 함께 씁니다. 6일차에 클라우드 서버를 만들면 가장 먼저 하는 일입니다.</p>' }
      ],
      practice: [
        {
          title: '실습 1-2. tree 와 htop 설치하기',
          level: 1,
          desc: '<p>가상 터미널에서 <code>tree</code> 와 <code>htop</code> 패키지를 설치하세요.</p>',
          hint: '<code>sudo apt update</code> → <code>sudo apt install -y tree htop</code>',
          solution: 'sudo apt update\nsudo apt install -y tree htop\nwhich tree htop',
          check: 'command -v tree >/dev/null && command -v htop >/dev/null',
          checkOk: '두 프로그램이 설치되었습니다.',
          checkFail: '<code>which tree htop</code> 으로 두 경로가 모두 나오는지 확인하세요.'
        }
      ],
      quiz: [
        { q: 'Windows Terminal 에서 실행 중인 명령을 멈추는 키는?', options: ['Ctrl+Shift+C', 'Ctrl+C', 'Ctrl+V', 'Ctrl+Z 후 Enter'], answer: 1, explain: 'Ctrl+C 는 중단 신호입니다. 복사는 Ctrl+Shift+C 입니다.' },
        { q: '<code>sudo apt update</code> 가 하는 일은?', options: ['모든 프로그램을 최신으로 올린다', '설치 가능한 패키지 목록을 새로 받는다', 'Ubuntu 버전을 올린다', 'sudo 비밀번호를 바꾼다'], answer: 1, explain: '목록만 갱신합니다. 실제 업그레이드는 apt upgrade 입니다.' },
        { q: 'sudo 비밀번호를 입력하는데 화면에 아무것도 안 보인다. 왜일까?', options: ['키보드 고장', '보안상 표시하지 않는 것이 정상', '한글 모드', '비밀번호가 없음'], answer: 1, explain: '입력은 되고 있습니다. 끝까지 치고 Enter 를 누르세요.' }
      ],
      slides: [
        { layout: 'title', title: '내 PC 에 리눅스 터미널', subtitle: 'WSL · Windows Terminal · apt', notes: '<p>"클라우드 서버에는 모니터가 없다" 로 시작합니다.</p>' },
        { layout: 'code', title: 'WSL 설치 (관리자 PowerShell)', code: 'wsl --install -d Ubuntu-24.04', points: ['재부팅 후 사용자 만들기', '비밀번호는 안 보이는 게 정상', '설치 불가 PC 는 가상 터미널'], notes: '<p>BIOS 가상화가 꺼진 PC 가 있을 수 있습니다. 가상 터미널로 진행시킵니다.</p>' },
        { layout: 'table', title: '꼭 외울 키', head: ['키', '뜻'], rows: [['Ctrl+Shift+C / V', '복사 / 붙여넣기'], ['Ctrl+C', '중단'], ['Tab', '자동 완성'], ['↑ ↓', '명령 기록']], notes: '<p>Ctrl+C 로 복사하려다 명령을 멈추는 실수를 미리 보여 줍니다.</p>' },
        { layout: 'code', title: 'apt 로 설치', code: 'sudo apt update\nsudo apt install -y tree htop', points: ['update = 목록 갱신', 'install = 설치', 'upgrade = 이미 깔린 것 최신화'], notes: '<p>▶ 로 함께 실행합니다.</p>' },
        { layout: 'summary', title: '정리', bullets: ['클라우드 서버는 터미널로 관리한다', 'WSL 로 Windows 에 Ubuntu', '복사는 Ctrl+Shift+C, 중단은 Ctrl+C', 'apt update → apt install'], notes: '<p>다음 교시는 기본 명령 20개입니다.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day01-3',
      title: '리눅스 기본 명령 20개',
      minutes: 120,
      goals: [
        '위치 · 목록 · 폴더 · 파일 명령으로 작업 공간을 만든다',
        'nano 로 파일을 만들고 저장한다',
        'uname · free · df · ip 로 서버 사양과 주소를 읽는다',
        'ls -l 의 권한 표시를 읽고 chmod 600 의 뜻을 안다'
      ],
      flow: [['위치와 파일', 30], ['nano 편집기', 20], ['시스템 정보', 30], ['권한 읽기', 25], ['산출물 정리', 15]],
      content: [
        { type: 'h', text: '위치와 파일 다루기' },
        { type: 'cmd', title: '작업 폴더 만들기', code: 'pwd\nmkdir -p ~/cloud70/day1\ncd ~/cloud70/day1\necho "안녕, 클라우드" > hello.txt\necho "두 번째 줄" >> hello.txt\ncat hello.txt\nls -al', desc: '<code>&gt;</code> 는 덮어쓰기, <code>&gt;&gt;</code> 는 이어 쓰기입니다. <code>-p</code> 는 중간 폴더까지 한 번에 만듭니다.' },
        { type: 'cmd', title: '복사 · 이름 바꾸기 · 지우기', code: 'cp hello.txt copy.txt\nmv copy.txt renamed.txt\nls\nrm renamed.txt\ncd ~ && tree cloud70', desc: '<code>rm</code> 으로 지운 파일은 휴지통이 없어 되살릴 수 없습니다.' },
        { type: 'callout', kind: 'warn', title: 'rm -rf 는 두 번 확인', html: '<p><code>rm -rf 폴더</code> 는 폴더 안을 묻지도 않고 모두 지웁니다. 클라우드 서버에서 경로를 잘못 쓰면 서비스가 통째로 사라집니다.</p>' },
        { type: 'h', text: 'nano — 서버의 메모장' },
        { type: 'p', html: '서버에는 그래픽 메모장이 없습니다. 터미널 편집기 <code>nano</code> 를 씁니다. 이 강좌의 가상 터미널에서는 <code>nano 파일</code> 을 입력하면 가운데 아래 📝 편집기가 열리고, <kbd>Ctrl</kbd>+<kbd>S</kbd> 로 저장, <kbd>Ctrl</kbd>+<kbd>X</kbd> 로 닫습니다. 실제 nano 는 <kbd>Ctrl</kbd>+<kbd>O</kbd> → <kbd>Enter</kbd> 로 저장합니다.' },
        { type: 'cmd', title: '자기소개 메모 쓰기', code: 'nano ~/cloud70/day1/memo.md', desc: '이름 · 학과 · 이 과정에서 만들고 싶은 서비스, 세 줄을 씁니다. 7일차에 이 내용으로 웹페이지를 만듭니다.' },
        { type: 'h', text: '서버 사양과 주소 읽기' },
        { type: 'cmd', title: '클라우드 VM 을 만들면 가장 먼저 보는 것', code: 'uname -a\nnproc\nfree -h\ndf -h /\nip -br a\ncurl -s ifconfig.me; echo', desc: '<code>ip -br a</code> 는 서버 안쪽의 <b>사설 IP</b>, <code>curl ifconfig.me</code> 는 인터넷이 보는 <b>공인 IP</b> 입니다. 두 값이 왜 다른지는 내일 배웁니다.' },
        { type: 'table', head: ['명령', '알려 주는 것', '클라우드에서 확인하는 이유'], rows: [['<code>uname -m</code>', 'CPU 아키텍처 (x86_64 / aarch64)', 'ARM 서버는 Docker 이미지 호환을 확인해야 함'], ['<code>nproc</code>', 'CPU 코어 수', '고른 인스턴스 유형이 맞는지'], ['<code>free -h</code>', '메모리', 'e2-micro(1GB) 는 무거운 프로그램이 어려움'], ['<code>df -h /</code>', '디스크', '무료 디스크 한도 안인지'], ['<code>ip -br a</code>', '사설 IP', 'VPC 안의 주소']] },
        { type: 'h', text: '권한 읽기' },
        { type: 'cmd', title: '권한 바꾸기', code: 'ls -l ~/cloud70/day1/hello.txt\nchmod 600 ~/cloud70/day1/hello.txt\nls -l ~/cloud70/day1/hello.txt', desc: '<code>rw-r--r--</code> 세 묶음은 <b>소유자 · 그룹 · 다른 사람</b> 의 읽기(r) · 쓰기(w) · 실행(x) 권한입니다. <code>600</code> 은 "나만 읽고 쓰기" 입니다.' },
        { type: 'callout', kind: 'info', title: '왜 지금 배우나', html: '<p>내일 만드는 SSH 개인키는 반드시 <code>600</code> 이어야 합니다. 권한이 넓으면 SSH 가 "UNPROTECTED PRIVATE KEY FILE" 이라며 키 사용을 거부합니다.</p>' },
        { type: 'callout', kind: 'vm', title: '실제 클라우드에서 — 오늘의 산출물', html: '<ol><li>무료 조건 비교표 (출처 URL 포함)</li><li>가입 준비물 점검 결과 (카드는 있음/없음만)</li><li>오늘 실행한 명령과 결과 (터미널 텍스트 복사)</li><li><code>uname -a</code> 와 <code>free -h</code> 결과</li></ol><p>채점: 동작 3 · 기록 2 · 보안·비용 2. 카드 번호 · 비밀번호가 보이면 0점입니다.</p>' }
      ],
      practice: [
        {
          title: '실습 1-3. 자기소개 메모 만들기',
          level: 1,
          desc: '<p><code>~/cloud70/day1/memo.md</code> 에 자기소개를 <b>세 줄 이상</b> 쓰세요.</p>',
          hint: '<code>nano ~/cloud70/day1/memo.md</code> → 세 줄 입력 → Ctrl+S 저장',
          solution: 'mkdir -p ~/cloud70/day1\nprintf "이름: 홍길동\\n학과: AI응용소프트웨어과\\n만들고 싶은 것: 내 포트폴리오 사이트\\n" > ~/cloud70/day1/memo.md\ncat ~/cloud70/day1/memo.md',
          check: 'test -f ~/cloud70/day1/memo.md && [ "$(grep -c . ~/cloud70/day1/memo.md)" -ge 3 ]',
          checkOk: '세 줄 이상 들어 있습니다. 7일차에 웹페이지로 만듭니다.',
          checkFail: '<code>cat ~/cloud70/day1/memo.md</code> 로 내용이 세 줄 이상인지 확인하세요.'
        },
        {
          title: '실습 1-4. 나만 읽는 파일',
          level: 2,
          desc: '<p><code>~/cloud70/day1/hello.txt</code> 의 권한을 <b>나만 읽고 쓰기(600)</b>로 바꾸세요.</p>',
          hint: '<code>chmod 600 ~/cloud70/day1/hello.txt</code>',
          solution: 'mkdir -p ~/cloud70/day1\ntest -f ~/cloud70/day1/hello.txt || echo "안녕, 클라우드" > ~/cloud70/day1/hello.txt\nchmod 600 ~/cloud70/day1/hello.txt\nls -l ~/cloud70/day1/hello.txt',
          check: '[ "$(stat -c %a ~/cloud70/day1/hello.txt)" = 600 ]',
          checkOk: '-rw------- 입니다.',
          checkFail: '<code>ls -l ~/cloud70/day1/hello.txt</code> 가 -rw------- 인지 확인하세요.'
        }
      ],
      quiz: [
        { q: '파일 끝에 한 줄을 <b>덧붙이는</b> 것은?', options: ['echo hi > a.txt', 'echo hi >> a.txt', 'cat hi a.txt', 'cp hi a.txt'], answer: 1, explain: '> 는 덮어쓰기, >> 는 이어 쓰기입니다.' },
        { q: '<code>-rw-------</code> 를 숫자로 나타내면?', options: ['600', '644', '700', '755'], answer: 0, explain: 'rw- = 6, --- = 0, --- = 0 → 600 입니다.' },
        { q: '서버 안쪽의 사설 IP 를 보는 명령은?', options: ['curl ifconfig.me', 'ip -br a', 'uname -a', 'df -h'], answer: 1, explain: 'ifconfig.me 는 인터넷이 보는 공인 IP 를 알려 줍니다.' },
        { q: 'ARM 서버인지 확인하는 명령은?', options: ['nproc', 'free -h', 'uname -m', 'whoami'], answer: 2, explain: 'aarch64 면 ARM, x86_64 면 Intel/AMD 계열입니다.' }
      ],
      slides: [
        { layout: 'title', title: '리눅스 기본 명령 20개', subtitle: '클라우드 서버에서 매일 쓰는 것만', notes: '<p>학생이 직접 타이핑하게 하고, 결과를 메모장에 붙이게 합니다(오늘 산출물).</p>' },
        { layout: 'code', title: '파일과 폴더', code: 'pwd\nmkdir -p ~/cloud70/day1\ncd ~/cloud70/day1\necho "안녕" > hello.txt\ncat hello.txt\nls -al', points: ['> 덮어쓰기 · >> 이어 쓰기', 'rm 은 휴지통이 없다'], notes: '<p>▶ 로 실행하기 전에 결과를 먼저 예상하게 합니다.</p>' },
        { layout: 'code', title: '서버 사양 읽기', code: 'uname -a\nnproc\nfree -h\ndf -h /\nip -br a\ncurl -s ifconfig.me', points: ['사설 IP vs 공인 IP', 'x86_64 vs aarch64'], notes: '<p>두 IP 가 다른 이유를 질문으로 남기고 내일 답합니다.</p>' },
        { layout: 'table', title: '권한 읽기', head: ['표시', '숫자', '뜻'], rows: [['rw-------', '600', '나만 읽기·쓰기'], ['rw-r--r--', '644', '모두 읽기'], ['rwx------', '700', '나만 모두']], notes: '<p>SSH 개인키가 600 이어야 하는 이유를 예고합니다.</p>' },
        { layout: 'summary', title: '오늘 한 일', bullets: ['클라우드 · 서비스 모델 · 책임 공유', '4개 클라우드 무료 조건 비교', '리눅스 터미널 준비와 apt', '기본 명령 · nano · 권한'], notes: '<p>내일은 네트워크와 SSH 키, 그리고 클라우드 가입입니다.</p>' }
      ]
    }
  ]
});
