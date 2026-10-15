UBUNTU_COURSE.addChapter({
  id: 'day02',
  no: '02',
  icon: '🔑',
  title: '네트워크 · SSH 키 · 계정 안전장치',
  subtitle: 'Network, SSH Keys & Account Safety',
  summary: '클라우드 서버에 들어가려면 주소(IP), 문(포트), 열쇠(SSH 키)가 필요합니다. 셋을 명령으로 직접 확인하고 SSH 키를 만들어 키 인증으로 접속해 봅니다. 오후에는 AWS · Google Cloud · Oracle Cloud 에 가입하면서, 서버를 만들기 전에 MFA 와 $1 예산 알림부터 겁니다.',
  goals: [
    '사설 IP · 공인 IP · DNS · 포트를 명령으로 확인하고 설명할 수 있다',
    'SSH 키 쌍을 만들고 공개키와 개인키의 역할을 설명할 수 있다',
    '공개키를 서버에 등록해 비밀번호 없이 접속할 수 있다',
    '클라우드 계정에 MFA 와 예산 알림을 먼저 건다'
  ],
  sections: [
    // =====================================================================
    {
      id: 'day02-1',
      title: '네트워크를 명령으로 보기',
      minutes: 120,
      goals: [
        '사설 IP 와 공인 IP 가 다른 이유를 NAT 로 설명할 수 있다',
        'nslookup · dig 로 도메인 이름을 IP 로 바꿀 수 있다',
        '22 · 80 · 443 · 3306 포트의 용도와 공개 여부를 말할 수 있다'
      ],
      flow: [['도입: 주소 · 문 · 열쇠', 10], ['IP 와 NAT', 30], ['DNS', 30], ['포트와 방화벽', 35], ['정리 · 퀴즈', 15]],
      content: [
        { type: 'figure', html: '<svg viewBox="0 0 680 170" style="width:100%;height:auto" font-family="var(--sans)"><defs><marker id="a2n" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="var(--accent)"/></marker></defs><g font-size="13" text-anchor="middle"><rect x="10" y="40" width="150" height="90" rx="12" fill="var(--card2)" stroke="var(--line)"/><text x="85" y="72" font-weight="700" fill="var(--fg)">내 PC</text><text x="85" y="96" fill="var(--muted)" font-family="var(--mono)">ssh 개인키</text><rect x="265" y="40" width="150" height="90" rx="12" fill="var(--card2)" stroke="var(--line)"/><text x="340" y="72" font-weight="700" fill="var(--fg)">인터넷</text><text x="340" y="96" fill="var(--muted)">DNS: 이름 → IP</text><rect x="520" y="40" width="150" height="90" rx="12" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="595" y="68" font-weight="700" fill="var(--fg)">클라우드 서버</text><text x="595" y="90" fill="var(--muted)" font-family="var(--mono)">공인 IP · 22번 문</text><text x="595" y="110" fill="var(--muted)" font-family="var(--mono)">공개키(자물쇠)</text></g><path d="M165 85 H258" stroke="var(--accent)" stroke-width="3" marker-end="url(#a2n)"/><path d="M420 85 H513" stroke="var(--accent)" stroke-width="3" marker-end="url(#a2n)"/><text x="340" y="160" text-anchor="middle" font-size="12" fill="var(--muted)">주소(IP) · 문(포트) · 열쇠(SSH 키) — 셋 중 하나라도 틀리면 접속되지 않는다</text></svg>', caption: '클라우드 서버 접속에 필요한 세 가지' },
        { type: 'h', text: '사설 IP 와 공인 IP' },
        { type: 'cmd', title: '두 주소 비교', code: 'ip -br a\ncurl -s ifconfig.me; echo', desc: '<code>10.x</code> · <code>172.16~31.x</code> · <code>192.168.x</code> 는 <b>사설 IP</b> 대역입니다. 공유기(클라우드에서는 인터넷 게이트웨이)가 사설 IP 를 <b>공인 IP</b> 로 바꿔 인터넷에 내보내는 것을 <b>NAT</b> 라고 합니다.' },
        { type: 'callout', kind: 'info', title: '클라우드도 같다', html: '<p>클라우드 VM 안에서 <code>ip a</code> 를 보면 <code>10.0.0.x</code> 같은 사설 IP 만 보입니다. 콘솔에 표시되는 공인 IP 는 서버 밖(클라우드 네트워크)에서 붙여 준 주소입니다. 이 가상 서버도 사설 <code>10.0.2.15</code>, 공인 <code>203.0.113.25</code> 로 같은 구조입니다.</p>' },
        { type: 'h', text: 'DNS — 이름을 주소로' },
        { type: 'cmd', title: '이름 → IP', code: 'nslookup www.kopo.ac.kr\ndig +short google.com\nping -c 3 google.com', desc: '8일차에 내 서버에 도메인을 붙이면 바로 이 <code>nslookup</code> 으로 연결을 확인합니다.' },
        { type: 'h', text: '포트 — 서버의 문 번호' },
        { type: 'table', head: ['포트', '용도', '공개 여부 (이 과정)'], rows: [['22', 'SSH 원격 접속', '열되, 가능하면 내 IP 만'], ['80', 'HTTP 웹', '7일차에 엶'], ['443', 'HTTPS 웹', '8일차에 엶'], ['3306', 'MariaDB / MySQL', '<b>인터넷에 절대 열지 않음</b>'], ['5000', '개발용 앱 서버', '서버 안에서만']] },
        { type: 'cmd', title: '서버에서 열려 있는 문 보기', code: 'sudo ss -tlnp', desc: '<code>LISTEN</code> 상태인 줄이 지금 연결을 기다리는 포트입니다. 이 가상 서버는 SSH(22)가 열려 있습니다.' },
        { type: 'cmd', title: 'HTTP 응답 헤더만 보기', code: 'curl -sI https://www.google.com | head -5', desc: '<code>https://</code> 는 443번, <code>http://</code> 는 80번 포트로 요청합니다.' }
      ],
      practice: [
        {
          title: '실습 2-1. 두 개의 IP 기록하기',
          level: 1,
          desc: '<p><code>~/cloud70/day2/ip.txt</code> 에 이 서버의 <b>사설 IP</b> 와 <b>공인 IP</b> 를 모두 기록하세요.</p>',
          hint: '<code>ip -br a</code> 로 사설 IP, <code>curl -s ifconfig.me</code> 로 공인 IP. 명령 결과를 <code>&gt;&gt;</code> 로 파일에 붙이면 됩니다.',
          solution: 'mkdir -p ~/cloud70/day2\nip -br a > ~/cloud70/day2/ip.txt\ncurl -s ifconfig.me >> ~/cloud70/day2/ip.txt\necho >> ~/cloud70/day2/ip.txt\ncat ~/cloud70/day2/ip.txt',
          check: 'grep -q "10\\.0\\.2\\.15" ~/cloud70/day2/ip.txt && grep -q "203\\.0\\.113\\.25" ~/cloud70/day2/ip.txt',
          checkOk: '사설 10.0.2.15 와 공인 203.0.113.25 가 모두 있습니다.',
          checkFail: '파일에 10.0.2.15 와 203.0.113.25 가 둘 다 있어야 합니다.'
        }
      ],
      quiz: [
        { q: '클라우드 VM 안에서 <code>ip a</code> 를 보면 공인 IP 가 보이지 않는 이유는?', options: ['VM 이 꺼져서', '공인 IP 는 밖의 클라우드 네트워크가 NAT 로 붙여 주기 때문', 'ip 명령이 잘못돼서', 'IPv6 만 써서'], answer: 1, explain: 'VM 에는 사설 IP 만 있고, 공인 IP 는 게이트웨이에서 변환됩니다.' },
        { q: '인터넷에 절대 열면 안 되는 포트는?', options: ['22', '80', '443', '3306'], answer: 3, explain: 'DB 포트는 서버 안이나 내부망에서만 씁니다.' },
        { q: '<code>dig +short google.com</code> 의 결과는?', options: ['google.com 의 IP 주소', '내 공인 IP', 'google.com 까지의 시간', '포트 목록'], answer: 0, explain: 'DNS 질의로 이름을 IP 로 바꿉니다.' }
      ],
      slides: [
        { layout: 'title', title: '네트워크를 명령으로 보기', subtitle: '주소 · 문 · 이름', notes: '<p>"서버에 접속하려면 무엇이 필요할까요?" — 주소 · 문 · 열쇠를 이끌어 냅니다.</p>' },
        { layout: 'code', title: '사설 IP vs 공인 IP', code: 'ip -br a\ncurl -s ifconfig.me', points: ['사설: 10.x · 172.16~31.x · 192.168.x', 'NAT 가 공인 IP 로 바꿔 준다', '클라우드 VM 도 같은 구조'], notes: '<p>옆 사람과 ifconfig.me 결과를 비교하게 합니다. 같은 공인 IP 가 나오는 이유를 묻습니다.</p>' },
        { layout: 'table', title: '포트', head: ['포트', '용도', '공개'], rows: [['22', 'SSH', '내 IP'], ['80 · 443', '웹', '모두'], ['3306', 'DB', '절대 X']], notes: '<p>7 · 8일차에 이 표대로 방화벽을 엽니다.</p>' },
        { layout: 'summary', title: '정리', bullets: ['사설 IP 는 안, 공인 IP 는 밖', 'DNS 는 이름을 IP 로', '포트는 서비스의 문 번호', 'DB 포트는 인터넷에 열지 않는다'], notes: '<p>다음 교시: 열쇠(SSH 키) 만들기.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day02-2',
      title: 'SSH 키 만들고 키로 접속하기',
      minutes: 120,
      goals: [
        'ssh-keygen 으로 ed25519 키 쌍을 만든다',
        '공개키 · 개인키의 역할과 권한(600)을 설명할 수 있다',
        '공개키를 authorized_keys 에 등록해 비밀번호 없이 접속한다',
        '~/.ssh/config 로 접속 단축 이름을 만든다'
      ],
      flow: [['자물쇠와 열쇠', 15], ['키 만들기', 25], ['서버에 공개키 등록', 35], ['config 단축 이름', 25], ['정리 · 퀴즈', 20]],
      content: [
        { type: 'p', html: 'SSH 키는 두 파일로 된 한 쌍입니다. <b>공개키(.pub)</b> 는 자물쇠라서 여러 서버에 달아 두어도 되고, <b>개인키</b> 는 그 자물쇠를 여는 유일한 열쇠라서 내 PC 밖으로 절대 내보내지 않습니다. 이 과정에서는 키 하나로 AWS · Azure · Google Cloud · Oracle 서버에 모두 접속합니다.' },
        { type: 'cmd', title: '키 쌍 만들기', code: 'ssh-keygen -t ed25519 -C "student@cloud70" -f ~/.ssh/id_ed25519 -N ""\nls -l ~/.ssh\ncat ~/.ssh/id_ed25519.pub', desc: '실제 PC 에서는 <code>-N ""</code> 를 빼고 암호(passphrase)를 거는 것을 권장합니다. 개인키는 <code>-rw-------</code>(600)로 만들어집니다.' },
        { type: 'callout', kind: 'warn', title: '개인키 사고 예방', html: '<ul><li><code>id_ed25519</code>(.pub 없는 파일)는 카톡 · 메일 · GitHub · 과제 제출물에 절대 올리지 않습니다</li><li>권한이 넓으면 SSH 가 <code>UNPROTECTED PRIVATE KEY FILE!</code> 이라며 거부합니다 → <code>chmod 600 ~/.ssh/id_ed25519</code></li></ul>' },
        { type: 'h', text: '공개키를 서버에 등록 = 클라우드 콘솔에 붙여넣기' },
        { type: 'p', html: '클라우드 콘솔에서 VM 을 만들 때 "SSH 공개키 붙여넣기" 칸에 넣은 한 줄은, 서버의 <code>~/.ssh/authorized_keys</code> 파일에 들어갑니다. 여기서는 같은 일을 손으로 해 봅니다. 이 가상 서버의 <code>localhost</code> 를 "클라우드 서버" 라고 생각하세요.' },
        { type: 'cmd', title: '공개키 등록하고 키로 접속', code: 'cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys\nchmod 600 ~/.ssh/authorized_keys\nchmod 700 ~/.ssh\nssh -o BatchMode=yes student@localhost hostname', desc: '<code>BatchMode=yes</code> 는 비밀번호를 묻지 말라는 뜻입니다. 키가 제대로 등록되었으면 비밀번호 없이 <code>ubuntu</code> 가 출력됩니다. 처음 접속하면 서버 지문(fingerprint)을 확인하고 <code>~/.ssh/known_hosts</code> 에 저장합니다.' },
        { type: 'h', text: '~/.ssh/config — 접속 단축 이름' },
        { type: 'file', path: '/home/student/.ssh/config', mode: '600', title: '6일차부터 매일 쓸 설정', code: 'Host cloud70\n    HostName localhost\n    User student\n    IdentityFile ~/.ssh/id_ed25519', desc: '6일차에 Oracle 서버를 만들면 <code>HostName</code> 만 그 서버의 공인 IP 로 바꿉니다. 그 뒤로는 <code>ssh cloud70</code> 한 단어로 접속합니다.' },
        { type: 'cmd', title: '단축 이름으로 접속', code: 'chmod 600 ~/.ssh/config\nssh cloud70 uptime', desc: '접속 뒤 바로 명령을 붙이면 그 명령만 실행하고 돌아옵니다.' },
        { type: 'callout', kind: 'vm', title: '실제 클라우드에서 — Windows 에서 키 찾기', html: '<p>WSL 의 홈 폴더는 Windows 탐색기 주소창에 <code>\\\\wsl$\\Ubuntu-24.04\\home\\사용자</code> 로 열 수 있습니다. 클라우드 콘솔에 붙여 넣을 때는 파일을 올리기보다 <code>cat ~/.ssh/id_ed25519.pub</code> 출력 한 줄을 복사하는 편이 쉽습니다.</p>' }
      ],
      practice: [
        {
          title: '실습 2-2. 키로만 접속되게 하기',
          level: 2,
          desc: '<p>ed25519 키를 만들고(이미 있으면 그대로 사용) 공개키를 <code>~/.ssh/authorized_keys</code> 에 등록하세요. <code>ssh -o BatchMode=yes student@localhost hostname</code> 이 비밀번호 없이 성공해야 합니다.</p>',
          hint: '<code>test -f ~/.ssh/id_ed25519 || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519</code> → <code>cat ~/.ssh/id_ed25519.pub &gt;&gt; ~/.ssh/authorized_keys</code> → 권한 700 / 600',
          solution: 'test -f ~/.ssh/id_ed25519 || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 -C student@cloud70\ncat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys\nchmod 700 ~/.ssh\nchmod 600 ~/.ssh/authorized_keys\nssh -o BatchMode=yes student@localhost hostname',
          check: 'test -f ~/.ssh/id_ed25519 && [ "$(stat -c %a ~/.ssh/id_ed25519)" = 600 ] && grep -qF "$(cut -d" " -f2 ~/.ssh/id_ed25519.pub)" ~/.ssh/authorized_keys && [ "$(stat -c %a ~/.ssh/authorized_keys)" = 600 ]',
          checkOk: '키가 등록되었고 권한도 올바릅니다.',
          checkFail: '<code>cat ~/.ssh/authorized_keys</code> 에 내 공개키가 있는지, 개인키 · authorized_keys 가 600 인지 확인하세요.'
        },
        {
          title: '실습 2-3. 단축 이름 cloud70',
          level: 2,
          desc: '<p><code>~/.ssh/config</code> 에 <code>Host cloud70</code> 항목을 만들어 <code>ssh cloud70 hostname</code> 이 되게 하세요. 권한은 600 이어야 합니다.</p>',
          hint: '위 📄 파일 블록의 <b>💾 가상 머신에 저장</b>을 누른 뒤 <code>chmod 600 ~/.ssh/config</code>',
          solution: 'printf "Host cloud70\\n    HostName localhost\\n    User student\\n    IdentityFile ~/.ssh/id_ed25519\\n" > ~/.ssh/config\nchmod 600 ~/.ssh/config\nssh -o BatchMode=yes cloud70 hostname',
          check: 'grep -qi "^Host cloud70" ~/.ssh/config && [ "$(stat -c %a ~/.ssh/config)" = 600 ]',
          checkOk: '이제 ssh cloud70 으로 접속합니다.',
          checkFail: '<code>cat ~/.ssh/config</code> 에 Host cloud70 이 있는지, 권한이 600 인지 확인하세요.'
        }
      ],
      quiz: [
        { q: '클라우드 콘솔의 "SSH 공개키" 칸에 붙여 넣는 파일은?', options: ['~/.ssh/id_ed25519', '~/.ssh/id_ed25519.pub', '~/.ssh/known_hosts', '~/.ssh/config'], answer: 1, explain: '공개키(.pub)만 서버에 등록합니다.' },
        { q: '서버에 등록된 공개키가 저장되는 파일은?', options: ['~/.ssh/known_hosts', '~/.ssh/authorized_keys', '/etc/passwd', '~/.ssh/config'], answer: 1, explain: 'sshd 는 authorized_keys 의 공개키로 접속을 허용합니다.' },
        { q: '개인키 권한이 644 일 때 생기는 일은?', options: ['잘 접속된다', 'SSH 가 키 사용을 거부한다', '서버가 꺼진다', '공개키가 지워진다'], answer: 1, explain: 'UNPROTECTED PRIVATE KEY FILE 경고와 함께 키를 무시합니다. chmod 600 으로 고칩니다.' },
        { q: '<code>ssh cloud70 uptime</code> 이 동작하려면 어느 파일이 필요한가?', options: ['/etc/hosts', '~/.ssh/config', '~/.bashrc', '/etc/ssh/sshd_config'], answer: 1, explain: 'Host 별칭은 클라이언트 쪽 ~/.ssh/config 에 둡니다.' }
      ],
      slides: [
        { layout: 'title', title: 'SSH 키', subtitle: '자물쇠(공개키)와 열쇠(개인키)', notes: '<p>"비밀번호 대신 키를 쓰는 이유는?" — 무차별 대입 공격 이야기로 시작합니다.</p>' },
        { layout: 'code', title: '키 만들기', code: 'ssh-keygen -t ed25519 -C "student@cloud70"\nls -l ~/.ssh\ncat ~/.ssh/id_ed25519.pub', points: ['.pub = 공개키 (서버에)', '개인키 = 600, 절대 공유 X'], notes: '<p>실제 PC 에서는 passphrase 를 걸도록 권합니다.</p>' },
        { layout: 'code', title: '콘솔에 붙여넣기 = authorized_keys', code: 'cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys\nchmod 600 ~/.ssh/authorized_keys\nssh -o BatchMode=yes student@localhost hostname', points: ['클라우드 콘솔이 대신 해 주는 일', 'BatchMode = 비밀번호 묻지 않기'], notes: '<p>▶ 로 실행하고 비밀번호 없이 들어가는 것을 보여 줍니다.</p>' },
        { layout: 'code', title: '~/.ssh/config', path: '~/.ssh/config', lang: 'text', code: 'Host cloud70\n    HostName <서버 공인 IP>\n    User ubuntu\n    IdentityFile ~/.ssh/id_ed25519', points: ['ssh cloud70 한 단어로', '6일차에 HostName 만 바꾼다'], notes: '<p>6일차 예고.</p>' },
        { layout: 'summary', title: '정리', bullets: ['공개키는 서버에, 개인키는 내 PC 에만', 'authorized_keys = 등록된 자물쇠 목록', '키 · 폴더 권한 600 / 700', 'config 로 접속 단축'], notes: '<p>오후에는 실제 클라우드 가입과 안전장치입니다.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day02-3',
      title: '클라우드 가입과 안전장치',
      minutes: 120,
      goals: [
        'AWS 를 무료 플랜으로, Google Cloud · Oracle Cloud 를 올바른 리전으로 가입한다',
        '루트 계정과 IAM 사용자를 구분하고 모두 MFA 를 건다',
        '세 클라우드에 $1 예산 알림을 만든다',
        '예산 알림은 과금을 막지 않고 알려 줄 뿐임을 안다'
      ],
      flow: [['왜 안전장치가 먼저인가', 10], ['AWS 가입 · MFA · 예산 · IAM', 40], ['Google Cloud 가입 · 예산', 25], ['Oracle 가입 · 홈 리전', 30], ['정리', 15]],
      content: [
        { type: 'callout', kind: 'warn', title: '순서를 바꾸지 마세요', html: '<p>가입이 끝나면 <b>서버를 만들기 전에</b> ① MFA ② 예산 알림부터 겁니다. 클라우드 과금 사고의 대부분은 "만든 줄 몰랐던 리소스" 와 "도용된 계정" 에서 나옵니다.</p>' },
        { type: 'h', text: 'AWS — 무료 플랜과 안전장치' },
        { type: 'list', ordered: true, items: ['<code>aws.amazon.com/free</code> → <b>무료 계정 생성</b>. 요금제 선택에서 반드시 <b>Free plan(무료 플랜)</b>', '연락처 · 카드 · 휴대폰 인증 (카드 확인용 소액 승인은 곧 취소)', '콘솔 오른쪽 위 리전을 <b>아시아 태평양(서울) ap-northeast-2</b> 로', '계정 이름 → <b>보안 자격 증명</b> → <b>MFA 디바이스 할당</b> → 인증 앱', '검색창 <b>Budgets</b> → 예산 생성 → 템플릿 → <b>제로 지출 예산(Zero spend budget)</b>', '<b>IAM</b> → 사용자 생성 <code>admin</code> · 콘솔 액세스 · <code>AdministratorAccess</code> · MFA. 내일부터 루트가 아닌 admin 으로'] },
        { type: 'callout', kind: 'info', title: '무료 플랜의 의미', html: '<p>AWS 무료 플랜은 크레딧이 끝나거나 6개월이 지나면 계정이 닫히고, 직접 업그레이드하지 않는 한 청구되지 않습니다. 과정 중에는 <b>유료 플랜으로 전환하지 않습니다</b>.</p>' },
        { type: 'cmd', title: '(연습) 지금 누구로 로그인했나 — CloudShell 명령', code: 'aws sts get-caller-identity', desc: '오른쪽 터미널의 <code>aws</code> 는 실제 AWS 에 연결하지 않는 <b>연습용 CLI</b> 입니다. 실제 CloudShell 에서도 같은 명령으로 Arn 끝이 <code>user/admin</code> 인지(루트가 아닌지) 확인합니다.' },
        { type: 'h', text: 'Google Cloud' },
        { type: 'list', ordered: true, items: ['<code>cloud.google.com/free</code> → 무료로 시작하기 → 개인 Google 계정, 국가 대한민국, 계정 유형 <b>개인</b>', '콘솔 위쪽에서 프로젝트 만들기: <code>cloud70-학번</code>', '<code>myaccount.google.com/security</code> → <b>2단계 인증</b>', '결제 → <b>예산 및 알림</b> → 예산 1달러(원화 계정은 1,000원), 알림 50 · 90 · 100%'] },
        { type: 'cmd', title: '(연습) 프로젝트 설정 확인', code: 'gcloud config set project cloud70-student\ngcloud config list', desc: '실제 Cloud Shell 에서도 <code>project = </code> 줄이 내 프로젝트인지 먼저 확인하는 습관을 들입니다.' },
        { type: 'h', text: 'Oracle Cloud — 홈 리전은 한 번뿐' },
        { type: 'list', ordered: true, items: ['<code>oracle.com/cloud/free</code> → Start for free', '<b>Home Region</b> 을 <code>South Korea Central (Seoul)</code> 또는 <code>South Korea North (Chuncheon)</code> — <b>나중에 바꿀 수 없음</b>', '카드 확인 · 이메일 인증 (승인까지 몇 시간 걸릴 수 있어 오늘 미리)', '첫 로그인 때 요구하는 MFA 등록', 'Billing &amp; Cost Management → Budgets → 금액 1, Actual Spend 100% 알림'] },
        { type: 'callout', kind: 'tip', title: '가입이 거절되면', html: '<p>카드 문제나 일시적인 용량 문제인 경우가 많습니다. 같은 날 여러 번 시도하지 말고 기록해 두세요. 6일차에 Google Cloud e2-micro 로 대체할 수 있습니다.</p>' },
        { type: 'callout', kind: 'vm', title: '실제 클라우드에서 — 오늘의 산출물', html: '<ol><li><code>cat ~/.ssh/id_ed25519.pub</code> 결과 (공개키만! 개인키는 0점)</li><li>AWS MFA 할당 화면과 제로 지출 예산 화면</li><li>Google Cloud 예산 화면</li><li>Oracle 홈 리전이 보이는 화면과 예산 화면</li><li>네트워크 명령 결과와 확인 질문 답</li></ol>' }
      ],
      practice: [
        {
          title: '실습 2-4. 안전장치 점검표',
          level: 1,
          desc: '<p><code>~/cloud70/day2/safety.md</code> 에 세 클라우드(AWS · Google · Oracle) 각각의 <b>MFA</b> 와 <b>예산</b> 설정 여부를 적으세요. 각 줄에 클라우드 이름, "MFA", "예산" 이 들어가야 합니다.</p>',
          hint: '예) <code>AWS | MFA 완료 | 예산 Zero spend</code>',
          solution: 'mkdir -p ~/cloud70/day2\ncat > ~/cloud70/day2/safety.md <<\'EOF\'\nAWS | MFA 완료 (루트 + admin) | 예산 Zero spend budget\nGoogle | MFA 2단계 인증 | 예산 1달러\nOracle | MFA 등록 | 예산 1\nEOF\ncat ~/cloud70/day2/safety.md',
          check: 'f=~/cloud70/day2/safety.md; for c in AWS Google Oracle; do grep -i "$c" $f | grep -qi mfa && grep -i "$c" $f | grep -q 예산 || exit 1; done',
          checkOk: '세 클라우드 모두 MFA 와 예산이 적혀 있습니다.',
          checkFail: '각 줄에 클라우드 이름 · MFA · 예산 세 단어가 모두 있어야 합니다.'
        }
      ],
      quiz: [
        { q: 'AWS 가입 직후, 서버를 만들기 전에 할 일 두 가지는?', options: ['EC2 생성 · S3 생성', 'MFA · 예산 알림', '유료 플랜 전환 · 리전 변경', 'IAM 삭제 · 루트 사용'], answer: 1, explain: '계정 도용과 모르는 과금을 먼저 막습니다.' },
        { q: '예산 알림이 하는 일은?', options: ['예산을 넘으면 자동으로 리소스를 지운다', '예산에 가까워지거나 넘으면 메일로 알려 준다', '과금을 0원으로 막는다', '카드 결제를 거절한다'], answer: 1, explain: '알림일 뿐입니다. 알림을 받으면 직접 리소스를 확인하고 지워야 합니다.' },
        { q: 'Oracle Cloud 가입 때 특히 주의할 설정은?', options: ['언어', '홈 리전 — 나중에 바꿀 수 없다', '시간대', '테마'], answer: 1, explain: 'Always Free 리소스는 홈 리전에서만 만들 수 있습니다.' }
      ],
      slides: [
        { layout: 'title', title: '가입과 안전장치', subtitle: '서버보다 MFA · 예산이 먼저', notes: '<p>실제 과금 사고 뉴스(계정 도용 후 GPU 채굴)를 짧게 보여 주면 효과적입니다.</p>' },
        { layout: 'table', title: '세 클라우드 체크리스트', head: ['클라우드', 'MFA', '예산'], rows: [['AWS', '루트 + IAM admin', 'Zero spend budget'], ['Google Cloud', '2단계 인증', '1달러 · 50/90/100%'], ['Oracle', '첫 로그인 MFA', '1 · Actual 100%']], notes: '<p>표를 칠판에 두고 한 줄씩 체크합니다.</p>' },
        { layout: 'bullets', title: '주의', bullets: ['AWS 는 <b>무료 플랜</b> 선택', 'Oracle <b>홈 리전</b>은 서울/춘천 — 변경 불가', '예산 알림은 알려 줄 뿐, 막아 주지 않는다', '카드 번호는 어디에도 기록하지 않는다'], notes: '<p>가입 중 막히는 학생을 돌아다니며 확인합니다.</p>' },
        { layout: 'summary', title: '오늘 한 일', bullets: ['IP · DNS · 포트를 명령으로', 'SSH 키 쌍과 authorized_keys', '세 클라우드 가입', '모든 계정에 MFA · 예산'], notes: '<p>내일은 AWS 에서 첫 서버(EC2)를 만듭니다.</p>' }
      ]
    }
  ]
});
