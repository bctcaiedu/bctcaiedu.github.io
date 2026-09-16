module.exports = {
  day: 5,
  title: '패키지 · 환경 · 원격 접속',
  theme: '개발환경을 남이 재현할 수 있게 만든다',

  openingNar: `다섯째 날입니다. 오늘은 화려한 주제가 아닙니다. 패키지를 설치하고, 환경변수를 다루고, 원격 서버에 접속합니다. 하지만 앞으로 남은 닷새 동안 가장 자주 쓰게 될 내용이고, 여러분이 인공지능 프로젝트에서 겪게 될 문제의 절반이 여기에 있습니다. 왜 내 컴퓨터에서는 되는데 저 서버에서는 안 되는가. 오늘 그 답을 배웁니다.`,

  goals: [
    ['apt로', '패키지를 찾고 설치하고 저장소를 추가할 수 있다'],
    ['시스템 파이썬을 오염시키지 않고', 'venv로 격리된 환경을 만들 수 있다'],
    ['PATH와 환경변수가', '명령을 찾는 순서를 설명할 수 있다'],
    ['SSH 키 인증으로', '비밀번호 없이 원격 접속할 수 있다'],
    ['rsync로', '대용량 파일을 중단·재개하며 전송할 수 있다'],
    ['tmux로', '접속이 끊겨도 작업이 살아 있게 만들 수 있다']
  ],
  goalsNar: `목표는 여섯 개입니다. 앞의 세 개는 내 컴퓨터 안의 이야기입니다. 패키지를 설치하고, 파이썬 환경을 격리하고, 환경변수가 어떻게 동작하는지 이해합니다. 뒤의 세 개는 원격 이야기입니다. 키로 접속하고, 큰 파일을 안전하게 옮기고, 접속이 끊겨도 작업이 살아 있게 만듭니다.`,

  blocks: [
    { time: '09:00–11:00', title: '패키지와 의존성', desc: 'apt · 저장소 · 파이썬 격리' },
    { time: '11:10–12:00', title: '환경변수와 PATH', desc: 'export · .bashrc · source' },
    { time: '13:00–15:00', title: 'SSH · rsync · tmux', desc: '원격 작업의 3종 세트' },
    { time: '15:10–17:10', title: '원격에 환경 옮기기', desc: 'VM을 서버 삼아 전 과정 실습' }
  ],
  blocksNar: `오전에는 내 컴퓨터 안의 환경을 다루고, 오후에는 원격으로 나갑니다. 마지막 두 시간에는 가상머신을 원격 서버로 삼아서, 키를 만들고 접속하고 환경을 구성하고 대용량 파일을 옮기는 전 과정을 한 번에 해봅니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–11:00', h: '패키지와 의존성',
      sub: '설치가 안 되는 이유의 대부분은 의존성과 버전입니다.',
      nar: `첫 번째 블록입니다. 리눅스에서 프로그램을 설치한다는 것은 윈도우에서 설치 파일을 받아 더블클릭하는 것과 다릅니다. 패키지 관리자가 의존성까지 따져서 알아서 가져옵니다. 그 구조를 이해하면 설치 오류의 대부분을 스스로 해결할 수 있습니다.` },

    { eb: 'apt', h: 'apt — 찾고 설치하고 지우기',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ sudo apt update</span>            <span class="c"># 목록 갱신 — 설치가 아닙니다</span>
<span class="p">$ apt search jq</span>                <span class="c"># 찾기</span>
<span class="p">$ apt show jq</span>                  <span class="c"># 설명·의존성 보기</span>
<span class="p">$ sudo apt install -y jq tree htop</span>
<span class="p">$ apt list --installed | wc -l</span>  <span class="c"># 몇 개나 깔려 있나</span>
<span class="p">$ dpkg -L jq</span>                   <span class="c"># 이 패키지가 설치한 파일들</span>
<span class="p">$ dpkg -S /usr/bin/jq</span>          <span class="c"># 이 파일은 어느 패키지 것인가</span>
<span class="p">$ sudo apt remove jq</span></pre>`,
      foot: 'update는 "목록만" 갱신합니다. 실제 설치는 install, 업그레이드는 upgrade입니다.',
      nar: `에이피티의 명령은 몇 개 안 됩니다. 업데이트는 설치 가능한 목록을 갱신하는 것이지 프로그램을 설치하는 게 아닙니다. 이걸 헷갈리는 분이 많습니다. 인스톨이 실제 설치이고, 서치와 쇼로 찾아볼 수 있습니다. 디피케이지는 더 낮은 수준의 도구인데 두 가지가 유용합니다. 디피케이지 대시 대문자 엘은 그 패키지가 어떤 파일들을 깔았는지 보여 주고, 대시 대문자 에스는 반대로 이 파일이 어느 패키지 것인지 알려 줍니다. 아홉째 날 문제가 생긴 파일의 출처를 추적할 때 씁니다.` },

    { eb: 'Repository', h: '저장소를 추가한다는 것',
      sub: 'Ollama, Docker, NVIDIA 드라이버 설치가 전부 이 절차입니다.',
      body: `<div class="rowlist" style="margin-top:1.6cqh">
        <div class="row"><span class="dot">1</span><span class="t">GPG 키 등록</span><span class="d">이 저장소가 진짜인지 서명으로 확인하기 위해</span></div>
        <div class="row"><span class="dot">2</span><span class="t">저장소 주소 추가</span><span class="d">/etc/apt/sources.list.d/ 에 파일 한 줄</span></div>
        <div class="row"><span class="dot">3</span><span class="t">apt update</span><span class="d">새 저장소의 목록을 읽어 옴</span></div>
        <div class="row"><span class="dot">4</span><span class="t">apt install</span><span class="d">이제 설치 가능</span></div>
      </div>
      <div class="bannerG" style="margin-top:2cqh">설치 안내문에 낯선 명령이 줄줄이 나와도, 구조는 항상 이 네 단계입니다.</div>`,
      foot: '"curl | sudo bash" 형태의 설치 스크립트는 이 네 단계를 대신 해 주는 것입니다 — 그래서 내용을 먼저 봐야 합니다.',
      nar: `공식 저장소에 없는 프로그램은 저장소를 추가해서 설치합니다. 도커, 올라마, 엔비디아 드라이버가 전부 이 절차를 따릅니다. 네 단계입니다. 먼저 지피지 키를 등록해서 이 저장소가 진짜인지 확인할 수 있게 하고, 저장소 주소를 추가하고, 업데이트로 목록을 읽고, 인스톨합니다. 설치 안내문에 낯선 명령이 열 줄씩 나와도 구조는 항상 이 네 단계입니다. 그리고 컬을 파이프로 수도 배시에 넘기는 형태의 설치 스크립트를 자주 보실 텐데, 그건 이 네 단계를 대신해 주는 것입니다. 편하지만 남의 스크립트에 관리자 권한을 통째로 주는 것이니, 최소한 어떤 내용인지 한 번은 봐야 합니다.` },

    { eb: 'Python', h: '시스템 파이썬을 건드리면 안 되는 이유',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card warn"><span class="n">하면 안 되는 것</span><span class="t">sudo pip install</span>
          <span class="d">우분투의 시스템 도구 일부가 파이썬으로 만들어져 있습니다. 버전이 바뀌면 그것들이 깨집니다. 최근 우분투는 아예 막아 놨습니다.</span></div>
        <div class="card"><span class="n">해야 하는 것</span><span class="t">python3 -m venv</span>
          <span class="d">프로젝트마다 독립된 파이썬 환경을 만듭니다. 지워도 시스템에 영향이 없고, requirements.txt로 그대로 재현됩니다.</span></div>
      </div>
      <pre style="margin-top:2cqh"><span class="p">$ python3 -m venv ~/ai-lab/envs/llm</span>
<span class="p">$ source ~/ai-lab/envs/llm/bin/activate</span>
<span class="p">(llm) $ pip install requests</span>
<span class="p">(llm) $ pip freeze &gt; requirements.txt</span>
<span class="p">(llm) $ deactivate</span></pre>`,
      foot: '프롬프트 앞에 (llm)이 붙습니다 — 지금 어느 환경에 있는지 알려주는 표시입니다.',
      nar: `여기가 오늘 오전의 핵심입니다. 수도 핍 인스톨은 절대 하지 마십시오. 우분투의 시스템 도구 중 일부가 파이썬으로 만들어져 있어서, 패키지 버전이 바뀌면 그것들이 깨집니다. 최근 우분투는 아예 막아 놨습니다. 대신 브이이엔브이로 프로젝트마다 독립된 환경을 만듭니다. 활성화하면 프롬프트 앞에 환경 이름이 붙어서 지금 어디 있는지 보입니다. 핍 프리즈로 설치된 것들을 목록으로 뽑아 두면, 다른 컴퓨터에서 그대로 재현할 수 있습니다. 이게 재현 가능한 환경의 출발점입니다.` },

    { section: true, eb: 'Block 2 · 11:10–12:00', h: '환경변수와 PATH',
      sub: '"command not found"의 절반은 여기서 설명됩니다.',
      nar: `두 번째 블록입니다. 커맨드 낫 파운드라는 오류를 여러 번 보셨을 텐데요, 그 절반은 패스라는 환경변수로 설명됩니다.` },

    { eb: 'PATH', h: '셸이 명령을 찾는 순서',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ echo $PATH</span>
<span class="c">/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin</span>
<span class="c">        └ 앞에서부터 차례로 뒤져서, 처음 찾은 것을 실행합니다</span>

<span class="p">$ which python3</span>          <span class="c"># 실제로 실행되는 것은 어느 파일인가</span>
<span class="p">$ type -a python3</span>         <span class="c"># 후보를 전부 보기</span>
<span class="p">$ command -v jq || echo "없음"</span></pre>
      <div class="bannerG" style="margin-top:2cqh">venv를 활성화하면 PATH 맨 앞에 그 환경의 bin이 끼어듭니다 — 그게 전부입니다.</div>`,
      nar: `패스는 콜론으로 이어진 디렉터리 목록입니다. 명령을 치면 셸이 이 목록을 앞에서부터 뒤져서 처음 찾은 것을 실행합니다. 위치는 후이치로 확인할 수 있고, 타입 대시 에이를 쓰면 후보를 전부 보여 줍니다. 여기서 앞서 배운 브이이엔브이의 정체가 드러납니다. 가상환경을 활성화한다는 것은 사실 패스 맨 앞에 그 환경의 빈 디렉터리를 끼워 넣는 것일 뿐입니다. 마법이 아니라 환경변수 조작입니다.` },

    { eb: 'Shell init', h: 'source 와 실행은 다르다',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">./script.sh</span><span class="t">실행</span><span class="d">새 셸(자식 프로세스)이 떠서 처리합니다. 거기서 바꾼 환경변수는 <strong>돌아오면 사라집니다.</strong></span></div>
        <div class="card"><span class="n">source script.sh</span><span class="t">현재 셸에서 읽기</span><span class="d">지금 이 셸에 그대로 반영됩니다. 그래서 venv 활성화는 반드시 source 입니다.</span></div>
      </div>
      <pre style="margin-top:2cqh"><span class="c"># 로그인할 때 읽히는 순서 (대략)</span>
<span class="c">~/.profile  →  ~/.bashrc     (로그인 셸)
~/.bashrc                     (새 터미널 창)</span>

<span class="p">$ echo 'export OLLAMA_HOST=127.0.0.1:11434' &gt;&gt; ~/.bashrc</span>
<span class="p">$ source ~/.bashrc</span>       <span class="c"># 지금 창에 즉시 반영</span></pre>`,
      foot: '"설정했는데 왜 안 먹지?" — 대개 source를 안 했거나, 새 창을 안 열었기 때문입니다.',
      nar: `여기서 아주 중요한 구분이 나옵니다. 스크립트를 그냥 실행하면 새 셸이 떠서 처리하고 끝납니다. 그 안에서 환경변수를 바꿔도 원래 셸로 돌아오면 사라집니다. 반면 소스 명령으로 읽으면 지금 이 셸에 그대로 반영됩니다. 그래서 가상환경 활성화는 반드시 소스로 해야 합니다. 설정 파일에 넣은 환경변수가 왜 안 먹느냐는 질문의 대부분은 소스를 안 했거나 새 창을 안 열었기 때문입니다.` },

    { section: true, eb: 'Block 3 · 13:00–15:00', h: 'SSH · rsync · tmux',
      sub: '원격 작업의 3종 세트입니다. 셋 다 오늘 확실히 익힙니다.',
      nar: `세 번째 블록입니다. 원격 서버를 다루는 세 가지 도구를 배웁니다. 접속하는 에스에스에이치, 파일을 옮기는 알싱크, 그리고 세션을 유지하는 티먹스입니다.` },

    { eb: 'SSH', h: '키로 접속하기 — 비밀번호를 없애는 것이 목적이 아닙니다',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ ssh-keygen -t ed25519 -C "ubuntu@poly"</span>
<span class="c">  → ~/.ssh/id_ed25519      개인키 (절대 남에게 주지 않음, 600)
    ~/.ssh/id_ed25519.pub  공개키 (서버에 올리는 것)</span>

<span class="p">$ ssh-copy-id ubuntu@192.168.56.101</span>
<span class="p">$ ssh ubuntu@192.168.56.101</span>          <span class="c"># 이제 비밀번호를 안 묻습니다</span></pre>
      <div class="banner" style="margin-top:2cqh">개인키가 유출되면 그 서버는 열린 것과 같습니다. 권한은 반드시 600, 절대 복사해서 보내지 않습니다.</div>`,
      foot: '비밀번호는 무차별 대입으로 뚫리지만 키는 사실상 불가능합니다 — 보안이 진짜 목적입니다.',
      nar: `에스에스에이치 키는 두 개가 한 쌍입니다. 개인키는 내 컴퓨터에만 두고 절대 남에게 주지 않습니다. 공개키는 서버에 올립니다. 에스에스에이치 카피 아이디 명령이 그 작업을 대신해 줍니다. 여기서 오해를 하나 풀고 가겠습니다. 키를 쓰는 이유는 비밀번호 치기 귀찮아서가 아닙니다. 비밀번호는 무차별 대입 공격으로 뚫릴 수 있지만 키는 사실상 불가능합니다. 보안이 진짜 목적입니다. 그래서 개인키가 유출되면 그 서버는 열린 것과 같고, 권한은 반드시 육공공이어야 합니다.` },

    { eb: 'ssh config', h: '~/.ssh/config — 긴 주소를 이름으로',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># ~/.ssh/config</span>
Host gpu
    HostName 192.168.56.101
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/id_ed25519

<span class="p">$ ssh gpu</span>            <span class="c"># 이제 이렇게만 치면 됩니다</span>
<span class="p">$ scp file.txt gpu:~/</span>
<span class="p">$ rsync -avz data/ gpu:~/data/</span></pre>`,
      foot: 'scp와 rsync도 이 별칭을 그대로 씁니다 — 한 번 설정하면 세 도구가 편해집니다.',
      nar: `매번 아이피 주소와 사용자 이름을 치는 것은 번거롭습니다. 에스에스에이치 설정 파일에 별칭을 적어 두면 짧은 이름으로 접속할 수 있습니다. 좋은 점은 이 별칭을 에스씨피와 알싱크도 그대로 쓴다는 것입니다. 한 번 설정하면 세 도구가 다 편해집니다.` },

    { eb: 'rsync', h: 'rsync — 큰 파일을 안전하게',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ scp model.bin gpu:~/models/</span>       <span class="c"># 단순 복사, 끊기면 처음부터</span>

<span class="p">$ rsync -avz --progress --partial model.bin gpu:~/models/</span>
<span class="c">  -a 속성 유지  -v 자세히  -z 압축 전송
  --progress 진행률   --partial 끊겨도 이어받기</span>

<span class="p">$ rsync -avz --delete data/ gpu:~/data/</span>   <span class="c"># 완전 동기화 (위험)</span></pre>
      <div class="banner" style="margin-top:2cqh">경로 끝의 <code>/</code> 하나로 결과가 달라집니다. <code>--delete</code>는 목적지에만 있는 파일을 지웁니다.</div>`,
      foot: '수 GB 모델 파일에는 scp가 아니라 rsync를 씁니다 — 끊겨도 이어받기 때문입니다.',
      nar: `에스씨피는 단순 복사라서 전송이 끊기면 처음부터 다시 해야 합니다. 수 기가바이트짜리 모델 파일에서는 치명적입니다. 알싱크는 바뀐 부분만 보내고, 파셜 옵션을 주면 끊겨도 이어받습니다. 주의할 것이 두 가지입니다. 경로 끝에 슬래시가 있느냐 없느냐에 따라 결과가 달라집니다. 그리고 딜리트 옵션은 보내는 쪽에 없는 파일을 받는 쪽에서 지워 버립니다. 강력하지만 위험하니 처음에는 대시 대시 드라이 런으로 먼저 확인하십시오.` },

    { eb: 'tmux', h: 'tmux — 접속이 끊겨도 작업은 살아 있다',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ tmux new -s train</span>        <span class="c"># 세션 만들기</span>
<span class="c">  Ctrl+b  d     떼어내기(detach) — 작업은 계속 돕니다
  Ctrl+b  c     새 창
  Ctrl+b  %     세로 분할     Ctrl+b " 가로 분할
  Ctrl+b  방향키  창 이동</span>

<span class="p">$ tmux ls</span>                   <span class="c"># 세션 목록</span>
<span class="p">$ tmux attach -t train</span>      <span class="c"># 다시 붙기</span></pre>
      <div class="bannerG" style="margin-top:2cqh">어제 배운 nohup은 임시방편, tmux가 정식 해법입니다. 화면을 그대로 되찾을 수 있습니다.</div>`,
      nar: `티먹스는 서버 안에서 도는 가상 터미널입니다. 세션을 만들어 작업을 시작하고 컨트롤 비 디로 떼어냅니다. 그러면 접속을 끊어도, 노트북을 닫아도, 와이파이가 끊겨도 작업은 서버에서 계속 돕니다. 나중에 다시 접속해서 어태치하면 떠났던 화면이 그대로 되돌아옵니다. 어제 배운 노헙은 임시방편이었고 이게 정식 해법입니다. 명령 하나만 기억하십시오. 컨트롤 비 디. 이것만 알면 나머지는 필요할 때 찾으면 됩니다.` },

    { section: true, eb: 'Block 4 · AI LAB · 15:10–17:10', h: '원격에 환경 옮기기',
      sub: 'VM을 원격 서버로 삼아 전 과정을 한 번에 통과합니다.',
      nar: `마지막 블록입니다. 가상머신을 원격 서버로 삼아서 오늘 배운 것을 한 번에 꿰어 봅니다. 키를 만들고, 접속하고, 티먹스 안에서 환경을 구성하고, 큰 파일을 보내다가 일부러 끊고 이어받습니다.` },

    { eb: 'AI LAB', h: '오늘의 코스',
      body: `<div class="rowlist" style="margin-top:1.6cqh">
        <div class="row"><span class="dot">1</span><span class="t">VM의 IP 확인 · SSH 접속</span><span class="d">ip a 로 주소 찾기</span></div>
        <div class="row"><span class="dot">2</span><span class="t">키 만들고 비밀번호 없애기</span><span class="d">ssh-keygen → ssh-copy-id</span></div>
        <div class="row"><span class="dot">3</span><span class="t">~/.ssh/config 로 별칭 만들기</span><span class="d">ssh gpu 한 줄로</span></div>
        <div class="row"><span class="dot">4</span><span class="t">tmux 세션에서 venv 구성</span><span class="d">requirements.txt 고정</span></div>
        <div class="row"><span class="dot">5</span><span class="t">500MB 파일 전송 · 중단 · 재개</span><span class="d">rsync --partial 의 위력 확인</span></div>
      </div>`,
      foot: '5번에서 전송 중에 일부러 Ctrl+C를 누릅니다 — 다시 실행하면 이어받는 것을 눈으로 확인합니다.',
      nar: `다섯 단계입니다. 가상머신의 아이피를 찾아 접속하고, 키를 만들어 비밀번호를 없애고, 설정 파일에 별칭을 만들고, 티먹스 안에서 파이썬 환경을 구성하고, 마지막으로 오백 메가바이트짜리 파일을 전송합니다. 다섯 번째가 중요합니다. 전송 중에 일부러 컨트롤 씨로 끊었다가 다시 실행해서, 처음부터가 아니라 중간부터 이어받는 것을 눈으로 확인하십시오. 이 경험이 있어야 나중에 진짜 큰 파일을 옮길 때 알싱크를 쓰게 됩니다.` }
  ],

  assignment: {
    title: '재현 가능한 원격 환경 구축서',
    lede: '내 PC에서 만든 환경을 VM에 그대로 재현하고, 그 과정을 남이 따라 할 수 있게 기록하십시오.',
    items: [
      '~/.ssh/config 설정 내용',
      '키 인증이 동작하는 증빙 (비밀번호 없이 접속)',
      'venv 구성과 requirements.txt',
      'VM에서 같은 환경 재현 기록',
      'rsync 중단·재개 로그',
      'tmux 세션에서 작업이 유지된 증빙'
    ],
    note: '가장 중요한 항목은 <strong>4번</strong>입니다. requirements.txt 하나로 VM에서 같은 환경이 살아났는지, 살아나지 않았다면 무엇이 빠졌는지 적으십시오.',
    sample: `<span class="o">5. rsync 중단·재개
   명령 : rsync -avz --progress --partial big.bin gpu:~/
   중단 : 42% 지점에서 Ctrl+C
   재개 : 같은 명령 재실행 → 43%부터 이어짐 (로그 첨부)</span>`,
    nar: `과제입니다. 내 컴퓨터에서 만든 파이썬 환경을 가상머신에 그대로 재현하고, 그 과정을 남이 따라 할 수 있게 기록하십시오. 여기서 가장 중요한 항목은 네 번째입니다. 리콰이어먼츠 파일 하나로 같은 환경이 살아났는지, 살아나지 않았다면 무엇이 빠졌는지를 적어 주십시오. 빠진 것을 찾아내는 것이 이 과제의 진짜 목적입니다.` },

  wrap: {
    done: '패키지·환경변수·SSH·rsync·tmux — 원격 작업의 기본기를 갖췄습니다.',
    next: '내일 · Day 6 — 셸 스크립팅과 자동화',
    nextDesc: '오늘까지 손으로 치던 것을 스크립트로 묶습니다. 실험을 수백 번 자동으로 돌리게 됩니다.',
    nar: `오늘 한 일을 정리하겠습니다. 패키지 관리자의 구조를 이해했고, 파이썬 환경을 격리하는 법을 배웠고, 패스와 소스의 차이를 알게 됐습니다. 그리고 키 인증과 알싱크와 티먹스로 원격 작업의 기본기를 갖췄습니다. 내일은 자동화입니다. 지금까지 손으로 치던 명령들을 스크립트로 묶어서, 실험을 수백 번 자동으로 돌리게 만듭니다. 수고하셨습니다.` },

  lab: {
    h1: '패키지 · 환경 · 원격 접속',
    standfirst: '오늘은 WSL2(내 작업대)와 VM(원격 서버) 두 곳을 오갑니다. <strong>지금 어느 쪽에서 치고 있는지</strong> 항상 프롬프트로 확인하세요. 실습 사고의 절반이 여기서 납니다.',
    rules: [
      ['프롬프트를 본다', 'ubuntu@DESKTOP인지 ubuntu@ubuntu-server인지 매번 확인하세요.'],
      ['sudo pip는 금지', '시스템 파이썬을 오염시킵니다. 항상 venv 안에서 pip를 씁니다.'],
      ['개인키는 복사하지 않는다', '~/.ssh/id_ed25519는 이 컴퓨터를 떠나면 안 됩니다. 올리는 건 .pub 쪽입니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '패키지와 파이썬 환경', time: '13:00–13:50',
        missions: [
          { n: 1, h: 'apt 다루기', body: `
      <pre><span class="p">$</span> sudo apt update
<span class="p">$</span> apt search "^jq$"
<span class="p">$</span> apt show jq | head -15
<span class="p">$</span> sudo apt install -y jq tree htop
<span class="p">$</span> dpkg -L jq | head
<span class="p">$</span> dpkg -S /usr/bin/jq
<span class="p">$</span> apt list --installed 2&gt;/dev/null | wc -l</pre>
      <div class="box q"><span class="lbl">확인 질문</span><p><code>apt update</code>와 <code>apt upgrade</code>는 각각 무엇을 하나요? 하나는 왜 설치가 아닌가요?</p></div>` },
          { n: 2, h: '시스템 파이썬 건드려 보기 (막히는 것 확인)', body: `
      <pre><span class="p">$</span> which python3
<span class="p">$</span> python3 --version
<span class="p">$</span> pip install requests</pre>
      <p>최근 우분투에서는 아래처럼 막힐 것입니다.</p>
      <pre><span class="o">error: externally-managed-environment
× This environment is externally managed</span></pre>
      <div class="box check"><span class="lbl">막히는 게 정상입니다</span>
        <p>시스템 파이썬을 보호하기 위한 장치입니다. 우회하지 말고 다음 미션의 venv로 갑니다. <code>--break-system-packages</code>라는 옵션이 있지만 <strong>이 과정에서는 쓰지 않습니다.</strong></p></div>` },
          { n: 3, h: 'venv로 격리 환경 만들기', body: `
      <pre><span class="p">$</span> sudo apt install -y python3-venv
<span class="p">$</span> python3 -m venv ~/ai-lab/envs/llm
<span class="p">$</span> source ~/ai-lab/envs/llm/bin/activate
<span class="o">(llm) ubuntu@DESKTOP:~$</span>            <span class="c">← 프롬프트가 바뀝니다</span>

<span class="p">(llm) $</span> which python3
<span class="p">(llm) $</span> pip install requests
<span class="p">(llm) $</span> pip freeze &gt; ~/ai-lab/envs/requirements.txt
<span class="p">(llm) $</span> cat ~/ai-lab/envs/requirements.txt
<span class="p">(llm) $</span> deactivate
<span class="p">$</span> which python3                     <span class="c">← 원래대로 돌아왔습니다</span></pre>
      <div class="box check"><span class="lbl">활성화의 정체</span>
        <p>활성화 전후로 <code>echo $PATH</code>를 쳐서 비교해 보세요. venv의 <code>bin</code>이 맨 앞에 끼어든 것이 전부입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '환경변수와 PATH', time: '13:50–14:30',
        missions: [
          { n: 4, h: '명령을 찾는 순서 추적', body: `
      <pre><span class="p">$</span> echo $PATH
<span class="p">$</span> echo $PATH | tr ':' '\\n'          <span class="c"># 한 줄씩 보기</span>
<span class="p">$</span> which python3 jq tree
<span class="p">$</span> type -a python3
<span class="p">$</span> command -v docker || echo "아직 없음"</pre>
      <div class="box q"><span class="lbl">확인 질문</span><p>같은 이름의 명령이 PATH의 두 곳에 있다면 어느 쪽이 실행될까요? <code>type -a</code>로 확인해 보세요.</p></div>` },
          { n: 5, h: 'source 와 실행의 차이 (직접 확인)', body: `
      <pre><span class="p">$</span> cd ~/ai-lab/scripts
<span class="p">$</span> cat &gt; envtest.sh &lt;&lt;'EOF'
export MY_TEST=hello
echo "스크립트 안: $MY_TEST"
EOF
<span class="p">$</span> chmod +x envtest.sh

<span class="p">$</span> ./envtest.sh
<span class="o">스크립트 안: hello</span>
<span class="p">$</span> echo "밖에서: $MY_TEST"
<span class="o">밖에서: </span>                          <span class="c">← 비어 있습니다!</span>

<span class="p">$</span> source ./envtest.sh
<span class="p">$</span> echo "밖에서: $MY_TEST"
<span class="o">밖에서: hello</span>                     <span class="c">← 남아 있습니다</span></pre>
      <div class="box check"><span class="lbl">오늘 가장 중요한 구분</span>
        <p>실행은 자식 셸에서, source는 현재 셸에서. venv 활성화가 반드시 <code>source</code>여야 하는 이유입니다.</p></div>` },
          { n: 6, h: '.bashrc에 설정 남기기', body: `
      <pre><span class="p">$</span> echo '' &gt;&gt; ~/.bashrc
<span class="p">$</span> echo '# --- linux70 과정 설정 ---' &gt;&gt; ~/.bashrc
<span class="p">$</span> echo 'export AI_LAB=$HOME/ai-lab' &gt;&gt; ~/.bashrc
<span class="p">$</span> echo 'alias lab="cd $HOME/ai-lab"' &gt;&gt; ~/.bashrc
<span class="p">$</span> tail -5 ~/.bashrc

<span class="p">$</span> echo $AI_LAB                     <span class="c">← 아직 비어 있습니다</span>
<span class="p">$</span> source ~/.bashrc
<span class="p">$</span> echo $AI_LAB
<span class="p">$</span> lab &amp;&amp; pwd</pre>
      <div class="box warn"><span class="lbl">주의</span>
        <p><code>.bashrc</code>를 잘못 고치면 새 터미널이 안 열릴 수 있습니다. 항상 <code>&gt;&gt;</code>(추가)를 쓰고 <code>&gt;</code>(덮어쓰기)는 쓰지 마세요.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: 'SSH 키 인증', time: '14:30–15:30',
        lede: 'VM을 켜 두고 시작하세요. VM 쪽에서 먼저 IP를 확인합니다.',
        missions: [
          { n: 7, h: 'VM 주소 확인하고 접속', body: `
      <p><strong>VM 창에서:</strong></p>
      <pre><span class="p">$</span> ip a | grep "inet "
<span class="p">$</span> hostname -I
<span class="p">$</span> systemctl status ssh --no-pager | head -3</pre>
      <p><strong>WSL2에서:</strong></p>
      <pre><span class="p">$</span> ssh ubuntu@&lt;VM의 IP&gt;
<span class="o">The authenticity of host ... can't be established.
ED25519 key fingerprint is SHA256:...
Are you sure you want to continue connecting? yes</span>
<span class="o">ubuntu@&lt;IP&gt;'s password:</span></pre>
      <div class="box warn"><span class="lbl">접속이 안 되면</span>
        <ul>
          <li>VM 네트워크가 <strong>브리지 어댑터</strong>인지 확인 (NAT면 포트포워딩 필요)</li>
          <li>Day 1에서 OpenSSH를 체크했나요? 안 했다면 VM에서 <code>sudo apt install -y openssh-server</code></li>
        </ul></div>` },
          { n: 8, h: '키 만들고 비밀번호 없애기', body: `
      <pre><span class="p">$</span> ssh-keygen -t ed25519 -C "ubuntu@poly"
<span class="c"># 저장 위치는 Enter(기본값), 암호구문은 지금은 비워도 됩니다</span>

<span class="p">$</span> ls -l ~/.ssh/
<span class="o">-rw------- 1 ubuntu ubuntu  411 ... id_ed25519       ← 600, 개인키
-rw-r--r-- 1 ubuntu ubuntu   98 ... id_ed25519.pub   ← 공개키</span>

<span class="p">$</span> ssh-copy-id ubuntu@&lt;VM의 IP&gt;
<span class="p">$</span> ssh ubuntu@&lt;VM의 IP&gt;              <span class="c">← 비밀번호를 안 묻습니다</span>
<span class="p">$</span> exit</pre>
      <div class="box warn"><span class="lbl">개인키는 이 컴퓨터를 떠나지 않습니다</span>
        <p>서버에 올라간 것은 <code>.pub</code> 쪽입니다. VM에서 <code>cat ~/.ssh/authorized_keys</code>로 무엇이 올라갔는지 직접 확인해 보세요.</p></div>` },
          { n: 9, h: 'config로 별칭 만들기', body: `
      <pre><span class="p">$</span> cat &gt;&gt; ~/.ssh/config &lt;&lt;'EOF'

Host gpu
    HostName 192.168.56.101
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519
EOF
<span class="p">$</span> chmod 600 ~/.ssh/config
<span class="p">$</span> ssh gpu
<span class="p">$</span> exit</pre>
      <div class="box check"><span class="lbl">HostName은 본인 VM의 IP로 바꾸세요</span>
        <p>이 별칭은 <code>scp gpu:~/</code>, <code>rsync ... gpu:~/</code>에서도 그대로 씁니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 4', h: 'AI LAB · rsync와 tmux', time: '15:40–17:10',
        missions: [
          { n: 10, h: 'tmux 안에서 원격 환경 구성', body: `
      <pre><span class="p">$</span> ssh gpu
<span class="p">$</span> sudo apt install -y tmux python3-venv
<span class="p">$</span> tmux new -s setup

<span class="c"># tmux 안에서</span>
<span class="p">$</span> mkdir -p ~/ai-lab/envs
<span class="p">$</span> python3 -m venv ~/ai-lab/envs/llm
<span class="p">$</span> source ~/ai-lab/envs/llm/bin/activate
<span class="p">(llm) $</span> pip install requests

<span class="c"># Ctrl+b 그다음 d 를 눌러 떼어냅니다</span>
<span class="p">$</span> tmux ls
<span class="p">$</span> exit                              <span class="c"># SSH 접속을 끊습니다</span>

<span class="p">$</span> ssh gpu
<span class="p">$</span> tmux attach -t setup              <span class="c">← 화면이 그대로 돌아옵니다</span></pre>
      <div class="box check"><span class="lbl">이것이 tmux의 전부입니다</span>
        <p><kbd>Ctrl</kbd>+<kbd>b</kbd> → <kbd>d</kbd>로 떼고, <code>tmux attach</code>로 돌아온다. 나머지 단축키는 필요할 때 찾으면 됩니다.</p></div>` },
          { n: 11, h: 'requirements.txt로 환경 재현', body: `
      <pre><span class="c"># WSL2에서 VM으로 목록을 보냅니다</span>
<span class="p">$</span> scp ~/ai-lab/envs/requirements.txt gpu:~/ai-lab/envs/

<span class="c"># VM(tmux 세션 안)에서</span>
<span class="p">(llm) $</span> pip install -r ~/ai-lab/envs/requirements.txt
<span class="p">(llm) $</span> pip freeze | diff - ~/ai-lab/envs/requirements.txt &amp;&amp; echo "동일합니다"</pre>
      <div class="box q"><span class="lbl">확인 질문</span><p><code>diff</code>에서 차이가 나왔다면 무엇이 다른가요? 파이썬 버전이 다르면 어떤 일이 생길까요?</p></div>` },
          { n: 12, h: '500MB 전송 · 중단 · 재개', body: `
      <pre><span class="p">$</span> mkdir -p ~/ai-lab/models
<span class="p">$</span> head -c 500M /dev/urandom &gt; ~/ai-lab/models/fake_model.bin
<span class="p">$</span> ls -lh ~/ai-lab/models/fake_model.bin

<span class="c"># scp — 끊기면 처음부터</span>
<span class="p">$</span> scp ~/ai-lab/models/fake_model.bin gpu:~/    <span class="c"># 중간에 Ctrl+C</span>
<span class="p">$</span> ssh gpu "ls -lh ~/fake_model.bin"

<span class="c"># rsync — 이어받기</span>
<span class="p">$</span> rsync -avz --progress --partial \\
    ~/ai-lab/models/fake_model.bin gpu:~/models/   <span class="c"># 40%쯤에서 Ctrl+C</span>
<span class="p">$</span> ssh gpu "ls -lh ~/models/"
<span class="p">$</span> rsync -avz --progress --partial \\
    ~/ai-lab/models/fake_model.bin gpu:~/models/   <span class="c">← 중간부터 이어집니다</span></pre>
      <div class="box check"><span class="lbl">눈으로 확인할 것</span>
        <p>두 번째 rsync의 진행률이 0%가 아니라 중단 지점부터 시작하는지 보세요. 수십 GB 모델을 옮길 때 이 차이가 하루를 좌우합니다.</p></div>` },
          { n: 13, h: '--dry-run 으로 안전하게 확인', body: `
      <pre><span class="p">$</span> rsync -avz --delete --dry-run ~/ai-lab/ gpu:~/ai-lab/ | head -20</pre>
      <div class="box warn"><span class="lbl">--delete 를 쓰기 전에는 항상</span>
        <p><code>--dry-run</code>은 실제로 하지 않고 <strong>무엇을 할지만</strong> 보여줍니다. <code>deleting</code>으로 시작하는 줄이 있다면 그 파일들이 사라집니다. 반드시 확인하고 실행하세요.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>externally-managed-environment</code>', '시스템 파이썬 보호', '우회하지 말고 venv를 씁니다'],
      ['<code>Connection refused</code> (ssh)', 'SSH 서버 미설치/중지', 'VM에서 <code>sudo apt install -y openssh-server</code>'],
      ['<code>No route to host</code>', '네트워크 어댑터 설정', 'VM 네트워크를 브리지 어댑터로 변경'],
      ['키를 등록했는데 비밀번호를 묻는다', '권한 문제', '<code>chmod 700 ~/.ssh; chmod 600 ~/.ssh/*</code>'],
      ['새 터미널이 안 열린다', '<code>.bashrc</code> 오타', 'VM 콘솔에서 직접 <code>vim ~/.bashrc</code>로 수정'],
      ['환경변수가 안 먹는다', 'source 안 함', '<code>source ~/.bashrc</code> 또는 새 창을 엽니다']
    ],
    checklist: [
      '<code>apt update</code>와 <code>install</code>의 차이를 설명할 수 있다',
      '<code>sudo pip install</code>이 왜 막히는지 직접 확인했다',
      'venv를 만들고 활성화 전후 <code>PATH</code>를 비교했다',
      '<code>requirements.txt</code>를 만들었다',
      'source와 실행의 차이를 스크립트로 확인했다',
      'SSH 키를 만들고 비밀번호 없이 접속했다',
      '<code>~/.ssh/config</code>로 별칭 접속이 된다',
      'tmux에서 detach 후 attach로 화면을 되찾았다',
      'rsync 중단 후 재개가 이어지는 것을 눈으로 확인했다',
      '<code>--dry-run</code>으로 <code>--delete</code>의 영향을 미리 봤다'
    ]
  },

  quizTitle: '패키지와 원격 접속 퀴즈',
  quiz: [
    { q: '<code>sudo apt update</code>가 하는 일은?', o: ['설치 가능한 패키지 목록을 갱신한다', '설치된 패키지를 최신으로 올린다', '새 패키지를 설치한다', '캐시를 지운다'], a: 0,
      e: '업그레이드는 <code>apt upgrade</code>입니다. update는 "목록만" 갱신합니다.' },
    { q: '<code>/usr/bin/jq</code>가 어느 패키지에서 왔는지 확인하는 명령은?', o: ['dpkg -S /usr/bin/jq', 'dpkg -L jq', 'apt show jq', 'which jq'], a: 0,
      e: '<code>-S</code>는 search(파일→패키지), <code>-L</code>은 list(패키지→파일)입니다.' },
    { q: '외부 저장소를 추가해 설치할 때의 표준 절차는?', o: ['GPG 키 등록 → 저장소 추가 → apt update → apt install', 'apt install → GPG 키 등록', '저장소 추가 → apt install', 'GPG 키만 등록하면 된다'], a: 0,
      e: 'Docker, Ollama, NVIDIA 드라이버 설치가 전부 이 네 단계입니다.' },
    { q: '<code>sudo pip install</code>을 하면 안 되는 이유는?', o: ['시스템 도구가 쓰는 파이썬 패키지를 망가뜨릴 수 있다', '느려서', '권한 오류가 나서', '인터넷을 많이 써서'], a: 0,
      e: '우분투의 여러 시스템 도구가 파이썬으로 만들어져 있습니다. 최근 버전은 아예 막아 놨습니다.' },
    { q: '격리된 파이썬 환경을 만드는 명령은? (직접 입력)', t: true, acc: ['python3 -m venv', 'python -m venv'], ans: 'python3 -m venv',
      e: '뒤에 경로를 붙입니다. <code>python3 -m venv ~/ai-lab/envs/llm</code>' },
    { q: 'venv를 활성화하면 실제로 무슨 일이 일어나나요?', o: ['PATH 맨 앞에 그 환경의 bin이 추가된다', '새 파이썬이 설치된다', '시스템 파이썬이 교체된다', '가상머신이 뜬다'], a: 0,
      e: '마법이 아니라 환경변수 조작입니다. 활성화 전후로 <code>echo $PATH</code>를 비교하면 보입니다.' },
    { q: '설치된 패키지 목록을 파일로 고정하는 명령은?', o: ['pip freeze > requirements.txt', 'pip list > requirements.txt', 'pip save', 'pip export'], a: 0,
      e: '<code>freeze</code>는 버전까지 고정된 형식으로 출력합니다. <code>list</code>는 사람이 보기 좋은 표 형식이라 재현용으로 부적합합니다.' },
    { q: '<code>PATH</code>에 같은 이름의 명령이 두 곳에 있으면?', o: ['앞쪽 디렉터리의 것이 실행된다', '나중에 설치한 것이 실행된다', '오류가 난다', '둘 다 실행된다'], a: 0,
      e: '앞에서부터 찾아 처음 만난 것을 씁니다. <code>type -a 명령</code>으로 후보를 전부 볼 수 있습니다.' },
    { q: '<code>./script.sh</code>와 <code>source script.sh</code>의 차이는?', o: ['앞은 자식 셸에서, 뒤는 현재 셸에서 실행된다', '앞이 더 빠르다', '뒤는 권한이 필요하다', '차이가 없다'], a: 0,
      e: '그래서 venv 활성화는 반드시 source여야 합니다. 실행하면 환경 변경이 사라집니다.' },
    { q: 'SSH 키 쌍에서 <strong>서버에 올리는</strong> 것은?', o: ['공개키 (.pub)', '개인키', '둘 다', '비밀번호'], a: 0,
      e: '개인키는 내 컴퓨터를 떠나면 안 됩니다. 유출되면 그 서버는 열린 것과 같습니다.' },
    { q: '공개키를 서버에 자동으로 등록해 주는 명령은? (직접 입력)', t: true, acc: ['ssh-copy-id'], ans: 'ssh-copy-id',
      e: '서버의 <code>~/.ssh/authorized_keys</code>에 추가해 줍니다. 수동으로 붙여넣어도 결과는 같습니다.' },
    { q: '키를 등록했는데도 비밀번호를 묻는다면 가장 먼저 볼 것은?', o: ['~/.ssh 와 키 파일의 권한', '네트워크 속도', '서버 시간', 'PATH 설정'], a: 0,
      e: 'SSH는 권한이 헐거우면 키를 무시합니다. <code>~/.ssh</code>는 700, 키 파일은 600이어야 합니다.' },
    { q: '수 GB 모델 파일 전송에 <code>scp</code>보다 <code>rsync</code>가 나은 이유는?', o: ['끊겨도 이어받을 수 있다', '더 안전하다', '압축을 안 한다', '비밀번호가 필요 없다'], a: 0,
      e: '<code>--partial</code> 옵션이 핵심입니다. 40%에서 끊겨도 41%부터 이어갑니다.' },
    { q: '<code>rsync --delete</code>를 쓰기 전에 반드시 할 일은?', o: ['--dry-run으로 무엇이 지워질지 확인', 'sudo를 붙인다', '압축을 끈다', '백업 없이 바로 실행'], a: 0,
      e: '보내는 쪽에 없는 파일을 받는 쪽에서 지웁니다. <code>deleting</code> 줄이 있는지 먼저 봐야 합니다.' },
    { q: 'tmux에서 세션을 떼어내는(detach) 키는?', o: ['Ctrl+b 그다음 d', 'Ctrl+d', 'Ctrl+b 그다음 x', 'Esc 그다음 q'], a: 0,
      e: 'tmux의 모든 단축키는 <kbd>Ctrl</kbd>+<kbd>b</kbd>를 먼저 누르고 시작합니다. 이 하나만 알면 됩니다.' },
    { q: 'SSH 접속이 끊겼을 때 tmux 세션 안의 작업은?', o: ['서버에서 계속 돈다', '함께 종료된다', '일시정지된다', '처음부터 다시 시작된다'], a: 0,
      e: 'Day 4의 <code>nohup</code>은 임시방편, tmux는 정식 해법입니다. 화면까지 그대로 되찾을 수 있습니다.' },
    { q: 'VM에 SSH 접속이 <code>Connection refused</code>로 실패할 때 가장 흔한 원인은?', o: ['OpenSSH 서버가 설치·실행되지 않았다', '비밀번호가 틀렸다', '키가 없다', '방화벽이 항상 원인이다'], a: 0,
      e: 'Day 1 설치 때 OpenSSH 체크를 놓친 경우입니다. <code>sudo apt install -y openssh-server</code>로 해결됩니다.' },
    { q: '<code>~/.ssh/config</code>에 별칭을 만들면 함께 편해지는 도구는?', o: ['scp와 rsync', 'ping과 curl', 'apt와 pip', 'tmux와 nohup'], a: 0,
      e: '세 도구가 같은 설정을 읽습니다. 한 번 설정하면 <code>scp file gpu:~/</code>처럼 짧게 쓸 수 있습니다.' }
  ]
};
