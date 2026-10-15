UBUNTU_COURSE.addChapter({
  id: 'adv01',
  no: '+',
  extra: true,
  icon: '🚇',
  title: '공인 IP 없는 서버 공개 — 터널',
  subtitle: '심화 실습 (선택) · Cloudflare Tunnel · Oracle 중계 역방향 SSH 터널',
  summary: '학교 실습실이나 집에 있는 서버는 대부분 <b>공인 IP 가 없고</b>, 공유기 · 학교 방화벽(NAT) 뒤에 있어서 바깥에서 들어올 수 없습니다. 하지만 <b>안에서 바깥으로 나가는 연결</b>은 열려 있습니다. 이 점을 이용해, 서버가 먼저 바깥으로 연결(터널)을 열고 그 통로로 요청을 받는 두 가지 방법을 실습합니다. ① <b>Cloudflare Tunnel</b> — 계정 없이도 HTTPS 주소가 바로 생기는 방법, ② <b>역방향 SSH 터널</b> — 6일차에 만든 Oracle 무료 서버를 중계소로 쓰는 방법. 가상 터미널의 <code>school</code> 명령이 학교 실습실 서버 역할을 합니다.',
  goals: [
    'NAT 뒤 서버가 바깥에서 보이지 않는 이유와 "나가는 연결은 된다" 는 원리를 설명할 수 있다',
    'cloudflared Quick Tunnel 로 학교 서버를 HTTPS 주소로 공개하고, 이름 있는 터널의 구성 요소를 안다',
    '역방향 SSH 터널(ssh -R)로 Oracle 서버의 포트를 학교 서버에 연결하고 GatewayPorts · 두 겹 방화벽을 설정한다',
    'autossh 와 systemd 로 끊겨도 다시 붙는 상시 터널을 만든다',
    '터널이 학교 보안 정책을 우회한다는 점과 노출 범위를 최소화하는 방법을 안다'
  ],
  sections: [
    // =====================================================================
    {
      id: 'adv01-1',
      title: '학교 서버는 왜 바깥에서 안 보일까 — NAT 와 터널',
      minutes: 60,
      goals: [
        '사설 IP · 공인 IP · NAT 를 구분한다',
        '들어오는 연결과 나가는 연결의 차이를 실험으로 확인한다',
        '터널의 기본 원리를 그림으로 설명한다'
      ],
      flow: [['학교 서버 둘러보기', 20], ['바깥에서 접속 시도', 15], ['터널 원리', 15], ['정리', 10]],
      content: [
        { type: 'callout', kind: 'info', title: '가상 학교 서버 — school', html: '<p>오른쪽 터미널은 지금까지처럼 <b>Oracle 무료 서버</b>(공인 IP <code>203.0.113.25</code>)입니다. 여기에 <code>school</code> 을 입력하면 <b>학교 실습실 서버(school-lab)</b>로 들어갑니다. 돌아올 때는 <code>exit</code>. <code>school 명령</code> 처럼 한 줄만 실행할 수도 있습니다.</p><table><tr><th></th><th>Oracle 서버 (기본)</th><th>학교 서버 (school)</th></tr><tr><td>IP</td><td>공인 203.0.113.25</td><td>사설 172.16.10.20 (공인 IP 없음)</td></tr><tr><td>바깥 → 안</td><td>보안 목록 · iptables 로 열 수 있음</td><td>학교 방화벽 · NAT 가 막음 (우리가 못 바꿈)</td></tr><tr><td>안 → 바깥</td><td>됨</td><td>됨 (학교 공용 IP 175.211.40.7 로 나감)</td></tr><tr><td>웹 서버</td><td>7~8일차에 만든 것</td><td>Nginx 가 이미 동작 중</td></tr></table>' },
        { type: 'cmd', title: '학교 서버 둘러보기', code: 'school\nhostname\nip -br addr\ncurl -s ifconfig.me; echo\ncurl -s localhost | head -4\nexit', desc: '<code>ip</code> 에는 사설 IP <b>172.16.10.20</b> 만 보이고, 바깥에서 본 내 주소(<code>ifconfig.me</code>)는 <b>175.211.40.7</b> — 학교 전체가 함께 쓰는 공용 주소입니다. 이렇게 여러 컴퓨터가 주소 하나를 나눠 쓰게 해 주는 것이 <b>NAT</b> 입니다.' },
        { type: 'cmd', title: '바깥에서 학교 서버로 들어가 보기', code: 'labclient curl -s -m 3 http://172.16.10.20; echo "사설 IP: $?"\nlabclient curl -s -m 3 http://175.211.40.7; echo "학교 공용 IP: $?"\nschool curl -s -m 3 -o /dev/null -w "%{http_code}\\n" https://www.google.com', desc: '사설 IP 는 인터넷에서 길이 없고, 학교 공용 IP 로 들어온 요청은 NAT 가 어느 컴퓨터로 보낼지 몰라 버립니다(둘 다 시간 초과 28). 반대로 학교 서버에서 <b>나가는</b> 요청은 잘 됩니다(200).' },
        { type: 'figure', html: '<svg viewBox="0 0 700 230" style="width:100%;height:auto" font-family="var(--sans)"><rect x="10" y="20" width="250" height="190" rx="14" fill="var(--card2)" stroke="var(--line)" stroke-dasharray="5 4"/><text x="26" y="44" font-size="13" fill="var(--muted)">학교망 (NAT 뒤)</text><rect x="40" y="70" width="190" height="64" rx="10" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="135" y="98" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fg)">🏫 school-lab</text><text x="135" y="120" text-anchor="middle" font-size="12" fill="var(--muted)">172.16.10.20 · Nginx :80</text><rect x="420" y="20" width="270" height="80" rx="12" fill="var(--card)" stroke="var(--line)"/><text x="555" y="50" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fg)">중계소 (공인 IP 있음)</text><text x="555" y="74" text-anchor="middle" font-size="12" fill="var(--muted)">① Cloudflare  /  ③ Oracle 서버</text><path d="M230 95 C320 95 340 60 418 60" stroke="var(--accent)" stroke-width="3" fill="none"/><text x="320" y="70" text-anchor="middle" font-size="12" fill="var(--accent)">① 학교 서버가 먼저 연결 (나가는 방향)</text><rect x="470" y="150" width="170" height="54" rx="10" fill="var(--card)" stroke="var(--line)"/><text x="555" y="182" text-anchor="middle" font-size="13" fill="var(--fg)">🌐 바깥 사용자</text><path d="M555 150 V102" stroke="var(--fg)" stroke-width="2.5" marker-end="url(#ar)"/><text x="600" y="132" font-size="12" fill="var(--muted)">② 중계소로 접속</text><path d="M418 80 C330 80 320 120 232 120" stroke="var(--muted)" stroke-width="2" stroke-dasharray="6 4" fill="none"/><text x="320" y="140" text-anchor="middle" font-size="12" fill="var(--muted)">③ 같은 연결을 거꾸로 타고 전달</text><line x1="270" y1="190" x2="460" y2="190" stroke="#d1242f" stroke-width="2.5"/><text x="365" y="182" text-anchor="middle" font-size="12" fill="#d1242f">✖ 바깥에서 바로 들어오기</text><defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--fg)"/></marker></defs></svg>', caption: '터널 = 안에서 먼저 열어 둔 연결을 바깥 요청이 거꾸로 타고 들어오는 것' },
        { type: 'table', head: ['', '① Cloudflare Tunnel', '③ 역방향 SSH 터널 (Oracle 중계)'], rows: [['중계소', 'Cloudflare (전 세계 엣지)', '내 Oracle 무료 서버'], ['필요한 것', '없음(Quick) / Cloudflare 계정 + 도메인(고정 주소)', 'SSH 키 · Oracle 서버 · 방화벽 설정'], ['HTTPS', '자동', '직접 (Caddy 등)'], ['나가는 포트', '443 / 7844', '22'], ['장점', '가장 간단, HTTPS, 접근 제어(Access)', '외부 서비스 가입 없음, 원리가 다 보임, 아무 TCP 포트나'], ['주의', '트래픽이 Cloudflare 를 거침', '중계 서버 보안 · 터널 유지 관리']] },
        { type: 'callout', kind: 'warn', title: '먼저 학교(기관) 승인부터', html: '<p>터널은 학교 방화벽을 <b>우회</b>하는 효과가 있습니다. 실제 학교 · 회사 서버에 쓰기 전에는 반드시 정보보안 담당자의 승인을 받고, 공개하는 것은 <b>웹 서비스 포트 하나</b>로 제한합니다. 관리 화면 · DB · SSH 를 터널로 그대로 열면 안 됩니다.</p>' }
      ],
      practice: [
        {
          title: '심화 1. 학교 서버의 두 주소',
          level: 1,
          desc: '<p>학교 서버의 <b>사설 IP</b> 와 바깥에서 보이는 <b>학교 공용 IP</b> 를 확인해 Oracle 서버의 <code>~/cloud70/adv/nat.md</code> 에 적으세요.</p>',
          hint: '<code>school ip -br addr</code> · <code>school curl -s ifconfig.me</code>',
          solution: 'mkdir -p ~/cloud70/adv\n{\n  echo "# 학교 서버 주소"\n  echo "- 사설 IP: $(school hostname -I | awk \'{print $1}\')"\n  echo "- 학교 공용 IP(NAT): $(school curl -s ifconfig.me)"\n} > ~/cloud70/adv/nat.md\ncat ~/cloud70/adv/nat.md',
          check: 'f=/home/student/cloud70/adv/nat.md; grep -q 172.16.10.20 $f && grep -q 175.211.40.7 $f',
          checkOk: '사설 IP 와 NAT 공용 IP 를 구분했습니다.',
          checkFail: 'nat.md 에 172.16.10.20 과 175.211.40.7 이 모두 있는지 확인하세요.'
        }
      ],
      quiz: [
        { q: '학교 서버(사설 IP)에 바깥에서 바로 접속할 수 없는 가장 큰 이유는?', options: ['Nginx 가 꺼져 있어서', 'NAT 뒤라 들어오는 요청을 어느 컴퓨터로 보낼지 정해져 있지 않아서', 'SSH 키가 없어서', 'HTTPS 가 아니라서'], answer: 1, explain: '포트포워딩을 설정하지 않은 NAT 는 들어오는 새 연결을 버립니다.' },
        { q: '터널이 동작하는 핵심 원리는?', options: ['학교 방화벽 설정을 바꾼다', '서버가 먼저 바깥 중계소로 연결을 열고, 그 연결로 요청을 받는다', '공인 IP 를 새로 받는다', 'DNS 만 바꾼다'], answer: 1, explain: '나가는 연결은 허용되므로, 미리 열어 둔 연결을 거꾸로 씁니다.' },
        { q: '실제 학교 서버에 터널을 쓰기 전에 꼭 해야 할 일은?', options: ['서버 재설치', '정보보안 담당자 승인과 공개 범위 최소화', '방화벽 끄기', 'root 비밀번호 공유'], answer: 1, explain: '터널은 기관 방화벽을 우회하므로 승인이 필요합니다.' }
      ],
      slides: [
        { layout: 'title', title: '공인 IP 없는 서버 공개', subtitle: '심화 실습 · 터널', notes: '<p>"집이나 실습실 컴퓨터를 친구에게 보여 주고 싶다면?" 으로 시작합니다.</p>' },
        { layout: 'table', title: '두 서버 비교', head: ['', 'Oracle', '학교 서버'], rows: [['IP', '공인 203.0.113.25', '사설 172.16.10.20'], ['바깥 → 안', '열 수 있음', '막힘 (NAT)'], ['안 → 바깥', '됨', '됨']], notes: '<p>labclient 로 직접 막히는 것을 보여 줍니다.</p>' },
        { layout: 'bullets', title: '터널의 원리', bullets: ['서버가 먼저 바깥 중계소로 연결', '바깥 사용자는 중계소로 접속', '요청이 열린 연결을 거꾸로 타고 서버로', '① Cloudflare · ③ Oracle 서버가 중계소'], notes: '' },
        { layout: 'summary', title: '정리', bullets: ['사설 IP · NAT 공용 IP', '나가는 연결은 된다', '승인 · 최소 공개'], notes: '' }
      ]
    },
    // =====================================================================
    {
      id: 'adv01-2',
      title: '방법 ① Cloudflare Tunnel',
      minutes: 120,
      goals: [
        '학교 서버에 cloudflared 를 설치한다',
        'Quick Tunnel 로 계정 없이 HTTPS 주소를 만들고 바깥에서 확인한다',
        '이름 있는 터널(고정 주소)과 서비스 등록의 구성 요소를 안다'
      ],
      flow: [['설치', 20], ['Quick Tunnel', 35], ['백그라운드 실행 · 종료', 20], ['이름 있는 터널', 35], ['정리', 10]],
      content: [
        { type: 'cmd', title: '1. 학교 서버에 cloudflared 설치 (Cloudflare 공식 APT 저장소)', code: 'school\nsudo mkdir -p --mode=0755 /usr/share/keyrings\ncurl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null\necho "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list\nsudo apt-get update && sudo apt-get install -y cloudflared\ncloudflared --version', desc: '3일차의 Docker 설치처럼 회사 공식 저장소를 등록하고 설치합니다. 이후 <code>apt upgrade</code> 로 함께 업데이트됩니다.' },
        { type: 'cmd', title: '2. Quick Tunnel — 계정 없이 한 줄', code: 'cloudflared tunnel --url http://localhost:80', desc: '출력 상자 안의 <code>https://○○○-○○○-○○○-○○○.trycloudflare.com</code> 이 지금 만들어진 주소입니다. 이 명령이 실행되는 동안만 열려 있고, <b>Ctrl+C</b> 로 끄면 닫힙니다. 실행 중에는 다른 명령을 칠 수 없으니 확인해 보고 Ctrl+C 로 끕니다.' },
        { type: 'cmd', title: '3. 백그라운드로 켜 두고 바깥에서 확인', code: 'nohup cloudflared tunnel --url http://localhost:80 > ~/cf.log 2>&1 &\nsleep 2\nU=$(grep -o \'https://[a-z0-9-]*\\.trycloudflare\\.com\' ~/cf.log | head -1); echo $U\nexit\nlabclient curl -s $(school "grep -o \'https://[a-z0-9-]*\\.trycloudflare\\.com\' ~/cf.log | head -1") | head -4', desc: '<code>nohup ... &</code> 은 터미널을 닫아도 계속 실행되게 하는 방법입니다. 마지막 줄은 Oracle 서버로 돌아와서, 바깥 PC(labclient)가 그 주소로 학교 서버 페이지를 보는지 확인합니다. 실제로는 휴대폰 브라우저로 열어 보세요 — 자물쇠(HTTPS)까지 붙어 있습니다.' },
        { type: 'cmd', title: '4. 끄기', code: 'school "pkill cloudflared; sleep 1; pgrep -a cloudflared || echo 터널 종료"', desc: '끈 뒤 같은 주소로 접속하면 Cloudflare 가 <code>error code: 1033</code>(터널 없음)을 돌려줍니다. 다시 켜면 <b>주소가 매번 바뀝니다</b>.' },
        { type: 'table', head: ['Quick Tunnel 의 한계', '내용'], rows: [['주소', '실행할 때마다 바뀜 (trycloudflare.com 하위 주소)'], ['신뢰성', '가동 보장 없음 — 시연 · 테스트용'], ['동시 요청', '최대 200개 처리, 넘으면 429'], ['기타', 'SSE(Server-Sent Events) 미지원']] },
        { type: 'h', text: '고정 주소 — 이름 있는 터널 (실제 서버)' },
        { type: 'callout', kind: 'vm', title: '준비물: Cloudflare 계정 + Cloudflare 에 등록한 도메인', html: '<p>내 도메인(예: <code>example.com</code>)의 네임서버를 Cloudflare 로 바꿔 두어야 합니다. DuckDNS 같은 남의 하위 도메인은 쓸 수 없습니다. 학교 방화벽이 엄격하면 Cloudflare 로 나가는 <b>7844</b> 포트가 열려 있는지도 확인합니다.</p>' },
        { type: 'cmd', vm: true, title: '로그인 · 터널 만들기 · DNS 연결', code: 'cloudflared tunnel login\ncloudflared tunnel create school-lab\ncloudflared tunnel list\ncloudflared tunnel route dns school-lab lab.example.com', expect: 'Tunnel credentials written to /home/student/.cloudflared/6ff42ae2-765d-4adf-8112-31c55c1551ef.json. cloudflared chose this file based on where your origin certificate was found. Keep this file secret. To revoke these credentials, delete the tunnel.\n\nCreated tunnel school-lab with id 6ff42ae2-765d-4adf-8112-31c55c1551ef', desc: '<code>login</code> 은 브라우저가 열려 도메인을 고르면 <code>~/.cloudflared/cert.pem</code> 이 생깁니다. <code>create</code> 는 터널 ID(UUID)와 인증 파일(<code>UUID.json</code>, 비밀!)을 만들고, <code>route dns</code> 는 내 도메인에 이 터널로 가는 CNAME 을 만듭니다.' },
        { type: 'file', path: '~/.cloudflared/config.yml', title: '터널 설정 (UUID 는 자기 것으로)', code: 'tunnel: 6ff42ae2-765d-4adf-8112-31c55c1551ef\ncredentials-file: /home/student/.cloudflared/6ff42ae2-765d-4adf-8112-31c55c1551ef.json\n\ningress:\n  - hostname: lab.example.com\n    service: http://localhost:80\n  - service: http_status:404', desc: '<code>ingress</code> 는 위에서부터 차례로 맞춰 봅니다. 마지막 줄은 "나머지는 404" — 이 규칙이 있어야 서버의 다른 포트가 실수로 노출되지 않습니다.' },
        { type: 'cmd', vm: true, title: '실행 → 서비스로 등록', code: 'cloudflared tunnel run school-lab\n# 확인되면 Ctrl+C 후 서비스로\nsudo cloudflared service install\nsystemctl status cloudflared --no-pager', desc: '서비스로 등록하면 재부팅해도 터널이 자동으로 다시 열립니다. 서비스는 <code>/etc/cloudflared/</code> 의 설정을 읽으므로, 설치 안내가 그 경로로 설정을 옮기라고 하면 따릅니다.' },
        { type: 'callout', kind: 'more', title: '더 해 보기 — 접근 제어 (Cloudflare Access)', html: '<p>Cloudflare Zero Trust 대시보드의 <b>Access</b> 에서 이 주소에 "학교 이메일로 로그인한 사람만" 같은 정책을 걸 수 있습니다. 관리 화면을 터널로 열어야 할 때는 반드시 이런 로그인 관문을 앞에 둡니다.</p>' }
      ],
      practice: [
        {
          title: '심화 2. Quick Tunnel 로 학교 서버 공개',
          level: 2,
          desc: '<p>학교 서버에 cloudflared 를 설치하고 Quick Tunnel 을 <b>백그라운드</b>로 켜서 로그를 학교 서버의 <code>~/cf.log</code> 에 남기세요. 바깥(labclient)에서 그 주소로 <b>학교 실습실 서버</b> 페이지가 보여야 합니다.</p>',
          hint: '<code>school</code> 로 들어가 설치 → <code>nohup cloudflared tunnel --url http://localhost:80 > ~/cf.log 2>&1 &</code>',
          solution: 'school "sudo mkdir -p --mode=0755 /usr/share/keyrings; curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null; echo \'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main\' | sudo tee /etc/apt/sources.list.d/cloudflared.list; sudo apt-get update -q; sudo apt-get install -y cloudflared"\nschool "nohup cloudflared tunnel --url http://localhost:80 > ~/cf.log 2>&1 &"\nsleep 2\nU=$(school "grep -o \'https://[a-z0-9-]*\\.trycloudflare\\.com\' ~/cf.log | head -1")\necho "$U"\nlabclient curl -s "$U" | head -4',
          check: 'U=$(school "grep -o \'https://[a-z0-9-]*\\.trycloudflare\\.com\' ~/cf.log 2>/dev/null | tail -1"); [ -n "$U" ] && labclient curl -s -m 5 "$U" 2>/dev/null | grep -q "학교 실습실 서버"',
          checkOk: '공인 IP 없는 학교 서버가 HTTPS 주소로 공개되었습니다. (확인했으면 school "pkill cloudflared" 로 꺼 두세요)',
          checkFail: '<code>school cat ~/cf.log</code> 에 trycloudflare 주소가 있는지, 터널이 아직 켜져 있는지(<code>school pgrep -a cloudflared</code>) 확인하세요. 브라우저를 새로고침했다면 터널이 꺼졌으니 다시 켜세요.'
        }
      ],
      quiz: [
        { q: 'Quick Tunnel(trycloudflare.com)에 대한 설명으로 틀린 것은?', options: ['계정 없이 쓸 수 있다', 'HTTPS 주소가 자동으로 생긴다', '주소가 항상 같아서 운영 서비스에 알맞다', '실행 중일 때만 열려 있다'], answer: 2, explain: '실행할 때마다 주소가 바뀌고 가동 보장이 없어 시연 · 테스트용입니다.' },
        { q: '이름 있는 터널로 고정 주소를 쓰려면 꼭 필요한 것은?', options: ['공인 IP', 'Cloudflare 계정과 Cloudflare 에 등록한 내 도메인', 'DuckDNS', '포트포워딩'], answer: 1, explain: 'route dns 가 내 도메인에 CNAME 을 만듭니다.' },
        { q: 'config.yml 의 마지막 <code>- service: http_status:404</code> 의 역할은?', options: ['HTTPS 강제', '규칙에 맞지 않는 요청은 404 로 막아 다른 서비스 노출을 방지', '로그 저장', '속도 향상'], answer: 1, explain: 'ingress 의 마지막 기본 규칙입니다.' }
      ],
      slides: [
        { layout: 'title', title: '① Cloudflare Tunnel', subtitle: 'cloudflared 한 줄로 HTTPS 공개', notes: '' },
        { layout: 'code', title: 'Quick Tunnel', code: 'cloudflared tunnel --url http://localhost:80\n# → https://○○○.trycloudflare.com', points: ['계정 불필요', '주소는 매번 바뀜', 'Ctrl+C 로 닫힘'], notes: '<p>휴대폰으로 같이 열어 봅니다.</p>' },
        { layout: 'code', title: '이름 있는 터널', code: 'cloudflared tunnel login\ncloudflared tunnel create school-lab\ncloudflared tunnel route dns school-lab lab.example.com\ncloudflared tunnel run school-lab\nsudo cloudflared service install', vm: true, points: ['도메인 필요', 'config.yml ingress', '서비스로 상시 실행'], notes: '' },
        { layout: 'practice', title: '심화 2', bullets: ['school 에 cloudflared 설치', 'nohup ... & 로 Quick Tunnel', 'labclient 로 주소 확인', 'pkill 로 끄기'], notes: '' },
        { layout: 'summary', title: '정리', bullets: ['가장 쉬운 공개 + HTTPS', '고정 주소는 계정 · 도메인', 'Access 로 접근 제어'], notes: '' }
      ]
    },
    // =====================================================================
    {
      id: 'adv01-3',
      title: '방법 ③ Oracle 서버를 중계로 — 역방향 SSH 터널',
      minutes: 160,
      goals: [
        '학교 서버의 키를 Oracle 서버에 등록하고 ssh -R 로 터널을 연다',
        'GatewayPorts 와 두 겹 방화벽으로 터널 포트를 바깥에 공개한다',
        'autossh + systemd 로 재부팅 · 끊김에도 유지되는 터널을 만든다',
        '터널 전용 키를 제한하는 보안 설정을 안다'
      ],
      flow: [['키 등록', 25], ['첫 터널', 30], ['바깥에 공개', 35], ['상시 터널', 45], ['보안 · 정리', 25]],
      content: [
        { type: 'figure', html: '<svg viewBox="0 0 700 160" style="width:100%;height:auto" font-family="var(--sans)"><rect x="10" y="50" width="180" height="70" rx="12" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="100" y="80" text-anchor="middle" font-size="15" font-weight="700" fill="var(--fg)">🏫 school-lab</text><text x="100" y="104" text-anchor="middle" font-size="13" font-family="var(--mono)" fill="var(--muted)">localhost:80</text><rect x="340" y="50" width="200" height="70" rx="12" fill="var(--card)" stroke="var(--line)"/><text x="440" y="80" text-anchor="middle" font-size="15" font-weight="700" fill="var(--fg)">🟥 Oracle 서버</text><text x="440" y="104" text-anchor="middle" font-size="12" font-family="var(--mono)" fill="var(--muted)">sshd :22 · 입구 :8080</text><path d="M190 72 H338" stroke="var(--accent)" stroke-width="3"/><text x="265" y="40" text-anchor="middle" font-size="13" fill="var(--accent)">① ssh -R (22번으로 나감)</text><path d="M338 100 H190" stroke="var(--muted)" stroke-width="2" stroke-dasharray="6 4"/><text x="265" y="142" text-anchor="middle" font-size="13" fill="var(--muted)">③ 같은 연결로 되돌려 보냄</text><rect x="600" y="50" width="90" height="70" rx="12" fill="var(--card)" stroke="var(--line)"/><text x="645" y="90" text-anchor="middle" font-size="14" fill="var(--fg)">🌐 사용자</text><path d="M600 85 H542" stroke="var(--fg)" stroke-width="2.5"/><text x="571" y="40" text-anchor="middle" font-size="13" fill="var(--muted)">② :8080</text></svg>', caption: 'ssh -R 8080:localhost:80 — "Oracle 의 8080 으로 온 것을 내 쪽(학교 서버) localhost:80 으로 보내 줘"' },
        { type: 'callout', kind: 'info', title: '가상 터미널과 실제 서버의 차이', html: '<p>가상 Oracle 서버의 사용자는 <code>student</code> 이므로 <code>student@203.0.113.25</code> 로 접속합니다. 실제 Oracle 서버는 <code>ubuntu@공인IP</code> (또는 6일차의 <code>Host oracle</code> 별명)입니다.</p>' },
        { type: 'h', text: '1. 학교 서버의 키를 Oracle 서버에 등록' },
        { type: 'cmd', title: '학교 서버에서 키 만들기', code: 'school "ssh-keygen -t ed25519 -N \'\' -C school-tunnel -f ~/.ssh/id_ed25519 -q; cat ~/.ssh/id_ed25519.pub"', desc: '터널 전용 키입니다(주석 <code>school-tunnel</code>). 10일차에 Oracle 서버의 비밀번호 로그인을 껐으므로 <code>ssh-copy-id</code> 는 쓸 수 없습니다. 공개키 한 줄을 Oracle 서버의 <code>authorized_keys</code> 에 직접 붙여 넣습니다.' },
        { type: 'cmd', title: 'Oracle 서버에 붙여 넣기 (가상 터미널 지름길)', code: 'mkdir -p ~/.ssh && chmod 700 ~/.ssh\nschool cat .ssh/id_ed25519.pub >> ~/.ssh/authorized_keys\nchmod 600 ~/.ssh/authorized_keys\ntail -1 ~/.ssh/authorized_keys', desc: '실제로는 학교 서버에서 출력된 줄을 복사해 Oracle 서버에서 <code>nano ~/.ssh/authorized_keys</code> 맨 아래에 붙여 넣습니다.' },
        { type: 'h', text: '2. 첫 터널' },
        { type: 'cmd', title: '학교 서버 → Oracle 로 터널 열기', code: 'school\nssh -N -R 8080:localhost:80 student@203.0.113.25', desc: '처음 접속하는 서버라 지문을 물으면 <code>yes</code>. <code>-N</code> 은 "명령은 실행하지 않고 연결만 유지", <code>-R 8080:localhost:80</code> 은 "Oracle 의 8080 → 학교 서버의 localhost:80". 아무것도 출력되지 않고 멈춰 있으면 성공입니다. <b>Ctrl+C</b> 로 끊고, 이번에는 <code>-f</code>(백그라운드)를 붙여 다시 엽니다.' },
        { type: 'cmd', title: '백그라운드로 열고 Oracle 쪽에서 확인', code: 'ssh -f -N -R 8080:localhost:80 student@203.0.113.25\nexit\nsudo ss -tlnp | grep 8080\ncurl -s localhost:8080 | head -4\nlabclient curl -s -m 3 http://203.0.113.25:8080; echo "바깥: $?"', desc: 'Oracle 서버의 sshd 가 <code>127.0.0.1:8080</code> 에서 기다리고, 서버 안에서 <code>curl localhost:8080</code> 하면 학교 서버 페이지가 나옵니다. 하지만 바깥에서는 안 됩니다. sshd 는 기본값(<code>GatewayPorts no</code>)으로 터널 입구를 <b>127.0.0.1 에만</b> 열기 때문입니다 — 안전한 기본값입니다.' },
        { type: 'h', text: '3. 바깥에 공개 — GatewayPorts + 두 겹 방화벽' },
        { type: 'file', path: '/etc/ssh/sshd_config.d/02-tunnel.conf', title: 'Oracle 서버: 터널 입구 주소를 클라이언트가 정할 수 있게', code: 'GatewayPorts clientspecified', desc: '<code>yes</code> 는 모든 터널을 무조건 0.0.0.0 에 열고, <code>clientspecified</code> 는 터널을 여는 쪽이 <code>-R 0.0.0.0:8080:...</code> 처럼 명시할 때만 엽니다. 실수로 열리는 일이 적은 쪽을 고릅니다.' },
        { type: 'cmd', title: '적용 → 터널 다시 열기 → 방화벽 열기', code: 'echo "GatewayPorts clientspecified" | sudo tee /etc/ssh/sshd_config.d/02-tunnel.conf\nsudo sshd -t && sudo systemctl reload ssh\nschool "pkill -f \'^ssh .*-R\'; ssh -f -N -R 0.0.0.0:8080:localhost:80 student@203.0.113.25"\nsudo ss -tlnp | grep 8080\nseclist add 8080\nsudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 8080 -j ACCEPT\nsudo netfilter-persistent save\nlabclient curl -s http://203.0.113.25:8080 | head -4', desc: '이번에는 <code>0.0.0.0:8080</code> 으로 열립니다. 6일차의 두 겹 방화벽(보안 목록 + iptables)까지 열면 바깥에서 학교 서버 페이지가 보입니다.' },
        { type: 'callout', kind: 'more', title: 'HTTPS 로 공개하려면', html: '<p>8일차의 Caddy 가 이미 80 · 443 을 쓰고 있다면, 8080 을 바깥에 열지 않고 Caddy 가 터널 입구로 넘겨주게 할 수 있습니다. 다만 Caddy 는 컨테이너 안에 있어서 서버의 <code>127.0.0.1</code> 을 직접 볼 수 없습니다. 터널 입구를 Docker 브리지 주소(예: <code>-R 172.17.0.1:8080:localhost:80</code>)에 열고, compose 에 <code>extra_hosts: ["host.docker.internal:host-gateway"]</code>, Caddyfile 에 <code>school.내도메인 { reverse_proxy host.docker.internal:8080 }</code> 처럼 연결합니다. 환경마다 브리지 주소가 다를 수 있으니 <code>ip -br addr show docker0</code> 으로 확인하고 시험해 보세요.</p>' },
        { type: 'h', text: '4. 끊겨도 다시 붙는 상시 터널 — autossh + systemd' },
        { type: 'p', html: '<code>ssh -f</code> 터널은 네트워크가 잠깐 끊기거나 학교 서버가 재부팅되면 사라집니다. <b>autossh</b> 는 터널이 끊기면 다시 연결하고, <b>systemd 서비스</b>로 등록하면 부팅할 때 자동으로 켜집니다.' },
        { type: 'file', path: '/etc/systemd/system/reverse-tunnel.service', title: '학교 서버: 터널 서비스', code: '[Unit]\nDescription=Reverse SSH tunnel to Oracle (8080 -> school:80)\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nUser=student\nExecStart=/usr/bin/autossh -M 0 -N -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -R 0.0.0.0:8080:localhost:80 student@203.0.113.25\nRestart=always\nRestartSec=10\n\n[Install]\nWantedBy=multi-user.target', desc: '<code>User=student</code> — 키와 known_hosts 가 student 의 홈에 있으므로 꼭 필요합니다(빼면 root 로 실행되어 인증 실패). <code>-M 0</code> + <code>ServerAlive*</code> 는 "30초마다 살아 있는지 묻고 3번 답이 없으면 끊고 다시 연결", <code>ExitOnForwardFailure=yes</code> 는 "포트를 못 열면 실패로 끝내서 systemd 가 다시 시도하게".' },
        { type: 'cmd', title: '학교 서버에 설치 · 등록', code: 'school\npkill -f \'^ssh .*-R\'\nsudo apt install -y autossh\nsudo nano /etc/systemd/system/reverse-tunnel.service\nsudo systemctl daemon-reload\nsudo systemctl enable --now reverse-tunnel\nsystemctl status reverse-tunnel --no-pager | head -5\nexit\nlabclient curl -s http://203.0.113.25:8080 | head -4', desc: '손으로 연 터널(-f)을 먼저 끄지 않으면 8080 이 이미 쓰이고 있어 서비스가 실패합니다(<code>remote port forwarding failed</code>).' },
        { type: 'h', text: '5. 보안 — 터널 키는 터널만 하게' },
        { type: 'file', path: '~/.ssh/authorized_keys (Oracle 서버)', title: '학교 서버 키 줄 앞에 제한 옵션 붙이기', code: 'restrict,port-forwarding,permitlisten="0.0.0.0:8080" ssh-ed25519 AAAAC3...(학교 서버 공개키)... school-tunnel', desc: '<code>restrict</code> 는 셸 · 에이전트 · X11 등 모든 기능을 끄고, <code>port-forwarding</code> 만 다시 허용, <code>permitlisten</code> 은 8080 입구만 열 수 있게 합니다. 학교 서버가 털려도 Oracle 서버의 셸은 지킬 수 있습니다. 더 엄격하게 하려면 Oracle 서버에 터널 전용 사용자(예: <code>tunnel</code>)를 따로 만듭니다.' },
        { type: 'table', head: ['점검', '명령 (Oracle 서버)'], rows: [['터널 입구', '<code>sudo ss -tlnp | grep sshd</code>'], ['누가 붙어 있나', '<code>who</code> · <code>sudo journalctl -u ssh | tail</code>'], ['열린 문', '<code>seclist show</code> · <code>sudo iptables -L INPUT -n --line-numbers</code>'], ['터널 끄기(학교 서버)', '<code>sudo systemctl disable --now reverse-tunnel</code>']] }
      ],
      practice: [
        {
          title: '심화 3. Oracle 8080 으로 학교 서버 공개',
          level: 3,
          desc: '<p>학교 서버의 키를 Oracle 서버에 등록하고, <code>GatewayPorts clientspecified</code> 와 두 겹 방화벽을 설정해 바깥에서 <code>http://203.0.113.25:8080</code> 으로 <b>학교 실습실 서버</b> 페이지가 보이게 하세요.</p>',
          hint: '키 등록 → 02-tunnel.conf → reload → <code>school "ssh -f -N -R 0.0.0.0:8080:localhost:80 student@203.0.113.25"</code> → seclist · iptables 8080',
          solution: 'school "test -f ~/.ssh/id_ed25519 || ssh-keygen -t ed25519 -N \'\' -C school-tunnel -f ~/.ssh/id_ed25519 -q"\nmkdir -p ~/.ssh && chmod 700 ~/.ssh\nschool cat .ssh/id_ed25519.pub >> ~/.ssh/authorized_keys\nchmod 600 ~/.ssh/authorized_keys\necho "GatewayPorts clientspecified" | sudo tee /etc/ssh/sshd_config.d/02-tunnel.conf\nsudo systemctl reload ssh\nschool "ssh -o StrictHostKeyChecking=accept-new -f -N -R 0.0.0.0:8080:localhost:80 student@203.0.113.25"\nseclist add 8080\nsudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 8080 -j ACCEPT\nsudo netfilter-persistent save\nlabclient curl -s http://203.0.113.25:8080 | head -4',
          check: 'grep -rqiE "^\\s*GatewayPorts\\s+(clientspecified|yes)" /etc/ssh/sshd_config.d/ /etc/ssh/sshd_config && labclient curl -s -m 3 http://203.0.113.25:8080 2>/dev/null | grep -q "학교 실습실 서버"',
          checkOk: '공인 IP 없는 학교 서버가 Oracle 서버를 거쳐 공개되었습니다.',
          checkFail: '순서대로 확인: <code>sudo ss -tlnp | grep 8080</code> 이 0.0.0.0 인가? (127.0.0.1 이면 GatewayPorts · reload · -R 0.0.0.0:) → <code>seclist show</code> · <code>sudo iptables -L INPUT -n</code> 에 8080 이 있나? → Permission denied 면 authorized_keys.'
        },
        {
          title: '심화 4. 재부팅에도 살아나는 터널',
          level: 3,
          desc: '<p>학교 서버에 autossh 를 설치하고 <code>reverse-tunnel</code> systemd 서비스를 만들어 <b>enable · 실행</b>하세요. 손으로 연 ssh 터널은 끄고, 서비스만으로 바깥에서 8080 이 보여야 합니다.</p>',
          hint: '<code>User=student</code> 를 빠뜨리면 root 로 실행되어 키를 못 찾습니다. 손으로 연 터널은 <code>pkill -f \'^ssh .*-R\'</code>.',
          solution: 'school "pkill -f \'^ssh .*-R\'; sudo apt install -y autossh"\nschool "printf \'[Unit]\\nDescription=Reverse SSH tunnel to Oracle\\nAfter=network-online.target\\nWants=network-online.target\\n\\n[Service]\\nUser=student\\nExecStart=/usr/bin/autossh -M 0 -N -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -R 0.0.0.0:8080:localhost:80 student@203.0.113.25\\nRestart=always\\nRestartSec=10\\n\\n[Install]\\nWantedBy=multi-user.target\\n\' | sudo tee /etc/systemd/system/reverse-tunnel.service"\nschool "sudo systemctl daemon-reload; sudo systemctl enable --now reverse-tunnel; systemctl is-active reverse-tunnel"\nlabclient curl -s http://203.0.113.25:8080 | head -4',
          check: 'school "systemctl is-enabled reverse-tunnel" 2>/dev/null | grep -qx enabled && school "systemctl is-active reverse-tunnel" 2>/dev/null | grep -qx active && school "grep -q autossh /etc/systemd/system/reverse-tunnel.service && grep -q \'^User=\' /etc/systemd/system/reverse-tunnel.service" && ! school "pgrep -f \'^ssh .*-R\'" >/dev/null 2>&1 && labclient curl -s -m 3 http://203.0.113.25:8080 2>/dev/null | grep -q "학교 실습실 서버"',
          checkOk: '끊겨도 다시 붙고 재부팅에도 살아나는 상시 터널이 완성되었습니다. 🚇',
          checkFail: '<code>school systemctl status reverse-tunnel</code> 를 보세요. 실패면 User=student · 키 · known_hosts, 8080 충돌(손으로 연 터널이 남았는지)을 확인합니다.'
        }
      ],
      quiz: [
        { q: '<code>ssh -R 8080:localhost:80 student@203.0.113.25</code> 의 의미는?', options: ['내 8080 → Oracle 의 80', 'Oracle 의 8080 으로 온 연결 → 내 쪽(학교 서버) localhost:80', 'Oracle 의 80 → 내 8080', '두 서버의 80 을 합친다'], answer: 1, explain: '-R 은 원격(Remote) 쪽에 입구를 엽니다. -L 은 반대 방향입니다.' },
        { q: '터널을 열었는데 Oracle 에서 <code>127.0.0.1:8080</code> 으로만 열린다. 원인은?', options: ['방화벽', 'sshd 의 GatewayPorts 기본값(no)', 'Nginx', 'DNS'], answer: 1, explain: 'clientspecified 또는 yes 로 바꾸고 -R 0.0.0.0:8080:... 으로 엽니다.' },
        { q: 'autossh 서비스 파일에 <code>User=student</code> 가 필요한 이유는?', options: ['속도', '키 · known_hosts 가 student 홈에 있어서 (없으면 root 로 실행되어 인증 실패)', '포트 번호 때문', 'systemd 문법상 필수'], answer: 1, explain: 'systemd 서비스는 기본적으로 root 로 실행됩니다.' }
      ],
      slides: [
        { layout: 'title', title: '③ 역방향 SSH 터널', subtitle: 'Oracle 무료 서버를 중계소로', notes: '' },
        { layout: 'code', title: '터널 한 줄', code: 'ssh -f -N -R 0.0.0.0:8080:localhost:80 \\\n    student@203.0.113.25', points: ['-R = 원격에 입구', '-N 연결만 · -f 백그라운드', '0.0.0.0 은 GatewayPorts 필요'], notes: '' },
        { layout: 'table', title: '바깥에 보이려면', head: ['곳', '설정'], rows: [['Oracle sshd', 'GatewayPorts clientspecified'], ['보안 목록', 'seclist add 8080'], ['iptables', '-I INPUT 5 ... 8080 + save']], notes: '<p>6일차 두 겹 방화벽 복습입니다.</p>' },
        { layout: 'code', title: '상시 터널', path: '/etc/systemd/system/reverse-tunnel.service', lang: 'ini', code: '[Service]\nUser=student\nExecStart=/usr/bin/autossh -M 0 -N \\\n  -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes \\\n  -R 0.0.0.0:8080:localhost:80 student@203.0.113.25\nRestart=always', points: ['끊기면 autossh 가 재연결', '부팅 시 systemd 가 시작'], notes: '' },
        { layout: 'summary', title: '심화 정리', bullets: ['NAT 뒤 서버도 나가는 연결로 공개', '① Cloudflare: 쉽고 HTTPS', '③ SSH -R: 내 서버로 전부 직접', '승인 · 최소 공개 · 제한된 키'], notes: '' }
      ]
    }
  ]
});
