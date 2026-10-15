
/* 가상 리눅스 — 보조 명령 (getent · sshd -t · systemd-analyze · apt-key · 데몬 실행 파일 ...) */
(function (G) {
  const LX = G.LX = G.LX || {};
  const def = LX.def;

  def('getent', async (c) => {
    const [db, ...keys] = c.args;
    const m = c.m;
    const read = (f) => { try { return m.vfs.readFile(f, null).split('\n').filter(Boolean); } catch (e) { return []; } };
    let lines;
    switch (db) {
      case 'passwd': lines = read('/etc/passwd'); break;
      case 'group': lines = read('/etc/group'); break;
      case 'shadow': if (c.cred.uid !== 0) return 2; lines = read('/etc/shadow'); break;
      case 'hosts': case 'ahosts': {
        if (!keys.length) { c.out(read('/etc/hosts').filter((l) => !l.startsWith('#')).join('\n') + '\n'); return 0; }
        let st = 0;
        keys.forEach((k) => { const r = LX.resolveHost(m, k); if (!r) { st = 2; return; } c.out(`${r.ip.padEnd(15)} ${k}\n`); });
        return st;
      }
      case 'services': lines = read('/etc/services').filter((l) => !l.startsWith('#')); break;
      default: c.err(`Unknown database: ${db || ''}\nTry \`getent --help' or \`getent --usage' for more information.\n`); return 1;
    }
    if (!keys.length) { c.out(lines.join('\n') + '\n'); return 0; }
    let st = 0;
    keys.forEach((k) => {
      const hit = lines.find((l) => { const f = l.split(/[:\s]+/); return f[0] === k || (db !== 'services' && f[2] === k) || (db === 'services' && (f[1] || '').split('/')[0] === k); });
      if (hit) c.out(hit + '\n'); else st = 2;
    });
    return st;
  });

  def(['expand', 'unexpand'], async (c) => {
    const n = +((c.args.find((a) => /^-t\d+$|^--tabs=\d+$/.test(a)) || '-t8').replace(/\D/g, '')) || 8;
    return LX.readInputs(c, c.args.filter((a) => !a.startsWith('-')), c.name, (t) => {
      if (c.name === 'expand') c.out(t.split('\n').map((l) => { let o = ''; for (const ch of l) { if (ch === '\t') o += ' '.repeat(n - (o.length % n)); else o += ch; } return o; }).join('\n'));
      else c.out(t.replace(new RegExp(`^( {${n}})+`, 'gm'), (s) => '\t'.repeat(s.length / n)));
    });
  });

  def('getconf', async (c) => {
    const v = { LONG_BIT: 64, PAGESIZE: 4096, PAGE_SIZE: 4096, _NPROCESSORS_ONLN: 2, _NPROCESSORS_CONF: 2, ARG_MAX: 2097152, CLK_TCK: 100, PATH_MAX: 4096, NAME_MAX: 255, OPEN_MAX: 1024 }[c.args[0]];
    if (v == null) { c.err(`getconf: Unrecognized variable \`${c.args[0] || ''}'\n`); return 1; }
    c.out(v + '\n');
    return 0;
  });

  def('ldd', async (c) => {
    const f = c.args.filter((a) => !a.startsWith('-'))[0];
    if (!f) { c.err('ldd: missing file arguments\nTry `ldd --help\' for more information.\n'); return 1; }
    const n = c.fs.lookup(c.resolve(f.includes('/') ? f : (c.m.findInPath(f, c.env('PATH')) || f)));
    if (!n) { c.err(`ldd: ${f}: No such file or directory\n`); return 1; }
    if (!String(n.c || '').startsWith(LX.ELF)) { c.err('\tnot a dynamic executable\n'); return 1; }
    c.out('\tlinux-vdso.so.1 (0x00007ffd3b7f1000)\n\tlibselinux.so.1 => /lib/x86_64-linux-gnu/libselinux.so.1 (0x00007f2c1a3e2000)\n\tlibc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f2c1a000000)\n\tlibpcre2-8.so.0 => /lib/x86_64-linux-gnu/libpcre2-8.so.0 (0x00007f2c1a34b000)\n\t/lib64/ld-linux-x86-64.so.2 (0x00007f2c1a440000)\n');
    return 0;
  });

  // GNU time (/usr/bin/time) — 셸 키워드 time 과 다른 형식
  def('time', async (c) => {
    const verbose = c.args[0] === '-v';
    const args = c.args.filter((a) => a !== '-v' && a !== '-p');
    const t0 = Date.now();
    const st = args.length ? await c.sh.invoke(args, c.io) : 0;
    const s = (Date.now() - t0) / 1000;
    if (verbose) c.err(`\tCommand being timed: "${args.join(' ')}"\n\tUser time (seconds): 0.00\n\tSystem time (seconds): 0.00\n\tPercent of CPU this job got: 50%\n\tElapsed (wall clock) time (h:mm:ss or m:ss): 0:${s.toFixed(2).padStart(5, '0')}\n\tMaximum resident set size (kbytes): 3712\n\tExit status: ${st}\n`);
    else c.err(`0.00user 0.00system 0:${s.toFixed(2).padStart(5, '0')}elapsed 50%CPU (0avgtext+0avgdata 3712maxresident)k\n0inputs+0outputs (0major+172minor)pagefaults 0swaps\n`);
    return st;
  });

  def('mkpasswd', async (c) => {
    const pw = c.args.filter((a) => !a.startsWith('-') && !/^(sha-512|sha512|yescrypt|md5)$/.test(a))[0] || (await c.readLine('Password: ', { secret: true })) || '';
    const sha = c.args.some((a) => /sha-?512/.test(a));
    c.out((sha ? '$6$' + Math.random().toString(36).slice(2, 18) + '$' + LX.fakeHash(pw, 86).replace(/[^a-zA-Z0-9]/g, '.') : LX.hashPw(pw)) + '\n');
    return 0;
  });

  def(['lastlog'], async (c) => {
    c.out('Username         Port     From                                       Latest\n');
    c.m.passwd().forEach((u) => c.out(`${u.name.padEnd(16)} ${u.name === c.m.defaultUser ? `pts/0    10.0.2.2                                   ${LX.strftime(c.m, '%a %b %e %H:%M:%S %z %Y', c.m.bootTime + 300000)}` : '         **Never logged in**'}\n`));
    return 0;
  });
  def('faillog', async (c) => { c.out('Login       Failures Maximum Latest                   On\n'); return 0; });
  def('nologin', async (c) => { c.out('This account is currently not available.\n'); return 1; });
  def(['login', 'agetty'], async (c) => { c.err(`${c.name}: 가상 터미널에서는 새 로그인 세션을 열 수 없습니다. su - 사용자 를 사용하세요.\n`); return 1; });

  def('sshd', async (c) => {
    if (c.args.includes('-t') || c.args.includes('-T')) {
      if (c.cred.uid !== 0) { c.err('sshd: no hostkeys available -- exiting.\n'); return 1; }
      let text = '';
      try { text = c.fs.readFile('/etc/ssh/sshd_config', null); } catch (e) { c.err('/etc/ssh/sshd_config: No such file or directory\n'); return 255; }
      const known = /^(Include|Port|AddressFamily|ListenAddress|HostKey|SyslogFacility|LogLevel|LoginGraceTime|PermitRootLogin|StrictModes|MaxAuthTries|MaxSessions|PubkeyAuthentication|AuthorizedKeysFile|PasswordAuthentication|PermitEmptyPasswords|KbdInteractiveAuthentication|ChallengeResponseAuthentication|UsePAM|AllowAgentForwarding|AllowTcpForwarding|GatewayPorts|X11Forwarding|PrintMotd|PrintLastLog|TCPKeepAlive|ClientAliveInterval|ClientAliveCountMax|UseDNS|PidFile|MaxStartups|Banner|AcceptEnv|Subsystem|AllowUsers|AllowGroups|DenyUsers|DenyGroups|Match|ForceCommand|PermitTunnel|ChrootDirectory|AuthenticationMethods|KexAlgorithms|Ciphers|MACs|HostKeyAlgorithms|PubkeyAcceptedAlgorithms)$/i;
      const files = [['/etc/ssh/sshd_config', text]].concat(LX.globFiles(c.m, '/etc/ssh/sshd_config.d/*.conf').map((f) => [f, c.fs.readFile(f, null)]));
      for (const [f, t] of files) {
        const lines = t.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i].replace(/#.*/, '').trim();
          if (!l) continue;
          const [k, v] = l.split(/\s+/);
          if (!known.test(k)) { c.err(`${f}: line ${i + 1}: Bad configuration option: ${k}\n${f}: terminating, 1 bad configuration options\n`); return 255; }
          if (/^Port$/i.test(k) && !(+v > 0 && +v < 65536)) { c.err(`${f} line ${i + 1}: Badly formatted port number.\n`); return 255; }
          if (/^(PasswordAuthentication|PubkeyAuthentication|UsePAM|X11Forwarding)$/i.test(k) && !/^(yes|no)$/i.test(v || '')) { c.err(`${f} line ${i + 1}: unsupported option "${v}".\n`); return 255; }
          if (/^PermitRootLogin$/i.test(k) && !/^(yes|no|prohibit-password|without-password|forced-commands-only)$/i.test(v || '')) { c.err(`${f} line ${i + 1}: unsupported option "${v}".\n`); return 255; }
        }
      }
      if (c.args.includes('-T')) { const conf = LX.sshdConf(c.m); c.out(`port ${conf.port}\naddressfamily any\nlistenaddress [::]:${conf.port}\nlistenaddress 0.0.0.0:${conf.port}\npermitrootlogin ${conf.root}\npubkeyauthentication ${conf.pubkey ? 'yes' : 'no'}\npasswordauthentication ${conf.pass ? 'yes' : 'no'}\nkbdinteractiveauthentication no\nusepam yes\nx11forwarding yes\nmaxauthtries 6\nsubsystem sftp /usr/lib/openssh/sftp-server\n`); }
      return 0;
    }
    if (c.args.includes('-V')) { c.err('OpenSSH_9.6p1 Ubuntu-3ubuntu13.13, OpenSSL 3.0.13 30 Jan 2024\n'); return 0; }
    c.err('sshd re-exec requires execution with an absolute path\n\x1b[2m(가상 터미널: SSH 서버는 sudo systemctl start ssh 로 실행하고, 설정 검사는 sudo sshd -t 로 합니다)\x1b[0m\n');
    return 255;
  });

  def('apt-key', async (c) => {
    c.err('Warning: apt-key is deprecated. Manage keyring files in trusted.gpg.d instead (see apt-key(8)).\n');
    if (c.args[0] === 'list') { c.out('/etc/apt/trusted.gpg.d/ubuntu-keyring-2018-archive.gpg\n------------------------------------------------------\npub   rsa4096 2018-09-17 [SC]\n      F6EC B376 2474 EDA9 D21B  7022 8719 20D1 991B C93C\nuid           [ unknown] Ubuntu Archive Automatic Signing Key (2018) <ftpmaster@ubuntu.com>\n\n'); return 0; }
    if (c.args[0] === 'add') { await c.readStdin(); if (c.cred.uid !== 0) { c.err('E: This command can only be used by root.\n'); return 1; } c.out('OK\n'); return 0; }
    return 0;
  });
  def('apt-config', async (c) => { if (c.args[0] === 'dump') c.out('APT "";\nAPT::Architecture "amd64";\nAPT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\nDir "/";\nDir::Etc "etc/apt/";\n'); return 0; });

  def('systemd-analyze', async (c) => {
    const sub = c.args[0] || 'time';
    if (sub === 'time') { c.out('Startup finished in 2.311s (kernel) + 6.742s (userspace) = 9.053s \nmulti-user.target reached after 6.701s in userspace.\n'); return 0; }
    if (sub === 'blame') { c.out('3.211s snapd.seeded.service\n1.842s cloud-init.service\n1.103s systemd-networkd-wait-online.service\n 812ms snapd.service\n 603ms dev-mapper-ubuntu\\x2d\\x2dvg\\x2dubuntu\\x2d\\x2dlv.device\n 402ms apparmor.service\n 311ms systemd-udev-trigger.service\n 204ms rsyslog.service\n 152ms systemd-journald.service\n  98ms ufw.service\n  61ms cron.service\n'); return 0; }
    if (sub === 'critical-chain') { c.out('The time when unit became active or started is printed after the "@" character.\nThe time the unit took to start is printed after the "+" character.\n\nmulti-user.target @6.701s\n└─snapd.seeded.service @3.487s +3.211s\n  └─basic.target @2.380s\n    └─sockets.target @2.378s\n'); return 0; }
    if (sub === 'verify') { const f = c.args[1]; if (!f || !c.fs.lookup(c.resolve(f))) { c.err(`Failed to prepare filename ${f}: No such file or directory\n`); return 1; } const t = c.fs.readFile(c.resolve(f), c.cred); if (!/^\[Service\]/m.test(t)) { c.err(`${f}: Service has no ExecStart=, ExecStop=, or SuccessAction=. Refusing.\n`); return 1; } if (!/^ExecStart=\//m.test(t)) { c.err(`${f}:${t.split('\n').findIndex((l) => /^ExecStart=/.test(l)) + 1}: Executable path is not absolute, ignoring: ${(/^ExecStart=(.*)$/m.exec(t) || [])[1]}\n`); return 1; } return 0; }
    if (sub === 'calendar') { c.out(`  Original form: ${c.args.slice(1).join(' ')}\nNormalized form: ${c.args.slice(1).join(' ')}\n    Next elapse: ${LX.strftime(c.m, '%a %Y-%m-%d %H:%M:%S %Z', c.m.now() + 3600000)}\n       From now: 59min left\n`); return 0; }
    c.err(`Unknown command verb '${sub}'.\n`);
    return 1;
  });

  def('loginctl', async (c) => {
    const u = c.m.defaultUser;
    if (!c.args.length || c.args[0] === 'list-sessions') { c.out(`SESSION  UID USER    SEAT  TTY   STATE  IDLE SINCE\n      1 1000 ${u.padEnd(7)} -     pts/0 active no   -    \n\n1 sessions listed.\n`); return 0; }
    if (c.args[0] === 'list-users') { c.out(` UID USER    LINGER STATE \n1000 ${u.padEnd(7)} no     active\n\n1 users listed.\n`); return 0; }
    if (c.args[0] === 'enable-linger') return 0;
    return 0;
  });

  def('runuser', async (c) => {
    if (c.cred.uid !== 0) { c.err('runuser: may not be used by non-root users\n'); return 1; }
    const ui = c.args.indexOf('-u');
    const user = ui >= 0 ? c.args[ui + 1] : c.args.find((a) => !a.startsWith('-'));
    const di = c.args.indexOf('--');
    const cmd = di >= 0 ? c.args.slice(di + 1) : null;
    const ci = c.args.indexOf('-c');
    const cr = c.m.credFor(user);
    if (!cr) { c.err(`runuser: user ${user} does not exist or the user entry does not contain all the required fields\n`); return 1; }
    const sh = c.sh.child('script');
    sh.user = user; sh.cred = cr; sh.vars = {}; sh.initVars(); sh.cwd = c.cwd;
    if (cmd) return sh.invoke(cmd, c.io);
    if (ci >= 0) return sh.runSource(c.args[ci + 1], c.io);
    return 0;
  });

  def(['setsid', 'taskset', 'ionice', 'stdbuf', 'flock', 'chrt', 'unbuffer'], async (c) => {
    let args = c.args.slice();
    if (c.name === 'taskset') args = args.filter((a, i) => !a.startsWith('-') && !(i === 0 || /^-/.test(args[i - 1] || '')) || i > 1).slice(args[0] === '-c' ? 1 : 1);
    else if (c.name === 'flock') args = args.slice(args[0] && args[0].startsWith('-') ? 2 : 1);
    else while (args.length && args[0].startsWith('-')) { const a = args.shift(); if (/^-[cnp]$/.test(a)) args.shift(); }
    if (!args.length) return 0;
    return c.sh.invoke(args, c.io);
  });

  def('zgrep', async (c) => {
    const files = c.args.filter((a) => !a.startsWith('-')).slice(1);
    const pat = c.args.filter((a) => !a.startsWith('-'))[0];
    const flags = c.args.filter((a) => a.startsWith('-'));
    let st = 1;
    for (const f of files) {
      let t;
      try { t = c.fs.readFile(c.resolve(f), c.cred); } catch (e) { c.err(`zgrep: ${f}: ${e.message}\n`); continue; }
      const inner = LX.unwrapArchive(t).inner;
      const sub = Object.assign({}, c.io, { stdin: new LX.InStream(inner) });
      const r = await c.sh.invoke(['grep', ...flags, ...(files.length > 1 ? ['--label=' + f, '-H'] : []), pat], sub);
      if (r === 0) st = 0;
    }
    return st;
  });

  def('losetup', async (c) => { if (c.cred.uid !== 0 && !c.args.includes('-a')) { c.err('losetup: cannot find an unused loop device: Permission denied\n'); return 1; } if (c.args.includes('-f')) { c.out('/dev/loop8\n'); return 0; } c.out('/dev/loop0: []: (/var/lib/snapd/snaps/core22_1908.snap)\n/dev/loop1: []: (/var/lib/snapd/snaps/lxd_33110.snap)\n/dev/loop2: []: (/var/lib/snapd/snaps/snapd_24505.snap)\n'); return 0; });
  def('blockdev', async (c) => { const d = c.args.filter((a) => !a.startsWith('-')).pop(); const b = LX.blockDev(c.m, d || ''); if (!b) { c.err(`blockdev: cannot open ${d}: No such file or directory\n`); return 1; } if (c.cred.uid !== 0) { c.err(`blockdev: cannot open ${d}: Permission denied\n`); return 1; } c.out((c.args.includes('--getsz') ? b.obj.size * 2048 : b.obj.size * 1048576) + '\n'); return 0; });
  def('hwclock', async (c) => { if (c.cred.uid !== 0) { c.err('hwclock: Cannot access the Hardware Clock via any known method.\nhwclock: Use the --verbose option to see the details of our search for an access method.\n'); return 1; } c.out(LX.strftime(c.m, '%Y-%m-%d %H:%M:%S.123456+00:00', c.m.now() - 1000, true) + '\n'); return 0; });
  def('pwdx', async (c) => { c.args.forEach((p) => c.out(`${p}: ${+p === 1 ? '/' : '/home/student'}\n`)); return 0; });
  def('pmap', async (c) => { const p = c.args.filter((a) => !a.startsWith('-'))[0]; c.out(`${p}:   ${(LX.procTable(c).find((x) => String(x.pid) === p) || { cmd: '-bash' }).cmd}\n000055d1a0e00000    892K r-x-- bash\n00007f2c1a000000   2048K r-x-- libc.so.6\n00007ffd3b7d0000    132K rw---   [ stack ]\n total             9876K\n`); return 0; });
  def('dircolors', async (c) => { c.out("LS_COLORS='rs=0:di=01;34:ln=01;36:mh=00:pi=40;33:so=01;35:do=01;35:bd=40;33;01:cd=40;33;01:or=40;31;01:mi=00:su=37;41:sg=30;43:ca=00:tw=30;42:ow=34;42:st=37;44:ex=01;32:*.tar=01;31:*.tgz=01;31:*.zip=01;31:*.gz=01;31:*.deb=01;31:*.jpg=01;35:*.png=01;35:';\nexport LS_COLORS\n"); return 0; });
  def('lslogins', async (c) => { c.out('  UID USER             PROC PWD-LOCK PWD-DENY LAST-LOGIN GECOS\n'); c.m.passwd().filter((u) => u.uid === 0 || u.uid >= 1000 && u.uid < 60000).forEach((u) => c.out(`${String(u.uid).padStart(5)} ${u.name.padEnd(16)} ${String(u.uid === 1000 ? 4 : u.uid === 0 ? 118 : 0).padStart(4)}        0        ${u.uid === 0 ? 1 : 0}            ${u.gecos}\n`)); return 0; });
  def(['sfdisk'], async (c) => LX.commands.fdisk(Object.assign({}, c, { args: c.args.includes('-l') ? c.args : ['-l'].concat(c.args) })));
  def(['vipw', 'vigr'], async (c) => { if (c.cred.uid !== 0) { c.err(`${c.name}: Permission denied.\n${c.name}: Couldn't lock file: Permission denied\n${c.name}: /etc/${c.name === 'vipw' ? 'passwd' : 'group'} is unchanged\n`); return 1; } return LX.editFile(c, c.name === 'vipw' ? '/etc/passwd' : '/etc/group', c.cred, { editor: c.name }); });
  def(['pwck', 'grpck'], async (c) => { if (c.cred.uid !== 0) { c.err(`${c.name}: Permission denied.\n`); return 1; } c.out(c.name === 'pwck' ? 'user \'lp\': directory \'/var/spool/lpd\' does not exist\nuser \'news\': directory \'/var/spool/news\' does not exist\nuser \'uucp\': directory \'/var/spool/uucp\' does not exist\nuser \'www-data\': directory \'/var/www\' does not exist\nuser \'list\': directory \'/var/list\' does not exist\nuser \'irc\': directory \'/run/ircd\' does not exist\npwck: no changes\n' : ''); return 0; });
  def(['chgpasswd', 'expiry'], async (c) => 0);
  def('kmod', async (c) => (c.args[0] === 'list' ? LX.commands.lsmod(c) : 0));
  def('mandb', async (c) => { if (c.cred.uid !== 0) { c.err('mandb: can\'t create index cache /var/cache/man/583: Permission denied\n'); return 1; } c.out('Purging old database entries in /usr/share/man...\nProcessing manual pages under /usr/share/man...\n0 man subdirectories contained newer manual pages.\n0 manual pages were added.\n'); return 0; });
  def('script', async (c) => { c.err('script: 가상 터미널에서는 터미널 기록(script)을 지원하지 않습니다. 실제 Ubuntu 에서 실습하세요.\n'); return 1; });
  def('chroot', async (c) => { if (c.cred.uid !== 0) { c.err(`chroot: cannot change root directory to '${c.args[0] || ''}': Operation not permitted\n`); return 125; } c.err('chroot: 가상 터미널에서는 루트 디렉터리 변경을 지원하지 않습니다.\n'); return 125; });
  def('getopt', async (c) => {
    const oi = c.args.indexOf('-o');
    const spec = oi >= 0 ? c.args[oi + 1] : c.args[0];
    const di = c.args.indexOf('--');
    const params = di >= 0 ? c.args.slice(di + 1) : c.args.slice(oi >= 0 ? oi + 2 : 1);
    const { f, ops } = LX.getopt(params, spec || '', {});
    c.out(Object.entries(f).map(([k, v]) => ` -${k}${v === true ? '' : ` '${v}'`}`).join('') + ' --' + ops.map((o) => ` '${o}'`).join('') + '\n');
    return 0;
  });
  def(['lsns', 'lsipc', 'lsmem', 'slabtop', 'tload', 'peekfd', 'prtstat', 'pinky', 'infocmp', 'tset'], async (c) => {
    if (c.name === 'lsmem') { c.out('RANGE                                  SIZE  STATE REMOVABLE BLOCK\n0x0000000000000000-0x00000000dfffffff  3.5G online       yes  0-27\n0x0000000100000000-0x000000011fffffff  512M online       yes 32-35\n\nMemory block size:       128M\nTotal online memory:       4G\nTotal offline memory:      0B\n'); return 0; }
    if (c.name === 'pinky') { c.out(`Login    Name                 TTY      Idle   When             Where\n${c.m.defaultUser.padEnd(8)} Student              pts/0           ${LX.strftime(c.m, '%Y-%m-%d %H:%M', c.m.bootTime + 300000)} 10.0.2.2\n`); return 0; }
    c.err(`${c.name}: 가상 터미널에서는 이 명령의 출력을 흉내내지 않습니다. 실제 Ubuntu 에서 실행해 보세요.\n`);
    return 1;
  });
  def(['pydoc3'], async (c) => { c.err('\x1b[2m(가상 터미널: 파이썬 문서는 실제 Ubuntu 에서 pydoc3 모듈이름 으로 확인하세요)\x1b[0m\n'); return 1; });
  def(['iptables-restore'], async (c) => { if (c.cred.uid !== 0) { c.err('iptables-restore v1.8.10 (nf_tables): Could not fetch rule set generation id: Permission denied (you must be root)\n'); return 4; } await c.readStdin(); return 0; });
  def(['unattended-upgrades'], async (c) => LX.commands['unattended-upgrade'](c));
  def(['colrm', 'col', 'ul', 'look'], async (c) => {
    if (c.name === 'look') { const w = c.args[0] || ''; ['linux', 'list', 'listen', 'little', 'live', 'load', 'local', 'lock', 'log', 'login', 'loop'].filter((x) => x.startsWith(w)).forEach((x) => c.out(x + '\n')); return 0; }
    const t = await c.readStdin();
    if (c.name === 'colrm') { const a = +c.args[0] || 1, b = c.args[1] ? +c.args[1] : Infinity; c.out(t.split('\n').map((l) => l.slice(0, a - 1) + (b === Infinity ? '' : l.slice(b))).join('\n')); return 0; }
    c.out(t.replace(/.\x08/g, ''));
    return 0;
  });

  // 데몬 실행 파일: 직접 실행하지 않고 서비스로 실행하도록 안내
  const DAEMONS = { cron: 'cron', rsyslogd: 'rsyslog', dockerd: 'docker', containerd: 'containerd', mysqld: 'mysql', mariadbd: 'mariadb', smbd: 'smbd', nmbd: 'nmbd', vsftpd: 'vsftpd', named: 'named', 'php-fpm8.3': 'php8.3-fpm', runc: 'docker', ctr: 'containerd' };
  Object.entries(DAEMONS).forEach(([bin, svc]) => {
    def(bin, async (c) => {
      if (c.args.includes('--version') || c.args.includes('-v') || c.args.includes('-V') || c.args.includes('version')) {
        const v = { cron: 'cron (Debian) 3.0pl1', rsyslogd: 'rsyslogd  8.2312.0 (aka 2023.12)', dockerd: 'Docker version 27.5.1, build 27.5.1-0ubuntu3~24.04.2', containerd: 'containerd github.com/containerd/containerd 1.7.27', mysqld: '/usr/sbin/mysqld  Ver 8.0.43-0ubuntu0.24.04.1 for Linux on x86_64 ((Ubuntu))', mariadbd: '/usr/sbin/mariadbd  Ver 10.11.13-MariaDB-0ubuntu0.24.04.1', smbd: 'Version 4.19.5-Ubuntu', vsftpd: 'vsftpd: version 3.0.5', named: 'BIND 9.18.30-0ubuntu0.24.04.2-Ubuntu (Extended Support Version) <id:>', 'php-fpm8.3': 'PHP 8.3.6 (fpm-fcgi)', runc: 'runc version 1.2.5', ctr: 'ctr github.com/containerd/containerd 1.7.27' }[bin];
        c.out((v || bin) + '\n');
        return 0;
      }
      if (bin === 'named' && c.args.includes('-g')) return 0;
      c.err(`${bin}: 서버 프로그램은 직접 실행하지 않고 서비스로 실행합니다 → sudo systemctl start ${svc}\n`);
      return 1;
    });
  });

  // ======================================================================= WSL 실습 모드 (wsl-lab)
  // 실제 WSL 에서 쓰는 Windows 상호 운용 명령을 흉내낸다: /mnt/c · wslpath · explorer.exe · cmd.exe ...
  const WSL_BINS = ['wslpath', 'wslview', 'wslvar', 'explorer.exe', 'notepad.exe', 'cmd.exe', 'powershell.exe', 'pwsh.exe', 'clip.exe', 'wsl.exe', 'wt.exe', 'code'];
  const WIN_USER = 'sam';
  function wslOn(m) { return !!(m.state.wsl && m.state.wsl.on); }
  def('wsl-lab', async (c) => {
    const m = c.m;
    const sub = c.args[0];
    if (sub === 'on') {
      if (c.cred.uid !== 0) { c.err('wsl-lab: root 권한이 필요합니다 → sudo wsl-lab on\n'); return 1; }
      const D = (p) => { try { m.vfs.mkdir(p, null, { parents: true, mode: 0o777 }); const n = m.vfs.lookup(p); n.m = 0o777; n.u = 1000; n.g = 1000; } catch (e) { /* 있음 */ } };
      const F = (p, t) => { try { m.vfs.writeFile(p, t, null, { mode: 0o777 }); const n = m.vfs.lookup(p); n.m = 0o777; n.u = 1000; n.g = 1000; } catch (e) { /* 무시 */ } };
      const home = `/mnt/c/Users/${WIN_USER}`;
      ['/mnt/c/Windows/System32', '/mnt/c/Windows/Temp', '/mnt/c/Program Files', '/mnt/c/Program Files (x86)', '/mnt/c/ProgramData', `${home}/Desktop`, `${home}/Documents`, `${home}/Downloads`, `${home}/Pictures`, `${home}/AppData/Local/Temp`, '/mnt/d', '/mnt/wsl', '/run/WSL'].forEach(D);
      F(`${home}/Desktop/memo.txt`, '윈도우 바탕 화면의 메모 파일입니다.\r\nWSL 에서도 이 파일을 읽고 쓸 수 있습니다.\r\n');
      F(`${home}/Documents/report.docx`, 'PK\u0003\u0004 (가상 Word 문서)');
      F(`${home}/Downloads/ubuntu-24.04.3-live-server-amd64.iso`, '(가상 ISO)');
      F('/mnt/c/Windows/System32/drivers/etc/hosts', '# Copyright (c) 1993-2009 Microsoft Corp.\r\n#\r\n# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.\r\n\r\n#\t127.0.0.1       localhost\r\n#\t::1             localhost\r\n');
      ['explorer.exe', 'notepad.exe', 'cmd.exe', 'clip.exe'].forEach((b) => m.installBin(b, '/mnt/c/Windows', b));
      ['wsl.exe', 'wt.exe'].forEach((b) => m.installBin(b, '/mnt/c/Windows/System32', b));
      D('/mnt/c/Windows/System32/WindowsPowerShell/v1.0'); m.installBin('powershell.exe', '/mnt/c/Windows/System32/WindowsPowerShell/v1.0', 'powershell.exe');
      ['wslpath', 'wslview', 'wslvar'].forEach((b) => m.installBin(b, '/usr/bin', b));
      m.installBin('code', '/usr/bin', 'code');
      m.state.wsl = { on: true, distro: 'Ubuntu-24.04', winUser: WIN_USER };
      // 실제 WSL 처럼 Windows PATH 가 뒤에 붙는다 (새 셸은 profile.d, 지금 셸은 바로 적용)
      const WIN_PATH = '/mnt/c/Windows/System32:/mnt/c/Windows:/mnt/c/Windows/System32/WindowsPowerShell/v1.0:/mnt/c/Users/' + WIN_USER + '/AppData/Local/Microsoft/WindowsApps:/mnt/c/Users/' + WIN_USER + '/AppData/Local/Programs/Microsoft VS Code/bin';
      try { m.vfs.writeFile('/etc/profile.d/wsl-lab.sh', `# wsl-lab: Windows PATH 흉내 (실제 WSL 은 WSL 자체가 붙여 줍니다)\ncase ":$PATH:" in *":/mnt/c/Windows:"*) ;; *) export PATH="$PATH:${WIN_PATH}" ;; esac\n`, null, { mode: 0o644 }); } catch (e) { /* 무시 */ }
      let sh = c.sh; while (sh && sh.sudoParent) sh = sh.sudoParent;
      [sh, c.session.top].forEach((s) => { if (s && s.vars && s.vars.PATH && !String(s.vars.PATH.v).includes('/mnt/c/Windows')) s.vars.PATH = { v: s.vars.PATH.v + ':' + WIN_PATH, x: true }; });
      try { m.vfs.writeFile('/etc/wsl.conf', m.vfs.exists('/etc/wsl.conf') ? m.vfs.readFile('/etc/wsl.conf', null) : '[boot]\nsystemd=true\n', null, { mode: 0o644 }); } catch (e) { /* 무시 */ }
      try { m.vfs.writeFile('/etc/resolv.conf', '# This file was automatically generated by WSL. To stop automatic generation of this file, add the following entry to /etc/wsl.conf:\n# [network]\n# generateResolvConf = false\nnameserver 172.24.16.1\n', null); } catch (e) { /* 무시 */ }
      m.saveSoon();
      c.out(`wsl-lab: WSL 실습 모드 켜짐 (배포판 ${m.state.wsl.distro}, Windows 사용자 ${WIN_USER})\n  /mnt/c 아래에 Windows 드라이브가, PATH 에 Windows 명령(explorer.exe · cmd.exe · powershell.exe ...)이 보입니다.\n  끄기: sudo wsl-lab off\n`);
      return 0;
    }
    if (sub === 'off') {
      if (c.cred.uid !== 0) { c.err('wsl-lab: root 권한이 필요합니다 → sudo wsl-lab off\n'); return 1; }
      ['/mnt/c', '/mnt/d', '/mnt/wsl', '/run/WSL', '/usr/bin/wslpath', '/usr/bin/wslview', '/usr/bin/wslvar', '/usr/bin/code', '/etc/profile.d/wsl-lab.sh'].forEach((p) => { try { m.vfs.remove(p, null, () => {}); } catch (e) { /* 없음 */ } });
      let sh = c.sh; while (sh && sh.sudoParent) sh = sh.sudoParent;
      [sh, c.session.top].forEach((s) => { if (s && s.vars && s.vars.PATH) s.vars.PATH = { v: String(s.vars.PATH.v).split(':').filter((p) => !p.startsWith('/mnt/c/')).join(':'), x: true }; });
      m.state.wsl = { on: false };
      m.saveSoon();
      c.out('wsl-lab: WSL 실습 모드 꺼짐\n');
      return 0;
    }
    if (sub === 'status') { c.out(wslOn(m) ? `WSL 실습 모드: 켜짐 (${m.state.wsl.distro})\n` : 'WSL 실습 모드: 꺼짐\n'); return wslOn(m) ? 0 : 1; }
    c.out('wsl-lab - (실습용) 이 가상 머신을 WSL 배포판처럼 보이게 하는 도구\n\n사용법: sudo wsl-lab on | off | status\n  on   : /mnt/c (Windows C: 드라이브) · wslpath · explorer.exe · cmd.exe · powershell.exe · code 등을 흉내냅니다\n  off  : 원래 상태로 되돌립니다\n\n실제 WSL 설치(wsl --install) · Windows 쪽 설정(.wslconfig) 은 실제 Windows PC 에서 실습하세요.\n');
    return 0;
  });

  def('wslpath', async (c) => {
    const args = c.args.slice();
    let mode = 'u';
    while (args.length && args[0].startsWith('-')) { const a = args.shift(); if (/^-[uwma]+$/.test(a)) { if (a.includes('w')) mode = 'w'; else if (a.includes('m')) mode = 'm'; else if (a.includes('u')) mode = 'u'; if (a.includes('a')) mode += 'a'; } }
    const p = args[0];
    if (p == null) { c.err('wslpath: usage: wslpath [-a] [-u|-w|-m] PATH\n'); return 1; }
    if (mode.startsWith('u')) {
      const w = /^([A-Za-z]):[\\/](.*)$/.exec(p);
      if (w) { c.out(`/mnt/${w[1].toLowerCase()}/${w[2].replace(/\\/g, '/')}`.replace(/\/$/, '') + '\n'); return 0; }
      c.out((mode.includes('a') ? c.resolve(p) : p) + '\n');
      return 0;
    }
    const abs = c.resolve(p);
    const mm = /^\/mnt\/([a-z])(\/.*)?$/.exec(abs);
    if (mm) { const rest = (mm[2] || '/'); c.out(mode.startsWith('w') ? `${mm[1].toUpperCase()}:${rest.replace(/\//g, '\\')}\n` : `${mm[1].toUpperCase()}:${rest}\n`); return 0; }
    const distro = (c.m.state.wsl && c.m.state.wsl.distro) || 'Ubuntu-24.04';
    c.out(mode.startsWith('w') ? `\\\\wsl.localhost\\${distro}${abs.replace(/\//g, '\\')}\n` : `//wsl.localhost/${distro}${abs}\n`);
    return 0;
  });

  def(['explorer.exe', 'notepad.exe', 'cmd.exe', 'powershell.exe', 'pwsh.exe', 'clip.exe', 'wsl.exe', 'wt.exe', 'wslview', 'wslvar', 'code'], async (c) => {
    const m = c.m;
    const n = c.name;
    const dim = (s) => c.err(`\x1b[2m${s}\x1b[0m\n`);
    if (n === 'wslvar') { const v = { USERPROFILE: `C:\\Users\\${WIN_USER}`, APPDATA: `C:\\Users\\${WIN_USER}\\AppData\\Roaming`, LOCALAPPDATA: `C:\\Users\\${WIN_USER}\\AppData\\Local`, USERNAME: WIN_USER, COMPUTERNAME: 'DESKTOP-LAB01', TEMP: `C:\\Users\\${WIN_USER}\\AppData\\Local\\Temp`, SystemRoot: 'C:\\Windows', ProgramFiles: 'C:\\Program Files' }[c.args[0]]; if (v == null) return 1; c.out(v + '\n'); return 0; }
    if (n === 'cmd.exe') {
      const i = c.args.indexOf('/c') >= 0 ? c.args.indexOf('/c') : c.args.indexOf('/C');
      const cmd = i >= 0 ? c.args.slice(i + 1).join(' ') : '';
      if (/^ver$/i.test(cmd)) { c.out('\r\nMicrosoft Windows [Version 10.0.26100.4652]\r\n'); return 0; }
      if (/^echo\s/i.test(cmd)) { c.out(cmd.replace(/^echo\s+/i, '').replace(/%USERNAME%/gi, WIN_USER).replace(/%USERPROFILE%/gi, `C:\\Users\\${WIN_USER}`).replace(/%COMPUTERNAME%/gi, 'DESKTOP-LAB01') + '\r\n'); return 0; }
      if (/^(dir|ipconfig|whoami|hostname|systeminfo|tasklist)\b/i.test(cmd)) {
        if (/^whoami/i.test(cmd)) { c.out(`desktop-lab01\\${WIN_USER}\r\n`); return 0; }
        if (/^hostname/i.test(cmd)) { c.out('DESKTOP-LAB01\r\n'); return 0; }
        if (/^ipconfig/i.test(cmd)) { c.out('\r\nWindows IP Configuration\r\n\r\n\r\nEthernet adapter vEthernet (WSL (Hyper-V firewall)):\r\n\r\n   Connection-specific DNS Suffix  . : \r\n   Link-local IPv6 Address . . . . . : fe80::a1b2:c3d4:e5f6:7890%42\r\n   IPv4 Address. . . . . . . . . . . : 172.24.16.1\r\n   Subnet Mask . . . . . . . . . . . : 255.255.240.0\r\n   Default Gateway . . . . . . . . . : \r\n\r\nEthernet adapter Ethernet:\r\n\r\n   Connection-specific DNS Suffix  . : \r\n   IPv4 Address. . . . . . . . . . . : 192.168.0.10\r\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\r\n   Default Gateway . . . . . . . . . : 192.168.0.1\r\n'); return 0; }
        if (/^dir/i.test(cmd)) { const dir = c.cwd.startsWith('/mnt/') ? c.cwd : `/mnt/c/Users/${WIN_USER}`; let names = []; try { names = c.fs.readdir(dir, c.cred); } catch (e) { /* 없음 */ } c.out(` Volume in drive C has no label.\r\n Volume Serial Number is 6A1F-2C3D\r\n\r\n Directory of ${dir.replace(/^\/mnt\/([a-z])/, (x, d) => d.toUpperCase() + ':').replace(/\//g, '\\')}\r\n\r\n${names.map((nm) => { const node = c.fs.lookup(dir + '/' + nm); return `${LX.strftime(m, '%Y-%m-%d  %H:%M', node ? node.mt : m.now())}    ${node && node.t === 'd' ? '<DIR>          ' : String(node ? c.fs.size(node) : 0).padStart(14) + ' '} ${nm}`; }).join('\r\n')}\r\n`); return 0; }
        c.out(`(가상 Windows) ${cmd}\r\n`); return 0;
      }
      if (!cmd) { dim('(가상 터미널: 대화형 cmd.exe 는 실제 WSL 에서 실행하세요. 예: cmd.exe /c ver)'); return 1; }
      c.out(`(가상 Windows) ${cmd}\r\n`);
      return 0;
    }
    if (n === 'powershell.exe' || n === 'pwsh.exe') {
      const i = c.args.findIndex((a) => /^-(c|command|Command)$/.test(a));
      const cmd = i >= 0 ? c.args.slice(i + 1).join(' ') : c.args.filter((a) => !a.startsWith('-')).join(' ');
      if (/Get-Date/i.test(cmd)) { c.out(LX.strftime(m, '%A, %B %e, %Y %I:%M:%S %p', m.now()).replace(/  /g, ' ') + '\r\n'); return 0; }
      if (/\$env:USERNAME/i.test(cmd)) { c.out(WIN_USER + '\r\n'); return 0; }
      if (/\$PSVersionTable/i.test(cmd)) { c.out('\r\nName                           Value\r\n----                           -----\r\nPSVersion                      5.1.26100.4652\r\nPSEdition                      Desktop\r\n'); return 0; }
      if (/Get-ComputerInfo|systeminfo/i.test(cmd)) { c.out('WindowsProductName : Windows 11 Pro\r\nOsVersion          : 10.0.26100\r\nCsName             : DESKTOP-LAB01\r\nCsTotalPhysicalMemory : 17179869184\r\n'); return 0; }
      if (/^\s*echo\s|Write-Output|Write-Host/i.test(cmd)) { c.out(cmd.replace(/^\s*(echo|Write-Output|Write-Host)\s+/i, '').replace(/^["']|["']$/g, '') + '\r\n'); return 0; }
      if (!cmd) { dim('(가상 터미널: 대화형 PowerShell 은 실제 WSL 에서 실행하세요. 예: powershell.exe -c Get-Date)'); return 1; }
      c.out(`(가상 Windows PowerShell) ${cmd}\r\n`);
      return 0;
    }
    if (n === 'wsl.exe') {
      const a = c.args.map((x) => x.toLowerCase());
      const distro = (m.state.wsl && m.state.wsl.distro) || 'Ubuntu-24.04';
      if (a.includes('-l') || a.includes('--list')) { if (a.includes('-v') || a.includes('--verbose')) c.out(`  NAME              STATE           VERSION\r\n* ${distro.padEnd(17)} Running         2\r\n  docker-desktop    Stopped         2\r\n`); else c.out(`Windows Subsystem for Linux Distributions:\r\n${distro} (Default)\r\ndocker-desktop\r\n`); return 0; }
      if (a.includes('--status')) { c.out(`Default Distribution: ${distro}\r\nDefault Version: 2\r\n`); return 0; }
      if (a.includes('--version') || a.includes('-v')) { c.out('WSL version: 2.5.10.0\r\nKernel version: 6.6.87.2-1\r\nWSLg version: 1.0.66\r\nMSRDC version: 1.2.6074\r\nDirect3D version: 1.611.1-81528511\r\nDXCore version: 10.0.26100.1-240331-1435.ge-release\r\nWindows version: 10.0.26100.4652\r\n'); return 0; }
      if (a.includes('--shutdown') || a.includes('-t') || a.includes('--terminate')) { dim('(가상 터미널: 실제 WSL 이라면 배포판이 종료되고 이 셸도 끊깁니다. 여기서는 아무 일도 하지 않습니다)'); return 0; }
      if (a.includes('--export') || a.includes('--import') || a.includes('--install') || a.includes('--unregister') || a.includes('--set-default') || a.includes('--set-version') || a.includes('--update')) { dim(`(가상 터미널: wsl.exe ${c.args.join(' ')} 는 Windows 쪽에서 배포판을 다루는 명령입니다. 실제 Windows PowerShell 에서 실습하세요)`); return 1; }
      dim('(가상 터미널: wsl.exe 는 -l -v · --status · --version 만 흉내냅니다)');
      return 0;
    }
    if (n === 'clip.exe') { const t = c.stdin ? c.stdin.readAll() : ''; m.state.winClip = t; dim(`(가상 Windows 클립보드에 ${LX.byteLen(t)}바이트 복사됨 — 실제 WSL 에서는 Ctrl+V 로 붙여 넣을 수 있습니다)`); return 0; }
    if (n === 'code') { if (c.args.includes('--version') || c.args.includes('-v')) { c.out('1.104.2\n0b3d1e2f7b8c4a5d6e7f8091a2b3c4d5e6f70819\nx64\n'); return 0; } dim(`(가상 터미널: 실제 WSL 에서는 Windows 의 VS Code 가 열리고 왼쪽 아래에 "WSL: ${(m.state.wsl && m.state.wsl.distro) || 'Ubuntu-24.04'}" 가 표시됩니다 — 대상: ${c.args.filter((x) => !x.startsWith('-')).map((x) => c.resolve(x)).join(' ') || c.cwd})`); return 0; }
    // explorer.exe · notepad.exe · wt.exe · wslview
    const target = c.args.filter((x) => !x.startsWith('-'))[0];
    const abs = target ? (/^[A-Za-z]:\\/.test(target) || /^https?:\/\//.test(target) ? target : c.resolve(target)) : c.cwd;
    const winPath = /^[A-Za-z]:\\|^https?:/.test(abs) ? abs : (/^\/mnt\/([a-z])(\/.*)?$/.test(abs) ? abs.replace(/^\/mnt\/([a-z])(.*)$/, (x, d, r) => d.toUpperCase() + ':' + (r || '/').replace(/\//g, '\\')) : `\\\\wsl.localhost\\${(m.state.wsl && m.state.wsl.distro) || 'Ubuntu-24.04'}${abs.replace(/\//g, '\\')}`);
    const app = { 'explorer.exe': 'Windows 탐색기', 'notepad.exe': '메모장', 'wt.exe': 'Windows 터미널', wslview: /^https?:/.test(abs) ? 'Windows 기본 브라우저' : 'Windows 기본 프로그램' }[n];
    const josa = /[가-힣]$/.test(app) && (app.charCodeAt(app.length - 1) - 0xac00) % 28 ? '이' : '가';
    dim(`(가상 터미널: 실제 WSL 에서는 ${app}${josa} 열립니다 → ${winPath})`);
    return 0;
  });

  def(['nsupdate', 'busctl', 'systemd-run', 'sudoreplay', 'diff3', 'sdiff', 'csplit', 'tsort', 'pathchk', 'pr', 'ptx', 'zless', 'lesspipe', 'dpkg-deb', 'readelf', 'objdump', 'ld', 'as', 'nm', 'cpp', 'htdigest', 'logresolve', 'zipcloak', 'zipnote', 'zipsplit', 'funzip', 'unzipsfx', 'zipinfo', 'mount.nfs', 'xfs_repair', 'xfs_info', 'xfs_growfs', 'bridge', 'tc', 'mknod', 'mkfifo2'], async (c) => {
    if (c.name === 'zless') return LX.commands.gzip(Object.assign({}, c, { name: 'zcat' }));
    if (c.name === 'zipinfo') return LX.commands.unzip(Object.assign({}, c, { args: ['-l'].concat(c.args) }));
    if (c.name === 'pr') return LX.readInputs(c, c.args.filter((a) => !a.startsWith('-')), 'pr', (t, name) => c.out(`\n\n${LX.strftime(c.m, '%Y-%m-%d %H:%M', c.m.now())}${' '.repeat(20)}${name === '-' ? '' : name}${' '.repeat(20)}Page 1\n\n\n${t}`));
    c.err(`${c.name}: 가상 터미널에서는 이 명령을 지원하지 않습니다. 실제 Ubuntu(가상 머신)에서 실습하세요.\n`);
    return 1;
  });
})(typeof window !== 'undefined' ? window : globalThis);

