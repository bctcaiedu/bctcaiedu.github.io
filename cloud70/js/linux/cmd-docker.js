
/* 가상 리눅스 — Docker (이미지 · 컨테이너 · 볼륨 · compose) */
(function (G) {
  const LX = G.LX = G.LX || {};
  const def = LX.def;
  const P = () => LX.path;

  // ======================================================================= 이미지 목록 (Docker Hub 흉내)
  const HUB = {
    'hello-world': { tags: ['latest'], size: '10.1kB', layers: 1, cmd: '/hello' },
    nginx: { tags: ['latest', 'alpine', '1.27', 'stable'], size: '192MB', alpineSize: '47.9MB', layers: 7, cmd: 'nginx -g daemon off;', port: 80, web: 'nginx' },
    httpd: { tags: ['latest', 'alpine', '2.4'], size: '148MB', layers: 6, cmd: 'httpd-foreground', port: 80, web: 'httpd' },
    ubuntu: { tags: ['latest', '24.04', '22.04', 'noble', 'jammy'], size: '78.1MB', layers: 1, cmd: '/bin/bash', os: true },
    debian: { tags: ['latest', 'bookworm', '12'], size: '117MB', layers: 1, cmd: 'bash', os: true },
    alpine: { tags: ['latest', '3.22'], size: '8.31MB', layers: 1, cmd: '/bin/sh', os: true },
    busybox: { tags: ['latest'], size: '4.28MB', layers: 1, cmd: 'sh', os: true },
    mysql: { tags: ['latest', '8.0', '8.4', '9'], size: '781MB', layers: 11, cmd: 'mysqld', port: 3306, env: ['MYSQL_ROOT_PASSWORD'] },
    mariadb: { tags: ['latest', '11', '10.11'], size: '407MB', layers: 9, cmd: 'mariadbd', port: 3306, env: ['MARIADB_ROOT_PASSWORD'] },
    postgres: { tags: ['latest', '16', '17', 'alpine'], size: '438MB', layers: 14, cmd: 'postgres', port: 5432, env: ['POSTGRES_PASSWORD'] },
    redis: { tags: ['latest', '7', 'alpine'], size: '117MB', layers: 8, cmd: 'redis-server', port: 6379 },
    node: { tags: ['latest', '22', '20', 'lts', 'alpine'], size: '1.12GB', layers: 8, cmd: 'node', os: true },
    python: { tags: ['latest', '3.12', '3.13', 'slim', 'alpine', '3.12-slim', '3.13-slim'], size: '1.02GB', layers: 8, cmd: 'python3', os: true },
    wordpress: { tags: ['latest', 'php8.3'], size: '700MB', layers: 22, cmd: 'apache2-foreground', port: 80, web: 'wordpress' },
    'portainer/portainer-ce': { tags: ['latest'], size: '186MB', layers: 10, cmd: '/portainer', port: 9000, web: 'portainer' },
    phpmyadmin: { tags: ['latest'], size: '562MB', layers: 20, cmd: 'apache2-foreground', port: 80, web: 'phpmyadmin' },
    grafana: { tags: ['latest'], size: '670MB', layers: 10, cmd: '/run.sh', port: 3000, web: 'grafana' },
    'grafana/grafana': { tags: ['latest'], size: '670MB', layers: 10, cmd: '/run.sh', port: 3000, web: 'grafana' },
    caddy: { tags: ['latest', '2', '2-alpine', 'alpine'], size: '50.4MB', layers: 6, cmd: 'caddy run --config /etc/caddy/Caddyfile --adapter caddyfile', port: 80, web: 'caddy' },
    'prom/prometheus': { tags: ['latest'], size: '313MB', layers: 10, cmd: '/bin/prometheus', port: 9090, web: 'prometheus' }
  };
  const hex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');

  function parseRef(ref) {
    let [name, tag] = ref.split(/:(?=[^/]*$)/);
    tag = tag || 'latest';
    name = name.replace(/^docker\.io\//, '').replace(/^library\//, '');
    return { name, tag, full: `${name}:${tag}` };
  }
  function findImage(m, ref) {
    const r = parseRef(ref);
    return (m.state.images || []).find((i) => (i.repo === r.name && i.tag === r.tag) || i.id.startsWith(ref));
  }
  function findCt(m, key) {
    return (m.state.containers || []).find((ct) => ct.name === key || ct.id.startsWith(key));
  }
  LX.dockerFindCt = findCt;

  function randName() {
    const a = ['admiring', 'brave', 'clever', 'dazzling', 'eager', 'focused', 'gifted', 'happy', 'jolly', 'keen', 'lucid', 'nifty', 'quirky', 'relaxed', 'sharp', 'vibrant', 'wizardly', 'zealous'];
    const b = ['turing', 'hopper', 'lovelace', 'torvalds', 'ritchie', 'thompson', 'knuth', 'dijkstra', 'shannon', 'babbage', 'curie', 'tesla', 'noether', 'hamilton', 'wozniak', 'kare'];
    return `${a[Math.floor(Math.random() * a.length)]}_${b[Math.floor(Math.random() * b.length)]}`;
  }

  function dockerCheck(c) {
    const m = c.m;
    if (!m.state.pkgs['docker.io'] && !m.state.pkgs['docker-ce']) return c.m.notFound('docker', c.io) && 127;
    if (c.cred.uid !== 0 && !c.cred.gids.includes((m.groups().find((g) => g.name === 'docker') || {}).gid)) {
      c.err('permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Head "http://%2Fvar%2Frun%2Fdocker.sock/_ping": dial unix /var/run/docker.sock: connect: permission denied\n');
      return 1;
    }
    if (!(m.state.services.docker && m.state.services.docker.active)) { c.err('Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?\n'); return 1; }
    m.state.containers = m.state.containers || [];
    m.state.images = m.state.images || [];
    m.state.volumes = m.state.volumes || [];
    return 0;
  }

  async function pull(c, ref, quiet) {
    const m = c.m;
    const r = parseRef(ref);
    if (findImage(m, ref)) return findImage(m, ref);
    const hub = HUB[r.name];
    if (!hub || !hub.tags.includes(r.tag)) {
      if (!quiet) { if (r.tag === 'latest' && !ref.includes(':')) c.out(`Using default tag: latest\n`); }
      c.err(`Error response from daemon: ${hub ? `manifest for ${r.full} not found: manifest unknown: manifest unknown` : `pull access denied for ${r.name}, repository does not exist or may require 'docker login': denied: requested access to the resource is denied`}\n`);
      return null;
    }
    if (LX.internetDown(m)) { c.err('Error response from daemon: Get "https://registry-1.docker.io/v2/": dial tcp: lookup registry-1.docker.io on 127.0.0.53:53: server misbehaving\n'); return null; }
    if (!quiet) {
      if (!ref.includes(':')) c.out('Using default tag: latest\n');
      c.out(`${r.tag}: Pulling from ${r.name.includes('/') ? r.name : 'library/' + r.name}\n`);
      const layers = Array.from({ length: hub.layers }, () => hex(12));
      for (const l of layers) { c.out(`${l}: Pull complete \n`); await c.sleep(c.session.headless ? 0 : 180); }
      c.out(`Digest: sha256:${hex(64)}\nStatus: Downloaded newer image for ${r.name}:${r.tag}\n${r.name.includes('/') ? 'docker.io/' : 'docker.io/library/'}${r.name}:${r.tag}\n`);
    }
    const img = { repo: r.name, tag: r.tag, id: hex(12), size: r.tag === 'alpine' && hub.alpineSize ? hub.alpineSize : hub.size, created: m.now() - 86400000 * (3 + r.name.length), cmd: hub.cmd, hub: r.name };
    m.state.images.push(img);
    return img;
  }

  /** 컨테이너 안의 파일 시스템 (실행 중에만 메모리에 유지) */
  function ctMachine(c, ct) {
    const m = c.m;
    m.runtime = m.runtime || { servers: {} };
    m.runtime.cts = m.runtime.cts || {};
    if (m.runtime.cts[ct.id]) return m.runtime.cts[ct.id];
    const cm = new LX.Machine({ fresh: true });
    cm.vfs.writeFile('/etc/hostname', ct.id.slice(0, 12) + '\n', null);
    cm.vfs.writeFile('/.dockerenv', '', null);
    cm.defaultUser = 'root';
    const hub = HUB[(ct.hub || '').split(':')[0]] || {};
    // 이미지별 os-release
    const osRel = {
      alpine: 'NAME="Alpine Linux"\nID=alpine\nVERSION_ID=3.22.1\nPRETTY_NAME="Alpine Linux v3.22"\nHOME_URL="https://alpinelinux.org/"\nBUG_REPORT_URL="https://gitlab.alpinelinux.org/alpine/aports/-/issues"\n',
      busybox: 'NAME="Alpine Linux"\nID=alpine\nVERSION_ID=3.22.1\nPRETTY_NAME="Alpine Linux v3.22"\n',
      debian: 'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nNAME="Debian GNU/Linux"\nVERSION_ID="12"\nVERSION="12 (bookworm)"\nVERSION_CODENAME=bookworm\nID=debian\nHOME_URL="https://www.debian.org/"\nSUPPORT_URL="https://www.debian.org/support"\nBUG_REPORT_URL="https://bugs.debian.org/"\n',
      node: 'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nNAME="Debian GNU/Linux"\nVERSION_ID="12"\nVERSION="12 (bookworm)"\nVERSION_CODENAME=bookworm\nID=debian\n',
      python: 'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nNAME="Debian GNU/Linux"\nVERSION_ID="12"\nVERSION="12 (bookworm)"\nVERSION_CODENAME=bookworm\nID=debian\n',
      nginx: 'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nNAME="Debian GNU/Linux"\nVERSION_ID="12"\nVERSION="12 (bookworm)"\nVERSION_CODENAME=bookworm\nID=debian\n',
      mysql: 'NAME="Oracle Linux Server"\nVERSION="9.6"\nID="ol"\nID_LIKE="fedora"\nVERSION_ID="9.6"\nPRETTY_NAME="Oracle Linux Server 9.6"\n',
      redis: 'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nNAME="Debian GNU/Linux"\nVERSION_ID="12"\nVERSION="12 (bookworm)"\nVERSION_CODENAME=bookworm\nID=debian\n',
      postgres: 'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nNAME="Debian GNU/Linux"\nVERSION_ID="12"\nVERSION="12 (bookworm)"\nVERSION_CODENAME=bookworm\nID=debian\n'
    };
    const key = (ct.hub || '').split(':')[0];
    const isAlpine = /alpine/.test(ct.image || '') || key === 'alpine' || key === 'busybox';
    const rel = isAlpine ? osRel.alpine : osRel[key];
    if (rel) { try { cm.vfs.unlink('/etc/os-release', null); } catch (e) { /* 없음 */ } cm.vfs.writeFile('/usr/lib/os-release', rel, null); cm.vfs.writeFile('/etc/os-release', rel, null); }
    // 볼륨(-v): 호스트 디렉터리 내용을 컨테이너 경로에 복사 (읽기 전용 스냅샷)
    (ct.volumes || []).forEach((v) => {
      const hostPath = v.named ? `/var/lib/docker/volumes/${v.src}/_data` : v.src;
      try {
        const n = m.vfs.lookup(hostPath);
        if (!n) return;
        cm.vfs.mkdir(v.dst, null, { parents: true });
        if (n.t === 'd') m.vfs.each(hostPath, null, (p, node) => { const dst = v.dst.replace(/\/$/, '') + p.slice(hostPath.length); try { if (node.t === 'd') cm.vfs.mkdir(dst, null, { parents: true }); else if (node.t === 'f') { cm.vfs.mkdir(P().dirname(dst), null, { parents: true }); cm.vfs.writeFile(dst, node.c || '', null); } } catch (e) { /* 무시 */ } });
        else if (n.t === 'f') { try { cm.vfs.rmdir(v.dst, null); } catch (e) { /* 무시 */ } cm.vfs.writeFile(v.dst, n.c || '', null); }
      } catch (e) { /* 무시 */ }
    });
    cm.ctEnv = Object.fromEntries((ct.env || []).map((e) => { const k = e.indexOf('='); return k > 0 ? [e.slice(0, k), e.slice(k + 1)] : [e, '']; }));
    cm.ctEnv.HOSTNAME = ct.id.slice(0, 12);
    if (hub.web === 'nginx') {
      cm.vfs.mkdir('/usr/share/nginx/html', null, { parents: true });
      cm.vfs.writeFile('/usr/share/nginx/html/index.html', LX.TPL.nginxIndex, null);
      cm.vfs.mkdir('/etc/nginx/conf.d', null, { parents: true });
      cm.vfs.writeFile('/etc/nginx/conf.d/default.conf', 'server {\n    listen       80;\n    listen  [::]:80;\n    server_name  localhost;\n\n    location / {\n        root   /usr/share/nginx/html;\n        index  index.html index.htm;\n    }\n\n    error_page   500 502 503 504  /50x.html;\n    location = /50x.html {\n        root   /usr/share/nginx/html;\n    }\n}\n', null);
    }
    if (hub.web === 'httpd') { cm.vfs.mkdir('/usr/local/apache2/htdocs', null, { parents: true }); cm.vfs.writeFile('/usr/local/apache2/htdocs/index.html', '<html><body><h1>It works!</h1></body></html>\n', null); }
    (ct.copied || []).forEach((f) => { try { cm.vfs.mkdir(P().dirname(f.dst), null, { parents: true }); cm.vfs.writeFile(f.dst, f.c, null); } catch (e) { /* 무시 */ } });
    if (LX.ctSetupHook) { try { LX.ctSetupHook(m, ct, cm, hub); } catch (e) { /* 무시 */ } }
    m.runtime.cts[ct.id] = cm;
    return cm;
  }
  LX.ctMachine = ctMachine;
  /** 컨테이너 셸에 -e 환경 변수 적용 */
  function applyCtEnv(sh, cm) {
    Object.entries(cm.ctEnv || {}).forEach(([k, v]) => { sh.vars[k] = { v, x: true }; });
    if (!sh.vars.PATH) sh.vars.PATH = { v: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', x: true };
  }
  function ctShell(c, ct, cm) {
    const sh = new LX.Shell(c.session, { machine: cm, user: 'root' });
    sh.cwd = '/';
    applyCtEnv(sh, cm);
    return sh;
  }
  /** Go 템플릿 흉내: {{.A.B}} {{json .A}} {{range .A}}…{{end}} */
  function goTemplate(fmt, obj) {
    const get = (o, path) => path.replace(/^\./, '').split('.').filter(Boolean).reduce((x, k) => (x == null ? undefined : x[k]), o);
    const str = (v) => (v == null ? '<no value>' : typeof v === 'object' ? (Array.isArray(v) ? '[' + v.map(str).join(' ') + ']' : 'map[' + Object.entries(v).map(([k, x]) => `${k}:${str(x)}`).join(' ') + ']') : String(v));
    let out = fmt.replace(/\{\{\s*range\s+([.\w]+)\s*\}\}([\s\S]*?)\{\{\s*end\s*\}\}/g, (all, path, body) => {
      const v = get(obj, path);
      const items = Array.isArray(v) ? v : v && typeof v === 'object' ? Object.entries(v).map(([k, x]) => Object.assign({ $key: k }, typeof x === 'object' ? x : { $val: x })) : [];
      return items.map((it) => goTemplate(body.replace(/\{\{\s*\$key\s*\}\}/g, str(it.$key)).replace(/\{\{\s*\$val\s*\}\}/g, str(it.$val)), typeof it === 'object' ? it : { '': it }).replace(/\{\{\s*\.\s*\}\}/g, str(it))).join('');
    });
    out = out.replace(/\{\{\s*json\s+([.\w]+)\s*\}\}/g, (all, path) => JSON.stringify(get(obj, path)));
    out = out.replace(/\{\{\s*(\.[.\w]*)\s*\}\}/g, (all, path) => (path === '.' ? str(obj) : str(get(obj, path))));
    return out.replace(/\\t/g, '\t').replace(/\\n/g, '\n');
  }
  function ctJson(m, ct) {
    const S = m.state;
    const ip = ct.running ? `172.17.0.${2 + S.containers.filter((x) => x.running).indexOf(ct)}` : '';
    return { Id: ct.id + '0'.repeat(52), Created: new Date(ct.created).toISOString(), Path: ct.cmd, Args: [], State: { Status: ct.running ? 'running' : 'exited', Running: ct.running, Paused: false, Restarting: false, Pid: ct.running ? ct.pid : 0, ExitCode: ct.exited || 0, StartedAt: new Date(ct.started || ct.created).toISOString(), FinishedAt: ct.running ? '0001-01-01T00:00:00Z' : new Date(ct.stopped || ct.created).toISOString() }, Image: 'sha256:' + LX.fakeHash(ct.image, 64), Name: '/' + ct.name, RestartCount: 0, Platform: 'linux', HostConfig: { PortBindings: Object.fromEntries(ct.ports.map((p) => [`${p.cont}/tcp`, [{ HostIp: '', HostPort: String(p.host) }]])), RestartPolicy: { Name: ct.restart || 'no', MaximumRetryCount: 0 }, Binds: ct.volumes.map((v) => `${v.src}:${v.dst}${v.mode ? ':' + v.mode : ''}`), NetworkMode: 'bridge', Memory: 0, NanoCpus: 0 }, Mounts: ct.volumes.map((v) => ({ Type: v.named ? 'volume' : 'bind', Name: v.named ? v.src : undefined, Source: v.named ? `/var/lib/docker/volumes/${v.src}/_data` : v.src, Destination: v.dst, Mode: v.mode || (v.named ? 'z' : ''), RW: v.mode !== 'ro', Propagation: v.named ? '' : 'rprivate' })), Config: { Hostname: ct.id.slice(0, 12), Image: ct.image, Env: ct.env.concat(['PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin/sbin:/bin']), Cmd: String(ct.cmd || '').split(' '), ExposedPorts: Object.fromEntries(ct.ports.map((p) => [`${p.cont}/tcp`, {}])), Labels: ct.compose ? { 'com.docker.compose.project': ct.compose, 'com.docker.compose.service': ct.name.split('-').slice(1, -1).join('-') } : {} }, NetworkSettings: { Bridge: '', Ports: Object.fromEntries(ct.ports.map((p) => [`${p.cont}/tcp`, ct.running ? [{ HostIp: '0.0.0.0', HostPort: String(p.host) }, { HostIp: '::', HostPort: String(p.host) }] : null])), IPAddress: ip, Gateway: ct.running ? '172.17.0.1' : '', MacAddress: ct.running ? '02:42:ac:11:00:0' + (2 + S.containers.indexOf(ct) % 8) : '', Networks: { bridge: { IPAddress: ip, Gateway: ct.running ? '172.17.0.1' : '', NetworkID: LX.fakeHash('bridge', 64) } } } };
  }

  /** 컨테이너 웹 서버 응답 */
  LX.dockerServe = async function (m, listener, req) {
    const ct = (m.state.containers || []).find((x) => x.id === listener.container);
    if (!ct) return { status: 502, headers: {}, body: '' };
    const hub = HUB[ct.hub] || {};
    const log = (st) => { ct.logs = (ct.logs || []).concat(`172.17.0.1 - - [${LX.strftime(m, '%d/%b/%Y:%H:%M:%S +0000', m.now(), true)}] "${req.method} ${req.path} HTTP/1.1" ${st} 615 "-" "curl/8.5.0" "-"`).slice(-200); };
    if (LX.ctServeHook) { const hr = await LX.ctServeHook(m, ct, hub, req, log); if (hr) return hr; }
    const root = hub.web === 'nginx' ? '/usr/share/nginx/html' : hub.web === 'httpd' ? '/usr/local/apache2/htdocs' : '/var/www/html';
    if (hub.web === 'nginx' || hub.web === 'httpd') {
      const path = decodeURIComponent(req.path.split('?')[0]).replace(/\/$/, '/index.html');
      // 볼륨으로 연결된 호스트 디렉터리
      const vol = (ct.volumes || []).find((v) => (root + path).startsWith(v.dst));
      let text = null;
      if (vol) {
        const hostPath = vol.named ? `/var/lib/docker/volumes/${vol.src}/_data` : vol.src;
        try { text = m.vfs.readFile(hostPath + (root + path).slice(vol.dst.length), null); } catch (e) { text = null; }
      } else {
        const cm = m.runtime && m.runtime.cts && m.runtime.cts[ct.id];
        if (cm) { try { text = cm.vfs.readFile(root + path, null); } catch (e) { text = null; } }
        else if (path === '/index.html') text = hub.web === 'nginx' ? LX.TPL.nginxIndex : '<html><body><h1>It works!</h1></body></html>\n';
        (ct.copied || []).forEach((f) => { if (f.dst === root + path) text = f.c; });
      }
      if (text == null) { log(404); return { status: 404, headers: { Server: hub.web === 'nginx' ? 'nginx/1.29.1' : 'Apache/2.4.65 (Unix)', 'Content-Type': 'text/html' }, body: hub.web === 'nginx' ? '<html>\r\n<head><title>404 Not Found</title></head>\r\n<body>\r\n<center><h1>404 Not Found</h1></center>\r\n<hr><center>nginx/1.29.1</center>\r\n</body>\r\n</html>\r\n' : '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">\n<html><head>\n<title>404 Not Found</title>\n</head><body>\n<h1>Not Found</h1>\n</body></html>\n' }; }
      log(200);
      return { status: 200, headers: { Server: hub.web === 'nginx' ? 'nginx/1.29.1' : 'Apache/2.4.65 (Unix)', 'Content-Type': 'text/html', 'Content-Length': String(LX.byteLen(text)) }, body: text };
    }
    if (hub.web === 'wordpress') { log(302); return { status: 302, headers: { Location: `http://${req.host}:${req.port}/wp-admin/install.php`, 'X-Powered-By': 'PHP/8.3.25', Server: 'Apache/2.4.62 (Debian)' }, body: '' }; }
    if (hub.web) { log(200); return { status: 200, headers: { 'Content-Type': 'text/html' }, body: `<!doctype html><html><head><title>${hub.web}</title></head><body>${hub.web} (가상 컨테이너)</body></html>\n` }; }
    if (ct.app) return ct.app(req);
    return { status: 200, headers: { 'Content-Type': 'text/plain' }, body: `Hello from container ${ct.name}\n` };
  };

  function helloWorld() {
    return '\nHello from Docker!\nThis message shows that your installation appears to be working correctly.\n\nTo generate this message, Docker took the following steps:\n 1. The Docker client contacted the Docker daemon.\n 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.\n    (amd64)\n 3. The Docker daemon created a new container from that image which runs the\n    executable that produces the output you are currently reading.\n 4. The Docker daemon streamed that output to the Docker client, which sent it\n    to your terminal.\n\nTo try something more ambitious, you can run an Ubuntu container with:\n $ docker run -it ubuntu bash\n\nShare images, automate workflows, and more with a free Docker ID:\n https://hub.docker.com/\n\nFor more examples and ideas, visit:\n https://docs.docker.com/get-started/\n\n';
  }

  function ago(m, t) {
    const s = Math.floor((m.now() - t) / 1000);
    if (s < 60) return s < 2 ? 'Less than a second ago' : `${s} seconds ago`;
    if (s < 3600) return `${Math.floor(s / 60)} minute${s < 120 ? '' : 's'} ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} hour${s < 7200 ? '' : 's'} ago`;
    return `${Math.floor(s / 86400)} days ago`;
  }
  function table(rows, heads) {
    const w = heads.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
    return [heads].concat(rows).map((r) => r.map((v, i) => (i === r.length - 1 ? String(v) : String(v).padEnd(w[i] + 3))).join('')).join('\n') + '\n';
  }

  /** docker run 옵션 해석 */
  function parseRun(args) {
    const o = { detach: false, it: false, rm: false, name: null, ports: [], env: [], volumes: [], restart: 'no', image: null, cmd: [] };
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (o.image) { o.cmd.push(a); continue; }
      if (a === '-d' || a === '--detach') o.detach = true;
      else if (/^-[dit]+$/.test(a)) { if (a.includes('d')) o.detach = true; if (a.includes('i') || a.includes('t')) o.it = true; }
      else if (a === '--rm') o.rm = true;
      else if (a === '--name') o.name = args[++i];
      else if (a.startsWith('--name=')) o.name = a.slice(7);
      else if (a === '-p' || a === '--publish') o.ports.push(args[++i]);
      else if (a === '-e' || a === '--env') o.env.push(args[++i]);
      else if (a === '-v' || a === '--volume') o.volumes.push(args[++i]);
      else if (a === '--restart') o.restart = args[++i];
      else if (a.startsWith('--restart=')) o.restart = a.slice(10);
      else if (a === '--network' || a === '-w' || a === '--hostname' || a === '-h' || a === '--memory' || a === '-m' || a === '--cpus' || a === '-u' || a === '--user' || a === '--env-file' || a === '--entrypoint') i++;
      else if (a.startsWith('-')) continue;
      else o.image = a;
    }
    return o;
  }

  async function createContainer(c, o, img) {
    const m = c.m;
    const hub = HUB[img.hub || img.repo] || {};
    if (o.name && findCt(m, o.name) && findCt(m, o.name).name === o.name) {
      const ex = findCt(m, o.name);
      c.err(`docker: Error response from daemon: Conflict. The container name "/${o.name}" is already in use by container "${ex.id}${hex(52)}". You have to remove (or rename) that container to be able to reuse that name.\n\nRun 'docker run --help' for more information\n`);
      return null;
    }
    const ports = [];
    for (const p of o.ports) {
      const parts = p.split(':');
      const cont = +parts[parts.length - 1].split('/')[0];
      const host = parts.length >= 2 ? +parts[parts.length - 2] : 32768 + Math.floor(Math.random() * 1000);
      if (LX.ports(m).some((x) => x.proto === 'tcp' && x.port === host && (x.addr === '0.0.0.0' || x.addr === '*'))) {
        c.err(`docker: Error response from daemon: failed to set up container networking: driver failed programming external connectivity on endpoint ${o.name || 'x'} (${hex(64)}): Bind for 0.0.0.0:${host} failed: port is already allocated\n\nRun 'docker run --help' for more information\n`);
        return 'porterr';
      }
      ports.push(parts.length >= 3 && parts[0] ? { host, cont, ip: parts[0] } : { host, cont });
    }
    const volumes = o.volumes.map((v) => {
      const [src, dst, mode] = v.split(':');
      const named = !src.startsWith('/') && !src.startsWith('.') && !src.startsWith('~');
      let s = named ? src : c.resolve(src.replace(/^~/, c.cred.home));
      if (named) {
        if (!m.state.volumes.includes(src)) m.state.volumes.push(src);
        m.vfs.mkdir(`/var/lib/docker/volumes/${src}/_data`, null, { parents: true });
      } else if (!m.vfs.lookup(s)) m.vfs.mkdir(s, null, { parents: true });
      return { src: s, dst, mode, named };
    });
    const env = o.env.map((e) => (e.includes('=') ? e : `${e}=${c.env(e)}`));
    if (hub.env && !hub.env.some((k) => env.some((e) => e.startsWith(k + '=')) || env.some((e) => /ALLOW_EMPTY_PASSWORD|RANDOM_ROOT_PASSWORD/.test(e)))) {
      const ct = { id: hex(12), name: o.name || randName(), image: `${img.repo}:${img.tag}`.replace(/:latest$/, ''), hub: img.hub || img.repo, cmd: hub.cmd, created: m.now(), running: false, exited: 1, ports: [], volumes, env, restart: o.restart, logs: [`${img.repo === 'postgres' ? 'Error: Database is uninitialized and superuser password is not specified.\n       You must specify POSTGRES_PASSWORD to a non-empty value for the\n       superuser.' : `${LX.strftime(m, '%Y-%m-%d %H:%M:%S+00:00', m.now(), true)} [ERROR] [Entrypoint]: Database is uninitialized and password option is not specified\n    You need to specify one of the following as an environment variable:\n    - ${hub.env[0]}\n    - MYSQL_ALLOW_EMPTY_PASSWORD\n    - MYSQL_RANDOM_ROOT_PASSWORD`}`] };
      m.state.containers.push(ct);
      return ct;
    }
    const cmd = o.cmd.length ? o.cmd.join(' ') : img.cmd || hub.cmd;
    const ct = { id: hex(12), name: o.name || randName(), image: `${img.repo}${img.tag === 'latest' ? '' : ':' + img.tag}`, hub: img.hub || img.repo, cmd, created: m.now(), started: m.now(), running: false, exited: null, ports, volumes, env, restart: o.restart, pid: m.nextPid(), logs: [], copied: img.copied || [], app: null };
    m.state.containers.push(ct);
    return ct;
  }

  function startCt(m, ct) {
    const hub = HUB[ct.hub] || {};
    if (hub.os && !ct.it && !(LX.pyWebCmd && LX.pyWebCmd(ct.cmd))) { ct.running = false; ct.exited = 0; return; }
    if (ct.hub === 'hello-world') { ct.running = false; ct.exited = 0; ct.logs = [helloWorld()]; return; }
    ct.running = true;
    ct.exited = null;
    ct.started = m.now();
    ct.pid = m.nextPid();
    ct.cmdline = hub.web === 'nginx' ? 'nginx: master process nginx -g daemon off;' : ct.cmd;
    if (hub.web === 'nginx' && !ct.logs.length) ct.logs.push('/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration\n/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/\n/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh\n10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf\n10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf\n/docker-entrypoint.sh: Configuration complete; ready for start up\n' + `${LX.strftime(m, '%Y/%m/%d %H:%M:%S', m.now(), true)} [notice] 1#1: using the "epoll" event method\n${LX.strftime(m, '%Y/%m/%d %H:%M:%S', m.now(), true)} [notice] 1#1: nginx/1.29.1\n${LX.strftime(m, '%Y/%m/%d %H:%M:%S', m.now(), true)} [notice] 1#1: start worker processes`);
    if (/mysql|mariadb/.test(ct.hub) && !ct.logs.length) ct.logs.push(`${LX.strftime(m, '%Y-%m-%dT%H:%M:%S.000000Z', m.now(), true)} 0 [System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections. Version: '8.4.6'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server - GPL.`);
    if (ct.hub === 'redis' && !ct.logs.length) ct.logs.push('1:M 27 Sep 2026 07:12:24.000 * Ready to accept connections tcp');
    if (ct.hub === 'postgres' && !ct.logs.length) ct.logs.push(`${LX.strftime(m, '%Y-%m-%d %H:%M:%S.000 UTC', m.now(), true)} [1] LOG:  database system is ready to accept connections`);
  }

  // ======================================================================= docker 명령
  def('docker', async (c) => {
    const m = c.m;
    const args = c.args.slice();
    const sub = args.shift();
    if (sub === '--version' || sub === '-v') { c.out('Docker version 27.5.1, build 27.5.1-0ubuntu3~24.04.2\n'); return 0; }
    if (!sub || sub === '--help' || sub === 'help') { c.out('\nUsage:  docker [OPTIONS] COMMAND\n\nA self-sufficient runtime for containers\n\nCommon Commands:\n  run         Create and run a new container from an image\n  exec        Execute a command in a running container\n  ps          List containers\n  build       Build an image from a Dockerfile\n  pull        Download an image from a registry\n  push        Upload an image to a registry\n  images      List images\n  login       Authenticate to a registry\n  logout      Log out from a registry\n  search      Search Docker Hub for images\n  version     Show the Docker version information\n  info        Display system-wide information\n\nManagement Commands:\n  compose*    Docker Compose\n  container   Manage containers\n  image       Manage images\n  network     Manage networks\n  system      Manage Docker\n  volume      Manage volumes\n\nRun \'docker COMMAND --help\' for more information on a command.\n'); return 0; }
    const chk = dockerCheck(c);
    if (chk) return chk;
    const S = m.state;
    // 관리 명령 → 짧은 명령으로
    let cmd = sub;
    if (sub === 'container') { cmd = args.shift(); if (cmd === 'ls' || cmd === 'list') cmd = 'ps'; if (cmd === 'prune') cmd = 'container-prune'; }
    if (sub === 'image') { cmd = args.shift(); if (cmd === 'ls' || cmd === 'list') cmd = 'images'; if (cmd === 'rm' || cmd === 'remove') cmd = 'rmi'; if (cmd === 'pull') cmd = 'pull'; if (cmd === 'prune') cmd = 'image-prune'; if (cmd === 'history') cmd = 'history'; if (cmd === 'inspect') cmd = 'inspect'; }
    switch (cmd) {
      case 'container-prune': {
        if (!args.includes('-f') && !args.includes('--force')) { const a = await c.readLine('WARNING! This will remove all stopped containers.\nAre you sure you want to continue? [y/N] ', { tty: true, answer: 'y' }); if (!/^y/i.test(a || '')) return 0; }
        const gone = S.containers.filter((x) => !x.running);
        S.containers = S.containers.filter((x) => x.running);
        gone.forEach((x) => { if (m.runtime && m.runtime.cts) delete m.runtime.cts[x.id]; });
        c.out((gone.length ? 'Deleted Containers:\n' + gone.map((x) => x.id + hex(52)).join('\n') + '\n\n' : '') + `Total reclaimed space: ${gone.length ? (gone.length * 1.09).toFixed(2) + 'kB' : '0B'}\n`);
        return 0;
      }
      case 'image-prune': {
        const all = args.includes('-a') || args.includes('--all');
        if (!args.includes('-f') && !args.includes('--force')) { const a = await c.readLine(`WARNING! This will remove all ${all ? 'images without at least one container associated to them' : 'dangling images'}.\nAre you sure you want to continue? [y/N] `, { tty: true, answer: 'y' }); if (!/^y/i.test(a || '')) return 0; }
        const used = new Set(S.containers.map((x) => x.image.split(':')[0]));
        const gone = S.images.filter((i) => (i.repo === '<none>') || (all && !used.has(i.repo)));
        S.images = S.images.filter((i) => !gone.includes(i));
        c.out((gone.length ? 'Deleted Images:\n' + gone.map((i) => (i.repo !== '<none>' ? `untagged: ${i.repo}:${i.tag}\n` : '') + `deleted: sha256:${i.id}${hex(52)}`).join('\n') + '\n\n' : '') + `Total reclaimed space: ${gone.length ? gone.map((i) => i.size).join(' + ') : '0B'}\n`);
        return 0;
      }
      case 'history': {
        const img = findImage(m, args.filter((a) => !a.startsWith('-'))[0] || '');
        if (!img) { c.err(`Error response from daemon: No such image: ${args[0]}\n`); return 1; }
        const hub = HUB[img.hub || img.repo] || { layers: 3 };
        const rows = [[img.id, ago(m, img.created), `CMD ["${img.cmd}"]`, '0B', 'buildkit.dockerfile.v0']];
        for (let k = 1; k < (hub.layers || 3); k++) rows.push(['<missing>', ago(m, img.created - k * 3600000), k === hub.layers - 1 ? '/bin/sh -c #(nop) ADD file:' + hex(12) + ' in / ' : ['/bin/sh -c #(nop)  EXPOSE ' + (hub.port || 80), 'RUN /bin/sh -c apt-get update && apt-get install -y …', '/bin/sh -c #(nop)  ENV PATH=/usr/local/sbin:…', 'COPY docker-entrypoint.sh / # buildkit'][k % 4], k % 3 ? '0B' : (parseFloat(img.size) / hub.layers).toFixed(1) + 'MB', '']);
        c.out(table(rows, ['IMAGE', 'CREATED', 'CREATED BY', 'SIZE', 'COMMENT']));
        return 0;
      }
      case 'version': c.out(`Client:\n Version:           27.5.1\n API version:       1.47\n Go version:        go1.22.2\n Git commit:        27.5.1-0ubuntu3~24.04.2\n Built:             Mon Jun  2 11:51:53 2025\n OS/Arch:           linux/amd64\n Context:           default\n\nServer:\n Engine:\n  Version:          27.5.1\n  API version:      1.47 (minimum version 1.24)\n  Go version:       go1.22.2\n  OS/Arch:          linux/amd64\n containerd:\n  Version:          1.7.27\n runc:\n  Version:          1.2.5\n`); return 0;
      case 'info': c.out(`Client:\n Version:    27.5.1\n Context:    default\n Debug Mode: false\n\nServer:\n Containers: ${S.containers.length}\n  Running: ${S.containers.filter((x) => x.running).length}\n  Paused: 0\n  Stopped: ${S.containers.filter((x) => !x.running).length}\n Images: ${S.images.length}\n Server Version: 27.5.1\n Storage Driver: overlay2\n Logging Driver: json-file\n Cgroup Driver: systemd\n Cgroup Version: 2\n Kernel Version: ${LX.OS.kernel}\n Operating System: ${LX.OS.pretty}\n OSType: linux\n Architecture: x86_64\n CPUs: 2\n Total Memory: 3.82GiB\n Name: ${m.hostname()}\n Docker Root Dir: /var/lib/docker\n`); return 0;
      case 'pull': { const img = await pull(c, args.filter((a) => !a.startsWith('-'))[0] || '', false); return img ? 0 : 1; }
      case 'search': {
        const kw = (args[0] || '').toLowerCase();
        c.out(table(Object.keys(HUB).filter((k) => k.includes(kw)).map((k) => [k, `Official build of ${k}`, 10000 + k.length * 331, !k.includes('/') ? '[OK]' : '']), ['NAME', 'DESCRIPTION', 'STARS', 'OFFICIAL']));
        return 0;
      }
      case 'images': {
        const q = args.includes('-q');
        if (q) { S.images.forEach((i) => c.out(i.id + '\n')); return 0; }
        c.out(table(S.images.slice().reverse().map((i) => [i.repo, i.tag, i.id, ago(m, i.created), i.size]), ['REPOSITORY', 'TAG', 'IMAGE ID', 'CREATED', 'SIZE']));
        return 0;
      }
      case 'run': case 'create': {
        const o = parseRun(args);
        if (!o.image) { c.err('"docker run" requires at least 1 argument.\nSee \'docker run --help\'.\n\nUsage:  docker run [OPTIONS] IMAGE [COMMAND] [ARG...]\n\nCreate and run a new container from an image\n'); return 1; }
        let img = findImage(m, o.image);
        if (!img) {
          c.err(`Unable to find image '${parseRef(o.image).full}' locally\n`);
          img = await pull(c, o.image, false);
          if (!img) return 125;
        }
        const ct = await createContainer(c, o, img);
        if (!ct) return 125;
        if (ct === 'porterr') return 125;
        if (cmd === 'create') { c.out(ct.id + hex(52) + '\n'); return 0; }
        if (ct.exited === 1) { if (o.detach) c.out(ct.id + hex(52) + '\n'); else c.out(ct.logs.join('\n') + '\n'); return o.detach ? 0 : 1; }
        const hub = HUB[ct.hub] || {};
        if (o.it && (hub.os || o.cmd.length)) {
          ct.it = true;
          startCt(m, ct);
          if (!LX.canPush(c)) { ct.running = false; return 0; }
          const cm = ctMachine(c, ct);
          const psh = await c.session.pushShell('root', { machine: cm, cwd: '/', onExit: async () => { if (o.rm) S.containers = S.containers.filter((x) => x !== ct); else { ct.running = false; ct.exited = 0; } } });
          applyCtEnv(psh, cm);
          return 0;
        }
        startCt(m, ct);
        if (ct.hub === 'hello-world') { c.out(helloWorld()); if (o.rm) S.containers = S.containers.filter((x) => x !== ct); return 0; }
        if (!ct.running) {
          // 명령만 실행하고 끝나는 컨테이너 (예: docker run ubuntu echo hi)
          if (o.cmd.length) {
            const cm = ctMachine(c, ct);
            const sh = ctShell(c, ct, cm);
            let out = '';
            await sh.runSource(o.cmd.join(' '), { stdin: null, out: (s) => { out += s; }, err: (s) => { out += s; }, tty: false });
            ct.logs.push(out);
            if (!o.detach) c.out(out);
          }
          if (o.rm) S.containers = S.containers.filter((x) => x !== ct);
          if (o.detach) c.out(ct.id + hex(52) + '\n');
          return 0;
        }
        if (o.detach) { c.out(ct.id + hex(52) + '\n'); return 0; }
        // 앞에서 실행: 로그를 보여 주고 Ctrl+C 까지 대기
        c.out(ct.logs.join('\n') + '\n');
        if (c.session.headless) return 0;
        let shown = ct.logs.length;
        try {
          for (;;) {
            await c.sleep(500);
            if (!ct.running) break;
            if (ct.logs.length > shown) { c.out(ct.logs.slice(shown).join('\n') + '\n'); shown = ct.logs.length; }
          }
        } catch (e) {
          ct.running = false; ct.exited = 0;
          if (o.rm) S.containers = S.containers.filter((x) => x !== ct);
          c.session.aborted = false;
          return 0;
        }
        return 0;
      }
      case 'ps': {
        const all = args.includes('-a') || args.includes('--all');
        const q = args.includes('-q') || args.includes('--quiet');
        const fi = args.findIndex((a) => a === '--format' || a.startsWith('--format='));
        const fmt = fi >= 0 ? (args[fi].includes('=') ? args[fi].slice(9) : args[fi + 1]) : null;
        let list = S.containers.filter((x) => all || x.running).slice().reverse();
        // --filter name=x / status=running|exited
        args.forEach((a, i) => { if (a === '--filter' || a === '-f') { const [k, v] = (args[i + 1] || '').split('='); if (k === 'name') list = list.filter((x) => x.name.includes(v)); if (k === 'status') list = list.filter((x) => (v === 'running') === x.running); if (k === 'ancestor') list = list.filter((x) => x.image.split(':')[0] === v.split(':')[0]); } });
        if (args.includes('-l') || args.includes('--latest')) list = list.slice(0, 1);
        if (q) { list.forEach((x) => c.out(x.id + '\n')); return 0; }
        const portStr = (x) => (x.running ? x.ports.map((p) => (p.ip ? `${p.ip}:${p.host}->${p.cont}/tcp` : `0.0.0.0:${p.host}->${p.cont}/tcp, [::]:${p.host}->${p.cont}/tcp`)).join(', ') : '') || (x.running && HUB[x.hub] && HUB[x.hub].port ? `${HUB[x.hub].port}/tcp` : '');
        const status = (x) => (x.running ? `Up ${ago(m, x.started).replace(' ago', '')}` : `Exited (${x.exited || 0}) ${ago(m, x.stopped || x.created)}`);
        if (fmt) {
          const isTable = /^table\s+/.test(fmt);
          const tpl = fmt.replace(/^table\s+/, '');
          const fields = { ID: (x) => x.id, Image: (x) => x.image, Command: (x) => `"${String(x.cmdline || x.cmd || '').slice(0, 18)}…"`, CreatedAt: (x) => LX.strftime(m, '%Y-%m-%d %H:%M:%S %z %Z', x.created), RunningFor: (x) => ago(m, x.created), Status: status, State: (x) => (x.running ? 'running' : 'exited'), Ports: portStr, Names: (x) => x.name, Size: () => '0B (virtual 192MB)', Labels: (x) => (x.compose ? `com.docker.compose.project=${x.compose}` : ''), Networks: () => 'bridge' };
          const row = (x) => goTemplate(tpl, Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, f(x)])));
          if (isTable) {
            const heads = (tpl.match(/\{\{\s*\.(\w+)\s*\}\}/g) || []).map((s) => s.replace(/[{}.\s]/g, '').toUpperCase().replace('NAMES', 'NAMES').replace('ID', 'CONTAINER ID'));
            const rows = list.map((x) => row(x).split('\t'));
            c.out(table(rows, heads));
          } else list.forEach((x) => c.out(row(x) + '\n'));
          return 0;
        }
        c.out(table(list.map((x) => [x.id, x.image, `"${String(x.cmdline || x.cmd || '').slice(0, 18)}…"`, ago(m, x.created), status(x), portStr(x), x.name]), ['CONTAINER ID', 'IMAGE', 'COMMAND', 'CREATED', 'STATUS', 'PORTS', 'NAMES']));
        return 0;
      }
      case 'stop': case 'kill': case 'start': case 'restart': case 'pause': case 'unpause': {
        let st = 0;
        for (const k of args.filter((a) => !a.startsWith('-') && !/^\d+$/.test(a))) {
          const ct = findCt(m, k);
          if (!ct) { c.err(`Error response from daemon: No such container: ${k}\n`); st = 1; continue; }
          if (cmd === 'stop' || cmd === 'kill') { if (cmd === 'stop' && !c.session.headless) await c.sleep(300); ct.running = false; ct.exited = cmd === 'kill' ? 137 : 0; ct.stopped = m.now(); }
          else if (cmd === 'start' || cmd === 'restart') {
            if (ct.running && cmd === 'start') { c.out(k + '\n'); continue; }
            const busy = ct.ports.find((p) => LX.ports(m).some((x) => x.port === p.host && x.container !== ct.id && (x.addr === '0.0.0.0' || x.addr === '*')));
            if (busy) { c.err(`Error response from daemon: driver failed programming external connectivity on endpoint ${ct.name}: Bind for 0.0.0.0:${busy.host} failed: port is already allocated\nError: failed to start containers: ${k}\n`); st = 1; continue; }
            startCt(m, ct);
          }
          c.out(k + '\n');
        }
        return st;
      }
      case 'rm': {
        const force = args.includes('-f') || args.includes('--force');
        let st = 0;
        for (const k of args.filter((a) => !a.startsWith('-'))) {
          const ct = findCt(m, k);
          if (!ct) { c.err(`Error response from daemon: No such container: ${k}\n`); st = 1; continue; }
          if (ct.running && !force) { c.err(`Error response from daemon: cannot remove container "/${ct.name}": container is running: stop the container before removing or force remove\n`); st = 1; continue; }
          S.containers = S.containers.filter((x) => x !== ct);
          if (m.runtime && m.runtime.cts) delete m.runtime.cts[ct.id];
          c.out(k + '\n');
        }
        return st;
      }
      case 'rmi': {
        let st = 0;
        for (const k of args.filter((a) => !a.startsWith('-'))) {
          const img = findImage(m, k);
          if (!img) { c.err(`Error response from daemon: No such image: ${k}\n`); st = 1; continue; }
          const user = S.containers.find((x) => x.hub === img.repo || x.image.split(':')[0] === img.repo);
          if (user && !args.includes('-f')) { c.err(`Error response from daemon: conflict: unable to remove repository reference "${k}" (must force) - container ${user.id} is using its referenced image ${img.id}\n`); st = 1; continue; }
          S.images = S.images.filter((x) => x !== img);
          c.out(`Untagged: ${img.repo}:${img.tag}\nDeleted: sha256:${img.id}${hex(52)}\n`);
        }
        return st;
      }
      case 'logs': {
        const k = args.filter((a) => !a.startsWith('-') && !/^\d+$/.test(a))[0];
        const ct = findCt(m, k || '');
        if (!ct) { c.err(`Error response from daemon: No such container: ${k}\n`); return 1; }
        const ti = args.indexOf('--tail');
        let logs = ct.logs;
        if (ti >= 0) logs = logs.join('\n').split('\n').slice(-args[ti + 1]);
        c.out(logs.join('\n') + (logs.length ? '\n' : ''));
        if ((args.includes('-f') || args.includes('--follow')) && !c.session.headless) {
          let shown = ct.logs.length;
          for (;;) { await c.sleep(500); if (ct.logs.length > shown) { c.out(ct.logs.slice(shown).join('\n') + '\n'); shown = ct.logs.length; } }
        }
        return 0;
      }
      case 'exec': {
        const o = { it: false };
        while (args.length && args[0].startsWith('-')) { const a = args.shift(); if (/i|t/.test(a)) o.it = true; if (a === '-e' || a === '-u' || a === '-w') args.shift(); }
        const k = args.shift();
        const ct = findCt(m, k || '');
        if (!ct) { c.err(`Error response from daemon: No such container: ${k}\n`); return 1; }
        if (!ct.running) { c.err(`Error response from daemon: container ${ct.id}${hex(52)} is not running\n`); return 1; }
        const cm = ctMachine(c, ct);
        const cmd2 = args.map(((a) => (/^[\w@%+=:,./-]+$/.test(a) ? a : "'" + a.replace(/'/g, "'\\''") + "'"))).join(' ');
        if (o.it && /^(ba)?sh$|^\/bin\/(ba)?sh$/.test(cmd2)) {
          if (!LX.canPush(c)) return 0;
          const psh = await c.session.pushShell('root', { machine: cm, cwd: '/' });
          applyCtEnv(psh, cm);
          return 0;
        }
        const sh = ctShell(c, ct, cm);
        return sh.runSource(cmd2, c.io);
      }
      case 'inspect': {
        let fmt = null;
        const keys = [];
        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (a === '-f' || a === '--format') fmt = args[++i];
          else if (a.startsWith('--format=')) fmt = a.slice(9);
          else if (a === '--type' || a === '-s' || a === '--size') { if (a === '--type') i++; }
          else if (!a.startsWith('-')) keys.push(a);
        }
        if (!keys.length) { c.err('"docker inspect" requires at least 1 argument.\nSee \'docker inspect --help\'.\n\nUsage:  docker inspect [OPTIONS] NAME|ID [NAME|ID...]\n\nReturn low-level information on Docker objects\n'); return 1; }
        const objs = [];
        let st = 0;
        for (const k of keys) {
          const ct = findCt(m, k);
          const img = !ct && findImage(m, k);
          if (ct) objs.push(ctJson(m, ct));
          else if (img) objs.push({ Id: 'sha256:' + img.id + '0'.repeat(52), RepoTags: [`${img.repo}:${img.tag}`], RepoDigests: [`${img.repo}@sha256:${LX.fakeHash(img.repo + img.tag, 64)}`], Created: new Date(img.created).toISOString(), Size: Math.round(parseFloat(img.size) * (/GB/.test(img.size) ? 1e9 : /kB/.test(img.size) ? 1e3 : 1e6)), Architecture: 'amd64', Os: 'linux', Config: { Cmd: String(img.cmd || '').split(' '), Env: ['PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'], ExposedPorts: (HUB[img.hub || img.repo] || {}).port ? { [`${HUB[img.hub || img.repo].port}/tcp`]: {} } : {} }, RootFS: { Type: 'layers', Layers: Array.from({ length: (HUB[img.hub || img.repo] || { layers: 1 }).layers }, (x, i) => 'sha256:' + LX.fakeHash(img.id + i, 64)) } });
          else if (S.volumes.includes(k)) objs.push({ CreatedAt: new Date(m.now()).toISOString(), Driver: 'local', Labels: null, Mountpoint: `/var/lib/docker/volumes/${k}/_data`, Name: k, Options: null, Scope: 'local' });
          else { c.err(`Error response from daemon: No such object: ${k}\n`); st = 1; }
        }
        if (fmt) objs.forEach((o) => c.out(goTemplate(fmt, o) + '\n'));
        else if (objs.length) c.out(JSON.stringify(objs, null, 4) + '\n');
        else c.out('[]\n');
        return st;
      }
      case 'build': {
        const ti = args.indexOf('-t');
        const tag = ti >= 0 ? args[ti + 1] : null;
        const ctx = args.filter((a, i) => !a.startsWith('-') && i !== ti + 1)[0] || '.';
        const fi = args.indexOf('-f');
        const dfPath = fi >= 0 ? c.resolve(args[fi + 1]) : c.resolve(ctx).replace(/\/$/, '') + '/Dockerfile';
        let df;
        try { df = c.fs.readFile(dfPath, c.cred); } catch (e) { c.err(`ERROR: failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory\n`); return 1; }
        const steps = df.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
        const from = steps.find((l) => /^FROM\s/i.test(l));
        if (!from) { c.err('ERROR: failed to solve: dockerfile parse error: no FROM instruction\n'); return 1; }
        const base = from.split(/\s+/)[1];
        c.out(`[+] Building ${(steps.length * 0.8).toFixed(1)}s (${steps.length + 3}/${steps.length + 3}) FINISHED                                    docker:default\n => [internal] load build definition from Dockerfile                        0.0s\n => => transferring dockerfile: ${LX.byteLen(df)}B                                        0.0s\n => [internal] load metadata for docker.io/library/${base}                 1.2s\n`);
        let img = findImage(m, base);
        if (!img) { img = await pull(c, base, true); if (!img) { c.err(`ERROR: failed to solve: ${base}: failed to resolve source metadata for docker.io/library/${base}: pull access denied\n`); return 1; } }
        const copied = (img.copied || []).slice();
        let cmdLine = img.cmd;
        let expose = null;
        let wd = img.workdir || '/';
        let k = 1;
        for (const s of steps) {
          const [ins, ...restArr] = s.split(/\s+/);
          const rest = restArr.join(' ');
          c.out(` => [${k++}/${steps.length}] ${s.padEnd(60).slice(0, 60)} 0.${Math.floor(Math.random() * 9)}s\n`);
          if (/^WORKDIR$/i.test(ins)) wd = LX.path.normalize(wd, rest.trim());
          if (/^COPY$|^ADD$/i.test(ins)) {
            const parts = rest.replace(/^--\S+\s+/, '').split(/\s+/);
            let dst = parts.pop();
            if (!dst.startsWith('/')) dst = LX.path.normalize(wd, dst).replace(/\/$/, '') + (dst === '.' || dst === './' || dst.endsWith('/') ? '/' : '');
            for (const src of parts) {
              const abs = LX.path.normalize(c.resolve(ctx), src);
              const n = c.fs.lookup(abs);
              if (!n) { c.err(`ERROR: failed to solve: failed to compute cache key: failed to calculate checksum of ref: "/${src}": not found\n`); return 1; }
              if (n.t === 'd') c.fs.each(abs, c.cred, (p, node) => { if (node.t === 'f') copied.push({ dst: dst.replace(/\/$/, '') + p.slice(abs.length), c: node.c }); });
              else copied.push({ dst: dst.endsWith('/') ? dst + P().basename(src) : dst, c: n.c });
            }
          }
          if (/^CMD$|^ENTRYPOINT$/i.test(ins)) { try { cmdLine = JSON.parse(rest).join(' '); } catch (e) { cmdLine = rest; } }
          if (/^EXPOSE$/i.test(ins)) expose = +rest;
          if (!c.session.headless) await c.sleep(120);
        }
        void expose;
        const newImg = { repo: tag ? parseRef(tag).name : '<none>', tag: tag ? parseRef(tag).tag : '<none>', id: hex(12), size: img.size.replace(/([\d.]+)/, (x) => (parseFloat(x) + 0.1).toFixed(1)), created: m.now(), cmd: cmdLine, hub: img.hub || img.repo, copied, workdir: wd };
        if (tag) S.images = S.images.filter((x) => !(x.repo === newImg.repo && x.tag === newImg.tag));
        S.images.push(newImg);
        c.out(` => exporting to image                                                     0.1s\n => => exporting layers                                                    0.1s\n => => writing image sha256:${newImg.id}${hex(52)}  0.0s\n${tag ? ` => => naming to docker.io/library/${parseRef(tag).full}                        0.0s\n` : ''}`);
        return 0;
      }
      case 'tag': {
        const img = findImage(m, args[0] || '');
        if (!img) { c.err(`Error response from daemon: No such image: ${args[0]}\n`); return 1; }
        const r = parseRef(args[1] || '');
        S.images.push(Object.assign({}, img, { repo: r.name, tag: r.tag }));
        return 0;
      }
      case 'volume': {
        const v = args.shift();
        if (v === 'ls') { c.out('DRIVER    VOLUME NAME\n' + S.volumes.map((n) => `local     ${n}`).join('\n') + (S.volumes.length ? '\n' : '')); return 0; }
        if (v === 'create') { const n = args[0] || hex(64); if (!S.volumes.includes(n)) S.volumes.push(n); m.vfs.mkdir(`/var/lib/docker/volumes/${n}/_data`, null, { parents: true }); c.out(n + '\n'); return 0; }
        if (v === 'rm') { args.forEach((n) => { if (S.containers.some((x) => x.volumes.some((y) => y.named && y.src === n))) { c.err(`Error response from daemon: remove ${n}: volume is in use - [${S.containers.find((x) => x.volumes.some((y) => y.src === n)).id}]\n`); return; } S.volumes = S.volumes.filter((x) => x !== n); c.out(n + '\n'); }); return 0; }
        if (v === 'inspect') { args.forEach((n) => c.out(JSON.stringify([{ CreatedAt: new Date(m.now()).toISOString(), Driver: 'local', Mountpoint: `/var/lib/docker/volumes/${n}/_data`, Name: n, Scope: 'local' }], null, 4) + '\n')); return 0; }
        if (v === 'prune') { c.out('WARNING! This will remove anonymous local volumes not used by at least one container.\nTotal reclaimed space: 0B\n'); return 0; }
        return 1;
      }
      case 'network': {
        const v = args.shift();
        if (v === 'ls') { c.out('NETWORK ID     NAME      DRIVER    SCOPE\n' + S.dnet.map((n) => `${LX.fakeHash(n, 12)}   ${n.padEnd(9)} ${n === 'bridge' ? 'bridge' : n === 'host' ? 'host  ' : n === 'none' ? 'null  ' : 'bridge'}    local`).join('\n') + '\n'); return 0; }
        if (v === 'create') { S.dnet.push(args.filter((a) => !a.startsWith('-')).pop()); c.out(hex(64) + '\n'); return 0; }
        if (v === 'rm') { args.forEach((n) => { S.dnet = S.dnet.filter((x) => x !== n); c.out(n + '\n'); }); return 0; }
        return 1;
      }
      case 'system': {
        const v = args.shift();
        if (v === 'df') { c.out(`TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE\nImages          ${S.images.length}         ${S.containers.length ? 1 : 0}         ${S.images.length * 180}MB     ${S.images.length * 120}MB (66%)\nContainers      ${S.containers.length}         ${S.containers.filter((x) => x.running).length}         1.09kB    0B (0%)\nLocal Volumes   ${S.volumes.length}         ${S.volumes.length}         0B        0B\nBuild Cache     0         0         0B        0B\n`); return 0; }
        if (v === 'prune') { const n = S.containers.filter((x) => !x.running).length; S.containers = S.containers.filter((x) => x.running); c.out(`WARNING! This will remove:\n  - all stopped containers\n  - all networks not used by at least one container\n  - all dangling images\n  - unused build cache\n\nDeleted Containers:\n${n ? '(정지된 컨테이너 ' + n + '개)\n' : ''}\nTotal reclaimed space: ${n * 1.1}kB\n`); return 0; }
        return 1;
      }
      case 'stats': c.out('CONTAINER ID   NAME      CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O   PIDS\n' + S.containers.filter((x) => x.running).map((x) => `${x.id}   ${x.name.padEnd(9)} 0.00%     ${(4 + x.name.length * 1.3).toFixed(2)}MiB / 3.82GiB   0.1${x.name.length % 10}%     1.2kB / 0B        0B / 12.3kB   3`).join('\n') + '\n'); return 0;
      case 'top': { const ct = findCt(m, args[0] || ''); if (!ct || !ct.running) { c.err(`Error response from daemon: container ${args[0]} is not running\n`); return 1; } c.out(`UID                 PID                 PPID                C                   STIME               TTY                 TIME                CMD\nroot                ${ct.pid}                ${ct.pid - 20}                0                   ${LX.strftime(m, '%H:%M', ct.started)}               ?                   00:00:00            ${ct.cmdline || ct.cmd}\n`); return 0; }
      case 'cp': {
        const [a, b] = args.filter((x) => !x.startsWith('-'));
        const toCt = /^[\w.-]+:/.test(b || '');
        const spec = toCt ? b : a;
        const [ck, cpath] = spec.split(/:(.*)/s);
        const ct = findCt(m, ck);
        if (!ct) { c.err(`Error response from daemon: No such container: ${ck}\n`); return 1; }
        const cm = ctMachine(c, ct);
        try {
          if (toCt) { const data = c.fs.readFile(c.resolve(a), c.cred); const dn = cm.vfs.lookup(cpath); cm.vfs.writeFile(dn && dn.t === 'd' ? cpath.replace(/\/$/, '') + '/' + P().basename(a) : cpath, data, null); ct.copied = (ct.copied || []).concat({ dst: dn && dn.t === 'd' ? cpath.replace(/\/$/, '') + '/' + P().basename(a) : cpath, c: data }); }
          else { const data = cm.vfs.readFile(cpath, null); const dn = c.fs.lookup(c.resolve(b)); c.fs.writeFile(dn && dn.t === 'd' ? c.resolve(b) + '/' + P().basename(cpath) : c.resolve(b), data, c.cred); }
        } catch (e) { c.err(`Error response from daemon: Could not find the file ${toCt ? a : cpath} in container ${ck}\n`); return 1; }
        c.out(`Successfully copied ${LX.human(100)}B to ${toCt ? `${ck}:${cpath}` : b}\n`);
        return 0;
      }
      case 'login': c.out('\nLog in with your Docker ID or email address to push and pull images from Docker Hub.\n'); c.err('\x1b[2m(가상 터미널: 실제 Docker Hub 로그인은 지원하지 않습니다)\x1b[0m\n'); return 1;
      case 'push': c.err('denied: requested access to the resource is denied\n\x1b[2m(가상 터미널: 레지스트리 업로드는 지원하지 않습니다)\x1b[0m\n'); return 1;
      case 'compose': return compose(c, args);
      default:
        c.err(`docker: '${cmd}' is not a docker command.\nSee 'docker --help'\n`);
        return 1;
    }
  });

  // ======================================================================= docker compose
  /** 간단한 YAML (들여쓰기 맵 · 목록 · 인라인 목록) */
  function yaml(text) {
    if (/\t/.test(text)) { const ln = text.split('\n').findIndex((l) => /^\s*\t/.test(l)); if (ln >= 0) throw new Error(`yaml: line ${ln + 1}: found character that cannot start any token`); }
    const lines = text.split('\n').map((l, n) => ({ raw: l.replace(/\s+#.*$/, '').replace(/\s+$/, ''), n: n + 1 })).filter((l) => l.raw.trim() && !l.raw.trim().startsWith('#'));
    let i = 0;
    const indOf = (l) => l.raw.length - l.raw.trimStart().length;
    const scalar = (v) => {
      v = v.trim();
      if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter((x) => x !== '');
      return v.replace(/^["'](.*)["']$/, '$1');
    };
    function block(ind) {
      if (i >= lines.length) return null;
      if (lines[i].raw.trim().startsWith('- ') || lines[i].raw.trim() === '-') {
        const arr = [];
        const li0 = indOf(lines[i]);
        while (i < lines.length && indOf(lines[i]) === li0 && lines[i].raw.trim().startsWith('-')) {
          const val = lines[i].raw.trim().replace(/^-\s*/, '');
          if (/^[^"'\s][^:]*:(\s|$)/.test(val)) { lines[i] = { raw: ' '.repeat(li0 + 2) + val, n: lines[i].n }; arr.push(block(li0 + 2)); }
          else { arr.push(scalar(val)); i++; }
        }
        return arr;
      }
      const obj = {};
      const li0 = indOf(lines[i]);
      if (li0 < ind) return null;
      while (i < lines.length && indOf(lines[i]) === li0 && !lines[i].raw.trim().startsWith('- ')) {
        const r = /^([^:]+?):(?:\s+(.*)|)$/.exec(lines[i].raw.trim());
        if (!r) throw new Error(`yaml: line ${lines[i].n}: could not find expected ':'`);
        i++;
        const k = r[1].trim().replace(/^["']|["']$/g, '');
        if (r[2] != null && r[2] !== '') obj[k] = scalar(r[2]);
        else if (i < lines.length && (indOf(lines[i]) > li0 || (indOf(lines[i]) === li0 && lines[i].raw.trim().startsWith('-')))) obj[k] = block(li0 + 1);
        else obj[k] = null;
      }
      if (i < lines.length && indOf(lines[i]) > li0) throw new Error(`yaml: line ${lines[i].n}: mapping values are not allowed in this context`);
      return obj;
    }
    return block(0) || {};
  }
  LX.yaml = yaml;
  const parseCompose = yaml;

  async function compose(c, args) {
    const m = c.m;
    if (!m.state.pkgs['docker-compose-v2'] && !m.state.pkgs['docker-compose-plugin']) { c.err(`docker: 'compose' is not a docker command.\nSee 'docker --help'\n`); return 1; }
    const fi = args.findIndex((a) => a === '-f' || a === '--file');
    const file = fi >= 0 ? c.resolve(args.splice(fi, 2)[1]) : ['compose.yaml', 'compose.yml', 'docker-compose.yml', 'docker-compose.yaml'].map((f) => c.resolve(f)).find((f) => c.fs.lookup(f));
    const pi = args.findIndex((a) => a === '-p' || a === '--project-name');
    const projOpt = pi >= 0 ? args.splice(pi, 2)[1] : null;
    const sub = args.filter((a) => !a.startsWith('-'))[0];
    const rest = args.filter((a) => !a.startsWith('-')).slice(1);
    if (sub === 'version') { c.out('Docker Compose version 2.33.0+ds1-0ubuntu1~24.04.1\n'); return 0; }
    if (!file) { c.err('no configuration file provided: not found\n'); return 1; }
    // .env 와 셸 환경으로 ${VAR} / ${VAR:-기본값} 치환
    const dotenv = {};
    try { c.fs.readFile(P().dirname(file) + '/.env', c.cred).split('\n').forEach((l) => { const r = /^\s*(?:export\s+)?([A-Za-z_]\w*)\s*=\s*(.*?)\s*$/.exec(l.replace(/\s+#.*$/, '')); if (r) dotenv[r[1]] = r[2].replace(/^(["'])(.*)\1$/, '$2'); }); } catch (e) { /* 없음 */ }
    const envOf = (k) => (c.env(k) != null && c.env(k) !== '' ? c.env(k) : dotenv[k]);
    const raw = c.fs.readFile(file, c.cred);
    const text = raw.replace(/\$\{([A-Za-z_]\w*)(?::?-([^}]*))?\}/g, (all, k, d) => { const v = envOf(k); return v != null ? v : d != null ? d : ''; }).replace(/\$([A-Za-z_]\w*)/g, (all, k) => { const v = envOf(k); return v != null ? v : all; });
    let cfg;
    try { cfg = parseCompose(text); } catch (e) { c.err(`${e.message}\n`); return 15; }
    const project = projOpt || (cfg.name ? String(cfg.name) : P().basename(P().dirname(file))).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const services = cfg.services || {};
    const S = m.state;
    const ctName = (s) => `${project}-${s}-1`;
    const svcOf = (x) => x.name.split('-').slice(1, -1).join('-');
    const namedVol = (v) => { const src = String(v).split(':')[0]; return src && !src.startsWith('/') && !src.startsWith('.') && !src.startsWith('~') && !src.startsWith('$') ? src : null; };
    if (sub === 'config') { c.out((cfg.name ? '' : `name: ${project}\n`) + text); return 0; }
    switch (sub) {
      case 'exec': case 'run': {
        let rawI = args.indexOf(sub) + 1;
        while (rawI < args.length && args[rawI].startsWith('-')) { if (/^-(e|u|w)$|^--(env|user|workdir|index)$/.test(args[rawI])) rawI++; rawI++; }
        const rawRest = args.slice(rawI);
        const svc = rawRest[0];
        const ct = findCt(m, ctName(svc || ''));
        if (!svc || !ct) { c.err(`service "${svc || ''}" is not running\n`); return 1; }
        if (!ct.running) { c.err(`service "${svc}" is not running container #1\n`); return 1; }
        const cm = ctMachine(c, ct);
        const cmd2 = rawRest.slice(1).map(((a) => (/^[\w@%+=:,./-]+$/.test(a) ? a : "'" + a.replace(/'/g, "'\\''") + "'"))).join(' ');
        const it = args.includes('-it') || args.includes('-ti') || (!args.includes('-T') && /^(ba)?sh$|^\/bin\/(ba)?sh$/.test(cmd2));
        if (it && /^(ba)?sh$|^\/bin\/(ba)?sh$/.test(cmd2)) { if (!LX.canPush(c)) return 0; const psh = await c.session.pushShell('root', { machine: cm, cwd: '/' }); applyCtEnv(psh, cm); return 0; }
        const sh = ctShell(c, ct, cm);
        return sh.runSource(cmd2, c.io);
      }
      case 'up': {
        const detach = args.includes('-d') || args.includes('--detach');
        const rebuilt = {};
        for (const s of Object.keys(services)) {
          const sv0 = services[s];
          if (!sv0.build || (rest.length && !rest.includes(s))) continue;
          if (!args.includes('--build') && findImage(m, `${project}-${s}`)) continue;
          const ctx0 = typeof sv0.build === 'object' ? sv0.build.context || '.' : sv0.build;
          let bout = '';
          const st0 = await LX.commands.docker(Object.assign(Object.create(Object.getPrototypeOf(c)), c, { args: ['build', '-t', `${project}-${s}`, LX.path.normalize(P().dirname(file), String(ctx0))], out: (x) => { bout += x; } }));
          if (st0) { c.out(bout); return st0; }
          c.out(` ✔ Service ${s}  Built                                                  1.2s \n`);
          rebuilt[s] = true;
        }
        const names = Object.keys(services);
        for (const s of names) {
          const sv = services[s];
          if (!sv.image && !sv.build) { c.err(`service "${s}" has neither an image nor a build context specified: invalid compose project\n`); return 15; }
          if (sv.image && !findImage(m, sv.image)) { c.out(` ${s} Pulling \n`); const img = await pull(c, sv.image, true); if (!img) return 1; c.out(` ${s} Pulled \n`); }
        }
        c.out(`[+] Running ${names.length + 1}/${names.length + 1}\n ✔ Network ${project}_default  Created                                            0.1s \n`);
        for (const s of names) {
          const sv = services[s];
          let ct = findCt(m, ctName(s));
          if (ct && rebuilt[s]) { S.containers = S.containers.filter((x) => x !== ct); if (m.runtime && m.runtime.cts) delete m.runtime.cts[ct.id]; ct = null; }
          if (!ct) {
            const img = findImage(m, sv.image || `${project}-${s}`) || (await pull(c, sv.image || 'nginx', true));
            let envList = Array.isArray(sv.environment) ? sv.environment : Object.entries(sv.environment || {}).map(([k, v]) => `${k}=${v}`);
            // env_file
            [].concat(sv.env_file || []).forEach((ef) => { try { c.fs.readFile(LX.path.normalize(P().dirname(file), String(ef)), c.cred).split('\n').forEach((l) => { const r = /^\s*([A-Za-z_]\w*)\s*=\s*(.*?)\s*$/.exec(l); if (r) envList.push(`${r[1]}=${r[2].replace(/^(["'])(.*)\1$/, '$2')}`); }); } catch (e) { /* 없음 */ } });
            // 이름 있는 볼륨은 프로젝트 이름이 앞에 붙는다 (project_name)
            const vols = [].concat(sv.volumes || []).map((v) => { const s = String(typeof v === 'object' ? `${v.source}:${v.target}` : v); const nv = namedVol(s); return nv ? `${project}_${nv}${s.slice(nv.length)}` : s.replace(/^\.\//, P().dirname(file) + '/'); });
            const o = { name: ctName(s), ports: [].concat(sv.ports || []).map(String), env: envList, volumes: vols, restart: sv.restart || 'no', cmd: sv.command ? [].concat(sv.command).map(String) : [] };
            ct = await createContainer(c, o, img);
            if (!ct || ct === 'porterr') return 1;
            ct.compose = project;
          }
          startCt(m, ct);
          c.out(` ✔ Container ${ctName(s)}  ${ct.exited === 1 ? 'Exited' : 'Started'}                                              0.${3 + names.indexOf(s)}s \n`);
        }
        if (!detach) c.out('\x1b[2m(가상 터미널: -d 없이 실행해도 백그라운드로 실행해 둡니다. 로그는 docker compose logs)\x1b[0m\n');
        return 0;
      }
      case 'down': {
        const list = S.containers.filter((x) => x.compose === project);
        const rmVol = args.includes('-v') || args.includes('--volumes');
        const vols = rmVol ? S.volumes.filter((v) => v.startsWith(project + '_')) : [];
        c.out(`[+] Running ${list.length + 1 + vols.length}/${list.length + 1 + vols.length}\n`);
        list.forEach((x) => c.out(` ✔ Container ${x.name}  Removed                                               0.${list.indexOf(x) + 2}s \n`));
        vols.forEach((v) => c.out(` ✔ Volume ${v}  Removed                                                  0.0s \n`));
        c.out(` ✔ Network ${project}_default  Removed                                            0.1s \n`);
        S.containers = S.containers.filter((x) => x.compose !== project);
        if (LX.volRemovedHook) vols.forEach((v) => LX.volRemovedHook(m, v));
        list.forEach((x) => { if (m.runtime && m.runtime.cts) delete m.runtime.cts[x.id]; });
        S.volumes = S.volumes.filter((v) => !vols.includes(v));
        vols.forEach((v) => { try { m.vfs.remove(`/var/lib/docker/volumes/${v}`, null, () => {}); } catch (e) { /* 무시 */ } });
        return 0;
      }
      case 'ps': {
        let list = S.containers.filter((x) => x.compose === project && (args.includes('-a') || args.includes('--all') || x.running || true));
        if (rest.length) list = list.filter((x) => rest.includes(svcOf(x)));
        if (args.includes('-q') || args.includes('--quiet')) { list.forEach((x) => c.out(x.id + hex(52) + '\n')); return 0; }
        if (args.includes('--services')) { list.forEach((x) => c.out(svcOf(x) + '\n')); return 0; }
        c.out(table(list.map((x) => [x.name, x.image, `"${x.cmd}"`, svcOf(x), ago(m, x.created), x.running ? `Up ${ago(m, x.started).replace(' ago', '')}` : `Exited (${x.exited || 0})`, x.ports.map((p) => (p.ip ? `${p.ip}:${p.host}->${p.cont}/tcp` : `0.0.0.0:${p.host}->${p.cont}/tcp, [::]:${p.host}->${p.cont}/tcp`)).join(', ')]), ['NAME', 'IMAGE', 'COMMAND', 'SERVICE', 'CREATED', 'STATUS', 'PORTS']));
        return 0;
      }
      case 'logs': {
        const ti = args.findIndex((a) => a === '--tail' || a === '-n');
        const tail = ti >= 0 ? +args[ti + 1] : (args.find((a) => a.startsWith('--tail=')) ? +args.find((a) => a.startsWith('--tail=')).slice(7) : null);
        const want = rest.filter((x, i) => !(ti >= 0 && args.indexOf(x) === ti + 1));
        let list = S.containers.filter((x) => x.compose === project);
        if (want.length) list = list.filter((x) => want.includes(svcOf(x)));
        list.forEach((x) => { let lines = x.logs.join('\n').split('\n').filter(Boolean); if (tail != null) lines = lines.slice(-tail); lines.forEach((l) => c.out(`${x.name.replace(project + '-', '')}  | ${l}\n`)); });
        if ((args.includes('-f') || args.includes('--follow')) && !c.session.headless) { const shown = list.map((x) => x.logs.length); for (;;) { await c.sleep(500); list.forEach((x, i) => { if (x.logs.length > shown[i]) { x.logs.slice(shown[i]).forEach((l) => c.out(`${x.name.replace(project + '-', '')}  | ${l}\n`)); shown[i] = x.logs.length; } }); } }
        return 0;
      }
      case 'stop': case 'start': case 'restart': case 'kill': case 'rm': {
        let list = S.containers.filter((x) => x.compose === project);
        if (rest.length) list = list.filter((x) => rest.includes(svcOf(x)));
        c.out(`[+] ${sub === 'rm' ? 'Removing' : sub === 'stop' || sub === 'kill' ? 'Stopping' : sub === 'start' ? 'Starting' : 'Restarting'} ${list.length}/${list.length}\n`);
        list.forEach((x) => { if (sub === 'stop' || sub === 'kill') { x.running = false; x.exited = sub === 'kill' ? 137 : 0; x.stopped = m.now(); } else if (sub === 'rm') { if (x.running && !args.includes('-f')) return; S.containers = S.containers.filter((y) => y !== x); } else startCt(m, x); c.out(` ✔ Container ${x.name}  ${sub === 'stop' ? 'Stopped' : sub === 'kill' ? 'Killed' : sub === 'rm' ? 'Removed' : 'Started'}                                              0.${list.indexOf(x) + 2}s \n`); });
        return 0;
      }
      case 'top': { S.containers.filter((x) => x.compose === project && x.running).forEach((x) => c.out(`${x.name}\nUID    PID     PPID    C    STIME   TTY   TIME       CMD\nroot   ${x.pid}   ${x.pid - 20}   0    ${LX.strftime(m, '%H:%M', x.started)}   ?     00:00:00   ${x.cmdline || x.cmd}\n\n`)); return 0; }
      case 'images': { c.out(table(S.containers.filter((x) => x.compose === project).map((x) => { const img = findImage(m, x.image) || {}; return [x.name, x.image.split(':')[0], x.image.split(':')[1] || 'latest', img.id || '', img.size || '']; }), ['CONTAINER', 'REPOSITORY', 'TAG', 'IMAGE ID', 'SIZE'])); return 0; }
      case 'build': { for (const s of Object.keys(services)) if (services[s].build) { const ctx = typeof services[s].build === 'object' ? services[s].build.context || '.' : services[s].build; c.out(`[+] Building 1.2s (${s}) FINISHED\n`); await LX.commands.docker(Object.assign(Object.create(Object.getPrototypeOf(c)), c, { args: ['build', '-t', `${project}-${s}`, LX.path.normalize(P().dirname(file), String(ctx))] })); } return 0; }
      case 'pull': { for (const s of Object.keys(services)) if (services[s].image) await pull(c, services[s].image, true); c.out(`[+] Pulling ${Object.keys(services).length}/${Object.keys(services).length}\n`); return 0; }
      default: c.err(`unknown docker command: "compose ${sub}"\n`); return 1;
    }
  }
  def('docker-compose', async (c) => {
    if (c.args[0] === 'version' || c.args[0] === '--version') { c.out('docker-compose version 1.29.2, build unknown\n'); return 0; }
    return compose(c, c.args);
  });
})(typeof window !== 'undefined' ? window : globalThis);

