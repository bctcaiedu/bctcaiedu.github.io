module.exports = {
  day: 3,
  title: '텍스트 처리와 데이터 해부',
  theme: 'AI 데이터셋과 학습 로그는 전부 텍스트다',

  openingNar: `셋째 날입니다. 어제 파이프로 명령을 이어 붙이는 법을 배웠죠. 오늘은 그 파이프 위에 진짜 도구들을 얹습니다. 그렙, 세드, 오크, 제이큐. 이름은 낯설지만 하는 일은 단순합니다. 찾고, 바꾸고, 계산하고, 뽑아냅니다. 오후에는 십만 줄짜리 학습 로그와 오염된 데이터셋을 직접 해부하게 됩니다.`,

  goals: [
    ['정규표현식 기초로', 'grep을 써서 원하는 줄만 골라낼 수 있다'],
    ['find와 xargs로', '조건에 맞는 파일을 찾아 일괄 처리할 수 있다'],
    ['sed와 awk로', '치환하고 컬럼을 계산할 수 있다'],
    ['jq로', 'JSON·JSONL에서 필요한 필드만 뽑을 수 있다'],
    ['vim으로', '서버에서 설정 파일을 고칠 수 있다'],
    ['학습 로그와 데이터셋을', '파이프라인 한 줄로 검증할 수 있다']
  ],
  goalsNar: `오늘의 목표는 도구 다섯 개와 그것을 쓰는 실전입니다. 그렙으로 찾고, 파인드로 파일을 골라 일괄 처리하고, 세드로 바꾸고, 오크로 계산하고, 제이큐로 제이슨을 다룹니다. 여기에 뷔아이엠을 생존 수준까지 익힙니다. 마지막 목표가 오늘의 진짜 도착점입니다. 십만 줄 로그에서 원하는 숫자를 뽑아내고, 오염된 데이터셋을 검증하는 일을 한 줄로 해내는 것입니다.`,

  blocks: [
    { time: '09:00–11:00', title: '검색과 집계', desc: 'grep · 정규표현식 · find · xargs' },
    { time: '11:10–12:00', title: 'sed · awk · jq · vim', desc: '바꾸고 계산하고 뽑아내기' },
    { time: '13:00–15:00', title: '파이프라인 드릴', desc: '질문에 한 줄로 답하기' },
    { time: '15:10–17:10', title: '로그와 데이터셋 해부', desc: 'loss 추출 · JSONL 검증' }
  ],
  blocksNar: `오전에는 도구를 하나씩 익히고, 오후 전반에는 문제를 연속으로 풀면서 손에 붙입니다. 마지막 두 시간이 오늘의 하이라이트입니다. 실제 학습 로그와 실제로 오염된 데이터셋을 받아서 직접 검증 보고서를 만듭니다.`,

  slides: [
    { section: true, eb: 'Block 1 · 09:00–11:00', h: '검색과 집계',
      sub: '오늘 배우는 도구 중 앞으로 가장 많이 칠 명령이 여기 있습니다.',
      nar: `첫 번째 블록입니다. 그렙은 앞으로 여러분이 리눅스에서 가장 많이 치게 될 명령 중 하나입니다. 수천 줄, 수십만 줄에서 원하는 줄만 골라내는 도구입니다.` },

    { eb: 'grep', h: 'grep — 원하는 줄만 골라내기',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ grep error app.log</span>              <span class="c"># error 가 들어간 줄</span>
<span class="p">$ grep -i error app.log</span>           <span class="c"># 대소문자 무시</span>
<span class="p">$ grep -n error app.log</span>           <span class="c"># 줄 번호와 함께</span>
<span class="p">$ grep -c error app.log</span>           <span class="c"># 개수만</span>
<span class="p">$ grep -v error app.log</span>           <span class="c"># error 가 없는 줄 (반대)</span>
<span class="p">$ grep -r TODO ~/ai-lab</span>           <span class="c"># 폴더 전체를 뒤져서</span>
<span class="p">$ grep -A3 -B1 error app.log</span>      <span class="c"># 앞뒤 줄까지 함께</span></pre>`,
      foot: '-v 는 "반대로"입니다. 노이즈를 걷어낼 때 -v 를 이어 쓰는 일이 아주 많습니다.',
      nar: `그렙의 옵션은 일곱 개만 알면 실무의 구 할이 해결됩니다. 대시 아이는 대소문자 무시, 대시 엔은 줄 번호, 대시 씨는 개수만 세기입니다. 대시 브이가 중요한데요, 반대로 그 단어가 없는 줄만 남깁니다. 노이즈를 걷어낼 때 대시 브이를 계속 이어 붙이게 됩니다. 대시 알은 폴더 전체를 뒤지고, 대시 에이와 대시 비는 찾은 줄의 앞뒤 맥락까지 함께 보여 줍니다. 로그에서 에러를 찾을 때 앞뒤를 봐야 원인이 보이기 때문에 이 옵션을 자주 씁니다.` },

    { eb: 'Regex', h: '정규표현식 — 여섯 개면 시작할 수 있다',
      sub: '전부 외울 필요 없습니다. 이것부터 씁니다.',
      body: `<div class="grid g3" style="margin-top:1.6cqh">
        <div class="card"><span class="n">^</span><span class="t">줄의 시작</span><span class="d">^Error — Error로 시작하는 줄</span></div>
        <div class="card"><span class="n">$</span><span class="t">줄의 끝</span><span class="d">done$ — done으로 끝나는 줄</span></div>
        <div class="card"><span class="n">.</span><span class="t">아무 글자 하나</span><span class="d">a.c — abc, axc …</span></div>
        <div class="card"><span class="n">*</span><span class="t">앞 것이 0번 이상</span><span class="d">ab*c — ac, abc, abbc</span></div>
        <div class="card"><span class="n">[0-9]</span><span class="t">범위 중 하나</span><span class="d">숫자 한 글자</span></div>
        <div class="card"><span class="n">+ ?  |</span><span class="t">확장 문법</span><span class="d">grep -E 를 붙여야 씁니다</span></div>
      </div>`,
      foot: '+ 나 | 를 쓰려면 grep -E (또는 egrep). 이걸 몰라서 "왜 안 되지" 하는 경우가 많습니다.',
      nar: `정규표현식은 처음에 겁을 먹기 쉬운데, 여섯 개만 알면 시작할 수 있습니다. 캐럿은 줄의 시작, 달러는 줄의 끝, 점은 아무 글자 하나, 별표는 앞의 것이 영 번 이상, 대괄호는 범위 중 하나입니다. 여기서 흔한 함정이 하나 있습니다. 플러스나 세로막대 같은 확장 문법을 쓰려면 그렙에 대시 대문자 이를 붙여야 합니다. 이걸 모르고 왜 안 되는지 한참 헤매는 경우가 정말 많습니다.` },

    { eb: 'find + xargs', h: '조건에 맞는 파일을 찾아 일괄 처리',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ find ~/ai-lab -name "*.log"</span>          <span class="c"># 이름으로</span>
<span class="p">$ find /var/log -size +1M</span>              <span class="c"># 1MB 넘는 것</span>
<span class="p">$ find ~/ai-lab -mtime -1</span>              <span class="c"># 하루 안에 바뀐 것</span>
<span class="p">$ find ~/ai-lab -type d</span>                <span class="c"># 디렉터리만</span>

<span class="p">$ find ~/ai-lab -name "*.log" | xargs wc -l</span>
<span class="p">$ find ~/ai-lab -name "*.tmp" -delete</span>   <span class="c"># 조심해서</span></pre>
      <div class="banner" style="margin-top:2cqh">-delete 는 확인 없이 지웁니다. 반드시 <strong>-delete 없이 먼저 실행</strong>해 목록을 눈으로 보세요.</div>`,
      nar: `파인드는 조건으로 파일을 찾습니다. 이름으로, 크기로, 수정 시각으로, 종류로 찾을 수 있습니다. 여기에 엑스아그스를 이으면 찾은 파일들을 한꺼번에 처리할 수 있습니다. 주의할 것이 하나 있습니다. 파인드에 대시 딜리트를 붙이면 확인 없이 바로 지웁니다. 반드시 대시 딜리트 없이 먼저 실행해서 어떤 파일이 나오는지 눈으로 확인한 다음에 붙이십시오. 아홉째 날 디스크 정리 실습에서 이 습관이 사고를 막아 줍니다.` },

    { section: true, eb: 'Block 2 · 11:10–12:00', h: 'sed · awk · jq · vim',
      sub: '찾았으면 바꾸고, 계산하고, 뽑아냅니다.',
      nar: `두 번째 블록입니다. 그렙이 찾는 도구였다면 이제는 바꾸고 계산하는 도구들입니다. 세 개를 다 깊이 배우지는 않습니다. 각각 한두 가지 쓰임만 확실히 익힙니다.` },

    { eb: 'sed', h: 'sed — 찾아서 바꾸기',
      body: `<pre style="margin-top:1.6cqh"><span class="p">$ sed 's/error/ERROR/' app.log</span>       <span class="c"># 각 줄의 첫 번째만</span>
<span class="p">$ sed 's/error/ERROR/g' app.log</span>      <span class="c"># 줄 안의 전부 (global)</span>
<span class="p">$ sed -n '10,20p' app.log</span>            <span class="c"># 10~20번째 줄만</span>
<span class="p">$ sed '/^#/d' config.txt</span>             <span class="c"># 주석 줄 삭제</span>
<span class="p">$ sed -i 's/8080/11434/g' config.txt</span> <span class="c"># 파일을 직접 수정</span></pre>
      <div class="banner" style="margin-top:2cqh">-i 는 원본을 덮어씁니다. 먼저 -i 없이 실행해 결과를 확인하세요.</div>`,
      nar: `세드는 찾아서 바꾸는 도구입니다. 에스 슬래시 찾을것 슬래시 바꿀것 슬래시가 기본 형태입니다. 끝에 지를 붙이면 한 줄 안의 모든 일치를 바꿉니다. 붙이지 않으면 각 줄의 첫 번째만 바뀌니 주의하십시오. 대시 아이를 붙이면 파일을 직접 고칩니다. 편리하지만 되돌릴 수 없으니, 반드시 대시 아이 없이 먼저 돌려서 결과를 눈으로 확인한 다음에 붙이는 습관을 들이십시오.` },

    { eb: 'awk', h: 'awk — 컬럼을 다루고 계산하기',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># 로그 한 줄:  epoch 12  loss 0.3421  acc 0.91</span>

<span class="p">$ awk '{print $2, $4}' train.log</span>      <span class="c"># 2번째, 4번째 컬럼</span>
<span class="p">$ awk '$4 &gt; 1.0' train.log</span>            <span class="c"># 4번째 값이 1.0 초과인 줄</span>
<span class="p">$ awk '{sum+=$4} END {print sum/NR}' train.log</span>  <span class="c"># 평균</span>
<span class="p">$ awk -F, '{print $1}' data.csv</span>       <span class="c"># 쉼표로 구분된 파일</span></pre>`,
      foot: '$1 $2 는 컬럼 번호, NR은 지금까지 읽은 줄 수입니다. 이 셋이면 평균·최대·개수가 다 됩니다.',
      nar: `오크는 표 형태의 텍스트를 다루는 도구입니다. 공백으로 나뉜 각 칸을 달러 일, 달러 이처럼 번호로 부릅니다. 특정 컬럼만 뽑을 수도 있고, 조건에 맞는 줄만 남길 수도 있고, 합계나 평균을 계산할 수도 있습니다. 엔알은 지금까지 읽은 줄 수를 담고 있어서 합을 엔알로 나누면 평균이 됩니다. 대시 에프로 구분자를 바꾸면 씨에스브이 파일도 다룰 수 있습니다. 오늘 오후에 학습 로그에서 로스 평균을 낼 때 바로 이걸 씁니다.` },

    { eb: 'jq', h: 'jq — JSON을 명령줄에서 다루기',
      sub: 'AI 데이터셋과 API 응답은 대부분 JSON입니다.',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># data.jsonl 한 줄:  {"prompt":"...","response":"...","len":128}</span>

<span class="p">$ cat data.jsonl | jq -r .prompt | head -3</span>
<span class="p">$ cat data.jsonl | jq 'select(.len &gt; 512)' | head</span>
<span class="p">$ cat data.jsonl | jq -r '[.prompt, .len] | @tsv' | head</span>
<span class="p">$ cat data.jsonl | jq -s 'length'</span>         <span class="c"># 전체 개수</span>
<span class="p">$ curl -s localhost:11434/api/tags | jq -r '.models[].name'</span></pre>`,
      foot: '-r 은 따옴표를 뗀 raw 출력입니다. 파이프로 넘길 때는 거의 항상 -r을 씁니다.',
      nar: `제이큐는 제이슨 전용 도구입니다. 인공지능 쪽 데이터셋과 에이피아이 응답이 거의 다 제이슨이라 반드시 익혀야 합니다. 점 뒤에 필드 이름을 쓰면 그 값만 뽑고, 셀렉트를 쓰면 조건에 맞는 것만 남깁니다. 대시 알은 따옴표를 떼고 순수한 문자열로 출력하는 옵션인데, 파이프로 넘길 때는 거의 항상 붙입니다. 마지막 줄은 일곱째 날에 추론 서버를 띄운 뒤 실제로 쓰게 될 명령입니다.` },

    { eb: 'vim', h: 'vim — 생존 문법만',
      sub: '서버에는 메모장이 없습니다. 설정 파일 하나 고칠 수 있으면 충분합니다.',
      body: `<div class="grid g4" style="margin-top:1.6cqh">
        <div class="card"><span class="n">i</span><span class="t">입력 시작</span><span class="d">글자를 칠 수 있게 됩니다</span></div>
        <div class="card"><span class="n">Esc</span><span class="t">입력 끝</span><span class="d">막히면 일단 Esc</span></div>
        <div class="card"><span class="n">:w  :q</span><span class="t">저장 · 종료</span><span class="d">:wq 저장 후 종료</span></div>
        <div class="card"><span class="n">:q!</span><span class="t">버리고 나가기</span><span class="d">망쳤을 때의 탈출구</span></div>
        <div class="card"><span class="n">/단어</span><span class="t">검색</span><span class="d">n 으로 다음</span></div>
        <div class="card"><span class="n">dd</span><span class="t">줄 삭제</span><span class="d">u 로 되돌리기</span></div>
        <div class="card"><span class="n">gg  G</span><span class="t">처음 · 끝</span><span class="d">긴 파일 이동</span></div>
        <div class="card"><span class="n">u</span><span class="t">되돌리기</span><span class="d">가장 중요한 키</span></div>
      </div>`,
      foot: '외울 것은 두 개입니다 — 막히면 Esc, 망쳤으면 :q!',
      nar: `뷔아이엠은 오늘 전부 배우지 않습니다. 서버에서 설정 파일 하나 고칠 수 있는 수준까지만 합니다. 아이를 누르면 글자를 칠 수 있고, 이에스씨를 누르면 빠져나옵니다. 콜론 더블유 큐로 저장하고 나가고, 망쳤으면 콜론 큐 느낌표로 버리고 나갑니다. 사실 외울 것은 두 개뿐입니다. 막히면 이에스씨, 망쳤으면 콜론 큐 느낌표. 이 두 개만 알면 뷔아이엠에 갇히지 않습니다.` },

    { section: true, eb: 'Block 4 · AI LAB · 15:10–17:10', h: '로그와 데이터셋 해부',
      sub: '오늘 배운 다섯 개 도구가 전부 동원됩니다.',
      nar: `마지막 블록입니다. 오늘 배운 도구가 전부 동원됩니다. 실제 학습 로그와 실제로 오염된 데이터셋을 받아서 직접 해부합니다.` },

    { eb: 'AI LAB', h: '학습 로그에서 loss 곡선 읽어내기',
      body: `<pre style="margin-top:1.6cqh"><span class="c"># train.log — 10만 줄</span>
<span class="p">$ grep -c "epoch" train.log</span>                       <span class="c"># 몇 epoch 돌았나</span>
<span class="p">$ grep "epoch" train.log | awk '{print $2, $4}' | head</span>
<span class="p">$ grep "epoch" train.log | awk '{print $4}' | sort -n | head -1</span>   <span class="c"># 최저 loss</span>
<span class="p">$ grep "epoch" train.log | awk '$4 &gt; 5.0 {print NR, $0}'</span>          <span class="c"># 발산 지점</span>
<span class="p">$ grep "epoch" train.log | awk '{s+=$4} END {print s/NR}'</span>         <span class="c"># 평균</span></pre>`,
      foot: '십만 줄을 사람이 눈으로 훑는 대신, 다섯 줄로 답을 얻습니다.',
      nar: `첫 번째 과제는 십만 줄짜리 학습 로그입니다. 몇 에포크를 돌았는지, 최저 로스가 얼마였는지, 어느 지점에서 발산했는지를 찾아냅니다. 전부 그렙과 오크를 파이프로 이어서 해결합니다. 십만 줄을 사람이 눈으로 훑는 대신 다섯 줄로 답을 얻는 겁니다. 이게 리눅스를 배우는 실질적인 이유입니다.` },

    { eb: 'AI LAB', h: '지시학습 데이터셋 검증',
      sub: '모델에 넣기 전에 반드시 하는 일입니다.',
      body: `<div class="rowlist" style="margin-top:1.6cqh">
        <div class="row"><span class="dot">1</span><span class="t">전체 개수</span><span class="d">jq -s 'length'</span></div>
        <div class="row"><span class="dot">2</span><span class="t">빈 필드</span><span class="d">jq 'select(.response == "")'</span></div>
        <div class="row"><span class="dot">3</span><span class="t">중복 프롬프트</span><span class="d">jq -r .prompt | sort | uniq -d</span></div>
        <div class="row"><span class="dot">4</span><span class="t">길이 분포</span><span class="d">jq .len | sort -n | awk 통계</span></div>
        <div class="row"><span class="dot">5</span><span class="t">깨진 줄</span><span class="d">jq 가 실패하는 줄 찾기</span></div>
      </div>`,
      foot: '이 다섯 가지를 안 하고 학습을 돌리면, 이틀 뒤에 이상한 모델을 받게 됩니다.',
      nar: `두 번째 과제는 데이터셋 검증입니다. 다섯 가지를 확인합니다. 전체 개수, 빈 필드, 중복 프롬프트, 길이 분포, 그리고 문법이 깨진 줄. 이건 선택이 아니라 필수 절차입니다. 이 다섯 가지를 확인하지 않고 학습을 돌리면 이틀을 기다린 뒤에 이상한 모델을 받게 됩니다. 그때 원인을 찾는 것보다 지금 오 분 쓰는 편이 훨씬 쌉니다.` },

    { eb: 'Compare', h: '같은 일을 GUI로 했다면',
      body: `<div class="grid g2" style="margin-top:2cqh">
        <div class="card"><span class="n">GUI</span><span class="t">엑셀로 열기</span><span class="d">10만 줄 로딩 · 스크롤 · 수동 필터 · 함수 입력<br><br>대략 20~30분, 재현 불가능</span></div>
        <div class="card warn"><span class="n">CLI</span><span class="t">파이프라인 한 줄</span><span class="d">5초 · 명령을 저장해 두면 다음에도 같은 결과<br><br>Day 6에서 이걸 스크립트로 만듭니다</span></div>
      </div>`,
      nar: `실습이 끝나면 같은 작업을 지유아이로 했을 때와 비교해 보십시오. 엑셀로 십만 줄을 열어 필터를 걸고 함수를 쓰면 이삼십 분이 걸리고, 무엇보다 다음에 다시 할 때 또 처음부터 해야 합니다. 명령줄로는 오 초가 걸리고, 그 명령을 저장해 두면 다음에도 똑같은 결과가 나옵니다. 여섯째 날에는 이 명령들을 스크립트로 묶어서 아예 자동으로 돌게 만듭니다.` }
  ],

  assignment: {
    title: '오염된 데이터셋 정제 보고서',
    lede: '제공된 JSONL 데이터셋에는 문제가 섞여 있습니다. 파이프라인만으로 찾아내고 정제하세요.',
    items: [
      '전체 레코드 수',
      '빈 response 필드 개수',
      '중복된 prompt 목록',
      'len 필드의 최솟값·최댓값·평균',
      'JSON 문법이 깨진 줄 번호',
      '정제 후 결과를 clean.jsonl 로 저장'
    ],
    note: '각 항목의 값과 함께 <strong>사용한 파이프라인 전체</strong>를 적으십시오. 한 줄로 못 풀었다면 몇 단계로 나눠 쌓았는지 그 과정을 적어도 됩니다.',
    sample: `<span class="o">2. 빈 response 개수
   명령 : cat dirty.jsonl | jq 'select(.response=="")' | jq -s length
   결과 : 14</span>`,
    nar: `과제입니다. 오염된 제이에스오엔엘 데이터셋을 드립니다. 전체 개수, 빈 필드 개수, 중복 프롬프트, 길이 통계, 그리고 문법이 깨진 줄을 찾아내고, 정제한 결과를 새 파일로 저장하십시오. 값만 적지 말고 사용한 파이프라인 전체를 함께 적어 주십시오. 한 줄로 못 풀었으면 몇 단계로 나눠 쌓았는지 그 과정을 적어도 됩니다. 과정이 곧 답입니다.` },

  wrap: {
    done: 'grep·find·sed·awk·jq로 10만 줄에서 답을 뽑아내고, 데이터셋을 검증했습니다.',
    next: '내일 · Day 4 — 사용자 · 권한 · 프로세스',
    nextDesc: 'GPU 서버는 혼자 쓰지 않습니다. 권한이 무엇이고, 프로세스를 어떻게 다루는지 배웁니다.',
    nar: `오늘 한 일을 정리하겠습니다. 그렙과 정규표현식으로 찾고, 파인드로 파일을 골라내고, 세드로 바꾸고, 오크로 계산하고, 제이큐로 제이슨을 다뤘습니다. 그리고 그 도구들을 전부 동원해 십만 줄 로그와 오염된 데이터셋을 해부했습니다. 내일은 완전히 다른 주제입니다. 사용자와 권한과 프로세스. 지피유 서버는 혼자 쓰지 않는다는 전제에서 출발합니다. 수고하셨습니다.` },

  lab: {
    h1: '텍스트 처리와 데이터 해부',
    standfirst: '오늘은 도구 다섯 개를 익히고 실제 데이터에 씁니다. 미션마다 <strong>먼저 예상하고 실행</strong>하세요. 예상이 빗나간 지점이 곧 배울 지점입니다.',
    rules: [
      ['한 칸씩 쌓는다', '어제와 같습니다. 파이프는 앞에서부터 한 명령씩 붙이고 매번 head로 확인합니다.'],
      ['-i 와 -delete 는 나중에', 'sed -i, find -delete는 되돌릴 수 없습니다. 반드시 옵션 없이 먼저 돌려 결과를 봅니다.'],
      ['vim에 갇히면 Esc → :q!', '저장하지 않고 나가는 탈출구입니다. 이 두 개만 기억하세요.']
    ],
    parts: [
      {
        pn: 'PART 0', h: '실습 데이터 준비', time: '13:00–13:10',
        lede: '오늘 쓸 데이터를 직접 만듭니다. 강사가 배포한 파일이 있으면 그것을 쓰세요.',
        steps: [
          { sn: 'SETUP', h: '학습 로그와 데이터셋 만들기', body: `
      <p>실제와 비슷한 파일을 스크립트 없이 한 줄씩 만들어 봅니다. 지금은 이해하지 못해도 됩니다 — Day 6에서 이 문법을 배웁니다.</p>
      <pre><span class="p">$</span> cd ~/ai-lab/datasets

<span class="c"># 학습 로그 10,000줄 만들기</span>
<span class="p">$</span> for i in $(seq 1 10000); do
    echo "epoch $((i/100)) loss $(awk -v n=$i 'BEGIN{printf "%.4f", 3/(n/500+1)+0.05}') acc 0.9"
  done &gt; train.log

<span class="p">$</span> wc -l train.log
<span class="p">$</span> head -3 train.log
<span class="p">$</span> tail -3 train.log</pre>
      <div class="box check"><span class="lbl">확인</span><p>앞부분은 loss가 크고 뒤로 갈수록 작아져야 합니다. 실제 학습 로그의 모양입니다.</p></div>` },
          { sn: 'SETUP', h: '오염된 JSONL 만들기', body: `
      <pre><span class="p">$</span> cat &gt; dirty.jsonl &lt;&lt;'EOF'
{"prompt":"리눅스란?","response":"운영체제입니다","len":9}
{"prompt":"셸이란?","response":"","len":0}
{"prompt":"리눅스란?","response":"커널과 도구 모음","len":10}
{"prompt":"파이프란?","response":"출력을 이어주는 것","len":11}
{"prompt":"권한이란?","response":"","len":0}
{"prompt":"깨진 줄입니다 "len":3}
{"prompt":"awk란?","response":"컬럼 도구","len":7}
EOF
<span class="p">$</span> wc -l dirty.jsonl
<span class="p">$</span> cat dirty.jsonl</pre>
      <div class="box warn"><span class="lbl">일부러 넣은 문제 3종</span>
        <p>빈 <code>response</code> 2건, 중복 <code>prompt</code> 1쌍, JSON 문법 오류 1줄. 이 세 가지를 오늘 찾아냅니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 1', h: 'grep과 정규표현식', time: '13:10–14:00',
        missions: [
          { n: 1, h: 'grep 옵션 일곱 개', body: `
      <pre><span class="p">$</span> cd ~/ai-lab/datasets
<span class="p">$</span> grep "epoch 5" train.log | head -3
<span class="p">$</span> grep -c "epoch 5" train.log
<span class="p">$</span> grep -n "epoch 99" train.log | head -2
<span class="p">$</span> grep -v "acc 0.9" train.log | head        <span class="c"># 없는 줄만</span>
<span class="p">$</span> grep -i EPOCH train.log | head -2          <span class="c"># 대소문자 무시</span></pre>
      <div class="box q"><span class="lbl">확인 질문</span><p><code>grep -v</code>의 결과가 비어 있다면 그건 무슨 뜻일까요?</p></div>` },
          { n: 2, h: '정규표현식 여섯 개 써보기', body: `
      <pre><span class="p">$</span> grep "^epoch 1 " train.log | head -2      <span class="c"># 줄 시작</span>
<span class="p">$</span> grep "0.9$" train.log | head -2           <span class="c"># 줄 끝</span>
<span class="p">$</span> grep "loss 0\\.0[0-9]" train.log | head -3  <span class="c"># 범위</span>
<span class="p">$</span> grep -E "epoch (1|2) " train.log | head -3 <span class="c"># 확장 문법</span>

<span class="c"># -E 없이 | 를 쓰면?</span>
<span class="p">$</span> grep "epoch (1|2) " train.log | head -3</pre>
      <div class="box check"><span class="lbl">함정 확인</span><p>마지막 줄은 아무것도 안 나옵니다. <code>|</code>와 <code>+</code>는 <strong><code>-E</code>를 붙여야</strong> 동작합니다. 이 함정에 한 번은 걸리게 되니 지금 겪어 두세요.</p></div>` },
          { n: 3, h: '앞뒤 맥락까지 보기', body: `
      <pre><span class="p">$</span> grep -n "epoch 50 " train.log | head -1
<span class="p">$</span> grep -A2 -B2 "epoch 50 " train.log | head -10</pre>
      <div class="box check"><span class="lbl">실무에서 가장 자주 쓰는 형태</span>
        <p>로그에서 에러를 찾을 때 그 줄만 봐서는 원인을 모릅니다. <code>-B</code>로 직전에 무슨 일이 있었는지 봐야 합니다. Day 9 장애 대응에서 계속 씁니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: 'find · sed · awk', time: '14:00–15:00',
        missions: [
          { n: 4, h: 'find로 찾고 xargs로 처리', body: `
      <pre><span class="p">$</span> find ~/ai-lab -type f | head
<span class="p">$</span> find ~/ai-lab -name "*.log"
<span class="p">$</span> find ~/ai-lab -size +100k
<span class="p">$</span> find ~/ai-lab -name "*.log" | xargs wc -l</pre>
      <div class="box warn"><span class="lbl">-delete 연습은 이렇게</span>
        <pre style="margin-top:8px"><span class="p">$</span> touch ~/ai-lab/logs/a.tmp ~/ai-lab/logs/b.tmp
<span class="p">$</span> find ~/ai-lab -name "*.tmp"          <span class="c">← 먼저 목록 확인</span>
<span class="p">$</span> find ~/ai-lab -name "*.tmp" -delete  <span class="c">← 확인한 다음에만</span></pre></div>` },
          { n: 5, h: 'sed로 바꾸기', body: `
      <pre><span class="p">$</span> sed 's/epoch/EP/' train.log | head -3
<span class="p">$</span> sed -n '100,103p' train.log            <span class="c"># 특정 구간만</span>
<span class="p">$</span> sed '1,9990d' train.log                <span class="c"># 마지막 10줄만 남기기</span>

<span class="c"># -i 연습: 먼저 복사본에서</span>
<span class="p">$</span> cp train.log test.log
<span class="p">$</span> sed -i 's/acc/ACCURACY/g' test.log
<span class="p">$</span> head -2 test.log
<span class="p">$</span> rm test.log</pre>
      <div class="box q"><span class="lbl">확인 질문</span><p><code>s/a/b/</code>와 <code>s/a/b/g</code>의 차이를 한 줄에 <code>a</code>가 두 번 나오는 문장으로 직접 확인해 보세요.</p></div>` },
          { n: 6, h: 'awk로 계산하기', body: `
      <pre><span class="p">$</span> awk '{print $2, $4}' train.log | head -3
<span class="p">$</span> awk '{print $4}' train.log | sort -n | head -1       <span class="c"># 최저 loss</span>
<span class="p">$</span> awk '{print $4}' train.log | sort -n | tail -1       <span class="c"># 최고 loss</span>
<span class="p">$</span> awk '{s+=$4} END {print "평균", s/NR}' train.log
<span class="p">$</span> awk '$4 &gt; 1.0' train.log | wc -l                     <span class="c"># loss 1.0 초과 줄 수</span></pre>
      <div class="box check"><span class="lbl">세 가지만 기억하세요</span>
        <p><code>$1 $2 …</code> 컬럼 번호, <code>NR</code> 읽은 줄 수, <code>END {}</code> 마지막에 한 번 실행. 이 셋이면 합계·평균·개수가 전부 됩니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: 'jq와 데이터셋 검증', time: '15:10–16:30',
        lede: '오늘의 본편입니다. 일부러 오염시킨 데이터셋에서 문제 세 가지를 찾아냅니다.',
        missions: [
          { n: 7, h: 'jq 기본기', body: `
      <pre><span class="p">$</span> cd ~/ai-lab/datasets
<span class="p">$</span> cat dirty.jsonl | jq . 2&gt;/dev/null | head -8
<span class="p">$</span> cat dirty.jsonl | jq -r .prompt 2&gt;/dev/null
<span class="p">$</span> cat dirty.jsonl | jq -r '[.prompt,.len] | @tsv' 2&gt;/dev/null</pre>
      <div class="box warn"><span class="lbl">왜 <code>2&gt;/dev/null</code> 인가</span>
        <p>깨진 줄에서 jq가 오류를 뱉기 때문입니다. 어제 배운 표준 에러 버리기가 여기서 바로 쓰입니다.</p></div>` },
          { n: 8, h: '문제 1 — 빈 필드 찾기', body: `
      <pre><span class="p">$</span> cat dirty.jsonl | jq -c 'select(.response == "")' 2&gt;/dev/null
<span class="p">$</span> cat dirty.jsonl | jq -c 'select(.response == "")' 2&gt;/dev/null | wc -l</pre>
      <div class="box q"><span class="lbl">확인 질문</span><p>응답이 비어 있는 데이터로 모델을 학습시키면 어떤 일이 생길까요?</p></div>` },
          { n: 9, h: '문제 2 — 중복 프롬프트 찾기', body: `
      <pre><span class="p">$</span> cat dirty.jsonl | jq -r .prompt 2&gt;/dev/null | sort | uniq -d
<span class="p">$</span> cat dirty.jsonl | jq -r .prompt 2&gt;/dev/null | sort | uniq -c | sort -rn | head -3</pre>
      <div class="box check"><span class="lbl">sort → uniq 조합</span>
        <p><code>uniq</code>는 <strong>인접한</strong> 중복만 없앱니다. 그래서 반드시 <code>sort</code>를 먼저 해야 합니다. <code>-d</code>는 중복된 것만, <code>-c</code>는 개수와 함께입니다.</p></div>` },
          { n: 10, h: '문제 3 — 깨진 줄 찾기', body: `
      <pre><span class="p">$</span> cat -n dirty.jsonl | while read -r n line; do
    echo "$line" | jq . &gt;/dev/null 2&gt;&amp;1 || echo "깨진 줄: $n"
  done</pre>
      <p>더 간단한 방법도 있습니다.</p>
      <pre><span class="p">$</span> grep -n -v '^{.*}$' dirty.jsonl</pre>
      <div class="box q"><span class="lbl">확인 질문</span><p>두 번째 방법은 왜 완벽하지 않을까요? 어떤 깨진 JSON을 놓칠 수 있을까요?</p></div>` },
          { n: 11, h: '정제해서 저장하기', body: `
      <pre><span class="p">$</span> cat dirty.jsonl \\
    | jq -c 'select(.response != "")' 2&gt;/dev/null \\
    &gt; clean.jsonl

<span class="p">$</span> wc -l dirty.jsonl clean.jsonl
<span class="p">$</span> cat clean.jsonl | jq -r .prompt | sort | uniq -d   <span class="c"># 중복은 아직 남아 있습니다</span></pre>
      <div class="box check"><span class="lbl">과제로 이어집니다</span>
        <p>중복까지 제거하는 것이 과제의 마지막 항목입니다. <code>jq -s</code>(전체를 배열로 읽기)와 <code>unique_by</code>를 찾아보세요 — <code>jq --help</code>와 <code>man jq</code>가 출발점입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 4', h: 'vim 생존 훈련', time: '16:30–17:10',
        missions: [
          { n: 12, h: '들어갔다 나오기', body: `
      <p>vim은 "들어가고 나오는 법"을 먼저 익혀야 합니다. 겁먹지 말고 반복하세요.</p>
      <pre><span class="p">$</span> vim ~/ai-lab/scripts/memo.txt</pre>
      <ol>
        <li><kbd>i</kbd>를 누릅니다 — 하단에 <code>-- INSERT --</code>가 뜹니다</li>
        <li>아무 문장이나 세 줄 칩니다</li>
        <li><kbd>Esc</kbd> — INSERT 표시가 사라집니다</li>
        <li><code>:wq</code> + <kbd>Enter</kbd> — 저장하고 나옵니다</li>
        <li><code>cat ~/ai-lab/scripts/memo.txt</code>로 확인</li>
      </ol>
      <div class="box warn"><span class="lbl">탈출 연습</span>
        <p>다시 열어서 아무 글자나 친 다음 <kbd>Esc</kbd> → <code>:q!</code>로 나오세요. 저장되지 않았는지 확인합니다. <strong>이 탈출구를 몸이 기억해야 합니다.</strong></p></div>` },
          { n: 13, h: '검색하고 고치기', body: `
      <pre><span class="p">$</span> cp /etc/hosts ~/ai-lab/scripts/hosts.bak
<span class="p">$</span> vim ~/ai-lab/scripts/hosts.bak</pre>
      <ul>
        <li><code>/localhost</code> + <kbd>Enter</kbd> — 검색, <kbd>n</kbd>으로 다음</li>
        <li><kbd>G</kbd> 맨 끝으로, <kbd>g</kbd><kbd>g</kbd> 맨 앞으로</li>
        <li><kbd>d</kbd><kbd>d</kbd> 줄 삭제 → <kbd>u</kbd> 되돌리기</li>
        <li><code>:%s/localhost/LOCAL/g</code> 전체 치환 → <kbd>u</kbd>로 되돌리기</li>
        <li><code>:q!</code>로 나가기</li>
      </ul>
      <div class="box check"><span class="lbl">Day 7 예고</span>
        <p>일곱째 날 systemd 설정 파일을 고칠 때 이 실력이 그대로 쓰입니다. 오늘 <kbd>u</kbd>(되돌리기)만큼은 확실히 익혀 두세요.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>grep "a|b"</code>가 안 먹는다', '확장 정규표현식', '<code>grep -E</code> 를 씁니다'],
      ['jq에서 <code>parse error</code>', '깨진 JSON 줄', '정상입니다. <code>2&gt;/dev/null</code>로 넘기고 따로 찾습니다'],
      ['<code>uniq</code>가 중복을 못 잡는다', '정렬 안 함', '<code>sort</code>를 먼저 통과시킵니다'],
      ['<code>sed -i</code> 후 원본이 사라졌다', '덮어쓰기', '복구 불가. 복사본에서 먼저 연습합니다'],
      ['vim에서 못 나가겠다', '모드 혼동', '<kbd>Esc</kbd> 두 번 → <code>:q!</code>'],
      ['awk가 빈 값을 낸다', '컬럼 번호 착각', '<code>awk \'{print NF}\'</code>로 컬럼이 몇 개인지 먼저 확인']
    ],
    checklist: [
      'grep의 <code>-i -n -c -v -r -A -B</code>를 각각 써 봤다',
      '<code>-E</code> 없이 <code>|</code>를 쓰면 안 된다는 것을 직접 확인했다',
      '<code>find</code>로 이름·크기 조건 검색을 하고 <code>xargs</code>로 이어 봤다',
      '<code>sed</code>의 <code>s///</code>와 <code>s///g</code>의 차이를 안다',
      '<code>awk</code>로 최솟값·평균·조건 필터를 구했다',
      '<code>jq</code>로 필드를 뽑고 <code>select</code>로 걸렀다',
      '데이터셋의 빈 필드·중복·깨진 줄을 모두 찾아냈다',
      '<code>clean.jsonl</code>을 만들었다',
      'vim에서 저장하고 나오기와 버리고 나오기를 둘 다 해 봤다'
    ]
  },

  quizTitle: '텍스트 처리 퀴즈',
  quiz: [
    { q: '<code>grep -v error app.log</code>의 결과는?', o: ['error가 없는 줄만', 'error가 있는 줄만', 'error의 개수', '대소문자 무시하고 검색'], a: 0,
      e: '<code>-v</code>는 invert, 반대로입니다. 노이즈를 걷어낼 때 자주 씁니다.' },
    { q: '찾은 줄의 <strong>앞 2줄까지</strong> 함께 보려면?', o: ['grep -B2', 'grep -A2', 'grep -C2만 가능', 'grep -n2'], a: 0,
      e: '<code>-B</code>는 before, <code>-A</code>는 after, <code>-C</code>는 양쪽입니다. 장애 원인은 대개 직전 줄에 있습니다.' },
    { q: '정규표현식에서 <code>^</code>는?', o: ['줄의 시작', '줄의 끝', '아무 글자', '부정'], a: 0,
      e: '<code>^</code> 시작, <code>$</code> 끝입니다. <code>grep "^epoch"</code>는 epoch로 시작하는 줄만 고릅니다.' },
    { q: '<code>grep "epoch (1|2)"</code>가 아무것도 못 찾는 이유는?', o: ['| 는 확장 문법이라 -E 가 필요하다', '괄호를 쓸 수 없다', '따옴표가 틀렸다', '대소문자 때문'], a: 0,
      e: '<code>grep -E</code> 또는 <code>egrep</code>를 써야 합니다. 이 함정에 대부분 한 번은 걸립니다.' },
    { q: '<code>~/ai-lab</code>에서 1MB보다 큰 파일을 찾는 명령은?', o: ['find ~/ai-lab -size +1M', 'find ~/ai-lab -size 1M+', 'ls -size +1M ~/ai-lab', 'du -size +1M'], a: 0,
      e: '<code>+</code>는 초과, <code>-</code>는 미만입니다. 부호를 빼면 정확히 그 크기만 찾습니다.' },
    { q: '<code>find ... -delete</code>를 쓰기 전에 반드시 할 일은?', o: ['-delete 없이 실행해 목록을 눈으로 본다', 'sudo를 붙인다', '백업 폴더를 만든다', '-i 옵션을 추가한다'], a: 0,
      e: '<code>-delete</code>는 확인 없이 지웁니다. 목록 확인이 유일한 안전장치입니다.' },
    { q: '<code>sed \'s/a/b/\'</code>와 <code>sed \'s/a/b/g\'</code>의 차이는?', o: ['g가 있으면 한 줄 안의 모든 a를 바꾼다', 'g가 있으면 전체 파일에 적용된다', 'g가 있으면 대소문자를 무시한다', '차이가 없다'], a: 0,
      e: 'g는 global이지만 "줄 안에서 전부"라는 뜻입니다. 파일 전체는 원래 모든 줄에 적용됩니다.' },
    { q: '<code>sed</code>로 파일을 <strong>직접</strong> 수정하는 옵션은? (직접 입력)', t: true, acc: ['-i', 'sed -i'], ans: '-i',
      e: 'in-place입니다. 되돌릴 수 없으니 반드시 옵션 없이 먼저 확인하세요.' },
    { q: 'awk에서 <code>NR</code>은 무엇인가요?', o: ['지금까지 읽은 줄 수', '컬럼 개수', '파일 크기', '레코드 번호의 역순'], a: 0,
      e: 'Number of Records입니다. <code>{s+=$4} END {print s/NR}</code>이 평균이 되는 이유입니다.' },
    { q: '공백으로 나뉜 로그에서 <strong>4번째 값</strong>만 출력하는 awk는? (직접 입력)', t: true, acc: ["awk '{print $4}'", 'awk {print $4}', "awk '{print $4}' train.log"], ans: "awk '{print $4}'",
      e: '컬럼은 <code>$1</code>부터 번호로 부릅니다. <code>$0</code>은 줄 전체입니다.' },
    { q: 'CSV처럼 쉼표로 나뉜 파일을 awk로 다루려면?', o: ['awk -F,', 'awk -d,', 'awk --csv', 'awk -s,'], a: 0,
      e: '<code>-F</code>는 field separator입니다. 탭이면 <code>-F"\\t"</code>를 씁니다.' },
    { q: 'jq에서 <code>-r</code> 옵션의 역할은?', o: ['따옴표를 뗀 순수 문자열로 출력', '재귀 탐색', '읽기 전용', '역순 정렬'], a: 0,
      e: 'raw output입니다. 파이프로 다음 명령에 넘길 때는 거의 항상 붙입니다.' },
    { q: 'JSONL에서 <code>len</code>이 512보다 큰 레코드만 남기는 jq는?', o: ["jq 'select(.len > 512)'", "jq 'filter(.len > 512)'", "jq 'where .len > 512'", "jq '.len > 512'"], a: 0,
      e: '<code>select</code>가 jq의 필터입니다. 조건이 참인 입력만 통과시킵니다.' },
    { q: '<code>uniq</code>가 중복을 못 잡을 때 가장 흔한 원인은?', o: ['sort를 먼저 안 했다', '-d를 안 붙였다', '파일이 너무 크다', '대소문자가 달랐다'], a: 0,
      e: '<code>uniq</code>는 <strong>인접한</strong> 중복만 처리합니다. 그래서 <code>sort | uniq</code>가 한 몸처럼 쓰입니다.' },
    { q: '중복된 항목<strong>만</strong> 보여주는 uniq 옵션은?', o: ['-d', '-u', '-c', '-r'], a: 0,
      e: '<code>-d</code> 중복된 것만, <code>-u</code> 한 번만 나온 것만, <code>-c</code> 개수와 함께입니다.' },
    { q: 'jq가 <code>parse error</code>를 낼 때 실습에서 쓴 대처는?', o: ['2>/dev/null로 오류를 버리고, 깨진 줄은 따로 찾는다', 'jq를 재설치한다', '파일을 다시 받는다', '-r 옵션을 뺀다'], a: 0,
      e: 'Day 2에서 배운 표준 에러 분리가 여기서 실제로 쓰입니다.' },
    { q: 'vim에서 <strong>저장하지 않고</strong> 나가는 명령은? (직접 입력)', t: true, acc: [':q!', 'q!'], ans: ':q!',
      e: '망쳤을 때의 탈출구입니다. <kbd>Esc</kbd> → <code>:q!</code>를 몸이 기억해야 합니다.' },
    { q: 'vim에서 방금 한 작업을 되돌리는 키는?', o: ['u', 'z', 'r', 'Ctrl+Z'], a: 0,
      e: '<kbd>u</kbd>는 undo입니다. <kbd>Ctrl</kbd>+<kbd>Z</kbd>는 vim을 백그라운드로 보내 버리니 주의하세요 — <code>fg</code>로 돌아옵니다.' }
  ]
};
