module.exports = {
  day: 2,
  goals: [
    'IP·포트·DNS·방화벽을 명령으로 직접 확인한다',
    'SSH 키 쌍을 만들고 공개키와 개인키의 역할을 설명한다',
    'AWS·Google Cloud·Oracle Cloud에 가입한다',
    '모든 계정에 MFA와 $1 예산 알림을 건다'
  ],
  lab: {
    h1: '네트워크 · SSH 키 · 계정 안전장치',
    standfirst: '클라우드 서버에 들어가려면 주소(IP), 문(포트), 열쇠(SSH 키)가 필요합니다. 오전에는 셋을 내 PC에서 직접 확인하고 열쇠를 만듭니다. 오후에는 세 개 클라우드에 가입하면서, 서버를 만들기 전에 반드시 안전장치부터 겁니다.',
    schedule: ['09:00–11:00 이론', '11:00–12:00 PART 1', '13:00–15:30 PART 2', '15:30–17:00 PART 3 · 산출물'],
    rules: [
      ['개인키는 내 PC 밖으로 나가지 않는다', '<code>id_ed25519</code>(.pub 없는 파일)는 카톡·메일·GitHub에 절대 올리지 않습니다.'],
      ['가입 직후 안전장치', '가입이 끝나면 다른 것 누르기 전에 MFA와 예산 알림부터 겁니다. 순서를 바꾸지 마세요.'],
      ['홈 리전은 한 번뿐', 'Oracle 가입 때 고르는 홈 리전은 나중에 바꿀 수 없습니다. 반드시 서울 또는 춘천.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '네트워크를 명령으로 보기', time: '11:00–12:00',
        lede: '어제 만든 WSL Ubuntu에서 진행합니다. 먼저 도구를 설치합니다.',
        missions: [
          { n: 1, h: '주소 찾기 — 사설 IP와 공인 IP', body: `
      <pre><span class="p">$</span> sudo apt install -y dnsutils traceroute
<span class="p">$</span> ip -br a                       <span class="c"># 내 PC 안쪽 주소</span>
<span class="p">$</span> curl -s ifconfig.me; echo      <span class="c"># 인터넷이 보는 내 주소</span></pre>
      <p>사설 IP 대역 세 가지(<code>10.x</code>, <code>172.16~31.x</code>, <code>192.168.x</code>) 중 내 주소가 어디에 속하는지 적습니다.</p>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>옆 사람과 <code>ifconfig.me</code> 결과를 비교해 보세요. 왜 같을까요? (힌트: 공유기와 NAT)</p></div>` },

          { n: 2, h: '이름을 주소로 — DNS', body: `
      <pre><span class="p">$</span> nslookup www.kopo.ac.kr
<span class="p">$</span> dig +short google.com
<span class="p">$</span> ping -c 4 google.com          <span class="c"># 응답 시간(ms) 확인</span>
<span class="p">$</span> traceroute -m 15 google.com    <span class="c"># 거쳐 가는 경로</span></pre>
      <div class="box check"><span class="lbl">8일차와 연결</span>
        <p>8일차에 내 서버에 도메인을 붙이면, 바로 이 <code>nslookup</code>으로 연결이 됐는지 확인합니다.</p></div>` },

          { n: 3, h: '문 번호 — 포트', body: `
      <pre><span class="p">$</span> curl -I https://www.google.com      <span class="c"># 443번 포트로 HTTPS 요청, 헤더만</span>
<span class="p">$</span> curl -I http://neverssl.com         <span class="c"># 80번 포트로 HTTP 요청</span>
<span class="p">$</span> sudo ss -tuln                       <span class="c"># 내 PC에서 열려 있는 포트</span></pre>
      <div class="tablewrap"><table>
        <thead><tr><th>포트</th><th>용도</th><th>이 과정에서</th></tr></thead>
        <tbody>
          <tr><td>22</td><td>SSH</td><td>서버 접속. 내 IP에만 열어야 함</td></tr>
          <tr><td>80</td><td>HTTP</td><td>웹. 7일차에 엶</td></tr>
          <tr><td>443</td><td>HTTPS</td><td>보안 웹. 8일차에 엶</td></tr>
          <tr><td>3306</td><td>MariaDB/MySQL</td><td>인터넷에 절대 열지 않음</td></tr>
        </tbody></table></div>` }
        ]
      },
      {
        pn: 'PART 2', h: 'SSH 키 만들기와 클라우드 가입', time: '13:00–15:30',
        lede: '열쇠를 먼저 만들고, 그 열쇠를 등록할 클라우드 계정을 만듭니다.',
        missions: [
          { n: 4, h: 'SSH 키 쌍 만들기', body: `
      <pre><span class="p">$</span> ssh-keygen -t ed25519 -C "학번@cloud70"
<span class="o">Enter file in which to save the key (/home/namo/.ssh/id_ed25519):</span>   <span class="c"># Enter</span>
<span class="o">Enter passphrase (empty for no passphrase):</span>                          <span class="c"># 암호 입력 권장</span>
<span class="p">$</span> ls -l ~/.ssh
<span class="o">-rw------- 1 namo namo 464 ... id_ed25519        ← 개인키 (나만)</span>
<span class="o">-rw-r--r-- 1 namo namo 102 ... id_ed25519.pub    ← 공개키 (서버에 등록)</span>
<span class="p">$</span> cat ~/.ssh/id_ed25519.pub
<span class="o">ssh-ed25519 AAAAC3Nza... 학번@cloud70</span></pre>
      <div class="box check"><span class="lbl">자물쇠와 열쇠</span>
        <p>공개키(<code>.pub</code>)는 <strong>자물쇠</strong>입니다. 서버마다 달아 둡니다. 개인키는 그 자물쇠를 여는 <strong>유일한 열쇠</strong>입니다. 앞으로 AWS·Azure·GCP·Oracle 모두 이 공개키 한 줄을 붙여 넣습니다.</p></div>` },

          { n: 5, h: 'AWS 가입 — 무료 플랜 선택', body: `
      <ol>
        <li><code>aws.amazon.com/free</code> → <strong>무료 계정 생성</strong>. 루트 사용자 이메일과 계정 이름을 입력합니다.</li>
        <li>요금제 선택 화면에서 반드시 <strong>Free plan(무료 플랜)</strong>을 고릅니다. Paid plan을 고르지 마세요.</li>
        <li>연락처, 카드, 휴대폰 인증을 마칩니다. 카드 확인용 소액 승인은 곧 취소됩니다.</li>
        <li>콘솔 오른쪽 위에서 리전을 <strong>아시아 태평양(서울) ap-northeast-2</strong>로 바꿉니다.</li>
      </ol>
      <div class="box warn"><span class="lbl">무료 플랜의 의미</span>
        <p>무료 플랜은 크레딧이 끝나거나 6개월이 지나면 계정이 닫힙니다. 내가 직접 업그레이드하지 않는 한 청구되지 않습니다. 과정 중에는 업그레이드하지 않습니다.</p></div>` },

          { n: 6, h: 'Google Cloud 가입', body: `
      <ol>
        <li><code>cloud.google.com/free</code> → <strong>무료로 시작하기</strong>. 개인 Google 계정으로 로그인합니다.</li>
        <li>국가 대한민국, 계정 유형 <strong>개인</strong>을 고르고 카드를 등록합니다. $0~1 일시 승인 후 취소됩니다.</li>
        <li>콘솔(<code>console.cloud.google.com</code>) 위쪽에서 프로젝트를 새로 만듭니다. 이름: <code>cloud70-학번</code></li>
      </ol>` },

          { n: 7, h: 'Oracle Cloud 가입 — 홈 리전 주의', body: `
      <ol>
        <li><code>oracle.com/cloud/free</code> → <strong>Start for free</strong>.</li>
        <li><strong>Home Region</strong>을 <code>South Korea Central (Seoul)</code> 또는 <code>South Korea North (Chuncheon)</code>으로 고릅니다.</li>
        <li>카드 확인과 이메일 인증을 마칩니다. 승인까지 몇 분~몇 시간 걸릴 수 있으니 먼저 해 둡니다.</li>
        <li>첫 로그인 때 Oracle Mobile Authenticator 등으로 MFA 등록을 요구하면 그대로 따릅니다.</li>
      </ol>
      <div class="box warn"><span class="lbl">가입이 거절되면</span>
        <p>카드 문제나 일시적인 용량 문제인 경우가 많습니다. 같은 날 여러 번 시도하지 말고 기록해 두세요. 6일차에 Google Cloud e2-micro로 대체할 수 있습니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '안전장치 — MFA와 예산 알림', time: '15:30–16:30',
        lede: '세 계정 모두에 같은 두 가지를 겁니다. 서버는 아직 하나도 만들지 않습니다.',
        missions: [
          { n: 8, h: 'AWS 루트 MFA와 제로 지출 예산', body: `
      <ol>
        <li>오른쪽 위 계정 이름 → <strong>보안 자격 증명</strong> → <strong>MFA 디바이스 할당</strong> → 인증 앱. QR을 OTP 앱으로 찍고 연속 코드 두 개를 입력합니다.</li>
        <li>검색창에 <strong>Budgets</strong> → <strong>예산 생성</strong> → <strong>템플릿 사용</strong> → <strong>제로 지출 예산(Zero spend budget)</strong>. 알림 받을 이메일을 넣고 생성합니다.</li>
        <li><strong>IAM</strong> → 사용자 → 사용자 생성. 이름 <code>admin</code>, "콘솔 액세스 제공" 체크, 권한은 <code>AdministratorAccess</code>. 이 사용자에도 MFA를 겁니다.</li>
        <li>로그아웃하고 IAM 사용자 로그인 URL로 <code>admin</code>으로 다시 들어옵니다. 내일부터는 루트가 아닌 <code>admin</code>으로 실습합니다.</li>
      </ol>` },

          { n: 9, h: 'Google Cloud 2단계 인증과 예산', body: `
      <ol>
        <li><code>myaccount.google.com/security</code> → <strong>2단계 인증</strong>을 켭니다.</li>
        <li>Cloud 콘솔 → <strong>결제</strong> → <strong>예산 및 알림</strong> → <strong>예산 만들기</strong>. 금액 1달러(원화 계정이면 1,000원), 알림 50% · 90% · 100%.</li>
      </ol>` },

          { n: 10, h: 'Oracle 예산 알림', body: `
      <ol>
        <li>콘솔 메뉴 → <strong>Billing &amp; Cost Management</strong> → <strong>Budgets</strong> → <strong>Create Budget</strong>.</li>
        <li>대상은 루트 compartment, 금액 <code>1</code>, 알림 규칙은 Actual Spend 100%, 수신 이메일 입력.</li>
      </ol>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>예산 알림은 과금을 <strong>막아 줄까요</strong>, <strong>알려만 줄까요</strong>? 알림을 받으면 무엇부터 해야 할지 한 줄로 적어 두세요.</p></div>` }
        ]
      }
    ],
    errors: [
      ['AWS 가입 중 카드 확인 실패', '해외 결제 차단 또는 체크카드 거절', '카드사 앱에서 해외 결제 허용 후 재시도, 안 되면 교수에게'],
      ['Google Cloud "결제 계정을 만들 수 없음"', '같은 카드·계정으로 이전에 체험판 사용', '이전 사용 이력 확인. 조 계정으로 실습'],
      ['Oracle "Your account is being provisioned"', '계정 준비 중', '이메일이 올 때까지 기다림 (최대 수 시간)'],
      ['OTP 코드가 계속 틀림', '휴대폰 시간이 어긋남', '휴대폰 날짜·시간을 "자동"으로 설정'],
      ['<code>ssh-keygen</code> 후 파일이 안 보임', '<code>ls</code>만 쳐서 숨김 폴더가 안 보임', '<code>ls -al ~/.ssh</code>']
    ],
    checklist: [
      '사설 IP·공인 IP·DNS·포트의 의미를 내 PC 결과로 설명할 수 있다',
      '<code>~/.ssh/id_ed25519</code>와 <code>.pub</code> 두 파일이 있다',
      'AWS를 무료 플랜으로 가입하고 리전을 서울로 바꿨다',
      'Google Cloud 프로젝트 <code>cloud70-학번</code>이 있다',
      'Oracle Cloud 가입을 마쳤거나 승인 대기 중이다 (홈 리전: 서울/춘천)',
      'AWS 루트와 IAM 사용자 모두 MFA가 켜져 있다',
      '세 클라우드 모두 예산 알림이 있다'
    ]
  },
  assignment: {
    title: '열쇠와 안전장치 확인',
    lede: '서버를 만들기 전 준비가 끝났는지 확인합니다. 내일 이 상태에서 바로 EC2를 만듭니다.',
    items: [
      '<code>cat ~/.ssh/id_ed25519.pub</code> 결과 (공개키만! 개인키는 0점)',
      'AWS MFA 할당 화면과 제로 지출 예산 화면 캡처',
      'Google Cloud 예산 화면 캡처',
      'Oracle 홈 리전이 보이는 화면과 예산 화면 캡처',
      '미션 1~3의 명령과 결과, 그리고 확인 질문 3개에 대한 답'
    ],
    note: '캡처에 카드 번호·비밀번호·개인키가 보이면 0점입니다.'
  }
};
