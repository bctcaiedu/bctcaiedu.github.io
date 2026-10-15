module.exports = {
  day: 3,
  goals: [
    'EC2 인스턴스를 만들고 내 SSH 키로 접속한다',
    '보안 그룹으로 포트를 열고 Nginx 웹페이지를 띄운다',
    'S3 버킷으로 서버 없는 정적 웹사이트를 만든다',
    'CloudShell로 남은 리소스를 확인하고 모두 정리한다'
  ],
  lab: {
    h1: 'AWS — EC2와 S3',
    standfirst: '오늘 처음으로 클라우드에 서버를 만듭니다. EC2(가상 서버)와 S3(저장소) 두 가지로 "서버가 있는 웹"과 "서버가 없는 웹"을 하나씩 띄웁니다. 마지막 한 시간은 만든 것을 전부 지우는 연습입니다. 만드는 것보다 지우는 것이 더 중요합니다.',
    schedule: ['09:00–11:00 이론', '11:00–12:00 PART 1', '13:00–15:00 PART 2', '15:00–17:00 PART 3 · 산출물'],
    rules: [
      ['admin으로 로그인', '루트 계정이 아니라 어제 만든 IAM 사용자 <code>admin</code>으로 들어옵니다.'],
      ['리전은 서울', '콘솔 오른쪽 위가 <strong>서울</strong>인지 매번 확인하세요. 다른 리전에 만든 리소스는 안 보여서 못 지웁니다.'],
      ['"프리 티어 사용 가능"만', '인스턴스 유형, 디스크 등 선택지 옆에 이 표시가 없는 것은 고르지 않습니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '첫 EC2 만들기', time: '11:00–12:00',
        lede: '콘솔 검색창에 EC2 → 인스턴스 시작.',
        missions: [
          { n: 1, h: '내 공개키를 AWS에 등록', body: `
      <ol>
        <li>WSL에서 공개키를 출력해 복사합니다: <code>cat ~/.ssh/id_ed25519.pub</code></li>
        <li>EC2 왼쪽 메뉴 <strong>네트워크 및 보안 → 키 페어</strong> → <strong>작업 → 키 페어 가져오기</strong>.</li>
        <li>이름 <code>cloud70-key</code>, 내용 칸에 공개키 한 줄을 붙여 넣고 가져옵니다.</li>
      </ol>
      <div class="box check"><span class="lbl">왜 "생성"이 아니라 "가져오기"인가</span>
        <p>AWS에서 새 키를 만들면 개인키 <code>.pem</code>을 다운로드해 관리해야 합니다. 우리는 어제 만든 키 하나로 4개 클라우드를 모두 씁니다.</p></div>` },

          { n: 2, h: '인스턴스 시작', body: `
      <div class="tablewrap"><table>
        <thead><tr><th>항목</th><th>선택</th></tr></thead>
        <tbody>
          <tr><td>이름</td><td><code>web-학번</code></td></tr>
          <tr><td>AMI</td><td>Ubuntu Server 24.04 LTS (프리 티어 사용 가능)</td></tr>
          <tr><td>인스턴스 유형</td><td>"프리 티어 사용 가능" 표시가 있는 것 (예: <code>t3.micro</code>)</td></tr>
          <tr><td>키 페어</td><td><code>cloud70-key</code></td></tr>
          <tr><td>네트워크 설정</td><td>보안 그룹 생성 · <strong>SSH 트래픽 허용: 내 IP</strong> · 인터넷에서 HTTP 트래픽 허용 체크</td></tr>
          <tr><td>스토리지</td><td>기본값 (8GiB gp3)</td></tr>
        </tbody></table></div>
      <p style="margin-top:10px">인스턴스 상태가 <strong>실행 중</strong>, 상태 검사가 <strong>2/2</strong>가 되면 퍼블릭 IPv4 주소를 복사합니다.</p>
      <div class="box warn"><span class="lbl">SSH를 "위치 무관(0.0.0.0/0)"으로 열지 마세요</span>
        <p>인터넷 전체에서 22번 포트로 비밀번호 대입 공격이 몇 분 안에 들어옵니다. 내 IP만 허용합니다.</p></div>` },

          { n: 3, h: 'SSH로 접속', body: `
      <pre><span class="p">$</span> ssh ubuntu@<span class="c">&lt;퍼블릭 IP&gt;</span>
<span class="o">The authenticity of host ... can't be established.</span>
<span class="o">Are you sure you want to continue connecting (yes/no)?</span> yes
<span class="o">ubuntu@ip-172-31-xx-xx:~$</span></pre>
      <p>프롬프트가 <code>ubuntu@ip-172-31-...</code>로 바뀌면 지금부터 치는 명령은 <strong>서울에 있는 AWS 서버</strong>에서 실행됩니다.</p>
      <pre><span class="p">$</span> uname -a; nproc; free -h; df -h /
<span class="p">$</span> curl -s ifconfig.me; echo         <span class="c"># 콘솔의 퍼블릭 IP와 같은지</span>
<span class="p">$</span> ip -br a                          <span class="c"># 172.31.x.x = VPC 안의 사설 IP</span></pre>` }
        ]
      },
      {
        pn: 'PART 2', h: '웹 서버 띄우고 다뤄 보기', time: '13:00–15:00',
        lede: '오전에 만든 EC2에 다시 SSH로 접속해서 진행합니다.',
        missions: [
          { n: 4, h: 'Nginx 설치와 첫 페이지', body: `
      <pre><span class="p">$</span> sudo apt update &amp;&amp; sudo apt install -y nginx
<span class="p">$</span> systemctl status nginx --no-pager      <span class="c"># active (running)</span>
<span class="p">$</span> echo '&lt;h1&gt;Hello from AWS EC2 · 학번&lt;/h1&gt;' | sudo tee /var/www/html/index.html
<span class="p">$</span> curl -s localhost</pre>
      <p>브라우저에서 <code>http://퍼블릭IP</code>로 접속합니다. <strong>https가 아니라 http</strong>입니다.</p>
      <div class="box q"><span class="lbl">실험</span>
        <p>보안 그룹의 인바운드 규칙에서 HTTP(80) 규칙을 지웠다가 다시 접속해 보세요. 어떻게 되나요? 확인 후 규칙을 다시 추가합니다.</p></div>` },

          { n: 5, h: '서버가 자기 자신을 알아내기 — 메타데이터', body: `
      <p>EC2 안에서는 특별한 주소 <code>169.254.169.254</code>로 "나는 어떤 서버인가"를 물을 수 있습니다. 요즘 EC2는 토큰을 먼저 받아야 합니다(IMDSv2).</p>
      <pre><span class="p">$</span> TOKEN=$(curl -sX PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
<span class="p">$</span> md() { curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/$1; echo; }
<span class="p">$</span> md instance-type
<span class="p">$</span> md placement/availability-zone
<span class="p">$</span> md public-ipv4</pre>
      <div class="box check"><span class="lbl">이론과 연결</span>
        <p>가용영역이 <code>ap-northeast-2a</code>처럼 나옵니다. 리전(서울) 안의 데이터센터 묶음 하나가 가용영역입니다.</p></div>` },

          { n: 6, h: '중지 vs 종료 — IP는 왜 바뀌나', body: `
      <ol>
        <li>콘솔에서 인스턴스를 <strong>중지</strong>하고, 다시 <strong>시작</strong>합니다.</li>
        <li>퍼블릭 IP를 확인합니다. 바뀌었나요? 웹페이지 내용은 남아 있나요?</li>
        <li><code>ssh ubuntu@새IP</code>로 다시 접속해 <code>cat /var/www/html/index.html</code></li>
      </ol>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>디스크(EBS)는 남고 공인 IP는 바뀌었습니다. 그렇다면 도메인을 연결한 서버는 IP가 바뀌지 않게 어떻게 할까요? (8일차에 다시 다룹니다)</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: 'S3 정적 웹사이트와 정리', time: '15:00–16:30',
        lede: '브라우저 안의 리눅스 터미널 CloudShell을 씁니다. 콘솔 위쪽 막대의 <code>&gt;_</code> 아이콘을 누르세요. AWS CLI가 이미 로그인된 상태로 열립니다.',
        missions: [
          { n: 7, h: 'S3 버킷으로 웹사이트 만들기', body: `
      <p>버킷 이름은 전 세계에서 하나뿐이어야 하고, 영어 소문자·숫자·하이픈만 됩니다.</p>
      <pre><span class="p">$</span> B=cloud70-학번숫자-site                 <span class="c"># 예: cloud70-2026123-site</span>
<span class="p">$</span> aws s3 mb s3://$B --region ap-northeast-2
<span class="p">$</span> echo '&lt;meta charset="utf-8"&gt;&lt;h1&gt;서버 없는 웹 · S3&lt;/h1&gt;' &gt; index.html
<span class="p">$</span> aws s3 cp index.html s3://$B/ --content-type "text/html; charset=utf-8"
<span class="p">$</span> aws s3 website s3://$B/ --index-document index.html</pre>
      <p>아직 접속하면 <strong>403 Forbidden</strong>입니다. S3는 기본이 비공개입니다. 이 페이지 하나만 공개로 엽니다.</p>
      <pre><span class="p">$</span> aws s3api put-public-access-block --bucket $B \\
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false
<span class="p">$</span> cat &gt; policy.json &lt;&lt;EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":"*",
 "Action":"s3:GetObject","Resource":"arn:aws:s3:::$B/*"}]}
EOF
<span class="p">$</span> aws s3api put-bucket-policy --bucket $B --policy file://policy.json
<span class="p">$</span> echo "http://$B.s3-website.ap-northeast-2.amazonaws.com"</pre>
      <div class="box warn"><span class="lbl">공개 버킷은 웹사이트용만</span>
        <p>이 버킷에는 공개해도 되는 파일만 올립니다. 과제 파일, 개인 사진, 키를 공개 버킷에 올리는 것이 실제 유출 사고의 가장 흔한 원인입니다.</p></div>` },

          { n: 8, h: 'EC2와 S3 비교', body: `
      <div class="tablewrap"><table>
        <thead><tr><th>비교</th><th>EC2 + Nginx</th><th>S3 정적 웹사이트</th></tr></thead>
        <tbody>
          <tr><td>서비스 모델</td><td>?</td><td>?</td></tr>
          <tr><td>운영체제 업데이트는 누가</td><td>?</td><td>?</td></tr>
          <tr><td>할 수 있는 일</td><td>?</td><td>?</td></tr>
          <tr><td>과금 기준</td><td>?</td><td>?</td></tr>
        </tbody></table></div>` },

          { n: 9, h: '전부 지우고 확인하기', body: `
      <ol>
        <li>EC2 콘솔에서 인스턴스 → <strong>인스턴스 상태 → 인스턴스 종료(삭제)</strong>.</li>
        <li>CloudShell에서 S3 버킷을 비우고 삭제합니다: <code>aws s3 rb s3://$B --force</code></li>
        <li>남은 것이 없는지 확인합니다.</li>
      </ol>
      <pre><span class="p">$</span> aws ec2 describe-instances --query "Reservations[].Instances[].[InstanceId,State.Name]" --output table
<span class="p">$</span> aws ec2 describe-volumes --query "Volumes[].[VolumeId,State]" --output table
<span class="p">$</span> aws ec2 describe-addresses --output table     <span class="c"># 탄력적 IP</span>
<span class="p">$</span> aws s3 ls</pre>
      <div class="box check"><span class="lbl">정상 결과</span>
        <p>인스턴스는 <code>terminated</code>, 볼륨·주소·버킷은 비어 있어야 합니다. 마지막으로 <strong>결제 및 비용 관리 → 크레딧</strong>에서 남은 크레딧을 확인합니다.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>Permission denied (publickey)</code>', '사용자 이름이 틀리거나 다른 키로 만든 인스턴스', 'Ubuntu AMI의 사용자는 <code>ubuntu</code>. 키 페어가 <code>cloud70-key</code>인지 확인'],
      ['SSH가 멈춰 있다가 <code>Connection timed out</code>', '보안 그룹의 "내 IP"가 지금 IP와 다름 (와이파이 변경 등)', '보안 그룹 인바운드 22번 규칙을 "내 IP"로 다시 저장'],
      ['브라우저에서 사이트에 연결할 수 없음', 'https://로 접속했거나 80번 규칙 없음', '<code>http://</code>로 접속, 보안 그룹 HTTP 규칙 확인'],
      ['<code>BucketAlreadyExists</code>', '전 세계 누군가 같은 이름 사용 중', '학번이나 숫자를 더 붙임'],
      ['S3 웹사이트 403 Forbidden', '퍼블릭 액세스 차단 또는 정책 누락', '미션 7의 두 명령 다시 실행, 정책의 버킷 이름 확인'],
      ['<code>REMOTE HOST IDENTIFICATION HAS CHANGED</code>', '같은 IP에 다른 서버가 생김', '<code>ssh-keygen -R &lt;IP&gt;</code> 후 재접속']
    ],
    checklist: [
      'EC2에 내 키로 SSH 접속했다',
      '<code>http://퍼블릭IP</code>에서 내 Nginx 페이지가 열렸다',
      '보안 그룹 규칙을 지우고 다시 넣어 포트의 역할을 확인했다',
      '메타데이터로 인스턴스 유형과 가용영역을 읽었다',
      'S3 웹사이트 주소에서 페이지가 열렸다',
      'EC2 terminated, S3 버킷 삭제를 CLI 출력으로 확인했다'
    ]
  },
  assignment: {
    title: 'EC2 웹페이지와 S3 웹사이트',
    lede: '같은 "웹페이지"를 IaaS와 서버 없는 방식으로 각각 띄워 보고 차이를 기록합니다.',
    items: [
      'EC2 Nginx 페이지 화면 (주소창의 IP가 보이게)',
      '보안 그룹 인바운드 규칙 화면 (SSH 내 IP, HTTP)',
      'S3 웹사이트 화면 (주소창 포함)',
      '미션 8 비교표',
      '미션 9 정리 확인 CLI 출력 전체'
    ],
    note: '정리 확인 출력이 없으면 보안·비용 점수는 0점입니다.'
  }
};
