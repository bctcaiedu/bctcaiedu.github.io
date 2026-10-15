UBUNTU_COURSE.addChapter({
  id: 'day09',
  no: '09',
  icon: '🗄️',
  title: '스토리지 · DB 백업 · 서버리스',
  subtitle: '백업 → 일부러 지우기 → 복구, 객체 스토리지, Cloud Run',
  summary: '서버 운영에서 가장 중요한 습관은 <b>백업</b>이고, 백업은 <b>복구해 봐야</b> 백업입니다. 오늘은 DB 를 덤프하고 매일 자동으로 백업되게 한 뒤, 볼륨을 일부러 지우고 되살려 봅니다. 오후에는 서버를 빌리지 않는 두 가지 방식 — 파일을 맡기는 <b>객체 스토리지</b>(Cloud Storage)와 코드만 올리면 실행해 주는 <b>서버리스</b>(Cloud Run) — 를 내 서버 방식과 비교합니다.',
  goals: [
    'mariadb-dump 로 DB 를 백업하고 압축 · 보관 기간 정리를 자동화한다',
    '볼륨을 지운 상태에서 백업으로 복구하는 훈련을 마친다',
    '객체 스토리지 버킷을 만들고 공개 / 비공개 접근을 구분한다',
    'Cloud Run 에 컨테이너 앱을 배포하고 VM 방식과 비교한 뒤 깨끗이 정리한다'
  ],
  sections: [
    // =====================================================================
    {
      id: 'day09-1',
      title: 'DB 백업 자동화',
      minutes: 120,
      goals: [
        '.env 를 읽어 비밀번호를 명령에 넘기는 방법을 안다',
        'mariadb-dump 결과를 gzip 으로 압축해 날짜별 파일로 남긴다',
        'cron 으로 매일 백업하고 7일 지난 파일을 지운다'
      ],
      flow: [['왜 백업인가', 15], ['수동 덤프', 30], ['백업 스크립트', 40], ['cron', 20], ['정리', 15]],
      content: [
        { type: 'callout', kind: 'info', title: '8일차 서비스가 없다면', html: '<p>가상 서버를 초기화했거나 8일차를 끝내지 못했다면 <code>c70-ready stack</code> 을 실행하세요. 방화벽 · Docker · <code>~/stack</code> 3단 서비스를 한 번에 준비해 줍니다(가상 서버 전용 도우미).</p>' },
        { type: 'table', head: ['위험', '예'], rows: [['사람 실수', '<code>docker compose down -v</code>, 잘못된 DELETE 문'], ['서버 사고', '디스크 고장, 무료 계정 정지 · 회수'], ['공격', '랜섬웨어, 비밀번호 유출']] },
        { type: 'cmd', title: '수동 덤프 — 먼저 한 번 손으로', code: 'cd ~/stack\nset -a; . ./.env; set +a\necho "$DB_NAME"\nmkdir -p ~/backup\ndocker compose exec -T db mariadb-dump -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME" > ~/backup/first.sql\nhead -5 ~/backup/first.sql\ngrep "INSERT INTO" ~/backup/first.sql | cut -c1-80', desc: '<code>set -a; . ./.env; set +a</code> 는 .env 의 값을 환경 변수로 불러옵니다. <code>exec -T</code> 는 터미널을 붙이지 않는 모드로, 출력을 파일로 보낼 때 필요합니다. 덤프 파일은 <b>DB 를 다시 만드는 SQL 문</b>입니다.' },
        { type: 'file', path: '~/backup.sh', mode: '700', title: '백업 스크립트', code: '#!/bin/bash\nset -e\ncd ~/stack\nset -a; . ./.env; set +a\nmkdir -p ~/backup\nf=~/backup/cloud70-$(date +%F-%H%M).sql.gz\ndocker compose exec -T db mariadb-dump -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME" | gzip > "$f"\nfind ~/backup -name \'cloud70-*.sql.gz\' -mtime +7 -delete\necho "백업 완료: $f ($(du -h "$f" | cut -f1))"', desc: '<code>set -e</code> — 중간에 실패하면 멈춥니다. 날짜 · 시각이 들어간 파일 이름, gzip 압축, 7일 지난 파일 삭제까지 한 번에.' },
        { type: 'cmd', title: '실행하고 매일 새벽 3시에', code: 'chmod 700 ~/backup.sh\n~/backup.sh\nls -lh ~/backup\nzcat ~/backup/cloud70-*.sql.gz | grep -c "INSERT INTO"\n(crontab -l 2>/dev/null; echo "0 3 * * * ~/backup.sh >> ~/backup/backup.log 2>&1") | crontab -\ncrontab -l', desc: '6일차에 시간대를 Asia/Seoul 로 바꿨으므로 한국 시각 새벽 3시입니다. <code>>> backup.log 2>&1</code> 로 성공 · 실패 기록을 남깁니다.' },
        { type: 'callout', kind: 'warn', title: '같은 서버의 백업은 반쪽짜리', html: '<p>서버가 통째로 사라지면 <code>~/backup</code> 도 함께 사라집니다. 백업은 <b>다른 곳</b>에도 두어야 합니다(3-2-1 규칙: 사본 3개, 매체 2종, 1개는 다른 장소). 오후의 객체 스토리지나 내 PC 로 가져오기(<code>scp oracle:~/backup/*.gz .</code>)가 그 방법입니다.</p>' }
      ],
      practice: [
        {
          title: '실습 9-1. 매일 도는 백업',
          level: 2,
          desc: '<p><code>~/backup.sh</code>(권한 700)를 만들어 한 번 실행하고, crontab 에 매일 실행되게 넣으세요. <code>~/backup</code> 에 <code>cloud70-*.sql.gz</code> 파일이 있고 그 안에 <code>visits</code> 테이블이 들어 있어야 합니다.</p>',
          hint: '본문의 스크립트 그대로. 서비스가 없다면 먼저 <code>c70-ready stack</code>.',
          solution: 'c70-ready stack\ncat > ~/backup.sh <<\'EOF\'\n#!/bin/bash\nset -e\ncd ~/stack\nset -a; . ./.env; set +a\nmkdir -p ~/backup\nf=~/backup/cloud70-$(date +%F-%H%M).sql.gz\nsudo docker compose exec -T db mariadb-dump -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME" | gzip > "$f"\nfind ~/backup -name \'cloud70-*.sql.gz\' -mtime +7 -delete\necho "백업 완료: $f"\nEOF\nchmod 700 ~/backup.sh\n~/backup.sh\n(crontab -l 2>/dev/null; echo "0 3 * * * ~/backup.sh >> ~/backup/backup.log 2>&1") | crontab -',
          check: '[ "$(stat -c %a /home/student/backup.sh 2>/dev/null)" = 700 ] && crontab -u student -l 2>/dev/null | grep -q backup.sh && f=$(ls -t /home/student/backup/cloud70-*.sql.gz 2>/dev/null | head -1) && [ -n "$f" ] && zcat "$f" | grep -q "CREATE TABLE .visits"',
          checkOk: '매일 새벽 백업이 돌아갑니다.',
          checkFail: '<code>ls -l ~/backup.sh ~/backup</code>, <code>crontab -l</code>, <code>zcat ~/backup/cloud70-*.sql.gz | grep visits</code> 를 확인하세요.'
        }
      ],
      quiz: [
        { q: '<code>docker compose exec -T</code> 의 -T 가 필요한 경우는?', options: ['대화형 셸을 열 때', '출력을 파일이나 파이프로 보낼 때', '루트로 실행할 때', '컨테이너를 새로 만들 때'], answer: 1, explain: '터미널(TTY)을 붙이지 않아야 출력이 깨끗하게 전달됩니다.' },
        { q: '백업 스크립트의 <code>find ... -mtime +7 -delete</code> 는?', options: ['7개만 백업', '7일 지난 백업 파일 삭제', '7분마다 실행', '7번째 줄 삭제'], answer: 1, explain: '디스크가 백업으로 가득 차지 않게 합니다.' },
        { q: '3-2-1 백업 규칙의 "1" 은?', options: ['하루 1번', '1개는 다른 장소에', '1개의 파일로', '1년 보관'], answer: 1, explain: '서버와 함께 사라지지 않는 곳에 사본을 둡니다.' }
      ],
      slides: [
        { layout: 'title', title: 'DB 백업', subtitle: '덤프 · 압축 · 자동 · 정리', notes: '<p>"백업이 없어서 서비스를 접은" 사례를 하나 이야기합니다.</p>' },
        { layout: 'code', title: '핵심 한 줄', code: 'docker compose exec -T db \\\n  mariadb-dump -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME" \\\n  | gzip > ~/backup/cloud70-$(date +%F-%H%M).sql.gz', points: ['.env 를 set -a 로 읽기', '-T = 파이프용'], notes: '' },
        { layout: 'bullets', title: '자동화', bullets: ['~/backup.sh (700)', 'cron 0 3 * * *', '7일 지난 파일 삭제', '로그는 backup.log'], notes: '' },
        { layout: 'summary', title: '정리', bullets: ['백업은 자동으로', '같은 서버만으로는 부족', '다음: 복구해 봐야 백업'], notes: '' }
      ]
    },
    // =====================================================================
    {
      id: 'day09-2',
      title: '복구 훈련 — 일부러 지우고 되살리기',
      minutes: 80,
      goals: [
        'down -v 로 데이터를 잃는 상황을 재현한다',
        '가장 최근 백업으로 DB 를 복구한다',
        '복구 절차를 문서로 남긴다'
      ],
      flow: [['사고 재현', 20], ['복구', 30], ['절차서', 20], ['정리', 10]],
      content: [
        { type: 'cmd', title: '사고 전 — 숫자를 적어 두세요', code: 'cd ~/stack\ncurl -s localhost; echo\n~/backup.sh', desc: '복구 후 비교할 방문 수를 기억합니다. 사고 직전 백업도 한 번 더.' },
        { type: 'cmd', title: '사고 — 볼륨까지 삭제', code: 'docker compose down -v\ndocker volume ls\ndocker compose up -d\ncurl -s localhost; echo', desc: '방문 수가 <b>1</b> 부터 다시 시작합니다. 운영 중이라면 모든 회원 · 게시글이 사라진 상황입니다.' },
        { type: 'cmd', title: '복구 — 최근 백업을 DB 에 흘려 넣기', code: 'cd ~/stack\nset -a; . ./.env; set +a\nf=$(ls -t ~/backup/cloud70-*.sql.gz | head -1); echo "$f"\nzcat "$f" | docker compose exec -T db mariadb -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME"\ncurl -s localhost; echo', desc: '덤프 파일에는 <code>DROP TABLE IF EXISTS</code> → <code>CREATE TABLE</code> → <code>INSERT</code> 가 들어 있어서, 새로 생긴 빈 테이블을 백업 시점 상태로 바꿉니다. 방문 수가 사고 전 숫자 + 1 이 되면 성공.' },
        { type: 'file', path: '~/cloud70/day9/restore.md', title: '복구 절차서 (예)', code: '# DB 복구 절차\n1. 서비스 상태 확인: docker compose ps\n2. 최근 백업 찾기: ls -t ~/backup/cloud70-*.sql.gz | head -1\n3. 비밀번호 불러오기: set -a; . ./.env; set +a\n4. 복구: zcat 백업 | docker compose exec -T db mariadb -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME"\n5. 확인: curl -s localhost\n\n훈련 기록: 사고 전 방문 N → 사고 후 1 → 복구 후 N+1', desc: '사고는 당황한 상태에서 일어납니다. 미리 쓰고 연습한 절차서가 있어야 합니다.' }
      ],
      practice: [
        {
          title: '실습 9-2. 복구 훈련 기록',
          level: 2,
          desc: '<p>백업 → <code>down -v</code> → <code>up -d</code> → 복구 훈련을 하고, <code>~/cloud70/day9/restore.md</code> 에 절차와 <b>사고 전 · 사고 후 · 복구 후</b> 방문 수를 기록하세요. 최종 서비스의 방문 수가 <b>3 이상</b>이어야 합니다(복구 성공).</p>',
          hint: '사고 전 숫자를 꼭 적어 두세요. 복구 명령은 <code>zcat 파일 | docker compose exec -T db mariadb ...</code>',
          solution: 'c70-ready stack\ncd ~/stack\ncurl -s localhost >/dev/null; curl -s localhost >/dev/null\nbefore=$(curl -s localhost | sed -n "s/.*방문 \\([0-9]*\\)번째.*/\\1/p")\n~/backup.sh 2>/dev/null || { set -a; . ./.env; set +a; mkdir -p ~/backup; sudo docker compose exec -T db mariadb-dump -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME" | gzip > ~/backup/cloud70-$(date +%F-%H%M).sql.gz; }\nsudo docker compose down -v\nsudo docker compose up -d\nafter=$(curl -s localhost | sed -n "s/.*방문 \\([0-9]*\\)번째.*/\\1/p")\nset -a; . ./.env; set +a\nf=$(ls -t ~/backup/cloud70-*.sql.gz | head -1)\nzcat "$f" | sudo docker compose exec -T db mariadb -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME"\nrestored=$(curl -s localhost | sed -n "s/.*방문 \\([0-9]*\\)번째.*/\\1/p")\nmkdir -p ~/cloud70/day9\nprintf "# DB 복구 절차\\n1. ls -t ~/backup/cloud70-*.sql.gz | head -1\\n2. set -a; . ./.env; set +a\\n3. zcat 백업 | docker compose exec -T db mariadb -uroot -p... cloud70\\n\\n사고 전 %s → 사고 후 %s → 복구 후 %s\\n" "$before" "$after" "$restored" > ~/cloud70/day9/restore.md\ncat ~/cloud70/day9/restore.md',
          check: 'f=/home/student/cloud70/day9/restore.md; [ -s $f ] && grep -q zcat $f && grep -q "사고 전" $f && grep -q "복구 후" $f && n=$(curl -s -m 3 localhost 2>/dev/null | sed -n "s/.*방문 \\([0-9]*\\)번째.*/\\1/p") && [ -n "$n" ] && [ "$n" -ge 3 ]',
          checkOk: '복구 훈련을 마쳤습니다. 이제 이 백업은 "믿을 수 있는 백업" 입니다.',
          checkFail: 'restore.md 에 zcat 을 쓴 복구 명령과 사고 전 · 복구 후 숫자가 있는지, <code>curl -s localhost</code> 의 방문 수가 3 이상인지 확인하세요.'
        }
      ],
      quiz: [
        { q: '복구 직후 방문 수가 "사고 전 숫자 + 1" 인 이유는?', options: ['버그', '백업 시점 데이터로 돌아간 뒤 확인용 curl 이 1번 더 기록해서', '자동 증가 설정', 'Caddy 캐시'], answer: 1, explain: '복구가 정확히 된 증거입니다.' },
        { q: '백업 파일이 있어도 복구 훈련을 하는 이유는?', options: ['재미', '백업이 실제로 복구 가능한지, 절차를 아는지 확인하려고', '디스크 정리', '요금 절약'], answer: 1, explain: '복구해 보지 않은 백업은 믿을 수 없습니다.' },
        { q: '복구 명령에서 zcat 의 역할은?', options: ['압축', 'gzip 파일을 풀어서 출력', '파일 삭제', '권한 변경'], answer: 1, explain: '풀린 SQL 이 파이프로 mariadb 에 들어갑니다.' }
      ],
      slides: [
        { layout: 'title', title: '복구 훈련', subtitle: '복구해 봐야 백업이다', notes: '<p>학생들이 직접 down -v 를 치게 해서 긴장감을 줍니다.</p>' },
        { layout: 'code', title: '사고 → 복구', code: 'docker compose down -v && docker compose up -d\nset -a; . ./.env; set +a\nf=$(ls -t ~/backup/cloud70-*.sql.gz | head -1)\nzcat "$f" | docker compose exec -T db \\\n  mariadb -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME"', points: ['숫자 비교로 확인', '절차서로 남기기'], notes: '' },
        { layout: 'practice', title: '실습 9-2', bullets: ['사고 전 숫자 기록', 'down -v', '복구 · 확인', 'restore.md'], notes: '' },
        { layout: 'summary', title: '정리', bullets: ['사고 재현', '최근 백업으로 복구', '절차서'], notes: '<p>오후: 서버 없이 쓰는 클라우드.</p>' }
      ]
    },
    // =====================================================================
    {
      id: 'day09-3',
      title: '객체 스토리지와 서버리스 — Cloud Storage · Cloud Run',
      minutes: 220,
      goals: [
        '버킷을 만들고 파일을 올린 뒤 공개 / 비공개 접근 차이를 확인한다',
        'Cloud Run 에 소스로 배포하고 포트 설정 오류를 해결한다',
        'VM · 객체 스토리지 · 서버리스를 비교한다',
        '사용한 리소스를 남김없이 정리한다'
      ],
      flow: [['서버 없는 클라우드', 20], ['Cloud Storage', 50], ['Cloud Run', 70], ['비교', 30], ['정리', 30], ['마무리', 20]],
      content: [
        { type: 'table', head: ['방식', '내가 관리', '요금', '예'], rows: [['VM (IaaS)', 'OS · 방화벽 · 업데이트 · 앱 전부', '켜져 있는 시간', '6~8일차 Oracle 서버'], ['객체 스토리지', '파일만', '저장 용량 + 전송량', 'S3 (3일차), Cloud Storage'], ['서버리스 (Cloud Run)', '앱 코드(컨테이너)만', '요청이 있을 때만', '오늘']] },
        { type: 'callout', kind: 'vm', title: '실제 콘솔 준비 — Cloud Shell 추천', html: '<p>5일차 프로젝트에서 오른쪽 위 <b>Cloud Shell</b> 아이콘을 누르면 gcloud 가 설치된 터미널이 열립니다. 아래 명령을 그대로 쓸 수 있습니다. 무료 사용량: Cloud Storage 5GB(미국 3개 리전), Cloud Run 월 200만 요청.</p>' },
        { type: 'h', text: 'Cloud Storage — 파일 맡기기' },
        { type: 'cmd', title: '버킷 만들고 올리기', code: 'gcloud storage buckets create gs://cloud70-hong-assets --location us-central1\necho \'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><circle cx="40" cy="40" r="30" fill="#e95420"/></svg>\' > logo.svg\ngcloud storage cp logo.svg gs://cloud70-hong-assets/\ngcloud storage ls gs://cloud70-hong-assets', desc: '버킷 이름은 <b>전 세계에서 하나</b>여야 합니다. <code>hong</code> 을 자기 이름으로 바꾸세요.' },
        { type: 'cmd', title: '공개 전 · 후', code: 'curl -s -o /dev/null -w "%{http_code}\\n" https://storage.googleapis.com/cloud70-hong-assets/logo.svg\ngcloud storage buckets add-iam-policy-binding gs://cloud70-hong-assets --member=allUsers --role=roles/storage.objectViewer\ncurl -s -o /dev/null -w "%{http_code}\\n" https://storage.googleapis.com/cloud70-hong-assets/logo.svg', desc: '403 → 200. <code>allUsers</code> 에게 읽기 권한을 주면 버킷 전체가 공개됩니다. 그래서 <b>공개용 버킷과 백업용 버킷은 반드시 나눕니다</b>.' },
        { type: 'callout', kind: 'warn', title: '백업은 비공개 버킷에', html: '<p>DB 백업을 공개 버킷에 올리면 누구나 내려받을 수 있습니다. 백업용은 공개 설정 없이 별도 버킷(<code>gs://cloud70-hong-backup</code>)을 만들어 <code>gcloud storage cp ~/backup/*.gz gs://cloud70-hong-backup/</code> 처럼 씁니다.</p>' },
        { type: 'h', text: 'Cloud Run — 컨테이너를 서버 없이' },
        { type: 'cmd', title: '준비: API 켜기와 앱', code: 'gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com\nmkdir -p ~/runapp && cd ~/runapp\nprintf \'from flask import Flask\\napp = Flask(__name__)\\n\\n@app.route("/")\\ndef home():\\n    return "<h1>Hello from Cloud Run</h1>"\\n\' > app.py\nprintf \'flask==3.0.3\\ngunicorn==22.0.0\\n\' > requirements.txt\ncp ~/myweb/Dockerfile . 2>/dev/null || printf \'FROM python:3.12-slim\\nWORKDIR /app\\nCOPY requirements.txt .\\nRUN pip install --no-cache-dir -r requirements.txt\\nCOPY app.py .\\nCMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]\\n\' > Dockerfile\ncat Dockerfile', desc: '7일차와 같은 Dockerfile — 앱은 <b>5000</b>번에서 기다립니다.' },
        { type: 'cmd', title: '첫 배포 — 실패해 봅니다', code: 'cd ~/runapp\ngcloud run deploy hello --source . --region us-central1 --allow-unauthenticated', desc: 'Cloud Run 은 기본으로 <b>8080</b> 번에 요청을 보냅니다(<code>PORT=8080</code>). 앱이 5000 에서 기다리니 "failed to start and listen on the port" 오류가 납니다.' },
        { type: 'cmd', title: '포트를 알려 주고 다시', code: 'gcloud run deploy hello --source . --region us-central1 --allow-unauthenticated --port 5000\nu=$(gcloud run services describe hello --region us-central1 --format="value(status.url)")\necho "$u"\ncurl -s "$u"; echo', desc: '<code>https://</code> 주소와 인증서가 자동으로 붙습니다. 요청이 없으면 컨테이너가 0개로 줄어 요금이 들지 않습니다.' },
        { type: 'table', head: ['', '내 VM (Oracle)', 'Cloud Run'], rows: [['HTTPS', 'DuckDNS + Caddy 직접', '자동'], ['방화벽 · OS 업데이트', '직접', '필요 없음'], ['DB', '같은 서버에 MariaDB', '별도 서비스 필요 (Cloud SQL 등, 유료)'], ['요청이 없을 때', '계속 켜져 있음', '0 → 첫 요청이 조금 느림(콜드 스타트)'], ['어울리는 것', '항상 켜 둘 서비스, 학습', 'API, 가끔 쓰는 도구, 트래픽 변동']] },
        { type: 'h', text: '남김없이 정리' },
        { type: 'cmd', title: '정리 — 빠뜨리기 쉬운 저장소까지', code: 'gcloud run services delete hello --region us-central1 --quiet\ngcloud artifacts repositories list\ngcloud artifacts repositories delete cloud-run-source-deploy --location us-central1 --quiet\ngcloud storage rm -r gs://cloud70-hong-assets\ngcloud run services list; gcloud storage buckets list; gcloud artifacts repositories list', desc: '<code>--source</code> 배포는 이미지를 <b>Artifact Registry</b> 에 저장합니다. 서비스를 지워도 이미지는 남아 저장 요금이 생길 수 있으니 저장소까지 지웁니다. 세 목록이 모두 비면 끝.' }
      ],
      practice: [
        {
          title: '실습 9-3. 공개 이미지가 있는 버킷',
          level: 2,
          desc: '<p>Cloud Storage 버킷을 <b>무료 리전</b>(us-west1 · us-central1 · us-east1)에 만들고 <code>logo.svg</code> 를 올려 <b>공개</b>하세요. <code>https://storage.googleapis.com/버킷/logo.svg</code> 가 200 이어야 합니다.</p>',
          hint: 'buckets create → cp → add-iam-policy-binding (allUsers · objectViewer)',
          solution: 'gcloud storage buckets create gs://cloud70-hong-assets --location us-central1\necho \'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><circle cx="40" cy="40" r="30" fill="#e95420"/></svg>\' > logo.svg\ngcloud storage cp logo.svg gs://cloud70-hong-assets/\ngcloud storage buckets add-iam-policy-binding gs://cloud70-hong-assets --member=allUsers --role=roles/storage.objectViewer',
          check: 'ok=0; for b in $(gcloud storage buckets list --format="value(name)" 2>/dev/null); do loc=$(gcloud storage buckets describe gs://$b 2>/dev/null | awk "/^location:/{print tolower(\\$2)}"); case "$loc" in us-west1|us-central1|us-east1) [ "$(curl -s -o /dev/null -w "%{http_code}" https://storage.googleapis.com/$b/logo.svg)" = 200 ] && ok=1;; esac; done; [ $ok = 1 ]',
          checkOk: '공개 이미지 버킷이 준비되었습니다. (정리 단계에서 지웁니다)',
          checkFail: '<code>gcloud storage buckets list</code> 의 LOCATION 이 무료 리전인지, <code>curl -s -o /dev/null -w "%{http_code}" https://storage.googleapis.com/버킷/logo.svg</code> 가 200 인지 확인하세요.'
        },
        {
          title: '실습 9-4. Cloud Run 배포',
          level: 2,
          desc: '<p><code>hello</code> 서비스를 Cloud Run 에 배포해 서비스 URL 에서 <code>Hello from Cloud Run</code> 이 보이게 하세요.</p>',
          hint: 'API 3개 켜기 → <code>--port 5000</code> 을 붙여 배포',
          solution: 'gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com\nmkdir -p ~/runapp && cd ~/runapp\nprintf \'from flask import Flask\\napp = Flask(__name__)\\n\\n@app.route("/")\\ndef home():\\n    return "<h1>Hello from Cloud Run</h1>"\\n\' > app.py\nprintf \'flask==3.0.3\\ngunicorn==22.0.0\\n\' > requirements.txt\nprintf \'FROM python:3.12-slim\\nWORKDIR /app\\nCOPY requirements.txt .\\nRUN pip install --no-cache-dir -r requirements.txt\\nCOPY app.py .\\nCMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]\\n\' > Dockerfile\ngcloud run deploy hello --source . --region us-central1 --allow-unauthenticated --port 5000',
          check: 'u=$(gcloud run services describe hello --region us-central1 --format="value(status.url)" 2>/dev/null) && [ -n "$u" ] && curl -s -m 3 "$u" | grep -q "Hello from Cloud Run"',
          checkOk: '서버 없이 HTTPS 서비스가 열렸습니다.',
          checkFail: '<code>gcloud run services list</code> 와 서비스 URL 의 curl 결과를 확인하세요. 포트 오류면 <code>--port 5000</code>.'
        },
        {
          title: '실습 9-5. 남김없이 정리',
          level: 1,
          desc: '<p>Cloud Run 서비스, Artifact Registry 저장소, Cloud Storage 버킷을 모두 지워 세 목록이 비게 하세요.</p>',
          hint: 'run services delete → artifacts repositories delete → storage rm -r',
          solution: 'gcloud run services delete hello --region us-central1 --quiet 2>/dev/null\ngcloud artifacts repositories delete cloud-run-source-deploy --location us-central1 --quiet 2>/dev/null\nfor b in $(gcloud storage buckets list --format="value(name)"); do gcloud storage rm -r gs://$b; done\ngcloud run services list; gcloud storage buckets list; gcloud artifacts repositories list',
          check: '[ -z "$(gcloud run services list --format="value(metadata.name)" 2>/dev/null)" ] && [ -z "$(gcloud storage buckets list --format="value(name)" 2>/dev/null)" ] && [ -z "$(gcloud artifacts repositories list --format="value(name)" 2>/dev/null)" ]',
          checkOk: '깨끗합니다. 요금이 나올 것이 남지 않았습니다.',
          checkFail: '세 목록 중 남은 것이 있습니다: <code>gcloud run services list</code>, <code>gcloud storage buckets list</code>, <code>gcloud artifacts repositories list</code>'
        }
      ],
      quiz: [
        { q: 'Cloud Run 배포 시 "failed to start and listen on the port" 오류의 흔한 원인은?', options: ['버킷이 없어서', '앱이 기다리는 포트와 Cloud Run 의 PORT(기본 8080)가 달라서', 'DNS', 'API 키'], answer: 1, explain: '--port 로 앱의 포트를 알려 주거나 앱이 $PORT 를 쓰게 합니다.' },
        { q: '서비스를 지운 뒤에도 요금이 남을 수 있는 것은?', options: ['Cloud Shell', 'Artifact Registry 의 이미지', 'IAM 역할', '프로젝트 이름'], answer: 1, explain: '--source 배포가 만든 저장소를 함께 지웁니다.' },
        { q: '<code>allUsers</code> 에 objectViewer 를 준 버킷에 두면 <b>안 되는</b> 것은?', options: ['웹사이트 이미지', '공개 문서', 'DB 백업 파일', 'CSS 파일'], answer: 2, explain: '버킷 전체가 공개됩니다. 백업은 비공개 버킷에.' }
      ],
      slides: [
        { layout: 'title', title: '서버 없는 클라우드', subtitle: 'Cloud Storage · Cloud Run', notes: '' },
        { layout: 'table', title: '세 가지 방식', head: ['방식', '내가 관리', '요금'], rows: [['VM', '전부', '켜진 시간'], ['객체 스토리지', '파일', '용량 + 전송'], ['서버리스', '코드', '요청 시만']], notes: '' },
        { layout: 'code', title: 'Cloud Run 한 줄', code: 'gcloud run deploy hello --source . \\\n  --region us-central1 \\\n  --allow-unauthenticated --port 5000', points: ['기본 PORT=8080', 'HTTPS 자동'], notes: '<p>먼저 --port 없이 실패를 보여 줍니다.</p>' },
        { layout: 'two', title: 'VM vs Cloud Run', left: { title: 'Oracle VM', bullets: ['HTTPS · 방화벽 직접', 'DB 같이 운영', '항상 켜짐'] }, right: { title: 'Cloud Run', bullets: ['HTTPS 자동', 'DB 는 별도', '요청 없으면 0'] }, notes: '' },
        { layout: 'summary', title: '9일차 정리', bullets: ['백업 자동화 + 복구 훈련', '공개 / 비공개 버킷', '서버리스 배포와 정리'], notes: '<p>내일: 보안 점검과 최종 정리.</p>' }
      ]
    }
  ]
});
