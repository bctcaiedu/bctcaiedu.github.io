UBUNTU_COURSE.addChapter({
  id: 'day06',
  no: '06',
  icon: '🟥',
  title: '내 무료 서버 — Oracle Cloud',
  subtitle: 'Always Free A1 서버 만들기와 첫 한 시간',
  summary: '오늘부터 마지막 날까지 <b>한 대의 무료 서버</b>를 계속 키웁니다. Oracle Cloud 의 Always Free A1 서버(Arm 2 OCPU · 12GB)를 만들고, 서버를 받으면 가장 먼저 하는 일(업데이트 · 시간대 · 호스트 이름 · 자동 보안 업데이트 · 스왑)을 합니다. 그리고 Oracle 서버의 특징인 <b>두 겹 방화벽</b>(보안 목록 + 서버 안 iptables)을 가상 서버에서 직접 실험합니다.',
  goals: [
    'Oracle Cloud 에 VCN 과 Always Free A1 인스턴스를 만든다',
    '새 서버의 첫 설정(업데이트 · 시간대 · 호스트 이름 · 자동 업데이트 · 스왑)을 마친다',
    '보안 목록과 iptables 두 겹 방화벽을 구분하고, 응답 형태(시간 초과 · 거부)로 어느 쪽에서 막혔는지 판단한다',
    '~/.ssh/config 로 한 단어 접속을 만든다'
  ],
  sections: [
    // =====================================================================
    {
      id: 'day06-1',
      title: 'Oracle 무료 서버 만들기',
      minutes: 120,
      goals: [
        'Always Free 대상(Shape · OCPU · 메모리 · 디스크)을 말할 수 있다',
        'VCN 마법사로 네트워크를 만들고 A1 인스턴스를 띄운다',
        '"Out of capacity" 를 만났을 때의 대처를 안다'
      ],
      flow: [['Always Free 이해', 20], ['VCN 만들기', 25], ['인스턴스 만들기', 45], ['첫 접속', 20], ['정리', 10]],
      content: [
        { type: 'p', html: 'Oracle Cloud(OCI)의 <b>Always Free</b> 는 기간 제한이 없고, 다른 회사보다 사양이 넉넉합니다. 이 과정의 나머지 4일은 모두 이 서버 한 대 위에서 진행합니다.' },
        { type: 'table', head: ['자원', 'Always Free 한도', '오늘 쓸 값'], rows: [['Arm 서버 (VM.Standard.A1.Flex)', '합계 2 OCPU · 12GB 메모리 (월 1,500 OCPU 시간 · 9,000 GB 시간)', '<b>2 OCPU · 12GB</b> 한 대 (전부)'], ['x86 서버 (VM.Standard.E2.1.Micro)', '2대 · 각 1/8 OCPU · 1GB', '— (A1 이 안 될 때 대안)'], ['블록 볼륨(부팅 디스크 포함)', '합계 200GB', '부팅 50GB'], ['공인 IP', '임시(Ephemeral) IP', '자동 할당'], ['아웃바운드 트래픽', '월 10TB', '']] },
        { type: 'callout', kind: 'warn', title: '무료 계정의 두 가지 특징', html: '<ul><li><b>홈 리전은 바꿀 수 없습니다.</b> 가입 때 고른 리전(서울 · 춘천)에서만 Always Free 서버를 만들 수 있습니다.</li><li>A1 서버는 인기가 많아 <b>"Out of capacity for shape VM.Standard.A1.Flex"</b> 가 자주 나옵니다. 다른 가용성 도메인(AD)을 고르거나, OCPU 를 1 · 메모리 6GB 로 줄이거나, 시간을 바꿔 다시 시도합니다. 그래도 안 되면 E2.1.Micro 로 진행하고, 수업은 5일차 GCP e2-micro 를 예비로 씁니다.</li></ul>' },
        { type: 'h', text: '1단계 — VCN(가상 네트워크) 만들기' },
        { type: 'callout', kind: 'vm', title: '실제 콘솔에서 — 네트워킹 → 가상 클라우드 네트워크', html: '<ol><li><b>VCN 마법사 시작</b> → "인터넷 연결이 있는 VCN 생성"</li><li>이름 <code>vcn-cloud70</code> · 나머지 기본값 → 다음 → 생성</li><li>만들어지는 것: VCN(10.0.0.0/16), 공용 서브넷, 인터넷 게이트웨이, 라우트 테이블, <b>기본 보안 목록(Default Security List)</b></li></ol><p>보안 목록이 AWS 보안 그룹 · Azure NSG 에 해당합니다. 처음에는 22번(SSH)과 ICMP 일부만 열려 있습니다.</p>' },
        { type: 'figure', html: '<svg viewBox="0 0 680 200" style="width:100%;height:auto" font-family="var(--sans)"><rect x="10" y="10" width="520" height="180" rx="14" fill="var(--card2)" stroke="var(--line)"/><text x="28" y="36" font-size="14" font-weight="700" fill="var(--fg)">VCN vcn-cloud70 · 10.0.0.0/16</text><rect x="40" y="52" width="330" height="124" rx="10" fill="var(--card)" stroke="var(--line)" stroke-dasharray="5 4"/><text x="56" y="76" font-size="13" fill="var(--muted)">공용 서브넷 10.0.0.0/24 · 보안 목록</text><rect x="90" y="92" width="230" height="66" rx="10" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="205" y="120" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fg)">cloud70 (A1.Flex)</text><text x="205" y="142" text-anchor="middle" font-size="12" fill="var(--muted)">안에도 iptables 방화벽</text><rect x="400" y="92" width="110" height="50" rx="10" fill="var(--card)" stroke="var(--line)"/><text x="455" y="122" text-anchor="middle" font-size="12" fill="var(--fg)">인터넷 게이트웨이</text><path d="M510 117 H600" stroke="var(--accent)" stroke-width="3"/><text x="640" y="122" text-anchor="middle" font-size="22">🌐</text></svg>', caption: 'Oracle 서버는 보안 목록(서브넷) + iptables(서버 안) 두 겹으로 보호됩니다' },
        { type: 'h', text: '2단계 — 인스턴스 만들기' },
        { type: 'callout', kind: 'vm', title: '실제 콘솔에서 — 컴퓨트 → 인스턴스 → 인스턴스 생성', html: '<ul><li>이름 <code>cloud70</code></li><li>이미지 변경 → <b>Canonical Ubuntu 24.04</b> (aarch64 이미지가 자동 선택)</li><li>Shape 변경 → Ampere → <b>VM.Standard.A1.Flex</b> · OCPU 2 · 메모리 12GB — "Always Free 적격" 표시 확인</li><li>네트워킹: <code>vcn-cloud70</code> 의 공용 서브넷 · <b>공용 IPv4 주소 자동 할당</b></li><li>SSH 키: <b>공개 키 붙여넣기</b> → <code>cat ~/.ssh/id_ed25519.pub</code> 출력 붙여넣기</li><li>부팅 볼륨: 50GB (기본 약 47GB)</li></ul>' },
        { type: 'cmd', title: '붙여 넣을 공개키 꺼내기 (내 PC · WSL)', code: 'test -f ~/.ssh/id_ed25519 || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 -q\ncat ~/.ssh/id_ed25519.pub', desc: '2일차에 만든 그 키입니다. 개인키(<code>id_ed25519</code>)는 절대 붙여 넣지 않습니다.' },
        { type: 'cmd', vm: true, title: '첫 접속 — 사용자 이름은 ubuntu', code: 'ssh ubuntu@<공인 IP>\nuname -m; nproc; free -h; df -h /', expect: 'aarch64\n2\n               total        used        free\nMem:            11Gi       512Mi        10Gi\nFilesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        45G  2.1G   43G   5% /', desc: '<code>aarch64</code> = Arm 프로세서. 우리가 쓸 Ubuntu 패키지 · Docker 이미지는 대부분 Arm 판도 있어서 차이를 거의 느끼지 못합니다.' },
        { type: 'callout', kind: 'info', title: '가상 서버와 다른 점', html: '<p>오른쪽 가상 서버는 실제 Oracle 서버를 흉내 냅니다. 공인 IP <code>203.0.113.25</code>, 보안 목록(<code>seclist</code>), Oracle 기본 iptables 규칙이 똑같이 들어 있습니다. 다만 프로세서는 <code>x86_64</code> 이고 메모리도 작습니다.</p>' },
        { type: 'cmd', title: '가상 서버 둘러보기', code: 'hostname; uname -m; ip -br addr\ncurl -s ifconfig.me; echo\nseclist show', desc: '<code>seclist</code> 는 콘솔의 보안 목록 화면을 대신하는 연습용 명령입니다.' }
      ],
      practice: [
        {
          title: '실습 6-1. 서버 기록 카드',
          level: 1,
          desc: '<p><code>~/cloud70/day6/server.md</code> 에 내 서버의 기록 카드를 쓰세요. <b>공인 IP</b>(가상 서버는 203.0.113.25), <b>Shape</b>(VM.Standard.A1.Flex), <b>리전</b>, 그리고 VCN 이름이 들어가야 합니다.</p>',
          hint: '<code>curl -s ifconfig.me</code> 로 공인 IP 를 확인하고 nano 로 적으세요.',
          solution: 'mkdir -p ~/cloud70/day6\ncat > ~/cloud70/day6/server.md <<EOF\n# 내 무료 서버\n- 공인 IP: $(curl -s ifconfig.me)\n- Shape: VM.Standard.A1.Flex (2 OCPU / 12GB)\n- 리전: ap-chuncheon-1\n- VCN: vcn-cloud70\nEOF\ncat ~/cloud70/day6/server.md',
          check: 'f=~/cloud70/day6/server.md; grep -q 203.0.113.25 $f && grep -q A1.Flex $f && grep -qi vcn $f && grep -qiE "리전|region" $f',
          checkOk: '서버 기록 카드가 완성되었습니다. 실제 서버의 값으로도 채워 두세요.',
          checkFail: '공인 IP(203.0.113.25), A1.Flex, 리전, VCN 이 모두 들어 있는지 확인하세요.'
        }
      ],
      quiz: [
        { q: 'Oracle Always Free A1 서버의 합계 한도는?', options: ['1 OCPU · 1GB', '2 OCPU · 12GB', '4 OCPU · 24GB', '무제한'], answer: 1, explain: '여러 대로 나눠도 합계가 2 OCPU · 12GB 이하이면 무료입니다. (예전 4 OCPU · 24GB 는 2026년 문서에서 줄었습니다)' },
        { q: '"Out of capacity for shape VM.Standard.A1.Flex" 의 대처로 알맞지 <b>않은</b> 것은?', options: ['다른 가용성 도메인 선택', 'OCPU 를 줄여서 재시도', '홈 리전을 다른 곳으로 변경', '시간을 바꿔 재시도'], answer: 2, explain: '무료 계정의 홈 리전은 바꿀 수 없습니다.' },
        { q: 'Oracle Ubuntu 이미지의 기본 사용자 이름은?', options: ['opc', 'ubuntu', 'azureuser', 'root'], answer: 1, explain: 'Oracle Linux 이미지는 opc, Ubuntu 이미지는 ubuntu 입니다.' }
      ],
      slides: [
        { layout: 'title', title: '내 무료 서버 — Oracle Cloud', subtitle: '오늘부터 끝까지 키울 한 대', notes: '<p>6~10일차의 흐름(서버 → 웹 → Docker → HTTPS → 백업 → 보안)을 먼저 보여 줍니다.</p>' },
        { layout: 'table', title: 'Always Free', head: ['자원', '한도'], rows: [['A1.Flex (Arm)', '2 OCPU · 12GB'], ['E2.1.Micro (x86)', '2대 · 1GB'], ['블록 볼륨', '200GB'], ['트래픽', '월 10TB']], notes: '<p>다른 회사 무료 VM 과 메모리를 비교해 보게 합니다.</p>' },
        { layout: 'bullets', title: '만들기 순서', bullets: ['VCN 마법사 (인터넷 연결)', '인스턴스: Ubuntu 24.04 · A1.Flex 2/12', '공개키 붙여넣기', 'ssh ubuntu@공인IP'], notes: '<p>Out of capacity 가 나면 당황하지 않게 미리 말해 둡니다.</p>' },
        { layout: 'summary', title: '정리', bullets: ['Always Free = 기간 제한 없음', '홈 리전 고정 · 용량 부족 대처', '사용자 ubuntu · 아키텍처 aarch64'], notes: '<p>다음: 서버를 받으면 가장 먼저 할 일.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day06-2',
      title: '서버를 받으면 첫 한 시간',
      minutes: 130,
      goals: [
        '업데이트 · 시간대 · 호스트 이름 · 자동 보안 업데이트를 설정한다',
        '스왑 파일을 만들고 재부팅 뒤에도 유지되게 한다',
        '~/.ssh/config 로 한 단어 접속을 만든다'
      ],
      flow: [['업데이트', 15], ['시간대 · 이름', 25], ['자동 업데이트', 20], ['스왑', 35], ['SSH 설정', 25], ['정리', 10]],
      content: [
        { type: 'cmd', title: '1. 업데이트', code: 'sudo apt update\nsudo apt upgrade -y\nls /var/run/reboot-required 2>/dev/null && echo "재부팅 필요" || echo "재부팅 불필요"', desc: '커널이 업데이트되면 <code>/var/run/reboot-required</code> 가 생깁니다. 실제 서버라면 <code>sudo reboot</code> 후 1분 뒤 다시 접속합니다.' },
        { type: 'cmd', title: '2. 시간대를 한국으로', code: 'timedatectl\nsudo timedatectl set-timezone Asia/Seoul\ndate', desc: '클라우드 서버의 기본 시간대는 UTC 입니다. 로그와 cron 시각을 읽기 쉽게 한국 시간으로 바꿉니다.' },
        { type: 'cmd', title: '3. 호스트 이름 — 그리고 sudo 경고 막기', code: 'sudo hostnamectl set-hostname cloud70\nsudo true\necho "127.0.1.1 cloud70" | sudo tee -a /etc/hosts\nsudo true && hostname', desc: '이름만 바꾸면 sudo 가 <code>unable to resolve host cloud70</code> 경고를 냅니다. <code>/etc/hosts</code> 에 새 이름을 적어 주면 사라집니다. 프롬프트의 이름은 다음 로그인부터 바뀝니다.' },
        { type: 'cmd', title: '4. 자동 보안 업데이트 확인', code: 'dpkg -l unattended-upgrades | tail -1\ncat /etc/apt/apt.conf.d/20auto-upgrades', desc: '두 값이 모두 <code>"1"</code> 이면 매일 보안 업데이트가 자동 설치됩니다. 없으면 <code>sudo dpkg-reconfigure -plow unattended-upgrades</code> 로 켭니다.' },
        { type: 'h', text: '5. 스왑 — 메모리 여유분' },
        { type: 'p', html: '메모리가 부족하면 프로그램이 강제로 종료(OOM)됩니다. 디스크 일부를 비상용 메모리로 쓰는 <b>스왑</b>을 만들어 두면 Docker 이미지 빌드처럼 순간적으로 메모리를 많이 쓰는 작업이 안전해집니다. 메모리가 1GB 인 E2.1.Micro 나 e2-micro 에서는 필수입니다.' },
        { type: 'cmd', title: '1GB 스왑 파일', code: 'free -h\nsudo fallocate -l 1G /swapfile\nsudo chmod 600 /swapfile\nsudo mkswap /swapfile\nsudo swapon /swapfile\nswapon --show\necho \'/swapfile none swap sw 0 0\' | sudo tee -a /etc/fstab', desc: '<code>/etc/fstab</code> 에 적어야 재부팅 뒤에도 켜집니다. <code>chmod 600</code> 을 빼먹으면 <code>insecure permissions</code> 경고가 나옵니다.' },
        { type: 'callout', kind: 'warn', title: '/etc/fstab 은 조심', html: '<p>오타가 있으면 서버가 부팅하지 못할 수 있습니다. <code>tee -a</code>(덧붙이기)를 쓰고, <code>-a</code> 를 빼먹어 파일을 덮어쓰지 않았는지 <code>cat /etc/fstab</code> 으로 꼭 확인합니다.</p>' },
        { type: 'h', text: '6. 한 단어로 접속하기' },
        { type: 'file', path: '~/.ssh/config', mode: '600', title: '내 PC 의 SSH 설정에 추가', code: 'Host oracle\n    HostName 203.0.113.25\n    User ubuntu\n    IdentityFile ~/.ssh/id_ed25519\n    ServerAliveInterval 60', desc: '실제로는 HostName 에 내 서버의 공인 IP 를 적습니다. 이제 <code>ssh oracle</code> 만 치면 됩니다. <code>ServerAliveInterval</code> 은 접속이 쉬는 동안 끊기지 않게 합니다.' },
        { type: 'cmd', vm: true, title: '내 PC 에서', code: 'ssh oracle\nscp ~/cloud70/day6/server.md oracle:~/', desc: 'scp · rsync 도 같은 별명을 씁니다.' }
      ],
      practice: [
        {
          title: '실습 6-2. 시간대와 호스트 이름',
          level: 1,
          desc: '<p>시간대를 <code>Asia/Seoul</code>, 호스트 이름을 <code>cloud70</code> 으로 바꾸고 <code>/etc/hosts</code> 에도 등록해 sudo 경고가 나오지 않게 하세요.</p>',
          hint: '<code>timedatectl set-timezone</code> · <code>hostnamectl set-hostname</code> · <code>echo "127.0.1.1 cloud70" | sudo tee -a /etc/hosts</code>',
          solution: 'sudo timedatectl set-timezone Asia/Seoul\nsudo hostnamectl set-hostname cloud70\necho "127.0.1.1 cloud70" | sudo tee -a /etc/hosts',
          check: 'timedatectl | grep -q "Asia/Seoul" && [ "$(hostname)" = cloud70 ] && grep -qw cloud70 /etc/hosts',
          checkOk: '시간대 · 이름 · hosts 모두 맞습니다.',
          checkFail: '<code>timedatectl</code>, <code>hostname</code>, <code>grep cloud70 /etc/hosts</code> 를 각각 확인하세요.'
        },
        {
          title: '실습 6-3. 재부팅에도 남는 스왑',
          level: 2,
          desc: '<p><code>/swapfile</code> 에 1GB 스왑을 만들어 켜고, 권한을 600 으로, <code>/etc/fstab</code> 에 등록하세요.</p>',
          hint: 'fallocate → chmod 600 → mkswap → swapon → fstab 에 한 줄',
          solution: 'sudo fallocate -l 1G /swapfile\nsudo chmod 600 /swapfile\nsudo mkswap /swapfile\nsudo swapon /swapfile\necho \'/swapfile none swap sw 0 0\' | sudo tee -a /etc/fstab',
          check: 'swapon --show | grep -q "^/swapfile" && [ "$(stat -c %a /swapfile)" = 600 ] && grep -q "^/swapfile" /etc/fstab && grep -q "^/swap.img" /etc/fstab',
          checkOk: '스왑이 켜져 있고 fstab 에도 들어 있습니다.',
          checkFail: '<code>swapon --show</code>, <code>ls -l /swapfile</code>, <code>cat /etc/fstab</code> 을 확인하세요. fstab 의 기존 줄이 지워졌다면 <code>-a</code> 를 빼먹은 것입니다.'
        },
        {
          title: '실습 6-4. ssh oracle',
          level: 1,
          desc: '<p><code>~/.ssh/config</code> 에 <code>Host oracle</code> 항목(HostName 203.0.113.25 · User ubuntu · IdentityFile)을 추가하세요. 파일 권한은 600 이어야 합니다.</p>',
          hint: '<code>nano ~/.ssh/config</code> 후 <code>chmod 600 ~/.ssh/config</code>',
          solution: 'mkdir -p ~/.ssh && chmod 700 ~/.ssh\ncat >> ~/.ssh/config <<\'EOF\'\nHost oracle\n    HostName 203.0.113.25\n    User ubuntu\n    IdentityFile ~/.ssh/id_ed25519\n    ServerAliveInterval 60\nEOF\nchmod 600 ~/.ssh/config',
          check: 'f=/home/student/.ssh/config; grep -qE "^Host +oracle" $f && grep -qE "HostName +203.0.113.25" $f && grep -qE "User +ubuntu" $f && [ "$(stat -c %a $f)" = 600 ]',
          checkOk: '이제 ssh oracle 한 마디로 접속합니다.',
          checkFail: 'Host oracle · HostName · User ubuntu 줄과 권한 600 을 확인하세요.'
        }
      ],
      quiz: [
        { q: '호스트 이름만 바꾼 뒤 sudo 가 내는 경고를 없애려면?', options: ['재설치', '/etc/hosts 에 새 이름 추가', 'sudo 삭제', '시간대 변경'], answer: 1, explain: 'sudo 가 자기 호스트 이름을 찾을 수 있어야 합니다.' },
        { q: '스왑을 재부팅 뒤에도 유지하려면?', options: ['swapon 을 두 번', '/etc/fstab 에 등록', 'chmod 777', 'free -h'], answer: 1, explain: '부팅 때 fstab 의 스왑 항목이 자동으로 켜집니다.' },
        { q: '<code>/etc/apt/apt.conf.d/20auto-upgrades</code> 가 하는 일은?', options: ['방화벽 설정', '매일 자동 보안 업데이트', 'SSH 키 관리', 'DNS 설정'], answer: 1, explain: 'unattended-upgrades 가 이 값을 보고 동작합니다.' }
      ],
      slides: [
        { layout: 'title', title: '첫 한 시간', subtitle: '업데이트 · 시간 · 이름 · 자동 업데이트 · 스왑', notes: '<p>"서버를 받으면 하는 루틴" 으로 외우게 합니다.</p>' },
        { layout: 'code', title: '루틴', code: 'sudo apt update && sudo apt upgrade -y\nsudo timedatectl set-timezone Asia/Seoul\nsudo hostnamectl set-hostname cloud70\necho "127.0.1.1 cloud70" | sudo tee -a /etc/hosts\ncat /etc/apt/apt.conf.d/20auto-upgrades', points: ['UTC → KST', '이름 + hosts 함께'], notes: '<p>sudo 경고를 일부러 보여 주고 hosts 로 고칩니다.</p>' },
        { layout: 'code', title: '스왑 1GB', code: 'sudo fallocate -l 1G /swapfile\nsudo chmod 600 /swapfile\nsudo mkswap /swapfile && sudo swapon /swapfile\necho \'/swapfile none swap sw 0 0\' | sudo tee -a /etc/fstab', points: ['권한 600', 'fstab 은 -a'], notes: '<p>fstab 오타의 위험을 꼭 말합니다.</p>' },
        { layout: 'summary', title: '정리', bullets: ['서버 첫 루틴 5가지', 'ssh oracle 한 단어 접속', '다음: 두 겹 방화벽'], notes: '' }
      ]
    },
    // =====================================================================
    {
      id: 'day06-3',
      title: '두 겹 방화벽 실험',
      minutes: 130,
      goals: [
        '보안 목록(바깥)과 iptables(안쪽)의 역할을 구분한다',
        '시간 초과와 연결 거부로 어느 층에서 막혔는지 판단한다',
        '실험이 끝나면 열었던 포트를 정확히 닫는다'
      ],
      flow: [['iptables 읽기', 25], ['테스트 서버', 15], ['한 겹씩 열기', 45], ['닫기', 20], ['정리', 15]],
      content: [
        { type: 'p', html: 'AWS · Azure · GCP 는 콘솔에서 포트를 열면 끝이었습니다. Oracle 의 Ubuntu 이미지는 <b>서버 안에도 iptables 방화벽</b>이 켜져 있어서, 콘솔과 서버 <b>두 곳</b>을 모두 열어야 합니다. 이걸 모르면 "콘솔에서 열었는데 왜 안 되지?" 하고 몇 시간을 보내게 됩니다.' },
        { type: 'cmd', title: 'Oracle 기본 iptables 규칙 읽기', code: 'sudo iptables -L INPUT -n --line-numbers', desc: '위에서부터 차례로 검사합니다. 5번이 22번 포트 허용, 마지막 6번 <code>REJECT</code> 가 "나머지는 모두 거부". 그래서 새 포트는 <b>6번 앞(5번 자리)</b>에 끼워 넣어야 합니다(<code>-I INPUT 5</code>). 맨 뒤에 붙이면(<code>-A</code>) REJECT 뒤라서 소용없습니다.' },
        { type: 'table', head: ['바깥에서 본 증상', 'curl 종료 코드', '막힌 곳'], rows: [['한참 기다리다 <b>시간 초과</b>', '28', '보안 목록 (패킷이 버려짐)'], ['곧바로 <b>연결 거부</b>(No route / refused)', '7', 'iptables REJECT 또는 서버 프로그램 없음'], ['페이지가 나옴', '0', '두 겹 모두 열림']] },
        { type: 'cmd', title: '1. 테스트 웹 서버 (8000번)', code: 'mkdir -p ~/www && echo "hello from oracle" > ~/www/index.html\ncd ~/www && python3 -m http.server 8000 &\ncurl -s localhost:8000', desc: '서버 안에서는 잘 보입니다. 이제 바깥(<code>labclient</code> — 인터넷의 다른 컴퓨터 역할)에서 접속해 봅니다.' },
        { type: 'cmd', title: '2. 아무것도 안 열었을 때', code: 'labclient nc -zv -w 2 203.0.113.25 22\nlabclient curl -s -m 3 http://203.0.113.25:8000; echo "종료 코드 $?"', desc: '22번은 열려 있고 8000번은 <b>28(시간 초과)</b> — 보안 목록에서 막혔습니다.' },
        { type: 'cmd', title: '3. 보안 목록만 열었을 때', code: 'seclist add 8000\nlabclient curl -s -m 3 http://203.0.113.25:8000; echo "종료 코드 $?"', desc: '이번에는 <b>7(연결 거부)</b>. 바깥 문은 통과했지만 서버 안 iptables 가 거부했습니다.' },
        { type: 'cmd', title: '4. iptables 도 열었을 때', code: 'sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 8000 -j ACCEPT\nsudo iptables -L INPUT -n --line-numbers\nlabclient curl -s -m 3 http://203.0.113.25:8000; echo "종료 코드 $?"', desc: '드디어 페이지가 나옵니다.' },
        { type: 'cmd', title: '5. 실험 정리 — 연 것은 닫는다', code: 'sudo iptables -D INPUT -m state --state NEW -p tcp --dport 8000 -j ACCEPT\nseclist del 8000\nkill %1\nsudo iptables -L INPUT -n --line-numbers; seclist show', desc: '<code>-D</code> 뒤에 추가할 때와 똑같은 규칙을 적으면 그 규칙이 지워집니다. 8000번은 실험용이었으므로 두 곳 모두 닫습니다. 내일 80 · 443 을 열 때는 <code>netfilter-persistent save</code> 로 저장까지 합니다.' },
        { type: 'callout', kind: 'vm', title: '실제 Oracle 서버에서도 똑같이', html: '<p>보안 목록은 콘솔의 <b>네트워킹 → VCN → vcn-cloud70 → 보안 목록 → Default Security List → 수신 규칙 추가</b>(원본 CIDR <code>0.0.0.0/0</code> · TCP · 대상 포트 8000)에서 엽니다. 나머지 iptables 명령은 같습니다. 바깥 테스트는 내 PC 나 휴대폰(데이터)으로 합니다.</p>' },
        { type: 'callout', kind: 'warn', title: 'iptables -F 금지', html: '<p>규칙을 모두 지우는 <code>iptables -F</code> 를 하면 기본 정책에 따라 SSH 까지 막히거나 모든 포트가 열립니다. 규칙은 하나씩 넣고 하나씩 지웁니다.</p>' }
      ],
      practice: [
        {
          title: '실습 6-5. 두 겹 방화벽 보고서',
          level: 2,
          desc: '<p>8000번 실험을 하면서 각 단계의 curl 종료 코드를 <code>~/cloud70/day6/firewall.md</code> 에 기록하세요. <b>28</b>, <b>7</b>, <b>0</b> 세 값이 모두 있어야 하고, 실험이 끝난 뒤에는 <b>보안 목록과 iptables 에 8000 이 남아 있지 않아야</b> 합니다.</p>',
          hint: '<code>labclient curl -s -m 3 http://203.0.113.25:8000; echo $?</code> 를 단계마다 실행. 정리는 <code>iptables -D</code> 와 <code>seclist del 8000</code>.',
          solution: 'mkdir -p ~/www ~/cloud70/day6 && echo "hello from oracle" > ~/www/index.html\ncd ~/www && python3 -m http.server 8000 &\nsleep 1\nf=~/cloud70/day6/firewall.md\necho "# 두 겹 방화벽 실험" > $f\nlabclient curl -s -m 3 http://203.0.113.25:8000 >/dev/null; echo "- 아무것도 안 열음: $?" >> $f\nseclist add 8000\nlabclient curl -s -m 3 http://203.0.113.25:8000 >/dev/null; echo "- 보안 목록만: $?" >> $f\nsudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 8000 -j ACCEPT\nlabclient curl -s -m 3 http://203.0.113.25:8000 >/dev/null; echo "- 둘 다: $?" >> $f\nsudo iptables -D INPUT -m state --state NEW -p tcp --dport 8000 -j ACCEPT\nseclist del 8000\ncat $f',
          check: 'f=~/cloud70/day6/firewall.md; grep -qw 28 $f && grep -qw 7 $f && grep -qw 0 $f && ! iptables -S INPUT | grep -q "dport 8000" && ! seclist show | grep -qw 8000',
          checkOk: '세 단계를 모두 확인하고 깔끔하게 닫았습니다.',
          checkFail: '기록에 28 · 7 · 0 이 있는지, <code>sudo iptables -S INPUT</code> 와 <code>seclist show</code> 에 8000 이 남지 않았는지 확인하세요.'
        }
      ],
      quiz: [
        { q: '바깥에서 curl 이 한참 기다리다 시간 초과(28)되었다. 가장 먼저 의심할 곳은?', options: ['서버 안 iptables', 'OCI 보안 목록', '웹 서버 프로그램', 'DNS'], answer: 1, explain: '보안 목록은 패킷을 조용히 버려서 시간 초과가 납니다.' },
        { q: 'Oracle 기본 iptables 에 80번을 열 때 올바른 것은?', options: ['iptables -A INPUT -p tcp --dport 80 -j ACCEPT', 'iptables -I INPUT 5 ... --dport 80 -j ACCEPT', 'iptables -F', 'iptables -P INPUT DROP'], answer: 1, explain: '마지막 REJECT 앞에 넣어야 합니다. -A 는 REJECT 뒤에 붙습니다.' },
        { q: '보안 목록만 열었을 때 바깥에서 본 결과는?', options: ['페이지가 나온다', '곧바로 연결 거부', '시간 초과', 'DNS 오류'], answer: 1, explain: '바깥 문은 통과했지만 iptables REJECT 가 거부 응답을 보냅니다.' }
      ],
      slides: [
        { layout: 'title', title: '두 겹 방화벽', subtitle: '보안 목록 + iptables', notes: '<p>"콘솔에서 열었는데 안 돼요" 는 Oracle 질문 1위입니다.</p>' },
        { layout: 'table', title: '증상으로 판단하기', head: ['증상', '코드', '막힌 곳'], rows: [['시간 초과', '28', '보안 목록'], ['연결 거부', '7', 'iptables'], ['성공', '0', '—']], notes: '<p>학생들이 직접 세 값을 모두 보게 합니다.</p>' },
        { layout: 'code', title: '여는 법 · 닫는 법', code: 'seclist add 8000\nsudo iptables -I INPUT 5 -m state --state NEW \\\n  -p tcp --dport 8000 -j ACCEPT\n# 닫기\nsudo iptables -D INPUT -m state --state NEW \\\n  -p tcp --dport 8000 -j ACCEPT\nseclist del 8000', points: ['5번 자리 = REJECT 앞', '-D 는 같은 규칙 그대로'], notes: '<p>-F 금지를 강조합니다.</p>' },
        { layout: 'practice', title: '실습 6-5', bullets: ['8000번 테스트 서버', '단계마다 curl 종료 코드 기록', '실험 후 두 곳 모두 닫기'], notes: '' },
        { layout: 'summary', title: '6일차 정리', bullets: ['Oracle A1 무료 서버', '첫 한 시간 루틴', '두 겹 방화벽 판단법'], notes: '<p>내일: 80 · 443 을 열고 웹 서버와 Docker.</p>' }
      ]
    }
  ]
});
