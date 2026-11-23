/* ---------------------------------------------------------------
   vibe70 · 공통 사이드바 (ubuntu2404 강좌와 같은 구성)
   이 파일은 _src/build.js 가 자동으로 만듭니다. 직접 고치지 말고
   _src/js/nav.js(템플릿)와 _src/dayN.js 를 고친 뒤 다시 빌드하세요.
   --------------------------------------------------------------- */
(function () {
  var THIS = document.currentScript;
  var DATA = /*__DATA__*/null;
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
