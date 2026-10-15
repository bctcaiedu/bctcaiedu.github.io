UBUNTU_COURSE.addChapter({
  id: 'day04',
  no: '04',
  icon: '🟦',
  title: 'Microsoft Azure — VM과 App Service',
  subtitle: 'Resource Groups, Virtual Machines, NSG & App Service',
  summary: '어제 AWS 에서 한 일을 Azure 에서 다시 합니다. 같은 일을 두 번 하면 "클라우드마다 다른 것" 과 "어디나 같은 것" 이 보입니다. Azure 만의 핵심은 리소스 그룹입니다. 관련된 것을 한 상자에 담고, 다 쓰면 상자째 지웁니다. 마지막에는 App Service(PaaS)로 서버 관리 없이 웹앱을 올립니다.',
  goals: [
    'Azure for Students 로 카드 없이 구독을 만든다',
    '리소스 그룹 안에 VM 을 만들고 NSG 로 포트를 관리한다',
    'App Service(PaaS)로 서버 관리 없이 웹앱을 배포한다',
    '리소스 그룹 삭제 한 번으로 모든 리소스를 정리한다'
  ],
  sections: [
    // =====================================================================
    {
      id: 'day04-1',
      title: 'Azure for Students 와 리소스 그룹',
      minutes: 120,
      goals: [
        '학교 이메일로 Azure for Students 구독을 만든다',
        '구독 · 리소스 그룹 · 리소스의 관계를 설명할 수 있다',
        '허용 지역 정책 오류를 읽고 다른 지역으로 대처한다'
      ],
      flow: [['Azure 의 구조', 20], ['학생 구독 가입 · MFA', 35], ['리소스 그룹 만들기', 30], ['Cloud Shell 둘러보기', 20], ['정리', 15]],
      content: [
        { type: 'figure', html: '<svg viewBox="0 0 680 190" style="width:100%;height:auto" font-family="var(--sans)"><rect x="10" y="10" width="660" height="170" rx="14" fill="var(--card2)" stroke="var(--line)"/><text x="30" y="36" font-size="14" font-weight="700" fill="var(--fg)">구독: Azure for Students ($100 크레딧)</text><rect x="30" y="50" width="400" height="115" rx="12" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="48" y="74" font-size="13" font-weight="700" fill="var(--fg)">리소스 그룹: rg-cloud70</text><g font-size="12" text-anchor="middle"><rect x="48" y="88" width="80" height="60" rx="8" fill="var(--card)" stroke="var(--line)"/><text x="88" y="122" fill="var(--fg)">VM</text><rect x="138" y="88" width="80" height="60" rx="8" fill="var(--card)" stroke="var(--line)"/><text x="178" y="122" fill="var(--fg)">디스크</text><rect x="228" y="88" width="80" height="60" rx="8" fill="var(--card)" stroke="var(--line)"/><text x="268" y="116" fill="var(--fg)">공용 IP</text><text x="268" y="132" fill="var(--fg)">· NIC</text><rect x="318" y="88" width="96" height="60" rx="8" fill="var(--card)" stroke="var(--line)"/><text x="366" y="116" fill="var(--fg)">NSG ·</text><text x="366" y="132" fill="var(--fg)">가상 네트워크</text></g><rect x="450" y="50" width="200" height="115" rx="12" fill="var(--card)" stroke="var(--line)" stroke-dasharray="5 4"/><text x="550" y="100" text-anchor="middle" font-size="13" fill="var(--muted)">az group delete 한 번이면</text><text x="550" y="120" text-anchor="middle" font-size="13" fill="var(--muted)">상자 안이 모두 삭제</text></svg>', caption: 'Azure 는 모든 리소스를 리소스 그룹이라는 상자에 담습니다' },
        { type: 'callout', kind: 'vm', title: '실제 클라우드에서 — 학생 구독 만들기', html: '<ol><li><code>azure.microsoft.com/free/students</code> → 무료로 시작</li><li>Microsoft 계정으로 로그인 → 학생 인증에 <b>학교 이메일</b> → 메일의 링크 클릭</li><li>휴대폰 인증 후 <code>portal.azure.com</code> 이 열립니다. 카드는 묻지 않습니다</li><li><code>mysignins.microsoft.com/security-info</code> 에서 인증 앱을 추가해 MFA</li></ol><p>학생 인증이 안 되면 Azure 무료 계정($200, 30일, 카드 필요)이나 조 계정으로 진행합니다.</p>' },
        { type: 'h', text: '리소스 그룹 만들기' },
        { type: 'cmd', title: 'Cloud Shell(Bash) 에서', code: 'az account show -o table\naz group create -n rg-cloud70 -l westeurope\naz group create -n rg-cloud70 -l koreacentral -o table\naz group list -o table', desc: '학생 구독은 <b>허용 지역</b>이 정해져 있습니다. 두 번째 명령처럼 <code>RequestDisallowedByAzure</code> 가 나오면 오류 메시지에 나온 허용 지역(예: Korea Central, Japan East) 중 가까운 곳으로 다시 만듭니다.' },
        { type: 'callout', kind: 'info', title: 'AWS 와 다른 점', html: '<p>AWS 에서는 정리할 때 인스턴스 · 볼륨 · 탄력적 IP · 버킷을 하나하나 확인했습니다. Azure 는 처음부터 상자(리소스 그룹)에 담고 상자째 지우므로 정리 실수가 줄어듭니다.</p>' }
      ],
      practice: [
        {
          title: '실습 4-1. 리소스 그룹 rg-cloud70',
          level: 1,
          desc: '<p>연습용 <code>az</code> CLI 로 <b>Korea Central</b> 에 리소스 그룹 <code>rg-cloud70</code> 을 만드세요.</p>',
          hint: '<code>az group create -n rg-cloud70 -l koreacentral</code>',
          solution: 'az group create -n rg-cloud70 -l koreacentral -o table\naz group list -o table',
          check: 'az group list --query "[].[name,location]" -o tsv 2>/dev/null | grep -q "^rg-cloud70.*koreacentral"',
          checkOk: 'rg-cloud70 이 Korea Central 에 있습니다.',
          checkFail: '<code>az group list -o table</code> 로 이름과 지역을 확인하세요.'
        }
      ],
      quiz: [
        { q: 'Azure 에서 관련 리소스를 묶어 한 번에 지울 수 있게 하는 단위는?', options: ['구독', '리소스 그룹', '테넌트', '가용성 집합'], answer: 1, explain: '리소스 그룹을 지우면 안의 리소스가 모두 삭제됩니다.' },
        { q: '<code>RequestDisallowedByAzure</code> 오류가 났다. 가장 알맞은 대응은?', options: ['카드를 등록한다', '오류에 나온 허용 지역으로 다시 만든다', '이름을 바꾼다', '하루 기다린다'], answer: 1, explain: '학생 구독의 지역 정책 때문입니다.' },
        { q: 'Azure for Students 가입에 필요 <b>없는</b> 것은?', options: ['학교 이메일', 'Microsoft 계정', '휴대폰 인증', '신용카드'], answer: 3, explain: '학생 구독은 카드 없이 $100 크레딧을 줍니다.' }
      ],
      slides: [
        { layout: 'title', title: 'Azure 시작', subtitle: '구독 · 리소스 그룹', notes: '<p>"어제 정리할 때 무엇이 귀찮았나요?" 로 리소스 그룹의 필요성을 끌어냅니다.</p>' },
        { layout: 'bullets', title: 'Azure 의 상자들', bullets: ['구독 = 요금이 청구되는 단위 (Azure for Students)', '리소스 그룹 = 관련 리소스를 담는 상자', '리소스 = VM · 디스크 · IP · NSG …', '상자째 지우면 정리 끝'], notes: '<p>그림을 보며 설명합니다.</p>' },
        { layout: 'code', title: 'Cloud Shell', code: 'az group create -n rg-cloud70 -l koreacentral\naz group list -o table', points: ['허용 지역 오류 → 다른 지역', '-o table 로 보기 좋게'], notes: '<p>지역 오류를 일부러 보여 줍니다.</p>' },
        { layout: 'summary', title: '정리', bullets: ['카드 없이 학생 구독 $100', '모든 것은 rg-cloud70 안에', '지역 정책 오류에 당황하지 않기'], notes: '<p>다음 교시: VM.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day04-2',
      title: 'Azure VM 과 NSG',
      minutes: 120,
      goals: [
        '무료 서비스 대상 크기로 VM 을 만들고 내 공개키로 접속한다',
        'VM 하나에 함께 생기는 리소스(디스크 · NIC · IP · NSG · VNET)를 확인한다',
        'NSG 로 HTTP 를 열고 SSH 원본을 내 IP 로 좁힌다'
      ],
      flow: [['VM 설정', 30], ['접속과 Nginx', 25], ['NSG 규칙', 30], ['딸린 리소스 보기', 20], ['정리 · 퀴즈', 15]],
      content: [
        { type: 'callout', kind: 'vm', title: '실제 포털에서 — Virtual Machines → 만들기', html: '<ul><li>리소스 그룹 <code>rg-cloud70</code> · 이름 <code>vm-학번</code> · 지역 Korea Central</li><li>이미지 <b>Ubuntu Server 24.04 LTS - x64 Gen2</b></li><li>크기: <b>무료 서비스 대상</b> 표시가 있는 B 시리즈 (예: <code>Standard_B1s</code>)</li><li>인증 형식 SSH 공개 키 · 사용자 <code>azureuser</code> · <b>기존 공개 키 사용</b> → <code>cat ~/.ssh/id_ed25519.pub</code></li><li>공용 인바운드 포트: SSH(22) · 네트워킹 탭: <b>VM 이 삭제될 때 공용 IP 및 NIC 삭제</b> 체크</li></ul>' },
        { type: 'cmd', title: '(연습) 같은 VM 을 CLI 로', code: 'test -f ~/.ssh/id_ed25519 || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 -q\naz group create -n rg-cloud70 -l koreacentral -o none\naz vm create -g rg-cloud70 -n vm-student --image Ubuntu2404 --size Standard_DS1_v2 --admin-username azureuser --ssh-key-values @~/.ssh/id_ed25519.pub -o table\naz vm create -g rg-cloud70 -n vm-student --image Ubuntu2404 --size Standard_B1s --admin-username azureuser --ssh-key-values @~/.ssh/id_ed25519.pub', desc: '첫 번째는 무료 대상이 아닌 크기라 안내가 나옵니다. 같은 이름으로 다시 만들면 무료 대상 크기로 바뀝니다. <code>@파일</code> 은 파일 내용을 값으로 넘기는 Azure CLI 문법입니다.' },
        { type: 'cmd', vm: true, title: '내 PC 에서 실제 VM 으로', code: 'ssh azureuser@<공용 IP>\nsudo apt update && sudo apt install -y nginx\necho \'<h1>Hello from Azure VM · 학번</h1>\' | sudo tee /var/www/html/index.html', expect: 'azureuser@vm-2026123:~$', desc: '브라우저로 <code>http://공용IP</code> 를 열면 연결이 안 됩니다. 80번이 아직 NSG 에서 닫혀 있기 때문입니다.' },
        { type: 'h', text: 'NSG — Azure 의 방화벽' },
        { type: 'cmd', title: '(연습) 80번 열고 규칙 보기', code: 'az vm open-port -g rg-cloud70 -n vm-student --port 80 --priority 900 -o none\naz network nsg rule list -g rg-cloud70 --nsg-name vm-studentNSG -o table', desc: '포털에서는 VM → <b>네트워킹 → 네트워크 설정 → 포트 규칙 만들기 → 인바운드</b> 로 HTTP 를 추가하고, 기존 SSH 규칙의 <b>원본</b>을 <b>내 IP 주소</b>로 바꿉니다. 우선순위 숫자가 작을수록 먼저 적용됩니다.' },
        { type: 'cmd', title: '(연습) VM 하나에 무엇이 생겼나', code: 'az resource list -g rg-cloud70 -o table\naz vm list -d -o table', desc: 'VM 하나를 만들었는데 디스크 · NIC · 공용 IP · NSG · 가상 네트워크가 함께 생겼습니다. 이것을 하나하나 지우지 않아도 되도록 리소스 그룹을 씁니다.' },
        { type: 'table', head: ['VM 상태', '컴퓨팅 요금', '설명'], rows: [['실행 중', '나옴', ''], ['중지됨 (<code>az vm stop</code>)', '<b>계속 나옴</b>', 'OS 만 멈춤, 자원은 잡혀 있음'], ['할당 취소됨 (<code>az vm deallocate</code>)', '멈춤', '포털의 "중지" 버튼이 이것']] }
      ],
      practice: [
        {
          title: '실습 4-2. 무료 대상 VM 과 HTTP 규칙',
          level: 2,
          desc: '<p><code>rg-cloud70</code> 에 <b>Standard_B1s</b> 크기, 사용자 <code>azureuser</code>, 내 공개키로 VM 을 만들고, NSG 에 <b>80번</b> 인바운드 규칙을 추가하세요.</p>',
          hint: '<code>az vm create ... --size Standard_B1s --admin-username azureuser --ssh-key-values @~/.ssh/id_ed25519.pub</code> → <code>az vm open-port -g rg-cloud70 -n VM이름 --port 80</code>',
          solution: 'test -f ~/.ssh/id_ed25519 || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 -q\naz group exists -n rg-cloud70 | grep -q true || az group create -n rg-cloud70 -l koreacentral -o none\naz vm create -g rg-cloud70 -n vm-student --image Ubuntu2404 --size Standard_B1s --admin-username azureuser --ssh-key-values @~/.ssh/id_ed25519.pub -o none\naz vm open-port -g rg-cloud70 -n vm-student --port 80 --priority 900 -o none\naz network nsg rule list -g rg-cloud70 --nsg-name vm-studentNSG -o table',
          check: 'n=$(az vm list -g rg-cloud70 --query "[?hardwareProfile.vmSize==\'Standard_B1s\'].name" -o tsv 2>/dev/null | head -1); [ -n "$n" ] && az network nsg rule list -g rg-cloud70 --nsg-name ${n}NSG -o table 2>/dev/null | grep -qE "\\s80$"',
          checkOk: 'B1s VM 에 HTTP 규칙이 있습니다.',
          checkFail: '<code>az vm list -o json</code> 의 vmSize 가 Standard_B1s 인지, <code>az network nsg rule list ... -o table</code> 마지막 열에 80 이 있는지 확인하세요.'
        }
      ],
      quiz: [
        { q: 'Azure 의 VM 방화벽 이름은?', options: ['보안 그룹', 'NSG(네트워크 보안 그룹)', '보안 목록', 'WAF'], answer: 1, explain: 'AWS 보안 그룹과 같은 역할입니다.' },
        { q: '<code>az vm stop</code> 만 한 VM 의 컴퓨팅 요금은?', options: ['멈춘다', '계속 나온다', '두 배가 된다', '크레딧에서 빠지지 않는다'], answer: 1, explain: '요금을 멈추려면 deallocate(할당 취소)해야 합니다.' },
        { q: 'NSG 규칙 우선순위 900 과 1000 중 먼저 적용되는 것은?', options: ['900', '1000', '늦게 만든 것', '이름순'], answer: 0, explain: '숫자가 작을수록 우선순위가 높습니다.' }
      ],
      slides: [
        { layout: 'title', title: 'Azure VM', subtitle: 'B1s · azureuser · NSG', notes: '<p>어제 EC2 와 화면을 나란히 비교합니다.</p>' },
        { layout: 'code', title: 'VM 만들기', code: 'az vm create -g rg-cloud70 -n vm-student \\\n  --image Ubuntu2404 --size Standard_B1s \\\n  --admin-username azureuser \\\n  --ssh-key-values @~/.ssh/id_ed25519.pub', points: ['무료 대상 크기 확인', '사용자 azureuser'], notes: '<p>포털에서 같은 값을 고르게 합니다.</p>' },
        { layout: 'code', title: 'NSG', code: 'az vm open-port -g rg-cloud70 -n vm-student --port 80\naz network nsg rule list -g rg-cloud70 \\\n  --nsg-name vm-studentNSG -o table', points: ['HTTP 열기', 'SSH 원본은 내 IP'], notes: '<p>포털의 네트워크 설정 화면을 함께 봅니다.</p>' },
        { layout: 'table', title: 'stop vs deallocate', head: ['명령', '요금'], rows: [['az vm stop', '계속'], ['az vm deallocate', '멈춤']], notes: '<p>포털의 "중지" 버튼은 deallocate 라는 점.</p>' },
        { layout: 'summary', title: '정리', bullets: ['VM 하나에 딸린 리소스 5개', 'NSG = Azure 방화벽', 'stop 은 요금이 나온다'], notes: '<p>다음: App Service 와 상자째 지우기.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day04-3',
      title: 'App Service 와 상자째 지우기',
      minutes: 120,
      goals: [
        'az webapp up 한 줄로 웹앱을 배포하고 PaaS 가 대신해 준 일을 말할 수 있다',
        'AWS 와 Azure 의 용어를 대응시켜 비교표를 만든다',
        '리소스 그룹 삭제로 모든 리소스를 정리하고 확인한다'
      ],
      flow: [['PaaS 란', 15], ['webapp up', 30], ['AWS ↔ Azure 비교', 30], ['상자째 지우기', 25], ['산출물', 20]],
      content: [
        { type: 'p', html: 'VM 은 OS 설치 · 업데이트 · 웹 서버 설정 · 포트 열기를 내가 했습니다. <b>App Service</b> 는 코드(여기서는 HTML)만 올리면 나머지를 Azure 가 합니다. 이것이 <b>PaaS</b> 입니다.' },
        { type: 'cmd', title: '명령 한 줄로 웹앱 배포', code: 'mkdir -p ~/hello && cd ~/hello\necho \'<meta charset="utf-8"><h1>Hello Azure App Service · 학번</h1>\' > index.html\naz webapp up --name app-2026123 --resource-group rg-cloud70 --location koreacentral --sku F1 --html\ncurl -s http://$(az webapp list -o table | awk \'NR>2{print $NF}\' | head -1)', desc: '<code>F1</code> 은 무료 요금제입니다. 이름은 전 세계에서 겹치면 안 되므로 학번을 붙입니다. 실제로는 출력된 URL 을 브라우저로 열면 <b>https</b> 로도 열립니다 — 인증서도 Azure 가 붙여 줍니다.' },
        { type: 'callout', kind: 'info', title: '방금 하지 않은 일', html: '<p>OS 를 설치하지 않았고, Nginx 를 깔지 않았고, 포트를 열지 않았고, 인증서를 만들지 않았습니다. 그 일을 누가 했을까요? 그 대가로 무엇을 포기했을까요? (힌트: 서버 안에 원하는 프로그램을 마음대로 설치할 수 없음)</p>' },
        { type: 'h', text: 'AWS ↔ Azure 비교' },
        { type: 'table', head: ['개념', 'AWS (3일차)', 'Azure (오늘)'], rows: [['가상 서버', 'EC2', 'Virtual Machines'], ['방화벽', '보안 그룹', 'NSG'], ['SSH 키 등록', '키 페어 가져오기', 'VM 만들 때 공개키 붙여넣기'], ['기본 사용자', 'ubuntu', 'azureuser (직접 정함)'], ['브라우저 터미널 · CLI', 'CloudShell · aws', 'Cloud Shell · az'], ['한 번에 정리', '하나하나', '리소스 그룹 삭제'], ['PaaS 웹 호스팅', 'Elastic Beanstalk', 'App Service']] },
        { type: 'h', text: '상자째 지우기' },
        { type: 'cmd', title: '리소스 그룹 삭제와 확인', code: 'az group delete -n rg-cloud70 --yes --no-wait\naz group list -o table\naz resource list -o table', desc: '<code>NetworkWatcherRG</code> 는 Azure 가 자동으로 만든 그룹으로 비용이 없습니다. 그 외 그룹이 남았다면 함께 지웁니다. 포털의 구독 개요 화면에서 남은 크레딧도 확인합니다.' },
        { type: 'callout', kind: 'vm', title: '실제 클라우드에서 — 오늘의 산출물', html: '<ol><li>VM Nginx 페이지 화면 (주소창 포함)</li><li>NSG 인바운드 규칙 화면 (HTTP 허용, SSH 내 IP)</li><li>App Service 페이지 화면 (주소창 포함)</li><li><code>az resource list -g rg-cloud70 -o table</code> 출력</li><li>AWS ↔ Azure 비교표와 리소스 그룹 삭제 확인 출력</li></ol>' }
      ],
      practice: [
        {
          title: '실습 4-3. App Service 로 배포',
          level: 1,
          desc: '<p><code>az webapp up</code> 으로 <code>Azure</code> 라는 글자가 들어간 HTML 페이지를 배포하세요. 배포된 주소를 <code>curl</code> 했을 때 그 페이지가 나와야 합니다.</p>',
          hint: 'index.html 이 있는 폴더에서 <code>az webapp up --name app-학번 --resource-group rg-cloud70 --location koreacentral --sku F1 --html</code>',
          solution: 'az group exists -n rg-cloud70 | grep -q true || az group create -n rg-cloud70 -l koreacentral -o none\nmkdir -p ~/hello && cd ~/hello\necho \'<meta charset="utf-8"><h1>Hello Azure App Service</h1>\' > index.html\naz webapp up --name app-2026123 --resource-group rg-cloud70 --location koreacentral --sku F1 --html -o none\ncurl -s http://$(az webapp list -o table | awk \'NR>2{print $NF}\' | head -1)',
          check: 'h=$(az webapp list -o table 2>/dev/null | awk \'NR>2{print $NF}\' | head -1); [ -n "$h" ] && curl -s http://$h | grep -q Azure',
          checkOk: 'App Service 에서 페이지가 열립니다.',
          checkFail: '<code>az webapp list -o table</code> 로 주소를 확인하고 <code>curl -s http://주소</code> 를 해 보세요.'
        },
        {
          title: '실습 4-4. 상자째 지우기',
          level: 1,
          desc: '<p>리소스 그룹 <code>rg-cloud70</code> 을 삭제해 오늘 만든 모든 리소스를 정리하세요.</p>',
          hint: '<code>az group delete -n rg-cloud70 --yes</code>',
          solution: 'az group delete -n rg-cloud70 --yes\naz group list -o table\naz resource list -o table',
          check: '[ -z "$(az resource list --query "[].name" -o tsv 2>/dev/null)" ] && ! az group list --query "[].name" -o tsv 2>/dev/null | grep -qx rg-cloud70',
          checkOk: '남은 리소스가 없습니다.',
          checkFail: '<code>az group list -o table</code> 와 <code>az resource list -o table</code> 로 남은 것을 확인하세요.'
        }
      ],
      quiz: [
        { q: 'App Service 에 HTML 을 올릴 때 사용자가 <b>하지 않은</b> 일은?', options: ['index.html 작성', '앱 이름 정하기', 'OS 업데이트와 웹 서버 설치', '요금제(F1) 선택'], answer: 2, explain: 'PaaS 는 OS · 런타임 · 웹 서버를 플랫폼이 관리합니다.' },
        { q: 'AWS 보안 그룹에 해당하는 Azure 의 것은?', options: ['리소스 그룹', 'NSG', 'App Service 플랜', 'VNET'], answer: 1, explain: '이름만 다르고 하는 일은 같습니다.' },
        { q: '리소스 그룹을 지운 뒤에도 남아 있어도 되는 그룹은?', options: ['rg-cloud70', 'NetworkWatcherRG', 'appsvc_rg', '모두 지워야 함'], answer: 1, explain: 'NetworkWatcherRG 는 자동 생성되며 비용이 없습니다.' }
      ],
      slides: [
        { layout: 'title', title: 'App Service', subtitle: '서버 없이 웹앱', notes: '<p>VM 에서 한 일과 비교하며 시작합니다.</p>' },
        { layout: 'code', title: '한 줄 배포', code: 'az webapp up --name app-2026123 \\\n  --resource-group rg-cloud70 \\\n  --location koreacentral --sku F1 --html', points: ['F1 = 무료', 'https 인증서까지 자동'], notes: '<p>방금 하지 않은 일을 학생들이 말하게 합니다.</p>' },
        { layout: 'table', title: 'AWS ↔ Azure', head: ['개념', 'AWS', 'Azure'], rows: [['서버', 'EC2', 'VM'], ['방화벽', '보안 그룹', 'NSG'], ['정리', '하나하나', '리소스 그룹'], ['PaaS', 'Beanstalk', 'App Service']], notes: '<p>학생들의 비교표를 함께 채웁니다.</p>' },
        { layout: 'code', title: '상자째 지우기', code: 'az group delete -n rg-cloud70 --yes --no-wait\naz group list -o table', points: ['NetworkWatcherRG 는 그대로'], notes: '<p>정리 출력 확인 후 퇴실.</p>' },
        { layout: 'summary', title: '오늘 한 일', bullets: ['학생 구독과 리소스 그룹', 'VM · NSG', 'App Service (PaaS)', '상자째 정리'], notes: '<p>내일은 Google Cloud 의 상시 무료 VM 입니다.</p>' }
      ]
    }
  ]
});
