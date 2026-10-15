module.exports = {
  day: 5,
  goals: [
    'Google Cloud 상시 무료 조건에 맞춰 e2-micro VM을 만든다',
    'VPC 방화벽 규칙과 네트워크 태그의 관계를 이해한다',
    'gcloud CLI로 VM을 조회·접속·중지한다',
    '한국과 미국 리전의 응답 시간을 재고 3사 비교표를 완성한다'
  ],
  lab: {
    h1: 'Google Cloud — 상시 무료 VM',
    standfirst: '세 번째 클라우드입니다. 오늘 만드는 e2-micro는 조건만 지키면 기간 제한 없이 무료입니다. 대신 조건이 까다롭습니다. 리전, 머신 유형, 디스크 종류 중 하나만 틀려도 요금이 나옵니다. 설정 하나하나를 표와 대조하면서 만드세요.',
    schedule: ['09:00–11:00 이론', '11:00–12:00 PART 1', '13:00–15:00 PART 2', '15:00–17:00 PART 3 · 산출물'],
    rules: [
      ['무료 조건 세 가지', '미국 3개 리전(us-west1 · us-central1 · us-east1) + <code>e2-micro</code> + <strong>표준 영구 디스크</strong> 30GB 이하.'],
      ['프로젝트 확인', '콘솔 맨 위의 프로젝트가 <code>cloud70-학번</code>인지 확인하고 시작합니다.'],
      ['끝나면 중지', '오늘 만든 VM은 지우지 않고 <strong>중지</strong>합니다. Oracle 서버가 안 될 때 대신 쓸 예비 서버입니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '상시 무료 VM 만들기', time: '11:00–12:00',
        lede: '콘솔 메뉴 → <strong>Compute Engine → VM 인스턴스</strong>. API 사용 설정을 묻으면 <strong>사용</strong>을 누르고 1~2분 기다립니다.',
        missions: [
          { n: 1, h: 'SSH 공개키 등록', body: `
      <p>Google Cloud는 공개키 끝의 주석을 <strong>로그인 사용자 이름</strong>으로 씁니다. 주석을 영문 이름으로 바꿔서 등록합니다.</p>
      <pre><span class="p">$</span> awk '{print $1, $2, "gcpuser"}' ~/.ssh/id_ed25519.pub
<span class="o">ssh-ed25519 AAAAC3Nza... gcpuser</span></pre>
      <p>출력된 한 줄을 복사해 <strong>Compute Engine → 메타데이터 → SSH 키 → 수정 → 항목 추가</strong>에 붙여 넣고 저장합니다. 이제 이 프로젝트의 모든 VM에 <code>gcpuser</code>로 접속할 수 있습니다.</p>` },

          { n: 2, h: 'VM 설정 — 무료 조건과 대조', body: `
      <div class="tablewrap"><table>
        <thead><tr><th>항목</th><th>선택</th><th>틀리면</th></tr></thead>
        <tbody>
          <tr><td>이름</td><td><code>vm-free</code></td><td></td></tr>
          <tr><td>리전 · 영역</td><td><code>us-west1</code> (오리건) · <code>us-west1-b</code></td><td>서울 리전은 무료 아님</td></tr>
          <tr><td>머신 구성</td><td>E2 · <code>e2-micro</code></td><td>e2-small부터 유료</td></tr>
          <tr><td>OS 및 스토리지 · 이미지</td><td>Ubuntu 24.04 LTS (x86/64)</td><td></td></tr>
          <tr><td>부팅 디스크 유형</td><td><strong>표준 영구 디스크</strong></td><td>기본값 "균형 있는 영구 디스크"는 유료</td></tr>
          <tr><td>디스크 크기</td><td>30GB 이하</td><td></td></tr>
          <tr><td>네트워킹 · 방화벽</td><td><strong>HTTP 트래픽 허용</strong> 체크</td><td></td></tr>
        </tbody></table></div>
      <p style="margin-top:10px">오른쪽의 월 예상 비용 패널을 캡처해 두고 <strong>만들기</strong>를 누릅니다.</p>
      <div class="box warn"><span class="lbl">한 대만</span>
        <p>무료는 "한 달 동안 e2-micro 한 대 분량의 시간"입니다. 두 대를 켜면 한 대 분량은 유료입니다.</p></div>` },

          { n: 3, h: '두 가지 방법으로 접속', body: `
      <ol>
        <li><strong>브라우저 SSH</strong> — VM 목록에서 <strong>SSH</strong> 버튼을 누르면 새 창에 터미널이 열립니다.</li>
        <li><strong>내 터미널</strong> — WSL에서 외부 IP로 접속합니다.</li>
      </ol>
      <pre><span class="p">$</span> ssh gcpuser@<span class="c">&lt;외부 IP&gt;</span>
<span class="p">$</span> uname -a; nproc; free -h; df -h /</pre>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p><code>free -h</code>의 메모리는 몇 GB인가요? AWS·Azure 때와 비교해 보세요. 이 크기에서 무엇을 돌릴 수 있고 무엇은 어려울까요?</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '웹 서버와 방화벽 규칙', time: '13:00–15:00',
        lede: 'VM에 SSH로 접속한 상태에서 시작합니다.',
        missions: [
          { n: 4, h: 'Nginx 띄우기', body: `
      <pre><span class="p">$</span> sudo apt update &amp;&amp; sudo apt install -y nginx
<span class="p">$</span> echo '&lt;h1&gt;Hello from Google Cloud e2-micro · 학번&lt;/h1&gt;' | sudo tee /var/www/html/index.html</pre>
      <p>브라우저에서 <code>http://외부IP</code>로 접속합니다. 이번에는 바로 열립니다. 왜일까요?</p>` },

          { n: 5, h: '방화벽 규칙과 네트워크 태그', body: `
      <ol>
        <li>메뉴 → <strong>VPC 네트워크 → 방화벽</strong>. <code>default-allow-http</code> 규칙을 엽니다.</li>
        <li>대상이 <strong>지정된 대상 태그 · http-server</strong>로 되어 있습니다.</li>
        <li>VM 세부정보의 <strong>네트워크 태그</strong>에 <code>http-server</code>가 붙어 있는지 확인합니다.</li>
      </ol>
      <div class="box check"><span class="lbl">세 클라우드의 차이</span>
        <p>AWS·Azure는 방화벽을 VM에 직접 붙였습니다. Google Cloud는 규칙이 네트워크(VPC)에 있고, VM에 붙인 <strong>태그</strong>로 어느 규칙을 받을지 정합니다. "HTTP 트래픽 허용" 체크는 태그를 붙여 준 것입니다.</p></div>
      <div class="box q"><span class="lbl">실험</span>
        <p>VM을 수정해 <code>http-server</code> 태그를 빼고 저장한 뒤 다시 접속해 보세요. 확인 후 태그를 다시 붙입니다.</p></div>` },

          { n: 6, h: 'gcloud CLI 써 보기', body: `
      <p>콘솔 오른쪽 위 <code>&gt;_</code> 아이콘으로 <strong>Cloud Shell</strong>을 엽니다.</p>
      <pre><span class="p">$</span> gcloud config list                       <span class="c"># 현재 프로젝트 확인</span>
<span class="p">$</span> gcloud compute instances list
<span class="p">$</span> gcloud compute instances describe vm-free --zone us-west1-b \\
    --format="value(name, machineType.basename(), status, networkInterfaces[0].accessConfigs[0].natIP)"
<span class="p">$</span> gcloud compute firewall-rules list --format="table(name, sourceRanges.list(), allowed[].map().firewall_rule().list(), targetTags.list())"</pre>
      <div class="box warn"><span class="lbl">SSH가 전 세계에 열려 있다</span>
        <p>목록의 <code>default-allow-ssh</code>는 원본이 <code>0.0.0.0/0</code>입니다. 실제 운영이라면 내 IP와 브라우저 SSH용 대역(<code>35.235.240.0/20</code>)으로 좁힙니다. 10일차 보안 점검에서 다시 다룹니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '거리 재기와 3사 비교', time: '15:00–16:30',
        lede: '내 PC(WSL)에서 측정합니다.',
        missions: [
          { n: 7, h: '한국 ↔ 미국 응답 시간 측정', body: `
      <pre><span class="p">$</span> ping -c 5 <span class="c">&lt;e2-micro 외부 IP&gt;</span>
<span class="p">$</span> for i in 1 2 3; do curl -o /dev/null -s -w "연결 %{time_connect}s · 전체 %{time_total}s\\n" http://<span class="c">&lt;외부 IP&gt;</span>; done
<span class="p">$</span> for i in 1 2 3; do curl -o /dev/null -s -w "연결 %{time_connect}s · 전체 %{time_total}s\\n" https://www.kopo.ac.kr; done</pre>
      <p>평균 ping 시간(ms)을 표로 기록하고, 미국 서버가 한국 서버보다 얼마나 느린지 계산합니다.</p>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>빛의 속도로도 서울–오리건 왕복은 약 60ms가 걸립니다. 측정값이 이보다 큰 이유는 무엇일까요? 그렇다면 한국 사용자용 서비스는 어느 리전에 두어야 할까요?</p></div>` },

          { n: 8, h: '3사 서비스 대응표 완성', body: `
      <p>3·4일차 비교표에 Google Cloud 열을 더해 완성합니다.</p>
      <div class="tablewrap"><table>
        <thead><tr><th>개념</th><th>AWS</th><th>Azure</th><th>Google Cloud</th></tr></thead>
        <tbody>
          <tr><td>가상 서버</td><td></td><td></td><td></td></tr>
          <tr><td>방화벽 · 적용 방식</td><td></td><td></td><td></td></tr>
          <tr><td>SSH 키 등록 위치</td><td></td><td></td><td></td></tr>
          <tr><td>기본 사용자 이름</td><td></td><td></td><td></td></tr>
          <tr><td>브라우저 터미널 · CLI 이름</td><td></td><td></td><td></td></tr>
          <tr><td>객체 스토리지</td><td></td><td></td><td></td></tr>
          <tr><td>무료 조건 요약</td><td></td><td></td><td></td></tr>
          <tr><td>가장 편했던 점 · 불편했던 점</td><td></td><td></td><td></td></tr>
        </tbody></table></div>` },

          { n: 9, h: 'VM 중지하고 비용 확인', body: `
      <pre><span class="p">$</span> gcloud compute instances stop vm-free --zone us-west1-b
<span class="p">$</span> gcloud compute instances list          <span class="c"># STATUS: TERMINATED = 중지됨</span></pre>
      <p>메뉴 → <strong>결제 → 보고서</strong>에서 오늘 날짜 청구 항목을 확인합니다. 무료 사용량은 다음 날 반영될 수 있으니 <strong>내일 아침에 다시 확인</strong>합니다.</p>
      <div class="box check"><span class="lbl">중지하면</span>
        <p>CPU·메모리 요금은 멈추고 디스크만 남습니다. 표준 디스크 30GB까지는 무료입니다. 다시 켜면 외부 IP가 바뀝니다.</p></div>` }
        ]
      }
    ],
    errors: [
      ['"Compute Engine API를 사용 설정해야 함"', '새 프로젝트는 API가 꺼져 있음', '안내 화면에서 <strong>사용</strong> 클릭 후 1~2분 대기'],
      ['<code>ZONE_RESOURCE_POOL_EXHAUSTED</code>', '해당 영역에 e2-micro 재고 없음', '같은 무료 리전의 다른 영역(us-west1-a, -c) 또는 us-central1'],
      ['<code>Permission denied (publickey)</code>', '메타데이터 키의 사용자 이름과 접속 이름이 다름', '키 끝 주석이 <code>gcpuser</code>인지 확인, <code>ssh gcpuser@IP</code>'],
      ['월 예상 비용이 $0이 아님', '디스크 유형이 "균형 있는"이거나 리전이 다름', '설정을 미션 2 표와 다시 대조'],
      ['브라우저 SSH가 "연결 재시도 중"', 'VM 부팅 중이거나 SSH 규칙 변경', '1분 기다리기, <code>default-allow-ssh</code> 규칙 확인']
    ],
    checklist: [
      'e2-micro · 미국 무료 리전 · 표준 디스크로 VM을 만들었다',
      '브라우저 SSH와 내 터미널 SSH 두 방법으로 접속했다',
      'Nginx 페이지가 열렸고, 태그를 뺐다 넣어 방화벽 동작을 확인했다',
      'gcloud로 인스턴스와 방화벽 규칙을 조회했다',
      '한국·미국 응답 시간을 측정해 기록했다',
      '3사 비교표를 완성했다',
      'VM을 중지(TERMINATED)했다'
    ]
  },
  assignment: {
    title: '상시 무료 VM과 3사 비교표',
    lede: '무료 조건을 지켜 서버를 만들었는지, 세 클라우드를 비교할 수 있는지 확인합니다.',
    items: [
      'VM 생성 화면의 월 예상 비용 패널 캡처',
      'e2-micro Nginx 페이지 화면 (주소창 포함)',
      'gcloud 인스턴스·방화벽 조회 출력',
      '응답 시간 측정 결과 표와 확인 질문 답',
      '미션 8 3사 비교표',
      'VM 중지 확인 출력'
    ]
  }
};
