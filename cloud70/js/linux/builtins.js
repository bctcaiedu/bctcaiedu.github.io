
/* 가상 리눅스 — 셸 내장 명령 */
(function (G) {
  const LX = G.LX = G.LX || {};
  const B = LX.BUILTINS;
  const P = () => LX.path;
  const { ExitSig, ReturnSig, BreakSig, ContinueSig } = LX.sig;

  // ======================================================================= printf 서식
  function escapes(s, forB) {
    return String(s).replace(/\\(0[0-7]{0,3}|x[0-9a-fA-F]{1,2}|u[0-9a-fA-F]{4}|.)/g, (m, c) => {
      if (c[0] === '0' && c.length > 1) return String.fromCharCode(parseInt(c.slice(1), 8));
      if (c[0] === 'x' && c.length > 1) return String.fromCharCode(parseInt(c.slice(1), 16));
      if (c[0] === 'u' && c.length > 1) return String.fromCharCode(parseInt(c.slice(1), 16));
      switch (c) {
        case 'n': return '\n'; case 't': return '\t'; case 'r': return '\r'; case 'a': return '\x07'; case 'b': return '\b';
        case 'e': case 'E': return '\x1b'; case 'f': return '\f'; case 'v': return '\v'; case '\\': return '\\';
        case '0': return '\0';
        case 'c': return forB ? '\u0000STOP' : m;
        default: return m;
      }
    });
  }
  LX.escapes = escapes;

  function printfFormat(fmt, args) {
    let out = '';
    let ai = 0;
    let first = true;
    const hasSpec = /%[^%]/.test(fmt);
    while (first || (hasSpec && ai < args.length)) {
      first = false;
      const startAi = ai;
      out += fmt.replace(/%([-+ #0]*)(\d+|\*)?(?:\.(\d+|\*))?([diouxXfFeEgGcsbq%])|\\(0[0-7]{0,3}|x[0-9a-fA-F]{1,2}|.)/g, (m, flags, width, prec, conv, esc) => {
        if (esc != null) return escapes('\\' + esc);
        if (conv === '%') return '%';
        if (width === '*') width = args[ai++] || '0';
        if (prec === '*') prec = args[ai++] || '0';
        let a = args[ai++];
        if (a == null) a = '';
        let s;
        switch (conv) {
          case 'd': case 'i': {
            let n = parseInt(a, 10);
            if (/^'./.test(a)) n = a.charCodeAt(1);
            if (Number.isNaN(n)) n = 0;
            s = String(Math.abs(n));
            if (prec) s = s.padStart(+prec, '0');
            s = (n < 0 ? '-' : flags.includes('+') ? '+' : flags.includes(' ') ? ' ' : '') + s;
            break;
          }
          case 'u': s = String(Math.abs(parseInt(a, 10) || 0)); break;
          case 'o': s = (parseInt(a, 10) || 0).toString(8); break;
          case 'x': s = (parseInt(a, 10) || 0).toString(16); break;
          case 'X': s = (parseInt(a, 10) || 0).toString(16).toUpperCase(); break;
          case 'f': case 'F': { const n = parseFloat(a) || 0; s = n.toFixed(prec != null ? +prec : 6); if (flags.includes('+') && n >= 0) s = '+' + s; break; }
          case 'e': case 'E': { s = (parseFloat(a) || 0).toExponential(prec != null ? +prec : 6).replace(/e([+-])(\d)$/, 'e$10$2'); if (conv === 'E') s = s.toUpperCase(); break; }
          case 'g': case 'G': s = String(parseFloat(a) || 0); break;
          case 'c': s = String(a).charAt(0); break;
          case 'b': s = escapes(a, true); break;
          case 'q': s = LX.shQuote(a); break;
          default: s = String(a); if (prec != null) s = s.slice(0, +prec);
        }
        if (width) {
          const w = +width;
          if (flags.includes('-')) s = s.padEnd(w);
          else if (flags.includes('0') && /[diouxXfFeE]/.test(conv)) { const neg = s[0] === '-' ? '-' : ''; s = neg + s.slice(neg.length).padStart(w - neg.length, '0'); }
          else s = s.padStart(w);
        }
        return s;
      });
      if (ai === startAi) break;
    }
    return out;
  }
  LX.printf = printfFormat;

  // ======================================================================= test / [
  LX.testArgs = function (args, sh) {
    let p = 0;
    const peek = () => args[p];
    const UNARY = /^-[a-zA-Z]$/;
    const BIN = /^(=|==|!=|<|>|-eq|-ne|-lt|-le|-gt|-ge|-nt|-ot|-ef)$/;
    function expr() { let v = andE(); while (peek() === '-o') { p++; const r = andE(); v = v || r; } return v; }
    function andE() { let v = notE(); while (peek() === '-a') { p++; const r = notE(); v = v && r; } return v; }
    function notE() {
      if (peek() === '!' && args.length - p > 1) { p++; return !notE(); }
      return prim();
    }
    function prim() {
      const t = peek();
      if (t == null) throw new Error('argument expected');
      if (t === '(' ) { p++; const v = expr(); if (peek() !== ')') throw new Error("')' expected"); p++; return v; }
      if (args[p + 1] != null && BIN.test(args[p + 1]) && args.length - p >= 3) {
        const a = args[p], op = args[p + 1], b = args[p + 2];
        p += 3;
        if (op === '-ef') return a === b;
        return sh.binaryTest(op, a, b);
      }
      if (UNARY.test(t) && args[p + 1] != null) {
        p += 2;
        return sh.unaryTest(t, args[p - 1]);
      }
      p++;
      return t !== '';
    }
    if (!args.length) return false;
    const v = expr();
    if (p < args.length) throw new Error(`${args[p]}: unexpected operator`);
    return v;
  };

  async function testCmd(c) {
    let args = c.args.slice();
    if (c.argv[0] === '[') {
      if (args[args.length - 1] !== ']') { c.err("bash: [: missing `]'\n"); return 2; }
      args.pop();
    }
    try {
      return LX.testArgs(args, c.sh) ? 0 : 1;
    } catch (e) {
      c.err(`bash: ${c.argv[0]}: ${e.message}\n`);
      return 2;
    }
  }

  // ======================================================================= 내장 명령
  B.cd = async (c) => {
    const sh = c.sh;
    let target = c.args.filter((a) => a !== '-L' && a !== '-P' && a !== '--')[0];
    if (c.args.filter((a) => !a.startsWith('-') || a === '-').length > 1) { c.err('bash: cd: too many arguments\n'); return 1; }
    if (target == null || target === '') target = sh.getVar('HOME');
    let print = false;
    if (target === '-') {
      target = sh.getVar('OLDPWD');
      if (!target) { c.err('bash: cd: OLDPWD not set\n'); return 1; }
      print = true;
    }
    let abs = P().normalize(sh.cwd, target);
    // CDPATH 없음
    try {
      const node = c.fs.stat(abs, sh.cred);
      if (node.t !== 'd') { c.err(`bash: cd: ${target}: Not a directory\n`); return 1; }
      if (!c.fs.perm(node, sh.cred, 1)) { c.err(`bash: cd: ${target}: Permission denied\n`); return 1; }
    } catch (e) {
      c.err(`bash: cd: ${target}: ${e.message}\n`);
      return 1;
    }
    if (c.args.includes('-P')) abs = c.fs.realpath(abs);
    sh.setVar('OLDPWD', sh.cwd, { export: true });
    sh.cwd = abs;
    sh.setVar('PWD', abs, { export: true });
    if (print) c.out(abs + '\n');
    return 0;
  };

  B.pwd = async (c) => {
    c.out((c.args.includes('-P') ? c.fs.realpath(c.sh.cwd) : c.sh.cwd) + '\n');
    return 0;
  };

  async function echo(c) {
    let args = c.args.slice();
    let nl = true, esc = false;
    while (args.length && /^-[neE]+$/.test(args[0])) {
      const f = args.shift();
      if (f.includes('n')) nl = false;
      if (f.includes('e')) esc = true;
      if (f.includes('E')) esc = false;
    }
    let s = args.join(' ');
    if (esc) {
      s = escapes(s, true);
      const stop = s.indexOf('\u0000STOP');
      if (stop >= 0) { s = s.slice(0, stop); nl = false; }
    }
    c.out(s + (nl ? '\n' : ''));
    return 0;
  }
  B.echo = echo;

  B.printf = async (c) => {
    let args = c.args.slice();
    let varName = null;
    if (args[0] === '-v') { varName = args[1]; args = args.slice(2); }
    if (args[0] === '--') args.shift();
    if (!args.length) { c.err('printf: usage: printf [-v var] format [arguments]\n'); return 2; }
    const s = printfFormat(args[0], args.slice(1));
    if (varName) c.sh.setVar(varName, s); else c.out(s);
    return 0;
  };

  B.export = async (c) => {
    const sh = c.sh;
    const args = c.args.filter((a) => a !== '--');
    if (!args.length || args[0] === '-p') {
      Object.keys(sh.vars).sort().forEach((k) => { if (sh.vars[k].x) c.out(`declare -x ${k}="${String(sh.getVar(k)).replace(/(["\\$`])/g, '\\$1')}"\n`); });
      return 0;
    }
    let unexport = false;
    for (const a of args) {
      if (a === '-n') { unexport = true; continue; }
      if (a === '-f') continue;
      const m = /^([A-Za-z_]\w*)(\+?)=([\s\S]*)$/.exec(a);
      if (m) {
        const v = m[2] ? sh.getVar(m[1]) + m[3] : m[3];
        sh.setVar(m[1], v, { export: true });
      } else if (/^[A-Za-z_]\w*$/.test(a)) {
        if (sh.vars[a]) sh.vars[a].x = !unexport;
        else sh.vars[a] = { v: '', x: true, unsetVal: true };
      } else {
        c.err(`bash: export: \`${a}': not a valid identifier\n`);
        return 1;
      }
    }
    return 0;
  };

  B.unset = async (c) => {
    let fn = false;
    for (const a of c.args) {
      if (a === '-f') { fn = true; continue; }
      if (a === '-v') continue;
      if (fn) { delete c.sh.funcs[a]; continue; }
      const m = /^([A-Za-z_]\w*)\[(.*)\]$/.exec(a);
      if (m) { const e = c.sh.vars[m[1]]; if (e && Array.isArray(e.v)) delete e.v[c.sh.arithIndex(m[2])]; else if (e && e.assoc) delete e.assoc[m[2]]; continue; }
      if (c.sh.vars[a] && c.sh.vars[a].ro) { c.err(`bash: unset: ${a}: cannot unset: readonly variable\n`); return 1; }
      delete c.sh.vars[a];
      if (!c.sh.vars[a] && c.sh.funcs[a] && !m) { /* 변수 없으면 함수는 그대로 */ }
    }
    return 0;
  };

  B.set = async (c) => {
    const sh = c.sh;
    if (!c.args.length) {
      Object.keys(sh.vars).sort().forEach((k) => {
        const e = sh.vars[k];
        if (Array.isArray(e.v)) c.out(`${k}=(${e.v.map((x, i) => `[${i}]="${x}"`).join(' ')})\n`);
        else c.out(`${k}=${/^[\w./:-]*$/.test(e.v) ? e.v : "'" + String(e.v).replace(/'/g, "'\\''") + "'"}\n`);
      });
      return 0;
    }
    const args = c.args.slice();
    while (args.length) {
      const a = args[0];
      if (a === '--') { args.shift(); sh.pos = args.slice(); return 0; }
      if (/^[-+][a-zA-Z]+$/.test(a)) {
        args.shift();
        const on = a[0] === '-';
        for (const f of a.slice(1)) {
          if (f === 'o') {
            const name = args.shift();
            if (!name) { Object.entries({ errexit: sh.opts.e, nounset: sh.opts.u, xtrace: sh.opts.x, pipefail: !!sh.opts.pipefail, noclobber: !!sh.opts.C, noglob: !!sh.noGlob }).forEach(([k, v]) => c.out(`${k.padEnd(15)}\t${v ? 'on' : 'off'}\n`)); continue; }
            const map = { errexit: 'e', nounset: 'u', xtrace: 'x', pipefail: 'pipefail', noclobber: 'C' };
            if (name === 'noglob') sh.noGlob = on;
            else if (map[name]) sh.opts[map[name]] = on;
            continue;
          }
          if (f === 'f') sh.noGlob = on;
          else sh.opts[f] = on;
        }
        continue;
      }
      sh.pos = args.slice();
      return 0;
    }
    return 0;
  };

  B.shift = async (c) => {
    const n = c.args[0] ? +c.args[0] : 1;
    if (n > c.sh.pos.length) return 1;
    c.sh.pos = c.sh.pos.slice(n);
    return 0;
  };

  B.source = async (c) => {
    const f = c.args[0];
    if (!f) { c.err('bash: source: filename argument required\nsource: usage: source filename [arguments]\n'); return 2; }
    let abs = f.includes('/') ? P().normalize(c.sh.cwd, f) : (c.fs.exists(P().normalize(c.sh.cwd, f)) ? P().normalize(c.sh.cwd, f) : c.m.findInPath(f, c.sh.getVar('PATH')));
    let text;
    try { text = c.fs.readFile(abs || f, c.sh.cred); } catch (e) { c.err(`bash: ${f}: ${e.message}\n`); return 1; }
    const saved = c.sh.pos;
    if (c.args.length > 1) c.sh.pos = c.args.slice(1);
    try {
      return await c.sh.runSource(text, c.io);
    } finally {
      if (c.args.length > 1) c.sh.pos = saved;
    }
  };
  B['.'] = B.source;

  B.exit = async (c) => {
    const n = c.args.length ? (parseInt(c.args[0], 10) & 255) : c.sh.status;
    if (c.args.length && Number.isNaN(parseInt(c.args[0], 10))) { c.err(`bash: exit: ${c.args[0]}: numeric argument required\n`); throw new ExitSig(2); }
    if (c.sh.interactive && c.sh.depth === 0 && c.sh === c.session.top) c.out(c.sh.login && c.session.stack.length > 1 ? 'logout\n' : 'exit\n');
    throw new ExitSig(n);
  };
  B.logout = async (c) => {
    if (!c.sh.login) { c.err('bash: logout: not login shell: use `exit\'\n'); return 1; }
    throw new ExitSig(0);
  };
  B.return = async (c) => {
    if (!c.sh.funcDepth && c.sh.depth === 0 && !c.sh.sourcing) {
      // source 된 파일에서의 return 도 허용
    }
    throw new ReturnSig(c.args.length ? (parseInt(c.args[0], 10) & 255) : c.sh.status);
  };
  B.break = async (c) => {
    if (!c.sh.loopDepth) { c.err('bash: break: only meaningful in a `for\', `while\', or `until\' loop\n'); return 0; }
    throw new BreakSig(c.args.length ? +c.args[0] : 1);
  };
  B.continue = async (c) => {
    if (!c.sh.loopDepth) { c.err('bash: continue: only meaningful in a `for\', `while\', or `until\' loop\n'); return 0; }
    throw new ContinueSig(c.args.length ? +c.args[0] : 1);
  };

  B.local = async (c) => {
    const sh = c.sh;
    if (!sh.funcDepth) { c.err('bash: local: can only be used in a function\n'); return 1; }
    for (const a of c.args) {
      if (a.startsWith('-')) continue;
      const m = /^([A-Za-z_]\w*)(?:=([\s\S]*))?$/.exec(a);
      if (!m) { c.err(`bash: local: \`${a}': not a valid identifier\n`); return 1; }
      if (!(m[1] in sh.locals)) sh.locals[m[1]] = sh.vars[m[1]] ? Object.assign({}, sh.vars[m[1]]) : null;
      sh.vars[m[1]] = { v: m[2] != null ? m[2] : '', x: false };
    }
    return 0;
  };

  B.declare = async (c) => {
    const sh = c.sh;
    const flags = new Set();
    const names = [];
    for (const a of c.args) {
      if (/^[-+][a-zA-Z]+$/.test(a)) { for (const f of a.slice(1)) flags.add((a[0] === '+' ? '+' : '') + f); continue; }
      names.push(a);
    }
    if (flags.has('f') || flags.has('F')) {
      Object.keys(sh.funcs).forEach((k) => c.out(flags.has('F') ? `declare -f ${k}\n` : `${k} () \n{ ... }\n`));
      return 0;
    }
    if (!names.length) {
      Object.keys(sh.vars).sort().forEach((k) => {
        const e = sh.vars[k];
        if (flags.has('x') && !e.x) return;
        if (Array.isArray(e.v)) c.out(`declare -a ${k}=(${e.v.map((x, i) => (x == null ? '' : `[${i}]="${x}"`)).filter(Boolean).join(' ')})\n`);
        else if (e.assoc) c.out(`declare -A ${k}=(${Object.entries(e.assoc).map(([kk, v]) => `[${kk}]="${v}" `).join('')})\n`);
        else c.out(`declare ${e.x ? '-x' : '--'} ${k}="${e.v}"\n`);
      });
      return 0;
    }
    for (const a of names) {
      const m = /^([A-Za-z_]\w*)(?:=([\s\S]*))?$/.exec(a);
      if (!m) continue;
      if (flags.has('p')) {
        const e = sh.vars[m[1]];
        if (!e) { c.err(`bash: declare: ${m[1]}: not found\n`); continue; }
        if (Array.isArray(e.v)) c.out(`declare -a ${m[1]}=(${e.v.map((x, i) => `[${i}]="${x}"`).join(' ')})\n`);
        else if (e.assoc) c.out(`declare -A ${m[1]}=(${Object.entries(e.assoc).map(([kk, v]) => `[${kk}]="${v}" `).join('')})\n`);
        else c.out(`declare -${[e.x ? 'x' : '', e.ro ? 'r' : '', e.int ? 'i' : ''].join('') || '-'} ${m[1]}="${e.v}"\n`);
        continue;
      }
      if (sh.funcDepth && !flags.has('g') && !(m[1] in (sh.locals || {}))) sh.locals[m[1]] = sh.vars[m[1]] ? Object.assign({}, sh.vars[m[1]]) : null;
      let e = sh.vars[m[1]];
      if (!e) e = sh.vars[m[1]] = { v: flags.has('a') ? [] : '', x: false };
      if (flags.has('A')) { e.assoc = e.assoc || {}; e.v = ''; }
      if (flags.has('a') && !Array.isArray(e.v)) e.v = e.v === '' ? [] : [e.v];
      if (flags.has('i')) e.int = true;
      if (flags.has('x')) e.x = true;
      if (flags.has('+x')) e.x = false;
      if (m[2] != null) {
        if (m[2].startsWith('(') && m[2].endsWith(')')) {
          const node = { type: 'simple', assigns: [`${m[1]}=${m[2]}`], words: [], redirs: [] };
          await sh.execSimple(node, c.io);
        } else {
          let v = m[2];
          if (e.int) { try { v = String(LX.arith(v, sh)); } catch (er) { v = '0'; } }
          if (e.assoc) { /* 무시 */ } else e.v = v;
        }
      }
      if (flags.has('r')) e.ro = true;
      if (flags.has('l') && typeof e.v === 'string') e.v = e.v.toLowerCase();
      if (flags.has('u') && typeof e.v === 'string') e.v = e.v.toUpperCase();
    }
    return 0;
  };
  B.typeset = B.declare;

  B.readonly = async (c) => {
    for (const a of c.args) {
      if (a.startsWith('-')) continue;
      const m = /^([A-Za-z_]\w*)(?:=([\s\S]*))?$/.exec(a);
      if (!m) continue;
      if (m[2] != null) c.sh.setVar(m[1], m[2]);
      if (!c.sh.vars[m[1]]) c.sh.vars[m[1]] = { v: '', x: false };
      c.sh.vars[m[1]].ro = true;
    }
    if (!c.args.length) Object.keys(c.sh.vars).filter((k) => c.sh.vars[k].ro).forEach((k) => c.out(`declare -r ${k}="${c.sh.vars[k].v}"\n`));
    return 0;
  };

  B.read = async (c) => {
    const sh = c.sh;
    const args = c.args.slice();
    let raw = false, prompt = '', secret = false, arr = null, nchars = 0, delim = '\n';
    const names = [];
    while (args.length) {
      const a = args.shift();
      if (a === '-r') raw = true;
      else if (a === '-s') secret = true;
      else if (a === '-p') prompt = args.shift() || '';
      else if (a === '-a') arr = args.shift();
      else if (a === '-n' || a === '-N') nchars = +args.shift();
      else if (a === '-t') args.shift();
      else if (a === '-d') delim = args.shift() || '';
      else if (/^-[rs]+$/.test(a)) { if (a.includes('r')) raw = true; if (a.includes('s')) secret = true; }
      else names.push(a);
    }
    let line;
    if (c.stdin) {
      if (delim === '') line = c.stdin.readAll() || null;
      else line = c.stdin.readLine();
      if (prompt && c.tty) c.err(prompt);
    } else {
      line = await c.session.requestLine(prompt, { secret });
      if (secret && line != null && !c.session.headless) c.out('\n');
    }
    if (line == null) return 1;
    if (nchars) line = line.slice(0, nchars);
    if (!raw) line = line.replace(/\\(.)/g, '$1');
    const ifs = sh.vars.IFS ? sh.vars.IFS.v : ' \t\n';
    if (arr) {
      sh.vars[arr] = { v: line.split(new RegExp('[' + ifs.replace(/[\]\\^-]/g, '\\$&') + ']+')).filter((x) => x !== ''), x: false };
      return 0;
    }
    if (!names.length) { sh.setVar('REPLY', line); return 0; }
    const ws = ifs.replace(/[^ \t\n]/g, '');
    let rest = ws ? line.replace(new RegExp('^[' + ws + ']+'), '') : line;
    for (let i = 0; i < names.length; i++) {
      if (i === names.length - 1) {
        sh.setVar(names[i], ws ? rest.replace(new RegExp('[' + ws + ']+$'), '') : rest);
        break;
      }
      const m = new RegExp('^([^' + ifs.replace(/[\]\\^-]/g, '\\$&') + ']*)[' + ifs.replace(/[\]\\^-]/g, '\\$&') + ']*').exec(rest);
      sh.setVar(names[i], m ? m[1] : '');
      rest = m ? rest.slice(m[0].length) : '';
    }
    return 0;
  };

  B.alias = async (c) => {
    const sh = c.sh;
    const args = c.args.filter((a) => a !== '-p');
    if (!args.length) {
      Object.keys(sh.aliases).sort().forEach((k) => c.out(`alias ${k}='${sh.aliases[k].replace(/'/g, "'\\''")}'\n`));
      return 0;
    }
    let st = 0;
    for (const a of args) {
      const m = /^([^=\s]+)=([\s\S]*)$/.exec(a);
      if (m) sh.aliases[m[1]] = m[2];
      else if (sh.aliases[a] != null) c.out(`alias ${a}='${sh.aliases[a]}'\n`);
      else { c.err(`bash: alias: ${a}: not found\n`); st = 1; }
    }
    return st;
  };
  B.unalias = async (c) => {
    if (c.args[0] === '-a') { c.sh.aliases = {}; return 0; }
    for (const a of c.args) {
      if (c.sh.aliases[a] == null) { c.err(`bash: unalias: ${a}: not found\n`); return 1; }
      delete c.sh.aliases[a];
    }
    return 0;
  };

  B.history = async (c) => {
    const h = c.session.history;
    if (c.args[0] === '-c') { h.length = 0; try { c.fs.writeFile(c.sh.cred.home + '/.bash_history', '', c.sh.cred); } catch (e) { /* 무시 */ } return 0; }
    if (c.args[0] === '-d') { h.splice(+c.args[1] - 1, 1); return 0; }
    if (c.args[0] === '-w' || c.args[0] === '-a') return 0;
    const n = c.args[0] ? +c.args[0] : h.length;
    const start = Math.max(0, h.length - n);
    for (let i = start; i < h.length; i++) c.out(`${String(i + 1).padStart(5)}  ${h[i]}\n`);
    return 0;
  };

  B.type = async (c) => {
    const sh = c.sh;
    let st = 0;
    const tOnly = c.args.includes('-t');
    const all = c.args.includes('-a');
    for (const n of c.args.filter((a) => !a.startsWith('-'))) {
      const res = [];
      if (sh.aliases[n] != null) res.push(tOnly ? 'alias' : `${n} is aliased to \`${sh.aliases[n]}'`);
      if (['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'until', 'do', 'done', 'case', 'esac', 'function', 'in', '{', '}', '!', '[['].includes(n)) res.push(tOnly ? 'keyword' : `${n} is a shell keyword`);
      if (sh.funcs[n]) res.push(tOnly ? 'function' : `${n} is a function`);
      if (B[n]) res.push(tOnly ? 'builtin' : `${n} is a shell builtin`);
      const p = c.m.findInPath(n, sh.getVar('PATH'));
      if (p) res.push(tOnly ? 'file' : `${n} is ${p}`);
      if (!res.length) { if (!tOnly) c.err(`bash: type: ${n}: not found\n`); st = 1; continue; }
      (all ? res : res.slice(0, 1)).forEach((r) => c.out(r + '\n'));
    }
    return st;
  };

  B.command = async (c) => {
    const args = c.args.slice();
    if (args[0] === '-v' || args[0] === '-V') {
      const n = args[1];
      if (!n) return 1;
      if (c.sh.aliases[n] != null) { c.out(`alias ${n}='${c.sh.aliases[n]}'\n`); return 0; }
      if (B[n] || c.sh.funcs[n]) { c.out(n + '\n'); return 0; }
      const p = c.m.findInPath(n, c.sh.getVar('PATH'));
      if (p) { c.out(p + '\n'); return 0; }
      return 1;
    }
    if (!args.length) return 0;
    c.sh._noFunc = true;
    try { return await c.sh.invoke(args, c.io); } finally { c.sh._noFunc = false; }
  };
  B.builtin = async (c) => {
    if (!c.args.length) return 0;
    if (!B[c.args[0]]) { c.err(`bash: builtin: ${c.args[0]}: not a shell builtin\n`); return 1; }
    return B[c.args[0]](c.sh.ctx(c.args, c.io));
  };

  B.test = testCmd;
  B['['] = testCmd;
  B.true = async () => 0;
  B.false = async () => 1;
  B[':'] = async () => 0;

  B.eval = async (c) => {
    const src = c.args.join(' ');
    if (!src.trim()) return 0;
    return c.sh.runSource(src, c.io);
  };

  B.exec = async (c) => {
    if (!c.args.length) return 0;
    const st = await c.sh.invoke(c.args, c.io);
    throw new ExitSig(st);
  };

  B.let = async (c) => {
    let v = 0;
    try {
      for (const a of c.args) v = LX.arith(a, c.sh);
    } catch (e) {
      c.err(`bash: let: ${e.message}\n`);
      return 1;
    }
    return v !== 0 ? 0 : 1;
  };

  B.jobs = async (c) => {
    const list = c.session.jobs.list;
    list.forEach((j, i) => {
      const mark = i === list.length - 1 ? '+' : i === list.length - 2 ? '-' : ' ';
      const st = j.done ? 'Done' : j.stopped ? 'Stopped' : 'Running';
      c.out(`[${j.id}]${mark}  ${c.args.includes('-l') ? j.pid + ' ' : ''}${st.padEnd(24)}${j.text} &\n`);
    });
    return 0;
  };

  B.fg = async (c) => {
    const j = c.session.jobs.get(c.args[0]);
    if (!j) { c.err(`bash: fg: ${c.args[0] || 'current'}: no such job\n`); return 1; }
    c.out(j.text + '\n');
    // 앞으로 가져온 작업은 Ctrl+C 로 끝낼 수 있다
    const onAbort = setInterval(() => { if (c.session.aborted) c.session.killJob(j); }, 100);
    try { await j.promise; } finally { clearInterval(onAbort); }
    const idx = c.session.jobs.list.indexOf(j);
    if (idx >= 0) c.session.jobs.list.splice(idx, 1);
    c.session.jobs.finished = c.session.jobs.finished.filter((x) => x !== j);
    return j.status || 0;
  };
  B.bg = async (c) => {
    const j = c.session.jobs.get(c.args[0]);
    if (!j) { c.err(`bash: bg: ${c.args[0] || 'current'}: no such job\n`); return 1; }
    c.out(`[${j.id}]+ ${j.text} &\n`);
    return 0;
  };
  B.wait = async (c) => {
    const list = c.args.length ? c.args.map((a) => c.session.jobs.get(a.startsWith('%') ? a : c.session.jobs.list.find((j) => String(j.pid) === a) ? '%' + c.session.jobs.list.find((j) => String(j.pid) === a).id : a)).filter(Boolean) : c.session.jobs.list.slice();
    for (const j of list) { try { await j.promise; } catch (e) { /* 무시 */ } }
    return 0;
  };

  B.umask = async (c) => {
    const sh = c.sh;
    const a = c.args.filter((x) => x !== '-S')[0];
    if (a == null) {
      if (c.args.includes('-S')) {
        const perm = (~sh.umask) & 0o777;
        const part = (s) => ['r', 'w', 'x'].filter((x, i) => perm & (1 << (s + 2 - i))).join('');
        c.out(`u=${part(6)},g=${part(3)},o=${part(0)}\n`);
      } else c.out(sh.umask.toString(8).padStart(4, '0') + '\n');
      return 0;
    }
    if (!/^[0-7]{1,4}$/.test(a)) { c.err(`bash: umask: ${a}: octal number out of range\n`); return 1; }
    sh.umask = parseInt(a, 8);
    return 0;
  };

  B.kill = async (c) => LX.commands.kill(c);

  const SIGS = ['EXIT', 'HUP', 'INT', 'QUIT', 'ILL', 'TRAP', 'ABRT', 'BUS', 'FPE', 'KILL', 'USR1', 'SEGV', 'USR2', 'PIPE', 'ALRM', 'TERM'];
  B.trap = async (c) => {
    const sh = c.sh;
    sh.traps = sh.traps || {};
    const norm = (s) => { s = String(s).toUpperCase().replace(/^SIG/, ''); if (/^\d+$/.test(s)) return SIGS[+s] || null; return s === 'ERR' || s === 'DEBUG' || s === 'RETURN' || SIGS.includes(s) ? s : null; };
    let args = c.args.slice();
    if (args[0] === '-l') { c.out(SIGS.slice(1).map((s, i) => `${String(i + 1).padStart(2)}) SIG${s}`).join('\t') + '\n'); return 0; }
    if (!args.length || args[0] === '-p') {
      const only = args.slice(1).map(norm);
      Object.keys(sh.traps).filter((k) => !only.length || only.includes(k)).forEach((k) => c.out(`trap -- '${sh.traps[k].replace(/'/g, "'\\''")}' ${k === 'EXIT' || k === 'ERR' || k === 'DEBUG' || k === 'RETURN' ? k : 'SIG' + k}\n`));
      return 0;
    }
    if (args[0] === '--') args.shift();
    let action = args.shift();
    if (!args.length && norm(action)) { args = [action]; action = '-'; }
    let st = 0;
    for (const s of args) {
      const n = norm(s);
      if (!n) { c.err(`bash: trap: ${s}: invalid signal specification\n`); st = 1; continue; }
      if (action === '-') delete sh.traps[n];
      else sh.traps[n] = action;
    }
    return st;
  };
  B.shopt = async (c) => { if (!c.args.length) c.out('checkwinsize   \ton\ncmdhist        \ton\nexpand_aliases \ton\nhistappend     \ton\n'); return 0; };
  B.hash = async (c) => { if (!c.args.length) c.out('hash: hash table empty\n'); return 0; };
  B.times = async (c) => { c.out('0m0.012s 0m0.004s\n0m0.108s 0m0.041s\n'); return 0; };
  B.suspend = async (c) => { c.err('bash: suspend: cannot suspend a login shell\n'); return 1; };
  B.caller = async () => 1;
  B.enable = async () => 0;
  B.disown = async (c) => { const j = c.session.jobs.get(c.args[0]); if (j) c.session.jobs.list.splice(c.session.jobs.list.indexOf(j), 1); return 0; };
  B.getopts = async (c) => {
    const sh = c.sh;
    const spec = c.args[0], name = c.args[1];
    const params = c.args.length > 2 ? c.args.slice(2) : sh.pos;
    let ind = +(sh.getVar('OPTIND') || 1);
    let sub = sh._optSub || 0;
    const cur = params[ind - 1];
    if (!cur || cur === '--' || !cur.startsWith('-') || cur === '-') { sh.setVar(name, '?'); if (cur === '--') sh.setVar('OPTIND', String(ind + 1)); return 1; }
    const ch = cur[1 + sub];
    const k = spec.indexOf(ch);
    const silent = spec.startsWith(':');
    let advance = () => { sub++; if (1 + sub >= cur.length) { ind++; sub = 0; } };
    if (k < 0 || ch === ':') {
      sh.setVar(name, '?');
      if (!silent) c.err(`${sh.name0}: illegal option -- ${ch}\n`); else sh.setVar('OPTARG', ch);
      advance();
    } else if (spec[k + 1] === ':') {
      let arg = cur.slice(2 + sub);
      if (!arg) { arg = params[ind]; ind += 2; } else ind++;
      sub = 0;
      advance = () => {};
      if (arg == null) { sh.setVar(name, silent ? ':' : '?'); if (!silent) c.err(`${sh.name0}: option requires an argument -- ${ch}\n`); }
      else { sh.setVar(name, ch); sh.setVar('OPTARG', arg); }
    } else {
      sh.setVar(name, ch);
      advance();
    }
    sh._optSub = sub;
    sh.setVar('OPTIND', String(ind));
    return 0;
  };

  B.dirs = async (c) => { const st = c.sh.dirStack || []; c.out([c.sh.cwd].concat(st).map((d) => d.replace(c.sh.getVar('HOME'), '~')).join(' ') + '\n'); return 0; };
  B.pushd = async (c) => {
    const sh = c.sh;
    sh.dirStack = sh.dirStack || [];
    const old = sh.cwd;
    const r = await B.cd(sh.ctx(['cd', c.args[0] || sh.getVar('HOME')], c.io));
    if (r) return r;
    sh.dirStack.unshift(old);
    return B.dirs(c);
  };
  B.popd = async (c) => {
    const sh = c.sh;
    if (!sh.dirStack || !sh.dirStack.length) { c.err('bash: popd: directory stack empty\n'); return 1; }
    const d = sh.dirStack.shift();
    await B.cd(sh.ctx(['cd', d], c.io));
    return B.dirs(c);
  };

  B.help = async (c) => {
    if (c.args[0]) {
      const h = LX.HELP && LX.HELP[c.args[0]];
      if (h) { c.out(h + '\n'); return 0; }
      if (B[c.args[0]]) { c.out(`${c.args[0]}: ${c.args[0]} [인자...]\n    셸 내장 명령입니다. 자세한 설명은 'man bash' 를 참고하세요.\n`); return 0; }
      c.err(`bash: help: no help topics match \`${c.args[0]}'.  Try \`help help' or \`man -k ${c.args[0]}' or \`info ${c.args[0]}'.\n`);
      return 1;
    }
    c.out('GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)\nThese shell commands are defined internally.  Type `help\' to see this list.\nType `help name\' to find out more about the function `name\'.\nUse `info bash\' to find out more about the shell in general.\nUse `man -k\' or `info\' to find out more about commands not in this list.\n\n');
    const names = Object.keys(B).sort();
    for (let i = 0; i < names.length; i += 3) c.out(names.slice(i, i + 3).map((n) => n.padEnd(26)).join('') + '\n');
    return 0;
  };

  // echo · printf · test · true · false · pwd · kill 은 실행 파일로도 있다
  LX.commandsFromBuiltins = ['echo', 'printf', 'test', '[', 'true', 'false', 'pwd'];
  LX.commandsFromBuiltins.forEach((n) => { LX.commands[n] = B[n]; });
})(typeof window !== 'undefined' ? window : globalThis);

