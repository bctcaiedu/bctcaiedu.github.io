module.exports = {
  day: 9,
  goals: [
    'DB를 덤프로 백업하고, 지운 뒤 복원해 본다',
    'Cloud Storage 버킷에 이미지를 올려 내 서비스에서 불러온다',
    '같은 앱을 Cloud Run(서버리스)에 배포한다',
    'VM과 서버리스를 응답 시간·관리·과금 기준으로 비교한다'
  ],
  lab: {
    h1: '스토리지 · DB 백업 · 서버리스',
    standfirst: '어제 완성한 서비스에 세 가지를 더합니다. 데이터를 잃지 않는 법(백업과 복원), 큰 파일을 서버 밖에 두는 법(객체 스토리지), 그리고 서버 없이 앱을 돌리는 법(Cloud Run)입니다. 마지막에 "내 서비스는 VM과 서버리스 중 어디가 맞는가"에 답을 냅니다.',
    schedule: ['09:00–11:00 이론', '11:00–12:00 PART 1', '13:00–15:00 PART 2', '15:00–17:00 PART 3 · 산출물'],
    rules: [
      ['복원해 보지 않은 백업은 백업이 아니다', '백업 파일을 만드는 것에서 멈추지 말고, 실제로 지우고 되살려 봅니다.'],
      ['공개 버킷엔 공개 파일만', '버킷을 공개로 여는 것은 이미지 한 장을 위한 것입니다. 다른 파일은 올리지 않습니다.'],
      ['Google Cloud는 미국 리전', 'Cloud Storage와 Cloud Run 모두 <code>us-central1</code>을 씁니다. 무료 사용량 조건입니다.']
    ],
    parts: [
      {
        pn: 'PART 1', h: 'DB 백업과 복원', time: '11:00–12:00',
        lede: '<code>ssh cloud70</code> → <code>cd ~/myapp</code>에서 진행합니다. 시작 전에 내 서비스에 몇 번 접속해 방문 기록을 쌓아 두세요.',
        missions: [
          { n: 1, h: '덤프로 백업하기', body: `
      <pre><span class="p">$</span> docker compose exec -T db sh -c 'mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" cloud' &gt; backup-$(date +%F).sql
<span class="p">$</span> ls -lh backup-*.sql
<span class="p">$</span> grep -c "INSERT" backup-*.sql
<span class="p">$</span> head -30 backup-*.sql</pre>
      <div class="box check"><span class="lbl">-T 옵션</span>
        <p>출력을 파일로 받을 때는 <code>-T</code>를 붙여 터미널 흉내를 끕니다. 빠뜨리면 파일에 이상한 문자가 섞일 수 있습니다.</p></div>` },

          { n: 2, h: '사고 내고 되살리기', body: `
      <pre><span class="p">$</span> Q() { docker compose exec -T db sh -c "mariadb -uroot -p\\"\\$MARIADB_ROOT_PASSWORD\\" cloud -e '$1'"; }
<span class="p">$</span> Q "SELECT COUNT(*) FROM visits"          <span class="c"># 백업 직후 개수 기록</span>
<span class="p">$</span> Q "DELETE FROM visits"                    <span class="c"># 사고!</span>
<span class="p">$</span> Q "SELECT COUNT(*) FROM visits"          <span class="c"># 0</span>
<span class="p">$</span> docker compose exec -T db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" cloud' &lt; backup-$(date +%F).sql
<span class="p">$</span> Q "SELECT COUNT(*) FROM visits"          <span class="c"># 원래 개수로 돌아왔나</span></pre>` },

          { n: 3, h: '백업을 서버 밖으로', body: `
      <p>서버가 회수되거나 망가지면 서버 안의 백업도 같이 사라집니다. <strong>내 PC(WSL)</strong>로 가져옵니다.</p>
      <pre><span class="p">$</span> mkdir -p ~/cloud70/backup
<span class="p">$</span> scp 'cloud70:~/myapp/backup-*.sql' ~/cloud70/backup/
<span class="p">$</span> ls -lh ~/cloud70/backup</pre>
      <div class="box q"><span class="lbl">확인 질문</span>
        <p>RDS나 Cloud SQL 같은 관리형 DB를 쓰면 미션 1~3 중 무엇을 클라우드가 대신해 줄까요? 그 대가로 무엇을 내야 할까요?</p></div>` }
        ]
      },
      {
        pn: 'PART 2', h: '객체 스토리지로 이미지 서비스', time: '13:00–14:30',
        lede: 'Google Cloud 콘솔에서 <strong>Cloud Shell</strong>을 엽니다. 프로젝트가 <code>cloud70-학번</code>인지 확인합니다.',
        missions: [
          { n: 4, h: '버킷 만들고 이미지 올리기', body: `
      <pre><span class="p">$</span> B=cloud70-학번숫자-img
<span class="p">$</span> gcloud storage buckets create gs://$B --location=us-central1 --uniform-bucket-level-access</pre>
      <p>Cloud Shell 오른쪽 위 <strong>⋮ → 업로드</strong>로 내 PC의 사진 한 장(<code>cloud.jpg</code>)을 올립니다.</p>
      <pre><span class="p">$</span> gcloud storage cp cloud.jpg gs://$B/
<span class="p">$</span> gcloud storage ls -l gs://$B/</pre>` },

          { n: 5, h: '이미지 하나만 공개하기', body: `
      <pre><span class="p">$</span> gcloud storage buckets add-iam-policy-binding gs://$B \\
    --member=allUsers --role=roles/storage.objectViewer
<span class="p">$</span> echo "https://storage.googleapis.com/$B/cloud.jpg"</pre>
      <p>출력된 주소를 브라우저로 열어 사진이 보이는지 확인합니다.</p>` },

          { n: 6, h: '내 서비스에 이미지 붙이기', body: `
      <p>서버(<code>ssh cloud70</code>)의 <code>~/myapp/app/app.py</code>에서 return 줄을 고칩니다.</p>
      <pre>    img = "https://storage.googleapis.com/cloud70-학번숫자-img/cloud.jpg"
    return (f"&lt;h1&gt;☁️ 내 클라우드 서비스&lt;/h1&gt;&lt;p&gt;{n}번째 방문입니다.&lt;/p&gt;"
            f'&lt;img src="{img}" width="320" alt="cloud"&gt;')</pre>
      <pre><span class="p">$</span> cd ~/myapp &amp;&amp; docker compose up -d --build web</pre>
      <div class="box check"><span class="lbl">왜 서버 밖에 두나</span>
        <p>이미지 요청은 내 서버를 거치지 않고 Google이 직접 보냅니다. 서버 디스크와 대역폭을 아끼고, 서버를 다시 만들어도 이미지는 그대로입니다.</p></div>` }
        ]
      },
      {
        pn: 'PART 3', h: 'Cloud Run — 서버 없이 앱 돌리기', time: '14:30–16:30',
        lede: 'Cloud Shell에서 진행합니다. 7일차의 DB 없는 Flask 앱을 그대로 씁니다.',
        missions: [
          { n: 7, h: '같은 앱을 Cloud Run에 배포', body: `
      <pre><span class="p">$</span> mkdir hello-run &amp;&amp; cd hello-run
<span class="p">$</span> cat &gt; app.py &lt;&lt;'EOF'
from flask import Flask
app = Flask(__name__)

@app.get("/")
def index():
    return "&lt;h1&gt;☁️ Cloud Run 위의 Flask&lt;/h1&gt;"
EOF
<span class="p">$</span> printf 'flask\\ngunicorn\\n' &gt; requirements.txt
<span class="p">$</span> cat &gt; Dockerfile &lt;&lt;'EOF'
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
EOF
<span class="p">$</span> gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
<span class="p">$</span> gcloud run deploy hello --source . --region us-central1 --allow-unauthenticated --port 5000</pre>
      <p>마지막 줄의 <code>Service URL</code>을 브라우저로 엽니다. https 인증서까지 이미 붙어 있습니다.</p>` },

          { n: 8, h: '응답 시간 비교 — 콜드 스타트', body: `
      <pre><span class="p">$</span> URL=$(gcloud run services describe hello --region us-central1 --format='value(status.url)')
<span class="p">$</span> for i in 1 2 3 4 5; do curl -o /dev/null -s -w "%{time_total}s\\n" $URL; done
<span class="p">$</span> for i in 1 2 3 4 5; do curl -o /dev/null -s -w "%{time_total}s\\n" https://이름.duckdns.org; done</pre>
      <p>오후 실습 마지막(20분 이상 아무도 접속하지 않은 뒤)에 Cloud Run을 다시 한 번 재 봅니다. 첫 요청만 유독 느리면 그것이 <strong>콜드 스타트</strong>입니다.</p>` },

          { n: 9, h: 'VM vs 서버리스 비교와 정리', body: `
      <div class="tablewrap"><table>
        <thead><tr><th>비교</th><th>Oracle VM + Compose</th><th>Cloud Run</th></tr></thead>
        <tbody>
          <tr><td>평균 응답 시간 (측정값)</td><td></td><td></td></tr>
          <tr><td>첫 요청 (콜드 스타트)</td><td></td><td></td></tr>
          <tr><td>OS 업데이트 · 인증서는 누가</td><td></td><td></td></tr>
          <tr><td>요금이 나가는 기준</td><td></td><td></td></tr>
          <tr><td>방문자가 100배 늘면</td><td></td><td></td></tr>
          <tr><td>DB를 함께 두기</td><td></td><td></td></tr>
        </tbody></table></div>
      <p style="margin-top:10px">표를 채운 뒤 Cloud Run 서비스와 빌드 이미지를 지웁니다. 버킷은 내 서비스가 쓰므로 남깁니다.</p>
      <pre><span class="p">$</span> gcloud run services delete hello --region us-central1 --quiet
<span class="p">$</span> gcloud artifacts repositories delete cloud-run-source-deploy --location us-central1 --quiet
<span class="p">$</span> gcloud run services list</pre>` }
        ]
      }
    ],
    errors: [
      ['<code>mariadb-dump: command not found</code>', '예전 MySQL 이미지 사용', 'MariaDB 11은 <code>mariadb-dump</code>, MySQL은 <code>mysqldump</code>'],
      ['덤프 파일 첫 줄에 경고 문구', '비밀번호를 명령줄에 넣었다는 경고가 파일에 섞임', '<code>-T</code>를 붙였는지 확인, 경고는 stderr라 보통 파일에 안 들어감'],
      ['<code>public access prevention</code> 오류', '버킷 공개 차단이 켜져 있음', '<code>gcloud storage buckets update gs://$B --no-public-access-prevention</code> 후 미션 5 재실행'],
      ['Cloud Run 배포 중 API 사용 여부 질문', 'API가 꺼져 있음', '<code>Y</code> 입력 또는 미션 7의 <code>services enable</code> 먼저 실행'],
      ['Cloud Run <code>Container failed to start ... PORT</code>', '앱이 듣는 포트와 Cloud Run 설정이 다름', '<code>--port 5000</code>을 붙였는지 확인']
    ],
    checklist: [
      '덤프 파일을 만들고 <code>INSERT</code>가 들어 있는 것을 확인했다',
      '데이터를 지운 뒤 덤프로 복원해 개수가 돌아왔다',
      '백업 파일을 내 PC로 가져왔다',
      'Cloud Storage 이미지가 내 서비스 페이지에 보인다',
      'Cloud Run 서비스 URL에서 앱이 열렸다',
      '응답 시간을 측정해 비교표를 채웠다',
      'Cloud Run 서비스와 빌드 저장소를 삭제했다'
    ]
  },
  assignment: {
    title: '백업·스토리지·서버리스 비교',
    lede: '데이터를 지킬 수 있는지, 서비스 방식을 근거 있게 고를 수 있는지 확인합니다.',
    items: [
      '미션 2의 복원 전후 개수 출력',
      '내 PC의 <code>ls -lh ~/cloud70/backup</code> 출력',
      '이미지가 붙은 내 서비스 화면 (https 주소 포함)',
      'Cloud Run 페이지 화면과 응답 시간 측정 출력',
      '미션 9 비교표와 "내 서비스에는 어느 쪽이 맞는가" 3줄 의견',
      'Cloud Run 정리 확인 출력'
    ]
  }
};
