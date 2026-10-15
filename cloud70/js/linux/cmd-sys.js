
/* 가상 리눅스 — 사용자 · 권한 상승 · 시스템 정보 · 프로세스 · 편집기 · 기타 */
(function (G) {
  const LX = G.LX = G.LX || {};
  const def = LX.def;
  const P = () => LX.path;
  const getopt = (...a) => LX.getopt(...a);
  const { ExitSig } = LX.sig;

  const pad2 = (n) => String(n).padStart(2, '0');
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MON_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function needRoot(c, msg) {
    if (c.cred.uid === 0) return false;
    c.err(msg + '\n');
    return true;
  }
  LX.needRoot = needRoot;

  // ======================================================================= 사용자 정보
  def('whoami', async (c) => { c.out(c.cred.name + '\n'); return 0; });
  def('logname', async (c) => { c.out((c.session.stack[0] && c.session.stack[0].cred ? c.session.stack[0].cred.name : c.cred.name) + '\n'); return 0; });
  def('tty', async (c) => { c.out(c.tty ? '/dev/pts/0\n' : 'not a tty\n'); return c.tty ? 0 : 1; });

  def('id', async (c) => {
    const { f, ops } = getopt(c.args, 'ugGnr', { user: 'u', group: 'g', groups: 'G', name: 'n' });
    let cred = c.cred;
    if (ops[0]) {
      cred = c.m.credFor(ops[0]) || (/^\d+$/.test(ops[0]) ? c.m.credFor(+ops[0]) : null);
      if (!cred) { c.err(`id: '${ops[0]}': no such user\n`); return 1; }
    }
    const gn = (g) => c.m.groupName(g);
    if (f.u) { c.out((f.n ? cred.name : cred.uid) + '\n'); return 0; }
    if (f.g) { c.out((f.n ? gn(cred.gid) : cred.gid) + '\n'); return 0; }
    if (f.G) { c.out(cred.gids.map((g) => (f.n ? gn(g) : g)).join(' ') + '\n'); return 0; }
    c.out(`uid=${cred.uid}(${cred.name}) gid=${cred.gid}(${gn(cred.gid)}) groups=${cred.gids.map((g) => `${g}(${gn(g)})`).join(',')}\n`);
    return 0;
  });

  def('groups', async (c) => {
    if (!c.args.length) { c.out(c.cred.gids.map((g) => c.m.groupName(g)).join(' ') + '\n'); return 0; }
    let st = 0;
    for (const u of c.args) {
      const cr = c.m.credFor(u);
      if (!cr) { c.err(`groups: '${u}': no such user\n`); st = 1; continue; }
      c.out(`${u} : ${cr.gids.map((g) => c.m.groupName(g)).join(' ')}\n`);
    }
    return st;
  });

  function loginTime(m) { const d = LX.localDate(m, m.bootTime + 300000); return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`; }
  def('who', async (c) => {
    if (c.args.includes('-b')) { const d = LX.localDate(c.m, c.m.bootTime); c.out(`         system boot  ${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}\n`); return 0; }
    if (c.args.includes('-r')) { c.out(`         run-level 5  ${loginTime(c.m)}\n`); return 0; }
    const u = c.session.stack[0] && c.session.stack[0].cred ? c.session.stack[0].cred.name : c.m.defaultUser;
    if (c.args.includes('am') || c.args.includes('-m')) { c.out(`${u.padEnd(8)} pts/0        ${loginTime(c.m)} (10.0.2.2)\n`); return 0; }
    c.out(`${u.padEnd(8)} pts/0        ${loginTime(c.m)} (10.0.2.2)\n`);
    (c.m.state.sshSessions || []).forEach((s, i) => c.out(`${s.padEnd(8)} pts/${i + 1}        ${loginTime(c.m)} (127.0.0.1)\n`));
    return 0;
  });
  def('users', async (c) => { c.out((c.session.stack[0] && c.session.stack[0].cred ? c.session.stack[0].cred.name : c.m.defaultUser) + '\n'); return 0; });

  function uptimeStr(m) {
    const s = Math.floor((m.now() - m.bootTime) / 1000);
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), mi = Math.floor((s % 3600) / 60);
    let u = '';
    if (d) u += `${d} day${d > 1 ? 's' : ''}, `;
    u += h ? `${String(h).padStart(2)}:${pad2(mi)}` : `${mi} min`;
    return u;
  }
  function nowClock(m) { const d = LX.localDate(m); return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`; }
  const loadStr = (m) => { const n = m.allProcs().filter((p) => !p.sys).length; const b = Math.min(0.5, n / 60); return `${(0.02 + b).toFixed(2)}, ${(0.01 + b / 2).toFixed(2)}, ${(0.0 + b / 4).toFixed(2)}`; };

  def('uptime', async (c) => {
    const s = Math.floor((c.m.now() - c.m.bootTime) / 1000);
    if (c.args.includes('-p') || c.args.includes('--pretty')) {
      const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), mi = Math.floor((s % 3600) / 60);
      const parts = [];
      if (d) parts.push(`${d} day${d > 1 ? 's' : ''}`);
      if (h) parts.push(`${h} hour${h > 1 ? 's' : ''}`);
      parts.push(`${mi} minute${mi === 1 ? '' : 's'}`);
      c.out('up ' + parts.join(', ') + '\n');
      return 0;
    }
    if (c.args.includes('-s') || c.args.includes('--since')) { const d = LX.localDate(c.m, c.m.bootTime); c.out(`${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}\n`); return 0; }
    c.out(` ${nowClock(c.m)} up ${uptimeStr(c.m)},  1 user,  load average: ${loadStr(c.m)}\n`);
    return 0;
  });

  def('w', async (c) => {
    const u = c.session.stack[0] && c.session.stack[0].cred ? c.session.stack[0].cred.name : c.m.defaultUser;
    c.out(` ${nowClock(c.m)} up ${uptimeStr(c.m)},  1 user,  load average: ${loadStr(c.m)}\nUSER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU  WHAT\n${u.padEnd(8)} pts/0    10.0.2.2         ${loginTime(c.m).slice(11)}    0.00s  0.05s  0.00s w\n`);
    return 0;
  });

  def('last', async (c) => {
    const u = c.m.defaultUser;
    const d = LX.localDate(c.m, c.m.bootTime);
    const ds = `${DAYS[d.getUTCDay()]} ${MON[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2)} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
    c.out(`${u.padEnd(8)} pts/0        10.0.2.2         ${ds}   still logged in\nreboot   system boot  ${LX.OS.kernel.padEnd(16)} ${ds}   still running\n${u.padEnd(8)} tty1                          Tue Sep 15 08:52 - 09:30  (00:38)\nreboot   system boot  ${LX.OS.kernel.padEnd(16)} Tue Sep 15 08:51 - 09:31  (00:39)\n\nwtmpdb begins Thu Sep  3 11:22:41 2026\n`);
    return 0;
  });

  // ======================================================================= su · sudo
  function sudoersAllows(m, user) {
    const cr = m.credFor(user);
    if (!cr) return null;
    if (cr.uid === 0) return { nopasswd: true, root: true, rules: [], match: () => ({ ok: true, nopasswd: true }) };
    let text = '';
    try { text = m.vfs.readFile('/etc/sudoers', null); } catch (e) { /* 없음 */ }
    try { for (const f of m.vfs.readdir('/etc/sudoers.d', null)) if (!/[.~]/.test(f)) { try { text += '\n' + m.vfs.readFile('/etc/sudoers.d/' + f, null); } catch (e) { /* 무시 */ } } } catch (e) { /* 없음 */ }
    // 규칙 목록: [{ runas, cmds: [{ cmd, nopasswd }] }] (나중 규칙이 우선)
    const rules = [];
    const aliases = {};
    text.replace(/\\\n/g, ' ').split('\n').forEach((line) => {
      line = line.replace(/#(?!\d).*/, '').trim();
      if (!line || /^(Defaults|@include)/.test(line)) return;
      const al = /^Cmnd_Alias\s+([A-Z][A-Z0-9_]*)\s*=\s*(.+)$/.exec(line);
      if (al) { aliases[al[1]] = al[2].split(',').map((s) => s.trim()).filter(Boolean); return; }
      if (/^\w+_Alias\s/.test(line)) return;
      const r = /^(%?[\w.-]+)\s+(\S+)\s*=\s*(\([^)]*\))?\s*(.+)$/.exec(line);
      if (!r) return;
      const who = r[1];
      const ok = who === 'ALL' || (who.startsWith('%') ? m.inGroup(user, who.slice(1)) : who === user);
      if (!ok) return;
      let nopw = false;
      const cmds = [];
      r[4].split(',').forEach((part) => {
        let s = part.trim();
        let t;
        while ((t = /^(NOPASSWD|PASSWD|NOEXEC|EXEC|SETENV|NOSETENV|LOG_INPUT|NOLOG_INPUT|LOG_OUTPUT|NOLOG_OUTPUT):\s*/.exec(s))) {
          if (t[1] === 'NOPASSWD') nopw = true;
          if (t[1] === 'PASSWD') nopw = false;
          s = s.slice(t[0].length);
        }
        if (!s) return;
        (aliases[s] || [s]).forEach((x) => cmds.push({ cmd: x, nopasswd: nopw }));
      });
      rules.push({ runas: r[3] || '(root)', cmds, text: r[4].trim() });
    });
    if (!rules.length) return null;
    const last = rules[rules.length - 1];
    return {
      rules,
      nopasswd: rules.every((x) => x.cmds.every((y) => y.nopasswd)),
      cmds: last.text, runas: last.runas,
      /** 명령(전체 경로 + 인수)을 target 사용자로 실행할 수 있는지 → { ok, nopasswd } */
      match(target, path, args) {
        let res = null;
        for (const rule of rules) {
          const ra = rule.runas.replace(/[()]/g, '').split(':')[0].split(',').map((s) => s.trim());
          if (!(ra.includes('ALL') || ra.includes(target) || (!ra[0] && target === 'root'))) continue;
          for (const cm of rule.cmds) {
            let neg = false;
            let spec = cm.cmd;
            if (spec.startsWith('!')) { neg = true; spec = spec.slice(1).trim(); }
            let hit = false;
            if (spec === 'ALL') hit = true;
            else {
              const sp = /^(\S+)(?:\s+([\s\S]*))?$/.exec(spec);
              const cp = sp[1];
              const pathOk = cp === path || (cp.endsWith('/') && path.startsWith(cp)) || (/[*?]/.test(cp) && LX.globMatch && LX.globMatch(cp, path));
              if (pathOk) {
                if (sp[2] == null) hit = true;
                else if (sp[2] === '""') hit = !args.length;
                else {
                  const want = sp[2].trim();
                  const got = args.join(' ');
                  hit = want === got || (/[*?]/.test(want) && new RegExp('^' + want.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$').test(got));
                }
              }
            }
            if (hit) res = neg ? { ok: false, nopasswd: false } : { ok: true, nopasswd: cm.nopasswd };
          }
        }
        return res || { ok: false, nopasswd: false };
      }
    };
  }
  LX.sudoersAllows = sudoersAllows;

  async function askPassword(c, user, prompt, tries = 3) {
    for (let i = 0; i < tries; i++) {
      const pw = await c.session.requestLine(prompt, { secret: true, password: c.m.defaultPassword });
      if (pw == null) return null;
      if (c.m.checkPassword(user, pw)) return true;
      if (i < tries - 1) c.err('Sorry, try again.\n');
    }
    return false;
  }
  LX.askPassword = askPassword;

  def(['sudo', 'sudoedit'], async (c) => {
    const args = c.args.slice();
    let target = 'root', login = false, shell = false, list = false, keepEnv = false, edit = c.name === 'sudoedit', listUser = null;
    while (args.length && args[0].startsWith('-')) {
      const a = args.shift();
      if (a === '--') break;
      if (a === '-u') target = args.shift();
      else if (/^-u.+/.test(a)) target = a.slice(2);
      else if (a === '-i' || a === '--login') login = true;
      else if (a === '-s' || a === '--shell') shell = true;
      else if (a === '-l' || a === '--list') list = true;
      else if (a === '-U') listUser = args.shift();
      else if (a === '-E' || a === '--preserve-env') keepEnv = true;
      else if (a === '-e' || a === '--edit') edit = true;
      else if (a === '-k' || a === '-K') { delete c.m.state.sudoTs[c.cred.name]; if (!args.length) return 0; }
      else if (a === '-v') { /* 갱신만 */ }
      else if (a === '-V' || a === '--version') { c.out('Sudo version 1.9.15p5\nSudoers policy plugin version 1.9.15p5\nSudoers file grammar version 50\nSudoers I/O plugin version 1.9.15p5\nSudoers audit plugin version 1.9.15p5\n'); return 0; }
      else if (a === '-h' || a === '--help') { c.out('sudo - execute a command as another user\n\nusage: sudo -h | -K | -k | -V\nusage: sudo -v [-ABkNnS] [-g group] [-h host] [-p prompt] [-u user]\nusage: sudo -l [-ABkNnS] [-g group] [-h host] [-p prompt] [-U user]\n            [-u user] [command [arg ...]]\nusage: sudo [-ABbEHkNnPS] [-r role] [-t type] [-C num] [-D directory]\n            [-g group] [-h host] [-p prompt] [-R directory] [-T timeout]\n            [-u user] [VAR=value] [-i | -s] [command [arg ...]]\n'); return 0; }
    }
    const me = c.cred.name;
    const host = c.m.hostname();
    if (!new RegExp('\\b' + host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(c.fs.readFile('/etc/hosts', null)) && host !== 'localhost') {
      c.err(`sudo: unable to resolve host ${host}: Name or service not known\n`);
    }
    if (!args.length && !login && !shell && !list && c.args.every((a) => a === '-v' || a === '-k')) {
      if (!c.args.includes('-v')) { c.err('usage: sudo -h | -K | -k | -V\nusage: sudo -v [-ABkNnS] [-g group] [-h host] [-p prompt] [-u user]\nusage: sudo -l [-ABkNnS] [-g group] [-h host] [-p prompt] [-U user] [-u user] [command [arg ...]]\nusage: sudo [-ABbEHkNnPS] [-r role] [-t type] [-C num] [-D directory] [-g group] [-h host] [-p prompt] [-R directory] [-T timeout] [-u user] [VAR=value] [-i | -s] [command [arg ...]]\nusage: sudo -e [-ABkNnS] [-r role] [-t type] [-C num] [-D directory] [-g group] [-h host] [-p prompt] [-R directory] [-T timeout] [-u user] file ...\n'); return 1; }
    }
    const perm = sudoersAllows(c.m, me);
    const cmdText = args.join(' ');
    const logAuth = (msg) => LX.log(c.m, 'sudo', msg, '/var/log/auth.log');
    if (!perm) {
      // 비밀번호를 먼저 묻고 거부한다 (실제 동작)
      const ok = await askPassword(c, me, `[sudo] password for ${me}: `);
      if (ok === null) { c.err('sudo: a password is required\n'); return 1; }
      if (ok === false) { c.err('sudo: 3 incorrect password attempts\n'); return 1; }
      c.err(`${me} is not in the sudoers file.\n`);
      logAuth(`${me} : user NOT in sudoers ; TTY=pts/0 ; PWD=${c.cwd} ; USER=root ; COMMAND=${cmdText}`);
      return 1;
    }
    // 실행할 명령이 규칙에 맞는지 (전체 경로로 비교)
    const SECURE = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin';
    let runArgv = args.slice();
    while (runArgv.length && /^[A-Za-z_]\w*=/.test(runArgv[0])) runArgv.shift();
    let fullPath = null;
    let want;
    if (list) want = { ok: true, nopasswd: perm.nopasswd };
    else if (edit) want = perm.match(target, 'sudoedit', args.map((f) => c.resolve(f)));
    else if (!runArgv.length) want = perm.match(target, (c.m.credFor(target) || {}).shell || '/bin/bash', []);
    else {
      fullPath = runArgv[0].includes('/') ? c.resolve(runArgv[0]) : c.m.findInPath(runArgv[0], SECURE);
      want = fullPath ? perm.match(target, fullPath, runArgv.slice(1)) : perm.match(target, runArgv[0], []);
      if (fullPath && !want.ok && fullPath.startsWith('/usr/bin/')) {
        // /bin → /usr/bin 병합: 규칙이 /bin/xxx 로 적혀 있어도 허용
        const alt = perm.match(target, fullPath.replace('/usr/bin/', '/bin/'), runArgv.slice(1));
        if (alt.ok) want = alt;
      }
      if (fullPath && !want.ok && fullPath.startsWith('/usr/sbin/')) {
        const alt = perm.match(target, fullPath.replace('/usr/sbin/', '/sbin/'), runArgv.slice(1));
        if (alt.ok) want = alt;
      }
    }
    const shownCmd = fullPath ? [fullPath, ...runArgv.slice(1)].join(' ') : cmdText;
    const ts = c.m.state.sudoTs[me];
    const needPw = want.ok ? !want.nopasswd : !perm.nopasswd;
    if (c.cred.uid !== 0 && needPw && !(ts && c.m.now() - ts < 15 * 60000)) {
      const ok = await askPassword(c, me, `[sudo] password for ${me}: `);
      if (ok === null) { c.err('sudo: a password is required\n'); return 1; }
      if (ok === false) {
        c.err('sudo: 3 incorrect password attempts\n');
        logAuth(`${me} : 3 incorrect password attempts ; TTY=pts/0 ; PWD=${c.cwd} ; USER=root ; COMMAND=${cmdText}`);
        return 1;
      }
    }
    c.m.state.sudoTs[me] = c.m.now();
    if (list) {
      const lu = listUser || me;
      if (listUser && listUser !== me && c.cred.uid !== 0 && !(perm.match('root', '/usr/bin/sudo', []).ok || perm.rules.some((r) => r.cmds.some((x) => x.cmd === 'ALL')))) {
        c.err(`Sorry, user ${me} is not allowed to execute 'list' as ${lu} on ${host}.\n`);
        return 1;
      }
      const lp = listUser ? sudoersAllows(c.m, lu) : perm;
      if (!lp || !lp.rules.length && !lp.root) { c.out(`User ${lu} is not allowed to run sudo on ${host}.\n`); return listUser ? 0 : 1; }
      const fmtRa = (ra) => { const s = ra.replace(/[()]/g, '').split(':').map((x) => x.trim()); return `(${s.join(' : ')})`; };
      const lines = lp.root ? ['    (ALL : ALL) ALL'] : lp.rules.map((r) => `    ${fmtRa(r.runas)} ${r.text.replace(/\s*,\s*/g, ', ')}`);
      c.out(`Matching Defaults entries for ${lu} on ${host}:\n    env_reset, mail_badpass, secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin\\:/sbin\\:/bin\\:/snap/bin, use_pty\n\nUser ${lu} may run the following commands on ${host}:\n${lines.join('\n')}\n`);
      return 0;
    }
    const tcred = c.m.credFor(target);
    if (!tcred) { c.err(`sudo: unknown user ${target}\nsudo: error initializing audit plugin sudoers_audit\n`); return 1; }
    if (!want.ok) {
      c.err(`Sorry, user ${me} is not allowed to execute '${(login || shell) && !args.length ? (tcred.shell || '/bin/bash') : shownCmd}' as ${target} on ${host}.\n`);
      logAuth(`${me} : command not allowed ; TTY=pts/0 ; PWD=${c.cwd} ; USER=${target} ; COMMAND=${shownCmd}`);
      return 1;
    }
    logAuth(`${me} : TTY=pts/0 ; PWD=${c.cwd} ; USER=${target} ; COMMAND=${login ? '/bin/bash' : shell ? '/bin/bash' : shownCmd}`);
    // 대화형 셸
    if ((login || shell) && !args.length) {
      if (!canPush(c)) { c.err('sudo: (가상 터미널) 스크립트 안에서는 대화형 셸을 열 수 없습니다\n'); return 1; }
      await c.session.pushShell(target, { login, keepEnv: !login });
      return 0;
    }
    // 명령 실행
    const child = c.sh.child('script');
    child.user = target;
    child.cred = tcred;
    child.umask = 0o022;
    const keep = keepEnv ? child.vars : {};
    child.vars = {};
    child.initVars();
    if (keepEnv) Object.keys(keep).forEach((k) => { if (!['HOME', 'USER', 'LOGNAME', 'PATH'].includes(k)) child.vars[k] = keep[k]; });
    child.vars.PATH = { v: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin', x: true };
    child.vars.SUDO_USER = { v: me, x: true };
    child.vars.SUDO_UID = { v: String(c.cred.uid), x: true };
    child.vars.SUDO_COMMAND = { v: cmdText, x: true };
    child.cwd = c.cwd;
    if (edit) {
      for (const f of args) await LX.editFile(c, c.resolve(f), tcred);
      return 0;
    }
    child.interactive = c.sh.interactive;
    child.depth = c.sh.depth;
    child.sudoParent = c.sh;
    let argv = args;
    // 환경 변수 대입 (sudo VAR=x cmd)
    while (argv.length && /^[A-Za-z_]\w*=/.test(argv[0])) { const [k, v] = argv[0].split(/=(.*)/s); child.vars[k] = { v, x: true }; argv = argv.slice(1); }
    if (!argv.length) return 0;
    if (LX.BUILTINS[argv[0]] && !LX.commands[argv[0]]) {
      c.err(`sudo: ${argv[0]}: command not found\n`);
      return 1;
    }
    const st = await c.m.execFile(child, argv, c.io);
    if (st === 127 && !argv[0].includes('/') && !c.m.findInPath(argv[0], child.getVar('PATH'))) {
      // execFile 이 이미 메시지를 출력함
    }
    return st;
  });

  function canPush(c) {
    const top = c.session.top;
    let sh = c.sh;
    while (sh && sh.sudoParent) sh = sh.sudoParent;
    return !c.session.headless ? (sh === top || c.sh === top) && top.interactive : (sh === top || c.sh === top);
  }
  LX.canPush = canPush;

  def('su', async (c) => {
    const args = c.args.slice();
    let login = false, cmd = null, shellOpt = null;
    const ops = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-' || a === '-l' || a === '--login') login = true;
      else if (a === '-c' || a === '--command') cmd = args[++i];
      else if (a === '-s' || a === '--shell') shellOpt = args[++i];
      else if (a === '-h' || a === '--help') { c.out('\nUsage:\n su [options] [-] [<user> [<argument>...]]\n\nChange the effective user ID and group ID to that of <user>.\nA mere - implies -l.  If <user> is not given, root is assumed.\n'); return 0; }
      else ops.push(a);
    }
    void shellOpt;
    const target = ops[0] || 'root';
    const tcred = c.m.credFor(target);
    if (!tcred) { c.err(`su: user ${target} does not exist or the user entry does not contain all the required fields\n`); return 1; }
    if (c.cred.uid !== 0) {
      const pw = await c.session.requestLine('Password: ', { secret: true, password: target === 'root' ? '__locked__' : c.m.defaultPassword });
      if (pw == null) { c.err('su: Authentication failure\n'); return 1; }
      if (!c.m.checkPassword(target, pw)) {
        await c.sleep(c.session.headless ? 0 : 1500);
        c.err('su: Authentication failure\n');
        LX.log(c.m, 'su', `(to ${target}) ${c.cred.name} on pts/0 FAILED SU`, '/var/log/auth.log');
        return 1;
      }
    }
    const shellPath = c.m.passwd().find((u) => u.name === target).shell;
    if (/nologin|false$/.test(shellPath)) { c.out('This account is currently not available.\n'); return 1; }
    LX.log(c.m, 'su', `(to ${target}) ${c.cred.name} on pts/0`, '/var/log/auth.log');
    if (cmd != null) {
      const child = c.sh.child('script');
      child.user = target; child.cred = tcred; child.vars = {}; child.initVars();
      if (!login) child.cwd = c.cwd;
      child.name0 = 'bash';
      return child.runSource(cmd, c.io);
    }
    if (!canPush(c)) { c.err('su: (가상 터미널) 스크립트 안에서는 다른 사용자의 대화형 셸을 열 수 없습니다. su -c "명령" 을 사용하세요\n'); return 1; }
    await c.session.pushShell(target, { login, keepEnv: !login });
    return 0;
  });

  def('newgrp', async (c) => {
    if (!canPush(c)) return 1;
    await c.session.pushShell(c.cred.name, { login: false, keepEnv: true });
    return 0;
  });

  // ======================================================================= 사용자 관리
  function writeLines(m, file, lines) { m.vfs.writeFile(file, lines.filter((l) => l !== null).join('\n') + '\n', null); }
  function fileLines(m, file) { try { return m.vfs.readFile(file, null).split('\n').filter(Boolean); } catch (e) { return []; } }
  function nextId(list, min, max = 59999) { let id = min; const used = new Set(list); while (used.has(id) && id < max) id++; return id; }
  function lockMsg(c, cmd) { c.err(`${cmd}: Permission denied.\n${cmd}: cannot lock /etc/passwd; try again later.\n`); return 1; }
  function copySkel(m, home, uid, gid) {
    m.vfs.mkdir(home, null, { parents: true });
    const hn = m.vfs.lookup(home);
    hn.m = 0o750; hn.u = uid; hn.g = gid;
    for (const f of m.vfs.readdir('/etc/skel', null)) {
      const src = m.vfs.lookup('/etc/skel/' + f);
      const cp = m.vfs.clone(src);
      cp.u = uid; cp.g = gid;
      hn.k[f] = cp;
    }
    m.vfs.touchChanged();
  }
  function addToGroup(m, group, user) {
    writeLines(m, '/etc/group', fileLines(m, '/etc/group').map((l) => {
      const f = l.split(':');
      if (f[0] !== group) return l;
      const mem = (f[3] || '').split(',').filter(Boolean);
      if (!mem.includes(user)) mem.push(user);
      f[3] = mem.join(',');
      return f.join(':');
    }));
  }
  function removeFromGroup(m, group, user) {
    writeLines(m, '/etc/group', fileLines(m, '/etc/group').map((l) => {
      const f = l.split(':');
      if (group && f[0] !== group) return l;
      f[3] = (f[3] || '').split(',').filter((x) => x && x !== user).join(',');
      return f.join(':');
    }));
  }
  LX.addToGroup = addToGroup;

  function createUser(c, name, o) {
    const m = c.m;
    const users = m.passwd();
    if (users.some((u) => u.name === name)) return `user '${name}' already exists`;
    if (!/^[a-z_][a-z0-9_-]*\$?$/.test(name)) return `invalid user name '${name}': use --badname to ignore`;
    const uid = o.uid != null ? +o.uid : nextId(users.map((u) => u.uid), o.system ? 100 : 1000, o.system ? 999 : 59999);
    let gid;
    if (o.group) {
      const g = m.groups().find((x) => x.name === o.group || String(x.gid) === String(o.group));
      if (!g) return `group '${o.group}' does not exist`;
      gid = g.gid;
    } else if (o.noUserGroup) gid = 100;
    else {
      const gs = m.groups();
      gid = gs.some((g) => g.gid === uid) ? nextId(gs.map((g) => g.gid), o.system ? 100 : 1000) : uid;
      m.vfs.writeFile('/etc/group', `${name}:x:${gid}:\n`, null, { append: true });
      m.vfs.writeFile('/etc/gshadow', `${name}:!::\n`, null, { append: true });
    }
    const home = o.home || (o.system ? '/nonexistent' : `/home/${name}`);
    m.vfs.writeFile('/etc/passwd', `${name}:x:${uid}:${gid}:${o.comment || ''}:${home}:${o.shell || '/bin/sh'}\n`, null, { append: true });
    m.vfs.writeFile('/etc/shadow', `${name}:!:${Math.floor(m.now() / 86400000)}:0:99999:7:::\n`, null, { append: true });
    (o.groups || []).forEach((g) => addToGroup(m, g, name));
    if (o.createHome) copySkel(m, home, uid, gid);
    LX.log(m, 'useradd[' + m.nextPid() + ']', `new user: name=${name}, UID=${uid}, GID=${gid}, home=${home}, shell=${o.shell || '/bin/sh'}, from=/dev/pts/0`, '/var/log/auth.log');
    return { uid, gid, home };
  }

  def('useradd', async (c) => {
    const { f, ops } = getopt(c.args, 'md:s:g:G:c:u:rMNe:p:k:D', { 'create-home': 'm', home: 'd:', 'home-dir': 'd:', shell: 's:', gid: 'g:', groups: 'G:', comment: 'c:', uid: 'u:', system: 'r', 'no-create-home': 'M', 'no-user-group': 'N', expiredate: 'e:', password: 'p:' });
    if (f.D) { c.out('GROUP=100\nHOME=/home\nINACTIVE=-1\nEXPIRE=\nSHELL=/bin/sh\nSKEL=/etc/skel\nCREATE_MAIL_SPOOL=no\nLOG_INIT=yes\n'); return 0; }
    if (!ops.length) { c.err('Usage: useradd [options] LOGIN\n       useradd -D\n       useradd -D [options]\n'); return 2; }
    if (c.cred.uid !== 0) return lockMsg(c, 'useradd');
    const groups = f.G ? f.G.split(',') : [];
    for (const g of groups) if (!c.m.groups().some((x) => x.name === g)) { c.err(`useradd: group '${g}' does not exist\n`); return 6; }
    const r = createUser(c, ops[0], { createHome: !!f.m && !f.M, home: f.d, shell: f.s, group: f.g, groups, comment: f.c, uid: f.u, system: !!f.r, noUserGroup: !!f.N });
    if (typeof r === 'string') { c.err(`useradd: ${r}\n`); return 9; }
    return 0;
  });

  def('adduser', async (c) => {
    const { f, ops } = getopt(c.args, 'q', { 'disabled-password': 'nopw', 'disabled-login': 'nologin', gecos: 'gecos:', comment: 'gecos:', shell: 'shell:', home: 'home:', uid: 'uid:', gid: 'gid:', ingroup: 'ingroup:', system: 'system', group: 'group', quiet: 'q' });
    if (c.cred.uid !== 0) { c.err('fatal: Only root may add a user or group to the system.\n'); return 1; }
    if (ops.length === 2) {
      // adduser USER GROUP
      const [u, g] = ops;
      if (!c.m.credFor(u)) { c.err(`fatal: The user \`${u}' does not exist.\n`); return 1; }
      if (!c.m.groups().some((x) => x.name === g)) { c.err(`fatal: The group \`${g}' does not exist.\n`); return 1; }
      if (c.m.inGroup(u, g)) { c.out(`info: The user \`${u}' is already a member of \`${g}'.\n`); return 0; }
      c.out(`info: Adding user \`${u}' to group \`${g}' ...\n`);
      addToGroup(c.m, g, u);
      return 0;
    }
    if (f.group || c.name === 'addgroup') return LX.commands.groupadd(c);
    const name = ops[0];
    if (!name) { c.err('fatal: Only one or two names allowed.\n'); return 1; }
    if (c.m.credFor(name)) { c.err(`fatal: The user \`${name}' already exists.\n`); return 1; }
    if (!/^[a-z][-a-z0-9_]*$/.test(name)) { c.err(`fatal: Please enter a username matching the regular expression\nconfigured via the NAME_REGEX configuration variable.  Use the \`--allow-bad-names' option to relax this check or reconfigure NAME_REGEX\nin configuration.\n`); return 1; }
    const q = !!f.q;
    const say = (s) => { if (!q) c.out(s); };
    say(`info: Adding user \`${name}' ...\ninfo: Selecting UID/GID from range 1000 to 59999 ...\n`);
    const r = createUser(c, name, { createHome: false, home: f.home, shell: f.shell || '/bin/bash', group: f.ingroup, comment: f.gecos || '', uid: f.uid, system: !!f.system });
    if (typeof r === 'string') { c.err(`fatal: ${r}\n`); return 1; }
    if (!f.ingroup) say(`info: Adding new group \`${name}' (${r.gid}) ...\n`);
    say(`info: Adding new user \`${name}' (${r.uid}) with group \`${f.ingroup || name} (${r.gid})' ...\ninfo: Creating home directory \`${r.home}' ...\ninfo: Copying files from \`/etc/skel' ...\n`);
    copySkel(c.m, r.home, r.uid, r.gid);
    if (!f.nopw && !f.nologin) {
      for (let tries = 0; tries < 3; tries++) {
        const p1 = await c.session.requestLine('New password: ', { secret: true });
        if (p1 == null) break;
        const p2 = await c.session.requestLine('Retype new password: ', { secret: true });
        if (p1 !== p2) { c.err('Sorry, passwords do not match.\npasswd: Authentication token manipulation error\npasswd: password unchanged\nTry again? [y/N] '); const a = await c.session.requestLine('', {}); if (!/^y/i.test(a || '')) break; continue; }
        if (!p1) { c.err('No password has been supplied.\n'); continue; }
        if (p1.length < 8) c.err('BAD PASSWORD: The password is shorter than 8 characters\n');
        c.m.setPassword(name, p1);
        c.out('passwd: password updated successfully\n');
        break;
      }
    }
    if (f.gecos == null) {
      c.out(`Changing the user information for ${name}\nEnter the new value, or press ENTER for the default\n`);
      const full = await c.session.requestLine('\tFull Name []: ', {});
      for (const k of ['Room Number', 'Work Phone', 'Home Phone', 'Other']) await c.session.requestLine(`\t${k} []: `, {});
      const ok = await c.session.requestLine('Is the information correct? [Y/n] ', {});
      void ok;
      if (full) writeLines(c.m, '/etc/passwd', fileLines(c.m, '/etc/passwd').map((l) => { const x = l.split(':'); if (x[0] === name) x[4] = full + ',,,'; return x.join(':'); }));
    }
    if (!f.ingroup && !f.system) {
      say(`info: Adding new user \`${name}' to supplemental / extra groups \`users' ...\ninfo: Adding user \`${name}' to group \`users' ...\n`);
      addToGroup(c.m, 'users', name);
    }
    return 0;
  });

  def('usermod', async (c) => {
    const { f, ops } = getopt(c.args, 'aG:g:s:d:ml:LUc:e:u:p:', { append: 'a', groups: 'G:', gid: 'g:', shell: 's:', home: 'd:', 'move-home': 'm', login: 'l:', lock: 'L', unlock: 'U', comment: 'c:', expiredate: 'e:', uid: 'u:' });
    const name = ops[0];
    if (!name) { c.err('Usage: usermod [options] LOGIN\n'); return 2; }
    if (c.cred.uid !== 0) return lockMsg(c, 'usermod');
    if (!c.m.credFor(name)) { c.err(`usermod: user '${name}' does not exist\n`); return 6; }
    if (f.G) {
      const gs = f.G.split(',');
      for (const g of gs) if (!c.m.groups().some((x) => x.name === g)) { c.err(`usermod: group '${g}' does not exist\n`); return 6; }
      if (!f.a) removeFromGroup(c.m, null, name);
      gs.forEach((g) => addToGroup(c.m, g, name));
    }
    if (f.L) c.m.setPassword(name, null, 'lock');
    if (f.U) c.m.setPassword(name, null, 'unlock');
    let newName = name;
    writeLines(c.m, '/etc/passwd', fileLines(c.m, '/etc/passwd').map((l) => {
      const x = l.split(':');
      if (x[0] !== name) return l;
      if (f.s) x[6] = f.s;
      if (f.c) x[4] = f.c;
      if (f.u) x[2] = f.u;
      if (f.g) { const g = c.m.groups().find((y) => y.name === f.g || String(y.gid) === f.g); if (g) x[3] = String(g.gid); }
      if (f.d) {
        if (f.m) { try { c.fs.rename(x[5], f.d, null); } catch (e) { /* 무시 */ } }
        x[5] = f.d;
      }
      if (f.l) { x[0] = f.l; newName = f.l; }
      return x.join(':');
    }));
    if (f.l) {
      writeLines(c.m, '/etc/shadow', fileLines(c.m, '/etc/shadow').map((l) => (l.startsWith(name + ':') ? f.l + l.slice(name.length) : l)));
      writeLines(c.m, '/etc/group', fileLines(c.m, '/etc/group').map((l) => { const x = l.split(':'); x[3] = (x[3] || '').split(',').map((u) => (u === name ? newName : u)).join(','); return x.join(':'); }));
    }
    return 0;
  });

  def(['userdel', 'deluser'], async (c) => {
    const { f, ops } = getopt(c.args, 'rf', { remove: 'r', 'remove-home': 'r', force: 'f', 'remove-all-files': 'r' });
    const deb = c.name === 'deluser';
    const name = ops[0];
    if (!name) { c.err(deb ? 'fatal: Only one or two names allowed.\n' : 'Usage: userdel [options] LOGIN\n'); return 2; }
    if (c.cred.uid !== 0) { if (deb) { c.err('fatal: Only root may remove a user or group from the system.\n'); return 1; } return lockMsg(c, 'userdel'); }
    if (deb && ops[1]) {
      if (!c.m.inGroup(name, ops[1])) { c.err(`fatal: The user \`${name}' is not a member of group \`${ops[1]}'.\n`); return 6; }
      c.out(`info: Removing user \`${name}' from group \`${ops[1]}' ...\n`);
      removeFromGroup(c.m, ops[1], name);
      return 0;
    }
    const u = c.m.passwd().find((x) => x.name === name);
    if (!u) { c.err(deb ? `fatal: The user \`${name}' does not exist.\n` : `userdel: user '${name}' does not exist\n`); return 6; }
    if (c.session.stack.some((s) => s.cred && s.cred.name === name) && !f.f) { c.err(`userdel: user ${name} is currently used by process ${c.session.shellPid}\n`); return 8; }
    if (deb) c.out(`info: Looking for files to backup/remove ...\n${f.r ? `info: Removing files ...\n` : ''}info: Removing crontab ...\ninfo: Removing user \`${name}' ...\n`);
    writeLines(c.m, '/etc/passwd', fileLines(c.m, '/etc/passwd').filter((l) => !l.startsWith(name + ':')));
    writeLines(c.m, '/etc/shadow', fileLines(c.m, '/etc/shadow').filter((l) => !l.startsWith(name + ':')));
    removeFromGroup(c.m, null, name);
    // 개인 그룹 삭제
    const g = c.m.groups().find((x) => x.name === name);
    if (g && !g.members.length && !c.m.passwd().some((x) => x.gid === g.gid)) {
      writeLines(c.m, '/etc/group', fileLines(c.m, '/etc/group').filter((l) => !l.startsWith(name + ':')));
      writeLines(c.m, '/etc/gshadow', fileLines(c.m, '/etc/gshadow').filter((l) => !l.startsWith(name + ':')));
    }
    try { c.fs.unlink('/var/spool/cron/crontabs/' + name, null); } catch (e) { /* 없음 */ }
    if (f.r && u.home.startsWith('/home/')) {
      try { c.fs.remove(u.home, null); } catch (e) { c.err(`userdel: ${u.home} not found\n`); }
      if (!deb) c.err(`userdel: ${name} mail spool (/var/mail/${name}) not found\n`);
    }
    return 0;
  });

  def(['groupadd', 'addgroup'], async (c) => {
    const { f, ops } = getopt(c.args, 'g:rf', { gid: 'g:', system: 'r', force: 'f' });
    const name = ops[0];
    if (!name) { c.err('Usage: groupadd [options] GROUP\n'); return 2; }
    if (c.cred.uid !== 0) { c.err(`${c.name}: Permission denied.\n${c.name}: cannot lock /etc/group; try again later.\n`); return 10; }
    if (c.m.groups().some((g) => g.name === name)) { if (f.f) return 0; c.err(c.name === 'addgroup' ? `fatal: The group \`${name}' already exists.\n` : `groupadd: group '${name}' already exists\n`); return 9; }
    const gid = f.g ? +f.g : nextId(c.m.groups().map((g) => g.gid), f.r ? 100 : 1000, f.r ? 999 : 59999);
    c.fs.writeFile('/etc/group', `${name}:x:${gid}:\n`, null, { append: true });
    c.fs.writeFile('/etc/gshadow', `${name}:!::\n`, null, { append: true });
    if (c.name === 'addgroup') c.out(`info: Selecting GID from range 1000 to 59999 ...\ninfo: Adding group \`${name}' (GID ${gid}) ...\n`);
    return 0;
  });

  def(['groupdel', 'delgroup'], async (c) => {
    const name = c.args.filter((a) => !a.startsWith('-'))[0];
    if (c.cred.uid !== 0) { c.err(`${c.name}: Permission denied.\n${c.name}: cannot lock /etc/group; try again later.\n`); return 10; }
    const g = c.m.groups().find((x) => x.name === name);
    if (!g) { c.err(`groupdel: group '${name}' does not exist\n`); return 6; }
    const prim = c.m.passwd().find((u) => u.gid === g.gid);
    if (prim) { c.err(`groupdel: cannot remove the primary group of user '${prim.name}'\n`); return 8; }
    writeLines(c.m, '/etc/group', fileLines(c.m, '/etc/group').filter((l) => !l.startsWith(name + ':')));
    writeLines(c.m, '/etc/gshadow', fileLines(c.m, '/etc/gshadow').filter((l) => !l.startsWith(name + ':')));
    if (c.name === 'delgroup') c.out(`info: Removing group \`${name}' ...\n`);
    return 0;
  });

  def('groupmod', async (c) => {
    const { f, ops } = getopt(c.args, 'n:g:', { 'new-name': 'n:', gid: 'g:' });
    if (c.cred.uid !== 0) { c.err('groupmod: Permission denied.\ngroupmod: cannot lock /etc/group; try again later.\n'); return 10; }
    const name = ops[0];
    if (!c.m.groups().some((g) => g.name === name)) { c.err(`groupmod: group '${name}' does not exist\n`); return 6; }
    writeLines(c.m, '/etc/group', fileLines(c.m, '/etc/group').map((l) => { const x = l.split(':'); if (x[0] === name) { if (f.n) x[0] = f.n; if (f.g) x[2] = f.g; } return x.join(':'); }));
    return 0;
  });

  def('gpasswd', async (c) => {
    const { f, ops } = getopt(c.args, 'a:d:M:', { add: 'a:', delete: 'd:', members: 'M:' });
    const group = ops[0];
    if (!group) { c.err('Usage: gpasswd [option] GROUP\n'); return 2; }
    if (c.cred.uid !== 0) { c.err('gpasswd: Permission denied.\n'); return 1; }
    if (!c.m.groups().some((g) => g.name === group)) { c.err(`gpasswd: group '${group}' does not exist in /etc/group\n`); return 3; }
    if (f.a) {
      if (!c.m.credFor(f.a)) { c.err(`gpasswd: user '${f.a}' does not exist\n`); return 3; }
      c.out(`Adding user ${f.a} to group ${group}\n`);
      addToGroup(c.m, group, f.a);
    } else if (f.d) {
      if (!c.m.inGroup(f.d, group)) { c.err(`gpasswd: user '${f.d}' is not a member of '${group}'\n`); return 3; }
      c.out(`Removing user ${f.d} from group ${group}\n`);
      removeFromGroup(c.m, group, f.d);
    } else if (f.M) {
      writeLines(c.m, '/etc/group', fileLines(c.m, '/etc/group').map((l) => { const x = l.split(':'); if (x[0] === group) x[3] = f.M; return x.join(':'); }));
    }
    return 0;
  });

  def('passwd', async (c) => {
    const { f, ops } = getopt(c.args, 'lSudeaxn:', { lock: 'l', status: 'S', unlock: 'u', delete: 'd', expire: 'e', all: 'a' });
    const target = ops[0] || c.cred.name;
    if (target !== c.cred.name && c.cred.uid !== 0) { c.err(`passwd: You may not view or modify password information for ${target}.\n`); return 1; }
    if (!c.m.credFor(target)) { c.err(`passwd: user '${target}' does not exist\n`); return 1; }
    const sh = c.m.shadow().find((x) => x.name === target);
    if (f.S) {
      const h = sh ? sh.f[1] : '';
      const st = h.startsWith('!') ? 'L' : h === '' ? 'NP' : h === '*' ? 'L' : 'P';
      const d = new Date(+(sh ? sh.f[2] : 0) * 86400000);
      c.out(`${target} ${st} ${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${sh ? sh.f[3] || 0 : 0} ${sh ? sh.f[4] || 99999 : 99999} ${sh ? sh.f[5] || 7 : 7} -1\n`);
      return 0;
    }
    if (f.l || f.u || f.d || f.e) {
      if (c.cred.uid !== 0) { c.err('passwd: Permission denied.\n'); return 1; }
      if (f.l) { c.m.setPassword(target, null, 'lock'); c.out('passwd: password changed.\n'); }
      if (f.u) { c.m.setPassword(target, null, 'unlock'); c.out('passwd: password changed.\n'); }
      if (f.d) { writeLines(c.m, '/etc/shadow', fileLines(c.m, '/etc/shadow').map((l) => { const x = l.split(':'); if (x[0] === target) x[1] = ''; return x.join(':'); })); c.out('passwd: password changed.\n'); }
      if (f.e) { writeLines(c.m, '/etc/shadow', fileLines(c.m, '/etc/shadow').map((l) => { const x = l.split(':'); if (x[0] === target) x[2] = '0'; return x.join(':'); })); c.out('passwd: password changed.\n'); }
      return 0;
    }
    if (c.cred.uid !== 0) {
      c.out(`Changing password for ${target}.\n`);
      const cur = await c.session.requestLine('Current password: ', { secret: true });
      if (cur == null || !c.m.checkPassword(target, cur)) { await c.sleep(c.session.headless ? 0 : 1500); c.err('passwd: Authentication token manipulation error\npasswd: password unchanged\n'); return 10; }
    }
    for (let tries = 0; tries < 3; tries++) {
      const p1 = await c.session.requestLine('New password: ', { secret: true });
      if (p1 == null) { c.err('passwd: Authentication token manipulation error\npasswd: password unchanged\n'); return 10; }
      if (c.cred.uid !== 0 && p1.length < 8) { c.err('BAD PASSWORD: The password is shorter than 8 characters\n'); continue; }
      if (c.cred.uid === 0 && p1.length < 8) c.err('BAD PASSWORD: The password is shorter than 8 characters\n');
      const p2 = await c.session.requestLine('Retype new password: ', { secret: true });
      if (p1 !== p2) { c.err('Sorry, passwords do not match.\n'); continue; }
      c.m.setPassword(target, p1);
      c.out('passwd: password updated successfully\n');
      return 0;
    }
    c.err('passwd: Have exhausted maximum number of retries for service\npasswd: password unchanged\n');
    return 10;
  });

  def('chpasswd', async (c) => {
    if (c.cred.uid !== 0) { c.err('chpasswd: Permission denied.\nchpasswd: cannot lock /etc/passwd; try again later.\n'); return 1; }
    const t = await c.readStdin();
    let st = 0;
    t.split('\n').filter(Boolean).forEach((l, i) => {
      const [u, p] = l.split(/:(.*)/s);
      if (!c.m.credFor(u)) { c.err(`chpasswd: (user ${u}) pam_chauthtok() failed, error:\nAuthentication token manipulation error\nchpasswd: (line ${i + 1}, user ${u}) password not changed\n`); st = 1; return; }
      c.m.setPassword(u, p);
    });
    return st;
  });

  def('chage', async (c) => {
    const { f, ops } = getopt(c.args, 'lM:m:W:E:d:I:', { list: 'l', maxdays: 'M:', mindays: 'm:', warndays: 'W:', expiredate: 'E:', lastday: 'd:' });
    const u = ops[0];
    if (!u) { c.err('Usage: chage [options] LOGIN\n'); return 2; }
    if (c.cred.uid !== 0 && !(f.l && u === c.cred.name)) { c.err('chage: Permission denied.\n'); return 1; }
    const s = c.m.shadow().find((x) => x.name === u);
    if (!s) { c.err(`chage: user '${u}' does not exist in /etc/passwd\n`); return 1; }
    const fmtDay = (d) => { if (d === '' || d == null || d === '-1') return 'never'; const x = new Date(+d * 86400000); return `${MON[x.getUTCMonth()]} ${pad2(x.getUTCDate())}, ${x.getUTCFullYear()}`; };
    if (f.l || !Object.keys(f).length) {
      const x = s.f;
      c.out(`Last password change\t\t\t\t\t: ${x[2] === '0' ? 'password must be changed' : fmtDay(x[2])}\nPassword expires\t\t\t\t\t: ${x[4] && x[4] !== '99999' ? fmtDay(+x[2] + +x[4]) : 'never'}\nPassword inactive\t\t\t\t\t: never\nAccount expires\t\t\t\t\t\t: ${fmtDay(x[7])}\nMinimum number of days between password change\t\t: ${x[3] || 0}\nMaximum number of days between password change\t\t: ${x[4] || 99999}\nNumber of days of warning before password expires\t: ${x[5] || 7}\n`);
      return 0;
    }
    writeLines(c.m, '/etc/shadow', fileLines(c.m, '/etc/shadow').map((l) => {
      const x = l.split(':');
      if (x[0] !== u) return l;
      while (x.length < 9) x.push('');
      if (f.M != null) x[4] = f.M;
      if (f.m != null) x[3] = f.m;
      if (f.W != null) x[5] = f.W;
      if (f.d != null) x[2] = f.d;
      if (f.E != null) x[7] = f.E === '-1' ? '' : String(Math.floor(Date.parse(f.E) / 86400000));
      return x.join(':');
    }));
    return 0;
  });

  def(['chsh', 'chfn'], async (c) => {
    const { f, ops } = getopt(c.args, 's:f:', { shell: 's:' });
    const u = ops[0] || c.cred.name;
    if (c.cred.uid !== 0) {
      const pw = await c.session.requestLine('Password: ', { secret: true });
      if (!c.m.checkPassword(c.cred.name, pw || '')) { c.err(`${c.name}: PAM: Authentication failure\n`); return 1; }
    }
    if (c.name === 'chsh') {
      let sh = f.s;
      if (!sh) { c.out(`Changing the login shell for ${u}\nEnter the new value, or press ENTER for the default\n`); sh = await c.session.requestLine(`\tLogin Shell [/bin/bash]: `, {}); if (!sh) return 0; }
      if (!c.fs.readFile('/etc/shells', null).split('\n').includes(sh)) { c.err(`chsh: ${sh} is an invalid shell\n`); return 1; }
      writeLines(c.m, '/etc/passwd', fileLines(c.m, '/etc/passwd').map((l) => { const x = l.split(':'); if (x[0] === u) x[6] = sh; return x.join(':'); }));
    } else if (f.f) {
      writeLines(c.m, '/etc/passwd', fileLines(c.m, '/etc/passwd').map((l) => { const x = l.split(':'); if (x[0] === u) x[4] = f.f + ',,,'; return x.join(':'); }));
    }
    return 0;
  });

  // ======================================================================= 시스템 정보
  def('uname', async (c) => {
    const { f } = getopt(c.args, 'asnrvmpio', { all: 'a', 'kernel-name': 's', 'nodename': 'n', 'kernel-release': 'r', 'kernel-version': 'v', machine: 'm', processor: 'p', 'hardware-platform': 'i', 'operating-system': 'o' });
    const O = LX.OS;
    const parts = [];
    const any = Object.keys(f).length;
    if (f.a || f.s || !any) parts.push('Linux');
    if (f.a || f.n) parts.push(c.m.hostname());
    if (f.a || f.r) parts.push(O.kernel);
    if (f.a || f.v) parts.push(O.kernelBuild);
    if (f.a || f.m) parts.push('x86_64');
    if (f.a || f.p) parts.push('x86_64');
    if (f.a || f.i) parts.push('x86_64');
    if (f.a || f.o) parts.push('GNU/Linux');
    c.out(parts.join(' ') + '\n');
    return 0;
  });
  def('arch', async (c) => { c.out('x86_64\n'); return 0; });
  def('nproc', async (c) => { c.out('2\n'); return 0; });
  def('hostid', async (c) => { c.out('0a00020f\n'); return 0; });

  def('hostname', async (c) => {
    const { f, ops } = getopt(c.args, 'IifsdAb', { 'all-ip-addresses': 'I', 'ip-address': 'i', fqdn: 'f', short: 's', domain: 'd' });
    if (f.I) { c.out(Object.entries(c.m.state.net.ifaces).filter(([k, v]) => k !== 'lo' && v.state === 'UP').flatMap(([, v]) => v.addr.map((a) => a.split('/')[0])).join(' ') + ' \n'); return 0; }
    if (f.i) { c.out('127.0.1.1\n'); return 0; }
    if (f.d) { c.out('\n'); return 0; }
    if (ops[0]) {
      if (c.cred.uid !== 0) { c.err('hostname: you must be root to change the host name\n'); return 1; }
      c.m.state.transientHost = ops[0];
      return 0;
    }
    c.out((f.s ? c.m.hostname().split('.')[0] : c.m.hostname()) + '\n');
    return 0;
  });

  def('hostnamectl', async (c) => {
    if (c.args.includes('--pretty') && c.args[0] !== '--pretty' && /set-hostname/.test(c.args.join(' '))) { if (c.cred.uid !== 0) { c.err('Could not set pretty hostname: Access denied\n'); return 1; } c.m.state.prettyHost = c.args.filter((a) => !a.startsWith('-') && a !== 'set-hostname')[0]; return 0; }
    if (c.args.includes('--static') && !/set-hostname/.test(c.args.join(' '))) { c.out(c.fs.readFile('/etc/hostname', null)); return 0; }
    const args = c.args.filter((a) => !a.startsWith('--') || a === '--static' || a === '--transient');
    const sub = args[0] || 'status';
    if (sub === 'set-hostname' || sub === 'hostname' && args[1]) {
      const name = args[1];
      if (!name) { c.err('Too few arguments.\n'); return 1; }
      if (c.cred.uid !== 0) {
        if (!(await polkit(c, 'org.freedesktop.hostname1.set-static-hostname', "Authentication is required to set the statically configured local hostname, as well as the pretty hostname."))) { c.err('Could not set static hostname: Access denied\n'); return 1; }
      }
      c.fs.writeFile('/etc/hostname', name + '\n', null);
      delete c.m.state.transientHost;
      LX.log(c.m, 'systemd-hostnamed[1861]', `Hostname set to <${name}> (static)`);
      return 0;
    }
    if (sub === 'hostname') { c.out(c.m.hostname() + '\n'); return 0; }
    const O = LX.OS;
    c.out(` Static hostname: ${c.fs.readFile('/etc/hostname', null).trim()}\n${c.m.state.transientHost ? `Transient hostname: ${c.m.state.transientHost}\n` : ''}       Icon name: computer-vm\n         Chassis: vm 🖴\n      Machine ID: 5f1c0d9e2b7a4c6f8e3d1a2b4c6d8e0f\n         Boot ID: 3c2b9a8e7f6d4c1b0a9e8d7c6b5a4f3e\n  Virtualization: oracle\nOperating System: ${O.pretty}\n          Kernel: Linux ${O.kernel}\n    Architecture: x86-64\n Hardware Vendor: innotek GmbH\n  Hardware Model: VirtualBox\nFirmware Version: VirtualBox\n   Firmware Date: Fri 2006-12-01\n    Firmware Age: 19y 9month 3w 5d\n`);
    return 0;
  });

  /** polkit 인증 (비 root 가 systemctl 등을 쓸 때) */
  async function polkit(c, action, text) {
    if (c.cred.uid === 0) return true;
    if (!c.m.inGroup(c.cred.name, 'sudo') && !c.m.inGroup(c.cred.name, 'admin')) return false;
    const full = (c.m.passwd().find((u) => u.name === c.cred.name) || {}).gecos || c.cred.name;
    c.err(`==== AUTHENTICATING FOR ${action} ====\n${text}\nAuthenticating as: ${full.split(',')[0] || c.cred.name} (${c.cred.name})\n`);
    const pw = await c.session.requestLine('Password: ', { secret: true });
    if (pw != null && c.m.checkPassword(c.cred.name, pw)) { c.err(`==== AUTHENTICATION COMPLETE ====\n`); return true; }
    c.err(`polkit-agent-helper-1: pam_authenticate failed: Authentication failure\n==== AUTHENTICATION FAILED ====\n`);
    return false;
  }
  LX.polkit = polkit;

  def('lsb_release', async (c) => {
    const { f } = getopt(c.args, 'aidrcs', { all: 'a', id: 'i', description: 'd', release: 'r', codename: 'c', short: 's' });
    const O = LX.OS;
    const all = f.a || !Object.keys(f).filter((k) => k !== 's').length;
    if (!f.s) c.err('No LSB modules are available.\n');
    const rows = [];
    if (all || f.i) rows.push(['Distributor ID', 'Ubuntu']);
    if (all || f.d) rows.push(['Description', O.pretty]);
    if (all || f.r) rows.push(['Release', O.id]);
    if (all || f.c) rows.push(['Codename', O.codename]);
    c.out(f.s ? rows.map((r) => r[1]).join(' ') + '\n' : rows.map((r) => `${r[0]}:\t${r[1]}\n`).join(''));
    return 0;
  });

  // ---- 날짜
  function strftime(m, fmt, t, utc) {
    const d = utc ? new Date(t) : LX.localDate(m, t);
    const off = utc ? 0 : LX.tzOffsetMin(m);
    const tz = utc ? 'UTC' : LX.tzAbbr(m);
    const h12 = d.getUTCHours() % 12 || 12;
    const doy = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5) + 1;
    return fmt.replace(/%([-_0^]?)([a-zA-Z%])/g, (m0, flag, k) => {
      let v;
      switch (k) {
        case 'Y': v = String(d.getUTCFullYear()); break;
        case 'y': v = pad2(d.getUTCFullYear() % 100); break;
        case 'C': v = String(Math.floor(d.getUTCFullYear() / 100)); break;
        case 'm': v = pad2(d.getUTCMonth() + 1); break;
        case 'd': v = pad2(d.getUTCDate()); break;
        case 'e': v = String(d.getUTCDate()).padStart(2); break;
        case 'H': v = pad2(d.getUTCHours()); break;
        case 'k': v = String(d.getUTCHours()).padStart(2); break;
        case 'I': v = pad2(h12); break;
        case 'l': v = String(h12).padStart(2); break;
        case 'M': v = pad2(d.getUTCMinutes()); break;
        case 'S': v = pad2(d.getUTCSeconds()); break;
        case 'N': v = String(d.getUTCMilliseconds()).padStart(3, '0') + '000000'; break;
        case 'p': v = d.getUTCHours() < 12 ? 'AM' : 'PM'; break;
        case 'P': v = d.getUTCHours() < 12 ? 'am' : 'pm'; break;
        case 'a': v = DAYS[d.getUTCDay()]; break;
        case 'A': v = DAYS_FULL[d.getUTCDay()]; break;
        case 'b': case 'h': v = MON[d.getUTCMonth()]; break;
        case 'B': v = MON_FULL[d.getUTCMonth()]; break;
        case 'j': v = String(doy).padStart(3, '0'); break;
        case 'u': v = String(d.getUTCDay() || 7); break;
        case 'w': v = String(d.getUTCDay()); break;
        case 'U': case 'V': case 'W': v = pad2(Math.floor((doy + 6) / 7)); break;
        case 's': v = String(Math.floor(t / 1000)); break;
        case 'Z': v = tz; break;
        case 'z': v = (off >= 0 ? '+' : '-') + pad2(Math.floor(Math.abs(off) / 60)) + pad2(Math.abs(off) % 60); break;
        case 'F': v = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`; break;
        case 'T': v = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`; break;
        case 'R': v = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`; break;
        case 'D': v = `${pad2(d.getUTCMonth() + 1)}/${pad2(d.getUTCDate())}/${pad2(d.getUTCFullYear() % 100)}`; break;
        case 'c': v = `${DAYS[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2)} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()} ${pad2(h12)}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())} ${d.getUTCHours() < 12 ? 'AM' : 'PM'} ${tz}`; break;
        case 'x': v = `${pad2(d.getUTCMonth() + 1)}/${pad2(d.getUTCDate())}/${d.getUTCFullYear()}`; break;
        case 'X': v = `${pad2(h12)}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())} ${d.getUTCHours() < 12 ? 'AM' : 'PM'}`; break;
        case 'n': v = '\n'; break;
        case 't': v = '\t'; break;
        case '%': v = '%'; break;
        default: return m0;
      }
      if (flag === '-') v = v.replace(/^[0 ]+(?=\d)/, '');
      if (flag === '_') v = v.replace(/^0(?=\d)/, ' ');
      if (flag === '^') v = v.toUpperCase();
      return v;
    });
  }
  LX.strftime = strftime;

  def('date', async (c) => {
    const args = c.args.slice();
    let t = c.m.now();
    let utc = false, fmt = null, set = null;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-u' || a === '--utc' || a === '--universal') utc = true;
      else if (a === '-d' || a === '--date') { const v = LX.parseDate(c.m, args[++i]); if (v == null) { c.err(`date: invalid date '${args[i]}'\n`); return 1; } t = v; }
      else if (a.startsWith('--date=')) { const v = LX.parseDate(c.m, a.slice(7)); if (v == null) { c.err(`date: invalid date '${a.slice(7)}'\n`); return 1; } t = v; }
      else if (a === '-s' || a === '--set') set = args[++i];
      else if (a === '-R' || a === '--rfc-email') fmt = '%a, %d %b %Y %H:%M:%S %z';
      else if (a === '-I' || a === '--iso-8601' || a === '-Idate') fmt = '%F';
      else if (a === '-Iseconds' || a === '--iso-8601=seconds') fmt = '%FT%T%:z';
      else if (a.startsWith('+')) fmt = a.slice(1);
      else if (a === '-r') { const n = c.fs.lookup(c.resolve(args[++i])); if (n) t = n.mt; }
    }
    if (set) {
      if (c.cred.uid !== 0) { c.err('date: cannot set date: Operation not permitted\n'); return 1; }
      const v = LX.parseDate(c.m, set);
      if (v == null) { c.err(`date: invalid date '${set}'\n`); return 1; }
      c.m.clockOffset += v - c.m.now();
      t = v;
    }
    if (!fmt) fmt = '%a %b %e %r %Z %Y';
    fmt = fmt.replace('%:z', (() => { const o = utc ? 0 : LX.tzOffsetMin(c.m); return (o >= 0 ? '+' : '-') + pad2(Math.floor(Math.abs(o) / 60)) + ':' + pad2(Math.abs(o) % 60); })()).replace('%r', '%I:%M:%S %p');
    c.out(strftime(c.m, fmt, t, utc) + '\n');
    return 0;
  });

  function calendar(m, y, mo, hl) {
    const title = `${MON_FULL[mo]} ${y}`;
    let out = ' '.repeat(Math.floor((20 - title.length) / 2)) + title + '\n';
    out += 'Su Mo Tu We Th Fr Sa\n';
    const first = new Date(Date.UTC(y, mo, 1)).getUTCDay();
    const days = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    let line = '   '.repeat(first);
    for (let d = 1; d <= days; d++) {
      const s = String(d).padStart(2);
      line += (hl === d ? `\x1b[7m${s}\x1b[27m` : s) + ((first + d) % 7 === 0 ? '' : ' ');
      if ((first + d) % 7 === 0) { out += line.replace(/\s+$/, '') + '\n'; line = ''; }
    }
    if (line) out += line.replace(/\s+$/, '') + '\n';
    return out;
  }
  def(['cal', 'ncal'], async (c) => {
    const nums = c.args.filter((a) => /^\d+$/.test(a)).map(Number);
    const now = LX.localDate(c.m);
    if (nums.length === 1) {
      const y = nums[0];
      let out = `                            ${y}\n`;
      for (let q = 0; q < 12; q += 3) {
        const cals = [0, 1, 2].map((k) => calendar(c.m, y, q + k, 0).split('\n'));
        for (let r = 0; r < 8; r++) out += cals.map((cl) => (cl[r] || '').padEnd(20)).join('  ').replace(/\s+$/, '') + '\n';
      }
      c.out(out);
      return 0;
    }
    const y = nums.length >= 2 ? nums[1] : now.getUTCFullYear();
    const mo = nums.length >= 2 ? nums[0] - 1 : now.getUTCMonth();
    const hl = nums.length ? (y === now.getUTCFullYear() && mo === now.getUTCMonth() ? now.getUTCDate() : 0) : now.getUTCDate();
    c.out(calendar(c.m, y, mo, c.tty ? hl : 0) + '\n');
    return 0;
  });

  const ZONES = ['Africa/Cairo', 'America/Chicago', 'America/Los_Angeles', 'America/New_York', 'America/Sao_Paulo', 'Asia/Bangkok', 'Asia/Dubai', 'Asia/Hong_Kong', 'Asia/Kolkata', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/Berlin', 'Europe/London', 'Europe/Paris', 'Etc/UTC', 'UTC'];
  def('timedatectl', async (c) => {
    const sub = c.args[0] || 'status';
    const m = c.m;
    if (sub === 'list-timezones') { c.out(ZONES.join('\n') + '\n'); return 0; }
    if (sub === 'set-timezone') {
      const z = c.args[1];
      if (!z) { c.err('Too few arguments.\n'); return 1; }
      if (!ZONES.includes(z)) { c.err(`Failed to set time zone: Invalid or not installed time zone '${z}'\n`); return 1; }
      if (c.cred.uid !== 0 && !(await polkit(c, 'org.freedesktop.timedate1.set-timezone', 'Authentication is required to set the system timezone.'))) { c.err('Failed to set time zone: Access denied\n'); return 1; }
      m.state.timezone = z === 'UTC' ? 'Etc/UTC' : z;
      c.fs.writeFile('/etc/timezone', m.state.timezone + '\n', null);
      try { c.fs.unlink('/etc/localtime', null); } catch (e) { /* 없음 */ }
      c.fs.symlink('/usr/share/zoneinfo/' + m.state.timezone, '/etc/localtime', null);
      LX.log(m, 'systemd-timedated[2011]', `Changed time zone to '${m.state.timezone}' (${LX.tzAbbr(m)}).`);
      return 0;
    }
    if (sub === 'set-ntp') {
      if (c.cred.uid !== 0 && !(await polkit(c, 'org.freedesktop.timedate1.set-ntp', 'Authentication is required to control whether network time synchronization shall be enabled.'))) { c.err('Failed to set ntp: Access denied\n'); return 1; }
      m.state.ntp = /^(true|yes|1|on)$/.test(c.args[1] || '');
      return 0;
    }
    if (sub === 'set-time') {
      if (m.state.ntp !== false) { c.err('Failed to set time: Automatic time synchronization is enabled\n'); return 1; }
      const v = LX.parseDate(m, c.args[1]);
      if (v == null) { c.err(`Failed to parse time specification '${c.args[1]}': Invalid argument\n`); return 1; }
      m.clockOffset += v - m.now();
      return 0;
    }
    if (sub === 'timesync-status' || sub === 'show-timesync') { c.out('       Server: 185.125.190.56 (ntp.ubuntu.com)\nPoll interval: 34min 8s (min: 32s; max 34min 8s)\n         Leap: normal\n      Version: 4\n      Stratum: 2\n    Reference: 11FD1CFB\n    Precision: 1us (-25)\nRoot distance: 12.938ms (max: 5s)\n       Offset: -1.024ms\n        Delay: 229.183ms\n       Jitter: 4.188ms\n Packet count: 7\n    Frequency: +8.771ppm\n'); return 0; }
    const t = m.now();
    const loc = strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', t, false);
    const u = strftime(m, '%a %Y-%m-%d %H:%M:%S UTC', t, true);
    const off = LX.tzOffsetMin(m);
    c.out(`               Local time: ${loc}\n           Universal time: ${u}\n                 RTC time: ${strftime(m, '%a %Y-%m-%d %H:%M:%S', t - 1000, true)}\n                Time zone: ${m.state.timezone} (${LX.tzAbbr(m)}, ${(off >= 0 ? '+' : '-') + pad2(Math.floor(Math.abs(off) / 60)) + pad2(Math.abs(off) % 60)})\nSystem clock synchronized: ${m.state.ntp === false ? 'no' : 'yes'}\n              NTP service: ${m.state.ntp === false ? 'inactive' : 'active'}\n          RTC in local TZ: no\n`);
    return 0;
  });

  def('locale', async (c) => {
    if (c.args.includes('-a')) { c.out('C\nC.utf8\nen_US.utf8\nko_KR.utf8\nPOSIX\n'); return 0; }
    const L = c.env('LANG') || 'en_US.UTF-8';
    c.out(`LANG=${L}\nLANGUAGE=\n${['LC_CTYPE', 'LC_NUMERIC', 'LC_TIME', 'LC_COLLATE', 'LC_MONETARY', 'LC_MESSAGES', 'LC_PAPER', 'LC_NAME', 'LC_ADDRESS', 'LC_TELEPHONE', 'LC_MEASUREMENT', 'LC_IDENTIFICATION'].map((k) => `${k}="${L}"`).join('\n')}\nLC_ALL=\n`);
    return 0;
  });
  def('localectl', async (c) => {
    if (c.args[0] === 'set-locale') { if (c.cred.uid !== 0) { c.err('Failed to issue method call: Access denied\n'); return 1; } c.fs.writeFile('/etc/default/locale', c.args[1] + '\n', null); return 0; }
    if (c.args[0] === 'list-locales') { c.out('C.UTF-8\nen_US.UTF-8\nko_KR.UTF-8\n'); return 0; }
    c.out('System Locale: LANG=en_US.UTF-8\n    VC Keymap: (unset)\n   X11 Layout: us\n    X11 Model: pc105\n');
    return 0;
  });

  // ---- 메모리 · CPU
  def('free', async (c) => {
    const { f } = getopt(c.args, 'hmgbktwsl', { human: 'h', mega: 'm', giga: 'g', total: 't', wide: 'w', kibi: 'k', mebi: 'm', gibi: 'g', si: 'si' });
    const x = LX.memInfo(c.m);
    const fmt = (kb) => {
      if (f.h) {
        const b = kb * 1024;
        const u = ['B', 'Ki', 'Mi', 'Gi', 'Ti'];
        let v = b, i = 0;
        while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
        return (i ? (v < 10 ? v.toFixed(1) : String(Math.round(v))) : String(Math.round(v))) + u[i];
      }
      if (f.m) return String(Math.round(kb / 1024));
      if (f.g) return String(Math.round(kb / 1048576));
      if (f.b) return String(kb * 1024);
      return String(kb);
    };
    const bc = x.buff + x.cache;
    const rows = [['Mem:', x.total, x.used, x.free, x.shared, bc, x.avail], ['Swap:', x.swapTotal, x.swapUsed, x.swapTotal - x.swapUsed]];
    if (f.t) rows.push(['Total:', x.total + x.swapTotal, x.used, x.free + x.swapTotal]);
    let out = '               total        used        free      shared  buff/cache   available\n';
    rows.forEach((r) => { out += r[0].padEnd(7) + r.slice(1).map((v) => fmt(v).padStart(12)).join('') + '\n'; });
    c.out(out);
    return 0;
  });

  def('lscpu', async (c) => {
    c.out(`Architecture:             x86_64
  CPU op-mode(s):         32-bit, 64-bit
  Address sizes:          39 bits physical, 48 bits virtual
  Byte Order:             Little Endian
CPU(s):                   2
  On-line CPU(s) list:    0,1
Vendor ID:                GenuineIntel
  Model name:             12th Gen Intel(R) Core(TM) i5-1240P
    CPU family:           6
    Model:                154
    Thread(s) per core:   1
    Core(s) per socket:   2
    Socket(s):            1
    Stepping:             3
    BogoMIPS:             4223.99
    Flags:                fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ht syscall nx rdtscp lm constant_tsc rep_good nopl xtopology nonstop_tsc cpuid tsc_known_freq pni pclmulqdq ssse3 cx16 pcid sse4_1 sse4_2 x2apic movbe popcnt aes xsave avx rdrand hypervisor lahf_lm abm 3dnowprefetch fsgsbase bmi1 avx2 bmi2 invpcid rdseed adx clflushopt sha_ni arat md_clear flush_l1d arch_capabilities
Virtualization features:
  Hypervisor vendor:      KVM
  Virtualization type:    full
Caches (sum of all):
  L1d:                    96 KiB (2 instances)
  L1i:                    64 KiB (2 instances)
  L2:                     2.5 MiB (2 instances)
  L3:                     12 MiB (1 instance)
NUMA:
  NUMA node(s):           1
  NUMA node0 CPU(s):      0,1
`);
    return 0;
  });

  def('vmstat', async (c) => {
    const x = LX.memInfo(c.m);
    const n = +(c.args.find((a) => /^\d+$/.test(a)) || 0);
    const cnt = +(c.args.filter((a) => /^\d+$/.test(a))[1] || (n ? 3 : 1));
    c.out('procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st\n');
    for (let i = 0; i < Math.min(cnt, c.session.headless ? 2 : 50); i++) {
      c.out(` 1  0      0 ${String(x.free).padStart(6)} ${String(x.buff).padStart(6)} ${String(x.cache).padStart(6)}    0    0    ${String(12 + i).padStart(2)}    ${String(8 + (i * 7) % 20).padStart(2)}  ${String(95 + i).padStart(3)}  ${String(180 + i * 3).padStart(3)}  1  0 99  0  0\n`);
      if (i < cnt - 1 && n) await c.sleep(n * 1000);
    }
    return 0;
  });

  def(['iostat', 'mpstat', 'pidstat', 'sar'], async (c) => {
    const date = strftime(c.m, '%m/%d/%Y', c.m.now());
    c.out(`Linux ${LX.OS.kernel} (${c.m.hostname()}) \t${date} \t_x86_64_\t(2 CPU)\n\n`);
    if (c.name === 'iostat') c.out('avg-cpu:  %user   %nice %system %iowait  %steal   %idle\n           0.52    0.01    0.43    0.08    0.00   98.96\n\nDevice             tps    kB_read/s    kB_wrtn/s    kB_dscd/s    kB_read    kB_wrtn    kB_dscd\ndm-0              3.21        48.10        25.63         0.00     321457     171302          0\nsda               3.10        52.17        25.91         0.00     348665     173184          0\nsdb               0.02         0.49         0.00         0.00       3284          0          0\n\n');
    else c.out(`${strftime(c.m, '%I:%M:%S %p', c.m.now())}  CPU    %usr   %nice    %sys %iowait    %irq   %soft  %steal  %guest  %gnice   %idle\n${strftime(c.m, '%I:%M:%S %p', c.m.now())}  all    0.52    0.01    0.43    0.08    0.00    0.02    0.00    0.00    0.00   98.94\n`);
    return 0;
  });

  // ======================================================================= 프로세스
  function procTable(c) {
    const list = c.m.allProcs().map((p) => Object.assign({}, p));
    // 현재 세션의 셸 (프로세스 표에 없는 경우만: 다른 머신 · 예전 저장본)
    const pids = new Set(list.map((p) => p.pid));
    c.session.stack.filter((s) => s instanceof LX.Shell && s.m === c.m).forEach((s, i) => {
      const pid = s.pid || (i === 0 ? c.session.shellPid : null);
      if (pid && !pids.has(pid)) { list.push({ pid, ppid: 1, user: s.cred.name, cmd: i === 0 ? '-bash' : 'bash', tty: 'pts/0', start: c.m.bootTime + 300000, mem: 0.1, shell: true, ni: 0 }); pids.add(pid); }
    });
    return list.sort((a, b) => a.pid - b.pid);
  }
  LX.procTable = procTable;
  function psTime(m, t) { const d = LX.localDate(m, t); return Math.abs(m.now() - t) < 864e5 ? `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}` : `${MON[d.getUTCMonth()]}${pad2(d.getUTCDate())}`; }
  function vsz(p) { return /^\[/.test(p.cmd) ? 0 : Math.round(8000 + (p.mem || 0.1) * 60000 + (p.pid % 97) * 211); }
  function rss(p) { return /^\[/.test(p.cmd) ? 0 : Math.round((p.mem || 0.1) * 40056); }
  /** 실행 파일 이름 (comm, 최대 15자) */
  function commOf(p) {
    if (p.comm) return p.comm;
    return P().basename(p.cmd.replace(/^-/, '').split(' ')[0]).replace(/:$/, '').replace(/^\[|\]$/g, '').replace(/^@/, '').slice(0, 15);
  }
  LX.procComm = commOf;
  /** ps 의 사용자 이름 칸 (8자 넘으면 7자 + '+') */
  const uname8 = (u) => (u.length > 8 ? u.slice(0, 7) + '+' : u);
  function statOf(c, p) {
    let s;
    if (p.stopped) s = 'T';
    else if (c.proc && p.pid === c.proc.pid) s = 'R';
    else if (/^\[/.test(p.cmd)) s = 'S';
    else s = 'S';
    if (p.ni > 0) s += 'N'; else if (p.ni < 0) s += '<';
    if ((p.shell || p.sys || p.svc || p.pid === 1) && !/^\[/.test(p.cmd)) s += 's';
    if (p.tty && !p.shell && !(p.job || (p.ppid && c.m.procs.some((q) => q.pid === p.ppid && q.job)))) s += '+';
    return s;
  }
  function etime(c, p) {
    let s = Math.max(0, Math.floor((c.m.now() - (p.start || c.m.now())) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const mi = Math.floor(s / 60); s -= mi * 60;
    return (d ? `${d}-` : '') + (d || h ? `${pad2(h)}:` : '') + `${pad2(mi)}:${pad2(s)}`;
  }
  /** 사용자 이름 또는 UID → 이름 */
  function userArg(c, u) {
    if (/^\d+$/.test(u)) { const n = c.m.userName(+u); return n || u; }
    return u;
  }

  /** 프로세스 트리 순서로 정렬 (+ 깊이) */
  function forestOrder(list) {
    const byPid = new Set(list.map((p) => p.pid));
    const kids = (pid) => list.filter((q) => q.ppid === pid && q.pid !== pid);
    const out = [];
    const walk = (p, d) => { out.push([p, d]); kids(p.pid).forEach((k) => walk(k, d + 1)); };
    list.filter((p) => !byPid.has(p.ppid) || p.ppid === p.pid).forEach((p) => walk(p, 0));
    return out;
  }

  const PS_COLS = {
    pid: ['PID', 'r'], ppid: ['PPID', 'r'], pgid: ['PGID', 'r'], sid: ['SID', 'r'], sess: ['SESS', 'r'], user: ['USER', 'l'], euser: ['EUSER', 'l'], ruser: ['RUSER', 'l'],
    uid: ['UID', 'r'], euid: ['EUID', 'r'], group: ['GROUP', 'l'], '%cpu': ['%CPU', 'r'], pcpu: ['%CPU', 'r'], '%mem': ['%MEM', 'r'], pmem: ['%MEM', 'r'],
    cmd: ['CMD', 'l'], command: ['COMMAND', 'l'], args: ['COMMAND', 'l'], comm: ['COMMAND', 'l'], ucomm: ['COMMAND', 'l'], ucmd: ['CMD', 'l'], fname: ['COMMAND', 'l'],
    stat: ['STAT', 'l'], s: ['S', 'l'], state: ['S', 'l'], tty: ['TT', 'l'], tt: ['TT', 'l'], tname: ['TTY', 'l'], etime: ['ELAPSED', 'r'], etimes: ['ELAPSED', 'r'],
    rss: ['RSS', 'r'], rsz: ['RSZ', 'r'], vsz: ['VSZ', 'r'], vsize: ['VSZ', 'r'], sz: ['SZ', 'r'], ni: ['NI', 'r'], nice: ['NI', 'r'], pri: ['PRI', 'r'], priority: ['PRI', 'r'],
    start: ['STARTED', 'r'], stime: ['STIME', 'l'], start_time: ['START', 'l'], bsdstart: ['START', 'r'], lstart: ['STARTED', 'l'], time: ['TIME', 'r'], cputime: ['TIME', 'r'],
    c: ['C', 'r'], psr: ['PSR', 'r'], wchan: ['WCHAN', 'l'], f: ['F', 'r'], flags: ['F', 'r'], lwp: ['LWP', 'r'], nlwp: ['NLWP', 'r'], cls: ['CLS', 'l'], rtprio: ['RTPRIO', 'r']
  };
  function colVal(c, p, k, forest) {
    const gid = () => { const u = c.m.credFor && c.m.credFor(p.user); return u ? u.gid : 0; };
    const uid = () => { const u = c.m.credFor && c.m.credFor(p.user); return u ? u.uid : 0; };
    const tree = forest ? '    '.repeat(Math.max(0, forest - 1)) + (forest ? ' \\_ ' : '') : '';
    switch (k) {
      case 'pid': case 'lwp': return p.pid;
      case 'ppid': return p.ppid;
      case 'pgid': return p.job ? p.pid : p.tty && !p.shell ? (p.ppid || p.pid) === (c.session.shellPid) ? p.pid : p.pid : p.pid;
      case 'sid': case 'sess': return p.tty ? (c.session.shellPid || 1402) : p.pid;
      case 'user': case 'euser': case 'ruser': return uname8(p.user);
      case 'uid': case 'euid': return uid();
      case 'group': { const g = c.m.groupName ? c.m.groupName(gid()) : ''; return g || gid(); }
      case '%cpu': case 'pcpu': return (p.cpu || 0).toFixed(1);
      case '%mem': case 'pmem': return (p.mem || 0).toFixed(1);
      case 'cmd': case 'command': case 'args': return tree + p.cmd;
      case 'comm': case 'ucomm': case 'ucmd': case 'fname': return tree + commOf(p);
      case 'stat': return statOf(c, p);
      case 's': case 'state': return statOf(c, p)[0];
      case 'tty': case 'tt': case 'tname': return p.tty || '?';
      case 'etime': return etime(c, p);
      case 'etimes': return Math.max(0, Math.floor((c.m.now() - (p.start || c.m.now())) / 1000));
      case 'rss': case 'rsz': return rss(p);
      case 'vsz': case 'vsize': return vsz(p);
      case 'sz': return Math.round(vsz(p) / 4);
      case 'ni': case 'nice': return /^\[/.test(p.cmd) ? 0 : (p.ni || 0);
      case 'pri': return 19 - (p.ni || 0);
      case 'priority': return 20 + (p.ni || 0);
      case 'start': case 'bsdstart': case 'stime': case 'start_time': return psTime(c.m, p.start);
      case 'lstart': return LX.localDate(c.m, p.start).toUTCString().replace(/^(\w+), (\d+) (\w+) (\d+) ([\d:]+) GMT$/, '$1 $3 $2 $5 $4');
      case 'time': case 'cputime': return '00:00:00';
      case 'c': return 0;
      case 'psr': return p.pid % 2;
      case 'wchan': return p.stopped ? 'do_sig' : /sleep/.test(p.cmd) ? 'hrtime' : '-';
      case 'f': case 'flags': return /^\[/.test(p.cmd) ? 1 : 4;
      case 'nlwp': return 1;
      case 'cls': return 'TS';
      case 'rtprio': return '-';
      default: return '-';
    }
  }

  /** ps 인자 해석 (UNIX · BSD · GNU 긴 옵션) */
  function psParse(args) {
    const o = { all: false, bsdA: false, bsdX: false, users: [], ruser: [], pids: [], ppids: [], names: [], ttys: [], full: false, extra: false, long: false, jobs: false, bsdU: false, bsdJ: false, bsdL: false, bsdV: false, forest: false, hier: false, fmt: null, sort: null, noHead: false, bad: null, bsd: false };
    const addFmt = (v) => { o.fmt = (o.fmt ? o.fmt + ',' : '') + v; };
    const list = (v) => String(v || '').split(/[,\s]+/).filter(Boolean);
    const withArg = { u: 'users', U: 'users', p: 'pids', C: 'names', t: 'ttys', o: 'fmt', O: 'fmt', G: 'ruser', g: 'ruser', q: 'pids', s: 'sids' };
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a.startsWith('--')) {
        let [k, v] = a.slice(2).split(/=(.*)/s);
        const need = ['sort', 'pid', 'ppid', 'user', 'User', 'format', 'cols', 'columns', 'width', 'lines', 'rows', 'tty', 'sid', 'group', 'Group', 'quick-pid'].includes(k);
        if (need && v == null) v = args[++i];
        if (k === 'sort') o.sort = v;
        else if (k === 'pid' || k === 'quick-pid') o.pids.push(...list(v));
        else if (k === 'ppid') o.ppids.push(...list(v));
        else if (k === 'user' || k === 'User') o.users.push(...list(v));
        else if (k === 'format') addFmt(v);
        else if (k === 'forest') o.forest = true;
        else if (k === 'no-headers' || k === 'no-heading') o.noHead = true;
        else if (k === 'headers') o.noHead = false;
        else if (k === 'tty') o.ttys.push(...list(v));
        else if (['cols', 'columns', 'width', 'lines', 'rows', 'sid', 'group', 'Group', 'cumulative', 'deselect', 'info'].includes(k)) { /* 무시 */ }
        else if (k === 'help' || k === 'version') o[k] = true;
        else o.bad = a;
        continue;
      }
      if (a.startsWith('-') && a.length > 1) {
        for (let j = 1; j < a.length; j++) {
          const ch = a[j];
          if (withArg[ch]) {
            const v = a.slice(j + 1) || args[++i];
            if (ch === 'o' || ch === 'O') addFmt(v);
            else if (withArg[ch] !== 'sids') o[withArg[ch]].push(...list(v));
            break;
          }
          if (ch === 'e' || ch === 'A') o.all = true;
          else if (ch === 'f') o.full = true;
          else if (ch === 'F') { o.full = true; o.extra = true; }
          else if (ch === 'l') o.long = true;
          else if (ch === 'j') o.jobs = true;
          else if (ch === 'H') o.hier = true;
          else if (ch === 'a' || ch === 'd' || ch === 'N' || ch === 'T' || ch === 'x') { if (ch === 'a' || ch === 'd') o.all = o.all || false; if (ch === 'x') o.bsdX = true; if (ch === 'a') o.dashA = true; }
          else if (ch === 'w' || ch === 'y' || ch === 'L' || ch === 'M' || ch === 'Z' || ch === 'c' || ch === 'm' || ch === 'P') { /* 무시 */ }
          else if (ch === 'V') o.version = true;
          else { o.bad = a; break; }
        }
        continue;
      }
      // BSD 형식 (aux, axjf, axo pid,comm ...)
      if (/^[a-zA-Z]+$/.test(a) && o.bsdAllowed !== false) {
        o.bsd = true;
        for (let j = 0; j < a.length; j++) {
          const ch = a[j];
          if (ch === 'o' || ch === 'O' || ch === 'p' || ch === 'U' || ch === 't') {
            const v = a.slice(j + 1) || args[++i];
            if (ch === 'o' || ch === 'O') addFmt(v);
            else if (ch === 'p') o.pids.push(...list(v));
            else if (ch === 'U') o.users.push(...list(v));
            else o.ttys.push(...list(v));
            break;
          }
          if (ch === 'a') o.bsdA = true;
          else if (ch === 'x') o.bsdX = true;
          else if (ch === 'u') o.bsdU = true;
          else if (ch === 'j') o.bsdJ = true;
          else if (ch === 'l') o.bsdL = true;
          else if (ch === 'v') o.bsdV = true;
          else if (ch === 'f') o.forest = true;
          else if (ch === 'e' || ch === 'w' || ch === 'h' || ch === 'c' || ch === 'n' || ch === 'r' || ch === 'S' || ch === 'H' || ch === 'm') { if (ch === 'h') o.noHead = true; if (ch === 'r') o.running = true; }
          else if (ch === 'e') { /* 환경 */ }
          else { o.bad = a; break; }
        }
        continue;
      }
      if (/^\d+(,\d+)*$/.test(a)) { o.pids.push(...list(a)); continue; }
      o.bad = a;
    }
    return o;
  }

  def('ps', async (c) => {
    const o = psParse(c.args);
    if (o.version) { c.out('ps from procps-ng 4.0.4\n'); return 0; }
    if (o.bad) {
      c.err(`error: unsupported option (BSD syntax)\n\nUsage:\n ps [options]\n\n Try 'ps --help <simple|list|output|threads|misc|all>'\n  or 'ps --help <s|l|o|t|m|a>'\n for additional help text.\n\nFor more details see ps(1).\n`);
      return 1;
    }
    const all = procTable(c);
    let list;
    const users = o.users.map((u) => userArg(c, u));
    const ruser = o.ruser.map((u) => userArg(c, u));
    const pids = o.pids.map(Number), ppids = o.ppids.map(Number);
    const ttys = o.ttys.map((t) => t.replace(/^\/dev\//, '').replace(/^(\d+)$/, 'pts/$1'));
    const selected = users.length || ruser.length || pids.length || ppids.length || o.names.length || ttys.length;
    if (o.all || (o.bsdA && o.bsdX)) list = all;
    else if (selected) {
      list = all.filter((p) => users.includes(p.user) || ruser.includes(p.user) || pids.includes(p.pid) || ppids.includes(p.ppid)
        || o.names.includes(commOf(p)) || ttys.includes(p.tty || '?'));
    } else if (o.bsdA) list = all.filter((p) => p.tty);
    else if (o.bsdX) list = all.filter((p) => p.user === c.cred.name);
    else if (o.dashA) list = all.filter((p) => p.tty && !p.shell);
    else list = all.filter((p) => p.tty === 'pts/0' && p.user === c.cred.name);
    // 정렬
    if (o.sort) {
      const keys = o.sort.split(',').filter(Boolean).map((k) => ({ desc: k.startsWith('-'), k: k.replace(/^[-+]/, '') }));
      const num = (p, k) => {
        switch (k) {
          case '%mem': case 'pmem': case 'rss': case 'rsz': case 'vsz': case 'vsize': case 'sz': return k === 'vsz' || k === 'vsize' || k === 'sz' ? vsz(p) : p.mem || 0;
          case '%cpu': case 'pcpu': case 'cpu': case 'time': case 'cputime': return p.cpu || 0;
          case 'pid': return p.pid;
          case 'ppid': return p.ppid;
          case 'ni': case 'nice': return p.ni || 0;
          case 'start_time': case 'etime': case 'etimes': case 'stime': return k === 'start_time' || k === 'stime' ? p.start || 0 : -(p.start || 0);
          default: return null;
        }
      };
      const str = (p, k) => (k === 'user' || k === 'euser' ? p.user : k === 'comm' || k === 'ucomm' ? commOf(p) : k === 'cmd' || k === 'args' || k === 'command' ? p.cmd : k === 'tty' ? p.tty || '?' : '');
      list = list.slice().sort((a, b) => {
        for (const { desc, k } of keys) {
          let r;
          const na = num(a, k), nb = num(b, k);
          if (na != null) r = na - nb; else { const sa = str(a, k), sb = str(b, k); r = sa < sb ? -1 : sa > sb ? 1 : 0; }
          if (r) return desc ? -r : r;
        }
        return a.pid - b.pid;
      });
    }
    // 트리
    let rows = list.map((p) => [p, 0]);
    if (o.forest || o.hier) rows = forestOrder(list);
    const fdepth = (d) => (o.forest ? d : 0);
    // 출력 형식
    let fmt;
    if (o.fmt) fmt = o.fmt;
    else if (o.bsdU) fmt = 'user,pid,%cpu,%mem,vsz,rss,tty,stat,start,time,command';
    else if (o.bsdJ) fmt = 'ppid,pid,pgid,sid,tty,tpgid,stat,uid,time,command';
    else if (o.bsdL) fmt = 'f,uid,pid,ppid,pri,ni,vsz,rss,wchan,stat,tty,time,command';
    else if (o.bsdV) fmt = 'pid,tty,stat,time,maj_flt,trs,drs,rss,%mem,command';
    else if (o.bsd) fmt = 'pid,tty,stat,time,command';
    else if (o.extra) fmt = 'uid,pid,ppid,c,sz,rss,psr,stime,tty,time,cmd';
    else if (o.full && o.long) fmt = 'f,s,uid,pid,ppid,c,pri,ni,addr,sz,wchan,stime,tty,time,cmd';
    else if (o.long) fmt = 'f,s,uid,pid,ppid,c,pri,ni,addr,sz,wchan,tty,time,comm';
    else if (o.full) fmt = 'uid,pid,ppid,c,stime,tty,time,cmd';
    else if (o.jobs) fmt = 'pid,pgid,sid,tty,time,comm';
    else fmt = 'pid,tty,time,comm';
    const bsdStyle = !o.fmt && o.bsd;
    const cols = fmt.split(',').filter(Boolean).map((x) => {
      const [k, h] = x.split(/=(.*)/s);
      const key = k.toLowerCase();
      let def = PS_COLS[key] || [key.toUpperCase(), 'l'];
      if (key === 'uid' && o.full && !o.long && !o.fmt) def = ['UID', 'l'];
      if (key === 'tty' && !o.fmt) def = ['TTY', 'l'];
      if (key === 'time' && bsdStyle) def = ['TIME', 'r'];
      if (key === 'start' && bsdStyle) def = ['START', 'l'];
      if (key === 'command' && !o.fmt && !o.bsd) def = ['CMD', 'l'];
      if (key === 'cmd' && !o.fmt) def = ['CMD', 'l'];
      if (key === 'comm' && !o.fmt) def = ['CMD', 'l'];
      if (key === 'addr') def = ['ADDR', 'l'];
      if (key === 'tpgid') def = ['TPGID', 'r'];
      return { k: key, head: h != null ? h : def[0], align: def[1] };
    });
    const val = (p, k, d) => {
      if (k === 'uid' && o.long && !o.fmt) return colVal(c, p, 'uid');
      if (k === 'uid' && o.full && !o.fmt) return uname8(p.user);
      if (k === 'pri' && o.long && !o.fmt) return 80 + (p.ni || 0);
      if (k === 'f' && o.long && !o.fmt) return p.user === 'root' ? 4 : 0;
      if (k === 'time' && bsdStyle) return '0:00';
      if (k === 'addr') return '-';
      if (k === 'tpgid') return p.tty ? p.pid : -1;
      if ((k === 'maj_flt' || k === 'trs' || k === 'drs')) return 0;
      return colVal(c, p, k, fdepth(d));
    };
    // 가변 폭: 실제 ps 와 비슷하게 최소 폭을 둔다
    const MINW = { pid: 7, ppid: 7, pgid: 7, sid: 7, tpgid: 5, uid: 5, user: 8, ruser: 8, euser: 8, tty: 8, tt: 8, time: 8, rss: 5, vsz: 6, '%cpu': 4, '%mem': 4, ni: 3, pri: 3, stat: 4, start: 5, stime: 5, sz: 5, c: 2, psr: 3, f: 1, s: 1, wchan: 6, etime: 11 };
    const table = rows.map(([p, d]) => cols.map((col) => String(val(p, col.k, d))));
    const showHead = !o.noHead && !cols.every((col) => col.head === '');
    const w = cols.map((col, i) => {
      let m = Math.max(showHead ? col.head.length : 0, ...table.map((r) => r[i].length));
      if (!o.fmt || true) m = Math.max(m, (MINW[col.k] && (!o.fmt || /^(pid|ppid|pgid|sid)$/.test(col.k)) ? MINW[col.k] : 0));
      if (col.k === 'uid' && o.full && !o.long && !o.fmt) m = Math.max(m, 8);
      if (col.k === 'user' && !o.fmt) m = Math.max(m, 8);
      return m;
    });
    const line = (r) => r.map((v, i) => (i === r.length - 1 && cols[i].align === 'l' ? v : cols[i].align === 'r' ? v.padStart(w[i]) : v.padEnd(w[i]))).join(' ').replace(/\s+$/, '');
    let out = '';
    if (showHead) out += line(cols.map((col) => col.head)) + '\n';
    table.forEach((r) => { out += line(r) + '\n'; });
    c.out(out);
    return list.length || !selected ? 0 : 1;
  });

  function topFrame(c, htop, filt) {
    const x = LX.memInfo(c.m);
    let list = procTable(c);
    const total = list.length;
    if (filt && filt.user) list = list.filter((p) => p.user === filt.user);
    if (filt && filt.pids && filt.pids.length) list = list.filter((p) => filt.pids.includes(p.pid));
    const stopped = list.filter((p) => p.stopped).length;
    const up = uptimeStr(c.m);
    const cmdName = (p) => (filt && filt.full ? p.cmd : commOf(p));
    if (htop) {
      const bar = (pct, w = 38) => '[' + '|'.repeat(Math.round(pct / 100 * w)).padEnd(w) + `${pct.toFixed(1)}%]`;
      let out = `\x1b[1m    0\x1b[0m${bar(1.3)}   \x1b[1mTasks:\x1b[0m ${total}, 58 thr, 102 kthr; 1 running\n\x1b[1m    1\x1b[0m${bar(0.7)}   \x1b[1mLoad average:\x1b[0m ${loadStr(c.m).replace(/,/g, '')}\n\x1b[1m  Mem\x1b[0m[${'|'.repeat(Math.round(x.used / x.total * 38)).padEnd(38)}${(x.used / 1048576).toFixed(2)}G/3.82G]   \x1b[1mUptime:\x1b[0m ${up}\n\x1b[1m  Swp\x1b[0m[${' '.repeat(38)}0K/${(x.swapTotal / 1048576).toFixed(2)}G]\n\n`;
      out += '\x1b[30;42m    PID USER       PRI  NI  VIRT   RES   SHR S  CPU% MEM%   TIME+  Command                 \x1b[0m\n';
      list.slice(0, 18).forEach((p) => { out += `${String(p.pid).padStart(7)} ${p.user.slice(0, 9).padEnd(9)} ${String(20 + (p.ni || 0)).padStart(4)} ${String(p.ni || 0).padStart(3)} ${String(Math.round(vsz(p) / 1024)).padStart(4)}M ${String(Math.round(rss(p) / 1024)).padStart(4)}M ${String(Math.round(rss(p) / 3000)).padStart(4)}M ${p.stopped ? 'T' : 'S'}   0.0  ${(p.mem || 0).toFixed(1).padStart(3)}  0:00.12 ${p.cmd.slice(0, 40)}\n`; });
      out += '\x1b[7mF1\x1b[0mHelp  \x1b[7mF2\x1b[0mSetup \x1b[7mF3\x1b[0mSearch\x1b[7mF4\x1b[0mFilter\x1b[7mF5\x1b[0mTree  \x1b[7mF6\x1b[0mSortBy\x1b[7mF7\x1b[0mNice -\x1b[7mF8\x1b[0mNice +\x1b[7mF9\x1b[0mKill  \x1b[7mF10\x1b[0mQuit\n';
      return out;
    }
    const mb = (k) => (k / 1024).toFixed(1).padStart(8);
    const allStopped = procTable(c).filter((p) => p.stopped).length;
    let out = `top - ${nowClock(c.m)} up ${up},  1 user,  load average: ${loadStr(c.m)}\nTasks: ${String(total + 90).padStart(3)} total,   1 running, ${String(total + 89 - allStopped).padStart(3)} sleeping, ${String(allStopped).padStart(3)} stopped,   0 zombie\n%Cpu(s):  0.7 us,  0.3 sy,  0.0 ni, 98.9 id,  0.0 wa,  0.0 hi,  0.1 si,  0.0 st \nMiB Mem : ${mb(x.total)} total, ${mb(x.free)} free, ${mb(x.used)} used, ${mb(x.buff + x.cache)} buff/cache     \nMiB Swap: ${mb(x.swapTotal)} total, ${mb(x.swapTotal)} free,      0.0 used. ${mb(x.avail)} avail Mem \n\n`;
    void stopped;
    out += '\x1b[7m    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND                                     \x1b[0m\n';
    const sorted = list.slice().sort((a, b) => (b.mem || 0) - (a.mem || 0));
    const self = c.proc ? c.proc.pid : null;
    sorted.slice(0, 16).forEach((p) => {
      const run = p.pid === self;
      out += `${String(p.pid).padStart(7)} ${uname8(p.user).padEnd(8)}  ${String(20 + (p.ni || 0)).padStart(2)} ${String(p.ni || 0).padStart(3)} ${String(vsz(p)).padStart(7)} ${String(rss(p)).padStart(6)} ${String(Math.round(rss(p) * 0.6)).padStart(6)} ${p.stopped ? 'T' : run ? 'R' : /^\[/.test(p.cmd) ? 'I' : 'S'}   ${(run ? 0.3 : 0).toFixed(1)}   ${(p.mem || 0).toFixed(1).padStart(3)}   0:00.${String(10 + p.pid % 80).padStart(2, '0')} ${cmdName(p)}\n`;
    });
    return out;
  }
  def(['top', 'htop', 'btop', 'atop', 'glances'], async (c) => {
    const htop = c.name !== 'top';
    const args = c.args.slice();
    const filt = { user: null, pids: [], full: false };
    let iters = null, batch = false, delay = 3000;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      let m;
      if (a === '-b' || a === '--batch') batch = true;
      else if (a === '-c') filt.full = true;
      else if ((m = /^-([uU])(.*)$/.exec(a)) || a === '--user') { const v = (m && m[2]) || args[++i]; filt.user = v ? userArg(c, v) : null; if (!v) { c.err(`${c.name}: -${m ? m[1] : 'u'} requires argument\n`); return 1; } }
      else if ((m = /^-n(\d*)$/.exec(a))) iters = +(m[1] || args[++i]);
      else if ((m = /^-d(.*)$/.exec(a))) { const v = m[1] || args[++i]; delay = Math.max(100, parseFloat(v) * 1000 || 3000); }
      else if ((m = /^-p(.*)$/.exec(a))) { const v = m[1] || args[++i]; filt.pids.push(...String(v).split(',').map(Number)); }
      else if (/^-[oOwsSiHE]/.test(a)) { if (a.length === 2 && /^-[oOwE]$/.test(a)) i++; }
    }
    if (filt.user && c.m.credFor && !c.m.credFor(filt.user)) { c.err(`${c.name}: Invalid user\n`); return 1; }
    batch = batch || !c.tty || c.session.headless;
    if (iters == null) iters = batch ? 1 : Infinity;
    for (let i = 0; i < iters; i++) {
      if (!batch) c.out('\x1b[H\x1b[2J');
      c.out(topFrame(c, htop, filt));
      if (i === iters - 1) break;
      if (batch) c.out('\n');
      if (!batch && i === 0) c.out(`\x1b[2m(가상 터미널: ${delay / 1000}초마다 새로 고칩니다. 끝내려면 Ctrl+C 또는 q)\x1b[0m\n`);
      else if (!batch) c.out('\x1b[2m(Ctrl+C: 끝내기)\x1b[0m\n');
      await c.sleep(delay);
    }
    return 0;
  });

  const SIGNALS = ['HUP', 'INT', 'QUIT', 'ILL', 'TRAP', 'ABRT', 'BUS', 'FPE', 'KILL', 'USR1', 'SEGV', 'USR2', 'PIPE', 'ALRM', 'TERM', 'STKFLT', 'CHLD', 'CONT', 'STOP', 'TSTP', 'TTIN', 'TTOU', 'URG', 'XCPU', 'XFSZ', 'VTALRM', 'PROF', 'WINCH', 'POLL', 'PWR', 'SYS'];
  function sigNum(s) {
    s = String(s).toUpperCase().replace(/^SIG/, '');
    if (/^\d+$/.test(s)) return +s <= 64 ? +s : null;
    if (s === 'IO') return 29;
    if (s === 'IOT') return 6;
    const i = SIGNALS.indexOf(s);
    return i >= 0 ? i + 1 : null;
  }
  LX.sigNum = sigNum;
  const STOP_SIGS = [19, 20, 21, 22];
  const IGNORE_SIGS = [0, 17, 23, 28];

  /** 작업(백그라운드)에 신호 보내기 */
  function signalJob(c, job, sig) {
    if (IGNORE_SIGS.includes(sig)) return;
    if (STOP_SIGS.includes(sig)) { c.session.stopJob ? c.session.stopJob(job) : c.session.killJob(job, sig); return; }
    if (sig === 18) { if (c.session.contJob) c.session.contJob(job); return; }
    c.session.killJob(job, sig);
  }
  LX.signalJob = signalJob;

  /** PID 에 신호 보내기. 오류 메시지 또는 null */
  function signalPid(c, pid, sig) {
    // 작업 프로세스 또는 작업의 자식 프로세스
    const own = c.m.procs.find((x) => x.pid === pid);
    const job = c.session.jobs.list.find((j) => j.pid === pid) || (own && (own.job || (c.m.procs.find((q) => q.pid === own.ppid && q.job) || {}).job));
    if (job && !job.done) {
      if (job.proc.user !== c.cred.name && c.cred.uid !== 0) return 'Operation not permitted';
      signalJob(c, job, sig);
      return null;
    }
    // 다른 세션(터미널)의 작업
    for (const s of c.m.sessions || []) {
      if (s === c.session) continue;
      const j = s.jobs && s.jobs.list.find((x) => x.pid === pid && !x.done);
      if (j) {
        if (j.proc.user !== c.cred.name && c.cred.uid !== 0) return 'Operation not permitted';
        if (IGNORE_SIGS.includes(sig)) return null;
        if (STOP_SIGS.includes(sig)) s.stopJob(j); else if (sig === 18) s.contJob(j); else s.killJob(j, sig);
        return null;
      }
    }
    const all = procTable(c);
    const p = all.find((x) => x.pid === pid);
    if (!p) return 'No such process';
    if (p.user !== c.cred.name && c.cred.uid !== 0) return 'Operation not permitted';
    if (sig === 0) return null;
    if (p.svc) {
      const s = c.m.state.services[p.svc];
      if (sig === 1) { LX.log(c.m, p.svc, `Reloading configuration (SIGHUP)`); return null; }
      if (sig === 9 || sig === 15 || sig === 2 || sig === 3) {
        if (p.pid === s.pid || p.ppid === 1) {
          LX.svcStop(c.m, p.svc);
          if (sig === 9) { s.failed = true; s.failMsg = `Main process exited, code=killed, status=9/KILL`; LX.log(c.m, 'systemd[1]', `${p.svc}.service: Main process exited, code=killed, status=9/KILL`); }
        }
      }
      return null;
    }
    if (p.container) { const ct = c.m.state.containers.find((x) => x.id === p.container); if (ct) ct.running = false; return null; }
    if (p.runtime || (c.m.runtime && Object.values(c.m.runtime.servers || {}).some((s) => s.pid === pid))) {
      Object.entries(c.m.runtime.servers).forEach(([port, s]) => { if (s.pid === pid) { if (s.stop) s.stop(); delete c.m.runtime.servers[port]; } });
      return null;
    }
    if (p.pid === 1 && c.cred.uid === 0) return null;
    if (p.sys && c.cred.uid !== 0) return 'Operation not permitted';
    if (STOP_SIGS.includes(sig)) p.stopped = true;
    if (sig === 18) p.stopped = false;
    return null;
  }
  LX.signalPid = signalPid;

  def('kill', async (c) => {
    const args = c.args.slice();
    if (!args.length) { c.err('kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]\n'); return 2; }
    if (args[0] === '-l' || args[0] === '-L' || args[0] === '--list') {
      if (args[1]) {
        const st = /^\d+$/.test(args[1]) ? SIGNALS[(+args[1] > 128 ? +args[1] - 128 : +args[1]) - 1] : sigNum(args[1]);
        if (st == null) { c.err(`bash: kill: ${args[1]}: invalid signal specification\n`); return 1; }
        c.out(st + '\n');
        return 0;
      }
      let out = '';
      SIGNALS.forEach((s, i) => { out += `${String(i + 1).padStart(2)}) SIG${s}`.padEnd(16) + ((i + 1) % 5 === 0 ? '\n' : '\t'); });
      c.out(out.replace(/\t$/, '') + '\n');
      return 0;
    }
    let sig = 15;
    if (args[0] === '-s' || args[0] === '-n') { sig = sigNum(args[1]); if (sig == null) { c.err(`bash: kill: ${args[1]}: invalid signal specification\n`); return 1; } args.splice(0, 2); }
    else if (args[0] === '--') args.shift();
    else if (/^-./.test(args[0])) { sig = sigNum(args[0].slice(1)); if (sig == null) { c.err(`bash: kill: ${args[0].slice(1)}: invalid signal specification\n`); return 1; } args.shift(); }
    if (!args.length) { c.err('kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]\n'); return 2; }
    let st = 0;
    for (const t of args) {
      if (t.startsWith('%')) {
        const j = c.session.jobs.get(t);
        if (!j) { c.err(`bash: kill: ${t}: no such job\n`); st = 1; continue; }
        signalJob(c, j, sig);
        continue;
      }
      if (!/^-?\d+$/.test(t)) { c.err(`bash: kill: ${t}: arguments must be process or job IDs\n`); st = 1; continue; }
      const e = signalPid(c, +t, sig);
      if (e) { c.err(`bash: kill: (${t}) - ${e}\n`); st = 1; }
    }
    return st;
  });

  function matchProcs(c, pat, full, users, extra) {
    const re = (() => { try { return new RegExp(pat, extra && extra.i ? 'i' : ''); } catch (e) { return new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); } })();
    const self = c.proc ? c.proc.pid : null;
    return procTable(c).filter((p) => {
      if (p.pid === self) return false;
      if (users && users.length && !users.includes(p.user)) return false;
      if (extra && extra.ppid && extra.ppid.length && !extra.ppid.includes(p.ppid)) return false;
      if (extra && extra.tty && extra.tty.length && !extra.tty.includes(p.tty || '?')) return false;
      if (extra && extra.pids && !extra.pids.includes(p.pid)) return false;
      if (pat == null) return true;
      const name = commOf(p);
      return full ? re.test(p.cmd) : re.test(name) || (p.svc && re.test(p.svc) && /^nginx|^apache|^php|^postgres/.test(p.cmd));
    });
  }

  def(['pgrep', 'pkill'], async (c) => {
    const args = c.args.slice();
    let sig = 15;
    // pkill -9 · pkill -HUP · pkill -SIGTERM
    if (c.name === 'pkill' && args[0] && /^-([A-Z]+[0-9]*|\d+)$/.test(args[0])) {
      const n = sigNum(args[0].slice(1));
      if (n == null) { c.err(`pkill: unknown signal name ${args[0].slice(1)}\n`); return 2; }
      sig = n; args.shift();
    }
    const { f, ops } = getopt(args, 'lafu:U:xnocd:P:t:ivs:g:G:', { 'list-name': 'l', 'list-full': 'a', full: 'f', euid: 'u:', uid: 'U:', exact: 'x', newest: 'n', oldest: 'o', count: 'c', delimiter: 'd:', parent: 'P:', terminal: 't:', 'ignore-case': 'i', inverse: 'v', signal: 'signal:', echo: 'e', pidfile: 'F:' });
    const pat = ops[0];
    const users = [].concat(f.u ? String(f.u).split(',') : [], f.U ? String(f.U).split(',') : []).map((u) => userArg(c, u));
    const ppid = f.P ? String(f.P).split(',').map(Number) : null;
    const tty = f.t ? String(f.t).split(',').map((t) => t.replace(/^\/dev\//, '')) : null;
    if (pat == null && !users.length && !ppid && !tty) { c.err(`${c.name}: no matching criteria specified\nTry \`${c.name} --help' for more information.\n`); return 2; }
    for (const u of users) if (c.m.credFor && !c.m.credFor(u) && !/^\d+$/.test(u)) { c.err(`${c.name}: invalid user name: ${u}\n`); return 2; }
    let list = matchProcs(c, pat == null ? null : f.x ? `^(?:${pat})$` : pat, f.f, users, { ppid, tty, i: f.i });
    if (f.v) { const ids = new Set(list.map((p) => p.pid)); list = procTable(c).filter((p) => !ids.has(p.pid) && (!c.proc || p.pid !== c.proc.pid)); }
    if (f.n) list = list.slice().sort((a, b) => (a.start || 0) - (b.start || 0) || a.pid - b.pid).slice(-1);
    if (f.o) list = list.slice().sort((a, b) => (a.start || 0) - (b.start || 0) || a.pid - b.pid).slice(0, 1);
    if (f.c && c.name === 'pgrep') { c.out(list.length + '\n'); return list.length ? 0 : 1; }
    if (!list.length) return 1;
    if (c.name === 'pgrep') {
      const d = f.d != null ? String(f.d) : '\n';
      const items = list.map((p) => `${p.pid}${f.a ? ' ' + p.cmd : f.l ? ' ' + commOf(p) : ''}`);
      c.out(items.join(d) + '\n');
      return 0;
    }
    if (f.signal) { const n = sigNum(f.signal); if (n == null) { c.err(`pkill: unknown signal name ${f.signal}\n`); return 2; } sig = n; }
    let st = 0;
    list.forEach((p) => { const e = signalPid(c, p.pid, sig); if (e) { c.err(`pkill: killing pid ${p.pid} failed: ${e}\n`); st = 1; } else if (f.e) c.out(`${commOf(p)} killed (pid ${p.pid})\n`); });
    return st;
  });

  def('killall', async (c) => {
    const args = c.args.filter((a) => !a.startsWith('-'));
    const sa = c.args.find((a) => /^-([A-Z]+|\d+)$/.test(a));
    const sig = sa ? sigNum(sa.slice(1)) || 15 : 15;
    let st = 0;
    for (const n of args) {
      const list = matchProcs(c, `^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, false);
      if (!list.length) { c.err(`${n}: no process found\n`); st = 1; continue; }
      list.forEach((p) => { const e = signalPid(c, p.pid, sig); if (e) { c.err(`${n}(${p.pid}): ${e}\n`); st = 1; } });
    }
    return st;
  });

  def('pidof', async (c) => {
    const names = c.args.filter((a) => !a.startsWith('-'));
    const list = [];
    for (const n of names) list.push(...matchProcs(c, `^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, false).filter((p) => !/^\[/.test(p.cmd)));
    if (!list.length) return 1;
    const s = c.args.includes('-s') ? list.slice(-1) : list;
    c.out(s.map((p) => p.pid).sort((a, b) => b - a).join(' ') + '\n');
    return 0;
  });

  def('pstree', async (c) => {
    const list = procTable(c).filter((p) => !p.cmd.startsWith('[') && p.pid !== 1);
    const name = (p) => commOf(p);
    const groups = {};
    list.filter((p) => p.ppid === 1 || !list.some((q) => q.pid === p.ppid)).forEach((p) => { const n = name(p); groups[n] = (groups[n] || 0) + 1; });
    const kids = (p) => list.filter((q) => q.ppid === p.pid && q.pid !== p.pid);
    const keys = Object.keys(groups).sort();
    const showPid = c.args.includes('-p');
    let out = 'systemd' + (showPid ? '(1)' : '');
    const pad = ' '.repeat(out.length);
    keys.forEach((k, i) => {
      const first = i === 0, last = i === keys.length - 1;
      const branch = first ? (keys.length > 1 ? '─┬─' : '───') : last ? ' └─' : ' ├─';
      const p = list.find((q) => name(q) === k && (q.ppid === 1 || !list.some((r) => r.pid === q.ppid)));
      let label = (groups[k] > 1 ? `${groups[k]}*[${k}]` : k) + (showPid && p ? `(${p.pid})` : '');
      let ks = p ? kids(p) : [];
      // 한 단계 더 (셸 → 작업 · 명령)
      let chain = p;
      while (ks.length === 1) {
        const q = ks[0];
        label += '───' + name(q) + (showPid ? `(${q.pid})` : '');
        chain = q;
        ks = kids(q);
      }
      void chain;
      if (ks.length) {
        const kn = {};
        ks.forEach((q) => { kn[name(q)] = (kn[name(q)] || 0) + 1; });
        const parts = Object.entries(kn).map(([n, cnt]) => (cnt > 1 ? `${cnt}*[${n}]` : n));
        label += parts.length === 1 ? '───' + parts[0] : '─┬─' + parts[0] + parts.slice(1).map((x, j) => '\n' + pad + (last ? '   ' : ' │ ') + ' '.repeat(label.length) + (j === parts.length - 2 ? ' └─' : ' ├─') + x).join('');
      }
      out += (first ? '' : '\n' + pad) + branch + label;
    });
    c.out(out + '\n');
    return 0;
  });

  /** 현재 셸 프로세스의 nice 값 */
  function curNice(c) {
    const pid = c.sh.pid || c.session.shellPid;
    const p = c.m.procs.find((x) => x.pid === pid);
    return (c.io && c.io.job && c.io.job.proc ? c.io.job.proc.ni : null) || (p && p.ni) || 0;
  }
  def(['nice'], async (c) => {
    let args = c.args.slice();
    let n = 10;
    if (args[0] === '-n' || args[0] === '--adjustment') { n = +args[1]; args = args.slice(2); }
    else if (/^--adjustment=/.test(args[0] || '')) { n = +args[0].split('=')[1]; args = args.slice(1); }
    else if (/^-n-?\d+$/.test(args[0] || '')) { n = +args[0].slice(2); args = args.slice(1); }
    else if (/^--?\d+$/.test(args[0] || '')) { n = +args[0].replace(/^-/, ''); args = args.slice(1); }
    if (Number.isNaN(n)) { c.err(`nice: invalid adjustment '${c.args[1]}'\n`); return 125; }
    const cur = curNice(c);
    if (!args.length) { c.out(cur + '\n'); return 0; }
    let ni = Math.max(-20, Math.min(19, cur + n));
    if (ni < cur && c.cred.uid !== 0) { c.err(`nice: cannot set niceness: Permission denied\n`); ni = cur; }
    if (c.proc) c.proc.ni = ni;
    return c.sh.invoke(args, Object.assign({}, c.io, { execProc: c.proc }));
  });
  def('renice', async (c) => {
    const args = c.args.slice();
    let n = null, kind = 'p';
    const targets = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-n' || a === '--priority' || a === '--relative') n = +args[++i];
      else if (a === '-p' || a === '--pid') kind = 'p';
      else if (a === '-u' || a === '--user') kind = 'u';
      else if (a === '-g' || a === '--pgrp') kind = 'g';
      else if (n == null && /^[-+]?\d+$/.test(a)) n = +a;
      else targets.push([kind, a]);
    }
    if (n == null || !targets.length) { c.err("renice: not enough arguments\nTry 'renice --help' for more information.\n"); return 1; }
    let st = 0;
    for (const [k, t] of targets) {
      let procs;
      if (k === 'u') { const u = userArg(c, t); procs = procTable(c).filter((p) => p.user === u); if (c.m.credFor && !c.m.credFor(u)) { c.err(`renice: unknown user ${t}\n`); st = 1; continue; } }
      else procs = procTable(c).filter((p) => p.pid === +t);
      const label = k === 'u' ? `${t} (user ID)` : k === 'g' ? `${t} (process group ID)` : `${t} (process ID)`;
      if (!procs.length) { c.err(`renice: failed to get priority for ${label}: No such process\n`); st = 1; continue; }
      const p0 = procs[0];
      const old = p0.ni || 0;
      const ni = Math.max(-20, Math.min(19, n));
      if ((ni < old && c.cred.uid !== 0) || (p0.user !== c.cred.name && c.cred.uid !== 0)) { c.err(`renice: failed to set priority for ${label}: ${p0.user !== c.cred.name ? 'Operation not permitted' : 'Permission denied'}\n`); st = 1; continue; }
      procs.forEach((p) => { const real = c.m.procs.find((x) => x.pid === p.pid); if (real) real.ni = ni; });
      c.out(`${label} old priority ${old}, new priority ${ni}\n`);
    }
    return st;
  });
  def('nohup', async (c) => {
    if (!c.args.length) { c.err("nohup: missing operand\nTry 'nohup --help' for more information.\n"); return 125; }
    let io = Object.assign({}, c.io, { execProc: c.proc });
    if (c.tty) {
      c.err("nohup: ignoring input and appending output to 'nohup.out'\n");
      const abs = c.resolve('nohup.out');
      io = Object.assign(io, { out: (s) => { try { c.fs.writeFile(abs, s, c.cred, { append: true, mode: 0o600 }); } catch (e) { /* 무시 */ } }, tty: false });
    }
    if (c.io && c.io.job) c.io.job.nohup = true;
    return c.sh.invoke(c.args, io);
  });

  // bg: 멈춘 작업을 백그라운드에서 이어서 실행 (builtins.js 의 bg 를 작업 제어에 맞게 덮어쓴다)
  if (LX.BUILTINS) {
    // jobs: 현재(+) · 이전(-) 표시, 멈춘 작업은 & 없이, 끝난 작업은 한 번만 알린다 (bash 와 같게)
    LX.BUILTINS.jobs = async (c) => {
      const J = c.session.jobs;
      const opts = c.args.filter((a) => /^-[lpnrs]+$/.test(a)).join('');
      const specs = c.args.filter((a) => !/^-[lpnrs]+$/.test(a));
      let list = specs.length ? specs.map((s) => J.get(s)).filter(Boolean) : J.list.slice();
      if (specs.length && !list.length) { c.err(`bash: jobs: ${specs[0]}: no such job\n`); return 1; }
      if (opts.includes('r')) list = list.filter((j) => !j.done && !j.stopped);
      if (opts.includes('s')) list = list.filter((j) => j.stopped);
      if (opts.includes('p')) { list.forEach((j) => c.out(j.pid + '\n')); return 0; }
      const marks = new Map(list.map((j) => [j, J.mark ? J.mark(j) : ' ']));
      list.forEach((j) => {
        const sig = j.killed === true ? 15 : j.killed;
        const st = j.done ? (sig ? (LX.SIG_DESC && LX.SIG_DESC[sig]) || `Signal ${sig}` : j.status ? `Exit ${j.status}` : 'Done') : j.stopped ? 'Stopped' : 'Running';
        c.out(`[${j.id}]${marks.get(j)}  ${opts.includes('l') ? j.pid + ' ' : ''}${st.padEnd(24)}${j.text}${j.done || j.stopped ? '' : ' &'}\n`);
      });
      // 이미 보여 준 끝난 작업은 목록에서 뺀다
      list.filter((j) => j.done).forEach((j) => { const i = J.list.indexOf(j); if (i >= 0) J.list.splice(i, 1); J.finished = J.finished.filter((x) => x !== j); });
      if (J.notices) J.notices = J.notices.filter((j) => !list.includes(j));
      return 0;
    };
    LX.BUILTINS.bg = async (c) => {
      const specs = c.args.length ? c.args : [null];
      let st = 0;
      for (const s of specs) {
        const j = c.session.jobs.get(s);
        if (!j) { c.err(`bash: bg: ${s || 'current'}: no such job\n`); st = 1; continue; }
        if (!j.stopped) { c.err(`bash: bg: job ${j.id} already in background\n`); continue; }
        if (c.session.contJob) c.session.contJob(j);
        c.out(`[${j.id}]+ ${j.text} &\n`);
      }
      return st;
    };
  }

  function parseDur(s) {
    const r = /^(\d+(?:\.\d+)?)([smhd]?)$/.exec(String(s));
    if (!r) return null;
    return +r[1] * { '': 1, s: 1, m: 60, h: 3600, d: 86400 }[r[2]] * 1000;
  }
  def('sleep', async (c) => {
    if (!c.args.length) { c.err("sleep: missing operand\nTry 'sleep --help' for more information.\n"); return 1; }
    let ms = 0;
    for (const a of c.args) {
      const d = parseDur(a);
      if (d == null) { c.err(`sleep: invalid time interval '${a}'\nTry 'sleep --help' for more information.\n`); return 1; }
      ms += d;
    }
    await c.sleep(ms);
    return 0;
  });

  def('timeout', async (c) => {
    const args = c.args.filter((a) => !/^-(s|k|-signal|-kill-after|-preserve-status|-foreground|v)/.test(a));
    const ms = parseDur(args[0]);
    if (ms == null) { c.err(`timeout: invalid time interval '${args[0]}'\n`); return 125; }
    const cmd = args.slice(1);
    if (c.session.headless) return c.sh.invoke(cmd, c.io);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; c.session.abort(); }, ms);
    try { const r = await c.sh.invoke(cmd, c.io); return r; } catch (e) { if (timedOut) return 124; throw e; } finally { clearTimeout(timer); if (timedOut) c.session.aborted = false; }
  });

  def('watch', async (c) => {
    const args = c.args.slice();
    let n = 2;
    while (args.length && args[0].startsWith('-')) {
      const a = args.shift();
      if (a === '-n') n = +args.shift();
      else if (/^-n\d/.test(a)) n = +a.slice(2);
      else if (a === '-d' || a === '-t' || a === '-c') continue;
    }
    const cmd = args.join(' ');
    const once = c.session.headless || !c.tty;
    for (let i = 0; ; i++) {
      let buf = '';
      const sub = c.sh.child('sub');
      await sub.runSource(cmd, { stdin: null, out: (s) => { buf += s; }, err: (s) => { buf += s; }, tty: false });
      if (!once) c.out('\x1b[H\x1b[2J');
      c.out(`Every ${n.toFixed(1)}s: ${cmd}${' '.repeat(Math.max(2, 50 - cmd.length))}${c.m.hostname()}: ${strftime(c.m, '%a %b %e %H:%M:%S %Y', c.m.now())}\n\n${buf}`);
      if (once) return 0;
      if (i === 0) c.out('\x1b[2m(가상 터미널: Ctrl+C 로 끝냅니다)\x1b[0m\n');
      await c.sleep(n * 1000);
    }
  });

  LX.BUILTINS.time = async (c) => {
    const args = c.args.filter((a) => a !== '-p');
    const t0 = Date.now();
    let st = 0;
    if (args.length) st = await c.sh.invoke(args, c.io);
    const s = (Date.now() - t0) / 1000 + (c.session.headless ? 0.004 : 0);
    const f = (x) => `${Math.floor(x / 60)}m${(x % 60).toFixed(3)}s`;
    c.err(`\nreal\t${f(s)}\nuser\t${f(s * 0.05)}\nsys\t${f(s * 0.02)}\n`);
    return st;
  };
  LX.BUILTINS.ulimit = async (c) => {
    if (c.args.includes('-a')) { c.out('real-time non-blocking time  (microseconds, -R) unlimited\ncore file size              (blocks, -c) 0\ndata seg size               (kbytes, -d) unlimited\nscheduling priority                 (-e) 0\nfile size                   (blocks, -f) unlimited\npending signals                     (-i) 15216\nmax locked memory           (kbytes, -l) 500544\nmax memory size             (kbytes, -m) unlimited\nopen files                          (-n) 1024\npipe size                (512 bytes, -p) 8\nPOSIX message queues         (bytes, -q) 819200\nreal-time priority                  (-r) 0\nstack size                  (kbytes, -s) 8192\ncpu time                   (seconds, -t) unlimited\nmax user processes                  (-u) 15216\nvirtual memory              (kbytes, -v) unlimited\nfile locks                          (-x) unlimited\n'); return 0; }
    if (c.args.includes('-n')) { c.out('1024\n'); return 0; }
    c.out('unlimited\n');
    return 0;
  };

  def(['env', 'printenv'], async (c) => {
    const args = c.args.slice();
    if (c.name === 'printenv') {
      if (args.length) { let st = 0; args.forEach((k) => { const e = c.sh.vars[k]; if (e && e.x) c.out(c.sh.getVar(k) + '\n'); else st = 1; }); return st; }
      const env = c.sh.exportedEnv();
      Object.keys(env).forEach((k) => c.out(`${k}=${env[k]}\n`));
      return 0;
    }
    let clean = false;
    const assigns = {};
    while (args.length) {
      if (args[0] === '-i' || args[0] === '-') { clean = true; args.shift(); continue; }
      if (args[0] === '-u') { args.shift(); delete assigns[args.shift()]; continue; }
      if (/^[A-Za-z_]\w*=/.test(args[0])) { const [k, v] = args.shift().split(/=(.*)/s); assigns[k] = v; continue; }
      break;
    }
    if (!args.length) {
      const env = clean ? {} : c.sh.exportedEnv();
      Object.assign(env, assigns);
      Object.keys(env).forEach((k) => c.out(`${k}=${env[k]}\n`));
      return 0;
    }
    const child = c.sh.child('script');
    if (clean) child.vars = {};
    Object.entries(assigns).forEach(([k, v]) => { child.vars[k] = { v, x: true }; });
    return child.invoke(args, c.io);
  });

  // ======================================================================= 편집기
  /** 파일을 편집기 창에서 연다 (저장 권한은 cred 로 검사) */
  LX.editFile = async function (c, abs, cred, opts = {}) {
    const fs = c.fs;
    let text = '';
    let exists = false;
    let readonly = false;
    try {
      const n = fs.stat(abs, cred);
      if (n.t === 'd') { c.err(`"${abs}" is a directory\n`); return 1; }
      text = fs.readFile(abs, cred);
      exists = true;
      readonly = !fs.perm(n, cred, 2);
    } catch (e) {
      if (e.code === 'EACCES') { text = ''; exists = !!fs.lookup(abs); readonly = true; if (exists) { c.err(`[ Error reading ${abs}: Permission denied ]\n`); } }
      else if (e.code !== 'ENOENT') { c.err(`${e.message}\n`); return 1; }
      else {
        const dir = fs.lookup(LX.path.dirname(abs));
        if (!dir) { c.err(`[ Directory '${LX.path.dirname(abs)}' does not exist ]\n`); return 1; }
        readonly = !fs.perm(dir, cred, 2);
      }
    }
    if (c.session.headless) return 0;
    const res = await c.session.openEditor(abs, { text, exists, readonly, editor: opts.editor || c.name, user: cred.name, save: (newText) => {
      try {
        if (!fs.lookup(abs)) fs.writeFile(abs, newText, cred, { mode: 0o666 & ~(c.sh ? c.sh.umask : 0o002) });
        else fs.writeFile(abs, newText, cred);
        return null;
      } catch (e) {
        return e.message;
      }
    } });
    if (opts.after) await opts.after(res);
    return 0;
  };

  def(['nano', 'rnano', 'vim', 'vi', 'view', 'vimdiff', 'ex', 'gedit', 'pico', 'emacs', 'mcedit'], async (c) => {
    const ops = c.args.filter((a) => !a.startsWith('-') && !a.startsWith('+'));
    if (c.name === 'vimtutor') ops.length = 0;
    const file = ops[0];
    if (!file) {
      if (c.session.headless) return 0;
      c.err(`\x1b[2m(가상 터미널) 편집할 파일 이름을 함께 입력하세요. 예: ${c.name} memo.txt\x1b[0m\n`);
      return 1;
    }
    const abs = c.resolve(file);
    return LX.editFile(c, abs, c.cred, { editor: c.name });
  });

  def('visudo', async (c) => {
    if (c.cred.uid !== 0) { c.err('visudo: /etc/sudoers: Permission denied\n'); return 1; }
    if (c.args.includes('-c')) { c.out('/etc/sudoers: parsed OK\n/etc/sudoers.d/README: parsed OK\n'); return 0; }
    const f = c.args.indexOf('-f') >= 0 ? c.resolve(c.args[c.args.indexOf('-f') + 1]) : '/etc/sudoers';
    return LX.editFile(c, f, c.cred, { editor: 'visudo' });
  });

  // ======================================================================= 셸 실행 파일
  def(['bash', 'sh', 'dash', 'rbash'], async (c) => {
    const args = c.args.slice();
    let opts = { x: false, e: false, n: false };
    while (args.length && /^-[xevnu]+$/.test(args[0])) { const a = args.shift(); for (const ch of a.slice(1)) opts[ch] = true; }
    if (args[0] === '--version') { c.out('GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)\nCopyright (C) 2022 Free Software Foundation, Inc.\nLicense GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>\n\nThis is free software; you are free to change and redistribute it.\nThere is NO WARRANTY, to the extent permitted by law.\n'); return 0; }
    if (args[0] === '-c') {
      const child = c.sh.child('script');
      child.name0 = args[2] || c.name;
      child.pos = args.slice(3);
      if (c.proc) child.pid = c.proc.pid;
      Object.assign(child.opts, { x: opts.x, e: opts.e, u: opts.u });
      return child.runMain(args[1] || '', c.io);
    }
    if (args[0] === '-l' || args[0] === '-i' || args[0] === '--login') args.shift();
    if (!args.length) {
      if (c.stdin) {
        const child = c.sh.child('script');
        return child.runMain(c.stdin.readAll(), c.io);
      }
      if (!LX.canPush(c)) return 0;
      await c.session.pushShell(c.cred.name, { keepEnv: true });
      return 0;
    }
    const abs = c.resolve(args[0]);
    let text;
    try { text = c.fs.readFile(abs, c.cred); } catch (e) { c.err(`${c.name}: ${args[0]}: ${e.message}\n`); return 127; }
    if (opts.n) {
      try { LX.parse(text); return 0; } catch (e) { c.err(`${args[0]}: ${e instanceof LX.sig.Incomplete ? 'syntax error: unexpected end of file' : e.message}\n`); return 2; }
    }
    const child = c.sh.child('script');
    child.name0 = args[0];
    child.pos = args.slice(1);
    child.funcs = {};
    Object.assign(child.opts, { x: opts.x, e: opts.e, u: opts.u });
    if (c.proc) child.pid = c.proc.pid;   // 이 bash 프로세스가 스크립트를 실행한다 ($$)
    return child.runMain(text, c.io);
  });

  // ======================================================================= 화면 · 기타
  def(['clear', 'reset'], async (c) => { c.out('\x1b[H\x1b[2J\x1b[3J'); return 0; });
  def('tput', async (c) => {
    const a = c.args;
    const cap = a[0];
    const cols = c.session.cols || 80;
    const map = { cols: String(cols) + '\n', lines: '24\n', colors: '256\n', bold: '\x1b[1m', sgr0: '\x1b[0m', smul: '\x1b[4m', rmul: '\x1b[24m', rev: '\x1b[7m', clear: '\x1b[H\x1b[2J', dim: '\x1b[2m' };
    if (cap === 'setaf' || cap === 'setab') { const n = +a[1]; c.out(`\x1b[${cap === 'setaf' ? 3 : 4}${n < 8 ? n : '8;5;' + n}m`); return 0; }
    if (map[cap] != null) { c.out(map[cap]); return 0; }
    return 1;
  });
  def('stty', async (c) => { if (c.args.includes('size')) c.out(`24 ${c.session.cols || 80}\n`); else if (!c.args.length || c.args.includes('-a')) c.out('speed 38400 baud; rows 24; columns 80; line = 0;\n'); return 0; });

  def('logger', async (c) => {
    const { f, ops } = getopt(c.args, 't:p:si', { tag: 't:', priority: 'p:' });
    const msg = ops.length ? ops.join(' ') : (await c.readStdin()).trim();
    const lv = String(f.p || 'user.notice').split('.').pop().toLowerCase();
    const PRI = { emerg: 0, panic: 0, alert: 1, crit: 2, err: 3, error: 3, warning: 4, warn: 4, notice: 5, info: 6, debug: 7 };
    const prio = /^\d$/.test(lv) ? +lv : PRI[lv] != null ? PRI[lv] : 5;
    if (f.s) c.err(`<${8 + prio}>${LX.strftime ? LX.strftime(c.m, '%b %e %H:%M:%S', c.m.now()) : ''} ${f.t || c.cred.name}: ${msg}\n`);
    LX.log(c.m, (f.t || c.cred.name) + (f.i ? `[${c.proc ? c.proc.pid : c.m.pidSeq}]` : ''), msg, undefined, prio);
    return 0;
  });
  def('wall', async (c) => {
    const msg = c.args.length ? c.args.join(' ') : (await c.readStdin());
    c.out(`\nBroadcast message from ${c.cred.name}@${c.m.hostname()} (pts/0) (${strftime(c.m, '%a %b %e %H:%M:%S %Y', c.m.now())}):\n\n${msg.replace(/\n?$/, '\n')}\n`);
    return 0;
  });
  def('mesg', async (c) => { if (!c.args.length) c.out('is y\n'); return 0; });
  def(['write'], async (c) => { c.err(`write: ${c.args[0] || ''} is not logged in on pts/1\n`); return 1; });

  def(['tmux', 'screen'], async (c) => {
    if (c.args.includes('-V') || c.args.includes('-v') || c.args.includes('--version')) { c.out(c.name === 'tmux' ? 'tmux 3.4\n' : 'Screen version 4.09.01 (GNU) 20-Aug-23\n'); return 0; }
    if (c.args[0] === 'ls' || c.args[0] === 'list-sessions' || c.args.includes('-ls')) { c.out(c.name === 'tmux' ? 'no server running on /tmp/tmux-1000/default\n' : 'No Sockets found in /run/screen/S-student.\n\n'); return 1; }
    c.err(`${c.name}: 가상 터미널에서는 화면 분할 · 세션 유지 기능을 지원하지 않습니다.\n       실제 Ubuntu 에서 '${c.name}' 을 실행해 보세요. (세션 끊김에도 작업을 유지하는 데 씁니다)\n`);
    return 1;
  });

  def('neofetch', async (c) => {
    const x = LX.memInfo(c.m);
    const logo = [
      '            .-/+oossssoo+/-.',
      '        `:+ssssssssssssssssss+:`',
      '      -+ssssssssssssssssssyyssss+-',
      '    .ossssssssssssssssssdMMMNysssso.',
      '   /ssssssssssshdmmNNmmyNMMMMhssssss/',
      '  +ssssssssshmydMMMMMMMNddddyssssssss+',
      ' /sssssssshNMMMyhhyyyyhmNMMMNhssssssss/',
      '.ssssssssdMMMNhsssssssssshNMMMdssssssss.',
      '+sssshhhyNMMNyssssssssssssyNMMMysssssss+',
      'ossyNMMMNyMMhsssssssssssssshmmmhssssssso',
      'ossyNMMMNyMMhsssssssssssssshmmmhssssssso',
      '+sssshhhyNMMNyssssssssssssyNMMMysssssss+',
      '.ssssssssdMMMNhsssssssssshNMMMdssssssss.',
      ' /sssssssshNMMMyhhyyyyhdNMMMNhssssssss/',
      '  +sssssssssdmydMMMMMMMMddddyssssssss+',
      '   /ssssssssssshdmNNNNmyNMMMMhssssss/',
      '    .ossssssssssssssssssdMMMNysssso.',
      '      -+sssssssssssssssssyyyssss+-',
      '        `:+ssssssssssssssssss+:`',
      '            .-/+oossssoo+/-.'
    ];
    const info = [
      `\x1b[1;31m${c.cred.name}\x1b[0m@\x1b[1;31m${c.m.hostname()}\x1b[0m`,
      '-'.repeat(c.cred.name.length + c.m.hostname().length + 1),
      `\x1b[1;31mOS\x1b[0m: ${LX.OS.pretty} x86_64`,
      '\x1b[1;31mHost\x1b[0m: VirtualBox 1.2',
      `\x1b[1;31mKernel\x1b[0m: ${LX.OS.kernel}`,
      `\x1b[1;31mUptime\x1b[0m: ${uptimeStr(c.m).replace(/(\d+) min/, '$1 mins')}`,
      `\x1b[1;31mPackages\x1b[0m: ${Object.keys(c.m.state.pkgs).length * 11 + 180} (dpkg), 3 (snap)`,
      '\x1b[1;31mShell\x1b[0m: bash 5.2.21',
      '\x1b[1;31mTerminal\x1b[0m: /dev/pts/0',
      '\x1b[1;31mCPU\x1b[0m: 12th Gen Intel i5-1240P (2) @ 2.111GHz',
      '\x1b[1;31mGPU\x1b[0m: 00:02.0 VMware SVGA II Adapter',
      `\x1b[1;31mMemory\x1b[0m: ${Math.round(x.used / 1024)}MiB / ${Math.round(x.total / 1024)}MiB`
    ];
    c.out(logo.map((l, i) => `\x1b[1;31m${l.padEnd(40)}\x1b[0m ${info[i] || ''}`).join('\n') + '\n');
    return 0;
  });

  def(['cowsay', 'cowthink'], async (c) => {
    const msg = c.args.filter((a) => !a.startsWith('-')).join(' ') || (await c.readStdin()).trim();
    const think = c.name === 'cowthink';
    const w = Math.min(40, Math.max(...msg.split('\n').map((l) => LX.visLen(l))));
    const lines = msg.split('\n');
    let out = ' ' + '_'.repeat(w + 2) + '\n';
    if (lines.length === 1) out += `${think ? '(' : '<'} ${lines[0]}${' '.repeat(w - LX.visLen(lines[0]))} ${think ? ')' : '>'}\n`;
    else lines.forEach((l, i) => { out += `${i === 0 ? '/' : i === lines.length - 1 ? '\\' : '|'} ${l}${' '.repeat(w - LX.visLen(l))} ${i === 0 ? '\\' : i === lines.length - 1 ? '/' : '|'}\n`; });
    out += ' ' + '-'.repeat(w + 2) + '\n';
    const t = think ? 'o' : '\\';
    out += `        ${t}   ^__^\n         ${t}  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||\n`;
    c.out(out);
    return 0;
  });

  const FIG = { A: [' _ ', '/_\\', '| |'], B: ['__ ', '|_)', '|_)'] };
  void FIG;
  def('figlet', async (c) => {
    const text = c.args.filter((a) => !a.startsWith('-')).join(' ') || (await c.readStdin()).trim();
    const font = {
      A: ['    _    ', '   / \\   ', '  / _ \\  ', ' / ___ \\ ', '/_/   \\_\\'], B: [' ____  ', '| __ ) ', '|  _ \\ ', '| |_) |', '|____/ '], C: ['  ____ ', ' / ___|', '| |    ', '| |___ ', ' \\____|'],
      D: [' ____  ', '|  _ \\ ', '| | | |', '| |_| |', '|____/ '], E: [' _____ ', '| ____|', '|  _|  ', '| |___ ', '|_____|'], F: [' _____ ', '|  ___|', '| |_   ', '|  _|  ', '|_|    '],
      G: ['  ____ ', ' / ___|', '| |  _ ', '| |_| |', ' \\____|'], H: [' _   _ ', '| | | |', '| |_| |', '|  _  |', '|_| |_|'], I: [' ___ ', '|_ _|', ' | | ', ' | | ', '|___|'],
      J: ['     _ ', '    | |', ' _  | |', '| |_| |', ' \\___/ '], K: [' _  __', '| |/ /', "| ' / ", '| . \\ ', '|_|\\_\\'], L: [' _     ', '| |    ', '| |    ', '| |___ ', '|_____|'],
      M: [' __  __ ', '|  \\/  |', '| |\\/| |', '| |  | |', '|_|  |_|'], N: [' _   _ ', '| \\ | |', '|  \\| |', '| |\\  |', '|_| \\_|'], O: ['  ___  ', ' / _ \\ ', '| | | |', '| |_| |', ' \\___/ '],
      P: [' ____  ', '|  _ \\ ', '| |_) |', '|  __/ ', '|_|    '], Q: ['  ___  ', ' / _ \\ ', '| | | |', '| |_| |', ' \\__\\_\\'], R: [' ____  ', '|  _ \\ ', '| |_) |', '|  _ < ', '|_| \\_\\'],
      S: [' ____  ', '/ ___| ', '\\___ \\ ', ' ___) |', '|____/ '], T: [' _____ ', '|_   _|', '  | |  ', '  | |  ', '  |_|  '], U: [' _   _ ', '| | | |', '| | | |', '| |_| |', ' \\___/ '],
      V: ['__     __', '\\ \\   / /', ' \\ \\ / / ', '  \\ V /  ', '   \\_/   '], W: ['__        __', '\\ \\      / /', ' \\ \\ /\\ / / ', '  \\ V  V /  ', '   \\_/\\_/   '], X: ['__  __', '\\ \\/ /', ' \\  / ', ' /  \\ ', '/_/\\_\\'],
      Y: ['__   __', '\\ \\ / /', ' \\ V / ', '  | |  ', '  |_|  '], Z: [' _____', '|__  /', '  / / ', ' / /_ ', '/____|'], ' ': ['  ', '  ', '  ', '  ', '  '],
      '!': [' _ ', '| |', '| |', '|_|', '(_)'], '0': ['  ___  ', ' / _ \\ ', '| | | |', '| |_| |', ' \\___/ '], '1': [' _ ', '/ |', '| |', '| |', '|_|'], '2': [' ____  ', '|___ \\ ', '  __) |', ' / __/ ', '|_____|'], '4': [' _  _   ', '| || |  ', '| || |_ ', '|__   _|', '   |_|  ']
    };
    const up = text.toUpperCase();
    const rows = ['', '', '', '', ''];
    for (const ch of up) { const g = font[ch] || font[' ']; for (let i = 0; i < 5; i++) rows[i] += g[i]; }
    c.out(rows.map((r) => r.replace(/\s+$/, '')).join('\n') + '\n\n');
    return 0;
  });

  def('fortune', async (c) => {
    const list = ['Linux is only free if your time has no value. -- Jamie Zawinski', 'The best way to predict the future is to invent it. -- Alan Kay', 'Talk is cheap. Show me the code. -- Linus Torvalds', 'Simplicity is prerequisite for reliability. -- Edsger W. Dijkstra', 'There is no place like 127.0.0.1', 'rm -rf / : 절대 실행하지 마세요!', '가장 좋은 백업은 복원해 본 백업이다.', 'sudo make me a sandwich.'];
    c.out(list[Math.floor(Math.random() * list.length)] + '\n');
    return 0;
  });

  def('sl', async (c) => {
    const train = ['      ====        ________                ___________', '  _D _|  |_______/        \\__I_I_____===__|_________|', '   |(_)---  |   H\\________/ |   |        =|___ ___|', '   /     |  |   H  |  |     |   |         ||_| |_||', '  |      |  |   H  |__--------------------| [___] |', '  | ________|___H__/__|_____/[][]~\\_______|       |', '  |/ |   |-----------I_____I [][] []  D   |=======|__', '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__', ' |/-=|___|=    ||    ||    ||    |_____/~\\___/', '  \\_/      \\O=====O=====O=====O_/      \\_/'];
    c.out(train.join('\n') + '\n\x1b[2m(sl: "ls" 를 거꾸로 입력했을 때 지나가는 기차입니다)\x1b[0m\n');
    return 0;
  });

  // ======================================================================= 커널 · 장치 정보
  def('dmesg', async (c) => {
    if (c.cred.uid !== 0) { c.err('dmesg: read kernel buffer failed: Operation not permitted\n'); return 1; }
    const lines = ['[    0.000000] Linux version ' + LX.OS.kernel + ' (buildd@lcy02-amd64-015) (x86_64-linux-gnu-gcc-13 (Ubuntu 13.3.0-6ubuntu2~24.04) 13.3.0, GNU ld (GNU Binutils for Ubuntu) 2.42) ' + LX.OS.kernelBuild,
      '[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-' + LX.OS.kernel + ' root=/dev/mapper/ubuntu--vg-ubuntu--lv ro',
      '[    0.000000] DMI: innotek GmbH VirtualBox/VirtualBox, BIOS VirtualBox 12/01/2006',
      '[    0.000000] Hypervisor detected: KVM',
      '[    0.052113] Memory: 3960812K/4193848K available (22528K kernel code, 4432K rwdata, 14788K rodata, 4892K init, 4656K bss, 232776K reserved, 0K cma-reserved)',
      '[    0.108902] smpboot: Allowing 2 CPUs, 0 hotplug CPUs',
      '[    1.201442] ata1.00: ATA-6: VBOX HARDDISK, 1.0, max UDMA/133',
      '[    1.203116] scsi 0:0:0:0: Direct-Access     ATA      VBOX HARDDISK    1.0  PQ: 0 ANSI: 5',
      '[    1.204981] sd 0:0:0:0: [sda] 52428800 512-byte logical blocks: (26.8 GB/25.0 GiB)',
      '[    1.206102] sd 1:0:0:0: [sdb] 20971520 512-byte logical blocks: (10.7 GB/10.0 GiB)',
      '[    1.312904] e1000 0000:00:03.0 eth0: (PCI:33MHz:32-bit) 08:00:27:4e:66:a1',
      '[    1.314211] e1000 0000:00:03.0 enp0s3: renamed from eth0',
      '[    2.100121] EXT4-fs (dm-0): mounted filesystem a7d3b1f2-0c55-4d8e-8f1a-93e7c2b4d610 ro with ordered data mode. Quota mode: none.',
      '[    3.411503] systemd[1]: systemd 255.4-1ubuntu8.10 running in system mode (+PAM +AUDIT +SELINUX +APPARMOR +IMA +SMACK +SECCOMP +GCRYPT -GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 -IDN +IPTC +KMOD +LIBCRYPTSETUP +LIBFDISK +PCRE2 -PWQUALITY +P11KIT +QRENCODE +TPM2 +BZIP2 +LZ4 +XZ +ZLIB +ZSTD -BPF_FRAMEWORK -XKBCOMMON +UTMP +SYSVINIT default-hierarchy=unified)',
      '[    3.522871] systemd[1]: Hostname set to <' + c.m.hostname() + '>.',
      '[    4.910444] EXT4-fs (sda2): mounted filesystem 4c1f2c9a-6d3b-4c3e-9d58-2b1a7f0c6e11 r/w with ordered data mode. Quota mode: none.',
      '[    5.620093] e1000: enp0s3 NIC Link is Up 1000 Mbps Full Duplex, Flow Control: RX',
      '[    6.117325] Adding 4194300k swap on /swap.img.  Priority:-2 extents:6 across:4308988k FS'].concat((c.m.state.dmesg || []));
    const n = c.args.includes('-T') ? lines.map((l) => l.replace(/^\[\s*[\d.]+\]/, `[${strftime(c.m, '%a %b %e %H:%M:%S %Y', c.m.bootTime)}]`)) : lines;
    c.out(n.join('\n') + '\n');
    return 0;
  });
  def('lsmod', async (c) => {
    c.out('Module                  Size  Used by\nvboxguest             512000  0\nsnd_intel8x0           53248  0\ne1000                 180224  0\next4                 1077248  2\nmbcache                16384  1 ext4\njbd2                  196608  1 ext4\ndm_mod                184320  1\nahci                   49152  2\nlibahci                53248  1 ahci\nvideo                  77824  0\n');
    return 0;
  });
  def(['modprobe', 'insmod', 'rmmod', 'modinfo'], async (c) => { if (c.cred.uid !== 0 && c.name !== 'modinfo') { c.err(`${c.name}: ERROR: could not insert '${c.args[0]}': Operation not permitted\n`); return 1; } if (c.name === 'modinfo') c.out(`filename:       /lib/modules/${LX.OS.kernel}/kernel/drivers/${c.args[0]}.ko.zst\nlicense:        GPL\n`); return 0; });
  def('lspci', async (c) => { c.out('00:00.0 Host bridge: Intel Corporation 440FX - 82441FX PMC [Natoma] (rev 02)\n00:01.0 ISA bridge: Intel Corporation 82371SB PIIX3 ISA [Natoma/Triton II]\n00:01.1 IDE interface: Intel Corporation 82371AB/EB/MB PIIX4 IDE (rev 01)\n00:02.0 VGA compatible controller: VMware SVGA II Adapter\n00:03.0 Ethernet controller: Intel Corporation 82540EM Gigabit Ethernet Controller (rev 02)\n00:04.0 System peripheral: InnoTek Systemberatung GmbH VirtualBox Guest Service\n00:05.0 Multimedia audio controller: Intel Corporation 82801AA AC\'97 Audio Controller (rev 01)\n00:06.0 USB controller: Apple Inc. KeyLargo/Intrepid USB\n00:07.0 Bridge: Intel Corporation 82371AB/EB/MB PIIX4 ACPI (rev 08)\n00:0d.0 SATA controller: Intel Corporation 82801HM/HEM (ICH8M/ICH8M-E) SATA Controller [AHCI mode] (rev 02)\n'); return 0; });
  def('lsusb', async (c) => { c.out('Bus 001 Device 001: ID 1d6b:0001 Linux Foundation 1.1 root hub\nBus 001 Device 002: ID 80ee:0021 VirtualBox USB Tablet\n'); return 0; });

  def('lsof', async (c) => {
    const i = c.args.indexOf('-i');
    const header = 'COMMAND    PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\n';
    if (i >= 0) {
      const spec = c.args[i + 1] || '';
      const port = +((/:(\d+)/.exec(spec) || [])[1] || 0);
      if (c.cred.uid !== 0) return 1;
      const rows = LX.ports(c.m).filter((p) => p.proto === 'tcp' && (!port || p.port === port) && !p.addr.startsWith('127.0.0.5'));
      if (!rows.length) return 1;
      c.out(header + rows.map((p) => `${p.proc.slice(0, 9).padEnd(9)} ${String(p.pid || 0).padStart(5)} ${(p.proc === 'nginx' ? 'root' : p.proc === 'mysqld' ? 'mysql' : 'root').padEnd(8)}    6u  IPv${p.addr.startsWith('[') ? 6 : 4} ${String(20000 + p.port).padStart(6)}      0t0  TCP ${p.addr === '0.0.0.0' || p.addr === '*' ? '*' : p.addr}:${p.port} (LISTEN)`).join('\n') + '\n');
      return 0;
    }
    const f = c.args.filter((a) => !a.startsWith('-'))[0];
    if (f) {
      const abs = c.resolve(f);
      const busy = c.session.stack.some((s) => s.cwd && (s.cwd === abs || s.cwd.startsWith(abs + '/')));
      if (!busy) return 1;
      c.out(header + `bash      1402  student  cwd    DIR  252,0     4096 131074 ${abs}\n`);
      return 0;
    }
    c.out(header + 'systemd      1     root  cwd       DIR  252,0     4096        2 /\nsystemd      1     root  rtd       DIR  252,0     4096        2 /\nbash      1402  student  cwd       DIR  252,0     4096   131074 ' + c.cwd + '\n');
    return 0;
  });
  def('fuser', async (c) => {
    const f = c.args.filter((a) => !a.startsWith('-'))[0];
    if (!f) return 1;
    const m = /^(\d+)\/tcp$/.exec(f);
    if (m) { const p = LX.ports(c.m).find((x) => x.port === +m[1]); if (!p) return 1; c.err(`${f}:           `); c.out(`${p.pid}\n`); return 0; }
    return 1;
  });

  def('sysctl', async (c) => {
    const args = c.args.slice();
    const vals = Object.assign({ 'kernel.hostname': c.m.hostname(), 'kernel.ostype': 'Linux', 'kernel.osrelease': LX.OS.kernel, 'net.ipv4.ip_forward': '0', 'vm.swappiness': '60', 'fs.file-max': '9223372036854775807', 'net.core.somaxconn': '4096', 'kernel.dmesg_restrict': '1', 'net.ipv4.tcp_syncookies': '1', 'net.ipv6.conf.all.disable_ipv6': '0' }, Object.fromEntries(Object.entries(c.m.state.sysctl || {}).map(([k, v]) => [k, String(v).trim()])));
    if (args.includes('-a')) { Object.keys(vals).sort().forEach((k) => c.out(`${k} = ${vals[k]}\n`)); return 0; }
    const setVal = (k, v) => {
      if (c.cred.uid !== 0) { c.err(`sysctl: permission denied on key "${k}"\n`); return false; }
      c.m.state.sysctl = c.m.state.sysctl || {};
      c.m.state.sysctl[k] = v + '\n';
      c.out(`${k} = ${v}\n`);
      return true;
    };
    if (args[0] === '-p' || args[0] === '--system') {
      const files = args[0] === '--system' ? ['/etc/sysctl.conf'].concat(LX.globFiles(c.m, '/etc/sysctl.d/*.conf')) : [args[1] || '/etc/sysctl.conf'];
      for (const f of files) {
        if (args[0] === '--system') c.out(`* Applying ${f} ...\n`);
        let t = '';
        try { t = c.fs.readFile(f, c.cred); } catch (e) { c.err(`sysctl: cannot open "${f}": ${e.message}\n`); return 1; }
        t.split('\n').forEach((l) => { const r = /^\s*([\w.]+)\s*=\s*(\S+)/.exec(l.replace(/#.*/, '')); if (r) setVal(r[1], r[2]); });
      }
      return 0;
    }
    let st = 0;
    for (let i = 0; i < args.length; i++) {
      let a = args[i];
      if (a === '-w') continue;
      if (a === '-n') { c.out((vals[args[++i]] || '') + '\n'); continue; }
      const r = /^([\w.]+)=(.*)$/.exec(a);
      if (r) { if (!setVal(r[1], r[2])) st = 1; continue; }
      if (vals[a] == null) { c.err(`sysctl: cannot stat /proc/sys/${a.replace(/\./g, '/')}: No such file or directory\n`); st = 255; continue; }
      c.out(`${a} = ${vals[a]}\n`);
    }
    return st;
  });

  // ======================================================================= 셸에서 자주 쓰는 도구
  def('run-parts', async (c) => {
    const dir = c.args.filter((a) => !a.startsWith('-'))[0];
    let names = [];
    try { names = c.fs.readdir(c.resolve(dir), c.cred).filter((n) => /^[\w-]+$/.test(n)); } catch (e) { c.err(`run-parts: failed to open directory ${dir}: ${e.message}\n`); return 1; }
    if (c.args.includes('--test') || c.args.includes('--list')) { names.forEach((n) => c.out(`${dir.replace(/\/$/, '')}/${n}\n`)); return 0; }
    for (const n of names) await c.sh.invoke([`${dir.replace(/\/$/, '')}/${n}`], c.io);
    return 0;
  });

  def('update-grub', async (c) => {
    if (c.cred.uid !== 0) { c.err('grub-mkconfig: You must run this as root\n'); return 1; }
    c.err(`Sourcing file \`/etc/default/grub'\nGenerating grub configuration file ...\nFound linux image: /boot/vmlinuz-${LX.OS.kernel}\nFound initrd image: /boot/initrd.img-${LX.OS.kernel}\nWarning: os-prober will not be executed to detect other bootable partitions.\nSystems on them will not be added to the GRUB boot configuration.\nCheck GRUB_DISABLE_OS_PROBER documentation entry.\nAdding boot menu entry for UEFI Firmware Settings ...\ndone\n`);
    return 0;
  });
})(typeof window !== 'undefined' ? window : globalThis);

