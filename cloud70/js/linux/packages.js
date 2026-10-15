
/* 가상 리눅스 — 패키지 카탈로그 · 서비스 정의 · 설치 시 만들어지는 설정 파일 */
(function (G) {
  const LX = G.LX = G.LX || {};

  const T = LX.TPL = {};   // 설정 파일 원본

  T.nginxConf = `user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log;
include /etc/nginx/modules-enabled/*.conf;

events {
\tworker_connections 768;
}

http {
\t##
\t# Basic Settings
\t##
\tsendfile on;
\ttcp_nopush on;
\ttypes_hash_max_size 2048;
\t# server_tokens off;

\tinclude /etc/nginx/mime.types;
\tdefault_type application/octet-stream;

\t##
\t# SSL Settings
\t##
\tssl_protocols TLSv1.2 TLSv1.3;
\tssl_prefer_server_ciphers off;

\t##
\t# Logging Settings
\t##
\taccess_log /var/log/nginx/access.log;

\t##
\t# Gzip Settings
\t##
\tgzip on;

\t##
\t# Virtual Host Configs
\t##
\tinclude /etc/nginx/conf.d/*.conf;
\tinclude /etc/nginx/sites-enabled/*;
}
`;

  T.nginxDefault = `##
# You should look at the following URL's in order to grasp a solid understanding
# of Nginx configuration files in order to fully unleash the power of Nginx.
# https://www.nginx.com/resources/wiki/start/
##

# Default server configuration
#
server {
\tlisten 80 default_server;
\tlisten [::]:80 default_server;

\troot /var/www/html;

\t# Add index.php to the list if you are using PHP
\tindex index.html index.htm index.nginx-debian.html;

\tserver_name _;

\tlocation / {
\t\t# First attempt to serve request as file, then
\t\t# as directory, then fall back to displaying a 404.
\t\ttry_files $uri $uri/ =404;
\t}

\t# pass PHP scripts to FastCGI server
\t#
\t#location ~ \\.php$ {
\t#\tinclude snippets/fastcgi-php.conf;
\t#
\t#\t# With php-fpm (or other unix sockets):
\t#\tfastcgi_pass unix:/run/php/php8.3-fpm.sock;
\t#}
}
`;

  T.nginxIndex = `<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
`;

  T.apacheConf = `# This is the main Apache server configuration file.  It contains the
# configuration directives that give the server its instructions.
# See http://httpd.apache.org/docs/2.4/ for detailed information about
# the directives and /usr/share/doc/apache2/README.Debian about Debian specific
# hints.

DefaultRuntimeDir \${APACHE_RUN_DIR}
PidFile \${APACHE_PID_FILE}
Timeout 300
KeepAlive On
MaxKeepAliveRequests 100
KeepAliveTimeout 5

User \${APACHE_RUN_USER}
Group \${APACHE_RUN_GROUP}

HostnameLookups Off
ErrorLog \${APACHE_LOG_DIR}/error.log
LogLevel warn

IncludeOptional mods-enabled/*.load
IncludeOptional mods-enabled/*.conf

Include ports.conf

<Directory />
\tOptions FollowSymLinks
\tAllowOverride None
\tRequire all denied
</Directory>

<Directory /usr/share>
\tAllowOverride None
\tRequire all granted
</Directory>

<Directory /var/www/>
\tOptions Indexes FollowSymLinks
\tAllowOverride None
\tRequire all granted
</Directory>

AccessFileName .htaccess

<FilesMatch "^\\.ht">
\tRequire all denied
</FilesMatch>

LogFormat "%h %l %u %t \\"%r\\" %>s %O \\"%{Referer}i\\" \\"%{User-Agent}i\\"" combined

IncludeOptional conf-enabled/*.conf
IncludeOptional sites-enabled/*.conf
`;

  T.apachePorts = `# If you just change the port or add more ports here, you will likely also
# have to change the VirtualHost statement in
# /etc/apache2/sites-enabled/000-default.conf

Listen 80

<IfModule ssl_module>
\tListen 443
</IfModule>

<IfModule mod_gnutls.c>
\tListen 443
</IfModule>
`;

  T.apacheDefault = `<VirtualHost *:80>
\t# The ServerName directive sets the request scheme, hostname and port that
\t# the server uses to identify itself.
\t#ServerName www.example.com

\tServerAdmin webmaster@localhost
\tDocumentRoot /var/www/html

\tErrorLog \${APACHE_LOG_DIR}/error.log
\tCustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
`;

  T.apacheIndex = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Apache2 Ubuntu Default Page: It works</title>
  </head>
  <body>
    <div class="main_page">
      <div class="page_header floating_element">
        <span class="floating_element">
          Apache2 Default Page
        </span>
      </div>
      <div class="section_header">
        It works!
      </div>
      <p>
        This is the default welcome page used to test the correct
        operation of the Apache2 server after installation on Ubuntu systems.
        If you can read this page, it means that the Apache HTTP server installed at
        this site is working properly. You should <b>replace this file</b> (located at
        <tt>/var/www/html/index.html</tt>) before continuing to operate your HTTP server.
      </p>
    </div>
  </body>
</html>
`;

  T.sshdConfig = `
# This is the sshd server system-wide configuration file.  See
# sshd_config(5) for more information.

# The strategy used for options in the default sshd_config shipped with
# OpenSSH is to specify options with their default value where
# possible, but leave them commented.  Uncommented options override the
# default value.

Include /etc/ssh/sshd_config.d/*.conf

# When systemd socket activation is used (the default), the socket
# configuration must be re-generated after changing Port, AddressFamily, or
# ListenAddress.
#
# For changes to take effect, run:
#
#   systemctl daemon-reload
#   systemctl restart ssh.socket
#
#Port 22
#AddressFamily any
#ListenAddress 0.0.0.0
#ListenAddress ::

#HostKey /etc/ssh/ssh_host_rsa_key
#HostKey /etc/ssh/ssh_host_ecdsa_key
#HostKey /etc/ssh/ssh_host_ed25519_key

# Logging
#SyslogFacility AUTH
#LogLevel INFO

# Authentication:

#LoginGraceTime 2m
#PermitRootLogin prohibit-password
#StrictModes yes
#MaxAuthTries 6
#MaxSessions 10

#PubkeyAuthentication yes

# Expect .ssh/authorized_keys2 to be disregarded by default in future.
#AuthorizedKeysFile\t.ssh/authorized_keys .ssh/authorized_keys2

# To disable tunneled clear text passwords, change to no here!
#PasswordAuthentication yes
#PermitEmptyPasswords no

# Change to yes to enable challenge-response passwords (beware issues with
# some PAM modules and threads)
KbdInteractiveAuthentication no

UsePAM yes

#AllowAgentForwarding yes
#AllowTcpForwarding yes
#GatewayPorts no
X11Forwarding yes
#PrintMotd yes
PrintMotd no

# Allow client to pass locale environment variables
AcceptEnv LANG LC_*

# override default of no subsystems
Subsystem\tsftp\t/usr/lib/openssh/sftp-server
`;

  T.mysqld = `#
# The MySQL database server configuration file.
#
[mysqld]
#
# * Basic Settings
#
user\t\t= mysql
# pid-file\t= /var/run/mysqld/mysqld.pid
# socket\t= /var/run/mysqld/mysqld.sock
# port\t\t= 3306
# datadir\t= /var/lib/mysql

# Instead of skip-networking the default is now to listen only on
# localhost which is more compatible and is not less secure.
bind-address\t\t= 127.0.0.1
mysqlx-bind-address\t= 127.0.0.1
#
# * Fine Tuning
#
key_buffer_size\t\t= 16M
# max_allowed_packet\t= 64M
# thread_stack\t\t= 256K

myisam-recover-options  = BACKUP
# max_connections        = 151

# * Logging and Replication
#
# Error log - should be very few entries.
#
log_error = /var/log/mysql/error.log
max_binlog_size   = 100M
`;

  T.fail2banLocal = `[DEFAULT]
bantime  = 10m
findtime  = 10m
maxretry = 5

[sshd]
enabled = true
`;

  T.smbConf = `[global]
   workgroup = WORKGROUP
   server string = %h server (Samba, Ubuntu)
   log file = /var/log/samba/log.%m
   max log size = 1000
   logging = file
   server role = standalone server
   obey pam restrictions = yes
   unix password sync = yes
   map to guest = bad user
   usershare allow guests = yes

[printers]
   comment = All Printers
   browseable = no
   path = /var/tmp
   printable = yes
`;

  // ======================================================================= 패키지 목록
  // bins: { 디렉터리: [명령] } · svc: 서비스 이름 · setup(m): 설치 후 파일 만들기
  const PK = {};
  function pkg(name, ver, sizeKB, desc, o = {}) {
    PK[name] = Object.assign({ name, ver, size: sizeKB, desc, deps: [], bins: {}, section: 'universe' }, o);
  }
  const UB = '/usr/bin', US = '/usr/sbin';

  // ---- 기본 설치 (Ubuntu Server 24.04)
  pkg('bash', '5.2.21-2ubuntu4', 1800, 'GNU Bourne Again SHell', { base: true, section: 'main', bins: { [UB]: ['bash', 'sh', 'rbash'] } });
  pkg('coreutils', '9.4-3ubuntu6', 7200, 'GNU core utilities', { base: true, section: 'main', bins: { [UB]: ['ls', 'cat', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'touch', 'pwd', 'echo', 'printf', 'head', 'tail', 'wc', 'sort', 'uniq', 'cut', 'tr', 'tee', 'basename', 'dirname', 'realpath', 'readlink', 'ln', 'chmod', 'chown', 'chgrp', 'date', 'df', 'du', 'env', 'printenv', 'id', 'groups', 'whoami', 'uname', 'seq', 'sleep', 'true', 'false', 'yes', 'stat', 'nl', 'tac', 'paste', 'join', 'comm', 'split', 'md5sum', 'sha1sum', 'sha256sum', 'base64', 'expr', 'test', '[', 'fold', 'shuf', 'mktemp', 'install', 'timeout', 'nproc', 'users', 'who', 'tty', 'dd', 'sync', 'truncate', 'numfmt', 'factor', 'od', 'cksum', 'dircolors', 'arch', 'hostid', 'logname', 'pinky', 'stdbuf', 'nohup', 'nice', 'shred', 'csplit', 'unexpand', 'expand', 'tsort', 'pathchk', 'mkfifo', 'mknod', 'link', 'unlink', 'vdir', 'dir', 'b2sum', 'sum', 'chcon', 'runcon', 'chroot', 'fmt', 'pr', 'ptx', 'tsort', 'stty', 'sha512sum'] } });
  pkg('debianutils', '5.17build1', 250, 'Miscellaneous utilities specific to Debian', { base: true, section: 'main', bins: { [UB]: ['which', 'run-parts', 'savelog', 'tempfile', 'ischroot'] } });
  pkg('init-system-helpers', '1.66ubuntu1', 130, 'helper tools for all init systems', { base: true, section: 'main', bins: { [US]: ['service', 'update-rc.d', 'invoke-rc.d'] } });
  pkg('grub2-common', '2.12-1ubuntu7.3', 3000, 'GRand Unified Bootloader (common files for version 2)', { base: true, section: 'main', bins: { [US]: ['update-grub', 'grub-install', 'grub-mkconfig'] } });
  pkg('dash', '0.5.12-6ubuntu5', 200, 'POSIX-compliant shell', { base: true, section: 'main', bins: { [UB]: ['dash'] } });
  pkg('netcat-openbsd', '1.226-1ubuntu2', 110, 'TCP/IP swiss army knife', { base: true, section: 'main', bins: { [UB]: ['nc', 'nc.openbsd', 'netcat'] } });
  pkg('inetutils-telnet', '2:2.5-3ubuntu4', 280, 'telnet client', { base: true, section: 'main', bins: { [UB]: ['telnet'] } });
  pkg('mtr-tiny', '0.95-1.1ubuntu0.1', 180, 'Full screen ncurses traceroute tool', { base: true, section: 'main', bins: { [UB]: ['mtr'] } });
  pkg('libc-bin', '2.39-0ubuntu8.5', 3200, 'GNU C Library: Binaries', { base: true, section: 'main', bins: { [UB]: ['iconv', 'getent', 'ldd', 'getconf', 'locale'] } });
  pkg('xxd', '2:9.1.0016-1ubuntu7.8', 90, 'tool to make (or reverse) a hex dump', { base: true, section: 'main', bins: { [UB]: ['xxd'] } });
  pkg('util-linux', '2.39.3-9ubuntu6', 4200, 'miscellaneous system utilities', { base: true, section: 'main', bins: { [UB]: ['lsblk', 'findmnt', 'more', 'dmesg', 'lscpu', 'whereis', 'column', 'rev', 'fallocate', 'logger', 'wall', 'flock', 'getopt', 'hexdump', 'script', 'last', 'lslogins', 'renice', 'setsid', 'taskset', 'mesg', 'lsipc', 'lsns', 'lsmem', 'ionice', 'su', 'mount', 'umount'], '/usr/sbin': ['blkid', 'fdisk', 'mkswap', 'swapon', 'swapoff', 'wipefs', 'sfdisk', 'fsck', 'losetup', 'mkfs', 'blockdev', 'hwclock', 'agetty', 'runuser'] } });
  pkg('procps', '2:4.0.4-4ubuntu3', 1400, '/proc file system utilities', { base: true, section: 'main', bins: { [UB]: ['ps', 'top', 'free', 'uptime', 'w', 'pgrep', 'pkill', 'kill', 'vmstat', 'watch', 'pidof', 'pmap', 'slabtop', 'pwdx', 'tload'], '/usr/sbin': ['sysctl'] } });
  pkg('psmisc', '23.7-1build1', 700, 'utilities that use the proc file system', { base: true, section: 'main', bins: { [UB]: ['killall', 'pstree', 'fuser', 'peekfd', 'prtstat'] } });
  pkg('findutils', '4.9.0-5build1', 1800, 'utilities for finding files--find, xargs', { base: true, section: 'main', bins: { [UB]: ['find', 'xargs'] } });
  pkg('grep', '3.11-4build1', 900, 'GNU grep, egrep and fgrep', { base: true, section: 'main', bins: { [UB]: ['grep', 'egrep', 'fgrep'] } });
  pkg('sed', '4.9-2build1', 800, 'GNU stream editor for filtering/transforming text', { base: true, section: 'main', bins: { [UB]: ['sed'] } });
  pkg('mawk', '1.3.4.20240123-1build1', 250, 'Pattern scanning and text processing language', { base: true, section: 'main', bins: { [UB]: ['awk', 'mawk', 'nawk'] } });
  pkg('diffutils', '1:3.10-1build1', 1500, 'File comparison utilities', { base: true, section: 'main', bins: { [UB]: ['diff', 'cmp', 'diff3', 'sdiff'] } });
  pkg('tar', '1.35+dfsg-3build1', 3000, 'GNU version of the tar archiving utility', { base: true, section: 'main', bins: { [UB]: ['tar'] } });
  pkg('gzip', '1.12-1ubuntu3', 250, 'GNU compression utilities', { base: true, section: 'main', bins: { [UB]: ['gzip', 'gunzip', 'zcat', 'zgrep', 'zless'] } });
  pkg('bzip2', '1.0.8-5.1build0.1', 120, 'high-quality block-sorting file compressor', { base: true, section: 'main', bins: { [UB]: ['bzip2', 'bunzip2', 'bzcat'] } });
  pkg('xz-utils', '5.6.1+really5.4.5-1build0.1', 800, 'XZ-format compression utilities', { base: true, section: 'main', bins: { [UB]: ['xz', 'unxz', 'xzcat'] } });
  pkg('iproute2', '6.1.0-1ubuntu6', 3100, 'networking and traffic control tools', { base: true, section: 'main', bins: { [UB]: ['ip', 'ss', 'bridge', 'tc'] } });
  pkg('iputils-ping', '3:20240117-1build1', 110, 'Tools to test the reachability of network hosts', { base: true, section: 'main', bins: { [UB]: ['ping', 'ping4', 'ping6'] } });
  pkg('iputils-tracepath', '3:20240117-1build1', 90, 'Tools to trace the network path to a remote host', { base: true, section: 'main', bins: { [UB]: ['tracepath'] } });
  pkg('hostname', '3.23+nmu2ubuntu2', 60, 'utility to set/show the host name or domain name', { base: true, section: 'main', bins: { [UB]: ['hostname', 'dnsdomainname', 'domainname'] } });
  pkg('curl', '8.5.0-2ubuntu10.6', 500, 'command line tool for transferring data with URL syntax', { base: true, section: 'main', bins: { [UB]: ['curl'] } });
  pkg('wget', '1.21.4-1ubuntu4.1', 1000, 'retrieves files from the web', { base: true, section: 'main', bins: { [UB]: ['wget'] } });
  pkg('nano', '7.2-2ubuntu0.1', 900, 'small, friendly text editor inspired by Pico', { base: true, section: 'main', bins: { [UB]: ['nano', 'rnano'] } });
  pkg('vim', '2:9.1.0016-1ubuntu7.8', 4000, 'Vi IMproved - enhanced vi editor', { base: true, section: 'main', bins: { [UB]: ['vim', 'vi', 'view', 'vimdiff', 'ex', 'rview', 'vimtutor'] } });
  pkg('less', '590-2ubuntu2.1', 350, 'pager program similar to more', { base: true, section: 'main', bins: { [UB]: ['less', 'lesspipe'] } });
  pkg('sudo', '1.9.15p5-3ubuntu5.24.04.1', 4200, 'Provide limited super user privileges to specific users', { base: true, section: 'main', bins: { [UB]: ['sudo', 'sudoedit', 'sudoreplay'], '/usr/sbin': ['visudo'] } });
  pkg('openssh-client', '1:9.6p1-3ubuntu13.13', 3900, 'secure shell (SSH) client, for secure access to remote machines', { base: true, section: 'main', bins: { [UB]: ['ssh', 'scp', 'sftp', 'ssh-keygen', 'ssh-copy-id', 'ssh-keyscan', 'ssh-agent', 'ssh-add'] } });
  pkg('ufw', '0.36.2-6', 850, 'program for managing a Netfilter firewall', { base: true, section: 'main', bins: { [US]: ['ufw'] }, svc: 'ufw' });
  pkg('systemd', '255.4-1ubuntu8.10', 9800, 'system and service manager', { base: true, section: 'main', bins: { [UB]: ['systemctl', 'journalctl', 'hostnamectl', 'timedatectl', 'localectl', 'loginctl', 'systemd-analyze', 'resolvectl', 'networkctl', 'busctl', 'systemd-run'], '/usr/sbin': ['reboot', 'poweroff', 'shutdown', 'halt'] } });
  pkg('cron', '3.0pl1-184ubuntu2', 250, 'process scheduling daemon', { base: true, section: 'main', bins: { [UB]: ['crontab'], [US]: ['cron'] }, svc: 'cron' });
  pkg('rsyslog', '8.2312.0-3ubuntu9.1', 1600, 'reliable system and kernel logging daemon', { base: true, section: 'main', bins: { [US]: ['rsyslogd'] }, svc: 'rsyslog' });
  pkg('logrotate', '3.21.0-2build1', 170, 'Log rotation utility', { base: true, section: 'main', bins: { [US]: ['logrotate'] } });
  pkg('rsync', '3.2.7-1ubuntu1.2', 750, 'fast, versatile, remote (and local) file-copying tool', { base: true, section: 'main', bins: { [UB]: ['rsync'] } });
  pkg('apt', '2.8.3', 4200, 'commandline package manager', { base: true, section: 'main', bins: { [UB]: ['apt', 'apt-get', 'apt-cache', 'apt-mark', 'apt-key', 'apt-config'] } });
  pkg('dpkg', '1.22.6ubuntu6.1', 6300, 'Debian package management system', { base: true, section: 'main', bins: { [UB]: ['dpkg', 'dpkg-query', 'dpkg-deb', 'dpkg-reconfigure'] } });
  pkg('snapd', '2.68.5+ubuntu24.04', 110000, 'Daemon and tooling that enable snap packages', { base: true, section: 'main', bins: { [UB]: ['snap'] }, svc: 'snapd' });
  pkg('netplan.io', '1.1.2-2~ubuntu24.04.1', 420, 'Declarative network configuration for various backends', { base: true, section: 'main', bins: { [UB]: ['netplan'] } });
  pkg('lsb-release', '12.0-2', 50, 'Linux Standard Base version reporting utility', { base: true, section: 'main', bins: { [UB]: ['lsb_release'] } });
  pkg('man-db', '2.12.0-4build2', 2900, 'tools for reading manual pages', { base: true, section: 'main', bins: { [UB]: ['man', 'whatis', 'apropos', 'mandb', 'info'] } });
  pkg('file', '1:5.45-3build1', 80, 'Recognize the type of data in a file using "magic" numbers', { base: true, section: 'main', bins: { [UB]: ['file'] } });
  pkg('htop', '3.3.0-4build1', 430, 'interactive processes viewer', { base: true, section: 'main', bins: { [UB]: ['htop'] } });
  pkg('git', '1:2.43.0-1ubuntu7.3', 23000, 'fast, scalable, distributed revision control system', { base: true, section: 'main', bins: { [UB]: ['git'] } });
  pkg('python3', '3.12.3-0ubuntu2', 90, 'interactive high-level object-oriented language (default python3 version)', { base: true, section: 'main', bins: { [UB]: ['python3', 'python3.12', 'pydoc3'] } });
  pkg('bind9-dnsutils', '1:9.18.30-0ubuntu0.24.04.2', 700, 'Clients provided with BIND 9', { base: true, section: 'main', bins: { [UB]: ['dig', 'nslookup', 'host', 'nsupdate'] } });
  pkg('lvm2', '2.03.16-3ubuntu3.2', 2500, 'Linux Logical Volume Manager', { base: true, section: 'main', bins: { [US]: ['lvm', 'pvcreate', 'pvs', 'pvdisplay', 'pvremove', 'vgcreate', 'vgs', 'vgdisplay', 'vgextend', 'vgremove', 'lvcreate', 'lvs', 'lvdisplay', 'lvextend', 'lvreduce', 'lvremove', 'lvresize', 'pvscan', 'vgscan', 'lvscan'] } });
  pkg('parted', '3.6-4build1', 150, 'disk partition manipulator', { base: true, section: 'main', bins: { [US]: ['parted', 'partprobe'] } });
  pkg('e2fsprogs', '1.47.0-2.4~exp1ubuntu4.1', 1600, 'ext2/ext3/ext4 file system utilities', { base: true, section: 'main', bins: { [US]: ['mkfs.ext4', 'mkfs.ext3', 'mkfs.ext2', 'mke2fs', 'e2fsck', 'fsck.ext4', 'resize2fs', 'tune2fs', 'dumpe2fs', 'e2label'] } });
  pkg('xfsprogs', '6.6.0-1ubuntu2.1', 3500, 'Utilities for managing the XFS filesystem', { base: true, section: 'main', bins: { [US]: ['mkfs.xfs', 'xfs_repair', 'xfs_info', 'xfs_growfs'] } });
  pkg('tmux', '3.4-1ubuntu0.1', 1100, 'terminal multiplexer', { base: true, section: 'main', bins: { [UB]: ['tmux'] } });
  pkg('screen', '4.9.1-1build1', 1000, 'terminal multiplexer with VT100/ANSI terminal emulation', { base: true, section: 'main', bins: { [UB]: ['screen'] } });
  pkg('passwd', '1:4.13+dfsg1-4ubuntu3.2', 2800, 'change and administer password and group data', { base: true, section: 'main', bins: { [UB]: ['passwd', 'chage', 'gpasswd', 'newgrp', 'chsh', 'chfn', 'expiry'], [US]: ['useradd', 'userdel', 'usermod', 'groupadd', 'groupdel', 'groupmod', 'chpasswd', 'chgpasswd', 'pwck', 'grpck', 'vipw', 'vigr'] } });
  pkg('adduser', '3.137ubuntu1', 150, 'add and remove users and groups', { base: true, section: 'main', bins: { [US]: ['adduser', 'deluser', 'addgroup', 'delgroup'] } });
  pkg('ncurses-bin', '6.4+20240113-1ubuntu2', 650, 'terminal-related programs and man pages', { base: true, section: 'main', bins: { [UB]: ['clear', 'tput', 'reset', 'tset', 'infocmp'] } });
  pkg('kmod', '31+20240202-2ubuntu7.1', 250, 'tools for managing Linux kernel modules', { base: true, section: 'main', bins: { [UB]: ['lsmod', 'kmod'], [US]: ['modprobe', 'modinfo', 'insmod', 'rmmod'] } });
  pkg('pciutils', '1:3.10.0-2build1', 200, 'PCI utilities', { base: true, section: 'main', bins: { [UB]: ['lspci'] } });
  pkg('usbutils', '1:017-3build1', 300, 'Linux USB utilities', { base: true, section: 'main', bins: { [UB]: ['lsusb'] } });
  pkg('lsof', '4.95.0-1build3', 450, 'utility to list open files', { base: true, section: 'main', bins: { [UB]: ['lsof'] } });
  pkg('iptables', '1.8.10-3ubuntu2', 2800, 'administration tools for packet filtering and NAT', { base: true, section: 'main', bins: { [US]: ['iptables', 'ip6tables', 'iptables-save', 'iptables-restore', 'nft'] } });
  pkg('software-properties-common', '0.99.49.3', 150, 'manage the repositories that you install software from (common)', { base: true, section: 'main', bins: { [UB]: ['add-apt-repository'] } });
  pkg('openssl', '3.0.13-0ubuntu3.6', 2200, 'Secure Sockets Layer toolkit - cryptographic utility', { base: true, section: 'main', bins: { [UB]: ['openssl'] } });
  pkg('tzdata', '2025b-0ubuntu0.24.04.1', 1400, 'time zone and daylight-saving time data', { base: true, section: 'main', bins: {} });
  pkg('unattended-upgrades', '2.9.1+nmu4ubuntu1', 400, 'automatic installation of security upgrades', { base: true, section: 'main', bins: { [UB]: ['unattended-upgrade', 'unattended-upgrades'] }, svc: 'unattended-upgrades' });
  pkg('bsdextrautils', '2.39.3-9ubuntu6', 300, 'extra utilities from 4.4BSD-Lite', { base: true, section: 'main', bins: { [UB]: ['col', 'colrm', 'look', 'ul', 'write', 'hd'] } });
  pkg('login', '1:4.13+dfsg1-4ubuntu3.2', 800, 'system login tools', { base: true, section: 'main', bins: { [UB]: ['login', 'lastlog', 'faillog', 'nologin'] } });
  pkg('cloud-init', '25.1.4-0ubuntu0~24.04.1', 3000, 'initialization and customization tool for cloud instances', { base: true, section: 'main', bins: { [UB]: ['cloud-init'] } });
  pkg('wtmpdb', '0.9.1-1ubuntu1', 80, 'utility to display login and logout information', { base: true, section: 'main', bins: {} });

  // ---- 설치 가능한 패키지
  pkg('binutils', '2.42-4ubuntu2.5', 90, 'GNU assembler, linker and binary utilities', { section: 'main', bins: { [UB]: ['strings', 'objdump', 'readelf', 'ld', 'as', 'nm'] } });
  pkg('dosfstools', '4.2-1.1build1', 300, 'utilities for making and checking MS-DOS FAT filesystems', { section: 'main', bins: { [US]: ['mkfs.vfat', 'mkfs.fat', 'fsck.vfat'] } });
  pkg('btrfs-progs', '6.6.3-1.1build2', 4000, 'Checksumming Copy on Write Filesystem utilities', { section: 'main', bins: { [UB]: ['btrfs'], [US]: ['mkfs.btrfs'] } });
  pkg('gawk', '1:5.2.1-2build3', 1600, 'GNU awk, a pattern scanning and processing language', { section: 'main', bins: { [UB]: ['gawk'] } });
  pkg('atop', '2.10.0-2build2', 700, 'Monitor for system resources and process activity', { bins: { [UB]: ['atop'] } });
  pkg('glances', '3.4.0.3-1', 2000, 'CuRses based monitoring tool', { bins: { [UB]: ['glances'] } });
  pkg('nethogs', '0.8.7-2build2', 120, 'Net top tool grouping bandwidth per process', { bins: { [US]: ['nethogs'] } });
  pkg('iftop', '1.0~pre4-9build2', 90, 'displays bandwidth usage information on an network interface', { bins: { [US]: ['iftop'] } });
  pkg('emacs-nox', '1:29.3+1-1ubuntu2', 12000, 'GNU Emacs editor (without GUI support)', { bins: { [UB]: ['emacs'] } });
  pkg('fish', '3.7.0-1', 9000, 'friendly interactive shell', { bins: { [UB]: ['fish'] } });
  pkg('links', '2.29-2build2', 1500, 'Web browser running in text mode', { bins: { [UB]: ['links'] } });
  pkg('tree', '2.1.1-2ubuntu3', 120, 'displays an indented directory tree, in color', { bins: { [UB]: ['tree'] } });
  pkg('net-tools', '2.10-0.1ubuntu4.4', 800, 'NET-3 networking toolkit', { section: 'main', bins: { [UB]: ['netstat'], [US]: ['ifconfig', 'route', 'arp'] } });
  pkg('traceroute', '1:2.1.5-1', 160, 'Traces the route taken by packets over an IPv4/IPv6 network', { bins: { [UB]: ['traceroute', 'traceroute6'] } });
  pkg('whois', '5.5.22', 400, 'intelligent WHOIS client', { bins: { [UB]: ['whois', 'mkpasswd'] } });
  pkg('nmap', '7.94+git20230807.3be01efb1+dfsg-3build2', 4500, 'The Network Mapper', { bins: { [UB]: ['nmap'] } });
  pkg('jq', '1.7.1-3build1', 100, 'lightweight and flexible command-line JSON processor', { section: 'main', bins: { [UB]: ['jq'] } });
  pkg('zip', '3.0-13ubuntu0.2', 600, 'Archiver for .zip files', { section: 'main', bins: { [UB]: ['zip', 'zipcloak', 'zipnote', 'zipsplit'] } });
  pkg('unzip', '6.0-28ubuntu4.1', 380, 'De-archiver for .zip files', { section: 'main', bins: { [UB]: ['unzip', 'funzip', 'unzipsfx', 'zipinfo'] } });
  pkg('bc', '1.07.1-3ubuntu4', 230, 'GNU bc arbitrary precision calculator language', { section: 'main', bins: { [UB]: ['bc'] } });
  pkg('ncal', '12.1.8', 120, 'display a calendar and the date of Easter', { bins: { [UB]: ['ncal', 'cal'] } });
  pkg('time', '1.9-0.2build1', 100, 'GNU time program for measuring CPU resource usage', { section: 'main', bins: { [UB]: ['time'] } });
  pkg('ncdu', '1.19-0.1', 120, 'ncurses disk usage viewer', { bins: { [UB]: ['ncdu'] } });
  pkg('btop', '1.3.0-1', 1100, 'Modern and colorful command line resource monitor that shows usage and stats', { bins: { [UB]: ['btop'] } });
  pkg('sysstat', '12.6.1-2', 1800, 'system performance tools for Linux', { section: 'main', bins: { [UB]: ['iostat', 'mpstat', 'pidstat', 'sar'] } });
  pkg('iotop', '0.6-42-ga14256a-0.2', 120, 'simple top-like I/O monitor', { bins: { [US]: ['iotop'] } });
  pkg('neofetch', '7.1.0-4', 350, 'Shows Linux System Information with Distribution Logo', { bins: { [UB]: ['neofetch'] } });
  pkg('cowsay', '3.03+dfsg2-8', 90, 'configurable talking cow', { bins: { '/usr/games': ['cowsay', 'cowthink'] } });
  pkg('figlet', '2.2.5-3', 700, 'Make large character ASCII banners out of ordinary text', { bins: { [UB]: ['figlet'] } });
  pkg('fortune-mod', '1:1.99.1-7.3build1', 200, 'provides fortune cookies on demand', { bins: { '/usr/games': ['fortune'] } });
  pkg('sl', '5.02-1build1', 60, 'Correct you if you type `sl\' by mistake', { bins: { '/usr/games': ['sl'] } });
  pkg('dos2unix', '7.5.1-1', 300, 'convert text file line endings between CRLF and LF', { bins: { [UB]: ['dos2unix', 'unix2dos'] } });
  pkg('p7zip-full', '16.02+transitional.1', 20, '7z and 7za file archivers with high compression ratio', { bins: { [UB]: ['7z', '7za'] } });
  pkg('lm-sensors', '1:3.6.0-9build1', 300, 'utilities to read temperature/voltage/fan sensors', { bins: { [UB]: ['sensors'] } });
  pkg('smartmontools', '7.4-2build1', 1700, 'control and monitor storage systems using S.M.A.R.T.', { section: 'main', bins: { [US]: ['smartctl'] } });
  pkg('stress', '1.0.7-1', 60, 'tool to impose load on and stress test a computer system', { bins: { [UB]: ['stress'] } });
  pkg('iperf3', '3.16-1build2', 110, 'Internet Protocol bandwidth measuring tool', { bins: { [UB]: ['iperf3'] } });
  pkg('lynx', '2.9.0dev.12-1build1', 2000, 'classic non-graphical (text-mode) web browser', { bins: { [UB]: ['lynx'] } });
  pkg('w3m', '0.5.3+git20230121-2ubuntu5', 2400, 'WWW browsable pager with excellent tables/frames support', { bins: { [UB]: ['w3m'] } });
  pkg('zsh', '5.9-6ubuntu2', 2500, 'shell with lots of features', { bins: { [UB]: ['zsh'] } });
  pkg('build-essential', '12.10ubuntu1', 20, 'Informational list of build-essential packages', { section: 'main', deps: ['gcc', 'make'], bins: {} });
  pkg('gcc', '4:13.2.0-7ubuntu1', 50, 'GNU C compiler', { section: 'main', bins: { [UB]: ['gcc', 'cc', 'cpp', 'g++'] } });
  pkg('make', '4.3-4.1build2', 400, 'utility for directing compilation', { section: 'main', bins: { [UB]: ['make'] } });
  pkg('openjdk-17-jdk', '17.0.16+8~us1-0ubuntu1~24.04.1', 5000, 'OpenJDK Development Kit (JDK)', { bins: { [UB]: ['java', 'javac', 'jar'] } });
  pkg('nodejs', '18.19.1+dfsg-6ubuntu5', 780, 'evented I/O for V8 javascript - runtime executable', { bins: { [UB]: ['node', 'nodejs'] } });
  pkg('npm', '9.2.0~ds1-2', 2800, 'package manager for Node.js', { deps: ['nodejs'], bins: { [UB]: ['npm', 'npx'] } });
  pkg('python3-pip', '24.0+dfsg-1ubuntu1.2', 1200, 'Python package installer', { bins: { [UB]: ['pip', 'pip3'] } });
  pkg('python3-venv', '3.12.3-0ubuntu2', 20, 'venv module for python3 (default python3 version)', { section: 'main', bins: {} });

  pkg('nginx', '1.24.0-2ubuntu7.5', 1600, 'small, powerful, scalable web/proxy server', { section: 'main', deps: ['nginx-common'], bins: { [US]: ['nginx'] }, svc: 'nginx' });
  pkg('nginx-common', '1.24.0-2ubuntu7.5', 350, 'small, powerful, scalable web/proxy server - common files', { section: 'main', bins: {} });
  pkg('apache2', '2.4.58-1ubuntu8.8', 3200, 'Apache HTTP Server', { section: 'main', deps: ['apache2-utils'], bins: { [US]: ['apache2', 'apache2ctl', 'apachectl', 'a2ensite', 'a2dissite', 'a2enmod', 'a2dismod', 'a2enconf', 'a2disconf', 'a2query'] }, svc: 'apache2' });
  pkg('apache2-utils', '2.4.58-1ubuntu8.8', 520, 'Apache HTTP Server (utility programs for web servers)', { section: 'main', bins: { [UB]: ['ab', 'htpasswd', 'htdigest', 'logresolve'] } });
  pkg('libapache2-mod-php', '2:8.3+93ubuntu2', 20, 'server-side, HTML-embedded scripting language (Apache 2 module)', { section: 'main', deps: ['php8.3-common'], bins: {} });
  pkg('php', '2:8.3+93ubuntu2', 20, 'server-side, HTML-embedded scripting language (default)', { section: 'main', deps: ['php8.3-cli', 'php8.3-common'], bins: {} });
  pkg('php8.3-cli', '8.3.6-0ubuntu0.24.04.5', 5000, 'command-line interpreter for the PHP scripting language', { section: 'main', bins: { [UB]: ['php', 'php8.3'] } });
  pkg('php8.3-common', '8.3.6-0ubuntu0.24.04.5', 3000, 'documentation, examples and common module for PHP', { section: 'main', bins: {} });
  pkg('php-fpm', '2:8.3+93ubuntu2', 20, 'server-side, HTML-embedded scripting language (FPM-CGI binary) (default)', { section: 'main', deps: ['php8.3-cli'], bins: { [US]: ['php-fpm8.3'] }, svc: 'php8.3-fpm' });
  pkg('php-mysql', '2:8.3+93ubuntu2', 20, 'MySQL module for PHP [default]', { section: 'main', bins: {} });
  pkg('mysql-server', '8.0.43-0ubuntu0.24.04.1', 22000, 'MySQL database server (metapackage depending on the latest version)', { section: 'main', deps: ['mysql-client'], bins: { [US]: ['mysqld'], [UB]: ['mysql_secure_installation', 'mysqladmin', 'mysqldump'] }, svc: 'mysql', conflicts: ['mariadb-server'] });
  pkg('mysql-client', '8.0.43-0ubuntu0.24.04.1', 4000, 'MySQL database client (metapackage depending on the latest version)', { section: 'main', bins: { [UB]: ['mysql'] } });
  pkg('mariadb-server', '1:10.11.13-0ubuntu0.24.04.1', 18000, 'MariaDB database server (metapackage depending on the latest version)', { deps: ['mariadb-client'], bins: { [US]: ['mariadbd'], [UB]: ['mariadb-secure-installation', 'mysql_secure_installation', 'mysqladmin', 'mysqldump', 'mariadb-dump'] }, svc: 'mariadb', conflicts: ['mysql-server'] });
  pkg('mariadb-client', '1:10.11.13-0ubuntu0.24.04.1', 3500, 'MariaDB database client binaries', { bins: { [UB]: ['mariadb', 'mysql'] } });
  pkg('postgresql', '16+257build1.1', 20, 'object-relational SQL database (supported version)', { section: 'main', bins: { [UB]: ['psql', 'pg_lsclusters', 'createdb', 'createuser', 'dropdb', 'dropuser', 'pg_dump'] }, svc: 'postgresql' });
  pkg('redis-server', '5:7.0.15-1ubuntu0.24.04.1', 250, 'Persistent key-value database with network interface', { deps: ['redis-tools'], bins: {}, svc: 'redis-server' });
  pkg('redis-tools', '5:7.0.15-1ubuntu0.24.04.1', 5000, 'Persistent key-value database with network interface (client)', { bins: { [UB]: ['redis-cli', 'redis-server', 'redis-benchmark'] } });
  pkg('openssh-server', '1:9.6p1-3ubuntu13.13', 1900, 'secure shell (SSH) server, for secure access from remote machines', { section: 'main', bins: { [US]: ['sshd'] }, svc: 'ssh' });
  pkg('fail2ban', '1.0.2-3ubuntu0.1', 2100, 'ban hosts that cause multiple authentication errors', { bins: { [UB]: ['fail2ban-client', 'fail2ban-server', 'fail2ban-regex'] }, svc: 'fail2ban' });
  pkg('docker.io', '27.5.1-0ubuntu3~24.04.2', 110000, 'Linux container runtime', { deps: ['containerd', 'runc'], bins: { [UB]: ['docker', 'dockerd'] }, svc: 'docker' });
  pkg('containerd', '1.7.27-0ubuntu1~24.04.1', 140000, 'daemon to control runC', { bins: { [UB]: ['containerd', 'ctr'] }, svc: 'containerd' });
  pkg('runc', '1.2.5-0ubuntu1~24.04.1', 10000, 'Open Container Project - runtime', { bins: { [US]: ['runc'] } });
  pkg('docker-compose-v2', '2.33.0+ds1-0ubuntu1~24.04.1', 60000, 'tool for running multi-container applications on Docker', { deps: ['docker.io'], bins: { '/usr/libexec/docker/cli-plugins': ['docker-compose'] } });
  pkg('docker-compose', '1.29.2-6ubuntu1', 900, 'define and run multi-container Docker applications with YAML', { bins: { [UB]: ['docker-compose'] } });
  pkg('certbot', '2.9.0-1', 50, 'automatically configure HTTPS using Let\'s Encrypt', { bins: { [UB]: ['certbot'] } });
  pkg('python3-certbot-nginx', '2.9.0-1', 150, 'Nginx plugin for Certbot', { deps: ['certbot'], bins: {} });
  pkg('python3-certbot-apache', '2.9.0-1', 400, 'Apache plugin for Certbot', { deps: ['certbot'], bins: {} });
  pkg('samba', '2:4.19.5+dfsg-4ubuntu9.2', 12000, 'SMB/CIFS file, print, and login server for Unix', { section: 'main', bins: { [UB]: ['smbpasswd', 'testparm', 'smbstatus', 'pdbedit'], [US]: ['smbd', 'nmbd'] }, svc: 'smbd' });
  pkg('vsftpd', '3.0.5-0ubuntu3.1', 350, 'lightweight, efficient FTP server written for security', { section: 'main', bins: { [US]: ['vsftpd'] }, svc: 'vsftpd' });
  pkg('bind9', '1:9.18.30-0ubuntu0.24.04.2', 1200, 'Internet Domain Name Server', { section: 'main', bins: { [US]: ['named', 'rndc', 'named-checkconf', 'named-checkzone'] }, svc: 'named' });
  pkg('nfs-kernel-server', '1:2.6.4-3ubuntu5.1', 450, 'support for NFS kernel server', { section: 'main', bins: { [US]: ['exportfs'] }, svc: 'nfs-server' });
  pkg('nfs-common', '1:2.6.4-3ubuntu5.1', 1000, 'NFS support files common to client and server', { section: 'main', bins: { [US]: ['showmount', 'mount.nfs'] } });
  pkg('cockpit', '314-1', 1500, 'Web Console for Linux servers', { bins: {}, svc: 'cockpit' });
  pkg('auditd', '1:3.1.2-2.1build1.1', 800, 'User space tools for security auditing', { section: 'main', bins: { [US]: ['auditctl', 'ausearch', 'aureport'] }, svc: 'auditd' });
  pkg('clamav', '1.4.3+dfsg-0ubuntu0.24.04.1', 1500, 'anti-virus utility for Unix - command-line interface', { bins: { [UB]: ['clamscan', 'freshclam'] } });
  pkg('lnav', '0.11.2-1', 5000, 'ncurses-based log file viewer', { bins: { [UB]: ['lnav'] } });
  pkg('acl', '2.3.2-1build1.1', 200, 'access control list - utilities', { section: 'main', bins: { [UB]: ['getfacl', 'setfacl', 'chacl'] } });
  pkg('quota', '4.09-1build1', 1400, 'disk quota management tools', { section: 'main', bins: { [US]: ['quotacheck', 'quotaon', 'edquota', 'repquota'], [UB]: ['quota'] } });
  pkg('at', '3.2.5-2.1ubuntu3', 150, 'Delayed job execution and batch processing', { section: 'main', bins: { [UB]: ['at', 'atq', 'atrm', 'batch'] }, svc: 'atd' });
  pkg('mc', '3:4.8.30-1ubuntu0.1', 1500, 'Midnight Commander - a powerful file manager', { bins: { [UB]: ['mc'] } });
  pkg('wireguard-tools', '1.0.20210914-1ubuntu4', 300, 'fast, modern, secure kernel VPN tunnel (userland utilities)', { bins: { [UB]: ['wg', 'wg-quick'] } });
  pkg('prometheus-node-exporter', '1.7.0-1ubuntu0.3', 9000, 'Prometheus exporter for machine metrics', { bins: { [UB]: ['prometheus-node-exporter'] }, svc: 'prometheus-node-exporter' });

  LX.PKGS = PK;

  /** 명령 이름 → 설치 제안 패키지 */
  const SUGGEST = {};
  Object.values(PK).forEach((p) => Object.values(p.bins).forEach((list) => list.forEach((b) => { if (!SUGGEST[b] || p.name.length < SUGGEST[b].length) SUGGEST[b] = p.name; })));
  SUGGEST.docker = 'docker.io';
  SUGGEST.mysql = 'mysql-client-core-8.0';
  SUGGEST.php = 'php8.3-cli';
  SUGGEST.ifconfig = 'net-tools';
  SUGGEST.netstat = 'net-tools';
  SUGGEST.python = 'python3';
  SUGGEST.pip = 'python3-pip';
  SUGGEST.node = 'nodejs';
  SUGGEST.cowsay = 'cowsay';
  LX.suggestPkg = function (name) {
    if (name === 'python') return null;
    return SUGGEST[name] || null;
  };

  // ======================================================================= 서비스
  LX.SERVICES = {
    'ssh': { desc: 'OpenBSD Secure Shell server', exec: 'sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups', unit: '/usr/lib/systemd/system/ssh.service', doc: 'man:sshd(8) man:sshd_config(5)', mem: 0.2, alias: ['sshd'] },
    'nginx': { desc: 'A high performance web server and a reverse proxy server', unit: '/usr/lib/systemd/system/nginx.service', doc: 'man:nginx(8)', procs: [['nginx: master process /usr/sbin/nginx -g daemon on; master_process on;', 'root'], ['nginx: worker process', 'www-data', 2]], mem: 0.3 },
    'apache2': { desc: 'The Apache HTTP Server', unit: '/usr/lib/systemd/system/apache2.service', doc: 'https://httpd.apache.org/docs/2.4/', procs: [['/usr/sbin/apache2 -k start', 'root'], ['/usr/sbin/apache2 -k start', 'www-data', 2]], mem: 0.5 },
    'mysql': { desc: 'MySQL Community Server', unit: '/usr/lib/systemd/system/mysql.service', doc: 'man:mysqld(8)', procs: [['/usr/sbin/mysqld', 'mysql']], mem: 9.8 },
    'mariadb': { desc: 'MariaDB 10.11.13 database server', unit: '/usr/lib/systemd/system/mariadb.service', doc: 'man:mariadbd(8)', procs: [['/usr/sbin/mariadbd', 'mysql']], mem: 4.2, alias: ['mysql', 'mysqld'] },
    'postgresql': { desc: 'PostgreSQL RDBMS', unit: '/usr/lib/systemd/system/postgresql.service', procs: [['/usr/lib/postgresql/16/bin/postgres -D /var/lib/postgresql/16/main -c config_file=/etc/postgresql/16/main/postgresql.conf', 'postgres'], ['postgres: 16/main: checkpointer', 'postgres'], ['postgres: 16/main: walwriter', 'postgres']], mem: 1.4 },
    'php8.3-fpm': { desc: 'The PHP 8.3 FastCGI Process Manager', unit: '/usr/lib/systemd/system/php8.3-fpm.service', doc: 'man:php-fpm8.3(8)', procs: [['php-fpm: master process (/etc/php/8.3/fpm/php-fpm.conf)', 'root'], ['php-fpm: pool www', 'www-data', 2]], mem: 1.0 },
    'redis-server': { desc: 'Advanced key-value store', unit: '/usr/lib/systemd/system/redis-server.service', doc: 'http://redis.io/documentation, man:redis-server(1)', procs: [['/usr/bin/redis-server 127.0.0.1:6379', 'redis']], mem: 0.6 },
    'docker': { desc: 'Docker Application Container Engine', unit: '/usr/lib/systemd/system/docker.service', doc: 'https://docs.docker.com', procs: [['/usr/sbin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock', 'root']], mem: 3.1 },
    'containerd': { desc: 'containerd container runtime', unit: '/usr/lib/systemd/system/containerd.service', doc: 'https://containerd.io', procs: [['/usr/bin/containerd', 'root']], mem: 2.0 },
    'fail2ban': { desc: 'Fail2Ban Service', unit: '/usr/lib/systemd/system/fail2ban.service', doc: 'man:fail2ban(1)', procs: [['/usr/bin/python3 /usr/bin/fail2ban-server -xf start', 'root']], mem: 1.2 },
    'smbd': { desc: 'Samba SMB Daemon', unit: '/usr/lib/systemd/system/smbd.service', doc: 'man:smbd(8) man:samba(7) man:smb.conf(5)', procs: [['/usr/sbin/smbd --foreground --no-process-group', 'root']], mem: 1.0 },
    'vsftpd': { desc: 'vsftpd FTP server', unit: '/usr/lib/systemd/system/vsftpd.service', procs: [['/usr/sbin/vsftpd /etc/vsftpd.conf', 'root']], mem: 0.1 },
    'named': { desc: 'BIND Domain Name Server', unit: '/usr/lib/systemd/system/named.service', doc: 'man:named(8)', procs: [['/usr/sbin/named -f -u bind', 'bind']], mem: 1.5, alias: ['bind9'] },
    'nfs-server': { desc: 'NFS server and services', unit: '/usr/lib/systemd/system/nfs-server.service', procs: [['[nfsd]', 'root']], mem: 0.1 },
    'cockpit': { desc: 'Cockpit Web Service', unit: '/usr/lib/systemd/system/cockpit.service', doc: 'man:cockpit-ws(8)', procs: [['/usr/lib/cockpit/cockpit-ws --for-tls-proxy --port=0', 'cockpit-ws']], mem: 0.4 },
    'auditd': { desc: 'Security Auditing Service', unit: '/usr/lib/systemd/system/auditd.service', procs: [['/sbin/auditd', 'root']], mem: 0.1 },
    'atd': { desc: 'Deferred execution scheduler', unit: '/usr/lib/systemd/system/atd.service', procs: [['/usr/sbin/atd -f', 'daemon']], mem: 0.1 },
    'prometheus-node-exporter': { desc: 'Prometheus exporter for machine metrics', unit: '/usr/lib/systemd/system/prometheus-node-exporter.service', procs: [['/usr/bin/prometheus-node-exporter', 'prometheus']], mem: 0.5 },
    'cron': { desc: 'Regular background program processing daemon', unit: '/usr/lib/systemd/system/cron.service', doc: 'man:cron(8)', sys: 701, procs: [] },
    'rsyslog': { desc: 'System Logging Service', unit: '/usr/lib/systemd/system/rsyslog.service', doc: 'man:rsyslogd(8) man:rsyslog.conf(5) https://www.rsyslog.com/doc/', sys: 705, procs: [] },
    'ufw': { desc: 'Uncomplicated firewall', unit: '/usr/lib/systemd/system/ufw.service', doc: 'man:ufw(8)', oneshot: true, procs: [] },
    'snapd': { desc: 'Snap Daemon', unit: '/usr/lib/systemd/system/snapd.service', sys: 783, procs: [['/usr/lib/snapd/snapd', 'root']], mem: 1.3 },
    'unattended-upgrades': { desc: 'Unattended Upgrades Shutdown', unit: '/usr/lib/systemd/system/unattended-upgrades.service', doc: 'man:unattended-upgrade(8)', sys: 812, procs: [['/usr/bin/python3 /usr/share/unattended-upgrades/unattended-upgrade-shutdown --wait-for-signal', 'root']], mem: 0.6 },
    'systemd-journald': { desc: 'Journal Service', unit: '/usr/lib/systemd/system/systemd-journald.service', doc: 'man:systemd-journald.service(8) man:journald.conf(5)', sys: 312, procs: [] },
    'systemd-networkd': { desc: 'Network Configuration', unit: '/usr/lib/systemd/system/systemd-networkd.service', doc: 'man:systemd-networkd.service(8)', sys: 521, procs: [] },
    'systemd-resolved': { desc: 'Network Name Resolution', unit: '/usr/lib/systemd/system/systemd-resolved.service', doc: 'man:systemd-resolved.service(8)', sys: 528, procs: [] },
    'systemd-timesyncd': { desc: 'Network Time Synchronization', unit: '/usr/lib/systemd/system/systemd-timesyncd.service', doc: 'man:systemd-timesyncd.service(8)', sys: 530, procs: [] },
    'systemd-logind': { desc: 'User Login Management', unit: '/usr/lib/systemd/system/systemd-logind.service', doc: 'man:sd-login(3) man:systemd-logind.service(8)', sys: 640, procs: [] },
    'dbus': { desc: 'D-Bus System Message Bus', unit: '/usr/lib/systemd/system/dbus.service', doc: 'man:dbus-daemon(1)', sys: 612, procs: [] }
  };

  /** 서비스 정의 (패키지 서비스 또는 /etc/systemd/system/*.service 사용자 유닛) */
  LX.serviceDef = function (m, name) {
    name = String(name).replace(/\.service$/, '');
    if (LX.SERVICES[name]) return LX.SERVICES[name];
    for (const dir of ['/etc/systemd/system', '/usr/lib/systemd/system', '/lib/systemd/system']) {
      const p = `${dir}/${name}.service`;
      const node = m.vfs.lookup(p);
      if (node && node.t === 'f') {
        const text = node.c || '';
        const get = (k) => { const r = new RegExp('^\\s*' + k + '\\s*=\\s*(.*)$', 'm').exec(text); return r ? r[1].trim() : ''; };
        return {
          desc: get('Description') || name + '.service',
          exec: get('ExecStart') || '',
          user: get('User') || 'root',
          workdir: get('WorkingDirectory'),
          restart: get('Restart'),
          wantedBy: get('WantedBy'),
          unit: p, custom: true, text,
          procs: get('ExecStart') ? [[get('ExecStart').replace(/^[-@+!]+/, ''), get('User') || 'root']] : [],
          mem: 0.3
        };
      }
    }
    return null;
  };

  LX.defaultState = function () {
    return {
      pkgs: {},
      services: {},
      aptUpdated: 0,
      upgradable: ['curl', 'libcurl4t64', 'openssl', 'libssl3t64', 'python3.12', 'libpython3.12-stdlib', 'snapd', 'linux-firmware', 'git', 'git-man', 'vim', 'vim-common', 'vim-runtime', 'xxd', 'sudo', 'tzdata'],
      ufw: { enabled: false, rules: [], defIn: 'deny', defOut: 'allow', logging: 'low' },
      net: {
        ifaces: {
          lo: { mac: '00:00:00:00:00:00', addr: ['127.0.0.1/8'], v6: ['::1/128'], state: 'UNKNOWN', mtu: 65536 },
          enp0s3: { mac: '08:00:27:4e:66:a1', addr: ['10.0.2.15/24'], v6: ['fe80::a00:27ff:fe4e:66a1/64'], state: 'UP', mtu: 1500, dhcp: true, rx: 452871234, tx: 12873410 }
        },
        gw: '10.0.2.2', dns: ['10.0.2.3']
      },
      disks: {
        sda: { size: 25 * 1024, model: 'VBOX HARDDISK', parts: [
          { name: 'sda1', size: 1, type: 'bios_grub' },
          { name: 'sda2', size: 2048, fs: 'ext4', uuid: '4c1f2c9a-6d3b-4c3e-9d58-2b1a7f0c6e11' },
          { name: 'sda3', size: 23 * 1024 - 1 - 2048 + 1024, lvm: 'ubuntu-vg' }
        ] },
        sdb: { size: 10 * 1024, model: 'VBOX HARDDISK', parts: [], label: null },
        sr0: { size: 2690, rom: true, model: 'CD-ROM', fs: 'iso9660', label: 'Ubuntu-Server 24.04.3 LTS amd64' }
      },
      vgs: { 'ubuntu-vg': { pvs: ['/dev/sda3'], size: 22 * 1024 + 1023, lvs: { 'ubuntu-lv': { size: 11 * 1024 + 512, fs: 'ext4', uuid: 'a7d3b1f2-0c55-4d8e-8f1a-93e7c2b4d610' } } } },
      pvs: { '/dev/sda3': { vg: 'ubuntu-vg' } },
      mounts: [
        { dev: '/dev/mapper/ubuntu--vg-ubuntu--lv', dir: '/', fs: 'ext4', opts: 'rw,relatime', size: 11 * 1024 + 512, used: 5.3 * 1024 },
        { dev: '/dev/sda2', dir: '/boot', fs: 'ext4', opts: 'rw,relatime', size: 1966, used: 188 }
      ],
      swaps: [{ file: '/swap.img', size: 4 * 1024, type: 'file' }],
      fsinfo: {},
      containers: [],
      images: [],
      volumes: [],
      dnet: ['bridge', 'host', 'none'],
      db: { mysql: null, pg: null },
      redis: {},
      timezone: 'Etc/UTC',
      journal: [],
      hostKeys: false,
      snaps: { core22: '20250315', snapd: '2.68.5', 'lxd': '5.21.3-c5ae129' },
      f2b: { banned: [] },
      reboots: 0,
      sudoTs: {}
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);

