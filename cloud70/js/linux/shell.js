
/* 가상 리눅스 — bash 셸 (어휘 분석 · 구문 분석 · 실행)
 * 지원: 파이프, 리다이렉션(> >> < 2> 2>&1 &> << <<<), && || ; &, 변수 · 배열 · 매개변수 확장,
 *       $( ) ` ` $(( )), 중괄호 · 틸드 · 글로브 확장, if/for/while/until/case, 함수, [[ ]], (( )), 별칭, 히스토리
 */
(function (G) {
  const LX = G.LX = G.LX || {};
  const P = () => LX.path;

  // ======================================================================= 신호(예외)
  class Incomplete extends Error { constructor(what) { super('incomplete'); this.what = what; } }
  class SyntaxErr extends Error {}
  class ExitSig { constructor(code) { this.code = code; } }
  class ReturnSig { constructor(code) { this.code = code; } }
  class BreakSig { constructor(n) { this.n = n; } }
  class ContinueSig { constructor(n) { this.n = n; } }
  class AbortSig { constructor() { this.code = 130; } }
  LX.sig = { Incomplete, SyntaxErr, ExitSig, ReturnSig, BreakSig, ContinueSig, AbortSig };

  // ======================================================================= 입력 스트림
  class InStream {
    constructor(text) { this.buf = String(text || ''); this.pos = 0; }
    readLine() {
      if (this.pos >= this.buf.length) return null;
      const j = this.buf.indexOf('\n', this.pos);
      let line;
      if (j < 0) { line = this.buf.slice(this.pos); this.pos = this.buf.length; }
      else { line = this.buf.slice(this.pos, j); this.pos = j + 1; }
      return line;
    }
    readAll() { const s = this.buf.slice(this.pos); this.pos = this.buf.length; return s; }
    get eof() { return this.pos >= this.buf.length; }
  }
  LX.InStream = InStream;

  // ======================================================================= 어휘 분석
  const META = ' \t\n;&|<>()';

  function lex(src) {
    const toks = [];
    const n = src.length;
    let i = 0;
    const pending = [];

    function scanQuote(k) {   // src[k] === "'" → 닫는 ' 위치
      const j = src.indexOf("'", k + 1);
      if (j < 0) throw new Incomplete("'");
      return j;
    }
    function scanDouble(k) {  // src[k] === '"'
      let j = k + 1;
      while (j < n) {
        const c = src[j];
        if (c === '\\') { j += 2; continue; }
        if (c === '"') return j;
        if (c === '$' && src[j + 1] === '(') { j = scanParen(j + 1) + 1; continue; }
        if (c === '$' && src[j + 1] === '{') { j = scanBrace(j + 1) + 1; continue; }
        if (c === '`') { j = scanBack(j) + 1; continue; }
        j++;
      }
      throw new Incomplete('"');
    }
    function scanBack(k) {
      let j = k + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '`') return j;
        j++;
      }
      throw new Incomplete('`');
    }
    function scanParen(k) {   // src[k] === '(' → 짝 ')' 위치
      let depth = 0;
      let j = k;
      while (j < n) {
        const c = src[j];
        if (c === '\\') { j += 2; continue; }
        if (c === "'") { j = scanQuote(j) + 1; continue; }
        if (c === '"') { j = scanDouble(j) + 1; continue; }
        if (c === '`') { j = scanBack(j) + 1; continue; }
        if (c === '(') depth++;
        else if (c === ')') { depth--; if (depth === 0) return j; }
        j++;
      }
      throw new Incomplete('(');
    }
    function scanBrace(k) {   // src[k] === '{'
      let depth = 0;
      let j = k;
      while (j < n) {
        const c = src[j];
        if (c === '\\') { j += 2; continue; }
        if (c === "'" && depth > 0 && false) { j = scanQuote(j) + 1; continue; }
        if (c === '"') { j = scanDouble(j) + 1; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) return j; }
        j++;
      }
      throw new Incomplete('{');
    }

    function readWord() {
      let s = '';
      while (i < n) {
        const c = src[i];
        if (META.includes(c)) {
          if (c === '(' && /^[A-Za-z_][A-Za-z0-9_]*(\[[^\]]*\])?\+?=$/.test(s)) {
            const j = scanParen(i);
            s += src.slice(i, j + 1);
            i = j + 1;
            continue;
          }
          break;
        }
        if (c === '\\') {
          if (src[i + 1] === '\n') { i += 2; continue; }
          if (i + 1 >= n) throw new Incomplete('\\');
          s += c +(i + 1 < n ? src[i + 1] : '');
          i += 2;
          continue;
        }
        if (c === "'") { const j = scanQuote(i); s += src.slice(i, j + 1); i = j + 1; continue; }
        if (c === '"') { const j = scanDouble(i); s += src.slice(i, j + 1); i = j + 1; continue; }
        if (c === '`') { const j = scanBack(i); s += src.slice(i, j + 1); i = j + 1; continue; }
        if (c === '$' && src[i + 1] === '(') { const j = scanParen(i + 1); s += src.slice(i, j + 1); i = j + 1; continue; }
        if (c === '$' && src[i + 1] === '{') { const j = scanBrace(i + 1); s += src.slice(i, j + 1); i = j + 1; continue; }
        s += c;
        i++;
      }
      return s;
    }

    function readHeredocs() {
      while (pending.length) {
        const h = pending.shift();
        const lines = [];
        for (;;) {
          if (i >= n) throw new Incomplete('heredoc');
          let j = src.indexOf('\n', i);
          if (j < 0) {
            // 마지막 줄이 구분자면 끝
            const last = src.slice(i);
            const cmp = h.strip ? last.replace(/^\t+/, '') : last;
            if (cmp === h.delim) { i = n; break; }
            throw new Incomplete('heredoc');
          }
          let line = src.slice(i, j);
          i = j + 1;
          if (h.strip) line = line.replace(/^\t+/, '');
          if (line === h.delim) break;
          lines.push(line);
        }
        h.tok.body = lines.length ? lines.join('\n') + '\n' : '';
      }
    }

    while (i < n) {
      const c = src[i];
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '\\' && src[i + 1] === '\n') { i += 2; continue; }
      if (c === '\\' && i + 1 >= n) throw new Incomplete('\\');
      if (c === '\n') {
        toks.push({ t: 'nl' });
        i++;
        if (pending.length) readHeredocs();
        continue;
      }
      if (c === '#') { while (i < n && src[i] !== '\n') i++; continue; }
      const two = src.substr(i, 2);
      const three = src.substr(i, 3);
      // 파일 기술자 번호가 붙은 리다이렉션: 2> 2>> 2>&1 0<
      const fdm = /^(\d)(>>|>&|<&|>\||>|<)/.exec(src.slice(i, i + 4));
      if (fdm && (i === 0 || META.includes(src[i - 1]) || src[i - 1] === ' ')) {
        i += fdm[0].length;
        toks.push({ t: 'redir', op: fdm[2] === '>|' ? '>' : fdm[2], fd: +fdm[1], force: fdm[2] === '>|' });
        continue;
      }
      if (three === '<<<') { toks.push({ t: 'redir', op: '<<<', fd: 0 }); i += 3; continue; }
      if (two === '<<') {
        const strip = src[i + 2] === '-';
        i += strip ? 3 : 2;
        while (src[i] === ' ' || src[i] === '\t') i++;
        const raw = readWord();
        if (!raw) throw new SyntaxErr("syntax error near unexpected token `newline'");
        const quoted = /['"\\]/.test(raw);
        const delim = raw.replace(/['"\\]/g, '');
        const tok = { t: 'redir', op: '<<', fd: 0, quoted, body: null };
        toks.push(tok);
        pending.push({ tok, delim, strip });
        continue;
      }
      if (three === '&>>') { toks.push({ t: 'redir', op: '&>>', fd: null }); i += 3; continue; }
      if (two === '&>') { toks.push({ t: 'redir', op: '&>', fd: null }); i += 2; continue; }
      if (two === '>>') { toks.push({ t: 'redir', op: '>>', fd: 1 }); i += 2; continue; }
      if (two === '>&') { toks.push({ t: 'redir', op: '>&', fd: 1 }); i += 2; continue; }
      if (two === '<&') { toks.push({ t: 'redir', op: '<&', fd: 0 }); i += 2; continue; }
      if (two === '>|') { toks.push({ t: 'redir', op: '>', fd: 1, force: true }); i += 2; continue; }
      if (two === '<(' || two === '>(') {
        // 프로세스 치환 <(명령)
        const j = scanParen(i + 1);
        toks.push({ t: 'word', v: src.slice(i, j + 1) });
        i = j + 1;
        continue;
      }
      if (two === '((' ) {
        // 산술 명령 (( ... ))
        let depth = 0, j = i;
        for (; j < n; j++) {
          if (src[j] === '(') depth++;
          else if (src[j] === ')') { depth--; if (depth === 0) break; }
        }
        if (j >= n) throw new Incomplete('((');
        const inner = src.slice(i + 2, j - 1);
        if (src[j - 1] !== ')') throw new SyntaxErr('syntax error: `((` 짝이 맞지 않습니다');
        toks.push({ t: 'arith', v: inner });
        i = j + 1;
        continue;
      }
      if (two === '&&' || two === '||' || two === ';;' || two === '|&') { toks.push({ t: 'op', v: two }); i += 2; continue; }
      if ('|&;()'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
      if (c === '>') { toks.push({ t: 'redir', op: '>', fd: 1 }); i++; continue; }
      if (c === '<') { toks.push({ t: 'redir', op: '<', fd: 0 }); i++; continue; }
      const w = readWord();
      toks.push({ t: 'word', v: w });
    }
    if (pending.length) throw new Incomplete('heredoc');
    return toks;
  }

  // ======================================================================= 구문 분석
  const RESERVED_STOP = new Set(['then', 'else', 'elif', 'fi', 'do', 'done', 'esac', '}']);

  class Parser {
    constructor(toks) { this.toks = toks; this.i = 0; }
    peek(k = 0) { return this.toks[this.i + k]; }
    next() { return this.toks[this.i++]; }
    eof() { return this.i >= this.toks.length; }
    isWord(v, k = 0) { const t = this.peek(k); return t && t.t === 'word' && t.v === v; }
    isOp(v, k = 0) { const t = this.peek(k); return t && t.t === 'op' && t.v === v; }
    skipNl() { while (this.peek() && this.peek().t === 'nl') this.i++; }
    need(v) {
      if (this.eof()) throw new Incomplete(v);
      if (!this.isWord(v)) throw new SyntaxErr(`syntax error near unexpected token \`${tokText(this.peek())}'`);
      this.i++;
    }
    atStop(stops) {
      const t = this.peek();
      if (!t) return true;
      if (t.t === 'op' && (t.v === ')' || t.v === ';;')) return true;
      if (t.t === 'word' && stops.includes(t.v)) return true;
      return false;
    }

    program() {
      const l = this.list([]);
      if (!this.eof()) throw new SyntaxErr(`syntax error near unexpected token \`${tokText(this.peek())}'`);
      return l;
    }

    list(stops, nested) {
      const items = [];
      this.skipNl();
      while (!this.eof() && !this.atStop(stops)) {
        const node = this.andOr();
        let bg = false;
        const t = this.peek();
        if (t && t.t === 'op' && (t.v === ';' || t.v === '&')) { this.next(); bg = t.v === '&'; }
        else if (t && t.t === 'nl') { /* 줄바꿈 */ }
        else if (t && !this.atStop(stops)) throw new SyntaxErr(`syntax error near unexpected token \`${tokText(t)}'`);
        items.push({ node, bg });
        this.skipNl();
      }
      if (this.eof() && nested) throw new Incomplete(stops[0] || ')');
      return { type: 'list', items };
    }

    andOr() {
      const first = this.pipeline();
      const rest = [];
      while (this.isOp('&&') || this.isOp('||')) {
        const op = this.next().v;
        this.skipNl();
        if (this.eof()) throw new Incomplete(op);
        rest.push({ op, node: this.pipeline() });
      }
      return rest.length ? { type: 'andor', first, rest } : first;
    }

    pipeline() {
      let neg = false;
      if (this.isWord('!')) { this.next(); neg = true; }
      const cmds = [this.command()];
      while (this.isOp('|') || this.isOp('|&')) {
        const op = this.next().v;
        this.skipNl();
        if (this.eof()) throw new Incomplete('|');
        const c = this.command();
        if (op === '|&') cmds[cmds.length - 1].errToPipe = true;
        cmds.push(c);
      }
      if (cmds.length === 1 && !neg) return cmds[0];
      return { type: 'pipe', cmds, neg };
    }

    command() {
      const t = this.peek();
      if (!t) throw new Incomplete('command');
      let node;
      if (t.t === 'word') {
        switch (t.v) {
          case 'if': node = this.ifCmd(); break;
          case 'for': node = this.forCmd(); break;
          case 'while': case 'until': node = this.whileCmd(); break;
          case 'case': node = this.caseCmd(); break;
          case '{': {
            this.next();
            const body = this.list(['}'], true);
            this.need('}');
            node = { type: 'group', body };
            break;
          }
          case 'function': {
            this.next();
            const name = this.next();
            if (!name) throw new Incomplete('function');
            if (this.isOp('(') && this.isOp(')', 1)) { this.i += 2; }
            this.skipNl();
            node = { type: 'func', name: name.v, body: this.command() };
            return node;
          }
          case '[[': node = this.dblBracket(); break;
          default:
            if (RESERVED_STOP.has(t.v)) throw new SyntaxErr(`syntax error near unexpected token \`${t.v}'`);
            if (this.isOp('(', 1) && this.isOp(')', 2) && /^[A-Za-z_][\w.:-]*$/.test(t.v)) {
              this.i += 3;
              this.skipNl();
              if (this.eof()) throw new Incomplete('function');
              return { type: 'func', name: t.v, body: this.command() };
            }
            return this.simple();
        }
      } else if (t.t === 'op' && t.v === '(') {
        this.next();
        const body = this.list([], true);
        if (this.eof()) throw new Incomplete(')');
        if (!this.isOp(')')) throw new SyntaxErr(`syntax error near unexpected token \`${tokText(this.peek())}'`);
        this.next();
        node = { type: 'sub', body };
      } else if (t.t === 'arith') {
        this.next();
        node = { type: 'arith', expr: t.v };
      } else if (t.t === 'redir') {
        return this.simple();
      } else {
        throw new SyntaxErr(`syntax error near unexpected token \`${tokText(t)}'`);
      }
      node.redirs = this.redirs();
      return node;
    }

    redirs() {
      const out = [];
      while (this.peek() && this.peek().t === 'redir') out.push(this.redir());
      return out;
    }

    redir() {
      const t = this.next();
      const r = { op: t.op, fd: t.fd };
      if (t.force) r.force = true;
      if (t.op === '<<') { r.body = t.body; r.quoted = t.quoted; return r; }
      const w = this.peek();
      if (!w) throw new SyntaxErr("syntax error near unexpected token `newline'");
      if (w.t !== 'word') throw new SyntaxErr(`syntax error near unexpected token \`${tokText(w)}'`);
      this.next();
      r.target = w.v;
      return r;
    }

    simple() {
      const assigns = [], words = [], redirs = [];
      for (;;) {
        const t = this.peek();
        if (!t) break;
        if (t.t === 'redir') { redirs.push(this.redir()); continue; }
        if (t.t !== 'word') break;
        if (!words.length && /^[A-Za-z_][A-Za-z0-9_]*(\[[^\]]*\])?\+?=/.test(t.v)) { assigns.push(t.v); this.next(); continue; }
        words.push(t.v);
        this.next();
      }
      if (!assigns.length && !words.length && !redirs.length) {
        const t = this.peek();
        if (!t) throw new Incomplete('command');
        throw new SyntaxErr(`syntax error near unexpected token \`${tokText(t)}'`);
      }
      return { type: 'simple', assigns, words, redirs };
    }

    ifCmd() {
      this.next();
      const clauses = [];
      const cond = this.list(['then'], true);
      this.need('then');
      const body = this.list(['elif', 'else', 'fi'], true);
      clauses.push({ cond, body });
      let other = null;
      for (;;) {
        if (this.eof()) throw new Incomplete('fi');
        if (this.isWord('elif')) {
          this.next();
          const c = this.list(['then'], true);
          this.need('then');
          const b = this.list(['elif', 'else', 'fi'], true);
          clauses.push({ cond: c, body: b });
        } else if (this.isWord('else')) {
          this.next();
          other = this.list(['fi'], true);
        } else break;
      }
      this.need('fi');
      return { type: 'if', clauses, other };
    }

    forCmd() {
      this.next();
      if (this.peek() && this.peek().t === 'arith') {
        const expr = this.next().v;
        const parts = expr.split(';');
        if (this.isOp(';')) this.next();
        this.skipNl();
        this.need('do');
        const body = this.list(['done'], true);
        this.need('done');
        return { type: 'cfor', init: parts[0] || '', cond: parts[1] || '', step: parts[2] || '', body };
      }
      const name = this.next();
      if (!name) throw new Incomplete('for');
      let words = null;
      this.skipNl();
      if (this.isWord('in')) {
        this.next();
        words = [];
        while (this.peek() && this.peek().t === 'word') words.push(this.next().v);
      }
      if (this.isOp(';')) this.next();
      this.skipNl();
      this.need('do');
      const body = this.list(['done'], true);
      this.need('done');
      return { type: 'for', name: name.v, words, body };
    }

    whileCmd() {
      const until = this.next().v === 'until';
      const cond = this.list(['do'], true);
      this.need('do');
      const body = this.list(['done'], true);
      this.need('done');
      return { type: 'while', until, cond, body };
    }

    caseCmd() {
      this.next();
      const w = this.next();
      if (!w) throw new Incomplete('case');
      this.skipNl();
      this.need('in');
      this.skipNl();
      const items = [];
      while (!this.isWord('esac')) {
        if (this.eof()) throw new Incomplete('esac');
        if (this.isOp('(')) this.next();
        const pats = [];
        for (;;) {
          const p = this.next();
          if (!p) throw new Incomplete('esac');
          if (p.t !== 'word') throw new SyntaxErr(`syntax error near unexpected token \`${tokText(p)}'`);
          pats.push(p.v);
          if (this.isOp('|')) { this.next(); continue; }
          break;
        }
        if (this.eof()) throw new Incomplete('esac');
        if (!this.isOp(')')) throw new SyntaxErr(`syntax error near unexpected token \`${tokText(this.peek())}'`);
        this.next();
        const body = this.list(['esac'], true);
        items.push({ pats, body });
        if (this.isOp(';;')) this.next();
        this.skipNl();
      }
      this.need('esac');
      return { type: 'case', word: w.v, items };
    }

    dblBracket() {
      this.next();
      const parts = [];
      for (;;) {
        const t = this.next();
        if (!t) throw new Incomplete(']]');
        if (t.t === 'word' && t.v === ']]') break;
        if (t.t === 'nl') continue;
        if (t.t === 'word') parts.push({ v: t.v });
        else if (t.t === 'op') parts.push({ v: t.v, op: true });
        else if (t.t === 'redir') {
          parts.push({ v: t.op === '<' || t.op === '>' ? t.op : t.op, op: true });
        }
      }
      return { type: 'dbl', parts };
    }
  }

  function tokText(t) {
    if (!t) return 'newline';
    if (t.t === 'nl') return 'newline';
    if (t.t === 'redir') return t.op;
    return t.v;
  }

  function parse(src) {
    return new Parser(lex(src)).program();
  }

  // ======================================================================= 글로브 · 패턴
  function globToRe(p, pathMode) {
    let re = '';
    for (let i = 0; i < p.length; i++) {
      const c = p[i];
      if (c === '\\') { i++; re += (p[i] || '\\').replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'); continue; }
      if (c === '*') { re += pathMode ? '[^/]*' : '[\\s\\S]*'; continue; }
      if (c === '?') { re += pathMode ? '[^/]' : '[\\s\\S]'; continue; }
      if (c === '[') {
        const j = p.indexOf(']', i + 2);
        if (j > 0) {
          let cls = p.slice(i + 1, j);
          if (cls[0] === '!' || cls[0] === '^') cls = '^' + cls.slice(1);
          cls = cls.replace(/\[:(\w+):\]/g, (m, k) => ({ alpha: 'a-zA-Z', digit: '0-9', alnum: 'a-zA-Z0-9', upper: 'A-Z', lower: 'a-z', space: '\\s', punct: '!-/:-@[-`{-~' }[k] || ''));
          re += '[' + cls.replace(/\\/g, '\\\\') + ']';
          i = j;
          continue;
        }
        re += '\\[';
        continue;
      }
      re += c.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    }
    return new RegExp('^' + re + '$');
  }
  const hasGlob = (s) => /(^|[^\\])[*?[]/.test(s);
  function matchPattern(str, pat) {
    try { return globToRe(pat, false).test(str); } catch (e) { return str === pat; }
  }
  const escGlob = (s) => s.replace(/[*?[\]\\]/g, '\\$&');
  LX.glob = { globToRe, matchPattern, hasGlob, escGlob };

  // ---------------------------------------------------------------- 중괄호 확장
  function braceExpand(word) {
    // 따옴표 밖의 첫 번째 {...} 를 찾는다
    let depth = 0, start = -1, q = null;
    for (let i = 0; i < word.length; i++) {
      const c = word[i];
      if (q) { if (c === q) q = null; else if (c === '\\' && q === '"') i++; continue; }
      if (c === '\\') { i++; continue; }
      if (c === "'" || c === '"') { q = c; continue; }
      if (c === '$' && word[i + 1] === '{') { // ${...} 는 건너뜀
        let d = 0, j = i + 1;
        for (; j < word.length; j++) { if (word[j] === '{') d++; else if (word[j] === '}') { d--; if (!d) break; } }
        i = j;
        continue;
      }
      if (c === '{') { if (depth === 0) start = i; depth++; }
      else if (c === '}' && depth > 0) {
        depth--;
        if (depth === 0) {
          const inner = word.slice(start + 1, i);
          const pre = word.slice(0, start), post = word.slice(i + 1);
          // 콤마 분리 (중첩 고려)
          const alts = [];
          let d = 0, last = 0, qq = null;
          for (let j = 0; j < inner.length; j++) {
            const ch = inner[j];
            if (qq) { if (ch === qq) qq = null; continue; }
            if (ch === "'" || ch === '"') { qq = ch; continue; }
            if (ch === '{') d++;
            else if (ch === '}') d--;
            else if (ch === ',' && d === 0) { alts.push(inner.slice(last, j)); last = j + 1; }
          }
          if (alts.length) {
            alts.push(inner.slice(last));
            return alts.flatMap((a) => braceExpand(pre + a + post));
          }
          const rm = /^(-?\d+)\.\.(-?\d+)(?:\.\.(-?\d+))?$/.exec(inner) || /^([a-zA-Z])\.\.([a-zA-Z])$/.exec(inner);
          if (rm) {
            const out = [];
            if (/\d/.test(rm[1])) {
              const a = +rm[1], b = +rm[2];
              const step = Math.abs(+rm[3] || 1);
              const width = (/^-?0\d/.test(rm[1]) || /^-?0\d/.test(rm[2])) ? Math.max(rm[1].length, rm[2].length) : 0;
              for (let v = a; a <= b ? v <= b : v >= b; v += a <= b ? step : -step) {
                if (out.length > 10000) break;
                out.push(width ? String(Math.abs(v)).padStart(width, '0').replace(/^/, v < 0 ? '-' : '') : String(v));
              }
            } else {
              const a = rm[1].charCodeAt(0), b = rm[2].charCodeAt(0);
              for (let v = a; a <= b ? v <= b : v >= b; v += a <= b ? 1 : -1) out.push(String.fromCharCode(v));
            }
            return out.flatMap((a) => braceExpand(pre + a + post));
          }
          // 확장 대상 아님: 뒤쪽에서 다시 찾기
          const rest = braceExpand(post);
          return rest.map((r) => pre + '{' + inner + '}' + r);
        }
      }
    }
    return [word];
  }

  // ======================================================================= 산술
  function arith(expr, sh) {
    const src = String(expr);
    let i = 0;
    const toks = [];
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      let m;
      if ((m = /^(0[xX][0-9a-fA-F]+|\d+#[0-9a-zA-Z@_]+|\d+)/.exec(src.slice(i)))) {
        let v;
        const s = m[1];
        if (/^0[xX]/.test(s)) v = parseInt(s, 16);
        else if (s.includes('#')) { const [b, d] = s.split('#'); v = parseInt(d, +b); }
        else if (/^0\d/.test(s)) v = parseInt(s, 8);
        else v = parseInt(s, 10);
        toks.push({ t: 'n', v });
        i += s.length;
        continue;
      }
      if ((m = /^\$?([A-Za-z_][A-Za-z0-9_]*)(\[[^\]]*\])?/.exec(src.slice(i)))) {
        toks.push({ t: 'id', v: m[1], idx: m[2] ? m[2].slice(1, -1) : null });
        i += m[0].length;
        continue;
      }
      const ops = ['**=', '<<=', '>>=', '**', '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '+', '-', '*', '/', '%', '<', '>', '!', '~', '&', '|', '^', '?', ':', '=', '(', ')', ','];
      const op = ops.find((o) => src.startsWith(o, i));
      if (!op) throw new Error(`${src}: syntax error: invalid arithmetic operator (error token is "${src.slice(i)}")`);
      toks.push({ t: 'op', v: op });
      i += op.length;
    }
    let p = 0;
    const peek = () => toks[p];
    const isOp = (v) => toks[p] && toks[p].t === 'op' && toks[p].v === v;
    const getv = (t) => {
      const v = sh.getVar(t.idx != null ? `${t.v}[${sh.arithIndex(t.idx)}]` : t.v);
      if (v === '' || v == null) return 0;
      const n = Number(v);
      if (Number.isNaN(n)) { try { return arith(v, sh); } catch (e) { return 0; } }
      return Math.trunc(n);
    };
    const setv = (t, v) => { sh.setVar(t.idx != null ? `${t.v}[${sh.arithIndex(t.idx)}]` : t.v, String(v)); return v; };
    const BIN = [
      ['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '<=', '>', '>='], ['<<', '>>'], ['+', '-'], ['*', '/', '%']
    ];
    function comma() { let v = assign(); while (isOp(',')) { p++; v = assign(); } return v; }
    function assign() {
      const t = peek();
      if (t && t.t === 'id' && toks[p + 1] && toks[p + 1].t === 'op' && /^(=|\+=|-=|\*=|\/=|%=|<<=|>>=|&=|\|=|\^=|\*\*=)$/.test(toks[p + 1].v)) {
        p += 2;
        const op = toks[p - 1].v;
        const r = assign();
        const cur = getv(t);
        const v = op === '=' ? r : calc(op.slice(0, -1), cur, r);
        return setv(t, v);
      }
      return ternary();
    }
    function ternary() {
      const c = bin(0);
      if (isOp('?')) {
        p++;
        const a = assign();
        if (!isOp(':')) throw new Error('`:\' expected for conditional expression');
        p++;
        const b = assign();
        return c ? a : b;
      }
      return c;
    }
    function calc(op, a, b) {
      switch (op) {
        case '+': return a + b; case '-': return a - b; case '*': return a * b;
        case '/': if (b === 0) throw new Error('division by 0 (error token is "' + b + '")'); return Math.trunc(a / b);
        case '%': if (b === 0) throw new Error('division by 0 (error token is "' + b + '")'); return a % b;
        case '**': return a ** b;
        case '<<': return a << b; case '>>': return a >> b;
        case '<': return +(a < b); case '<=': return +(a <= b); case '>': return +(a > b); case '>=': return +(a >= b);
        case '==': return +(a === b); case '!=': return +(a !== b);
        case '&': return a & b; case '|': return a | b; case '^': return a ^ b;
        case '&&': return +(!!a && !!b); case '||': return +(!!a || !!b);
      }
      return 0;
    }
    function bin(level) {
      if (level >= BIN.length) return pow();
      let a = bin(level + 1);
      while (peek() && peek().t === 'op' && BIN[level].includes(peek().v)) {
        const op = toks[p++].v;
        const b = bin(level + 1);
        a = calc(op, a, b);
      }
      return a;
    }
    function pow() {
      const a = unary();
      if (isOp('**')) { p++; return a ** pow(); }
      return a;
    }
    function unary() {
      const t = peek();
      if (!t) throw new Error('syntax error: operand expected');
      if (t.t === 'op') {
        if (t.v === '-') { p++; return -unary(); }
        if (t.v === '+') { p++; return +unary(); }
        if (t.v === '!') { p++; return +!unary(); }
        if (t.v === '~') { p++; return ~unary(); }
        if (t.v === '++' || t.v === '--') {
          p++;
          const id = toks[p++];
          if (!id || id.t !== 'id') throw new Error('syntax error');
          return setv(id, getv(id) + (t.v === '++' ? 1 : -1));
        }
        if (t.v === '(') {
          p++;
          const v = comma();
          if (!isOp(')')) throw new Error('missing `)\'');
          p++;
          return v;
        }
        throw new Error(`syntax error: operand expected (error token is "${t.v}")`);
      }
      p++;
      if (t.t === 'n') return t.v;
      if (isOp('++') || isOp('--')) {
        const op = toks[p++].v;
        const old = getv(t);
        setv(t, old + (op === '++' ? 1 : -1));
        return old;
      }
      return getv(t);
    }
    if (!toks.length) return 0;
    const v = comma();
    if (p < toks.length) throw new Error(`syntax error in expression (error token is "${toks.slice(p).map((t) => t.v).join(' ')}")`);
    return v;
  }
  LX.arith = arith;

  // ======================================================================= 셸
  const BUILTINS = {};
  LX.BUILTINS = BUILTINS;

  class Shell {
    /**
     * @param {object} session  Session (터미널 · 입력 요청)
     * @param {object} o  { user, cwd, vars, login, parent, script }
     */
    constructor(session, o = {}) {
      this.session = session;
      this.m = o.machine || session.m;
      this.user = o.user || 'user';
      this.refreshCred();
      this.vars = o.vars || {};
      this.funcs = o.funcs || {};
      this.aliases = o.aliases || {};
      this.pos = o.pos || [];
      this.name0 = o.name0 || 'bash';
      this.cwd = o.cwd || this.cred.home;
      this.status = 0;
      this.opts = Object.assign({ e: false, x: false, u: false }, o.opts || {});
      this.noErr = 0;
      this.interactive = !!o.interactive;
      this.login = !!o.login;
      this.buffer = '';
      this.jobs = session.jobs;
      this.depth = o.depth || 0;
      this.loopDepth = 0;
      this.funcDepth = 0;
      this.lastBg = '';
      this.umask = o.umask != null ? o.umask : (this.cred.uid === 0 ? 0o022 : 0o002);
      if (!o.vars) this.initVars();
    }

    refreshCred() {
      this.cred = this.m.credFor(this.user) || this.m.credFor('root');
    }

    initVars() {
      const c = this.cred;
      const set = (k, v, x = true) => { this.vars[k] = { v, x }; };
      set('HOME', c.home);
      set('USER', c.name);
      set('LOGNAME', c.name);
      set('SHELL', c.shell || '/bin/bash');
      set('PATH', c.uid === 0 ? '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin' : '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin');
      set('PWD', this.cwd || c.home);
      set('LANG', 'en_US.UTF-8');
      set('TERM', 'xterm-256color');
      set('HOSTNAME', this.m.hostname(), false);
      set('PS1', c.uid === 0 ? '\\[\\e[01;31m\\]\\u@\\h\\[\\e[00m\\]:\\[\\e[01;34m\\]\\w\\[\\e[00m\\]\\$ ' : '\\[\\e[01;32m\\]\\u@\\h\\[\\e[00m\\]:\\[\\e[01;34m\\]\\w\\[\\e[00m\\]\\$ ', false);
      set('PS2', '> ', false);
      set('IFS', ' \t\n', false);
      set('HISTSIZE', '1000', false);
      set('XDG_SESSION_TYPE', 'tty');
      set('SHLVL', String(1 + (this.depth || 0)));
    }

    // ------------------------------------------------------------ 변수
    getVar(name) {
      let m = /^([A-Za-z_][A-Za-z0-9_]*)\[(.*)\]$/.exec(name);
      if (m) {
        const e = this.vars[m[1]];
        if (!e) return '';
        if (Array.isArray(e.v)) {
          if (m[2] === '@' || m[2] === '*') return e.v.filter((x) => x != null).join(' ');
          const idx = this.arithIndex(m[2]);
          return e.v[idx] == null ? '' : e.v[idx];
        }
        if (e.assoc) return e.assoc[m[2]] == null ? '' : e.assoc[m[2]];
        return m[2] === '0' || m[2] === '@' || m[2] === '*' ? e.v : '';
      }
      switch (name) {
        case '?': return String(this.status);
        case '$': return String(this.pid || this.session.shellPid || 2345);
        case '#': return String(this.pos.length);
        case '0': return this.name0;
        case '@': case '*': return this.pos.join(' ');
        case '!': return String(this.lastBg || '');
        case '-': return 'himBHs';
        case 'RANDOM': return String(Math.floor(Math.random() * 32768));
        case 'SECONDS': return String(Math.floor((Date.now() - (this.session.started || Date.now())) / 1000));
        case 'PWD': return this.cwd;
        case 'UID': return String(this.cred.uid);
        case 'EUID': return String(this.cred.uid);
        case 'LINENO': return String(this.lineNo || 1);
        case 'BASH_VERSION': return '5.2.21(1)-release';
        case 'HOSTNAME': return this.m.hostname();
      }
      if (/^\d+$/.test(name)) return this.pos[+name - 1] == null ? '' : this.pos[+name - 1];
      const e = this.vars[name];
      if (!e) return '';
      if (Array.isArray(e.v)) return e.v[0] == null ? '' : e.v[0];
      if (e.assoc) return e.assoc['0'] || '';
      return e.v;
    }
    isSet(name) {
      if (/^\d+$/.test(name)) return +name <= this.pos.length;
      if ('?$#@*!-0'.includes(name) && name.length === 1) return true;
      if (['RANDOM', 'SECONDS', 'PWD', 'UID', 'EUID', 'HOSTNAME', 'BASH_VERSION', 'LINENO'].includes(name)) return true;
      const m = /^([A-Za-z_]\w*)\[(.*)\]$/.exec(name);
      if (m) { const e = this.vars[m[1]]; if (!e) return false; if (Array.isArray(e.v)) return e.v[this.arithIndex(m[2])] != null; if (e.assoc) return e.assoc[m[2]] != null; return false; }
      return !!this.vars[name];
    }
    arithIndex(s) {
      if (/^-?\d+$/.test(s)) return +s;
      try { return arith(s, this); } catch (e) { return 0; }
    }
    setVar(name, value, opts = {}) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\[(.*)\]$/.exec(name);
      if (m) {
        let e = this.vars[m[1]];
        if (!e) e = this.vars[m[1]] = { v: [], x: false };
        if (e.assoc) { e.assoc[m[2]] = value; return; }
        if (!Array.isArray(e.v)) e.v = [e.v];
        e.v[this.arithIndex(m[2])] = value;
        return;
      }
      if (name === 'PWD') { this.cwd = value; }
      const e = this.vars[name];
      if (e && e.ro) throw new Error(`${name}: readonly variable`);
      if (e) e.v = value;
      else this.vars[name] = { v: value, x: !!opts.export };
      if (opts.export) this.vars[name].x = true;
    }
    exportedEnv() {
      const env = {};
      for (const k of Object.keys(this.vars)) if (this.vars[k].x) env[k] = Array.isArray(this.vars[k].v) ? this.vars[k].v[0] : this.vars[k].v;
      return env;
    }

    /** 자식 셸 (서브셸 · 명령 치환 · 스크립트) */
    child(kind) {
      const cloneVars = {};
      for (const k of Object.keys(this.vars)) {
        const e = this.vars[k];
        if (kind === 'script' && !e.x) continue;
        cloneVars[k] = { v: Array.isArray(e.v) ? e.v.slice() : e.v, x: e.x, ro: e.ro, assoc: e.assoc ? Object.assign({}, e.assoc) : undefined };
        if (!cloneVars[k].assoc) delete cloneVars[k].assoc;
      }
      const sh = new Shell(this.session, {
        machine: this.m, user: this.user, cwd: this.cwd, vars: cloneVars,
        funcs: kind === 'script' ? {} : Object.assign({}, this.funcs),
        aliases: kind === 'script' ? {} : Object.assign({}, this.aliases),
        pos: this.pos.slice(), name0: this.name0, opts: Object.assign({}, this.opts), depth: this.depth + 1, umask: this.umask
      });
      sh.cred = this.cred;
      sh.status = this.status;
      sh.pid = this.pid;   // 서브셸의 PID 표시($$)는 부모 셸과 같다 (스크립트는 runScript 가 새 PID 로 바꾼다)
      return sh;
    }

    // ------------------------------------------------------------ 프롬프트
    prompt(which = 'PS1') {
      if (this.buffer && which === 'PS1') which = 'PS2';
      const ps = this.getVar(which);
      const home = this.getVar('HOME') || this.cred.home;
      const w = this.cwd === home ? '~' : (this.cwd.startsWith(home + '/') ? '~' + this.cwd.slice(home.length) : this.cwd);
      const now = new Date(this.m.now());
      return ps.replace(/\\(.)/g, (m, c) => {
        switch (c) {
          case 'u': return this.cred.name;
          case 'h': return this.m.hostname().split('.')[0];
          case 'H': return this.m.hostname();
          case 'w': return w;
          case 'W': return this.cwd === home ? '~' : (P().basename(this.cwd) || '/');
          case '$': return this.cred.uid === 0 ? '#' : '$';
          case 'e': return '\x1b';
          case 'n': return '\n';
          case 't': return now.toTimeString().slice(0, 8);
          case 'd': return now.toDateString().slice(0, 10);
          case '[': case ']': return '';
          case '\\': return '\\';
          case 's': return 'bash';
          case 'v': return '5.2';
          default: return m;
        }
      }).replace(/\\033/g, '\x1b');
    }

    // ------------------------------------------------------------ 대화형 입력
    /** 터미널 한 줄 입력. 문장이 끝나지 않았으면 'more' */
    async input(line, io) {
      let text = this.buffer ? this.buffer + '\n' + line : line;
      // 히스토리 확장 (!! !$ !n !문자열)
      if (!this.buffer && /!/.test(text)) {
        const h = this.session.history;
        let changed = false;
        let res = '';
        let q = null;
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (q === "'") { res += ch; if (ch === "'") q = null; continue; }
          if (ch === '\\') { res += ch + (text[i + 1] || ''); i++; continue; }
          if (ch === "'" && q !== '"') { q = "'"; res += ch; continue; }
          if (ch === '"') { q = q === '"' ? null : '"'; res += ch; continue; }
          // ${!name} (간접 참조) · [[ ! ]] · != 는 히스토리 확장이 아님
          const m = ch === '!' && !(text[i - 1] === '{' && text[i - 2] === '$') ? /^!(!|\$|-?\d+|[A-Za-z][\w-]*)/.exec(text.slice(i)) : null;
          if (!m) { res += ch; continue; }
          const k = m[1];
          let rep = null;
          if (k === '!') rep = h[h.length - 1];
          else if (k === '$') { const last = h[h.length - 1] || ''; const ws = last.trim().split(/\s+/); rep = ws[ws.length - 1]; }
          else if (/^-?\d+$/.test(k)) rep = +k < 0 ? h[h.length + (+k)] : h[+k - 1];
          else rep = [...h].reverse().find((c) => c.startsWith(k));
          if (rep == null) throw new Error(`!${k}: event not found`);
          res += rep;
          i += m[0].length - 1;
          changed = true;
        }
        text = res;
        if (changed) io.out(text + '\n');
      }
      let ast;
      try {
        ast = parse(text);
      } catch (e) {
        if (e instanceof Incomplete) { this.buffer = text; return 'more'; }
        this.buffer = '';
        this.session.addHistory(text);
        io.err(`bash: ${e.message}\n`);
        this.status = 2;
        return 'done';
      }
      this.buffer = '';
      if (text.trim()) this.session.addHistory(text);
      await this.execTop(ast, io);
      return 'done';
    }

    async execTop(ast, io) {
      try {
        this.status = await this.exec(ast, io);
      } catch (e) {
        if (e instanceof ExitSig) throw e;
        if (e instanceof ReturnSig) { this.status = e.code; return; }
        if (e instanceof BreakSig || e instanceof ContinueSig) return;
        if (e instanceof AbortSig) { this.status = 130; return; }
        io.err(`bash: 내부 오류: ${e && e.message}\n`);
        if (typeof console !== 'undefined' && this.session.debug) console.error(e);
        this.status = 1;
      }
    }

    /** 스크립트 · 문자열 실행 (source, bash -c, 스크립트 파일) */
    async runSource(src, io) {
      let ast;
      try {
        ast = parse(src);
      } catch (e) {
        const msg = e instanceof Incomplete ? `syntax error: unexpected end of file` : e.message;
        io.err(`${this.name0}: ${msg}\n`);
        return 2;
      }
      try {
        return await this.exec(ast, io);
      } catch (e) {
        if (e instanceof ReturnSig) return e.code;
        throw e;
      }
    }

    // ------------------------------------------------------------ 실행
    async exec(node, io) {
      if (this.session.aborted) throw new AbortSig();
      switch (node.type) {
        case 'list': {
          let st = this.status;
          for (const it of node.items) {
            if (it.bg) { st = this.startJob(it.node, io); continue; }
            st = await this.exec(it.node, io);
            this.status = st;
            if (it.node.type !== 'pipe') this.vars.PIPESTATUS = { v: [String(st)] };
            if (st !== 0 && this.traps && this.traps.ERR && !this.noErr && !this._inErrTrap) {
              this._inErrTrap = true;
              try { await this.runSource(this.traps.ERR, io); } finally { this._inErrTrap = false; }
              this.status = st;
            }
            if (st !== 0 && this.opts.e && !this.noErr && !(it.node.type === 'andor') && !(it.node.type === 'pipe' && it.node.neg)) throw new ExitSig(st);
          }
          return st;
        }
        case 'andor': {
          this.noErr++;
          let st;
          try {
            st = await this.exec(node.first, io);
            this.status = st;
            for (const r of node.rest) {
              if ((r.op === '&&' && st === 0) || (r.op === '||' && st !== 0)) { st = await this.exec(r.node, io); this.status = st; }
            }
          } finally { this.noErr--; }
          return st;
        }
        case 'pipe': return this.execPipe(node, io);
        case 'simple': return this.execSimple(node, io);
        default: return this.withRedirs(node, io, (rio) => this.execCompound(node, rio));
      }
    }

    async execPipe(node, io) {
      let input = io.stdin;
      let st = 0;
      const n = node.cmds.length;
      const sts = [];
      for (let i = 0; i < n; i++) {
        const last = i === n - 1;
        let buf = '';
        const sub = {
          stdin: input,
          out: last ? io.out : (s) => { buf += s; },
          err: node.cmds[i].errToPipe && !last ? (s) => { buf += s; } : io.err,
          tty: last ? io.tty : false,
          pipeOut: !last,
          pipeIn: i > 0
        };
        if (n > 1) {
          // 파이프라인의 각 명령은 서브셸에서 실행된다 (변수 변경이 남지 않음)
          const psh = this.child('sub');
          psh.interactive = false;
          psh.jobCtx = this.jobCtx;
          try { st = await psh.exec(node.cmds[i], sub); } catch (e) { if (e instanceof ExitSig) st = e.code; else throw e; }
        } else st = await this.exec(node.cmds[i], sub);
        sts.push(st);
        input = new InStream(buf);
      }
      if (n > 1 && this.opts.pipefail) { const bad = sts.filter((x) => x !== 0); st = bad.length ? bad[bad.length - 1] : 0; }
      this.vars.PIPESTATUS = { v: sts.map(String) };
      if (node.neg) st = st === 0 ? 1 : 0;
      return st;
    }

    /** 스크립트의 본문 실행: exit 처리 + EXIT 트랩 */
    async runMain(src, io) {
      let st;
      try {
        st = await this.runSource(src, io);
      } catch (e) {
        if (!(e instanceof ExitSig)) { await this.runExitTrap(io); throw e; }
        st = e.code;
      }
      this.status = st;
      const t = await this.runExitTrap(io);
      return t != null ? t : st;
    }

    async runExitTrap(io) {
      const t = this.traps && this.traps.EXIT;
      if (!t) return null;
      delete this.traps.EXIT;
      try { await this.runSource(t, io); } catch (e) { if (e instanceof ExitSig) return e.code; if (!(e instanceof ReturnSig)) throw e; }
      return null;
    }

    startJob(node, io) {
      const id = this.jobs.nextId();
      const text = nodeText(node);
      const sh = this.child('sub');
      // 단순 명령은 그 명령이 곧 작업 프로세스, 복합 명령은 서브셸(bash)이 작업 프로세스
      const simple = node.type === 'simple' && node.words.length > 0;
      const ppid = this.pid || this.session.shellPid;
      const job = this.jobs.add(id, text, this.user, { ppid, cmd: simple ? text : (ppid === this.session.shellPid ? '-bash' : 'bash') });
      job.simple = simple;
      this.lastBg = job.pid;
      io.err(`[${id}] ${job.pid}\n`);
      const bio = { stdin: new InStream(''), out: io.out, err: io.err, tty: io.tty, job };
      sh.jobCtx = job;
      job.promise = (async () => {
        try { job.status = await sh.exec(node, bio); } catch (e) { job.status = e && e.code != null ? e.code : 1; }
        job.done = true;
        this.jobs.finish(job);
      })();
      return 0;
    }

    async execCompound(node, io) {
      switch (node.type) {
        case 'group': return this.exec(node.body, io);
        case 'sub': {
          const sh = this.child('sub');
          try { return await sh.exec(node.body, io); } catch (e) { if (e instanceof ExitSig) return e.code; throw e; }
        }
        case 'if': {
          for (const c of node.clauses) {
            this.noErr++;
            let st;
            try { st = await this.exec(c.cond, io); } finally { this.noErr--; }
            if (st === 0) return this.exec(c.body, io);
          }
          if (node.other) return this.exec(node.other, io);
          return 0;
        }
        case 'for': {
          let items;
          if (node.words == null) items = this.pos.slice();
          else {
            items = [];
            for (const w of node.words) items.push(...await this.expand(w, io));
          }
          let st = 0;
          this.loopDepth++;
          try {
            let k = 0;
            for (const it of items) {
              this.setVar(node.name, it);
              if (++k % 50 === 0) await this.yieldTick();
              try { st = await this.exec(node.body, io); } catch (e) {
                if (e instanceof BreakSig) { if (e.n > 1) { e.n--; throw e; } break; }
                if (e instanceof ContinueSig) { if (e.n > 1) { e.n--; throw e; } continue; }
                throw e;
              }
            }
          } finally { this.loopDepth--; }
          return st;
        }
        case 'cfor': {
          let st = 0;
          this.loopDepth++;
          try {
            if (node.init.trim()) arith(await this.expandArith(node.init, io), this);
            let guard = 0;
            for (;;) {
              if (node.cond.trim() && !arith(await this.expandArith(node.cond, io), this)) break;
              if (++guard % 50 === 0) await this.yieldTick();
              try { st = await this.exec(node.body, io); } catch (e) {
                if (e instanceof BreakSig) { if (e.n > 1) { e.n--; throw e; } break; }
                if (!(e instanceof ContinueSig)) throw e;
                if (e.n > 1) { e.n--; throw e; }
              }
              if (node.step.trim()) arith(await this.expandArith(node.step, io), this);
            }
          } catch (e) {
            if (e instanceof Error) { io.err(`bash: ((: ${e.message}\n`); return 1; }
            throw e;
          } finally { this.loopDepth--; }
          return st;
        }
        case 'while': {
          let st = 0;
          this.loopDepth++;
          try {
            let guard = 0;
            for (;;) {
              this.noErr++;
              let c;
              try { c = await this.exec(node.cond, io); } finally { this.noErr--; }
              if (node.until ? c === 0 : c !== 0) break;
              if (++guard % 20 === 0) await this.yieldTick();
              if (this.session.headless && guard > 20000) { io.err('bash: (가상 터미널) 반복이 너무 많아 중단했습니다\n'); break; }
              try { st = await this.exec(node.body, io); } catch (e) {
                if (e instanceof BreakSig) { if (e.n > 1) { e.n--; throw e; } break; }
                if (e instanceof ContinueSig) { if (e.n > 1) { e.n--; throw e; } continue; }
                throw e;
              }
            }
          } finally { this.loopDepth--; }
          return st;
        }
        case 'case': {
          const w = (await this.expandNoSplit(node.word, io));
          for (const it of node.items) {
            for (const p of it.pats) {
              const pat = await this.expandPattern(p, io);
              if (matchPattern(w, pat)) return this.exec(it.body, io);
            }
          }
          return 0;
        }
        case 'func':
          this.funcs[node.name] = node.body;
          return 0;
        case 'arith': {
          try {
            const v = arith(await this.expandArith(node.expr, io), this);
            return v !== 0 ? 0 : 1;
          } catch (e) {
            io.err(`bash: ((: ${e.message}\n`);
            return 1;
          }
        }
        case 'dbl': return this.execDbl(node, io);
      }
      return 0;
    }

    async yieldTick() {
      if (this.session.aborted) throw new AbortSig();
      await new Promise((r) => (typeof setImmediate !== 'undefined' ? setImmediate(r) : setTimeout(r, 0)));
      if (this.session.aborted) throw new AbortSig();
    }

    // ------------------------------------------------------------ [[ ]]
    async execDbl(node, io) {
      const parts = node.parts;
      let p = 0;
      const self = this;
      const peek = () => parts[p];
      async function val(raw) { return self.expandNoSplit(raw, io); }
      async function or() {
        let v = await and();
        while (peek() && peek().op && peek().v === '||') { p++; const r = await and(); v = v || r; }
        return v;
      }
      async function and() {
        let v = await not();
        while (peek() && peek().op && peek().v === '&&') { p++; const r = await not(); v = v && r; }
        return v;
      }
      async function not() {
        if (peek() && !peek().op && peek().v === '!') { p++; return !(await not()); }
        return prim();
      }
      async function prim() {
        const t = peek();
        if (!t) throw new Error('unexpected end');
        if (t.op && t.v === '(') { p++; const v = await or(); p++; return v; }
        // 단항
        if (!t.op && /^-[a-zA-Z]$/.test(t.v) && parts[p + 1] && !(parts[p + 2] && (parts[p + 2].op ? ['<', '>'].includes(parts[p + 2].v) : /^(==|=|!=|=~|-eq|-ne|-lt|-le|-gt|-ge|-nt|-ot)$/.test(parts[p + 2].v)))) {
          p += 2;
          return self.unaryTest(t.v, await val(parts[p - 1].v));
        }
        const a = await val(t.v);
        p++;
        const op = peek();
        if (op && ((op.op && ['<', '>'].includes(op.v)) || (!op.op && /^(==|=|!=|=~|-eq|-ne|-lt|-le|-gt|-ge|-nt|-ot)$/.test(op.v)))) {
          p++;
          const rt = peek();
          p++;
          if (op.v === '=~') {
            // 정규식: 뒤따르는 조각을 모두 이어 붙인다
            let rx = rt ? rt.v : '';
            while (peek() && !(peek().op && ['&&', '||', ')'].includes(peek().v))) { rx += peek().v; p++; }
            const src = await self.expandNoSplit(rx, io);
            let re;
            try { re = new RegExp(src); } catch (e) { return false; }
            const m = re.exec(a);
            self.vars.BASH_REMATCH = { v: m ? Array.from(m) : [], x: false };
            return !!m;
          }
          if (op.v === '==' || op.v === '=' || op.v === '!=') {
            const pat = await self.expandPattern(rt ? rt.v : '', io);
            const r = matchPattern(a, pat);
            return op.v === '!=' ? !r : r;
          }
          const b = await val(rt ? rt.v : '');
          return self.binaryTest(op.v, a, b);
        }
        return a !== '';
      }
      try {
        const r = await or();
        return r ? 0 : 1;
      } catch (e) {
        io.err(`bash: 조건식 오류: ${e.message}\n`);
        return 2;
      }
    }

    unaryTest(op, a) {
      const fs = this.m.vfs;
      const abs = P().normalize(this.cwd, a);
      const node = a === '' ? null : fs.lookup(abs, op !== '-L' && op !== '-h');
      switch (op) {
        case '-e': case '-a': return !!node;
        case '-f': return !!node && node.t === 'f';
        case '-d': return !!node && node.t === 'd';
        case '-L': case '-h': return !!node && node.t === 'l';
        case '-b': return !!node && node.t === 'b';
        case '-c': return !!node && node.t === 'c';
        case '-s': return !!node && fs.size(node) > 0;
        case '-r': return !!node && fs.perm(node, this.cred, 4);
        case '-w': return !!node && fs.perm(node, this.cred, 2);
        case '-x': return !!node && fs.perm(node, this.cred, 1);
        case '-u': return !!node && (node.m & 0o4000) !== 0;
        case '-g': return !!node && (node.m & 0o2000) !== 0;
        case '-k': return !!node && (node.m & 0o1000) !== 0;
        case '-O': return !!node && node.u === this.cred.uid;
        case '-z': return a === '';
        case '-n': return a !== '';
        case '-v': return this.isSet(a);
        case '-t': return true;
      }
      return false;
    }

    binaryTest(op, a, b) {
      const num = (x) => {
        if (!/^\s*[-+]?\d+\s*$/.test(x)) throw new Error(`${x}: integer expression expected`);
        return parseInt(x, 10);
      };
      switch (op) {
        case '=': case '==': return a === b;
        case '!=': return a !== b;
        case '<': return a < b;
        case '>': return a > b;
        case '-eq': return num(a) === num(b);
        case '-ne': return num(a) !== num(b);
        case '-lt': return num(a) < num(b);
        case '-le': return num(a) <= num(b);
        case '-gt': return num(a) > num(b);
        case '-ge': return num(a) >= num(b);
        case '-nt': case '-ot': {
          const na = this.m.vfs.lookup(P().normalize(this.cwd, a));
          const nb = this.m.vfs.lookup(P().normalize(this.cwd, b));
          if (!na || !nb) return op === '-nt' ? !!na : !!nb;
          return op === '-nt' ? na.mt > nb.mt : na.mt < nb.mt;
        }
      }
      return false;
    }

    // ------------------------------------------------------------ 리다이렉션
    async withRedirs(node, io, fn) {
      if (!node.redirs || !node.redirs.length) return fn(io);
      let r;
      try { r = await this.applyRedirs(node.redirs, io); } catch (e) {
        io.err(`bash: ${e.message}\n`);
        return 1;
      }
      try { return await fn(r.io); } finally { r.finish(); }
    }

    async applyRedirs(redirs, io) {
      const nio = Object.assign({}, io);
      const flushers = [];
      const fs = this.m.vfs;
      const openOut = (target, append, force) => {
        const abs = P().normalize(this.cwd, target);
        const node = fs.lookup(abs);
        if (node && node.t === 'c') {
          if (/\/dev\/(stderr)$/.test(abs)) return io.err;
          if (/\/dev\/(stdout|tty)$/.test(abs)) return io.out;
          return () => {};
        }
        if (node && node.t === 'f' && !append && !force && this.opts.C) throw new Error(`${target}: cannot overwrite existing file`);
        try {
          if (!append || !node) fs.writeFile(abs, '', this.cred, { mode: 0o666 & ~this.umask });
          else fs.writeFile(abs, '', this.cred, { append: true });
        } catch (e) {
          throw new Error(`${target}: ${e.message}`);
        }
        const self = this;
        let buf = '';
        // 백그라운드 작업의 출력은 바로 파일에 쓴다 (실행 중에도 cat · tail 로 보이게)
        const w = (s) => { buf += s; if (buf.length > 4096 || io.job || self.jobCtx) flush(); };
        function flush() { if (!buf) return; try { fs.writeFile(abs, buf, self.cred, { append: true }); } catch (e) { /* 무시 */ } buf = ''; }
        flushers.push(flush);
        w.flush = flush;
        return w;
      };
      for (const r of redirs) {
        let target = r.target != null ? await this.expandNoSplit(r.target, io) : null;
        if (r.target != null && target === '' ) throw new Error(`${r.target}: ambiguous redirect`);
        switch (r.op) {
          case '>': case '>>': {
            const w = openOut(target, r.op === '>>', r.force);
            if (r.fd === 2) nio.err = w; else { nio.out = w; nio.tty = false; }
            break;
          }
          case '&>': case '&>>': {
            const w = openOut(target, r.op === '&>>');
            nio.out = w; nio.err = w; nio.tty = false;
            break;
          }
          case '>&': {
            if (target === '1') { if (r.fd === 2) nio.err = nio.out; }
            else if (target === '2') { if (r.fd === 1 || r.fd == null) { nio.out = nio.err; } }
            else if (target === '-') { if (r.fd === 2) nio.err = () => {}; else nio.out = () => {}; }
            else { const w = openOut(target, false); nio.out = w; nio.err = w; nio.tty = false; }
            break;
          }
          case '<': {
            const abs = P().normalize(this.cwd, target);
            let text;
            try { text = fs.readFile(abs, this.cred); } catch (e) { throw new Error(`${target}: ${e.message}`); }
            nio.stdin = new InStream(text);
            break;
          }
          case '<&': break;
          case '<<': {
            const body = r.quoted ? r.body : await this.expandHeredoc(r.body, io);
            nio.stdin = new InStream(body);
            break;
          }
          case '<<<': nio.stdin = new InStream(target + '\n'); break;
        }
      }
      return { io: nio, finish: () => flushers.forEach((f) => f()) };
    }

    // ------------------------------------------------------------ 단순 명령
    async execSimple(node, io) {
      this.lineNo = (this.lineNo || 0) + 1;
      let argv = [];
      try {
        for (let i = 0; i < node.words.length; i++) {
          let w = node.words[i];
          if (i === 0 && argv.length === 0 && this.aliases[w] != null && !/['"\\]/.test(w) && !this._inAlias) {
            // 별칭 확장
            const extra = lex(this.aliases[w]).filter((t) => t.t === 'word').map((t) => t.v);
            for (const e of extra) argv.push(...await this.expand(e, io));
            continue;
          }
          argv.push(...await this.expand(w, io));
        }
      } catch (e) {
        if (e instanceof AbortSig || e instanceof ExitSig) throw e;
        io.err(`bash: ${e.message}\n`);
        // set -u: 비대화형 셸은 여기서 끝난다
        if (/unbound variable$/.test(e.message) && !this.interactive) throw new ExitSig(1);
        return 1;
      }
      // 대입만 있는 명령
      if (!argv.length) {
        try {
          for (const a of node.assigns) await this.doAssign(a, io, false);
        } catch (e) {
          io.err(`bash: ${e.message}\n`);
          return 1;
        }
        if (node.redirs.length) {
          try { const r = await this.applyRedirs(node.redirs, io); r.finish(); } catch (e) { io.err(`bash: ${e.message}\n`); return 1; }
        }
        return this.lastSubst != null ? this.lastSubst : 0;
      }
      let tempVars = null;
      if (node.assigns.length) {
        tempVars = {};
        for (const a of node.assigns) {
          const m = /^([A-Za-z_]\w*)=/.exec(a);
          if (m) { if (!(m[1] in tempVars)) tempVars[m[1]] = this.vars[m[1]] ? Object.assign({}, this.vars[m[1]]) : undefined; await this.doAssign(a, io, true); }
        }
      }
      if (this.opts.x) io.err('+ ' + argv.map(shQuote).join(' ') + '\n');
      let r;
      try {
        r = await this.applyRedirs(node.redirs, io);
      } catch (e) {
        io.err(`bash: ${e.message}\n`);
        if (tempVars) this.restoreTemp(tempVars);
        return 1;
      }
      try {
        return await this.invoke(argv, r.io);
      } finally {
        r.finish();
        if (tempVars) this.restoreTemp(tempVars);
      }
    }

    restoreTemp(t) {
      for (const k of Object.keys(t)) { if (t[k]) this.vars[k] = t[k]; else delete this.vars[k]; }
    }

    async doAssign(a, io, exportIt) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)(\[[^\]]*\])?(\+?)=([\s\S]*)$/.exec(a);
      const name = m[1], idx = m[2], plus = m[3] === '+', raw = m[4];
      if (!idx && raw.startsWith('(') && raw.endsWith(')')) {
        // 배열 대입
        const inner = raw.slice(1, -1);
        const words = lex(inner).filter((t) => t.t === 'word').map((t) => t.v);
        const vals = [];
        let assocMode = this.vars[name] && this.vars[name].assoc;
        const assoc = {};
        for (const w of words) {
          const km = /^\[([^\]]+)\]=(.*)$/.exec(w);
          if (km) { assocMode = assocMode || !/^\d+$/.test(km[1]); assoc[km[1]] = await this.expandNoSplit(km[2], io); vals[+km[1] || 0] = assoc[km[1]]; continue; }
          vals.push(...await this.expand(w, io));
        }
        if (assocMode && this.vars[name] && this.vars[name].assoc) { Object.assign(this.vars[name].assoc, plus ? assoc : assoc); if (!plus) this.vars[name].assoc = assoc; return; }
        const old = this.vars[name];
        if (plus && old && Array.isArray(old.v)) old.v.push(...vals);
        else this.vars[name] = { v: vals, x: old ? old.x : false };
        return;
      }
      let v = await this.expandNoSplit(raw, io, { assign: true });
      const full = name + (idx ? '[' + await this.expandNoSplit(idx.slice(1, -1), io) + ']' : '');
      if (plus) {
        const cur = this.getVar(full);
        const e = this.vars[name];
        if (e && e.int) v = String(arith(cur || '0', this) + arith(v || '0', this));
        else v = cur + v;
      } else if (this.vars[name] && this.vars[name].int) {
        try { v = String(arith(v || '0', this)); } catch (e) { v = '0'; }
      }
      this.setVar(full, v, { export: exportIt });
    }

    /** 명령 호출: 함수 → 내장 → PATH 의 실행 파일 */
    async invoke(argv, io) {
      const name = argv[0];
      if (this.funcs[name] && !this._noFunc) return this.callFunc(name, argv.slice(1), io);
      if (BUILTINS[name]) {
        try {
          return await BUILTINS[name](this.ctx(argv, io));
        } catch (e) {
          if (e instanceof ExitSig || e instanceof ReturnSig || e instanceof BreakSig || e instanceof ContinueSig || e instanceof AbortSig) throw e;
          io.err(`bash: ${name}: ${e.message}\n`);
          return 1;
        }
      }
      return this.m.execFile(this, argv, io);
    }

    async callFunc(name, args, io) {
      const saved = this.pos;
      this.pos = args;
      const savedLocals = this.locals;
      this.locals = {};
      this.funcDepth++;
      if (this.funcDepth > 200) { this.funcDepth--; this.pos = saved; io.err(`bash: ${name}: maximum function nesting level exceeded (200)\n`); return 1; }
      try {
        return await this.exec(this.funcs[name], io);
      } catch (e) {
        if (e instanceof ReturnSig) return e.code;
        throw e;
      } finally {
        this.funcDepth--;
        // local 변수 복원
        for (const k of Object.keys(this.locals)) {
          if (this.locals[k]) this.vars[k] = this.locals[k]; else delete this.vars[k];
        }
        this.locals = savedLocals;
        this.pos = saved;
      }
    }

    /** 명령에 넘길 실행 환경 */
    ctx(argv, io) {
      const sh = this;
      const session = this.session;
      const name = P().basename(argv[0]);
      return {
        argv, args: argv.slice(1), name,
        sh, m: this.m, fs: this.m.vfs, session,
        get cred() { return sh.cred; },
        get user() { return sh.cred.name; },
        get cwd() { return sh.cwd; },
        io,
        out: (s) => io.out(String(s)),
        err: (s) => io.err(String(s)),
        stdin: io.stdin,
        tty: io.tty !== false && !io.pipeOut,
        pipeOut: !!io.pipeOut,
        env: (k) => sh.getVar(k),
        resolve: (p) => P().normalize(sh.cwd, p),
        error(msg) { io.err(`${name}: ${msg}\n`); },
        get aborted() { return session.aborted || !!(io.job && io.job.killed); },
        async sleep(ms) { return session.sleep(ms, io.job); },
        /** 표준 입력 전체 (터미널이면 Ctrl+D 까지) */
        async readStdin() {
          if (io.stdin) return io.stdin.readAll();
          if (session.headless || io.job) return '';
          let s = '';
          for (;;) {
            const l = await session.requestLine('', { raw: true });
            if (l == null) break;
            s += l + '\n';
          }
          return s;
        },
        /** 한 줄 입력 (프롬프트 표시). 파이프 입력이 있으면 거기서 읽는다 */
        async readLine(prompt, opts = {}) {
          if (io.stdin && !opts.tty) {
            if (prompt) io.err(prompt);
            const l = io.stdin.readLine();
            if (prompt && l != null && !opts.secret) io.err('\n');
            return l;
          }
          return session.requestLine(prompt || '', opts);
        }
      };
    }

    // ------------------------------------------------------------ 확장
    async expandNoSplit(raw, io, o = {}) {
      const f = await this.expandRaw(raw, io, { noSplit: true, noGlob: true, assign: o.assign });
      return f.map((x) => x.lit).join(' ');
    }
    async expandPattern(raw, io) {
      const f = await this.expandRaw(raw, io, { noSplit: true, noGlob: true });
      return f.map((x) => x.pat).join(' ');
    }
    async expandArith(expr, io) {
      // $(( )) 안의 $var · $(cmd) 를 먼저 확장
      if (!/[$`]/.test(expr)) return expr;
      const f = await this.expandRaw('"' + expr.replace(/"/g, '\\"') + '"', io, { noSplit: true, noGlob: true });
      return f.map((x) => x.lit).join('');
    }
    async expandHeredoc(body, io) {
      let out = '';
      let i = 0;
      while (i < body.length) {
        const c = body[i];
        if (c === '\\' && '$`\\\n'.includes(body[i + 1])) { if (body[i + 1] !== '\n') out += body[i + 1]; i += 2; continue; }
        if (c === '$' || c === '`') {
          const r = await this.expandDollar(body, i, io, true);
          if (r) { out += Array.isArray(r.val) ? r.val.join(' ') : r.val; i = r.end; continue; }
        }
        out += c;
        i++;
      }
      return out;
    }

    async procSubst(raw, io) {
      // <(명령) → 명령 출력을 담은 /dev/fd/N 파일
      let buf = '';
      const sh = this.child('sub');
      try { await sh.runSource(raw.slice(2, -1), { stdin: io.stdin, out: (s) => { buf += s; }, err: io.err, tty: false }); } catch (e) { if (!(e instanceof ExitSig)) throw e; }
      const fs = this.m.vfs;
      const root = { uid: 0, gid: 0, groups: [0] };
      this._psub = ((this._psub || 0) + 1) % 8;
      const path = `/dev/fd/${63 - this._psub}`;
      try {
        if (!fs.exists('/dev/fd')) fs.mkdir('/dev/fd', root, { mode: 0o777 });
        fs.writeFile(path, buf, root, { mode: 0o666 });
        fs.chmod(path, 0o666, root);
      } catch (e) { /* 무시 */ }
      return path;
    }

    async expand(raw, io) {
      if (/^[<>]\([\s\S]*\)$/.test(raw)) return [await this.procSubst(raw, io)];
      const words = braceExpand(raw);
      const out = [];
      for (const w of words) {
        const fields = await this.expandRaw(w, io, {});
        for (const f of fields) {
          if (f.glob && !this.noGlob) {
            const g = this.globPath(f.pat);
            if (g.length) { out.push(...g); continue; }
          }
          out.push(f.lit);
        }
      }
      return out;
    }

    globPath(pat) {
      const fs = this.m.vfs;
      const abs = pat.startsWith('/');
      const segs = pat.split('/').filter((s, i) => s !== '' || i === 0);
      let bases = [abs ? '/' : ''];
      const parts = abs ? pat.split('/').slice(1) : pat.split('/');
      for (let k = 0; k < parts.length; k++) {
        const seg = parts[k];
        const lastSeg = k === parts.length - 1;
        if (seg === '') { bases = bases.map((b) => b); continue; }
        const next = [];
        for (const b of bases) {
          const dir = P().normalize(this.cwd, b || '.');
          if (hasGlob(seg)) {
            let names;
            try { names = fs.readdir(dir, this.cred); } catch (e) { continue; }
            const re = globToRe(seg, true);
            for (const nm of names) {
              if (nm.startsWith('.') && !seg.startsWith('.') && !seg.startsWith('\\.')) continue;
              if (!re.test(nm)) continue;
              const p = (b === '' ? '' : b === '/' ? '/' : b + '/') + nm;
              if (!lastSeg) { const nd = fs.lookup(P().normalize(this.cwd, p)); if (!nd || nd.t !== 'd') continue; }
              next.push(p);
            }
          } else {
            const lit = seg.replace(/\\(.)/g, '$1');
            const p = (b === '' ? '' : b === '/' ? '/' : b + '/') + lit;
            if (fs.exists(P().normalize(this.cwd, p)) || !lastSeg) next.push(p);
          }
        }
        bases = next;
        if (!bases.length) return [];
      }
      void segs;
      // en_US.UTF-8 정렬 (ls 와 같게: 대소문자 · 기호 무시 후 비교)
      const key = (s) => s.toLowerCase().replace(/[^a-z0-9가-힣/]/g, '');
      const res = bases.filter((b) => fs.exists(P().normalize(this.cwd, b), false))
        .sort((a, b) => { const ka = key(a), kb = key(b); return ka < kb ? -1 : ka > kb ? 1 : (a < b ? -1 : a > b ? 1 : 0); });
      return pat.endsWith('/') ? res.map((r) => (r.endsWith('/') ? r : r + '/')) : res;
    }

    /**
     * 원시 단어를 필드 목록으로 확장
     * @returns {Array<{lit, pat, glob}>}
     */
    async expandRaw(raw, io, mode) {
      const fields = [];
      let cur = null;
      const ensure = () => cur || (cur = { lit: '', pat: '', glob: false, q: false });
      const addQ = (s) => { ensure(); cur.lit += s; cur.pat += escGlob(s); cur.q = true; };
      const addL = (s) => { ensure(); cur.lit += s; cur.pat += s; if (/[*?[]/.test(s)) cur.glob = true; };
      const addS = (s) => {   // 따옴표 밖 확장 결과: 단어 분리 + 글로브
        if (mode.noSplit) { ensure(); cur.lit += s; cur.pat += mode.noGlob ? escGlob(s) : s; if (!mode.noGlob && /[*?[]/.test(s)) cur.glob = true; return; }
        const ifs = this.vars.IFS ? this.vars.IFS.v : ' \t\n';
        for (const ch of s) {
          if (ifs.includes(ch)) { if (cur) { fields.push(cur); cur = null; } continue; }
          ensure();
          cur.lit += ch; cur.pat += ch;
          if ('*?['.includes(ch)) cur.glob = true;
        }
      };
      let i = 0;
      const n = raw.length;
      // 틸드
      if (raw[0] === '~') {
        const m = /^~([A-Za-z0-9_.-]*)(?=\/|$|:)/.exec(raw);
        if (m) {
          let home;
          if (!m[1]) home = this.getVar('HOME');
          else if (m[1] === '+') home = this.cwd;
          else { const c = this.m.credFor(m[1]); home = c ? c.home : null; }
          if (home != null) { addQ(home); i = m[0].length; }
        }
      }
      while (i < n) {
        const c = raw[i];
        if (c === "'") {
          const j = raw.indexOf("'", i + 1);
          addQ(raw.slice(i + 1, j < 0 ? n : j));
          ensure();
          i = j < 0 ? n : j + 1;
          continue;
        }
        if (c === '$' && raw[i + 1] === "'") {
          // $'...' ANSI-C 따옴표
          let j = i + 2, s = '';
          while (j < n && raw[j] !== "'") {
            if (raw[j] === '\\') { s += cEscape(raw[j + 1]); j += 2; continue; }
            s += raw[j++];
          }
          addQ(s);
          i = j + 1;
          continue;
        }
        if (c === '"') {
          ensure();
          cur.q = true;
          let j = i + 1;
          while (j < n && raw[j] !== '"') {
            const d = raw[j];
            if (d === '\\' && '$`"\\\n'.includes(raw[j + 1])) { if (raw[j + 1] !== '\n') addQ(raw[j + 1]); j += 2; continue; }
            if (d === '$' && (raw[j + 1] === '@' || raw.startsWith('${', j) && /^\$\{!?[A-Za-z_]\w*\[@\]\}/.test(raw.slice(j)))) {
              // "$@" / "${arr[@]}" / "${!arr[@]}" → 각각 별도 필드
              let list, len;
              if (raw[j + 1] === '@') { list = this.pos; len = 2; }
              else {
                const mm = /^\$\{(!?)([A-Za-z_]\w*)\[@\]\}/.exec(raw.slice(j));
                const e = this.vars[mm[2]];
                if (mm[1]) list = e ? (Array.isArray(e.v) ? e.v.map((x, k) => (x != null ? String(k) : null)).filter((x) => x != null) : e.assoc ? Object.keys(e.assoc) : ['0']) : [];
                else list = e ? (Array.isArray(e.v) ? e.v.filter((x) => x != null) : e.assoc ? Object.values(e.assoc) : [e.v]) : [];
                len = mm[0].length;
              }
              list.forEach((x, k) => {
                if (k > 0) { fields.push(cur); cur = null; }
                addQ(x);
              });
              if (!list.length && cur && cur.lit === '' && raw === '"$@"') { cur = null; cur = { lit: '', pat: '', glob: false, q: false, drop: true }; }
              j += len;
              continue;
            }
            if (d === '$' || d === '`') {
              const r = await this.expandDollar(raw, j, io, true);
              if (r) { addQ(Array.isArray(r.val) ? r.val.join(' ') : r.val); j = r.end; continue; }
            }
            addQ(d);
            j++;
          }
          i = j + 1;
          continue;
        }
        if (c === '\\') { addQ(raw[i + 1] || ''); i += 2; continue; }
        if (c === '$' || c === '`') {
          const r = await this.expandDollar(raw, i, io, false);
          if (r) {
            if (Array.isArray(r.val)) {
              r.val.forEach((x, k) => { if (k > 0 && !mode.noSplit) { if (cur) fields.push(cur); cur = null; } addS(x); });
            } else addS(r.val);
            i = r.end;
            continue;
          }
        }
        addL(c);
        i++;
      }
      if (cur && !cur.drop) fields.push(cur);
      if (mode.noSplit && !fields.length) fields.push({ lit: '', pat: '', glob: false, q: true });
      return fields.filter((f) => f.q || f.lit !== '' || mode.noSplit);
    }

    /** raw[i] 의 $ 또는 ` 확장. { val, end } (확장이 아니면 null) */
    async expandDollar(raw, i, io, quoted) {
      const c = raw[i];
      if (c === '`') {
        let j = i + 1;
        while (j < raw.length && raw[j] !== '`') { if (raw[j] === '\\') j++; j++; }
        const cmd = raw.slice(i + 1, j).replace(/\\([`$\\])/g, '$1');
        return { val: await this.cmdSubst(cmd, io), end: j + 1 };
      }
      const nx = raw[i + 1];
      if (nx === '(' && raw[i + 2] === '(') {
        // $(( ))
        let depth = 0, j = i + 1;
        for (; j < raw.length; j++) {
          if (raw[j] === '(') depth++;
          else if (raw[j] === ')') { depth--; if (depth === 0) break; }
        }
        const expr = raw.slice(i + 3, j - 1);
        let v;
        try { v = arith(await this.expandArith(expr, io), this); } catch (e) { throw new Error(`${expr}: ${e.message}`); }
        return { val: String(v), end: j + 1 };
      }
      if (nx === '(') {
        let depth = 0, j = i + 1, q = null;
        for (; j < raw.length; j++) {
          const ch = raw[j];
          if (q) { if (ch === q) q = null; else if (ch === '\\' && q === '"') j++; continue; }
          if (ch === "'" || ch === '"') { q = ch; continue; }
          if (ch === '\\') { j++; continue; }
          if (ch === '(') depth++;
          else if (ch === ')') { depth--; if (depth === 0) break; }
        }
        return { val: await this.cmdSubst(raw.slice(i + 2, j), io), end: j + 1 };
      }
      if (nx === '{') {
        let depth = 0, j = i + 1;
        for (; j < raw.length; j++) {
          if (raw[j] === '{') depth++;
          else if (raw[j] === '}') { depth--; if (depth === 0) break; }
        }
        const inner = raw.slice(i + 2, j);
        return { val: await this.paramExpand(inner, io, quoted), end: j + 1 };
      }
      let m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(raw.slice(i + 1));
      if (m) {
        if (this.opts.u && !this.isSet(m[0])) throw new Error(`${m[0]}: unbound variable`);
        return { val: this.getVar(m[0]), end: i + 1 + m[0].length };
      }
      if (nx && /[0-9?$#@*!-]/.test(nx)) {
        if ((nx === '@' || nx === '*') && !quoted) return { val: this.pos.slice(), end: i + 2 };
        return { val: this.getVar(nx), end: i + 2 };
      }
      return null;
    }

    async cmdSubst(src, io) {
      const sh = this.child('sub');
      let buf = '';
      const sio = { stdin: io.stdin, out: (s) => { buf += s; }, err: io.err, tty: false };
      let st;
      try {
        st = await sh.runSource(src, sio);
      } catch (e) {
        if (e instanceof ExitSig) st = e.code;
        else throw e;
      }
      this.lastSubst = st;
      this.status = st;
      return buf.replace(/\n+$/, '');
    }

    async paramExpand(inner, io, quoted) {
      // ${#name} ${#arr[@]}
      let m;
      if ((m = /^#([A-Za-z_]\w*|\d+|[@*#?])(\[[@*]\])?$/.exec(inner))) {
        const e = this.vars[m[1]];
        if (m[2]) return String(e ? (Array.isArray(e.v) ? e.v.filter((x) => x != null).length : e.assoc ? Object.keys(e.assoc).length : 1) : 0);
        if (m[1] === '@' || m[1] === '*') return String(this.pos.length);
        return String([...this.getVar(m[1])].length);
      }
      if ((m = /^#([A-Za-z_]\w*)\[([^\]]+)\]$/.exec(inner))) return String([...this.getVar(`${m[1]}[${m[2]}]`)].length);
      if ((m = /^!([A-Za-z_]\w*)\[[@*]\]$/.exec(inner))) {
        const e = this.vars[m[1]];
        if (!e) return '';
        const keys = Array.isArray(e.v) ? e.v.map((x, k) => (x != null ? String(k) : null)).filter((x) => x != null) : e.assoc ? Object.keys(e.assoc) : ['0'];
        return quoted ? keys.join(' ') : keys;
      }
      if ((m = /^!([A-Za-z_]\w*)$/.exec(inner))) return this.getVar(this.getVar(m[1]));
      m = /^([A-Za-z_]\w*|\d+|[@*#?$!-])(\[[^\]]*\])?([\s\S]*)$/.exec(inner);
      if (!m) throw new Error(`\${${inner}}: bad substitution`);
      const name = m[1] + (m[2] && m[2] !== '[@]' && m[2] !== '[*]' ? '[' + await this.expandNoSplit(m[2].slice(1, -1), io) + ']' : (m[2] || ''));
      const rest = m[3];
      let val;
      let isArr = false;
      if (m[2] === '[@]' || m[2] === '[*]') {
        const e = this.vars[m[1]];
        val = e ? (Array.isArray(e.v) ? e.v.filter((x) => x != null) : e.assoc ? Object.values(e.assoc) : [e.v]) : [];
        isArr = true;
      } else if (m[1] === '@' || m[1] === '*') { val = this.pos.slice(); isArr = true; }
      else val = this.getVar(name);
      const set = isArr ? val.length > 0 : this.isSet(name);
      const joinv = () => (isArr ? val.join(' ') : val);
      const word = async (w) => this.expandNoSplit(w, io);
      const pat = async (w) => this.expandPattern(w, io);
      const mapv = (fn) => (isArr ? val.map(fn) : fn(val));
      if (!rest) {
        if (this.opts.u && !set) throw new Error(`${name}: unbound variable`);
        return isArr && !quoted ? val : joinv();
      }
      let r;
      if ((r = /^(:?)([-=+?])([\s\S]*)$/.exec(rest))) {
        const colon = r[1] === ':';
        const empty = !set || (colon && joinv() === '');
        switch (r[2]) {
          case '-': return empty ? word(r[3]) : joinv();
          case '=': if (empty) { const v = await word(r[3]); this.setVar(name, v); return v; } return joinv();
          case '+': return empty ? '' : word(r[3]);
          case '?': if (empty) throw new Error(`${name}: ${(await word(r[3])) || 'parameter null or not set'}`); return joinv();
        }
      }
      if ((r = /^(##?|%%?)([\s\S]*)$/.exec(rest))) {
        const p = await pat(r[2]);
        const re = globToRe(p, false);
        const cut = (s) => {
          if (r[1] === '#' || r[1] === '##') {
            const idx = r[1] === '#' ? [...Array(s.length + 1).keys()] : [...Array(s.length + 1).keys()].reverse();
            for (const k of idx) if (re.test(s.slice(0, k))) return s.slice(k);
            return s;
          }
          const idx = r[1] === '%' ? [...Array(s.length + 1).keys()].reverse() : [...Array(s.length + 1).keys()];
          for (const k of idx) if (re.test(s.slice(k))) return s.slice(0, k);
          return s;
        };
        const out = mapv(cut);
        return isArr && !quoted ? out : (isArr ? out.join(' ') : out);
      }
      if ((r = /^(\/\/?|\/#|\/%)((?:\\.|[^/])*)(?:\/([\s\S]*))?$/.exec(rest))) {
        const p = await pat(r[2]);
        const rep = r[3] != null ? await word(r[3]) : '';
        const src = globToRe(p, false).source.slice(1, -1);
        const out = mapv((s) => {
          if (r[1] === '/#') return s.replace(new RegExp('^' + src), rep);
          if (r[1] === '/%') return s.replace(new RegExp(src + '$'), rep);
          const re = new RegExp(src.replace(/\[\\s\\S\]\*/g, '[\\s\\S]*'), r[1] === '//' ? 'g' : '');
          return s.replace(re, () => rep);
        });
        return isArr && !quoted ? out : (isArr ? out.join(' ') : out);
      }
      if ((r = /^:\s*(-?[^:]*)(?::([\s\S]*))?$/.exec(rest))) {
        const off = arith(await word(r[1]) || '0', this);
        const len = r[2] != null ? arith(await word(r[2]) || '0', this) : null;
        if (isArr) {
          const a = val.slice(off < 0 ? val.length + off : off);
          const b = len == null ? a : a.slice(0, len);
          return quoted ? b.join(' ') : b;
        }
        const chars = [...val];
        const start = off < 0 ? Math.max(0, chars.length + off) : off;
        const end = len == null ? chars.length : len < 0 ? chars.length + len : start + len;
        return chars.slice(start, end).join('');
      }
      if ((r = /^(\^\^|\^|,,|,)$/.exec(rest))) {
        const f = { '^^': (s) => s.toUpperCase(), '^': (s) => s.charAt(0).toUpperCase() + s.slice(1), ',,': (s) => s.toLowerCase(), ',': (s) => s.charAt(0).toLowerCase() + s.slice(1) }[r[1]];
        const out = mapv(f);
        return isArr && !quoted ? out : (isArr ? out.join(' ') : out);
      }
      throw new Error(`\${${inner}}: bad substitution`);
    }
  }

  function cEscape(ch) {
    return { n: '\n', t: '\t', r: '\r', a: '\x07', b: '\b', e: '\x1b', E: '\x1b', '\\': '\\', "'": "'", '"': '"', '0': '\0' }[ch] != null
      ? { n: '\n', t: '\t', r: '\r', a: '\x07', b: '\b', e: '\x1b', E: '\x1b', '\\': '\\', "'": "'", '"': '"', '0': '\0' }[ch] : '\\' + ch;
  }

  function shQuote(s) { return /^[\w@%+=:,./-]+$/.test(s) ? s : "'" + s.replace(/'/g, "'\\''") + "'"; }

  /** 노드를 사람이 읽을 명령 문자열로 (jobs 표시용) */
  function nodeText(node) {
    if (!node) return '';
    const rtext = (n) => (n.redirs || []).map((r) => {
      const fd = r.fd != null && !(r.fd === 1 && /^>/.test(r.op)) && !(r.fd === 0 && r.op === '<') ? String(r.fd) : '';
      if (r.op === '<<') return ` <<${r.quoted ? "'EOF'" : 'EOF'}`;
      if (r.op === '>&' || r.op === '<&') return ` ${fd}${r.op}${r.target}`;
      return ` ${fd}${r.op} ${r.target}`;
    }).join('');
    switch (node.type) {
      case 'simple': return node.assigns.concat(node.words).join(' ') + rtext(node);
      case 'pipe': return (node.neg ? '! ' : '') + node.cmds.map(nodeText).join(' | ');
      case 'andor': return nodeText(node.first) + node.rest.map((r) => ` ${r.op} ${nodeText(r.node)}`).join('');
      case 'list': return node.items.map((it) => nodeText(it.node) + (it.bg ? ' &' : '')).join('; ');
      case 'sub': return `( ${nodeText(node.body)} )` + rtext(node);
      case 'group': return `{ ${nodeText(node.body)}; }` + rtext(node);
      case 'if': return 'if ...; fi' + rtext(node);
      case 'for': case 'cfor': return `for ...; done` + rtext(node);
      case 'while': return `${node.until ? 'until' : 'while'} ...; done` + rtext(node);
      case 'case': return 'case ... esac' + rtext(node);
      default: return node.type;
    }
  }

  LX.Shell = Shell;
  LX.lex = lex;
  LX.parse = parse;
  LX.shQuote = shQuote;
  LX.cEscape = cEscape;
  LX.braceExpand = braceExpand;
})(typeof window !== 'undefined' ? window : globalThis);

