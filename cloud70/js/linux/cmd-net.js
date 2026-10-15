
/* 가상 리눅스 — 네트워크 명령 (ip ss ping curl wget dig netplan ufw ssh scp rsync nc ...) */
(function (G) {
  const LX = G.LX = G.LX || {};
  const def = LX.def;
  const P = () => LX.path;
  const getopt = (...a) => LX.getopt(...a);
  const pad2 = (n) => String(n).padStart(2, '0');

  const OUTSIDE_IP = '10.0.2.2';
  const VM_IP = () => '10.0.2.15';

  // ======================================================================= 공용: 연결 가능 여부
  function selfIps(m) { return Object.values(m.state.net.ifaces).flatMap((i) => (i.state === 'UP' || i === m.state.net.ifaces.lo ? i.addr : []).map((a) => a.split('/')[0])); }
  LX.selfIps = selfIps;

  /** 인터넷 연결 상태: null 이면 정상, 아니면 오류 문자열 */
  function internetDown(m) {
    const e = m.state.net.ifaces.enp0s3;
    if (!e || e.state !== 'UP') return 'Network is unreachable';
    if (m.state.c70role === 'school') return m.state.net.gw === '172.16.10.1' && e.addr.some((a) => a.startsWith('172.16.10.')) ? null : 'Network is unreachable';
    if (!e.addr.some((a) => a.startsWith('10.0.2.'))) return 'Network is unreachable';
    if (m.state.net.gw !== '10.0.2.2') return 'Network is unreachable';
    return null;
  }
  LX.internetDown = internetDown;
  function dnsDown(m) { return !m.state.net.dns || !m.state.net.dns.length || internetDown(m); }

  /** 방화벽(ufw) 판정: 들어오는 연결 허용 여부 */
  function ufwAllows(m, port, proto, src) {
    const u = m.state.ufw;
    if (!u.enabled) return true;
    for (const r of u.rules) {
      if (r.v6) continue;
      if (r.dir === 'out') continue;
      if (!portMatch(r, port, proto)) continue;
      if (r.from && r.from !== 'any' && !ipInCidr(src, r.from)) continue;
      if (r.action === 'allow' || r.action === 'limit') {
        if (r.action === 'limit') { m.state.ufwLimit = (m.state.ufwLimit || 0) + 1; if (m.state.ufwLimit > 6) return false; }
        return true;
      }
      return false;
    }
    return u.defIn === 'allow';
  }
  LX.ufwAllows = ufwAllows;
  function portMatch(r, port, proto) {
    if (r.proto && r.proto !== 'any' && r.proto !== proto) return false;
    if (r.port == null) return true;
    return String(r.port).split(',').some((p) => { if (p.includes(':')) { const [a, b] = p.split(':').map(Number); return port >= a && port <= b; } return +p === port; });
  }
  function ipInCidr(ip, cidr) {
    if (!cidr.includes('/')) return ip === cidr;
    const [base, bits] = cidr.split('/');
    const toN = (x) => x.split('.').reduce((a, o) => (a << 8) + (+o), 0) >>> 0;
    const mask = +bits === 0 ? 0 : (~0 << (32 - +bits)) >>> 0;
    return (toN(ip) & mask) === (toN(base) & mask);
  }
  LX.ipInCidr = ipInCidr;

  /**
   * TCP 연결 시도 (외부 PC 여부 · 방화벽 · 수신 주소 반영)
   * @returns {{ok, err, listener}}
   */
  function tcpConnect(c, host, port) {
    const m = c.m;
    const r = LX.resolveHost(m, host);
    if (!r) return { err: 'resolve' };
    const outside = !!c.sh.fromOutside;
    const vmIp = VM_IP();
    let ip = r.ip;
    if (outside && LX.PUBLIC_IP && ip === LX.PUBLIC_IP) ip = vmIp;
    if (outside) {
      if (r.local && ip.startsWith('127.')) return { err: 'refused', ip, note: 'loopback' };
      if (ip !== vmIp && !selfIps(m).includes(ip)) return { err: r.ext ? null : 'timeout', ip, ext: !r.local, extOk: !!r.ext };
      if (f2bBanned(m, OUTSIDE_IP)) return { err: 'refused', ip };
      if (!ufwAllows(m, port, 'tcp', OUTSIDE_IP)) return { err: 'timeout', ip, fw: true };
      if (LX.extraFw) { const xf = LX.extraFw(m, port, 'tcp', OUTSIDE_IP); if (xf === 'reject') return { err: 'refused', ip, fw: true }; if (xf === false) return { err: 'timeout', ip, fw: true }; }
      const l = LX.ports(m).find((x) => x.proto === 'tcp' && x.port === port && (x.addr === '0.0.0.0' || x.addr === '*' || x.addr === '[::]' || x.addr === ip));
      if (!l) return { err: 'refused', ip };
      return { ok: true, ip, listener: l };
    }
    if (!r.local) {
      const down = internetDown(m);
      if (down) return { err: 'unreach', ip };
      return { ok: true, ip, ext: true };
    }
    const l = LX.ports(m).find((x) => x.proto === 'tcp' && x.port === port && (x.addr === '0.0.0.0' || x.addr === '*' || x.addr === '[::]' || x.addr === ip || (ip === '127.0.0.1' && x.addr.startsWith('127.0.0.1')) || (ip === '127.0.1.1' && ['0.0.0.0', '*'].includes(x.addr))));
    if (!l) return { err: 'refused', ip };
    return { ok: true, ip, listener: l };
  }
  LX.tcpConnect = tcpConnect;

  function f2bBanned(m, ip) { return m.state.services.fail2ban && m.state.services.fail2ban.active && (m.state.f2b.banned || []).includes(ip); }

  // ======================================================================= ip
  function ifaceList(m) {
    const ifs = Object.entries(m.state.net.ifaces).map(([n, i]) => Object.assign({ name: n }, i));
    if (m.state.services.docker && m.state.services.docker.active) ifs.push({ name: 'docker0', mac: '02:42:5c:1d:7e:3a', addr: ['172.17.0.1/16'], v6: [], state: (m.state.containers || []).some((c) => c.running) ? 'UP' : 'DOWN', mtu: 1500, virt: true });
    return ifs;
  }
  function flagsOf(i) {
    if (i.name === 'lo') return 'LOOPBACK,UP,LOWER_UP';
    if (i.state !== 'UP') return i.virt ? 'NO-CARRIER,BROADCAST,MULTICAST,UP' : 'BROADCAST,MULTICAST';
    return 'BROADCAST,MULTICAST,UP,LOWER_UP';
  }
  function brd(cidr) {
    const [ip, bits] = cidr.split('/');
    const n = ip.split('.').reduce((a, o) => (a << 8) + (+o), 0) >>> 0;
    const b = (n | (~(~0 << (32 - +bits)) >>> 0)) >>> 0;
    return [24, 16, 8, 0].map((s) => (b >>> s) & 255).join('.');
  }

  def('ip', async (c) => {
    const m = c.m;
    let args = c.args.slice();
    let brief = false, color = false, stats = false, fam = null;
    while (args.length && args[0].startsWith('-')) {
      const a = args.shift();
      if (a === '-br' || a === '-brief') brief = true;
      else if (a === '-c' || a === '-color' || a === '--color' || a.startsWith('-c=') || a.startsWith('--color')) color = c.tty;
      else if (a === '-s') stats = true;
      else if (a === '-4') fam = 4;
      else if (a === '-6') fam = 6;
      else if (a === '-j' || a === '-json') { c.err('\x1b[2m(가상 터미널: -j 출력은 지원하지 않습니다)\x1b[0m\n'); }
    }
    const obj = args.shift() || 'help';
    const sub = args[0] || 'show';
    const col = (s, code) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);
    const ifs = ifaceList(m);
    const pick = (list) => { const di = args.indexOf('dev'); const nm = di >= 0 ? args[di + 1] : (sub === 'show' && args[1] && !['up', 'down'].includes(args[1]) ? args[1] : null); if (nm) { const r = list.filter((i) => i.name === nm); if (!r.length) { c.err(`Device "${nm}" does not exist.\n`); return null; } return r; } return list; };
    if (/^(a|addr|address)$/.test(obj)) {
      if (sub === 'add' || sub === 'del') {
        if (c.cred.uid !== 0) { c.err('RTNETLINK answers: Operation not permitted\n'); return 2; }
        const cidr = args[1];
        const dev = args[args.indexOf('dev') + 1];
        const i = m.state.net.ifaces[dev];
        if (!i) { c.err(`Cannot find device "${dev}"\n`); return 1; }
        if (sub === 'add') { if (i.addr.includes(cidr)) { c.err('RTNETLINK answers: File exists\n'); return 2; } i.addr.push(cidr); } else { if (!i.addr.includes(cidr)) { c.err('RTNETLINK answers: Cannot assign requested address\n'); return 2; } i.addr = i.addr.filter((x) => x !== cidr); }
        return 0;
      }
      if (sub === 'flush') { if (c.cred.uid !== 0) { c.err('RTNETLINK answers: Operation not permitted\n'); return 2; } const i = m.state.net.ifaces[args[args.indexOf('dev') + 1] || args[1]]; if (i) i.addr = []; return 0; }
      const list = pick(ifs);
      if (!list) return 1;
      if (brief) {
        list.forEach((i) => c.out(`${col(i.name.padEnd(16), '36')} ${col((i.name === 'lo' ? 'UNKNOWN' : i.state).padEnd(14), i.state === 'UP' || i.name === 'lo' ? '32' : '31')} ${fam === 6 ? '' : i.addr.map((a) => col(a, '35')).join(' ')}${fam === 4 ? '' : ' ' + (i.v6 || []).map((a) => col(a, '34')).join(' ')} \n`));
        return 0;
      }
      list.forEach((i) => {
        const idx = ifs.indexOf(i) + 1;
        c.out(`${idx}: ${col(i.name, '36')}: <${flagsOf(i)}> mtu ${i.mtu} qdisc ${i.name === 'lo' ? 'noqueue' : i.virt ? 'noqueue' : 'fq_codel'} state ${col(i.name === 'lo' ? 'UNKNOWN' : i.state, i.state === 'UP' ? '32' : '31')} group default qlen 1000\n`);
        c.out(`    link/${i.name === 'lo' ? 'loopback' : 'ether'} ${col(i.mac, '33')} brd ${i.name === 'lo' ? '00:00:00:00:00:00' : 'ff:ff:ff:ff:ff:ff'}\n`);
        if (fam !== 6) i.addr.forEach((a, k) => {
          const dyn = i.dhcp && k === 0;
          c.out(`    inet ${col(a, '35')}${dyn ? ' metric 100' : ''} ${i.name === 'lo' ? 'scope host lo' : `brd ${brd(a)} scope global ${dyn ? 'dynamic ' : ''}${i.name}`}\n       valid_lft ${dyn ? '86244sec' : 'forever'} preferred_lft ${dyn ? '86244sec' : 'forever'}\n`);
        });
        if (fam !== 4) (i.v6 || []).forEach((a) => c.out(`    inet6 ${col(a, '34')} scope ${i.name === 'lo' ? 'host noprefixroute' : 'link'} \n       valid_lft forever preferred_lft forever\n`));
      });
      return 0;
    }
    if (/^(l|link)$/.test(obj)) {
      if (sub === 'set') {
        if (c.cred.uid !== 0) { c.err('RTNETLINK answers: Operation not permitted\n'); return 2; }
        const dev = args[1] === 'dev' ? args[2] : args[1];
        const i = m.state.net.ifaces[dev];
        if (!i) { c.err(`Cannot find device "${dev}"\n`); return 1; }
        if (args.includes('up')) i.state = 'UP';
        if (args.includes('down')) i.state = 'DOWN';
        return 0;
      }
      const list = pick(ifs);
      if (!list) return 1;
      if (brief) { list.forEach((i) => c.out(`${i.name.padEnd(16)} ${(i.name === 'lo' ? 'UNKNOWN' : i.state).padEnd(14)} ${i.mac} <${flagsOf(i)}> \n`)); return 0; }
      list.forEach((i, k) => {
        c.out(`${k + 1}: ${i.name}: <${flagsOf(i)}> mtu ${i.mtu} qdisc ${i.name === 'lo' ? 'noqueue' : 'fq_codel'} state ${i.name === 'lo' ? 'UNKNOWN' : i.state} mode DEFAULT group default qlen 1000\n    link/${i.name === 'lo' ? 'loopback' : 'ether'} ${i.mac} brd ${i.name === 'lo' ? '00:00:00:00:00:00' : 'ff:ff:ff:ff:ff:ff'}\n`);
        if (stats) c.out(`    RX:  bytes packets errors dropped  missed   mcast           \n    ${String(i.rx || 12840).padStart(10)} ${String(Math.round((i.rx || 12840) / 900)).padStart(7)}      0       0       0       0 \n    TX:  bytes packets errors dropped carrier collsns           \n    ${String(i.tx || 12840).padStart(10)} ${String(Math.round((i.tx || 12840) / 600)).padStart(7)}      0       0       0       0 \n`);
      });
      return 0;
    }
    if (/^(r|route|ro)$/.test(obj)) {
      const e = m.state.net.ifaces.enp0s3;
      const a = e.addr[0];
      if (sub === 'add' || sub === 'del') {
        if (c.cred.uid !== 0) { c.err('RTNETLINK answers: Operation not permitted\n'); return 2; }
        if (args[1] === 'default' && args[2] === 'via') m.state.net.gw = sub === 'add' ? args[3] : null;
        return 0;
      }
      if (sub === 'get') { const dst = args[1]; c.out(`${dst} via ${m.state.net.gw} dev enp0s3 src ${a ? a.split('/')[0] : ''} uid ${c.cred.uid} \n    cache \n`); return 0; }
      if (!a || e.state !== 'UP') return 0;
      const src = a.split('/')[0];
      const net = a.replace(/\.\d+\//, '.0/');
      const rows = [];
      if (m.state.net.gw) rows.push(`default via ${m.state.net.gw} dev enp0s3 proto ${e.dhcp ? 'dhcp' : 'static'} ${e.dhcp ? `src ${src} ` : ''}metric 100 \n`);
      rows.push(`${net} dev enp0s3 proto kernel scope link src ${src} metric 100 \n`);
      if (e.dhcp) rows.push(`10.0.2.2 dev enp0s3 proto dhcp scope link src ${src} metric 100 \n`, `10.0.2.3 dev enp0s3 proto dhcp scope link src ${src} metric 100 \n`);
      if (m.state.services.docker && m.state.services.docker.active) rows.push(`172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1 ${(m.state.containers || []).some((x) => x.running) ? '' : 'linkdown '}\n`);
      // ip route show default / ip route show dev enp0s3 / ip route show 10.0.2.0/24
      const sel = args.slice(sub === 'show' || sub === 'list' ? 1 : 0).filter((x) => x !== 'table' && x !== 'main');
      let list = rows;
      if (sel[0] === 'default') list = rows.filter((r) => r.startsWith('default '));
      else if (sel[0] === 'dev') list = rows.filter((r) => r.includes(` dev ${sel[1]} `));
      else if (sel[0] && /^\d/.test(sel[0])) list = rows.filter((r) => r.startsWith(sel[0] + ' '));
      c.out(list.join(''));
      return 0;
    }
    if (/^(n|neigh|neighbor|neighbour)$/.test(obj)) { c.out(`10.0.2.2 dev enp0s3 lladdr 52:54:00:12:35:02 REACHABLE \n10.0.2.3 dev enp0s3 lladdr 52:54:00:12:35:03 STALE \n`); return 0; }
    if (obj === 'help' || obj === '-h') { c.err('Usage: ip [ OPTIONS ] OBJECT { COMMAND | help }\n       ip [ -force ] -batch filename\nwhere  OBJECT := { address | addrlabel | amt | fou | help | ila | ioam | l2tp |\n                   link | macsec | maddress | monitor | mptcp | mroute | mrule |\n                   neighbor | neighbour | netconf | netns | nexthop | ntable |\n                   ntbl | route | rule | sr | stats | tap | tcpmetrics |\n                   token | tunnel | tuntap | vrf | xfrm }\n       OPTIONS := { -V[ersion] | -s[tatistics] | -d[etails] | -r[esolve] |\n                    -h[uman-readable] | -iec | -j[son] | -p[retty] |\n                    -f[amily] { inet | inet6 | mpls | bridge | link } |\n                    -4 | -6 | -M | -B | -0 |\n                    -l[oops] { maximum-addr-flush-attempts } | -br[ief] |\n                    -o[neline] | -t[imestamp] | -ts[hort] | -b[atch] [filename] |\n                    -rc[vbuf] [size] | -n[etns] name | -N[umeric] | -a[ll] |\n                    -c[olor]}\n'); return 255; }
    c.err(`Object "${obj}" is unknown, try "ip help".\n`);
    return 1;
  });

  def('ifconfig', async (c) => {
    const m = c.m;
    const want = c.args.filter((a) => !a.startsWith('-'))[0];
    const list = ifaceList(m).filter((i) => (!want || i.name === want) && (c.args.includes('-a') || i.state === 'UP' || i.name === 'lo'));
    list.forEach((i) => {
      const a = i.addr[0] || '';
      const [ip, bits] = a.split('/');
      const mask = bits ? [24, 16, 8, 0].map((s) => ((~0 << (32 - +bits)) >>> s) & 255).join('.') : '';
      c.out(`${i.name}: flags=${i.name === 'lo' ? '73<UP,LOOPBACK,RUNNING>' : i.state === 'UP' ? '4163<UP,BROADCAST,RUNNING,MULTICAST>' : '4098<BROADCAST,MULTICAST>'}  mtu ${i.mtu}\n${ip ? `        inet ${ip}  netmask ${mask}${i.name === 'lo' ? '' : `  broadcast ${brd(a)}`}\n` : ''}${(i.v6 || []).map((v) => `        inet6 ${v.split('/')[0]}  prefixlen ${v.split('/')[1]}  scopeid ${i.name === 'lo' ? '0x10<host>' : '0x20<link>'}\n`).join('')}        ${i.name === 'lo' ? 'loop  txqueuelen 1000  (Local Loopback)' : `ether ${i.mac}  txqueuelen 1000  (Ethernet)`}\n        RX packets ${Math.round((i.rx || 9840) / 900)}  bytes ${i.rx || 9840} (${LX.human(i.rx || 9840)}B)\n        RX errors 0  dropped 0  overruns 0  frame 0\n        TX packets ${Math.round((i.tx || 9840) / 600)}  bytes ${i.tx || 9840} (${LX.human(i.tx || 9840)}B)\n        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0\n\n`);
    });
    return 0;
  });
  def('route', async (c) => { const m = c.m; c.out(`Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\n${m.state.net.gw ? `0.0.0.0         ${m.state.net.gw.padEnd(15)} 0.0.0.0         UG    100    0        0 enp0s3\n` : ''}10.0.2.0        0.0.0.0         255.255.255.0   U     100    0        0 enp0s3\n`); return 0; });
  def('arp', async (c) => { c.out('Address                  HWtype  HWaddress           Flags Mask            Iface\n_gateway                 ether   52:54:00:12:35:02   C                     enp0s3\n'); return 0; });

  // ======================================================================= ss · netstat
  const SVC_NAME = { 22: 'ssh', 53: 'domain', 80: 'http', 443: 'https', 3306: 'mysql', 5432: 'postgresql', 6379: 'redis', 8080: 'http-alt', 21: 'ftp', 25: 'smtp', 68: 'bootpc', 445: 'microsoft-ds', 139: 'netbios-ssn' };
  function listenRows(c, opt) {
    const m = c.m;
    return LX.ports(m).filter((p) => (opt.t && p.proto === 'tcp') || (opt.u && p.proto === 'udp') || (!opt.t && !opt.u)).map((p) => {
      const addr = p.addr === '*' ? '*' : p.addr;
      return { proto: p.proto, state: p.proto === 'udp' ? 'UNCONN' : 'LISTEN', local: `${addr}:${opt.n ? p.port : (SVC_NAME[p.port] || p.port)}`, peer: `${addr.startsWith('[') ? '[::]' : '0.0.0.0'}:*`, proc: p.proc, pid: p.pid, fd: 3 + (p.port % 20) };
    });
  }
  def('ss', async (c) => {
    const { f } = getopt(c.args, 'tulpnaexsrH46', { tcp: 't', udp: 'u', listening: 'l', processes: 'p', numeric: 'n', all: 'a', summary: 's' });
    const m = c.m;
    if (f.s) { const n = LX.ports(m).length; c.out(`Total: ${120 + n}\nTCP:   ${n + 2} (estab 1, closed 0, orphaned 0, timewait 0)\n\nTransport Total     IP        IPv6\nRAW\t  1         0         1        \nUDP\t  4         4         0        \nTCP\t  ${n}         ${n}         0        \nINET\t  ${n + 5}         ${n + 4}         1        \nFRAG\t  0         0         0        \n\n`); return 0; }
    let rows = listenRows(c, f);
    if (!f.l || f.a) {
      if (!f.u || f.t) rows = rows.concat(f.l && !f.a ? [] : [{ proto: 'tcp', state: 'ESTAB', local: `10.0.2.15:${f.n ? 22 : 'ssh'}`, peer: `10.0.2.2:${f.n ? 51514 : 51514}`, proc: 'sshd', pid: 1402 }]);
      if (!f.l && !f.a) rows = rows.filter((r) => r.state === 'ESTAB');
    }
    const showP = f.p && c.cred.uid === 0;
    const w = (k, min) => Math.max(min, ...rows.map((r) => r[k].length));
    const wl = w('local', 20), wp = w('peer', 17);
    const netid = f.t && !f.u ? false : true;
    let out = `${netid ? 'Netid ' : ''}State  Recv-Q Send-Q ${'Local Address:Port'.padStart(wl)} ${'Peer Address:Port'.padStart(wp)}Process\n`;
    rows.forEach((r) => {
      out += `${netid ? r.proto.padEnd(5) + ' ' : ''}${r.state.padEnd(6)} 0      ${r.proto === 'tcp' && r.state === 'LISTEN' ? '4096'.padEnd(6) : '0'.padEnd(6)} ${r.local.padStart(wl)} ${r.peer.padStart(wp)}${showP && r.proc ? `    users:(("${r.proc}",pid=${r.pid},fd=${r.fd || 3}))` : ''}\n`;
    });
    c.out(out);
    if (f.p && c.cred.uid !== 0 && !c.session.headless) { /* 비 root: 프로세스 정보 없음 */ }
    return 0;
  });
  def('netstat', async (c) => {
    const { f } = getopt(c.args, 'tulpnaris', { tcp: 't', udp: 'u', listening: 'l', program: 'p', numeric: 'n', all: 'a', route: 'r', interfaces: 'i', statistics: 's' });
    if (f.r) return LX.commands.route(c);
    if (f.i) { c.out('Kernel Interface table\nIface             MTU    RX-OK RX-ERR RX-DRP RX-OVR    TX-OK TX-ERR TX-DRP TX-OVR Flg\nenp0s3           1500   503190      0      0 0         21455      0      0      0 BMRU\nlo              65536      512      0      0 0           512      0      0      0 LRU\n'); return 0; }
    const rows = listenRows(c, f);
    let out = `Active Internet connections (${f.l ? 'only servers' : 'servers and established'})\nProto Recv-Q Send-Q Local Address           Foreign Address         State       ${f.p ? 'PID/Program name    ' : ''}\n`;
    rows.forEach((r) => { out += `${(r.proto + (r.local.startsWith('[') ? '6' : '')).padEnd(5)} ${'0'.padStart(6)} ${'0'.padStart(6)} ${r.local.replace('[::]', ':::').replace(/^\*/, '0.0.0.0').padEnd(23)} ${r.peer.replace('[::]', ':::').padEnd(23)} ${(r.proto === 'tcp' ? 'LISTEN' : '').padEnd(11)} ${f.p ? (c.cred.uid === 0 ? `${r.pid}/${r.proc}` : '-') : ''}\n`; });
    c.out(out);
    return 0;
  });

  // ======================================================================= ping · traceroute
  function pingTarget(c, host) {
    const m = c.m;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      const local = host.startsWith('127.') || selfIps(m).includes(host);
      return { ip: host, name: host, local, reach: local || host === '10.0.2.2' || host === '10.0.2.3' || (!/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) && !internetDown(m)) };
    }
    const r = LX.resolveHost(m, host);
    if (!r) return null;
    if (!r.local && dnsDown(m) && !/^\d/.test(host)) return null;
    return { ip: r.ip, name: host, local: r.local, reach: r.local || !internetDown(m) };
  }

  def(['ping', 'ping4', 'ping6'], async (c) => {
    const { f, ops } = getopt(c.args, 'c:i:W:w:qn46s:t:', { count: 'c:' });
    const host = ops[0];
    if (!host) { c.err('ping: usage error: Destination address required\n'); return 1; }
    const t = pingTarget(c, host);
    if (!t) { c.err(`ping: ${host}: ${dnsDown(c.m) && !/local/.test(host) ? 'Temporary failure in name resolution' : 'Name or service not known'}\n`); return 2; }
    let count = f.c != null ? +f.c : (c.session.headless ? 4 : Infinity);
    const interval = f.i != null ? +f.i * 1000 : 1000;
    const size = f.s != null ? +f.s : 56;
    c.out(`PING ${t.name} (${t.ip}) ${size}(${size + 28}) bytes of data.\n`);
    const times = [];
    let sent = 0, recv = 0;
    const t0 = Date.now();
    const base = t.local ? 0.03 : /^10\.0\.2\.[23]$/.test(t.ip) ? 0.4 : host.includes('google') ? 32 : host.includes('naver') ? 6 : 28;
    const ttl = t.local ? 64 : /^10\.0\.2/.test(t.ip) ? 64 : 117;
    const rname = host.includes('google.com') ? `nrt12s51-in-f14.1e100.net (${t.ip})` : (t.name !== t.ip ? `${t.name} (${t.ip})` : t.ip);
    try {
      for (let i = 1; i <= count; i++) {
        sent++;
        if (t.reach) {
          const ms = base + Math.random() * (t.local ? 0.05 : base * 0.08);
          times.push(ms);
          recv++;
          if (!f.q) c.out(`${size + 8} bytes from ${t.local && t.name !== t.ip ? `${t.name === 'localhost' ? 'localhost' : t.name} (${t.ip})` : rname}: icmp_seq=${i} ttl=${ttl} time=${ms < 1 ? ms.toFixed(3) : ms.toFixed(1)} ms\n`);
        } else if (/^(10\.|192\.168\.)/.test(t.ip) && !f.q) {
          if (i % 3 === 0) c.out(`From ${VM_IP()} icmp_seq=${i - 2} Destination Host Unreachable\nFrom ${VM_IP()} icmp_seq=${i - 1} Destination Host Unreachable\nFrom ${VM_IP()} icmp_seq=${i} Destination Host Unreachable\n`);
        }
        if (i < count) await c.sleep(interval);
      }
    } catch (e) {
      if (!(e instanceof LX.sig.AbortSig)) throw e;
      c.out('^C');
    }
    const el = c.session.headless ? (sent - 1) * interval + 3 : Date.now() - t0;
    const loss = sent ? Math.round((sent - recv) / sent * 100) : 0;
    c.out(`\n--- ${t.name} ping statistics ---\n${sent} packets transmitted, ${recv} received, ${!t.reach && /^(10\.|192\.168\.)/.test(t.ip) ? `+${sent} errors, ` : ''}${loss}% packet loss, time ${el}ms\n`);
    if (times.length) {
      const mn = Math.min(...times), mx = Math.max(...times), avg = times.reduce((a, b) => a + b, 0) / times.length;
      const md = Math.sqrt(times.reduce((a, b) => a + (b - avg) ** 2, 0) / times.length);
      c.out(`rtt min/avg/max/mdev = ${mn.toFixed(3)}/${avg.toFixed(3)}/${mx.toFixed(3)}/${md.toFixed(3)} ms\n`);
    }
    c.session.aborted = false;
    return recv ? 0 : 1;
  });

  def(['traceroute', 'traceroute6', 'tracepath', 'mtr'], async (c) => {
    const host = c.args.filter((a, i) => !a.startsWith('-') && !/^-(c|i|s|m|q|w|p|f|N|T|o|y|z|G|Z|M)$/.test(c.args[i - 1] || ''))[0];
    if (!host) { c.err(`Usage: ${c.name} [options] host\n`); return 1; }
    const t = pingTarget(c, host);
    if (!t) { c.err(`${host}: Name or service not known\nCannot handle "host" cmdline arg \`${host}' on position 1 (argc 1)\n`); return 2; }
    const hops = t.local ? [[t.name, t.ip, 0.03]] : [['_gateway', '10.0.2.2', 0.4], ['192.168.0.1', '192.168.0.1', 2.1], ['100.73.0.1', '100.73.0.1', 4.8], ['112.188.10.13', '112.188.10.13', 5.6], ['*'], ['72.14.203.108', '72.14.203.108', 30.1], [t.name, t.ip, 32.4]];
    if (c.name === 'tracepath') {
      c.out(` 1?: [LOCALHOST]                      pmtu 1500\n`);
      for (let i = 0; i < hops.length; i++) { const h = hops[i]; await c.sleep(150); c.out(h[0] === '*' ? ` ${i + 1}:  no reply\n` : ` ${i + 1}:  ${h[0] === h[1] ? h[1] : `${h[0]}`.padEnd(36)} ${h[2].toFixed(3)}ms ${i === hops.length - 1 ? 'reached' : ''}\n`); }
      c.out(`     Resume: pmtu 1500 hops ${hops.length} back ${hops.length}\n`);
      return 0;
    }
    if (c.name === 'mtr') {
      // mtr -r/--report (터미널 UI 대신 보고서 형식)
      const cnt = +(c.args[c.args.indexOf('-c') + 1] || 10) || 10;
      c.out(`Start: ${LX.strftime(c.m, '%Y-%m-%dT%H:%M:%S%z', c.m.now())}\nHOST: ${c.m.hostname().padEnd(27)} Loss%   Snt   Last   Avg  Best  Wrst StDev\n`);
      for (let i = 0; i < hops.length; i++) {
        await c.sleep(c.session.headless ? 0 : 100);
        const h = hops[i];
        const nm = h[0] === '*' ? '???' : (c.args.includes('-n') || h[0] === h[1] ? h[1] : h[0]);
        const v = h[0] === '*' ? null : h[2];
        c.out(`  ${String(i + 1).padStart(2)}.|-- ${nm.padEnd(22)} ${(h[0] === '*' ? '100.0' : '0.0%').padStart(5)}    ${String(cnt).padStart(2)}  ${v == null ? '  0.0   0.0   0.0   0.0   0.0' : `${v.toFixed(1).padStart(5)} ${(v + 0.2).toFixed(1).padStart(5)} ${(v - 0.1).toFixed(1).padStart(5)} ${(v + 1.4).toFixed(1).padStart(5)}   0.${(i * 3) % 10}`}\n`);
      }
      if (!c.args.includes('-r') && !c.args.includes('--report') && !c.args.includes('-w') && !c.session.headless) c.err('\x1b[2m(가상 터미널: mtr 의 실시간 화면 대신 보고서(-r) 형식으로 보여 줍니다)\x1b[0m\n');
      return 0;
    }
    c.out(`traceroute to ${t.name} (${t.ip}), 30 hops max, 60 byte packets\n`);
    for (let i = 0; i < hops.length; i++) {
      await c.sleep(200);
      const h = hops[i];
      if (h[0] === '*') { c.out(`${String(i + 1).padStart(2)}  * * *\n`); continue; }
      const ms = (k) => (h[2] + k * 0.13).toFixed(3);
      c.out(`${String(i + 1).padStart(2)}  ${h[0]} (${h[1]})  ${ms(0)} ms  ${ms(1)} ms  ${ms(2)} ms\n`);
    }
    return 0;
  });

  // ======================================================================= curl · wget
  async function httpReq(c, url, o) {
    if (!/^[a-z]+:\/\//i.test(url)) url = 'http://' + url;
    const u = /^(https?):\/\/(\[[^\]]+\]|[^/:?#]+)(?::(\d+))?/i.exec(url);
    if (!u) return { error: `URL rejected: Malformed input to a URL function`, code: 3 };
    if (!/^https?$/i.test(u[1])) return { error: `Protocol "${u[1]}" not supported`, code: 1 };
    const port = +(u[3] || (u[1].toLowerCase() === 'https' ? 443 : 80));
    const r = LX.resolveHost(c.m, u[2]);
    if (!r || (!r.local && dnsDown(c.m) && !/^\d/.test(u[2]))) return { error: `Could not resolve host: ${u[2]}`, code: 6 };
    const conn = tcpConnect(c, u[2], port);
    if (conn.err === 'resolve') return { error: `Could not resolve host: ${u[2]}`, code: 6 };
    if (conn.err === 'refused') return { error: `Failed to connect to ${u[2]} port ${port} after 0 ms: Couldn't connect to server`, code: 7 };
    if (conn.err === 'timeout') { await c.sleep(c.session.headless ? 0 : 3000); return { error: `Failed to connect to ${u[2]} port ${port} after ${c.session.headless ? 3000 : 3001} ms: Timeout was reached`, code: 28 }; }
    if (conn.err === 'unreach') return { error: `Failed to connect to ${u[2]} port ${port} after 0 ms: Network is unreachable`, code: 7 };
    const res = await LX.http(c.m, url, o);
    return res;
  }
  LX.httpReq = httpReq;

  function wordpressTar(m) {
    const files = {
      'wordpress/index.php': "<?php\n/**\n * Front to the WordPress application.\n */\ndefine( 'WP_USE_THEMES', true );\nrequire __DIR__ . '/wp-blog-header.php';\n",
      'wordpress/wp-config-sample.php': "<?php\n/** The name of the database for WordPress */\ndefine( 'DB_NAME', 'database_name_here' );\n\n/** Database username */\ndefine( 'DB_USER', 'username_here' );\n\n/** Database password */\ndefine( 'DB_PASSWORD', 'password_here' );\n\n/** Database hostname */\ndefine( 'DB_HOST', 'localhost' );\n\n/** Database charset to use in creating database tables. */\ndefine( 'DB_CHARSET', 'utf8' );\n\n$table_prefix = 'wp_';\n",
      'wordpress/readme.html': '<!DOCTYPE html>\n<html lang="en">\n<head><title>WordPress &#8250; ReadMe</title></head>\n<body><h1>WordPress</h1><p>Semantic Personal Publishing Platform</p></body>\n</html>\n',
      'wordpress/license.txt': 'WordPress - Web publishing software\n\nCopyright 2011-2025 by the contributors\n',
      'wordpress/wp-login.php': "<?php\n/* WordPress User Page */\necho 'WordPress Login';\n"
    };
    const list = [{ p: 'wordpress', t: 'd', m: 0o755, u: 0, g: 0, mt: m.now() }, { p: 'wordpress/wp-content', t: 'd', m: 0o755, u: 0, g: 0, mt: m.now() }, { p: 'wordpress/wp-admin', t: 'd', m: 0o755, u: 0, g: 0, mt: m.now() }]
      .concat(Object.entries(files).map(([p, c]) => ({ p, t: 'f', m: 0o644, u: 0, g: 0, mt: m.now(), c })));
    return '\x1f\x8bGZ1\n\x00TAR1\n' + JSON.stringify(list);
  }

  /** 알려진 다운로드 파일 */
  function downloadBody(c, url, res) {
    if (/wordpress\.org\/latest\.tar\.gz/.test(url)) return { body: wordpressTar(c.m), size: 26582144, type: 'application/octet-stream' };
    const deb = /\/([a-z0-9.+-]+)_[\w.~:+-]+\.deb$/.exec(url);
    if (deb) return { body: '!<arch>\ndebian-binary\n2.0\n', size: 824512, type: 'application/vnd.debian.binary-package' };
    if (/\.(tar\.gz|tgz|zip|iso|img)$/.test(url)) return { body: '(가상 파일) ' + url + '\n', size: 1048576 * 12, type: 'application/octet-stream' };
    if (/download\.docker\.com.*gpg$/.test(url)) return { body: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nmQINBFit2ioBEADhWpZ8/wvZ6hUTiXOwQHXMAlaFHcPH9hAtr4F1y2+OYdbtMuth\n-----END PGP PUBLIC KEY BLOCK-----\n', type: 'application/pgp-keys' };
    return null;
  }

  def('curl', async (c) => {
    const args = c.args.slice();
    const o = { method: null, headers: {}, data: null };
    let head = false, include = false, silent = false, showErr = false, out = null, remoteName = false, follow = false, verbose = false, fail = false, wfmt = null, noProgress = false;
    const urls = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-I' || a === '--head') head = true;
      else if (a === '-i' || a === '--include') include = true;
      else if (a === '-s' || a === '--silent') silent = true;
      else if (a === '-S' || a === '--show-error') showErr = true;
      else if (/^-[sSLfIikv]+$/.test(a)) { if (a.includes('k')) o.insecure = true; if (a.includes('s')) silent = true; if (a.includes('S')) showErr = true; if (a.includes('L')) follow = true; if (a.includes('f')) fail = true; if (a.includes('I')) head = true; if (a.includes('i')) include = true; if (a.includes('v')) verbose = true; }
      else if (a === '-o' || a === '--output') out = args[++i];
      else if (a === '-O' || a === '--remote-name') remoteName = true;
      else if (a === '-L' || a === '--location') follow = true;
      else if (a === '-v' || a === '--verbose') verbose = true;
      else if (a === '-f' || a === '--fail') fail = true;
      else if (a === '-X' || a === '--request') o.method = args[++i];
      else if (a === '-H' || a === '--header') { const h = args[++i]; const k = h.indexOf(':'); if (k > 0) o.headers[h.slice(0, k).trim()] = h.slice(k + 1).trim(); }
      else if (a === '-d' || a === '--data' || a === '--data-raw' || a === '--data-binary' || a === '--json') { o.data = args[++i]; if (a === '--json') o.headers['Content-Type'] = 'application/json'; }
      else if (a === '-w' || a === '--write-out') wfmt = args[++i];
      else if (a === '-A' || a === '--user-agent') o.headers['User-Agent'] = args[++i];
      else if (a === '-u' || a === '--user' || a === '-m' || a === '--max-time' || a === '--connect-timeout' || a === '-x' || a === '--proxy' || a === '-e' || a === '-b' || a === '-c' || a === '--resolve' || a === '-T') i++;
      else if (a === '-k' || a === '--insecure') o.insecure = true;
      else if (a === '-#' || a === '--compressed' || a === '--no-progress-meter') { if (a === '--no-progress-meter') noProgress = true; }
      else if (a === '--version' || a === '-V') { c.out('curl 8.5.0 (x86_64-pc-linux-gnu) libcurl/8.5.0 OpenSSL/3.0.13 zlib/1.3 brotli/1.1.0 zstd/1.5.5 libidn2/2.3.7 libpsl/0.21.2 (+libidn2/2.3.7) libssh/0.10.6/openssl/zlib nghttp2/1.59.0 librtmp/2.3 OpenLDAP/2.6.7\nRelease-Date: 2023-12-06, security patched: 8.5.0-2ubuntu10.6\nProtocols: dict file ftp ftps gopher gophers http https imap imaps ldap ldaps mqtt pop3 pop3s rtmp rtsp scp sftp smb smbs smtp smtps telnet tftp\nFeatures: alt-svc AsynchDNS brotli GSS-API HSTS HTTP2 HTTPS-proxy IDN IPv6 Kerberos Largefile libz NTLM PSL SPNEGO SSL threadsafe TLS-SRP UnixSockets zstd\n'); return 0; }
      else if (a.startsWith('-')) continue;
      else urls.push(a);
    }
    if (!urls.length) { c.err("curl: try 'curl --help' or 'curl --manual' for more information\n"); return 2; }
    if (!o.method) o.method = head ? 'HEAD' : o.data != null ? 'POST' : 'GET';
    let st = 0;
    for (let url of urls) {
      let res;
      let hops = 0;
      for (;;) {
        if (verbose) {
          const h = /^(?:https?:\/\/)?(\[[^\]]+\]|[^/:?#]+)(?::(\d+))?/.exec(url);
          const r = LX.resolveHost(c.m, h[1]);
          c.err(`*   Trying ${r ? r.ip : h[1]}:${h[2] || (/^https/.test(url) ? 443 : 80)}...\n`);
        }
        res = await httpReq(c, url, o);
        if (verbose && !res.error) c.err(`* Connected to ${url.replace(/^https?:\/\//, '').split(/[/:]/)[0]} (${res.ip}) port ${res.port}\n> ${o.method} ${(/^https?:\/\/[^/]+(\/.*)?$/.exec(url.startsWith('http') ? url : 'http://' + url) || [])[1] || '/'} HTTP/1.1\n> Host: ${url.replace(/^https?:\/\//, '').split('/')[0]}\n> User-Agent: curl/8.5.0\n> Accept: */*\n> \n< HTTP/1.1 ${res.status} ${LX.HTTP_TEXT[res.status] || ''}\n${Object.entries(res.headers || {}).map(([k, v]) => `< ${k}: ${v}`).join('\n')}\n< \n`);
        if (follow && res.status >= 300 && res.status < 400 && res.headers && res.headers.Location && hops++ < 5) { url = res.headers.Location.startsWith('/') ? url.replace(/^(https?:\/\/[^/]+).*$/, '$1') + res.headers.Location : res.headers.Location; continue; }
        break;
      }
      if (res.error) {
        if (!silent || showErr) c.err(`curl: (${res.code}) ${res.error}\n${res.hint ? res.hint + '\n' : ''}`);
        st = res.code;
        continue;
      }
      if (fail && res.status >= 400) { if (!silent || showErr) c.err(`curl: (22) The requested URL returned error: ${res.status}\n`); st = 22; continue; }
      const hdr = `HTTP/1.1 ${res.status} ${LX.HTTP_TEXT[res.status] || ''}\r\n` + Object.entries(res.headers || {}).map(([k, v]) => `${k}: ${v}\r\n`).join('') + '\r\n';
      let body = head ? '' : res.body;
      const dl = downloadBody(c, url, res);
      if (dl && !head) body = dl.body;
      let text = (head || include ? hdr : '') + body;
      if (out || remoteName) {
        const name = out || (P().basename(url.split('?')[0]) || 'index.html');
        if (remoteName && !P().basename(url.replace(/^https?:\/\/[^/]+/, '').split('?')[0])) { c.err('curl: (23) Failed writing received data to disk/application\ncurl: Remote file name has no length!\n'); st = 23; continue; }
        const size = dl && dl.size ? dl.size : LX.byteLen(text);
        if (!silent && !noProgress) c.err(`  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n                                 Dload  Upload   Total   Spent    Left  Speed\n100 ${LX.human(size).padStart(5)}  100 ${LX.human(size).padStart(5)}    0     0  ${LX.human(size * 4).padStart(5)}      0 --:--:-- --:--:-- --:--:-- ${LX.human(size * 4).padStart(5)}\n`);
        if (name === '-') { c.out(text); continue; }
        try {
          c.fs.writeFile(c.resolve(name), text, c.cred, { mode: 0o664 & ~c.sh.umask });
          if (dl && dl.size) c.fs.lookup(c.resolve(name)).sz = dl.size;
        } catch (e) { c.err(`Warning: Failed to open the file ${name}: ${e.message}\ncurl: (23) Failure writing output to destination\n`); st = 23; }
      } else c.out(text);
      if (wfmt) c.out(LX.escapes(wfmt.replace(/%\{http_code\}/g, String(res.status)).replace(/%\{remote_ip\}/g, res.ip || '').replace(/%\{size_download\}/g, String(LX.byteLen(body))).replace(/%\{time_total\}/g, '0.004321').replace(/%\{content_type\}/g, (res.headers || {})['Content-Type'] || '')));
    }
    return st;
  });

  def('wget', async (c) => {
    const args = c.args.slice();
    let quiet = false, out = null, prefix = null, spider = false, insecure = false, cont = false;
    const urls = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-q' || a === '--quiet') quiet = true;
      else if (a === '-O' || a === '--output-document') out = args[++i];
      else if (/^-qO/.test(a)) { quiet = true; out = a.slice(3) || args[++i]; }
      else if (a === '-P' || a === '--directory-prefix') prefix = args[++i];
      else if (a === '--spider') spider = true;
      else if (a === '--no-check-certificate') insecure = true;
      else if (a === '-c' || a === '--continue') cont = true;
      else if (a === '-T' || a === '--timeout' || a === '-t' || a === '--tries' || a === '--user' || a === '--password' || a === '--header' || a === '-U' || a === '--user-agent' || a === '-o' || a === '--limit-rate' || a === '-w' || a === '--wait') i++;
      else if (a === '--version' || a === '-V') { c.out('GNU Wget 1.21.4 built on linux-gnu.\n'); return 0; }
      else if (a.startsWith('-')) continue;
      else urls.push(a);
    }
    void cont;
    if (!urls.length) { c.err("wget: missing URL\nUsage: wget [OPTION]... [URL]...\n\nTry `wget --help' for more options.\n"); return 1; }
    let st = 0;
    for (let url of urls) {
      if (!/^[a-z]+:\/\//i.test(url)) url = 'http://' + url;
      const now = LX.strftime(c.m, '%Y-%m-%d %H:%M:%S', c.m.now());
      const hostM = /^https?:\/\/(\[[^\]]+\]|[^/:?#]+)(?::(\d+))?/.exec(url);
      const host = hostM[1];
      const port = +(hostM[2] || (url.startsWith('https') ? 443 : 80));
      if (!quiet) c.err(`${spider ? 'Spider mode enabled. Check if remote file exists.\n' : ''}--${now}--  ${url}\n`);
      const r = LX.resolveHost(c.m, host);
      if (!r || (!r.local && dnsDown(c.m))) { if (!quiet) c.err(`Resolving ${host} (${host})... failed: ${!r ? 'Name or service not known' : 'Temporary failure in name resolution'}.\n`); c.err(`wget: unable to resolve host address ‘${host}’\n`); st = 4; continue; }
      if (!quiet) c.err(`Resolving ${host} (${host})... ${r.ip}\nConnecting to ${host} (${host})|${r.ip}|:${port}... `);
      const res = await httpReq(c, url, { method: spider ? 'HEAD' : 'GET', insecure });
      if (res.error) {
        if (res.code === 60) { c.err(`connected.\nERROR: cannot verify ${host}'s certificate, issued by ‘CN=${host}’:\n  Self-signed certificate encountered.\nTo connect to ${host} insecurely, use \`--no-check-certificate'.\n`); st = 5; continue; }
        if (!quiet) c.err(res.code === 28 ? 'failed: Connection timed out.\n' : 'failed: Connection refused.\n'); st = 4; continue;
      }
      if (!quiet) c.err(`connected.\nHTTP request sent, awaiting response... ${res.status} ${LX.HTTP_TEXT[res.status] || ''}\n`);
      if (res.status >= 400) { c.err(`${spider ? 'Remote file does not exist -- broken link!!!\n' : `${now} ERROR ${res.status}: ${LX.HTTP_TEXT[res.status]}.\n`}\n`); st = 8; continue; }
      if (spider) {
        const sz = (res.headers || {})['Content-Length'] || LX.byteLen(res.body || '');
        if (!quiet) c.err(`Length: ${sz} (${LX.human(+sz)}) [${(res.headers || {})['Content-Type'] || 'text/html'}]\nRemote file exists${/text\/html/.test((res.headers || {})['Content-Type'] || 'text/html') ? ' and could contain further links,\nbut recursion is disabled -- not retrieving.' : '.'}\n\n`);
        continue;
      }
      const dl = downloadBody(c, url, res);
      const body = dl ? dl.body : res.body;
      const size = dl && dl.size ? dl.size : LX.byteLen(body);
      let name = out || (decodeURIComponent(P().basename(url.replace(/^https?:\/\/[^/]+/, '').split('?')[0])) || 'index.html');
      if (name === '-') { c.out(body); continue; }
      if (prefix) name = prefix.replace(/\/$/, '') + '/' + name;
      if (!out) { let k = 0; const base = name; while (c.fs.lookup(c.resolve(name))) name = `${base}.${++k}`; }
      if (!quiet) c.err(`Length: ${size} (${LX.human(size)}) [${(res.headers || {})['Content-Type'] || (dl && dl.type) || 'text/html'}]\nSaving to: ‘${name}’\n\n${P().basename(name).slice(0, 18).padEnd(18)} 100%[===================>] ${LX.human(size).padStart(7)}  --.-KB/s    in 0.01s   \n\n${now} (${(size / 10240).toFixed(1)} MB/s) - ‘${name}’ saved [${size}/${size}]\n\n`);
      try {
        c.fs.writeFile(c.resolve(name), body, c.cred, { mode: 0o664 & ~c.sh.umask });
        if (dl && dl.size) c.fs.lookup(c.resolve(name)).sz = dl.size;
      } catch (e) { c.err(`${name}: ${e.message}\n`); st = 3; }
    }
    return st;
  });

  // ======================================================================= DNS
  function dnsAnswer(m, name, type) {
    name = name.replace(/\.$/, '').toLowerCase();
    const ext = LX.EXTERNAL[name] || LX.EXTERNAL[name.replace(/^www\./, '')];
    type = (type || 'A').toUpperCase();
    const R = (t, v, ttl = 300) => ({ name: name + '.', type: t, v, ttl });
    if (name === 'localhost') return [R('A', '127.0.0.1', 0)];
    if (type === 'MX') {
      if (/google/.test(name)) return [R('MX', '10 smtp.google.com.')];
      if (/naver/.test(name)) return [R('MX', '10 mx1.naver.com.'), R('MX', '10 mx2.naver.com.')];
      return ext || /\.(com|net|org|kr)$/.test(name) ? [R('MX', `10 mail.${name}.`)] : [];
    }
    if (type === 'NS') return ext || /\.(com|net|org|kr|io)$/.test(name) ? [R('NS', `ns1.${name.replace(/^www\./, '')}.`), R('NS', `ns2.${name.replace(/^www\./, '')}.`)] : [];
    if (type === 'TXT') return ext ? [R('TXT', '"v=spf1 include:_spf.' + name + ' ~all"')] : [];
    if (type === 'AAAA') return /google/.test(name) ? [R('AAAA', '2404:6800:4004:827::200e')] : [];
    if (type === 'CNAME') return name.startsWith('www.') ? [R('CNAME', name.slice(4) + '.')] : [];
    const r = LX.resolveHost({ state: m.state, hostname: () => '', vfs: { readFile: () => '' } }, name);
    if (!r || (r.local && !r.pub)) return null;
    if (r.pub) return [R('A', r.pub, 60)];
    if (name === 'www.naver.com') return [R('CNAME', 'www.naver.com.nheos.com.'), { name: 'www.naver.com.nheos.com.', type: 'A', v: '223.130.200.219', ttl: 60 }];
    return [R('A', r.ip, name.includes('google') ? 187 : 300)];
  }

  def('dig', async (c) => {
    const m = c.m;
    let server = null, type = 'A', short = false, name = null, rev = false;
    for (let i = 0; i < c.args.length; i++) {
      const a = c.args[i];
      if (a.startsWith('@')) server = a.slice(1);
      else if (a === '+short') short = true;
      else if (a.startsWith('+')) continue;
      else if (a === '-x') { rev = true; name = c.args[++i]; }
      else if (a === '-t') type = c.args[++i];
      else if (/^(A|AAAA|MX|NS|TXT|CNAME|SOA|ANY|PTR)$/i.test(a)) type = a.toUpperCase();
      else name = a;
    }
    if (!name) name = '.';
    if (dnsDown(m)) { c.out(`;; communications error to ${server || '127.0.0.53'}#53: timed out\n;; communications error to ${server || '127.0.0.53'}#53: timed out\n;; communications error to ${server || '127.0.0.53'}#53: timed out\n\n; <<>> DiG 9.18.30-0ubuntu0.24.04.2-Ubuntu <<>> ${c.args.join(' ')}\n;; global options: +cmd\n;; no servers could be reached\n`); return 9; }
    let ans;
    if (rev) ans = [{ name: name.split('.').reverse().join('.') + '.in-addr.arpa.', type: 'PTR', v: name === '8.8.8.8' ? 'dns.google.' : name === '1.1.1.1' ? 'one.one.one.one.' : 'host.example.', ttl: 300 }];
    else ans = dnsAnswer(m, name, type);
    if (short) { (ans || []).filter((x) => x.type === type || (type === 'A' && x.type === 'CNAME') || rev).forEach((x) => c.out(x.v + '\n')); return 0; }
    const sv = server || '127.0.0.53';
    const status = ans === null ? 'NXDOMAIN' : 'NOERROR';
    const list = ans || [];
    let out = `\n; <<>> DiG 9.18.30-0ubuntu0.24.04.2-Ubuntu <<>> ${c.args.join(' ')}\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: ${status}, id: ${10000 + Math.floor(Math.random() * 50000)}\n;; flags: qr rd ra; QUERY: 1, ANSWER: ${list.length}, AUTHORITY: ${ans === null ? 1 : 0}, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 65494\n;; QUESTION SECTION:\n;${rev ? list[0].name : name.replace(/\.?$/, '.')}\t\t\tIN\t${rev ? 'PTR' : type}\n\n`;
    if (list.length) out += ';; ANSWER SECTION:\n' + list.map((x) => `${x.name}\t\t${x.ttl}\tIN\t${x.type}\t${x.v}`).join('\n') + '\n\n';
    if (ans === null) out += `;; AUTHORITY SECTION:\n${name.split('.').slice(-1)[0] || '.'}.\t\t\t900\tIN\tSOA\ta.root-servers.net. nstld.verisign-grs.com. 2026092700 1800 900 604800 86400\n\n`;
    out += `;; Query time: ${list.length ? 12 + (name.length * 7) % 40 : 44} msec\n;; SERVER: ${sv}#53(${sv}) (UDP)\n;; WHEN: ${LX.strftime(m, '%a %b %d %H:%M:%S %Z %Y', m.now())}\n;; MSG SIZE  rcvd: ${40 + list.length * 16}\n\n`;
    c.out(out);
    return 0;
  });

  def('nslookup', async (c) => {
    const m = c.m;
    const args = c.args.filter((a) => !a.startsWith('-'));
    const typeArg = (c.args.find((a) => /^-(type|query|q)=/.test(a)) || '').split('=')[1];
    const name = args[0];
    const server = args[1] || '127.0.0.53';
    if (!name) { c.err('\x1b[2m(가상 터미널: 대화형 nslookup 대신 nslookup 도메인 형식으로 입력하세요)\x1b[0m\n'); return 1; }
    if (dnsDown(m)) { c.out(`;; communications error to ${server}#53: timed out\n;; no servers could be reached\n\n`); return 1; }
    const ans = dnsAnswer(m, name, typeArg || 'A');
    c.out(`Server:\t\t${server}\nAddress:\t${server}#53\n\n`);
    if (ans === null) { c.out(`** server can't find ${name}: NXDOMAIN\n\n`); return 1; }
    c.out('Non-authoritative answer:\n');
    ans.forEach((x) => { if (x.type === 'A') c.out(`Name:\t${x.name.replace(/\.$/, '')}\nAddress: ${x.v}\n`); else if (x.type === 'CNAME') c.out(`${x.name.replace(/\.$/, '')}\tcanonical name = ${x.v}\n`); else if (x.type === 'MX') c.out(`${name}\tmail exchanger = ${x.v}\n`); else c.out(`${name}\t${x.type.toLowerCase()} = ${x.v}\n`); });
    if (/google/.test(name) && !typeArg) c.out(`Name:\t${name}\nAddress: 2404:6800:4004:827::200e\n`);
    c.out('\n');
    return 0;
  });

  def('host', async (c) => {
    const m = c.m;
    const ti = c.args.indexOf('-t');
    const type = ti >= 0 ? (c.args[ti + 1] || '').toUpperCase() : null;
    const name = c.args.filter((a, i) => !a.startsWith('-') && (ti < 0 || i !== ti + 1))[0];
    if (!name) { c.err('Usage: host [-aCdilrTvVw] [-c class] [-N ndots] [-t type] [-W time]\n            [-R number] [-m flag] [-p port] hostname [server]\n'); return 1; }
    if (dnsDown(m)) { c.out(';; communications error to 127.0.0.53#53: timed out\n;; no servers could be reached\n'); return 1; }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) { const rev = name.split('.').reverse().join('.') + '.in-addr.arpa'; const ptr = name === '127.0.0.1' ? 'localhost.' : name === '8.8.8.8' ? 'dns.google.' : name === '1.1.1.1' ? 'one.one.one.one.' : null; c.out(ptr ? `${rev} domain name pointer ${ptr}\n` : `Host ${rev} not found: 3(NXDOMAIN)\n`); return ptr ? 0 : 1; }
    const ans = dnsAnswer(m, name, type || 'A');
    if (ans === null) { c.out(`Host ${name} not found: 3(NXDOMAIN)\n`); return 1; }
    const show = (x) => {
      if (x.type === 'CNAME') return `${name} is an alias for ${x.v.replace(/\.$/, '')}.\n`;
      if (x.type === 'A') return `${x.name.replace(/\.$/, '')} has address ${x.v}\n`;
      if (x.type === 'AAAA') return `${name} has IPv6 address ${x.v}\n`;
      if (x.type === 'MX') return `${name} mail is handled by ${x.v}\n`;
      if (x.type === 'NS') return `${name} name server ${x.v}\n`;
      if (x.type === 'TXT') return `${name} descriptive text "${x.v.replace(/^"|"$/g, '')}"\n`;
      if (x.type === 'SOA') return `${name} has SOA record ${x.v}\n`;
      return `${name} has ${x.type} record ${x.v}\n`;
    };
    if (type) { if (!ans.length) { c.out(`${name} has no ${type} record\n`); return 0; } ans.forEach((x) => c.out(show(x))); return 0; }
    ans.forEach((x) => c.out(show(x)));
    (dnsAnswer(m, name, 'AAAA') || []).forEach((x) => c.out(show(x)));
    (dnsAnswer(m, name, 'MX') || []).forEach((x) => c.out(show(x)));
    return 0;
  });

  def('whois', async (c) => {
    const d = c.args.filter((a) => !a.startsWith('-'))[0] || '';
    c.out(`   Domain Name: ${d.toUpperCase()}\n   Registry Domain ID: 2138514_DOMAIN_COM-VRSN\n   Registrar WHOIS Server: whois.markmonitor.com\n   Updated Date: 2025-08-14T07:01:44Z\n   Creation Date: 1997-09-15T04:00:00Z\n   Registrar: MarkMonitor Inc.\n   Name Server: NS1.${d.toUpperCase()}\n   Name Server: NS2.${d.toUpperCase()}\n   DNSSEC: unsigned\n\n(가상 응답입니다)\n`);
    return 0;
  });

  def('resolvectl', async (c) => {
    const m = c.m;
    const sub = c.args[0] || 'status';
    if (sub === 'query') { const a = dnsAnswer(m, c.args[1] || '', 'A'); if (!a) { c.err(`${c.args[1]}: resolve call failed: '${c.args[1]}' not found\n`); return 1; } a.forEach((x) => c.out(`${c.args[1]}: ${x.v}                        -- link: enp0s3\n`)); c.out('\n-- Information acquired via protocol DNS in 12.3ms.\n-- Data is authenticated: no; Data was acquired via local or encrypted transport: no\n-- Data from: network\n'); return 0; }
    if (sub === 'flush-caches') return 0;
    const dns = (m.state.net.dns || []).join(' ');
    c.out(`Global\n         Protocols: -LLMNR -mDNS -DNSOverTLS DNSSEC=no/unsupported\n  resolv.conf mode: stub\n\nLink 2 (enp0s3)\n    Current Scopes: DNS\n         Protocols: +DefaultRoute -LLMNR -mDNS -DNSOverTLS DNSSEC=no/unsupported\nCurrent DNS Server: ${(m.state.net.dns || [])[0] || ''}\n       DNS Servers: ${dns}\n${m.state.services.docker && m.state.services.docker.active ? '\nLink 3 (docker0)\n    Current Scopes: none\n         Protocols: -DefaultRoute -LLMNR -mDNS -DNSOverTLS DNSSEC=no/unsupported\n' : ''}`);
    return 0;
  });
  def('networkctl', async (c) => {
    const m = c.m;
    if (c.args[0] === 'status') { c.out(`●        State: routable\n  Online state: online\n       Address: ${m.state.net.ifaces.enp0s3.addr.map((a) => a.split('/')[0]).join('\n                ')} on enp0s3\n       Gateway: ${m.state.net.gw || ''} on enp0s3\n           DNS: ${(m.state.net.dns || []).join(' ')}\n`); return 0; }
    c.out(`IDX LINK   TYPE     OPERATIONAL SETUP     \n  1 lo     loopback carrier     unmanaged\n  2 enp0s3 ether    ${m.state.net.ifaces.enp0s3.state === 'UP' ? 'routable' : 'off'}    configured\n\n2 links listed.\n`);
    return 0;
  });

  // ======================================================================= netplan
  function parseNetplan(m) {
    const files = LX.globFiles(m, '/etc/netplan/*.yaml').sort();
    const cfg = {};
    const warnings = [];
    const errors = [];
    for (const f of files) {
      const node = m.vfs.lookup(f);
      if ((node.m & 0o077) !== 0) warnings.push(`** (generate:${m.nextPid()}): WARNING **: ${LX.strftime(m, '%H:%M:%S', m.now())}.123: Permissions for ${f} are too open. Netplan configuration should NOT be accessible by others.`);
      const text = node.c || '';
      if (/\t/.test(text)) { const ln = text.split('\n').findIndex((l) => /\t/.test(l)); errors.push(`${f}:${ln + 1}:1: Invalid YAML: tabs are not allowed for indent:\n${text.split('\n')[ln]}\n^`); continue; }
      const lines = text.split('\n');
      const stack = [];
      let curIface = null, section = null, sub = null;
      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i].replace(/#.*/, '');
        if (!raw.trim()) continue;
        const ind = raw.length - raw.trimStart().length;
        const t = raw.trim();
        const kv = /^([\w.-]+):\s*(.*)$/.exec(t.replace(/^-\s*/, ''));
        if (!kv && !t.startsWith('-')) { errors.push(`${f}:${i + 1}:${ind + 1}: Invalid YAML: could not find expected ':':\n${raw}\n${' '.repeat(ind)}^`); break; }
        void stack;
        if (kv && kv[1] === 'ethernets') { section = 'eth'; continue; }
        if (section === 'eth' && kv && ind === 4 && !kv[2]) { curIface = kv[1]; cfg[curIface] = cfg[curIface] || { addresses: [], nameservers: [], routes: [] }; sub = null; continue; }
        if (!curIface) continue;
        const I = cfg[curIface];
        if (kv) {
          const [, k, v] = kv;
          if (k === 'dhcp4') I.dhcp4 = /^(true|yes)$/.test(v);
          else if (k === 'addresses') { sub = 'addresses'; const arr = /^\[(.*)\]$/.exec(v); if (arr) { if (ind >= 8 && ind > 6 && sub === 'addresses' && /nameservers/.test(lines.slice(Math.max(0, i - 3), i).join('\n')) && ind >= 8) I.nameservers.push(...arr[1].split(',').map((x) => x.trim().replace(/['"]/g, '')).filter(Boolean)); else I.addresses.push(...arr[1].split(',').map((x) => x.trim().replace(/['"]/g, '')).filter(Boolean)); } if (ind >= 8 && /nameservers/.test(lines.slice(Math.max(0, i - 2), i).join('\n'))) sub = 'ns'; }
          else if (k === 'gateway4') I.gw = v.trim();
          else if (k === 'nameservers') sub = 'nameservers';
          else if (k === 'routes') sub = 'routes';
          else if (k === 'via') I.gw = v.trim();
          else if (k === 'to') { /* default */ }
          else if (k === 'search') { /* 무시 */ }
        } else if (t.startsWith('-')) {
          const val = t.replace(/^-\s*/, '').replace(/['"]/g, '');
          if (sub === 'addresses') I.addresses.push(val);
          else if (sub === 'ns') I.nameservers.push(val);
        }
      }
    }
    // nameservers 의 addresses 가 addresses 에 섞였으면 분리 (들여쓰기로 판정)
    for (const f of files) {
      const text = (m.vfs.lookup(f) || {}).c || '';
      const r = /nameservers:\s*\n\s+addresses:\s*\[([^\]]*)\]/.exec(text);
      const r2 = /nameservers:\s*\n\s+addresses:\s*\n((?:\s+-\s*\S+\s*\n?)+)/.exec(text);
      Object.values(cfg).forEach((I) => {
        const ns = r ? r[1].split(',').map((x) => x.trim().replace(/['"]/g, '')).filter(Boolean) : r2 ? r2[1].split('\n').map((x) => x.replace(/^\s*-\s*/, '').trim().replace(/['"]/g, '')).filter(Boolean) : [];
        if (ns.length) { I.nameservers = ns; I.addresses = I.addresses.filter((a) => !ns.includes(a)); }
      });
    }
    Object.entries(cfg).forEach(([k, I]) => {
      I.addresses.forEach((a) => { if (!/^\d+\.\d+\.\d+\.\d+\/\d+$/.test(a) && !/:/.test(a)) errors.push(`/etc/netplan: Error in network definition: address '${a}' is missing /prefixlength`); });
      if (!m.state.net.ifaces[k] && !/^(docker|br|veth)/.test(k)) warnings.push(`WARNING: Cannot find device "${k}"`);
    });
    return { cfg, warnings, errors };
  }

  function applyNetplan(m) {
    const { cfg, errors } = parseNetplan(m);
    if (errors.length) return errors;
    Object.entries(cfg).forEach(([k, I]) => {
      const i = m.state.net.ifaces[k];
      if (!i) return;
      if (I.dhcp4) { i.dhcp = true; i.addr = ['10.0.2.15/24'].concat(I.addresses.filter((a) => /\./.test(a))); m.state.net.gw = '10.0.2.2'; m.state.net.dns = I.nameservers.length ? I.nameservers : ['10.0.2.3']; }
      else { i.dhcp = false; i.addr = I.addresses.filter((a) => /\./.test(a)); m.state.net.gw = I.gw || null; m.state.net.dns = I.nameservers; }
      i.state = 'UP';
    });
    return null;
  }
  LX.applyNetplan = applyNetplan;

  def('netplan', async (c) => {
    const m = c.m;
    const sub = c.args[0] || 'help';
    const { cfg, warnings, errors } = parseNetplan(m);
    if (sub === 'get') {
      if (c.cred.uid !== 0) { c.err('Permission denied: /etc/netplan/50-cloud-init.yaml\n'); }
      let out = 'network:\n  version: 2\n  ethernets:\n';
      Object.entries(cfg).forEach(([k, I]) => {
        out += `    ${k}:\n`;
        if (I.addresses.length) out += `      addresses:\n${I.addresses.map((a) => `      - "${a}"\n`).join('')}`;
        if (I.nameservers.length) out += `      nameservers:\n        addresses:\n${I.nameservers.map((a) => `        - ${a}\n`).join('')}`;
        if (I.dhcp4) out += '      dhcp4: true\n';
        if (I.gw) out += `      routes:\n      - to: "default"\n        via: "${I.gw}"\n`;
      });
      c.out(out);
      return 0;
    }
    if (sub === 'status') {
      const e = m.state.net.ifaces.enp0s3;
      c.out(`     Online state: ${internetDown(m) ? 'offline' : 'online'}\n    DNS Addresses: 127.0.0.53 (stub)\n       DNS Search: .\n\n●  1: lo ethernet UNKNOWN/UP (unmanaged)\n      MAC Address: 00:00:00:00:00:00\n        Addresses: 127.0.0.1/8\n                   ::1/128\n\n●  2: enp0s3 ethernet ${e.state}/UP (networkd: enp0s3)\n      MAC Address: ${e.mac} (Intel Corporation)\n        Addresses: ${e.addr.map((a, k) => a + (e.dhcp && k === 0 ? ' (dhcp)' : '')).join('\n                   ')}\n    DNS Addresses: ${(m.state.net.dns || []).join(', ')}\n           Routes: ${m.state.net.gw ? `default via ${m.state.net.gw} from ${(e.addr[0] || '').split('/')[0]} metric 100 (${e.dhcp ? 'dhcp' : 'static'})` : ''}\n`);
      return 0;
    }
    if (sub === 'generate' || sub === 'apply' || sub === 'try') {
      if (c.cred.uid !== 0) { c.err(`Permission denied: '/etc/netplan/50-cloud-init.yaml'\n`); return 1; }
      warnings.forEach((w) => c.err(w + '\n'));
      if (errors.length) { c.err(errors.join('\n') + '\n'); return 78; }
      if (sub === 'generate') return 0;
      if (sub === 'try') {
        c.out('Do you want to keep these settings?\n\n\nPress ENTER before the timeout to accept the new configuration\n\n\n');
        const before = JSON.stringify(m.state.net);
        applyNetplan(m);
        const a = await c.readLine('Changes will revert in 120 seconds\n', { tty: true, answer: '' });
        if (a == null) { m.state.net = JSON.parse(before); c.out('Reverting.\n'); return 1; }
        c.out('Configuration accepted.\n');
        return 0;
      }
      applyNetplan(m);
      LX.log(m, 'systemd-networkd[521]', 'enp0s3: Reconfiguring with /run/systemd/network/10-netplan-enp0s3.network.');
      return 0;
    }
    c.out('usage: /usr/sbin/netplan  [-h] [--debug]  ...\n\nNetwork configuration in YAML\n\noptions:\n  -h, --help  show this help message and exit\n  --debug     Enable debug messages\n\nAvailable commands:\n  \n    help      Show this help message\n    apply     Apply current netplan config to running system\n    generate  Generate backend specific configuration files from /etc/netplan/*.yaml\n    get       Get a setting by specifying a nested key like "ethernets.eth0.addresses", or "all"\n    info      Show available features\n    ip        Retrieve IP information from the system\n    set       Add new setting by specifying a dotted key=value pair like ethernets.eth0.dhcp4=true\n    rebind    Rebind SR-IOV virtual functions of given physical functions to their driver\n    status    Query networking state of the running system\n    try       Try to apply a new netplan config to running system, with automatic rollback\n');
    return 0;
  });

  // ======================================================================= ufw
  const APP_PORTS = () => ({});
  function appProfiles(m) {
    const apps = {};
    LX.globFiles(m, '/etc/ufw/applications.d/*').forEach((f) => {
      const t = m.vfs.readFile(f, null);
      let cur = null;
      t.split('\n').forEach((l) => {
        const h = /^\[(.+)\]$/.exec(l.trim());
        if (h) { cur = h[1]; apps[cur] = { ports: '', title: '', desc: '' }; return; }
        const kv = /^(\w+)=(.*)$/.exec(l.trim());
        if (kv && cur) apps[cur][kv[1]] = kv[2];
      });
    });
    return apps;
  }
  void APP_PORTS;

  function ruleText(r) {
    let to = r.app ? r.app : r.port != null ? `${r.port}${r.proto && r.proto !== 'any' ? '/' + r.proto : ''}` : 'Anywhere';
    if (r.toIp && r.toIp !== 'any') to = `${r.toIp}${r.port != null ? ' ' + r.port + (r.proto && r.proto !== 'any' ? '/' + r.proto : '') : ''}`;
    return { to: to + (r.v6 ? ' (v6)' : ''), action: r.action.toUpperCase() + (r.dir === 'out' ? ' OUT' : ''), from: (r.from && r.from !== 'any' ? r.from : 'Anywhere') + (r.v6 && (!r.from || r.from === 'any') ? ' (v6)' : '') };
  }
  function ruleCmd(r) {
    const base = r.app ? `${r.action} ${/\s/.test(r.app) ? `'${r.app}'` : r.app}` : r.from && r.from !== 'any' ? `${r.action}${r.proto && r.proto !== 'any' ? ' proto ' + r.proto : ''} from ${r.from} to any${r.port != null ? ' port ' + r.port : ''}` : `${r.action} ${r.port}${r.proto && r.proto !== 'any' ? '/' + r.proto : ''}`;
    return base + (r.v6 ? ' (v6)' : '');
  }

  def('ufw', async (c) => {
    const m = c.m;
    const u = m.state.ufw;
    const args = c.args.slice();
    const force = args[0] === '--force' ? (args.shift(), true) : false;
    const cmd = args[0];
    if (cmd === 'version' || cmd === '--version') { c.out('ufw 0.36.2\nCopyright 2008-2023 Canonical Ltd.\n'); return 0; }
    if (!cmd || cmd === 'help' || cmd === '--help') { c.out('\nUsage: ufw COMMAND\n\nCommands:\n enable                          enables the firewall\n disable                         disables the firewall\n default ARG                     set default policy\n logging LEVEL                   set logging to LEVEL\n allow ARGS                      add allow rule\n deny ARGS                       add deny rule\n reject ARGS                     add reject rule\n limit ARGS                      add limit rule\n delete RULE|NUM                 delete RULE\n insert NUM RULE                 insert RULE at NUM\n prepend RULE                    prepend RULE\n route RULE                      add route RULE\n route delete RULE|NUM           delete route RULE\n route insert NUM RULE           insert route RULE at NUM\n reload                          reload firewall\n reset                           reset firewall\n status                          show firewall status\n status numbered                 show firewall status as numbered list of RULES\n status verbose                  show verbose firewall status\n show ARG                        show firewall report\n version                         display version information\n\nApplication profile commands:\n app list                        list application profiles\n app info PROFILE                show information on PROFILE\n app update PROFILE              update PROFILE\n app default ARG                 set default application policy\n\n'); return 0; }
    if (c.cred.uid !== 0) { c.err('ERROR: You need to be root to run this script\n'); return 1; }
    const saveConf = () => { try { c.fs.writeFile('/etc/ufw/ufw.conf', c.fs.readFile('/etc/ufw/ufw.conf', null).replace(/^ENABLED=.*$/m, `ENABLED=${u.enabled ? 'yes' : 'no'}`), null); } catch (e) { /* 무시 */ } };
    switch (cmd) {
      case 'status': {
        if (!u.enabled) { c.out('Status: inactive\n'); return 0; }
        const mode = args[1];
        let out = 'Status: active\n';
        if (mode === 'verbose') out += `Logging: ${u.logging === 'off' ? 'off' : `on (${u.logging})`}\nDefault: ${u.defIn} (incoming), ${u.defOut} (outgoing), disabled (routed)\nNew profiles: skip\n`;
        if (u.rules.length) {
          const rows = u.rules.map(ruleText);
          const wt = Math.max(26, ...rows.map((r) => r.to.length + 1));
          const wa = mode === 'verbose' || mode === 'numbered' ? 12 : 11;
          out += `\n${mode === 'numbered' ? '     ' : ''}${'To'.padEnd(wt)} ${'Action'.padEnd(wa)} From\n${mode === 'numbered' ? '     ' : ''}${'--'.padEnd(wt)} ${'------'.padEnd(wa)} ----\n`;
          rows.forEach((r, i) => { out += `${mode === 'numbered' ? `[${String(i + 1).padStart(2)}] ` : ''}${r.to.padEnd(wt)} ${(r.action + (mode === 'verbose' || mode === 'numbered' ? (r.action.includes('OUT') ? '' : ' IN') : '')).padEnd(wa)} ${r.from.padEnd(26)}\n`; });
          out += '\n';
        }
        c.out(out);
        return 0;
      }
      case 'enable': {
        if (!force && !c.session.headless) {
          const a = await c.readLine('Command may disrupt existing ssh connections. Proceed with operation (y|n)? ', { tty: true });
          if (!/^y/i.test(a || '')) { c.out('Aborted\n'); return 0; }
        }
        u.enabled = true;
        saveConf();
        c.out('Firewall is active and enabled on system startup\n');
        return 0;
      }
      case 'disable': u.enabled = false; saveConf(); c.out('Firewall stopped and disabled on system startup\n'); return 0;
      case 'reload': c.out(u.enabled ? 'Firewall reloaded\n' : 'Firewall not enabled (skipping reload)\n'); return 0;
      case 'reset': {
        if (!force && !c.session.headless) { const a = await c.readLine('Resetting all rules to installed defaults. Proceed with operation (y|n)? ', { tty: true }); if (!/^y/i.test(a || '')) { c.out('Aborted\n'); return 0; } }
        const ts = LX.strftime(m, '%Y%m%d_%H%M%S', m.now());
        c.out(['user.rules', 'before.rules', 'after.rules', 'user6.rules', 'before6.rules', 'after6.rules'].map((f) => `Backing up '${f}' to '/etc/ufw/${f}.${ts}'`).join('\n') + '\n\n');
        m.state.ufw = { enabled: false, rules: [], defIn: 'deny', defOut: 'allow', logging: 'low' };
        saveConf();
        return 0;
      }
      case 'default': {
        const pol = args[1], dir = args[2] || 'incoming';
        if (!/^(allow|deny|reject)$/.test(pol || '')) { c.err('ERROR: Invalid syntax\n'); return 1; }
        if (/^in/.test(dir)) u.defIn = pol; else if (/^out/.test(dir)) u.defOut = pol;
        c.out(`Default ${/^in/.test(dir) ? 'incoming' : /^out/.test(dir) ? 'outgoing' : 'routed'} policy changed to '${pol}'\n(be sure to update your rules accordingly)\n`);
        return 0;
      }
      case 'logging': {
        const lv = args[1];
        if (!/^(on|off|low|medium|high|full)$/.test(lv || '')) { c.err('ERROR: Invalid syntax\n'); return 1; }
        u.logging = lv === 'on' ? 'low' : lv;
        c.out(lv === 'off' ? 'Logging disabled\n' : 'Logging enabled\n');
        return 0;
      }
      case 'app': {
        const apps = appProfiles(m);
        if (args[1] === 'list') { c.out('Available applications:\n' + Object.keys(apps).sort().map((a) => `  ${a}\n`).join('')); return 0; }
        if (args[1] === 'info') {
          const a = apps[args[2]];
          if (!a) { c.err(`ERROR: Could not find profile '${args[2]}'\n`); return 1; }
          c.out(`Profile: ${args[2]}\nTitle: ${a.title}\nDescription: ${a.description || a.desc}\n\nPort${a.ports.includes(',') ? 's' : ''}:\n${a.ports.split('|').flatMap((p) => { const [nums, pr] = p.split('/'); return nums.split(',').map((n) => `  ${n}/${pr}`); }).join('\n')}\n`);
          return 0;
        }
        c.err('ERROR: Invalid syntax\n');
        return 1;
      }
      case 'show': {
        if (args[1] === 'added') { c.out('Added user rules (see \'ufw status\' for running firewall):\n' + (u.rules.filter((r) => !r.v6).map((r) => 'ufw ' + ruleCmd(r).replace(' (v6)', '')).join('\n') || '(None)') + '\n'); return 0; }
        if (args[1] === 'listening') { LX.ports(m).filter((p) => p.proto === 'tcp' && !p.addr.startsWith('127')).forEach((p) => c.out(`tcp:\n  ${p.port} * (${p.proc})\n`)); return 0; }
        c.err('ERROR: Invalid syntax\n'); return 1;
      }
      case 'delete': {
        if (/^\d+$/.test(args[1] || '')) {
          const n = +args[1];
          const r = u.rules[n - 1];
          if (!r) { c.err('ERROR: Could not find rule \'' + n + '\'\n'); return 1; }
          if (!force && !c.session.headless) { const a = await c.readLine(`Deleting:\n ${ruleCmd(r)}\nProceed with operation (y|n)? `, { tty: true }); if (!/^y/i.test(a || '')) { c.out('Aborted\n'); return 0; } }
          u.rules.splice(n - 1, 1);
          c.out('Rule deleted' + (r.v6 ? ' (v6)' : '') + '\n');
          return 0;
        }
        const spec = parseRule(args.slice(1), m);
        if (spec.error) { c.err(spec.error + '\n'); return 1; }
        let found = 0;
        for (const v6 of [false, true]) {
          const i = u.rules.findIndex((r) => r.action === spec.action && String(r.port) === String(spec.port) && (r.proto || 'any') === (spec.proto || 'any') && (r.from || 'any') === (spec.from || 'any') && (r.app || '') === (spec.app || '') && !!r.v6 === v6);
          if (i >= 0) { u.rules.splice(i, 1); found++; c.out('Rule deleted' + (v6 ? ' (v6)' : '') + '\n'); }
        }
        if (!found) { c.out('Could not delete non-existent rule\nCould not delete non-existent rule (v6)\n'); }
        return 0;
      }
      case 'allow': case 'deny': case 'reject': case 'limit': case 'insert': case 'prepend': {
        let pos = null;
        let rest = args;
        if (cmd === 'insert') { pos = +args[1] - 1; rest = args.slice(2); }
        if (cmd === 'prepend') { pos = 0; rest = args.slice(1); }
        const spec = parseRule(rest, m);
        if (spec.error) { c.err(spec.error + '\n'); return 1; }
        const v4only = spec.from && spec.from !== 'any' && /\./.test(spec.from);
        for (const v6 of v4only ? [false] : [false, true]) {
          const r = Object.assign({}, spec, { v6 });
          const exists = u.rules.some((x) => ruleCmd(x) === ruleCmd(r) && x.dir === r.dir);
          if (exists) { c.out(`Skipping adding existing rule${v6 ? ' (v6)' : ''}\n`); continue; }
          if (pos != null && !v6) u.rules.splice(pos, 0, r);
          else if (v6) { const lastV4 = u.rules.map((x) => !x.v6).lastIndexOf(true); u.rules.push(r); void lastV4; }
          else { const firstV6 = u.rules.findIndex((x) => x.v6); if (firstV6 >= 0) u.rules.splice(firstV6, 0, r); else u.rules.push(r); }
          c.out(`Rule ${pos != null ? 'inserted' : 'added'}${v6 ? ' (v6)' : ''}\n`);
        }
        return 0;
      }
      default:
        c.err(`ERROR: Invalid syntax\n\nUsage: ufw COMMAND\n`);
        return 1;
    }
  });

  function parseRule(args, m) {
    const a = args.slice();
    const action = a.shift();
    if (!/^(allow|deny|reject|limit)$/.test(action || '')) return { error: 'ERROR: Invalid syntax' };
    const r = { action, port: null, proto: 'any', from: 'any', dir: 'in' };
    if (a[0] === 'in' || a[0] === 'out') r.dir = a.shift();
    if (!a.length) return { error: 'ERROR: Invalid syntax' };
    const svc = { ssh: 22, http: 80, https: 443, ftp: 21, mysql: 3306, postgresql: 5432, smtp: 25, dns: 53, domain: 53 };
    if (a[0] !== 'from' && a[0] !== 'proto' && a[0] !== 'to' && a.length === 1) {
      const s = a[0];
      const apps = appProfiles(m);
      if (apps[s]) { r.app = s; const p = apps[s].ports; r.port = p.split('/')[0]; r.proto = (p.split('/')[1] || 'tcp'); return r; }
      const mm = /^([\d,:]+|[a-z]+)(?:\/(tcp|udp))?$/.exec(s);
      if (!mm) return { error: `ERROR: Could not find a profile matching '${s}'` };
      if (/^[a-z]+$/.test(mm[1])) { if (!svc[mm[1]]) return { error: `ERROR: Could not find a profile matching '${s}'` }; r.port = mm[1]; r.portNum = svc[mm[1]]; r.proto = mm[2] || 'any'; }
      else { r.port = mm[1]; r.proto = mm[2] || 'any'; }
      if (/[,:]/.test(r.port) && r.proto === 'any') return { error: 'ERROR: Must specify \'tcp\' or \'udp\' with multiple ports' };
      if (r.portNum) r.port = r.port; // 이름 그대로 표시
      return r;
    }
    while (a.length) {
      const k = a.shift();
      if (k === 'proto') r.proto = a.shift();
      else if (k === 'from') r.from = a.shift();
      else if (k === 'to') r.toIp = a.shift();
      else if (k === 'port') r.port = a.shift();
      else if (k === 'app') { r.app = a.shift(); }
      else return { error: 'ERROR: Invalid syntax' };
    }
    return r;
  }
  // 포트 이름 → 번호 (방화벽 판정용)
  const origPortMatch = portMatch;
  void origPortMatch;

  def(['iptables', 'ip6tables', 'iptables-save', 'nft'], async (c) => {
    const m = c.m;
    if (c.cred.uid !== 0) { c.err(`${c.name} v1.8.10 (nf_tables): Could not fetch rule set generation id: Permission denied (you must be root)\n\n`); return 4; }
    const u = m.state.ufw;
    if (c.name === 'iptables-save') { c.out(`# Generated by iptables-save v1.8.10 (nf_tables) on ${LX.strftime(m, '%a %b %e %H:%M:%S %Y', m.now())}\n*filter\n:INPUT ${u.enabled ? 'DROP' : 'ACCEPT'} [0:0]\n:FORWARD ${u.enabled ? 'DROP' : 'ACCEPT'} [0:0]\n:OUTPUT ACCEPT [0:0]\n${u.enabled ? ':ufw-user-input - [0:0]\n' + u.rules.filter((r) => !r.v6).map((r) => `-A ufw-user-input -p ${r.proto === 'any' ? 'tcp' : r.proto}${r.from !== 'any' ? ' -s ' + r.from : ''}${r.port != null ? ' --dport ' + r.port : ''} -j ${r.action === 'allow' ? 'ACCEPT' : r.action === 'reject' ? 'REJECT' : 'DROP'}`).join('\n') + '\n' : ''}COMMIT\n`); return 0; }
    if (c.args.includes('-L') || c.args.some((a) => /^-[nvL]+$/.test(a) && a.includes('L'))) {
      c.out(`Chain INPUT (policy ${u.enabled ? 'DROP' : 'ACCEPT'})\ntarget     prot opt source               destination         \n${u.enabled ? 'ufw-before-logging-input  all  --  anywhere             anywhere            \nufw-before-input  all  --  anywhere             anywhere            \nufw-user-input  all  --  anywhere             anywhere            \n' : ''}\nChain FORWARD (policy ${u.enabled ? 'DROP' : 'ACCEPT'})\ntarget     prot opt source               destination         \n${m.state.services.docker && m.state.services.docker.active ? 'DOCKER-USER  all  --  anywhere             anywhere            \nDOCKER-FORWARD  all  --  anywhere             anywhere            \n' : ''}\nChain OUTPUT (policy ACCEPT)\ntarget     prot opt source               destination         \n`);
      if (u.enabled) c.out(`\nChain ufw-user-input (1 references)\ntarget     prot opt source               destination         \n${u.rules.filter((r) => !r.v6).map((r) => `${(r.action === 'allow' ? 'ACCEPT' : r.action === 'reject' ? 'REJECT' : 'DROP').padEnd(10)} ${(r.proto === 'any' ? 'tcp' : r.proto).padEnd(4)} --  ${(r.from === 'any' ? 'anywhere' : r.from).padEnd(20)} anywhere             ${r.port != null ? `tcp dpt:${r.port}` : ''}`).join('\n')}\n`);
      return 0;
    }
    c.err('\x1b[2m(가상 터미널: iptables 규칙 변경은 지원하지 않습니다. Ubuntu 에서는 ufw 로 방화벽을 관리하세요)\x1b[0m\n');
    return 1;
  });

  // ======================================================================= SSH
  /** ~/.ssh/config 의 Host 별칭 → { HostName, User, Port, IdentityFile } */
  function sshConfig(c, alias) {
    let text = '';
    try { text = c.fs.readFile(`${c.cred.home}/.ssh/config`, c.cred); } catch (e) { return null; }
    let cur = null, res = null;
    for (const raw of text.split('\n')) {
      const line = raw.replace(/#.*/, '').trim();
      if (!line) continue;
      const m = /^(\S+)\s*[=\s]\s*(.*)$/.exec(line);
      if (!m) continue;
      const k = m[1].toLowerCase(), v = m[2].trim();
      if (k === 'host') { cur = v.split(/\s+/).some((pat) => pat === alias || (pat.includes('*') && LX.glob.globToRe(pat, false).test(alias))) ? (res = res || {}) : null; continue; }
      if (!cur) continue;
      if (k === 'hostname' && !cur.host) cur.host = v.replace(/%h/g, alias);
      else if (k === 'user' && !cur.user) cur.user = v;
      else if (k === 'port' && !cur.port) cur.port = +v;
      else if (k === 'identityfile' && !cur.identity) cur.identity = v.replace(/^~/, c.cred.home);
    }
    return res;
  }
  function sshTarget(c, spec) {
    let user = null, host = spec;
    const at = spec.lastIndexOf('@');
    if (at >= 0) { user = spec.slice(0, at); host = spec.slice(at + 1); }
    const cfg = sshConfig(c, host);
    const out = { user: user || (cfg && cfg.user) || c.cred.name, host: (cfg && cfg.host) || host, alias: host };
    if (cfg) { if (cfg.port) out.port = cfg.port; if (cfg.identity) out.identity = cfg.identity; }
    return out;
  }

  function sshdConf(m) {
    let t = '';
    try { t = m.vfs.readFile('/etc/ssh/sshd_config', null) + '\n' + LX.globFiles(m, '/etc/ssh/sshd_config.d/*.conf').map((f) => m.vfs.readFile(f, null)).join('\n'); } catch (e) { /* 없음 */ }
    const get = (k, d) => {
      // 먼저 나온 설정이 우선 (Include 가 위에 있음)
      const lines = [];
      try { LX.globFiles(m, '/etc/ssh/sshd_config.d/*.conf').forEach((f) => lines.push(...m.vfs.readFile(f, null).split('\n'))); } catch (e) { /* 없음 */ }
      try { lines.push(...m.vfs.readFile('/etc/ssh/sshd_config', null).split('\n')); } catch (e) { /* 없음 */ }
      for (const l of lines) { const r = new RegExp('^\\s*' + k + '\\s+(\\S+)', 'i').exec(l); if (r) return r[1]; }
      return d;
    };
    void t;
    return { pass: get('PasswordAuthentication', 'yes') !== 'no', root: get('PermitRootLogin', 'prohibit-password'), pubkey: get('PubkeyAuthentication', 'yes') !== 'no', port: +get('Port', '22'), allowUsers: get('AllowUsers', null) };
  }
  LX.sshdConf = sshdConf;

  function userPubKeys(c, user) {
    const cr = c.m.credFor(user);
    if (!cr) return [];
    const out = [];
    for (const k of ['id_ed25519.pub', 'id_rsa.pub', 'id_ecdsa.pub']) { try { out.push(c.fs.readFile(`${cr.home}/.ssh/${k}`, null).trim()); } catch (e) { /* 없음 */ } }
    return out;
  }
  function authorizedFor(c, user) {
    const cr = c.m.credFor(user);
    try { return c.fs.readFile(`${cr.home}/.ssh/authorized_keys`, null).split('\n').map((l) => l.trim()).filter(Boolean); } catch (e) { return []; }
  }

  /** SSH 로그인 과정. 성공하면 대상 사용자 cred, 실패하면 null */
  async function sshLogin(c, user, host, port, opts = {}) {
    const m = c.m;
    const r = LX.resolveHost(m, host);
    if (!r) { c.err(`ssh: Could not resolve hostname ${host}: ${dnsDown(m) ? 'Temporary failure in name resolution' : 'Name or service not known'}\n`); return { code: 255 }; }
    const conn = tcpConnect(c, host, port);
    if (!conn.ok && !(conn.ext && conn.extOk)) {
      if (conn.err === 'timeout' || (conn.ext && !r.local)) { await c.sleep(c.session.headless ? 0 : 2500); c.err(`ssh: connect to host ${host} port ${port}: Connection timed out\n`); return { code: 255 }; }
      c.err(`ssh: connect to host ${host} port ${port}: ${conn.err === 'unreach' ? 'Network is unreachable' : 'Connection refused'}\n`);
      return { code: 255 };
    }
    if (conn.ext || !r.local && !c.sh.fromOutside) { await c.sleep(c.session.headless ? 0 : 2500); c.err(`ssh: connect to host ${host} port ${port}: Connection timed out\n\x1b[2m(가상 터미널: 외부 서버 접속은 지원하지 않습니다. localhost 또는 labclient 로 실습하세요)\x1b[0m\n`); return { code: 255 }; }
    if (conn.listener && conn.listener.svc !== 'ssh') { c.err(`kex_exchange_identification: Connection closed by remote host\nConnection closed by ${conn.ip} port ${port}\n`); return { code: 255 }; }
    // known_hosts
    const kh = `${c.cred.home}/.ssh/known_hosts`;
    let known = '';
    try { known = c.fs.readFile(kh, c.cred); } catch (e) { /* 없음 */ }
    const khKey = port === 22 ? host : `[${host}]:${port}`;
    if (!known.split('\n').some((l) => l.split(' ')[0].split(',').includes(khKey)) && !opts.batch) {
      c.out(`The authenticity of host '${khKey} (${conn.ip})' can't be established.\nED25519 key fingerprint is SHA256:Zc5u9rS3wT7oN0dL4yX8aM2iG6kU1bE5fH9vP3jC7qW.\nThis key is not known by any other names.\n`);
      const a = await c.readLine('Are you sure you want to continue connecting (yes/no/[fingerprint])? ', { tty: true, answer: 'yes' });
      if (!/^yes$/i.test((a || '').trim())) { c.err('Host key verification failed.\n'); return { code: 255 }; }
      try {
        c.fs.mkdir(`${c.cred.home}/.ssh`, c.cred, { parents: true, mode: 0o700 });
        c.fs.writeFile(kh, `${khKey} ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIED25519hostkeyvirtual\n`, c.cred, { append: true, mode: 0o644 });
      } catch (e) { /* 무시 */ }
      c.err(`Warning: Permanently added '${khKey}' (ED25519) to the list of known hosts.\n`);
    }
    const tcred = m.credFor(user);
    const conf = sshdConf(m);
    const src = c.sh.fromOutside ? OUTSIDE_IP : '127.0.0.1';
    const logA = (msg) => LX.log(m, `sshd[${m.nextPid()}]`, msg, '/var/log/auth.log');
    // 공개키 인증
    const mine = opts.identity ? [(() => { try { return c.fs.readFile(c.resolve(opts.identity) + '.pub', c.cred).trim(); } catch (e) { return ''; } })()] : userPubKeys(c, c.sh.fromOutside ? c.m.defaultUser : c.cred.name);
    if (tcred && conf.pubkey && !opts.noPubkey && !(user === 'root' && conf.root === 'no') && mine.some((k) => k && authorizedFor(c, user).includes(k))) {
      const home = tcred.home;
      const sshDir = c.fs.lookup(home + '/.ssh');
      const ak = c.fs.lookup(home + '/.ssh/authorized_keys');
      if (sshDir && ak && ((sshDir.m & 0o022) || (ak.m & 0o022) || ak.u !== tcred.uid)) {
        logA(`Authentication refused: bad ownership or modes for file ${home}/.ssh/authorized_keys`);
      } else {
        logA(`Accepted publickey for ${user} from ${src} port ${50000 + Math.floor(Math.random() * 9999)} ssh2: ED25519 SHA256:Aq8r3t5Yb1Wz7Kc9Xp2Lm4Nd6Fh0Jg3Vs5Tu7Io9Ey`);
        return { cred: tcred };
      }
    }
    const methods = conf.pubkey ? (conf.pass ? 'publickey,password' : 'publickey') : 'password';
    if (!conf.pass || opts.noPass || opts.batch) {
      c.err(`${user}@${host}: Permission denied (${methods}).\n`);
      logA(`Connection closed by authenticating user ${user} ${src} port 50311 [preauth]`);
      return { code: 255 };
    }
    for (let i = 0; i < 3; i++) {
      const pw = await c.session.requestLine(`${user}@${host}'s password: `, { secret: true, password: user === 'root' ? '__x__' : m.defaultPassword });
      if (pw == null) return { code: 255 };
      const rootBlocked = user === 'root' && conf.root !== 'yes';
      if (tcred && !rootBlocked && m.checkPassword(user, pw) && !(conf.allowUsers && !conf.allowUsers.split(/\s+/).includes(user))) {
        logA(`Accepted password for ${user} from ${src} port ${50000 + Math.floor(Math.random() * 9999)} ssh2`);
        return { cred: tcred };
      }
      logA(`Failed password for ${tcred ? '' : 'invalid user '}${user} from ${src} port ${50000 + Math.floor(Math.random() * 9999)} ssh2`);
      if (c.sh.fromOutside) {
        m.state.f2b.fails = (m.state.f2b.fails || 0) + 1;
        if (m.state.services.fail2ban && m.state.services.fail2ban.active && m.state.f2b.fails >= f2bMax(m) && !m.state.f2b.banned.includes(OUTSIDE_IP)) {
          m.state.f2b.banned.push(OUTSIDE_IP);
          m.state.f2b.total = (m.state.f2b.total || 0) + 1;
          try { m.vfs.writeFile('/var/log/fail2ban.log', `${LX.strftime(m, '%Y-%m-%d %H:%M:%S', m.now())},123 fail2ban.actions        [${m.nextPid()}]: NOTICE  [sshd] Ban ${OUTSIDE_IP}\n`, null, { append: true }); } catch (e) { /* 무시 */ }
          c.err(`Connection closed by ${conn.ip} port ${port}\n`);
          return { code: 255 };
        }
      }
      await c.sleep(c.session.headless ? 0 : 1200);
      if (i < 2) c.err('Permission denied, please try again.\n');
    }
    c.err(`${user}@${host}: Permission denied (${methods}).\n`);
    return { code: 255 };
  }
  function f2bMax(m) {
    let t = '';
    try { t = m.vfs.readFile('/etc/fail2ban/jail.local', null); } catch (e) { try { t = m.vfs.readFile('/etc/fail2ban/jail.conf', null); } catch (e2) { /* 없음 */ } }
    const r = /maxretry\s*=\s*(\d+)/.exec(t);
    return r ? +r[1] : 5;
  }
  LX.f2bMax = f2bMax;

  function motd(m) {
    const x = LX.memInfo(m);
    return `Welcome to ${LX.OS.pretty} (GNU/Linux ${LX.OS.kernel} x86_64)\n\n * Documentation:  https://help.ubuntu.com\n * Management:     https://landscape.canonical.com\n * Support:        https://ubuntu.com/pro\n\n System information as of ${LX.strftime(m, '%a %b %e %I:%M:%S %p %Z %Y', m.now())}\n\n  System load:  0.08               Processes:             ${m.allProcs().length + 95}\n  Usage of /:   ${Math.round((m.state.mounts[0] || { used: 5400, size: 11776 }).used / (m.state.mounts[0] || { size: 11776 }).size * 100)}% of 11.21GB   Users logged in:       1\n  Memory usage: ${Math.round(x.used / x.total * 100)}%                IPv4 address for enp0s3: ${(m.state.net.ifaces.enp0s3.addr[0] || '').split('/')[0]}\n  Swap usage:   0%\n\nExpanded Security Maintenance for Applications is not enabled.\n\n${m.state.upgradable.length} updates can be applied immediately.\nTo see these additional updates run: apt list --upgradable\n\n`;
  }
  LX.motd = motd;

  def('ssh', async (c) => {
    const args = c.args.slice();
    let port = null, identity = null, batch = false, noPubkey = false, noPass = false;
    const ops = [];
    const opt = (o) => { if (/BatchMode=yes/i.test(o)) batch = true; if (/StrictHostKeyChecking=no/i.test(o)) batch = true; if (/PubkeyAuthentication=no/i.test(o)) noPubkey = true; if (/PasswordAuthentication=no/i.test(o)) noPass = true; if (/^IdentityFile=(.+)/i.test(o)) identity = /^IdentityFile=(.+)/i.exec(o)[1]; };
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-p') port = +args[++i];
      else if (a === '-i') identity = args[++i];
      else if (a === '-o') opt(args[++i]);
      else if (/^-o./.test(a)) opt(a.slice(2));
      else if (a === '-V') { c.err('OpenSSH_9.6p1 Ubuntu-3ubuntu13.13, OpenSSL 3.0.13 30 Jan 2024\n'); return 0; }
      else if (/^-[46AaCfGgKkMNnqsTtVvXxYy]+$/.test(a)) continue;
      else if (/^-[bcDEeFIiJLlmOoPQRSWw]$/.test(a)) i++;
      else { ops.push(...args.slice(i)); break; }
    }
    if (!ops.length) { c.err('usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface] [-b bind_address]\n           [-c cipher_spec] [-D [bind_address:]port] [-E log_file]\n           [-e escape_char] [-F configfile] [-I pkcs11] [-i identity_file]\n           [-J destination] [-L address] [-l login_name] [-m mac_spec]\n           [-O ctl_cmd] [-o option] [-P tag] [-p port] [-R address]\n           [-S ctl_path] [-W host:port] [-w local_tun[:remote_tun]]\n           destination [command [argument ...]]\n'); return 255; }
    let spec = ops[0];
    const m1 = /^ssh:\/\/([^:]+)(?::(\d+))?$/.exec(spec);
    if (m1) { spec = m1[1]; if (m1[2]) port = +m1[2]; }
    const tgt = sshTarget(c, spec);
    const { user, host } = tgt;
    if (!port && tgt.port) port = tgt.port;
    if (!identity && tgt.identity) identity = tgt.identity;
    const res = await sshLogin(c, user, host, port || 22, { identity, batch, noPubkey, noPass });
    if (!res.cred) return res.code;
    const cmd = ops.slice(1).join(' ');
    if (cmd) {
      const sh = new LX.Shell(c.session, { user: res.cred.name });
      sh.cwd = res.cred.home;
      try { return await sh.runSource(cmd, c.io); } catch (e) { if (e instanceof LX.sig.ExitSig) return e.code; throw e; }
    }
    if (!LX.canPush(c) && !c.sh.fromOutside) { c.err('Pseudo-terminal will not be allocated because stdin is not a terminal.\n'); return 0; }
    c.out(motd(c.m) + `Last login: ${LX.strftime(c.m, '%a %b %e %H:%M:%S %Y', c.m.bootTime + 300000)} from 10.0.2.2\n`);
    c.m.state.sshSessions = (c.m.state.sshSessions || []).concat(res.cred.name);
    const m = c.m;
    await c.session.pushShell(res.cred.name, { login: true, remote: host, onExit: async () => { c.session.out(`Connection to ${host} closed.\n`); m.state.sshSessions = (m.state.sshSessions || []).slice(1); } });
    const top = c.session.top;
    if (c.sh.fromOutside) top.remoteFrom = OUTSIDE_IP;
    return 0;
  });

  def('ssh-keygen', async (c) => {
    const { f, ops } = getopt(c.args, 't:b:f:N:C:qlyR:EvF:Hc', { });
    void ops;
    const home = c.cred.home;
    if (f.R) {
      const kh = `${home}/.ssh/known_hosts`;
      try {
        const t = c.fs.readFile(kh, c.cred);
        const lines = t.split('\n').filter((l) => l && !l.split(' ')[0].split(',').includes(f.R));
        c.fs.writeFile(kh + '.old', t, c.cred);
        c.fs.writeFile(kh, lines.join('\n') + (lines.length ? '\n' : ''), c.cred);
        c.out(`# Host ${f.R} found: line 1\n${kh} updated.\nOriginal contents retained as ${kh}.old\n`);
      } catch (e) { c.err(`do_known_hosts: hostkeys_foreach failed for ${kh}: No such file or directory\n`); return 255; }
      return 0;
    }
    if (f.l) {
      const file = f.f ? c.resolve(f.f) : `${home}/.ssh/id_ed25519.pub`;
      try {
        const t = c.fs.readFile(file.endsWith('.pub') ? file : file + '.pub', c.cred).trim();
        const p = t.split(' ');
        c.out(`${/rsa/.test(p[0]) ? 3072 : 256} SHA256:${LX.fakeHash(p[1] || '', 43).replace(/[^a-zA-Z0-9]/g, 'x')} ${p.slice(2).join(' ') || 'no comment'} (${/rsa/.test(p[0]) ? 'RSA' : 'ED25519'})\n`);
      } catch (e) { c.err(`${file} is not a public key file.\n`); return 255; }
      return 0;
    }
    const type = (f.t || 'ed25519').toLowerCase();
    if (!/^(ed25519|rsa|ecdsa)$/.test(type)) { c.err(`unknown key type ${type}\n`); return 255; }
    const bits = type === 'rsa' ? +(f.b || 3072) : type === 'ecdsa' ? 256 : 256;
    if (!f.q) c.out(`Generating public/private ${type} key pair.\n`);
    let file = f.f;
    if (!file) {
      const def = `${home}/.ssh/id_${type}`;
      const a = await c.readLine(`Enter file in which to save the key (${def}): `, { tty: true, answer: '' });
      file = (a || '').trim() || def;
    }
    const abs = c.resolve(file.replace(/^~/, home));
    const dir = P().dirname(abs);
    if (!c.fs.lookup(dir)) {
      try { c.fs.mkdir(dir, c.cred, { mode: 0o700 }); c.out(`Created directory '${dir}'.\n`); } catch (e) { c.err(`Saving key "${abs}" failed: ${e.message}\n`); return 255; }
    }
    if (c.fs.lookup(abs)) {
      c.out(`${abs} already exists.\n`);
      const a = await c.readLine('Overwrite (y/n)? ', { tty: true, answer: 'y' });
      if (!/^y/i.test(a || '')) return 1;
    }
    let pass = f.N;
    if (pass == null) {
      pass = await c.session.requestLine(`Enter passphrase for "${abs}" (empty for no passphrase): `, { secret: true, passphrase: true });
      const p2 = await c.session.requestLine('Enter same passphrase again: ', { secret: true, passphrase: true });
      if ((pass || '') !== (p2 || '')) { c.err('Passphrases do not match.  Try again.\n'); return 255; }
    }
    const comment = f.C || `${c.cred.name}@${c.m.hostname()}`;
    const rnd = Array.from({ length: 43 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'[Math.floor(Math.random() * 64)]).join('');
    const pub = type === 'ed25519' ? `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI${rnd} ${comment}` : type === 'rsa' ? `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQ${rnd}${rnd}${rnd} ${comment}` : `ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAI${rnd} ${comment}`;
    try {
      c.fs.writeFile(abs, `-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA${pass ? 'CmFlczI1Ni1jdHI' : 'BG5vbmUAAAAEbm9uZQ'}AAAAAAAAAB${rnd}\n(가상 개인 키 — 절대 다른 사람에게 보여 주면 안 됩니다)\n-----END OPENSSH PRIVATE KEY-----\n`, c.cred, { mode: 0o600 });
      c.fs.lookup(abs).m = 0o600;
      c.fs.writeFile(abs + '.pub', pub + '\n', c.cred, { mode: 0o644 });
      c.fs.lookup(abs + '.pub').m = 0o644;
    } catch (e) { c.err(`Saving key "${abs}" failed: ${e.message}\n`); return 255; }
    if (!f.q) {
      const fp = `SHA256:${LX.fakeHash(rnd, 43).replace(/[^a-zA-Z0-9]/g, 'x')}`;
      c.out(`Your identification has been saved in ${abs}\nYour public key has been saved in ${abs}.pub\nThe key fingerprint is:\n${fp} ${comment}\nThe key's randomart image is:\n+--[${type.toUpperCase()} ${bits}]--+\n|   .o+=*o.       |\n|  . o=B+o .      |\n|   ..*=B.o       |\n|    +.O.=        |\n|   . *.*S.       |\n|    o = +..      |\n|     = o.o.      |\n|    ..o.oE       |\n|     .o++.       |\n+----[SHA256]-----+\n`);
    }
    return 0;
  });

  def('ssh-copy-id', async (c) => {
    const args = c.args.slice();
    let idf = null, port = 22;
    const ops = [];
    for (let i = 0; i < args.length; i++) { if (args[i] === '-i') idf = args[++i]; else if (args[i] === '-p') port = +args[++i]; else if (!args[i].startsWith('-')) ops.push(args[i]); }
    if (!ops.length) { c.err('Usage: /usr/bin/ssh-copy-id [-h|-?|-f|-n|-s|-x] [-i [identity_file]] [-p port] [-F alternative ssh_config file] [-t target_path] [[-o <ssh -o options>] ...] [user@]hostname\n'); return 1; }
    const home = c.cred.home;
    const keyFile = idf ? c.resolve(idf.replace(/^~/, home)).replace(/(\.pub)?$/, '.pub') : ['id_ed25519.pub', 'id_rsa.pub', 'id_ecdsa.pub'].map((k) => `${home}/.ssh/${k}`).find((p) => c.fs.lookup(p));
    if (!keyFile || !c.fs.lookup(keyFile)) { c.err('/usr/bin/ssh-copy-id: ERROR: No identities found\n'); return 1; }
    const key = c.fs.readFile(keyFile, c.cred).trim();
    c.err(`/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "${keyFile}"\n`);
    const { user, host } = sshTarget(c, ops[0]);
    const tcred = c.m.credFor(user);
    if (tcred && authorizedFor(c, user).includes(key) && LX.resolveHost(c.m, host) && LX.resolveHost(c.m, host).local) {
      c.err(`/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed\n\n/usr/bin/ssh-copy-id: WARNING: All keys were skipped because they already exist on the remote system.\n\t\t(if you think this is a mistake, you may want to use -f option)\n\n`);
      return 0;
    }
    c.err('/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed\n/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys\n');
    const res = await sshLogin(c, user, host, port, {});
    if (!res.cred) return 1;
    const d = `${res.cred.home}/.ssh`;
    const fs = c.fs;
    if (!fs.lookup(d)) { fs.mkdir(d, null, { mode: 0o700 }); const n = fs.lookup(d); n.u = res.cred.uid; n.g = res.cred.gid; n.m = 0o700; }
    const ak = d + '/authorized_keys';
    fs.writeFile(ak, key + '\n', null, { append: true, mode: 0o600 });
    const n = fs.lookup(ak); n.u = res.cred.uid; n.g = res.cred.gid; if (!n.m) n.m = 0o600;
    c.out(`\nNumber of key(s) added: 1\n\nNow try logging into the machine, with:   "ssh${port !== 22 ? ` -p ${port}` : ''} '${user}@${host}'"\nand check to make sure that only the key(s) you wanted were added.\n\n`);
    return 0;
  });

  def(['ssh-keyscan'], async (c) => { const h = c.args.filter((a) => !a.startsWith('-')).pop(); c.out(`${h} ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIED25519hostkeyvirtual\n`); c.err(`# ${h}:22 SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.13\n`); return 0; });
  def(['ssh-agent'], async (c) => { c.out('SSH_AUTH_SOCK=/tmp/ssh-XXXXXXqV3a1B/agent.2481; export SSH_AUTH_SOCK;\nSSH_AGENT_PID=2482; export SSH_AGENT_PID;\necho Agent pid 2482;\n'); return 0; });
  def(['ssh-add'], async (c) => { if (c.args.includes('-l')) { c.out('The agent has no identities.\n'); return 1; } c.err(`Identity added: ${c.args[0] || c.cred.home + '/.ssh/id_ed25519'} (${c.cred.name}@${c.m.hostname()})\n`); return 0; });

  /** user@host:path → { user, host, path } 또는 로컬 */
  function remoteSpec(c, s) {
    const r = /^(?:([^@/:]+)@)?([^:/][^:]*):(.*)$/.exec(s);
    if (!r || /^\//.test(s)) return null;
    const tg = sshTarget(c, (r[1] ? r[1] + '@' : '') + r[2]);   // ~/.ssh/config 별칭 반영
    return { user: tg.user, host: tg.host, path: r[3] || '.', port: tg.port, identity: tg.identity };
  }

  def(['scp', 'sftp'], async (c) => {
    if (c.name === 'sftp') { c.err('\x1b[2m(가상 터미널: 대화형 sftp 는 지원하지 않습니다. scp 를 사용하세요)\x1b[0m\n'); return 1; }
    const args = c.args.slice();
    let port = 22, rec = false;
    const ops = [];
    for (let i = 0; i < args.length; i++) { if (args[i] === '-P') port = +args[++i]; else if (args[i] === '-r') rec = true; else if (/^-[pqvC346]+$/.test(args[i])) continue; else if (args[i] === '-i' || args[i] === '-o' || args[i] === '-F' || args[i] === '-J' || args[i] === '-l' || args[i] === '-c' || args[i] === '-S') i++; else ops.push(args[i]); }
    if (ops.length < 2) { c.err('usage: scp [-346ABCOpqRrsTv] [-c cipher] [-D sftp_server_path] [-F ssh_config]\n           [-i identity_file] [-J destination] [-l limit] [-o ssh_option]\n           [-P port] [-S program] [-X sftp_option] source ... target\n'); return 1; }
    const dst = ops.pop();
    const rd = remoteSpec(c, dst);
    const srcs = ops.map((s) => ({ s, r: remoteSpec(c, s) }));
    const remote = rd || (srcs.find((x) => x.r) || {}).r;
    if (!remote) return LX.commands.cp(Object.assign({}, c, { args: (rec ? ['-r'] : []).concat(ops, dst) }));
    const res = await sshLogin(c, remote.user, remote.host, port, {});
    if (!res.cred) return 1;
    const rcred = res.cred;
    const rhomeAbs = (p) => LX.path.normalize(rcred.home, p.replace(/^~\/?/, ''));
    for (const { s, r } of srcs) {
      const fromAbs = r ? rhomeAbs(r.path) : c.resolve(s);
      const fromCred = r ? rcred : c.cred;
      const toCred = rd ? rcred : c.cred;
      let toAbs = rd ? rhomeAbs(rd.path) : c.resolve(dst);
      const tn = c.fs.lookup(toAbs);
      if (tn && tn.t === 'd') toAbs = toAbs.replace(/\/$/, '') + '/' + P().basename(fromAbs);
      try {
        const n = c.fs.stat(fromAbs, fromCred);
        if (n.t === 'd') {
          if (!rec) { c.err(`scp: ${r ? '' : 'local '}"${s}" is not a regular file\nscp: failed to upload directory ${s} to ${dst}\n`); continue; }
          c.fs.mkdir(toAbs, toCred, { parents: true });
          c.fs.each(fromAbs, fromCred, (p, node) => {
            const rel = p.slice(fromAbs.length);
            if (!rel) return;
            const t = toAbs + rel;
            if (node.t === 'd') c.fs.mkdir(t, toCred, { parents: true });
            else if (node.t === 'f') { c.fs.writeFile(t, c.fs.readFile(p, fromCred), toCred, { mode: node.m }); c.out(`${P().basename(p).padEnd(40)} 100% ${String(c.fs.size(node)).padStart(5)}   ${(c.fs.size(node) / 1024 / 0.02).toFixed(1)}KB/s   00:00    \n`); }
          });
          continue;
        }
        const data = c.fs.readFile(fromAbs, fromCred);
        c.fs.writeFile(toAbs, data, toCred, { mode: n.m & 0o777 });
        c.out(`${P().basename(fromAbs).padEnd(40)} 100% ${String(LX.byteLen(data)).padStart(5)}   ${(LX.byteLen(data) / 1024 / 0.01).toFixed(1)}KB/s   00:00    \n`);
      } catch (e) {
        c.err(`scp: ${e.code === 'ENOENT' ? `stat remote: ${e.message}` : `dest open "${toAbs}": ${e.message}`}\nscp: failed to ${rd ? 'upload' : 'download'} file ${s} to ${dst}\n`);
      }
    }
    return 0;
  });

  def('rsync', async (c) => {
    const args = c.args.slice();
    let flags = '';
    let del = false, dry = false, excludes = [];
    const ops = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (/^-[a-zA-Z]+$/.test(a)) flags += a.slice(1);
      else if (a === '--delete') del = true;
      else if (a === '--dry-run') dry = true;
      else if (a.startsWith('--exclude=')) excludes.push(LX.glob.globToRe(a.slice(10).replace(/\/$/, ''), false));
      else if (a === '--exclude') excludes.push(LX.glob.globToRe(args[++i].replace(/\/$/, ''), false));
      else if (a === '-e' || a === '--rsh' || a === '--bwlimit' || a === '--timeout' || a === '--log-file' || a === '--files-from' || a === '--exclude-from' || a === '--include' || a === '--max-size' || a === '--min-size') i++;
      else if (a === '--progress' || a === '--stats' || a === '-P' || a.startsWith('--')) { if (a === '--version') { c.out('rsync  version 3.2.7  protocol version 31\n'); return 0; } }
      else ops.push(a);
    }
    if (flags.includes('n')) dry = true;
    const verbose = flags.includes('v');
    const human = flags.includes('h');
    if (ops.length < 2) { c.err('rsync  version 3.2.7  protocol version 31\nUsage: rsync [OPTION]... SRC [SRC]... DEST\n'); return 1; }
    const dst = ops.pop();
    const rd = remoteSpec(c, dst);
    let dcred = c.cred;
    let dstAbs = c.resolve(dst);
    const rs = ops.map((s) => remoteSpec(c, s)).find(Boolean);
    let scred = c.cred;
    if (rd || rs) {
      const t = rd || rs;
      const res = await sshLogin(c, t.user, t.host, 22, {});
      if (!res.cred) { c.err('rsync: connection unexpectedly closed (0 bytes received so far) [sender]\nrsync error: unexplained error (code 255) at io.c(232) [sender=3.2.7]\n'); return 255; }
      if (rd) { dcred = res.cred; dstAbs = LX.path.normalize(res.cred.home, rd.path.replace(/^~\/?/, '')); }
      else scred = res.cred;
    }
    const recursive = flags.includes('a') || flags.includes('r');
    let sent = 0, total = 0;
    const lines = [];
    const copied = new Set();
    for (const s0 of ops) {
      const r = remoteSpec(c, s0);
      const s = r ? r.path : s0;
      const srcAbs = r ? LX.path.normalize(scred.home, s.replace(/^~\/?/, '')) : c.resolve(s);
      const n = c.fs.lookup(srcAbs);
      if (!n) { c.err(`rsync: [sender] link_stat "${srcAbs}" failed: No such file or directory (2)\n`); continue; }
      const contents = /\/$/.test(s) && n.t === 'd';
      const base = contents ? dstAbs : (c.fs.lookup(dstAbs) && c.fs.lookup(dstAbs).t === 'd') || ops.length > 1 || n.t === 'd' ? dstAbs.replace(/\/$/, '') + '/' + P().basename(srcAbs) : dstAbs;
      if (n.t === 'd' && !recursive) { lines.push(`skipping directory ${P().basename(srcAbs)}`); continue; }
      if (!dry) c.fs.mkdir(n.t === 'd' ? base : P().dirname(base), dcred, { parents: true });
      if (contents || n.t === 'd') lines.push(contents ? './' : P().basename(srcAbs) + '/');
      c.fs.each(srcAbs, scred, (p, node) => {
        const rel = p.slice(srcAbs.length).replace(/^\//, '');
        if (rel && excludes.some((re) => re.test(P().basename(p)) || re.test(rel))) return false;
        const t = rel ? base + '/' + rel : base;
        copied.add(t);
        if (node.t === 'd') { if (rel) { lines.push((contents ? '' : P().basename(srcAbs) + '/') + rel + '/'); if (!dry) c.fs.mkdir(t, dcred, { parents: true }); } return true; }
        if (node.t !== 'f') return true;
        const data = c.fs.readFile(p, scred);
        total += LX.byteLen(data);
        const ex = c.fs.lookup(t);
        if (ex && ex.t === 'f' && ex.c === data && (flags.includes('a') ? ex.mt >= node.mt : true)) return true;
        sent += LX.byteLen(data);
        lines.push(rel ? (contents ? '' : P().basename(srcAbs) + '/') + rel : P().basename(p));
        if (!dry) {
          c.fs.writeFile(t, data, dcred, { mode: node.m });
          const nn = c.fs.lookup(t);
          if (flags.includes('a') || flags.includes('p')) { nn.m = node.m; nn.mt = node.mt; }
        }
        return true;
      });
      if (del && n.t === 'd' && c.fs.lookup(base)) {
        const dels = [];
        c.fs.each(base, dcred, (p, node) => { if (p !== base && !copied.has(p)) { dels.push(`deleting ${p.slice(base.length + 1)}${node.t === 'd' ? '/' : ''}`); if (!dry) { try { c.fs.remove(p, dcred); } catch (e) { /* 무시 */ } } return false; } return true; });
        // rsync 는 삭제 목록을 파일 목록 앞에 보여 준다
        const at = lines.indexOf(contents ? './' : P().basename(srcAbs) + '/');
        lines.splice(at >= 0 ? at + 1 : lines.length, 0, ...dels);
      }
    }
    const fmt = (n) => (human ? LX.human(n).replace(/([KMG])$/, '$1') : n.toLocaleString('en-US'));
    if (verbose) {
      c.out((flags.includes('v') ? 'sending incremental file list\n' : '') + lines.join('\n') + (lines.length ? '\n' : '') + `\nsent ${fmt(sent + 120)} bytes  received ${fmt(38 + lines.length * 2)} bytes  ${fmt(Math.round((sent + 158) / 0.5))}.${'00'} bytes/sec\ntotal size is ${fmt(total)}  speedup is ${(total / Math.max(1, sent + 158)).toFixed(2)}${dry ? ' (DRY RUN)' : ''}\n`);
    }
    return 0;
  });

  // ======================================================================= nc · telnet · nmap
  def(['nc', 'netcat', 'ncat'], async (c) => {
    const { f, ops } = getopt(c.args, 'zvlnuw:p:k', {});
    if (f.l) {
      const port = +(f.p || ops[0]);
      if (!port) { c.err('nc: missing port with option -l\n'); return 1; }
      if (c.cred.uid !== 0 && port < 1024) { c.err('nc: Permission denied\n'); return 1; }
      if (LX.ports(c.m).some((p) => p.port === port && p.proto === 'tcp')) { c.err('nc: Address already in use\n'); return 1; }
      if (c.session.headless) return 0;
      c.m.runtime = c.m.runtime || { servers: {} };
      c.m.runtime.servers[port] = { proc: 'nc', pid: c.proc ? c.proc.pid : c.m.nextPid(), handle: async (req) => { c.out(`${req.method} ${req.path} HTTP/1.1\r\nHost: ${req.host}:${req.port}\r\nUser-Agent: curl/8.5.0\r\nAccept: */*\r\n\r\n`); return { status: 200, headers: {}, body: '' }; } };
      try { for (;;) await c.sleep(1000); } finally { delete c.m.runtime.servers[port]; }
    }
    const host = ops[0], portSpec = ops[1];
    if (!host || !portSpec) { c.err('usage: nc [-46CDdFhklNnrStUuvZz] [-I length] [-i interval] [-M ttl]\n\t  [-m minttl] [-O length] [-P proxy_username] [-p source_port]\n\t  [-q seconds] [-s sourceaddr] [-T keyword] [-V rtable] [-W recvlimit]\n\t  [-w timeout] [-X proxy_protocol] [-x proxy_address[:port]]\n\t  [destination] [port]\n'); return 1; }
    const [a, b] = portSpec.split('-').map(Number);
    let st = 1;
    const svcName = (p) => ({ 22: 'ssh', 80: 'http', 443: 'https', 3306: 'mysql', 5432: 'postgresql', 21: 'ftp', 25: 'smtp', 53: 'domain', 6379: '*', 8080: 'http-alt' }[p] || '*');
    for (let p = a; p <= (b || a); p++) {
      const conn = tcpConnect(c, host, p);
      const r = LX.resolveHost(c.m, host);
      const label = `${host}${r && r.ip !== host ? ` (${r.ip})` : ''}`;
      if (conn.ok || (conn.ext && conn.extOk)) { st = 0; if (f.v || f.z) c.err(`Connection to ${label} ${p} port [tcp/${svcName(p)}] succeeded!\n`); if (!f.z && conn.listener && conn.listener.svc === 'ssh') c.out('SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.13\r\n'); }
      else if (f.v) {
        if (conn.err === 'timeout') { await c.sleep(c.session.headless ? 0 : 2000); c.err(`nc: connect to ${label} port ${p} (tcp) timed out: Operation now in progress\n`); }
        else if (conn.err === 'resolve') { c.err(`nc: getaddrinfo for host "${host}" port ${p}: Name or service not known\n`); return 1; }
        else c.err(`nc: connect to ${label} port ${p} (tcp) failed: Connection refused\n`);
      }
    }
    return st;
  });

  def('telnet', async (c) => {
    const [host, port = '23'] = c.args.filter((a) => !a.startsWith('-'));
    if (!host) { c.out('telnet> \x1b[2m(가상 터미널: telnet 호스트 포트 형식으로 입력하세요)\x1b[0m\n'); return 1; }
    const r = LX.resolveHost(c.m, host);
    if (!r) { c.err(`telnet: could not resolve ${host}/${port}: Name or service not known\n`); return 1; }
    c.out(`Trying ${r.ip}...\n`);
    const conn = tcpConnect(c, host, +port);
    if (!conn.ok) {
      if (conn.err === 'timeout') { await c.sleep(c.session.headless ? 0 : 3000); c.err(`telnet: Unable to connect to remote host: Connection timed out\n`); }
      else c.err('telnet: Unable to connect to remote host: Connection refused\n');
      return 1;
    }
    c.out(`Connected to ${host}.\nEscape character is '^]'.\n`);
    if (conn.listener && conn.listener.svc === 'ssh') c.out('SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.13\n');
    if (conn.listener && /mysql|mariadb/.test(conn.listener.svc)) c.out('J\n8.0.43-0ubuntu0.24.04.1\x00...\n');
    c.out('Connection closed by foreign host.\n');
    return 1;
  });

  def('nmap', async (c) => {
    const ops = c.args.filter((a) => !a.startsWith('-'));
    const host = ops[ops.length - 1];
    if (!host) { c.out('Nmap 7.94SVN ( https://nmap.org )\nUsage: nmap [Scan Type(s)] [Options] {target specification}\n'); return 0; }
    const r = LX.resolveHost(c.m, host);
    const now = LX.strftime(c.m, '%Y-%m-%d %H:%M %Z', c.m.now());
    c.out(`Starting Nmap 7.94SVN ( https://nmap.org ) at ${now}\n`);
    if (!r) { c.out(`Failed to resolve "${host}".\nWARNING: No targets were specified, so 0 hosts scanned.\nNmap done: 0 IP addresses (0 hosts up) scanned in 0.02 seconds\n`); return 0; }
    await c.sleep(c.session.headless ? 0 : 800);
    const outside = !!c.sh.fromOutside;
    const common = [21, 22, 25, 53, 80, 110, 139, 143, 443, 445, 3306, 3389, 5432, 6379, 8080, 9090, 9100];
    const open = [];
    const filtered = [];
    const listening = LX.ports(c.m).filter((p) => p.proto === 'tcp');
    const portsToCheck = [...new Set(common.concat(listening.map((p) => p.port)))].sort((a, b) => a - b);
    for (const p of portsToCheck) {
      const conn = tcpConnect(c, host, p);
      if (conn.ok) open.push(p);
      else if (outside && conn.err === 'timeout' && conn.fw) filtered.push(p);
    }
    const nm = { 21: 'ftp', 22: 'ssh', 25: 'smtp', 53: 'domain', 80: 'http', 139: 'netbios-ssn', 443: 'https', 445: 'microsoft-ds', 3306: 'mysql', 5432: 'postgresql', 6379: 'redis', 8080: 'http-proxy', 9090: 'zeus-admin', 9100: 'jetdirect' };
    c.out(`Nmap scan report for ${host}${r.ip !== host ? ` (${r.ip})` : ''}\nHost is up (0.000${outside ? 42 : 11}s latency).\n${host === 'localhost' ? 'Other addresses for localhost (not scanned): ::1\n' : ''}`);
    if (outside && c.m.state.ufw.enabled) c.out(`Not shown: ${1000 - open.length - Math.min(filtered.length, 5)} filtered tcp ports (no-response)\n`);
    else c.out(`Not shown: ${1000 - open.length} closed tcp ports (reset)\n`);
    const rows = open.map((p) => [p, 'open']).concat(outside ? [] : []);
    if (rows.length) c.out('PORT     STATE SERVICE\n' + rows.map(([p, s]) => `${(p + '/tcp').padEnd(8)} ${s.padEnd(5)} ${nm[p] || 'unknown'}`).join('\n') + '\n');
    c.out(`\nNmap done: 1 IP address (1 host up) scanned in ${outside ? '4.87' : '0.05'} seconds\n`);
    return 0;
  });

  // ======================================================================= openssl
  def('openssl', async (c) => {
    const [sub, ...rest] = c.args;
    const opt = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
    switch (sub) {
      case 'version': c.out('OpenSSL 3.0.13 30 Jan 2024 (Library: OpenSSL 3.0.13 30 Jan 2024)\n'); return 0;
      case 'rand': {
        const n = +rest.filter((a) => /^\d+$/.test(a))[0] || 16;
        const bytes = Array.from({ length: n }, () => Math.floor(Math.random() * 256));
        if (rest.includes('-hex')) c.out(bytes.map((b) => b.toString(16).padStart(2, '0')).join('') + '\n');
        else { const s = btoa(String.fromCharCode(...bytes)); c.out(s + '\n'); }
        return 0;
      }
      case 'passwd': { const pw = rest.filter((a) => !a.startsWith('-')).pop() || ''; c.out((rest.includes('-6') ? '$6$' + Math.random().toString(36).slice(2, 18) + '$' : '$1$abcdefgh$') + LX.fakeHash(pw, 86).replace(/[^a-zA-Z0-9]/g, '.') + '\n'); return 0; }
      case 'dgst': case 'sha256': case 'md5': { const f = rest.filter((a) => !a.startsWith('-')).pop(); try { const t = c.fs.readFile(c.resolve(f), c.cred); c.out(`SHA2-256(${f})= ${LX.fakeHash(t, 64)}\n`); } catch (e) { c.err(`Could not open file or uri for loading file from ${f}\n`); return 1; } return 0; }
      case 'genrsa': case 'genpkey': { const out = opt('-out'); const key = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7(가상 개인 키)\n-----END PRIVATE KEY-----\n'; if (out) { try { c.fs.writeFile(c.resolve(out), key, c.cred, { mode: 0o600 }); } catch (e) { c.err(`${out}: ${e.message}\n`); return 1; } } else c.out(key); return 0; }
      case 'req': {
        const keyout = opt('-keyout'), out = opt('-out');
        let subj = opt('-subj');
        if (!subj) {
          c.out('You are about to be asked to enter information that will be incorporated\ninto your certificate request.\nWhat you are about to enter is what is called a Distinguished Name or a DN.\nThere are quite a few fields but you can leave some blank\nFor some fields there will be a default value,\nIf you enter \'.\', the field will be left blank.\n-----\n');
          const q = async (p, d) => (await c.readLine(p, { tty: true, answer: '' })) || d;
          const C = await q('Country Name (2 letter code) [AU]:', 'AU'); const ST = await q('State or Province Name (full name) [Some-State]:', 'Some-State'); await q('Locality Name (eg, city) []:', ''); const O = await q('Organization Name (eg, company) [Internet Widgits Pty Ltd]:', 'Internet Widgits Pty Ltd'); await q('Organizational Unit Name (eg, section) []:', ''); const CN = await q('Common Name (e.g. server FQDN or YOUR name) []:', c.m.hostname()); await q('Email Address []:', '');
          subj = `/C=${C}/ST=${ST}/O=${O}/CN=${CN}`;
        }
        try {
          if (rest.includes('-newkey') && keyout) { c.out('.....+++++\n..........+++++\n-----\n'); c.fs.writeFile(c.resolve(keyout), '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC(가상 개인 키)\n-----END PRIVATE KEY-----\n', c.cred, { mode: 0o600 }); c.fs.lookup(c.resolve(keyout)).m = 0o600; }
          const days = +(opt('-days') || 30);
          const cert = `-----BEGIN CERTIFICATE-----\nMIIDazCCAlOgAwIBAgIUQ3(가상 인증서)\nsubject=${subj}\nnotAfter=${new Date(c.m.now() + days * 864e5).toUTCString()}\n-----END CERTIFICATE-----\n`;
          if (out) c.fs.writeFile(c.resolve(out), cert, c.cred, { mode: 0o644 }); else c.out(cert);
        } catch (e) { c.err(`${e.message}\n`); return 1; }
        return 0;
      }
      case 'x509': {
        const f = opt('-in');
        let t = '';
        try { t = c.fs.readFile(c.resolve(f), c.cred); } catch (e) { c.err(`Could not open file or uri for loading certificate from ${f}\n`); return 1; }
        const subj = (/subject=(.*)/.exec(t) || [])[1] || '/CN=' + c.m.hostname();
        const na = (/notAfter=(.*)/.exec(t) || [])[1] || new Date(c.m.now() + 90 * 864e5).toUTCString();
        const fmtD = (d) => { const x = new Date(d); return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][x.getUTCMonth()]} ${String(x.getUTCDate()).padStart(2)} ${pad2(x.getUTCHours())}:${pad2(x.getUTCMinutes())}:${pad2(x.getUTCSeconds())} ${x.getUTCFullYear()} GMT`; };
        if (rest.includes('-subject')) c.out(`subject=${subj.replace(/^\//, '').split('/').join(', ').replace(/=/g, ' = ')}\n`);
        if (rest.includes('-dates')) c.out(`notBefore=${fmtD(c.m.now())}\nnotAfter=${fmtD(na)}\n`);
        if (rest.includes('-enddate')) c.out(`notAfter=${fmtD(na)}\n`);
        if (rest.includes('-text')) c.out(`Certificate:\n    Data:\n        Version: 3 (0x2)\n        Signature Algorithm: sha256WithRSAEncryption\n        Issuer: ${subj.replace(/^\//, '').split('/').join(', ')}\n        Validity\n            Not Before: ${fmtD(c.m.now())}\n            Not After : ${fmtD(na)}\n        Subject: ${subj.replace(/^\//, '').split('/').join(', ')}\n        Subject Public Key Info:\n            Public Key Algorithm: rsaEncryption\n                Public-Key: (2048 bit)\n`);
        return 0;
      }
      case 's_client': { const t = opt('-connect') || ''; const [h, p = '443'] = t.split(':'); const conn = tcpConnect(c, h, +p); if (!conn.ok && !(conn.ext && conn.extOk)) { c.err(`4087D8E1B77F0000:error:8000006F:system library:BIO_connect:Connection refused:../crypto/bio/bio_sock2.c:114:calling connect()\nconnect:errno=111\n`); return 1; } c.out(`CONNECTED(00000003)\ndepth=2 C = US, O = Internet Security Research Group, CN = ISRG Root X1\nverify return:1\n---\nCertificate chain\n 0 s:CN = ${h}\n   i:C = US, O = Let's Encrypt, CN = R11\n---\nSSL handshake has read 4234 bytes and written 392 bytes\nVerification: OK\n---\nNew, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384\n`); return 0; }
      default: c.err(`Invalid command '${sub || ''}'; type "help" for a list.\n`); return 1;
    }
  });

  // ======================================================================= 실습용 외부 PC
  def('labclient', async (c) => {
    const args = c.args.slice();
    if (!args.length || args[0] === '--help' || args[0] === '-h') {
      c.out(`labclient - (실습용) 같은 네트워크의 다른 PC(${OUTSIDE_IP})에서 이 서버로 접속해 보는 명령\n\n사용법: labclient 명령 [인자...]\n  labclient curl http://${VM_IP()}          # 외부에서 웹 서버 접속\n  labclient ssh student@${VM_IP()}          # 외부에서 SSH 접속\n  labclient nc -zv ${VM_IP()} 22            # 외부에서 포트 열림 확인\n  labclient nmap ${VM_IP()}                 # 외부에서 포트 스캔\n\n방화벽(ufw) · 서비스 수신 주소(bind-address) · fail2ban 차단이 모두 적용됩니다.\n실제 환경에서는 다른 PC(또는 호스트 PC)의 터미널에서 같은 명령을 실행하면 됩니다.\n`);
      return 0;
    }
    const allowed = ['curl', 'wget', 'ssh', 'nc', 'netcat', 'nmap', 'ping', 'telnet', 'mysql', 'psql', 'redis-cli', 'scp', 'ssh-copy-id'];
    if (!allowed.includes(args[0])) { c.err(`labclient: '${args[0]}' 은(는) 외부 PC 실습에서 지원하지 않습니다. (${allowed.join(', ')})\n`); return 2; }
    const child = c.sh.child('sub');
    child.fromOutside = true;
    child.user = c.m.defaultUser;
    child.cred = c.m.credFor(c.m.defaultUser);
    c.err(`\x1b[2m[labclient ${OUTSIDE_IP}]$ ${args.map((a) => (/[\s"'$`\\|&;<>()*?]/.test(a) ? "'" + a.replace(/'/g, "'\\''") + "'" : a)).join(' ')}\x1b[0m\n`);
    if (args[0] === 'ping') { const t = pingTarget(child.ctx(args, c.io), args[args.length - 1]); if (t && !t.local && (!internetDown(c.m))) { /* 그대로 */ } }
    return child.invoke(args, c.io);
  });
})(typeof window !== 'undefined' ? window : globalThis);

