
/* Ubuntu 리눅스 실습 강좌 — 메인 앱 (네비게이션 · 강좌 문서 · 편집기 · 가상 터미널 · 진도 · 역할/보기 전환) */
(function () {
  const { esc, highlightLines, highlightCommands, makeEditor, guessLang } = window.JU;
  const { store } = window.Runner;
  const C = window.UBUNTU_COURSE;
  const $ = (id) => document.getElementById(id);
  const stripTags = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

  const app = {
    role: 'student',
    view: 'doc',
    route: { type: 'home' },
    done: new Set(),
    blockCodes: {}
  };
  window.UbuntuApp = app;

  // ================================================================== 초기화
  async function init() {
    applyTheme(store.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    try { JSON.parse(store.get('done', '[]')).forEach((id) => app.done.add(id)); } catch (e) { /* 무시 */ }

    const q = new URLSearchParams(location.search);
    const wanted = q.get('role') === 'teacher' ? 'teacher' : q.get('role') === 'student' ? 'student' : store.get('role', 'student');
    app.role = 'student';
    app.viewPref = q.get('view');
    setRole(wanted, true);

    setupEditor();
    app.term = new Term($('consolePanel'), app);
    app.console = app.term;
    app.deck = new Deck(app);
    setupLayout();
    bindUi();
    app.term.boot();

    await loadLessons();
    app.ready = true;
    buildNav();
    updateProgress();
    window.addEventListener('hashchange', () => routeFromHash());
    routeFromHash();
  }

  function loadLessons() {
    return Promise.resolve(); // 오프라인판: 강의 파일은 이미 이 문서 안에 들어 있음
  }

  const chapters = () => C.order.map((o) => C.chapters[o.id] ? Object.assign({ icon: o.icon }, C.chapters[o.id]) : null).filter(Boolean);
  const allSections = () => chapters().flatMap((ch) => ch.sections.map((s) => ({ ch, sec: s })));
  function findSection(id) {
    for (const ch of chapters()) {
      const sec = ch.sections.find((s) => s.id === id);
      if (sec) return { ch, sec };
    }
    return null;
  }

  // ================================================================== 테마 · 역할 · 보기
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    store.set('theme', t);
  }

  function teacherUnlocked() { return true; /* 오프라인 실습판: 교사용 화면 비밀번호 없음 */ }

  function askTeacherPassword(then) {
    openModal('🧑‍🏫 교사용 화면', `
      <p>교사용 화면에는 <b>교사 노트 · 퀴즈 정답 · 실습 정답</b>이 함께 표시됩니다.<br>비밀번호를 입력하세요.</p>
      <p><input type="password" id="teacherPw" placeholder="비밀번호" autocomplete="off"></p>
      <p id="teacherPwMsg" style="color:var(--danger);font-size:13.5px;min-height:18px"></p>
      <div class="meta-row"><button class="btn primary" id="teacherPwOk">확인</button><button class="btn ghost" id="teacherPwCancel">취소</button></div>`);
    const input = $('teacherPw');
    input.focus();
    const submit = () => {
      if (input.value === (C.teacherPassword || '')) {
        store.set('teacherOk', '1');
        closeModal();
        then();
      } else {
        $('teacherPwMsg').textContent = '비밀번호가 맞지 않습니다.';
        input.select();
      }
    };
    input.onkeydown = (e) => { if (e.key === 'Enter') submit(); e.stopPropagation(); };
    $('teacherPwOk').onclick = submit;
    $('teacherPwCancel').onclick = () => { closeModal(); setRole('student'); };
  }

  function setRole(role, silent) {
    if (role === 'teacher' && !teacherUnlocked()) {
      document.querySelectorAll('.role-switch button').forEach((b) => b.classList.toggle('active', b.dataset.role === app.role));
      askTeacherPassword(() => setRole('teacher', silent));
      return;
    }
    app.role = role;
    store.set('role', role);
    document.body.classList.toggle('role-teacher', role === 'teacher');
    document.querySelectorAll('.role-switch button').forEach((b) => b.classList.toggle('active', b.dataset.role === role));
    $('brandSub').textContent = role === 'teacher' ? '🧑‍🏫 교사용 · PPT 수업 모드' : '🎓 학생용 · 문서 + 실습';
    const q = new URLSearchParams(location.search);
    q.set('role', role);
    q.delete('view');
    history.replaceState(null, '', `${location.pathname}?${q}${location.hash}`);
    if (!silent && app.ready) {
      app.view = role === 'teacher' ? 'slides' : 'doc';
      render();
    }
  }

  function setView(view) {
    app.view = view;
    render();
  }
  app.setView = setView;

  app.toast = function (msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(app._toast);
    app._toast = setTimeout(() => t.classList.add('hidden'), 2200);
  };

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); app.toast('복사했습니다'); } catch (e) { app.toast('복사하지 못했습니다'); }
  }

  // ================================================================== 터미널로 명령 보내기
  app.runCommands = function (code) {
    const lines = String(code || '').replace(/\r/g, '').split('\n');
    // 설명 주석과 빈 줄은 보내지 않는다 (heredoc 본문 안의 줄은 그대로)
    const out = [];
    let buf = '';
    for (const line of lines) {
      if (!buf && (/^\s*#/.test(line) || !line.trim())) continue;
      out.push(line);
      const text = buf ? buf + '\n' + line : line;
      let incomplete = false;
      try { LX.parse(text); } catch (e) { incomplete = e instanceof LX.sig.Incomplete; }
      buf = incomplete ? text : '';
    }
    if (!out.length) return;
    if ($('app').classList.contains('term-collapsed')) $('app').classList.remove('term-collapsed');
    app.term.runCommands(out.join('\n'));
  };

  // ================================================================== 편집기 (nano 대신)
  function setupEditor() {
    app.editor = makeEditor($('editorHost'), '', {
      lang: 'text', wrap: false,
      onSave: () => saveEditor(),
      onClose: () => closeEditor(),
      onRun: () => runEditorFile()
    });
    app.ed = { path: null, mode: null };
    app.editor.on('change', () => {
      const dirty = !app.editor.isClean();
      if (app.ed.path) $('editorLabel').innerHTML = edLabel() + (dirty ? ' <b class="ed-dirty">● 수정됨</b>' : '');
    });
    setEditorFont(+store.get('edFont', 14));
    showEditorIdle();
  }

  function setEditorFont(px) {
    app.edFont = Math.max(10, Math.min(28, px));
    document.documentElement.style.setProperty('--ed-font', app.edFont + 'px');
    store.set('edFont', app.edFont);
    app.editor.refresh();
  }

  function edLabel() {
    const e = app.ed;
    return `— <code>${esc(e.path)}</code> <span class="muted">(${e.mode === 'nano' ? esc(e.editor || 'nano') + ' · ' : ''}${esc(e.user || '')})</span>`;
  }

  function showEditorIdle() {
    app.ed = { path: null, mode: null };
    app.editor.setValue('# 가상 머신의 파일 편집기입니다.\n#\n#  · 터미널에서  nano 파일이름  (또는 sudo nano /etc/...) 을 입력하면 이곳에서 열립니다.\n#  · 강좌 본문의 📄 파일 블록에서 [✎ 편집기로] 를 눌러도 됩니다.\n#  · 저장: Ctrl+S   ·   편집 끝내기: Ctrl+X   ·   스크립트 실행: Ctrl+Enter\n#\n# 실제 Ubuntu 에서는 nano 가 터미널 화면 전체를 쓰며, 저장은 Ctrl+O(Enter), 끝내기는 Ctrl+X 입니다.\n');
    app.editor.setLang('bash');
    app.editor.setReadOnly(true);
    app.editor.markClean();
    $('editorLabel').innerHTML = '— 터미널에서 <code>nano 파일</code> 을 입력하면 여기에서 열립니다';
    $('edSaveBtn').disabled = true;
    $('edCloseBtn').disabled = true;
    $('edRunBtn').classList.add('hidden');
    $('editorBadge').classList.add('hidden');
    $('editorPane').classList.remove('editing');
  }

  function unfoldEditor() {
    $('editorPane').classList.remove('folded');
    $('foldBtn').textContent = '▾ 접기';
    setTimeout(() => app.editor.refresh(), 0);
  }

  function openInEditor(o) {
    app.ed = o;
    app.editor.setReadOnly(false);
    app.editor.setValue(o.text || '');
    app.editor.setLang(guessLang(o.path, o.text));
    app.editor.markClean();
    $('editorLabel').innerHTML = edLabel();
    $('edSaveBtn').disabled = false;
    $('edCloseBtn').disabled = false;
    $('edRunBtn').classList.toggle('hidden', !/\.sh$/.test(o.path) && !/^#!.*sh/.test(o.text || ''));
    const badge = $('editorBadge');
    badge.classList.toggle('hidden', !o.readonly && !o.note);
    badge.textContent = o.readonly ? '🔒 쓰기 권한 없음 (sudo 필요)' : o.note || '';
    $('editorPane').classList.add('editing');
    if (app.view === 'slides' && app.route.type === 'section') { app.view = 'doc'; render(); }
    unfoldEditor();
    setTimeout(() => app.editor.focus(), 30);
  }

  /** 터미널의 nano · vim 명령이 부른다 → 닫을 때까지 기다린다 */
  app.openNano = function (path, opts) {
    return new Promise((resolve) => {
      if (app.ed.path && app.ed.resolve) { app.ed.resolve({ saved: false }); }
      const name = opts.editor || 'nano';
      app.term.write(`\x1b[2m[${name}] ${path} 파일을 가운데 아래 📝 편집기에서 열었습니다. 저장 Ctrl+S · 끝내기 Ctrl+X\x1b[0m\n`);
      if (!opts.exists && !opts.readonly) app.term.write('\x1b[2m[ New File ]\x1b[0m\n');
      openInEditor({ path, text: opts.text, mode: 'nano', editor: name, user: opts.user, readonly: opts.readonly, save: opts.save, resolve, saved: false });
    });
  };

  function saveEditor() {
    const e = app.ed;
    if (!e.path) return false;
    const text = app.editor.getValue();
    let err = null;
    if (e.mode === 'nano') err = e.save(text);
    else err = writeAs(e.path, text, e.cred);
    if (err) {
      app.toast(`저장하지 못했습니다: ${err}`);
      app.term.write(`\x1b[31m[ Error writing ${e.path}: ${err} ]\x1b[0m\n${/Permission/.test(err) ? `\x1b[2m(관리자 권한이 필요한 파일입니다. 편집기를 닫고 터미널에서 sudo nano ${e.path} 로 여세요)\x1b[0m\n` : ''}`);
      return false;
    }
    app.editor.markClean();
    e.saved = true;
    $('editorLabel').innerHTML = edLabel();
    const lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
    app.toast(`저장했습니다 — ${e.path}`);
    app.term.write(`\x1b[2m[ Wrote ${lines} line${lines === 1 ? '' : 's'} ]\x1b[0m\n`);
    app.term.m.saveSoon();
    return true;
  }

  function closeEditor() {
    const e = app.ed;
    if (!e.path) return;
    if (!app.editor.isClean()) {
      const ans = confirm('저장하지 않은 변경 사항이 있습니다.\n\n[확인] 저장하고 닫기   ·   [취소] 저장하지 않고 닫기');
      if (ans && !saveEditor()) return;
    }
    const resolve = e.resolve;
    showEditorIdle();
    if (resolve) resolve({ saved: e.saved });
    if (e.mode === 'nano') app.term.focus();
  }

  async function runEditorFile() {
    const e = app.ed;
    if (!e.path) return;
    if (!app.editor.isClean() && !saveEditor()) return;
    if (e.mode === 'nano') closeEditor();
    app.runCommands(`bash ${e.path}`);
  }

  /** 현재 터미널 사용자 권한으로 파일 쓰기 (편집기 자유 모드) */
  function writeAs(path, text, cred) {
    const fs = app.term.m.vfs;
    try {
      if (!fs.lookup(path)) fs.writeFile(path, text, cred, { mode: 0o664 });
      else fs.writeFile(path, text, cred);
      return null;
    } catch (err) {
      return err.message;
    }
  }

  function topCred() {
    const top = app.term.session.top;
    return top && top.cred && top instanceof LX.Shell && top.m === app.term.m ? top.cred : app.term.m.credFor(app.term.m.defaultUser);
  }

  function openFreeFile(path, textOverride) {
    const m = app.term.m;
    const cred = topCred();
    let text = '', readonly = false, exists = false;
    const n = m.vfs.lookup(path);
    if (n && n.t === 'd') { app.toast(`${path} 는 디렉터리입니다`); return; }
    if (n) {
      exists = true;
      try { text = m.vfs.readFile(path, cred); } catch (e) { app.toast(`읽을 수 없습니다: ${e.message} (sudo nano ${path} 로 여세요)`); return; }
      readonly = !m.vfs.perm(n, cred, 2);
    } else {
      const dir = m.vfs.lookup(LX.path.dirname(path));
      readonly = !dir || !m.vfs.perm(dir, cred, 2);
    }
    if (textOverride != null) text = textOverride;
    if (app.ed.path && app.ed.mode === 'nano') { app.toast('터미널의 nano 편집을 먼저 끝내세요 (Ctrl+X)'); return; }
    openInEditor({ path, text, mode: 'free', user: cred.name, cred, readonly, note: exists ? '' : '새 파일' });
    if (textOverride != null) app.editor.cm && app.editor.cm.markClean && null;
  }

  // ---- 파일 블록 → 가상 머신에 저장
  function saveBlockFile(b) {
    const m = app.term.m;
    const path = b.path;
    const home = m.credFor(m.defaultUser);
    const inHome = path.startsWith(home.home + '/') || path.startsWith('/tmp/');
    const asRoot = b.sudo || !inHome;
    const cred = asRoot ? null : home;
    try {
      const dir = LX.path.dirname(path);
      if (!m.vfs.lookup(dir)) {
        const made = m.vfs.mkdir(dir, cred, { parents: true, mode: 0o755 });
        if (!asRoot) made.forEach((d) => { const nd = m.vfs.lookup(d); nd.u = home.uid; nd.g = home.gid; nd.m = 0o775; });
      }
      const text = String(b.code).replace(/\s*$/, '\n');
      const exists = !!m.vfs.lookup(path);
      m.vfs.writeFile(path, text, cred, { mode: b.mode ? parseInt(b.mode, 8) : (asRoot ? 0o644 : 0o664) });
      const n = m.vfs.lookup(path);
      if (b.mode) n.m = parseInt(b.mode, 8);
      if (!asRoot && !exists) { n.u = home.uid; n.g = home.gid; }
      app.term.write(`\x1b[2m[파일 저장] ${path}${asRoot ? ' (sudo 권한으로)' : ''} — 직접 입력한다면: ${asRoot ? 'sudo ' : ''}nano ${path}\x1b[0m\n`);
      m.saveSoon();
      app.toast(`가상 머신에 저장했습니다 — ${path}`);
    } catch (e) {
      app.toast(`저장하지 못했습니다: ${e.message}`);
    }
  }

  // ================================================================== 실습 확인
  async function checkPractice(p, box) {
    const m = app.term.m;
    const sess = new LX.Session(m, { write() {} }, { headless: true });
    sess.noClock = true;
    const sh = new LX.Shell(sess, { user: 'root' });
    const home = m.credFor(m.defaultUser).home;
    sh.vars.HOME = { v: home, x: true };
    sh.cwd = home;
    let out = '';
    const io = { stdin: new LX.InStream(''), out: (s) => { out += s; }, err: (s) => { out += s; }, tty: false };
    let st = 1;
    try { st = await sh.runSource(p.check, io); } catch (e) { st = e && e.code != null ? e.code : 1; }
    const res = box.querySelector('.check-result');
    res.classList.remove('hidden', 'ok', 'bad');
    if (st === 0) {
      res.classList.add('ok');
      res.innerHTML = `✅ <b>성공!</b> ${p.checkOk || '과제를 올바르게 수행했습니다.'}`;
    } else {
      res.classList.add('bad');
      res.innerHTML = `❌ <b>아직입니다.</b> ${p.checkFail || '과제 조건을 다시 확인하고 터미널에서 해 본 뒤 다시 확인하세요.'}${out.trim() ? `<pre class="term mini">${esc(out.trim().slice(0, 400))}</pre>` : ''}`;
    }
  }

  // ================================================================== 네비게이션
  function buildNav() {
    const q = $('navSearch').value.trim().toLowerCase();
    const tree = $('navTree');
    const cur = app.route;
    let html = `<a class="nav-home${cur.type === 'home' ? ' active' : ''}" href="#home">🏠 강좌 소개</a>`;
    const partAt = {};
    (C.parts || []).forEach((p) => { partAt[p.from] = p.title; });
    C.order.forEach((o) => {
      const ch = C.chapters[o.id];
      if (partAt[o.id] && !q) html += `<div class="nav-part">${esc(partAt[o.id])}</div>`;
      if (!ch) {
        if (!q) html += `<div class="nav-ch"><div class="nav-ch-head" style="cursor:default;opacity:.6"><span class="no">${esc(o.no)}</span><span class="t">${esc(o.title)}</span><span class="pending">준비 중</span></div></div>`;
        return;
      }
      let secs = ch.sections;
      const hits = {};
      if (q) {
        const chHit = (ch.title + ' ' + (ch.subtitle || '')).toLowerCase().includes(q);
        secs = secs.filter((s) => {
          if (chHit || s.title.toLowerCase().includes(q)) return true;
          const text = sectionText(s).toLowerCase();
          const i = text.indexOf(q);
          if (i >= 0) { hits[s.id] = text.slice(Math.max(0, i - 18), i + q.length + 26); return true; }
          return false;
        });
        if (!secs.length) return;
      }
      const active = (cur.ch && cur.ch.id === ch.id);
      const open = q || active || (store.get('open.' + ch.id, '0') === '1');
      const doneN = ch.sections.filter((s) => app.done.has(s.id)).length;
      html += `<div class="nav-ch${open ? ' open' : ''}${active ? ' active' : ''}" data-ch="${ch.id}">
        <div class="nav-ch-head"><span class="no">${esc(ch.no)}</span><span class="t" title="${esc(ch.title)}">${esc(o.icon || '')} ${esc(ch.title)}</span>
          <span class="pending">${doneN}/${ch.sections.length}</span><span class="caret">▶</span></div>
        <div class="nav-secs"><a class="nav-sec nav-overview${cur.type === 'chapter' && active ? ' active' : ''}" href="#${ch.id}"><span class="chk">ⓘ</span><span>일차 개요</span></a>
        ${secs.map((s) => `<a class="nav-sec${cur.sec && cur.sec.id === s.id ? ' active' : ''}${app.done.has(s.id) ? ' done' : ''}" href="#${s.id}">
          <span class="chk">${app.done.has(s.id) ? '✔' : ch.sections.indexOf(s) + 1}</span><span>${esc(s.title)}${hits[s.id] ? `<span class="hit">…${esc(hits[s.id])}…</span>` : ''}</span></a>`).join('')}
        </div></div>`;
    });
    tree.innerHTML = html;
    const act = tree.querySelector('.nav-sec.active');
    if (act && !q) act.scrollIntoView({ block: 'nearest' });
  }

  const textCache = new Map();
  function sectionText(s) {
    if (textCache.has(s.id)) return textCache.get(s.id);
    const parts = [s.title, ...(s.goals || [])];
    (s.content || []).forEach((b) => parts.push(b.text || '', stripTags(b.html), b.title || '', (b.items || []).map(stripTags).join(' '), b.code || '', b.path || '', (b.rows || []).flat().map(stripTags).join(' ')));
    (s.practice || []).forEach((p) => parts.push(p.title, stripTags(p.desc)));
    const t = parts.join(' ');
    textCache.set(s.id, t);
    return t;
  }

  function updateProgress() {
    const all = allSections();
    const n = all.filter((x) => app.done.has(x.sec.id)).length;
    $('progressText').textContent = `${n} / ${all.length}`;
    $('progressBar').style.width = all.length ? (n / all.length * 100) + '%' : '0';
  }

  function toggleDone(id) {
    if (app.done.has(id)) app.done.delete(id); else app.done.add(id);
    store.set('done', JSON.stringify([...app.done]));
    updateProgress();
    buildNav();
  }

  // ================================================================== 라우팅
  function routeFromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    const [id, slide] = h.split('@');
    if (!id || id === 'home') { app.route = { type: 'home' }; }
    else if (C.chapters[id]) { app.route = { type: 'chapter', ch: chapters().find((c) => c.id === id) }; }
    else {
      const f = findSection(id);
      if (f) {
        app.route = { type: 'section', ch: f.ch, sec: f.sec, slide: slide ? Math.max(0, (+slide || 1) - 1) : (slide === '' ? 0 : null) };
        store.set('last', id);
      } else app.route = { type: 'home' };
    }
    if (app.viewPref) { app.view = app.viewPref === 'slides' ? 'slides' : 'doc'; app.viewPref = null; }
    else if (!app.viewInit) app.view = app.role === 'teacher' ? 'slides' : 'doc';
    app.viewInit = true;
    render();
  }

  function go(hash) {
    if (location.hash === '#' + hash) routeFromHash();
    else location.hash = hash;
  }

  app.stepSection = function (dir, slide) {
    const all = allSections();
    const r = app.route;
    if (r.type !== 'section') return;
    const i = all.findIndex((x) => x.sec.id === r.sec.id);
    const n = all[i + dir];
    if (!n) { app.toast(dir > 0 ? '마지막 교시입니다' : '첫 교시입니다'); return; }
    app.pendingSlide = slide;
    go(n.sec.id);
  };

  app.onSlideChange = function (sec, index) {
    const h = `#${sec.id}@${index + 1}`;
    if (location.hash !== h) history.replaceState(null, '', location.pathname + location.search + h);
    store.set('slidePos', JSON.stringify({ id: sec.id, index }));
  };

  function savedSlide(sectionId) {
    try {
      const p = JSON.parse(store.get('slidePos', 'null'));
      return p && p.id === sectionId ? (p.index | 0) : 0;
    } catch (e) {
      return 0;
    }
  }

  // ================================================================== 렌더링
  function render() {
    const r = app.route;
    buildNav();
    document.querySelectorAll('.view-switch button').forEach((b) => b.classList.toggle('active', b.dataset.view === app.view));
    const isSection = r.type === 'section';
    const slides = isSection && app.view === 'slides';
    $('docView').classList.toggle('hidden', slides);
    $('slideView').classList.toggle('hidden', !slides);
    document.querySelector('.view-switch').style.visibility = isSection ? 'visible' : 'hidden';
    $('prevBtn').style.visibility = isSection ? 'visible' : 'hidden';
    $('nextBtn').style.visibility = isSection ? 'visible' : 'hidden';

    if (r.type === 'home') {
      $('crumb').innerHTML = '<b>강좌 소개</b>';
      renderHome();
    } else if (r.type === 'chapter') {
      $('crumb').innerHTML = `${esc(r.ch.extra ? "심화" : r.ch.no + "일차")} · <b>${esc(r.ch.title)}</b>`;
      renderChapter(r.ch);
    } else {
      $('crumb').innerHTML = `${esc(r.ch.extra ? "심화" : r.ch.no + "일차")} ${esc(r.ch.title)} › <b>${esc(r.sec.title)}</b>`;
      if (slides) {
        const idx = app.pendingSlide != null ? app.pendingSlide : (r.slide != null ? r.slide : savedSlide(r.sec.id));
        app.pendingSlide = null;
        app.deck.open(r.ch, r.sec, idx);
      } else {
        renderSection(r.ch, r.sec);
      }
    }
    if (!slides) setTimeout(() => app.editor.refresh(), 0);
  }

  // ------------------------------------------------------------------ 홈
  function renderHome() {
    const chs = chapters();
    const all = allSections();
    let nCmd = 0, nSlides = 0, nPractice = 0, nQuiz = 0;
    all.forEach(({ sec }) => {
      nCmd += (sec.content || []).filter((b) => b.type === 'cmd' || b.type === 'file').length;
      nSlides += (sec.slides || []).length;
      nPractice += (sec.practice || []).length;
      nQuiz += (sec.quiz || []).length;
    });
    const last = store.get('last', '');
    const lastF = last && findSection(last);
    const first = all[0];
    const teacher = app.role === 'teacher';
    const partAt = {};
    (C.parts || []).forEach((p) => { partAt[p.from] = p.title; });
    let cards = '';
    C.order.forEach((o) => {
      if (partAt[o.id]) cards += `${cards ? '</div>' : ''}<h3 class="part-title">${esc(partAt[o.id])}</h3><div class="cards">`;
      const ch = C.chapters[o.id];
      if (!ch) { cards += `<div class="card disabled"><span class="ci">${o.icon}</span><span class="cn">${esc(o.extra ? "심화" : o.no + "일차")}</span><span class="ct">${esc(o.title)}</span><span class="cs">준비 중</span></div>`; return; }
      const d = ch.sections.filter((s) => app.done.has(s.id)).length;
      cards += `<a class="card" href="#${ch.id}"><span class="ci">${o.icon}</span><span class="cn">${esc(ch.extra ? "심화" : ch.no + "일차")}</span><span class="ct">${esc(ch.title)}</span>
        <span class="cs">${ch.sections.length}교시 · ${esc(stripTags(ch.summary).slice(0, 56))}${stripTags(ch.summary).length > 56 ? '…' : ''}</span>
        <span class="cp"><i style="width:${ch.sections.length ? d / ch.sections.length * 100 : 0}%"></i></span></a>`;
    });
    if (cards) cards += '</div>';
    $('content').innerHTML = `<div class="doc">
      <div class="hero">
        <h1>☁️ 클라우드 기초 — 비용 0원으로 내 서버 만들기</h1>
        <p>AWS · Azure · Google Cloud 를 직접 써 보며 비교하고, 무료 클라우드 서버 한 대를 도메인과 https 를 갖춘 서비스로 완성하는 <b>70시간 · 10일</b> 실습 과정입니다.
        오른쪽 <b>가상 클라우드 서버 터미널</b>에서 모든 명령을 먼저 연습한 뒤 실제 클라우드에서 그대로 따라 합니다.</p>
        <p>${chs.filter((c) => !c.extra).length}일${chs.some((c) => c.extra) ? ' + 심화' : ''} · ${all.length}교시 · 실습 블록 ${nCmd}개 · 과제 ${nPractice}개 · 퀴즈 ${nQuiz}문항 · 슬라이드 ${nSlides}장</p>
        <div class="hero-actions">
          ${lastF ? `<a class="btn" href="#${lastF.sec.id}">⏯ 이어서 학습: ${esc(lastF.sec.title)}</a>` : ''}
          ${first ? `<a class="btn${lastF ? ' outline' : ''}" href="#${first.sec.id}">▶ 1일차부터 시작</a>` : ''}
          <button class="btn outline" data-role-go="${teacher ? 'student' : 'teacher'}">${teacher ? '🎓 학생용 화면으로' : '🧑‍🏫 교사용(PPT) 화면으로'}</button>
          <a class="btn outline" href="../">🏠 강의실 홈</a>
        </div>
        <div class="cup">☁️</div>
      </div>

      <h2>🧪 가상 클라우드 서버로 먼저 연습</h2>
      <p>오른쪽 터미널은 <b>브라우저 안에서 동작하는 가상 Ubuntu 24.04 서버</b>입니다. 6일차에 만들 <b>Oracle Cloud 무료 서버</b>처럼 설정되어 있어
      서버 iptables 방화벽, 클라우드 보안 목록, 공인 IP 가 따로 있습니다. 만든 파일과 설치한 패키지는 이 브라우저에 저장됩니다.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>항목</th><th>값 · 명령</th><th>설명</th></tr></thead>
        <tbody>
          <tr><td>사용자 / 비밀번호</td><td><code>student</code> / <code>ubuntu</code></td><td><code>sudo</code> 가 비밀번호를 물으면 <code>ubuntu</code></td></tr>
          <tr><td>사설 IP · 공인 IP</td><td><code>10.0.2.15</code> · <code>203.0.113.25</code></td><td>클라우드처럼 공인 IP 는 서버 안에 보이지 않습니다 (<code>ip a</code> vs <code>curl ifconfig.me</code>)</td></tr>
          <tr><td>클라우드 방화벽</td><td><code>seclist</code> · <code>seclist add 80</code></td><td>OCI 보안 목록 흉내. 서버 안 <code>iptables</code> 와 둘 다 열어야 밖에서 접속됩니다</td></tr>
          <tr><td>인터넷의 다른 PC</td><td><code>labclient curl http://203.0.113.25</code></td><td>밖에서 내 서버에 접속해 보는 명령 — 방화벽 실습용</td></tr>
          <tr><td>연습용 클라우드 CLI</td><td><code>aws</code> · <code>az</code> · <code>gcloud</code></td><td>실제 계정에 연결하지 않고 CloudShell 명령을 연습합니다 (EC2 · S3 · VM · Cloud Run …)</td></tr>
          <tr><td>Docker</td><td><code>docker</code> · <code>docker compose</code></td><td>Flask · MariaDB · Caddy 컨테이너까지 동작합니다</td></tr>
          <tr><td>앞 일차 준비</td><td><code>c70-ready web</code> · <code>c70-ready stack</code></td><td>가상 서버를 초기화했거나 앞 일차를 건너뛰었을 때 7일차(방화벽 · Docker) · 8일차(3단 서비스) 결과를 한 번에 준비합니다</td></tr>
        </tbody></table></div>
      <ul class="steps">
        <li><b>본문의 💻 터미널 블록</b> — <b>▶ 터미널에서 실행</b>을 누르면 오른쪽 터미널에서 실행됩니다. 직접 타이핑해 보는 것을 더 권장합니다.</li>
        <li><b>🖥 실제 클라우드 블록</b> — 콘솔 클릭, 카드 등록, 실제 도메인 · 인증서처럼 가상 터미널로 흉내낼 수 없는 단계는 실제 클라우드에서 합니다.</li>
        <li><b>📄 파일 블록</b> — <b>💾 가상 머신에 저장</b>으로 설정 파일을 바로 만들 수 있습니다. 터미널에서 <code>nano 파일</code> 을 입력하면 가운데 아래 편집기가 열립니다.</li>
        <li><b>과제</b> — 각 교시 끝의 <b>✔ 확인하기</b>가 가상 서버 상태를 검사해 자동으로 채점합니다.</li>
        <li><b>초기화</b> — 터미널 위의 <b>⟲ 초기화</b>로 언제든 처음 상태로 되돌릴 수 있습니다.</li>
      </ul>
      <div class="callout vm"><div class="ct">🖥 실제 클라우드도 함께</div><div>
        <p>가상 서버는 명령과 개념을 익히는 연습장입니다. 같은 명령을 <b>실제 AWS · Azure · Google Cloud · Oracle Cloud</b> 에서도 실행합니다.
        실제 클라우드에서는 <b>가입 직후 MFA 와 $1 예산 알림</b>을 먼저 걸고, 실습이 끝나면 만든 리소스를 지웁니다.</p>
      </div></div>

      <h2>☁️ 3대 클라우드와 무료 티어 <span class="muted" style="font-size:.6em">2026년 10월 확인</span></h2>
      <div class="table-wrap"><table>
        <thead><tr><th>클라우드</th><th>신규 크레딧</th><th>기간 제한 없는 무료 서버</th><th>결제수단</th><th>과정에서</th></tr></thead>
        <tbody>
          <tr><td><a href="https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/" target="_blank" rel="noopener">AWS</a></td><td>최대 $200, 무료 플랜 최대 6개월</td><td>없음</td><td>필요</td><td>3일차 체험</td></tr>
          <tr><td><a href="https://azure.microsoft.com/en-us/free/students" target="_blank" rel="noopener">Azure for Students</a></td><td>$100, 12개월</td><td>없음 (12개월 무료 서비스)</td><td>불필요</td><td>4일차 체험</td></tr>
          <tr><td><a href="https://docs.cloud.google.com/free/docs/free-cloud-features" target="_blank" rel="noopener">Google Cloud</a></td><td>$300, 90일</td><td>e2-micro 1대 (미국 3개 리전)</td><td>필요</td><td>5 · 9일차, 예비 서버</td></tr>
          <tr><td><a href="https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm" target="_blank" rel="noopener">Oracle Cloud</a></td><td>$300 체험</td><td>Ampere A1 합계 2 OCPU · 12GB</td><td>필요</td><td>6일차~ 주 실습 서버</td></tr>
        </tbody></table></div>
      <p class="muted" style="font-size:13.5px">Oracle 은 2026년 문서에서 A1 무료량을 4 OCPU · 24GB 에서 2 OCPU · 12GB 로 줄였습니다. 예전 블로그 설정을 따라 하지 마세요. 무료 조건은 자주 바뀌므로 개강 전에 공식 페이지를 다시 확인합니다.</p>

      <h2>📚 일차 구성</h2>
      ${cards}


      <h2>📝 평가</h2>
      <p>중간 · 기말 시험은 없습니다. 70시간을 이어서 진행하고, 매일의 실습 산출물로 평가합니다.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>항목</th><th>비중</th><th>내용</th></tr></thead>
        <tbody>
          <tr><td>일차별 실습 산출물</td><td>70%</td><td>10회 × 7점 — 동작 3 · 기록 2 · 보안·비용 2</td></tr>
          <tr><td>아침 복습 퀴즈</td><td>10%</td><td>2~10일차 시작 10분, 전날 교시 퀴즈</td></tr>
          <tr><td>출석 · 태도</td><td>20%</td><td>학칙 기준</td></tr>
        </tbody></table></div>

      <h2>🧭 학생용 · 교사용 화면</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>구분</th><th>🎓 학생용</th><th>🧑‍🏫 교사용</th></tr></thead>
        <tbody>
          <tr><td>기본 화면</td><td>문서형 강좌 (개념 → 실습 → 과제 → 퀴즈)</td><td>PPT 형태 슬라이드 (16:9)</td></tr>
          <tr><td>실습</td><td>명령 블록의 <b>▶ 실행</b> 또는 터미널에 직접 입력</td><td>슬라이드의 <b>▶ 실행</b> (전체 화면에서도 <kbd>R</kbd> 로 터미널 표시)</td></tr>
          <tr><td>과제</td><td><b>✔ 확인하기</b>로 스스로 채점</td><td>정답 명령 보기 · 실행</td></tr>
          <tr><td>추가 기능</td><td>진도 저장, 검색, 슬라이드 보기</td><td>교사 노트 · 수업 흐름 · 타이머 · 판서 · 발표자 창</td></tr>
        </tbody></table></div>
    </div>`;
    $('content').scrollTop = 0;
  }

  // ------------------------------------------------------------------ 장 개요
  function renderChapter(ch) {
    const secMeta = (s) => {
      const nc = (s.content || []).filter((b) => b.type === 'cmd').length;
      return `${s.minutes || 50}분 · 실습 블록 ${nc} · 과제 ${(s.practice || []).length} · 슬라이드 ${(s.slides || []).length}`;
    };
    $('content').innerHTML = `<div class="doc">
      <span class="chapter-badge">${esc(ch.icon || '')} ${esc(ch.extra ? "심화" : ch.no + "일차")}</span>
      <h1>${esc(ch.title)} ${ch.subtitle ? `<span class="muted" style="font-size:.6em;font-weight:600">${esc(ch.subtitle)}</span>` : ''}</h1>
      <p class="lead">${ch.summary || ''}</p>
      ${(ch.goals || []).length ? `<div class="goals"><b>🎯 오늘의 학습 목표</b><ul>${ch.goals.map((g) => `<li>${g}</li>`).join('')}</ul></div>` : ''}
      <div class="meta-row">
        <a class="btn primary" href="#${ch.sections[0].id}">▶ 첫 교시 시작</a>
        <button class="btn" data-slides="${ch.sections[0].id}">🖼️ 슬라이드로 수업</button>
      </div>
      <h2>교시 구성</h2>
      <div class="sec-list">${ch.sections.map((s, i) => `<a class="sec-item" href="#${s.id}"><span class="sn">${i + 1}</span>
        <span class="st">${esc(s.title)}<div class="sm">${secMeta(s)}</div></span><span>${app.done.has(s.id) ? '✅' : ''}</span></a>`).join('')}</div>
    </div>`;
    $('content').scrollTop = 0;
  }

  // ------------------------------------------------------------------ 교시(섹션) 문서
  function cmdBlockHtml(b, id, opts = {}) {
    const vm = b.vm || b.run === false;
    const tag = opts.tag || (vm ? '실제 클라우드' : '터미널');
    const expect = b.expect != null ? `<details class="expect"${b.open ? ' open' : ''}><summary>${vm ? '실제 클라우드 출력 예시' : '출력 예시'}</summary><pre class="term">${esc(String(b.expect).replace(/\s+$/, ''))}</pre></details>` : '';
    return `<div class="code-block cmd-block${vm ? ' vm' : ''}" id="cb-${id}">
      <div class="code-head"><span class="t"><span class="tag${vm ? ' vm' : ''}">${vm ? '🖥 ' : '💻 '}${esc(tag)}</span>${esc(b.title || '')}</span>
        ${vm ? `<span class="chip vm-chip" title="가상 터미널에서는 흉내낼 수 없어 실제 클라우드(콘솔 · 실제 서버)에서 해야 합니다">실제 클라우드에서</span>` : `<button class="btn small primary" data-code-act="run" data-code="${id}" title="오른쪽 가상 터미널에 입력해 실행">▶ 터미널에서 실행</button>`}
        <button class="btn small ghost" data-code-act="copy" data-code="${id}" title="명령 복사">⧉</button></div>
      <pre class="cmd">${highlightCommands(b.code, b.root)}</pre>
      ${b.desc ? `<div class="code-desc">${b.desc}</div>` : ''}${expect}</div>`;
  }

  function fileBlockHtml(b, id) {
    const lang = b.lang || guessLang(b.path, b.code);
    const vm = b.vm;
    return `<div class="code-block file-block${vm ? ' vm' : ''}" id="cb-${id}">
      <div class="code-head"><span class="t"><span class="tag file">📄 파일</span><code class="fpath">${esc(b.path || '')}</code>${b.title ? ` <span class="ftitle">${esc(b.title)}</span>` : ''}</span>
        ${!vm && b.path ? `<button class="btn small primary" data-code-act="save" data-code="${id}" title="이 내용으로 가상 머신에 파일 만들기${b.sudo ? ' (sudo 권한)' : ''}">💾 가상 머신에 저장</button>
        <button class="btn small ghost" data-code-act="edit" data-code="${id}" title="편집기로 열어 직접 고치기">✎ 편집기로</button>` : ''}
        <button class="btn small ghost" data-code-act="copy" data-code="${id}" title="내용 복사">⧉</button></div>
      <pre>${highlightLines(b.code, lang)}</pre>
      ${b.desc ? `<div class="code-desc">${b.desc}</div>` : ''}</div>`;
  }

  function renderSection(ch, sec) {
    const teacher = app.role === 'teacher';
    app.blockCodes = {};
    let n = 0;
    const reg = (b) => { const id = 'c' + (n++); app.blockCodes[id] = b; return id; };
    const idx = ch.sections.indexOf(sec);
    const all = allSections();
    const gi = all.findIndex((x) => x.sec.id === sec.id);
    const prev = all[gi - 1], next = all[gi + 1];

    const blocks = (sec.content || []).map((b) => {
      switch (b.type) {
        case 'h': return `<h3>${esc(b.text)}</h3>`;
        case 'p': return `<p>${window.JU.scoped(b.html)}</p>`;
        case 'list': {
          const tagName = b.ordered ? 'ol' : 'ul';
          return `<${tagName}>${(b.items || []).map((i) => `<li>${i}</li>`).join('')}</${tagName}>`;
        }
        case 'table':
          return `<div class="table-wrap"><table><thead><tr>${(b.head || []).map((h) => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${(b.rows || []).map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${b.caption ? `<p class="caption">${b.caption}</p>` : ''}`;
        case 'cmd': return cmdBlockHtml(b, reg(b));
        case 'file': return fileBlockHtml(b, reg(b));
        case 'out': return `<div class="code-block out-block"><div class="code-head"><span class="t"><span class="tag">📟 출력</span>${esc(b.title || '')}</span></div><pre class="term">${esc(String(b.code).replace(/\s+$/, ''))}</pre>${b.desc ? `<div class="code-desc">${b.desc}</div>` : ''}</div>`;
        case 'callout': {
          const icon = { tip: '💡', warn: '⚠️', info: 'ℹ️', more: '📘', vm: '🖥' }[b.kind] || 'ℹ️';
          const title = b.title || { tip: '팁', warn: '주의', info: '참고', more: '더 알아보기', vm: '실제 클라우드에서 하기' }[b.kind];
          return `<div class="callout ${esc(b.kind)}"><div class="ct">${icon} ${b.kind === 'more' && b.title ? '더 알아보기 · ' + b.title : title}</div><div>${window.JU.scoped(b.html)}</div></div>`;
        }
        case 'figure':
          return `<div class="figure">${window.JU.scoped(b.html)}${b.caption ? `<p class="caption">${b.caption}</p>` : ''}</div>`;
        default:
          return b.html ? `<div>${b.html}</div>` : '';
      }
    }).join('\n');

    const practice = (sec.practice || []).map((p, i) => {
      const solId = p.solution ? reg({ code: p.solution, title: p.title + ' (정답)' }) : null;
      const lv = '★'.repeat(p.level || 1) + '☆'.repeat(3 - (p.level || 1));
      return `<div class="practice" data-prac="${i}"><div class="practice-head"><b>🛠️ ${esc(p.title)}</b><span class="level" title="난이도">${lv}</span></div>
        <div class="practice-body">${p.desc || ''}
          ${p.hint ? `<details><summary>💡 힌트</summary><div>${p.hint}</div></details>` : ''}
          <div class="actions">
            ${p.check ? `<button class="btn small primary" data-check="${i}">✔ 확인하기</button>` : ''}
            ${teacher && solId ? `<button class="btn small blue" data-code-act="run" data-code="${solId}">▶ 정답 실행</button><button class="btn small ghost" data-toggle-sol="${i}">🔑 정답 보기</button>` : ''}
          </div>
          <div class="check-result hidden"></div>
          ${teacher && solId ? `<div class="solution hidden" data-sol="${i}">${cmdBlockHtml({ code: p.solution, title: '정답 명령' }, solId, { tag: '교사용' })}</div>` : ''}
        </div></div>`;
    }).join('');

    const quiz = (sec.quiz || []).map((q, i) => `<div class="quiz" data-quiz="${i}"><div class="q"><span class="qn">Q${i + 1}.</span>${q.q}</div>
      <div class="opts">${(q.options || []).map((o, j) => `<button class="opt" data-q="${i}" data-o="${j}"><span class="n">${j + 1}</span><span>${o}</span></button>`).join('')}</div>
      <div class="explain hidden">${teacher ? `<b>정답 ${q.answer + 1}번.</b> ` : ''}${q.explain || ''}</div></div>`).join('');

    const flow = (sec.flow || []).length ? `<div class="flow teacher-only">${sec.flow.map((f) => `<div style="flex:${f[1]}"><b>${esc(f[0])}</b> ${f[1]}분</div>`).join('')}</div>` : '';
    const done = app.done.has(sec.id);
    const nCmd = (sec.content || []).filter((b) => b.type === 'cmd' && !b.vm).length;
    const nVm = (sec.content || []).filter((b) => (b.type === 'cmd' && b.vm) || (b.type === 'callout' && b.kind === 'vm')).length;

    $('content').innerHTML = `<div class="doc">
      <span class="chapter-badge">${esc(ch.icon || '')} ${esc(ch.extra ? "심화" : ch.no + "일차")} · ${esc(ch.title)} · ${idx + 1}/${ch.sections.length}교시</span>
      <h1>${esc(sec.title)}</h1>
      <div class="meta-row"><span class="chip">⏱ ${sec.minutes || 50}분</span><span class="chip">💻 터미널 실습 ${nCmd}</span>${nVm ? `<span class="chip vm-chip">🖥 실제 클라우드 ${nVm}</span>` : ''}
        <span class="chip">🛠️ 과제 ${(sec.practice || []).length}</span><span class="chip">❓ 퀴즈 ${(sec.quiz || []).length}</span>
        <button class="btn small ghost" data-slides="${sec.id}">🖼️ 슬라이드로 보기</button>
        ${teacher ? '<button class="btn small ghost" id="showAllAnswers">🔑 퀴즈 정답 모두 보기</button>' : ''}</div>
      ${(sec.goals || []).length ? `<div class="goals"><b>🎯 학습 목표</b><ul>${sec.goals.map((g) => `<li>${g}</li>`).join('')}</ul></div>` : ''}
      ${flow}
      ${blocks}
      ${practice ? `<h2>🛠️ 실습 과제</h2>${practice}` : ''}
      ${quiz ? `<h2>❓ 확인 퀴즈</h2>${quiz}` : ''}
      <div class="section-end">
        <button class="btn done-btn${done ? ' done' : ''}" id="doneBtn">${done ? '✔ 학습 완료' : '☐ 학습 완료로 표시'}</button>
        <span class="spacer"></span>
        ${prev ? `<a class="btn ghost" href="#${prev.sec.id}">◀ ${esc(prev.sec.title)}</a>` : ''}
        ${next ? `<a class="btn primary" href="#${next.sec.id}">${esc(next.sec.title)} ▶</a>` : ''}
      </div>
    </div>`;
    $('content').scrollTop = 0;
  }

  // ================================================================== 레이아웃 (크기 조절)
  function setupLayout() {
    const root = document.documentElement;
    const nav = store.get('navW', ''), out = store.get('outW', ''), ed = store.get('edH', '');
    if (nav) root.style.setProperty('--nav-w', nav);
    if (out) root.style.setProperty('--out-w', out);
    if (ed) root.style.setProperty('--editor-h', ed);
    if (store.get('navCollapsed', '0') === '1') $('app').classList.add('nav-collapsed');
    if (store.get('edFolded', '1') === '0') { $('editorPane').classList.remove('folded'); $('foldBtn').textContent = '▾ 접기'; }

    document.querySelectorAll('[data-resize]').forEach((g) => {
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        g.setPointerCapture(e.pointerId);
        g.classList.add('drag');
        const kind = g.dataset.resize;
        const move = (ev) => {
          if (kind === 'nav') {
            const w = Math.max(200, Math.min(480, ev.clientX)) + 'px';
            root.style.setProperty('--nav-w', w); store.set('navW', w);
          } else if (kind === 'out') {
            const w = Math.max(300, Math.min(window.innerWidth * 0.65, window.innerWidth - ev.clientX)) + 'px';
            root.style.setProperty('--out-w', w); store.set('outW', w);
          } else if (kind === 'editor') {
            const rect = $('docView').getBoundingClientRect();
            const h = Math.max(60, Math.min(rect.height - 80, rect.bottom - ev.clientY));
            const v = (h / rect.height * 100).toFixed(1) + '%';
            root.style.setProperty('--editor-h', v); store.set('edH', v);
            app.editor.refresh();
          }
          app.deck && app.deck.fit();
        };
        const up = () => { g.classList.remove('drag'); g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); app.editor.refresh(); };
        g.addEventListener('pointermove', move);
        g.addEventListener('pointerup', up);
      });
    });
  }

  // ================================================================== 가상 머신 창 · 모달
  function openModal(title, html) {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = html;
    $('modal').classList.remove('hidden');
  }
  function closeModal() { $('modal').classList.add('hidden'); }
  app.openModal = openModal;

  function vmModal() {
    const m = app.term.m;
    let size = 0;
    try { size = (localStorage.getItem((C.vmKey || 'studyUbuntu.vm.v1')) || '').length; } catch (e) { /* 무시 */ }
    const extra = Object.keys(m.state.pkgs).filter((n) => LX.PKGS[n] && !LX.PKGS[n].base);
    const running = Object.entries(m.state.services).filter(([n, s]) => s.active && LX.SERVICES[n] && !LX.SERVICES[n].sys && !['snapd', 'unattended-upgrades', 'ufw', 'cron', 'rsyslog'].includes(n)).map(([n]) => n);
    openModal('☁️ 가상 서버 정보', `
      <div class="table-wrap"><table><tbody>
        <tr><th>운영체제</th><td>${esc(LX.OS.pretty)} · 커널 ${esc(LX.OS.kernel)}</td></tr>
        <tr><th>호스트 이름 · IP</th><td><code>${esc(m.hostname())}</code> · <code>${esc((m.state.net.ifaces.enp0s3.addr[0] || '').split('/')[0])}</code></td></tr>
        <tr><th>로그인 사용자</th><td><code>student</code> (비밀번호 <code>ubuntu</code>, sudo 그룹)</td></tr>
        <tr><th>추가 설치 패키지</th><td>${extra.length ? extra.map((x) => `<code>${esc(x)}</code>`).join(' ') : '없음'}</td></tr>
        <tr><th>실행 중인 서버 서비스</th><td>${running.length ? running.map((x) => `<code>${esc(x)}</code>`).join(' ') : '없음'}</td></tr>
        <tr><th>브라우저 저장 용량</th><td>${(size / 1024).toFixed(0)} KB</td></tr>
      </tbody></table></div>
      <p class="muted" style="font-size:13.5px">가상 머신의 파일 · 설정은 이 브라우저(localStorage)에만 저장됩니다. 다른 PC 로 옮기거나 백업하려면 스냅숏 파일로 내보내세요.</p>
      <div class="meta-row">
        <button class="btn" id="vmExport">⬇ 스냅숏 내보내기</button>
        <label class="btn" style="cursor:pointer">⬆ 스냅숏 가져오기<input type="file" id="vmImport" accept=".json,application/json" hidden></label>
        <button class="btn danger" id="vmReset">⟲ 처음 상태로 초기화</button>
      </div>`);
    $('vmExport').onclick = () => {
      m.save();
      let data = '';
      try { data = localStorage.getItem((C.vmKey || 'studyUbuntu.vm.v1')) || ''; } catch (e) { /* 무시 */ }
      const blob = new Blob([data], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ubuntu-vm-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $('vmImport').onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const text = await f.text();
        const d = JSON.parse(text);
        if (!d || d.v !== LX.IMAGE_VERSION || !d.fs) throw new Error('형식이 맞지 않습니다');
        localStorage.setItem((C.vmKey || 'studyUbuntu.vm.v1'), text);
        app.toast('스냅숏을 가져왔습니다. 페이지를 다시 불러옵니다…');
        setTimeout(() => location.reload(), 800);
      } catch (err) { app.toast('가져오지 못했습니다: ' + err.message); }
    };
    $('vmReset').onclick = async () => {
      if (!confirm('가상 머신을 처음 설치한 상태로 되돌릴까요?\n만든 파일 · 설치한 패키지 · 설정이 모두 지워집니다.')) return;
      closeModal();
      await app.term.resetVm();
      app.toast('가상 머신을 초기화했습니다');
    };
  }

  function openFileDialog() {
    const def = app.ed.path || (topCred().home + '/');
    const p = prompt('열 파일의 경로 (없으면 새로 만듭니다)', def);
    if (!p) return;
    const top = app.term.session.top;
    const abs = LX.path.normalize(top && top.cwd ? top.cwd : '/home/student', p.replace(/^~/, topCred().home));
    openFreeFile(abs);
  }

  // ================================================================== 이벤트
  function bindUi() {
    $('themeBtn').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    document.querySelectorAll('.role-switch button').forEach((b) => b.onclick = () => setRole(b.dataset.role));
    document.querySelectorAll('.view-switch button').forEach((b) => b.onclick = () => setView(b.dataset.view));
    $('navSearch').addEventListener('input', () => buildNav());
    $('navTree').addEventListener('click', (e) => {
      const head = e.target.closest('.nav-ch-head');
      if (!head) return;
      const box = head.parentElement;
      if (!box.dataset.ch) return;
      box.classList.toggle('open');
      store.set('open.' + box.dataset.ch, box.classList.contains('open') ? '1' : '0');
    });
    $('navCloseBtn').onclick = () => { $('app').classList.add('nav-collapsed'); store.set('navCollapsed', '1'); setTimeout(() => { app.editor.refresh(); app.deck.fit(); }, 50); };
    $('navOpenBtn').onclick = () => { $('app').classList.remove('nav-collapsed'); store.set('navCollapsed', '0'); setTimeout(() => { app.editor.refresh(); app.deck.fit(); }, 50); };
    $('prevBtn').onclick = () => app.stepSection(-1, 0);
    $('nextBtn').onclick = () => app.stepSection(1, 0);

    $('edSaveBtn').onclick = () => saveEditor();
    $('edCloseBtn').onclick = () => closeEditor();
    $('edRunBtn').onclick = () => runEditorFile();
    $('edOpenBtn').onclick = () => openFileDialog();
    $('fontUpBtn').onclick = () => setEditorFont(app.edFont + 1);
    $('fontDownBtn').onclick = () => setEditorFont(app.edFont - 1);
    $('foldBtn').onclick = () => {
      const f = $('editorPane').classList.toggle('folded');
      $('foldBtn').textContent = f ? '▴ 펼치기' : '▾ 접기';
      store.set('edFolded', f ? '1' : '0');
      if (!f) app.editor.refresh();
    };
    $('serverBtn').onclick = vmModal;
    // 편집기 단축키 (CodeMirror 가 먹지 않는 환경 대비)
    $('editorPane').addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey) || !app.ed.path) return;
      const k = e.key.toLowerCase();
      if (k === 's' || k === 'o') { e.preventDefault(); e.stopPropagation(); saveEditor(); }
      else if (k === 'x' && !(app.editor.cm && app.editor.cm.somethingSelected())) { e.preventDefault(); e.stopPropagation(); closeEditor(); }
    }, true);
    $('modalClose').onclick = closeModal;
    $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('modal').classList.contains('hidden')) closeModal(); });

    $('content').addEventListener('click', (e) => {
      const act = e.target.closest('[data-code-act]');
      if (act) {
        const b = app.blockCodes[act.dataset.code];
        if (!b) return;
        const a = act.dataset.codeAct;
        if (a === 'copy') return copyText(b.code);
        if (a === 'run') { app.runCommands(b.code); return; }
        if (a === 'save') { saveBlockFile(b); return; }
        if (a === 'edit') { openFreeFile(b.path, b.code); return; }
        return;
      }
      const ck = e.target.closest('[data-check]');
      if (ck) { const p = app.route.sec.practice[+ck.dataset.check]; checkPractice(p, ck.closest('.practice')); return; }
      const opt = e.target.closest('.quiz .opt');
      if (opt) {
        const q = app.route.sec.quiz[+opt.dataset.q];
        const box = opt.closest('.quiz');
        const j = +opt.dataset.o;
        opt.classList.add(j === q.answer ? 'right' : 'wrong');
        if (j === q.answer) box.querySelector('.explain').classList.remove('hidden');
        return;
      }
      const sol = e.target.closest('[data-toggle-sol]');
      if (sol) {
        const el = $('content').querySelector(`[data-sol="${sol.dataset.toggleSol}"]`);
        const hidden = el.classList.toggle('hidden');
        sol.textContent = hidden ? '🔑 정답 보기' : '🔑 정답 숨기기';
        return;
      }
      const sl = e.target.closest('[data-slides]');
      if (sl) { app.view = 'slides'; go(sl.dataset.slides); if (location.hash === '#' + sl.dataset.slides) render(); return; }
      const rg = e.target.closest('[data-role-go]');
      if (rg) { setRole(rg.dataset.roleGo); return; }
      if (e.target.id === 'doneBtn') { toggleDone(app.route.sec.id); render(); }
      if (e.target.id === 'showAllAnswers') {
        app.route.sec.quiz.forEach((q, i) => {
          const box = $('content').querySelector(`[data-quiz="${i}"]`);
          box.querySelector(`[data-o="${q.answer}"]`).classList.add('right');
          box.querySelector('.explain').classList.remove('hidden');
        });
      }
    });

    document.addEventListener('keydown', (e) => {
      if (app.view === 'slides' && app.route.type === 'section') return;
      const t = e.target;
      if (t.closest && (t.closest('.CodeMirror') || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); app.stepSection(1, 0); }
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); app.stepSection(-1, 0); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

