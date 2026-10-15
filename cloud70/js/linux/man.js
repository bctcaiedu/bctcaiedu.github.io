
/* 가상 리눅스 — man 페이지 (LX.MAN) · bash help (LX.HELP) · man / whatis / apropos / info 명령 */
(function (G) {
  const LX = G.LX = G.LX || {};

  /*
   * LX.MAN 항목 모양
   *   키: 'ls'  또는 같은 이름이 다른 섹션에도 있으면 'passwd(5)' 처럼 섹션을 붙인다.
   *   { sec, en, ko, syn: [], desc: '문단\n문단', opts: [[태그, 설명]], sects: [[제목, 문자열 | [[태그, 설명]] | {pre: [줄]}]],
   *     ex: [[명령, 설명]], see: [], names: 'gzip, gunzip, zcat' (NAME 줄), bi: 1 (셸 내장), title, src, date }
   */
  const MAN = LX.MAN = LX.MAN || {};

  // man 에서 다른 이름으로 찾을 때 (실제로도 같은 페이지를 보여 준다)
  const ALIAS = LX.MAN_ALIAS = {
    gunzip: 'gzip', zcat: 'gzip', egrep: 'grep', fgrep: 'grep', vi: 'vim', view: 'vim', vimdiff: 'vim',
    pkill: 'pgrep', pidwait: 'pgrep', unxz: 'xz', xzcat: 'xz', bunzip2: 'bzip2', bzcat: 'bzip2', swapoff: 'swapon',
    '.': 'source', '[': 'test', sudoedit: 'sudo', poweroff: 'reboot', halt: 'reboot', mke2fs: 'mkfs.ext4',
    'mkfs.ext3': 'mkfs.ext4', 'mkfs.ext2': 'mkfs.ext4', mawk: 'awk', nawk: 'awk', ip6tables: 'iptables',
    traceroute6: 'traceroute', addgroup: 'adduser', 'python3.12': 'python3', python: 'python3', apachectl: 'apache2ctl',
    a2dissite: 'a2ensite', mariadb: 'mysql', 'e2fsck': 'fsck', 'fsck.ext4': 'fsck', unalias: 'alias', ping4: 'ping', ping6: 'ping'
  };

  // 섹션 찾는 순서 (man-db 기본값)
  const SEC_ORDER = ['1', 'n', 'l', '8', '3', '0', '2', '5', '4', '9', '6', '7'];
  const SEC_TITLE = { 1: 'User Commands', 5: 'File Formats', 7: 'Miscellaneous Information Manual', 8: 'System Administration' };

  // 바닥줄 왼쪽(출처)
  const SRC = {};
  const src = (label, names) => names.split(/\s+/).forEach((n) => { SRC[n] = label; });
  src('GNU coreutils 9.4', 'ls pwd mkdir rmdir touch cp mv rm ln cat head tail wc sort uniq cut tr tee stat du df chmod chown chgrp id whoami who groups date uname nohup nice env basename dirname realpath readlink seq sleep yes base64 md5sum sha256sum mktemp paste dd echo printf test');
  src('util-linux 2.39.3', 'more whereis renice su mount umount lsblk blkid fdisk mkswap swapon fallocate dmesg lscpu column cal fsck');
  src('procps-ng 4.0.4', 'free top ps kill pgrep uptime w watch sysctl');
  src('psmisc 23.7', 'killall');
  src('GNU findutils 4.9.0', 'find xargs');
  src('GNU grep 3.11', 'grep');
  src('GNU sed 4.9', 'sed');
  src('mawk 1.3.4', 'awk');
  src('less 590', 'less');
  src('shadow-utils 4.13', 'useradd usermod userdel passwd groupadd gpasswd chage passwd(5) shadow group');
  src('adduser 3.137', 'adduser');
  src('sudo 1.9.15p5', 'sudo visudo sudoers');
  src('APT 2.8.3', 'apt apt-get apt-cache');
  src('dpkg 1.22.6', 'dpkg');
  src('snapd 2.68', 'snap');
  src('systemd 255', 'systemctl journalctl hostnamectl timedatectl shutdown reboot');
  src('init-system-helpers 1.66', 'service');
  src('lsb-release 12.0', 'lsb_release');
  src('GNU tar 1.35', 'tar');
  src('gzip 1.12', 'gzip');
  src('Info-ZIP', 'zip unzip');
  src('bzip2 1.0.8', 'bzip2');
  src('XZ Utils 5.4.5', 'xz');
  src('iproute2 6.1', 'ip ss');
  src('iputils-20240117', 'ping');
  src('curl 8.5.0', 'curl');
  src('GNU Wget 1.21.4', 'wget');
  src('BIND 9.18', 'dig nslookup host');
  src('traceroute 2.1.5', 'traceroute');
  src('net-tools', 'hostname');
  src('netplan.io 1.1', 'netplan netplan-apply netplan-try');
  src('ufw 0.36.2', 'ufw');
  src('iptables 1.8.10', 'iptables');
  src('OpenSSH 9.6', 'ssh scp ssh-keygen ssh-copy-id sshd_config');
  src('rsync 3.2.7', 'rsync');
  src('cron 3.0pl1', 'crontab crontab(5)');
  src('GNU parted 3.6', 'parted');
  src('e2fsprogs 1.47.0', 'mkfs.ext4 resize2fs');
  src('LVM TOOLS 2.03.16', 'lvcreate pvcreate vgcreate lvextend');
  src('GNU nano 7.2', 'nano');
  src('Vim 9.1', 'vim');
  src('GNU bash 5.2', 'bash cd read export history alias source jobs bg fg umask');
  src('man-db 2.12.0', 'man whatis apropos');
  src('GNU diffutils 3.10', 'diff');
  src('tree 2.1.1', 'tree');
  src('lsof 4.95', 'lsof');
  src('tmux 3.4', 'tmux');
  src('GNU Screen 4.9.1', 'screen');
  src('Docker', 'docker');
  src('nginx 1.24.0', 'nginx');
  src('Apache HTTP Server 2.4.58', 'apache2ctl a2ensite');
  src('MySQL 8.0', 'mysql');
  src('Git 2.43.0', 'git');
  src('Python 3.12', 'python3');
  src('OpenSSL 3.0.13', 'openssl');
  src('logrotate 3.21.0', 'logrotate');
  src('GNU time 1.9', 'time');
  src('bc 1.07.1', 'bc');
  src('jq 1.7.1', 'jq');
  src('debianutils 5.17', 'which');
  src('file 5.45', 'file');
  src('htop 3.3.0', 'htop');
  src('Linux man-pages 6.7', 'hosts fstab hier');

  // ======================================================================= 조회
  const keyName = (k) => k.replace(/\([^)]*\)$/, '');
  const secRank = (s) => { const i = SEC_ORDER.indexOf(String(s)[0]); return i < 0 ? 99 : i; };

  /** 이름(과 섹션)으로 페이지 찾기 → [{ key, name, e }] (섹션 순서대로) */
  function lookup(name, sec) {
    const want = ALIAS[name] && !Object.keys(MAN).some((k) => keyName(k) === name) ? ALIAS[name] : name;
    const out = [];
    for (const k of Object.keys(MAN)) {
      if (keyName(k) !== want) continue;
      const e = MAN[k];
      if (sec && !String(e.sec).toLowerCase().startsWith(String(sec).toLowerCase())) continue;
      out.push({ key: k, name: keyName(k), shown: name, e });
    }
    return out.sort((a, b) => secRank(a.e.sec) - secRank(b.e.sec));
  }
  LX.manLookup = lookup;

  // ======================================================================= 출력 도구
  const B = (s) => `\x1b[1m${s}\x1b[0m`;
  const vis = (s) => (LX.visLen ? LX.visLen(s) : [...String(s).replace(/\x1b\[[0-9;]*m/g, '')].reduce((a, ch) => a + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1), 0));

  /** 단어 단위 줄바꿈 (한글 폭 2) */
  function wrap(text, width) {
    const lines = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(/ +/).filter((w) => w !== '');
      let cur = '';
      for (let w of words) {
        while (vis(w) > width) {           // 너무 긴 단어는 강제로 자르기
          if (cur) { lines.push(cur); cur = ''; }
          let cut = '', i = 0;
          const chars = [...w];
          while (i < chars.length && vis(cut + chars[i]) <= width) cut += chars[i++];
          lines.push(cut);
          w = chars.slice(i).join('');
        }
        if (!w) continue;
        if (!cur) cur = w;
        else if (vis(cur) + 1 + vis(w) <= width) cur += ' ' + w;
        else { lines.push(cur); cur = w; }
      }
      lines.push(cur);
    }
    return lines;
  }

  const IND = 7, TAG = 14;
  function tagged(list, W, boldTag = true, inline = true, gap = true) {
    let o = '';
    for (const [tag, d] of list) {
      const body = wrap(d || '', Math.max(20, W - TAG));
      const t = boldTag ? B(tag) : tag;
      if (inline && vis(tag) <= TAG - IND - 2) {
        o += ' '.repeat(IND) + t + ' '.repeat(TAG - IND - vis(tag)) + (body[0] || '') + '\n';
        body.slice(1).forEach((l) => { o += ' '.repeat(TAG) + l + '\n'; });
      } else {
        o += ' '.repeat(IND) + t + '\n';
        body.forEach((l) => { if (l !== '' || body.length > 1) o += ' '.repeat(TAG) + l + '\n'; });
      }
      if (gap) o += '\n';
    }
    return gap ? o : o + '\n';
  }
  const para = (text, W) => String(text).split('\n').map((p) => wrap(p, W - IND).map((l) => (l ? ' '.repeat(IND) + l : '')).join('\n')).join('\n\n') + '\n\n';

  function centerLine(left, mid, right, W) {
    const lw = vis(left), mw = vis(mid), rw = vis(right);
    let pos = Math.ceil((W - mw) / 2);
    if (pos < lw + 1) pos = lw + 1;
    let s = left + ' '.repeat(pos - lw) + mid;
    const gap = W - vis(s) - rw;
    return s + ' '.repeat(Math.max(1, gap)) + right;
  }

  /** man 페이지 한 개를 터미널 문자열로 */
  function render(hit, cols) {
    const { e, key, name } = hit;
    const W = Math.max(50, Math.min(cols || 80, 80) - 2);
    const secS = String(e.sec).toUpperCase() === String(e.sec) ? String(e.sec) : String(e.sec).replace(/[a-z]+$/, (x) => x.toUpperCase());
    const tag = `${name.toUpperCase()}(${secS})`;
    const title = e.title || (e.bi ? 'Bash Builtin Commands' : SEC_TITLE[parseInt(e.sec, 10)] || 'Manual');
    let o = centerLine(tag, title, tag, W) + '\n\n';
    o += B('NAME') + '\n';
    o += wrap(`${e.names || name} - ${e.en}`, W - IND).map((l) => ' '.repeat(IND) + l).join('\n') + '\n';
    if (e.ko) o += ' '.repeat(IND) + `(${e.ko})` + '\n';
    o += '\n';
    if (e.syn && e.syn.length) {
      o += B('SYNOPSIS') + '\n';
      for (const s of e.syn) {
        const m = /^(\S+)(.*)$/.exec(s);
        const lines = wrap(m[1] + m[2], W - IND - 4);
        lines.forEach((l, i) => {
          let t = i === 0 ? B(m[1]) + l.slice(m[1].length) : l;
          o += ' '.repeat(i === 0 ? IND : IND + 4) + t + '\n';
        });
      }
      o += '\n';
    }
    if (e.desc) { o += B('DESCRIPTION') + '\n' + para(e.desc, W); }
    for (const [h, body] of e.sects || []) {
      o += B(h) + '\n';
      if (typeof body === 'string') o += para(body, W);
      else if (Array.isArray(body)) o += tagged(body, W, true, true, false);
      else if (body && body.pre) o += body.pre.map((l) => (l ? ' '.repeat(IND) + l : '')).join('\n') + '\n\n';
    }
    if (e.opts && e.opts.length) { o += B('OPTIONS') + '\n' + tagged(e.opts, W); }
    if (e.ex && e.ex.length) { o += B('EXAMPLES') + '\n' + tagged(e.ex, W, false, false); }
    if (e.see && e.see.length) {
      o += B('SEE ALSO') + '\n';
      const items = e.see.map((s) => s.replace(/^([^(]+)(\(.*\))$/, (x, a, b) => B(a) + b));
      let line = ' '.repeat(IND), len = IND;
      items.forEach((it, i) => {
        const piece = it + (i < items.length - 1 ? ',' : '');
        const pl = vis(piece);
        if (len + 1 + pl > W && len > IND) { o += line + '\n'; line = ' '.repeat(IND); len = IND; }
        line += (len > IND ? ' ' : '') + piece; len += (len > IND ? 1 : 0) + pl;
      });
      o += line + '\n\n';
    }
    o += centerLine(e.src || SRC[key] || SRC[name] || 'Ubuntu 24.04', e.date || 'April 2024', tag, W) + '\n';
    return o;
  }
  LX.manRender = render;

  const NOTE = '\x1b[2m(가상 터미널: 실제 man 페이지를 한국어로 요약했습니다. 전체 내용은 실제 Ubuntu 에서 man 명령으로 확인하세요)\x1b[0m\n';

  const plain = (t) => String(t).replace(/\x1b\[[0-9;]*m/g, '');

  function whatisLine(name, e) {
    return `${name} (${e.sec})`.padEnd(21) + '- ' + e.en;
  }

  function whatis(c, names, label = 'whatis') {
    if (!names.length) { c.err(`${label} what?\n`); return 1; }
    let rc = 0;
    for (const n of names) {
      const hits = lookup(n);
      if (!hits.length) { c.err(`${n}: nothing appropriate.\n`); rc = 16; continue; }
      hits.forEach((h) => c.out(whatisLine(n, h.e) + '\n'));
    }
    return rc;
  }

  function apropos(c, words, label = 'apropos') {
    if (!words.length) { c.err(`${label} what?\n`); return 1; }
    const res = new Map();
    let rc = 0;
    for (const w of words) {
      let re;
      try { re = new RegExp(w, 'i'); } catch (err) { re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); }
      let found = false;
      const add = (name, e, k) => { found = true; res.set(k, whatisLine(name, e)); };
      for (const k of Object.keys(MAN)) {
        const e = MAN[k], name = keyName(k);
        if (re.test(name) || re.test(e.en || '') || re.test(e.ko || '') || (e.names && re.test(e.names))) add(name, e, k);
      }
      for (const [a, t] of Object.entries(ALIAS)) {
        if (!re.test(a)) continue;
        const h = lookup(t)[0];
        if (h) add(a, h.e, a + '@' + h.key);
      }
      if (!found) { c.err(`${w}: nothing appropriate.\n`); rc = 16; }
    }
    [...res.values()].sort((a, b) => a.localeCompare(b)).forEach((l) => c.out(l + '\n'));
    return res.size ? 0 : rc;
  }

  // ======================================================================= 명령
  const manCmd = async (c) => {
    const args = c.args.slice();
    const ops = [];
    let mode = null, where = false, all = false, secOpt = null;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-k' || a === '--apropos') mode = 'k';
      else if (a === '-f' || a === '--whatis') mode = 'f';
      else if (a === '-w' || a === '--where' || a === '--path' || a === '--location') where = true;
      else if (a === '-a' || a === '--all') all = true;
      else if (a === '-s' || a === '-S' || a === '--sections') secOpt = args[++i];
      else if (/^--sections?=/.test(a)) secOpt = a.split('=')[1];
      else if (a === '-h' || a === '--help') {
        c.out('Usage: man [OPTION...] [SECTION] PAGE...\n\n  -f, --whatis               whatis 와 같음 (한 줄 설명)\n  -k, --apropos              apropos 와 같음 (키워드 검색)\n  -a, --all                  일치하는 모든 페이지 보기\n  -w, --where, --path        페이지 파일 위치만 출력\n  -s, --sections=LIST        찾을 섹션 목록\n\n자세한 설명: man man\n');
        return 0;
      } else if (a === '--version' || a === '-V') { c.out('man 2.12.0\n'); return 0; }
      else if (/^-/.test(a) && a !== '-') { /* 기타 옵션 무시 */ }
      else ops.push(a);
    }
    if (mode === 'k') return apropos(c, ops, 'apropos');
    if (mode === 'f') return whatis(c, ops, 'whatis');
    let sec = secOpt ? secOpt.split(/[,:]/)[0] : null;
    if (!sec && ops.length > 1 && /^([1-9]\w*|n|l)$/.test(ops[0])) sec = ops.shift();
    if (!ops.length) {
      if (sec) { c.err(`No manual entry for ${sec}\n`); return 16; }
      c.err("What manual page do you want?\nFor example, try 'man man'.\n");
      return 1;
    }
    let rc = 0, shown = 0;
    const cols = (c.session && c.session.cols) || 80;
    for (let n of ops) {
      let s = sec;
      const m = /^(.+)\((\w+)\)$/.exec(n) || /^(.+)\.([1-9]\w*)$/.exec(MAN[n] ? '' : n);
      if (m && lookup(m[1], m[2]).length) { n = m[1]; s = m[2]; }
      let hits = lookup(n, s);
      if (!hits.length) {
        c.err(s ? `No manual entry for ${n} in section ${s}\n` : `No manual entry for ${n}\n`);
        rc = 16;
        continue;
      }
      if (!all) hits = hits.slice(0, 1);
      for (const h of hits) {
        if (where) { c.out(`/usr/share/man/man${String(h.e.sec)[0]}/${h.name}.${h.e.sec}.gz\n`); continue; }
        if (shown++) c.out('\n');
        c.out(c.tty === false ? plain(render(h, cols)) : render(h, cols));
      }
    }
    if (shown) c.out(c.tty === false ? plain(NOTE) : NOTE);
    return rc;
  };
  LX.def('man', manCmd);
  LX.def('info', async (c) => {
    const ops = c.args.filter((a) => !/^-/.test(a));
    if (!ops.length) return manCmd(Object.assign(Object.create(c), { args: ['info'] }));
    return manCmd(Object.assign(Object.create(c), { args: ops }));
  });
  LX.def('whatis', async (c) => whatis(c, c.args.filter((a) => !/^-/.test(a))));
  LX.def('apropos', async (c) => apropos(c, c.args.filter((a) => !/^-/.test(a))));

  // ======================================================================= --help 문구
  /** GNU 형식 --help 문구 (LX.MAN 에 없으면 null) */
  LX.helpText = function (name) {
    const h = lookup(name)[0];
    if (!h) return null;
    const e = h.e;
    let o = '';
    (e.syn || [name]).forEach((s, i) => { o += (i === 0 ? 'Usage: ' : '  or:  ') + s + '\n'; });
    o += (e.en ? e.en[0].toUpperCase() + e.en.slice(1).replace(/\.?$/, '.') : '') + '\n';
    if (e.ko) o += `(${e.ko})\n`;
    if (e.opts && e.opts.length) {
      o += '\n';
      for (const [tag, d] of e.opts) {
        const t = '  ' + tag;
        if (vis(t) < 28) o += t + ' '.repeat(29 - vis(t)) + d + '\n';
        else o += t + '\n' + ' '.repeat(29) + d + '\n';
      }
    }
    o += `\n자세한 설명은 'man ${name}' 명령으로 확인하세요.\n`;
    return o;
  };

  // ======================================================================= bash help
  const HELP = LX.HELP = LX.HELP || {};
  function H(name, usage, en, opts, ko, extra) {
    let s = `${name}: ${usage}\n    ${en}\n`;
    if (extra) s += '    \n' + extra.split('\n').map((l) => '    ' + l).join('\n') + '\n';
    if (opts && opts.length) {
      s += '    \n    Options:\n';
      for (const [o, d] of opts) s += `      ${o}\t${d}\n`;
    }
    s += `    \n    [한국어] ${ko}`;
    HELP[name] = s;
  }
  H('cd', 'cd [-L|[-P [-e]] [-@]] [dir]', 'Change the shell working directory.',
    [['-L', 'force symbolic links to be followed (default)'], ['-P', 'use the physical directory structure without following symbolic links'], ['-e', 'with -P, exit with non-zero status if the current directory cannot be determined']],
    "현재 작업 디렉터리를 바꿉니다. 인자가 없으면 홈(~)으로, 'cd -' 는 이전 디렉터리로, 'cd ..' 는 상위 디렉터리로 갑니다.",
    'Change the current directory to DIR.  The default DIR is the value of the\nHOME shell variable.  "cd -" is equivalent to "cd $OLDPWD".\n\nExit Status:\nReturns 0 if the directory is changed; non-zero otherwise.');
  H('pwd', 'pwd [-LP]', 'Print the name of the current working directory.',
    [['-L', 'print the value of $PWD if it names the current working directory'], ['-P', 'print the physical directory, without any symbolic links']],
    '현재 작업 디렉터리의 절대 경로를 출력합니다.');
  H('echo', 'echo [-neE] [arg ...]', 'Write arguments to the standard output.',
    [['-n', 'do not append a newline'], ['-e', 'enable interpretation of backslash escapes (\\n, \\t, \\\\ ...)'], ['-E', 'explicitly suppress interpretation of backslash escapes']],
    '인자를 공백으로 이어 한 줄로 출력합니다. -e 를 주면 \\n(줄바꿈), \\t(탭) 같은 이스케이프를 해석합니다.');
  H('export', 'export [-fn] [name[=value] ...] or export -p', 'Set export attribute for shell variables.',
    [['-f', 'refer to shell functions'], ['-n', 'remove the export property from each NAME'], ['-p', 'display a list of all exported variables and functions']],
    '변수를 환경 변수로 만들어 자식 프로세스(이 셸에서 실행하는 명령)에도 전달되게 합니다. 예: export PATH=$PATH:~/bin');
  H('read', 'read [-ers] [-a array] [-d delim] [-i text] [-n nchars] [-N nchars] [-p prompt] [-t timeout] [-u fd] [name ...]',
    'Read a line from the standard input and split it into fields.',
    [['-a array', 'assign the words read to sequential indices of the array variable ARRAY'], ['-d delim', 'continue until the first character of DELIM is read, rather than newline'], ['-n nchars', 'return after reading NCHARS characters'], ['-p prompt', 'output the string PROMPT without a trailing newline before attempting to read'], ['-r', 'do not allow backslashes to escape any characters'], ['-s', 'do not echo input coming from a terminal'], ['-t timeout', 'time out and return failure if a complete line is not read within TIMEOUT seconds']],
    '표준 입력에서 한 줄을 읽어 변수에 저장합니다. 이름을 안 주면 REPLY 에 저장합니다. 예: read -p "이름: " name');
  H('alias', 'alias [-p] [name[=value] ... ]', 'Define or display aliases.',
    [['-p', 'print all defined aliases in a reusable format']],
    "명령의 별명을 만듭니다. 예: alias ll='ls -alF'. 인자 없이 쓰면 목록을 보여 주고, unalias 로 지웁니다. 계속 쓰려면 ~/.bashrc 에 적습니다.",
    'Without arguments, `alias\' prints the list of aliases in the reusable\nform `alias NAME=VALUE\' on standard output.');
  H('unalias', 'unalias [-a] name [name ...]', 'Remove each NAME from the list of defined aliases.',
    [['-a', 'remove all alias definitions']], '만들어 둔 별명(alias)을 지웁니다.');
  H('history', 'history [-c] [-d offset] [n] or history -anrw [filename] or history -ps arg [arg...]', 'Display or manipulate the history list.',
    [['-c', 'clear the history list by deleting all of the entries'], ['-d offset', 'delete the history entry at position OFFSET'], ['-a', 'append history lines from this session to the history file'], ['-n', 'read all history lines not already read from the history file'], ['-r', 'read the history file and append the contents to the history list'], ['-w', 'write the current history to the history file']],
    '입력했던 명령 목록을 번호와 함께 보여 줍니다. !번호 로 다시 실행하고, !! 는 바로 앞 명령입니다. 파일은 ~/.bash_history.');
  H('type', 'type [-afptP] name [name ...]', 'Display information about command type.',
    [['-a', 'display all locations containing an executable named NAME'], ['-f', 'suppress shell function lookup'], ['-P', 'force a PATH search for each NAME'], ['-p', 'returns the name of the disk file that would be executed'], ['-t', "output a single word: `alias', `keyword', `function', `builtin', `file' or `'"]],
    '이름이 별명·셸 키워드·함수·내장 명령·실행 파일 중 무엇인지 알려 줍니다. 예: type ls cd');
  H('test', 'test [expr]', 'Evaluate conditional expression.',
    [['-e FILE', 'True if file exists.'], ['-f FILE', 'True if file exists and is a regular file.'], ['-d FILE', 'True if file is a directory.'], ['-r/-w/-x FILE', 'True if file is readable/writable/executable by you.'], ['-s FILE', 'True if file exists and is not empty.'], ['-z STRING', 'True if string is empty.'], ['-n STRING', 'True if string is not empty.'], ['S1 = S2', 'True if the strings are equal (!= for not equal).'], ['N1 -eq N2', 'Arithmetic tests: -eq, -ne, -lt, -le, -gt, -ge.'], ['! EXPR', 'True if expr is false.']],
    '조건을 검사해 참이면 0, 거짓이면 1 을 돌려줍니다. [ 조건 ] 과 같습니다. 예: [ -f /etc/passwd ] && echo 있음',
    'Exits with a status of 0 (true) or 1 (false) depending on\nthe evaluation of EXPR.');
  H('[', '[ arg... ]', 'Evaluate conditional expression.', null, "test 와 같습니다. 마지막 인자는 반드시 ']' 여야 하고, 괄호 안쪽에 공백이 필요합니다.",
    'This is a synonym for the "test" builtin, but the last argument must\nbe a literal `]\', to match the opening `[\'.');
  H('printf', 'printf [-v var] format [arguments]', 'Formats and prints ARGUMENTS under control of the FORMAT.',
    [['-v var', 'assign the output to shell variable VAR rather than display it on the standard output']],
    "형식에 맞춰 출력합니다. %s(문자열) %d(정수) %f(실수) %x(16진수) %b(이스케이프 해석). 줄바꿈은 직접 \\n 을 써야 합니다. 예: printf '%-10s %5d\\n' 사과 3");
  H('source', 'source filename [arguments]', 'Execute commands from a file in the current shell.', null,
    '파일의 명령을 현재 셸에서 실행합니다(새 셸을 만들지 않음). 그래서 변수·별명 변경이 그대로 남습니다. 예: source ~/.bashrc  (. ~/.bashrc 와 같음)');
  H('.', '. filename [arguments]', 'Execute commands from a file in the current shell.', null, 'source 와 같습니다.');
  H('exit', 'exit [n]', 'Exit the shell.', null,
    '셸을 끝냅니다. N 을 주면 그 값이 종료 코드가 되고, 없으면 마지막 명령의 종료 코드를 씁니다.',
    'Exits the shell with a status of N.  If N is omitted, the exit status\nis that of the last command executed.');
  H('set', 'set [-abefhkmnptuvxBCEHPT] [-o option-name] [--] [-] [arg ...]', 'Set or unset values of shell options and positional parameters.',
    [['-e', 'Exit immediately if a command exits with a non-zero status.'], ['-u', 'Treat unset variables as an error when substituting.'], ['-x', 'Print commands and their arguments as they are executed.'], ['-n', 'Read commands but do not execute them.'], ['-o pipefail', 'the return value of a pipeline is the status of the last command to exit with a non-zero status'], ['-o noclobber', 'do not overwrite existing files with >  (same as -C)'], ['--', 'Assign any remaining arguments to the positional parameters.']],
    '셸 옵션을 켜고(-) 끕니다(+). 스크립트에서 set -euo pipefail 을 자주 씁니다. 인자 없이 쓰면 모든 변수를 보여 줍니다.');
  H('unset', 'unset [-f] [-v] [-n] [name ...]', 'Unset values and attributes of shell variables and functions.',
    [['-f', 'treat each NAME as a shell function'], ['-v', 'treat each NAME as a shell variable'], ['-n', 'treat each NAME as a name reference and unset the variable itself']],
    '변수나 함수를 지웁니다. 예: unset MYVAR');
  H('declare', 'declare [-aAfFgiIlnrtux] [name[=value] ...] or declare -p [-aAfFilnrtux] [name ...]', 'Set variable values and attributes.',
    [['-a', 'to make NAMEs indexed arrays'], ['-A', 'to make NAMEs associative arrays'], ['-i', 'to make NAMEs have the `integer\' attribute'], ['-r', 'to make NAMEs readonly'], ['-x', 'to make NAMEs export'], ['-l / -u', 'convert the value to lower / upper case on assignment'], ['-p', 'display the attributes and value of each NAME'], ['-f', 'restrict action or display to function names and definitions']],
    '변수에 속성(정수, 배열, 읽기 전용, 환경 변수 등)을 붙여 선언합니다. 함수 안에서 쓰면 local 과 같습니다.');
  H('local', 'local [option] name[=value] ...', 'Define local variables.', null,
    '함수 안에서만 쓰이는 지역 변수를 만듭니다. 함수 밖에서 쓰면 오류입니다. 옵션은 declare 와 같습니다.');
  H('readonly', 'readonly [-aAf] [name[=value] ...] or readonly -p', 'Mark shell variables as unchangeable.',
    [['-a', 'refer to indexed array variables'], ['-A', 'refer to associative array variables'], ['-f', 'refer to shell functions'], ['-p', 'display a list of all readonly variables or functions']],
    '변수를 읽기 전용으로 만듭니다. 이후 값을 바꾸거나 unset 할 수 없습니다.');
  H('jobs', 'jobs [-lnprs] [jobspec ...] or jobs -x command [args]', 'Display status of jobs.',
    [['-l', 'lists process IDs in addition to the normal information'], ['-n', 'lists only processes that have changed status since the last notification'], ['-p', 'lists process IDs only'], ['-r', 'restrict output to running jobs'], ['-s', 'restrict output to stopped jobs']],
    '이 셸의 작업(백그라운드 · 멈춘 명령) 목록을 보여 줍니다. [1]+ 의 + 는 현재 작업, - 는 이전 작업입니다.');
  H('fg', 'fg [job_spec]', 'Move job to the foreground.', null,
    '백그라운드나 멈춘(Ctrl+Z) 작업을 포그라운드로 가져옵니다. 예: fg %1  (작업 번호를 안 주면 현재 작업)');
  H('bg', 'bg [job_spec ...]', 'Move jobs to the background.', null,
    'Ctrl+Z 로 멈춘 작업을 백그라운드에서 계속 실행합니다. 예: bg %1');
  H('kill', 'kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]', 'Send a signal to a job.',
    [['-s sig', 'SIG is a signal name'], ['-n sig', 'SIG is a signal number'], ['-l', 'list the signal names; if arguments follow `-l\' they are assumed to be signal numbers for which names should be listed'], ['-L', 'synonym for -l']],
    '프로세스(또는 %작업)에 시그널을 보냅니다. 기본은 15(TERM, 정상 종료 요청), 강제 종료는 kill -9 PID.');
  H('umask', 'umask [-p] [-S] [mode]', 'Display or set file mode mask.',
    [['-p', 'if MODE is omitted, output in a form that may be reused as input'], ['-S', 'makes the output symbolic; otherwise an octal number is output']],
    '새로 만드는 파일/디렉터리에서 뺄 권한(마스크)을 보거나 정합니다. 기본 0002 이면 파일 664, 디렉터리 775 로 만들어집니다.');
  H('let', 'let arg [arg ...]', 'Evaluate arithmetic expressions.', null,
    '산술식을 계산합니다. 예: let "n = n + 1". 보통은 (( n++ )) 나 $(( )) 를 더 많이 씁니다. 결과가 0 이면 종료 코드 1.');
  H('pushd', 'pushd [-n] [+N | -N | dir]', 'Add directories to stack.',
    [['-n', 'Suppresses the normal change of directory when adding directories to the stack']],
    '현재 디렉터리를 스택에 넣고 DIR 로 이동합니다. popd 로 되돌아옵니다. dirs 로 스택을 봅니다.');
  H('popd', 'popd [-n] [+N | -N]', 'Remove directories from stack.',
    [['-n', 'Suppresses the normal change of directory when removing directories from the stack']],
    '디렉터리 스택 맨 위를 꺼내 그 디렉터리로 이동합니다.');
  H('dirs', 'dirs [-clpv] [+N] [-N]', 'Display directory stack.',
    [['-c', 'clear the directory stack by deleting all of the elements'], ['-l', 'do not print tilde-prefixed versions of directories relative to your home directory'], ['-p', 'print the directory stack with one entry per line'], ['-v', 'print the directory stack with one entry per line prefixed with its position in the stack']],
    'pushd/popd 로 쌓은 디렉터리 스택을 보여 줍니다.');
  H('shift', 'shift [n]', 'Shift positional parameters.', null,
    '위치 매개변수를 왼쪽으로 N(기본 1)칸 옮깁니다. $2 가 $1 이 됩니다. 스크립트에서 인자를 차례로 처리할 때 씁니다.');
  H('eval', 'eval [arg ...]', 'Execute arguments as a shell command.', null,
    '인자를 하나의 문자열로 이어 다시 셸 명령으로 해석해 실행합니다. 예상치 못한 코드가 실행될 수 있어 조심해서 씁니다.');
  H('exec', 'exec [-cl] [-a name] [command [argument ...]] [redirection ...]', 'Replace the shell with the given command.',
    [['-a name', 'pass NAME as the zeroth argument to COMMAND'], ['-c', 'execute COMMAND with an empty environment'], ['-l', 'place a dash in the zeroth argument to COMMAND']],
    '현재 셸을 COMMAND 로 바꿔 실행합니다(끝나면 셸로 돌아오지 않음). 명령 없이 리다이렉션만 주면 셸의 입출력을 바꿉니다. 예: exec > log.txt');
  H('wait', 'wait [-fn] [-p var] [id ...]', 'Wait for job completion and return exit status.',
    [['-n', 'waits for a single job from the list of IDs, or, if no IDs are supplied, for the next job to complete'], ['-f', 'waits for each ID to terminate, instead of waiting for it to change status']],
    '백그라운드 작업이 끝날 때까지 기다립니다. 인자가 없으면 모든 자식 작업을 기다립니다.');
  H('return', 'return [n]', 'Return from a shell function.', null,
    '함수(또는 source 로 읽은 스크립트)를 끝내고 N 을 종료 코드로 돌려줍니다.');
  H('break', 'break [n]', 'Exit for, while, or until loops.', null,
    'for/while/until 반복문을 빠져나갑니다. N 을 주면 N 겹의 반복문을 한 번에 빠져나갑니다.');
  H('continue', 'continue [n]', 'Resume for, while, or until loops.', null,
    '반복문의 나머지 부분을 건너뛰고 다음 반복으로 넘어갑니다.');
  H('getopts', 'getopts optstring name [arg ...]', 'Parse option arguments.', null,
    "스크립트의 옵션(-a -b 값)을 하나씩 해석합니다. 값을 받는 옵션은 뒤에 ':' 를 붙입니다. 예: while getopts 'ab:' opt; do ...; done  (값은 $OPTARG)",
    'Each time it is invoked, getopts will place the next option in the\nshell variable $name, and the index of the next argument in OPTIND.');
  H('trap', 'trap [-lp] [[arg] signal_spec ...]', 'Trap signals and other events.',
    [['-l', 'print a list of signal names and their corresponding numbers'], ['-p', 'display the trap commands associated with each SIGNAL_SPEC']],
    "시그널을 받을 때 실행할 명령을 정합니다. 예: trap 'rm -f /tmp/x; exit' INT TERM,  trap 'echo 끝' EXIT");
  H('help', 'help [-dms] [pattern ...]', 'Display information about builtin commands.',
    [['-d', 'output short description for each topic'], ['-m', 'display usage in pseudo-manpage format'], ['-s', 'output only a short usage synopsis for each topic matching PATTERN']],
    '셸 내장 명령의 사용법을 보여 줍니다. 실행 파일 명령은 man 으로 봅니다.');
  H('command', 'command [-pVv] command [arg ...]', 'Execute a simple command or display information about commands.',
    [['-p', 'use a default value for PATH that is guaranteed to find all of the standard utilities'], ['-v', 'print a single word indicating the command or filename that invokes COMMAND'], ['-V', 'print a more verbose description of each COMMAND']],
    '별명·함수를 건너뛰고 명령을 실행합니다. command -v 이름 은 명령이 있는지 확인할 때 씁니다.');

  // ======================================================================= 페이지 데이터
  Object.assign(MAN, {
    ls: {
      sec: 1, en: 'list directory contents', ko: '디렉터리 내용 보기',
      syn: ['ls [OPTION]... [FILE]...'],
      desc: '파일과 디렉터리 목록을 보여 줍니다. 인자를 주지 않으면 현재 디렉터리를 보여 주고, 기본적으로 이름순으로 정렬합니다.\n점(.)으로 시작하는 숨김 파일은 -a 를 줘야 보입니다. Ubuntu 에는 ll(ls -alF), la, l 같은 별명이 ~/.bashrc 에 미리 들어 있습니다.',
      opts: [
        ['-a, --all', '점(.)으로 시작하는 숨김 파일까지 모두 보기'],
        ['-A, --almost-all', '숨김 파일은 보이되 . 과 .. 은 빼기'],
        ['-l', '긴 형식: 권한, 링크 수, 소유자, 그룹, 크기, 수정 시각, 이름'],
        ['-h, --human-readable', '-l 과 함께 쓰면 크기를 1K, 234M, 2G 처럼 읽기 쉽게'],
        ['-t', '수정 시각 순으로(최신이 먼저) 정렬'],
        ['-S', '파일 크기 순으로(큰 것이 먼저) 정렬'],
        ['-r, --reverse', '정렬 순서를 뒤집기'],
        ['-R, --recursive', '하위 디렉터리까지 재귀적으로 보기'],
        ['-d, --directory', '디렉터리 안쪽이 아니라 디렉터리 자체의 정보 보기'],
        ['-i, --inode', '각 파일의 inode 번호 보기'],
        ['-F, --classify', '종류 표시 붙이기 (/ 디렉터리, * 실행 파일, @ 링크)'],
        ['-1', '한 줄에 하나씩 출력'],
        ['--color[=WHEN]', '색 사용 여부: always, auto, never']
      ],
      ex: [['ls -l', '현재 디렉터리를 자세히 보기'], ['ls -alh ~', '홈 디렉터리의 숨김 파일까지 크기를 읽기 쉽게 보기'], ['ls -lt /var/log | head', '가장 최근에 바뀐 로그 파일 10개'], ['ls -ld /tmp', '/tmp 디렉터리 자체의 권한 확인 (drwxrwxrwt)']],
      see: ['dir(1)', 'stat(1)', 'tree(1)', 'dircolors(1)']
    },
    cd: {
      sec: 1, bi: 1, en: 'change the shell working directory', ko: '작업 디렉터리 바꾸기',
      syn: ['cd [-L|[-P [-e]] [-@]] [dir]'],
      desc: "현재 작업 디렉터리를 DIR 로 바꿉니다. cd 는 실행 파일이 아니라 bash 내장 명령이어서, 실제 Ubuntu 에서는 'help cd' 로 설명을 봅니다.\n인자가 없으면 홈 디렉터리($HOME)로 갑니다. 이동에 성공하면 PWD 와 OLDPWD 변수가 바뀝니다.",
      opts: [['-L', '심볼릭 링크를 따라간 경로를 유지 (기본값)'], ['-P', '심볼릭 링크를 풀어 실제 물리 경로로 이동'], ['~', '홈 디렉터리 (~user 는 그 사용자의 홈)'], ['-', '바로 전 디렉터리($OLDPWD)로 돌아가고 그 경로를 출력'], ['..', '한 단계 위(상위) 디렉터리'], ['.', '현재 디렉터리']],
      ex: [['cd /etc/nginx', '절대 경로로 이동'], ['cd ../log', '상대 경로로 이동'], ['cd', '홈으로 이동'], ['cd -', '이전 디렉터리로 돌아가기']],
      see: ['pwd(1)', 'bash(1)', 'pushd', 'popd']
    },
    pwd: {
      sec: 1, en: 'print name of current/working directory', ko: '현재 디렉터리 경로 출력',
      syn: ['pwd [OPTION]...'],
      desc: '지금 있는 디렉터리의 절대 경로(/ 부터 시작)를 출력합니다. 보통은 bash 내장 pwd 가 실행되며, /usr/bin/pwd 도 있습니다.',
      opts: [['-L, --logical', '심볼릭 링크를 포함한 경로 ($PWD) 출력 (내장 명령 기본값)'], ['-P, --physical', '심볼릭 링크를 모두 푼 실제 경로 출력']],
      ex: [['pwd', '예: /home/user'], ['cd /var/run && pwd -P', '/var/run 은 /run 을 가리키는 링크이므로 /run 출력']],
      see: ['cd', 'realpath(1)', 'getcwd(3)']
    },
    mkdir: {
      sec: 1, en: 'make directories', ko: '디렉터리 만들기',
      syn: ['mkdir [OPTION]... DIRECTORY...'],
      desc: '디렉터리를 새로 만듭니다. 이미 있으면 오류가 나고, 중간 경로가 없어도 오류가 납니다.\n-p 를 쓰면 중간 디렉터리까지 한꺼번에 만들고, 이미 있어도 오류를 내지 않아 스크립트에서 자주 씁니다. 새 디렉터리의 권한은 umask 의 영향을 받습니다.',
      opts: [['-p, --parents', '필요한 상위 디렉터리까지 만들고, 이미 있어도 오류 없음'], ['-m, --mode=MODE', '권한을 지정 (예: -m 700)'], ['-v, --verbose', '만든 디렉터리마다 메시지 출력']],
      ex: [['mkdir project', 'project 디렉터리 만들기'], ['mkdir -p app/{src,docs,tests}', '중괄호 확장으로 하위 디렉터리 3개를 한 번에'], ['mkdir -m 700 secret', '나만 접근 가능한 디렉터리']],
      see: ['rmdir(1)', 'mkdir(2)', 'umask']
    },
    rmdir: {
      sec: 1, en: 'remove empty directories', ko: '빈 디렉터리 지우기',
      syn: ['rmdir [OPTION]... DIRECTORY...'],
      desc: '비어 있는 디렉터리만 지웁니다. 안에 파일이 있으면 "Directory not empty" 오류가 나며, 그때는 rm -r 을 씁니다.',
      opts: [['-p, --parents', '지운 뒤 상위 디렉터리도 비었으면 차례로 지우기 (rmdir -p a/b/c)'], ['-v, --verbose', '지울 때마다 메시지 출력'], ['--ignore-fail-on-non-empty', '비어 있지 않아서 실패한 경우는 무시']],
      ex: [['rmdir olddir', '빈 디렉터리 삭제'], ['rmdir -p a/b/c', 'c, b, a 순서로 삭제']],
      see: ['rm(1)', 'mkdir(1)']
    },
    touch: {
      sec: 1, en: 'change file timestamps', ko: '파일 시각 바꾸기 (없으면 빈 파일 만들기)',
      syn: ['touch [OPTION]... FILE...'],
      desc: '파일의 접근 시각과 수정 시각을 현재 시각으로 바꿉니다. 파일이 없으면 크기 0 의 빈 파일을 만들기 때문에, 빈 파일을 만드는 용도로 가장 많이 씁니다.',
      opts: [['-a', '접근 시각(atime)만 바꾸기'], ['-m', '수정 시각(mtime)만 바꾸기'], ['-c, --no-create', '파일이 없으면 만들지 않기'], ['-d, --date=STRING', '현재 시각 대신 지정한 시각 사용 (예: -d "2024-01-01 10:00")'], ['-t STAMP', '[[CC]YY]MMDDhhmm[.ss] 형식으로 시각 지정'], ['-r, --reference=FILE', '다른 파일과 같은 시각으로 맞추기']],
      ex: [['touch memo.txt', '빈 파일 만들기 (있으면 시각만 갱신)'], ['touch file{1..5}.txt', '파일 5개 한 번에 만들기'], ['touch -d "yesterday" old.log', '수정 시각을 어제로']],
      see: ['stat(1)', 'ls(1)', 'date(1)']
    },
    cp: {
      sec: 1, en: 'copy files and directories', ko: '파일 · 디렉터리 복사',
      syn: ['cp [OPTION]... [-T] SOURCE DEST', 'cp [OPTION]... SOURCE... DIRECTORY', 'cp [OPTION]... -t DIRECTORY SOURCE...'],
      desc: 'SOURCE 를 DEST 로 복사합니다. 마지막 인자가 디렉터리이면 그 안에 같은 이름으로 복사합니다.\n같은 이름의 파일이 있으면 묻지 않고 덮어쓰므로 주의합니다. 디렉터리를 복사하려면 -r 이 필요합니다. 기본적으로 복사본의 소유자는 복사한 사용자, 시각은 현재 시각이 됩니다(보존하려면 -p 또는 -a).',
      opts: [['-r, -R, --recursive', '디렉터리를 하위 내용까지 통째로 복사'], ['-i, --interactive', '덮어쓰기 전에 물어보기'], ['-n, --no-clobber', '이미 있는 파일은 덮어쓰지 않기'], ['-f, --force', '대상 파일을 열 수 없으면 지우고 다시 시도'], ['-u, --update', '원본이 더 새롭거나 대상이 없을 때만 복사'], ['-p', '권한 · 소유자 · 시각 보존'], ['-a, --archive', '-dR --preserve=all 과 같음 (백업용: 링크 · 권한 · 시각 모두 보존)'], ['-v, --verbose', '복사하는 파일 이름 출력'], ['-b, --backup', '덮어쓸 파일의 백업(이름~) 만들기'], ['-s, --symbolic-link', '복사 대신 심볼릭 링크 만들기'], ['-t, --target-directory=DIR', '대상 디렉터리를 먼저 지정']],
      ex: [['cp a.txt b.txt', '파일 복사'], ['cp -r project project.bak', '디렉터리 통째로 복사'], ['cp -a /etc/nginx ~/nginx-backup', '권한 · 시각을 보존하며 백업'], ['sudo cp -i nginx.conf /etc/nginx/', '덮어쓰기 전에 확인']],
      see: ['mv(1)', 'rsync(1)', 'install(1)']
    },
    mv: {
      sec: 1, en: 'move (rename) files', ko: '파일 옮기기 · 이름 바꾸기',
      syn: ['mv [OPTION]... [-T] SOURCE DEST', 'mv [OPTION]... SOURCE... DIRECTORY', 'mv [OPTION]... -t DIRECTORY SOURCE...'],
      desc: 'SOURCE 를 DEST 로 옮기거나 이름을 바꿉니다. 같은 파일 시스템 안에서는 내용 복사 없이 이름만 바뀌므로 매우 빠릅니다.\n디렉터리도 -r 없이 바로 옮길 수 있습니다. 같은 이름이 있으면 묻지 않고 덮어쓰니 -i 를 습관처럼 쓰는 것이 안전합니다.',
      opts: [['-i, --interactive', '덮어쓰기 전에 물어보기'], ['-n, --no-clobber', '이미 있는 파일은 덮어쓰지 않기'], ['-f, --force', '묻지 않고 덮어쓰기'], ['-u, --update', '원본이 더 새로울 때만 옮기기'], ['-v, --verbose', '옮기는 내용 출력'], ['-b, --backup', '덮어쓸 파일의 백업 만들기'], ['-t, --target-directory=DIR', '대상 디렉터리를 먼저 지정']],
      ex: [['mv old.txt new.txt', '이름 바꾸기'], ['mv *.log logs/', '로그 파일들을 logs 디렉터리로 옮기기'], ['mv -i draft.md docs/', '같은 이름이 있으면 물어보기']],
      see: ['cp(1)', 'rename(1)', 'rename(2)']
    },
    rm: {
      sec: 1, en: 'remove files or directories', ko: '파일 · 디렉터리 지우기',
      syn: ['rm [OPTION]... [FILE]...'],
      desc: '파일을 지웁니다. 리눅스 터미널에는 휴지통이 없어서 지운 파일은 되살리기 어렵습니다.\n디렉터리는 -r 이 있어야 지워지고, -f 를 함께 주면 묻지도 경고하지도 않습니다. rm -rf 는 경로를 두 번 확인한 뒤에 사용하세요. / 는 --preserve-root 가 기본이라 지워지지 않습니다.',
      opts: [['-f, --force', '없는 파일은 무시하고, 묻지 않기'], ['-i', '파일마다 지울지 물어보기'], ['-I', '3개가 넘거나 재귀 삭제일 때 한 번만 물어보기'], ['-r, -R, --recursive', '디렉터리와 그 내용을 재귀적으로 지우기'], ['-d, --dir', '빈 디렉터리 지우기'], ['-v, --verbose', '지우는 파일 이름 출력'], ['--preserve-root', "'/' 는 지우지 않기 (기본값)"]],
      ex: [['rm memo.txt', '파일 지우기'], ['rm -i *.bak', '하나씩 확인하며 지우기'], ['rm -r build/', '디렉터리 통째로 지우기'], ['rm -- -file', '이름이 - 로 시작하는 파일 지우기']],
      see: ['rmdir(1)', 'shred(1)', 'unlink(1)']
    },
    ln: {
      sec: 1, en: 'make links between files', ko: '링크 만들기 (하드 링크 · 심볼릭 링크)',
      syn: ['ln [OPTION]... [-T] TARGET LINK_NAME', 'ln [OPTION]... TARGET', 'ln [OPTION]... TARGET... DIRECTORY'],
      desc: '파일에 대한 링크를 만듭니다. 기본은 하드 링크(같은 inode 를 가리키는 또 하나의 이름)이고, -s 를 주면 심볼릭 링크(경로를 담은 바로가기)를 만듭니다.\n하드 링크는 디렉터리나 다른 파일 시스템에는 만들 수 없습니다. 심볼릭 링크의 TARGET 이 상대 경로이면 링크가 있는 위치를 기준으로 해석됩니다.',
      opts: [['-s, --symbolic', '심볼릭 링크 만들기'], ['-f, --force', '같은 이름의 파일이 있으면 지우고 만들기'], ['-n, --no-dereference', 'LINK_NAME 이 디렉터리 링크여도 일반 파일처럼 취급 (-sfn 으로 링크 교체)'], ['-r, --relative', '링크 위치 기준의 상대 경로로 만들기'], ['-i, --interactive', '지우기 전에 물어보기'], ['-v, --verbose', '만든 링크 출력']],
      ex: [['ln -s /var/log/nginx logs', 'logs 라는 심볼릭 링크 만들기'], ['sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/', 'nginx 사이트 활성화'], ['ln data.txt data.hard', '하드 링크 만들기 (ls -li 로 inode 비교)']],
      see: ['link(2)', 'symlink(2)', 'readlink(1)', 'unlink(1)']
    },
    cat: {
      sec: 1, en: 'concatenate files and print on the standard output', ko: '파일 내용 출력 · 이어 붙이기',
      syn: ['cat [OPTION]... [FILE]...'],
      desc: '파일들의 내용을 차례로 표준 출력에 씁니다. 파일이 없거나 - 이면 표준 입력을 읽습니다.\n짧은 파일을 볼 때 쓰고, 긴 파일은 less 로 봅니다. cat a b > c 처럼 여러 파일을 하나로 합칠 수도 있습니다.',
      opts: [['-n, --number', '모든 줄에 번호 붙이기'], ['-b, --number-nonblank', '빈 줄이 아닌 줄에만 번호 붙이기'], ['-s, --squeeze-blank', '연속된 빈 줄을 하나로'], ['-A, --show-all', '-vET 와 같음 (보이지 않는 문자까지 표시)'], ['-E, --show-ends', '줄 끝에 $ 표시'], ['-T, --show-tabs', '탭을 ^I 로 표시']],
      ex: [['cat /etc/os-release', '운영체제 정보 보기'], ['cat -n script.sh', '줄 번호와 함께 보기'], ['cat part1 part2 > all.txt', '두 파일을 합쳐 저장'], ["cat > memo.txt", '키보드로 입력한 내용을 파일로 (Ctrl+D 로 끝)']],
      see: ['tac(1)', 'less(1)', 'head(1)', 'tail(1)']
    },
    less: {
      sec: 1, en: 'opposite of more', ko: '긴 파일을 한 화면씩 보기 (페이저)',
      syn: ['less [OPTION]... [FILE]...', 'COMMAND | less'],
      desc: '파일이나 명령 출력을 한 화면씩 보여 주는 페이저입니다. more 와 달리 앞뒤로 자유롭게 움직일 수 있고, 파일 전체를 먼저 읽지 않아 큰 로그도 빨리 엽니다.\nman 페이지도 기본적으로 less 로 보여 줍니다. q 를 누르면 끝납니다.',
      sects: [['COMMANDS', [['Space, f', '다음 화면'], ['b', '이전 화면'], ['j, k, ↓, ↑', '한 줄 아래 / 위'], ['g, G', '맨 처음 / 맨 끝으로'], ['/패턴', '아래로 검색 (?패턴 은 위로)'], ['n, N', '다음 / 이전 검색 결과'], ['F', '파일 끝을 계속 따라가기 (tail -f 처럼, Ctrl+C 로 멈춤)'], ['h', '도움말'], ['q', '끝내기']]]],
      opts: [['-N, --LINE-NUMBERS', '줄 번호 표시'], ['-S, --chop-long-lines', '긴 줄을 접지 않고 자르기 (좌우 화살표로 이동)'], ['-i, --ignore-case', '검색할 때 대소문자 무시 (패턴에 대문자가 있으면 구분)'], ['-R, --RAW-CONTROL-CHARS', 'ANSI 색상 코드를 그대로 색으로 표시'], ['-F, --quit-if-one-screen', '한 화면에 다 들어오면 바로 끝내기'], ['-X, --no-init', '끝낸 뒤에도 화면 내용 남기기'], ['+F', '열자마자 F (따라가기) 모드'], ['+G', '열자마자 파일 끝으로']],
      ex: [['less /var/log/syslog', '시스템 로그 보기'], ['journalctl | less', '명령 출력을 페이지 단위로'], ['less -N +G app.log', '줄 번호를 켜고 끝에서부터 보기']],
      see: ['more(1)', 'most(1)', 'lesskey(1)']
    },
    more: {
      sec: 1, en: 'display the contents of a file in a terminal', ko: '파일을 한 화면씩 보기',
      syn: ['more [options] file...'],
      desc: '파일을 한 화면씩 보여 주는 오래된 페이저입니다. 기본적으로 앞으로만 넘어가며, 끝까지 보면 자동으로 끝납니다. 더 편리한 less 를 권장합니다.',
      sects: [['COMMANDS', [['Space', '다음 화면'], ['Enter', '다음 한 줄'], ['b', '이전 화면 (파일일 때만)'], ['/패턴', '검색'], ['q', '끝내기']]]],
      opts: [['-d, --silent', '"[Press space to continue, \'q\' to quit.]" 안내 보이기'], ['-s, --squeeze', '연속된 빈 줄을 하나로'], ['-n, --lines NUMBER', '한 화면의 줄 수'], ['+NUMBER', 'NUMBER 번째 줄부터 보기'], ['+/STRING', 'STRING 이 처음 나오는 곳부터 보기']],
      ex: [['more /etc/services', '한 화면씩 보기'], ['ls -l /usr/bin | more', '긴 출력을 나눠 보기']],
      see: ['less(1)', 'vim(1)']
    },
    head: {
      sec: 1, en: 'output the first part of files', ko: '파일 앞부분 보기',
      syn: ['head [OPTION]... [FILE]...'],
      desc: '각 파일의 앞 10줄을 출력합니다. 파일이 여러 개이면 ==> 이름 <== 머리말을 붙입니다. 파이프 뒤에 붙여 출력의 앞부분만 볼 때도 많이 씁니다.',
      opts: [['-n, --lines=[-]NUM', '앞 NUM 줄 출력 (-NUM 이면 끝 NUM 줄을 뺀 나머지)'], ['-c, --bytes=[-]NUM', '앞 NUM 바이트 출력'], ['-q, --quiet', '파일 이름 머리말을 붙이지 않기'], ['-v, --verbose', '항상 파일 이름 머리말 붙이기']],
      ex: [['head /etc/passwd', '앞 10줄'], ['head -n 3 data.csv', '앞 3줄 (head -3 도 같음)'], ['ps aux --sort=-%mem | head -5', '메모리를 많이 쓰는 프로세스 상위 4개 (+머리줄)']],
      see: ['tail(1)', 'sed(1)']
    },
    tail: {
      sec: 1, en: 'output the last part of files', ko: '파일 뒷부분 보기 (실시간 로그 확인)',
      syn: ['tail [OPTION]... [FILE]...'],
      desc: '각 파일의 마지막 10줄을 출력합니다. -f 를 주면 파일에 새로 추가되는 줄을 계속 보여 주어, 로그를 실시간으로 볼 때 아주 많이 씁니다(Ctrl+C 로 끝냄).',
      opts: [['-n, --lines=[+]NUM', '끝 NUM 줄 출력 (+NUM 이면 NUM 번째 줄부터 끝까지)'], ['-c, --bytes=[+]NUM', '끝 NUM 바이트 출력'], ['-f, --follow', '파일 끝을 계속 따라가며 새 내용 출력'], ['-F', '--follow=name --retry 와 같음 (로그 회전으로 파일이 바뀌어도 계속 따라감)'], ['--pid=PID', '-f 와 함께: 해당 프로세스가 끝나면 멈추기'], ['-q, --quiet', '파일 이름 머리말 생략'], ['-s, --sleep-interval=N', '-f 에서 확인 간격(초)']],
      ex: [['tail /var/log/syslog', '마지막 10줄'], ['tail -n 50 app.log', '마지막 50줄'], ['sudo tail -f /var/log/nginx/access.log', '접속 로그 실시간 보기'], ['tail -n +2 data.csv', '첫 줄(머리글)을 뺀 나머지']],
      see: ['head(1)', 'less(1)', 'journalctl(1)']
    },
    wc: {
      sec: 1, en: 'print newline, word, and byte counts for each file', ko: '줄 · 단어 · 바이트 수 세기',
      syn: ['wc [OPTION]... [FILE]...', 'wc [OPTION]... --files0-from=F'],
      desc: '각 파일의 줄 수, 단어 수, 바이트 수를 순서대로 출력합니다. 파일이 여러 개이면 마지막에 합계(total)를 붙입니다. 파이프와 함께 "몇 개인지" 셀 때 많이 씁니다.',
      opts: [['-l, --lines', '줄(개행 문자) 수만'], ['-w, --words', '단어 수만'], ['-c, --bytes', '바이트 수만'], ['-m, --chars', '문자 수만 (한글 1글자 = 1)'], ['-L, --max-line-length', '가장 긴 줄의 길이']],
      ex: [['wc -l /etc/passwd', '계정 수(줄 수) 세기'], ['ls /usr/bin | wc -l', '/usr/bin 의 파일 개수'], ['grep -r TODO src | wc -l', 'TODO 가 있는 줄 수']],
      see: ['grep(1)', 'cut(1)']
    },
    grep: {
      sec: 1, names: 'grep, egrep, fgrep', en: 'print lines that match patterns', ko: '패턴과 일치하는 줄 찾기',
      syn: ['grep [OPTION...] PATTERNS [FILE...]', 'grep [OPTION...] -e PATTERNS ... [FILE...]', 'grep [OPTION...] -f PATTERN_FILE ... [FILE...]'],
      desc: '파일(또는 표준 입력)에서 PATTERNS 와 일치하는 줄을 찾아 출력합니다. 패턴은 기본적으로 기본 정규 표현식(BRE)이며, -E 로 확장 정규 표현식을 씁니다.\n종료 코드는 찾으면 0, 못 찾으면 1, 오류면 2 입니다. egrep, fgrep 은 grep -E, grep -F 의 옛 이름으로, 쓰면 경고가 나옵니다.',
      opts: [['-i, --ignore-case', '대소문자 구분 안 함'], ['-v, --invert-match', '일치하지 않는 줄 출력'], ['-n, --line-number', '줄 번호 함께 출력'], ['-c, --count', '일치하는 줄의 개수만 출력'], ['-r, --recursive', '디렉터리 안의 파일을 재귀적으로 검색 (-R 은 링크도 따라감)'], ['-l, --files-with-matches', '일치하는 줄이 있는 파일 이름만 출력'], ['-w, --word-regexp', '단어 전체가 일치할 때만'], ['-o, --only-matching', '일치한 부분만 출력'], ['-E, --extended-regexp', '확장 정규식 (| + ? () {} 를 그대로 사용)'], ['-F, --fixed-strings', '패턴을 정규식이 아닌 고정 문자열로'], ['-A NUM, -B NUM, -C NUM', '일치한 줄의 뒤(After) / 앞(Before) / 앞뒤(Context) NUM 줄도 출력'], ['-q, --quiet', '출력 없이 종료 코드만 (스크립트용)'], ['--color=auto', '일치한 부분을 색으로 강조 (Ubuntu 기본 별명)']],
      ex: [['grep root /etc/passwd', 'root 가 들어간 줄'], ['grep -rn "listen" /etc/nginx/', 'nginx 설정에서 listen 을 줄 번호와 함께 찾기'], ["grep -v '^#' /etc/ssh/sshd_config | grep -v '^$'", '주석과 빈 줄을 뺀 실제 설정만'], ['ps aux | grep -i nginx', 'nginx 프로세스 찾기'], ["grep -E 'error|fail' app.log", 'error 또는 fail 이 있는 줄']],
      see: ['sed(1)', 'awk(1)', 'find(1)', 'regex(7)']
    },
    sed: {
      sec: 1, en: 'stream editor for filtering and transforming text', ko: '스트림 편집기 (찾아 바꾸기 · 줄 편집)',
      syn: ['sed [OPTION]... {script-only-if-no-other-script} [input-file]...'],
      desc: '입력을 한 줄씩 읽어 스크립트대로 고친 뒤 출력합니다. 원본 파일은 바뀌지 않고, -i 를 줘야 파일 자체를 수정합니다.\n가장 많이 쓰는 명령은 s/찾을것/바꿀것/g (치환), d (줄 삭제), p (줄 출력) 입니다. 주소로 줄 번호(3), 범위(2,5), 패턴(/^#/)을 지정할 수 있습니다.',
      opts: [['-n, --quiet, --silent', '자동 출력을 끄고 p 로 지정한 줄만 출력'], ['-e script', '실행할 스크립트 추가 (여러 개 가능)'], ['-f script-file', '파일에서 스크립트 읽기'], ['-i[SUFFIX], --in-place[=SUFFIX]', '파일을 직접 수정 (SUFFIX 를 주면 백업 파일 생성, 예: -i.bak)'], ['-E, -r, --regexp-extended', '확장 정규식 사용'], ['-s, --separate', '여러 파일을 하나로 잇지 않고 따로 처리']],
      sects: [['COMMANDS', [['s/RE/TEXT/FLAGS', '치환. g=모두, i=대소문자 무시, 숫자=N번째만'], ['d', '줄 삭제'], ['p', '줄 출력 (-n 과 함께)'], ['a TEXT, i TEXT', '줄 뒤(append) / 앞(insert)에 TEXT 추가'], ['c TEXT', '줄을 TEXT 로 바꾸기'], ['q', '끝내기']]]],
      ex: [["sed 's/foo/bar/g' in.txt", 'foo 를 모두 bar 로 바꿔 출력'], ["sudo sed -i 's/^#Port 22/Port 2222/' /etc/ssh/sshd_config", '설정 파일 직접 수정'], ["sed -n '10,20p' file", '10~20번째 줄만 보기'], ["sed '/^#/d; /^$/d' conf", '주석과 빈 줄 지우기']],
      see: ['awk(1)', 'grep(1)', 'tr(1)', 'regex(7)']
    },
    awk: {
      sec: 1, names: 'mawk', en: 'pattern scanning and text processing language', ko: '필드(열) 단위 텍스트 처리 언어',
      syn: ["awk [-W option] [-F value] [-v var=value] [--] 'program text' [file ...]", 'awk [-W option] [-F value] [-v var=value] [-f program-file] [--] [file ...]'],
      desc: "입력을 줄(레코드) 단위로 읽어 공백으로 나눈 필드($1, $2 ...)에 대해 '패턴 { 동작 }' 프로그램을 실행합니다. Ubuntu 기본 awk 는 mawk 이며, gawk 를 설치하면 바뀝니다.\n$0 은 줄 전체, NF 는 필드 개수, NR 은 줄 번호입니다. BEGIN { } 은 시작 전, END { } 는 끝난 뒤 한 번 실행됩니다.",
      opts: [['-F value', '필드 구분자 지정 (예: -F: 는 콜론)'], ['-v var=value', '프로그램 시작 전에 변수 지정'], ['-f file', '프로그램을 파일에서 읽기'], ['--', '옵션의 끝']],
      ex: [["awk -F: '{print $1}' /etc/passwd", '사용자 이름만 출력'], ["awk -F: '$3 >= 1000 {print $1, $3}' /etc/passwd", 'UID 1000 이상(일반 사용자)'], ["df -h | awk 'NR>1 {print $5, $6}'", '사용률과 마운트 위치'], ["awk '{s+=$1} END {print s}' nums.txt", '첫 열의 합계']],
      see: ['gawk(1)', 'sed(1)', 'cut(1)']
    },
    sort: {
      sec: 1, en: 'sort lines of text files', ko: '줄 정렬',
      syn: ['sort [OPTION]... [FILE]...', 'sort [OPTION]... --files0-from=F'],
      desc: '모든 파일의 줄을 합쳐 정렬해 출력합니다. 기본은 문자열(사전)순이라 10 이 9 보다 앞에 옵니다. 숫자는 -n, 크기(1K, 2G)는 -h 로 정렬합니다. uniq 전에 sort 를 해야 중복이 제대로 합쳐집니다.',
      opts: [['-n, --numeric-sort', '숫자 크기로 정렬'], ['-h, --human-numeric-sort', '2K, 1G 같은 사람 읽기용 크기로 정렬'], ['-r, --reverse', '역순 (큰 것부터)'], ['-k, --key=KEYDEF', '정렬할 필드 지정 (예: -k2 , -k3,3n)'], ['-t, --field-separator=SEP', '필드 구분자 (기본은 공백)'], ['-u, --unique', '같은 줄은 하나만 출력'], ['-f, --ignore-case', '대소문자 무시'], ['-V, --version-sort', '버전 번호(1.2.10 > 1.2.9) 순서'], ['-M, --month-sort', '월 이름(JAN < ... < DEC) 순서'], ['-o, --output=FILE', '결과를 FILE 에 쓰기 (입력 파일과 같아도 됨)']],
      ex: [['sort names.txt', '사전순 정렬'], ['sort -t: -k3 -n /etc/passwd', 'UID 순으로 정렬'], ['du -sh * | sort -h', '크기 순으로'], ['sort data | uniq -c | sort -rn', '많이 나온 순서로 개수 세기']],
      see: ['uniq(1)', 'shuf(1)', 'comm(1)']
    },
    uniq: {
      sec: 1, en: 'report or omit repeated lines', ko: '연속된 중복 줄 합치기',
      syn: ['uniq [OPTION]... [INPUT [OUTPUT]]'],
      desc: '바로 붙어 있는 같은 줄을 하나로 합칩니다. 떨어져 있는 중복은 합치지 않으므로 보통 sort 로 먼저 정렬한 뒤 씁니다.',
      opts: [['-c, --count', '줄 앞에 나온 횟수 붙이기'], ['-d, --repeated', '중복된 줄만 (한 번씩) 출력'], ['-u, --unique', '한 번만 나온 줄만 출력'], ['-i, --ignore-case', '대소문자 무시'], ['-f, --skip-fields=N', '앞의 N 개 필드는 비교하지 않기']],
      ex: [['sort list | uniq', '중복 없애기 (sort -u 와 같음)'], ["awk '{print $1}' access.log | sort | uniq -c | sort -rn | head", '접속이 많은 IP 상위 10개']],
      see: ['sort(1)', 'comm(1)']
    },
    cut: {
      sec: 1, en: 'remove sections from each line of files', ko: '줄에서 필드 · 문자 잘라내기',
      syn: ['cut OPTION... [FILE]...'],
      desc: '각 줄에서 지정한 필드(-f), 문자(-c), 바이트(-b)만 골라 출력합니다. 구분자는 기본이 탭이므로, 콜론이나 쉼표로 나뉜 데이터는 -d 로 지정합니다. 구분자는 한 글자만 쓸 수 있습니다.',
      opts: [['-f, --fields=LIST', '필드 선택 (1 / 1,3 / 2-4 / 3-)'], ['-d, --delimiter=DELIM', '필드 구분자 (기본 탭)'], ['-c, --characters=LIST', '문자 위치로 선택'], ['-b, --bytes=LIST', '바이트 위치로 선택'], ['-s, --only-delimited', '구분자가 없는 줄은 출력하지 않기'], ['--complement', '선택한 것을 빼고 나머지 출력'], ['--output-delimiter=STRING', '출력할 때 쓸 구분자']],
      ex: [['cut -d: -f1 /etc/passwd', '사용자 이름만'], ['cut -d: -f1,7 /etc/passwd', '이름과 로그인 셸'], ['cut -c1-10 file', '각 줄의 앞 10글자'], ['cut -d, -f2 data.csv', 'CSV 의 두 번째 열']],
      see: ['awk(1)', 'paste(1)', 'join(1)']
    },
    tr: {
      sec: 1, en: 'translate or delete characters', ko: '문자 바꾸기 · 지우기',
      syn: ['tr [OPTION]... STRING1 [STRING2]'],
      desc: '표준 입력의 문자를 STRING1 에서 STRING2 로 한 글자씩 대응시켜 바꾸거나(-d 로) 지웁니다. 파일 이름을 인자로 받지 않으므로 파이프나 < 로 입력을 줍니다. [:upper:], [:lower:], [:digit:], [:space:] 같은 문자 클래스와 a-z 범위를 쓸 수 있습니다.',
      opts: [['-d, --delete', 'STRING1 의 문자 지우기'], ['-s, --squeeze-repeats', '연속으로 반복되는 문자를 하나로'], ['-c, -C, --complement', 'STRING1 에 없는 문자들을 대상으로'], ['-t, --truncate-set1', 'STRING1 을 STRING2 길이로 자르기']],
      ex: [["echo hello | tr a-z A-Z", '대문자로: HELLO'], ["tr -d '\\r' < win.txt > unix.txt", '윈도우 줄바꿈(CR) 지우기'], ["echo 'a   b    c' | tr -s ' '", '연속 공백을 하나로'], ["tr ':' '\\n' <<< \"$PATH\"", 'PATH 를 한 줄에 하나씩']],
      see: ['sed(1)', 'dos2unix(1)']
    },
    tee: {
      sec: 1, en: 'read from standard input and write to standard output and files', ko: '출력을 화면과 파일에 동시에',
      syn: ['tee [OPTION]... [FILE]...'],
      desc: '표준 입력을 읽어 화면(표준 출력)과 파일에 동시에 씁니다. 결과를 보면서 저장할 때, 또는 sudo 권한으로 파일에 쓸 때(sudo tee) 많이 씁니다. "sudo echo x > /etc/파일" 은 리다이렉션이 일반 사용자 권한으로 되어 실패합니다.',
      opts: [['-a, --append', '덮어쓰지 않고 파일 끝에 추가'], ['-i, --ignore-interrupts', '인터럽트(Ctrl+C) 시그널 무시'], ['-p', '파이프 쓰기 오류 진단 방식 지정']],
      ex: [['ls -l | tee list.txt', '보면서 저장'], ["echo '127.0.0.1 myapp' | sudo tee -a /etc/hosts", 'root 소유 파일에 한 줄 추가'], ['make 2>&1 | tee build.log', '오류 출력까지 저장']],
      see: ['cat(1)', 'script(1)']
    },
    xargs: {
      sec: 1, en: 'build and execute command lines from standard input', ko: '표준 입력을 명령의 인자로 넘기기',
      syn: ['xargs [options] [command [initial-arguments]]'],
      desc: '표준 입력에서 공백·줄바꿈으로 나뉜 항목을 읽어 COMMAND 의 인자로 붙여 실행합니다(명령을 안 주면 echo). find 결과를 다른 명령에 넘길 때 많이 씁니다. 파일 이름에 공백이 있을 수 있으면 find -print0 과 xargs -0 을 함께 씁니다.',
      opts: [['-0, --null', '항목을 널 문자로 구분 (find -print0 과 짝)'], ['-n max-args', '한 번 실행할 때 넘길 최대 인자 수'], ['-I replace-str', '입력 한 줄마다 실행하며 replace-str(보통 {})을 그 값으로 바꾸기'], ['-d delim', '항목 구분자 지정'], ['-p, --interactive', '실행 전에 물어보기'], ['-t, --verbose', '실행할 명령을 먼저 출력'], ['-r, --no-run-if-empty', '입력이 없으면 실행하지 않기'], ['-P max-procs', '동시에 실행할 프로세스 수']],
      ex: [["find . -name '*.tmp' -print0 | xargs -0 rm -f", '.tmp 파일 모두 지우기'], ["cat hosts.txt | xargs -n1 ping -c1", '호스트마다 ping 한 번씩'], ["ls *.jpg | xargs -I {} cp {} backup/", '파일마다 복사']],
      see: ['find(1)', 'parallel(1)']
    },
    find: {
      sec: 1, en: 'search for files in a directory hierarchy', ko: '조건으로 파일 찾기',
      syn: ['find [-H] [-L] [-P] [-D debugopts] [-Olevel] [starting-point...] [expression]'],
      desc: '시작 위치(생략하면 현재 디렉터리) 아래를 재귀적으로 돌며 조건(식)에 맞는 파일을 찾습니다. 조건 여러 개는 AND 로 묶이며, -o 는 OR, ! 는 NOT 입니다.\n찾은 파일에 -exec 로 명령을 실행하거나 -delete 로 지울 수 있습니다. 권한이 없는 디렉터리는 "Permission denied" 가 나오므로 2>/dev/null 로 숨기거나 sudo 를 씁니다.',
      opts: [['-name PATTERN', '이름으로 찾기 (와일드카드는 따옴표로 감싸기: -name "*.log")'], ['-iname PATTERN', '대소문자 무시하고 이름으로'], ['-type c', '종류: f 일반 파일, d 디렉터리, l 심볼릭 링크'], ['-size [+-]N[ckMG]', '크기 (+100M = 100MiB 초과)'], ['-mtime [+-]N', '수정한 지 N 일 (-7 = 7일 이내, +30 = 30일 넘음)'], ['-mmin [+-]N', '수정한 지 N 분'], ['-user NAME, -group NAME', '소유자 / 그룹으로'], ['-perm MODE', '권한으로 (-perm -4000 은 SUID 가 있는 파일)'], ['-maxdepth N', '최대 N 단계 깊이까지만'], ['-empty', '빈 파일 · 빈 디렉터리'], ['-exec CMD {} \\;', '찾은 파일마다 CMD 실행 ({} 는 파일 이름, + 로 끝내면 한꺼번에)'], ['-delete', '찾은 파일 지우기 (조심!)'], ['-print0', '널 문자로 구분해 출력 (xargs -0 용)']],
      ex: [["find /etc -name '*.conf'", '/etc 에서 .conf 파일'], ['find ~ -type f -size +100M', '100MiB 가 넘는 파일'], ["find /var/log -name '*.gz' -mtime +30 -delete", '30일 지난 압축 로그 지우기'], ['sudo find / -perm -4000 -type f 2>/dev/null', 'SUID 파일 찾기'], ["find . -type f -name '*.sh' -exec chmod +x {} +", '스크립트에 실행 권한 주기']],
      see: ['locate(1)', 'xargs(1)', 'grep(1)', 'stat(1)']
    },
    which: {
      sec: 1, en: 'locate a command', ko: '명령 실행 파일의 위치 찾기',
      syn: ['which [-a] filename ...'],
      desc: 'PATH 환경 변수의 디렉터리를 차례로 찾아, 명령을 실행하면 어떤 파일이 실행될지 경로를 출력합니다. 별명이나 셸 내장 명령은 알려 주지 않으므로 그때는 type 을 씁니다.',
      opts: [['-a', '처음 찾은 것 하나가 아니라 PATH 에서 찾은 모든 경로 출력'], ['-s', '출력 없이 종료 코드만']],
      ex: [['which python3', '예: /usr/bin/python3'], ['which -a ls', 'PATH 에 있는 모든 ls']],
      see: ['type', 'whereis(1)', 'command']
    },
    whereis: {
      sec: 1, en: 'locate the binary, source, and manual page files for a command', ko: '명령의 실행 파일 · 매뉴얼 위치 찾기',
      syn: ['whereis [options] [-BMS directory... -f] name...'],
      desc: '정해진 표준 위치(/usr/bin, /usr/share/man 등)에서 명령의 실행 파일, 소스, man 페이지를 찾아 한 줄로 보여 줍니다. PATH 가 아니라 고정된 목록을 찾는다는 점이 which 와 다릅니다.',
      opts: [['-b', '실행 파일만 찾기'], ['-m', '매뉴얼 페이지만 찾기'], ['-s', '소스만 찾기'], ['-u', '종류별로 딱 하나가 아닌(이상한) 것만'], ['-l', '찾는 디렉터리 목록 보기']],
      ex: [['whereis ls', 'ls: /usr/bin/ls /usr/share/man/man1/ls.1.gz'], ['whereis -b nginx', '실행 파일 위치만']],
      see: ['which(1)', 'find(1)', 'locate(1)']
    },
    file: {
      sec: 1, en: 'determine file type', ko: '파일 종류 알아내기',
      syn: ['file [-bcdEhiklLNnprsSvzZ0] [--apple] [--extension] [--mime-encoding] [--mime-type] [-e testname] [-F separator] [-f namefile] [-m magicfiles] [-P name=value] file ...'],
      desc: '파일의 확장자가 아니라 실제 내용(매직 넘버)을 검사해 종류를 알려 줍니다. 리눅스에서는 확장자가 필수가 아니므로 모르는 파일을 열기 전에 확인하기 좋습니다.',
      opts: [['-b, --brief', '파일 이름 없이 종류만 출력'], ['-i, --mime', 'MIME 형식으로 (text/plain; charset=utf-8)'], ['-L, --dereference', '심볼릭 링크를 따라가서 검사'], ['-z, --uncompress', '압축 파일 안쪽까지 검사'], ['-s, --special-files', '장치 파일도 내용을 읽어 검사']],
      ex: [['file /bin/ls', 'ELF 64-bit LSB pie executable ...'], ['file *', '현재 디렉터리의 모든 파일 종류'], ['file -i notes.txt', '문자 인코딩 확인']],
      see: ['magic(5)', 'stat(1)']
    },
    stat: {
      sec: 1, en: 'display file or file system status', ko: '파일 상세 정보(inode, 권한, 시각) 보기',
      syn: ['stat [OPTION]... FILE...'],
      desc: '파일의 크기, 블록 수, inode 번호, 링크 수, 권한(8진수와 문자), 소유자, 그리고 접근(Access)·수정(Modify)·변경(Change)·생성(Birth) 시각을 자세히 보여 줍니다.',
      opts: [['-c, --format=FORMAT', '원하는 항목만 형식대로 출력'], ['-f, --file-system', '파일 대신 파일 시스템 정보'], ['-L, --dereference', '심볼릭 링크를 따라가기'], ['-t, --terse', '한 줄 간단 형식'], ['--printf=FORMAT', '-c 와 비슷하나 \\n 등 이스케이프 해석, 줄바꿈 자동 안 붙음']],
      sects: [['FORMAT', [['%a / %A', '8진수 권한 (644) / 문자 권한 (-rw-r--r--)'], ['%U / %G', '소유자 / 그룹 이름'], ['%s', '크기(바이트)'], ['%i', 'inode 번호'], ['%y', '마지막 수정 시각'], ['%n', '파일 이름']]]],
      ex: [['stat /etc/passwd', '상세 정보'], ["stat -c '%a %U:%G %n' /etc/shadow", '예: 640 root:shadow /etc/shadow']],
      see: ['ls(1)', 'stat(2)', 'touch(1)']
    },
    du: {
      sec: 1, en: 'estimate file space usage', ko: '디렉터리 · 파일의 디스크 사용량',
      syn: ['du [OPTION]... [FILE]...', 'du [OPTION]... --files0-from=F'],
      desc: '파일과 디렉터리(하위 포함)가 디스크를 얼마나 차지하는지 보여 줍니다. 기본 단위는 1K 블록이며 모든 하위 디렉터리를 출력합니다. 어떤 폴더가 공간을 많이 쓰는지 찾을 때 -sh 와 sort -h 를 함께 씁니다.',
      opts: [['-h, --human-readable', '크기를 1K, 234M, 2G 형식으로'], ['-s, --summarize', '인자마다 합계만'], ['-a, --all', '디렉터리뿐 아니라 파일도 출력'], ['-c, --total', '마지막에 전체 합계'], ['-d, --max-depth=N', 'N 단계 깊이까지만 출력'], ['-x, --one-file-system', '다른 파일 시스템은 건너뛰기'], ['--exclude=PATTERN', '패턴에 맞는 파일 제외'], ['--apparent-size', '디스크 사용량 대신 실제 파일 크기']],
      ex: [['du -sh ~', '홈 디렉터리 전체 크기'], ['sudo du -h --max-depth=1 /var | sort -h', '/var 아래 폴더별 크기 순'], ['du -sh * .[!.]*', '현재 위치의 항목별 크기 (숨김 포함)']],
      see: ['df(1)', 'ncdu(1)']
    },
    df: {
      sec: 1, en: 'report file system space usage', ko: '파일 시스템(디스크) 남은 공간 보기',
      syn: ['df [OPTION]... [FILE]...'],
      desc: '마운트된 파일 시스템마다 전체 크기, 사용량, 남은 공간, 사용률(Use%), 마운트 위치를 보여 줍니다. FILE 을 주면 그 파일이 있는 파일 시스템만 보여 줍니다. 디스크가 꽉 찼는지 확인할 때 가장 먼저 씁니다.',
      opts: [['-h, --human-readable', '1024 단위로 읽기 쉽게 (G, M)'], ['-H, --si', '1000 단위로'], ['-T, --print-type', '파일 시스템 종류(ext4, tmpfs ...) 표시'], ['-i, --inodes', '블록 대신 inode 사용량'], ['-t, --type=TYPE', '해당 종류만'], ['-x, --exclude-type=TYPE', '해당 종류 제외 (예: -x tmpfs)'], ['-a, --all', '가상 파일 시스템까지 모두'], ['--total', '합계 줄 추가']],
      ex: [['df -h', '전체 디스크 사용량'], ['df -hT /', '루트 파일 시스템 종류와 사용량'], ['df -i', 'inode 가 부족한지 확인']],
      see: ['du(1)', 'lsblk(8)', 'mount(8)']
    }
  });

  Object.assign(MAN, {
    free: {
      sec: 1, en: 'Display amount of free and used memory in the system', ko: '메모리 사용량 보기',
      syn: ['free [options]'],
      desc: '전체 메모리(Mem)와 스왑(Swap)의 total, used, free, shared, buff/cache, available 을 보여 줍니다. 리눅스는 남는 메모리를 디스크 캐시로 쓰므로 free 가 작아도 정상이며, 실제로 새 프로그램이 쓸 수 있는 양은 available 을 봅니다. 값은 /proc/meminfo 에서 읽습니다.',
      opts: [['-h, --human', '단위를 자동으로 (Gi, Mi)'], ['-b, -k, -m, -g', '바이트 / KiB(기본) / MiB / GiB 단위'], ['--si', '1024 대신 1000 단위'], ['-w, --wide', 'buffers 와 cache 를 나눠 보기'], ['-t, --total', '메모리 + 스왑 합계 줄 추가'], ['-s, --seconds N', 'N 초마다 계속 출력'], ['-c, --count N', 'N 번 출력하고 끝내기']],
      ex: [['free -h', '읽기 쉬운 단위로'], ['free -m -s 2', '2초마다 MiB 단위로 계속 보기']],
      see: ['top(1)', 'vmstat(8)', 'proc(5)']
    },
    top: {
      sec: 1, en: 'display Linux processes', ko: '실시간 프로세스 · 자원 모니터',
      syn: ['top -hv|-bcEeHiOSs1 -d secs -n max -u|U user -p pids -o field -w [cols]'],
      desc: '시스템 요약(가동 시간, 부하 평균, 작업 수, CPU·메모리 사용률)과 프로세스 목록을 3초마다 새로 고쳐 보여 줍니다. 기본은 CPU 사용률 순이며, 실행 중에 키를 눌러 정렬·필터를 바꿀 수 있습니다. q 로 끝냅니다.',
      sects: [['INTERACTIVE COMMANDS', [['q', '끝내기'], ['h', '도움말'], ['P / M / T / N', 'CPU / 메모리 / 누적 시간 / PID 순으로 정렬'], ['k', '프로세스에 시그널 보내기 (kill)'], ['r', '우선순위 바꾸기 (renice)'], ['u', '특정 사용자의 프로세스만'], ['1', 'CPU 코어별로 보기'], ['c', '명령 전체 경로 · 인자 보기'], ['Space', '바로 새로 고침']]]],
      opts: [['-d secs', '새로 고침 간격(초)'], ['-n max', 'max 번 새로 고친 뒤 끝내기'], ['-b', '배치 모드 (파일로 저장하거나 파이프로 넘길 때)'], ['-u user', '해당 사용자의 프로세스만'], ['-p pid,...', '지정한 PID 만'], ['-o field', '정렬 기준 (예: -o %MEM)'], ['-H', '스레드 단위로 보기'], ['-c', '명령 이름 대신 전체 명령줄']],
      ex: [['top', '실행 (q 로 끝)'], ['top -u www-data', 'www-data 사용자의 프로세스만'], ['top -b -n 1 | head -15', '한 번만 찍어 앞부분 보기']],
      see: ['htop(1)', 'ps(1)', 'free(1)', 'uptime(1)', 'kill(1)']
    },
    htop: {
      sec: 1, en: 'interactive process viewer', ko: '대화형 프로세스 뷰어 (top 의 개선판)',
      syn: ['htop [-dCFhpustv]'],
      desc: 'top 과 비슷하지만 CPU 코어별·메모리 막대 그래프, 마우스 · 화살표 키 선택, 트리 보기, 검색 등을 제공합니다. 아래쪽의 F1~F10 기능 키로 조작합니다. Ubuntu 24.04 Server 에는 기본 설치되어 있습니다.',
      sects: [['INTERACTIVE COMMANDS', [['F1, h', '도움말'], ['F2, S', '설정'], ['F3, /', '이름으로 검색'], ['F4, \\', '필터 (일치하는 프로세스만)'], ['F5, t', '트리(부모-자식) 보기'], ['F6, < >', '정렬 기준 선택'], ['F9, k', '선택한 프로세스에 시그널 보내기'], ['F10, q', '끝내기'], ['Space', '프로세스 표시(태그)'], ['u', '사용자 선택']]]],
      opts: [['-d, --delay=DELAY', '새로 고침 간격 (0.1초 단위, -d 10 = 1초)'], ['-u, --user[=USER]', '해당 사용자의 프로세스만'], ['-p, --pid=PID,...', '지정한 PID 만'], ['-t, --tree', '트리 보기로 시작'], ['-s, --sort-key=COLUMN', '정렬 기준 (예: PERCENT_MEM)'], ['-C, --no-color', '흑백으로']],
      ex: [['htop', '실행'], ['htop -u student -t', 'student 의 프로세스를 트리로']],
      see: ['top(1)', 'ps(1)', 'kill(1)']
    },
    ps: {
      sec: 1, en: 'report a snapshot of the current processes.', ko: '현재 프로세스 목록 보기',
      syn: ['ps [options]'],
      desc: '실행 중인 프로세스를 한 번 찍어 보여 줍니다(계속 보려면 top). 옵션 없이 쓰면 현재 터미널의 내 프로세스만 나옵니다.\nps 는 세 가지 옵션 형식을 받습니다: 유닉스(-ef, 대시 있음), BSD(aux, 대시 없음), GNU(--sort, 긴 옵션). 모든 프로세스를 볼 때는 ps aux 나 ps -ef 를 가장 많이 씁니다.',
      opts: [['-e, -A', '모든 프로세스'], ['-f', '전체 형식 (UID, PPID, 시작 시각, 명령줄)'], ['aux', 'BSD 형식: 모든 사용자(a)의 사용자 중심 형식(u), 터미널 없는 프로세스(x) 포함'], ['-u user', '해당 사용자의 프로세스'], ['-p pid', '해당 PID'], ['-C cmdname', '명령 이름으로 선택'], ['-o format', '보여 줄 열 지정 (pid,ppid,user,%cpu,%mem,cmd ...)'], ['--sort=[-]key', '정렬 (예: --sort=-%mem 은 메모리 큰 순)'], ['--forest, f', '부모-자식 관계를 트리로'], ['-L', '스레드도 보기']],
      sects: [['PROCESS STATE CODES', [['R', '실행 중 또는 실행 대기'], ['S', '잠든 상태 (이벤트 대기)'], ['D', '깨울 수 없는 대기 (보통 I/O)'], ['T', '멈춤 (Ctrl+Z 등)'], ['Z', '좀비 (끝났지만 부모가 회수하지 않음)']]]],
      ex: [['ps aux', '모든 프로세스'], ['ps -ef | grep nginx', 'nginx 프로세스 찾기'], ['ps -eo pid,user,%mem,cmd --sort=-%mem | head', '메모리 사용량 상위'], ['ps -u student', 'student 의 프로세스']],
      see: ['top(1)', 'pgrep(1)', 'pstree(1)', 'proc(5)']
    },
    kill: {
      sec: 1, en: 'send a signal to a process', ko: '프로세스에 시그널 보내기 (종료 등)',
      syn: ['kill [-signal|-s signal|-p] [-q value] [-a] [--timeout milliseconds signal] [--] pid|name...', 'kill -l [number] | -L'],
      desc: "PID 로 지정한 프로세스에 시그널을 보냅니다. 기본 시그널은 TERM(15, 정상 종료 요청)이며, 응답하지 않을 때만 KILL(9, 강제 종료)을 씁니다. bash 에서는 보통 내장 kill 이 실행되며 %1 같은 작업 번호도 받습니다.\n다른 사용자의 프로세스에는 root(sudo)만 시그널을 보낼 수 있습니다.",
      opts: [['-s, --signal SIGNAL', '보낼 시그널 (이름 또는 번호)'], ['-SIGNAL', '예: -9, -KILL, -HUP'], ['-l, --list [number]', '시그널 이름 목록 (번호를 주면 그 이름)'], ['-L, --table', '번호와 이름을 표로']],
      sects: [['SIGNALS', [['1 HUP', '끊김. 많은 데몬은 설정 다시 읽기로 처리'], ['2 INT', '인터럽트 (Ctrl+C)'], ['9 KILL', '강제 종료 (무시하거나 막을 수 없음)'], ['15 TERM', '정상 종료 요청 (기본값)'], ['18 CONT', '멈춘 프로세스 계속'], ['19 STOP', '멈추기 (무시할 수 없음)'], ['20 TSTP', '터미널 정지 (Ctrl+Z)']]]],
      ex: [['kill 1234', 'PID 1234 에 TERM'], ['kill -9 1234', '강제 종료'], ['sudo kill -HUP $(cat /run/nginx.pid)', 'nginx 에 HUP 보내기'], ['kill -l', '시그널 목록']],
      see: ['killall(1)', 'pkill(1)', 'signal(7)', 'ps(1)']
    },
    killall: {
      sec: 1, en: 'kill processes by name', ko: '이름으로 프로세스 종료',
      syn: ['killall [-Z, --context pattern] [-e, --exact] [-g, --process-group] [-i, --interactive] [-n, --ns PID] [-o, --older-than TIME] [-q, --quiet] [-r, --regexp] [-s, --signal SIGNAL, -SIGNAL] [-u, --user user] [-v, --verbose] [-w, --wait] [-y, --younger-than TIME] [-I, --ignore-case] [-V, --version] [--] name ...', 'killall -l'],
      desc: '이름이 NAME 인 모든 프로세스에 시그널(기본 TERM)을 보냅니다. 이름은 정확히 일치해야 합니다(부분 일치는 pkill). 하나라도 종료시키면 종료 코드 0 입니다.',
      opts: [['-s, --signal SIGNAL, -SIGNAL', '보낼 시그널 (예: -9, -HUP)'], ['-i, --interactive', '종료 전에 하나씩 물어보기'], ['-u, --user USER', '해당 사용자의 프로세스만'], ['-w, --wait', '모두 끝날 때까지 기다리기'], ['-I, --ignore-case', '대소문자 무시'], ['-r, --regexp', 'NAME 을 정규식으로'], ['-o, --older-than TIME', 'TIME 보다 오래된 것만 (예: 5m, 1h)'], ['-v, --verbose', '보낸 결과 출력'], ['-l, --list', '시그널 이름 목록']],
      ex: [['killall firefox', 'firefox 프로세스 모두 종료'], ['sudo killall -HUP rsyslogd', 'rsyslogd 에 HUP']],
      see: ['kill(1)', 'pkill(1)', 'pidof(1)', 'signal(7)']
    },
    pgrep: {
      sec: 1, names: 'pgrep, pkill, pidwait', en: 'look up, signal, or wait for processes based on name and other attributes', ko: '이름으로 프로세스 찾기 · 시그널 보내기',
      syn: ['pgrep [options] pattern', 'pkill [options] pattern', 'pidwait [options] pattern'],
      desc: 'pgrep 은 이름이 PATTERN(정규식)과 일치하는 프로세스의 PID 를 출력하고, pkill 은 그 프로세스들에 시그널(기본 TERM)을 보냅니다. ps | grep 보다 간단하고 grep 자신이 섞여 나오지 않습니다.\n기본은 프로세스 이름(최대 15자)만 비교하므로 인자까지 비교하려면 -f 를 씁니다.',
      opts: [['-l, --list-name', '(pgrep) PID 와 이름'], ['-a, --list-full', '(pgrep) PID 와 전체 명령줄'], ['-f, --full', '이름 대신 전체 명령줄과 비교'], ['-x, --exact', '이름이 정확히 일치할 때만'], ['-u, --euid ID', '해당 (유효) 사용자의 프로세스만'], ['-n, --newest', '가장 최근에 시작한 것 하나'], ['-o, --oldest', '가장 오래된 것 하나'], ['-c, --count', '(pgrep) 개수만'], ['-signal, --signal SIGNAL', '(pkill) 보낼 시그널 (예: -9, -HUP)'], ['-e, --echo', '(pkill) 종료시킨 프로세스 출력']],
      ex: [['pgrep -a sshd', 'sshd 의 PID 와 명령줄'], ['pgrep -u student bash', 'student 의 bash'], ['pkill -f "python3 app.py"', '명령줄로 찾아 종료'], ['sudo pkill -HUP -x nginx', 'nginx 에 HUP']],
      see: ['ps(1)', 'kill(1)', 'killall(1)', 'regex(7)']
    },
    jobs: {
      sec: 1, bi: 1, en: 'display status of jobs', ko: '작업(백그라운드 · 멈춘 명령) 목록',
      syn: ['jobs [-lnprs] [jobspec ...]', 'jobs -x command [args]'],
      desc: '현재 셸에서 실행한 작업의 상태를 보여 줍니다. 명령 끝에 & 를 붙이면 백그라운드 작업이 되고, 실행 중에 Ctrl+Z 를 누르면 멈춘(Stopped) 작업이 됩니다.\n작업은 %번호로 가리키며 %+ (또는 %%) 는 현재 작업, %- 는 이전 작업입니다. 작업은 셸마다 따로이므로 다른 터미널의 작업은 보이지 않습니다.',
      opts: [['-l', 'PID 도 함께 보기'], ['-p', 'PID 만'], ['-r', '실행 중인 작업만'], ['-s', '멈춘 작업만'], ['-n', '마지막 알림 이후 상태가 바뀐 작업만']],
      ex: [['sleep 100 &', '백그라운드로 실행 → [1] 12345'], ['jobs -l', '작업 목록과 PID'], ['kill %1', '1번 작업 종료']],
      see: ['bg', 'fg', 'kill(1)', 'bash(1)']
    },
    bg: {
      sec: 1, bi: 1, en: 'move jobs to the background', ko: '멈춘 작업을 백그라운드에서 계속',
      syn: ['bg [job_spec ...]'],
      desc: 'Ctrl+Z 로 멈춘 작업을 백그라운드에서 다시 실행합니다(명령 끝에 & 를 붙인 것과 같아짐). 작업을 지정하지 않으면 현재 작업(%+)을 대상으로 합니다.',
      opts: [['%N', 'N 번 작업'], ['%+, %%', '현재 작업'], ['%-', '이전 작업'], ['%문자열', '명령이 문자열로 시작하는 작업']],
      ex: [['bg', '현재 작업을 백그라운드로'], ['bg %2', '2번 작업을 백그라운드로']],
      see: ['fg', 'jobs', 'bash(1)']
    },
    fg: {
      sec: 1, bi: 1, en: 'move job to the foreground', ko: '작업을 포그라운드로 가져오기',
      syn: ['fg [job_spec]'],
      desc: '백그라운드 작업이나 멈춘 작업을 포그라운드(현재 터미널 앞)로 가져와 계속 실행합니다. 작업이 끝나거나 다시 Ctrl+Z 를 누를 때까지 프롬프트가 돌아오지 않습니다.',
      opts: [['%N', 'N 번 작업'], ['%+, %%', '현재 작업 (기본값)'], ['%-', '이전 작업']],
      ex: [['vim notes.txt', '편집 중 Ctrl+Z 로 잠시 멈춤'], ['fg', 'vim 으로 돌아가기'], ['fg %1', '1번 작업을 앞으로']],
      see: ['bg', 'jobs', 'bash(1)']
    },
    nohup: {
      sec: 1, en: 'run a command immune to hangups, with output to a non-tty', ko: '로그아웃해도 계속 실행되게 하기',
      syn: ['nohup COMMAND [ARG]...', 'nohup OPTION'],
      desc: 'COMMAND 가 HUP 시그널(터미널이 끊길 때 보내짐)을 무시하도록 실행합니다. 표준 출력이 터미널이면 결과를 ./nohup.out (쓸 수 없으면 ~/nohup.out) 에 덧붙입니다.\n보통 끝에 & 를 붙여 백그라운드로 실행합니다. 오래 도는 작업에는 tmux, screen, systemd 서비스도 좋은 대안입니다.',
      opts: [['--help', '도움말'], ['--version', '버전 정보']],
      ex: [['nohup ./backup.sh &', '로그아웃해도 계속 실행, 출력은 nohup.out'], ['nohup python3 server.py > server.log 2>&1 &', '출력을 원하는 파일로']],
      see: ['tmux(1)', 'screen(1)', 'setsid(1)', 'disown']
    },
    nice: {
      sec: 1, en: 'run a program with modified scheduling priority', ko: '우선순위를 바꿔 명령 실행',
      syn: ['nice [OPTION] [COMMAND [ARG]...]'],
      desc: 'CPU 스케줄링 우선순위(nice 값)를 조정해 COMMAND 를 실행합니다. nice 값은 -20(가장 높음)부터 19(가장 낮음)까지이며 기본은 0 입니다. 옵션 없이 쓰면 10 을 더합니다.\n값을 낮추는(우선순위를 올리는) 것은 root 만 할 수 있습니다. 인자 없이 쓰면 현재 nice 값을 출력합니다.',
      opts: [['-n, --adjustment=N', 'nice 값에 N 더하기 (기본 10)']],
      ex: [['nice -n 19 tar czf backup.tgz /home', '가장 낮은 우선순위로 백업'], ['sudo nice -n -5 ./important', '높은 우선순위로 (root 필요)'], ['nice', '현재 nice 값 출력']],
      see: ['renice(1)', 'top(1)', 'ionice(1)']
    },
    renice: {
      sec: 1, en: 'alter priority of running processes', ko: '실행 중인 프로세스의 우선순위 바꾸기',
      syn: ['renice [--priority|--relative] priority [-g|-p|-u] identifier...'],
      desc: '이미 실행 중인 프로세스의 nice 값을 바꿉니다. 일반 사용자는 자기 프로세스의 값을 올리기(우선순위 낮추기)만 할 수 있고, 낮추려면 root 가 필요합니다.',
      opts: [['-n, --priority PRIORITY', '새 nice 값 지정'], ['--relative PRIORITY', '현재 값에 더하기'], ['-p, --pid', '식별자를 PID 로 (기본값)'], ['-g, --pgrp', '식별자를 프로세스 그룹 ID 로'], ['-u, --user', '식별자를 사용자 이름/UID 로']],
      ex: [['renice -n 10 -p 1234', 'PID 1234 의 nice 값을 10 으로'], ['sudo renice -n -5 -u www-data', 'www-data 의 모든 프로세스']],
      see: ['nice(1)', 'top(1)']
    },
    chmod: {
      sec: 1, en: 'change file mode bits', ko: '파일 권한 바꾸기',
      syn: ['chmod [OPTION]... MODE[,MODE]... FILE...', 'chmod [OPTION]... OCTAL-MODE FILE...', 'chmod [OPTION]... --reference=RFILE FILE...'],
      desc: '파일의 권한(읽기 r=4, 쓰기 w=2, 실행 x=1)을 바꿉니다. 소유자(u), 그룹(g), 기타(o), 모두(a)에 대해 기호(u+x, go-w, a=r)나 8진수(755, 644)로 지정합니다.\n특수 권한은 SUID(4000, u+s), SGID(2000, g+s), 스티키 비트(1000, +t) 입니다. 파일 소유자나 root 만 권한을 바꿀 수 있습니다.',
      opts: [['-R, --recursive', '디렉터리 안까지 재귀적으로'], ['-v, --verbose', '처리한 파일마다 출력'], ['-c, --changes', '실제로 바뀐 것만 출력'], ['-f, --silent, --quiet', '대부분의 오류 메시지 숨기기'], ['--reference=RFILE', 'RFILE 과 같은 권한으로']],
      sects: [['OCTAL MODES', [['755', 'rwxr-xr-x : 실행 파일, 디렉터리'], ['644', 'rw-r--r-- : 일반 파일'], ['700', 'rwx------ : 나만 사용'], ['600', 'rw------- : 개인 키 등 비밀 파일'], ['1777', 'rwxrwxrwt : /tmp 같은 공유 디렉터리']]]],
      ex: [['chmod +x script.sh', '실행 권한 주기'], ['chmod 600 ~/.ssh/id_ed25519', '개인 키는 나만 읽기'], ['chmod -R g+w shared/', '그룹에 쓰기 권한 추가'], ['chmod u=rwx,g=rx,o= app', '기호로 한 번에 지정 (750)']],
      see: ['chown(1)', 'umask', 'ls(1)', 'stat(1)']
    },
    chown: {
      sec: 1, en: 'change file owner and group', ko: '파일 소유자 · 그룹 바꾸기',
      syn: ['chown [OPTION]... [OWNER][:[GROUP]] FILE...', 'chown [OPTION]... --reference=RFILE FILE...'],
      desc: '파일의 소유자와 그룹을 바꿉니다. 소유자는 root 만 바꿀 수 있어서 보통 sudo 와 함께 씁니다.\nOWNER:GROUP 형식으로 둘 다, :GROUP 으로 그룹만, OWNER: 로 소유자와 그 사용자의 기본 그룹을 지정합니다.',
      opts: [['-R, --recursive', '디렉터리 안까지 재귀적으로'], ['-v, --verbose', '처리한 파일마다 출력'], ['-c, --changes', '실제로 바뀐 것만 출력'], ['-h, --no-dereference', '링크가 가리키는 파일 대신 링크 자체를'], ['--reference=RFILE', 'RFILE 과 같은 소유자 · 그룹으로'], ['--from=CUR_OWNER:CUR_GROUP', '현재 소유자/그룹이 일치할 때만 바꾸기']],
      ex: [['sudo chown student file.txt', '소유자를 student 로'], ['sudo chown -R www-data:www-data /var/www/html', '웹 루트 소유권 변경'], ['sudo chown :developers project', '그룹만 바꾸기']],
      see: ['chgrp(1)', 'chmod(1)', 'id(1)']
    },
    chgrp: {
      sec: 1, en: 'change group ownership', ko: '파일 그룹 바꾸기',
      syn: ['chgrp [OPTION]... GROUP FILE...', 'chgrp [OPTION]... --reference=RFILE FILE...'],
      desc: '파일의 그룹을 GROUP 으로 바꿉니다. 소유자는 자신이 속한 그룹으로만 바꿀 수 있고, root 는 아무 그룹으로나 바꿀 수 있습니다.',
      opts: [['-R, --recursive', '디렉터리 안까지 재귀적으로'], ['-v, --verbose', '처리한 파일마다 출력'], ['-c, --changes', '실제로 바뀐 것만 출력'], ['-h, --no-dereference', '심볼릭 링크 자체를 바꾸기'], ['--reference=RFILE', 'RFILE 과 같은 그룹으로']],
      ex: [['chgrp developers report.txt', '그룹을 developers 로'], ['sudo chgrp -R www-data /var/www', '재귀적으로 변경']],
      see: ['chown(1)', 'groups(1)', 'newgrp(1)']
    },
    umask: {
      sec: 1, bi: 1, en: 'display or set file mode mask', ko: '새 파일의 기본 권한 마스크',
      syn: ['umask [-p] [-S] [mode]'],
      desc: '새로 만드는 파일과 디렉터리에서 빼낼 권한 비트(마스크)를 보거나 정합니다. 파일은 666, 디렉터리는 777 에서 마스크를 뺀 권한으로 만들어집니다.\nUbuntu 의 일반 사용자 기본값은 0002 (파일 664, 디렉터리 775), root 는 0022 입니다. 바꾼 값은 현재 셸에만 적용되며, 계속 쓰려면 ~/.bashrc 에 적습니다.',
      opts: [['-S', '기호 형식으로 출력 (u=rwx,g=rwx,o=rx)'], ['-p', '다시 입력으로 쓸 수 있는 형식 (umask 0002)']],
      ex: [['umask', '현재 값 (예: 0002)'], ['umask 077', '이후 파일은 나만 접근 가능 (600 / 700)'], ['umask -S', '기호로 보기']],
      see: ['chmod(1)', 'bash(1)', 'umask(2)']
    },
    id: {
      sec: 1, en: 'print real and effective user and group IDs', ko: '사용자 · 그룹 ID 보기',
      syn: ['id [OPTION]... [USER]...'],
      desc: 'USER(생략하면 현재 사용자)의 UID, 기본 그룹 GID, 속한 모든 그룹을 보여 줍니다. 그룹에 새로 추가된 경우 다시 로그인해야 현재 셸의 id 결과에 반영됩니다.',
      opts: [['-u, --user', 'UID 만'], ['-g, --group', '기본 GID 만'], ['-G, --groups', '모든 그룹 ID'], ['-n, --name', '-u -g -G 와 함께: 숫자 대신 이름'], ['-r, --real', '유효 ID 대신 실제 ID']],
      ex: [['id', 'uid=1000(student) gid=1000(student) groups=...'], ['id -un', '사용자 이름만 (whoami 와 같음)'], ['id -nG alice', 'alice 가 속한 그룹 이름들']],
      see: ['whoami(1)', 'groups(1)', 'who(1)']
    },
    whoami: {
      sec: 1, en: 'print effective user name', ko: '현재 사용자 이름 출력',
      syn: ['whoami [OPTION]...'],
      desc: '현재 유효 사용자 이름을 출력합니다. id -un 과 같습니다. sudo 로 실행하면 root 가 출력됩니다.',
      opts: [['--help', '도움말'], ['--version', '버전 정보']],
      ex: [['whoami', '예: student'], ['sudo whoami', 'root']],
      see: ['id(1)', 'who(1)']
    },
    who: {
      sec: 1, en: 'show who is logged on', ko: '로그인한 사용자 보기',
      syn: ['who [OPTION]... [ FILE | ARG1 ARG2 ]'],
      desc: '지금 로그인해 있는 사용자의 이름, 터미널, 로그인 시각, 접속한 곳을 보여 줍니다. who am i 는 현재 터미널의 정보만 보여 줍니다.',
      opts: [['-a, --all', '모든 정보'], ['-b, --boot', '마지막 부팅 시각'], ['-H, --heading', '열 제목 출력'], ['-q, --count', '로그인 이름과 사용자 수만'], ['-u, --users', '유휴 시간과 PID 도 표시'], ['-r, --runlevel', '현재 런레벨'], ['-m', 'who am i 와 같음']],
      ex: [['who', '로그인 사용자 목록'], ['who -b', '부팅 시각'], ['who am i', '나의 로그인 정보']],
      see: ['w(1)', 'users(1)', 'last(1)', 'whoami(1)']
    },
    w: {
      sec: 1, en: 'Show who is logged on and what they are doing.', ko: '로그인 사용자와 하는 일 보기',
      syn: ['w [options] [user]'],
      desc: '첫 줄에 uptime 과 같은 요약(현재 시각, 가동 시간, 사용자 수, 부하 평균)을, 그 아래에 사용자별 터미널, 접속 위치, 로그인 시각, 유휴 시간, 실행 중인 명령을 보여 줍니다.',
      opts: [['-h, --no-header', '머리말 생략'], ['-s, --short', '짧은 형식 (로그인 시각, CPU 시간 생략)'], ['-f, --from', 'FROM(접속 위치) 열 켜고 끄기'], ['-i, --ip-addr', '호스트 이름 대신 IP 주소'], ['-o, --old-style', '옛 형식']],
      ex: [['w', '전체'], ['w student', 'student 사용자만']],
      see: ['who(1)', 'uptime(1)', 'ps(1)']
    },
    groups: {
      sec: 1, en: 'print the groups a user is in', ko: '사용자가 속한 그룹 보기',
      syn: ['groups [OPTION]... [USERNAME]...'],
      desc: '사용자(생략하면 현재 프로세스)가 속한 그룹 이름을 출력합니다. usermod -aG 로 그룹을 추가한 뒤에는 다시 로그인하거나 newgrp 를 해야 현재 셸에 반영됩니다(사용자 이름을 주면 /etc/group 기준으로 바로 보입니다).',
      opts: [['--help', '도움말'], ['--version', '버전 정보']],
      ex: [['groups', '예: student adm cdrom sudo ...'], ['groups alice', 'alice : alice developers']],
      see: ['id(1)', 'usermod(8)', 'group(5)']
    },
    useradd: {
      sec: 8, en: 'create a new user or update default new user information', ko: '새 사용자 계정 만들기 (저수준)',
      syn: ['useradd [options] LOGIN', 'useradd -D', 'useradd -D [options]'],
      desc: "새 사용자를 /etc/passwd, /etc/shadow, /etc/group 에 등록합니다. 기본값은 /etc/default/useradd 와 /etc/login.defs 에서 옵니다.\nUbuntu 에서는 -m 을 주지 않으면 홈 디렉터리를 만들지 않고, 기본 셸도 /bin/sh 입니다. 비밀번호는 따로 passwd 로 정해야 로그인할 수 있습니다. 대화형으로 한 번에 만들려면 adduser 가 더 편합니다.",
      opts: [['-m, --create-home', '홈 디렉터리 만들고 /etc/skel 복사'], ['-d, --home-dir HOME_DIR', '홈 디렉터리 경로 지정'], ['-s, --shell SHELL', '로그인 셸 (예: /bin/bash)'], ['-g, --gid GROUP', '기본 그룹'], ['-G, --groups GROUP1[,GROUP2...]', '추가(보조) 그룹'], ['-u, --uid UID', 'UID 지정'], ['-c, --comment COMMENT', '설명 (보통 실명)'], ['-e, --expiredate YYYY-MM-DD', '계정 만료일'], ['-r, --system', '시스템 계정 (UID 1000 미만, 홈 없음)'], ['-D, --defaults', '기본값 보기 · 바꾸기']],
      ex: [['sudo useradd -m -s /bin/bash alice', '홈과 bash 셸이 있는 사용자'], ['sudo passwd alice', '비밀번호 정하기'], ['sudo useradd -m -G sudo,developers -c "Bob Kim" bob', '그룹과 설명 지정'], ['useradd -D', '기본값 보기']],
      see: ['adduser(8)', 'usermod(8)', 'userdel(8)', 'passwd(1)', 'passwd(5)', 'login.defs(5)']
    },
    adduser: {
      sec: 8, names: 'adduser, addgroup', en: 'add or manipulate users or groups', ko: '사용자 · 그룹 추가 (대화형, Ubuntu 권장)',
      syn: ['adduser [--home DIR] [--shell SHELL] [--no-create-home] [--uid ID] [--gid ID | --ingroup GROUP] [--disabled-password] [--disabled-login] [--comment COMMENT] USER', 'adduser --system [options] USER', 'adduser --group GROUP  (= addgroup GROUP)', 'adduser USER GROUP'],
      desc: 'useradd 를 감싼 Debian/Ubuntu 의 친절한 도구입니다. 홈 디렉터리 생성, /etc/skel 복사, bash 셸 지정, 비밀번호와 이름 등을 차례로 물어보며 한 번에 계정을 만듭니다.\n"adduser USER GROUP" 처럼 이미 있는 사용자와 그룹을 주면 그 사용자를 그룹에 추가합니다. 지우는 짝은 deluser, delgroup 입니다.',
      opts: [['--system', '시스템 사용자 만들기'], ['--home DIR', '홈 디렉터리 지정'], ['--shell SHELL', '로그인 셸 지정'], ['--no-create-home', '홈 디렉터리 만들지 않기'], ['--uid ID', 'UID 지정'], ['--ingroup GROUP', '기본 그룹을 GROUP 으로'], ['--disabled-password', '비밀번호 로그인 불가 (SSH 키 등으로만)'], ['--disabled-login', '비밀번호를 설정하지 않아 로그인 불가'], ['--comment COMMENT', '설명(실명 등)을 묻지 않고 지정 (예전 --gecos)']],
      ex: [['sudo adduser alice', '대화형으로 사용자 만들기'], ['sudo adduser alice sudo', 'alice 를 sudo 그룹에 추가'], ['sudo addgroup developers', '그룹 만들기'], ['sudo adduser --system --no-create-home --group appsvc', '서비스용 시스템 계정']],
      see: ['deluser(8)', 'useradd(8)', 'usermod(8)', 'adduser.conf(5)']
    },
    usermod: {
      sec: 8, en: 'modify a user account', ko: '사용자 계정 정보 바꾸기',
      syn: ['usermod [options] LOGIN'],
      desc: '이미 있는 계정의 그룹, 홈, 셸, 이름, 잠금 상태 등을 바꿉니다. 그룹을 추가할 때 -a 없이 -G 만 쓰면 기존 보조 그룹이 모두 사라지므로 반드시 -aG 로 씁니다. 바뀐 그룹은 다시 로그인해야 적용됩니다.',
      opts: [['-a, --append', '-G 와 함께: 기존 그룹을 유지하고 추가'], ['-G, --groups GROUP1[,GROUP2...]', '보조 그룹 목록 지정'], ['-g, --gid GROUP', '기본 그룹 바꾸기'], ['-l, --login NEW_LOGIN', '로그인 이름 바꾸기'], ['-d, --home HOME_DIR', '홈 디렉터리 경로 바꾸기'], ['-m, --move-home', '-d 와 함께: 기존 홈 내용을 새 위치로 옮기기'], ['-s, --shell SHELL', '로그인 셸 바꾸기'], ['-c, --comment COMMENT', '설명 바꾸기'], ['-L, --lock', '비밀번호 잠그기 (앞에 ! 붙임)'], ['-U, --unlock', '잠금 풀기'], ['-e, --expiredate YYYY-MM-DD', '계정 만료일']],
      ex: [['sudo usermod -aG sudo alice', 'alice 에게 sudo 권한 (sudo 그룹 추가)'], ['sudo usermod -aG docker $USER', '나를 docker 그룹에 추가'], ['sudo usermod -s /bin/bash bob', '셸 바꾸기'], ['sudo usermod -L bob', '계정 잠그기']],
      see: ['useradd(8)', 'userdel(8)', 'gpasswd(1)', 'chsh(1)']
    },
    userdel: {
      sec: 8, en: 'delete a user account and related files', ko: '사용자 계정 지우기',
      syn: ['userdel [options] LOGIN'],
      desc: '계정을 /etc/passwd, /etc/shadow, /etc/group 에서 지웁니다. 기본적으로 홈 디렉터리는 남겨 두며, -r 을 주면 홈과 메일 스풀까지 지웁니다. 로그인 중이거나 프로세스가 돌고 있으면 지워지지 않습니다.',
      opts: [['-r, --remove', '홈 디렉터리와 메일 스풀도 지우기'], ['-f, --force', '로그인 중이어도 강제로 지우기 (위험)']],
      ex: [['sudo userdel bob', '계정만 지우기'], ['sudo userdel -r bob', '홈까지 지우기']],
      see: ['deluser(8)', 'useradd(8)', 'usermod(8)']
    },
    passwd: {
      sec: 1, en: 'change user password', ko: '비밀번호 바꾸기 · 계정 잠금',
      syn: ['passwd [options] [LOGIN]'],
      desc: '비밀번호를 바꿉니다. 일반 사용자는 자기 비밀번호만 바꿀 수 있고 현재 비밀번호를 먼저 물어봅니다. root 는 다른 사용자의 비밀번호를 현재 비밀번호 없이 바꿀 수 있습니다.\n입력하는 비밀번호는 화면에 보이지 않습니다. 암호화된 비밀번호는 /etc/shadow 에 저장됩니다.',
      opts: [['-l, --lock', '비밀번호 잠그기 (root)'], ['-u, --unlock', '잠금 풀기 (root)'], ['-d, --delete', '비밀번호 지우기 (빈 비밀번호)'], ['-e, --expire', '즉시 만료시켜 다음 로그인 때 바꾸게 하기'], ['-S, --status', '계정 상태 (P 사용 가능, L 잠김, NP 비밀번호 없음)'], ['-a, --all', '-S 와 함께: 모든 사용자'], ['-n, --mindays MIN_DAYS', '변경 후 다시 바꿀 수 있을 때까지 최소 일수'], ['-x, --maxdays MAX_DAYS', '비밀번호 최대 사용 일수'], ['-w, --warndays WARN_DAYS', '만료 전 경고 일수']],
      ex: [['passwd', '내 비밀번호 바꾸기'], ['sudo passwd alice', 'alice 의 비밀번호 설정'], ['sudo passwd -S alice', '상태 확인'], ['sudo passwd -e alice', '다음 로그인 때 변경 강제']],
      see: ['chage(1)', 'shadow(5)', 'passwd(5)', 'usermod(8)']
    },
    groupadd: {
      sec: 8, en: 'create a new group', ko: '새 그룹 만들기',
      syn: ['groupadd [options] group'],
      desc: '새 그룹을 /etc/group 과 /etc/gshadow 에 추가합니다. 사용자를 그룹에 넣을 때는 usermod -aG 나 gpasswd -a 를 씁니다. 그룹 삭제는 groupdel, 이름 변경은 groupmod -n 입니다.',
      opts: [['-g, --gid GID', 'GID 지정'], ['-r, --system', '시스템 그룹 (GID 1000 미만)'], ['-f, --force', '이미 있으면 오류 없이 성공으로 끝내기'], ['-K, --key KEY=VALUE', '/etc/login.defs 값 덮어쓰기']],
      ex: [['sudo groupadd developers', 'developers 그룹 만들기'], ['sudo groupadd -g 2000 project', 'GID 2000 으로 만들기']],
      see: ['groupdel(8)', 'groupmod(8)', 'gpasswd(1)', 'group(5)']
    },
    gpasswd: {
      sec: 1, en: 'administer /etc/group and /etc/gshadow', ko: '그룹 구성원 · 관리자 관리',
      syn: ['gpasswd [option] group'],
      desc: '그룹에 사용자를 넣거나 빼고, 그룹 관리자나 그룹 비밀번호를 정합니다. 사용자를 그룹에서 빼는 가장 간단한 방법이 gpasswd -d 입니다.',
      opts: [['-a, --add user', '사용자를 그룹에 추가'], ['-d, --delete user', '사용자를 그룹에서 빼기'], ['-M, --members user,...', '구성원 목록을 통째로 지정'], ['-A, --administrators user,...', '그룹 관리자 지정'], ['-r, --remove-password', '그룹 비밀번호 지우기'], ['-R, --restrict', 'newgrp 로 들어오는 것을 구성원으로 제한']],
      ex: [['sudo gpasswd -a alice developers', 'alice 를 developers 에 추가'], ['sudo gpasswd -d alice developers', 'alice 를 developers 에서 빼기']],
      see: ['groupadd(8)', 'usermod(8)', 'newgrp(1)', 'group(5)']
    },
    su: {
      sec: 1, en: 'run a command with substitute user and group ID', ko: '다른 사용자로 전환',
      syn: ['su [options] [-] [user [argument...]]'],
      desc: '다른 사용자(생략하면 root)의 권한으로 셸이나 명령을 실행합니다. 대상 사용자의 비밀번호를 묻습니다.\nUbuntu 는 root 비밀번호가 잠겨 있어 su 만으로는 root 가 될 수 없으므로 sudo -i 또는 sudo su - 를 씁니다. - 를 붙이면 대상 사용자의 로그인 환경(홈, PATH)으로 시작합니다.',
      opts: [['-, -l, --login', '로그인 셸처럼 환경을 새로 시작'], ['-c, --command COMMAND', '셸 대신 COMMAND 하나만 실행'], ['-s, --shell SHELL', '사용할 셸 지정'], ['-m, -p, --preserve-environment', '현재 환경 변수 유지'], ['-g, --group GROUP', '기본 그룹 지정 (root 만)']],
      ex: [['su - alice', 'alice 로 로그인 셸 시작'], ['sudo su -', 'root 셸 (내 비밀번호 사용)'], ["su -c 'whoami' alice", 'alice 로 명령 하나만'], ['exit', '원래 사용자로 돌아가기']],
      see: ['sudo(8)', 'login(1)', 'runuser(1)']
    },
    sudo: {
      sec: 8, names: 'sudo, sudoedit', en: 'execute a command as another user', ko: '다른 사용자(주로 root) 권한으로 명령 실행',
      syn: ['sudo -h | -K | -k | -V', 'sudo -v [-ABkNnS] [-g group] [-h host] [-p prompt] [-u user]', 'sudo -l [-ABkNnS] [-g group] [-h host] [-p prompt] [-U user] [-u user] [command [arg ...]]', 'sudo [-ABbEHnPS] [-C num] [-D directory] [-g group] [-h host] [-p prompt] [-R directory] [-T timeout] [-u user] [VAR=value] [-i | -s] [command [arg ...]]', 'sudo -e [-ABkNnS] [-C num] [-D directory] [-g group] [-h host] [-p prompt] [-R directory] [-T timeout] [-u user] file ...'],
      desc: 'sudoers 정책(/etc/sudoers, /etc/sudoers.d/)이 허락하면 COMMAND 를 root 나 다른 사용자로 실행합니다. 비밀번호는 root 가 아니라 자기 비밀번호를 입력하며, 한 번 인증하면 15분 동안 다시 묻지 않습니다.\nUbuntu 에서는 sudo 그룹에 속한 사용자가 모든 명령을 sudo 로 실행할 수 있습니다. 실행 기록은 /var/log/auth.log (journalctl) 에 남습니다.',
      opts: [['-u, --user=USER', 'root 대신 USER 로 실행'], ['-i, --login', '대상 사용자의 로그인 셸 시작 (sudo -i = root 셸)'], ['-s, --shell', '현재 환경을 유지한 채 셸 시작'], ['-l, --list', '내가 sudo 로 실행할 수 있는 명령 목록'], ['-k, --reset-timestamp', '인증 기록을 지워 다음번에 다시 비밀번호 묻기'], ['-v, --validate', '명령 없이 인증 시간만 연장'], ['-e, --edit', '파일을 안전하게 편집 (sudoedit)'], ['-E, --preserve-env', '현재 환경 변수 유지'], ['-b, --background', '백그라운드로 실행'], ['-g, --group=GROUP', '기본 그룹을 GROUP 으로']],
      ex: [['sudo apt update', 'root 권한으로 실행'], ['sudo -i', 'root 셸 (exit 로 나오기)'], ['sudo -u www-data ls /var/www', 'www-data 사용자로 실행'], ['sudo -l', '허락된 명령 확인'], ['sudo !!', '방금 명령을 sudo 로 다시 실행']],
      see: ['su(1)', 'visudo(8)', 'sudoers(5)']
    },
    visudo: {
      sec: 8, en: 'edit the sudoers file', ko: 'sudoers 파일 안전하게 편집',
      syn: ['visudo [-chIOPqsV] [[-f] sudoers]'],
      desc: '/etc/sudoers 를 잠근 상태로 편집기(Ubuntu 기본 nano, EDITOR/SUDO_EDITOR 변수로 변경)에서 열고, 저장할 때 문법을 검사합니다. 문법 오류가 있으면 저장하지 않고 어떻게 할지 물어보므로 sudo 가 망가지는 사고를 막습니다.\n직접 수정하기보다 /etc/sudoers.d/ 에 파일을 따로 만드는 것이 좋습니다(sudo visudo -f /etc/sudoers.d/이름).',
      opts: [['-c, --check', '편집하지 않고 문법 검사만'], ['-f, --file=sudoers', '다른 sudoers 파일 편집'], ['-s, --strict', '엄격한 검사 (정의 안 된 별칭 등도 오류)'], ['-q, --quiet', '간단한 오류 메시지']],
      ex: [['sudo visudo', 'sudoers 편집'], ['sudo visudo -f /etc/sudoers.d/deploy', '별도 파일 편집'], ['sudo visudo -c', '문법 검사']],
      see: ['sudo(8)', 'sudoers(5)', 'vipw(8)']
    },
    chage: {
      sec: 1, en: 'change user password expiry information', ko: '비밀번호 만료 정책 설정',
      syn: ['chage [options] LOGIN'],
      desc: '비밀번호를 마지막으로 바꾼 날, 최소·최대 사용 일수, 경고 기간, 만료 후 비활성 기간, 계정 만료일을 보거나 바꿉니다. 정보는 /etc/shadow 에 저장됩니다. -l 을 빼면 root 만 쓸 수 있습니다.',
      opts: [['-l, --list', '만료 정보 보기'], ['-M, --maxdays MAX_DAYS', '비밀번호 최대 사용 일수'], ['-m, --mindays MIN_DAYS', '변경 후 다시 바꿀 수 있을 때까지 최소 일수'], ['-W, --warndays WARN_DAYS', '만료 며칠 전부터 경고할지'], ['-I, --inactive INACTIVE', '만료 후 며칠 지나면 계정 비활성화'], ['-E, --expiredate EXPIRE_DATE', '계정 만료일 (YYYY-MM-DD, -1 은 없음)'], ['-d, --lastday LAST_DAY', '마지막 변경일 (0 이면 다음 로그인 때 변경 강제)']],
      ex: [['chage -l student', '내 만료 정보'], ['sudo chage -M 90 -W 7 alice', '90일마다 변경, 7일 전 경고'], ['sudo chage -d 0 alice', '다음 로그인 때 비밀번호 변경 강제'], ['sudo chage -E 2025-12-31 intern', '계정 만료일 지정']],
      see: ['passwd(1)', 'shadow(5)', 'login.defs(5)']
    }
  });

  Object.assign(MAN, {
    apt: {
      sec: 8, en: 'command-line interface', ko: '패키지 관리 (설치 · 제거 · 업데이트)',
      syn: ['apt [-h] [-o=config_string] [-c=config_file] [-t=target_release] [-a=architecture] {list | search | show | update | install pkg [{=pkg_version_number | /target_release}]... | remove pkg... | upgrade | full-upgrade | edit-sources | {-v | --version} | {-h | --help}}'],
      desc: 'Ubuntu 에서 소프트웨어를 설치 · 제거 · 업데이트하는 대표 명령입니다. apt-get 과 apt-cache 의 자주 쓰는 기능을 모아, 진행 막대와 색을 넣어 사람이 쓰기 편하게 만들었습니다.\n패키지 정보는 /etc/apt/sources.list.d/ubuntu.sources 에 적힌 저장소에서 받아 옵니다. 설치 · 제거는 root 권한이 필요하므로 sudo 와 함께 씁니다. 스크립트에서는 출력 형식이 안정적인 apt-get 을 권장합니다.',
      sects: [['COMMANDS', [['update', '저장소에서 최신 패키지 목록 받아오기 (설치 전에 먼저)'], ['upgrade', '설치된 패키지를 새 버전으로 (패키지를 지우지는 않음)'], ['full-upgrade', '의존성 변화에 따라 필요하면 패키지를 지우면서 업그레이드'], ['install PKG...', '패키지 설치 (PKG=버전 으로 버전 지정, ./파일.deb 도 가능)'], ['reinstall PKG...', '다시 설치'], ['remove PKG...', '패키지 제거 (설정 파일은 남김)'], ['purge PKG...', '설정 파일까지 제거'], ['autoremove', '더 이상 필요 없는 의존성 패키지 제거'], ['search REGEX', '이름 · 설명으로 패키지 검색'], ['show PKG', '패키지 정보 (버전, 의존성, 크기, 설명)'], ['list', '패키지 목록 (--installed, --upgradable)'], ['edit-sources', '저장소 설정 파일 편집']]]],
      opts: [['-y, --yes, --assume-yes', '확인 질문에 자동으로 yes'], ['-s, --simulate, --dry-run', '실제로 하지 않고 무엇을 할지만 보기'], ['--no-install-recommends', '추천(Recommends) 패키지는 설치하지 않기'], ['-f, --fix-broken', '깨진 의존성 고치기'], ['--purge', 'remove/autoremove 와 함께: 설정 파일까지 제거'], ['-q, --quiet', '진행 표시 줄이기'], ['--installed', '(list) 설치된 것만'], ['--upgradable', '(list) 업그레이드 가능한 것만']],
      ex: [['sudo apt update && sudo apt upgrade -y', '목록 갱신 후 전체 업그레이드'], ['sudo apt install nginx', 'nginx 설치'], ['apt search "web server"', '검색'], ['apt show nginx', '패키지 정보'], ['sudo apt purge apache2 && sudo apt autoremove', '설정까지 지우고 남은 의존성 정리'], ['apt list --installed | grep python3', '설치된 python3 관련 패키지']],
      see: ['apt-get(8)', 'apt-cache(8)', 'dpkg(1)', 'sources.list(5)', 'snap(8)']
    },
    'apt-get': {
      sec: 8, en: 'APT package handling utility -- command-line interface', ko: '패키지 관리 (스크립트용 저수준 도구)',
      syn: ['apt-get [-asqdyfmubV] [-o=config_string] [-c=config_file] [-t=target_release] [-a=architecture] {update | upgrade | dselect-upgrade | dist-upgrade | install pkg... | reinstall pkg... | remove pkg... | purge pkg... | source pkg... | build-dep pkg... | download pkg... | check | clean | autoclean | autoremove | {-v | --version} | {-h | --help}}'],
      desc: 'apt 와 같은 일을 하지만 출력 형식이 바뀌지 않도록 보장되어 스크립트와 자동화(Dockerfile 등)에 적합합니다. 대부분의 하위 명령은 apt 와 이름이 같고, full-upgrade 대신 dist-upgrade 를 씁니다.',
      sects: [['COMMANDS', [['update', '패키지 목록 갱신'], ['upgrade', '설치된 패키지 업그레이드'], ['dist-upgrade', '의존성 변화까지 처리하는 업그레이드'], ['install PKG...', '설치'], ['remove PKG...', '제거'], ['purge PKG...', '설정까지 제거'], ['autoremove', '필요 없는 의존성 제거'], ['clean', '/var/cache/apt/archives 의 받은 .deb 파일 모두 지우기'], ['autoclean', '더 이상 받을 수 없는 오래된 .deb 만 지우기'], ['download PKG', '.deb 파일만 현재 디렉터리로 받기'], ['source PKG', '소스 패키지 받기']]]],
      opts: [['-y, --yes, --assume-yes', '질문에 자동으로 yes'], ['-q, --quiet', '출력 줄이기 (-qq 는 더)'], ['-s, --simulate, --dry-run', '실제로 하지 않고 흉내만'], ['-d, --download-only', '받기만 하고 설치하지 않기'], ['-f, --fix-broken', '깨진 의존성 고치기'], ['--no-install-recommends', '추천 패키지 설치 안 함'], ['--reinstall', '이미 최신이어도 다시 설치']],
      ex: [['sudo apt-get update', '목록 갱신'], ['sudo apt-get install -y curl git', '질문 없이 설치'], ['sudo apt-get clean', '패키지 캐시 비우기']],
      see: ['apt(8)', 'apt-cache(8)', 'dpkg(1)', 'apt.conf(5)']
    },
    'apt-cache': {
      sec: 8, en: 'query the APT cache', ko: '패키지 정보 조회',
      syn: ['apt-cache [-agipns] [-o=config_string] [-c=config_file] {gencaches | showpkg pkg... | showsrc pkg... | stats | dump | dumpavail | unmet | show pkg... | search regex... | depends pkg... | rdepends pkg... | pkgnames prefix | dotty pkg... | xvcg pkg... | policy [pkg...] | madison pkg... | {-v | --version} | {-h | --help}}'],
      desc: 'apt update 로 받아 둔 패키지 목록(캐시)에서 정보를 찾아봅니다. 시스템을 바꾸지 않으므로 root 권한이 필요 없습니다.',
      sects: [['COMMANDS', [['search REGEX', '이름과 설명으로 검색'], ['show PKG', '패키지 상세 정보'], ['policy [PKG]', '설치된 버전, 후보 버전, 저장소 우선순위'], ['depends PKG', '이 패키지가 필요로 하는 패키지'], ['rdepends PKG', '이 패키지를 필요로 하는 패키지 (역의존성)'], ['madison PKG', '저장소별로 받을 수 있는 버전 목록'], ['showpkg PKG', '버전과 의존 관계 자세히'], ['pkgnames [PREFIX]', '모든 패키지 이름'], ['stats', '캐시 통계']]]],
      opts: [['-n, --names-only', '(search) 이름에서만 검색'], ['-f, --full', '(search) 전체 정보 출력'], ['-i, --important', '(depends) Depends 와 Pre-Depends 만'], ['--installed', '(depends/rdepends) 설치된 것만']],
      ex: [['apt-cache search nginx', '검색'], ['apt-cache policy nginx', '설치 · 후보 버전 확인'], ['apt-cache depends nginx', '의존성 보기']],
      see: ['apt(8)', 'apt-get(8)', 'dpkg-query(1)']
    },
    dpkg: {
      sec: 1, en: 'package manager for Debian', ko: '.deb 패키지 저수준 관리',
      syn: ['dpkg [option...] action'],
      desc: '.deb 파일을 직접 설치 · 제거하고 설치된 패키지의 정보를 조회하는 저수준 도구입니다. 저장소에서 받거나 의존성을 자동으로 해결하지는 않으므로, 보통은 apt 를 쓰고 조회할 때 dpkg -l, -L, -S 를 많이 씁니다.\n의존성 오류로 설치가 멈추면 sudo apt -f install 로 해결합니다.',
      opts: [['-i, --install FILE.deb', '.deb 파일 설치'], ['-r, --remove PKG', '패키지 제거 (설정 파일 남김)'], ['-P, --purge PKG', '설정 파일까지 제거'], ['-l, --list [PATTERN]', '설치된 패키지 목록 (ii = 정상 설치)'], ['-L, --listfiles PKG', '패키지가 설치한 파일 목록'], ['-S, --search PATTERN', '이 파일이 어느 패키지 것인지'], ['-s, --status PKG', '패키지 상태 · 정보'], ['-c, --contents FILE.deb', '.deb 안의 파일 목록'], ['-I, --info FILE.deb', '.deb 의 정보'], ['--configure -a', '설치가 덜 끝난 패키지 모두 설정 마치기'], ['--get-selections', '설치된 패키지 선택 목록']],
      ex: [['sudo dpkg -i ./app_1.0_amd64.deb', '받은 .deb 설치'], ['dpkg -l | grep nginx', 'nginx 관련 설치 여부'], ['dpkg -L openssh-server', '설치된 파일들'], ['dpkg -S /usr/bin/ls', 'coreutils: /usr/bin/ls'], ['sudo dpkg --configure -a', '중단된 설치 마무리']],
      see: ['apt(8)', 'dpkg-query(1)', 'dpkg-deb(1)', 'dpkg-reconfigure(8)']
    },
    snap: {
      sec: 8, en: 'Tool to interact with snaps', ko: 'snap 패키지 관리',
      syn: ['snap [OPTIONS] <command>'],
      desc: 'Canonical 의 snap 패키지를 설치 · 관리합니다. snap 은 필요한 라이브러리를 함께 담은 독립 패키지로, 격리(confinement)되어 실행되고 자동으로 업데이트됩니다. 설치한 명령은 /snap/bin 에 생깁니다.\nchannel(stable, candidate, beta, edge)로 받을 버전의 안정성을 고릅니다.',
      sects: [['COMMANDS', [['find QUERY', 'snap 스토어 검색'], ['info NAME', '정보와 채널별 버전'], ['install NAME', '설치'], ['list', '설치된 snap 목록'], ['refresh [NAME]', '업데이트 (이름을 안 주면 모두)'], ['remove NAME', '제거 (--purge 로 스냅샷 없이)'], ['revert NAME', '이전 리비전으로 되돌리기'], ['services', 'snap 이 제공하는 서비스 상태'], ['logs NAME', '서비스 로그'], ['connections NAME', '인터페이스 연결 상태']]]],
      opts: [['--classic', '격리 없이 설치 (classic confinement 가 필요한 snap)'], ['--channel=CHANNEL', '채널 지정 (예: --channel=latest/stable)'], ['--edge, --beta, --candidate, --stable', '채널 줄임 옵션'], ['--purge', '(remove) 자동 스냅샷을 남기지 않기']],
      ex: [['snap find hello', '검색'], ['sudo snap install hello-world', '설치'], ['sudo snap install code --classic', 'classic snap 설치'], ['snap list', '목록'], ['sudo snap refresh', '모두 업데이트']],
      see: ['apt(8)', 'snapd']
    },
    systemctl: {
      sec: 1, en: 'Control the systemd system and service manager', ko: '서비스(systemd 유닛) 관리',
      syn: ['systemctl [OPTIONS...] COMMAND [UNIT...]'],
      desc: 'systemd 가 관리하는 서비스(.service), 타이머, 소켓, 마운트 등의 유닛을 시작 · 중지하고, 부팅할 때 자동 시작할지 정하며, 상태를 확인합니다.\nstart/stop 은 지금 당장의 상태를, enable/disable 은 부팅 시 자동 시작 여부를 바꿉니다. 둘 다 하려면 enable --now 를 씁니다. 상태를 바꾸는 명령은 sudo 가 필요합니다.',
      sects: [['COMMANDS', [['status UNIT', '상태, 최근 로그, PID 보기 (Active: active (running) 확인)'], ['start / stop UNIT', '시작 / 중지'], ['restart UNIT', '재시작'], ['reload UNIT', '중지 없이 설정 다시 읽기 (지원하는 서비스만)'], ['enable / disable UNIT', '부팅 시 자동 시작 켜기 / 끄기'], ['is-active / is-enabled UNIT', '상태를 한 단어로 (스크립트용)'], ['mask / unmask UNIT', '아예 시작할 수 없게 막기 / 풀기'], ['daemon-reload', '유닛 파일을 고친 뒤 systemd 가 다시 읽게 하기'], ['list-units', '메모리에 올라온 유닛 목록'], ['list-unit-files', '설치된 유닛 파일과 enable 상태'], ['--failed', '실패한 유닛 목록'], ['cat UNIT', '유닛 파일 내용 보기'], ['edit UNIT', 'drop-in 으로 설정 덮어쓰기'], ['reboot / poweroff', '재부팅 / 전원 끄기']]]],
      opts: [['--now', 'enable/disable 과 함께: 바로 시작 / 중지도'], ['-t, --type=TYPE', '유닛 종류 (service, timer, socket ...)'], ['--state=STATE', '상태로 거르기 (running, failed ...)'], ['-a, --all', '비활성 유닛까지 모두'], ['-l, --full', '줄이지 않고 전체 출력'], ['--no-pager', '페이저(less) 없이 출력'], ['-q, --quiet', '출력 줄이기'], ['--user', '사용자 서비스 관리자에 연결']],
      ex: [['systemctl status nginx', '상태 확인 (q 로 나가기)'], ['sudo systemctl restart ssh', 'SSH 재시작'], ['sudo systemctl enable --now nginx', '지금 시작하고 부팅 시에도 자동 시작'], ['systemctl list-units --type=service --state=running', '실행 중인 서비스'], ['systemctl is-enabled cron', 'enabled / disabled']],
      see: ['journalctl(1)', 'systemd.unit(5)', 'systemd.service(5)', 'service(8)']
    },
    journalctl: {
      sec: 1, en: 'Print log entries from the systemd journal', ko: 'systemd 저널(로그) 보기',
      syn: ['journalctl [OPTIONS...] [MATCHES...]'],
      desc: 'systemd-journald 가 모은 로그(커널, 서비스, 인증 등)를 시간순으로 보여 줍니다. 기본적으로 less 로 보여 주며, 오래된 것부터 나옵니다.\n다른 사용자와 시스템 서비스의 로그를 모두 보려면 sudo 를 쓰거나 adm 또는 systemd-journal 그룹에 속해야 합니다.',
      opts: [['-u, --unit=UNIT', '해당 서비스의 로그만'], ['-f, --follow', '새 로그를 계속 출력 (tail -f 처럼)'], ['-n, --lines=N', '마지막 N 줄'], ['-e, --pager-end', '페이저에서 끝으로 바로 이동'], ['-r, --reverse', '최신 것부터'], ['-b, --boot[=ID]', '이번 부팅 이후 (-b -1 은 이전 부팅)'], ['-p, --priority=PRIORITY', '중요도로 거르기 (err, warning, info ...)'], ['-S, --since=, -U, --until=', '기간 (예: --since "1 hour ago", --since today)'], ['-k, --dmesg', '커널 메시지만'], ['-o, --output=MODE', '출력 형식 (short, verbose, json, cat ...)'], ['-x, --catalog', '설명 메시지 덧붙이기'], ['--no-pager', '페이저 없이 출력'], ['--disk-usage', '저널이 차지하는 디스크'], ['--vacuum-size=BYTES', '저널을 지정한 크기까지 줄이기 (예: 500M)']],
      ex: [['journalctl -u nginx -n 50', 'nginx 의 최근 50줄'], ['sudo journalctl -fu ssh', 'SSH 로그 실시간'], ['journalctl -p err -b', '이번 부팅 이후 오류만'], ['journalctl --since "10 min ago"', '최근 10분'], ['sudo journalctl --vacuum-size=200M', '로그 용량 줄이기']],
      see: ['systemctl(1)', 'dmesg(1)', 'journald.conf(5)']
    },
    service: {
      sec: 8, en: 'run a System V init script', ko: '서비스 시작 · 중지 (옛 방식)',
      syn: ['service SCRIPT COMMAND [OPTIONS]', 'service --status-all', 'service --help | -h | --version'],
      desc: '옛 System V init 스크립트 방식의 명령입니다. systemd 를 쓰는 Ubuntu 에서는 내부적으로 systemctl 로 전달됩니다. 새로 배울 때는 systemctl 을 쓰는 것을 권장합니다.',
      opts: [['--status-all', '모든 서비스 상태 ([ + ] 실행 중, [ - ] 중지)'], ['COMMAND', 'start, stop, restart, reload, status 등']],
      ex: [['sudo service nginx restart', 'systemctl restart nginx 와 같음'], ['service --status-all', '서비스 목록']],
      see: ['systemctl(1)', 'init(1)']
    },
    hostnamectl: {
      sec: 1, en: 'Control the system hostname', ko: '호스트 이름 보기 · 바꾸기',
      syn: ['hostnamectl [OPTIONS...] {COMMAND}'],
      desc: '호스트 이름과 운영체제, 커널, 하드웨어 정보를 보여 주고, 호스트 이름을 영구적으로 바꿉니다(/etc/hostname 수정). 바꾼 뒤 /etc/hosts 의 127.0.1.1 줄도 새 이름으로 맞춰 두는 것이 좋습니다.',
      sects: [['COMMANDS', [['status', '현재 설정 보기 (기본값)'], ['hostname [NAME]', '호스트 이름 보기 / 바꾸기 (예전 이름 set-hostname 도 동작)'], ['icon-name, chassis, deployment, location', '기타 메타 정보 설정']]]],
      opts: [['--static', '정적 호스트 이름(/etc/hostname)만'], ['--transient', '임시(커널) 호스트 이름만'], ['--pretty', '사람이 읽는 이름 (공백 · 한글 가능)']],
      ex: [['hostnamectl', '상태 보기'], ['sudo hostnamectl hostname web01', '호스트 이름을 web01 로'], ['sudo hostnamectl set-hostname web01', '같은 동작 (옛 형식)']],
      see: ['hostname(1)', 'hostname(5)', 'hosts(5)']
    },
    timedatectl: {
      sec: 1, en: 'Control the system time and date', ko: '시간 · 시간대 · NTP 설정',
      syn: ['timedatectl [OPTIONS...] {COMMAND}'],
      desc: '현재 시각(로컬, UTC, RTC), 시간대, NTP 동기화 상태를 보여 주고 바꿉니다. Ubuntu 는 systemd-timesyncd 로 인터넷 시간과 자동으로 맞춥니다. 한국 시간대는 Asia/Seoul 입니다.',
      sects: [['COMMANDS', [['status', '현재 상태 (기본값)'], ['show', '기계가 읽기 좋은 형식'], ['set-time TIME', '시각 직접 설정 (NTP 를 끈 뒤)'], ['set-timezone ZONE', '시간대 설정'], ['list-timezones', '시간대 목록'], ['set-ntp BOOL', 'NTP 동기화 켜기 / 끄기'], ['timesync-status', 'systemd-timesyncd 동기화 상태'], ['set-local-rtc BOOL', '하드웨어 시계를 로컬 시간으로 (보통 no)']]]],
      opts: [['--no-ask-password', '인증을 묻지 않기'], ['-a, --all', '(show) 빈 값도 모두'], ['-H, --host=[USER@]HOST', '원격 호스트에 적용']],
      ex: [['timedatectl', '상태'], ['sudo timedatectl set-timezone Asia/Seoul', '한국 시간대로'], ['timedatectl list-timezones | grep Asia', 'Asia 시간대들']],
      see: ['date(1)', 'systemd-timesyncd.service(8)', 'localtime(5)']
    },
    date: {
      sec: 1, en: 'print or set the system date and time', ko: '날짜 · 시각 보기 · 설정',
      syn: ['date [OPTION]... [+FORMAT]', 'date [-u|--utc|--universal] [MMDDhhmm[[CC]YY][.ss]]'],
      desc: '현재 날짜와 시각을 출력하거나 형식(+FORMAT)에 맞춰 출력합니다. 스크립트에서 백업 파일 이름에 날짜를 넣을 때 많이 씁니다. 시스템 시각 설정은 root 가 필요하며, 보통은 timedatectl 을 씁니다.',
      opts: [['-d, --date=STRING', '지금 대신 STRING 의 시각 (예: "tomorrow", "2 days ago", "@1700000000")'], ['-s, --set=STRING', '시각 설정 (root)'], ['-u, --utc', 'UTC 로 출력'], ['-I[FMT], --iso-8601[=FMT]', 'ISO 8601 형식 (date, hours, minutes, seconds)'], ['-R, --rfc-email', 'RFC 5322 형식 (메일 헤더)'], ['-r, --reference=FILE', 'FILE 의 수정 시각']],
      sects: [['FORMAT', [['%Y %m %d', '연(2024) 월(01~12) 일(01~31)'], ['%H %M %S', '시(00~23) 분 초'], ['%F', '%Y-%m-%d 와 같음'], ['%T', '%H:%M:%S 와 같음'], ['%A %a', '요일 이름 (Monday / Mon)'], ['%s', '1970-01-01 UTC 이후 초 (유닉스 시간)'], ['%j', '1년 중 몇 번째 날']]]],
      ex: [['date', '현재 날짜와 시각'], ['date +%F', '예: 2024-04-25'], ['tar czf backup-$(date +%Y%m%d).tgz ~/data', '날짜가 들어간 백업 파일'], ['date -d "+7 days" +%F', '7일 뒤 날짜']],
      see: ['timedatectl(1)', 'cal(1)', 'strftime(3)']
    },
    cal: {
      sec: 1, en: 'display a calendar', ko: '달력 보기',
      syn: ['cal [options] [[[day] month] year]', 'cal [options] [timestamp|monthname]'],
      desc: '이번 달의 달력을 보여 주며 오늘 날짜를 강조합니다. 연도만 주면 1년 전체를, 월과 연도를 주면 그 달을 보여 줍니다.',
      opts: [['-1, --one', '한 달만 (기본값)'], ['-3, --three', '지난달, 이번 달, 다음 달'], ['-y, --year', '올해 전체'], ['-n, --months NUMBER', 'NUMBER 개월'], ['-m, --monday', '월요일부터 시작'], ['-s, --sunday', '일요일부터 시작'], ['-j, --julian', '1년 중 몇 번째 날로 표시'], ['-w, --week[=NUMBER]', '주 번호 표시']],
      ex: [['cal', '이번 달'], ['cal -3', '석 달'], ['cal 12 2025', '2025년 12월'], ['cal 2025', '2025년 전체']],
      see: ['date(1)', 'ncal(1)']
    },
    uptime: {
      sec: 1, en: 'Tell how long the system has been running.', ko: '가동 시간과 부하 평균 보기',
      syn: ['uptime [options]'],
      desc: '현재 시각, 부팅 후 가동 시간, 로그인한 사용자 수, 최근 1분 · 5분 · 15분 동안의 부하 평균(load average)을 한 줄로 보여 줍니다. 부하 평균이 CPU 코어 수(nproc)보다 계속 높으면 시스템이 바쁘다는 뜻입니다.',
      opts: [['-p, --pretty', '가동 시간만 읽기 쉽게 (up 2 hours, 5 minutes)'], ['-s, --since', '부팅한 시각 (yyyy-mm-dd HH:MM:SS)']],
      ex: [['uptime', '한 줄 요약'], ['uptime -p', '가동 시간만'], ['uptime -s', '부팅 시각']],
      see: ['w(1)', 'top(1)', 'nproc(1)']
    },
    uname: {
      sec: 1, en: 'print system information', ko: '커널 · 시스템 정보 출력',
      syn: ['uname [OPTION]...'],
      desc: '커널 이름, 호스트 이름, 커널 릴리스(버전), 하드웨어 종류 등을 출력합니다. 옵션이 없으면 -s(커널 이름: Linux)와 같습니다. 배포판 버전은 lsb_release -a 나 /etc/os-release 로 봅니다.',
      opts: [['-a, --all', '모든 정보'], ['-s, --kernel-name', '커널 이름 (Linux)'], ['-n, --nodename', '호스트 이름'], ['-r, --kernel-release', '커널 릴리스 (예: 6.8.0-45-generic)'], ['-v, --kernel-version', '커널 빌드 정보'], ['-m, --machine', '하드웨어 이름 (x86_64, aarch64)'], ['-o, --operating-system', '운영체제 (GNU/Linux)']],
      ex: [['uname -a', '모든 정보'], ['uname -r', '커널 버전'], ['uname -m', 'CPU 아키텍처']],
      see: ['lsb_release(1)', 'hostnamectl(1)', 'os-release(5)']
    },
    lsb_release: {
      sec: 1, en: 'print distribution-specific information', ko: '배포판 정보 출력',
      syn: ['lsb_release [options]'],
      desc: '배포판 이름, 버전, 코드명(Ubuntu 24.04 는 noble)을 보여 줍니다. 같은 정보가 /etc/os-release 에도 있습니다.',
      opts: [['-a, --all', '모든 정보'], ['-i, --id', '배포판 ID (Ubuntu)'], ['-d, --description', '설명 (Ubuntu 24.04.x LTS)'], ['-r, --release', '버전 번호 (24.04)'], ['-c, --codename', '코드명 (noble)'], ['-s, --short', '머리말 없이 값만']],
      ex: [['lsb_release -a', '모든 정보'], ['lsb_release -cs', 'noble (저장소 주소 만들 때 자주 사용)']],
      see: ['uname(1)', 'os-release(5)']
    },
    shutdown: {
      sec: 8, en: 'Halt, power off or reboot the machine', ko: '시스템 끄기 · 재부팅 (예약 가능)',
      syn: ['shutdown [OPTIONS...] [TIME] [WALL...]'],
      desc: '시스템을 끄거나(-P, 기본) 재부팅(-r)합니다. TIME 은 now, +분, hh:mm 형식이며 생략하면 1분 뒤(+1)입니다. 예약하면 로그인한 사용자에게 알림(wall)을 보내고, 5분 전부터는 새 로그인을 막습니다. shutdown -c 로 취소합니다.',
      opts: [['-P, --poweroff', '전원 끄기 (기본값)'], ['-r, --reboot', '재부팅'], ['-H, --halt', '멈추기 (전원은 끄지 않음)'], ['-h', '--poweroff 와 같음'], ['-k', '실제로 끄지 않고 알림만 보내기'], ['-c', '예약된 종료 취소'], ['--no-wall', '알림 보내지 않기'], ['--show', '예약된 종료 보기']],
      ex: [['sudo shutdown now', '지금 끄기'], ['sudo shutdown -r +10 "점검 재부팅"', '10분 뒤 재부팅 (메시지 포함)'], ['sudo shutdown -h 23:00', '23시에 끄기'], ['sudo shutdown -c', '취소']],
      see: ['reboot(8)', 'systemctl(1)', 'halt(8)']
    },
    reboot: {
      sec: 8, names: 'halt, poweroff, reboot', en: 'Power off, reboot, or halt the machine', ko: '재부팅 · 전원 끄기',
      syn: ['halt [OPTIONS...]', 'poweroff [OPTIONS...]', 'reboot [OPTIONS...]'],
      desc: 'reboot 은 즉시 재부팅, poweroff 는 전원 끄기, halt 는 시스템 멈추기입니다. systemd 에서는 systemctl reboot 등과 같은 동작을 합니다. root 권한이 필요합니다.',
      opts: [['-p, --poweroff', '어떤 이름으로 실행했든 전원 끄기'], ['--reboot', '재부팅'], ['--halt', '멈추기'], ['-f, --force', '서비스를 정상 종료하지 않고 강제로 (위험)'], ['-w, --wtmp-only', '실제로 하지 않고 wtmp 기록만'], ['--no-wall', '알림 보내지 않기']],
      ex: [['sudo reboot', '재부팅'], ['sudo poweroff', '전원 끄기']],
      see: ['shutdown(8)', 'systemctl(1)']
    }
  });

  Object.assign(MAN, {
    tar: {
      sec: 1, en: 'an archiving utility', ko: '파일 묶기 · 풀기 (아카이브)',
      syn: ['tar {A|c|d|r|t|u|x}[GnSkUWOmpsMBiajJzZhPlRvwo] [ARG...]', 'tar -c [-f ARCHIVE] [OPTIONS] [FILE...]', 'tar -x [-f ARCHIVE] [OPTIONS] [MEMBER...]', 'tar -t [-f ARCHIVE] [OPTIONS] [MEMBER...]'],
      desc: '여러 파일과 디렉터리를 하나의 아카이브 파일(.tar)로 묶거나 풉니다. tar 자체는 압축하지 않으며, -z(gzip), -j(bzip2), -J(xz) 를 함께 주어 압축합니다.\n동작(c 만들기, x 풀기, t 목록) 하나와 -f 파일 이름을 반드시 줍니다. 대시 없이 tar czf 처럼 옛 형식으로도 씁니다. 풀 때는 압축 형식을 자동으로 알아냅니다.',
      opts: [['-c, --create', '새 아카이브 만들기'], ['-x, --extract', '아카이브 풀기'], ['-t, --list', '내용 목록 보기'], ['-f, --file=ARCHIVE', '아카이브 파일 이름 (- 는 표준 입출력)'], ['-v, --verbose', '처리하는 파일 이름 출력'], ['-z, --gzip', 'gzip 압축 (.tar.gz, .tgz)'], ['-j, --bzip2', 'bzip2 압축 (.tar.bz2)'], ['-J, --xz', 'xz 압축 (.tar.xz)'], ['-a, --auto-compress', '확장자를 보고 압축 방식 결정'], ['-C, --directory=DIR', 'DIR 로 이동한 뒤 작업 (풀 위치 지정)'], ['-r, --append', '기존 아카이브 끝에 파일 추가'], ['--exclude=PATTERN', '패턴에 맞는 파일 제외'], ['-p, --preserve-permissions', '권한 그대로 풀기 (root 는 기본)'], ['--strip-components=N', '풀 때 경로 앞 N 단계 없애기']],
      ex: [['tar -cvf docs.tar docs/', '묶기'], ['tar -czvf backup.tar.gz ~/project', 'gzip 으로 압축해 묶기'], ['tar -tzf backup.tar.gz', '내용 보기'], ['tar -xzvf backup.tar.gz -C /tmp', '/tmp 에 풀기'], ["sudo tar -czf etc-$(date +%F).tgz /etc", '/etc 백업']],
      see: ['gzip(1)', 'bzip2(1)', 'xz(1)', 'zip(1)']
    },
    gzip: {
      sec: 1, names: 'gzip, gunzip, zcat', en: 'compress or expand files', ko: '파일 압축 · 풀기 (.gz)',
      syn: ['gzip [ -acdfhklLnNrtvV19 ] [-S suffix] [ name ...  ]', 'gunzip [ -acfhklLnNrtvV ] [-S suffix] [ name ...  ]', 'zcat [ -fhLV ] [ name ...  ]'],
      desc: '파일을 압축해 이름 끝에 .gz 를 붙이고 원본은 지웁니다. gunzip(= gzip -d)은 반대로 풀고, zcat 은 풀어서 화면에 출력만 합니다. 여러 파일을 하나로 묶지는 않으므로 디렉터리는 tar 와 함께 씁니다.',
      opts: [['-d, --decompress', '압축 풀기 (gunzip)'], ['-c, --stdout', '결과를 표준 출력으로 (원본 유지)'], ['-k, --keep', '원본 파일 지우지 않기'], ['-r, --recursive', '디렉터리 안의 파일을 각각 압축'], ['-l, --list', '압축 전후 크기와 압축률'], ['-t, --test', '압축 파일이 온전한지 검사'], ['-v, --verbose', '파일마다 압축률 출력'], ['-1 ... -9', '속도(-1, --fast) ↔ 압축률(-9, --best), 기본 -6'], ['-f, --force', '이미 있어도 덮어쓰기']],
      ex: [['gzip access.log', 'access.log.gz 만들기 (원본 삭제)'], ['gzip -k data.csv', '원본 남기고 압축'], ['gunzip access.log.gz', '풀기'], ['zcat /var/log/syslog.2.gz | less', '풀지 않고 내용 보기']],
      see: ['tar(1)', 'bzip2(1)', 'xz(1)', 'zgrep(1)']
    },
    zip: {
      sec: 1, en: 'package and compress (archive) files', ko: 'zip 파일 만들기',
      syn: ['zip [-aABcdDeEfFghjklLmoqrRSTuvVwXyz!@$] [--longoption ...] [-b path] [-n suffixes] [-t date] [-tt date] [zipfile [file ...]] [-xi list]'],
      desc: 'Windows 와 호환되는 .zip 아카이브를 만듭니다. 묶기와 압축을 한 번에 하며 원본은 남겨 둡니다. 디렉터리를 넣으려면 -r 이 필요합니다. Ubuntu 에는 기본 설치되어 있지 않을 수 있습니다(sudo apt install zip).',
      opts: [['-r, --recurse-paths', '디렉터리를 하위까지 포함'], ['-q, --quiet', '조용히'], ['-e, --encrypt', '비밀번호로 암호화 (약한 방식)'], ['-u, --update', '바뀐 파일만 갱신'], ['-d, --delete', 'zip 안에서 파일 지우기'], ['-m, --move', '넣은 뒤 원본 지우기'], ['-x, --exclude', '제외할 파일 패턴'], ['-j, --junk-paths', '경로 없이 파일 이름만 저장'], ['-0 ... -9', '압축 안 함 ↔ 최대 압축']],
      ex: [['zip -r project.zip project/', '디렉터리 압축'], ["zip -r site.zip html -x '*.log'", '로그 파일 빼고'], ['zip -e secret.zip plan.txt', '비밀번호 걸기']],
      see: ['unzip(1)', 'tar(1)', 'gzip(1)']
    },
    unzip: {
      sec: 1, en: 'list, test and extract compressed files in a ZIP archive', ko: 'zip 파일 풀기',
      syn: ['unzip [-Z] [-cflptTuvz[abjnoqsCDKLMUVWX$/:^]] file[.zip] [file(s) ...] [-x xfile(s) ...] [-d exdir]'],
      desc: 'zip 아카이브의 파일을 현재 디렉터리(또는 -d 로 지정한 곳)에 풉니다. 같은 이름의 파일이 있으면 덮어쓸지 물어봅니다.',
      opts: [['-l', '내용 목록만 보기'], ['-d exdir', '풀 디렉터리 지정'], ['-o', '묻지 않고 덮어쓰기'], ['-n', '이미 있는 파일은 건너뛰기'], ['-q', '조용히'], ['-t', '압축 파일 검사'], ['-j', '경로를 무시하고 한 디렉터리에'], ['-x files', '제외할 파일']],
      ex: [['unzip project.zip', '현재 디렉터리에 풀기'], ['unzip -l project.zip', '내용 보기'], ['unzip -o site.zip -d /var/www/html', '덮어쓰며 지정한 곳에']],
      see: ['zip(1)', 'zipinfo(1)', 'tar(1)']
    },
    bzip2: {
      sec: 1, names: 'bzip2, bunzip2', en: 'a block-sorting file compressor, v1.0.8', ko: 'bzip2 압축 · 풀기 (.bz2)',
      syn: ['bzip2 [ -cdfkqstvzVL123456789 ] [ filenames ...  ]', 'bunzip2 [ -fkvsVL ] [ filenames ...  ]', 'bzcat [ -s ] [ filenames ...  ]'],
      desc: 'gzip 보다 느리지만 더 작게 압축합니다. 압축한 파일은 .bz2 가 붙고 원본은 지워집니다. tar 에서는 -j 옵션으로 씁니다.',
      opts: [['-d, --decompress', '풀기'], ['-z, --compress', '압축 (기본)'], ['-k, --keep', '원본 남기기'], ['-c, --stdout', '표준 출력으로'], ['-t, --test', '검사'], ['-f, --force', '덮어쓰기'], ['-v, --verbose', '자세히'], ['-1 ... -9', '블록 크기 (기본 -9)']],
      ex: [['bzip2 big.log', 'big.log.bz2 만들기'], ['bunzip2 big.log.bz2', '풀기'], ['tar -cjf docs.tar.bz2 docs/', 'tar 와 함께']],
      see: ['gzip(1)', 'xz(1)', 'tar(1)']
    },
    xz: {
      sec: 1, names: 'xz, unxz, xzcat, lzma, unlzma, lzcat', en: 'Compress or decompress .xz and .lzma files', ko: 'xz 압축 · 풀기 (.xz)',
      syn: ['xz [option...] [file...]'],
      desc: 'LZMA2 알고리즘으로 가장 작게 압축하는 편입니다(대신 느림). 커널 소스나 배포 파일에 많이 쓰입니다. 압축하면 .xz 가 붙고 원본은 지워집니다. tar 에서는 -J 옵션으로 씁니다.',
      opts: [['-d, --decompress', '풀기 (unxz)'], ['-z, --compress', '압축 (기본)'], ['-k, --keep', '원본 남기기'], ['-c, --stdout', '표준 출력으로'], ['-l, --list', '.xz 파일 정보'], ['-t, --test', '검사'], ['-T, --threads=N', '스레드 수 (0 = CPU 수만큼)'], ['-0 ... -9', '압축 수준 (기본 -6)'], ['-e, --extreme', '더 느리게, 조금 더 작게'], ['-v, --verbose', '진행 상황']],
      ex: [['xz -k image.raw', '원본을 남기고 압축'], ['unxz image.raw.xz', '풀기'], ['tar -cJf src.tar.xz src/', 'tar 와 함께']],
      see: ['gzip(1)', 'bzip2(1)', 'tar(1)']
    },
    ip: {
      sec: 8, en: 'show / manipulate routing, network devices, interfaces and tunnels', ko: '네트워크 인터페이스 · 주소 · 경로 보기 · 설정',
      syn: ['ip [ OPTIONS ] OBJECT { COMMAND | help }', 'OBJECT := { address | link | route | neigh | rule | netns | ... }', 'OPTIONS := { -V[ersion] | -h[uman-readable] | -s[tatistics] | -d[etails] | -4 | -6 | -br[ief] | -c[olor] | -j[son] ... }'],
      desc: '예전 ifconfig, route, arp 를 대신하는 네트워크 설정 도구입니다. OBJECT 와 COMMAND 는 앞 글자만 써도 됩니다(ip a = ip address show, ip r = ip route).\nip 로 바꾼 설정은 재부팅하면 사라지므로, 영구 설정은 netplan(/etc/netplan/*.yaml)으로 합니다. 설정을 바꾸는 명령은 sudo 가 필요합니다.',
      sects: [['OBJECTS', [['address (a)', 'IP 주소 (ip a, ip addr add 192.168.1.10/24 dev ens33)'], ['link (l)', '네트워크 장치 (ip link set ens33 up/down)'], ['route (r)', '라우팅 테이블 (ip route add default via 게이트웨이)'], ['neigh (n)', 'ARP / 이웃 캐시'], ['netns', '네트워크 네임스페이스']]]],
      opts: [['-br, -brief', '한 줄 요약 형식'], ['-c, -color', '색 사용'], ['-4 / -6', 'IPv4 / IPv6 만'], ['-s, -stats', '통계(패킷 수) 추가 (-s -s 는 더 자세히)'], ['-d, -details', '자세히'], ['-j, -json', 'JSON 출력']],
      ex: [['ip a', '모든 인터페이스와 IP 주소'], ['ip -br -c a', '간단히 색과 함께'], ['ip r', '라우팅 테이블 (default via = 기본 게이트웨이)'], ['sudo ip addr add 10.0.0.5/24 dev ens37', '임시로 주소 추가'], ['sudo ip link set ens37 up', '인터페이스 켜기']],
      see: ['ss(8)', 'netplan(5)', 'ping(8)', 'ip-address(8)', 'ip-route(8)']
    },
    ss: {
      sec: 8, en: 'another utility to investigate sockets', ko: '열린 포트 · 소켓 연결 보기',
      syn: ['ss [options] [ FILTER ]'],
      desc: '소켓(네트워크 연결) 정보를 보여 주는 도구로, 예전 netstat 을 대신합니다. 서버가 어느 포트에서 기다리고(LISTEN) 있는지 확인할 때 ss -tlnp 를 가장 많이 씁니다. 다른 사용자의 프로세스 이름(-p)을 보려면 sudo 가 필요합니다.',
      opts: [['-t, --tcp', 'TCP 소켓'], ['-u, --udp', 'UDP 소켓'], ['-l, --listening', '연결을 기다리는(LISTEN) 소켓만'], ['-a, --all', '모든 소켓 (LISTEN + 연결됨)'], ['-n, --numeric', '서비스 이름 대신 포트 번호'], ['-p, --processes', '소켓을 쓰는 프로세스'], ['-s, --summary', '요약 통계'], ['-4 / -6', 'IPv4 / IPv6 만'], ['-x, --unix', '유닉스 도메인 소켓'], ['-e, --extended', '자세한 정보']],
      ex: [['sudo ss -tlnp', 'TCP 로 열린 포트와 프로세스'], ['ss -tunap', 'TCP/UDP 모든 연결'], ["ss -tn state established '( dport = :22 )'", 'SSH 접속 중인 연결'], ['ss -s', '요약']],
      see: ['ip(8)', 'lsof(8)', 'netstat(8)']
    },
    ping: {
      sec: 8, en: 'send ICMP ECHO_REQUEST to network hosts', ko: '호스트에 닿는지 확인 (ICMP)',
      syn: ['ping [-aAbBdCDfhHLnOqrRUvV46] [-c count] [-F flowlabel] [-i interval] [-I interface] [-l preload] [-m mark] [-M pmtudisc_option] [-N nodeinfo_option] [-w deadline] [-W timeout] [-p pattern] [-Q tos] [-s packetsize] [-S sndbuf] [-t ttl] [-T timestamp option] [hop...] {destination}'],
      desc: '대상 호스트에 ICMP ECHO_REQUEST 를 보내고 응답(ECHO_REPLY)이 오는지, 왕복 시간(time)이 얼마인지 보여 줍니다. 리눅스에서는 멈출 때까지 계속 보내므로 Ctrl+C 로 끝내면 요약 통계가 나옵니다.\n방화벽이 ICMP 를 막으면 서버가 살아 있어도 응답이 없을 수 있습니다.',
      opts: [['-c count', 'count 번 보내고 끝내기'], ['-i interval', '보내는 간격(초, 기본 1)'], ['-W timeout', '응답을 기다리는 시간(초)'], ['-w deadline', '전체 실행 시간 제한(초)'], ['-s packetsize', '데이터 크기 (기본 56바이트)'], ['-t ttl', 'TTL 지정'], ['-4 / -6', 'IPv4 / IPv6 만'], ['-q', '요약만 출력'], ['-I interface', '보낼 인터페이스나 주소']],
      ex: [['ping -c 4 8.8.8.8', '인터넷 연결 확인 (4번)'], ['ping -c 3 google.com', 'DNS 까지 확인'], ['ping 192.168.0.1', '게이트웨이 확인 (Ctrl+C 로 끝)']],
      see: ['traceroute(1)', 'ip(8)', 'ss(8)']
    },
    curl: {
      sec: 1, en: 'transfer a URL', ko: 'URL 로 데이터 주고받기 (HTTP 요청)',
      syn: ['curl [options / URLs]'],
      desc: 'HTTP, HTTPS, FTP 등 여러 프로토콜로 데이터를 받거나 보냅니다. 기본적으로 받은 내용을 화면(표준 출력)에 출력합니다. 웹 서버나 API 를 시험할 때 가장 많이 쓰며, 파일로 저장하려면 -o 나 -O 를 씁니다.',
      opts: [['-o, --output <file>', '받은 내용을 파일로 저장'], ['-O, --remote-name', 'URL 의 파일 이름 그대로 저장'], ['-L, --location', '리다이렉트(301/302) 따라가기'], ['-I, --head', '헤더만 요청 (HEAD)'], ['-i, --include', '응답 헤더도 함께 출력'], ['-v, --verbose', '요청 · 응답 과정 자세히'], ['-s, --silent', '진행 표시와 오류 숨기기 (-sS 는 오류만 보이기)'], ['-X, --request <method>', 'HTTP 메서드 (POST, PUT, DELETE ...)'], ['-H, --header <header>', '요청 헤더 추가'], ['-d, --data <data>', 'POST 데이터 보내기'], ['--json <data>', 'JSON 데이터 보내기 (헤더 자동)'], ['-u, --user <user:password>', '인증 정보'], ['-k, --insecure', 'TLS 인증서 검사 안 함 (테스트용)'], ['-f, --fail', 'HTTP 오류(4xx/5xx)면 출력 없이 실패'], ['-w, --write-out <format>', '끝난 뒤 정보 출력 (예: %{http_code})']],
      ex: [['curl http://localhost', '로컬 웹 서버 응답 보기'], ['curl -I https://ubuntu.com', '헤더만'], ['curl -LO https://example.com/file.tar.gz', '파일 받기'], ["curl -X POST -H 'Content-Type: application/json' -d '{\"a\":1}' http://localhost:8000/api", 'JSON POST'], ["curl -s -o /dev/null -w '%{http_code}\\n' http://localhost", '상태 코드만']],
      see: ['wget(1)', 'ssh(1)']
    },
    wget: {
      sec: 1, en: 'The non-interactive network downloader.', ko: '파일 내려받기',
      syn: ['wget [option]... [URL]...'],
      desc: 'HTTP, HTTPS, FTP 로 파일을 내려받아 현재 디렉터리에 저장합니다. 사용자 입력 없이 동작하므로 스크립트나 백그라운드 다운로드에 좋고, 끊긴 다운로드를 이어 받거나 사이트 전체를 재귀적으로 받을 수도 있습니다.',
      opts: [['-O file', '저장할 파일 이름 (- 는 표준 출력)'], ['-P prefix', '저장할 디렉터리'], ['-c, --continue', '받다 만 파일 이어 받기'], ['-q, --quiet', '출력 없이'], ['-b, --background', '백그라운드로 (로그는 wget-log)'], ['-i file', '파일에 적힌 URL 들을 받기'], ['-r, --recursive', '링크를 따라 재귀적으로'], ['-np, --no-parent', '상위 디렉터리로 올라가지 않기'], ['-N, --timestamping', '서버 파일이 더 새로울 때만'], ['--limit-rate=amount', '속도 제한 (예: 200k)'], ['--no-check-certificate', '인증서 검사 안 함 (테스트용)']],
      ex: [['wget https://example.com/file.iso', '파일 받기'], ['wget -c https://example.com/big.iso', '이어 받기'], ['wget -qO- https://api.ipify.org', '내용을 화면에 출력']],
      see: ['curl(1)']
    },
    dig: {
      sec: 1, en: 'DNS lookup utility', ko: 'DNS 조회 (자세히)',
      syn: ['dig [@server] [-b address] [-c class] [-f filename] [-k filename] [-m] [-p port#] [-q name] [-t type] [-v] [-x addr] [-y [hmac:]name:key] [ [-4] | [-6] ] [name] [type] [class] [queryopt...]'],
      desc: 'DNS 서버에 질의해 응답을 자세히 보여 줍니다. 서버를 지정하지 않으면 /etc/resolv.conf 의 서버(Ubuntu 는 systemd-resolved, 127.0.0.53)에 묻습니다. 레코드 종류를 주지 않으면 A 레코드를 조회합니다. bind9-dnsutils 패키지에 들어 있습니다.',
      opts: [['@server', '질의할 DNS 서버 (예: @8.8.8.8)'], ['-t type', '레코드 종류 (A, AAAA, MX, NS, TXT, CNAME, SOA ...)'], ['-x addr', '역방향 조회 (IP → 이름)'], ['-p port', '포트 번호'], ['-4 / -6', 'IPv4 / IPv6 로만 질의'], ['+short', '답만 짧게'], ['+noall +answer', 'ANSWER 부분만'], ['+trace', '루트 서버부터 차례로 따라가기']],
      ex: [['dig ubuntu.com', 'A 레코드'], ['dig +short ubuntu.com', '주소만'], ['dig @8.8.8.8 ubuntu.com MX', '구글 DNS 에 MX 레코드 질의'], ['dig -x 8.8.8.8', '역방향 조회']],
      see: ['host(1)', 'nslookup(1)', 'resolvectl(1)', 'resolv.conf(5)']
    },
    nslookup: {
      sec: 1, en: 'query Internet name servers interactively', ko: 'DNS 조회 (간단 · 대화형)',
      syn: ['nslookup [-option] [name | -] [server]'],
      desc: '도메인 이름의 IP 주소(또는 반대)를 조회합니다. 이름을 주면 바로 한 번 조회하고, 인자 없이 실행하면 > 프롬프트가 나오는 대화형 모드가 됩니다(exit 로 끝). Windows 에도 있어 익숙한 도구이지만, 자세한 분석은 dig 가 낫습니다.',
      opts: [['-type=TYPE, -query=TYPE', '레코드 종류 (A, MX, NS, TXT ...)'], ['-port=PORT', 'DNS 포트'], ['-debug', '자세한 디버그 정보'], ['server', '두 번째 인자로 질의할 서버 지정']],
      ex: [['nslookup ubuntu.com', '주소 조회'], ['nslookup -type=mx gmail.com', 'MX 레코드'], ['nslookup ubuntu.com 1.1.1.1', '1.1.1.1 서버에 질의']],
      see: ['dig(1)', 'host(1)']
    },
    host: {
      sec: 1, en: 'DNS lookup utility', ko: 'DNS 조회 (한 줄 결과)',
      syn: ['host [-aACdlnrsTUwv] [-c class] [-N ndots] [-p port] [-R number] [-t type] [-W wait] [-m flag] [ [-4] | [-6] ] [-v] [-V] {name} [server]'],
      desc: '이름을 주면 IP 주소를, IP 주소를 주면 이름을 알려 주는 간단한 DNS 조회 도구입니다. 결과를 사람이 읽기 쉬운 한 줄 문장으로 보여 줍니다.',
      opts: [['-t type', '레코드 종류 (A, MX, NS, TXT ...)'], ['-a', '모든 레코드 자세히 (-v -t ANY)'], ['-v', '자세히'], ['-W wait', '응답 대기 시간(초)'], ['-4 / -6', 'IPv4 / IPv6 로만 질의']],
      ex: [['host ubuntu.com', 'IP 주소와 메일 서버'], ['host 8.8.8.8', '역방향 조회'], ['host -t ns ubuntu.com', '네임 서버']],
      see: ['dig(1)', 'nslookup(1)']
    },
    traceroute: {
      sec: 1, en: 'print the route packets trace to network host', ko: '목적지까지 거쳐 가는 경로 보기',
      syn: ['traceroute [-46dFITUnreAV] [-f first_ttl] [-g gate,...] [-i device] [-m max_ttl] [-p port] [-s src_addr] [-q nqueries] [-N squeries] [-t tos] [-l flow_label] [-w waittimes] [-z sendwait] [-UL] [-D] [-P proto] [--sport=port] [-M method] [-O mod_options] [--mtu] [--back] host [packet_len]'],
      desc: 'TTL 을 1 부터 늘려 가며 패킷을 보내 목적지까지 거치는 라우터(홉)와 각 구간의 응답 시간을 보여 줍니다. * * * 는 그 라우터가 응답하지 않았다는 뜻입니다. 기본은 UDP 를 쓰며 traceroute 패키지를 설치해야 합니다(tracepath 는 기본 설치).',
      opts: [['-n', '이름을 조회하지 않고 IP 만 (빠름)'], ['-m max_ttl', '최대 홉 수 (기본 30)'], ['-q nqueries', '홉마다 보낼 패킷 수 (기본 3)'], ['-w waittime', '응답 대기 시간'], ['-I, --icmp', 'ICMP ECHO 사용'], ['-T, --tcp', 'TCP SYN 사용 (방화벽 통과에 유리, root 필요)'], ['-p port', '포트 지정'], ['-4 / -6', 'IPv4 / IPv6']],
      ex: [['traceroute 8.8.8.8', '경로 보기'], ['traceroute -n ubuntu.com', '이름 조회 없이'], ['sudo traceroute -T -p 443 example.com', 'TCP 443 으로']],
      see: ['tracepath(8)', 'ping(8)', 'mtr(8)']
    },
    hostname: {
      sec: 1, en: "show or set the system's host name", ko: '호스트 이름 보기',
      syn: ['hostname [-a|--alias] [-d|--domain] [-f|--fqdn|--long] [-A|--all-fqdns] [-i|--ip-address] [-I|--all-ip-addresses] [-s|--short] [-y|--yp|--nis]', 'hostname [-b|--boot] [-F|--file filename] [hostname]'],
      desc: '시스템의 호스트 이름을 출력합니다. root 로 이름을 주면 바꿀 수 있지만 재부팅하면 원래대로 돌아가므로, 영구적으로 바꾸려면 hostnamectl hostname 을 씁니다. 내 IP 주소를 빨리 볼 때 hostname -I 가 편리합니다.',
      opts: [['-I, --all-ip-addresses', '모든 인터페이스의 IP 주소 (루프백 제외)'], ['-i, --ip-address', '호스트 이름으로 조회한 주소'], ['-f, --fqdn, --long', '전체 도메인 이름 (FQDN)'], ['-s, --short', '첫 점 앞까지의 짧은 이름'], ['-d, --domain', 'DNS 도메인 이름'], ['-A, --all-fqdns', '모든 FQDN']],
      ex: [['hostname', '호스트 이름'], ['hostname -I', '내 IP 주소들']],
      see: ['hostnamectl(1)', 'hosts(5)', 'hostname(5)']
    },
    netplan: {
      sec: 5, en: 'YAML network configuration abstraction for various backends', ko: 'netplan 네트워크 설정 파일 형식',
      syn: ['/{lib,etc,run}/netplan/*.yaml'],
      desc: 'Ubuntu 의 네트워크 설정은 /etc/netplan/ 아래의 YAML 파일에 적고, netplan 명령이 이를 systemd-networkd(서버) 또는 NetworkManager(데스크톱) 설정으로 바꿔 적용합니다. 파일은 이름순으로 읽으며 뒤의 파일이 앞의 설정을 덮어씁니다.\nYAML 은 들여쓰기(공백, 탭 금지)가 문법이므로 조심합니다. 파일 권한은 600(root 만 읽기)이어야 경고가 나지 않습니다. 고친 뒤에는 sudo netplan try 또는 sudo netplan apply 로 적용합니다.',
      sects: [['SAMPLE CONFIG', { pre: ['# /etc/netplan/50-cloud-init.yaml — 고정 IP 예', 'network:', '  version: 2', '  renderer: networkd', '  ethernets:', '    ens33:', '      dhcp4: false', '      addresses:', '        - 192.168.56.10/24', '      routes:', '        - to: default', '          via: 192.168.56.1', '      nameservers:', '        addresses: [8.8.8.8, 1.1.1.1]'] }],
        ['COMMANDS', [['netplan generate', 'YAML 을 백엔드 설정으로 변환만'], ['netplan try', '적용해 보고 120초 안에 Enter 를 누르지 않으면 되돌리기 (원격 작업 시 안전)'], ['netplan apply', '설정을 바로 적용'], ['netplan get [KEY]', '현재 설정 값 보기'], ['netplan set KEY=VALUE', '설정 값 바꾸기'], ['netplan status', '인터페이스 상태 보기']]]],
      opts: [['dhcp4: true|false', 'IPv4 주소를 DHCP 로 받을지'], ['addresses: [ADDR/PREFIX]', '고정 주소 목록'], ['routes: - to: default via: GW', '기본 게이트웨이 (옛 gateway4 는 사용 중단)'], ['nameservers: addresses:', 'DNS 서버 목록'], ['renderer: networkd|NetworkManager', '사용할 백엔드']],
      ex: [['ls /etc/netplan/', '설정 파일 확인'], ['sudo nano /etc/netplan/50-cloud-init.yaml', '편집'], ['sudo netplan try', '시험 적용'], ['sudo netplan apply', '적용'], ['ip -br a', '결과 확인']],
      see: ['netplan-apply(8)', 'netplan-try(8)', 'ip(8)', 'systemd-networkd(8)']
    },
    'netplan-apply': {
      sec: 8, en: 'apply current netplan config to running system', ko: 'netplan 설정 적용',
      syn: ['netplan [--debug] apply -h | --help', 'netplan [--debug] apply'],
      desc: '/etc/netplan/*.yaml 설정으로 백엔드 설정을 만들고(generate) 필요한 장치를 다시 설정합니다. 원격(SSH)으로 작업할 때 설정이 틀리면 접속이 끊길 수 있으므로 netplan try 를 먼저 쓰는 것이 안전합니다.',
      opts: [['--debug', '자세한 디버그 출력'], ['-h, --help', '도움말']],
      ex: [['sudo netplan apply', '적용']],
      see: ['netplan(5)', 'netplan-try(8)', 'netplan-generate(8)']
    },
    'netplan-try': {
      sec: 8, en: 'try a configuration, optionally rolling it back', ko: 'netplan 설정 시험 적용 (자동 되돌리기)',
      syn: ['netplan [--debug] try [--config-file CONFIG_FILE] [--timeout TIMEOUT]'],
      desc: '설정을 적용한 뒤 사용자가 Enter 로 확인하기를 기다립니다. 정해진 시간(기본 120초) 안에 확인하지 않으면 이전 설정으로 되돌립니다. 잘못된 설정으로 원격 접속이 끊기는 사고를 막아 줍니다.',
      opts: [['--timeout TIMEOUT', '되돌리기 전까지 기다릴 초'], ['--config-file FILE', '시험할 설정 파일 추가']],
      ex: [['sudo netplan try', '시험 적용 후 Enter 로 확정'], ['sudo netplan try --timeout 30', '30초 대기']],
      see: ['netplan(5)', 'netplan-apply(8)']
    },
    ufw: {
      sec: 8, en: 'program for managing a netfilter firewall', ko: '간단한 방화벽 설정 (Uncomplicated Firewall)',
      syn: ['ufw [--dry-run] enable|disable|reload', 'ufw [--dry-run] default allow|deny|reject [incoming|outgoing|routed]', 'ufw [--dry-run] logging on|off|LEVEL', 'ufw [--dry-run] reset', 'ufw [--dry-run] status [verbose|numbered]', 'ufw [--dry-run] show REPORT', 'ufw [--dry-run] [delete] [insert NUM] [prepend] allow|deny|reject|limit [in|out] [log|log-all] [ PORT[/PROTOCOL] | APPNAME ] [comment COMMENT]', 'ufw [--dry-run] [route] [delete] [insert NUM] [prepend] allow|deny|reject|limit [in|out on INTERFACE] [log|log-all] [proto PROTOCOL] [from ADDRESS [port PORT | app APPNAME ]] [to ADDRESS [port PORT | app APPNAME ]] [comment COMMENT]', 'ufw [--dry-run] delete NUM', 'ufw [--dry-run] app list|info|default|update'],
      desc: 'iptables/nftables 규칙을 쉬운 명령으로 관리하는 Ubuntu 기본 방화벽 도구입니다. 처음에는 꺼져(inactive) 있습니다. 기본 정책은 들어오는 연결 거부, 나가는 연결 허용입니다.\n원격(SSH)으로 접속한 서버에서 enable 하기 전에 반드시 ufw allow OpenSSH (또는 22/tcp)를 먼저 해야 접속이 끊기지 않습니다. 모든 명령은 sudo 가 필요합니다.',
      sects: [['COMMANDS', [['enable / disable', '방화벽 켜기 (부팅 시에도) / 끄기'], ['status [verbose|numbered]', '상태와 규칙 목록 (numbered 는 번호 포함)'], ['allow RULE', '허용 규칙 추가 (예: 80/tcp, 443, OpenSSH)'], ['deny RULE', '거부 (조용히 버림)'], ['reject RULE', '거부하고 거부 응답 보내기'], ['limit RULE', '30초에 6번 넘게 접속하는 IP 차단 (SSH 무차별 대입 방지)'], ['delete RULE|NUM', '규칙 지우기'], ['insert NUM RULE', 'NUM 번째 위치에 규칙 넣기'], ['default POLICY DIRECTION', '기본 정책 (예: default deny incoming)'], ['reset', '모든 규칙 지우고 끄기'], ['reload', '규칙 다시 읽기'], ['app list / app info NAME', '/etc/ufw/applications.d 의 앱 프로필'], ['logging on|off|LEVEL', '로그 설정 (/var/log/ufw.log)']]]],
      opts: [['--dry-run', '실제로 바꾸지 않고 결과만 보기'], ['--version', '버전']],
      ex: [['sudo ufw allow OpenSSH', 'SSH 허용 (가장 먼저!)'], ['sudo ufw enable', '켜기'], ['sudo ufw allow 80/tcp', '웹 허용'], ["sudo ufw allow 'Nginx Full'", '앱 프로필로 80, 443 허용'], ['sudo ufw allow from 192.168.0.0/24 to any port 3306', '특정 대역에서만 MySQL 허용'], ['sudo ufw status numbered', '번호와 함께 보기'], ['sudo ufw delete 3', '3번 규칙 지우기']],
      see: ['iptables(8)', 'ufw-framework(8)']
    },
    iptables: {
      sec: 8, names: 'iptables, ip6tables', en: 'administration tool for IPv4/IPv6 packet filtering and NAT', ko: '패킷 필터링 · NAT 규칙 관리 (저수준)',
      syn: ['iptables [-t table] {-A|-C|-D|-V} chain rule-specification', 'iptables [-t table] -I chain [rulenum] rule-specification', 'iptables [-t table] -D chain rulenum', 'iptables [-t table] -S [chain [rulenum]]', 'iptables [-t table] {-F|-L|-Z} [chain [rulenum]] [options...]', 'iptables [-t table] -P chain target'],
      desc: '리눅스 커널의 넷필터 규칙을 직접 다룹니다. 규칙은 테이블(filter, nat, mangle) 안의 체인(INPUT, OUTPUT, FORWARD ...)에 순서대로 들어가며, 패킷은 처음 일치한 규칙의 대상(ACCEPT, DROP, REJECT)대로 처리됩니다.\nUbuntu 24.04 의 iptables 는 nftables 백엔드(iptables-nft)를 씁니다. 규칙은 재부팅하면 사라지므로 iptables-persistent 등으로 저장하며, 보통은 ufw 를 쓰는 것이 간단합니다.',
      opts: [['-L, --list [chain]', '규칙 보기'], ['-n, --numeric', '이름 조회 없이 숫자로'], ['-v, --verbose', '패킷 · 바이트 수 등 자세히'], ['--line-numbers', '규칙 번호 표시'], ['-A, --append chain', '체인 끝에 규칙 추가'], ['-I, --insert chain [num]', '체인 앞(num 위치)에 넣기'], ['-D, --delete chain rule|num', '규칙 지우기'], ['-F, --flush [chain]', '규칙 모두 지우기'], ['-P, --policy chain target', '체인 기본 정책'], ['-t, --table table', '테이블 선택 (기본 filter)'], ['-p proto, --dport port', '프로토콜과 목적지 포트'], ['-s / -d address', '출발지 / 목적지 주소'], ['-i / -o interface', '들어오는 / 나가는 인터페이스'], ['-j target', 'ACCEPT, DROP, REJECT, LOG, MASQUERADE ...']],
      ex: [['sudo iptables -L -n -v --line-numbers', '규칙 자세히 보기'], ['sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT', '80 포트 허용'], ['sudo iptables -I INPUT -s 203.0.113.5 -j DROP', '특정 IP 차단'], ['sudo iptables -t nat -A POSTROUTING -o ens33 -j MASQUERADE', 'NAT(마스커레이드)']],
      see: ['ufw(8)', 'nft(8)', 'iptables-save(8)']
    }
  });

  Object.assign(MAN, {
    ssh: {
      sec: 1, en: 'OpenSSH remote login client', ko: '원격 서버에 안전하게 접속 (SSH 클라이언트)',
      syn: ['ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface] [-b bind_address] [-c cipher_spec] [-D [bind_address:]port] [-E log_file] [-e escape_char] [-F configfile] [-I pkcs11] [-i identity_file] [-J destination] [-L address] [-l login_name] [-m mac_spec] [-O ctl_cmd] [-o option] [-P tag] [-p port] [-R address] [-S ctl_path] [-W host:port] [-w local_tun[:remote_tun]] destination [command [argument ...]]'],
      desc: '암호화된 연결로 원격 서버에 로그인하거나 명령을 실행합니다. destination 은 user@host 형식이며, 처음 접속할 때는 서버 지문(fingerprint)을 확인하고 ~/.ssh/known_hosts 에 저장합니다.\n비밀번호 대신 키 인증을 쓰려면 ssh-keygen 으로 키를 만들고 ssh-copy-id 로 서버에 등록합니다. 자주 쓰는 접속 정보는 ~/.ssh/config 에 Host 별로 적어 둘 수 있습니다. 접속을 끝낼 때는 exit 또는 Ctrl+D 입니다.',
      opts: [['-p port', '포트 번호 (기본 22)'], ['-i identity_file', '사용할 개인 키 파일'], ['-l login_name', '로그인 사용자 (user@ 와 같음)'], ['-v', '자세한 디버그 출력 (-vvv 는 더 자세히, 접속 문제 해결용)'], ['-L [bind:]port:host:hostport', '로컬 포트 포워딩'], ['-R [bind:]port:host:hostport', '원격 포트 포워딩'], ['-D port', 'SOCKS 프록시 (동적 포워딩)'], ['-J destination', '점프 호스트(배스천)를 거쳐 접속'], ['-N', '원격 명령을 실행하지 않기 (포워딩 전용)'], ['-f', '인증 뒤 백그라운드로'], ['-t', '가상 터미널 강제 할당 (원격에서 대화형 명령 실행 시)'], ['-X', 'X11 포워딩'], ['-o option', '설정 옵션 지정 (예: -o StrictHostKeyChecking=no)'], ['-C', '압축 사용']],
      ex: [['ssh student@192.168.56.10', '원격 로그인'], ['ssh -p 2222 admin@server.example.com', '다른 포트로'], ['ssh -i ~/.ssh/aws.pem ubuntu@1.2.3.4', '키 파일 지정'], ["ssh web01 'df -h'", '원격 명령만 실행'], ['ssh -L 8080:localhost:80 web01', '내 8080 → 서버의 80']],
      see: ['scp(1)', 'sftp(1)', 'ssh-keygen(1)', 'ssh-copy-id(1)', 'ssh_config(5)', 'sshd_config(5)']
    },
    scp: {
      sec: 1, en: 'OpenSSH secure file copy', ko: 'SSH 로 파일 복사',
      syn: ['scp [-346ABCOpqRrsTv] [-c cipher] [-D sftp_server_path] [-F ssh_config] [-i identity_file] [-J destination] [-l limit] [-o ssh_option] [-P port] [-S program] [-X sftp_option] source ... target'],
      desc: 'SSH 연결로 컴퓨터 사이에 파일을 복사합니다. 원격 경로는 [user@]host:path 형식이며 path 가 상대 경로면 원격 홈 기준입니다. OpenSSH 9.0 부터는 내부적으로 SFTP 프로토콜을 사용합니다.\n포트는 ssh 와 달리 대문자 -P 입니다. 많은 파일을 동기화할 때는 rsync 가 더 효율적입니다.',
      opts: [['-P port', '포트 번호 (대문자 P)'], ['-r', '디렉터리를 재귀적으로 복사'], ['-p', '수정 시각 · 권한 보존'], ['-i identity_file', '개인 키 파일'], ['-q', '진행 표시 숨기기'], ['-C', '압축'], ['-l limit', '대역폭 제한 (Kbit/s)'], ['-J destination', '점프 호스트 거치기'], ['-3', '두 원격 호스트 사이 복사를 내 컴퓨터를 거쳐서'], ['-O', '옛 SCP 프로토콜 사용']],
      ex: [['scp report.pdf student@server:~/', '서버 홈으로 올리기'], ['scp student@server:/var/log/syslog .', '서버 파일 받기'], ['scp -r -P 2222 site/ admin@web01:/tmp/', '디렉터리를 다른 포트로']],
      see: ['sftp(1)', 'ssh(1)', 'rsync(1)']
    },
    'ssh-keygen': {
      sec: 1, en: 'OpenSSH authentication key utility', ko: 'SSH 키 만들기 · 관리',
      syn: ['ssh-keygen [-q] [-a rounds] [-b bits] [-C comment] [-f output_keyfile] [-m format] [-N new_passphrase] [-O option] [-t dsa | ecdsa | ecdsa-sk | ed25519 | ed25519-sk | rsa] [-w provider] [-Z cipher]', 'ssh-keygen -p [-a rounds] [-f keyfile] [-m format] [-N new_passphrase] [-P old_passphrase] [-Z cipher]', 'ssh-keygen -l [-v] [-E fingerprint_hash] [-f input_keyfile]', 'ssh-keygen -R hostname [-f known_hosts_file]'],
      desc: 'SSH 인증에 쓰는 공개 키/개인 키 쌍을 만듭니다. OpenSSH 9.5 부터 기본 종류는 ed25519 이며, 기본 파일은 ~/.ssh/id_ed25519 (개인 키)와 ~/.ssh/id_ed25519.pub (공개 키)입니다.\n개인 키는 절대 다른 곳에 복사하지 말고 권한을 600 으로 둡니다. 서버에는 공개 키만 ~/.ssh/authorized_keys 에 등록합니다(ssh-copy-id). 패스프레이즈를 걸면 키가 유출되어도 안전합니다.',
      opts: [['-t type', '키 종류 (ed25519, rsa, ecdsa ...)'], ['-b bits', '키 길이 (rsa 는 3072 기본, 4096 권장)'], ['-C comment', '설명 (보통 이메일이나 user@host)'], ['-f filename', '키 파일 이름'], ['-N passphrase', '새 패스프레이즈 (빈 문자열이면 없음)'], ['-p', '기존 키의 패스프레이즈 바꾸기'], ['-l', '키 지문(fingerprint) 보기'], ['-y', '개인 키에서 공개 키 출력'], ['-R hostname', 'known_hosts 에서 호스트 지우기 (서버를 다시 설치했을 때)'], ['-F hostname', 'known_hosts 에서 호스트 찾기']],
      ex: [['ssh-keygen', '기본값(ed25519)으로 키 만들기'], ['ssh-keygen -t ed25519 -C "student@lab"', '설명을 붙여 만들기'], ['ssh-keygen -t rsa -b 4096 -f ~/.ssh/legacy_rsa', 'RSA 키를 다른 이름으로'], ['ssh-keygen -lf ~/.ssh/id_ed25519.pub', '지문 확인'], ['ssh-keygen -R 192.168.56.10', '바뀐 서버의 옛 지문 지우기']],
      see: ['ssh(1)', 'ssh-copy-id(1)', 'ssh-add(1)', 'sshd(8)']
    },
    'ssh-copy-id': {
      sec: 1, en: 'use locally available keys to authorise logins on a remote machine', ko: '공개 키를 서버에 등록',
      syn: ['ssh-copy-id [-f] [-n] [-s] [-x] [-i [identity_file]] [-t target_path] [-F ssh_config] [[-o ssh_option] ...] [-p port] [user@]hostname'],
      desc: '내 공개 키를 원격 서버의 ~/.ssh/authorized_keys 에 추가해, 다음부터 비밀번호 없이 키로 로그인할 수 있게 합니다. 등록할 때 한 번은 비밀번호로 로그인해야 합니다. 원격 파일 권한도 알맞게 맞춰 줍니다.',
      opts: [['-i identity_file', '등록할 공개 키 파일 (기본은 가장 최근 ~/.ssh/id*.pub)'], ['-p port', 'SSH 포트'], ['-f', '이미 등록되어 있는지 확인하지 않고 강제로'], ['-n', '실제로 하지 않고 어떤 키를 보낼지만 보기'], ['-s', 'SFTP 로 authorized_keys 편집'], ['-o ssh_option', 'ssh 옵션 전달']],
      ex: [['ssh-copy-id student@192.168.56.10', '기본 키 등록'], ['ssh-copy-id -i ~/.ssh/id_ed25519.pub -p 2222 admin@web01', '키와 포트 지정'], ['ssh student@192.168.56.10', '이제 비밀번호 없이 접속']],
      see: ['ssh(1)', 'ssh-keygen(1)', 'sshd(8)']
    },
    rsync: {
      sec: 1, en: 'a fast, versatile, remote (and local) file-copying tool', ko: '빠른 파일 동기화 · 백업',
      syn: ['rsync [OPTION...] SRC... [DEST]', 'rsync [OPTION...] SRC... [USER@]HOST:DEST', 'rsync [OPTION...] [USER@]HOST:SRC... [DEST]'],
      desc: '파일을 로컬이나 SSH 로 원격에 복사하는데, 이미 있는 파일은 바뀐 부분만 보내므로 두 번째부터 매우 빠릅니다. 백업과 서버 배포에 많이 씁니다.\n원본 경로 끝의 / 에 주의합니다: src/ 는 "src 의 내용물"을, src 는 "src 디렉터리 자체"를 복사합니다. --delete 는 대상에만 있는 파일을 지우므로 -n 으로 먼저 확인합니다.',
      opts: [['-a, --archive', '보관 모드: 재귀 + 권한 · 시각 · 링크 · 소유자 보존 (-rlptgoD)'], ['-v, --verbose', '처리하는 파일 출력'], ['-z, --compress', '전송 중 압축'], ['-h, --human-readable', '크기를 읽기 쉽게'], ['-P', '--partial --progress: 진행률 표시, 중단 시 이어 받기'], ['-n, --dry-run', '실제로 하지 않고 무엇을 할지만'], ['--delete', '원본에 없는 파일을 대상에서 지우기 (완전 동기화)'], ['-e, --rsh=COMMAND', '원격 셸 지정 (예: -e "ssh -p 2222")'], ['--exclude=PATTERN', '제외할 패턴'], ['-u, --update', '대상 쪽이 더 새로우면 건너뛰기'], ['-r, --recursive', '재귀적으로 (-a 에 포함)']],
      ex: [['rsync -avh ~/project/ /backup/project/', '로컬 백업'], ['rsync -avzP site/ student@web01:/var/www/html/', '서버로 배포'], ['rsync -avn --delete src/ dst/', '완전 동기화 전에 미리 보기'], ['rsync -av -e "ssh -p 2222" web01:/etc/nginx/ ./nginx-conf/', '서버 설정 받기']],
      see: ['scp(1)', 'cp(1)', 'ssh(1)']
    },
    crontab: {
      sec: 1, en: 'maintain crontab files for individual users (Vixie Cron)', ko: '예약 작업(cron) 편집',
      syn: ['crontab [ -u user ] file', 'crontab [ -u user ] [ -i ] { -e | -l | -r }'],
      desc: 'cron 데몬이 정해진 시각마다 실행할 작업 목록(crontab)을 사용자별로 관리합니다. crontab -e 로 편집하면 편집기가 열리고, 저장하면 바로 적용됩니다(처음에는 편집기를 고르라고 묻습니다).\n작업은 "분 시 일 월 요일 명령" 한 줄로 적습니다(형식은 man 5 crontab). cron 은 PATH 가 짧고 환경 변수가 거의 없으므로 명령은 절대 경로로 쓰고, 출력은 파일로 리다이렉션하는 것이 좋습니다.',
      opts: [['-e', '내 crontab 편집'], ['-l', '내 crontab 보기'], ['-r', '내 crontab 전부 지우기 (조심!)'], ['-i', '-r 과 함께: 지우기 전에 확인'], ['-u user', '다른 사용자의 crontab (root 만)']],
      ex: [['crontab -e', '편집'], ['crontab -l', '보기'], ['sudo crontab -u www-data -l', 'www-data 의 crontab'], ['*/5 * * * * /home/student/check.sh >> /tmp/check.log 2>&1', '(파일 안) 5분마다 실행'], ['0 3 * * 0 /usr/local/bin/backup.sh', '(파일 안) 매주 일요일 03:00']],
      see: ['crontab(5)', 'cron(8)', 'systemd.timer(5)']
    },
    mount: {
      sec: 8, en: 'mount a filesystem', ko: '파일 시스템 연결(마운트)',
      syn: ['mount [-h|-V]', 'mount [-l] [-t fstype]', 'mount -a [-fFnrsvw] [-t fstype] [-O optlist]', 'mount [-fnrsvw] [-o options] device|mountpoint', 'mount [-fnrsvw] [-t fstype] [-o options] device mountpoint', 'mount --bind|--rbind|--move olddir newdir'],
      desc: '디스크 파티션, USB, ISO, 네트워크 공유 같은 파일 시스템을 디렉터리 트리의 한 지점(마운트 포인트)에 연결합니다. 인자 없이 쓰면 현재 마운트된 목록을 보여 줍니다(findmnt 가 더 보기 좋음).\n재부팅 후에도 자동으로 마운트하려면 /etc/fstab 에 적고 sudo mount -a 로 확인합니다. 마운트는 root 권한이 필요합니다.',
      opts: [['-t, --types fstype', '파일 시스템 종류 (ext4, xfs, vfat, nfs, iso9660 ...)'], ['-o, --options opts', '마운트 옵션 (ro, rw, noexec, remount, loop ...)'], ['-a, --all', '/etc/fstab 의 모든 항목 마운트 (noauto 제외)'], ['-r, --read-only', '읽기 전용 (-o ro)'], ['-w, --rw', '읽기 · 쓰기'], ['-B, --bind', '디렉터리를 다른 위치에 한 번 더 연결'], ['--mkdir', '마운트 포인트가 없으면 만들기'], ['-v, --verbose', '자세히'], ['-l', 'ext 파일 시스템의 레이블도 표시']],
      ex: [['sudo mount /dev/sdb1 /mnt', '/dev/sdb1 을 /mnt 에 연결'], ['sudo mount -t ext4 -o ro /dev/sdb1 /data', '읽기 전용으로'], ['sudo mount -o loop ubuntu.iso /mnt/iso', 'ISO 파일 마운트'], ['sudo mount -a', 'fstab 확인 (오류가 없어야 재부팅 안전)'], ['sudo mount -o remount,rw /', '다시 쓰기 가능으로']],
      see: ['umount(8)', 'fstab(5)', 'findmnt(8)', 'lsblk(8)', 'blkid(8)']
    },
    umount: {
      sec: 8, en: 'unmount filesystems', ko: '마운트 해제',
      syn: ['umount -a [-dflnrv] [-t fstype] [-O option...]', 'umount [-dflnrv] {directory|device}'],
      desc: '마운트된 파일 시스템을 분리합니다. 장치 이름이나 마운트 포인트 중 하나를 주면 됩니다. 명령 이름이 unmount 가 아니라 umount 임에 주의합니다.\n누군가 그 안의 파일을 쓰고 있거나 현재 디렉터리가 그 안이면 "target is busy" 오류가 납니다. 이때는 lsof +D 나 fuser -m 으로 사용 중인 프로세스를 찾습니다.',
      opts: [['-l, --lazy', '지금 분리하고, 사용 중인 참조는 끝나면 정리'], ['-f, --force', '강제로 (주로 연결이 끊긴 NFS)'], ['-R, --recursive', '하위 마운트까지 차례로'], ['-a, --all', '/proc/self/mountinfo 의 모든 파일 시스템'], ['-v, --verbose', '자세히']],
      ex: [['sudo umount /mnt', '마운트 포인트로 해제'], ['sudo umount /dev/sdb1', '장치 이름으로 해제'], ['sudo lsof +D /mnt', 'busy 일 때 사용 중인 프로세스 찾기']],
      see: ['mount(8)', 'fuser(1)', 'lsof(8)']
    },
    lsblk: {
      sec: 8, en: 'list block devices', ko: '디스크 · 파티션을 트리로 보기',
      syn: ['lsblk [options] [device...]'],
      desc: '디스크, 파티션, LVM 볼륨 같은 블록 장치를 트리 형태로 보여 줍니다. 이름(NAME), 주/부 번호, 크기(SIZE), 종류(TYPE: disk, part, lvm, rom), 마운트 위치(MOUNTPOINTS)를 한눈에 볼 수 있어 디스크 작업 전에 가장 먼저 씁니다.',
      opts: [['-f, --fs', '파일 시스템 정보 (FSTYPE, LABEL, UUID, 사용량)'], ['-a, --all', '빈 장치까지 모두'], ['-l, --list', '트리 대신 목록'], ['-p, --paths', '전체 경로 (/dev/sda1)'], ['-o, --output list', '보여 줄 열 지정 (NAME,SIZE,TYPE,MOUNTPOINT ...)'], ['-b, --bytes', '크기를 바이트로'], ['-d, --nodeps', '파티션 없이 디스크만'], ['-m, --perms', '소유자 · 권한'], ['-S, --scsi', 'SCSI 장치 정보'], ['-J, --json', 'JSON 출력']],
      ex: [['lsblk', '장치 트리'], ['lsblk -f', '파일 시스템과 UUID'], ['lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS', '열 골라 보기']],
      see: ['blkid(8)', 'fdisk(8)', 'df(1)', 'findmnt(8)']
    },
    blkid: {
      sec: 8, en: 'locate/print block device attributes', ko: '장치의 UUID · 파일 시스템 종류 보기',
      syn: ['blkid --label label | --uuid uuid', 'blkid [--no-encoding --garbage-collect --list-one --cache-file file] [--output format] [--match-tag tag] [--match-token NAME=value] [device...]', 'blkid --probe [--offset offset] [--output format] [--size size] [--match-tag tag] [--match-types list] [--usages list] [--no-part-details] device...'],
      desc: '블록 장치의 UUID, 레이블, 파일 시스템 종류(TYPE)를 보여 줍니다. /etc/fstab 에는 장치 이름(/dev/sdb1)이 바뀔 수 있으므로 UUID 로 적는 것이 안전하며, 그 UUID 를 확인할 때 씁니다. 정확한 정보를 보려면 sudo 로 실행합니다.',
      opts: [['-s, --match-tag tag', '특정 항목만 (UUID, TYPE, LABEL)'], ['-o, --output format', '출력 형식 (value, export, full, list)'], ['-U, --uuid uuid', '이 UUID 를 가진 장치 이름'], ['-L, --label label', '이 레이블을 가진 장치 이름'], ['-p, --probe', '캐시를 쓰지 않고 직접 검사']],
      ex: [['sudo blkid', '모든 장치'], ['sudo blkid /dev/sdb1', '특정 장치'], ['sudo blkid -s UUID -o value /dev/sdb1', 'UUID 값만 (fstab 에 쓸 때)']],
      see: ['lsblk(8)', 'fstab(5)', 'mount(8)']
    },
    fdisk: {
      sec: 8, en: 'manipulate disk partition table', ko: '파티션 나누기 (대화형)',
      syn: ['fdisk [options] device', 'fdisk -l [device...]'],
      desc: '디스크의 파티션 테이블(GPT 또는 MBR/DOS)을 만들고 파티션을 추가 · 삭제하는 대화형 도구입니다. 한 글자 명령을 입력하며, 모든 변경은 w 로 저장하기 전까지 메모리에만 있으므로 q 로 저장 없이 끝낼 수 있습니다.\n파티션을 만든 뒤에는 mkfs 로 파일 시스템을 만들고 mount 로 연결해야 쓸 수 있습니다. 데이터가 있는 디스크에서는 매우 조심해야 합니다.',
      sects: [['COMMANDS', [['m', '도움말 (명령 목록)'], ['p', '파티션 테이블 보기'], ['n', '새 파티션 만들기'], ['d', '파티션 지우기'], ['t', '파티션 종류 바꾸기 (Linux swap, Linux LVM ...)'], ['g / o', '새 GPT / DOS(MBR) 파티션 테이블 만들기'], ['l', '파티션 종류 목록'], ['w', '저장하고 끝내기'], ['q', '저장하지 않고 끝내기']]]],
      opts: [['-l, --list', '파티션 테이블 보고 끝내기'], ['-x, --list-details', '더 자세히'], ['-w, --wipe mode', '기존 서명 지우기 (auto, never, always)'], ['-t, --type type', '파티션 테이블 종류만 처리']],
      ex: [['sudo fdisk -l', '모든 디스크의 파티션 보기'], ['sudo fdisk /dev/sdb', '/dev/sdb 파티션 편집 시작'], ['sudo partprobe /dev/sdb', '바뀐 파티션을 커널에 알리기']],
      see: ['parted(8)', 'lsblk(8)', 'mkfs(8)', 'sfdisk(8)']
    },
    parted: {
      sec: 8, en: 'a partition manipulation program', ko: '파티션 편집 (스크립트 가능)',
      syn: ['parted [options] [device [command [options...]...]]'],
      desc: '파티션을 만들고, 지우고, 크기를 바꾸는 도구입니다. fdisk 와 달리 명령을 입력하는 즉시 디스크에 반영되므로 주의합니다. 2TB 가 넘는 디스크는 GPT(mklabel gpt)를 씁니다. -s 로 명령줄에서 한 번에 실행할 수도 있습니다.',
      sects: [['COMMANDS', [['print', '파티션 테이블 보기'], ['mklabel gpt|msdos', '새 파티션 테이블 (기존 파티션 모두 사라짐)'], ['mkpart [name] [fs-type] start end', '파티션 만들기 (예: mkpart primary ext4 1MiB 100%)'], ['rm NUMBER', '파티션 지우기'], ['resizepart NUMBER END', '파티션 끝 위치 바꾸기'], ['unit UNIT', '단위 (MiB, GB, %, s ...)'], ['name NUMBER NAME', 'GPT 파티션 이름'], ['set NUMBER FLAG on|off', '플래그 (boot, lvm, esp ...)'], ['quit', '끝내기']]]],
      opts: [['-l, --list', '모든 장치의 파티션 보기'], ['-s, --script', '질문 없이 스크립트 모드'], ['-a, --align type', '정렬 방식 (optimal 권장)']],
      ex: [['sudo parted -l', '모든 디스크 보기'], ['sudo parted /dev/sdb', '대화형 시작'], ['sudo parted -s /dev/sdb mklabel gpt mkpart primary ext4 1MiB 100%', '디스크 전체를 한 파티션으로']],
      see: ['fdisk(8)', 'lsblk(8)', 'mkfs(8)']
    },
    'mkfs.ext4': {
      sec: 8, names: 'mke2fs, mkfs.ext2, mkfs.ext3, mkfs.ext4', en: 'create an ext2/ext3/ext4 file system', ko: 'ext4 파일 시스템 만들기 (포맷)',
      syn: ['mkfs.ext4 [ -c | -l filename ] [ -b block-size ] [ -i bytes-per-inode ] [ -L volume-label ] [ -m reserved-blocks-percentage ] [ -n ] [ -N number-of-inodes ] [ -q ] [ -T usage-type ] [ -U UUID ] [ -F ] device [ fs-size ]'],
      desc: '파티션이나 논리 볼륨에 ext4 파일 시스템을 만듭니다(포맷). 장치에 있던 데이터는 모두 사라지므로 lsblk 로 장치 이름을 꼭 확인합니다. Ubuntu 기본 파일 시스템이 ext4 입니다.\n기본적으로 공간의 5% 를 root 용으로 예약하는데, 데이터 전용 디스크라면 -m 1 등으로 줄일 수 있습니다.',
      opts: [['-L volume-label', '레이블 지정 (최대 16바이트)'], ['-m percentage', 'root 예약 공간 비율 (기본 5)'], ['-b block-size', '블록 크기 (1024, 2048, 4096)'], ['-T usage-type', '용도별 설정 (news, largefile, huge ...)'], ['-i bytes-per-inode', '몇 바이트마다 inode 하나'], ['-N number-of-inodes', 'inode 개수 직접 지정'], ['-U UUID', 'UUID 지정'], ['-n', '실제로 만들지 않고 결과만 보기'], ['-F', '강제로 (이미 파일 시스템이 있거나 마운트된 것 같아도)'], ['-q', '조용히']],
      ex: [['sudo mkfs.ext4 /dev/sdb1', 'ext4 로 포맷'], ['sudo mkfs.ext4 -L data /dev/vg0/lv_data', '레이블과 함께'], ['sudo mkfs -t ext4 /dev/sdc1', 'mkfs 로 같은 동작']],
      see: ['mkfs(8)', 'mkfs.xfs(8)', 'tune2fs(8)', 'resize2fs(8)', 'fsck(8)']
    },
    mkswap: {
      sec: 8, en: 'set up a Linux swap area', ko: '스왑 영역 만들기',
      syn: ['mkswap [options] device [size]'],
      desc: '파티션이나 파일을 스왑 영역으로 준비합니다. 만든 뒤 swapon 으로 켜야 쓰이며, 부팅 때마다 켜려면 /etc/fstab 에 적습니다. 스왑 파일은 먼저 fallocate 나 dd 로 만들고 권한을 600 으로 둡니다.',
      opts: [['-L, --label label', '레이블 지정'], ['-U, --uuid UUID', 'UUID 지정'], ['-f, --force', '크기 등 검사를 무시하고 강제로'], ['-c, --check', '만들기 전에 불량 블록 검사'], ['-p, --pagesize size', '페이지 크기 지정']],
      ex: [['sudo fallocate -l 2G /swapfile', '2G 파일 만들기'], ['sudo chmod 600 /swapfile', '권한 설정'], ['sudo mkswap /swapfile', '스왑으로 준비'], ['sudo swapon /swapfile', '켜기']],
      see: ['swapon(8)', 'fallocate(1)', 'fstab(5)']
    },
    swapon: {
      sec: 8, names: 'swapon, swapoff', en: 'enable/disable devices and files for paging and swapping', ko: '스왑 켜기 · 끄기',
      syn: ['swapon [options] [specialfile...]', 'swapoff [-va] [specialfile...]'],
      desc: 'mkswap 으로 준비한 장치나 파일을 스왑으로 사용하기 시작합니다. swapoff 는 반대로 사용을 멈춥니다(스왑에 있던 내용은 메모리로 옮겨짐). 현재 스왑 상태는 swapon --show 나 free -h 로 봅니다.',
      opts: [['--show', '사용 중인 스왑 목록 (표 형식)'], ['-s, --summary', '요약 (옛 형식, --show 권장)'], ['-a, --all', '/etc/fstab 의 swap 항목 모두 켜기 (swapoff -a 는 모두 끄기)'], ['-p, --priority priority', '우선순위 (-1 ~ 32767, 높을수록 먼저 사용)'], ['-v, --verbose', '자세히']],
      ex: [['swapon --show', '현재 스왑'], ['sudo swapon /swapfile', '스왑 파일 켜기'], ['sudo swapoff /swapfile', '끄기'], ["echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab", '부팅 때마다 켜기']],
      see: ['mkswap(8)', 'free(1)', 'fstab(5)']
    },
    fallocate: {
      sec: 1, en: 'preallocate or deallocate space to a file', ko: '파일 공간을 미리 할당',
      syn: ['fallocate [-c|-p|-z] [-o offset] -l length [-n] filename', 'fallocate -d [-o offset] [-l length] filename', 'fallocate -x [-o offset] -l length filename'],
      desc: '실제로 데이터를 쓰지 않고 파일에 디스크 공간을 바로 할당합니다. dd 로 0 을 채우는 것보다 훨씬 빨라서 스왑 파일이나 큰 테스트 파일을 만들 때 씁니다. 크기에는 K, M, G 단위(1024 기준)를 쓸 수 있습니다.',
      opts: [['-l, --length length', '할당할 크기 (예: 1G, 512M)'], ['-o, --offset offset', '시작 위치'], ['-n, --keep-size', '파일 크기(보이는 크기)는 바꾸지 않기'], ['-d, --dig-holes', '0 으로 채워진 부분을 구멍(sparse)으로'], ['-p, --punch-hole', '범위를 구멍으로 만들어 공간 반환'], ['-x, --posix', 'posix_fallocate 방식 (0 을 실제로 씀)'], ['-v, --verbose', '자세히']],
      ex: [['fallocate -l 100M test.img', '100MiB 파일'], ['sudo fallocate -l 2G /swapfile', '스왑 파일용 2GiB']],
      see: ['truncate(1)', 'dd(1)', 'mkswap(8)']
    },
    pvcreate: {
      sec: 8, en: 'Initialize physical volume(s) for use by LVM', ko: 'LVM 물리 볼륨(PV) 만들기',
      syn: ['pvcreate position_args [option_args]'],
      desc: '디스크나 파티션을 LVM 이 쓸 수 있는 물리 볼륨(PV)으로 초기화합니다. LVM 의 순서는 PV 만들기(pvcreate) → 볼륨 그룹 만들기(vgcreate) → 논리 볼륨 만들기(lvcreate) → 파일 시스템 만들기(mkfs) 입니다. 확인은 pvs, pvdisplay 로 합니다.',
      opts: [['-f, --force', '확인 없이 강제로 (-ff 는 더 강하게)'], ['-y, --yes', '질문에 모두 yes'], ['-v, --verbose', '자세히'], ['-u, --uuid String', 'UUID 지정'], ['--dataalignment Size', '데이터 영역 정렬']],
      ex: [['sudo pvcreate /dev/sdb /dev/sdc', '두 디스크를 PV 로'], ['sudo pvs', 'PV 목록']],
      see: ['vgcreate(8)', 'lvcreate(8)', 'pvs(8)', 'pvdisplay(8)', 'lvm(8)']
    },
    vgcreate: {
      sec: 8, en: 'Create a volume group', ko: 'LVM 볼륨 그룹(VG) 만들기',
      syn: ['vgcreate position_args [option_args]', 'vgcreate VG_new PV ...'],
      desc: '하나 이상의 물리 볼륨(PV)을 묶어 볼륨 그룹(VG)이라는 저장 공간 풀을 만듭니다. 이후 이 풀에서 필요한 크기만큼 논리 볼륨(LV)을 떼어 씁니다. 나중에 vgextend 로 디스크를 추가해 풀을 키울 수 있습니다.',
      opts: [['-s, --physicalextentsize Size', 'PE(할당 단위) 크기 (기본 4MiB)'], ['-y, --yes', '질문에 모두 yes'], ['-v, --verbose', '자세히']],
      ex: [['sudo vgcreate vg_data /dev/sdb /dev/sdc', 'vg_data 만들기'], ['sudo vgs', 'VG 목록과 남은 공간(VFree)'], ['sudo vgextend vg_data /dev/sdd', '디스크 추가']],
      see: ['pvcreate(8)', 'lvcreate(8)', 'vgextend(8)', 'vgs(8)', 'lvm(8)']
    },
    lvcreate: {
      sec: 8, en: 'Create a logical volume', ko: 'LVM 논리 볼륨(LV) 만들기',
      syn: ['lvcreate option_args position_args [option_args] [position_args]', 'lvcreate -L|--size Size[m|UNIT] -n LV_new VG', 'lvcreate -l|--extents Number[PERCENT] -n LV_new VG'],
      desc: '볼륨 그룹(VG)에서 공간을 떼어 논리 볼륨(LV)을 만듭니다. 만든 LV 는 /dev/VG이름/LV이름 (또는 /dev/mapper/VG-LV) 으로 나타나며, mkfs 로 파일 시스템을 만들어 파티션처럼 씁니다. 스냅샷(-s)도 만들 수 있습니다.',
      opts: [['-L, --size Size', '크기 (예: 10G, 500M)'], ['-l, --extents Number[PERCENT]', 'PE 개수나 비율 (예: 100%FREE = 남은 공간 전부)'], ['-n, --name String', 'LV 이름'], ['-s, --snapshot', '스냅샷 LV 만들기'], ['-i, --stripes Number', '스트라이프 수 (여러 PV 에 나눠 쓰기)'], ['-T, --thin', '씬 프로비저닝'], ['-y, --yes', '질문에 모두 yes']],
      ex: [['sudo lvcreate -L 10G -n lv_web vg_data', '10G LV'], ['sudo lvcreate -l 100%FREE -n lv_backup vg_data', '남은 공간 전부'], ['sudo mkfs.ext4 /dev/vg_data/lv_web', '파일 시스템 만들기'], ['sudo lvs', 'LV 목록']],
      see: ['lvextend(8)', 'vgcreate(8)', 'lvs(8)', 'lvremove(8)', 'lvm(8)']
    },
    lvextend: {
      sec: 8, en: 'Add space to a logical volume', ko: 'LVM 논리 볼륨 크기 늘리기',
      syn: ['lvextend option_args position_args [option_args] [position_args]', 'lvextend -L|--size [+]Size[m|UNIT] LV', 'lvextend -l|--extents [+]Number[PERCENT] LV'],
      desc: '논리 볼륨(LV)의 크기를 늘립니다. 크기 앞에 + 를 붙이면 그만큼 추가, 없으면 그 크기가 됩니다. LV 만 늘리면 파일 시스템은 그대로이므로 -r 로 함께 늘리거나 resize2fs(ext4), xfs_growfs(xfs)를 따로 실행합니다. ext4 · xfs 는 마운트된 상태에서도 늘릴 수 있습니다.',
      opts: [['-L, --size [+]Size', '새 크기 또는 추가할 크기 (+5G)'], ['-l, --extents [+]Number[PERCENT]', 'PE 로 지정 (+100%FREE = 남은 공간 전부)'], ['-r, --resizefs', '파일 시스템 크기도 함께 늘리기'], ['-n, --nofsck', '파일 시스템 검사 건너뛰기']],
      ex: [['sudo lvextend -L +5G /dev/vg_data/lv_web', '5G 늘리기'], ['sudo lvextend -r -l +100%FREE /dev/ubuntu-vg/ubuntu-lv', 'Ubuntu 기본 LV 를 남은 공간만큼 + 파일 시스템까지'], ['sudo resize2fs /dev/vg_data/lv_web', '(따로) ext4 늘리기']],
      see: ['lvcreate(8)', 'lvreduce(8)', 'resize2fs(8)', 'xfs_growfs(8)']
    },
    resize2fs: {
      sec: 8, en: 'ext2/ext3/ext4 file system resizer', ko: 'ext4 파일 시스템 크기 바꾸기',
      syn: ['resize2fs [ -fFpPMbs ] [ -d debug-flags ] [ -S RAID-stride ] [ -z undo_file ] device [ new_size ]'],
      desc: 'ext2/3/4 파일 시스템의 크기를 바꿉니다. 크기를 주지 않으면 파티션(또는 LV) 크기에 맞게 늘립니다. 늘리기는 마운트된 상태에서 가능하지만, 줄이기는 마운트를 해제하고 e2fsck -f 를 먼저 해야 합니다.',
      opts: [['-f', '안전 검사를 무시하고 강제로'], ['-p', '진행률 표시'], ['-M', '가능한 최소 크기로 줄이기'], ['-P', '최소 크기 추정값만 출력'], ['new_size', '새 크기 (예: 20G, 단위 없으면 블록 수)']],
      ex: [['sudo resize2fs /dev/vg_data/lv_web', 'LV 크기에 맞게 늘리기'], ['sudo resize2fs /dev/sdb1 20G', '20G 로 (줄일 때는 먼저 umount, e2fsck -f)']],
      see: ['lvextend(8)', 'e2fsck(8)', 'growpart(1)', 'xfs_growfs(8)']
    },
    fsck: {
      sec: 8, en: 'check and repair a Linux filesystem', ko: '파일 시스템 검사 · 복구',
      syn: ['fsck [-lsAVRTMNP] [-r [fd]] [-C [fd]] [-t fstype] [filesystem...] [--] [fs-specific-options]'],
      desc: '파일 시스템의 오류를 검사하고 고칩니다. 실제 작업은 종류별 프로그램(ext4 는 e2fsck)이 합니다. 반드시 마운트를 해제한 상태에서 실행해야 하며, 마운트된 파일 시스템을 검사하면 오히려 망가질 수 있습니다.\n루트 파일 시스템은 부팅 과정에서 자동으로 검사됩니다. 종료 코드 0 은 오류 없음, 1 은 오류를 고쳤음을 뜻합니다.',
      opts: [['-A', '/etc/fstab 의 모든 파일 시스템 검사'], ['-t fstype', '파일 시스템 종류 지정'], ['-N', '실제로 하지 않고 무엇을 할지만'], ['-C', '진행률 표시'], ['-V', '자세히'], ['-y', '(e2fsck) 모든 질문에 yes'], ['-n', '(e2fsck) 읽기 전용 검사, 모든 질문에 no'], ['-f', '(e2fsck) 깨끗해 보여도 강제 검사'], ['-p, -a', '(e2fsck) 안전한 것은 묻지 않고 자동 수리']],
      ex: [['sudo umount /dev/sdb1', '먼저 해제'], ['sudo fsck /dev/sdb1', '검사'], ['sudo fsck -fy /dev/sdb1', '강제 검사, 자동 수리'], ['sudo e2fsck -n /dev/sdb1', '고치지 않고 확인만']],
      see: ['e2fsck(8)', 'mkfs(8)', 'fstab(5)']
    },
    dd: {
      sec: 1, en: 'convert and copy a file', ko: '블록 단위 복사 (디스크 이미지 등)',
      syn: ['dd [OPERAND]...', 'dd OPTION'],
      desc: '입력(if)을 블록 단위로 읽어 출력(of)에 그대로 씁니다. 디스크 전체 복제, USB 설치 디스크 만들기, 정해진 크기의 파일 만들기에 씁니다.\nof 를 잘못 지정하면 디스크 전체가 덮어써지므로(별명: disk destroyer) lsblk 로 장치 이름을 두 번 확인합니다. 옵션이 --x 형식이 아니라 이름=값 형식입니다.',
      opts: [['if=FILE', '입력 파일 (기본은 표준 입력)'], ['of=FILE', '출력 파일 (기본은 표준 출력)'], ['bs=BYTES', '한 번에 읽고 쓸 크기 (예: 4M)'], ['count=N', 'N 블록만 복사'], ['skip=N', '입력의 앞 N 블록 건너뛰기'], ['seek=N', '출력의 앞 N 블록 건너뛰고 쓰기'], ['status=progress', '진행 상황 표시'], ['conv=fsync', '끝나기 전에 디스크에 확실히 기록'], ['conv=notrunc', '출력 파일을 자르지 않기'], ['oflag=direct', '캐시를 거치지 않고 쓰기 (속도 측정)']],
      ex: [['dd if=/dev/zero of=test.img bs=1M count=100', '0 으로 채운 100MiB 파일'], ['sudo dd if=ubuntu.iso of=/dev/sdX bs=4M status=progress conv=fsync', 'USB 설치 디스크 만들기 (sdX 확인!)'], ['sudo dd if=/dev/sda of=mbr.bin bs=512 count=1', 'MBR 백업']],
      see: ['fallocate(1)', 'cp(1)', 'lsblk(8)']
    }
  });

  Object.assign(MAN, {
    nano: {
      sec: 1, en: "Nano's ANOther editor, inspired by Pico", ko: '쉬운 터미널 텍스트 편집기',
      syn: ['nano [options] [[+line[,column]] file]...', 'nano [options] [[+[crCR](/|?)string] file]...'],
      desc: '초보자가 쓰기 쉬운 터미널 편집기입니다. 열자마자 바로 입력할 수 있고, 화면 아래에 자주 쓰는 단축키가 늘 보입니다. ^ 는 Ctrl, M- 는 Alt 키를 뜻합니다.\n없는 파일 이름을 주면 새 파일로 열리고, 저장할 때 만들어집니다. root 소유 설정 파일은 sudo nano 로 엽니다.',
      sects: [['KEYS', [['^O (Ctrl+O)', '저장 (Enter 로 파일 이름 확인)'], ['^X', '끝내기 (저장 안 했으면 물어봄: Y/N)'], ['^W', '찾기 (M-W 다음 찾기)'], ['^\\', '찾아 바꾸기'], ['^K / ^U', '현재 줄 잘라내기 / 붙여넣기'], ['M-6', '현재 줄 복사'], ['^G', '도움말'], ['^C', '현재 커서 위치 (줄 번호)'], ['^_ (Ctrl+Shift+-)', '줄 번호로 이동'], ['M-U / M-E', '실행 취소 / 다시 실행']]]],
      opts: [['+LINE[,COLUMN]', '해당 줄(과 칸)에서 시작'], ['-l, --linenumbers', '왼쪽에 줄 번호 표시'], ['-m, --mouse', '마우스 사용'], ['-B, --backup', '저장할 때 백업 파일(이름~) 만들기'], ['-i, --autoindent', '새 줄을 앞줄과 같은 들여쓰기로'], ['-E, --tabstospaces', '탭을 공백으로'], ['-T, --tabsize=NUMBER', '탭 너비'], ['-v, --view', '읽기 전용으로 열기'], ['-Y, --syntax=NAME', '문법 강조 종류 지정']],
      ex: [['nano memo.txt', '파일 편집'], ['sudo nano /etc/hosts', 'root 파일 편집'], ['nano -l +25 script.sh', '줄 번호를 켜고 25번째 줄로']],
      see: ['vim(1)', 'nanorc(5)']
    },
    vim: {
      sec: 1, en: "Vi IMproved, a programmer's text editor", ko: '강력한 모드형 텍스트 편집기',
      syn: ['vim [options] [file ..]', 'vim [options] -', 'vim [options] -t tag', 'vim [options] -q [errorfile]'],
      desc: 'vi 를 개선한 편집기로, 거의 모든 리눅스 서버에 있습니다. 키를 누르면 바로 입력되는 것이 아니라 "모드"가 있다는 점이 가장 큰 특징입니다: 처음은 명령(노멀) 모드이고, i 를 눌러야 입력 모드가 되며, Esc 로 다시 명령 모드로 돌아옵니다.\n저장 · 종료 같은 명령은 명령 모드에서 : 를 누른 뒤 입력합니다. vimtutor 명령으로 30분짜리 연습을 할 수 있습니다.',
      sects: [['KEYS', [['i / a / o', '커서 앞 / 뒤 / 다음 줄에서 입력 모드 시작'], ['Esc', '명령(노멀) 모드로 돌아가기'], [':w', '저장'], [':q', '끝내기 (:q! 는 저장하지 않고 강제로)'], [':wq, :x, ZZ', '저장하고 끝내기'], ['h j k l', '왼쪽 아래 위 오른쪽 이동'], ['gg / G / :N', '처음 / 끝 / N번째 줄로'], ['dd / yy / p', '줄 잘라내기 / 복사 / 붙여넣기'], ['x', '글자 하나 지우기'], ['u / Ctrl+r', '실행 취소 / 다시 실행'], ['/패턴, n, N', '검색, 다음, 이전'], [':%s/old/new/g', '파일 전체에서 찾아 바꾸기'], [':set nu', '줄 번호 표시'], ['v, V', '글자 / 줄 단위 선택']]]],
      opts: [['+[num]', 'num 번째 줄(없으면 마지막 줄)에서 시작'], ['+/{pat}', 'pat 이 처음 나오는 줄에서 시작'], ['-R', '읽기 전용 (view 와 같음)'], ['-o[N] / -O[N]', '여러 파일을 가로 / 세로로 나눠 열기'], ['-d', 'diff 모드 (vimdiff)'], ['-u vimrc', '설정 파일 지정 (-u NONE 은 설정 없이)'], ['-c command', '파일을 연 뒤 명령 실행'], ['-n', '스왑 파일 쓰지 않기'], ['-b', '바이너리 모드']],
      ex: [['vim notes.txt', '파일 편집'], ['sudo vim /etc/ssh/sshd_config', '설정 파일 편집'], ['vim +/Port /etc/ssh/sshd_config', 'Port 가 있는 곳에서 시작'], ['vimdiff a.conf b.conf', '두 파일 비교'], ['vimtutor', '연습 과정']],
      see: ['vimtutor(1)', 'nano(1)', 'view(1)']
    },
    echo: {
      sec: 1, en: 'display a line of text', ko: '문자열 출력',
      syn: ['echo [SHORT-OPTION]... [STRING]...', 'echo LONG-OPTION'],
      desc: 'STRING 들을 공백으로 이어 한 줄로 출력합니다. bash 에서는 보통 내장 echo 가 실행됩니다. 변수 값을 확인하거나(echo $PATH) 리다이렉션으로 파일에 쓸 때 많이 씁니다.\n작은따옴표 안에서는 $변수가 풀리지 않고, 큰따옴표 안에서는 풀립니다. 복잡한 형식은 printf 가 더 안전합니다.',
      opts: [['-n', '끝에 줄바꿈을 붙이지 않기'], ['-e', '백슬래시 이스케이프 해석'], ['-E', '이스케이프 해석 안 함 (기본값)']],
      sects: [['ESCAPES (-e)', [['\\n', '줄바꿈'], ['\\t', '탭'], ['\\\\', '백슬래시'], ['\\c', '이후 출력 안 함'], ['\\e', 'ESC (색 코드용)']]]],
      ex: [['echo "Hello, $USER"', '변수와 함께 출력'], ["echo '$HOME'", '글자 그대로 $HOME'], ['echo -e "a\\tb\\nc"', '탭과 줄바꿈'], ["echo 'export EDITOR=vim' >> ~/.bashrc", '파일 끝에 한 줄 추가'], ['echo $?', '마지막 명령의 종료 코드']],
      see: ['printf(1)', 'bash(1)']
    },
    printf: {
      sec: 1, en: 'format and print data', ko: '형식에 맞춰 출력',
      syn: ['printf FORMAT [ARGUMENT]...', 'printf OPTION'],
      desc: 'C 언어의 printf 처럼 FORMAT 에 맞춰 인자를 출력합니다. echo 와 달리 줄바꿈을 자동으로 붙이지 않으므로 \\n 을 직접 씁니다. 인자가 형식보다 많으면 형식을 반복해서 씁니다. bash 에서는 보통 내장 printf 가 실행되며 -v 변수 옵션도 쓸 수 있습니다.',
      sects: [['FORMAT', [['%s', '문자열'], ['%d, %i', '정수'], ['%f, %.2f', '실수 (소수점 2자리)'], ['%x, %o', '16진수, 8진수'], ['%5s, %-10s', '폭 지정 (- 는 왼쪽 정렬)'], ['%b', '인자 안의 이스케이프 해석'], ['%%', '% 문자'], ['\\n, \\t', '줄바꿈, 탭']]]],
      opts: [['-v var', '(bash 내장) 출력 대신 변수에 저장']],
      ex: [["printf 'Hello %s\\n' World", 'Hello World'], ["printf '%-10s %5d\\n' apple 3 banana 12", '표 모양 정렬'], ["printf '%.2f\\n' 3.14159", '3.14'], ["printf '%s\\n' a b c", '한 줄에 하나씩']],
      see: ['echo(1)', 'printf(3)', 'bash(1)']
    },
    read: {
      sec: 1, bi: 1, en: 'read a line from the standard input and split it into fields', ko: '입력 한 줄을 변수에 읽기',
      syn: ['read [-ers] [-a array] [-d delim] [-i text] [-n nchars] [-N nchars] [-p prompt] [-t timeout] [-u fd] [name ...]'],
      desc: '표준 입력에서 한 줄을 읽어 IFS(기본 공백)로 나눈 뒤 차례로 변수에 넣습니다. 남은 단어는 모두 마지막 변수에 들어가며, 변수 이름을 주지 않으면 REPLY 에 저장됩니다.\n스크립트에서 사용자 입력을 받거나 while read line 으로 파일을 한 줄씩 처리할 때 씁니다. 백슬래시를 그대로 읽으려면 항상 -r 을 쓰는 것이 좋습니다.',
      opts: [['-p prompt', '입력 전에 안내 문구 출력'], ['-r', '백슬래시를 이스케이프로 해석하지 않기'], ['-s', '입력한 글자를 화면에 보이지 않기 (비밀번호)'], ['-t timeout', '초 안에 입력이 없으면 실패'], ['-n nchars', 'nchars 글자를 읽으면 바로 끝내기'], ['-a array', '단어들을 배열에 넣기'], ['-d delim', '줄바꿈 대신 delim 까지 읽기'], ['-u fd', '파일 디스크립터 fd 에서 읽기']],
      ex: [['read -p "이름: " name; echo "안녕, $name"', '입력 받기'], ['read -sp "비밀번호: " pw; echo', '입력 숨기기'], ['while IFS=: read -r user _ uid _; do echo "$user $uid"; done < /etc/passwd', '파일을 필드로 나눠 읽기']],
      see: ['bash(1)', 'help read']
    },
    test: {
      sec: 1, en: 'check file types and compare values', ko: '조건 검사 ([ ])',
      syn: ['test EXPRESSION', 'test', '[ EXPRESSION ]', '[ ]', '[ OPTION'],
      desc: 'EXPRESSION 이 참이면 종료 코드 0, 거짓이면 1 을 돌려줍니다. 출력은 없으며 if, &&, || 와 함께 씁니다. [ 는 test 의 다른 이름이며 마지막 인자로 ] 가 필요하고, 괄호와 인자 사이에 반드시 공백을 둡니다.\nbash 에서는 내장 test 가 실행됩니다. bash 의 [[ ]] 는 패턴 비교와 &&, || 를 지원하는 확장 문법입니다.',
      opts: [['-e FILE', '파일이 있음'], ['-f FILE', '일반 파일임'], ['-d FILE', '디렉터리임'], ['-L FILE', '심볼릭 링크임'], ['-r / -w / -x FILE', '읽기 / 쓰기 / 실행 가능'], ['-s FILE', '크기가 0 보다 큼'], ['-z STRING', '문자열 길이가 0'], ['-n STRING', '문자열 길이가 0 이 아님'], ['S1 = S2, S1 != S2', '문자열 같음 / 다름'], ['N1 -eq N2', '숫자 같음 (-ne, -lt, -le, -gt, -ge)'], ['! EXPR', '부정'], ['EXPR1 -a EXPR2, -o', '그리고 / 또는 (&&, || 권장)']],
      ex: [['[ -f /etc/passwd ] && echo 있음', '파일 확인'], ['if [ "$USER" = root ]; then echo 관리자; fi', '문자열 비교'], ['[ "$n" -gt 10 ]', '숫자 비교'], ['test -d ~/backup || mkdir ~/backup', '없으면 만들기']],
      see: ['bash(1)', 'expr(1)']
    },
    export: {
      sec: 1, bi: 1, en: 'set export attribute for shell variables', ko: '환경 변수로 내보내기',
      syn: ['export [-fn] [name[=value] ...]', 'export -p'],
      desc: '셸 변수에 export 속성을 붙여 이 셸에서 실행하는 모든 자식 프로세스에 환경 변수로 전달합니다. export 하지 않은 변수는 현재 셸 안에서만 보입니다.\n바꾼 값은 현재 셸이 끝나면 사라지므로, 계속 쓰려면 ~/.bashrc (또는 ~/.profile) 에 적습니다. 시스템 전체는 /etc/environment 에 적습니다.',
      opts: [['-p', 'export 된 변수 목록'], ['-n', 'export 속성 없애기'], ['-f', '함수를 내보내기']],
      ex: [['export EDITOR=vim', '기본 편집기 지정'], ['export PATH="$PATH:$HOME/bin"', 'PATH 에 디렉터리 추가'], ['export -p | grep LANG', '언어 관련 환경 변수']],
      see: ['env(1)', 'printenv(1)', 'bash(1)', 'environ(7)']
    },
    env: {
      sec: 1, en: 'run a program in a modified environment', ko: '환경 변수 보기 · 바꿔서 실행',
      syn: ['env [OPTION]... [-] [NAME=VALUE]... [COMMAND [ARG]...]'],
      desc: 'COMMAND 없이 쓰면 현재 환경 변수 목록을 출력합니다. NAME=VALUE 와 COMMAND 를 주면 그 환경 변수를 바꾼 상태로 명령을 실행합니다(현재 셸에는 영향 없음). 스크립트 첫 줄 #!/usr/bin/env python3 처럼 PATH 에서 인터프리터를 찾을 때도 씁니다.',
      opts: [['-i, --ignore-environment', '빈 환경에서 시작'], ['-u, --unset=NAME', '환경 변수 NAME 빼기'], ['-C, --chdir=DIR', '디렉터리를 바꾼 뒤 실행'], ['-S, --split-string=S', '한 인자를 여러 인자로 나누기 (#! 줄에서)'], ['-0, --null', '줄바꿈 대신 널 문자로 구분']],
      ex: [['env', '모든 환경 변수'], ['env | grep ^LANG', 'LANG 관련'], ['env LANG=C ls --help', '영어로 실행'], ['env -i bash --norc', '깨끗한 환경의 bash']],
      see: ['printenv(1)', 'export', 'environ(7)']
    },
    history: {
      sec: 1, bi: 1, en: 'display or manipulate the history list', ko: '명령 기록 보기 · 관리',
      syn: ['history [-c] [-d offset] [n]', 'history -anrw [filename]', 'history -ps arg [arg...]'],
      desc: '지금까지 입력한 명령을 번호와 함께 보여 줍니다. 셸이 끝날 때 ~/.bash_history 에 저장되며, 기록할 개수는 HISTSIZE, HISTFILESIZE 변수로 정합니다. HISTTIMEFORMAT 을 정하면 시각도 함께 보입니다.\n위/아래 화살표로 이전 명령을 부르고, Ctrl+R 로 기록을 검색할 수 있습니다.',
      opts: [['n', '최근 n 개만'], ['-c', '기록 모두 지우기'], ['-d offset', 'offset 번 기록 지우기'], ['-a', '이번 세션 기록을 파일에 추가'], ['-w', '현재 기록으로 파일 덮어쓰기'], ['-r', '파일의 기록을 읽어 추가']],
      sects: [['HISTORY EXPANSION', [['!!', '바로 앞 명령 (sudo !! 가 유용)'], ['!N', 'N 번 명령'], ['!-N', 'N 개 전 명령'], ['!문자열', '문자열로 시작하는 가장 최근 명령'], ['!$', '앞 명령의 마지막 인자']]]],
      ex: [['history 20', '최근 20개'], ['history | grep apt', 'apt 를 쓴 기록 찾기'], ['!42', '42번 명령 다시 실행'], ["export HISTTIMEFORMAT='%F %T '", '시각 표시']],
      see: ['bash(1)', 'fc']
    },
    alias: {
      sec: 1, bi: 1, names: 'alias, unalias', en: 'define or display aliases', ko: '명령 별명 만들기',
      syn: ['alias [-p] [name[=value] ... ]', 'unalias [-a] name [name ...]'],
      desc: '긴 명령에 짧은 이름을 붙입니다. 인자 없이 쓰면 정의된 별명 목록을 보여 줍니다. Ubuntu 의 ~/.bashrc 에는 ll, la, l 과 ls/grep 의 --color=auto 별명이 미리 들어 있습니다.\n명령줄에서 만든 별명은 셸을 끝내면 사라지므로 계속 쓰려면 ~/.bashrc 나 ~/.bash_aliases 에 적고 source ~/.bashrc 로 다시 읽습니다. 별명을 잠깐 무시하려면 \\ls 처럼 앞에 백슬래시를 붙입니다.',
      opts: [['-p', '(alias) 모든 별명을 다시 쓸 수 있는 형식으로'], ['-a', '(unalias) 모든 별명 지우기']],
      ex: [["alias ll='ls -alF'", '별명 만들기'], ["alias update='sudo apt update && sudo apt upgrade -y'", '여러 명령 묶기'], ['alias', '목록 보기'], ['unalias ll', '지우기'], ['type ll', '별명인지 확인']],
      see: ['bash(1)', 'type', 'source']
    },
    source: {
      sec: 1, bi: 1, names: 'source, .', en: 'execute commands from a file in the current shell', ko: '파일의 명령을 현재 셸에서 실행',
      syn: ['source filename [arguments]', '. filename [arguments]'],
      desc: '파일의 명령을 새 셸을 만들지 않고 현재 셸에서 실행합니다. 그래서 파일 안에서 정한 변수, 별명, 함수, cd 가 실행 후에도 그대로 남습니다. ./script.sh 로 실행하면 자식 셸에서 실행되어 이런 변경이 사라지는 것과 다릅니다.\n~/.bashrc 를 고친 뒤 바로 적용하거나 Python 가상 환경을 켤 때(source venv/bin/activate) 씁니다.',
      opts: [['filename', '실행할 파일 (/ 가 없으면 PATH 와 현재 디렉터리에서 찾음)']],
      ex: [['source ~/.bashrc', 'bashrc 다시 읽기'], ['. ~/.profile', '같은 동작'], ['source venv/bin/activate', 'Python 가상 환경 켜기']],
      see: ['bash(1)', 'exec']
    },
    bash: {
      sec: 1, en: 'GNU Bourne-Again SHell', ko: 'Ubuntu 기본 셸 (명령 해석기)',
      syn: ['bash [options] [command_string | file]'],
      desc: '명령을 읽어 해석하고 실행하는 셸입니다. 파이프(|), 리다이렉션(> >> <), 변수, 와일드카드(*), 조건문 · 반복문 · 함수 같은 프로그래밍 기능을 제공합니다.\n로그인 셸은 /etc/profile 과 ~/.profile 을, 대화형 셸은 ~/.bashrc 를 시작할 때 읽습니다. 스크립트는 첫 줄에 #!/bin/bash 를 적고 chmod +x 로 실행 권한을 주어 실행합니다.',
      opts: [['-c string', 'string 을 명령으로 실행'], ['-l, --login', '로그인 셸처럼 시작'], ['-i', '대화형 셸로 시작'], ['-x', '실행하는 명령을 + 와 함께 출력 (스크립트 디버깅)'], ['-e', '명령이 실패하면 바로 끝내기'], ['-n', '실행하지 않고 문법만 검사'], ['-v', '읽은 줄을 그대로 출력'], ['--norc', '~/.bashrc 를 읽지 않기'], ['--noprofile', '로그인 시작 파일을 읽지 않기'], ['-r, --restricted', '제한된 셸']],
      sects: [['FILES', [['/etc/profile', '로그인 셸의 시스템 전체 설정'], ['~/.profile', '로그인 셸의 개인 설정 (Ubuntu)'], ['~/.bashrc', '대화형 셸의 개인 설정 (별명, 프롬프트)'], ['~/.bash_history', '명령 기록'], ['~/.bash_logout', '로그인 셸이 끝날 때 실행']]]],
      ex: [['bash script.sh', '스크립트 실행'], ["bash -c 'echo $SHELL'", '명령 문자열 실행'], ['bash -x deploy.sh', '디버그 모드로 실행'], ['bash -n script.sh', '문법 검사']],
      see: ['sh(1)', 'dash(1)', 'help', 'chsh(1)']
    },
    man: {
      sec: 1, en: 'an interface to the system reference manuals', ko: '매뉴얼(설명서) 보기',
      syn: ['man [man options] [[section] page ...] ...', 'man -k [apropos options] regexp ...', 'man -f [whatis options] page ...', 'man -w|-W [man options] page ...'],
      desc: '명령, 설정 파일, 시스템 호출 등의 매뉴얼 페이지를 보여 줍니다. 페이지는 less 로 보여 주므로 화살표와 Space 로 넘기고, /단어 로 검색하며, q 로 끝냅니다.\n같은 이름이 여러 섹션에 있으면(passwd 명령과 /etc/passwd 파일) 섹션 번호로 구분합니다: man 5 passwd. 설명서에서는 passwd(5) 처럼 표기합니다. 이름이 기억나지 않으면 man -k 로 키워드를 검색합니다.',
      sects: [['SECTIONS', [['1', '일반 사용자 명령'], ['2', '시스템 호출 (커널 함수)'], ['3', '라이브러리 함수'], ['4', '특수 파일 (/dev)'], ['5', '파일 형식과 설정 파일 (/etc/passwd 등)'], ['6', '게임'], ['7', '기타 (규약, 개요: hier, regex, signal)'], ['8', '시스템 관리 명령 (보통 root)']]],
        ['KEYS', [['Space / b', '다음 / 이전 화면'], ['/단어, n', '검색, 다음 결과'], ['g / G', '처음 / 끝'], ['h', 'less 도움말'], ['q', '끝내기']]]],
      opts: [['-k, --apropos', '이름과 설명에서 키워드 검색 (apropos 와 같음)'], ['-f, --whatis', '한 줄 설명 (whatis 와 같음)'], ['-a, --all', '일치하는 모든 섹션의 페이지를 차례로'], ['-w, --where', '페이지 파일 위치만 출력'], ['-s, -S LIST', '찾을 섹션 지정']],
      ex: [['man ls', 'ls 설명서'], ['man 5 passwd', '/etc/passwd 파일 형식'], ['man -k firewall', 'firewall 관련 명령 찾기'], ['man -f passwd', 'passwd 가 있는 섹션들'], ['man man', 'man 자신의 설명서']],
      see: ['whatis(1)', 'apropos(1)', 'less(1)', 'help', 'info(1)']
    },
    whatis: {
      sec: 1, en: 'display one-line manual page descriptions', ko: '명령의 한 줄 설명 보기',
      syn: ['whatis [-dlv?V] [-r|-w] [-s list] [-m system[,...]] [-M path] [-L locale] [-C file] name ...'],
      desc: '각 매뉴얼 페이지의 NAME 부분에 있는 한 줄 설명을 보여 줍니다. 이름이 정확히 일치해야 하며, man -f 와 같습니다. 찾지 못하면 "nothing appropriate." 가 나옵니다.',
      opts: [['-r, --regex', '이름을 정규식으로'], ['-w, --wildcard', '이름에 와일드카드 사용'], ['-s, --sections=LIST', '섹션 지정'], ['-l, --long', '긴 설명도 자르지 않기']],
      ex: [['whatis ls', 'ls (1) - list directory contents'], ['whatis passwd', '섹션 1 과 5 모두']],
      see: ['apropos(1)', 'man(1)', 'mandb(8)']
    },
    apropos: {
      sec: 1, en: 'search the manual page names and descriptions', ko: '키워드로 매뉴얼 검색',
      syn: ['apropos [-dalv?V] [-e|-w|-r] [-s list] [-m system[,...]] [-M path] [-L locale] [-C file] keyword ...'],
      desc: '매뉴얼 페이지의 이름과 한 줄 설명에서 KEYWORD(기본은 정규식)를 찾아 목록으로 보여 줍니다. man -k 와 같습니다. 어떤 명령을 써야 할지 모를 때 유용합니다.',
      opts: [['-e, --exact', '단어 전체가 일치할 때만'], ['-a, --and', '키워드를 모두 포함하는 것만'], ['-w, --wildcard', '와일드카드 사용'], ['-r, --regex', '정규식 (기본값)'], ['-s, --sections=LIST', '섹션 지정'], ['-l, --long', '설명을 자르지 않기']],
      ex: [['apropos copy', 'copy 가 들어간 명령'], ['apropos -s 8 user', '관리 명령 중 user 관련'], ['man -k "^ssh"', 'ssh 로 시작하는 것']],
      see: ['whatis(1)', 'man(1)']
    }
  });

  Object.assign(MAN, {
    diff: {
      sec: 1, en: 'compare files line by line', ko: '두 파일의 차이 비교',
      syn: ['diff [OPTION]... FILES'],
      desc: '두 파일(또는 디렉터리)을 줄 단위로 비교해 다른 부분을 보여 줍니다. 같으면 아무것도 출력하지 않고 종료 코드 0, 다르면 1, 문제가 있으면 2 입니다.\n기본 형식에서 < 는 첫 파일, > 는 두 번째 파일의 줄입니다. 설정 파일을 고치기 전후를 비교하거나 패치를 만들 때 -u (unified) 형식을 가장 많이 씁니다.',
      opts: [['-u, -U NUM, --unified[=NUM]', '통합 형식 (앞뒤 NUM 줄 문맥, - 는 삭제, + 는 추가)'], ['-c, -C NUM', '문맥 형식'], ['-y, --side-by-side', '양쪽을 나란히'], ['-q, --brief', '다른지 여부만'], ['-s, --report-identical-files', '같을 때도 알려 주기'], ['-r, --recursive', '디렉터리를 재귀적으로 비교'], ['-N, --new-file', '한쪽에만 있는 파일은 빈 파일로 보고 비교'], ['-i, --ignore-case', '대소문자 무시'], ['-w, --ignore-all-space', '공백 모두 무시'], ['-B, --ignore-blank-lines', '빈 줄 차이 무시'], ['--color[=WHEN]', '색 사용']],
      ex: [['diff old.conf new.conf', '기본 형식'], ['diff -u nginx.conf.bak nginx.conf', '통합 형식'], ['diff -y --width=100 a.txt b.txt', '나란히'], ['diff -rq dir1 dir2', '디렉터리에서 다른 파일만']],
      see: ['cmp(1)', 'diff3(1)', 'patch(1)', 'vimdiff(1)']
    },
    tree: {
      sec: 1, en: 'list contents of directories in a tree-like format.', ko: '디렉터리 구조를 나무 모양으로',
      syn: ['tree [-acdfghilnpqrstuvxACDFJQNSUX] [-L level [-R]] [-H baseHREF] [-T title] [-o filename] [-P pattern] [-I pattern] [--gitignore] [--du] [--prune] [--dirsfirst] [--] [directory ...]'],
      desc: '디렉터리와 파일을 들여쓰기 선으로 연결한 나무 모양으로 보여 주고, 마지막에 디렉터리와 파일 개수를 알려 줍니다. 기본 설치가 아니므로 sudo apt install tree 로 설치합니다.',
      opts: [['-a', '숨김 파일까지'], ['-d', '디렉터리만'], ['-L level', '최대 깊이'], ['-f', '전체 경로로 표시'], ['-h', '크기를 읽기 쉽게'], ['-p', '권한 표시'], ['-u / -g', '소유자 / 그룹 표시'], ['-D', '수정 시각 표시'], ['-I pattern', '패턴에 맞는 것 제외 (예: -I node_modules)'], ['-P pattern', '패턴에 맞는 파일만'], ['--dirsfirst', '디렉터리를 먼저'], ['-C', '항상 색 사용']],
      ex: [['tree', '현재 디렉터리'], ['tree -L 2 /etc/nginx', '2단계까지'], ['tree -a -I .git', '.git 은 빼고 숨김 파일까지']],
      see: ['ls(1)', 'find(1)']
    },
    lsof: {
      sec: 8, en: 'list open files', ko: '열린 파일 · 포트를 쓰는 프로세스 찾기',
      syn: ['lsof [ -?abChlnNOPRtUvVX ] [ -A A ] [ -c c ] [ +c c ] [ +|-d d ] [ +|-D D ] [ +|-e s ] [ +|-f [cfgGn] ] [ -F [f] ] [ -g [s] ] [ -i [i] ] [ -k k ] [ +|-L [l] ] [ +|-m m ] [ +|-M ] [ -o [o] ] [ -p s ] [ +|-r [t[m<fmt>]] ] [ -s [p:s] ] [ -S [t] ] [ -T [t] ] [ -u s ] [ +|-w ] [ -x [fl] ] [ -z [z] ] [ -Z [Z] ] [ -- ] [names]'],
      desc: '프로세스가 열고 있는 파일 목록을 보여 줍니다. 리눅스에서는 네트워크 소켓, 디렉터리, 장치도 파일이므로 "어떤 프로세스가 이 포트를 쓰는지", "umount 가 안 되는 이유" 를 찾을 때 유용합니다. 다른 사용자의 프로세스까지 보려면 sudo 가 필요합니다.',
      opts: [['-i [addr]', '네트워크 연결 (예: -i :80, -i TCP, -i @10.0.0.1)'], ['-p PID', '해당 프로세스가 연 파일'], ['-u user', '해당 사용자의 프로세스'], ['-c name', '명령 이름이 name 으로 시작하는 프로세스'], ['+D dir', 'dir 아래에서 열린 파일 (재귀)'], ['-n', 'IP 를 이름으로 바꾸지 않기'], ['-P', '포트 번호를 서비스 이름으로 바꾸지 않기'], ['-t', 'PID 만 출력 (kill 과 함께)'], ['-s TCP:LISTEN', '(-i 와 함께) 상태로 거르기']],
      ex: [['sudo lsof -i :80', '80 포트를 쓰는 프로세스'], ['sudo lsof -nP -iTCP -sTCP:LISTEN', '열린 TCP 포트'], ['sudo lsof +D /mnt', '/mnt 를 사용 중인 프로세스'], ['lsof -p $$', '현재 셸이 연 파일']],
      see: ['ss(8)', 'fuser(1)', 'ps(1)']
    },
    dmesg: {
      sec: 1, en: 'print or control the kernel ring buffer', ko: '커널 메시지 보기',
      syn: ['dmesg [options]', 'dmesg --clear', 'dmesg --read-clear [options]', 'dmesg --console-level level', 'dmesg --console-on', 'dmesg --console-off'],
      desc: '커널이 남긴 메시지(부팅 과정, 장치 인식, 드라이버 오류, 메모리 부족으로 프로세스 종료 등)를 보여 줍니다. USB 나 디스크를 연결한 직후 장치 이름을 확인할 때도 씁니다.\nUbuntu 는 보안을 위해 일반 사용자의 dmesg 사용을 막아 두어(kernel.dmesg_restrict=1) sudo 가 필요합니다. journalctl -k 로도 볼 수 있습니다.',
      opts: [['-H, --human', '읽기 쉽게 (시각, 색, 페이저)'], ['-T, --ctime', '사람이 읽는 시각으로 표시'], ['-w, --follow', '새 메시지를 계속 기다리기'], ['-l, --level list', '수준으로 거르기 (err,warn ...)'], ['-f, --facility list', '기능으로 거르기 (kern, user ...)'], ['-x, --decode', '기능과 수준을 글자로'], ['-L, --color', '색 사용'], ['-c, --read-clear', '출력한 뒤 버퍼 비우기'], ['-C, --clear', '버퍼 비우기']],
      ex: [['sudo dmesg | tail', '최근 커널 메시지'], ['sudo dmesg -T -l err,warn', '오류 · 경고만 시각과 함께'], ['sudo dmesg -w', '실시간 (USB 연결 확인 등)']],
      see: ['journalctl(1)', 'syslogd(8)']
    },
    watch: {
      sec: 1, en: 'execute a program periodically, showing output fullscreen', ko: '명령을 주기적으로 실행해 보기',
      syn: ['watch [option ...] command'],
      desc: 'COMMAND 를 정해진 간격(기본 2초)마다 실행하고 화면 전체에 결과를 새로 보여 줍니다. 디스크 사용량, 접속 수, 파일 변화처럼 바뀌는 값을 지켜볼 때 씁니다. Ctrl+C 로 끝냅니다. 파이프가 있는 명령은 따옴표로 감쌉니다.',
      opts: [['-n, --interval seconds', '실행 간격 (초, 소수 가능)'], ['-d, --differences[=permanent]', '바뀐 부분 강조'], ['-t, --no-title', '맨 위 제목 줄 숨기기'], ['-g, --chgexit', '출력이 바뀌면 끝내기'], ['-e, --errexit', '명령이 오류를 내면 멈추기'], ['-b, --beep', '명령이 실패하면 삑 소리'], ['-c, --color', 'ANSI 색 해석'], ['-x, --exec', '셸을 거치지 않고 실행'], ['-p, --precise', '정확한 간격 유지']],
      ex: [['watch -n 1 free -h', '1초마다 메모리'], ["watch -d 'ss -tn | grep :22'", 'SSH 연결 변화 강조'], ['watch -n 5 df -h /', '5초마다 디스크']],
      see: ['top(1)', 'tail(1)']
    },
    tmux: {
      sec: 1, en: 'terminal multiplexer', ko: '터미널 여러 개 · 세션 유지',
      syn: ['tmux [-2CDlNuVv] [-c shell-command] [-f file] [-L socket-name] [-S socket-path] [-T features] [command [flags]]'],
      desc: '한 터미널 안에서 여러 창(window)과 분할 화면(pane)을 쓰게 해 주고, 세션을 떼어(detach) 두었다가 나중에 다시 붙일(attach) 수 있습니다. SSH 연결이 끊겨도 tmux 안의 작업은 계속 실행되므로 서버에서 오래 걸리는 작업에 유용합니다.\n단축키는 모두 접두 키 Ctrl+b 를 누른 뒤 다음 키를 누릅니다.',
      sects: [['COMMANDS', [['tmux', '새 세션 시작'], ['tmux new -s NAME', '이름 있는 세션 시작'], ['tmux ls', '세션 목록'], ['tmux attach -t NAME', '세션에 다시 붙기 (tmux a)'], ['tmux kill-session -t NAME', '세션 끝내기']]],
        ['KEYS (Ctrl+b 다음)', [['d', '세션 떼어 내기 (detach)'], ['c', '새 창'], ['n / p / 0-9', '다음 / 이전 / 번호 창으로'], [', (쉼표)', '창 이름 바꾸기'], ['%', '좌우로 나누기'], ['"', '위아래로 나누기'], ['방향키, o', '다른 pane 으로 이동'], ['z', 'pane 확대 / 복귀'], ['x', 'pane 닫기'], ['[', '스크롤 · 복사 모드 (q 로 나감)'], ['w, s', '창 / 세션 목록에서 고르기'], ['?', '단축키 목록']]]],
      opts: [['-L socket-name', '다른 서버 소켓 이름'], ['-f file', '설정 파일 (기본 ~/.tmux.conf)'], ['-u', 'UTF-8 사용'], ['-V', '버전']],
      ex: [['tmux new -s work', 'work 세션 시작'], ['(Ctrl+b d)', '떼어 내기 → 로그아웃해도 계속 실행'], ['tmux a -t work', '다시 붙기']],
      see: ['screen(1)', 'nohup(1)']
    },
    screen: {
      sec: 1, en: 'screen manager with VT100/ANSI terminal emulation', ko: '터미널 세션 유지 (옛 방식 멀티플렉서)',
      syn: ['screen [ -options ] [ cmd [ args ] ]', 'screen -r [[pid.]tty[.host]]', 'screen -r sessionowner/[[pid.]tty[.host]]'],
      desc: 'tmux 와 비슷하게 여러 창을 쓰고 세션을 떼었다 붙일 수 있는 오래된 도구입니다. 단축키는 접두 키 Ctrl+a 를 누른 뒤 다음 키를 누릅니다. 새로 배운다면 tmux 를 권장하지만 많은 서버에 설치되어 있습니다.',
      sects: [['KEYS (Ctrl+a 다음)', [['d', '세션 떼어 내기'], ['c', '새 창'], ['n / p', '다음 / 이전 창'], ['"', '창 목록'], ['A', '창 이름 바꾸기'], ['S / |', '위아래 / 좌우로 나누기'], ['Tab', '나눈 영역 이동'], ['k', '창 닫기'], ['[', '복사 · 스크롤 모드'], ['?', '도움말']]]],
      opts: [['-S sessionname', '세션 이름 지정'], ['-ls, -list', '세션 목록'], ['-r [session]', '떼어 둔 세션에 다시 붙기'], ['-d -r', '다른 곳에 붙은 세션을 떼어 와서 붙기'], ['-x', '이미 붙어 있는 세션에 함께 붙기'], ['-L', '로그 기록 켜기']],
      ex: [['screen -S build', 'build 세션 시작'], ['screen -ls', '목록'], ['screen -r build', '다시 붙기']],
      see: ['tmux(1)', 'nohup(1)']
    },
    docker: {
      sec: 1, en: 'Docker image and container command line interface', ko: '컨테이너 관리 (Docker)',
      syn: ['docker [OPTIONS] COMMAND [ARG...]'],
      desc: '이미지를 받아 격리된 컨테이너로 실행하고 관리합니다. 이미지는 실행에 필요한 파일을 담은 틀이고, 컨테이너는 그 이미지로 만든 실행 중인 인스턴스입니다. Ubuntu 에서는 sudo apt install docker.io 로 설치합니다.\ndocker 명령은 root 권한이 필요하며, sudo 없이 쓰려면 사용자를 docker 그룹에 추가(sudo usermod -aG docker $USER)하고 다시 로그인합니다.',
      sects: [['COMMANDS', [['run IMAGE', '새 컨테이너 만들어 실행'], ['ps [-a]', '실행 중인 (-a 는 모든) 컨테이너'], ['images', '받은 이미지 목록'], ['pull IMAGE', '이미지 받기'], ['build -t NAME .', 'Dockerfile 로 이미지 만들기'], ['exec -it CONTAINER bash', '실행 중인 컨테이너 안에서 명령 실행'], ['logs [-f] CONTAINER', '컨테이너 출력(로그)'], ['stop / start / restart', '중지 / 시작 / 재시작'], ['rm CONTAINER', '컨테이너 삭제'], ['rmi IMAGE', '이미지 삭제'], ['inspect OBJECT', '자세한 정보 (JSON)'], ['volume, network', '볼륨 · 네트워크 관리'], ['compose up -d', 'compose.yaml 의 서비스들 실행 (compose 플러그인)'], ['system prune', '안 쓰는 데이터 정리']]]],
      opts: [['-d, --detach', '(run) 백그라운드 실행'], ['-it', '(run/exec) 대화형 터미널 연결'], ['--name NAME', '(run) 컨테이너 이름'], ['-p HOST:CONTAINER', '(run) 포트 연결'], ['-v HOST:CONTAINER', '(run) 볼륨 · 디렉터리 연결'], ['-e KEY=VALUE', '(run) 환경 변수'], ['--rm', '(run) 끝나면 컨테이너 자동 삭제'], ['--restart POLICY', '(run) 재시작 정책 (unless-stopped, always)']],
      ex: [['sudo docker run hello-world', '동작 확인'], ['docker run -d --name web -p 8080:80 nginx', 'nginx 컨테이너를 8080 포트로'], ['docker ps', '실행 중인 컨테이너'], ['docker exec -it web bash', '컨테이너 안으로'], ['docker logs -f web', '로그 보기'], ['docker stop web && docker rm web', '멈추고 지우기']],
      see: ['docker-run(1)', 'docker-compose(1)', 'dockerd(8)']
    },
    nginx: {
      sec: 8, en: 'HTTP and reverse proxy server, mail proxy server', ko: '웹 서버 · 리버스 프록시',
      syn: ['nginx [-?hqTtVv] [-c file] [-e file] [-g directives] [-p prefix] [-s signal]'],
      desc: '가볍고 빠른 웹 서버이자 리버스 프록시입니다. Ubuntu 에서는 sudo apt install nginx 로 설치하면 서비스로 등록되어 바로 실행되고, systemctl 로 관리합니다.\n주 설정 파일은 /etc/nginx/nginx.conf 이고, 사이트별 설정은 /etc/nginx/sites-available/ 에 만든 뒤 sites-enabled/ 에 링크해 켭니다. 기본 웹 루트는 /var/www/html, 로그는 /var/log/nginx/ 입니다. 설정을 고친 뒤에는 반드시 nginx -t 로 검사하고 reload 합니다.',
      opts: [['-t', '설정 파일 문법 검사 (sudo nginx -t)'], ['-T', '검사 후 전체 설정 출력'], ['-s signal', '실행 중인 마스터에 신호: stop, quit, reload, reopen'], ['-c file', '다른 설정 파일 사용'], ['-g directives', '전역 지시어 추가 (예: "daemon off;")'], ['-p prefix', '경로 접두어'], ['-v / -V', '버전 / 빌드 옵션까지'], ['-q', '검사할 때 오류 말고는 출력 안 함']],
      sects: [['FILES', [['/etc/nginx/nginx.conf', '주 설정'], ['/etc/nginx/sites-available/', '사이트 설정 보관'], ['/etc/nginx/sites-enabled/', '켜진 사이트 (링크)'], ['/var/www/html/', '기본 웹 루트'], ['/var/log/nginx/access.log, error.log', '접속 · 오류 로그']]]],
      ex: [['sudo nginx -t', '설정 검사'], ['sudo systemctl reload nginx', '설정 다시 읽기 (접속 끊김 없음)'], ['sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/', '사이트 켜기'], ['curl -I http://localhost', '응답 확인']],
      see: ['systemctl(1)', 'curl(1)', 'apache2ctl(8)']
    },
    apache2ctl: {
      sec: 8, names: 'apache2ctl, apachectl', en: 'Apache HTTP server control interface', ko: 'Apache 웹 서버 제어',
      syn: ['apache2ctl [httpd-argument]', 'apache2ctl command'],
      desc: 'Apache 웹 서버(apache2)를 제어하고 설정을 검사합니다. Ubuntu 에서는 시작 · 중지를 systemctl 로 하고, apache2ctl 은 주로 configtest 나 -S 로 설정을 점검할 때 씁니다.\n설정은 /etc/apache2/apache2.conf 와 sites-available, mods-available, conf-available 디렉터리로 나뉘며 a2ensite, a2enmod 등으로 켭니다.',
      sects: [['COMMANDS', [['configtest, -t', '설정 문법 검사 (Syntax OK)'], ['-S', '가상 호스트 설정 요약'], ['-M', '불러온 모듈 목록'], ['start / stop / restart', '시작 / 중지 / 재시작'], ['graceful', '접속을 끊지 않고 재시작'], ['graceful-stop', '처리 중인 요청을 마치고 중지'], ['status / fullstatus', '상태 (mod_status 필요)']]]],
      ex: [['sudo apache2ctl configtest', '설정 검사'], ['sudo apache2ctl -S', '가상 호스트 확인'], ['sudo systemctl reload apache2', '설정 적용']],
      see: ['a2ensite(8)', 'a2enmod(8)', 'systemctl(1)']
    },
    a2ensite: {
      sec: 8, names: 'a2ensite, a2dissite', en: 'enable or disable an apache2 site / virtual host', ko: 'Apache 사이트 켜기 · 끄기',
      syn: ['a2ensite [ [-q|--quiet] site]', 'a2dissite [ [-q|--quiet] site]'],
      desc: '/etc/apache2/sites-available/ 의 사이트 설정(이름.conf)을 sites-enabled/ 에 링크로 걸어 켜거나(a2ensite) 링크를 지워 끕니다(a2dissite). 설정 이름에서 .conf 는 생략할 수 있습니다. 적용하려면 sudo systemctl reload apache2 를 실행합니다.\n모듈은 a2enmod/a2dismod, 추가 설정은 a2enconf/a2disconf 로 같은 방식으로 관리합니다.',
      opts: [['-q, --quiet', '안내 메시지 숨기기'], ['-p, --purge', '(a2dissite) 관련 기록까지 지우기']],
      ex: [['sudo a2ensite mysite', 'mysite.conf 켜기'], ['sudo a2dissite 000-default', '기본 사이트 끄기'], ['sudo a2enmod rewrite', 'rewrite 모듈 켜기'], ['sudo systemctl reload apache2', '적용']],
      see: ['apache2ctl(8)', 'a2enmod(8)', 'a2enconf(8)']
    },
    mysql: {
      sec: 1, en: 'the MySQL command-line client', ko: 'MySQL 접속 클라이언트',
      syn: ['mysql [options] db_name'],
      desc: 'MySQL(또는 MariaDB) 서버에 접속해 SQL 문을 실행하는 대화형 클라이언트입니다. mysql> 프롬프트에서 SQL 을 입력하고 ; 로 끝내며, exit 또는 \\q 로 나갑니다.\nUbuntu 의 MySQL root 계정은 기본적으로 auth_socket 인증을 써서 비밀번호 대신 sudo mysql 로 접속합니다. 비밀번호를 명령줄에 직접 쓰면 기록에 남으므로 -p 만 쓰고 입력하는 것이 좋습니다.',
      opts: [['-u, --user=name', '접속할 사용자'], ['-p, --password[=pw]', '비밀번호 (값을 안 주면 물어봄)'], ['-h, --host=name', '서버 주소 (기본 localhost)'], ['-P, --port=#', '포트 (기본 3306)'], ['-D, --database=name', '사용할 데이터베이스'], ['-e, --execute=stmt', 'SQL 문 하나를 실행하고 끝내기'], ['-B, --batch', '탭으로 구분된 출력 (스크립트용)'], ['-N, --skip-column-names', '열 이름 생략'], ['-t, --table', '표 형식 출력'], ['-S, --socket=path', '유닉스 소켓 경로']],
      ex: [['sudo mysql', 'root 로 접속 (Ubuntu)'], ['mysql -u app -p appdb', 'app 사용자로 appdb 에 접속'], ["sudo mysql -e 'SHOW DATABASES;'", '명령 하나만 실행'], ['mysql -u app -p appdb < schema.sql', 'SQL 파일 실행'], ['mysqldump -u app -p appdb > backup.sql', '(mysqldump) 백업']],
      see: ['mysqldump(1)', 'mysqladmin(1)', 'mysqld(8)']
    },
    git: {
      sec: 1, en: 'the stupid content tracker', ko: '분산 버전 관리 시스템',
      syn: ['git [-v | --version] [-h | --help] [-C <path>] [-c <name>=<value>] [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path] [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare] [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>] [--config-env=<name>=<envvar>] <command> [<args>]'],
      desc: '파일의 변경 이력을 기록하고, 브랜치로 작업을 나누고, GitHub 같은 원격 저장소와 주고받는 버전 관리 도구입니다. 작업 디렉터리에서 고친 내용을 add 로 스테이징하고 commit 으로 기록한 뒤 push 로 올립니다.\n처음 쓸 때는 git config --global user.name, user.email 로 이름과 이메일을 정합니다. 하위 명령 설명은 man git-commit 처럼 봅니다.',
      sects: [['COMMANDS', [['init', '새 저장소 만들기'], ['clone URL', '원격 저장소 복제'], ['status', '변경 상태 보기'], ['add FILE', '변경을 스테이징 (git add . 은 모두)'], ['commit -m MSG', '스테이징한 것을 기록'], ['log [--oneline]', '기록 보기'], ['diff', '아직 스테이징하지 않은 변경 보기'], ['branch / switch', '브랜치 목록·생성 / 전환'], ['merge BRANCH', '브랜치 합치기'], ['pull / push', '원격에서 받기 / 원격에 올리기'], ['remote -v', '원격 저장소 목록'], ['restore FILE', '작업 파일 변경 되돌리기'], ['stash', '작업 중인 변경 잠시 치워 두기'], ['config', '설정']]]],
      opts: [['-C <path>', '그 디렉터리에서 실행한 것처럼'], ['-c <name>=<value>', '이번 실행에만 설정 값 적용'], ['--no-pager', '페이저 없이 출력'], ['--version', '버전']],
      ex: [['git config --global user.name "Kim Student"', '이름 설정'], ['git init && git add . && git commit -m "first"', '첫 커밋'], ['git clone https://github.com/user/repo.git', '복제'], ['git log --oneline --graph', '간단한 그래프 기록'], ['git switch -c feature', '새 브랜치 만들고 전환']],
      see: ['gittutorial(7)', 'git-commit(1)', 'git-log(1)', 'gitignore(5)']
    },
    python3: {
      sec: 1, names: 'python', en: 'an interpreted, interactive, object-oriented programming language', ko: 'Python 인터프리터',
      syn: ['python3 [ -B ] [ -b ] [ -d ] [ -E ] [ -h ] [ -i ] [ -I ] [ -m module-name ] [ -q ] [ -O ] [ -OO ] [ -P ] [ -s ] [ -S ] [ -u ] [ -v ] [ -V ] [ -W argument ] [ -x ] [ -X option ] [ -? ] [ --help ] [ --help-env ] [ --help-xoptions ] [ --help-all ] [ -c command | script | - ] [ arguments ]'],
      desc: 'Python 3 프로그램을 실행합니다. Ubuntu 24.04 의 기본 버전은 3.12 이며 명령 이름은 python 이 아니라 python3 입니다. 인자 없이 실행하면 >>> 대화형 모드가 되고 exit() 또는 Ctrl+D 로 끝냅니다.\n시스템 Python 에 pip 로 직접 설치하는 것은 막혀 있으므로(externally-managed-environment) python3 -m venv 로 가상 환경을 만들어 씁니다.',
      opts: [['-c command', '문자열로 준 코드 실행'], ['-m module', '모듈을 스크립트처럼 실행 (venv, http.server, pip ...)'], ['-i', '스크립트 실행 뒤 대화형 모드로'], ['-V, --version', '버전 출력'], ['-u', '출력 버퍼링 끄기'], ['-q', '대화형 모드 시작 메시지 숨기기'], ['-B', '.pyc 파일 만들지 않기'], ['-O', '최적화 (assert 제거)']],
      ex: [['python3 --version', '버전 확인'], ['python3 hello.py', '스크립트 실행'], ['python3 -c "print(2**10)"', '한 줄 실행'], ['python3 -m venv .venv && source .venv/bin/activate', '가상 환경 만들고 켜기'], ['python3 -m http.server 8000', '현재 디렉터리를 간단한 웹 서버로']],
      see: ['pip(1)', 'pydoc3(1)']
    },
    openssl: {
      sec: '1ssl', en: 'OpenSSL command line program', ko: '암호화 · 인증서 도구',
      syn: ['openssl command [ options ... ] [ parameters ... ]', 'openssl no-XXX [ options ]', 'openssl -help | -version'],
      desc: 'TLS 인증서 만들기와 확인, 개인 키 생성, 해시 계산, 암호화, 원격 서버의 TLS 연결 점검 등을 하는 다용도 도구입니다. 첫 인자로 하위 명령을 주며, 자세한 설명은 man openssl-req 처럼 봅니다.',
      sects: [['COMMANDS', [['version [-a]', '버전'], ['req', '인증서 서명 요청(CSR) · 자체 서명 인증서 만들기'], ['x509', '인증서 보기 · 변환'], ['genpkey / genrsa', '개인 키 만들기'], ['s_client -connect host:443', 'TLS 서버에 접속해 인증서 확인'], ['dgst -sha256 FILE', '해시 계산'], ['enc', '대칭 키 암호화 · 복호화'], ['rand -hex N', '난수 만들기'], ['passwd -6', '/etc/shadow 형식 비밀번호 해시'], ['list', '지원 알고리즘 목록']]]],
      ex: [['openssl version', '버전'], ['openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"', '테스트용 자체 서명 인증서'], ['openssl x509 -in cert.pem -noout -text', '인증서 내용 보기'], ['openssl s_client -connect ubuntu.com:443 -servername ubuntu.com < /dev/null', '서버 인증서 확인'], ['openssl rand -base64 24', '임의 비밀번호 만들기']],
      see: ['openssl-req(1ssl)', 'openssl-x509(1ssl)', 'ssh-keygen(1)']
    },
    logrotate: {
      sec: 8, en: 'rotates, compresses, and mails system logs', ko: '로그 파일 회전 · 압축',
      syn: ['logrotate [--force] [--debug] [--state file] [--skip-state-lock] [--wait-for-state-lock] [--verbose] [--log file] [--mail command] config_file [config_file2 ...]'],
      desc: '로그 파일이 너무 커지지 않도록 정해진 주기나 크기마다 이름을 바꾸고(app.log → app.log.1), 오래된 것은 압축하거나 지웁니다. Ubuntu 에서는 systemd 타이머(logrotate.timer)가 하루 한 번 실행합니다.\n전체 설정은 /etc/logrotate.conf, 패키지별 설정은 /etc/logrotate.d/ 에 있습니다. 새 설정은 -d 로 먼저 시험합니다.',
      opts: [['-d, --debug', '실제로 하지 않고 무엇을 할지만 (시험용)'], ['-f, --force', '시기가 안 되어도 강제로 회전'], ['-v, --verbose', '자세히'], ['-s, --state statefile', '상태 파일 지정 (기본 /var/lib/logrotate/status)']],
      sects: [['DIRECTIVES', [['daily / weekly / monthly', '회전 주기'], ['rotate N', 'N 개까지 보관'], ['size SIZE', '크기가 넘으면 회전 (예: 100M)'], ['compress / delaycompress', '압축 / 바로 전 것은 압축 미루기'], ['missingok', '로그가 없어도 오류 아님'], ['notifempty', '비어 있으면 회전하지 않기'], ['create MODE OWNER GROUP', '회전 후 새 파일 만들기'], ['copytruncate', '복사한 뒤 원본을 비우기 (파일을 계속 여는 프로그램용)'], ['postrotate ... endscript', '회전 후 실행할 명령']]], ['SAMPLE CONFIG', { pre: ['/var/log/myapp/*.log {', '    daily', '    rotate 14', '    compress', '    delaycompress', '    missingok', '    notifempty', '    create 0640 www-data adm', '}'] }]],
      ex: [['sudo logrotate -d /etc/logrotate.d/myapp', '설정 시험'], ['sudo logrotate -f /etc/logrotate.conf', '지금 강제로 회전']],
      see: ['logrotate.conf(5)', 'journalctl(1)', 'gzip(1)']
    },
    sysctl: {
      sec: 8, en: 'configure kernel parameters at runtime', ko: '커널 매개변수 보기 · 바꾸기',
      syn: ['sysctl [options] [variable[=value]] [...]', 'sysctl -p [file or regexp] [...]'],
      desc: '실행 중인 커널의 설정 값(/proc/sys 아래)을 보거나 바꿉니다. 변수 이름의 점(.)은 /proc/sys 의 디렉터리 구분에 해당합니다(net.ipv4.ip_forward → /proc/sys/net/ipv4/ip_forward).\n-w 로 바꾼 값은 재부팅하면 사라지므로, 영구 설정은 /etc/sysctl.d/ 에 .conf 파일로 적고 sudo sysctl --system 으로 적용합니다.',
      opts: [['-a, --all', '모든 값 보기'], ['-w, --write', '값 바꾸기 (sysctl -w 이름=값)'], ['-p[FILE], --load[=FILE]', '파일의 설정 적용 (기본 /etc/sysctl.conf)'], ['--system', '모든 시스템 설정 디렉터리의 파일 적용'], ['-n, --values', '값만 출력'], ['-N, --names', '이름만 출력'], ['-q, --quiet', '바꾼 값 출력 안 함']],
      ex: [['sysctl net.ipv4.ip_forward', '값 보기'], ['sudo sysctl -w net.ipv4.ip_forward=1', 'IP 포워딩 켜기 (임시)'], ["echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf", '영구 설정 파일'], ['sudo sysctl --system', '설정 파일 모두 적용']],
      see: ['sysctl.conf(5)', 'sysctl.d(5)', 'proc(5)']
    },
    lscpu: {
      sec: 1, en: 'display information about the CPU architecture', ko: 'CPU 정보 보기',
      syn: ['lscpu [options]'],
      desc: 'CPU 의 아키텍처, 모델 이름, 코어·스레드·소켓 수, 캐시 크기, 가상화 지원 등을 /proc/cpuinfo 와 sysfs 에서 읽어 보기 좋게 보여 줍니다. 코어 수만 빨리 보려면 nproc 을 씁니다.',
      opts: [['-e, --extended[=list]', 'CPU 별 표 형식'], ['-p, --parse[=list]', '스크립트용 쉼표 구분 형식'], ['-J, --json', 'JSON 출력'], ['-a, --all', '온라인 · 오프라인 CPU 모두'], ['-b, --online', '온라인 CPU 만'], ['-c, --offline', '오프라인 CPU 만'], ['-C, --caches[=list]', '캐시 정보'], ['-y, --physical', '물리 ID 표시'], ['-x, --hex', 'CPU 마스크를 16진수로']],
      ex: [['lscpu', 'CPU 요약'], ['lscpu -e', 'CPU 별로'], ['nproc', '사용 가능한 코어 수만']],
      see: ['nproc(1)', 'lsblk(8)', 'free(1)']
    },
    time: {
      sec: 1, en: 'run programs and summarize system resource usage', ko: '명령 실행 시간 재기',
      syn: ['time [ -apqvV ] [ -f FORMAT ] [ -o FILE ] [ --append ] [ --verbose ] [ --quiet ] [ --portability ] [ --format=FORMAT ] [ --output=FILE ] [ --version ] [ --help ] COMMAND [ ARGS ]'],
      desc: 'COMMAND 를 실행하고 걸린 시간을 알려 줍니다. real 은 실제 경과 시간, user 는 사용자 모드 CPU 시간, sys 는 커널 모드 CPU 시간입니다.\nbash 에서 그냥 time 을 쓰면 셸 키워드 time 이 실행되어 이 옵션들을 쓸 수 없습니다. GNU time(메모리 사용량 등 자세한 정보)을 쓰려면 /usr/bin/time 처럼 경로로 실행합니다.',
      opts: [['-v, --verbose', '(GNU time) 최대 메모리, 페이지 폴트 등 자세히'], ['-p, --portability', 'POSIX 형식 출력'], ['-f, --format=FORMAT', '출력 형식 (%e 경과 초, %M 최대 메모리 KB ...)'], ['-o, --output=FILE', '결과를 파일로'], ['-a, --append', '-o 파일에 덧붙이기']],
      ex: [['time sleep 1', '셸 키워드 time'], ['/usr/bin/time -v tar czf a.tgz dir', '자세한 자원 사용량'], ["/usr/bin/time -f '%e초 %MKB' python3 app.py", '형식 지정']],
      see: ['bash(1)', 'times']
    },
    bc: {
      sec: 1, en: 'An arbitrary precision calculator language', ko: '계산기 (임의 정밀도)',
      syn: ['bc [ -hlwsqv ] [long-options] [  file ... ]'],
      desc: '정수와 소수를 원하는 정밀도로 계산하는 계산기 언어입니다. 셸의 $(( )) 는 정수만 계산하므로 소수 계산이 필요할 때 씁니다. scale 변수로 소수점 아래 자릿수를 정하며(기본 0), 대화형 모드는 quit 로 끝냅니다.',
      opts: [['-l, --mathlib', '수학 라이브러리 사용 (scale=20, s() c() l() e() sqrt())'], ['-q, --quiet', '시작 인사말 생략'], ['-s, --standard', 'POSIX 표준 문법만'], ['-w, --warn', '비표준 확장에 경고']],
      ex: [["echo '10 / 3' | bc", '3 (정수)'], ["echo 'scale=2; 10 / 3' | bc", '3.33'], ["echo 'sqrt(2)' | bc -l", '제곱근'], ["echo '2^64' | bc", '큰 수']],
      see: ['expr(1)', 'dc(1)']
    },
    jq: {
      sec: 1, en: 'Command-line JSON processor', ko: 'JSON 가공 · 조회',
      syn: ['jq [options...] filter [files...]'],
      desc: 'JSON 입력에 필터를 적용해 원하는 값을 골라내거나 바꿉니다. 필터 . 은 입력 전체를 보기 좋게 출력하고, .key 는 키, .[] 는 배열의 각 요소, | 는 필터 연결입니다. API 응답(curl)을 다룰 때 많이 씁니다. sudo apt install jq 로 설치합니다.',
      opts: [['-r, --raw-output', '문자열을 따옴표 없이'], ['-c, --compact-output', '한 줄로 압축'], ['-s, --slurp', '입력 전체를 하나의 배열로'], ['-n, --null-input', '입력 없이 실행'], ['-e, --exit-status', '결과가 false/null 이면 실패 코드'], ['--arg name value', '문자열 변수 $name 전달'], ['--argjson name json', 'JSON 값 변수 전달'], ['-S, --sort-keys', '키 정렬'], ['--tab, --indent n', '들여쓰기 지정'], ['-R, --raw-input', '입력을 JSON 대신 문자열 줄로']],
      sects: [['FILTERS', [['.', '전체'], ['.name, .a.b', '키 값'], ['.[0], .[]', '배열 첫 요소 / 모든 요소'], ['select(cond)', '조건에 맞는 것만'], ['map(f)', '배열 각 요소에 f 적용'], ['keys, length', '키 목록, 길이']]]],
      ex: [['cat data.json | jq .', '보기 좋게 출력'], ["jq -r '.name' package.json", '값만'], ["curl -s https://api.github.com/repos/jqlang/jq | jq '.stargazers_count'", 'API 응답에서 값 꺼내기'], ["jq '.[] | select(.age > 20) | .name' users.json", '조건으로 거르기']],
      see: ['curl(1)', 'python3(1)']
    },
    basename: {
      sec: 1, en: 'strip directory and suffix from filenames', ko: '경로에서 파일 이름만 꺼내기',
      syn: ['basename NAME [SUFFIX]', 'basename OPTION... NAME...'],
      desc: '경로의 마지막 / 앞부분을 떼어 파일 이름만 출력합니다. SUFFIX 를 주면 끝의 확장자도 뗍니다. 스크립트에서 $0 이나 파일 경로를 다룰 때 씁니다.',
      opts: [['-a, --multiple', '여러 NAME 처리'], ['-s, --suffix=SUFFIX', '떼어 낼 확장자 (-a 포함)'], ['-z, --zero', '줄바꿈 대신 널 문자로 구분']],
      ex: [['basename /usr/bin/sort', 'sort'], ['basename /home/user/report.txt .txt', 'report'], ['basename -s .jpg -a *.jpg', '여러 파일에서 확장자 떼기']],
      see: ['dirname(1)', 'realpath(1)']
    },
    dirname: {
      sec: 1, en: 'strip last component from file name', ko: '경로에서 디렉터리 부분만 꺼내기',
      syn: ['dirname [OPTION] NAME...'],
      desc: '경로의 마지막 / 와 그 뒤를 떼고 디렉터리 부분만 출력합니다. / 가 없으면 . (현재 디렉터리)을 출력합니다. 스크립트가 있는 디렉터리를 구할 때 dirname "$0" 을 씁니다.',
      opts: [['-z, --zero', '줄바꿈 대신 널 문자로 구분']],
      ex: [['dirname /usr/bin/sort', '/usr/bin'], ['dirname report.txt', '.'], ['cd "$(dirname "$0")"', '(스크립트 안) 스크립트 위치로 이동']],
      see: ['basename(1)', 'realpath(1)']
    },
    realpath: {
      sec: 1, en: 'print the resolved path', ko: '절대 경로 구하기',
      syn: ['realpath [OPTION]... FILE...'],
      desc: '상대 경로와 . .. 을 풀고 심볼릭 링크를 따라가 실제 절대 경로를 출력합니다. 기본적으로 마지막 요소를 뺀 경로는 존재해야 합니다.',
      opts: [['-e, --canonicalize-existing', '모든 요소가 존재해야 함'], ['-m, --canonicalize-missing', '없는 경로도 허용'], ['-s, --strip, --no-symlinks', '심볼릭 링크는 풀지 않기'], ['--relative-to=DIR', 'DIR 기준 상대 경로로 출력'], ['-q, --quiet', '대부분의 오류 숨기기']],
      ex: [['realpath ../notes.txt', '절대 경로'], ['realpath /usr/bin/python3', '링크를 따라간 실제 파일'], ['realpath --relative-to=/etc /etc/nginx/nginx.conf', 'nginx/nginx.conf']],
      see: ['readlink(1)', 'dirname(1)', 'pwd(1)']
    },
    readlink: {
      sec: 1, en: 'print resolved symbolic links or canonical file names', ko: '심볼릭 링크가 가리키는 곳 보기',
      syn: ['readlink [OPTION]... FILE...'],
      desc: '심볼릭 링크에 저장된 대상 경로를 출력합니다. -f 를 주면 링크를 끝까지 따라가 최종 절대 경로를 출력합니다(realpath 와 비슷). 링크가 아닌 파일은 옵션 없이 쓰면 아무것도 출력하지 않고 실패합니다.',
      opts: [['-f, --canonicalize', '모든 링크를 따라가 절대 경로로 (마지막 요소 외에는 존재해야 함)'], ['-e, --canonicalize-existing', '모든 요소가 존재해야 함'], ['-m, --canonicalize-missing', '존재하지 않아도 됨'], ['-n, --no-newline', '줄바꿈 없이'], ['-v, --verbose', '오류 메시지 출력'], ['-z, --zero', '널 문자로 구분']],
      ex: [['readlink /etc/localtime', '../usr/share/zoneinfo/Asia/Seoul 등'], ['readlink -f /usr/bin/awk', '최종 실제 파일']],
      see: ['realpath(1)', 'ln(1)', 'stat(1)']
    },
    seq: {
      sec: 1, en: 'print a sequence of numbers', ko: '연속된 숫자 출력',
      syn: ['seq [OPTION]... LAST', 'seq [OPTION]... FIRST LAST', 'seq [OPTION]... FIRST INCREMENT LAST'],
      desc: 'FIRST(기본 1)부터 LAST 까지 INCREMENT(기본 1)씩 늘려 한 줄에 하나씩 출력합니다. for 반복문과 함께 쓰거나 테스트 데이터를 만들 때 씁니다. bash 의 {1..10} 과 비슷하지만 변수를 쓸 수 있습니다.',
      opts: [['-s, --separator=STRING', '구분자 (기본 줄바꿈)'], ['-w, --equal-width', '앞에 0 을 채워 폭 맞추기'], ['-f, --format=FORMAT', 'printf 형식 (예: %03g)']],
      ex: [['seq 5', '1~5'], ['seq 0 10 100', '0, 10, ..., 100'], ['seq -w 1 10', '01 ~ 10'], ["seq -s ' ' 3", '1 2 3'], ['for i in $(seq 1 $N); do echo $i; done', '변수로 반복']],
      see: ['shuf(1)', 'bash(1)']
    },
    sleep: {
      sec: 1, en: 'delay for a specified amount of time', ko: '잠시 기다리기',
      syn: ['sleep NUMBER[SUFFIX]...', 'sleep OPTION'],
      desc: '지정한 시간 동안 아무것도 하지 않고 기다립니다. 단위는 s(초, 기본), m(분), h(시간), d(일)이며 소수(0.5)도 됩니다. 인자를 여러 개 주면 모두 더한 시간만큼 기다립니다. 스크립트에서 반복 사이에 간격을 줄 때 씁니다.',
      opts: [['NUMBER[s|m|h|d]', '기다릴 시간'], ['infinity', '끝없이 기다리기']],
      ex: [['sleep 5', '5초'], ['sleep 1m 30s', '1분 30초'], ['sleep 0.5', '0.5초'], ['sleep 100 &', '백그라운드 작업 연습용']],
      see: ['watch(1)', 'timeout(1)']
    },
    yes: {
      sec: 1, en: 'output a string repeatedly until killed', ko: '문자열을 끝없이 반복 출력',
      syn: ['yes [STRING]...', 'yes OPTION'],
      desc: 'STRING(기본 y)을 멈출 때까지 한 줄씩 계속 출력합니다. 확인 질문에 모두 y 로 답하게 하려고 파이프로 넘기는 데 쓰였습니다. Ctrl+C 로 멈춥니다.',
      opts: [['--help', '도움말'], ['--version', '버전 정보']],
      ex: [['yes | sudo apt-get install pkg', '질문에 모두 y (보통은 -y 옵션 사용)'], ['yes hello | head -3', 'hello 3줄']],
      see: ['seq(1)']
    },
    base64: {
      sec: 1, en: 'base64 encode/decode data and print to standard output', ko: 'Base64 인코딩 · 디코딩',
      syn: ['base64 [OPTION]... [FILE]'],
      desc: '데이터를 Base64 문자열로 바꾸거나(인코딩) 원래대로 되돌립니다(-d). 이진 데이터를 텍스트로 옮길 때 씁니다. 암호화가 아니므로 누구나 되돌릴 수 있습니다.',
      opts: [['-d, --decode', '디코딩'], ['-w, --wrap=COLS', 'COLS 글자마다 줄바꿈 (기본 76, 0 은 줄바꿈 안 함)'], ['-i, --ignore-garbage', '디코딩할 때 알파벳이 아닌 문자 무시']],
      ex: [['echo -n hello | base64', 'aGVsbG8='], ['echo aGVsbG8= | base64 -d', 'hello'], ['base64 -w0 image.png > image.txt', '파일을 한 줄로 인코딩']],
      see: ['basenc(1)', 'openssl(1ssl)']
    },
    md5sum: {
      sec: 1, en: 'compute and check MD5 message digest', ko: 'MD5 해시 계산 · 검사',
      syn: ['md5sum [OPTION]... [FILE]...'],
      desc: '파일의 128비트 MD5 해시(체크섬)를 계산합니다. 파일이 전송 중에 바뀌지 않았는지 간단히 확인할 때 쓰지만, 충돌 공격이 알려져 있어 보안 용도로는 sha256sum 을 씁니다.',
      opts: [['-c, --check', '파일에 적힌 체크섬과 비교해 검사'], ['--quiet', '(-c) 성공한 파일은 출력하지 않기'], ['--status', '(-c) 출력 없이 종료 코드만'], ['--tag', 'BSD 형식 출력'], ['-b, --binary', '이진 모드로 읽기'], ['-z, --zero', '줄 끝을 널 문자로']],
      ex: [['md5sum file.iso', '해시 계산'], ['md5sum *.txt > sums.md5', '저장'], ['md5sum -c sums.md5', '검사 (OK / FAILED)']],
      see: ['sha256sum(1)', 'cksum(1)']
    },
    sha256sum: {
      sec: 1, en: 'compute and check SHA256 message digest', ko: 'SHA-256 해시 계산 · 검사',
      syn: ['sha256sum [OPTION]... [FILE]...'],
      desc: '파일의 SHA-256 해시를 계산합니다. 내려받은 ISO 이미지 등이 배포자가 공개한 값과 같은지 확인할 때 씁니다. 내용이 한 바이트만 달라도 전혀 다른 값이 나옵니다.',
      opts: [['-c, --check', 'SHA256SUMS 같은 파일로 검사'], ['--ignore-missing', '(-c) 없는 파일은 무시'], ['--quiet', '(-c) 성공한 파일은 출력하지 않기'], ['--status', '(-c) 출력 없이 종료 코드만'], ['--tag', 'BSD 형식 출력'], ['-b, --binary', '이진 모드로 읽기']],
      ex: [['sha256sum ubuntu-24.04-live-server-amd64.iso', '해시 계산'], ['sha256sum -c SHA256SUMS --ignore-missing', '받은 파일만 검사']],
      see: ['md5sum(1)', 'sha512sum(1)', 'b2sum(1)']
    },
    mktemp: {
      sec: 1, en: 'create a temporary file or directory', ko: '안전한 임시 파일 · 디렉터리 만들기',
      syn: ['mktemp [OPTION]... [TEMPLATE]'],
      desc: '겹치지 않는 이름의 임시 파일(권한 600)이나 디렉터리(700)를 만들고 그 이름을 출력합니다. TEMPLATE 끝의 XXX(3개 이상)가 임의 문자로 바뀌며, 주지 않으면 /tmp/tmp.XXXXXXXXXX 입니다. 스크립트에서 고정된 이름의 임시 파일을 쓰면 충돌 · 보안 문제가 생기므로 mktemp 를 씁니다.',
      opts: [['-d, --directory', '디렉터리 만들기'], ['-u, --dry-run', '만들지 않고 이름만 (안전하지 않음)'], ['-q, --quiet', '실패해도 메시지 없음'], ['-p DIR, --tmpdir[=DIR]', 'DIR 안에 만들기 (기본 $TMPDIR 또는 /tmp)'], ['-t', 'TEMPLATE 을 임시 디렉터리 기준으로'], ['--suffix=SUFF', '이름 끝에 SUFF 붙이기']],
      ex: [['mktemp', '/tmp/tmp.Ab3dE9fGh1'], ['tmp=$(mktemp -d); cd "$tmp"', '임시 디렉터리 만들고 이동'], ['mktemp /tmp/report.XXXXXX --suffix=.txt', '형식 지정']],
      see: ['mkdir(1)', 'touch(1)']
    },
    column: {
      sec: 1, en: 'columnate lists', ko: '출력을 열 맞춰 표로',
      syn: ['column [options] [file ...]'],
      desc: '입력을 여러 열로 배치하거나, -t 로 구분자 기준의 표로 정렬해 보기 좋게 만듭니다. /etc/passwd 나 mount 출력처럼 줄마다 길이가 다른 데이터를 볼 때 유용합니다.',
      opts: [['-t, --table', '표 형식으로 열 맞추기'], ['-s, --separator separators', '입력 구분자 (기본 공백)'], ['-o, --output-separator string', '출력 열 사이 문자열 (기본 두 칸 공백)'], ['-N, --table-columns names', '열 제목 지정 (쉼표 구분)'], ['-R, --table-right columns', '오른쪽 정렬할 열'], ['-J, --json', 'JSON 으로 출력 (-N 필요)'], ['-c, --output-width width', '출력 너비'], ['-x, --fillrows', '세로가 아니라 가로로 먼저 채우기']],
      ex: [['column -t -s: /etc/passwd | head', '콜론 구분을 표로'], ['mount | column -t', '마운트 목록 정렬'], ['column -t -s, -N 이름,나이 data.csv', '제목 붙이기']],
      see: ['paste(1)', 'cut(1)', 'awk(1)']
    },
    paste: {
      sec: 1, en: 'merge lines of files', ko: '파일들을 줄끼리 옆으로 붙이기',
      syn: ['paste [OPTION]... [FILE]...'],
      desc: '각 파일의 같은 번째 줄을 탭으로 이어 한 줄로 출력합니다(세로로 붙이는 cat 과 반대로 가로로 붙임). -s 를 주면 한 파일의 모든 줄을 한 줄로 합칩니다.',
      opts: [['-d, --delimiters=LIST', '탭 대신 쓸 구분자'], ['-s, --serial', '파일마다 모든 줄을 한 줄로'], ['-z, --zero-terminated', '줄 구분을 널 문자로']],
      ex: [['paste names.txt scores.txt', '두 파일을 나란히'], ['paste -d, a.txt b.txt', '쉼표로 연결'], ['paste -sd+ nums.txt | bc', '숫자를 + 로 이어 합계 계산']],
      see: ['cut(1)', 'join(1)', 'column(1)']
    }
  });

  // ---------------------------------------------------------------- 섹션 5 · 7 (파일 형식 · 개요)
  Object.assign(MAN, {
    'passwd(5)': {
      sec: 5, title: 'File Formats and Configuration', en: 'the password file', ko: '/etc/passwd 사용자 계정 파일 형식',
      syn: ['/etc/passwd'],
      desc: '시스템의 모든 계정이 한 줄에 하나씩, 콜론(:)으로 나뉜 7개 필드로 적혀 있습니다. 누구나 읽을 수 있는 파일(644)이므로 실제 비밀번호는 x 로 표시하고 /etc/shadow 에 따로 저장합니다.\nUID 0 은 root, 1~999 는 시스템 계정, 1000 이상은 일반 사용자입니다. 직접 고치기보다 useradd, usermod 를 쓰고, 꼭 편집해야 하면 vipw 를 씁니다.',
      sects: [['FIELDS', [['1 name', '로그인 이름'], ['2 password', 'x = /etc/shadow 에 저장됨'], ['3 UID', '사용자 ID 숫자'], ['4 GID', '기본 그룹 ID'], ['5 GECOS', '설명 (실명, 연락처 등, 쉼표로 구분)'], ['6 directory', '홈 디렉터리'], ['7 shell', '로그인 셸 (/usr/sbin/nologin 은 로그인 불가)']]],
        ['SAMPLE', { pre: ['root:x:0:0:root:/root:/bin/bash', 'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin', 'student:x:1000:1000:Student,,,:/home/student:/bin/bash'] }]],
      ex: [['cat /etc/passwd', '전체 보기'], ['getent passwd student', '한 계정 보기'], ["awk -F: '$3>=1000 {print $1}' /etc/passwd", '일반 사용자 이름만']],
      see: ['passwd(1)', 'shadow(5)', 'group(5)', 'useradd(8)', 'vipw(8)']
    },
    shadow: {
      sec: 5, title: 'File Formats and Configuration', en: 'shadowed password file', ko: '/etc/shadow 암호화된 비밀번호 파일 형식',
      syn: ['/etc/shadow'],
      desc: '각 계정의 암호화된 비밀번호와 만료 정보를 담은 파일로, root 와 shadow 그룹만 읽을 수 있습니다(640). 콜론으로 나뉜 9개 필드입니다.\n비밀번호 필드가 $y$ 로 시작하면 yescrypt (Ubuntu 기본) 해시이고, ! 나 * 로 시작하면 비밀번호로 로그인할 수 없습니다(잠김). 날짜는 1970-01-01 부터 센 일 수입니다. 값은 passwd, chage 로 바꿉니다.',
      sects: [['FIELDS', [['1 login name', '로그인 이름'], ['2 encrypted password', '해시 ($id$salt$hash), ! 또는 * 는 잠김'], ['3 last change', '마지막 변경일 (0 이면 다음 로그인 때 변경)'], ['4 minimum age', '다시 바꿀 수 있을 때까지 최소 일수'], ['5 maximum age', '최대 사용 일수'], ['6 warning period', '만료 전 경고 일수'], ['7 inactivity period', '만료 후 비활성까지 일수'], ['8 expiration date', '계정 만료일'], ['9 reserved', '예약']]],
        ['SAMPLE', { pre: ['student:$y$j9T$abc...$xyz...:19800:0:99999:7:::', 'daemon:*:19800:0:99999:7:::'] }]],
      ex: [['sudo cat /etc/shadow', '보기 (root 필요)'], ['sudo chage -l student', '만료 정보를 읽기 쉽게']],
      see: ['passwd(5)', 'passwd(1)', 'chage(1)', 'crypt(5)']
    },
    group: {
      sec: 5, title: 'File Formats and Configuration', en: 'user group file', ko: '/etc/group 그룹 파일 형식',
      syn: ['/etc/group'],
      desc: '그룹마다 한 줄씩, 콜론으로 나뉜 4개 필드로 적혀 있습니다. 마지막 필드는 이 그룹을 보조 그룹으로 가진 사용자 목록(쉼표 구분)입니다. 사용자의 기본 그룹은 /etc/passwd 의 GID 로 정해지므로 여기 목록에 없어도 그 그룹에 속합니다.\nUbuntu 에서 sudo 그룹 구성원은 관리자 권한을, adm 은 로그 읽기 권한을 가집니다.',
      sects: [['FIELDS', [['1 group_name', '그룹 이름'], ['2 password', 'x = /etc/gshadow 에 저장됨'], ['3 GID', '그룹 ID 숫자'], ['4 user_list', '구성원 (쉼표 구분)']]],
        ['SAMPLE', { pre: ['sudo:x:27:student', 'developers:x:1001:alice,bob'] }]],
      ex: [['grep sudo /etc/group', 'sudo 그룹 구성원'], ['getent group developers', '그룹 정보']],
      see: ['groups(1)', 'groupadd(8)', 'gpasswd(1)', 'passwd(5)', 'gshadow(5)']
    },
    fstab: {
      sec: 5, en: 'static information about the filesystems', ko: '/etc/fstab 부팅 시 자동 마운트 설정',
      syn: ['/etc/fstab'],
      desc: '부팅할 때 자동으로 마운트할 파일 시스템을 한 줄에 하나씩, 공백으로 나뉜 6개 필드로 적습니다. # 으로 시작하는 줄은 주석입니다.\n장치 이름(/dev/sdb1)은 디스크 연결 순서에 따라 바뀔 수 있으므로 UUID=... 로 적는 것이 안전합니다(blkid 로 확인). 잘못 적으면 부팅이 멈출 수 있으므로 고친 뒤 반드시 sudo mount -a 로 오류가 없는지 확인하고, 추가 디스크에는 nofail 옵션을 권장합니다.',
      sects: [['FIELDS', [['1 fs_spec', '장치 (UUID=..., LABEL=..., /dev/..., 서버:/경로)'], ['2 fs_file', '마운트 포인트 (스왑은 none)'], ['3 fs_vfstype', '종류 (ext4, xfs, vfat, swap, nfs ...)'], ['4 fs_mntops', '옵션 (defaults, ro, noexec, nofail, noatime ...)'], ['5 fs_freq', 'dump 백업 여부 (보통 0)'], ['6 fs_passno', '부팅 시 fsck 순서 (루트 1, 나머지 2, 검사 안 함 0)']]],
        ['SAMPLE', { pre: ['# <장치>          <마운트 위치> <종류> <옵션>          <dump> <pass>', 'UUID=1b2c...d4e  /             ext4   defaults         0      1', 'UUID=3f6a...a90  /data         ext4   defaults,nofail  0      2', '/swap.img        none          swap   sw               0      0'] }]],
      ex: [['cat /etc/fstab', '보기'], ['sudo blkid /dev/sdb1', 'UUID 확인'], ['sudo nano /etc/fstab', '편집'], ['sudo mount -a', '문법 · 마운트 검사'], ['sudo systemctl daemon-reload', 'systemd 에 변경 알리기']],
      see: ['mount(8)', 'blkid(8)', 'findmnt(8)', 'swapon(8)']
    },
    'crontab(5)': {
      sec: 5, en: 'tables for driving cron', ko: 'crontab 예약 작업 형식',
      syn: ['crontab -e 로 편집 (/var/spool/cron/crontabs/USER)', '/etc/crontab , /etc/cron.d/*'],
      desc: '한 줄에 작업 하나를 "분 시 일 월 요일 명령" 형식으로 적습니다. 각 시간 필드에는 * (모두), 목록(1,15), 범위(1-5), 간격(*/10)을 쓸 수 있습니다. 요일은 0~7(0 과 7 은 일요일) 또는 sun, mon ... 입니다.\n/etc/crontab 과 /etc/cron.d/ 의 파일은 명령 앞에 실행할 사용자 필드가 하나 더 있습니다. MAILTO, PATH, SHELL 같은 변수를 맨 위에 정할 수 있습니다.',
      sects: [['FIELDS', [['minute', '0-59'], ['hour', '0-23'], ['day of month', '1-31'], ['month', '1-12 (또는 jan-dec)'], ['day of week', '0-7 (0, 7 = 일요일, 또는 sun-sat)'], ['command', '실행할 명령 (% 는 줄바꿈으로 해석되니 \\% 로)']]],
        ['SPECIAL', [['@reboot', '부팅할 때 한 번'], ['@hourly', '0 * * * *'], ['@daily', '0 0 * * *'], ['@weekly', '0 0 * * 0'], ['@monthly', '0 0 1 * *'], ['@yearly', '0 0 1 1 *']]],
        ['SAMPLE', { pre: ['# 분 시 일 월 요일 명령', '*/5 * * * *  /home/student/bin/check.sh >> /tmp/check.log 2>&1', '0 3 * * *    /usr/local/bin/backup.sh', '30 9 * * 1-5 echo "평일 09:30"', '@reboot      /home/student/start.sh'] }]],
      ex: [['crontab -e', '편집'], ['cat /etc/crontab', '시스템 crontab (사용자 필드 있음)'], ['grep CRON /var/log/syslog', 'cron 실행 기록']],
      see: ['crontab(1)', 'cron(8)', 'systemd.timer(5)']
    },
    sshd_config: {
      sec: 5, en: 'OpenSSH daemon configuration file', ko: 'SSH 서버 설정 파일',
      syn: ['/etc/ssh/sshd_config', '/etc/ssh/sshd_config.d/*.conf'],
      desc: 'SSH 서버(sshd)의 설정 파일입니다. 한 줄에 "키워드 값" 형식이며 # 은 주석입니다. 같은 키워드가 여러 번 나오면 처음 나온 값이 쓰입니다. Ubuntu 는 파일 맨 위에서 sshd_config.d/*.conf 를 먼저 읽으므로 그 안의 설정이 우선합니다.\n고친 뒤에는 sudo sshd -t 로 문법을 검사하고 sudo systemctl reload ssh 로 적용합니다. 원격에서 작업할 때는 접속을 하나 더 열어 둔 채 시험하세요. Ubuntu 24.04 는 ssh.socket 으로 포트를 열기 때문에 Port 를 바꾼 뒤에는 systemctl daemon-reload 와 restart ssh.socket 이 필요합니다.',
      opts: [['Port', '포트 번호 (기본 22)'], ['ListenAddress', '기다릴 주소'], ['PermitRootLogin', 'root 로그인 허용 여부 (prohibit-password 기본, no 권장)'], ['PasswordAuthentication', '비밀번호 로그인 허용 (키만 쓰려면 no)'], ['PubkeyAuthentication', '공개 키 로그인 (기본 yes)'], ['AuthorizedKeysFile', '공개 키 파일 위치 (.ssh/authorized_keys)'], ['AllowUsers / AllowGroups', '접속을 허용할 사용자 / 그룹만'], ['KbdInteractiveAuthentication', '키보드 대화형 인증'], ['X11Forwarding', 'X11 포워딩 허용'], ['MaxAuthTries', '접속당 최대 인증 시도 횟수'], ['ClientAliveInterval', '유휴 연결 확인 간격(초)']],
      ex: [['sudo nano /etc/ssh/sshd_config', '편집'], ['sudo sshd -t', '문법 검사'], ['sudo systemctl reload ssh', '적용'], ["grep -v '^#' /etc/ssh/sshd_config | grep -v '^$'", '실제 설정만 보기']],
      see: ['sshd(8)', 'ssh(1)', 'ssh_config(5)']
    },
    sudoers: {
      sec: 5, en: 'default sudo security policy plugin', ko: 'sudo 권한 설정 파일 형식',
      syn: ['/etc/sudoers', '/etc/sudoers.d/*'],
      desc: '누가 어느 호스트에서 어떤 사용자로 어떤 명령을 sudo 로 실행할 수 있는지 정합니다. 기본 형식은 "사용자 호스트=(실행사용자:실행그룹) 명령" 이며 %이름 은 그룹을 뜻합니다. 여러 규칙이 일치하면 마지막 규칙이 적용됩니다.\n문법 오류가 있으면 sudo 전체가 동작하지 않으므로 반드시 visudo 로 편집합니다. 직접 규칙을 추가할 때는 /etc/sudoers.d/ 에 파일을 만듭니다(이름에 . 이나 ~ 가 들어가면 무시됨).',
      sects: [['SAMPLE', { pre: ['# Ubuntu 기본값', 'root    ALL=(ALL:ALL) ALL', '%admin  ALL=(ALL) ALL', '%sudo   ALL=(ALL:ALL) ALL', '', '# 비밀번호 없이 특정 명령만', 'deploy  ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx', '', '@includedir /etc/sudoers.d'] }]],
      opts: [['USER / %GROUP', '규칙을 적용할 사용자 / 그룹'], ['ALL', '모든 호스트 · 사용자 · 명령'], ['(runas)', '어느 사용자(:그룹)로 실행할 수 있는지'], ['NOPASSWD:', '비밀번호 묻지 않기'], ['Defaults', '기본 동작 설정 (timestamp_timeout, secure_path ...)'], ['@includedir', '디렉터리의 파일 포함']],
      ex: [['sudo visudo', '편집'], ['sudo visudo -f /etc/sudoers.d/deploy', '별도 파일'], ['sudo -l -U deploy', 'deploy 의 권한 확인']],
      see: ['sudo(8)', 'visudo(8)']
    },
    hosts: {
      sec: 5, en: 'static table lookup for hostnames', ko: '/etc/hosts 이름-주소 대응표',
      syn: ['/etc/hosts'],
      desc: 'DNS 를 묻기 전에 먼저 참고하는 호스트 이름과 IP 주소의 대응표입니다. 한 줄에 "IP주소 정식이름 [별명...]" 을 공백으로 나눠 적습니다. 실습용 서버에 이름을 붙이거나 특정 도메인을 다른 주소로 보내 시험할 때 씁니다.\n조회 순서는 /etc/nsswitch.conf 의 hosts: 줄(files 가 먼저)에 따릅니다. Ubuntu 는 127.0.1.1 에 자기 호스트 이름을 적어 둡니다.',
      sects: [['SAMPLE', { pre: ['127.0.0.1       localhost', '127.0.1.1       ubuntu', '192.168.56.10   web01.lab.local  web01', '', '# IPv6', '::1     ip6-localhost ip6-loopback'] }]],
      ex: [['cat /etc/hosts', '보기'], ["echo '192.168.56.20 db01' | sudo tee -a /etc/hosts", '항목 추가'], ['getent hosts web01', '/etc/hosts 를 포함한 이름 조회'], ['ping -c1 web01', '이름으로 접속 확인']],
      see: ['hostname(1)', 'hostnamectl(1)', 'resolv.conf(5)', 'nsswitch.conf(5)']
    },
    hier: {
      sec: 7, en: 'description of the filesystem hierarchy', ko: '리눅스 디렉터리 구조 설명',
      syn: ['/'],
      desc: '리눅스는 모든 파일이 루트(/)에서 시작하는 하나의 트리에 들어 있으며, 디스크나 USB 도 이 트리의 한 디렉터리에 마운트됩니다. 각 디렉터리의 용도는 FHS(Filesystem Hierarchy Standard)로 정해져 있습니다.\nUbuntu 는 /bin, /sbin, /lib 이 각각 /usr/bin, /usr/sbin, /usr/lib 를 가리키는 심볼릭 링크인 "usrmerge" 구조입니다.',
      sects: [['DIRECTORIES', [['/', '루트. 모든 디렉터리의 시작'], ['/bin, /sbin', '기본 명령 / 관리 명령 (→ /usr/bin, /usr/sbin 링크)'], ['/boot', '커널(vmlinuz)과 부트로더 (GRUB) 파일'], ['/dev', '장치 파일 (디스크 sda, 터미널 tty, null ...)'], ['/etc', '시스템 설정 파일 (텍스트)'], ['/home', '일반 사용자의 홈 디렉터리'], ['/lib, /lib64', '공유 라이브러리와 커널 모듈 (→ /usr/lib)'], ['/media', 'USB · CD 같은 이동식 장치 자동 마운트'], ['/mnt', '임시로 수동 마운트하는 곳'], ['/opt', '별도로 설치하는 추가 소프트웨어'], ['/proc', '프로세스 · 커널 정보를 보여 주는 가상 파일 시스템'], ['/root', 'root 사용자의 홈'], ['/run', '실행 중 정보 (PID 파일, 소켓), 부팅 때마다 비워짐'], ['/snap', 'snap 패키지'], ['/srv', '서버가 제공하는 데이터 (웹, FTP)'], ['/sys', '장치 · 드라이버 정보 가상 파일 시스템'], ['/tmp', '임시 파일 (누구나 쓰기 가능, 스티키 비트)'], ['/usr', '설치된 프로그램과 라이브러리, 문서 (/usr/bin, /usr/share, /usr/local)'], ['/var', '자주 바뀌는 데이터: 로그(/var/log), 캐시, 스풀, 웹 루트(/var/www)']]]],
      ex: [['ls /', '최상위 디렉터리 보기'], ['ls -l / | grep -- "->"', 'usrmerge 링크 확인'], ['tree -L 1 /', '트리로 보기']],
      see: ['file-hierarchy(7)', 'find(1)', 'ls(1)']
    }
  });

})(typeof window !== 'undefined' ? window : globalThis);

