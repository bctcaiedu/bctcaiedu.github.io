
/* 가상 리눅스 — 패키지 설치 · 서비스(systemd) · 포트 · 가상 HTTP(nginx / apache) */
(function (G) {
  const LX = G.LX = G.LX || {};
  const P = () => LX.path;
  const T = LX.TPL;

  // ======================================================================= 로그
  LX.log = function (m, unit, msg, file = '/var/log/syslog', prio) {
    const d = new Date(m.now());
    const iso = isoLocal(m, d);
    const host = m.hostname();
    const e = { t: m.now(), unit, msg };
    if (prio != null) e.prio = prio;
    m.state.journal.push(e);
    if (m.state.journal.length > 600) m.state.journal.splice(0, 100);
    const tag = unit.includes('[') || unit.includes(':') ? unit : unit;
    try { m.vfs.writeFile(file, `${iso} ${host} ${tag}: ${msg}\n`, null, { append: true }); } catch (e) { /* 무시 */ }
  };

  function tzOffsetMin(m) {
    const tz = m.state.timezone || 'Etc/UTC';
    return { 'Asia/Seoul': 540, 'Asia/Tokyo': 540, 'Asia/Shanghai': 480, 'America/New_York': -240, 'America/Los_Angeles': -420, 'Europe/London': 60, 'Europe/Paris': 120, 'Europe/Berlin': 120, 'Australia/Sydney': 600 }[tz] || 0;
  }
  LX.tzOffsetMin = tzOffsetMin;
  LX.tzAbbr = function (m) {
    const tz = m.state.timezone || 'Etc/UTC';
    return { 'Asia/Seoul': 'KST', 'Asia/Tokyo': 'JST', 'Asia/Shanghai': 'CST', 'America/New_York': 'EDT', 'America/Los_Angeles': 'PDT', 'Europe/London': 'BST', 'Europe/Paris': 'CEST', 'Europe/Berlin': 'CEST', 'Australia/Sydney': 'AEST' }[tz] || 'UTC';
  };
  /** 시간대를 적용한 Date (UTC 메서드로 읽는다) */
  LX.localDate = function (m, t) { return new Date((t == null ? m.now() : t) + tzOffsetMin(m) * 60000); };
  function isoLocal(m, d) {
    const off = tzOffsetMin(m);
    const L = new Date(d.getTime() + off * 60000);
    const pad = (n, w = 2) => String(n).padStart(w, '0');
    const sign = off >= 0 ? '+' : '-';
    return `${L.getUTCFullYear()}-${pad(L.getUTCMonth() + 1)}-${pad(L.getUTCDate())}T${pad(L.getUTCHours())}:${pad(L.getUTCMinutes())}:${pad(L.getUTCSeconds())}.${pad(L.getUTCMilliseconds(), 3)}000${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
  }
  LX.isoLocal = isoLocal;

  /**
   * 처음 설치 이미지의 부팅 기록(syslog · kern.log) 시각을 이번 부팅 시각(m.bootTime)에 맞춘다.
   * (uptime 은 몇 분인데 부팅 로그가 며칠 전이면 journalctl -b / --since today 가 어긋난다)
   */
  LX.retimeBootLog = function (m) {
    const re = /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?[+-]\d\d:\d\d)(\s.*)$/;
    let t0 = null;
    for (const f of ['/var/log/syslog', '/var/log/kern.log', '/var/log/auth.log']) {
      let text;
      try { text = m.vfs.readFile(f, null); } catch (e) { continue; }
      const lines = text.split('\n');
      const out = lines.map((l) => {
        const r = re.exec(l);
        if (!r) return l;
        const t = Date.parse(r[1]);
        if (Number.isNaN(t)) return l;
        if (t0 == null) t0 = t;
        // 부팅 과정(원본 약 40초)을 실제 부팅처럼 몇 초 안으로 줄인다
        return isoLocal(m, new Date(m.bootTime + Math.round((t - t0) / 5))) + r[2];
      });
      try { const n = m.vfs.lookup(f, false); const keep = n ? { m: n.m, u: n.u, g: n.g } : null; m.vfs.writeFile(f, out.join('\n'), null); if (keep) Object.assign(m.vfs.lookup(f, false), keep); } catch (e) { /* 무시 */ }
    }
    // 부팅 때 시작된 서비스의 since 도 부팅 시각으로
    Object.values(m.state.services || {}).forEach((s) => { if (s.active && (!s.since || s.since < m.bootTime)) s.since = m.bootTime + 6000; });
  };

  // ======================================================================= 사용자 · 그룹 추가 (패키지용)
  LX.ensureUser = function (m, name, uid, home, shell = '/usr/sbin/nologin', gecos = '') {
    if (m.passwd().some((u) => u.name === name)) return;
    const fs = m.vfs;
    let gid = uid;
    if (!m.groups().some((g) => g.name === name)) fs.writeFile('/etc/group', `${name}:x:${gid}:\n`, null, { append: true });
    else gid = m.groups().find((g) => g.name === name).gid;
    fs.writeFile('/etc/passwd', `${name}:x:${uid}:${gid}:${gecos}:${home}:${shell}\n`, null, { append: true });
    fs.writeFile('/etc/shadow', `${name}:!:${Math.floor(m.now() / 86400000)}::::::\n`, null, { append: true });
  };
  LX.ensureGroup = function (m, name, gid) {
    if (m.groups().some((g) => g.name === name)) return;
    m.vfs.writeFile('/etc/group', `${name}:x:${gid}:\n`, null, { append: true });
  };

  // ======================================================================= 패키지 파일 설치
  const SETUP = {
    // systemd: PID 1 실행 파일과 /sbin/init
    systemd(m, F, D, L) {
      F('/usr/lib/systemd/systemd', LX.ELF + 'systemd\n', 0o755);
      if (!m.vfs.lookup('/usr/sbin/init', false)) L('/usr/sbin/init', '../lib/systemd/systemd');
    },
    'unattended-upgrades'(m, F, D) {
      D('/var/log/unattended-upgrades', 0o750, 0, 4);
      F('/var/log/unattended-upgrades/unattended-upgrades-shutdown.log', '', 0o644);
      F('/var/log/unattended-upgrades/unattended-upgrades.log', '', 0o644);
      F('/var/log/unattended-upgrades/unattended-upgrades-dpkg.log', '', 0o644);
    },
    nginx(m, F, D, L) {
      ['/etc/nginx/sites-available', '/etc/nginx/sites-enabled', '/etc/nginx/conf.d', '/etc/nginx/snippets', '/etc/nginx/modules-enabled', '/var/www/html', '/var/lib/nginx'].forEach((d) => D(d));
      D('/var/log/nginx', 0o755, 33, 4);
      F('/etc/nginx/nginx.conf', T.nginxConf);
      F('/etc/nginx/mime.types', 'types {\n    text/html                             html htm shtml;\n    text/css                              css;\n    application/javascript                js;\n    application/json                      json;\n    image/png                             png;\n    image/jpeg                            jpeg jpg;\n    image/svg+xml                         svg svgz;\n    text/plain                            txt;\n}\n');
      F('/etc/nginx/sites-available/default', T.nginxDefault);
      if (!m.vfs.lookup('/etc/nginx/sites-enabled/default', false)) L('/etc/nginx/sites-enabled/default', '/etc/nginx/sites-available/default');
      F('/etc/nginx/snippets/fastcgi-php.conf', '# regex to split $uri to $fastcgi_script_name and $fastcgi_path\nfastcgi_split_path_info ^(.+?\\.php)(/.*)$;\n\n# Check that the PHP script exists before passing it\ntry_files $fastcgi_script_name =404;\n\nfastcgi_index index.php;\ninclude fastcgi.conf;\n');
      F('/etc/nginx/snippets/snakeoil.conf', 'ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;\nssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;\n');
      F('/etc/nginx/fastcgi.conf', 'fastcgi_param  SCRIPT_FILENAME    $document_root$fastcgi_script_name;\nfastcgi_param  QUERY_STRING       $query_string;\nfastcgi_param  REQUEST_METHOD     $request_method;\n');
      F('/etc/nginx/proxy_params', 'proxy_set_header Host $http_host;\nproxy_set_header X-Real-IP $remote_addr;\nproxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\nproxy_set_header X-Forwarded-Proto $scheme;\n');
      F('/var/www/html/index.nginx-debian.html', T.nginxIndex);
      F('/var/log/nginx/access.log', '', 0o640, 33, 4);
      F('/var/log/nginx/error.log', '', 0o640, 33, 4);
      F('/etc/ufw/applications.d/nginx', '[Nginx HTTP]\ntitle=Web Server (Nginx, HTTP)\ndescription=Small, but very powerful and efficient web server\nports=80/tcp\n\n[Nginx HTTPS]\ntitle=Web Server (Nginx, HTTPS)\ndescription=Small, but very powerful and efficient web server\nports=443/tcp\n\n[Nginx Full]\ntitle=Web Server (Nginx, HTTP + HTTPS)\ndescription=Small, but very powerful and efficient web server\nports=80,443/tcp\n');
      F('/etc/logrotate.d/nginx', '/var/log/nginx/*.log {\n\tdaily\n\tmissingok\n\trotate 14\n\tcompress\n\tdelaycompress\n\tnotifempty\n\tcreate 0640 www-data adm\n}\n');
    },
    apache2(m, F, D, L) {
      ['/etc/apache2/sites-available', '/etc/apache2/sites-enabled', '/etc/apache2/mods-available', '/etc/apache2/mods-enabled', '/etc/apache2/conf-available', '/etc/apache2/conf-enabled', '/var/www/html'].forEach((d) => D(d));
      D('/var/log/apache2', 0o750, 0, 4);
      F('/etc/apache2/apache2.conf', T.apacheConf);
      F('/etc/apache2/ports.conf', T.apachePorts);
      F('/etc/apache2/envvars', 'export APACHE_RUN_USER=www-data\nexport APACHE_RUN_GROUP=www-data\nexport APACHE_PID_FILE=/var/run/apache2$SUFFIX/apache2.pid\nexport APACHE_RUN_DIR=/var/run/apache2$SUFFIX\nexport APACHE_LOG_DIR=/var/log/apache2$SUFFIX\n');
      F('/etc/apache2/sites-available/000-default.conf', T.apacheDefault);
      F('/etc/apache2/sites-available/default-ssl.conf', '<VirtualHost *:443>\n\tServerAdmin webmaster@localhost\n\tDocumentRoot /var/www/html\n\tSSLEngine on\n\tSSLCertificateFile\t/etc/ssl/certs/ssl-cert-snakeoil.pem\n\tSSLCertificateKeyFile /etc/ssl/private/ssl-cert-snakeoil.key\n</VirtualHost>\n');
      if (!m.vfs.lookup('/etc/apache2/sites-enabled/000-default.conf', false)) L('/etc/apache2/sites-enabled/000-default.conf', '../sites-available/000-default.conf');
      ['alias', 'auth_basic', 'authz_core', 'autoindex', 'deflate', 'dir', 'env', 'mime', 'mpm_event', 'negotiation', 'reqtimeout', 'setenvif', 'status'].forEach((mod) => {
        F(`/etc/apache2/mods-available/${mod}.load`, `LoadModule ${mod}_module /usr/lib/apache2/modules/mod_${mod}.so\n`);
        if (!m.vfs.lookup(`/etc/apache2/mods-enabled/${mod}.load`, false)) L(`/etc/apache2/mods-enabled/${mod}.load`, `../mods-available/${mod}.load`);
      });
      ['rewrite', 'ssl', 'proxy', 'proxy_http', 'headers', 'mpm_prefork', 'cgi', 'userdir'].forEach((mod) => F(`/etc/apache2/mods-available/${mod}.load`, `LoadModule ${mod}_module /usr/lib/apache2/modules/mod_${mod}.so\n`));
      F('/etc/apache2/mods-available/dir.conf', '<IfModule mod_dir.c>\n\tDirectoryIndex index.html index.cgi index.pl index.php index.xhtml index.htm\n</IfModule>\n');
      if (!m.vfs.exists('/var/www/html/index.html')) F('/var/www/html/index.html', T.apacheIndex);
      F('/var/log/apache2/access.log', '', 0o640, 0, 4);
      F('/var/log/apache2/error.log', '', 0o640, 0, 4);
      F('/etc/ufw/applications.d/apache2-utils.ufw.profile', '[Apache]\ntitle=Web Server\ndescription=Apache v2 is the next generation of the omnipresent Apache web server.\nports=80/tcp\n\n[Apache Secure]\ntitle=Web Server (HTTPS)\ndescription=Apache v2 is the next generation of the omnipresent Apache web server.\nports=443/tcp\n\n[Apache Full]\ntitle=Web Server (HTTP,HTTPS)\ndescription=Apache v2 is the next generation of the omnipresent Apache web server.\nports=80,443/tcp\n');
    },
    'libapache2-mod-php'(m, F, D, L) {
      if (m.vfs.exists('/etc/apache2/mods-available')) {
        F('/etc/apache2/mods-available/php8.3.load', 'LoadModule php_module /usr/lib/apache2/modules/libphp8.3.so\n');
        if (!m.vfs.lookup('/etc/apache2/mods-enabled/php8.3.load', false)) L('/etc/apache2/mods-enabled/php8.3.load', '../mods-available/php8.3.load');
      }
    },
    'php8.3-cli'(m, F, D) { D('/etc/php/8.3/cli'); F('/etc/php/8.3/cli/php.ini', '[PHP]\nengine = On\nshort_open_tag = Off\nmemory_limit = -1\ndisplay_errors = Off\n'); },
    'php-fpm'(m, F, D) {
      D('/etc/php/8.3/fpm/pool.d'); D('/run/php', 0o755, 33, 33);
      F('/etc/php/8.3/fpm/php.ini', '[PHP]\nengine = On\nmemory_limit = 128M\nupload_max_filesize = 2M\npost_max_size = 8M\ndisplay_errors = Off\n');
      F('/etc/php/8.3/fpm/pool.d/www.conf', '[www]\nuser = www-data\ngroup = www-data\nlisten = /run/php/php8.3-fpm.sock\nlisten.owner = www-data\nlisten.group = www-data\npm = dynamic\npm.max_children = 5\n');
      F('/run/php/php8.3-fpm.sock', '', 0o660, 33, 33);
    },
    'mysql-server'(m, F, D) {
      LX.ensureUser(m, 'mysql', 110, '/nonexistent', '/bin/false', 'MySQL Server,,,');
      D('/etc/mysql/mysql.conf.d'); D('/etc/mysql/conf.d'); D('/var/lib/mysql', 0o700, 110, 110); D('/var/log/mysql', 0o2750, 110, 4);
      F('/etc/mysql/my.cnf', '#\n# The MySQL database server configuration file.\n#\n!includedir /etc/mysql/conf.d/\n!includedir /etc/mysql/mysql.conf.d/\n');
      F('/etc/mysql/mysql.conf.d/mysqld.cnf', T.mysqld);
      F('/var/log/mysql/error.log', '', 0o640, 110, 4);
      LX.dbInit && LX.dbInit(m, 'mysql');
    },
    'mariadb-server'(m, F, D) {
      LX.ensureUser(m, 'mysql', 110, '/nonexistent', '/bin/false', 'MariaDB Server,,,');
      D('/etc/mysql/mariadb.conf.d'); D('/var/lib/mysql', 0o755, 110, 110);
      F('/etc/mysql/mariadb.conf.d/50-server.cnf', '[mysqld]\nuser                    = mysql\npid-file                = /run/mysqld/mysqld.pid\nbasedir                 = /usr\ndatadir                 = /var/lib/mysql\ntmpdir                  = /tmp\nbind-address            = 127.0.0.1\n');
      LX.dbInit && LX.dbInit(m, 'mariadb');
    },
    postgresql(m, F, D) {
      LX.ensureUser(m, 'postgres', 111, '/var/lib/postgresql', '/bin/bash', 'PostgreSQL administrator,,,');
      D('/etc/postgresql/16/main'); D('/var/lib/postgresql/16/main', 0o700, 111, 111); D('/var/log/postgresql', 0o1775, 111, 111);
      const home = m.vfs.lookup('/var/lib/postgresql'); home.u = 111; home.g = 111;
      F('/etc/postgresql/16/main/postgresql.conf', "# PostgreSQL configuration file\ndata_directory = '/var/lib/postgresql/16/main'\nhba_file = '/etc/postgresql/16/main/pg_hba.conf'\n#listen_addresses = 'localhost'\nport = 5432\nmax_connections = 100\n", 0o644, 111, 111);
      F('/etc/postgresql/16/main/pg_hba.conf', '# TYPE  DATABASE        USER            ADDRESS                 METHOD\nlocal   all             postgres                                peer\nlocal   all             all                                     peer\nhost    all             all             127.0.0.1/32            scram-sha-256\nhost    all             all             ::1/128                 scram-sha-256\n', 0o640, 111, 111);
      LX.dbInit && LX.dbInit(m, 'pg');
    },
    'openssh-server'(m, F, D) {
      LX.ensureUser(m, 'sshd', 109, '/run/sshd', '/usr/sbin/nologin');
      D('/etc/ssh/sshd_config.d'); D('/run/sshd');
      F('/etc/ssh/sshd_config', T.sshdConfig);
      F('/etc/ssh/sshd_config.d/50-cloud-init.conf', 'PasswordAuthentication yes\n', 0o600);
      ['rsa', 'ecdsa', 'ed25519'].forEach((k) => {
        F(`/etc/ssh/ssh_host_${k}_key`, '-----BEGIN OPENSSH PRIVATE KEY-----\n(가상 호스트 키)\n-----END OPENSSH PRIVATE KEY-----\n', 0o600);
        F(`/etc/ssh/ssh_host_${k}_key.pub`, `ssh-${k === 'ecdsa' ? 'ecdsa-sha2-nistp256' : k} AAAAC3NzaC1lZDI1NTE5AAAAI${k.toUpperCase()}hostkeyvirtual root@ubuntu\n`);
      });
      F('/etc/ufw/applications.d/openssh-server', '[OpenSSH]\ntitle=Secure shell server, an rshd replacement\ndescription=OpenSSH is a free implementation of the Secure Shell protocol.\nports=22/tcp\n');
    },
    'docker.io'(m, F, D) {
      LX.ensureGroup(m, 'docker', 113);
      D('/etc/docker'); D('/var/lib/docker', 0o710);
      F('/run/docker.sock', '', 0o660, 0, 113);
      const n = m.vfs.lookup('/run/docker.sock'); n.t = 'c';
    },
    fail2ban(m, F, D) {
      D('/etc/fail2ban/jail.d'); D('/etc/fail2ban/filter.d'); D('/etc/fail2ban/action.d');
      F('/etc/fail2ban/jail.conf', '#\n# WARNING: heavily refactored in 0.9.0 release.  Please review and\n#          customize settings for your setup.\n#\n# Changes:  in most of the cases you should not modify this\n#           file, but provide customizations in jail.local file,\n#           or separate .conf files under jail.d/ directory\n#\n[DEFAULT]\nbantime  = 10m\nfindtime  = 10m\nmaxretry = 5\nbackend = auto\n\n[sshd]\nport    = ssh\nlogpath = %(sshd_log)s\nbackend = %(sshd_backend)s\n');
      F('/etc/fail2ban/jail.d/defaults-debian.conf', '[sshd]\nenabled = true\nbackend = systemd\n');
      F('/etc/fail2ban/filter.d/sshd.conf', '[Definition]\nfailregex = ^Failed password for .* from <HOST>\n');
      F('/var/log/fail2ban.log', '');
    },
    'redis-server'(m, F, D) {
      LX.ensureUser(m, 'redis', 112, '/var/lib/redis', '/usr/sbin/nologin');
      D('/etc/redis'); D('/var/lib/redis', 0o750, 112, 112);
      F('/etc/redis/redis.conf', 'bind 127.0.0.1 -::1\nprotected-mode yes\nport 6379\ndaemonize yes\nsupervised auto\nlogfile /var/log/redis/redis-server.log\ndatabases 16\n# requirepass foobared\n', 0o640, 112, 112);
    },
    samba(m, F, D) {
      D('/etc/samba'); D('/var/lib/samba/private'); D('/var/log/samba');
      F('/etc/samba/smb.conf', T.smbConf);
    },
    vsftpd(m, F, D) {
      LX.ensureUser(m, 'ftp', 114, '/srv/ftp', '/usr/sbin/nologin', 'ftp daemon,,,');
      D('/srv/ftp');
      F('/etc/vsftpd.conf', 'listen=NO\nlisten_ipv6=YES\nanonymous_enable=NO\nlocal_enable=YES\n#write_enable=YES\nlocal_umask=022\ndirmessage_enable=YES\nuse_localtime=YES\nxferlog_enable=YES\nconnect_from_port_20=YES\n#chroot_local_user=YES\nsecure_chroot_dir=/var/run/vsftpd/empty\npam_service_name=vsftpd\nrsa_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem\nrsa_private_key_file=/etc/ssl/private/ssl-cert-snakeoil.key\nssl_enable=NO\n');
    },
    bind9(m, F, D) {
      LX.ensureUser(m, 'bind', 115, '/var/cache/bind', '/usr/sbin/nologin');
      D('/etc/bind'); D('/var/cache/bind');
      F('/etc/bind/named.conf', '// This is the primary configuration file for the BIND DNS server named.\ninclude "/etc/bind/named.conf.options";\ninclude "/etc/bind/named.conf.local";\ninclude "/etc/bind/named.conf.default-zones";\n');
      F('/etc/bind/named.conf.options', 'options {\n\tdirectory "/var/cache/bind";\n\tdnssec-validation auto;\n\tlisten-on-v6 { any; };\n};\n');
      F('/etc/bind/named.conf.local', '//\n// Do any local configuration here\n//\n');
      F('/etc/bind/named.conf.default-zones', 'zone "." {\n\ttype hint;\n\tfile "/usr/share/dns/root.hints";\n};\n');
    },
    'nfs-kernel-server'(m, F) { F('/etc/exports', '# /etc/exports: the access control list for filesystems which may be exported\n#\t\tto NFS clients.  See exports(5).\n#\n# Example:\n# /srv/homes       hostname1(rw,sync,no_subtree_check) hostname2(ro,sync,no_subtree_check)\n#\n'); },
    certbot(m, F, D) { D('/etc/letsencrypt/live'); D('/var/log/letsencrypt'); },
    cockpit(m, F, D) { D('/etc/cockpit'); },
    at(m, F, D) { D('/var/spool/cron/atjobs', 0o1770, 1, 1); },
    'prometheus-node-exporter'(m, F, D) { LX.ensureUser(m, 'prometheus', 116, '/var/lib/prometheus', '/usr/sbin/nologin'); D('/etc/default'); F('/etc/default/prometheus-node-exporter', 'ARGS=""\n'); }
  };

  /** 패키지 파일 · 명령 · 서비스 설치 (의존성 제외) */
  LX.pkgFiles = function (m, name, silent) {
    const p = LX.PKGS[name];
    if (!p) return;
    const fs = m.vfs;
    const D = (d, mode = 0o755, u = 0, g = 0) => { fs.mkdir(d, null, { parents: true }); const n = fs.lookup(d); if (mode != null) { n.m = mode; n.u = u; n.g = g; } };
    const F = (f, text, mode = 0o644, u = 0, g = 0) => { fs.mkdir(P().dirname(f), null, { parents: true }); fs.writeFile(f, text, null, { mode }); const n = fs.lookup(f); n.m = mode; n.u = u; n.g = g; };
    const L = (l, target) => { try { fs.symlink(target, l, null); } catch (e) { /* 이미 있음 */ } };
    for (const [dir, list] of Object.entries(p.bins)) {
      fs.mkdir(dir, null, { parents: true });
      list.forEach((b) => m.installBin(b, dir, LX.BIN_ALIAS[b] || b));
    }
    if (SETUP[name]) SETUP[name](m, F, D, L);
    m.state.pkgs[name] = p.ver;
    if (m.state.rc) delete m.state.rc[name];
    if (p.svc) {
      m.state.services[p.svc] = m.state.services[p.svc] || { active: false, enabled: true };
      m.state.services[p.svc].enabled = true;
      LX.writeUnit(m, p.svc);
      try {
        const wants = `/etc/systemd/system/multi-user.target.wants/${p.svc}.service`;
        if (!fs.lookup(wants, false) && LX.SERVICES[p.svc]) fs.symlink(LX.SERVICES[p.svc].unit, wants, null);
      } catch (e) { /* 무시 */ }
    }
    void silent;
  };

  /** 실행 파일 이름 → 명령 구현 이름 */
  LX.BIN_ALIAS = {
    vi: 'vim', view: 'vim', vimdiff: 'vim', ex: 'vim', rview: 'vim', rnano: 'nano', egrep: 'grep', fgrep: 'grep', nawk: 'awk', mawk: 'awk',
    gunzip: 'gzip', zcat: 'gzip', bunzip2: 'bzip2', bzcat: 'bzip2', unxz: 'xz', xzcat: 'xz', ping4: 'ping', ping6: 'ping',
    apachectl: 'apache2ctl', 'python3.12': 'python3', nodejs: 'node', dnsdomainname: 'hostname', domainname: 'hostname',
    'mkfs.ext3': 'mkfs.ext4', 'mkfs.ext2': 'mkfs.ext4', mke2fs: 'mkfs.ext4', 'fsck.ext4': 'e2fsck', fsck: 'e2fsck',
    sh: 'bash', rbash: 'bash', pvdisplay: 'pvs', vgdisplay: 'vgs', lvdisplay: 'lvs', lvresize: 'lvextend', addgroup: 'groupadd', delgroup: 'groupdel',
    deluser: 'userdel', 'mariadb': 'mysql', 'mariadb-dump': 'mysqldump', 'mariadb-secure-installation': 'mysql_secure_installation',
    halt: 'poweroff', traceroute6: 'traceroute', cowthink: 'cowsay', vdir: 'ls', dir: 'ls', sha1sum: 'md5sum', sha256sum: 'md5sum', b2sum: 'md5sum', cksum: 'md5sum', sum: 'md5sum',
    'pip': 'pip3', npx: 'npm', 'docker-compose': 'docker-compose', view2: 'vim', 'nc.openbsd': 'nc', gawk: 'awk', 'fsck.vfat': 'e2fsck', 'g++': 'gcc', lvreduce: 'lvextend', savelog: 'true', tempfile: 'mktemp', ischroot: 'false', 'update-rc.d': 'true', 'invoke-rc.d': 'service', 'grub-install': 'update-grub', 'grub-mkconfig': 'update-grub', btrfs: 'e2fsck'
  };

  /** 패키지 제거 */
  LX.pkgRemove = function (m, name, purge) {
    const p = LX.PKGS[name];
    if (!p) return;
    const fs = m.vfs;
    for (const [dir, list] of Object.entries(p.bins)) list.forEach((b) => { try { fs.unlink(`${dir}/${b}`, null); } catch (e) { /* 무시 */ } });
    if (p.svc && m.state.services[p.svc]) {
      delete m.state.services[p.svc];
      try { fs.unlink(`/etc/systemd/system/multi-user.target.wants/${p.svc}.service`, null); } catch (e) { /* 무시 */ }
      if (LX.SERVICES[p.svc]) { try { fs.unlink(LX.SERVICES[p.svc].unit, null); } catch (e) { /* 무시 */ } }
    }
    const ver = m.state.pkgs[name];
    delete m.state.pkgs[name];
    m.state.rc = m.state.rc || {};
    if (purge) LX.pkgPurgeConf(m, name);
    else if (LX.pkgHasConf(name)) m.state.rc[name] = ver || p.ver;   // dpkg -l 의 rc (설정 파일만 남음)
  };
  const CONF_FILES = { nginx: ['/etc/nginx'], 'nginx-common': ['/etc/nginx'], apache2: ['/etc/apache2'], 'mysql-server': ['/etc/mysql', '/var/lib/mysql'], 'mariadb-server': ['/etc/mysql', '/var/lib/mysql'], postgresql: ['/etc/postgresql'], 'openssh-server': ['/etc/ssh/sshd_config', '/etc/ssh/sshd_config.d'], fail2ban: ['/etc/fail2ban'], 'redis-server': ['/etc/redis'], samba: ['/etc/samba'], vsftpd: ['/etc/vsftpd.conf'], 'docker.io': ['/etc/docker'], bind9: ['/etc/bind'], 'php-fpm': ['/etc/php/8.3/fpm'] };
  /** 제거 후에도 설정 파일이 남는 패키지인가 */
  LX.pkgHasConf = (name) => !!(CONF_FILES[name] || (LX.PKGS[name] && LX.PKGS[name].svc));
  /** 설정 파일까지 지우기 (purge) */
  LX.pkgPurgeConf = function (m, name) {
    const fs = m.vfs;
    (CONF_FILES[name] || []).forEach((c) => { try { fs.remove(c, null); } catch (e) { /* 무시 */ } });
    if (name === 'mysql-server' || name === 'mariadb-server') m.state.db.mysql = null;
    if (name === 'postgresql') m.state.db.pg = null;
    if (m.state.rc) delete m.state.rc[name];
  };

  LX.installed = (m, name) => !!m.state.pkgs[name];

  // ======================================================================= 서비스
  const SVC_ALIAS = { sshd: 'ssh', 'ssh.socket': 'ssh', httpd: 'apache2', mysqld: 'mysql', bind9: 'named', 'php-fpm': 'php8.3-fpm', 'php8.3-fpm': 'php8.3-fpm', redis: 'redis-server', 'nfs-kernel-server': 'nfs-server', smb: 'smbd', 'systemd-journald': 'systemd-journald' };
  LX.svcName = function (m, name) {
    name = String(name).replace(/\.(service|socket|timer)$/, '');
    if (m.state.services[name]) return name;
    if (SVC_ALIAS[name] && m.state.services[SVC_ALIAS[name]]) return SVC_ALIAS[name];
    if (name === 'mysql' && m.state.services.mariadb) return 'mariadb';
    return name;
  };

  /** 서비스 시작. 실패하면 오류 문자열 */
  LX.svcStart = function (m, name) {
    const st = m.state.services[name];
    const def = LX.serviceDef(m, name);
    if (!def) return 'not-found';
    if (!st) m.state.services[name] = { active: false, enabled: false };
    const s = m.state.services[name];
    if (s.masked) return 'masked';
    if (s.active) return null;
    // 설정 검사 · 포트 충돌
    const check = LX.svcCheck(m, name);
    if (check) {
      s.active = false;
      s.failed = true;
      s.failMsg = check;
      s.since = m.now();
      LX.log(m, 'systemd[1]', `${name}.service: Failed with result 'exit-code'.`);
      LX.log(m, name, check);
      return check;
    }
    s.active = true;
    s.failed = false;
    s.since = m.now();
    // 부팅 때 시작되는 서비스는 낮은 PID, 그 뒤로는 새 PID. 작업자 프로세스 몫(PID+3k+r)은 건너뛴다
    const nproc = def.procs ? def.procs.reduce((a, c) => a + (Array.isArray(c[2]) ? 1 : (c[2] || 1)), 0) : 1;
    if (m.booting) { m.bootPidSeq = (m.bootPidSeq || 760) + 7; s.pid = m.bootPidSeq; m.bootPidSeq += Math.max(0, (def.procs ? def.procs.length : 1) * 3 + nproc); }
    else { s.pid = m.nextPid(); if (nproc > 1 || (def.procs && def.procs.length > 1)) m.pidSeq += (def.procs ? def.procs.length : 1) * 3 + nproc; }
    LX.log(m, 'systemd[1]', `Starting ${name}.service - ${def.desc}...`);
    LX.log(m, 'systemd[1]', `Started ${name}.service - ${def.desc}.`);
    if (def.onStart) def.onStart(m);
    return null;
  };

  LX.svcStop = function (m, name) {
    const s = m.state.services[name];
    if (!s) return;
    const def = LX.serviceDef(m, name) || { desc: name };
    if (s.active) {
      LX.log(m, 'systemd[1]', `Stopping ${name}.service - ${def.desc}...`);
      LX.log(m, 'systemd[1]', `${name}.service: Deactivated successfully.`);
      LX.log(m, 'systemd[1]', `Stopped ${name}.service - ${def.desc}.`);
    }
    s.active = false;
    s.failed = false;
    s.since = m.now();
  };

  /** 서비스가 쓰려는 포트 */
  LX.svcPorts = function (m, name) {
    const out = [];
    const add = (port, addr = '0.0.0.0', proto = 'tcp', v6 = true) => { out.push({ port: +port, addr, proto }); if (v6 && addr === '0.0.0.0') out.push({ port: +port, addr: '[::]', proto }); };
    switch (name) {
      case 'ssh': {
        let port = 22;
        try {
          const t = m.vfs.readFile('/etc/ssh/sshd_config', null) + '\n' + readAllIn(m, '/etc/ssh/sshd_config.d');
          const r = /^\s*Port\s+(\d+)/m.exec(t);
          if (r) port = +r[1];
        } catch (e) { /* 기본 */ }
        add(port);
        break;
      }
      case 'nginx': {
        const cfg = LX.nginx.load(m);
        const seen = new Set();
        cfg.servers.forEach((s) => s.listen.forEach((l) => { const k = l.port + (l.v6 ? '6' : ''); if (!seen.has(k)) { seen.add(k); out.push({ port: l.port, addr: l.v6 ? '[::]' : '0.0.0.0', proto: 'tcp' }); } }));
        break;
      }
      case 'apache2': {
        const cfg = LX.apache.load(m);
        cfg.listen.forEach((p) => add(p, '*', 'tcp', false));
        break;
      }
      case 'mysql': case 'mariadb': {
        let addr = '127.0.0.1';
        try {
          const t = readAllIn(m, '/etc/mysql/mysql.conf.d') + readAllIn(m, '/etc/mysql/mariadb.conf.d');
          const r = /^\s*bind-address\s*=\s*(\S+)/m.exec(t);
          if (r) addr = r[1];
        } catch (e) { /* 기본 */ }
        add(3306, addr === '0.0.0.0' ? '0.0.0.0' : addr, 'tcp', false);
        if (name === 'mysql') add(33060, '127.0.0.1', 'tcp', false);
        break;
      }
      case 'postgresql': {
        let addr = '127.0.0.1';
        try { const r = /^\s*listen_addresses\s*=\s*'([^']*)'/m.exec(m.vfs.readFile('/etc/postgresql/16/main/postgresql.conf', null)); if (r) addr = r[1] === '*' ? '0.0.0.0' : r[1] === 'localhost' ? '127.0.0.1' : r[1]; } catch (e) { /* 기본 */ }
        add(5432, addr, 'tcp', false);
        break;
      }
      case 'redis-server': add(6379, '127.0.0.1', 'tcp', false); break;
      case 'vsftpd': add(21, '*', 'tcp', false); break;
      case 'smbd': add(445); add(139); break;
      case 'named': add(53, '10.0.2.15'); add(53, '127.0.0.1'); break;
      case 'cockpit': add(9090, '*', 'tcp', false); break;
      case 'prometheus-node-exporter': add(9100, '*', 'tcp', false); break;
      case 'nfs-server': add(2049); break;
      default: {
        const def = LX.serviceDef(m, name);
        if (def && def.custom) {
          const r = /(?:--port[= ]|-p |:|PORT=)(\d{2,5})\b/.exec(def.exec + ' ' + (def.text || ''));
          if (r) add(+r[1]);
        }
      }
    }
    return out;
  };

  function readAllIn(m, dir) {
    let s = '';
    try { for (const f of m.vfs.readdir(dir, null)) { try { s += m.vfs.readFile(dir + '/' + f, null) + '\n'; } catch (e) { /* 무시 */ } } } catch (e) { /* 없음 */ }
    return s;
  }

  /** 시작 전 검사: 설정 오류 · 포트 충돌 */
  LX.svcCheck = function (m, name) {
    if (name === 'nginx') {
      const t = LX.nginx.test(m);
      if (!t.ok) return t.errors[0];
    }
    if (name === 'apache2') {
      const t = LX.apache.test(m);
      if (!t.ok) return t.errors[0];
    }
    const mine = LX.svcPorts(m, name);
    if (!mine.length) return null;
    const busy = LX.ports(m, name);
    for (const p of mine) {
      const hit = busy.find((b) => b.port === p.port && b.proto === p.proto && (b.addr === p.addr || ['0.0.0.0', '*', '[::]'].includes(b.addr) || ['0.0.0.0', '*', '[::]'].includes(p.addr)));
      if (hit) {
        if (name === 'nginx') return `nginx: [emerg] bind() to 0.0.0.0:${p.port} failed (98: Address already in use)`;
        if (name === 'apache2') return `(98)Address already in use: AH00072: make_sock: could not bind to address [::]:${p.port}\nno listening sockets available, shutting down`;
        return `${name}: Address already in use (port ${p.port})`;
      }
    }
    return null;
  };

  /** 열려 있는 포트 목록 (except: 계산에서 뺄 서비스) */
  LX.ports = function (m, except) {
    const list = [
      { proto: 'udp', addr: '127.0.0.53%lo', port: 53, proc: 'systemd-resolve', pid: 528, sys: true },
      { proto: 'udp', addr: '127.0.0.54', port: 53, proc: 'systemd-resolve', pid: 528, sys: true },
      { proto: 'udp', addr: '10.0.2.15%enp0s3', port: 68, proc: 'systemd-network', pid: 521, sys: true },
      { proto: 'tcp', addr: '127.0.0.53%lo', port: 53, proc: 'systemd-resolve', pid: 528, sys: true },
      { proto: 'tcp', addr: '127.0.0.54', port: 53, proc: 'systemd-resolve', pid: 528, sys: true }
    ];
    for (const [name, s] of Object.entries(m.state.services)) {
      if (!s.active || name === except) continue;
      const procName = { ssh: 'sshd', apache2: 'apache2', mysql: 'mysqld', mariadb: 'mariadbd', postgresql: 'postgres', 'redis-server': 'redis-server', smbd: 'smbd', named: 'named', cockpit: 'systemd', 'prometheus-node-exporter': 'prometheus-node' }[name] || name;
      LX.svcPorts(m, name).forEach((p) => list.push(Object.assign({ proc: procName, pid: s.pid, svc: name }, p)));
    }
    (m.state.containers || []).filter((c) => c.running).forEach((c) => (c.ports || []).forEach((p) => {
      list.push({ proto: 'tcp', addr: p.ip || '0.0.0.0', port: p.host, proc: 'docker-proxy', pid: (c.pid || 3100) + 1, container: c.id, cport: p.cont });
      if (!p.ip) list.push({ proto: 'tcp', addr: '[::]', port: p.host, proc: 'docker-proxy', pid: (c.pid || 3100) + 2, container: c.id, cport: p.cont });
    }));
    Object.entries((m.runtime && m.runtime.servers) || {}).forEach(([port, srv]) => {
      list.push({ proto: 'tcp', addr: srv.addr || '0.0.0.0', port: +port, proc: srv.proc || 'python3', pid: srv.pid, runtime: srv });
    });
    if (LX.extraPorts) { try { LX.extraPorts(m).forEach((p) => list.push(p)); } catch (e) { /* 무시 */ } }
    return list;
  };

  // ======================================================================= nginx 설정 해석
  const NGX_DIRECTIVES = new Set(('user worker_processes pid error_log include events worker_connections multi_accept use http sendfile tcp_nopush tcp_nodelay types_hash_max_size server_tokens server_names_hash_bucket_size ' +
    'default_type ssl_protocols ssl_prefer_server_ciphers ssl_ciphers ssl_session_cache ssl_session_timeout ssl_session_tickets ssl_certificate ssl_certificate_key ssl_dhparam ssl_stapling ssl_stapling_verify ssl_trusted_certificate access_log log_format gzip gzip_vary gzip_proxied gzip_comp_level gzip_buffers gzip_http_version gzip_types gzip_min_length ' +
    'server listen server_name root index location try_files return rewrite proxy_pass proxy_set_header proxy_http_version proxy_read_timeout proxy_connect_timeout proxy_send_timeout proxy_redirect proxy_buffering proxy_cache proxy_cache_path proxy_cache_valid proxy_hide_header proxy_intercept_errors ' +
    'fastcgi_pass fastcgi_param fastcgi_index fastcgi_split_path_info fastcgi_read_timeout alias autoindex autoindex_exact_size autoindex_localtime deny allow add_header expires client_max_body_size client_body_timeout client_header_timeout error_page upstream keepalive keepalive_timeout ' +
    'limit_req limit_req_zone limit_conn limit_conn_zone charset internal auth_basic auth_basic_user_file types map if set sub_filter sub_filter_once worker_rlimit_nofile http2 resolver etag send_timeout open_file_cache ' +
    'load_module stream env daemon master_process worker_cpu_affinity large_client_header_buffers client_body_buffer_size server_name_in_redirect absolute_redirect port_in_redirect ssl ssl_buffer_size uwsgi_pass uwsgi_param include_optional break satisfy default hash least_conn ip_hash weight').split(/\s+/));

  function ngxTokenize(text, file) {
    const toks = [];
    let i = 0, line = 1;
    const n = text.length;
    while (i < n) {
      const c = text[i];
      if (c === '\n') { line++; i++; continue; }
      if (/\s/.test(c)) { i++; continue; }
      if (c === '#') { while (i < n && text[i] !== '\n') i++; continue; }
      if (c === '{' || c === '}' || c === ';') { toks.push({ v: c, line, file, p: true }); i++; continue; }
      if (c === '"' || c === "'") {
        let j = i + 1, s = '';
        while (j < n && text[j] !== c) { if (text[j] === '\\') { s += text[j + 1]; j += 2; continue; } if (text[j] === '\n') line++; s += text[j++]; }
        toks.push({ v: s, line, file, q: true });
        i = j + 1;
        continue;
      }
      let s = '';
      while (i < n && !/[\s{};]/.test(text[i])) {
        if (text[i] === '#' && s === '') break;
        s += text[i++];
      }
      toks.push({ v: s, line, file });
    }
    return toks;
  }

  function ngxParse(m, file, errors, depth = 0) {
    let text;
    try { text = m.vfs.readFile(file, null); } catch (e) { errors.push(`nginx: [emerg] open() "${file}" failed (2: No such file or directory)`); return []; }
    const toks = ngxTokenize(text, file);
    let p = 0;
    function block(inBlock, parent) {
      const out = [];
      while (p < toks.length) {
        const t = toks[p];
        if (t.p && t.v === '}') {
          if (!inBlock) { errors.push(`nginx: [emerg] unexpected "}" in ${file}:${t.line}`); p++; continue; }
          p++;
          return out;
        }
        if (t.p) { errors.push(`nginx: [emerg] unexpected "${t.v}" in ${file}:${t.line}`); p++; continue; }
        const d = { name: t.v, args: [], line: t.line, file };
        p++;
        while (p < toks.length && !toks[p].p) d.args.push(toks[p++].v);
        if (p >= toks.length) { errors.push(`nginx: [emerg] unexpected end of file, expecting ";" or "}" in ${file}:${t.line}`); return out; }
        const end = toks[p];
        // 세미콜론 누락: 다음 줄의 지시어가 인수로 붙은 경우
        if (end.v === ';' && !['types', 'map', 'split_clients', 'geo', 'upstream'].includes(parent)) {
          const k = toks.slice(p - d.args.length, p).findIndex((x, i) => i > 0 && x.line > t.line && NGX_DIRECTIVES.has(x.v) && !/^(on|off|any|all|main|error|default|index|auto)$/.test(x.v));
          if (k > 0) errors.push(`nginx: [emerg] invalid number of arguments in "${d.name}" directive in ${file}:${t.line}`);
        }
        if (!['types', 'map', 'split_clients', 'geo', 'upstream'].includes(parent) && !NGX_DIRECTIVES.has(d.name) && !/^(proxy_|ssl_|fastcgi_|gzip_|http2_|limit_|real_ip|set_real_ip|uwsgi_|scgi_|grpc_)/.test(d.name)) {
          errors.push(`nginx: [emerg] unknown directive "${d.name}" in ${file}:${d.line}`);
        }
        if (end.v === '{') { p++; d.block = block(true, d.name); }
        else if (end.v === ';') p++;
        else { p++; errors.push(`nginx: [emerg] unexpected "}" in ${file}:${end.line}`); }
        if (d.name === 'include' && depth < 6) {
          const pat = d.args[0] || '';
          const abs = pat.startsWith('/') ? pat : '/etc/nginx/' + pat;
          const files = globFiles(m, abs);
          if (!files.length && !/[*?]/.test(abs)) errors.push(`nginx: [emerg] open() "${abs}" failed (2: No such file or directory) in ${file}:${d.line}`);
          files.forEach((f) => out.push(...ngxParse(m, f, errors, depth + 1)));
          continue;
        }
        out.push(d);
      }
      if (inBlock) errors.push(`nginx: [emerg] unexpected end of file, expecting "}" in ${file}:${toks.length ? toks[toks.length - 1].line : 1}`);
      return out;
    }
    return block(false);
  }

  function globFiles(m, pat) {
    if (!/[*?[]/.test(pat)) {
      const node = m.vfs.lookup(pat);
      return node && node.t === 'f' ? [pat] : [];
    }
    const dir = P().dirname(pat);
    const re = LX.glob.globToRe(P().basename(pat), true);
    let names = [];
    try { names = m.vfs.readdir(dir, null); } catch (e) { return []; }
    return names.filter((n) => re.test(n) && !n.startsWith('.')).map((n) => dir + '/' + n).filter((f) => { const nd = m.vfs.lookup(f); return nd && nd.t === 'f'; });
  }
  LX.globFiles = globFiles;

  LX.nginx = {
    load(m) {
      const errors = [];
      const tree = ngxParse(m, '/etc/nginx/nginx.conf', errors);
      const servers = [];
      const upstreams = {};
      const walk = (list) => list.forEach((d) => {
        if (d.name === 'http' && d.block) walk(d.block);
        if (d.name === 'upstream' && d.block) upstreams[d.args[0]] = d.block.filter((x) => x.name === 'server').map((x) => x.args[0]);
        if (d.name === 'server' && d.block) {
          const s = { listen: [], names: [], root: '/usr/share/nginx/html', index: ['index.html'], locations: [], ret: null, file: d.file, line: d.line };
          d.block.forEach((x) => {
            if (x.name === 'listen') {
              const a = x.args[0] || '80';
              const v6 = a.startsWith('[');
              const port = +(/(\d+)$/.exec(a) || [0, 80])[1];
              s.listen.push({ port, v6, def: x.args.includes('default_server'), ssl: x.args.includes('ssl') });
            }
            if (x.name === 'server_name') s.names.push(...x.args);
            if (x.name === 'ssl_certificate') s.cert = x.args[0];
            if (x.name === 'include' && /snakeoil/.test(x.args[0] || '')) s.cert = '/etc/ssl/certs/ssl-cert-snakeoil.pem';
            if (x.name === 'root') s.root = x.args[0];
            if (x.name === 'index') s.index = x.args;
            if (x.name === 'return') s.ret = x.args;
            if (x.name === 'location' && x.block) {
              const mod = ['=', '~', '~*', '^~'].includes(x.args[0]) ? x.args[0] : '';
              const path = mod ? x.args[1] : x.args[0];
              const loc = { mod, path, d: {} };
              x.block.forEach((y) => { loc.d[y.name] = y.args; });
              s.locations.push(loc);
            }
          });
          if (!s.listen.length) s.listen.push({ port: 80, v6: false });
          servers.push(s);
        }
      });
      walk(tree);
      return { servers, upstreams, errors };
    },
    test(m) {
      const cfg = LX.nginx.load(m);
      const errors = cfg.errors.slice();
      // default_server 중복
      const defs = {};
      cfg.servers.forEach((s) => s.listen.forEach((l) => {
        if (!l.def) return;
        const k = (l.v6 ? '[::]' : '0.0.0.0') + ':' + l.port;
        if (defs[k]) errors.push(`nginx: [emerg] a duplicate default server for ${k} in ${s.file}:${s.line}`);
        defs[k] = true;
      }));
      cfg.servers.forEach((s) => s.listen.forEach((l) => {
        if (l.ssl && !s.cert && !m.vfs.exists('/etc/letsencrypt/live') && !/ssl_certificate/.test(safeRead(m, s.file))) errors.push(`nginx: [emerg] no "ssl_certificate" is defined for the "listen ... ssl" directive in ${s.file}:${s.line}`);
      }));
      return { ok: !errors.length, errors };
    }
  };

  function safeRead(m, f) { try { return m.vfs.readFile(f, null); } catch (e) { return ''; } }

  // ======================================================================= apache 설정 해석
  LX.apache = {
    load(m) {
      const listen = [];
      const vhosts = [];
      const errors = [];
      const ports = safeRead(m, '/etc/apache2/ports.conf').replace(/<IfModule[\s\S]*?<\/IfModule>/g, '');
      ports.split('\n').forEach((l) => { const r = /^\s*Listen\s+(?:\S+:)?(\d+)/.exec(l); if (r) listen.push(+r[1]); });
      if (m.vfs.lookup('/etc/apache2/mods-enabled/ssl.load')) listen.push(443);
      globFiles(m, '/etc/apache2/sites-enabled/*').forEach((f) => {
        const text = safeRead(m, f);
        const opens = (text.match(/<VirtualHost/gi) || []).length;
        const closes = (text.match(/<\/VirtualHost>/gi) || []).length;
        if (opens !== closes) errors.push(`AH00526: Syntax error on line ${text.split('\n').length} of ${f}:\n${opens > closes ? '<VirtualHost> was not closed.' : '</VirtualHost> without matching <VirtualHost> section'}`);
        const re = /<VirtualHost\s+([^>]*)>([\s\S]*?)<\/VirtualHost>/gi;
        let r;
        while ((r = re.exec(text))) {
          const body = r[2].replace(/^\s*#.*$/gm, '');
          const get = (k) => { const x = new RegExp('^\\s*' + k + '\\s+(.+)$', 'mi').exec(body); return x ? x[1].trim() : null; };
          const port = +((/:(\d+)/.exec(r[1]) || [0, 80])[1]);
          const proxy = /^\s*ProxyPass\s+(\S+)\s+(\S+)/mi.exec(body);
          vhosts.push({ port, name: get('ServerName'), aliases: (get('ServerAlias') || '').split(/\s+/).filter(Boolean), root: (get('DocumentRoot') || '/var/www/html').replace(/"/g, ''), file: f, proxy: proxy ? { path: proxy[1], to: proxy[2] } : null });
          body.split('\n').forEach((line, k) => {
            const w = /^\s*([A-Za-z]+)\b/.exec(line);
            if (w && !/^(ServerName|ServerAlias|ServerAdmin|DocumentRoot|ErrorLog|CustomLog|LogLevel|Redirect|RedirectMatch|RewriteEngine|RewriteCond|RewriteRule|ProxyPass|ProxyPassReverse|ProxyPreserveHost|ProxyRequests|SSLEngine|SSLCertificateFile|SSLCertificateKeyFile|Include|DirectoryIndex|Options|AllowOverride|Require|Header|Alias|ScriptAlias|Protocols|SetEnv|AddHandler|Order|Allow|Deny|AuthType|AuthName|AuthUserFile|php_value|php_admin_value|UseCanonicalName|LimitRequestBody|Timeout|KeepAlive|ErrorDocument|FallbackResource)$/i.test(w[1])) {
              errors.push(`AH00526: Syntax error on line ${k + 1} of ${f}:\nInvalid command '${w[1]}', perhaps misspelled or defined by a module not included in the server configuration`);
            }
          });
        }
      });
      return { listen: [...new Set(listen)], vhosts, errors };
    },
    test(m) {
      const cfg = LX.apache.load(m);
      return { ok: !cfg.errors.length, errors: cfg.errors, cfg };
    }
  };

  // ======================================================================= 가상 HTTP
  const HTTP_TEXT = { 200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified', 307: 'Temporary Redirect', 308: 'Permanent Redirect', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Not Allowed', 500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Time-out' };
  LX.HTTP_TEXT = HTTP_TEXT;

  function httpDate(t) { return new Date(t).toUTCString(); }
  function mime(path) {
    const ext = (/\.([a-z0-9]+)$/i.exec(path) || [0, ''])[1].toLowerCase();
    return { html: 'text/html', htm: 'text/html', css: 'text/css', js: 'application/javascript', json: 'application/json', txt: 'text/plain', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', php: 'text/html; charset=UTF-8', log: 'text/plain', xml: 'text/xml' }[ext] || 'application/octet-stream';
  }
  function ngxErr(code) {
    return `<html>\r\n<head><title>${code} ${HTTP_TEXT[code]}</title></head>\r\n<body>\r\n<center><h1>${code} ${HTTP_TEXT[code]}</h1></center>\r\n<hr><center>nginx/1.24.0 (Ubuntu)</center>\r\n</body>\r\n</html>\r\n`;
  }
  function apacheErr(code, path, host, port) {
    const msg = code === 404 ? 'The requested URL was not found on this server.' : code === 403 ? 'You don\'t have permission to access this resource.' : 'The server encountered an internal error.';
    return `<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">\n<html><head>\n<title>${code} ${HTTP_TEXT[code]}</title>\n</head><body>\n<h1>${HTTP_TEXT[code]}</h1>\n<p>${msg}</p>\n<hr>\n<address>Apache/2.4.58 (Ubuntu) Server at ${host} Port ${port}</address>\n</body></html>\n`;
  }

  /** 로컬 주소 판단 (/etc/hosts 포함) */
  LX.resolveHost = function (m, host) {
    host = String(host).toLowerCase().replace(/^\[|\]$/g, '');
    const selfIps = Object.values(m.state.net.ifaces).flatMap((i) => i.addr.map((a) => a.split('/')[0]));
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return { ip: host, local: host.startsWith('127.') || selfIps.includes(host) };
    if (host === '::1' || host === 'localhost' || host === 'ip6-localhost') return { ip: host === '::1' ? '::1' : '127.0.0.1', local: true };
    const hosts = safeRead(m, '/etc/hosts');
    for (const line of hosts.split('\n')) {
      const f = line.replace(/#.*/, '').trim().split(/\s+/);
      if (f.length > 1 && f.slice(1).map((x) => x.toLowerCase()).includes(host)) return { ip: f[0], local: f[0].startsWith('127.') || selfIps.includes(f[0]) || f[0] === '::1' };
    }
    if (host === m.hostname().toLowerCase()) return { ip: '127.0.1.1', local: true };
    const ext = LX.EXTERNAL[host] || LX.EXTERNAL[host.replace(/^www\./, '')];
    if (ext) return { ip: ext.ip, local: false, ext };
    if (/\.(local|test|internal|lan|example)$/.test(host)) return null;
    // 알 수 없는 도메인: 존재하는 것처럼 (공인 주소)
    if (/^[a-z0-9.-]+\.(com|net|org|io|kr|co\.kr|dev|app|ai|edu|gov|me|info)$/.test(host)) {
      let h = 0;
      for (const ch of host) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      return { ip: `${104 + (h % 70)}.${(h >>> 8) % 250}.${(h >>> 16) % 250}.${(h >>> 24) % 250 + 1}`, local: false, ext: { generic: true } };
    }
    return null;
  };

  LX.EXTERNAL = {
    'example.com': { ip: '23.215.0.136', body: '<!doctype html>\n<html>\n<head>\n    <title>Example Domain</title>\n</head>\n<body>\n<div>\n    <h1>Example Domain</h1>\n    <p>This domain is for use in documentation examples without needing permission.</p>\n    <p><a href="https://iana.org/domains/example">Learn more</a></p>\n</div>\n</body>\n</html>\n' },
    'google.com': { ip: '142.250.207.46', redirect: 'https://www.google.com/' },
    'www.google.com': { ip: '142.250.76.132' },
    'naver.com': { ip: '223.130.200.219' },
    'ubuntu.com': { ip: '185.125.190.20', body: '<!DOCTYPE html>\n<html lang="en">\n<head><title>Enterprise Open Source and Linux | Ubuntu</title></head>\n<body>...</body>\n</html>\n' },
    'archive.ubuntu.com': { ip: '185.125.190.81' },
    'kr.archive.ubuntu.com': { ip: '211.52.0.225' },
    'security.ubuntu.com': { ip: '185.125.190.83' },
    'github.com': { ip: '20.200.245.247' },
    'ifconfig.me': { ip: '34.160.111.145', body: '203.0.113.25' },
    'icanhazip.com': { ip: '104.16.184.241', body: '203.0.113.25\n' },
    'ipinfo.io': { ip: '34.117.59.81', json: { ip: '203.0.113.25', city: 'Seongnam-si', region: 'Gyeonggi-do', country: 'KR', loc: '37.4386,127.1378', org: 'AS4766 Korea Telecom', timezone: 'Asia/Seoul' } },
    'httpbin.org': { ip: '98.85.100.80' },
    'wttr.in': { ip: '5.9.243.187', body: 'Weather report: Seoul\n\n     \\  /       Partly cloudy\n   _ /"".-.     +23(25) °C\n     \\_(   ).   ↗ 11 km/h\n     /(___(__)  10 km\n                0.0 mm\n' },
    'get.docker.com': { ip: '18.160.10.66', body: '#!/bin/sh\n# Docker installation script (가상 응답)\necho "# Executing docker install script"\n' },
    'kopo.ac.kr': { ip: '211.182.232.40' },
    'dns.google': { ip: '8.8.8.8' },
    'one.one.one.one': { ip: '1.1.1.1' },
    'letsencrypt.org': { ip: '54.215.62.21' }
  };

  /**
   * HTTP 요청
   * @returns {{status, headers:{}, body, error, code}}
   */
  LX.http = async function (m, url, o = {}) {
    const u = /^(https?):\/\/(\[[^\]]+\]|[^/:?#]+)(?::(\d+))?([^#]*)/i.exec(url);
    if (!u) return { error: `URL rejected: Bad hostname`, code: 3 };
    const scheme = u[1].toLowerCase();
    const host = u[2];
    const port = +(u[3] || (scheme === 'https' ? 443 : 80));
    let path = u[4] || '/';
    if (!path.startsWith('/')) path = '/' + path;
    const r = LX.resolveHost(m, host);
    if (!r) return { error: `Could not resolve host: ${host}`, code: 6 };
    const method = (o.method || 'GET').toUpperCase();
    if (!r.local) {
      // 외부: 가상 인터넷
      const ext = r.ext || {};
      if (ext.route) { const rr = await ext.route(m, path, host, method, o, port); if (rr) return Object.assign({ status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8', Server: rr.server || 'cloud', Date: httpDate(m.now()) }, ip: r.ip, port }, rr); }
      if (ext.redirect && path === '/') return { status: 301, headers: { Location: ext.redirect, 'Content-Type': 'text/html; charset=UTF-8', Server: 'gws' }, body: `<HTML><HEAD><meta http-equiv="content-type" content="text/html;charset=utf-8">\n<TITLE>301 Moved</TITLE></HEAD><BODY>\n<H1>301 Moved</H1>\nThe document has moved\n<A HREF="${ext.redirect}">here</A>.\r\n</BODY></HTML>\r\n`, ip: r.ip, port };
      if (ext.json) return { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', Server: 'nginx' }, body: JSON.stringify(ext.json, null, 2) + '\n', ip: r.ip, port };
      const body = ext.body || `<!DOCTYPE html>\n<html>\n<head><title>${host}</title></head>\n<body>\n<h1>${host}</h1>\n<p>(가상 인터넷 응답) 실제 사이트의 내용은 실제 리눅스에서 확인하세요.</p>\n</body>\n</html>\n`;
      return { status: 200, headers: { 'Content-Type': ext.body && !/</.test(ext.body) ? 'text/plain' : 'text/html; charset=UTF-8', Server: host.includes('google') ? 'gws' : 'nginx', Date: httpDate(m.now()) }, body, ip: r.ip, port };
    }
    const listeners = LX.ports(m).filter((p) => p.proto === 'tcp' && p.port === port);
    const ip = r.ip;
    const l = listeners.find((x) => x.addr === '0.0.0.0' || x.addr === '*' || x.addr === '[::]' || x.addr === ip || (ip === '127.0.0.1' && x.addr.startsWith('127.0.0.1')));
    if (!l) return { error: `Failed to connect to ${host.replace(/^\[|\]$/g, '')} port ${port} after 0 ms: Couldn't connect to server`, code: 7 };
    const autoTls = scheme === 'https' && LX.autoTls && LX.autoTls(m, l, host);
    if (scheme === 'https' && !autoTls && !(l.svc === 'nginx' && LX.nginx.load(m).servers.some((s) => s.listen.some((x) => x.port === port && x.ssl))) && !(l.svc === 'cockpit') && !(l.svc === 'apache2' && port === 443)) {
      return { error: `OpenSSL/3.0.13: error:0A00010B:SSL routines::wrong version number`, code: 35 };
    }
    if (scheme === 'https' && !o.insecure) {
      // 자체 서명 인증서 (Let's Encrypt 가 아닌 것) 는 검증 실패
      let cert = null;
      if (l.svc === 'nginx') { const sv = LX.nginx.load(m).servers.find((s) => s.listen.some((x) => x.port === port && x.ssl)); cert = sv ? sv.cert || '(none)' : null; }
      else if (l.svc === 'apache2') { const t = safeRead(m, '/etc/apache2/sites-enabled/default-ssl.conf') + LX.globFiles(m, '/etc/apache2/sites-enabled/*.conf').map((f) => safeRead(m, f)).join('\n'); const r = /SSLCertificateFile\s+(\S+)/.exec(t); cert = r ? r[1] : '(none)'; }
      else cert = autoTls ? 'letsencrypt' : '(none)';
      if (cert && !/letsencrypt/.test(cert)) return { error: `SSL certificate problem: self-signed certificate`, code: 60, hint: 'More details here: https://curl.se/docs/sslcerts.html\n\ncurl failed to verify the legitimacy of the server and therefore could not\nestablish a secure connection to it. To learn more about this situation and\nhow to fix it, please visit the webpage mentioned above.' };
    }
    const req = { method, path, host: host.replace(/^\[|\]$/g, ''), port, headers: o.headers || {}, body: o.data || '', scheme, depth: (o.depth || 0) + 1 };
    if (req.depth > 5) return { status: 508, headers: {}, body: 'Loop Detected\n' };
    let res;
    if (l.c70tun) { const tr = await LX.c70tunServe(l.c70tun, req); if (tr.error) return tr; res = tr; }
    else if (l.svc === 'nginx') res = await serveNginx(m, req);
    else if (l.svc === 'apache2') res = await serveApache(m, req);
    else if (l.container) res = await LX.dockerServe(m, l, req);
    else if (l.runtime) res = await l.runtime.handle(req);
    else if (l.svc === 'ssh') return { error: 'Received HTTP/0.9 when not allowed', code: 1, raw: 'SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.13\r\n' };
    else if (l.svc === 'mysql' || l.svc === 'mariadb') return { error: 'Received HTTP/0.9 when not allowed', code: 1 };
    else if (l.svc === 'cockpit') res = { status: 200, headers: { 'Content-Type': 'text/html' }, body: '<!DOCTYPE html>\n<html>\n<head><title>Cockpit</title></head>\n<body>Log in with your server user account.</body>\n</html>\n' };
    else if (l.svc === 'prometheus-node-exporter') res = { status: 200, headers: { 'Content-Type': 'text/plain; version=0.0.4' }, body: `# HELP node_load1 1m load average.\n# TYPE node_load1 gauge\nnode_load1 0.08\n# HELP node_memory_MemAvailable_bytes Memory information field MemAvailable_bytes.\n# TYPE node_memory_MemAvailable_bytes gauge\nnode_memory_MemAvailable_bytes ${LX.memInfo(m).avail * 1024}\n` };
    else if (l.svc) {
      const def = LX.serviceDef(m, l.svc);
      res = { status: 200, headers: { 'Content-Type': 'text/plain' }, body: `Hello from ${l.svc} (${def && def.exec ? def.exec : ''})\n` };
    } else return { error: `Empty reply from server`, code: 52 };
    res.headers = Object.assign({ Date: httpDate(m.now()) }, res.headers || {});
    res.ip = ip;
    res.port = port;
    return res;
  };

  function readAs(m, abs, cred) {
    try {
      const node = m.vfs.stat(abs, cred);
      return { node, text: node.t === 'd' ? null : m.vfs.readFile(abs, cred) };
    } catch (e) {
      return { err: e.code };
    }
  }

  function accessLine(req, status, size, ua) {
    const d = new Date();
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
    const pad = (n) => String(n).padStart(2, '0');
    return `127.0.0.1 - - [${pad(d.getUTCDate())}/${mon}/${d.getUTCFullYear()}:${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000] "${req.method} ${req.path} HTTP/1.1" ${status} ${size} "-" "${ua || 'curl/8.5.0'}"\n`;
  }

  async function serveNginx(m, req) {
    const cfg = LX.nginx.load(m);
    const cands = cfg.servers.filter((s) => s.listen.some((l) => l.port === req.port));
    const hostName = req.headers.Host || req.headers.host || req.host;
    let srv = cands.find((s) => s.names.some((n) => n.toLowerCase() === hostName.toLowerCase() || (n.startsWith('*.') && hostName.endsWith(n.slice(1))) || (n.startsWith('~') && new RegExp(n.slice(1)).test(hostName))));
    if (!srv) srv = cands.find((s) => s.listen.some((l) => l.port === req.port && l.def)) || cands[0];
    const www = m.credFor('www-data');
    const H = { Server: 'nginx/1.24.0 (Ubuntu)', Connection: 'keep-alive' };
    const done = (status, body, extra = {}) => {
      try { m.vfs.writeFile('/var/log/nginx/access.log', accessLine(req, status, LX.byteLen(body), req.headers['User-Agent']), null, { append: true }); } catch (e) { /* 무시 */ }
      return { status, headers: Object.assign({}, H, { 'Content-Type': 'text/html', 'Content-Length': String(LX.byteLen(body)) }, extra), body };
    };
    if (!srv) return done(404, ngxErr(404));
    const upath = decodeURIComponent(req.path.split('?')[0]);
    if (srv.ret) {
      const code = +srv.ret[0];
      if (code >= 300 && code < 400) return done(code, ngxErr(code === 301 ? 301 : 302).replace(/\d{3} [A-Za-z ]+/g, `${code} ${HTTP_TEXT[code]}`), { Location: (srv.ret[1] || '').replace('$host', hostName).replace('$request_uri', req.path).replace('$server_name', srv.names[0] || hostName) });
      return done(code, (srv.ret[1] || '') + (srv.ret[1] ? '\n' : ''), { 'Content-Type': 'text/plain' });
    }
    // location 선택
    let loc = srv.locations.find((l) => l.mod === '=' && l.path === upath);
    if (!loc) {
      const pref = srv.locations.filter((l) => (l.mod === '' || l.mod === '^~') && upath.startsWith(l.path)).sort((a, b) => b.path.length - a.path.length)[0];
      const rx = pref && pref.mod === '^~' ? null : srv.locations.find((l) => (l.mod === '~' || l.mod === '~*') && (() => { try { return new RegExp(l.path, l.mod === '~*' ? 'i' : '').test(upath); } catch (e) { return false; } })());
      loc = rx || pref;
    }
    const d = loc ? loc.d : {};
    if (d.return) {
      const code = +d.return[0];
      const txt = (d.return[1] || '').replace('$host', hostName).replace('$request_uri', req.path);
      if (code >= 300 && code < 400) return done(code, ngxErr(code), { Location: txt });
      return done(code, txt, { 'Content-Type': (d.default_type && d.default_type[0]) || 'application/octet-stream' });
    }
    if (d.proxy_pass) {
      let target = d.proxy_pass[0];
      const up = /^https?:\/\/([^/:]+)/.exec(target);
      if (up && cfg.upstreams[up[1]]) target = target.replace(up[1], cfg.upstreams[up[1]][0] || '127.0.0.1');
      const hasPath = /^https?:\/\/[^/]+\//.test(target);
      const url = hasPath ? target.replace(/\/$/, '') + '/' + upath.slice(loc.path.length).replace(/^\//, '') : target + req.path;
      const r = await LX.http(m, url, { method: req.method, depth: req.depth, headers: req.headers, data: req.body });
      if (r.error) {
        try { m.vfs.writeFile('/var/log/nginx/error.log', `${new Date(m.now()).toISOString().replace('T', ' ').slice(0, 19)} [error] 1234#1234: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 127.0.0.1, server: ${srv.names[0] || '_'}, request: "${req.method} ${req.path} HTTP/1.1", upstream: "${target}"\n`, null, { append: true }); } catch (e) { /* 무시 */ }
        return done(502, ngxErr(502));
      }
      return done(r.status, r.body, Object.assign({}, r.headers, { Server: H.Server }));
    }
    const root = d.root ? d.root[0] : srv.root;
    let fpath = d.alias ? d.alias[0].replace(/\/$/, '') + '/' + upath.slice(loc.path.length).replace(/^\//, '') : root.replace(/\/$/, '') + upath;
    let got = readAs(m, fpath, www);
    if (got.err === 'EACCES') return done(403, ngxErr(403));
    if (got.node && got.node.t === 'd') {
      const idx = (d.index || srv.index);
      let found = null;
      for (const ix of idx) {
        const g = readAs(m, fpath.replace(/\/$/, '') + '/' + ix, www);
        if (g.text != null) { found = { g, name: ix }; break; }
        if (g.err === 'EACCES') return done(403, ngxErr(403));
      }
      if (!found) {
        if (d.autoindex && d.autoindex[0] === 'on') {
          const names = m.vfs.readdir(fpath, null);
          return done(200, `<html>\r\n<head><title>Index of ${upath}</title></head>\r\n<body>\r\n<h1>Index of ${upath}</h1><hr><pre><a href="../">../</a>\r\n${names.map((n) => `<a href="${n}">${n}</a>`).join('\r\n')}\r\n</pre><hr></body>\r\n</html>\r\n`);
        }
        return done(403, ngxErr(403));
      }
      fpath = fpath.replace(/\/$/, '') + '/' + found.name;
      got = found.g;
    }
    if (got.text == null) return done(404, ngxErr(404));
    if (/\.php$/.test(fpath)) {
      const phpLoc = srv.locations.find((l) => /php/.test(l.path) && l.d.fastcgi_pass);
      if (!phpLoc) return done(200, got.text, { 'Content-Type': 'application/octet-stream' });
      if (!m.state.services['php8.3-fpm'] || !m.state.services['php8.3-fpm'].active) return done(502, ngxErr(502));
      return done(200, LX.php(m, got.text), { 'Content-Type': 'text/html; charset=UTF-8' });
    }
    return done(200, got.text, { 'Content-Type': mime(fpath), 'Last-Modified': httpDate(got.node.mt), ETag: `"${Math.floor(got.node.mt / 1000).toString(16)}-${LX.byteLen(got.text).toString(16)}"`, 'Accept-Ranges': 'bytes' });
  }

  async function serveApache(m, req) {
    const cfg = LX.apache.load(m);
    const hostName = req.headers.Host || req.host;
    const cands = cfg.vhosts.filter((v) => v.port === req.port);
    const vh = cands.find((v) => (v.name && v.name.toLowerCase() === hostName.toLowerCase()) || v.aliases.includes(hostName)) || cands[0];
    const H = { Server: 'Apache/2.4.58 (Ubuntu)' };
    const done = (status, body, extra = {}) => {
      try { m.vfs.writeFile('/var/log/apache2/access.log', accessLine(req, status, LX.byteLen(body), req.headers['User-Agent']), null, { append: true }); } catch (e) { /* 무시 */ }
      return { status, headers: Object.assign({}, H, { 'Content-Type': 'text/html', 'Content-Length': String(LX.byteLen(body)), Vary: 'Accept-Encoding' }, extra), body };
    };
    if (!vh) return done(404, apacheErr(404, req.path, hostName, req.port));
    const upath = decodeURIComponent(req.path.split('?')[0]);
    if (vh.proxy && upath.startsWith(vh.proxy.path)) {
      const url = vh.proxy.to.replace(/\/$/, '') + '/' + upath.slice(vh.proxy.path.length).replace(/^\//, '');
      const r = await LX.http(m, url, { method: req.method, depth: req.depth });
      if (r.error) return done(503, apacheErr(503, req.path, hostName, req.port).replace('Service Unavailable', 'Service Unavailable'));
      return done(r.status, r.body, r.headers);
    }
    const www = m.credFor('www-data');
    let fpath = vh.root.replace(/\/$/, '') + upath;
    let got = readAs(m, fpath, www);
    if (got.err === 'EACCES') return done(403, apacheErr(403, req.path, hostName, req.port));
    if (got.node && got.node.t === 'd') {
      let found = null;
      for (const ix of ['index.html', 'index.php', 'index.htm']) {
        const g = readAs(m, fpath.replace(/\/$/, '') + '/' + ix, www);
        if (g.text != null) { found = { g, name: ix }; break; }
      }
      if (!found) {
        const names = m.vfs.readdir(fpath, null);
        return done(200, `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">\n<html>\n <head>\n  <title>Index of ${upath}</title>\n </head>\n <body>\n<h1>Index of ${upath}</h1>\n<ul>${names.map((n) => `<li><a href="${n}">${n}</a></li>`).join('\n')}</ul>\n</body></html>\n`);
      }
      fpath = fpath.replace(/\/$/, '') + '/' + found.name;
      got = found.g;
    }
    if (got.text == null) return done(404, apacheErr(404, req.path, hostName, req.port));
    if (/\.php$/.test(fpath)) {
      if (!m.vfs.lookup('/etc/apache2/mods-enabled/php8.3.load')) return done(200, got.text, { 'Content-Type': 'application/x-httpd-php' });
      return done(200, LX.php(m, got.text), { 'Content-Type': 'text/html; charset=UTF-8' });
    }
    return done(200, got.text, { 'Content-Type': mime(fpath), 'Last-Modified': httpDate(got.node.mt), 'Accept-Ranges': 'bytes' });
  }

  // ======================================================================= 아주 작은 PHP
  LX.php = function (m, src) {
    let out = '';
    const vars = {};
    const parts = String(src).split(/(<\?php[\s\S]*?(?:\?>|$)|<\?=[\s\S]*?\?>)/);
    const val = (expr) => {
      expr = expr.trim();
      const pieces = [];
      let cur = '', q = null;
      for (let i = 0; i < expr.length; i++) {
        const c = expr[i];
        if (q) { if (c === '\\' && q === '"') { cur += c + expr[++i]; continue; } cur += c; if (c === q) q = null; continue; }
        if (c === '"' || c === "'") { q = c; cur += c; continue; }
        if (c === '.') { pieces.push(cur); cur = ''; continue; }
        cur += c;
      }
      pieces.push(cur);
      return pieces.map((p) => {
        p = p.trim();
        if (/^'.*'$/s.test(p)) return p.slice(1, -1);
        if (/^".*"$/s.test(p)) return p.slice(1, -1).replace(/\\n/g, '\n').replace(/\$(\w+)/g, (mm, k) => (vars[k] != null ? vars[k] : ''));
        if (/^\$\w+$/.test(p)) return vars[p.slice(1)] != null ? vars[p.slice(1)] : '';
        if (/^phpversion\(\)$/.test(p)) return '8.3.6';
        if (/^PHP_VERSION$/.test(p)) return '8.3.6';
        if (/^php_uname\(\)$/.test(p)) return `Linux ${m.hostname()} ${LX.OS.kernel} ${LX.OS.kernelBuild} x86_64`;
        if (/^gethostname\(\)$/.test(p)) return m.hostname();
        if (/^date\(/.test(p)) {
          const f = (/date\(\s*['"]([^'"]*)['"]/.exec(p) || [0, 'Y-m-d'])[1];
          const d = LX.localDate(m);
          const pad = (n) => String(n).padStart(2, '0');
          return f.replace(/[YmdHis]/g, (k) => ({ Y: d.getUTCFullYear(), m: pad(d.getUTCMonth() + 1), d: pad(d.getUTCDate()), H: pad(d.getUTCHours()), i: pad(d.getUTCMinutes()), s: pad(d.getUTCSeconds()) }[k]));
        }
        if (/^-?\d+(\.\d+)?$/.test(p)) return p;
        if (/^[\d\s+\-*/().]+$/.test(p)) { try { return String(Function('"use strict";return (' + p + ')')()); } catch (e) { return ''; } }
        return '';
      }).join('');
    };
    for (const part of parts) {
      if (part.startsWith('<?=')) { out += val(part.slice(3, -2).replace(/;\s*$/, '')); continue; }
      if (!part.startsWith('<?php')) { out += part; continue; }
      const code = part.replace(/^<\?php/, '').replace(/\?>$/, '');
      code.split(/;\s*(?=(?:[^"']|"[^"]*"|'[^']*')*$)/).forEach((st) => {
        st = st.trim();
        let r;
        if (!st || st.startsWith('//') || st.startsWith('#')) return;
        if ((r = /^\$(\w+)\s*=\s*([\s\S]+)$/.exec(st))) { vars[r[1]] = val(r[2]); return; }
        if ((r = /^(?:echo|print)\s+([\s\S]+)$/.exec(st))) { out += r[1].split(/,(?=(?:[^"']|"[^"]*"|'[^']*')*$)/).map(val).join(''); return; }
        if (/^phpinfo\(\s*\)$/.test(st)) { out += '<!DOCTYPE html>\n<html><head><title>PHP 8.3.6 - phpinfo()</title></head>\n<body><div class="center">\n<table><tr class="h"><td><h1 class="p">PHP Version 8.3.6</h1></td></tr></table>\n<table>\n<tr><td class="e">System </td><td class="v">Linux ' + m.hostname() + ' ' + LX.OS.kernel + ' x86_64 </td></tr>\n<tr><td class="e">Server API </td><td class="v">FPM/FastCGI </td></tr>\n<tr><td class="e">Loaded Configuration File </td><td class="v">/etc/php/8.3/fpm/php.ini </td></tr>\n</table>\n</div></body></html>\n'; }
      });
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);

