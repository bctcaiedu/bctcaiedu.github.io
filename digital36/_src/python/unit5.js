/* 5단원 파이썬 확장 — 루틴 캘린더 파일(.ics) · 습관 기록 분석
   기본 문제: 값 바꾸기 + 빈칸(✏️) 1줄 / 도전 문제: 캘린더 줄 직접 만들기 · CSV · 최장 연속 */
module.exports = {
  unit: 5,
  missions: [
    { part: 2, n: 'P8', h: '루틴을 캘린더 파일(.ics)로 만들어 한 번에 등록하기', body: `
      <p>반복 일정을 하나씩 클릭해 넣는 대신, 파이썬으로 <strong>.ics 캘린더 파일</strong>을 만들어 구글 캘린더에 <strong>한 번에 가져오기</strong> 합니다. .ics는 구글·애플·아웃룩 캘린더가 모두 읽는 표준 파일입니다. 파일을 만드는 코드는 준비되어 있고, 여러분은 <strong>내 루틴 값을 넣고 한 줄만 채웁니다.</strong></p>
      <p><strong>쓰는 파이썬:</strong> 변수 값 바꾸기 · 문자열 더하기 · 리스트 <code>append()</code> · 파일 저장</p>
      __NB__
      <ol>
        <li>노트북 <strong>1-1</strong>: 제목·시작 날짜·시각·반복 요일·횟수를 <strong>나의 루틴</strong>으로 바꿉니다.</li>
        <li><strong>1-2 ✏️</strong>: 빈칸 한 줄 — 일정 제목 줄(<code>SUMMARY:</code> + 제목)을 추가합니다.</li>
        <li><strong>1-3</strong>: 검사가 모두 ✅이면 <code>내_루틴.ics</code>를 내려받습니다.</li>
        <li>구글 캘린더(PC)에서 <strong>새 캘린더 "루틴 연습"</strong>을 먼저 만듭니다. (설정 → 캘린더 추가 → 새 캘린더)</li>
        <li>설정 → <strong>가져오기/내보내기</strong> → 파일 선택 → 추가할 캘린더를 <strong>"루틴 연습"</strong>으로 고르고 가져오기.</li>
        <li>휴대폰 캘린더 앱에서 반복 일정으로 보이는지 확인합니다.</li>
      </ol>
      <div class="box warn"><span class="lbl">꼭 새 캘린더로</span>
        <p>가져온 일정은 한꺼번에 취소하기 어렵습니다. <strong>연습용 캘린더에 넣어 두면</strong> 잘못됐을 때 그 캘린더만 삭제하면 됩니다. 메뉴 이름은 업데이트로 달라질 수 있고, 알림은 캘린더의 기본 알림 설정이 적용됩니다.</p></div>
      <div class="box check"><span class="lbl">도전 문제 (선택)</span>
        <p>노트북 끝 <strong>도전 A</strong>: 루틴 여러 개를 딕셔너리 리스트로 만들고, 반복이 없는 일정까지 처리하는 함수를 직접 완성합니다.</p></div>` },

    { part: 6, n: 'P9', h: '습관 기록 달성률 계산해 루틴북에 붙이기', body: `
      <p>2주 동안의 습관 체크 기록(O/X)으로 <strong>습관별 달성률</strong>과 <strong>1주차 → 2주차 변화</strong>를 계산하고, <strong>루틴북에 붙일 요약 보고서</strong>를 만듭니다.</p>
      <p><strong>쓰는 파이썬:</strong> 리스트 <code>count()</code> · 리스트 자르기 <code>[:7]</code> · <code>for</code> 반복문 · 파일 저장</p>
      __NB__
      <ol>
        <li>노트북 <strong>2-1</strong>: 습관 4개의 14일 기록(O/X 리스트)을 실행합니다. 내 기록이 있으면 O/X를 바꿔 넣습니다.</li>
        <li><strong>2-2 ✏️</strong>: 빈칸 한 줄 — <code>count("O")</code>로 달성한 날 수를 셉니다.</li>
        <li><strong>2-3</strong>: 1주차와 2주차를 비교해 ▲▼를 확인합니다.</li>
        <li><strong>2-4</strong>: 보고서를 <code>루틴_보고서.txt</code>로 저장·내려받아 <strong>루틴북 5장</strong>에 붙입니다.</li>
      </ol>
      <pre><span class="p">나 ▶</span> 아래는 내 2주 습관 기록 결과야. 잘한 점 1가지와, 달성률이 가장 낮은 습관을
     지키기 쉽게 만드는 작은 방법 3가지를 알려 줘.
     (루틴_보고서 내용 붙여 넣기)</pre>
      <div class="box check"><span class="lbl">루틴북 연결</span>
        <p>보고서 + AI 조언 + <strong>내가 실제로 고른 방법 1가지</strong>를 함께 적으면 루브릭 "② 실생활 적용"의 증거가 됩니다. 건강 관련 목표는 무리하지 말고 필요하면 전문가와 상의하세요.</p></div>
      <div class="box check"><span class="lbl">도전 문제 (선택)</span>
        <p>노트북 끝 <strong>도전 B</strong>: 구글 시트에서 내려받은 CSV를 읽고, <strong>가장 길게 연속으로 달성한 날 수</strong>를 구하는 함수와 그래프를 만듭니다.</p></div>` }
  ],

  notebook: {
    file: 'unit5_python.ipynb',
    title: '5단원 파이썬 확장 — 루틴 캘린더 파일 · 습관 기록 분석',
    cells: [
      { md: `# 5단원 파이썬 확장 실습
**디지털리터러시 36시간 과정 · 나만의 디지털 루틴 만들기**

| 번호 | 연결 차시 | 내용 | 빈칸 |
|---|---|---|---|
| 1 | 2차시 일정·할 일 관리 | 내 루틴 → **.ics 캘린더 파일** → 구글 캘린더에 가져오기 | 1줄 |
| 2 | 6차시 디지털 루틴북 | 습관 기록 → 달성률 · 주간 비교 → **루틴북 보고서** | 1줄 |
| 도전 A·B | 선택 | 여러 일정 함수 · CSV 읽기 · 최장 연속 달성일 · 그래프 | 여러 줄 |

- **Shift + Enter**로 위에서부터 실행합니다. **✏️ 줄**만 고치면 됩니다.
- 일정 제목에 주소·전화번호·병명 같은 민감한 정보는 적지 않습니다.` },
      { code: String.raw`
# 정답 확인 도우미 — 맨 먼저 한 번 실행하세요
def 확인(이름, 결과, 정답):
    if 결과 is None:
        print("⏳", 이름, ": 아직 비어 있어요")
    elif 결과 == 정답:
        print("✅", 이름, ": 정답입니다!", 결과)
    else:
        print("❌", 이름, ": 결과", 결과, "/ 기대", 정답)

print("준비 완료")` },

      { md: `---
## 1. 루틴 → 캘린더 파일(.ics)

### 1-1. 내 루틴 값 넣기
- \`시작날짜\`: 첫 일정 날짜를 **숫자 8자리**로 (2026년 10월 5일 → \`"20261005"\`)
- \`시작시각\`·\`끝시각\`: **숫자 4자리** (오전 7시 → \`"0700"\`, 오후 7시 30분 → \`"1930"\`)
- \`반복요일\`: \`MO\`(월) \`TU\`(화) \`WE\`(수) \`TH\`(목) \`FR\`(금) \`SA\`(토) \`SU\`(일) 중에서 쉼표로
- \`반복횟수\`: 일정이 **몇 번** 생길지 (월·수·금 4주면 12)` },
      { code: String.raw`
제목 = "아침 스트레칭"
시작날짜 = "20261005"
시작시각 = "0700"
끝시각 = "0715"
반복요일 = "MO,WE,FR"
반복횟수 = 12

print(시작날짜, 시작시각, "~", 끝시각, 제목, "/", 반복요일, 반복횟수, "번")` },

      { md: `### 1-2. ✏️ 캘린더 파일의 줄 만들기
.ics 파일은 이런 **글자 줄**로 이루어집니다. 대부분 준비되어 있고, **제목 줄**만 비어 있습니다.
\`\`\`
DTSTART;TZID=Asia/Seoul:20261005T070000     ← 시작
DTEND;TZID=Asia/Seoul:20261005T071500       ← 끝
SUMMARY:아침 스트레칭                        ← 제목  ✏️
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=12   ← 매주 반복 규칙
\`\`\`
시작 줄을 만든 방법(\`"글자" + 변수\`)을 따라 \`"SUMMARY:" + 제목\`을 추가하세요.` },
      { code: String.raw`
import uuid
from datetime import datetime, timezone

줄들 = []
줄들.append("BEGIN:VCALENDAR")
줄들.append("VERSION:2.0")
줄들.append("PRODID:-//digital36//routine//KO")
줄들.append("BEGIN:VEVENT")
줄들.append("UID:" + str(uuid.uuid4()))
줄들.append("DTSTAMP:" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
줄들.append("DTSTART;TZID=Asia/Seoul:" + 시작날짜 + "T" + 시작시각 + "00")
줄들.append("DTEND;TZID=Asia/Seoul:" + 시작날짜 + "T" + 끝시각 + "00")
# ✏️ 빈칸: 아래 줄의 맨 앞 # 을 지우고 완성하세요
# 줄들.append(  )
줄들.append("RRULE:FREQ=WEEKLY;BYDAY=" + 반복요일 + ";COUNT=" + str(반복횟수))
줄들.append("END:VEVENT")
줄들.append("END:VCALENDAR")

for 줄 in 줄들:
    print(줄)`,
        answer: String.raw`
import uuid
from datetime import datetime, timezone

줄들 = []
줄들.append("BEGIN:VCALENDAR")
줄들.append("VERSION:2.0")
줄들.append("PRODID:-//digital36//routine//KO")
줄들.append("BEGIN:VEVENT")
줄들.append("UID:" + str(uuid.uuid4()))
줄들.append("DTSTAMP:" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
줄들.append("DTSTART;TZID=Asia/Seoul:" + 시작날짜 + "T" + 시작시각 + "00")
줄들.append("DTEND;TZID=Asia/Seoul:" + 시작날짜 + "T" + 끝시각 + "00")
줄들.append("SUMMARY:" + 제목)
줄들.append("RRULE:FREQ=WEEKLY;BYDAY=" + 반복요일 + ";COUNT=" + str(반복횟수))
줄들.append("END:VEVENT")
줄들.append("END:VCALENDAR")

for 줄 in 줄들:
    print(줄)` },

      { md: `### 1-3. 검사하고 파일로 저장 · 내려받기` },
      { code: String.raw`
확인("제목 줄", ("SUMMARY:" + 제목) if ("SUMMARY:" + 제목) in 줄들 else None, "SUMMARY:" + 제목)
확인("날짜는 숫자 8자리", len(시작날짜) == 8 and 시작날짜.isdigit(), True)
확인("시각은 숫자 4자리", len(시작시각) == 4 and len(끝시각) == 4, True)
확인("끝 시각이 시작보다 늦음", 끝시각 > 시작시각, True)

with open("내_루틴.ics", "w", encoding="utf-8", newline="") as f:
    for 줄 in 줄들:
        f.write(줄 + "\r\n")
print("내_루틴.ics 저장 완료")

try:
    from google.colab import files
    files.download("내_루틴.ics")
except ImportError:
    print("Colab이 아닌 환경입니다. 이 노트북과 같은 폴더에 저장되었습니다.")` },
      { md: `### 1-4. 구글 캘린더로 가져오기 (PC)
1. 구글 캘린더 → ⚙️ 설정 → **캘린더 추가 → 새 캘린더** → 이름 \`루틴 연습\` → 만들기
2. 설정 → **가져오기/내보내기** → 컴퓨터에서 파일 선택 → \`내_루틴.ics\`
3. **캘린더에 추가**: \`루틴 연습\` 선택 → **가져오기**
4. 휴대폰 캘린더 앱에서 반복 일정으로 보이는지 확인

> 메뉴 이름은 업데이트로 달라질 수 있습니다. 잘못 들어갔다면 **루틴 연습 캘린더만 삭제**하면 됩니다.` },

      { md: `---
## 2. 습관 기록 달성률 → 루틴북 보고서

### 2-1. 14일 기록
**예시 기록**입니다. 내 기록이 있으면 O/X를 바꿔 넣으세요. (앞 7개 = 1주차, 뒤 7개 = 2주차)` },
      { code: String.raw`
습관이름 = ["운동", "물 8잔", "독서 20분", "11시 전 취침"]
기록 = [
    ["O", "X", "O", "O", "X", "O", "X",   "O", "O", "O", "X", "O", "O", "O"],   # 운동
    ["X", "X", "O", "X", "O", "X", "X",   "O", "X", "O", "O", "X", "O", "X"],   # 물 8잔
    ["O", "O", "O", "O", "O", "X", "O",   "O", "O", "X", "X", "X", "O", "O"],   # 독서 20분
    ["X", "O", "X", "X", "O", "O", "X",   "O", "O", "O", "O", "X", "O", "O"],   # 11시 전 취침
]

for i in range(len(습관이름)):
    print(습관이름[i], ":", " ".join(기록[i]))` },

      { md: `### 2-2. ✏️ 달성률 계산
\`리스트.count("O")\`는 리스트에 \`"O"\`가 몇 개 있는지 셉니다.` },
      { code: String.raw`
달성률들 = []
for i in range(len(습관이름)):
    달성일 = None   # ✏️ 빈칸: 기록[i]에서 "O"의 개수
    if 달성일 is None:
        달성률 = None
    else:
        달성률 = round(달성일 / len(기록[i]) * 100, 1)
    달성률들.append(달성률)
    print(습관이름[i], ":", 달성일, "/", len(기록[i]), "일 →", 달성률, "%")`,
        answer: String.raw`
달성률들 = []
for i in range(len(습관이름)):
    달성일 = 기록[i].count("O")
    if 달성일 is None:
        달성률 = None
    else:
        달성률 = round(달성일 / len(기록[i]) * 100, 1)
    달성률들.append(달성률)
    print(습관이름[i], ":", 달성일, "/", len(기록[i]), "일 →", 달성률, "%")` },
      { code: String.raw`
확인("운동 달성률", 달성률들[0], 71.4)
확인("물 8잔 달성률", 달성률들[1], 42.9)` },

      { md: `### 2-3. 1주차 vs 2주차
\`기록[i][:7]\`은 **앞 7개**(1주차), \`기록[i][7:]\`은 **나머지**(2주차)입니다.` },
      { code: String.raw`
for i in range(len(습관이름)):
    주1 = 기록[i][:7].count("O")
    주2 = 기록[i][7:].count("O")
    if 주2 > 주1:
        화살표 = "▲"
    elif 주2 < 주1:
        화살표 = "▼"
    else:
        화살표 = "="
    print(습관이름[i], ": 1주차", 주1, "회 → 2주차", 주2, "회", 화살표, "■" * 주2 + "□" * (7 - 주2))` },

      { md: `### 2-4. 루틴북 보고서 만들기 · 내려받기` },
      { code: String.raw`
보고서 = "[나의 습관 기록 보고서] 14일\n\n"
가장_낮은_습관 = ""
가장_낮은_달성률 = 101

for i in range(len(습관이름)):
    주1 = 기록[i][:7].count("O")
    주2 = 기록[i][7:].count("O")
    보고서 = 보고서 + "- " + 습관이름[i] + ": 달성률 " + str(달성률들[i]) + "% / 1주차 " + str(주1) + "회 → 2주차 " + str(주2) + "회\n"
    if 달성률들[i] is not None and 달성률들[i] < 가장_낮은_달성률:
        가장_낮은_달성률 = 달성률들[i]
        가장_낮은_습관 = 습관이름[i]

보고서 = 보고서 + "\n다음 목표: 달성률이 가장 낮은 '" + 가장_낮은_습관 + "' 습관을 지키기 쉽게 바꾼다.\n"
보고서 = 보고서 + "내가 고른 방법(직접 적기): ____________________\n"
print(보고서)

with open("루틴_보고서.txt", "w", encoding="utf-8") as f:
    f.write(보고서)
try:
    from google.colab import files
    files.download("루틴_보고서.txt")
except ImportError:
    print("(루틴_보고서.txt 저장 완료)")` },
      { md: `🤖 보고서를 복사해 AI에게 **"달성률이 가장 낮은 습관을 지키기 쉽게 만드는 작은 방법 3가지"** 를 묻고, 그중 **내가 실제로 할 1가지**를 보고서 마지막 줄에 적으세요.` },

      { md: `---
# 🏆 도전 문제 (선택)

## 도전 A. 여러 일정을 한 파일로 — 함수 완성하기
일정을 **딕셔너리 리스트**로 적고, 일정 하나를 줄들로 바꾸는 함수를 완성합니다.
**TODO 3곳**: DTEND 줄, SUMMARY 줄, 반복요일이 있을 때만 RRULE 줄.` },
      { code: String.raw`
import uuid
from datetime import datetime, timezone

일정들 = [
    {"제목": "아침 스트레칭", "날짜": "2026-10-05", "시작": "07:00", "끝": "07:15", "반복요일": "MO,WE,FR", "반복횟수": 12},
    {"제목": "물 한 컵 마시기", "날짜": "2026-10-05", "시작": "08:30", "끝": "08:35", "반복요일": "MO,TU,WE,TH,FR,SA,SU", "반복횟수": 28},
    {"제목": "디지털리터러시 복습", "날짜": "2026-10-07", "시작": "19:00", "끝": "19:30", "반복요일": "", "반복횟수": 0},
]

def 시각_변환(날짜, 시각):
    return 날짜.replace("-", "") + "T" + 시각.replace(":", "") + "00"

def 일정_줄들(일정):
    줄 = ["BEGIN:VEVENT",
          "UID:" + str(uuid.uuid4()),
          "DTSTAMP:" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
          "DTSTART;TZID=Asia/Seoul:" + 시각_변환(일정["날짜"], 일정["시작"])]
    # ✏️ TODO 1: DTEND 줄 추가
    # ✏️ TODO 2: SUMMARY 줄 추가 (쉼표·세미콜론이 있으면 앞에 \ 를 붙여야 합니다)
    # ✏️ TODO 3: 반복요일이 있으면 RRULE:FREQ=WEEKLY;BYDAY=...;COUNT=... 줄 추가
    줄.append("END:VEVENT")
    return 줄

전체 = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//digital36//routine//KO", "X-WR-CALNAME:루틴 연습"]
for 일정 in 일정들:
    전체 += 일정_줄들(일정)
전체.append("END:VCALENDAR")
본문 = "\n".join(전체)

for 이름, 찾을, 기대 in [("DTEND", "DTEND;", 3), ("SUMMARY", "SUMMARY:", 3), ("RRULE", "RRULE:", 2)]:
    확인(이름 + " 줄 개수", 본문.count(찾을) or None, 기대)`,
        answer: String.raw`
import uuid
from datetime import datetime, timezone

일정들 = [
    {"제목": "아침 스트레칭", "날짜": "2026-10-05", "시작": "07:00", "끝": "07:15", "반복요일": "MO,WE,FR", "반복횟수": 12},
    {"제목": "물 한 컵 마시기", "날짜": "2026-10-05", "시작": "08:30", "끝": "08:35", "반복요일": "MO,TU,WE,TH,FR,SA,SU", "반복횟수": 28},
    {"제목": "디지털리터러시 복습", "날짜": "2026-10-07", "시작": "19:00", "끝": "19:30", "반복요일": "", "반복횟수": 0},
]

def 시각_변환(날짜, 시각):
    return 날짜.replace("-", "") + "T" + 시각.replace(":", "") + "00"

def 일정_줄들(일정):
    줄 = ["BEGIN:VEVENT",
          "UID:" + str(uuid.uuid4()),
          "DTSTAMP:" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
          "DTSTART;TZID=Asia/Seoul:" + 시각_변환(일정["날짜"], 일정["시작"])]
    줄.append("DTEND;TZID=Asia/Seoul:" + 시각_변환(일정["날짜"], 일정["끝"]))
    제목글 = 일정["제목"].replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;")
    줄.append("SUMMARY:" + 제목글)
    if 일정["반복요일"]:
        줄.append("RRULE:FREQ=WEEKLY;BYDAY=" + 일정["반복요일"] + ";COUNT=" + str(일정["반복횟수"]))
    줄.append("END:VEVENT")
    return 줄

전체 = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//digital36//routine//KO", "X-WR-CALNAME:루틴 연습"]
for 일정 in 일정들:
    전체 += 일정_줄들(일정)
전체.append("END:VCALENDAR")
본문 = "\n".join(전체)

for 이름, 찾을, 기대 in [("DTEND", "DTEND;", 3), ("SUMMARY", "SUMMARY:", 3), ("RRULE", "RRULE:", 2)]:
    확인(이름 + " 줄 개수", 본문.count(찾을) or None, 기대)` },
      { code: String.raw`
with open("내_루틴_여러개.ics", "w", encoding="utf-8", newline="") as f:
    f.write("\r\n".join(전체) + "\r\n")
print("내_루틴_여러개.ics 저장 완료 — 1-4와 같은 방법으로 가져오기")` },

      { md: `## 도전 B. 구글 시트 CSV 읽기 · 최장 연속 달성일 · 그래프
### B-1. CSV 읽기
내 기록은 구글 시트에서 첫 줄을 \`날짜,습관1,습관2,...\`로 만들고 **파일 → 다운로드 → CSV**로 받은 뒤 왼쪽 📁에 올려 \`파일이름\`을 바꾸세요.` },
      { code: String.raw`
import csv

예시 = """날짜,운동,물 8잔,독서 20분,11시 전 취침
10-05,O,X,O,X
10-06,X,X,O,O
10-07,O,O,O,X
10-08,O,X,O,X
10-09,X,O,O,O
10-10,O,X,X,O
10-11,X,X,O,X
10-12,O,O,O,O
10-13,O,X,O,O
10-14,O,O,X,O
10-15,X,O,X,O
10-16,O,X,X,X
10-17,O,O,O,O
10-18,O,X,O,O
"""
with open("습관기록.csv", "w", encoding="utf-8") as f:
    f.write(예시)

파일이름 = "습관기록.csv"
with open(파일이름, encoding="utf-8-sig") as f:
    읽기 = csv.reader(f)
    머리줄 = next(읽기)
    행들 = [행 for 행 in 읽기 if 행]

csv기록 = {}
for j, 습관 in enumerate(머리줄[1:]):
    csv기록[습관] = [행[j + 1].strip().upper() == "O" for 행 in 행들]
print(len(행들), "일 ·", list(csv기록))` },
      { md: `### B-2. ✏️ 가장 긴 연속 달성일
O가 이어지면 \`지금_연속\`을 1 늘리고, X를 만나면 0으로 되돌립니다. 그동안 가장 컸던 값을 \`최장\`에 기억합니다.` },
      { code: String.raw`
def 최장_연속(체크들):
    최장 = 0
    지금_연속 = 0
    for 달성 in 체크들:
        # ✏️ TODO: 달성이면 지금_연속 +1 하고 최장과 비교, 아니면 지금_연속 = 0
        pass
    return 최장

for 습관, 체크들 in csv기록.items():
    print(습관, ": 최장", 최장_연속(체크들), "일 연속")
확인("독서 최장 연속", 최장_연속(csv기록["독서 20분"]) or None, 5)
확인("취침 최장 연속", 최장_연속(csv기록["11시 전 취침"]) or None, 4)`,
        answer: String.raw`
def 최장_연속(체크들):
    최장 = 0
    지금_연속 = 0
    for 달성 in 체크들:
        if 달성:
            지금_연속 += 1
            최장 = max(최장, 지금_연속)
        else:
            지금_연속 = 0
    return 최장

for 습관, 체크들 in csv기록.items():
    print(습관, ": 최장", 최장_연속(체크들), "일 연속")
확인("독서 최장 연속", 최장_연속(csv기록["독서 20분"]) or None, 5)
확인("취침 최장 연속", 최장_연속(csv기록["11시 전 취침"]) or None, 4)` },
      { md: `### B-3. 주간 비교 그래프` },
      { code: String.raw`
import os, subprocess
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

글꼴 = "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"
if not os.path.exists(글꼴):
    try:
        subprocess.run(["apt-get", "-qq", "install", "-y", "fonts-nanum"], check=False,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        pass
if os.path.exists(글꼴):
    fm.fontManager.addfont(글꼴)
    plt.rcParams["font.family"] = "NanumGothic"
else:
    plt.rcParams["font.family"] = "Malgun Gothic"
plt.rcParams["axes.unicode_minus"] = False

이름들 = list(csv기록)
x = range(len(이름들))
plt.figure(figsize=(7, 3.5))
plt.bar([i - 0.2 for i in x], [sum(csv기록[h][:7]) for h in 이름들], width=0.4, label="1주차", color="#9FB3AA")
plt.bar([i + 0.2 for i in x], [sum(csv기록[h][7:14]) for h in 이름들], width=0.4, label="2주차", color="#10684A")
plt.xticks(list(x), 이름들)
plt.ylim(0, 7)
plt.ylabel("달성한 날 (7일 중)")
plt.title("주간 습관 달성 비교")
plt.legend()
plt.tight_layout()
plt.savefig("습관_그래프.png", dpi=150)
plt.show()
print("습관_그래프.png 저장 — 왼쪽 📁에서 내려받아 루틴북에 붙이세요")` }
    ]
  }
};
