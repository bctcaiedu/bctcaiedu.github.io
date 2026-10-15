UBUNTU_COURSE.addChapter({
  id: 'day05',
  no: '05',
  icon: '🟩',
  title: 'Google Cloud — 상시 무료 VM',
  subtitle: 'Compute Engine e2-micro, VPC Firewall & gcloud',
  summary: '세 번째 클라우드입니다. 오늘 만드는 e2-micro 는 조건만 지키면 기간 제한 없이 무료입니다. 대신 조건이 까다로워서 리전 · 머신 유형 · 디스크 종류 중 하나만 틀려도 요금이 나옵니다. 방화벽이 VM 이 아니라 네트워크에 붙는 Google Cloud 의 방식을 익히고, 한국과 미국 서버의 거리를 재서 3사 비교표를 완성합니다.',
  goals: [
    '상시 무료 조건에 맞춰 e2-micro VM 을 만든다',
    'VPC 방화벽 규칙과 네트워크 태그의 관계를 설명할 수 있다',
    'gcloud CLI 로 VM 을 조회 · 접속 · 중지한다',
    '리전 거리에 따른 응답 시간 차이를 측정하고 3사 비교표를 완성한다'
  ],
  sections: [
    // =====================================================================
    {
      id: 'day05-1',
      title: '상시 무료 VM 만들기',
      minutes: 120,
      goals: [
        '상시 무료 조건 세 가지(리전 · 머신 · 디스크)를 말할 수 있다',
        '공개키 주석이 로그인 사용자 이름이 되는 이유를 안다',
        'e2-micro 를 만들고 두 가지 방법으로 접속한다'
      ],
      flow: [['무료 조건', 20], ['SSH 키 등록', 20], ['VM 만들기', 40], ['접속', 25], ['정리 · 퀴즈', 15]],
      content: [
        { type: 'table', head: ['조건', '무료', '틀리면'], rows: [['리전', '<code>us-west1</code>(오리건) · <code>us-central1</code>(아이오와) · <code>us-east1</code>(사우스캐롤라이나)', '서울 리전 등은 유료'], ['머신 유형', '<code>e2-micro</code> <b>한 대</b>', 'e2-small 부터 유료, 두 대면 한 대 분량 유료'], ['부팅 디스크', '<b>표준 영구 디스크</b>(pd-standard) 30GB 이하', '기본값 "균형 있는(pd-balanced)" 은 유료'], ['네트워크', '북미 → 외부 월 1GB', '초과분 유료']] },
        { type: 'callout', kind: 'warn', title: '기본값이 함정', html: '<p>VM 만들기 화면의 디스크 기본값은 <b>균형 있는 영구 디스크</b>입니다. 반드시 <b>표준 영구 디스크</b>로 바꾸세요. 오른쪽 월 예상 비용 패널을 캡처해 두면 나중에 확인할 수 있습니다.</p>' },
        { type: 'h', text: 'SSH 공개키 등록 — 주석이 사용자 이름' },
        { type: 'cmd', title: '주석을 gcpuser 로 바꾼 공개키', code: 'test -f ~/.ssh/id_ed25519 || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 -q\nawk \'{print $1, $2, "gcpuser"}\' ~/.ssh/id_ed25519.pub', desc: 'Google Cloud 는 공개키 끝의 주석을 <b>로그인 사용자 이름</b>으로 씁니다. 출력된 한 줄을 <b>Compute Engine → 메타데이터 → SSH 키 → 수정 → 항목 추가</b>에 붙여 넣으면 프로젝트의 모든 VM 에 <code>gcpuser</code> 로 접속할 수 있습니다.' },
        { type: 'h', text: 'VM 만들기' },
        { type: 'callout', kind: 'vm', title: '실제 콘솔에서 — Compute Engine → VM 인스턴스 → 만들기', html: '<ul><li>처음이면 Compute Engine API <b>사용</b> 클릭 후 1~2분</li><li>이름 <code>vm-free</code> · 리전 <code>us-west1</code> · 영역 <code>us-west1-b</code></li><li>머신 구성: E2 · <code>e2-micro</code></li><li>OS 및 스토리지 → 변경: Ubuntu 24.04 LTS (x86/64) · <b>표준 영구 디스크</b> · 30GB</li><li>네트워킹: <b>HTTP 트래픽 허용</b> 체크 → 만들기</li></ul>' },
        { type: 'cmd', title: '(연습) gcloud 로 만들기 — 조건 점검이 함께 나옵니다', code: 'gcloud compute instances create vm-try --zone us-west1-b --machine-type e2-micro --image-family ubuntu-2404-lts-amd64 --image-project ubuntu-os-cloud --boot-disk-size 30GB --tags http-server\ngcloud compute instances delete vm-try --zone us-west1-b --quiet\ngcloud compute instances create vm-free --zone us-west1-b --machine-type e2-micro --image-family ubuntu-2404-lts-amd64 --image-project ubuntu-os-cloud --boot-disk-type pd-standard --boot-disk-size 30GB --tags http-server', desc: '첫 명령은 디스크 유형을 빠뜨려 기본값(pd-balanced)이 됩니다. 연습용 CLI 가 ✘ 로 알려 줍니다. 지우고 올바른 값으로 다시 만듭니다.' },
        { type: 'h', text: '두 가지 방법으로 접속' },
        { type: 'list', ordered: true, items: ['<b>브라우저 SSH</b> — VM 목록의 <b>SSH</b> 버튼. 키 설정 없이 바로 열립니다', '<b>내 터미널</b> — <code>ssh gcpuser@외부IP</code>'] },
        { type: 'cmd', vm: true, title: '실제 VM 에서', code: 'ssh gcpuser@<외부 IP>\nuname -a; nproc; free -h; df -h /', expect: 'Linux vm-free 6.8.0-1015-gcp #17-Ubuntu SMP x86_64 GNU/Linux\n2\n               total        used        free\nMem:           958Mi       341Mi       420Mi', desc: '메모리가 약 1GB 입니다. 무거운 프로그램은 어렵지만 작은 웹 서버나 예비 서버로는 충분합니다.' }
      ],
      practice: [
        {
          title: '실습 5-1. 무료 조건에 맞는 VM',
          level: 2,
          desc: '<p>연습용 <code>gcloud</code> 로 <b>무료 리전 · e2-micro · 표준 영구 디스크(pd-standard) 30GB 이하 · http-server 태그</b> 조건을 모두 만족하는 VM 을 만드세요.</p>',
          hint: '<code>gcloud compute instances create vm-free --zone us-west1-b --machine-type e2-micro --boot-disk-type pd-standard --boot-disk-size 30GB --tags http-server ...</code>',
          solution: 'gcloud compute instances create vm-free --zone us-west1-b --machine-type e2-micro --image-family ubuntu-2404-lts-amd64 --image-project ubuntu-os-cloud --boot-disk-type pd-standard --boot-disk-size 30GB --tags http-server\ngcloud compute instances list',
          check: 'gcloud compute instances list --format="value(machineType.basename(),zone,disks[0].type,disks[0].diskSizeGb,tags.items)" 2>/dev/null | awk \'$1=="e2-micro" && $2 ~ /^us-(west1|central1|east1)-/ && $3=="pd-standard" && $4<=30 && $5 ~ /http-server/ {ok=1} END {exit !ok}\'',
          checkOk: '상시 무료 조건을 모두 지켰습니다.',
          checkFail: '<code>gcloud compute instances list --format="value(name,machineType.basename(),zone,disks[0].type,disks[0].diskSizeGb,tags.items)"</code> 로 다섯 가지를 확인하세요.'
        }
      ],
      quiz: [
        { q: '다음 중 Google Cloud 상시 무료 VM 이 될 수 <b>없는</b> 리전은?', options: ['us-west1', 'us-central1', 'asia-northeast3 (서울)', 'us-east1'], answer: 2, explain: '상시 무료 e2-micro 는 미국 3개 리전만 해당합니다.' },
        { q: 'VM 만들기 화면에서 반드시 바꿔야 하는 기본값은?', options: ['이미지', '부팅 디스크 유형 (균형 있는 → 표준)', '영역 이름', '네트워크 이름'], answer: 1, explain: '균형 있는 영구 디스크는 무료 대상이 아닙니다.' },
        { q: '공개키 끝 주석이 <code>gcpuser</code> 일 때 접속 명령은?', options: ['ssh root@IP', 'ssh ubuntu@IP', 'ssh gcpuser@IP', 'ssh azureuser@IP'], answer: 2, explain: 'GCP 는 공개키 주석을 사용자 이름으로 씁니다.' }
      ],
      slides: [
        { layout: 'title', title: 'Google Cloud 상시 무료 VM', subtitle: 'e2-micro · 미국 리전 · 표준 디스크', notes: '<p>"평생 무료" 의 조건을 정확히 지키는 날이라고 소개합니다.</p>' },
        { layout: 'table', title: '무료 조건', head: ['항목', '값'], rows: [['리전', 'us-west1 · us-central1 · us-east1'], ['머신', 'e2-micro 한 대'], ['디스크', '표준(pd-standard) 30GB 이하']], notes: '<p>기본값 디스크가 유료라는 점을 두 번 강조합니다.</p>' },
        { layout: 'code', title: '(연습) gcloud', code: 'gcloud compute instances create vm-free \\\n  --zone us-west1-b --machine-type e2-micro \\\n  --boot-disk-type pd-standard --boot-disk-size 30GB \\\n  --tags http-server', points: ['디스크 유형을 빠뜨리면 ✘', '콘솔 값과 1:1 대응'], notes: '<p>일부러 틀린 명령을 먼저 실행해 점검 결과를 보여 줍니다.</p>' },
        { layout: 'summary', title: '정리', bullets: ['무료 조건 세 가지', '주석 = 사용자 이름', '브라우저 SSH · 내 터미널 SSH'], notes: '<p>다음: 방화벽 규칙과 태그.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day05-2',
      title: '웹 서버와 VPC 방화벽 · 태그',
      minutes: 120,
      goals: [
        'VPC 방화벽 규칙이 태그로 VM 에 적용되는 방식을 설명할 수 있다',
        '태그를 빼고 넣어 방화벽 동작을 확인한다',
        'default-allow-ssh 가 전 세계에 열려 있다는 위험을 안다'
      ],
      flow: [['Nginx', 20], ['방화벽 규칙과 태그', 35], ['태그 실험', 30], ['gcloud 조회', 20], ['정리', 15]],
      content: [
        { type: 'cmd', title: '웹 서버 (가상 서버에서 연습 → 실제 VM 에서 반복)', code: 'sudo apt install -y nginx\necho \'<h1>Hello from Google Cloud e2-micro · 학번</h1>\' | sudo tee /var/www/html/index.html\ncurl -s localhost', desc: '실제 VM 에서는 브라우저로 <code>http://외부IP</code> 를 엽니다. AWS · Azure 때와 달리 <b>바로 열립니다</b>. 왜일까요?' },
        { type: 'h', text: '방화벽은 네트워크에, VM 에는 태그' },
        { type: 'figure', html: '<svg viewBox="0 0 680 180" style="width:100%;height:auto" font-family="var(--sans)"><rect x="10" y="10" width="420" height="160" rx="14" fill="var(--card2)" stroke="var(--line)"/><text x="28" y="36" font-size="14" font-weight="700" fill="var(--fg)">VPC 네트워크: default</text><g font-size="12"><rect x="28" y="50" width="380" height="30" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="40" y="70" fill="var(--fg)">default-allow-http · tcp:80 · 대상 태그 <tspan font-weight="700">http-server</tspan></text><rect x="28" y="88" width="380" height="30" rx="6" fill="var(--card)" stroke="var(--line)"/><text x="40" y="108" fill="var(--fg)">default-allow-ssh · tcp:22 · 모든 VM · 원본 0.0.0.0/0 ⚠</text><rect x="28" y="126" width="380" height="30" rx="6" fill="var(--card)" stroke="var(--line)"/><text x="40" y="146" fill="var(--fg)">default-allow-icmp · ping · 모든 VM</text></g><rect x="480" y="50" width="180" height="90" rx="12" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="570" y="82" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fg)">vm-free</text><text x="570" y="106" text-anchor="middle" font-size="12" font-family="var(--mono)" fill="var(--muted)">태그: http-server</text><path d="M412 65 H475" stroke="var(--accent)" stroke-width="3"/></svg>', caption: '"HTTP 트래픽 허용" 체크 = VM 에 http-server 태그를 붙인 것' },
        { type: 'p', html: 'AWS · Azure 는 방화벽을 VM 에 직접 붙였습니다. Google Cloud 는 규칙이 <b>VPC 네트워크</b>에 있고, 규칙의 <b>대상 태그</b>와 같은 태그를 가진 VM 에만 적용됩니다.' },
        { type: 'cmd', title: '(연습) 규칙과 태그 보기', code: 'gcloud compute firewall-rules list --format="table(name, sourceRanges.list(), allowed[].map().firewall_rule().list(), targetTags.list())"\ngcloud compute instances describe vm-free --zone us-west1-b --format="value(name, tags.items)"', desc: '<code>default-allow-ssh</code> 의 원본이 <code>0.0.0.0/0</code> — 전 세계에 열려 있습니다. 운영 서버라면 내 IP 와 브라우저 SSH 대역(<code>35.235.240.0/20</code>)으로 좁힙니다(10일차).' },
        { type: 'cmd', title: '(연습) 태그 실험', code: 'gcloud compute instances remove-tags vm-free --zone us-west1-b --tags http-server\ngcloud compute instances describe vm-free --zone us-west1-b --format="value(tags.items)"\ngcloud compute instances add-tags vm-free --zone us-west1-b --tags http-server', desc: '실제 VM 에서는 태그를 뺀 직후 브라우저 접속이 막히고, 다시 붙이면 열리는 것을 확인합니다.' }
      ],
      practice: [
        {
          title: '실습 5-2. 태그 되돌리기',
          level: 1,
          desc: '<p>VM <code>vm-free</code> 에서 <code>http-server</code> 태그를 뺐다가 <b>다시 붙인</b> 상태로 두세요. 그리고 가상 서버의 웹페이지가 <code>Google Cloud</code> 를 포함하도록 바꾸세요.</p>',
          hint: '<code>remove-tags</code> → <code>add-tags</code>, 그리고 <code>echo ... | sudo tee /var/www/html/index.html</code>',
          solution: 'gcloud compute instances list --format="value(name)" | grep -qx vm-free || gcloud compute instances create vm-free --zone us-west1-b --machine-type e2-micro --boot-disk-type pd-standard --boot-disk-size 30GB --tags http-server\ngcloud compute instances remove-tags vm-free --zone us-west1-b --tags http-server\ngcloud compute instances add-tags vm-free --zone us-west1-b --tags http-server\nsudo apt install -y nginx\necho \'<h1>Hello from Google Cloud e2-micro</h1>\' | sudo tee /var/www/html/index.html',
          check: 'gcloud compute instances describe vm-free --zone us-west1-b --format="value(tags.items)" 2>/dev/null | grep -q http-server && curl -s localhost | grep -q "Google Cloud"',
          checkOk: '태그가 붙어 있고 페이지도 바뀌었습니다.',
          checkFail: '<code>gcloud compute instances describe vm-free --zone us-west1-b --format="value(tags.items)"</code> 와 <code>curl -s localhost</code> 를 확인하세요.'
        }
      ],
      quiz: [
        { q: 'Google Cloud 에서 "HTTP 트래픽 허용" 을 체크하면 실제로 일어나는 일은?', options: ['새 방화벽 규칙이 VM 에 붙는다', 'VM 에 http-server 태그가 붙는다', 'Nginx 가 설치된다', '외부 IP 가 바뀐다'], answer: 1, explain: '기존 default-allow-http 규칙이 이 태그를 대상으로 합니다.' },
        { q: 'default-allow-ssh 의 위험은?', options: ['SSH 가 막힌다', '원본이 0.0.0.0/0 이라 전 세계에서 접속 시도가 가능하다', '키가 지워진다', '요금이 나온다'], answer: 1, explain: '키 인증이라 당장 뚫리진 않지만, 원본을 좁히는 것이 좋습니다.' },
        { q: '방화벽이 VM 이 아니라 네트워크에 붙는 클라우드는?', options: ['AWS', 'Azure', 'Google Cloud', '모두'], answer: 2, explain: 'GCP 는 VPC 방화벽 규칙 + 대상 태그 방식입니다.' }
      ],
      slides: [
        { layout: 'title', title: 'VPC 방화벽 · 태그', subtitle: '규칙은 네트워크에, VM 에는 태그', notes: '<p>"왜 오늘은 포트를 안 열었는데 열렸을까?" 로 시작합니다.</p>' },
        { layout: 'table', title: '세 클라우드의 방화벽', head: ['클라우드', '이름', '붙는 곳'], rows: [['AWS', '보안 그룹', 'VM(ENI)'], ['Azure', 'NSG', 'NIC · 서브넷'], ['GCP', '방화벽 규칙', 'VPC + 대상 태그']], notes: '<p>비교표에 들어갈 내용입니다.</p>' },
        { layout: 'code', title: '태그 실험', code: 'gcloud compute instances remove-tags vm-free \\\n  --zone us-west1-b --tags http-server\ngcloud compute instances add-tags vm-free \\\n  --zone us-west1-b --tags http-server', points: ['빼면 막히고', '붙이면 열린다'], notes: '<p>실제 VM 에서 함께 실험합니다.</p>' },
        { layout: 'summary', title: '정리', bullets: ['방화벽 규칙 = VPC 에', 'VM 은 태그로 선택', 'SSH 기본 규칙은 너무 넓다'], notes: '<p>다음: 거리 재기와 3사 비교.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day05-3',
      title: '거리 재기 · 3사 비교 · 중지',
      minutes: 120,
      goals: [
        '한국 ↔ 미국 서버의 응답 시간을 측정해 리전 선택의 이유를 설명한다',
        '3사의 서버 · 방화벽 · 키 · CLI · 무료 조건을 한 표로 정리한다',
        'VM 을 지우지 않고 중지해 예비 서버로 남긴다'
      ],
      flow: [['응답 시간 측정', 30], ['3사 비교표', 45], ['중지와 비용 확인', 25], ['산출물', 20]],
      content: [
        { type: 'cmd', vm: true, title: '내 PC(WSL)에서 실제 측정', code: 'ping -c 5 <e2-micro 외부 IP>\nfor i in 1 2 3; do curl -o /dev/null -s -w "연결 %{time_connect}s · 전체 %{time_total}s\\n" http://<외부 IP>; done\nfor i in 1 2 3; do curl -o /dev/null -s -w "연결 %{time_connect}s · 전체 %{time_total}s\\n" https://www.kopo.ac.kr; done', expect: '64 bytes from 34.x.x.x: icmp_seq=1 ttl=54 time=138 ms\n...\n연결 0.141s · 전체 0.285s', desc: '서울에서 오리건까지는 빛의 속도로도 왕복 약 60ms 가 걸립니다. 실제로는 그보다 훨씬 깁니다. 한국 사용자용 서비스라면 서울 · 춘천 · 도쿄 리전이 유리합니다.' },
        { type: 'cmd', title: '가상 서버에서 측정 연습', code: 'ping -c 3 google.com\ncurl -o /dev/null -s -w "전체 %{time_total}s\\n" https://www.kopo.ac.kr', desc: '가상 터미널의 시간은 흉내 낸 값입니다. 진짜 숫자는 위의 실제 측정으로 얻습니다.' },
        { type: 'h', text: '3사 비교표 완성' },
        { type: 'table', head: ['개념', 'AWS', 'Azure', 'Google Cloud'], rows: [['가상 서버', 'EC2', 'Virtual Machines', 'Compute Engine'], ['방화벽 · 적용', '보안 그룹 · VM', 'NSG · NIC/서브넷', 'VPC 방화벽 · 태그'], ['SSH 키 등록', '키 페어 가져오기', 'VM 생성 때 붙여넣기', '메타데이터 SSH 키'], ['기본 사용자', 'ubuntu', 'azureuser', '키 주석(gcpuser)'], ['브라우저 터미널 · CLI', 'CloudShell · aws', 'Cloud Shell · az', 'Cloud Shell · gcloud'], ['객체 스토리지', 'S3', 'Blob Storage', 'Cloud Storage'], ['무료 조건', '크레딧 $200 · 6개월', '학생 $100 · 12개월', 'e2-micro 상시 + $300 · 90일']] },
        { type: 'h', text: '지우지 않고 중지' },
        { type: 'cmd', title: '(연습) 중지와 확인', code: 'gcloud compute instances stop vm-free --zone us-west1-b\ngcloud compute instances list', desc: '<code>STATUS: TERMINATED</code> 가 중지 상태입니다(이름이 헷갈리지만 삭제가 아닙니다). CPU · 메모리 요금은 멈추고 디스크만 남습니다. 표준 디스크 30GB 까지는 무료입니다. Oracle 서버가 안 될 때 다시 켜서 씁니다.' },
        { type: 'callout', kind: 'vm', title: '실제 클라우드에서 — 비용 확인과 산출물', html: '<p>메뉴 → <b>결제 → 보고서</b>에서 오늘 날짜 청구 항목을 확인합니다. 무료 사용량은 다음 날 반영될 수 있으니 <b>내일 아침에 다시</b> 확인합니다.</p><ol><li>VM 생성 화면의 월 예상 비용 패널</li><li>e2-micro Nginx 페이지 (주소창 포함)</li><li>gcloud 인스턴스 · 방화벽 조회 출력</li><li>응답 시간 측정 표와 확인 질문 답</li><li>3사 비교표 · VM 중지 확인 출력</li></ol>' }
      ],
      practice: [
        {
          title: '실습 5-3. 3사 비교표 파일',
          level: 1,
          desc: '<p><code>~/cloud70/day5/compare.md</code> 에 AWS · Azure · Google 세 클라우드를 비교한 표를 쓰세요. 각 클라우드 이름과 방화벽 이름(보안 그룹 · NSG · 방화벽)이 모두 들어가야 합니다.</p>',
          hint: 'nano 로 위 표를 옮겨 적고, 가장 편했던 점 · 불편했던 점 한 줄씩 덧붙이세요.',
          solution: 'mkdir -p ~/cloud70/day5\ncat > ~/cloud70/day5/compare.md <<\'EOF\'\n| 개념 | AWS | Azure | Google |\n|---|---|---|---|\n| 서버 | EC2 | VM | Compute Engine |\n| 방화벽 | 보안 그룹 | NSG | VPC 방화벽 + 태그 |\n| CLI | aws | az | gcloud |\nEOF\ncat ~/cloud70/day5/compare.md',
          check: 'f=~/cloud70/day5/compare.md; grep -qi aws $f && grep -qi azure $f && grep -qi google $f && grep -q "보안 그룹" $f && grep -qi nsg $f && grep -q 방화벽 $f',
          checkOk: '세 클라우드 비교표가 완성되었습니다.',
          checkFail: 'AWS · Azure · Google 과 보안 그룹 · NSG · 방화벽이 모두 들어 있는지 확인하세요.'
        },
        {
          title: '실습 5-4. 예비 서버로 중지',
          level: 1,
          desc: '<p><code>vm-free</code> 를 지우지 말고 <b>중지(TERMINATED)</b> 상태로 두세요.</p>',
          hint: '<code>gcloud compute instances stop vm-free --zone us-west1-b</code>',
          solution: 'gcloud compute instances stop vm-free --zone us-west1-b\ngcloud compute instances list',
          check: 'gcloud compute instances list --format="value(name,status)" 2>/dev/null | grep -q "vm-free.*TERMINATED"',
          checkOk: 'vm-free 가 중지되어 예비 서버로 남았습니다.',
          checkFail: '<code>gcloud compute instances list</code> 에서 vm-free 의 STATUS 가 TERMINATED 인지 확인하세요. (지웠다면 실습 5-1 부터)'
        }
      ],
      quiz: [
        { q: '한국 사용자 대상 서비스를 us-west1 에 두면 생기는 일은?', options: ['더 빠르다', '응답이 느려진다', '요금이 0원이 된다', '방화벽이 꺼진다'], answer: 1, explain: '물리적 거리만큼 왕복 시간이 늘어납니다.' },
        { q: 'gcloud 목록의 <code>STATUS: TERMINATED</code> 는?', options: ['삭제됨', '중지됨 (디스크는 남음)', '오류', '생성 중'], answer: 1, explain: '이름과 달리 삭제가 아니라 중지 상태입니다.' },
        { q: '세 클라우드의 객체 스토리지 이름을 바르게 짝지은 것은?', options: ['S3 · Blob Storage · Cloud Storage', 'EBS · Files · Filestore', 'S3 · Disk · Bucket', 'Glacier · Archive · Coldline'], answer: 0, explain: '9일차에 Cloud Storage 를 씁니다.' }
      ],
      slides: [
        { layout: 'title', title: '거리 · 비교 · 중지', subtitle: '3대 클라우드를 한 표로', notes: '<p>측정 결과를 칠판에 모아 평균을 냅니다.</p>' },
        { layout: 'bullets', title: '거리는 시간이다', bullets: ['서울 ↔ 오리건 왕복 이론값 ≈ 60ms', '실측은 그 두 배 이상', '사용자 가까운 리전을 고른다', '무료 e2-micro 는 예비 · 학습용'], notes: '<p>학생들의 ping 결과를 받아 적습니다.</p>' },
        { layout: 'table', title: '3사 비교 (요약)', head: ['', 'AWS', 'Azure', 'GCP'], rows: [['서버', 'EC2', 'VM', 'CE'], ['방화벽', 'SG', 'NSG', 'VPC+태그'], ['CLI', 'aws', 'az', 'gcloud']], notes: '<p>학생 비교표와 대조합니다.</p>' },
        { layout: 'summary', title: '1~5일차 정리', bullets: ['클라우드 개념 · 리눅스 · SSH 키', '3대 클라우드에서 VM · 웹 · 정리', '무료 조건을 지키는 습관'], notes: '<p>내일부터는 Oracle 무료 서버 한 대를 끝까지 키웁니다.</p>' }
      ]
    }
  ]
});
