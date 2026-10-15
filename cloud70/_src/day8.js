module.exports = {
  day: 8,
  goals: [
    'Docker Compose로 웹앱·DB·프록시 세 컨테이너를 한 번에 운영한다',
    '비밀번호를 .env로 분리하고 볼륨으로 데이터를 보존한다',
    'DuckDNS 무료 도메인을 내 서버에 연결하고 DNS로 확인한다',
    'Caddy로 Let\'s Encrypt 인증서를 자동 발급받아 https로 서비스한다'
  ],
  lab: {
    h1: 'Compose · 도메인 · HTTPS',
    standfirst: '오늘 저녁이면 내 서비스에 <code>https://내이름.duckdns.org</code> 주소가 생깁니다. 어제 만든 Flask 앱에 방문자 수를 저장하는 MariaDB를 붙이고, 앞에는 인증서를 알아서 받아 오는 Caddy를 세웁니다. 세 컨테이너를 파일 하나로 묶는 것이 Docker Compose입니다.',
    schedule: ['09:00–11:00 이론', '11:00–12:00 PART 1', '13:00–15:00 PART 2', '15:00–17:00 PART 3 · 산출물'],
    rules: [
      ['비밀번호는 .env에만', '비밀번호를 compose.yaml이나 app.py에 직접 쓰지 않습니다. 10일차에 GitHub에 올릴 때 .env만 빼면 되도록.'],
      ['down -v 금지', '<code>docker compose down -v</code>는 DB 데이터까지 지웁니다. 오늘은 절대 쓰지 않습니다.'],
      ['인증서는 천천히', 'Let\'s Encrypt는 실패를 반복하면 한동안 발급을 막습니다. 도메인 확인이 끝난 뒤에 한 번에 시도합니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '세 컨테이너 구성하기', time: '11:00–12:00',
        lede: '<code>ssh cloud70</code>으로 접속합니다. 어제의 Nginx와 단독 컨테이너를 내리고 시작합니다.',
        missions: [
          { n: 1, h: '어제 것 정리', body: `
      <pre><span class="p">$</span> sudo systemctl disable --now nginx     <span class="c"># 80·443은 오늘부터 Caddy가 씀</span>
<span class="p">$</span> docker rm -f myapp
<span class="p">$</span> sudo ss -tlnp | grep -E ':80|:443'     <span class="c"># 아무것도 안 나와야 함</span></pre>` },

          { n: 2, h: 'DB를 쓰는 앱으로 바꾸기', body: `
      <pre><span class="p">$</span> cd ~/myapp/app
<span class="p">$</span> nano app.py</pre>
      <span class="prelbl">app/app.py</span>
      <pre>import os
import pymysql
from flask import Flask

app = Flask(__name__)

def db():
    return pymysql.connect(host="db", user="app",
                           password=os.environ["DB_PASSWORD"],
                           database="cloud", autocommit=True)

@app.get("/")
def index():
    with db() as conn, conn.cursor() as cur:
        cur.execute("CREATE TABLE IF NOT EXISTS visits ("
                    "id INT AUTO_INCREMENT PRIMARY KEY, "
                    "at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
        cur.execute("INSERT INTO visits () VALUES ()")
        cur.execute("SELECT COUNT(*) FROM visits")
        n = cur.fetchone()[0]
    return f"&lt;h1&gt;☁️ 내 클라우드 서비스&lt;/h1&gt;&lt;p&gt;{n}번째 방문입니다.&lt;/p&gt;"</pre>
      <span class="prelbl">app/requirements.txt</span>
      <pre>flask
gunicorn
pymysql
cryptography</pre>
      <div class="box check"><span class="lbl">host="db"</span>
        <p>IP 주소가 아니라 <strong>서비스 이름</strong>으로 DB를 찾습니다. Compose가 만든 내부 네트워크 안에서는 이름이 곧 주소입니다.</p></div>` },

          { n: 3, h: 'compose.yaml · .env · Caddyfile', body: `
      <pre><span class="p">$</span> cd ~/myapp
<span class="p">$</span> cat &gt; .env &lt;&lt;EOF
DB_PASSWORD=$(openssl rand -hex 16)
DB_ROOT_PASSWORD=$(openssl rand -hex 16)
EOF
<span class="p">$</span> chmod 600 .env
<span class="p">$</span> printf ':80 {\\n    reverse_proxy web:5000\\n}\\n' &gt; Caddyfile
<span class="p">$</span> nano compose.yaml</pre>
      <span class="prelbl">compose.yaml</span>
      <pre>services:
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - web

  web:
    build: ./app
    restart: unless-stopped
    environment:
      DB_PASSWORD: \${DB_PASSWORD}
    depends_on:
      db:
        condition: service_healthy

  db:
    image: mariadb:11
    restart: unless-stopped
    environment:
      MARIADB_ROOT_PASSWORD: \${DB_ROOT_PASSWORD}
      MARIADB_DATABASE: cloud
      MARIADB_USER: app
      MARIADB_PASSWORD: \${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      retries: 20

volumes:
  caddy_data:
  db_data:</pre>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>db 서비스에는 <code>ports:</code>가 없습니다. 그래도 web은 DB에 접속할 수 있을까요? 인터넷에서는요? 왜 이렇게 했을까요?</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '실행하고 다뤄 보기', time: '13:00–14:30',
        lede: '<code>~/myapp</code>에서 진행합니다.',
        missions: [
          { n: 4, h: '한 번에 올리기', body: `
      <pre><span class="p">$</span> docker compose up -d --build
<span class="p">$</span> docker compose ps                  <span class="c"># db가 healthy, 세 개 모두 Up</span>
<span class="p">$</span> curl -s localhost
<span class="p">$</span> docker compose logs -f web         <span class="c"># Ctrl+C로 빠져나옴</span></pre>
      <p>브라우저에서 <code>http://공인IP</code>를 열고 새로고침할 때마다 방문 수가 오르는지 확인합니다.</p>` },

          { n: 5, h: '데이터는 어디에 남나', body: `
      <pre><span class="p">$</span> docker compose down               <span class="c"># 컨테이너 삭제 (볼륨은 남음)</span>
<span class="p">$</span> docker compose up -d
<span class="p">$</span> curl -s localhost                 <span class="c"># 방문 수가 이어지나?</span>
<span class="p">$</span> docker volume ls
<span class="p">$</span> docker compose exec db sh -c 'mariadb -uapp -p"$MARIADB_PASSWORD" cloud -e "SELECT COUNT(*), MAX(at) FROM visits"'</pre>
      <div class="box check"><span class="lbl">컨테이너는 버리고 데이터는 지킨다</span>
        <p>컨테이너를 지워도 <code>db_data</code> 볼륨에 데이터가 남습니다. 이미지를 고쳐 다시 올려도 방문 기록은 그대로입니다.</p></div>` },

          { n: 6, h: '앱을 고쳐 다시 배포', body: `
      <p><code>app/app.py</code>의 문구를 바꾸고(예: 내 이름 추가) 웹 컨테이너만 다시 빌드합니다.</p>
      <pre><span class="p">$</span> docker compose up -d --build web
<span class="p">$</span> docker compose ps</pre>
      <p>방문 수는 유지되고 문구만 바뀌는지 확인합니다.</p>` }
        ]
      },
      {
        pn: 'PART 3', h: '도메인과 HTTPS', time: '14:30–16:30',
        lede: 'DuckDNS는 <code>이름.duckdns.org</code> 형태의 무료 도메인을 줍니다.',
        missions: [
          { n: 7, h: 'DuckDNS 도메인 만들기', body: `
      <ol>
        <li><code>www.duckdns.org</code>에 GitHub 또는 Google 계정으로 로그인합니다.</li>
        <li>sub domain에 원하는 이름(영문 소문자·숫자)을 넣고 <strong>add domain</strong>.</li>
        <li><strong>current ip</strong> 칸에는 내 PC IP가 자동으로 들어가 있습니다. <strong>서버의 공인 IP로 바꿔</strong> 입력하고 <strong>update ip</strong>.</li>
      </ol>
      <pre><span class="p">$</span> nslookup 이름.duckdns.org          <span class="c"># 서버 공인 IP가 나와야 함</span></pre>
      <div class="box warn"><span class="lbl">토큰은 비밀번호</span>
        <p>DuckDNS 화면 위쪽의 token은 도메인을 마음대로 바꿀 수 있는 열쇠입니다. 캡처할 때 가리세요.</p></div>` },

          { n: 8, h: 'Caddy에 도메인 넣기', body: `
      <pre><span class="p">$</span> cd ~/myapp
<span class="p">$</span> printf '이름.duckdns.org {\\n    reverse_proxy web:5000\\n}\\n' &gt; Caddyfile
<span class="p">$</span> cat Caddyfile
<span class="p">$</span> docker compose restart caddy
<span class="p">$</span> docker compose logs caddy | grep -iE "certificate obtained|error"</pre>
      <p><code>certificate obtained successfully</code>가 보이면 <code>https://이름.duckdns.org</code>로 접속합니다. <code>http://</code>로 접속해도 자동으로 https로 넘어갑니다.</p>
      <pre><span class="p">$</span> curl -svI https://이름.duckdns.org 2&gt;&amp;1 | grep -E "subject:|issuer:|expire date"</pre>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>인증서 발급 기관(issuer)은 어디인가요? 만료일은 언제인가요? 만료되기 전에 누가 갱신할까요?</p></div>` },

          { n: 9, h: 'IP가 바뀌어도 도메인이 따라오게', body: `
      <p>서버를 중지했다 켜면 공인 IP가 바뀔 수 있습니다. 서버가 5분마다 DuckDNS에 자기 IP를 알리게 합니다.</p>
      <pre><span class="p">$</span> crontab -e                          <span class="c"># 편집기는 nano(1번) 선택</span></pre>
      <pre>*/5 * * * * curl -s "https://www.duckdns.org/update?domains=이름&amp;token=내토큰&amp;ip=" &gt; ~/duckdns.log</pre>
      <pre><span class="p">$</span> sleep 300; cat ~/duckdns.log        <span class="c"># OK</span></pre>
      <div class="box check"><span class="lbl">ip= 를 비워 두는 이유</span>
        <p>비워 두면 요청을 보낸 쪽, 즉 서버 자신의 공인 IP로 등록됩니다.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>web</code>이 계속 재시작 · <code>Can\'t connect to MySQL</code>', 'DB 준비 전에 연결 시도 또는 비밀번호 불일치', '<code>docker compose ps</code>로 db healthy 확인, <code>.env</code> 변수 이름 확인'],
      ['<code>bind: address already in use</code> (80)', '호스트 Nginx가 아직 켜져 있음', '<code>sudo systemctl disable --now nginx</code>'],
      ['Caddy 로그 <code>challenge failed</code> / <code>timeout</code>', '도메인 IP가 틀리거나 80·443이 막힘', '<code>nslookup</code> 결과가 서버 IP인지, 7일차 방화벽 두 곳 확인'],
      ['<code>too many failed authorizations</code>', '발급 실패를 짧은 시간에 반복', '원인을 고친 뒤 1시간 기다렸다가 재시도'],
      ['비밀번호를 바꿨는데 DB 접속 실패', 'MariaDB는 처음 만들 때만 환경변수로 계정을 만듦', '볼륨이 이미 있으면 원래 비밀번호 유지. 실습 중이면 교수와 함께 볼륨 초기화']
    ],
    checklist: [
      '<code>docker compose ps</code>에서 caddy · web · db가 모두 Up이고 db가 healthy다',
      '새로고침할 때마다 방문 수가 오른다',
      '<code>down</code> 후 <code>up</code>해도 방문 수가 유지된다',
      '비밀번호가 <code>.env</code>에만 있고 권한이 600이다',
      '<code>nslookup 이름.duckdns.org</code>가 서버 IP를 가리킨다',
      '<code>https://이름.duckdns.org</code>에 자물쇠가 보인다',
      'DuckDNS 자동 갱신 cron이 <code>OK</code>를 남긴다'
    ]
  },
  assignment: {
    title: 'https로 열리는 내 서비스',
    lede: '도메인과 인증서를 갖춘 3-컨테이너 서비스가 완성됐는지 확인합니다.',
    items: [
      '<code>https://이름.duckdns.org</code> 화면 (자물쇠와 방문 수 포함)',
      '<code>compose.yaml</code>과 <code>Caddyfile</code> 내용 (<code>.env</code>는 제출하지 말 것)',
      '<code>docker compose ps</code> 출력',
      '미션 5에서 방문 수가 유지된 것을 보여 주는 출력',
      '인증서 subject · issuer · 만료일 출력과 확인 질문 답'
    ],
    note: '<code>.env</code> 내용이나 DuckDNS 토큰이 제출물에 보이면 보안 점수는 0점입니다.'
  }
};
