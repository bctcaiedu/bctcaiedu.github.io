/* ---------------------------------------------------------------
   vibe70 · 공통 사이드바 (ubuntu2404 강좌와 같은 구성)
   이 파일은 _src/build.js 가 자동으로 만듭니다. 직접 고치지 말고
   _src/js/nav.js(템플릿)와 _src/dayN.js 를 고친 뒤 다시 빌드하세요.
   --------------------------------------------------------------- */
(function () {
  var THIS = document.currentScript;
  var DATA = {"course":"바이브 코딩","sub":"학생용 · 70시간","groups":[{"label":"바이브 코딩","from":1,"to":5},{"label":"하네스 엔지니어링","from":6,"to":8},{"label":"종합 프로젝트","from":9,"to":10}],"days":[{"n":1,"title":"AI 코딩 이해와 세 도구 설치","periods":[{"no":1,"title":"오리엔테이션","desc":"AI 코딩의 흐름과 과정 지도"},{"no":2,"title":"터미널 기초와 Node.js 설치","desc":"에이전트가 사는 곳, 터미널"},{"no":3,"title":"Claude Code 설치와 첫 대화","desc":"Anthropic의 코딩 에이전트"},{"no":4,"title":"Gemini CLI 설치와 첫 대화","desc":"Google의 코딩 에이전트"},{"no":5,"title":"Codex CLI 설치와 첫 대화","desc":"OpenAI의 코딩 에이전트"},{"no":6,"title":"같은 요청, 세 가지 결과","desc":"\"자기소개 페이지 만들어줘\"를 세 도구에 똑같이"},{"no":7,"title":"Git 기초와 GitHub Pages 첫 배포","desc":"커밋은 저장 지점이다"}]},{"n":2,"title":"바이브 코딩 기초","periods":[{"no":8,"title":"좋은 요청의 4요소","desc":"목표 · 맥락 · 제약 · 완료 기준"},{"no":9,"title":"고쳐 달라고 하기","desc":"스크린샷과 오류 메시지 전달"},{"no":10,"title":"계획 먼저","desc":"만들기 전에 설계를 확인받기"},{"no":11,"title":"작게 쪼개기","desc":"만들고 → 확인하고 → 커밋하는 리듬"},{"no":12,"title":"승인 모드 비교","desc":"묻고 실행 · 자동 실행 · 읽기 전용"},{"no":13,"title":"실습 1: 미니 웹앱 만들기","desc":"계산기는 Claude, 타이머는 Gemini"},{"no":14,"title":"실습 2: 미니 웹앱 만들기","desc":"명언 카드는 Codex, 그리고 비교"}]},{"n":3,"title":"바이브 코딩 실전","periods":[{"no":15,"title":"누적 프로젝트 시작","desc":"주제 정하기와 주력 도구 고르기"},{"no":16,"title":"데이터 저장","desc":"JSON과 localStorage"},{"no":17,"title":"공개 API 불러오기","desc":"바깥 데이터 붙이기"},{"no":18,"title":"화면 늘려 가기","desc":"상태 관리와 화면 구성"},{"no":19,"title":"버그 사냥","desc":"재현 → 원인 → 수정"},{"no":20,"title":"다른 도구에게 물어보기","desc":"막혔을 때 두 번째 의견"},{"no":21,"title":"중간 배포와 짝 리뷰","desc":"서로의 앱을 써 보고 피드백"}]},{"n":4,"title":"서버와 AI 기능 붙이기","periods":[{"no":22,"title":"프런트엔드와 백엔드","desc":"왜 서버가 필요한가"},{"no":23,"title":"데이터베이스 맛보기","desc":"SQLite로 데이터 쌓기"},{"no":24,"title":"LLM API 세 가지 호출","desc":"Claude · Gemini · OpenAI API"},{"no":25,"title":"프로젝트에 AI 기능 넣기","desc":"할 일 자동 분류 · 퀴즈 자동 출제"},{"no":26,"title":"키 관리","desc":".env와 .gitignore"},{"no":27,"title":"서버 배포","desc":"무료 호스팅에 올리기"},{"no":28,"title":"정리와 공유","desc":"오늘 붙인 AI 기능 시연"}]},{"n":5,"title":"바이브 코딩의 한계와 검증","periods":[{"no":29,"title":"AI가 틀리는 방식","desc":"환각 · 오래된 지식 · 자신감 있는 오답"},{"no":30,"title":"맥락 창 이해하기","desc":"대화가 길어지면 생기는 일"},{"no":31,"title":"보안 기본","desc":"키 · 입력 검증 · 샌드박스"},{"no":32,"title":"저작권 · 라이선스 · 윤리","desc":"내가 책임지는 결과물"},{"no":33,"title":"테스트 입문","desc":"AI에게 테스트를 먼저 쓰게 하기"},{"no":34,"title":"검증 습관","desc":"직접 확인하는 체크리스트"},{"no":35,"title":"실습: 망가진 프로젝트 고치기","desc":"하네스가 왜 필요한지 느끼는 시간"}]},{"n":6,"title":"하네스 I · 규칙과 기억","periods":[{"no":36,"title":"하네스란 무엇인가","desc":"엔진과 고삐 · 계기판 · 안전벨트"},{"no":37,"title":"규칙 파일 세 가지","desc":"CLAUDE.md · GEMINI.md · AGENTS.md"},{"no":38,"title":"규칙 하나로 세 도구","desc":"AGENTS.md를 공통 규칙으로"},{"no":39,"title":"좋은 규칙과 나쁜 규칙","desc":"구체적이고 검증 가능한 지시"},{"no":40,"title":"권한 설계","desc":"허용 목록과 차단 목록"},{"no":41,"title":"메모리","desc":"세션이 바뀌어도 이어지는 지식"},{"no":42,"title":"실습: 규칙 적용 전후 비교","desc":"누적 프로젝트에 하네스 1단계"}]},{"n":7,"title":"하네스 II · 재사용과 자동화","periods":[{"no":43,"title":"사용자 정의 명령","desc":"자주 하는 요청을 명령 하나로"},{"no":44,"title":"스킬","desc":"작업 절차를 재사용 가능한 지침으로"},{"no":45,"title":"훅 1: 자동 포맷과 린트","desc":"편집할 때마다 자동으로"},{"no":46,"title":"훅 2: 위험한 명령 차단","desc":"커밋 전 검사"},{"no":47,"title":"테스트를 하네스로","desc":"통과해야만 완료"},{"no":48,"title":"비대화형 실행","desc":"claude -p · gemini -p · codex exec"},{"no":49,"title":"실습: 내 개발 환경 완성","desc":"어느 도구로도 같은 검사"}]},{"n":8,"title":"하네스 III · 도구와 다중 에이전트","periods":[{"no":50,"title":"MCP 개념","desc":"하나의 MCP 서버를 세 도구에"},{"no":51,"title":"MCP 서버 만들기","desc":"내 도구를 AI에게 주기"},{"no":52,"title":"역할 분담","desc":"서브에이전트와 세션 나누기"},{"no":53,"title":"병렬 작업","desc":"Git 워크트리로 동시에"},{"no":54,"title":"교차 리뷰","desc":"Claude가 짜고, Codex가 보고, Gemini가 테스트"},{"no":55,"title":"CI 연동","desc":"GitHub Actions로 PR마다"},{"no":56,"title":"실습: PR 흐름으로 개선","desc":"누적 프로젝트 마무리"}]},{"n":9,"title":"종합 프로젝트 설계와 구현","periods":[{"no":57,"title":"팀 구성과 주제 선정","desc":"학과 안내 챗봇 · 실습실 예약 · 출결 대시보드"},{"no":58,"title":"요구사항과 화면 설계","desc":"무엇을 만들지 글로 먼저"},{"no":59,"title":"팀 하네스 설계","desc":"공통 AGENTS.md · 명령 · 훅 · 테스트"},{"no":60,"title":"구현 1-1","desc":"핵심 기능 시작"},{"no":61,"title":"구현 1-2","desc":"핵심 기능 계속"},{"no":62,"title":"구현 1-3","desc":"데이터와 AI 기능"},{"no":63,"title":"구현 1-4","desc":"중간 점검"}]},{"n":10,"title":"완성 · 발표 · 회고","periods":[{"no":64,"title":"구현 2-1","desc":"남은 기능 마무리"},{"no":65,"title":"구현 2-2","desc":"테스트와 버그 수정"},{"no":66,"title":"구현 2-3","desc":"배포와 문서"},{"no":67,"title":"발표 리허설","desc":"상호 피드백"},{"no":68,"title":"최종 발표 1","desc":"시연과 하네스 이야기"},{"no":69,"title":"최종 발표 2","desc":"시연과 질의응답"},{"no":70,"title":"회고","desc":"도구는 바뀌어도 남는 것"}]}]};
  var TOTAL = DATA.days.reduce(function (s, d) { return s + d.periods.length; }, 0);

  /* ---------- 저장소 (사용할 수 없으면 조용히 무시) ---------- */
  function load(k, def) { try { var v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var done = load('vibe70-done', []);
  function isDone(no) { return done.indexOf(no) >= 0; }

  /* ---------- 경로 ---------- */
  var B = ((THIS && THIS.src) || '').replace(/[^/]*$/, '');
  var path = location.pathname.replace(/\\/g, '/');
  var m = path.match(/\/day(\d+)\/([^/]*)$/);
  var curDay = m ? +m[1] : 0;
  var curFile = m ? (m[2] || 'index.html') : '';
  var isHome = !m;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return String(n).padStart(2, '0'); }

  /* ---------- 테마 ---------- */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    save('vibe70-theme', t);
  }
  function curTheme() {
    var t = document.documentElement.dataset.theme;
    if (t) return t;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /* ---------- 사이드바 만들기 ---------- */
  function dayHTML(d) {
    var cnt = d.periods.filter(function (p) { return isDone(p.no); }).length;
    var active = d.n === curDay;
    var h = '<div class="nav-ch' + (active ? ' open active' : '') + '" data-day="' + d.n + '">';
    h += '<div class="nav-ch-head"><span class="no">D' + pad(d.n) + '</span><span class="t">' + esc(d.title) + '</span>' +
         '<span class="cnt">' + cnt + '/' + d.periods.length + '</span><span class="caret">▶</span></div>';
    h += '<div class="nav-secs">';
    [['index.html', '📺', '강의 슬라이드'], ['lab.html', '🛠️', '실습 가이드'], ['quiz.html', '✅', '퀴즈']].forEach(function (it) {
      var on = active && curFile === it[0];
      h += '<a class="nav-sec' + (on ? ' active' : '') + '" href="' + B + 'day' + d.n + '/' + it[0] + '"><span class="chk">' + it[1] + '</span><span>' + it[2] + '</span></a>';
    });
    h += '<div class="nav-sep"></div>';
    d.periods.forEach(function (p) {
      h += '<a class="nav-sec period' + (isDone(p.no) ? ' done' : '') + '" href="' + B + 'day' + d.n + '/lab.html#p' + p.no + '">' +
           '<span class="chk">' + (isDone(p.no) ? '✓' : '○') + '</span><span><b>' + p.no + '</b> ' + esc(p.title) + '</span></a>';
    });
    return h + '</div></div>';
  }

  function treeHTML() {
    var h = '<a class="nav-home' + (isHome ? ' active' : '') + '" href="' + B + 'index.html">🏠 강좌 소개</a>';
    DATA.groups.forEach(function (g) {
      h += '<div class="nav-group">' + esc(g.label) + '</div>';
      DATA.days.forEach(function (d) { if (d.n >= g.from && d.n <= g.to) h += dayHTML(d); });
    });
    return h;
  }

  function searchHTML(q) {
    q = q.toLowerCase();
    var h = '', n = 0;
    DATA.days.forEach(function (d) {
      d.periods.forEach(function (p) {
        var hay = (p.title + ' ' + p.desc + ' ' + d.title).toLowerCase();
        if (hay.indexOf(q) < 0) return;
        n++;
        h += '<a class="nav-sec" href="' + B + 'day' + d.n + '/lab.html#p' + p.no + '"><span class="chk">' + (isDone(p.no) ? '✓' : '○') + '</span>' +
             '<span>' + p.no + '차시 · ' + esc(p.title) + '<span class="hit">Day ' + d.n + ' · ' + esc(p.desc) + '</span></span></a>';
      });
    });
    return n ? h : '<div class="nav-group">검색 결과가 없습니다</div>';
  }

  function build() {
    document.body.classList.add('has-nav');
    if (load('vibe70-navc', false) && innerWidth > 1000) document.body.classList.add('nav-collapsed');

    var nav = document.createElement('nav');
    nav.className = 'vnav';
    nav.setAttribute('aria-label', '과정 목차');
    nav.innerHTML =
      '<div class="brand"><a class="brand-logo" href="' + B + 'index.html" title="강좌 소개">🎛️</a>' +
      '<div class="brand-text"><div class="brand-title">' + esc(DATA.course) + '</div><div class="brand-sub">🎓 ' + esc(DATA.sub) + '</div></div>' +
      '<a class="icon-btn" href="/" title="강의실 홈">🏠</a>' +
      '<button class="icon-btn" type="button" data-act="theme" title="라이트 / 다크">◐</button>' +
      '<button class="icon-btn" type="button" data-act="close" title="목차 접기">⟨</button></div>' +
      '<div class="progress-wrap"><div class="progress-label"><span>학습 진도</span><span data-prog-text>0 / ' + TOTAL + '</span></div>' +
      '<div class="progress"><i data-prog-bar></i></div></div>' +
      '<input class="nav-search" type="search" placeholder="검색 (예: 훅, MCP, AGENTS.md, 테스트)">' +
      '<div class="nav-tree"></div>' +
      '<div class="nav-foot"><div class="tool-badge"><span class="dot"></span>Claude Code · Gemini CLI · Codex CLI</div></div>';
    document.body.appendChild(nav);

    var bd = document.createElement('div'); bd.className = 'vnav-bd'; document.body.appendChild(bd);
    var ob = document.createElement('button'); ob.className = 'vnav-open'; ob.type = 'button'; ob.title = '목차 열기'; ob.textContent = '☰';
    document.body.appendChild(ob);

    var tree = nav.querySelector('.nav-tree');
    var search = nav.querySelector('.nav-search');
    function render() { tree.innerHTML = search.value.trim() ? searchHTML(search.value.trim()) : treeHTML(); }
    render();
    search.addEventListener('input', render);
    tree.addEventListener('click', function (e) {
      var head = e.target.closest('.nav-ch-head');
      if (head) head.parentNode.classList.toggle('open');
      else if (e.target.closest('a') && innerWidth <= 1000) document.body.classList.remove('nav-open');
    });

    function close() {
      if (innerWidth <= 1000) document.body.classList.remove('nav-open');
      else { document.body.classList.add('nav-collapsed'); save('vibe70-navc', true); }
    }
    ob.onclick = function () {
      if (innerWidth <= 1000) document.body.classList.add('nav-open');
      else { document.body.classList.remove('nav-collapsed'); save('vibe70-navc', false); }
    };
    bd.onclick = function () { document.body.classList.remove('nav-open'); };
    nav.querySelector('[data-act="close"]').onclick = close;
    nav.querySelector('[data-act="theme"]').onclick = function () { setTheme(curTheme() === 'dark' ? 'light' : 'dark'); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.body.classList.remove('nav-open'); });

    /* ---------- 진도 표시 ---------- */
    function refresh() {
      var n = done.length;
      nav.querySelector('[data-prog-text]').textContent = n + ' / ' + TOTAL;
      nav.querySelector('[data-prog-bar]').style.width = (n / TOTAL * 100) + '%';
      document.querySelectorAll('[data-day-progress]').forEach(function (el) {
        var d = DATA.days[+el.dataset.dayProgress - 1];
        var c = d.periods.filter(function (p) { return isDone(p.no); }).length;
        var bar = el.querySelector('i'); if (bar) bar.style.width = (c / d.periods.length * 100) + '%';
        var t = el.parentNode.querySelector('[data-day-count]'); if (t) t.textContent = c + ' / ' + d.periods.length + ' 차시 완료';
      });
      document.querySelectorAll('.done-btn[data-no]').forEach(function (b) {
        var on = isDone(+b.dataset.no);
        b.classList.toggle('done', on);
        b.textContent = on ? '✓ 완료함' : '✓ 완료로 표시';
      });
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.done-btn[data-no]');
      if (!b) return;
      var no = +b.dataset.no, i = done.indexOf(no);
      if (i >= 0) done.splice(i, 1); else done.push(no);
      save('vibe70-done', done);
      refresh(); render();
    });
    refresh();

    /* ---------- 자가 점검 체크 상태 저장 ---------- */
    document.querySelectorAll('.selfcheck input[type=checkbox]').forEach(function (c, i) {
      var key = 'vibe70-chk-' + curDay + '-' + i;
      c.checked = !!load(key, false);
      c.onchange = function () { save(key, c.checked); };
    });

    var a = tree.querySelector('.nav-sec.active, .nav-home.active');
    if (a) tree.scrollTop = Math.max(0, a.offsetTop - tree.offsetTop - tree.clientHeight / 2);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
