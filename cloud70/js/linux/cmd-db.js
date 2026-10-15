
/* 가상 리눅스 — 데이터베이스 (작은 SQL 엔진 · mysql · psql · redis-cli) */
(function (G) {
  const LX = G.LX = G.LX || {};
  const def = LX.def;

  // ======================================================================= 초기 데이터
  LX.dbInit = function (m, kind) {
    if (kind === 'pg') {
      m.state.db.pg = m.state.db.pg || {
        dbs: { postgres: { tables: {}, owner: 'postgres' }, template0: { tables: {}, owner: 'postgres' }, template1: { tables: {}, owner: 'postgres' } },
        users: [{ user: 'postgres', host: '%', pass: null, super: true, grants: [] }]
      };
      return;
    }
    m.state.db.mysql = m.state.db.mysql || {
      flavor: kind,
      dbs: { information_schema: { tables: {}, sys: true }, mysql: { tables: {}, sys: true }, performance_schema: { tables: {}, sys: true }, sys: { tables: {}, sys: true } },
      users: [
        { user: 'root', host: 'localhost', plugin: kind === 'mariadb' ? 'unix_socket' : 'auth_socket', pass: null, grants: [{ priv: 'ALL PRIVILEGES', on: '*.*', grant: true }] },
        { user: 'debian-sys-maint', host: 'localhost', plugin: 'caching_sha2_password', pass: 'x', grants: [{ priv: 'ALL PRIVILEGES', on: '*.*' }] },
        { user: 'mysql.session', host: 'localhost', plugin: 'caching_sha2_password', pass: null, locked: true, grants: [] },
        { user: 'mysql.sys', host: 'localhost', plugin: 'caching_sha2_password', pass: null, locked: true, grants: [] }
      ],
      connId: 8
    };
  };

  // ======================================================================= SQL 어휘 분석
  function sqlTokens(src) {
    const t = [];
    let i = 0;
    const n = src.length;
    while (i < n) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '-' && src[i + 1] === '-') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '#') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; continue; }
      if (c === "'" || c === '"') {
        let j = i + 1, s = '';
        while (j < n) {
          if (src[j] === '\\') { s += { n: '\n', t: '\t', 0: '\0' }[src[j + 1]] || src[j + 1]; j += 2; continue; }
          if (src[j] === c) { if (src[j + 1] === c) { s += c; j += 2; continue; } break; }
          s += src[j++];
        }
        if (j >= n) throw new Error('unterminated');
        t.push({ k: c === "'" ? 'str' : 'dstr', v: s });
        i = j + 1;
        continue;
      }
      if (c === '`') { const j = src.indexOf('`', i + 1); t.push({ k: 'id', v: src.slice(i + 1, j) }); i = j + 1; continue; }
      let m;
      if ((m = /^\d+(\.\d+)?/.exec(src.slice(i)))) { t.push({ k: 'num', v: +m[0] }); i += m[0].length; continue; }
      if ((m = /^[A-Za-z_@$][\w$@]*/.exec(src.slice(i)))) { t.push({ k: 'id', v: m[0], up: m[0].toUpperCase() }); i += m[0].length; continue; }
      if ((m = /^(<=|>=|<>|!=|::|\|\||[(),;.*=<>+\-/%])/.exec(src.slice(i)))) { t.push({ k: 'op', v: m[0] }); i += m[0].length; continue; }
      throw new Error(`near '${src.slice(i, i + 20)}'`);
    }
    return t;
  }

  class SqlError extends Error { constructor(code, state, msg) { super(msg); this.code = code; this.state = state; } }

  // ======================================================================= SQL 엔진
  class SqlEngine {
    constructor(store, dialect, sess) {
      this.s = store;
      this.dialect = dialect;
      this.sess = sess; // { user, host, db }
    }
    err(code, state, msg) { throw new SqlError(code, state, msg); }
    syntax(near) {
      if (this.dialect === 'pg') this.err(0, '42601', `syntax error at or near "${near || ''}"`);
      this.err(1064, '42000', `You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '${near || ''}' at line 1`);
    }

    /** 문장 하나 실행 → { cols, rows } | { affected } | { msg } */
    exec(sql) {
      const t = sqlTokens(sql);
      if (!t.length) return null;
      this.t = t;
      this.p = 0;
      this.src = sql;
      const kw = this.up();
      this.checkPriv(kw);
      switch (kw) {
        case 'SELECT': return this.select();
        case 'SHOW': return this.show();
        case 'LOCK': case 'UNLOCK': return { affected: 0 };
        case 'REPLACE': return this.insert(true);
        case 'USE': { this.p++; const d = this.name(); if (!this.s.dbs[d]) this.err(1049, '42000', `Unknown database '${d}'`); this.sess.db = d; return { msg: 'Database changed', plain: true }; }
        case 'CREATE': return this.create();
        case 'DROP': return this.drop();
        case 'INSERT': return this.insert();
        case 'UPDATE': return this.update();
        case 'DELETE': return this.del();
        case 'DESC': case 'DESCRIBE': case 'EXPLAIN': { this.p++; return this.describe(this.name()); }
        case 'GRANT': return this.grant(true);
        case 'REVOKE': return this.grant(false);
        case 'FLUSH': return { affected: 0 };
        case 'ALTER': return this.alter();
        case 'TRUNCATE': { this.p++; if (this.up() === 'TABLE') this.p++; const tb = this.table(this.name()); const n = tb.rows.length; tb.rows = []; tb.ai = 1; return { affected: 0, n }; }
        case 'SET': case 'BEGIN': case 'COMMIT': case 'ROLLBACK': case 'START': return { affected: 0 };
        case 'RENAME': { this.p += 2; const a = this.name(); this.expectKw('TO'); const b = this.name(); const db = this.curDb(); db.tables[b] = db.tables[a]; delete db.tables[a]; return { affected: 0 }; }
        default: this.syntax(this.t[0].v);
      }
      return null;
    }

    /** MySQL 권한 검사: 일반 사용자는 GRANT 받은 DB 만 다룰 수 있다 */
    checkPriv(kw) {
      if (this.dialect === 'pg' || !this.sess.user) return;
      const u = this.findUser(this.sess.user, this.sess.host || 'localhost');
      if (!u) return;
      const all = u.grants.some((g) => g.on === '*.*' && /ALL/.test(g.priv));
      if (all || u.user === 'root') return;
      const dbOf = () => {
        // 문장에서 대상 DB 추정: CREATE/DROP DATABASE x, db.table, 현재 DB
        const w = this.up(1);
        if ((kw === 'CREATE' || kw === 'DROP' || kw === 'ALTER') && (w === 'DATABASE' || w === 'SCHEMA')) { let k = 2; while (this.up(k) === 'IF' || this.up(k) === 'NOT' || this.up(k) === 'EXISTS') k++; return this.t[this.p + k] ? String(this.t[this.p + k].v) : null; }
        for (let k = 0; k < this.t.length - 2; k++) if (this.t[k + 1].v === '.' && this.t[k].k === 'id' && this.t[k + 2].k === 'id') return String(this.t[k].v);
        return this.sess.db;
      };
      if (['SHOW', 'USE', 'SET', 'BEGIN', 'COMMIT', 'ROLLBACK', 'START', 'FLUSH', 'LOCK', 'UNLOCK', 'DESC', 'DESCRIBE', 'EXPLAIN'].includes(kw)) {
        if (kw === 'USE') { const d = this.t[this.p + 1] ? String(this.t[this.p + 1].v) : ''; if (d && this.s.dbs[d] && !this.dbAllowed(u, d)) this.err(1044, '42000', `Access denied for user '${u.user}'@'${u.host}' to database '${d}'`); }
        return;
      }
      if (kw === 'CREATE' && (this.up(1) === 'USER' || this.up(1) === 'ROLE') || kw === 'GRANT' || kw === 'REVOKE') this.err(1227, '42000', `Access denied; you need (at least one of) the CREATE USER privilege(s) for this operation`);
      const d = dbOf();
      if (d && !this.dbAllowed(u, d)) {
        if ((kw === 'CREATE' || kw === 'DROP') && (this.up(1) === 'DATABASE' || this.up(1) === 'SCHEMA')) this.err(1044, '42000', `Access denied for user '${u.user}'@'${u.host}' to database '${d}'`);
        this.err(1142, '42000', `${kw} command denied to user '${u.user}'@'${u.host}' for table '${d}'`);
      }
    }
    dbAllowed(u, d) { return u.grants.some((g) => g.on === '*.*' || g.on.split('.')[0] === d || (g.on.includes('%') && new RegExp('^' + g.on.split('.')[0].replace(/%/g, '.*') + '$').test(d))); }

    up(k = 0) { const x = this.t[this.p + k]; return x && x.k === 'id' ? x.up : x ? x.v : null; }
    isKw(w, k = 0) { return this.up(k) === w; }
    expectKw(w) { if (this.up() !== w) this.syntax(this.rest()); this.p++; }
    eat(v) { const x = this.t[this.p]; if (x && x.v === v) { this.p++; return true; } return false; }
    expect(v) { if (!this.eat(v)) this.syntax(this.rest()); }
    rest() { return this.t.slice(this.p).map((x) => (x.k === 'str' ? `'${x.v}'` : x.v)).join(' ').slice(0, 40); }
    name() {
      const x = this.t[this.p++];
      if (!x || (x.k !== 'id' && x.k !== 'dstr' && x.k !== 'str')) this.syntax(x ? x.v : '');
      let v = String(x.v);
      if (this.t[this.p] && this.t[this.p].v === '.' && this.t[this.p + 1] && this.t[this.p + 1].k === 'id') { this.p++; v += '.' + this.t[this.p++].v; }
      return this.dialect === 'pg' && x.k === 'id' ? v.toLowerCase() : v;
    }
    curDb() {
      const d = this.sess.db;
      if (!d) this.err(1046, '3D000', 'No database selected');
      return this.s.dbs[d];
    }
    table(name, noThrow) {
      let db = this.sess.db, tn = name;
      if (name.includes('.')) [db, tn] = name.split('.');
      if (!db) { if (noThrow) return null; this.err(1046, '3D000', 'No database selected'); }
      const d = this.s.dbs[db];
      if (!d) this.err(1049, '42000', `Unknown database '${db}'`);
      const tb = d.tables[tn];
      if (!tb && !noThrow) {
        if (this.dialect === 'pg') this.err(0, '42P01', `relation "${tn}" does not exist`);
        this.err(1146, '42S02', `Table '${db}.${tn}' doesn't exist`);
      }
      return tb;
    }
    userSpec() {
      const u = this.t[this.p++];
      if (!u) this.syntax('');
      let user = String(u.v), host = '%';
      if (u.k === 'id' && user.includes('@')) { [user, host] = user.split('@'); host = host || '%'; }
      const nx = this.t[this.p];
      if (nx && nx.k === 'id' && nx.v === '@') { this.p++; const h = this.t[this.p++]; host = h ? String(h.v) : '%'; }
      else if (nx && nx.k === 'id' && nx.v.startsWith('@')) { this.p++; host = nx.v.slice(1); }
      return { user, host };
    }

    // ---- SELECT
    select() {
      this.p++;
      let distinct = false;
      if (this.isKw('DISTINCT')) { this.p++; distinct = true; }
      const items = [];
      do {
        if (this.eat('*')) { items.push({ star: true }); continue; }
        const start = this.p;
        const e = this.expr();
        let alias = null;
        if (this.isKw('AS')) { this.p++; alias = String(this.t[this.p++].v); }
        else if (this.t[this.p] && (this.t[this.p].k === 'id' && !['FROM', 'WHERE', 'ORDER', 'LIMIT', 'GROUP', 'HAVING', 'OFFSET'].includes(this.up()) || this.t[this.p].k === 'str' || this.t[this.p].k === 'dstr')) alias = String(this.t[this.p++].v);
        const label = alias || this.t.slice(start, this.p).map((x) => (x.k === 'str' ? `'${x.v}'` : x.v)).join('').replace(/,/g, ', ').replace(/\s+/g, ' ');
        items.push({ e, label });
      } while (this.eat(','));
      let rows = [{}];
      let tb = null, tname = null;
      if (this.isKw('FROM')) {
        this.p++;
        tname = this.name();
        const alias = this.t[this.p] && this.t[this.p].k === 'id' && !['WHERE', 'ORDER', 'LIMIT', 'GROUP', 'JOIN', 'INNER', 'LEFT'].includes(this.up()) ? this.t[this.p++].v : null;
        void alias;
        if (/^mysql\.user$/i.test(tname)) {
          tb = { cols: [{ name: 'User' }, { name: 'Host' }, { name: 'plugin' }, { name: 'account_locked' }], rows: this.s.users.map((u) => ({ user: u.user, User: u.user, host: u.host, Host: u.host, plugin: u.plugin, account_locked: u.locked ? 'Y' : 'N', authentication_string: u.pass ? '$A$005$' + 'x'.repeat(20) : '' })) };
        } else if (/^pg_catalog\.pg_user$|^pg_user$/i.test(tname)) {
          tb = { cols: [{ name: 'usename' }], rows: this.s.users.map((u) => ({ usename: u.user })) };
        } else tb = this.table(tname);
        rows = tb.rows.map((r) => Object.assign({}, r));
      }
      if (this.isKw('WHERE')) { this.p++; const w = this.expr(); rows = rows.filter((r) => truthy(this.ev(w, r))); }
      let groupBy = null;
      if (this.isKw('GROUP')) { this.p += 2; groupBy = []; do groupBy.push(this.expr()); while (this.eat(',')); }
      let order = [];
      if (this.isKw('ORDER')) {
        this.p += 2;
        do { const e = this.expr(); let dir = 1; if (this.isKw('DESC')) { dir = -1; this.p++; } else if (this.isKw('ASC')) this.p++; order.push({ e, dir }); } while (this.eat(','));
      }
      let limit = null, offset = 0;
      if (this.isKw('LIMIT')) { this.p++; limit = this.t[this.p++].v; if (this.eat(',')) { offset = limit; limit = this.t[this.p++].v; } }
      if (this.isKw('OFFSET')) { this.p++; offset = this.t[this.p++].v; }
      // 열 목록
      let cols = [];
      items.forEach((it) => { if (it.star) (tb ? tb.cols : []).forEach((cl) => cols.push({ label: cl.name, e: { col: cl.name } })); else cols.push(it); });
      const hasAgg = cols.some((cl) => aggIn(cl.e));
      let out;
      if (groupBy || hasAgg) {
        const groups = new Map();
        rows.forEach((r) => { const k = groupBy ? JSON.stringify(groupBy.map((g) => this.ev(g, r))) : '_'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
        if (!groups.size && !groupBy) groups.set('_', []);
        out = [...groups.values()].map((g) => cols.map((cl) => this.ev(cl.e, g[0] || {}, g)));
        if (order.length) out.sort((a, b) => { for (const o of order) { const i = cols.findIndex((cl) => JSON.stringify(cl.e) === JSON.stringify(o.e) || (o.e.col && cl.label === o.e.col)); const x = i >= 0 ? a[i] : null, y = i >= 0 ? b[i] : null; const c = cmp(x, y); if (c) return c * o.dir; } return 0; });
      } else {
        if (order.length) rows.sort((a, b) => { for (const o of order) { const c = cmp(this.ev(o.e, a), this.ev(o.e, b)); if (c) return c * o.dir; } return 0; });
        out = rows.map((r) => cols.map((cl) => this.ev(cl.e, r)));
      }
      if (distinct) { const seen = new Set(); out = out.filter((r) => { const k = JSON.stringify(r); if (seen.has(k)) return false; seen.add(k); return true; }); }
      if (offset) out = out.slice(offset);
      if (limit != null) out = out.slice(0, limit);
      return { cols: cols.map((cl) => cl.label), rows: out };
    }

    // ---- 식
    expr() { return this.orE(); }
    orE() { let l = this.andE(); while (this.isKw('OR') || this.t[this.p] && this.t[this.p].v === '||' && this.dialect !== 'pg') { this.p++; l = { op: 'OR', l, r: this.andE() }; } return l; }
    andE() { let l = this.notE(); while (this.isKw('AND')) { this.p++; l = { op: 'AND', l, r: this.notE() }; } return l; }
    notE() { if (this.isKw('NOT')) { this.p++; return { op: 'NOT', l: this.notE() }; } return this.cmpE(); }
    cmpE() {
      let l = this.addE();
      for (;;) {
        const x = this.t[this.p];
        if (!x) return l;
        if (x.k === 'op' && ['=', '!=', '<>', '<', '>', '<=', '>='].includes(x.v)) { this.p++; l = { op: x.v, l, r: this.addE() }; continue; }
        if (this.isKw('LIKE') || (this.isKw('NOT') && this.isKw('LIKE', 1))) { const neg = this.isKw('NOT'); this.p += neg ? 2 : 1; l = { op: neg ? 'NOTLIKE' : 'LIKE', l, r: this.addE() }; continue; }
        if (this.isKw('IS')) { this.p++; const neg = this.isKw('NOT'); if (neg) this.p++; this.expectKw('NULL'); l = { op: neg ? 'NOTNULL' : 'ISNULL', l }; continue; }
        if (this.isKw('IN') || (this.isKw('NOT') && this.isKw('IN', 1))) { const neg = this.isKw('NOT'); this.p += neg ? 2 : 1; this.expect('('); const list = []; do list.push(this.addE()); while (this.eat(',')); this.expect(')'); l = { op: neg ? 'NOTIN' : 'IN', l, list }; continue; }
        if (this.isKw('BETWEEN')) { this.p++; const a = this.addE(); this.expectKw('AND'); const b = this.addE(); l = { op: 'BETWEEN', l, a, b }; continue; }
        return l;
      }
    }
    addE() { let l = this.mulE(); for (;;) { const x = this.t[this.p]; if (x && x.k === 'op' && (x.v === '+' || x.v === '-' || (x.v === '||' && this.dialect === 'pg'))) { this.p++; l = { op: x.v, l, r: this.mulE() }; } else return l; } }
    mulE() { let l = this.prim(); for (;;) { const x = this.t[this.p]; if (x && x.k === 'op' && ['*', '/', '%'].includes(x.v) && !(x.v === '*' && this.t[this.p - 1] && this.t[this.p - 1].v === '(')) { this.p++; l = { op: x.v, l, r: this.prim() }; } else return l; } }
    prim() {
      const x = this.t[this.p++];
      if (!x) this.syntax('');
      if (x.k === 'num') return { lit: x.v };
      if (x.k === 'str') return { lit: x.v };
      if (x.k === 'dstr') return this.dialect === 'pg' ? { col: x.v } : { lit: x.v };
      if (x.k === 'op' && x.v === '(') { const e = this.expr(); this.expect(')'); return e; }
      if (x.k === 'op' && x.v === '-') return { op: 'NEG', l: this.prim() };
      if (x.k === 'op' && x.v === '*') return { star: true };
      if (x.k === 'id') {
        if (x.up === 'NULL') return { lit: null };
        if (x.up === 'TRUE') return { lit: 1 };
        if (x.up === 'FALSE') return { lit: 0 };
        if (this.t[this.p] && this.t[this.p].v === '(') {
          this.p++;
          const args = [];
          let distinct = false;
          if (this.isKw('DISTINCT')) { this.p++; distinct = true; }
          if (!this.eat(')')) { do { if (this.eat('*')) args.push({ star: true }); else args.push(this.expr()); } while (this.eat(',')); this.expect(')'); }
          return { fn: x.up, args, distinct };
        }
        if (['CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_USER'].includes(x.up)) return { fn: x.up, args: [] };
        let name = x.v;
        if (this.t[this.p] && this.t[this.p].v === '.' && this.t[this.p + 1]) { this.p++; name = this.t[this.p++].v; }
        return { col: name };
      }
      this.syntax(x.v);
      return null;
    }
    ev(e, row, group) {
      if (!e) return null;
      if ('lit' in e) return e.lit;
      if (e.col != null) {
        if (e.col in row) return row[e.col];
        const k = Object.keys(row).find((c) => c.toLowerCase() === String(e.col).toLowerCase());
        if (k) return row[k];
        if (this.dialect === 'pg') this.err(0, '42703', `column "${e.col}" does not exist`);
        this.err(1054, '42S22', `Unknown column '${e.col}' in 'field list'`);
      }
      if (e.fn) {
        const a = (i) => this.ev(e.args[i], row, group);
        const g = group || [row];
        const vals = () => g.map((r) => this.ev(e.args[0], r)).filter((v) => v != null);
        const now = new Date(Date.now() + (this.tz || 0) * 60000);
        const pad = (n) => String(n).padStart(2, '0');
        switch (e.fn) {
          case 'COUNT': return e.args[0] && e.args[0].star ? g.length : e.distinct ? new Set(vals()).size : vals().length;
          case 'SUM': return vals().reduce((s, v) => s + (+v), 0);
          case 'AVG': { const v = vals(); return v.length ? +(v.reduce((s, x) => s + (+x), 0) / v.length).toFixed(4) : null; }
          case 'MIN': { const v = vals(); return v.length ? v.reduce((a2, b) => (cmp(a2, b) <= 0 ? a2 : b)) : null; }
          case 'MAX': { const v = vals(); return v.length ? v.reduce((a2, b) => (cmp(a2, b) >= 0 ? a2 : b)) : null; }
          case 'VERSION': return this.dialect === 'pg' ? 'PostgreSQL 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04) 13.3.0, 64-bit' : this.s.flavor === 'mariadb' ? '10.11.13-MariaDB-0ubuntu0.24.04.1' : '8.0.43-0ubuntu0.24.04.1';
          case 'NOW': case 'CURRENT_TIMESTAMP': case 'SYSDATE': return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
          case 'CURDATE': case 'CURRENT_DATE': return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
          case 'DATABASE': case 'CURRENT_DATABASE': case 'SCHEMA': return this.sess.db || null;
          case 'USER': case 'CURRENT_USER': case 'SESSION_USER': return this.dialect === 'pg' ? this.sess.user : `${this.sess.user}@${this.sess.host || 'localhost'}`;
          case 'UPPER': case 'UCASE': return a(0) == null ? null : String(a(0)).toUpperCase();
          case 'LOWER': case 'LCASE': return a(0) == null ? null : String(a(0)).toLowerCase();
          case 'LENGTH': case 'CHAR_LENGTH': return a(0) == null ? null : [...String(a(0))].length;
          case 'CONCAT': return e.args.map((x, i) => a(i)).join('');
          case 'ROUND': return +(+a(0)).toFixed(e.args[1] ? +a(1) : 0);
          case 'ABS': return Math.abs(+a(0));
          case 'IFNULL': case 'COALESCE': return e.args.map((x, i) => a(i)).find((v) => v != null) ?? null;
          case 'SUBSTRING': case 'SUBSTR': return String(a(0)).substr(+a(1) - 1, e.args[2] ? +a(2) : undefined);
          case 'RAND': case 'RANDOM': return Math.random();
          case 'SLEEP': return 0;
          default:
            if (this.dialect === 'pg') this.err(0, '42883', `function ${e.fn.toLowerCase()}() does not exist`);
            this.err(1305, '42000', `FUNCTION ${this.sess.db || 'mysql'}.${e.fn.toLowerCase()} does not exist`);
        }
      }
      const L = () => this.ev(e.l, row, group), R = () => this.ev(e.r, row, group);
      switch (e.op) {
        case 'OR': return truthy(L()) || truthy(R()) ? 1 : 0;
        case 'AND': return truthy(L()) && truthy(R()) ? 1 : 0;
        case 'NOT': return truthy(L()) ? 0 : 1;
        case 'NEG': return -L();
        case '=': { const a = L(), b = R(); return a == null || b == null ? null : (cmp(a, b) === 0 ? 1 : 0); }
        case '!=': case '<>': { const a = L(), b = R(); return a == null || b == null ? null : (cmp(a, b) !== 0 ? 1 : 0); }
        case '<': return cmp(L(), R()) < 0 ? 1 : 0;
        case '>': return cmp(L(), R()) > 0 ? 1 : 0;
        case '<=': return cmp(L(), R()) <= 0 ? 1 : 0;
        case '>=': return cmp(L(), R()) >= 0 ? 1 : 0;
        case 'LIKE': case 'NOTLIKE': {
          const re = new RegExp('^' + String(R()).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$', this.dialect === 'pg' ? '' : 'i');
          const r = re.test(String(L()));
          return (e.op === 'LIKE' ? r : !r) ? 1 : 0;
        }
        case 'ISNULL': return L() == null ? 1 : 0;
        case 'NOTNULL': return L() != null ? 1 : 0;
        case 'IN': case 'NOTIN': { const v = L(); const r = e.list.some((x) => cmp(v, this.ev(x, row, group)) === 0); return (e.op === 'IN' ? r : !r) ? 1 : 0; }
        case 'BETWEEN': { const v = L(); return cmp(v, this.ev(e.a, row)) >= 0 && cmp(v, this.ev(e.b, row)) <= 0 ? 1 : 0; }
        case '+': return +L() + +R();
        case '-': return +L() - +R();
        case '*': return +L() * +R();
        case '/': { const b = +R(); return b === 0 ? null : +(+L() / b).toFixed(4); }
        case '%': return +L() % +R();
        case '||': return String(L()) + String(R());
      }
      return null;
    }

    // ---- SHOW
    show() {
      this.p++;
      const w = this.up();
      if (w === 'DATABASES' || w === 'SCHEMAS') return { cols: ['Database'], rows: Object.keys(this.s.dbs).sort().map((d) => [d]) };
      if (w === 'TABLES') {
        this.p++;
        let dn = this.sess.db;
        if (this.isKw('FROM') || this.isKw('IN')) { this.p++; dn = this.name(); if (!this.s.dbs[dn]) this.err(1049, '42000', `Unknown database '${dn}'`); }
        const db = dn ? this.s.dbs[dn] : this.curDb();
        let like = null;
        if (this.isKw('LIKE')) { this.p++; like = this.t[this.p++].v; }
        const re = like ? new RegExp('^' + like.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i') : null;
        return { cols: [`Tables_in_${dn}`], rows: Object.keys(db.tables).sort().filter((x) => !re || re.test(x)).map((x) => [x]) };
      }
      if (w === 'GRANTS') {
        this.p++;
        let who = { user: this.sess.user, host: this.sess.host || 'localhost' };
        if (this.isKw('FOR')) { this.p++; who = this.userSpec(); }
        const u = this.findUser(who.user, who.host);
        if (!u) this.err(1141, '42000', `There is no such grant defined for user '${who.user}' on host '${who.host}'`);
        const rows = [[`GRANT USAGE ON *.* TO \`${u.user}\`@\`${u.host}\``]];
        u.grants.forEach((g) => { const [d, t] = g.on.split('.'); rows.push([`GRANT ${g.priv} ON ${d === '*' ? '*' : '`' + d + '`'}.${t === '*' ? '*' : '`' + t + '`'} TO \`${u.user}\`@\`${u.host}\`${g.grant ? ' WITH GRANT OPTION' : ''}`]); });
        if (u.user === 'root') rows.shift();
        return { cols: [`Grants for ${u.user}@${u.host}`], rows };
      }
      if (w === 'VARIABLES' || w === 'GLOBAL' || w === 'SESSION') {
        const vars = { bind_address: '127.0.0.1', port: 3306, version: '8.0.43-0ubuntu0.24.04.1', datadir: '/var/lib/mysql/', character_set_server: 'utf8mb4', max_connections: 151 };
        let like = null;
        while (this.t[this.p]) { if (this.isKw('LIKE')) { this.p++; like = this.t[this.p++].v; } else this.p++; }
        const re = like ? new RegExp('^' + like.replace(/%/g, '.*') + '$', 'i') : null;
        return { cols: ['Variable_name', 'Value'], rows: Object.entries(vars).filter(([k]) => !re || re.test(k)).map(([k, v]) => [k, v]) };
      }
      if (w === 'COLUMNS' || w === 'FIELDS') { this.p++; this.expectKw('FROM'); return this.describe(this.name()); }
      if (w === 'CREATE') { this.p++; if (this.isKw('TABLE')) { this.p++; const n = this.name(); const tb = this.table(n); return { cols: ['Table', 'Create Table'], rows: [[n, `CREATE TABLE \`${n}\` (\n${tb.cols.map((cl) => `  \`${cl.name}\` ${cl.type}${cl.notnull ? ' NOT NULL' : ''}${cl.auto ? ' AUTO_INCREMENT' : ''}`).join(',\n')}${tb.cols.some((cl) => cl.pk) ? `,\n  PRIMARY KEY (\`${tb.cols.find((cl) => cl.pk).name}\`)` : ''}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`]] }; } }
      if (w === 'PROCESSLIST') return { cols: ['Id', 'User', 'Host', 'db', 'Command', 'Time', 'State', 'Info'], rows: [[5, 'event_scheduler', 'localhost', null, 'Daemon', 812, 'Waiting on empty queue', null], [this.s.connId || 8, this.sess.user, 'localhost', this.sess.db || null, 'Query', 0, 'init', 'show processlist']] };
      if (w === 'STATUS') return { cols: ['Variable_name', 'Value'], rows: [['Uptime', 812], ['Threads_connected', 1], ['Questions', 12]] };
      this.syntax(this.rest());
      return null;
    }

    describe(name) {
      const tb = this.table(name);
      return { cols: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'], rows: tb.cols.map((cl) => [cl.name, cl.type.toLowerCase(), cl.notnull || cl.pk ? 'NO' : 'YES', cl.pk ? 'PRI' : cl.unique ? 'UNI' : '', cl.def != null ? cl.def : null, cl.auto ? 'auto_increment' : cl.defNow ? 'DEFAULT_GENERATED' : '']) };
    }

    // ---- CREATE
    create() {
      this.p++;
      if (this.isKw('OR')) this.p += 2;
      const w = this.up();
      if (w === 'DATABASE' || w === 'SCHEMA') {
        this.p++;
        let ifne = false;
        if (this.isKw('IF')) { this.p += 3; ifne = true; }
        const n = this.name();
        if (this.s.dbs[n]) { if (ifne) return { affected: 1, warn: 1 }; if (this.dialect === 'pg') this.err(0, '42P04', `database "${n}" already exists`); this.err(1007, 'HY000', `Can't create database '${n}'; database exists`); }
        let owner = this.sess.user;
        while (this.t[this.p]) { if (this.isKw('OWNER')) { this.p++; this.eat('='); owner = this.name(); } else this.p++; }
        this.s.dbs[n] = { tables: {}, owner };
        return this.dialect === 'pg' ? { tag: 'CREATE DATABASE' } : { affected: 1 };
      }
      if (w === 'USER' || w === 'ROLE') {
        this.p++;
        let ifne = false;
        if (this.isKw('IF')) { this.p += 3; ifne = true; }
        const spec = this.dialect === 'pg' ? { user: this.name(), host: '%' } : this.userSpec();
        let pass = null;
        while (this.t[this.p]) {
          if (this.isKw('BY') || this.isKw('PASSWORD')) { this.p++; pass = this.t[this.p++].v; }
          else this.p++;
        }
        if (this.findUser(spec.user, spec.host, true)) {
          if (ifne) return { affected: 0 };
          if (this.dialect === 'pg') this.err(0, '42710', `role "${spec.user}" already exists`);
          this.err(1396, 'HY000', `Operation CREATE USER failed for '${spec.user}'@'${spec.host}'`);
        }
        this.s.users.push({ user: spec.user, host: spec.host, plugin: 'caching_sha2_password', pass, grants: [], login: w === 'USER' });
        return this.dialect === 'pg' ? { tag: 'CREATE ROLE' } : { affected: 0 };
      }
      if (w === 'TABLE') {
        this.p++;
        let ifne = false;
        if (this.isKw('IF')) { this.p += 3; ifne = true; }
        const n = this.name();
        let dbName = this.sess.db, tn = n;
        if (n.includes('.')) [dbName, tn] = n.split('.');
        if (this.dialect === 'pg' && !dbName) dbName = 'postgres';
        if (!dbName) this.err(1046, '3D000', 'No database selected');
        const db = this.s.dbs[dbName];
        if (db.tables[tn]) { if (ifne) return { affected: 0 }; if (this.dialect === 'pg') this.err(0, '42P07', `relation "${tn}" already exists`); this.err(1050, '42S01', `Table '${tn}' already exists`); }
        this.expect('(');
        const cols = [];
        let depth = 0;
        for (;;) {
          if (this.isKw('PRIMARY')) { this.p += 2; this.expect('('); const k = this.name(); this.expect(')'); const cl = cols.find((x) => x.name === k); if (cl) cl.pk = true; }
          else if (this.isKw('UNIQUE') || this.isKw('KEY') || this.isKw('INDEX') || this.isKw('FOREIGN') || this.isKw('CONSTRAINT')) { while (this.t[this.p] && !(this.t[this.p].v === ',' && depth === 0) && !(this.t[this.p].v === ')' && depth === 0)) { if (this.t[this.p].v === '(') depth++; if (this.t[this.p].v === ')') depth--; this.p++; } }
          else {
            const cn = this.name();
            let type = '';
            while (this.t[this.p] && !(this.t[this.p].v === ',' && depth === 0) && !(this.t[this.p].v === ')' && depth === 0)) {
              const x = this.t[this.p++];
              if (x.v === '(') depth++;
              if (x.v === ')') depth--;
              type += (x.k === 'str' ? `'${x.v}'` : x.v) + (x.v === '(' || (this.t[this.p] && this.t[this.p].v === ')') || (this.t[this.p] && this.t[this.p].v === '(') ? '' : ' ');
            }
            const T = type.toUpperCase();
            const cl = { name: cn, type: type.replace(/\s+(PRIMARY KEY|NOT NULL|NULL|AUTO_INCREMENT|DEFAULT .*|UNIQUE|REFERENCES .*)/ig, '').trim() || 'text' };
            if (/PRIMARY KEY/.test(T)) cl.pk = true;
            if (/AUTO_INCREMENT|SERIAL/.test(T)) cl.auto = true;
            if (/SERIAL/.test(T)) cl.type = 'integer';
            if (/NOT NULL/.test(T)) cl.notnull = true;
            if (/UNIQUE/.test(T)) cl.unique = true;
            const dm = /DEFAULT\s+('([^']*)'|(\S+))/i.exec(type);
            if (dm) { if (/CURRENT_TIMESTAMP|NOW/i.test(dm[1])) cl.defNow = true; else cl.def = dm[2] != null ? dm[2] : isNaN(+dm[3]) ? dm[3] : +dm[3]; }
            cols.push(cl);
          }
          if (this.eat(',')) continue;
          this.expect(')');
          break;
        }
        db.tables[tn] = { cols, rows: [], ai: 1, owner: this.sess.user };
        return this.dialect === 'pg' ? { tag: 'CREATE TABLE' } : { affected: 0 };
      }
      if (w === 'INDEX' || w === 'UNIQUE' || w === 'VIEW') return this.dialect === 'pg' ? { tag: 'CREATE INDEX' } : { affected: 0 };
      this.syntax(this.rest());
      return null;
    }

    drop() {
      this.p++;
      const w = this.up();
      this.p++;
      let ifx = false;
      if (this.isKw('IF')) { this.p += 2; ifx = true; }
      if (w === 'DATABASE' || w === 'SCHEMA') {
        const n = this.name();
        if (!this.s.dbs[n]) { if (ifx) return { affected: 0 }; if (this.dialect === 'pg') this.err(0, '3D000', `database "${n}" does not exist`); this.err(1008, 'HY000', `Can't drop database '${n}'; database doesn't exist`); }
        if (this.s.dbs[n].sys) this.err(3552, 'HY000', `Access to system schema '${n}' is rejected.`);
        const cnt = Object.keys(this.s.dbs[n].tables).length;
        delete this.s.dbs[n];
        if (this.sess.db === n) this.sess.db = null;
        return this.dialect === 'pg' ? { tag: 'DROP DATABASE' } : { affected: cnt };
      }
      if (w === 'TABLE') {
        const n = this.name();
        const tb = this.table(n, ifx);
        if (!tb) return { affected: 0 };
        const db = n.includes('.') ? this.s.dbs[n.split('.')[0]] : this.curDb();
        delete db.tables[n.split('.').pop()];
        return this.dialect === 'pg' ? { tag: 'DROP TABLE' } : { affected: 0 };
      }
      if (w === 'USER' || w === 'ROLE') {
        const spec = this.dialect === 'pg' ? { user: this.name(), host: '%' } : this.userSpec();
        const i = this.s.users.findIndex((u) => u.user === spec.user && (this.dialect === 'pg' || u.host === spec.host));
        if (i < 0) { if (ifx) return { affected: 0 }; if (this.dialect === 'pg') this.err(0, '42704', `role "${spec.user}" does not exist`); this.err(1396, 'HY000', `Operation DROP USER failed for '${spec.user}'@'${spec.host}'`); }
        this.s.users.splice(i, 1);
        return this.dialect === 'pg' ? { tag: 'DROP ROLE' } : { affected: 0 };
      }
      this.syntax(this.rest());
      return null;
    }

    alter() {
      this.p++;
      const w = this.up();
      this.p++;
      if (w === 'USER' || w === 'ROLE') {
        const spec = this.dialect === 'pg' ? { user: this.name(), host: '%' } : this.userSpec();
        const u = this.findUser(spec.user, spec.host, true);
        if (!u) { if (this.dialect === 'pg') this.err(0, '42704', `role "${spec.user}" does not exist`); this.err(1396, 'HY000', `Operation ALTER USER failed for '${spec.user}'@'${spec.host}'`); }
        while (this.t[this.p]) {
          if (this.isKw('BY') || this.isKw('PASSWORD')) { this.p++; u.pass = this.t[this.p++].v; if (u.plugin === 'auth_socket' || u.plugin === 'unix_socket') u.plugin = 'caching_sha2_password'; }
          else if (this.isKw('WITH') && this.t[this.p + 1] && /_password|auth_socket/.test(this.t[this.p + 1].v)) { this.p++; u.plugin = this.t[this.p++].v; }
          else this.p++;
        }
        return this.dialect === 'pg' ? { tag: 'ALTER ROLE' } : { affected: 0 };
      }
      if (w === 'TABLE') {
        const n = this.name();
        const tb = this.table(n);
        if (this.isKw('ADD')) { this.p++; if (this.isKw('COLUMN')) this.p++; const cn = this.name(); const type = this.t.slice(this.p).map((x) => x.v).join(' '); tb.cols.push({ name: cn, type }); tb.rows.forEach((r) => { r[cn] = null; }); }
        else if (this.isKw('DROP')) { this.p++; if (this.isKw('COLUMN')) this.p++; const cn = this.name(); tb.cols = tb.cols.filter((cl) => cl.name !== cn); tb.rows.forEach((r) => { delete r[cn]; }); }
        return this.dialect === 'pg' ? { tag: 'ALTER TABLE' } : { affected: tb.rows.length, info: `Records: ${tb.rows.length}  Duplicates: 0  Warnings: 0` };
      }
      if (w === 'DATABASE') return this.dialect === 'pg' ? { tag: 'ALTER DATABASE' } : { affected: 1 };
      this.syntax(this.rest());
      return null;
    }

    findUser(user, host, exact) {
      if (this.dialect === 'pg') return this.s.users.find((u) => u.user === user);
      return this.s.users.find((u) => u.user === user && (u.host === host || (!exact && (u.host === '%' || (host === '127.0.0.1' && u.host === 'localhost')))));
    }

    grant(isGrant) {
      this.p++;
      const privs = [];
      while (this.t[this.p] && !this.isKw('ON')) { privs.push(this.t[this.p].v); this.p++; }
      this.expectKw('ON');
      let on;
      if (this.dialect === 'pg') {
        let kind = 'TABLE';
        if (this.isKw('DATABASE') || this.isKw('SCHEMA') || this.isKw('ALL') || this.isKw('TABLE')) { kind = this.up(); this.p++; if (kind === 'ALL') { this.p += 3; } }
        on = `${kind}:${this.name()}`;
      } else {
        let d = String(this.t[this.p++].v);
        this.expect('.');
        const tb = String(this.t[this.p++].v);
        on = `${d}.${tb}`;
        if (d !== '*' && !this.s.dbs[d] && isGrant) { /* MySQL 은 없는 DB 에도 권한 부여 가능 */ }
      }
      if (isGrant) this.expectKw('TO'); else this.expectKw('FROM');
      const spec = this.dialect === 'pg' ? { user: this.name(), host: '%' } : this.userSpec();
      const u = this.findUser(spec.user, spec.host, true);
      if (!u) {
        if (this.dialect === 'pg') this.err(0, '42704', `role "${spec.user}" does not exist`);
        this.err(1410, '42000', 'You are not allowed to create a user with GRANT');
      }
      const priv = privs.join(' ').toUpperCase().replace(/^ALL$/, 'ALL PRIVILEGES').replace(/\s*,\s*/g, ', ');
      const withGrant = this.isKw('WITH');
      if (isGrant) { u.grants = u.grants.filter((g) => g.on !== on); u.grants.push({ priv, on, grant: withGrant }); }
      else u.grants = u.grants.filter((g) => g.on !== on);
      return this.dialect === 'pg' ? { tag: isGrant ? 'GRANT' : 'REVOKE' } : { affected: 0 };
    }

    // ---- INSERT · UPDATE · DELETE
    insert(replace) {
      this.p++;
      let ignore = false;
      if (this.isKw('IGNORE')) { this.p++; ignore = true; }
      if (this.isKw('INTO')) this.p++;
      const n = this.name();
      const tb = this.table(n);
      let cols = tb.cols.map((cl) => cl.name);
      if (this.eat('(')) { cols = []; do cols.push(this.name()); while (this.eat(',')); this.expect(')'); }
      if (!this.isKw('VALUES') && !this.isKw('VALUE')) this.syntax(this.rest());
      this.p++;
      let count = 0, dup = 0;
      do {
        this.expect('(');
        const vals = [];
        do vals.push(this.ev(this.expr(), {})); while (this.eat(','));
        this.expect(')');
        if (vals.length !== cols.length) this.err(1136, '21S01', `Column count doesn't match value count at row ${count + 1}`);
        const row = {};
        tb.cols.forEach((cl) => {
          const i = cols.indexOf(cl.name);
          let v = i >= 0 ? vals[i] : undefined;
          if ((v === undefined || v === null) && cl.auto) { v = tb.ai; }
          if (v === undefined) v = cl.defNow ? this.ev({ fn: 'NOW', args: [] }, {}) : cl.def != null ? cl.def : null;
          if (v == null && (cl.notnull || cl.pk) && !cl.auto) this.err(1364, 'HY000', `Field '${cl.name}' doesn't have a default value`);
          if (/INT/i.test(cl.type) && v != null && v !== '') v = Math.trunc(+v);
          row[cl.name] = v;
        });
        const pk = tb.cols.find((cl) => cl.pk);
        const dupIdx = pk ? tb.rows.findIndex((r) => r[pk.name] === row[pk.name]) : -1;
        if (dupIdx >= 0) {
          if (replace) { tb.rows.splice(dupIdx, 1); count++; }
          else if (ignore) { dup++; continue; }
          else {
            if (this.dialect === 'pg') this.err(0, '23505', `duplicate key value violates unique constraint "${n}_pkey"`);
            this.err(1062, '23000', `Duplicate entry '${row[pk.name]}' for key '${n}.PRIMARY'`);
          }
        }
        const auto = tb.cols.find((cl) => cl.auto);
        if (auto) tb.ai = Math.max(tb.ai, (+row[auto.name] || 0) + 1);
        tb.rows.push(row);
        count++;
      } while (this.eat(','));
      if (this.dialect === 'pg') return { tag: `INSERT 0 ${count}` };
      return { affected: count, warn: dup ? 1 : 0, info: count + dup > 1 || dup ? `Records: ${count + dup}  Duplicates: ${dup}  Warnings: ${dup}` : null };
    }
    update() {
      this.p++;
      const tb = this.table(this.name());
      this.expectKw('SET');
      const sets = [];
      do { const cn = this.name(); this.expect('='); sets.push([cn, this.expr()]); } while (this.eat(','));
      let w = null;
      if (this.isKw('WHERE')) { this.p++; w = this.expr(); }
      let n = 0;
      tb.rows.forEach((r) => { if (!w || truthy(this.ev(w, r))) { sets.forEach(([k, e]) => { r[k] = this.ev(e, r); }); n++; } });
      return this.dialect === 'pg' ? { tag: `UPDATE ${n}` } : { affected: n, info: `Rows matched: ${n}  Changed: ${n}  Warnings: 0` };
    }
    del() {
      this.p++;
      this.expectKw('FROM');
      const tb = this.table(this.name());
      let w = null;
      if (this.isKw('WHERE')) { this.p++; w = this.expr(); }
      const before = tb.rows.length;
      tb.rows = tb.rows.filter((r) => w && !truthy(this.ev(w, r)));
      return this.dialect === 'pg' ? { tag: `DELETE ${before - tb.rows.length}` } : { affected: before - tb.rows.length };
    }
  }
  function truthy(v) { return v != null && v !== 0 && v !== '0' && v !== false && v !== ''; }
  function cmp(a, b) {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    const na = +a, nb = +b;
    if (!isNaN(na) && !isNaN(nb) && a !== '' && b !== '') return na - nb;
    return String(a).localeCompare(String(b));
  }
  function aggIn(e) { if (!e) return false; if (e.fn && ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'].includes(e.fn)) return true; return aggIn(e.l) || aggIn(e.r); }
  LX.SqlEngine = SqlEngine;

  /** 세미콜론으로 문장 나누기 (따옴표 안 무시) */
  function splitSql(src) {
    const out = [];
    let cur = '', q = null;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (q) { cur += c; if (c === '\\') { cur += src[++i] || ''; continue; } if (c === q) q = null; continue; }
      if (c === "'" || c === '"' || c === '`') { q = c; cur += c; continue; }
      if (c === '-' && src[i + 1] === '-') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === ';') { out.push({ sql: cur, term: ';' }); cur = ''; continue; }
      if (c === '\\' && (src[i + 1] === 'G' || src[i + 1] === 'g')) { out.push({ sql: cur, term: '\\' + src[i + 1] }); cur = ''; i++; continue; }
      cur += c;
    }
    return { stmts: out.filter((s) => s.sql.trim()), rest: cur, inQuote: !!q };
  }

  // ======================================================================= 출력 형식
  function fmtVal(v) { return v == null ? 'NULL' : typeof v === 'number' && !Number.isInteger(v) ? String(+v.toFixed(4)) : String(v); }
  function mysqlTable(res) {
    const cols = res.cols;
    const rows = res.rows.map((r) => r.map(fmtVal));
    const w = cols.map((cl, i) => Math.max(LX.visLen(cl), ...rows.map((r) => LX.visLen(r[i]))));
    const line = '+' + w.map((x) => '-'.repeat(x + 2)).join('+') + '+\n';
    const pad = (s, n, right) => (right ? ' '.repeat(n - LX.visLen(s)) + s : s + ' '.repeat(n - LX.visLen(s)));
    const isNum = cols.map((cl, i) => res.rows.length && res.rows.every((r) => r[i] == null || typeof r[i] === 'number'));
    let out = line + '| ' + cols.map((cl, i) => pad(cl, w[i])).join(' | ') + ' |\n' + line;
    rows.forEach((r) => { out += '| ' + r.map((v, i) => pad(v, w[i], isNum[i])).join(' | ') + ' |\n'; });
    out += line;
    return out;
  }
  function mysqlVertical(res) {
    const w = Math.max(...res.cols.map((c) => c.length));
    return res.rows.map((r, k) => `*************************** ${k + 1}. row ***************************\n` + res.cols.map((cl, i) => `${cl.padStart(w)}: ${fmtVal(r[i])}`).join('\n') + '\n').join('');
  }
  function psqlTable(res) {
    const cols = res.cols.map((c) => String(c).toLowerCase());
    const rows = res.rows.map((r) => r.map((v) => (v == null ? '' : fmtVal(v))));
    const w = cols.map((cl, i) => Math.max(LX.visLen(cl), ...rows.map((r) => LX.visLen(r[i]))));
    const center = (s, n) => { const l = Math.floor((n - LX.visLen(s)) / 2); return ' '.repeat(l) + s + ' '.repeat(n - LX.visLen(s) - l); };
    const isNum = cols.map((cl, i) => res.rows.length && res.rows.every((r) => r[i] == null || typeof r[i] === 'number'));
    let out = ' ' + cols.map((cl, i) => center(cl, w[i])).join(' | ') + ' \n';
    out += w.map((x) => '-'.repeat(x + 2)).join('+') + '\n';
    rows.forEach((r) => { out += ' ' + r.map((v, i) => (isNum[i] ? ' '.repeat(w[i] - LX.visLen(v)) + v : v + ' '.repeat(w[i] - LX.visLen(v)))).join(' | ') + ' \n'; });
    out += `(${rows.length} row${rows.length === 1 ? '' : 's'})\n\n`;
    return out;
  }

  // ======================================================================= mysql 클라이언트
  function mysqlStore(m) { return m.state.db.mysql; }
  function mysqlRunning(m) { return ['mysql', 'mariadb'].some((s) => m.state.services[s] && m.state.services[s].active); }

  function mysqlConnect(c, o) {
    const m = c.m;
    const st = mysqlStore(m);
    const maria = st && st.flavor === 'mariadb';
    if (!st || !mysqlRunning(m)) {
      if (o.host && o.host !== 'localhost') return { err: `ERROR 2003 (HY000): Can't connect to MySQL server on '${o.host}:3306' (111)` };
      return { err: `ERROR 2002 (HY000): Can't connect to local MySQL server through socket '/var/run/mysqld/mysqld.sock' (2)` };
    }
    let host = o.host || 'localhost';
    if (host !== 'localhost') {
      const conn = LX.tcpConnect(c, host, 3306);
      if (!conn.ok) return { err: conn.err === 'timeout' ? `ERROR 2003 (HY000): Can't connect to MySQL server on '${host}:3306' (110)` : `ERROR 2003 (HY000): Can't connect to MySQL server on '${host}:3306' (111)` };
      host = c.sh.fromOutside ? '10.0.2.2' : '127.0.0.1';
      if (c.sh.fromOutside) host = '10.0.2.2';
    }
    const user = o.user || c.cred.name;
    const cand = st.users.filter((u) => u.user === user && (u.host === host || u.host === '%' || (host === '127.0.0.1' && u.host === 'localhost') || (u.host.includes('%') && new RegExp('^' + u.host.replace(/\./g, '\\.').replace(/%/g, '.*') + '$').test(host))));
    const u = cand[0];
    const deny = () => ({ err: `ERROR 1045 (28000): Access denied for user '${user}'@'${host}' (using password: ${o.pass ? 'YES' : 'NO'})` });
    if (!u) return host === 'localhost' || host === '127.0.0.1' ? (o.pass != null ? deny() : { err: `ERROR 1045 (28000): Access denied for user '${user}'@'${host}' (using password: NO)` }) : { err: `ERROR 1130 (HY000): Host '${host}' is not allowed to connect to this ${maria ? 'MariaDB' : 'MySQL'} server` };
    if (u.plugin === 'auth_socket' || u.plugin === 'unix_socket') {
      if (c.cred.name !== user || host !== 'localhost') return { err: maria ? `ERROR 1698 (28000): Access denied for user '${user}'@'localhost'` : `ERROR 1698 (28000): Access denied for user '${user}'@'localhost'` };
    } else if ((u.pass || null) !== (o.pass || null)) return deny();
    return { user: u.user, host: u.host === '%' ? host : u.host, store: st, maria };
  }

  function sqlErr(e, maria) {
    if (e instanceof SqlError) return `ERROR ${e.code} (${e.state}): ${e.message}`;
    if (/unterminated/.test(e.message)) return `ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your ${maria ? 'MariaDB' : 'MySQL'} server version for the right syntax to use near '' at line 1`;
    return `ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your ${maria ? 'MariaDB' : 'MySQL'} server version for the right syntax to use ${e.message} at line 1`;
  }

  /** 문장 여러 개 실행 (배치 모드: -e, 파이프) */
  function mysqlBatch(c, eng, text, o) {
    const { stmts, rest } = splitSql(text);
    if (rest.trim()) stmts.push({ sql: rest, term: ';' });   // -e "SHOW DATABASES" 처럼 ; 가 없어도 실행
    let st = 0;
    for (const s of stmts) {
      try {
        const r = eng.exec(s.sql);
        if (r && r.cols) {
          if (o.table || (c.tty && !o.batch)) c.out(s.term === '\\G' ? mysqlVertical(r) : mysqlTable(r));
          else {
            if (!o.skipNames) c.out(r.cols.join('\t') + '\n');
            r.rows.forEach((row) => c.out(row.map(fmtVal).join('\t') + '\n'));
          }
        }
      } catch (e) {
        c.err(sqlErr(e, o.maria).replace(/^ERROR (\d+) \(([\w]+)\)/, `ERROR $1 ($2) at line ${stmts.indexOf(s) + 1}`) + '\n');
        st = 1;
        break;
      }
    }
    return st;
  }

  class MysqlRepl {
    constructor(c, eng, conn) {
      this.c = c; this.eng = eng; this.conn = conn; this.buffer = '';
      this.m = c.m;
      this.cred = c.cred;
      this.maria = conn.maria;
    }
    prompt() {
      if (this.buffer) return '    -> ';
      if (this.maria) return `MariaDB [${this.eng.sess.db || '(none)'}]> `;
      return 'mysql> ';
    }
    async input(line, io) {
      const trimmed = line.trim();
      if (!this.buffer && /^(exit|quit|\\q)\s*;?$/i.test(trimmed)) { io.out('Bye\n'); throw new LX.sig.ExitSig(0); }
      if (!this.buffer && /^(\\h|help|\?)\s*;?$/i.test(trimmed)) { io.out('\nList of all MySQL commands:\nNote that all text commands must be first on line and end with \';\'\n?         (\\?) Synonym for `help\'.\nclear     (\\c) Clear the current input statement.\nexit      (\\q) Exit mysql. Same as quit.\nuse       (\\u) Use another database. Takes database name as argument.\n\n'); return 'done'; }
      if (/\\c\s*$/.test(line)) { this.buffer = ''; return 'done'; }
      if (!this.buffer && /^use\s+\S+\s*;?$/i.test(trimmed)) line = trimmed.replace(/;?$/, ';');
      const text = this.buffer ? this.buffer + '\n' + line : line;
      const { stmts, rest } = splitSql(text);
      this.buffer = rest.trim() ? rest : '';
      for (const s of stmts) {
        const t0 = Date.now();
        try {
          const r = this.eng.exec(s.sql);
          const secs = `(${((Date.now() - t0) / 1000 + 0.001).toFixed(2)} sec)`;
          if (!r) continue;
          if (r.msg) { io.out(r.msg + '\n'); continue; }
          if (r.cols) {
            if (!r.rows.length) io.out(`Empty set ${secs}\n\n`);
            else io.out((s.term === '\\G' ? mysqlVertical(r) : mysqlTable(r)) + `${r.rows.length} row${r.rows.length > 1 ? 's' : ''} in set ${secs}\n\n`);
          } else io.out(`Query OK, ${r.affected || 0} row${r.affected === 1 ? '' : 's'} affected${r.warn ? ', 1 warning' : ''} ${secs}\n${r.info ? r.info + '\n' : ''}\n`);
          this.m.saveSoon();
        } catch (e) {
          io.err(sqlErr(e, this.maria) + '\n');
        }
      }
      return this.buffer ? 'more' : 'done';
    }
  }

  function parseMysqlArgs(args) {
    const o = { user: null, pass: null, host: null, db: null, exec: null, table: false, skipNames: false, askPass: false };
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-u' || a === '--user') o.user = args[++i];
      else if (/^-u.+/.test(a)) o.user = a.slice(2);
      else if (a.startsWith('--user=')) o.user = a.slice(7);
      else if (a === '-p' || a === '--password') o.askPass = true;
      else if (/^-p.+/.test(a)) o.pass = a.slice(2);
      else if (a.startsWith('--password=')) o.pass = a.slice(11);
      else if (a === '-h' || a === '--host') o.host = args[++i];
      else if (/^-h.+/.test(a)) o.host = a.slice(2);
      else if (a.startsWith('--host=')) o.host = a.slice(7);
      else if (a === '-e' || a === '--execute') o.exec = args[++i];
      else if (a === '-t' || a === '--table') o.table = true;
      else if (a === '-N' || a === '--skip-column-names') o.skipNames = true;
      else if (/^-[NBst]+$/.test(a)) { if (a.includes('N')) o.skipNames = true; if (a.includes('B') || a.includes('s')) o.batch = true; if (a.includes('t')) o.table = true; }
      else if (a === '-B' || a === '--batch' || a === '-s' || a === '--silent') o.batch = true;
      else if (a === '--databases') o.databases = true;
      else if (a === '-P' || a === '--port') i++;
      else if (a === '-D' || a === '--database') o.db = args[++i];
      else if (a === '-V' || a === '--version') o.version = true;
      else if (!a.startsWith('-')) o.db = a;
    }
    if (o.host === 'localhost') o.host = null;
    return o;
  }

  def(['mysql', 'mariadb'], async (c) => {
    const o = parseMysqlArgs(c.args);
    const m = c.m;
    const st0 = mysqlStore(m);
    if (o.version) { c.out(st0 && st0.flavor === 'mariadb' ? 'mysql from 11.4.x-MariaDB, client 15.2 for debian-linux-gnu (x86_64) using  EditLine wrapper\n' : 'mysql  Ver 8.0.43-0ubuntu0.24.04.1 for Linux on x86_64 ((Ubuntu))\n'); return 0; }
    if (o.askPass) o.pass = await c.session.requestLine('Enter password: ', { secret: true, answer: c.session.headless ? (o.headlessPass || '') : undefined });
    const conn = mysqlConnect(c, o);
    if (conn.err) { c.err(conn.err + '\n'); return 1; }
    const eng = new SqlEngine(conn.store, 'mysql', { user: conn.user, host: conn.host, db: null });
    eng.tz = LX.tzOffsetMin(m);
    if (o.db) {
      if (!conn.store.dbs[o.db]) { c.err(`ERROR 1049 (42000): Unknown database '${o.db}'\n`); return 1; }
      eng.sess.db = o.db;
    }
    const bo = { table: o.table, skipNames: o.skipNames, batch: o.batch, maria: conn.maria };
    if (o.exec != null) { const r = mysqlBatch(c, eng, o.exec, bo); m.saveSoon(); return r; }
    if (c.stdin) { const r = mysqlBatch(c, eng, c.stdin.readAll(), bo); m.saveSoon(); return r; }
    if (!LX.canPush(c)) return 0;
    conn.store.connId = (conn.store.connId || 8) + 1;
    c.out(conn.maria
      ? `Welcome to the MariaDB monitor.  Commands end with ; or \\g.\nYour MariaDB connection id is ${conn.store.connId}\nServer version: 10.11.13-MariaDB-0ubuntu0.24.04.1 Ubuntu 24.04\n\nCopyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.\n\nType 'help;' or '\\h' for help. Type '\\c' to clear the current input statement.\n\n`
      : `Welcome to the MySQL monitor.  Commands end with ; or \\g.\nYour MySQL connection id is ${conn.store.connId}\nServer version: 8.0.43-0ubuntu0.24.04.1 (Ubuntu)\n\nCopyright (c) 2000, 2025, Oracle and/or its affiliates.\n\nOracle is a registered trademark of Oracle Corporation and/or its\naffiliates. Other names may be trademarks of their respective\nowners.\n\nType 'help;' or '\\h' for help. Type '\\c' to clear the current input statement.\n\n`);
    c.session.pushRepl(new MysqlRepl(c, eng, conn));
    return 0;
  });

  def(['mysqldump', 'mariadb-dump'], async (c) => {
    const o = parseMysqlArgs(c.args);
    if (o.askPass) o.pass = await c.session.requestLine('Enter password: ', { secret: true });
    const conn = mysqlConnect(c, o);
    if (conn.err) { c.err(`mysqldump: Got error: ${conn.err.replace(/^ERROR /, '')} when trying to connect\n`); return 2; }
    const dbn = o.db;
    const all = c.args.includes('--all-databases') || c.args.includes('-A');
    const posArgs = c.args.filter((a, i) => !a.startsWith('-') && !/^-(u|p|h|P|e|D)$/.test(c.args[i - 1] || ''));
    const names = all ? Object.keys(conn.store.dbs).filter((d) => !conn.store.dbs[d].sys) : o.databases ? posArgs : [dbn];
    const missing = names.find((d) => !d || !conn.store.dbs[d]);
    if (!all && (missing !== undefined || !names.length)) { c.err(`mysqldump: Got error: 1049: Unknown database '${missing || dbn || ''}' when selecting the database\n`); return 2; }
    const onlyTables = !all && !o.databases && posArgs.length > 1 ? posArgs.slice(1) : null;
    const isMaria = !!(c.m.state.services && c.m.state.services.mariadb) && !(c.m.state.services && c.m.state.services.mysql && c.m.state.services.mysql.active);
    let out = isMaria ? `-- MariaDB dump 10.19-11.8.3-MariaDB, for debian-linux-gnu (x86_64)\n--\n-- Host: localhost    Database: ${all ? '' : dbn}\n-- ------------------------------------------------------\n-- Server version\t11.8.3-MariaDB-ubu2404\n` : `-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)\n--\n-- Host: localhost    Database: ${all ? '' : dbn}\n-- ------------------------------------------------------\n-- Server version\t8.0.43-0ubuntu0.24.04.1\n\n/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;\n/*!50503 SET NAMES utf8mb4 */;\n\n`;
    const dv = (cl) => (cl.def == null ? '' : typeof cl.def === 'number' ? ` DEFAULT ${cl.def}` : ` DEFAULT '${String(cl.def).replace(/'/g, "\\'")}'`) + (cl.defNow ? ' DEFAULT CURRENT_TIMESTAMP' : '');
    for (const dn of names) {
      if (all || o.databases) out += `--\n-- Current Database: \`${dn}\`\n--\n\nCREATE DATABASE /*!32312 IF NOT EXISTS*/ \`${dn}\` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;\n\nUSE \`${dn}\`;\n\n`;
      for (const [tn, tb] of Object.entries(conn.store.dbs[dn].tables)) {
        if (onlyTables && !onlyTables.includes(tn)) continue;
        out += `--\n-- Table structure for table \`${tn}\`\n--\n\nDROP TABLE IF EXISTS \`${tn}\`;\nCREATE TABLE \`${tn}\` (\n${tb.cols.map((cl) => `  \`${cl.name}\` ${cl.type}${cl.notnull ? ' NOT NULL' : ''}${dv(cl)}${cl.auto ? ' AUTO_INCREMENT' : ''}${cl.pk ? ' PRIMARY KEY' : ''}`).join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
        if (tb.rows.length) out += `--\n-- Dumping data for table \`${tn}\`\n--\n\nLOCK TABLES \`${tn}\` WRITE;\nINSERT INTO \`${tn}\` VALUES ${tb.rows.map((r) => '(' + tb.cols.map((cl) => (r[cl.name] == null ? 'NULL' : typeof r[cl.name] === 'number' ? r[cl.name] : `'${String(r[cl.name]).replace(/'/g, "\\'")}'`)).join(',') + ')').join(',')};\nUNLOCK TABLES;\n\n`;
      }
    }
    out += `-- Dump completed on ${LX.strftime(c.m, '%Y-%m-%d %H:%M:%S', c.m.now())}\n`;
    c.out(out);
    return 0;
  });

  def('mysqladmin', async (c) => {
    const o = parseMysqlArgs(c.args.filter((a) => !/^(ping|status|version|processlist|create|drop)$/.test(a)));
    const cmd = c.args.find((a) => /^(ping|status|version|processlist)$/.test(a)) || 'status';
    if (o.askPass) o.pass = await c.session.requestLine('Enter password: ', { secret: true });
    const conn = mysqlConnect(c, o);
    if (conn.err) { c.err(`mysqladmin: connect to server at 'localhost' failed\nerror: '${conn.err.replace(/^ERROR \d+ \(\w+\): /, '')}'\n`); return 1; }
    const up = Math.floor((c.m.now() - ((c.m.state.services.mysql || c.m.state.services.mariadb || {}).since || c.m.bootTime)) / 1000);
    if (cmd === 'ping') c.out('mysqld is alive\n');
    else if (cmd === 'version') c.out(`mysqladmin  Ver 8.0.43-0ubuntu0.24.04.1 for Linux on x86_64 ((Ubuntu))\nCopyright (c) 2000, 2025, Oracle and/or its affiliates.\n\nServer version\t\t8.0.43-0ubuntu0.24.04.1\nProtocol version\t10\nConnection\t\tLocalhost via UNIX socket\nUNIX socket\t\t/var/run/mysqld/mysqld.sock\nUptime:\t\t\t${Math.floor(up / 60)} min ${up % 60} sec\n\nThreads: 2  Questions: 12  Slow queries: 0  Opens: 139  Flush tables: 3  Open tables: 58  Queries per second avg: 0.014\n`);
    else c.out(`Uptime: ${up}  Threads: 2  Questions: 12  Slow queries: 0  Opens: 139  Flush tables: 3  Open tables: 58  Queries per second avg: 0.014\n`);
    return 0;
  });

  def(['mysql_secure_installation', 'mariadb-secure-installation'], async (c) => {
    const m = c.m;
    const st = mysqlStore(m);
    if (!st || !mysqlRunning(m)) { c.err(`\nSecuring the MySQL server deployment.\n\nError: Can't connect to local MySQL server through socket '/var/run/mysqld/mysqld.sock' (2)\n`); return 1; }
    if (c.cred.uid !== 0) { c.err('\nSecuring the MySQL server deployment.\n\nConnecting to MySQL using a blank password.\nError: Access denied for user \'root\'@\'localhost\' (using password: NO)\n'); return 1; }
    const ask = async (q) => { const a = await c.readLine(q, { tty: true, answer: 'y' }); return /^y/i.test((a || '').trim()); };
    c.out('\nSecuring the MySQL server deployment.\n\nConnecting to MySQL using a blank password.\n\nVALIDATE PASSWORD COMPONENT can be used to test passwords\nand improve security. It checks the strength of password\nand allows the users to set only those passwords which are\nsecure enough. Would you like to setup VALIDATE PASSWORD component?\n\n');
    if (await ask('Press y|Y for Yes, any other key for No: ')) {
      c.out('\nThere are three levels of password validation policy:\n\nLOW    Length >= 8\nMEDIUM Length >= 8, numeric, mixed case, and special characters\nSTRONG Length >= 8, numeric, mixed case, special characters and dictionary                  file\n\n');
      await c.readLine('Please enter 0 = LOW, 1 = MEDIUM and 2 = STRONG: ', { tty: true, answer: '1' });
    }
    c.out('\nSkipping password set for root as authentication with auth_socket is used by default.\nIf you would like to use password authentication instead, this can be done with the "ALTER_USER" command.\nSee https://dev.mysql.com/doc/refman/8.0/en/alter-user.html#alter-user-password-management for more information.\n\nBy default, a MySQL installation has an anonymous user,\nallowing anyone to log into MySQL without having to have\na user account created for them. This is intended only for\ntesting, and to make the installation go a bit smoother.\nYou should remove them before moving into a production\nenvironment.\n\n');
    if (await ask('Remove anonymous users? (Press y|Y for Yes, any other key for No) : ')) { st.users = st.users.filter((u) => u.user !== ''); c.out('Success.\n\n'); }
    c.out('\nNormally, root should only be allowed to connect from\n\'localhost\'. This ensures that someone cannot guess at\nthe root password from the network.\n\n');
    if (await ask('Disallow root login remotely? (Press y|Y for Yes, any other key for No) : ')) { st.users = st.users.filter((u) => !(u.user === 'root' && u.host !== 'localhost')); c.out('Success.\n\n'); }
    c.out('By default, MySQL comes with a database named \'test\' that\nanyone can access. This is also intended only for testing,\nand should be removed before moving into a production\nenvironment.\n\n\n');
    if (await ask('Remove test database and access to it? (Press y|Y for Yes, any other key for No) : ')) { delete st.dbs.test; c.out(' - Dropping test database...\nSuccess.\n\n - Removing privileges on test database...\nSuccess.\n\n'); }
    c.out('Reloading the privilege tables will ensure that all changes\nmade so far will take effect immediately.\n\n');
    if (await ask('Reload privilege tables now? (Press y|Y for Yes, any other key for No) : ')) c.out('Success.\n\n');
    c.out('All done! \n');
    return 0;
  });

  // ======================================================================= PostgreSQL
  class PsqlRepl {
    constructor(c, eng) { this.c = c; this.eng = eng; this.buffer = ''; this.m = c.m; this.cred = c.cred; }
    prompt() { const d = this.eng.sess.db; const su = (this.eng.s.users.find((u) => u.user === this.eng.sess.user) || {}).super; return this.buffer ? `${d}-# ` : `${d}=${su ? '#' : '>'} `; }
    async input(line, io) {
      const t = line.trim();
      if (!this.buffer && t.startsWith('\\')) {
        const [cmd, arg] = t.split(/\s+/);
        const s = this.eng.s;
        switch (cmd) {
          case '\\q': throw new LX.sig.ExitSig(0);
          case '\\l': io.out(psqlTable({ cols: ['Name', 'Owner', 'Encoding', 'Locale Provider', 'Collate', 'Ctype'], rows: Object.keys(s.dbs).sort().map((d) => [d, s.dbs[d].owner || 'postgres', 'UTF8', 'libc', 'C.UTF-8', 'C.UTF-8']) }).replace(/^/, '                                                   List of databases\n')); return 'done';
          case '\\du': io.out('                             List of roles\n' + psqlTable({ cols: ['Role name', 'Attributes'], rows: s.users.map((u) => [u.user, u.super ? 'Superuser, Create role, Create DB, Replication, Bypass RLS' : '']) }).replace(/\(\d+ rows?\)\n/, '')); return 'done';
          case '\\dt': { const db = s.dbs[this.eng.sess.db]; const names = Object.keys(db.tables); if (!names.length) { io.out('Did not find any relations.\n'); return 'done'; } io.out('        List of relations\n' + psqlTable({ cols: ['Schema', 'Name', 'Type', 'Owner'], rows: names.map((n) => ['public', n, 'table', db.tables[n].owner || 'postgres']) })); return 'done'; }
          case '\\c': case '\\connect': { if (!s.dbs[arg]) { io.err(`connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  database "${arg}" does not exist\nPrevious connection kept\n`); return 'done'; } this.eng.sess.db = arg; io.out(`You are now connected to database "${arg}" as user "${this.eng.sess.user}".\n`); return 'done'; }
          case '\\conninfo': io.out(`You are connected to database "${this.eng.sess.db}" as user "${this.eng.sess.user}" via socket in "/var/run/postgresql" at port "5432".\n`); return 'done';
          case '\\?': case '\\h': io.out('General\n  \\q                     quit psql\n  \\l                     list databases\n  \\c DBNAME              connect to new database\n  \\dt                    list tables\n  \\du                    list roles\n  \\conninfo              display information about current connection\n'); return 'done';
          default: io.err(`invalid command ${cmd}\nTry \\? for help.\n`); return 'done';
        }
      }
      if (!this.buffer && /^(exit|quit)$/i.test(t)) throw new LX.sig.ExitSig(0);
      const text = this.buffer ? this.buffer + '\n' + line : line;
      const { stmts, rest } = splitSql(text);
      this.buffer = rest.trim() ? rest : '';
      for (const s of stmts) {
        try { psqlOut(io, this.eng.exec(s.sql)); this.m.saveSoon(); } catch (e) { io.err(pgErr(e) + '\n'); }
      }
      return this.buffer ? 'more' : 'done';
    }
  }
  function pgErr(e) { return e instanceof SqlError ? `ERROR:  ${e.message}${e.state === '42601' ? '\nLINE 1: ...' : ''}` : `ERROR:  syntax error at or near "${(/near '(.*?)'/.exec(e.message) || [0, ''])[1]}"`; }
  function psqlOut(io, r) {
    if (!r) return;
    if (r.cols) io.out(psqlTable(r));
    else if (r.tag) io.out(r.tag + '\n');
    else if (r.msg) io.out(r.msg + '\n');
    else io.out('OK\n');
  }

  function pgConnect(c, o) {
    const m = c.m;
    const st = m.state.db.pg;
    if (!st || !(m.state.services.postgresql && m.state.services.postgresql.active)) return { err: `psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: No such file or directory\n\tIs the server running locally and accepting connections on that socket?` };
    const user = o.user || c.cred.name;
    const u = st.users.find((x) => x.user === user);
    if (!u) return { err: `psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  role "${user}" does not exist` };
    if (!o.host) {
      if (c.cred.name !== user) return { err: `psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  Peer authentication failed for user "${user}"` };
    } else if ((u.pass || null) !== (o.pass || null)) return { err: `psql: error: connection to server at "${o.host}" (127.0.0.1), port 5432 failed: FATAL:  password authentication failed for user "${user}"` };
    const db = o.db || user;
    if (!st.dbs[db]) return { err: `psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  database "${db}" does not exist` };
    return { store: st, user, db };
  }

  def('psql', async (c) => {
    const args = c.args.slice();
    const o = { user: null, db: null, cmds: [], host: null, pass: null, file: null };
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-U' || a === '--username') o.user = args[++i];
      else if (a.startsWith('--username=')) o.user = a.slice(11);
      else if (a === '-d' || a === '--dbname') o.db = args[++i];
      else if (a.startsWith('--dbname=')) o.db = a.slice(9);
      else if (a === '-c' || a === '--command') o.cmds.push(args[++i]);
      else if (a.startsWith('--command=')) o.cmds.push(a.slice(10));
      else if (a === '-f' || a === '--file') o.file = args[++i];
      else if (a === '-h' || a === '--host') o.host = args[++i];
      else if (a.startsWith('--host=')) o.host = a.slice(7);
      else if (a === '-p' || a === '--port') i++;
      else if (a === '-W' || a === '--password') o.askPass = true;
      else if (a === '-w' || a === '--no-password') o.noPass = true;
      else if (a === '-t' || a === '--tuples-only' || a === '-A' || a === '--no-align' || a === '-q' || a === '--quiet' || a === '-X') { if (a === '-t' || a === '--tuples-only') o.tuples = true; }
      else if (a === '--version' || a === '-V') { c.out('psql (PostgreSQL) 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)\n'); return 0; }
      else if (a === '-l' || a === '--list') o.cmds.push('\\l');
      else if (/^postgres(ql)?:\/\//.test(a)) { const u = /^postgres(?:ql)?:\/\/(?:([^:@]+)(?::([^@]*))?@)?([^/:]+)?(?::\d+)?\/?([^?]*)/.exec(a); if (u) { if (u[1]) o.user = decodeURIComponent(u[1]); if (u[2] != null) o.pass = decodeURIComponent(u[2]); if (u[3]) o.host = u[3]; if (u[4]) o.db = u[4]; } }
      else if (!a.startsWith('-')) { if (!o.db) o.db = a; else o.user = a; }
    }
    if (o.host && o.pass == null) {
      // PGPASSWORD → ~/.pgpass → 프롬프트
      const env = c.sh.getVar('PGPASSWORD');
      if (env) o.pass = env;
      else {
        try {
          const pgp = c.fs.readFile((c.sh.getVar('HOME') || '/') + '/.pgpass', c.cred);
          const user = o.user || c.cred.name;
          const line = pgp.split('\n').map((l) => l.split(':')).find((f) => f.length >= 5 && (f[0] === '*' || f[0] === o.host) && (f[3] === '*' || f[3] === user) && (f[2] === '*' || f[2] === (o.db || user)));
          if (line) o.pass = line[4];
        } catch (e) { /* 없음 */ }
        if (o.pass == null && !o.noPass) o.pass = await c.session.requestLine(`Password for user ${o.user || c.cred.name}: `, { secret: true });
      }
    }
    const conn = pgConnect(c, o);
    if (conn.err) { c.err(conn.err + '\n'); return 2; }
    const eng = new SqlEngine(conn.store, 'pg', { user: conn.user, host: 'localhost', db: conn.db });
    const repl = new PsqlRepl(c, eng);
    if (o.file) { try { o.cmds.push(c.fs.readFile(c.resolve(o.file), c.cred)); } catch (e) { c.err(`psql: error: ${o.file}: ${e.message}\n`); return 1; } }
    if (o.cmds.length || c.stdin) {
      const texts = o.cmds.length ? o.cmds : [c.stdin.readAll()];
      for (const text of texts) {
        // 줄 단위로 \명령과 SQL 을 구분 (heredoc 안의 \c 등)
        let buf = '';
        const flush = () => { const { stmts, rest } = splitSql(buf); if (rest.trim()) stmts.push({ sql: rest }); buf = ''; for (const s of stmts) { try { const r = eng.exec(s.sql); if (o.tuples && r && r.cols) c.out(r.rows.map((row) => row.map((v) => (v == null ? '' : fmtVal(v))).join('|')).join('\n') + (r.rows.length ? '\n' : '')); else psqlOut(c.io, r); } catch (e) { c.err(pgErr(e) + '\n'); return 1; } } return 0; };
        for (const line of text.split('\n')) {
          if (/^\s*\\/.test(line)) { if (flush()) return 1; await repl.input(line.trim(), c.io); continue; }
          buf += line + '\n';
        }
        if (flush()) return 1;
      }
      c.m.saveSoon();
      return 0;
    }
    if (!LX.canPush(c)) return 0;
    c.out('psql (16.10 (Ubuntu 16.10-0ubuntu0.24.04.1))\nType "help" for help.\n\n');
    c.session.pushRepl(repl);
    return 0;
  });

  def(['createdb', 'dropdb', 'createuser', 'dropuser'], async (c) => {
    const name = c.args.filter((a) => !a.startsWith('-')).pop();
    const conn = pgConnect(c, { user: null, db: 'postgres' });
    if (conn.err) { c.err(conn.err.replace(/^psql/, c.name) + '\n'); return 1; }
    const eng = new SqlEngine(conn.store, 'pg', { user: conn.user, db: 'postgres' });
    const sql = { createdb: `CREATE DATABASE ${name}`, dropdb: `DROP DATABASE ${name}`, createuser: `CREATE USER ${name}`, dropuser: `DROP USER ${name}` }[c.name];
    const own = c.args.indexOf('-O');
    try { eng.exec(own >= 0 ? `${sql} OWNER ${c.args[own + 1]}` : sql); } catch (e) { c.err(`${c.name}: error: ${c.name.includes('db') ? 'database' : 'creation of new role'} failed: ${pgErr(e)}\n`); return 1; }
    c.m.saveSoon();
    return 0;
  });
  def('pg_lsclusters', async (c) => {
    const on = c.m.state.services.postgresql && c.m.state.services.postgresql.active;
    c.out(`Ver Cluster Port Status ${on ? 'Owner   ' : 'Owner   '} Data directory              Log file\n16  main    5432 ${on ? 'online' : 'down  '} postgres /var/lib/postgresql/16/main /var/log/postgresql/postgresql-16-main.log\n`);
    return 0;
  });
  def('pg_dump', async (c) => {
    const db = c.args.filter((a) => !a.startsWith('-')).pop();
    const conn = pgConnect(c, { db });
    if (conn.err) { c.err(conn.err.replace(/^psql/, 'pg_dump') + '\n'); return 1; }
    let out = `--\n-- PostgreSQL database dump\n--\n\n-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)\n\nSET statement_timeout = 0;\nSET client_encoding = 'UTF8';\n\n`;
    Object.entries(conn.store.dbs[db].tables).forEach(([tn, tb]) => {
      out += `CREATE TABLE public.${tn} (\n${tb.cols.map((cl) => `    ${cl.name} ${cl.type}`).join(',\n')}\n);\n\n`;
      tb.rows.forEach((r) => { out += `INSERT INTO public.${tn} VALUES (${tb.cols.map((cl) => (r[cl.name] == null ? 'NULL' : typeof r[cl.name] === 'number' ? r[cl.name] : `'${r[cl.name]}'`)).join(', ')});\n`; });
    });
    c.out(out + '\n--\n-- PostgreSQL database dump complete\n--\n\n');
    return 0;
  });

  // ======================================================================= Redis
  class RedisRepl {
    constructor(c) { this.c = c; this.m = c.m; this.cred = c.cred; }
    prompt() { return '127.0.0.1:6379> '; }
    async input(line, io) {
      const t = line.trim();
      if (/^(exit|quit)$/i.test(t)) throw new LX.sig.ExitSig(0);
      if (t) io.out(redisCmd(this.m, t.match(/"[^"]*"|'[^']*'|\S+/g).map((x) => x.replace(/^["']|["']$/g, ''))));
      return 'done';
    }
  }
  function redisCmd(m, a) {
    const d = m.state.redis;
    const k = a[1];
    // 만료된 키 정리
    if (m.state.redisTtl) for (const [kk, t] of Object.entries(m.state.redisTtl)) if (t <= m.now()) { delete d[kk]; delete m.state.redisTtl[kk]; }
    switch ((a[0] || '').toUpperCase()) {
      case 'PING': return a[1] ? `"${a[1]}"\n` : 'PONG\n';
      case 'SET': {
        d[k] = a[2];
        const ex = a.findIndex((x, i) => i >= 3 && /^(EX|PX)$/i.test(x));
        m.state.redisTtl = m.state.redisTtl || {};
        if (ex >= 0) m.state.redisTtl[k] = m.now() + (+a[ex + 1] || 0) * (/^PX$/i.test(a[ex]) ? 1 : 1000); else delete m.state.redisTtl[k];
        m.saveSoon(); return 'OK\n';
      }
      case 'GET': return d[k] == null ? '(nil)\n' : `"${d[k]}"\n`;
      case 'SETEX': d[k] = a[3]; m.state.redisTtl = m.state.redisTtl || {}; m.state.redisTtl[k] = m.now() + (+a[2] || 0) * 1000; m.saveSoon(); return 'OK\n';
      case 'PERSIST': { const had = m.state.redisTtl && m.state.redisTtl[k] != null; if (had) delete m.state.redisTtl[k]; return `(integer) ${had ? 1 : 0}\n`; }
      case 'MSET': for (let i = 1; i + 1 < a.length; i += 2) d[a[i]] = a[i + 1]; m.saveSoon(); return 'OK\n';
      case 'MGET': return a.slice(1).map((x, i) => `${i + 1}) ${d[x] == null ? '(nil)' : `"${d[x]}"`}`).join('\n') + '\n';
      case 'APPEND': d[k] = (d[k] || '') + a[2]; return `(integer) ${d[k].length}\n`;
      case 'DECR': d[k] = String((+d[k] || 0) - 1); return `(integer) ${d[k]}\n`;
      case 'INCRBY': d[k] = String((+d[k] || 0) + (+a[2] || 0)); return `(integer) ${d[k]}\n`;
      case 'TYPE': return d[k] == null ? 'none\n' : 'string\n';
      case 'SELECT': return 'OK\n';
      case 'CLIENT': case 'SAVE': case 'BGSAVE': return a[0].toUpperCase() === 'BGSAVE' ? 'Background saving started\n' : 'OK\n';
      case 'LASTSAVE': return `(integer) ${Math.floor(m.now() / 1000)}\n`;
      case 'DEL': { const n = a.slice(1).filter((x) => d[x] != null).length; a.slice(1).forEach((x) => delete d[x]); return `(integer) ${n}\n`; }
      case 'EXISTS': return `(integer) ${a.slice(1).filter((x) => d[x] != null).length}\n`;
      case 'INCR': d[k] = String((+d[k] || 0) + 1); return `(integer) ${d[k]}\n`;
      case 'KEYS': { const re = LX.glob.globToRe(a[1] || '*', false); const ks = Object.keys(d).filter((x) => re.test(x)); return ks.length ? ks.map((x, i) => `${i + 1}) "${x}"`).join('\n') + '\n' : '(empty array)\n'; }
      case 'EXPIRE': { if (d[k] == null) return '(integer) 0\n'; m.state.redisTtl = m.state.redisTtl || {}; m.state.redisTtl[k] = m.now() + (+a[2] || 0) * 1000; return '(integer) 1\n'; }
      case 'TTL': case 'PTTL': { if (d[k] == null) return '(integer) -2\n'; const t = m.state.redisTtl && m.state.redisTtl[k]; if (t == null) return '(integer) -1\n'; const ms = t - m.now(); return `(integer) ${a[0].toUpperCase() === 'PTTL' ? Math.max(0, ms) : Math.max(0, Math.ceil(ms / 1000))}\n`; }
      case 'FLUSHALL': case 'FLUSHDB': Object.keys(d).forEach((x) => delete d[x]); return 'OK\n';
      case 'DBSIZE': return `(integer) ${Object.keys(d).length}\n`;
      case 'INFO': return `# Server\nredis_version:7.0.15\nredis_mode:standalone\nos:Linux ${LX.OS.kernel} x86_64\ntcp_port:6379\nuptime_in_seconds:${Math.floor((m.now() - m.bootTime) / 1000)}\n\n# Clients\nconnected_clients:1\n\n# Memory\nused_memory_human:1.02M\n\n# Keyspace\n${Object.keys(d).length ? `db0:keys=${Object.keys(d).length},expires=0,avg_ttl=0\n` : ''}`;
      case 'CONFIG': return a[1] && a[1].toUpperCase() === 'GET' ? `1) "${a[2]}"\n2) "${a[2] === 'bind' ? '127.0.0.1 -::1' : a[2] === 'port' ? '6379' : ''}"\n` : 'OK\n';
      default: return `(error) ERR unknown command '${a[0]}', with args beginning with: ${a.slice(1).map((x) => `'${x}'`).join(' ')}\n`;
    }
  }
  def('redis-cli', async (c) => {
    const args = c.args.slice();
    let host = '127.0.0.1';
    const cmd = [];
    for (let i = 0; i < args.length; i++) { if (args[i] === '-h') host = args[++i]; else if (args[i] === '-p' || args[i] === '-a') i++; else if (args[i] === '--version' || args[i] === '-v') { c.out('redis-cli 7.0.15\n'); return 0; } else cmd.push(args[i]); }
    const conn = LX.tcpConnect(c, host, 6379);
    if (!conn.ok) { c.err(`Could not connect to Redis at ${host}:6379: Connection ${conn.err === 'timeout' ? 'timed out' : 'refused'}\n`); if (!cmd.length && !c.session.headless) c.out('not connected> \n'); return 1; }
    if (cmd.length) { c.out(redisCmd(c.m, cmd).replace(/^"(.*)"\n$/, c.tty ? '"$1"\n' : '$1\n')); return 0; }
    if (!LX.canPush(c)) return 0;
    c.session.pushRepl(new RedisRepl(c));
    return 0;
  });
  def(['redis-server', 'redis-benchmark'], async (c) => { if (c.args.includes('--version') || c.args.includes('-v')) { c.out('Redis server v=7.0.15 sha=00000000:0 malloc=jemalloc-5.3.0 bits=64 build=9f1e2f7d7d2ab3d4\n'); return 0; } c.err('\x1b[2m(가상 터미널: redis 서버는 sudo systemctl start redis-server 로 실행하세요)\x1b[0m\n'); return 1; });
})(typeof window !== 'undefined' ? window : globalThis);

