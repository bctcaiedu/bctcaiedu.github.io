# 클라우드 기초 70시간 (cloud70)

AI응용소프트웨어과 강의실(bctcaiedu.github.io)의 **클라우드 기초** 강좌입니다.
`ubuntu2404` 강좌와 같은 3단 화면(목차 · 학습 문서/슬라이드 · 가상 터미널)으로 만들었습니다.

- 주소: `https://bctcaiedu.github.io/cloud70/` (학생용 `?role=student`, 교사용 `?role=teacher`)
- 10일 × 7시간, 30교시, 실습 과제 42개(자동 채점), 퀴즈, 슬라이드
- 오른쪽 **가상 클라우드 서버**는 브라우저 안에서만 동작합니다 (설치 · 서버 불필요)
  - 공인 IP `203.0.113.25`, OCI 보안 목록 흉내 `seclist`, 외부 PC `labclient`
  - 연습용 `aws` · `az` · `gcloud` CLI (실제 계정에 연결하지 않음)
  - Docker / Compose (Flask · MariaDB · Caddy), DuckDNS · HTTPS 흉내
  - `c70-ready web|stack` — 앞 일차 결과를 한 번에 준비
  - 학생이 만든 파일은 각자 브라우저(localStorage `cloud70.vm.v1`)에 저장

## 폴더
| 경로 | 내용 |
|---|---|
| `index.html` | 앱 (한 페이지) |
| `lessons/day01.js` ~ `day10.js` | 일차별 수업 내용 · 실습 · 채점 스크립트 · 퀴즈 · 슬라이드 |
| `js/course.js` | 강좌 제목 · 일차 목록 |
| `js/cloud70-ext.js` | 클라우드 흉내(iptables · seclist · aws/az/gcloud · Caddy · Flask 등) |
| `js/cloud70-bin.js` | 가상 서버의 `/usr/local/bin` 도우미 스크립트 |
| `js/linux/` | ubuntu2404 강좌의 리눅스 엔진 (cloud70 용 수정 포함) |
| `day1/lab.html` … | 예전 실습 페이지 주소 → 새 화면으로 자동 이동 |

## 수정하는 법
수업 내용은 `lessons/dayNN.js` 를 직접 고치면 됩니다. 브라우저 캐시 때문에 바뀐 내용이 안 보이면
`index.html` 안의 `?v=c70-2` 을 다른 값으로 바꿔 주세요.

## 주의
- 실제 클라우드 콘솔 화면 · 무료 한도는 자주 바뀝니다. 학기 시작 전에 각 회사 공식 문서를 다시 확인하세요.
  (Oracle A1 Always Free: 2 OCPU · 12GB — 2026년 문서 기준)
