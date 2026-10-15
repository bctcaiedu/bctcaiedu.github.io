
/* 가상 리눅스 — 응용 프로그램 명령 (nginx · apache · php · node · python · git · certbot · fail2ban ...) */
(function (G) {
  const LX = G.LX = G.LX || {};
  const def = LX.def;
  const P = () => LX.path;

  // ======================================================================= nginx
  def('nginx', async (c) => {
    const m = c.m;
    const a = c.args;
    if (a.includes('-v')) { c.err('nginx version: nginx/1.24.0 (Ubuntu)\n'); return 0; }
    if (a.includes('-V')) { c.err('nginx version: nginx/1.24.0 (Ubuntu)\nbuilt with OpenSSL 3.0.13 30 Jan 2024\nTLS SNI support enabled\nconfigure arguments: --with-cc-opt=\'-g -O2\' --prefix=/usr/share/nginx --conf-path=/etc/nginx/nginx.conf --http-log-path=/var/log/nginx/access.log --error-log-path=stderr --lock-path=/var/lock/nginx.lock --pid-path=/run/nginx.pid --modules-path=/usr/lib/nginx/modules --with-http_ssl_module --with-http_v2_module --with-http_realip_module --with-http_gzip_static_module --with-stream=dynamic\n'); return 0; }
    const test = a.includes('-t') || a.includes('-T');
    if (test) {
      if (c.cred.uid !== 0) {
        c.err('2026/09/27 07:12:24 [warn] 2481#2481: the "user" directive makes sense only if the master process runs with super-user privileges, ignored in /etc/nginx/nginx.conf:1\nnginx: [alert] could not open error log file: open() "/var/log/nginx/error.log" failed (13: Permission denied)\n');
      }
      const t = LX.nginx.test(m);
      if (!t.ok) { c.err(t.errors[0] + '\nnginx: configuration file /etc/nginx/nginx.conf test failed\n'); return 1; }
      if (c.cred.uid !== 0) { c.err('nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\n2026/09/27 07:12:24 [emerg] 2481#2481: open() "/run/nginx.pid" failed (13: Permission denied)\nnginx: configuration file /etc/nginx/nginx.conf test failed\n'); return 1; }
      c.err('nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful\n');
      if (a.includes('-T')) {
        const files = ['/etc/nginx/nginx.conf'].concat(LX.globFiles(m, '/etc/nginx/conf.d/*.conf'), LX.globFiles(m, '/etc/nginx/sites-enabled/*'));
        files.forEach((f) => { c.out(`# configuration file ${f}:\n${c.fs.readFile(f, null)}\n`); });
      }
      return 0;
    }
    const si = a.indexOf('-s');
    if (si >= 0) {
      const sig = a[si + 1];
      if (c.cred.uid !== 0) { c.err('nginx: [alert] could not open error log file: open() "/var/log/nginx/error.log" failed (13: Permission denied)\n2026/09/27 07:12:24 [notice] 2490#2490: signal process started\n2026/09/27 07:12:24 [alert] 2490#2490: kill(1234, 1) failed (1: Operation not permitted)\n'); return 1; }
      const s = m.state.services.nginx;
      if (!s || !s.active) { c.err('2026/09/27 07:12:24 [notice] 2490#2490: signal process started\n2026/09/27 07:12:24 [error] 2490#2490: invalid PID number "" in "/run/nginx.pid"\n'); return 1; }
      if (sig === 'reload') { const t = LX.nginx.test(m); if (!t.ok) { c.err(t.errors[0] + '\n'); return 1; } LX.log(m, 'nginx', 'signal process started'); return 0; }
      if (sig === 'stop' || sig === 'quit') { LX.svcStop(m, 'nginx'); return 0; }
      return 0;
    }
    c.err('nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)\n\x1b[2m(가상 터미널: nginx 는 sudo systemctl start nginx 로 실행하세요)\x1b[0m\n');
    return 1;
  });

  // ======================================================================= apache
  def(['apache2ctl', 'apachectl', 'apache2'], async (c) => {
    const m = c.m;
    const a = c.args[0] || '';
    if (a === '-v' || a === '-V') { c.out('Server version: Apache/2.4.58 (Ubuntu)\nServer built:   2025-08-11T11:10:09\n'); return 0; }
    if (a === 'configtest' || a === '-t') {
      const t = LX.apache.test(m);
      if (!t.ok) { c.err(t.errors[0] + '\n'); c.out('Action \'configtest\' failed.\nThe Apache error log may have more information.\n'); return 1; }
      const cfg = t.cfg;
      if (!/^\s*ServerName/m.test(c.fs.readFile('/etc/apache2/apache2.conf', null))) c.err('AH00558: apache2: Could not reliably determine the server\'s fully qualified domain name, using 127.0.1.1. Set the \'ServerName\' directive globally to suppress this message\n');
      cfg.vhosts.forEach((v) => { if (!c.fs.lookup(v.root)) c.err(`AH00112: Warning: DocumentRoot [${v.root}] does not exist\n`); });
      c.err('Syntax OK\n');
      return 0;
    }
    if (a === '-S') {
      const cfg = LX.apache.load(m);
      c.out(`VirtualHost configuration:\n${cfg.vhosts.map((v) => `*:${v.port}                   ${v.name || '127.0.1.1'} (${v.file}:1)`).join('\n')}\nServerRoot: "/etc/apache2"\nMain DocumentRoot: "/var/www/html"\nMain ErrorLog: "/var/log/apache2/error.log"\nMutex default: dir="/var/run/apache2/" mechanism=default \nPidFile: "/var/run/apache2/apache2.pid"\nDefine: DUMP_VHOSTS\nDefine: DUMP_RUN_CFG\nUser: name="www-data" id=33\nGroup: name="www-data" id=33\n`);
      return 0;
    }
    if (a === '-M') { c.out('Loaded Modules:\n' + c.fs.readdir('/etc/apache2/mods-enabled', null).filter((f) => f.endsWith('.load')).map((f) => ` ${f.replace('.load', '')}_module (shared)`).join('\n') + '\n'); return 0; }
    if (/^(start|stop|restart|graceful|reload)$/.test(a)) return LX.commands.systemctl(Object.assign({}, c, { args: [a === 'graceful' ? 'reload' : a, 'apache2'] }));
    c.err('Usage: /usr/sbin/apache2ctl start|stop|restart|graceful|graceful-stop|configtest|status|fullstatus|help\n       /usr/sbin/apache2ctl <apache2 args>\n');
    return 1;
  });

  function a2(kind, enable) {
    return async (c) => {
      const m = c.m;
      if (c.cred.uid !== 0) { c.err(`ERROR: ${c.name} must be run as root\n`); return 1; }
      const names = c.args.filter((a) => !a.startsWith('-'));
      if (!names.length) { c.out(`Your choices are: ${c.fs.readdir(`/etc/apache2/${kind}-available`, null).map((f) => f.replace(/\.(conf|load)$/, '')).filter((v, i, s) => s.indexOf(v) === i).join(' ')}\n`); return 0; }
      let restart = false;
      for (let n of names) {
        n = n.replace(/\.(conf|load)$/, '');
        const ext = kind === 'mods' ? '.load' : '.conf';
        const avail = `/etc/apache2/${kind}-available/${n}${ext}`;
        const en = `/etc/apache2/${kind}-enabled/${n}${ext}`;
        const label = { sites: 'Site', mods: 'Module', conf: 'Conf' }[kind];
        if (!c.fs.lookup(avail)) { c.err(`ERROR: ${label} ${n} does not exist!\n`); return 1; }
        if (enable) {
          if (c.fs.lookup(en, false)) { c.out(`${label} ${n} already enabled\n`); continue; }
          c.fs.symlink(`../${kind}-available/${n}${ext}`, en, null);
          if (kind === 'mods' && c.fs.lookup(`/etc/apache2/mods-available/${n}.conf`) && !c.fs.lookup(`/etc/apache2/mods-enabled/${n}.conf`, false)) c.fs.symlink(`../mods-available/${n}.conf`, `/etc/apache2/mods-enabled/${n}.conf`, null);
          c.out(`Enabling ${label.toLowerCase()} ${n}.\n`);
          if (kind === 'mods') restart = true;
        } else {
          if (!c.fs.lookup(en, false)) { c.out(`${label} ${n} already disabled\n`); continue; }
          c.fs.unlink(en, null);
          c.out(`${kind === 'mods' ? 'Module' : label} ${n} disabled.\n`);
          if (kind === 'mods') restart = true;
        }
      }
      c.out(`To activate the new configuration, you need to run:\n  systemctl ${restart ? 'restart' : 'reload'} apache2\n`);
      return 0;
    };
  }
  def('a2ensite', a2('sites', true)); def('a2dissite', a2('sites', false));
  def('a2enmod', a2('mods', true)); def('a2dismod', a2('mods', false));
  def('a2enconf', a2('conf', true)); def('a2disconf', a2('conf', false));
  def('a2query', async (c) => { if (c.args[0] === '-s') c.fs.readdir('/etc/apache2/sites-enabled', null).forEach((f) => c.out(`${f.replace('.conf', '')} (enabled by site administrator)\n`)); else if (c.args[0] === '-m') c.fs.readdir('/etc/apache2/mods-enabled', null).filter((f) => f.endsWith('.load')).forEach((f) => c.out(`${f.replace('.load', '')} (enabled by maintainer script)\n`)); return 0; });

  def('htpasswd', async (c) => {
    const args = c.args.slice();
    const create = args.some((a) => /^-\w*c/.test(a));
    const batch = args.some((a) => /^-\w*b/.test(a));
    const ops = args.filter((a) => !a.startsWith('-'));
    const [file, user] = ops;
    if (!file || !user) { c.err('Usage:\n\thtpasswd [-cimB25dpsDv] [-C cost] [-r rounds] passwordfile username\n\thtpasswd -b[cmB25dpsDv] [-C cost] [-r rounds] passwordfile username password\n'); return 1; }
    let pw = batch ? ops[2] : null;
    if (!batch) {
      pw = await c.session.requestLine('New password: ', { secret: true });
      const p2 = await c.session.requestLine('Re-type new password: ', { secret: true });
      if (pw !== p2) { c.err('htpasswd: password verification error\n'); return 3; }
    }
    const abs = c.resolve(file);
    let lines = [];
    if (!create) { try { lines = c.fs.readFile(abs, c.cred).split('\n').filter(Boolean); } catch (e) { c.err(`htpasswd: cannot modify file ${file}; use '-c' to create it\n`); return 1; } }
    const exists = lines.some((l) => l.startsWith(user + ':'));
    lines = lines.filter((l) => !l.startsWith(user + ':')).concat(`${user}:$apr1$${Math.random().toString(36).slice(2, 10)}$${LX.fakeHash(pw || '', 22).replace(/[^a-zA-Z0-9]/g, '/')}`);
    try { c.fs.writeFile(abs, lines.join('\n') + '\n', c.cred, { mode: 0o644 }); } catch (e) { c.err(`htpasswd: cannot create file ${file}\n`); return 1; }
    c.out(`${create ? `Adding password for user ${user}` : exists ? `Updating password for user ${user}` : `Adding password for user ${user}`}\n`);
    return 0;
  });

  def('ab', async (c) => {
    const n = +((c.args[c.args.indexOf('-n') + 1]) || 1);
    const conc = +((c.args[c.args.indexOf('-c') + 1]) || 1);
    const url = c.args.filter((a) => /^https?:/.test(a))[0];
    if (!url) { c.err('ab: wrong number of arguments\nUsage: ab [options] [http[s]://]hostname[:port]/path\n'); return 22; }
    c.out(`This is ApacheBench, Version 2.3 <$Revision: 1913912 $>\nCopyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/\nLicensed to The Apache Software Foundation, http://www.apache.org/\n\nBenchmarking ${url.replace(/^https?:\/\//, '').split('/')[0]} (be patient).....done\n\n\n`);
    const r = await LX.httpReq(c, url, {});
    if (r.error) { c.err(`apr_socket_recv: Connection refused (111)\n`); return 1; }
    const t = (0.01 + n * 0.0003).toFixed(3);
    c.out(`Server Software:        ${(r.headers || {}).Server || ''}\nServer Hostname:        ${url.replace(/^https?:\/\//, '').split(/[/:]/)[0]}\nServer Port:            ${r.port}\n\nDocument Path:          ${(/^https?:\/\/[^/]+(\/.*)?$/.exec(url) || [])[1] || '/'}\nDocument Length:        ${LX.byteLen(r.body)} bytes\n\nConcurrency Level:      ${conc}\nTime taken for tests:   ${t} seconds\nComplete requests:      ${n}\nFailed requests:        0\nTotal transferred:      ${n * (LX.byteLen(r.body) + 240)} bytes\nHTML transferred:       ${n * LX.byteLen(r.body)} bytes\nRequests per second:    ${(n / +t).toFixed(2)} [#/sec] (mean)\nTime per request:       ${(+t * 1000 / n * conc).toFixed(3)} [ms] (mean)\nTime per request:       ${(+t * 1000 / n).toFixed(3)} [ms] (mean, across all concurrent requests)\nTransfer rate:          ${(n * (LX.byteLen(r.body) + 240) / 1024 / +t).toFixed(2)} [Kbytes/sec] received\n`);
    return 0;
  });

  // ======================================================================= PHP
  def(['php', 'php8.3'], async (c) => {
    const a = c.args;
    if (a[0] === '-v' || a[0] === '--version') { c.out('PHP 8.3.6 (cli) (built: Jul 14 2025 18:30:55) (NTS)\nCopyright (c) The PHP Group\nZend Engine v4.3.6, Copyright (c) Zend Technologies\n    with Zend OPcache v8.3.6, Copyright (c), by Zend Technologies\n'); return 0; }
    if (a[0] === '-m') { c.out('[PHP Modules]\nCore\ndate\nfilter\nhash\njson\nlibxml\nopenssl\npcre\nreadline\nsession\nstandard\nzlib\n' + (c.m.state.pkgs['php-mysql'] ? 'mysqli\nmysqlnd\npdo_mysql\n' : '') + '\n[Zend Modules]\nZend OPcache\n\n'); return 0; }
    if (a[0] === '-r') { c.out(LX.php(c.m, '<?php ' + (a[1] || '') + ' ?>')); return 0; }
    if (a[0] === '-S') {
      const [host, port] = (a[1] || '').split(':');
      const docroot = a.indexOf('-t') >= 0 ? c.resolve(a[a.indexOf('-t') + 1]) : c.cwd;
      return devServer(c, +port || 8000, host, 'php', docroot);
    }
    if (a[0] === '-i') { c.out('phpinfo()\nPHP Version => 8.3.6\n\nSystem => Linux ' + c.m.hostname() + ' ' + LX.OS.kernel + ' x86_64\nServer API => Command Line Interface\n'); return 0; }
    const f = a.find((x) => !x.startsWith('-'));
    if (!f) { c.err('\x1b[2m(가상 터미널: 대화형 php 는 지원하지 않습니다. php -r \'echo "hi";\' 또는 php 파일.php)\x1b[0m\n'); return 1; }
    try { c.out(LX.php(c.m, c.fs.readFile(c.resolve(f), c.cred))); } catch (e) { c.err(`Could not open input file: ${f}\n`); return 1; }
    return 0;
  });

  // ======================================================================= 개발용 웹 서버 (python -m http.server, php -S, node)
  async function devServer(c, port, host, kind, root, handler) {
    const m = c.m;
    if (LX.ports(m).some((p) => p.proto === 'tcp' && p.port === port)) {
      if (kind === 'python') c.err(`Traceback (most recent call last):\n  File "<frozen runpy>", line 198, in _run_module_as_main\n  ...\nOSError: [Errno 98] Address already in use\n`);
      else if (kind === 'node') c.err(`node:events:497\n      throw er; // Unhandled 'error' event\n      ^\n\nError: listen EADDRINUSE: address already in use :::${port}\n    at Server.setupListenHandle [as _listen2] (node:net:1872:16)\n`);
      else c.err(`[${new Date().toUTCString()}] Failed to listen on ${host || 'localhost'}:${port} (reason: Address already in use)\n`);
      return 1;
    }
    if (port < 1024 && c.cred.uid !== 0) {
      if (kind === 'python') c.err('PermissionError: [Errno 13] Permission denied\n');
      else c.err(`Error: listen EACCES: permission denied 0.0.0.0:${port}\n`);
      return 1;
    }
    m.runtime = m.runtime || { servers: {} };
    const log = (req, st) => {
      if (kind === 'python') c.err(`127.0.0.1 - - [${LX.strftime(m, '%d/%b/%Y %H:%M:%S', m.now())}] "${req.method} ${req.path} HTTP/1.1" ${st} -\n`);
      else if (kind === 'php') c.err(`[${LX.strftime(m, '%a %b %e %H:%M:%S %Y', m.now())}] 127.0.0.1:${50000 + Math.floor(Math.random() * 9999)} [${st}]: ${req.method} ${req.path}\n`);
    };
    const srv = {
      proc: kind === 'python' ? 'python3' : kind, pid: c.proc ? c.proc.pid : m.nextPid(), addr: host && host !== '0.0.0.0' && host !== 'localhost' ? host : host === 'localhost' ? '127.0.0.1' : '0.0.0.0',
      handle: handler || (async (req) => {
        const upath = decodeURIComponent(req.path.split('?')[0]);
        const abs = LX.path.normalize(root, '.' + upath);
        const n = m.vfs.lookup(abs);
        if (n && n.t === 'd') {
          for (const ix of kind === 'php' ? ['index.php', 'index.html'] : ['index.html', 'index.htm']) {
            const f = abs.replace(/\/$/, '') + '/' + ix;
            if (m.vfs.lookup(f)) { const t = m.vfs.readFile(f, null); log(req, 200); return { status: 200, headers: { Server: kind === 'python' ? 'SimpleHTTP/0.6 Python/3.12.3' : 'PHP 8.3.6 Development Server', 'Content-Type': 'text/html' }, body: ix.endsWith('.php') ? LX.php(m, t) : t }; }
          }
          if (kind === 'php') { log(req, 404); return { status: 404, headers: {}, body: '<!doctype html><html><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>The requested resource <code class="url">/</code> was not found on this server.</p></body></html>' }; }
          const names = m.vfs.readdir(abs, null);
          log(req, 200);
          return { status: 200, headers: { Server: 'SimpleHTTP/0.6 Python/3.12.3', 'Content-Type': 'text/html; charset=utf-8' }, body: `<!DOCTYPE HTML>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Directory listing for ${upath}</title>\n</head>\n<body>\n<h1>Directory listing for ${upath}</h1>\n<hr>\n<ul>\n${names.map((x) => { const d = m.vfs.lookup(abs.replace(/\/$/, '') + '/' + x); return `<li><a href="${x}${d && d.t === 'd' ? '/' : ''}">${x}${d && d.t === 'd' ? '/' : ''}</a></li>`; }).join('\n')}\n</ul>\n<hr>\n</body>\n</html>\n` };
        }
        if (!n) { log(req, 404); return { status: 404, headers: { 'Content-Type': 'text/html' }, body: kind === 'python' ? '<!DOCTYPE HTML>\n<html lang="en">\n    <head>\n        <meta charset="utf-8">\n        <title>Error response</title>\n    </head>\n    <body>\n        <h1>Error response</h1>\n        <p>Error code: 404</p>\n        <p>Message: File not found.</p>\n    </body>\n</html>\n' : 'Not Found' }; }
        const t = m.vfs.readFile(abs, null);
        log(req, 200);
        return { status: 200, headers: { 'Content-Type': /\.html?$/.test(abs) ? 'text/html' : 'text/plain' }, body: /\.php$/.test(abs) && kind === 'php' ? LX.php(m, t) : t };
      })
    };
    m.runtime.servers[port] = srv;
    if (kind === 'python') c.out(`Serving HTTP on ${host || '0.0.0.0'} port ${port} (http://${host || '0.0.0.0'}:${port}/) ...\n`);
    if (kind === 'php') c.err(`[${LX.strftime(m, '%a %b %e %H:%M:%S %Y', m.now())}] PHP 8.3.6 Development Server (http://${host || 'localhost'}:${port}) started\n`);
    if (c.session.headless && !c.io.job) { return 0; }
    try {
      for (;;) { await c.sleep(1000); if (!m.runtime.servers[port]) break; }
    } catch (e) {
      if (kind === 'python') c.out('\nKeyboard interrupt received, exiting.\n');
      c.session.aborted = false;
    } finally {
      delete m.runtime.servers[port];
    }
    return kind === 'python' ? 0 : 130;
  }
  LX.devServer = devServer;

  // ======================================================================= Python
  def(['python3', 'python3.12'], async (c) => {
    const a = c.args;
    if (a[0] === '--version' || a[0] === '-V') { c.out('Python 3.12.3\n'); return 0; }
    if (a[0] === '-m') {
      const mod = a[1];
      if (mod === 'http.server') {
        const rest = a.slice(2);
        const port = +(rest.find((x) => /^\d+$/.test(x)) || 8000);
        const bi = rest.indexOf('--bind') >= 0 ? rest.indexOf('--bind') : rest.indexOf('-b');
        const di = rest.indexOf('--directory') >= 0 ? rest.indexOf('--directory') : rest.indexOf('-d');
        return devServer(c, port, bi >= 0 ? rest[bi + 1] : null, 'python', di >= 0 ? c.resolve(rest[di + 1]) : c.cwd);
      }
      if (mod === 'venv') {
        const dir = a[2];
        if (!dir) { c.err('usage: venv [-h] [--system-site-packages] [--symlinks | --copies] [--clear]\n            [--upgrade] [--without-pip] [--prompt PROMPT] [--upgrade-deps]\n            ENV_DIR [ENV_DIR ...]\nvenv: error: the following arguments are required: ENV_DIR\n'); return 2; }
        if (!c.m.state.pkgs['python3-venv']) { c.out(`The virtual environment was not created successfully because ensurepip is not\navailable.  On Debian/Ubuntu systems, you need to install the python3-venv\npackage using the following command.\n\n    apt install python3.12-venv\n\nYou may need to use sudo with that command.  After installing the python3-venv\npackage, recreate your virtual environment.\n\nFailing command: ${c.resolve(dir)}/bin/python3\n\n`); return 1; }
        const abs = c.resolve(dir);
        try {
          ['bin', 'include/python3.12', 'lib/python3.12/site-packages'].forEach((d) => c.fs.mkdir(abs + '/' + d, c.cred, { parents: true }));
          c.fs.writeFile(abs + '/pyvenv.cfg', `home = /usr/bin\ninclude-system-site-packages = false\nversion = 3.12.3\nexecutable = /usr/bin/python3.12\ncommand = /usr/bin/python3 -m venv ${abs}\n`, c.cred);
          c.fs.writeFile(abs + '/bin/activate', `# This file must be used with "source bin/activate" *from bash*\n# You cannot run it directly\n\ndeactivate () {\n    if [ -n "\${_OLD_VIRTUAL_PATH:-}" ] ; then\n        PATH="\${_OLD_VIRTUAL_PATH:-}"\n        export PATH\n        unset _OLD_VIRTUAL_PATH\n    fi\n    if [ -n "\${_OLD_VIRTUAL_PS1:-}" ] ; then\n        PS1="\${_OLD_VIRTUAL_PS1:-}"\n        export PS1\n        unset _OLD_VIRTUAL_PS1\n    fi\n    unset VIRTUAL_ENV\n    unset VIRTUAL_ENV_PROMPT\n    if [ ! "\${1:-}" = "nondestructive" ] ; then\n        unset -f deactivate\n    fi\n}\n\ndeactivate nondestructive\n\nVIRTUAL_ENV="${abs}"\nexport VIRTUAL_ENV\n\n_OLD_VIRTUAL_PATH="$PATH"\nPATH="$VIRTUAL_ENV/bin:$PATH"\nexport PATH\n\n_OLD_VIRTUAL_PS1="\${PS1:-}"\nPS1="(${P().basename(abs)}) \${PS1:-}"\nexport PS1\nVIRTUAL_ENV_PROMPT="(${P().basename(abs)}) "\nexport VIRTUAL_ENV_PROMPT\n`, c.cred);
          ['python', 'python3', 'python3.12'].forEach((b) => c.fs.writeFile(`${abs}/bin/${b}`, LX.ELF + 'python3\n', c.cred, { mode: 0o755 }));
          ['pip', 'pip3'].forEach((b) => c.fs.writeFile(`${abs}/bin/${b}`, LX.ELF + 'pip3\n', c.cred, { mode: 0o755 }));
        } catch (e) { c.err(`Error: [Errno 13] Permission denied: '${abs}'\n`); return 1; }
        return 0;
      }
      if (mod === 'pip') return LX.commands.pip3(Object.assign({}, c, { args: a.slice(2) }));
      if (mod === 'json.tool') { const t = await c.readStdin(); try { c.out(JSON.stringify(JSON.parse(t), null, 4) + '\n'); } catch (e) { c.err('Expecting value: line 1 column 1 (char 0)\n'); return 1; } return 0; }
      c.err(`/usr/bin/python3: No module named ${mod}\n`);
      return 1;
    }
    if (a[0] === '-c') return pyRun(c, a[1] || '');
    const f = a.find((x) => !x.startsWith('-'));
    if (f) {
      let src;
      try { src = c.fs.readFile(c.resolve(f), c.cred); } catch (e) { c.err(`python3: can't open file '${c.resolve(f)}': [Errno 2] No such file or directory\n`); return 2; }
      return pyRun(c, src, f);
    }
    if (c.stdin) return pyRun(c, c.stdin.readAll());
    c.out('Python 3.12.3 (main, Aug 14 2025, 17:47:21) [GCC 13.3.0] on linux\nType "help", "copyright", "credits" or "license" for more information.\n');
    c.err('\x1b[2m(가상 터미널: 대화형 파이썬(REPL)은 지원하지 않습니다. 간단한 print · 계산은 python3 -c "print(1+2)" 로 해 보세요)\x1b[0m\n');
    return 0;
  });

  /** 아주 작은 파이썬: print · 변수 · 산술 · f-string · for range */
  function pyRun(c, src, file) {
    const vars = {};
    const lines = src.split('\n');
    const evalExpr = (e) => {
      e = e.trim();
      const fstr = /^f(["'])(.*)\1$/.exec(e);
      if (fstr) return fstr[2].replace(/\{([^}]+)\}/g, (mm, x) => String(evalExpr(x)));
      if (/^(["']).*\1$/.test(e)) return e.slice(1, -1).replace(/\\n/g, '\n');
      if (/^"""[\s\S]*"""$/.test(e)) return e.slice(3, -3);
      const js = e.replace(/\b([A-Za-z_]\w*)\b/g, (mm, id) => (id in vars ? JSON.stringify(vars[id]) : ['True', 'False', 'None', 'len', 'str', 'int', 'abs', 'round', 'min', 'max', 'sum'].includes(id) ? mm : (() => { throw new Error(`NameError: name '${id}' is not defined`); })()))
        .replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null').replace(/\/\//g, '/').replace(/\*\*/g, '**');
      if (/[^\d\s+\-*/%().,<>=!&|"'\w[\]]/.test(js)) throw new Error('SyntaxError: invalid syntax');
      // eslint-disable-next-line no-new-func
      return Function('len', 'str', 'int', 'abs', 'round', 'min', 'max', 'sum', `"use strict";return (${js})`)((x) => x.length, String, (x) => Math.trunc(+x), Math.abs, Math.round, Math.min, Math.max, (x) => x.reduce((s, y) => s + y, 0));
    };
    const fmt = (v) => (v === true ? 'True' : v === false ? 'False' : v === null ? 'None' : Array.isArray(v) ? '[' + v.map((x) => (typeof x === 'string' ? `'${x}'` : fmt(x))).join(', ') + ']' : String(v));
    try {
      for (let k = 0; k < lines.length; k++) {
        const line = lines[k];
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        let r;
        if ((r = /^print\((.*)\)$/.exec(t))) {
          const parts = r[1] ? splitArgs(r[1]).filter((x) => !/^(sep|end)=/.test(x)) : [];
          c.out(parts.map((p) => fmt(evalExpr(p))).join(' ') + '\n');
          continue;
        }
        if ((r = /^([A-Za-z_]\w*)\s*=\s*(.+)$/.exec(t))) { vars[r[1]] = evalExpr(r[2]); continue; }
        if ((r = /^for\s+(\w+)\s+in\s+range\((.+)\):$/.exec(t))) {
          const args = splitArgs(r[2]).map((x) => +evalExpr(x));
          const [s0, e0, st0] = args.length === 1 ? [0, args[0], 1] : [args[0], args[1], args[2] || 1];
          const body = [];
          while (k + 1 < lines.length && /^\s+/.test(lines[k + 1])) body.push(lines[++k].trim());
          for (let i = s0; st0 > 0 ? i < e0 : i > e0; i += st0) {
            vars[r[1]] = i;
            for (const b of body) { const pr = /^print\((.*)\)$/.exec(b); if (pr) c.out(splitArgs(pr[1]).map((p) => fmt(evalExpr(p))).join(' ') + '\n'); else { const as = /^([A-Za-z_]\w*)\s*(\+?)=\s*(.+)$/.exec(b); if (as) vars[as[1]] = as[2] ? vars[as[1]] + evalExpr(as[3]) : evalExpr(as[3]); } }
          }
          continue;
        }
        if (/^(import|from)\s/.test(t)) { const mod = t.split(/\s+/)[1]; if (!['os', 'sys', 'time', 'math', 'json', 'datetime', 'random', 'socket', 'platform'].includes(mod)) throw new Error(`ModuleNotFoundError: No module named '${mod}'`); continue; }
        throw new Error(`(가상 터미널) 이 파이썬 문법은 실행할 수 없습니다: ${t}`);
      }
    } catch (e) {
      if (/가상 터미널/.test(e.message)) { c.err(e.message + '\n\x1b[2m(간단한 print · 변수 · for range 만 지원합니다. 실제 파이썬은 실제 Ubuntu 에서 실행하세요)\x1b[0m\n'); return 1; }
      c.err(`Traceback (most recent call last):\n  File "${file || '<string>'}", line 1, in <module>\n${e.message}\n`);
      return 1;
    }
    return 0;
  }
  function splitArgs(s) {
    const out = [];
    let cur = '', q = null, d = 0;
    for (const ch of s) {
      if (q) { cur += ch; if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
      if (ch === '(' || ch === '[') d++;
      if (ch === ')' || ch === ']') d--;
      if (ch === ',' && !d) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  def(['pip3', 'pip'], async (c) => {
    const a = c.args;
    const venv = c.env('VIRTUAL_ENV');
    if (a[0] === '--version' || a[0] === '-V') { c.out(`pip 24.0 from ${venv ? venv + '/lib/python3.12/site-packages/pip' : '/usr/lib/python3/dist-packages/pip'} (python 3.12)\n`); return 0; }
    if (a[0] === 'list' || a[0] === 'freeze') {
      const pk = venv ? ((c.m.state.venvPkgs || {})[venv] || []) : [];
      if (a[0] === 'freeze') { pk.forEach((p) => c.out(`${p}==3.0.3\n`)); return 0; }
      c.out('Package    Version\n---------- -------\n' + ['pip 24.0'].concat(pk.map((p) => `${p} 3.0.3`)).map((x) => { const [n, v] = x.split(' '); return `${n.padEnd(10)} ${v}`; }).join('\n') + '\n');
      return 0;
    }
    if (a[0] === 'install') {
      if (!venv && !a.includes('--break-system-packages')) {
        c.err(`error: externally-managed-environment\n\n× This environment is externally managed\n╰─> To install Python packages system-wide, try apt install\n    python3-xyz, where xyz is the package you are trying to\n    install.\n    \n    If you wish to install a non-Debian-packaged Python package,\n    create a virtual environment using python3 -m venv path/to/venv.\n    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make\n    sure you have python3-full installed.\n    \n    If you wish to install a non-Debian packaged Python application,\n    it may be easiest to use pipx install xyz, which will manage a\n    virtual environment for you. Make sure you have pipx installed.\n    \n    See /usr/share/doc/python3.12/README.venv for more information.\n\nnote: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.\nhint: See PEP 668 for the detailed specification.\n`);
        return 1;
      }
      const pkgs = a.slice(1).filter((x) => !x.startsWith('-'));
      if (LX.internetDown(c.m)) { c.err(`WARNING: Retrying (Retry(total=4, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError'\nERROR: Could not find a version that satisfies the requirement ${pkgs[0]}\n`); return 1; }
      for (const p of pkgs) { c.out(`Collecting ${p}\n  Downloading ${p}-3.0.3-py3-none-any.whl.metadata (3.1 kB)\n`); await c.sleep(c.session.headless ? 0 : 300); }
      c.out(`Installing collected packages: ${pkgs.join(', ')}\nSuccessfully installed ${pkgs.map((p) => `${p}-3.0.3`).join(' ')}\n`);
      c.m.state.venvPkgs = c.m.state.venvPkgs || {};
      c.m.state.venvPkgs[venv || '/usr'] = [...new Set(((c.m.state.venvPkgs[venv || '/usr']) || []).concat(pkgs))];
      return 0;
    }
    c.err(`ERROR: unknown command "${a[0] || ''}"\n`);
    return 1;
  });

  // ======================================================================= Node.js
  def(['node', 'nodejs'], async (c) => {
    const a = c.args;
    if (a[0] === '-v' || a[0] === '--version') { c.out('v18.19.1\n'); return 0; }
    let src, file = '[eval]';
    if (a[0] === '-e' || a[0] === '-p') src = a[0] === '-p' ? `console.log(${a[1]})` : a[1];
    else if (a[0]) { file = c.resolve(a[0]); try { src = c.fs.readFile(file, c.cred); } catch (e) { c.err(`node:internal/modules/cjs/loader:1143\n  throw err;\n  ^\n\nError: Cannot find module '${file}'\n    at Module._resolveFilename (node:internal/modules/cjs/loader:1140:15)\n    at Module._load (node:internal/modules/cjs/loader:981:27)\n    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:128:12)\n    at node:internal/main/run_main_module:28:49 {\n  code: 'MODULE_NOT_FOUND',\n  requireStack: []\n}\n\nNode.js v18.19.1\n`); return 1; } }
    else { c.out('Welcome to Node.js v18.19.1.\nType ".help" for more information.\n'); c.err('\x1b[2m(가상 터미널: node REPL 은 지원하지 않습니다. node -e "console.log(1+2)" 또는 node 파일.js)\x1b[0m\n'); return 0; }
    return runNode(c, src, file);
  });

  async function runNode(c, src, file) {
    const m = c.m;
    const servers = [];
    const log = (...x) => c.out(x.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ') + '\n');
    const dir = file === '[eval]' ? c.cwd : P().dirname(file);
    const hasModule = (name) => !!c.fs.lookup(`${dir}/node_modules/${name}`);
    const makeRes = () => {
      const res = { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: '', done: false };
      res.writeHead = (s, h) => { res.statusCode = s; Object.assign(res.headers, h || {}); return res; };
      res.setHeader = (k, v) => { res.headers[k] = v; };
      res.write = (s) => { res.body += s; };
      res.end = (s) => { if (s != null) res.body += s; res.done = true; };
      res.status = (s) => { res.statusCode = s; return res; };
      res.send = (s) => { if (typeof s === 'object') { res.headers['Content-Type'] = 'application/json; charset=utf-8'; res.body += JSON.stringify(s); } else { res.headers['Content-Type'] = 'text/html; charset=utf-8'; res.body += String(s); } res.done = true; };
      res.json = (o) => { res.headers['Content-Type'] = 'application/json; charset=utf-8'; res.body += JSON.stringify(o); res.done = true; };
      return res;
    };
    const listen = (handler) => (port, host, cb) => {
      if (typeof host === 'function') { cb = host; host = null; }
      port = +port || 3000;
      if (LX.ports(m).some((p) => p.proto === 'tcp' && p.port === port)) { c.err(`node:events:497\n      throw er; // Unhandled 'error' event\n      ^\n\nError: listen EADDRINUSE: address already in use :::${port}\n\nNode.js v18.19.1\n`); throw new Error('__exit'); }
      m.runtime = m.runtime || { servers: {} };
      m.runtime.servers[port] = { proc: 'node', pid: c.proc ? c.proc.pid : m.nextPid(), addr: host === 'localhost' || host === '127.0.0.1' ? '127.0.0.1' : '0.0.0.0', handle: async (req) => {
        const res = makeRes();
        const rq = { url: req.path, method: req.method, headers: Object.assign({ host: `${req.host}:${req.port}` }, req.headers), path: req.path.split('?')[0], query: Object.fromEntries(new URLSearchParams(req.path.split('?')[1] || '')), params: {} };
        try { await handler(rq, res); } catch (e) { c.err(`${e.stack ? e.stack.split('\n')[0] : e}\n`); return { status: 500, headers: {}, body: 'Internal Server Error' }; }
        return { status: res.statusCode, headers: Object.assign(res.express ? { 'X-Powered-By': 'Express' } : {}, { Connection: 'keep-alive' }, res.headers), body: res.body };
      } };
      servers.push(port);
      if (cb) cb();
      return { close() { delete m.runtime.servers[port]; } };
    };
    const http = { createServer: (h) => ({ listen: listen(h), on() {} }) };
    const express = () => {
      const routes = [];
      const statics = [];
      const app = (req, res) => {
        res.express = true;
        for (const r of routes) {
          if (r.method !== 'ALL' && r.method !== req.method) continue;
          const keys = [];
          const re = new RegExp('^' + r.path.replace(/:(\w+)/g, (mm, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
          const mm = re.exec(req.path);
          if (mm) { keys.forEach((k, i) => { req.params[k] = decodeURIComponent(mm[i + 1]); }); return r.fn(req, res, () => {}); }
        }
        for (const sd of statics) {
          const f = LX.path.normalize(sd, '.' + (req.path === '/' ? '/index.html' : req.path));
          if (m.vfs.lookup(f) && m.vfs.lookup(f).t === 'f') { res.headers['Content-Type'] = /\.html$/.test(f) ? 'text/html; charset=UTF-8' : 'text/plain'; res.end(m.vfs.readFile(f, null)); return; }
        }
        res.statusCode = 404; res.headers['Content-Type'] = 'text/html; charset=utf-8';
        res.end(`<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot ${req.method} ${req.path}</pre>\n</body>\n</html>\n`);
      };
      ['get', 'post', 'put', 'delete', 'all'].forEach((k) => { app[k] = (p, fn) => { routes.push({ method: k.toUpperCase(), path: p, fn }); return app; }; });
      app.use = (a1, a2) => { if (a1 && a1.__static) statics.push(a1.__static); else if (a2 && a2.__static) statics.push(a2.__static); return app; };
      app.listen = (port, host, cb) => listen(app)(port, host, cb);
      app.set = () => app;
      return app;
    };
    express.static = (d) => ({ __static: LX.path.normalize(dir, d) });
    express.json = () => ({});
    const req = (name) => {
      if (name === 'http' || name === 'node:http') return http;
      if (name === 'os' || name === 'node:os') return { hostname: () => m.hostname(), platform: () => 'linux', type: () => 'Linux', release: () => LX.OS.kernel, cpus: () => [{}, {}], totalmem: () => 4101746688, freemem: () => 2101746688, uptime: () => Math.floor((m.now() - m.bootTime) / 1000), userInfo: () => ({ username: c.cred.name, homedir: c.cred.home }) };
      if (name === 'fs' || name === 'node:fs') return { readFileSync: (f) => c.fs.readFile(LX.path.normalize(dir, f), c.cred), writeFileSync: (f, d) => c.fs.writeFile(LX.path.normalize(dir, f), String(d), c.cred), existsSync: (f) => !!c.fs.lookup(LX.path.normalize(dir, f)), readdirSync: (f) => c.fs.readdir(LX.path.normalize(dir, f), c.cred) };
      if (name === 'path' || name === 'node:path') return { join: (...x) => x.join('/').replace(/\/+/g, '/'), resolve: (...x) => LX.path.normalize(dir, x.join('/')), basename: (x) => P().basename(x), dirname: (x) => P().dirname(x) };
      if (name === 'express') { if (!hasModule('express')) { const e = new Error(`Cannot find module 'express'\nRequire stack:\n- ${file}`); e.code = 'MODULE_NOT_FOUND'; throw e; } return express; }
      const e = new Error(`Cannot find module '${name}'\nRequire stack:\n- ${file}`);
      e.code = 'MODULE_NOT_FOUND';
      throw e;
    };
    const proc = { env: Object.assign({}, c.sh.exportedEnv()), argv: ['/usr/bin/node', file], version: 'v18.19.1', platform: 'linux', pid: c.proc ? c.proc.pid : 2500, exit: (code) => { throw Object.assign(new Error('__exit'), { code }); }, cwd: () => c.cwd, uptime: () => 1.2, memoryUsage: () => ({ rss: 41234432 }) };
    const timers = [];
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('require', 'console', 'process', 'module', 'exports', '__dirname', '__filename', 'setTimeout', 'setInterval', 'window', 'document', 'globalThis', 'self', 'localStorage', 'fetch', src.replace(/^#!.*\n/, ''));
      const cons = { log, info: log, error: (...x) => c.err(x.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ') + '\n'), warn: (...x) => c.err(x.join(' ') + '\n') };
      fn(req, cons, proc, { exports: {} }, {}, dir, file, (f, ms) => { timers.push(setTimeout(() => { try { f(); } catch (e) { /* 무시 */ } }, Math.min(ms || 0, 5000))); }, () => 0, undefined, undefined, undefined, undefined, undefined, undefined);
    } catch (e) {
      if (e.message === '__exit') return e.code || 0;
      c.err(`${file}:1\n${e.code === 'MODULE_NOT_FOUND' ? '' : ''}\n${e.name || 'Error'}: ${e.message}\n${e.code ? `    at Module._resolveFilename (node:internal/modules/cjs/loader:1140:15) {\n  code: '${e.code}'\n}\n` : ''}\nNode.js v18.19.1\n`);
      return 1;
    }
    if (!servers.length) return 0;
    if (c.session.headless && !c.io.job) { servers.forEach((p) => delete m.runtime.servers[p]); return 0; }
    try {
      for (;;) { await c.sleep(1000); if (!servers.some((p) => m.runtime.servers[p])) break; }
    } catch (e) {
      c.session.aborted = false;
    } finally {
      servers.forEach((p) => delete m.runtime.servers[p]);
      timers.forEach((t) => clearTimeout(t));
    }
    return 130;
  }
  LX.runNode = runNode;

  def(['npm', 'npx'], async (c) => {
    const a = c.args;
    if (a[0] === '-v' || a[0] === '--version') { c.out('9.2.0\n'); return 0; }
    const pkgFile = c.resolve('package.json');
    const readPkg = () => { try { return JSON.parse(c.fs.readFile(pkgFile, c.cred)); } catch (e) { return null; } };
    switch (a[0]) {
      case 'init': {
        const name = P().basename(c.cwd).toLowerCase();
        const pkg = { name, version: '1.0.0', description: '', main: 'index.js', scripts: { test: 'echo "Error: no test specified" && exit 1' }, keywords: [], author: '', license: 'ISC' };
        const text = JSON.stringify(pkg, null, 2) + '\n';
        try { c.fs.writeFile(pkgFile, text, c.cred); } catch (e) { c.err(`npm ERR! code EACCES\nnpm ERR! syscall open\nnpm ERR! path ${pkgFile}\n`); return 1; }
        c.out(`Wrote to ${pkgFile}:\n\n${text}\n\n`);
        return 0;
      }
      case 'install': case 'i': case 'add': {
        const names = a.slice(1).filter((x) => !x.startsWith('-'));
        const pkg = readPkg();
        if (LX.internetDown(c.m)) { c.err('npm ERR! code ENOTFOUND\nnpm ERR! syscall getaddrinfo\nnpm ERR! errno ENOTFOUND\n'); return 1; }
        const list = names.length ? names : Object.keys((pkg && pkg.dependencies) || {});
        await c.sleep(c.session.headless ? 0 : 1200);
        try {
          list.forEach((n) => c.fs.mkdir(c.resolve(`node_modules/${n.split('@')[0]}`), c.cred, { parents: true }));
          if (pkg && names.length) { pkg.dependencies = Object.assign(pkg.dependencies || {}, Object.fromEntries(names.map((n) => [n.split('@')[0], '^4.21.2']))); c.fs.writeFile(pkgFile, JSON.stringify(pkg, null, 2) + '\n', c.cred); }
          c.fs.writeFile(c.resolve('package-lock.json'), JSON.stringify({ name: pkg ? pkg.name : 'app', lockfileVersion: 3, requires: true }, null, 2) + '\n', c.cred);
        } catch (e) { c.err(`npm ERR! code EACCES\nnpm ERR! syscall mkdir\nnpm ERR! path ${c.resolve('node_modules')}\nnpm ERR! errno -13\n`); return 243; }
        const n = list.length ? 60 + list.length * 5 : 0;
        c.out(`\nadded ${n} packages, and audited ${n + 1} packages in 2s\n\n${n ? '14 packages are looking for funding\n  run `npm fund` for details\n\n' : ''}found 0 vulnerabilities\n`);
        return 0;
      }
      case 'start': case 'run': case 'test': {
        const pkg = readPkg();
        if (!pkg) { c.err(`npm ERR! code ENOENT\nnpm ERR! syscall open\nnpm ERR! path ${pkgFile}\nnpm ERR! errno -2\nnpm ERR! enoent Could not read package.json: Error: ENOENT: no such file or directory, open '${pkgFile}'\n`); return 254; }
        const script = a[0] === 'run' ? a[1] : a[0];
        const cmd = (pkg.scripts || {})[script] || (script === 'start' ? `node ${pkg.main || 'server.js'}` : null);
        if (!cmd) { c.err(`npm ERR! Missing script: "${script}"\n`); return 1; }
        c.out(`\n> ${pkg.name}@${pkg.version} ${script}\n> ${cmd}\n\n`);
        return c.sh.runSource(cmd, c.io);
      }
      case 'ls': case 'list': { const pkg = readPkg(); c.out(`${pkg ? pkg.name + '@' + pkg.version : 'app'} ${c.cwd}\n${Object.keys((pkg && pkg.dependencies) || {}).map((d) => `└── ${d}@4.21.2`).join('\n') || '└── (empty)'}\n\n`); return 0; }
      default: c.out('npm <command>\n\nUsage:\n\nnpm install        install all the dependencies in your project\nnpm install <foo>  add the <foo> dependency to your project\nnpm test           run this project\'s tests\nnpm run <foo>      run the script named <foo>\nnpm <command> -h   quick help on <command>\n\nnpm@9.2.0 /usr/share/nodejs/npm\n'); return 1;
    }
  });

  // ======================================================================= Git (간단)
  function gitRoot(c) {
    let d = c.cwd;
    for (;;) { if (c.fs.lookup(d + '/.git/vgit.json')) return d; if (d === '/') return null; d = P().dirname(d); }
  }
  function gitLoad(c, root) { try { return JSON.parse(c.fs.readFile(root + '/.git/vgit.json', c.cred)); } catch (e) { return null; } }
  function gitSave(c, root, s) { c.fs.writeFile(root + '/.git/vgit.json', JSON.stringify(s), c.cred); }
  function gitFiles(c, root) {
    const files = {};
    c.fs.each(root, c.cred, (p, n) => { if (p.includes('/.git')) return false; if (n.t === 'f') files[p.slice(root.length + 1)] = n.c; return true; });
    return files;
  }
  def('git', async (c) => {
    const a = c.args;
    const sub = a[0];
    const hex = () => Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    if (sub === '--version' || sub === 'version') { c.out('git version 2.43.0\n'); return 0; }
    if (sub === 'config') {
      const gc = c.cred.home + '/.gitconfig';
      let text = '';
      try { text = c.fs.readFile(gc, c.cred); } catch (e) { /* 없음 */ }
      const key = a.filter((x) => !x.startsWith('--'))[1];
      const val = a.filter((x) => !x.startsWith('--'))[2];
      if (a.includes('--list') || a.includes('-l')) { text.split('\n').reduce((sec, l) => { const s = /^\[(\w+)\]/.exec(l); if (s) return s[1]; const kv = /^\s*(\w+)\s*=\s*(.*)$/.exec(l); if (kv) c.out(`${sec}.${kv[1]}=${kv[2]}\n`); return sec; }, ''); return 0; }
      if (!key) return 1;
      const [sec, k] = key.split('.');
      if (val == null) { const r = new RegExp(`\\[${sec}\\][^[]*?\\n\\s*${k}\\s*=\\s*(.*)`).exec(text); if (r) { c.out(r[1] + '\n'); return 0; } return 1; }
      if (new RegExp(`\\[${sec}\\]`).test(text)) { if (new RegExp(`\\n\\s*${k}\\s*=`).test(text)) text = text.replace(new RegExp(`(\\n\\s*${k}\\s*=\\s*).*`), `$1${val}`); else text = text.replace(new RegExp(`(\\[${sec}\\]\\n)`), `$1\t${k} = ${val}\n`); }
      else text += `[${sec}]\n\t${k} = ${val}\n`;
      c.fs.writeFile(gc, text, c.cred);
      return 0;
    }
    if (sub === 'init') {
      const dir = a[1] ? c.resolve(a[1]) : c.cwd;
      try { c.fs.mkdir(dir + '/.git/objects', c.cred, { parents: true }); c.fs.mkdir(dir + '/.git/refs/heads', c.cred, { parents: true }); c.fs.writeFile(dir + '/.git/HEAD', 'ref: refs/heads/main\n', c.cred); gitSave(c, dir, { branch: 'main', commits: [], index: {}, remotes: {} }); } catch (e) { c.err(`fatal: cannot mkdir ${dir}: ${e.message}\n`); return 128; }
      c.out(`hint: Using 'master' as the name for the initial branch. This default branch name\nhint: is subject to change. To configure the initial branch name to use in all\nhint: of your new repositories, which will suppress this warning, call:\nhint:\nhint: \tgit config --global init.defaultBranch <name>\nhint:\nhint: Names commonly chosen instead of 'master' are 'main', 'trunk' and\nhint: 'development'. The just-created branch can be renamed via this command:\nhint:\nhint: \tgit branch -m <name>\nInitialized empty Git repository in ${dir}/.git/\n`.replace(/master/g, 'master'));
      const s = gitLoad(c, dir); s.branch = 'master'; gitSave(c, dir, s);
      return 0;
    }
    if (sub === 'clone') {
      const url = a[1];
      if (!url) { c.err('fatal: You must specify a repository to clone.\n'); return 129; }
      const name = a[2] || P().basename(url).replace(/\.git$/, '');
      const dir = c.resolve(name);
      c.out(`Cloning into '${name}'...\n`);
      const host = (/^(?:https?:\/\/|git@)([^/:]+)/.exec(url) || [])[1];
      if (!host || LX.internetDown(c.m)) { c.err(`fatal: unable to access '${url}/': Could not resolve host: ${host}\n`); return 128; }
      await c.sleep(c.session.headless ? 0 : 700);
      c.out('remote: Enumerating objects: 24, done.\nremote: Counting objects: 100% (24/24), done.\nremote: Compressing objects: 100% (18/18), done.\nremote: Total 24 (delta 3), reused 20 (delta 2), pack-reused 0 (from 0)\nReceiving objects: 100% (24/24), 8.12 KiB | 8.12 MiB/s, done.\nResolving deltas: 100% (3/3), done.\n');
      try {
        c.fs.mkdir(dir + '/.git', c.cred, { parents: true });
        const files = { 'README.md': `# ${name}\n\n(가상 저장소) ${url} 에서 복제한 예제 프로젝트입니다.\n`, 'index.html': `<!DOCTYPE html>\n<html lang="ko">\n<head><meta charset="utf-8"><title>${name}</title></head>\n<body>\n<h1>${name}</h1>\n<p>Git 으로 배포한 웹 페이지입니다.</p>\n</body>\n</html>\n`, 'app.js': "const http = require('http');\nconst port = process.env.PORT || 3000;\nhttp.createServer((req, res) => {\n  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });\n  res.end('Hello from Node.js app!\\n');\n}).listen(port, () => console.log(`Server running on port ${port}`));\n", 'package.json': JSON.stringify({ name, version: '1.0.0', main: 'app.js', scripts: { start: 'node app.js' } }, null, 2) + '\n' };
        Object.entries(files).forEach(([f, t]) => c.fs.writeFile(dir + '/' + f, t, c.cred));
        gitSave(c, dir, { branch: 'main', commits: [{ id: hex(), msg: 'Initial commit', author: 'Example <dev@example.com>', t: c.m.now() - 864e5, files }], index: {}, remotes: { origin: url } });
      } catch (e) { c.err(`fatal: could not create work tree dir '${name}': ${e.message}\n`); return 128; }
      return 0;
    }
    const root = gitRoot(c);
    if (!root) { c.err('fatal: not a git repository (or any of the parent directories): .git\n'); return 128; }
    const s = gitLoad(c, root);
    const head = s.commits[s.commits.length - 1];
    const committed = head ? head.files : {};
    const work = gitFiles(c, root);
    switch (sub) {
      case 'status': {
        const staged = Object.keys(s.index);
        const changed = Object.keys(work).filter((f) => f in committed && work[f] !== committed[f] && s.index[f] !== work[f]);
        const untracked = Object.keys(work).filter((f) => !(f in committed) && !(f in s.index));
        const deleted = Object.keys(committed).filter((f) => !(f in work));
        let out = `On branch ${s.branch}\n`;
        if (s.remotes.origin && head) out += `Your branch is up to date with 'origin/${s.branch}'.\n`;
        if (!head) out += '\nNo commits yet\n';
        if (staged.length) out += `\nChanges to be committed:\n  (use "git ${head ? 'restore --staged' : 'rm --cached'} <file>..." to unstage)\n${staged.map((f) => `\t${c.tty ? '\x1b[32m' : ''}${f in committed ? 'modified:   ' : 'new file:   '}${f}${c.tty ? '\x1b[m' : ''}`).join('\n')}\n`;
        if (changed.length || deleted.length) out += `\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n${changed.map((f) => `\t${c.tty ? '\x1b[31m' : ''}modified:   ${f}${c.tty ? '\x1b[m' : ''}`).concat(deleted.map((f) => `\t${c.tty ? '\x1b[31m' : ''}deleted:    ${f}${c.tty ? '\x1b[m' : ''}`)).join('\n')}\n`;
        if (untracked.length) out += `\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n${untracked.map((f) => `\t${c.tty ? '\x1b[31m' : ''}${f}${c.tty ? '\x1b[m' : ''}`).join('\n')}\n`;
        if (!staged.length && !changed.length && !untracked.length && !deleted.length) out += head ? '\nnothing to commit, working tree clean\n' : '\nnothing to commit (create/copy files and use "git add" to track)\n';
        else if (!staged.length) out += `\nno changes added to commit (use "git add" and/or "git commit -a")\n`;
        c.out(out);
        return 0;
      }
      case 'add': {
        const targets = a.slice(1).filter((x) => !x.startsWith('-'));
        if (!targets.length) { c.out('Nothing specified, nothing added.\nhint: Maybe you wanted to say \'git add .\'?\n'); return 0; }
        const all = targets.includes('.') || a.includes('-A') || a.includes('--all');
        Object.keys(work).forEach((f) => { if (all || targets.some((t) => f === t || f.startsWith(t.replace(/\/$/, '') + '/'))) { if (work[f] !== committed[f]) s.index[f] = work[f]; } });
        for (const t of targets) if (t !== '.' && !Object.keys(work).some((f) => f === t || f.startsWith(t + '/'))) { c.err(`fatal: pathspec '${t}' did not match any files\n`); return 128; }
        gitSave(c, root, s);
        return 0;
      }
      case 'commit': {
        const mi = a.indexOf('-m');
        const msg = mi >= 0 ? a[mi + 1] : a.find((x) => x.startsWith('-am')) ? a[a.indexOf(a.find((x) => x.startsWith('-am'))) + 1] : null;
        if (a.some((x) => /^-a/.test(x))) Object.keys(work).forEach((f) => { if (f in committed && work[f] !== committed[f]) s.index[f] = work[f]; });
        let name = '', email = '';
        try { const gc = c.fs.readFile(c.cred.home + '/.gitconfig', c.cred); name = (/name\s*=\s*(.*)/.exec(gc) || [])[1] || ''; email = (/email\s*=\s*(.*)/.exec(gc) || [])[1] || ''; } catch (e) { /* 없음 */ }
        if (!name || !email) { c.err(`Author identity unknown\n\n*** Please tell me who you are.\n\nRun\n\n  git config --global user.email "you@example.com"\n  git config --global user.name "Your Name"\n\nto set your account's default identity.\nOmit --global to set the identity only in this repository.\n\nfatal: unable to auto-detect email address (got '${c.cred.name}@${c.m.hostname()}.(none)')\n`); return 128; }
        if (!Object.keys(s.index).length) { c.out(`On branch ${s.branch}\nnothing to commit, working tree clean\n`); return 1; }
        if (!msg) { c.err('\x1b[2m(가상 터미널: git commit -m "메시지" 형식으로 입력하세요)\x1b[0m\n'); return 1; }
        const files = Object.assign({}, committed, s.index);
        const n = Object.keys(s.index).length;
        const id = hex();
        s.commits.push({ id, msg, author: `${name} <${email}>`, t: c.m.now(), files });
        s.index = {};
        gitSave(c, root, s);
        c.out(`[${s.branch}${s.commits.length === 1 ? ' (root-commit)' : ''} ${id.slice(0, 7)}] ${msg}\n ${n} file${n > 1 ? 's' : ''} changed, ${n * 3} insertions(+)\n`);
        return 0;
      }
      case 'log': {
        const one = a.includes('--oneline');
        if (!s.commits.length) { c.err(`fatal: your current branch '${s.branch}' does not have any commits yet\n`); return 128; }
        s.commits.slice().reverse().forEach((k, i) => {
          if (one) c.out(`${c.tty ? '\x1b[33m' : ''}${k.id.slice(0, 7)}${c.tty ? '\x1b[m' : ''} ${i === 0 ? `(${c.tty ? '\x1b[1;36m' : ''}HEAD -> ${c.tty ? '\x1b[1;32m' : ''}${s.branch}${c.tty ? '\x1b[m' : ''}) ` : ''}${k.msg}\n`);
          else c.out(`${c.tty ? '\x1b[33m' : ''}commit ${k.id}${c.tty ? '\x1b[m' : ''}${i === 0 ? ` (HEAD -> ${s.branch})` : ''}\nAuthor: ${k.author}\nDate:   ${LX.strftime(c.m, '%a %b %e %H:%M:%S %Y %z', k.t)}\n\n    ${k.msg}\n\n`);
        });
        return 0;
      }
      case 'branch': { if (a[1]) { if (a[1] === '-m' && a[2]) { s.branch = a[2]; gitSave(c, root, s); return 0; } c.out(''); return 0; } c.out(`* ${c.tty ? '\x1b[32m' : ''}${s.branch}${c.tty ? '\x1b[m' : ''}\n`); return 0; }
      case 'remote': { if (a[1] === 'add') { s.remotes[a[2]] = a[3]; gitSave(c, root, s); return 0; } Object.entries(s.remotes).forEach(([k, v]) => c.out(a.includes('-v') ? `${k}\t${v} (fetch)\n${k}\t${v} (push)\n` : `${k}\n`)); return 0; }
      case 'pull': c.out('Already up to date.\n'); return 0;
      case 'push': c.err(`fatal: unable to access '${s.remotes.origin || 'origin'}/': (가상 터미널) 원격 저장소로 올리기는 지원하지 않습니다\n`); return 128;
      case 'diff': { Object.keys(work).filter((f) => f in committed && work[f] !== committed[f]).forEach((f) => c.out(`diff --git a/${f} b/${f}\n--- a/${f}\n+++ b/${f}\n${committed[f].split('\n').filter(Boolean).map((l) => `-${l}`).join('\n')}\n${work[f].split('\n').filter(Boolean).map((l) => `+${l}`).join('\n')}\n`)); return 0; }
      default: c.err(`git: '${sub}' is not a git command. See 'git --help'.\n`); return 1;
    }
  });

  // ======================================================================= 컴파일러 (간단)
  def(['gcc', 'cc', 'g++'], async (c) => {
    if (c.args[0] === '--version' || c.args[0] === '-v') { c.out('gcc (Ubuntu 13.3.0-6ubuntu2~24.04) 13.3.0\nCopyright (C) 2023 Free Software Foundation, Inc.\nThis is free software; see the source for copying conditions.  There is NO\nwarranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.\n\n'); return 0; }
    const oi = c.args.indexOf('-o');
    const out = oi >= 0 ? c.args[oi + 1] : 'a.out';
    const srcs = c.args.filter((x, i) => /\.(c|cpp|cc)$/.test(x) && i !== oi + 1);
    if (!srcs.length) { c.err(`${c.name}: fatal error: no input files\ncompilation terminated.\n`); return 1; }
    let src;
    try { src = c.fs.readFile(c.resolve(srcs[0]), c.cred); } catch (e) { c.err(`${c.name}: error: ${srcs[0]}: No such file or directory\n${c.name}: fatal error: no input files\ncompilation terminated.\n`); return 1; }
    if (!/\bmain\s*\(/.test(src)) { c.err(`/usr/bin/ld: /usr/lib/gcc/x86_64-linux-gnu/13/../../../x86_64-linux-gnu/Scrt1.o: in function \`_start':\n(.text+0x1b): undefined reference to \`main'\ncollect2: error: ld returned 1 exit status\n`); return 1; }
    const msgs = [];
    const re = /(?:printf|puts)\s*\(\s*"((?:[^"\\]|\\.)*)"/g;
    let r;
    while ((r = re.exec(src))) msgs.push(r[1] + (/puts/.test(src.slice(r.index, r.index + 4)) ? '\\n' : ''));
    const coutRe = /cout\s*<<\s*"((?:[^"\\]|\\.)*)"(\s*<<\s*(endl|"\\n"))?/g;
    while ((r = coutRe.exec(src))) msgs.push(r[1] + (r[2] ? '\\n' : ''));
    c.fs.writeFile(c.resolve(out), LX.ELF + 'cprog\n' + JSON.stringify(msgs), c.cred, { mode: 0o775 & ~c.sh.umask | 0o111 });
    c.fs.lookup(c.resolve(out)).m = 0o775;
    return 0;
  });
  def('cprog', async (c) => {
    const node = c.fs.lookup(c.resolve(c.argv[0].includes('/') ? c.argv[0] : c.m.findInPath(c.argv[0], c.env('PATH')) || c.argv[0]));
    let msgs = [];
    try { msgs = JSON.parse((node.c || '').split('\n')[1] || '[]'); } catch (e) { /* 무시 */ }
    c.out(msgs.map((x) => LX.escapes(x.replace(/%[dsf]/g, '')).replace(/\u0000STOP/, '')).join(''));
    return 0;
  });
  def('make', async (c) => {
    if (c.args[0] === '--version' || c.args[0] === '-v') { c.out('GNU Make 4.3\nBuilt for x86_64-pc-linux-gnu\n'); return 0; }
    let mk;
    try { mk = c.fs.readFile(c.resolve('Makefile'), c.cred); } catch (e) { c.err('make: *** No targets specified and no makefile found.  Stop.\n'); return 2; }
    const rules = {};
    let cur = null;
    mk.split('\n').forEach((l) => { const r = /^([\w.-]+)\s*:(.*)$/.exec(l); if (r) { cur = r[1]; rules[cur] = { deps: r[2].trim().split(/\s+/).filter(Boolean), cmds: [] }; if (!rules._first) rules._first = cur; } else if (/^\t/.test(l) && cur) rules[cur].cmds.push(l.trim()); });
    const target = c.args[0] || rules._first;
    if (!rules[target]) { c.err(`make: *** No rule to make target '${target}'.  Stop.\n`); return 2; }
    const run = async (t) => { const r = rules[t]; if (!r) return 0; for (const d of r.deps) await run(d); for (const cmd of r.cmds) { const silent = cmd.startsWith('@'); const cc = cmd.replace(/^@/, ''); if (!silent) c.out(cc + '\n'); const st = await c.sh.runSource(cc, c.io); if (st) { c.err(`make: *** [Makefile: ${t}] Error ${st}\n`); return 2; } } return 0; };
    return run(target);
  });
  def(['java', 'javac', 'jar'], async (c) => {
    if (c.args.some((a) => /^-?-version$/.test(a))) { c.out(c.name === 'javac' ? 'javac 17.0.16\n' : 'openjdk version "17.0.16" 2025-07-15\nOpenJDK Runtime Environment (build 17.0.16+8-Ubuntu-0ubuntu124.04.1)\nOpenJDK 64-Bit Server VM (build 17.0.16+8-Ubuntu-0ubuntu124.04.1, mixed mode, sharing)\n'); return 0; }
    c.err('\x1b[2m(가상 터미널: 자바 실행은 지원하지 않습니다. 자바 웹 실습 강좌를 이용하세요)\x1b[0m\n');
    return 1;
  });

  // ======================================================================= certbot
  def('certbot', async (c) => {
    const a = c.args;
    if (a.includes('--version')) { c.out('certbot 2.9.0\n'); return 0; }
    if (c.cred.uid !== 0) { c.err('The following error was encountered:\n[Errno 13] Permission denied: \'/var/log/letsencrypt/.certbot.lock\'\nEither run as root, or set --config-dir, --work-dir, and --logs-dir to writeable paths.\n'); return 1; }
    if (a[0] === 'certificates') { c.out('Saving debug log to /var/log/letsencrypt/letsencrypt.log\n\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\nNo certificates found.\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n'); return 0; }
    if (a[0] === 'renew') { c.out('Saving debug log to /var/log/letsencrypt/letsencrypt.log\n\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\nNo simulated renewals were attempted.\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n'); return 0; }
    const domains = [];
    a.forEach((x, i) => { if (x === '-d') domains.push(...a[i + 1].split(',')); });
    const plugin = a.includes('--nginx') ? 'nginx' : a.includes('--apache') ? 'apache' : a.includes('--standalone') ? 'standalone' : null;
    if (plugin === 'nginx' && !c.m.state.pkgs['python3-certbot-nginx']) { c.err('Saving debug log to /var/log/letsencrypt/letsencrypt.log\nThe requested nginx plugin does not appear to be installed\n'); return 1; }
    c.out('Saving debug log to /var/log/letsencrypt/letsencrypt.log\n');
    if (!a.includes('-m') && !a.includes('--email') && !a.includes('--register-unsafely-without-email')) {
      await c.readLine('Enter email address or hit Enter to skip.\n (Enter \'c\' to cancel): ', { tty: true, answer: '' });
      c.out('\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\nPlease read the Terms of Service at:\nhttps://letsencrypt.org/documents/LE-SA-v1.5-February-24-2025.pdf\nYou must agree in order to register with the ACME server. Do you agree?\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\n');
      const ok = await c.readLine('(Y)es/(N)o: ', { tty: true, answer: 'Y' });
      if (!/^y/i.test(ok || '')) { c.err('Must agree to TOS\n'); return 1; }
      c.out('Account registered.\n');
    }
    if (!domains.length) { c.err('\x1b[2m(가상 터미널: -d 도메인 을 함께 입력하세요)\x1b[0m\n'); return 1; }
    c.out(`Requesting a certificate for ${domains.join(' and ')}\n`);
    await c.sleep(c.session.headless ? 0 : 1500);
    c.out(`\nCertbot failed to authenticate some domains (authenticator: ${plugin || 'standalone'}). The Certificate Authority reported these problems:\n  Domain: ${domains[0]}\n  Type:   ${/\.(local|test|lan|internal)$|example\.com$/.test(domains[0]) ? 'rejectedIdentifier' : 'connection'}\n  Detail: ${/\.(local|test|lan|internal)$/.test(domains[0]) ? `Invalid identifiers requested :: Cannot issue for "${domains[0]}": Domain name does not end with a valid public suffix (TLD)` : `${LX.resolveHost(c.m, domains[0]) ? LX.resolveHost(c.m, domains[0]).ip : '203.0.113.25'}: Fetching http://${domains[0]}/.well-known/acme-challenge/x7Yq3...: Timeout during connect (likely firewall problem)`}\n\nHint: The Certificate Authority failed to verify the temporary ${plugin || 'standalone'} configuration changes made by Certbot. Ensure that the listed domains point to this ${plugin || 'standalone'} server and that it is accessible from the internet.\n\nSome challenges have failed.\nAsk for help or search for solutions at https://community.letsencrypt.org. See the logfile /var/log/letsencrypt/letsencrypt.log or re-run Certbot with -v for more details.\n`);
    c.err('\x1b[1;33m(가상 터미널 안내) 인증서 발급은 인터넷에서 접속 가능한 실제 서버와 실제 도메인(DNS A 레코드)이 있어야 성공합니다.\n 실습용 가상 머신에서는 실패하는 것이 정상입니다. 절차와 출력 형식을 익혀 두세요.\x1b[0m\n');
    return 1;
  });

  // ======================================================================= fail2ban
  def('fail2ban-client', async (c) => {
    const m = c.m;
    if (c.cred.uid !== 0) { c.err('2026-09-27 07:12:24,123 fail2ban                [2601]: ERROR   Permission denied to socket: /var/run/fail2ban/fail2ban.sock, (you must be root)\n'); return 255; }
    const on = m.state.services.fail2ban && m.state.services.fail2ban.active;
    if (!on) { c.err('2026-09-27 07:12:24,123 fail2ban                [2601]: ERROR   Failed to access socket path: /var/run/fail2ban/fail2ban.sock. Is fail2ban running?\n'); return 255; }
    const a = c.args;
    const f = m.state.f2b;
    if (a[0] === 'ping') { c.out('Server replied: pong\n'); return 0; }
    if (a[0] === 'status' && a[1]) {
      if (a[1] !== 'sshd') { c.err(`Sorry but the jail '${a[1]}' does not exist\n`); return 255; }
      c.out(`Status for the jail: sshd\n|- Filter\n|  |- Currently failed:\t${f.banned.length ? 0 : (f.fails || 0)}\n|  |- Total failed:\t${f.fails || 0}\n|  \`- Journal matches:\t_SYSTEMD_UNIT=sshd.service + _COMM=sshd\n\`- Actions\n   |- Currently banned:\t${f.banned.length}\n   |- Total banned:\t${f.total || 0}\n   \`- Banned IP list:\t${f.banned.join(' ')}\n`);
      return 0;
    }
    if (a[0] === 'status') { c.out('Status\n|- Number of jail:\t1\n`- Jail list:\tsshd\n'); return 0; }
    if (a[0] === 'set' && a[2] === 'unbanip') { const was = f.banned.includes(a[3]); f.banned = f.banned.filter((x) => x !== a[3]); f.fails = 0; c.out(was ? '1\n' : '0\n'); return 0; }
    if (a[0] === 'set' && a[2] === 'banip') { if (!f.banned.includes(a[3])) f.banned.push(a[3]); f.total = (f.total || 0) + 1; c.out('1\n'); return 0; }
    if (a[0] === 'unban') { const n = a.includes('--all') ? f.banned.length : a.slice(1).filter((x) => f.banned.includes(x)).length; f.banned = a.includes('--all') ? [] : f.banned.filter((x) => !a.includes(x)); f.fails = 0; c.out(n + '\n'); return 0; }
    if (a[0] === 'banned') { c.out(`[{'sshd': [${f.banned.map((x) => `'${x}'`).join(', ')}]}]\n`); return 0; }
    if (a[0] === 'reload' || a[0] === 'restart') { c.out('OK\n'); return 0; }
    if (a[0] === 'get' && a[2] === 'maxretry') { c.out(LX.f2bMax(m) + '\n'); return 0; }
    if (a[0] === '--version' || a[0] === '-V') { c.out('Fail2Ban v1.0.2\n'); return 0; }
    c.err('Usage: fail2ban-client [OPTIONS] <COMMAND>\n'); return 255;
  });
  def(['fail2ban-server', 'fail2ban-regex'], async (c) => { c.err('\x1b[2m(가상 터미널: fail2ban 은 sudo systemctl start fail2ban 으로 실행하고 fail2ban-client 로 확인하세요)\x1b[0m\n'); return 1; });

  // ======================================================================= Samba · FTP · DNS 서버 도구
  def('testparm', async (c) => {
    let t;
    try { t = c.fs.readFile('/etc/samba/smb.conf', null); } catch (e) { c.err('Can\'t load /etc/samba/smb.conf - run testparm to debug it\n'); return 1; }
    c.err('Load smb config files from /etc/samba/smb.conf\n');
    const shares = (t.match(/^\s*\[([^\]]+)\]/gm) || []).map((x) => x.trim().slice(1, -1)).filter((x) => x !== 'global');
    shares.forEach((s) => c.err(`Processing section "[${s}]"\n`));
    c.err('Loaded services file OK.\nWeak crypto is allowed by GnuTLS (e.g. NTLM as a compatibility fallback)\n\nServer role: ROLE_STANDALONE\n\n');
    if (!c.args.includes('-s')) { const ans = await c.readLine('Press enter to see a dump of your service definitions\n', { tty: true, answer: '' }); void ans; }
    c.out(t.replace(/^\s*#.*\n/gm, '').replace(/^\s*;.*\n/gm, ''));
    return 0;
  });
  def('smbpasswd', async (c) => {
    const u = c.args.filter((a) => !a.startsWith('-'))[0] || c.cred.name;
    if (c.cred.uid !== 0 && c.args.includes('-a')) { c.err('smbpasswd: -a is only allowed by root.\n'); return 1; }
    if (!c.m.credFor(u)) { c.err(`Failed to add entry for user ${u}.\n`); return 1; }
    const p1 = await c.session.requestLine('New SMB password:', { secret: true });
    const p2 = await c.session.requestLine('Retype new SMB password:', { secret: true });
    if (p1 !== p2) { c.err('Mismatch - password unchanged.\nUnable to get new password.\n'); return 1; }
    c.m.state.smbUsers = [...new Set((c.m.state.smbUsers || []).concat(u))];
    c.out(c.args.includes('-a') ? `Added user ${u}.\n` : '');
    return 0;
  });
  def(['smbstatus', 'pdbedit'], async (c) => { if (c.name === 'pdbedit') { (c.m.state.smbUsers || []).forEach((u) => { const cr = c.m.credFor(u); c.out(`${u}:${cr ? cr.uid : 0}:\n`); }); return 0; } c.out('\nSamba version 4.19.5-Ubuntu\nPID     Username     Group        Machine                                   Protocol Version  Encryption           Signing              \n----------------------------------------------------------------------------------------------------------------------------------------\n\nService      pid     Machine       Connected at                     Encryption   Signing     \n---------------------------------------------------------------------------------------------\n\nNo locked files\n\n'); return 0; });
  def(['named-checkconf', 'named-checkzone', 'rndc'], async (c) => { if (c.name === 'named-checkzone') c.out(`zone ${c.args[0]}/IN: loaded serial 2026092701\nOK\n`); if (c.name === 'rndc') c.out(c.m.state.services.named && c.m.state.services.named.active ? 'version: BIND 9.18.30-0ubuntu0.24.04.2-Ubuntu (Extended Support Version) <id:>\nrunning on localhost: Linux x86_64 ' + LX.OS.kernel + '\nserver is up and running\n' : ''); return 0; });
  def(['exportfs', 'showmount'], async (c) => { if (c.name === 'exportfs' && c.cred.uid !== 0) { c.err('exportfs: could not open /var/lib/nfs/.etab.lock for locking: errno 13 (Permission denied)\n'); return 1; } let t = ''; try { t = c.fs.readFile('/etc/exports', null); } catch (e) { /* 없음 */ } t.split('\n').filter((l) => l.trim() && !l.startsWith('#')).forEach((l) => { const [p, h] = l.trim().split(/\s+/); c.out(c.name === 'showmount' ? `${p} ${(h || '*').split('(')[0]}\n` : `${p.padEnd(15)}\t${(h || '<world>').split('(')[0]}\n`); }); return 0; });

  // ======================================================================= 기타 도구
  def(['lynx', 'w3m', 'links', 'elinks'], async (c) => {
    const url = c.args.filter((a) => !a.startsWith('-')).pop();
    if (!url) { c.err(`${c.name}: Can't access startfile\n`); return 1; }
    const r = await LX.httpReq(c, url, {});
    if (r.error) { c.err(`${c.name}: Can't access startfile ${url}\n`); return 1; }
    const text = String(r.body).replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<title>([\s\S]*?)<\/title>/i, '').replace(/<h\d[^>]*>([\s\S]*?)<\/h\d>/gi, '\n   $1\n\n').replace(/<li>/gi, '   * ').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n{3,}/g, '\n\n');
    c.out(text.trim() + '\n');
    return 0;
  });
  def('sensors', async (c) => { c.out('acpitz-acpi-0\nAdapter: ACPI interface\ntemp1:        +45.0°C  \n\n\x1b[2m(가상 머신에서는 실제 센서 값을 읽을 수 없는 경우가 많습니다)\x1b[0m\n'); return 0; });
  def('smartctl', async (c) => { if (c.cred.uid !== 0) { c.err('smartctl 7.4 2023-08-01 r5530 [x86_64-linux-' + LX.OS.kernel + '] (local build)\nCopyright (C) 2002-23, Bruce Allen, Christian Franke, www.smartmontools.org\n\nSmartctl open device: /dev/sda failed: Permission denied\n'); return 2; } c.out(`smartctl 7.4 2023-08-01 r5530 [x86_64-linux-${LX.OS.kernel}] (local build)\n\n=== START OF INFORMATION SECTION ===\nDevice Model:     VBOX HARDDISK\nFirmware Version: 1.0\nUser Capacity:    26,843,545,600 bytes [26.8 GB]\nSMART support is: Unavailable - device lacks SMART capability.\n`); return 0; });
  def('stress', async (c) => { const t = +((c.args[c.args.indexOf('--timeout') + 1] || '').replace(/s$/, '') || 10); c.out(`stress: info: [${c.m.nextPid()}] dispatching hogs: ${(c.args[c.args.indexOf('--cpu') + 1] || 1)} cpu, 0 io, 0 vm, 0 hdd\n`); await c.sleep(Math.min(t, 30) * 1000); c.out(`stress: info: [${c.m.pidSeq}] successful run completed in ${t}s\n`); return 0; });
  def('iperf3', async (c) => { if (c.args.includes('-s')) { c.out('-----------------------------------------------------------\nServer listening on 5201 (test #1)\n-----------------------------------------------------------\n'); c.err('\x1b[2m(가상 터미널: 두 대의 서버에서 iperf3 -s / iperf3 -c 로 실습하세요)\x1b[0m\n'); return 0; } c.err('iperf3: error - unable to connect to server - server may not be running: Connection refused\n'); return 1; });
  def('ncdu', async (c) => { c.err('\x1b[2m(가상 터미널: ncdu 화면 대신 du 결과로 보여 줍니다)\x1b[0m\n'); return LX.commands.du(Object.assign({}, c, { args: ['-h', '--max-depth=1', c.args[0] || '.'] })); });
  def(['mc', 'lnav', 'btop', 'iotop', 'nethogs', 'iftop', 'vimtutor'], async (c) => { c.err(`${c.name}: 가상 터미널에서는 전체 화면 프로그램을 지원하지 않습니다. 실제 Ubuntu 에서 실행해 보세요.\n`); return 1; });
  def(['zsh', 'fish', 'ksh'], async (c) => { if (c.args.includes('--version')) { c.out('zsh 5.9 (x86_64-ubuntu-linux-gnu)\n'); return 0; } c.err(`\x1b[2m(가상 터미널: ${c.name} 대신 bash 로 동작합니다)\x1b[0m\n`); return LX.commands.bash(c); });
  def(['7z', '7za'], async (c) => { c.out('\n7-Zip [64] 16.02 : Copyright (c) 1999-2016 Igor Pavlov : 2016-05-21\np7zip Version 16.02 (locale=en_US.UTF-8,Utf16=on,HugeFiles=on,64 bits,2 CPUs Intel(R) Core(TM) i5-1240P (906A3),ASM,AES-NI)\n\n'); c.err('\x1b[2m(가상 터미널: 7z 압축은 zip · tar 로 실습하세요)\x1b[0m\n'); return 0; });
  def(['clamscan', 'freshclam'], async (c) => { if (c.name === 'freshclam') { if (c.cred.uid !== 0) { c.err('ERROR: Failed to open log file /var/log/clamav/freshclam.log: Permission denied\n'); return 1; } c.out(`ClamAV update process started at ${LX.strftime(c.m, '%a %b %e %H:%M:%S %Y', c.m.now())}\ndaily.cvd database is up-to-date (version: 27774, sigs: 2074533, f-level: 90, builder: raynman)\nmain.cvd database is up-to-date (version: 62, sigs: 6647427, f-level: 90, builder: sigmgr)\nbytecode.cvd database is up-to-date (version: 336, sigs: 83, f-level: 90, builder: nrandolph)\n`); return 0; } const t = c.args.filter((a) => !a.startsWith('-')).pop() || '.'; let n = 0; c.fs.each(c.resolve(t), c.cred, (p, nd) => { if (nd.t === 'f') { n++; if (!c.args.includes('-i')) c.out(`${p}: OK\n`); } }); c.out(`\n----------- SCAN SUMMARY -----------\nKnown viruses: 8702142\nEngine version: 1.4.3\nScanned directories: 1\nScanned files: ${n}\nInfected files: 0\nData scanned: 0.12 MB\nData read: 0.06 MB (ratio 2.00:1)\nTime: 12.311 sec (0 m 12 s)\n`); return 0; });
  def(['auditctl', 'ausearch', 'aureport'], async (c) => { if (c.cred.uid !== 0) { c.err('You must be root to run this program.\n'); return 4; } if (c.args.includes('-l')) c.out('No rules\n'); return 0; });
  def(['getfacl', 'setfacl', 'chacl'], async (c) => {
    const f = c.args.filter((a) => !a.startsWith('-') && !/^[ugom]:/.test(a)).pop();
    const abs = c.resolve(f || '.');
    const n = c.fs.lookup(abs);
    if (!n) { c.err(`${c.name}: ${f}: No such file or directory\n`); return 1; }
    if (c.name === 'setfacl') {
      if (c.cred.uid !== 0 && n.u !== c.cred.uid) { c.err(`setfacl: ${f}: Operation not permitted\n`); return 1; }
      const mi = c.args.indexOf('-m');
      if (mi >= 0) { n.acl = (n.acl || []).filter((x) => x.split(':').slice(0, 2).join(':') !== c.args[mi + 1].split(':').slice(0, 2).join(':')).concat(c.args[mi + 1]); c.fs.touchChanged(); }
      if (c.args.includes('-b')) { delete n.acl; c.fs.touchChanged(); }
      const xi = c.args.indexOf('-x');
      if (xi >= 0) { n.acl = (n.acl || []).filter((x) => !x.startsWith(c.args[xi + 1])); c.fs.touchChanged(); }
      return 0;
    }
    const perm = (s) => ['r', 'w', 'x'].map((ch, i) => ((n.m >> (s + 2 - i)) & 1 ? ch : '-')).join('');
    c.out(`# file: ${f.replace(/^\//, '')}\n# owner: ${c.m.userName(n.u)}\n# group: ${c.m.groupName(n.g)}\nuser::${perm(6)}\n${(n.acl || []).filter((x) => x.startsWith('u:')).map((x) => `user:${x.split(':')[1]}:${x.split(':')[2]}`).join('\n')}${(n.acl || []).some((x) => x.startsWith('u:')) ? '\n' : ''}group::${perm(3)}\n${(n.acl || []).length ? `mask::rwx\n` : ''}other::${perm(0)}\n\n`);
    return 0;
  });
  def(['quota', 'repquota', 'edquota', 'quotacheck', 'quotaon'], async (c) => { c.err(`${c.name}: 가상 터미널에서는 디스크 할당량(quota)을 지원하지 않습니다. 실제 Ubuntu 에서 실습하세요.\n`); return 1; });
  def(['at', 'atq', 'atrm', 'batch'], async (c) => {
    if (c.name === 'atq') { (c.m.state.atJobs || []).forEach((j) => c.out(`${j.id}\t${LX.strftime(c.m, '%a %b %e %H:%M:%S %Y', j.t)} a ${j.user}\n`)); return 0; }
    if (c.name === 'atrm') { c.m.state.atJobs = (c.m.state.atJobs || []).filter((j) => !c.args.includes(String(j.id))); return 0; }
    const when = c.args.join(' ');
    const cmds = await c.readStdin();
    const mins = /now\s*\+\s*(\d+)\s*min/.exec(when);
    const t = c.m.now() + (mins ? +mins[1] * 60000 : 3600000);
    const id = (c.m.state.atSeq = (c.m.state.atSeq || 0) + 1);
    c.m.state.atJobs = (c.m.state.atJobs || []).concat({ id, t, user: c.cred.name, cmds });
    c.err(`warning: commands will be executed using /bin/sh\njob ${id} at ${LX.strftime(c.m, '%a %b %e %H:%M:%S %Y', t)}\n`);
    return 0;
  });
  def('cloud-init', async (c) => { if (c.args[0] === 'status') c.out('status: done\n'); else c.out('/usr/bin/cloud-init 25.1.4-0ubuntu0~24.04.1\n'); return 0; });
  def(['wg', 'wg-quick'], async (c) => { if (c.args[0] === 'genkey') { c.out(btoa(String.fromCharCode(...Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)))) + '\n'); return 0; } if (c.args[0] === 'pubkey') { await c.readStdin(); c.out(btoa(String.fromCharCode(...Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)))) + '\n'); return 0; } c.err('\x1b[2m(가상 터미널: WireGuard VPN 연결은 서버 두 대 이상에서 실습하세요)\x1b[0m\n'); return 1; });
  def('prometheus-node-exporter', async (c) => { c.err('\x1b[2m(가상 터미널: sudo systemctl start prometheus-node-exporter 로 실행하고 curl localhost:9100/metrics 로 확인하세요)\x1b[0m\n'); return 1; });
})(typeof window !== 'undefined' ? window : globalThis);

