module.exports = {
  day: 4,
  title: '사용자 · 권한 · 프로세스',
  theme: 'GPU 서버는 혼자 쓰지 않는다',

  openingNar: `넷째 날입니다. 지금까지는 파일을 읽고 다루는 이야기였다면, 오늘부터는 시스템을 다루는 이야기입니다. 리눅스는 처음부터 여러 사람이 동시에 쓰는 것을 전제로 만들어졌습니다. 그래서 권한이라는 개념이 있고, 프로세스라는 개념이 있습니다. 연구실 지피유 서버를 여럿이 나눠 쓰는 상황을 떠올리면서 들으시면 됩니다.`,

  goals: [
    ['사용자와 그룹의 구조를', '/etc/passwd 와 /etc/group 에서 읽어낼 수 있다'],
    ['rwx 권한을', '숫자와 기호 양쪽으로 읽고 바꿀 수 있다'],
    ['공유 디렉터리를', '그룹 권한으로 설계할 수 있다'],
    ['프로세스를', '조회하고 우선순위를 바꾸고 안전하게 종료할 수 있다'],
    ['장시간 작업을', '터미널을 닫아도 살아 있게 띄울 수 있다'],
    ['메모리를 폭주시키는 프로세스를', '찾아내 처리할 수 있다']
  ],
  goalsNar: `오늘의 목표는 두 덩어리입니다. 앞의 세 개는 권한입니다. 사용자와 그룹이 어떻게 구성되는지 보고, 알더블유엑스라는 권한 표기를 읽고 바꾸고, 여러 명이 함께 쓰는 디렉터리를 설계합니다. 뒤의 세 개는 프로세스입니다. 지금 무엇이 돌고 있는지 보고, 우선순위를 조정하고, 안전하게 끝내고, 터미널을 닫아도 계속 돌게 만듭니다.`,

  blocks: [
    { time: '09:00–11:00', title: '사용자와 권한', desc: '계정 · 그룹 · rwx · sudo' },
    { time: '11:10–12:00', title: '프로세스와 시그널', desc: 'PID · ps · kill · 우선순위' },
    { time: '13:00–15:00', title: '권한 실습', desc: 'VM에서 계정을 만들고 시험' },
    { time: '15:10–17:10', title: '공용 GPU 서버 시뮬레이션', desc: '백그라운드 작업 · 폭주 프로세스 처리' }
  ],
  blocksNar: `오전에는 권한과 프로세스의 개념을 봅니다. 오후 실습은 두 환경에서 나눠 합니다. 계정을 만들고 권한을 시험하는 것은 망가뜨려도 되는 가상머신에서 하고, 마지막 두 시간의 지피유 서버 시뮬레이션은 더블유에스엘에서 진행합니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–11:00', h: '사용자와 권한',
      sub: '리눅스가 처음부터 여러 사람을 전제로 만들어졌다는 사실에서 출발합니다.',
      nar: `첫 번째 블록입니다. 윈도우는 오랫동안 한 사람이 쓰는 개인용 컴퓨터를 전제로 발전했지만, 리눅스는 출발부터 여러 사람이 하나의 컴퓨터에 동시에 접속해 쓰는 것을 전제로 만들어졌습니다. 권한 개념이 이렇게 촘촘한 이유가 거기에 있습니다.` },

    { eb: 'Users', h: '계정은 파일에 적혀 있다',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ head -3 /etc/passwd</span>
<span class="c">root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
ubuntu:x:1000:1000::/home/ubuntu:/bin/bash</span>
<span class="c">  │    │  │    │        │          └ 로그인 셸
  │    │  │    │        └ 홈 디렉터리
  │    │  │    └ 기본 그룹 ID
  │    │  └ 사용자 ID (UID)
  │    └ 비밀번호는 /etc/shadow 에 따로
  └ 사용자 이름</span></pre>`,
      foot: 'UID 0 = root. 1000번대가 사람이 쓰는 일반 계정입니다.',
      nar: `리눅스의 계정 정보는 이티씨 패스워드라는 텍스트 파일에 적혀 있습니다. 콜론으로 나뉜 각 칸이 사용자 이름, 유아이디, 그룹 아이디, 홈 디렉터리, 로그인 셸입니다. 여기서 중요한 숫자가 유아이디입니다. 영번은 루트, 즉 관리자입니다. 천 번대부터가 사람이 쓰는 일반 계정입니다. 비밀번호는 여기 없고 섀도라는 별도 파일에 암호화되어 들어 있는데, 그 파일은 일반 사용자가 읽을 수 없습니다. 이것 자체가 권한 설계의 예입니다.` },

    { eb: 'Permissions', h: 'rwx 아홉 글자 읽는 법',
      body: `<pre style="margin-top:1.6cqh"><span class="c">-rw-r--r--  1 ubuntu ubuntu  1024 Sep 17 09:00 note.txt
 │└┬┘└┬┘└┬┘
 │ │  │  └ others  다른 사람   r-- 읽기만
 │ │  └──── group   그룹       r-- 읽기만
 │ └─────── user    소유자     rw- 읽기·쓰기
 └ 종류</span></pre>
      <div class="grid g3" style="margin-top:2cqh">
        <div class="card"><span class="n">r = 4</span><span class="t">읽기</span><span class="d">파일 내용 보기 / 디렉터리 목록 보기</span></div>
        <div class="card"><span class="n">w = 2</span><span class="t">쓰기</span><span class="d">내용 변경 / 디렉터리에 파일 생성·삭제</span></div>
        <div class="card"><span class="n">x = 1</span><span class="t">실행</span><span class="d">프로그램 실행 / <strong>디렉터리에 들어가기</strong></span></div>
      </div>`,
      foot: '디렉터리의 x 는 "들어갈 수 있다"입니다. 이걸 놓쳐서 생기는 사고가 가장 많습니다.',
      nar: `권한은 아홉 글자입니다. 세 글자씩 끊어서 소유자, 그룹, 나머지 사람 순서입니다. 알은 읽기, 더블유는 쓰기, 엑스는 실행입니다. 숫자로는 각각 사, 이, 일입니다. 여기서 반드시 기억할 것이 하나 있습니다. 디렉터리에서 엑스는 실행이 아니라 그 안으로 들어갈 수 있다는 뜻입니다. 읽기 권한만 주고 실행 권한을 안 주면 목록은 보이는데 안으로 못 들어가는 이상한 상태가 됩니다. 실무에서 가장 흔한 권한 사고가 바로 이것입니다.` },

    { eb: 'chmod', h: '권한 바꾸기 — 숫자와 기호',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ chmod 644 note.txt</span>      <span class="c"># rw- r-- r--   일반 파일의 기본</span>
<span class="p">$ chmod 755 script.sh</span>     <span class="c"># rwx r-x r-x   실행 파일·디렉터리</span>
<span class="p">$ chmod 600 secret.env</span>    <span class="c"># rw- --- ---   나만 읽는 비밀값</span>
<span class="p">$ chmod 775 shared/</span>       <span class="c"># rwx rwx r-x   그룹이 함께 쓰는 폴더</span>

<span class="p">$ chmod +x script.sh</span>      <span class="c"># 모두에게 실행 권한 추가</span>
<span class="p">$ chmod g+w shared/</span>       <span class="c"># 그룹에만 쓰기 추가</span>
<span class="p">$ chmod o-r secret.env</span>    <span class="c"># 나머지 사람의 읽기 제거</span></pre>`,
      foot: '600, 644, 755 세 개만 외우면 실무의 대부분이 해결됩니다.',
      nar: `권한을 바꿀 때는 숫자와 기호 두 방식이 있습니다. 숫자는 세 자리인데 각각 소유자, 그룹, 나머지의 권한을 더한 값입니다. 읽기 사에 쓰기 이를 더하면 육, 거기에 실행 일을 더하면 칠입니다. 실무에서는 세 개만 외우면 됩니다. 육사사는 일반 파일, 칠오오는 실행 파일과 디렉터리, 육공공은 나만 읽는 비밀값입니다. 아홉째 날 에이피아이 키를 다룰 때 육공공이 왜 중요한지 다시 이야기합니다.` },

    { eb: 'sudo', h: 'sudo — 잠깐 관리자가 되기',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="t">sudo 가 필요한 일</span><span class="d">패키지 설치 · 서비스 기동 · /etc 수정 · 남의 파일 건드리기 · 포트 1024 미만 열기</span></div>
        <div class="card warn"><span class="t">sudo 가 필요 없는 일</span><span class="d">내 홈 안의 모든 작업 · 파이썬 가상환경 · 내가 만든 스크립트 실행<br><br>여기서 sudo가 필요하다면 <strong>무언가 잘못된 것</strong>입니다</span></div>
      </div>`,
      foot: '"안 되면 일단 sudo"는 가장 나쁜 습관입니다. 왜 안 되는지 먼저 봅니다.',
      nar: `수도는 잠깐 관리자 권한을 빌리는 명령입니다. 패키지를 설치하거나 서비스를 띄우거나 이티씨 아래를 고칠 때 필요합니다. 반대로 내 홈 디렉터리 안에서 하는 일에는 필요 없습니다. 여기서 중요한 습관을 하나 말씀드립니다. 안 되면 일단 수도를 붙여 보는 것은 가장 나쁜 습관입니다. 내 홈 안에서 권한 거부가 났다면 그건 수도로 덮을 문제가 아니라 뭔가 잘못됐다는 신호입니다. 수도로 덮으면 그 파일의 소유자가 루트로 바뀌면서 나중에 더 큰 문제가 됩니다.` },

    { section: true, eb: 'Block 2 · 11:10–12:00', h: '프로세스와 시그널',
      sub: '지금 이 컴퓨터에서 무엇이 돌고 있는가.',
      nar: `두 번째 블록은 프로세스입니다. 실행 중인 프로그램 하나하나를 프로세스라고 부릅니다. 지금 무엇이 돌고 있는지 보고, 필요하면 멈추는 방법을 배웁니다.` },

    { eb: 'ps · top', h: '무엇이 돌고 있는가',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ ps aux | head -5</span>
<span class="c">USER  PID  %CPU %MEM    VSZ   RSS TTY  STAT START TIME COMMAND
root    1   0.0  0.1 168000 11000 ?    Ss   09:00 0:01 /sbin/init</span>

<span class="p">$ ps aux | grep python</span>
<span class="p">$ ps -ef --forest | head -20</span>     <span class="c"># 부모-자식 관계를 나무로</span>
<span class="p">$ top</span>                            <span class="c"># 실시간, q 로 종료</span>
<span class="p">$ htop</span>                           <span class="c"># 더 보기 좋게 (설치 필요)</span></pre>`,
      foot: 'PID는 프로세스 번호, PPID는 부모의 번호. 모든 프로세스에는 부모가 있습니다.',
      nar: `피에스 에이유엑스가 지금 돌고 있는 모든 프로세스를 보여 줍니다. 여기서 두 개의 숫자가 중요합니다. 피아이디는 프로세스 번호이고, 시피유와 메모리 사용률이 그 옆에 나옵니다. 리눅스의 모든 프로세스에는 부모가 있습니다. 피에스 대시 이에프 포레스트를 쓰면 부모 자식 관계가 나무 모양으로 보입니다. 일번 프로세스가 모든 것의 조상인데, 일곱째 날에 배울 시스템디가 바로 그것입니다. 톱이나 에이치톱은 실시간으로 변하는 화면을 보여 줍니다. 톱에서 나갈 때는 큐입니다.` },

    { eb: 'Signals', h: '프로세스를 끝내는 두 가지 방법',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">kill PID</span><span class="t">SIGTERM (15) — 정리하고 끝내라</span><span class="d">프로세스가 마무리 작업을 하고 스스로 종료합니다. <strong>기본값이자 정답</strong>입니다.</span></div>
        <div class="card warn"><span class="n">kill -9 PID</span><span class="t">SIGKILL (9) — 즉시 강제 종료</span><span class="d">마무리할 틈을 주지 않습니다. 쓰던 파일이 깨지거나 임시 파일이 남습니다. <strong>최후의 수단</strong>입니다.</span></div>
      </div>
      <pre style="margin-top:2cqh"><span class="p">$ kill 12345</span>        <span class="c"># 먼저 이것</span>
<span class="p">$ sleep 3; ps -p 12345</span>  <span class="c"># 살아 있나 확인</span>
<span class="p">$ kill -9 12345</span>     <span class="c"># 그래도 안 죽으면</span></pre>`,
      foot: '대시 9를 먼저 쓰는 습관이 데이터 손상의 흔한 원인입니다.',
      nar: `프로세스를 끝내는 방법은 두 가지입니다. 그냥 킬을 쓰면 정리하고 끝내라는 신호를 보냅니다. 프로세스가 쓰던 파일을 저장하고 임시 파일을 지우고 스스로 종료합니다. 반면 킬 대시 구는 즉시 강제 종료입니다. 마무리할 틈을 주지 않기 때문에 쓰던 파일이 깨지거나 쓰레기가 남을 수 있습니다. 순서가 중요합니다. 먼저 그냥 킬을 보내고, 몇 초 기다렸다가 그래도 안 죽으면 그때 대시 구를 씁니다. 처음부터 대시 구를 쓰는 습관이 데이터 손상의 흔한 원인입니다.` },

    { eb: 'Background', h: '터미널을 닫아도 살아 있게',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ python train.py &amp;</span>              <span class="c"># 백그라운드로</span>
<span class="p">$ jobs</span>                            <span class="c"># 내 작업 목록</span>
<span class="p">$ fg %1</span>                           <span class="c"># 다시 앞으로</span>
<span class="p">$ Ctrl+Z</span> 후 <span class="p">bg</span>                  <span class="c"># 멈춘 것을 뒤로</span>

<span class="p">$ nohup python train.py &gt; train.log 2&gt;&amp;1 &amp;</span>
<span class="c">  └ 터미널이 닫혀도(SIGHUP) 죽지 않습니다</span>
<span class="p">$ tail -f train.log</span>                <span class="c"># 진행 상황 추적 (Ctrl+C로 중단)</span></pre>`,
      foot: 'SSH가 끊기면 작업도 죽습니다 — Day 5의 tmux가 이 문제의 정식 해법입니다.',
      nar: `명령 끝에 앰퍼샌드를 붙이면 백그라운드로 돕니다. 하지만 터미널을 닫으면 시그헙이라는 신호가 가서 작업도 함께 죽습니다. 노헙을 앞에 붙이면 그 신호를 무시하게 만들 수 있습니다. 여기에 어제 배운 리다이렉션을 함께 써서 출력을 로그 파일로 보내 두면, 나중에 테일 대시 에프로 진행 상황을 볼 수 있습니다. 이건 임시방편이고, 내일 배울 티먹스가 이 문제의 정식 해법입니다.` },

    { section: true, eb: 'Block 4 · AI LAB · 15:10–17:10', h: '공용 GPU 서버 시뮬레이션',
      sub: '연구실에서 실제로 벌어지는 세 가지 상황을 재현합니다.',
      nar: `마지막 블록입니다. 연구실 공용 서버에서 실제로 벌어지는 상황 세 가지를 재현합니다. 장시간 작업을 띄워 두고 추적하기, 메모리를 폭주시키는 프로세스를 찾아 처리하기, 그리고 여러 명이 함께 쓰는 모델 디렉터리를 설계하기입니다.` },

    { eb: 'AI LAB', h: '상황 1 — 장시간 전처리를 띄워 두고 퇴근',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ cd ~/ai-lab</span>
<span class="p">$ nohup bash -c 'for i in $(seq 1 600); do
    echo "[$(date +%T)] step $i 처리 중"; sleep 1; done' \\
    &gt; logs/preprocess.log 2&gt;&amp;1 &amp;</span>
<span class="c">[1] 48213</span>

<span class="p">$ tail -f logs/preprocess.log</span>     <span class="c"># Ctrl+C 로 보기만 중단</span>
<span class="p">$ ps -p 48213</span>                     <span class="c"># 여전히 살아 있습니다</span></pre>`,
      foot: 'tail -f 를 Ctrl+C로 끝내도 작업은 계속 돕니다 — "보기"와 "실행"은 별개입니다.',
      nar: `첫 번째 상황입니다. 열 분짜리 전처리 작업을 노헙으로 띄우고 로그를 파일로 보냅니다. 테일 대시 에프로 실시간 진행을 보다가 컨트롤 씨를 누르면 보기만 멈추고 작업은 계속 돕니다. 여기서 학생들이 자주 헷갈립니다. 보는 것과 실행하는 것은 완전히 별개라는 점을 손으로 확인하십시오.` },

    { eb: 'AI LAB', h: '상황 2 — 메모리를 먹는 프로세스 찾아내기',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># 메모리를 계속 먹는 프로세스를 일부러 띄웁니다</span>
<span class="p">$ python3 -c "
a=[]
while True:
    a.append(' '*10**7)
" &amp;</span>

<span class="p">$ ps aux --sort=-%mem | head -5</span>    <span class="c"># 메모리 많이 쓰는 순</span>
<span class="p">$ free -h</span>                          <span class="c"># 남은 메모리</span>
<span class="p">$ kill &lt;PID&gt;</span>                      <span class="c"># 먼저 정상 종료</span>
<span class="p">$ ps -p &lt;PID&gt;</span>                     <span class="c"># 죽었나 확인</span></pre>
      <div class="banner" style="margin-top:2cqh">메모리가 바닥나면 커널이 OOM Killer를 작동시킵니다 — 내가 안 죽이면 커널이 고릅니다.</div>`,
      nar: `두 번째 상황입니다. 메모리를 계속 먹는 프로세스를 일부러 띄우고 찾아냅니다. 피에스에 소트 옵션을 주면 메모리를 많이 쓰는 순으로 정렬해 줍니다. 찾았으면 먼저 그냥 킬로 보내고, 죽었는지 확인합니다. 여기서 알아 두실 것이 있습니다. 메모리가 정말로 바닥나면 커널이 오오엠 킬러라는 것을 작동시켜서 프로세스를 강제로 죽입니다. 문제는 커널이 고르는 희생자가 여러분이 원하는 프로세스가 아닐 수 있다는 점입니다. 아홉째 날에 이걸 다시 다룹니다.` },

    { eb: 'AI LAB', h: '상황 3 — 공유 모델 디렉터리 설계',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># VM에서 진행합니다</span>
<span class="p">$ sudo groupadd mlteam</span>
<span class="p">$ sudo useradd -m -G mlteam student1</span>
<span class="p">$ sudo useradd -m -G mlteam student2</span>

<span class="p">$ sudo mkdir -p /srv/models</span>
<span class="p">$ sudo chgrp mlteam /srv/models</span>
<span class="p">$ sudo chmod 2775 /srv/models</span>       <span class="c"># 앞의 2 = setgid</span>
<span class="p">$ ls -ld /srv/models</span>
<span class="c">drwxrwsr-x 2 root mlteam 4096 ... /srv/models</span>
<span class="c">        └ s : 여기서 만든 파일은 자동으로 mlteam 그룹이 됩니다</span></pre>`,
      foot: 'setgid 없이는 각자 만든 파일이 각자의 그룹이 되어 서로 못 고칩니다.',
      nar: `세 번째 상황이 오늘의 하이라이트입니다. 여러 명이 함께 쓰는 모델 디렉터리를 만듭니다. 그룹을 만들고 계정을 그 그룹에 넣고 디렉터리의 그룹을 바꾸는 것까지는 쉽습니다. 문제는 그다음입니다. 그냥 칠칠오로 두면 각자가 만든 파일이 각자의 개인 그룹으로 생성돼서 서로 고칠 수가 없습니다. 그래서 앞에 이를 붙여 이칠칠오로 줍니다. 이걸 셋지드라고 하는데, 이 디렉터리 안에서 만들어지는 파일은 자동으로 팀 그룹을 물려받게 합니다. 권한 표시에서 엑스 자리에 에스가 보이면 셋지드가 걸린 것입니다.` }
  ],

  assignment: {
    title: '연구실 GPU 서버 권한 설계서',
    lede: '교수·대학원생·학부생 세 역할이 하나의 서버를 나눠 씁니다. 권한을 설계하고 근거를 적으십시오.',
    items: [
      '역할별 계정·그룹 구성표',
      '디렉터리 4개(모델·데이터·결과·개인)의 권한 값',
      '각 권한을 그렇게 준 근거 (한 문단씩)',
      'setgid가 필요한 디렉터리와 그 이유',
      'VM에서 실제로 만들고 검증한 명령 기록',
      '다른 계정으로 접근을 시험한 결과'
    ],
    note: '표만 그리면 절반입니다. <strong>실제로 만들고, 다른 계정으로 접근해 보고, 실패하거나 성공한 결과</strong>를 붙여야 완성입니다.',
    sample: `<span class="o">디렉터리 : /srv/models
권한     : 2775 (drwxrwsr-x), 소유 root:mlteam
근거     : 대학원생은 모델을 추가해야 하므로 그룹 쓰기 필요.
           학부생은 읽기만. setgid로 그룹 소유권 유지.
검증     : student2로 su 후 touch 성공 / 삭제는 실패</span>`,
    nar: `과제입니다. 교수와 대학원생과 학부생 세 역할이 하나의 지피유 서버를 나눠 쓰는 상황을 가정하고 권한을 설계하십시오. 계정과 그룹 구성표를 만들고, 디렉터리 네 개의 권한 값을 정하고, 왜 그렇게 줬는지 근거를 한 문단씩 적으십시오. 여기서 중요한 것은 표만 그리면 절반이라는 점입니다. 가상머신에서 실제로 만들어 보고, 다른 계정으로 접근해서 되는지 안 되는지 확인한 결과까지 붙여야 완성입니다.` },

  wrap: {
    done: '권한을 읽고 설계하는 법, 프로세스를 다루는 법을 익혔습니다.',
    next: '내일 · Day 5 — 패키지 · 환경 · 원격 접속',
    nextDesc: 'ROS도 CUDA도 아닌, 가장 실무적인 하루입니다. apt와 환경변수와 SSH로 남이 재현할 수 있는 환경을 만듭니다.',
    nar: `오늘 한 일을 정리하겠습니다. 계정과 그룹의 구조를 보고, 알더블유엑스 권한을 읽고 바꾸는 법을 배웠고, 셋지드까지 써서 공유 디렉터리를 설계했습니다. 그리고 프로세스를 조회하고 안전하게 종료하고 백그라운드로 띄우는 법을 익혔습니다. 내일은 패키지와 환경변수와 에스에스에이치입니다. 화려하지 않지만 앞으로 가장 자주 쓰게 될 실무적인 하루입니다. 수고하셨습니다.` },

  lab: {
    h1: '사용자 · 권한 · 프로세스',
    standfirst: '오늘 PART 1–2는 <strong>가상머신</strong>에서, PART 3–4는 <strong>WSL2</strong>에서 합니다. 계정을 만들고 권한을 시험하는 일은 망가뜨려도 되는 곳에서 해야 하기 때문입니다.',
    rules: [
      ['VM은 망가뜨려도 된다', 'Day 1에 찍은 clean-install 스냅샷이 있습니다. 과감하게 실험하세요.'],
      ['kill -9 는 마지막에', '먼저 그냥 kill을 보내고 3초 기다린 뒤에도 안 죽으면 그때 -9입니다.'],
      ['내 홈에서 sudo가 필요하면 의심', '홈 디렉터리 안 작업에 sudo가 필요하다면 무언가 잘못된 것입니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '계정과 권한 읽기', time: '13:00–13:40',
        lede: '여기부터 PART 2까지는 VirtualBox의 Ubuntu Server에서 진행합니다.',
        missions: [
          { n: 1, h: '나는 누구인가', body: `
      <pre><span class="p">$</span> whoami
<span class="p">$</span> id
<span class="o">uid=1000(ubuntu) gid=1000(ubuntu) groups=1000(ubuntu),27(sudo)</span>
<span class="p">$</span> groups
<span class="p">$</span> grep "^ubuntu" /etc/passwd
<span class="p">$</span> sudo grep "^ubuntu" /etc/shadow | cut -c1-40</pre>
      <div class="box q"><span class="lbl">확인 질문</span><ul>
        <li><code>id</code> 출력에 <code>sudo</code> 그룹이 보이나요? 그게 무엇을 뜻할까요?</li>
        <li><code>/etc/shadow</code>는 왜 <code>sudo</code> 없이 못 읽을까요? 직접 확인해 보세요.</li>
      </ul></div>` },
          { n: 2, h: 'rwx 아홉 글자 해부', body: `
      <pre><span class="p">$</span> cd ~ &amp;&amp; mkdir -p permtest &amp;&amp; cd permtest
<span class="p">$</span> echo "내용" &gt; a.txt
<span class="p">$</span> ls -l a.txt
<span class="o">-rw-r--r-- 1 ubuntu ubuntu 7 Sep 17 13:05 a.txt</span>

<span class="p">$</span> chmod 600 a.txt &amp;&amp; ls -l a.txt
<span class="p">$</span> chmod 644 a.txt &amp;&amp; ls -l a.txt
<span class="p">$</span> chmod 755 a.txt &amp;&amp; ls -l a.txt
<span class="p">$</span> chmod u-w a.txt &amp;&amp; ls -l a.txt
<span class="p">$</span> echo "추가" &gt;&gt; a.txt</pre>
      <div class="box check"><span class="lbl">마지막 줄에서 무슨 일이</span>
        <p>쓰기 권한을 뺐더니 <code>Permission denied</code>가 납니다. <strong>내 파일인데도</strong> 권한이 없으면 못 씁니다. 소유권과 권한은 별개입니다.</p></div>` },
          { n: 3, h: '디렉터리의 x는 "들어가기"', body: `
      <pre><span class="p">$</span> mkdir -p dirtest &amp;&amp; echo hi &gt; dirtest/inside.txt
<span class="p">$</span> chmod 644 dirtest          <span class="c"># r 만 주고 x 를 뺍니다</span>
<span class="p">$</span> ls dirtest                 <span class="c"># 목록은 보입니다</span>
<span class="p">$</span> cd dirtest                 <span class="c"># 들어갈 수 없습니다</span>
<span class="p">$</span> cat dirtest/inside.txt     <span class="c"># 읽을 수도 없습니다</span>
<span class="p">$</span> chmod 755 dirtest &amp;&amp; cd dirtest &amp;&amp; pwd</pre>
      <div class="box warn"><span class="lbl">실무에서 가장 흔한 권한 사고</span>
        <p>"목록은 보이는데 파일을 못 연다"는 증상은 거의 항상 <strong>디렉터리의 x 권한</strong> 문제입니다. Day 9 장애 대응에서 다시 만납니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '그룹과 공유 디렉터리', time: '13:40–15:00',
        lede: '오늘의 핵심 실습입니다. 여러 명이 함께 쓰는 폴더를 실제로 만들어 봅니다.',
        missions: [
          { n: 4, h: '계정과 그룹 만들기', body: `
      <pre><span class="p">$</span> sudo groupadd mlteam
<span class="p">$</span> sudo useradd -m -s /bin/bash -G mlteam student1
<span class="p">$</span> sudo useradd -m -s /bin/bash -G mlteam student2
<span class="p">$</span> sudo passwd student1        <span class="c"># 비밀번호 설정 (student1 로)</span>
<span class="p">$</span> sudo passwd student2

<span class="p">$</span> id student1
<span class="p">$</span> grep mlteam /etc/group</pre>
      <div class="box check"><span class="lbl">옵션의 뜻</span>
        <p><code>-m</code> 홈 디렉터리 생성, <code>-s</code> 로그인 셸 지정, <code>-G</code> 추가 그룹. <code>-m</code>을 빼면 홈이 없는 계정이 만들어져 로그인 후 바로 문제가 생깁니다.</p></div>` },
          { n: 5, h: 'setgid 없이 만들어 보기 (실패 체험)', body: `
      <pre><span class="p">$</span> sudo mkdir -p /srv/models
<span class="p">$</span> sudo chgrp mlteam /srv/models
<span class="p">$</span> sudo chmod 775 /srv/models
<span class="p">$</span> ls -ld /srv/models

<span class="p">$</span> sudo su - student1
<span class="p">$</span> touch /srv/models/from_s1.bin
<span class="p">$</span> ls -l /srv/models
<span class="o">-rw-rw-r-- 1 student1 student1 0 ... from_s1.bin</span>   <span class="c">← 그룹이 student1 입니다!</span>
<span class="p">$</span> exit

<span class="p">$</span> sudo su - student2
<span class="p">$</span> echo test &gt;&gt; /srv/models/from_s1.bin
<span class="o">bash: /srv/models/from_s1.bin: Permission denied</span>
<span class="p">$</span> exit</pre>
      <div class="box warn"><span class="lbl">문제를 눈으로 확인했습니다</span>
        <p>같은 팀 폴더에 넣었는데 student2가 고칠 수 없습니다. 파일의 그룹이 <code>mlteam</code>이 아니라 <code>student1</code>로 생성됐기 때문입니다.</p></div>` },
          { n: 6, h: 'setgid로 해결하기', body: `
      <pre><span class="p">$</span> sudo chmod 2775 /srv/models
<span class="p">$</span> ls -ld /srv/models
<span class="o">drwxrwsr-x 3 root mlteam 4096 ... /srv/models</span>   <span class="c">← x 자리에 s</span>

<span class="p">$</span> sudo su - student1
<span class="p">$</span> touch /srv/models/from_s1_v2.bin
<span class="p">$</span> ls -l /srv/models/from_s1_v2.bin
<span class="o">-rw-rw-r-- 1 student1 mlteam 0 ... from_s1_v2.bin</span>   <span class="c">← 그룹이 mlteam!</span>
<span class="p">$</span> exit

<span class="p">$</span> sudo su - student2
<span class="p">$</span> echo test &gt;&gt; /srv/models/from_s1_v2.bin &amp;&amp; echo 성공
<span class="p">$</span> exit</pre>
      <div class="box check"><span class="lbl">오늘 가장 중요한 실습</span>
        <p>앞자리 <code>2</code>가 setgid입니다. 이 디렉터리에서 만들어지는 파일은 부모 디렉터리의 그룹을 물려받습니다. 공유 폴더 설계의 필수 요소입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '프로세스 다루기', time: '15:10–16:00',
        lede: '여기부터는 WSL2에서 진행합니다.',
        missions: [
          { n: 7, h: '무엇이 돌고 있나', body: `
      <pre><span class="p">$</span> ps
<span class="p">$</span> ps aux | head -5
<span class="p">$</span> ps aux | wc -l
<span class="p">$</span> ps -ef --forest | head -20
<span class="p">$</span> ps aux --sort=-%mem | head -5
<span class="p">$</span> ps aux --sort=-%cpu | head -5</pre>
      <div class="box q"><span class="lbl">확인 질문</span><p>PID 1번은 무엇인가요? 모든 프로세스의 조상이 하나라는 사실이 왜 중요할까요?</p></div>` },
          { n: 8, h: 'kill 과 kill -9 의 차이', body: `
      <pre><span class="p">$</span> sleep 600 &amp;
<span class="o">[1] 51234</span>
<span class="p">$</span> jobs
<span class="p">$</span> ps -p 51234
<span class="p">$</span> kill 51234
<span class="p">$</span> ps -p 51234                  <span class="c"># 사라졌습니다</span>

<span class="c"># 신호를 무시하는 프로세스 만들기</span>
<span class="p">$</span> bash -c 'trap "" TERM; sleep 600' &amp;
<span class="o">[2] 51240</span>
<span class="p">$</span> kill 51240
<span class="p">$</span> ps -p 51240                  <span class="c">← 아직 살아 있습니다</span>
<span class="p">$</span> kill -9 51240
<span class="p">$</span> ps -p 51240</pre>
      <div class="box check"><span class="lbl">순서를 몸에 붙이세요</span>
        <p><code>kill</code> → 확인 → 그래도 살아 있으면 <code>kill -9</code>. 처음부터 <code>-9</code>를 쓰면 쓰던 파일이 깨질 수 있습니다.</p></div>` },
          { n: 9, h: '우선순위 조정', body: `
      <pre><span class="p">$</span> nice -n 10 sleep 300 &amp;
<span class="p">$</span> ps -o pid,ni,cmd -p $!
<span class="o">  PID  NI CMD
51250  10 sleep 300</span>

<span class="p">$</span> renice -n 5 -p $!
<span class="p">$</span> ps -o pid,ni,cmd -p $!
<span class="p">$</span> kill $!</pre>
      <div class="box check"><span class="lbl">NI 값</span>
        <p>-20이 가장 높은 우선순위, 19가 가장 낮습니다. 양보한다는 뜻이라 "nice"입니다. 우선순위를 <strong>올리려면</strong> sudo가 필요합니다 — 왜일까요?</p></div>` }
        ]
      },
      {
        pn: 'PART 4', h: 'AI LAB · 공용 서버 시뮬레이션', time: '16:00–17:10',
        missions: [
          { n: 10, h: '장시간 작업 띄우고 추적하기', body: `
      <pre><span class="p">$</span> cd ~/ai-lab
<span class="p">$</span> nohup bash -c 'for i in $(seq 1 600); do
    echo "[$(date +%T)] step $i"; sleep 1; done' \\
    &gt; logs/preprocess.log 2&gt;&amp;1 &amp;
<span class="o">[1] 51300</span>

<span class="p">$</span> tail -f logs/preprocess.log      <span class="c"># Ctrl+C 로 보기 중단</span>
<span class="p">$</span> ps -p 51300                      <span class="c">← 여전히 살아 있습니다</span>
<span class="p">$</span> wc -l logs/preprocess.log        <span class="c"># 계속 늘어납니다</span></pre>
      <div class="box check"><span class="lbl">"보기"와 "실행"은 별개</span>
        <p><kbd>Ctrl</kbd>+<kbd>C</kbd>는 <code>tail</code>을 끝낼 뿐 작업은 계속 돕니다. 이걸 헷갈려서 작업을 다시 돌리는 일이 자주 생깁니다.</p></div>` },
          { n: 11, h: '메모리 폭주 프로세스 처리', body: `
      <pre><span class="p">$</span> free -h                          <span class="c"># 먼저 현재 상태</span>
<span class="p">$</span> python3 -c "
a=[]
while True: a.append(' '*10**7)
" &amp;

<span class="p">$</span> sleep 5
<span class="p">$</span> ps aux --sort=-%mem | head -3
<span class="p">$</span> free -h                          <span class="c"># 줄어드는 것을 확인</span>
<span class="p">$</span> kill %2                          <span class="c"># job 번호로도 됩니다</span>
<span class="p">$</span> free -h</pre>
      <div class="box warn"><span class="lbl">주의</span>
        <p>메모리가 적은 PC에서는 시스템이 잠깐 느려질 수 있습니다. 5초 안에 종료하세요. 멈춘 것 같으면 새 터미널을 열어 <code>pkill -9 python3</code>를 칩니다.</p></div>` },
          { n: 12, h: '모델 디렉터리 그룹 권한 (WSL2 버전)', body: `
      <pre><span class="p">$</span> mkdir -p ~/ai-lab/models/shared
<span class="p">$</span> chmod 2775 ~/ai-lab/models/shared
<span class="p">$</span> ls -ld ~/ai-lab/models/shared
<span class="p">$</span> touch ~/ai-lab/models/shared/test.bin
<span class="p">$</span> ls -l ~/ai-lab/models/shared

<span class="c"># 비밀값은 반대로 — 나만 읽게</span>
<span class="p">$</span> echo "API_KEY=abcd1234" &gt; ~/ai-lab/.env
<span class="p">$</span> chmod 600 ~/ai-lab/.env
<span class="p">$</span> ls -l ~/ai-lab/.env</pre>
      <div class="box check"><span class="lbl">Day 9 예고</span>
        <p><code>600</code>으로 지킨 이 <code>.env</code> 파일이 아홉째 날 API 키 관리 실습의 출발점이 됩니다. 지우지 마세요.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>Permission denied</code> (내 홈 안)', '권한을 잘못 뺐다', 'sudo로 덮지 말고 <code>ls -l</code>로 원인을 먼저 봅니다'],
      ['목록은 보이는데 <code>cd</code>가 안 된다', '디렉터리 x 권한 없음', '<code>chmod +x 디렉터리</code>'],
      ['공유 폴더에서 남의 파일을 못 고친다', 'setgid 없음', '<code>chmod 2775</code>로 그룹 상속'],
      ['<code>kill</code>했는데 안 죽는다', '신호를 무시하는 프로세스', '3초 기다린 뒤 <code>kill -9</code>'],
      ['터미널을 닫았더니 작업이 죽었다', 'SIGHUP', '<code>nohup ... &amp;</code> 또는 Day 5의 tmux'],
      ['<code>useradd</code> 후 로그인하면 홈이 없다', '<code>-m</code> 누락', '<code>sudo useradd -m ...</code>로 다시 만듭니다']
    ],
    checklist: [
      '<code>/etc/passwd</code> 한 줄의 각 칸을 설명할 수 있다',
      'rwx를 숫자와 기호 양쪽으로 바꿀 수 있다',
      '디렉터리의 x가 "들어가기"라는 것을 실패 체험으로 확인했다',
      '그룹을 만들고 계정을 넣어 봤다',
      'setgid 없이 실패하고, 2775로 해결하는 과정을 직접 겪었다',
      '<code>ps aux --sort=-%mem</code>로 메모리 상위 프로세스를 찾았다',
      '<code>kill</code>과 <code>kill -9</code>의 차이를 실험으로 확인했다',
      '<code>nohup</code>으로 띄운 작업이 tail 중단 후에도 도는 것을 확인했다',
      '<code>~/ai-lab/.env</code>를 600 권한으로 만들었다'
    ]
  },

  quizTitle: '권한과 프로세스 퀴즈',
  quiz: [
    { q: '<code>-rw-r--r--</code>를 숫자로 바꾸면?', o: ['644', '755', '600', '664'], a: 0,
      e: 'rw-(4+2=6), r--(4), r--(4) → 644. 일반 파일의 기본값입니다.' },
    { q: '<code>chmod 600 secret.env</code>가 뜻하는 것은?', o: ['소유자만 읽고 쓸 수 있다', '모두가 읽을 수 있다', '그룹만 쓸 수 있다', '실행 권한을 준다'], a: 0,
      e: '6=rw-, 0=---, 0=---. API 키나 비밀번호 파일의 표준 권한입니다.' },
    { q: '디렉터리에서 <code>x</code> 권한이 뜻하는 것은?', o: ['그 안으로 들어갈 수 있다', '파일을 실행할 수 있다', '삭제할 수 있다', '숨김 파일을 볼 수 있다'], a: 0,
      e: '디렉터리의 x는 "통과 권한"입니다. 목록은 보이는데 파일을 못 여는 증상의 원인입니다.' },
    { q: 'UID 0번은 누구인가요?', o: ['root (관리자)', '첫 번째 일반 사용자', 'nobody', '시스템 서비스'], a: 0,
      e: '0번이 root입니다. 일반 사용자는 보통 1000번부터 시작합니다.' },
    { q: '비밀번호 해시가 실제로 저장된 파일은?', o: ['/etc/shadow', '/etc/passwd', '/etc/group', '/etc/sudoers'], a: 0,
      e: '<code>/etc/passwd</code>는 누구나 읽을 수 있어서 비밀번호는 <code>/etc/shadow</code>로 분리했습니다. 권한 설계의 좋은 예입니다.' },
    { q: '공유 디렉터리에서 <strong>만들어지는 파일이 그룹을 물려받게</strong> 하는 설정은?', o: ['chmod 2775', 'chmod 775', 'chmod 4775', 'chmod 1775'], a: 0,
      e: '앞자리 2가 setgid입니다. 4는 setuid, 1은 sticky bit(/tmp에 쓰임)입니다.' },
    { q: 'setgid가 걸린 디렉터리의 권한 표시에서 보이는 글자는?', o: ['s', 't', 'g', 'x'], a: 0,
      e: '그룹 자리의 x가 s로 바뀝니다 — <code>drwxrwsr-x</code>.' },
    { q: '내 홈 디렉터리 안 작업에 <code>sudo</code>가 필요하다면?', o: ['무언가 잘못된 신호다', '정상이다', '항상 붙여야 한다', '속도가 빨라진다'], a: 0,
      e: 'sudo로 덮으면 파일 소유자가 root가 되어 나중에 더 큰 문제가 됩니다. 원인을 먼저 보세요.' },
    { q: '<code>ps aux</code>에서 PID 1번 프로세스는?', o: ['모든 프로세스의 조상 (init/systemd)', '가장 무거운 프로세스', '내가 띄운 첫 프로세스', '커널 스레드'], a: 0,
      e: 'Day 7에서 배울 systemd가 바로 이 1번입니다. 모든 서비스의 부모입니다.' },
    { q: '메모리를 많이 쓰는 프로세스 순으로 보려면? (직접 입력)', t: true, acc: ['ps aux --sort=-%mem', 'ps aux --sort -%mem'], ans: 'ps aux --sort=-%mem',
      e: '앞의 <code>-</code>가 내림차순입니다. CPU 기준은 <code>--sort=-%cpu</code>입니다.' },
    { q: '<code>kill</code>과 <code>kill -9</code>의 차이로 옳은 것은?', o: ['kill은 정리할 틈을 주고, -9는 즉시 강제 종료', 'kill은 느리고 -9는 빠르다', '-9는 관리자만 쓸 수 있다', '차이가 없다'], a: 0,
      e: 'SIGTERM은 "정리하고 끝내라", SIGKILL은 거부할 수 없는 즉시 종료입니다.' },
    { q: '프로세스를 끝낼 때 올바른 순서는?', o: ['kill → 확인 → 안 죽으면 kill -9', 'kill -9 → 안 되면 kill', '항상 kill -9', 'sudo kill -9 부터'], a: 0,
      e: '<code>-9</code>를 먼저 쓰는 습관이 데이터 손상의 흔한 원인입니다.' },
    { q: '터미널을 닫아도 작업이 죽지 않게 하는 명령은? (직접 입력)', t: true, acc: ['nohup'], ans: 'nohup',
      e: 'SIGHUP(hang up)을 무시하게 합니다. 정식 해법은 Day 5의 tmux입니다.' },
    { q: '<code>tail -f</code> 보는 중에 <kbd>Ctrl</kbd>+<kbd>C</kbd>를 누르면?', o: ['보기만 멈추고 작업은 계속 돈다', '작업도 함께 종료된다', '작업이 일시정지된다', '로그 파일이 닫힌다'], a: 0,
      e: '"보기"와 "실행"은 별개입니다. 이걸 헷갈려 작업을 다시 돌리는 일이 자주 생깁니다.' },
    { q: '<code>nice</code> 값의 범위와 의미는?', o: ['-20이 가장 높은 우선순위, 19가 가장 낮음', '0~100, 클수록 우선', '1~10, 작을수록 느림', '음수는 쓸 수 없다'], a: 0,
      e: '"양보한다"는 뜻이라 nice입니다. 우선순위를 올리려면(음수) sudo가 필요합니다.' },
    { q: '메모리가 완전히 바닥나면 커널은 무엇을 하나요?', o: ['OOM Killer로 프로세스를 골라 죽인다', '자동으로 스왑을 늘린다', '시스템을 재부팅한다', '아무 일도 안 한다'], a: 0,
      e: '문제는 커널이 고르는 희생자가 내가 원하는 프로세스가 아닐 수 있다는 점입니다. Day 9에서 다시 다룹니다.' },
    { q: '<code>useradd</code>에서 홈 디렉터리를 함께 만드는 옵션은?', o: ['-m', '-h', '-d', '-c'], a: 0,
      e: '<code>-m</code>을 빼면 홈 없는 계정이 만들어져 로그인 직후 문제가 생깁니다.' },
    { q: '"목록은 보이는데 파일을 못 연다"의 가장 흔한 원인은?', o: ['디렉터리에 x 권한이 없다', '파일이 손상됐다', '디스크가 가득 찼다', 'root 소유라서'], a: 0,
      e: 'r만 있고 x가 없으면 목록은 읽히지만 통과할 수 없습니다. Day 9 장애 랩에서 이 증상이 나옵니다.' }
  ]
};
