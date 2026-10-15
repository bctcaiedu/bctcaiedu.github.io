module.exports = {
  day: 1,
  goals: [
    '클라우드와 온프레미스의 차이, IaaS·PaaS·SaaS를 예를 들어 설명한다',
    '4개 클라우드의 무료 조건을 비교표로 정리하고 가입 준비를 끝낸다',
    '내 PC에 리눅스 터미널(WSL Ubuntu)을 준비한다',
    '리눅스 기본 명령 20개로 파일·폴더·시스템 정보를 다룬다'
  ],
  lab: {
    h1: '클라우드란 · 리눅스 첫걸음',
    standfirst: '오늘은 클라우드에 서버를 만들기 전에 필요한 두 가지를 준비합니다. 네 개 클라우드에 가입할 준비, 그리고 클라우드 서버를 다룰 리눅스 손놀림입니다. 클라우드 서버는 모니터가 없습니다. 내일부터 모든 작업은 오늘 배우는 터미널에서 합니다.',
    schedule: ['09:00–11:00 이론', '11:00–12:00 PART 1', '13:00–15:00 PART 2', '15:00–17:00 PART 3 · 산출물'],
    rules: [
      ['결제수단은 조심히', '카드 정보는 공식 사이트에만 입력합니다. 오늘은 준비만 하고, 실제 가입은 내일 안전장치와 함께 합니다.'],
      ['치기 전에 읽는다', '명령을 그대로 복사하지 말고 무엇을 하는 명령인지 먼저 읽으세요. 클라우드에서는 잘못 친 명령이 돈이 됩니다.'],
      ['기록이 산출물이다', '실행한 명령과 결과를 메모장에 계속 붙여 두세요. 오늘의 산출물은 그 기록입니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '클라우드 계정 준비', time: '11:00–12:00',
        lede: '네 개 클라우드의 무료 조건을 직접 공식 페이지에서 확인하고, 가입에 필요한 것을 모읍니다.',
        missions: [
          { n: 1, h: '서비스 모델 분류하기', body: `
      <p>아래 서비스를 IaaS · PaaS · SaaS 중 하나로 분류하고, 이유를 한 줄로 적습니다. 기준은 <strong>"내가 관리해야 하는 것이 어디까지인가"</strong>입니다.</p>
      <div class="tablewrap"><table>
        <thead><tr><th>서비스</th><th>분류</th><th>내가 관리하는 것</th></tr></thead>
        <tbody>
          <tr><td>AWS EC2</td><td>?</td><td>?</td></tr>
          <tr><td>Gmail</td><td>?</td><td>?</td></tr>
          <tr><td>Azure App Service</td><td>?</td><td>?</td></tr>
          <tr><td>Google Cloud Run</td><td>?</td><td>?</td></tr>
          <tr><td>Microsoft 365</td><td>?</td><td>?</td></tr>
          <tr><td>Oracle Cloud Compute</td><td>?</td><td>?</td></tr>
        </tbody></table></div>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>EC2에 Windows 보안 업데이트를 해야 하는 사람은 누구일까요? AWS일까요, 나일까요? 책임 공유 모델로 설명해 보세요.</p></div>` },

          { n: 2, h: '무료 조건 비교표 만들기', body: `
      <p>공식 페이지를 직접 열어 아래 표를 채웁니다. 블로그가 아니라 <strong>공식 페이지</strong>여야 합니다. 조건은 자주 바뀝니다.</p>
      <ul>
        <li>AWS — <code>aws.amazon.com/free</code></li>
        <li>Azure for Students — <code>azure.microsoft.com/free/students</code></li>
        <li>Google Cloud — <code>cloud.google.com/free</code></li>
        <li>Oracle Cloud — <code>oracle.com/cloud/free</code></li>
      </ul>
      <div class="tablewrap"><table>
        <thead><tr><th>클라우드</th><th>신규 크레딧·기간</th><th>기간 제한 없는 무료 서버</th><th>결제수단</th></tr></thead>
        <tbody><tr><td>AWS</td><td></td><td></td><td></td></tr><tr><td>Azure for Students</td><td></td><td></td><td></td></tr><tr><td>Google Cloud</td><td></td><td></td><td></td></tr><tr><td>Oracle Cloud</td><td></td><td></td><td></td></tr></tbody></table></div>
      <div class="box check"><span class="lbl">정답 맞추기</span>
        <p>"기간 제한 없이 무료로 VM을 계속 켜 둘 수 있는 곳"은 두 곳뿐입니다. 어디인지 표에서 찾으세요. 이 두 곳이 6일차 이후 우리의 서버가 됩니다.</p></div>` },

          { n: 3, h: '가입 준비물 점검', body: `
      <ol>
        <li><strong>해외 결제 카드</strong> — 카드 뒷면에 VISA/Mastercard 표시가 있는지 확인합니다. 체크카드는 클라우드에 따라 거절될 수 있습니다.</li>
        <li><strong>개인 이메일</strong> — 4개 클라우드 모두 같은 이메일로 가입하면 관리가 편합니다. Gmail이면 <code>이름+aws@gmail.com</code>처럼 별칭을 써도 같은 메일함으로 옵니다.</li>
        <li><strong>학교 이메일</strong> — Azure for Students 학생 인증에 씁니다.</li>
        <li><strong>OTP 앱</strong> — 휴대폰에 Google Authenticator 또는 Microsoft Authenticator를 설치합니다. 내일 MFA에 씁니다.</li>
      </ol>
      <div class="box warn"><span class="lbl">카드가 없으면</span>
        <p>담당 교수에게 말하세요. Azure for Students는 카드 없이 가입되고, 나머지는 조 단위로 한 사람 계정에서 함께 실습합니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '내 PC에 리눅스 터미널 만들기', time: '13:00–15:00',
        lede: 'Windows에 WSL(Windows Subsystem for Linux)로 Ubuntu를 설치합니다. macOS는 기본 "터미널" 앱을 쓰면 되므로 미션 6으로 바로 갑니다.',
        missions: [
          { n: 4, h: 'WSL로 Ubuntu 설치', body: `
      <p>시작 메뉴에서 <strong>PowerShell</strong>을 <strong>관리자 권한</strong>으로 실행합니다.</p>
      <pre><span class="p">PS&gt;</span> wsl --install -d Ubuntu-24.04
<span class="o">설치 중: Ubuntu 24.04 LTS ...</span>
<span class="o">요청한 작업이 완료되었습니다. 시스템을 다시 시작해야 변경 내용이 적용됩니다.</span></pre>
      <p>재부팅하면 Ubuntu 창이 자동으로 열리고 사용자 이름과 비밀번호를 묻습니다. 영어 소문자로 만드세요. <strong>비밀번호는 입력해도 화면에 안 보이는 것이 정상</strong>입니다.</p>
      <div class="box warn"><span class="lbl">실습실 PC라 설치가 막히면</span>
        <p>강의실의 <a href="../../ubuntu2404/">Ubuntu 24.04 브라우저 가상 터미널</a>을 쓰세요. 오늘 미션은 모두 그 안에서도 됩니다.</p></div>` },

          { n: 5, h: 'Windows Terminal로 열기', body: `
      <p>Microsoft Store에서 <strong>Windows Terminal</strong>을 설치하고 실행합니다. 탭 옆 <kbd>∨</kbd> 버튼을 누르면 <strong>Ubuntu 24.04</strong>가 보입니다. 앞으로 10일 동안 이 창을 씁니다.</p>
      <pre><span class="p">$</span> whoami
<span class="o">namo</span>
<span class="p">$</span> cat /etc/os-release | head -2
<span class="o">PRETTY_NAME="Ubuntu 24.04.x LTS"</span>
<span class="o">NAME="Ubuntu"</span></pre>
      <div class="box check"><span class="lbl">복사·붙여넣기</span>
        <p>Windows Terminal에서는 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd> / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd>입니다. 그냥 <kbd>Ctrl</kbd>+<kbd>C</kbd>는 실행 중인 명령을 멈추는 키입니다.</p></div>` },

          { n: 6, h: '패키지 최신화와 첫 설치', body: `
      <p>리눅스에서 프로그램은 <code>apt</code>로 설치합니다. <code>sudo</code>는 "관리자 권한으로"라는 뜻입니다.</p>
      <pre><span class="p">$</span> sudo apt update              <span class="c"># 설치 가능한 목록 새로 받기</span>
<span class="p">$</span> sudo apt upgrade -y          <span class="c"># 이미 깔린 것 최신으로</span>
<span class="p">$</span> sudo apt install -y tree htop curl
<span class="p">$</span> tree --version
<span class="o">tree v2.1.1 ...</span></pre>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p><code>apt update</code>와 <code>apt upgrade</code>의 차이는 무엇일까요? <code>update</code>만 하고 <code>upgrade</code>를 안 하면 무엇이 바뀌었을까요?</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '리눅스 기본 명령 20개', time: '15:00–16:30',
        lede: '클라우드 서버에서 매일 쓰는 명령만 골랐습니다. 하나씩 치면서 결과를 메모장에 기록하세요.',
        missions: [
          { n: 7, h: '위치와 파일 다루기', body: `
      <pre><span class="p">$</span> pwd                       <span class="c"># 지금 어디에 있나</span>
<span class="p">$</span> ls -al                    <span class="c"># 숨김 파일까지 자세히</span>
<span class="p">$</span> mkdir -p cloud70/day1     <span class="c"># 폴더 만들기 (-p: 중간 폴더도)</span>
<span class="p">$</span> cd cloud70/day1
<span class="p">$</span> echo "안녕, 클라우드" &gt; hello.txt     <span class="c"># 파일 만들기 (덮어쓰기)</span>
<span class="p">$</span> echo "두 번째 줄" &gt;&gt; hello.txt        <span class="c"># 이어 쓰기</span>
<span class="p">$</span> cat hello.txt
<span class="p">$</span> cp hello.txt copy.txt
<span class="p">$</span> mv copy.txt renamed.txt
<span class="p">$</span> rm renamed.txt
<span class="p">$</span> cd ~ &amp;&amp; tree cloud70</pre>
      <div class="box warn"><span class="lbl">rm은 휴지통이 없다</span>
        <p><code>rm</code>으로 지운 파일은 되살릴 수 없습니다. 특히 <code>rm -rf</code> 뒤에는 경로를 두 번 확인하세요.</p></div>` },

          { n: 8, h: 'nano로 파일 편집', body: `
      <p>서버에는 메모장이 없습니다. 터미널 편집기 <code>nano</code>를 씁니다.</p>
      <pre><span class="p">$</span> nano ~/cloud70/day1/memo.md</pre>
      <ol>
        <li>자기소개 3줄을 입력합니다 (이름, 학과, 이 과정에서 만들고 싶은 서비스).</li>
        <li><kbd>Ctrl</kbd>+<kbd>O</kbd> → <kbd>Enter</kbd>로 저장, <kbd>Ctrl</kbd>+<kbd>X</kbd>로 나갑니다.</li>
        <li><code>cat</code>으로 내용을 확인합니다. 7일차에 이 내용으로 웹페이지를 만듭니다.</li>
      </ol>` },

          { n: 9, h: '시스템 정보 읽기', body: `
      <p>클라우드에서 VM을 만들면 가장 먼저 확인하는 것들입니다.</p>
      <pre><span class="p">$</span> uname -a          <span class="c"># 커널과 CPU 아키텍처 (x86_64 / aarch64)</span>
<span class="p">$</span> nproc             <span class="c"># CPU 코어 수</span>
<span class="p">$</span> free -h           <span class="c"># 메모리</span>
<span class="p">$</span> df -h /           <span class="c"># 디스크</span>
<span class="p">$</span> ip -br a          <span class="c"># 네트워크 주소 (사설 IP)</span>
<span class="p">$</span> curl -s ifconfig.me; echo    <span class="c"># 인터넷에서 보이는 내 주소 (공인 IP)</span>
<span class="p">$</span> htop              <span class="c"># 실시간 사용량, q로 종료</span></pre>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p><code>ip -br a</code>의 주소와 <code>curl ifconfig.me</code>의 주소가 왜 다를까요? 내일 이론 시간에 답합니다. 두 값을 기록해 두세요.</p></div>` },

          { n: 10, h: '권한 읽기', body: `
      <pre><span class="p">$</span> ls -l ~/cloud70/day1/hello.txt
<span class="o">-rw-r--r-- 1 namo namo 37 ... hello.txt</span>
<span class="p">$</span> chmod 600 ~/cloud70/day1/hello.txt
<span class="p">$</span> ls -l ~/cloud70/day1/hello.txt
<span class="o">-rw------- 1 namo namo 37 ... hello.txt</span></pre>
      <p><code>rw-</code> 세 묶음은 차례로 <strong>소유자 · 그룹 · 다른 사람</strong>의 권한입니다. <code>600</code>은 "나만 읽고 쓰기"입니다.</p>
      <div class="box check"><span class="lbl">왜 지금 배우나</span>
        <p>내일 만드는 SSH 개인키는 반드시 <code>600</code>이어야 합니다. 권한이 넓으면 SSH가 키 사용을 거부합니다.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>wsl --install</code>: 가상화가 꺼져 있음 (0x80370102)', 'BIOS에서 CPU 가상화(VT-x/SVM)가 꺼져 있음', '실습실 PC는 강의실 가상 터미널 사용. 개인 PC는 BIOS에서 Virtualization 활성화'],
      ['<code>Permission denied</code>', '관리자 권한이 필요한 작업', '명령 앞에 <code>sudo</code>를 붙임'],
      ['<code>E: Unable to locate package</code>', '패키지 목록이 오래됨 또는 오타', '<code>sudo apt update</code> 후 다시, 철자 확인'],
      ['<code>No such file or directory</code>', '현재 위치가 다르거나 경로 오타', '<code>pwd</code>로 위치 확인, <kbd>Tab</kbd> 자동완성 사용'],
      ['sudo 비밀번호가 안 쳐짐', '보안상 화면에 표시하지 않음', '보이지 않아도 입력되고 있음. 끝까지 치고 Enter']
    ],
    checklist: [
      'IaaS·PaaS·SaaS를 예시 서비스와 함께 설명할 수 있다',
      '4개 클라우드 무료 조건 비교표를 공식 페이지 기준으로 채웠다',
      'Windows Terminal에서 Ubuntu 24.04가 열린다 (또는 가상 터미널 사용)',
      '<code>apt update</code>, <code>apt install</code>로 프로그램을 설치했다',
      'nano로 파일을 만들고 저장했다',
      '<code>uname -a</code>, <code>free -h</code>, <code>df -h</code>로 시스템 정보를 읽었다',
      '사설 IP와 공인 IP 두 값을 기록했다'
    ]
  },
  assignment: {
    title: '계정 준비표와 명령어 로그',
    lede: '내일 가입을 바로 시작할 수 있는지, 오늘 배운 명령을 직접 실행했는지를 확인합니다.',
    items: [
      '미션 2의 무료 조건 비교표 (출처 URL 포함)',
      '미션 3 준비물 점검 결과 (카드 종류는 "있음/없음"만, 번호는 절대 적지 말 것)',
      '미션 7~10에서 실행한 명령과 결과 전체 (터미널 텍스트 복사)',
      '<code>uname -a</code>와 <code>free -h</code> 결과 캡처'
    ],
    sample: `## Day 1 산출물 — 홍길동
### 1. 무료 조건 비교표
| 클라우드 | 크레딧 | 무료 서버 | 결제수단 |
...
### 3. 명령어 로그
$ pwd
/home/gildong
...`,
    note: '카드 번호·비밀번호가 보이는 캡처는 0점입니다.'
  }
};
