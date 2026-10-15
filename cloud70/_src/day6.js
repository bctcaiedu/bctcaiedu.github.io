module.exports = {
  day: 6,
  goals: [
    'Oracle Cloud에 VCN과 Always Free Ampere A1 서버를 만든다',
    'ARM(aarch64) 서버의 특징을 확인하고 이후 실습에 미칠 영향을 안다',
    '업데이트·시간대·자동 보안 업데이트로 서버 기본기를 갖춘다',
    '부트 볼륨 백업을 만들어 되돌릴 지점을 확보한다'
  ],
  lab: {
    h1: '내 무료 서버 — Oracle Cloud',
    standfirst: '오늘 만드는 서버가 남은 나흘 동안의 실습 서버이자, 과정이 끝난 뒤에도 남는 내 서버입니다. 오전에는 서버를 만들고, 오후에는 오래 쓸 서버답게 기본기를 다집니다. 마지막에 백업을 떠 두면 내일부터는 마음 놓고 실험해도 됩니다.',
    schedule: ['09:00–11:00 이론', '11:00–12:00 PART 1', '13:00–15:00 PART 2', '15:00–17:00 PART 3 · 산출물'],
    rules: [
      ['Always Free 표시 확인', '셰이프, 이미지, 디스크를 고를 때 <strong>Always Free-eligible</strong> 표시가 있는지 매번 봅니다.'],
      ['A1은 합계 2 OCPU · 12GB', '2026년 기준 무료량입니다. 예전 블로그의 4 OCPU · 24GB 설정을 따라 하지 마세요.'],
      ['막히면 대안으로', '"Out of host capacity"가 계속되면 20분 이상 붙잡지 말고 대안(AMD Micro 또는 5일차 GCP VM)으로 갑니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '네트워크와 서버 만들기', time: '11:00–12:00',
        lede: '<code>cloud.oracle.com</code>에 로그인하고, 오른쪽 위 리전이 홈 리전(서울 또는 춘천)인지 확인합니다.',
        missions: [
          { n: 1, h: 'VCN 만들기', body: `
      <ol>
        <li>메뉴 → <strong>Networking → Virtual cloud networks</strong> → <strong>Start VCN Wizard</strong>.</li>
        <li><strong>Create VCN with Internet Connectivity</strong>를 고릅니다.</li>
        <li>이름 <code>vcn-cloud70</code>, 나머지는 기본값으로 만듭니다.</li>
      </ol>
      <div class="box check"><span class="lbl">무엇이 생겼나</span>
        <p>VCN(가상 네트워크), 공용·사설 서브넷, 인터넷 게이트웨이, 라우트 테이블, 보안 목록이 한 번에 생깁니다. AWS의 VPC, Azure의 가상 네트워크와 같은 것입니다.</p></div>` },

          { n: 2, h: 'Ampere A1 인스턴스 만들기', body: `
      <p>메뉴 → <strong>Compute → Instances</strong> → <strong>Create instance</strong>.</p>
      <div class="tablewrap"><table>
        <thead><tr><th>항목</th><th>선택</th></tr></thead>
        <tbody>
          <tr><td>Name</td><td><code>srv-학번</code></td></tr>
          <tr><td>Image</td><td>Change image → <strong>Canonical Ubuntu 24.04</strong></td></tr>
          <tr><td>Shape</td><td>Change shape → <strong>Ampere</strong> → <code>VM.Standard.A1.Flex</code> · OCPU <strong>2</strong> · Memory <strong>12</strong> GB</td></tr>
          <tr><td>Networking</td><td><code>vcn-cloud70</code>의 <strong>public subnet</strong> · Automatically assign public IPv4 address</td></tr>
          <tr><td>Add SSH keys</td><td><strong>Paste public keys</strong> → <code>cat ~/.ssh/id_ed25519.pub</code> 결과</td></tr>
          <tr><td>Boot volume</td><td>기본값</td></tr>
        </tbody></table></div>
      <p style="margin-top:10px">상태가 <strong>Running</strong>이 되면 Public IP address를 복사합니다.</p>
      <div class="box warn"><span class="lbl">Out of host capacity</span>
        <p>무료 ARM 서버는 인기가 많아 자주 부족합니다. ① OCPU 1 · 6GB로 줄여 재시도 ② Placement에서 다른 Availability/Fault domain ③ 셰이프를 <code>VM.Standard.E2.1.Micro</code>(AMD, 1GB)로 ④ 5일차 GCP <code>vm-free</code>를 다시 켜서 사용. 어느 길로 갔는지 기록해 두세요.</p></div>` },

          { n: 3, h: '접속과 SSH 단축 이름', body: `
      <pre><span class="p">$</span> ssh ubuntu@<span class="c">&lt;Public IP&gt;</span></pre>
      <p>앞으로 나흘 동안 매일 접속하므로 단축 이름을 만듭니다. <strong>내 PC(WSL)</strong>에서:</p>
      <pre><span class="p">$</span> cat &gt;&gt; ~/.ssh/config &lt;&lt;EOF
Host cloud70
    HostName <span class="c">&lt;Public IP&gt;</span>
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519
EOF
<span class="p">$</span> chmod 600 ~/.ssh/config
<span class="p">$</span> ssh cloud70</pre>` }
        ]
      },
      {
        pn: 'PART 2', h: '내 서버 알아보기', time: '13:00–15:00',
        lede: '<code>ssh cloud70</code>으로 접속한 상태에서 진행합니다.',
        missions: [
          { n: 4, h: 'ARM 서버 확인', body: `
      <pre><span class="p">$</span> uname -m                       <span class="c"># aarch64</span>
<span class="p">$</span> dpkg --print-architecture      <span class="c"># arm64</span>
<span class="p">$</span> lscpu | head -15
<span class="p">$</span> nproc; free -h; df -h /</pre>
      <div class="box check"><span class="lbl">ARM이 중요한 이유</span>
        <p>스마트폰과 같은 계열의 CPU입니다. 대부분의 프로그램은 그대로 돌지만, Docker 이미지는 <strong>arm64용이 있어야</strong> 실행됩니다. 7일차에 Docker를 쓸 때 이 점을 확인합니다. (AMD Micro로 만들었다면 <code>x86_64</code>가 나옵니다)</p></div>` },

          { n: 5, h: '업데이트와 시간대', body: `
      <pre><span class="p">$</span> sudo apt update &amp;&amp; sudo apt full-upgrade -y
<span class="p">$</span> ls /var/run/reboot-required 2&gt;/dev/null &amp;&amp; echo "재부팅 필요"
<span class="p">$</span> sudo timedatectl set-timezone Asia/Seoul
<span class="p">$</span> timedatectl | head -4</pre>
      <p>재부팅이 필요하다고 나오면 <code>sudo reboot</code> 후 1분 뒤 <code>ssh cloud70</code>으로 다시 접속합니다.</p>` },

          { n: 6, h: '자동 보안 업데이트 확인', body: `
      <pre><span class="p">$</span> systemctl is-enabled unattended-upgrades
<span class="o">enabled</span>
<span class="p">$</span> cat /etc/apt/apt.conf.d/20auto-upgrades
<span class="o">APT::Periodic::Update-Package-Lists "1";</span>
<span class="o">APT::Periodic::Unattended-Upgrade "1";</span></pre>
      <p>두 값이 <code>"1"</code>이 아니면 켭니다: <code>sudo dpkg-reconfigure -plow unattended-upgrades</code> → Yes</p>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>책임 공유 모델에서 이 서버의 OS 보안 업데이트는 누구 책임인가요? Oracle일까요, 나일까요?</p></div>` },

          { n: 7, h: '두 겹의 방화벽 확인', body: `
      <p>Oracle Ubuntu 이미지에는 <strong>클라우드 보안 목록</strong>과 별개로 <strong>서버 안에도 iptables 방화벽</strong>이 있습니다.</p>
      <pre><span class="p">$</span> sudo iptables -L INPUT -n --line-numbers</pre>
      <p>22번만 ACCEPT이고 마지막에 <code>REJECT ... icmp-host-prohibited</code>가 있는 것을 확인합니다. 콘솔에서는 <strong>VCN → Security Lists → Default Security List</strong>의 Ingress 규칙도 확인합니다.</p>
      <div class="box check"><span class="lbl">내일 할 일</span>
        <p>웹을 열려면 두 곳 모두 80·443을 열어야 합니다. 한 곳만 열면 접속이 안 됩니다. 내일 가장 많이 막히는 지점입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '되돌릴 지점 만들기', time: '15:00–16:30',
        lede: '내일부터 이 서버에 많은 것을 설치합니다. 망가져도 지금 상태로 돌아올 수 있게 백업을 뜹니다.',
        missions: [
          { n: 8, h: '부트 볼륨 백업', body: `
      <ol>
        <li>인스턴스 상세 → <strong>Boot volume</strong> → 부트 볼륨 이름 클릭.</li>
        <li><strong>Boot volume backups → Create boot volume backup</strong>. 이름 <code>day6-clean</code>, 유형 <strong>Full</strong>.</li>
        <li>상태가 <strong>Available</strong>이 될 때까지 기다립니다 (수 분).</li>
      </ol>
      <div class="box warn"><span class="lbl">무료 백업은 5개까지</span>
        <p>Always Free에는 볼륨 백업 5개가 포함됩니다. 백업을 6개 이상 만들면 유료입니다.</p></div>` },

          { n: 9, h: '유휴 회수 정책 이해하기', body: `
      <p>Oracle은 7일 동안 CPU·네트워크·메모리 사용률이 모두 20% 미만인 Always Free 인스턴스를 회수할 수 있습니다.</p>
      <pre><span class="p">$</span> uptime                       <span class="c"># 부하 평균</span>
<span class="p">$</span> free -h                      <span class="c"># 메모리 사용량</span></pre>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>과정이 끝난 뒤에도 이 서버를 계속 쓰려면 어떻게 해야 할까요? 회수돼도 다시 만들 수 있게 하려면 무엇을 남겨 두어야 할까요? (10일차 README와 연결됩니다)</p></div>` },

          { n: 10, h: '서버 점검표 작성', body: `
      <div class="tablewrap"><table>
        <thead><tr><th>항목</th><th>확인 명령 · 위치</th><th>내 값</th></tr></thead>
        <tbody>
          <tr><td>셰이프 · 아키텍처</td><td>콘솔 · <code>uname -m</code></td><td></td></tr>
          <tr><td>CPU · 메모리 · 디스크</td><td><code>nproc</code> · <code>free -h</code> · <code>df -h /</code></td><td></td></tr>
          <tr><td>공인 IP · 사설 IP</td><td>콘솔 · <code>ip -br a</code></td><td></td></tr>
          <tr><td>시간대</td><td><code>timedatectl</code></td><td></td></tr>
          <tr><td>자동 보안 업데이트</td><td><code>20auto-upgrades</code></td><td></td></tr>
          <tr><td>열린 포트 (보안 목록 / iptables)</td><td>콘솔 · <code>iptables -L</code></td><td></td></tr>
          <tr><td>백업</td><td>Boot volume backups</td><td></td></tr>
        </tbody></table></div>` }
        ]
      }
    ],
    errors: [
      ['<code>Out of host capacity</code>', '해당 영역의 무료 ARM 자원 소진', 'OCPU 줄이기, 다른 Fault domain, AMD Micro, GCP 예비 서버 순서로 시도'],
      ['셰이프 목록에 A1이 회색', '이미지가 x86 전용으로 선택됨', '셰이프를 먼저 Ampere로 고른 뒤 이미지를 다시 선택'],
      ['<code>Connection timed out</code>', 'Public IP가 없거나 사설 서브넷에 만듦', '인스턴스 Networking에서 public subnet·Public IP 확인'],
      ['Ingress 규칙을 바꿨는데 반영 안 됨', '다른 서브넷의 보안 목록을 수정', '인스턴스의 서브넷 → 연결된 보안 목록인지 확인'],
      ['<code>sudo apt full-upgrade</code> 중 보라색 창', '설정 파일 유지 여부 질문', '기본값(현재 설정 유지)으로 Enter']
    ],
    checklist: [
      'VCN <code>vcn-cloud70</code>과 인스턴스 <code>srv-학번</code>이 Running이다',
      '<code>ssh cloud70</code>으로 접속된다',
      '<code>uname -m</code> 결과와 그 의미를 설명할 수 있다',
      '업데이트, 시간대(Asia/Seoul), 자동 보안 업데이트를 확인했다',
      '보안 목록과 iptables 두 방화벽을 각각 확인했다',
      '부트 볼륨 백업 <code>day6-clean</code>이 Available이다'
    ]
  },
  assignment: {
    title: '내 무료 서버 1대와 서버 점검표',
    lede: '남은 나흘과 그 이후를 함께할 서버가 준비됐는지 확인합니다.',
    items: [
      '인스턴스 상세 화면 (Shape, Always Free 표시, Public IP)',
      '<code>ssh cloud70</code> 접속 후 <code>uname -m; nproc; free -h; timedatectl | head -4</code> 출력',
      '미션 7의 iptables 출력과 보안 목록 Ingress 규칙 화면',
      '부트 볼륨 백업 Available 화면',
      '미션 10 서버 점검표 (대안 서버를 썼다면 이유와 함께)'
    ]
  }
};
