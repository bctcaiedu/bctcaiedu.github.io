module.exports = {
  day: 8,
  title: '컨테이너로 환경 재현',
  theme: '"제 컴퓨터에선 됐는데요"를 끝내기',

  openingNar: `여덟째 날입니다. 어제 서비스를 만들었습니다. 그런데 그 서비스를 다른 컴퓨터에 그대로 옮기려면 어떻게 해야 할까요. 설치 순서를 문서로 적어 주는 방법이 있겠죠. 하지만 문서는 반드시 어딘가 틀리거나 빠집니다. 오늘 배우는 컨테이너는 그 설치 과정 자체를 코드로 만들어 통째로 옮기는 기술입니다.`,

  goals: [
    ['컨테이너와 가상머신의 차이를', '격리 원리로 설명할 수 있다'],
    ['이미지·컨테이너·볼륨의 관계를', '실습으로 구분할 수 있다'],
    ['Dockerfile을 작성해', '내 이미지를 빌드할 수 있다'],
    ['레이어 캐시를 이해하고', '빌드 시간을 줄일 수 있다'],
    ['compose로', '여러 서비스를 한 파일로 묶어 기동할 수 있다'],
    ['전부 지운 뒤', '한 줄로 복원되는 것을 검증할 수 있다']
  ],
  goalsNar: `목표는 여섯 개입니다. 컨테이너가 무엇인지 원리로 이해하고, 이미지와 컨테이너와 볼륨을 구분하고, 직접 이미지를 만들고, 빌드를 빠르게 하는 법을 익히고, 여러 서비스를 한 파일로 묶고, 마지막으로 전부 지운 다음 한 줄로 되살아나는지 검증합니다. 마지막 항목이 오늘의 진짜 목표입니다.`,

  blocks: [
    { time: '09:00–11:00', title: '격리의 원리와 Docker 기본', desc: '네임스페이스 · cgroup · run 옵션' },
    { time: '11:10–12:00', title: '볼륨 · 네트워크 · Dockerfile', desc: '데이터는 어디에 남는가' },
    { time: '13:00–15:00', title: '이미지 빌드 실습', desc: '레이어 캐시를 눈으로 측정' },
    { time: '15:10–17:10', title: '추론 스택을 compose 한 파일로', desc: '3개 서비스 묶고 복원 검증' }
  ],
  blocksNar: `오전에는 컨테이너가 무엇인지 원리부터 봅니다. 마법이 아니라 리눅스 커널 기능의 조합이라는 것을 명령어로 확인합니다. 오후에는 직접 이미지를 만들고, 마지막 두 시간에 추론 서버와 웹 유아이와 클라이언트를 한 파일로 묶습니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–11:00', h: '격리의 원리',
      sub: '컨테이너는 마법이 아니라 커널 기능의 조합입니다.',
      nar: `첫 번째 블록입니다. 컨테이너를 신비한 기술로 생각하는 분이 많은데, 사실은 리눅스 커널이 원래 갖고 있던 기능 두 가지를 조합한 것입니다. 오늘 그 두 가지를 명령어로 직접 확인합니다.` },

    { eb: 'VM vs Container', h: '가상머신과 무엇이 다른가',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">가상머신</span><span class="t">커널까지 통째로</span><span class="d">하드웨어를 흉내 내고 그 위에 별도의 커널과 OS를 올립니다.<br><br>무겁고 부팅에 수십 초. 대신 완전히 다른 OS도 가능합니다.</span></div>
        <div class="card"><span class="n">컨테이너</span><span class="t">커널은 공유</span><span class="d">호스트의 커널을 그대로 쓰고 <strong>보이는 범위만</strong> 나눕니다.<br><br>가볍고 기동이 1초 미만. 대신 리눅스 위에서 리눅스만.</span></div>
      </div>
      <div class="bannerG" style="margin-top:2cqh">Day 1에 만든 VM은 진짜 서버를 흉내 내려고, 오늘의 컨테이너는 환경을 옮기려고 씁니다 — 목적이 다릅니다.</div>`,
      nar: `가상머신은 하드웨어를 흉내 내고 그 위에 별도의 커널과 운영체제를 통째로 올립니다. 그래서 무겁고 부팅에 수십 초가 걸립니다. 컨테이너는 호스트의 커널을 그대로 쓰고 보이는 범위만 나눕니다. 그래서 가볍고 일 초도 안 걸려 뜹니다. 대신 리눅스 위에서 리눅스만 돌릴 수 있습니다. 첫날 만든 가상머신은 진짜 서버를 흉내 내려고 쓴 것이고, 오늘의 컨테이너는 환경을 옮기려고 쓰는 것입니다. 목적이 다릅니다.` },

    { eb: 'Namespaces', h: '네임스페이스 — 보이는 범위를 자른다',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># 지금 내 셸이 보는 프로세스</span>
<span class="p">$ ps aux | wc -l</span>
<span class="c">142</span>

<span class="c"># PID 네임스페이스를 새로 만들어 들어가 보면</span>
<span class="p">$ sudo unshare --pid --fork --mount-proc ps aux</span>
<span class="c">USER  PID  ... COMMAND
root    1  ... ps aux</span>      <span class="c">← 자기 자신이 1번입니다</span></pre>
      <div class="bannerG" style="margin-top:2cqh">같은 커널, 같은 컴퓨터인데 <strong>보이는 세상만</strong> 달라졌습니다. 이것이 컨테이너의 절반입니다.</div>`,
      foot: 'PID·네트워크·마운트·사용자 등 종류별로 네임스페이스가 있습니다.',
      nar: `네임스페이스는 보이는 범위를 자르는 커널 기능입니다. 지금 셸에서 프로세스를 세면 백 개가 넘게 나옵니다. 그런데 언셰어 명령으로 새 피아이디 네임스페이스를 만들어 그 안에서 같은 명령을 실행하면, 자기 자신 하나만 보이고 그것이 일번이 됩니다. 같은 커널, 같은 컴퓨터인데 보이는 세상만 달라진 겁니다. 이것이 컨테이너의 절반입니다.` },

    { eb: 'cgroups', h: 'cgroup — 쓸 수 있는 양을 제한한다',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ ls /sys/fs/cgroup/ | head</span>
<span class="c">cpu.max  memory.max  memory.current  pids.max ...</span>

<span class="c"># Docker가 하는 일도 결국 이것입니다</span>
<span class="p">$ docker run --memory=512m --cpus=1 ubuntu ...</span></pre>
      <div class="grid g2" style="margin-top:2cqh">
        <div class="card"><span class="t">네임스페이스</span><span class="d">무엇이 <strong>보이는가</strong> — 프로세스·네트워크·파일시스템</span></div>
        <div class="card"><span class="t">cgroup</span><span class="d">얼마나 <strong>쓸 수 있는가</strong> — CPU·메모리·I/O</span></div>
      </div>`,
      foot: '컨테이너 = 네임스페이스(격리) + cgroup(제한) + 파일시스템 레이어. 그게 전부입니다.',
      nar: `씨그룹은 자원을 얼마나 쓸 수 있는지 제한하는 기능입니다. 도커에서 메모리 제한 옵션을 주면 결국 이 커널 기능을 설정하는 것입니다. 정리하면 이렇습니다. 네임스페이스가 무엇이 보이는지를 정하고, 씨그룹이 얼마나 쓸 수 있는지를 정하고, 여기에 파일시스템 레이어가 더해지면 그것이 컨테이너입니다. 그게 전부입니다.` },

    { eb: 'Docker basics', h: '이미지와 컨테이너는 다르다',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">이미지</span><span class="t">설계도 · 붕어빵 틀</span><span class="d">읽기 전용. 한 번 만들면 안 바뀝니다.<br><code>docker images</code></span></div>
        <div class="card"><span class="n">컨테이너</span><span class="t">실행 중인 것 · 붕어빵</span><span class="d">이미지로 만든 실행 인스턴스. 여러 개 만들 수 있습니다.<br><code>docker ps -a</code></span></div>
      </div>
      <pre style="margin-top:2cqh"><span class="p">$ docker run -d --name web -p 8080:80 nginx</span>
<span class="c">  -d  백그라운드   --name 이름   -p 호스트:컨테이너 포트 연결</span>
<span class="p">$ docker ps</span>
<span class="p">$ docker logs -f web</span>
<span class="p">$ docker exec -it web bash</span>     <span class="c"># 안으로 들어가 보기</span>
<span class="p">$ docker stop web &amp;&amp; docker rm web</span></pre>`,
      nar: `이미지와 컨테이너를 구분하는 것이 중요합니다. 이미지는 설계도이고 읽기 전용입니다. 컨테이너는 그 이미지로 만든 실행 중인 인스턴스입니다. 붕어빵 틀과 붕어빵의 관계라고 생각하시면 됩니다. 하나의 이미지로 컨테이너를 여러 개 만들 수 있습니다. 옵션 중 대시 피가 중요한데, 호스트의 포트와 컨테이너 안의 포트를 연결합니다. 이게 없으면 밖에서 접근할 수 없습니다. 도커 이그젝으로 컨테이너 안에 들어가 볼 수 있는데, 들어가 보면 완전히 다른 리눅스처럼 보입니다.` },

    { section: true, eb: 'Block 2 · 11:10–12:00', h: '볼륨과 Dockerfile',
      sub: '컨테이너를 지우면 데이터는 어떻게 될까요?',
      nar: `두 번째 블록입니다. 아주 중요한 질문에서 시작합니다. 컨테이너를 지우면 그 안에서 만든 데이터는 어떻게 될까요. 답은 같이 사라진다입니다. 그래서 볼륨이 필요합니다.` },

    { eb: 'Volumes', h: '데이터를 컨테이너 밖에 두기',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># 컨테이너 안에 만든 파일은 컨테이너와 함께 사라집니다</span>
<span class="p">$ docker run --rm ubuntu bash -c "echo hi &gt; /tmp/a.txt; cat /tmp/a.txt"</span>

<span class="c"># 볼륨: Docker가 관리하는 저장소</span>
<span class="p">$ docker volume create mydata</span>
<span class="p">$ docker run -v mydata:/data ubuntu bash -c "echo hi &gt; /data/a.txt"</span>
<span class="p">$ docker run -v mydata:/data ubuntu cat /data/a.txt</span>   <span class="c">← 남아 있습니다</span>

<span class="c"># 바인드 마운트: 내 디렉터리를 그대로 연결</span>
<span class="p">$ docker run -v ~/ai-lab/datasets:/data ubuntu ls /data</span></pre>`,
      foot: '모델 캐시는 반드시 볼륨에 둡니다 — 컨테이너를 지울 때마다 수 GB를 다시 받을 수는 없습니다.',
      nar: `컨테이너 안에 만든 파일은 컨테이너를 지우면 함께 사라집니다. 그래서 남겨야 할 데이터는 밖에 둡니다. 두 가지 방법이 있습니다. 볼륨은 도커가 관리하는 저장소이고, 바인드 마운트는 내 컴퓨터의 디렉터리를 컨테이너 안에 그대로 연결하는 것입니다. 오늘 실습에서 모델 캐시를 반드시 볼륨에 둘 텐데, 이유는 명확합니다. 컨테이너를 지울 때마다 수 기가바이트짜리 모델을 다시 받을 수는 없기 때문입니다.` },

    { eb: 'Dockerfile', h: '이미지를 코드로 만들기',
      body: `<pre style="margin-top:1.6cqh"><span class="p">FROM</span> python:3.12-slim          <span class="c"># 기반 이미지</span>
<span class="p">WORKDIR</span> /app

<span class="p">COPY</span> requirements.txt .        <span class="c"># ① 의존성 파일만 먼저</span>
<span class="p">RUN</span> pip install --no-cache-dir -r requirements.txt

<span class="p">COPY</span> . .                        <span class="c"># ② 소스는 나중에</span>
<span class="p">ENV</span> OLLAMA_HOST=http://ollama:11434
<span class="p">CMD</span> ["python", "client.py"]</pre>
      <div class="bannerG" style="margin-top:2cqh">①과 ②의 순서가 핵심입니다. 소스만 고쳤을 때 pip install을 다시 하지 않게 됩니다.</div>`,
      foot: '각 줄이 하나의 레이어입니다. 바뀐 줄부터 아래만 다시 만들어집니다.',
      nar: `도커파일은 이미지를 만드는 설명서입니다. 여기서 오늘 가장 실용적인 지식이 나옵니다. 각 줄이 하나의 레이어가 되는데, 도커는 바뀌지 않은 레이어를 재사용합니다. 그래서 의존성 파일을 먼저 복사해서 설치하고, 소스 코드는 나중에 복사해야 합니다. 이 순서를 지키면 소스만 고쳤을 때 핍 인스톨을 다시 하지 않습니다. 순서를 반대로 하면 한 글자만 고쳐도 매번 몇 분씩 기다려야 합니다. 오후 실습에서 이걸 직접 측정해 봅니다.` },

    { eb: 'compose', h: 'compose — 여러 서비스를 한 파일로',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># compose.yaml</span>
<span class="p">services:</span>
  ollama:
    image: ollama/ollama
    volumes: [ollama_models:/root/.ollama]
    ports: ["11434:11434"]
    restart: unless-stopped

  webui:
    image: ghcr.io/open-webui/open-webui:main
    ports: ["3000:8080"]
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    depends_on: [ollama]

<span class="p">volumes:</span>
  ollama_models:</pre>
      <div class="bannerG" style="margin-top:2cqh">같은 compose 네트워크 안에서는 <strong>서비스 이름이 곧 호스트 이름</strong>입니다.</div>`,
      foot: 'docker compose up -d 한 줄로 전부 뜨고, down -v 한 줄로 전부 사라집니다.',
      nar: `컴포즈는 여러 서비스를 한 파일에 적어 두고 한 번에 띄우는 도구입니다. 여기서 중요한 것이 하나 있습니다. 같은 컴포즈 네트워크 안에서는 서비스 이름이 곧 호스트 이름이 됩니다. 웹 유아이가 올라마에 접근할 때 아이피가 아니라 올라마라는 이름으로 부를 수 있습니다. 컴포즈 업 대시 디 한 줄로 전부 뜨고, 다운 대시 브이 한 줄로 전부 사라집니다. 이 지우고 되살리는 사이클이 오늘의 마지막 검증입니다.` },

    { eb: 'GPU', h: 'GPU 컨테이너는 한 겹 더',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># 호스트에 드라이버 + nvidia-container-toolkit 설치 후</span>
<span class="p">$ docker run --rm --gpus all nvidia/cuda:12.4.0-base nvidia-smi</span>

<span class="c"># compose 에서</span>
<span class="p">    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]</span></pre>
      <div class="banner" style="margin-top:2cqh">드라이버는 <strong>호스트</strong>에, CUDA 런타임은 <strong>이미지</strong>에 — 이 구분이 GPU 컨테이너 오류의 대부분입니다.</div>`,
      foot: 'GPU가 없는 환경에서는 개념만 보고 넘어갑니다. CPU로 오늘 실습은 전부 됩니다.',
      nar: `지피유를 컨테이너에서 쓰려면 한 겹이 더 필요합니다. 엔비디아 컨테이너 툴킷이라는 것을 호스트에 설치해야 컨테이너가 지피유를 볼 수 있습니다. 여기서 헷갈리기 쉬운 구분이 있습니다. 드라이버는 호스트에 있어야 하고, 쿠다 런타임은 이미지 안에 있어야 합니다. 어제 본 층 구조가 컨테이너에서는 이렇게 나뉩니다. 지피유 컨테이너 오류의 대부분이 이 구분을 몰라서 생깁니다.` },

    { section: true, eb: 'Block 4 · AI LAB · 15:10–17:10', h: '추론 스택을 한 파일로',
      sub: '세 개의 서비스를 묶고, 전부 지운 뒤 되살립니다.',
      nar: `마지막 블록입니다. 추론 서버와 웹 유아이와 직접 만든 클라이언트, 세 개를 컴포즈 한 파일로 묶습니다. 그리고 전부 지운 다음 한 줄로 되살아나는지 검증합니다.` },

    { eb: 'AI LAB', h: '오늘의 코스',
      body: `<div class="rowlist" style="margin-top:1.6cqh">
        <div class="row"><span class="dot">1</span><span class="t">Ollama 컨테이너 + 볼륨</span><span class="d">모델 캐시를 밖에 보관</span></div>
        <div class="row"><span class="dot">2</span><span class="t">웹 UI 붙이기</span><span class="d">서비스 이름으로 통신</span></div>
        <div class="row"><span class="dot">3</span><span class="t">클라이언트 이미지 직접 빌드</span><span class="d">Dockerfile 작성</span></div>
        <div class="row"><span class="dot">4</span><span class="t">전부 지우기</span><span class="d">compose down (볼륨은 남김)</span></div>
        <div class="row"><span class="dot">5</span><span class="t">한 줄로 복원</span><span class="d">모델을 다시 안 받는지 확인</span></div>
      </div>`,
      foot: '5번에서 모델을 다시 받지 않는다면 볼륨 설계가 옳았다는 증거입니다.',
      nar: `다섯 단계입니다. 올라마 컨테이너를 볼륨과 함께 띄우고, 웹 유아이를 붙이고, 클라이언트 이미지를 직접 만들고, 전부 지운 다음, 한 줄로 복원합니다. 다섯 번째에서 확인할 것이 있습니다. 복원할 때 모델을 다시 받지 않아야 합니다. 다시 받는다면 볼륨 설계가 틀린 것입니다. 이 검증이 오늘의 결론입니다.` },

    { eb: 'Compare', h: '어제의 systemd와 오늘의 컨테이너',
      body: `<div class="grid g2" style="margin-top:2cqh">
        <div class="card"><span class="n">Day 7 · systemd</span><span class="t">이 컴퓨터에서 확실하게</span><span class="d">호스트에 직접 설치<br>부팅 연동·자원 제어가 정교<br><br>다른 컴퓨터로 옮기려면 설치를 처음부터</span></div>
        <div class="card"><span class="n">Day 8 · 컨테이너</span><span class="t">어느 컴퓨터에서든 똑같이</span><span class="d">이미지째로 이동<br>한 줄로 복원<br><br>커널·드라이버는 여전히 호스트 몫</span></div>
      </div>`,
      foot: '둘은 경쟁 관계가 아닙니다 — Day 10 프로젝트에서는 둘 중 하나를 골라 쓰면 됩니다.',
      nar: `어제 배운 시스템디와 오늘의 컨테이너를 비교해 보겠습니다. 시스템디는 이 컴퓨터에서 확실하게 돌리는 데 강하고, 부팅 연동과 자원 제어가 정교합니다. 대신 다른 컴퓨터로 옮기려면 설치를 처음부터 해야 합니다. 컨테이너는 어느 컴퓨터에서든 똑같이 도는 데 강합니다. 대신 커널과 드라이버는 여전히 호스트 몫입니다. 둘은 경쟁 관계가 아니고, 열째 날 프로젝트에서는 둘 중 하나를 골라 쓰시면 됩니다.` }
  ],

  assignment: {
    title: '3개 서비스 compose 스택과 README',
    lede: '추론 서버 · 웹 UI · 클라이언트를 한 파일로 묶고, 처음 보는 사람이 따라 할 수 있게 문서화하십시오.',
    items: [
      'compose.yaml 전문 (3개 서비스)',
      '직접 작성한 Dockerfile',
      '모델 캐시 볼륨 설계와 그 근거',
      'down → up 복원 검증 기록',
      '레이어 캐시 적용 전후 빌드 시간 비교',
      'README (사양 요건 · 실행 명령 · 흔한 오류 3건)'
    ],
    note: '4번과 6번이 배점의 절반입니다. <strong>처음 보는 사람이 README만 보고 실행할 수 있는가</strong>가 기준입니다. 옆 사람과 서로 README를 바꿔 실행해 보고 그 결과를 적으십시오.',
    sample: `<span class="o">5. 레이어 캐시 비교
   COPY . . 를 먼저 둔 경우 : 재빌드 47초 (pip 재설치)
   requirements 먼저 둔 경우 : 재빌드 3초 (캐시 사용)
   → 소스만 고칠 때 15배 차이</span>`,
    nar: `과제입니다. 세 개의 서비스를 컴포즈 한 파일로 묶고, 처음 보는 사람이 따라 할 수 있게 문서를 쓰십시오. 배점의 절반은 네 번째와 여섯 번째입니다. 전부 지웠다가 복원되는지, 그리고 리드미만 보고 남이 실행할 수 있는지입니다. 옆 사람과 리드미를 서로 바꿔서 실행해 보고 그 결과를 적어 주십시오. 내 문서의 빈칸은 남이 실행해 봐야 보입니다.` },

  wrap: {
    done: '격리의 원리를 확인하고, 이미지를 만들고, 스택을 한 파일로 묶어 복원까지 검증했습니다.',
    next: '내일 · Day 9 — 운영 · 보안 · 장애',
    nextDesc: '띄우는 것보다 지키는 것이 어렵습니다. 오후에는 강사가 심어둔 장애 5건을 복구합니다.',
    nar: `오늘 한 일을 정리하겠습니다. 컨테이너가 네임스페이스와 씨그룹의 조합이라는 것을 명령어로 확인했고, 이미지와 컨테이너와 볼륨을 구분했고, 도커파일을 직접 써서 이미지를 만들었고, 레이어 캐시로 빌드 시간을 줄였습니다. 그리고 세 개의 서비스를 한 파일로 묶어 지웠다 되살리는 것까지 검증했습니다. 내일은 운영입니다. 띄우는 것보다 지키는 것이 어렵다는 이야기이고, 오후에는 제가 심어둔 장애 다섯 건을 여러분이 직접 복구하게 됩니다. 수고하셨습니다.` },

  lab: {
    h1: '컨테이너로 환경 재현',
    standfirst: '오늘은 <strong>WSL2</strong>에서 진행합니다. Docker가 디스크를 많이 먹으니 시작 전에 <code>df -h</code>로 여유를 확인하세요.',
    rules: [
      ['이미지와 컨테이너를 구분한다', 'docker images와 docker ps -a는 다른 것을 보여줍니다. 매번 확인하세요.'],
      ['데이터는 볼륨에', '컨테이너 안에 만든 것은 컨테이너와 함께 사라집니다.'],
      ['down -v 는 볼륨까지 지운다', '-v를 붙이면 모델 캐시도 사라집니다. 수 GB를 다시 받게 됩니다.']
    ],
    parts: [
      {
        pn: 'PART 0', h: 'Docker 설치', time: '13:00–13:20',
        steps: [
          { sn: 'SETUP', h: '설치와 권한 설정', body: `
      <pre><span class="p">$</span> df -h /                       <span class="c"># 최소 20GB 여유 권장</span>
<span class="p">$</span> curl -fsSL https://get.docker.com -o get-docker.sh
<span class="p">$</span> grep -n "apt-get install\\|docker-ce" get-docker.sh | head
<span class="p">$</span> sudo sh get-docker.sh

<span class="p">$</span> sudo usermod -aG docker $USER     <span class="c"># sudo 없이 쓰기 위해 (Day 4)</span>
<span class="p">$</span> newgrp docker                     <span class="c"># 또는 터미널 재시작</span>
<span class="p">$</span> docker run --rm hello-world
<span class="p">$</span> docker compose version</pre>
      <div class="box check"><span class="lbl">Day 4가 여기서</span>
        <p><code>docker</code> 그룹에 넣는 것은 그 계정에 사실상 root 권한을 주는 것과 같습니다. 개인 실습 환경이라 하는 것이고, 공용 서버에서는 신중해야 합니다.</p></div>
      <div class="box warn"><span class="lbl">WSL2에서 안 뜨면</span>
        <p><code>sudo service docker start</code>를 먼저 실행하세요. Day 7에서 systemd를 켰다면 <code>sudo systemctl start docker</code>도 됩니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 1', h: '격리의 원리 확인', time: '13:20–14:00',
        missions: [
          { n: 1, h: '네임스페이스를 눈으로', body: `
      <pre><span class="p">$</span> ps aux | wc -l
<span class="p">$</span> sudo unshare --pid --fork --mount-proc ps aux
<span class="p">$</span> sudo unshare --pid --fork --mount-proc ps aux | wc -l

<span class="c"># 호스트네임 네임스페이스</span>
<span class="p">$</span> hostname
<span class="p">$</span> sudo unshare --uts bash -c "hostname container-test; hostname"
<span class="p">$</span> hostname                      <span class="c">← 밖은 그대로입니다</span></pre>
      <div class="box check"><span class="lbl">이것이 컨테이너의 절반</span>
        <p>Docker 없이 커널 기능만으로 격리를 만들었습니다. Docker는 이것을 쓰기 좋게 포장한 도구입니다.</p></div>` },
          { n: 2, h: '컨테이너 안에서 밖을 보기', body: `
      <pre><span class="p">$</span> docker run --rm ubuntu ps aux
<span class="p">$</span> docker run --rm ubuntu hostname
<span class="p">$</span> docker run --rm ubuntu cat /etc/os-release | head -3

<span class="c"># 그런데 커널은 호스트와 같습니다</span>
<span class="p">$</span> uname -r
<span class="p">$</span> docker run --rm ubuntu uname -r</pre>
      <div class="box q"><span class="lbl">확인 질문</span><p>컨테이너 안은 Ubuntu인데 커널 버전이 호스트와 같습니다. 이것이 VM과의 결정적 차이입니다. 왜 그럴까요?</p></div>` },
          { n: 3, h: 'cgroup으로 자원 제한', body: `
      <pre><span class="p">$</span> docker run --rm --memory=100m ubuntu \\
    bash -c "cat /sys/fs/cgroup/memory.max"

<span class="c"># 제한을 넘기면 어떻게 되나</span>
<span class="p">$</span> docker run --rm --memory=100m python:3.12-slim \\
    python -c "a=[];
while True: a.append(' '*10**7)"
<span class="c"># Killed 로 종료됩니다 (Day 4의 OOM)</span></pre>
      <div class="box check"><span class="lbl">Day 4의 OOM Killer</span>
        <p>호스트 전체가 아니라 <strong>그 컨테이너만</strong> 죽습니다. 이것이 cgroup으로 자원을 나눈 효과입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '이미지 · 컨테이너 · 볼륨', time: '14:00–15:00',
        missions: [
          { n: 4, h: '이미지와 컨테이너 구분', body: `
      <pre><span class="p">$</span> docker pull nginx:alpine
<span class="p">$</span> docker images
<span class="p">$</span> docker run -d --name web1 -p 8080:80 nginx:alpine
<span class="p">$</span> docker run -d --name web2 -p 8081:80 nginx:alpine
<span class="p">$</span> docker ps
<span class="p">$</span> docker images                  <span class="c">← 이미지는 여전히 1개</span>

<span class="p">$</span> curl -s localhost:8080 | head -4
<span class="p">$</span> curl -s localhost:8081 | head -4
<span class="p">$</span> docker logs web1 | tail -3
<span class="p">$</span> docker stop web1 web2 &amp;&amp; docker rm web1 web2</pre>
      <div class="box check"><span class="lbl">이미지 1개 → 컨테이너 2개</span>
        <p>붕어빵 틀 하나로 붕어빵 두 개를 구웠습니다. 포트만 다르게 줬습니다.</p></div>` },
          { n: 5, h: '데이터가 사라지는 것을 확인', body: `
      <pre><span class="c"># 컨테이너 안에 저장 → 사라짐</span>
<span class="p">$</span> docker run --name t1 ubuntu bash -c "echo 중요한자료 &gt; /data.txt"
<span class="p">$</span> docker rm t1
<span class="p">$</span> docker run --rm ubuntu cat /data.txt      <span class="c"># 없습니다</span>

<span class="c"># 볼륨에 저장 → 남음</span>
<span class="p">$</span> docker volume create labdata
<span class="p">$</span> docker run --rm -v labdata:/d ubuntu bash -c "echo 중요한자료 &gt; /d/a.txt"
<span class="p">$</span> docker run --rm -v labdata:/d ubuntu cat /d/a.txt
<span class="p">$</span> docker volume ls
<span class="p">$</span> docker volume inspect labdata | jq -r '.[0].Mountpoint'

<span class="c"># 바인드 마운트: 내 폴더를 그대로</span>
<span class="p">$</span> docker run --rm -v ~/ai-lab/datasets:/d:ro ubuntu ls -l /d</pre>
      <div class="box check"><span class="lbl">:ro</span>
        <p>바인드 마운트 끝에 <code>:ro</code>를 붙이면 읽기 전용입니다. 원본 데이터를 컨테이너가 망가뜨리지 못하게 하는 안전장치입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: 'Dockerfile과 레이어 캐시', time: '15:10–16:00',
        missions: [
          { n: 6, h: '클라이언트 이미지 만들기', body: `
      <pre><span class="p">$</span> mkdir -p ~/ai-lab/docker/client &amp;&amp; cd ~/ai-lab/docker/client

<span class="p">$</span> cat &gt; requirements.txt &lt;&lt;'EOF'
requests==2.32.3
EOF

<span class="p">$</span> cat &gt; client.py &lt;&lt;'EOF'
import os, sys, time, requests
HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
MODEL = os.environ.get("MODEL", "qwen2.5:0.5b")
prompt = sys.argv[1] if len(sys.argv) > 1 else "리눅스를 한 문장으로"
t = time.time()
r = requests.post(f"{HOST}/api/generate",
                  json={"model": MODEL, "prompt": prompt, "stream": False},
                  timeout=120)
print(f"[{time.time()-t:.1f}s] {r.json().get('response','')[:200]}")
EOF

<span class="p">$</span> cat &gt; Dockerfile &lt;&lt;'EOF'
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV OLLAMA_HOST=http://ollama:11434
CMD ["python", "client.py"]
EOF

<span class="p">$</span> time docker build -t llm-client:v1 .
<span class="p">$</span> docker images | grep llm-client</pre>` },
          { n: 7, h: '레이어 캐시 측정 (오늘의 실용 지식)', body: `
      <pre><span class="c"># 소스만 고치고 재빌드</span>
<span class="p">$</span> echo "# 주석 추가" &gt;&gt; client.py
<span class="p">$</span> time docker build -t llm-client:v2 .
<span class="c"># → pip install 이 CACHED 로 표시되고 몇 초 만에 끝납니다</span>

<span class="c"># 이번엔 순서를 일부러 나쁘게</span>
<span class="p">$</span> cat &gt; Dockerfile.bad &lt;&lt;'EOF'
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["python", "client.py"]
EOF
<span class="p">$</span> time docker build -f Dockerfile.bad -t llm-client:bad .
<span class="p">$</span> echo "# 또 주석" &gt;&gt; client.py
<span class="p">$</span> time docker build -f Dockerfile.bad -t llm-client:bad2 .
<span class="c"># → pip install 을 매번 다시 합니다</span></pre>
      <div class="box check"><span class="lbl">과제 5번 항목</span>
        <p>두 방식의 재빌드 시간을 기록해 두세요. 실제 프로젝트에서는 이 차이가 하루에 수십 분이 됩니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 4', h: 'AI LAB · compose 스택', time: '16:00–17:10',
        missions: [
          { n: 8, h: '3개 서비스 묶기', body: `
      <pre><span class="p">$</span> cd ~/ai-lab/docker
<span class="p">$</span> cat &gt; compose.yaml &lt;&lt;'EOF'
services:
  ollama:
    image: ollama/ollama
    container_name: lab-ollama
    volumes:
      - ollama_models:/root/.ollama
    ports:
      - "11434:11434"
    restart: unless-stopped

  webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: lab-webui
    ports:
      - "3000:8080"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    volumes:
      - webui_data:/app/backend/data
    depends_on:
      - ollama
    restart: unless-stopped

  client:
    build: ./client
    container_name: lab-client
    environment:
      - OLLAMA_HOST=http://ollama:11434
      - MODEL=qwen2.5:0.5b
    depends_on:
      - ollama
    profiles: ["tools"]

volumes:
  ollama_models:
  webui_data:
EOF

<span class="p">$</span> docker compose up -d
<span class="p">$</span> docker compose ps
<span class="p">$</span> docker compose logs -f ollama      <span class="c"># Ctrl+C</span></pre>
      <div class="box check"><span class="lbl">profiles</span>
        <p>클라이언트는 상시 실행이 아니라 필요할 때만 돌리는 도구라 <code>profiles</code>로 분리했습니다. 기본 <code>up</code>에서는 뜨지 않습니다.</p></div>` },
          { n: 9, h: '서비스 이름으로 통신', body: `
      <pre><span class="p">$</span> docker compose exec ollama ollama pull qwen2.5:0.5b
<span class="p">$</span> curl -s localhost:11434/api/tags | jq -r '.models[].name'

<span class="c"># 컨테이너 사이의 통신 — IP가 아니라 이름으로</span>
<span class="p">$</span> docker compose run --rm client python client.py "파이프란?"

<span class="c"># 웹 UI 확인 (브라우저에서 localhost:3000)</span>
<span class="p">$</span> curl -s -o /dev/null -w "%{http_code}\\n" localhost:3000</pre>
      <div class="box q"><span class="lbl">확인 질문</span><p>client.py는 <code>http://ollama:11434</code>로 접속합니다. <code>ollama</code>라는 호스트 이름은 어디서 온 걸까요?</p></div>` },
          { n: 10, h: '전부 지우고 한 줄로 복원 (오늘의 결론)', body: `
      <pre><span class="c"># 모델 캐시 크기를 먼저 기록</span>
<span class="p">$</span> docker system df
<span class="p">$</span> docker volume inspect ollama_models | jq -r '.[0].Mountpoint'

<span class="c"># 컨테이너만 지우기 (볼륨은 유지)</span>
<span class="p">$</span> docker compose down
<span class="p">$</span> docker ps -a
<span class="p">$</span> docker volume ls                  <span class="c">← 볼륨은 남아 있습니다</span>

<span class="c"># 한 줄로 복원</span>
<span class="p">$</span> time docker compose up -d
<span class="p">$</span> sleep 5
<span class="p">$</span> curl -s localhost:11434/api/tags | jq -r '.models[].name'</pre>
      <div class="box check"><span class="lbl">모델을 다시 받지 않았다면 성공</span>
        <p>볼륨 설계가 옳았다는 증거입니다. 이것이 오늘의 결론이고 과제 4번 항목입니다.</p></div>
      <div class="box warn"><span class="lbl">-v 를 붙이면</span>
        <p><code>docker compose down -v</code>는 볼륨까지 지웁니다. 그러면 모델을 처음부터 다시 받아야 합니다. 실습 마지막에 정리할 때만 쓰세요.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>permission denied ... docker.sock</code>', 'docker 그룹 미적용', '<code>newgrp docker</code> 또는 터미널 재시작'],
      ['<code>Cannot connect to the Docker daemon</code>', '데몬 미기동', '<code>sudo service docker start</code>'],
      ['<code>port is already allocated</code>', '포트 중복', '<code>ss -tlnp | grep 포트</code>로 확인 후 변경'],
      ['컨테이너 재생성 후 데이터가 없다', '볼륨 미사용', '<code>-v 볼륨명:경로</code>로 밖에 저장'],
      ['<code>no space left on device</code>', '이미지·볼륨 누적', '<code>docker system df</code> 확인 후 <code>docker system prune</code>'],
      ['빌드가 매번 느리다', 'COPY 순서 문제', 'requirements를 먼저 COPY하고 install 후 소스 COPY']
    ],
    checklist: [
      '<code>unshare</code>로 PID 네임스페이스를 직접 만들어 봤다',
      '컨테이너와 호스트의 커널 버전이 같은 것을 확인했다',
      '<code>--memory</code> 제한으로 컨테이너만 OOM되는 것을 봤다',
      '이미지 1개로 컨테이너 2개를 띄웠다',
      '컨테이너 삭제 시 내부 데이터가 사라지는 것을 확인했다',
      '볼륨과 바인드 마운트를 각각 써 봤다',
      'Dockerfile을 작성해 이미지를 빌드했다',
      'COPY 순서에 따른 재빌드 시간 차이를 측정했다',
      'compose로 3개 서비스를 정의했다',
      '서비스 이름으로 컨테이너 간 통신이 되는 것을 확인했다',
      '<code>down</code> → <code>up -d</code> 후 모델을 다시 받지 않았다'
    ]
  },

  quizTitle: '컨테이너 퀴즈',
  quiz: [
    { q: '컨테이너와 가상머신의 결정적 차이는?', o: ['컨테이너는 호스트의 커널을 공유한다', '컨테이너가 더 안전하다', '컨테이너는 파일시스템이 없다', 'VM은 네트워크를 못 쓴다'], a: 0,
      e: '<code>uname -r</code>을 호스트와 컨테이너에서 각각 쳐 보면 같은 커널 버전이 나옵니다.' },
    { q: '"무엇이 보이는가"를 나누는 커널 기능은?', o: ['네임스페이스', 'cgroup', 'chroot', 'SELinux'], a: 0,
      e: 'cgroup은 "얼마나 쓸 수 있는가"를 담당합니다. 둘의 조합이 컨테이너입니다.' },
    { q: '컨테이너의 메모리 사용량을 제한하는 커널 기능은?', o: ['cgroup', '네임스페이스', 'iptables', 'AppArmor'], a: 0,
      e: '<code>docker run --memory=100m</code>이 결국 설정하는 것이 cgroup입니다.' },
    { q: '이미지와 컨테이너의 관계로 옳은 것은?', o: ['이미지는 읽기 전용 설계도, 컨테이너는 그 실행 인스턴스', '둘은 같은 것이다', '컨테이너로 이미지를 만든다', '이미지는 실행 중인 것이다'], a: 0,
      e: '이미지 1개로 컨테이너를 여러 개 만들 수 있습니다. 붕어빵 틀과 붕어빵입니다.' },
    { q: '호스트의 8080을 컨테이너의 80에 연결하는 옵션은?', o: ['-p 8080:80', '-p 80:8080', '--port 8080', '-v 8080:80'], a: 0,
      e: '<strong>호스트:컨테이너</strong> 순서입니다. 반대로 쓰면 접속이 안 됩니다.' },
    { q: '컨테이너를 삭제하면 그 안에 만든 파일은?', o: ['함께 사라진다', '볼륨에 자동 보관된다', '호스트 /tmp로 옮겨진다', '이미지에 저장된다'], a: 0,
      e: '그래서 남겨야 할 데이터는 볼륨이나 바인드 마운트로 밖에 둡니다.' },
    { q: '내 폴더를 컨테이너에 <strong>읽기 전용</strong>으로 연결하는 표기는?', o: ['-v ~/data:/d:ro', '-v ~/data:/d --readonly', '-v ro:~/data:/d', '--mount ro ~/data'], a: 0,
      e: '원본 데이터를 컨테이너가 망가뜨리지 못하게 하는 안전장치입니다.' },
    { q: 'Dockerfile에서 <code>COPY requirements.txt .</code>를 <code>COPY . .</code>보다 <strong>먼저</strong> 두는 이유는?', o: ['소스만 바뀌었을 때 의존성 설치 레이어를 재사용하려고', '문법상 필수라서', '파일 크기를 줄이려고', '보안 때문에'], a: 0,
      e: '오늘 가장 실용적인 지식입니다. 재빌드 시간이 10배 이상 차이납니다.' },
    { q: 'Dockerfile의 각 명령줄은 무엇이 되나요?', o: ['레이어', '프로세스', '볼륨', '컨테이너'], a: 0,
      e: '바뀐 레이어부터 아래만 다시 만들어집니다. 그래서 순서가 중요합니다.' },
    { q: 'compose 파일에서 한 서비스가 다른 서비스를 부를 때 쓰는 주소는?', o: ['서비스 이름 (예: http://ollama:11434)', 'localhost', '컨테이너 IP를 직접 조회', '호스트의 공인 IP'], a: 0,
      e: 'compose가 내부 DNS를 제공합니다. IP는 재기동 때마다 바뀌므로 이름을 써야 합니다.' },
    { q: '<code>docker compose down</code>과 <code>down -v</code>의 차이는?', o: ['-v는 볼륨까지 지운다', '-v는 더 빠르다', '-v는 이미지도 지운다', '차이가 없다'], a: 0,
      e: '<code>-v</code>를 붙이면 모델 캐시가 사라져 수 GB를 다시 받아야 합니다.' },
    { q: 'GPU 컨테이너에서 <strong>드라이버</strong>는 어디에 있어야 하나요?', o: ['호스트', '컨테이너 이미지', '볼륨', '둘 다 필요 없다'], a: 0,
      e: '드라이버는 호스트, CUDA 런타임은 이미지. 이 구분이 GPU 컨테이너 오류의 대부분입니다.' },
    { q: '<code>docker system df</code>가 보여주는 것은?', o: ['이미지·컨테이너·볼륨이 차지한 디스크 용량', '컨테이너의 CPU 사용률', '네트워크 사용량', '실행 중인 프로세스'], a: 0,
      e: 'Day 9의 "디스크 가득 참" 장애에서 가장 먼저 치게 될 명령입니다.' },
    { q: '<code>permission denied ... docker.sock</code> 오류의 해결은?', o: ['docker 그룹에 추가 후 세션 갱신', 'sudo로 모든 명령 실행', '재설치', '포트 변경'], a: 0,
      e: '<code>sudo usermod -aG docker $USER</code> 후 <code>newgrp docker</code>. Day 4의 그룹 개념입니다.' },
    { q: '이미지를 빌드하는 명령은? (직접 입력 — 태그 포함 형태)', t: true, acc: ['docker build -t', 'docker build -t 이름 .', 'docker build'], ans: 'docker build -t 이름 .',
      e: '<code>-t</code>는 태그(이름), 마지막 <code>.</code>은 빌드 컨텍스트(현재 디렉터리)입니다.' },
    { q: 'compose에서 특정 서비스를 기본 <code>up</code>에서 제외하려면?', o: ['profiles 로 분리', 'disabled: true', 'skip: yes', '주석 처리만 가능'], a: 0,
      e: '필요할 때만 <code>docker compose run --rm 서비스</code>로 실행합니다.' },
    { q: '컨테이너가 메모리 제한을 넘기면?', o: ['그 컨테이너만 죽는다', '호스트 전체가 멈춘다', '자동으로 제한이 늘어난다', '디스크로 스왑된다'], a: 0,
      e: 'cgroup으로 자원을 나눈 효과입니다. Day 4의 OOM Killer가 컨테이너 단위로 동작합니다.' },
    { q: 'Day 7의 systemd 방식과 오늘의 컨테이너 방식의 관계는?', o: ['목적이 다르며 프로젝트에서 선택해 쓰면 된다', '컨테이너가 항상 낫다', 'systemd가 항상 낫다', '반드시 함께 써야 한다'], a: 0,
      e: 'systemd는 이 컴퓨터에서 확실하게, 컨테이너는 어디서든 똑같이. Day 10에서 하나를 골라 쓰면 됩니다.' }
  ]
};
