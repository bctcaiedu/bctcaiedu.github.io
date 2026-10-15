
/* 가상 리눅스 — 파일 · 디렉터리 명령 (ls cp mv rm mkdir chmod find tar gzip zip ...) */
(function (G) {
  const LX = G.LX = G.LX || {};
  const def = LX.def;
  const P = () => LX.path;

  // ======================================================================= 공용 도구
  /**
   * 옵션 해석
   * @param {string[]} args
   * @param {string} short  예: 'alh' , 값을 받는 옵션은 'n:'
   * @param {object} long   예: { all: 'a', 'max-depth': 'd:' }
   */
  function getopt(args, short = '', long = {}) {
    const flags = {};
    const ops = [];
    const takesArg = (ch) => { const i = short.indexOf(ch); return i >= 0 && short[i + 1] === ':'; };
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '--') { ops.push(...args.slice(i + 1)); break; }
      if (a.startsWith('--') && a.length > 2) {
        const [k, v] = a.slice(2).split(/=(.*)/s);
        const map = long[k];
        if (map == null) { flags['--' + k] = v != null ? v : true; continue; }
        if (map.endsWith(':')) {
          const key = map.slice(0, -1);
          flags[key] = v != null ? v : args[++i];
        } else flags[map] = v != null ? v : true;
        continue;
      }
      if (a.startsWith('-') && a.length > 1 && !/^-\d/.test(a) || (/^-\d+$/.test(a) && short.includes('#'))) {
        if (/^-\d+$/.test(a) && short.includes('#')) { flags['#'] = a.slice(1); continue; }
        for (let j = 1; j < a.length; j++) {
          const ch = a[j];
          if (takesArg(ch)) {
            const rest = a.slice(j + 1);
            flags[ch] = rest !== '' ? rest : args[++i];
            break;
          }
          flags[ch] = (flags[ch] === true ? 2 : flags[ch] > 0 ? flags[ch] + 1 : true);
        }
        continue;
      }
      ops.push(a);
    }
    return { f: flags, ops };
  }
  LX.getopt = getopt;

  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function lsTime(m, t) {
    const d = LX.localDate(m, t);
    const now = m.now();
    const recent = Math.abs(now - t) < 1000 * 60 * 60 * 24 * 182;
    const day = String(d.getUTCDate()).padStart(2, ' ');
    if (recent) return `${MON[d.getUTCMonth()]} ${day} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    return `${MON[d.getUTCMonth()]} ${day}  ${d.getUTCFullYear()}`;
  }
  LX.lsTime = lsTime;
  function fullTime(m, t) {
    const d = LX.localDate(m, t);
    const pad = (n, w = 2) => String(n).padStart(w, '0');
    const off = LX.tzOffsetMin(m);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}${String(t % 1000000).padStart(6, '0')} ${off >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(off) / 60))}${pad(Math.abs(off) % 60)}`;
  }
  LX.fullTime = fullTime;

  function modeStr(n) {
    const t = { d: 'd', l: 'l', c: 'c', b: 'b', f: '-' }[n.t] || '-';
    const m = n.m;
    const r = (bit, ch) => (m & bit ? ch : '-');
    let s = t + r(0o400, 'r') + r(0o200, 'w');
    s += m & 0o4000 ? (m & 0o100 ? 's' : 'S') : r(0o100, 'x');
    s += r(0o40, 'r') + r(0o20, 'w');
    s += m & 0o2000 ? (m & 0o10 ? 's' : 'S') : r(0o10, 'x');
    s += r(0o4, 'r') + r(0o2, 'w');
    s += m & 0o1000 ? (m & 0o1 ? 't' : 'T') : r(0o1, 'x');
    return s;
  }
  LX.modeStr = modeStr;

  function human(bytes, si) {
    const u = ['', 'K', 'M', 'G', 'T', 'P'];
    const base = si ? 1000 : 1024;
    let v = bytes, i = 0;
    while (v >= base && i < u.length - 1) { v /= base; i++; }
    if (i === 0) return String(Math.round(v));
    return (v < 10 ? (Math.ceil(v * 10) / 10).toFixed(1) : String(Math.ceil(v))) + u[i];
  }
  LX.human = human;

  function color(name, node, fs, target) {
    if (!node) return name;
    if (node.t === 'd') {
      if ((node.m & 0o1002) === 0o1002) return `\x1b[30;42m${name}\x1b[0m`;
      if (node.m & 0o2) return `\x1b[34;42m${name}\x1b[0m`;
      return `\x1b[01;34m${name}\x1b[0m`;
    }
    if (node.t === 'l') return target === null ? `\x1b[40;31;01m${name}\x1b[0m` : `\x1b[01;36m${name}\x1b[0m`;
    if (node.t === 'b' || node.t === 'c') return `\x1b[40;33;01m${name}\x1b[0m`;
    if (node.m & 0o4000) return `\x1b[37;41m${name}\x1b[0m`;
    if (node.m & 0o2000) return `\x1b[30;43m${name}\x1b[0m`;
    if (node.m & 0o111) return `\x1b[01;32m${name}\x1b[0m`;
    if (/\.(tar|tgz|gz|zip|bz2|xz|7z|deb|rpm|jar|zst)$/i.test(name)) return `\x1b[01;31m${name}\x1b[0m`;
    if (/\.(png|jpe?g|gif|bmp|svg|webp|mp4|mkv)$/i.test(name)) return `\x1b[01;35m${name}\x1b[0m`;
    return name;
  }
  LX.lsColor = color;

  /** 터미널 열 맞춤 (GNU ls 처럼 세로로 채움) */
  function columns(items, width, visLen) {
    if (!items.length) return '';
    const lens = items.map(visLen);
    const n = items.length;
    for (let cols = Math.min(n, Math.floor(width / 3)); cols >= 1; cols--) {
      const rows = Math.ceil(n / cols);
      const cw = [];
      for (let c = 0; c < cols; c++) {
        let mx = 0;
        for (let r = 0; r < rows; r++) { const i = c * rows + r; if (i < n) mx = Math.max(mx, lens[i]); }
        cw.push(mx);
      }
      const total = cw.reduce((a, b) => a + b, 0) + (cols - 1) * 2;
      if (total <= width || cols === 1) {
        let out = '';
        for (let r = 0; r < rows; r++) {
          let line = '';
          for (let c = 0; c < cols; c++) {
            const i = c * rows + r;
            if (i >= n) continue;
            const last = c === cols - 1 || (c + 1) * rows + r >= n;
            line += items[i] + (last ? '' : ' '.repeat(cw[c] - lens[i] + 2));
          }
          out += line + '\n';
        }
        return out;
      }
    }
    return items.join('\n') + '\n';
  }
  const visLen = (s) => [...String(s).replace(/\x1b\[[0-9;]*m/g, '')].reduce((a, ch) => a + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1), 0);
  LX.visLen = visLen;
  LX.columns = columns;

  function quoteName(n) { return /[\s'"$`\\!*?&;|<>(){}]/.test(n) ? `'${n.replace(/'/g, "'\\''")}'` : n; }

  // ======================================================================= ls
  def(['ls', 'dir', 'vdir'], async (c) => {
    const { f, ops } = getopt(c.args, 'aAlhRtSrd1iFpngoscuUvXIGB', { all: 'a', 'almost-all': 'A', 'human-readable': 'h', recursive: 'R', reverse: 'r', directory: 'd', inode: 'i', classify: 'F', color: 'color', 'full-time': 'full-time', 'group-directories-first': 'gdf', size: 's', si: 'si', sort: 'sort:' });
    if (c.args.includes('--version')) { c.out(`${c.name} (GNU coreutils) 9.4\nCopyright (C) 2023 Free Software Foundation, Inc.\nLicense GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.\nThis is free software: you are free to change and redistribute it.\nThere is NO WARRANTY, to the extent permitted by law.\n\nWritten by Richard M. Stallman and David MacKenzie.\n`); return 0; }
    if (c.name === 'vdir') f.l = true;
    const fs = c.fs;
    const colorOn = f.color === 'always' || f.color === true || (f.color === 'auto' && c.tty);
    const long = f.l || f.n || f.g || f.o || f['full-time'];
    const one = f['1'] || (!c.tty && !long);
    const targets = ops.length ? ops : ['.'];
    let st = 0;
    const files = [], dirs = [];
    for (const t of targets) {
      const abs = c.resolve(t);
      let node;
      try {
        node = fs.stat(abs, c.cred, false);
      } catch (e) {
        c.err(`ls: cannot access '${t}': ${e.message}\n`);
        st = 2;
        continue;
      }
      if (node.t === 'l') {
        const tg = fs.lookup(abs);
        if (tg && (!long || t.endsWith('/') || (tg.t === 'd' && !f.d && !long))) node = tg;
      }
      if (node.t === 'd' && !f.d) dirs.push({ t, abs, node }); else files.push({ name: t, abs, node });
    }
    const sortEntries = (list) => {
      const key = (e) => e.name.replace(/^\./, '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      if (f.U) return list;
      list.sort((a, b) => {
        if (f.t) return b.node.mt - a.node.mt || (a.name < b.name ? -1 : 1);
        if (f.S) return fs.size(b.node) - fs.size(a.node) || (a.name < b.name ? -1 : 1);
        if (f.X) { const ea = (/\.[^.]*$/.exec(a.name) || [''])[0], eb = (/\.[^.]*$/.exec(b.name) || [''])[0]; if (ea !== eb) return ea < eb ? -1 : 1; }
        const ka = key(a), kb = key(b);
        return ka < kb ? -1 : ka > kb ? 1 : (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      });
      if (f.gdf) list.sort((a, b) => (b.node.t === 'd') - (a.node.t === 'd'));
      if (f.r) list.reverse();
      return list;
    };
    const decorate = (e) => {
      let name = quoteName(e.name);
      let tgt;
      if (e.node.t === 'l') { tgt = fs.lookup(e.abs); if (!tgt) tgt = null; }
      if (colorOn) name = color(name, e.node, fs, tgt);
      if (f.F || f.p) {
        if (e.node.t === 'd') name += '/';
        else if (f.F && e.node.t === 'l') name += '@';
        else if (f.F && e.node.t === 'f' && (e.node.m & 0o111)) name += '*';
      }
      if (f.i && !long) name = String(inode(e.abs, e.node)).padStart(7) + ' ' + name;
      if (f.s) name = String(Math.ceil(fs.size(e.node) / 4096) * 4).padStart(3) + ' ' + name;
      return name;
    };
    const longLines = (list, withTotal) => {
      const rows = list.map((e) => {
        const n = e.node;
        const links = n.t === 'd' ? 2 + Object.values(n.k).filter((x) => x.t === 'd').length : (n.nl || 1);
        const user = f.n ? String(n.u) : c.m.userName(n.u);
        const group = f.n ? String(n.g) : c.m.groupName(n.g);
        let size = n.t === 'b' || n.t === 'c' ? devNo(e.name) : (f.h ? human(fs.size(n), f.si) : String(fs.size(n)));
        let name = decorate(e);
        if (n.t === 'l') name += ' -> ' + (colorOn ? color(n.l, fs.lookup(e.abs), fs) : n.l);
        const time = f['full-time'] ? fullTime(c.m, n.mt) : lsTime(c.m, n.mt);
        return { ino: f.i ? String(inode(e.abs, n)) : '', mode: modeStr(n), links: String(links), user, group, size, time, name };
      });
      const w = (k) => Math.max(0, ...rows.map((r) => r[k].length));
      const wi = w('ino'), wl = w('links'), wu = w('user'), wg = w('group'), ws = w('size');
      let out = '';
      if (withTotal) out += `total ${list.reduce((a, e) => a + (e.node.t === 'f' ? Math.ceil(fs.size(e.node) / 4096) * 4 : e.node.t === 'd' ? 4 : 0), 0)}\n`;
      rows.forEach((r) => {
        out += `${f.i ? r.ino.padStart(wi) + ' ' : ''}${r.mode} ${r.links.padStart(wl)} ${f.g ? '' : r.user.padEnd(wu) + ' '}${f.o ? '' : r.group.padEnd(wg) + ' '}${r.size.padStart(ws)} ${r.time} ${r.name}\n`;
      });
      return out;
    };
    const show = (list, withTotal) => {
      if (long) return longLines(list, withTotal);
      const items = list.map(decorate);
      if (one) return items.map((x) => x + '\n').join('');
      return columns(items, c.session.cols || 80, visLen);
    };
    let out = '';
    if (files.length) out += show(sortEntries(files), false);
    const listDir = (d, header) => {
      let names;
      try { names = fs.readdir(d.abs, c.cred); } catch (e) {
        c.err(`ls: cannot open directory '${d.t}': ${e.message}\n`);
        st = 2;
        return;
      }
      let entries = names.map((nm) => ({ name: nm, abs: (d.abs === '/' ? '' : d.abs) + '/' + nm, node: fs.lookup((d.abs === '/' ? '' : d.abs) + '/' + nm, false) })).filter((e) => e.node);
      if (!f.a && !f.A) entries = entries.filter((e) => !e.name.startsWith('.'));
      if (f.a) entries.unshift({ name: '.', abs: d.abs, node: d.node }, { name: '..', abs: P().dirname(d.abs), node: fs.lookup(P().dirname(d.abs)) });
      sortEntries(entries);
      if (header) out += (out ? '\n' : '') + `${d.t}:\n`;
      out += show(entries, true);
      if (f.R) {
        entries.filter((e) => e.node.t === 'd' && e.name !== '.' && e.name !== '..').forEach((e) => listDir({ t: (d.t === '/' ? '' : d.t.replace(/\/$/, '')) + '/' + e.name, abs: e.abs, node: e.node }, true));
      }
    };
    const multi = targets.length > 1 || f.R;
    dirs.sort((a, b) => (a.t < b.t ? -1 : 1));
    dirs.forEach((d, i) => { if (i === 0 && !files.length && multi) out += `${d.t}:\n`, listDir(d, false); else listDir(d, multi); });
    c.out(out);
    return st;
  });

  function devNo(name) {
    const m = { null: '1, 3', zero: '1, 5', random: '1, 8', urandom: '1, 9', tty: '5, 0', console: '5, 1', sda: '8, 0', sda1: '8, 1', sda2: '8, 2', sda3: '8, 3', sdb: '8, 16', sdb1: '8, 17', sdb2: '8, 18', sr0: '11, 0' }[P().basename(name)];
    return m || '252, 0';
  }
  function inode(abs, node) { if (node && node.ino) return node.ino; let h = 7; for (const ch of abs) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 131072 + (h % 3000000); }
  LX.inode = inode;

  // ======================================================================= cat · tac · nl
  async function readInputs(c, ops, cmd, onText) {
    let st = 0;
    const list = ops.length ? ops : ['-'];
    for (const f of list) {
      if (f === '-') { onText(await c.readStdin(), '-'); continue; }
      const abs = c.resolve(f);
      try {
        const n = c.fs.stat(abs, c.cred);
        if (n.t === 'd') { c.err(`${cmd}: ${f}: Is a directory\n`); st = 1; continue; }
        onText(c.fs.readFile(abs, c.cred), f);
      } catch (e) {
        c.err(`${cmd}: ${f}: ${e.message}\n`);
        st = 1;
      }
    }
    return st;
  }
  LX.readInputs = readInputs;

  def('cat', async (c) => {
    const { f, ops } = getopt(c.args, 'nbAEsTv', { number: 'n', 'number-nonblank': 'b', 'show-all': 'A', 'show-ends': 'E', 'squeeze-blank': 's' });
    let ln = 0;
    return readInputs(c, ops, 'cat', (text) => {
      if (!(f.n || f.b || f.A || f.E || f.s || f.T || f.v)) { c.out(text); return; }
      let lines = text.split('\n');
      const endNl = text.endsWith('\n');
      if (endNl) lines.pop();
      if (f.s) lines = lines.filter((l, i) => !(l === '' && lines[i - 1] === ''));
      c.out(lines.map((l) => {
        if (f.A || f.v) l = l.replace(/[\x00-\x08\x0b-\x1f\x7f]/g, (ch) => (ch === '\x7f' ? '^?' : '^' + String.fromCharCode(ch.charCodeAt(0) + 64)));
        if (f.A || f.T) l = l.replace(/\t/g, '^I');
        if (f.A || f.E) l += '$';
        if (f.b) return l === '' || l === '$' ? l : `${String(++ln).padStart(6)}\t${l}`;
        if (f.n) return `${String(++ln).padStart(6)}\t${l}`;
        return l;
      }).join('\n') + (endNl ? '\n' : ''));
    });
  });

  def('tac', async (c) => readInputs(c, c.args, 'tac', (t) => {
    const lines = t.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();
    c.out(lines.reverse().join('\n') + (lines.length ? '\n' : ''));
  }));

  def('nl', async (c) => {
    const { f, ops } = getopt(c.args, 'b:w:s:n:', {});
    let n = 0;
    const w = +(f.w || 6);
    const sep = f.s != null ? f.s : '\t';
    return readInputs(c, ops, 'nl', (t) => {
      const lines = t.split('\n');
      if (lines[lines.length - 1] === '') lines.pop();
      c.out(lines.map((l) => (f.b === 'a' || l.trim() !== '' ? String(++n).padStart(w) + sep + l : ' '.repeat(w) + (f.b === 'a' ? '' : '') + ' ' + l).replace(/^ +$/, '')).join('\n') + '\n');
    });
  });

  // ======================================================================= head · tail
  def('head', async (c) => {
    const { f, ops } = getopt(c.args, 'n:c:qv#', { lines: 'n:', bytes: 'c:', quiet: 'q', verbose: 'v' });
    let n = f['#'] ? +f['#'] : f.n != null ? +f.n : 10;
    const neg = String(f.n || '').startsWith('-');
    const list = ops.length ? ops : ['-'];
    const headers = (list.length > 1 && !f.q) || f.v;
    let first = true;
    return readInputs(c, list, 'head', (t, name) => {
      if (headers) { c.out(`${first ? '' : '\n'}==> ${name === '-' ? 'standard input' : name} <==\n`); first = false; }
      if (f.c != null) { c.out([...t].slice(0, +f.c).join('')); return; }
      const lines = t.split('\n');
      const endNl = t.endsWith('\n');
      if (endNl) lines.pop();
      const take = neg ? lines.slice(0, Math.max(0, lines.length + n)) : lines.slice(0, n);
      c.out(take.join('\n') + (take.length && (endNl || take.length < lines.length) ? '\n' : ''));
    });
  });

  def('tail', async (c) => {
    const { f, ops } = getopt(c.args, 'n:c:fFqv#', { lines: 'n:', bytes: 'c:', follow: 'f', quiet: 'q', verbose: 'v' });
    const spec = f['#'] || (f.n != null ? String(f.n) : '10');
    const fromStart = spec.startsWith('+');
    const n = Math.abs(parseInt(spec, 10));
    const list = ops.length ? ops : ['-'];
    const headers = (list.length > 1 && !f.q) || f.v;
    let first = true;
    const st = await readInputs(c, list, 'tail', (t, name) => {
      if (headers) { c.out(`${first ? '' : '\n'}==> ${name === '-' ? 'standard input' : name} <==\n`); first = false; }
      if (f.c != null) { const ch = [...t]; c.out(ch.slice(Math.max(0, ch.length - +f.c)).join('')); return; }
      const lines = t.split('\n');
      const endNl = t.endsWith('\n');
      if (endNl) lines.pop();
      const take = fromStart ? lines.slice(Math.max(0, n - 1)) : lines.slice(Math.max(0, lines.length - n));
      c.out(take.join('\n') + (take.length && endNl ? '\n' : ''));
    });
    if ((f.f || f.F) && ops.length && !c.session.headless) {
      // 파일 끝을 계속 따라간다 (Ctrl+C 로 끝)
      const sizes = {};
      ops.forEach((o) => { try { sizes[o] = c.fs.readFile(c.resolve(o), c.cred).length; } catch (e) { sizes[o] = 0; } });
      for (;;) {
        await c.sleep(500);
        for (const o of ops) {
          let t;
          try { t = c.fs.readFile(c.resolve(o), c.cred); } catch (e) { continue; }
          if (t.length > sizes[o]) { c.out(t.slice(sizes[o])); sizes[o] = t.length; }
          else if (t.length < sizes[o]) { c.err(`tail: ${o}: file truncated\n`); sizes[o] = t.length; }
        }
      }
    }
    return st;
  });

  def(['less', 'more', 'most', 'pg'], async (c) => {
    const ops = c.args.filter((a) => !a.startsWith('-') || a === '-');
    const st = await readInputs(c, ops, c.name, (t) => c.out(t && !t.endsWith('\n') ? t + '\n' : t));
    return st;
  });

  // ======================================================================= wc
  def('wc', async (c) => {
    const { f, ops } = getopt(c.args, 'lwcmL', { lines: 'l', words: 'w', bytes: 'c', chars: 'm', 'max-line-length': 'L' });
    const all = !(f.l || f.w || f.c || f.m || f.L);
    const res = [];
    const tot = { l: 0, w: 0, c: 0, m: 0, L: 0 };
    const st = await readInputs(c, ops, 'wc', (t, name) => {
      const r = { name: name === '-' && !ops.length ? '' : name, l: (t.match(/\n/g) || []).length, w: (t.match(/\S+/g) || []).length, c: LX.byteLen(t), m: [...t].length, L: t.split('\n').reduce((a, x) => Math.max(a, x.length), 0) };
      Object.keys(tot).forEach((k) => { tot[k] = k === 'L' ? Math.max(tot[k], r[k]) : tot[k] + r[k]; });
      res.push(r);
    });
    if (ops.length > 1) res.push(Object.assign({ name: 'total' }, tot));
    const keys = all ? ['l', 'w', 'c'] : ['l', 'w', 'm', 'c', 'L'].filter((k) => f[k]);
    let width = Math.max(1, ...res.map((r) => Math.max(...keys.map((k) => String(r[k]).length))));
    if (!ops.length && keys.length > 1) width = 7;
    if (keys.length === 1 && res.length === 1) width = 1;
    res.forEach((r) => c.out(keys.map((k) => String(r[k]).padStart(width)).join(' ') + (r.name ? ' ' + r.name : '') + '\n'));
    return st;
  });

  // ======================================================================= mkdir · rmdir · touch
  def('mkdir', async (c) => {
    const { f, ops } = getopt(c.args, 'pvm:', { parents: 'p', verbose: 'v', mode: 'm:' });
    if (!ops.length) { c.err("mkdir: missing operand\nTry 'mkdir --help' for more information.\n"); return 1; }
    let st = 0;
    const mode = f.m ? parseMode(f.m, 0o777) : (0o777 & ~c.sh.umask);
    for (const d of ops) {
      try {
        const made = c.fs.mkdir(c.resolve(d), c.cred, { parents: !!f.p, mode });
        if (f.v) made.forEach((p) => c.out(`mkdir: created directory '${f.p ? relTo(c, p, d) : d}'\n`));
      } catch (e) {
        c.err(`mkdir: cannot create directory ‘${d}’: ${e.message}\n`);
        st = 1;
      }
    }
    return st;
  });
  function relTo(c, abs, orig) { return orig.startsWith('/') ? abs : abs.replace(c.cwd === '/' ? '/' : c.cwd + '/', ''); }

  def('rmdir', async (c) => {
    const { f, ops } = getopt(c.args, 'pv', { parents: 'p', verbose: 'v', 'ignore-fail-on-non-empty': 'ign' });
    if (!ops.length) { c.err("rmdir: missing operand\nTry 'rmdir --help' for more information.\n"); return 1; }
    let st = 0;
    for (const d of ops) {
      const list = [d];
      if (f.p) { let x = d; while (x.includes('/')) { x = x.replace(/\/[^/]*$/, ''); if (x) list.push(x); } }
      for (const x of list) {
        try { c.fs.rmdir(c.resolve(x), c.cred); if (f.v) c.out(`rmdir: removing directory, '${x}'\n`); } catch (e) {
          if (!(f.ign && e.code === 'ENOTEMPTY')) { c.err(`rmdir: failed to remove '${x}': ${e.message}\n`); st = 1; }
          break;
        }
      }
    }
    return st;
  });

  def('touch', async (c) => {
    const { f, ops } = getopt(c.args, 'acmd:t:r:h', { 'no-create': 'c', date: 'd:', reference: 'r:' });
    if (!ops.length) { c.err("touch: missing file operand\nTry 'touch --help' for more information.\n"); return 1; }
    let st = 0;
    let t = c.m.now();
    if (f.d) { const d = parseDate(c.m, f.d); if (d != null) t = d; }
    if (f.t) { const r = /^(?:(\d\d)?(\d\d))?(\d\d)(\d\d)(\d\d)(\d\d)(?:\.(\d\d))?$/.exec(f.t); if (r) t = Date.UTC(+((r[1] || '20') + (r[2] || '26')), +r[3] - 1, +r[4], +r[5], +r[6], +(r[7] || 0)) - LX.tzOffsetMin(c.m) * 60000; }
    if (f.r) { try { t = c.fs.stat(c.resolve(f.r), c.cred).mt; } catch (e) { c.err(`touch: failed to get attributes of '${f.r}': ${e.message}\n`); return 1; } }
    for (const p of ops) {
      const abs = c.resolve(p);
      try {
        const n = c.fs.lookup(abs);
        if (n) {
          if (c.cred.uid !== 0 && n.u !== c.cred.uid && !c.fs.perm(n, c.cred, 2)) throw new LX.FSError('EACCES');
          n.mt = t;
          c.fs.touchChanged();
        } else if (!f.c) {
          c.fs.writeFile(abs, '', c.cred, { mode: 0o666 & ~c.sh.umask });
          c.fs.lookup(abs).mt = t;
        }
      } catch (e) {
        c.err(`touch: cannot touch '${p}': ${e.message}\n`);
        st = 1;
      }
    }
    return st;
  });

  function parseDate(m, s) {
    s = String(s).trim();
    const now = m.now();
    const rel = /^(-?\d+)\s*(second|sec|minute|min|hour|day|week|month|year)s?\s*(ago)?$/i.exec(s);
    if (rel) {
      const mult = { second: 1e3, sec: 1e3, minute: 6e4, min: 6e4, hour: 36e5, day: 864e5, week: 6048e5, month: 2592e6, year: 31536e6 }[rel[2].toLowerCase()];
      return now + (rel[3] ? -1 : 1) * +rel[1] * mult;
    }
    if (/^yesterday$/i.test(s)) return now - 864e5;
    if (/^tomorrow$/i.test(s)) return now + 864e5;
    if (/^(now|today)$/i.test(s)) return now;
    if (/^@\d+$/.test(s)) return +s.slice(1) * 1000;
    const r = /^(\d{4})-(\d\d)-(\d\d)(?:[ T](\d\d):(\d\d)(?::(\d\d))?)?$/.exec(s);
    if (r) return Date.UTC(+r[1], +r[2] - 1, +r[3], +(r[4] || 0), +(r[5] || 0), +(r[6] || 0)) - LX.tzOffsetMin(m) * 60000;
    const d = Date.parse(s);
    return Number.isNaN(d) ? null : d;
  }
  LX.parseDate = parseDate;

  // ======================================================================= cp · mv · rm · ln
  function copyNode(c, srcAbs, dstAbs, opts, srcLabel, dstLabel) {
    const fs = c.fs;
    const src = fs.stat(srcAbs, c.cred, !opts.noDeref);
    if (src.t === 'd') {
      if (!opts.r) { c.err(`cp: -r not specified; omitting directory '${srcLabel}'\n`); return 1; }
      if ((dstAbs + '/').startsWith(srcAbs.replace(/\/$/, '') + '/')) { c.err(`cp: cannot copy a directory, '${srcLabel}', into itself, '${dstLabel}'\n`); return 1; }
      if (!fs.perm(src, c.cred, 4)) throw Object.assign(new LX.FSError('EACCES'), { label: `cannot open directory '${srcLabel}'` });
      let dnode = fs.lookup(dstAbs);
      if (!dnode) {
        fs.mkdir(dstAbs, c.cred, { mode: opts.p ? src.m : (src.m & ~c.sh.umask) });
        dnode = fs.lookup(dstAbs);
        if (opts.v) c.out(`'${srcLabel}' -> '${dstLabel}'\n`);
      }
      let st = 0;
      for (const name of Object.keys(src.k)) {
        try { st |= copyNode(c, srcAbs + '/' + name, dstAbs + '/' + name, opts, srcLabel.replace(/\/$/, '') + '/' + name, dstLabel.replace(/\/$/, '') + '/' + name); } catch (e) { c.err(`cp: cannot copy '${srcLabel}/${name}': ${e.message}\n`); st = 1; }
      }
      if (opts.p) { dnode.m = src.m; dnode.mt = src.mt; if (c.cred.uid === 0) { dnode.u = src.u; dnode.g = src.g; } }
      return st;
    }
    if (src.t === 'l' && opts.noDeref) {
      fs.symlink(src.l, dstAbs, c.cred);
      return 0;
    }
    const data = fs.readFile(srcAbs, c.cred);
    const existing = fs.lookup(dstAbs);
    if (existing && existing.t === 'd') throw new LX.FSError('EISDIR', dstAbs);
    fs.writeFile(dstAbs, data, c.cred, { mode: src.m & ~c.sh.umask & 0o777 | (src.m & 0o111 ? 0 : 0) });
    const d = fs.lookup(dstAbs);
    if (src.sz != null) d.sz = src.sz;
    if (!existing) d.m = opts.p ? src.m : (src.m & 0o777 & ~c.sh.umask);
    if (opts.p) { d.m = src.m; d.mt = src.mt; if (c.cred.uid === 0) { d.u = src.u; d.g = src.g; } }
    if (opts.v) c.out(`'${srcLabel}' -> '${dstLabel}'\n`);
    return 0;
  }

  def('cp', async (c) => {
    const { f, ops } = getopt(c.args, 'rRaivpfnuPdLlst:T', { recursive: 'r', archive: 'a', interactive: 'i', verbose: 'v', preserve: 'p', force: 'f', 'no-clobber': 'n', update: 'u', 'target-directory': 't:', 'no-target-directory': 'T' });
    const opts = { r: f.r || f.R || f.a, p: f.p || f.a, v: f.v, noDeref: f.a || f.P || f.d };
    let list = ops.slice();
    let dest = f.t || list.pop();
    if (!list.length) {
      if (dest == null) c.err("cp: missing file operand\nTry 'cp --help' for more information.\n");
      else c.err(`cp: missing destination file operand after '${dest}'\nTry 'cp --help' for more information.\n`);
      return 1;
    }
    const dAbs = c.resolve(dest);
    const dNode = c.fs.lookup(dAbs);
    const intoDir = dNode && dNode.t === 'd' && !f.T;
    if (list.length > 1 && !intoDir) { c.err(`cp: target '${dest}': ${dNode ? 'Not a directory' : 'No such file or directory'}\n`); return 1; }
    let st = 0;
    for (const s of list) {
      const sAbs = c.resolve(s);
      const target = intoDir ? dAbs.replace(/\/$/, '') + '/' + P().basename(sAbs) : dAbs;
      const tLabel = intoDir ? dest.replace(/\/$/, '') + '/' + P().basename(sAbs) : dest;
      try {
        const sn = c.fs.stat(sAbs, c.cred);
        const tn = c.fs.lookup(target);
        if (tn && tn === sn) { c.err(`cp: '${s}' and '${tLabel}' are the same file\n`); st = 1; continue; }
        if (tn && tn.t !== 'd' && f.n) continue;
        if (tn && tn.t !== 'd' && f.u && tn.mt >= sn.mt) continue;
        if (tn && tn.t !== 'd' && f.i) {
          const ans = await c.readLine(`cp: overwrite '${tLabel}'? `, { tty: true });
          if (!/^y/i.test(ans || '')) continue;
        }
        st |= copyNode(c, sAbs, target, opts, s, tLabel);
      } catch (e) {
        if (e.code === 'ENOENT' && !c.fs.lookup(sAbs)) c.err(`cp: cannot stat '${s}': ${e.message}\n`);
        else if (e.label) c.err(`cp: ${e.label}: ${e.message}\n`);
        else if (e.code === 'EACCES' && !c.fs.perm(c.fs.lookup(sAbs) || {}, c.cred, 4)) c.err(`cp: cannot open '${s}' for reading: ${e.message}\n`);
        else c.err(`cp: cannot create regular file '${tLabel}': ${e.message}\n`);
        st = 1;
      }
    }
    return st;
  });

  def('mv', async (c) => {
    const { f, ops } = getopt(c.args, 'ivfnut:T', { interactive: 'i', verbose: 'v', force: 'f', 'no-clobber': 'n', update: 'u', 'target-directory': 't:' });
    let list = ops.slice();
    const dest = f.t || list.pop();
    if (!list.length) {
      if (dest == null) c.err("mv: missing file operand\nTry 'mv --help' for more information.\n");
      else c.err(`mv: missing destination file operand after '${dest}'\nTry 'mv --help' for more information.\n`);
      return 1;
    }
    const dAbs = c.resolve(dest);
    const dNode = c.fs.lookup(dAbs);
    const intoDir = dNode && dNode.t === 'd' && !f.T;
    if (list.length > 1 && !intoDir) { c.err(`mv: target '${dest}': Not a directory\n`); return 1; }
    let st = 0;
    for (const s of list) {
      const sAbs = c.resolve(s);
      const target = intoDir ? dAbs.replace(/\/$/, '') + '/' + P().basename(sAbs) : dAbs;
      const tLabel = intoDir ? dest.replace(/\/$/, '') + '/' + P().basename(sAbs) : dest;
      try {
        if (!c.fs.lookup(sAbs, false)) { c.err(`mv: cannot stat '${s}': No such file or directory\n`); st = 1; continue; }
        const tn = c.fs.lookup(target, false);
        if (target === sAbs) { c.err(`mv: '${s}' and '${tLabel}' are the same file\n`); st = 1; continue; }
        if (tn && f.n) continue;
        if (tn && f.i) {
          const ans = await c.readLine(`mv: overwrite '${tLabel}'? `, { tty: true });
          if (!/^y/i.test(ans || '')) continue;
        }
        if (tn && tn.t !== 'd') c.fs.unlink(target, c.cred);
        c.fs.rename(sAbs, target, c.cred);
        if (f.v) c.out(`renamed '${s}' -> '${tLabel}'\n`);
      } catch (e) {
        if (e.code === 'EINVAL') c.err(`mv: cannot move '${s}' to a subdirectory of itself, '${tLabel}'\n`);
        else c.err(`mv: cannot move '${s}' to '${tLabel}': ${e.message}\n`);
        st = 1;
      }
    }
    return st;
  });

  def('rm', async (c) => {
    const { f, ops } = getopt(c.args, 'rRfivdI', { recursive: 'r', force: 'f', interactive: 'i', verbose: 'v', dir: 'd', 'no-preserve-root': 'npr' });
    if (!ops.length) { if (!f.f) { c.err("rm: missing operand\nTry 'rm --help' for more information.\n"); return 1; } return 0; }
    let st = 0;
    const rec = f.r || f.R;
    if (f.I && !f.f && (ops.length > 3 || rec)) {
      const ans = await c.readLine(rec ? `rm: remove ${ops.length} argument${ops.length > 1 ? 's' : ''} recursively? ` : `rm: remove ${ops.length} arguments? `, { tty: true });
      if (!/^y/i.test(ans || '')) return 0;
    }
    for (const p of ops) {
      const abs = c.resolve(p);
      if (/^\.\.?$/.test(P().basename(p.replace(/\/+$/, '') || '/')) && rec) { c.err(`rm: refusing to remove '.' or '..' directory: skipping '${p}'\n`); st = 1; continue; }
      if (abs === '/' && rec && !f.npr) { c.err("rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe\n"); st = 1; continue; }
      const node = c.fs.lookup(abs, false);
      if (!node) { if (!f.f) { c.err(`rm: cannot remove '${p}': No such file or directory\n`); st = 1; } continue; }
      if (node.t === 'd' && !rec && !f.d) { c.err(`rm: cannot remove '${p}': Is a directory\n`); st = 1; continue; }
      if (f.i) {
        const ans = await c.readLine(`rm: remove ${node.t === 'd' ? 'directory' : 'regular file'} '${p}'? `, { tty: true });
        if (!/^y/i.test(ans || '')) continue;
      } else if (!f.f && node.t === 'f' && c.cred.uid !== 0 && !c.fs.perm(node, c.cred, 2) && c.tty && !c.session.headless) {
        const ans = await c.readLine(`rm: remove write-protected regular ${node.c ? '' : 'empty '}file '${p}'? `, { tty: true });
        if (!/^y/i.test(ans || '')) continue;
      }
      try {
        if (node.t === 'd' && rec) {
          const errs = [];
          c.fs.remove(abs, c.cred, (e) => errs.push(e));
          errs.forEach((e) => c.err(`rm: cannot remove '${e.path ? e.path.replace(abs, p) : p}': ${e.message}\n`));
          if (errs.length) st = 1;
          else if (f.v) c.out(`removed directory '${p}'\n`);
        } else if (node.t === 'd') {
          c.fs.rmdir(abs, c.cred);
          if (f.v) c.out(`removed directory '${p}'\n`);
        } else {
          c.fs.unlink(abs, c.cred);
          if (f.v) c.out(`removed '${p}'\n`);
        }
      } catch (e) {
        c.err(`rm: cannot remove '${p}': ${e.message}\n`);
        st = 1;
      }
    }
    return st;
  });

  def('ln', async (c) => {
    const { f, ops } = getopt(c.args, 'sfvnrT', { symbolic: 's', force: 'f', verbose: 'v', 'no-dereference': 'n', relative: 'r' });
    if (!ops.length) { c.err("ln: missing file operand\nTry 'ln --help' for more information.\n"); return 1; }
    let list = ops.slice();
    let dest = list.length > 1 ? list.pop() : '.';
    const dAbs = c.resolve(dest);
    const dNode = f.n ? c.fs.lookup(dAbs, false) : c.fs.lookup(dAbs);
    let st = 0;
    for (const s of list) {
      let link = dNode && dNode.t === 'd' && !f.T ? dAbs.replace(/\/$/, '') + '/' + P().basename(s) : dAbs;
      const label = dNode && dNode.t === 'd' ? dest.replace(/\/$/, '') + '/' + P().basename(s) : dest;
      try {
        if (f.f && c.fs.lookup(link, false)) c.fs.unlink(link, c.cred);
        if (f.s) c.fs.symlink(s, link, c.cred);
        else {
          if (!c.fs.lookup(c.resolve(s))) { c.err(`ln: failed to access '${s}': No such file or directory\n`); st = 1; continue; }
          c.fs.link(c.resolve(s), link, c.cred);
        }
        if (f.v) c.out(`'${label}' -> '${s}'\n`);
      } catch (e) {
        if (e.code === 'EEXIST') c.err(`ln: failed to create ${f.s ? 'symbolic' : 'hard'} link '${label}': File exists\n`);
        else if (e.code === 'EPERM') c.err(`ln: '${s}': hard link not allowed for directory\n`);
        else c.err(`ln: failed to create ${f.s ? 'symbolic' : 'hard'} link '${label}': ${e.message}\n`);
        st = 1;
      }
    }
    return st;
  });

  // ======================================================================= 권한
  /** 기호 · 8진 모드 해석 */
  function parseMode(spec, cur, isDir) {
    if (/^[0-7]{1,4}$/.test(spec)) return parseInt(spec, 8);
    let mode = cur;
    for (const part of spec.split(',')) {
      const r = /^([ugoa]*)([-+=])([rwxXst]*|[ugo])$/.exec(part);
      if (!r) return null;
      let who = r[1] || 'a';
      if (who.includes('a')) who = 'ugo';
      let bits = 0;
      const perms = r[3];
      const src = { u: (cur >> 6) & 7, g: (cur >> 3) & 7, o: cur & 7 };
      for (const w of who) {
        const shift = { u: 6, g: 3, o: 0 }[w];
        let b = 0;
        if (/^[ugo]$/.test(perms)) b = src[perms];
        else {
          if (perms.includes('r')) b |= 4;
          if (perms.includes('w')) b |= 2;
          if (perms.includes('x') || (perms.includes('X') && (isDir || (cur & 0o111)))) b |= 1;
        }
        bits |= b << shift;
        if (perms.includes('s')) bits |= w === 'u' ? 0o4000 : w === 'g' ? 0o2000 : 0;
        if (perms.includes('t') && (w === 'o' || !r[1])) bits |= 0o1000;
      }
      if (r[2] === '+') mode |= bits;
      else if (r[2] === '-') mode &= ~bits;
      else {
        let mask = 0;
        for (const w of who) mask |= 7 << { u: 6, g: 3, o: 0 }[w];
        mode = (mode & ~mask) | bits;
      }
    }
    return mode;
  }
  LX.parseMode = parseMode;

  def('chmod', async (c) => {
    const args = c.args.slice();
    const flags = { R: false, v: false, c: false };
    const rest = [];
    for (const a of args) {
      if (/^-[Rvcf]+$/.test(a)) { for (const ch of a.slice(1)) flags[ch] = true; continue; }
      if (a === '--recursive') { flags.R = true; continue; }
      if (a === '--verbose') { flags.v = true; continue; }
      rest.push(a);
    }
    if (rest.length < 2) { c.err(rest.length ? `chmod: missing operand after '${rest[0]}'\nTry 'chmod --help' for more information.\n` : "chmod: missing operand\nTry 'chmod --help' for more information.\n"); return 1; }
    const spec = rest.shift();
    let st = 0;
    const apply = (abs, label) => {
      const n = c.fs.stat(abs, c.cred);
      const nm = parseMode(spec, n.m & 0o7777, n.t === 'd');
      if (nm == null) { c.err(`chmod: invalid mode: '${spec}'\nTry 'chmod --help' for more information.\n`); throw new Error('mode'); }
      const old = n.m;
      try {
        c.fs.chmod(abs, nm, c.cred);
      } catch (e) {
        c.err(`chmod: changing permissions of '${label}': ${e.message}\n`);
        st = 1;
        return;
      }
      if (flags.v || (flags.c && old !== nm)) c.out(`mode of '${label}' changed from ${(old & 0o7777).toString(8).padStart(4, '0')} (${modeStr({ t: n.t, m: old }).slice(1)}) to ${nm.toString(8).padStart(4, '0')} (${modeStr({ t: n.t, m: nm }).slice(1)})\n`);
      if (flags.R && n.t === 'd') {
        for (const k of Object.keys(n.k)) { const child = n.k[k]; if (child.t !== 'l') apply(abs + '/' + k, label + '/' + k); }
      }
    };
    for (const p of rest) {
      try { apply(c.resolve(p), p); } catch (e) {
        if (e.message === 'mode') return 1;
        c.err(`chmod: cannot access '${p}': ${e.message}\n`);
        st = 1;
      }
    }
    return st;
  });

  function chownCmd(isGrp) {
    return async (c) => {
      const { f, ops } = getopt(c.args, 'Rvchf', { recursive: 'R', verbose: 'v', 'no-dereference': 'h', reference: 'reference' });
      const cmd = isGrp ? 'chgrp' : 'chown';
      if (ops.length < 2) { c.err(ops.length ? `${cmd}: missing operand after '${ops[0]}'\nTry '${cmd} --help' for more information.\n` : `${cmd}: missing operand\nTry '${cmd} --help' for more information.\n`); return 1; }
      const spec = ops.shift();
      let uid = null, gid = null;
      if (isGrp) {
        const g = c.m.groups().find((x) => x.name === spec || String(x.gid) === spec);
        if (!g) { c.err(`chgrp: invalid group: '${spec}'\n`); return 1; }
        gid = g.gid;
      } else {
        const [u, g] = spec.split(/[:.]/);
        if (u) {
          const uu = c.m.passwd().find((x) => x.name === u || String(x.uid) === u);
          if (!uu) { c.err(`chown: invalid user: '${spec}'\n`); return 1; }
          uid = uu.uid;
          if (spec.endsWith(':') ) gid = uu.gid;
        }
        if (g) {
          const gg = c.m.groups().find((x) => x.name === g || String(x.gid) === g);
          if (!gg) { c.err(`chown: invalid group: '${spec}'\n`); return 1; }
          gid = gg.gid;
        }
      }
      let st = 0;
      const apply = (abs, label) => {
        let n;
        try { n = c.fs.stat(abs, c.cred, !f.h); } catch (e) { c.err(`${cmd}: cannot access '${label}': ${e.message}\n`); st = 1; return; }
        try {
          if (c.cred.uid !== 0) throw new LX.FSError('EPERM');
          c.fs.chown(abs, uid, gid, c.cred, !f.h);
          if (f.v) c.out(`changed ownership of '${label}' to ${c.m.userName(n.u)}:${c.m.groupName(n.g)}\n`);
        } catch (e) {
          c.err(`${cmd}: changing ${isGrp ? 'group' : 'ownership'} of '${label}': ${e.message}\n`);
          st = 1;
          return;
        }
        if (f.R && n.t === 'd') Object.keys(n.k).forEach((k) => apply(abs + '/' + k, label + '/' + k));
      };
      ops.forEach((p) => apply(c.resolve(p), p));
      return st;
    };
  }
  def('chown', chownCmd(false));
  def('chgrp', chownCmd(true));

  // ======================================================================= stat · file
  def('stat', async (c) => {
    const { f, ops } = getopt(c.args, 'c:Lf', { format: 'c:', printf: 'c:', dereference: 'L', 'file-system': 'f' });
    if (!ops.length) { c.err("stat: missing operand\nTry 'stat --help' for more information.\n"); return 1; }
    let st = 0;
    for (const p of ops) {
      const abs = c.resolve(p);
      let n;
      try { n = c.fs.stat(abs, c.cred, !!f.L); } catch (e) { c.err(`stat: cannot statx '${p}': ${e.message}\n`); st = 1; continue; }
      const type = { d: 'directory', f: LX.byteLen(n.c) === 0 && n.sz == null ? 'regular empty file' : 'regular file', l: 'symbolic link', c: 'character special file', b: 'block special file' }[n.t];
      const size = c.fs.size(n);
      if (f.c) {
        c.out(f.c.replace(/%([aAUGugsnFyYxXzZhiblw%NoB])/g, (m, k) => ({
          a: (n.m & 0o7777).toString(8), A: modeStr(n), U: c.m.userName(n.u), G: c.m.groupName(n.g), u: String(n.u), g: String(n.g), s: String(size), n: p, N: `'${p}'`, F: type,
          y: fullTime(c.m, n.mt), Y: String(Math.floor(n.mt / 1000)), x: fullTime(c.m, n.mt), X: String(Math.floor(n.mt / 1000)), z: fullTime(c.m, n.mt), Z: String(Math.floor(n.mt / 1000)),
          h: String(n.nl || 1), i: String(LX.inode(abs, n)), b: String(Math.ceil(size / 512)), B: '512', o: '4096', w: '-', '%': '%'
        }[k])) + '\n');
        continue;
      }
      const t = fullTime(c.m, n.mt);
      c.out(`  File: ${p}${n.t === 'l' ? ' -> ' + n.l : ''}\n  Size: ${String(size).padEnd(10)}\tBlocks: ${String(Math.ceil(size / 4096) * 8).padEnd(10)} IO Block: 4096   ${type}\nDevice: 252,0\tInode: ${String(LX.inode(abs, n)).padEnd(11)} Links: ${n.t === 'd' ? 2 + Object.values(n.k).filter((x) => x.t === 'd').length : n.nl || 1}\nAccess: (${(n.m & 0o7777).toString(8).padStart(4, '0')}/${modeStr(n)})  Uid: (${String(n.u).padStart(5)}/${c.m.userName(n.u).padStart(8)})   Gid: (${String(n.g).padStart(5)}/${c.m.groupName(n.g).padStart(8)})\nAccess: ${t}\nModify: ${t}\nChange: ${t}\n Birth: ${t}\n`);
    }
    return st;
  });

  function fileType(c, abs, n, text) {
    if (n.t === 'd') return 'directory';
    if (n.t === 'l') return `symbolic link to ${n.l}`;
    if (n.t === 'c') return `character special (${devNo(abs).replace(', ', '/')})`;
    if (n.t === 'b') return `block special (${devNo(abs).replace(', ', '/')})`;
    if (n.sz != null && !text) return /swap/.test(abs) ? 'Linux swap file, 4k page size, little endian, version 1, size 1048575 pages, 0 bad pages, no label, UUID=7c4b2d11-9e3a-4b8e-a6f1-2d9c5e7b0a44' : 'data';
    if (!text) return 'empty';
    if (text.startsWith(LX.ELF)) return 'ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=3f5b1c2d9e7a, for GNU/Linux 3.2.0, stripped';
    if (text.startsWith('\x1f\x8bGZ')) return `gzip compressed data, was "${P().basename(abs).replace(/\.gz$/, '')}", last modified: ${new Date(n.mt).toUTCString()}, from Unix`;
    if (text.startsWith('\x00TAR')) return 'POSIX tar archive (GNU)';
    if (text.startsWith('PK\x03\x04')) return 'Zip archive data, at least v2.0 to extract, compression method=deflate';
    if (text.startsWith('BZh')) return 'bzip2 compressed data, block size = 900k';
    if (text.startsWith('\xfd7zXZ')) return 'XZ compressed data, checksum CRC64';
    if (text.startsWith('\x28\xb5\x2f\xfdZST')) return 'Zstandard compressed data (v0.8+), Dictionary ID: None';
    if (/^-----BEGIN OPENSSH PRIVATE KEY/.test(text)) return 'OpenSSH private key';
    if (/^ssh-(ed25519|rsa) /.test(text)) return `OpenSSH ${/ed25519/.test(text) ? 'ED25519' : 'RSA'} public key`;
    if (/^-----BEGIN CERTIFICATE/.test(text)) return 'PEM certificate';
    const utf = /[^\x00-\x7f]/.test(text);
    const enc = utf ? 'Unicode text, UTF-8 text' : 'ASCII text';
    const crlf = /\r\n/.test(text) ? ', with CRLF line terminators' : '';
    const first = text.split('\n')[0];
    if (/^#!.*\b(bash|sh)\b/.test(first)) return `Bourne-Again shell script, ${enc} executable`;
    if (/^#!.*python/.test(first)) return `Python script, ${enc} executable`;
    if (/^\s*<!DOCTYPE html|^\s*<html/i.test(text)) return `HTML document, ${enc}`;
    if (/^\s*<\?php/.test(text)) return `PHP script, ${enc}`;
    if (/^\s*[{[][\s\S]*[}\]]\s*$/.test(text)) { try { JSON.parse(text); return 'JSON text data'; } catch (e) { /* 아님 */ } }
    if (/^\s*<\?xml/.test(text)) return `XML 1.0 document, ${enc}`;
    if (/\.csv$/i.test(abs) && text.includes(',')) return `CSV ${utf ? 'Unicode' : 'ASCII'} text`;
    return enc + crlf;
  }

  def('file', async (c) => {
    const { f, ops } = getopt(c.args, 'bLiz', { brief: 'b', 'mime-type': 'i', mime: 'i' });
    if (!ops.length) { c.err('Usage: file [-bcCdEhikLlNnprsSvzZ0] [--apple] [--extension] [--mime-encoding]\n            [--mime-type] [-e <testname>] [-F <separator>]  [-f <namefile>]\n            [-m <magicfiles>] [-P <parameter=value>] [--exclude-quiet]\n            <file> ...\n'); return 1; }
    for (const p of ops) {
      const abs = c.resolve(p);
      const n = c.fs.lookup(abs, !!f.L);
      if (!n) { c.out(`${p}: cannot open \`${p}' (No such file or directory)\n`); continue; }
      let text = '';
      try { if (n.t === 'f') text = c.fs.readFile(abs, c.cred); } catch (e) { c.out(`${p}: regular file, no read permission\n`); continue; }
      let type = fileType(c, abs, n, text);
      if (f.i) type = n.t === 'd' ? 'inode/directory' : /ELF/.test(type) ? 'application/x-pie-executable' : /gzip/.test(type) ? 'application/gzip' : /HTML/.test(type) ? 'text/html' : /shell/.test(type) ? 'text/x-shellscript' : /JSON/.test(type) ? 'application/json' : /empty/.test(type) ? 'inode/x-empty' : 'text/plain';
      c.out(f.b ? type + '\n' : `${p}: ${type}\n`);
    }
    return 0;
  });

  // ======================================================================= tree
  def('tree', async (c) => {
    const { f, ops } = getopt(c.args, 'adfL:pugshDCnFI:P:', { noreport: 'noreport', 'dirsfirst': 'dirsfirst' });
    const colorOn = !f.n && (c.tty || f.C);
    const roots = ops.length ? ops : ['.'];
    let nd = 0, nf = 0;
    const max = f.L ? +f.L : Infinity;
    const ign = f.I ? LX.glob.globToRe(f.I, true) : null;
    const pat = f.P ? LX.glob.globToRe(f.P, true) : null;
    for (const r of roots) {
      const abs = c.resolve(r);
      const n = c.fs.lookup(abs);
      if (!n) { c.out(`${r}  [error opening dir]\n`); continue; }
      c.out((colorOn && n.t === 'd' ? LX.lsColor(r, n) : r) + '\n');
      const walk = (dir, node, prefix, depth) => {
        if (depth > max) return;
        let names;
        try { names = c.fs.readdir(dir, c.cred); } catch (e) { return; }
        if (!f.a) names = names.filter((x) => !x.startsWith('.'));
        let ents = names.map((nm) => ({ nm, node: c.fs.lookup(dir + '/' + nm, false) })).filter((e) => e.node);
        if (f.d) ents = ents.filter((e) => e.node.t === 'd' || (e.node.t === 'l' && (c.fs.lookup(dir + '/' + e.nm) || {}).t === 'd'));
        if (ign) ents = ents.filter((e) => !ign.test(e.nm));
        if (pat) ents = ents.filter((e) => e.node.t === 'd' || pat.test(e.nm));
        if (f.dirsfirst) ents.sort((a, b) => (b.node.t === 'd') - (a.node.t === 'd'));
        ents.forEach((e, i) => {
          const last = i === ents.length - 1;
          const full = (dir === '/' ? '' : dir) + '/' + e.nm;
          let label = f.f ? (r.replace(/\/$/, '') + full.slice(abs.length)) : e.nm;
          if (colorOn) label = LX.lsColor(label, e.node, c.fs, e.node.t === 'l' ? c.fs.lookup(full) : undefined);
          if (e.node.t === 'l') label += ' -> ' + e.node.l;
          let meta = [];
          if (f.p) meta.push(modeStr(e.node));
          if (f.u) meta.push(c.m.userName(e.node.u).padEnd(8));
          if (f.g) meta.push(c.m.groupName(e.node.g).padEnd(8));
          if (f.s || f.h) meta.push(f.h ? human(c.fs.size(e.node)).padStart(4) : String(c.fs.size(e.node)).padStart(11));
          c.out(`${prefix}${last ? '└── ' : '├── '}${meta.length ? '[' + meta.join(' ') + ']  ' : ''}${label}\n`);
          if (e.node.t === 'd') { nd++; walk(full, e.node, prefix + (last ? '    ' : '│   '), depth + 1); } else nf++;
        });
      };
      if (n.t === 'd') walk(abs, n, '', 1);
    }
    if (!f.noreport) c.out(`\n${nd} director${nd === 1 ? 'y' : 'ies'}${f.d ? '' : `, ${nf} file${nf === 1 ? '' : 's'}`}\n`);
    return 0;
  });

  // ======================================================================= find
  def('find', async (c) => {
    const args = c.args.slice();
    const paths = [];
    while (args.length && !/^[-(!]/.test(args[0])) paths.push(args.shift());
    if (!paths.length) paths.push('.');
    let maxDepth = Infinity, minDepth = 0;
    // 식 해석
    let p = 0;
    const toks = args;
    let hasAction = false;
    function parseOr() {
      let l = parseAnd();
      while (toks[p] === '-o' || toks[p] === '-or') { p++; const r = parseAnd(); const a = l; l = (x) => a(x) || r(x); }
      return l;
    }
    function parseAnd() {
      let l = parseNot();
      while (p < toks.length && toks[p] !== '-o' && toks[p] !== '-or' && toks[p] !== ')') {
        if (toks[p] === '-a' || toks[p] === '-and') p++;
        const r = parseNot();
        const a = l;
        l = (x) => a(x) && r(x);
      }
      return l;
    }
    function parseNot() {
      if (toks[p] === '!' || toks[p] === '-not') { p++; const e = parseNot(); return (x) => !e(x); }
      return parsePrim();
    }
    const num = (s) => { const r = /^([+-]?)(\d+)$/.exec(s); if (!r) throw new Error(`invalid argument \`${s}'`); return { cmp: r[1], n: +r[2] }; };
    const cmpN = (spec, v) => (spec.cmp === '+' ? v > spec.n : spec.cmp === '-' ? v < spec.n : v === spec.n);
    function parsePrim() {
      const t = toks[p++];
      if (t == null) throw new Error('expected expression');
      const arg = () => { if (p >= toks.length) throw new Error(`missing argument to \`${t}'`); return toks[p++]; };
      switch (t) {
        case '(': { const e = parseOr(); if (toks[p] !== ')') throw new Error("invalid expression; I was expecting to find a ')' somewhere but did not see one."); p++; return e; }
        case '-name': { const re = LX.glob.globToRe(arg(), false); return (x) => re.test(x.name); }
        case '-iname': { const g = arg(); const re = new RegExp(LX.glob.globToRe(g, false).source, 'i'); return (x) => re.test(x.name); }
        case '-path': case '-wholename': { const re = LX.glob.globToRe(arg(), false); return (x) => re.test(x.label); }
        case '-regex': { const re = new RegExp('^' + arg() + '$'); return (x) => re.test(x.label); }
        case '-type': { const ty = arg(); return (x) => ({ f: 'f', d: 'd', l: 'l', c: 'c', b: 'b' }[ty] === x.node.t); }
        case '-size': {
          const s = arg();
          const r = /^([+-]?)(\d+)([ckMGb]?)$/.exec(s);
          if (!r) throw new Error(`invalid -size type \`${s}'`);
          const unit = { c: 1, k: 1024, M: 1024 * 1024, G: 1024 ** 3, b: 512, '': 512 }[r[3]];
          return (x) => { if (x.node.t === 'd') return false; const v = Math.ceil(c.fs.size(x.node) / unit); return r[1] === '+' ? v > +r[2] : r[1] === '-' ? v < +r[2] : v === +r[2]; };
        }
        case '-empty': return (x) => (x.node.t === 'd' ? !Object.keys(x.node.k).length : x.node.t === 'f' && c.fs.size(x.node) === 0);
        case '-mtime': case '-ctime': case '-atime': { const s = num(arg()); return (x) => cmpN(s, Math.floor((c.m.now() - x.node.mt) / 864e5)); }
        case '-mmin': case '-cmin': case '-amin': { const s = num(arg()); return (x) => cmpN(s, Math.ceil((c.m.now() - x.node.mt) / 6e4)); }
        case '-newer': { const ref = c.fs.lookup(c.resolve(arg())); return (x) => ref && x.node.mt > ref.mt; }
        case '-samefile': { const ref = c.fs.lookup(c.resolve(arg())); return (x) => !!ref && (x.node === ref || (ref.ino != null && x.node.ino === ref.ino)); }
        case '-inum': { const s = num(arg()); return (x) => cmpN(s, LX.inode(x.abs, x.node)); }
        case '-links': { const s = num(arg()); return (x) => cmpN(s, x.node.t === 'd' ? 2 + Object.values(x.node.k).filter((y) => y.t === 'd').length : x.node.nl || 1); }
        case '-xtype': { const ty = arg(); return (x) => { const n = x.node.t === 'l' ? c.fs.lookup(x.abs) : x.node; if (!n) return ty === 'l'; return ({ f: 'f', d: 'd', l: 'l', c: 'c', b: 'b' }[ty] === n.t); }; }
        case '-lname': { const re = LX.glob.globToRe(arg(), false); return (x) => x.node.t === 'l' && re.test(x.node.l || ''); }
        case '-xdev': case '-mount': case '-noleaf': case '-ignore_readdir_race': case '-nowarn': return () => true;
        case '-daystart': return () => true;
        case '-user': { const u = arg(); return (x) => c.m.userName(x.node.u) === u || String(x.node.u) === u; }
        case '-group': { const g = arg(); return (x) => c.m.groupName(x.node.g) === g || String(x.node.g) === g; }
        case '-uid': { const u = +arg(); return (x) => x.node.u === u; }
        case '-nouser': return (x) => !c.m.passwd().some((u) => u.uid === x.node.u);
        case '-perm': {
          const s = arg();
          const mode0 = s.replace(/^[-/]/, '');
          const mode = parseMode(mode0, 0) & 0o7777;
          if (s.startsWith('-')) return (x) => (x.node.m & mode) === mode;
          if (s.startsWith('/')) return (x) => (x.node.m & mode) !== 0;
          return (x) => (x.node.m & 0o7777) === mode;
        }
        case '-maxdepth': maxDepth = +arg(); return () => true;
        case '-mindepth': minDepth = +arg(); return () => true;
        case '-readable': return (x) => c.fs.perm(x.node, c.cred, 4);
        case '-writable': return (x) => c.fs.perm(x.node, c.cred, 2);
        case '-executable': return (x) => c.fs.perm(x.node, c.cred, 1);
        case '-true': return () => true;
        case '-false': return () => false;
        case '-print': hasAction = true; return (x) => { x.out.push(x.label + '\n'); return true; };
        case '-print0': hasAction = true; return (x) => { x.out.push(x.label + '\0'); return true; };
        case '-ls': hasAction = true; return (x) => { x.out.push(`${String(LX.inode(x.abs, x.node)).padStart(8)} ${String(Math.ceil(c.fs.size(x.node) / 1024) * 4).padStart(4)} ${modeStr(x.node)} ${String(1).padStart(3)} ${c.m.userName(x.node.u).padEnd(8)} ${c.m.groupName(x.node.g).padEnd(8)} ${String(c.fs.size(x.node)).padStart(8)} ${lsTime(c.m, x.node.mt)} ${x.label}\n`); return true; };
        case '-printf': {
          hasAction = true;
          const fmt = arg();
          return (x) => { x.out.push(LX.escapes(fmt.replace(/%([pfhsmuMgtd])/g, (mm, k) => ({ p: x.label, f: x.name, h: P().dirname(x.label), s: String(c.fs.size(x.node)), m: (x.node.m & 0o777).toString(8), u: c.m.userName(x.node.u), g: c.m.groupName(x.node.g), M: modeStr(x.node), t: new Date(x.node.mt).toString(), d: String(x.depth) }[k])))); return true; };
        }
        case '-delete': hasAction = true; return (x) => { x.del = true; return true; };
        case '-prune': return (x) => { x.prune = true; return true; };
        case '-exec': case '-ok': case '-execdir': {
          hasAction = true;
          const cmd = [];
          while (p < toks.length && toks[p] !== ';' && toks[p] !== '+') cmd.push(toks[p++]);
          if (p >= toks.length) throw new Error(`missing argument to \`${t}'`);
          const plus = toks[p++] === '+';
          return (x) => { x.exec.push({ cmd, plus, label: x.label }); return true; };
        }
        default: throw new Error(`unknown predicate \`${t}'`);
      }
    }
    let expr = () => true;
    try {
      if (toks.length) expr = parseOr();
      if (p < toks.length) throw new Error(`paths must precede expression: \`${toks[p]}'`);
    } catch (e) {
      c.err(`find: ${e.message}\n`);
      return 1;
    }
    let st = 0;
    const out = [];
    const execs = [];
    const dels = [];
    for (const root of paths) {
      const abs = c.resolve(root);
      if (!c.fs.lookup(abs, false)) { c.err(`find: ‘${root}’: No such file or directory\n`); st = 1; continue; }
      const visit = (ab, label, depth) => {
        const node = c.fs.lookup(ab, depth === 0);
        if (!node) return;
        const x = { abs: ab, label, name: depth === 0 ? P().basename(root) || root : P().basename(ab), node, depth, out, exec: execs };
        if (depth >= minDepth && depth <= maxDepth) {
          if (expr(x) && !hasAction) out.push(label + '\n');
          if (x.del) dels.push(x);
        }
        if (node.t === 'd' && !x.prune && depth < maxDepth) {
          let names;
          try { names = c.fs.readdir(ab, c.cred); } catch (e) { c.err(`find: ‘${label}’: Permission denied\n`); st = 1; return; }
          for (const nm of names) visit((ab === '/' ? '' : ab) + '/' + nm, (label === '/' ? '' : label.replace(/\/$/, '')) + '/' + nm, depth + 1);
        }
      };
      visit(abs, root, 0);
    }
    c.out(out.join(''));
    for (const d of dels.reverse()) {
      try { if (d.node.t === 'd') c.fs.rmdir(d.abs, c.cred); else c.fs.unlink(d.abs, c.cred); } catch (e) { c.err(`find: cannot delete ‘${d.label}’: ${e.message}\n`); st = 1; }
    }
    // -exec
    const plusGroups = {};
    for (const e of execs) {
      if (e.plus) { const k = e.cmd.join('\0'); (plusGroups[k] = plusGroups[k] || { cmd: e.cmd, labels: [] }).labels.push(e.label); continue; }
      const argv = e.cmd.map((a) => a.split('{}').join(e.label));
      const r = await c.sh.invoke(argv, c.io);
      if (r) st = 1;
    }
    for (const g of Object.values(plusGroups)) {
      const argv = [];
      g.cmd.forEach((a) => { if (a === '{}') argv.push(...g.labels); else argv.push(a); });
      const r = await c.sh.invoke(argv, c.io);
      if (r) st = 1;
    }
    return st;
  });

  // ======================================================================= 경로 도구
  def('which', async (c) => {
    const all = c.args.includes('-a');
    let st = 0;
    for (const n of c.args.filter((a) => !a.startsWith('-'))) {
      const found = [];
      if (n.includes('/')) { const nd = c.fs.lookup(c.resolve(n)); if (nd && nd.t === 'f' && (nd.m & 0o111)) found.push(n); }
      else for (const dir of c.env('PATH').split(':')) { const p = dir + '/' + n; const nd = c.fs.lookup(p); if (nd && nd.t === 'f' && (nd.m & 0o111)) { found.push(p); if (!all) break; } }
      if (!found.length) st = 1;
      found.forEach((x) => c.out(x + '\n'));
    }
    return st;
  });

  def('whereis', async (c) => {
    for (const n of c.args.filter((a) => !a.startsWith('-'))) {
      const found = [];
      ['/usr/bin', '/usr/sbin', '/usr/local/bin', '/usr/games'].forEach((d) => { if (c.fs.lookup(`${d}/${n}`)) found.push(`${d}/${n}`); });
      if (c.fs.lookup(`/etc/${n}`)) found.push(`/etc/${n}`);
      if (found.length && LX.MAN && LX.MAN[n]) found.push(`/usr/share/man/man${LX.MAN[n].sec || 1}/${n}.${LX.MAN[n].sec || 1}.gz`);
      c.out(`${n}:${found.map((x) => ' ' + x).join('')}\n`);
    }
    return 0;
  });

  def('basename', async (c) => {
    const { f, ops } = getopt(c.args, 'as:z', { multiple: 'a', suffix: 's:' });
    if (!ops.length) { c.err("basename: missing operand\nTry 'basename --help' for more information.\n"); return 1; }
    const list = f.a || f.s ? ops : [ops[0]];
    const suf = f.s || (!f.a && ops[1]);
    list.forEach((p) => { let b = p === '/' ? '/' : P().basename(p); if (suf && b.endsWith(suf) && b !== suf) b = b.slice(0, -suf.length); c.out(b + '\n'); });
    return 0;
  });
  def('dirname', async (c) => {
    if (!c.args.length) { c.err("dirname: missing operand\nTry 'dirname --help' for more information.\n"); return 1; }
    c.args.forEach((p) => {
      const s = p.replace(/\/+$/, '');
      if (!s.includes('/')) c.out('.\n');
      else c.out((s.replace(/\/[^/]*$/, '') || '/') + '\n');
    });
    return 0;
  });
  def('realpath', async (c) => {
    let st = 0;
    const ops = c.args.filter((a) => !a.startsWith('-'));
    const m = c.args.includes('-m');
    for (const p of ops) {
      try { c.out(c.fs.realpath(c.resolve(p)) + '\n'); } catch (e) { if (m) c.out(c.resolve(p) + '\n'); else { c.err(`realpath: ${p}: ${e.message}\n`); st = 1; } }
    }
    return st;
  });
  def('readlink', async (c) => {
    const { f, ops } = getopt(c.args, 'fenmq', { canonicalize: 'f' });
    let st = 0;
    for (const p of ops) {
      const abs = c.resolve(p);
      if (f.f || f.e || f.m) { try { c.out(c.fs.realpath(abs) + '\n'); } catch (e) { if (f.f || f.m) c.out(abs + '\n'); else st = 1; } continue; }
      const n = c.fs.lookup(abs, false);
      if (!n || n.t !== 'l') { st = 1; continue; }
      c.out(n.l + (f.n ? '' : '\n'));
    }
    return st;
  });

  // ======================================================================= du
  def('du', async (c) => {
    const { f, ops } = getopt(c.args, 'shacd:kmxl', { summarize: 's', 'human-readable': 'h', all: 'a', total: 'c', 'max-depth': 'd:', 'apparent-size': 'apparent' });
    const targets = ops.length ? ops : ['.'];
    const fmt = (bytes) => (f.h ? human(bytes) : f.m ? String(Math.ceil(bytes / 1048576)) : String(Math.ceil(bytes / 1024)));
    let total = 0, st = 0;
    const maxD = f.s ? 0 : f.d != null ? +f.d : Infinity;
    for (const t of targets) {
      const abs = c.resolve(t);
      const node = c.fs.lookup(abs);
      if (!node) { c.err(`du: cannot access '${t}': No such file or directory\n`); st = 1; continue; }
      const walk = (ab, label, n, depth) => {
        if (n.t !== 'd') { const s = n.t === 'f' ? Math.ceil(c.fs.size(n) / 4096) * 4096 : 0; if (f.a && depth <= maxD || depth === 0) c.out(`${fmt(s)}\t${label}\n`); return s; }
        let size = 4096;
        if (!c.fs.perm(n, c.cred, 4) || !c.fs.perm(n, c.cred, 1)) { c.err(`du: cannot read directory '${label}': Permission denied\n`); st = 1; }
        else {
          for (const nm of Object.keys(n.k).sort()) {
            const ch = n.k[nm];
            if (ch.t === 'l') continue;
            size += walk(ab + '/' + nm, label.replace(/\/$/, '') + '/' + nm, ch, depth + 1);
          }
        }
        if (depth <= maxD) c.out(`${fmt(size)}\t${label}\n`);
        return size;
      };
      total += walk(abs, t, node, 0);
    }
    if (f.c) c.out(`${fmt(total)}\ttotal\n`);
    return st;
  });

  // ======================================================================= 기타 파일 도구
  function fakeHash(text, len, salt = '') {
    let out = '';
    let h = 2166136261 ^ len;
    const s = salt + text;
    let k = 0;
    while (out.length < len) {
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i) + k; h = Math.imul(h, 16777619) >>> 0; }
      if (!s.length) h = Math.imul(h ^ k, 2654435761) >>> 0;
      out += (h >>> 0).toString(16).padStart(8, '0');
      k++;
    }
    return out.slice(0, len);
  }
  LX.fakeHash = fakeHash;

  def(['md5sum', 'sha1sum', 'sha256sum', 'sha512sum', 'b2sum'], async (c) => {
    const len = { md5sum: 32, sha1sum: 40, sha256sum: 64, sha512sum: 128, b2sum: 128 }[c.name] || 32;
    const check = c.args.includes('-c') || c.args.includes('--check');
    const quiet = c.args.includes('--quiet') || c.args.includes('--status');
    const status = c.args.includes('--status');
    const ignoreMissing = c.args.includes('--ignore-missing');
    const ops = c.args.filter((a) => !a.startsWith('-') || a === '-');
    if (check) {
      let bad = 0, missing = 0, fmt = 0, total = 0;
      await readInputs(c, ops, c.name, (t) => {
        t.split('\n').filter(Boolean).forEach((line) => {
          const r = /^([0-9a-fA-F]+)\s+\*?(.+)$/.exec(line);
          if (!r || r[1].length !== len) { fmt++; return; }
          total++;
          let data;
          try { data = c.fs.readFile(c.resolve(r[2]), c.cred); } catch (e) { if (ignoreMissing) { missing++; return; } if (!status) { c.err(`${c.name}: ${r[2]}: No such file or directory\n`); c.out(`${r[2]}: FAILED open or read\n`); } bad++; return; }
          const ok = fakeHash(data, len) === r[1].toLowerCase();
          if (!status && (!ok || !quiet)) c.out(`${r[2]}: ${ok ? 'OK' : 'FAILED'}\n`);
          if (!ok) bad++;
        });
      });
      if (!status) {
        if (fmt) c.err(`${c.name}: WARNING: ${fmt} line${fmt > 1 ? 's are' : ' is'} improperly formatted\n`);
        if (bad) c.err(`${c.name}: WARNING: ${bad} computed checksum${bad > 1 ? 's' : ''} did NOT match\n`);
        if (ignoreMissing && total && total === missing) c.err(`${c.name}: ${ops[0] || '-'}: no file was verified\n`);
      }
      return bad || (fmt && !total) || (ignoreMissing && total && total === missing) ? 1 : 0;
    }
    return readInputs(c, ops, c.name, (t, name) => c.out(`${fakeHash(t, len)}  ${name}\n`));
  });

  def('mktemp', async (c) => {
    const { f, ops } = getopt(c.args, 'dupt:', { directory: 'd', tmpdir: 'p' });
    const tmpl = ops[0] || 'tmp.XXXXXXXXXX';
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const name = tmpl.replace(/X+$/, (x) => Array.from({ length: x.length }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
    const abs = ops[0] && ops[0].includes('/') ? c.resolve(name) : (f.p && f.p !== true ? f.p : '/tmp') + '/' + name;
    try {
      if (!f.u) { if (f.d) c.fs.mkdir(abs, c.cred, { mode: 0o700 }); else c.fs.writeFile(abs, '', c.cred, { mode: 0o600 }); }
    } catch (e) { c.err(`mktemp: failed to create ${f.d ? 'directory' : 'file'} via template '${tmpl}': ${e.message}\n`); return 1; }
    c.out(abs + '\n');
    return 0;
  });

  function parseSize(s) {
    const r = /^(\d+(?:\.\d+)?)([KMGT]?)(i?B?)?$/i.exec(String(s));
    if (!r) return null;
    return Math.round(+r[1] * ({ '': 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4 }[r[2].toUpperCase()]));
  }
  LX.parseSize = parseSize;

  def('truncate', async (c) => {
    const { f, ops } = getopt(c.args, 's:c', { size: 's:' });
    const size = parseSize(String(f.s || '').replace(/^[+-]/, ''));
    if (size == null) { c.err("truncate: you must specify either '--size' or '--reference'\n"); return 1; }
    for (const p of ops) {
      const abs = c.resolve(p);
      try {
        if (!c.fs.lookup(abs)) c.fs.writeFile(abs, '', c.cred, { mode: 0o664 & ~c.sh.umask });
        const n = c.fs.lookup(abs);
        if (size === 0) { n.c = ''; delete n.sz; } else if (size < LX.byteLen(n.c)) n.c = n.c.slice(0, size); else n.sz = size;
        c.fs.touchChanged();
      } catch (e) { c.err(`truncate: cannot open '${p}' for writing: ${e.message}\n`); return 1; }
    }
    return 0;
  });

  def('fallocate', async (c) => {
    const { f, ops } = getopt(c.args, 'l:', { length: 'l:' });
    const size = parseSize(f.l || '');
    if (size == null || !ops.length) { c.err('fallocate: no length argument specified\n'); return 1; }
    const abs = c.resolve(ops[0]);
    try {
      if (!c.fs.lookup(abs)) c.fs.writeFile(abs, '', c.cred, { mode: 0o644 & ~c.sh.umask });
      c.fs.lookup(abs).sz = size;
      c.fs.touchChanged();
    } catch (e) { c.err(`fallocate: cannot open ${ops[0]}: ${e.message}\n`); return 1; }
    return 0;
  });

  def('dd', async (c) => {
    const o = {};
    c.args.forEach((a) => { const r = /^(\w+)=(.*)$/.exec(a); if (r) o[r[1]] = r[2]; });
    const bs = parseSize(o.bs || '512') || 512;
    const count = o.count != null ? +o.count : null;
    let bytes = 0;
    let data = '';
    if (o.if && !/\/dev\/(zero|urandom|random)$/.test(o.if)) {
      try { data = c.fs.readFile(c.resolve(o.if), c.cred); } catch (e) { c.err(`dd: failed to open '${o.if}': ${e.message}\n`); return 1; }
      bytes = count != null ? Math.min(LX.byteLen(data), bs * count) : LX.byteLen(data);
      data = data.slice(0, bytes);
    } else {
      bytes = count != null ? bs * count : bs * 1000;
    }
    if (o.of) {
      const abs = c.resolve(o.of);
      try {
        if (/^\/dev\//.test(abs) && c.fs.lookup(abs) && c.fs.lookup(abs).t === 'b') {
          if (c.cred.uid !== 0) throw new LX.FSError('EACCES');
        } else {
          c.fs.writeFile(abs, data, c.cred, { mode: 0o664 & ~c.sh.umask });
          if (!o.if || /\/dev\//.test(o.if)) c.fs.lookup(abs).sz = bytes;
        }
      } catch (e) { c.err(`dd: failed to open '${o.of}': ${e.message}\n`); return 1; }
    } else c.out(data);
    const recs = Math.ceil(bytes / bs);
    const secs = Math.max(0.001, bytes / (900 * 1024 * 1024));
    c.err(`${recs}+0 records in\n${recs}+0 records out\n${bytes} bytes (${bytes >= 1e9 ? (bytes / 1e9).toFixed(1) + ' GB, ' : bytes >= 1e6 ? (bytes / 1e6).toFixed(0) + ' MB, ' : bytes >= 1e3 ? (bytes / 1e3).toFixed(0) + ' kB, ' : ''}${human(bytes).replace(/([KMGT])$/, ' $1iB').replace(/^(\d+)$/, '$1 bytes')}) copied, ${secs.toFixed(secs < 1 ? 5 : 2)} s, ${(bytes / secs / 1e6).toFixed(0)} MB/s\n`);
    return 0;
  });

  // ======================================================================= 압축 · 묶음
  const TAR = '\x00TAR1\n', GZ = '\x1f\x8bGZ1\n', BZ = 'BZh91AY\n', XZ = '\xfd7zXZ1\n', ZIP = 'PK\x03\x04ZIP1\n', ZST = '\x28\xb5\x2f\xfdZST1\n';
  LX.ARCHIVE_MAGIC = { TAR, GZ, BZ, XZ, ZIP, ZST };
  function packEntries(c, abs, label, list, excludes, verbose, out) {
    const n = c.fs.lookup(abs, false);
    if (!n) throw new LX.FSError('ENOENT', label);
    if (excludes.some((re) => re.test(P().basename(label)) || re.test(label))) return;
    const e = { p: label, t: n.t, m: n.m, u: n.u, g: n.g, mt: n.mt };
    if (n.t === 'f') { e.c = c.fs.readFile(abs, c.cred); if (n.sz != null) e.sz = n.sz; }
    if (n.t === 'l') e.l = n.l;
    list.push(e);
    if (verbose) out(label + (n.t === 'd' ? '/' : '') + '\n');
    if (n.t === 'd') {
      if (!c.fs.perm(n, c.cred, 4)) throw Object.assign(new LX.FSError('EACCES', label), { soft: true });
      for (const k of Object.keys(n.k).sort()) packEntries(c, abs + '/' + k, label.replace(/\/$/, '') + '/' + k, list, excludes, verbose, out);
    }
  }
  function compressedSize(text, ratio) { return Math.max(20, Math.round(LX.byteLen(text) * ratio)); }
  function wrap(kind, inner) { return kind === 'gz' ? GZ + inner : kind === 'bz' ? BZ + inner : kind === 'xz' ? XZ + inner : kind === 'zst' ? ZST + inner : inner; }
  function unwrap(text) {
    for (const [m, k] of [[GZ, 'gz'], [BZ, 'bz'], [XZ, 'xz'], [ZST, 'zst']]) if (text.startsWith(m)) return { kind: k, inner: text.slice(m.length) };
    return { kind: null, inner: text };
  }
  LX.unwrapArchive = unwrap;

  def('tar', async (c) => {
    let args = c.args.slice();
    if (args[0] && !args[0].startsWith('-') && /^[cxtrvzjJfpC]+$/.test(args[0])) args[0] = '-' + args[0];
    const { f, ops } = getopt(args, 'cxtrvzjJf:C:pPkWOa', { create: 'c', extract: 'x', list: 't', verbose: 'v', gzip: 'z', gunzip: 'z', bzip2: 'j', xz: 'J', zstd: 'zst', 'auto-compress': 'a', file: 'f:', directory: 'C:', exclude: 'exclude', 'strip-components': 'strip:', 'to-stdout': 'O', 'overwrite': 'ow', 'one-file-system': 'ofs', 'same-owner': 'so', 'no-same-owner': 'nso', 'numeric-owner': 'no', 'ignore-failed-read': 'ifr', 'preserve-permissions': 'p', 'absolute-names': 'P', 'keep-old-files': 'k', totals: 'totals' });
    const excludes = [];
    c.args.forEach((a) => { const r = /^--exclude=(.+)$/.exec(a); if (r) excludes.push(LX.glob.globToRe(r[1], false)); });
    if (!f.c && !f.x && !f.t) { c.err("tar: You must specify one of the '-Acdtrux', '--delete' or '--test-label' options\nTry 'tar --help' or 'tar --usage' for more information.\n"); return 2; }
    let kind = f.z ? 'gz' : f.j ? 'bz' : f.J ? 'xz' : f.zst ? 'zst' : null;
    // -a / --auto-compress: 파일 이름 확장자로 압축 방식 결정 (생성할 때)
    if (!kind && f.a && f.f && f.c) kind = /\.(tgz|tar\.gz)$/.test(f.f) ? 'gz' : /\.(tbz2?|tar\.bz2)$/.test(f.f) ? 'bz' : /\.(txz|tar\.xz)$/.test(f.f) ? 'xz' : /\.(tzst|tar\.zst)$/.test(f.f) ? 'zst' : null;
    const baseDir = f.C ? c.resolve(f.C) : c.cwd;
    if (f.c) {
      if (!ops.length) { c.err('tar: Cowardly refusing to create an empty archive\nTry \'tar --help\' or \'tar --usage\' for more information.\n'); return 2; }
      const list = [];
      let st = 0;
      for (const o of ops) {
        let label = o;
        if (label.startsWith('/')) { if (!c._warned) { c.err("tar: Removing leading `/' from member names\n"); c._warned = true; } label = label.replace(/^\/+/, ''); }
        try { packEntries(c, P().normalize(baseDir, o), label, list, excludes, f.v, (s) => (f.f === '-' || !f.f ? c.err(s) : c.out(s))); } catch (e) {
          c.err(`tar: ${e.path || o}: ${e.code === 'ENOENT' ? 'Cannot stat: No such file or directory' : 'Cannot open: ' + e.message}\n`);
          st = 2;
        }
      }
      const body = wrap(kind, TAR + JSON.stringify(list));
      const raw = list.reduce((a, e) => a + 512 + Math.ceil(LX.byteLen(e.c || '') / 512) * 512, 0) + 1024;
      const size = kind ? compressedSize(JSON.stringify(list.map((e) => e.c || '')), kind === 'xz' ? 0.22 : kind === 'bz' ? 0.26 : kind === 'zst' ? 0.28 : 0.3) + 200 : Math.ceil(raw / 10240) * 10240;
      if (!f.f || f.f === '-') { c.out(body); return st; }
      try {
        c.fs.writeFile(c.resolve(f.f), body, c.cred, { mode: 0o664 & ~c.sh.umask });
        c.fs.lookup(c.resolve(f.f)).sz = size;
      } catch (e) { c.err(`tar: ${f.f}: Cannot open: ${e.message}\n`); return 2; }
      if (st) c.err('tar: Exiting with failure status due to previous errors\n');
      return st;
    }
    // 읽기
    let text;
    if (!f.f || f.f === '-') text = await c.readStdin();
    else { try { text = c.fs.readFile(c.resolve(f.f), c.cred); } catch (e) { c.err(`tar: ${f.f}: Cannot open: ${e.message}\ntar: Error is not recoverable: exiting now\n`); return 2; } }
    const u = unwrap(text);
    if (!u.inner.startsWith(TAR)) {
      c.err('tar: This does not look like a tar archive\ntar: Exiting with failure status due to previous errors\n');
      return 2;
    }
    let list;
    try { list = JSON.parse(u.inner.slice(TAR.length)); } catch (e) { c.err('tar: Unexpected EOF in archive\n'); return 2; }
    const want = ops.length ? ops.map((o) => o.replace(/\/$/, '')) : null;
    const strip = +(c.args.map((a) => (/^--strip-components=(\d+)$/.exec(a) || [])[1]).find(Boolean) || 0);
    let st = 0;
    for (const e of list) {
      if (want && !want.some((w) => e.p === w || e.p.startsWith(w + '/'))) continue;
      if (f.t) {
        if (f.v) {
          const d = LX.localDate(c.m, e.mt);
          const pad = (n) => String(n).padStart(2, '0');
          c.out(`${modeStr(e)} ${c.m.userName(e.u)}/${c.m.groupName(e.g)} ${String(e.t === 'f' ? (e.sz || LX.byteLen(e.c)) : 0).padStart(6)} ${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} ${e.p}${e.t === 'd' ? '/' : ''}${e.t === 'l' ? ' -> ' + e.l : ''}\n`);
        } else c.out(e.p + (e.t === 'd' ? '/' : '') + '\n');
        continue;
      }
      const parts = e.p.split('/').slice(strip);
      if (!parts.length || !parts.join('')) continue;
      if (f.O) { if (e.t === 'f') c.out(e.c); continue; }
      const dst = P().normalize(baseDir, parts.join('/'));
      if (f.v) c.out(e.p + (e.t === 'd' ? '/' : '') + '\n');
      try {
        c.fs.mkdir(P().dirname(dst), c.cred, { parents: true, mode: 0o775 & ~c.sh.umask });
        if (e.t === 'd') { if (!c.fs.lookup(dst)) c.fs.mkdir(dst, c.cred, { mode: e.m }); }
        else if (e.t === 'l') { if (c.fs.lookup(dst, false)) c.fs.unlink(dst, c.cred); c.fs.symlink(e.l, dst, c.cred); }
        else {
          c.fs.writeFile(dst, e.c, c.cred, { mode: e.m });
          const n = c.fs.lookup(dst);
          n.m = e.m; n.mt = e.mt;
          if (e.sz != null) n.sz = e.sz;
          if (c.cred.uid === 0) { n.u = e.u; n.g = e.g; }
        }
        const n = c.fs.lookup(dst);
        if (n && e.t === 'd') { n.m = e.m; if (c.cred.uid === 0) { n.u = e.u; n.g = e.g; } }
      } catch (er) {
        c.err(`tar: ${e.p}: Cannot open: ${er.message}\n`);
        st = 2;
      }
    }
    return st;
  });

  function compressor(kind, ext, name) {
    return async (c) => {
      const { f, ops } = getopt(c.args, 'dckvfl123456789rtq', { decompress: 'd', stdout: 'c', keep: 'k', verbose: 'v', force: 'f', list: 'l', recursive: 'r' });
      const decompress = f.d || /^(gunzip|bunzip2|unxz|zcat|bzcat|xzcat)$/.test(c.name);
      const toStdout = f.c || /cat$/.test(c.name);
      const MAG = { gz: GZ, bz: BZ, xz: XZ }[kind];
      if (!ops.length) {
        const t = await c.readStdin();
        c.out(decompress ? (t.startsWith(MAG) ? t.slice(MAG.length) : t) : MAG + t);
        return 0;
      }
      let st = 0;
      for (const p of ops) {
        const abs = c.resolve(p);
        let text;
        try {
          const n = c.fs.stat(abs, c.cred);
          if (n.t === 'd') { c.err(`${name}: ${p} is a directory -- ignored\n`); st = 2; continue; }
          text = c.fs.readFile(abs, c.cred);
        } catch (e) { c.err(`${name}: ${p}: ${e.message}\n`); st = 1; continue; }
        if (f.t) {
          // -t: 무결성 검사
          if (!text.startsWith(MAG)) { c.err(`${name}: ${p}: not in ${kind === 'gz' ? 'gzip' : kind} format\n`); st = 1; }
          else if (f.v) c.err(`${p}:\t OK\n`);
          continue;
        }
        if (f.l && kind === 'gz') {
          const inner = text.startsWith(MAG) ? text.slice(MAG.length) : text;
          c.out(`         compressed        uncompressed  ratio uncompressed_name\n${String(c.fs.size(c.fs.lookup(abs))).padStart(19)} ${String(LX.byteLen(inner)).padStart(19)} ${(100 - c.fs.size(c.fs.lookup(abs)) / Math.max(1, LX.byteLen(inner)) * 100).toFixed(1).padStart(5)}% ${p.replace(/\.gz$/, '')}\n`);
          continue;
        }
        if (decompress) {
          if (!text.startsWith(MAG)) { c.err(`${name}: ${p}: not in ${kind === 'gz' ? 'gzip' : kind} format\n`); st = 1; continue; }
          const inner = text.slice(MAG.length);
          if (toStdout) { c.out(inner); continue; }
          if (!p.endsWith(ext)) { c.err(`${name}: ${p}: unknown suffix -- ignored\n`); st = 2; continue; }
          const dst = abs.slice(0, -ext.length);
          if (c.fs.lookup(dst) && !f.f) { c.err(`${name}: ${p.slice(0, -ext.length)} already exists; not overwritten\n`); st = 2; continue; }
          c.fs.writeFile(dst, inner, c.cred, { mode: c.fs.lookup(abs).m });
          if (inner.startsWith('\x00TAR')) c.fs.lookup(dst).sz = Math.ceil(LX.byteLen(inner) / 10240) * 10240;
          if (!f.k) c.fs.unlink(abs, c.cred);
          if (f.v) c.err(`${p}:\t 71.3% -- replaced with ${p.slice(0, -ext.length)}\n`);
        } else {
          if (p.endsWith(ext)) { c.err(`${name}: ${p} already has ${ext} suffix -- unchanged\n`); st = 2; continue; }
          const body = MAG + text;
          if (toStdout) { c.out(body); continue; }
          const dst = abs + ext;
          if (c.fs.lookup(dst) && !f.f) { c.err(`${name}: ${p}${ext} already exists; not overwritten\n`); st = 2; continue; }
          c.fs.writeFile(dst, body, c.cred, { mode: c.fs.lookup(abs).m });
          const ratio = kind === 'xz' ? 0.24 : kind === 'bz' ? 0.27 : 0.32;
          c.fs.lookup(dst).sz = compressedSize(text, ratio) + 30;
          c.fs.lookup(dst).mt = c.fs.lookup(abs).mt;
          if (!f.k) c.fs.unlink(abs, c.cred);
          if (f.v) c.err(`${p}:\t ${(100 - ratio * 100).toFixed(1)}% -- replaced with ${p}${ext}\n`);
        }
      }
      return st;
    };
  }
  def(['gzip', 'gunzip', 'zcat'], compressor('gz', '.gz', 'gzip'));
  def(['bzip2', 'bunzip2', 'bzcat'], compressor('bz', '.bz2', 'bzip2'));
  def(['xz', 'unxz', 'xzcat'], compressor('xz', '.xz', 'xz'));

  def('zip', async (c) => {
    const { f, ops } = getopt(c.args, 'rqv9e', { recurse: 'r', quiet: 'q' });
    if (ops.length < 2) { c.err('zip error: Nothing to do! (' + (ops[0] || '') + ')\n'); return 12; }
    let zipName = ops.shift();
    if (!/\.zip$/i.test(zipName)) zipName += '.zip';
    const list = [];
    for (const o of ops) {
      const abs = c.resolve(o);
      const n = c.fs.lookup(abs);
      if (!n) { c.err(`\tzip warning: name not matched: ${o}\n`); continue; }
      if (n.t === 'd' && !f.r) { list.push({ p: o.replace(/\/$/, '') + '/', t: 'd', m: n.m, mt: n.mt }); if (!f.q) c.out(`  adding: ${o.replace(/\/$/, '')}/ (stored 0%)\n`); continue; }
      const tmp = [];
      packEntries(c, abs, o.replace(/\/$/, ''), tmp, [], false, () => {});
      tmp.forEach((e) => { list.push(e); if (!f.q) c.out(`  adding: ${e.p}${e.t === 'd' ? '/' : ''} (${e.t === 'd' ? 'stored 0%' : `deflated ${Math.min(90, 30 + (LX.byteLen(e.c) % 50))}%`})\n`); });
    }
    const abs = c.resolve(zipName);
    let old = [];
    try { const t = c.fs.readFile(abs, c.cred); if (t.startsWith(ZIP)) old = JSON.parse(t.slice(ZIP.length)); } catch (e) { /* 새 파일 */ }
    const merged = old.filter((e) => !list.some((x) => x.p === e.p)).concat(list);
    try {
      c.fs.writeFile(abs, ZIP + JSON.stringify(merged), c.cred, { mode: 0o664 & ~c.sh.umask });
      c.fs.lookup(abs).sz = compressedSize(JSON.stringify(merged.map((e) => e.c || '')), 0.35) + merged.length * 90;
    } catch (e) { c.err(`zip I/O error: ${e.message}\nzip error: Could not create output file (${zipName})\n`); return 15; }
    return 0;
  });

  def('unzip', async (c) => {
    const { f, ops } = getopt(c.args, 'lqod:', { });
    const zipName = ops[0];
    if (!zipName) { c.out('UnZip 6.00 of 20 April 2009, by Debian. Original by Info-ZIP.\n\nUsage: unzip [-Z] [-opts[modifiers]] file[.zip] [list] [-x xlist] [-d exdir]\n'); return 0; }
    let text;
    try { text = c.fs.readFile(c.resolve(zipName), c.cred); } catch (e) { c.err(`unzip:  cannot find or open ${zipName}, ${zipName}.zip or ${zipName}.ZIP.\n`); return 9; }
    if (!text.startsWith(ZIP)) { c.err(`  End-of-central-directory signature not found.  Either this file is not\n  a zipfile, or it constitutes one disk of a multi-part archive.\n`); return 9; }
    const list = JSON.parse(text.slice(ZIP.length));
    if (f.l) {
      c.out(`Archive:  ${zipName}\n  Length      Date    Time    Name\n---------  ---------- -----   ----\n`);
      let tot = 0;
      list.forEach((e) => { const d = LX.localDate(c.m, e.mt); const sz = e.t === 'f' ? LX.byteLen(e.c) : 0; tot += sz; c.out(`${String(sz).padStart(9)}  ${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}-${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}   ${e.p}${e.t === 'd' && !e.p.endsWith('/') ? '/' : ''}\n`); });
      c.out(`---------                     -------\n${String(tot).padStart(9)}                     ${list.length} files\n`);
      return 0;
    }
    const base = f.d ? c.resolve(f.d) : c.cwd;
    if (!f.q) c.out(`Archive:  ${zipName}\n`);
    for (const e of list) {
      const dst = P().normalize(base, e.p);
      c.fs.mkdir(P().dirname(dst), c.cred, { parents: true });
      if (e.t === 'd') { if (!c.fs.lookup(dst)) c.fs.mkdir(dst, c.cred); if (!f.q) c.out(`   creating: ${f.d ? f.d.replace(/\/$/, '') + '/' : ''}${e.p.replace(/\/?$/, '/')}\n`); continue; }
      if (c.fs.lookup(dst) && !f.o && !c.session.headless) {
        const ans = await c.readLine(`replace ${e.p}? [y]es, [n]o, [A]ll, [N]one, [r]ename: `, { tty: true });
        if (/^A/.test(ans || '')) f.o = true;
        else if (!/^y/i.test(ans || '')) continue;
      }
      c.fs.writeFile(dst, e.c || '', c.cred, { mode: e.m });
      if (!f.q) c.out(`  inflating: ${f.d ? f.d.replace(/\/$/, '') + '/' : ''}${e.p}  \n`);
    }
    return 0;
  });

  def('install', async (c) => {
    const { f, ops } = getopt(c.args, 'm:o:g:dDv', { mode: 'm:', owner: 'o:', group: 'g:', directory: 'd' });
    // -o/-g 는 root 만 (일반 사용자는 chown 불가)
    const uidOf = (s) => { if (/^\d+$/.test(s)) return +s; const u = c.m.passwd().find((x) => x.name === s); return u ? u.uid : null; };
    const gidOf = (s) => { if (/^\d+$/.test(s)) return +s; const g = c.m.groups().find((x) => x.name === s); return g ? g.gid : null; };
    const uid = f.o != null ? uidOf(f.o) : null;
    const gid = f.g != null ? gidOf(f.g) : null;
    if (f.o != null && uid == null) { c.err(`install: invalid user '${f.o}'\n`); return 1; }
    if (f.g != null && gid == null) { c.err(`install: invalid group '${f.g}'\n`); return 1; }
    const own = (abs) => {
      const n = c.fs.lookup(abs, false);
      if (!n) return;
      if (uid != null || gid != null) {
        if (c.cred.uid !== 0) throw new Error('Operation not permitted');
        if (uid != null) n.u = uid;
        if (gid != null) n.g = gid;
      }
    };
    if (f.d) {
      for (const d of ops) {
        try { c.fs.mkdir(c.resolve(d), c.cred, { parents: true, mode: f.m ? parseInt(f.m, 8) : 0o755 }); c.fs.lookup(c.resolve(d), false).m = f.m ? parseInt(f.m, 8) : 0o755; own(c.resolve(d)); if (f.v) c.out(`install: creating directory '${d}'\n`); }
        catch (e) { c.err(`install: cannot change ownership of '${d}': ${e.message}\n`); return 1; }
      }
      return 0;
    }
    if (ops.length < 2) { c.err('install: missing destination file operand\n'); return 1; }
    const dst = ops.pop();
    for (const s of ops) {
      try {
        const dn = c.fs.lookup(c.resolve(dst));
        const target = dn && dn.t === 'd' ? c.resolve(dst) + '/' + P().basename(s) : c.resolve(dst);
        if (f.D) c.fs.mkdir(P().dirname(target), c.cred, { parents: true });
        const src = c.resolve(s);
        const text = /^\/dev\/null$/.test(src) ? '' : c.fs.readFile(src, c.cred);
        c.fs.writeFile(target, text, c.cred, { mode: f.m ? parseInt(f.m, 8) : 0o755 });
        c.fs.lookup(target).m = f.m ? parseInt(f.m, 8) : 0o755;
        own(target);
        if (f.v) c.out(`'${s}' -> '${dst}'\n`);
      } catch (e) { c.err(`install: cannot create regular file '${dst}': ${e.message}\n`); return 1; }
    }
    return 0;
  });

  def('shred', async (c) => {
    const { f, ops } = getopt(c.args, 'uzvn:', {});
    for (const p of ops) {
      try {
        const abs = c.resolve(p);
        if (f.v) c.err(`shred: ${p}: pass 1/3 (random)...\nshred: ${p}: pass 2/3 (random)...\nshred: ${p}: pass 3/3 (random)...\n`);
        if (f.u) { c.fs.unlink(abs, c.cred); if (f.v) c.err(`shred: ${p}: removed\n`); } else c.fs.writeFile(abs, '\u0000'.repeat(Math.min(64, LX.byteLen(c.fs.readFile(abs, c.cred)))), c.cred);
      } catch (e) { c.err(`shred: ${p}: failed to open for writing: ${e.message}\n`); return 1; }
    }
    return 0;
  });

  def(['mkfifo'], async (c) => { c.args.forEach((p) => c.fs.writeFile(c.resolve(p), '', c.cred, { mode: 0o664 })); return 0; });
  def('sync', async () => 0);
  def(['link'], async (c) => { try { c.fs.link(c.resolve(c.args[0]), c.resolve(c.args[1]), c.cred); return 0; } catch (e) { c.err(`link: cannot create link '${c.args[1]}' to '${c.args[0]}': ${e.message}\n`); return 1; } });
  def(['unlink'], async (c) => { try { c.fs.unlink(c.resolve(c.args[0]), c.cred); return 0; } catch (e) { c.err(`unlink: cannot unlink '${c.args[0]}': ${e.message}\n`); return 1; } });
})(typeof window !== 'undefined' ? window : globalThis);

