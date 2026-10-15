module.exports = {
  day: 4,
  goals: [
    'Azure for Students로 카드 없이 구독을 만든다',
    '리소스 그룹 안에 VM을 만들고 NSG로 포트를 관리한다',
    'App Service(PaaS)로 서버 관리 없이 웹앱을 배포한다',
    '리소스 그룹 삭제 한 번으로 모든 리소스를 정리한다'
  ],
  lab: {
    h1: 'Microsoft Azure — VM과 App Service',
    standfirst: '어제 AWS에서 한 일을 Azure에서 다시 합니다. 같은 일을 두 번 하면 "클라우드마다 다른 것"과 "어디나 같은 것"이 보입니다. Azure만의 핵심은 리소스 그룹입니다. 관련된 것을 한 상자에 담고, 다 쓰면 상자째 지웁니다.',
    schedule: ['09:00–11:00 이론', '11:00–12:00 PART 1', '13:00–15:00 PART 2', '15:00–17:00 PART 3 · 산출물'],
    rules: [
      ['모든 것은 rg-cloud70 안에', '오늘 만드는 모든 리소스는 리소스 그룹 <code>rg-cloud70</code>에 넣습니다. 그래야 한 번에 지울 수 있습니다.'],
      ['어제와 비교하며', 'AWS에서 무엇이었는지 옆에 적으면서 진행하세요. 미션 9의 비교표가 오늘의 핵심 산출물입니다.'],
      ['크레딧도 돈이다', '학생 크레딧 $100은 소진되면 끝입니다. "무료 서비스 대상" 표시를 확인하세요.']
    ],
    parts: [
      {
        pn: 'PART 1', h: 'Azure for Students 가입과 포털 둘러보기', time: '11:00–12:00',
        lede: '학교 이메일을 준비하세요.',
        missions: [
          { n: 1, h: '학생 구독 만들기', body: `
      <ol>
        <li><code>azure.microsoft.com/free/students</code> → <strong>무료로 시작</strong>.</li>
        <li>Microsoft 계정으로 로그인하고, 학생 인증에 <strong>학교 이메일</strong>을 입력해 메일로 온 링크를 누릅니다.</li>
        <li>휴대폰 인증을 마치면 <code>portal.azure.com</code>이 열립니다. 카드는 묻지 않습니다.</li>
        <li>로그인 계정의 보안 정보(<code>mysignins.microsoft.com/security-info</code>)에 인증 앱을 추가해 MFA를 켭니다.</li>
      </ol>
      <div class="box warn"><span class="lbl">학생 인증이 안 되면</span>
        <p>학교 도메인이 인식되지 않는 경우가 있습니다. 이때는 Azure 무료 계정($200, 30일, 카드 필요)으로 진행하거나 조 계정으로 함께 실습합니다.</p></div>` },

          { n: 2, h: '리소스 그룹 만들기', body: `
      <ol>
        <li>포털 검색창 → <strong>리소스 그룹</strong> → <strong>만들기</strong>.</li>
        <li>구독 <code>Azure for Students</code>, 이름 <code>rg-cloud70</code>, 지역 <strong>Korea Central</strong>.</li>
        <li><strong>검토 + 만들기</strong> → <strong>만들기</strong>.</li>
      </ol>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>AWS에는 리소스 그룹이 없었습니다. 어제 정리할 때 무엇을 하나하나 확인해야 했는지 떠올려 보세요. 리소스 그룹이 있으면 무엇이 쉬워질까요?</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: 'Azure VM 만들기', time: '13:00–15:00',
        lede: '포털 검색창 → <strong>Virtual Machines</strong> → <strong>만들기 → Azure 가상 머신</strong>.',
        missions: [
          { n: 3, h: 'VM 설정', body: `
      <div class="tablewrap"><table>
        <thead><tr><th>탭 · 항목</th><th>선택</th></tr></thead>
        <tbody>
          <tr><td>기본 · 리소스 그룹</td><td><code>rg-cloud70</code></td></tr>
          <tr><td>기본 · 가상 머신 이름</td><td><code>vm-학번</code></td></tr>
          <tr><td>기본 · 지역</td><td>Korea Central (막히면 아래 오류표 참고)</td></tr>
          <tr><td>기본 · 이미지</td><td>Ubuntu Server 24.04 LTS - x64 Gen2</td></tr>
          <tr><td>기본 · 크기</td><td><strong>무료 서비스 대상</strong> 표시가 있는 B 시리즈 (예: <code>Standard_B1s</code>)</td></tr>
          <tr><td>기본 · 인증 형식</td><td>SSH 공개 키 · 사용자 이름 <code>azureuser</code></td></tr>
          <tr><td>기본 · SSH 공개 키 원본</td><td><strong>기존 공개 키 사용</strong> → <code>cat ~/.ssh/id_ed25519.pub</code> 결과 붙여넣기</td></tr>
          <tr><td>기본 · 공용 인바운드 포트</td><td>선택한 포트 허용 · SSH(22)</td></tr>
          <tr><td>네트워킹</td><td><strong>VM이 삭제될 때 공용 IP 및 NIC 삭제</strong> 체크</td></tr>
        </tbody></table></div>
      <p style="margin-top:10px"><strong>검토 + 만들기</strong>에서 표시되는 시간당 가격을 확인하고 만듭니다. 배포가 끝나면 <strong>리소스로 이동</strong> → 공용 IP 주소를 복사합니다.</p>` },

          { n: 4, h: '접속하고 웹 서버 띄우기', body: `
      <pre><span class="p">$</span> ssh azureuser@<span class="c">&lt;공용 IP&gt;</span>
<span class="p">$</span> uname -a; nproc; free -h
<span class="p">$</span> sudo apt update &amp;&amp; sudo apt install -y nginx
<span class="p">$</span> echo '&lt;h1&gt;Hello from Azure VM · 학번&lt;/h1&gt;' | sudo tee /var/www/html/index.html</pre>
      <p>브라우저에서 <code>http://공용IP</code>로 접속하면 연결이 안 됩니다. 80번 포트가 아직 닫혀 있기 때문입니다.</p>` },

          { n: 5, h: 'NSG — 80번 열고 22번 좁히기', body: `
      <ol>
        <li>VM 메뉴 <strong>네트워킹 → 네트워크 설정</strong> → <strong>포트 규칙 만들기 → 인바운드 포트 규칙</strong>.</li>
        <li>서비스 <code>HTTP</code>, 원본 Any, 작업 허용으로 추가합니다. 브라우저로 다시 접속해 봅니다.</li>
        <li>기존 SSH 규칙을 눌러 <strong>원본</strong>을 <strong>내 IP 주소</strong>로 바꿔 저장합니다.</li>
      </ol>
      <div class="box check"><span class="lbl">어제와 같은 것</span>
        <p>AWS 보안 그룹 = Azure NSG(네트워크 보안 그룹). 이름만 다르고 하는 일은 같습니다. 6일차 Oracle에서는 "보안 목록"이라고 부릅니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: 'App Service와 리소스 그룹 정리', time: '15:00–16:30',
        lede: '포털 위쪽 막대의 <code>&gt;_</code> 아이콘으로 <strong>Cloud Shell</strong>을 엽니다. Bash를 고르고, 스토리지를 묻으면 "스토리지 계정 필요 없음"을 고릅니다.',
        missions: [
          { n: 6, h: '명령 한 줄로 웹앱 배포 (PaaS)', body: `
      <pre><span class="p">$</span> mkdir hello &amp;&amp; cd hello
<span class="p">$</span> echo '&lt;meta charset="utf-8"&gt;&lt;h1&gt;Hello Azure App Service · 학번&lt;/h1&gt;' &gt; index.html
<span class="p">$</span> az webapp up --name app-학번숫자 --resource-group rg-cloud70 \\
    --location koreacentral --sku F1 --html
<span class="o">...</span>
<span class="o">"URL": "http://app-2026123....azurewebsites.net"</span></pre>
      <p>출력된 URL로 접속합니다. 주소는 https로도 열립니다. 인증서를 따로 만들지 않았는데도 그렇습니다.</p>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>방금 OS를 설치했나요? Nginx를 설치했나요? 포트를 열었나요? 그럼 그 일은 누가 했을까요? 이것이 PaaS입니다.</p></div>` },

          { n: 7, h: 'CLI로 내 리소스 보기', body: `
      <pre><span class="p">$</span> az group list -o table
<span class="p">$</span> az resource list -g rg-cloud70 -o table
<span class="p">$</span> az vm list -d -o table          <span class="c"># -d: 공용 IP와 전원 상태까지</span></pre>
      <p>VM 하나를 만들었는데 디스크, NIC, 공용 IP, NSG, 가상 네트워크가 함께 생긴 것을 확인합니다.</p>` },

          { n: 8, h: '상자째 지우기', body: `
      <pre><span class="p">$</span> az group delete -n rg-cloud70 --yes --no-wait
<span class="p">$</span> az group list -o table          <span class="c"># 몇 분 뒤 rg-cloud70이 사라짐</span></pre>
      <div class="box warn"><span class="lbl">남아 있어도 되는 것</span>
        <p><code>NetworkWatcherRG</code>는 Azure가 자동으로 만든 그룹으로 비용이 없습니다. 그 외 그룹이 남았다면 함께 지웁니다.</p></div>` },

          { n: 9, h: 'AWS ↔ Azure 비교표', body: `
      <div class="tablewrap"><table>
        <thead><tr><th>개념</th><th>AWS (3일차)</th><th>Azure (오늘)</th></tr></thead>
        <tbody>
          <tr><td>가상 서버</td><td>EC2</td><td>?</td></tr>
          <tr><td>방화벽</td><td>보안 그룹</td><td>?</td></tr>
          <tr><td>SSH 키 등록 방법</td><td>키 페어 가져오기</td><td>?</td></tr>
          <tr><td>기본 사용자 이름</td><td>ubuntu</td><td>?</td></tr>
          <tr><td>브라우저 터미널</td><td>CloudShell</td><td>?</td></tr>
          <tr><td>한 번에 정리하는 방법</td><td>?</td><td>?</td></tr>
          <tr><td>PaaS 웹 호스팅</td><td>Elastic Beanstalk</td><td>?</td></tr>
        </tbody></table></div>` }
        ]
      }
    ],
    errors: [
      ['<code>RequestDisallowedByAzure</code> 또는 지역 선택 불가', '학생 구독은 허용 지역이 정해져 있음', '오류 메시지에 나온 허용 지역 중 가까운 곳(예: Japan East, East Asia)으로 다시 만듦'],
      ['크기 목록에 B1s가 없음', '해당 지역에 재고 없음 또는 미지원', '"모든 크기 보기"에서 무료 서비스 대상 B 시리즈 선택, 또는 다른 지역'],
      ['SSH <code>Connection timed out</code>', 'NSG의 SSH 원본이 지금 IP와 다름', 'SSH 규칙 원본을 "내 IP 주소"로 다시 저장'],
      ['<code>az webapp up</code>: 이름이 이미 사용 중', '전 세계에서 이름이 겹침', '이름 뒤에 숫자를 더 붙임'],
      ['F1 플랜 생성 실패', '구독당 무료 플랜 개수 제한', '이전에 만든 App Service 플랜을 삭제 후 재시도']
    ],
    checklist: [
      'Azure for Students 구독과 MFA가 있다',
      'VM에 <code>azureuser</code>로 SSH 접속했다',
      'NSG에서 HTTP를 열어 VM 웹페이지가 열렸고, SSH는 내 IP로 좁혔다',
      '<code>az webapp up</code>으로 App Service 페이지가 열렸다',
      '<code>az resource list</code>로 VM에 딸린 리소스를 확인했다',
      '<code>rg-cloud70</code> 삭제를 확인했다'
    ]
  },
  assignment: {
    title: 'Azure VM · App Service · 비교표',
    lede: '같은 웹페이지를 IaaS(VM)와 PaaS(App Service)로 띄우고, AWS와 무엇이 같고 다른지 정리합니다.',
    items: [
      'VM Nginx 페이지 화면 (주소창 포함)',
      'NSG 인바운드 규칙 화면 (HTTP 허용, SSH 내 IP)',
      'App Service 페이지 화면 (주소창 포함)',
      '<code>az resource list -g rg-cloud70 -o table</code> 출력',
      '미션 9 비교표와 리소스 그룹 삭제 확인 출력'
    ]
  }
};
