module.exports = {
  day: 7,
  goals: [
    '보안 목록과 iptables 두 겹의 방화벽을 열어 웹을 공개한다',
    'Nginx로 자기소개 페이지를 배포하고 로그를 읽는다',
    'Docker를 설치하고 이미지·컨테이너·포트 연결을 다룬다',
    'Dockerfile로 Flask 앱 이미지를 만들고 Nginx 뒤에 연결한다'
  ],
  lab: {
    h1: '웹 서버와 Docker',
    standfirst: '어제 만든 서버를 인터넷에 공개합니다. 오전에는 Nginx로 내 자기소개 페이지를 올리고, 오후에는 Docker로 앱을 컨테이너에 담습니다. 오늘 만든 Flask 앱은 내일 데이터베이스와 HTTPS를 붙여 완성할 서비스의 뼈대입니다.',
    schedule: ['09:00–11:00 이론', '11:00–12:00 PART 1', '13:00–15:00 PART 2', '15:00–17:00 PART 3 · 산출물'],
    rules: [
      ['방화벽은 두 곳', '보안 목록(클라우드)과 iptables(서버). 둘 다 열어야 열립니다.'],
      ['iptables 저장은 Docker 전에', '미션 1의 저장을 Docker 설치 전에 끝내세요. 순서가 바뀌면 재부팅 후 꼬일 수 있습니다.'],
      ['컨테이너는 지워도 된다', '컨테이너는 언제든 다시 만들 수 있게 만드는 것이 목표입니다. 명령을 기록하세요.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '웹을 인터넷에 열기', time: '11:00–12:00',
        lede: '<code>ssh cloud70</code>으로 접속합니다.',
        missions: [
          { n: 1, h: '두 겹의 방화벽 열기', body: `
      <p><strong>① 클라우드 — 보안 목록.</strong> 콘솔 → VCN <code>vcn-cloud70</code> → Security Lists → Default Security List → <strong>Add Ingress Rules</strong>.</p>
      <div class="tablewrap"><table>
        <thead><tr><th>Source CIDR</th><th>IP Protocol</th><th>Destination Port Range</th></tr></thead>
        <tbody><tr><td><code>0.0.0.0/0</code></td><td>TCP</td><td><code>80</code></td></tr><tr><td><code>0.0.0.0/0</code></td><td>TCP</td><td><code>443</code></td></tr></tbody></table></div>
      <p style="margin-top:10px"><strong>② 서버 — iptables.</strong> REJECT 줄보다 위에 끼워 넣고 저장합니다.</p>
      <pre><span class="p">$</span> sudo iptables -L INPUT -n --line-numbers         <span class="c"># REJECT가 몇 번째인지 확인 (보통 6)</span>
<span class="p">$</span> sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
<span class="p">$</span> sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
<span class="p">$</span> sudo netfilter-persistent save
<span class="p">$</span> sudo iptables -L INPUT -n --line-numbers         <span class="c"># 80·443이 REJECT보다 위에 있는지</span></pre>` },

          { n: 2, h: 'Nginx 설치와 접속 확인', body: `
      <pre><span class="p">$</span> sudo apt install -y nginx
<span class="p">$</span> curl -sI localhost | head -1        <span class="c"># HTTP/1.1 200 OK</span></pre>
      <p>브라우저에서 <code>http://공인IP</code>로 접속해 "Welcome to nginx!"를 확인합니다.</p>
      <div class="box q"><span class="lbl">실험</span>
        <p>보안 목록의 80번 규칙만 잠깐 지우면 브라우저는 어떻게 되나요? <code>curl localhost</code>는요? 둘이 다른 이유를 설명하고 규칙을 되돌립니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '자기소개 페이지 배포', time: '13:00–14:00',
        lede: '1일차에 nano로 쓴 자기소개를 웹페이지로 만듭니다.',
        missions: [
          { n: 3, h: '페이지 만들고 서버로 보내기', body: `
      <p><strong>내 PC(WSL)</strong>에서 파일을 만들고 <code>scp</code>로 보냅니다.</p>
      <pre><span class="p">$</span> mkdir -p ~/cloud70/site &amp;&amp; cd ~/cloud70/site
<span class="p">$</span> nano index.html</pre>
      <pre>&lt;!doctype html&gt;
&lt;html lang="ko"&gt;&lt;meta charset="utf-8"&gt;
&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;
&lt;title&gt;홍길동의 클라우드&lt;/title&gt;
&lt;body style="font-family:sans-serif;max-width:640px;margin:40px auto;padding:0 16px"&gt;
  &lt;h1&gt;☁️ 홍길동&lt;/h1&gt;
  &lt;p&gt;AI응용소프트웨어과 · 클라우드 기초 70시간 과정&lt;/p&gt;
  &lt;p&gt;이 페이지는 Oracle Cloud 무료 ARM 서버에서 Nginx로 서비스됩니다.&lt;/p&gt;
&lt;/body&gt;&lt;/html&gt;</pre>
      <pre><span class="p">$</span> scp index.html cloud70:~
<span class="p">$</span> ssh cloud70 'sudo cp ~/index.html /var/www/html/index.html'</pre>
      <p>브라우저를 새로고침합니다. 내용을 고쳐 다시 보내 보고, 몇 초 만에 반영되는 것을 확인합니다.</p>` },

          { n: 4, h: '접속 기록 읽기', body: `
      <pre><span class="p">$</span> sudo tail -f /var/log/nginx/access.log</pre>
      <p>옆 사람에게 내 주소로 접속해 달라고 하고, 로그에 그 사람의 IP와 브라우저 정보가 찍히는 것을 봅니다. <kbd>Ctrl</kbd>+<kbd>C</kbd>로 멈춥니다.</p>
      <div class="box q"><span class="lbl">관찰</span>
        <p>내가 모르는 IP가 <code>/wp-login.php</code>, <code>/.env</code> 같은 주소를 요청한 줄이 있나요? 서버를 연 지 몇 시간 만에 자동 스캐너가 찾아옵니다. 10일차 보안 점검의 이유입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: 'Docker로 앱 담기', time: '14:00–16:30',
        lede: '서버에서 진행합니다.',
        missions: [
          { n: 5, h: 'Docker 설치', body: `
      <pre><span class="p">$</span> curl -fsSL https://get.docker.com | sudo sh
<span class="p">$</span> sudo usermod -aG docker $USER
<span class="p">$</span> exit                                 <span class="c"># 그룹 적용을 위해 다시 접속</span>
<span class="p">$</span> ssh cloud70
<span class="p">$</span> docker run --rm hello-world
<span class="p">$</span> docker version --format '{{.Server.Arch}}'     <span class="c"># arm64</span></pre>` },

          { n: 6, h: '컨테이너 다루기 기본', body: `
      <pre><span class="p">$</span> docker run -d --name web2 -p 8080:80 nginx:alpine
<span class="p">$</span> docker ps
<span class="p">$</span> curl -s localhost:8080 | head -4
<span class="p">$</span> docker logs web2
<span class="p">$</span> docker exec -it web2 sh             <span class="c"># 컨테이너 안으로. exit로 나옴</span>
<span class="p">$</span> docker image inspect nginx:alpine --format '{{.Architecture}}'
<span class="p">$</span> docker stop web2 &amp;&amp; docker rm web2</pre>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p><code>-p 8080:80</code>에서 앞 숫자와 뒤 숫자는 각각 무엇인가요? 브라우저에서 <code>http://공인IP:8080</code>은 열릴까요? 왜 그런가요?</p></div>` },

          { n: 7, h: 'Dockerfile로 Flask 앱 이미지 만들기', body: `
      <pre><span class="p">$</span> mkdir -p ~/myapp/app &amp;&amp; cd ~/myapp/app
<span class="p">$</span> nano app.py</pre>
      <span class="prelbl">app.py</span>
      <pre>from flask import Flask

app = Flask(__name__)

@app.get("/")
def index():
    return "&lt;h1&gt;☁️ 컨테이너 안의 Flask&lt;/h1&gt;&lt;p&gt;Day 7&lt;/p&gt;"</pre>
      <span class="prelbl">requirements.txt</span>
      <pre>flask
gunicorn</pre>
      <span class="prelbl">Dockerfile</span>
      <pre>FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]</pre>
      <pre><span class="p">$</span> docker build -t myapp:1 .
<span class="p">$</span> docker run -d --name myapp --restart unless-stopped -p 127.0.0.1:5000:5000 myapp:1
<span class="p">$</span> curl -s localhost:5000</pre>
      <div class="box check"><span class="lbl">127.0.0.1:5000:5000</span>
        <p>앞에 <code>127.0.0.1</code>을 붙이면 서버 안에서만 접근됩니다. 외부 공개는 다음 미션에서 Nginx가 맡습니다.</p></div>` },

          { n: 8, h: 'Nginx 뒤에 앱 연결 — 리버스 프록시', body: `
      <pre><span class="p">$</span> sudo nano /etc/nginx/sites-available/default</pre>
      <p><code>server { ... }</code> 안의 <code>location / { ... }</code> 블록 바로 아래에 추가합니다.</p>
      <pre>    location /app/ {
        proxy_pass http://127.0.0.1:5000/;
    }</pre>
      <pre><span class="p">$</span> sudo nginx -t &amp;&amp; sudo systemctl reload nginx</pre>
      <p><code>http://공인IP/</code>는 자기소개, <code>http://공인IP/app/</code>은 컨테이너 앱이 나오면 성공입니다.</p>
      <div class="box q"><span class="lbl">내일과 연결</span>
        <p>Nginx가 앞에서 요청을 받아 뒤의 앱으로 넘겼습니다. 이 역할을 내일은 Caddy가 맡고, HTTPS 인증서까지 자동으로 처리합니다.</p></div>` }
        ]
      }
    ],
    errors: [
      ['브라우저 접속 안 됨, <code>curl localhost</code>는 됨', '보안 목록 또는 iptables 중 한 곳이 닫힘', '미션 1 두 곳 모두 확인, iptables에서 80이 REJECT보다 위인지'],
      ['<code>permission denied ... docker.sock</code>', 'docker 그룹이 아직 적용 안 됨', '<code>exit</code> 후 다시 접속'],
      ['<code>exec format error</code>', 'x86 전용 이미지를 ARM 서버에서 실행', 'arm64를 지원하는 이미지 사용 (<code>docker manifest inspect 이미지</code>로 확인)'],
      ['<code>port is already allocated</code>', '같은 포트를 쓰는 컨테이너가 이미 있음', '<code>docker ps -a</code>로 찾아 <code>docker rm -f 이름</code>'],
      ['<code>nginx -t</code> 실패', '중괄호 또는 세미콜론 누락', '오류 메시지의 줄 번호를 보고 수정'],
      ['/app/ 에서 502 Bad Gateway', '컨테이너가 꺼져 있음', '<code>docker ps</code>, <code>docker logs myapp</code>']
    ],
    checklist: [
      '보안 목록과 iptables 모두 80·443이 열려 있다',
      '<code>http://공인IP</code>에서 내 자기소개 페이지가 열린다',
      'access.log에서 외부 접속 기록을 확인했다',
      '<code>docker run hello-world</code>가 성공하고 서버 아키텍처가 arm64임을 확인했다',
      '<code>-p</code> 포트 연결의 의미를 설명할 수 있다',
      'myapp:1 이미지를 직접 빌드해 실행했다',
      '<code>http://공인IP/app/</code>에서 Flask 앱이 열린다'
    ]
  },
  assignment: {
    title: '공개된 웹페이지와 첫 컨테이너 앱',
    lede: '내 서버가 인터넷에 열렸고, 앱을 컨테이너로 만들 수 있는지 확인합니다.',
    items: [
      '자기소개 페이지 화면 (주소창의 공인 IP 포함)',
      '<code>sudo iptables -L INPUT -n --line-numbers</code> 출력과 보안 목록 Ingress 화면',
      'access.log 중 외부 접속 3줄 (내 IP 외)',
      'Dockerfile 내용과 <code>docker images</code> 출력',
      '<code>/app/</code> 페이지 화면과 Nginx location 설정'
    ]
  }
};
