/* ---------------------------------------------------------------
   physicalai48 · 공통 목차 사이드바
   페이지 끝에 <script src="../nav.js"></script> 한 줄만 넣으면 됩니다.
   새 일차를 추가할 때는 아래 DAYS 배열만 고치면 전체 페이지에 반영됩니다.
   --------------------------------------------------------------- */
(function () {
  var THIS = document.currentScript;

  /* ====== 여기만 고치면 됩니다 ====================================== */
  var COURSE = '영상 AI × 피지컬 AI';
  var SUB    = '48시간 · 6일 과정';

  var DAYS = [
    { n: 1,  dir: 'day1',  title: '영상 AI의 시작 — 보는 AI를 만든다', items: [
        { f: 'index.html', label: '강의 슬라이드', tag: '나레이션' },
        { f: 'lab.html',   label: '실습 가이드' },
        { f: 'quiz.html',  label: '퀴즈',  tag: '18문항' }
      ] },
    { n: 2,  dir: 'day2',  title: '딥러닝 검출과 랜드마크', items: [
        { f: 'index.html', label: '강의 슬라이드', tag: '나레이션' },
        { f: 'lab.html',   label: '실습 가이드' },
        { f: 'quiz.html',  label: '퀴즈',  tag: '18문항' }
      ] },
    { n: 3,  dir: 'day3',  title: '가상의 몸 — 시뮬레이터와 MJCF', items: [
        { f: 'index.html', label: '강의 슬라이드', tag: '나레이션' },
        { f: 'lab.html',   label: '실습 가이드' },
        { f: 'quiz.html',  label: '퀴즈',  tag: '18문항' }
      ] },
    { n: 4,  dir: 'day4',  title: '로봇팔 제어와 시뮬레이터 센서', items: [
        { f: 'index.html', label: '강의 슬라이드', tag: '나레이션' },
        { f: 'lab.html',   label: '실습 가이드' },
        { f: 'quiz.html',  label: '퀴즈',  tag: '18문항' }
      ] },
    { n: 5,  dir: 'day5',  title: '인식·판단·행동을 하나로', items: [
        { f: 'index.html', label: '강의 슬라이드', tag: '나레이션' },
        { f: 'lab.html',   label: '실습 가이드' },
        { f: 'quiz.html',  label: '퀴즈',  tag: '18문항' }
      ] },
    { n: 6,  dir: 'day6',  title: '강화학습과 Isaac — 스스로 배우는 로봇', items: [
        { f: 'index.html', label: '강의 슬라이드', tag: '나레이션' },
        { f: 'lab.html',   label: '실습 가이드' },
        { f: 'quiz.html',  label: '퀴즈',  tag: '18문항' }
      ] }
  ];
  /* ================================================================ */

  var CSS = [
    ':root{--sn-w:266px}',
    '.l70nav,.l70nav *{box-sizing:border-box}',
    '.l70nav{--sn-bg:#FFFFFF;--sn-bg2:#EDF1EC;--sn-ink:#141A16;--sn-ink2:#3A453E;--sn-mut:#5F6D65;',
    '     --sn-line:#DBE2DC;--sn-ac:#10684A;--sn-soft:#E2EFE8;',
    '     position:fixed;inset:0 auto 0 0;width:var(--sn-w);z-index:60;overflow-y:auto;',
    '     background:var(--sn-bg);border-right:1px solid var(--sn-line);color:var(--sn-ink);',
    '     font-family:"IBM Plex Sans KR","Malgun Gothic",system-ui,sans-serif;',
    '     -webkit-overflow-scrolling:touch}',
    '@media (prefers-color-scheme:dark){.l70nav{--sn-bg:#141A17;--sn-bg2:#1C2320;--sn-ink:#E7ECE8;',
    '     --sn-ink2:#C2CCC6;--sn-mut:#94A29A;--sn-line:#27302B;--sn-ac:#57C294;--sn-soft:#16291F}}',
    '.sn-hd{padding:20px 18px 16px;border-bottom:1px solid var(--sn-line)}',
    '.sn-hd b{display:block;font-size:15px;font-weight:700;letter-spacing:-.02em}',
    '.sn-hd span{display:block;font-family:"IBM Plex Mono",monospace;font-size:10.5px;',
    '     letter-spacing:.12em;color:var(--sn-mut);margin-top:4px}',
    '.sn-list{padding:8px 0 40px}',
    '.sn-day{border-bottom:1px solid var(--sn-line)}',
    '.sn-day:last-child{border-bottom:0}',
    '.sn-dh{display:flex;gap:9px;align-items:baseline;padding:11px 18px 7px}',
    '.sn-dh i{font-family:"IBM Plex Mono",monospace;font-size:10.5px;font-style:normal;',
    '     letter-spacing:.1em;color:var(--sn-ac);flex:0 0 auto}',
    '.sn-dh em{font-style:normal;font-size:13px;font-weight:600;line-height:1.4;letter-spacing:-.01em}',
    '.sn-day.soon .sn-dh i,.sn-day.soon .sn-dh em{color:var(--sn-mut);font-weight:500}',
    '.sn-day.soon .sn-dh:after{content:"준비 중";font-family:"IBM Plex Mono",monospace;font-size:9.5px;',
    '     letter-spacing:.08em;color:var(--sn-mut);margin-left:auto;flex:0 0 auto;opacity:.75}',
    '.sn-items{list-style:none;margin:0;padding:0 0 9px}',
    '.sn-items a{display:flex;align-items:center;gap:8px;padding:7px 18px 7px 44px;font-size:13px;',
    '     color:var(--sn-ink2);text-decoration:none;border-left:2px solid transparent}',
    '.sn-items a:hover{background:var(--sn-bg2);color:var(--sn-ac)}',
    '.sn-items a.on{background:var(--sn-soft);color:var(--sn-ac);font-weight:600;border-left-color:var(--sn-ac)}',
    '.sn-items a s{text-decoration:none;font-family:"IBM Plex Mono",monospace;font-size:9.5px;',
    '     letter-spacing:.06em;color:var(--sn-mut);margin-left:auto}',
    '.sn-toc{list-style:none;margin:0;padding:2px 0 10px}',
    '.sn-toc a{display:block;padding:5px 18px 5px 58px;font-size:12px;color:var(--sn-mut);',
    '     text-decoration:none;line-height:1.45}',
    '.sn-toc a:hover{color:var(--sn-ac);background:var(--sn-bg2)}',
    '.sn-toc a.on{color:var(--sn-ac);font-weight:600}',
    '.sn-ft{padding:14px 18px 26px;font-family:"IBM Plex Mono",monospace;font-size:10px;',
    '     letter-spacing:.06em;color:var(--sn-mut);border-top:1px solid var(--sn-line)}',
    /* toggle button */
    '.sn-btn{position:fixed;left:16px;bottom:16px;z-index:62;width:46px;height:46px;border-radius:50%;',
    '     border:1px solid rgba(0,0,0,.14);background:#10684A;color:#fff;font-size:19px;line-height:1;',
    '     cursor:pointer;box-shadow:0 3px 14px rgba(0,0,0,.28);display:none;align-items:center;',
    '     justify-content:center;padding:0}',
    '.sn-btn:hover{filter:brightness(1.1)}',
    '.sn-btn.inbar{position:static;width:auto;height:auto;border-radius:4px;box-shadow:none;',
    '     padding:6px 11px;font-size:13px;display:inline-flex;border-color:#10684A}',
    '.sn-bd{position:fixed;inset:0;background:rgba(6,12,9,.5);z-index:59;display:none}',
    /* pushed layout (문서형 페이지) */
    'body.sn-push{padding-left:var(--sn-w)}',
    '@media (max-width:1099px){',
    '  body.sn-push{padding-left:0}',
    '  .l70nav{transform:translateX(-100%);transition:transform .22s ease;box-shadow:0 0 30px rgba(0,0,0,.25)}',
    '  .l70nav.open{transform:none}',
    '  .sn-btn{display:flex}',
    '  .sn-bd.open{display:block}',
    '}',
    /* drawer 전용 (슬라이드 덱) */
    'body.sn-drawer .l70nav{transform:translateX(-100%);transition:transform .22s ease;box-shadow:0 0 30px rgba(0,0,0,.35)}',
    'body.sn-drawer .l70nav.open{transform:none}',
    'body.sn-drawer .sn-bd.open{display:block}',
    'body.sn-open .sn-btn.inbar{visibility:hidden}',
    '@media print{.l70nav,.sn-btn,.sn-bd{display:none!important}body.sn-push{padding-left:0}}'
  ].join('\n');

  function base() {
    // nav.js 는 linux70/ 바로 아래에 있다고 가정
    var src = (THIS && THIS.src) || '';
    return src ? src.replace(/[^/]*$/, '') : '../';
  }

  function samePage(href) {
    var a = document.createElement('a'); a.href = href;
    var cur = location.href.split('#')[0].replace(/\/$/, '/index.html');
    var lnk = a.href.split('#')[0].replace(/\/$/, '/index.html');
    return cur === lnk;
  }

  function build() {
    var B = base();
    var isDeck = !!document.querySelector('.stage');

    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);

    var nav = document.createElement('nav');
    nav.className = 'l70nav';
    nav.setAttribute('aria-label', '과정 목차');

    var html = '<div class="sn-hd"><b>' + COURSE + '</b><span>' + SUB + '</span></div><div class="sn-list">';

    DAYS.forEach(function (d) {
      html += '<div class="sn-day' + (d.soon ? ' soon' : '') + '">';
      html += '<div class="sn-dh"><i>DAY ' + String(d.n).padStart(2, '0') + '</i><em>' + d.title + '</em></div>';
      if (d.items && d.items.length) {
        html += '<ul class="sn-items">';
        d.items.forEach(function (it) {
          var href = B + d.dir + '/' + it.f;
          var on = samePage(href);
          html += '<li><a href="' + href + '"' + (on ? ' class="on" aria-current="page"' : '') + '>' +
                  it.label + (it.tag ? '<s>' + it.tag + '</s>' : '') + '</a>';
          if (on) html += '<ul class="sn-toc" data-here="1"></ul>';
          html += '</li>';
        });
        html += '</ul>';
      }
      html += '</div>';
    });

    html += '</div><div class="sn-ft">한국폴리텍대학 분당융합기술교육원<br>AI응용소프트웨어과</div>';
    nav.innerHTML = html;
    document.body.appendChild(nav);

    var bd = document.createElement('div');
    bd.className = 'sn-bd';
    document.body.appendChild(bd);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sn-btn';
    btn.setAttribute('aria-label', '목차 열기');
    btn.innerHTML = '☰';

    var bar = document.querySelector('.bar');
    if (isDeck && bar) { btn.classList.add('inbar'); btn.innerHTML = '☰ 목차'; bar.insertBefore(btn, bar.firstChild); }
    else { document.body.appendChild(btn); }

    document.body.classList.add(isDeck ? 'sn-drawer' : 'sn-push');

    function open(v) {
      nav.classList.toggle('open', v);
      bd.classList.toggle('open', v);
      document.body.classList.toggle('sn-open', v);
      btn.setAttribute('aria-expanded', v ? 'true' : 'false');
    }
    btn.onclick = function () { open(!nav.classList.contains('open')); };
    bd.onclick = function () { open(false); };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) open(false);
    });

    /* ----- 현재 페이지 안의 목차 ----- */
    var slot = nav.querySelector('.sn-toc[data-here]');
    if (!slot) return;

    if (isDeck) {
      var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
      slides.forEach(function (s, n) {
        var h = s.querySelector('h1,h2');
        if (!h) return;
        var a = document.createElement('a');
        a.href = '#';
        a.textContent = String(n + 1).padStart(2, '0') + '. ' + h.textContent.replace(/\s+/g, ' ').trim();
        a.onclick = function (e) {
          e.preventDefault();
          if (typeof window.deckGo === 'function') window.deckGo(n);
          open(false);
        };
        slot.appendChild(a);
      });
      return;
    }

    var parts = Array.prototype.slice.call(document.querySelectorAll('.part'));
    if (!parts.length) return;
    var anchors = [];
    parts.forEach(function (p, n) {
      var sec = p.closest('section') || p;
      if (!sec.id) sec.id = 'sec' + (n + 1);
      var pn = p.querySelector('.pn'), h2 = p.querySelector('h2');
      var a = document.createElement('a');
      a.href = '#' + sec.id;
      a.textContent = (pn ? pn.textContent.trim() + ' · ' : '') + (h2 ? h2.textContent.trim() : '');
      a.onclick = function () { open(false); };
      slot.appendChild(a);
      anchors.push({ a: a, el: sec });
    });

    var ticking = false;
    function spy() {
      ticking = false;
      var y = window.scrollY + 120, cur = anchors[0];
      anchors.forEach(function (x) { if (x.el.offsetTop <= y) cur = x; });
      anchors.forEach(function (x) { x.a.classList.toggle('on', x === cur); });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(spy); }
    }, { passive: true });
    spy();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
