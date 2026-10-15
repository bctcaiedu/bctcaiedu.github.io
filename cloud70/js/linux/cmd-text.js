
/* 가상 리눅스 — 텍스트 처리 명령
 * grep sed awk sort uniq cut tr tee xargs diff cmp comm paste join column rev fold fmt shuf seq expr yes
 * base64 od hexdump xxd strings numfmt factor bc jq dos2unix unix2dos iconv split
 */
(function (G) {
  const LX = G.LX = G.LX || {};
  const def = LX.def;
  const P = () => LX.path;

  // ======================================================================= 공용 도구
  /**
   * GNU 식 옵션 해석 (여러 번 줄 수 있는 옵션 · 긴 옵션 접두어 · 오류 보고)
   * @param {string[]} args
   * @param {string} short   예: 'nrk:t:'  (':' 는 값을 받는 옵션)
   * @param {object} long    예: { numeric: 'n', key: 'k:' }   (값 '=' 이 선택이면 '?' 로 끝)
   * @param {object} o       { multi: 'k', stopAtOperand: bool, digits: bool }
   * @returns {{f, ops, bad}}  bad: 오류 메시지 (있으면)
   */
  function opts(args, short = '', long = {}, o = {}) {
    const f = {};
    const ops = [];
    const multi = new Set(Array.isArray(o.multi) ? o.multi : String(o.multi || '').split(''));
    const takes = (ch) => { const i = short.indexOf(ch); return i >= 0 && short[i + 1] === ':'; };
    const set = (k, v) => {
      if (multi.has(k)) (f[k] = f[k] || []).push(v);
      else f[k] = v;
    };
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '--') { ops.push(...args.slice(i + 1)); break; }
      if (a.startsWith('--') && a.length > 2) {
        const eq = a.indexOf('=');
        const k = eq >= 0 ? a.slice(2, eq) : a.slice(2);
        const v = eq >= 0 ? a.slice(eq + 1) : null;
        let key = Object.prototype.hasOwnProperty.call(long, k) ? k : null;
        if (!key) {
          const cands = Object.keys(long).filter((x) => x.startsWith(k));
          if (cands.length === 1 || (cands.length > 1 && cands.every((x) => long[x] === long[cands[0]]))) key = cands[0];
          else if (cands.length > 1) return { f, ops, bad: `option '--${k}' is ambiguous` };
        }
        if (!key) return { f, ops, bad: `unrecognized option '${a}'` };
        const map = long[key];
        if (map.endsWith(':')) {
          if (v != null) set(map.slice(0, -1), v);
          else if (i + 1 < args.length) set(map.slice(0, -1), args[++i]);
          else return { f, ops, bad: `option '--${key}' requires an argument` };
        } else if (map.endsWith('?')) set(map.slice(0, -1), v != null ? v : true);
        else {
          if (v != null) return { f, ops, bad: `option '--${key}' doesn't allow an argument` };
          set(map, true);
        }
        continue;
      }
      if (a.startsWith('-') && a.length > 1 && !(o.numOperand && /^-\d/.test(a))) {
        if (o.digits && /^-\d+$/.test(a)) { f['#'] = a.slice(1); continue; }
        for (let j = 1; j < a.length; j++) {
          const ch = a[j];
          if (o.digits && /\d/.test(ch)) { let d = ''; while (j < a.length && /\d/.test(a[j])) d += a[j++]; j--; f['#'] = d; continue; }
          if (!short.includes(ch) || ch === ':') return { f, ops, bad: `invalid option -- '${ch}'` };
          if (takes(ch)) {
            const rest = a.slice(j + 1);
            if (rest !== '') set(ch, rest);
            else if (i + 1 < args.length) set(ch, args[++i]);
            else return { f, ops, bad: `option requires an argument -- '${ch}'` };
            break;
          }
          set(ch, multi.has(ch) ? true : (f[ch] > 0 ? f[ch] + 1 : f[ch] === true ? 2 : true));
        }
        continue;
      }
      ops.push(a);
      if (o.stopAtOperand) { ops.push(...args.slice(i + 1)); break; }
    }
    return { f, ops };
  }
  /** 옵션 오류를 GNU 형식으로 출력 */
  function badOpt(c, cmd, msg, code = 1, usage) {
    c.err(`${cmd}: ${msg}\n${usage ? usage + '\n' : ''}Try '${cmd} --help' for more information.\n`);
    return code;
  }

  /** 텍스트 → 줄 배열 (마지막 줄바꿈 뒤 빈 줄 제외) */
  function splitLines(t) {
    if (t === '') return [];
    const a = t.split('\n');
    if (a[a.length - 1] === '') a.pop();
    return a;
  }
  const joinLines = (a) => (a.length ? a.join('\n') + '\n' : '');

  /** 파일 하나 읽기 (권한 적용). 실패하면 {err} */
  async function readOne(c, name) {
    if (name === '-') return { text: await c.readStdin() };
    const abs = c.resolve(name);
    try {
      const n = c.fs.stat(abs, c.cred);
      if (n.t === 'd') return { err: 'Is a directory', dir: true };
      return { text: c.fs.readFile(abs, c.cred), node: n, abs };
    } catch (e) { return { err: e.message, code: e.code }; }
  }

  /** 파일 쓰기 (권한 적용). 실패하면 오류 메시지 */
  function writeOut(c, name, text, append) {
    try {
      c.fs.writeFile(c.resolve(name), text, c.cred, { append: !!append, mode: 0o666 & ~c.sh.umask });
      return null;
    } catch (e) { return e.message; }
  }

  /** 로케일(en_US.UTF-8) 비슷한 문자열 비교 — 문장부호 무시 · 대소문자 무시 후 바이트 비교 */
  let COLL;
  function collator() {
    if (COLL === undefined) {
      try { COLL = new Intl.Collator('en-US', { ignorePunctuation: true }); } catch (e) { COLL = null; }
    }
    return COLL;
  }
  const bytecmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  function lcmp(a, b) {
    if (a === b) return 0;
    const C = collator();
    const r = C ? C.compare(a, b) : 0;
    return r || bytecmp(a, b);
  }
  /** LC_ALL / LANG 가 C 이면 바이트 비교 */
  function cmpFor(c) {
    const loc = c.env('LC_ALL') || c.env('LC_COLLATE') || c.env('LANG') || '';
    return /^(C|POSIX)(\.|$)/.test(loc) ? bytecmp : lcmp;
  }

  // ---------------------------------------------------------------- UTF-8
  const TE = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  function utf8(s) {
    if (TE) return TE.encode(s);
    const out = [];
    for (const ch of s) {
      let cp = ch.codePointAt(0);
      if (cp < 0x80) out.push(cp);
      else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
      else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
      else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    }
    return Uint8Array.from(out);
  }
  function fromUtf8(bytes) {
    try {
      if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (e) {
      return Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    }
    let s = '';
    for (let i = 0; i < bytes.length;) {
      const b = bytes[i];
      let cp, n;
      if (b < 0x80) { cp = b; n = 1; } else if (b >= 0xf0) { cp = b & 7; n = 4; } else if (b >= 0xe0) { cp = b & 15; n = 3; } else if (b >= 0xc0) { cp = b & 31; n = 2; } else { cp = b; n = 1; }
      for (let k = 1; k < n; k++) cp = (cp << 6) | (bytes[i + k] & 63);
      s += String.fromCodePoint(cp);
      i += n;
    }
    return s;
  }

  // ---------------------------------------------------------------- 숫자 서식 (C printf)
  function expStr(x, p, upper) {
    let s = x.toExponential(p);
    s = s.replace(/e([+-])(\d)$/, 'e$10$2');
    return upper ? s.toUpperCase() : s;
  }
  function fmtG(x, p, alt, upper) {
    if (!isFinite(x)) return isNaN(x) ? (upper ? 'NAN' : 'nan') : (x < 0 ? '-' : '') + (upper ? 'INF' : 'inf');
    if (p === 0) p = 1;
    if (x === 0) return (Object.is(x, -0) ? '-' : '') + (alt ? '0.' + '0'.repeat(p - 1) : '0');
    const ex = x.toExponential(p - 1);
    const e = parseInt(ex.slice(ex.indexOf('e') + 1), 10);
    let s;
    if (e < -4 || e >= p) {
      let [m, ee] = ex.split('e');
      if (!alt && m.includes('.')) m = m.replace(/\.?0+$/, '');
      const en = +ee;
      s = m + 'e' + (en < 0 ? '-' : '+') + String(Math.abs(en)).padStart(2, '0');
    } else {
      s = x.toFixed(Math.min(100, Math.max(0, p - 1 - e)));
      if (!alt && s.includes('.')) s = s.replace(/\.?0+$/, '');
    }
    return upper ? s.toUpperCase() : s;
  }
  /**
   * C 스타일 sprintf
   * @param {string} fmt
   * @param {Array} args
   * @param {object} cv { num(v), str(v), chr(v) }
   */
  function csprintf(fmt, args, cv) {
    let ai = 0;
    const next = () => args[ai++];
    return fmt.replace(/%([-+ #0]*)(\*|\d+)?(?:\.(\*|\d*))?(hh|h|ll|l|L|q|j|z|t)?([diouxXeEfFgGcs%])/g, (m, flags, width, prec, len, conv) => {
      if (conv === '%') return '%';
      if (width === '*') { width = Math.trunc(cv.num(next())); if (width < 0) { flags += '-'; width = -width; } }
      if (prec === '*') { prec = Math.trunc(cv.num(next())); if (prec < 0) prec = undefined; }
      if (prec === '') prec = 0;
      if (prec != null) prec = +prec;
      const a = next();
      let s;
      let numeric = true;
      switch (conv) {
        case 'd': case 'i': {
          let n = cv.num(a);
          n = isFinite(n) ? Math.trunc(n) : 0;
          let digits = Math.abs(n) >= 1e21 ? BigInt(Math.abs(n)).toString() : String(Math.abs(n));
          if (prec != null) digits = prec === 0 && n === 0 ? '' : digits.padStart(prec, '0');
          s = (n < 0 ? '-' : flags.includes('+') ? '+' : flags.includes(' ') ? ' ' : '') + digits;
          break;
        }
        case 'o': case 'u': case 'x': case 'X': {
          let n = Math.trunc(cv.num(a) || 0);
          let big = BigInt(n);
          if (big < 0n) big = BigInt.asUintN(64, big);
          s = conv === 'u' ? big.toString() : big.toString(conv === 'o' ? 8 : 16);
          if (conv === 'X') s = s.toUpperCase();
          if (prec != null) s = prec === 0 && n === 0 ? '' : s.padStart(prec, '0');
          if (flags.includes('#') && n !== 0) s = (conv === 'o' ? '0' : conv === 'x' ? '0x' : conv === 'X' ? '0X' : '') + s;
          break;
        }
        case 'e': case 'E': case 'f': case 'F': case 'g': case 'G': {
          const n = cv.num(a);
          const p = prec == null ? 6 : prec;
          if (!isFinite(n)) s = isNaN(n) ? 'nan' : (n < 0 ? '-inf' : 'inf');
          else if (conv === 'e' || conv === 'E') s = expStr(n, Math.min(100, p), conv === 'E');
          else if (conv === 'f' || conv === 'F') s = Math.abs(n) >= 1e21 ? BigInt(Math.round(n)).toString() + (p ? '.' + '0'.repeat(p) : '') : n.toFixed(Math.min(100, p));
          else s = fmtG(n, p, flags.includes('#'), conv === 'G');
          if (/^[A-Z]/.test(conv) && !isFinite(n)) s = s.toUpperCase();
          if (n >= 0 && !Object.is(n, -0) && s[0] !== '-') s = (flags.includes('+') ? '+' : flags.includes(' ') ? ' ' : '') + s;
          break;
        }
        case 'c': numeric = false; s = cv.chr(a); break;
        default: numeric = false; s = cv.str(a); if (prec != null) s = s.slice(0, prec);
      }
      if (width) {
        const w = +width;
        const len0 = s.length;
        if (len0 < w) {
          if (flags.includes('-')) s = s + ' '.repeat(w - len0);
          else if (flags.includes('0') && numeric && !(prec != null && /[diouxX]/.test(conv)) && /\d/.test(s)) {
            const pre = (/^[-+ ]?(0[xX])?/.exec(s) || [''])[0];
            s = pre + '0'.repeat(w - len0) + s.slice(pre.length);
          } else s = ' '.repeat(w - len0) + s;
        }
      }
      return s;
    });
  }
  LX.csprintf = csprintf;
  LX.fmtG = fmtG;

  // ---------------------------------------------------------------- POSIX 정규식 → JS
  class ReErr extends Error {}
  const CLASSES = {
    alpha: 'a-zA-Z\\u00c0-\\u024f\\u0370-\\u1fff\\u3040-\\u9fff\\uac00-\\ud7af', digit: '0-9',
    alnum: '0-9a-zA-Z\\u00c0-\\u024f\\u0370-\\u1fff\\u3040-\\u9fff\\uac00-\\ud7af', upper: 'A-Z', lower: 'a-z',
    space: ' \\t\\n\\r\\f\\v', blank: ' \\t', punct: '!-\\/:-@\\[-`{-~', print: ' -~\\u00a0-\\uffff', graph: '!-~\\u00a1-\\uffff',
    cntrl: '\\x00-\\x1f\\x7f', xdigit: '0-9A-Fa-f', word: '\\w'
  };
  const escLit = (ch) => (/[.*+?^${}()|[\]\\/]/.test(ch) ? '\\' + ch : ch);
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

  function bracket(src, i, mode) {
    let j = i + 1;
    let neg = false;
    let out = '';
    if (src[j] === '^') { neg = true; j++; }
    let first = true;
    while (j < src.length) {
      const ch = src[j];
      if (ch === ']' && !first) return { re: '[' + (neg ? '^' : '') + out + ']', end: j + 1 };
      first = false;
      if (ch === '[' && src[j + 1] === ':') {
        const k = src.indexOf(':]', j + 2);
        if (k > 0) {
          const name = src.slice(j + 2, k);
          if (!CLASSES[name]) throw new ReErr('Invalid character class name');
          out += CLASSES[name];
          j = k + 2;
          continue;
        }
      }
      if (ch === '[' && (src[j + 1] === '=' || src[j + 1] === '.')) {
        const d = src[j + 1];
        const k = src.indexOf(d + ']', j + 2);
        if (k > 0) { out += src.slice(j + 2, k).split('').map((x) => '\\' + x).join(''); j = k + 2; continue; }
      }
      if (ch === '\\') {
        const d = src[j + 1];
        if (mode.awk && d != null) {
          const map = { n: '\\n', t: '\\t', r: '\\r', f: '\\f', v: '\\v', '\\': '\\\\', ']': '\\]', '/': '/', '"': '"', '-': '\\-', '^': '\\^', '[': '\\[' };
          out += map[d] || '\\' + d;
          j += 2;
          continue;
        }
        if (mode.sed && (d === 'n' || d === 't' || d === ']')) { out += d === ']' ? '\\\\' : '\\' + d; j += d === ']' ? 1 : 2; continue; }
        out += '\\\\';
        j++;
        continue;
      }
      if (ch === ']' || ch === '[' || ch === '^') { out += '\\' + ch; j++; continue; }
      out += ch;
      j++;
    }
    throw new ReErr('Unmatched [, [^, [:, [., or [=');
  }

  /**
   * POSIX BRE/ERE → JS 정규식 원문
   * @param {string} src
   * @param {object} mode { ere, sed, awk, grep }
   */
  function posixRe(src, mode = {}) {
    const ere = !!mode.ere;
    let out = '';
    let i = 0;
    const n = src.length;
    let atStart = true;
    let lastQuant = false;
    let depth = 0;
    const quant = (q) => {
      if (lastQuant) return;   // a** → a*
      out += q;
      lastQuant = true;
    };
    while (i < n) {
      const ch = src[i];
      const wasStart = atStart;
      atStart = false;
      const wasQ = lastQuant;
      lastQuant = false;
      if (ch === '\\') {
        const d = src[i + 1];
        i += 2;
        if (d === undefined) throw new ReErr('Trailing backslash');
        if (!ere) {
          if (d === '(') { out += '('; depth++; atStart = true; continue; }
          if (d === ')') { if (!depth) throw new ReErr('Unmatched ) or \\)'); depth--; out += ')'; continue; }
          if (d === '{') {
            const m = /^(\d*)(,(\d*))?\\\}/.exec(src.slice(i));
            if (!m) throw new ReErr('Unmatched \\{');
            if (wasStart) { out += '\\{'; continue; }
            lastQuant = wasQ;
            quant('{' + (m[1] || '0') + (m[2] ? ',' + m[3] : '') + '}');
            i += m[0].length;
            continue;
          }
          if (d === '|') { out += '|'; atStart = true; continue; }
          if (d === '+' || d === '?') { if (wasStart) out += '\\' + d; else { lastQuant = wasQ; quant(d); } continue; }
        }
        if (d === '<') { out += '\\b(?=\\w)'; continue; }
        if (d === '>') { out += '\\b(?<=\\w)'; continue; }
        if (d === '`') { out += '^'; continue; }
        if (d === "'") { out += '$'; continue; }
        if ('bBwWsS'.includes(d) && !mode.awk) { out += '\\' + d; continue; }
        if (/[1-9]/.test(d) && !mode.awk) { out += '\\' + d; continue; }
        if (d === 'n' && !mode.grep) { out += '\\n'; continue; }
        if (d === 't' && !mode.grep) { out += '\\t'; continue; }
        if ((d === 'r' || d === 'f' || d === 'v') && !mode.grep && !mode.awk) { out += '\\' + d; continue; }
        if (mode.awk) {
          const map = { r: '\\r', f: '\\f', v: '\\v', a: '\\x07', b: '\\x08', y: '\\b', B: '\\B', s: '\\s', S: '\\S', w: '\\w', W: '\\W' };
          if (map[d]) { out += map[d]; continue; }
          if (/[0-7]/.test(d)) { let o = d; while (o.length < 3 && /[0-7]/.test(src[i])) o += src[i++]; out += escLit(String.fromCharCode(parseInt(o, 8))); continue; }
        }
        out += escLit(d);
        continue;
      }
      if (ch === '[') { const b = bracket(src, i, mode); out += b.re; i = b.end; continue; }
      if (ch === '.') { out += '[^]'; i++; continue; }
      if (ch === '*') {
        if (wasStart) out += '\\*'; else { lastQuant = wasQ; quant('*'); }
        i++;
        continue;
      }
      if (ch === '^') {
        if (ere || wasStart) { out += '^'; atStart = true; } else out += '\\^';
        i++;
        continue;
      }
      if (ch === '$') {
        const rest = src.slice(i + 1);
        if (ere || rest === '' || rest.startsWith('\\)') || rest.startsWith('\\|')) out += '$'; else out += '\\$';
        i++;
        continue;
      }
      if (ere) {
        if (ch === '(') { out += '('; depth++; atStart = true; i++; if (src[i] === ')') { out += ')'; depth--; i++; } continue; }
        if (ch === ')') {
          if (!depth) { out += '\\)'; i++; continue; }
          depth--; out += ')'; i++; continue;
        }
        if (ch === '|') { out += '|'; atStart = true; i++; continue; }
        if (ch === '+' || ch === '?') { if (wasStart) out += '\\' + ch; else { lastQuant = wasQ; quant(ch); } i++; continue; }
        if (ch === '{') {
          const m = /^\{(\d*)(,(\d*))?\}/.exec(src.slice(i));
          if (m && (m[1] !== '' || (m[2] && m[3] !== '')) && !wasStart) { lastQuant = wasQ; quant('{' + (m[1] || '0') + (m[2] ? ',' + m[3] : '') + '}'); i += m[0].length; continue; }
          out += '\\{';
          i++;
          continue;
        }
      }
      out += escLit(ch);
      i++;
    }
    if (depth) throw new ReErr('Unmatched ( or \\(');
    return out;
  }
  /** 캡처 그룹을 비캡처로 (split 에 구분자가 섞이지 않게) */
  function noCap(src) {
    let out = '';
    let inCls = false;
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (ch === '\\') { out += ch + (src[i + 1] || ''); i++; continue; }
      if (inCls) { if (ch === ']') inCls = false; out += ch; continue; }
      if (ch === '[') { inCls = true; out += ch; if (src[i + 1] === '^') { out += '^'; i++; } if (src[i + 1] === ']') { out += ']'; i++; } continue; }
      if (ch === '(' && src[i + 1] !== '?') { out += '(?:'; continue; }
      out += ch;
    }
    return out;
  }
  /** 정규식 만들기 (오류는 GNU 식 메시지로) */
  function mkRe(src, flags) {
    try { return new RegExp(src, flags); } catch (e) {
      const m = String(e.message);
      if (/Unterminated group|Unmatched '\('/.test(m)) throw new ReErr('Unmatched ( or \\(');
      if (/Unmatched '\)'/.test(m)) throw new ReErr('Unmatched ) or \\)');
      if (/Nothing to repeat/.test(m)) throw new ReErr('Invalid preceding regular expression');
      if (/numbers out of order/.test(m)) throw new ReErr('Invalid content of \\{\\}');
      if (/Invalid (named )?(capture group|reference)|back ?ref/i.test(m)) throw new ReErr('Invalid back reference');
      throw new ReErr('Invalid regular expression');
    }
  }
  LX.posixRe = posixRe;

  /** 단어 구성 문자 (grep -w) */
  const WORDCH = '0-9A-Za-z_\\u00c0-\\u024f\\u0370-\\u1fff\\u3040-\\u9fff\\uac00-\\ud7af';

  // ======================================================================= grep
  def(['grep', 'egrep', 'fgrep'], async (c) => {
    const cmd = 'grep';
    const o = { E: c.name === 'egrep', F: c.name === 'fgrep', pats: [], patFiles: [], A: 0, B: 0, color: 'never', include: [], exclude: [], exdir: [] };
    const files = [];
    const LONG = {
      'ignore-case': 'i', 'no-ignore-case': 'noi', 'invert-match': 'v', 'line-number': 'n', count: 'c', 'files-with-matches': 'l',
      'files-without-match': 'L', recursive: 'r', 'dereference-recursive': 'R', 'word-regexp': 'w', 'line-regexp': 'x',
      'extended-regexp': 'E', 'fixed-strings': 'F', 'basic-regexp': 'G', 'perl-regexp': 'P', 'only-matching': 'o', quiet: 'q', silent: 'q',
      'no-messages': 's', 'no-filename': 'h', 'with-filename': 'H', 'after-context': 'A:', 'before-context': 'B:', context: 'C:',
      regexp: 'e:', file: 'f:', 'max-count': 'm:', color: 'color?', colour: 'color?', include: 'include:', exclude: 'exclude:',
      'exclude-dir': 'exdir:', text: 'a', 'byte-offset': 'b', label: 'label:', 'null': 'Z', 'null-data': 'z', 'initial-tab': 'T',
      'binary-files': 'binf:', 'line-buffered': 'lb', 'ignore-binary': 'I', version: 'V', help: 'help', devices: 'D:', directories: 'd:'
    };
    const usage = 'Usage: grep [OPTION]... PATTERNS [FILE]...';
    const r = opts(c.args, 'ivnclLrRwxEFGPoqshHA:B:C:e:f:m:abZzTIVUD:d:y', LONG, { multi: ['e', 'f', 'include', 'exclude', 'exdir'], digits: true });
    if (r.bad) return badOpt(c, cmd, r.bad, 2, usage);
    const f = r.f;
    if (f.V) { c.out('grep (GNU grep) 3.11\nCopyright (C) 2023 Free Software Foundation, Inc.\nLicense GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.\nThis is free software: you are free to change and redistribute it.\nThere is NO WARRANTY, to the extent permitted by law.\n\nWritten by Mike Haertel and others; see\n<https://git.savannah.gnu.org/cgit/grep.git/tree/AUTHORS>.\n'); return 0; }
    if (f.help) { c.out(usage + '\nSearch for PATTERNS in each FILE.\nExample: grep -i \'hello world\' menu.h main.c\nPATTERNS can contain multiple patterns separated by newlines.\n'); return 0; }
    if (f.E) o.E = true;
    if (f.F) o.F = true;
    if (f.G) { o.E = false; o.F = false; }
    if (f.P) o.E = true;
    const num = (v, what) => {
      if (!/^\d+$/.test(String(v))) { c.err(`grep: ${v}: invalid ${what} argument\n`); return null; }
      return +v;
    };
    if (f['#'] != null) { o.A = o.B = +f['#']; }
    if (f.C != null) { const v = num(f.C, 'context length'); if (v == null) return 2; o.A = o.B = v; }
    if (f.A != null) { const v = num(f.A, 'context length'); if (v == null) return 2; o.A = v; }
    if (f.B != null) { const v = num(f.B, 'context length'); if (v == null) return 2; o.B = v; }
    let maxCount = Infinity;
    if (f.m != null) { if (!/^-?\d+$/.test(f.m)) { c.err(`grep: invalid max count\n`); return 2; } maxCount = +f.m < 0 ? Infinity : +f.m; }
    if (f.color === true || f.color === 'auto' || f.color === 'tty' || f.color === 'if-tty') o.color = c.tty ? 'always' : 'never';
    else if (f.color === 'always' || f.color === 'yes' || f.color === 'force') o.color = 'always';
    else if (f.color != null && !['never', 'no', 'none'].includes(f.color)) {
      c.err(`grep: invalid argument ‘${f.color}’ for ‘--color’\nValid arguments are:\n  - ‘always’, ‘yes’, ‘force’\n  - ‘never’, ‘no’, ‘none’\n  - ‘auto’, ‘tty’, ‘if-tty’\n${usage}\nTry 'grep --help' for more information.\n`);
      return 2;
    }
    const colorOn = o.color === 'always';
    const icase = (f.i || f.y) && !f.noi;
    // 패턴 모으기
    for (const e of f.e || []) o.pats.push(...String(e).split('\n'));
    let st = 0;
    for (const pf of f.f || []) {
      const rd = await readOne(c, pf);
      if (rd.err) { c.err(`grep: ${pf}: ${rd.err}\n`); return 2; }
      o.pats.push(...splitLines(rd.text));
      if (!splitLines(rd.text).length) o.noPats = true;
    }
    const ops = r.ops.slice();
    if (!f.e && !f.f) {
      if (!ops.length) { c.err(`${usage}\nTry 'grep --help' for more information.\n`); return 2; }
      o.pats.push(...ops.shift().split('\n'));
    }
    const noArgRec = !!(f.r || f.R) && !ops.length;
    // 정규식 만들기
    let re, reG;
    try {
      const srcs = o.pats.map((p) => (o.F ? escRe(p) : f.P ? p : posixRe(p, { ere: o.E, grep: true })));
      let body = srcs.length ? srcs.map((s) => `(?:${s})`).join('|') : '(?!)';
      if (f.x) body = `^(?:${body})$`;
      else if (f.w) body = `(?<![${WORDCH}])(?:${body})(?![${WORDCH}])`;
      re = mkRe(body, icase ? 'i' : '');
      reG = mkRe(body, icase ? 'gi' : 'g');
    } catch (e) {
      if (e instanceof ReErr) { c.err(`grep: ${e.message}\n`); return 2; }
      throw e;
    }
    const inv = !!f.v;
    const recursive = !!(f.r || f.R);
    if (!ops.length) ops.push(recursive ? '.' : '-');
    const multi = ops.length > 1;
    const quiet = !!f.q;
    const listMode = f.l ? 'l' : f.L ? 'L' : null;
    const showNum = !!f.n;
    const onlyM = !!f.o;
    const ctxOn = (o.A || o.B) && !onlyM && !f.c && !listMode;
    // 색 · 머리말
    const SEPC = (s) => (colorOn ? `\x1b[36m\x1b[K${s}\x1b[m\x1b[K` : s);
    const NAMEC = (s) => (colorOn ? `\x1b[35m\x1b[K${s}\x1b[m\x1b[K` : s);
    const NUMC = (s) => (colorOn ? `\x1b[32m\x1b[K${s}\x1b[m\x1b[K` : String(s));
    const MATCHC = (s) => `\x1b[01;31m\x1b[K${s}\x1b[m\x1b[K`;
    let matchedAny = false;
    let printedAny = false;
    let lastGroupEnd = null;
    const out = [];
    const flush = () => { if (out.length) { c.out(out.join('')); out.length = 0; } };
    const hiLine = (line) => {
      reG.lastIndex = 0;
      return line.replace(reG, (m) => (m === '' ? m : MATCHC(m)));
    };
    const globRe = (g) => LX.glob.globToRe(g, false);
    const incl = (f.include || []).map(globRe);
    const excl = (f.exclude || []).map(globRe);
    const exdir = (f.exdir || []).map(globRe);

    const EOL = f.z ? '\0' : '\n';
    function searchText(text, label, showName) {
      if (!text.includes('\0') || f.a || f.z) { /* 일반 */ } else {
        const bin = splitLines(text).some((l) => re.test(l) !== inv);
        if (bin) {
          matchedAny = true;
          if (quiet) return 'quit';
          if (listMode === 'l') out.push(NAMEC(label) + (f.Z ? '\0' : '\n'));
          else if (f.c) out.push((showName ? NAMEC(label) + SEPC(':') : '') + '1\n');
          else if (!listMode) { flush(); c.err(`grep: ${label}: binary file matches\n`); }
        } else if (listMode === 'L') out.push(NAMEC(label) + '\n');
        else if (f.c) out.push((showName ? NAMEC(label) + SEPC(':') : '') + '0\n');
        return null;
      }
      let lines;
      if (f.z) { lines = text.split('\0'); if (lines[lines.length - 1] === '') lines.pop(); } else lines = splitLines(text);
      let count = 0;
      let lastPrinted = -1;
      let afterLeft = 0;
      const pre = (idx, sep) => (showName ? NAMEC(label) + SEPC(sep) : '') + (showNum ? NUMC(idx + 1) + SEPC(sep) : '') + (f.T ? '\t' : '');
      const emit = (idx, sel) => {
        if (ctxOn && lastPrinted >= 0 && idx > lastPrinted + 1) out.push(SEPC('--') + '\n');
        else if (ctxOn && lastPrinted < 0 && printedAny && lastGroupEnd !== null) out.push(SEPC('--') + '\n');
        const line = lines[idx];
        const hl = colorOn && (sel ? !inv : inv) && re.test(line);
        out.push(pre(idx, sel ? ':' : '-') + (hl ? hiLine(line) : line) + EOL);
        lastPrinted = idx;
        printedAny = true;
        lastGroupEnd = idx;
      };
      for (let i = 0; i < lines.length; i++) {
        if (count >= maxCount) {
          if (afterLeft > 0 && ctxOn) { emit(i, false); afterLeft--; continue; }
          break;
        }
        const line = lines[i];
        const hit = re.test(line) !== inv;
        if (hit) {
          count++;
          matchedAny = true;
          if (quiet) return 'quit';
          if (listMode || f.c) { if (listMode === 'l') break; continue; }
          if (onlyM) {
            if (inv) continue;
            reG.lastIndex = 0;
            let m;
            while ((m = reG.exec(line)) !== null) {
              if (m[0] === '') { reG.lastIndex++; continue; }
              out.push(pre(i, ':') + (colorOn ? MATCHC(m[0]) : m[0]) + EOL);
            }
            continue;
          }
          if (ctxOn) for (let b = Math.max(lastPrinted + 1, i - o.B); b < i; b++) emit(b, false);
          emit(i, true);
          afterLeft = o.A;
        } else if (ctxOn && afterLeft > 0) { emit(i, false); afterLeft--; }
        if (out.length > 2000) flush();
      }
      if (f.c) out.push((showName ? NAMEC(label) + SEPC(':') : '') + count + '\n');
      if (listMode === 'l' && count) out.push(NAMEC(label) + (f.Z ? '\0' : '\n'));
      if (listMode === 'L' && !count) { out.push(NAMEC(label) + (f.Z ? '\0' : '\n')); }
      return count;
    }

    let listedL = false;
    async function doPath(p, label, top, showName) {
      if (p === '-') {
        const t = await c.readStdin();
        const lb = f.label || '(standard input)';
        const r2 = searchText(t, lb, showName);
        if (listMode === 'L' && r2 === 0) listedL = true;
        return r2;
      }
      const abs = c.resolve(p);
      let node;
      try {
        node = c.fs.stat(abs, c.cred, top || !!f.R);
      } catch (e) {
        if (!f.s) c.err(`grep: ${label}: ${e.message}\n`);
        st = 2;
        return null;
      }
      if (node.t === 'l') return null;   // -r 는 하위의 심볼릭 링크를 따라가지 않는다
      if (node.t === 'd') {
        if (!recursive || f.d === 'skip') {
          if (f.d === 'skip') return null;
          if (!f.s) c.err(`grep: ${label}: Is a directory\n`);
          st = 2;
          return null;
        }
        if (!top && exdir.some((x) => x.test(P().basename(abs)))) return null;
        let names;
        try { names = c.fs.readdir(abs, c.cred); } catch (e) {
          if (!f.s) c.err(`grep: ${label}: ${e.message}\n`);
          st = 2;
          return null;
        }
        for (const nm of names) {
          const childLabel = noArgRec && top ? nm : (label.endsWith('/') ? label + nm : label + '/' + nm);
          const cabs = abs === '/' ? '/' + nm : abs + '/' + nm;
          const cn = c.fs.lookup(cabs, false);
          if (!cn) continue;
          if (cn.t === 'c' || cn.t === 'b') continue;
          if (cn.t === 'l' && !f.R) continue;
          if (cn.t !== 'd' && incl.length && !incl.some((x) => x.test(nm))) continue;
          if (cn.t !== 'd' && excl.some((x) => x.test(nm))) continue;
          const res = await doPath(cabs, childLabel, false, true);
          if (res === 'quit') return 'quit';
        }
        return null;
      }
      if (node.t === 'c' || node.t === 'b') { if (f.D === 'skip') return null; }
      if (top && (incl.length || excl.length)) {
        const nm = P().basename(abs);
        if (incl.length && !incl.some((x) => x.test(nm))) return null;
        if (excl.some((x) => x.test(nm))) return null;
      }
      let text;
      try { text = c.fs.readFile(abs, c.cred); } catch (e) {
        if (!f.s) c.err(`grep: ${label}: ${e.message}\n`);
        st = 2;
        return null;
      }
      const r2 = searchText(text, label, showName);
      if (listMode === 'L' && r2 === 0) listedL = true;
      return r2;
    }

    for (const p of ops) {
      let showName;
      if (f.h) showName = false;
      else if (f.H) showName = true;
      else {
        let isDir = false;
        try { isDir = p !== '-' && c.fs.stat(c.resolve(p), c.cred).t === 'd'; } catch (e) { /* 무시 */ }
        showName = multi || (recursive && isDir);
      }
      const res = await doPath(p, p, true, showName);
      if (res === 'quit') { flush(); return 0; }
    }
    flush();
    if (st === 2 && !(quiet && matchedAny)) return 2;
    if (listMode === 'L') return listedL ? 0 : 1;
    return matchedAny ? 0 : 1;
  });

  // ======================================================================= sed
  class SedErr extends Error { constructor(msg, pos) { super(msg); this.pos = pos; } }

  /** sed 스크립트 해석 → 명령 목록 */
  function sedParse(script, ere) {
    const cmds = [];
    const labels = {};
    const stack = [];
    let i = 0;
    const n = script.length;
    const peek = () => script[i];
    const err = (msg) => { throw new SedErr(msg, Math.min(i, n)); };
    const skipWs = () => { while (i < n && /[ \t]/.test(script[i])) i++; };
    const mkRegex = (src, flags) => {
      if (src === '') return { empty: true, flags };
      let js;
      try { js = posixRe(src, { ere, sed: true }); } catch (e) { if (e instanceof ReErr) err(e.message); throw e; }
      let fl = flags.includes('I') ? 'i' : '';
      if (flags.includes('M')) fl += 'm';
      try {
        return { re: mkRe(js, fl), reG: mkRe(js, fl + 'g'), src };
      } catch (e) { if (e instanceof ReErr) err(e.message); throw e; }
    };
    // 구분자로 끝나는 부분 읽기
    const delimited = (delim, what, isRe) => {
      let s = '';
      for (;;) {
        if (i >= n) err(what);
        const ch = script[i++];
        if (ch === '\\') {
          if (i >= n) err(what);
          const d = script[i++];
          if (d === delim) s += (isRe && /[.*[\]^$+?(){}|]/.test(d) && d !== '/') ? '\\' + d : d;
          else if (d === '\n') s += isRe ? '\\n' : '\n';
          else if (d === 'n' && isRe) s += '\\n';
          else s += '\\' + d;
          continue;
        }
        if (ch === delim) return s;
        if (ch === '\n' && isRe) err(what);
        s += ch;
      }
    };
    const readAddr = () => {
      const ch = peek();
      if (/\d/.test(ch)) {
        let d = '';
        while (i < n && /\d/.test(script[i])) d += script[i++];
        if (peek() === '~') {
          i++;
          let s = '';
          while (i < n && /\d/.test(script[i])) s += script[i++];
          return { t: 'step', first: +d, step: +(s || 0) };
        }
        return { t: 'line', n: +d };
      }
      if (ch === '$') { i++; return { t: 'last' }; }
      if (ch === '/' || ch === '\\') {
        let delim = '/';
        if (ch === '\\') { i++; delim = script[i]; }
        i++;
        const src = delimited(delim, 'unterminated address regex', true);
        let flags = '';
        while (i < n && /[IM]/.test(script[i])) flags += script[i++];
        return Object.assign({ t: 're' }, mkRegex(src, flags));
      }
      return null;
    };
    // a · i · c 의 글
    const readText = () => {
      skipWs();
      if (peek() === '\\') {
        i++;
        if (peek() === '\n') i++;
      }
      let s = '';
      while (i < n) {
        const ch = script[i];
        if (ch === '\\') {
          const d = script[i + 1];
          if (d === undefined) { i++; break; }
          if (d === '\n') { s += '\n'; i += 2; continue; }
          s += d === 't' ? '\t' : d === 'n' ? '\n' : d;
          i += 2;
          continue;
        }
        if (ch === '\n') { i++; break; }
        s += ch;
        i++;
      }
      return s;
    };
    const readLabel = () => {
      skipWs();
      let s = '';
      while (i < n && !/[;\n]/.test(script[i])) s += script[i++];
      return s.trim();
    };
    const readFile = () => {
      skipWs();
      let s = '';
      while (i < n && script[i] !== '\n') s += script[i++];
      return s;
    };
    const endCmd = () => {
      skipWs();
      if (i >= n) return;
      const ch = script[i];
      if (ch === ';' || ch === '\n') { i++; return; }
      if (ch === '}' || ch === '#') return;
      i++;
      err('extra characters after command');
    };
    while (i < n) {
      while (i < n && /[ \t\n;]/.test(script[i])) i++;
      if (i >= n) break;
      if (script[i] === '#') { while (i < n && script[i] !== '\n') i++; continue; }
      const cmd = { a1: null, a2: null, neg: false };
      cmd.a1 = readAddr();
      if (cmd.a1 && peek() === ',') {
        i++;
        skipWs();
        const ch = peek();
        if (ch === '+' || ch === '~') {
          i++;
          let d = '';
          while (i < n && /\d/.test(script[i])) d += script[i++];
          if (d === '') err('expected newer version of sed');
          cmd.a2 = { t: ch === '+' ? 'plus' : 'mult', n: +d };
        } else {
          cmd.a2 = readAddr();
          if (!cmd.a2) err('unexpected `,\'');
          if (cmd.a2.t === 'step') cmd.a2 = { t: 'line', n: cmd.a2.first };
        }
      }
      if (cmd.a1 && cmd.a1.t === 'line' && cmd.a1.n === 0) {
        if (!cmd.a2 || cmd.a2.t !== 're') err('invalid usage of line address 0');
        cmd.zero = true;
      }
      skipWs();
      while (peek() === '!') { cmd.neg = true; i++; skipWs(); }
      if (i >= n) err('missing command');
      const name = script[i++];
      cmd.name = name;
      switch (name) {
        case '{': stack.push(cmds.length); cmds.push(cmd); continue;
        case '}':
          if (cmd.a1) err('} doesn\'t want any addresses');
          if (!stack.length) err('unexpected `}\'');
          cmds[stack.pop()].end = cmds.length;
          cmds.push(cmd);
          endCmd();
          continue;
        case '=': case 'd': case 'D': case 'g': case 'G': case 'h': case 'H': case 'n': case 'N':
        case 'p': case 'P': case 'x': case 'z': case 'F':
          cmds.push(cmd); endCmd(); continue;
        case 'a': case 'i': case 'c': {
          const save = i;
          skipWs();
          if (i >= n) { i = save; err('expected \\ after `a\', `c\' or `i\''); }
          cmd.text = readText();
          cmds.push(cmd);
          continue;
        }
        case ':': {
          if (cmd.a1) err(': doesn\'t want any addresses');
          const lb = readLabel();
          if (!lb) err('":" lacks a label');
          labels[lb] = cmds.length;
          cmd.label = lb;
          cmds.push(cmd);
          if (peek() === ';' || peek() === '\n') i++;
          continue;
        }
        case 'b': case 't': case 'T': {
          skipWs();
          let s = '';
          while (i < n && !/[;\n}]/.test(script[i])) s += script[i++];
          cmd.label = s.trim();
          cmds.push(cmd);
          endCmd();
          continue;
        }
        case 'q': case 'Q': case 'l': case 'L': {
          skipWs();
          let d = '';
          while (i < n && /\d/.test(script[i])) d += script[i++];
          cmd.num = d === '' ? null : +d;
          cmds.push(cmd);
          endCmd();
          continue;
        }
        case 'r': case 'R': case 'w': case 'W':
          cmd.file = readFile();
          if (!cmd.file) err(`missing filename in r/R/w/W commands`);
          cmds.push(cmd);
          continue;
        case 's': {
          const delim = script[i++];
          if (delim === undefined || delim === '\n' || delim === '\\') err('unterminated `s\' command');
          const src = delimited(delim, 'unterminated `s\' command', true);
          const rep = delimited(delim, 'unterminated `s\' command', false);
          let flags = '';
          cmd.g = false; cmd.p = 0; cmd.nth = 0;
          while (i < n) {
            const ch = script[i];
            if (ch === 'g') { cmd.g = true; i++; } else if (ch === 'p') { cmd.p++; i++; } else if (ch === 'i' || ch === 'I') { flags += 'I'; i++; } else if (ch === 'm' || ch === 'M') { flags += 'M'; i++; } else if (ch === 'e') { i++; } else if (/\d/.test(ch)) {
              let d = '';
              while (i < n && /\d/.test(script[i])) d += script[i++];
              if (+d === 0) err('number option to `s\' command may not be zero');
              cmd.nth = +d;
            } else if (ch === 'w') { i++; cmd.wfile = readFile(); break; } else break;
          }
          Object.assign(cmd, { rx: mkRegex(src, flags) });
          cmd.rep = sedRepParse(rep);
          cmds.push(cmd);
          skipWs();
          if (i < n && !/[;\n}#]/.test(script[i])) { i++; err('unknown option to `s\''); }
          endCmd();
          continue;
        }
        case 'y': {
          const delim = script[i++];
          const yread = () => {
            let s = '';
            for (;;) {
              if (i >= n) err('unterminated `y\' command');
              const ch = script[i++];
              if (ch === '\\') {
                const d = script[i++];
                if (d === delim) s += d; else if (d === 'n') s += '\n'; else if (d === '\\') s += '\\'; else if (d === 't') s += '\t'; else s += '\\' + d;
                continue;
              }
              if (ch === delim) return s;
              s += ch;
            }
          };
          const a = [...yread()];
          const b = [...yread()];
          if (a.length !== b.length) err('strings for `y\' command are different lengths');
          cmd.map = new Map(a.map((ch, k) => [ch, b[k]]));
          cmds.push(cmd);
          endCmd();
          continue;
        }
        case '#': while (i < n && script[i] !== '\n') i++; continue;
        default:
          err(`unknown command: \`${name}'`);
      }
    }
    if (stack.length) { i = n; throw new SedErr('unmatched `{\'', stack.length ? n : 0); }
    for (const cm of cmds) {
      if ((cm.name === 'b' || cm.name === 't' || cm.name === 'T') && cm.label && !(cm.label in labels)) throw new SedErr(`can't find label for jump to \`${cm.label}'`, -1);
    }
    return { cmds, labels };
  }

  /** s 명령 바꿀 문자열 해석: & \1..\9 \n \t \L \U \l \u \E */
  function sedRepParse(rep) {
    const parts = [];
    let lit = '';
    const push = (p) => { if (lit) { parts.push({ lit }); lit = ''; } parts.push(p); };
    for (let i = 0; i < rep.length; i++) {
      const ch = rep[i];
      if (ch === '&') { push({ g: 0 }); continue; }
      if (ch === '\\' && i + 1 < rep.length) {
        const d = rep[++i];
        if (/\d/.test(d)) push({ g: +d });
        else if (d === 'n') lit += '\n';
        else if (d === 't') lit += '\t';
        else if (d === 'r') lit += '\r';
        else if ('LUluE'.includes(d)) push({ cs: d });
        else lit += d;
        continue;
      }
      lit += ch;
    }
    if (lit) parts.push({ lit });
    return parts;
  }
  function sedRepApply(parts, m) {
    let out = '';
    let mode = '';
    let one = '';
    for (const p of parts) {
      if (p.cs) {
        if (p.cs === 'E') { mode = ''; one = ''; } else if (p.cs === 'L' || p.cs === 'U') { mode = p.cs; one = ''; } else one = p.cs;
        continue;
      }
      let s = p.lit != null ? p.lit : (m[p.g] || '');
      if (mode === 'U') s = s.toUpperCase(); else if (mode === 'L') s = s.toLowerCase();
      if (one && s) { s = (one === 'u' ? s[0].toUpperCase() : s[0].toLowerCase()) + s.slice(1); one = ''; }
      out += s;
    }
    return out;
  }

  /** l 명령 출력 */
  function sedL(s, width) {
    const w = width == null ? 70 : width;
    let out = '';
    const map = { '\\': '\\\\', '\x07': '\\a', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t', '\v': '\\v' };
    for (const ch of s) {
      if (map[ch]) out += map[ch];
      else if (ch < ' ' || ch === '\x7f') out += '\\' + ch.charCodeAt(0).toString(8).padStart(3, '0');
      else if (ch.charCodeAt(0) > 0x7f) out += Array.from(utf8(ch), (b) => '\\' + b.toString(8).padStart(3, '0')).join('');
      else out += ch;
    }
    if (w > 1) {
      let res = '';
      let cur = '';
      const toks = out.match(/\\[0-7]{3}|\\.|[^]/g) || [];
      for (const t of toks) {
        if (cur.length + t.length > w - 1) { res += cur + '\\\n'; cur = ''; }
        cur += t;
      }
      return res + cur + '$\n';
    }
    return out + '$\n';
  }

  def('sed', async (c) => {
    const args = c.args;
    const exprs = [];
    const files = [];
    let quiet = false, ere = false, inPlace = null, separate = false, nullData = false, posix = false;
    let fromFile = null;
    for (let k = 0; k < args.length; k++) {
      const a = args[k];
      if (a === '--') { files.push(...args.slice(k + 1)); break; }
      if (a.startsWith('--')) {
        const [key, val] = a.slice(2).split(/=(.*)/s);
        if (key === 'quiet' || key === 'silent') quiet = true;
        else if (key === 'regexp-extended') ere = true;
        else if (key === 'expression') { const v = val != null ? val : args[++k]; exprs.push({ src: v, kind: 'e' }); }
        else if (key === 'file') { const v = val != null ? val : args[++k]; exprs.push({ file: v, kind: 'f' }); }
        else if (key === 'in-place') inPlace = val || '';
        else if (key === 'separate') separate = true;
        else if (key === 'null-data') nullData = true;
        else if (key === 'posix' || key === 'debug' || key === 'unbuffered' || key === 'sandbox' || key === 'follow-symlinks') posix = posix || key === 'posix';
        else if (key === 'version') { c.out('sed (GNU sed) 4.9\nPackaged by Debian\nCopyright (C) 2022 Free Software Foundation, Inc.\nLicense GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.\nThis is free software: you are free to change and redistribute it.\nThere is NO WARRANTY, to the extent permitted by law.\n'); return 0; }
        else if (key === 'help') { c.out('Usage: sed [OPTION]... {script-only-if-no-other-script} [input-file]...\n\n  -n, --quiet, --silent\n                 suppress automatic printing of pattern space\n  -e script, --expression=script\n                 add the script to the commands to be executed\n  -f script-file, --file=script-file\n                 add the contents of script-file to the commands to be executed\n  -i[SUFFIX], --in-place[=SUFFIX]\n                 edit files in place (makes backup if SUFFIX supplied)\n  -E, -r, --regexp-extended\n                 use extended regular expressions in the script\n'); return 0; }
        else { c.err(`sed: unrecognized option '${a}'\nUsage: sed [OPTION]... {script-only-if-no-other-script} [input-file]...\n\n`); return 1; }
        continue;
      }
      if (a.startsWith('-') && a.length > 1) {
        for (let j = 1; j < a.length; j++) {
          const ch = a[j];
          if (ch === 'n') quiet = true;
          else if (ch === 'E' || ch === 'r') ere = true;
          else if (ch === 's') separate = true;
          else if (ch === 'z') nullData = true;
          else if (ch === 'u') { /* 무시 */ } else if (ch === 'i') { inPlace = a.slice(j + 1); break; } else if (ch === 'e' || ch === 'f' || ch === 'l') {
            const rest = a.slice(j + 1);
            const v = rest !== '' ? rest : args[++k];
            if (v == null) { c.err(`sed: option requires an argument -- '${ch}'\nUsage: sed [OPTION]... {script-only-if-no-other-script} [input-file]...\n\n`); return 1; }
            if (ch === 'e') exprs.push({ src: v, kind: 'e' }); else if (ch === 'f') exprs.push({ file: v, kind: 'f' });
            break;
          } else { c.err(`sed: invalid option -- '${ch}'\nUsage: sed [OPTION]... {script-only-if-no-other-script} [input-file]...\n\n`); return 1; }
        }
        continue;
      }
      files.push(a);
    }
    void posix;
    if (!exprs.length) {
      if (!files.length) { c.err('Usage: sed [OPTION]... {script-only-if-no-other-script} [input-file]...\n\n  -n, --quiet, --silent\n                 suppress automatic printing of pattern space\n  -e script, --expression=script\n                 add the script to the commands to be executed\n  -f script-file, --file=script-file\n                 add the contents of script-file to the commands to be executed\n  -i[SUFFIX], --in-place[=SUFFIX]\n                 edit files in place (makes backup if SUFFIX supplied)\n  -E, -r, --regexp-extended\n                 use extended regular expressions in the script\n'); return 1; }
      exprs.push({ src: files.shift(), kind: 'e' });
    }
    // 스크립트 합치기 (-e 조각 위치 기억)
    let script = '';
    const chunks = [];
    let eNo = 0;
    for (const e of exprs) {
      let src = e.src;
      if (e.kind === 'f') {
        const rd = await readOne(c, e.file);
        if (rd.err) { c.err(`sed: couldn't open file ${e.file}: ${rd.err}\n`); return 1; }
        src = rd.text.replace(/\n$/, '');
        if (!script && /^#n\n/.test(rd.text)) quiet = true;
      } else {
        eNo++;
        if (!script && /^#n(\n|$)/.test(src)) quiet = true;
      }
      chunks.push({ start: script.length + (script ? 1 : 0), len: src.length, kind: e.kind, no: eNo, file: e.file, src });
      script += (script ? '\n' : '') + src;
    }
    let prog;
    try {
      prog = sedParse(script, ere);
    } catch (e) {
      if (!(e instanceof SedErr)) throw e;
      if (e.pos < 0) { c.err(`sed: ${e.message}\n`); return 1; }
      let ch = chunks[chunks.length - 1];
      for (const k of chunks) if (e.pos <= k.start + k.len) { ch = k; break; }
      if (ch.kind === 'f') {
        const before = ch.src.slice(0, Math.max(0, e.pos - ch.start));
        c.err(`sed: file ${ch.file} line ${before.split('\n').length}: ${e.message}\n`);
      } else c.err(`sed: -e expression #${ch.no}, char ${Math.max(0, e.pos - ch.start)}: ${e.message}\n`);
      return 1;
    }
    const cmds = prog.cmds;
    // w 파일은 처음에 비운다
    const wfiles = new Map();
    for (const cm of cmds) {
      const wf = cm.name === 'w' || cm.name === 'W' ? cm.file : cm.wfile;
      if (wf && !wfiles.has(wf) && wf !== '/dev/stdout' && wf !== '/dev/stderr') {
        const er = writeOut(c, wf, '', false);
        if (er) { c.err(`sed: couldn't open file ${wf}: ${er}\n`); return 4; }
        wfiles.set(wf, '');
      }
    }
    // 입력 준비
    const inputs = [];
    let st = 0;
    const list = files.length ? files : ['-'];
    if (inPlace != null && !files.length) { c.err('sed: no input files\n'); return 1; }
    for (const fname of list) {
      if (fname === '-' && inPlace == null) { inputs.push({ name: '-', text: await c.readStdin() }); continue; }
      const abs = c.resolve(fname);
      let node;
      try { node = c.fs.stat(abs, c.cred); } catch (e) {
        c.err(`sed: can't read ${fname}: ${e.message}\n`);
        st = 2;
        continue;
      }
      if (node.t === 'd') {
        if (inPlace != null) c.err(`sed: couldn't edit ${fname}: not a regular file\n`);
        else c.err(`sed: read error on ${fname}: Is a directory\n`);
        st = inPlace != null ? 4 : 2;
        continue;
      }
      try { inputs.push({ name: fname, abs, text: c.fs.readFile(abs, c.cred) }); } catch (e) {
        c.err(`sed: can't read ${fname}: ${e.message}\n`);
        st = 2;
      }
    }
    const sepMode = inPlace != null || separate;
    // 실행
    let hold = '';
    let quitCode = null;
    let lastRe = null;
    const groups = sepMode ? inputs.map((x) => [x]) : [inputs];
    const t0 = Date.now();
    const NL = nullData ? '\0' : '\n';
    for (const grp of groups) {
      if (quitCode != null) break;
      // 줄 목록 만들기
      const lines = [];
      let lastNoNl = false;
      grp.forEach((inp) => {
        const ls = inp.text.split(NL);
        const noNl = !inp.text.endsWith(NL);
        if (!noNl) ls.pop();
        if (inp.text === '') return;
        ls.forEach((l) => lines.push({ l, file: inp.name }));
        lastNoNl = noNl;
      });
      let outBuf = '';
      const emit = (s) => { outBuf += s; };
      let pos = 0;
      let lineNo = 0;
      let ps = null;
      let append = [];
      let tflag = false;
      for (const cm of cmds) { cm.active = !!cm.zero; cm.end = cm.name === '{' ? cm.end : cm.end; }
      const readNext = () => {
        if (pos >= lines.length) return null;
        lineNo++;
        return lines[pos++];
      };
      const isLast = () => pos >= lines.length;
      const flushAppend = () => {
        for (const a of append) {
          if (a.text != null) emit(a.text + '\n');
          else if (a.rfile) {
            try { const t = c.fs.readFile(c.resolve(a.rfile), c.cred); emit(t); } catch (e) { /* 없는 파일은 무시 */ }
          }
        }
        append = [];
      };
      const nl = (atEnd) => (atEnd && lastNoNl && isLast() ? '' : NL);
      const testRe = (a) => {
        let rx = a;
        if (a.empty) { if (!lastRe) throw new Error('no previous regular expression'); rx = lastRe; } else lastRe = a;
        return rx.re.test(ps);
      };
      const one = (a) => {
        if (a.t === 'line') return lineNo === a.n;
        if (a.t === 'last') return isLast();
        if (a.t === 'step') return a.step <= 0 ? lineNo === a.first : lineNo >= a.first && (lineNo - a.first) % a.step === 0;
        if (a.t === 're') return testRe(a);
        return false;
      };
      const matchAddr = (cm) => {
        if (!cm.a1) return true;
        if (!cm.a2) return one(cm.a1);
        if (cm.active) {
          const a2 = cm.a2;
          if (a2.t === 're') { if (testRe(a2)) cm.active = false; return true; }
          if (a2.t === 'last') { if (isLast()) cm.active = false; return true; }
          if (lineNo >= cm.rend) cm.active = false;
          return true;
        }
        if (!one(cm.a1)) return false;
        const a2 = cm.a2;
        if (a2.t === 'line') { if (a2.n > lineNo) { cm.active = true; cm.rend = a2.n; } return true; }
        if (a2.t === 'plus') { if (a2.n > 0) { cm.active = true; cm.rend = lineNo + a2.n; } return true; }
        if (a2.t === 'mult') { if (a2.n > 0 && lineNo % a2.n) { cm.active = true; cm.rend = Math.ceil(lineNo / a2.n) * a2.n; } return true; }
        if (a2.t === 'last') { if (!isLast()) cm.active = true; return true; }
        cm.active = true;
        return true;
      };
      const wr = (file, text) => {
        if (file === '/dev/stdout') { emit(text); return; }
        if (file === '/dev/stderr') { c.err(text); return; }
        wfiles.set(file, (wfiles.get(file) || '') + text);
      };
      let restartNoRead = false;
      let steps = 0;
      cycle: for (;;) {
        if (!restartNoRead) {
          const nx = readNext();
          if (!nx) break;
          ps = nx.l;
          tflag = false;
        }
        restartNoRead = false;
        let pc = 0;
        let autoPrint = !quiet;
        let endMode = 'normal';
        while (pc < cmds.length) {
          if (++steps % 200000 === 0) {
            // 오래 걸리면 화면이 멈추지 않게 양보하고 (Ctrl+C 가능), 너무 길면 중단
            if (!c.session.headless) await c.sleep(0);
            if (Date.now() - t0 > (c.session.headless ? 5000 : 30000)) {
              c.err('sed: 실행 시간이 너무 길어 중단했습니다 (가상 터미널 제한)\n');
              if (outBuf) c.out(outBuf);
              return 4;
            }
          }
          const cm = cmds[pc];
          if (cm.name === '}' || cm.name === ':') { pc++; continue; }
          let hit;
          try { hit = matchAddr(cm) !== cm.neg; } catch (e) { c.err(`sed: ${e.message}\n`); return 1; }
          if (!hit) { pc = cm.name === '{' ? cm.end + 1 : pc + 1; continue; }
          pc++;
          switch (cm.name) {
            case '{': break;
            case '=': emit(lineNo + '\n'); break;
            case 'a': append.push({ text: cm.text }); break;
            case 'i': emit(cm.text + '\n'); break;
            case 'c':
              if (!cm.a2 || !cm.active || cm.neg) emit(cm.text + '\n');
              endMode = 'delete';
              break;
            case 'b': pc = cm.label ? prog.labels[cm.label] : cmds.length; break;
            case 't': if (tflag) { tflag = false; pc = cm.label ? prog.labels[cm.label] : cmds.length; } break;
            case 'T': if (!tflag) pc = cm.label ? prog.labels[cm.label] : cmds.length; else tflag = false; break;
            case 'd': endMode = 'delete'; break;
            case 'D': {
              const k = ps.indexOf('\n');
              if (k < 0) { endMode = 'delete'; break; }
              ps = ps.slice(k + 1);
              endMode = 'restart';
              break;
            }
            case 'g': ps = hold; break;
            case 'G': ps += '\n' + hold; break;
            case 'h': hold = ps; break;
            case 'H': hold += '\n' + ps; break;
            case 'x': { const t = ps; ps = hold; hold = t; break; }
            case 'z': ps = ''; break;
            case 'F': emit((lines[pos - 1] ? lines[pos - 1].file : '-') + '\n'); break;
            case 'l': emit(sedL(ps, cm.num)); break;
            case 'L': break;
            case 'p': emit(ps + NL); break;
            case 'P': { const k = ps.indexOf('\n'); emit((k < 0 ? ps : ps.slice(0, k)) + NL); break; }
            case 'n': {
              if (isLast()) { endMode = posix ? 'quitNow' : 'quitAfter'; break; }
              if (!quiet) emit(ps + NL);
              flushAppend();
              ps = readNext().l;
              break;
            }
            case 'N': {
              if (isLast()) { endMode = 'quitAfter'; break; }
              flushAppend();
              ps += '\n' + readNext().l;
              break;
            }
            case 'q': quitCode = cm.num || 0; endMode = 'quit'; break;
            case 'Q': quitCode = cm.num || 0; endMode = 'quitNow'; break;
            case 'r': append.push({ rfile: cm.file }); break;
            case 'R': break;
            case 'w': wr(cm.file, ps + NL); break;
            case 'W': { const k = ps.indexOf('\n'); wr(cm.file, (k < 0 ? ps : ps.slice(0, k)) + '\n'); break; }
            case 'y': ps = Array.from(ps, (ch) => (cm.map.has(ch) ? cm.map.get(ch) : ch)).join(''); break;
            case 's': {
              let rx = cm.rx;
              if (rx.empty) { if (!lastRe) { c.err('sed: no previous regular expression\n'); return 1; } rx = lastRe; } else lastRe = rx;
              const reG = rx.reG;
              reG.lastIndex = 0;
              let m;
              let cnt = 0;
              let res = '';
              let last = 0;
              let did = false;
              let prevEnd = -1;
              while ((m = reG.exec(ps)) !== null) {
                const start = m.index;
                const end = start + m[0].length;
                if (m[0] === '' && start === prevEnd) { reG.lastIndex++; continue; }
                cnt++;
                if ((!cm.nth || cnt >= cm.nth) && (cm.g || !cm.nth || cnt === cm.nth)) {
                  res += ps.slice(last, start) + sedRepApply(cm.rep, m);
                  last = end;
                  did = true;
                  if (!cm.g) break;
                }
                prevEnd = end;
                if (m[0] === '') reG.lastIndex++;
                if (reG.lastIndex > ps.length) break;
              }
              if (did) {
                ps = res + ps.slice(last);
                tflag = true;
                for (let k = 0; k < cm.p; k++) emit(ps + NL);
                if (cm.wfile) wr(cm.wfile, ps + NL);
              }
              break;
            }
            default: break;
          }
          if (endMode !== 'normal') break;
        }
        if (endMode === 'quitNow') { break cycle; }
        if (endMode === 'restart') {
          if (autoPrint) emit(ps + nl(true));
          flushAppend();
          restartNoRead = true;
          continue;
        }
        if (endMode !== 'delete' && autoPrint) emit(ps + nl(true));
        flushAppend();
        if (endMode === 'quit' || endMode === 'quitAfter') break cycle;
      }
      // 결과 내보내기
      if (inPlace != null && grp[0]) {
        const inp = grp[0];
        if (inPlace) {
          const bname = inPlace.includes('*') ? inPlace.replace(/\*/g, P().basename(inp.abs)) : P().basename(inp.abs) + inPlace;
          const babs = inPlace.includes('/') ? c.resolve(bname) : P().dirname(inp.abs) + '/' + bname;
          try { c.fs.writeFile(babs, inp.text, c.cred); } catch (e) { c.err(`sed: cannot rename ${inp.name}: ${e.message}\n`); st = 4; continue; }
        }
        try {
          c.fs.writeFile(inp.abs, outBuf, c.cred);
        } catch (e) {
          // 디렉터리에 쓰기 권한이 있으면 실제 sed 처럼 파일을 새로 만든다
          const dir = c.fs.lookup(P().dirname(inp.abs));
          if (e.code === 'EACCES' && dir && c.fs.perm(dir, c.cred, 2) && c.fs.perm(dir, c.cred, 1)) {
            c.fs.writeFile(inp.abs, outBuf, null);
            const nd = c.fs.lookup(inp.abs);
            if (nd) { nd.u = c.cred.uid; nd.g = c.cred.gid; }
          } else {
            c.err(`sed: couldn't open temporary file ${P().dirname(inp.name) === '.' ? './' : P().dirname(inp.name) + '/'}sed${Math.random().toString(36).slice(2, 8)}: ${e.message}\n`);
            st = 4;
          }
        }
      } else if (outBuf) c.out(outBuf);
    }
    for (const [wf, text] of wfiles) if (text) writeOut(c, wf, text, false);
    return quitCode != null ? quitCode : st;
  });

  // ======================================================================= awk (mawk 호환 인터프리터)
  class AwkSyntax extends Error {}
  class AwkRunErr extends Error {}
  class AwkNeed { constructor(key, kind, cmd) { this.key = key; this.kind = kind; this.cmd = cmd; } }
  const BRK = { brk: 1 }, CONT = { cont: 1 }, NEXT = { next: 1 }, NEXTFILE = { nextfile: 1 };
  class ExitSig { constructor(code) { this.code = code; } }
  class RetSig { constructor(v) { this.v = v; } }
  /** 숫자처럼 보이는 문자열 (필드 · 입력값) */
  class SN { constructor(s, n) { this.s = s; this.n = n; } }
  const NUMRE = /^[ \t\n]*[-+]?(?:\d+\.?\d*(?:[eE][-+]?\d+)?|\.\d+(?:[eE][-+]?\d+)?)[ \t\n]*$/;
  const strnum = (s) => (NUMRE.test(s) ? new SN(s, parseFloat(s)) : s);
  const LEADNUM = /^[ \t\n]*[-+]?(?:\d+\.?\d*(?:[eE][-+]?\d+)?|\.\d+(?:[eE][-+]?\d+)?)/;
  const strToNum = (s) => { const m = LEADNUM.exec(s); return m ? parseFloat(m[0]) : 0; };

  const AWK_KW = new Set(['BEGIN', 'END', 'function', 'func', 'if', 'else', 'while', 'for', 'do', 'break', 'continue', 'next', 'nextfile', 'exit', 'return', 'delete', 'in', 'getline', 'print', 'printf']);
  const AWK_BI = new Set(['length', 'substr', 'index', 'split', 'sub', 'gsub', 'match', 'sprintf', 'tolower', 'toupper', 'int', 'sqrt', 'exp', 'log', 'sin', 'cos', 'atan2', 'rand', 'srand', 'system', 'close', 'fflush']);
  const LVT = ['var', 'lvar', 'idx', 'field'];
  const AWK_ARITY = {
    length: [0, 1], substr: [2, 3], index: [2, 2], split: [2, 3], sub: [2, 3], gsub: [2, 3], match: [2, 3], sprintf: [1, 255],
    tolower: [1, 1], toupper: [1, 1], int: [1, 1], sqrt: [1, 1], exp: [1, 1], log: [1, 1], sin: [1, 1], cos: [1, 1], atan2: [2, 2],
    rand: [0, 0], srand: [0, 1], system: [1, 1], close: [1, 2], fflush: [0, 1]
  };

  /** 문자열 이스케이프 처리 (awk 문자열 · -v 값) */
  function awkUnesc(s) {
    return s.replace(/\\([0-7]{1,3}|[^])/g, (m, d) => {
      if (/^[0-7]/.test(d)) return String.fromCharCode(parseInt(d, 8));
      const map = { n: '\n', t: '\t', r: '\r', '\\': '\\', '"': '"', '/': '/', a: '\x07', b: '\b', f: '\f', v: '\v' };
      return d in map ? map[d] : '\\' + d;
    });
  }

  function awkLex(src) {
    const toks = [];
    let i = 0;
    let line = 1;
    const n = src.length;
    const push = (t, v, raw) => toks.push({ t, v, raw: raw != null ? raw : v, line });
    const operand = () => {
      const p = toks[toks.length - 1];
      if (!p) return false;
      return ['num', 'str', 'ere', 'name', 'bi', ')', ']', '$', 'incr', 'decr'].includes(p.t) || (p.t === 'kw' && p.v === 'getline');
    };
    while (i < n) {
      const ch = src[i];
      if (ch === '\\' && src[i + 1] === '\n') { i += 2; line++; continue; }
      if (ch === '\\' && src[i + 1] === '\r' && src[i + 2] === '\n') { i += 3; line++; continue; }
      if (ch === ' ' || ch === '\t' || ch === '\r') { i++; continue; }
      if (ch === '\n') { push('nl', '\n', 'end of line'); line++; i++; continue; }
      if (ch === '#') { while (i < n && src[i] !== '\n') i++; continue; }
      if (/\d/.test(ch) || (ch === '.' && /\d/.test(src[i + 1]))) {
        const m = /^(?:0[xX][0-9a-fA-F]+|\d*\.?\d*(?:[eE][-+]?\d+)?)/.exec(src.slice(i, i + 64));
        push('num', /^0[xX]/.test(m[0]) ? parseInt(m[0], 16) : parseFloat(m[0]), m[0]);
        i += m[0].length;
        continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i, i + 256));
        const w = m[0];
        i += w.length;
        if (AWK_KW.has(w)) push('kw', w === 'func' ? 'function' : w, w);
        else if (AWK_BI.has(w)) push('bi', w);
        else if (src[i] === '(') push('func', w);
        else push('name', w);
        continue;
      }
      if (ch === '"') {
        let s = '';
        i++;
        for (;;) {
          if (i >= n || src[i] === '\n') throw new AwkSyntax(`line ${line}: runaway string constant "${s.slice(0, 10)} ...`);
          const d = src[i];
          if (d === '\\' && i + 1 < n) {
            if (src[i + 1] === '\n') { i += 2; line++; continue; }
            s += d + src[i + 1];
            i += 2;
            continue;
          }
          if (d === '"') { i++; break; }
          s += d;
          i++;
        }
        push('str', awkUnesc(s), '"' + s + '"');
        continue;
      }
      if (ch === '/' && !operand()) {
        let s = '';
        i++;
        let inBr = false;
        for (;;) {
          if (i >= n || src[i] === '\n') throw new AwkSyntax(`line ${line}: runaway regular expression /${s.slice(0, 10)} ...`);
          const d = src[i];
          if (d === '\\' && i + 1 < n) {
            if (src[i + 1] === '/') { s += '/'; i += 2; continue; }
            s += d + src[i + 1];
            i += 2;
            continue;
          }
          if (d === '[' && !inBr) { inBr = true; s += d; i++; if (src[i] === '^') { s += '^'; i++; } if (src[i] === ']') { s += ']'; i++; } continue; }
          if (d === ']' && inBr) { inBr = false; s += d; i++; continue; }
          if (d === '/' && !inBr) { i++; break; }
          s += d;
          i++;
        }
        push('ere', s, '/' + s + '/');
        continue;
      }
      const three = src.substr(i, 3);
      const two = src.substr(i, 2);
      if (three === '**=') { push('^=', '^=', '**='); i += 3; continue; }
      if (['+=', '-=', '*=', '/=', '%=', '^=', '==', '<=', '>=', '!=', '&&', '||', '>>', '!~', '**'].includes(two)) {
        push(two === '**' ? '^' : two, two);
        i += 2;
        continue;
      }
      if (two === '++') { push('incr', '++'); i += 2; continue; }
      if (two === '--') { push('decr', '--'); i += 2; continue; }
      if ('{}()[];,+-*/%^!><|?:~$='.includes(ch)) { push(ch, ch); i++; continue; }
      throw new AwkSyntax(`line ${line}: syntax error at or near ${ch}`);
    }
    push('eof', '', 'end of file');
    return toks;
  }

  class AwkParser {
    constructor(toks) {
      this.toks = toks;
      this.p = 0;
      this.funcs = {};
      this.begin = [];
      this.end = [];
      this.rules = [];
      this.params = null;
      this.usesGetline = false;
      this.calls = [];
    }
    get tk() { return this.toks[this.p]; }
    peek(k = 1) { return this.toks[this.p + k] || this.toks[this.toks.length - 1]; }
    is(t, v) { const x = this.tk; return x.t === t && (v === undefined || x.v === v); }
    isKw(v) { return this.tk.t === 'kw' && this.tk.v === v; }
    fail(tok) {
      const x = tok || this.tk;
      throw new AwkSyntax(`line ${x.line}: syntax error at or near ${x.t === 'eof' ? 'end of file' : x.raw}`);
    }
    eat(t, v) { if (!this.is(t, v)) this.fail(); return this.toks[this.p++]; }
    nls() { while (this.tk.t === 'nl') this.p++; }
    terms() { while (this.tk.t === 'nl' || this.tk.t === ';') this.p++; }

    program() {
      this.terms();
      while (!this.is('eof')) {
        if (this.isKw('function')) this.funcDef();
        else if (this.isKw('BEGIN')) { this.p++; this.nls(); this.begin.push(this.block()); }
        else if (this.isKw('END')) { this.p++; this.nls(); this.end.push(this.block()); }
        else {
          const rule = { pat: null, pat2: null, body: null };
          if (!this.is('{')) {
            rule.pat = this.expr();
            if (this.is(',')) { this.p++; this.nls(); rule.pat2 = this.expr(); }
          }
          if (this.is('{')) rule.body = this.block();
          this.rules.push(rule);
        }
        if (!this.is('eof') && !this.is('nl') && !this.is(';')) {
          if (this.toks[this.p - 1].t !== '}') this.fail();
        }
        this.terms();
      }
      for (const cl of this.calls) if (!this.funcs[cl.name]) throw new AwkSyntax(`line ${cl.tok.line}: function ${cl.name} never defined`);
      return { funcs: this.funcs, begin: this.begin, end: this.end, rules: this.rules, usesGetline: this.usesGetline };
    }
    funcDef() {
      this.p++;
      const nameTok = this.tk;
      if (nameTok.t !== 'name' && nameTok.t !== 'func') this.fail();
      this.p++;
      this.eat('(');
      const params = [];
      this.nls();
      while (!this.is(')')) {
        params.push(this.eat('name').v);
        this.nls();
        if (this.is(',')) { this.p++; this.nls(); } else if (!this.is(')')) this.fail();
      }
      this.p++;
      this.nls();
      this.params = params;
      const body = this.block();
      this.params = null;
      this.funcs[nameTok.v] = { name: nameTok.v, params, body };
    }
    block() {
      this.eat('{');
      const stmts = [];
      this.terms();
      while (!this.is('}')) {
        if (this.is('eof')) this.fail();
        stmts.push(this.stmt());
        this.terms();
      }
      this.p++;
      return { t: 'block', stmts };
    }
    endSimple() {
      if (this.is(';') || this.is('nl')) { this.p++; return; }
      if (this.is('}') || this.is('eof')) return;
      this.fail();
    }
    body() {
      if (this.is(';')) { this.p++; return { t: 'nop' }; }
      this.nls();
      return this.stmt();
    }
    stmt() {
      const x = this.tk;
      if (x.t === '{') return this.block();
      if (x.t === ';') { this.p++; return { t: 'nop' }; }
      if (x.t === 'kw') {
        switch (x.v) {
          case 'if': {
            this.p++;
            this.eat('(');
            const cond = this.expr();
            this.eat(')');
            const then = this.body();
            const save = this.p;
            this.terms();
            if (this.isKw('else')) {
              this.p++;
              const els = this.body();
              return { t: 'if', cond, then, els };
            }
            this.p = save;
            return { t: 'if', cond, then, els: null };
          }
          case 'while': {
            this.p++;
            this.eat('(');
            const cond = this.expr();
            this.eat(')');
            return { t: 'while', cond, body: this.body() };
          }
          case 'do': {
            this.p++;
            this.nls();
            const body = this.stmt();
            this.terms();
            if (!this.isKw('while')) this.fail();
            this.p++;
            this.eat('(');
            const cond = this.expr();
            this.eat(')');
            this.endSimple();
            return { t: 'do', body, cond };
          }
          case 'for': {
            this.p++;
            this.eat('(');
            if (this.is('name') && this.peek().t === 'kw' && this.peek().v === 'in' && this.peek(2).t === 'name' && this.peek(3).t === ')') {
              const v = this.lvName(this.tk.v);
              this.p += 2;
              const arr = this.lvName(this.tk.v);
              this.p += 2;
              return { t: 'forin', v, arr, body: this.body() };
            }
            if (this.is('(') && this.peek().t === 'name' && this.peek(2).t === 'kw' && this.peek(2).v === 'in' && this.peek(3).t === 'name' && this.peek(4).t === ')' && this.peek(5).t === ')') {
              this.p++;
              const v = this.lvName(this.tk.v);
              this.p += 2;
              const arr = this.lvName(this.tk.v);
              this.p += 3;
              return { t: 'forin', v, arr, body: this.body() };
            }
            const init = this.is(';') ? null : this.simple();
            this.nls();
            this.eat(';');
            this.nls();
            const cond = this.is(';') ? null : this.expr();
            this.nls();
            this.eat(';');
            this.nls();
            const step = this.is(')') ? null : this.simple();
            this.eat(')');
            return { t: 'for', init, cond, step, body: this.body() };
          }
          default: break;
        }
      }
      const s = this.simple();
      this.endSimple();
      return s;
    }
    simple() {
      const x = this.tk;
      if (x.t === 'kw') {
        switch (x.v) {
          case 'break': this.p++; return { t: 'break' };
          case 'continue': this.p++; return { t: 'continue' };
          case 'next': this.p++; return { t: 'next' };
          case 'nextfile': this.p++; return { t: 'nextfile' };
          case 'exit': { this.p++; const e = this.atEnd() ? null : this.expr(); return { t: 'exit', e }; }
          case 'return': { this.p++; const e = this.atEnd() ? null : this.expr(); return { t: 'return', e }; }
          case 'delete': {
            this.p++;
            const nm = this.eat('name').v;
            const arr = this.lvName(nm);
            if (this.is('[')) { this.p++; const subs = this.exprList(); this.eat(']'); return { t: 'delete', arr, subs }; }
            return { t: 'delete', arr, subs: null };
          }
          case 'print': case 'printf': {
            this.p++;
            let args = [];
            if (!this.atEnd() && !this.is('>') && !this.is('>>') && !this.is('|')) {
              args = this.exprList(true);
              if (args.length === 1 && args[0].t === 'glist') args = args[0].items;
            }
            if (x.v === 'printf' && !args.length) this.fail();
            let redir = null, dest = null;
            if (this.is('>') || this.is('>>') || this.is('|')) {
              redir = this.tk.t;
              this.p++;
              dest = this.concat(true);
            }
            return { t: x.v, args, redir, dest };
          }
          default: break;
        }
      }
      return { t: 'expr', e: this.expr() };
    }
    atEnd() { return this.is(';') || this.is('nl') || this.is('}') || this.is('eof'); }
    lvName(nm) {
      if (this.params) { const k = this.params.indexOf(nm); if (k >= 0) return { t: 'lvar', i: k, name: nm }; }
      return { t: 'var', name: nm };
    }
    exprList(noGt) {
      const items = [this.expr(noGt)];
      while (this.is(',')) { this.p++; this.nls(); items.push(this.expr(noGt)); }
      return items;
    }
    expr(noGt) { return this.ternary(noGt); }
    ternary(noGt) {
      const cond = this.or(noGt);
      if (this.is('?')) {
        this.p++;
        this.nls();
        const a = this.ternary(noGt);
        this.nls();
        this.eat(':');
        this.nls();
        const b = this.ternary(noGt);
        return { t: 'cond', cond, a, b };
      }
      if (['=', '+=', '-=', '*=', '/=', '%=', '^='].includes(this.tk.t) && LVT.includes(cond.t)) {
        const op = this.tk.t;
        this.p++;
        this.nls();
        const rhs = this.ternary(noGt);
        return { t: 'assign', op, lv: cond, e: rhs };
      }
      return cond;
    }
    or(noGt) {
      let l = this.and(noGt);
      while (this.is('||')) { this.p++; this.nls(); const r = this.and(noGt); l = { t: 'or', l, r }; }
      return l;
    }
    and(noGt) {
      let l = this.inE(noGt);
      while (this.is('&&')) { this.p++; this.nls(); const r = this.inE(noGt); l = { t: 'and', l, r }; }
      return l;
    }
    inE(noGt) {
      let l = this.match(noGt);
      while (this.isKw('in')) {
        this.p++;
        const arr = this.lvName(this.eat('name').v);
        l = { t: 'in', keys: [l], arr };
      }
      return l;
    }
    match(noGt) {
      let l = this.cmp(noGt);
      while (this.is('~') || this.is('!~')) {
        const neg = this.tk.t === '!~';
        this.p++;
        const r = this.cmp(noGt);
        l = { t: 'match', l, r, neg };
      }
      return l;
    }
    cmp(noGt) {
      const l = this.pipeGet(noGt);
      const op = this.tk.t;
      if (['<', '<=', '==', '!=', '>=', '>'].includes(op) && !(noGt && op === '>')) {
        this.p++;
        const r = this.pipeGet(noGt);
        return { t: 'cmp', op, l, r };
      }
      return l;
    }
    pipeGet(noGt) {
      let l = this.concat(noGt);
      while (this.is('|') && this.peek().t === 'kw' && this.peek().v === 'getline') {
        this.p += 2;
        this.usesGetline = true;
        const lv = this.optLv();
        l = { t: 'pgetline', cmd: l, lv };
      }
      return l;
    }
    optLv() {
      if (this.is('$')) { this.p++; return { t: 'field', e: this.incdec() }; }
      if (this.is('name')) return this.primary();
      return null;
    }
    startsConcat() {
      const t = this.tk.t;
      return ['num', 'str', 'ere', 'name', 'func', 'bi', '$', '(', 'incr', 'decr'].includes(t);
    }
    concat(noGt) {
      let l = this.additive();
      while (this.startsConcat()) {
        const r = this.additive();
        l = { t: 'cat', l, r };
      }
      void noGt;
      return l;
    }
    additive() {
      let l = this.mul();
      while (this.is('+') || this.is('-')) { const op = this.tk.t; this.p++; this.nls(); const r = this.mul(); l = { t: 'bin', op, l, r }; }
      return l;
    }
    mul() {
      let l = this.unary();
      while (this.is('*') || this.is('/') || this.is('%')) { const op = this.tk.t; this.p++; this.nls(); const r = this.unary(); l = { t: 'bin', op, l, r }; }
      return l;
    }
    unary() {
      if (this.is('!')) { this.p++; return { t: 'not', e: this.unary() }; }
      if (this.is('-')) { this.p++; return { t: 'neg', e: this.unary() }; }
      if (this.is('+')) { this.p++; return { t: 'pos', e: this.unary() }; }
      return this.power();
    }
    power() {
      const base = this.postfix();
      if (this.is('^')) {
        this.p++;
        let ex;
        if (this.is('-')) { this.p++; ex = { t: 'neg', e: this.power() }; } else if (this.is('+')) { this.p++; ex = this.power(); } else ex = this.power();
        return { t: 'bin', op: '^', l: base, r: ex };
      }
      return base;
    }
    postfix() {
      const e = this.incdec();
      if ((this.is('incr') || this.is('decr')) && LVT.includes(e.t)) {
        const op = this.tk.t;
        this.p++;
        return { t: 'post', op, lv: e };
      }
      return e;
    }
    incdec() {
      if (this.is('incr') || this.is('decr')) {
        const op = this.tk.t;
        this.p++;
        const lv = this.incdec();
        if (!LVT.includes(lv.t)) this.fail();
        return { t: 'pre', op, lv };
      }
      return this.primary();
    }
    primary() {
      const x = this.tk;
      switch (x.t) {
        case 'num': this.p++; return { t: 'num', v: x.v };
        case 'str': this.p++; return { t: 'str', v: x.v };
        case 'ere': this.p++; return { t: 're', src: x.v };
        case '$': {
          this.p++;
          if (this.is('-')) { this.p++; return { t: 'field', e: { t: 'neg', e: this.incdec() } }; }
          return { t: 'field', e: this.incdec() };
        }
        case '(': {
          this.p++;
          this.nls();
          const e = this.expr();
          if (this.is(',')) {
            const items = [e];
            while (this.is(',')) { this.p++; this.nls(); items.push(this.expr()); }
            this.nls();
            this.eat(')');
            if (this.isKw('in')) {
              this.p++;
              const arr = this.lvName(this.eat('name').v);
              return { t: 'in', keys: items, arr };
            }
            return { t: 'glist', items };
          }
          this.nls();
          this.eat(')');
          return { t: 'grp', e };
        }
        case '-': this.p++; return { t: 'neg', e: this.unary() };
        case '+': this.p++; return { t: 'pos', e: this.unary() };
        case '!': this.p++; return { t: 'not', e: this.unary() };
        case 'name': {
          this.p++;
          if (this.is('[')) {
            this.p++;
            const subs = this.exprList();
            this.eat(']');
            return { t: 'idx', arr: this.lvName(x.v), subs };
          }
          return this.lvName(x.v);
        }
        case 'func': {
          this.p++;
          this.eat('(');
          const args = [];
          this.nls();
          while (!this.is(')')) {
            args.push(this.expr());
            this.nls();
            if (this.is(',')) { this.p++; this.nls(); } else if (!this.is(')')) this.fail();
          }
          this.p++;
          const node = { t: 'call', name: x.v, args, tok: x };
          this.calls.push(node);
          return node;
        }
        case 'bi': {
          this.p++;
          const args = [];
          if (this.is('(')) {
            this.p++;
            this.nls();
            while (!this.is(')')) {
              args.push(this.expr());
              this.nls();
              if (this.is(',')) { this.p++; this.nls(); } else if (!this.is(')')) this.fail();
            }
            this.p++;
          } else if (x.v !== 'length') this.fail();
          const ar = AWK_ARITY[x.v];
          if (ar && (args.length < ar[0] || args.length > ar[1])) throw new AwkSyntax(`line ${x.line}: wrong number of arguments in call to ${x.v}`);
          const arrArg = x.v === 'split' ? args[1] : x.v === 'match' ? args[2] : null;
          if (arrArg && arrArg.t !== 'var' && arrArg.t !== 'lvar') throw new AwkSyntax(`line ${x.line}: syntax error at or near )`);
          return { t: 'bi', name: x.v, args };
        }
        case 'kw':
          if (x.v === 'getline') {
            this.p++;
            this.usesGetline = true;
            const lv = this.optLv();
            let file = null;
            if (this.is('<')) { this.p++; file = this.incdec(); }
            return { t: 'getline', lv, file };
          }
          this.fail();
          break;
        default: this.fail();
      }
      return null;
    }
  }

  /** awk 실행기 (동기) — 부수 효과는 events 에 모았다가 한꺼번에 반영 */
  class AwkRT {
    constructor(prog, env) {
      this.prog = prog;
      this.env = env;
      this.events = [];
      this.outLen = 0;
      this.g = Object.create(null);
      this.rec = '';
      this.fields = null;
      this.recFS = ' ';
      this.nf = 0;
      this.reCache = new Map();
      this.readers = new Map();
      this.outFiles = new Map();
      this.pipes = new Map();
      this.callNo = 0;
      this.steps = 0;
      this.t0 = Date.now();
      this.rangeOn = prog.rules.map(() => false);
      this.prevSeed = 0;
      this.rng = env.seed >>> 0;
      this.exitCode = 0;
      this.depth = 0;
      this.usedFile = false;
      this.cur = null;
      this.argi = 1;
      const g = this.g;
      Object.assign(g, { FS: ' ', OFS: ' ', ORS: '\n', RS: '\n', NR: 0, FNR: 0, SUBSEP: '\x1c', CONVFMT: '%.6g', OFMT: '%.6g', FILENAME: '', RSTART: 0, RLENGTH: -1 });
      const envArr = new Map();
      Object.keys(env.environ || {}).forEach((k) => envArr.set(k, strnum(String(env.environ[k]))));
      g.ENVIRON = envArr;
      const av = new Map();
      env.argv.forEach((a, k) => av.set(String(k), strnum(a)));
      g.ARGV = av;
      g.ARGC = env.argv.length;
    }
    err(msg) { throw new AwkRunErr(msg); }
    tick() {
      if ((++this.steps & 0x3fff) === 0 && Date.now() - this.t0 > 5000) this.err("가상 터미널 실행 시간 제한(5초)을 넘어 중단했습니다");
    }
    emitOut(s) {
      this.outLen += s.length;
      if (this.outLen > 64 * 1024 * 1024) this.err('출력이 너무 많아 중단했습니다 (가상 터미널 제한)');
      const ev = this.events;
      const last = ev[ev.length - 1];
      if (last && last.t === 'out') last.s += s; else ev.push({ t: 'out', s });
    }
    // ------------------------------------------------ 값 변환
    num(v) {
      if (typeof v === 'number') return v;
      if (v === undefined) return 0;
      if (v instanceof SN) return v.n;
      if (typeof v === 'string') return strToNum(v);
      if (v instanceof Map) this.err("can't use array in scalar context");
      return 0;
    }
    str(v, fmt) {
      if (typeof v === 'string') return v;
      if (typeof v === 'number') {
        if (Number.isInteger(v) && Math.abs(v) < 1e16) return String(v);
        return this.fmt(fmt || this.str(this.g.CONVFMT), [v]);
      }
      if (v === undefined) return '';
      if (v instanceof SN) return v.s;
      if (v instanceof Map) this.err("can't use array in scalar context");
      return String(v);
    }
    out(v) { return typeof v === 'number' ? this.str(v, this.str(this.g.OFMT)) : this.str(v); }
    bool(v) {
      if (typeof v === 'number') return v !== 0;
      if (typeof v === 'string') return v !== '';
      if (v instanceof SN) return v.n !== 0;
      if (v instanceof Map) this.err("can't use array in scalar context");
      return false;
    }
    fmt(f, args) {
      const self = this;
      return csprintf(String(f), args, {
        num: (v) => self.num(v),
        str: (v) => self.str(v),
        chr: (v) => (typeof v === 'number' ? String.fromCodePoint(Math.max(0, Math.trunc(v)) % 0x110000) : self.str(v).charAt(0))
      });
    }
    compare(a, b) {
      const isN = (v) => typeof v === 'number' || v instanceof SN || v === undefined;
      if (isN(a) && isN(b)) { const x = this.num(a), y = this.num(b); return x < y ? -1 : x > y ? 1 : 0; }
      const x = this.str(a), y = this.str(b);
      return x < y ? -1 : x > y ? 1 : 0;
    }
    regex(src) {
      let r = this.reCache.get(src);
      if (!r) {
        try { r = mkRe(noCap(posixRe(src, { ere: true, awk: true })), ''); } catch (e) {
          const msg = e instanceof ReErr ? e.message : 'bad regular expression';
          this.err(`regular expression compile failed (${msg})\n${src}`);
        }
        if (this.reCache.size > 500) this.reCache.clear();
        this.reCache.set(src, r);
      }
      return r;
    }
    reOf(node, frame) {
      if (node.t === 're') return this.regex(node.src);
      return this.regex(this.str(this.ev(node, frame)));
    }
    // ------------------------------------------------ 레코드 · 필드
    setRec(s) { this.rec = s; this.fields = null; this.recFS = this.g.FS; }
    split() {
      if (this.fields) return;
      this.fields = this.splitStr(this.rec, this.recFS, this.str(this.g.RS) === '');
      this.nf = this.fields.length;
    }
    splitStr(s, fs, para) {
      fs = this.str(fs);
      if (fs === ' ') { const t = s.replace(/^[ \t\n]+|[ \t\n]+$/g, ''); return t === '' ? [] : t.split(/[ \t\n]+/); }
      if (s === '') return [];
      if (fs === '') return Array.from(s);
      let parts;
      if (fs.length === 1 && fs !== '\\') parts = s.split(fs);
      else parts = s.split(new RegExp(this.regex(fs).source, 'g'));
      if (para) parts = parts.flatMap((p) => p.split('\n'));
      return parts;
    }
    getField(i) {
      i = Math.trunc(i);
      if (i < 0) this.err(`negative field index $${i}`);
      if (i === 0) return strnum(this.rec);
      this.split();
      if (i > this.nf) return undefined;
      const v = this.fields[i - 1];
      return typeof v === 'string' ? strnum(v) : v;
    }
    setField(i, v) {
      i = Math.trunc(i);
      if (i < 0) this.err(`negative field index $${i}`);
      if (i === 0) { this.setRec(this.str(v)); return; }
      if (i > 32767) this.err(`$${i} exceeds maximum field(32767)`);
      this.split();
      while (this.nf < i) { this.fields.push(''); this.nf++; }
      this.fields[i - 1] = v instanceof SN ? v.s : v === undefined ? '' : v;
      this.rebuild();
    }
    rebuild() {
      const ofs = this.str(this.g.OFS);
      this.rec = this.fields.slice(0, this.nf).map((x) => (typeof x === 'string' ? x : this.str(x))).join(ofs);
    }
    setNF(n) {
      this.split();
      n = Math.trunc(n);
      if (n < 0) n = 0;
      while (this.fields.length < n) this.fields.push('');
      this.fields.length = n;
      this.nf = n;
      this.rebuild();
    }
    // ------------------------------------------------ 변수
    getVar(name) {
      if (name === 'NF') { this.split(); return this.nf; }
      return this.g[name];
    }
    setVar(name, v) {
      if (name === 'NF') { this.setNF(this.num(v)); return; }
      if (this.g[name] instanceof Map) this.err(`can't assign to ${name}; it's an array name.`);
      this.g[name] = v;
    }
    arrOf(node, frame) {
      if (node.t === 'lvar') {
        let a = frame.vals[node.i];
        if (a === undefined) { a = new Map(); frame.vals[node.i] = a; }
        if (!(a instanceof Map)) this.err(`can't use scalar ${node.name} as array`);
        return a;
      }
      let a = this.g[node.name];
      if (a === undefined) { a = new Map(); this.g[node.name] = a; }
      if (!(a instanceof Map)) this.err(`can't use scalar ${node.name} as array`);
      return a;
    }
    subKey(v) { return typeof v === 'number' && Number.isInteger(v) ? String(v) : this.str(v); }
    key(subs, frame) {
      if (subs.length === 1) return this.subKey(this.ev(subs[0], frame));
      return subs.map((s) => this.subKey(this.ev(s, frame))).join(this.str(this.g.SUBSEP));
    }
    assign(lv, v, frame) {
      if (v instanceof Map) this.err("can't assign array");
      switch (lv.t) {
        case 'var': this.setVar(lv.name, v); break;
        case 'lvar': if (frame.vals[lv.i] instanceof Map) this.err(`can't assign to ${lv.name}; it's an array name.`); frame.vals[lv.i] = v; break;
        case 'idx': { const arr = this.arrOf(lv.arr, frame); arr.set(this.key(lv.subs, frame), v); break; }
        case 'field': this.setField(this.num(this.ev(lv.e, frame)), v); break;
        default: this.err('invalid assignment');
      }
      return v;
    }
    // ------------------------------------------------ 입력
    nextFrom(rd) {
      const RS = this.str(this.g.RS);
      const t = rd.text;
      if (rd.pos >= t.length) return null;
      if (RS.length === 1) {
        const j = t.indexOf(RS, rd.pos);
        let r;
        if (j < 0) { r = t.slice(rd.pos); rd.pos = t.length; } else { r = t.slice(rd.pos, j); rd.pos = j + 1; }
        return r;
      }
      if (RS === '') {
        let p = rd.pos;
        while (p < t.length && t[p] === '\n') p++;
        if (p >= t.length) { rd.pos = t.length; return null; }
        const m = /\n\n+/g;
        m.lastIndex = p;
        const r = m.exec(t);
        if (!r) { rd.pos = t.length; return t.slice(p).replace(/\n+$/, ''); }
        rd.pos = r.index + r[0].length;
        return t.slice(p, r.index);
      }
      const re = new RegExp(this.regex(RS).source, 'g');
      re.lastIndex = rd.pos;
      let r = re.exec(t);
      while (r && r[0] === '') { re.lastIndex++; if (re.lastIndex > t.length) { r = null; break; } r = re.exec(t); }
      if (!r) { const s = t.slice(rd.pos); rd.pos = t.length; return s; }
      const s = t.slice(rd.pos, r.index);
      rd.pos = r.index + r[0].length;
      return s;
    }
    /** 주 입력의 다음 레코드 (ARGV 차례로) */
    nextMain() {
      for (let guard = 0; guard < 100000; guard++) {
        if (!this.cur) {
          if (this.eofMain) return null;
          const argc = Math.trunc(this.num(this.g.ARGC));
          let found = null;
          while (this.argi < argc) {
            const a = this.g.ARGV.get(String(this.argi++));
            const s = a === undefined ? '' : this.str(a);
            if (s === '') continue;
            const m = /^([A-Za-z_][A-Za-z0-9_]*)=([^]*)$/.exec(s);
            if (m) { this.setVar(m[1], strnum(awkUnesc(m[2]))); continue; }
            found = s;
            break;
          }
          if (found == null) {
            if (this.usedFile) { this.eofMain = true; return null; }
            found = '-';
          }
          this.usedFile = true;
          if (found === '-' || found === '/dev/stdin') this.cur = { text: this.env.stdinText || '', pos: 0, name: found === '-' ? '' : found };
          else {
            const rd = this.env.readFile(found);
            if (rd.err) this.err(`cannot open ${found} (${rd.err})`);
            this.cur = { text: rd.text, pos: 0, name: found };
          }
          this.g.FILENAME = this.cur.name;
          this.g.FNR = 0;
        }
        const r = this.nextFrom(this.cur);
        if (r == null) { this.cur = null; continue; }
        this.g.NR = this.num(this.g.NR) + 1;
        this.g.FNR = this.num(this.g.FNR) + 1;
        return r;
      }
      return null;
    }
    readerFor(name, kind) {
      const key = kind + ':' + name;
      let rd = this.readers.get(key);
      if (!rd) {
        if (kind === 'cmd') {
          this.closeAll();
          const ck = 'cmd#' + (this.callNo++) + ':' + name;
          const res = this.env.cache.get(ck);
          if (!res) throw new AwkNeed(ck, 'cmd', name);
          rd = { text: res.out, pos: 0 };
        } else if (name === '-' || name === '/dev/stdin') rd = { text: this.env.stdinText || '', pos: 0 };
        else {
          // 아직 반영하지 않은 이 파일로의 출력도 합쳐서 읽는다
          const r = this.env.readFile(name);
          let text = r.err ? null : r.text;
          const abs = this.env.resolve(name);
          for (let k = this.env.applied; k < this.events.length; k++) {
            const ev = this.events[k];
            if (ev.t === 'file' && this.env.resolve(ev.path) === abs) text = ev.trunc ? ev.s : (text || '') + ev.s;
          }
          if (text == null) return null;
          rd = { text, pos: 0 };
        }
        this.readers.set(key, rd);
      }
      return rd;
    }
    // ------------------------------------------------ 출력
    printTo(redir, dest, s) {
      if (!redir) { this.emitOut(s); return; }
      this.outLen += s.length;
      if (this.outLen > 64 * 1024 * 1024) this.err('출력이 너무 많아 중단했습니다 (가상 터미널 제한)');
      if (redir === '|') {
        let p = this.pipes.get(dest);
        if (!p) { p = { s: '' }; this.pipes.set(dest, p); }
        p.s += s;
        return;
      }
      if (dest === '/dev/stdout' || dest === '-') { this.emitOut(s); return; }
      if (dest === '/dev/stderr') { this.events.push({ t: 'err', s }); return; }
      const ev = this.events;
      if (!this.outFiles.has(dest)) {
        this.outFiles.set(dest, true);
        ev.push({ t: 'file', path: dest, trunc: redir === '>', s });
        return;
      }
      const last = ev[ev.length - 1];
      if (last && last.t === 'file' && last.path === dest) last.s += s; else ev.push({ t: 'file', path: dest, trunc: false, s });
    }
    closeStream(name) {
      let r = -1;
      if (this.outFiles.has(name)) { this.outFiles.delete(name); r = 0; }
      if (this.pipes.has(name)) { this.events.push({ t: 'pipe', cmd: name, s: this.pipes.get(name).s }); this.pipes.delete(name); r = 0; }
      if (this.readers.has('file:' + name)) { this.readers.delete('file:' + name); r = 0; }
      if (this.readers.has('cmd:' + name)) { this.readers.delete('cmd:' + name); r = 0; }
      return r;
    }
    closeAll() {
      for (const [cmd, p] of this.pipes) this.events.push({ t: 'pipe', cmd, s: p.s });
      this.pipes.clear();
    }
    // ------------------------------------------------ 실행
    run() {
      const pr = this.prog;
      try {
        try {
          for (const b of pr.begin) this.exec(b, null);
          if (pr.rules.length || pr.end.length) {
            for (;;) {
              const r = this.nextMain();
              if (r == null) break;
              this.setRec(r);
              try {
                this.rules();
              } catch (e) {
                if (e === NEXT) continue;
                if (e === NEXTFILE) { this.cur = null; continue; }
                throw e;
              }
            }
          }
        } catch (e) {
          if (!(e instanceof ExitSig)) throw e;
          this.exitCode = e.code;
        }
        try {
          for (const b of pr.end) this.exec(b, null);
        } catch (e) {
          if (!(e instanceof ExitSig)) throw e;
          this.exitCode = e.code;
        }
      } catch (e) {
        if (e === NEXT || e === NEXTFILE) this.err('improper use of next');
        if (e === BRK || e === CONT) this.err('break or continue outside a loop');
        if (e instanceof RetSig) this.err('return outside function body');
        throw e;
      }
      this.closeAll();
    }
    rules() {
      const rs = this.prog.rules;
      for (let k = 0; k < rs.length; k++) {
        const r = rs[k];
        let hit;
        if (!r.pat) hit = true;
        else if (r.pat2) {
          if (!this.rangeOn[k]) {
            if (this.bool(this.ev(r.pat, null))) { hit = true; this.rangeOn[k] = !this.bool(this.ev(r.pat2, null)); } else hit = false;
          } else { hit = true; if (this.bool(this.ev(r.pat2, null))) this.rangeOn[k] = false; }
        } else hit = this.bool(this.ev(r.pat, null));
        if (!hit) continue;
        if (r.body) this.exec(r.body, null);
        else this.emitOut(this.rec + this.str(this.g.ORS));
      }
    }
    exec(s, frame) {
      this.tick();
      switch (s.t) {
        case 'block': for (const x of s.stmts) this.exec(x, frame); return;
        case 'nop': return;
        case 'expr': this.ev(s.e, frame); return;
        case 'print': {
          let text;
          if (!s.args.length) text = this.rec;
          else text = s.args.map((a) => this.out(this.ev(a, frame))).join(this.str(this.g.OFS));
          text += this.str(this.g.ORS);
          this.printTo(s.redir, s.redir ? this.str(this.ev(s.dest, frame)) : null, text);
          return;
        }
        case 'printf': {
          const vals = s.args.map((a) => this.ev(a, frame));
          const text = this.fmt(this.str(vals[0]), vals.slice(1));
          this.printTo(s.redir, s.redir ? this.str(this.ev(s.dest, frame)) : null, text);
          return;
        }
        case 'if':
          if (this.bool(this.ev(s.cond, frame))) this.exec(s.then, frame);
          else if (s.els) this.exec(s.els, frame);
          return;
        case 'while':
          while (this.bool(this.ev(s.cond, frame))) {
            try { this.exec(s.body, frame); } catch (e) { if (e === BRK) break; if (e === CONT) continue; throw e; }
          }
          return;
        case 'do':
          do {
            try { this.exec(s.body, frame); } catch (e) { if (e === BRK) break; if (e === CONT) continue; throw e; }
          } while (this.bool(this.ev(s.cond, frame)));
          return;
        case 'for':
          if (s.init) this.exec(s.init, frame);
          while (!s.cond || this.bool(this.ev(s.cond, frame))) {
            try { this.exec(s.body, frame); } catch (e) { if (e === BRK) break; if (e !== CONT) throw e; }
            if (s.step) this.exec(s.step, frame);
          }
          return;
        case 'forin': {
          const arr = this.arrOf(s.arr, frame);
          for (const k of Array.from(arr.keys())) {
            if (!arr.has(k)) continue;
            this.assign(s.v, strnum(k), frame);
            try { this.exec(s.body, frame); } catch (e) { if (e === BRK) break; if (e === CONT) continue; throw e; }
          }
          return;
        }
        case 'break': throw BRK;
        case 'continue': throw CONT;
        case 'next': throw NEXT;
        case 'nextfile': throw NEXTFILE;
        case 'exit': throw new ExitSig(s.e ? Math.trunc(this.num(this.ev(s.e, frame))) & 255 : this.exitCode);
        case 'return': throw new RetSig(s.e ? this.ev(s.e, frame) : undefined);
        case 'delete': {
          const arr = this.arrOf(s.arr, frame);
          if (s.subs) arr.delete(this.key(s.subs, frame)); else arr.clear();
          return;
        }
        default: this.err('unknown statement ' + s.t);
      }
    }
    ev(e, frame) {
      switch (e.t) {
        case 'num': return e.v;
        case 'str': return e.v;
        case 're': return this.regex(e.src).test(this.rec) ? 1 : 0;
        case 'grp': return this.ev(e.e, frame);
        case 'glist': return this.str(this.ev(e.items[0], frame)) + e.items.slice(1).map((x) => this.str(this.g.SUBSEP) + this.str(this.ev(x, frame))).join('');
        case 'var': return this.getVar(e.name);
        case 'lvar': return frame.vals[e.i];
        case 'field': return this.getField(this.num(this.ev(e.e, frame)));
        case 'idx': {
          const arr = this.arrOf(e.arr, frame);
          const k = this.key(e.subs, frame);
          if (!arr.has(k)) { arr.set(k, undefined); return undefined; }
          return arr.get(k);
        }
        case 'in': return this.arrOf(e.arr, frame).has(this.key(e.keys, frame)) ? 1 : 0;
        case 'assign': {
          if (e.op === '=') return this.assign(e.lv, this.ev(e.e, frame), frame);
          const cur = this.num(this.ev(e.lv, frame));
          const r = this.num(this.ev(e.e, frame));
          return this.assign(e.lv, this.arith(e.op[0], cur, r), frame);
        }
        case 'cond': return this.bool(this.ev(e.cond, frame)) ? this.ev(e.a, frame) : this.ev(e.b, frame);
        case 'or': return this.bool(this.ev(e.l, frame)) || this.bool(this.ev(e.r, frame)) ? 1 : 0;
        case 'and': return this.bool(this.ev(e.l, frame)) && this.bool(this.ev(e.r, frame)) ? 1 : 0;
        case 'not': return this.bool(this.ev(e.e, frame)) ? 0 : 1;
        case 'neg': return -this.num(this.ev(e.e, frame));
        case 'pos': return +this.num(this.ev(e.e, frame));
        case 'match': {
          const s = this.str(this.ev(e.l, frame));
          return (this.reOf(e.r, frame).test(s) !== e.neg) ? 1 : 0;
        }
        case 'cmp': {
          const c = this.compare(this.ev(e.l, frame), this.ev(e.r, frame));
          switch (e.op) {
            case '<': return c < 0 ? 1 : 0;
            case '<=': return c <= 0 ? 1 : 0;
            case '>': return c > 0 ? 1 : 0;
            case '>=': return c >= 0 ? 1 : 0;
            case '==': return c === 0 ? 1 : 0;
            default: return c !== 0 ? 1 : 0;
          }
        }
        case 'cat': return this.str(this.ev(e.l, frame)) + this.str(this.ev(e.r, frame));
        case 'bin': return this.arith(e.op, this.num(this.ev(e.l, frame)), this.num(this.ev(e.r, frame)));
        case 'pre': return this.assign(e.lv, this.num(this.ev(e.lv, frame)) + (e.op === 'incr' ? 1 : -1), frame);
        case 'post': {
          const v = this.num(this.ev(e.lv, frame));
          this.assign(e.lv, v + (e.op === 'incr' ? 1 : -1), frame);
          return v;
        }
        case 'call': return this.call(e, frame);
        case 'bi': return this.builtin(e, frame);
        case 'getline': {
          if (e.file) {
            const name = this.str(this.ev(e.file, frame));
            const rd = this.readerFor(name, 'file');
            if (!rd) return -1;
            const r = this.nextFrom(rd);
            if (r == null) return 0;
            if (e.lv) this.assign(e.lv, strnum(r), frame); else { this.setRec(r); this.g.NR = this.num(this.g.NR); }
            return 1;
          }
          const r = this.nextMain();
          if (r == null) return 0;
          if (e.lv) this.assign(e.lv, strnum(r), frame); else this.setRec(r);
          return 1;
        }
        case 'pgetline': {
          const cmd = this.str(this.ev(e.cmd, frame));
          const rd = this.readerFor(cmd, 'cmd');
          const r = this.nextFrom(rd);
          if (r == null) return 0;
          this.g.NR = this.num(this.g.NR) + 1;
          if (e.lv) this.assign(e.lv, strnum(r), frame); else this.setRec(r);
          return 1;
        }
        default: this.err('unknown expression ' + e.t);
      }
      return undefined;
    }
    arith(op, a, b) {
      switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': if (b === 0) this.err('division by zero'); return a / b;
        case '%': if (b === 0) this.err('division by zero in %'); return a % b;
        case '^': return Math.pow(a, b);
        default: return 0;
      }
    }
    call(e, frame) {
      const fn = this.prog.funcs[e.name];
      if (!fn) this.err(`function ${e.name} never defined`);
      if (e.args.length > fn.params.length) this.err(`too many arguments in call to ${e.name}`);
      const vals = new Array(fn.params.length);
      const lazy = [];
      e.args.forEach((a, k) => {
        if (a.t === 'var' || a.t === 'lvar') {
          const v = a.t === 'var' ? this.g[a.name] : frame.vals[a.i];
          vals[k] = v;
          if (v === undefined) lazy.push({ a, k });   // 함수 안에서 배열이 되면 호출한 쪽 변수에도 연결
          return;
        }
        vals[k] = this.ev(a, frame);
      });
      if (++this.depth > 3000) this.err('function call nesting too deep');
      const nf = { vals };
      let ret;
      try {
        this.exec(fn.body, nf);
      } catch (x) {
        if (x instanceof RetSig) ret = x.v; else { this.depth--; throw x; }
      }
      this.depth--;
      for (const l of lazy) {
        const m = nf.vals[l.k];
        if (m instanceof Map) {
          if (l.a.t === 'var') { if (this.g[l.a.name] === undefined) this.g[l.a.name] = m; } else if (frame.vals[l.a.i] === undefined) frame.vals[l.a.i] = m;
        }
      }
      return ret instanceof Map ? undefined : ret;
    }
    builtin(e, frame) {
      const a = e.args;
      const S = (k) => this.str(this.ev(a[k], frame));
      const N = (k) => this.num(this.ev(a[k], frame));
      switch (e.name) {
        case 'length': {
          if (!a.length) return this.rec.length;
          const n = a[0];
          if (n.t === 'var' || n.t === 'lvar') {
            const v = n.t === 'var' ? this.g[n.name] : frame.vals[n.i];
            if (v instanceof Map) return v.size;
          }
          return S(0).length;
        }
        case 'substr': {
          const s = S(0);
          let m = N(1);
          if (isNaN(m)) m = 0;
          if (a.length < 3) {
            let st = Math.round(m);
            if (st < 1) st = 1;
            return s.slice(st - 1);
          }
          const cnt = N(2);
          if (isNaN(cnt)) return '';
          let st = Math.round(m);
          let end = st + Math.round(cnt);
          if (st < 1) st = 1;
          if (end > s.length + 1) end = s.length + 1;
          if (end <= st) return '';
          return s.slice(st - 1, end - 1);
        }
        case 'index': { const s = S(0), t = S(1); return s.indexOf(t) + 1; }
        case 'split': {
          const s = S(0);
          const arr = this.arrOf(a[1], frame);
          let parts;
          if (a.length > 2) {
            if (a[2].t === 're') parts = s === '' ? [] : s.split(new RegExp(this.regex(a[2].src).source, 'g'));
            else parts = this.splitStr(s, S(2), false);
          } else parts = this.splitStr(s, this.g.FS, false);
          arr.clear();
          parts.forEach((p, k) => arr.set(String(k + 1), strnum(p === undefined ? '' : p)));
          return parts.length;
        }
        case 'sub': case 'gsub': {
          if (a.length < 2) this.err(`${e.name}: not enough arguments`);
          const re = this.reOf(a[0], frame);
          const rep = S(1);
          const target = a[2] || { t: 'field', e: { t: 'num', v: 0 } };
          const src = this.str(this.ev(target, frame));
          const reG = new RegExp(re.source, 'g');
          let out = '';
          let last = 0;
          let cnt = 0;
          let m;
          let prevEnd = -1;
          while ((m = reG.exec(src)) !== null) {
            const st = m.index;
            const en = st + m[0].length;
            if (m[0] === '' && st === prevEnd) { reG.lastIndex++; if (reG.lastIndex > src.length) break; continue; }
            out += src.slice(last, st) + this.subRep(rep, m[0]);
            last = en;
            cnt++;
            prevEnd = en;
            if (e.name === 'sub') break;
            if (m[0] === '') { reG.lastIndex++; if (reG.lastIndex > src.length) break; }
          }
          if (cnt) {
            out += src.slice(last);
            if (LVT.includes(target.t)) this.assign(target, out, frame);
          }
          return cnt;
        }
        case 'match': {
          const s = S(0);
          const re = this.reOf(a[1], frame);
          const m = re.exec(s);
          if (m) { this.g.RSTART = m.index + 1; this.g.RLENGTH = m[0].length; } else { this.g.RSTART = 0; this.g.RLENGTH = -1; }
          if (a[2]) {
            const arr = this.arrOf(a[2], frame);
            arr.clear();
            if (m) m.forEach((x, k) => { if (x !== undefined) arr.set(String(k), x); });
          }
          return this.g.RSTART;
        }
        case 'sprintf': {
          if (!a.length) return '';
          const vals = a.map((x) => this.ev(x, frame));
          return this.fmt(this.str(vals[0]), vals.slice(1));
        }
        case 'tolower': return S(0).toLowerCase();
        case 'toupper': return S(0).toUpperCase();
        case 'int': return Math.trunc(N(0));
        case 'sqrt': return Math.sqrt(N(0));
        case 'exp': return Math.exp(N(0));
        case 'log': return Math.log(N(0));
        case 'sin': return Math.sin(N(0));
        case 'cos': return Math.cos(N(0));
        case 'atan2': return Math.atan2(N(0), N(1));
        case 'rand': {
          let t = (this.rng = (this.rng + 0x6D2B79F5) >>> 0);
          t = Math.imul(t ^ (t >>> 15), t | 1);
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
        case 'srand': {
          const prev = this.prevSeed;
          const s = a.length ? N(0) : this.env.now;
          this.prevSeed = s;
          this.rng = (Math.trunc(s) * 2654435761) >>> 0;
          return prev;
        }
        case 'system': {
          const cmd = S(0);
          this.closeAll();
          const ck = 'sys#' + (this.callNo++) + ':' + cmd;
          const res = this.env.cache.get(ck);
          if (!res) throw new AwkNeed(ck, 'sys', cmd);
          return res.status;
        }
        case 'close': return this.closeStream(S(0));
        case 'fflush': return 0;
        default: return 0;
      }
    }
    subRep(rep, m) {
      let out = '';
      for (let i = 0; i < rep.length; i++) {
        const ch = rep[i];
        if (ch === '\\' && (rep[i + 1] === '&' || rep[i + 1] === '\\')) { out += rep[i + 1]; i++; continue; }
        if (ch === '&') { out += m; continue; }
        out += ch;
      }
      return out;
    }
  }

  def(['awk', 'mawk', 'nawk', 'gawk'], async (c) => {
    const args = c.args;
    let fs = null;
    const assigns = [];
    const progFiles = [];
    let k = 0;
    const usage = () => { c.err('usage: awk [-F value] [-v var=value] [--] \'program text\' [file ...]\nusage: awk [-F value] [-v var=value] [-f program-file] [--] [file ...]\n'); return 2; };
    for (; k < args.length; k++) {
      const a = args[k];
      if (a === '--') { k++; break; }
      if (a === '-' || !a.startsWith('-')) break;
      const opt = a[1];
      const val = () => { const v = a.length > 2 ? a.slice(2) : args[++k]; if (v == null) throw new AwkSyntax(`option requires an argument -- ${opt}`); return v; };
      try {
        if (opt === 'F') fs = val();
        else if (opt === 'v') assigns.push(val());
        else if (opt === 'f') progFiles.push(val());
        else if (opt === 'W' || a.startsWith('--')) {
          const w = opt === 'W' ? val() : a.slice(2);
          if (/^v(ersion)?$/.test(w)) { c.out('mawk 1.3.4 20240123\nCopyright 2008-2023,2024, Thomas E. Dickey\nCopyright 1991-1996,2014, Michael D. Brennan\n\nrandom-funcs:       srandom/random\nregex-funcs:        internal\n\ncompiled limits:\nsprintf buffer      8192\nmaximum-integer     2147483647\n'); return 0; }
          if (/^(help|usage)/.test(w)) return usage();
        } else { c.err(`awk: not an option: ${a}\n`); return 2; }
      } catch (e) { c.err(`awk: ${e.message}\n`); return 2; }
    }
    let src;
    if (progFiles.length) {
      src = '';
      for (const pf of progFiles) {
        const rd = await readOne(c, pf);
        if (rd.err) { c.err(`awk: couldn't open file ${pf}: ${rd.err}\n`); return 2; }
        src += rd.text + '\n';
      }
    } else {
      if (k >= args.length) return usage();
      src = args[k++];
    }
    const operands = args.slice(k);
    let prog;
    try {
      prog = new AwkParser(awkLex(src)).program();
    } catch (e) {
      if (e instanceof AwkSyntax) { c.err(`awk: ${e.message}\n`); return 2; }
      throw e;
    }
    const env = {
      cache: new Map(), seed: (c.m.now() & 0x7fffffff) >>> 0, now: Math.floor(c.m.now() / 1000),
      argv: ['awk', ...operands],
      applied: 0,
      resolve: (p) => c.resolve(p),
      environ: c.sh.exportedEnv ? c.sh.exportedEnv() : {},
      readFile: (name) => {
        const abs = c.resolve(name);
        try {
          const n = c.fs.stat(abs, c.cred);
          if (n.t === 'd') return { err: 'Is a directory' };
          return { text: c.fs.readFile(abs, c.cred) };
        } catch (e) { return { err: e.message }; }
      }
    };
    // 표준 입력이 필요한지
    const fileOps = operands.filter((o) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(o));
    const needMain = prog.rules.length || prog.end.length || prog.usesGetline;
    if (needMain && (!fileOps.length || fileOps.includes('-') || fileOps.includes('/dev/stdin'))) env.stdinText = await c.readStdin();
    else if (prog.usesGetline && /"(-|\/dev\/stdin)"/.test(src)) env.stdinText = await c.readStdin();
    let applied = 0;
    for (let attempt = 0; ; attempt++) {
      env.applied = applied;
      const rt = new AwkRT(prog, env);
      if (fs != null) rt.g.FS = fs === 't' ? '\t' : awkUnesc(fs);
      for (const as of assigns) {
        const m = /^([A-Za-z_][A-Za-z0-9_]*)=([^]*)$/.exec(as);
        if (!m) { c.err(`awk: improper assignment: -v ${as}\n`); return 2; }
        rt.g[m[1]] = strnum(awkUnesc(m[2]));
      }
      let need = null, fatal = null;
      try { rt.run(); } catch (e) {
        if (e instanceof AwkNeed) need = e;
        else if (e instanceof AwkRunErr) fatal = e;
        else if (e instanceof RangeError) fatal = new AwkRunErr('function call nesting too deep');
        else throw e;
      }
      // 이번 실행에서 새로 생긴 부수 효과만 반영 (다시 실행해도 같은 앞부분이 만들어진다)
      const evs = rt.events.slice(applied);
      applied = rt.events.length;
      for (const ev of evs) {
        if (ev.t === 'out') c.out(ev.s);
        else if (ev.t === 'err') c.err(ev.s);
        else if (ev.t === 'file') {
          const er = writeOut(c, ev.path, ev.s, !ev.trunc);
          if (er) { c.err(`awk: cannot open "${ev.path}" for output\n`); return 2; }
        } else if (ev.t === 'pipe') {
          const sh = c.sh.child('sub');
          try { await sh.runSource(ev.cmd, Object.assign({}, c.io, { stdin: new LX.InStream(ev.s) })); } catch (e) { if (!(e instanceof LX.sig.ExitSig)) throw e; }
        }
      }
      if (need) {
        if (attempt > 60) { c.err('awk: 가상 터미널에서는 외부 명령을 이렇게 많이 호출할 수 없습니다\n'); return 2; }
        const sh = c.sh.child('sub');
        let status = 0;
        if (need.kind === 'cmd') {
          let buf = '';
          const io = { stdin: new LX.InStream(''), out: (s) => { buf += s; }, err: c.io.err, tty: false, pipeOut: true };
          try { status = await sh.runSource(need.cmd, io); } catch (e) { if (e instanceof LX.sig.ExitSig) status = e.code; else throw e; }
          env.cache.set(need.key, { out: buf, status });
        } else {
          try { status = await sh.runSource(need.cmd, Object.assign({}, c.io, { stdin: new LX.InStream('') })); } catch (e) { if (e instanceof LX.sig.ExitSig) status = e.code; else throw e; }
          env.cache.set(need.key, { status: status == null ? 0 : status });
        }
        continue;
      }
      if (fatal) {
        const msg = fatal.message;
        const where = `\tFILENAME="${rt.str(rt.g.FILENAME)}" FNR=${rt.str(rt.g.FNR)} NR=${rt.str(rt.g.NR)}\n`;
        if (/^cannot open/.test(msg) || /[가-힣]/.test(msg)) c.err(`awk: ${msg}\n`);
        else c.err(`awk: run time error: ${msg}\n${where}`);
        return 2;
      }
      return rt.exitCode;
    }
  });

  // ======================================================================= sort
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function numPrefix(s) {
    const m = /^[ \t]*(-?)(\d*(?:,\d{3})*)(?:\.(\d*))?/.exec(s);
    if (!m || (m[2] === '' && (m[3] == null || m[3] === ''))) return 0;
    return parseFloat((m[1] || '') + (m[2].replace(/,/g, '') || '0') + '.' + (m[3] || '0'));
  }
  function humanVal(s) {
    const m = /^[ \t]*(-?\d*\.?\d+)\s*([KMGTPEZY]?)/i.exec(s);
    if (!m) return [0, 0];
    const idx = ' KMGTPEZY'.indexOf((m[2] || ' ').toUpperCase());
    const v = parseFloat(m[1]);
    return [v === 0 ? 0 : Math.sign(v) * (idx + 1), v];
  }
  /** 버전 비교 (sort -V / ls -v) */
  function verCmp(a, b) {
    const ta = a.match(/\d+|\D+/g) || [];
    const tb = b.match(/\d+|\D+/g) || [];
    for (let i = 0; i < Math.max(ta.length, tb.length); i++) {
      const x = ta[i], y = tb[i];
      if (x === undefined) return -1;
      if (y === undefined) return 1;
      const dx = /^\d/.test(x), dy = /^\d/.test(y);
      if (dx && dy) { const d = parseInt(x, 10) - parseInt(y, 10); if (d) return d < 0 ? -1 : 1; continue; }
      if (dx !== dy) return dx ? -1 : 1;
      if (x !== y) {
        // 문자가 숫자 아닌 부분: '~' 는 가장 앞, 글자는 기호보다 앞
        for (let k = 0; k < Math.max(x.length, y.length); k++) {
          const ord = (ch) => (ch === undefined ? 0 : ch === '~' ? -1 : /[A-Za-z]/.test(ch) ? ch.charCodeAt(0) : ch.charCodeAt(0) + 256);
          const oa = ord(x[k]), ob = ord(y[k]);
          if (oa !== ob) return oa < ob ? -1 : 1;
        }
      }
    }
    return 0;
  }
  LX.verCmp = verCmp;

  def('sort', async (c) => {
    const r = opts(c.args, 'nrk:t:uhfbo:MVcCsgRdizmS:T:', {
      'numeric-sort': 'n', reverse: 'r', key: 'k:', 'field-separator': 't:', unique: 'u', 'human-numeric-sort': 'h', 'ignore-case': 'f',
      'ignore-leading-blanks': 'b', output: 'o:', 'month-sort': 'M', 'version-sort': 'V', check: 'c?', stable: 's', 'general-numeric-sort': 'g',
      'random-sort': 'R', 'dictionary-order': 'd', 'ignore-nonprinting': 'i', 'zero-terminated': 'z', merge: 'm', 'buffer-size': 'S:',
      'temporary-directory': 'T:', parallel: 'parallel:', sort: 'sort:', debug: 'debug', version: 'version', help: 'help'
    }, { multi: ['k'] });
    if (r.bad) return badOpt(c, 'sort', r.bad, 2);
    const f = r.f;
    if (f.version) { c.out('sort (GNU coreutils) 9.4\n'); return 0; }
    if (f.help) { c.out('Usage: sort [OPTION]... [FILE]...\n  or:  sort [OPTION]... --files0-from=F\nWrite sorted concatenation of all FILE(s) to standard output.\n'); return 0; }
    if (f.sort) f[{ numeric: 'n', 'general-numeric': 'g', human: 'h', month: 'M', version: 'V', random: 'R' }[f.sort] || 'x'] = true;
    const cmp0 = cmpFor(c);
    if (f.t != null && [...f.t].length !== 1) {
      if (f.t === '\\0') f.t = '\0';
      else { c.err(f.t === '' ? 'sort: empty tab\n' : `sort: multi-character tab '${f.t}'\n`); return 2; }
    }
    const G_OPTS = 'bdfgiMhnRrV';
    const global = {};
    for (const ch of G_OPTS) if (f[ch]) global[ch] = true;
    // 키 정의
    const keys = [];
    for (const kd of f.k || []) {
      const m = /^(\d+)(?:\.(\d+))?([bdfgiMhnRrV]*)(?:,(\d+)(?:\.(\d+))?([bdfgiMhnRrV]*))?$/.exec(kd);
      if (!m || +m[1] === 0 || (m[2] != null && +m[2] === 0)) {
        c.err(m && +m[1] === 0 ? `sort: field number is zero: invalid field specification '${kd}'\n` : `sort: invalid number at field start: invalid count at start of '${kd}'\n`);
        return 2;
      }
      const o = {};
      for (const ch of (m[3] || '') + (m[6] || '')) o[ch] = true;
      const own = Object.keys(o).length > 0;
      keys.push({ sf: +m[1], sc: m[2] ? +m[2] : 1, ef: m[4] ? +m[4] : 0, ec: m[5] ? +m[5] : 0, o: own ? o : Object.assign({}, global), bStart: own ? (m[3] || '').includes('b') : !!global.b, bEnd: own ? !!(m[6] || '').includes('b') : !!global.b });
    }
    // 입력
    let text = '';
    let st = 0;
    for (const name of r.ops.length ? r.ops : ['-']) {
      const rd = await readOne(c, name);
      if (rd.err) {
        c.err(rd.dir ? `sort: read failed: ${name}: Is a directory\n` : `sort: cannot read: ${name}: ${rd.err}\n`);
        return 2;
      }
      text += rd.text && !rd.text.endsWith('\n') ? rd.text + '\n' : rd.text;
    }
    const sepNl = f.z ? '\0' : '\n';
    let lines = text.split(sepNl);
    if (lines[lines.length - 1] === '') lines.pop();
    const blank = (ch) => ch === ' ' || ch === '\t';
    // 필드 경계
    const bounds = (line) => {
      const res = [];
      if (f.t != null) {
        let s = 0;
        for (;;) {
          const j = line.indexOf(f.t, s);
          if (j < 0) { res.push([s, line.length]); break; }
          res.push([s, j]);
          s = j + 1;
        }
      } else {
        let i = 0;
        const n = line.length;
        while (i < n) {
          const s = i;
          while (i < n && blank(line[i])) i++;
          while (i < n && !blank(line[i])) i++;
          res.push([s, i]);
        }
        if (!res.length) res.push([0, 0]);
      }
      return res;
    };
    const extract = (line, k) => {
      const b = bounds(line);
      let start, end;
      if (k.sf > b.length) start = line.length;
      else {
        let s0 = b[k.sf - 1][0];
        const fe = b[k.sf - 1][1];
        if (k.bStart) while (s0 < fe && blank(line[s0])) s0++;
        start = Math.min(s0 + k.sc - 1, fe);
      }
      if (!k.ef) end = line.length;
      else if (k.ef > b.length) end = line.length;
      else if (!k.ec) end = b[k.ef - 1][1];
      else {
        let s0 = b[k.ef - 1][0];
        const fe = b[k.ef - 1][1];
        if (k.bEnd) while (s0 < fe && blank(line[s0])) s0++;
        end = Math.min(s0 + k.ec, fe);
      }
      return line.slice(start, Math.max(start, end));
    };
    const rnd = new Map();
    const cmpVal = (a, b, o) => {
      if (o.b) { a = a.replace(/^[ \t]+/, ''); b = b.replace(/^[ \t]+/, ''); }
      let res;
      if (o.n) res = numPrefix(a) - numPrefix(b);
      else if (o.g) { const x = parseFloat(a), y = parseFloat(b); res = isNaN(x) ? (isNaN(y) ? 0 : -1) : isNaN(y) ? 1 : x - y; }
      else if (o.h) { const [ua, va] = humanVal(a), [ub, vb] = humanVal(b); res = ua - ub || va - vb; }
      else if (o.M) { const ma = MONTHS.indexOf(a.trim().slice(0, 3).toUpperCase()), mb = MONTHS.indexOf(b.trim().slice(0, 3).toUpperCase()); res = ma - mb; }
      else if (o.V) res = verCmp(a, b);
      else if (o.R) {
        const h = (s) => { if (!rnd.has(s)) rnd.set(s, Math.random()); return rnd.get(s); };
        res = h(a) - h(b);
      } else {
        if (o.d) { a = a.replace(/[^\sA-Za-z0-9가-힣]/g, ''); b = b.replace(/[^\sA-Za-z0-9가-힣]/g, ''); }
        if (o.i) { a = a.replace(/[^\x20-\x7e가-힣]/g, ''); b = b.replace(/[^\x20-\x7e가-힣]/g, ''); }
        if (o.f) { a = a.toUpperCase(); b = b.toUpperCase(); }
        res = cmp0(a, b);
      }
      res = res < 0 ? -1 : res > 0 ? 1 : 0;
      return o.r ? -res : res;
    };
    const keyCmp = (a, b) => {
      if (!keys.length) return cmpVal(a, b, global);
      for (const k of keys) {
        const r2 = cmpVal(extract(a, k), extract(b, k), k.o);
        if (r2) return r2;
      }
      return 0;
    };
    const lastResort = !f.s && !f.u && (keys.length || Object.keys(global).some((x) => x !== 'r'));
    const full = (a, b) => {
      const r2 = keyCmp(a, b);
      if (r2 || !lastResort) return r2;
      const r3 = cmp0(a, b);
      return global.r ? -r3 : r3;
    };
    if (f.c || f.C) {
      const name = r.ops[0] || '-';
      for (let i = 1; i < lines.length; i++) {
        const r2 = full(lines[i - 1], lines[i]);
        if (r2 > 0 || (f.u && r2 === 0)) {
          if (!f.C && f.c !== 'quiet' && f.c !== 'silent') c.err(`sort: ${name}:${i + 1}: disorder: ${lines[i]}\n`);
          return 1;
        }
      }
      return 0;
    }
    lines = lines.map((l, i) => ({ l, i })).sort((x, y) => full(x.l, y.l) || x.i - y.i).map((x) => x.l);
    if (f.u) lines = lines.filter((l, i) => i === 0 || keyCmp(lines[i - 1], l) !== 0);
    const out = lines.length ? lines.join(sepNl) + sepNl : '';
    if (f.o) {
      const er = writeOut(c, f.o, out, false);
      if (er) { c.err(`sort: open failed: ${f.o}: ${er}\n`); return 2; }
      return st;
    }
    c.out(out);
    return st;
  });

  // ======================================================================= uniq
  def('uniq', async (c) => {
    const r = opts(c.args, 'cdDuif:s:w:z', { count: 'c', repeated: 'd', 'all-repeated': 'D?', unique: 'u', 'ignore-case': 'i', 'skip-fields': 'f:', 'skip-chars': 's:', 'check-chars': 'w:', group: 'group?', 'zero-terminated': 'z' }, { digits: true });
    if (r.bad) return badOpt(c, 'uniq', r.bad);
    const f = r.f;
    if (r.ops.length > 2) { c.err(`uniq: extra operand '${r.ops[2]}'\nTry 'uniq --help' for more information.\n`); return 1; }
    const inName = r.ops[0] || '-';
    const rd = await readOne(c, inName);
    if (rd.err) { c.err(`uniq: ${inName}: ${rd.err}\n`); return 1; }
    const lines = splitLines(rd.text);
    const skipF = +(f.f || 0), skipC = +(f.s || f['#'] || 0);
    const keyOf = (l) => {
      let s = l;
      for (let k = 0; k < skipF; k++) s = s.replace(/^[ \t]*[^ \t]*/, '');
      s = s.slice(skipC);
      if (f.w != null) s = s.slice(0, +f.w);
      return f.i ? s.toLowerCase() : s;
    };
    const groups = [];
    for (const l of lines) {
      const k = keyOf(l);
      const g = groups[groups.length - 1];
      if (g && g.k === k) { g.n++; g.all.push(l); } else groups.push({ k, l, n: 1, all: [l] });
    }
    let out = '';
    for (const g of groups) {
      if (f.D) {
        if (g.n > 1) out += g.all.map((x) => (f.c ? String(g.n).padStart(7) + ' ' : '') + x + '\n').join('');
        continue;
      }
      if (f.d && g.n < 2) continue;
      if (f.u && g.n > 1) continue;
      out += (f.c ? String(g.n).padStart(7) + ' ' : '') + g.l + '\n';
    }
    if (r.ops[1]) {
      const er = writeOut(c, r.ops[1], out, false);
      if (er) { c.err(`uniq: ${r.ops[1]}: ${er}\n`); return 1; }
      return 0;
    }
    c.out(out);
    return 0;
  });

  // ======================================================================= cut
  function parseList(spec, what) {
    const ranges = [];
    for (const part of String(spec).split(',')) {
      const m = /^(\d*)(-?)(\d*)$/.exec(part);
      if (!m || part === '' || part === '-') throw new Error(part === '-' ? 'invalid range with no endpoint: -' : `invalid ${what} value '${part}'`);
      const a = m[1] === '' ? 1 : +m[1];
      const b = m[2] ? (m[3] === '' ? Infinity : +m[3]) : a;
      if (a === 0 || b === 0) throw new Error(`${what}s are numbered from 1`);
      if (b < a) throw new Error('invalid decreasing range');
      ranges.push([a, b]);
    }
    return (i) => ranges.some(([a, b]) => i >= a && i <= b);
  }
  LX.parseList = parseList;

  def('cut', async (c) => {
    const r = opts(c.args, 'b:c:f:d:snz', { bytes: 'b:', characters: 'c:', fields: 'f:', delimiter: 'd:', 'only-delimited': 's', complement: 'complement', 'output-delimiter': 'od:', 'zero-terminated': 'z' });
    if (r.bad) return badOpt(c, 'cut', r.bad);
    const f = r.f;
    const modes = ['b', 'c', 'f'].filter((k) => f[k] != null);
    if (!modes.length) return badOpt(c, 'cut', 'you must specify a list of bytes, characters, or fields');
    if (modes.length > 1) return badOpt(c, 'cut', 'only one list may be specified');
    const mode = modes[0];
    if (f.d != null && mode !== 'f') return badOpt(c, 'cut', 'an input delimiter may be specified only when operating on fields');
    if (f.s && mode !== 'f') return badOpt(c, 'cut', 'suppressing non-delimited lines makes sense\n\tonly when operating on fields');
    let sel;
    try { sel = parseList(f[mode], mode === 'f' ? 'field' : mode === 'b' ? 'byte' : 'character'); } catch (e) {
      const msg = /numbered from 1/.test(e.message) ? e.message : e.message.replace(/value/, 'list value');
      return badOpt(c, 'cut', msg);
    }
    const delim = f.d != null ? f.d : '\t';
    if ([...delim].length > 1) return badOpt(c, 'cut', 'the delimiter must be a single character');
    const d = delim === '' ? '\0' : delim;
    const od = f.od != null ? f.od : d;
    const pick = (i) => (f.complement ? !sel(i) : sel(i));
    return LX.readInputs(c, r.ops, 'cut', (text) => {
      const lines = splitLines(text);
      let out = '';
      for (const line of lines) {
        if (mode === 'f') {
          if (!line.includes(d)) { if (!f.s) out += line + '\n'; continue; }
          const parts = line.split(d);
          out += parts.filter((p, i) => pick(i + 1)).join(od) + '\n';
        } else {
          const ch = Array.from(line);
          if (f.od != null) {
            // 연속 구간마다 출력 구분자
            let res = '';
            let prev = false;
            let first = true;
            ch.forEach((x, i) => { const on = pick(i + 1); if (on) { if (!prev && !first) res += od; res += x; first = false; } prev = on; });
            out += res + '\n';
          } else out += ch.filter((x, i) => pick(i + 1)).join('') + '\n';
        }
      }
      c.out(out);
    });
  });

  // ======================================================================= tr
  const TR_CLASS = {
    lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digit: '0123456789',
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', alnum: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    space: '\t\n\v\f\r ', blank: '\t ', punct: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~', xdigit: '0123456789ABCDEFabcdef',
    cntrl: Array.from({ length: 32 }, (x, i) => String.fromCharCode(i)).join('') + '\x7f',
    print: Array.from({ length: 95 }, (x, i) => String.fromCharCode(32 + i)).join(''), graph: Array.from({ length: 94 }, (x, i) => String.fromCharCode(33 + i)).join('')
  };
  function trSet(spec, isSet2, len1) {
    // 이스케이프 풀기 → 토큰
    const toks = [];
    for (let i = 0; i < spec.length; i++) {
      const ch = spec[i];
      if (ch === '\\' && i + 1 < spec.length) {
        const d = spec[++i];
        if (/[0-7]/.test(d)) { let o = d; while (o.length < 3 && /[0-7]/.test(spec[i + 1])) o += spec[++i]; toks.push({ c: String.fromCharCode(parseInt(o, 8)) }); continue; }
        const map = { n: '\n', t: '\t', r: '\r', a: '\x07', b: '\b', f: '\f', v: '\v', '\\': '\\' };
        toks.push({ c: map[d] != null ? map[d] : d });
        continue;
      }
      if (ch === '[') {
        const m = /^\[:(\w+):\]/.exec(spec.slice(i));
        if (m) {
          if (!TR_CLASS[m[1]]) throw new Error(`invalid character class '${m[1]}'`);
          toks.push({ cls: m[1] });
          i += m[0].length - 1;
          continue;
        }
        const e = /^\[=(.)=\]/.exec(spec.slice(i));
        if (e) { toks.push({ c: e[1] }); i += e[0].length - 1; continue; }
        const r = /^\[(.)\*(\d*)\]/.exec(spec.slice(i));
        if (r && isSet2) { toks.push({ rep: r[1], n: r[2] === '' ? 0 : parseInt(r[2], r[2].startsWith('0') ? 8 : 10) }); i += r[0].length - 1; continue; }
      }
      toks.push({ c: Array.from(spec.slice(i))[0] });
      if (spec.codePointAt(i) > 0xffff) i++;
    }
    const out = [];
    let fillAt = -1;
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.cls) { out.push(...TR_CLASS[t.cls]); continue; }
      if (t.rep != null) { if (t.n) for (let q = 0; q < t.n; q++) out.push(t.rep); else { fillAt = out.length; out.push({ fill: t.rep }); } continue; }
      if (toks[k + 1] && toks[k + 1].c === '-' && toks[k + 2] && toks[k + 2].c != null) {
        const a = t.c.codePointAt(0), b = toks[k + 2].c.codePointAt(0);
        if (b < a) throw new Error(`range-endpoints of '${t.c}-${toks[k + 2].c}' are in reverse collating sequence order`);
        for (let q = a; q <= b; q++) out.push(String.fromCodePoint(q));
        k += 2;
        continue;
      }
      out.push(t.c);
    }
    if (fillAt >= 0) {
      const f = out[fillAt].fill;
      const need = Math.max(0, (len1 || 0) - (out.length - 1));
      out.splice(fillAt, 1, ...Array(need).fill(f));
    }
    return out;
  }

  def('tr', async (c) => {
    const r = opts(c.args, 'cCdst', { complement: 'c', delete: 'd', 'squeeze-repeats': 's', 'truncate-set1': 't' });
    if (r.bad) return badOpt(c, 'tr', r.bad);
    const f = r.f;
    const comp = f.c || f.C;
    const ops = r.ops;
    const translating = !f.d && ops.length >= 2;
    if (!ops.length) return badOpt(c, 'tr', 'missing operand');
    if (f.d && !f.s && ops.length > 1) return badOpt(c, 'tr', `extra operand '${ops[1]}'\nOnly one string may be given when deleting without squeezing repeats.`);
    if (!f.d && !f.s && ops.length < 2) return badOpt(c, 'tr', `missing operand after '${ops[0]}'\nTwo strings must be given when translating.`);
    if (f.d && f.s && ops.length < 2) return badOpt(c, 'tr', `missing operand after '${ops[0]}'\nTwo strings must be given when both deleting and squeezing repeats.`);
    if (ops.length > 2) return badOpt(c, 'tr', `extra operand '${ops[2]}'`);
    let s1, s2;
    try {
      s1 = trSet(ops[0], false);
      s2 = ops[1] != null ? trSet(ops[1], true, s1.length) : null;
    } catch (e) { c.err(`tr: ${e.message}\n`); return 1; }
    if (translating && !s2.length && !f.t) { c.err('tr: when not truncating set1, string2 must be non-empty\n'); return 1; }
    if (f.t && s2) s1 = s1.slice(0, s2.length);
    const in1 = new Set(s1);
    const text = await c.readStdin();
    const chars = Array.from(text);
    let out = [];
    if (f.d) {
      out = chars.filter((ch) => (comp ? in1.has(ch) : !in1.has(ch)));
    } else if (translating) {
      const map = new Map();
      if (!comp) s1.forEach((ch, i) => map.set(ch, s2[Math.min(i, s2.length - 1)]));
      const last = s2[s2.length - 1];
      out = chars.map((ch) => (comp ? (in1.has(ch) ? ch : last) : map.has(ch) ? map.get(ch) : ch));
    } else out = chars;
    if (f.s) {
      const sq = new Set(f.d || translating ? s2 : s1);
      const sqComp = comp && !f.d && !translating;
      const res = [];
      for (const ch of out) {
        const inSq = sqComp ? !in1.has(ch) : sq.has(ch);
        if (inSq && res.length && res[res.length - 1] === ch) continue;
        res.push(ch);
      }
      out = res;
    }
    c.out(out.join(''));
    return 0;
  });

  // ======================================================================= tee
  def('tee', async (c) => {
    const r = opts(c.args, 'aip', { append: 'a', 'ignore-interrupts': 'i', 'output-error': 'oe?' });
    if (r.bad) return badOpt(c, 'tee', r.bad);
    const text = await c.readStdin();
    let st = 0;
    for (const name of r.ops) {
      if (name === '-') { c.out(text); continue; }
      const er = writeOut(c, name, text, r.f.a);
      if (er) { c.err(`tee: ${name}: ${er}\n`); st = 1; }
    }
    c.out(text);
    return st;
  });

  // ======================================================================= xargs
  def('xargs', async (c) => {
    const args = c.args;
    const o = { n: 0, L: 0, I: null, nul: false, d: null, t: false, r: false, p: false, a: null, E: null };
    let k = 0;
    const need = (ch, v) => { if (v == null) { c.err(`xargs: option requires an argument -- '${ch}'\nUsage: xargs [OPTION]... COMMAND [INITIAL-ARGS]...\nTry 'xargs --help' for more information.\n`); return false; } return true; };
    for (; k < args.length; k++) {
      const a = args[k];
      if (a === '--') { k++; break; }
      if (!a.startsWith('-') || a === '-') break;
      if (a.startsWith('--')) {
        const [key, v] = a.slice(2).split(/=(.*)/s);
        if (key === 'null') o.nul = true;
        else if (key === 'verbose') o.t = true;
        else if (key === 'no-run-if-empty') o.r = true;
        else if (key === 'interactive') o.p = true;
        else if (key === 'max-args') o.n = +(v != null ? v : args[++k]);
        else if (key === 'max-lines') o.L = +(v != null ? v : 1);
        else if (key === 'replace') o.I = v != null ? v : '{}';
        else if (key === 'delimiter') o.d = LX.escapes(v != null ? v : args[++k]);
        else if (key === 'arg-file') o.a = v != null ? v : args[++k];
        else if (key === 'max-procs' || key === 'max-chars' || key === 'exit' || key === 'show-limits' || key === 'process-slot-var' || key === 'open-tty') { if (v == null && (key === 'max-procs' || key === 'max-chars' || key === 'process-slot-var')) k++; }
        else if (key === 'version') { c.out('xargs (GNU findutils) 4.9.0\n'); return 0; }
        else { c.err(`xargs: unrecognized option '${a}'\nUsage: xargs [OPTION]... COMMAND [INITIAL-ARGS]...\nTry 'xargs --help' for more information.\n`); return 1; }
        continue;
      }
      let stop = false;
      for (let j = 1; j < a.length && !stop; j++) {
        const ch = a[j];
        const rest = a.slice(j + 1);
        const val = () => (rest !== '' ? rest : args[++k]);
        switch (ch) {
          case '0': o.nul = true; break;
          case 't': o.t = true; break;
          case 'r': o.r = true; break;
          case 'p': o.p = true; o.t = true; break;
          case 'x': break;
          case 'n': { const v = val(); if (!need(ch, v)) return 1; o.n = +v; if (!(o.n > 0)) { c.err(`xargs: value ${v} for -n option should be >= 1\n`); return 1; } stop = true; break; }
          case 'L': { const v = val(); if (!need(ch, v)) return 1; o.L = +v; stop = true; break; }
          case 'l': o.L = rest !== '' ? +rest : 1; stop = true; break;
          case 'I': { const v = val(); if (!need(ch, v)) return 1; o.I = v; stop = true; break; }
          case 'i': o.I = rest !== '' ? rest : '{}'; stop = true; break;
          case 'd': { const v = val(); if (!need(ch, v)) return 1; o.d = LX.escapes(v); stop = true; break; }
          case 'a': { const v = val(); if (!need(ch, v)) return 1; o.a = v; stop = true; break; }
          case 'E': { const v = val(); if (!need(ch, v)) return 1; o.E = v; stop = true; break; }
          case 'e': o.E = rest || null; stop = true; break;
          case 'P': case 's': { const v = val(); if (!need(ch, v)) return 1; stop = true; break; }
          default:
            c.err(`xargs: invalid option -- '${ch}'\nUsage: xargs [OPTION]... COMMAND [INITIAL-ARGS]...\nTry 'xargs --help' for more information.\n`);
            return 1;
        }
      }
    }
    const cmd = args.slice(k);
    if (!cmd.length) cmd.push('echo');
    let input;
    if (o.a) { const rd = await readOne(c, o.a); if (rd.err) { c.err(`xargs: ${o.a}: ${rd.err}\n`); return 1; } input = rd.text; } else input = await c.readStdin();
    // 입력 나누기
    let items = [];
    const lineGroups = [];
    if (o.I != null) {
      for (const l of input.split('\n')) { const t = l.replace(/^[ \t]+/, ''); if (t !== '') items.push(t); }
      if (o.E != null) { const q = items.indexOf(o.E); if (q >= 0) items = items.slice(0, q); }
    } else if (o.nul || o.d != null) {
      const sep = o.nul ? '\0' : o.d;
      items = input.split(sep);
      if (items[items.length - 1] === '' || (o.d === '\n' && items[items.length - 1] === '')) items.pop();
    } else {
      // 공백 · 따옴표 · 역슬래시 처리
      let cur = null;
      let q = null;
      let lineItems = [];
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (q) {
          if (ch === q) { q = null; continue; }
          if (ch === '\n') { c.err(`xargs: unmatched ${q === '"' ? 'double' : 'single'} quote; by default quotes are special to xargs unless you use the -0 option\n`); return 1; }
          cur += ch;
          continue;
        }
        if (ch === '"' || ch === "'") { q = ch; if (cur == null) cur = ''; continue; }
        if (ch === '\\' && i + 1 < input.length) { cur = (cur || '') + input[++i]; continue; }
        if (ch === ' ' || ch === '\t' || ch === '\n') {
          if (cur != null) { items.push(cur); lineItems.push(cur); cur = null; }
          if (ch === '\n' && lineItems.length) { lineGroups.push(lineItems); lineItems = []; }
          continue;
        }
        cur = (cur || '') + ch;
      }
      if (q) { c.err(`xargs: unmatched ${q === '"' ? 'double' : 'single'} quote; by default quotes are special to xargs unless you use the -0 option\n`); return 1; }
      if (cur != null) { items.push(cur); lineItems.push(cur); }
      if (lineItems.length) lineGroups.push(lineItems);
      if (o.E != null) { const q2 = items.indexOf(o.E); if (q2 >= 0) items = items.slice(0, q2); }
    }
    // 실행 묶음
    const batches = [];
    if (o.I != null) items.forEach((it) => batches.push(cmd.map((a) => a.split(o.I).join(it))));
    else if (o.L) {
      for (let i = 0; i < lineGroups.length; i += o.L) batches.push(cmd.concat(...lineGroups.slice(i, i + o.L)));
    } else if (o.n) {
      for (let i = 0; i < items.length; i += o.n) batches.push(cmd.concat(items.slice(i, i + o.n)));
    } else if (items.length) batches.push(cmd.concat(items));
    if (!batches.length && !o.r && o.I == null) batches.push(cmd.slice());
    let st = 0;
    const io = Object.assign({}, c.io, { stdin: new LX.InStream('') });
    for (const argv of batches) {
      if (c.aborted) break;
      if (o.t) c.err(argv.join(' ') + (o.p ? ' ?...' : '') + '\n');
      // xargs 는 셸 함수 · 내장 명령이 아니라 PATH 의 실행 파일을 실행한다
      if (!argv[0].includes('/') && !c.m.findInPath(argv[0], c.env('PATH'))) {
        c.err(`xargs: ${argv[0]}: No such file or directory\n`);
        return 127;
      }
      const code = await c.sh.invoke(argv, io);
      if (code === 127 || code === 126) return code;
      if (code === 255) { c.err(`xargs: ${argv[0]}: exited with status 255; aborting\n`); return 124; }
      if (code > 128) { c.err(`xargs: ${argv[0]}: terminated by signal ${code - 128}\n`); return 125; }
      if (code) st = 123;
    }
    return st;
  });

  // ======================================================================= diff
  /** Myers 차분 → [{op:'=',a,b} | {op:'-',a} | {op:'+',b}] */
  function diffLines(A, B, eq) {
    const N = A.length, M = B.length;
    let s = 0;
    while (s < N && s < M && eq(A[s], B[s])) s++;
    let e = 0;
    while (e < N - s && e < M - s && eq(A[N - 1 - e], B[M - 1 - e])) e++;
    const a = A.slice(s, N - e), b = B.slice(s, M - e);
    const n = a.length, m = b.length;
    const ops = [];
    for (let i = 0; i < s; i++) ops.push({ op: '=', a: i, b: i });
    const max = n + m;
    const off = max + 1;
    let v = new Int32Array(2 * max + 3);
    const trace = [];
    let found = false;
    if (n === 0 || m === 0) found = true;
    const LIMIT = 4000;
    let D = 0;
    if (!found) {
      for (D = 0; D <= max && D <= LIMIT; D++) {
        trace.push(v.slice());
        for (let k = -D; k <= D; k += 2) {
          let x;
          if (k === -D || (k !== D && v[off + k - 1] < v[off + k + 1])) x = v[off + k + 1];
          else x = v[off + k - 1] + 1;
          let y = x - k;
          while (x < n && y < m && eq(a[x], b[y])) { x++; y++; }
          v[off + k] = x;
          if (x >= n && y >= m) { found = true; break; }
        }
        if (found) break;
      }
    }
    const mid = [];
    if (n === 0 || m === 0) {
      for (let i = 0; i < n; i++) mid.push({ op: '-', a: s + i });
      for (let j = 0; j < m; j++) mid.push({ op: '+', b: s + j });
    } else if (!found) {
      // 너무 다르면 통째로 바뀐 것으로
      for (let i = 0; i < n; i++) mid.push({ op: '-', a: s + i });
      for (let j = 0; j < m; j++) mid.push({ op: '+', b: s + j });
    } else {
      let x = n, y = m;
      const rev = [];
      for (let d = D; d > 0; d--) {
        const vv = trace[d];
        const k = x - y;
        let pk;
        if (k === -d || (k !== d && vv[off + k - 1] < vv[off + k + 1])) pk = k + 1; else pk = k - 1;
        const px = vv[off + pk];
        const py = px - pk;
        while (x > px && y > py) { rev.push({ op: '=', a: s + x - 1, b: s + y - 1 }); x--; y--; }
        if (x === px) rev.push({ op: '+', b: s + y - 1 }); else rev.push({ op: '-', a: s + x - 1 });
        x = px;
        y = py;
      }
      while (x > 0 && y > 0) { rev.push({ op: '=', a: s + x - 1, b: s + y - 1 }); x--; y--; }
      rev.reverse();
      // 같은 덩어리 안에서 '-' 를 '+' 보다 앞에
      let i = 0;
      while (i < rev.length) {
        if (rev[i].op === '=') { mid.push(rev[i]); i++; continue; }
        const del = [], add = [];
        while (i < rev.length && rev[i].op !== '=') { (rev[i].op === '-' ? del : add).push(rev[i]); i++; }
        mid.push(...del, ...add);
      }
    }
    ops.push(...mid);
    for (let i = 0; i < e; i++) ops.push({ op: '=', a: N - e + i, b: M - e + i });
    return ops;
  }
  LX.diffLines = diffLines;

  /** 바뀐 덩어리 목록 */
  function hunksOf(ops) {
    const hunks = [];
    let ai = 0, bi = 0;
    let cur = null;
    for (const o of ops) {
      if (o.op === '=') { if (cur) { hunks.push(cur); cur = null; } ai++; bi++; continue; }
      if (!cur) cur = { a0: ai, b0: bi, del: [], add: [] };
      if (o.op === '-') { cur.del.push(o.a); ai++; } else { cur.add.push(o.b); bi++; }
    }
    if (cur) hunks.push(cur);
    return hunks;
  }

  def('diff', async (c) => {
    const r = opts(c.args, 'uU:qsrNiwbBEyacC:tT', {
      unified: 'U?', brief: 'q', 'report-identical-files': 's', recursive: 'r', 'new-file': 'N', 'ignore-case': 'i', 'ignore-all-space': 'w',
      'ignore-space-change': 'b', 'ignore-blank-lines': 'B', 'side-by-side': 'y', text: 'a', color: 'color?', normal: 'normal', context: 'C?',
      'ignore-tab-expansion': 'E', 'strip-trailing-cr': 'scr', label: 'label:', 'suppress-common-lines': 'scl', width: 'W:', 'expand-tabs': 't', 'initial-tab': 'T'
    }, { digits: true });
    if (r.bad) return badOpt(c, 'diff', r.bad, 2);
    const f = r.f;
    if (r.ops.length < 2) { c.err(r.ops.length ? `diff: missing operand after '${r.ops[0]}'\ndiff: Try 'diff --help' for more information.\n` : `diff: missing operand after 'diff'\ndiff: Try 'diff --help' for more information.\n`); return 2; }
    if (r.ops.length > 2) { c.err(`diff: extra operand '${r.ops[2]}'\ndiff: Try 'diff --help' for more information.\n`); return 2; }
    let ctxN = 3;
    let fmt = 'normal';
    if (f.u || f.U != null) { fmt = 'unified'; if (f.U != null && f.U !== true) ctxN = +f.U; }
    if (f.c || f.C != null) { fmt = 'context'; if (f.C != null && f.C !== true) ctxN = +f.C; }
    if (f.y) fmt = 'side';
    if (f['#'] != null) ctxN = +f['#'];
    const norm = (l) => {
      if (f.scr) l = l.replace(/\r$/, '');
      if (f.i) l = l.toLowerCase();
      if (f.w) l = l.replace(/\s+/g, '');
      else if (f.b) l = l.replace(/\s+/g, ' ').replace(/ $/, '');
      return l;
    };
    const optStr = c.args.filter((a) => a.startsWith('-') && a !== '-').join(' ');
    let status = 0;
    const out = [];
    const flush = () => { if (out.length) { c.out(out.join('')); out.length = 0; } };
    const load = async (name) => {
      if (name === '-') return { text: await c.readStdin(), node: null };
      const abs = c.resolve(name);
      try {
        const n = c.fs.stat(abs, c.cred);
        if (n.t === 'd') return { dir: true, abs, node: n };
        return { text: c.fs.readFile(abs, c.cred), node: n, abs };
      } catch (e) { return { err: e.message }; }
    };
    const stamp = (node) => (node ? LX.fullTime(c.m, node.mt) : LX.fullTime(c.m, c.m.now()));

    function diffFiles(na, nb, A, B, header) {
      if ((A.text.includes('\0') || B.text.includes('\0')) && !f.a) {
        if (A.text !== B.text) { out.push(`Binary files ${na} and ${nb} differ\n`); return 1; }
        return 0;
      }
      const la = A.text.split('\n'), lb = B.text.split('\n');
      const noNlA = A.text !== '' && !A.text.endsWith('\n'), noNlB = B.text !== '' && !B.text.endsWith('\n');
      if (!noNlA) la.pop();
      if (!noNlB) lb.pop();
      const na2 = la.map(norm), nb2 = lb.map(norm);
      const ops = diffLines(na2, nb2, (x, y) => x === y);
      let hunks = hunksOf(ops);
      if (f.B) hunks = hunks.filter((h) => !(h.del.every((i) => la[i].trim() === '') && h.add.every((j) => lb[j].trim() === '')));
      // 마지막 줄 줄바꿈 차이
      if (!hunks.length && noNlA !== noNlB && la.length && lb.length && la[la.length - 1] === lb[lb.length - 1]) hunks = [{ a0: la.length - 1, b0: lb.length - 1, del: [la.length - 1], add: [lb.length - 1] }];
      if (!hunks.length) {
        if (f.s) out.push(`Files ${na} and ${nb} are identical\n`);
        return 0;
      }
      if (f.q) { out.push(`Files ${na} and ${nb} differ\n`); return 1; }
      if (header) out.push(header + '\n');
      const lineA = (i) => la[i] + '\n' + (noNlA && i === la.length - 1 ? '\\ No newline at end of file\n' : '');
      const lineB = (j) => lb[j] + '\n' + (noNlB && j === lb.length - 1 ? '\\ No newline at end of file\n' : '');
      const rng = (s, e) => (s === e ? String(s) : `${s},${e}`);
      if (fmt === 'normal') {
        for (const h of hunks) {
          const a1 = h.a0 + 1, a2 = h.a0 + h.del.length, b1 = h.b0 + 1, b2 = h.b0 + h.add.length;
          if (!h.add.length) out.push(`${rng(a1, a2)}d${h.b0}\n`);
          else if (!h.del.length) out.push(`${h.a0}a${rng(b1, b2)}\n`);
          else out.push(`${rng(a1, a2)}c${rng(b1, b2)}\n`);
          h.del.forEach((i) => out.push('< ' + lineA(i)));
          if (h.del.length && h.add.length) out.push('---\n');
          h.add.forEach((j) => out.push('> ' + lineB(j)));
        }
        return 1;
      }
      if (fmt === 'side') {
        const W = 130, half = 61;
        const pad = (s) => { s = s.replace(/\t/g, '        '); return s.length > half ? s.slice(0, half) : s + ' '.repeat(half - s.length); };
        let ai = 0, bi = 0;
        for (const o of ops) {
          if (o.op === '=') { if (!f.scl) out.push(pad(la[ai]) + '   ' + ' ' + ' ' + lb[bi] + '\n'); ai++; bi++; continue; }
          if (o.op === '-') { out.push(pad(la[ai]) + '  <\n'); ai++; } else { out.push(' '.repeat(half) + '  >  ' + lb[bi] + '\n'); bi++; }
        }
        void W;
        return 1;
      }
      // 통합 · 문맥 형식: 가까운 덩어리 묶기
      const groups = [];
      for (const h of hunks) {
        const g = groups[groups.length - 1];
        if (g && h.a0 - (g[g.length - 1].a0 + g[g.length - 1].del.length) <= 2 * ctxN) g.push(h); else groups.push([h]);
      }
      if (fmt === 'unified') {
        out.push(`--- ${f.label && f.label[0] ? f.label : na}\t${stamp(A.node)}\n+++ ${nb}\t${stamp(B.node)}\n`);
        for (const g of groups) {
          const first = g[0], last = g[g.length - 1];
          const as = Math.max(0, first.a0 - ctxN);
          const ae = Math.min(la.length, last.a0 + last.del.length + ctxN);
          const bs = Math.max(0, first.b0 - ctxN);
          const be = Math.min(lb.length, last.b0 + last.add.length + ctxN);
          const al = ae - as, bl = be - bs;
          const hr = (s, l) => (l === 1 ? `${s + 1}` : l === 0 ? `${s},0` : `${s + 1},${l}`);
          out.push(`@@ -${hr(as, al)} +${hr(bs, bl)} @@\n`);
          let ai = as, bi = bs;
          for (const h of g) {
            while (ai < h.a0) { out.push(' ' + lineA(ai)); ai++; bi++; }
            h.del.forEach((i) => out.push('-' + lineA(i)));
            h.add.forEach((j) => out.push('+' + lineB(j)));
            ai += h.del.length;
            bi += h.add.length;
          }
          while (ai < ae) { out.push(' ' + lineA(ai)); ai++; bi++; }
        }
        return 1;
      }
      // context
      out.push(`*** ${na}\t${stamp(A.node)}\n--- ${nb}\t${stamp(B.node)}\n`);
      for (const g of groups) {
        const first = g[0], last = g[g.length - 1];
        const as = Math.max(0, first.a0 - ctxN), ae = Math.min(la.length, last.a0 + last.del.length + ctxN);
        const bs = Math.max(0, first.b0 - ctxN), be = Math.min(lb.length, last.b0 + last.add.length + ctxN);
        out.push('***************\n');
        const cr = (s, e) => (e - s <= 1 ? String(e) : `${s + 1},${e}`);
        out.push(`*** ${cr(as, ae)} ****\n`);
        if (g.some((h) => h.del.length)) {
          const mark = new Map();
          g.forEach((h) => h.del.forEach((i) => mark.set(i, h.add.length ? '! ' : '- ')));
          for (let i = as; i < ae; i++) out.push((mark.get(i) || '  ') + lineA(i));
        }
        out.push(`--- ${cr(bs, be)} ----\n`);
        if (g.some((h) => h.add.length)) {
          const mark = new Map();
          g.forEach((h) => h.add.forEach((j) => mark.set(j, h.del.length ? '! ' : '+ ')));
          for (let j = bs; j < be; j++) out.push((mark.get(j) || '  ') + lineB(j));
        }
      }
      return 1;
    }

    async function diffDirs(da, db) {
      let names;
      let na, nb;
      try { na = c.fs.readdir(c.resolve(da), c.cred); } catch (e) { c.err(`diff: ${da}: ${e.message}\n`); return 2; }
      try { nb = c.fs.readdir(c.resolve(db), c.cred); } catch (e) { c.err(`diff: ${db}: ${e.message}\n`); return 2; }
      names = [...new Set([...na, ...nb])].sort();
      let st = 0;
      for (const nm of names) {
        const pa = da.replace(/\/$/, '') + '/' + nm, pb = db.replace(/\/$/, '') + '/' + nm;
        const inA = na.includes(nm), inB = nb.includes(nm);
        if (!inA || !inB) {
          if (f.N) {
            const A = inA ? await load(pa) : { text: '', node: null };
            const B = inB ? await load(pb) : { text: '', node: null };
            if (A.dir || B.dir) continue;
            st = Math.max(st, diffFiles(pa, pb, A, B, `diff ${optStr ? optStr + ' ' : ''}${pa} ${pb}`));
            continue;
          }
          out.push(`Only in ${inA ? da.replace(/\/$/, '') : db.replace(/\/$/, '')}: ${nm}\n`);
          st = Math.max(st, 1);
          continue;
        }
        const A = await load(pa), B = await load(pb);
        if (A.err || B.err) { flush(); c.err(`diff: ${A.err ? pa : pb}: ${A.err || B.err}\n`); st = 2; continue; }
        if (A.dir && B.dir) {
          if (f.r) st = Math.max(st, await diffDirs(pa, pb));
          else out.push(`Common subdirectories: ${pa} and ${pb}\n`);
          continue;
        }
        if (A.dir || B.dir) { out.push(`File ${A.dir ? pa : pb} is a directory while file ${A.dir ? pb : pa} is a regular file\n`); st = Math.max(st, 1); continue; }
        st = Math.max(st, diffFiles(pa, pb, A, B, f.q ? null : `diff ${optStr ? optStr + ' ' : ''}${pa} ${pb}`));
      }
      return st;
    }

    let [na, nb] = r.ops;
    let A = await load(na), B = await load(nb);
    if (A.err) { c.err(`diff: ${na}: ${A.err}\n`); return 2; }
    if (B.err) { c.err(`diff: ${nb}: ${B.err}\n`); return 2; }
    if (A.dir && B.dir) status = await diffDirs(na, nb);
    else {
      if (A.dir) { na = na.replace(/\/$/, '') + '/' + P().basename(nb); A = await load(na); if (A.err) { c.err(`diff: ${na}: ${A.err}\n`); return 2; } }
      if (B.dir) { nb = nb.replace(/\/$/, '') + '/' + P().basename(na); B = await load(nb); if (B.err) { c.err(`diff: ${nb}: ${B.err}\n`); return 2; } }
      status = diffFiles(na, nb, A, B, null);
    }
    flush();
    return status;
  });

  // ======================================================================= cmp
  def('cmp', async (c) => {
    const r = opts(c.args, 'lsbn:i:', { verbose: 'l', silent: 's', quiet: 's', 'print-bytes': 'b', bytes: 'n:', 'ignore-initial': 'i:' });
    if (r.bad) return badOpt(c, 'cmp', r.bad, 2);
    const f = r.f;
    if (!r.ops.length) { c.err("cmp: missing operand after 'cmp'\ncmp: Try 'cmp --help' for more information.\n"); return 2; }
    const na = r.ops[0], nb = r.ops[1] || '-';
    const A = await readOne(c, na), B = await readOne(c, nb);
    if (A.err) { c.err(`cmp: ${na}: ${A.err}\n`); return 2; }
    if (B.err) { c.err(`cmp: ${nb}: ${B.err}\n`); return 2; }
    let a = utf8(A.text), b = utf8(B.text);
    if (f.n != null) { a = a.slice(0, +f.n); b = b.slice(0, +f.n); }
    const n = Math.min(a.length, b.length);
    let line = 1;
    let diff = false;
    for (let i = 0; i < n; i++) {
      if (a[i] !== b[i]) {
        diff = true;
        if (f.s) return 1;
        if (f.l) { c.out(`${String(i + 1)} ${a[i].toString(8).padStart(3)} ${b[i].toString(8).padStart(3)}\n`); continue; }
        c.out(`${na} ${nb} differ: byte ${i + 1}, line ${line}\n`);
        return 1;
      }
      if (a[i] === 10) line++;
    }
    if (a.length !== b.length) {
      if (!f.s) {
        const short = a.length < b.length ? na : nb;
        if (n === 0) c.err(`cmp: EOF on ${short} which is empty\n`);
        else c.err(`cmp: EOF on ${short} after byte ${n}, line ${line - ((a.length < b.length ? a : b)[n - 1] === 10 ? 1 : 0)}\n`);
      }
      return 1;
    }
    return diff ? 1 : 0;
  });

  // ======================================================================= comm
  def('comm', async (c) => {
    const r = opts(c.args, '123z', { 'check-order': 'co', 'nocheck-order': 'nco', 'output-delimiter': 'od:', total: 'total', 'zero-terminated': 'z' });
    if (r.bad) return badOpt(c, 'comm', r.bad);
    const f = r.f;
    if (r.ops.length < 2) return badOpt(c, 'comm', r.ops.length ? `missing operand after '${r.ops[0]}'` : 'missing operand');
    if (r.ops.length > 2) return badOpt(c, 'comm', `extra operand '${r.ops[2]}'`);
    const A = await readOne(c, r.ops[0]);
    if (A.err) { c.err(`comm: ${r.ops[0]}: ${A.err}\n`); return 1; }
    const B = await readOne(c, r.ops[1]);
    if (B.err) { c.err(`comm: ${r.ops[1]}: ${B.err}\n`); return 1; }
    const la = splitLines(A.text), lb = splitLines(B.text);
    const cmp = cmpFor(c);
    const od = f.od != null ? f.od : '\t';
    const pre = [
      '',
      f['1'] ? '' : od,
      (f['1'] ? '' : od) + (f['2'] ? '' : od)
    ];
    let i = 0, j = 0;
    let out = '';
    const warned = [false, false];
    let unsorted = false;
    const tot = [0, 0, 0];
    const check = (arr, k, which) => {
      if (f.nco || k === 0 || warned[which]) return;
      if (cmp(arr[k - 1], arr[k]) > 0) {
        warned[which] = true;
        unsorted = true;
        if (out) { c.out(out); out = ''; }
        c.err(`comm: file ${which + 1} is not in sorted order\n`);
      }
    };
    while (i < la.length || j < lb.length) {
      let r2;
      if (i >= la.length) r2 = 1; else if (j >= lb.length) r2 = -1; else r2 = cmp(la[i], lb[j]);
      if (r2 < 0) { check(la, i, 0); tot[0]++; if (!f['1']) out += la[i] + '\n'; i++; } else if (r2 > 0) { check(lb, j, 1); tot[1]++; if (!f['2']) out += pre[1] + lb[j] + '\n'; j++; } else { check(la, i, 0); check(lb, j, 1); tot[2]++; if (!f['3']) out += pre[2] + la[i] + '\n'; i++; j++; }
    }
    if (f.total) out += `${tot[0]}${od}${tot[1]}${od}${tot[2]}${od}total\n`;
    c.out(out);
    if (unsorted) { c.err('comm: input is not in sorted order\n'); return 1; }
    return 0;
  });

  // ======================================================================= paste
  def('paste', async (c) => {
    const r = opts(c.args, 'd:sz', { delimiters: 'd:', serial: 's', 'zero-terminated': 'z' });
    if (r.bad) return badOpt(c, 'paste', r.bad);
    const f = r.f;
    const dl = f.d != null ? Array.from(f.d.replace(/\\(.)/g, (m, x) => ({ n: '\n', t: '\t', '\\': '\\', 0: '\u0000' }[x] || x))).map((x) => (x === '\u0000' ? '' : x)) : ['\t'];
    if (f.d != null && f.d === '') dl.splice(0, dl.length, '');
    const names = r.ops.length ? r.ops : ['-'];
    const files = [];
    let stdinUsed = false;
    for (const nm of names) {
      if (nm === '-') {
        if (stdinUsed) { files.push(null); continue; }
        stdinUsed = true;
      }
      const rd = await readOne(c, nm);
      if (rd.err) { c.err(`paste: ${nm}: ${rd.err}\n`); return 1; }
      files.push(splitLines(rd.text));
    }
    // '-' 를 여러 번 주면 표준 입력 줄을 돌아가며 나눠 준다
    if (files.some((x) => x === null)) {
      const idx = names.map((n, i) => (n === '-' ? i : -1)).filter((i) => i >= 0);
      const src = files[idx[0]];
      idx.forEach((fi) => { files[fi] = []; });
      src.forEach((l, k) => files[idx[k % idx.length]].push(l));
    }
    let out = '';
    if (f.s) {
      for (const ls of files) {
        let s = '';
        ls.forEach((l, k) => { s += (k ? dl[(k - 1) % dl.length] : '') + l; });
        out += s + '\n';
      }
    } else {
      const n = Math.max(0, ...files.map((x) => x.length));
      for (let i = 0; i < n; i++) {
        let s = '';
        files.forEach((ls, k) => { s += (k ? dl[(k - 1) % dl.length] : '') + (ls[i] != null ? ls[i] : ''); });
        out += s + '\n';
      }
    }
    c.out(out);
    return 0;
  });

  // ======================================================================= join
  def('join', async (c) => {
    const r = opts(c.args, 't:1:2:j:a:v:e:o:i', { 'ignore-case': 'i', header: 'header', 'check-order': 'co', 'nocheck-order': 'nco', 'zero-terminated': 'z' }, { multi: ['a', 'v'] });
    if (r.bad) return badOpt(c, 'join', r.bad);
    const f = r.f;
    if (r.ops.length < 2) return badOpt(c, 'join', r.ops.length ? `missing operand after '${r.ops[0]}'` : 'missing operand');
    const f1 = +(f['1'] || f.j || 1), f2 = +(f['2'] || f.j || 1);
    const A = await readOne(c, r.ops[0]);
    if (A.err) { c.err(`join: ${r.ops[0]}: ${A.err}\n`); return 1; }
    const B = await readOne(c, r.ops[1]);
    if (B.err) { c.err(`join: ${r.ops[1]}: ${B.err}\n`); return 1; }
    const sep = f.t;
    const split = (l) => (sep != null ? l.split(sep) : l.trim().split(/[ \t]+/).filter((x) => x !== ''));
    const osep = sep != null ? sep : ' ';
    const ra = splitLines(A.text).map(split), rb = splitLines(B.text).map(split);
    const key = (row, k) => { const v = row[k - 1] || ''; return f.i ? v.toLowerCase() : v; };
    const cmp = cmpFor(c);
    const showA = (f.a || []).map(String), showV = (f.v || []).map(String);
    const empty = f.e != null ? f.e : '';
    const fmtRow = (x, y) => {
      if (f.o && f.o !== 'auto') {
        return f.o.split(/[, ]+/).map((spec) => {
          if (spec === '0') return x ? x[f1 - 1] : y[f2 - 1];
          const [fi, fld] = spec.split('.');
          const row = fi === '1' ? x : y;
          return row && row[+fld - 1] != null ? row[+fld - 1] : empty;
        }).join(osep);
      }
      const k = x ? x[f1 - 1] : y[f2 - 1];
      const restA = x ? x.filter((v, i) => i !== f1 - 1) : [];
      const restB = y ? y.filter((v, i) => i !== f2 - 1) : [];
      return [k, ...restA, ...restB].join(osep);
    };
    let out = '';
    let i = 0, j = 0;
    if (f.header && ra.length && rb.length) { out += fmtRow(ra[0], rb[0]) + '\n'; i = 1; j = 1; }
    while (i < ra.length || j < rb.length) {
      let r2;
      if (i >= ra.length) r2 = 1; else if (j >= rb.length) r2 = -1; else r2 = cmp(key(ra[i], f1), key(rb[j], f2));
      if (r2 < 0) { if (showA.includes('1') || showV.includes('1')) out += fmtRow(ra[i], null) + '\n'; i++; continue; }
      if (r2 > 0) { if (showA.includes('2') || showV.includes('2')) out += fmtRow(null, rb[j]) + '\n'; j++; continue; }
      const k = key(ra[i], f1);
      let i2 = i, j2 = j;
      while (i2 < ra.length && key(ra[i2], f1) === k) i2++;
      while (j2 < rb.length && key(rb[j2], f2) === k) j2++;
      if (!showV.length) for (let x = i; x < i2; x++) for (let y = j; y < j2; y++) out += fmtRow(ra[x], rb[y]) + '\n';
      i = i2;
      j = j2;
    }
    c.out(out);
    return 0;
  });

  // ======================================================================= column
  def('column', async (c) => {
    const r = opts(c.args, 'ts:o:c:xN:R:LJdH:lhVe', { table: 't', separator: 's:', 'output-separator': 'o:', 'output-width': 'c:', fillrows: 'x', 'table-columns': 'N:', 'table-right': 'R:', 'keep-empty-lines': 'L', json: 'J', 'table-noheadings': 'd', 'table-name': 'n:' });
    if (r.bad) return badOpt(c, 'column', r.bad);
    const f = r.f;
    let text = '';
    const st = await LX.readInputs(c, r.ops, 'column', (t) => { text += t; });
    let lines = splitLines(text);
    const width = +(f.c || c.env('COLUMNS') || 80);
    if (f.t) {
      if (!f.L) lines = lines.filter((l) => l.trim() !== '');
      const seps = f.s != null ? LX.escapes(f.s) : null;
      const rows = lines.map((l) => (seps == null ? l.trim().split(/[ \t]+/) : l.split(new RegExp('[' + seps.replace(/[\\\]^-]/g, '\\$&') + ']'))));
      let heads = null;
      if (f.N && f.N !== true) heads = String(f.N).split(',');
      const all = heads && !f.d ? [heads, ...rows] : rows;
      const ncol = Math.max(0, ...all.map((x) => x.length));
      const w = [];
      for (let k = 0; k < ncol; k++) w.push(Math.max(0, ...all.map((row) => (row[k] != null ? LX.visLen(row[k]) : 0))));
      const osep = f.o != null ? f.o : '  ';
      const right = f.R ? String(f.R).split(',').map(Number) : [];
      let out = '';
      for (const row of all) {
        let s = '';
        row.forEach((cell, k) => {
          const last = k === row.length - 1;
          const pad = ' '.repeat(Math.max(0, w[k] - LX.visLen(cell)));
          if (right.includes(k + 1)) s += pad + cell + (last ? '' : osep);
          else s += cell + (last ? '' : pad + osep);
        });
        out += s + '\n';
      }
      c.out(out);
      return st;
    }
    // 기본: 가로 폭에 맞춰 여러 열로 (탭 정렬)
    const items = lines.filter((l) => l !== '');
    if (!items.length) return st;
    let maxlen = Math.max(...items.map((x) => LX.visLen(x)));
    maxlen = (maxlen + 8) & ~7;
    const numcols = Math.max(1, Math.floor(width / maxlen));
    let out = '';
    if (f.x) {
      for (let i = 0; i < items.length; i += numcols) {
        const row = items.slice(i, i + numcols);
        out += row.map((it, k) => (k === row.length - 1 ? it : it + '\t'.repeat(Math.ceil((maxlen - Math.floor(LX.visLen(it) / 8) * 8) / 8)))).join('') + '\n';
      }
    } else {
      const rows = Math.ceil(items.length / numcols);
      for (let rr = 0; rr < rows; rr++) {
        let s = '';
        for (let k = 0; k < numcols; k++) {
          const idx = k * rows + rr;
          if (idx >= items.length) break;
          const it = items[idx];
          const last = (k + 1) * rows + rr >= items.length;
          s += last ? it : it + '\t'.repeat(Math.ceil((maxlen - Math.floor(LX.visLen(it) / 8) * 8) / 8));
        }
        out += s + '\n';
      }
    }
    c.out(out);
    return st;
  });

  // ======================================================================= rev · fold · fmt
  def('rev', async (c) => LX.readInputs(c, c.args.filter((a) => a === '-' || !a.startsWith('-')), 'rev', (t) => {
    const noNl = t !== '' && !t.endsWith('\n');
    const ls = splitLines(t);
    c.out(ls.map((l) => Array.from(l).reverse().join('')).join('\n') + (ls.length && !noNl ? '\n' : ''));
  }));

  def('fold', async (c) => {
    const r = opts(c.args, 'bsw:', { bytes: 'b', spaces: 's', width: 'w:' }, { digits: true });
    if (r.bad) return badOpt(c, 'fold', r.bad);
    const f = r.f;
    const w = +(f.w || f['#'] || 80);
    if (!(w > 0)) { c.err(`fold: invalid number of columns: '${f.w}'\n`); return 1; }
    return LX.readInputs(c, r.ops, 'fold', (t) => {
      const noNl = t !== '' && !t.endsWith('\n');
      const out = splitLines(t).map((line) => {
        const res = [];
        let cur = '';
        let col = 0;
        const adv = (ch, cc) => (f.b ? cc + 1 : ch === '\t' ? cc + 8 - (cc % 8) : ch === '\b' ? Math.max(0, cc - 1) : ch === '\r' ? 0 : cc + 1);
        for (const ch of Array.from(line)) {
          const nc = adv(ch, col);
          if (nc > w) {
            if (f.s) {
              const sp = cur.search(/[ \t][^ \t]*$/);
              if (sp >= 0) {
                res.push(cur.slice(0, sp + 1));
                cur = cur.slice(sp + 1);
                col = 0;
                for (const x of Array.from(cur)) col = adv(x, col);
                const nc2 = adv(ch, col);
                if (nc2 <= w) { cur += ch; col = nc2; continue; }
              }
            }
            res.push(cur);
            cur = '';
            col = 0;
          }
          cur += ch;
          col = adv(ch, col);
        }
        res.push(cur);
        return res.join('\n');
      });
      c.out(out.join('\n') + (out.length && !noNl ? '\n' : ''));
    });
  });

  def('fmt', async (c) => {
    const r = opts(c.args, 'w:g:ustcp:', { width: 'w:', goal: 'g:', uniform: 'u', 'split-only': 's', 'tagged-paragraph': 't', 'crown-margin': 'c', prefix: 'p:' }, { digits: true });
    if (r.bad) return badOpt(c, 'fmt', r.bad);
    const f = r.f;
    const w = +(f.w || f['#'] || 75);
    return LX.readInputs(c, r.ops, 'fmt', (t) => {
      const lines = splitLines(t);
      let out = '';
      let para = [];
      const flushP = () => {
        if (!para.length) return;
        const indent = /^[ \t]*/.exec(para[0])[0];
        if (f.s) {
          for (const l of para) {
            const words = l.trim().split(/\s+/);
            let cur = indent;
            for (const wd of words) {
              if (cur.trim() && LX.visLen(cur + ' ' + wd) > w) { out += cur + '\n'; cur = indent + wd; } else cur += (cur.trim() ? ' ' : '') + wd;
            }
            out += cur + '\n';
          }
          para = [];
          return;
        }
        const words = para.join(' ').trim().split(/\s+/);
        let cur = indent;
        for (const wd of words) {
          if (cur.trim() && LX.visLen(cur + ' ' + wd) > w) { out += cur + '\n'; cur = indent + wd; } else cur += (cur.trim() ? ' ' : '') + wd;
        }
        out += cur + '\n';
        para = [];
      };
      for (const l of lines) {
        if (l.trim() === '') { flushP(); out += '\n'; continue; }
        if (para.length && /^[ \t]*/.exec(l)[0] !== /^[ \t]*/.exec(para[0])[0] && !f.c && !f.t) flushP();
        para.push(l);
      }
      flushP();
      c.out(out);
    });
  });

  // ======================================================================= shuf
  def('shuf', async (c) => {
    const r = opts(c.args, 'n:ei:ro:z', { 'head-count': 'n:', echo: 'e', 'input-range': 'i:', repeat: 'r', output: 'o:', 'random-source': 'rs:', 'zero-terminated': 'z' });
    if (r.bad) return badOpt(c, 'shuf', r.bad);
    const f = r.f;
    let items;
    if (f.e) items = r.ops.slice();
    else if (f.i) {
      const m = /^(\d+)-(\d+)$/.exec(f.i);
      if (!m || +m[2] + 1 < +m[1]) { c.err(`shuf: invalid input range: '${f.i}'\n`); return 1; }
      if (+m[2] - +m[1] > 10000000) { c.err('shuf: 가상 터미널에서는 범위가 너무 큽니다\n'); return 1; }
      items = [];
      for (let k = +m[1]; k <= +m[2]; k++) items.push(String(k));
    } else {
      if (r.ops.length > 1) { c.err(`shuf: extra operand '${r.ops[1]}'\nTry 'shuf --help' for more information.\n`); return 1; }
      const rd = await readOne(c, r.ops[0] || '-');
      if (rd.err) { c.err(`shuf: ${r.ops[0]}: ${rd.err}\n`); return 1; }
      items = splitLines(rd.text);
    }
    let n = f.n != null ? +f.n : Infinity;
    if (f.n != null && !(n >= 0)) { c.err(`shuf: invalid line count: '${f.n}'\n`); return 1; }
    let res = [];
    if (f.r) {
      if (!items.length) { if (n) { c.err('shuf: no lines to repeat\n'); return 1; } } else {
        if (n === Infinity) n = c.session.headless ? 1000 : 10000;
        for (let k = 0; k < n; k++) res.push(items[Math.floor(Math.random() * items.length)]);
      }
    } else {
      const a = items.slice();
      for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; }
      res = a.slice(0, Math.min(n, a.length));
    }
    const out = joinLines(res);
    if (f.o) { const er = writeOut(c, f.o, out, false); if (er) { c.err(`shuf: ${f.o}: ${er}\n`); return 1; } return 0; }
    c.out(out);
    return 0;
  });

  // ======================================================================= seq
  def('seq', async (c) => {
    const args = c.args;
    let sep = '\n', eqw = false, fmt = null;
    const nums = [];
    for (let k = 0; k < args.length; k++) {
      const a = args[k];
      if (nums.length || /^-?(\d|\.\d)/.test(a) || /^[+-]?(inf|nan)/i.test(a)) { nums.push(a); continue; }
      if (a === '--') { nums.push(...args.slice(k + 1)); break; }
      let m;
      if ((m = /^--separator(?:=(.*))?$/s.exec(a))) sep = m[1] != null ? m[1] : args[++k];
      else if ((m = /^--format(?:=(.*))?$/s.exec(a))) fmt = m[1] != null ? m[1] : args[++k];
      else if (a === '--equal-width') eqw = true;
      else if (a === '--help') { c.out('Usage: seq [OPTION]... LAST\n  or:  seq [OPTION]... FIRST LAST\n  or:  seq [OPTION]... FIRST INCREMENT LAST\nPrint numbers from FIRST to LAST, in steps of INCREMENT.\n'); return 0; }
      else if (a === '--version') { c.out('seq (GNU coreutils) 9.4\n'); return 0; }
      else if (a.startsWith('--')) return badOpt(c, 'seq', `unrecognized option '${a}'`);
      else if (a.startsWith('-')) {
        for (let j = 1; j < a.length; j++) {
          const ch = a[j];
          const rest = a.slice(j + 1);
          if (ch === 'w') eqw = true;
          else if (ch === 's') { sep = rest !== '' ? rest : args[++k]; break; } else if (ch === 'f') { fmt = rest !== '' ? rest : args[++k]; break; } else return badOpt(c, 'seq', `invalid option -- '${ch}'`);
        }
      } else nums.push(a);
    }
    if (!nums.length) return badOpt(c, 'seq', 'missing operand');
    if (nums.length > 3) return badOpt(c, 'seq', `extra operand '${nums[3]}'`);
    for (const x of nums) if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(x) && !/^[+-]?(inf|infinity|nan)$/i.test(x)) return badOpt(c, 'seq', `invalid floating point argument: '${x}'`);
    const first = nums.length > 1 ? +nums[0] : 1;
    const incr = nums.length > 2 ? +nums[1] : 1;
    const last = +nums[nums.length - 1];
    if (incr === 0) return badOpt(c, 'seq', `invalid Zero increment value: '${nums[1]}'`);
    if (isNaN(first) || isNaN(incr) || isNaN(last)) return badOpt(c, 'seq', `invalid 'not-a-number' argument: '${nums.find((x) => /nan/i.test(x))}'`);
    const decs = (s) => { if (/[eE]/.test(s)) return 0; const k = s.indexOf('.'); return k < 0 ? 0 : s.length - k - 1; };
    const prec = Math.max(nums.length > 1 ? decs(nums[0]) : 0, nums.length > 2 ? decs(nums[1]) : 0);
    let fmtFn;
    if (fmt != null) {
      const specs = fmt.replace(/%%/g, '').match(/%[-+ #0']*\d*(\.\d*)?[a-zA-Z]/g) || [];
      if (!specs.length) { c.err(`seq: format '${fmt}' has no % directive\n`); return 1; }
      if (specs.length > 1) { c.err(`seq: format '${fmt}' has too many % directives\n`); return 1; }
      if (!/[eEfFgGaA]$/.test(specs[0])) { c.err(`seq: format '${fmt}' has unknown ${specs[0].replace(/^%[-+ #0']*\d*(\.\d*)?/, '%')} directive\n`); return 1; }
      fmtFn = (v) => csprintf(fmt, [v], { num: (x) => x, str: String, chr: String });
    } else fmtFn = (v) => (prec ? v.toFixed(prec) : Number.isInteger(v) ? (Math.abs(v) < 1e21 ? BigInt(v).toString() : String(v)) : fmtG(v, 6));
    let width = 0;
    if (eqw && fmt == null) width = Math.max(fmtFn(first).length, fmtFn(last).length);
    const pad = (s) => {
      if (!width || s.length >= width) return s;
      return s[0] === '-' ? '-' + s.slice(1).padStart(width - 1, '0') : s.padStart(width, '0');
    };
    const cap = c.session.headless ? 2000000 : 5000000;
    let buf = [];
    let count = 0;
    for (let i = 0; ; i++) {
      const v = first + i * incr;
      if (incr > 0 ? v > last + Math.abs(incr) * 1e-10 : v < last - Math.abs(incr) * 1e-10) break;
      buf.push(pad(fmtFn(v)));
      if (++count >= cap) break;
      if (buf.length >= 50000) {
        c.out(buf.join(sep) + sep);
        buf = [];
        if (c.tty && !c.session.headless) await c.sleep(0);
        if (c.aborted) return 130;
      }
    }
    if (buf.length) c.out(buf.join(sep) + '\n');
    else if (count) c.out('');
    return 0;
  });

  // ======================================================================= expr
  class ExprErr extends Error { constructor(msg, code = 2) { super(msg); this.code = code; } }
  def('expr', async (c) => {
    const t = c.args.slice();
    if (t.length === 1 && t[0] === '--help') { c.out('Usage: expr EXPRESSION\n  or:  expr OPTION\n'); return 0; }
    if (t.length === 1 && t[0] === '--version') { c.out('expr (GNU coreutils) 9.4\n'); return 0; }
    if (t[0] === '--') t.shift();
    if (!t.length) { c.err("expr: missing operand\nTry 'expr --help' for more information.\n"); return 2; }
    let p = 0;
    const isInt = (v) => /^[-+]?\d+$/.test(String(v));
    const big = (v) => { if (!isInt(v)) throw new ExprErr('non-integer argument'); return BigInt(v); };
    const isNull = (v) => v === '' || /^-?0+$/.test(String(v));
    const cmp = cmpFor(c);
    const need = () => {
      if (p >= t.length) throw new ExprErr(`syntax error: missing argument after '${t[p - 1]}'`);
    };
    const orE = () => {
      let l = andE();
      while (t[p] === '|') { p++; need(); const r = andE(); l = !isNull(l) ? l : (!isNull(r) ? r : '0'); }
      return l;
    };
    const andE = () => {
      let l = cmpE();
      while (t[p] === '&') { p++; need(); const r = cmpE(); l = !isNull(l) && !isNull(r) ? l : '0'; }
      return l;
    };
    const cmpE = () => {
      let l = addE();
      while (['<', '<=', '=', '==', '!=', '>=', '>'].includes(t[p])) {
        const op = t[p++];
        need();
        const r = addE();
        let d;
        if (isInt(l) && isInt(r)) { const a = BigInt(l), b = BigInt(r); d = a < b ? -1 : a > b ? 1 : 0; } else d = cmp(String(l), String(r));
        l = ({ '<': d < 0, '<=': d <= 0, '=': d === 0, '==': d === 0, '!=': d !== 0, '>=': d >= 0, '>': d > 0 }[op]) ? '1' : '0';
      }
      return l;
    };
    const addE = () => {
      let l = mulE();
      while (t[p] === '+' || t[p] === '-') {
        const op = t[p++];
        need();
        const r = mulE();
        l = String(op === '+' ? big(l) + big(r) : big(l) - big(r));
      }
      return l;
    };
    const mulE = () => {
      let l = matchE();
      while (t[p] === '*' || t[p] === '/' || t[p] === '%') {
        const op = t[p++];
        need();
        const r = matchE();
        const a = big(l), b = big(r);
        if (op !== '*' && b === 0n) throw new ExprErr('division by zero');
        l = String(op === '*' ? a * b : op === '/' ? a / b : a % b);
      }
      return l;
    };
    const doMatch = (s, re) => {
      let js;
      try { js = posixRe(re, {}); } catch (e) { throw new ExprErr(e.message); }
      const rx = mkRe('^(?:' + js + ')', '');
      const m = rx.exec(String(s));
      const hasGroup = /\\\(/.test(re);
      if (hasGroup) return m && m[1] !== undefined ? m[1] : '';
      return m ? String(m[0].length) : '0';
    };
    const matchE = () => {
      let l = prim();
      while (t[p] === ':') { p++; need(); const r = prim(); l = doMatch(l, r); }
      return l;
    };
    const prim = () => {
      need();
      const tok = t[p++];
      if (tok === '(') {
        const v = orE();
        if (t[p] !== ')') throw new ExprErr(p >= t.length ? `syntax error: expecting ')' after '${t[p - 1]}'` : `syntax error: expecting ')' instead of '${t[p]}'`);
        p++;
        return v;
      }
      if (tok === '+' ) { need(); return t[p++]; }
      if (tok === 'length') { need(); return String(Array.from(String(prim())).length); }
      if (tok === 'match') { const s = prim(); const re = prim(); return doMatch(s, re); }
      if (tok === 'substr') {
        const s = Array.from(String(prim()));
        const pos = prim(), len = prim();
        if (!isInt(pos) || !isInt(len)) return '';
        const ps = Number(pos), ln = Number(len);
        if (ps < 1 || ln < 1) return '';
        return s.slice(ps - 1, ps - 1 + ln).join('');
      }
      if (tok === 'index') {
        const s = String(prim()), chars = String(prim());
        const arr = Array.from(s);
        const k = arr.findIndex((ch) => chars.includes(ch));
        return String(k + 1);
      }
      if (tok === ')' ) throw new ExprErr(`syntax error: unexpected ')'`);
      return tok;
    };
    let v;
    try {
      v = orE();
      if (p < t.length) throw new ExprErr(`syntax error: unexpected argument '${t[p]}'`);
    } catch (e) {
      if (e instanceof ExprErr) { c.err(`expr: ${e.message}\n`); return e.code; }
      throw e;
    }
    v = String(v);
    if (isInt(v)) v = String(BigInt(v));
    c.out(v + '\n');
    return isNull(v) ? 1 : 0;
  });

  // ======================================================================= yes
  def('yes', async (c) => {
    if (c.args[0] === '--help') { c.out('Usage: yes [STRING]...\n  or:  yes OPTION\nRepeatedly output a line with all specified STRING(s), or \'y\'.\n'); return 0; }
    if (c.args[0] === '--version') { c.out('yes (GNU coreutils) 9.4\n'); return 0; }
    const line = (c.args[0] === '--' ? c.args.slice(1) : c.args).join(' ') || 'y';
    const s = line + '\n';
    if (c.session.headless) { c.out(s.repeat(1000)); return 0; }
    if (c.pipeOut || !c.tty) { c.out(s.repeat(10000)); return 0; }
    // 터미널: Ctrl+C 로 멈출 때까지
    for (let n = 0; n < 1e7; n++) {
      c.out(s.repeat(200));
      await c.sleep(0);
      if (c.aborted) return 130;
    }
    return 0;
  });

  // ======================================================================= base64
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function b64enc(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i], b = bytes[i + 1], c2 = bytes[i + 2];
      const n = (a << 16) | ((b || 0) << 8) | (c2 || 0);
      s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (b === undefined ? '=' : B64[(n >> 6) & 63]) + (c2 === undefined ? '=' : B64[n & 63]);
    }
    return s;
  }
  function b64dec(s, ignoreGarbage) {
    const out = [];
    let buf = 0, bits = 0;
    let bad = false;
    let ended = false;
    for (const ch of s) {
      if (ch === '\n' || ch === '\r') continue;
      if (ch === '=') { ended = true; continue; }
      const v = B64.indexOf(ch);
      if (v < 0 || ended) { if (ignoreGarbage) continue; bad = true; break; }
      buf = (buf << 6) | v;
      bits += 6;
      if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 255); }
    }
    return { bytes: Uint8Array.from(out), bad };
  }
  LX.b64enc = (s) => b64enc(utf8(s));
  LX.b64dec = (s) => fromUtf8(b64dec(s, true).bytes);

  def('base64', async (c) => {
    const r = opts(c.args, 'diw:', { decode: 'd', 'ignore-garbage': 'i', wrap: 'w:' });
    if (r.bad) return badOpt(c, 'base64', r.bad);
    const f = r.f;
    if (r.ops.length > 1) return badOpt(c, 'base64', `extra operand '${r.ops[1]}'`);
    const rd = await readOne(c, r.ops[0] || '-');
    if (rd.err) { c.err(`base64: ${r.ops[0]}: ${rd.err}\n`); return 1; }
    if (f.d) {
      const { bytes, bad } = b64dec(rd.text, f.i);
      c.out(fromUtf8(bytes));
      if (bad) { c.err('base64: invalid input\n'); return 1; }
      return 0;
    }
    const w = f.w != null ? +f.w : 76;
    if (!(w >= 0)) { c.err(`base64: invalid wrap size: '${f.w}'\n`); return 1; }
    const enc = b64enc(utf8(rd.text));
    if (!enc) return 0;
    c.out(w === 0 ? enc + '\n' : enc.match(new RegExp(`.{1,${w}}`, 'g')).join('\n') + '\n');
    return 0;
  });

  // ======================================================================= od
  def('od', async (c) => {
    const r = opts(c.args, 'A:t:cbxdosvj:N:w:', { 'address-radix': 'A:', format: 't:', 'output-duplicates': 'v', 'skip-bytes': 'j:', 'read-bytes': 'N:', width: 'w?' }, { multi: ['t'] });
    if (r.bad) return badOpt(c, 'od', r.bad);
    const f = r.f;
    let data = [];
    const st = await LX.readInputs(c, r.ops, 'od', (t) => { data.push(...utf8(t)); });
    let bytes = Uint8Array.from(data);
    const skip = +(f.j || 0);
    bytes = bytes.slice(skip, f.N != null ? skip + +f.N : undefined);
    const types = [];
    for (const t of f.t || []) {
      let m;
      const re = /([acdfoux])(\d*|[CSIL])?(z?)/g;
      while ((m = re.exec(t))) {
        const sz = m[2] === 'C' ? 1 : m[2] === 'S' ? 2 : m[2] === 'I' ? 4 : m[2] === 'L' ? 8 : m[2] ? +m[2] : (m[1] === 'd' || m[1] === 'o' || m[1] === 'u' || m[1] === 'x' ? 4 : 1);
        types.push({ k: m[1], sz: m[1] === 'a' || m[1] === 'c' ? 1 : sz, z: !!m[3] });
      }
    }
    if (f.c) types.push({ k: 'c', sz: 1 });
    if (f.b) types.push({ k: 'o', sz: 1 });
    if (f.x) types.push({ k: 'x', sz: 2 });
    if (f.d) types.push({ k: 'u', sz: 2 });
    if (f.o) types.push({ k: 'o', sz: 2 });
    if (f.s) types.push({ k: 'd', sz: 2 });
    if (!types.length) types.push({ k: 'o', sz: 2 });
    const radix = f.A || 'o';
    const addr = (n) => (radix === 'n' ? '' : radix === 'd' ? String(n).padStart(7, '0') : radix === 'x' ? n.toString(16).padStart(6, '0') : n.toString(8).padStart(7, '0'));
    const NAMES = ['nul', 'soh', 'stx', 'etx', 'eot', 'enq', 'ack', 'bel', 'bs', 'ht', 'nl', 'vt', 'ff', 'cr', 'so', 'si', 'dle', 'dc1', 'dc2', 'dc3', 'dc4', 'nak', 'syn', 'etb', 'can', 'em', 'sub', 'esc', 'fs', 'gs', 'rs', 'us', 'sp'];
    const width = { o: [0, 3, 6, 0, 11, 0, 0, 0, 22], x: [0, 2, 4, 0, 8, 0, 0, 0, 16], u: [0, 3, 5, 0, 10, 0, 0, 0, 20], d: [0, 4, 6, 0, 11, 0, 0, 0, 20] };
    const fmtUnit = (t, chunk, i) => {
      if (t.k === 'c') {
        const b = chunk[i];
        const esc = { 0: '\\0', 7: '\\a', 8: '\\b', 9: '\\t', 10: '\\n', 11: '\\v', 12: '\\f', 13: '\\r' }[b];
        let s = esc || (b >= 32 && b < 127 ? String.fromCharCode(b) : b.toString(8).padStart(3, '0'));
        return s.padStart(4);
      }
      if (t.k === 'a') { const b = chunk[i] & 127; return (b === 127 ? 'del' : b <= 32 ? NAMES[b] : String.fromCharCode(b)).padStart(4); }
      let v = 0n;
      for (let k = t.sz - 1; k >= 0; k--) v = (v << 8n) | BigInt(chunk[i + k] || 0);
      if (t.k === 'f') {
        const buf = new DataView(new ArrayBuffer(8));
        for (let k = 0; k < t.sz; k++) buf.setUint8(k, chunk[i + k] || 0);
        const x = t.sz === 4 ? buf.getFloat32(0, true) : buf.getFloat64(0, true);
        return ' ' + fmtG(x, t.sz === 4 ? 8 : 17).padStart(t.sz === 4 ? 14 : 23);
      }
      const w = width[t.k][t.sz];
      let s;
      if (t.k === 'd') { const sv = BigInt.asIntN(t.sz * 8, v); s = sv.toString(); } else s = v.toString(t.k === 'o' ? 8 : t.k === 'x' ? 16 : 10);
      if (t.k === 'o' || t.k === 'x') s = s.padStart(w, '0');
      return ' ' + s.padStart(w);
    };
    const W = f.w && f.w !== true ? +f.w : 16;
    let out = '';
    let prev = null;
    let starred = false;
    for (let off = 0; off < bytes.length; off += W) {
      const chunk = bytes.slice(off, off + W);
      const key = chunk.join(',');
      if (!f.v && prev === key && chunk.length === W) { if (!starred) { out += '*\n'; starred = true; } continue; }
      starred = false;
      prev = key;
      types.forEach((t, ti) => {
        let line = ti === 0 ? addr(off) : ' '.repeat(addr(off).length);
        const unitW = t.k === 'c' || t.k === 'a' ? 4 : null;
        for (let i = 0; i < chunk.length; i += t.sz) line += fmtUnit(t, chunk, i);
        void unitW;
        if (t.z) line += '  >' + Array.from(chunk, (b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('') + '<';
        out += line + '\n';
      });
    }
    if (radix !== 'n') out += addr(bytes.length) + '\n';
    c.out(out);
    return st;
  });

  // ======================================================================= hexdump · xxd
  def(['hexdump', 'hd'], async (c) => {
    const r = opts(c.args, 'Cbcdoxvn:s:e:f:L', { canonical: 'C', length: 'n:', skip: 's:', 'no-squeezing': 'v' });
    if (r.bad) return badOpt(c, 'hexdump', r.bad);
    const f = r.f;
    const data = [];
    const st = await LX.readInputs(c, r.ops, 'hexdump', (t) => { data.push(...utf8(t)); });
    const skip = +(f.s || 0);
    const bytes = data.slice(skip, f.n != null ? skip + +f.n : undefined);
    const canon = f.C || c.name === 'hd';
    let out = '';
    let prev = null;
    let starred = false;
    for (let off = 0; off < bytes.length; off += 16) {
      const chunk = bytes.slice(off, off + 16);
      const key = chunk.join(',');
      if (!f.v && key === prev && chunk.length === 16) { if (!starred) { out += '*\n'; starred = true; } continue; }
      starred = false;
      prev = key;
      const o = off + skip;
      if (canon) {
        let hex = '';
        for (let i = 0; i < 16; i++) { hex += i < chunk.length ? chunk[i].toString(16).padStart(2, '0') + ' ' : '   '; if (i === 7) hex += ' '; }
        out += o.toString(16).padStart(8, '0') + '  ' + hex + ' |' + chunk.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('') + '|\n';
      } else if (f.c) {
        out += o.toString(16).padStart(7, '0') + chunk.map((b) => { const e = { 0: '\\0', 7: '\\a', 8: '\\b', 9: '\\t', 10: '\\n', 11: '\\v', 12: '\\f', 13: '\\r' }[b]; return '  ' + (e || (b >= 32 && b < 127 ? ' ' + String.fromCharCode(b) : b.toString(8).padStart(3, '0'))).padStart(2); }).join('') + '\n';
      } else if (f.b) {
        out += o.toString(16).padStart(7, '0') + chunk.map((b) => ' ' + b.toString(8).padStart(3, '0')).join('') + '\n';
      } else {
        let s = o.toString(16).padStart(7, '0');
        for (let i = 0; i < chunk.length; i += 2) {
          const w = chunk[i] | ((chunk[i + 1] || 0) << 8);
          s += ' ' + (f.d ? String(w).padStart(5, '0') : f.o ? w.toString(8).padStart(6, '0') : w.toString(16).padStart(4, '0'));
        }
        out += s + '\n';
      }
    }
    if (bytes.length || canon) out += (bytes.length + skip).toString(16).padStart(canon ? 8 : 7, '0') + '\n';
    c.out(out);
    return st;
  });

  def('xxd', async (c) => {
    const r = opts(c.args, 'rpuic:g:l:s:bE', { revert: 'r', plain: 'p', ps: 'p', postscript: 'p', uppercase: 'u', include: 'i', cols: 'c:', groupsize: 'g:', len: 'l:', seek: 's:', bits: 'b' });
    if (r.bad) { c.err(`xxd: ${r.bad}\n`); return 1; }
    const f = r.f;
    const inName = r.ops[0] || '-';
    const rd = await readOne(c, inName);
    if (rd.err) { c.err(`xxd: ${inName}: ${rd.err}\n`); return 2; }
    let out = '';
    if (f.r) {
      const bytes = [];
      if (f.p) {
        const hex = rd.text.replace(/[^0-9a-fA-F]/g, '');
        for (let i = 0; i + 1 < hex.length; i += 2) bytes.push(parseInt(hex.substr(i, 2), 16));
      } else {
        for (const line of splitLines(rd.text)) {
          const m = /^[0-9a-fA-F]+:\s?((?:[0-9a-fA-F]{2,}\s?)*)/.exec(line);
          if (!m) continue;
          const hex = line.slice(line.indexOf(':') + 1).split(/  /)[0].replace(/[^0-9a-fA-F]/g, '');
          for (let i = 0; i + 1 < hex.length; i += 2) bytes.push(parseInt(hex.substr(i, 2), 16));
        }
      }
      out = fromUtf8(Uint8Array.from(bytes));
    } else {
      let bytes = Array.from(utf8(rd.text));
      const seek = +(f.s || 0);
      bytes = bytes.slice(seek, f.l != null ? seek + +f.l : undefined);
      const hx = (b) => { const s = b.toString(16).padStart(2, '0'); return f.u ? s.toUpperCase() : s; };
      if (f.p) {
        const cols = +(f.c || 30);
        const hex = bytes.map(hx).join('');
        out = hex ? hex.match(new RegExp(`.{1,${cols * 2}}`, 'g')).join('\n') + '\n' : '';
      } else if (f.i) {
        const name = inName === '-' ? null : inName.replace(/[^A-Za-z0-9]/g, '_');
        const cols = +(f.c || 12);
        const lines = [];
        for (let i = 0; i < bytes.length; i += cols) lines.push('  ' + bytes.slice(i, i + cols).map((b) => '0x' + hx(b)).join(', '));
        out = (name ? `unsigned char ${name}[] = {\n` : '') + lines.join(',\n') + '\n' + (name ? `};\nunsigned int ${name}_len = ${bytes.length};\n` : '');
      } else {
        const cols = +(f.c || (f.b ? 6 : 16));
        const grp = f.b ? +(f.g || 1) : +(f.g != null ? f.g : 2);
        const unitW = f.b ? 8 : 2;
        const hexW = Math.ceil(cols / (grp || cols)) * ((grp || cols) * unitW + 1);
        for (let i = 0; i < bytes.length; i += cols) {
          const chunk = bytes.slice(i, i + cols);
          let hex = '';
          chunk.forEach((b, k) => { hex += f.b ? b.toString(2).padStart(8, '0') : hx(b); if (grp && (k + 1) % grp === 0) hex += ' '; });
          out += (i + seek).toString(16).padStart(8, '0') + ': ' + hex.padEnd(hexW) + ' ' + chunk.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('') + '\n';
        }
      }
    }
    if (r.ops[1]) { const er = writeOut(c, r.ops[1], out, false); if (er) { c.err(`xxd: ${r.ops[1]}: ${er}\n`); return 2; } return 0; }
    c.out(out);
    return 0;
  });

  // ======================================================================= strings
  def('strings', async (c) => {
    const r = opts(c.args, 'n:afdt:e:', { bytes: 'n:', all: 'a', 'print-file-name': 'f', radix: 't:', encoding: 'e:' }, { digits: true });
    if (r.bad) return badOpt(c, 'strings', r.bad);
    const f = r.f;
    const min = +(f.n || f['#'] || 4);
    let st = 0;
    for (const name of r.ops.length ? r.ops : ['-']) {
      const rd = await readOne(c, name);
      if (rd.err) { c.err(`strings: '${name}': ${rd.dir ? 'Is a directory' : 'No such file'}\n`); st = 1; continue; }
      const bytes = utf8(rd.text);
      let cur = '';
      let start = 0;
      let out = '';
      const emit = () => {
        if (cur.length >= min) {
          const pre = f.f ? name + ': ' : '';
          const off = f.t ? (f.t === 'x' ? start.toString(16) : f.t === 'o' ? start.toString(8) : String(start)).padStart(7) + ' ' : '';
          out += pre + off + cur + '\n';
        }
        cur = '';
      };
      bytes.forEach((b, i) => {
        if ((b >= 32 && b < 127) || b === 9) { if (!cur) start = i; cur += String.fromCharCode(b); } else emit();
      });
      emit();
      c.out(out);
    }
    return st;
  });

  // ======================================================================= numfmt
  def('numfmt', async (c) => {
    const r = opts(c.args, 'd:z', { to: 'to:', from: 'from:', suffix: 'suffix:', padding: 'padding:', field: 'field:', header: 'header?', round: 'round:', format: 'format:', delimiter: 'd:', 'from-unit': 'fu:', 'to-unit': 'tu:', invalid: 'invalid:', grouping: 'grouping', 'zero-terminated': 'z' });
    if (r.bad) return badOpt(c, 'numfmt', r.bad);
    const f = r.f;
    const SUF = 'KMGTPEZYRQ';
    const valid = ['none', 'auto', 'si', 'iec', 'iec-i'];
    if (f.to && !valid.slice(0).includes(f.to) || f.to === 'auto') { c.err(`numfmt: invalid argument '${f.to}' for '--to'\nValid arguments are:\n  - 'none'\n  - 'si'\n  - 'iec'\n  - 'iec-i'\nTry 'numfmt --help' for more information.\n`); return 1; }
    const round = f.round || 'from-zero';
    const rnd = (x) => (round === 'up' ? Math.ceil(x) : round === 'down' ? Math.floor(x) : round === 'towards-zero' ? Math.trunc(x) : round === 'nearest' ? Math.round(x) : (x < 0 ? -Math.ceil(-x) : Math.ceil(x)));
    const parse = (s) => {
      const m = /^([-+]?\d*\.?\d+)([KMGTPEZYRQk]?)(i?)(B?)$/.exec(s.trim());
      if (!m) {
        if (/^[-+]?\d*\.?\d+/.test(s.trim())) throw new Error(`invalid suffix in input: '${s}'`);
        throw new Error(`invalid number: '${s}'`);
      }
      let v = parseFloat(m[1]);
      if (m[2]) {
        const from = f.from || 'none';
        if (from === 'none') throw new Error(`rejecting suffix in input: '${s}' (consider using --from)`);
        const idx = SUF.indexOf(m[2].toUpperCase()) + 1;
        const base = from === 'si' ? 1000 : from === 'iec' || from === 'iec-i' ? 1024 : m[3] ? 1024 : 1000;
        if (from === 'iec-i' && !m[3]) throw new Error(`missing 'i' suffix in input: '${s}' (e.g. Ki/Mi/Gi)`);
        v *= Math.pow(base, idx);
      }
      if (f.fu) v *= +f.fu || 1;
      return v;
    };
    const show = (v) => {
      if (f.tu) v /= +f.tu || 1;
      let s;
      const to = f.to || 'none';
      if (to === 'none') s = Number.isInteger(v) ? String(v) : String(rnd(v));
      else {
        const base = to === 'si' ? 1000 : 1024;
        let x = Math.abs(v);
        let i = 0;
        while (x >= base && i < SUF.length) { x /= base; i++; }
        if (i === 0) s = String(rnd(x));
        else {
          let y = x < 10 ? rnd(x * 10) / 10 : rnd(x);
          if (y >= base) { y = y / base; i++; y = y < 10 ? rnd(y * 10) / 10 : rnd(y); }
          s = (y < 10 ? y.toFixed(1) : String(y)) + SUF[i - 1] + (to === 'iec-i' ? 'i' : '');
        }
        if (v < 0) s = '-' + s;
      }
      if (f.format) s = csprintf(f.format.replace(/%'?/, '%').replace(/(%[-0-9.]*)[a-z]/, (m, p) => p + 's'), [s], { num: Number, str: String, chr: String });
      if (f.suffix) s += f.suffix;
      if (f.padding) { const p = +f.padding; s = p < 0 ? s.padEnd(-p) : s.padStart(p); }
      return s;
    };
    const conv = (s) => show(parse(s));
    let st = 0;
    if (r.ops.length) {
      for (const a of r.ops) { try { c.out(conv(a) + '\n'); } catch (e) { c.err(`numfmt: ${e.message}\n`); st = 2; } }
      return st;
    }
    const text = await c.readStdin();
    const lines = splitLines(text);
    const hdr = f.header ? (f.header === true ? 1 : +f.header) : 0;
    const field = +(f.field || 1);
    let out = '';
    lines.forEach((l, i) => {
      if (i < hdr) { out += l + '\n'; return; }
      try {
        if (f.d != null) {
          const parts = l.split(f.d);
          if (parts[field - 1] != null) parts[field - 1] = conv(parts[field - 1]);
          out += parts.join(f.d) + '\n';
        } else {
          let k = 0;
          out += l.replace(/(\s*)(\S+)/g, (m, sp, w) => { k++; if (k !== field) return m; const v = conv(w); return sp.length && !f.padding ? (sp + w).length > v.length ? ' '.repeat((sp + w).length - v.length) + v : sp + v : sp + v; }) + '\n';
        }
      } catch (e) { c.err(`numfmt: ${e.message}\n`); st = 2; }
    });
    c.out(out);
    return st;
  });

  // ======================================================================= factor
  function modpow(b, e, m) { let r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; }
  function isPrimeBig(n) {
    if (n < 2n) return false;
    for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) { if (n === p) return true; if (n % p === 0n) return false; }
    let d = n - 1n, s = 0;
    while (!(d & 1n)) { d >>= 1n; s++; }
    for (const a of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
      let x = modpow(a, d, n);
      if (x === 1n || x === n - 1n) continue;
      let ok = false;
      for (let r = 1; r < s; r++) { x = x * x % n; if (x === n - 1n) { ok = true; break; } }
      if (!ok) return false;
    }
    return true;
  }
  function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }
  function rho(n) {
    if (n % 2n === 0n) return 2n;
    for (let cc = 1n; cc < 50n; cc++) {
      let x = 2n, y = 2n, d = 1n;
      const fn = (v) => (v * v + cc) % n;
      let it = 0;
      while (d === 1n && it++ < 200000) { x = fn(x); y = fn(fn(y)); d = gcd(x > y ? x - y : y - x, n); }
      if (d !== n && d !== 1n) return d;
    }
    return n;
  }
  function factorBig(n, out) {
    if (n === 1n) return;
    if (isPrimeBig(n)) { out.push(n); return; }
    const d = rho(n);
    if (d === n) { out.push(n); return; }
    factorBig(d, out);
    factorBig(n / d, out);
  }
  def('factor', async (c) => {
    const nums = c.args.length ? c.args.filter((a) => a !== '--') : (await c.readStdin()).split(/\s+/).filter(Boolean);
    let st = 0;
    let out = '';
    for (const a of nums) {
      if (!/^\+?\d+$/.test(a)) { c.out(out); out = ''; c.err(`factor: '${a}' is not a valid positive integer\n`); st = 1; continue; }
      let n = BigInt(a.replace('+', ''));
      const fs = [];
      for (const p of [2n, 3n, 5n]) while (n % p === 0n && n > 1n) { fs.push(p); n /= p; }
      for (let p = 7n; p * p <= n && p < 100000n; p += 2n) while (n % p === 0n) { fs.push(p); n /= p; }
      const rest = [];
      if (n > 1n) factorBig(n, rest);
      rest.sort((x, y) => (x < y ? -1 : 1));
      fs.push(...rest);
      out += `${BigInt(a.replace('+', ''))}:${fs.map((x) => ' ' + x).join('')}\n`;
    }
    c.out(out);
    return st;
  });

  // ======================================================================= bc
  class BcErr extends Error {}
  class BcNum {
    constructor(v, s) { this.v = v; this.s = s; }
    static int(n) { return new BcNum(BigInt(n), 0); }
  }
  const P10 = (n) => 10n ** BigInt(n);
  const bcRescale = (a, s) => (s === a.s ? a : s > a.s ? new BcNum(a.v * P10(s - a.s), s) : new BcNum(a.v / P10(a.s - s), s));
  const bcZero = new BcNum(0n, 0);
  function bcCmp(a, b) { const s = Math.max(a.s, b.s); const x = bcRescale(a, s).v, y = bcRescale(b, s).v; return x < y ? -1 : x > y ? 1 : 0; }
  function bcToNumber(a) { return Number(a.v) / Math.pow(10, a.s); }
  function bcFromNumber(x, scale) {
    if (!isFinite(x)) throw new BcErr('Runtime error: math error');
    const neg = x < 0;
    const s = Math.abs(x).toFixed(Math.min(20, scale + 2));
    const [ip, fp = ''] = s.split('.');
    const frac = (fp + '0'.repeat(scale)).slice(0, scale);
    const v = BigInt(ip + frac);
    return new BcNum(neg ? -v : v, scale);
  }
  function isqrt(n) {
    if (n < 2n) return n;
    let x = BigInt(Math.floor(Math.sqrt(Number(n))));
    for (;;) {
      const y = (x + n / x) >> 1n;
      if (y >= x) { while (x * x > n) x--; while ((x + 1n) * (x + 1n) <= n) x++; return x; }
      x = y;
    }
  }

  function bcLex(src) {
    const toks = [];
    let i = 0;
    let line = 1;
    while (i < src.length) {
      const ch = src[i];
      if (ch === '\\' && src[i + 1] === '\n') { i += 2; line++; continue; }
      if (ch === ' ' || ch === '\t' || ch === '\r') { i++; continue; }
      if (ch === '\n') { toks.push({ t: 'nl', line }); line++; i++; continue; }
      if (ch === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); const body = j < 0 ? src.slice(i) : src.slice(i, j + 2); line += (body.match(/\n/g) || []).length; i = j < 0 ? src.length : j + 2; continue; }
      if (ch === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (/[0-9A-F.]/.test(ch) && !(ch === '.' && !/[0-9A-F]/.test(src[i + 1] || ''))) {
        let s = '';
        while (i < src.length && (/[0-9A-F.]/.test(src[i]) || (src[i] === '\\' && src[i + 1] === '\n'))) { if (src[i] === '\\') { i += 2; line++; continue; } s += src[i++]; }
        toks.push({ t: 'num', v: s, line });
        continue;
      }
      if (ch === '.') { toks.push({ t: 'name', v: 'last', line }); i++; continue; }
      if (/[a-z_]/.test(ch)) {
        const m = /^[a-z_][a-z0-9_]*/.exec(src.slice(i));
        toks.push({ t: 'name', v: m[0], line });
        i += m[0].length;
        continue;
      }
      if (ch === '"') {
        const j = src.indexOf('"', i + 1);
        if (j < 0) { toks.push({ t: 'bad', line }); break; }
        const s = src.slice(i + 1, j);
        line += (s.match(/\n/g) || []).length;
        toks.push({ t: 'str', v: s, line });
        i = j + 1;
        continue;
      }
      const two = src.substr(i, 2);
      if (['==', '<=', '>=', '!=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '^='].includes(two)) { toks.push({ t: two, line }); i += 2; continue; }
      if ('+-*/%^=<>!(){}[];,'.includes(ch)) { toks.push({ t: ch, line }); i++; continue; }
      toks.push({ t: 'bad', v: ch, line });
      i++;
    }
    toks.push({ t: 'eof', line });
    return toks;
  }

  class BcParser {
    constructor(toks) { this.toks = toks; this.p = 0; }
    get tk() { return this.toks[this.p]; }
    is(t) { return this.tk.t === t; }
    fail() { throw new BcErr(`syntax error@${this.tk.line}`); }
    eat(t) { if (!this.is(t)) this.fail(); return this.toks[this.p++]; }
    nls() { while (this.is('nl')) this.p++; }
    stmtList(end) {
      const list = [];
      for (;;) {
        while (this.is('nl') || this.is(';')) this.p++;
        if (this.is(end) || this.is('eof')) break;
        list.push(this.stmt());
        if (!(this.is('nl') || this.is(';') || this.is(end) || this.is('eof'))) this.fail();
      }
      return list;
    }
    stmt() {
      const x = this.tk;
      if (x.t === '{') { this.p++; const body = this.stmtList('}'); this.eat('}'); return { t: 'block', body }; }
      if (x.t === 'str') { this.p++; return { t: 'str', v: x.v }; }
      if (x.t === 'name') {
        switch (x.v) {
          case 'quit': this.p++; return { t: 'quit' };
          case 'halt': this.p++; return { t: 'halt' };
          case 'break': this.p++; return { t: 'break' };
          case 'continue': this.p++; return { t: 'continue' };
          case 'return': {
            this.p++;
            if (this.is('nl') || this.is(';') || this.is('}') || this.is('eof')) return { t: 'return', e: null };
            return { t: 'return', e: this.expr() };
          }
          case 'print': {
            this.p++;
            const items = [];
            do { if (this.is(',')) this.p++; items.push(this.is('str') ? { t: 'str', v: this.toks[this.p++].v } : this.expr()); } while (this.is(','));
            return { t: 'print', items };
          }
          case 'if': {
            this.p++; this.eat('('); const cond = this.expr(); this.eat(')'); this.nls();
            const then = this.stmt();
            const save = this.p;
            this.nls();
            if (this.is('name') && this.tk.v === 'else') { this.p++; this.nls(); return { t: 'if', cond, then, els: this.stmt() }; }
            this.p = save;
            return { t: 'if', cond, then, els: null };
          }
          case 'while': { this.p++; this.eat('('); const cond = this.expr(); this.eat(')'); this.nls(); return { t: 'while', cond, body: this.stmt() }; }
          case 'for': {
            this.p++; this.eat('(');
            const init = this.is(';') ? null : this.expr(); this.eat(';');
            const cond = this.is(';') ? null : this.expr(); this.eat(';');
            const step = this.is(')') ? null : this.expr(); this.eat(')'); this.nls();
            return { t: 'for', init, cond, step, body: this.stmt() };
          }
          case 'define': {
            this.p++;
            const name = this.eat('name').v;
            this.eat('(');
            const params = [];
            while (!this.is(')')) { const nm = this.eat('name').v; if (this.is('[')) { this.p++; this.eat(']'); params.push(nm + '[]'); } else params.push(nm); if (this.is(',')) this.p++; }
            this.p++;
            this.nls();
            this.eat('{');
            this.nls();
            const autos = [];
            if (this.is('name') && this.tk.v === 'auto') {
              this.p++;
              while (this.is('name')) { const nm = this.toks[this.p++].v; if (this.is('[')) { this.p++; this.eat(']'); autos.push(nm + '[]'); } else autos.push(nm); if (this.is(',')) this.p++; }
            }
            const body = this.stmtList('}');
            this.eat('}');
            return { t: 'define', name, params, autos, body };
          }
          default: break;
        }
      }
      return { t: 'expr', e: this.expr() };
    }
    expr() { return this.or(); }
    or() { let l = this.and(); while (this.is('||')) { this.p++; l = { t: 'or', l, r: this.and() }; } return l; }
    and() { let l = this.not(); while (this.is('&&')) { this.p++; l = { t: 'and', l, r: this.not() }; } return l; }
    not() { if (this.is('!')) { this.p++; return { t: 'not', e: this.not() }; } return this.rel(); }
    rel() {
      const l = this.assign();
      if (['==', '<=', '>=', '!=', '<', '>'].includes(this.tk.t)) { const op = this.toks[this.p++].t; return { t: 'rel', op, l, r: this.assign() }; }
      return l;
    }
    assign() {
      const l = this.add();
      if (['=', '+=', '-=', '*=', '/=', '%=', '^='].includes(this.tk.t) && (l.t === 'var' || l.t === 'idx')) {
        const op = this.toks[this.p++].t;
        return { t: 'assign', op, lv: l, e: this.assign() };
      }
      return l;
    }
    add() { let l = this.mul(); while (this.is('+') || this.is('-')) { const op = this.toks[this.p++].t; l = { t: 'bin', op, l, r: this.mul() }; } return l; }
    mul() { let l = this.pow(); while (this.is('*') || this.is('/') || this.is('%')) { const op = this.toks[this.p++].t; l = { t: 'bin', op, l, r: this.pow() }; } return l; }
    pow() { const l = this.unary(); if (this.is('^')) { this.p++; return { t: 'bin', op: '^', l, r: this.pow() }; } return l; }
    unary() { if (this.is('-')) { this.p++; return { t: 'neg', e: this.unary() }; } return this.incdec(); }
    incdec() {
      if (this.is('++') || this.is('--')) { const op = this.toks[this.p++].t; const lv = this.primary(); return { t: 'pre', op, lv }; }
      const e = this.primary();
      if ((this.is('++') || this.is('--')) && (e.t === 'var' || e.t === 'idx')) { const op = this.toks[this.p++].t; return { t: 'post', op, lv: e }; }
      return e;
    }
    primary() {
      const x = this.tk;
      if (x.t === 'num') { this.p++; return { t: 'num', v: x.v }; }
      if (x.t === '(') { this.p++; const e = this.expr(); this.eat(')'); return e; }
      if (x.t === 'name') {
        this.p++;
        if (['length', 'sqrt', 'scale'].includes(x.v) && this.is('(')) { this.p++; const e = this.expr(); this.eat(')'); return { t: 'fn', name: x.v, e }; }
        if (x.v === 'read' && this.is('(')) { this.p++; this.eat(')'); return { t: 'num', v: '0' }; }
        if (this.is('(')) {
          this.p++;
          const args = [];
          while (!this.is(')')) { args.push(this.expr()); if (this.is(',')) this.p++; else if (!this.is(')')) this.fail(); }
          this.p++;
          return { t: 'call', name: x.v, args };
        }
        if (this.is('[')) { this.p++; const e = this.expr(); this.eat(']'); return { t: 'idx', name: x.v, e }; }
        if (['if', 'while', 'for', 'define', 'auto', 'quit', 'print', 'return', 'break', 'continue', 'halt', 'else'].includes(x.v)) { this.p--; this.fail(); }
        return { t: 'var', name: x.v };
      }
      this.fail();
      return null;
    }
  }

  class BcRT {
    constructor(out, mathlib) {
      this.out = out;
      this.vars = { scale: BcNum.int(mathlib ? 20 : 0), ibase: BcNum.int(10), obase: BcNum.int(10), last: bcZero };
      this.arrs = {};
      this.funcs = {};
      this.frames = [];
      this.mathlib = mathlib;
      this.steps = 0;
      this.t0 = Date.now();
    }
    get scale() { return Number(this.vars.scale.v / P10(this.vars.scale.s)); }
    num(str) {
      const ib = Number(this.vars.ibase.v / P10(this.vars.ibase.s)) || 10;
      const [ip, fp = ''] = str.split('.');
      const dv = (ch) => (/\d/.test(ch) ? +ch : ch.charCodeAt(0) - 55);
      if (ib === 10) {
        if (str.length === 1 && /[A-F]/.test(str)) return BcNum.int(dv(str));
        const digits = (ip + fp).replace(/[A-F]/g, '9');
        return new BcNum(BigInt(digits || '0'), fp.length);
      }
      let v = 0n;
      for (const ch of ip) v = v * BigInt(ib) + BigInt(Math.min(dv(ch), str.length === 1 ? 99 : ib - 1));
      if (!fp) return new BcNum(v, 0);
      const sc = fp.length;
      let frac = new BcNum(0n, sc);
      let den = 1n;
      let numr = 0n;
      for (const ch of fp) { numr = numr * BigInt(ib) + BigInt(Math.min(dv(ch), ib - 1)); den *= BigInt(ib); }
      frac = new BcNum(numr * P10(sc) / den, sc);
      return this.add(new BcNum(v, 0), frac);
    }
    add(a, b) { const s = Math.max(a.s, b.s); return new BcNum(bcRescale(a, s).v + bcRescale(b, s).v, s); }
    sub(a, b) { const s = Math.max(a.s, b.s); return new BcNum(bcRescale(a, s).v - bcRescale(b, s).v, s); }
    mul(a, b) {
      const full = new BcNum(a.v * b.v, a.s + b.s);
      return bcRescale(full, Math.min(a.s + b.s, Math.max(this.scale, a.s, b.s)));
    }
    div(a, b, sc = this.scale) {
      if (b.v === 0n) throw new BcErr('Runtime error (func=(main), adr=0): Divide by zero');
      return new BcNum(a.v * P10(b.s + sc) / (b.v * P10(a.s)), sc);
    }
    mod(a, b) {
      if (b.v === 0n) throw new BcErr('Runtime error (func=(main), adr=0): Modulo by zero');
      const q = this.div(a, b, this.scale);
      const qb = new BcNum(q.v * b.v, q.s + b.s);
      const s = Math.max(this.scale + b.s, a.s);
      return bcRescale(this.sub(a, qb), s);
    }
    pow(a, b) {
      if (b.s && bcRescale(b, 0).v * P10(b.s) !== b.v) this.out.err('Runtime warning (func=(main), adr=0): non-zero scale in exponent\n');
      let e = bcRescale(b, 0).v;
      const neg = e < 0n;
      if (neg) e = -e;
      if (e > 100000n) throw new BcErr('Runtime error (func=(main), adr=0): exponent too large in raise');
      let r = new BcNum(1n, 0);
      let base = a;
      const exact = (x, y) => new BcNum(x.v * y.v, x.s + y.s);
      while (e > 0n) { if (e & 1n) r = exact(r, base); e >>= 1n; if (e) base = exact(base, base); if (r.s > 2000) r = bcRescale(r, 2000); if (base.s > 2000) base = bcRescale(base, 2000); }
      if (neg) return this.div(new BcNum(1n, 0), r, this.scale);
      const eN = Number(bcRescale(b, 0).v < 0n ? -bcRescale(b, 0).v : bcRescale(b, 0).v);
      return bcRescale(r, Math.min(a.s * eN, Math.max(this.scale, a.s)));
    }
    sqrt(a) {
      if (a.v < 0n) throw new BcErr('Runtime error (func=(main), adr=0): Square root of a negative number');
      const rs = Math.max(this.scale, a.s);
      const n = a.v * P10(2 * rs - a.s);
      return new BcNum(isqrt(n), rs);
    }
    fmt(a) {
      const ob = Number(this.vars.obase.v / P10(this.vars.obase.s)) || 10;
      const neg = a.v < 0n;
      let v = neg ? -a.v : a.v;
      if (v === 0n) return '0';
      const ip = v / P10(a.s);
      const fp = v % P10(a.s);
      let s;
      if (ob === 10) {
        s = (ip === 0n ? '' : ip.toString()) + (a.s ? '.' + fp.toString().padStart(a.s, '0') : '');
      } else {
        const digit = (d) => (ob <= 16 ? '0123456789ABCDEF'[d] : ' ' + String(d).padStart(String(ob - 1).length, '0'));
        let is = '';
        let x = ip;
        if (x === 0n) is = ob <= 16 ? '0' : digit(0); else while (x > 0n) { is = digit(Number(x % BigInt(ob))) + is; x /= BigInt(ob); }
        if (ip === 0n && ob <= 16) is = '';
        s = is;
        if (a.s) {
          s += '.';
          let fr = new BcNum(fp, a.s);
          let got = 1n;
          while (got < P10(a.s)) {
            const t = new BcNum(fr.v * BigInt(ob), a.s);
            const d = t.v / P10(a.s);
            s += digit(Number(d));
            fr = new BcNum(t.v % P10(a.s), a.s);
            got *= BigInt(ob);
          }
        }
      }
      s = (neg ? '-' : '') + s;
      // 70자마다 줄 나눔
      if (s.length > 69) { const parts = []; for (let i = 0; i < s.length; i += 69) parts.push(s.slice(i, i + 69)); s = parts.join('\\\n'); }
      return s;
    }
    truth(a) { return a.v !== 0n; }
    getVar(name) {
      for (let k = this.frames.length - 1; k >= 0; k--) { const fr = this.frames[k]; if (name in fr) return fr[name]; break; }
      return this.vars[name] || bcZero;
    }
    setVar(name, v) {
      if (name === 'scale') { const n = bcRescale(v, 0).v; if (n < 0n || n > 2147483647n) throw new BcErr('Runtime error (func=(main), adr=0): Scale value out of range'); v = new BcNum(n, 0); }
      if (name === 'ibase') { let n = Number(bcRescale(v, 0).v); if (n < 2) { this.out.err('Runtime warning (func=(main), adr=0): ibase too small, set to 2\n'); n = 2; } if (n > 16) { this.out.err('Runtime warning (func=(main), adr=0): ibase too large, set to 16\n'); n = 16; } v = BcNum.int(n); }
      if (name === 'obase') { let n = Number(bcRescale(v, 0).v); if (n < 2) { throw new BcErr('Runtime error (func=(main), adr=0): Invalid output base'); } v = BcNum.int(n); }
      const fr = this.frames[this.frames.length - 1];
      if (fr && name in fr) fr[name] = v; else this.vars[name] = v;
    }
    arr(name) {
      const fr = this.frames[this.frames.length - 1];
      if (fr && (name + '[]') in fr) return fr[name + '[]'];
      if (!this.arrs[name]) this.arrs[name] = new Map();
      return this.arrs[name];
    }
    ev(e) {
      if (++this.steps % 10000 === 0 && Date.now() - this.t0 > 5000) throw new BcErr('가상 터미널 실행 시간 제한을 넘어 중단했습니다');
      switch (e.t) {
        case 'num': return this.num(e.v);
        case 'var': return this.getVar(e.name);
        case 'idx': { const k = String(bcRescale(this.ev(e.e), 0).v); return this.arr(e.name).get(k) || bcZero; }
        case 'neg': { const v = this.ev(e.e); return new BcNum(-v.v, v.s); }
        case 'not': return BcNum.int(this.truth(this.ev(e.e)) ? 0 : 1);
        case 'or': return BcNum.int(this.truth(this.ev(e.l)) || this.truth(this.ev(e.r)) ? 1 : 0);
        case 'and': return BcNum.int(this.truth(this.ev(e.l)) && this.truth(this.ev(e.r)) ? 1 : 0);
        case 'rel': {
          const d = bcCmp(this.ev(e.l), this.ev(e.r));
          return BcNum.int({ '==': d === 0, '!=': d !== 0, '<': d < 0, '<=': d <= 0, '>': d > 0, '>=': d >= 0 }[e.op] ? 1 : 0);
        }
        case 'bin': {
          const a = this.ev(e.l), b = this.ev(e.r);
          return this.op(e.op, a, b);
        }
        case 'assign': {
          let v = this.ev(e.e);
          if (e.op !== '=') v = this.op(e.op[0], this.ev(e.lv), v);
          this.store(e.lv, v);
          return e.lv.t === 'var' ? this.getVar(e.lv.name) : v;
        }
        case 'pre': { const v = this.op(e.op[0], this.ev(e.lv), BcNum.int(1)); this.store(e.lv, v); return v; }
        case 'post': { const v = this.ev(e.lv); this.store(e.lv, this.op(e.op[0], v, BcNum.int(1))); return v; }
        case 'fn': {
          const v = this.ev(e.e);
          if (e.name === 'sqrt') return this.sqrt(v);
          if (e.name === 'scale') return BcNum.int(v.s);
          const digits = (v.v < 0n ? -v.v : v.v).toString();
          return BcNum.int(v.v === 0n ? (v.s || 1) : Math.max(digits.length, v.s));
        }
        case 'call': return this.call(e);
        default: throw new BcErr('syntax error');
      }
    }
    op(op, a, b) {
      switch (op) {
        case '+': return this.add(a, b);
        case '-': return this.sub(a, b);
        case '*': return this.mul(a, b);
        case '/': return this.div(a, b);
        case '%': return this.mod(a, b);
        case '^': return this.pow(a, b);
        default: throw new BcErr('syntax error');
      }
    }
    store(lv, v) {
      if (lv.t === 'var') this.setVar(lv.name, v);
      else this.arr(lv.name).set(String(bcRescale(this.ev(lv.e), 0).v), v);
    }
    call(e) {
      const args = e.args.map((a) => this.ev(a));
      if (this.mathlib && !this.funcs[e.name] && 'sclaej'.includes(e.name) && e.name.length === 1) {
        const x = bcToNumber(args[0] || bcZero);
        const sc = this.scale;
        let r;
        switch (e.name) {
          case 's': r = Math.sin(x); break;
          case 'c': r = Math.cos(x); break;
          case 'a': r = Math.atan(x); break;
          case 'l': if (x <= 0) throw new BcErr('Runtime error (func=l, adr=0): Divide by zero'); r = Math.log(x); break;
          case 'e': r = Math.exp(x); break;
          default: r = 0;
        }
        return bcFromNumber(r, sc);
      }
      const fn = this.funcs[e.name];
      if (!fn) throw new BcErr(`Runtime error (func=(main), adr=0): Function ${e.name} not defined.`);
      if (fn.params.length !== args.length) throw new BcErr(`Runtime error (func=(main), adr=0): Parameter number mismatch`);
      if (this.frames.length > 500) throw new BcErr('Runtime error: too many nested calls');
      const fr = {};
      fn.params.forEach((p, k) => { fr[p] = args[k]; });
      fn.autos.forEach((p) => { fr[p] = p.endsWith('[]') ? new Map() : bcZero; });
      this.frames.push(fr);
      try {
        for (const s of fn.body) this.exec(s, true);
        return bcZero;
      } catch (x) {
        if (x && x.ret) return x.v;
        throw x;
      } finally { this.frames.pop(); }
    }
    exec(s, inFn) {
      switch (s.t) {
        case 'expr': {
          const v = this.ev(s.e);
          if (s.e.t !== 'assign') { this.out.out(this.fmt(v) + '\n'); this.vars.last = v; }
          return;
        }
        case 'str': this.out.out(s.v.replace(/\\\n/g, '')); return;
        case 'print':
          for (const it of s.items) {
            if (it.t === 'str') this.out.out(it.v.replace(/\\([abfnrqt\\e])/g, (m, ch) => ({ a: '\x07', b: '\b', f: '\f', n: '\n', r: '\r', q: '"', t: '\t', '\\': '\\', e: '\\' }[ch])));
            else { const v = this.ev(it); this.out.out(this.fmt(v)); this.vars.last = v; }
          }
          return;
        case 'block': for (const x of s.body) this.exec(x, inFn); return;
        case 'if': if (this.truth(this.ev(s.cond))) this.exec(s.then, inFn); else if (s.els) this.exec(s.els, inFn); return;
        case 'while':
          while (this.truth(this.ev(s.cond))) {
            try { this.exec(s.body, inFn); } catch (x) { if (x === 'break') break; if (x === 'continue') continue; throw x; }
          }
          return;
        case 'for':
          if (s.init) this.ev(s.init);
          while (!s.cond || this.truth(this.ev(s.cond))) {
            try { this.exec(s.body, inFn); } catch (x) { if (x === 'break') break; if (x !== 'continue') throw x; }
            if (s.step) this.ev(s.step);
          }
          return;
        case 'break': throw 'break';
        case 'continue': throw 'continue';
        case 'return': {
          if (!inFn) throw new BcErr('syntax error');
          const v = s.e ? this.ev(s.e) : bcZero;
          throw { ret: true, v };
        }
        case 'define': this.funcs[s.name] = s; return;
        case 'quit': throw 'quit';
        case 'halt': throw 'quit';
        default: return;
      }
    }
  }

  def('bc', async (c) => {
    const r = opts(c.args, 'lqsiwv', { mathlib: 'l', quiet: 'q', standard: 's', interactive: 'i', warn: 'w', version: 'v' });
    if (r.bad) { c.err(`bc: ${r.bad}\nusage: bc [options] [file ...]\n`); return 1; }
    const f = r.f;
    if (f.v) { c.out('bc 1.07.1\nCopyright 1991-1994, 1997, 1998, 2000, 2004, 2006, 2008, 2012-2017 Free Software Foundation, Inc.\n'); return 0; }
    const rt = new BcRT({ out: (s) => c.out(s), err: (s) => c.err(s) }, !!f.l);
    // 한 덩어리씩 해석 · 실행 (문법 오류가 나도 다음 줄부터 계속)
    const runText = (src, label) => {
      const lines = src.split('\n');
      let buf = '';
      let lineNo = 0;
      for (let li = 0; li < lines.length; li++) {
        buf += (buf ? '\n' : '') + lines[li];
        lineNo = li + 1;
        // 괄호 · 중괄호가 닫힐 때까지 모은다
        const opens = (buf.match(/[{(]/g) || []).length - (buf.match(/[})]/g) || []).length;
        if ((opens > 0 || /\\$/.test(buf)) && li < lines.length - 1) continue;
        let toks;
        try { toks = bcLex(buf); } catch (e) { buf = ''; continue; }
        const badTok = toks.find((t) => t.t === 'bad');
        const startLine = lineNo - (buf.match(/\n/g) || []).length;
        if (badTok) {
          if (badTok.v) c.err(`(${label}) ${startLine + badTok.line - 1}: illegal character: ${badTok.v}\n`);
          else c.err(`(${label}) ${startLine + badTok.line - 1}: syntax error\n`);
          buf = '';
          continue;
        }
        let stmts;
        try { stmts = new BcParser(toks).stmtList('eof'); } catch (e) {
          if (!(e instanceof BcErr)) throw e;
          const m = /@(\d+)/.exec(e.message);
          c.err(`(${label}) ${startLine + (m ? +m[1] - 1 : 0)}: syntax error\n`);
          buf = '';
          continue;
        }
        buf = '';
        for (const s of stmts) {
          try { rt.exec(s, false); } catch (e) {
            if (e === 'quit') return 'quit';
            if (e === 'break' || e === 'continue') { c.err(`(${label}) ${lineNo}: syntax error\n`); break; }
            if (e && e.ret) { c.err(`(${label}) ${lineNo}: syntax error\n`); break; }
            if (e instanceof BcErr) { c.err(/[가-힣]/.test(e.message) ? `bc: ${e.message}\n` : e.message + '\n'); break; }
            throw e;
          }
        }
      }
      return null;
    };
    for (const file of r.ops) {
      const rd = await readOne(c, file);
      if (rd.err) { c.err(`File ${file} is unavailable.\n`); return 1; }
      if (runText(rd.text, file) === 'quit') return 0;
    }
    if (!c.io.stdin && !c.session.headless) {
      // 대화형: 한 줄씩
      if (!f.q) c.out('bc 1.07.1\nCopyright 1991-1994, 1997, 1998, 2000, 2004, 2006, 2008, 2012-2017 Free Software Foundation, Inc.\nThis is free software with ABSOLUTELY NO WARRANTY.\nFor details type `warranty\'. \n');
      let acc = '';
      for (;;) {
        const l = await c.readLine('', { raw: true });
        if (l == null) break;
        acc += (acc ? '\n' : '') + l;
        const opens = (acc.match(/[{(]/g) || []).length - (acc.match(/[})]/g) || []).length;
        if (opens > 0 || /\\$/.test(acc)) continue;
        const res = runText(acc, 'standard_in');
        acc = '';
        if (res === 'quit') break;
      }
      return 0;
    }
    runText(await c.readStdin(), 'standard_in');
    return 0;
  });

  // ======================================================================= jq
  class JqErr extends Error { constructor(msg, v) { super(msg); this.v = v; } }
  class JqCompile extends Error {}
  /** JSON 여러 개가 이어진 입력 해석 */
  function jsonStream(text) {
    const vals = [];
    let i = 0;
    const n = text.length;
    let line = 1, col = 0;
    const fail = (msg) => { const pre = text.slice(0, i); const ln = (pre.match(/\n/g) || []).length + 1; const cl = i - (pre.lastIndexOf('\n') + 1); throw new JqErr(`${msg} at line ${ln}, column ${cl}`); };
    const ws = () => { while (i < n && /\s/.test(text[i])) i++; };
    const value = () => {
      ws();
      if (i >= n) fail('Unfinished JSON term at EOF');
      const ch = text[i];
      if (ch === '{') {
        i++;
        const o = {};
        ws();
        if (text[i] === '}') { i++; return o; }
        for (;;) {
          ws();
          if (text[i] !== '"') fail(i >= n ? 'Unfinished JSON term at EOF' : 'Object keys must be strings');
          const k = str();
          ws();
          if (text[i] !== ':') fail(i >= n ? 'Unfinished JSON term at EOF' : "Objects must consist of key:value pairs");
          i++;
          o[k] = value();
          ws();
          if (text[i] === ',') { i++; continue; }
          if (text[i] === '}') { i++; return o; }
          fail(i >= n ? 'Unfinished JSON term at EOF' : "Expected separator between values");
        }
      }
      if (ch === '[') {
        i++;
        const a = [];
        ws();
        if (text[i] === ']') { i++; return a; }
        for (;;) {
          a.push(value());
          ws();
          if (text[i] === ',') { i++; continue; }
          if (text[i] === ']') { i++; return a; }
          fail(i >= n ? 'Unfinished JSON term at EOF' : 'Expected separator between values');
        }
      }
      if (ch === '"') return str();
      const m = /^(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?|true|false|null|nan)/.exec(text.slice(i, i + 400));
      if (m && (i + m[0].length >= n || /[\s,\]}\[{":]/.test(text[i + m[0].length]))) {
        i += m[0].length;
        if (m[0] === 'true') return true;
        if (m[0] === 'false') return false;
        if (m[0] === 'null') return null;
        if (m[0] === 'nan') return NaN;
        return parseFloat(m[0]);
      }
      while (i < n && !/[\s,\]}\[{:]/.test(text[i])) i++;
      fail('Invalid literal');
      return null;
    };
    const str = () => {
      i++;
      let s = '';
      for (;;) {
        if (i >= n) fail('Unfinished JSON term at EOF');
        const ch = text[i++];
        if (ch === '"') return s;
        if (ch === '\\') {
          const d = text[i++];
          const map = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', '/': '/', '\\': '\\', '"': '"' };
          if (d === 'u') { s += String.fromCharCode(parseInt(text.substr(i, 4), 16)); i += 4; } else if (d in map) s += map[d]; else fail('Invalid escape');
          continue;
        }
        s += ch;
      }
    };
    void line; void col;
    for (;;) {
      ws();
      if (i >= n) break;
      let v;
      try { v = value(); } catch (e) { if (e instanceof JqErr) { vals.err = e.message; return vals; } throw e; }
      const ln = (text.slice(0, i).match(/\n/g) || []).length + (text[i] === '\n' ? 1 : 0);
      vals.push({ v, line: ln });
    }
    return vals;
  }

  function jqLex(src) {
    const toks = [];
    let i = 0;
    const n = src.length;
    while (i < n) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '#') { while (i < n && src[i] !== '\n') i++; continue; }
      if (ch === '"') {
        // 문자열 (보간 \( ) 포함)
        const parts = [];
        let s = '';
        i++;
        for (;;) {
          if (i >= n) throw new JqCompile('unterminated string');
          const d = src[i];
          if (d === '"') { i++; break; }
          if (d === '\\') {
            const e = src[i + 1];
            if (e === '(') {
              let depth = 1;
              let j = i + 2;
              let inStr = false;
              while (j < n && depth) {
                if (inStr) { if (src[j] === '\\') j++; else if (src[j] === '"') inStr = false; } else if (src[j] === '"') inStr = true; else if (src[j] === '(') depth++; else if (src[j] === ')') depth--;
                j++;
              }
              if (s) { parts.push(s); s = ''; }
              parts.push({ expr: src.slice(i + 2, j - 1) });
              i = j;
              continue;
            }
            const map = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', '/': '/', '\\': '\\', '"': '"' };
            if (e === 'u') { s += String.fromCharCode(parseInt(src.substr(i + 2, 4), 16)); i += 6; continue; }
            s += map[e] != null ? map[e] : e;
            i += 2;
            continue;
          }
          s += d;
          i++;
        }
        if (s || !parts.length) parts.push(s);
        toks.push({ t: 'str', parts });
        continue;
      }
      if (/\d/.test(ch) || (ch === '.' && /\d/.test(src[i + 1] || ''))) {
        const m = /^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/.exec(src.slice(i));
        toks.push({ t: 'num', v: parseFloat(m[0]) });
        i += m[0].length;
        continue;
      }
      if (ch === '.' && /[A-Za-z_]/.test(src[i + 1] || '')) {
        const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i + 1));
        toks.push({ t: 'field', v: m[0] });
        i += 1 + m[0].length;
        continue;
      }
      if (ch === '$' && /[A-Za-z_]/.test(src[i + 1] || '')) {
        const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i + 1));
        toks.push({ t: 'var', v: m[0] });
        i += 1 + m[0].length;
        continue;
      }
      if (ch === '@') {
        const m = /^@[A-Za-z0-9_]+/.exec(src.slice(i));
        toks.push({ t: 'format', v: m[0] });
        i += m[0].length;
        continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        const m = /^[A-Za-z_][A-Za-z0-9_]*(::[A-Za-z_][A-Za-z0-9_]*)*/.exec(src.slice(i));
        const kw = ['if', 'then', 'elif', 'else', 'end', 'as', 'def', 'reduce', 'foreach', 'try', 'catch', 'and', 'or', 'label', 'import', 'include', '__loc__'];
        toks.push({ t: kw.includes(m[0]) ? m[0] : 'ident', v: m[0] });
        i += m[0].length;
        continue;
      }
      const ops = ['?//', '|=', '+=', '-=', '*=', '/=', '%=', '//=', '==', '!=', '<=', '>=', '//', '..', '?'];
      const op = ops.find((o) => src.startsWith(o, i));
      if (op) { toks.push({ t: op }); i += op.length; continue; }
      if ('.[]{}()|,:;=<>+-*/%$'.includes(ch)) { toks.push({ t: ch }); i++; continue; }
      throw new JqCompile(`syntax error, unexpected INVALID_CHARACTER (Unix shell quoting issues?)`);
    }
    toks.push({ t: 'eof' });
    return toks;
  }

  class JqParser {
    constructor(toks) { this.toks = toks; this.p = 0; }
    get tk() { return this.toks[this.p]; }
    is(t) { return this.tk.t === t; }
    fail() {
      const x = this.tk;
      const name = x.t === 'eof' ? '$end' : x.t === 'ident' ? 'IDENT' : x.t === 'num' ? 'LITERAL' : x.t === 'str' ? 'QQSTRING_START' : x.t === 'field' ? 'FIELD' : `'${x.t}'`;
      throw new JqCompile(`syntax error, unexpected ${name} (Unix shell quoting issues?)`);
    }
    eat(t) { if (!this.is(t)) this.fail(); return this.toks[this.p++]; }
    program() { const e = this.pipe(); if (!this.is('eof')) this.fail(); return e; }
    pipe() {
      if (this.is('def')) {
        this.p++;
        const name = this.eat('ident').v;
        const params = [];
        if (this.is('(')) { this.p++; for (;;) { if (this.is('var')) params.push('$' + this.toks[this.p++].v); else params.push(this.eat('ident').v); if (this.is(';')) { this.p++; continue; } break; } this.eat(')'); }
        this.eat(':');
        const body = this.pipe();
        this.eat(';');
        const rest = this.pipe();
        return { t: 'def', name, params, body, rest };
      }
      let l = this.comma();
      if (this.is('as')) {
        this.p++;
        const pat = this.pattern();
        this.eat('|');
        const body = this.pipe();
        return { t: 'as', src: l, pat, body };
      }
      if (this.is('|')) { this.p++; const r = this.pipe(); l = { t: 'pipe', l, r }; }
      return l;
    }
    pattern() {
      if (this.is('var')) return { t: 'pvar', name: this.toks[this.p++].v };
      if (this.is('[')) { this.p++; const items = []; while (!this.is(']')) { items.push(this.pattern()); if (this.is(',')) this.p++; } this.p++; return { t: 'parr', items }; }
      if (this.is('{')) {
        this.p++;
        const items = [];
        while (!this.is('}')) {
          if (this.is('var')) { const nm = this.toks[this.p++].v; items.push({ key: { t: 'lit', v: nm }, pat: this.is(':') ? (this.p++, this.pattern()) : { t: 'pvar', name: nm } }); } else {
            const k = this.is('ident') ? { t: 'lit', v: this.toks[this.p++].v } : this.is('str') ? this.strNode(this.toks[this.p++]) : (this.eat('('), (() => { const e = this.pipe(); this.eat(')'); return e; })());
            this.eat(':');
            items.push({ key: k, pat: this.pattern() });
          }
          if (this.is(',')) this.p++;
        }
        this.p++;
        return { t: 'pobj', items };
      }
      this.fail();
      return null;
    }
    comma() { let l = this.alt(); while (this.is(',')) { this.p++; l = { t: 'comma', l, r: this.alt() }; } return l; }
    alt() {
      const l = this.assign();
      if (this.is('//')) { this.p++; return { t: 'alt', l, r: this.alt() }; }
      return l;
    }
    assign() {
      const l = this.or();
      const ops = ['=', '|=', '+=', '-=', '*=', '/=', '%=', '//='];
      if (ops.includes(this.tk.t)) { const op = this.toks[this.p++].t; return { t: 'assign', op, l, r: this.alt() }; }
      return l;
    }
    or() { let l = this.and(); while (this.is('or')) { this.p++; l = { t: 'or', l, r: this.and() }; } return l; }
    and() { let l = this.cmp(); while (this.is('and')) { this.p++; l = { t: 'and', l, r: this.cmp() }; } return l; }
    cmp() {
      const l = this.add();
      if (['==', '!=', '<', '<=', '>', '>='].includes(this.tk.t)) { const op = this.toks[this.p++].t; return { t: 'bin', op, l, r: this.add() }; }
      return l;
    }
    add() { let l = this.mul(); while (this.is('+') || this.is('-')) { const op = this.toks[this.p++].t; l = { t: 'bin', op, l, r: this.mul() }; } return l; }
    mul() { let l = this.unary(); while (this.is('*') || this.is('/') || this.is('%')) { const op = this.toks[this.p++].t; l = { t: 'bin', op, l, r: this.unary() }; } return l; }
    unary() { if (this.is('-')) { this.p++; return { t: 'neg', e: this.postfix() }; } return this.postfix(); }
    postfix() {
      let e = this.term();
      for (;;) {
        if (this.is('field')) { e = { t: 'pipe', l: e, r: { t: 'index', e: { t: 'id' }, k: { t: 'lit', v: this.toks[this.p++].v } } }; continue; }
        if (this.is('.') && this.toks[this.p + 1].t === 'str') { this.p++; e = { t: 'pipe', l: e, r: { t: 'index', e: { t: 'id' }, k: this.strNode(this.toks[this.p++]) } }; continue; }
        if (this.is('.') && this.toks[this.p + 1].t === '[') { this.p++; continue; }
        if (this.is('[')) { e = this.bracket(e); continue; }
        if (this.is('?')) { this.p++; e = { t: 'try', e, c: null }; continue; }
        if (this.is('as') && false) break;
        break;
      }
      return e;
    }
    bracket(e) {
      this.p++;
      if (this.is(']')) { this.p++; return { t: 'iter', e }; }
      if (this.is(':')) { this.p++; const to = this.pipe(); this.eat(']'); return { t: 'slice', e, from: null, to }; }
      const k = this.pipe();
      if (this.is(':')) { this.p++; const to = this.is(']') ? null : this.pipe(); this.eat(']'); return { t: 'slice', e, from: k, to }; }
      this.eat(']');
      return { t: 'index', e, k };
    }
    strNode(tok) {
      if (tok.parts.length === 1 && typeof tok.parts[0] === 'string') return { t: 'lit', v: tok.parts[0] };
      return { t: 'interp', parts: tok.parts.map((p) => (typeof p === 'string' ? p : new JqParser(jqLex(p.expr)).program())) };
    }
    term() {
      const x = this.tk;
      switch (x.t) {
        case 'num': this.p++; return { t: 'lit', v: x.v };
        case 'str': this.p++; return this.strNode(x);
        case 'format': {
          this.p++;
          if (this.is('str')) { const s = this.toks[this.p++]; return { t: 'interp', fmt: x.v, parts: s.parts.map((p) => (typeof p === 'string' ? p : new JqParser(jqLex(p.expr)).program())) }; }
          return { t: 'format', v: x.v };
        }
        case '.': {
          this.p++;
          if (this.is('str')) return { t: 'index', e: { t: 'id' }, k: this.strNode(this.toks[this.p++]) };
          if (this.is('[')) return this.bracket({ t: 'id' });
          return { t: 'id' };
        }
        case '..': this.p++; return { t: 'call', name: 'recurse', args: [] };
        case 'field': this.p++; return { t: 'index', e: { t: 'id' }, k: { t: 'lit', v: x.v } };
        case 'var': this.p++; return { t: 'var', name: x.v };
        case '(': { this.p++; const e = this.pipe(); this.eat(')'); return e; }
        case '[': {
          this.p++;
          if (this.is(']')) { this.p++; return { t: 'arr', e: null }; }
          const e = this.pipe();
          this.eat(']');
          return { t: 'arr', e };
        }
        case '{': {
          this.p++;
          const entries = [];
          while (!this.is('}')) {
            let k, v = null;
            const t = this.tk;
            if (t.t === 'ident' || ['if', 'then', 'else', 'end', 'and', 'or', 'as', 'def', 'reduce', 'foreach', 'try', 'catch', 'elif'].includes(t.t)) { this.p++; k = { t: 'lit', v: t.v }; }
            else if (t.t === 'var') { this.p++; k = { t: 'lit', v: t.v }; v = { t: 'var', name: t.v }; }
            else if (t.t === 'str') { this.p++; k = this.strNode(t); }
            else if (t.t === 'format') { this.p++; k = { t: 'format', v: t.v }; }
            else if (t.t === 'num') { this.p++; k = { t: 'lit', v: t.v }; }
            else if (t.t === '(') { this.p++; k = this.pipe(); this.eat(')'); }
            else this.fail();
            if (this.is(':')) {
              this.p++;
              v = this.objVal();
            } else if (!v) v = { t: 'index', e: { t: 'id' }, k };
            entries.push({ k, v });
            if (this.is(',')) { this.p++; continue; }
            if (!this.is('}')) this.fail();
          }
          this.p++;
          return { t: 'obj', entries };
        }
        case 'if': {
          this.p++;
          const cond = this.pipe();
          this.eat('then');
          const then = this.pipe();
          const elifs = [];
          while (this.is('elif')) { this.p++; const c2 = this.pipe(); this.eat('then'); elifs.push({ c: c2, e: this.pipe() }); }
          let els = null;
          if (this.is('else')) { this.p++; els = this.pipe(); }
          this.eat('end');
          let node = els || { t: 'id' };
          for (let k = elifs.length - 1; k >= 0; k--) node = { t: 'if', cond: elifs[k].c, then: elifs[k].e, els: node };
          return { t: 'if', cond, then, els: node };
        }
        case 'try': {
          this.p++;
          const e = this.postfixNoTry();
          let cat = null;
          if (this.is('catch')) { this.p++; cat = this.postfixNoTry(); }
          return { t: 'try', e, c: cat };
        }
        case 'reduce': {
          this.p++;
          const src = this.postfix();
          this.eat('as');
          const pat = this.pattern();
          this.eat('(');
          const init = this.pipe();
          this.eat(';');
          const upd = this.pipe();
          this.eat(')');
          return { t: 'reduce', src, pat, init, upd };
        }
        case 'foreach': {
          this.p++;
          const src = this.postfix();
          this.eat('as');
          const pat = this.pattern();
          this.eat('(');
          const init = this.pipe();
          this.eat(';');
          const upd = this.pipe();
          let ext = null;
          if (this.is(';')) { this.p++; ext = this.pipe(); }
          this.eat(')');
          return { t: 'foreach', src, pat, init, upd, ext };
        }
        case 'ident': {
          this.p++;
          if (x.v === 'true' || x.v === 'false' || x.v === 'null') return { t: 'lit', v: x.v === 'null' ? null : x.v === 'true' };
          const args = [];
          if (this.is('(')) {
            this.p++;
            for (;;) { args.push(this.pipe()); if (this.is(';')) { this.p++; continue; } break; }
            this.eat(')');
          }
          return { t: 'call', name: x.v, args };
        }
        case '-': this.p++; return { t: 'neg', e: this.postfix() };
        default: this.fail();
      }
      return null;
    }
    postfixNoTry() { return this.postfix(); }
    objVal() {
      // 객체 값: '|' 는 괄호 없이 쓸 수 없고 ',' 에서 끝난다
      let l = this.alt();
      while (this.is('|')) { this.p++; l = { t: 'pipe', l, r: this.alt() }; }
      return l;
    }
  }

  const jqType = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'object' ? 'object' : typeof v === 'boolean' ? 'boolean' : typeof v === 'number' ? 'number' : 'string');
  const jqTrunc = (v) => { let s = JSON.stringify(v); if (s === undefined) s = 'null'; return s.length > 11 ? s.slice(0, 10) + '...' : s; };
  const jqDesc = (v) => `${jqType(v)} (${jqTrunc(v)})`;
  const JQ_ORDER = { null: 0, boolean: 1, number: 3, string: 4, array: 5, object: 6 };
  function jqCmp(a, b) {
    const ta = jqType(a), tb = jqType(b);
    if (ta !== tb) {
      const oa = ta === 'boolean' ? (a ? 2 : 1) : JQ_ORDER[ta], ob = tb === 'boolean' ? (b ? 2 : 1) : JQ_ORDER[tb];
      return oa < ob ? -1 : 1;
    }
    if (ta === 'boolean') return a === b ? 0 : a ? 1 : -1;
    if (ta === 'number') return a < b ? -1 : a > b ? 1 : 0;
    if (ta === 'string') return a < b ? -1 : a > b ? 1 : 0;
    if (ta === 'array') { for (let i = 0; i < Math.min(a.length, b.length); i++) { const r = jqCmp(a[i], b[i]); if (r) return r; } return a.length - b.length < 0 ? -1 : a.length > b.length ? 1 : 0; }
    if (ta === 'object') {
      const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
      const r = jqCmp(ka, kb);
      if (r) return r;
      for (const k of ka) { const r2 = jqCmp(a[k], b[k]); if (r2) return r2; }
      return 0;
    }
    return 0;
  }
  const jqEq = (a, b) => jqCmp(a, b) === 0;
  function jqNum(v) {
    if (typeof v !== 'number') return JSON.stringify(v);
    if (Number.isNaN(v)) return 'null';
    if (!isFinite(v)) return v > 0 ? '1.7976931348623157e+308' : '-1.7976931348623157e+308';
    if (Number.isInteger(v) && Math.abs(v) < 1e17) return String(v);
    const s = String(v);
    return s.replace(/e\+?(\d)/, 'e+$1').replace(/e-(\d)$/, 'e-0$1');
  }
  /** JSON 출력 (들여쓰기 · 색) */
  function jqDump(v, o, lvl = 0) {
    const col = o.color;
    const C = (code, s) => (col ? `\x1b[${code}m${s}\x1b[0m` : s);
    const ind = o.indent;
    const nl = ind ? '\n' : '';
    const pad = (k) => (ind ? (o.tab ? '\t'.repeat(k) : ' '.repeat(ind * k)) : '');
    const esc = (s) => { let r = JSON.stringify(s).replace(/\u007f/g, '\\u007f'); if (o.ascii) r = r.replace(/[\u0080-￿]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')); return r; };
    if (v === null) return C('1;30', 'null');
    if (typeof v === 'boolean') return C('0;39', String(v));
    if (typeof v === 'number') return C('0;39', jqNum(v));
    if (typeof v === 'string') return C('0;32', esc(v));
    if (Array.isArray(v)) {
      if (!v.length) return C('1;39', '[]');
      const items = v.map((x) => pad(lvl + 1) + jqDump(x, o, lvl + 1));
      if (!col) return '[' + nl + items.join(',' + nl) + nl + pad(lvl) + ']';
      return C('1;39', '[') + nl + items.join(C('1;39', ',') + nl) + nl + pad(lvl) + C('1;39', ']');
    }
    let keys = Object.keys(v);
    if (o.sort) keys = keys.sort();
    if (!keys.length) return C('1;39', '{}');
    const sep = ind ? ': ' : ':';
    const items = keys.map((k) => pad(lvl + 1) + (col ? `\x1b[34;1m${esc(k)}\x1b[0m` + C('1;39', ':') + (ind ? ' ' : '') : esc(k) + sep) + jqDump(v[k], o, lvl + 1));
    if (!col) return '{' + nl + items.join(',' + nl) + nl + pad(lvl) + '}';
    return C('1;39', '{') + nl + items.join(C('1;39', ',') + nl) + nl + pad(lvl) + C('1;39', '}');
  }
  LX.jqDump = jqDump;

  class JqRT {
    constructor(env) { this.env = env; this.steps = 0; this.t0 = Date.now(); }
    tick() { if ((++this.steps & 0xfff) === 0 && Date.now() - this.t0 > 5000) throw new JqErr('가상 터미널 실행 시간 제한을 넘어 중단했습니다'); }
    /** 결과 배열 */
    ev(node, input, sc) {
      this.tick();
      switch (node.t) {
        case 'id': return [input];
        case 'lit': return [node.v];
        case 'pipe': { const out = []; for (const x of this.ev(node.l, input, sc)) for (const y of this.ev(node.r, x, sc)) out.push(y); return out; }
        case 'comma': return [...this.ev(node.l, input, sc), ...this.ev(node.r, input, sc)];
        case 'index': {
          const out = [];
          for (const base of this.ev(node.e, input, sc)) for (const k of this.ev(node.k, input, sc)) out.push(this.index(base, k));
          return out;
        }
        case 'slice': {
          const out = [];
          for (const base of this.ev(node.e, input, sc)) {
            const froms = node.from ? this.ev(node.from, input, sc) : [null];
            const tos = node.to ? this.ev(node.to, input, sc) : [null];
            for (const fr of froms) for (const to of tos) out.push(this.slice(base, fr, to));
          }
          return out;
        }
        case 'iter': {
          const out = [];
          for (const base of this.ev(node.e, input, sc)) {
            if (Array.isArray(base)) out.push(...base);
            else if (base && typeof base === 'object') out.push(...Object.values(base));
            else throw new JqErr(`Cannot iterate over ${base === null ? 'null' : jqDesc(base)}`);
          }
          return out;
        }
        case 'arr': return [node.e ? this.ev(node.e, input, sc) : []];
        case 'obj': {
          let results = [{}];
          for (const en of node.entries) {
            const ks = this.ev(en.k, input, sc);
            const vs = this.ev(en.v, input, sc);
            const next = [];
            for (const r of results) for (const k of ks) {
              if (typeof k !== 'string') throw new JqErr(`Object keys must be strings`);
              for (const v of vs) next.push(Object.assign({}, r, { [k]: v }));
            }
            results = next;
          }
          return results;
        }
        case 'neg': return this.ev(node.e, input, sc).map((v) => { if (typeof v !== 'number') throw new JqErr(`${jqDesc(v)} cannot be negated`); return -v; });
        case 'bin': {
          const out = [];
          const rs = this.ev(node.r, input, sc);
          const ls = this.ev(node.l, input, sc);
          for (const r of rs) for (const l of ls) out.push(this.binop(node.op, l, r));
          return out;
        }
        case 'and': { const out = []; for (const l of this.ev(node.l, input, sc)) { if (!this.truthy(l)) { out.push(false); continue; } for (const r of this.ev(node.r, input, sc)) out.push(this.truthy(r)); } return out; }
        case 'or': { const out = []; for (const l of this.ev(node.l, input, sc)) { if (this.truthy(l)) { out.push(true); continue; } for (const r of this.ev(node.r, input, sc)) out.push(this.truthy(r)); } return out; }
        case 'alt': {
          let ls = [];
          try { ls = this.ev(node.l, input, sc).filter((x) => this.truthy(x)); } catch (e) { if (!(e instanceof JqErr)) throw e; }
          return ls.length ? ls : this.ev(node.r, input, sc);
        }
        case 'if': {
          const out = [];
          for (const cnd of this.ev(node.cond, input, sc)) out.push(...this.ev(this.truthy(cnd) ? node.then : node.els, input, sc));
          return out;
        }
        case 'try':
          try { return this.ev(node.e, input, sc); } catch (e) {
            if (!(e instanceof JqErr) || e.isBreak) throw e;
            return node.c ? this.ev(node.c, e.v !== undefined ? e.v : e.message, sc) : [];
          }
        case 'var': {
          if (node.name === 'ENV') return [this.env.environ];
          if (node.name === '__loc__') return [{ file: '<stdin>', line: 1 }];
          const v = this.lookup(sc, '$' + node.name);
          if (v === undefined) throw new JqCompile(`$${node.name} is not defined`);
          return [v];
        }
        case 'as': {
          const out = [];
          for (const v of this.ev(node.src, input, sc)) for (const s2 of this.bind(node.pat, v, sc)) out.push(...this.ev(node.body, input, s2));
          return out;
        }
        case 'reduce': {
          let accs = this.ev(node.init, input, sc);
          let acc = accs[accs.length - 1];
          for (const v of this.ev(node.src, input, sc)) for (const s2 of this.bind(node.pat, v, sc)) { const r = this.ev(node.upd, acc, s2); acc = r.length ? r[r.length - 1] : null; }
          return accs.length ? [acc] : [];
        }
        case 'foreach': {
          const out = [];
          let acc = this.ev(node.init, input, sc)[0];
          for (const v of this.ev(node.src, input, sc)) for (const s2 of this.bind(node.pat, v, sc)) {
            for (const r of this.ev(node.upd, acc, s2)) { acc = r; out.push(...(node.ext ? this.ev(node.ext, r, s2) : [r])); }
          }
          return out;
        }
        case 'def': {
          const s2 = { parent: sc, funcs: { [node.name + '/' + node.params.length]: { params: node.params, body: node.body, sc: null } } };
          s2.funcs[node.name + '/' + node.params.length].sc = s2;
          return this.ev(node.rest, input, s2);
        }
        case 'format': return [this.format(node.v, input)];
        case 'interp': {
          let results = [''];
          for (const p of node.parts) {
            if (typeof p === 'string') { results = results.map((r) => r + p); continue; }
            const vs = this.ev(p, input, sc);
            const next = [];
            for (const r of results) for (const v of vs) next.push(r + (node.fmt ? this.format(node.fmt, v) : typeof v === 'string' ? v : JSON.stringify(v)));
            results = next;
          }
          return results;
        }
        case 'assign': return this.assign(node, input, sc);
        case 'call': return this.call(node, input, sc);
        default: throw new JqErr('unknown node ' + node.t);
      }
    }
    lookup(sc, key) { for (let s = sc; s; s = s.parent) { if (s.vars && key in s.vars) return s.vars[key]; } return undefined; }
    findFn(sc, key) { for (let s = sc; s; s = s.parent) { if (s.funcs && s.funcs[key]) return s.funcs[key]; } return null; }
    bind(pat, v, sc) {
      const vars = {};
      const walk = (p, x) => {
        if (p.t === 'pvar') { vars['$' + p.name] = x; return; }
        if (p.t === 'parr') { p.items.forEach((it, i) => walk(it, Array.isArray(x) ? (x[i] === undefined ? null : x[i]) : x === null ? null : (() => { throw new JqErr(`Cannot index ${jqType(x)} with number`); })())); return; }
        if (p.t === 'pobj') { for (const it of p.items) { const k = this.ev(it.key, x, sc)[0]; if (it.key.t === 'lit' && it.pat.t === 'pvar' && it.pat.name === it.key.v) vars['$' + it.key.v] = this.index(x, k); walk(it.pat, this.index(x, k)); } }
      };
      walk(pat, v);
      return [{ parent: sc, vars }];
    }
    truthy(v) { return !(v === null || v === false); }
    index(base, k) {
      if (base === null) {
        if (typeof k === 'string' || typeof k === 'number' || k === null) return null;
        if (k && typeof k === 'object' && !Array.isArray(k)) return null;
      }
      if (typeof k === 'string') {
        if (base && typeof base === 'object' && !Array.isArray(base)) return Object.prototype.hasOwnProperty.call(base, k) ? base[k] : null;
        throw new JqErr(`Cannot index ${jqType(base)} with "${k}"`);
      }
      if (typeof k === 'number') {
        if (Array.isArray(base)) { let i = Math.floor(k); if (i < 0) i += base.length; return i >= 0 && i < base.length ? base[i] : null; }
        throw new JqErr(`Cannot index ${jqType(base)} with number`);
      }
      if (k && typeof k === 'object' && !Array.isArray(k) && Array.isArray(base)) return this.slice(base, k.start, k.end);
      if (Array.isArray(k) && Array.isArray(base)) { const out = []; for (let i = 0; i + k.length <= base.length; i++) if (k.every((x, j) => jqEq(x, base[i + j]))) out.push(i); return out; }
      throw new JqErr(`Cannot index ${jqType(base)} with ${jqType(k)}`);
    }
    slice(base, fr, to) {
      if (base === null) return null;
      if (typeof base !== 'string' && !Array.isArray(base)) throw new JqErr(`Cannot index ${jqType(base)} with object`);
      const len = base.length;
      let a = fr == null ? 0 : Math.floor(fr), b = to == null ? len : Math.ceil(to);
      if (a < 0) a = Math.max(0, len + a);
      if (b < 0) b = Math.max(0, len + b);
      return base.slice(Math.min(a, len), Math.min(Math.max(b, a), len));
    }
    binop(op, l, r) {
      switch (op) {
        case '+':
          if (l === null) return r;
          if (r === null) return l;
          if (typeof l === 'number' && typeof r === 'number') return l + r;
          if (typeof l === 'string' && typeof r === 'string') return l + r;
          if (Array.isArray(l) && Array.isArray(r)) return l.concat(r);
          if (jqType(l) === 'object' && jqType(r) === 'object') return Object.assign({}, l, r);
          throw new JqErr(`${jqDesc(l)} and ${jqDesc(r)} cannot be added`);
        case '-':
          if (typeof l === 'number' && typeof r === 'number') return l - r;
          if (Array.isArray(l) && Array.isArray(r)) return l.filter((x) => !r.some((y) => jqEq(x, y)));
          throw new JqErr(`${jqDesc(l)} and ${jqDesc(r)} cannot be subtracted`);
        case '*':
          if (typeof l === 'number' && typeof r === 'number') return l * r;
          if (typeof l === 'string' && typeof r === 'number') return r > 0 ? l.repeat(Math.ceil(r)) : null;
          if (typeof r === 'string' && typeof l === 'number') return l > 0 ? r.repeat(Math.ceil(l)) : null;
          if (jqType(l) === 'object' && jqType(r) === 'object') {
            const deep = (a, b) => { const o = Object.assign({}, a); for (const k of Object.keys(b)) o[k] = jqType(a[k]) === 'object' && jqType(b[k]) === 'object' ? deep(a[k], b[k]) : b[k]; return o; };
            return deep(l, r);
          }
          throw new JqErr(`${jqDesc(l)} and ${jqDesc(r)} cannot be multiplied`);
        case '/':
          if (typeof l === 'number' && typeof r === 'number') { if (r === 0) throw new JqErr(`${jqDesc(l)} and ${jqDesc(r)} cannot be divided because the divisor is zero`); return l / r; }
          if (typeof l === 'string' && typeof r === 'string') return l.split(r);
          throw new JqErr(`${jqDesc(l)} and ${jqDesc(r)} cannot be divided`);
        case '%':
          if (typeof l === 'number' && typeof r === 'number') { if (Math.trunc(r) === 0) throw new JqErr(`${jqDesc(l)} and ${jqDesc(r)} cannot be divided because the divisor is zero`); return Math.trunc(l) % Math.trunc(r); }
          throw new JqErr(`${jqDesc(l)} and ${jqDesc(r)} cannot be divided`);
        case '==': return jqEq(l, r);
        case '!=': return !jqEq(l, r);
        case '<': return jqCmp(l, r) < 0;
        case '<=': return jqCmp(l, r) <= 0;
        case '>': return jqCmp(l, r) > 0;
        case '>=': return jqCmp(l, r) >= 0;
        default: throw new JqErr('bad op');
      }
    }
    // ---------------------------------------------- 경로
    paths(node, input, sc, root) {
      // [ [path, value] ... ]
      switch (node.t) {
        case 'id': return [[[], input]];
        case 'pipe': { const out = []; for (const [p, v] of this.paths(node.l, input, sc, root)) for (const [p2, v2] of this.paths(node.r, v, sc, root)) out.push([p.concat(p2), v2]); return out; }
        case 'comma': return [...this.paths(node.l, input, sc, root), ...this.paths(node.r, input, sc, root)];
        case 'index': {
          const out = [];
          for (const [p, v] of this.paths(node.e, input, sc, root)) for (const k of this.ev(node.k, root, sc)) out.push([p.concat([k]), v === null ? null : this.index(v, k)]);
          return out;
        }
        case 'slice': {
          const out = [];
          for (const [p, v] of this.paths(node.e, input, sc, root)) {
            const fr = node.from ? this.ev(node.from, root, sc)[0] : null, to = node.to ? this.ev(node.to, root, sc)[0] : null;
            out.push([p.concat([{ start: fr, end: to }]), this.slice(v, fr, to)]);
          }
          return out;
        }
        case 'iter': {
          const out = [];
          for (const [p, v] of this.paths(node.e, input, sc, root)) {
            if (Array.isArray(v)) v.forEach((x, i) => out.push([p.concat([i]), x]));
            else if (v && typeof v === 'object') Object.keys(v).forEach((k) => out.push([p.concat([k]), v[k]]));
            else if (v !== null) throw new JqErr(`Cannot iterate over ${jqDesc(v)}`);
          }
          return out;
        }
        case 'if': {
          const out = [];
          for (const cnd of this.ev(node.cond, input, sc)) out.push(...this.paths(this.truthy(cnd) ? node.then : node.els, input, sc, root));
          return out;
        }
        case 'alt': {
          let ls = [];
          try { ls = this.paths(node.l, input, sc, root).filter(([, v]) => this.truthy(v)); } catch (e) { if (!(e instanceof JqErr)) throw e; }
          return ls.length ? ls : this.paths(node.r, input, sc, root);
        }
        case 'try': try { return this.paths(node.e, input, sc, root); } catch (e) { if (e instanceof JqErr) return []; throw e; }
        case 'call': {
          const nm = node.name;
          if (nm === 'select') return this.ev(node.args[0], input, sc).some((x) => this.truthy(x)) ? [[[], input]] : [];
          if (nm === 'recurse' && !node.args.length) {
            const out = [];
            const walk = (p, v) => { out.push([p, v]); if (Array.isArray(v)) v.forEach((x, i) => walk(p.concat([i]), x)); else if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(p.concat([k]), v[k])); };
            walk([], input);
            return out;
          }
          if (nm === 'empty') return [];
          if (nm === 'first' && node.args.length) { const r = this.paths(node.args[0], input, sc, root); return r.slice(0, 1); }
          if (nm === 'last' && !node.args.length) return [[[-1], Array.isArray(input) ? input[input.length - 1] : null]];
          if (nm === 'first' && !node.args.length) return [[[0], Array.isArray(input) ? input[0] : null]];
          if (nm === 'getpath') { const p = this.ev(node.args[0], input, sc)[0]; return [[p, this.getpath(input, p)]]; }
          if (nm === 'map') return this.paths({ t: 'pipe', l: { t: 'iter', e: { t: 'id' } }, r: node.args[0] }, input, sc, root);
          const fn = this.findFn(sc, nm + '/' + node.args.length);
          if (fn) { const s2 = this.fnScope(fn, node, sc); return this.paths(fn.body, input, s2, root); }
          throw new JqErr(`Invalid path expression with result ${jqTrunc(this.ev(node, input, sc)[0])}`);
        }
        case 'as': {
          const out = [];
          for (const v of this.ev(node.src, input, sc)) for (const s2 of this.bind(node.pat, v, sc)) out.push(...this.paths(node.body, input, s2, root));
          return out;
        }
        default: {
          const v = this.ev(node, input, sc)[0];
          throw new JqErr(`Invalid path expression with result ${jqTrunc(v)}`);
        }
      }
    }
    getpath(v, p) {
      let cur = v;
      for (const k of p) { if (cur === null) return null; cur = this.index(cur, k); }
      return cur;
    }
    setpath(v, p, x) {
      if (!p.length) return x;
      const [k, ...rest] = p;
      if (typeof k === 'string') {
        if (v !== null && (typeof v !== 'object' || Array.isArray(v))) throw new JqErr(`Cannot index ${jqType(v)} with "${k}"`);
        const o = Object.assign({}, v || {});
        o[k] = this.setpath(o[k] === undefined ? null : o[k], rest, x);
        return o;
      }
      if (typeof k === 'number') {
        if (v !== null && !Array.isArray(v)) throw new JqErr(`Cannot index ${jqType(v)} with number`);
        const a = (v || []).slice();
        let i = k < 0 ? a.length + k : k;
        if (i < 0) throw new JqErr('Out of bounds negative array index');
        while (a.length < i) a.push(null);
        a[i] = this.setpath(a[i] === undefined ? null : a[i], rest, x);
        return a;
      }
      if (k && typeof k === 'object') {
        const a = (v || []).slice();
        const len = a.length;
        let s = k.start == null ? 0 : k.start, e = k.end == null ? len : k.end;
        if (s < 0) s = Math.max(0, len + s);
        if (e < 0) e = Math.max(0, len + e);
        const cur = a.slice(s, Math.max(s, e));
        const nv = this.setpath(cur, rest, x);
        if (!Array.isArray(nv)) throw new JqErr('A slice of an array can only be assigned another array');
        a.splice(s, Math.max(0, e - s), ...nv);
        return a;
      }
      throw new JqErr('Invalid path component');
    }
    delpaths(v, ps) {
      ps = ps.slice().sort((a, b) => jqCmp(b, a));
      for (const p of ps) v = this.delpath(v, p);
      return v;
    }
    delpath(v, p) {
      if (v === null) return null;
      if (p.length === 1) {
        const k = p[0];
        if (Array.isArray(v)) {
          const a = v.slice();
          if (typeof k === 'number') { const i = k < 0 ? a.length + k : k; if (i >= 0 && i < a.length) a.splice(i, 1); return a; }
          if (k && typeof k === 'object') { const len = a.length; let s = k.start == null ? 0 : k.start, e = k.end == null ? len : k.end; if (s < 0) s += len; if (e < 0) e += len; a.splice(s, Math.max(0, e - s)); return a; }
          throw new JqErr(`Cannot delete field at object index of array`);
        }
        if (typeof v === 'object') { const o = Object.assign({}, v); delete o[k]; return o; }
        throw new JqErr(`Cannot delete field at index of ${jqType(v)}`);
      }
      const [k, ...rest] = p;
      const child = this.index(v, k);
      if (child === null) return v;
      return this.setpath(v, [k], this.delpath(child, rest));
    }
    assign(node, input, sc) {
      const op = node.op;
      if (op === '=') {
        const out = [];
        for (const val of this.ev(node.r, input, sc)) {
          let v = input;
          for (const [p] of this.paths(node.l, input, sc, input)) v = this.setpath(v, p, val);
          out.push(v);
        }
        return out;
      }
      if (op === '|=') {
        let v = input;
        for (const [p] of this.paths(node.l, input, sc, input)) {
          const r = this.ev(node.r, this.getpath(v, p), sc);
          v = r.length ? this.setpath(v, p, r[0]) : this.delpath(v, p);
        }
        return [v];
      }
      const bop = op.slice(0, -1);
      const out = [];
      for (const rv of this.ev(node.r, input, sc)) {
        let v = input;
        for (const [p] of this.paths(node.l, input, sc, input)) {
          const cur = this.getpath(v, p);
          v = this.setpath(v, p, bop === '//' ? (this.truthy(cur) ? cur : rv) : this.binop(bop, cur, rv));
        }
        out.push(v);
      }
      return out;
    }
    format(f, v) {
      const str = (x) => (typeof x === 'string' ? x : JSON.stringify(x));
      switch (f) {
        case '@text': return str(v);
        case '@json': return JSON.stringify(v);
        case '@csv':
          if (!Array.isArray(v)) throw new JqErr(`${jqDesc(v)} cannot be csv-formatted, only an array can be`);
          return v.map((x) => (typeof x === 'string' ? '"' + x.replace(/"/g, '""') + '"' : x === null ? '' : typeof x === 'object' ? (() => { throw new JqErr(`${jqDesc(x)} is not valid in a csv row`); })() : jqNum(x))).join(',');
        case '@tsv':
          if (!Array.isArray(v)) throw new JqErr(`${jqDesc(v)} cannot be tsv-formatted, only an array can be`);
          return v.map((x) => (typeof x === 'string' ? x.replace(/\\/g, '\\\\').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\r/g, '\\r') : x === null ? '' : jqNum(x))).join('\t');
        case '@html': return str(v).replace(/[<>&'"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' }[ch]));
        case '@uri': return Array.from(utf8(str(v)), (b) => (/[A-Za-z0-9\-_.~]/.test(String.fromCharCode(b)) ? String.fromCharCode(b) : '%' + b.toString(16).toUpperCase().padStart(2, '0'))).join('');
        case '@sh': return (Array.isArray(v) ? v : [v]).map((x) => (typeof x === 'string' ? `'${x.replace(/'/g, "'\\''")}'` : typeof x === 'object' && x !== null ? (() => { throw new JqErr(`${jqDesc(x)} can not be escaped for shell`); })() : JSON.stringify(x))).join(' ');
        case '@base64': return b64enc(utf8(str(v)));
        case '@base64d': return fromUtf8(b64dec(str(v), true).bytes);
        case '@base32': { const bytes = utf8(str(v)); const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '', out = ''; bytes.forEach((b) => { bits += b.toString(2).padStart(8, '0'); }); for (let i = 0; i < bits.length; i += 5) out += A[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]; while (out.length % 8) out += '='; return out; }
        default: throw new JqCompile(`${f.slice(1)} is not a valid format`);
      }
    }
    fnScope(fn, node, sc) {
      const s2 = { parent: fn.sc, funcs: {}, vars: {} };
      fn.params.forEach((p, i) => {
        if (p.startsWith('$')) {
          const vals = this.ev(node.args[i], null, sc);
          s2.vars[p] = vals[0];
          s2.funcs[p.slice(1) + '/0'] = { params: [], body: { t: 'lit', v: vals[0] }, sc: s2 };
        } else s2.funcs[p + '/0'] = { params: [], body: node.args[i], sc, closure: true };
      });
      return s2;
    }
    call(node, input, sc) {
      const nm = node.name;
      const a = node.args;
      const key = nm + '/' + a.length;
      const fn = this.findFn(sc, key);
      if (fn) {
        if (fn.closure) return this.ev(fn.body, input, fn.sc);
        return this.ev(fn.body, input, this.fnScope(fn, node, sc));
      }
      const A = (k) => this.ev(a[k], input, sc);
      const A1 = (k) => { const r = A(k); return r[0]; };
      const need = (types) => { if (!types.includes(jqType(input))) throw new JqErr(`${jqDesc(input)} ${types.includes('string') && types.length === 1 ? 'cannot be ' + nm : 'has no ' + nm}`); };
      switch (key) {
        case 'empty/0': return [];
        case 'not/0': return [!this.truthy(input)];
        case 'length/0':
          if (input === null) return [0];
          if (typeof input === 'boolean') throw new JqErr(`boolean (${input}) has no length`);
          if (typeof input === 'number') return [Math.abs(input)];
          if (typeof input === 'string') return [Array.from(input).length];
          return [Array.isArray(input) ? input.length : Object.keys(input).length];
        case 'utf8bytelength/0': need(['string']); return [utf8(input).length];
        case 'keys/0': case 'keys_unsorted/0':
          if (Array.isArray(input)) return [input.map((x, i) => i)];
          if (jqType(input) !== 'object') throw new JqErr(`${jqDesc(input)} has no keys`);
          return [nm === 'keys' ? Object.keys(input).sort() : Object.keys(input)];
        case 'values/0': return this.truthy(input) || input === false ? (input === null ? [] : [input]) : [];
        case 'has/1': return A(0).map((k) => (Array.isArray(input) ? k >= 0 && k < input.length : jqType(input) === 'object' ? Object.prototype.hasOwnProperty.call(input, k) : (() => { throw new JqErr(`Cannot check whether ${jqType(input)} has a ${jqType(k)} key`); })()));
        case 'in/1': return A(0).map((o) => (Array.isArray(o) ? input >= 0 && input < o.length : Object.prototype.hasOwnProperty.call(o || {}, input)));
        case 'map/1': {
          if (!Array.isArray(input) && jqType(input) !== 'object') throw new JqErr(`Cannot iterate over ${jqDesc(input)}`);
          const out = [];
          for (const x of Array.isArray(input) ? input : Object.values(input)) out.push(...this.ev(a[0], x, sc));
          return [out];
        }
        case 'map_values/1': {
          if (Array.isArray(input)) return [input.map((x) => this.ev(a[0], x, sc)).filter((r) => r.length).map((r) => r[0])];
          const o = {};
          for (const k of Object.keys(input || {})) { const r = this.ev(a[0], input[k], sc); if (r.length) o[k] = r[0]; }
          return [o];
        }
        case 'select/1': return A(0).filter((x) => this.truthy(x)).map(() => input);
        case 'recurse/0': {
          const out = [];
          const walk = (v) => { out.push(v); if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
          walk(input);
          return out;
        }
        case 'recurse/1': case 'recurse/2': {
          const out = [];
          const walk = (v, d) => { if (d > 10000) return; out.push(v); for (const x of this.ev(a[0], v, sc)) { if (a[1] && !this.truthy(this.ev(a[1], x, sc)[0])) continue; walk(x, d + 1); } };
          try { walk(input, 0); } catch (e) { if (!(e instanceof JqErr)) throw e; }
          return out;
        }
        case 'env/0': return [this.env.environ];
        case 'builtins/0': return [['length/0', 'keys/0', 'map/1', 'select/1']];
        case 'input_filename/0': return [this.env.filename || null];
        case 'now/0': return [this.env.now / 1000];
        case 'type/0': return [jqType(input)];
        case 'tostring/0': return [typeof input === 'string' ? input : JSON.stringify(input)];
        case 'tojson/0': return [JSON.stringify(input)];
        case 'fromjson/0': { need(['string']); const r = jsonStream(input); if (r.err) throw new JqErr(`${input} (while parsing '${input}')`); return [r.length ? r[0].v : null]; }
        case 'tonumber/0':
          if (typeof input === 'number') return [input];
          if (typeof input === 'string' && /^\s*-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(input)) return [parseFloat(input)];
          throw new JqErr(typeof input === 'string' ? `Cannot parse '${input}' as JSON` : `${jqDesc(input)} cannot be parsed as a number`);
        case 'ascii_downcase/0': need(['string']); return [input.replace(/[A-Z]/g, (ch) => ch.toLowerCase())];
        case 'ascii_upcase/0': need(['string']); return [input.replace(/[a-z]/g, (ch) => ch.toUpperCase())];
        case 'ascii/0': return [String.fromCharCode(input)];
        case 'explode/0': need(['string']); return [Array.from(input, (ch) => ch.codePointAt(0))];
        case 'implode/0': return [String.fromCodePoint(...input)];
        case 'ltrimstr/1': return A(0).map((s) => (typeof input === 'string' && typeof s === 'string' && input.startsWith(s) ? input.slice(s.length) : input));
        case 'rtrimstr/1': return A(0).map((s) => (typeof input === 'string' && typeof s === 'string' && s && input.endsWith(s) ? input.slice(0, -s.length) : input));
        case 'trim/0': need(['string']); return [input.trim()];
        case 'ltrim/0': need(['string']); return [input.replace(/^\s+/, '')];
        case 'rtrim/0': need(['string']); return [input.replace(/\s+$/, '')];
        case 'startswith/1': return A(0).map((s) => { if (typeof input !== 'string' || typeof s !== 'string') throw new JqErr('startswith() requires string inputs'); return input.startsWith(s); });
        case 'endswith/1': return A(0).map((s) => { if (typeof input !== 'string' || typeof s !== 'string') throw new JqErr('endswith() requires string inputs'); return input.endsWith(s); });
        case 'split/1': return A(0).map((s) => { if (typeof input !== 'string') throw new JqErr('split input must be a string'); return input.split(s); });
        case 'split/2': return A(0).map((re) => input.split(new RegExp(re, this.reFlags(A1(1)))));
        case 'join/1': return A(0).map((s) => { if (!Array.isArray(input)) throw new JqErr(`Cannot iterate over ${jqDesc(input)}`); return input.map((x) => { if (x === null) return ''; if (typeof x === 'object') throw new JqErr(`Cannot join with ${jqType(x)}`); return String(typeof x === 'number' ? jqNum(x) : x); }).join(s); });
        case 'contains/1': return A(0).map((b) => this.contains(input, b));
        case 'inside/1': return A(0).map((b) => this.contains(b, input));
        case 'add/0': {
          const arr = Array.isArray(input) ? input : input && typeof input === 'object' ? Object.values(input) : null;
          if (!arr) { if (input === null) return [null]; throw new JqErr(`Cannot iterate over ${jqDesc(input)}`); }
          return [arr.reduce((acc, x) => (acc === undefined ? x : this.binop('+', acc, x)), undefined) ?? null];
        }
        case 'any/0': return [Array.isArray(input) && input.some((x) => this.truthy(x))];
        case 'all/0': return [Array.isArray(input) && input.every((x) => this.truthy(x))];
        case 'any/1': return [(input || []).some((x) => this.ev(a[0], x, sc).some((y) => this.truthy(y)))];
        case 'all/1': return [(input || []).every((x) => this.ev(a[0], x, sc).every((y) => this.truthy(y)))];
        case 'any/2': return [A(0).some((x) => this.ev(a[1], x, sc).some((y) => this.truthy(y)))];
        case 'all/2': return [A(0).every((x) => this.ev(a[1], x, sc).every((y) => this.truthy(y)))];
        case 'flatten/0': case 'flatten/1': {
          const depth = a.length ? A1(0) : 1e9;
          if (depth < 0) throw new JqErr('flatten depth must not be negative');
          const fl = (arr, d) => arr.reduce((acc, x) => (Array.isArray(x) && d > 0 ? acc.concat(fl(x, d - 1)) : acc.concat([x])), []);
          if (!Array.isArray(input)) throw new JqErr(`Cannot iterate over ${jqDesc(input)}`);
          return [fl(input, depth)];
        }
        case 'range/1': { const n = A1(0); const out = []; for (let i = 0; i < n && out.length < 1e6; i++) out.push(i); return out; }
        case 'range/2': { const out = []; for (const f0 of A(0)) for (const t0 of A(1)) for (let i = f0; i < t0 && out.length < 1e6; i++) out.push(i); return out; }
        case 'range/3': { const f0 = A1(0), t0 = A1(1), st = A1(2); const out = []; if (st > 0) for (let i = f0; i < t0 && out.length < 1e6; i += st) out.push(i); else if (st < 0) for (let i = f0; i > t0 && out.length < 1e6; i += st) out.push(i); return out; }
        case 'floor/0': return [Math.floor(input)];
        case 'ceil/0': return [Math.ceil(input)];
        case 'round/0': return [Math.round(input)];
        case 'sqrt/0': return [Math.sqrt(input)];
        case 'fabs/0': case 'abs/0': if (typeof input !== 'number') throw new JqErr(`${jqDesc(input)} has no absolute value`); return [Math.abs(input)];
        case 'log/0': return [Math.log(input)];
        case 'log10/0': return [Math.log10(input)];
        case 'log2/0': return [Math.log2(input)];
        case 'exp/0': return [Math.exp(input)];
        case 'exp10/0': return [Math.pow(10, input)];
        case 'pow/2': return [Math.pow(A1(0), A1(1))];
        case 'infinite/0': return [Infinity];
        case 'nan/0': return [NaN];
        case 'isinfinite/0': return [input === Infinity || input === -Infinity];
        case 'isnan/0': return [Number.isNaN(input)];
        case 'isnormal/0': return [typeof input === 'number' && isFinite(input) && input !== 0];
        case 'tojson/1': return [JSON.stringify(input)];
        case 'sort/0': if (!Array.isArray(input)) throw new JqErr(`${jqDesc(input)} cannot be sorted, as it is not an array`); return [input.slice().sort(jqCmp)];
        case 'sort_by/1': {
          if (!Array.isArray(input)) throw new JqErr(`${jqDesc(input)} cannot be sorted, as it is not an array`);
          const ks = input.map((x, i) => ({ x, i, k: this.ev(a[0], x, sc) }));
          ks.sort((p, q) => jqCmp(p.k, q.k) || p.i - q.i);
          return [ks.map((p) => p.x)];
        }
        case 'group_by/1': {
          if (!Array.isArray(input)) throw new JqErr(`Cannot index ${jqType(input)} with number`);
          const ks = input.map((x, i) => ({ x, i, k: this.ev(a[0], x, sc) }));
          ks.sort((p, q) => jqCmp(p.k, q.k) || p.i - q.i);
          const out = [];
          ks.forEach((p, i) => { if (i && jqEq(p.k, ks[i - 1].k)) out[out.length - 1].push(p.x); else out.push([p.x]); });
          return [out];
        }
        case 'unique/0': { const s = input.slice().sort(jqCmp); return [s.filter((x, i) => !i || !jqEq(x, s[i - 1]))]; }
        case 'unique_by/1': {
          const ks = input.map((x, i) => ({ x, i, k: this.ev(a[0], x, sc) }));
          ks.sort((p, q) => jqCmp(p.k, q.k) || p.i - q.i);
          return [ks.filter((p, i) => !i || !jqEq(p.k, ks[i - 1].k)).map((p) => p.x)];
        }
        case 'min/0': case 'max/0': {
          if (!Array.isArray(input)) throw new JqErr(`${jqDesc(input)} cannot be sorted, as it is not an array`);
          if (!input.length) return [null];
          return [input.reduce((m, x) => (nm === 'min' ? (jqCmp(x, m) < 0 ? x : m) : (jqCmp(x, m) >= 0 ? x : m)))];
        }
        case 'min_by/1': case 'max_by/1': {
          if (!input.length) return [null];
          const ks = input.map((x) => ({ x, k: this.ev(a[0], x, sc) }));
          return [ks.reduce((m, p) => (nm === 'min_by' ? (jqCmp(p.k, m.k) < 0 ? p : m) : (jqCmp(p.k, m.k) >= 0 ? p : m))).x];
        }
        case 'reverse/0': if (input === null) return [[]]; if (typeof input === 'string') return [Array.from(input).reverse().join('')]; return [input.slice().reverse()];
        case 'to_entries/0': return [Object.keys(input).map((k) => ({ key: k, value: input[k] }))];
        case 'from_entries/0': {
          const o = {};
          for (const e of input) {
            const k = e.key !== undefined ? e.key : e.k !== undefined ? e.k : e.name !== undefined ? e.name : e.Name !== undefined ? e.Name : e.Key !== undefined ? e.Key : e.K;
            const v = e.value !== undefined ? e.value : e.v !== undefined ? e.v : e.Value !== undefined ? e.Value : e.V;
            if (k === undefined || k === null) throw new JqErr(`Cannot use null (null) as object key`);
            o[typeof k === 'string' ? k : JSON.stringify(k)] = v === undefined ? null : v;
          }
          return [o];
        }
        case 'with_entries/1': {
          const ents = Object.keys(input).map((k) => ({ key: k, value: input[k] }));
          const mapped = [];
          for (const e of ents) mapped.push(...this.ev(a[0], e, sc));
          return this.call({ name: 'from_entries', args: [] }, mapped, sc);
        }
        case 'paths/0': case 'paths/1': case 'leaf_paths/0': {
          const out = [];
          const walk = (p, v) => {
            if (p.length) {
              if (key === 'paths/0') out.push(p);
              else if (key === 'leaf_paths/0') { if (v === null || typeof v !== 'object') out.push(p); }
              else if (this.ev(a[0], v, sc).some((x) => this.truthy(x))) out.push(p);
            }
            if (Array.isArray(v)) v.forEach((x, i) => walk(p.concat([i]), x));
            else if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(p.concat([k]), v[k]));
          };
          walk([], input);
          return out;
        }
        case 'path/1': return this.paths(a[0], input, sc, input).map(([p]) => p);
        case 'getpath/1': return A(0).map((p) => { try { return this.getpath(input, p); } catch (e) { return null; } });
        case 'setpath/2': return A(1).map((v) => this.setpath(input, A1(0), v));
        case 'delpaths/1': return [this.delpaths(input, A1(0))];
        case 'del/1': return [this.delpaths(input, this.paths(a[0], input, sc, input).map(([p]) => p))];
        case 'to_array/0': case 'toarray/0': return [Array.isArray(input) ? input : [input]];
        case 'pick/1': { let o = null; for (const [p] of this.paths(a[0], input, sc, input)) o = this.setpath(o, p, this.getpath(input, p)); return [o]; }
        case 'first/0': return [this.index(input, 0)];
        case 'last/0': return [this.index(input, -1)];
        case 'nth/1': return A(0).map((n) => this.index(input, n));
        case 'first/1': { const r = A(0); return r.slice(0, 1); }
        case 'last/1': { const r = A(0); return r.length ? [r[r.length - 1]] : []; }
        case 'nth/2': { const n = A1(0); const r = A(1); return r.length > n ? [r[n]] : []; }
        case 'limit/2': { const n = A1(0); return n <= 0 ? [] : A(1).slice(0, n); }
        case 'until/2': { let v = input; for (let g = 0; g < 1e6; g++) { if (this.truthy(this.ev(a[0], v, sc)[0])) return [v]; v = this.ev(a[1], v, sc)[0]; } return [v]; }
        case 'while/2': { const out = []; let v = input; for (let g = 0; g < 1e5; g++) { if (!this.truthy(this.ev(a[0], v, sc)[0])) break; out.push(v); v = this.ev(a[1], v, sc)[0]; } return out; }
        case 'repeat/1': { const out = []; let v = input; for (let g = 0; g < 1e4; g++) { out.push(v); const r = this.ev(a[0], v, sc); if (!r.length) break; v = r[0]; } return out; }
        case 'isempty/1': return [A(0).length === 0];
        case 'error/0': throw new JqErr(typeof input === 'string' ? input : `${JSON.stringify(input)} (not a string)`, input);
        case 'error/1': { const m = A1(0); throw new JqErr(typeof m === 'string' ? m : `${JSON.stringify(m)} (not a string)`, m); }
        case 'halt/0': throw Object.assign(new JqErr('halt'), { halt: 0 });
        case 'halt_error/0': case 'halt_error/1': throw Object.assign(new JqErr(typeof input === 'string' ? input : JSON.stringify(input) + '\n'), { halt: a.length ? A1(0) : 5, haltMsg: true });
        case 'debug/0': this.env.err(`["DEBUG:",${JSON.stringify(input)}]\n`); return [input];
        case 'debug/1': this.env.err(`["DEBUG:",${JSON.stringify(A1(0))}]\n`); return [input];
        case 'stderr/0': this.env.err(JSON.stringify(input)); return [input];
        case 'input/0': { const v = this.env.nextInput(); if (v === undefined) throw new JqErr('No more inputs'); return [v]; }
        case 'inputs/0': { const out = []; for (;;) { const v = this.env.nextInput(); if (v === undefined) break; out.push(v); } return out; }
        case 'indices/1': case 'index/1': case 'rindex/1': {
          const r = A(0).map((s) => {
            let idx;
            if (typeof input === 'string' && typeof s === 'string') { idx = []; if (s) for (let i = input.indexOf(s); i >= 0; i = input.indexOf(s, i + 1)) idx.push(i); }
            else if (Array.isArray(input)) idx = Array.isArray(s) ? this.index(input, s) : input.map((x, i) => (jqEq(x, s) ? i : -1)).filter((i) => i >= 0);
            else if (input === null) return null;
            else throw new JqErr(`Cannot determine indices of ${jqType(s)} in ${jqType(input)}`);
            if (nm === 'indices') return idx;
            if (!idx.length) return null;
            return nm === 'index' ? idx[0] : idx[idx.length - 1];
          });
          return r;
        }
        case 'test/1': case 'test/2': return A(0).map((re) => { if (typeof input !== 'string') throw new JqErr(`${jqDesc(input)} cannot be matched, as it is not a string`); return new RegExp(re, this.reFlags(a[1] ? A1(1) : null)).test(input); });
        case 'match/1': case 'match/2': case 'capture/1': case 'capture/2': case 'scan/1': case 'scan/2': {
          if (typeof input !== 'string') throw new JqErr(`${jqDesc(input)} cannot be matched, as it is not a string`);
          const flags = a[1] ? String(A1(1)) : '';
          const re = new RegExp(A1(0), 'g' + this.reFlags(flags).replace('g', ''));
          const ms = [];
          let m;
          while ((m = re.exec(input))) {
            ms.push(m);
            if (m[0] === '') re.lastIndex++;
            if (!flags.includes('g') && nm === 'match') break;
            if (nm === 'capture' && !flags.includes('g')) break;
          }
          const names = [];
          A1(0).replace(/\(\?<([A-Za-z_][A-Za-z0-9_]*)>/g, (x, g) => { names.push(g); return x; });
          if (nm === 'scan') return ms.map((mm) => (mm.length > 1 ? mm.slice(1) : mm[0]));
          if (nm === 'capture') return ms.map((mm) => Object.assign({}, mm.groups || {}));
          return ms.map((mm) => ({ offset: mm.index, length: mm[0].length, string: mm[0], captures: mm.slice(1).map((cs, i) => ({ offset: cs === undefined ? -1 : input.indexOf(cs, mm.index), length: cs === undefined ? 0 : cs.length, string: cs === undefined ? null : cs, name: names[i] || null })) }));
        }
        case 'sub/2': case 'sub/3': case 'gsub/2': case 'gsub/3': {
          if (typeof input !== 'string') throw new JqErr(`${jqDesc(input)} cannot be matched, as it is not a string`);
          const flags = (a[2] ? String(A1(2)) : '') + (nm === 'gsub' ? 'g' : '');
          const re = new RegExp(A1(0), this.reFlags(flags));
          const out = input.replace(re, (...args) => {
            const groups = typeof args[args.length - 1] === 'object' ? args[args.length - 1] : {};
            const r = this.ev(a[1], groups || {}, sc);
            return r.length ? String(r[0]) : '';
          });
          return [out];
        }
        case 'splits/1': case 'splits/2': return input.split(new RegExp(A1(0), this.reFlags(a[1] ? A1(1) : null)));
        case 'ascii/1': return [String.fromCharCode(A1(0))];
        case 'tostream/0': {
          const out = [];
          const walk = (p, v, top) => {
            if (v && typeof v === 'object' && (Array.isArray(v) ? v.length : Object.keys(v).length)) {
              const ks = Array.isArray(v) ? v.map((x, i) => i) : Object.keys(v);
              ks.forEach((k) => walk(p.concat([k]), v[k], false));
              out.push([p.concat([ks[ks.length - 1]])]);
            } else out.push([p, v]);
            void top;
          };
          walk([], input, true);
          return out;
        }
        case 'splits/0': return [input];
        case 'objects/0': return jqType(input) === 'object' ? [input] : [];
        case 'arrays/0': return Array.isArray(input) ? [input] : [];
        case 'strings/0': return typeof input === 'string' ? [input] : [];
        case 'numbers/0': return typeof input === 'number' ? [input] : [];
        case 'booleans/0': return typeof input === 'boolean' ? [input] : [];
        case 'nulls/0': return input === null ? [input] : [];
        case 'iterables/0': return input && typeof input === 'object' ? [input] : [];
        case 'scalars/0': return input === null || typeof input !== 'object' ? [input] : [];
        case 'IN/1': return [A(0).some((x) => jqEq(x, input))];
        case 'IN/2': { const src = A(0); const t = A(1); return [src.some((x) => t.some((y) => jqEq(x, y)))]; }
        case 'INDEX/2': { const o = {}; for (const x of A(0)) { const k = this.ev(a[1], x, sc)[0]; o[typeof k === 'string' ? k : JSON.stringify(k)] = x; } return [o]; }
        case 'INDEX/1': { const o = {}; for (const x of input) { const k = this.ev(a[0], x, sc)[0]; o[typeof k === 'string' ? k : JSON.stringify(k)] = x; } return [o]; }
        case 'todate/0': case 'todateiso8601/0': return [new Date(input * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z')];
        case 'fromdate/0': case 'fromdateiso8601/0': return [Math.floor(Date.parse(input) / 1000)];
        case 'significand/0': { if (input === 0) return [0]; const e = Math.floor(Math.log2(Math.abs(input))); return [input / Math.pow(2, e)]; }
        case 'getpath/2': return [null];
        case 'splits/3': return [];
        case 'ltrimstr/0': return [input];
        case 'have_literal_numbers/0': return [true];
        case 'min_by/0': return [null];
        case 'env/1': return [null];
        default: break;
      }
      if (nm.startsWith('@')) return [this.format(nm, input)];
      throw new JqCompile(`${key} is not defined`);
    }
    reFlags(f) {
      if (!f) return '';
      let out = '';
      for (const ch of String(f)) { if (ch === 'i') out += 'i'; if (ch === 'x') out += ''; if (ch === 's') out += 's'; if (ch === 'g') out += 'g'; }
      return [...new Set(out)].join('');
    }
    contains(a, b) {
      if (jqType(a) !== jqType(b)) throw new JqErr(`${jqDesc(a)} and ${jqDesc(b)} cannot have their containment checked`);
      if (typeof a === 'string') return a.includes(b);
      if (Array.isArray(a)) return b.every((y) => a.some((x) => { try { return this.contains(x, y); } catch (e) { return false; } }));
      if (a && typeof a === 'object') return Object.keys(b).every((k) => k in a && this.contains(a[k], b[k]));
      return jqEq(a, b);
    }
  }

  def('jq', async (c) => {
    const args = c.args;
    const o = { raw: false, compact: false, nullIn: false, slurp: false, exitStatus: false, sort: false, tab: false, indent: 2, join: false, ascii: false, color: null, rawIn: false, seq: false };
    const named = {};
    let filter = null;
    const files = [];
    for (let k = 0; k < args.length; k++) {
      const a = args[k];
      if (a === '--') { if (filter == null) filter = args[++k]; files.push(...args.slice(k + 1)); break; }
      if (a.startsWith('--')) {
        switch (a) {
          case '--raw-output': o.raw = true; break;
          case '--compact-output': o.compact = true; break;
          case '--null-input': o.nullIn = true; break;
          case '--slurp': o.slurp = true; break;
          case '--exit-status': o.exitStatus = true; break;
          case '--sort-keys': o.sort = true; break;
          case '--tab': o.tab = true; break;
          case '--join-output': o.raw = true; o.join = true; break;
          case '--ascii-output': o.ascii = true; break;
          case '--color-output': o.color = true; break;
          case '--monochrome-output': o.color = false; break;
          case '--raw-input': o.rawIn = true; break;
          case '--raw-output0': o.raw = true; o.nul = true; break;
          case '--indent': o.indent = +args[++k]; break;
          case '--arg': named[args[k + 1]] = args[k + 2]; k += 2; break;
          case '--argjson': {
            try { const jr = jsonStream(args[k + 2] || ''); if (jr.err || !jr.length) throw new Error('bad'); named[args[k + 1]] = jr[0].v; } catch (e) { c.err(`jq: Invalid JSON text passed to --argjson\nUse jq --help for help with command-line options,\nor see the jq manpage, or online docs  at https://jqlang.github.io/jq\n`); return 2; }
            k += 2;
            break;
          }
          case '--version': c.out('jq-1.7.1\n'); return 0;
          case '--help': c.out('Usage:\tjq [OPTIONS] FILTER [FILES...]\n\tjq [OPTIONS] --args FILTER [ARGUMENTS...]\n\tjq [OPTIONS] --jsonargs FILTER [JSON_VALUES...]\n\njq is a tool for processing JSON inputs, applying the given filter to\nits JSON text inputs and producing the filter\'s results as JSON on\nstandard output.\n'); return 0;
          default: c.err(`jq: Unknown option: ${a}\nUse jq --help for help with command-line options,\nor see the jq manpage, or online docs  at https://jqlang.github.io/jq\n`); return 2;
        }
        continue;
      }
      if (a.startsWith('-') && a.length > 1) {
        for (const ch of a.slice(1)) {
          switch (ch) {
            case 'r': o.raw = true; break;
            case 'c': o.compact = true; break;
            case 'n': o.nullIn = true; break;
            case 's': o.slurp = true; break;
            case 'e': o.exitStatus = true; break;
            case 'S': o.sort = true; break;
            case 'j': o.raw = true; o.join = true; break;
            case 'a': o.ascii = true; break;
            case 'C': o.color = true; break;
            case 'M': o.color = false; break;
            case 'R': o.rawIn = true; break;
            default: c.err(`jq: Unknown option: ${a}\nUse jq --help for help with command-line options,\nor see the jq manpage, or online docs  at https://jqlang.github.io/jq\n`); return 2;
          }
        }
        continue;
      }
      if (filter == null) filter = a; else files.push(a);
    }
    if (filter == null) {
      c.err('Usage:\tjq [OPTIONS] FILTER [FILES...]\n\tjq [OPTIONS] --args FILTER [ARGUMENTS...]\n\tjq [OPTIONS] --jsonargs FILTER [JSON_VALUES...]\n\njq is a tool for processing JSON inputs, applying the given filter to\nits JSON text inputs and producing the filter\'s results as JSON on\nstandard output.\n\nThe simplest filter is ., which copies jq\'s input to its output\nunmodified except for formatting. For more advanced filters see\nthe jq(1) manpage ("man jq") and/or https://jqlang.github.io/jq/.\n\nExample:\n\n\t$ echo \'{"foo": 0}\' | jq .\n\t{\n\t  "foo": 0\n\t}\n\nFor listing the command options, use jq --help.\n');
      return 2;
    }
    let ast;
    try { ast = new JqParser(jqLex(filter)).program(); } catch (e) {
      if (e instanceof JqCompile) { c.err(`jq: error: ${e.message} at <top-level>, line 1:\n${filter}\njq: 1 compile error\n`); return 3; }
      throw e;
    }
    // 입력 읽기
    let texts = [];
    for (const fl of files.length ? files : ['-']) {
      if (fl === '-' && o.nullIn && !files.length && !/\binputs?\b/.test(filter)) { texts.push({ name: '<stdin>', text: '' }); continue; }
      const rd = await readOne(c, fl);
      if (rd.err) { c.err(`jq: error: Could not open ${fl}: ${rd.err}\n`); return 2; }
      texts.push({ name: fl === '-' ? '<stdin>' : fl, text: rd.text });
    }
    let inputs = [];
    let parseErr = null;
    for (const t of texts) {
      if (o.rawIn) {
        if (o.slurp) inputs.push({ v: t.text, line: 1 });
        else splitLines(t.text).forEach((l, i) => inputs.push({ v: l, line: i + 1 }));
        continue;
      }
      const jr = jsonStream(t.text);
      inputs.push(...jr);
      if (jr.err) { parseErr = jr.err; break; }
    }
    if (o.slurp && !o.rawIn) inputs = [{ v: inputs.map((x) => x.v), line: 1 }];
    const env = { environ: c.sh.exportedEnv ? c.sh.exportedEnv() : {}, now: c.m.now(), err: (s) => c.err(s), filename: files[0] || null, nextInput: null };
    const rt = new JqRT(env);
    const vars = { $__prog_args: [], $ENV: env.environ, $__loc__: null };
    for (const k of Object.keys(named)) vars['$' + k] = named[k];
    vars.$named = undefined;
    const scope = { parent: null, vars: Object.assign(vars, { $named: undefined }), funcs: {} };
    scope.vars.$ARGS = { positional: [], named };
    const useColor = o.color != null ? o.color : c.tty && !c.env('NO_COLOR');
    const dumpOpt = { indent: o.compact ? 0 : o.tab ? 1 : o.indent, tab: o.tab, color: useColor, sort: o.sort, ascii: o.ascii };
    let queue = o.nullIn ? [{ v: null, line: 0 }] : inputs.slice();
    let pending = o.nullIn ? inputs.slice() : [];
    env.nextInput = () => { const x = (o.nullIn ? pending : queue).shift(); return x ? x.v : undefined; };
    let last;
    let any = false;
    let st = 0;
    let out = '';
    while (queue.length) {
      const item = queue.shift();
      let res;
      try { res = rt.ev(ast, item.v, scope); } catch (e) {
        if (e instanceof JqCompile) { c.out(out); c.err(`jq: error: ${e.message} at <top-level>, line 1:\n${filter}\njq: 1 compile error\n`); return 3; }
        if (e instanceof JqErr) {
          if (e.halt != null) { c.out(out); if (e.haltMsg) c.err(e.message); return e.halt; }
          c.out(out);
          out = '';
          const msg = e.v !== undefined && typeof e.v !== 'string' ? `${JSON.stringify(e.v)} (not a string)` : e.message;
          c.err(`jq: error (at ${texts[0] ? texts[0].name : '<stdin>'}:${item.line}): ${msg}\n`);
          st = 5;
          continue;
        }
        if (e instanceof RangeError) { c.out(out); c.err('jq: error: 재귀가 너무 깊습니다\n'); return 5; }
        throw e;
      }
      for (const v of res) {
        any = true;
        last = v;
        if (o.raw && typeof v === 'string') out += v + (o.join ? '' : o.nul ? '\0' : '\n');
        else out += jqDump(v, dumpOpt) + (o.join ? '' : '\n');
        if (out.length > 1 << 20) { c.out(out); out = ''; }
      }
      if (o.nullIn) queue = [];
    }
    c.out(out);
    if (parseErr) { c.err(`jq: parse error: ${parseErr}\n`); return 2; }
    if (st) return st;
    if (o.exitStatus) return !any ? 4 : last === null || last === false ? 1 : 0;
    return 0;
  });

  // ======================================================================= dos2unix · unix2dos
  function lineConv(toDos) {
    return async (c) => {
      const name = c.name;
      const r = opts(c.args, 'qnokVhf', { quiet: 'q', newfile: 'n', oldfile: 'o', 'keepdate': 'k', version: 'V', help: 'h', force: 'f' });
      if (r.bad) { c.err(`${name}: ${r.bad}\n`); return 2; }
      const f = r.f;
      if (f.V) { c.out(`${name} 7.5.1 (2023-08-29)\n`); return 0; }
      const conv = (t) => (toDos ? t.replace(/\r?\n/g, '\r\n') : t.replace(/\r\n/g, '\n'));
      if (!r.ops.length) { c.out(conv(await c.readStdin())); return 0; }
      const pairs = [];
      if (f.n) { for (let i = 0; i + 1 < r.ops.length; i += 2) pairs.push([r.ops[i], r.ops[i + 1]]); } else r.ops.forEach((x) => pairs.push([x, x]));
      let st = 0;
      for (const [src, dst] of pairs) {
        const rd = await readOne(c, src);
        if (rd.err) {
          if (rd.dir) { if (!f.q) c.err(`${name}: Skipping ${src}, not a regular file.\n`); continue; }
          c.err(`${name}: ${src}: ${rd.err}\n`);
          st = 2;
          continue;
        }
        if (rd.text.includes('\0') && !f.f) { if (!f.q) c.err(`${name}: Binary symbol 0x00 found at line 1\n${name}: Skipping binary file ${src}\n`); continue; }
        if (!f.q) c.err(f.n ? `${name}: converting file ${src} to file ${dst} in ${toDos ? 'DOS' : 'Unix'} format...\n` : `${name}: converting file ${src} to ${toDos ? 'DOS' : 'Unix'} format...\n`);
        const er = writeOut(c, dst, conv(rd.text), false);
        if (er) { c.err(`${name}: Failed to write to temporary output file ${dst}: ${er}\n`); st = 2; }
      }
      return st;
    };
  }
  def('dos2unix', lineConv(false));
  def('unix2dos', lineConv(true));

  // ======================================================================= iconv
  def('iconv', async (c) => {
    const r = opts(c.args, 'f:t:o:lcs', { 'from-code': 'f:', 'to-code': 't:', output: 'o:', list: 'l', silent: 's' });
    if (r.bad) return badOpt(c, 'iconv', r.bad);
    const f = r.f;
    if (f.l) { c.out('The following list contains all the coded character sets known.\n\n  ASCII, CP949, EUC-KR, ISO-8859-1, LATIN1, UCS-2, UTF-16, UTF-16BE, UTF-16LE, UTF-32, UTF-8, UTF8, WINDOWS-1252\n'); return 0; }
    const known = /^(UTF-?8|UTF-?16(LE|BE)?|UTF-?32|ASCII|US-ASCII|EUC-?KR|CP949|UHC|ISO-?8859-?1|LATIN1|WINDOWS-1252|CP1252|UCS-2)(\/\/(TRANSLIT|IGNORE))*$/i;
    for (const k of ['f', 't']) {
      if (f[k] && !known.test(f[k])) {
        c.err(k === 'f' ? `iconv: conversion from \`${f[k]}' is not supported\n` : `iconv: conversion to \`${f[k]}' is not supported\n`);
        c.err("Try 'iconv --help' or 'iconv --usage' for more information.\n");
        return 1;
      }
    }
    let text = '';
    const st = await LX.readInputs(c, r.ops, 'iconv', (t) => { text += t; });
    if (f.t && /^(US-)?ASCII(\/\/|$)/i.test(f.t) && /[^\x00-\x7f]/.test(text)) {
      const idx = text.search(/[^\x00-\x7f]/);
      if (/TRANSLIT/i.test(f.t)) {
        text = text.replace(/[^\x00-\x7f]/g, (ch) => { const d = ch.normalize('NFD').replace(/[̀-ͯ]/g, ''); return /^[\x00-\x7f]+$/.test(d) ? d : '?'; });
      } else if (/IGNORE/i.test(f.t) || f.c) text = text.replace(/[^\x00-\x7f]/g, '');
      else {
        c.out(text.slice(0, idx));
        c.err(`iconv: cannot convert\niconv: illegal input sequence at position ${utf8(text.slice(0, idx)).length}\n`);
        return 1;
      }
    }
    if (f.o) { const er = writeOut(c, f.o, text, false); if (er) { c.err(`iconv: cannot open output file: ${er}\n`); return 1; } return st; }
    c.out(text);
    return st;
  });

  // ======================================================================= split
  def('split', async (c) => {
    const r = opts(c.args, 'l:b:n:da:xC:t:e', { lines: 'l:', bytes: 'b:', number: 'n:', 'numeric-suffixes': 'ns?', 'hex-suffixes': 'hs?', 'suffix-length': 'a:', 'additional-suffix': 'as:', verbose: 'verbose', 'line-bytes': 'C:', separator: 't:', 'elide-empty-files': 'e' }, { digits: true });
    if (r.bad) return badOpt(c, 'split', r.bad);
    const f = r.f;
    if (r.ops.length > 2) return badOpt(c, 'split', `extra operand '${r.ops[2]}'`);
    const inName = r.ops[0] || '-';
    const prefix = r.ops[1] || 'x';
    const rd = await readOne(c, inName);
    if (rd.err) { c.err(`split: cannot open '${inName}' for reading: ${rd.err}\n`); return 1; }
    const text = rd.text;
    const numeric = f.d || f.ns;
    const hex = f.x || f.hs;
    let slen = f.a != null ? +f.a : 2;
    const fixedLen = f.a != null;
    const start = typeof f.ns === 'string' ? +f.ns : 0;
    const suffix = (i) => {
      i += start;
      if (numeric || hex) {
        const s = i.toString(hex ? 16 : 10);
        if (s.length > slen) throw new Error('output file suffixes exhausted');
        return s.padStart(slen, '0');
      }
      const max = Math.pow(26, slen);
      if (i >= max) throw new Error('output file suffixes exhausted');
      let s = '';
      let x = i;
      for (let k = 0; k < slen; k++) { s = String.fromCharCode(97 + (x % 26)) + s; x = Math.floor(x / 26); }
      return s;
    };
    void fixedLen;
    const parseSz = (s) => {
      const m = /^(\d+)([KMGTPE]?)(i?B?)$/i.exec(s || '');
      if (!m) return null;
      const base = /B$/.test(m[3]) && !/iB$/i.test(m[3]) ? 1000 : 1024;
      return +m[1] * Math.pow(base, ' KMGTPE'.indexOf(m[2].toUpperCase() || ' '));
    };
    const chunks = [];
    if (f.b != null) {
      const sz = parseSz(f.b);
      if (!sz) { c.err(`split: invalid number of bytes: '${f.b}'\n`); return 1; }
      const bytes = utf8(text);
      for (let i = 0; i < bytes.length; i += sz) chunks.push(fromUtf8(bytes.slice(i, i + sz)));
    } else if (f.n != null) {
      const n = +String(f.n).replace(/^[lr]\//, '');
      if (!(n > 0)) { c.err(`split: invalid number of chunks: '${f.n}'\n`); return 1; }
      if (/^l\//.test(f.n)) {
        const lines = text.match(/[^\n]*\n|[^\n]+$/g) || [];
        const per = Math.ceil(lines.length / n);
        for (let i = 0; i < n; i++) chunks.push(lines.slice(i * per, (i + 1) * per).join(''));
      } else {
        const bytes = utf8(text);
        const per = Math.floor(bytes.length / n);
        for (let i = 0; i < n; i++) chunks.push(fromUtf8(bytes.slice(i * per, i === n - 1 ? bytes.length : (i + 1) * per)));
      }
      if (f.e) for (let i = chunks.length - 1; i >= 0; i--) if (!chunks[i]) chunks.splice(i, 1);
    } else {
      const n = +(f.l || f['#'] || 1000);
      if (!(n > 0)) { c.err(`split: invalid number of lines: '${f.l}'\n`); return 1; }
      const lines = text.match(/[^\n]*\n|[^\n]+$/g) || [];
      for (let i = 0; i < lines.length; i += n) chunks.push(lines.slice(i, i + n).join(''));
    }
    for (let i = 0; i < chunks.length; i++) {
      let name;
      try { name = prefix + suffix(i) + (f.as || ''); } catch (e) { c.err(`split: ${e.message}\n`); return 1; }
      if (f.verbose) c.out(`creating file '${name}'\n`);
      const er = writeOut(c, name, chunks[i], false);
      if (er) { c.err(`split: ${name}: ${er}\n`); return 1; }
    }
    return 0;
  });
})(typeof window !== 'undefined' ? window : globalThis);

