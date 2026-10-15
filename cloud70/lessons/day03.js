UBUNTU_COURSE.addChapter({
  id: 'day03',
  no: '03',
  icon: '🟧',
  title: 'AWS — EC2와 S3',
  subtitle: 'Amazon EC2, Security Groups & S3 Static Website',
  summary: '처음으로 클라우드에 서버를 만듭니다. EC2(가상 서버)에 내 SSH 키로 접속해 Nginx 웹페이지를 띄우고, S3 로 서버 없는 정적 웹사이트를 만들어 둘을 비교합니다. 마지막에는 만든 것을 전부 지우고 CLI 로 남은 것이 없음을 확인합니다.',
  goals: [
    'EC2 인스턴스를 프리 티어 조건으로 만들고 내 SSH 키로 접속한다',
    '보안 그룹으로 포트를 열고 Nginx 웹페이지를 띄운다',
    'S3 버킷으로 서버 없는 정적 웹사이트를 만든다',
    'CloudShell(aws CLI)로 남은 리소스를 확인하고 모두 정리한다'
  ],
  sections: [
    // =====================================================================
    {
      id: 'day03-1',
      title: '첫 EC2 만들기',
      minutes: 120,
      goals: [
        'AMI · 인스턴스 유형 · 키 페어 · 보안 그룹의 뜻을 말할 수 있다',
        '어제 만든 공개키를 AWS 키 페어로 가져온다',
        '프리 티어 인스턴스를 만들고 SSH 로 접속한다'
      ],
      flow: [['EC2 구성 요소', 25], ['키 페어 가져오기', 20], ['인스턴스 시작', 40], ['SSH 접속', 20], ['정리 · 퀴즈', 15]],
      content: [
        { type: 'table', head: ['용어', '뜻', '오늘 고르는 값'], rows: [['AMI', '서버의 설치 이미지 (OS)', 'Ubuntu Server 24.04 LTS'], ['인스턴스 유형', 'CPU · 메모리 크기', '"프리 티어 사용 가능" 표시 (예: <code>t3.micro</code>)'], ['키 페어', 'SSH 접속용 공개키', '<code>cloud70-key</code> (어제 만든 키)'], ['보안 그룹', 'EC2 에 붙는 방화벽', 'SSH: 내 IP, HTTP: 모두'], ['EBS', 'EC2 의 디스크', '기본 8GiB gp3']] },
        { type: 'callout', kind: 'warn', title: '세 가지 원칙', html: '<ul><li>루트가 아니라 어제 만든 IAM 사용자 <b>admin</b> 으로 로그인</li><li>콘솔 오른쪽 위 리전이 <b>서울</b>인지 매번 확인 — 다른 리전에 만든 것은 안 보여서 못 지웁니다</li><li>"<b>프리 티어 사용 가능</b>" 표시가 없는 것은 고르지 않기</li></ul>' },
        { type: 'h', text: '1) 내 공개키를 AWS 키 페어로 가져오기' },
        { type: 'callout', kind: 'vm', title: '실제 콘솔에서', html: '<p>EC2 → <b>네트워크 및 보안 → 키 페어</b> → <b>작업 → 키 페어 가져오기</b> → 이름 <code>cloud70-key</code>, 내용 칸에 <code>cat ~/.ssh/id_ed25519.pub</code> 한 줄 붙여넣기. AWS 에서 새 키를 "생성" 하면 .pem 을 따로 관리해야 하므로, 키 하나로 4개 클라우드를 쓰려고 "가져오기" 를 씁니다.</p>' },
        { type: 'cmd', title: '(연습) CloudShell 에서 같은 일', code: 'test -f ~/.ssh/id_ed25519 || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 -q\naws ec2 import-key-pair --key-name cloud70-key --public-key-material fileb://~/.ssh/id_ed25519.pub\naws ec2 describe-key-pairs --output table', desc: '오른쪽 <code>aws</code> 는 연습용 CLI 입니다. 실제 CloudShell 에서는 내 PC 의 공개키 파일을 먼저 업로드해야 하므로 콘솔에서 하는 편이 쉽습니다.' },
        { type: 'h', text: '2) 인스턴스 시작' },
        { type: 'callout', kind: 'vm', title: '실제 콘솔에서 — EC2 → 인스턴스 시작', html: '<ul><li>이름 <code>web-학번</code> · AMI <b>Ubuntu Server 24.04 LTS (프리 티어 사용 가능)</b></li><li>인스턴스 유형: "프리 티어 사용 가능" 표시가 있는 것 (예: <code>t3.micro</code>)</li><li>키 페어 <code>cloud70-key</code></li><li>네트워크 설정: 보안 그룹 생성 · <b>SSH 트래픽 허용: 내 IP</b> · 인터넷에서 HTTP 트래픽 허용 체크</li><li>스토리지 기본값 → <b>인스턴스 시작</b> → 상태 "실행 중", 상태 검사 2/2 가 되면 퍼블릭 IPv4 복사</li></ul>' },
        { type: 'cmd', title: '(연습) CLI 로 인스턴스 만들기', code: 'aws ec2 run-instances --image-id ami-ubuntu-24.04 --instance-type t2.large --key-name cloud70-key\naws ec2 run-instances --image-id ami-ubuntu-24.04 --instance-type t3.micro --key-name cloud70-key \\\n  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=web-student}]" \\\n  --query "Instances[0].InstanceId" --output text\naws ec2 describe-instances --query "Reservations[].Instances[].[InstanceId,InstanceType,State.Name,PublicIpAddress]" --output table', desc: '첫 명령은 일부러 무료 플랜에서 허용되지 않는 유형(<code>t2.large</code>)을 골라 오류를 봅니다. 두 번째가 올바른 프리 티어 유형입니다.' },
        { type: 'callout', kind: 'warn', title: 'SSH 를 위치 무관(0.0.0.0/0)으로 열지 않기', html: '<p>인터넷 전체에 22번을 열면 몇 분 안에 자동 스캐너가 비밀번호 대입을 시작합니다. 보안 그룹의 SSH 원본은 <b>내 IP</b> 로 둡니다. 와이파이가 바뀌면 그때 규칙을 다시 저장합니다.</p>' },
        { type: 'h', text: '3) SSH 로 접속' },
        { type: 'cmd', vm: true, title: '내 PC(WSL)에서 실제 EC2 로', code: 'ssh ubuntu@<퍼블릭 IP>', expect: 'The authenticity of host \'3.35.x.x\' can\'t be established.\nED25519 key fingerprint is SHA256:...\nAre you sure you want to continue connecting (yes/no)? yes\nubuntu@ip-172-31-12-34:~$', desc: 'Ubuntu AMI 의 기본 사용자는 <code>ubuntu</code> 입니다. 프롬프트가 <code>ubuntu@ip-172-31-...</code> 로 바뀌면 서울의 AWS 서버에서 명령이 실행되는 것입니다.' },
        { type: 'cmd', title: '접속하면 바로 확인하는 것 (가상 서버에서 연습)', code: 'uname -a; nproc; free -h; df -h /\nip -br a\ncurl -s ifconfig.me; echo', desc: 'EC2 에서는 <code>ip a</code> 의 <code>172.31.x.x</code> 가 VPC 안의 사설 IP, <code>ifconfig.me</code> 가 콘솔에 보이는 퍼블릭 IP 와 같은지 확인합니다.' }
      ],
      practice: [
        {
          title: '실습 3-1. 프리 티어 인스턴스 만들기 (연습용 CLI)',
          level: 1,
          desc: '<p>연습용 <code>aws</code> CLI 로 키 페어 <code>cloud70-key</code> 를 가져오고, 그 키로 <b>프리 티어</b> 인스턴스(<code>t3.micro</code>) 한 대를 실행 중 상태로 만드세요.</p>',
          hint: '<code>aws ec2 import-key-pair --key-name cloud70-key --public-key-material fileb://~/.ssh/id_ed25519.pub</code> → <code>aws ec2 run-instances --image-id ami-ubuntu-24.04 --instance-type t3.micro --key-name cloud70-key</code>',
          solution: 'test -f ~/.ssh/id_ed25519 || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 -q\naws ec2 describe-key-pairs --query "KeyPairs[].KeyName" --output text | grep -q cloud70-key || aws ec2 import-key-pair --key-name cloud70-key --public-key-material fileb://~/.ssh/id_ed25519.pub\naws ec2 run-instances --image-id ami-ubuntu-24.04 --instance-type t3.micro --key-name cloud70-key --query "Instances[0].InstanceId" --output text',
          check: 'aws ec2 describe-key-pairs --query "KeyPairs[].KeyName" --output text 2>/dev/null | grep -q cloud70-key && aws ec2 describe-instances --query "Reservations[].Instances[?State.Name==\'running\'].[InstanceType,KeyName]" --output text 2>/dev/null | grep -q "t3.micro.*cloud70-key"',
          checkOk: 'cloud70-key 로 t3.micro 가 실행 중입니다.',
          checkFail: '<code>aws ec2 describe-instances --output table</code> 로 t3.micro 가 running 이고 KeyName 이 cloud70-key 인지 확인하세요.'
        }
      ],
      quiz: [
        { q: 'EC2 에 붙는 방화벽의 이름은?', options: ['NSG', '보안 그룹', '보안 목록', 'iptables'], answer: 1, explain: 'AWS 는 보안 그룹, Azure 는 NSG, Oracle 은 보안 목록이라고 부릅니다.' },
        { q: 'Ubuntu AMI 로 만든 EC2 에 접속할 때 사용자 이름은?', options: ['root', 'ec2-user', 'ubuntu', 'admin'], answer: 2, explain: 'Amazon Linux 는 ec2-user, Ubuntu 는 ubuntu 입니다.' },
        { q: '보안 그룹의 SSH 원본으로 가장 알맞은 것은?', options: ['0.0.0.0/0', '내 IP', '모든 IPv6', '비워 둔다'], answer: 1, explain: 'SSH 는 관리자만 쓰므로 내 IP 로 좁힙니다.' },
        { q: '키 페어를 "생성" 대신 "가져오기" 하는 이유는?', options: ['더 빨라서', '이미 가진 키 하나로 여러 클라우드를 쓰려고', '무료라서', '생성은 유료라서'], answer: 1, explain: '어제 만든 공개키를 그대로 등록하면 .pem 을 따로 관리할 필요가 없습니다.' }
      ],
      slides: [
        { layout: 'title', title: '첫 EC2', subtitle: '클라우드에 서버를 빌린다', notes: '<p>오늘 하루 목표: 만들고 → 접속하고 → 웹을 띄우고 → 지운다.</p>' },
        { layout: 'table', title: 'EC2 를 만들 때 고르는 것', head: ['항목', '선택'], rows: [['AMI', 'Ubuntu 24.04 LTS'], ['유형', '프리 티어 표시 (t3.micro)'], ['키 페어', 'cloud70-key'], ['보안 그룹', 'SSH 내 IP · HTTP 모두']], notes: '<p>콘솔 화면을 띄우고 함께 클릭합니다. 리전 확인을 반복해서 강조합니다.</p>' },
        { layout: 'code', title: '(연습) CLI 로 같은 일', code: 'aws ec2 import-key-pair --key-name cloud70-key \\\n  --public-key-material fileb://~/.ssh/id_ed25519.pub\naws ec2 run-instances --image-id ami-ubuntu-24.04 \\\n  --instance-type t3.micro --key-name cloud70-key', points: ['t2.large 는 무료 플랜 오류', '콘솔 클릭 = API 호출'], notes: '<p>콘솔에서 누르는 모든 버튼이 결국 이런 API 호출이라는 점을 보여 줍니다.</p>' },
        { layout: 'code', title: '접속', code: 'ssh ubuntu@<퍼블릭 IP>\nuname -a; free -h\nip -br a; curl -s ifconfig.me', points: ['사용자 ubuntu', '172.31.x.x = VPC 사설 IP'], notes: '<p>접속이 안 되는 학생: 보안 그룹 "내 IP" 가 현재 IP 와 같은지부터 봅니다.</p>' },
        { layout: 'summary', title: '정리', bullets: ['AMI · 유형 · 키 페어 · 보안 그룹', '프리 티어 표시만 고른다', 'SSH 는 내 IP 에만', '리전은 매번 확인'], notes: '<p>다음 교시: 이 서버에 웹을 띄웁니다.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day03-2',
      title: '웹 서버 띄우고 다뤄 보기',
      minutes: 120,
      goals: [
        'Nginx 를 설치하고 웹페이지를 바꿀 수 있다',
        '보안 그룹 규칙이 외부 접속을 어떻게 막는지 실험으로 확인한다',
        '인스턴스 메타데이터와 중지/종료의 차이를 안다'
      ],
      flow: [['Nginx 설치', 25], ['페이지 바꾸기', 20], ['보안 그룹 실험', 30], ['메타데이터 · 중지와 종료', 30], ['정리 · 퀴즈', 15]],
      content: [
        { type: 'p', html: '이 교시의 명령은 실제 EC2 에 SSH 로 접속해서 실행합니다. 오른쪽 가상 서버도 같은 Ubuntu 라서 먼저 연습해 볼 수 있습니다.' },
        { type: 'cmd', title: 'Nginx 설치와 첫 페이지', code: 'sudo apt update && sudo apt install -y nginx\nsystemctl is-active nginx\necho \'<h1>Hello from AWS EC2 · 학번</h1>\' | sudo tee /var/www/html/index.html\ncurl -s localhost', desc: '<code>sudo tee</code> 는 관리자 권한으로 파일에 쓰는 방법입니다. <code>sudo echo ... &gt; 파일</code> 은 리다이렉션이 일반 사용자 권한으로 실행되어 실패합니다.' },
        { type: 'callout', kind: 'vm', title: '실제 클라우드에서 — 브라우저로 접속', html: '<p>브라우저에서 <code>http://퍼블릭IP</code> 로 접속합니다. <b>https 가 아니라 http</b> 입니다. 그다음 보안 그룹 인바운드 규칙에서 HTTP(80) 규칙을 지웠다가 다시 접속해 보고, 확인 후 규칙을 다시 추가합니다.</p>' },
        { type: 'h', text: '방화벽 실험 — 밖에서 접속해 보기' },
        { type: 'p', html: '가상 서버에는 <code>labclient</code> 명령이 있습니다. "인터넷의 다른 PC 에서 이 서버로 접속하기" 를 흉내 냅니다. 클라우드 방화벽은 <code>seclist</code> 명령으로 다룹니다(AWS 보안 그룹 = Azure NSG = Oracle 보안 목록). 이 가상 서버는 Oracle 서버처럼 서버 안 iptables 도 막혀 있어서 <b>두 곳</b>을 열어야 합니다.' },
        { type: 'cmd', title: '닫혀 있을 때 · 열었을 때', code: 'seclist\nlabclient curl -sS -m 3 http://203.0.113.25\nseclist add 80\nsudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT\nlabclient curl -s http://203.0.113.25', desc: '처음에는 <code>Timeout</code>(클라우드 방화벽이 버림), 열고 나면 내 페이지가 보입니다. AWS EC2 의 Ubuntu 에는 iptables 차단 규칙이 없어서 보안 그룹만 열면 됩니다. iptables 는 7일차 Oracle 에서 자세히 다룹니다.' },
        { type: 'h', text: '서버가 자기 자신을 알아내기 — 메타데이터' },
        { type: 'cmd', vm: true, title: '실제 EC2 안에서 (IMDSv2)', code: 'TOKEN=$(curl -sX PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60")\nmd() { curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/$1; echo; }\nmd instance-type\nmd placement/availability-zone\nmd public-ipv4', expect: 't3.micro\nap-northeast-2a\n3.35.123.45', desc: '<code>169.254.169.254</code> 는 클라우드 VM 안에서만 통하는 특별한 주소입니다. 가용영역 <code>ap-northeast-2a</code> 의 a 가 서울 리전 안의 데이터센터 묶음 하나입니다.' },
        { type: 'h', text: '중지 vs 종료' },
        { type: 'table', head: ['동작', '컴퓨팅 요금', '디스크(EBS)', '퍼블릭 IP'], rows: [['중지(stop)', '멈춤', '남음 (용량만큼 과금)', '<b>바뀜</b>'], ['시작(start)', '다시 나옴', '그대로', '새 IP'], ['종료(terminate)', '멈춤', '삭제 (기본값)', '반납']] },
        { type: 'cmd', title: '(연습) 중지했다 켜면 IP 가 바뀐다', code: 'ID=$(aws ec2 describe-instances --query "Reservations[].Instances[?State.Name==\'running\'].InstanceId" --output text | awk \'{print $1}\')\naws ec2 describe-instances --instance-ids $ID --query "Reservations[].Instances[].PublicIpAddress" --output text\naws ec2 stop-instances --instance-ids $ID --output table\naws ec2 start-instances --instance-ids $ID --output table\naws ec2 describe-instances --instance-ids $ID --query "Reservations[].Instances[].PublicIpAddress" --output text', desc: 'IP 가 바뀌면 도메인이 엉뚱한 곳을 가리키게 됩니다. 8일차에는 IP 가 바뀌어도 도메인이 따라오게 만듭니다.' }
      ],
      practice: [
        {
          title: '실습 3-2. 내 웹페이지 띄우기',
          level: 1,
          desc: '<p>가상 서버에 Nginx 를 설치하고, 첫 화면이 <code>Hello from AWS EC2</code> 를 포함하도록 바꾸세요. <code>curl -s localhost</code> 결과에 그 문구가 보여야 합니다.</p>',
          hint: '<code>sudo apt install -y nginx</code> → <code>echo \'&lt;h1&gt;Hello from AWS EC2&lt;/h1&gt;\' | sudo tee /var/www/html/index.html</code>',
          solution: 'sudo apt install -y nginx\necho \'<h1>Hello from AWS EC2 · student</h1>\' | sudo tee /var/www/html/index.html\ncurl -s localhost',
          check: 'curl -s localhost | grep -q "Hello from AWS EC2"',
          checkOk: '웹페이지가 바뀌었습니다.',
          checkFail: '<code>curl -s localhost</code> 결과에 Hello from AWS EC2 가 있는지 확인하세요.'
        },
        {
          title: '실습 3-3. 밖에서 열리게 하기',
          level: 2,
          desc: '<p><code>labclient curl -s http://203.0.113.25</code> 로 <b>밖에서</b> 내 페이지가 보이게 하세요. 클라우드 방화벽(<code>seclist</code>)과 서버 방화벽(<code>iptables</code>) 두 곳을 열어야 합니다.</p>',
          hint: '<code>seclist add 80</code> → <code>sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT</code>',
          solution: 'seclist add 80\nsudo iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT\nlabclient curl -s http://203.0.113.25',
          check: 'labclient curl -s -m 3 http://203.0.113.25 2>/dev/null | grep -q "Hello from AWS EC2"',
          checkOk: '인터넷의 다른 PC 에서도 내 페이지가 열립니다.',
          checkFail: '<code>seclist</code> 에 TCP 80 이 있는지, <code>sudo iptables -L INPUT -n --line-numbers</code> 에서 80 ACCEPT 가 REJECT 보다 위에 있는지 확인하세요.'
        }
      ],
      quiz: [
        { q: '<code>sudo echo hi &gt; /var/www/html/index.html</code> 이 Permission denied 인 이유는?', options: ['echo 가 없어서', '리다이렉션(&gt;)은 sudo 가 아닌 내 권한으로 실행되기 때문', 'nginx 가 꺼져서', '파일이 없어서'], answer: 1, explain: '그래서 <code>| sudo tee 파일</code> 을 씁니다.' },
        { q: 'EC2 를 <b>중지</b>했다 시작하면 생기는 일은?', options: ['디스크가 지워진다', '퍼블릭 IP 가 바뀐다', '키 페어가 바뀐다', '아무 일 없다'], answer: 1, explain: '디스크는 남고 퍼블릭 IP 는 새로 받습니다.' },
        { q: '밖에서 접속이 <b>Timeout</b> 으로 끝났다. 가장 먼저 의심할 것은?', options: ['Nginx 버전', '클라우드 방화벽(보안 그룹)에 포트가 없음', '디스크 부족', 'DNS'], answer: 1, explain: '방화벽이 패킷을 버리면 응답 없이 시간이 초과됩니다.' }
      ],
      slides: [
        { layout: 'title', title: '웹 서버 띄우기', subtitle: 'Nginx · 보안 그룹 · 메타데이터', notes: '<p>모두 같은 시간에 브라우저로 자기 EC2 를 열게 합니다.</p>' },
        { layout: 'code', title: 'Nginx', code: 'sudo apt install -y nginx\necho \'<h1>Hello from AWS EC2</h1>\' | sudo tee /var/www/html/index.html\ncurl -s localhost', points: ['sudo tee 로 쓰기', 'http:// 로 접속'], notes: '<p>sudo echo > 가 왜 안 되는지 질문합니다.</p>' },
        { layout: 'code', title: '방화벽 실험', code: 'labclient curl -sS -m 3 http://203.0.113.25\nseclist add 80\nsudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT\nlabclient curl -s http://203.0.113.25', points: ['Timeout = 클라우드 방화벽', '서버 안 방화벽도 따로'], notes: '<p>실제 EC2 에서는 보안 그룹 규칙을 지웠다 다시 넣는 실험을 합니다.</p>' },
        { layout: 'table', title: '중지 vs 종료', head: ['동작', '디스크', 'IP'], rows: [['중지', '남음(과금)', '바뀜'], ['종료', '삭제', '반납']], notes: '<p>중지해도 디스크 요금은 나온다는 점을 강조합니다.</p>' },
        { layout: 'summary', title: '정리', bullets: ['Nginx 로 웹페이지', '포트는 방화벽에서 열어야 보인다', '메타데이터 169.254.169.254', '중지하면 IP 가 바뀐다'], notes: '<p>다음 교시: 서버 없는 웹(S3)과 정리.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day03-3',
      title: 'S3 정적 웹사이트와 정리',
      minutes: 120,
      goals: [
        'S3 버킷을 만들고 파일을 올려 정적 웹사이트로 공개한다',
        '퍼블릭 액세스 차단과 버킷 정책의 관계를 설명할 수 있다',
        'EC2 와 S3 웹을 서비스 모델 · 관리 책임 · 과금으로 비교한다',
        'CLI 출력으로 모든 리소스가 정리되었음을 증명한다'
      ],
      flow: [['S3 와 객체 스토리지', 15], ['버킷 · 업로드 · 웹사이트', 35], ['공개 설정', 25], ['EC2 vs S3', 15], ['전부 지우기', 30]],
      content: [
        { type: 'p', html: '<b>S3</b> 는 파일(객체)을 저장하는 서비스입니다. 서버를 띄우지 않아도 HTML 파일을 올려 웹사이트로 공개할 수 있습니다. 실제로는 콘솔 위쪽 <code>&gt;_</code> 아이콘의 <b>CloudShell</b> 에서 아래 명령을 그대로 실행합니다.' },
        { type: 'cmd', title: '버킷 만들고 올리기', code: 'B=cloud70-2026123-site\naws s3 mb s3://$B --region ap-northeast-2\naws s3 mb s3://클라우드\necho \'<meta charset="utf-8"><h1>서버 없는 웹 · S3</h1>\' > index.html\naws s3 cp index.html s3://$B/ --content-type "text/html; charset=utf-8"\naws s3 website s3://$B/ --index-document index.html\ncurl -s http://$B.s3-website.ap-northeast-2.amazonaws.com', desc: '버킷 이름은 <b>전 세계에서 하나</b>, 영어 소문자 · 숫자 · 하이픈만 됩니다(두 번째 명령은 일부러 실패). <code>B=</code> 의 학번을 내 것으로 바꾸세요. 아직은 <b>403 Forbidden</b> 입니다 — S3 는 기본이 비공개입니다.' },
        { type: 'h', text: '이 페이지 하나만 공개하기' },
        { type: 'file', path: '/home/student/policy.json', title: '버킷 정책 — 모두에게 읽기만 허용', code: '{\n  "Version": "2012-10-17",\n  "Statement": [{\n    "Effect": "Allow",\n    "Principal": "*",\n    "Action": "s3:GetObject",\n    "Resource": "arn:aws:s3:::cloud70-2026123-site/*"\n  }]\n}', desc: 'Resource 의 버킷 이름을 내 버킷으로 바꿉니다. 끝의 <code>/*</code> 는 "버킷 안의 모든 객체" 입니다.' },
        { type: 'cmd', title: '차단을 풀고 정책 적용', code: 'aws s3api put-bucket-policy --bucket $B --policy file://policy.json\naws s3api put-public-access-block --bucket $B \\\n  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false\naws s3api put-bucket-policy --bucket $B --policy file://policy.json\ncurl -s http://$B.s3-website.ap-northeast-2.amazonaws.com', desc: '첫 명령은 실패합니다. <b>퍼블릭 액세스 차단</b>이 켜져 있으면 공개 정책 자체를 넣을 수 없습니다. 차단의 "정책" 부분만 풀고 다시 넣으면 페이지가 열립니다.' },
        { type: 'callout', kind: 'warn', title: '공개 버킷은 웹사이트용만', html: '<p>이 버킷에는 공개해도 되는 파일만 올립니다. 과제 · 개인 사진 · 키를 공개 버킷에 올리는 것이 실제 유출 사고의 가장 흔한 원인입니다.</p>' },
        { type: 'h', text: 'EC2 vs S3' },
        { type: 'table', head: ['비교', 'EC2 + Nginx', 'S3 정적 웹사이트'], rows: [['서비스 모델', 'IaaS', '관리형 스토리지 (서버리스)'], ['OS 업데이트', '내가', '없음 (AWS)'], ['할 수 있는 일', '무엇이든 (DB · 앱 실행)', 'HTML · 이미지 같은 정적 파일만'], ['과금 기준', '켜져 있는 시간', '저장 용량 · 요청 수']] },
        { type: 'h', text: '전부 지우고 확인하기' },
        { type: 'cmd', title: '정리 — 지운 것도 증거를 남긴다', code: 'aws s3 rb s3://$B --force\nfor id in $(aws ec2 describe-instances --query "Reservations[].Instances[?State.Name!=\'terminated\'].InstanceId" --output text); do aws ec2 terminate-instances --instance-ids $id --output text; done\naws ec2 describe-instances --query "Reservations[].Instances[].[InstanceId,State.Name]" --output table\naws ec2 describe-volumes --query "Volumes[].VolumeId" --output text\naws ec2 describe-addresses --output table\naws s3 ls', desc: '인스턴스는 <code>terminated</code>, 볼륨 · 탄력적 IP · 버킷은 비어 있어야 합니다. 실제 콘솔에서는 <b>결제 및 비용 관리 → 크레딧</b>에서 남은 크레딧도 확인합니다.' },
        { type: 'callout', kind: 'vm', title: '실제 클라우드에서 — 오늘의 산출물', html: '<ol><li>EC2 Nginx 페이지 화면 (주소창의 IP 포함)</li><li>보안 그룹 인바운드 규칙 (SSH 내 IP, HTTP)</li><li>S3 웹사이트 화면 (주소창 포함)</li><li>EC2 vs S3 비교표</li><li>정리 확인 CLI 출력 전체 — 없으면 보안·비용 0점</li></ol>' }
      ],
      practice: [
        {
          title: '실습 3-4. S3 웹사이트 공개하기',
          level: 2,
          desc: '<p>내 학번이 들어간 버킷을 만들어 <code>index.html</code> 을 올리고, <code>http://버킷.s3-website.ap-northeast-2.amazonaws.com</code> 에서 <b>S3</b> 라는 글자가 보이게 공개하세요.</p>',
          hint: 'mb → cp → website → put-public-access-block(BlockPublicPolicy=false, RestrictPublicBuckets=false) → put-bucket-policy',
          solution: 'B=cloud70-2026123-site\naws s3 mb s3://$B --region ap-northeast-2\necho \'<meta charset="utf-8"><h1>서버 없는 웹 · S3</h1>\' > ~/index.html\naws s3 cp ~/index.html s3://$B/ --content-type "text/html; charset=utf-8"\naws s3 website s3://$B/ --index-document index.html\naws s3api put-public-access-block --bucket $B --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false\nprintf \'{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::%s/*"}]}\' $B > ~/policy.json\naws s3api put-bucket-policy --bucket $B --policy file://$HOME/policy.json\ncurl -s http://$B.s3-website.ap-northeast-2.amazonaws.com',
          check: 'for b in $(aws s3 ls 2>/dev/null | awk \'{print $3}\'); do curl -s http://$b.s3-website.ap-northeast-2.amazonaws.com | grep -q S3 && exit 0; done; exit 1',
          checkOk: 'S3 웹사이트가 공개되었습니다.',
          checkFail: '<code>curl -s http://버킷.s3-website.ap-northeast-2.amazonaws.com</code> 결과가 403 이면 공개 설정, 404 면 website 설정이나 index.html 을 확인하세요.'
        },
        {
          title: '실습 3-5. 전부 지우기',
          level: 1,
          desc: '<p>실행 중이거나 중지된 인스턴스를 모두 종료하고, S3 버킷도 모두 지우세요. <code>aws s3 ls</code> 가 비어 있고 terminated 가 아닌 인스턴스가 없어야 합니다.</p>',
          hint: '<code>aws s3 rb s3://버킷 --force</code>, <code>aws ec2 terminate-instances --instance-ids i-...</code>',
          solution: 'for b in $(aws s3 ls | awk \'{print $3}\'); do aws s3 rb s3://$b --force; done\nfor id in $(aws ec2 describe-instances --query "Reservations[].Instances[?State.Name!=\'terminated\'].InstanceId" --output text); do aws ec2 terminate-instances --instance-ids $id --output text; done\naws ec2 describe-instances --query "Reservations[].Instances[].[InstanceId,State.Name]" --output table\naws s3 ls',
          check: '[ -z "$(aws ec2 describe-instances --query "Reservations[].Instances[?State.Name!=\'terminated\'].InstanceId" --output text 2>/dev/null)" ] && [ -z "$(aws s3 ls 2>/dev/null)" ] && [ -n "$(aws ec2 describe-instances --query "Reservations[].Instances[].InstanceId" --output text 2>/dev/null)" ]',
          checkOk: '남은 리소스가 없습니다. 오늘의 가장 중요한 일을 했습니다.',
          checkFail: '<code>aws ec2 describe-instances --output table</code> 과 <code>aws s3 ls</code> 로 남은 것을 확인하세요. (인스턴스를 한 번도 만들지 않았다면 실습 3-1 부터)'
        }
      ],
      quiz: [
        { q: 'S3 버킷 이름으로 가능한 것은?', options: ['Cloud70_Site', '클라우드70', 'cloud70-2026123-site', 'cloud70..site'], answer: 2, explain: '소문자 · 숫자 · 하이픈, 전 세계에서 유일해야 합니다.' },
        { q: '버킷 정책을 넣는데 AccessDenied ... BlockPublicPolicy 가 나왔다. 이유는?', options: ['정책 JSON 오류', '퍼블릭 액세스 차단이 공개 정책을 막고 있음', '리전이 다름', '파일이 없음'], answer: 1, explain: '차단 설정의 정책 부분(BlockPublicPolicy · RestrictPublicBuckets)을 먼저 풀어야 합니다.' },
        { q: 'S3 정적 웹사이트로 <b>할 수 없는</b> 것은?', options: ['HTML 페이지 공개', '이미지 공개', 'DB 와 연결된 로그인 처리', 'CSS · JS 파일 제공'], answer: 2, explain: '서버 코드 실행이 없으므로 정적 파일만 제공합니다.' },
        { q: '정리 후 남아 있으면 안 되는 것이 아닌 것은?', options: ['running 인스턴스', '볼륨', 'S3 버킷', 'terminated 인스턴스 기록'], answer: 3, explain: 'terminated 기록은 잠시 보이다 사라지며 과금되지 않습니다.' }
      ],
      slides: [
        { layout: 'title', title: '서버 없는 웹 · S3', subtitle: '그리고 전부 지우기', notes: '<p>"서버 없이 웹사이트를 열 수 있을까요?" 로 시작합니다.</p>' },
        { layout: 'code', title: '버킷 → 업로드 → 웹사이트', code: 'aws s3 mb s3://$B --region ap-northeast-2\naws s3 cp index.html s3://$B/\naws s3 website s3://$B/ --index-document index.html\ncurl -s http://$B.s3-website.ap-northeast-2.amazonaws.com', points: ['이름은 전 세계 유일', '처음엔 403 — 기본 비공개'], notes: '<p>403 을 보고 "왜?" 를 묻습니다.</p>' },
        { layout: 'bullets', title: '공개 = 두 단계', bullets: ['퍼블릭 액세스 차단의 정책 부분 해제', '버킷 정책: 모두에게 GetObject 만', '공개 버킷엔 공개해도 되는 파일만'], notes: '<p>실제 유출 사고 사례를 짧게.</p>' },
        { layout: 'code', title: '정리 확인', code: 'aws s3 rb s3://$B --force\naws ec2 terminate-instances --instance-ids i-...\naws ec2 describe-instances --output table\naws ec2 describe-volumes\naws s3 ls', points: ['출력이 정리의 증거', '리전마다 따로 확인'], notes: '<p>모든 학생의 정리 출력을 확인하고 퇴실시킵니다.</p>' },
        { layout: 'summary', title: '오늘 한 일', bullets: ['EC2 생성 · SSH · Nginx', '보안 그룹과 방화벽 실험', 'S3 정적 웹사이트', '전부 지우고 증명'], notes: '<p>내일은 같은 일을 Azure 에서 합니다.</p>' }
      ]
    }
  ]
});
