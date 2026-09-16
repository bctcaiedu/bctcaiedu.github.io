module.exports = {
  day: 6,
  title: '셸 스크립팅과 자동화',
  theme: '실험은 손으로 돌리지 않는다',

  openingNar: `여섯째 날입니다. 지금까지 닷새 동안 손으로 명령을 쳤습니다. 오늘은 그것을 스크립트로 묶습니다. 인공지능 작업의 본질은 반복입니다. 하이퍼파라미터를 바꿔가며 수십 번 돌리고, 데이터를 매번 같은 방식으로 정제하고, 결과를 모읍니다. 손으로 하면 실수가 섞이고 재현이 안 됩니다. 오늘 그 반복을 기계에 넘깁니다.`,

  goals: [
    ['스크립트의 기본 문법을', '변수·조건·반복·함수까지 쓸 수 있다'],
    ['인용부호 규칙을', '이해하고 공백이 든 값을 안전하게 다룰 수 있다'],
    ['안전장치를', 'set -euo pipefail 과 trap 으로 걸 수 있다'],
    ['getopts로', '옵션을 받는 재사용 가능한 스크립트를 만들 수 있다'],
    ['xargs -P 로', '여러 작업을 병렬로 돌릴 수 있다'],
    ['cron과 timer로', '정기 작업을 예약하고 동작을 확인할 수 있다']
  ],
  goalsNar: `목표는 여섯 개입니다. 문법을 익히고, 인용부호 규칙을 확실히 하고, 스크립트가 조용히 망가지지 않도록 안전장치를 걸고, 옵션을 받는 재사용 가능한 형태로 만들고, 병렬로 돌리고, 마지막으로 정기 실행을 예약합니다.`,

  blocks: [
    { time: '09:00–11:00', title: '스크립트 문법', desc: '변수 · 인용부호 · 조건 · 반복 · 함수' },
    { time: '11:10–12:00', title: '안전장치와 옵션', desc: 'set -euo · trap · getopts · xargs -P' },
    { time: '13:00–15:00', title: '전처리 파이프라인 스크립트화', desc: 'Day 3의 한 줄을 도구로' },
    { time: '15:10–17:10', title: '배치 러너와 정기 실행', desc: '실험 자동화 + timer 등록' }
  ],
  blocksNar: `오전에 문법과 안전장치를 배우고, 오후에는 실제로 쓸 도구 두 개를 만듭니다. 하나는 셋째 날 손으로 친 정제 파이프라인을 스크립트로 승격하는 것이고, 다른 하나는 프롬프트 목록을 읽어 반복 실행하는 배치 러너입니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–11:00', h: '스크립트 문법',
      sub: '새 언어를 배우는 게 아닙니다. 지금까지 친 명령을 파일에 담는 것입니다.',
      nar: `첫 번째 블록입니다. 겁먹지 마십시오. 셸 스크립트는 새로운 프로그래밍 언어가 아닙니다. 지금까지 터미널에 치던 명령을 파일에 순서대로 적어 두는 것이 전부이고, 거기에 변수와 조건과 반복이 조금 얹힐 뿐입니다.` },

    { eb: 'Anatomy', h: '스크립트의 뼈대',
      body: `<pre style="margin-top:1.6cqh"><span class="p">#!/usr/bin/env bash</span>          <span class="c"># shebang — 무엇으로 실행할지</span>
<span class="p">set -euo pipefail</span>             <span class="c"># 안전장치 (뒤에서 설명)</span>

<span class="p">NAME="qwen2.5:1.5b"</span>           <span class="c"># 변수 — = 양옆에 공백 없음!</span>
<span class="p">COUNT=5</span>

<span class="p">echo "모델: $NAME, 횟수: $COUNT"</span>

<span class="c"># 실행 권한을 주고 실행</span>
<span class="c"># $ chmod +x run.sh</span>
<span class="c"># $ ./run.sh</span></pre>`,
      foot: '변수 대입에서 = 양옆에 공백을 넣으면 오류입니다. 가장 흔한 첫 실수입니다.',
      nar: `스크립트의 첫 줄은 셔뱅이라고 부르는 특별한 주석입니다. 이 파일을 무엇으로 실행할지 알려 줍니다. 그다음 줄의 셋 명령이 안전장치인데 잠시 후에 설명합니다. 변수는 이름 등호 값 형태로 만드는데, 여기서 첫 번째 함정이 나옵니다. 등호 양옆에 공백을 넣으면 안 됩니다. 셸은 공백을 기준으로 단어를 나누기 때문에 공백이 들어가면 전혀 다른 뜻이 됩니다. 값을 쓸 때는 달러를 앞에 붙입니다.` },

    { eb: 'Quoting', h: '따옴표 하나로 스크립트가 망가진다',
      body: `<pre style="margin-top:1.6cqh"><span class="p">FILE="my data.txt"</span>

<span class="p">rm $FILE</span>      <span class="c"># 위험! "my" 와 "data.txt" 두 개로 쪼개집니다</span>
<span class="p">rm "$FILE"</span>    <span class="c"># 안전. 하나의 이름으로 다룹니다</span>

<span class="p">echo "값은 $NAME"</span>     <span class="c"># 큰따옴표: 변수가 풀립니다</span>
<span class="p">echo '값은 $NAME'</span>     <span class="c"># 작은따옴표: 글자 그대로 $NAME</span></pre>
      <div class="banner" style="margin-top:2cqh">규칙 하나만 기억하세요 — <strong>변수는 항상 큰따옴표로 감싼다.</strong></div>`,
      foot: '경로에 공백이 들어간 파일 하나 때문에 배치가 통째로 망가지는 일이 흔합니다.',
      nar: `여기가 오늘 가장 중요한 지점입니다. 파일 이름에 공백이 들어 있을 때, 변수를 따옴표 없이 쓰면 셸이 공백에서 잘라 두 개의 인자로 만들어 버립니다. 삭제 명령에서 이런 일이 벌어지면 엉뚱한 파일이 지워집니다. 규칙은 하나입니다. 변수는 항상 큰따옴표로 감싸십시오. 큰따옴표는 변수를 풀어 주고, 작은따옴표는 글자 그대로 둡니다. 이 차이도 함께 기억하십시오.` },

    { eb: 'Control', h: '조건과 반복',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># 조건</span>
<span class="p">if [[ -f "$FILE" ]]; then</span>
    echo "파일이 있습니다"
<span class="p">elif [[ -d "$FILE" ]]; then</span>
    echo "디렉터리입니다"
<span class="p">else</span>
    echo "없습니다"; exit 1
<span class="p">fi</span>

<span class="c"># 반복</span>
<span class="p">for f in ~/ai-lab/datasets/*.jsonl; do</span>
    echo "처리 중: $f"
<span class="p">done</span>

<span class="p">for i in $(seq 1 5); do echo "회차 $i"; done</span>

<span class="p">while read -r line; do echo "&gt; $line"; done &lt; prompts.txt</span></pre>`,
      foot: '-f 파일 존재, -d 디렉터리, -z 빈 문자열, -n 비지 않음 — 이 넷이면 충분합니다.',
      nar: `조건문은 이프 대괄호 두 개로 씁니다. 대시 에프는 파일이 있는지, 대시 디는 디렉터리인지, 대시 지는 문자열이 비었는지를 봅니다. 반복문은 세 가지 형태를 쓰게 됩니다. 파일 목록을 도는 포 문, 숫자를 도는 시퀀스, 그리고 파일을 한 줄씩 읽는 와일 리드입니다. 마지막 형태가 프롬프트 목록을 읽어 처리할 때 쓰는 패턴이라 오늘 오후에 실제로 씁니다.` },

    { eb: 'Functions', h: '함수와 인자',
      body: `<pre style="margin-top:1.6cqh"><span class="p">log() {</span>
    echo "[$(date +%H:%M:%S)] $*"
<span class="p">}</span>

<span class="p">run_one() {</span>
    local name="$1"          <span class="c"># 첫 번째 인자</span>
    local count="$2"
    log "실행: $name ($count회)"
<span class="p">}</span>

<span class="p">run_one "qwen" 3</span>

<span class="c"># 스크립트 자체의 인자</span>
<span class="c">$0  스크립트 이름    $1 $2  첫째·둘째 인자
$#  인자 개수        $@     인자 전체
$?  직전 명령의 종료 코드</span></pre>`,
      foot: 'local 을 빼면 함수 밖 변수를 덮어씁니다 — 긴 스크립트에서 찾기 어려운 버그가 됩니다.',
      nar: `함수는 이름에 소괄호를 붙이고 중괄호로 감쌉니다. 함수 안에서 달러 일은 첫 번째 인자입니다. 변수를 선언할 때 로컬을 붙이는 습관을 들이십시오. 안 붙이면 함수 밖의 같은 이름 변수를 덮어써 버려서, 긴 스크립트에서 찾기 아주 어려운 버그가 됩니다. 로그 함수처럼 시각을 찍어 주는 작은 함수 하나를 만들어 두면 모든 스크립트가 읽기 편해집니다.` },

    { section: true, eb: 'Block 2 · 11:10–12:00', h: '안전장치와 옵션',
      sub: '스크립트가 조용히 망가지는 것을 막습니다.',
      nar: `두 번째 블록입니다. 스크립트의 가장 무서운 점은 중간에 실패해도 그냥 다음 줄로 넘어간다는 것입니다. 그래서 절반만 처리된 데이터를 만들어 놓고 성공한 척합니다. 그걸 막는 장치를 겁니다.` },

    { eb: 'set -euo pipefail', h: '네 글자로 거는 안전장치',
      body: `<div class="rowlist" style="margin-top:1.6cqh">
        <div class="row"><span class="dot">e</span><span class="t">errexit</span><span class="d">명령 하나라도 실패하면 즉시 중단</span></div>
        <div class="row"><span class="dot">u</span><span class="t">nounset</span><span class="d">정의 안 된 변수를 쓰면 오류 — 오타를 잡아 줍니다</span></div>
        <div class="row"><span class="dot">o</span><span class="t">pipefail</span><span class="d">파이프 중간이 실패해도 전체를 실패로 처리</span></div>
      </div>
      <pre style="margin-top:2cqh"><span class="c"># 없으면: 실패해도 계속 갑니다</span>
cd /없는경로
rm -rf *          <span class="c">← 엉뚱한 곳에서 실행됩니다!</span>

<span class="c"># set -e 가 있으면 cd 에서 멈춥니다</span></pre>`,
      foot: '이 한 줄이 없어서 벌어진 사고가 실제로 많습니다. 모든 스크립트 두 번째 줄에 넣으세요.',
      nar: `셋 대시 이유오 파이프페일은 네 글자로 거는 안전장치입니다. 이는 명령이 하나라도 실패하면 즉시 중단하라는 뜻입니다. 유는 정의하지 않은 변수를 쓰면 오류를 내라는 뜻인데, 변수 이름 오타를 잡아 줍니다. 파이프페일은 파이프 중간에서 실패해도 전체를 실패로 처리합니다. 아래 예시를 보십시오. 존재하지 않는 경로로 이동을 시도하고 실패했는데 그냥 넘어가면, 다음 줄의 삭제 명령이 원래 있던 자리에서 실행됩니다. 이 한 줄이 없어서 벌어진 사고가 실제로 많습니다.` },

    { eb: 'trap', h: 'trap — 어떻게 끝나든 뒷정리',
      body: `<pre style="margin-top:1.6cqh"><span class="p">TMPDIR=$(mktemp -d)</span>
<span class="p">cleanup() {</span>
    rm -rf "$TMPDIR"
    echo "임시 파일 정리 완료"
<span class="p">}</span>
<span class="p">trap cleanup EXIT</span>      <span class="c"># 정상 종료·오류·Ctrl+C 모두</span>

<span class="c"># 이제 무슨 일이 있어도 TMPDIR 은 지워집니다</span></pre>`,
      foot: 'mktemp -d 는 충돌하지 않는 임시 디렉터리를 만들어 줍니다. /tmp/mydir 같은 고정 이름은 쓰지 마세요.',
      nar: `트랩은 스크립트가 어떻게 끝나든 반드시 실행할 뒷정리를 등록합니다. 정상 종료든 오류든 사용자가 컨트롤 씨를 누르든 상관없이 실행됩니다. 임시 파일을 만드는 스크립트에는 거의 항상 필요합니다. 엠케이템프 대시 디는 다른 프로세스와 충돌하지 않는 임시 디렉터리를 만들어 줍니다. 고정된 이름을 쓰면 두 개가 동시에 돌 때 서로의 파일을 덮어쓰게 됩니다.` },

    { eb: 'getopts', h: '재사용 가능한 스크립트 만들기',
      body: `<pre style="margin-top:1.6cqh"><span class="p">usage() { echo "사용법: $0 -m 모델 -n 횟수 [-o 출력]"; exit 1; }</span>

<span class="p">OUT="result.csv"</span>
<span class="p">while getopts "m:n:o:h" opt; do</span>
  case "$opt" in
    m) MODEL="$OPTARG" ;;
    n) COUNT="$OPTARG" ;;
    o) OUT="$OPTARG" ;;
    h|*) usage ;;
  esac
<span class="p">done</span>
<span class="p">[[ -z "\${MODEL:-}" ]] &amp;&amp; usage</span>

<span class="c"># $ ./run.sh -m qwen2.5:1.5b -n 10 -o out.csv</span></pre>`,
      foot: '내가 만든 도구도 남이 쓸 수 있어야 합니다. 사용법을 출력하는 것부터가 시작입니다.',
      nar: `겟옵츠는 대시 엠, 대시 엔 같은 옵션을 받게 해 줍니다. 콜론이 붙은 글자는 값을 함께 받는다는 뜻입니다. 이렇게 만들면 스크립트를 고치지 않고도 모델과 횟수를 바꿔 가며 쓸 수 있습니다. 여기서 좋은 습관 하나. 필수 옵션이 빠졌을 때 사용법을 출력하고 종료하게 만드십시오. 내가 만든 도구도 남이 쓸 수 있어야 하고, 사실 삼 개월 뒤의 나 자신이 바로 그 남입니다.` },

    { eb: 'Parallel', h: 'xargs -P — 병렬로 돌리기',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># 순차: 10개 × 3초 = 30초</span>
<span class="p">for f in *.jsonl; do process "$f"; done</span>

<span class="c"># 병렬: 4개씩 동시에 = 약 8초</span>
<span class="p">ls *.jsonl | xargs -P 4 -I{} ./process.sh {}</span>

<span class="p">nproc</span>                    <span class="c"># 코어 수 확인</span>
<span class="p">ls *.jsonl | xargs -P "$(nproc)" -I{} ./process.sh {}</span></pre>
      <div class="banner" style="margin-top:2cqh">코어 수보다 많이 띄우면 오히려 느려집니다 — Day 4에서 본 CPU 경합입니다.</div>`,
      nar: `엑스아그스에 대시 대문자 피를 주면 여러 개를 동시에 돌립니다. 열 개짜리 작업이 순차로는 삼십 초 걸리는데 네 개씩 병렬로 돌리면 팔 초에 끝납니다. 엔프록으로 코어 수를 확인하고 그 수에 맞추면 됩니다. 다만 코어 수보다 많이 띄우면 오히려 느려집니다. 넷째 날에 본 시피유 경합 때문입니다. 무작정 늘리는 게 답이 아니라는 것을 오후 실습에서 측정으로 확인합니다.` },

    { eb: 'Scheduling', h: 'cron과 systemd timer',
      body: `<div class="grid g2" style="margin-top:1.6cqh">
        <div class="card"><span class="n">cron</span><span class="t">간단하고 어디에나 있다</span><span class="d">crontab -e 로 한 줄 추가<br>분 시 일 월 요일 명령<br><br>로그가 남지 않아 실패해도 모를 수 있습니다</span></div>
        <div class="card"><span class="n">systemd timer</span><span class="t">로그와 상태가 남는다</span><span class="d">.service + .timer 두 파일<br>journalctl 로 실행 이력 확인<br><br>Day 7에서 systemd를 배우면 자연스럽게 이어집니다</span></div>
      </div>
      <pre style="margin-top:2cqh"><span class="c"># 매일 새벽 3시 정리</span>
<span class="p">0 3 * * *  /home/ubuntu/ai-lab/scripts/cleanup.sh &gt;&gt; /home/ubuntu/ai-lab/logs/cron.log 2&gt;&amp;1</span></pre>`,
      foot: 'cron은 PATH가 거의 비어 있습니다 — 명령을 절대경로로 쓰거나 스크립트 안에서 PATH를 설정하세요.',
      nar: `정기 실행에는 두 가지 방법이 있습니다. 크론은 간단하고 어디에나 있습니다. 분 시 일 월 요일 순서로 다섯 개 항목을 적고 명령을 씁니다. 단점은 로그가 남지 않아서 실패해도 모를 수 있다는 것입니다. 그래서 출력을 로그 파일로 보내는 습관이 중요합니다. 시스템디 타이머는 파일을 두 개 만들어야 해서 번거롭지만 실행 이력과 상태가 남습니다. 내일 시스템디를 배우면 자연스럽게 이어집니다. 크론에서 가장 흔한 함정은 패스입니다. 크론 환경에는 패스가 거의 비어 있어서 손으로는 되던 명령이 안 됩니다. 절대경로를 쓰십시오.` },

    { section: true, eb: 'Block 4 · AI LAB · 15:10–17:10', h: '배치 러너 만들기',
      sub: '오늘 배운 것을 전부 합쳐 실제로 쓸 도구를 만듭니다.',
      nar: `마지막 블록입니다. 오늘 배운 문법과 안전장치와 옵션을 전부 합쳐서, 앞으로 계속 쓸 도구 두 개를 만듭니다.` },

    { eb: 'AI LAB', h: '만들 것 — 배치 러너',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ ./batch_runner.sh -p prompts.txt -o results.csv -n 3</span>

<span class="c">[14:20:01] 프롬프트 12개 로드
[14:20:01] 1/12 처리 중...
[14:20:04] 1/12 완료 (2.8초)
...
[14:21:30] 완료: 성공 11, 실패 1
[14:21:30] 실패 항목은 failed.txt 에 기록</span></pre>
      <div class="rowlist" style="margin-top:2cqh">
        <div class="row"><span class="dot">1</span><span class="t">옵션으로 입력·출력·반복 지정</span><span class="d">getopts</span></div>
        <div class="row"><span class="dot">2</span><span class="t">한 줄씩 읽어 처리</span><span class="d">while read</span></div>
        <div class="row"><span class="dot">3</span><span class="t">소요 시간 측정과 CSV 적재</span><span class="d">date +%s</span></div>
        <div class="row"><span class="dot">4</span><span class="t">실패한 항목만 따로 기록</span><span class="d">|| 로 분기</span></div>
      </div>`,
      foot: 'Day 7에서 실제 LLM API로 바꿔 끼우면 그대로 동작합니다.',
      nar: `배치 러너는 프롬프트 목록 파일을 읽어서 하나씩 처리하고, 결과와 소요 시간을 씨에스브이로 쌓고, 실패한 것만 따로 기록하는 도구입니다. 오늘은 실제 모델 대신 흉내 내는 명령으로 만들고, 내일 추론 서버를 띄우면 그 부분만 바꿔 끼웁니다. 도구를 만들 때 처음부터 실제 대상에 붙이지 않고 가짜로 먼저 만드는 것도 좋은 습관입니다.` },

    { eb: 'AI LAB', h: '만들 것 — 정리 스크립트와 timer',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># cleanup.sh — 7일 지난 로그와 임시 파일 정리</span>
<span class="p">find "$AI_LAB/logs" -name "*.log" -mtime +7 -print</span>   <span class="c"># 먼저 목록</span>
<span class="p">find "$AI_LAB/logs" -name "*.log" -mtime +7 -delete</span>  <span class="c"># 확인 후 삭제</span>
<span class="p">du -sh "$AI_LAB"/* | sort -h</span>                        <span class="c"># 정리 후 용량 기록</span></pre>
      <div class="bannerG" style="margin-top:2cqh">Day 2에서 "지워도 되는가"를 기준으로 폴더를 나눈 이유가 여기서 드러납니다.</div>`,
      foot: '-delete 를 넣기 전에 반드시 -print 로 먼저 돌려 봅니다 (Day 3의 규칙).',
      nar: `두 번째 도구는 정리 스크립트입니다. 이레 지난 로그를 지우고 정리 후 용량을 기록합니다. 여기서 둘째 날에 폴더를 나눈 기준이 왜 중요했는지 드러납니다. 지워도 되는 것과 지우면 안 되는 것이 폴더로 구분돼 있으면 정리 스크립트를 안전하게 쓸 수 있습니다. 그리고 셋째 날의 규칙을 다시 지키십시오. 딜리트를 넣기 전에 프린트로 먼저 돌려서 무엇이 지워질지 눈으로 봅니다.` }
  ],

  assignment: {
    title: '재사용 가능한 배치 러너',
    lede: '옵션을 받고, 실패를 견디고, 남이 써도 되는 스크립트를 완성하십시오.',
    items: [
      '-p(입력) -o(출력) -n(반복) -h(도움말) 옵션 처리',
      'set -euo pipefail 과 trap 으로 안전장치',
      '잘못된 인자 / 없는 파일 / 처리 실패 세 오류 처리',
      '결과 CSV (입력, 결과, 소요시간, 성공여부)',
      '실패 항목만 별도 파일로',
      '-h 로 사용법 출력'
    ],
    note: '채점은 <strong>오류 상황 세 가지</strong>에서 스크립트가 어떻게 반응하는지로 합니다. 정상 동작은 기본이고, 실패했을 때 무엇을 남기는지가 실력입니다.',
    sample: `<span class="o">$ ./batch_runner.sh
사용법: ./batch_runner.sh -p 프롬프트파일 -o 출력파일 [-n 반복]

$ ./batch_runner.sh -p 없는파일.txt
[오류] 입력 파일을 찾을 수 없습니다: 없는파일.txt</span>`,
    nar: `과제입니다. 오늘 만든 배치 러너를 완성해 오십시오. 옵션 네 개를 처리하고, 안전장치를 걸고, 결과를 씨에스브이로 남기고, 실패 항목을 따로 기록해야 합니다. 채점은 정상 동작이 아니라 오류 상황 세 가지에서 어떻게 반응하는지로 합니다. 인자가 잘못됐을 때, 파일이 없을 때, 처리가 실패했을 때. 정상 동작은 기본이고 실패했을 때 무엇을 남기는지가 실력입니다.` },

  wrap: {
    done: '반복을 스크립트로 넘기고, 안전장치를 걸고, 정기 실행까지 예약했습니다.',
    next: '내일 · Day 7 — LLM 추론 서버 올리기',
    nextDesc: '드디어 모델을 띄웁니다. 오늘 만든 배치 러너의 가짜 부분을 진짜 API로 바꿔 끼웁니다.',
    nar: `오늘 한 일을 정리하겠습니다. 셸 스크립트의 문법을 익혔고, 따옴표 규칙이라는 가장 흔한 함정을 확인했고, 셋 대시 이유오 파이프페일과 트랩으로 안전장치를 걸었습니다. 그리고 옵션을 받는 배치 러너와 정리 스크립트를 만들어 정기 실행까지 등록했습니다. 내일은 드디어 모델을 띄웁니다. 오늘 만든 배치 러너에서 가짜로 둔 부분을 진짜 추론 에이피아이로 바꿔 끼우게 됩니다. 수고하셨습니다.` },

  lab: {
    h1: '셸 스크립팅과 자동화',
    standfirst: '오늘 만드는 스크립트 두 개는 남은 나흘 동안 계속 씁니다. <strong>동작하는 것</strong>이 아니라 <strong>남이 써도 되는 것</strong>을 목표로 하세요.',
    rules: [
      ['변수는 항상 큰따옴표', '"$FILE" 이지 $FILE 이 아닙니다. 공백 하나로 스크립트가 망가집니다.'],
      ['두 번째 줄은 set -euo pipefail', '모든 스크립트에 넣습니다. 조용히 망가지는 것을 막아 줍니다.'],
      ['-delete 전에 -print', 'Day 3의 규칙입니다. 지우기 전에 목록을 눈으로 봅니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '문법과 함정', time: '13:00–13:50',
        missions: [
          { n: 1, h: '첫 스크립트', body: `
      <pre><span class="p">$</span> cd ~/ai-lab/scripts
<span class="p">$</span> cat &gt; hello.sh &lt;&lt;'EOF'
#!/usr/bin/env bash
set -euo pipefail

NAME="\${1:-세상}"
echo "안녕하세요, $NAME"
echo "오늘은 $(date +%F) 입니다"
EOF
<span class="p">$</span> bash hello.sh
<span class="p">$</span> bash hello.sh 리눅스
<span class="p">$</span> chmod +x hello.sh
<span class="p">$</span> ./hello.sh 폴리텍</pre>
      <div class="box check"><span class="lbl">기본값 문법</span>
        <p><code>\${1:-세상}</code>은 "1번 인자가 없으면 '세상'을 쓴다"는 뜻입니다. <code>set -u</code>와 함께 쓰면 안전합니다.</p></div>` },
          { n: 2, h: '따옴표 함정 직접 겪기', body: `
      <pre><span class="p">$</span> cd /tmp &amp;&amp; mkdir -p quotetest &amp;&amp; cd quotetest
<span class="p">$</span> touch "my data.txt" other.txt
<span class="p">$</span> ls

<span class="p">$</span> FILE="my data.txt"
<span class="p">$</span> ls $FILE
<span class="o">ls: cannot access 'my': No such file or directory
ls: cannot access 'data.txt': No such file or directory</span>

<span class="p">$</span> ls "$FILE"
<span class="o">my data.txt</span></pre>
      <div class="box warn"><span class="lbl">이것이 rm 이었다면</span>
        <p><code>rm $FILE</code>은 <code>my</code>와 <code>data.txt</code>를 지우려 합니다. 우연히 그런 이름의 파일이 있으면 <strong>엉뚱한 파일이 사라집니다.</strong></p></div>` },
          { n: 3, h: '조건과 반복', body: `
      <pre><span class="p">$</span> cd ~/ai-lab/scripts
<span class="p">$</span> cat &gt; check.sh &lt;&lt;'EOF'
#!/usr/bin/env bash
set -euo pipefail

TARGET="\${1:?경로를 지정하세요}"

if [[ -f "$TARGET" ]]; then
    echo "파일: $TARGET ($(wc -l &lt; "$TARGET") 줄)"
elif [[ -d "$TARGET" ]]; then
    echo "디렉터리: $TARGET"
    for f in "$TARGET"/*; do
        [[ -e "$f" ]] || continue
        echo "  - $(basename "$f")"
    done
else
    echo "없습니다: $TARGET" &gt;&amp;2
    exit 1
fi
EOF
<span class="p">$</span> chmod +x check.sh
<span class="p">$</span> ./check.sh ~/ai-lab
<span class="p">$</span> ./check.sh ~/.bashrc
<span class="p">$</span> ./check.sh /없는경로; echo "종료코드: $?"</pre>
      <div class="box check"><span class="lbl">종료 코드</span>
        <p>성공은 0, 실패는 0이 아닌 값입니다. <code>$?</code>로 확인합니다. 이게 있어야 다른 스크립트가 내 스크립트의 성공 여부를 판단할 수 있습니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '안전장치', time: '13:50–14:30',
        missions: [
          { n: 4, h: 'set -e 없을 때 vs 있을 때', body: `
      <pre><span class="p">$</span> cat &gt; unsafe.sh &lt;&lt;'EOF'
#!/usr/bin/env bash
cd /없는경로
echo "여기까지 왔습니다 — 위험!"
pwd
EOF
<span class="p">$</span> bash unsafe.sh

<span class="p">$</span> cat &gt; safe.sh &lt;&lt;'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd /없는경로
echo "여기는 실행되지 않습니다"
EOF
<span class="p">$</span> bash safe.sh; echo "종료코드: $?"</pre>
      <div class="box warn"><span class="lbl">이 차이가 사고를 만듭니다</span>
        <p>첫 스크립트는 <code>cd</code>가 실패했는데도 계속 진행해서 <strong>원래 있던 디렉터리에서</strong> 다음 명령을 실행합니다. 그다음 줄이 <code>rm -rf *</code>였다면?</p></div>` },
          { n: 5, h: 'trap으로 뒷정리', body: `
      <pre><span class="p">$</span> cat &gt; trapdemo.sh &lt;&lt;'EOF'
#!/usr/bin/env bash
set -euo pipefail

TMPDIR="$(mktemp -d)"
cleanup() { rm -rf "$TMPDIR"; echo "정리 완료: $TMPDIR"; }
trap cleanup EXIT

echo "작업 디렉터리: $TMPDIR"
touch "$TMPDIR/work.tmp"
ls "$TMPDIR"
sleep 5
echo "정상 종료"
EOF
<span class="p">$</span> chmod +x trapdemo.sh
<span class="p">$</span> ./trapdemo.sh                   <span class="c"># 끝까지</span>
<span class="p">$</span> ./trapdemo.sh                   <span class="c"># 이번엔 Ctrl+C</span></pre>
      <div class="box check"><span class="lbl">확인</span>
        <p><kbd>Ctrl</kbd>+<kbd>C</kbd>로 끊어도 "정리 완료"가 출력됩니다. <code>ls /tmp | grep tmp.</code>로 임시 디렉터리가 남지 않았는지 확인하세요.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '전처리 파이프라인 스크립트화', time: '14:30–15:40',
        lede: 'Day 3에서 손으로 친 정제 명령을 도구로 승격합니다.',
        missions: [
          { n: 6, h: 'getopts로 옵션 받기', body: `
      <pre><span class="p">$</span> cat &gt; clean_dataset.sh &lt;&lt;'EOF'
#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat &lt;&lt;USAGE
사용법: $0 -i 입력.jsonl -o 출력.jsonl [-m 최소길이]
  -i  입력 JSONL 파일 (필수)
  -o  출력 파일 (필수)
  -m  최소 len 값 (기본 1)
  -h  이 도움말
USAGE
    exit 1
}

MIN=1
while getopts "i:o:m:h" opt; do
  case "$opt" in
    i) IN="$OPTARG" ;;
    o) OUT="$OPTARG" ;;
    m) MIN="$OPTARG" ;;
    h|*) usage ;;
  esac
done

[[ -z "\${IN:-}" || -z "\${OUT:-}" ]] &amp;&amp; usage
[[ -f "$IN" ]] || { echo "[오류] 입력 파일 없음: $IN" &gt;&amp;2; exit 2; }

BEFORE=$(wc -l &lt; "$IN")
jq -c --argjson m "$MIN" \\
   'select(.response != "" and .len &gt;= $m)' "$IN" 2&gt;/dev/null \\
   | jq -s 'unique_by(.prompt) | .[]' -c &gt; "$OUT"
AFTER=$(wc -l &lt; "$OUT")

echo "정제 완료: $BEFORE → $AFTER 줄 (제거 $((BEFORE-AFTER)))"
EOF
<span class="p">$</span> chmod +x clean_dataset.sh
<span class="p">$</span> ./clean_dataset.sh -h
<span class="p">$</span> ./clean_dataset.sh -i ~/ai-lab/datasets/dirty.jsonl -o ~/ai-lab/datasets/clean2.jsonl
<span class="p">$</span> ./clean_dataset.sh -i 없는파일.jsonl -o out.jsonl; echo "종료코드 $?"</pre>
      <div class="box check"><span class="lbl">Day 3이 도구가 되었습니다</span>
        <p>손으로 치던 jq 파이프라인이 이제 <strong>옵션을 받는 재사용 가능한 도구</strong>가 됐습니다. 중복 제거까지 한 번에 처리됩니다.</p></div>` },
          { n: 7, h: '병렬 처리 측정', body: `
      <pre><span class="p">$</span> cd /tmp &amp;&amp; mkdir -p paratest &amp;&amp; cd paratest
<span class="p">$</span> for i in $(seq 1 12); do echo "job $i" &gt; job$i.txt; done
<span class="p">$</span> cat &gt; work.sh &lt;&lt;'EOF'
#!/usr/bin/env bash
sleep 2
echo "완료: $1"
EOF
<span class="p">$</span> chmod +x work.sh

<span class="p">$</span> nproc
<span class="p">$</span> time (ls job*.txt | xargs -I{} ./work.sh {})          <span class="c"># 순차</span>
<span class="p">$</span> time (ls job*.txt | xargs -P 4 -I{} ./work.sh {})     <span class="c"># 4병렬</span>
<span class="p">$</span> time (ls job*.txt | xargs -P 12 -I{} ./work.sh {})    <span class="c"># 12병렬</span></pre>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>12병렬이 4병렬보다 훨씬 빠른가요? 코어 수를 넘어서면 왜 개선폭이 줄어들까요? (Day 4의 CPU 경합)</p></div>` }
        ]
      },
      {
        pn: 'PART 4', h: 'AI LAB · 배치 러너와 정기 실행', time: '15:40–17:10',
        missions: [
          { n: 8, h: '배치 러너 뼈대', body: `
      <pre><span class="p">$</span> cd ~/ai-lab/scripts
<span class="p">$</span> cat &gt; prompts.txt &lt;&lt;'EOF'
리눅스에서 파일을 찾는 명령은?
파이프란 무엇인가요?
권한 644는 무슨 뜻인가요?
EOF

<span class="p">$</span> cat &gt; batch_runner.sh &lt;&lt;'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

usage() { echo "사용법: $0 -p 프롬프트파일 -o 출력.csv [-n 반복]"; exit 1; }

N=1
while getopts "p:o:n:h" opt; do
  case "$opt" in
    p) PROMPTS="$OPTARG" ;;
    o) OUT="$OPTARG" ;;
    n) N="$OPTARG" ;;
    h|*) usage ;;
  esac
done
[[ -z "\${PROMPTS:-}" || -z "\${OUT:-}" ]] &amp;&amp; usage
[[ -f "$PROMPTS" ]] || { echo "[오류] 파일 없음: $PROMPTS" &gt;&amp;2; exit 2; }

FAILED="\${OUT%.csv}_failed.txt"
: &gt; "$FAILED"
echo "prompt,round,elapsed,status" &gt; "$OUT"

log() { echo "[$(date +%H:%M:%S)] $*"; }

ask() {            # 내일 이 함수만 진짜 API로 바꿉니다
    local q="$1"
    sleep 1
    [[ "\${#q}" -gt 5 ]] || return 1
    echo "응답"
}

TOTAL=$(wc -l &lt; "$PROMPTS"); OK=0; NG=0; i=0
log "프롬프트 \${TOTAL}개 × \${N}회"

while IFS= read -r line; do
    [[ -z "$line" ]] &amp;&amp; continue
    i=$((i+1))
    for r in $(seq 1 "$N"); do
        start=$(date +%s)
        if ask "$line" &gt;/dev/null 2&gt;&amp;1; then
            st=ok; OK=$((OK+1))
        else
            st=fail; NG=$((NG+1)); echo "$line" &gt;&gt; "$FAILED"
        fi
        el=$(( $(date +%s) - start ))
        echo "\\"$line\\",$r,$el,$st" &gt;&gt; "$OUT"
    done
    log "$i/$TOTAL 완료"
done &lt; "$PROMPTS"

log "성공 $OK · 실패 $NG"
[[ $NG -gt 0 ]] &amp;&amp; log "실패 목록: $FAILED"
SCRIPT
<span class="p">$</span> chmod +x batch_runner.sh
<span class="p">$</span> ./batch_runner.sh -p prompts.txt -o ~/ai-lab/logs/result.csv -n 2
<span class="p">$</span> column -s, -t &lt; ~/ai-lab/logs/result.csv</pre>
      <div class="box check"><span class="lbl">내일 바꿔 끼울 곳</span>
        <p><code>ask()</code> 함수 하나만 진짜 API 호출로 바꾸면 그대로 동작합니다. 이렇게 <strong>바뀔 부분을 함수로 격리</strong>하는 것이 좋은 설계입니다.</p></div>` },
          { n: 9, h: '실패 케이스 만들어 보기', body: `
      <pre><span class="p">$</span> printf '짧음\\n정상적인 긴 프롬프트입니다\\n' &gt; mixed.txt
<span class="p">$</span> ./batch_runner.sh -p mixed.txt -o ~/ai-lab/logs/mixed.csv
<span class="p">$</span> cat ~/ai-lab/logs/mixed_failed.txt
<span class="p">$</span> ./batch_runner.sh                      <span class="c"># 인자 없이</span>
<span class="p">$</span> ./batch_runner.sh -p 없음.txt -o a.csv <span class="c"># 없는 파일</span></pre>
      <div class="box check"><span class="lbl">과제 채점 포인트</span>
        <p>세 가지 오류 상황에서 각각 다른 메시지와 종료 코드가 나와야 합니다. 이것이 과제의 핵심입니다.</p></div>` },
          { n: 10, h: '정리 스크립트와 cron 등록', body: `
      <pre><span class="p">$</span> cat &gt; cleanup.sh &lt;&lt;'EOF'
#!/usr/bin/env bash
set -euo pipefail
LAB="$HOME/ai-lab"
LOG="$LAB/logs/cleanup.log"

echo "===== $(date +%F' '%T) 정리 시작 =====" &gt;&gt; "$LOG"
find "$LAB/logs" -name "*.log" -mtime +7 -print &gt;&gt; "$LOG"
find "$LAB/logs" -name "*.log" -mtime +7 -delete
find /tmp -maxdepth 1 -name "tmp.*" -mtime +1 -delete 2&gt;/dev/null || true
du -sh "$LAB"/* &gt;&gt; "$LOG"
echo "===== 정리 완료 =====" &gt;&gt; "$LOG"
EOF
<span class="p">$</span> chmod +x cleanup.sh
<span class="p">$</span> ./cleanup.sh &amp;&amp; tail -10 ~/ai-lab/logs/cleanup.log

<span class="c"># cron 등록 — 테스트를 위해 매분으로 먼저</span>
<span class="p">$</span> crontab -e
<span class="c"># 아래 한 줄 추가 (절대경로!)</span>
<span class="c"># * * * * * /home/ubuntu/ai-lab/scripts/cleanup.sh</span>

<span class="p">$</span> crontab -l
<span class="p">$</span> sleep 70 &amp;&amp; tail -5 ~/ai-lab/logs/cleanup.log</pre>
      <div class="box warn"><span class="lbl">확인 후 반드시 새벽으로 바꾸세요</span>
        <pre style="margin-top:8px"><span class="c"># 0 3 * * * /home/ubuntu/ai-lab/scripts/cleanup.sh</span></pre>
        <p>매분 실행을 그대로 두면 로그가 계속 쌓입니다. WSL2에서 cron이 안 돌면 <code>sudo service cron start</code>를 먼저 실행하세요.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>Syntax error near unexpected token</code>', '중괄호·따옴표 짝 안 맞음', '<code>bash -n script.sh</code>로 문법만 검사'],
      ['<code>command not found</code> (cron에서만)', 'cron의 PATH가 거의 빔', '명령을 절대경로로 쓰거나 스크립트에 PATH 설정'],
      ['<code>unbound variable</code>', '<code>set -u</code> + 미정의 변수', '<code>\${VAR:-기본값}</code> 형태로 기본값 지정'],
      ['파일 이름이 쪼개진다', '변수에 따옴표 없음', '<code>"$VAR"</code>로 감쌉니다'],
      ['<code>Permission denied</code> (./script.sh)', '실행 권한 없음', '<code>chmod +x script.sh</code>'],
      ['cron이 아예 안 돈다 (WSL2)', 'cron 서비스 미기동', '<code>sudo service cron start</code>']
    ],
    checklist: [
      'shebang과 <code>set -euo pipefail</code>이 들어간 스크립트를 만들었다',
      '따옴표 없는 변수가 공백에서 쪼개지는 것을 직접 확인했다',
      '<code>if</code>/<code>for</code>/<code>while read</code>를 각각 써 봤다',
      '<code>trap</code>으로 Ctrl+C 상황에서도 뒷정리가 되는 것을 확인했다',
      '<code>getopts</code>로 옵션을 받는 스크립트를 만들었다',
      '<code>-h</code>로 사용법이 출력된다',
      '<code>xargs -P</code>로 병렬 처리 시간을 측정해 비교했다',
      '배치 러너가 성공·실패를 구분해 기록한다',
      '<code>cleanup.sh</code>가 동작하고 로그를 남긴다',
      'cron에 등록해 실제로 실행되는 것을 확인했다'
    ]
  },

  quizTitle: '셸 스크립팅 퀴즈',
  quiz: [
    { q: '스크립트 첫 줄 <code>#!/usr/bin/env bash</code>를 무엇이라 부르나요?', o: ['shebang', 'header', 'import', 'prologue'], a: 0,
      e: '이 파일을 어떤 인터프리터로 실행할지 알려 줍니다. <code>env</code>를 거치면 PATH에서 bash를 찾습니다.' },
    { q: '변수 대입에서 <strong>틀린</strong> 것은?', o: ['NAME = "값"', 'NAME="값"', 'NAME=값', 'NAME="$OTHER"'], a: 0,
      e: '<code>=</code> 양옆에 공백을 넣으면 안 됩니다. 셸이 <code>NAME</code>을 명령으로 해석합니다.' },
    { q: '<code>FILE="my data.txt"</code>일 때 <code>rm $FILE</code>의 문제는?', o: ['my 와 data.txt 두 개를 지우려 한다', '따옴표 때문에 오류가 난다', '아무 일도 안 일어난다', '권한 오류가 난다'], a: 0,
      e: '변수는 <strong>항상</strong> 큰따옴표로 감싸세요. 오늘 가장 중요한 규칙입니다.' },
    { q: '큰따옴표와 작은따옴표의 차이는?', o: ['큰따옴표는 변수를 풀고, 작은따옴표는 글자 그대로 둔다', '반대다', '차이가 없다', '작은따옴표만 공백을 보호한다'], a: 0,
      e: '<code>echo "$NAME"</code>과 <code>echo \'$NAME\'</code>을 직접 쳐 보면 바로 보입니다.' },
    { q: '<code>set -e</code>가 하는 일은?', o: ['명령이 실패하면 즉시 중단한다', '에러를 화면에 출력한다', '모든 명령을 출력한다', '환경변수를 내보낸다'], a: 0,
      e: 'errexit입니다. 이게 없으면 <code>cd</code> 실패 후에도 다음 줄이 엉뚱한 곳에서 실행됩니다.' },
    { q: '<code>set -u</code>가 잡아 주는 실수는?', o: ['정의하지 않은 변수 사용(오타 포함)', '문법 오류', '무한 루프', '권한 문제'], a: 0,
      e: 'nounset입니다. 변수 이름 오타를 조용히 넘어가지 않고 오류로 만듭니다.' },
    { q: '스크립트가 어떻게 끝나든 뒷정리를 실행하게 하는 명령은? (직접 입력)', t: true, acc: ['trap', 'trap cleanup EXIT'], ans: 'trap',
      e: '정상 종료·오류·Ctrl+C 모두에서 실행됩니다. 임시 파일을 쓰는 스크립트에는 거의 필수입니다.' },
    { q: '충돌하지 않는 임시 디렉터리를 만드는 명령은?', o: ['mktemp -d', 'mkdir /tmp/work', 'tmpdir', 'newtemp'], a: 0,
      e: '고정 이름을 쓰면 두 개가 동시에 돌 때 서로의 파일을 덮어씁니다.' },
    { q: '함수 안에서 <code>local</code>을 붙이지 않으면?', o: ['함수 밖의 같은 이름 변수를 덮어쓴다', '오류가 난다', '함수가 실행되지 않는다', '아무 차이 없다'], a: 0,
      e: '긴 스크립트에서 찾기 아주 어려운 버그가 됩니다. 함수 안 변수는 습관적으로 <code>local</code>을 붙이세요.' },
    { q: '직전 명령의 성공 여부를 담고 있는 변수는?', o: ['$?', '$!', '$#', '$0'], a: 0,
      e: '0이면 성공, 0이 아니면 실패입니다. <code>$!</code>은 마지막 백그라운드 PID, <code>$#</code>은 인자 개수입니다.' },
    { q: '스크립트에 전달된 <strong>인자 개수</strong>를 담은 변수는?', o: ['$#', '$@', '$*', '$0'], a: 0,
      e: '<code>$@</code>와 <code>$*</code>는 인자 전체, <code>$0</code>은 스크립트 이름입니다.' },
    { q: '옵션(-m, -n 같은)을 처리하는 bash 내장 명령은? (직접 입력)', t: true, acc: ['getopts'], ans: 'getopts',
      e: '<code>while getopts "m:n:h" opt</code> 형태로 씁니다. 콜론이 붙은 글자는 값을 함께 받습니다.' },
    { q: '<code>\${1:-기본값}</code>의 뜻은?', o: ['1번 인자가 없으면 기본값을 쓴다', '1번 인자를 기본값으로 바꾼다', '1번 인자를 삭제한다', '문법 오류'], a: 0,
      e: '<code>set -u</code>와 함께 쓸 때 특히 유용합니다. <code>\${1:?메시지}</code>는 없으면 오류로 종료합니다.' },
    { q: '작업 4개를 동시에 돌리는 xargs 옵션은?', o: ['-P 4', '-n 4', '-j 4', '-c 4'], a: 0,
      e: '<code>-P</code>는 parallel입니다. <code>-n</code>은 한 번에 넘길 인자 개수로 뜻이 다릅니다.' },
    { q: '병렬 개수를 코어 수보다 훨씬 크게 잡으면?', o: ['CPU 경합으로 오히려 느려질 수 있다', '항상 더 빨라진다', '메모리만 늘어난다', '아무 변화 없다'], a: 0,
      e: 'Day 4에서 본 CPU 경합입니다. <code>nproc</code>으로 코어 수를 확인해 맞추세요.' },
    { q: 'cron에서 "매일 새벽 3시"를 뜻하는 표기는?', o: ['0 3 * * *', '3 0 * * *', '* 3 * * *', '0 0 3 * *'], a: 0,
      e: '순서는 <strong>분 시 일 월 요일</strong>입니다. 분이 먼저입니다.' },
    { q: '손으로는 되던 명령이 cron에서만 <code>command not found</code>가 나는 이유는?', o: ['cron의 PATH가 거의 비어 있다', 'cron은 sudo가 필요하다', '파일 권한 문제', 'cron은 bash를 안 쓴다'], a: 0,
      e: '절대경로를 쓰거나 스크립트 안에서 PATH를 설정하세요. cron 디버깅의 1순위입니다.' },
    { q: '배치 러너에서 <code>ask()</code>를 함수로 분리한 이유는?', o: ['바뀔 부분을 격리해 나중에 교체하기 쉽게', '속도를 높이려고', '문법상 필요해서', '병렬 처리를 위해'], a: 0,
      e: '내일 이 함수만 실제 API 호출로 바꾸면 나머지는 그대로 돕니다. 좋은 설계의 기본입니다.' }
  ]
};
