UBUNTU_COURSE.addChapter({
  id: 'day10',
  no: '10',
  icon: '🛡️',
  title: '보안 · 비용 · 마무리',
  subtitle: 'SSH 잠그기, 열린 문 점검, 요금 0원 확인, 운영 문서',
  summary: '마지막 날입니다. 열흘 동안 키운 서버를 <b>공격자의 눈</b>으로 다시 봅니다. SSH 비밀번호 로그인을 끄고 fail2ban 을 켜고, 바깥에서 실제로 열린 포트를 확인해 필요 없는 문을 닫습니다. 3대 클라우드에 남은 리소스가 없는지 CLI 로 확인해 <b>요금 0원</b>을 확정하고, 서비스 README 와 최종 백업으로 과정을 마무리합니다.',
  goals: [
    'sshd 의 실제 적용값을 확인하고 비밀번호 · root 로그인을 끈다',
    'fail2ban 으로 무차별 대입 공격을 차단한다',
    '바깥에서 열린 포트를 점검해 22 · 80 · 443 만 남긴다',
    '3대 클라우드에 요금이 나올 리소스가 없음을 확인한다',
    '서비스 운영 문서(README)와 최종 백업을 남긴다'
  ],
  sections: [
    // =====================================================================
    {
      id: 'day10-1',
      title: 'SSH 잠그기와 fail2ban',
      minutes: 130,
      goals: [
        'sshd -T 로 "실제로 적용된" 설정을 읽는다',
        'sshd_config.d 파일의 읽는 순서(먼저 나온 값이 이김)를 이해한다',
        'fail2ban 을 설치하고 sshd 감옥 상태를 읽는다',
        '내 서버의 계정 · 로그인 기록을 점검한다'
      ],
      flow: [['공격은 매일 온다', 15], ['sshd 설정', 45], ['fail2ban', 30], ['계정 점검', 25], ['정리', 15]],
      content: [
        { type: 'callout', kind: 'vm', title: '실제 서버에서 먼저 보기', html: '<p>공인 IP 를 가진 서버는 만든 지 몇 분 만에 SSH 무차별 대입 공격을 받습니다. 실제 Oracle 서버에서 확인해 보세요.</p><pre>sudo grep -c "Invalid user" /var/log/auth.log\nsudo grep "Invalid user" /var/log/auth.log | awk \'{print $(NF-2)}\' | sort | uniq -c | sort -rn | head</pre><p>admin · test · oracle · ubuntu 같은 흔한 아이디로 수백 번 시도한 흔적이 보입니다.</p>' },
        { type: 'cmd', title: '지금 실제로 적용된 값', code: 'sudo sshd -T | grep -E "^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication|pubkeyauthentication)"\nls /etc/ssh/sshd_config.d/', desc: '<code>sshd -T</code> 는 모든 설정 파일을 합친 <b>최종값</b>을 보여 줍니다. 파일만 읽고 판단하면 틀리기 쉽습니다.' },
        { type: 'cmd', title: '함정 — 99 번 파일은 이기지 못한다', code: 'printf "PasswordAuthentication no\\nPermitRootLogin no\\n" | sudo tee /etc/ssh/sshd_config.d/99-cloud70.conf\nsudo sshd -T | grep -E "^(passwordauthentication|permitrootlogin)"\nsudo grep -ri passwordauthentication /etc/ssh/sshd_config.d/', desc: 'permitrootlogin 은 no 가 되었는데 passwordauthentication 은 여전히 <b>yes</b>! sshd 는 같은 설정이 여러 번 나오면 <b>먼저 읽은 값</b>을 씁니다. <code>sshd_config.d</code> 는 이름순으로 읽으므로 <code>50-cloud-init.conf</code> 의 yes 가 <code>99-</code> 보다 먼저입니다.' },
        { type: 'cmd', title: '해결 — 맨 앞에 오는 이름으로', code: 'sudo mv /etc/ssh/sshd_config.d/99-cloud70.conf /etc/ssh/sshd_config.d/01-cloud70.conf\nprintf "KbdInteractiveAuthentication no\\n" | sudo tee -a /etc/ssh/sshd_config.d/01-cloud70.conf\nsudo sshd -t && sudo systemctl reload ssh\nsudo sshd -T | grep -E "^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication)"', desc: '<code>sshd -t</code>(소문자)는 문법 검사입니다. 통과할 때만 reload 합니다.' },
        { type: 'callout', kind: 'warn', title: '잠그기 전에 — 열린 창 하나는 그대로', html: '<p>실제 서버에서 SSH 설정을 바꿀 때는 <b>지금 접속한 창을 닫지 말고</b>, 새 창에서 <code>ssh oracle</code> 로 다시 접속되는지 확인한 뒤에 닫습니다. 잘못 잠가도 열린 창으로 되돌릴 수 있습니다. 완전히 잠겼다면 OCI 콘솔의 <b>클라우드 셸 연결(Console connection)</b>이 마지막 방법입니다.</p>' },
        { type: 'cmd', title: '비밀번호로는 이제 안 됩니다', code: 'ssh -o BatchMode=yes -o PreferredAuthentications=password student@localhost true; echo "종료 코드 $?"', desc: '<code>Permission denied (publickey)</code> — 키가 있는 사람만 들어올 수 있습니다.' },
        { type: 'h', text: 'fail2ban — 계속 틀리면 차단' },
        { type: 'cmd', title: '설치와 상태', code: 'sudo apt install -y fail2ban\nsystemctl is-active fail2ban\nsudo fail2ban-client status\nsudo fail2ban-client status sshd', desc: 'Ubuntu 의 fail2ban 은 설치만 해도 sshd 감옥이 켜집니다. 기본값은 10분 안에 5번 실패하면 10분 차단입니다.' },
        { type: 'file', path: '/etc/fail2ban/jail.local', title: '조금 더 엄하게 (선택)', code: '[sshd]\nenabled = true\nmaxretry = 5\nfindtime = 10m\nbantime = 1h', desc: '<code>jail.conf</code> 는 업데이트 때 덮어써지므로 바꿀 값은 <code>jail.local</code> 에 씁니다. 저장 후 <code>sudo systemctl restart fail2ban</code>.' },
        { type: 'h', text: '계정 점검' },
        { type: 'cmd', title: '누가 들어올 수 있나', code: 'awk -F: \'$3>=1000 && $3<65534 {print $1, $7}\' /etc/passwd\ngetent group sudo docker\ncat ~/.ssh/authorized_keys | awk \'{print $1, $3}\'\nlast -n 5', desc: '모르는 사용자 · 모르는 공개키 · 모르는 접속 기록이 없는지 봅니다. 실습 중 만든 연습용 키나 계정이 남아 있다면 지웁니다.' }
      ],
      practice: [
        {
          title: '실습 10-1. SSH 잠그기',
          level: 2,
          desc: '<p>sshd 의 <b>최종값</b>이 <code>passwordauthentication no</code>, <code>permitrootlogin no</code> 가 되게 하고, fail2ban 을 설치해 켜세요.</p>',
          hint: '설정 파일 이름은 <code>01-</code> 로 시작. <code>sudo sshd -T</code> 로 확인.',
          solution: 'printf "PasswordAuthentication no\\nPermitRootLogin no\\nKbdInteractiveAuthentication no\\n" | sudo tee /etc/ssh/sshd_config.d/01-cloud70.conf\nsudo sshd -t && sudo systemctl reload ssh\nsudo apt install -y fail2ban\nsudo sshd -T | grep -E "^(passwordauthentication|permitrootlogin)"',
          check: 'sshd -T 2>/dev/null | grep -qx "passwordauthentication no" && sshd -T 2>/dev/null | grep -qx "permitrootlogin no" && systemctl is-active --quiet fail2ban',
          checkOk: '키 없이는 들어올 수 없고, 두드리는 손은 차단됩니다.',
          checkFail: '<code>sudo sshd -T | grep -E "^(passwordauth|permitroot)"</code> 결과와 <code>systemctl is-active fail2ban</code> 을 확인하세요. 99- 파일이면 50-cloud-init 에 집니다.'
        }
      ],
      quiz: [
        { q: 'sshd_config.d 에 같은 설정이 두 파일에 있다면 적용되는 값은?', options: ['나중 파일', '먼저 읽은 파일 (이름순 앞)', '둘 다 무시', '무작위'], answer: 1, explain: 'sshd 는 처음 얻은 값을 씁니다. 그래서 01- 같은 이름을 씁니다.' },
        { q: '<code>sshd -t</code> 와 <code>sshd -T</code> 의 차이는?', options: ['같다', '-t 는 문법 검사, -T 는 최종 적용값 출력', '-t 는 재시작', '-T 는 테스트 접속'], answer: 1, explain: '바꾸기 전엔 -t, 바꾼 뒤엔 -T 로 확인합니다.' },
        { q: 'SSH 설정을 바꾼 뒤 지금 접속 창을 닫기 전에 할 일은?', options: ['서버 재부팅', '새 창으로 다시 접속되는지 확인', 'fail2ban 삭제', '공개키 삭제'], answer: 1, explain: '잠겨 버리는 사고를 막는 습관입니다.' }
      ],
      slides: [
        { layout: 'title', title: 'SSH 잠그기', subtitle: '공격은 매일 온다', notes: '<p>실제 서버의 auth.log 공격 횟수를 학생들과 비교합니다.</p>' },
        { layout: 'code', title: '최종값을 본다', code: 'sudo sshd -T | grep -E "^(passwordauth|permitroot)"\nprintf "PasswordAuthentication no\\nPermitRootLogin no\\n" | sudo tee /etc/ssh/sshd_config.d/01-cloud70.conf\nsudo sshd -t && sudo systemctl reload ssh\nsudo sshd -T | grep -E "^(passwordauth|permitroot)"', points: ['먼저 읽은 값이 이김', '-t 검사 후 reload'], notes: '<p>99- 파일로 먼저 실패를 보여 줍니다.</p>' },
        { layout: 'bullets', title: 'fail2ban · 계정', bullets: ['apt install fail2ban → sshd 감옥 자동', '설정은 jail.local', 'UID 1000 이상 사용자 · sudo · docker 그룹', 'authorized_keys · last'], notes: '' },
        { layout: 'summary', title: '정리', bullets: ['비밀번호 · root 로그인 끄기', 'fail2ban', '계정 · 키 점검'], notes: '' }
      ]
    },
    // =====================================================================
    {
      id: 'day10-2',
      title: '열린 문 점검',
      minutes: 100,
      goals: [
        '서버 안(ss)과 바깥(labclient nc) 두 시점에서 열린 포트를 비교한다',
        '실습 중 열어 둔 불필요한 규칙을 닫는다',
        'GCP 의 SSH 규칙 원본 범위를 좁힌다'
      ],
      flow: [['안에서 보기', 20], ['바깥에서 보기', 25], ['닫기', 30], ['보고서', 25]],
      content: [
        { type: 'cmd', title: '안에서 — 누가 어디서 기다리나', code: 'sudo ss -tlnp', desc: '<code>127.0.0.x</code> 는 서버 안에서만, <code>0.0.0.0</code> · <code>[::]</code> 는 모든 곳에서 받는 포트입니다. 3306(DB) · 5000(앱)이 0.0.0.0 에 있으면 위험 신호입니다.' },
        { type: 'cmd', title: '바깥에서 — 공격자가 보는 것', code: 'for p in 22 80 443 3306 5000 8000 8080; do labclient nc -zv -w 2 203.0.113.25 $p 2>&1 | tail -1; done', desc: '<code>succeeded</code> 는 22 · 80 · 443 만이어야 합니다. 실제 서버라면 내 PC 에서 <code>nc -zv 공인IP 포트</code> 로 같은 점검을 합니다.' },
        { type: 'cmd', title: '남은 실습 규칙 찾아 닫기', code: 'seclist show\nsudo iptables -L INPUT -n --line-numbers\n# 예: 8000 이 남아 있다면\nseclist del 8000\nsudo iptables -D INPUT -m state --state NEW -p tcp --dport 8000 -j ACCEPT\nsudo netfilter-persistent save', desc: '열었던 문은 기억해서 닫아야 합니다. 바꾼 iptables 는 저장까지.' },
        { type: 'cmd', title: '(연습) GCP — SSH 를 아무나 두드리지 못하게', code: 'gcloud compute firewall-rules list --format="table(name,sourceRanges.list())"\ngcloud compute firewall-rules update default-allow-ssh --source-ranges=35.235.240.0/20,203.0.113.7/32\ngcloud compute firewall-rules list --format="table(name,sourceRanges.list())"', desc: '<code>35.235.240.0/20</code> 은 브라우저 SSH 버튼(IAP)이 쓰는 대역, <code>203.0.113.7/32</code> 자리에는 내 PC 의 공인 IP(<code>curl ifconfig.me</code>)를 넣습니다. 집 IP 가 바뀌면 다시 고쳐야 한다는 단점이 있습니다.' },
        { type: 'table', head: ['포트', '서비스', '바깥 공개', '이유'], rows: [['22', 'SSH', '예 (키만)', '관리'], ['80', 'Caddy', '예', 'HTTPS 로 이동 · 인증서 확인'], ['443', 'Caddy', '예', '서비스'], ['3306', 'MariaDB', '<b>아니오</b>', 'Compose 내부망만'], ['5000', 'Flask', '<b>아니오</b>', 'Caddy 뒤에서만']] }
      ],
      practice: [
        {
          title: '실습 10-2. 포트 점검 보고서',
          level: 2,
          desc: '<p>보안 목록에 22 · 80 · 443 외의 TCP 포트가 남지 않게 정리하고, 바깥에서 22 · 80 · 443 · 3306 · 5000 을 점검한 결과를 <code>~/cloud70/day10/ports.md</code> 에 기록하세요. 기록에는 succeeded 와 timed out 이 모두 있어야 합니다.</p>',
          hint: '<code>for p in 22 80 443 3306 5000; do labclient nc -zv -w 2 203.0.113.25 $p 2>&1 | tail -1; done >> ~/cloud70/day10/ports.md</code>',
          solution: 'c70-ready stack >/dev/null\nfor p in $(seclist show | awk \'$3=="TCP"{print $4}\'); do case $p in 22|80|443) ;; *) seclist del $p ;; esac; done\nmkdir -p ~/cloud70/day10\necho "# 포트 점검 $(date +%F)" > ~/cloud70/day10/ports.md\nfor p in 22 80 443 3306 5000; do labclient nc -zv -w 2 203.0.113.25 $p 2>&1 | tail -1; done >> ~/cloud70/day10/ports.md\ncat ~/cloud70/day10/ports.md',
          check: 'f=/home/student/cloud70/day10/ports.md; grep -q succeeded $f && grep -q "timed out" $f && grep -q 3306 $f && [ -z "$(seclist show | awk \'$3=="TCP" && $4!="22" && $4!="80" && $4!="443"\')" ]',
          checkOk: '공격자가 볼 수 있는 문은 22 · 80 · 443 뿐입니다.',
          checkFail: '<code>seclist show</code> 에 다른 TCP 포트가 남았는지, ports.md 에 점검 결과가 있는지 확인하세요.'
        }
      ],
      quiz: [
        { q: '<code>ss -tlnp</code> 에서 <code>127.0.0.1:5000</code> 의 의미는?', options: ['인터넷에 공개', '서버 안에서만 접속 가능', '포트가 닫힘', 'IPv6 전용'], answer: 1, explain: '루프백 주소에만 연결되어 있습니다.' },
        { q: '바깥 점검에서 3306 이 succeeded 로 나왔다. 해야 할 일은?', options: ['그대로 둔다', 'DB 포트 공개를 막는다 (ports 삭제 · 보안 목록 닫기)', 'fail2ban 재시작', 'DNS 변경'], answer: 1, explain: 'DB 는 앱만 접근하면 됩니다.' },
        { q: 'GCP default-allow-ssh 원본 범위를 좁힐 때의 단점은?', options: ['요금 증가', '내 IP 가 바뀌면 다시 고쳐야 한다', 'HTTPS 가 꺼진다', '키가 지워진다'], answer: 1, explain: '가정용 인터넷 IP 는 바뀔 수 있습니다.' }
      ],
      slides: [
        { layout: 'title', title: '열린 문 점검', subtitle: '안에서 ss, 바깥에서 nc', notes: '' },
        { layout: 'table', title: '남겨야 할 문', head: ['포트', '공개'], rows: [['22', '키만'], ['80 · 443', '예'], ['3306 · 5000', '아니오']], notes: '' },
        { layout: 'code', title: '점검 한 줄', code: 'for p in 22 80 443 3306 5000; do\n  labclient nc -zv -w 2 203.0.113.25 $p 2>&1 | tail -1\ndone', points: ['succeeded 는 3개만', '열었던 건 닫고 저장'], notes: '' },
        { layout: 'summary', title: '정리', bullets: ['안 · 밖 두 시점', '실습 규칙 정리', 'SSH 원본 좁히기'], notes: '' }
      ]
    },
    // =====================================================================
    {
      id: 'day10-3',
      title: '요금 0원 확인과 마무리',
      minutes: 190,
      goals: [
        'aws · az · gcloud 로 남은 리소스를 점검하고 정리한다',
        '서비스 README 와 .gitignore 를 작성한다',
        '최종 백업을 다른 곳에 보관하고 과정을 회고한다'
      ],
      flow: [['3사 리소스 점검', 50], ['비용 화면 확인', 20], ['README', 50], ['최종 백업', 30], ['회고 · 발표', 40]],
      content: [
        { type: 'table', head: ['클라우드', '남겨도 되는 것', '반드시 지울 것'], rows: [['AWS', '— (크레딧 기간이 끝나면 유료)', 'EC2 · EBS 볼륨 · 탄력적 IP · S3 버킷'], ['Azure', '—', '리소스 그룹(통째로)'], ['Google Cloud', '중지된 e2-micro (무료 조건)', 'Cloud Run · Artifact Registry · 버킷 · 무료 조건 밖 VM'], ['Oracle', 'Always Free 서버 (계속 사용)', 'Always Free 표시가 없는 리소스']] },
        { type: 'cmd', title: '(연습) 3사 점검 — 빈 목록이 정답', code: 'aws ec2 describe-instances --query "Reservations[].Instances[?State.Name!=\'terminated\'].[InstanceId,State.Name]" --output text\naws ec2 describe-volumes --query "Volumes[].VolumeId" --output text\naws ec2 describe-addresses --query "Addresses[].PublicIp" --output text\naws s3 ls\naz group list -o table\ngcloud compute instances list\ngcloud run services list\ngcloud storage buckets list\ngcloud artifacts repositories list', desc: '가상 서버에서 3~9일차에 만든 것이 남아 있다면 여기서 지웁니다(3일차 실습 3-5, 4일차 4-4, 9일차 9-5 참고). 실제 계정에서도 같은 명령을 각 Cloud Shell 에서 실행합니다.' },
        { type: 'file', path: '~/cloud70/day10/cleanup-check.sh', mode: '700', title: '한 번에 세어 보는 스크립트', code: '#!/bin/bash\nn_ec2=$(aws ec2 describe-instances --query "Reservations[].Instances[?State.Name!=\'terminated\'].InstanceId" --output text 2>/dev/null | wc -w)\nn_s3=$(aws s3 ls 2>/dev/null | wc -l)\nn_az=$(az group list --query "[].name" -o tsv 2>/dev/null | wc -l)\nn_run=$(gcloud run services list --format="value(metadata.name)" 2>/dev/null | wc -l)\nn_gcs=$(gcloud storage buckets list --format="value(name)" 2>/dev/null | wc -l)\necho "AWS EC2 $n_ec2 · S3 $n_s3 | Azure RG $n_az | GCP Run $n_run · GCS $n_gcs"\n[ $((n_ec2 + n_s3 + n_az + n_run + n_gcs)) -eq 0 ] && echo "✔ 요금이 나올 리소스 없음" || echo "✘ 남은 리소스를 정리하세요"', desc: '' },
        { type: 'callout', kind: 'vm', title: '실제 클라우드 — 비용 화면을 눈으로', html: '<ul><li><b>AWS</b> 결제 및 비용 관리 → 프리 티어 · 크레딧 잔액 / <b>Azure</b> 비용 관리 → 비용 분석 / <b>Google</b> 결제 → 보고서 / <b>Oracle</b> 청구 및 비용 관리 → 비용 분석</li><li>오늘 날짜 비용이 0 인지, 1~2일 뒤에 한 번 더 확인합니다.</li><li>더 쓰지 않을 클라우드는 <b>계정 해지</b>(AWS 계정 닫기 · Azure 구독 취소 · Google 프로젝트 종료)까지 하면 가장 안전합니다.</li></ul>' },
        { type: 'h', text: '운영 문서 — 미래의 나를 위한 README' },
        { type: 'file', path: '~/stack/README.md', title: '서비스 README (예)', code: '# 홍길동의 클라우드 서비스\n\n- 주소: https://hong70.duckdns.org\n- 서버: Oracle Cloud Always Free A1.Flex (2 OCPU / 12GB), Ubuntu 24.04\n- 구성: Caddy(HTTPS) → Flask(web) → MariaDB(db) — Docker Compose\n\n## 실행\n    cd ~/stack\n    docker compose up -d\n    docker compose ps\n\n## 업데이트\n    docker compose up -d --build\n\n## 백업 / 복구\n- 매일 03:00 ~/backup.sh → ~/backup/cloud70-날짜.sql.gz (7일 보관)\n- 복구: zcat 백업 | docker compose exec -T db mariadb -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME"\n\n## 보안\n- 열린 포트: 22(키만) · 80 · 443\n- SSH 비밀번호 로그인 끔, fail2ban 사용\n- 비밀값은 .env (권한 600, 저장소에 올리지 않음)', desc: '6개월 뒤 이 서버를 다시 만지는 사람은 대부분 <b>나 자신</b>입니다.' },
        { type: 'file', path: '~/stack/.gitignore', title: '저장소에 올리지 않을 것', code: '.env\n*.sql\n*.sql.gz\n__pycache__/', desc: '이 폴더를 GitHub 에 올릴 때 비밀번호와 백업이 따라가지 않게 합니다.' },
        { type: 'cmd', title: '최종 백업과 반출', code: '~/backup.sh\nls -lh ~/backup | tail -3', desc: '' },
        { type: 'cmd', vm: true, title: '내 PC 로 가져오기', code: 'mkdir -p ~/cloud70-final\nscp "oracle:~/backup/cloud70-*.sql.gz" ~/cloud70-final/\nscp oracle:~/stack/README.md oracle:~/stack/compose.yaml oracle:~/stack/Caddyfile ~/cloud70-final/\nls -l ~/cloud70-final', desc: '6일차에 만든 <code>ssh oracle</code> 별명 덕분에 짧게 씁니다. 3-2-1 규칙의 "다른 장소" 가 생겼습니다.' },
        { type: 'callout', kind: 'tip', title: '회고 — 발표 3분', html: '<ol><li>내 서비스 주소를 휴대폰으로 열어 보여 주기 (자물쇠 포함)</li><li>가장 오래 막혔던 문제와 해결 방법 한 가지</li><li>3대 클라우드 중 다시 쓴다면 무엇을, 왜</li><li>이 서버로 다음에 해 보고 싶은 것</li></ol>' }
      ],
      practice: [
        {
          title: '실습 10-3. 요금 0원 확인',
          level: 2,
          desc: '<p><code>~/cloud70/day10/cleanup-check.sh</code>(권한 700)를 만들어 실행했을 때 <code>✔ 요금이 나올 리소스 없음</code> 이 나와야 합니다. 남은 리소스가 있으면 먼저 정리하세요.</p>',
          hint: '본문 스크립트를 그대로 만들고, ✘ 가 나오면 숫자가 0 이 아닌 항목을 지우세요.',
          solution: 'for i in $(aws ec2 describe-instances --query "Reservations[].Instances[?State.Name!=\'terminated\'].InstanceId" --output text 2>/dev/null); do aws ec2 terminate-instances --instance-ids $i >/dev/null; done\nfor b in $(aws s3 ls 2>/dev/null | awk \'{print $3}\'); do aws s3 rb s3://$b --force; done\nfor g in $(az group list --query "[].name" -o tsv 2>/dev/null); do az group delete -n $g --yes; done\nfor s in $(gcloud run services list --format="value(metadata.name)" 2>/dev/null); do gcloud run services delete $s --region us-central1 --quiet; done\nfor b in $(gcloud storage buckets list --format="value(name)" 2>/dev/null); do gcloud storage rm -r gs://$b; done\nmkdir -p ~/cloud70/day10\ncat > ~/cloud70/day10/cleanup-check.sh <<\'EOF\'\n#!/bin/bash\nn_ec2=$(aws ec2 describe-instances --query "Reservations[].Instances[?State.Name!=\'terminated\'].InstanceId" --output text 2>/dev/null | wc -w)\nn_s3=$(aws s3 ls 2>/dev/null | wc -l)\nn_az=$(az group list --query "[].name" -o tsv 2>/dev/null | wc -l)\nn_run=$(gcloud run services list --format="value(metadata.name)" 2>/dev/null | wc -l)\nn_gcs=$(gcloud storage buckets list --format="value(name)" 2>/dev/null | wc -l)\necho "AWS EC2 $n_ec2 · S3 $n_s3 | Azure RG $n_az | GCP Run $n_run · GCS $n_gcs"\n[ $((n_ec2 + n_s3 + n_az + n_run + n_gcs)) -eq 0 ] && echo "✔ 요금이 나올 리소스 없음" || echo "✘ 남은 리소스를 정리하세요"\nEOF\nchmod 700 ~/cloud70/day10/cleanup-check.sh\n~/cloud70/day10/cleanup-check.sh',
          check: 'f=/home/student/cloud70/day10/cleanup-check.sh; [ "$(stat -c %a $f 2>/dev/null)" = 700 ] && su - student -c "$f" 2>/dev/null | grep -q "✔ 요금이 나올 리소스 없음"',
          checkOk: '3대 클라우드 모두 요금이 나올 리소스가 없습니다.',
          checkFail: '<code>~/cloud70/day10/cleanup-check.sh</code> 를 실행해 0 이 아닌 항목을 정리하세요. 권한은 700.'
        },
        {
          title: '실습 10-4. README 와 최종 백업',
          level: 1,
          desc: '<p><code>~/stack/README.md</code> 에 <b>실행 · 백업 · 보안</b> 항목을 쓰고, <code>~/stack/.gitignore</code> 에 <code>.env</code> 를 넣고, 오늘 날짜의 백업 파일을 하나 만드세요.</p>',
          hint: 'README 는 본문 예시를 자기 서비스에 맞게. 백업은 <code>~/backup.sh</code>.',
          solution: 'c70-ready stack >/dev/null\ncd ~/stack\ncat > README.md <<\'EOF\'\n# 홍길동의 클라우드 서비스\n- 구성: Caddy → Flask → MariaDB (Docker Compose)\n## 실행\ndocker compose up -d\n## 백업\n매일 03:00 ~/backup.sh\n## 보안\n열린 포트 22 · 80 · 443, SSH 키 로그인만\nEOF\nprintf \'.env\\n*.sql\\n*.sql.gz\\n__pycache__/\\n\' > .gitignore\nset -a; . ./.env; set +a; mkdir -p ~/backup\nsudo docker compose exec -T db mariadb-dump -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME" | gzip > ~/backup/cloud70-$(date +%F-%H%M).sql.gz\nls -l ~/backup',
          check: 'r=/home/student/stack/README.md; grep -q 실행 $r && grep -q 백업 $r && grep -q 보안 $r && grep -qx ".env" /home/student/stack/.gitignore && ls /home/student/backup/cloud70-$(date +%F)-*.sql.gz >/dev/null 2>&1',
          checkOk: '열흘 과정을 완주했습니다. 수고하셨습니다! 🎉',
          checkFail: 'README 의 세 항목, .gitignore 의 .env 줄, <code>ls ~/backup</code> 에 오늘 날짜 파일이 있는지 확인하세요.'
        }
      ],
      quiz: [
        { q: 'Google Cloud 에 남겨 둬도 요금이 나오지 않는 것은?', options: ['Cloud Run 이미지 저장소', '무료 조건을 지킨 중지된 e2-micro', 'asia-northeast3 의 버킷', 'e2-small VM'], answer: 1, explain: '표준 디스크 30GB 까지는 무료입니다.' },
        { q: '.gitignore 에 .env 를 넣는 이유는?', options: ['파일이 커서', '비밀번호가 저장소에 올라가지 않게', 'Docker 오류 방지', '속도'], answer: 1, explain: '공개 저장소에 비밀번호가 올라가면 몇 분 안에 악용될 수 있습니다.' },
        { q: '이 과정에서 만든 서비스의 요청 흐름으로 옳은 것은?', options: ['브라우저 → MariaDB → Flask', '브라우저 → Caddy(443) → Flask → MariaDB', '브라우저 → Flask(5000) → Caddy', '브라우저 → Nginx → Cloud Run'], answer: 1, explain: 'Caddy 가 관문, DB 는 내부망에만 있습니다.' }
      ],
      slides: [
        { layout: 'title', title: '요금 0원 · 마무리', subtitle: '정리하고, 기록하고, 보여 주기', notes: '' },
        { layout: 'table', title: '남길 것 · 지울 것', head: ['클라우드', '남김', '지움'], rows: [['AWS', '—', 'EC2 · EBS · EIP · S3'], ['Azure', '—', '리소스 그룹'], ['GCP', '중지된 e2-micro', 'Run · 저장소 · 버킷'], ['Oracle', 'Always Free 서버', '나머지']], notes: '' },
        { layout: 'bullets', title: 'README 에 들어갈 것', bullets: ['주소 · 서버 · 구성', '실행 · 업데이트 명령', '백업 · 복구 방법', '열린 포트 · 보안 설정'], notes: '' },
        { layout: 'practice', title: '실습 10-3 · 10-4', bullets: ['cleanup-check.sh → ✔', 'README · .gitignore', '최종 백업 · 내 PC 로'], notes: '' },
        { layout: 'summary', title: '70시간을 마치며', bullets: ['클라우드 개념 · 3대 클라우드 체험', '무료 서버 한 대를 끝까지: 웹 · Docker · HTTPS · 백업 · 보안', '요금 0원으로 정리하는 습관'], notes: '<p>발표 순서를 정하고 3분씩 진행합니다.</p>' }
      ]
    }
  ]
});
