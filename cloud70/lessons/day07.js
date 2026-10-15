UBUNTU_COURSE.addChapter({
  id: 'day07',
  no: '07',
  icon: '🐳',
  title: '웹 서버와 Docker',
  subtitle: '80 · 443 열기, Nginx, Docker 이미지 만들기',
  summary: '내 서버를 인터넷에 공개합니다. 두 겹 방화벽에 80 · 443 을 열고 <b>저장</b>까지 하고, Nginx 로 자기소개 페이지를 올립니다. 그다음 Docker 를 설치해 직접 만든 Flask 앱을 <b>이미지</b>로 굽고, Nginx 가 <code>/app/</code> 주소로 그 컨테이너에 연결해 주도록 합니다.',
  goals: [
    '80 · 443 을 보안 목록과 iptables 에 열고 재부팅 뒤에도 유지되게 저장한다',
    'Nginx 로 정적 페이지를 공개하고 바깥에서 확인한다',
    'Docker 를 설치하고 이미지 · 컨테이너 · 포트 연결을 설명할 수 있다',
    'Dockerfile 로 Flask 앱 이미지를 만들고 Nginx 리버스 프록시 뒤에 둔다'
  ],
  sections: [
    // =====================================================================
    {
      id: 'day07-1',
      title: '포트 열기와 Nginx 자기소개 페이지',
      minutes: 120,
      goals: [
        '80 · 443 을 두 겹 모두 열고 netfilter-persistent 로 저장한다',
        'Nginx 의 기본 경로와 설정 파일 위치를 안다',
        '바깥에서 내 페이지를 확인한다'
      ],
      flow: [['포트 열기 · 저장', 30], ['Nginx 설치', 20], ['자기소개 페이지', 45], ['바깥 확인', 15], ['정리', 10]],
      content: [
        { type: 'cmd', title: '1. 보안 목록에 80 · 443', code: 'seclist add 80\nseclist add 443\nseclist show', desc: '실제 서버는 콘솔의 Default Security List → 수신 규칙 추가 (TCP · 대상 포트 <code>80,443</code>) 로 한 번에 넣을 수 있습니다.' },
        { type: 'cmd', title: '2. iptables 에 80 · 443 — 그리고 저장', code: 'sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT\nsudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 443 -j ACCEPT\nsudo iptables -L INPUT -n --line-numbers\nsudo netfilter-persistent save\ngrep -E "dport (80|443)" /etc/iptables/rules.v4', desc: 'iptables 규칙은 메모리에만 있어서 재부팅하면 사라집니다. <code>netfilter-persistent save</code> 가 <code>/etc/iptables/rules.v4</code> 에 저장해 부팅 때 다시 읽게 합니다.' },
        { type: 'cmd', title: '3. Nginx', code: 'sudo apt install -y nginx\nsystemctl status nginx --no-pager | head -3\ncurl -sI localhost | head -2\nlabclient curl -sI http://203.0.113.25 | head -2', desc: '바깥(labclient)에서도 <code>200 OK</code> 가 나오면 두 겹 방화벽이 모두 열린 것입니다.' },
        { type: 'table', head: ['경로', '내용'], rows: [['<code>/var/www/html/</code>', '기본 웹 문서 폴더'], ['<code>/etc/nginx/sites-available/default</code>', '기본 사이트 설정'], ['<code>/var/log/nginx/access.log</code>', '접속 기록'], ['<code>/var/log/nginx/error.log</code>', '오류 기록']] },
        { type: 'file', path: '/var/www/html/index.html', title: '자기소개 페이지 (sudo nano 로 편집)', code: '<!doctype html>\n<html lang="ko">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>홍길동의 클라우드 서버</title>\n  <style>\n    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; line-height: 1.6 }\n    h1 { color: #e95420 }\n  </style>\n</head>\n<body>\n  <h1>안녕하세요, 홍길동입니다 ☁️</h1>\n  <p>AI응용소프트웨어과 · 클라우드 기초 70시간 과정</p>\n  <ul>\n    <li>서버: Oracle Cloud Always Free (A1.Flex)</li>\n    <li>OS: Ubuntu 24.04 LTS · 웹 서버: Nginx</li>\n  </ul>\n</body>\n</html>', desc: '이름 · 소개를 자기 것으로 바꾸세요. 저장하면 새로고침만으로 바로 반영됩니다(재시작 불필요).' },
        { type: 'cmd', title: '바깥에서 확인과 접속 기록', code: 'labclient curl -s http://203.0.113.25 | grep "<h1>"\nsudo tail -3 /var/log/nginx/access.log', desc: '실제 서버는 휴대폰으로 <code>http://공인IP</code> 를 열어 봅니다. 접속 기록에 휴대폰 IP 가 찍힙니다.' }
      ],
      practice: [
        {
          title: '실습 7-1. 저장까지 마친 80 · 443',
          level: 2,
          desc: '<p>보안 목록과 iptables 에 80 · 443 을 열고 <code>/etc/iptables/rules.v4</code> 에 저장하세요. iptables 의 새 규칙은 <b>REJECT 보다 앞</b>에 있어야 합니다.</p>',
          hint: '<code>seclist add 80</code> · <code>sudo iptables -I INPUT 5 ...</code> · <code>sudo netfilter-persistent save</code>',
          solution: 'seclist add 80\nseclist add 443\nsudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT\nsudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 443 -j ACCEPT\nsudo netfilter-persistent save',
          check: 'seclist show | grep -qw 80 && seclist show | grep -qw 443 && grep -q "dport 80 " /etc/iptables/rules.v4 && grep -q "dport 443 " /etc/iptables/rules.v4 && r=$(iptables -L INPUT -n --line-numbers | awk \'/REJECT/{print $1}\') && a=$(iptables -L INPUT -n --line-numbers | awk \'/dpt:80$/{print $1}\') && b=$(iptables -L INPUT -n --line-numbers | awk \'/dpt:443$/{print $1}\') && [ -n "$a" ] && [ -n "$b" ] && [ "$a" -lt "$r" ] && [ "$b" -lt "$r" ]',
          checkOk: '두 겹 모두 열렸고 재부팅 뒤에도 유지됩니다.',
          checkFail: '<code>seclist show</code>, <code>sudo iptables -L INPUT -n --line-numbers</code>, <code>grep dport /etc/iptables/rules.v4</code> 를 확인하세요. -A 로 넣었다면 REJECT 뒤라서 소용없습니다.'
        },
        {
          title: '실습 7-2. 바깥에서 보이는 자기소개 페이지',
          level: 1,
          desc: '<p>Nginx 를 설치하고 <code>/var/www/html/index.html</code> 을 자기소개 페이지로 바꾸세요. 바깥(<code>labclient</code>)에서 본 페이지에 <code>&lt;h1&gt;</code> 과 <code>클라우드</code> 라는 단어가 있어야 합니다.</p>',
          hint: '<code>sudo nano /var/www/html/index.html</code> 후 <code>labclient curl -s http://203.0.113.25</code>',
          solution: 'sudo apt install -y nginx\nseclist add 80 2>/dev/null; sudo iptables -C INPUT -m state --state NEW -p tcp --dport 80 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT\ncat <<\'EOF\' | sudo tee /var/www/html/index.html\n<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><title>홍길동의 클라우드 서버</title></head>\n<body><h1>안녕하세요, 홍길동입니다</h1><p>클라우드 기초 70시간 과정</p></body></html>\nEOF\nlabclient curl -s http://203.0.113.25',
          check: 'labclient curl -s -m 3 http://203.0.113.25 2>/dev/null | grep -q "<h1>" && labclient curl -s -m 3 http://203.0.113.25 2>/dev/null | grep -q 클라우드',
          checkOk: '인터넷에 내 페이지가 공개되었습니다.',
          checkFail: '<code>labclient curl -s http://203.0.113.25</code> 결과를 보세요. 시간 초과면 보안 목록, 연결 거부면 iptables 나 Nginx 를 확인합니다.'
        }
      ],
      quiz: [
        { q: 'iptables 규칙을 재부팅 뒤에도 유지하는 명령은?', options: ['iptables -F', 'sudo netfilter-persistent save', 'sudo reboot', 'systemctl restart nginx'], answer: 1, explain: '/etc/iptables/rules.v4 에 저장되고 부팅 때 다시 읽힙니다.' },
        { q: 'Nginx 기본 웹 문서 폴더는?', options: ['/etc/nginx', '/var/www/html', '/home/ubuntu/www', '/usr/share/doc'], answer: 1, explain: 'sites-available/default 의 root 값입니다.' },
        { q: '서버 안 curl localhost 는 되는데 바깥에서 곧바로 "연결 거부" 가 난다. 확인할 곳은?', options: ['보안 목록', 'iptables', 'DNS', '휴대폰'], answer: 1, explain: '곧바로 거부 = 바깥 문은 통과, 서버 안 iptables REJECT 를 의심합니다.' }
      ],
      slides: [
        { layout: 'title', title: '웹 서버 공개', subtitle: '80 · 443 열기 → Nginx → 자기소개 페이지', notes: '<p>오늘 끝나면 휴대폰으로 내 서버 페이지를 볼 수 있다고 동기 부여합니다.</p>' },
        { layout: 'code', title: '두 겹 열고 저장', code: 'seclist add 80; seclist add 443\nsudo iptables -I INPUT 5 -m state --state NEW \\\n  -p tcp --dport 80 -j ACCEPT\nsudo iptables -I INPUT 5 -m state --state NEW \\\n  -p tcp --dport 443 -j ACCEPT\nsudo netfilter-persistent save', points: ['443 은 8일차 HTTPS 용', 'save 를 잊으면 재부팅 때 사라짐'], notes: '' },
        { layout: 'table', title: 'Nginx 지도', head: ['경로', '용도'], rows: [['/var/www/html', '웹 문서'], ['/etc/nginx/sites-available/default', '설정'], ['/var/log/nginx/', '로그']], notes: '' },
        { layout: 'practice', title: '실습 7-1 · 7-2', bullets: ['80 · 443 저장까지', '자기소개 페이지', '휴대폰으로 확인'], notes: '<p>휴대폰 화면 캡처를 산출물로 받습니다.</p>' },
        { layout: 'summary', title: '정리', bullets: ['두 겹 열기 + 저장', 'Nginx 경로 3가지', '바깥 확인 습관'], notes: '' }
      ]
    },
    // =====================================================================
    {
      id: 'day07-2',
      title: 'Docker 설치와 첫 컨테이너',
      minutes: 120,
      goals: [
        '공식 스크립트로 Docker 를 설치하고 docker 그룹을 설정한다',
        '이미지와 컨테이너의 차이를 설명할 수 있다',
        'run · ps · logs · exec · stop · rm 을 쓸 수 있다'
      ],
      flow: [['왜 컨테이너인가', 20], ['설치', 25], ['첫 컨테이너', 30], ['포트 연결', 30], ['정리', 15]],
      content: [
        { type: 'p', html: '앱을 서버에 직접 설치하면 "내 PC 에서는 되는데 서버에서는 안 돼요" 가 생깁니다. <b>Docker</b> 는 앱과 그 앱이 필요로 하는 모든 것(파이썬 버전, 라이브러리, 설정)을 <b>이미지</b> 하나에 담고, 그 이미지를 어디서나 똑같이 실행(<b>컨테이너</b>)합니다.' },
        { type: 'table', head: ['용어', '비유', '예'], rows: [['이미지', '설치 CD · 붕어빵 틀', '<code>nginx:latest</code>, <code>python:3.12-slim</code>'], ['컨테이너', '설치되어 실행 중인 프로그램 · 붕어빵', '<code>docker run</code> 으로 만든 것'], ['레지스트리', '앱 스토어', 'Docker Hub'], ['볼륨', '컨테이너 밖에 두는 저장 공간', '8일차 DB 데이터']] },
        { type: 'cmd', title: '설치 — 공식 스크립트', code: 'curl -fsSL https://get.docker.com -o get-docker.sh\nless get-docker.sh\nsudo sh get-docker.sh\ndocker --version', desc: '인터넷에서 받은 스크립트는 <b>먼저 읽고</b> 실행하는 습관을 들입니다(<code>q</code> 로 less 종료). Arm(aarch64) 서버도 같은 명령으로 설치됩니다.' },
        { type: 'cmd', title: 'sudo 없이 쓰기 — docker 그룹', code: 'sudo usermod -aG docker $USER\nnewgrp docker\ndocker ps', desc: '실제 서버에서는 <code>newgrp</code> 대신 로그아웃 후 다시 접속해도 됩니다. docker 그룹은 사실상 root 권한이므로 믿을 수 있는 계정만 넣습니다.' },
        { type: 'cmd', title: '첫 컨테이너', code: 'docker run --rm hello-world\ndocker images\ndocker run -d --name web1 -p 8080:80 nginx\ndocker ps\ncurl -s localhost:8080 | grep title', desc: '<code>-p 8080:80</code> = 서버의 8080 → 컨테이너의 80. <code>-d</code> 는 백그라운드, <code>--name</code> 은 이름표입니다.' },
        { type: 'cmd', title: '들여다보고 정리하기', code: 'docker logs web1 | tail -3\ndocker exec web1 cat /etc/os-release | head -2\ndocker exec -it web1 bash\n# (컨테이너 안) ls /usr/share/nginx/html; exit\ndocker stop web1\ndocker rm web1\ndocker ps -a', desc: '컨테이너 안은 Debian 이고 서버는 Ubuntu 입니다. 컨테이너는 서버와 분리된 작은 리눅스입니다.' },
        { type: 'callout', kind: 'warn', title: 'Docker 는 iptables 를 건너뜁니다', html: '<p>Docker 가 <code>-p 8080:80</code> 으로 연 포트는 우리가 만든 INPUT 규칙을 거치지 않습니다. 실제 Oracle 서버에서는 보안 목록이 바깥 문을 지켜 주지만, 다른 클라우드나 집 서버에서는 의도치 않게 공개될 수 있습니다. 바깥에 보일 필요가 없는 컨테이너는 <code>-p 127.0.0.1:8080:80</code> 처럼 <b>127.0.0.1 에만</b> 연결합니다.</p>' }
      ],
      practice: [
        {
          title: '실습 7-3. 컨테이너 한 바퀴',
          level: 1,
          desc: '<p>Docker 를 설치하고 <code>web1</code> 이라는 nginx 컨테이너를 8080 포트로 실행해 보세요. <code>docker exec</code> 로 컨테이너 안의 <code>/usr/share/nginx/html/index.html</code> 을 <code>Hello Docker</code> 로 바꾸고, 서버에서 <code>curl localhost:8080</code> 으로 확인하세요.</p>',
          hint: '<code>docker exec web1 sh -c \'echo "Hello Docker" > /usr/share/nginx/html/index.html\'</code>',
          solution: 'curl -fsSL https://get.docker.com -o get-docker.sh\nsudo sh get-docker.sh\nsudo usermod -aG docker $USER\n# 그룹은 다시 로그인해야 적용되므로 이번에는 sudo 로\nsudo docker run -d --name web1 -p 8080:80 nginx\nsudo docker exec web1 sh -c \'echo "Hello Docker" > /usr/share/nginx/html/index.html\'\ncurl -s localhost:8080',
          check: 'docker ps --format "{{.Names}}" | grep -qx web1 && curl -s localhost:8080 | grep -q "Hello Docker"',
          checkOk: '컨테이너를 만들고 안을 고쳤습니다. (실습이 끝나면 docker rm -f web1 로 지워도 됩니다)',
          checkFail: '<code>docker ps</code> 에 web1 이 있는지, <code>curl -s localhost:8080</code> 결과를 확인하세요.'
        }
      ],
      quiz: [
        { q: '이미지와 컨테이너의 관계로 옳은 것은?', options: ['컨테이너로 이미지를 실행한다', '이미지로 컨테이너를 만든다', '둘은 같은 것이다', '컨테이너는 레지스트리에 저장된다'], answer: 1, explain: '이미지(틀) 하나로 컨테이너(실행)를 여러 개 만들 수 있습니다.' },
        { q: '<code>-p 8080:80</code> 의 뜻은?', options: ['컨테이너 8080 → 서버 80', '서버 8080 → 컨테이너 80', '두 포트를 모두 닫음', '80 을 8080 번 반복'], answer: 1, explain: '앞이 서버(호스트), 뒤가 컨테이너입니다.' },
        { q: '바깥에 보일 필요 없는 컨테이너 포트를 안전하게 여는 방법은?', options: ['-p 5000:5000', '-p 127.0.0.1:5000:5000', '--privileged', '-p 0.0.0.0:5000:5000'], answer: 1, explain: '127.0.0.1 에만 연결하면 서버 안에서만 접속됩니다.' }
      ],
      slides: [
        { layout: 'title', title: 'Docker', subtitle: '앱을 상자째 옮기기', notes: '<p>"내 PC 에서는 되는데요" 경험을 물어보며 시작합니다.</p>' },
        { layout: 'table', title: '용어', head: ['용어', '비유'], rows: [['이미지', '붕어빵 틀'], ['컨테이너', '붕어빵'], ['레지스트리', '앱 스토어'], ['볼륨', '밖에 둔 저장 공간']], notes: '' },
        { layout: 'code', title: '기본 명령', code: 'docker run -d --name web1 -p 8080:80 nginx\ndocker ps\ndocker logs web1\ndocker exec -it web1 bash\ndocker stop web1 && docker rm web1', points: ['-d 백그라운드', '-p 서버:컨테이너'], notes: '' },
        { layout: 'summary', title: '정리', bullets: ['스크립트는 읽고 실행', 'docker 그룹 = root 급', '127.0.0.1 바인딩'], notes: '<p>다음: 내 앱을 이미지로.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day07-3',
      title: '내 앱을 이미지로 — Flask + Nginx 프록시',
      minutes: 140,
      goals: [
        'Dockerfile 의 FROM · WORKDIR · COPY · RUN · CMD 를 설명할 수 있다',
        'Flask 앱 이미지를 빌드하고 127.0.0.1 에만 연결해 실행한다',
        'Nginx 리버스 프록시로 /app/ 주소를 컨테이너에 연결한다'
      ],
      flow: [['앱 코드', 20], ['Dockerfile', 35], ['빌드 · 실행', 30], ['리버스 프록시', 40], ['정리', 15]],
      content: [
        { type: 'file', path: '~/myweb/app.py', title: '작은 Flask 앱', code: 'from flask import Flask\napp = Flask(__name__)\n\n@app.route("/")\ndef home():\n    name = "홍길동"\n    return f"<h1>Flask in Docker</h1><p>{name} 의 첫 컨테이너 앱</p>"\n\n@app.route("/health")\ndef health():\n    return "ok"', desc: '<code>/health</code> 는 "살아 있나?" 확인용 주소입니다. 운영에서 자주 씁니다.' },
        { type: 'file', path: '~/myweb/requirements.txt', title: '필요한 라이브러리', code: 'flask==3.0.3\ngunicorn==22.0.0', desc: '<code>gunicorn</code> 은 운영용 파이썬 웹 서버입니다. Flask 내장 서버는 개발용입니다.' },
        { type: 'file', path: '~/myweb/Dockerfile', title: '이미지 설계도', code: 'FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY app.py .\nEXPOSE 5000\nCMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]', desc: '' },
        { type: 'table', head: ['줄', '뜻'], rows: [['<code>FROM python:3.12-slim</code>', '파이썬이 설치된 가벼운 이미지에서 시작 (Arm 판도 있음)'], ['<code>WORKDIR /app</code>', '이후 작업 폴더'], ['<code>COPY requirements.txt .</code>', '라이브러리 목록 먼저 복사 → 코드만 바뀌면 다음 줄을 캐시로 건너뜀'], ['<code>RUN pip install ...</code>', '이미지를 만들 때 한 번 실행'], ['<code>COPY app.py .</code>', '앱 코드 복사'], ['<code>CMD [...]</code>', '컨테이너가 시작될 때 실행']] },
        { type: 'cmd', title: '빌드와 실행', code: 'cd ~/myweb\ndocker build -t myweb:1.0 .\ndocker images | head -3\ndocker run -d --name myweb --restart unless-stopped -p 127.0.0.1:5000:5000 myweb:1.0\ndocker ps\ncurl -s localhost:5000; echo\ncurl -s localhost:5000/health; echo', desc: '<code>--restart unless-stopped</code> 는 서버가 재부팅되거나 앱이 죽어도 다시 켭니다. <code>127.0.0.1:5000</code> 이라 바깥에서는 직접 볼 수 없습니다.' },
        { type: 'h', text: 'Nginx 가 문지기 — 리버스 프록시' },
        { type: 'figure', html: '<svg viewBox="0 0 680 140" style="width:100%;height:auto" font-family="var(--sans)"><rect x="10" y="40" width="110" height="60" rx="10" fill="var(--card)" stroke="var(--line)"/><text x="65" y="76" text-anchor="middle" font-size="13" fill="var(--fg)">🌐 브라우저</text><path d="M120 70 H200" stroke="var(--accent)" stroke-width="3"/><text x="160" y="60" text-anchor="middle" font-size="11" fill="var(--muted)">:80</text><rect x="200" y="20" width="200" height="100" rx="12" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="300" y="50" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fg)">Nginx</text><text x="300" y="76" text-anchor="middle" font-size="12" font-family="var(--mono)" fill="var(--fg)">/  → /var/www/html</text><text x="300" y="98" text-anchor="middle" font-size="12" font-family="var(--mono)" fill="var(--fg)">/app/ → 127.0.0.1:5000</text><path d="M400 90 H480" stroke="var(--accent)" stroke-width="3"/><rect x="480" y="55" width="190" height="60" rx="10" fill="var(--card2)" stroke="var(--line)"/><text x="575" y="90" text-anchor="middle" font-size="13" fill="var(--fg)">🐳 myweb (Flask)</text></svg>', caption: '바깥 문은 Nginx 하나, 뒤에 여러 앱을 둘 수 있습니다' },
        { type: 'file', path: '/etc/nginx/sites-available/default', title: '/app/ 위치 추가 (sudo nano)', code: 'server {\n    listen 80 default_server;\n    root /var/www/html;\n    index index.html;\n\n    location / {\n        try_files $uri $uri/ =404;\n    }\n\n    location /app/ {\n        proxy_pass http://127.0.0.1:5000/;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n    }\n}', desc: '<code>proxy_pass</code> 끝의 <code>/</code> 가 중요합니다. <code>/app/health</code> 요청이 앱에는 <code>/health</code> 로 전달됩니다.' },
        { type: 'cmd', title: '적용과 확인', code: 'sudo nginx -t && sudo systemctl reload nginx\nlabclient curl -s http://203.0.113.25/app/; echo\nlabclient curl -s -m 3 http://203.0.113.25:5000; echo "직접 접속: $?"', desc: '<code>nginx -t</code> 로 문법 검사를 먼저 하고 reload 합니다. 바깥에서 /app/ 은 되고 5000 직접 접속은 안 되는 것이 정답입니다.' },
        { type: 'cmd', title: '코드를 바꾸면 — 다시 빌드', code: 'cd ~/myweb\nsed -i \'s/첫 컨테이너 앱/두 번째 버전/\' app.py\ndocker build -t myweb:1.1 .\ndocker rm -f myweb\ndocker run -d --name myweb --restart unless-stopped -p 127.0.0.1:5000:5000 myweb:1.1\ncurl -s localhost:5000; echo', desc: '컨테이너 안을 직접 고치지 않고, 코드를 고쳐 <b>새 이미지</b>를 만들어 바꿔 끼웁니다. 그래서 1.0 으로 언제든 되돌릴 수 있습니다.' }
      ],
      practice: [
        {
          title: '실습 7-4. 프록시 뒤의 Flask 앱',
          level: 3,
          desc: '<p><code>~/myweb</code> 에 Flask 앱 · requirements.txt · Dockerfile 을 만들고 <code>myweb</code> 이미지를 빌드해 <code>myweb</code> 컨테이너를 <b>127.0.0.1:5000</b> 에만 연결해 실행하세요. Nginx 의 <code>/app/</code> 가 이 앱으로 연결되어 바깥에서 <code>http://203.0.113.25/app/</code> 에 <code>Flask</code> 가 보여야 하고, 5000 직접 접속은 되지 않아야 합니다.</p>',
          hint: '본문 순서대로: 파일 3개 → docker build → docker run -p 127.0.0.1:5000:5000 → Nginx location /app/ → nginx -t → reload',
          solution: 'curl -fsSL https://get.docker.com | sudo sh\nsudo apt install -y nginx\nseclist add 80 2>/dev/null; sudo iptables -C INPUT -m state --state NEW -p tcp --dport 80 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT\nmkdir -p ~/myweb && cd ~/myweb\ncat > app.py <<\'EOF\'\nfrom flask import Flask\napp = Flask(__name__)\n\n@app.route("/")\ndef home():\n    name = "홍길동"\n    return f"<h1>Flask in Docker</h1><p>{name} 의 첫 컨테이너 앱</p>"\n\n@app.route("/health")\ndef health():\n    return "ok"\nEOF\nprintf \'flask==3.0.3\\ngunicorn==22.0.0\\n\' > requirements.txt\ncat > Dockerfile <<\'EOF\'\nFROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY app.py .\nEXPOSE 5000\nCMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]\nEOF\nsudo docker build -t myweb:1.0 .\nsudo docker run -d --name myweb --restart unless-stopped -p 127.0.0.1:5000:5000 myweb:1.0\ncat <<\'EOF\' | sudo tee /etc/nginx/sites-available/default\nserver {\n    listen 80 default_server;\n    root /var/www/html;\n    index index.html;\n    location / { try_files $uri $uri/ =404; }\n    location /app/ {\n        proxy_pass http://127.0.0.1:5000/;\n        proxy_set_header Host $host;\n    }\n}\nEOF\nsudo nginx -t && sudo systemctl reload nginx',
          check: 'docker ps --format "{{.Names}} {{.Ports}}" | grep -q "^myweb 127.0.0.1:5000->5000" && labclient curl -s -m 3 http://203.0.113.25/app/ 2>/dev/null | grep -q Flask && ! labclient curl -s -m 3 http://203.0.113.25:5000 >/dev/null 2>&1',
          checkOk: 'Nginx 뒤에 숨은 컨테이너 앱이 완성되었습니다.',
          checkFail: '<code>docker ps</code> 의 PORTS 가 127.0.0.1:5000->5000 인지, <code>labclient curl -s http://203.0.113.25/app/</code> 결과, <code>sudo nginx -t</code> 를 확인하세요.'
        }
      ],
      quiz: [
        { q: 'Dockerfile 에서 requirements.txt 를 app.py 보다 먼저 COPY 하는 이유는?', options: ['문법 규칙', '코드만 바뀌었을 때 pip install 단계를 캐시로 건너뛰려고', '보안', '이미지 이름 때문'], answer: 1, explain: '바뀌지 않은 앞 단계는 캐시를 재사용합니다.' },
        { q: '<code>proxy_pass http://127.0.0.1:5000/;</code> 에서 끝의 / 가 하는 일은?', options: ['아무 의미 없음', '/app/ 접두사를 떼고 앱에 전달', 'HTTPS 로 변경', '포트 변경'], answer: 1, explain: '/app/health → /health 로 전달됩니다.' },
        { q: '앱 코드를 바꿨을 때 권장 방법은?', options: ['docker exec 로 컨테이너 안 수정', '새 이미지 빌드 후 컨테이너 교체', '서버 재부팅', 'Nginx 재설치'], answer: 1, explain: '이미지에 버전을 붙이면 되돌리기도 쉽습니다.' }
      ],
      slides: [
        { layout: 'title', title: '내 앱을 이미지로', subtitle: 'Dockerfile → build → run → Nginx 프록시', notes: '' },
        { layout: 'code', title: 'Dockerfile', path: '~/myweb/Dockerfile', code: 'FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY app.py .\nEXPOSE 5000\nCMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]', points: ['라이브러리 먼저 → 캐시', 'CMD = 시작 명령'], notes: '<p>한 줄씩 손으로 짚어 가며 설명합니다.</p>' },
        { layout: 'diagram', title: '리버스 프록시', html: '<div style="font-size:1.4em;text-align:center;line-height:2">🌐 :80 → <b>Nginx</b><br>/ → /var/www/html<br>/app/ → 127.0.0.1:5000 → 🐳 Flask</div>', notes: '<p>바깥 문은 하나, 뒤에 여러 앱.</p>' },
        { layout: 'practice', title: '실습 7-4', bullets: ['파일 3개 → build → run', '127.0.0.1:5000 에만', 'Nginx /app/ 연결 · 바깥 확인'], notes: '' },
        { layout: 'summary', title: '7일차 정리', bullets: ['80 · 443 공개 (저장까지)', 'Docker 기본기', '이미지 빌드 + 리버스 프록시'], notes: '<p>내일: 여러 컨테이너를 Compose 로, 그리고 HTTPS.</p>' }
      ]
    }
  ]
});
