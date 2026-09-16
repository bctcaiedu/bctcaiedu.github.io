# physicalai48 — 영상 AI × 피지컬 AI 48시간 과정

`bctcaiedu.github.io`의 **linux70**과 동일한 구조로 만든 정적 강의 사이트입니다.
일차마다 **강의 슬라이드(나레이션) · 실습 가이드 · 퀴즈** 3종이 생성됩니다.

```
physicalai48/
├── index.html          ← 과정 표지 (자동 생성)
├── nav.js              ← 공통 목차 사이드바 (DAYS 배열만 고치면 전체 반영)
├── day1 ~ day6/
│   ├── index.html      ← 강의 슬라이드 (TTS 나레이션 · 자막 · 자동진행)
│   ├── lab.html        ← 실습 가이드 (미션 · 오류대응 · 체크리스트 · 과제)
│   └── quiz.html       ← 퀴즈 18문항 (즉시 채점 + 해설)
└── _src/               ← 원본. 여기만 고치고 다시 빌드합니다
    ├── build.js
    ├── day1.js ~ day6.js   ← 내용은 전부 여기에 있습니다
    ├── css/  deck.css · lab.css · quiz.css
    └── js/   deck.js · quiz.js
```

## 빌드

Node.js만 있으면 됩니다. 별도 패키지 설치 없음.

```bash
node _src/build.js        # 전체 일차 + 표지
```

```bash
node _src/build.js 3 5    # 3·5 일차만 다시 빌드
```

## 내용 수정

HTML을 직접 고치지 마세요. **`_src/dayN.js` 만 고치고 다시 빌드**합니다.

| 고치고 싶은 것 | 파일 · 위치 |
|---|---|
| 슬라이드 내용·나레이션 | `_src/dayN.js` → `slides[]` |
| 오늘의 목표 / 블록 시간표 | `_src/dayN.js` → `goals[]`, `blocks[]` |
| 실습 미션 | `_src/dayN.js` → `lab.parts[].missions[]` |
| 오류 대응표 · 체크리스트 | `_src/dayN.js` → `lab.errors[]`, `lab.checklist[]` |
| 과제 | `_src/dayN.js` → `assignment` |
| 퀴즈 | `_src/dayN.js` → `quiz[]` |
| 좌측 목차 · 과정명 | `nav.js` 상단 `COURSE` · `SUB` · `DAYS` |
| 과정 총 일수 · 과정명 | `_src/build.js` 상단 `TOTAL_DAYS` · `COURSE` |
| 디자인 | `_src/css/*.css` |

### 슬라이드 한 장 추가하기

```js
{ eb: 'Section Label', h: '슬라이드 제목',
  sub: '한 줄 설명',
  body: `<div class="grid g3">
    <div class="card"><span class="n">01</span><span class="t">제목</span><span class="d">설명</span></div>
  </div>`,
  foot: '아래쪽 각주',
  nar: `읽어 줄 나레이션. 영어 약어는 한글 발음으로 적어야 TTS가 자연스럽습니다.` }
```

- `{ section: true, eb, h, sub, nar }` → 블록 구분용 표지 슬라이드
- 쓸 수 있는 클래스: `grid g2/g3/g4` + `card`(`n`/`t`/`d`) · `rowlist`+`row`(`dot`/`t`/`d`) ·
  `stack`+`lay` · `chips`+`chip` · `banner`(주의) · `bannerG`(강조) · `pre`(`span.p` 프롬프트, `span.c` 주석)

### 퀴즈 문항 형식

```js
// 객관식 — a 는 정답 인덱스 (보기는 화면에서 자동으로 섞입니다)
{ q: '질문', o: ['정답', '오답', '오답', '오답'], a: 0, e: '해설' }

// 직접 입력 — acc 에 허용 답안을 모두, ans 는 대표 정답
{ q: '질문 (직접 입력)', t: true, acc: ['답1', '답 1'], ans: '답1', e: '해설' }
```

채점은 `trim → 소문자 → 공백 1칸`으로 정규화해 비교합니다. 띄어쓰기 변형은 `acc`에 넣어 두세요.
통과 기준은 문항 수의 80%로 자동 계산됩니다.

## 배포 (GitHub Pages)

`bctcaiedu.github.io` 저장소 루트에 `physicalai48/` 폴더를 통째로 올리면 됩니다.

```
bctcaiedu.github.io/
├── linux70/
└── physicalai48/     ← 이 폴더
```

접속 주소: `https://bctcaiedu.github.io/physicalai48/`

저장소 루트 `README.md`에 링크 한 줄을 추가해 두면 첫 페이지에서 바로 들어갈 수 있습니다.

## 강의 슬라이드 조작

| 키 · 버튼 | 동작 |
|---|---|
| ← → | 슬라이드 이동 |
| Space | 나레이션 재생 / 정지 |
| F | 전체화면 |
| 자동 진행 | 나레이션이 끝나면 다음 장으로 |
| 목소리 · 속도 | 브라우저 TTS 음성 선택 (Chrome / Edge 권장) |

> 한국어 음성이 없으면 경고가 뜹니다. **Chrome 또는 Edge**에서 열어 주세요.

## 과정 개요

| | |
|---|---|
| 총 시수 | 48시간 (6일 × 8시간, 1일 4블록 × 110분) |
| 실습 환경 | 네이티브 Windows 11 + Miniconda (환경 3개: `physicalai` · `rl` · `isaac`) |
| Day 1 | 영상 AI의 시작 — 개요 · 환경구축 · 웹캠 · Haar와 그 한계 |
| Day 2 | 딥러닝 검출과 랜드마크 — YOLO · MediaPipe · 커스텀 학습 · 미니프로젝트 |
| Day 3 | 가상의 몸 — MuJoCo · MJCF · 물리 실험 · 관절 제어 |
| Day 4 | 로봇팔 제어와 센서 — 역기구학 · 그리퍼 · 시뮬 카메라 · 합성 데이터 |
| Day 5 | 인식·판단·행동을 하나로 — 좌표 변환 · LLM 명령 · 강화학습 입문 |
| Day 6 | 강화학습과 Isaac — 보상 설계 · 병렬 학습 · Sim-to-Real · 최종 프로젝트 |

커리큘럼 설계 근거와 기존 자료 매핑은 상위 폴더의 `커리큘럼_6일48시간.md`를 참고하세요.
