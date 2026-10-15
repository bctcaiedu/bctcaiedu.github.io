/* 클라우드 기초 — 심화 실습: 공인 IP 없는 "학교 서버" 와 터널
 *  - school           : 학교 실습실 서버(사설망 · NAT 뒤)에 접속하는 두 번째 가상 머신
 *  - cloudflared      : Cloudflare Quick Tunnel 흉내 (https://*.trycloudflare.com)
 *  - ssh -R / autossh : 학교 서버 → Oracle(이 가상 서버) 역방향 SSH 터널
 */
(function (g) {
  'use strict';
  const LX = g.LX;
  if (!LX) return;
  const PUBLIC_IP = '203.0.113.25';
  const SCHOOL_IP = '172.16.10.20';
  const SCHOOL_NAT = '175.211.40.7';
  const SCHOOL_KEY = 'cloud70.school.v1';
  const def = (n, f) => LX.def(n, f);
  const dim = (s) => `\x1b[2m${s}\x1b[0m`;
  const rt = (LX.c70rt = LX.c70rt || { cf: {}, rtun: [], seq: 0 });

  // ------------------------------------------------------------------ 머신 찾기
  const mainM = () => (g.UbuntuApp && g.UbuntuApp.term && g.UbuntuApp.term.m) || null;
  let school = null;
  function setupSchool(sm) {
    sm.state.c70role = 'school';
    try { sm.vfs.writeFile('/etc/hostname', 'school-lab\n', null); } catch (e) { /* 무시 */ }
    try {
      const h = sm.vfs.readFile('/etc/hosts', null).replace(/127\.0\.1\.1\s+\S+/, '127.0.1.1 school-lab');
      sm.vfs.writeFile('/etc/hosts', h, null);
    } catch (e) { /* 무시 */ }
    try {
      Object.values(sm.state.net.ifaces || {}).forEach((i) => { i.addr = (i.addr || []).map((a) => a.replace(/^10\.0\.2\.15\//, SCHOOL_IP + '/')); });
      sm.state.net.gw = '172.16.10.1';
      sm.state.net.dns = ['172.16.10.1'];
    } catch (e) { /* 무시 */ }
    ['seclist', 'aws', 'az', 'gcloud', 'c70-ready'].forEach((b) => { try { sm.vfs.unlink('/usr/local/bin/' + b, null); } catch (e) { /* 없음 */ } });
    try {
      LX.pkgFiles(sm, 'nginx', true);
      const svc = (LX.PKGS.nginx || {}).svc || 'nginx';
      sm.state.services[svc] = Object.assign(sm.state.services[svc] || {}, { active: true, enabled: true, since: null, pid: sm.nextPid() });
      sm.vfs.writeFile('/var/www/html/index.html', '<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><title>학교 실습실 서버</title></head>\n<body><h1>🏫 학교 실습실 서버 (school-lab)</h1>\n<p>사설 IP 172.16.10.20 · 공인 IP 없음 — 터널로 공개된 페이지입니다.</p></body></html>\n', null);
    } catch (e) { /* 무시 */ }
    sm.save();
  }
  function getSchool() {
    if (school) return school;
    school = new LX.Machine({ storageKey: SCHOOL_KEY });
    if (!school.state.c70role) setupSchool(school);
    return school;
  }
  LX.c70school = getSchool;
  const isSchool = (m) => !!(m && m.state && m.state.c70role === 'school');

  // ------------------------------------------------------------------ 이름 풀이 (학교 서버 · Quick Tunnel)
  const hex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
  const WORDS = 'river maple orbit cedar pixel harbor lemon canyon velvet comet amber meadow tiger silver lunar frost delta coral prairie atlas quartz willow ember summit'.split(' ');
  const errPage = (code, msg) => ({ status: code, server: 'cloudflare', headers: { 'Content-Type': 'text/plain; charset=UTF-8', Server: 'cloudflare' }, body: msg });

  async function forwardHttp(target, path, method, o) {
    const r = await LX.http(target.m, target.url.replace(/\/$/, '') + path, { method, headers: (o && o.headers) || {}, depth: ((o && o.depth) || 0) + 1 });
    return r;
  }

  const origResolve = LX.resolveHost;
  LX.resolveHost = function (m, host) {
    const h = String(host || '').toLowerCase();
    // Cloudflare Quick Tunnel
    if (/\.trycloudflare\.com$/.test(h)) {
      return { ip: '104.16.230.132', local: false, ext: { route: async (mm, path, hh, method, o) => {
        const t = rt.cf[h];
        if (!t) return errPage(530, 'error code: 1033\n');
        const r = await forwardHttp(t, path, method, o);
        if (r.error) return errPage(502, 'Bad Gateway\n');
        return { status: r.status, server: 'cloudflare', headers: Object.assign({}, r.headers, { Server: 'cloudflare', 'CF-RAY': hex(16) + '-ICN' }), body: r.body };
      } } };
    }
    if (isSchool(m)) {
      if (h === 'ifconfig.me' || h === 'ipinfo.io' || h === 'icanhazip.com') return { ip: '34.160.111.145', local: false, ext: { body: SCHOOL_NAT } };
      // 학교 서버에서 본 Oracle 서버: 바깥(인터넷) 쪽에서 접속하는 것과 같다
      const M = mainM();
      const duck = /^([a-z0-9-]+)\.duckdns\.org$/.exec(h);
      const toMain = h === PUBLIC_IP || (duck && M && M.state.c70duck && M.state.c70duck[duck[1]] === PUBLIC_IP);
      if (toMain && M) {
        return { ip: PUBLIC_IP, local: false, ext: { route: async (mm, path, hh, method, o, port) => {
          port = port || 80;
          if (LX.extraFw) { const xf = LX.extraFw(M, port, 'tcp', SCHOOL_NAT); if (xf === false) return { error: `Failed to connect to ${h} port ${port} after 3002 ms: Timeout was reached`, code: 28 }; if (xf === 'reject') return { error: `Failed to connect to ${h} port ${port} after 2 ms: Couldn't connect to server`, code: 7 }; }
          const r = await LX.http(M, `http://${h}:${port}${path}`, { method, headers: (o && o.headers) || {}, depth: ((o && o.depth) || 0) + 1 });
          if (r.error) return { error: r.error, code: r.code };
          return { status: r.status, server: (r.headers && r.headers.Server) || 'nginx', headers: r.headers, body: r.body };
        } } };
      }
    }
    return origResolve(m, host);
  };

  // ------------------------------------------------------------------ school
  def('school', async (c) => {
    const sm = getSchool();
    const a = c.args.slice();
    if (a[0] === '--help' || a[0] === '-h') {
      c.out('school - (실습용) 학교 실습실 서버(school-lab)에 접속합니다\n\n사용법:\n  school              학교 서버 셸 열기 (exit 로 돌아오기)\n  school 명령 [인자]   학교 서버에서 명령 한 번 실행\n  school --reset      학교 서버를 처음 상태로\n\n학교 서버: 사설 IP 172.16.10.20 · 공인 IP 없음(학교 NAT 175.211.40.7 공유) · Nginx 동작 중\n');
      return 0;
    }
    if (a[0] === '--reset') {
      Object.keys(rt.cf).forEach((k) => { if (rt.cf[k].m === sm) delete rt.cf[k]; });
      rt.rtun = rt.rtun.filter((t) => t.m !== sm);
      sm.reset(true); setupSchool(sm);
      c.out('학교 서버를 처음 상태로 되돌렸습니다.\n');
      return 0;
    }
    if (a.length) {
      const sh = new LX.Shell(c.session, { machine: sm, user: 'student' });
      const cred = sm.credFor('student');
      sh.cwd = cred.home; sh.vars.HOME = { v: cred.home, x: true };
      const src = a.length === 1 ? a[0] : a.map((x) => (/^[\w@%+=:,./-]+$/.test(x) ? x : "'" + x.replace(/'/g, "'\\''") + "'")).join(' ');
      try { return await sh.runSource(src, c.io); } catch (e) { if (e && e.code != null) return e.code; throw e; }
    }
    if (!LX.canPush(c)) { c.err('school: 대화형 셸은 터미널에서만 열 수 있습니다. 명령을 함께 주세요 (예: school hostname)\n'); return 1; }
    c.out(`\x1b[1;36m🏫 학교 실습실 서버 school-lab\x1b[0m ${dim('— 사설 IP 172.16.10.20 · 공인 IP 없음 · 돌아가려면 exit')}\n`);
    await c.session.pushShell('student', { machine: sm, login: true, remote: 'school-lab', onExit: async () => { c.session.out('Connection to school-lab closed.\n'); } });
    return 0;
  });

  // ------------------------------------------------------------------ cloudflared
  LX.PKGS.cloudflared = { name: 'cloudflared', ver: '2026.9.1', size: 38400, desc: 'Cloudflare Tunnel client', deps: [], bins: { '/usr/bin': ['cloudflared'] }, section: 'non-free' };
  LX.PKGS.autossh = { name: 'autossh', ver: '1.4g-1build2', size: 64, desc: 'Automatically restart SSH sessions and tunnels', deps: [], bins: { '/usr/bin': ['autossh'] }, section: 'universe' };
  if (LX.EXTERNAL) {
    LX.EXTERNAL['github.com'] = Object.assign({}, LX.EXTERNAL['github.com'] || { ip: '20.200.245.247' });
  }
  const ts = (m) => new Date(m.now()).toISOString().replace(/\.\d+Z$/, 'Z');

  def('cloudflared', async (c) => {
    const m = c.m;
    const a = c.args.slice();
    if (a[0] === '--version' || a[0] === 'version' || a[0] === '-v') { c.out('cloudflared version 2026.9.1 (built 2026-09-17-1422 UTC)\n'); return 0; }
    if (a[0] === 'tunnel' && (a.includes('--url') || a.some((x) => x.startsWith('--url=')))) {
      let url = a.find((x) => x.startsWith('--url='));
      url = url ? url.slice(6) : a[a.indexOf('--url') + 1];
      if (!url) { c.err('Incorrect Usage: flag needs an argument: -url\n'); return 1; }
      if (!/^https?:\/\//.test(url)) url = 'http://' + url;
      const words = [0, 1, 2, 3].map(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
      const host = words.join('-') + '.trycloudflare.com';
      const E = (s) => c.err(`${ts(m)} INF ${s}\n`);
      E('Thank you for trying Cloudflare Tunnel. Doing so, without a Cloudflare account, is a quick way to experiment and try it out. However, be aware that these account-less Tunnels have no uptime guarantee, are subject to the Cloudflare Online Services Terms of Use (https://www.cloudflare.com/website-terms/), and Cloudflare reserves the right to investigate your use of Tunnels for violations of such terms. If you intend to use Tunnels in production you should use a pre-created named tunnel by following: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks');
      E('Requesting new quick Tunnel on trycloudflare.com...');
      const box = `https://${host}`;
      E('+--------------------------------------------------------------------------------------------+');
      E('|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |');
      E(`|  ${box.padEnd(90)}|`);
      E('+--------------------------------------------------------------------------------------------+');
      E(`Version 2026.9.1 (Checksum ${hex(64)})`);
      E(`Initial protocol quic`);
      E(`Starting metrics server on 127.0.0.1:20241/metrics`);
      const id = ++rt.seq;
      const proc = m.spawn(c.cred.name, 'cloudflared ' + a.join(' '), { ppid: 1, tty: '?' });
      proc.onSignal = () => { if (rt.cf[host] && rt.cf[host].id === id) delete rt.cf[host]; };
      rt.cf[host] = { id, m, url, started: m.now(), proc };
      E(`Registered tunnel connection connIndex=0 connection=${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)} event=0 ip=198.41.200.${13 + (id % 200)} location=icn06 protocol=quic`);
      if (c.session.headless && !c.io.job) return 0;
      try {
        for (;;) { await c.sleep(1000); if (!rt.cf[host] || rt.cf[host].id !== id || !m.procs.includes(proc)) break; }
      } catch (e) {
        c.err(`${ts(m)} INF Initiating graceful shutdown due to signal interrupt ...\n`);
        c.session.aborted = false;
      } finally {
        if (rt.cf[host] && rt.cf[host].id === id) delete rt.cf[host];
        m.exitProc(proc);
      }
      return 0;
    }
    if (a[0] === 'tunnel' && ['login', 'create', 'route', 'run', 'list', 'delete', 'info'].includes(a[1])) {
      c.err(`${ts(m)} ERR Cannot determine default origin certificate path. No file cert.pem in [~/.cloudflared ~/.cloudflare-warp ~/cloudflare-warp /etc/cloudflared /usr/local/etc/cloudflared]. You need to specify the origin certificate path by specifying the origincert option in the configuration file, or set TUNNEL_ORIGIN_CERT environment variable\n`);
      c.err(dim('(가상 터미널: 이름 있는 터널(login · create · route dns · run)은 Cloudflare 계정과 Cloudflare 에 등록한 도메인이 필요해 실제 서버에서만 실습합니다. 여기서는 Quick Tunnel: cloudflared tunnel --url http://localhost:80)') + '\n');
      return 1;
    }
    if (a[0] === 'service') { c.err('Cannot determine default configuration path. No file [config.yml config.yaml] in [~/.cloudflared ~/.cloudflare-warp ~/cloudflare-warp /etc/cloudflared /usr/local/etc/cloudflared]\n' + dim('(가상 터미널: 서비스 등록은 이름 있는 터널 설정(config.yml) 뒤에 실제 서버에서 합니다)') + '\n'); return 1; }
    c.out('NAME:\n   cloudflared - Cloudflare\'s command-line tool and agent\n\nUSAGE:\n   cloudflared [global options] [command] [command options]\n\nCOMMANDS:\n   tunnel   Use Cloudflare Tunnel to expose private services to the Internet or to Cloudflare connected private users.\n   service  Manages the cloudflared system service\n   version  Print the version\n\n' + dim('(가상 터미널 지원: --version · tunnel --url http://localhost:80)') + '\n');
    return a.length ? 1 : 0;
  });

  // ------------------------------------------------------------------ 역방향 SSH 터널
  function readText(m, p) { try { return m.vfs.readFile(p, null); } catch (e) { return null; } }
  function sshdOpt(M, key) {
    const files = [];
    try { (M.vfs.readdir('/etc/ssh/sshd_config.d', null) || []).filter((f) => /\.conf$/.test(f)).sort().forEach((f) => files.push('/etc/ssh/sshd_config.d/' + f)); } catch (e) { /* 없음 */ }
    files.push('/etc/ssh/sshd_config');
    for (const f of files) {
      const t = readText(M, f) || '';
      const r = new RegExp('^\\s*' + key + '\\s+(\\S+)', 'im').exec(t);
      if (r) return r[1].toLowerCase();
    }
    return null;
  }
  function splitArgs(s) {
    const out = []; const re = /"([^"]*)"|'([^']*)'|(\S+)/g; let mm;
    while ((mm = re.exec(s))) out.push(mm[1] != null ? mm[1] : mm[2] != null ? mm[2] : mm[3]);
    return out;
  }
  function parseSsh(args) {
    const o = { R: [], N: false, f: false, identity: null, port: null, opts: {}, target: null, rest: [] };
    for (let i = 0; i < args.length; i++) {
      const x = args[i];
      if (x === '-R') o.R.push(args[++i]);
      else if (/^-R./.test(x)) o.R.push(x.slice(2));
      else if (x === '-i') o.identity = args[++i];
      else if (x === '-p') o.port = +args[++i];
      else if (x === '-o') { const kv = String(args[++i] || '').split('='); o.opts[kv[0].toLowerCase()] = (kv[1] || '').toLowerCase(); }
      else if (x === '-M') i++;
      else if (/^-[46AaCfGgKkMNnqsTtVvXxYy]+$/.test(x)) { if (x.includes('N')) o.N = true; if (x.includes('f')) o.f = true; }
      else if (/^-[bcDEeFIJLlmOPQSWw]$/.test(x)) i++;
      else if (!o.target) o.target = x;
      else o.rest.push(x);
    }
    return o;
  }
  function sshConfig(m, home, alias) {
    const t = readText(m, home + '/.ssh/config');
    if (!t) return {};
    let cur = null; const res = {};
    t.split('\n').forEach((line) => {
      const r = /^\s*(\S+)\s+(.+?)\s*$/.exec(line);
      if (!r) return;
      const k = r[1].toLowerCase();
      if (k === 'host') { cur = r[2].split(/\s+/).includes(alias); return; }
      if (cur && res[k] == null) res[k] = r[2];
    });
    return res;
  }
  /** 터널 연결을 점검하고 정보를 돌려준다 (에러면 {err, code}) */
  function openTunnel(sm, userName, o) {
    const M = mainM();
    const cred = sm.credFor(userName) || sm.credFor('root');
    const home = cred.home;
    let spec = o.target || '';
    let user = null;
    if (spec.includes('@')) { user = spec.split('@')[0]; spec = spec.split('@').slice(1).join('@'); }
    const cfg = sshConfig(sm, home, spec);
    const host = (cfg.hostname || spec).toLowerCase();
    user = user || cfg.user || cred.name;
    const port = o.port || +(cfg.port || 22);
    let identity = o.identity || cfg.identityfile || null;
    const duck = /^([a-z0-9-]+)\.duckdns\.org$/.exec(host);
    const toMain = M && (host === PUBLIC_IP || (duck && M.state.c70duck && M.state.c70duck[duck[1]] === PUBLIC_IP));
    if (!toMain) return { err: `ssh: connect to host ${host} port ${port}: Connection timed out\n`, code: 255 };
    // Oracle 쪽 방화벽 (보안 목록 · iptables) 과 sshd
    if (LX.extraFw) { const xf = LX.extraFw(M, port, 'tcp', SCHOOL_NAT); if (xf === false) return { err: `ssh: connect to host ${host} port ${port}: Connection timed out\n`, code: 255 }; if (xf === 'reject') return { err: `ssh: connect to host ${host} port ${port}: No route to host\n`, code: 255 }; }
    const sshd = M.state.services.ssh || M.state.services.sshd;
    if (port !== 22 || !sshd || !sshd.active) return { err: `ssh: connect to host ${host} port ${port}: Connection refused\n`, code: 255 };
    // 키 인증
    const idPath = identity ? identity.replace(/^~/, home) : [home + '/.ssh/id_ed25519', home + '/.ssh/id_rsa', home + '/.ssh/id_ecdsa'].find((p) => readText(sm, p) != null);
    const pub = idPath ? readText(sm, idPath + '.pub') : null;
    const mcred = M.credFor(user);
    const ak = mcred ? readText(M, mcred.home + '/.ssh/authorized_keys') || '' : '';
    const body = pub ? (pub.trim().split(/\s+/)[1] || '') : '';
    if (!pub || !body || !ak.includes(body)) return { err: `${user}@${host}: Permission denied (publickey).\n`, code: 255 };
    // 원격 포워딩
    const gp = sshdOpt(M, 'GatewayPorts') || 'no';
    const tuns = [];
    const warns = [];
    for (const r of o.R) {
      const p = String(r).split(':');
      let bind = null, lport, thost, tport;
      if (p.length >= 4) [bind, lport, thost, tport] = p; else [lport, thost, tport] = p;
      lport = +lport; tport = +tport;
      if (!lport || !thost || !tport) { warns.push(`Bad remote forwarding specification '${r}'\n`); continue; }
      let addr = '127.0.0.1';
      if (gp === 'yes') addr = '0.0.0.0';
      else if (gp === 'clientspecified' && bind) addr = (bind === '*' || bind === '0.0.0.0' || bind === '') ? '0.0.0.0' : (bind === 'localhost' ? '127.0.0.1' : bind);
      const busy = LX.ports(M).some((x) => x.proto === 'tcp' && x.port === lport && (x.addr === addr || x.addr === '0.0.0.0' || addr === '0.0.0.0' || x.addr === '[::]'));
      if (busy || (lport < 1024 && user !== 'root')) { warns.push(`Warning: remote port forwarding failed for listen port ${lport}\n`); continue; }
      tuns.push({ addr, port: lport, thost, tport, user, host });
    }
    return { tuns, warns, user, host };
  }
  function knownHost(c, sm, cred, host, o) {
    const kh = cred.home + '/.ssh/known_hosts';
    const t = readText(sm, kh) || '';
    if (t.split('\n').some((l) => l.split(' ')[0].split(',').includes(host))) return true;
    return false;
  }

  async function runSshTunnel(c, args, viaAutossh) {
    const sm = c.m;
    const o = parseSsh(args);
    if (!o.target) { c.err('usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] ... destination [command]\n'); return 255; }
    const cred = c.cred;
    const res = openTunnel(sm, cred.name, o);
    if (res.err) { c.err(res.err); return res.code; }
    // 처음 접속하는 서버 확인
    if (!knownHost(c, sm, cred, res.host, o)) {
      const strict = o.opts.stricthostkeychecking;
      if (strict !== 'no' && strict !== 'accept-new') {
        if (o.opts.batchmode === 'yes' || viaAutossh && c.session.headless) { c.err('Host key verification failed.\n'); return 255; }
        c.out(`The authenticity of host '${res.host} (${PUBLIC_IP})' can't be established.\nED25519 key fingerprint is SHA256:${LX.fakeHash ? LX.fakeHash(PUBLIC_IP, 43).replace(/[^a-zA-Z0-9]/g, 'x') : hex(43)}.\nThis key is not known by any other names.\n`);
        const ans = await c.session.requestLine('Are you sure you want to continue connecting (yes/no/[fingerprint])? ', { answer: c.session.headless ? 'yes' : undefined });
        if (!/^y/i.test(String(ans || '').trim())) { c.err('Host key verification failed.\n'); return 255; }
      }
      try {
        sm.vfs.mkdir(cred.home + '/.ssh', null, { parents: true });
        sm.vfs.writeFile(cred.home + '/.ssh/known_hosts', `${res.host} ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI${hex(30)}\n`, null, { append: true });
        const n = sm.vfs.lookup(cred.home + '/.ssh/known_hosts'); if (n) { n.u = cred.uid; n.g = cred.gid; }
      } catch (e) { /* 무시 */ }
      c.err(`Warning: Permanently added '${res.host}' (ED25519) to the list of known hosts.\n`);
    }
    res.warns.forEach((w) => c.err(w));
    if (res.warns.length && o.opts.exitonforwardfailure === 'yes') { c.err(`Error: remote port forwarding failed for listen port ${o.R.join(', ')}\n`); return 255; }
    const id = ++rt.seq;
    const proc = sm.spawn(cred.name, (viaAutossh ? 'autossh ' : 'ssh ') + args.join(' '), o.f ? { ppid: 1, tty: '?' } : {});
    proc.onSignal = () => { rt.rtun = rt.rtun.filter((t) => t.id !== id); };
    res.tuns.forEach((t) => rt.rtun.push(Object.assign({ id, m: sm, proc }, t)));
    if (!o.N && !o.f && !o.rest.length && LX.canPush(c)) {
      c.err(dim('(가상 터미널: 터널 연습에서는 -N 을 붙여 셸 없이 연결만 유지하세요. 연결을 유지합니다 — Ctrl+C 로 끊기)') + '\n');
    }
    if (o.f) return 0;
    if (c.session.headless && !c.io.job) return 0;
    try {
      for (;;) { await c.sleep(1000); if (!rt.rtun.some((t) => t.id === id) || !sm.procs.includes(proc)) break; }
    } catch (e) {
      c.session.aborted = false;
    } finally {
      rt.rtun = rt.rtun.filter((t) => t.id !== id);
      sm.exitProc(proc);
    }
    return o.f ? 0 : 255;
  }

  const origSsh = LX.commands.ssh;
  def('ssh', async (c) => {
    if (isSchool(c.m) && (c.args.includes('-R') || c.args.some((x) => /^-R./.test(x)))) return runSshTunnel(c, c.args, false);
    if (isSchool(c.m)) {
      const o = parseSsh(c.args);
      if (o.target) {
        const r = openTunnel(c.m, c.cred.name, Object.assign({}, o, { R: [] }));
        if (r.err) { c.err(r.err); return r.code; }
        c.err(dim('(가상 터미널: 학교 서버에서는 Oracle 서버로 터널(-R) 연결만 연습합니다. 예: ssh -N -R 8080:localhost:80 student@203.0.113.25)') + '\n');
        return 0;
      }
    }
    return origSsh(c);
  });
  def('autossh', async (c) => {
    const a = c.args.slice();
    if (!a.length || a[0] === '-V') { c.out('autossh 1.4g\n'); return a.length ? 0 : 1; }
    return runSshTunnel(c, a, true);
  });

  // systemd 로 돌리는 터널: 학교 서버에서 켜져 있는 서비스의 ExecStart 를 읽는다
  let computing = false;
  function serviceTunnels() {
    if (computing) return [];
    computing = true;
    try { return serviceTunnels0(); } finally { computing = false; }
  }
  function serviceTunnels0() {
    if (!school && !(typeof localStorage !== 'undefined' && localStorage.getItem(SCHOOL_KEY))) return [];
    const sm = getSchool();
    const out = [];
    Object.entries(sm.state.services || {}).forEach(([name, s]) => {
      if (!s || !s.active) return;
      const d = LX.serviceDef(sm, name);
      if (!d || !d.custom || !/(^|\/)(autossh|ssh)\s/.test(d.exec) || !/\s-R\s?\S/.test(d.exec)) return;
      const args = splitArgs(d.exec).slice(1);
      const o = parseSsh(args);
      if (!o.N && !/autossh/.test(d.exec)) { /* 셸 없이 유지하려면 -N 이 필요하지만 그대로 둔다 */ }
      const res = openTunnel(sm, d.user || 'root', o);
      if (res.err) { s.c70err = res.err.trim(); return; }
      const cred = sm.credFor(d.user || 'root');
      const kh = readText(sm, (cred ? cred.home : '/root') + '/.ssh/known_hosts') || '';
      if (o.opts.stricthostkeychecking !== 'no' && o.opts.stricthostkeychecking !== 'accept-new' && !kh.includes(res.host)) { s.c70err = 'Host key verification failed.'; return; }
      s.c70err = null;
      res.tuns.forEach((t) => out.push(Object.assign({ id: 'svc:' + name, m: sm, svc: name }, t)));
    });
    return out;
  }
  LX.c70tunnels = () => { rt.rtun = rt.rtun.filter((t) => !t.proc || t.m.procs.includes(t.proc)); return rt.rtun.concat(serviceTunnels()); };

  LX.extraPorts = function (m) {
    if (m !== mainM()) return [];
    return LX.c70tunnels().map((t, i) => ({ proto: 'tcp', addr: t.addr, port: t.port, proc: 'sshd', pid: 3900 + i, c70tun: t }));
  };
  LX.c70tunServe = async function (t, req) {
    const r = await LX.http(t.m, `http://${t.thost}:${t.tport}${req.path}`, { method: req.method, headers: req.headers, depth: req.depth });
    if (r.error) return { error: 'Empty reply from server', code: 52 };
    return { status: r.status, headers: r.headers, body: r.body };
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* school 명령을 가상 서버에 설치 (새 서버 · 예전에 저장된 서버 모두) */
(function (g) {
  const LX = g.LX;
  if (!LX) return;
  const origBuild = LX.buildImage;
  LX.buildImage = function (m) { origBuild(m); try { if (!m.opts || !m.opts.fresh) m.installBin('school', '/usr/local/bin'); } catch (e) { /* 무시 */ } };
  function ensure(m) {
    if (!m || (m.state && m.state.c70role === 'school')) return;
    try {
      if (!m.vfs.lookup('/usr/local/bin/school')) m.installBin('school', '/usr/local/bin');
      Object.entries(LX.C70BIN || {}).forEach(([n, src]) => { if (!m.vfs.lookup('/usr/local/bin/' + n)) m.vfs.writeFile('/usr/local/bin/' + n, src, null, { mode: 0o755 }); });
    } catch (e) { /* 무시 */ }
  }
  let tries = 0;
  const t = setInterval(() => { const m = g.UbuntuApp && g.UbuntuApp.term && g.UbuntuApp.term.m; if (m) { ensure(m); m.on && m.on((ev) => { if (ev === 'reset') ensure(m); }); clearInterval(t); } else if (++tries > 200) clearInterval(t); }, 100);
})(typeof window !== 'undefined' ? window : globalThis);
