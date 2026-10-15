
/* 가상 리눅스 — 시스템 관리 명령 (systemctl · journalctl · apt · dpkg · snap · 디스크 · LVM · cron · 재부팅) */
(function (G) {
  const LX = G.LX = G.LX || {};
  const def = LX.def;
  const P = () => LX.path;
  const getopt = (...a) => LX.getopt(...a);
  const pad2 = (n) => String(n).padStart(2, '0');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const GREEN = '\x1b[0;1;32m', RED = '\x1b[0;1;31m', RST = '\x1b[0m', BOLD = '\x1b[0;1;39m';
  function ago(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    if (s < 60) return `${s}s ago`;
    const mi = Math.floor(s / 60);
    if (mi < 60) return `${mi}min ${s % 60}s ago`;
    const h = Math.floor(mi / 60);
    if (h < 24) return `${h}h ${mi % 60}min ago`;
    return `${Math.floor(h / 24)} days ago`;
  }
  function jTime(m, t) { const d = LX.localDate(m, t); return `${MON[d.getUTCMonth()]} ${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`; }

  // ======================================================================= systemctl
  function unitKnown(m, name) { const d = LX.serviceDef(m, name); if (d) return !d.unit || !!d.custom || !!m.vfs.lookup(d.unit); return !!m.state.services[name]; }
  function statusText(c, name) {
    const m = c.m;
    const s = m.state.services[name] || { active: false, enabled: false };
    const def = LX.serviceDef(m, name) || { desc: name };
    const active = s.active;
    const failed = !active && s.failed;
    const dot = c.tty ? (active ? `${GREEN}●${RST}` : failed ? `${RED}×${RST}` : '○') : (active ? '●' : failed ? '×' : '○');
    const unit = def.unit || `/etc/systemd/system/${name}.service`;
    const en = s.masked ? 'masked' : s.enabled ? 'enabled' : 'disabled';
    const since = s.since || m.bootTime;
    const sinceStr = `${LX.strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', since)}; ${ago(m.now() - since)}`;
    let act;
    if (active) act = def.oneshot ? `${c.tty ? GREEN : ''}active (exited)${c.tty ? RST : ''} since ${sinceStr}` : `${c.tty ? GREEN : ''}active (running)${c.tty ? RST : ''} since ${sinceStr}`;
    else if (failed) act = `${c.tty ? RED : ''}failed${c.tty ? RST : ''} (Result: exit-code) since ${sinceStr}`;
    else act = `inactive (dead)${s.since ? ' since ' + sinceStr : ''}`;
    let out = `${dot} ${name}.service - ${def.desc}\n     Loaded: ${s.masked ? 'masked (Reason: Unit ' + name + '.service is masked.)' : `loaded (${unit}; ${en}; preset: enabled)`}\n     Active: ${act}\n`;
    if (s.warnReload) out = `Warning: The unit file, source configuration file or drop-ins of ${name}.service changed on disk. Run 'systemctl daemon-reload' to reload units.\n` + out;
    if (def.doc) out += `       Docs: ${def.doc.split(' ').join('\n             ')}\n`;
    const procs = m.allProcs().filter((p) => p.svc === name);
    if (active && !def.oneshot) {
      const mainPid = procs[0] ? procs[0].pid : s.pid || (def.sys || 0);
      const exe = procs[0] ? P().basename(procs[0].cmd.replace(/^.*?: /, '').split(' ')[0]) : name;
      out += `   Main PID: ${mainPid} (${exe.replace(/:$/, '')})\n      Tasks: ${Math.max(1, procs.length)} (limit: 4613)\n     Memory: ${(def.mem || 0.3) * 40 > 100 ? ((def.mem || 0.3) * 40 / 1024).toFixed(1) + 'G' : ((def.mem || 0.3) * 40).toFixed(1) + 'M'} (peak: ${((def.mem || 0.3) * 44).toFixed(1)}M)\n        CPU: ${20 + (mainPid % 300)}ms\n     CGroup: /system.slice/${name}.service\n`;
      const list = procs.length ? procs : [{ pid: mainPid, cmd: (def.procs && def.procs[0] ? def.procs[0][0] : def.exec) || name }];
      list.forEach((p, i) => { out += `             ${i === list.length - 1 ? '└─' : '├─'}${p.pid} ${/\s/.test(p.cmd) ? `"${p.cmd}"` : p.cmd}\n`; });
    } else if (active && def.oneshot) {
      out += `   Main PID: ${s.pid || 612} (code=exited, status=0/SUCCESS)\n        CPU: 2ms\n`;
    } else if (failed) {
      out += `    Process: ${s.pid || m.nextPid()} ExecStart=${def.exec || '/usr/sbin/' + name} (code=exited, status=1/FAILURE)\n        CPU: 11ms\n`;
    }
    const logs = m.state.journal.filter((j) => j.unit === name || (j.unit === 'systemd[1]' && j.msg.includes(name + '.service'))).slice(-10);
    if (logs.length && (c.cred.uid === 0 || m.inGroup(c.cred.name, 'adm') || m.inGroup(c.cred.name, 'systemd-journal'))) {
      out += '\n' + logs.map((j) => `${jTime(m, j.t)} ${m.hostname()} ${j.unit.includes('[') ? j.unit : j.unit + '[' + (s.pid || 1000) + ']'}: ${j.msg}`).join('\n') + '\n';
    }
    if (failed && s.failMsg) out += `${jTime(m, since)} ${m.hostname()} ${name}[${s.pid || 1}]: ${s.failMsg.split('\n')[0]}\n`;
    return out;
  }

  async function sysAuth(c, verb, unit) {
    if (c.cred.uid === 0) return true;
    const ok = await LX.polkit(c, 'org.freedesktop.systemd1.manage-units', `Authentication is required to ${verb} '${unit}.service'.`);
    if (!ok) { c.err(`Failed to ${verb} ${unit}.service: Access denied\nSee system logs and 'systemctl status ${unit}.service' for details.\n`); }
    return ok;
  }

  // ------------------------------------------------------------ 서비스가 아닌 유닛 (timer · socket · target · mount)
  // [이름, 설명, 실행할 유닛, 다음 실행까지(분), 마지막 실행(부팅 후 분, 없으면 null)]
  const TIMERS = [
    ['apt-daily-upgrade.timer', 'Daily apt upgrade and clean activities', 'apt-daily-upgrade.service', 60 * 21 + 17, null],
    ['apt-daily.timer', 'Daily apt download activities', 'apt-daily.service', 60 * 3 + 12, null],
    ['dpkg-db-backup.timer', 'Daily dpkg database backup timer', 'dpkg-db-backup.service', 60 * 15, null],
    ['e2scrub_all.timer', 'Periodic ext4 Online Metadata Check for All Filesystems', 'e2scrub_all.service', 60 * 24 * 3 + 190, null],
    ['fstrim.timer', 'Discard unused filesystem blocks once a week', 'fstrim.service', 60 * 24 + 902, null],
    ['fwupd-refresh.timer', 'Refresh fwupd metadata regularly', 'fwupd-refresh.service', 60 * 5 + 41, null],
    ['logrotate.timer', 'Daily rotation of log files', 'logrotate.service', 60 * 15, 1],
    ['man-db.timer', 'Daily man-db regeneration', 'man-db.service', 60 * 9 + 33, 1],
    ['motd-news.timer', 'Message of the Day', 'motd-news.service', 60 * 7 + 48, null],
    ['systemd-tmpfiles-clean.timer', 'Daily Cleanup of Temporary Directories', 'systemd-tmpfiles-clean.service', 60 * 23 + 53, null]
  ];
  // [이름, 설명, Listen, 실행할 유닛, 필요한 패키지]
  const SOCKETS = [
    ['dbus.socket', 'D-Bus System Message Bus Socket', '/run/dbus/system_bus_socket', 'dbus.service'],
    ['iscsid.socket', 'Open-iSCSI iscsid Socket', '@ISCSIADM_ABSTRACT_NAMESPACE', 'iscsid.service'],
    ['lvm2-lvmpolld.socket', 'LVM2 poll daemon socket', '/run/lvm/lvmpolld.socket', 'lvm2-lvmpolld.service'],
    ['multipathd.socket', 'multipathd control socket', '@/org/kernel/linux/storage/multipathd', 'multipathd.service'],
    ['snapd.socket', 'Socket activation for snappy daemon', '/run/snapd-snap.socket', 'snapd.service'],
    ['ssh.socket', 'OpenBSD Secure Shell server socket', '[::]:22', 'ssh.service', 'openssh-server'],
    ['syslog.socket', 'Syslog Socket', '/run/systemd/journal/syslog', 'rsyslog.service'],
    ['systemd-fsckd.socket', 'fsck to fsckd communication Socket', '/run/systemd/fsck.progress', 'systemd-fsckd.service'],
    ['systemd-initctl.socket', 'initctl Compatibility Named Pipe', '/run/initctl', 'systemd-initctl.service'],
    ['systemd-journald-dev-log.socket', 'Journal Socket (/dev/log)', '/run/systemd/journal/dev-log', 'systemd-journald.service'],
    ['systemd-journald.socket', 'Journal Socket', '/run/systemd/journal/socket', 'systemd-journald.service'],
    ['systemd-networkd.socket', 'Network Service Netlink Socket', 'route 1361', 'systemd-networkd.service'],
    ['systemd-udevd-control.socket', 'udev Control Socket', '/run/udev/control', 'systemd-udevd.service'],
    ['systemd-udevd-kernel.socket', 'udev Kernel Socket', 'kobject-uevent 1', 'systemd-udevd.service'],
    ['uuidd.socket', 'UUID daemon activation socket', '/run/uuidd/request', 'uuidd.service']
  ];
  const TARGETS = [
    ['basic.target', 'Basic System'], ['cloud-config.target', 'Cloud-config availability'], ['cloud-init.target', 'Cloud-init target'],
    ['cryptsetup.target', 'Local Encrypted Volumes'], ['getty.target', 'Login Prompts'], ['graphical.target', 'Graphical Interface'],
    ['integritysetup.target', 'Local Integrity Protected Volumes'], ['local-fs-pre.target', 'Preparation for Local File Systems'],
    ['local-fs.target', 'Local File Systems'], ['multi-user.target', 'Multi-User System'], ['network-online.target', 'Network is Online'],
    ['network-pre.target', 'Preparation for Network'], ['network.target', 'Network'], ['nss-lookup.target', 'Host and Network Name Lookups'],
    ['paths.target', 'Path Units'], ['remote-fs.target', 'Remote File Systems'], ['slices.target', 'Slice Units'], ['sockets.target', 'Socket Units'],
    ['swap.target', 'Swaps'], ['sysinit.target', 'System Initialization'], ['time-set.target', 'System Time Set'], ['timers.target', 'Timer Units'],
    ['veritysetup.target', 'Local Verity Protected Volumes']
  ];
  const INACTIVE_TARGETS = ['emergency.target', 'rescue.target', 'shutdown.target', 'reboot.target', 'poweroff.target', 'halt.target', 'sleep.target', 'suspend.target', 'hibernate.target', 'final.target', 'umount.target', 'nss-user-lookup.target', 'network-online.target_'];
  const mountUnitName = (dir) => (dir === '/' ? '-.mount' : dir.replace(/^\/+|\/+$/g, '').replace(/-/g, '\\x2d').replace(/\//g, '-') + '.mount');

  /** 이 머신에 있는 서비스 외 유닛 목록 */
  function extraUnits(m) {
    const st = m.state.xunits || {};
    const list = [];
    const add = (u) => { const o = st[u.name]; if (o) Object.assign(u, o); list.push(u); };
    TIMERS.forEach(([name, desc, act, next, last]) => add({ name, type: 'timer', desc, activates: act, next, last, active: true, enabled: true, file: `/usr/lib/systemd/system/${name}` }));
    // 직접 만든 타이머 (/etc/systemd/system/*.timer)
    try {
      for (const f of m.vfs.readdir('/etc/systemd/system', null)) {
        if (!/\.timer$/.test(f)) continue;
        let text = '';
        try { text = m.vfs.readFile('/etc/systemd/system/' + f, null); } catch (e) { continue; }
        const get = (k) => { const r = new RegExp('^' + k + '\\s*=\\s*(.*)$', 'm').exec(text); return r ? r[1].trim() : ''; };
        add({ name: f, type: 'timer', desc: get('Description') || f, activates: get('Unit') || f.replace(/\.timer$/, '.service'), next: calNext(m, get('OnCalendar'), get('OnBootSec') || get('OnUnitActiveSec')), last: null, active: false, enabled: false, custom: true, file: '/etc/systemd/system/' + f });
      }
    } catch (e) { /* 없음 */ }
    SOCKETS.forEach(([name, desc, listen, act, pkg]) => { if (pkg && !LX.installed(m, pkg)) return; add({ name, type: 'socket', desc, listen, activates: act, active: true, enabled: name !== 'systemd-fsckd.socket', file: `/usr/lib/systemd/system/${name}` }); });
    TARGETS.forEach(([name, desc]) => add({ name, type: 'target', desc, active: name !== 'graphical.target' || true, enabled: true, static: true, file: `/usr/lib/systemd/system/${name}` }));
    INACTIVE_TARGETS.filter((n) => !n.endsWith('_')).forEach((name) => add({ name, type: 'target', desc: name.replace('.target', '').replace(/^\w/, (x) => x.toUpperCase()) + ' Mode', active: false, enabled: false, static: true, file: `/usr/lib/systemd/system/${name}` }));
    const sys = [['dev-hugepages.mount', 'Huge Pages File System', '/dev/hugepages', 'hugetlbfs'], ['dev-mqueue.mount', 'POSIX Message Queue File System', '/dev/mqueue', 'mqueue'], ['proc-sys-fs-binfmt_misc.mount', 'Arbitrary Executable File Formats File System', '/proc/sys/fs/binfmt_misc', 'binfmt_misc'], ['run-user-1000.mount', '/run/user/1000', '/run/user/1000', 'tmpfs'], ['sys-fs-fuse-connections.mount', 'FUSE Control File System', '/sys/fs/fuse/connections', 'fusectl'], ['sys-kernel-config.mount', 'Kernel Configuration File System', '/sys/kernel/config', 'configfs'], ['sys-kernel-debug.mount', 'Kernel Debug File System', '/sys/kernel/debug', 'debugfs'], ['sys-kernel-tracing.mount', 'Kernel Trace File System', '/sys/kernel/tracing', 'tracefs']];
    (m.state.mounts || []).forEach((x) => add({ name: mountUnitName(x.dir), type: 'mount', desc: x.dir === '/' ? 'Root Mount' : x.dir, where: x.dir, what: x.dev, active: true, enabled: true, generated: true, file: '/etc/fstab' }));
    sys.forEach(([name, desc, where, what]) => add({ name, type: 'mount', desc, where, what, active: true, enabled: true, static: true, file: `/usr/lib/systemd/system/${name}` }));
    Object.entries(m.state.snaps || {}).forEach(([n, rev]) => { const r = /^\d+$/.test(rev) ? rev : String(1000 + (n.length * 131) % 900); add({ name: `snap-${n}-${r}.mount`, type: 'mount', desc: `Mount unit for ${n}, revision ${r}`, where: `/snap/${n}/${r}`, what: `/var/lib/snapd/snaps/${n}_${r}.snap`, active: true, enabled: true, file: `/etc/systemd/system/snap-${n}-${r}.mount` }); });
    return list;
  }
  LX.extraUnits = extraUnits;
  /** OnCalendar= 의 다음 실행까지 남은 분 (간단히) */
  function calNext(m, cal, sec) {
    const d = LX.localDate(m, m.now());
    const nowMin = d.getUTCHours() * 60 + d.getUTCMinutes();
    cal = String(cal || '').trim();
    if (!cal && sec) { const r = /^(\d+)\s*(s|sec|m|min|h|hour)?/.exec(sec); if (r) { const n = +r[1]; return Math.max(1, Math.round(/^h/.test(r[2] || '') ? n * 60 : /^m/.test(r[2] || '') ? n : n / 60)); } }
    if (/^(minutely)$/.test(cal)) return 1;
    if (/^hourly$/.test(cal)) return 60 - d.getUTCMinutes();
    if (/^(daily|)$/.test(cal)) return 24 * 60 - nowMin;
    if (/^weekly$/.test(cal)) return ((8 - d.getUTCDay()) % 7 || 7) * 24 * 60 - nowMin;
    if (/^monthly$/.test(cal)) return 30 * 24 * 60 - nowMin;
    // *-*-* 03:00:00 · 03:00 · *:0/15 (간단히: 마지막 시:분만 본다)
    const r = /(\*|\d\d?):(\d\d)(?::(\d\d))?\s*$/.exec(cal);
    if (r) {
      const h = r[1] === '*' ? null : +r[1], mi = +r[2];
      if (h == null) { const left = (mi - d.getUTCMinutes() + 60) % 60; return left || 60; }
      let left = h * 60 + mi - nowMin;
      if (left <= 0) left += 24 * 60;
      return left;
    }
    return 24 * 60 - nowMin;
  }
  function findX(m, name) {
    if (!/\.(timer|socket|target|mount|slice|scope|path|swap|device)$/.test(name)) return null;
    return extraUnits(m).find((u) => u.name === name) || null;
  }
  function leftStr(ms) {
    const mi = Math.round(Math.abs(ms) / 60000);
    if (mi < 60) return `${mi}min`;
    const h = Math.floor(mi / 60);
    if (h < 24) return `${h}h ${mi % 60}min`;
    const d = Math.floor(h / 24);
    return `${d} day${d > 1 ? 's' : ''} ${h % 24}h`;
  }
  function xStatus(c, u) {
    const m = c.m;
    const since = m.bootTime + (u.type === 'mount' ? 1000 : u.type === 'socket' ? 2000 : 4000);
    const sinceStr = `${LX.strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', since)}; ${ago(m.now() - since)}`;
    const dot = u.active ? (c.tty ? `${GREEN}●${RST}` : '●') : '○';
    const sub = u.type === 'timer' ? 'waiting' : u.type === 'socket' ? 'listening' : u.type === 'mount' ? 'mounted' : '';
    const load = u.generated ? `loaded (${u.file}; generated)` : u.static ? `loaded (${u.file}; static)` : `loaded (${u.file}; ${u.enabled ? 'enabled' : 'disabled'}; preset: enabled)`;
    let out = `${dot} ${u.name} - ${u.desc}\n     Loaded: ${load}\n     Active: ${u.active ? `${c.tty ? GREEN : ''}active${sub ? ` (${sub})` : ''}${c.tty ? RST : ''} since ${sinceStr}` : 'inactive (dead)'}\n`;
    if (u.type === 'timer' && u.active) {
      const next = m.now() + u.next * 60000;
      out += `    Trigger: ${LX.strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', next)}; ${leftStr(next - m.now())} left\n   Triggers: ● ${u.activates}\n`;
    }
    if (u.type === 'socket') {
      out += `   Triggers: ● ${u.activates}\n     Listen: ${u.listen} (${/^\//.test(u.listen) ? 'Stream' : /^\[|:\d+$/.test(u.listen) ? 'Stream' : 'Netlink'})\n`;
      if (u.active) out += `      Tasks: 0 (limit: 4613)\n     Memory: 8.0K (peak: 256.0K)\n        CPU: 1ms\n     CGroup: /system.slice/${u.name}\n`;
    }
    if (u.type === 'mount') out += `      Where: ${u.where}\n       What: ${u.what}\n${u.generated ? '       Docs: man:fstab(5)\n             man:systemd-fstab-generator(8)\n' : ''}`;
    if (u.type === 'target') out += '       Docs: man:systemd.special(7)\n';
    if (u.active && u.type !== 'mount' && (c.cred.uid === 0 || m.inGroup(c.cred.name, 'adm'))) out += `\n${jTime(m, since)} ${m.hostname()} systemd[1]: ${u.type === 'target' ? 'Reached target' : u.type === 'socket' ? 'Listening on' : 'Started'} ${u.name} - ${u.desc}.\n`;
    return out;
  }
  function xSet(m, name, patch) { m.state.xunits = m.state.xunits || {}; m.state.xunits[name] = Object.assign(m.state.xunits[name] || {}, patch); }
  /** 표 출력 (열 너비는 내용에 맞춘다) */
  function table(rows, rightCols = []) {
    const w = rows[0].map((_, i) => Math.max(...rows.map((r) => String(r[i]).length)));
    return rows.map((r) => r.map((v, i) => (i === r.length - 1 ? String(v) : rightCols.includes(i) ? String(v).padStart(w[i]) : String(v).padEnd(w[i]))).join(' ').replace(/\s+$/, '')).join('\n') + '\n';
  }
  /** systemctl show 속성 */
  function showProps(c, name) {
    const m = c.m;
    const x = findX(m, name);
    const ts = (t) => (t ? LX.strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', t) : '');
    if (x) {
      const since = m.bootTime + 2000;
      return { Id: x.name, Names: x.name, Description: x.desc, LoadState: 'loaded', ActiveState: x.active ? 'active' : 'inactive', SubState: x.active ? (x.type === 'timer' ? 'waiting' : x.type === 'socket' ? 'listening' : x.type === 'mount' ? 'mounted' : 'active') : 'dead', UnitFileState: x.generated ? 'generated' : x.static ? 'static' : x.enabled ? 'enabled' : 'disabled', UnitFilePreset: 'enabled', FragmentPath: x.file, ActiveEnterTimestamp: x.active ? ts(since) : '', Triggers: x.activates || '', Listen: x.listen ? `${x.listen} (Stream)` : '', Where: x.where || '', What: x.what || '', Result: 'success', CanStart: 'yes', CanStop: 'yes' };
    }
    const u = LX.svcName(m, String(name).replace(/\.service$/, ''));
    const s = m.state.services[u] || {};
    const d = LX.serviceDef(m, u) || {};
    const known = unitKnown(m, u);
    const procs = m.allProcs().filter((p) => p.svc === u);
    const pid = s.active && !d.oneshot ? (procs[0] ? procs[0].pid : s.pid || 0) : 0;
    const exec = (d.procs && d.procs[0] ? d.procs[0][0] : d.exec || '').replace(/^.*?: (master process )?/, '');
    return {
      Type: d.oneshot ? 'oneshot' : d.custom ? (d.type || 'simple') : 'notify', Restart: d.restart || (d.custom ? 'no' : 'on-failure'), NotifyAccess: 'none', RestartUSec: '100ms',
      MainPID: String(pid), ControlPID: '0', ExecMainPID: String(pid), ExecMainStatus: '0', Result: s.failed && !s.active ? 'exit-code' : 'success', NRestarts: String(s.restarts || 0),
      ExecStart: exec ? `{ path=${exec.split(' ')[0]} ; argv[]=${exec} ; ignore_errors=no ; start_time=[${ts(s.since)}] ; stop_time=[n/a] ; pid=${pid} ; code=(null) ; status=0/0 }` : '',
      ControlGroup: s.active ? `/system.slice/${u}.service` : '', MemoryCurrent: s.active ? String(Math.round((d.mem || 0.3) * 40 * 1048576)) : '[not set]', TasksCurrent: s.active ? String(Math.max(1, procs.length)) : '[not set]', CPUUsageNSec: s.active ? String((20 + pid % 300) * 1000000) : '[not set]',
      User: d.user || '', WorkingDirectory: d.workdir || '', Id: `${u}.service`, Names: `${u}.service`, Description: d.desc || `${u}.service`,
      LoadState: known ? (s.masked ? 'masked' : 'loaded') : 'not-found', ActiveState: s.active ? 'active' : s.failed ? 'failed' : 'inactive', SubState: s.active ? (d.oneshot ? 'exited' : 'running') : s.failed ? 'failed' : 'dead',
      FragmentPath: known ? (d.unit || '') : '', UnitFileState: !known ? '' : s.masked ? 'masked' : s.enabled ? 'enabled' : 'disabled', UnitFilePreset: 'enabled',
      StateChangeTimestamp: ts(s.since), ActiveEnterTimestamp: s.active ? ts(s.since) : '', ActiveExitTimestamp: '', InactiveExitTimestamp: s.active ? ts(s.since) : '',
      WantedBy: known ? (d.wantedBy || 'multi-user.target') : '', After: known ? 'network.target system.slice sysinit.target basic.target systemd-journald.socket' : '', Requires: known ? 'system.slice sysinit.target' : '',
      CanStart: 'yes', CanStop: 'yes', CanReload: d.custom ? 'no' : 'yes'
    };
  }
  /** list-dependencies 트리 */
  function depTree(c, name, reverse) {
    const m = c.m;
    const tty = c.tty;
    const dot = (on) => (on ? (tty ? `${GREEN}●${RST}` : '●') : (tty ? `${RED}●${RST}` : '○'));
    const svcActive = (n) => { const s = m.state.services[n]; return !!(s && s.active); };
    const wantsMulti = Object.keys(m.state.services).filter((n) => m.state.services[n].enabled && !m.state.services[n].masked && !/^systemd-(journald|udevd|networkd|resolved|timesyncd|logind)$|^dbus$/.test(n)).sort();
    const tree = {
      'default.target': ['multi-user.target'], 'graphical.target': ['multi-user.target'],
      'multi-user.target': wantsMulti.map((n) => n + '.service').concat(['basic.target', 'getty.target', 'remote-fs.target', 'systemd-logind.service']),
      'basic.target': ['-.mount', 'paths.target', 'slices.target', 'sockets.target', 'sysinit.target', 'timers.target'],
      'sysinit.target': ['dev-hugepages.mount', 'dev-mqueue.mount', 'systemd-journald.service', 'systemd-udevd.service', 'systemd-timesyncd.service', 'local-fs.target', 'swap.target', 'cryptsetup.target'],
      'local-fs.target': ['-.mount', 'boot.mount'], 'sockets.target': SOCKETS.filter((s) => !s[4] || LX.installed(m, s[4])).map((s) => s[0]),
      'timers.target': TIMERS.map((t) => t[0]), 'getty.target': ['getty@tty1.service'], 'network.target': ['systemd-networkd.service', 'systemd-resolved.service'],
      'slices.target': ['-.slice', 'system.slice'], 'paths.target': [], 'remote-fs.target': [], 'swap.target': ['swap.img.swap'], 'cryptsetup.target': []
    };
    const isOn = (n) => (/\.service$/.test(n) ? svcActive(n.replace(/\.service$/, '')) || /^getty@|systemd-(udevd|journald|timesyncd|logind)/.test(n) : n.endsWith('.target') ? !INACTIVE_TARGETS.includes(n) : true);
    let root = name;
    let kids = (n) => tree[n] || [];
    if (/\.service$/.test(root) || !/\./.test(root)) {
      if (!/\./.test(root)) root += '.service';
      const base = root.replace(/\.service$/, '');
      const d = LX.serviceDef(m, LX.svcName(m, base));
      if (!reverse) tree[root] = ['system.slice', 'sysinit.target'].concat(d && d.custom ? [] : ['-.mount']).sort();
    }
    if (reverse) {
      const s = m.state.services[LX.svcName(m, root.replace(/\.service$/, ''))];
      const up = /\.service$/.test(root) ? (s && s.enabled ? ['multi-user.target'] : []) : root === 'multi-user.target' ? ['graphical.target'] : root === 'basic.target' ? ['multi-user.target'] : root === 'sysinit.target' ? ['basic.target'] : [];
      const rt = { 'multi-user.target': ['graphical.target'], 'graphical.target': [] };
      kids = (n) => (n === root ? up : rt[n] || []);
    }
    const out = [root];
    const walk = (n, prefix, depth) => {
      const ks = kids(n).slice().sort((a, b) => (a.endsWith('.target') - b.endsWith('.target')) || (a < b ? -1 : a > b ? 1 : 0));
      ks.forEach((k, i) => {
        const last = i === ks.length - 1;
        out.push(`${dot(isOn(k))} ${prefix}${last ? '└─' : '├─'}${k}`);
        if (depth < 6 && (k.endsWith('.target') || reverse)) walk(k, prefix + (last ? '  ' : '│ '), depth + 1);
      });
    };
    walk(root, '', 0);
    return out.join('\n') + '\n';
  }
  LX.systemdVersion = 'systemd 255 (255.4-1ubuntu8.10)\n+PAM +AUDIT +SELINUX +APPARMOR +IMA +SMACK +SECCOMP +GCRYPT -GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 -IDN +IPTC +KMOD +LIBCRYPTSETUP +LIBFDISK +PCRE2 -PWQUALITY +P11KIT +QRENCODE +TPM2 +BZIP2 +LZ4 +XZ +ZLIB +ZSTD -BPF_FRAMEWORK -XKBCOMMON +UTMP +SYSVINIT default-hierarchy=unified\n';

  def('systemctl', async (c) => {
    // 옵션 해석
    const opt = { type: [], state: [], props: [], value: false, all: false, signal: null, legend: true, reverse: false };
    const args = [];
    for (let i = 0; i < c.args.length; i++) {
      const a = c.args[i];
      const val = (k) => (a.startsWith(k + '=') ? a.slice(k.length + 1) : c.args[++i]);
      if (a === '-t' || a === '--type' || a.startsWith('--type=')) opt.type.push(...String(val('--type') || '').split(',').filter(Boolean));
      else if (a === '--state' || a.startsWith('--state=')) opt.state.push(...String(val('--state') || '').split(',').filter(Boolean));
      else if (a === '-p' || a === '--property' || a.startsWith('--property=')) opt.props.push(...String(val('--property') || '').split(',').filter(Boolean));
      else if (a === '-P') { opt.props.push(...String(c.args[++i] || '').split(',').filter(Boolean)); opt.value = true; }
      else if (/^-p./.test(a)) opt.props.push(...a.slice(2).split(','));
      else if (a === '--value') opt.value = true;
      else if (a === '-a' || a === '--all') opt.all = true;
      else if (a === '-s' || a === '--signal' || a.startsWith('--signal=')) opt.signal = val('--signal');
      else if (a.startsWith('--kill-whom=') || a.startsWith('--kill-who=') || a.startsWith('--job-mode=') || a.startsWith('--lines=') || a.startsWith('--output=') || a.startsWith('-n') && a.length > 2) { /* 무시 */ }
      else if (a === '-n' || a === '--lines' || a === '-o' || a === '--output' || a === '--kill-whom') i++;
      else if (a === '--no-legend') opt.legend = false;
      else if (a === '--reverse') opt.reverse = true;
      else if (a === '--version') opt.version = true;
      else if (a === '--failed') opt.state.push('failed');
      else if (/^--(no-pager|quiet|full|plain|now|no-block|system|no-ask-password|force|runtime|no-reload|recursive|show-types)$/.test(a) || a === '-q' || a === '-l' || a === '-f' || a === '-r' || a === '--user') { /* 아래에서 따로 봄 */ }
      else if (a.startsWith('-') && a.length > 1 && !args.length) { c.err(`systemctl: unrecognized option '${a}'\n`); return 1; }
      else args.push(a);
    }
    if (opt.version) { c.out(LX.systemdVersion); return 0; }
    const now = c.args.includes('--now');
    const quiet = c.args.includes('--quiet') || c.args.includes('-q');
    const m = c.m;
    const cmd = args[0] || 'list-units';
    const rawUnits = args.slice(1);
    const xs = rawUnits.map((u) => findX(m, u)).filter(Boolean);
    const xNames = new Set(xs.map((x) => x.name));
    const typeMissing = rawUnits.filter((u) => /\.(timer|socket|target|mount|slice|path|swap)$/.test(u) && !xNames.has(u) && !(u === 'ssh.socket' && false));
    const units = rawUnits.filter((u) => !xNames.has(u) && !typeMissing.includes(u)).map((u) => LX.svcName(m, u));
    const need = () => { if (!units.length && !xs.length) { c.err(`Too few arguments.\n`); return true; } return false; };
    const notFound = (u) => c.err(`Failed to ${cmd} ${u}.service: Unit ${u}.service not found.\n`);
    // 서비스가 아닌 유닛 (timer · socket · target · mount)
    if (typeMissing.length && !/^list-/.test(cmd)) {
      let st = 0;
      for (const u of typeMissing) {
        if (cmd === 'status') { c.err(`Unit ${u} could not be found.\n`); st = 4; }
        else if (cmd === 'is-active' || cmd === 'is-failed') { if (!quiet) c.out('inactive\n'); st = 3; }
        else if (cmd === 'is-enabled') { c.err(`Failed to get unit file state for ${u}: No such file or directory\n`); st = 1; }
        else if (cmd === 'show') { /* 아래에서 */ }
        else { c.err(`Failed to ${cmd} ${u}: Unit ${u} not found.\n`); st = 5; }
      }
      if (!units.length && !xs.length && cmd !== 'show') return st;
    }
    if (xs.length && !/^list-/.test(cmd) && cmd !== 'show') {
      let st = 0;
      for (const x of xs) {
        switch (cmd) {
          case 'status': c.out(xStatus(c, x)); if (!x.active) st = 3; break;
          case 'is-active': if (!quiet) c.out(x.active ? 'active\n' : 'inactive\n'); if (!x.active) st = 3; break;
          case 'is-enabled': if (!quiet) c.out((x.generated ? 'generated' : x.static ? 'static' : x.enabled ? 'enabled' : 'disabled') + '\n'); if (!x.enabled && !x.static) st = 1; break;
          case 'is-failed': c.out(x.active ? 'active\n' : 'inactive\n'); st = 1; break;
          case 'cat': c.out(`# ${x.file}\n[Unit]\nDescription=${x.desc}\n${x.type === 'target' ? 'Documentation=man:systemd.special(7)\n' : ''}${x.type === 'timer' ? `\n[Timer]\nOnCalendar=daily\nRandomizedDelaySec=12h\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n` : x.type === 'socket' ? `\n[Socket]\nListenStream=${x.listen}\n\n[Install]\nWantedBy=sockets.target\n` : x.type === 'mount' ? `\n[Mount]\nWhat=${x.what}\nWhere=${x.where}\n` : ''}`); break;
          case 'start': case 'stop': case 'restart': case 'enable': case 'disable': case 'reload': case 'try-restart': case 'mask': case 'unmask': {
            if (c.cred.uid !== 0 && !(await LX.polkit(c, 'org.freedesktop.systemd1.manage-units', `Authentication is required to ${cmd} '${x.name}'.`))) { c.err(`Failed to ${cmd} ${x.name}: Access denied\n`); return 1; }
            if (x.static && /^(enable|disable)$/.test(cmd)) { c.err(`The unit files have no installation config (WantedBy=, RequiredBy=, UpheldBy=,\nAlso=, or Alias= settings in the [Install] section, and DefaultInstance= for\ntemplate units). This means they are not meant to be enabled or disabled using systemctl.\n`); break; }
            if (cmd === 'start' || cmd === 'restart' || cmd === 'try-restart' || cmd === 'reload') xSet(m, x.name, { active: true });
            if (cmd === 'stop') xSet(m, x.name, { active: false });
            if (cmd === 'enable' || cmd === 'disable') {
              const wants = `/etc/systemd/system/${x.type === 'timer' ? 'timers' : x.type === 'socket' ? 'sockets' : 'multi-user'}.target.wants/${x.name}`;
              if ((cmd === 'enable') !== !!x.enabled && !quiet) c.err(cmd === 'enable' ? `Created symlink ${wants} → ${x.file}.\n` : `Removed "${wants}".\n`);
              xSet(m, x.name, { enabled: cmd === 'enable' });
              if (now) xSet(m, x.name, { active: cmd === 'enable' });
            }
            if (cmd === 'mask' || cmd === 'unmask') { xSet(m, x.name, { masked: cmd === 'mask' }); c.err(cmd === 'mask' ? `Created symlink /etc/systemd/system/${x.name} → /dev/null.\n` : `Removed "/etc/systemd/system/${x.name}".\n`); }
            break;
          }
          case 'kill': if (c.cred.uid !== 0) { c.err(`Failed to kill unit ${x.name}: Access denied\n`); return 1; } break;
          case 'list-dependencies': c.out(depTree(c, x.name, opt.reverse)); break;
          default: c.err(`Unknown command verb '${cmd}'.\n`); return 1;
        }
      }
      if (!units.length) return st;
    }
    switch (cmd) {
      case 'status': {
        if (!units.length) {
          c.out(`● ${m.hostname()}\n    State: running\n    Units: 312 loaded (incl. loaded aliases)\n     Jobs: 0 queued\n   Failed: ${Object.values(m.state.services).filter((s) => s.failed && !s.active).length} units\n    Since: ${LX.strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', m.bootTime)}; ${ago(m.now() - m.bootTime)}\n  systemd: 255.4-1ubuntu8.10\n   CGroup: /\n`);
          return 0;
        }
        let st = 0;
        units.forEach((u, i) => {
          if (!unitKnown(m, u)) { c.err(`Unit ${u}.service could not be found.\n`); st = 4; return; }
          c.out((i ? '\n' : '') + statusText(c, u));
          const s = m.state.services[u];
          if (!s || !s.active) st = st || 3;
        });
        return st;
      }
      case 'start': case 'stop': case 'restart': case 'reload': case 'try-restart': case 'reload-or-restart': {
        if (need()) return 1;
        let st = 0;
        for (const u of units) {
          if (!unitKnown(m, u)) { notFound(u); st = 5; continue; }
          if (!(await sysAuth(c, cmd, u))) return 1;
          if (!m.state.services[u]) m.state.services[u] = { active: false, enabled: false };
          const s = m.state.services[u];
          if (s.masked) { c.err(`Failed to ${cmd} ${u}.service: Unit ${u}.service is masked.\n`); st = 1; continue; }
          if (cmd === 'stop') { LX.svcStop(m, u); continue; }
          if (cmd === 'reload') {
            if (!s.active) { c.err(`Job for ${u}.service failed.\nSee "systemctl status ${u}.service" and "journalctl -xeu ${u}.service" for details.\n`); st = 1; continue; }
            const chk = LX.svcCheck(m, u);
            if (chk && !/Address already in use/.test(chk)) { c.err(`Job for ${u}.service failed because the control process exited with error code.\nSee "systemctl status ${u}.service" and "journalctl -xeu ${u}.service" for details.\n`); LX.log(m, u, chk); st = 1; continue; }
            LX.log(m, 'systemd[1]', `Reloading ${u}.service - ${(LX.serviceDef(m, u) || {}).desc}...`);
            LX.log(m, 'systemd[1]', `Reloaded ${u}.service - ${(LX.serviceDef(m, u) || {}).desc}.`);
            continue;
          }
          if (cmd === 'try-restart' && !s.active) continue;
          if (cmd !== 'start') LX.svcStop(m, u);
          const err = LX.svcStart(m, u);
          if (err) {
            c.err(`Job for ${u}.service failed because the control process exited with error code.\nSee "systemctl status ${u}.service" and "journalctl -xeu ${u}.service" for details.\n`);
            st = 1;
          }
          if (u === 'ufw') { /* ufw 서비스는 규칙을 다시 적용할 뿐 */ }
        }
        return st;
      }
      case 'enable': case 'disable': {
        if (need()) return 1;
        let st = 0;
        for (const u of units) {
          const d = LX.serviceDef(m, u);
          if (!d || !unitKnown(m, u)) { c.err(`Failed to ${cmd} unit: Unit file ${u}.service does not exist.\n`); st = 1; continue; }
          if (c.cred.uid !== 0 && !(await LX.polkit(c, 'org.freedesktop.systemd1.manage-unit-files', 'Authentication is required to manage system service or unit files.'))) { c.err(`Failed to ${cmd} unit: Access denied\n`); return 1; }
          if (!m.state.services[u]) m.state.services[u] = { active: false, enabled: false };
          const s = m.state.services[u];
          const link = `/etc/systemd/system/multi-user.target.wants/${u}.service`;
          if (cmd === 'enable') {
            if (!s.enabled) {
              s.enabled = true;
              try { c.fs.symlink(d.unit, link, null); } catch (e) { /* 이미 있음 */ }
              if (!quiet) c.err(`Created symlink ${link} → ${d.unit}.\n`);
            }
            if (d.custom && !/multi-user|default/.test(d.wantedBy || 'multi-user.target')) { /* 무시 */ }
            if (now) { const e = LX.svcStart(m, u); if (e) { c.err(`Job for ${u}.service failed because the control process exited with error code.\nSee "systemctl status ${u}.service" and "journalctl -xeu ${u}.service" for details.\n`); st = 1; } }
          } else {
            if (s.enabled) {
              s.enabled = false;
              try { c.fs.unlink(link, null); } catch (e) { /* 없음 */ }
              if (!quiet) c.err(`Removed "${link}".\n`);
            }
            if (now) LX.svcStop(m, u);
          }
        }
        return st;
      }
      case 'is-active': { let st = 0; units.forEach((u) => { const s = m.state.services[u]; const v = s && s.active ? 'active' : s && s.failed ? 'failed' : unitKnown(m, u) ? 'inactive' : 'inactive'; if (!quiet) c.out(v + '\n'); if (v !== 'active') st = 3; }); return st; }
      case 'is-enabled': { let st = 0; units.forEach((u) => { const s = m.state.services[u]; const v = !unitKnown(m, u) ? null : s && s.masked ? 'masked' : s && s.enabled ? 'enabled' : 'disabled'; if (v == null) { c.err(`Failed to get unit file state for ${u}.service: No such file or directory\n`); st = 1; return; } if (!quiet) c.out(v + '\n'); if (v !== 'enabled') st = 1; }); return st; }
      case 'is-failed': { let st = 1; units.forEach((u) => { const s = m.state.services[u]; const f = s && !s.active && s.failed; c.out((f ? 'failed' : s && s.active ? 'active' : 'inactive') + '\n'); if (f) st = 0; }); return st; }
      case 'mask': case 'unmask': {
        if (c.cred.uid !== 0) { c.err(`Failed to ${cmd} unit: Access denied\n`); return 1; }
        units.forEach((u) => {
          if (!m.state.services[u]) m.state.services[u] = { active: false, enabled: false };
          m.state.services[u].masked = cmd === 'mask';
          if (cmd === 'mask') { LX.svcStop(m, u); c.err(`Created symlink /etc/systemd/system/${u}.service → /dev/null.\n`); } else c.err(`Removed "/etc/systemd/system/${u}.service".\n`);
        });
        return 0;
      }
      case 'daemon-reload': case 'daemon-reexec': {
        if (c.cred.uid !== 0 && !(await LX.polkit(c, 'org.freedesktop.systemd1.reload-daemon', 'Authentication is required to reload the systemd state.'))) { c.err('Failed to reload daemon: Access denied\n'); return 1; }
        Object.values(m.state.services).forEach((s) => { delete s.warnReload; });
        m.state.unitsLoadedAt = m.now();
        return 0;
      }
      case 'cat': {
        let st = 0;
        units.forEach((u) => { const d = LX.serviceDef(m, u); if (!d || !unitKnown(m, u)) { c.err(`No files found for ${u}.service.\n`); st = 1; return; } c.out(`# ${d.unit}\n${d.text || safe(c, d.unit)}`); });
        return st;
      }
      case 'show': {
        const targets = rawUnits.length ? rawUnits : [null];
        const outs = targets.map((u) => {
          let props;
          if (u == null) props = { Version: '255.4-1ubuntu8.10', Features: LX.systemdVersion.split('\n')[1], Architecture: 'x86-64', Virtualization: 'oracle', Tainted: '', FirmwareTimestampMonotonic: '0', KernelTimestamp: LX.strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', m.bootTime), UserspaceTimestamp: LX.strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', m.bootTime + 2311), NNames: '312', NFailedUnits: String(Object.values(m.state.services).filter((s) => s.failed && !s.active).length), NJobs: '0', DefaultStandardOutput: 'journal', SystemState: 'running', DefaultTarget: 'graphical.target' };
          else if (typeMissing.includes(u)) props = { Id: u, Names: u, LoadState: 'not-found', ActiveState: 'inactive', SubState: 'dead', UnitFileState: '', Description: u };
          else props = showProps(c, u);
          let keys = Object.keys(props);
          if (opt.props.length) keys = opt.props;
          return keys.map((k) => {
            const v = props[k] != null ? props[k] : '';
            if (opt.value) return v;
            if (!opt.props.length && !opt.all && v === '') return null;
            return `${k}=${v}`;
          }).filter((x) => x != null).join('\n') + '\n';
        });
        c.out(outs.join('\n'));
        return 0;
      }
      case 'kill': {
        if (need()) return 1;
        const sigName = String(opt.signal || 'SIGTERM');
        const sig = LX.sigNum ? LX.sigNum(sigName) : 15;
        if (sig == null) { c.err(`Failed to parse signal string ${sigName}.\n`); return 1; }
        let st = 0;
        for (const u of units) {
          if (!unitKnown(m, u)) { c.err(`Failed to kill unit ${u}.service: Unit ${u}.service not loaded.\n`); st = 1; continue; }
          if (!(await sysAuth(c, 'kill', u))) return 1;
          const s = m.state.services[u];
          if (!s || !s.active) { c.err(`Failed to kill unit ${u}.service: No main process to kill\n`); st = 1; continue; }
          const d = LX.serviceDef(m, u) || {};
          const SN = ['', 'HUP', 'INT', 'QUIT', 'ILL', 'TRAP', 'ABRT', 'BUS', 'FPE', 'KILL', 'USR1', 'SEGV', 'USR2', 'PIPE', 'ALRM', 'TERM'];
          if ([1, 10, 12, 18, 19, 20, 28, 0].includes(sig)) { if (sig === 1) LX.log(m, u, 'Reloading configuration (SIGHUP)'); continue; }
          LX.svcStop(m, u);
          if (sig === 9 || sig === 6 || sig === 11) {
            s.failed = true;
            s.failMsg = `Main process exited, code=killed, status=${sig}/${SN[sig] || sig}`;
            LX.log(m, 'systemd[1]', `${u}.service: Main process exited, code=killed, status=${sig}/${SN[sig] || sig}`);
            LX.log(m, 'systemd[1]', `${u}.service: Failed with result 'signal'.`);
            if (/^(always|on-failure|on-abnormal|on-abort)$/.test(d.restart || (d.custom ? 'no' : 'on-failure'))) {
              LX.log(m, 'systemd[1]', `${u}.service: Scheduled restart job, restart counter is at ${(s.restarts || 0) + 1}.`);
              s.restarts = (s.restarts || 0) + 1;
              LX.svcStart(m, u);
            }
          }
        }
        return st;
      }
      case 'list-dependencies': {
        const u = rawUnits[0] || 'default.target';
        if (/\.service$|^[^.]+$/.test(u) && !unitKnown(m, LX.svcName(m, u.replace(/\.service$/, '')))) { c.out(`${u.includes('.') ? u : u + '.service'}\n`); return 0; }
        c.out(depTree(c, /\.service$/.test(u) || u.includes('.') ? u : LX.svcName(m, u) + '.service', opt.reverse));
        return 0;
      }
      case 'list-sockets': {
        const socks = extraUnits(m).filter((x) => x.type === 'socket' && (x.active || opt.all));
        const rows = [['LISTEN', 'UNIT', 'ACTIVATES']].concat(socks.map((x) => [x.listen, x.name, x.activates]).sort((a, b) => (a[0] < b[0] ? -1 : 1)));
        c.out((opt.legend ? table(rows) : table(rows).split('\n').slice(1).join('\n')) + (opt.legend ? `\n${socks.length} sockets listed.\nPass --all to see loaded but inactive sockets, too.\n` : ''));
        return 0;
      }
      case 'list-timers': {
        const timers = extraUnits(m).filter((x) => x.type === 'timer' && (x.active || opt.all));
        const fmt = (t) => LX.strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', t);
        const rows = [['NEXT', 'LEFT', 'LAST', 'PASSED', 'UNIT', 'ACTIVATES']].concat(timers.slice().sort((a, b) => a.next - b.next).map((x) => {
          const next = m.now() + x.next * 60000;
          const last = x.last != null ? m.bootTime + x.last * 60000 : null;
          return [x.active ? fmt(next) : '-', x.active ? leftStr(next - m.now()) : '-', last ? fmt(last) : '-', last ? leftStr(m.now() - last) + ' ago' : '-', x.name, x.activates];
        }));
        const t = table(rows, [1, 3]).split('\n');
        c.out((opt.legend ? t.join('\n') : t.slice(1).join('\n')) + (opt.legend ? `\n${timers.length} timers listed.\nPass --all to see loaded but inactive timers, too.\n` : ''));
        return 0;
      }
      case 'list-units': case 'list-unit-files': case '--failed': {
        const failedOnly = cmd === '--failed' || opt.state.includes('failed');
        const types = opt.type.length ? opt.type.map((t) => t.replace(/^\./, '')) : ['service'];
        const svcType = types.includes('service');
        const xlist = extraUnits(m).filter((x) => types.includes(x.type));
        let names = svcType ? Object.keys(m.state.services).filter((n) => unitKnown(m, n) || m.state.services[n].active).sort() : [];
        if (cmd === 'list-unit-files') {
          const rows = [['UNIT FILE', 'STATE', 'PRESET']];
          names.forEach((n) => rows.push([n + '.service', m.state.services[n].masked ? 'masked' : m.state.services[n].enabled ? 'enabled' : 'disabled', 'enabled']));
          xlist.filter((x) => !(x.type === 'mount' && !x.static && !x.generated) || true).forEach((x) => rows.push([x.name, x.generated ? 'generated' : x.static ? 'static' : x.enabled ? 'enabled' : 'disabled', x.static || x.generated ? '-' : 'enabled']));
          const body = rows.slice(1).filter((r) => !opt.state.length || opt.state.includes(r[1])).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
          const t = table([rows[0]].concat(body));
          c.out((opt.legend ? t : t.split('\n').slice(1).join('\n')) + (opt.legend ? `\n${body.length} unit files listed.\n` : ''));
          return 0;
        }
        const rows = [];
        names.forEach((n) => {
          const s = m.state.services[n];
          const d = LX.serviceDef(m, n) || { desc: n };
          const failed = !s.active && s.failed;
          const active = s.active ? 'active' : failed ? 'failed' : 'inactive';
          const sub = s.active ? (d.oneshot ? 'exited' : 'running') : failed ? 'failed' : 'dead';
          rows.push({ name: n + '.service', load: unitKnown(m, n) ? 'loaded' : 'not-found', active, sub, desc: d.desc || n, failed });
        });
        xlist.forEach((x) => rows.push({ name: x.name, load: 'loaded', active: x.active ? 'active' : 'inactive', sub: x.active ? (x.type === 'timer' ? 'waiting' : x.type === 'socket' ? 'listening' : x.type === 'mount' ? 'mounted' : 'active') : 'dead', desc: x.desc, failed: false }));
        let list = rows;
        if (opt.state.length) list = list.filter((r) => opt.state.some((st) => st === r.active || st === r.sub || st === r.load));
        else if (!opt.all) list = list.filter((r) => r.active !== 'inactive');
        list.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
        const wn = Math.max(4, ...list.map((r) => r.name.length));
        const ws = Math.max(3, ...list.map((r) => r.sub.length));
        const wl = Math.max(4, ...list.map((r) => r.load.length));
        const wa = Math.max(6, ...list.map((r) => r.active.length));
        let out = opt.legend ? `  ${'UNIT'.padEnd(wn)} ${'LOAD'.padEnd(wl)} ${'ACTIVE'.padEnd(wa)} ${'SUB'.padEnd(ws)} DESCRIPTION\n` : '';
        list.forEach((r) => {
          out += `${r.failed ? (c.tty ? RED + '●' + RST : '●') : ' '} ${r.name.padEnd(wn)} ${r.load.padEnd(wl)} ${r.active.padEnd(wa)} ${r.sub.padEnd(ws)} ${r.desc}\n`;
        });
        if (opt.legend) out += `\nLegend: LOAD   → Reflects whether the unit definition was properly loaded.\n        ACTIVE → The high-level unit activation state, i.e. generalization of SUB.\n        SUB    → The low-level unit activation state, values depend on unit type.\n\n${list.length} loaded units listed.${failedOnly || opt.all ? '' : ' Pass --all to see loaded but inactive units, too.'}\nTo show all installed unit files use 'systemctl list-unit-files'.\n`;
        if (failedOnly && opt.legend) out = out.replace(/\nTo show all installed unit files use 'systemctl list-unit-files'.\n$/, '\n');
        c.out(out);
        return 0;
      }
      case 'get-default': c.out('graphical.target\n'); return 0;
      case 'set-default': if (c.cred.uid !== 0) { c.err('Failed to set default target: Access denied\n'); return 1; } c.err(`Removed "/etc/systemd/system/default.target".\nCreated symlink /etc/systemd/system/default.target → /usr/lib/systemd/system/${args[1]}.\n`); return 0;
      case 'reboot': case 'poweroff': case 'halt': case 'suspend':
        return LX.commands.reboot(Object.assign({}, c, { name: cmd === 'reboot' ? 'reboot' : 'poweroff', args: [] }));
      case 'edit': {
        const u = units[0];
        if (c.cred.uid !== 0) { c.err('Failed to edit: Access denied\n'); return 1; }
        const f = c.args.includes('--full') ? (LX.serviceDef(m, u) || {}).unit : `/etc/systemd/system/${u}.service.d/override.conf`;
        c.fs.mkdir(P().dirname(f), null, { parents: true });
        return LX.editFile(c, f, c.cred, { editor: 'nano' });
      }
      default:
        c.err(`Unknown command verb '${cmd}'.\n`);
        return 1;
    }
  });
  function safe(c, f) { try { return c.fs.readFile(f, null); } catch (e) { return ''; } }

  def('service', async (c) => {
    if (c.args[0] === '--status-all') {
      const names = Object.keys(c.m.state.services).filter((n) => !/^systemd-|dbus/.test(n)).sort();
      c.out(names.map((n) => ` [ ${c.m.state.services[n].active ? '+' : '-'} ]  ${n}`).join('\n') + '\n');
      return 0;
    }
    const [name, action] = c.args;
    if (!name || !action) { c.err('Usage: service < option > | --status-all | [ service_name [ command | --full-restart ] ]\n'); return 1; }
    return LX.commands.systemctl(Object.assign({}, c, { args: [action, name] }));
  });

  // ======================================================================= journalctl
  const BOOT_ID = '3c2b9a8e7f6d4c1b0a9e8d7c6b5a4f3e';
  const bootIdOf = (i) => (i === 0 ? BOOT_ID : ((0x8f2c1d0e + i * 7919) >>> 0).toString(16).padStart(8, '0') + '6b7a49c3a1d5e2f3b4c5d6e7').slice(0, 32);
  /** journalctl 시각 인자: today · yesterday · "10 min ago" · -1h · 2026-09-27 08:00 · 08:00 */
  function jParseTime(m, s) {
    s = String(s || '').trim();
    const now = m.now();
    const off = LX.tzOffsetMin(m) * 60000;
    const midnight = (t) => { const d = new Date(t + off); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - off; };
    if (s === 'now') return now;
    if (s === 'today') return midnight(now);
    if (s === 'yesterday') return midnight(now) - 864e5;
    if (s === 'tomorrow') return midnight(now) + 864e5;
    const U = { s: 1e3, sec: 1e3, second: 1e3, seconds: 1e3, m: 6e4, min: 6e4, mins: 6e4, minute: 6e4, minutes: 6e4, h: 36e5, hr: 36e5, hour: 36e5, hours: 36e5, d: 864e5, day: 864e5, days: 864e5, w: 6048e5, week: 6048e5, weeks: 6048e5, month: 2592e6, months: 2592e6, y: 31536e6, year: 31536e6, years: 31536e6 };
    let r = /^(\d+)\s*([a-z]+)\s+ago$/i.exec(s);
    if (r && U[r[2].toLowerCase()]) return now - +r[1] * U[r[2].toLowerCase()];
    r = /^([-+])((?:\d+\s*[a-z]+\s*)+)$/i.exec(s);
    if (r) {
      let ms = 0, ok = true;
      String(r[2]).replace(/(\d+)\s*([a-z]+)/gi, (_, n, u) => { if (U[u.toLowerCase()]) ms += +n * U[u.toLowerCase()]; else ok = false; return ''; });
      if (ok) return r[1] === '-' ? now - ms : now + ms;
    }
    r = /^(\d{4})-(\d\d)-(\d\d)(?:[ T](\d\d):(\d\d)(?::(\d\d))?)?$/.exec(s);
    if (r) return Date.UTC(+r[1], +r[2] - 1, +r[3], +(r[4] || 0), +(r[5] || 0), +(r[6] || 0)) - off;
    r = /^(\d\d?):(\d\d)(?::(\d\d))?$/.exec(s);
    if (r) return midnight(now) + (+r[1] * 3600 + +r[2] * 60 + +(r[3] || 0)) * 1000;
    if (/^@\d+$/.test(s)) return +s.slice(1) * 1000;
    return LX.parseDate ? LX.parseDate(m, s) : null;
  }
  LX.jParseTime = jParseTime;

  /** 저널 항목 모으기: /var/log/syslog + auth.log (+ 우선순위는 m.state.journal 에서) */
  function journalEntries(m) {
    const entries = [];
    const prio = new Map();
    (m.state.journal || []).forEach((j) => { if (j.prio != null) prio.set(j.unit + '\u0000' + j.msg, j.prio); });
    for (const file of ['/var/log/syslog', '/var/log/auth.log']) {
      let text = '';
      try { text = m.vfs.readFile(file, null); } catch (e) { continue; }
      text.split('\n').filter(Boolean).forEach((l, i) => {
        const r = /^(\S+)\s+(\S+)\s+([^:]+):\s?(.*)$/.exec(l);
        if (!r) return;
        const t = Date.parse(r[1]);
        const e = { t: Number.isNaN(t) ? m.bootTime : t, unit: r[3], msg: r[4], seq: i, auth: file.includes('auth') };
        const p = prio.get(e.unit + '\u0000' + e.msg);
        if (p != null) e.prio = p;
        entries.push(e);
      });
    }
    entries.sort((a, b) => a.t - b.t || (a.auth === b.auth ? a.seq - b.seq : a.auth ? 1 : -1));
    return entries;
  }
  const identOf = (e) => e.unit.replace(/\[.*$/, '');
  const pidOf = (e) => { const r = /\[(\d+)\]/.exec(e.unit); return r ? +r[1] : e.unit === 'kernel' ? null : 1000 + (e.unit.length * 37) % 900; };
  function prioOf(e) {
    if (e.prio != null) return e.prio;
    if (e.unit === 'kernel' && /error|fail/i.test(e.msg)) return 3;
    if (/\[emerg\]|emerg/i.test(e.msg)) return 0;
    if (/crit/i.test(e.msg)) return 2;
    if (/fail|error|denied|refused|could not|cannot|unable/i.test(e.msg)) return 3;
    if (/warn|deprecated/i.test(e.msg)) return 4;
    if (/Started|Reached|Stopped|Starting|Stopping/.test(e.msg) && /^systemd/.test(e.unit)) return 6;
    return 6;
  }
  const PRIO_NAMES = ['emerg', 'alert', 'crit', 'err', 'warning', 'notice', 'info', 'debug'];
  function prioArg(s) {
    s = String(s).toLowerCase();
    const one = (x) => (/^\d$/.test(x) ? +x : PRIO_NAMES.indexOf(x === 'error' ? 'err' : x === 'warn' ? 'warning' : x === 'panic' ? 'emerg' : x));
    if (s.includes('..')) { const [a, b] = s.split('..'); return [one(a || 'emerg'), one(b || 'debug')]; }
    const v = one(s);
    return v < 0 ? null : [0, v];
  }
  /** 서비스 이름 → 로그 태그(실행 파일 이름)들 */
  function unitIdents(m, u) {
    const ids = new Set([u]);
    const d = LX.serviceDef(m, u);
    if (d) {
      (d.procs || []).forEach((p) => { const w = String(p[0]).replace(/^.*?: (master process )?/, '').split(' ')[0]; ids.add(P().basename(w)); });
      if (d.exec) ids.add(P().basename(String(d.exec).split(' ')[0]));
    }
    if (u === 'ssh') ids.add('sshd');
    if (u === 'cron') ids.add('CRON');
    if (u === 'rsyslog') ids.add('rsyslogd');
    if (u === 'systemd-journald') ids.add('systemd-journald');
    return ids;
  }

  def('journalctl', async (c) => {
    const { f, ops } = getopt(c.args, 'u:n:fbkrxeap:S:U:qo:t:g:D:m', { unit: 'u:', 'user-unit': 'u:', lines: 'n:', follow: 'f', boot: 'b', dmesg: 'k', reverse: 'r', priority: 'p:', since: 'S:', until: 'U:', 'no-pager': 'np', 'disk-usage': 'du', 'vacuum-size': 'vs:', 'vacuum-time': 'vt:', 'vacuum-files': 'vf:', 'list-boots': 'lb', output: 'o:', identifier: 't:', grep: 'g:', 'no-hostname': 'nh', utc: 'utc', quiet: 'q', catalog: 'x', 'pager-end': 'e', all: 'a', merge: 'm', directory: 'D:', 'case-sensitive': 'cs', 'no-full': 'nf', full: 'full', 'output-fields': 'of:', 'show-cursor': 'sc', system: 'sys', user: 'usr', 'header': 'hd', 'fields': 'fl', 'sync': 'sy', 'flush': 'fu', 'rotate': 'ro', 'verify': 've', 'field': 'F:' });
    const m = c.m;
    // 여러 번 줄 수 있는 옵션 (-u a -u b, -t x -t y, -xeu nginx)
    const multi = (k) => {
      const out = [], long = { u: 'unit', t: 'identifier' }[k];
      for (let i = 0; i < c.args.length; i++) {
        const a = c.args[i];
        if (a === '--') break;
        if (a.startsWith('--')) { if (a === '--' + long) out.push(c.args[++i]); else if (a.startsWith('--' + long + '=')) out.push(a.slice(long.length + 3)); else if (/^--(lines|priority|since|until|output|grep|directory|field)$/.test(a)) i++; continue; }
        if (!a.startsWith('-') || /^-\d/.test(a)) continue;
        for (let j = 1; j < a.length; j++) {
          if ('unpSUotgDF'.includes(a[j])) { const v = a.slice(j + 1) || c.args[++i]; if (a[j] === k) out.push(v); break; }
        }
      }
      return out.filter((x) => x != null);
    };
    if (f.du) { c.out(`Archived and active journals take up ${(24 + m.state.journal.length / 100).toFixed(1)}M in the file system.\n`); return 0; }
    if (f.vs || f.vt || f.vf) { if (c.cred.uid !== 0) { c.err('Failed to open journal directory: Permission denied\n'); return 1; } c.out(`Vacuuming done, freed 0B of archived journals from /var/log/journal/5f1c0d9e2b7a4c6f8e3d1a2b4c6d8e0f.\n`); return 0; }
    if (f.sy || f.fu || f.ro) { if (c.cred.uid !== 0) { c.err('Failed to connect to journald: Permission denied\n'); return 1; } return 0; }
    if (f.ve) { c.out('PASS: /var/log/journal/5f1c0d9e2b7a4c6f8e3d1a2b4c6d8e0f/system.journal\n'); return 0; }
    const bootsList = (m.state.bootHistory || []).concat([m.bootTime]);
    if (f.lb) {
      const fmt = (t) => LX.strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', t);
      let out = 'IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY\n';
      bootsList.forEach((t, i) => {
        const idx = i - (bootsList.length - 1);
        const end = i < bootsList.length - 1 ? bootsList[i + 1] - 5000 : m.now();
        out += `${String(idx).padStart(3)} ${bootIdOf(bootsList.length - 1 - i)} ${fmt(t)} ${fmt(end)}\n`;
      });
      c.out(out);
      return 0;
    }
    if (f.F) { const vals = new Set(journalEntries(m).map((e) => (f.F === 'SYSLOG_IDENTIFIER' ? identOf(e) : f.F === '_SYSTEMD_UNIT' ? identOf(e) + '.service' : f.F === 'PRIORITY' ? String(prioOf(e)) : ''))); c.out([...vals].filter(Boolean).join('\n') + '\n'); return 0; }
    const priv = c.cred.uid === 0 || m.inGroup(c.cred.name, 'adm') || m.inGroup(c.cred.name, 'systemd-journal');
    if (!priv && !f.q) c.err('Hint: You are currently not seeing messages from other users and the system.\n      Users in groups \'adm\', \'systemd-journal\' can see all messages.\n      Pass -q to turn off this notice.\n');
    let entries = priv ? journalEntries(m) : [];
    // -b [N|ID]: 부팅 범위
    if (f.b) {
      const bi = c.args.findIndex((a) => a === '-b' || a === '--boot' || /^-[a-zA-Z]*b$/.test(a));
      let spec = c.args.find((a) => a.startsWith('--boot='));
      spec = spec ? spec.slice(7) : (bi >= 0 && /^(-?\d+|[0-9a-f]{32}|all)$/.test(c.args[bi + 1] || '') ? c.args[bi + 1] : '0');
      if (spec !== 'all') {
        let idx = /^-?\d+$/.test(spec) ? +spec : (bootsList.findIndex((_, i) => bootIdOf(bootsList.length - 1 - i) === spec) - (bootsList.length - 1));
        if (idx > 0) idx = idx - bootsList.length;   // 양수는 처음부터 센 번호
        const i = bootsList.length - 1 + idx;
        if (i < 0 || i >= bootsList.length) { c.err(`Data from the specified boot (${spec}) is not available: No such boot ID in journal\n`); return 1; }
        const from = i === 0 ? -Infinity : bootsList[i] - 1000, to = i === bootsList.length - 1 ? Infinity : bootsList[i + 1] - 1000;
        entries = entries.filter((e) => e.t >= from && e.t < to);
      }
    }
    if (f.k) entries = entries.filter((e) => e.unit === 'kernel');
    const units = multi('u');
    if (units.length) {
      const sets = units.map((u) => { const n = LX.svcName(m, u.replace(/\.service$/, '')); return { n, ids: unitIdents(m, n) }; });
      entries = entries.filter((e) => sets.some(({ n, ids }) => ids.has(identOf(e)) || (/^systemd\[1\]$/.test(e.unit) && e.msg.includes(n + '.service'))));
    }
    const tags = multi('t');
    if (tags.length) entries = entries.filter((e) => tags.includes(identOf(e)));
    // FIELD=값 매치 (_COMM=sudo, _PID=701, SYSLOG_IDENTIFIER=cron, _SYSTEMD_UNIT=ssh.service)
    const matches = ops.filter((o) => /^[A-Z_]+=/.test(o));
    const paths = ops.filter((o) => o.startsWith('/'));
    for (const mt of matches) {
      const [k, v] = mt.split(/=(.*)/s);
      entries = entries.filter((e) => {
        if (k === '_COMM' || k === 'SYSLOG_IDENTIFIER') return identOf(e) === v || identOf(e).slice(0, 15) === v;
        if (k === '_PID' || k === 'SYSLOG_PID') return String(pidOf(e)) === v;
        if (k === '_SYSTEMD_UNIT' || k === 'UNIT') { const n = LX.svcName(m, v.replace(/\.service$/, '')); return unitIdents(m, n).has(identOf(e)); }
        if (k === 'PRIORITY') return String(prioOf(e)) === v;
        if (k === '_HOSTNAME') return v === m.hostname();
        if (k === '_TRANSPORT') return v === (e.unit === 'kernel' ? 'kernel' : 'syslog');
        return false;
      });
    }
    for (const p of paths) { const b = P().basename(p); entries = entries.filter((e) => identOf(e) === b); }
    if (f.p) { const rng = prioArg(f.p); if (!rng) { c.err(`Failed to parse priority value: ${f.p}\n`); return 1; } entries = entries.filter((e) => { const p = prioOf(e); return p >= rng[0] && p <= rng[1]; }); }
    if (f.g) { let re; try { re = new RegExp(f.g, /[A-Z]/.test(f.g) ? '' : 'i'); } catch (e) { c.err(`Failed to compile pattern: ${f.g}\n`); return 1; } entries = entries.filter((e) => re.test(e.msg)); }
    if (f.S) { const t = jParseTime(m, f.S); if (t == null || Number.isNaN(t)) { c.err(`Failed to parse timestamp: ${f.S}\n`); return 1; } entries = entries.filter((e) => e.t >= t); }
    if (f.U) { const t = jParseTime(m, f.U); if (t == null || Number.isNaN(t)) { c.err(`Failed to parse timestamp: ${f.U}\n`); return 1; } entries = entries.filter((e) => e.t <= t); }
    const nArg = f.n === true ? 10 : f.n === 'all' ? null : f.n;
    const n = nArg != null ? +nArg : f.e ? 1000 : f.f ? 10 : null;
    if (n != null && !Number.isNaN(n)) entries = entries.slice(Math.max(0, entries.length - n));
    if (f.r) entries.reverse();
    const mode = String(f.o || 'short');
    const MODES = ['short', 'short-full', 'short-iso', 'short-iso-precise', 'short-precise', 'short-monotonic', 'short-unix', 'short-delta', 'verbose', 'export', 'json', 'json-pretty', 'json-sse', 'json-seq', 'cat', 'with-unit'];
    if (!MODES.includes(mode)) { c.err(`Unknown output format '${mode}'.\n`); return 1; }
    const host = f.nh ? '' : m.hostname() + ' ';
    const usec = (e) => String(Math.floor(e.t * 1000) + (e.seq || 0) % 1000);
    const frac = (e) => String((e.t % 1000) * 1000 + (e.seq || 0) % 1000).padStart(6, '0');
    const tag = (e) => { const p = pidOf(e); return e.unit.includes('[') || e.unit === 'kernel' || p == null ? e.unit : `${e.unit}[${p}]`; };
    const tzOff = () => { const o = LX.tzOffsetMin(m); return `${o >= 0 ? '+' : '-'}${pad2(Math.floor(Math.abs(o) / 60))}:${pad2(Math.abs(o) % 60)}`; };
    const iso = (e) => { const d = LX.localDate(m, e.t); return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`; };
    const fields = (e) => {
      const u = identOf(e);
      const o = { __CURSOR: `s=9a1c2e3f4b5d6e7f8091a2b3c4d5e6f7;i=${(1000 + (e.seq || 0)).toString(16)};b=${BOOT_ID};m=${(Math.max(0, e.t - m.bootTime) * 1000).toString(16)};t=${Number(usec(e)).toString(16)};x=${(e.seq || 0).toString(16).padStart(16, '0')}`, __REALTIME_TIMESTAMP: usec(e), __MONOTONIC_TIMESTAMP: String(Math.max(0, e.t - m.bootTime) * 1000), _BOOT_ID: BOOT_ID, PRIORITY: String(prioOf(e)), SYSLOG_FACILITY: e.unit === 'kernel' ? '0' : e.auth ? '10' : '3', SYSLOG_IDENTIFIER: u, _HOSTNAME: m.hostname(), _TRANSPORT: e.unit === 'kernel' ? 'kernel' : 'syslog' };
      const p = pidOf(e);
      if (p != null) { o._PID = String(p); o.SYSLOG_PID = String(p); o._COMM = u.slice(0, 15); }
      if (u !== 'kernel') {
        const svc = u === 'systemd' ? 'init.scope' : LX.serviceDef(m, LX.svcName(m, u)) ? LX.svcName(m, u) + '.service' : /^(sshd|CRON|cron|sudo|su|login|systemd-logind)$/.test(u) ? null : 'session-1.scope';
        o._UID = svc === 'session-1.scope' ? '1000' : '0';
        if (svc) o._SYSTEMD_UNIT = svc;
      }
      o.MESSAGE = e.msg;
      return o;
    };
    const line = (e) => {
      switch (mode) {
        case 'cat': return e.msg;
        case 'short-iso': return `${iso(e)}${tzOff()} ${host}${tag(e)}: ${e.msg}`;
        case 'short-iso-precise': return `${iso(e)}.${frac(e)}${tzOff()} ${host}${tag(e)}: ${e.msg}`;
        case 'short-precise': return `${jTime(m, e.t)}.${frac(e)} ${host}${tag(e)}: ${e.msg}`;
        case 'short-unix': return `${Math.floor(e.t / 1000)}.${frac(e)} ${host}${tag(e)}: ${e.msg}`;
        case 'short-monotonic': return `[${(Math.max(0, e.t - m.bootTime) / 1000).toFixed(6).padStart(12)}] ${host}${tag(e)}: ${e.msg}`;
        case 'short-full': return `${LX.strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', e.t)} ${host}${tag(e)}: ${e.msg}`;
        case 'with-unit': { const u = identOf(e); return `${jTime(m, e.t)} ${host}${u === 'kernel' ? 'kernel' : u + '.service'}[${pidOf(e) || ''}]: ${e.msg}`; }
        case 'json': case 'json-seq': return (mode === 'json-seq' ? '\x1e' : '') + JSON.stringify(fields(e));
        case 'json-sse': return 'data: ' + JSON.stringify(fields(e)) + '\n';
        case 'json-pretty': { const o = fields(e); return '{\n' + Object.entries(o).map(([k, v]) => `\t"${k}" : ${JSON.stringify(v)}`).join(',\n') + '\n}'; }
        case 'export': return Object.entries(fields(e)).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
        case 'verbose': { const o = fields(e); return `${LX.strftime(m, '%a %Y-%m-%d %H:%M:%S', e.t)}.${frac(e)} ${LX.strftime(m, '%Z', e.t)} [${o.__CURSOR}]\n` + Object.entries(o).filter(([k]) => !k.startsWith('__')).map(([k, v]) => `    ${k}=${v}`).join('\n'); }
        default: return `${jTime(m, e.t)} ${host}${tag(e)}: ${e.msg}`;
      }
    };
    if (!entries.length) { if (!/^json|^export|^cat/.test(mode)) c.out('-- No entries --\n'); }
    else c.out(entries.map(line).join('\n') + '\n');
    if (f.f && !c.session.headless) {
      let seen = m.state.journal.length;
      const ids = units.length ? units.map((u) => unitIdents(m, LX.svcName(m, u))) : null;
      for (;;) {
        await c.sleep(700);
        const j = m.state.journal;
        if (j.length < seen) seen = j.length;
        if (j.length > seen) {
          j.slice(seen).filter((e) => !ids || ids.some((s) => s.has(identOf(e)) || [...s].some((x) => e.msg.includes(x + '.service')))).filter((e) => !tags.length || tags.includes(identOf(e))).forEach((e) => c.out(line(e) + '\n'));
          seen = j.length;
        }
      }
    }
    return 0;
  });

  // ======================================================================= apt
  const REPO = 'http://kr.archive.ubuntu.com/ubuntu';
  const THIRD = {
    'docker-ce': { real: 'docker.io', repo: 'docker', ver: '5:28.4.0-1~ubuntu.24.04~noble', src: 'https://download.docker.com/linux/ubuntu noble/stable' },
    'docker-ce-cli': { real: null, repo: 'docker', ver: '5:28.4.0-1~ubuntu.24.04~noble', src: 'https://download.docker.com/linux/ubuntu noble/stable' },
    'containerd.io': { real: null, repo: 'docker', ver: '1.7.27-1', src: 'https://download.docker.com/linux/ubuntu noble/stable' },
    'docker-buildx-plugin': { real: null, repo: 'docker', ver: '0.28.0-0~ubuntu.24.04~noble', src: 'https://download.docker.com/linux/ubuntu noble/stable' },
    'docker-compose-plugin': { real: 'docker-compose-v2', repo: 'docker', ver: '2.39.2-0~ubuntu.24.04~noble', src: 'https://download.docker.com/linux/ubuntu noble/stable' }
  };
  function repoList(m) {
    const extra = [];
    try {
      for (const f of m.vfs.readdir('/etc/apt/sources.list.d', null)) {
        if (f === 'ubuntu.sources') continue;
        const t = m.vfs.readFile('/etc/apt/sources.list.d/' + f, null);
        const r = /(https?:\/\/\S+)\s+(\S+)\s+(\S+)/.exec(t) || /URIs:\s*(\S+)[\s\S]*?Suites:\s*(\S+)[\s\S]*?Components:\s*(\S+)/.exec(t);
        if (r) extra.push({ url: r[1], suite: r[2], comp: r[3], file: f, docker: /docker\.com/.test(r[1]) });
      }
    } catch (e) { /* 없음 */ }
    return extra;
  }
  function dockerRepo(m) { return repoList(m).some((r) => r.docker) && m.state.aptSeenDocker; }

  /** 모든 저장소 항목 (deb822 .sources + 한 줄 형식 .list / sources.list): [{ uri, suite, comps, file }] */
  function aptSources(m) {
    const out = [];
    const files = [];
    try { m.vfs.readdir('/etc/apt/sources.list.d', null).sort().forEach((f) => files.push('/etc/apt/sources.list.d/' + f)); } catch (e) { /* 없음 */ }
    files.unshift('/etc/apt/sources.list');
    for (const f of files) {
      let t;
      try { t = m.vfs.readFile(f, null); } catch (e) { continue; }
      if (/\.sources$/.test(f)) {
        t.split(/\n\s*\n/).forEach((st) => {
          const get = (k) => { const r = new RegExp('^' + k + ':[ \\t]*(.*)$', 'mi').exec(st.replace(/^#.*$/mg, '')); return r ? r[1].trim() : ''; };
          if (!/\bdeb\b/.test(get('Types')) || /^no$/i.test(get('Enabled'))) return;
          const uris = get('URIs').split(/\s+/).filter(Boolean), suites = get('Suites').split(/\s+/).filter(Boolean), comps = get('Components').split(/\s+/).filter(Boolean);
          uris.forEach((u) => suites.forEach((s) => out.push({ uri: u.replace(/\/+$/, ''), suite: s, comps, file: f })));
        });
      } else if (/(\.list|sources\.list)$/.test(f)) {
        t.split('\n').forEach((l) => {
          const r = /^\s*deb\s+(?:\[[^\]]*\]\s+)?(\S+)\s+(\S+)\s*(.*)$/.exec(l);
          if (r) out.push({ uri: r[1].replace(/\/+$/, ''), suite: r[2], comps: r[3].split(/\s+/).filter(Boolean), file: f });
        });
      }
    }
    return out;
  }
  LX.aptSources = aptSources;
  /** 우분투 기본 미러 주소 (예: http://kr.archive.ubuntu.com/ubuntu) */
  function mainRepo(m) {
    const s = aptSources(m).find((x) => /\/ubuntu$/.test(x.uri) && /^noble(-updates)?$/.test(x.suite));
    return s ? s.uri : REPO;
  }
  function securityRepo(m) {
    const s = aptSources(m).find((x) => x.suite === 'noble-security');
    return s ? s.uri : 'http://security.ubuntu.com/ubuntu';
  }
  const KNOWN_MIRRORS = ['archive.ubuntu.com', 'kr.archive.ubuntu.com', 'security.ubuntu.com', 'mirror.kakao.com', 'ftp.kaist.ac.kr', 'mirror.navercorp.com', 'ftp.lanet.kr', 'mirror.yongbok.net', 'ftp.harukasan.org', 'mirror.elice.io', 'download.docker.com', 'ppa.launchpadcontent.net', 'ports.ubuntu.com', 'old-releases.ubuntu.com', 'apt.postgresql.org', 'deb.nodesource.com', 'nginx.org', 'packages.microsoft.com', 'repo.mysql.com'];
  function editDist(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  /** 저장소 호스트 이름을 찾을 수 있나 (오타 흉내: 알려진 미러와 한두 글자 다르면 실패) */
  function hostResolves(m, host) {
    if (KNOWN_MIRRORS.includes(host) || /\.archive\.ubuntu\.com$/.test(host)) return true;
    if (KNOWN_MIRRORS.some((k) => editDist(k, host) <= 2)) return false;
    return !!(LX.resolveHost && LX.resolveHost(m, host));
  }
  const UBUNTU_SUITES = ['noble', 'noble-updates', 'noble-backports', 'noble-security', 'noble-proposed'];
  const UBUNTU_COMPS = ['main', 'restricted', 'universe', 'multiverse'];
  /** 업그레이드 가능 패키지의 (새 버전, 지금 버전) */
  const UPG_VER = {
    libcurl4t64: '8.5.0-2ubuntu10.6', libssl3t64: '3.0.13-0ubuntu3.5', 'libpython3.12-stdlib': '3.12.3-1ubuntu0.7', 'linux-firmware': '20240318.git3b128b60-0ubuntu2.15',
    'git-man': '1:2.43.0-1ubuntu7.2', 'vim-common': '2:9.1.0016-1ubuntu7.8', 'vim-runtime': '2:9.1.0016-1ubuntu7.8', xxd: '2:9.1.0016-1ubuntu7.8', tzdata: '2025b-0ubuntu0.24.04.1',
    'libpython3.12t64': '3.12.3-1ubuntu0.7', 'python3.12-minimal': '3.12.3-1ubuntu0.7'
  };
  function bumpVer(v) {
    const r = /^(.*?)(\d+)(\D*)$/.exec(v);
    return r ? r[1] + (+r[2] + 1) + r[3] : v + '.1';
  }
  function upgInfo(m, n) {
    // 같은 소스 패키지(git ↔ git-man, vim ↔ vim-common ...)는 같은 버전
    const parent = { 'git-man': 'git', 'vim-common': 'vim', 'vim-runtime': 'vim', xxd: 'vim', libcurl4t64: 'curl', libssl3t64: 'openssl', 'libpython3.12-stdlib': 'python3.12' }[n];
    const pv = parent && (m.state.pkgs[parent] || (LX.PKGS[parent] && LX.PKGS[parent].ver));
    const cur = m.state.pkgs[n] || (LX.PKGS[n] && LX.PKGS[n].ver) || pv || UPG_VER[n] || '1.0-1ubuntu1';
    const nv = n === 'tzdata' ? '2025b-0ubuntu0.24.04.2' : n === 'linux-firmware' ? '20240318.git3b128b60-0ubuntu2.16' : bumpVer(cur);
    const sec = /ssl|sudo|curl|python|linux-firmware|vim|xxd|git/.test(n);
    return { cur, nv, suite: sec ? 'noble-updates,noble-security' : 'noble-updates', comp: LX.PKGS[n] && LX.PKGS[n].section !== 'main' ? 'universe' : 'main', size: 100 + n.length * 37 };
  }
  function fmtKB(kb) { return kb >= 1000 ? `${(kb / 1000).toFixed(kb >= 10000 ? 0 : 1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} MB` : `${kb} kB`; }
  const aptLockErr = (c) => { c.err('E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?\n'); return 100; };
  async function slow(c, ms) { if (!c.session.headless) await c.sleep(ms); }

  async function aptUpdate(c, isGet) {
    if (c.cred.uid !== 0) { c.err('Reading package lists... Done\nE: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)\nE: Unable to lock directory /var/lib/apt/lists/\nW: Problem unlinking the file /var/cache/apt/pkgcache.bin - RemoveCaches (13: Permission denied)\nW: Problem unlinking the file /var/cache/apt/srcpkgcache.bin - RemoveCaches (13: Permission denied)\n'); return 100; }
    const m = c.m;
    const seen = m.state.aptSeen || {};
    const first = !m.state.aptUpdated;
    const lines = [];
    const warns = [], errs = [];
    let k = 0, total = 0;
    const hostOf = (u) => (/^[a-z]+:\/\/([^/:]+)/i.exec(u) || [])[1] || u;
    const ipOf = (h) => { const r = LX.resolveHost ? LX.resolveHost(m, h) : null; return r ? r.ip : '91.189.91.83'; };
    const srcs = aptSources(m);
    // 같은 저장소 · 같은 호스트는 한 번씩 (apt 는 같은 URI+suite 를 한 번만 받는다)
    const uniq = [];
    srcs.forEach((s) => { if (!uniq.some((u) => u.uri === s.uri && u.suite === s.suite)) uniq.push(s); });
    const badHosts = new Set();
    for (const s of uniq) {
      const host = hostOf(s.uri);
      const key = s.uri + ' ' + s.suite;
      const ubuntu = /\/ubuntu$/.test(s.uri) && /ubuntu\.com|kakao|kaist|navercorp|lanet|yongbok|harukasan|elice|mirror/.test(host);
      if (badHosts.has(host) || !hostResolves(m, host)) {
        badHosts.add(host);
        lines.push(`Ign:${++k} ${s.uri} ${s.suite} InRelease`);
        errs.push(`Err:${k} ${s.uri} ${s.suite} InRelease\n  Temporary failure resolving '${host}'`);
        warns.push(`W: Failed to fetch ${s.uri}/dists/${s.suite}/InRelease  Temporary failure resolving '${host}'`);
        continue;
      }
      if (ubuntu && !UBUNTU_SUITES.includes(s.suite)) {
        lines.push(`Ign:${++k} ${s.uri} ${s.suite} InRelease`);
        errs.push(`Err:${k} ${s.uri} ${s.suite} Release\n  404  Not Found [IP: ${ipOf(host)} 80]`);
        warns.push(`E: The repository '${s.uri} ${s.suite} Release' does not have a Release file.`);
        continue;
      }
      if (ubuntu) s.comps.filter((cp) => !UBUNTU_COMPS.includes(cp)).forEach((cp) => warns.push(`W: Skipping acquire of configured file '${cp}/binary-amd64/Packages' as repository '${s.uri} ${s.suite} InRelease' doesn't have the component '${cp}' (component misspelt in sources.list?)`));
      if (s.docker || /docker\.com/.test(host)) m.state.aptSeenDocker = true;
      const size = s.suite === 'noble' ? 256 : 126;
      if (seen[key]) { lines.push(`Hit:${++k} ${s.uri} ${s.suite} InRelease`); continue; }
      lines.push(`Get:${++k} ${s.uri} ${s.suite} InRelease [${size} kB]`);
      total += size;
      seen[key] = m.now();
      if (!ubuntu) { lines.push(`Get:${++k} ${s.uri} ${s.suite}/${s.comps[0] || 'main'} amd64 Packages [${/docker/.test(host) ? '38.2' : '12.4'} kB]`); total += 40; continue; }
      if (s.suite === 'noble-backports') continue;
      const big = { 'noble-updates': { main: 1391, universe: 1127, restricted: 1580, multiverse: 26.3 }, 'noble-security': { main: 1103, universe: 877, restricted: 1498, multiverse: 21.8 }, noble: { main: 1401, universe: 15044, restricted: 93.9, multiverse: 269 } }[s.suite] || {};
      s.comps.filter((cp) => big[cp]).slice(0, first ? 4 : 2).forEach((cp) => {
        lines.push(`Get:${++k} ${s.uri} ${s.suite}/${cp} amd64 Packages [${big[cp].toLocaleString('en-US')} kB]`);
        total += Math.round(big[cp]);
      });
    }
    m.state.aptSeen = seen;
    for (const l of lines) { c.out(l + '\n'); await slow(c, 120); }
    for (const e of errs) c.out(e + '\n');
    const secs = Math.max(1, Math.round(total / 3000));
    if (total) c.out(`Fetched ${total.toLocaleString('en-US')} kB in ${secs}s (${Math.round(total / secs).toLocaleString('en-US')} kB/s)\n`);
    c.out('Reading package lists... Done\n');
    await slow(c, 200);
    const fatal = warns.filter((w) => w.startsWith('E:'));
    if (fatal.length) {
      c.err(fatal.concat(['N: Updating from such a repository can\'t be done securely, and is therefore disabled by default.', 'N: See apt-secure(8) manpage for repository creation and user configuration details.']).join('\n') + '\n');
      return 100;
    }
    if (!isGet) {
      c.out('Building dependency tree... Done\nReading state information... Done\n');
      m.state.aptUpdated = m.now();
      const n = m.state.upgradable.length;
      c.out(n ? `${n} package${n > 1 ? 's' : ''} can be upgraded. Run 'apt list --upgradable' to see them.\n` : 'All packages are up to date.\n');
    } else m.state.aptUpdated = m.now();
    if (warns.length) {
      const w = warns.slice();
      if (errs.length) w.push('W: Some index files failed to download. They have been ignored, or old ones used instead.');
      c.err(w.join('\n') + '\n');
    }
    return 0;
  }

  function resolveInstall(m, names) {
    const want = [];
    const errs = [];
    const add = (n, explicit) => {
      if (want.some((w) => w.name === n)) return;
      const tp = THIRD[n];
      if (tp) {
        if (!dockerRepo(m)) { errs.push(n); return; }
        want.push({ name: n, explicit, third: tp, ver: tp.ver, size: 30000 });
        if (tp.real) add(tp.real, false);
        return;
      }
      const p = LX.PKGS[n];
      if (!p) { errs.push(n); return; }
      (p.deps || []).forEach((d) => add(d, false));
      want.push({ name: n, explicit, p, ver: p.ver, size: p.size });
    };
    names.forEach((n) => add(n, true));
    return { want, errs };
  }

  async function aptInstall(c, names, opts) {
    const m = c.m;
    if (c.cred.uid !== 0) return aptLockErr(c);
    const out = (s) => c.out(s);
    out('Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\n');
    // .deb 파일 설치
    names = names.map((n) => (/\.deb$/.test(n) ? ((/^(?:.*\/)?([a-z0-9.+-]+?)_/.exec(n) || [])[1] || n) : n));
    const { want, errs } = resolveInstall(m, names);
    if (errs.length) {
      errs.forEach((e) => { c.err(`E: Unable to locate package ${e}\n`); });
      if (errs.some((e) => THIRD[e])) c.err('\x1b[2m(도커 공식 저장소를 먼저 추가하고 sudo apt update 를 실행해야 합니다)\x1b[0m\n');
      return 100;
    }
    const already = want.filter((w) => w.explicit && m.state.pkgs[w.name]);
    already.forEach((w) => out(`${w.name} is already the newest version (${w.ver}).\n`));
    const fresh = want.filter((w) => !m.state.pkgs[w.name] && !(w.third && !w.third.real && m.state.pkgs[w.name]));
    // 충돌 (mysql ↔ mariadb)
    const remove = [];
    fresh.forEach((w) => ((w.p && w.p.conflicts) || []).forEach((cf) => { if (m.state.pkgs[cf]) remove.push(cf, cf === 'mysql-server' ? 'mysql-client' : 'mariadb-client'); }));
    const up = m.state.upgradable.length;
    if (!fresh.length) {
      out(`0 upgraded, 0 newly installed, 0 to remove and ${up} not upgraded.\n`);
      return 0;
    }
    const extra = fresh.filter((w) => !w.explicit);
    if (extra.length) out('The following additional packages will be installed:\n  ' + extra.map((w) => w.name).join(' ') + '\n');
    if (remove.length) out('The following packages will be REMOVED:\n  ' + [...new Set(remove)].filter((r) => m.state.pkgs[r]).join(' ') + '\n');
    out('The following NEW packages will be installed:\n  ' + fresh.map((w) => w.name).join(' ') + '\n');
    const dl = fresh.reduce((a, w) => a + Math.round(w.size * 0.35), 0);
    const inst = fresh.reduce((a, w) => a + w.size, 0);
    out(`0 upgraded, ${fresh.length} newly installed, ${new Set(remove).size} to remove and ${up} not upgraded.\nNeed to get ${fmtKB(dl)} of archives.\nAfter this operation, ${fmtKB(inst)} of additional disk space will be used.\n`);
    if (!opts.yes) {
      const ans = await c.readLine('Do you want to continue? [Y/n] ', { tty: true });
      if (ans == null || (ans.trim() && !/^y/i.test(ans.trim()))) { out('Abort.\n'); return 1; }
    }
    let k = 0;
    for (const w of fresh) {
      const src = w.third ? w.third.src : `${mainRepo(m)} noble-updates/${w.p && w.p.section === 'main' ? 'main' : 'universe'}`;
      out(`Get:${++k} ${src} amd64 ${w.name} amd64 ${w.ver} [${fmtKB(Math.round(w.size * 0.35))}]\n`);
      await slow(c, 150);
    }
    out(`Fetched ${fmtKB(dl)} in 1s (${fmtKB(Math.round(dl * 0.9))}/s)\n`);
    for (const r of [...new Set(remove)]) {
      if (!m.state.pkgs[r]) continue;
      out(`(Reading database ... 84210 files and directories currently installed.)\nRemoving ${r} (${LX.PKGS[r].ver}) ...\n`);
      if (LX.PKGS[r].svc) LX.svcStop(m, LX.PKGS[r].svc);
      LX.pkgRemove(m, r, false);
    }
    for (const w of fresh) {
      out(`Selecting previously unselected package ${w.name}.\n(Reading database ... ${83921 + k * 23} files and directories currently installed.)\nPreparing to unpack .../${w.name}_${w.ver.replace(/^\d+:/, '')}_amd64.deb ...\nUnpacking ${w.name} (${w.ver}) ...\n`);
      await slow(c, 100);
    }
    const failedSvcs = [];
    for (const w of fresh) {
      out(`Setting up ${w.name} (${w.ver}) ...\n`);
      if (w.third) {
        if (!w.third.real) m.state.pkgs[w.name] = w.ver;
        else m.state.pkgs[w.name] = w.ver;
        continue;
      }
      LX.pkgFiles(m, w.name);
      const svc = w.p.svc;
      if (svc && LX.SERVICES[svc]) {
        out(`Created symlink /etc/systemd/system/multi-user.target.wants/${svc}.service → ${LX.SERVICES[svc].unit}.\n`);
        if (svc === 'ssh') out('Creating SSH2 RSA key; this may take some time ...\n3072 SHA256:Xq1v0yT3hB8k7Qm2cF5rN9zW4pL6sJ0aE1dG8uH2iK4 root@' + m.hostname() + ' (RSA)\nCreating SSH2 ECDSA key; this may take some time ...\n256 SHA256:Yb3t7pQ1vR5nM8cK2xW6zL0hF4jS9aD3eG7uN1iB5oT root@' + m.hostname() + ' (ECDSA)\nCreating SSH2 ED25519 key; this may take some time ...\n256 SHA256:Zc5u9rS3wT7oN0dL4yX8aM2iG6kU1bE5fH9vP3jC7qW root@' + m.hostname() + ' (ED25519)\n');
        if (svc === 'docker') out('Adding group `docker\' (GID 113) ...\nDone.\n');
        const err = LX.svcStart(m, svc);
        if (err) {
          failedSvcs.push(svc);
          c.err(`Job for ${svc}.service failed because the control process exited with error code.\nSee "systemctl status ${svc}.service" and "journalctl -xeu ${svc}.service" for details.\ninvoke-rc.d: initscript ${svc}, action "start" failed.\n`);
          out(statusText(Object.assign({}, c, { tty: false }), svc).split('\n').slice(0, 4).map((l) => l.replace(/^/, '')).join('\n') + '\n');
        }
        if (svc === 'mysql') out('update-alternatives: using /etc/mysql/mysql.cnf to provide /etc/mysql/my.cnf (my.cnf) in auto mode\nRenaming removed key_buffer and myisam-recover options (if present)\nmysqld will log errors to /var/log/mysql/error.log\nmysqld is running as pid ' + (m.state.services.mysql || {}).pid + '\n');
      }
      if (w.name === 'docker.io' && LX.SERVICES.containerd) { LX.pkgFiles(m, 'containerd'); LX.svcStart(m, 'containerd'); }
    }
    for (const w of fresh) if (w.explicit) { m.state.manual = m.state.manual || {}; m.state.manual[w.name] = true; }
    out(`Processing triggers for man-db (2.12.0-4build2) ...\n`);
    if (fresh.some((w) => w.p && w.p.svc)) out('Processing triggers for ufw (0.36.2-6) ...\n');
    out('Scanning processes...\nScanning linux images...\n\nRunning kernel seems to be up-to-date.\n\nNo services need to be restarted.\n\nNo containers need to be restarted.\n\nNo user sessions are running outdated binaries.\n\nNo VM guests are running outdated hypervisor (qemu) binaries on this host.\n');
    if (!c.tty) c.err('');
    logApt(c, 'Install', fresh.map((w) => ({ name: w.name, ver: w.ver, auto: !w.explicit })));
    return failedSvcs.length ? 100 : 0;
  }
  /** /var/log/apt/history.log · /var/log/dpkg.log 기록 (명령 한 번에 한 묶음) */
  function logApt(c, kind, list) {
    const m = c.m;
    if (!list.length) return;
    const d = LX.strftime(m, '%Y-%m-%d  %H:%M:%S', m.now());
    const su = c.env ? c.env('SUDO_USER') : '';
    const who = su || (c.cred.uid === 0 ? '' : c.cred.name);
    const uid = who ? ((m.credFor && m.credFor(who)) || { uid: 1000 }).uid : null;
    const pkgs = list.map((w) => `${w.name}:amd64 (${kind === 'Upgrade' ? `${w.old}, ${w.ver}` : w.ver}${w.auto ? ', automatic' : ''})`).join(', ');
    const cmdline = [c.name].concat(c.args).join(' ');
    try { m.vfs.writeFile('/var/log/apt/history.log', `\nStart-Date: ${d}\nCommandline: ${cmdline}\n${who ? `Requested-By: ${who} (${uid})\n` : ''}${kind}: ${pkgs}\nEnd-Date: ${d}\n`, null, { append: true }); } catch (e) { /* 무시 */ }
    const t = LX.strftime(m, '%Y-%m-%d %H:%M:%S', m.now());
    const act = { Install: 'install', Remove: 'remove', Purge: 'purge', Upgrade: 'upgrade' }[kind];
    const dl = list.map((w) => `${t} ${act} ${w.name}:amd64 ${kind === 'Install' ? '<none>' : kind === 'Upgrade' ? w.old : w.ver} ${kind === 'Install' || kind === 'Upgrade' ? w.ver : '<none>'}\n${t} status ${kind === 'Purge' ? 'not-installed' : kind === 'Remove' ? 'config-files' : 'installed'} ${w.name}:amd64 ${kind === 'Purge' ? '<none>' : w.ver}\n`).join('');
    try { m.vfs.writeFile('/var/log/dpkg.log', dl, null, { append: true }); } catch (e) { /* 무시 */ }
  }

  async function aptRemove(c, names, opts) {
    const m = c.m;
    if (c.cred.uid !== 0) return aptLockErr(c);
    c.out('Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\n');
    const list = [];
    const rcOnly = [];   // 이미 제거되고 설정 파일만 남은 패키지 (purge 대상)
    const rc = m.state.rc || {};
    for (const n of names) {
      if (!LX.PKGS[n] && !THIRD[n] && !rc[n]) { c.err(`E: Unable to locate package ${n}\n`); return 100; }
      if (!m.state.pkgs[n]) {
        if (opts.purge && rc[n]) { rcOnly.push(n); continue; }
        c.out(`Package '${n}' is not installed, so not removed\n`);
        continue;
      }
      if (LX.PKGS[n] && LX.PKGS[n].base && ['sudo', 'bash', 'coreutils', 'apt', 'dpkg', 'systemd', 'passwd', 'login'].includes(n)) {
        c.err(`E: Removing essential system-critical packages is not permitted. This might break the system.\n`);
        return 100;
      }
      list.push(n);
    }
    const up = m.state.upgradable.length;
    const all = list.concat(rcOnly);
    if (!all.length) { c.out(`0 upgraded, 0 newly installed, 0 to remove and ${up} not upgraded.\n`); return 0; }
    const autoDeps = [];
    list.forEach((n) => ((LX.PKGS[n] || {}).deps || []).forEach((d) => { if (m.state.pkgs[d] && !list.includes(d) && !autoDeps.includes(d) && !(m.state.manual || {})[d]) autoDeps.push(d); }));
    if (autoDeps.length) c.out(`The following packages were automatically installed and are no longer required:\n  ${autoDeps.join(' ')}\nUse 'sudo apt autoremove' to remove ${autoDeps.length > 1 ? 'them' : 'it'}.\n`);
    const freed = list.reduce((a, n) => a + ((LX.PKGS[n] || {}).size || 100), 0);
    c.out(`The following packages will be REMOVED:\n  ${all.map((n) => n + (opts.purge ? '*' : '')).join(' ')}\n0 upgraded, 0 newly installed, ${all.length} to remove and ${up} not upgraded.\n${freed ? `After this operation, ${fmtKB(freed)} disk space will be freed.` : 'After this operation, 0 B of additional disk space will be used.'}\n`);
    if (!opts.yes) {
      const ans = await c.readLine('Do you want to continue? [Y/n] ', { tty: true });
      if (ans == null || (ans.trim() && !/^y/i.test(ans.trim()))) { c.out('Abort.\n'); return 1; }
    }
    c.out(`(Reading database ... ${84210 - list.length * 37} files and directories currently installed.)\n`);
    const logged = [];
    for (const n of list) {
      const p = LX.PKGS[n];
      const ver = m.state.pkgs[n];
      c.out(`Removing ${n} (${ver}) ...\n`);
      if (p && p.svc) LX.svcStop(m, p.svc);
      logged.push({ name: n, ver });
      if (p) LX.pkgRemove(m, n, false); else delete m.state.pkgs[n];
      if (m.state.manual) delete m.state.manual[n];
      await slow(c, 100);
    }
    if (list.length) c.out('Processing triggers for man-db (2.12.0-4build2) ...\n');
    if (opts.purge) {
      const purgeList = list.concat(rcOnly).filter((n) => (m.state.rc || {})[n] || LX.pkgHasConf(n));
      if (list.length && purgeList.length) c.out(`(Reading database ... ${84210 - list.length * 37 - 5} files and directories currently installed.)\n`);
      for (const n of purgeList) {
        const ver = (m.state.rc || {})[n] || (logged.find((x) => x.name === n) || {}).ver || (LX.PKGS[n] || {}).ver;
        c.out(`Purging configuration files for ${n} (${ver}) ...\n`);
        LX.pkgPurgeConf(m, n);
        if (!logged.some((x) => x.name === n)) logged.push({ name: n, ver });
      }
      for (const n of list) if (m.state.rc) delete m.state.rc[n];
    }
    logApt(c, opts.purge ? 'Purge' : 'Remove', logged);
    return 0;
  }

  function aptShow(c, n) {
    const p = LX.PKGS[n];
    const tp = THIRD[n];
    if (!p && !(tp && dockerRepo(c.m))) { c.err(`N: Unable to locate package ${n}\nE: No packages found\n`); return 100; }
    if (tp) { c.out(`Package: ${n}\nVersion: ${tp.ver}\nPriority: optional\nSection: admin\nMaintainer: Docker <support@docker.com>\nInstalled-Size: 100 MB\nHomepage: https://www.docker.com\nDownload-Size: 30 MB\nAPT-Sources: ${tp.src} amd64 Packages\nDescription: Docker: the open-source application container engine\n\n`); return 0; }
    const inst = !!c.m.state.pkgs[n];
    c.out(`Package: ${n}\nVersion: ${p.ver}\nPriority: optional\nSection: ${p.section === 'main' ? '' : 'universe/'}${/server|nginx|apache/.test(n) ? 'httpd' : 'utils'}\nOrigin: Ubuntu\nMaintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\nBugs: https://bugs.launchpad.net/ubuntu/+filebug\nInstalled-Size: ${fmtKB(p.size)}\n${p.deps.length ? `Depends: ${p.deps.join(', ')}\n` : ''}Homepage: https://packages.ubuntu.com/noble/${n}\nDownload-Size: ${fmtKB(Math.round(p.size * 0.35))}\n${inst ? 'APT-Manual-Installed: yes\n' : ''}APT-Sources: ${REPO} noble-updates/${p.section === 'main' ? 'main' : 'universe'} amd64 Packages\nDescription: ${p.desc}\n\n`);
    return 0;
  }

  def(['apt', 'apt-get', 'apt-cache', 'apt-mark'], async (c) => {
    const m = c.m;
    let args = c.args.slice();
    const yes = args.some((a) => /^-(y|-yes|-assume-yes|qy|yq)$/.test(a) || /^-[a-z]*y[a-z]*$/.test(a) && a.length <= 4);
    args = args.filter((a) => !a.startsWith('-') || ['--installed', '--upgradable', '--all-versions', '--purge'].includes(a));
    const isGet = c.name === 'apt-get';
    if (c.name === 'apt' && !c.tty && args[0] && !['--help'].includes(args[0])) c.err('\nWARNING: apt does not have a stable CLI interface. Use with caution in scripts.\n\n');
    let sub = args[0];
    const rest = args.slice(1);
    if (c.name === 'apt-cache') sub = 'cache-' + sub;
    if (c.name === 'apt-mark') sub = 'mark-' + sub;
    if (!sub || sub === '--help' || sub === 'help') {
      c.out(`apt 2.8.3 (amd64)\nUsage: apt [options] command\n\napt is a commandline package manager and provides commands for\nsearching and managing as well as querying information about packages.\n\nMost used commands:\n  list - list packages based on package names\n  search - search in package descriptions\n  show - show package details\n  install - install packages\n  reinstall - reinstall packages\n  remove - remove packages\n  autoremove - automatically remove all unused packages\n  update - update list of available packages\n  upgrade - upgrade the system by installing/upgrading packages\n  full-upgrade - upgrade the system by removing/installing/upgrading packages\n  edit-sources - edit the source information file\n  modernize-sources - modernize .list files to .sources files\n  satisfy - satisfy dependency strings\n\nSee apt(8) for more information about the available commands.\n                                        This APT has Super Cow Powers.\n`);
      return 0;
    }
    switch (sub) {
      case 'update': return aptUpdate(c, isGet);
      case 'install': case 'reinstall': {
        if (!rest.length) { c.out('Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\n0 upgraded, 0 newly installed, 0 to remove and ' + m.state.upgradable.length + ' not upgraded.\n'); return 0; }
        return aptInstall(c, rest, { yes });
      }
      case 'remove': return aptRemove(c, rest, { yes, purge: c.args.includes('--purge') });
      case 'purge': return aptRemove(c, rest, { yes, purge: true });
      case 'autoremove': case 'autoclean': case 'clean': {
        if (c.cred.uid !== 0) return aptLockErr(c);
        if (sub === 'clean' || sub === 'autoclean') return 0;
        c.out('Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\n');
        const needed = new Set();
        Object.keys(m.state.pkgs).forEach((n) => ((LX.PKGS[n] || {}).deps || []).forEach((d) => needed.add(d)));
        const orphans = Object.keys(m.state.pkgs).filter((n) => LX.PKGS[n] && !LX.PKGS[n].base && !(m.state.manual || {})[n] && !needed.has(n));
        if (!orphans.length) { c.out(`0 upgraded, 0 newly installed, 0 to remove and ${m.state.upgradable.length} not upgraded.\n`); return 0; }
        return aptRemove(c, orphans, { yes });
      }
      case 'upgrade': case 'full-upgrade': case 'dist-upgrade': {
        if (c.cred.uid !== 0) return aptLockErr(c);
        c.out('Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\nCalculating upgrade... Done\n');
        const list = m.state.upgradable;
        if (!list.length) { c.out('0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n'); return 0; }
        c.out(`The following packages will be upgraded:\n  ${list.join(' ')}\n${list.length} upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\nNeed to get 58.3 MB of archives.\nAfter this operation, 412 kB of additional disk space will be used.\n`);
        if (!yes) {
          const ans = await c.readLine('Do you want to continue? [Y/n] ', { tty: true });
          if (ans == null || (ans.trim() && !/^y/i.test(ans.trim()))) { c.out('Abort.\n'); return 1; }
        }
        let k = 0;
        const infos = list.map((n) => Object.assign({ name: n }, upgInfo(m, n)));
        for (const u of infos) { c.out(`Get:${++k} ${/security/.test(u.suite) ? securityRepo(m) + ' noble-security' : mainRepo(m) + ' noble-updates'}/${u.comp} amd64 ${u.name} amd64 ${u.nv} [${u.size} kB]\n`); await slow(c, 60); }
        c.out(`Fetched 58.3 MB in 4s (14.6 MB/s)\n`);
        for (const u of infos) { c.out(`(Reading database ... 84210 files and directories currently installed.)\nPreparing to unpack .../${u.name}_${u.nv.replace(/^\d+:/, '')}_amd64.deb ...\nUnpacking ${u.name} (${u.nv}) over (${u.cur}) ...\n`); await slow(c, 40); }
        for (const u of infos) { c.out(`Setting up ${u.name} (${u.nv}) ...\n`); if (m.state.pkgs[u.name]) m.state.pkgs[u.name] = u.nv; }
        c.out('Processing triggers for man-db (2.12.0-4build2) ...\nProcessing triggers for libc-bin (2.39-0ubuntu8.5) ...\nScanning processes...\nScanning linux images...\n\nRunning kernel seems to be up-to-date.\n\nNo services need to be restarted.\n');
        logApt(c, 'Upgrade', infos.map((u) => ({ name: u.name, ver: u.nv, old: u.cur })));
        m.state.upgradable = [];
        return 0;
      }
      case 'list': {
        if (c.name === 'apt') c.out('Listing... Done\n');
        const inst = c.args.includes('--installed');
        const upg = c.args.includes('--upgradable');
        const pat = rest.filter((r) => !r.startsWith('-'))[0];
        const re = pat ? LX.glob.globToRe(pat, false) : null;
        if (upg) { m.state.upgradable.filter((n) => !re || re.test(n)).slice().sort().forEach((n) => { const u = upgInfo(m, n); c.out(`${c.tty ? '\x1b[32m' + n + '\x1b[0m' : n}/${u.suite} ${u.nv} amd64 [upgradable from: ${u.cur}]\n`); }); return 0; }
        const names = Object.keys(LX.PKGS).filter((n) => (!re || re.test(n)) && (!inst || m.state.pkgs[n])).sort();
        names.forEach((n) => { const p = LX.PKGS[n]; c.out(`${c.tty ? '\x1b[32m' + n + '\x1b[0m' : n}/noble-updates${p.section === 'main' ? '' : ''},now ${p.ver} amd64${m.state.pkgs[n] ? (p.base ? ' [installed,automatic]' : ' [installed]') : ''}\n`); });
        return 0;
      }
      case 'search': case 'cache-search': {
        const kw = rest.join(' ').toLowerCase();
        if (!kw) { c.err('E: You must give at least one search pattern\n'); return 100; }
        if (c.name === 'apt') c.out('Sorting... Done\nFull Text Search... Done\n');
        let re;
        try { re = new RegExp(kw, 'i'); } catch (e) { re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); }
        Object.values(LX.PKGS).filter((p) => re.test(p.name) || re.test(p.desc)).sort((a, b) => (a.name < b.name ? -1 : 1)).forEach((p) => {
          if (c.name === 'apt-cache') c.out(`${p.name} - ${p.desc}\n`);
          else c.out(`${c.tty ? '\x1b[32m' + p.name + '\x1b[0m' : p.name}/noble-updates ${p.ver} amd64${m.state.pkgs[p.name] ? ' [installed]' : ''}\n  ${p.desc}\n\n`);
        });
        return 0;
      }
      case 'show': case 'cache-show': { let st = 0; rest.forEach((n) => { st = aptShow(c, n) || st; }); return st; }
      case 'policy': case 'cache-policy': {
        const REPO = mainRepo(m);
        if (!rest.length) { c.out(`Package files:\n 100 /var/lib/dpkg/status\n     release a=now\n 500 ${REPO} noble-updates/main amd64 Packages\n     release v=24.04,o=Ubuntu,a=noble-updates,n=noble,l=Ubuntu,c=main,b=amd64\n     origin ${REPO.split('/')[2]}\n 500 ${REPO} noble/main amd64 Packages\n     release v=24.04,o=Ubuntu,a=noble,n=noble,l=Ubuntu,c=main,b=amd64\n     origin ${REPO.split('/')[2]}\nPinned packages:\n`); return 0; }
        rest.forEach((n) => {
          const p = LX.PKGS[n] || (THIRD[n] && dockerRepo(m) ? { ver: THIRD[n].ver } : null);
          if (!p) { c.out(`N: Unable to locate package ${n}\n`); return; }
          const iv = m.state.pkgs[n];
          c.out(`${n}:\n  Installed: ${iv || '(none)'}\n  Candidate: ${p.ver}\n  Version table:\n ${iv ? '***' : '   '} ${p.ver} 500\n        500 ${THIRD[n] ? THIRD[n].src : REPO + ' noble-updates/main'} amd64 Packages\n${iv ? '        100 /var/lib/dpkg/status\n' : ''}`);
        });
        return 0;
      }
      case 'cache-depends': case 'depends': {
        let st = 0;
        rest.filter((n) => !n.startsWith('-')).forEach((n) => {
          const p = LX.PKGS[n];
          if (!p) { c.err('E: No packages found\n'); st = 100; return; }
          c.out(`${n}\n${p.deps.map((d) => `  Depends: ${d}${LX.PKGS[d] ? ` (>= ${LX.PKGS[d].ver.replace(/-[^-]*$/, '')})` : ''}`).join('\n')}${p.deps.length ? '\n' : ''}`);
        });
        return st;
      }
      case 'cache-rdepends': case 'rdepends': {
        let st = 0;
        rest.filter((n) => !n.startsWith('-')).forEach((n) => {
          if (!LX.PKGS[n]) { c.err('E: No packages found\n'); st = 100; return; }
          const inst = c.args.includes('--installed');
          const rd = Object.values(LX.PKGS).filter((p) => (p.deps || []).includes(n) && (!inst || m.state.pkgs[p.name])).map((p) => p.name).sort();
          c.out(`${n}\nReverse Depends:\n${rd.map((x) => `  ${c.name === 'apt' ? `Depends: ${x}` : x}`).join('\n')}${rd.length ? '\n' : ''}`);
        });
        return st;
      }
      case 'mark-hold': case 'mark-unhold': {
        if (c.cred.uid !== 0) { c.err('E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\n'); return 100; }
        m.state.held = m.state.held || {};
        rest.forEach((n) => { if (sub === 'mark-hold') { m.state.held[n] = true; c.out(`${n} set on hold.\n`); } else { delete m.state.held[n]; c.out(`Canceled hold on ${n}.\n`); } });
        return 0;
      }
      case 'mark-showhold': Object.keys(m.state.held || {}).forEach((n) => c.out(n + '\n')); return 0;
      case 'mark-showmanual': Object.keys(m.state.manual || {}).forEach((n) => c.out(n + '\n')); return 0;
      case 'edit-sources': return LX.editFile(c, '/etc/apt/sources.list.d/ubuntu.sources', c.cred, { editor: 'nano' });
      default:
        c.err(`E: Invalid operation ${sub}\n`);
        return 100;
    }
  });

  def('add-apt-repository', async (c) => {
    const args = c.args.filter((a) => !a.startsWith('-'));
    const yes = c.args.includes('-y') || c.args.includes('--yes');
    if (c.cred.uid !== 0) { c.err('Error: must run as root\n'); return 1; }
    const spec = args[0];
    if (!spec) { c.err('usage: add-apt-repository [options] repository\n'); return 2; }
    const r = /^ppa:([\w-]+)\/([\w.-]+)$/.exec(spec);
    if (c.args.includes('-r') || c.args.includes('--remove')) {
      if (r) { try { c.fs.unlink(`/etc/apt/sources.list.d/${r[1]}-ubuntu-${r[2]}-noble.sources`, null); } catch (e) { /* 없음 */ } }
      return 0;
    }
    if (['universe', 'multiverse', 'restricted', 'main'].includes(spec)) { c.out(`Adding component(s) '${spec}' to all repositories.\n`); return 0; }
    if (r) {
      c.out(`Repository: 'Types: deb\nURIs: https://ppa.launchpadcontent.net/${r[1]}/${r[2]}/ubuntu/\nSuites: noble\nComponents: main\n'\nDescription:\n${r[2]} PPA\nMore info: https://launchpad.net/~${r[1]}/+archive/ubuntu/${r[2]}\nAdding repository.\n`);
      if (!yes) { const a = await c.readLine('Press [ENTER] to continue or Ctrl-c to cancel.', { tty: true }); if (a == null) return 1; }
      c.fs.writeFile(`/etc/apt/sources.list.d/${r[1]}-ubuntu-${r[2]}-noble.sources`, `Types: deb\nURIs: https://ppa.launchpadcontent.net/${r[1]}/${r[2]}/ubuntu/\nSuites: noble\nComponents: main\nSigned-By: /etc/apt/keyrings/${r[1]}.gpg\n`, null);
      return aptUpdate(c, true);
    }
    c.fs.writeFile('/etc/apt/sources.list.d/archive_uri-' + spec.replace(/\W+/g, '_').slice(0, 30) + '-noble.list', `deb ${spec}\n`, null);
    return 0;
  });

  // ======================================================================= dpkg
  def(['dpkg', 'dpkg-query'], async (c) => {
    const m = c.m;
    const a = c.args[0];
    const rest = c.args.slice(1);
    const allInstalled = Object.keys(m.state.pkgs).sort();
    const rc = m.state.rc || {};
    if (a === '--print-architecture') { c.out('amd64\n'); return 0; }
    if (a === '--print-foreign-architectures') return 0;
    if (a === '-l' || a === '--list' || a === '-W' && false) {
      const re = rest[0] ? LX.glob.globToRe(rest[0], false) : null;
      const list = allInstalled.concat(Object.keys(rc).filter((n) => !m.state.pkgs[n])).sort().filter((n) => !re || re.test(n));
      if (!list.length) { c.err(`dpkg-query: no packages found matching ${rest[0]}\n`); return 1; }
      c.out('Desired=Unknown/Install/Remove/Purge/Hold\n| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend\n|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)\n||/ Name                       Version                        Architecture Description\n+++-==========================-==============================-============-=========================================================\n');
      list.forEach((n) => { const inst = !!m.state.pkgs[n]; const p = LX.PKGS[n] || { ver: m.state.pkgs[n], desc: n }; c.out(`${inst ? ((m.state.held || {})[n] ? 'hi' : 'ii') : 'rc'}  ${n.padEnd(26)} ${String(inst ? m.state.pkgs[n] : rc[n]).padEnd(30)} amd64        ${p.desc}\n`); });
      return 0;
    }
    if ((a === '-s' || a === '--status') && !m.state.pkgs[rest[0]] && rc[rest[0]]) {
      const n = rest[0];
      const p = LX.PKGS[n] || { desc: n };
      c.out(`Package: ${n}\nStatus: deinstall ok config-files\nPriority: optional\nSection: httpd\nInstalled-Size: ${p.size || 100}\nMaintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\nArchitecture: amd64\nVersion: ${rc[n]}\nDescription: ${p.desc}\n`);
      return 0;
    }
    if (a === '-s' || a === '--status') {
      const n = rest[0];
      if (!m.state.pkgs[n]) { c.err(`dpkg-query: package '${n}' is not installed and no information is available\nUse dpkg --info (= dpkg-deb --info) to examine archive files.\n`); return 1; }
      const p = LX.PKGS[n] || { ver: m.state.pkgs[n], desc: n, deps: [], size: 1000 };
      c.out(`Package: ${n}\nStatus: install ok installed\nPriority: optional\nSection: utils\nInstalled-Size: ${p.size}\nMaintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\nArchitecture: amd64\nVersion: ${m.state.pkgs[n]}\n${p.deps.length ? `Depends: ${p.deps.join(', ')}\n` : ''}Description: ${p.desc}\n`);
      return 0;
    }
    if (a === '-L' || a === '--listfiles') {
      const n = rest[0];
      const p = LX.PKGS[n];
      if (!m.state.pkgs[n]) { c.err(`dpkg-query: package '${n}' is not installed\nUse dpkg --contents (= dpkg-deb --contents) to list archive files contents.\n`); return 1; }
      const files = ['/.'];
      if (p) Object.entries(p.bins).forEach(([d, list]) => list.forEach((b) => files.push(`${d}/${b}`)));
      files.push(`/usr/share/doc/${n}`, `/usr/share/doc/${n}/changelog.Debian.gz`, `/usr/share/doc/${n}/copyright`);
      const conf = { nginx: ['/etc/nginx/nginx.conf', '/etc/nginx/sites-available/default'], apache2: ['/etc/apache2/apache2.conf', '/etc/apache2/ports.conf'], 'openssh-server': ['/etc/ssh/sshd_config'] }[n];
      if (conf) files.push(...conf);
      if (p && p.svc && LX.SERVICES[p.svc]) files.push(LX.SERVICES[p.svc].unit);
      c.out(files.join('\n') + '\n');
      return 0;
    }
    if (a === '-S' || a === '--search') {
      const f = rest[0] || '';
      const hit = Object.values(LX.PKGS).find((p) => m.state.pkgs[p.name] && Object.entries(p.bins).some(([d, l]) => l.some((b) => `${d}/${b}` === f || b === f || `${d}/${b}` === f.replace(/^\/bin\//, '/usr/bin/'))));
      if (!hit) { c.err(`dpkg-query: no path found matching pattern *${f}*\n`); return 1; }
      const d = Object.keys(hit.bins).find((dd) => hit.bins[dd].includes(P().basename(f)));
      c.out(`${hit.name}: ${d}/${P().basename(f)}\n`);
      return 0;
    }
    if (a === '--get-selections') { allInstalled.forEach((n) => c.out(`${n.padEnd(48)}install\n`)); return 0; }
    if (a === '-i' || a === '--install') {
      if (c.cred.uid !== 0) { c.err('dpkg: error: requested operation requires superuser privilege\n'); return 2; }
      const f = rest[0];
      if (!f || !c.fs.lookup(c.resolve(f))) { c.err(`dpkg: error: cannot access archive '${f}': No such file or directory\n`); return 1; }
      const n = ((/^(?:.*\/)?([a-z0-9.+-]+?)_/.exec(f) || [])[1]);
      if (!n || !LX.PKGS[n]) { c.err(`dpkg-deb: error: '${f}' is not a Debian format archive\n`); return 1; }
      c.out(`Selecting previously unselected package ${n}.\n(Reading database ... 84210 files and directories currently installed.)\nPreparing to unpack ${f} ...\nUnpacking ${n} (${LX.PKGS[n].ver}) ...\nSetting up ${n} (${LX.PKGS[n].ver}) ...\nProcessing triggers for man-db (2.12.0-4build2) ...\n`);
      LX.pkgFiles(m, n);
      if (LX.PKGS[n].svc) LX.svcStart(m, LX.PKGS[n].svc);
      return 0;
    }
    if (a === '-r' || a === '--remove' || a === '-P' || a === '--purge') {
      if (c.cred.uid !== 0) { c.err('dpkg: error: requested operation requires superuser privilege\n'); return 2; }
      const purge = /P|purge/.test(a);
      rest.forEach((n) => {
        if (!m.state.pkgs[n]) {
          if (purge && rc[n]) { c.out(`(Reading database ... 84210 files and directories currently installed.)\nPurging configuration files for ${n} (${rc[n]}) ...\n`); LX.pkgPurgeConf(m, n); return; }
          c.err(`dpkg: warning: ignoring request to remove ${n} which isn't installed\n`); return;
        }
        const ver = m.state.pkgs[n];
        c.out(`(Reading database ... 84210 files and directories currently installed.)\nRemoving ${n} (${ver}) ...\n`);
        if (LX.PKGS[n] && LX.PKGS[n].svc) LX.svcStop(m, LX.PKGS[n].svc);
        LX.pkgRemove(m, n, purge);
        if (purge && LX.pkgHasConf(n)) c.out(`Purging configuration files for ${n} (${ver}) ...\n`);
      });
      return 0;
    }
    if (a === '--version') { c.out('Debian \'dpkg\' package management program version 1.22.6 (amd64).\n'); return 0; }
    if (a === '-W' || a === '--show') { const re = rest[0] ? LX.glob.globToRe(rest[0], false) : null; allInstalled.filter((n) => !re || re.test(n)).forEach((n) => c.out(`${n}\t${m.state.pkgs[n]}\n`)); return 0; }
    c.err("dpkg: error: need an action option\n\nType dpkg --help for help about installing and deinstalling packages [*];\nUse 'apt' or 'aptitude' for user-friendly package management;\nType dpkg -Dhelp for a list of dpkg debug flag values;\nType dpkg --force-help for a list of forcing options;\nType dpkg-deb --help for help about manipulating *.deb files;\n\nOptions marked [*] produce a lot of output - pipe it through 'less' or 'more' !\n");
    return 2;
  });
  def('dpkg-reconfigure', async (c) => {
    if (c.cred.uid !== 0) { c.err('/usr/sbin/dpkg-reconfigure must be run as root\n'); return 1; }
    const n = c.args.filter((a) => !a.startsWith('-'))[0];
    if (n === 'tzdata') { c.out(`\nCurrent default time zone: '${c.m.state.timezone}'\nLocal time is now:      ${LX.strftime(c.m, '%a %b %e %H:%M:%S %Z %Y', c.m.now())}.\nUniversal Time is now:  ${LX.strftime(c.m, '%a %b %e %H:%M:%S UTC %Y', c.m.now(), true)}.\n\n`); c.err('\x1b[2m(가상 터미널: 대화형 화면 대신 timedatectl set-timezone 을 사용하세요)\x1b[0m\n'); return 0; }
    if (n === 'unattended-upgrades') { c.err('\x1b[2m(가상 터미널: /etc/apt/apt.conf.d/20auto-upgrades 파일을 직접 편집하세요)\x1b[0m\n'); return 0; }
    return 0;
  });

  def('unattended-upgrade', async (c) => {
    if (c.cred.uid !== 0) { c.err('You need to be root to run this application\n'); return 1; }
    const dry = c.args.includes('--dry-run');
    const dbg = c.args.includes('-d') || c.args.includes('--debug') || c.args.includes('-v');
    const m = c.m;
    const logLines = [];
    const say = (s) => { logLines.push(s); if (dbg) c.out(s + '\n'); };
    say('Starting unattended upgrades script');
    say('Allowed origins are: o=Ubuntu,a=noble, o=Ubuntu,a=noble-security, o=UbuntuESMApps,a=noble-apps-security, o=UbuntuESM,a=noble-infra-security');
    say('Initial blacklist: ');
    say('Initial whitelist (not strict): ');
    const sec = m.state.upgradable.filter((n) => /ssl|sudo|curl|python/.test(n) && !(m.state.held || {})[n]);
    if (!sec.length) say('No packages found that can be upgraded unattended and no pending auto-removals');
    else {
      say(`Packages that will be upgraded: ${sec.join(' ')}`);
      say(`Writing dpkg log to /var/log/unattended-upgrades/unattended-upgrades-dpkg.log`);
      if (dry) say('/usr/bin/dpkg --status-fd 10 --no-triggers --unpack --auto-deconfigure ... (dry-run)');
      else {
        const infos = sec.map((n) => Object.assign({ name: n }, upgInfo(m, n)));
        infos.forEach((u) => { if (m.state.pkgs[u.name]) m.state.pkgs[u.name] = u.nv; });
        m.state.upgradable = m.state.upgradable.filter((n) => !sec.includes(n));
        try { m.vfs.writeFile('/var/log/unattended-upgrades/unattended-upgrades-dpkg.log', `Log started: ${LX.strftime(m, '%Y-%m-%d  %H:%M:%S', m.now())}\n` + infos.map((u) => `Preparing to unpack .../${u.name}_${u.nv.replace(/^\d+:/, '')}_amd64.deb ...\nUnpacking ${u.name} (${u.nv}) over (${u.cur}) ...\nSetting up ${u.name} (${u.nv}) ...\n`).join('') + `Log ended: ${LX.strftime(m, '%Y-%m-%d  %H:%M:%S', m.now())}\n\n`, null, { append: true }); } catch (e) { /* 무시 */ }
        logApt(Object.assign({}, c, { name: '/usr/bin/unattended-upgrade', args: [] }), 'Upgrade', infos.map((u) => ({ name: u.name, ver: u.nv, old: u.cur })));
      }
      say('All upgrades installed');
    }
    const ts = LX.strftime(m, '%Y-%m-%d %H:%M:%S', m.now()) + ',' + String(m.now() % 1000).padStart(3, '0');
    if (!dry) { try { m.vfs.writeFile('/var/log/unattended-upgrades/unattended-upgrades.log', logLines.map((l) => `${ts} INFO ${l}\n`).join(''), null, { append: true }); } catch (e) { /* 무시 */ } }
    return 0;
  });

  // ======================================================================= snap
  const SNAPS = { 'hello-world': ['6.4', 29, 'Canonical✓', 'The \'hello-world\' of snaps'], lxd: ['5.21.3-c5ae129', 33110, 'Canonical✓', 'LXD - container and VM manager'], core22: ['20250315', 1908, 'Canonical✓', 'Runtime environment based on Ubuntu 22.04'], snapd: ['2.68.5', 24505, 'Canonical✓', 'Daemon and tooling that enable snap packages'], code: ['6f17636121', 202, 'vscode✓', 'Code editing. Redefined.'], 'microk8s': ['v1.32.3', 7964, 'Canonical✓', 'Kubernetes for workstations and appliances'], btop: ['1.4.4', 814, 'kz6fittycent', 'Resource monitor'], certbot: ['4.2.0', 4735, 'Certbot Project (certbot-eff✓)', 'Automatically configure HTTPS using Let\'s Encrypt'], docker: ['28.1.1+1', 3265, 'Canonical✓', 'Docker container runtime'], nextcloud: ['31.0.8snap1', 47930, 'Nextcloud✓', 'Nextcloud Server - A safe home for all your data'] };
  def('snap', async (c) => {
    const m = c.m;
    const [sub, ...rest] = c.args.filter((a) => !a.startsWith('--') || a === '--classic');
    const names = rest.filter((a) => !a.startsWith('-'));
    switch (sub) {
      case 'list': case undefined: {
        c.out('Name     Version          Rev    Tracking       Publisher   Notes\n');
        Object.keys(m.state.snaps).sort().forEach((n) => { const s = SNAPS[n] || [m.state.snaps[n], 1, '-', '']; c.out(`${n.padEnd(8)} ${String(s[0]).padEnd(16)} ${String(s[1]).padEnd(6)} latest/stable  ${s[2].replace(/\(.*\)/, '').trim().padEnd(11)} ${n === 'core22' ? 'base' : n === 'snapd' ? 'snapd' : '-'}\n`); });
        return 0;
      }
      case 'find': case 'search': {
        const kw = (names[0] || '').toLowerCase();
        c.out('Name         Version           Publisher        Notes    Summary\n');
        Object.entries(SNAPS).filter(([n, s]) => !kw || n.includes(kw) || s[3].toLowerCase().includes(kw)).forEach(([n, s]) => c.out(`${n.padEnd(12)} ${s[0].padEnd(17)} ${s[2].padEnd(16)} ${n === 'code' ? 'classic' : '-'.padEnd(7)}  ${s[3]}\n`));
        return 0;
      }
      case 'info': {
        const n = names[0];
        const s = SNAPS[n];
        if (!s) { c.err(`error: no snap found for "${n}"\n`); return 1; }
        c.out(`name:      ${n}\nsummary:   ${s[3]}\npublisher: ${s[2]}\nstore-url: https://snapcraft.io/${n}\nlicense:   unset\ndescription: |\n  ${s[3]}\nchannels:\n  latest/stable:    ${s[0]} ${LX.strftime(m, '%Y-%m-%d', m.now() - 864e6)} (${s[1]}) 20MB -\n${m.state.snaps[n] ? `installed:          ${s[0]}            (${s[1]}) 20MB -\n` : ''}`);
        return 0;
      }
      case 'install': case 'remove': case 'refresh': {
        if (c.cred.uid !== 0) { c.err(`error: access denied (try with sudo)\n`); return 1; }
        if (sub === 'refresh' && !names.length) { c.out('All snaps up to date.\n'); return 0; }
        const logChange = (n, what) => { const ch = m.state.snapChanges = m.state.snapChanges || []; ch.push({ id: (ch.length ? ch[ch.length - 1].id : 2) + 1, snap: n, t: m.now(), summary: `${what} "${n}" snap` }); if (ch.length > 20) ch.shift(); };
        for (const n of names) {
          const s = SNAPS[n];
          if (!s) { c.err(`error: snap "${n}" not found\n`); return 1; }
          if (sub === 'install' && !m.state.snaps[n] && !(n === 'code' && !c.args.includes('--classic'))) logChange(n, 'Install');
          if (sub === 'remove' && m.state.snaps[n]) logChange(n, 'Remove');
          if (sub === 'install') {
            if (m.state.snaps[n]) { c.err(`snap "${n}" is already installed, see 'snap help refresh'\n`); continue; }
            if (n === 'code' && !c.args.includes('--classic')) { c.err(`error: This revision of snap "${n}" was published using classic confinement and thus may perform\n       arbitrary system changes outside of the security sandbox that snaps are usually confined to,\n       which may put your system at risk.\n\n       If you understand and want to proceed repeat the command including --classic.\n`); return 1; }
            await slow(c, 800);
            m.state.snaps[n] = s[0];
            m.installBin(n, '/snap/bin', n === 'hello-world' ? 'hello-world' : 'snapapp');
            c.out(`${n} ${s[0]} from ${s[2]} installed\n`);
          } else if (sub === 'remove') {
            if (!m.state.snaps[n]) { c.err(`snap "${n}" is not installed\n`); continue; }
            delete m.state.snaps[n];
            try { c.fs.unlink('/snap/bin/' + n, null); } catch (e) { /* 없음 */ }
            c.out(`${n} removed\n`);
          } else c.out(`snap "${n}" has no updates available\n`);
        }
        return 0;
      }
      case 'version': c.out(`snap    2.68.5+ubuntu24.04\nsnapd   2.68.5+ubuntu24.04\nseries  16\nubuntu  24.04\nkernel  ${LX.OS.kernel}\n`); return 0;
      case 'services': c.out('Service  Startup  Current  Notes\n'); return 0;
      case 'changes': case 'tasks': {
        const ch = m.state.snapChanges || [];
        const when = (t) => { const d0 = LX.strftime(m, '%Y-%m-%d', m.now()), d1 = LX.strftime(m, '%Y-%m-%d', t); return `${d0 === d1 ? 'today' : d1 === LX.strftime(m, '%Y-%m-%d', m.now() - 864e5) ? 'yesterday' : LX.strftime(m, '%Y-%m-%d', t)} at ${LX.strftime(m, '%H:%M %Z', t)}`; };
        if (sub === 'tasks') {
          const x = ch.find((y) => String(y.id) === String(names[0])) || ch[ch.length - 1];
          if (!x) { c.err(`error: no changes found\n`); return 1; }
          c.out(table([['Status', 'Spawn', 'Ready', 'Summary'], ['Done', when(x.t), when(x.t + 3000), x.summary.replace(/^(\w+) "(.*)" snap$/, (_, v, n) => `${v === 'Install' ? 'Mount' : v === 'Remove' ? 'Remove data of' : 'Refresh'} snap "${n}"`)], ['Done', when(x.t), when(x.t + 3000), x.summary]]));
          return 0;
        }
        const list = ch.filter((x) => !names[0] || x.snap === names[0]);
        if (!list.length) { c.out(names[0] ? `no changes of type "${names[0]}" found\n` : 'no changes found\n'); return 0; }
        c.out(table([['ID', 'Status', 'Spawn', 'Ready', 'Summary']].concat(list.map((x) => [String(x.id), 'Done', when(x.t), when(x.t + 3000), x.summary]))) + '\n');
        return 0;
      }
      default: c.err(`error: unknown command "${sub}", see 'snap help'.\n`); return 1;
    }
  });
  def('hello-world', async (c) => { c.out('Hello World!\n'); return 0; });
  def('snapapp', async (c) => { c.err(`${c.name}: 가상 터미널에서는 이 snap 앱을 실행할 수 없습니다. 실제 Ubuntu 에서 실행해 보세요.\n`); return 1; });

  // ======================================================================= 디스크 · 파일 시스템
  const DEVNUM = { sda: '8:0', sdb: '8:16', sdc: '8:32', sr0: '11:0' };
  function sizeStr(mb) {
    if (mb >= 1024) { const g = mb / 1024; return (g >= 10 || Number.isInteger(g) ? (Math.round(g * 10) / 10).toString().replace(/\.0$/, '') : g.toFixed(1)) + 'G'; }
    return (mb >= 10 ? Math.round(mb) : mb.toFixed(1).replace(/\.0$/, '')) + 'M';
  }
  LX.sizeStr = sizeStr;
  function randUuid() { const h = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0'); return `${h()}${h()}-${h()}-4${h().slice(1)}-a${h().slice(1)}-${h()}${h()}${h()}`; }

  /** 블록 장치 이름 → { kind, obj } */
  function blockDev(m, dev) {
    dev = String(dev).replace(/^\/dev\//, '');
    let r = /^mapper\/((?:[^-]|--)+)-((?:[^-]|--)+)$/.exec(dev);
    if (r || /^[\w-]+\/[\w-]+$/.test(dev)) {
      let vg, lv;
      if (r) { vg = r[1].replace(/--/g, '-'); lv = r[2].replace(/--/g, '-'); } else [vg, lv] = dev.split('/');
      const v = m.state.vgs[vg];
      if (v && v.lvs[lv]) return { kind: 'lv', obj: v.lvs[lv], vg, lv, path: `/dev/mapper/${vg.replace(/-/g, '--')}-${lv.replace(/-/g, '--')}` };
      return null;
    }
    if (m.state.disks[dev]) return { kind: 'disk', obj: m.state.disks[dev], name: dev, path: '/dev/' + dev };
    for (const [dn, d] of Object.entries(m.state.disks)) {
      const p = (d.parts || []).find((x) => x.name === dev);
      if (p) return { kind: 'part', obj: p, disk: dn, name: dev, path: '/dev/' + dev };
    }
    return null;
  }
  LX.blockDev = blockDev;
  function mountOf(m, path) { return m.state.mounts.find((x) => x.dev === path || (x.devAlt && x.devAlt === path)); }
  function devByUuid(m, uuid) {
    for (const [dn, d] of Object.entries(m.state.disks)) {
      for (const p of d.parts || []) if (p.uuid === uuid) return '/dev/' + p.name;
    }
    for (const [vg, v] of Object.entries(m.state.vgs)) for (const [lv, l] of Object.entries(v.lvs)) if (l.uuid === uuid) return `/dev/mapper/${vg.replace(/-/g, '--')}-${lv.replace(/-/g, '--')}`;
    return null;
  }
  LX.devByUuid = devByUuid;

  def('lsblk', async (c) => {
    const m = c.m;
    const f = c.args.includes('-f') || c.args.includes('--fs');
    const all = [];
    const lvsOn = (pvPath) => {
      const out = [];
      for (const [vg, v] of Object.entries(m.state.vgs)) if (v.pvs.includes(pvPath)) Object.entries(v.lvs).forEach(([lv, l]) => out.push({ name: `${vg.replace(/-/g, '--')}-${lv.replace(/-/g, '--')}`, maj: '252:' + Object.keys(v.lvs).indexOf(lv), size: l.size, type: 'lvm', mnt: (mountOf(m, `/dev/mapper/${vg.replace(/-/g, '--')}-${lv.replace(/-/g, '--')}`) || {}).dir, fs: l.fs, uuid: l.uuid, label: l.label }));
      return out;
    };
    for (const [dn, d] of Object.entries(m.state.disks)) {
      const kids = (d.parts || []).map((p, i) => ({ name: p.name, maj: `${(DEVNUM[dn] || '8:0').split(':')[0]}:${+(DEVNUM[dn] || '8:0').split(':')[1] + i + 1}`, size: p.size, type: 'part', mnt: p.swap ? '[SWAP]' : (mountOf(m, '/dev/' + p.name) || {}).dir, fs: p.lvm ? 'LVM2_member' : p.pv ? 'LVM2_member' : p.swap ? 'swap' : p.fs, uuid: p.uuid, label: p.label, kids: lvsOn('/dev/' + p.name) }));
      all.push({ name: dn, maj: DEVNUM[dn] || '8:48', size: d.size, type: d.rom ? 'rom' : 'disk', rm: d.rom ? 1 : 0, mnt: (mountOf(m, '/dev/' + dn) || {}).dir, fs: d.rom ? 'iso9660' : d.pv ? 'LVM2_member' : d.fs, label: d.label, uuid: d.uuid, kids: kids.length ? kids : lvsOn('/dev/' + dn) });
    }
    const rows = [];
    const walk = (n, prefix, last, depth) => {
      rows.push(Object.assign({}, n, { tree: depth === 0 ? n.name : prefix + (last ? '└─' : '├─') + n.name }));
      (n.kids || []).forEach((k, i) => walk(k, depth === 0 ? '' : prefix + (last ? '  ' : '│ '), i === n.kids.length - 1, depth + 1));
    };
    all.forEach((n) => walk(n, '', true, 0));
    const w = Math.max(4, ...rows.map((r) => r.tree.length));
    if (f) {
      c.out(`${'NAME'.padEnd(w)} FSTYPE      FSVER    LABEL                           UUID                                   FSAVAIL FSUSE% MOUNTPOINTS\n`);
      rows.forEach((r) => {
        const mnt = r.mnt && r.mnt !== '[SWAP]' ? m.state.mounts.find((x) => x.dir === r.mnt) : null;
        const avail = mnt ? sizeStr(Math.max(0, mnt.size - mnt.used)) : '';
        const use = mnt ? Math.round(mnt.used / mnt.size * 100) + '%' : '';
        c.out(`${r.tree.padEnd(w)} ${(r.fs || '').padEnd(11)} ${(r.fs === 'ext4' ? '1.0' : r.fs === 'LVM2_member' ? 'LVM2 001' : r.fs === 'swap' ? '1' : r.fs === 'iso9660' ? 'Joliet Extension' : '').padEnd(8)} ${(r.label || '').padEnd(31)} ${(r.uuid || '').padEnd(38)} ${avail.padStart(7)} ${use.padStart(6)} ${r.mnt || ''}\n`);
      });
      return 0;
    }
    c.out(`${'NAME'.padEnd(w)} MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\n`);
    rows.forEach((r) => c.out(`${r.tree.padEnd(w)} ${r.maj.padStart(7)} ${String(r.rm || 0).padStart(2)} ${sizeStr(r.size).padStart(5)}  ${r.type === 'rom' ? 1 : 0} ${r.type.padEnd(4)} ${r.mnt || ''}\n`));
    return 0;
  });

  def('blkid', async (c) => {
    if (c.cred.uid !== 0 && !c.args.length) { /* 캐시된 정보만 */ }
    const m = c.m;
    const out = [];
    for (const [dn, d] of Object.entries(m.state.disks)) {
      if (d.rom) { out.push(`/dev/${dn}: BLOCK_SIZE="2048" UUID="2025-08-05-10-49-11-00" LABEL="${d.label}" TYPE="iso9660" PTTYPE="PMBR"`); continue; }
      if (d.fs) out.push(`/dev/${dn}: UUID="${d.uuid}" BLOCK_SIZE="4096" TYPE="${d.fs}"`);
      if (d.pv) out.push(`/dev/${dn}: UUID="${d.pvUuid || 'Pv1-x'}" TYPE="LVM2_member"`);
      else if (d.parts && d.parts.length && d.label) out.push(`/dev/${dn}: PTUUID="${d.ptuuid || '7a1b'}" PTTYPE="${d.label === 'gpt' ? 'gpt' : 'dos'}"`);
      for (const p of d.parts || []) {
        if (p.type === 'bios_grub') { out.push(`/dev/${p.name}: PARTUUID="4a6f8c2e-01"`); continue; }
        if (p.lvm || p.pv) { out.push(`/dev/${p.name}: UUID="${p.pvUuid || 'Xk3pQ2-7vRb-9dLm-2Wq4-hT6n-Yc1z-Ab5eFd'}" TYPE="LVM2_member" PARTUUID="${p.partuuid || '4a6f8c2e-03'}"`); continue; }
        if (p.swap) { out.push(`/dev/${p.name}: UUID="${p.uuid}" TYPE="swap" PARTUUID="${p.partuuid || '0f2d-01'}"`); continue; }
        if (p.fs) out.push(`/dev/${p.name}: ${p.label ? `LABEL="${p.label}" ` : ''}UUID="${p.uuid}" BLOCK_SIZE="4096" TYPE="${p.fs}" PARTUUID="${p.partuuid || '0f2d-0' + p.name.slice(-1)}"`);
        else out.push(`/dev/${p.name}: PARTUUID="${p.partuuid || '0f2d-0' + p.name.slice(-1)}"`);
      }
    }
    for (const [vg, v] of Object.entries(m.state.vgs)) for (const [lv, l] of Object.entries(v.lvs)) if (l.fs) out.push(`/dev/mapper/${vg.replace(/-/g, '--')}-${lv.replace(/-/g, '--')}: ${l.label ? `LABEL="${l.label}" ` : ''}UUID="${l.uuid}" BLOCK_SIZE="4096" TYPE="${l.fs}"`);
    // 옵션: -s 태그 (여러 번), -o value|export|full, -U UUID 로 찾기, -L LABEL 로 찾기
    const tags = [];
    let fmt = 'full', byUuid = null, byLabel = null;
    const want = [];
    for (let i = 0; i < c.args.length; i++) {
      const a = c.args[i];
      if (a === '-s' || a === '--match-tag') tags.push(c.args[++i]);
      else if (/^-s./.test(a)) tags.push(a.slice(2));
      else if (a === '-o' || a === '--output') fmt = c.args[++i];
      else if (/^-o./.test(a)) fmt = a.slice(2);
      else if (a === '-U') byUuid = c.args[++i];
      else if (a === '-L') byLabel = c.args[++i];
      else if (!a.startsWith('-')) want.push(a);
    }
    let list = want.length ? out.filter((l) => want.some((w) => l.startsWith(w + ':'))) : out;
    if (byUuid || byLabel) {
      const hit = list.find((l) => (byUuid && l.includes(` UUID="${byUuid}"`)) || (byLabel && l.includes(`LABEL="${byLabel}"`)));
      if (!hit) return 2;
      c.out(hit.split(':')[0] + '\n');
      return 0;
    }
    if (!list.length) return 2;
    const parse = (l) => { const dev = l.slice(0, l.indexOf(':')); const kv = {}; l.replace(/(\w+)="([^"]*)"/g, (mm, k, v) => { kv[k] = v; }); return { dev, kv }; };
    if (tags.length || fmt !== 'full') {
      const lines = [];
      list.map(parse).forEach(({ dev, kv }) => {
        const keys = (tags.length ? tags : Object.keys(kv)).filter((k) => kv[k] != null);
        if (!keys.length) return;
        if (fmt === 'value') keys.forEach((k) => lines.push(kv[k]));
        else if (fmt === 'export') { lines.push(`DEVNAME=${dev}`); keys.forEach((k) => lines.push(`${k}=${kv[k]}`)); lines.push(''); }
        else lines.push(`${dev}: ${keys.map((k) => `${k}="${kv[k]}"`).join(' ')}`);
      });
      if (!lines.length) return 2;
      c.out(lines.join('\n').replace(/\n+$/, '') + '\n');
      return 0;
    }
    c.out(list.join('\n') + '\n');
    return 0;
  });

  function diskInfo(m, dn) {
    const d = m.state.disks[dn];
    const bytes = d.size * 1048576;
    let out = `Disk /dev/${dn}: ${(d.size / 1024).toFixed(0)} GiB, ${bytes} bytes, ${bytes / 512} sectors\nDisk model: ${d.model}\nUnits: sectors of 1 * 512 = 512 bytes\nSector size (logical/physical): 512 bytes / 512 bytes\nI/O size (minimum/optimal): 512 bytes / 512 bytes\n`;
    if (d.label || (d.parts && d.parts.length)) {
      out += `Disklabel type: ${d.label === 'dos' ? 'dos' : 'gpt'}\nDisk identifier: ${d.label === 'dos' ? '0x7a1b3c5d' : 'E3C1A2B4-5D6F-4A7B-8C9D-0E1F2A3B4C5D'}\n\n`;
      if (d.parts && d.parts.length) {
        out += `Device       Start      End  Sectors  Size Type\n`;
        let start = 2048;
        d.parts.forEach((p) => {
          const sec = p.size * 2048;
          out += `/dev/${p.name.padEnd(7)} ${String(start).padStart(7)} ${String(start + sec - 1).padStart(9)} ${String(sec).padStart(8)} ${sizeStr(p.size).padStart(5)} ${p.type === 'bios_grub' ? 'BIOS boot' : p.lvm || p.pv ? 'Linux LVM' : p.swap ? 'Linux swap' : 'Linux filesystem'}\n`;
          start += sec;
        });
      }
    }
    return out;
  }

  def('fdisk', async (c) => {
    const m = c.m;
    if (c.args.includes('-l')) {
      if (c.cred.uid !== 0) { c.err('fdisk: cannot open /dev/sda: Permission denied\n'); return 1; }
      const want = c.args.filter((a) => a.startsWith('/dev/')).map((a) => a.slice(5));
      const list = (want.length ? want : Object.keys(m.state.disks)).filter((d) => m.state.disks[d] && !m.state.disks[d].rom);
      c.out(list.map((d) => diskInfo(m, d)).join('\n') + '\n');
      for (const [vg, v] of Object.entries(m.state.vgs)) for (const [lv, l] of Object.entries(v.lvs)) if (!want.length) c.out(`\nDisk /dev/mapper/${vg.replace(/-/g, '--')}-${lv.replace(/-/g, '--')}: ${sizeStr(l.size).replace(/([GM])$/, ' $1iB')}, ${l.size * 1048576} bytes, ${l.size * 2048} sectors\nUnits: sectors of 1 * 512 = 512 bytes\nSector size (logical/physical): 512 bytes / 512 bytes\nI/O size (minimum/optimal): 512 bytes / 512 bytes\n`);
      return 0;
    }
    const dev = c.args.find((a) => a.startsWith('/dev/'));
    if (!dev) { c.err('Usage:\n fdisk [options] <disk>         change partition table\n fdisk [options] -l [<disk>...] list partition table(s)\n'); return 1; }
    if (c.cred.uid !== 0) { c.err(`fdisk: cannot open ${dev}: Permission denied\n`); return 1; }
    const b = blockDev(m, dev);
    if (!b || b.kind !== 'disk') { c.err(`fdisk: cannot open ${dev}: No such file or directory\n`); return 1; }
    const d = b.obj;
    const dn = b.name;
    const draft = JSON.parse(JSON.stringify({ parts: d.parts || [], label: d.label }));
    c.out('\nWelcome to fdisk (util-linux 2.39.3).\nChanges will remain in memory only, until you decide to write them.\nBe careful before using the write command.\n\n');
    if (!draft.label) c.out(`Device does not contain a recognized partition table.\nCreated a new DOS (MBR) disklabel with disk identifier 0x7a1b3c5d.\n`), draft.label = 'dos';
    let empties = 0;
    for (;;) {
      const cmd = await c.readLine('\nCommand (m for help): ', { tty: true });
      if (cmd == null) { c.out('\n'); return 1; }
      const k = cmd.trim();
      if (!k) { if (++empties > 5) return 1; continue; }
      empties = 0;
      if (k === 'm') { c.out('\nHelp:\n\n  DOS (MBR)\n   a   toggle a bootable flag\n\n  Generic\n   d   delete a partition\n   F   list free unpartitioned space\n   l   list known partition types\n   n   add a new partition\n   p   print the partition table\n   t   change a partition type\n\n  Save & Exit\n   w   write table to disk and exit\n   q   quit without saving changes\n\n  Create a new label\n   g   create a new empty GPT partition table\n   o   create a new empty MBR (DOS) partition table\n'); continue; }
      if (k === 'p') { c.out(diskInfo({ state: { disks: { [dn]: Object.assign({}, d, draft) } } }, dn)); continue; }
      if (k === 'g' || k === 'o') { draft.label = k === 'g' ? 'gpt' : 'dos'; draft.parts = []; c.out(`Created a new ${k === 'g' ? 'GPT' : 'DOS (MBR)'} disklabel with disk identifier ${k === 'g' ? 'E3C1A2B4-5D6F-4A7B-8C9D-0E1F2A3B4C5D' : '0x7a1b3c5d'}.\n`); continue; }
      if (k === 'q') return 0;
      if (k === 'd') {
        if (!draft.parts.length) { c.out('No partition is defined yet!\n'); continue; }
        const n = draft.parts.length === 1 ? 1 : +(await c.readLine(`Partition number (1-${draft.parts.length}, default ${draft.parts.length}): `, { tty: true }) || draft.parts.length);
        draft.parts.splice(n - 1, 1);
        c.out(`\nPartition ${n} has been deleted.\n`);
        continue;
      }
      if (k === 'n') {
        const used = draft.parts.reduce((a, p) => a + p.size, 0);
        const free = d.size - used - 1;
        if (free <= 0) { c.out('No free sectors available.\n'); continue; }
        if (draft.label === 'dos') {
          c.out(`Partition type\n   p   primary (${draft.parts.length} primary, 0 extended, ${4 - draft.parts.length} free)\n   e   extended (container for logical partitions)\n`);
          await c.readLine('Select (default p): ', { tty: true });
        }
        const num = draft.parts.length + 1;
        await c.readLine(`Partition number (${num}-${draft.label === 'dos' ? 4 : 128}, default ${num}): `, { tty: true });
        const startSec = 2048 + used * 2048;
        await c.readLine(`First sector (${startSec}-${d.size * 2048 - 34}, default ${startSec}): `, { tty: true });
        const last = (await c.readLine(`Last sector, +/-sectors or +/-size{K,M,G,T,P} (${startSec}-${d.size * 2048 - 34}, default ${d.size * 2048 - 34}): `, { tty: true }) || '').trim();
        let size = free;
        const r = /^\+(\d+(?:\.\d+)?)([KMGT])$/i.exec(last);
        if (r) size = Math.min(free, Math.round(+r[1] * { K: 1 / 1024, M: 1, G: 1024, T: 1048576 }[r[2].toUpperCase()]));
        draft.parts.push({ name: dn + num, size });
        c.out(`\nCreated a new partition ${num} of type 'Linux' and of size ${sizeStr(size).replace(/([GM])$/, ' $1iB')}.\n`);
        continue;
      }
      if (k === 't') { await c.readLine('Partition type or alias (type L to list all): ', { tty: true }); c.out("Changed type of partition 'Linux' to 'Linux LVM'.\n"); if (draft.parts.length) draft.parts[draft.parts.length - 1].lvmType = true; continue; }
      if (k === 'F') { const used = draft.parts.reduce((a, p) => a + p.size, 0); c.out(`Unpartitioned space /dev/${dn}: ${sizeStr(d.size - used)}\n`); continue; }
      if (k === 'w') {
        d.label = draft.label;
        d.parts = draft.parts.map((p) => Object.assign({ uuid: null }, (d.parts || []).find((x) => x.name === p.name && x.size === p.size) || {}, p));
        LX.syncDevices(m);
        c.out('The partition table has been altered.\nCalling ioctl() to re-read partition table.\nSyncing disks.\n');
        return 0;
      }
      c.out(`${k}: unknown command\n`);
    }
  });

  function parsePos(s, total) {
    s = String(s);
    let r;
    if ((r = /^(\d+(?:\.\d+)?)%$/.exec(s))) return total * +r[1] / 100;
    if ((r = /^(\d+(?:\.\d+)?)(MiB|MB|M|GiB|GB|G|KiB|kB|TB|TiB)?$/i.exec(s))) {
      const u = (r[2] || 'MB').toUpperCase();
      return +r[1] * ({ MIB: 1, MB: 0.9537, M: 1, GIB: 1024, GB: 953.7, G: 1024, KIB: 1 / 1024, KB: 1 / 1024, TB: 953674, TIB: 1048576 }[u] || 1);
    }
    return null;
  }

  def(['parted', 'partprobe'], async (c) => {
    const m = c.m;
    if (c.name === 'partprobe') return 0;
    const args = c.args.filter((a) => a !== '-s' && a !== '--script' && a !== '-a' && a !== 'optimal');
    if (args[0] === '-l' || args[0] === '--list') { Object.keys(m.state.disks).filter((d) => !m.state.disks[d].rom).forEach((d) => printParted(c, d)); return 0; }
    const dev = args.shift();
    if (!dev) { c.err('\x1b[2m(가상 터미널: 대화형 parted 대신 명령을 한 줄로 입력하세요. 예: sudo parted /dev/sdb --script mklabel gpt mkpart primary ext4 0% 100%)\x1b[0m\n'); return 1; }
    const b = blockDev(m, dev);
    if (!b || b.kind !== 'disk') { c.err(`Error: Could not stat device ${dev} - No such file or directory.\n`); return 1; }
    if (c.cred.uid !== 0) { c.err(`Error: Error opening ${dev}: Permission denied\n`); return 1; }
    const d = b.obj;
    if (!args.length) { c.err('\x1b[2m(가상 터미널: 대화형 모드는 지원하지 않습니다. print, mklabel, mkpart, rm 명령을 함께 입력하세요)\x1b[0m\n'); return 1; }
    while (args.length) {
      const cmd = args.shift();
      if (cmd === 'print' || cmd === 'p') { printParted(c, b.name); continue; }
      if (cmd === 'mklabel') {
        const t = args.shift();
        if (!/^(gpt|msdos)$/.test(t)) { c.err(`Error: Unrecognised disk label type: ${t}\n`); return 1; }
        if (d.parts && d.parts.some((p) => mountOf(m, '/dev/' + p.name))) { c.err(`Error: Partition(s) on ${dev} are being used.\n`); return 1; }
        d.label = t === 'msdos' ? 'dos' : 'gpt';
        d.parts = [];
        continue;
      }
      if (cmd === 'mkpart') {
        let ptype = args[0];
        if (/^(primary|logical|extended)$/.test(ptype) || d.label === 'gpt' && !/^\d|%$/.test(ptype)) args.shift(); else ptype = 'primary';
        if (args[0] && /^(ext[234]|xfs|linux-swap|fat32|btrfs)$/.test(args[0])) args.shift();
        const s = parsePos(args.shift(), d.size), e = parsePos(args.shift(), d.size);
        if (s == null || e == null) { c.err('Error: Invalid number.\n'); return 1; }
        const used = (d.parts || []).reduce((a, p) => a + p.size, 0);
        const size = Math.max(1, Math.min(d.size - used, Math.round(e - Math.max(s, 1))));
        if (size <= 0 || used >= d.size - 1) { c.err('Error: Can\'t have overlapping partitions.\n'); return 1; }
        d.label = d.label || 'gpt';
        d.parts = d.parts || [];
        d.parts.push({ name: b.name + (d.parts.length + 1), size, uuid: null });
        continue;
      }
      if (cmd === 'rm') {
        const n = +args.shift();
        if (!d.parts || !d.parts[n - 1]) { c.err(`Error: Partition doesn't exist.\n`); return 1; }
        d.parts.splice(n - 1, 1);
        d.parts.forEach((p, i) => { p.name = b.name + (i + 1); });
        continue;
      }
      if (cmd === 'set' || cmd === 'name' || cmd === 'unit' || cmd === 'align-check') { args.splice(0, cmd === 'set' ? 3 : cmd === 'align-check' ? 2 : 2); continue; }
      c.err(`Error: Unknown command ${cmd}\n`);
      return 1;
    }
    LX.syncDevices(m);
    c.err('Information: You may need to update /etc/fstab.\n\n');
    return 0;
  });
  function printParted(c, dn) {
    const d = c.m.state.disks[dn];
    let out = `Model: ATA ${d.model} (scsi)\nDisk /dev/${dn}: ${(d.size * 1.048576 / 1000).toFixed(1)}GB\nSector size (logical/physical): 512B/512B\nPartition Table: ${d.label === 'dos' ? 'msdos' : d.label || 'unknown'}\nDisk Flags: \n\n`;
    if (d.parts && d.parts.length) {
      out += 'Number  Start   End     Size    File system     Name  Flags\n';
      let s = 1.05;
      d.parts.forEach((p, i) => { const sz = p.size * 1.048576; out += ` ${i + 1}      ${fmtGB(s).padEnd(7)} ${fmtGB(s + sz).padEnd(7)} ${fmtGB(sz).padEnd(7)} ${(p.swap ? 'linux-swap(v1)' : p.fs || '').padEnd(15)}       ${p.lvm || p.pv ? 'lvm' : p.type === 'bios_grub' ? 'bios_grub' : ''}\n`; s += sz; });
    }
    c.out(out + '\n');
  }
  function fmtGB(mb) { return mb >= 1000 ? (mb / 1000).toFixed(1) + 'GB' : mb.toFixed(1) + 'MB'; }

  function newFsRoot(m) {
    const root = { t: 'd', m: 0o755, u: 0, g: 0, mt: m.now(), k: {} };
    root.k['lost+found'] = { t: 'd', m: 0o700, u: 0, g: 0, mt: m.now(), k: {} };
    return root;
  }

  def(['mkfs.ext4', 'mkfs.ext3', 'mkfs.ext2', 'mke2fs', 'mkfs.xfs', 'mkfs.vfat', 'mkfs.fat', 'mkfs.btrfs', 'mkfs'], async (c) => {
    const m = c.m;
    let fs = c.name === 'mkfs' ? 'ext2' : c.name.replace(/^mkfs\./, '').replace('mke2fs', 'ext4').replace('fat', 'vfat').replace('vvfat', 'vfat');
    const args = c.args.slice();
    let label = null, force = false;
    const ops = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-t') fs = args[++i];
      else if (args[i] === '-L' || args[i] === '-n') label = args[++i];
      else if (args[i] === '-F' || args[i] === '-f') force = true;
      else if (args[i].startsWith('-')) { if (/^-(b|i|I|m|N|O|E)$/.test(args[i])) i++; }
      else ops.push(args[i]);
    }
    const dev = ops[0];
    if (!dev) { c.err(`Usage: ${c.name} [-c|-l filename] [-b block-size] [-C cluster-size]\n\t[-i bytes-per-inode] [-I inode-size] [-J journal-options]\n\t[-L volume-label] [-M last-mounted-directory] [-t fs-type] device\n`); return 1; }
    const b = blockDev(m, dev);
    if (!b) {
      // 파일에 만들기 (루프 이미지)
      const n = c.fs.lookup(c.resolve(dev));
      if (n && n.t === 'f') { n.fsImage = fs; c.out(`mke2fs 1.47.0 (5-Feb-2023)\nDiscarding device blocks: done\nCreating filesystem with ${Math.round((n.sz || 1048576) / 4096)} 4k blocks and 65536 inodes\n\nAllocating group tables: done\nWriting inode tables: done\nCreating journal (4096 blocks): done\nWriting superblocks and filesystem accounting information: done\n\n`); return 0; }
      c.err(`mke2fs 1.47.0 (5-Feb-2023)\nThe file ${dev} does not exist and no size was specified.\n`);
      return 1;
    }
    if (c.cred.uid !== 0) { c.err(`mke2fs 1.47.0 (5-Feb-2023)\nCould not open ${dev}: Permission denied\n`); return 1; }
    if (mountOf(m, b.path)) { c.err(`mke2fs 1.47.0 (5-Feb-2023)\n${dev} contains a ${b.obj.fs} file system\n\tlast mounted on ${mountOf(m, b.path).dir}\n${dev} is mounted; will not make a filesystem here!\n`); return 1; }
    if (b.kind === 'disk' && b.obj.parts && b.obj.parts.length && !force) {
      c.out(`mke2fs 1.47.0 (5-Feb-2023)\nFound a ${b.obj.label === 'dos' ? 'dos' : 'gpt'} partition table in ${dev}\n`);
      const a = await c.readLine('Proceed anyway? (y,N) ', { tty: true });
      if (!/^y/i.test(a || '')) return 1;
    }
    if (b.obj.fs && !force && /^ext/.test(fs)) {
      c.out(`mke2fs 1.47.0 (5-Feb-2023)\n${dev} contains a ${b.obj.fs} file system${b.obj.label ? ` labelled '${b.obj.label}'` : ''}\n\tcreated on ${LX.strftime(m, '%a %b %e %H:%M:%S %Y', b.obj.created || m.now())}\n`);
      const a = await c.readLine('Proceed anyway? (y,N) ', { tty: true });
      if (!/^y/i.test(a || '')) return 1;
    }
    if (b.obj.fs && !force && fs === 'xfs') { c.err(`mkfs.xfs: ${dev} appears to contain an existing filesystem (${b.obj.fs}).\nmkfs.xfs: Use the -f option to force overwrite.\n`); return 1; }
    const o = b.obj;
    o.fs = fs === 'vfat' ? 'vfat' : fs;
    o.uuid = fs === 'vfat' ? Math.random().toString(16).slice(2, 6).toUpperCase() + '-' + Math.random().toString(16).slice(2, 6).toUpperCase() : randUuid();
    o.label = label;
    o.created = m.now();
    delete o.swap; delete o.pv;
    m.state.fsdata = m.state.fsdata || {};
    m.state.fsdata[o.uuid] = newFsRoot(m);
    const blocks = Math.round(o.size * 256);
    if (/^ext/.test(fs)) {
      c.out(`mke2fs 1.47.0 (5-Feb-2023)\n${b.kind === 'disk' && o.size > 1024 ? '' : ''}Discarding device blocks: done                            \nCreating filesystem with ${blocks} 4k blocks and ${Math.round(blocks / 4)} inodes\nFilesystem UUID: ${o.uuid}\nSuperblock backups stored on blocks: \n\t32768, 98304, 163840, 229376, 294912, 819200, 884736, 1605632\n\nAllocating group tables: done                            \nWriting inode tables: done                            \n${fs === 'ext2' ? '' : 'Creating journal (16384 blocks): done\n'}Writing superblocks and filesystem accounting information: done   \n\n`);
    } else if (fs === 'xfs') {
      c.out(`meta-data=${dev.padEnd(21)} isize=512    agcount=4, agsize=${Math.round(blocks / 4)} blks\n         =                       sectsz=512   attr=2, projid32bit=1\n         =                       crc=1        finobt=1, sparse=1, rmapbt=1\n         =                       reflink=1    bigtime=1 inobtcount=1 nrext64=0\ndata     =                       bsize=4096   blocks=${blocks}, imaxpct=25\n         =                       sunit=0      swidth=0 blks\nnaming   =version 2              bsize=4096   ascii-ci=0, ftype=1\nlog      =internal log           bsize=4096   blocks=16384, version=2\n         =                       sectsz=512   sunit=0 blks, lazy-count=1\nrealtime =none                   extsz=4096   blocks=0, rtextents=0\nDiscarding blocks...Done.\n`);
    } else c.out(`mkfs.fat 4.2 (2021-01-31)\n`);
    return 0;
  });

  def('mkswap', async (c) => {
    const target = c.args.filter((a) => !a.startsWith('-'))[0];
    if (!target) { c.err('mkswap: no device specified\n'); return 1; }
    const b = blockDev(c.m, target);
    const uuid = randUuid();
    if (b) {
      if (c.cred.uid !== 0) { c.err(`mkswap: cannot open ${target}: Permission denied\n`); return 1; }
      b.obj.swap = true; b.obj.fs = null; b.obj.uuid = uuid;
      c.out(`Setting up swapspace version 1, size = ${sizeStr(b.obj.size).replace(/([GM])$/, ' $1iB')} (${b.obj.size * 1048576 - 4096} bytes)\nno label, UUID=${uuid}\n`);
      return 0;
    }
    const abs = c.resolve(target);
    const n = c.fs.lookup(abs);
    if (!n) { c.err(`mkswap: cannot open ${target}: No such file or directory\n`); return 1; }
    if (c.cred.uid !== 0 && n.u !== c.cred.uid) { c.err(`mkswap: cannot open ${target}: Permission denied\n`); return 1; }
    if ((n.m & 0o077) !== 0) c.err(`mkswap: ${target}: insecure permissions 0${(n.m & 0o777).toString(8)}, fix with: chmod 0600 ${target}\n`);
    const bytes = n.sz || LX.byteLen(n.c);
    if (bytes < 40960) { c.err(`mkswap: error: swap area needs to be at least 40 KiB\n`); return 1; }
    n.swapSig = uuid;
    c.out(`Setting up swapspace version 1, size = ${LX.human(bytes - 4096).replace(/([KMG])$/, ' $1iB')} (${bytes - 4096} bytes)\nno label, UUID=${uuid}\n`);
    c.fs.touchChanged();
    return 0;
  });

  def(['swapon', 'swapoff'], async (c) => {
    const m = c.m;
    const on = c.name === 'swapon';
    const showArg = c.args.includes('--show') || c.args.includes('-s') || (on && !c.args.length);
    if (showArg) {
      const list = m.state.swaps.filter((s) => s.on !== false);
      if (!list.length) return 0;
      if (c.args.includes('-s')) { c.out('Filename\t\t\t\tType\t\tSize\t\tUsed\t\tPriority\n' + list.map((s, i) => `${s.file.padEnd(40)}${s.type}\t\t${s.size * 1024}\t\t0\t\t${-2 - i}`).join('\n') + '\n'); return 0; }
      c.out('NAME      TYPE SIZE USED PRIO\n' + list.map((s, i) => `${s.file.padEnd(9)} ${s.type.padEnd(4)} ${sizeStr(s.size).padStart(4)}   0B   ${-2 - i}`).join('\n') + '\n');
      return 0;
    }
    if (c.cred.uid !== 0) { c.err(`${c.name}: ${c.args[0] || ''}: ${on ? 'swapon' : 'swapoff'} failed: Operation not permitted\n`); return 1; }
    const all = c.args.includes('-a');
    const targets = c.args.filter((a) => !a.startsWith('-'));
    if (all) {
      if (on) {
        let fstab = '';
        try { fstab = c.fs.readFile('/etc/fstab', null); } catch (e) { /* 없음 */ }
        fstab.split('\n').forEach((l) => { const f = l.replace(/#.*/, '').trim().split(/\s+/); if (f[2] === 'swap' && f[0]) targets.push(f[0]); });
      } else m.state.swaps.forEach((s) => targets.push(s.file));
    }
    for (const t of targets) {
      let file = t.startsWith('UUID=') ? (LX.devByUuid(m, t.slice(5)) || t) : t;
      const b = blockDev(m, file);
      const abs = b ? b.path : c.resolve(file);
      const exist = m.state.swaps.find((s) => s.file === abs);
      if (!on) { if (!exist) { if (!all) { c.err(`swapoff: ${t}: swapoff failed: Invalid argument\n`); return 1; } continue; } exist.on = false; m.state.swaps = m.state.swaps.filter((s) => s !== exist || s.file === '/swap.img'); continue; }
      if (exist && exist.on !== false) { if (!all) { c.err(`swapon: ${abs}: swapon failed: Device or resource busy\n`); return 1; } continue; }
      if (b) {
        if (!b.obj.swap) { c.err(`swapon: ${abs}: read swap header failed\n`); return 1; }
        m.state.swaps.push({ file: abs, size: b.obj.size, type: 'partition' });
        continue;
      }
      const n = c.fs.lookup(abs);
      if (!n) { c.err(`swapon: cannot open ${t}: No such file or directory\n`); return 1; }
      if ((n.m & 0o077) !== 0) c.err(`swapon: ${t}: insecure permissions 0${(n.m & 0o777).toString(8)}, 0600 suggested.\n`);
      if (!n.swapSig && abs !== '/swap.img') { c.err(`swapon: ${abs}: read swap header failed\n`); return 1; }
      if (exist) exist.on = true;
      else m.state.swaps.push({ file: abs, size: Math.round((n.sz || LX.byteLen(n.c)) / 1048576), type: 'file' });
    }
    return 0;
  });

  // ---- 마운트
  function mountSize(m, x) {
    if (x.usedDyn) {
      const n = m.vfs.lookup(x.dir);
      if (n) x.used = Math.max(0.1, 24 + m.vfs.duSize(n) / 1048576);
    }
    return x;
  }
  LX.mountDev = function (m, devPath, dir, opts = '') {
    const b = blockDev(m, devPath);
    if (!b) return `mount: ${dir}: special device ${devPath} does not exist.`;
    const o = b.obj;
    if (!o.fs || o.swap) return `mount: ${dir}: wrong fs type, bad option, bad superblock on ${devPath}, missing codepage or helper program, or other error.\n       dmesg(1) may have more information after failed mount system call.`;
    const node = m.vfs.lookup(dir);
    if (!node) return `mount: ${dir}: mount point does not exist.`;
    if (node.t !== 'd') return `mount: ${dir}: mount point is not a directory.`;
    if (m.state.mounts.some((x) => x.dir === dir)) return `mount: ${dir}: ${devPath} already mounted on ${dir}.`;
    if (m.state.mounts.some((x) => x.dev === b.path)) return `mount: ${dir}: ${devPath} already mounted on ${m.state.mounts.find((x) => x.dev === b.path).dir}.`;
    m.state.fsdata = m.state.fsdata || {};
    const root = m.state.fsdata[o.uuid] || newFsRoot(m);
    delete m.state.fsdata[o.uuid];
    const parent = m.vfs.lookup(LX.path.dirname(dir));
    const name = LX.path.basename(dir);
    const under = parent.k[name];
    parent.k[name] = root;
    const ro = /(^|,)ro(,|$)/.test(opts);
    m.state.mounts.push({ dev: b.path, dir, fs: o.fs, opts: (ro ? 'ro' : 'rw') + ',relatime', size: o.size, used: 24, usedDyn: true, uuid: o.uuid, under });
    m.state.dmesg = (m.state.dmesg || []).concat(`[ ${((m.now() - m.bootTime) / 1000).toFixed(6).padStart(11)}] EXT4-fs (${b.path.replace('/dev/', '')}): mounted filesystem ${o.uuid} r/w with ordered data mode. Quota mode: none.`);
    m.vfs.touchChanged();
    return null;
  };
  LX.umountDir = function (m, x) {
    const parent = m.vfs.lookup(LX.path.dirname(x.dir));
    const name = LX.path.basename(x.dir);
    const root = parent.k[name];
    m.state.fsdata = m.state.fsdata || {};
    if (x.uuid) m.state.fsdata[x.uuid] = root;
    parent.k[name] = x.under || { t: 'd', m: 0o755, u: 0, g: 0, mt: m.now(), k: {} };
    m.state.mounts = m.state.mounts.filter((y) => y !== x);
    m.vfs.touchChanged();
  };

  function fstabEntries(m) {
    let t = '';
    try { t = m.vfs.readFile('/etc/fstab', null); } catch (e) { return []; }
    return t.split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean).map((l) => { const f = l.split(/\s+/); return { spec: f[0], dir: f[1], fs: f[2], opts: f[3] || 'defaults', line: l }; });
  }
  function specToDev(m, spec) {
    if (spec.startsWith('UUID=')) return LX.devByUuid(m, spec.slice(5).replace(/"/g, ''));
    if (spec.startsWith('LABEL=')) { const lb = spec.slice(6); for (const d of Object.values(m.state.disks)) for (const p of d.parts || []) if (p.label === lb) return '/dev/' + p.name; return null; }
    if (spec.startsWith('/dev/disk/by-uuid/')) return LX.devByUuid(m, spec.slice(18));
    return spec;
  }
  /** fstab 에 따라 마운트 (mount -a · 부팅). 오류 목록 */
  LX.mountAll = function (m) {
    const errs = [];
    for (const e of fstabEntries(m)) {
      if (e.fs === 'swap' || e.dir === 'none' || e.dir === '/' || e.dir === '/boot' || /noauto/.test(e.opts)) continue;
      if (m.state.mounts.some((x) => x.dir === e.dir)) continue;
      const dev = specToDev(m, e.spec);
      const nofail = /(^|,)nofail(,|$)/.test(e.opts);
      if (!dev) { if (!nofail) errs.push(`mount: ${e.dir}: can't find ${e.spec}.`); continue; }
      if (e.fs !== 'auto' && e.fs !== 'ext4' && e.fs !== 'xfs' && e.fs !== 'vfat' && e.fs !== 'ext3' && e.fs !== 'ext2' && e.fs !== 'btrfs' && e.fs !== 'nfs' && e.fs !== 'tmpfs') { errs.push(`mount: ${e.dir}: unknown filesystem type '${e.fs}'.`); continue; }
      const b = blockDev(m, dev);
      if (b && e.fs !== 'auto' && b.obj.fs && b.obj.fs !== e.fs) { errs.push(`mount: ${e.dir}: wrong fs type, bad option, bad superblock on ${dev}, missing codepage or helper program, or other error.`); continue; }
      const err = LX.mountDev(m, dev, e.dir, e.opts);
      if (err && !nofail) errs.push(err.split('\n')[0]);
    }
    return errs;
  };

  def('mount', async (c) => {
    const m = c.m;
    const args = c.args.slice();
    let opts = '', type = null;
    const ops = [];
    let all = false, verbose = false;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-o') opts = args[++i];
      else if (a === '-t') type = args[++i];
      else if (a === '-a' || a === '--all') all = true;
      else if (a === '-v') verbose = true;
      else if (a === '-l') continue;
      else if (a.startsWith('-')) continue;
      else ops.push(a);
    }
    if (!ops.length && !all) {
      const sys = ['sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)', 'proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)', 'udev on /dev type devtmpfs (rw,nosuid,relatime,size=1966024k,nr_inodes=491506,mode=755,inode64)', 'devpts on /dev/pts type devpts (rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=000)', 'tmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime,size=400564k,mode=755,inode64)'];
      const list = m.state.mounts.filter((x) => !type || x.fs === type).map((x) => `${x.dev} on ${x.dir} type ${x.fs} (${x.opts})`);
      c.out((type ? list : [sys[0], sys[1], sys[2], sys[3], sys[4], ...list, 'tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev,inode64)', 'tmpfs on /run/lock type tmpfs (rw,nosuid,nodev,noexec,relatime,size=5120k,inode64)', 'tmpfs on /run/user/1000 type tmpfs (rw,nosuid,nodev,relatime,size=400560k,nr_inodes=100140,mode=700,uid=1000,gid=1000,inode64)']).join('\n') + '\n');
      return 0;
    }
    if (c.cred.uid !== 0) { c.err(`mount: ${ops[ops.length - 1] || ''}: must be superuser to use mount.\n       dmesg(1) may have more information after failed mount system call.\n`); return 32; }
    if (all) {
      const errs = LX.mountAll(m);
      errs.forEach((e) => c.err(e + '\n'));
      if (verbose && !errs.length) c.out('/                        : ignored\n/boot                    : already mounted\nnone                     : ignored\n');
      return errs.length ? 32 : 0;
    }
    let dev = ops[0], dir = ops[1];
    if (ops.length === 1) {
      const e = fstabEntries(m).find((x) => x.dir === ops[0] || x.spec === ops[0]);
      if (!e) { c.err(`mount: ${ops[0]}: can't find in /etc/fstab.\n`); return 1; }
      dev = specToDev(m, e.spec); dir = e.dir; opts = opts || e.opts;
      if (!dev) { c.err(`mount: ${e.dir}: can't find ${e.spec}.\n`); return 32; }
    }
    if (/,?remount/.test(opts)) { const x = m.state.mounts.find((y) => y.dir === c.resolve(dir || dev)); if (x) x.opts = (/ro/.test(opts) ? 'ro' : 'rw') + ',relatime'; return 0; }
    if (/loop/.test(opts) || (c.fs.lookup(c.resolve(dev)) || {}).fsImage) { c.err('mount: (가상 터미널) 루프 장치 마운트는 지원하지 않습니다. 실제 Ubuntu 에서 실습하세요.\n'); return 32; }
    if (dev.startsWith('UUID=') || dev.startsWith('LABEL=')) dev = specToDev(m, dev) || dev;
    if (/:/.test(dev) || type === 'nfs' || type === 'cifs') { c.err(`mount: (가상 터미널) 네트워크 파일 시스템(${type || 'nfs'}) 마운트는 실제 서버 두 대로 실습하세요.\n`); return 32; }
    const b = blockDev(m, dev);
    if (!b) { c.err(`mount: ${c.resolve(dir || '.')}: special device ${dev} does not exist.\n       dmesg(1) may have more information after failed mount system call.\n`); return 32; }
    if (type && b.obj.fs && type !== b.obj.fs && type !== 'auto') { c.err(`mount: ${c.resolve(dir)}: wrong fs type, bad option, bad superblock on ${dev}, missing codepage or helper program, or other error.\n       dmesg(1) may have more information after failed mount system call.\n`); return 32; }
    const err = LX.mountDev(m, b.path, c.resolve(dir), opts);
    if (err) { c.err(err + '\n'); return 32; }
    return 0;
  });

  def('umount', async (c) => {
    const m = c.m;
    const t = c.args.filter((a) => !a.startsWith('-'))[0];
    if (!t) { c.err('Usage:\n umount [-hV]\n umount -a [options]\n umount [options] <source> | <directory>\n'); return 1; }
    const abs = c.resolve(t);
    const b = blockDev(m, t);
    const x = m.state.mounts.find((y) => y.dir === abs || (b && y.dev === b.path));
    if (c.cred.uid !== 0) { c.err(`umount: ${abs}: must be superuser to unmount.\n`); return 32; }
    if (!x) { c.err(`umount: ${t}: not mounted.\n`); return 32; }
    if (x.dir === '/' || x.dir === '/boot') { c.err(`umount: ${x.dir}: target is busy.\n`); return 32; }
    const busy = c.session.stack.some((s) => s.cwd && (s.cwd === x.dir || s.cwd.startsWith(x.dir + '/'))) || (c.sh.cwd === x.dir || c.sh.cwd.startsWith(x.dir + '/'));
    if (busy && !c.args.includes('-l')) { c.err(`umount: ${x.dir}: target is busy.\n`); return 32; }
    LX.umountDir(m, x);
    return 0;
  });

  def('findmnt', async (c) => {
    const m = c.m;
    if (c.args.includes('--verify')) {
      const bad = [];
      fstabEntries(m).forEach((e) => {
        if (e.fs === 'swap' || e.dir === '/' || e.dir === '/boot') return;
        const dev = specToDev(m, e.spec);
        if (!dev) bad.push(`${e.dir}\n   [E] ${e.spec} does not exist`);
        else if (!c.fs.lookup(e.dir)) bad.push(`${e.dir}\n   [E] ${e.dir} does not exist`);
      });
      if (bad.length) c.out(bad.join('\n') + `\n\n${bad.length} parse errors, 0 errors, 0 warnings\n`); else c.out('Success, no errors or warnings detected\n');
      return bad.length ? 1 : 0;
    }
    const t = c.args.filter((a) => !a.startsWith('-'))[0];
    const list = m.state.mounts.map((x) => mountSize(m, x));
    const sel = t ? list.filter((x) => x.dir === c.resolve(t) || x.dev === t) : list;
    if (t && !sel.length) return 1;
    c.out('TARGET                SOURCE                            FSTYPE OPTIONS\n');
    if (!t) c.out('/                     /dev/mapper/ubuntu--vg-ubuntu--lv ext4   rw,relatime\n├─/sys                sysfs                             sysfs  rw,nosuid,nodev,noexec,relatime\n├─/proc               proc                              proc   rw,nosuid,nodev,noexec,relatime\n├─/dev                udev                              devtmpfs rw,nosuid,relatime\n├─/run                tmpfs                             tmpfs  rw,nosuid,nodev,noexec,relatime\n');
    sel.filter((x) => t || x.dir !== '/').forEach((x, i, arr) => c.out(`${(t ? '' : i === arr.length - 1 ? '└─' : '├─') + x.dir}`.padEnd(22) + `${x.dev.padEnd(33)} ${x.fs.padEnd(6)} ${x.opts}\n`));
    return 0;
  });

  def('df', async (c) => {
    const { f, ops } = getopt(c.args, 'hTilkmaPtHx:', { 'human-readable': 'h', 'print-type': 'T', inodes: 'i', type: 't:', total: 'total', si: 'H' });
    const m = c.m;
    const base = m.state.mounts.find((x) => x.dir === '/');
    if (base) base.used = 5.3 * 1024 + Object.keys(m.state.pkgs).filter((n) => LX.PKGS[n] && !LX.PKGS[n].base).reduce((a, n) => a + LX.PKGS[n].size / 1024, 0) + (m.state.images || []).length * 150;
    const rows = [
      { dev: 'tmpfs', fs: 'tmpfs', size: 391, used: 1.1, dir: '/run' },
      ...m.state.mounts.map((x) => mountSize(m, x)).map((x) => ({ dev: x.dev, fs: x.fs, size: x.size * 0.98, used: x.used, dir: x.dir })),
      { dev: 'tmpfs', fs: 'tmpfs', size: 1956, used: 0, dir: '/dev/shm' },
      { dev: 'tmpfs', fs: 'tmpfs', size: 5, used: 0, dir: '/run/lock' },
      { dev: 'tmpfs', fs: 'tmpfs', size: 391, used: 0.012, dir: '/run/user/1000' }
    ];
    rows.sort((a, b) => (a.dir === '/run' ? -1 : 0) || 0);
    let list = rows;
    if (ops.length) {
      list = [];
      for (const o of ops) {
        const abs = c.resolve(o);
        if (!c.fs.lookup(abs)) { c.err(`df: ${o}: No such file or directory\n`); continue; }
        const best = rows.filter((r) => abs === r.dir || abs.startsWith(r.dir === '/' ? '/' : r.dir + '/')).sort((a, b) => b.dir.length - a.dir.length)[0];
        if (best) list.push(best);
      }
      if (!list.length) return 1;
    }
    if (f.t) list = list.filter((r) => r.fs === f.t);
    if (f.x) list = list.filter((r) => r.fs !== f.x);
    const fmt = (mb) => (f.h ? (mb === 0 ? '0' : LX.human(mb * 1048576)) : String(Math.round(mb * 1024)));
    const w = Math.max(10, ...list.map((r) => r.dev.length));
    if (f.i) {
      c.out(`${'Filesystem'.padEnd(w)} ${'Inodes'.padStart(7)}  IUsed   IFree IUse% Mounted on\n`);
      list.forEach((r) => { const tot = Math.round(r.size * 64); const used = Math.round(r.used * 30); c.out(`${r.dev.padEnd(w)} ${String(tot).padStart(7)} ${String(used).padStart(6)} ${String(tot - used).padStart(7)} ${String(Math.ceil(used / Math.max(1, tot) * 100) + '%').padStart(5)} ${r.dir}\n`); });
      return 0;
    }
    c.out(`${'Filesystem'.padEnd(w)} ${f.T ? 'Type     ' : ''}${f.h ? ' Size  Used Avail' : '1K-blocks     Used Available'} Use% Mounted on\n`);
    list.forEach((r) => {
      const avail = Math.max(0, r.size - r.used);
      const pct = r.size ? Math.ceil(r.used / r.size * 100) : 0;
      c.out(`${r.dev.padEnd(w)} ${f.T ? r.fs.padEnd(8) + ' ' : ''}${f.h ? `${fmt(r.size).padStart(5)} ${fmt(r.used).padStart(5)} ${fmt(avail).padStart(5)}` : `${fmt(r.size).padStart(9)} ${fmt(r.used).padStart(8)} ${fmt(avail).padStart(9)}`} ${(pct + '%').padStart(4)} ${r.dir}\n`);
    });
    return 0;
  });

  // ---- 파일 시스템 도구
  def(['e2fsck', 'fsck'], async (c) => {
    const dev = c.args.filter((a) => !a.startsWith('-'))[0];
    const b = dev && blockDev(c.m, dev);
    if (!b) { c.err(`e2fsck 1.47.0 (5-Feb-2023)\n${c.name}: No such file or directory while trying to open ${dev}\nPossibly non-existent device?\n`); return 8; }
    if (c.cred.uid !== 0) { c.err(`e2fsck 1.47.0 (5-Feb-2023)\n${c.name}: Permission denied while trying to open ${dev}\nYou must have r/w access to the filesystem or be root\n`); return 8; }
    if (mountOf(c.m, b.path)) { c.err(`e2fsck 1.47.0 (5-Feb-2023)\n${dev} is mounted.\ne2fsck: Cannot continue, aborting.\n\n\n`); return 8; }
    c.out(`e2fsck 1.47.0 (5-Feb-2023)\n${c.args.includes('-f') ? `Pass 1: Checking inodes, blocks, and sizes\nPass 2: Checking directory structure\nPass 3: Checking directory connectivity\nPass 4: Checking reference counts\nPass 5: Checking group summary information\n` : ''}${b.obj.label || dev}: clean, 11/${Math.round(b.obj.size * 64)} files, ${Math.round(b.obj.size * 8.3)}/${Math.round(b.obj.size * 256)} blocks\n`);
    return 0;
  });
  def(['tune2fs', 'e2label', 'dumpe2fs'], async (c) => {
    const dev = c.args.filter((a) => !a.startsWith('-') && a !== (c.args[c.args.indexOf('-L') + 1]))[0];
    const b = dev && blockDev(c.m, dev);
    if (!b || !b.obj.fs) { c.err(`${c.name}: Bad magic number in super-block while trying to open ${dev}\n`); return 1; }
    if (c.name === 'e2label') { if (c.args[1] != null) { if (c.cred.uid !== 0) { c.err('e2label: Permission denied\n'); return 1; } b.obj.label = c.args[1]; } else c.out((b.obj.label || '') + '\n'); return 0; }
    if (c.args.includes('-L')) { if (c.cred.uid !== 0) { c.err('tune2fs: Permission denied\n'); return 1; } b.obj.label = c.args[c.args.indexOf('-L') + 1]; c.out('tune2fs 1.47.0 (5-Feb-2023)\n'); return 0; }
    c.out(`tune2fs 1.47.0 (5-Feb-2023)\nFilesystem volume name:   ${b.obj.label || '<none>'}\nLast mounted on:          ${(mountOf(c.m, b.path) || {}).dir || '<not available>'}\nFilesystem UUID:          ${b.obj.uuid}\nFilesystem magic number:  0xEF53\nFilesystem revision #:    1 (dynamic)\nFilesystem features:      has_journal ext_attr resize_inode dir_index filetype needs_recovery extent 64bit flex_bg sparse_super large_file huge_file dir_nlink extra_isize metadata_csum\nFilesystem state:         clean\nBlock count:              ${Math.round(b.obj.size * 256)}\nBlock size:               4096\nReserved block count:     ${Math.round(b.obj.size * 12.8)}\n`);
    return 0;
  });
  def(['resize2fs', 'xfs_growfs'], async (c) => {
    const dev = c.args.filter((a) => !a.startsWith('-'))[0];
    const m = c.m;
    let b = dev && blockDev(m, dev);
    if (!b && dev) { const x = m.state.mounts.find((y) => y.dir === c.resolve(dev)); if (x) b = blockDev(m, x.dev); }
    if (!b) { c.err(`resize2fs 1.47.0 (5-Feb-2023)\nopen: No such file or directory while opening ${dev}\n`); return 1; }
    if (c.cred.uid !== 0) { c.err(`resize2fs 1.47.0 (5-Feb-2023)\nopen: Permission denied while opening ${dev}\n`); return 1; }
    const mnt = m.state.mounts.find((x) => x.dev === b.path || (b.kind === 'lv' && x.dev === b.path));
    const blocks = Math.round(b.obj.size * 256);
    if (mnt) {
      if (mnt.size === b.obj.size) { c.out(`resize2fs 1.47.0 (5-Feb-2023)\nThe filesystem is already ${blocks} (4k) blocks long.  Nothing to do!\n\n`); return 0; }
      c.out(`resize2fs 1.47.0 (5-Feb-2023)\nFilesystem at ${b.path} is mounted on ${mnt.dir}; on-line resizing required\nold_desc_blocks = 2, new_desc_blocks = ${Math.ceil(b.obj.size / 8192)}\nThe filesystem on ${b.path} is now ${blocks} (4k) blocks long.\n\n`);
      mnt.size = b.obj.size;
    } else c.out(`resize2fs 1.47.0 (5-Feb-2023)\nResizing the filesystem on ${b.path} to ${blocks} (4k) blocks.\nThe filesystem on ${b.path} is now ${blocks} (4k) blocks long.\n\n`);
    b.obj.fsSize = b.obj.size;
    return 0;
  });

  // ---- LVM
  const lvmRoot = (c) => { if (c.cred.uid === 0) return false; c.err('  WARNING: Running as a non-root user. Functionality may be unavailable.\n  /run/lock/lvm/P_global:aux: open failed: Permission denied\n'); return true; };
  function vgFree(v) { return v.size - Object.values(v.lvs).reduce((a, l) => a + l.size, 0); }
  function gib(mb) { return (mb / 1024).toFixed(2) + 'g'; }
  function lvSize(spec, v, cur) {
    let r;
    if ((r = /^([+-]?)(\d+(?:\.\d+)?)([KMGTkmgt]?)$/.exec(spec))) {
      const mb = +r[2] * ({ k: 1 / 1024, m: 1, g: 1024, t: 1048576, '': 1024 }[r[3].toLowerCase()]);
      return r[1] === '+' ? cur + mb : r[1] === '-' ? cur - mb : mb;
    }
    return null;
  }
  function lvExtents(spec, v, cur) {
    const r = /^([+]?)(\d+)%(FREE|VG)$/i.exec(spec);
    if (r) { const base = r[3].toUpperCase() === 'FREE' ? vgFree(v) : v.size; return (r[1] ? cur : 0) + Math.floor(base * +r[2] / 100); }
    const n = /^([+]?)(\d+)$/.exec(spec);
    if (n) return (n[1] ? cur : 0) + +n[2] * 4;
    return null;
  }

  def('pvcreate', async (c) => {
    if (lvmRoot(c)) return 5;
    let st = 0;
    for (const d of c.args.filter((a) => !a.startsWith('-'))) {
      const b = blockDev(c.m, d);
      if (!b) { c.err(`  No device found for ${d}.\n`); st = 5; continue; }
      if (mountOf(c.m, b.path)) { c.err(`  Can't open ${d} exclusively.  Mounted filesystem?\n`); st = 5; continue; }
      if (b.obj.fs && !c.args.includes('-f') && !c.args.includes('-y')) {
        const a = await c.readLine(`WARNING: ${b.obj.fs} signature detected on ${d} at offset 1080. Wipe it? [y/n]: `, { tty: true });
        if (!/^y/i.test(a || '')) { c.err('  Aborted wiping of ext4.\n  1 existing signature left on the device.\n'); st = 5; continue; }
        c.out(`  Wiping ${b.obj.fs} signature on ${d}.\n`);
      }
      b.obj.pv = true; b.obj.fs = null;
      b.obj.pvUuid = 'Pv' + Math.random().toString(36).slice(2, 8) + '-' + Math.random().toString(36).slice(2, 6);
      c.m.state.pvs[b.path] = { vg: null };
      c.out(`  Physical volume "${d}" successfully created.\n`);
    }
    return st;
  });
  def(['pvs', 'pvdisplay', 'pvscan'], async (c) => {
    const m = c.m;
    if (lvmRoot(c)) return 5;
    const list = Object.entries(m.state.pvs).map(([p, x]) => {
      const b = blockDev(m, p);
      const size = b ? b.obj.size : 0;
      const v = x.vg ? m.state.vgs[x.vg] : null;
      const free = v ? (v.pvs[v.pvs.length - 1] === p ? vgFree(v) : 0) : size;
      return { p, vg: x.vg || '', size, free };
    });
    if (c.name === 'pvdisplay') { list.forEach((x) => c.out(`  --- Physical volume ---\n  PV Name               ${x.p}\n  VG Name               ${x.vg}\n  PV Size               ${(x.size / 1024).toFixed(2)} GiB / not usable 2.00 MiB\n  Allocatable           ${x.vg ? 'yes' : 'NO'}\n  PE Size               4.00 MiB\n  Total PE              ${Math.floor(x.size / 4)}\n  Free PE               ${Math.floor(x.free / 4)}\n  Allocated PE          ${Math.floor((x.size - x.free) / 4)}\n  PV UUID               ${(blockDev(m, x.p) || { obj: {} }).obj.pvUuid || 'Xk3pQ2-7vRb-9dLm-2Wq4-hT6n-Yc1z-Ab5eFd'}\n\n`)); return 0; }
    c.out('  PV         VG        Fmt  Attr PSize   PFree  \n' + list.map((x) => `  ${x.p.padEnd(10)} ${x.vg.padEnd(9)} lvm2 a--  ${gib(x.size).padEnd(7)} ${gib(x.free)}\n`).join(''));
    return 0;
  });
  def('vgcreate', async (c) => {
    if (lvmRoot(c)) return 5;
    const [name, ...devs] = c.args.filter((a) => !a.startsWith('-'));
    const m = c.m;
    if (!name || !devs.length) { c.err('  Please provide volume group name and physical volumes\n  Run `vgcreate --help\' for more information.\n'); return 3; }
    if (m.state.vgs[name]) { c.err(`  A volume group called ${name} already exists.\n`); return 5; }
    let size = 0;
    for (const d of devs) {
      const b = blockDev(m, d);
      if (!b) { c.err(`  No device found for ${d}.\n`); return 5; }
      if (!m.state.pvs[b.path]) { c.out(`  Physical volume "${d}" successfully created.\n`); b.obj.pv = true; m.state.pvs[b.path] = { vg: null }; }
      if (m.state.pvs[b.path].vg) { c.err(`  Physical volume '${d}' is already in volume group '${m.state.pvs[b.path].vg}'\n  Unable to add physical volume '${d}' to volume group '${name}'\n`); return 5; }
      m.state.pvs[b.path].vg = name;
      size += b.obj.size - 4;
    }
    m.state.vgs[name] = { pvs: devs.map((d) => blockDev(m, d).path), size, lvs: {} };
    c.out(`  Volume group "${name}" successfully created\n`);
    return 0;
  });
  def('vgextend', async (c) => {
    if (lvmRoot(c)) return 5;
    const [name, ...devs] = c.args.filter((a) => !a.startsWith('-'));
    const m = c.m;
    const v = m.state.vgs[name];
    if (!v) { c.err(`  Volume group "${name}" not found\n  Cannot process volume group ${name}\n`); return 5; }
    for (const d of devs) {
      const b = blockDev(m, d);
      if (!b) { c.err(`  No device found for ${d}.\n`); return 5; }
      if (!m.state.pvs[b.path]) { c.out(`  Physical volume "${d}" successfully created.\n`); b.obj.pv = true; m.state.pvs[b.path] = { vg: null }; }
      m.state.pvs[b.path].vg = name;
      v.pvs.push(b.path);
      v.size += b.obj.size - 4;
    }
    c.out(`  Volume group "${name}" successfully extended\n`);
    return 0;
  });
  def(['vgs', 'vgdisplay', 'vgscan'], async (c) => {
    if (lvmRoot(c)) return 5;
    const m = c.m;
    const list = Object.entries(m.state.vgs);
    if (c.name === 'vgdisplay') { list.forEach(([n, v]) => c.out(`  --- Volume group ---\n  VG Name               ${n}\n  System ID             \n  Format                lvm2\n  VG Access             read/write\n  VG Status             resizable\n  Cur LV                ${Object.keys(v.lvs).length}\n  Open LV               ${Object.keys(v.lvs).length}\n  Cur PV                ${v.pvs.length}\n  VG Size               ${(v.size / 1024).toFixed(2)} GiB\n  PE Size               4.00 MiB\n  Total PE              ${Math.floor(v.size / 4)}\n  Alloc PE / Size       ${Math.floor((v.size - vgFree(v)) / 4)} / ${((v.size - vgFree(v)) / 1024).toFixed(2)} GiB\n  Free  PE / Size       ${Math.floor(vgFree(v) / 4)} / ${(vgFree(v) / 1024).toFixed(2)} GiB\n\n`)); return 0; }
    c.out('  VG        #PV #LV #SN Attr   VSize   VFree  \n' + list.map(([n, v]) => `  ${n.padEnd(9)} ${String(v.pvs.length).padStart(3)} ${String(Object.keys(v.lvs).length).padStart(3)}   0 wz--n- ${gib(v.size).padEnd(7)} ${gib(vgFree(v))}\n`).join(''));
    return 0;
  });
  def('lvcreate', async (c) => {
    if (lvmRoot(c)) return 5;
    const m = c.m;
    const { f, ops } = getopt(c.args, 'L:l:n:y', { size: 'L:', extents: 'l:', name: 'n:', yes: 'y' });
    const vgName = ops[0];
    const v = m.state.vgs[vgName];
    if (!v) { c.err(`  Volume group "${vgName}" not found\n  Cannot process volume group ${vgName}\n`); return 5; }
    const name = f.n || `lvol${Object.keys(v.lvs).length}`;
    if (v.lvs[name]) { c.err(`  Logical Volume "${name}" already exists in volume group "${vgName}"\n`); return 5; }
    let size = f.L ? lvSize(f.L, v, 0) : f.l ? lvExtents(f.l, v, 0) : null;
    if (size == null) { c.err('  Please specify either size or extents but not both.\n'); return 3; }
    if (size > vgFree(v)) { c.err(`  Volume group "${vgName}" has insufficient free space (${Math.floor(vgFree(v) / 4)} extents): ${Math.ceil(size / 4)} required.\n`); return 5; }
    v.lvs[name] = { size: Math.round(size), fs: null, uuid: null };
    LX.syncDevices(m);
    c.out(`  Logical volume "${name}" created.\n`);
    return 0;
  });
  def(['lvs', 'lvdisplay', 'lvscan'], async (c) => {
    if (lvmRoot(c)) return 5;
    const m = c.m;
    const rows = [];
    Object.entries(m.state.vgs).forEach(([vg, v]) => Object.entries(v.lvs).forEach(([lv, l]) => rows.push({ vg, lv, l })));
    if (c.name === 'lvdisplay') { rows.forEach((r) => c.out(`  --- Logical volume ---\n  LV Path                /dev/${r.vg}/${r.lv}\n  LV Name                ${r.lv}\n  VG Name                ${r.vg}\n  LV Write Access        read/write\n  LV Status              available\n  LV Size                ${(r.l.size / 1024).toFixed(2)} GiB\n  Current LE             ${Math.floor(r.l.size / 4)}\n  Block device           252:${rows.indexOf(r)}\n\n`)); return 0; }
    if (c.name === 'lvscan') { rows.forEach((r) => c.out(`  ACTIVE            '/dev/${r.vg}/${r.lv}' [${(r.l.size / 1024).toFixed(2)} GiB] inherit\n`)); return 0; }
    c.out('  LV        VG        Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert\n' + rows.map((r) => `  ${r.lv.padEnd(9)} ${r.vg.padEnd(9)} -wi-ao---- ${gib(r.l.size).padEnd(7)}\n`).join(''));
    return 0;
  });
  def(['lvextend', 'lvresize', 'lvreduce'], async (c) => {
    if (lvmRoot(c)) return 5;
    const m = c.m;
    const { f, ops } = getopt(c.args, 'L:l:rfy', { size: 'L:', extents: 'l:', resizefs: 'r' });
    const b = blockDev(m, ops[0] || '');
    if (!b || b.kind !== 'lv') { c.err(`  Volume group for ${ops[0]} not found / Invalid path for Logical Volume\n`); return 5; }
    const v = m.state.vgs[b.vg];
    const cur = b.obj.size;
    let size = f.L ? lvSize(f.L, v, cur) : f.l ? lvExtents(f.l, v, cur) : null;
    if (size == null) { c.err('  Please specify either size or extents but not both.\n'); return 3; }
    size = Math.round(size);
    if (size === cur) { c.err(`  New size (${Math.floor(size / 4)} extents) matches existing size (${Math.floor(cur / 4)} extents).\n`); return 5; }
    if (size - cur > vgFree(v)) { c.err(`  Insufficient free space: ${Math.ceil((size - cur) / 4)} extents needed, but only ${Math.floor(vgFree(v) / 4)} available\n`); return 5; }
    if (size < cur && c.name !== 'lvextend') {
      const a = await c.readLine(`  WARNING: Reducing active and open logical volume to ${(size / 1024).toFixed(2)} GiB.\n  THIS MAY DESTROY YOUR DATA (filesystem etc.)\nDo you really want to reduce ${b.vg}/${b.lv}? [y/n]: `, { tty: true });
      if (!/^y/i.test(a || '')) { c.out(`  Logical volume ${b.vg}/${b.lv} NOT reduced.\n`); return 5; }
    } else if (size < cur) { c.err(`  New size given (${Math.floor(size / 4)} extents) not larger than existing size (${Math.floor(cur / 4)} extents)\n`); return 5; }
    b.obj.size = size;
    c.out(`  Size of logical volume ${b.vg}/${b.lv} changed from ${(cur / 1024).toFixed(2)} GiB (${Math.floor(cur / 4)} extents) to ${(size / 1024).toFixed(2)} GiB (${Math.floor(size / 4)} extents).\n  Logical volume ${b.vg}/${b.lv} successfully resized.\n`);
    if (f.r) {
      const mnt = m.state.mounts.find((x) => x.dev === b.path);
      c.out(`resize2fs 1.47.0 (5-Feb-2023)\n${mnt ? `Filesystem at ${b.path} is mounted on ${mnt.dir}; on-line resizing required\n` : ''}The filesystem on ${b.path} is now ${Math.round(size * 256)} (4k) blocks long.\n\n`);
      if (mnt) mnt.size = size;
    }
    return 0;
  });
  def(['lvremove', 'vgremove', 'pvremove'], async (c) => {
    if (lvmRoot(c)) return 5;
    const m = c.m;
    const t = c.args.filter((a) => !a.startsWith('-'))[0] || '';
    const force = c.args.includes('-f') || c.args.includes('-y');
    if (c.name === 'lvremove') {
      const b = blockDev(m, t);
      if (!b || b.kind !== 'lv') { c.err(`  Failed to find logical volume "${t}"\n`); return 5; }
      if (mountOf(m, b.path)) { c.err(`  Logical volume ${b.vg}/${b.lv} contains a filesystem in use.\n`); return 5; }
      if (!force) { const a = await c.readLine(`Do you really want to remove active logical volume ${b.vg}/${b.lv}? [y/n]: `, { tty: true }); if (!/^y/i.test(a || '')) { c.out(`  Logical volume ${b.vg}/${b.lv} not removed.\n`); return 5; } }
      delete m.state.vgs[b.vg].lvs[b.lv];
      try { c.fs.unlink(b.path, null); c.fs.unlink(`/dev/${b.vg}/${b.lv}`, null); } catch (e) { /* 무시 */ }
      c.out(`  Logical volume "${b.lv}" successfully removed.\n`);
      return 0;
    }
    if (c.name === 'vgremove') {
      const v = m.state.vgs[t];
      if (!v) { c.err(`  Volume group "${t}" not found\n`); return 5; }
      if (Object.keys(v.lvs).length && !force) { c.err(`Do you really want to remove volume group "${t}" containing ${Object.keys(v.lvs).length} logical volumes? [y/n]: n\n  Volume group "${t}" not removed\n`); return 5; }
      v.pvs.forEach((p) => { if (m.state.pvs[p]) m.state.pvs[p].vg = null; });
      delete m.state.vgs[t];
      c.out(`  Volume group "${t}" successfully removed\n`);
      return 0;
    }
    const b = blockDev(m, t);
    if (!b || !m.state.pvs[b.path]) { c.err(`  No PV found on device ${t}.\n`); return 5; }
    if (m.state.pvs[b.path].vg) { c.err(`  PV ${t} is used by VG ${m.state.pvs[b.path].vg} so please use vgreduce first.\n`); return 5; }
    delete m.state.pvs[b.path];
    delete b.obj.pv;
    c.out(`  Labels on physical volume "${t}" successfully wiped.\n`);
    return 0;
  });
  def('lvm', async (c) => { if (c.args[0] === 'version') { c.out('  LVM version:     2.03.16(2) (2022-05-18)\n  Library version: 1.02.185 (2022-05-18)\n  Driver version:  4.48.0\n'); return 0; } c.err('\x1b[2m(가상 터미널: lvm 대화형 셸 대신 pvs · vgs · lvs 같은 명령을 직접 사용하세요)\x1b[0m\n'); return 1; });
  def('wipefs', async (c) => {
    const d = c.args.filter((a) => !a.startsWith('-'))[0];
    const b = d && blockDev(c.m, d);
    if (!b) { c.err(`wipefs: error: ${d}: probing initialization failed: No such file or directory\n`); return 1; }
    if (c.cred.uid !== 0) { c.err(`wipefs: error: ${d}: probing initialization failed: Permission denied\n`); return 1; }
    if (c.args.includes('-a')) {
      if (b.obj.fs) c.out(`${d}: 2 bytes were erased at offset 0x00000438 (${b.obj.fs}): 53 ef\n`);
      b.obj.fs = null; delete b.obj.pv; delete b.obj.swap;
      if (b.kind === 'disk') { b.obj.parts = []; b.obj.label = null; LX.syncDevices(c.m); }
    }
    return 0;
  });

  // ======================================================================= cron
  function cronFile(user) { return `/var/spool/cron/crontabs/${user}`; }
  function checkCron(text) {
    const bad = [];
    text.split('\n').forEach((l, i) => {
      const s = l.trim();
      if (!s || s.startsWith('#') || /^[A-Za-z_]\w*\s*=/.test(s)) return;
      if (/^@(reboot|yearly|annually|monthly|weekly|daily|midnight|hourly)\s+\S/.test(s)) return;
      const f = s.split(/\s+/);
      const ok = f.length >= 6 && f.slice(0, 5).every((x, k) => /^(\*|\d+(-\d+)?)(\/\d+)?(,(\*|\d+(-\d+)?)(\/\d+)?)*$/.test(x) || (k === 3 && /^[a-z]{3}$/i.test(x)) || (k === 4 && /^[a-z]{3}(-[a-z]{3})?$/i.test(x)));
      if (!ok) bad.push(i + 1);
    });
    return bad;
  }
  LX.checkCron = checkCron;

  def('crontab', async (c) => {
    const m = c.m;
    let user = c.cred.name;
    const args = c.args.slice();
    const ui = args.indexOf('-u');
    if (ui >= 0) {
      if (c.cred.uid !== 0) { c.err('must be privileged to use -u\n'); return 1; }
      user = args[ui + 1];
      args.splice(ui, 2);
      if (!m.credFor(user)) { c.err(`crontab: user '${user}' unknown\n`); return 1; }
    }
    const file = cronFile(user);
    const owner = m.credFor(user);
    const save = (text) => {
      m.vfs.writeFile(file, text, null, { mode: 0o600 });
      const n = m.vfs.lookup(file);
      n.u = owner.uid; n.g = 103; n.m = 0o600;
      LX.log(m, `crontab[${m.nextPid()}]`, `(${user}) REPLACE (${user})`);
    };
    if (args[0] === '-l') {
      const n = m.vfs.lookup(file);
      if (!n) { c.err(`no crontab for ${user}\n`); return 1; }
      c.out(n.c);
      return 0;
    }
    if (args[0] === '-r' || args[0] === '-ri') {
      if (!m.vfs.lookup(file)) { c.err(`no crontab for ${user}\n`); return 1; }
      if (args[0] === '-ri') { const a = await c.readLine(`crontab: really delete ${user}'s crontab? (y/n) `, { tty: true }); if (!/^y/i.test(a || '')) return 0; }
      m.vfs.unlink(file, null);
      return 0;
    }
    if (args[0] === '-e') {
      const n = m.vfs.lookup(file);
      let text = n ? n.c : null;
      if (text == null) {
        c.err(`no crontab for ${user} - using an empty one\n`);
        text = '# Edit this file to introduce tasks to be run by cron.\n# \n# Each task to run has to be defined through a single line\n# indicating with different fields when the task will be run\n# and what command to run for the task\n# \n# To define the time you can provide concrete values for\n# minute (m), hour (h), day of month (dom), month (mon),\n# and day of week (dow) or use \'*\' in these fields (for \'any\').\n# \n# Notice that tasks will be started based on the cron\'s system\n# daemon\'s notion of time and timezones.\n# \n# Output of the crontab jobs (including errors) is sent through\n# email to the user the crontab file belongs to (unless redirected).\n# \n# For example, you can run a backup of all your user accounts\n# at 5 a.m every week with:\n# 0 5 * * 1 tar -zcf /var/backups/home.tgz /home/\n# \n# For more information see the manual pages of crontab(5) and cron(8)\n# \n# m h  dom mon dow   command\n';
      }
      if (c.session.headless) return 0;
      const tmp = `/tmp/crontab.${Math.random().toString(36).slice(2, 8)}/crontab`;
      m.vfs.mkdir(P().dirname(tmp), null, { parents: true });
      m.vfs.writeFile(tmp, text, null, { mode: 0o600 });
      const tn = m.vfs.lookup(tmp); tn.u = c.cred.uid;
      m.vfs.lookup(P().dirname(tmp)).u = c.cred.uid;
      await LX.editFile(c, tmp, c.cred, { editor: 'crontab' });
      const newText = m.vfs.readFile(tmp, null);
      try { m.vfs.remove(P().dirname(tmp), null); } catch (e) { /* 무시 */ }
      if (newText === text && n) { c.err('No modification made\n'); return 0; }
      const bad = checkCron(newText);
      if (bad.length) { c.err(`"${tmp}":${bad[0]}: bad minute\nerrors in crontab file, can't install.\n\x1b[2m(분 시 일 월 요일 명령 — 6개 칸이 모두 있는지 확인하고 다시 crontab -e 하세요)\x1b[0m\n`); return 1; }
      save(newText);
      c.err('crontab: installing new crontab\n');
      return 0;
    }
    // crontab 파일 / -
    const src = args[0];
    if (!src && c.stdin == null) { c.err('crontab: usage error: file name must be specified for replace\nusage:\tcrontab [-u user] file\n\tcrontab [ -u user ] [ -i ] { -e | -l | -r }\n'); return 1; }
    let text;
    if (!src || src === '-') text = await c.readStdin();
    else { try { text = c.fs.readFile(c.resolve(src), c.cred); } catch (e) { c.err(`${src}: ${e.message}\n`); return 1; } }
    const bad = checkCron(text);
    if (bad.length) { c.err(`"-":${bad[0]}: bad minute\nerrors in crontab file, can't install.\n`); return 1; }
    save(text);
    return 0;
  });

  // ---- cron 실행기 (페이지가 열려 있는 동안 매분 실행)
  function cronMatch(field, v, min, max) {
    return field.split(',').some((part) => {
      let [range, step] = part.split('/');
      step = step ? +step : 1;
      let lo = min, hi = max;
      if (range !== '*') { const r = range.split('-'); lo = +r[0]; hi = r[1] != null ? +r[1] : (step > 1 ? max : lo); }
      if (v < lo || v > hi) return false;
      return (v - lo) % step === 0;
    });
  }
  const DOW = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const MONS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  function shouldRun(spec, d) {
    const macro = { '@hourly': '0 * * * *', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@weekly': '0 0 * * 0', '@monthly': '0 0 1 * *', '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *' };
    const f = (macro[spec[0]] || spec.slice(0, 5).join(' ')).split(' ').map((x) => x.toLowerCase().replace(/[a-z]{3}/g, (w) => String(DOW[w] != null ? DOW[w] : MONS[w] != null ? MONS[w] : w)));
    return cronMatch(f[0], d.getUTCMinutes(), 0, 59) && cronMatch(f[1], d.getUTCHours(), 0, 23) && cronMatch(f[2], d.getUTCDate(), 1, 31) && cronMatch(f[3], d.getUTCMonth() + 1, 1, 12) && (cronMatch(f[4], d.getUTCDay(), 0, 6) || (d.getUTCDay() === 0 && cronMatch(f[4], 7, 0, 7)));
  }
  LX.cronTick = async function (m, session) {
    if (!m.state.services.cron || !m.state.services.cron.active) return;
    const d = LX.localDate(m);
    const jobs = [];
    try {
      for (const user of m.vfs.readdir('/var/spool/cron/crontabs', null)) {
        const text = m.vfs.readFile(cronFile(user), null);
        text.split('\n').forEach((l) => {
          const s = l.trim();
          if (!s || s.startsWith('#') || /^[A-Za-z_]\w*\s*=/.test(s)) return;
          const parts = s.split(/\s+/);
          if (parts[0].startsWith('@')) { if (parts[0] === '@reboot') return; jobs.push({ user, spec: [parts[0]], cmd: parts.slice(1).join(' ') }); }
          else jobs.push({ user, spec: parts.slice(0, 5), cmd: s.replace(/^(\S+\s+){5}/, '') });
        });
      }
    } catch (e) { /* 없음 */ }
    try {
      m.vfs.readFile('/etc/crontab', null).split('\n').concat(...LX.globFiles(m, '/etc/cron.d/*').map((f) => m.vfs.readFile(f, null).split('\n'))).forEach((l) => {
        const s = l.trim();
        if (!s || s.startsWith('#') || /^[A-Za-z_]\w*\s*=/.test(s)) return;
        const parts = s.split(/\s+/);
        if (parts.length < 7 || /run-parts|e2scrub|anacron/.test(s)) return;
        jobs.push({ user: parts[5], spec: parts.slice(0, 5), cmd: parts.slice(6).join(' ') });
      });
    } catch (e) { /* 없음 */ }
    for (const j of jobs) {
      if (!shouldRun(j.spec, d)) continue;
      const pid = m.nextPid();
      LX.log(m, `CRON[${pid}]`, `(${j.user}) CMD (${j.cmd})`);
      if (!m.credFor(j.user)) continue;
      const sh = new LX.Shell(session, { user: j.user });
      sh.cwd = sh.cred.home;
      sh.vars.PATH = { v: '/usr/bin:/bin', x: true };
      sh.vars.SHELL = { v: '/bin/sh', x: true };
      let out = '';
      const io = { stdin: new LX.InStream(''), out: (s) => { out += s; }, err: (s) => { out += s; }, tty: false };
      try { await sh.runSource(j.cmd.replace(/%/g, '\n'), io); } catch (e) { /* 무시 */ }
      if (out) LX.log(m, `CRON[${pid}]`, `(CRON) info (No MTA installed, discarding output)`);
    }
  };

  // ======================================================================= 재부팅 · 종료
  def(['reboot', 'poweroff', 'shutdown', 'halt'], async (c) => {
    const m = c.m;
    const args = c.args.slice();
    let kind = c.name === 'reboot' ? 'reboot' : 'poweroff';
    if (c.name === 'shutdown') {
      if (args.includes('-c')) {
        if (!m.state.shutdownAt) { c.err('No scheduled shutdown to cancel.\n'); return 1; }
        delete m.state.shutdownAt;
        c.out(`\nBroadcast message from root@${m.hostname()} on pts/0 (${LX.strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', m.now())}):\n\nThe system shutdown has been cancelled\n\n`);
        return 0;
      }
      if (args.includes('-r')) kind = 'reboot';
      const when = args.find((a) => /^(now|\+\d+|\d{1,2}:\d\d)$/.test(a)) || '+1';
      if (c.cred.uid !== 0) { c.err('Failed to set wall message, ignoring: Interactive authentication required.\nFailed to call ScheduleShutdown in logind, no action will be taken now: Interactive authentication required.\n'); return 1; }
      if (when !== 'now') {
        const mins = when.startsWith('+') ? +when.slice(1) : 1;
        m.state.shutdownAt = m.now() + mins * 60000;
        c.out(`${kind === 'reboot' ? 'Reboot' : 'Shutdown'} scheduled for ${LX.strftime(m, '%a %Y-%m-%d %H:%M:%S %Z', m.state.shutdownAt)}, use 'shutdown -c' to cancel.\n`);
        return 0;
      }
    }
    if (c.cred.uid !== 0) {
      c.err(`Call to ${kind === 'reboot' ? 'Reboot' : 'PowerOff'} failed: Interactive authentication required.\n`);
      return 1;
    }
    if (c.session.headless) { await LX.rebootMachine(m, c.session, kind); return 0; }
    await LX.rebootMachine(m, c.session, kind);
    return 0;
  });

  /** 재부팅: 서비스 · 마운트 · 셸을 부팅 직후 상태로 */
  LX.rebootMachine = async function (m, session, kind) {
    const out = (s) => session.out(s);
    out(`\x1b[2m[  OK  ] Stopped target multi-user.target - Multi-User System.\n[  OK  ] Stopped cron.service - Regular background program processing daemon.\n${Object.keys(m.state.services).filter((s) => m.state.services[s].active && !LX.SERVICES[s] || (LX.SERVICES[s] && !LX.SERVICES[s].sys)).map((s) => `[  OK  ] Stopped ${s}.service.`).join('\n')}\n[  OK  ] Unmounted /boot.\n[  OK  ] Reached target shutdown.target - System Shutdown.\n         ${kind === 'reboot' ? 'Rebooting.' : 'Powering off.'}\x1b[0m\n`);
    session.jobs.list.forEach((j) => session.killJob(j));
    if (session.ui && session.ui.powerCycle) await session.ui.powerCycle(kind);
    else if (!session.headless) await new Promise((r) => setTimeout(r, 900));
    // 상태 초기화 (journalctl --list-boots · -b -1 을 위해 이전 부팅 시각을 남긴다)
    m.state.bootHistory = (m.state.bootHistory || []).concat([m.bootTime]).slice(-9);
    m.bootTime = m.now();
    m.state.reboots = (m.state.reboots || 0) + 1;
    delete m.state.transientHost;
    delete m.state.shutdownAt;
    m.state.sudoTs = {};
    if (m.runtime) m.runtime.servers = {};
    (m.state.containers || []).forEach((ct) => { ct.running = ct.running && /always|unless-stopped/.test(ct.restart || '') && m.state.services.docker && m.state.services.docker.enabled; });
    for (const [name, s] of Object.entries(m.state.services)) {
      s.active = false;
      s.failed = false;
      if (s.enabled && !s.masked) LX.svcStart(m, name);
    }
    // 마운트: fstab 에 없는 것은 해제
    m.state.mounts.filter((x) => x.dir !== '/' && x.dir !== '/boot').forEach((x) => LX.umountDir(m, x));
    m.state.swaps = m.state.swaps.filter((s) => s.file === '/swap.img');
    m.state.swaps.forEach((s) => { s.on = true; });
    const errs = LX.mountAll(m);
    try {
      m.vfs.readFile('/etc/fstab', null).split('\n').forEach((l) => { const f = l.replace(/#.*/, '').trim().split(/\s+/); if (f[2] === 'swap' && f[0] && f[0] !== '/swap.img') { const n = m.vfs.lookup(f[0]); if (n && n.swapSig) m.state.swaps.push({ file: f[0], size: Math.round((n.sz || 0) / 1048576), type: 'file' }); } });
    } catch (e) { /* 없음 */ }
    m.initProcs();
    LX.log(m, 'kernel', `Linux version ${LX.OS.kernel} (buildd@lcy02-amd64-015)`);
    LX.log(m, 'systemd[1]', 'Reached target multi-user.target - Multi-User System.');
    session.stack = [];
    session.history = [];
    if (session.ui && session.ui.clear && !session.headless) session.ui.clear();
    if (errs.length) {
      out(`\x1b[1;31m[FAILED]\x1b[0m Failed to mount ${errs[0].replace(/^mount: ([^:]+):.*$/, '$1')}.\n\x1b[1;31m[DEPEND]\x1b[0m Dependency failed for local-fs.target - Local File Systems.\n\nYou are in emergency mode. After logging in, type "journalctl -xb" to view\nsystem logs, "systemctl reboot" to reboot, or "exit"\nto continue bootup.\n\x1b[1;33m(가상 터미널: /etc/fstab 에 잘못된 줄이 있어 부팅이 멈춘 상황입니다. 실제 서버라면 콘솔에서 복구해야 합니다.\n 여기서는 그대로 로그인되니 sudo nano /etc/fstab 로 고치고 sudo mount -a 로 확인하세요)\x1b[0m\n\n`);
      errs.forEach((e) => LX.log(m, 'systemd[1]', e));
    }
    if (session.ui && session.ui.banner) session.ui.banner();
    await session.start(m.defaultUser);
    m.save();
  };

  // ======================================================================= logrotate
  def('logrotate', async (c) => {
    const debug = c.args.includes('-d') || c.args.includes('--debug');
    const force = c.args.includes('-f') || c.args.includes('--force');
    const conf = c.args.filter((a) => !a.startsWith('-')).pop() || '/etc/logrotate.conf';
    if (c.cred.uid !== 0 && !debug) { c.err('error: error setting owner of /var/lib/logrotate/status.tmp to uid 0 and gid 0: Operation not permitted\nerror: error creating output file /var/lib/logrotate/status.tmp: Operation not permitted\n'); return 1; }
    let text;
    try { text = c.fs.readFile(c.resolve(conf), c.cred); } catch (e) { c.err(`error: cannot stat ${conf}: ${e.message}\n`); return 1; }
    const files = [];
    const blocks = [text].concat(/include \/etc\/logrotate\.d/.test(text) ? LX.globFiles(c.m, '/etc/logrotate.d/*').map((f) => safe(c, f)) : []);
    blocks.forEach((t) => {
      const re = /((?:^[^\s{#][^\n{]*\n?)+)\s*\{([\s\S]*?)\}/gm;
      let r;
      while ((r = re.exec(t))) r[1].split(/\s+/).filter(Boolean).forEach((p) => files.push({ pat: p, body: r[2] }));
    });
    if (debug) c.out(`warning: logrotate in debug mode does nothing except printing debug messages!  Consider using verbose mode (-v) instead if this is not what you want.\n\nreading config file ${conf}\n`);
    for (const f of files) {
      const list = LX.globFiles(c.m, f.pat);
      const rotate = +((/rotate\s+(\d+)/.exec(f.body) || [])[1] || 4);
      if (debug) {
        c.out(`\nrotating pattern: ${f.pat}  ${/daily/.test(f.body) ? 'after 1 days' : /monthly/.test(f.body) ? 'monthly' : 'weekly'} (${rotate} rotations)\nempty log files are ${/notifempty/.test(f.body) ? 'not ' : ''}rotated, old logs are removed\n`);
        list.forEach((x) => c.out(`considering log ${x}\n  Now: ${LX.strftime(c.m, '%Y-%m-%d %H:%M', c.m.now())}\n  Last rotated at ${LX.strftime(c.m, '%Y-%m-%d %H:00', c.m.bootTime)}\n  log does not need rotating (log has been already rotated)\n`));
        if (!list.length) c.out(`considering log ${f.pat}\n  log ${f.pat} does not exist -- skipping\n`);
        continue;
      }
      if (!force) continue;
      for (const x of list) {
        const node = c.fs.lookup(x);
        if (!node || (/notifempty/.test(f.body) && !node.c)) continue;
        if (c.fs.lookup(`${x}.${rotate}`)) c.fs.unlink(`${x}.${rotate}`, null);
        for (let i = rotate - 1; i >= 1; i--) {
          if (c.fs.lookup(`${x}.${i}`)) c.fs.rename(`${x}.${i}`, `${x}.${i + 1}`, null);
        }
        c.fs.rename(x, `${x}.1`, null);
        c.fs.writeFile(x, '', null, { mode: node.m });
        const nn = c.fs.lookup(x); nn.u = node.u; nn.g = node.g;
      }
    }
    return 0;
  });
})(typeof window !== 'undefined' ? window : globalThis);

