module.exports = {
  day: 7,
  title: 'LLM 추론 서버 올리기',
  theme: '모델 파일이 상시 기동 서비스가 되는 순간',

  openingNar: `일곱째 날입니다. 오늘 드디어 모델을 띄웁니다. 그런데 오늘의 진짜 주제는 모델이 아니라 서비스입니다. 프로그램을 한 번 실행하는 것과, 재부팅해도 알아서 살아나고 죽으면 되살아나는 서비스로 만드는 것은 완전히 다른 일입니다. 그 차이를 만드는 것이 시스템디입니다.`,

  goals: [
    ['하드웨어 계층을', '커널·드라이버·런타임의 관계로 설명할 수 있다'],
    ['양자화와 모델 크기의 관계를', '이해하고 내 PC에 맞는 모델을 고를 수 있다'],
    ['Ollama로', '모델을 받아 실행하고 API로 호출할 수 있다'],
    ['systemd unit 파일을', '직접 작성하고 서비스를 등록할 수 있다'],
    ['journalctl로', '서비스 로그를 읽고 장애 원인을 추적할 수 있다'],
    ['Day 6의 배치 러너를', '진짜 추론 API에 연결할 수 있다']
  ],
  goalsNar: `목표는 여섯 개입니다. 하드웨어 계층을 이해하고, 내 컴퓨터에 맞는 모델 크기를 고르고, 올라마로 모델을 띄우고, 그것을 시스템디 서비스로 만들고, 저널씨티엘로 로그를 읽고, 마지막으로 어제 만든 배치 러너를 진짜 에이피아이에 연결합니다.`,

  blocks: [
    { time: '09:00–11:00', title: '하드웨어 계층과 모델 형식', desc: '드라이버 · CUDA · 양자화' },
    { time: '11:10–12:00', title: 'Ollama', desc: '설치 · 모델 관리 · Modelfile' },
    { time: '13:00–15:00', title: 'systemd 정복', desc: 'unit 파일 · systemctl · journalctl' },
    { time: '15:10–17:10', title: '내 손으로 띄우는 추론 API', desc: '서비스화 + curl + 배치 러너 연결' }
  ],
  blocksNar: `오전에는 모델이 어떤 층 위에서 도는지 이해하고 올라마를 설치합니다. 오후 전반이 오늘의 핵심인 시스템디이고, 마지막 두 시간에 전용 계정으로 도는 서비스를 만들어 에이피아이로 호출하고 어제 만든 도구에 연결합니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–11:00', h: '하드웨어 계층과 모델 형식',
      sub: '"버전이 안 맞는다"는 오류가 어디서 나오는지 이해합니다.',
      nar: `첫 번째 블록입니다. 인공지능 환경 구축에서 겪는 오류의 대부분은 층 사이의 버전이 안 맞아서 생깁니다. 어떤 층들이 쌓여 있는지 알면 오류 메시지를 읽을 수 있게 됩니다.` },

    { eb: 'Stack', h: '모델이 도는 층 구조',
      body: `<div class="stack" style="margin-top:1.6cqh">
        <div class="lay"><b>모델 파일</b><span>가중치 — GGUF, safetensors</span></div>
        <div class="lay" style="background:var(--soft)"><b>추론 엔진</b><span>Ollama · llama.cpp · vLLM</span></div>
        <div class="lay" style="background:var(--soft)"><b>런타임</b><span>CUDA · ROCm — GPU를 쓸 때만</span></div>
        <div class="lay" style="background:var(--pine);border-color:var(--pine);color:#fff"><b>드라이버</b><span style="color:#C6D5CE">커널 모듈 — nvidia.ko</span></div>
        <div class="lay" style="background:var(--ink2);border-color:var(--ink2);color:#fff"><b>커널 · 하드웨어</b><span style="color:#93A69E">Day 1에서 본 그 층</span></div>
      </div>`,
      foot: '"CUDA version mismatch"는 위아래 두 층의 버전이 어긋났다는 뜻입니다.',
      nar: `모델 파일이 맨 위에 있고, 그것을 읽어 계산하는 추론 엔진이 있고, 지피유를 쓴다면 쿠다 같은 런타임이 있고, 그 아래 커널 모듈인 드라이버가 있고, 맨 아래 첫날에 본 커널과 하드웨어가 있습니다. 쿠다 버전이 안 맞는다는 오류는 이 층들 중 위아래 두 개가 어긋났다는 뜻입니다. 층 구조를 알면 어느 층을 고쳐야 할지 판단할 수 있습니다.` },

    { eb: 'nvidia-smi', h: 'GPU 상태 읽는 법',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ nvidia-smi</span>
<span class="c">+---------------------------------------------------+
| NVIDIA-SMI 580.65   Driver Version: 580.65   CUDA Version: 13.0 |
|   0  NVIDIA RTX 5070 Ti    | 00000000:01:00.0 |          |
| 32%   54C    P2    120W / 300W |  6144MiB / 16384MiB | 78% |
+---------------------------------------------------+</span>
<span class="c">        온도  전력 사용/한계   VRAM 사용/전체    사용률</span>

<span class="p">$ nvidia-smi --query-gpu=memory.used,memory.total --format=csv</span>
<span class="p">$ watch -n1 nvidia-smi</span>        <span class="c"># 1초마다 갱신</span></pre>`,
      foot: 'VRAM은 모델이 들어갈 자리입니다. 여기가 부족하면 모델이 아예 안 올라갑니다.',
      nar: `엔비디아 에스엠아이는 지피유 상태를 보여 줍니다. 오른쪽 위의 쿠다 버전은 이 드라이버가 지원하는 최대 버전이라는 뜻이지 설치된 쿠다 버전이 아닙니다. 이걸 헷갈리는 분이 많습니다. 중요한 숫자는 브이램 사용량입니다. 모델이 들어갈 자리인데, 여기가 부족하면 모델이 아예 안 올라갑니다. 지피유가 없는 환경이라면 이 부분은 시연으로 보고 넘어갑니다. 시피유로도 오늘 실습은 전부 진행됩니다.` },

    { eb: 'Quantization', h: '양자화 — 정밀도를 낮춰 크기를 줄인다',
      body: `<div class="tablewrap" style="margin-top:1.6cqh"><table>
        <thead><tr><th>형식</th><th>가중치 1개당</th><th>7B 모델 크기</th><th>쓰임</th></tr></thead>
        <tbody>
          <tr><td>FP16</td><td class="num">16비트</td><td class="num">약 14GB</td><td>원본 · 학습용</td></tr>
          <tr><td>Q8_0</td><td class="num">8비트</td><td class="num">약 7GB</td><td>품질 거의 그대로</td></tr>
          <tr><td>Q4_K_M</td><td class="num">4비트</td><td class="num">약 4GB</td><td><strong>가장 널리 쓰이는 타협점</strong></td></tr>
        </tbody>
      </table></div>
      <div class="bannerG" style="margin-top:2cqh">GPU가 없다면 1B급 Q4 모델을 고르세요. 느리지만 오늘 실습은 전부 됩니다.</div>`,
      foot: '"큰 모델을 무리해서"보다 "작은 모델을 제대로 운영"하는 것이 이 과정의 목표입니다.',
      nar: `양자화는 가중치의 정밀도를 낮춰 크기를 줄이는 기술입니다. 원본이 십육 비트라면 팔 비트로, 사 비트로 줄입니다. 칠 비 모델이 십사 기가바이트에서 사 기가바이트까지 줄어듭니다. 품질은 조금 떨어지지만 대부분의 용도에서 체감 차이가 크지 않아서, 큐사 케이 엠이 가장 널리 쓰이는 타협점입니다. 지피유가 없는 환경이라면 일 비급 모델을 고르십시오. 느리지만 오늘 실습은 전부 됩니다. 이 과정의 목표는 큰 모델을 무리해서 돌리는 게 아니라 작은 모델을 제대로 운영하는 것입니다.` },

    { section: true, eb: 'Block 2 · 11:10–12:00', h: 'Ollama',
      sub: '모델을 받고 실행하는 가장 쉬운 방법입니다.',
      nar: `두 번째 블록입니다. 올라마는 모델을 받아 실행하는 도구인데, 설치가 간단하고 에이피아이를 기본으로 제공해서 교육용으로 적합합니다.` },

    { eb: 'Install', h: '설치 스크립트를 읽어 보고 실행하기',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># 흔히 보는 형태 — 그런데 내용을 본 적 있나요?</span>
<span class="p">$ curl -fsSL https://ollama.com/install.sh | sh</span>

<span class="c"># 우리는 이렇게 합니다</span>
<span class="p">$ curl -fsSL https://ollama.com/install.sh -o install.sh</span>
<span class="p">$ less install.sh</span>          <span class="c"># 무엇을 하는지 확인</span>
<span class="p">$ grep -n "systemctl\\|useradd\\|/usr/local" install.sh</span>
<span class="p">$ sh install.sh</span></pre>
      <div class="banner" style="margin-top:2cqh">남의 스크립트에 관리자 권한을 통째로 주는 일입니다. 최소한 한 번은 읽어야 합니다.</div>`,
      foot: 'Day 5에서 배운 저장소 4단계를 이 스크립트가 대신 해 주는 것입니다.',
      nar: `설치 안내에서 컬을 파이프로 에스에이치에 넘기는 형태를 흔히 봅니다. 편리하지만 내용을 모르는 스크립트에 관리자 권한을 통째로 주는 일입니다. 오늘은 파일로 먼저 받아서 읽어 보고 실행합니다. 그렙으로 시스템디 관련 부분과 계정 생성 부분만 봐도 이 스크립트가 무엇을 하는지 감이 옵니다. 다섯째 날에 배운 저장소 네 단계를 이 스크립트가 대신 해 주고 있다는 것을 확인하십시오.` },

    { eb: 'Models', h: '모델 받고 실행하기',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ ollama pull qwen2.5:1.5b</span>
<span class="p">$ ollama list</span>
<span class="c">NAME              ID        SIZE     MODIFIED
qwen2.5:1.5b      abc123    986 MB   2분 전</span>

<span class="p">$ ollama run qwen2.5:1.5b</span>      <span class="c"># 대화형, /bye 로 종료</span>
<span class="p">$ du -sh ~/.ollama/models</span>      <span class="c"># 어디에 얼마나 쌓이는지</span>
<span class="p">$ ollama rm qwen2.5:1.5b</span></pre>`,
      foot: '모델은 수 GB씩 쌓입니다 — Day 9에서 디스크가 차는 주범으로 다시 만납니다.',
      nar: `풀로 모델을 받고 리스트로 확인하고 런으로 실행합니다. 여기서 반드시 확인하실 것이 있습니다. 디유로 모델이 저장되는 디렉터리 크기를 재 보십시오. 모델 하나에 수백 메가바이트에서 수 기가바이트입니다. 몇 개만 받아도 금방 수십 기가바이트가 됩니다. 아홉째 날에 디스크가 가득 차는 장애를 다룰 때 이 디렉터리가 주범으로 다시 등장합니다.` },

    { eb: 'API', h: 'Ollama는 HTTP 서버다',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ ss -tlnp | grep 11434</span>       <span class="c"># 포트를 듣고 있습니다</span>

<span class="p">$ curl -s localhost:11434/api/tags | jq -r '.models[].name'</span>

<span class="p">$ curl -s localhost:11434/api/generate -d '{
    "model": "qwen2.5:1.5b",
    "prompt": "리눅스를 한 문장으로",
    "stream": false
  }' | jq -r .response</span></pre>`,
      foot: 'Day 3의 jq, Day 2의 파이프가 여기서 그대로 쓰입니다.',
      nar: `여기가 중요한 전환점입니다. 올라마는 단순한 명령어 도구가 아니라 에이치티티피 서버입니다. 만천사백삼십사번 포트를 듣고 있습니다. 그래서 컬로 호출할 수 있고, 응답이 제이슨이니까 셋째 날 배운 제이큐로 파싱할 수 있습니다. 지금까지 배운 것들이 여기서 하나로 꿰입니다. 스트림을 거짓으로 두면 전체 응답을 한 번에 받고, 참으로 두면 한 글자씩 흘러나옵니다.` },

    { section: true, eb: 'Block 3 · 13:00–15:00', h: 'systemd 정복',
      sub: '오늘의 진짜 주제입니다. 프로그램을 서비스로 만듭니다.',
      nar: `세 번째 블록이 오늘의 진짜 주제입니다. 시스템디는 첫날에 본 피아이디 일번, 모든 프로세스의 조상입니다. 리눅스에서 서비스를 관리하는 표준입니다.` },

    { eb: 'systemd', h: '실행과 서비스의 차이',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">그냥 실행</span><span class="t">./server &amp;</span><span class="d">터미널을 닫으면 위태롭고<br>재부팅하면 사라지고<br>죽으면 아무도 모릅니다</span></div>
        <div class="card"><span class="n">서비스</span><span class="t">systemd unit</span><span class="d">부팅 시 자동 시작<br>죽으면 자동 재시작<br>로그가 남고 상태를 조회할 수 있습니다</span></div>
      </div>
      <pre style="margin-top:2cqh"><span class="p">$ systemctl status ollama</span>
<span class="p">$ systemctl start / stop / restart ollama</span>
<span class="p">$ sudo systemctl enable ollama</span>     <span class="c"># 부팅 시 자동 시작</span>
<span class="p">$ systemctl list-units --type=service --state=running | head</span></pre>`,
      nar: `그냥 실행하는 것과 서비스로 만드는 것의 차이는 큽니다. 그냥 실행하면 터미널을 닫을 때 위태롭고, 재부팅하면 사라지고, 죽어도 아무도 모릅니다. 서비스로 만들면 부팅할 때 자동으로 시작하고, 죽으면 자동으로 되살아나고, 로그가 남습니다. 시스템씨티엘이 서비스를 제어하는 명령입니다. 스타트와 스톱은 지금 당장이고, 이네이블은 다음 부팅부터입니다. 이 둘을 헷갈려서 재부팅했더니 서비스가 안 뜬다는 일이 자주 있습니다.` },

    { eb: 'Unit file', h: 'unit 파일 해부',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># /etc/systemd/system/ollama.service</span>
<span class="p">[Unit]</span>
Description=Ollama LLM inference server
After=network-online.target        <span class="c"># 네트워크 준비 후에</span>

<span class="p">[Service]</span>
Type=simple
User=ollama                        <span class="c"># 전용 계정 (Day 4)</span>
Group=ollama
ExecStart=/usr/local/bin/ollama serve
EnvironmentFile=-/etc/ollama/env   <span class="c"># 설정 분리 (- = 없어도 OK)</span>
Restart=always
RestartSec=3

<span class="p">[Install]</span>
WantedBy=multi-user.target         <span class="c"># 부팅 시 활성화 대상</span></pre>`,
      foot: '고친 뒤에는 반드시 systemctl daemon-reload — 안 하면 옛 설정으로 돕니다.',
      nar: `유닛 파일은 세 부분입니다. 유닛은 설명과 순서, 서비스는 실제로 무엇을 어떻게 실행할지, 인스톨은 부팅 시 언제 켤지입니다. 여기서 넷째 날 배운 것이 나옵니다. 유저를 전용 계정으로 지정하는 것입니다. 루트로 서비스를 돌리면 그 서비스가 뚫렸을 때 시스템 전체가 뚫립니다. 리스타트 올웨이즈는 죽으면 되살리라는 뜻입니다. 그리고 반드시 기억하실 것. 유닛 파일을 고친 뒤에는 데몬 리로드를 해야 합니다. 안 하면 시스템디가 옛 설정으로 계속 돕니다.` },

    { eb: 'journalctl', h: '로그 읽기 — 장애 대응의 출발점',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ journalctl -u ollama</span>             <span class="c"># 이 서비스의 로그</span>
<span class="p">$ journalctl -u ollama -f</span>          <span class="c"># 실시간 (tail -f 처럼)</span>
<span class="p">$ journalctl -u ollama -n 50</span>       <span class="c"># 최근 50줄</span>
<span class="p">$ journalctl -u ollama --since "10 min ago"</span>
<span class="p">$ journalctl -u ollama -p err</span>      <span class="c"># 오류만</span>
<span class="p">$ journalctl -xe</span>                   <span class="c"># 최근 + 설명</span></pre>
      <div class="bannerG" style="margin-top:2cqh">서비스가 안 뜰 때 순서 — <code>systemctl status</code> → <code>journalctl -u 이름 -n 50</code></div>`,
      nar: `저널씨티엘이 시스템디의 로그 도구입니다. 대시 유로 특정 서비스의 로그만 볼 수 있고, 대시 에프로 실시간 추적이 됩니다. 셋째 날 배운 테일 대시 에프와 같은 감각입니다. 서비스가 안 뜰 때의 순서를 외우십시오. 먼저 스테이터스로 상태를 보고, 거기 나온 힌트가 부족하면 저널씨티엘로 최근 오십 줄을 봅니다. 아홉째 날 장애 랩에서 이 순서를 계속 씁니다.` },

    { section: true, eb: 'Block 4 · AI LAB · 15:10–17:10', h: '내 손으로 띄우는 추론 API',
      sub: '설치 스크립트가 만들어 준 서비스를 지우고, 직접 만듭니다.',
      nar: `마지막 블록입니다. 설치 스크립트가 알아서 만들어 준 서비스를 일부러 지우고, 유닛 파일을 직접 써서 다시 만듭니다. 남이 만들어 준 것을 쓰는 것과 내가 만드는 것은 다릅니다.` },

    { eb: 'AI LAB', h: '오늘의 코스',
      body: `<div class="rowlist" style="margin-top:1.6cqh">
        <div class="row"><span class="dot">1</span><span class="t">전용 계정과 설정 파일 만들기</span><span class="d">Day 4 권한 · Day 2 구조</span></div>
        <div class="row"><span class="dot">2</span><span class="t">unit 파일을 직접 작성</span><span class="d">vim (Day 3)</span></div>
        <div class="row"><span class="dot">3</span><span class="t">일부러 오타를 내고 고치기</span><span class="d">journalctl 로 추적</span></div>
        <div class="row"><span class="dot">4</span><span class="t">enable 후 재부팅 검증</span><span class="d">자동 기동 확인</span></div>
        <div class="row"><span class="dot">5</span><span class="t">배치 러너를 진짜 API에 연결</span><span class="d">Day 6의 ask() 교체</span></div>
      </div>`,
      foot: '3번이 핵심입니다 — 고장 내고 로그로 찾아내는 경험이 Day 9의 예행연습입니다.',
      nar: `다섯 단계입니다. 전용 계정과 설정 파일을 만들고, 유닛 파일을 직접 쓰고, 일부러 오타를 내서 고장 낸 다음 로그로 원인을 찾아 고치고, 자동 기동을 검증하고, 마지막으로 어제 만든 배치 러너를 진짜 에이피아이에 연결합니다. 세 번째가 핵심입니다. 일부러 고장 내고 로그로 찾아내는 경험이 아홉째 날 장애 랩의 예행연습입니다.` },

    { eb: 'Connect', h: '어제의 도구가 오늘 진짜가 된다',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># Day 6 batch_runner.sh 의 ask() — 가짜였습니다</span>
<span class="p">ask() { sleep 1; echo "응답"; }</span>

<span class="c"># 오늘 — 진짜 API 호출</span>
<span class="p">ask() {
    local q="$1"
    curl -s --max-time 60 "$OLLAMA_HOST/api/generate" \\
      -d "$(jq -n --arg m "$MODEL" --arg p "$q" \\
            '{model:$m, prompt:$p, stream:false}')" \\
      | jq -r '.response // empty'
}</span></pre>
      <div class="bannerG" style="margin-top:2cqh">함수 하나만 바꿨는데 도구 전체가 살아납니다. 어제 이렇게 설계한 이유입니다.</div>`,
      foot: 'jq -n 으로 JSON을 만들면 따옴표가 든 프롬프트도 안전합니다 (Day 6의 인용부호 규칙).',
      nar: `마지막이 오늘의 보람입니다. 어제 만든 배치 러너의 애스크 함수는 가짜였습니다. 그 함수 하나만 진짜 에이피아이 호출로 바꾸면 도구 전체가 살아납니다. 어제 바뀔 부분을 함수로 격리하라고 한 이유가 여기 있습니다. 한 가지 기술을 덧붙이면, 제이큐 대시 엔으로 제이슨을 만들면 프롬프트에 따옴표가 들어 있어도 안전하게 처리됩니다. 어제 배운 인용부호 규칙의 연장입니다.` }
  ],

  assignment: {
    title: '나만의 추론 서비스 unit 파일',
    lede: '설치 스크립트가 만들어 준 것이 아니라, 직접 작성한 unit으로 서비스를 운영하십시오.',
    items: [
      '전용 계정으로 구동되는 unit 파일 전문',
      '모델 경로·바인딩 주소를 EnvironmentFile로 분리',
      'Restart 정책과 그 이유',
      'enable 후 재부팅 → 자동 기동 증빙',
      '일부러 낸 오류 1건과 journalctl 추적 기록',
      '배치 러너로 5개 프롬프트를 처리한 CSV'
    ],
    note: '5번이 배점의 절반입니다. <strong>어떻게 고장 냈고, 어떤 로그를 봤고, 무엇을 고쳤는지</strong>를 순서대로 적으십시오.',
    sample: `<span class="o">5. 고의 오류와 추적
   고장 : ExecStart 경로를 /usr/local/bin/ollamaa 로 오타
   증상 : systemctl start 실패, status 에 code=exited status=203
   추적 : journalctl -u myllm -n 20
          → "Failed to locate executable ...: No such file or directory"
   조치 : 경로 수정 후 daemon-reload → start 성공</span>`,
    nar: `과제입니다. 설치 스크립트가 만들어 준 서비스가 아니라 직접 작성한 유닛 파일로 서비스를 운영하십시오. 전용 계정으로 돌고, 설정이 분리돼 있고, 재부팅 후 자동으로 떠야 합니다. 그리고 다섯 번째 항목이 배점의 절반입니다. 일부러 고장을 하나 내고, 어떤 증상이 나왔고, 어떤 로그를 봤고, 무엇을 고쳤는지를 순서대로 적으십시오.` },

  wrap: {
    done: '모델을 띄우고, systemd 서비스로 만들고, 로그로 장애를 추적했습니다.',
    next: '내일 · Day 8 — 컨테이너로 환경 재현',
    nextDesc: '오늘 만든 서비스를 컨테이너로 감싸, 다른 컴퓨터에서 한 줄로 되살아나게 만듭니다.',
    nar: `오늘 한 일을 정리하겠습니다. 모델이 도는 층 구조를 이해했고, 양자화를 알았고, 올라마로 모델을 띄웠습니다. 그리고 오늘의 핵심인 시스템디로 그것을 서비스로 만들고, 저널씨티엘로 장애를 추적했습니다. 마지막으로 어제 만든 배치 러너를 진짜 에이피아이에 연결했습니다. 내일은 컨테이너입니다. 오늘 만든 서비스를 통째로 감싸서 다른 컴퓨터에서 한 줄로 되살아나게 만듭니다. 수고하셨습니다.` },

  lab: {
    h1: 'LLM 추론 서버 올리기',
    standfirst: '오늘은 <strong>WSL2</strong>에서 진행합니다. 시작 전에 <code>/etc/wsl.conf</code>에 systemd가 켜져 있어야 합니다 — PART 0에서 먼저 확인합니다.',
    rules: [
      ['unit 수정 후엔 daemon-reload', '이걸 빼먹으면 옛 설정으로 계속 돕니다. 가장 흔한 함정입니다.'],
      ['start와 enable은 다르다', 'start는 지금, enable은 다음 부팅부터. 둘 다 해야 완성입니다.'],
      ['안 뜨면 status → journalctl', '추측하지 말고 로그를 봅니다. 답은 거의 항상 거기 있습니다.']
    ],
    parts: [
      {
        pn: 'PART 0', h: 'systemd 사용 준비', time: '13:00–13:15',
        steps: [
          { sn: 'CHECK', h: 'WSL2에서 systemd 켜기', body: `
      <pre><span class="p">$</span> cat /etc/wsl.conf 2&gt;/dev/null
<span class="p">$</span> systemctl is-system-running</pre>
      <p><code>offline</code>이나 오류가 나면 아래를 실행하고 WSL을 재시작합니다.</p>
      <pre><span class="p">$</span> sudo tee /etc/wsl.conf &gt; /dev/null &lt;&lt;'EOF'
[boot]
systemd=true
EOF

<span class="c"># Windows PowerShell에서</span>
<span class="p">PS&gt;</span> wsl --shutdown
<span class="c"># 다시 Ubuntu 실행 후</span>
<span class="p">$</span> systemctl is-system-running
<span class="p">$</span> systemctl list-units --type=service --state=running | head</pre>
      <div class="box warn"><span class="lbl">여기서 막히면 진도가 안 나갑니다</span>
        <p>재시작 후에도 안 되면 손을 드세요. 오늘 오후 전체가 systemd 위에서 돌아갑니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 1', h: 'Ollama 설치와 모델', time: '13:15–14:00',
        missions: [
          { n: 1, h: '설치 스크립트를 읽고 실행', body: `
      <pre><span class="p">$</span> cd /tmp
<span class="p">$</span> curl -fsSL https://ollama.com/install.sh -o install.sh
<span class="p">$</span> wc -l install.sh
<span class="p">$</span> grep -n "useradd\\|systemctl\\|/usr/local/bin" install.sh | head -20
<span class="p">$</span> less install.sh          <span class="c"># q 로 종료</span>
<span class="p">$</span> sh install.sh</pre>
      <div class="box q"><span class="lbl">확인 질문</span><ul>
        <li>이 스크립트는 어떤 계정을 만드나요? 왜 만들까요?</li>
        <li>실행 파일을 어디에 설치하나요? 그곳이 PATH에 있나요?</li>
      </ul></div>` },
          { n: 2, h: '모델 받고 크기 확인', body: `
      <pre><span class="p">$</span> ollama pull qwen2.5:1.5b
<span class="p">$</span> ollama list
<span class="p">$</span> du -sh ~/.ollama/models 2&gt;/dev/null || sudo du -sh /usr/share/ollama/.ollama/models
<span class="p">$</span> df -h /

<span class="p">$</span> ollama run qwen2.5:1.5b
<span class="c">&gt;&gt;&gt; 리눅스를 한 문장으로 설명해줘</span>
<span class="c">&gt;&gt;&gt; /bye</span></pre>
      <div class="box warn"><span class="lbl">GPU가 없다면</span>
        <p>느립니다. 정상입니다. 더 작은 모델(<code>qwen2.5:0.5b</code>)로 바꾸면 빨라집니다. 오늘 실습은 모델 품질이 아니라 <strong>운영</strong>이 목적입니다.</p></div>` },
          { n: 3, h: 'HTTP 서버라는 것 확인', body: `
      <pre><span class="p">$</span> ss -tlnp | grep 11434
<span class="p">$</span> curl -s localhost:11434/api/tags | jq -r '.models[].name'

<span class="p">$</span> curl -s localhost:11434/api/generate -d '{
    "model":"qwen2.5:1.5b",
    "prompt":"파이프란 무엇인가요? 한 문장으로",
    "stream":false
  }' | jq -r .response

<span class="c"># 스트리밍도 확인</span>
<span class="p">$</span> curl -sN localhost:11434/api/generate -d '{
    "model":"qwen2.5:1.5b","prompt":"1부터 5까지 세어줘"
  }' | head -5</pre>
      <div class="box check"><span class="lbl">지금까지 배운 것이 여기서 만납니다</span>
        <p>Day 2의 파이프, Day 3의 jq, Day 5의 포트 개념이 한 줄에 다 들어 있습니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: 'systemd 다루기', time: '14:00–15:00',
        missions: [
          { n: 4, h: '기존 서비스 관찰', body: `
      <pre><span class="p">$</span> systemctl status ollama --no-pager
<span class="p">$</span> systemctl cat ollama
<span class="p">$</span> systemctl is-enabled ollama
<span class="p">$</span> journalctl -u ollama -n 20 --no-pager

<span class="p">$</span> sudo systemctl stop ollama
<span class="p">$</span> curl -s localhost:11434/api/tags; echo "종료코드 $?"
<span class="p">$</span> sudo systemctl start ollama
<span class="p">$</span> sleep 3 &amp;&amp; curl -s localhost:11434/api/tags | jq -r '.models[].name'</pre>
      <div class="box check"><span class="lbl">systemctl cat</span>
        <p>unit 파일 내용을 그대로 보여줍니다. 남이 만든 서비스를 이해할 때 가장 먼저 치는 명령입니다.</p></div>` },
          { n: 5, h: '자동 재시작 확인', body: `
      <pre><span class="p">$</span> systemctl show ollama -p Restart
<span class="p">$</span> pgrep -f "ollama serve"
<span class="p">$</span> sudo pkill -f "ollama serve"
<span class="p">$</span> sleep 5
<span class="p">$</span> pgrep -f "ollama serve"        <span class="c">← PID가 바뀐 채 살아 있습니다</span>
<span class="p">$</span> journalctl -u ollama -n 10 --no-pager</pre>
      <div class="box check"><span class="lbl">이것이 서비스의 힘</span>
        <p>프로세스를 죽였는데 systemd가 되살렸습니다. Day 4에서 <code>nohup</code>으로 띄운 작업과 비교해 보세요.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: 'AI LAB · 내 unit 파일 만들기', time: '15:10–16:20',
        lede: '남이 만들어 준 서비스를 멈추고, 내 이름으로 하나 더 만듭니다.',
        missions: [
          { n: 6, h: '설정 파일과 unit 작성', body: `
      <pre><span class="p">$</span> sudo systemctl stop ollama
<span class="p">$</span> sudo systemctl disable ollama

<span class="c"># 설정을 코드 밖으로 분리 (Day 9 보안의 예고편)</span>
<span class="p">$</span> sudo mkdir -p /etc/myllm
<span class="p">$</span> sudo tee /etc/myllm/env &gt; /dev/null &lt;&lt;'EOF'
OLLAMA_HOST=127.0.0.1:11434
OLLAMA_MODELS=/var/lib/myllm/models
OLLAMA_KEEP_ALIVE=5m
EOF
<span class="p">$</span> sudo chmod 640 /etc/myllm/env

<span class="p">$</span> sudo mkdir -p /var/lib/myllm/models
<span class="p">$</span> sudo chown -R ollama:ollama /var/lib/myllm
<span class="p">$</span> sudo chgrp ollama /etc/myllm/env

<span class="p">$</span> sudo vim /etc/systemd/system/myllm.service</pre>
      <p>아래 내용을 입력합니다 (Day 3의 vim 실력이 여기서 쓰입니다).</p>
      <pre>[Unit]
Description=My LLM inference service
After=network-online.target

[Service]
Type=simple
User=ollama
Group=ollama
EnvironmentFile=/etc/myllm/env
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target</pre>
      <pre><span class="p">$</span> sudo systemctl daemon-reload
<span class="p">$</span> sudo systemctl start myllm
<span class="p">$</span> systemctl status myllm --no-pager
<span class="p">$</span> sudo systemctl enable myllm</pre>` },
          { n: 7, h: '모델 다시 받고 동작 확인', body: `
      <pre><span class="p">$</span> sudo -u ollama OLLAMA_MODELS=/var/lib/myllm/models \\
     ollama pull qwen2.5:1.5b
<span class="p">$</span> sudo du -sh /var/lib/myllm/models
<span class="p">$</span> curl -s localhost:11434/api/tags | jq -r '.models[].name'</pre>
      <div class="box check"><span class="lbl">확인</span>
        <p>모델이 <code>/var/lib/myllm/models</code>에 저장됐습니다. 설정을 unit 밖으로 뺐기 때문에 경로를 바꾸려면 <code>/etc/myllm/env</code>만 고치면 됩니다.</p></div>` },
          { n: 8, h: '일부러 고장 내고 추적하기', body: `
      <p>오늘의 핵심 미션입니다. <strong>고장을 만들고 로그로 찾아냅니다.</strong></p>
      <pre><span class="p">$</span> sudo sed -i 's|/usr/local/bin/ollama|/usr/local/bin/ollamaa|' \\
     /etc/systemd/system/myllm.service
<span class="p">$</span> sudo systemctl daemon-reload
<span class="p">$</span> sudo systemctl restart myllm
<span class="p">$</span> systemctl status myllm --no-pager
<span class="p">$</span> journalctl -u myllm -n 20 --no-pager</pre>
      <p>로그에서 원인을 찾았으면 고칩니다.</p>
      <pre><span class="p">$</span> sudo sed -i 's|/usr/local/bin/ollamaa|/usr/local/bin/ollama|' \\
     /etc/systemd/system/myllm.service
<span class="p">$</span> sudo systemctl daemon-reload &amp;&amp; sudo systemctl restart myllm
<span class="p">$</span> systemctl is-active myllm</pre>
      <div class="box warn"><span class="lbl">daemon-reload 없이 해 보기</span>
        <p>고친 뒤 <code>daemon-reload</code>를 <strong>일부러 빼고</strong> restart 해 보세요. 여전히 실패합니다. 이 경험이 있어야 나중에 안 헤맵니다.</p></div>` },
          { n: 9, h: '재부팅 후 자동 기동 검증', body: `
      <pre><span class="p">$</span> systemctl is-enabled myllm
<span class="c"># Windows PowerShell에서</span>
<span class="p">PS&gt;</span> wsl --shutdown
<span class="c"># 다시 Ubuntu 실행 후 (아무 명령도 치지 말고 바로)</span>
<span class="p">$</span> systemctl is-active myllm
<span class="p">$</span> curl -s localhost:11434/api/tags | jq -r '.models[].name'
<span class="p">$</span> journalctl -u myllm --since "5 min ago" --no-pager | head</pre>
      <div class="box check"><span class="lbl">과제 증빙</span><p>이 화면을 캡처해 두세요. 과제 4번 항목입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 4', h: 'AI LAB · 배치 러너 연결', time: '16:20–17:10',
        missions: [
          { n: 10, h: 'ask() 를 진짜 API로 교체', body: `
      <pre><span class="p">$</span> cd ~/ai-lab/scripts
<span class="p">$</span> cp batch_runner.sh batch_runner_real.sh
<span class="p">$</span> vim batch_runner_real.sh</pre>
      <p>상단에 설정을 추가하고 <code>ask()</code>를 교체합니다.</p>
      <pre>OLLAMA_HOST="\${OLLAMA_HOST:-http://localhost:11434}"
MODEL="\${MODEL:-qwen2.5:1.5b}"

ask() {
    local q="$1"
    curl -s --max-time 120 "$OLLAMA_HOST/api/generate" \\
      -d "$(jq -n --arg m "$MODEL" --arg p "$q" \\
            '{model:$m, prompt:$p, stream:false}')" \\
      | jq -r '.response // empty' | head -c 200
}</pre>
      <pre><span class="p">$</span> ./batch_runner_real.sh -p prompts.txt -o ~/ai-lab/logs/real.csv
<span class="p">$</span> column -s, -t &lt; ~/ai-lab/logs/real.csv | head</pre>
      <div class="box check"><span class="lbl">7일간 쌓은 것이 하나로</span>
        <p>Day 2의 리다이렉션, Day 3의 jq, Day 5의 환경변수, Day 6의 스크립트, Day 7의 서비스가 이 한 파일에 전부 들어 있습니다.</p></div>` },
          { n: 11, h: '응답 시간 측정과 분석', body: `
      <pre><span class="p">$</span> awk -F, 'NR&gt;1 {s+=$3; n++} END {print "평균 응답:", s/n, "초"}' \\
     ~/ai-lab/logs/real.csv
<span class="p">$</span> awk -F, 'NR&gt;1 {print $3}' ~/ai-lab/logs/real.csv | sort -n | tail -1

<span class="c"># 모델을 바꿔 비교</span>
<span class="p">$</span> ollama pull qwen2.5:0.5b
<span class="p">$</span> MODEL=qwen2.5:0.5b ./batch_runner_real.sh \\
     -p prompts.txt -o ~/ai-lab/logs/small.csv
<span class="p">$</span> awk -F, 'NR&gt;1 {s+=$3; n++} END {print "0.5b 평균:", s/n}' \\
     ~/ai-lab/logs/small.csv</pre>
      <div class="box q"><span class="lbl">확인 질문</span><p>모델 크기와 응답 시간의 관계가 보이나요? 환경변수로 모델을 바꿀 수 있게 만든 것이 왜 유용한가요?</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>System has not been booted with systemd</code>', 'WSL2 systemd 비활성', '<code>/etc/wsl.conf</code> 설정 후 <code>wsl --shutdown</code>'],
      ['<code>status=203/EXEC</code>', 'ExecStart 경로 오류', '<code>which ollama</code>로 실제 경로 확인'],
      ['unit을 고쳤는데 그대로다', 'daemon-reload 누락', '<code>sudo systemctl daemon-reload</code>'],
      ['재부팅하니 서비스가 없다', 'enable 안 함', '<code>sudo systemctl enable 이름</code>'],
      ['<code>address already in use</code>', '기존 ollama가 점유', '<code>sudo systemctl stop ollama</code> 후 재시도'],
      ['<code>Permission denied</code> (모델 경로)', '디렉터리 소유자 불일치', '<code>sudo chown -R ollama:ollama /var/lib/myllm</code>']
    ],
    checklist: [
      'WSL2에서 systemd가 동작한다',
      'Ollama 설치 스크립트를 읽어 보고 실행했다',
      '모델을 받고 저장 경로의 용량을 확인했다',
      '<code>curl</code>로 API를 호출하고 <code>jq</code>로 응답을 뽑았다',
      '<code>systemctl cat</code>으로 기존 unit을 읽었다',
      '프로세스를 죽였을 때 자동 재시작되는 것을 확인했다',
      '직접 작성한 <code>myllm.service</code>가 동작한다',
      '설정이 <code>EnvironmentFile</code>로 분리돼 있다',
      '일부러 낸 오류를 <code>journalctl</code>로 찾아 고쳤다',
      '재부팅 후 자동 기동을 확인했다',
      '배치 러너가 실제 모델 응답을 CSV에 쌓는다'
    ]
  },

  quizTitle: '추론 서버와 systemd 퀴즈',
  quiz: [
    { q: '<code>nvidia-smi</code> 우상단의 "CUDA Version"이 뜻하는 것은?', o: ['이 드라이버가 지원하는 최대 CUDA 버전', '설치된 CUDA 툴킷 버전', '모델이 요구하는 버전', 'GPU의 하드웨어 버전'], a: 0,
      e: '설치된 툴킷 버전은 <code>nvcc --version</code>으로 봅니다. 헷갈리기 쉬운 지점입니다.' },
    { q: '7B 모델을 Q4_K_M으로 양자화하면 대략 몇 GB인가요?', o: ['약 4GB', '약 14GB', '약 1GB', '약 28GB'], a: 0,
      e: 'FP16 14GB → Q8 7GB → Q4 4GB. 가장 널리 쓰이는 타협점이 Q4_K_M입니다.' },
    { q: 'GPU 없이 이 과정을 진행할 때 권장되는 모델 크기는?', o: ['0.5B~1.5B급 Q4', '7B FP16', '13B Q8', '70B Q4'], a: 0,
      e: '느리지만 전 과정이 진행됩니다. 이 과정의 목표는 큰 모델이 아니라 제대로 된 운영입니다.' },
    { q: 'Ollama가 기본으로 듣는 포트는?', o: ['11434', '8080', '5000', '3000'], a: 0,
      e: '<code>ss -tlnp | grep 11434</code>로 확인할 수 있습니다.' },
    { q: 'API 응답에서 <code>response</code> 필드만 뽑는 명령은?', o: ["jq -r .response", "grep response", "awk '{print $2}'", "cut -d: -f2"], a: 0,
      e: 'JSON은 JSON 도구로 다뤄야 합니다. grep이나 cut으로 파싱하면 반드시 깨집니다.' },
    { q: '<code>systemctl start</code>와 <code>systemctl enable</code>의 차이는?', o: ['start는 지금, enable은 다음 부팅부터', 'start는 임시, enable은 영구 삭제', '같은 명령이다', 'enable이 더 빠르다'], a: 0,
      e: '둘 다 해야 완성입니다. enable을 빼면 재부팅 후 서비스가 사라집니다.' },
    { q: 'unit 파일에서 <code>Restart=always</code>가 하는 일은?', o: ['프로세스가 죽으면 자동으로 다시 띄운다', '매일 재시작한다', '항상 실행 중으로 표시한다', '부팅 시 시작한다'], a: 0,
      e: '<code>pkill</code>로 죽여 보면 PID가 바뀐 채 되살아납니다. 서비스와 그냥 실행의 결정적 차이입니다.' },
    { q: 'unit 파일을 수정한 뒤 반드시 실행해야 하는 명령은? (직접 입력)', t: true, acc: ['systemctl daemon-reload', 'sudo systemctl daemon-reload', 'daemon-reload'], ans: 'systemctl daemon-reload',
      e: '이걸 빼면 systemd가 옛 설정으로 계속 돕니다. 오늘 가장 흔한 함정입니다.' },
    { q: 'unit의 <code>[Service]</code>에서 <code>User=ollama</code>로 지정하는 이유는?', o: ['서비스가 뚫려도 피해 범위를 줄이려고', '속도가 빨라져서', 'root로는 실행이 안 돼서', '로그가 더 자세해져서'], a: 0,
      e: 'Day 4의 최소 권한 원칙입니다. root로 돌리면 그 서비스가 뚫렸을 때 시스템 전체가 뚫립니다.' },
    { q: '특정 서비스의 최근 로그 50줄을 보는 명령은?', o: ['journalctl -u 이름 -n 50', 'tail -50 /var/log/이름', 'systemctl log 이름', 'cat /etc/systemd/이름'], a: 0,
      e: 'systemd 서비스의 로그는 journal에 모입니다. <code>-f</code>를 붙이면 실시간 추적입니다.' },
    { q: '서비스가 안 뜰 때 가장 먼저 볼 순서는?', o: ['systemctl status → journalctl -u 이름 -n 50', '재부팅 → 재설치', '구글 검색 → 복붙', 'sudo 붙여 재시도'], a: 0,
      e: '추측하지 말고 로그를 봅니다. Day 9 장애 랩에서 이 순서를 계속 씁니다.' },
    { q: '<code>status=203/EXEC</code> 오류의 원인은?', o: ['ExecStart의 실행 파일 경로가 잘못됨', '포트가 사용 중', '권한 부족', '메모리 부족'], a: 0,
      e: '<code>which 명령</code>으로 실제 경로를 확인해 고칩니다.' },
    { q: '남이 만든 서비스의 unit 내용을 보는 명령은?', o: ['systemctl cat 이름', 'systemctl show 이름', 'systemctl info 이름', 'cat /etc/init.d/이름'], a: 0,
      e: '<code>show</code>는 해석된 속성값을, <code>cat</code>은 파일 원문을 보여줍니다.' },
    { q: '설정을 <code>EnvironmentFile</code>로 분리하면 좋은 점은?', o: ['설정을 바꿀 때 unit을 고치지 않아도 된다', '속도가 빨라진다', '로그가 줄어든다', '권한이 강해진다'], a: 0,
      e: '비밀값을 unit 본문에서 빼는 효과도 있습니다. Day 9 보안에서 다시 다룹니다.' },
    { q: 'Ollama 모델이 쌓이는 곳의 용량을 확인해야 하는 이유는?', o: ['모델 하나가 수 GB라 디스크가 금방 찬다', '권한 문제 때문', '백업이 필요해서', '속도 때문에'], a: 0,
      e: 'Day 9 장애 랩의 "디스크 가득 참" 시나리오에서 이 디렉터리가 주범으로 등장합니다.' },
    { q: 'Day 6 배치 러너의 <code>ask()</code>만 바꿔 실제 API에 연결할 수 있었던 이유는?', o: ['바뀔 부분을 함수로 격리해 뒀기 때문', '스크립트가 짧아서', 'bash가 유연해서', 'curl이 호환돼서'], a: 0,
      e: '변경 지점을 한 곳으로 모으는 것이 좋은 설계의 기본입니다.' },
    { q: '프롬프트에 따옴표가 들어 있어도 안전하게 JSON을 만드는 방법은?', o: ["jq -n --arg 로 조립", '직접 문자열 연결', 'echo 로 출력', 'printf 사용'], a: 0,
      e: '<code>jq -n --arg p "$q" \'{prompt:$p}\'</code>가 이스케이프를 알아서 처리합니다. Day 6의 인용부호 규칙의 연장입니다.' },
    { q: 'WSL2에서 systemd를 켜려면?', o: ['/etc/wsl.conf 에 systemd=true 후 wsl --shutdown', 'sudo systemctl enable systemd', 'apt install systemd', '자동으로 켜져 있다'], a: 0,
      e: '설정 후 반드시 <code>wsl --shutdown</code>으로 완전히 껐다 켜야 적용됩니다.' }
  ]
};
