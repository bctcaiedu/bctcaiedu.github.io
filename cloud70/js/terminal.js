
/* 가상 Ubuntu 터미널 화면 (오른쪽 패널)
 * - LX.Machine / LX.Session 을 화면과 연결한다
 * - ANSI 색, 입력 줄 편집, 탭 완성, 명령 기록, Ctrl+C, 한글 입력, 붙여넣기
 */
(function () {
  const COURSE = window.UBUNTU_COURSE || {};
  const NS = 'uc.' + (COURSE.id || 'ubuntu') + '.';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(NS + k.replace(/^jc\./, '')); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(NS + k.replace(/^jc\./, ''), v); } catch (e) { /* 저장 불가 */ } },
    remove(k) { try { localStorage.removeItem(NS + k.replace(/^jc\./, '')); } catch (e) { /* 무시 */ } }
  };
  window.Runner = { store };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ------------------------------------------------------------------ ANSI → HTML
  const FG = { 30: 'k', 31: 'r', 32: 'g', 33: 'y', 34: 'b', 35: 'm', 36: 'c', 37: 'w', 90: 'K', 91: 'R', 92: 'G', 93: 'Y', 94: 'B', 95: 'M', 96: 'C', 97: 'W' };
  function sgr(state, codes) {
    const c = codes.length ? codes : [0];
    for (let i = 0; i < c.length; i++) {
      const n = c[i];
      if (n === 0) { state.b = state.d = state.u = state.i = false; state.fg = state.bg = null; }
      else if (n === 1) state.b = true;
      else if (n === 2) state.d = true;
      else if (n === 4) state.u = true;
      else if (n === 7) state.i = true;
      else if (n === 22) state.b = state.d = false;
      else if (n === 24) state.u = false;
      else if (n === 27) state.i = false;
      else if (n === 39) state.fg = null;
      else if (n === 49) state.bg = null;
      else if (FG[n]) state.fg = FG[n];
      else if (n >= 40 && n <= 47) state.bg = FG[n - 10];
      else if (n >= 100 && n <= 107) state.bg = FG[n - 10];
      else if (n === 38 && c[i + 1] === 5) { const x = c[i + 2]; state.fg = x < 8 ? FG[30 + x] : x < 16 ? FG[82 + x] : 'x' + x; i += 2; }
      else if (n === 48 && c[i + 1] === 5) { const x = c[i + 2]; state.bg = x < 8 ? FG[30 + x] : 'k'; i += 2; }
    }
  }
  function ansiHtml(text, state) {
    let out = '';
    const re = /\x1b\[([0-9;?]*)([A-Za-z])|\x1b\][^\x07]*\x07/g;
    let last = 0, m;
    const span = (t) => {
      if (!t) return;
      const cls = [];
      if (state.b) cls.push('a-b');
      if (state.d) cls.push('a-d');
      if (state.u) cls.push('a-u');
      let fg = state.fg, bg = state.bg;
      if (state.i) { const f = fg; fg = bg || 'bgc'; bg = f || 'fgc'; }
      if (fg) cls.push('f-' + fg);
      if (bg) cls.push('bg-' + bg);
      out += cls.length ? `<span class="${cls.join(' ')}">${esc(t)}</span>` : esc(t);
    };
    while ((m = re.exec(text))) {
      span(text.slice(last, m.index));
      last = re.lastIndex;
      if (m[2] === 'm') sgr(state, m[1] ? m[1].split(';').filter((x) => x !== '').map(Number) : []);
      else if (m[2] === 'J' && /2|3/.test(m[1])) out += '\u0000CLEAR\u0000';
    }
    span(text.slice(last));
    return out;
  }

  // ------------------------------------------------------------------ 터미널
  class Term {
    constructor(panel, app) {
      this.panel = panel;
      this.app = app;
      this.box = panel.querySelector('#term');
      this.log = document.createElement('div');
      this.log.className = 'term-log';
      this.lineEl = document.createElement('div');
      this.lineEl.className = 'term-line';
      this.ta = document.createElement('textarea');
      this.ta.className = 'term-input';
      this.ta.setAttribute('autocapitalize', 'off');
      this.ta.setAttribute('autocomplete', 'off');
      this.ta.setAttribute('spellcheck', 'false');
      this.ta.setAttribute('aria-label', '터미널 입력');
      this.box.append(this.log, this.lineEl, this.ta);
      this.ansi = {};
      this.buf = '';
      this.cur = 0;
      this.queue = [];
      this.running = false;
      this.req = null;
      this.hIdx = null;
      this.draft = '';
      this.composing = '';
      this.lastTab = 0;
      this.fontSize = +store.get('termFont', 14);
      this.state = panel.querySelector('#runState');
      this.statusLeft = panel.querySelector('#statusLeft');
      this.applyFont();

      this.m = new LX.Machine({ storageKey: (window.UBUNTU_COURSE.vmKey || 'studyUbuntu.vm.v1') });
      this.m.on((ev) => { if (ev === 'save-error') app.toast && app.toast('브라우저 저장 공간이 부족해 가상 머신 상태를 저장하지 못했습니다'); });
      const ui = {
        write: (t) => this.write(t),
        requestLine: (p, o) => this.request(p, o),
        clear: () => this.clear(),
        openEditor: (path, opts) => (app.openNano ? app.openNano(path, opts) : Promise.resolve({})),
        powerCycle: (kind) => this.powerCycle(kind),
        banner: () => this.banner(true)
      };
      this.session = new LX.Session(this.m, ui, {});
      this.session.cols = 80;
      this.cronSession = new LX.Session(this.m, { write() {} }, { headless: true });
      this.cronSession.noClock = true;
      this.bind();
      this.measure();
      new ResizeObserver(() => this.measure()).observe(this.box);
    }

    applyFont() {
      this.panel.style.setProperty('--c-font', this.fontSize + 'px');
      store.set('termFont', this.fontSize);
      this.measure && this.measure();
    }

    measure() {
      if (!this.session) return;
      const w = this.box.clientWidth - 24;
      const ch = this.fontSize * 0.6;
      if (w > 0) this.session.cols = Math.max(40, Math.floor(w / ch));
    }

    async boot() {
      this.banner(false);
      await this.session.start();
      this.render();
      // cron · 예약 종료 · at 작업 (페이지가 열려 있는 동안)
      let lastMin = -1;
      setInterval(async () => {
        const m = this.m;
        const d = LX.localDate(m);
        const min = d.getUTCMinutes();
        if (min !== lastMin) {
          lastMin = min;
          try { await LX.cronTick(m, this.cronSession); } catch (e) { /* 무시 */ }
          const due = (m.state.atJobs || []).filter((j) => j.t <= m.now());
          for (const j of due) {
            m.state.atJobs = m.state.atJobs.filter((x) => x !== j);
            const sh = new LX.Shell(this.cronSession, { user: j.user });
            try { await sh.runSource(j.cmds, { stdin: new LX.InStream(''), out() {}, err() {}, tty: false }); } catch (e) { /* 무시 */ }
          }
        }
        if (m.state.shutdownAt && m.state.shutdownAt <= m.now() && !this.running) {
          delete m.state.shutdownAt;
          this.write(`\nBroadcast message from root@${m.hostname()} on pts/0:\n\nThe system will reboot now!\n\n`);
          await LX.rebootMachine(m, this.session, 'reboot');
          this.render();
        }
      }, 5000);
      window.addEventListener('beforeunload', () => this.m.save());
    }

    banner(afterReboot) {
      const m = this.m;
      if (afterReboot) this.write(`\n${LX.OS.pretty} ${m.hostname()} tty1\n\n${m.hostname()} login: ${m.defaultUser}\nPassword: \n`);
      this.write(LX.motd(m));
      this.write('\x1b[1;33m☁️ 가상 클라우드 서버 (Ubuntu 24.04)\x1b[0m\x1b[2m — 브라우저 안에서만 동작합니다\n   사용자 student · 비밀번호 ubuntu (sudo 입력용) · 공인 IP 203.0.113.25\n   클라우드 방화벽 seclist · 외부 PC labclient · 연습용 CLI aws / az / gcloud\n   Tab 자동 완성 · ↑↓ 명령 기록 · Ctrl+C 중단 · Ctrl+L 화면 지우기\x1b[0m\n\n');
    }

    // ---------------------------------------------------------------- 출력
    atBottom() { return this.box.scrollHeight - this.box.scrollTop - this.box.clientHeight < 60; }
    stick() { this.box.scrollTop = this.box.scrollHeight; }

    write(text) {
      if (!text) return;
      const html = ansiHtml(String(text).replace(/\r\n/g, '\n').replace(/\r/g, ''), this.ansi);
      const parts = html.split('\u0000CLEAR\u0000');
      parts.forEach((p, i) => {
        if (i > 0) this.log.innerHTML = '';
        if (p) this.log.insertAdjacentHTML('beforeend', p);
      });
      // 너무 길어지면 앞부분을 잘라 낸다
      if (this.log.childNodes.length > 4000) {
        while (this.log.childNodes.length > 3000) this.log.removeChild(this.log.firstChild);
      }
      this.stick();
    }

    clear() { this.log.innerHTML = ''; this.ansi = {}; this.render(); }

    promptText() {
      if (this.req) return this.req.prompt || '';
      if (this.running) return '';
      return this.session.prompt();
    }

    render() {
      const p = ansiHtml(this.promptText(), {});
      const secret = this.req && this.req.secret;
      const before = secret ? '' : this.buf.slice(0, this.cur);
      const at = secret ? '' : (this.buf[this.cur] || '');
      const after = secret ? '' : this.buf.slice(this.cur + 1);
      const comp = this.composing ? `<span class="term-comp">${esc(this.composing)}</span>` : '';
      const ahead = this.running && !this.req;
      this.lineEl.innerHTML = `${p}<span class="${ahead ? 'term-ahead' : ''}">${esc(before)}${comp}<span class="term-cursor${this.focused ? '' : ' blur'}">${at ? esc(at) : ' '}</span>${esc(after)}</span>`;
      this.lineEl.classList.toggle('busy', this.running && !this.req);
      this.ta.style.top = this.lineEl.offsetTop + 'px'; this.ta.style.bottom = 'auto';
      if (this.state) {
        const busy = this.running && !this.req;
        this.state.textContent = this.req ? '입력 대기' : busy ? '실행 중' : '대기';
        this.state.className = 'run-state ' + (this.req ? 'input' : busy ? 'running' : 'idle');
      }
      if (this.statusLeft) {
        const top = this.session.top;
        this.statusLeft.textContent = top && top.cred ? `${top.cred.name}@${(top.m || this.m).hostname()} · ${top.cwd || ''}` : '';
      }
      this.stick();
    }

    echoLine(prompt, text, suffix = '') {
      this.write(prompt + text + suffix + '\n');
    }

    // ---------------------------------------------------------------- 입력 요청 (비밀번호 · y/n · read)
    request(prompt, opts = {}) {
      return new Promise((resolve) => {
        this.req = { prompt, secret: !!opts.secret, raw: !!opts.raw, resolve };
        this.buf = '';
        this.cur = 0;
        this.render();
        this.focus();
      });
    }

    finishRequest(value) {
      const r = this.req;
      if (!r) return;
      this.req = null;
      if (value == null) this.write(r.prompt + (r.secret ? '' : this.buf) + (r.raw ? '' : '^C') + '\n');
      else this.write(r.prompt + (r.secret ? '' : value) + '\n');
      this.buf = '';
      this.cur = 0;
      r.resolve(value);
      this.render();
    }

    // ---------------------------------------------------------------- 명령 실행
    /** 강좌 블록에서 명령을 보낸다 (여러 줄 가능) */
    runCommands(text) {
      const lines = String(text).replace(/\r/g, '').split('\n');
      while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
      if (!lines.length) return;
      this.queue.push(...lines);
      this.focus();
      this.pump();
    }

    async pump() {
      if (this.pumping) return;
      this.pumping = true;
      try {
        while (this.queue.length && !this.running && !this.req) {
          const line = this.queue.shift();
          await this.submit(line);
        }
      } finally {
        this.pumping = false;
      }
    }

    async submit(line) {
      const prompt = this.session.prompt();
      this.write(prompt + line + '\n');
      this.buf = '';
      this.cur = 0;
      this.hIdx = null;
      this.running = true;
      this.render();
      try {
        await this.session.feed(line);
      } catch (e) {
        this.write(`\x1b[31m(가상 터미널 오류) ${e && e.message}\x1b[0m\n`);
        console.error(e);
      } finally {
        this.running = false;
      }
      this.render();
      if (this.app.onTermCommand) this.app.onTermCommand(line);
    }

    async powerCycle(kind) {
      const ov = document.createElement('div');
      ov.className = 'term-power';
      ov.innerHTML = kind === 'reboot' ? '<div class="spin"></div><p>재부팅 중…</p>' : '<p>⏻ 가상 머신이 꺼졌습니다.</p><button class="btn primary">전원 켜기</button>';
      this.box.appendChild(ov);
      if (kind === 'reboot') await new Promise((r) => setTimeout(r, 1600));
      else await new Promise((r) => { ov.querySelector('button').onclick = r; });
      ov.remove();
    }

    /** Ctrl+C */
    interrupt() {
      if (this.req) { this.finishRequest(null); this.session.abort(); this.queue = []; return; }
      if (this.running) { this.write('^C\n'); this.session.abort(); this.queue = []; return; }
      this.write(this.session.prompt() + this.buf + '^C\n');
      const top = this.session.top;
      if (top && top.buffer != null) top.buffer = '';
      if (top && 'status' in top) top.status = 130;
      this.buf = '';
      this.cur = 0;
      this.render();
    }

    async resetVm() {
      this.queue = [];
      if (this.req) this.finishRequest(null);
      this.session.abort();
      this.m.reset();
      this.session.jobs.list = [];
      this.clear();
      this.write('\x1b[2m가상 머신을 처음 상태로 초기화했습니다.\x1b[0m\n\n');
      this.banner(false);
      await this.session.start();
      this.render();
    }

    // ---------------------------------------------------------------- 키 입력
    focus() { if (document.activeElement !== this.ta) this.ta.focus({ preventScroll: true }); }

    insert(text) {
      if (!text) return;
      const lines = text.replace(/\r/g, '').split('\n');
      if (lines.length > 1) {
        const first = this.buf.slice(0, this.cur) + lines[0] + this.buf.slice(this.cur);
        this.buf = first;
        this.cur = this.buf.length;
        this.enter();
        const rest = lines.slice(1);
        while (rest.length && rest[rest.length - 1] === '') rest.pop();
        if (rest.length) { this.queue.push(...rest); this.pump(); }
        return;
      }
      this.buf = this.buf.slice(0, this.cur) + text + this.buf.slice(this.cur);
      this.cur += text.length;
      this.render();
    }

    enter() {
      const line = this.buf;
      if (this.req) { this.finishRequest(line); return; }
      if (this.running) { this.queue.push(line); this.buf = ''; this.cur = 0; this.render(); return; }
      this.queue.unshift(line);
      this.buf = '';
      this.cur = 0;
      this.pump();
    }

    history(dir) {
      const h = this.session.history;
      if (!h.length) return;
      if (this.hIdx == null) { this.hIdx = h.length; this.draft = this.buf; }
      this.hIdx = Math.max(0, Math.min(h.length, this.hIdx + dir));
      this.buf = this.hIdx === h.length ? this.draft : h[this.hIdx];
      this.cur = this.buf.length;
      this.render();
    }

    complete() {
      if (this.req || this.running) return;
      const before = this.buf.slice(0, this.cur);
      const r = this.session.complete(before);
      if (!r.items.length) return;
      const word = before.slice(r.start);
      let common = r.items[0];
      for (const it of r.items) { let k = 0; while (k < common.length && k < it.length && common[k] === it[k]) k++; common = common.slice(0, k); }
      if (r.items.length === 1) {
        const add = r.items[0] + (r.items[0].endsWith('/') ? '' : ' ');
        this.buf = before.slice(0, r.start) + add + this.buf.slice(this.cur);
        this.cur = r.start + add.length;
        this.render();
        return;
      }
      if (common.length > word.length) {
        this.buf = before.slice(0, r.start) + common + this.buf.slice(this.cur);
        this.cur = r.start + common.length;
        this.render();
        return;
      }
      const now = Date.now();
      if (now - this.lastTab < 800 || r.items.length <= 40) {
        const shown = r.items.map((x) => { const t = x.replace(/\\(.)/g, '$1'); const b = t.endsWith('/') ? t.slice(0, -1).split('/').pop() + '/' : t.split('/').pop(); return b; });
        this.write(this.session.prompt() + this.buf + '\n' + LX.columns(shown, this.session.cols, LX.visLen));
        this.render();
      }
      this.lastTab = now;
    }

    bind() {
      const ta = this.ta;
      this.box.addEventListener('mouseup', () => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && this.box.contains(sel.anchorNode)) return;
        this.focus();
      });
      ta.addEventListener('focus', () => { this.focused = true; this.box.classList.add('focused'); this.render(); });
      ta.addEventListener('blur', () => { this.focused = false; this.box.classList.remove('focused'); this.render(); });
      ta.addEventListener('compositionupdate', (e) => { this.composing = e.data || ''; this.render(); });
      ta.addEventListener('compositionend', (e) => { this.composing = ''; ta.value = ''; this.insert(e.data || ''); });
      ta.addEventListener('input', (e) => {
        if (e.isComposing || this.composingFlag) return;
        const v = ta.value;
        ta.value = '';
        if (v) this.insert(v);
      });
      ta.addEventListener('compositionstart', () => { this.composingFlag = true; });
      ta.addEventListener('compositionend', () => { this.composingFlag = false; });
      ta.addEventListener('paste', (e) => {
        const t = (e.clipboardData || window.clipboardData).getData('text');
        if (t) { e.preventDefault(); this.insert(t); }
      });
      ta.addEventListener('keydown', (e) => {
        if (e.isComposing || e.keyCode === 229) return;
        const k = e.key;
        const ctrl = e.ctrlKey || e.metaKey;
        e.stopPropagation();
        if (ctrl && (k === 'c' || k === 'C')) {
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed && sel.toString()) return; // 복사
          e.preventDefault();
          this.interrupt();
          return;
        }
        if (ctrl && (k === 'v' || k === 'V')) return; // 붙여넣기는 paste 이벤트로
        if (ctrl && (k === 'l' || k === 'L')) { e.preventDefault(); this.log.innerHTML = ''; this.render(); return; }
        if (ctrl && (k === 'd' || k === 'D')) {
          e.preventDefault();
          if (this.req) { if (!this.buf) this.finishRequest(null); return; }
          if (!this.running && !this.buf) { this.queue.unshift('exit'); this.pump(); }
          return;
        }
        if (ctrl && (k === 'a' || k === 'A')) { e.preventDefault(); this.cur = 0; this.render(); return; }
        if (ctrl && (k === 'e' || k === 'E')) { e.preventDefault(); this.cur = this.buf.length; this.render(); return; }
        if (ctrl && (k === 'u' || k === 'U')) { e.preventDefault(); this.buf = this.buf.slice(this.cur); this.cur = 0; this.render(); return; }
        if (ctrl && (k === 'k' || k === 'K')) { e.preventDefault(); this.buf = this.buf.slice(0, this.cur); this.render(); return; }
        if (ctrl && (k === 'w' || k === 'W')) { e.preventDefault(); const b = this.buf.slice(0, this.cur).replace(/\S+\s*$/, ''); this.buf = b + this.buf.slice(this.cur); this.cur = b.length; this.render(); return; }
        if (ctrl && (k === 'z' || k === 'Z')) { e.preventDefault(); if (this.running) this.write('^Z\n\x1b[2m(가상 터미널: 작업 일시 정지는 지원하지 않습니다. 백그라운드 실행은 명령 끝에 & 를 붙이세요)\x1b[0m\n'); return; }
        if (ctrl && (k === 'x' || k === 'X' || k === 's' || k === 'S' || k === 'o' || k === 'O')) { e.preventDefault(); return; }
        switch (k) {
          case 'Enter': e.preventDefault(); this.enter(); return;
          case 'Backspace': e.preventDefault(); if (this.cur > 0) { this.buf = this.buf.slice(0, this.cur - 1) + this.buf.slice(this.cur); this.cur--; this.render(); } return;
          case 'Delete': e.preventDefault(); this.buf = this.buf.slice(0, this.cur) + this.buf.slice(this.cur + 1); this.render(); return;
          case 'ArrowLeft': e.preventDefault(); if (this.cur > 0) { this.cur--; this.render(); } return;
          case 'ArrowRight': e.preventDefault(); if (this.cur < this.buf.length) { this.cur++; this.render(); } return;
          case 'Home': e.preventDefault(); this.cur = 0; this.render(); return;
          case 'End': e.preventDefault(); this.cur = this.buf.length; this.render(); return;
          case 'ArrowUp': e.preventDefault(); if (!this.req) this.history(-1); return;
          case 'ArrowDown': e.preventDefault(); if (!this.req) this.history(1); return;
          case 'Tab': e.preventDefault(); this.complete(); return;
          case 'Escape': e.preventDefault(); return;
          case 'PageUp': e.preventDefault(); this.box.scrollTop -= this.box.clientHeight * 0.8; return;
          case 'PageDown': e.preventDefault(); this.box.scrollTop += this.box.clientHeight * 0.8; return;
          default:
        }
        if (/^q$/i.test(k) && this.running && !this.req) { e.preventDefault(); this.session.abort(); return; }
      });
      const tools = this.panel;
      const on = (id, fn) => { const b = tools.querySelector('#' + id); if (b) b.addEventListener('click', fn); };
      on('stopBtn', () => { this.interrupt(); this.focus(); });
      on('clearBtn', () => { this.log.innerHTML = ''; this.render(); this.focus(); });
      on('resetVmBtn', async () => {
        if (!confirm('가상 머신을 처음 설치한 상태로 되돌릴까요?\n만든 파일 · 설치한 패키지 · 설정이 모두 지워집니다.')) return;
        await this.resetVm();
        this.app.toast && this.app.toast('가상 머신을 초기화했습니다');
      });
      on('cFontUp', () => { this.fontSize = Math.min(26, this.fontSize + 1); this.applyFont(); });
      on('cFontDown', () => { this.fontSize = Math.max(10, this.fontSize - 1); this.applyFont(); });
    }
  }

  window.Term = Term;
  window.TermAnsi = ansiHtml;
})();

