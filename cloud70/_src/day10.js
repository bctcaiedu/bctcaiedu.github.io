module.exports = {
  day: 10,
  goals: [
    'SSH 설정·열린 포트·차단 도구로 내 서버의 보안을 점검한다',
    '4개 클라우드의 비용과 남은 리소스를 확인하고 정리한다',
    '내 서비스를 다른 사람이 다시 만들 수 있게 README로 남긴다',
    '서로의 서비스에 접속해 결과를 공유한다'
  ],
  lab: {
    h1: '보안 · 비용 · 마무리',
    standfirst: '마지막 날입니다. 새로 만드는 것은 없습니다. 열흘 동안 만든 것을 점검하고, 필요 없는 것은 지우고, 남길 것은 다시 만들 수 있게 기록합니다. 오늘이 끝나면 비용 0원으로 돌아가는 내 서비스 하나와, 그것을 언제든 되살릴 수 있는 문서가 남습니다.',
    schedule: ['09:00–11:00 이론', '11:00–12:00 PART 1', '13:00–15:00 PART 2', '15:00–17:00 PART 3 · 공유'],
    rules: [
      ['남길 것을 먼저 정한다', '지우기 전에 "남길 것" 목록부터 씁니다. Oracle 서버와 Cloud Storage 버킷 외에는 모두 정리 대상입니다.'],
      ['비밀은 문서에 없다', 'README에는 비밀번호, 토큰, IP 외의 개인정보를 쓰지 않습니다.'],
      ['지운 것도 증거를 남긴다', '정리 후 CLI 출력이 정리했다는 증거입니다. 캡처해 둡니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: '보안 점검', time: '11:00–12:00',
        lede: '<code>ssh cloud70</code>으로 접속합니다.',
        missions: [
          { n: 1, h: 'SSH 설정 확인', body: `
      <pre><span class="p">$</span> sudo sshd -T | grep -E "^(passwordauthentication|permitrootlogin|pubkeyauthentication) "
<span class="o">permitrootlogin without-password</span>
<span class="o">pubkeyauthentication yes</span>
<span class="o">passwordauthentication no</span></pre>
      <p><code>passwordauthentication yes</code>가 나오면 <code>/etc/ssh/sshd_config.d/</code> 안의 설정을 <code>no</code>로 바꾸고 <code>sudo systemctl restart ssh</code>. <strong>바꾸기 전에 접속 창을 하나 더 열어 두세요.</strong> 설정이 틀려도 그 창으로 되돌릴 수 있습니다.</p>` },

          { n: 2, h: '열린 포트 목록 — 안과 밖', body: `
      <pre><span class="p">$</span> sudo ss -tulpn                                        <span class="c"># 서버 안에서 듣고 있는 포트</span>
<span class="p">$</span> cd ~/myapp &amp;&amp; docker compose ps --format "table {{.Name}}\\t{{.Ports}}"</pre>
      <p><strong>내 PC(WSL)</strong>에서 밖에서 보이는 포트를 확인합니다.</p>
      <pre><span class="p">$</span> sudo apt install -y netcat-openbsd
<span class="p">$</span> for p in 22 80 443 3306 5000 8080; do nc -zv -w 3 이름.duckdns.org $p; done</pre>
      <div class="box check"><span class="lbl">정답</span>
        <p>22 · 80 · 443만 succeeded, 3306 · 5000 · 8080은 실패해야 합니다. 3306이 열려 있다면 compose.yaml의 db에 <code>ports:</code>가 들어간 것입니다.</p></div>` },

          { n: 3, h: 'fail2ban으로 무차별 대입 막기', body: `
      <pre><span class="p">$</span> sudo grep -c "Invalid user" /var/log/auth.log 2&gt;/dev/null || sudo journalctl -u ssh --since "-7 days" | grep -c "Invalid user"
<span class="p">$</span> sudo apt update &amp;&amp; sudo apt install -y fail2ban
<span class="p">$</span> sudo systemctl enable --now fail2ban
<span class="p">$</span> sudo fail2ban-client status sshd</pre>
      <div class="box q"><span class="lbl">관찰</span>
        <p>첫 줄의 숫자는 열흘 동안 없는 사용자 이름으로 들어오려 한 시도입니다. 키 인증만 허용했기 때문에 모두 실패했습니다. fail2ban은 이런 IP를 일정 시간 차단합니다.</p></div>` },

          { n: 4, h: '계정 보안 확인', body: `
      <ol>
        <li>AWS · Azure · Google · Oracle 네 계정 모두 MFA가 켜져 있는지 확인합니다.</li>
        <li>AWS IAM → 사용자 → <code>admin</code> → 보안 자격 증명에 <strong>액세스 키</strong>가 없는지 확인합니다. 만든 적 없는 키가 있다면 즉시 비활성화합니다.</li>
        <li>Oracle 보안 목록의 22번 규칙을 내 IP로 좁힐지 결정합니다. 집·학교처럼 IP가 자주 바뀌면 열어 두되, 키 인증과 fail2ban으로 지킵니다.</li>
      </ol>` }
        ]
      },
      {
        pn: 'PART 2', h: '비용 확인과 리소스 정리', time: '13:00–15:00',
        lede: '각 클라우드의 브라우저 터미널(CloudShell · Cloud Shell)에서 확인합니다.',
        missions: [
          { n: 5, h: '남길 것 · 지울 것 정하기', body: `
      <div class="tablewrap"><table>
        <thead><tr><th>클라우드</th><th>리소스</th><th>결정</th><th>이유</th></tr></thead>
        <tbody>
          <tr><td>Oracle</td><td>srv-학번, VCN, 백업</td><td>남김</td><td>Always Free, 내 서비스</td></tr>
          <tr><td>Google Cloud</td><td>Cloud Storage 버킷</td><td>남김</td><td>서비스 이미지, 5GB 무료</td></tr>
          <tr><td>Google Cloud</td><td>vm-free (중지됨)</td><td>?</td><td>Oracle 서버가 잘 돌면 지움</td></tr>
          <tr><td>AWS</td><td>모든 리소스</td><td>지움</td><td>무료 플랜 기간 한정</td></tr>
          <tr><td>Azure</td><td>모든 리소스 그룹</td><td>지움</td><td>학생 크레딧 한정</td></tr>
        </tbody></table></div>` },

          { n: 6, h: '클라우드별 정리 확인', body: `
      <span class="prelbl">AWS CloudShell</span>
      <pre><span class="p">$</span> aws ec2 describe-instances --query "Reservations[].Instances[?State.Name!='terminated'].[InstanceId,State.Name]" --output table
<span class="p">$</span> aws ec2 describe-volumes --query "Volumes[].VolumeId" --output text
<span class="p">$</span> aws ec2 describe-addresses --query "Addresses[].PublicIp" --output text
<span class="p">$</span> aws s3 ls</pre>
      <span class="prelbl">Azure Cloud Shell</span>
      <pre><span class="p">$</span> az group list --query "[].name" -o tsv
<span class="p">$</span> az resource list -o table</pre>
      <span class="prelbl">Google Cloud Shell</span>
      <pre><span class="p">$</span> gcloud compute instances list
<span class="p">$</span> gcloud compute instances delete vm-free --zone us-west1-b      <span class="c"># 지우기로 했다면</span>
<span class="p">$</span> gcloud compute disks list
<span class="p">$</span> gcloud run services list
<span class="p">$</span> gcloud storage ls</pre>
      <div class="box check"><span class="lbl">AWS가 리전마다 따로인 이유</span>
        <p>AWS 명령은 현재 리전(서울)만 봅니다. 혹시 다른 리전에 만든 기억이 있다면 <code>--region us-east-1</code>처럼 리전을 바꿔 한 번 더 확인합니다.</p></div>` },

          { n: 7, h: '청구 금액 확인', body: `
      <div class="tablewrap"><table>
        <thead><tr><th>클라우드</th><th>확인 위치</th><th>이번 달 청구 · 남은 크레딧</th></tr></thead>
        <tbody>
          <tr><td>AWS</td><td>결제 및 비용 관리 → 청구서 · 크레딧</td><td></td></tr>
          <tr><td>Azure</td><td>구독 → Azure for Students → 개요</td><td></td></tr>
          <tr><td>Google Cloud</td><td>결제 → 보고서</td><td></td></tr>
          <tr><td>Oracle</td><td>Billing &amp; Cost Management → Cost Analysis</td><td></td></tr>
        </tbody></table></div>
      <div class="box warn"><span class="lbl">0원이 아니라면</span>
        <p>어떤 서비스에서 나왔는지 항목을 펼쳐 확인하고 바로 손을 드세요. 대부분 지우지 않은 디스크·IP이거나 무료 조건과 다른 설정입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: '기록으로 남기고 공유하기', time: '15:00–17:00',
        lede: '서버가 회수되거나 사라져도 이 문서와 파일만 있으면 다시 만들 수 있어야 합니다.',
        missions: [
          { n: 8, h: 'README와 .gitignore 쓰기', body: `
      <pre><span class="p">$</span> cd ~/myapp
<span class="p">$</span> printf '.env\\nbackup-*.sql\\n' &gt; .gitignore
<span class="p">$</span> nano README.md</pre>
      <span class="prelbl">README.md 뼈대</span>
      <pre># 내 클라우드 서비스 — 홍길동

## 주소
https://이름.duckdns.org

## 구성
브라우저 → DuckDNS → Oracle 보안 목록(80·443) → Caddy(HTTPS) → web(Flask) → db(MariaDB)
이미지: Google Cloud Storage (us-central1)

## 다시 만드는 순서
1. Oracle Always Free A1 인스턴스 (Ubuntu 24.04, 2 OCPU · 12GB)
2. 보안 목록 + iptables 80·443 열기
3. Docker 설치: curl -fsSL https://get.docker.com | sudo sh
4. 이 폴더 복사 후 .env 작성 (DB_PASSWORD, DB_ROOT_PASSWORD)
5. Caddyfile 도메인 수정 → docker compose up -d --build
6. DB 복원: docker compose exec -T db sh -c '...' &lt; backup.sql

## 비용
모두 무료 범위. 확인일: 2026-xx-xx</pre>
      <div class="box q"><span class="lbl">선택 — GitHub에 올리기</span>
        <p>GitHub 계정이 있다면 <strong>비공개 저장소</strong>를 만들어 <code>git init → git add . → git commit</code> 후 올립니다. 올리기 전 <code>git status</code>에 <code>.env</code>가 없는지 꼭 확인합니다.</p></div>` },

          { n: 9, h: '마지막 백업', body: `
      <pre><span class="p">$</span> docker compose exec -T db sh -c 'mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" cloud' &gt; backup-final.sql</pre>
      <p>내 PC로 <code>~/myapp</code> 폴더 전체를 가져옵니다 (WSL에서):</p>
      <pre><span class="p">$</span> scp -r cloud70:~/myapp ~/cloud70/myapp-final</pre>
      <p>Oracle 콘솔에서 부트 볼륨 백업 <code>day10-final</code>을 만듭니다. 백업이 5개를 넘지 않게 오래된 것을 지웁니다.</p>` },

          { n: 10, h: '서로의 서비스 방문', body: `
      <ol>
        <li>공유 시트에 내 <code>https://이름.duckdns.org</code> 주소를 적습니다.</li>
        <li>다른 사람 서비스 다섯 곳에 접속해 방문 수를 올려 줍니다.</li>
        <li>내 서버에서 누가 다녀갔는지 확인합니다.</li>
      </ol>
      <pre><span class="p">$</span> docker compose logs caddy --since 30m | grep -c '"GET /'</pre>
      <div class="box check"><span class="lbl">수고했습니다</span>
        <p>열흘 전에는 클라우드 계정이 없었습니다. 지금은 비용 0원으로 도메인과 HTTPS를 갖춘 서비스를 운영하고, 그 서비스를 다시 만들 수 있는 문서를 갖고 있습니다.</p></div>` }
        ]
      }
    ],
    errors: [
      ['<code>sshd -T</code>: command not found', 'sudo 없이 실행', '<code>sudo sshd -T</code>'],
      ['SSH 설정 변경 후 접속 불가', '설정 오타 또는 키 인증까지 막음', '미리 열어 둔 다른 창에서 되돌림. 창이 없으면 Oracle 콘솔의 Cloud Shell Connection 사용'],
      ['<code>fail2ban-client status sshd</code>: jail 없음', 'sshd jail 비활성 또는 로그 위치 문제', '<code>/etc/fail2ban/jail.local</code>에 <code>[sshd]</code> <code>enabled = true</code> <code>backend = systemd</code> 추가 후 재시작'],
      ['<code>nc</code>로 22번도 실패', '보안 목록 22번을 내 IP로 좁혔는데 IP가 바뀜', '현재 IP로 규칙 수정'],
      ['Azure에 지운 기억이 없는 그룹이 있음', '<code>NetworkWatcherRG</code> 또는 Cloud Shell 저장소', 'NetworkWatcherRG는 비용 없음, 그 외는 내용 확인 후 삭제']
    ],
    checklist: [
      'SSH가 비밀번호 로그인을 막고 있다',
      '밖에서 보이는 포트가 22 · 80 · 443뿐이다',
      'fail2ban sshd jail이 동작 중이다',
      '네 계정 모두 MFA가 켜져 있다',
      'AWS · Azure에 남은 리소스가 없다는 출력을 확인했다',
      '네 클라우드의 청구 금액을 확인했다',
      'README.md와 .gitignore를 작성했다',
      '<code>myapp</code> 폴더와 최종 백업을 내 PC에 보관했다'
    ]
  },
  assignment: {
    title: '보안 점검표 · 정리 확인 · README',
    lede: '열흘의 결과를 안전하게, 비용 없이, 다시 만들 수 있는 상태로 마무리했는지 확인합니다.',
    items: [
      '미션 1 · 2 · 3 출력 (SSH 설정, 포트 점검, fail2ban 상태)',
      '미션 5 남길 것 · 지울 것 표',
      '미션 6 클라우드별 정리 확인 출력',
      '미션 7 청구 금액 표',
      'README.md 내용',
      '마지막 날 내 서비스 화면 (방문 수 포함)'
    ],
    due: '제출: 당일 17:00 · 과정 종료'
  }
};
