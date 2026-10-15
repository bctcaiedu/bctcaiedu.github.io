
/* 가상 리눅스 — 머신 (사용자 · 명령 실행 · 프로세스 · 저장) + 세션(터미널 한 개) */
(function (G) {
  const LX = G.LX = G.LX || {};
  const P = () => LX.path;
  const { ExitSig, AbortSig, ReturnSig, BreakSig, ContinueSig } = LX.sig;

  // ======================================================================= 명령 등록
  LX.commands = LX.commands || {};
  /**
   * 명령 등록
   * @param {string|string[]} names
   * @param {Function} fn async (ctx) => 종료 코드
   * @param {object} meta { path: '/usr/bin', pkg }
   */
  LX.def = function (names, fn, meta = {}) {
    (Array.isArray(names) ? names : [names]).forEach((n) => { LX.commands[n] = Object.assign(fn.bind ? fn : fn, {}); LX.commands[n].meta = Object.assign({}, LX.commands[n].meta || {}, meta); });
  };
  LX.ELF = '\x7fELF\x02\x01\x01\x00 ubuntu-virtual:';

  // ======================================================================= 간이 해시 (가상 /etc/shadow)
  function hashPw(pw, salt) {
    salt = salt || Math.random().toString(36).slice(2, 10);
    let h1 = 0x811c9dc5, h2 = 0x1234567;
    const s = salt + ':' + pw;
    for (let i = 0; i < s.length; i++) {
      h1 ^= s.charCodeAt(i); h1 = Math.imul(h1, 16777619) >>> 0;
      h2 ^= s.charCodeAt(i) * 31; h2 = Math.imul(h2, 2246822519) >>> 0;
    }
    const abc = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let out = '';
    let x = h1, y = h2;
    for (let i = 0; i < 43; i++) {
      out += abc[(x ^ (y >>> (i % 7))) & 63];
      x = (Math.imul(x, 1103515245) + 12345) >>> 0;
      y = (y >>> 3) ^ Math.imul(y, 69069);
    }
    return `$y$j9T$${salt}$${out}`;
  }
  LX.hashPw = hashPw;

  // ======================================================================= 작업(백그라운드)
  /** 신호로 끝난 작업을 bash 가 알리는 문구 */
  const SIG_DESC = { 1: 'Hangup', 2: 'Interrupt', 3: 'Quit', 4: 'Illegal instruction', 5: 'Trace/breakpoint trap', 6: 'Aborted', 7: 'Bus error', 8: 'Floating point exception', 9: 'Killed', 10: 'User defined signal 1', 11: 'Segmentation fault', 12: 'User defined signal 2', 13: 'Broken pipe', 14: 'Alarm clock', 15: 'Terminated', 16: 'Stack fault', 24: 'CPU time limit exceeded', 25: 'File size limit exceeded', 26: 'Virtual timer expired', 27: 'Profiling timer expired', 30: 'Power failure', 31: 'Bad system call' };
  LX.SIG_DESC = SIG_DESC;
  class Jobs {
    constructor(m, session) { this.m = m; this.session = session; this.list = []; this.finished = []; this.notices = []; }
    nextId() { return this.list.length ? Math.max(...this.list.map((j) => j.id)) + 1 : 1; }
    add(id, text, user, extra) {
      const proc = this.m.spawn(user, text, extra);
      const job = { id, text, pid: proc.pid, proc, done: false, killed: false, stopped: false, status: 0 };
      proc.job = job;
      // fg · wait 가 작업을 기다릴 때: 검증(headless) 모드에서는 가상 시계를 앞당겨 작업을 끝까지 진행한다
      let prom = null;
      const session = this.session;
      Object.defineProperty(job, 'promise', {
        configurable: true, enumerable: false,
        get() { return session && session.headless && prom ? session.fastForward(job).then(() => prom) : prom; },
        set(p) { prom = p; }
      });
      this.list.push(job);
      return job;
    }
    finish(job) {
      this.m.exitProc(job.proc);
      job.done = true;
      job.stopped = false;
      if (this.list.includes(job)) this.finished.push(job);
    }
    /** %1 %+ %- %% %이름 %?문자열 */
    get(spec) {
      if (!this.list.length) return null;
      if (spec == null || spec === '%' || spec === '%%' || spec === '%+') return this.current();
      if (spec === '%-') return this.previous();
      const s = String(spec).replace(/^%/, '');
      if (/^\d+$/.test(s)) return this.list.find((j) => j.id === +s) || null;
      if (s.startsWith('?')) return this.list.find((j) => j.text.includes(s.slice(1))) || null;
      return this.list.slice().reverse().find((j) => j.text.startsWith(s)) || null;
    }
    /** 현재 작업(+): 멈춘 작업이 있으면 가장 최근에 멈춘 것, 없으면 가장 최근 작업 */
    current() {
      const st = this.list.filter((j) => j.stopped && !j.done);
      return st.length ? st[st.length - 1] : this.list[this.list.length - 1] || null;
    }
    previous() {
      const cur = this.current();
      const rest = this.list.filter((j) => j !== cur);
      return rest[rest.length - 1] || null;
    }
    mark(j) { return j === this.current() ? '+' : j === this.previous() ? '-' : ' '; }
    /** 멈춤 알림 (다음 프롬프트 전에 표시) */
    notifyStop(job) { if (!this.notices.includes(job)) this.notices.push(job); }
    report(out) {
      for (const j of this.notices) {
        if (j.stopped && !j.done && this.list.includes(j)) out(`[${j.id}]${this.mark(j)}  ${'Stopped'.padEnd(24)}${j.text}\n`);
      }
      this.notices = [];
      if (!this.finished.length) return;
      const marks = new Map(this.finished.map((j) => [j, this.mark(j)]));
      for (const j of this.finished) {
        const idx = this.list.indexOf(j);
        if (idx < 0) continue;
        this.list.splice(idx, 1);
        const sig = j.killed === true ? 15 : j.killed;
        const st = sig ? (SIG_DESC[sig] || `Signal ${sig}`) : j.status === 0 ? 'Done' : `Exit ${j.status}`;
        out(`[${j.id}]${marks.get(j)}  ${st.padEnd(24)}${j.text}\n`);
      }
      this.finished = [];
    }
  }

  // ======================================================================= 세션 (터미널)
  class Session {
    /**
     * @param {Machine} m
     * @param {object} ui { write(text, kind), requestLine(prompt, opts) → Promise<string|null>, clear(), openEditor(path, opts) → Promise }
     */
    constructor(m, ui, opts = {}) {
      this.m = m;
      this.ui = ui || {};
      this.headless = !!opts.headless;
      this.history = [];
      this.jobs = new Jobs(m, this);
      this.stack = [];
      this.aborted = false;
      this.busy = false;
      this.started = Date.now();
      this.sleepers = new Set();
      // 첫 터미널의 로그인 셸은 프로세스 표의 PID 1402 (-bash)
      const pid = m.nextPid();
      this.shellPid = m.sessions.size === 0 ? 1402 : pid;
      m.sessions.add(this);
    }

    get top() { return this.stack[this.stack.length - 1]; }

    out(s) { this.ui.write && this.ui.write(String(s), 'out'); }
    err(s) { this.ui.write && this.ui.write(String(s), 'err'); }

    async start(user) {
      const sh = new LX.Shell(this, { user: user || this.m.defaultUser, interactive: true, login: true });
      sh.pid = this.shellPid;
      this.stack = [sh];
      this.loadHistory(sh);
      await this.sourceStartup(sh);
      return sh;
    }

    async sourceStartup(sh) {
      const io = this.io();
      for (const f of ['.bashrc']) {
        const p = sh.cred.home + '/' + f;
        const node = sh.m.vfs.lookup(p);
        if (node && node.t === 'f') {
          try { await sh.runSource(sh.m.vfs.readFile(p, null), io); } catch (e) { /* 무시 */ }
        }
      }
    }

    loadHistory(sh) {
      try {
        const t = this.m.vfs.readFile(sh.cred.home + '/.bash_history', null);
        this.history = t.split('\n').filter(Boolean).slice(-1000);
      } catch (e) { this.history = []; }
    }

    addHistory(line) {
      line = String(line).replace(/\s+$/, '');
      if (!line || line === this.history[this.history.length - 1]) return;
      this.history.push(line);
      if (this.history.length > 1000) this.history.shift();
      const sh = this.top;
      if (!sh || !sh.cred) return;
      try { (sh.m || this.m).vfs.writeFile(sh.cred.home + '/.bash_history', line + '\n', sh.cred, { append: true, mode: 0o600 }); } catch (e) { /* 무시 */ }
    }

    io() {
      return { stdin: null, out: (s) => this.out(s), err: (s) => this.err(s), tty: true };
    }

    prompt() {
      const t = this.top;
      return t ? t.prompt() : '';
    }

    /** 터미널에서 한 줄 입력 */
    async feed(line) {
      this.aborted = false;
      this.busy = true;
      const top = this.top;
      let r = 'done';
      try {
        r = await top.input(line, this.io());
      } catch (e) {
        if (e instanceof ExitSig) { await this.pop(e.code); r = 'done'; }
        else if (e instanceof AbortSig) { r = 'done'; }
        else { this.err(`bash: ${e && e.message}\n`); if (this.debug) console.error(e); }
      } finally {
        this.busy = false;
        this.aborted = false;
      }
      this.jobs.report((s) => this.out(s));
      this.m.saveSoon();
      return r;
    }

    async pop(code) {
      const sh = this.stack.pop();
      if (sh && sh.proc) (sh.m || this.m).exitProc(sh.proc);
      if (sh && sh.onExit) await sh.onExit(code);
      if (!this.stack.length) {
        this.out('logout\n');
        if (this.ui.onLogout) this.ui.onLogout();
        await this.start(this.m.defaultUser);
      }
    }

    /** 중첩 셸 (su, sudo -i, ssh) 을 연다 */
    async pushShell(user, opts = {}) {
      const parent = this.top;
      const sh = new LX.Shell(this, { machine: opts.machine, user, interactive: true, login: !!opts.login, cwd: opts.cwd || (opts.login ? undefined : parent.cwd) });
      if (opts.keepEnv && parent) {
        for (const k of Object.keys(parent.vars)) if (parent.vars[k].x && !['HOME', 'USER', 'LOGNAME', 'PATH', 'SHELL'].includes(k)) sh.vars[k] = Object.assign({}, parent.vars[k]);
      }
      sh.onExit = opts.onExit;
      sh.remote = opts.remote;
      // 프로세스 표에 새 셸 (su · sudo -i · bash)
      sh.proc = sh.m.spawn(user, opts.login ? '-bash' : 'bash', { ppid: (parent && parent.pid) || this.shellPid });
      sh.pid = sh.proc.pid;
      this.stack.push(sh);
      if (opts.login) await this.sourceStartup(sh);
      return sh;
    }

    pushRepl(repl) { this.stack.push(repl); }

    requestLine(prompt, opts = {}) {
      if (this.headless) {
        const p = String(prompt || '').toLowerCase();
        let ans = null;
        if (opts.answer != null) ans = opts.answer;
        else if (/password|암호|passphrase/.test(p)) ans = opts.passphrase ? '' : (opts.password || this.m.defaultPassword);
        else if (/\[y\/n\]|\(y\/n\)|\[y\/n\]|yes\/no|\[Y\/n\]/i.test(prompt)) ans = 'y';
        else if (opts.raw) ans = null;
        else ans = '';
        if (prompt) this.out(prompt + (opts.secret ? '' : (ans || '')) + '\n');
        return Promise.resolve(ans);
      }
      return this.ui.requestLine ? this.ui.requestLine(prompt, opts) : Promise.resolve(null);
    }

    sleep(ms, job) {
      if ((this.aborted && !job) || (job && job.killed)) return Promise.reject(new AbortSig());
      if (this.headless) {
        // 검증 모드: 앞쪽 명령은 가상 시계만 앞당기고 바로 끝난다.
        // 백그라운드 작업의 sleep 은 가상 시계가 그 시각에 이를 때까지 기다린다 (실제 bash 처럼 계속 Running)
        if (!job || this.noClock) {
          if (!this.noClock) this.m.clockOffset += ms;
          if (!this.noClock && this.wakeVirtual()) return new Promise((r) => setTimeout(r, 0));
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          const s = { job, done: false, virtual: true, remaining: ms, wake: this.m.now() + ms };
          s.finish = (ok) => { if (s.done) return; s.done = true; this.sleepers.delete(s); ok ? resolve() : reject(new AbortSig()); };
          s.pause = () => { s.remaining = Math.max(0, s.wake - this.m.now()); s.wake = Infinity; };
          s.resume = () => { s.wake = this.m.now() + s.remaining; };
          if (job.stopped) s.pause();
          this.sleepers.add(s);
        });
      }
      return new Promise((resolve, reject) => {
        const s = { job, done: false, remaining: ms, t: null };
        const finish = (ok) => { if (s.done) return; s.done = true; clearTimeout(s.t); this.sleepers.delete(s); ok ? resolve() : reject(new AbortSig()); };
        s.finish = finish;
        s.resume = () => { if (s.done || s.t) return; s.began = Date.now(); s.t = setTimeout(() => finish(!(this.aborted && !job) && !(job && job.killed)), s.remaining); };
        s.pause = () => { if (!s.t) return; clearTimeout(s.t); s.t = null; s.remaining = Math.max(0, s.remaining - (Date.now() - s.began)); };
        this.sleepers.add(s);
        if (!(job && job.stopped)) s.resume();
      });
    }

    /** 가상 시계에 맞춰 깨어날 백그라운드 sleep 을 깨운다. 깨운 것이 있으면 true */
    wakeVirtual() {
      let any = false;
      const now = this.m.now();
      for (const s of [...this.sleepers]) if (s.virtual && !s.job.stopped && s.wake <= now) { s.finish(true); any = true; }
      return any;
    }

    /** 검증 모드에서 fg · wait: 작업이 끝날 때까지 가상 시계를 앞당긴다 */
    async fastForward(job) {
      if (job.stopped) this.contJob(job);
      for (let i = 0; i < 10000 && !job.done; i++) {
        const mine = [...this.sleepers].filter((s) => s.virtual && s.job === job);
        if (mine.length) {
          const s = mine.reduce((a, b) => (a.wake <= b.wake ? a : b));
          if (s.wake !== Infinity && s.wake > this.m.now()) this.m.clockOffset += s.wake - this.m.now();
          this.wakeVirtual();
        }
        await new Promise((r) => setTimeout(r, 0));
        if (!mine.length && !job.done && ![...this.sleepers].some((s) => s.job === job)) {
          // sleep 이 아닌 곳에서 기다리는 중 — 한 번 더 기다려 본다
          await new Promise((r) => setTimeout(r, 0));
          if (![...this.sleepers].some((s) => s.job === job)) break;
        }
      }
    }

    /** Ctrl+C */
    abort() {
      this.aborted = true;
      for (const s of [...this.sleepers]) if (!s.job) s.finish(false);
    }

    /** 작업에 끝내는 신호 보내기 (기본 SIGTERM) */
    killJob(job, sig) {
      job.killed = sig || 15;
      job.stopped = false;
      if (job.proc) job.proc.stopped = false;
      for (const s of [...this.sleepers]) if (s.job === job) s.finish(false);
    }

    /** SIGSTOP · SIGTSTP: 작업 멈춤 */
    stopJob(job) {
      if (job.done || job.stopped) return;
      job.stopped = true;
      if (job.proc) job.proc.stopped = true;
      for (const s of [...this.sleepers]) if (s.job === job && s.pause) s.pause();
      this.jobs.notifyStop(job);
    }

    /** SIGCONT: 멈춘 작업 이어서 실행 */
    contJob(job) {
      if (!job.stopped) return;
      job.stopped = false;
      if (job.proc) job.proc.stopped = false;
      for (const s of [...this.sleepers]) if (s.job === job && s.resume) s.resume();
      if (this.headless) this.wakeVirtual();
    }

    openEditor(path, opts) {
      if (this.headless || !this.ui.openEditor) return Promise.resolve({ saved: false });
      return this.ui.openEditor(path, opts);
    }

    /** 탭 완성 */
    complete(line) {
      const sh = this.top;
      if (!sh || !(sh instanceof LX.Shell)) return { start: line.length, items: [] };
      const m = /(\S*)$/.exec(line);
      const word = m[1];
      const start = line.length - word.length;
      const before = line.slice(0, start);
      const firstWord = !before.trim() || /(\||&&|;|\|\||\$\(|sudo\s+|`)\s*$/.test(before);
      const items = new Set();
      if (firstWord && !word.includes('/')) {
        Object.keys(LX.BUILTINS).concat(Object.keys(sh.aliases), Object.keys(sh.funcs)).forEach((n) => { if (n.startsWith(word)) items.add(n); });
        for (const dir of sh.getVar('PATH').split(':')) {
          try {
            for (const n of this.m.vfs.readdir(dir, sh.cred)) if (n.startsWith(word)) items.add(n);
          } catch (e) { /* 무시 */ }
        }
      } else {
        let w = word;
        const home = sh.getVar('HOME');
        const tilde = w.startsWith('~');
        if (tilde) w = home + w.slice(1);
        const slash = w.lastIndexOf('/');
        const dirPart = slash >= 0 ? w.slice(0, slash + 1) : '';
        const namePart = slash >= 0 ? w.slice(slash + 1) : w;
        const dirAbs = P().normalize(sh.cwd, dirPart || '.');
        try {
          for (const n of this.m.vfs.readdir(dirAbs, sh.cred)) {
            if (!n.startsWith(namePart)) continue;
            if (n.startsWith('.') && !namePart.startsWith('.')) continue;
            const node = this.m.vfs.lookup(dirAbs + (dirAbs === '/' ? '' : '/') + n);
            let full = dirPart + n + (node && node.t === 'd' ? '/' : '');
            if (tilde) full = '~' + full.slice(home.length);
            items.add(full.replace(/([ '"()&;|<>$])/g, '\\$1'));
          }
        } catch (e) { /* 무시 */ }
        if (/^\s*(sudo\s+)?(systemctl|service)\s+\S*\s*$/.test(before)) {
          ['status', 'start', 'stop', 'restart', 'reload', 'enable', 'disable', 'is-active', 'is-enabled', 'daemon-reload', 'list-units'].forEach((c) => c.startsWith(word) && items.add(c));
        }
        if (/^\s*(sudo\s+)?systemctl\s+\S+\s+\S*$/.test(before + word) && before.trim().split(/\s+/).length >= 2) {
          Object.keys(this.m.state.services).forEach((s) => s.startsWith(word) && items.add(s));
        }
        if (/^\s*(sudo\s+)?apt(-get)?\s+\S*$/.test(before + word) && before.trim().split(/\s+/).length <= 2 && /apt(-get)?\s*$/.test(before.trim())) {
          ['update', 'upgrade', 'install', 'remove', 'purge', 'autoremove', 'search', 'show', 'list', 'full-upgrade'].forEach((c) => c.startsWith(word) && items.add(c));
        }
        if (/^\s*(sudo\s+)?apt(-get)?\s+(install|show|remove|purge)\s/.test(before)) {
          Object.keys(LX.PKGS || {}).forEach((p) => p.startsWith(word) && items.add(p));
        }
      }
      return { start, items: [...items].sort() };
    }
  }
  LX.Session = Session;

  // ======================================================================= 머신
  class Machine {
    constructor(opts = {}) {
      this.opts = opts;
      this.storageKey = opts.storageKey || 'studyUbuntu.vm.v1';
      this.defaultUser = 'student';
      this.defaultPassword = 'ubuntu';
      this.sessions = new Set();
      this.pidSeq = 2300;
      this.procs = [];
      this.clockOffset = 0;
      this.saveTimer = null;
      this.listeners = [];
      if (!opts.fresh && this.load()) { /* 저장된 상태 */ }
      else this.reset(true);
      this.bootTime = this.bootTime || Date.now() - 1000 * 60 * 7;
      this.initProcs();
    }

    now() { return Date.now() + this.clockOffset; }
    nextPid() { return ++this.pidSeq; }

    on(fn) { this.listeners.push(fn); }
    emit(ev, data) { this.listeners.forEach((f) => { try { f(ev, data); } catch (e) { /* 무시 */ } }); }

    // ------------------------------------------------------------ 초기화 · 저장
    reset(silent) {
      this.vfs = new LX.VFS();
      this.vfs.now = () => this.now();
      this.state = LX.defaultState();
      this.booting = true;
      this.bootPidSeq = 760;
      try { LX.buildImage(this); } finally { this.booting = false; }
      this.attachGen();
      this.bootTime = Date.now() - 1000 * 60 * 7;
      this.clockOffset = 0;
      if (LX.retimeBootLog) LX.retimeBootLog(this);
      if (!silent) this.save();
      this.emit('reset');
    }

    attachGen() {
      this.vfs.now = () => this.now();
      this.vfs.onWrite = () => this.saveSoon();
      LX.attachProc && LX.attachProc(this);
    }

    load() {
      if (this.opts.fresh || typeof localStorage === 'undefined') return false;
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return false;
        const d = JSON.parse(raw);
        if (!d || d.v !== LX.IMAGE_VERSION) return false;
        this.vfs = new LX.VFS(d.fs);
        this.state = Object.assign(LX.defaultState(), d.state || {});
        this.bootTime = d.bootTime || Date.now();
        this.clockOffset = d.clockOffset || 0;
        this.attachGen();
        return true;
      } catch (e) {
        return false;
      }
    }

    saveSoon() {
      if (this.opts.fresh || typeof localStorage === 'undefined') return;
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.save(), 600);
    }

    save() {
      if (this.opts.fresh || typeof localStorage === 'undefined') return;
      try {
        localStorage.setItem(this.storageKey, JSON.stringify({ v: LX.IMAGE_VERSION, fs: this.vfs.root, state: this.state, bootTime: this.bootTime, clockOffset: this.clockOffset }));
      } catch (e) {
        this.emit('save-error', e);
      }
    }

    hostname() {
      if (this.state && this.state.transientHost) return this.state.transientHost;
      try { return this.vfs.readFile('/etc/hostname', null).trim() || 'ubuntu'; } catch (e) { return 'ubuntu'; }
    }

    // ------------------------------------------------------------ 사용자
    passwd() {
      let t = '';
      try { t = this.vfs.readFile('/etc/passwd', null); } catch (e) { /* 없음 */ }
      return t.split('\n').filter(Boolean).map((l) => {
        const f = l.split(':');
        return { name: f[0], pw: f[1], uid: +f[2], gid: +f[3], gecos: f[4] || '', home: f[5] || '/', shell: f[6] || '/bin/sh' };
      });
    }
    groups() {
      let t = '';
      try { t = this.vfs.readFile('/etc/group', null); } catch (e) { /* 없음 */ }
      return t.split('\n').filter(Boolean).map((l) => {
        const f = l.split(':');
        return { name: f[0], gid: +f[2], members: (f[3] || '').split(',').filter(Boolean) };
      });
    }
    shadow() {
      let t = '';
      try { t = this.vfs.readFile('/etc/shadow', null); } catch (e) { /* 없음 */ }
      return t.split('\n').filter(Boolean).map((l) => { const f = l.split(':'); return { name: f[0], hash: f[1], line: l, f }; });
    }
    userName(uid) { const u = this.passwd().find((x) => x.uid === uid); return u ? u.name : String(uid); }
    groupName(gid) { const g = this.groups().find((x) => x.gid === gid); return g ? g.name : String(gid); }
    credFor(nameOrUid) {
      const users = this.passwd();
      const u = typeof nameOrUid === 'number' ? users.find((x) => x.uid === nameOrUid) : users.find((x) => x.name === nameOrUid);
      if (!u) return null;
      const gs = this.groups();
      const gids = [u.gid].concat(gs.filter((g) => g.members.includes(u.name)).map((g) => g.gid));
      return { uid: u.uid, gid: u.gid, gids: [...new Set(gids)], name: u.name, home: u.home, shell: u.shell };
    }
    inGroup(user, group) {
      const g = this.groups().find((x) => x.name === group);
      const c = this.credFor(user);
      return !!(g && c && c.gids.includes(g.gid));
    }
    checkPassword(user, pw) {
      const s = this.shadow().find((x) => x.name === user);
      if (!s) return false;
      const h = s.hash;
      if (!h || h.startsWith('!') || h === '*') return false;
      const m = /^\$y\$j9T\$([^$]+)\$/.exec(h);
      if (!m) return false;
      return hashPw(pw, m[1]) === h;
    }
    setPassword(user, pw, lock) {
      const lines = this.shadow();
      const days = Math.floor(this.now() / 86400000);
      let found = false;
      const out = lines.map((s) => {
        if (s.name !== user) return s.line;
        found = true;
        const f = s.f.slice();
        if (lock === 'lock') f[1] = f[1].startsWith('!') ? f[1] : '!' + f[1];
        else if (lock === 'unlock') f[1] = f[1].replace(/^!/, '');
        else { f[1] = hashPw(pw); f[2] = String(days); }
        return f.join(':');
      });
      if (!found) out.push(`${user}:${hashPw(pw)}:${days}:0:99999:7:::`);
      this.vfs.writeFile('/etc/shadow', out.join('\n') + '\n', null);
    }

    // ------------------------------------------------------------ 프로세스
    initProcs() {
      this.procs = [];
      const base = [
        [1, 0, 'root', '/sbin/init'],
        [2, 0, 'root', '[kthreadd]'],
        [312, 1, 'root', '/usr/lib/systemd/systemd-journald'],
        [355, 1, 'root', '/usr/lib/systemd/systemd-udevd'],
        [521, 1, 'systemd-network', '/usr/lib/systemd/systemd-networkd'],
        [528, 1, 'systemd-resolve', '/usr/lib/systemd/systemd-resolved'],
        [530, 1, 'systemd-timesync', '/usr/lib/systemd/systemd-timesyncd'],
        [612, 1, 'messagebus', '@dbus-daemon --system --address=systemd: --nofork --nopidfile --systemd-activation --syslog-only'],
        [640, 1, 'root', '/usr/lib/systemd/systemd-logind'],
        [701, 1, 'root', '/usr/sbin/cron -f -P'],
        [705, 1, 'syslog', '/usr/sbin/rsyslogd -n -iNONE'],
        [744, 1, 'root', '/sbin/agetty -o -p -- \\u --noclear - linux']
      ];
      base.forEach(([pid, ppid, user, cmd]) => this.procs.push({ pid, ppid, user, cmd, start: this.bootTime, cpu: 0, mem: 0.1 + (pid % 7) / 10, sys: true }));
      this.procs[0].comm = 'systemd';   // /sbin/init → /usr/lib/systemd/systemd
      this.procs.push({ pid: 1402, ppid: 1, user: this.defaultUser, cmd: '-bash', start: this.bootTime + 300000, tty: 'pts/0', sys: true, shell: true });
    }

    spawn(user, cmd, extra) {
      const p = Object.assign({ pid: this.nextPid(), ppid: 1402, user, cmd, start: this.now(), cpu: 0, mem: 0.1, tty: 'pts/0', ni: 0 }, extra || {});
      if (p.ppid == null) p.ppid = 1402;
      this.procs.push(p);
      return p;
    }
    exitProc(p) {
      const i = this.procs.indexOf(p);
      if (i >= 0) this.procs.splice(i, 1);
    }
    /** 서비스 프로세스 목록 (실행 중인 서비스에서 계산) */
    allProcs() {
      const list = this.procs.slice();
      const svcs = this.state.services;
      for (const name of Object.keys(svcs)) {
        const s = svcs[name];
        if (!s.active) continue;
        const def = LX.serviceDef(this, name);
        const cmds = (def && def.procs) || [[def && def.exec ? def.exec : name, 'root']];
        cmds.forEach((c, k) => {
          const n = Array.isArray(c[2]) ? 1 : (c[2] || 1);
          for (let r = 0; r < n; r++) list.push({ pid: (s.pid || 900) + k * 3 + r, ppid: k === 0 ? 1 : s.pid, user: c[1] || 'root', cmd: c[0], start: s.since || this.bootTime, cpu: 0, mem: def && def.mem ? def.mem : 0.4, svc: name });
        });
      }
      (this.state.containers || []).filter((c) => c.running).forEach((c, k) => {
        list.push({ pid: c.pid || 3100 + k, ppid: 1, user: 'root', cmd: c.cmdline || c.image, start: c.started || this.now(), cpu: 0, mem: 0.6, container: c.id });
      });
      return list.sort((a, b) => a.pid - b.pid);
    }

    // ------------------------------------------------------------ 명령 실행
    findInPath(name, pathVar) {
      for (const dir of String(pathVar || '').split(':')) {
        if (!dir) continue;
        const p = (dir === '/' ? '' : dir) + '/' + name;
        const node = this.vfs.lookup(p);
        if (node && node.t === 'f') return p;
      }
      return null;
    }

    notFound(name, io) {
      const pkg = LX.suggestPkg ? LX.suggestPkg(name) : null;
      if (pkg) {
        io.err(`Command '${name}' not found, but can be installed with:\nsudo apt install ${pkg}\n`);
      } else {
        io.err(`${name}: command not found\n`);
      }
      return 127;
    }

    async execFile(sh, argv, io) {
      const name = argv[0];
      let path;
      if (name.includes('/')) {
        path = P().normalize(sh.cwd, name);
        let node;
        try { node = this.vfs.stat(path, sh.cred); } catch (e) {
          io.err(`bash: ${name}: ${e.message}\n`);
          return e.code === 'EACCES' ? 126 : 127;
        }
        if (node.t === 'd') { io.err(`bash: ${name}: Is a directory\n`); return 126; }
      } else {
        path = this.findInPath(name, sh.getVar('PATH'));
        if (!path) return this.notFound(name, io);
      }
      const node = this.vfs.lookup(path);
      if (!this.vfs.perm(node, sh.cred, 1) || (sh.cred.uid !== 0 && !this.vfs.perm(node, sh.cred, 4) && !String(node.c || '').startsWith(LX.ELF))) {
        io.err(`bash: ${name}: Permission denied\n`);
        return 126;
      }
      const content = node.c || '';
      if (content.startsWith(LX.ELF)) {
        const bin = content.slice(LX.ELF.length).split('\n')[0];
        return this.runBinary(sh, bin, argv, io);
      }
      // 스크립트
      const first = content.split('\n')[0];
      const she = /^#!\s*(\S+)(?:\s+(\S+))?/.exec(first);
      let interp = she ? (P().basename(she[1]) === 'env' ? she[2] : P().basename(she[1])) : 'bash';
      if (!['bash', 'sh', 'dash', 'zsh'].includes(interp)) {
        if (/^python/.test(interp)) return this.runBinary(sh, 'python3', ['python3', path].concat(argv.slice(1)), io);
        io.err(`bash: ${name}: ${she ? she[1] : ''}: bad interpreter: No such file or directory\n`);
        return 126;
      }
      return this.runScript(sh, path, argv, io);
    }

    async runScript(sh, path, argv, io) {
      const child = sh.child('script');
      child.name0 = argv[0];
      child.pos = argv.slice(1);
      child.funcs = {};
      const proc = this.spawn(sh.cred.name, `/bin/bash ${argv.join(' ')}`, this.procExtra(sh, io));
      child.pid = proc.pid;
      try {
        const src = this.vfs.readFile(path, sh.cred);
        return await child.runMain(src, io);
      } catch (e) {
        if (e instanceof ExitSig) return e.code;
        if (e instanceof AbortSig) throw e;
        if (e && e.code === 'EACCES') { io.err(`bash: ${argv[0]}: Permission denied\n`); return 126; }
        throw e;
      } finally {
        this.exitProc(proc);
      }
    }

    async runBinary(sh, bin, argv, io) {
      const impl = LX.commands[bin];
      if (!impl) {
        io.err(`${bin}: 가상 터미널에서 지원하지 않는 명령입니다. 실제 Ubuntu(가상 머신)에서 실습하세요.\n`);
        return 127;
      }
      // exec 처럼 이전 프로세스를 이어 쓰는 경우 (nice · nohup 이 실행하는 명령)
      const execProc = io.execProc;
      if (execProc) { io = Object.assign({}, io); delete io.execProc; }
      // 백그라운드 작업의 단순 명령은 작업 프로세스(PID) 그대로 실행한다 (ps 에 두 번 나오지 않게)
      const job = io.job;
      const reuse = !!(job && job.simple && job.proc && !job.procBusy && !job.done && !execProc);
      let proc;
      if (execProc) { proc = execProc; proc.cmd = argv.join(' '); }
      else if (reuse) { proc = job.proc; job.procBusy = true; proc.cmd = argv.join(' '); }
      else proc = this.spawn(sh.cred.name, argv.join(' '), this.procExtra(sh, io));
      const ctx = sh.ctx(argv, io);
      ctx.bin = bin;
      ctx.proc = proc;
      try {
        const r = await impl(ctx);
        return r == null ? 0 : (r | 0);
      } catch (e) {
        if (e instanceof ExitSig || e instanceof AbortSig || e instanceof ReturnSig || e instanceof BreakSig || e instanceof ContinueSig) throw e;
        if (e instanceof LX.FSError) { io.err(`${ctx.name}: ${e.path ? `'${e.path}': ` : ''}${e.message}\n`); return 1; }
        io.err(`${ctx.name}: ${e && e.message ? e.message : e}\n`);
        if (sh.session.debug && typeof console !== 'undefined') console.error(e);
        return 1;
      } finally {
        if (reuse) job.procBusy = false;
        else if (!execProc) this.exitProc(proc);
      }
    }

    /** 새 프로세스의 부모 PID · nice 값 */
    procExtra(sh, io) {
      const job = io && io.job;
      const x = { ppid: (job && job.proc && !job.simple ? job.pid : null) || sh.pid || (sh.session && sh.session.shellPid) || 1402 };
      const ni = io && io.nice != null ? io.nice : (job && job.proc ? job.proc.ni : null);
      if (ni) x.ni = ni;
      return x;
    }

    /** 명령 파일 설치 (/usr/bin/이름) */
    installBin(name, dir = '/usr/bin', bin) {
      try {
        this.vfs.writeFile(`${dir}/${name}`, LX.ELF + (bin || name) + '\n', null, { mode: 0o755 });
        const sp = SPECIAL_MODES[name];
        if (sp && dir === '/usr/bin') { const n = this.vfs.lookup(`${dir}/${name}`, false); n.m = sp[0]; if (sp[1] != null) n.g = sp[1]; }
      } catch (e) { /* 무시 */ }
    }
  }
  LX.Machine = Machine;
  // SUID / SGID 가 붙은 명령 (실제 Ubuntu 와 같게)
  const SPECIAL_MODES = {
    passwd: [0o4755], sudo: [0o4755], su: [0o4755], chsh: [0o4755], chfn: [0o4755], gpasswd: [0o4755],
    newgrp: [0o4755], mount: [0o4755], umount: [0o4755], fusermount3: [0o4755], pkexec: [0o4755],
    chage: [0o2755, 42], expiry: [0o2755, 42], crontab: [0o2755, 103], 'ssh-agent': [0o2755, 106]
  };
  LX.SPECIAL_MODES = SPECIAL_MODES;
})(typeof window !== 'undefined' ? window : globalThis);

