UBUNTU_COURSE.addChapter({
  id: 'day08',
  no: '08',
  icon: '🔒',
  title: 'Compose · 도메인 · HTTPS',
  subtitle: '3단 서비스, 데이터 유지, 무료 도메인과 자동 인증서',
  summary: '컨테이너 세 개(Caddy 웹 관문 · Flask 앱 · MariaDB)를 <b>compose.yaml</b> 한 파일로 묶어 한 명령으로 올리고 내립니다. 비밀번호는 <code>.env</code> 로 분리하고, 컨테이너를 지웠다 다시 만들어도 DB 데이터가 남는 <b>볼륨</b>을 확인합니다. 마지막으로 DuckDNS 무료 도메인을 연결하고, Caddy 가 Let\'s Encrypt 인증서를 자동으로 받아 <b>https://</b> 로 서비스하게 합니다.',
  goals: [
    'compose.yaml 로 여러 컨테이너를 서비스 이름으로 연결해 실행한다',
    '.env 로 비밀값을 분리하고 권한을 600 으로 둔다',
    '볼륨으로 데이터가 유지되는 것과 앱만 다시 빌드하는 방법을 안다',
    'DuckDNS 도메인을 등록 · 자동 갱신하고 Caddy 로 HTTPS 를 적용한다'
  ],
  sections: [
    // =====================================================================
    {
      id: 'day08-1',
      title: 'Compose 로 3단 서비스 올리기',
      minutes: 140,
      goals: [
        'compose.yaml 의 services · build · image · environment · volumes · depends_on 을 읽을 수 있다',
        '컨테이너끼리 서비스 이름(db, web)으로 찾는 원리를 안다',
        '.env 로 비밀번호를 compose.yaml 밖에 둔다'
      ],
      flow: [['왜 Compose', 15], ['앱 코드', 25], ['.env · Caddyfile', 20], ['compose.yaml', 40], ['올리고 확인', 25], ['정리', 15]],
      content: [
        { type: 'p', html: '어제는 <code>docker run</code> 한 줄이 꽤 길었습니다. 컨테이너가 셋이 되면 옵션 · 순서 · 네트워크를 매번 맞추기 어렵습니다. <b>Docker Compose</b> 는 이 모든 것을 <code>compose.yaml</code> 한 파일에 적어 두고 <code>docker compose up -d</code> 한 줄로 실행합니다.' },
        { type: 'figure', html: '<svg viewBox="0 0 680 150" style="width:100%;height:auto" font-family="var(--sans)"><rect x="10" y="50" width="100" height="50" rx="10" fill="var(--card)" stroke="var(--line)"/><text x="60" y="80" text-anchor="middle" font-size="13" fill="var(--fg)">🌐 인터넷</text><path d="M110 75 H170" stroke="var(--accent)" stroke-width="3"/><text x="140" y="66" text-anchor="middle" font-size="11" fill="var(--muted)">80 · 443</text><rect x="170" y="14" width="500" height="122" rx="14" fill="var(--card2)" stroke="var(--line)" stroke-dasharray="5 4"/><text x="186" y="34" font-size="12" fill="var(--muted)">compose 네트워크 stack_default (서비스 이름 = 주소)</text><rect x="190" y="50" width="130" height="60" rx="10" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="255" y="78" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fg)">caddy</text><text x="255" y="98" text-anchor="middle" font-size="11" fill="var(--muted)">관문 · HTTPS</text><path d="M320 80 H360" stroke="var(--accent)" stroke-width="3"/><rect x="360" y="50" width="130" height="60" rx="10" fill="var(--card)" stroke="var(--line)"/><text x="425" y="78" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fg)">web</text><text x="425" y="98" text-anchor="middle" font-size="11" fill="var(--muted)">Flask :5000</text><path d="M490 80 H530" stroke="var(--accent)" stroke-width="3"/><rect x="530" y="50" width="125" height="60" rx="10" fill="var(--card)" stroke="var(--line)"/><text x="592" y="78" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fg)">db</text><text x="592" y="98" text-anchor="middle" font-size="11" fill="var(--muted)">MariaDB · 볼륨</text></svg>', caption: '바깥에 열린 포트는 caddy 의 80 · 443 뿐. web 과 db 는 안쪽 네트워크에서만 보입니다' },
        { type: 'callout', kind: 'warn', title: '먼저 Nginx 를 쉬게 합니다', html: '<p>80번 포트는 한 프로그램만 쓸 수 있습니다. 오늘부터는 Caddy 컨테이너가 관문이 되므로 서버의 Nginx 를 끄고, 어제 만든 myweb 컨테이너도 정리합니다.</p>' },
        { type: 'cmd', title: '자리 비우기', code: 'sudo systemctl disable --now nginx\ndocker rm -f myweb 2>/dev/null\nsudo ss -tlnp | grep -E ":80 |:443 " || echo "80 · 443 비어 있음"', desc: '' },
        { type: 'file', path: '~/stack/web/app.py', title: '방문 수를 DB 에 세는 앱', code: 'import os\nimport pymysql\nfrom flask import Flask\napp = Flask(__name__)\n\ndef db():\n    return pymysql.connect(host="db", user=os.environ["DB_USER"], password=os.environ["DB_PASSWORD"], database=os.environ["DB_NAME"])\n\n@app.route("/")\ndef home():\n    conn = db()\n    cur = conn.cursor()\n    cur.execute("CREATE TABLE IF NOT EXISTS visits (id INT AUTO_INCREMENT PRIMARY KEY, path VARCHAR(200), at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")\n    cur.execute("INSERT INTO visits (path) VALUES (\'/\')")\n    conn.commit()\n    cur.execute("SELECT COUNT(*) FROM visits")\n    n = cur.fetchone()[0]\n    return f"<h1>Compose 3단 서비스</h1><p>방문 {n}번째</p>"\n\n@app.route("/health")\ndef health():\n    return "ok"', desc: '<code>host="db"</code> — DB 의 IP 를 몰라도 <b>서비스 이름</b>으로 찾습니다. 비밀번호는 코드에 쓰지 않고 환경 변수에서 읽습니다.' },
        { type: 'file', path: '~/stack/web/requirements.txt', title: '', code: 'flask==3.0.3\ngunicorn==22.0.0\npymysql==1.1.1', desc: '' },
        { type: 'file', path: '~/stack/web/Dockerfile', title: '', code: 'FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY app.py .\nCMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]', desc: '어제와 같은 구조입니다.' },
        { type: 'file', path: '~/stack/.env', mode: '600', title: '비밀값 — 깃허브에 올리지 않습니다', code: 'DB_ROOT_PASSWORD=root-Secret-2026\nDB_NAME=cloud70\nDB_USER=app\nDB_PASSWORD=app-Secret-2026', desc: '실제 서버에서는 <code>openssl rand -base64 18</code> 로 만든 값을 쓰세요. 저장 후 <code>chmod 600 .env</code>.' },
        { type: 'file', path: '~/stack/Caddyfile', title: '지금은 IP 로 — 오후에 도메인으로 바꿉니다', code: ':80 {\n    reverse_proxy web:5000\n}', desc: '<code>web:5000</code> 역시 서비스 이름입니다. Nginx 설정보다 훨씬 짧습니다.' },
        { type: 'file', path: '~/stack/compose.yaml', title: '전체 설계도', code: 'services:\n  caddy:\n    image: caddy:2\n    restart: unless-stopped\n    ports:\n      - "80:80"\n      - "443:443"\n    volumes:\n      - ./Caddyfile:/etc/caddy/Caddyfile\n      - caddy_data:/data\n    depends_on:\n      - web\n\n  web:\n    build: ./web\n    restart: unless-stopped\n    environment:\n      DB_USER: ${DB_USER}\n      DB_PASSWORD: ${DB_PASSWORD}\n      DB_NAME: ${DB_NAME}\n    depends_on:\n      - db\n\n  db:\n    image: mariadb:11\n    restart: unless-stopped\n    environment:\n      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}\n      MARIADB_DATABASE: ${DB_NAME}\n      MARIADB_USER: ${DB_USER}\n      MARIADB_PASSWORD: ${DB_PASSWORD}\n    volumes:\n      - db_data:/var/lib/mysql\n\nvolumes:\n  caddy_data:\n  db_data:', desc: 'YAML 은 <b>들여쓰기(스페이스 2칸)</b>가 문법입니다. 탭을 쓰면 안 됩니다. <code>${DB_USER}</code> 는 같은 폴더의 <code>.env</code> 에서 채워집니다.' },
        { type: 'cmd', title: '검사하고 올리기', code: 'cd ~/stack\ndocker compose config --services\ndocker compose up -d\ndocker compose ps\nlabclient curl -s http://203.0.113.25; echo\nlabclient curl -s http://203.0.113.25; echo', desc: '<code>docker compose config</code> 는 .env 가 채워진 최종 설정을 보여 주고 문법 오류를 알려 줍니다. 새로고침할 때마다 방문 수가 늘어납니다.' },
        { type: 'table', head: ['명령', '하는 일'], rows: [['<code>docker compose up -d</code>', '없으면 만들고, 바뀐 것만 다시 만들어 실행'], ['<code>docker compose ps</code>', '이 프로젝트의 컨테이너 상태'], ['<code>docker compose logs -f web</code>', 'web 로그 따라 보기 (Ctrl+C)'], ['<code>docker compose exec db mariadb ...</code>', 'db 컨테이너 안에서 명령'], ['<code>docker compose down</code>', '컨테이너 · 네트워크 삭제 (볼륨은 남김)']] }
      ],
      practice: [
        {
          title: '실습 8-1. 3단 서비스 공개',
          level: 3,
          desc: '<p><code>~/stack</code> 에 web(앱 · requirements · Dockerfile) · <code>.env</code>(권한 600) · <code>Caddyfile</code> · <code>compose.yaml</code> 을 만들어 3단 서비스를 올리세요. 바깥에서 <code>http://203.0.113.25</code> 를 열면 <code>방문</code> 이 보여야 합니다.</p>',
          hint: '본문의 파일들을 그대로 만들고 <code>docker compose up -d</code>. 80 이 열려 있지 않다면 7일차 실습 7-1 을 먼저.',
          solution: 'curl -fsSL https://get.docker.com | sudo sh\nseclist add 80 2>/dev/null; sudo iptables -C INPUT -m state --state NEW -p tcp --dport 80 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT\nsudo systemctl disable --now nginx 2>/dev/null\nmkdir -p ~/stack/web && cd ~/stack\ncat > web/app.py <<\'EOF\'\nimport os\nimport pymysql\nfrom flask import Flask\napp = Flask(__name__)\n\ndef db():\n    return pymysql.connect(host="db", user=os.environ["DB_USER"], password=os.environ["DB_PASSWORD"], database=os.environ["DB_NAME"])\n\n@app.route("/")\ndef home():\n    conn = db()\n    cur = conn.cursor()\n    cur.execute("CREATE TABLE IF NOT EXISTS visits (id INT AUTO_INCREMENT PRIMARY KEY, path VARCHAR(200), at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")\n    cur.execute("INSERT INTO visits (path) VALUES (\'/\')")\n    conn.commit()\n    cur.execute("SELECT COUNT(*) FROM visits")\n    n = cur.fetchone()[0]\n    return f"<h1>Compose 3단 서비스</h1><p>방문 {n}번째</p>"\nEOF\nprintf \'flask==3.0.3\\ngunicorn==22.0.0\\npymysql==1.1.1\\n\' > web/requirements.txt\nprintf \'FROM python:3.12-slim\\nWORKDIR /app\\nCOPY requirements.txt .\\nRUN pip install --no-cache-dir -r requirements.txt\\nCOPY app.py .\\nCMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]\\n\' > web/Dockerfile\nprintf \'DB_ROOT_PASSWORD=root-Secret-2026\\nDB_NAME=cloud70\\nDB_USER=app\\nDB_PASSWORD=app-Secret-2026\\n\' > .env\nchmod 600 .env\nprintf \':80 {\\n    reverse_proxy web:5000\\n}\\n\' > Caddyfile\ncat > compose.yaml <<\'EOF\'\nservices:\n  caddy:\n    image: caddy:2\n    restart: unless-stopped\n    ports:\n      - "80:80"\n      - "443:443"\n    volumes:\n      - ./Caddyfile:/etc/caddy/Caddyfile\n      - caddy_data:/data\n    depends_on:\n      - web\n  web:\n    build: ./web\n    restart: unless-stopped\n    environment:\n      DB_USER: ${DB_USER}\n      DB_PASSWORD: ${DB_PASSWORD}\n      DB_NAME: ${DB_NAME}\n    depends_on:\n      - db\n  db:\n    image: mariadb:11\n    restart: unless-stopped\n    environment:\n      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}\n      MARIADB_DATABASE: ${DB_NAME}\n      MARIADB_USER: ${DB_USER}\n      MARIADB_PASSWORD: ${DB_PASSWORD}\n    volumes:\n      - db_data:/var/lib/mysql\nvolumes:\n  caddy_data:\n  db_data:\nEOF\nsudo docker compose up -d\nlabclient curl -s http://203.0.113.25',
          check: '[ "$(stat -c %a /home/student/stack/.env 2>/dev/null)" = 600 ] && [ "$(docker ps --format "{{.Names}}" | grep -c "^stack-")" -ge 3 ] && labclient curl -s -m 3 http://203.0.113.25 2>/dev/null | grep -q 방문',
          checkOk: '3단 서비스가 인터넷에 공개되었습니다.',
          checkFail: '<code>docker compose ps</code> 로 세 컨테이너가 Up 인지, <code>ls -l ~/stack/.env</code> 권한, <code>labclient curl -s http://203.0.113.25</code> 를 확인하세요. 500 오류면 <code>docker compose logs web</code>.'
        }
      ],
      quiz: [
        { q: 'web 컨테이너가 DB 에 접속할 때 쓰는 주소는?', options: ['127.0.0.1', 'db (서비스 이름)', '203.0.113.25', 'localhost:3306'], answer: 1, explain: 'Compose 네트워크 안에서는 서비스 이름이 주소입니다.' },
        { q: 'compose.yaml 의 <code>${DB_PASSWORD}</code> 값은 어디서 오나?', options: ['Docker Hub', '같은 폴더의 .env', '/etc/passwd', '자동 생성'], answer: 1, explain: '.env 는 비밀값이므로 권한 600, 깃허브 업로드 금지.' },
        { q: '이 구성에서 바깥에 열린 포트는?', options: ['80 · 443 · 5000 · 3306', '80 · 443', '5000 · 3306', '없음'], answer: 1, explain: 'ports 를 적은 서비스는 caddy 뿐입니다.' }
      ],
      slides: [
        { layout: 'title', title: 'Docker Compose', subtitle: 'caddy · web · db 를 한 파일로', notes: '<p>어제의 긴 docker run 명령을 다시 보여 주며 시작합니다.</p>' },
        { layout: 'diagram', title: '3단 구조', html: '<div style="font-size:1.4em;text-align:center;line-height:2.2">🌐 → <b>caddy</b> (80·443) → <b>web</b> :5000 → <b>db</b> 💾</div>', caption: '서비스 이름 = 주소', notes: '' },
        { layout: 'code', title: 'compose.yaml 핵심', path: '~/stack/compose.yaml (요약)', lang: 'yaml', code: 'services:\n  caddy:  { image: caddy:2, ports: ["80:80","443:443"] }\n  web:    { build: ./web, environment: {...} }\n  db:     { image: mariadb:11, volumes: [db_data:/var/lib/mysql] }\nvolumes: { caddy_data: , db_data: }', points: ['비밀은 .env', '들여쓰기 = 문법'], notes: '<p>실제 파일은 펼친 형태로 씁니다.</p>' },
        { layout: 'practice', title: '실습 8-1', bullets: ['Nginx 끄기', '파일 6개 만들기', 'docker compose up -d', '바깥에서 방문 수 확인'], notes: '' },
        { layout: 'summary', title: '정리', bullets: ['한 파일 · 한 명령', '서비스 이름 = 주소', '.env 600'], notes: '' }
      ]
    },
    // =====================================================================
    {
      id: 'day08-2',
      title: '데이터 유지와 앱 업데이트',
      minutes: 100,
      goals: [
        'down / up 뒤에도 볼륨 덕분에 데이터가 남는 것을 확인한다',
        'down -v 의 위험을 안다',
        '앱 코드만 바꿔 web 서비스만 다시 빌드한다',
        'DB 가 멈췄을 때 증상과 로그를 읽는다'
      ],
      flow: [['볼륨 실험', 30], ['앱 업데이트', 30], ['장애 실험', 25], ['정리', 15]],
      content: [
        { type: 'cmd', title: '지웠다 다시 만들어도 남는다', code: 'cd ~/stack\ncurl -s localhost; echo\ndocker compose down\ndocker compose ps\ndocker volume ls\ndocker compose up -d\ncurl -s localhost; echo', desc: '컨테이너는 모두 지워졌지만 <code>stack_db_data</code> 볼륨은 남아 있어서 방문 수가 이어집니다. 컨테이너는 언제든 버리고 다시 만드는 것, 데이터는 볼륨에 두는 것 — 이것이 컨테이너 운영의 기본입니다.' },
        { type: 'callout', kind: 'warn', title: 'docker compose down -v', html: '<p><code>-v</code> 를 붙이면 <b>볼륨까지</b> 지웁니다. DB 데이터가 사라집니다. 9일차에 백업을 만든 뒤 일부러 한 번 해 봅니다.</p>' },
        { type: 'cmd', title: 'DB 안 들여다보기', code: 'cd ~/stack\ndocker compose exec db mariadb -uapp -papp-Secret-2026 cloud70 -e "SELECT COUNT(*) FROM visits; SELECT * FROM visits ORDER BY id DESC LIMIT 3"', desc: '' },
        { type: 'h', text: '앱만 바꿔서 다시 올리기' },
        { type: 'cmd', title: 'web 만 다시 빌드', code: 'cd ~/stack\nsed -i \'s/Compose 3단 서비스/Compose 3단 서비스 v2/\' web/app.py\ndocker compose up -d --build\ndocker compose ps\ncurl -s localhost; echo', desc: '<code>--build</code> 가 web 이미지를 다시 굽고 web 컨테이너만 바꿔 끼웁니다. caddy 와 db 는 그대로이고 방문 수도 그대로 이어집니다.' },
        { type: 'h', text: '장애 실험 — DB 가 멈추면' },
        { type: 'cmd', title: '증상 → 로그 → 복구', code: 'cd ~/stack\ndocker compose stop db\ncurl -s localhost | head -3\ndocker compose logs web | tail -2\ndocker compose start db\ncurl -s localhost; echo', desc: '사용자는 <b>500 Internal Server Error</b> 만 봅니다. 원인은 로그의 <code>Can\'t connect to MySQL server on \'db\'</code> 에 있습니다. 장애가 나면 "증상 → 로그 → 원인 → 조치" 순서로 봅니다.' }
      ],
      practice: [
        {
          title: '실습 8-2. 데이터는 남기고 앱은 v2 로',
          level: 2,
          desc: '<p>방문 수를 몇 번 올린 뒤 <code>docker compose down</code> → <code>up -d</code> 로 데이터가 남는지 확인하고, 앱 제목에 <code>v2</code> 를 넣어 다시 빌드하세요. 최종 페이지에 <code>v2</code> 가 보이고 방문 수가 <b>4 이상</b>이어야 합니다.</p>',
          hint: '<code>sed -i \'s/서비스</서비스 v2</\' web/app.py</code> 후 <code>docker compose up -d --build</code>',
          solution: 'cd ~/stack\ncurl -s localhost >/dev/null; curl -s localhost >/dev/null\nsudo docker compose down\nsudo docker compose up -d\ncurl -s localhost; echo\nsed -i \'s/Compose 3단 서비스</Compose 3단 서비스 v2</\' web/app.py\nsudo docker compose up -d --build\ncurl -s localhost; echo',
          check: 'p=$(curl -s -m 3 http://localhost 2>/dev/null); echo "$p" | grep -q v2 && n=$(echo "$p" | sed -n "s/.*방문 \\([0-9]*\\)번째.*/\\1/p") && [ -n "$n" ] && [ "$n" -ge 4 ]',
          checkOk: '볼륨 덕분에 데이터가 이어졌고 앱은 v2 가 되었습니다.',
          checkFail: '<code>curl -s localhost</code> 에 v2 와 방문 수가 보이는지 확인하세요. 방문 수가 1부터 다시 시작했다면 <code>down -v</code> 로 볼륨을 지운 것입니다.'
        }
      ],
      quiz: [
        { q: '<code>docker compose down</code> 뒤 <code>up -d</code> 를 했더니 방문 수가 이어졌다. 이유는?', options: ['컨테이너가 안 지워져서', 'db_data 볼륨이 남아 있어서', '브라우저 캐시', 'Caddy 가 기억해서'], answer: 1, explain: 'down 은 볼륨을 지우지 않습니다. -v 를 붙이면 지웁니다.' },
        { q: '앱 코드만 바꿨을 때 알맞은 명령은?', options: ['docker compose down -v', 'docker compose up -d --build', 'docker system prune -a', 'sudo reboot'], answer: 1, explain: '바뀐 web 만 다시 빌드 · 교체합니다.' },
        { q: '사용자는 500 오류만 본다. 원인을 가장 먼저 찾을 곳은?', options: ['docker compose logs web', 'seclist show', '/etc/hosts', 'free -h'], answer: 0, explain: '앱 로그에 DB 접속 실패 같은 원인이 남습니다.' }
      ],
      slides: [
        { layout: 'title', title: '데이터와 업데이트', subtitle: '컨테이너는 버리고, 데이터는 볼륨에', notes: '' },
        { layout: 'two', title: 'down vs down -v', left: { title: 'down', bullets: ['컨테이너 · 네트워크 삭제', '볼륨 유지 → 데이터 남음'] }, right: { title: 'down -v', bullets: ['볼륨까지 삭제', 'DB 데이터 사라짐 ⚠'] }, notes: '' },
        { layout: 'code', title: '업데이트 · 장애', code: 'docker compose up -d --build   # 앱만 교체\ndocker compose stop db          # 장애 흉내\ndocker compose logs web | tail  # 원인 찾기\ndocker compose start db', points: ['증상 → 로그 → 원인 → 조치'], notes: '' },
        { layout: 'summary', title: '정리', bullets: ['볼륨 = 데이터의 집', '--build 로 앱만 교체', '로그부터 본다'], notes: '<p>오후: 도메인과 HTTPS.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day08-3',
      title: '무료 도메인과 자동 HTTPS',
      minutes: 180,
      goals: [
        'DuckDNS 로 무료 하위 도메인을 만들고 내 서버 IP 를 연결한다',
        'cron 으로 IP 를 자동 갱신한다',
        'Caddyfile 에 도메인을 적어 Let\'s Encrypt 인증서를 자동으로 받는다',
        'HTTP 가 HTTPS 로 자동 이동하는 것을 확인한다'
      ],
      flow: [['도메인과 DNS', 20], ['DuckDNS 등록', 30], ['자동 갱신', 30], ['HTTPS 적용', 50], ['확인', 30], ['정리', 20]],
      content: [
        { type: 'p', html: '<code>http://203.0.113.25</code> 는 외우기 어렵고, 주소창에 <b>"주의 요함"</b> 이 뜹니다. 이름(도메인)을 붙이고 인증서로 암호화(HTTPS)하면 진짜 서비스처럼 됩니다. 둘 다 무료로 할 수 있습니다.' },
        { type: 'table', head: ['단계', '도구', '하는 일'], rows: [['1', 'DuckDNS', '<code>내이름.duckdns.org</code> → 내 서버 공인 IP (A 레코드)'], ['2', 'cron + curl', '5분마다 DuckDNS 에 내 IP 알려 주기'], ['3', 'Caddy', '도메인을 보고 Let\'s Encrypt 인증서 자동 발급 · 갱신'], ['4', '방화벽', '443 열기 (7일차에 완료)']] },
        { type: 'callout', kind: 'vm', title: '실제로 — DuckDNS 가입', html: '<ol><li><a href="https://www.duckdns.org" target="_blank" rel="noopener">duckdns.org</a> 에서 GitHub 또는 Google 계정으로 로그인</li><li>sub domain 에 원하는 이름(예: <code>hong70</code>) 입력 → <b>add domain</b></li><li>current ip 칸에 내 Oracle 서버 공인 IP 입력 → <b>update ip</b></li><li>화면 위의 <b>token</b>(UUID 모양)을 복사 — <b>비밀번호처럼</b> 다룹니다</li></ol><p>가상 서버에서는 아무 UUID 모양 토큰(예: <code>a1b2c3d4-1111-2222-3333-444455556666</code>)이나 받아 줍니다.</p>' },
        { type: 'cmd', title: '등록 전에는 이름이 풀리지 않습니다', code: 'dig +short hong70.duckdns.org\ncurl -s -m 3 http://hong70.duckdns.org; echo "종료 코드 $?"', desc: '6 = 이름을 찾을 수 없음. 아래에서 <code>hong70</code> 을 <b>자기 하위 도메인</b>으로 바꿔 쓰세요.' },
        { type: 'file', path: '~/duckdns/duck.sh', mode: '700', title: 'IP 갱신 스크립트', code: '#!/bin/sh\ncurl -s -o ~/duckdns/duck.log "https://www.duckdns.org/update?domains=hong70&token=a1b2c3d4-1111-2222-3333-444455556666&ip="', desc: '<code>ip=</code> 를 비워 두면 DuckDNS 가 요청한 서버의 IP 를 씁니다. 토큰이 들어 있으므로 권한은 700.' },
        { type: 'cmd', title: '실행하고 자동화', code: 'mkdir -p ~/duckdns\nnano ~/duckdns/duck.sh\nchmod 700 ~/duckdns/duck.sh\n~/duckdns/duck.sh; cat ~/duckdns/duck.log; echo\ndig +short hong70.duckdns.org\n(crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -\ncrontab -l', desc: '<code>OK</code> 면 성공, <code>KO</code> 면 도메인 이름이나 토큰이 틀렸습니다. Oracle 의 임시 공인 IP 는 인스턴스를 중지 · 시작하면 바뀔 수 있어서 자동 갱신이 필요합니다.' },
        { type: 'h', text: 'Caddy 에 도메인 적기 = HTTPS 끝' },
        { type: 'file', path: '~/stack/Caddyfile', title: ':80 대신 도메인', code: 'hong70.duckdns.org {\n    reverse_proxy web:5000\n}', desc: '사이트 주소에 <b>도메인</b>을 적으면 Caddy 가 알아서 ① Let\'s Encrypt 에 인증서 요청 ② 443 에서 HTTPS 제공 ③ 80 으로 온 요청은 HTTPS 로 이동 ④ 만료 전 자동 갱신까지 합니다. 인증서는 <code>caddy_data</code> 볼륨에 저장됩니다.' },
        { type: 'cmd', title: '적용과 확인', code: 'cd ~/stack\ndocker compose restart caddy\ndocker compose logs caddy | tail -3\nlabclient curl -sI http://hong70.duckdns.org | head -3\nlabclient curl -s https://hong70.duckdns.org; echo', desc: '<code>308 Permanent Redirect</code> → HTTPS 로 이동, 그리고 HTTPS 응답. 실제 서버에서는 브라우저 주소창의 자물쇠를 눌러 발급자 <b>Let\'s Encrypt</b> 를 확인하세요.' },
        { type: 'callout', kind: 'tip', title: '인증서가 안 받아질 때', html: '<ul><li><code>dig +short 도메인</code> 이 내 서버 IP 인가?</li><li>80 · 443 이 <b>두 겹 모두</b> 열려 있나? (Let\'s Encrypt 는 80 으로 확인 요청을 보냅니다)</li><li>Caddyfile 의 도메인 철자</li><li>여러 번 실패하면 Let\'s Encrypt 가 잠시 막습니다(rate limit). 1시간 쉬었다 다시.</li></ul>' }
      ],
      practice: [
        {
          title: '실습 8-3. https://내도메인',
          level: 3,
          desc: '<p>DuckDNS 하위 도메인을 정해 <code>~/duckdns/duck.sh</code>(권한 700)로 등록하고 cron 에 5분마다 실행되게 넣으세요. Caddyfile 을 그 도메인으로 바꾸고 443 을 연 뒤, 바깥에서 <code>https://도메인</code> 으로 방문 수 페이지가 보여야 합니다.</p>',
          hint: 'duck.sh → chmod 700 → 실행(OK) → crontab → Caddyfile 도메인 → <code>docker compose restart caddy</code> → 443 두 겹 열기',
          solution: 'mkdir -p ~/duckdns\nprintf \'#!/bin/sh\\ncurl -s -o ~/duckdns/duck.log "https://www.duckdns.org/update?domains=hong70&token=a1b2c3d4-1111-2222-3333-444455556666&ip="\\n\' > ~/duckdns/duck.sh\nchmod 700 ~/duckdns/duck.sh\n~/duckdns/duck.sh; cat ~/duckdns/duck.log; echo\n(crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -\nseclist add 443 2>/dev/null; sudo iptables -C INPUT -m state --state NEW -p tcp --dport 443 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 443 -j ACCEPT\ncd ~/stack\nprintf \'hong70.duckdns.org {\\n    reverse_proxy web:5000\\n}\\n\' > Caddyfile\nsudo docker compose restart caddy\nlabclient curl -s https://hong70.duckdns.org',
          check: 'd=$(grep -o "[a-z0-9-]*\\.duckdns\\.org" /home/student/stack/Caddyfile | head -1); [ -n "$d" ] && [ "$(stat -c %a /home/student/duckdns/duck.sh)" = 700 ] && crontab -u student -l 2>/dev/null | grep -q duck.sh && labclient curl -s -m 3 "https://$d" 2>/dev/null | grep -q 방문',
          checkOk: '내 도메인으로 HTTPS 서비스가 열렸습니다. 🔒',
          checkFail: '<code>dig +short 도메인</code>, <code>ls -l ~/duckdns/duck.sh</code>, <code>crontab -l</code>, Caddyfile 의 도메인, 443 두 겹 열림을 차례로 확인하세요. (실습 8-1 의 서비스가 먼저 떠 있어야 합니다)'
        }
      ],
      quiz: [
        { q: 'Caddyfile 사이트 주소를 <code>:80</code> 에서 도메인으로 바꾸면 생기는 일이 <b>아닌</b> 것은?', options: ['인증서 자동 발급', 'HTTP → HTTPS 자동 이동', '인증서 자동 갱신', 'DuckDNS IP 자동 갱신'], answer: 3, explain: 'DNS 갱신은 cron 의 duck.sh 가 합니다.' },
        { q: 'duck.sh 의 권한을 700 으로 두는 이유는?', options: ['실행 속도', '토큰이 들어 있어 다른 사용자가 읽으면 안 되므로', 'cron 규칙', 'Caddy 요구 사항'], answer: 1, explain: '토큰이 있으면 누구나 내 도메인을 다른 IP 로 바꿀 수 있습니다.' },
        { q: 'Let\'s Encrypt 인증서 발급이 실패할 때 확인할 것으로 거리가 <b>먼</b> 것은?', options: ['도메인이 내 IP 로 풀리는지', '80 · 443 이 두 겹 모두 열렸는지', 'Caddyfile 철자', 'MariaDB 비밀번호'], answer: 3, explain: 'DB 는 인증서와 관계없습니다.' }
      ],
      slides: [
        { layout: 'title', title: '도메인 + HTTPS', subtitle: 'DuckDNS · cron · Caddy', notes: '<p>주소창의 "주의 요함" 을 보여 주며 시작합니다.</p>' },
        { layout: 'table', title: '네 단계', head: ['단계', '도구'], rows: [['이름 만들기', 'DuckDNS'], ['IP 자동 갱신', 'cron + duck.sh'], ['인증서', 'Caddy (Let\'s Encrypt)'], ['문 열기', '443 두 겹']], notes: '' },
        { layout: 'code', title: '바뀌는 건 한 줄', path: '~/stack/Caddyfile', lang: 'text', code: '# 전\n:80 {\n    reverse_proxy web:5000\n}\n# 후\nhong70.duckdns.org {\n    reverse_proxy web:5000\n}', points: ['발급 · 리다이렉트 · 갱신 자동'], notes: '<p>Nginx + certbot 과 비교해 설명할 수 있습니다.</p>' },
        { layout: 'practice', title: '실습 8-3', bullets: ['duck.sh (700) + cron', 'Caddyfile 도메인', '443 열기', '휴대폰으로 https:// 확인'], notes: '<p>휴대폰 자물쇠 화면을 산출물로 받습니다.</p>' },
        { layout: 'summary', title: '8일차 정리', bullets: ['Compose 3단 서비스', '볼륨 · --build · 로그', '무료 도메인 + 자동 HTTPS'], notes: '<p>내일: 이 데이터를 지키는 백업, 그리고 서버 없는 서비스.</p>' }
      ]
    }
  ]
});
