module.exports = {
  day: 2,
  title: '파일시스템과 파이프',
  theme: '모든 것이 파일이고, 모든 것이 흐른다',

  openingNar: `둘째 날입니다. 어제 두 개의 리눅스를 만들고 터미널에 처음 앉아 보셨습니다. 오늘은 그 안에서 파일이 어떻게 놓여 있는지, 그리고 명령과 명령을 어떻게 이어 붙이는지를 배웁니다. 리눅스에는 "모든 것이 파일이다"라는 말이 있습니다. 오늘 그 말이 무슨 뜻인지 손으로 확인하게 됩니다.`,

  goals: [
    ['파일시스템 계층을', '지도처럼 읽고 원하는 곳을 찾아갈 수 있다'],
    ['파일의 종류와 메타데이터를', 'ls -l 출력에서 읽어낼 수 있다'],
    ['심볼릭 링크와 아카이브를', '만들고 풀 수 있다'],
    ['표준 출력과 표준 에러를', '각각 다른 파일로 갈라 담을 수 있다'],
    ['파이프로 명령을 이어', '한 줄로 질문에 답할 수 있다'],
    ['10일간 쓸 작업공간을', '규칙에 맞게 설계하고 검증할 수 있다']
  ],
  goalsNar: `오늘의 목표는 여섯 가지입니다. 앞의 세 가지는 파일시스템입니다. 디렉터리 구조를 지도처럼 읽고, 파일의 종류와 권한과 크기를 출력에서 읽어내고, 링크와 압축 파일을 다룹니다. 뒤의 세 가지가 오늘의 핵심인데요. 명령의 출력을 파일로 보내고, 에러만 따로 모으고, 명령과 명령을 파이프로 이어 붙이는 것입니다. 이 세 가지가 앞으로 여드레 동안 여러분이 가장 많이 쓸 기술입니다.`,

  blocks: [
    { time: '09:00–11:00', title: '파일시스템 계층', desc: 'FHS · 파일의 종류 · 링크 · 압축' },
    { time: '11:10–12:00', title: '리다이렉션과 파이프', desc: '표준 입출력을 손에 쥐기' },
    { time: '13:00–15:00', title: '파일 조작 드릴', desc: '탐색 · 링크 · 아카이브 반복 연습' },
    { time: '15:10–17:10', title: '작업공간 설계', desc: 'ai-lab 구조를 만들고 검증' }
  ],
  blocksNar: `오늘도 오전 세 시간은 개념, 오후 네 시간은 손입니다. 오전에는 파일시스템의 지도를 그리고 리다이렉션과 파이프의 원리를 봅니다. 오후에는 그 개념들을 반복해서 연습한 다음, 마지막 두 시간에 열흘 내내 쓸 작업공간을 직접 설계합니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–11:00', h: '파일시스템 계층',
      sub: '남의 컴퓨터에 처음 들어가도 어디에 무엇이 있는지 알 수 있게 만드는 시간입니다.',
      nar: `첫 번째 블록입니다. 리눅스는 어느 배포판이든 디렉터리 구조가 거의 같습니다. 이것을 파일시스템 계층 표준, 줄여서 에프에이치에스라고 부릅니다. 이 지도를 한 번 익혀 두면 처음 접속한 남의 서버에서도 설정 파일이 어디 있는지, 로그가 어디 쌓이는지 바로 짐작할 수 있습니다.` },

    { eb: 'FHS', h: '리눅스의 지도',
      sub: '어느 배포판이든 거의 같습니다. 한 번 익히면 평생 씁니다.',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">/etc</span><span class="t">설정 파일</span><span class="d">서비스 설정은 거의 다 여기. Day 7의 systemd 설정도 여기서 봅니다</span></div>
        <div class="card"><span class="n">/var</span><span class="t">변하는 데이터</span><span class="d">로그(/var/log), 캐시. 디스크가 차는 곳도 대개 여기입니다</span></div>
        <div class="card"><span class="n">/home</span><span class="t">사용자 홈</span><span class="d">/home/ubuntu 가 여러분의 자리. ~ 는 이곳의 줄임말</span></div>
        <div class="card"><span class="n">/usr</span><span class="t">설치된 프로그램</span><span class="d">apt로 깐 명령어들이 사는 곳(/usr/bin)</span></div>
        <div class="card"><span class="n">/opt</span><span class="t">별도 설치 소프트웨어</span><span class="d">패키지로 안 깔고 통째로 넣는 것들</span></div>
        <div class="card"><span class="n">/proc</span><span class="t">커널이 만드는 가짜 파일</span><span class="d">디스크에 없습니다. 프로세스 정보가 파일처럼 보입니다</span></div>
      </div>`,
      foot: '/proc 은 "모든 것이 파일이다"라는 말이 무슨 뜻인지 보여주는 증거입니다.',
      nar: `주요 디렉터리 여섯 개만 기억하시면 됩니다. 이티씨는 설정 파일이 모이는 곳입니다. 바는 변하는 데이터, 특히 로그가 쌓이는 곳이고 디스크가 가득 차는 사고는 대개 여기서 납니다. 홈은 사용자 각자의 자리이고, 유에스알은 설치된 프로그램이 사는 곳입니다. 옵트는 패키지 관리자를 거치지 않고 통째로 넣는 소프트웨어 자리입니다. 마지막 프록은 좀 특별합니다. 디스크에 실제로 존재하지 않고 커널이 그때그때 만들어 내는 가짜 파일들인데, 프로세스 정보가 마치 파일처럼 보입니다. 리눅스에서 모든 것이 파일이라는 말이 무슨 뜻인지 보여주는 증거입니다.` },

    { eb: 'File Types', h: 'ls -l 한 줄을 끝까지 읽기',
      sub: '이 한 줄에 종류, 권한, 소유자, 크기, 시각이 전부 들어 있습니다.',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ ls -l /var/log</span>
<span class="c">-rw-r-----  1 syslog adm   184520 Sep 16 09:12 syslog
drwxr-xr-x  2 root   root    4096 Sep 10 03:00 apt
lrwxrwxrwx  1 root   root       9 Sep 10 03:00 boot.log -> /dev/null</span></pre>
      <div class="grid g4" style="margin-top:2cqh">
        <div class="card"><span class="n">첫 글자</span><span class="t">종류</span><span class="d">- 파일 · d 디렉터리 · l 링크</span></div>
        <div class="card"><span class="n">다음 9자</span><span class="t">권한</span><span class="d">Day 4에서 본격적으로</span></div>
        <div class="card"><span class="n">이름 두 개</span><span class="t">소유자 · 그룹</span><span class="d">누구 것인가</span></div>
        <div class="card"><span class="n">숫자</span><span class="t">바이트 크기</span><span class="d">-h 를 붙이면 읽기 쉽게</span></div>
      </div>`,
      nar: `엘에스 대시 엘의 출력은 정보 밀도가 아주 높습니다. 맨 앞 한 글자가 종류입니다. 붙임표면 일반 파일, 디면 디렉터리, 엘이면 링크입니다. 그다음 아홉 글자가 권한인데 이건 넷째 날에 제대로 다룹니다. 이어서 소유자와 그룹 이름이 나오고, 숫자가 바이트 단위 크기입니다. 어제 배운 대시 에이치를 붙이면 사람이 읽기 쉬운 단위로 바뀝니다. 지금은 이 한 줄에서 종류와 크기와 시각을 읽어낼 수 있으면 충분합니다.` },

    { eb: 'Links & Archives', h: '링크와 아카이브',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="t">심볼릭 링크</span><span class="d">파일을 가리키는 이름표. 원본이 사라지면 끊어집니다.</span>
          <pre style="margin-top:1cqh;font-size:2.2cqh">ln -s /opt/models/qwen current
ls -l current</pre></div>
        <div class="card"><span class="t">아카이브와 압축</span><span class="d">여러 파일을 하나로 묶고(tar), 줄입니다(gzip).</span>
          <pre style="margin-top:1cqh;font-size:2.2cqh">tar -czf logs.tar.gz logs/
tar -tzf logs.tar.gz
tar -xzf logs.tar.gz</pre></div>
      </div>`,
      foot: 'c는 create, x는 extract, t는 list, z는 gzip, f는 파일 이름 — 이 다섯 글자면 충분합니다.',
      nar: `링크는 파일을 가리키는 이름표입니다. 실제 데이터를 복사하지 않고 이름만 하나 더 만듭니다. 모델 파일처럼 용량이 큰 것을 여러 이름으로 쓰고 싶을 때 유용합니다. 아카이브는 여러 파일을 하나로 묶는 것이고, 압축은 크기를 줄이는 것입니다. 리눅스에서는 타르 명령이 묶고 지집이 줄입니다. 옵션 글자는 다섯 개만 기억하십시오. 씨는 만들기, 엑스는 풀기, 티는 목록 보기, 지는 압축, 에프는 파일 이름이 뒤따른다는 표시입니다.` },

    { section: true, eb: 'Block 2 · 11:10–12:00', h: '리다이렉션과 파이프',
      sub: '오늘 배우는 것 중 앞으로 가장 많이 쓸 기술입니다.',
      nar: `두 번째 블록입니다. 여기서 배우는 것이 오늘 내용 중 여러분이 가장 자주 쓰게 될 기술입니다. 명령의 출력을 어디로 보낼지 정하고, 명령과 명령을 이어 붙이는 방법입니다.` },

    { eb: 'Streams', h: '모든 명령에는 통로가 세 개 있다',
      sub: '입력 하나, 출력 둘. 이 셋을 각각 다른 곳으로 보낼 수 있습니다.',
      body: `<div class="stack" style="margin-top:1.6cqh">
        <div class="lay"><b>stdin (0)</b><span>표준 입력 — 명령이 읽어 들이는 통로</span></div>
        <div class="lay" style="background:var(--soft)"><b>stdout (1)</b><span>표준 출력 — 정상 결과가 나오는 통로</span></div>
        <div class="lay" style="background:var(--sand);border-color:#E7CDBF"><b>stderr (2)</b><span>표준 에러 — 오류 메시지만 따로 나오는 통로</span></div>
      </div>
      <div class="bannerG" style="margin-top:2cqh">화면에는 섞여 보이지만 실제로는 서로 다른 통로입니다. 그래서 따로 보낼 수 있습니다.</div>`,
      nar: `모든 명령에는 통로가 세 개 있습니다. 표준 입력은 명령이 읽어 들이는 통로이고, 표준 출력은 정상적인 결과가 나오는 통로입니다. 그리고 표준 에러라는 세 번째 통로가 따로 있어서 오류 메시지만 이쪽으로 나옵니다. 화면에서는 두 출력이 섞여 보이기 때문에 같은 것이라고 착각하기 쉬운데, 실제로는 완전히 다른 통로입니다. 그래서 정상 결과는 파일로 저장하고 오류만 화면에 남기는 식으로 갈라 담을 수 있습니다. 이걸 아느냐 모르느냐가 앞으로 로그를 다룰 때 큰 차이를 만듭니다.` },

    { eb: 'Redirection', h: '출력을 어디로 보낼지 정하기',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ ls /etc &gt; list.txt</span>        <span class="c"># 정상 출력을 파일로 (덮어쓰기)</span>
<span class="p">$ ls /etc &gt;&gt; list.txt</span>       <span class="c"># 이어붙이기</span>
<span class="p">$ ls /없는경로 2&gt; err.txt</span>   <span class="c"># 오류만 파일로</span>
<span class="p">$ ls /etc /없는경로 &gt; ok.txt 2&gt; err.txt</span>   <span class="c"># 따로따로</span>
<span class="p">$ 명령 &gt; out.txt 2&gt;&amp;1</span>      <span class="c"># 둘을 한 파일에 합치기</span>
<span class="p">$ 명령 &gt; /dev/null 2&gt;&amp;1</span>    <span class="c"># 둘 다 버리기</span></pre>
      <div class="banner" style="margin-top:2cqh">&gt; 는 덮어쓰기입니다. 중요한 파일 이름을 쓰면 그 자리에서 사라집니다.</div>`,
      nar: `꺾쇠 하나는 정상 출력을 파일로 보냅니다. 단, 덮어쓰기입니다. 기존 내용이 그대로 사라지므로 조심해야 합니다. 꺾쇠 두 개는 이어붙이기입니다. 숫자 이와 꺾쇠를 함께 쓰면 오류만 따로 보낼 수 있습니다. 두 개를 한 파일에 합치고 싶으면 이 꺾쇠 앰퍼샌드 일이라고 씁니다. 마지막 줄의 데브 널은 리눅스의 블랙홀입니다. 여기로 보낸 것은 그냥 사라집니다. 필요 없는 출력을 버릴 때 씁니다.` },

    { eb: 'Pipe', h: '파이프 — 한 명령의 출력을 다음 명령의 입력으로',
      sub: '작은 도구를 이어 붙여 큰 일을 한다. 유닉스 철학의 핵심입니다.',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ ls /usr/bin | wc -l</span>
<span class="c">2043</span>                      <span class="c"># /usr/bin 에 명령이 몇 개 있나</span>

<span class="p">$ cat /etc/passwd | head -3</span>
<span class="c">root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin</span>

<span class="p">$ ls -l /var/log | tee snapshot.txt | head -5</span>
<span class="c"># 파일로도 남기고 화면에도 보여준다</span></pre>`,
      foot: '한 번에 완성하려 하지 말고, 한 칸씩 붙이며 중간 결과를 확인하는 습관을 들이세요.',
      nar: `파이프는 세로 막대 기호입니다. 앞 명령의 표준 출력을 뒤 명령의 표준 입력으로 흘려보냅니다. 예를 들어 유에스알 빈 디렉터리의 목록을 더블유씨 대시 엘로 넘기면 명령어가 몇 개 설치돼 있는지 숫자 하나로 나옵니다. 여기서 중요한 태도를 하나 말씀드리겠습니다. 긴 파이프라인을 한 번에 완성하려고 하지 마십시오. 한 칸씩 붙이면서 중간 결과가 예상과 맞는지 눈으로 확인하고 넘어가야 합니다. 이 습관이 앞으로 여드레의 학습 속도를 좌우합니다. 마지막 줄의 티는 특이한데요, 물을 갈라 보내는 티자 관처럼 파일로도 저장하면서 동시에 화면으로도 흘려보냅니다.` },

    { section: true, eb: 'Block 3 · 13:00–15:00', h: '파일 조작 드릴',
      sub: '개념은 이제 충분합니다. 몸에 붙이는 시간입니다.',
      nar: `세 번째 블록은 반복 연습입니다. 오전에 배운 것들을 문제 형태로 계속 풀어 봅니다. 손이 기억하게 만드는 것이 목적입니다.` },

    { eb: 'Drill', h: '이 질문에 답하는 한 줄을 만드세요',
      body: `<div class="rowlist" style="margin-top:1.6cqh">
        <div class="row"><span class="dot">1</span><span class="t">/etc 아래 파일은 몇 개인가</span><span class="d">ls 와 wc 를 잇습니다</span></div>
        <div class="row"><span class="dot">2</span><span class="t">/var/log 에서 가장 큰 파일 5개는</span><span class="d">du 와 sort 와 head 를 잇습니다</span></div>
        <div class="row"><span class="dot">3</span><span class="t">홈 디렉터리의 총 용량은</span><span class="d">du -sh 한 줄이면 됩니다</span></div>
        <div class="row"><span class="dot">4</span><span class="t">오류만 파일로 남기고 화면은 깨끗하게</span><span class="d">2&gt; 를 씁니다</span></div>
      </div>`,
      foot: '정답보다 중요한 것은 중간 결과를 확인하며 쌓아 올린 과정입니다.',
      nar: `이런 형태의 문제를 연속으로 풉니다. 이티씨 아래 파일이 몇 개인지, 바 로그에서 가장 큰 파일 다섯 개가 무엇인지, 홈 디렉터리 전체 용량이 얼마인지 같은 질문에 한 줄로 답하는 연습입니다. 정답을 맞히는 것보다 중요한 것은 중간 결과를 확인하면서 한 칸씩 쌓아 올렸느냐입니다.` },

    { section: true, eb: 'Block 4 · AI LAB · 15:10–17:10', h: '작업공간 설계',
      sub: '어제 만든 빈 폴더에 이제 구조를 넣습니다.',
      nar: `마지막 블록입니다. 어제 만든 에이아이 랩 폴더는 아직 비어 있습니다. 오늘 여기에 열흘 내내 쓸 구조를 설계해서 넣습니다.` },

    { eb: 'AI LAB', h: '~/ai-lab 구조 설계',
      body: `<pre style="margin-top:1.6cqh"><span class="p">~/ai-lab/</span>
├── <span class="p">models/</span>     <span class="c">모델 가중치 — 크고, 다시 받을 수 있는 것</span>
├── <span class="p">datasets/</span>   <span class="c">입력 데이터 — 원본은 절대 수정하지 않는다</span>
├── <span class="p">scripts/</span>    <span class="c">내가 만든 스크립트 — Day 6의 산출물</span>
├── <span class="p">logs/</span>       <span class="c">실행 기록 — 계속 쌓이고, 주기적으로 지운다</span>
└── <span class="p">envs/</span>       <span class="c">파이썬 가상환경 — Day 5에서 채웁니다</span></pre>
      <div class="bannerG" style="margin-top:2cqh">나누는 기준은 "종류"가 아니라 <strong>다시 만들 수 있는가, 지워도 되는가</strong>입니다.</div>`,
      foot: 'Day 6에서 logs/ 를 자동으로 정리하는 스크립트를 만들게 됩니다.',
      nar: `구조는 다섯 개입니다. 모델스에는 모델 가중치를 둡니다. 크지만 다시 내려받을 수 있는 것들입니다. 데이터셋스에는 입력 데이터를 두는데, 원본은 절대 수정하지 않는다는 규칙을 세웁니다. 스크립츠는 내가 만든 것들이라 지우면 안 되고, 로그스는 계속 쌓이니 주기적으로 지워야 합니다. 여기서 중요한 것은 나누는 기준입니다. 그냥 종류별로 나눈 게 아니라, 다시 만들 수 있는가 그리고 지워도 되는가를 기준으로 나눴습니다. 이 기준이 아홉째 날 디스크가 가득 찼을 때 무엇을 지울지 판단하는 근거가 됩니다.` },

    { eb: 'Verify', h: '만들었으면 검증한다',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ mkdir -p ~/ai-lab/{models,datasets,scripts,logs,envs}</span>
<span class="p">$ tree ~/ai-lab</span>
<span class="c">/home/ubuntu/ai-lab
├── datasets
├── envs
├── logs
├── models
└── scripts</span>

<span class="p">$ du -sh ~/ai-lab/* | sort -h</span>   <span class="c"># 용량을 작은 순으로</span></pre>
      <div class="banner" style="margin-top:2cqh">중괄호 확장은 bash의 기능입니다 — 다섯 번 칠 것을 한 번에 끝냅니다.</div>`,
      nar: `한 줄로 다섯 개 폴더를 한꺼번에 만들 수 있습니다. 중괄호 안에 쉼표로 이름을 나열하면 배시가 알아서 펼쳐 줍니다. 만든 다음에는 반드시 검증하십시오. 트리 명령으로 구조가 의도대로 나왔는지 눈으로 보고, 디유 대시 에스에이치로 각 폴더의 용량을 확인합니다. 오늘은 전부 비어 있어서 재미없겠지만, 아홉째 날쯤 되면 이 명령이 어느 폴더가 디스크를 먹고 있는지 알려 주는 중요한 도구가 됩니다.` }
  ],

  assignment: {
    title: '작업공간 구조도와 용량 보고서',
    lede: '어제 만든 작업공간에 구조를 넣고, 그 상태를 명령어로 증명합니다.',
    items: [
      'ai-lab 하위 5개 디렉터리 생성',
      'tree 출력 캡처',
      '디렉터리별 용량을 큰 순서로 정렬',
      '/var/log 상위 5개 파일 찾기',
      '정상 출력과 오류를 각각 다른 파일로',
      '각 항목에 사용한 명령 병기'
    ],
    note: '3번과 4번은 파이프를 두 개 이상 이어야 풀립니다. 한 줄로 만들어낸 과정을 함께 적으면 가산점입니다.',
    sample: `<span class="o">학번 / 이름 : 20261234 / 홍길동

3. 디렉터리별 용량 (큰 순)
   명령 : du -sh ~/ai-lab/* | sort -hr
   결과 : ...</span>`,
    nar: `과제입니다. 오늘 만든 작업공간의 구조도를 제출하고, 디렉터리별 용량을 큰 순서로 정렬해 보여주십시오. 그리고 바 로그에서 가장 큰 파일 다섯 개를 찾는 한 줄과, 정상 출력과 오류를 각각 다른 파일로 갈라 담는 한 줄을 만들어 오십시오. 세 번째와 네 번째는 파이프를 두 개 이상 이어야 풀립니다. 답만 적지 말고 어떻게 쌓아 올렸는지 과정을 함께 적으면 가산점을 드립니다.` },

  wrap: {
    done: '파일시스템을 지도로 익히고, 출력을 갈라 담고 이어 붙이는 법을 배웠습니다.',
    next: '내일 · Day 3 — 텍스트 처리와 데이터 해부',
    nextDesc: '오늘 만든 파이프에 grep과 awk를 얹어, 10만 줄짜리 학습 로그에서 원하는 숫자를 뽑아냅니다.',
    nar: `오늘 한 일을 정리하겠습니다. 리눅스 파일시스템의 지도를 익혔고, 파일의 종류와 메타데이터를 읽는 법을 배웠고, 링크와 아카이브를 다뤘습니다. 그리고 오늘의 핵심인 리다이렉션과 파이프를 익혔습니다. 내일은 이 파이프 위에 그렙과 오크를 얹습니다. 십만 줄짜리 학습 로그에서 원하는 숫자만 뽑아내는 진짜 데이터 작업을 하게 됩니다. 수고하셨습니다.` },

  /* ================= 실습 가이드 ================= */
  lab: {
    h1: '파일시스템과 파이프',
    standfirst: '오늘은 두 가지를 손에 넣습니다. 리눅스 어디에 무엇이 있는지 아는 감각, 그리고 명령을 이어 붙여 질문에 답하는 기술입니다. 미션은 순서대로 쌓이니 건너뛰지 마세요.',
    rules: [
      ['예상하고 실행한다', '명령을 치기 전에 어떤 결과가 나올지 먼저 말해 보고 확인하세요. 이 습관이 학습 속도를 두 배로 만듭니다.'],
      ['한 칸씩 쌓는다', '파이프라인을 한 번에 완성하려 하지 마세요. 한 명령씩 붙이며 중간 결과를 봅니다.'],
      ['&gt; 는 덮어쓴다', '꺾쇠 하나는 기존 파일을 지우고 씁니다. 중요한 파일 이름을 쓰지 마세요.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '파일시스템 탐험', time: '13:00–14:00',
        lede: '남의 서버에 처음 들어가도 길을 찾을 수 있게, 주요 디렉터리를 직접 열어 봅니다.',
        missions: [
          { n: 1, h: '지도 훑어보기', body: `
      <p>최상위부터 시작합니다. 각 디렉터리를 열어 보고 <strong>무엇이 들어 있는지 한 문장으로</strong> 말할 수 있어야 합니다.</p>
      <pre><span class="p">$</span> ls /
<span class="p">$</span> ls /etc | head -20
<span class="p">$</span> ls /var/log
<span class="p">$</span> ls /usr/bin | head -10
<span class="p">$</span> ls /home</pre>
      <div class="box q"><span class="lbl">확인 질문</span><ul>
        <li><code>/etc</code>에 들어 있는 것들의 공통점은 무엇인가요?</li>
        <li><code>/usr/bin</code>에 있는 이름 중 어제 배운 명령이 보이나요?</li>
      </ul></div>` },
          { n: 2, h: '커널이 만드는 가짜 파일', body: `
      <p><code>/proc</code>은 디스크에 존재하지 않습니다. 커널이 그 순간에 만들어 보여주는 파일입니다.</p>
      <pre><span class="p">$</span> cat /proc/cpuinfo | head -15
<span class="p">$</span> cat /proc/meminfo | head -5
<span class="p">$</span> ls -l /proc/uptime
<span class="o">-r--r--r-- 1 root root 0 Sep 16 09:20 /proc/uptime</span>   <span class="c">← 크기가 0인데 내용이 있습니다</span>
<span class="p">$</span> cat /proc/uptime</pre>
      <div class="box check"><span class="lbl">"모든 것이 파일이다"</span>
        <p>크기가 0으로 표시되는데 <code>cat</code>하면 내용이 나옵니다. 디스크에 저장된 게 아니라 읽는 순간 커널이 만들어 주기 때문입니다. 리눅스가 장치와 프로세스를 전부 파일처럼 다룬다는 뜻입니다.</p></div>` },
          { n: 3, h: 'ls -l 한 줄 완전 해부', body: `
      <pre><span class="p">$</span> ls -lh /var/log | head -6</pre>
      <p>출력의 각 열이 무엇인지 옆 사람과 서로 설명해 보세요. 맨 앞 글자가 <code>-</code>, <code>d</code>, <code>l</code> 인 줄을 각각 하나씩 찾습니다.</p>
      <div class="box q"><span class="lbl">확인 질문</span><p><code>-h</code>를 빼면 무엇이 달라지나요? 어제 미션 6에서 찾아낸 그 옵션이 맞나요?</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '링크와 아카이브', time: '14:00–15:00',
        missions: [
          { n: 4, h: '심볼릭 링크 만들고 끊어 보기', body: `
      <pre><span class="p">$</span> cd ~ &amp;&amp; mkdir -p linktest &amp;&amp; cd linktest
<span class="p">$</span> echo "원본 내용" &gt; original.txt
<span class="p">$</span> ln -s original.txt shortcut.txt
<span class="p">$</span> ls -l
<span class="o">lrwxrwxrwx 1 ubuntu ubuntu   12 Sep 16 14:05 shortcut.txt -&gt; original.txt
-rw-r--r-- 1 ubuntu ubuntu   13 Sep 16 14:05 original.txt</span>

<span class="p">$</span> cat shortcut.txt
<span class="o">원본 내용</span>

<span class="p">$</span> rm original.txt
<span class="p">$</span> cat shortcut.txt
<span class="o">cat: shortcut.txt: No such file or directory</span>   <span class="c">← 링크가 끊어졌습니다</span></pre>
      <div class="box q"><span class="lbl">확인 질문</span><p>링크는 남아 있는데 왜 파일이 없다고 할까요? 링크가 저장하고 있는 것은 무엇일까요?</p></div>` },
          { n: 5, h: '묶고 압축하고 풀기', body: `
      <pre><span class="p">$</span> cd ~ &amp;&amp; mkdir -p tartest/sub &amp;&amp; cd tartest
<span class="p">$</span> echo a &gt; a.txt; echo b &gt; b.txt; echo c &gt; sub/c.txt
<span class="p">$</span> cd ~
<span class="p">$</span> tar -czf tartest.tar.gz tartest/
<span class="p">$</span> ls -lh tartest.tar.gz

<span class="p">$</span> tar -tzf tartest.tar.gz        <span class="c"># 풀기 전에 목록부터 확인</span>
<span class="p">$</span> mkdir -p restore &amp;&amp; tar -xzf tartest.tar.gz -C restore
<span class="p">$</span> tree restore</pre>
      <div class="box warn"><span class="lbl">습관</span><p>남이 준 압축 파일은 <strong>풀기 전에 <code>-t</code>로 목록을 먼저 보세요.</strong> 현재 폴더에 파일을 쏟아붓는 아카이브가 있습니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '리다이렉션과 파이프', time: '15:10–16:10',
        lede: '오늘의 핵심입니다. 여기서 막히면 내일 훨씬 힘들어집니다.',
        missions: [
          { n: 6, h: '출력을 갈라 담기', body: `
      <pre><span class="p">$</span> cd ~ &amp;&amp; mkdir -p redir &amp;&amp; cd redir

<span class="p">$</span> ls /etc &gt; ok.txt
<span class="p">$</span> wc -l ok.txt

<span class="p">$</span> ls /없는경로
<span class="o">ls: cannot access '/없는경로': No such file or directory</span>

<span class="p">$</span> ls /없는경로 &gt; out.txt
<span class="o">ls: cannot access '/없는경로': No such file or directory</span>   <span class="c">← 파일로 안 갔습니다!</span>
<span class="p">$</span> cat out.txt
<span class="c"># 비어 있습니다</span>

<span class="p">$</span> ls /없는경로 2&gt; err.txt          <span class="c"># 오류는 2번 통로로</span>
<span class="p">$</span> cat err.txt</pre>
      <div class="box check"><span class="lbl">오늘 가장 중요한 발견</span>
        <p>오류 메시지는 <code>&gt;</code>로 잡히지 않습니다. 다른 통로(2번)로 나오기 때문입니다. 이걸 모르면 "분명 파일로 보냈는데 화면에 뜬다"며 한참 헤매게 됩니다.</p></div>` },
          { n: 7, h: '합치고 버리기', body: `
      <pre><span class="p">$</span> ls /etc /없는경로 &gt; both.txt 2&gt;&amp;1
<span class="p">$</span> head -3 both.txt
<span class="p">$</span> tail -1 both.txt

<span class="p">$</span> ls /없는경로 2&gt; /dev/null       <span class="c"># 오류를 버린다 — 화면이 조용합니다</span>
<span class="p">$</span> ls /etc &gt; /dev/null 2&gt;&amp;1       <span class="c"># 둘 다 버린다</span></pre>
      <div class="box q"><span class="lbl">확인 질문</span><p>Day 6에서 자동 실행 스크립트를 만들 때 <code>&gt; /dev/null 2&gt;&amp;1</code>을 자주 쓰게 됩니다. 왜 필요할까요?</p></div>` },
          { n: 8, h: '파이프로 질문에 답하기', body: `
      <p>한 번에 완성하지 말고 <strong>한 칸씩 붙이며</strong> 중간 결과를 확인하세요.</p>
      <pre><span class="p">$</span> ls /usr/bin | head
<span class="p">$</span> ls /usr/bin | wc -l              <span class="c"># 설치된 명령 개수</span>

<span class="p">$</span> du -sh /var/log/*                <span class="c"># 1단계</span>
<span class="p">$</span> du -sh /var/log/* | sort -hr     <span class="c"># 2단계: 큰 순으로</span>
<span class="p">$</span> du -sh /var/log/* | sort -hr | head -5   <span class="c"># 3단계: 상위 5개</span>

<span class="p">$</span> ls -l /var/log | tee snap.txt | wc -l    <span class="c"># 저장하며 흘려보내기</span>
<span class="p">$</span> cat snap.txt | head -3</pre>
      <div class="box check"><span class="lbl">이 3단계 방식을 외우세요</span>
        <p>긴 파이프라인은 전부 이렇게 만들어집니다. 앞에서부터 한 칸씩 붙이고, 매번 <code>head</code>로 결과를 확인하고 넘어갑니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 4', h: '작업공간 설계', time: '16:10–17:10',
        lede: '어제 만든 빈 폴더에 열흘간 쓸 구조를 넣습니다.',
        missions: [
          { n: 9, h: '한 줄로 구조 만들기', body: `
      <pre><span class="p">$</span> mkdir -p ~/ai-lab/{models,datasets,scripts,logs,envs}
<span class="p">$</span> tree ~/ai-lab
<span class="o">/home/ubuntu/ai-lab
├── datasets
├── envs
├── logs
├── models
└── scripts</span></pre>
      <div class="box check"><span class="lbl">중괄호 확장</span>
        <p>쉼표로 나열하면 bash가 알아서 펼칩니다. <code>echo ~/ai-lab/{a,b,c}</code>를 쳐서 무엇으로 펼쳐지는지 직접 보세요.</p></div>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>이 다섯 개를 나눈 기준은 "종류"가 아닙니다. <strong>다시 만들 수 있는가, 지워도 되는가</strong>입니다. 다섯 개를 이 기준으로 분류해 보세요.</p></div>` },
          { n: 10, h: '상태를 기록으로 남기기', body: `
      <pre><span class="p">$</span> cd ~/ai-lab
<span class="p">$</span> tree . &gt; logs/structure.txt
<span class="p">$</span> du -sh ./* | sort -h &gt;&gt; logs/structure.txt
<span class="p">$</span> date &gt;&gt; logs/structure.txt
<span class="p">$</span> cat logs/structure.txt</pre>
      <div class="box check"><span class="lbl">오늘의 마지막</span>
        <p>구조를 만들고, 그 상태를 파일로 남기고, 시각까지 기록했습니다. 이것이 Day 6에서 만들 자동화 스크립트의 원형입니다.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>&gt;</code>로 보냈는데 화면에 뜬다', '그건 표준 에러', '<code>2&gt;</code> 또는 <code>2&gt;&amp;1</code>을 씁니다'],
      ['<code>tree: command not found</code>', '미설치', '<code>sudo apt install -y tree</code>'],
      ['<code>Permission denied</code> (/root 등)', '남의 영역', '정상입니다. 내 홈 안에서 연습하세요'],
      ['<code>tar: Removing leading `/`</code>', '절대경로로 묶음', '경고일 뿐 정상 동작합니다'],
      ['링크를 <code>cat</code>하면 No such file', '원본이 사라짐', '<code>ls -l</code>로 링크가 가리키는 곳을 확인'],
      ['파일이 통째로 사라졌다', '<code>&gt;</code>로 덮어씀', '복구 불가. 이름을 확인하는 습관으로 예방합니다']
    ],
    checklist: [
      '<code>/etc</code> <code>/var</code> <code>/home</code> <code>/usr</code> <code>/proc</code>이 각각 무엇을 담는지 말할 수 있다',
      '<code>ls -lh</code> 출력에서 종류·소유자·크기를 읽어낼 수 있다',
      '심볼릭 링크를 만들고, 원본을 지우면 어떻게 되는지 확인했다',
      '<code>tar</code>로 묶고 목록을 보고 다른 폴더에 풀어 봤다',
      '표준 출력과 표준 에러를 각각 다른 파일로 보냈다',
      '<code>2&gt;&amp;1</code>과 <code>/dev/null</code>의 뜻을 안다',
      '파이프를 한 칸씩 쌓아 상위 5개를 뽑아냈다',
      '<code>~/ai-lab</code> 아래 5개 디렉터리가 만들어져 있다',
      '<code>logs/structure.txt</code>에 구조와 용량과 시각이 기록돼 있다'
    ]
  },

  /* ================= 퀴즈 ================= */
  quizTitle: '파일시스템과 파이프 퀴즈',
  quiz: [
    { q: '설정 파일들이 모여 있는 디렉터리는?', o: ['/etc', '/var', '/usr', '/opt'], a: 0,
      e: '<code>/etc</code>는 시스템과 서비스의 설정 파일 자리입니다. Day 7의 systemd 설정도 여기서 다룹니다.' },
    { q: '로그가 쌓여서 디스크를 가장 자주 채우는 곳은?', o: ['/var', '/etc', '/home', '/proc'], a: 0,
      e: '<code>/var</code>는 변하는 데이터의 자리이고 <code>/var/log</code>에 로그가 쌓입니다. Day 9에서 다시 만납니다.' },
    { q: '<code>ls -l</code> 출력의 맨 앞 글자가 <code>l</code>이면?', o: ['심볼릭 링크', '잠긴 파일', '큰 파일', '로그 파일'], a: 0,
      e: '<code>-</code> 일반 파일, <code>d</code> 디렉터리, <code>l</code> 링크입니다.' },
    { q: '<code>/proc/uptime</code>의 크기가 0인데 <code>cat</code>하면 내용이 나오는 이유는?', o: ['디스크에 없고 커널이 읽는 순간 만들어 준다', '파일이 손상됐다', '권한이 없어서 크기가 숨겨졌다', '압축되어 있다'], a: 0,
      e: '<code>/proc</code>은 가상 파일시스템입니다. "모든 것이 파일이다"라는 말이 실제로 구현된 모습입니다.' },
    { q: '원본을 가리키는 이름표를 만드는 명령은? (직접 입력 — 옵션 포함)', t: true, acc: ['ln -s', 'ln -s 원본 링크'], ans: 'ln -s',
      e: '<code>-s</code>는 symbolic입니다. 링크는 데이터가 아니라 "경로 문자열"을 저장합니다.' },
    { q: '압축 아카이브를 <strong>풀지 않고</strong> 내용 목록만 보려면?', o: ['tar -tzf a.tar.gz', 'tar -xzf a.tar.gz', 'tar -czf a.tar.gz', 'tar -lzf a.tar.gz'], a: 0,
      e: '<code>t</code>는 list입니다. 남이 준 아카이브는 풀기 전에 목록을 먼저 확인하는 것이 안전합니다.' },
    { q: '폴더를 묶고 gzip으로 압축해 <code>logs.tar.gz</code>를 만드는 명령은? (직접 입력)', t: true, acc: ['tar -czf logs.tar.gz logs', 'tar -czf logs.tar.gz logs/', 'tar czf logs.tar.gz logs', 'tar czf logs.tar.gz logs/'], ans: 'tar -czf logs.tar.gz logs/',
      e: 'c는 create, z는 gzip, f는 뒤에 파일 이름이 온다는 표시입니다.' },
    { q: '명령에 있는 세 개의 통로가 아닌 것은?', o: ['stdlog', 'stdin', 'stdout', 'stderr'], a: 0,
      e: '입력 하나(stdin), 출력 둘(stdout, stderr)입니다. 로그 전용 통로는 없습니다.' },
    { q: '아래에서 <code>out.txt</code>가 비어 있는 이유는?',
      pre: "<span class='p'>$</span> ls /없는경로 &gt; out.txt\n<span class='c'>ls: cannot access '/없는경로': No such file or directory</span>",
      o: ['오류 메시지는 표준 에러로 나가서 &gt; 에 잡히지 않는다', '경로가 없으면 파일도 안 만들어진다', '&gt; 는 디렉터리에만 쓸 수 있다', '권한이 부족하다'], a: 0,
      e: '오류를 파일로 보내려면 <code>2&gt;</code>를 써야 합니다. 오늘 가장 중요한 지점입니다.' },
    { q: '정상 출력과 오류를 <strong>한 파일에 합쳐</strong> 담는 표기는?', o: ['&gt; out.txt 2&gt;&amp;1', '&gt; out.txt 2&gt; out.txt', '&gt;&gt; out.txt', '1&gt;2 out.txt'], a: 0,
      e: '<code>2&gt;&amp;1</code>은 "2번 통로를 1번이 가는 곳으로 함께 보내라"는 뜻입니다. 순서가 중요해서 <code>&gt;</code> 뒤에 씁니다.' },
    { q: '<code>/dev/null</code>은 무엇인가요?', o: ['보낸 것이 사라지는 곳', '기본 로그 파일', '임시 폴더', '휴지통'], a: 0,
      e: '리눅스의 블랙홀입니다. 필요 없는 출력을 버릴 때 씁니다. Day 6의 자동 실행 스크립트에서 자주 만납니다.' },
    { q: '<code>&gt;</code>와 <code>&gt;&gt;</code>의 차이는?', o: ['&gt; 는 덮어쓰기, &gt;&gt; 는 이어붙이기', '&gt; 는 파일, &gt;&gt; 는 폴더', '&gt; 는 출력, &gt;&gt; 는 에러', '차이가 없다'], a: 0,
      e: '<code>&gt;</code>는 기존 내용을 지웁니다. 중요한 파일 이름을 잘못 쓰면 그 자리에서 사라집니다.' },
    { q: '<code>/usr/bin</code>에 명령이 몇 개 있는지 세는 한 줄은? (직접 입력)', t: true, acc: ['ls /usr/bin | wc -l', 'ls /usr/bin|wc -l'], ans: 'ls /usr/bin | wc -l',
      e: '목록을 만들어 줄 수를 세는 전형적인 2단 파이프입니다.' },
    { q: '파일로도 저장하면서 동시에 다음 명령으로 흘려보내는 명령은?', o: ['tee', 'cat', 'split', 'dup'], a: 0,
      e: '물을 갈라 보내는 T자 관에서 온 이름입니다. 중간 결과를 남기며 파이프라인을 이어갈 때 씁니다.' },
    { q: '<code>/var/log</code>에서 용량이 큰 상위 5개를 뽑는 파이프라인 순서로 알맞은 것은?', o: ['du -sh /var/log/* | sort -hr | head -5', 'du -sh /var/log/* | head -5 | sort -hr', 'sort -hr /var/log/* | du -sh | head -5', 'head -5 /var/log/* | du -sh | sort'], a: 0,
      e: '재고 → 정렬 → 자르기 순서입니다. 자르기를 먼저 하면 정렬 전의 임의의 5개만 남습니다.' },
    { q: '긴 파이프라인을 만드는 올바른 태도는?', o: ['한 칸씩 붙이며 중간 결과를 확인한다', '한 번에 완성한 뒤 결과만 본다', '먼저 검색해서 통째로 복사한다', '길수록 좋으니 최대한 이어 붙인다'], a: 0,
      e: '중간 결과를 확인하지 않고 쌓으면 어디서 틀렸는지 찾을 수 없습니다.' },
    { q: '<code>~/ai-lab</code>의 다섯 폴더 중 <strong>지워도 다시 만들 수 있는</strong> 쪽에 가까운 것은?', o: ['logs', 'scripts', 'datasets', '전부 지우면 안 된다'], a: 0,
      e: '로그는 계속 쌓이고 주기적으로 지워야 합니다. 반면 <code>scripts</code>는 내가 만든 것이라 지우면 복구가 어렵습니다. 이 기준이 Day 9 디스크 관리의 근거가 됩니다.' },
    { q: '다섯 개 폴더를 한 줄로 만드는 표기는?', o: ['mkdir -p ~/ai-lab/{models,datasets,scripts,logs,envs}', 'mkdir -p ~/ai-lab/[models,datasets]', 'mkdir -a ~/ai-lab/*', 'mkdir ~/ai-lab/models datasets'], a: 0,
      e: '중괄호 확장은 bash의 기능입니다. <code>echo</code>로 먼저 펼쳐 보면 무슨 일이 일어나는지 눈으로 확인할 수 있습니다.' }
  ]
};
