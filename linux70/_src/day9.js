module.exports = {
  day: 9,
  title: '운영 · 보안 · 장애',
  theme: '띄우는 것보다 지키는 것이 어렵다',

  openingNar: `아홉째 날입니다. 지금까지 여덟 날 동안 만드는 법을 배웠습니다. 오늘은 지키는 법을 배웁니다. 실무에서 서비스를 처음 띄우는 데 걸리는 시간은 하루이지만, 그것을 일 년 동안 살려 두는 데는 훨씬 많은 노력이 듭니다. 그리고 오후 마지막 두 시간에는 제가 심어둔 장애 다섯 건을 여러분이 직접 복구합니다.`,

  goals: [
    ['디스크·메모리·CPU 상태를', '명령어로 조회하고 병목을 판별할 수 있다'],
    ['디스크가 가득 찼을 때', '무엇이 먹고 있는지 찾아 정리할 수 있다'],
    ['Nginx 리버스 프록시로', '추론 API를 안전하게 앞단에 노출할 수 있다'],
    ['SSH와 방화벽을', '기본선 이상으로 잠글 수 있다'],
    ['비밀값을', '코드와 분리해 관리할 수 있다'],
    ['장애 상황에서', '추측 대신 로그로 원인을 찾아낼 수 있다']
  ],
  goalsNar: `목표는 여섯 개입니다. 자원 상태를 읽고, 디스크가 찼을 때 대응하고, 프록시로 서비스를 앞단에 노출하고, 접근을 잠그고, 비밀값을 분리하고, 마지막으로 장애에서 원인을 찾아냅니다. 마지막 항목은 지식이 아니라 절차입니다. 오늘 그 절차를 몸에 붙입니다.`,

  blocks: [
    { time: '09:00–11:00', title: '자원 관측', desc: '디스크 · 메모리 · CPU · OOM' },
    { time: '11:10–12:00', title: '네트워크와 리버스 프록시', desc: '포트 · ufw · Nginx · 로그 로테이션' },
    { time: '13:00–15:00', title: '프록시 구성과 보안 기본선', desc: 'SSH 하드닝 · 비밀값 분리' },
    { time: '15:10–17:10', title: '장애 대응 랩', desc: '5개 사건 · 120분' }
  ],
  blocksNar: `오전에는 자원을 읽는 법과 네트워크를 다룹니다. 오후 전반에 프록시를 세우고 보안을 잠근 다음, 마지막 두 시간이 오늘의 하이라이트인 장애 대응 랩입니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–11:00', h: '자원 관측',
      sub: '무엇이 문제인지 모르면 고칠 수 없습니다.',
      nar: `첫 번째 블록입니다. 서비스가 느리다는 신고를 받았을 때 가장 먼저 할 일은 추측이 아니라 관측입니다. 디스크인지 메모리인지 시피유인지 네트워크인지를 먼저 가려내야 합니다.` },

    { eb: 'Disk', h: '디스크 — AI 서비스가 가장 먼저 죽는 이유',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ df -h</span>                      <span class="c"># 파티션별 사용률</span>
<span class="p">$ df -i</span>                      <span class="c"># inode — 용량은 남는데 못 쓸 때</span>
<span class="p">$ du -sh /* 2&gt;/dev/null | sort -h | tail -5</span>
<span class="p">$ du -sh ~/.ollama/models</span>
<span class="p">$ docker system df</span>
<span class="p">$ journalctl --disk-usage</span>
<span class="p">$ find / -size +1G -type f 2&gt;/dev/null | head</span></pre>
      <div class="banner" style="margin-top:2cqh">모델 캐시 · Docker 이미지 · 로그 — AI 서버 디스크를 채우는 3대 주범입니다.</div>`,
      foot: '용량은 남는데 "No space left"가 나면 inode 고갈입니다 — df -i 로 확인합니다.',
      nar: `인공지능 서버에서 가장 흔한 장애가 디스크 가득 참입니다. 원인은 거의 항상 셋 중 하나입니다. 모델 캐시, 도커 이미지, 로그입니다. 디에프로 사용률을 보고, 디유로 어디가 큰지 좁혀 들어갑니다. 한 가지 함정을 알려드립니다. 용량은 남아 있는데 공간이 없다는 오류가 나면 아이노드 고갈입니다. 작은 파일이 수백만 개 쌓였을 때 생기는데, 디에프 대시 아이로 확인합니다. 이걸 모르면 원인을 못 찾고 헤맵니다.` },

    { eb: 'Memory', h: '메모리 — free 출력 읽는 법',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ free -h</span>
<span class="c">               total   used   free   shared  buff/cache   available
Mem:            15Gi   4.2Gi  1.1Gi   0.3Gi       9.8Gi       10Gi
Swap:          4.0Gi      0B  4.0Gi</span></pre>
      <div class="grid g2" style="margin-top:2cqh">
        <div class="card warn"><span class="t">free 가 적다고 놀라지 마세요</span><span class="d">리눅스는 남는 메모리를 전부 캐시로 씁니다. 필요하면 즉시 돌려줍니다.</span></div>
        <div class="card"><span class="t">봐야 할 것은 available</span><span class="d">지금 당장 프로그램이 쓸 수 있는 실질 여유입니다.</span></div>
      </div>
      <pre style="margin-top:2cqh"><span class="p">$ dmesg -T | grep -i "out of memory\\|killed process"</span>
<span class="p">$ journalctl -k | grep -i oom</span></pre>`,
      foot: 'OOM Killer가 무엇을 죽였는지는 dmesg에 남습니다 — 서비스가 소리 없이 사라졌을 때 여기를 봅니다.',
      nar: `프리 명령의 출력에서 프리 값이 작다고 놀라는 분이 많습니다. 리눅스는 남는 메모리를 전부 디스크 캐시로 써 버리고, 프로그램이 필요로 하면 즉시 돌려줍니다. 그러니 봐야 할 것은 프리가 아니라 어베일러블입니다. 그리고 넷째 날에 배운 오오엠 킬러가 실제로 무엇을 죽였는지는 디메시지에 남습니다. 서비스가 소리 없이 사라졌을 때 여기를 보면 범인이 나옵니다.` },

    { eb: 'CPU & I/O', h: '병목이 어디인지 가려내기',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ uptime</span>
<span class="c"> 14:22:01 up 3 days,  load average: 0.52, 1.20, 1.05</span>
<span class="c">                      1분    5분    15분  ← 코어 수와 비교합니다</span>

<span class="p">$ vmstat 1 5</span>          <span class="c"># r(대기), wa(IO 대기), si/so(스왑)</span>
<span class="p">$ iostat -x 1 3</span>        <span class="c"># %util 이 100에 가까우면 디스크 병목</span>
<span class="p">$ nvidia-smi dmon -c 5</span>  <span class="c"># GPU 사용률 추이</span></pre>
      <div class="bannerG" style="margin-top:2cqh">load average는 코어 수와 비교합니다 — 4코어에서 4.0이면 딱 포화입니다.</div>`,
      nar: `업타임의 로드 애버리지는 실행 대기 중인 작업의 평균 개수입니다. 절대값이 아니라 코어 수와 비교해야 합니다. 사 코어에서 사점영이면 딱 포화 상태입니다. 브이엠스탯에서 더블유에이 값이 크면 시피유가 아니라 디스크를 기다리고 있다는 뜻입니다. 시피유를 늘려도 소용없고 디스크를 봐야 합니다. 이렇게 병목이 어디인지 가려내는 것이 관측의 목적입니다.` },

    { section: true, eb: 'Block 2 · 11:10–12:00', h: '네트워크와 리버스 프록시',
      sub: '서비스를 밖에 내놓는 순간 고려할 것이 달라집니다.',
      nar: `두 번째 블록입니다. 지금까지 만든 서비스는 로컬호스트에만 묶여 있었습니다. 밖에서 접근하게 하는 순간 고려할 것이 완전히 달라집니다.` },

    { eb: 'Binding', h: '127.0.0.1 과 0.0.0.0 의 차이',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">127.0.0.1:11434</span><span class="t">이 컴퓨터에서만</span><span class="d">밖에서는 접근 불가.<br>안전한 기본값입니다.</span></div>
        <div class="card warn"><span class="n">0.0.0.0:11434</span><span class="t">모든 네트워크에서</span><span class="d">방화벽이 없으면 <strong>인터넷 전체에 열립니다.</strong><br>인증 없는 LLM API가 그대로 노출됩니다.</span></div>
      </div>
      <pre style="margin-top:2cqh"><span class="p">$ ss -tlnp</span>
<span class="p">$ ss -tlnp | grep -E "11434|3000|80"</span>
<span class="p">$ lsof -i :11434</span></pre>`,
      foot: '인증 없는 추론 API를 0.0.0.0에 열어 두면 남이 내 GPU로 모델을 돌립니다 — 실제로 자주 일어납니다.',
      nar: `바인딩 주소의 차이를 반드시 이해하셔야 합니다. 백이십칠 점 영 점 영 점 일은 이 컴퓨터에서만 접근할 수 있고, 영 점 영 점 영 점 영은 모든 네트워크 인터페이스에서 받겠다는 뜻입니다. 방화벽이 없다면 인터넷 전체에 열리는 것입니다. 인증이 없는 추론 에이피아이를 이렇게 열어 두면 남이 내 지피유로 모델을 돌립니다. 실제로 자주 일어나는 일입니다. 그래서 오늘 배우는 방식은 서비스 자체는 로컬에만 묶어 두고, 앞단에 프록시를 세우는 것입니다.` },

    { eb: 'Nginx', h: '리버스 프록시 — 앞단에 문지기를 세운다',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># /etc/nginx/sites-available/llm</span>
<span class="p">server {</span>
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://127.0.0.1:11434/api/;
        proxy_set_header Host $host;

        <span class="c"># 스트리밍 응답의 함정</span>
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
<span class="p">}</span></pre>
      <div class="banner" style="margin-top:2cqh"><code>proxy_buffering off</code>가 없으면 스트리밍 응답이 끝날 때까지 한 글자도 안 나옵니다.</div>`,
      foot: '프록시를 두면 인증·속도제한·로그·TLS를 한 곳에서 처리할 수 있습니다.',
      nar: `리버스 프록시는 서비스 앞에 세우는 문지기입니다. 외부 요청을 대신 받아서 내부 서비스로 넘깁니다. 이렇게 하면 인증과 속도 제한과 로그와 티엘에스를 한 곳에서 처리할 수 있습니다. 여기서 엘엘엠 서비스 특유의 함정이 하나 있습니다. 엔진엑스는 기본적으로 응답을 모아서 한 번에 보내는데, 스트리밍 응답에서는 이게 치명적입니다. 한 글자씩 나와야 할 답변이 다 끝날 때까지 아무것도 안 나옵니다. 프록시 버퍼링을 꺼야 합니다.` },

    { eb: 'Firewall & Logs', h: '방화벽과 로그 로테이션',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ sudo ufw status verbose</span>
<span class="p">$ sudo ufw default deny incoming</span>
<span class="p">$ sudo ufw allow 22/tcp</span>          <span class="c"># SSH 먼저! 안 그러면 잠깁니다</span>
<span class="p">$ sudo ufw allow 80/tcp</span>
<span class="p">$ sudo ufw enable</span>

<span class="c"># 로그가 무한히 쌓이지 않게</span>
<span class="p">$ cat /etc/logrotate.d/nginx</span>
<span class="p">$ sudo logrotate -d /etc/logrotate.d/nginx</span>   <span class="c"># -d = 시뮬레이션</span></pre>
      <div class="banner" style="margin-top:2cqh">원격 서버에서 SSH 포트를 열기 전에 ufw를 켜면 <strong>자기 자신이 잠깁니다.</strong></div>`,
      nar: `방화벽은 기본을 거부로 두고 필요한 포트만 엽니다. 여기서 절대 잊으면 안 되는 순서가 있습니다. 원격 서버에서 에스에스에이치 포트를 열기 전에 방화벽을 켜면 자기 자신이 잠깁니다. 다시 들어갈 방법이 없어집니다. 반드시 이십이번을 먼저 허용하고 켜십시오. 로그 로테이션은 로그가 무한히 쌓이는 것을 막습니다. 오늘 오전에 본 디스크 가득 참의 주요 원인 중 하나가 로테이션이 안 걸린 로그입니다.` },

    { eb: 'Secrets', h: '비밀값은 코드와 분리한다',
      body: `<div class="rowlist" style="margin-top:1.6cqh">
        <div class="row"><span class="dot">1</span><span class="t">코드에 직접 쓰지 않는다</span><span class="d">git에 올라가는 순간 영구히 남습니다</span></div>
        <div class="row"><span class="dot">2</span><span class="t">.env 파일로 분리 · 권한 600</span><span class="d">Day 4에서 만든 그 파일</span></div>
        <div class="row"><span class="dot">3</span><span class="t">.gitignore 에 등록</span><span class="d">실수로 커밋되는 것을 막습니다</span></div>
        <div class="row"><span class="dot">4</span><span class="t">systemd는 EnvironmentFile</span><span class="d">Day 7에서 이미 그렇게 했습니다</span></div>
      </div>
      <pre style="margin-top:2cqh"><span class="p">$ chmod 600 ~/ai-lab/.env</span>
<span class="p">$ grep -rn "API_KEY\\|SECRET\\|PASSWORD" ~/ai-lab --include="*.sh" --include="*.py"</span></pre>`,
      foot: '마지막 명령으로 내 코드에 비밀값이 박혀 있지 않은지 직접 확인합니다.',
      nar: `비밀값 관리의 원칙은 단순합니다. 코드에 직접 쓰지 않습니다. 깃에 한 번 올라가면 나중에 지워도 이력에 영구히 남습니다. 따로 파일로 빼고 권한을 육공공으로 잠급니다. 넷째 날에 만든 그 파일이 바로 이것입니다. 그리고 깃이그노어에 등록해서 실수로 올라가는 것을 막습니다. 시스템디에서는 일곱째 날에 이미 인바이런먼트 파일로 분리해 뒀습니다. 마지막 그렙 명령으로 내 코드에 비밀값이 박혀 있지 않은지 직접 확인하십시오.` },

    { section: true, eb: 'Block 4 · FAULT LAB · 15:10–17:10', h: '장애 대응 랩',
      sub: '다섯 개의 사건, 120분. 추측하지 말고 로그를 보십시오.',
      nar: `마지막 블록입니다. 오늘의 하이라이트이자 이 과정 전체에서 가장 중요한 시간입니다. 제가 다섯 개의 장애를 심어 두었습니다. 여러분은 그것을 복구합니다. 규칙은 하나입니다. 추측하지 말고 관측하십시오.` },

    { eb: 'Method', h: '장애 대응의 절차',
      body: `<div class="rowlist" style="margin-top:1.6cqh">
        <div class="row"><span class="dot">1</span><span class="t">증상을 정확히 적는다</span><span class="d">"안 돼요"가 아니라 "어떤 명령에 어떤 메시지"</span></div>
        <div class="row"><span class="dot">2</span><span class="t">범위를 좁힌다</span><span class="d">서비스? 네트워크? 디스크? 권한?</span></div>
        <div class="row"><span class="dot">3</span><span class="t">로그를 본다</span><span class="d">status → journalctl → 애플리케이션 로그</span></div>
        <div class="row"><span class="dot">4</span><span class="t">한 번에 하나만 바꾼다</span><span class="d">두 개를 바꾸면 무엇이 고쳤는지 모릅니다</span></div>
        <div class="row"><span class="dot">5</span><span class="t">재발 방지를 적는다</span><span class="d">고친 것으로 끝나면 또 납니다</span></div>
      </div>`,
      foot: '이 다섯 단계가 오늘 배우는 전부입니다. 명령어는 이미 다 배웠습니다.',
      nar: `절차는 다섯 단계입니다. 첫째, 증상을 정확히 적습니다. 안 돼요가 아니라 어떤 명령에 어떤 메시지가 나왔는지입니다. 둘째, 범위를 좁힙니다. 셋째, 로그를 봅니다. 넷째, 한 번에 하나만 바꿉니다. 두 개를 동시에 바꾸면 무엇이 고쳤는지 모릅니다. 다섯째, 재발 방지를 적습니다. 고친 것으로 끝내면 또 납니다. 오늘 배우는 건 이 다섯 단계가 전부입니다. 명령어는 이미 아흐레 동안 다 배웠습니다.` },

    { eb: 'FAULT LAB', h: '다섯 개의 사건',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card warn"><span class="n">INCIDENT 1</span><span class="t">서비스가 뜨지 않는다</span><span class="d">포트가 이미 사용 중</span></div>
        <div class="card warn"><span class="n">INCIDENT 2</span><span class="t">모델 로드 실패</span><span class="d">디스크가 가득 찼다</span></div>
        <div class="card warn"><span class="n">INCIDENT 3</span><span class="t">Permission denied</span><span class="d">모델 디렉터리 권한 오류</span></div>
        <div class="card warn"><span class="n">INCIDENT 4</span><span class="t">systemctl start 실패</span><span class="d">unit 파일 오타</span></div>
        <div class="card warn"><span class="n">INCIDENT 5</span><span class="t">프록시가 502를 반환</span><span class="d">백엔드 연결 실패</span></div>
      </div>`,
      foot: '각 사건마다 증상 · 확인 명령 · 원인 · 조치 · 재발 방지를 기록합니다 — 그것이 과제입니다.',
      nar: `다섯 개의 사건입니다. 서비스가 뜨지 않는 문제, 모델 로드가 실패하는 문제, 권한 거부, 서비스 기동 실패, 그리고 프록시 오백이 오류입니다. 전부 실무에서 실제로 자주 겪는 것들입니다. 각 사건마다 증상과 확인에 쓴 명령과 원인과 조치와 재발 방지책을 기록하십시오. 그 기록이 오늘의 과제이고, 실무에서는 알씨에이 즉 원인 분석 보고서라고 부릅니다.` }
  ],

  assignment: {
    title: '장애 5건 원인 분석(RCA) 보고서',
    lede: '복구한 것으로 끝이 아닙니다. 다음에 같은 일이 없게 만드는 것까지가 일입니다.',
    items: [
      '사건별 증상 (정확한 명령과 메시지)',
      '확인에 사용한 명령과 그 출력',
      '판단한 원인',
      '취한 조치',
      '재발 방지책',
      '가장 오래 걸린 사건과 그 이유 (회고)'
    ],
    note: '6번이 가장 중요합니다. <strong>어디서 헤맸는지, 왜 그 방향으로 갔는지</strong>를 솔직하게 적으십시오. 잘못 짚은 가설도 기록 가치가 있습니다.',
    sample: `<span class="o">INCIDENT 1
증상 : sudo systemctl start myllm 후 status 가 failed
       journalctl 에 "bind: address already in use"
확인 : ss -tlnp | grep 11434  →  PID 4821 (docker-proxy)
원인 : Day 8 compose 스택이 같은 포트를 점유
조치 : docker compose down 후 서비스 재시작
방지 : 포트를 11435로 변경하거나 compose 를 stop 하는 절차를 README 에 명시</span>`,
    nar: `과제입니다. 다섯 건에 대한 원인 분석 보고서를 쓰십시오. 증상과 확인 명령과 원인과 조치와 재발 방지를 순서대로 적습니다. 그리고 여섯 번째 항목이 가장 중요합니다. 어느 사건에서 가장 오래 헤맸고 왜 그 방향으로 갔는지를 솔직하게 적어 주십시오. 잘못 짚은 가설도 기록 가치가 있습니다. 실무에서 좋은 엔지니어와 그렇지 않은 엔지니어를 가르는 것이 바로 이 회고입니다.` },

  wrap: {
    done: '자원을 관측하고, 서비스를 앞단에 안전하게 노출하고, 장애 5건을 스스로 복구했습니다.',
    next: '내일 · Day 10 — 통합 프로젝트와 시연',
    nextDesc: '아흐레 동안 배운 것을 하나의 서비스로 묶습니다. 다른 팀의 빈 환경에서 되살아나야 합니다.',
    nar: `오늘 한 일을 정리하겠습니다. 디스크와 메모리와 시피유를 관측하는 법을 배웠고, 리버스 프록시로 서비스를 앞단에 세웠고, 방화벽과 에스에스에이치를 잠갔고, 비밀값을 분리했습니다. 그리고 장애 다섯 건을 직접 복구했습니다. 내일은 마지막 날입니다. 아흐레 동안 배운 것을 하나의 서비스로 묶습니다. 조건이 하나 있는데, 다른 팀의 빈 환경에서 문서만 보고 되살아나야 합니다. 수고하셨습니다.` },

  lab: {
    h1: '운영 · 보안 · 장애',
    standfirst: '오전 실습은 <strong>WSL2</strong>, 프록시와 방화벽 실습은 <strong>VM</strong>에서 합니다. 방화벽은 잘못 켜면 스스로 잠기므로 VM에서 하는 것입니다.',
    rules: [
      ['추측하지 말고 관측한다', '"아마 이것 때문일 것"으로 시작하면 두 배로 돌아갑니다. 명령으로 확인하세요.'],
      ['한 번에 하나만 바꾼다', '두 개를 동시에 고치면 무엇이 효과가 있었는지 모릅니다.'],
      ['ufw는 SSH부터 허용', '원격 서버에서 이 순서를 틀리면 다시 들어갈 수 없습니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '자원 관측', time: '13:00–13:50',
        missions: [
          { n: 1, h: '디스크를 좁혀 들어가기', body: `
      <pre><span class="p">$</span> df -h
<span class="p">$</span> df -i                                  <span class="c"># inode</span>
<span class="p">$</span> du -sh /* 2&gt;/dev/null | sort -h | tail -5
<span class="p">$</span> du -sh ~/* | sort -h | tail -5
<span class="p">$</span> du -sh ~/.ollama/models 2&gt;/dev/null
<span class="p">$</span> docker system df
<span class="p">$</span> journalctl --disk-usage
<span class="p">$</span> find / -size +500M -type f 2&gt;/dev/null | head</pre>
      <div class="box check"><span class="lbl">좁혀 들어가는 순서</span>
        <p>전체(<code>df</code>) → 최상위 디렉터리(<code>du /*</code>) → 의심 지점(<code>du 상세</code>). 한 번에 <code>du -sh /</code>를 치면 몇 분씩 걸립니다.</p></div>` },
          { n: 2, h: 'free 출력 제대로 읽기', body: `
      <pre><span class="p">$</span> free -h
<span class="p">$</span> cat /proc/meminfo | head -5

<span class="c"># 캐시를 채워 보기</span>
<span class="p">$</span> cat /dev/zero | head -c 2G &gt; /tmp/big.bin
<span class="p">$</span> free -h                                 <span class="c">← buff/cache 증가</span>
<span class="p">$</span> rm /tmp/big.bin

<span class="c"># OOM 기록 확인</span>
<span class="p">$</span> dmesg -T 2&gt;/dev/null | grep -i "killed process" | tail -3
<span class="p">$</span> journalctl -k 2&gt;/dev/null | grep -i oom | tail -3</pre>
      <div class="box q"><span class="lbl">확인 질문</span><p><code>free</code>는 작은데 <code>available</code>은 큽니다. 이 서버는 메모리가 부족한 상태일까요?</p></div>` },
          { n: 3, h: '병목 판별 연습', body: `
      <pre><span class="p">$</span> nproc &amp;&amp; uptime

<span class="c"># CPU 부하를 만들어 보기</span>
<span class="p">$</span> for i in $(seq 1 $(nproc)); do (while :; do :; done) &amp; done
<span class="p">$</span> sleep 20 &amp;&amp; uptime
<span class="p">$</span> vmstat 1 3
<span class="p">$</span> jobs -p | xargs kill

<span class="c"># 디스크 부하</span>
<span class="p">$</span> sudo apt install -y sysstat
<span class="p">$</span> (dd if=/dev/zero of=/tmp/io.bin bs=1M count=2000 oflag=direct &amp;) ; iostat -x 1 3
<span class="p">$</span> rm -f /tmp/io.bin</pre>
      <div class="box check"><span class="lbl">구분 포인트</span>
        <p>CPU 부하에서는 <code>vmstat</code>의 <code>r</code>이 커지고, 디스크 부하에서는 <code>wa</code>와 <code>%util</code>이 커집니다. 증상이 다릅니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '프록시와 방화벽 (VM)', time: '13:50–15:00',
        lede: '여기부터는 VM에서 진행합니다. 방화벽 실습이 포함되기 때문입니다.',
        missions: [
          { n: 4, h: 'VM에 추론 서비스 준비', body: `
      <pre><span class="p">$</span> ssh gpu                                <span class="c"># Day 5의 별칭</span>
<span class="p">$</span> curl -fsSL https://ollama.com/install.sh | sh
<span class="p">$</span> ollama pull qwen2.5:0.5b
<span class="p">$</span> ss -tlnp | grep 11434
<span class="p">$</span> curl -s localhost:11434/api/tags | jq -r '.models[].name'</pre>
      <div class="box warn"><span class="lbl">사양이 부족하면</span>
        <p>VM 메모리가 4GB라면 0.5b 모델도 느립니다. 프록시 실습이 목적이므로, 모델 대신 <code>python3 -m http.server 11434</code>로 대체해도 됩니다.</p></div>` },
          { n: 5, h: 'Nginx 리버스 프록시', body: `
      <pre><span class="p">$</span> sudo apt install -y nginx
<span class="p">$</span> sudo tee /etc/nginx/sites-available/llm &gt; /dev/null &lt;&lt;'EOF'
server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://127.0.0.1:11434/api/;
        proxy_set_header Host $host;
        proxy_buffering off;
        proxy_read_timeout 300s;
    }

    location / {
        return 200 "LLM gateway\\n";
        add_header Content-Type text/plain;
    }
}
EOF
<span class="p">$</span> sudo ln -sf /etc/nginx/sites-available/llm /etc/nginx/sites-enabled/llm
<span class="p">$</span> sudo rm -f /etc/nginx/sites-enabled/default
<span class="p">$</span> sudo nginx -t
<span class="p">$</span> sudo systemctl reload nginx

<span class="p">$</span> curl -s localhost/
<span class="p">$</span> curl -s localhost/api/tags | jq -r '.models[].name'</pre>
      <div class="box check"><span class="lbl">nginx -t 를 습관으로</span>
        <p>설정을 고친 뒤 <code>reload</code> 전에 항상 <code>nginx -t</code>로 문법을 검사하세요. 틀린 설정으로 reload하면 서비스가 죽습니다.</p></div>` },
          { n: 6, h: '스트리밍 버퍼링 함정 확인', body: `
      <pre><span class="c"># 버퍼링을 켜 보기</span>
<span class="p">$</span> sudo sed -i 's/proxy_buffering off;/proxy_buffering on;/' \\
     /etc/nginx/sites-available/llm
<span class="p">$</span> sudo nginx -t &amp;&amp; sudo systemctl reload nginx
<span class="p">$</span> time curl -sN localhost/api/generate -d '{"model":"qwen2.5:0.5b","prompt":"1부터 20까지 세어줘"}' | head -3

<span class="c"># 다시 끄고 비교</span>
<span class="p">$</span> sudo sed -i 's/proxy_buffering on;/proxy_buffering off;/' \\
     /etc/nginx/sites-available/llm
<span class="p">$</span> sudo nginx -t &amp;&amp; sudo systemctl reload nginx
<span class="p">$</span> time curl -sN localhost/api/generate -d '{"model":"qwen2.5:0.5b","prompt":"1부터 20까지 세어줘"}' | head -3</pre>
      <div class="box check"><span class="lbl">차이가 보이나요</span>
        <p>버퍼링을 켜면 첫 글자가 나오기까지 오래 걸립니다. LLM 서비스에서 사용자가 "멈춘 것 같다"고 느끼는 원인입니다.</p></div>` },
          { n: 7, h: '방화벽 — 순서를 지켜서', body: `
      <pre><span class="p">$</span> sudo ufw status
<span class="p">$</span> sudo ufw default deny incoming
<span class="p">$</span> sudo ufw default allow outgoing
<span class="p">$</span> sudo ufw allow 22/tcp        <span class="c">← 반드시 먼저!</span>
<span class="p">$</span> sudo ufw allow 80/tcp
<span class="p">$</span> sudo ufw enable
<span class="p">$</span> sudo ufw status verbose

<span class="c"># 11434는 열지 않았습니다 — 밖에서 직접 접근 불가</span>
<span class="c"># WSL2에서:</span>
<span class="p">$</span> curl -s --max-time 5 http://&lt;VM_IP&gt;/api/tags | jq -r '.models[].name'
<span class="p">$</span> curl -s --max-time 5 http://&lt;VM_IP&gt;:11434/api/tags; echo "종료 $?"</pre>
      <div class="box check"><span class="lbl">오늘 보안의 핵심</span>
        <p>서비스는 <code>127.0.0.1</code>에만 묶고, 밖에는 프록시 포트만 엽니다. 추론 API가 직접 노출되지 않습니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: 'SSH 하드닝과 비밀값', time: '15:00–15:30',
        missions: [
          { n: 8, h: 'SSH 잠그기', body: `
      <pre><span class="p">$</span> sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
<span class="p">$</span> sudo tee /etc/ssh/sshd_config.d/99-hardening.conf &gt; /dev/null &lt;&lt;'EOF'
PasswordAuthentication no
PermitRootLogin no
MaxAuthTries 3
EOF
<span class="p">$</span> sudo sshd -t                        <span class="c"># 문법 검사</span>
<span class="p">$</span> sudo systemctl reload ssh

<span class="c"># 반드시 새 터미널에서 접속을 확인하고 기존 창은 유지!</span>
<span class="p">$</span> ssh gpu "echo 접속 성공"</pre>
      <div class="box warn"><span class="lbl">절대 지켜야 할 순서</span>
        <p>SSH 설정을 바꾼 뒤 <strong>기존 접속 창을 닫지 말고</strong> 새 창으로 접속을 확인하세요. 잘못 설정하면 다시 못 들어갑니다. Day 5에서 키 인증을 해 뒀기 때문에 안전합니다.</p></div>` },
          { n: 9, h: '비밀값 분리와 점검', body: `
      <pre><span class="p">$</span> cd ~/ai-lab
<span class="p">$</span> cat &gt; .env &lt;&lt;'EOF'
OLLAMA_HOST=http://127.0.0.1:11434
API_TOKEN=dev-only-not-a-real-secret
EOF
<span class="p">$</span> chmod 600 .env
<span class="p">$</span> ls -l .env

<span class="p">$</span> cat &gt; .gitignore &lt;&lt;'EOF'
.env
logs/
models/
envs/
EOF

<span class="c"># 내 코드에 비밀값이 박혀 있지 않은지 점검</span>
<span class="p">$</span> grep -rn "API_KEY\\|TOKEN\\|PASSWORD\\|SECRET" ~/ai-lab \\
     --include="*.sh" --include="*.py" --include="*.yaml" 2&gt;/dev/null

<span class="c"># 스크립트에서 불러 쓰기</span>
<span class="p">$</span> set -a; source .env; set +a; echo "$OLLAMA_HOST"</pre>
      <div class="box check"><span class="lbl">Day 10 프로젝트 요구사항</span>
        <p>"비밀값이 코드나 unit 파일 본문에 없을 것"이 내일 프로젝트의 채점 항목입니다. 지금 구조를 그대로 쓰세요.</p></div>` }
        ]
      },
      {
        pn: 'PART 4', h: 'FAULT LAB · 장애 5건', time: '15:40–17:10',
        lede: '각 사건마다 <strong>증상 · 확인 명령 · 원인 · 조치 · 재발 방지</strong>를 기록하세요. 그것이 과제입니다.',
        missions: [
          { n: 10, h: 'INCIDENT 1 — 서비스가 뜨지 않는다', body: `
      <p><strong>상황 만들기</strong> (WSL2)</p>
      <pre><span class="p">$</span> python3 -m http.server 11434 &gt;/dev/null 2&gt;&amp;1 &amp;
<span class="p">$</span> sudo systemctl restart myllm
<span class="p">$</span> systemctl is-active myllm</pre>
      <div class="box q"><span class="lbl">복구해 보세요</span>
        <p>어떤 명령으로 원인을 찾을 수 있을까요? 힌트는 Day 7에서 배운 두 단계입니다.</p></div>
      <details style="margin-top:12px"><summary style="cursor:pointer;font-size:13.5px;color:var(--muted)">막혔을 때만 열기</summary>
      <pre style="margin-top:8px"><span class="p">$</span> systemctl status myllm --no-pager
<span class="p">$</span> journalctl -u myllm -n 20 --no-pager | grep -i "address\\|bind"
<span class="p">$</span> ss -tlnp | grep 11434
<span class="p">$</span> kill %1
<span class="p">$</span> sudo systemctl restart myllm &amp;&amp; systemctl is-active myllm</pre></details>` },
          { n: 11, h: 'INCIDENT 2 — 디스크가 가득 찼다', body: `
      <pre><span class="p">$</span> df -h ~ | tail -1
<span class="p">$</span> mkdir -p ~/ai-lab/logs/flood
<span class="p">$</span> for i in $(seq 1 20); do
    head -c 200M /dev/zero &gt; ~/ai-lab/logs/flood/junk$i.log
  done 2&gt;/dev/null
<span class="p">$</span> df -h ~ | tail -1
<span class="p">$</span> echo "테스트" &gt; ~/ai-lab/logs/newfile.txt</pre>
      <div class="box q"><span class="lbl">복구해 보세요</span>
        <p>무엇이 먹고 있는지 어떻게 좁혀 들어갈까요? Day 2의 <code>du | sort</code>와 Day 3의 <code>find</code>를 떠올리세요.</p></div>
      <details style="margin-top:12px"><summary style="cursor:pointer;font-size:13.5px;color:var(--muted)">막혔을 때만 열기</summary>
      <pre style="margin-top:8px"><span class="p">$</span> du -sh ~/* | sort -h | tail -3
<span class="p">$</span> du -sh ~/ai-lab/* | sort -h | tail -3
<span class="p">$</span> find ~/ai-lab -size +100M -type f | head
<span class="p">$</span> rm -rf ~/ai-lab/logs/flood
<span class="p">$</span> df -h ~ | tail -1</pre></details>` },
          { n: 12, h: 'INCIDENT 3 — Permission denied', body: `
      <pre><span class="p">$</span> sudo chmod 700 /var/lib/myllm/models
<span class="p">$</span> sudo chown root:root /var/lib/myllm/models
<span class="p">$</span> sudo systemctl restart myllm
<span class="p">$</span> sleep 3 &amp;&amp; curl -s --max-time 5 localhost:11434/api/tags; echo "종료 $?"</pre>
      <div class="box q"><span class="lbl">복구해 보세요</span>
        <p>서비스는 어떤 계정으로 돌고 있나요? 그 계정이 이 디렉터리에 들어갈 수 있나요? Day 4의 "디렉터리의 x"를 떠올리세요.</p></div>
      <details style="margin-top:12px"><summary style="cursor:pointer;font-size:13.5px;color:var(--muted)">막혔을 때만 열기</summary>
      <pre style="margin-top:8px"><span class="p">$</span> journalctl -u myllm -n 20 --no-pager | grep -i "permission\\|denied"
<span class="p">$</span> systemctl show myllm -p User
<span class="p">$</span> ls -ld /var/lib/myllm/models
<span class="p">$</span> sudo chown -R ollama:ollama /var/lib/myllm
<span class="p">$</span> sudo chmod 755 /var/lib/myllm/models
<span class="p">$</span> sudo systemctl restart myllm</pre></details>` },
          { n: 13, h: 'INCIDENT 4 — unit 파일 오타', body: `
      <pre><span class="p">$</span> sudo sed -i 's/^Restart=always/Restart=alway/' \\
     /etc/systemd/system/myllm.service
<span class="p">$</span> sudo systemctl daemon-reload
<span class="p">$</span> sudo systemctl restart myllm</pre>
      <div class="box q"><span class="lbl">복구해 보세요</span>
        <p>이번에는 <code>systemctl status</code>보다 <code>daemon-reload</code> 출력과 <code>journalctl</code>에 힌트가 있습니다.</p></div>
      <details style="margin-top:12px"><summary style="cursor:pointer;font-size:13.5px;color:var(--muted)">막혔을 때만 열기</summary>
      <pre style="margin-top:8px"><span class="p">$</span> journalctl -u myllm -n 20 --no-pager
<span class="p">$</span> systemd-analyze verify /etc/systemd/system/myllm.service
<span class="p">$</span> sudo sed -i 's/^Restart=alway$/Restart=always/' \\
     /etc/systemd/system/myllm.service
<span class="p">$</span> sudo systemctl daemon-reload &amp;&amp; sudo systemctl restart myllm</pre></details>` },
          { n: 14, h: 'INCIDENT 5 — 프록시가 502', body: `
      <p>VM에서 진행합니다.</p>
      <pre><span class="p">$</span> ssh gpu
<span class="p">$</span> sudo sed -i 's|proxy_pass http://127.0.0.1:11434/api/;|proxy_pass http://127.0.0.1:11999/api/;|' \\
     /etc/nginx/sites-available/llm
<span class="p">$</span> sudo nginx -t &amp;&amp; sudo systemctl reload nginx
<span class="p">$</span> curl -s -o /dev/null -w "%{http_code}\\n" localhost/api/tags</pre>
      <div class="box q"><span class="lbl">복구해 보세요</span>
        <p>502는 "프록시가 백엔드에 연결하지 못했다"는 뜻입니다. 백엔드가 죽은 걸까요, 주소가 틀린 걸까요? 어떻게 구분할까요?</p></div>
      <details style="margin-top:12px"><summary style="cursor:pointer;font-size:13.5px;color:var(--muted)">막혔을 때만 열기</summary>
      <pre style="margin-top:8px"><span class="p">$</span> sudo tail -5 /var/log/nginx/error.log
<span class="p">$</span> ss -tlnp | grep -E "11434|11999"
<span class="p">$</span> curl -s localhost:11434/api/tags &gt;/dev/null &amp;&amp; echo "백엔드는 살아 있음"
<span class="p">$</span> grep proxy_pass /etc/nginx/sites-available/llm
<span class="p">$</span> sudo sed -i 's|:11999|:11434|' /etc/nginx/sites-available/llm
<span class="p">$</span> sudo nginx -t &amp;&amp; sudo systemctl reload nginx
<span class="p">$</span> curl -s -o /dev/null -w "%{http_code}\\n" localhost/api/tags</pre></details>` }
        ]
      }
    ],
    errors: [
      ['<code>No space left</code> (용량은 남음)', 'inode 고갈', '<code>df -i</code>로 확인, 작은 파일 대량 삭제'],
      ['<code>bind: address already in use</code>', '포트 중복', '<code>ss -tlnp | grep 포트</code>로 점유자 확인'],
      ['nginx <code>502 Bad Gateway</code>', '백엔드 연결 실패', '<code>/var/log/nginx/error.log</code> → 백엔드 생존 확인'],
      ['ufw 켠 뒤 SSH 접속 불가', '22번 미허용', 'VM 콘솔로 직접 들어가 <code>sudo ufw allow 22/tcp</code>'],
      ['스트리밍이 한 번에 나온다', 'proxy_buffering on', '<code>proxy_buffering off</code>로 변경'],
      ['<code>nginx -t</code> 실패', '설정 문법 오류', '메시지의 줄 번호를 보고 수정 후 재검사']
    ],
    checklist: [
      '<code>df -h</code>와 <code>df -i</code>의 차이를 안다',
      '디스크를 <code>df</code> → <code>du /*</code> → 상세 순으로 좁혀 들어갔다',
      '<code>free</code>에서 봐야 할 값이 <code>available</code>임을 안다',
      '<code>vmstat</code>으로 CPU 병목과 I/O 병목을 구분했다',
      'Nginx 리버스 프록시로 API가 80번을 통해 접근된다',
      '<code>proxy_buffering</code> 차이를 직접 측정했다',
      'ufw로 22·80만 열고 11434는 막았다',
      'SSH 비밀번호 인증을 끄고 키로만 접속된다',
      '<code>.env</code>가 600이고 <code>.gitignore</code>에 등록돼 있다',
      '장애 5건을 모두 복구했다',
      '5건의 RCA 기록을 남겼다'
    ]
  },

  quizTitle: '운영과 장애 대응 퀴즈',
  quiz: [
    { q: '용량은 남아 있는데 <code>No space left on device</code>가 나면?', o: ['inode 고갈 — df -i 로 확인', '권한 문제', '메모리 부족', '네트워크 오류'], a: 0,
      e: '작은 파일이 수백만 개 쌓였을 때 생깁니다. 이걸 모르면 원인을 못 찾습니다.' },
    { q: 'AI 서버의 디스크를 채우는 3대 주범이 아닌 것은?', o: ['커널 이미지', '모델 캐시', 'Docker 이미지', '로그 파일'], a: 0,
      e: '모델·이미지·로그 셋을 먼저 의심합니다. <code>docker system df</code>와 <code>journalctl --disk-usage</code>가 유용합니다.' },
    { q: '<code>free -h</code>에서 실질적인 여유를 나타내는 열은?', o: ['available', 'free', 'buff/cache', 'shared'], a: 0,
      e: '리눅스는 남는 메모리를 캐시로 씁니다. <code>free</code>가 작은 건 정상입니다.' },
    { q: 'OOM Killer가 무엇을 죽였는지 확인하는 곳은?', o: ['dmesg / journalctl -k', '/var/log/nginx/error.log', 'systemctl status', '/etc/passwd'], a: 0,
      e: '서비스가 소리 없이 사라졌을 때 가장 먼저 봐야 할 곳입니다.' },
    { q: '4코어 서버의 load average가 4.0이면?', o: ['딱 포화 상태', '여유롭다', '심각한 과부하', 'CPU와 무관하다'], a: 0,
      e: 'load average는 코어 수와 비교합니다. 절대값만으로는 판단할 수 없습니다.' },
    { q: '<code>vmstat</code>에서 <code>wa</code> 값이 크면 병목은?', o: ['디스크 I/O', 'CPU', '메모리', '네트워크'], a: 0,
      e: 'CPU가 디스크를 기다리고 있다는 뜻입니다. CPU를 늘려도 소용없습니다.' },
    { q: '서비스를 <code>0.0.0.0</code>에 바인딩하면?', o: ['모든 네트워크 인터페이스에서 접근 가능해진다', '더 빨라진다', '로컬에서만 접근된다', '자동으로 암호화된다'], a: 0,
      e: '방화벽이 없으면 인터넷 전체에 열립니다. 인증 없는 LLM API 노출 사고의 원인입니다.' },
    { q: '추론 API를 안전하게 노출하는 오늘의 방식은?', o: ['서비스는 127.0.0.1에 묶고 앞단에 프록시를 둔다', '0.0.0.0에 열고 비밀번호를 건다', '포트를 랜덤하게 바꾼다', 'SSH 터널만 쓴다'], a: 0,
      e: '프록시에서 인증·속도제한·로그·TLS를 한 곳에 모을 수 있습니다.' },
    { q: 'Nginx에서 스트리밍 응답이 끝날 때까지 안 나오는 원인은?', o: ['proxy_buffering on', 'proxy_read_timeout 부족', 'gzip 압축', 'keepalive 설정'], a: 0,
      e: 'LLM 서비스에서 사용자가 "멈춘 것 같다"고 느끼는 대표적 원인입니다.' },
    { q: 'Nginx 설정을 고친 뒤 reload 전에 반드시 할 일은? (직접 입력)', t: true, acc: ['nginx -t', 'sudo nginx -t'], ans: 'nginx -t',
      e: '문법 검사입니다. 틀린 설정으로 reload하면 서비스가 죽습니다.' },
    { q: '원격 서버에서 ufw를 켜기 전에 반드시 해야 할 것은?', o: ['22/tcp 허용', '80/tcp 허용', '로그 백업', '재부팅'], a: 0,
      e: '이 순서를 틀리면 자기 자신이 잠겨서 다시 들어갈 수 없습니다.' },
    { q: 'Nginx가 <code>502 Bad Gateway</code>를 반환하는 뜻은?', o: ['프록시가 백엔드에 연결하지 못했다', '요청 형식이 잘못됐다', '권한이 없다', '파일을 찾을 수 없다'], a: 0,
      e: '백엔드가 죽었거나 proxy_pass 주소가 틀렸거나 둘 중 하나입니다. <code>error.log</code>가 답을 알려 줍니다.' },
    { q: '비밀값 관리에서 <strong>하면 안 되는</strong> 것은?', o: ['스크립트 안에 직접 적기', '.env로 분리하기', '권한 600 설정', '.gitignore 등록'], a: 0,
      e: 'git에 한 번 올라가면 나중에 지워도 이력에 영구히 남습니다.' },
    { q: 'SSH 설정을 바꾼 뒤 지켜야 할 절차는?', o: ['기존 접속을 유지한 채 새 창으로 접속 확인', '바로 재부팅', '기존 접속을 먼저 닫기', '방화벽부터 끄기'], a: 0,
      e: '잘못 설정하면 다시 못 들어갑니다. 기존 세션이 유일한 구명줄입니다.' },
    { q: '장애 대응에서 "한 번에 하나만 바꾼다"는 이유는?', o: ['무엇이 문제를 고쳤는지 알기 위해', '시간이 절약돼서', '권한 때문에', '로그가 깨끗해져서'], a: 0,
      e: '두 개를 동시에 바꾸면 원인을 영원히 모른 채 넘어가고, 같은 장애가 반복됩니다.' },
    { q: '포트를 누가 점유했는지 확인하는 명령은? (직접 입력)', t: true, acc: ['ss -tlnp', 'sudo ss -tlnp', 'ss -tulnp', 'lsof -i'], ans: 'ss -tlnp',
      e: '<code>lsof -i :포트</code>도 같은 목적으로 쓸 수 있습니다.' },
    { q: 'RCA 보고서에서 "재발 방지"를 적는 이유는?', o: ['고친 것으로 끝내면 같은 장애가 반복되기 때문', '형식상 필요해서', '보고 의무 때문에', '점수를 위해'], a: 0,
      e: '좋은 엔지니어를 가르는 기준입니다. 조치와 방지는 다른 일입니다.' },
    { q: '서비스가 안 뜰 때 확인 순서로 가장 적절한 것은?', o: ['systemctl status → journalctl -u → 관련 자원(포트·디스크·권한)', '재부팅 → 재설치', '검색 → 복붙', 'sudo 붙여 재시도'], a: 0,
      e: 'Day 7에서 배운 순서 그대로입니다. 오늘 장애 5건이 전부 이 순서로 풀립니다.' }
  ]
};
