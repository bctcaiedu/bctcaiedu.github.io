
/* 가상 리눅스 — 처음 설치된 Ubuntu Server 24.04 의 파일 트리 */
(function (G) {
  const LX = G.LX = G.LX || {};
  LX.IMAGE_VERSION = 6;
  LX.OS = {
    pretty: 'Ubuntu 24.04.3 LTS', version: '24.04.3 LTS (Noble Numbat)', codename: 'noble', id: '24.04',
    kernel: '6.8.0-71-generic', kernelBuild: '#71-Ubuntu SMP PREEMPT_DYNAMIC Tue Jul 22 16:52:38 UTC 2025'
  };

  const SAMPLE = {
    'fruits.txt': 'apple\nbanana\ncherry\ngrape\nkiwi\nmango\norange\npeach\npear\nstrawberry\n',
    'numbers.txt': '42\n7\n15\n3\n108\n23\n56\n8\n91\n4\n',
    'dup.txt': 'seoul\nbusan\nseoul\nincheon\nbusan\nseoul\ndaegu\nincheon\ngwangju\nseoul\n',
    'students.csv': 'id,name,dept,score\n1001,김민준,컴퓨터공학,88\n1002,이서연,전자공학,92\n1003,박지훈,컴퓨터공학,75\n1004,최수아,기계공학,64\n1005,정도윤,전자공학,81\n1006,강하은,컴퓨터공학,97\n1007,조예준,기계공학,58\n1008,윤지우,전자공학,70\n',
    'story.txt': 'Linux is a family of open-source Unix-like operating systems.\nUbuntu is a Linux distribution based on Debian.\nUbuntu is developed by Canonical and the community.\nA new LTS version of Ubuntu is released every two years.\nUbuntu 24.04 LTS is code-named Noble Numbat.\nLTS versions receive five years of standard security maintenance.\nThe command line is a powerful tool for system administrators.\n',
    'config.ini': '[server]\nhost=0.0.0.0\nport=8080\ndebug=false\n\n[database]\nhost=127.0.0.1\nport=3306\nname=appdb\nuser=appuser\n\n[log]\nlevel=info\npath=/var/log/app.log\n',
    'hello.sh': '#!/bin/bash\n# 실행 권한(x)이 없으면 ./hello.sh 로 실행할 수 없습니다\necho "Hello, Ubuntu!"\necho "오늘은 $(date +%Y-%m-%d) 입니다."\n',
    'README.txt': '실습용 예제 파일 모음 (~/lab)\n\nfruits.txt    과일 이름 10줄 (정렬 · head/tail 연습)\nnumbers.txt   숫자 10줄 (sort -n 연습)\ndup.txt       중복이 있는 도시 이름 (uniq 연습)\nstudents.csv  학생 성적 CSV (cut · awk 연습)\nstory.txt     영어 문장 7줄 (grep · wc 연습)\nconfig.ini    설정 파일 (grep · sed 연습)\naccess.log    웹 서버 접속 기록 (awk · sort · uniq 연습)\nserver.log    서버 로그 (grep -i error 연습)\nhello.sh      실행 권한이 없는 스크립트 (chmod 연습)\n'
  };

  function accessLog() {
    const ips = ['192.168.0.12', '192.168.0.25', '10.0.2.2', '203.0.113.7', '198.51.100.23', '192.168.0.12', '203.0.113.7', '192.168.0.40'];
    const reqs = [['GET', '/', 200, 612], ['GET', '/index.html', 200, 612], ['GET', '/about.html', 200, 1280], ['GET', '/images/logo.png', 200, 5421], ['POST', '/login', 302, 0], ['GET', '/admin', 403, 162], ['GET', '/wp-login.php', 404, 162], ['GET', '/api/users', 200, 845], ['GET', '/missing.html', 404, 162], ['GET', '/api/orders', 500, 177]];
    const agents = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/139.0', 'curl/8.5.0', 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) Firefox/142.0', 'python-requests/2.31.0'];
    let s = '';
    let seed = 7;
    const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
    for (let i = 0; i < 40; i++) {
      const ip = ips[rnd(ips.length)];
      const r = reqs[rnd(reqs.length)];
      const mm = String(10 + Math.floor(i / 6)).padStart(2, '0');
      const ss = String((i * 13) % 60).padStart(2, '0');
      s += `${ip} - - [15/Sep/2026:09:${mm}:${ss} +0900] "${r[0]} ${r[1]} HTTP/1.1" ${r[2]} ${r[3]} "-" "${agents[rnd(agents.length)]}"\n`;
    }
    return s;
  }

  function serverLog() {
    return [
      '2026-09-15 09:00:01 INFO  Server starting (version 2.4.1)',
      '2026-09-15 09:00:02 INFO  Loading configuration from /etc/app/config.ini',
      '2026-09-15 09:00:02 INFO  Connected to database appdb',
      '2026-09-15 09:05:17 WARN  Slow query detected (2.3s): SELECT * FROM orders',
      '2026-09-15 09:12:40 INFO  User kim logged in',
      '2026-09-15 09:20:03 ERROR Failed to send email: connection refused',
      '2026-09-15 09:25:11 INFO  User lee logged in',
      '2026-09-15 09:31:45 WARN  Disk usage is 85%',
      '2026-09-15 09:40:22 ERROR Timeout while calling payment API',
      '2026-09-15 09:41:00 INFO  Retrying payment API',
      '2026-09-15 09:41:02 INFO  Payment API OK',
      '2026-09-15 09:55:30 error Unexpected token in request body',
      '2026-09-15 10:00:00 INFO  Hourly report generated'
    ].join('\n') + '\n';
  }

  const BASHRC = `# ~/.bashrc: executed by bash(1) for non-login shells.
# see /usr/share/doc/bash/examples/startup-files (in the package bash-doc)
# for examples

# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac

# don't put duplicate lines or lines starting with space in the history.
HISTCONTROL=ignoreboth

# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTSIZE=1000
HISTFILESIZE=2000

# set a fancy prompt (non-color, unless we know we "want" color)
PS1='\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '

# enable color support of ls and also add handy aliases
alias ls='ls --color=auto'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

# some more ls aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'

# Alias definitions.
# You may want to put all your additions into a separate file like
# ~/.bash_aliases, instead of adding them here directly.
if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi
`;
  const PROFILE = `# ~/.profile: executed by the command interpreter for login shells.

# if running bash
if [ -n "$BASH_VERSION" ]; then
    # include .bashrc if it exists
    if [ -f "$HOME/.bashrc" ]; then
\t. "$HOME/.bashrc"
    fi
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
fi
`;
  const ROOT_BASHRC = BASHRC.replace("PS1='\\[\\033[01;32m\\]", "PS1='\\[\\033[01;31m\\]");

  const PASSWD = `root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/run/ircd:/usr/sbin/nologin
_apt:x:42:65534::/nonexistent:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:998:998:systemd Network Management:/:/usr/sbin/nologin
systemd-timesync:x:996:996:systemd Time Synchronization:/:/usr/sbin/nologin
dhcpcd:x:100:65534:DHCP Client Daemon,,,:/usr/lib/dhcpcd:/bin/false
messagebus:x:101:102::/nonexistent:/usr/sbin/nologin
systemd-resolve:x:992:992:systemd Resolver:/:/usr/sbin/nologin
pollinate:x:102:1::/var/cache/pollinate:/bin/false
polkitd:x:991:991:User for polkitd:/:/usr/sbin/nologin
syslog:x:103:104::/nonexistent:/usr/sbin/nologin
uuidd:x:104:105::/run/uuidd:/usr/sbin/nologin
tcpdump:x:105:107::/nonexistent:/usr/sbin/nologin
tss:x:106:108:TPM software stack,,,:/var/lib/tpm:/bin/false
landscape:x:107:109::/var/lib/landscape:/usr/sbin/nologin
fwupd-refresh:x:989:989:Firmware update daemon:/var/lib/fwupd:/usr/sbin/nologin
usbmux:x:108:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
student:x:1000:1000:Student:/home/student:/bin/bash
`;
  const GROUP = `root:x:0:
daemon:x:1:
bin:x:2:
sys:x:3:
adm:x:4:syslog,student
tty:x:5:
disk:x:6:
lp:x:7:
mail:x:8:
news:x:9:
uucp:x:10:
man:x:12:
proxy:x:13:
kmem:x:15:
dialout:x:20:
fax:x:21:
voice:x:22:
cdrom:x:24:student
floppy:x:25:
tape:x:26:
sudo:x:27:student
audio:x:29:
dip:x:30:student
www-data:x:33:
backup:x:34:
operator:x:37:
list:x:38:
irc:x:39:
src:x:40:
shadow:x:42:
utmp:x:43:
video:x:44:
sasl:x:45:
plugdev:x:46:
staff:x:50:
games:x:60:
users:x:100:student
nogroup:x:65534:
systemd-journal:x:999:
systemd-network:x:998:
systemd-timesync:x:996:
input:x:995:
sgx:x:994:
kvm:x:993:
render:x:992:
systemd-resolve:x:991:
messagebus:x:102:
crontab:x:103:
syslog:x:104:
uuidd:x:105:
_ssh:x:106:
tcpdump:x:107:
tss:x:108:
landscape:x:109:
fwupd-refresh:x:989:
polkitd:x:990:
admin:x:110:
netdev:x:111:
lxd:x:112:student
student:x:1000:
`;

  const SUDOERS = `#
# This file MUST be edited with the 'visudo' command as root.
#
# Please consider adding local content in /etc/sudoers.d/ instead of
# directly modifying this file.
#
# See the man page for details on how to write a sudoers file.
#
Defaults\tenv_reset
Defaults\tmail_badpass
Defaults\tsecure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"

# This fixes CVE-2005-4890 and possibly breaks some versions of kdesu
# (#1011624, https://bugs.kali.org/view.php?id=5039)
Defaults\tuse_pty

# Host alias specification

# User alias specification

# Cmnd alias specification

# User privilege specification
root\tALL=(ALL:ALL) ALL

# Members of the admin group may gain root privileges
%admin ALL=(ALL) ALL

# Allow members of group sudo to execute any command
%sudo\tALL=(ALL:ALL) ALL

# See sudoers(5) for more information on "@include" directives:

@includedir /etc/sudoers.d
`;

  const CRONTAB = `# /etc/crontab: system-wide crontab
# Unlike any other crontab you don't have to run the \`crontab'
# command to install the new version when you edit this file
# and files in /etc/cron.d. These files also have username fields,
# that none of the other crontabs do.

SHELL=/bin/sh
# You can also override PATH, but by default, newer versions inherit it from the environment
#PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
# |  |  |  |  |
# *  *  *  *  * user-name command to be executed
17 *\t* * *\troot\tcd / && run-parts --report /etc/cron.hourly
25 6\t* * *\troot\ttest -x /usr/sbin/anacron || { cd / && run-parts --report /etc/cron.daily; }
47 6\t* * 7\troot\ttest -x /usr/sbin/anacron || { cd / && run-parts --report /etc/cron.weekly; }
52 6\t1 * *\troot\ttest -x /usr/sbin/anacron || { cd / && run-parts --report /etc/cron.monthly; }
#
`;

  function sysLog(host) {
    const lines = [
      'systemd[1]: Started systemd-journald.service - Journal Service.',
      'kernel: Linux version 6.8.0-71-generic (buildd@lcy02-amd64-015) (x86_64-linux-gnu-gcc-13 (Ubuntu 13.3.0-6ubuntu2~24.04) 13.3.0)',
      'kernel: Command line: BOOT_IMAGE=/vmlinuz-6.8.0-71-generic root=/dev/mapper/ubuntu--vg-ubuntu--lv ro',
      'systemd[1]: Reached target local-fs.target - Local File Systems.',
      'systemd-networkd[521]: enp0s3: Link UP',
      'systemd-networkd[521]: enp0s3: Gained carrier',
      'systemd-networkd[521]: enp0s3: DHCPv4 address 10.0.2.15/24, gateway 10.0.2.2 acquired from 10.0.2.2',
      'systemd-resolved[528]: Using system hostname \'' + host + '\'.',
      'systemd-timesyncd[530]: Initial clock synchronization to Mon 2026-09-14 23:51:02.114133 UTC.',
      'systemd[1]: Started cron.service - Regular background program processing daemon.',
      'cron[701]: (CRON) INFO (Running @reboot jobs)',
      'systemd[1]: Started rsyslog.service - System Logging Service.',
      'systemd[1]: Started snapd.service - Snap Daemon.',
      'systemd[1]: Reached target multi-user.target - Multi-User System.',
      'systemd[1]: Startup finished in 2.311s (kernel) + 6.742s (userspace) = 9.053s.'
    ];
    return lines.map((l, i) => `2026-09-15T08:51:${String(i * 3).padStart(2, '0')}.${String(100000 + i * 37).slice(1)}+09:00 ${host} ${l}`).join('\n') + '\n';
  }

  /** 기본 파일 트리 만들기 */
  LX.buildImage = function (m) {
    const fs = m.vfs;
    const D = (p, mode = 0o755, u = 0, g = 0) => { fs.mkdir(p, null, { parents: true }); const n = fs.lookup(p, false); n.m = mode; n.u = u; n.g = g; };
    const F = (p, text, mode = 0o644, u = 0, g = 0) => { fs.mkdir(LX.path.dirname(p), null, { parents: true }); fs.writeFile(p, text, null, { mode }); const n = fs.lookup(p, false); n.m = mode; n.u = u; n.g = g; return n; };
    const L = (p, target) => fs.symlink(target, p, null);

    ['/usr/bin', '/usr/sbin', '/usr/lib', '/usr/lib64', '/usr/local/bin', '/usr/local/sbin', '/usr/local/lib', '/usr/share', '/usr/games', '/usr/include', '/usr/libexec',
      '/boot/grub', '/etc', '/home', '/media', '/mnt', '/opt', '/srv', '/snap/bin', '/var/lib', '/var/cache', '/var/backups', '/var/opt', '/var/mail', '/var/spool', '/var/local',
      '/dev', '/proc', '/sys/class/net', '/run', '/usr/share/zoneinfo'].forEach((p) => D(p));
    L('/bin', 'usr/bin'); L('/sbin', 'usr/sbin'); L('/lib', 'usr/lib'); L('/lib64', 'usr/lib64');
    D('/root', 0o700);
    D('/tmp', 0o1777);
    D('/var/tmp', 0o1777);
    D('/lost+found', 0o700);
    D('/var/log', 0o775, 0, 104);
    D('/var/log/apt');
    D('/var/log/journal', 0o2755, 0, 999);
    D('/var/spool/cron/crontabs', 0o1730, 0, 103);
    D('/run/user/1000', 0o700, 1000, 1000);
    D('/run/systemd/resolve');
    D('/var/lib/apt/lists'); D('/var/cache/apt/archives'); D('/var/lib/dpkg');
    D('/etc/systemd/system/multi-user.target.wants'); D('/usr/lib/systemd/system'); D('/etc/sudoers.d', 0o750);
    ['cron.d', 'cron.daily', 'cron.hourly', 'cron.weekly', 'cron.monthly', 'logrotate.d', 'skel', 'apt/sources.list.d', 'apt/apt.conf.d', 'apt/keyrings', 'netplan', 'ssh', 'ssh/ssh_config.d', 'default', 'ufw/applications.d', 'profile.d', 'security', 'update-motd.d', 'systemd/network', 'ssl/certs', 'ssl/private'].forEach((d) => D('/etc/' + d));
    fs.lookup('/etc/ssl/private').m = 0o710;
    fs.lookup('/etc/netplan').m = 0o755;

    // ---- 운영체제 정보
    const O = LX.OS;
    F('/usr/lib/os-release', `PRETTY_NAME="${O.pretty}"\nNAME="Ubuntu"\nVERSION_ID="${O.id}"\nVERSION="${O.version}"\nVERSION_CODENAME=${O.codename}\nID=ubuntu\nID_LIKE=debian\nHOME_URL="https://www.ubuntu.com/"\nSUPPORT_URL="https://help.ubuntu.com/"\nBUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"\nPRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"\nUBUNTU_CODENAME=${O.codename}\nLOGO=ubuntu-logo\n`);
    L('/etc/os-release', '../usr/lib/os-release');
    F('/etc/lsb-release', `DISTRIB_ID=Ubuntu\nDISTRIB_RELEASE=${O.id}\nDISTRIB_CODENAME=${O.codename}\nDISTRIB_DESCRIPTION="${O.pretty}"\n`);
    F('/etc/issue', `${O.pretty} \\n \\l\n\n`);
    F('/etc/issue.net', `${O.pretty}\n`);
    F('/etc/debian_version', 'trixie/sid\n');
    F('/etc/hostname', 'ubuntu\n');
    F('/etc/hosts', '127.0.0.1 localhost\n127.0.1.1 ubuntu\n\n# The following lines are desirable for IPv6 capable hosts\n::1     ip6-localhost ip6-loopback\nfe00::0 ip6-localnet\nff00::0 ip6-mcastprefix\nff02::1 ip6-allnodes\nff02::2 ip6-allrouters\n');
    F('/etc/machine-id', '5f1c0d9e2b7a4c6f8e3d1a2b4c6d8e0f\n', 0o444);
    F('/etc/timezone', 'Etc/UTC\n');
    ['Etc/UTC', 'Asia/Seoul', 'Asia/Tokyo', 'Asia/Shanghai', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Australia/Sydney'].forEach((z) => F('/usr/share/zoneinfo/' + z, 'TZif2\n'));
    L('/etc/localtime', '/usr/share/zoneinfo/Etc/UTC');
    F('/etc/shells', '# /etc/shells: valid login shells\n/bin/sh\n/usr/bin/sh\n/bin/bash\n/usr/bin/bash\n/bin/rbash\n/usr/bin/rbash\n/usr/bin/dash\n/usr/bin/tmux\n/usr/bin/screen\n');
    F('/etc/environment', 'PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin"\n');
    F('/etc/profile', '# /etc/profile: system-wide .profile file for the Bourne shell (sh(1))\n# and Bourne compatible shells (bash(1), ksh(1), ash(1), ...).\n\nif [ -d /etc/profile.d ]; then\n  for i in /etc/profile.d/*.sh; do\n    if [ -r $i ]; then\n      . $i\n    fi\n  done\n  unset i\nfi\n');
    F('/etc/bash.bashrc', '# System-wide .bashrc file for interactive bash(1) shells.\n\n# If not running interactively, don\'t do anything\n[ -z "$PS1" ] && return\n\n# check the window size after each command and, if necessary,\n# update the values of LINES and COLUMNS.\nshopt -s checkwinsize\n');
    F('/etc/login.defs', '#\n# /etc/login.defs - Configuration control definitions for the login package.\n#\nMAIL_DIR        /var/mail\nFAILLOG_ENAB\t\tyes\nLOG_OK_LOGINS\t\tno\n\n# Password aging controls:\nPASS_MAX_DAYS\t99999\nPASS_MIN_DAYS\t0\nPASS_WARN_AGE\t7\n\n# Min/max values for automatic uid selection in useradd(8)\nUID_MIN\t\t\t 1000\nUID_MAX\t\t\t60000\nSYS_UID_MIN\t\t  100\nSYS_UID_MAX\t\t  999\nGID_MIN\t\t\t 1000\nGID_MAX\t\t\t60000\n\nUMASK\t\t022\nHOME_MODE\t0750\nUSERGROUPS_ENAB yes\nENCRYPT_METHOD YESCRYPT\n');
    F('/etc/adduser.conf', '# /etc/adduser.conf: `adduser\' configuration.\nDSHELL=/bin/bash\nDHOME=/home\nGROUPHOMES=no\nLETTERHOMES=no\nSKEL=/etc/skel\nFIRST_SYSTEM_UID=100\nLAST_SYSTEM_UID=999\nFIRST_UID=1000\nLAST_UID=59999\nUSERGROUPS=yes\nDIR_MODE=0750\n');
    F('/etc/passwd', PASSWD);
    F('/etc/group', GROUP);
    const days = Math.floor(Date.now() / 86400000) - 12;
    const shadowLines = PASSWD.trim().split('\n').map((l) => {
      const name = l.split(':')[0];
      if (name === 'student') return `student:${LX.hashPw(m.defaultPassword, 'st2024ub')}:${days}:0:99999:7:::`;
      if (name === 'root') return `root:*:${days}:0:99999:7:::`;
      return `${name}:*:${days}:0:99999:7:::`;
    });
    F('/etc/shadow', shadowLines.join('\n') + '\n', 0o640, 0, 42);
    F('/etc/gshadow', GROUP.trim().split('\n').map((l) => { const f = l.split(':'); return `${f[0]}:*::${f[3]}`; }).join('\n') + '\n', 0o640, 0, 42);
    F('/etc/sudoers', SUDOERS, 0o440);
    F('/etc/sudoers.d/README', '#\n# The default /etc/sudoers file created on installation of the\n# sudo  package now includes the directive:\n#\n# \t@includedir /etc/sudoers.d\n#\n# This will cause sudo to read and parse any files in the /etc/sudoers.d\n# directory that do not end in \'~\' or contain a \'.\' character.\n#\n', 0o440);
    F('/etc/fstab', '# /etc/fstab: static file system information.\n#\n# Use \'blkid\' to print the universally unique identifier for a\n# device; this may be used with UUID= as a more robust way to name devices\n# that works even if disks are added and removed. See fstab(5).\n#\n# <file system> <mount point>   <type>  <options>       <dump>  <pass>\n# / was on /dev/ubuntu-vg/ubuntu-lv during curtin installation\n/dev/disk/by-id/dm-uuid-LVM-Yx3tQn8eK1dP0bT2cW9zRr5mL7vH4sJfG6aD1kN3pQ8uV2wX5yZ0bC7eF9hJ2kL4 / ext4 defaults 0 1\n# /boot was on /dev/sda2 during curtin installation\n/dev/disk/by-uuid/4c1f2c9a-6d3b-4c3e-9d58-2b1a7f0c6e11 /boot ext4 defaults 0 1\n/swap.img\tnone\tswap\tsw\t0\t0\n');
    F('/etc/resolv.conf.stub', '');
    fs.unlink('/etc/resolv.conf.stub', null);
    F('/run/systemd/resolve/stub-resolv.conf', '# This is /run/systemd/resolve/stub-resolv.conf managed by man:systemd-resolved(8).\n# Do not edit.\n#\n# This file might be symlinked as /etc/resolv.conf. If you\'re looking at\n# /etc/resolv.conf and seeing this text, you have followed the symlink.\n#\n# Run "resolvectl status" to see details about the uplink DNS servers\n# currently in use.\n\nnameserver 127.0.0.53\noptions edns0 trust-ad\nsearch .\n');
    L('/etc/resolv.conf', '../run/systemd/resolve/stub-resolv.conf');
    F('/etc/netplan/50-cloud-init.yaml', 'network:\n  version: 2\n  ethernets:\n    enp0s3:\n      dhcp4: true\n', 0o600);
    F('/etc/apt/sources.list', '# Ubuntu sources have moved to /etc/apt/sources.list.d/ubuntu.sources\n');
    F('/etc/apt/sources.list.d/ubuntu.sources', 'Types: deb\nURIs: http://kr.archive.ubuntu.com/ubuntu/\nSuites: noble noble-updates noble-backports\nComponents: main restricted universe multiverse\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n\nTypes: deb\nURIs: http://security.ubuntu.com/ubuntu/\nSuites: noble-security\nComponents: main restricted universe multiverse\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n');
    F('/etc/apt/apt.conf.d/20auto-upgrades', 'APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n');
    F('/etc/apt/apt.conf.d/50unattended-upgrades', '// Automatically upgrade packages from these (origin:archive) pairs\nUnattended-Upgrade::Allowed-Origins {\n\t"${distro_id}:${distro_codename}";\n\t"${distro_id}:${distro_codename}-security";\n\t"${distro_id}ESMApps:${distro_codename}-apps-security";\n\t"${distro_id}ESM:${distro_codename}-infra-security";\n};\n\n// Automatically reboot *WITHOUT CONFIRMATION* if\n//  the file /var/run/reboot-required is found after the upgrade\n//Unattended-Upgrade::Automatic-Reboot "false";\n');
    F('/etc/crontab', CRONTAB);
    ['logrotate', 'apt-compat', 'dpkg', 'man-db'].forEach((f) => F('/etc/cron.daily/' + f, '#!/bin/sh\n# 매일 실행되는 시스템 작업\nexit 0\n', 0o755));
    F('/etc/cron.d/e2scrub_all', '30 3 * * 0 root test -e /run/systemd/system || SERVICE_MODE=1 /usr/lib/x86_64-linux-gnu/e2fsprogs/e2scrub_all_cron\n');
    F('/etc/logrotate.conf', '# see "man logrotate" for details\n\n# global options do not affect preceding include directives\n\n# rotate log files weekly\nweekly\n\n# use the adm group by default, since this is the owning group\n# of /var/log/.\nsu root adm\n\n# keep 4 weeks worth of backlogs\nrotate 4\n\n# create new (empty) log files after rotating old ones\ncreate\n\n# use date as a suffix of the rotated file\n#dateext\n\n# uncomment this if you want your log files compressed\n#compress\n\n# packages drop log rotation information into this directory\ninclude /etc/logrotate.d\n');
    F('/etc/logrotate.d/rsyslog', '/var/log/syslog\n/var/log/mail.log\n/var/log/kern.log\n/var/log/auth.log\n/var/log/user.log\n/var/log/cron.log\n{\n\trotate 4\n\tweekly\n\tmissingok\n\tnotifempty\n\tcompress\n\tdelaycompress\n\tsharedscripts\n\tpostrotate\n\t\t/usr/lib/rsyslog/rsyslog-rotate\n\tendscript\n}\n');
    F('/etc/logrotate.d/apt', '/var/log/apt/term.log {\n  rotate 12\n  monthly\n  compress\n  missingok\n  notifempty\n}\n\n/var/log/apt/history.log {\n  rotate 12\n  monthly\n  compress\n  missingok\n  notifempty\n}\n');
    F('/etc/default/ufw', '# /etc/default/ufw\n#\n\n# Set to yes to apply rules to support IPv6 (no means only IPv6 on loopback\n# accepted). You will need to \'disable\' and then \'enable\' the firewall for\n# the changes to take affect.\nIPV6=yes\n\n# Set the default input policy to ACCEPT, DROP, or REJECT. Please note that if\n# you change this you will most likely want to adjust your rules.\nDEFAULT_INPUT_POLICY="DROP"\n\n# Set the default output policy to ACCEPT, DROP, or REJECT. Please note that if\n# you change this you will most likely want to adjust your rules.\nDEFAULT_OUTPUT_POLICY="ACCEPT"\n\nDEFAULT_FORWARD_POLICY="DROP"\n');
    F('/etc/ufw/ufw.conf', '# /etc/ufw/ufw.conf\n#\n\n# Set to yes to start on boot. If setting this remotely, be sure to add a rule\n# to allow your remote connection before starting ufw. Eg: \'ufw allow 22/tcp\'\nENABLED=no\n\n# Please use the \'ufw\' command to set the loglevel. Eg: \'ufw logging medium\'.\n# See \'man ufw\' for details.\nLOGLEVEL=low\n');
    F('/etc/ssh/ssh_config', '# This is the ssh client system-wide configuration file.  See\n# ssh_config(5) for more information.\n\nInclude /etc/ssh/ssh_config.d/*.conf\n\nHost *\n#   ForwardAgent no\n#   PasswordAuthentication yes\n#   IdentityFile ~/.ssh/id_rsa\n#   IdentityFile ~/.ssh/id_ed25519\n#   Port 22\n    SendEnv LANG LC_*\n    HashKnownHosts yes\n    GSSAPIAuthentication yes\n');
    F('/etc/services', '# Network services, Internet style\ntcpmux\t\t1/tcp\t\t\t\t# TCP port service multiplexer\necho\t\t7/tcp\nftp-data\t20/tcp\nftp\t\t21/tcp\nssh\t\t22/tcp\t\t\t\t# SSH Remote Login Protocol\ntelnet\t\t23/tcp\nsmtp\t\t25/tcp\t\tmail\ndomain\t\t53/tcp\t\t\t\t# Domain Name Server\ndomain\t\t53/udp\nhttp\t\t80/tcp\t\twww\t\t# WorldWideWeb HTTP\npop3\t\t110/tcp\t\tpop-3\t\t# POP version 3\nntp\t\t123/udp\t\t\t\t# Network Time Protocol\nimap2\t\t143/tcp\t\timap\t\t# Interim Mail Access P 2 and 4\nhttps\t\t443/tcp\t\t\t\t# http protocol over TLS/SSL\nmicrosoft-ds\t445/tcp\nsubmission\t587/tcp\nimaps\t\t993/tcp\nmysql\t\t3306/tcp\npostgresql\t5432/tcp\t\tpostgres\t# PostgreSQL Database\nredis\t\t6379/tcp\nhttp-alt\t8080/tcp\t\twebcache\t# WWW caching service\n');
    F('/etc/protocols', 'ip\t0\tIP\nicmp\t1\tICMP\ntcp\t6\tTCP\nudp\t17\tUDP\n');
    F('/etc/nsswitch.conf', 'passwd:         files systemd\ngroup:          files systemd\nshadow:         files systemd\ngshadow:        files systemd\n\nhosts:          files dns\nnetworks:       files\n');
    F('/etc/motd', '');
    F('/etc/update-motd.d/00-header', '#!/bin/sh\nprintf "Welcome to %s (%s %s %s)\\n" "$DISTRIB_DESCRIPTION" "$(uname -o)" "$(uname -r)" "$(uname -m)"\n', 0o755);
    F('/etc/systemd/journald.conf', '[Journal]\n#Storage=auto\n#Compress=yes\n#SystemMaxUse=\n#MaxRetentionSec=0\n');
    F('/etc/systemd/timesyncd.conf', '[Time]\n#NTP=\n#FallbackNTP=ntp.ubuntu.com\n');
    F('/etc/security/limits.conf', '# /etc/security/limits.conf\n#\n#<domain>      <type>  <item>         <value>\n#\n#*               soft    core            0\n#root            hard    core            100000\n#@student        hard    nproc           20\n\n# End of file\n');
    F('/etc/sysctl.conf', '#\n# /etc/sysctl.conf - Configuration file for setting system variables\n# See /etc/sysctl.d/ for additional system variables.\n# See sysctl.conf (5) for information.\n#\n\n# Uncomment the next line to enable packet forwarding for IPv4\n#net.ipv4.ip_forward=1\n');
    F('/etc/ca-certificates.conf', 'mozilla/ISRG_Root_X1.crt\nmozilla/DigiCert_Global_Root_G2.crt\n');

    // ---- 사용자 홈
    F('/etc/skel/.bashrc', BASHRC);
    F('/etc/skel/.profile', PROFILE);
    F('/etc/skel/.bash_logout', '# ~/.bash_logout: executed by bash(1) when login shell exits.\n\n# when leaving the console clear the screen to increase privacy\n\nif [ "$SHLVL" = 1 ]; then\n    [ -x /usr/bin/clear_console ] && /usr/bin/clear_console -q\nfi\n');
    D('/home/student', 0o750, 1000, 1000);
    F('/home/student/.bashrc', BASHRC, 0o644, 1000, 1000);
    F('/home/student/.profile', PROFILE, 0o644, 1000, 1000);
    F('/home/student/.bash_logout', fs.readFile('/etc/skel/.bash_logout', null), 0o644, 1000, 1000);
    F('/home/student/.bash_history', '', 0o600, 1000, 1000);
    D('/home/student/.cache', 0o700, 1000, 1000);
    F('/home/student/.cache/motd.legal-displayed', '', 0o644, 1000, 1000);
    F('/home/student/.sudo_as_admin_successful', '', 0o644, 1000, 1000);
    D('/home/student/lab', 0o775, 1000, 1000);
    Object.keys(SAMPLE).forEach((f) => F('/home/student/lab/' + f, SAMPLE[f], 0o664, 1000, 1000));
    F('/home/student/lab/access.log', accessLog(), 0o664, 1000, 1000);
    F('/home/student/lab/server.log', serverLog(), 0o664, 1000, 1000);
    F('/root/.bashrc', ROOT_BASHRC, 0o644);
    F('/root/.profile', '# ~/.profile: executed by Bourne-compatible login shells.\n\nif [ "$BASH" ]; then\n  if [ -f ~/.bashrc ]; then\n    . ~/.bashrc\n  fi\nfi\n\nmesg n 2> /dev/null || true\n', 0o644);
    D('/root/snap', 0o700);

    // ---- /boot · /dev
    const K = O.kernel;
    F('/boot/vmlinuz-' + K, 'kernel image\n', 0o600).sz = 14958984;
    F('/boot/initrd.img-' + K, 'initramfs\n', 0o644).sz = 73466810;
    F('/boot/config-' + K, 'CONFIG_64BIT=y\nCONFIG_X86_64=y\nCONFIG_EXT4_FS=y\n', 0o644).sz = 287433;
    F('/boot/System.map-' + K, '', 0o600).sz = 9187455;
    L('/boot/vmlinuz', 'vmlinuz-' + K);
    L('/boot/initrd.img', 'initrd.img-' + K);
    F('/boot/grub/grub.cfg', '#\n# DO NOT EDIT THIS FILE\n#\n# It is automatically generated by grub-mkconfig using templates\n# from /etc/grub.d and settings from /etc/default/grub\n#\nset default="0"\nset timeout=0\nmenuentry \'Ubuntu\' --class ubuntu --class gnu-linux --class gnu --class os {\n\tlinux\t/vmlinuz-' + K + ' root=/dev/mapper/ubuntu--vg-ubuntu--lv ro\n\tinitrd\t/initrd.img-' + K + '\n}\n', 0o444);
    F('/etc/default/grub', '# If you change this file, run \'update-grub\' afterwards to update\n# /boot/grub/grub.cfg.\n\nGRUB_DEFAULT=0\nGRUB_TIMEOUT_STYLE=hidden\nGRUB_TIMEOUT=0\nGRUB_DISTRIBUTOR=`( . /etc/os-release; echo ${NAME:-Ubuntu} ) 2>/dev/null || echo Ubuntu`\nGRUB_CMDLINE_LINUX_DEFAULT=""\nGRUB_CMDLINE_LINUX=""\n');
    const dev = (p, t, mode, g = 0, c = '') => { fs.writeFile(p, c, null, { mode }); const n = fs.lookup(p, false); n.t = t; n.m = mode; n.g = g; };
    dev('/dev/null', 'c', 0o666); dev('/dev/zero', 'c', 0o666); dev('/dev/random', 'c', 0o666); dev('/dev/urandom', 'c', 0o666); dev('/dev/tty', 'c', 0o666, 5); dev('/dev/console', 'c', 0o600);
    D('/dev/pts'); dev('/dev/pts/0', 'c', 0o620, 5);
    L('/dev/stdin', '/proc/self/fd/0'); L('/dev/stdout', '/proc/self/fd/1'); L('/dev/stderr', '/proc/self/fd/2');
    D('/dev/mapper'); D('/dev/disk/by-uuid'); D('/dev/ubuntu-vg');
    LX.syncDevices(m);
    F('/swap.img', '', 0o600).sz = 4 * 1024 * 1024 * 1024;

    // ---- /var
    F('/var/log/syslog', sysLog('ubuntu'), 0o640, 103, 4);
    F('/var/log/auth.log', '2026-09-15T08:51:40.100211+09:00 ubuntu systemd-logind[640]: New seat seat0.\n2026-09-15T08:52:12.781013+09:00 ubuntu login[744]: pam_unix(login:session): session opened for user student(uid=1000) by LOGIN(uid=0)\n2026-09-15T08:52:12.790114+09:00 ubuntu systemd-logind[640]: New session 1 of user student.\n', 0o640, 103, 4);
    F('/var/log/kern.log', '2026-09-15T08:51:03.000000+09:00 ubuntu kernel: Linux version ' + K + '\n2026-09-15T08:51:03.000000+09:00 ubuntu kernel: Memory: 3960812K/4193848K available\n', 0o640, 103, 4);
    F('/var/log/dpkg.log', '2026-09-03 11:20:31 startup archives unpack\n2026-09-03 11:20:33 install tzdata:all <none> 2025b-0ubuntu0.24.04.1\n2026-09-03 11:20:35 status installed tzdata:all 2025b-0ubuntu0.24.04.1\n');
    F('/var/log/apt/history.log', '\nStart-Date: 2026-09-03  11:20:30\nCommandline: apt-get -y install ubuntu-server\nInstall: ubuntu-server:amd64 (1.539.2)\nEnd-Date: 2026-09-03  11:21:02\n');
    F('/var/log/apt/term.log', '');
    F('/var/log/cloud-init.log', '2026-09-03 11:18:11,120 - util.py[DEBUG]: Cloud-init v. 25.1.4 running \'init-local\'\n');
    F('/var/log/lastlog', '', 0o664, 0, 43);
    F('/var/lib/dpkg/status', '');

    // ---- 기본 패키지 · 서비스
    Object.values(LX.PKGS).filter((p) => p.base).forEach((p) => LX.pkgFiles(m, p.name, true));
    ['cron', 'rsyslog', 'snapd', 'unattended-upgrades', 'systemd-journald', 'systemd-networkd', 'systemd-resolved', 'systemd-timesyncd', 'systemd-logind', 'dbus', 'ufw'].forEach((s) => {
      m.state.services[s] = { active: s !== 'ufw' ? true : true, enabled: true, since: null, pid: (LX.SERVICES[s] && LX.SERVICES[s].sys) || m.nextPid() };
      LX.writeUnit(m, s);
    });
    D('/usr/share/doc'); D('/usr/share/man/man1'); D('/usr/share/keyrings');
    F('/usr/share/keyrings/ubuntu-archive-keyring.gpg', '-----BEGIN PGP PUBLIC KEY BLOCK-----\n', 0o644);
    D('/snap/core22'); D('/snap/snapd'); D('/snap/lxd');
    m.installBin('labclient', '/usr/local/bin');
    m.installBin('wsl-lab', '/usr/local/bin');
    D('/sys/class/net/lo'); D('/sys/class/net/enp0s3');
  };

  /** /dev 의 디스크 장치 파일을 상태에 맞게 다시 만든다 */
  LX.syncDevices = function (m) {
    const fs = m.vfs;
    const mk = (p) => { if (!fs.lookup(p, false)) { fs.writeFile(p, '', null, { mode: 0o660 }); const n = fs.lookup(p, false); n.t = 'b'; n.m = 0o660; n.g = 6; } };
    // 사라진 파티션 정리
    for (const name of fs.readdir('/dev', null)) {
      if (/^sd[a-z]\d+$/.test(name)) {
        const disk = name.replace(/\d+$/, '');
        const d = m.state.disks[disk];
        if (!d || !d.parts.some((p) => p.name === name)) fs.unlink('/dev/' + name, null);
      }
    }
    for (const [name, d] of Object.entries(m.state.disks)) {
      mk('/dev/' + name);
      (d.parts || []).forEach((p) => mk('/dev/' + p.name));
    }
    for (const [vg, v] of Object.entries(m.state.vgs)) {
      for (const lv of Object.keys(v.lvs)) {
        const dm = `/dev/mapper/${vg.replace(/-/g, '--')}-${lv.replace(/-/g, '--')}`;
        mk(dm);
        if (!fs.lookup(`/dev/${vg}`, false)) fs.mkdir(`/dev/${vg}`, null);
        if (!fs.lookup(`/dev/${vg}/${lv}`, false)) fs.symlink('../mapper/' + P().basename(dm), `/dev/${vg}/${lv}`, null);
      }
    }
    if (!fs.lookup('/dev/cdrom', false)) fs.symlink('sr0', '/dev/cdrom', null);
  };
  const P = () => LX.path;

  /** systemd 유닛 파일 */
  LX.writeUnit = function (m, name) {
    const s = LX.SERVICES[name];
    if (!s || !s.unit) return;
    const text = `[Unit]\nDescription=${s.desc}\n${s.doc ? 'Documentation=' + s.doc + '\n' : ''}After=network.target\n\n[Service]\n${s.oneshot ? 'Type=oneshot\nRemainAfterExit=yes\n' : 'Type=simple\n'}ExecStart=${(s.procs && s.procs[0] ? s.procs[0][0] : s.exec || '/usr/sbin/' + name).replace(/^.*?: (master process )?/, '')}\n${s.oneshot ? '' : 'Restart=on-failure\n'}\n[Install]\nWantedBy=multi-user.target\n`;
    try { m.vfs.writeFile(s.unit, text, null, { mode: 0o644 }); } catch (e) { /* 무시 */ }
  };

  /** /proc 동적 파일 */
  LX.attachProc = function (m) {
    const fs = m.vfs;
    const g = fs.gen;
    const mem = () => LX.memInfo(m);
    g.cpuinfo = () => {
      let s = '';
      for (let i = 0; i < 2; i++) s += `processor\t: ${i}\nvendor_id\t: GenuineIntel\ncpu family\t: 6\nmodel\t\t: 154\nmodel name\t: 12th Gen Intel(R) Core(TM) i5-1240P\nstepping\t: 3\ncpu MHz\t\t: 2111.998\ncache size\t: 12288 KB\nphysical id\t: 0\nsiblings\t: 2\ncore id\t\t: ${i}\ncpu cores\t: 2\nflags\t\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ht syscall nx rdtscp lm constant_tsc rep_good nopl xtopology nonstop_tsc cpuid tsc_known_freq pni pclmulqdq ssse3 cx16 pcid sse4_1 sse4_2 x2apic movbe popcnt aes xsave avx rdrand hypervisor lahf_lm abm 3dnowprefetch fsgsbase bmi1 avx2 bmi2 invpcid rdseed adx clflushopt sha_ni arat md_clear flush_l1d arch_capabilities\nbogomips\t: 4223.99\naddress sizes\t: 39 bits physical, 48 bits virtual\n\n`;
      return s;
    };
    g.meminfo = () => {
      const x = mem();
      return `MemTotal:        ${x.total} kB\nMemFree:         ${x.free} kB\nMemAvailable:    ${x.avail} kB\nBuffers:           ${x.buff} kB\nCached:          ${x.cache} kB\nSwapCached:            0 kB\nActive:           ${Math.round(x.used * 0.6)} kB\nInactive:        ${Math.round(x.cache * 0.7)} kB\nSwapTotal:       ${x.swapTotal} kB\nSwapFree:        ${x.swapTotal - x.swapUsed} kB\nShmem:              ${x.shared} kB\n`;
    };
    g.version = () => `Linux version ${LX.OS.kernel} (buildd@lcy02-amd64-015) (x86_64-linux-gnu-gcc-13 (Ubuntu 13.3.0-6ubuntu2~24.04) 13.3.0, GNU ld (GNU Binutils for Ubuntu) 2.42) ${LX.OS.kernelBuild}\n`;
    g.uptime = () => { const up = (m.now() - m.bootTime) / 1000; return `${up.toFixed(2)} ${(up * 1.8).toFixed(2)}\n`; };
    g.loadavg = () => `0.08 0.03 0.01 1/${m.allProcs().length + 90} ${m.pidSeq}\n`;
    g.mounts = () => m.state.mounts.map((x) => `${x.dev} ${x.dir} ${x.fs} ${x.opts} 0 0`).join('\n') + '\nproc /proc proc rw,nosuid,nodev,noexec,relatime 0 0\nsysfs /sys sysfs rw,nosuid,nodev,noexec,relatime 0 0\ntmpfs /run tmpfs rw,nosuid,nodev,noexec,relatime,size=400904k,mode=755 0 0\n';
    g.filesystems = () => 'nodev\tsysfs\nnodev\ttmpfs\nnodev\tproc\nnodev\tdevpts\n\text3\n\text2\n\text4\n\tsquashfs\n\tvfat\n\txfs\nnodev\tnfs\nnodev\toverlay\n';
    g.cmdline = () => `BOOT_IMAGE=/vmlinuz-${LX.OS.kernel} root=/dev/mapper/ubuntu--vg-ubuntu--lv ro\n`;
    g.swaps = () => 'Filename\t\t\t\tType\t\tSize\t\tUsed\t\tPriority\n' + m.state.swaps.filter((s) => s.on !== false).map((s, i) => `${s.file.padEnd(40)}${s.type.padEnd(16)}${String(s.size * 1024).padEnd(16)}0\t\t${-2 - i}`).join('\n') + '\n';
    g.partitions = () => {
      let s = 'major minor  #blocks  name\n\n';
      for (const [n, d] of Object.entries(m.state.disks)) {
        s += `   8        0 ${String(d.size * 1024).padStart(10)} ${n}\n`;
        (d.parts || []).forEach((p, i) => { s += `   8        ${i + 1} ${String(p.size * 1024).padStart(10)} ${p.name}\n`; });
      }
      return s;
    };
    g.ip_forward = () => (m.state.sysctl && m.state.sysctl['net.ipv4.ip_forward']) || '0\n';
    fs.genWrite.ip_forward = (d) => { m.state.sysctl = m.state.sysctl || {}; m.state.sysctl['net.ipv4.ip_forward'] = d.trim() + '\n'; };
    g.swappiness = () => (m.state.sysctl && m.state.sysctl['vm.swappiness']) || '60\n';
    fs.genWrite.swappiness = (d) => { m.state.sysctl = m.state.sysctl || {}; m.state.sysctl['vm.swappiness'] = d.trim() + '\n'; };
    g.hostname = () => m.hostname() + '\n';
    const mkgen = (p, gen) => {
      fs.mkdir(LX.path.dirname(p), null, { parents: true });
      if (!fs.lookup(p, false)) fs.writeFile(p, '', null, { mode: 0o444 });
      const n = fs.lookup(p, false);
      n.gen = gen;
      n.m = gen === 'ip_forward' || gen === 'swappiness' ? 0o644 : 0o444;
    };
    ['cpuinfo', 'meminfo', 'version', 'uptime', 'loadavg', 'mounts', 'filesystems', 'cmdline', 'swaps', 'partitions'].forEach((k) => mkgen('/proc/' + k, k));
    mkgen('/proc/sys/net/ipv4/ip_forward', 'ip_forward');
    mkgen('/proc/sys/vm/swappiness', 'swappiness');
    mkgen('/proc/sys/kernel/hostname', 'hostname');
  };

  /** 메모리 사용량 (kB) */
  LX.memInfo = function (m) {
    const total = 4005612;
    let usedPct = 6.5;
    m.allProcs().forEach((p) => { usedPct += p.sys ? 0 : (p.mem || 0.1) * 0.5; });
    const used = Math.round(total * usedPct / 100);
    const buff = 62180;
    const cache = 1402560 + Math.round(used * 0.3);
    const free = Math.max(100000, total - used - buff - cache);
    const swapTotal = m.state.swaps.filter((s) => s.on !== false).reduce((a, s) => a + s.size * 1024, 0);
    return { total, used, free, buff, cache, shared: 1204, avail: total - used, swapTotal, swapUsed: 0 };
  };
})(typeof window !== 'undefined' ? window : globalThis);

