/* 5단원 파이썬 확장 — 루틴 → 캘린더 파일(.ics) · 습관 기록 분석 */
module.exports = {
  unit: 5,
  missions: [
    { part: 2, n: 'P7', h: '루틴 목록을 캘린더 파일(.ics)로 만들어 한 번에 등록하기', body: `
      <p>반복 일정을 하나씩 클릭해 넣는 대신, 파이썬으로 <strong>.ics 캘린더 파일</strong>을 만들어 구글 캘린더에 <strong>한 번에 가져오기</strong> 합니다. .ics는 구글·애플·아웃룩 캘린더가 모두 읽는 표준 파일입니다.</p>
      <p><strong>쓰는 파이썬:</strong> 리스트 안의 딕셔너리 · 함수 · 문자열 만들기 · 파일 쓰기 · 조건문</p>
      __NB__
      <ol>
        <li>노트북 A-1: <code>일정들</code> 리스트의 날짜·시간·반복 요일을 <strong>나의 루틴</strong>으로 고칩니다.</li>
        <li>A-2 <strong>✏️</strong>: 일정 하나를 캘린더 형식 줄들로 바꾸는 함수의 빈칸(끝 시각, 제목, 반복 규칙)을 채웁니다.</li>
        <li>A-3: 검사 셀이 모두 ✅이면 <code>내_루틴.ics</code>를 내려받습니다.</li>
        <li>구글 캘린더(PC)에서 <strong>새 캘린더 "루틴 연습"</strong>을 먼저 만듭니다. (설정 → 캘린더 추가 → 새 캘린더)</li>
        <li>설정 → <strong>가져오기/내보내기</strong> → 파일 선택 → 추가할 캘린더를 <strong>"루틴 연습"</strong>으로 고르고 가져오기.</li>
        <li>휴대폰 캘린더 앱에서 일정이 반복으로 보이는지 확인합니다.</li>
      </ol>
      <div class="box warn"><span class="lbl">꼭 새 캘린더로</span>
        <p>가져온 일정은 한꺼번에 취소하기 어렵습니다. <strong>연습용 캘린더에 넣어 두면</strong> 잘못됐을 때 그 캘린더만 삭제하면 됩니다. 메뉴 이름은 업데이트로 달라질 수 있습니다. 알림은 캘린더의 기본 알림 설정이 적용됩니다.</p></div>` },

    { part: 6, n: 'P8', h: '습관 기록 분석 — 달성률 · 연속 달성일 · 주간 비교를 루틴북에', body: `
      <p>2주 동안의 습관 체크 기록(O/X)을 파이썬으로 분석해서, <strong>루틴북에 붙일 요약 보고서</strong>를 만듭니다. 내 기록이 있다면 구글 시트에서 CSV로 내려받아 그대로 넣을 수 있습니다.</p>
      <p><strong>쓰는 파이썬:</strong> CSV 읽기 · 반복문과 카운트 · 연속 구간 찾기 · 문자열로 보고서 만들기 · 파일 저장</p>
      __NB__
      <ol>
        <li>노트북 B-1: 예시 기록(14일 × 습관 4개)을 저장하고 읽습니다.</li>
        <li>B-2 <strong>✏️</strong>: 습관별 <strong>달성률(%)</strong>을 계산합니다.</li>
        <li>B-3 <strong>✏️</strong>: <strong>가장 길게 연속으로 달성한 날 수</strong>를 구하는 함수를 완성합니다.</li>
        <li>B-4: 1주차와 2주차를 비교해 오른 습관·내려간 습관을 찾습니다.</li>
        <li>B-5: 요약 보고서를 <code>루틴_보고서.txt</code>로 저장·내려받아 <strong>루틴북 5장</strong>에 붙입니다.</li>
        <li>(선택) 내 기록: 구글 시트 → 파일 → 다운로드 → <strong>CSV</strong> → Colab 왼쪽 📁에 올리고 파일 이름만 바꿔 다시 실행.</li>
      </ol>
      <pre><span class="p">나 ▶</span> 아래는 내 2주 습관 기록 분석 결과야. 잘한 점 1가지와, 다음 2주 동안
     달성률이 가장 낮은 습관을 지키기 쉽게 만드는 작은 방법 3가지를 알려 줘.
     (루틴_보고서 내용 붙여 넣기)</pre>
      <div class="box check"><span class="lbl">루틴북 연결</span>
        <p>보고서 + AI 조언 + <strong>내가 실제로 고른 방법 1가지</strong>를 함께 적으면 루브릭 "② 실생활 적용"의 증거가 됩니다. 건강 관련 목표는 무리하지 말고 필요하면 전문가와 상의하세요.</p></div>` }
  ],

  notebook: {
    file: 'unit5_python.ipynb',
    title: '5단원 파이썬 확장 — 루틴 캘린더 파일 · 습관 기록 분석',
    cells: [
      { md: `# 5단원 파이썬 확장 실습
**디지털리터러시 36시간 과정 · 나만의 디지털 루틴 만들기**

| 파트 | 연결 차시 | 내용 |
|---|---|---|
| A | 2차시 일정·할 일 관리 | 루틴 목록 → **.ics 캘린더 파일** → 구글 캘린더에 한 번에 가져오기 |
| B | 6차시 디지털 루틴북 | 습관 기록 → 달성률 · 연속 달성일 · 주간 비교 → **루틴북용 보고서** |

- **Shift + Enter**로 위에서부터 실행합니다. **✏️** 직접 채우기 · **🤖** AI 활용
- 일정 제목에 주소·전화번호·병명 같은 민감한 정보는 적지 않습니다.` },
      { code: String.raw`
def 확인(이름, 결과, 정답):
    if 결과 is None:
        print(f"⏳ {이름}: 아직 비어 있어요 — ✏️ 셀을 채우고 다시 실행하세요")
    elif 결과 == 정답:
        print(f"✅ {이름}: 정답입니다! ({결과})")
    else:
        print(f"❌ {이름}: 결과 {결과} / 기대 {정답}")

print("준비 완료")` },

      { md: `---
## A. 루틴 → 캘린더 파일(.ics)

### A-1. 나의 루틴 목록
- \`날짜\`: 첫 일정 날짜 \`YYYY-MM-DD\` / \`시작\`·\`끝\`: \`HH:MM\`
- \`반복요일\`: \`MO TU WE TH FR SA SU\` 중에서 쉼표로 (반복 없으면 빈 문자열 \`""\`)
- \`반복횟수\`: 반복 일정이 **몇 번** 생길지

👉 예시를 **나의 루틴**으로 고쳐 보세요. (날짜는 앞으로의 날짜로)` },
      { code: String.raw`
일정들 = [
    {"제목": "아침 스트레칭", "날짜": "2026-10-05", "시작": "07:00", "끝": "07:15",
     "반복요일": "MO,WE,FR", "반복횟수": 12},
    {"제목": "물 한 컵 마시기", "날짜": "2026-10-05", "시작": "08:30", "끝": "08:35",
     "반복요일": "MO,TU,WE,TH,FR,SA,SU", "반복횟수": 28},
    {"제목": "디지털리터러시 복습", "날짜": "2026-10-07", "시작": "19:00", "끝": "19:30",
     "반복요일": "", "반복횟수": 0},
]

for 일정 in 일정들:
    반복 = f'{일정["반복요일"]} × {일정["반복횟수"]}회' if 일정["반복요일"] else "한 번"
    print(f'{일정["날짜"]} {일정["시작"]}~{일정["끝"]}  {일정["제목"]}  ({반복})')` },

      { md: `### A-2. ✏️ 일정 하나를 캘린더 형식으로
.ics 파일은 이런 **글자 줄**로 이루어집니다.

\`\`\`
BEGIN:VEVENT
UID:고유번호
DTSTAMP:20261001T000000Z
DTSTART;TZID=Asia/Seoul:20261005T070000     ← 시작 (2026-10-05 07:00)
DTEND;TZID=Asia/Seoul:20261005T071500       ← 끝
SUMMARY:아침 스트레칭                        ← 제목
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=12   ← 반복 규칙 (반복일 때만)
END:VEVENT
\`\`\`
**TODO 3곳**: DTEND 줄, SUMMARY 줄, 반복일 때 RRULE 줄을 추가하세요.` },
      { code: String.raw`
import uuid
from datetime import datetime, timezone

def 시각_변환(날짜, 시각):
    # "2026-10-05", "07:00" → "20261005T070000"
    return 날짜.replace("-", "") + "T" + 시각.replace(":", "") + "00"

def 글자_정리(글):
    # 캘린더 파일에서 특별한 뜻이 있는 글자 앞에 \ 를 붙입니다
    return 글.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;")

def 일정_줄들(일정):
    줄들 = [
        "BEGIN:VEVENT",
        "UID:" + str(uuid.uuid4()),
        "DTSTAMP:" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
        "DTSTART;TZID=Asia/Seoul:" + 시각_변환(일정["날짜"], 일정["시작"]),
    ]
    # ✏️ TODO 1: DTEND 줄 추가 (시작 줄과 같은 모양, 일정["끝"] 사용)
    # ✏️ TODO 2: SUMMARY 줄 추가 (제목은 글자_정리()를 거쳐서)
    # ✏️ TODO 3: 반복요일이 있으면 RRULE:FREQ=WEEKLY;BYDAY=...;COUNT=... 줄 추가
    줄들.append("END:VEVENT")
    return 줄들

print("\n".join(일정_줄들(일정들[0])))`,
        answer: String.raw`
import uuid
from datetime import datetime, timezone

def 시각_변환(날짜, 시각):
    # "2026-10-05", "07:00" → "20261005T070000"
    return 날짜.replace("-", "") + "T" + 시각.replace(":", "") + "00"

def 글자_정리(글):
    # 캘린더 파일에서 특별한 뜻이 있는 글자 앞에 \ 를 붙입니다
    return 글.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;")

def 일정_줄들(일정):
    줄들 = [
        "BEGIN:VEVENT",
        "UID:" + str(uuid.uuid4()),
        "DTSTAMP:" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
        "DTSTART;TZID=Asia/Seoul:" + 시각_변환(일정["날짜"], 일정["시작"]),
    ]
    줄들.append("DTEND;TZID=Asia/Seoul:" + 시각_변환(일정["날짜"], 일정["끝"]))
    줄들.append("SUMMARY:" + 글자_정리(일정["제목"]))
    if 일정["반복요일"]:
        줄들.append(f'RRULE:FREQ=WEEKLY;BYDAY={일정["반복요일"]};COUNT={일정["반복횟수"]}')
    줄들.append("END:VEVENT")
    return 줄들

print("\n".join(일정_줄들(일정들[0])))` },

      { md: `### A-3. 파일로 저장하고 검사하기
캘린더 파일은 줄 끝을 \`\\r\\n\`으로 씁니다. 검사가 모두 ✅이면 내려받습니다.` },
      { code: String.raw`
def ics_만들기(일정들, 파일이름="내_루틴.ics"):
    줄들 = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//digital36//routine//KO",
           "CALSCALE:GREGORIAN", "X-WR-CALNAME:루틴 연습", "X-WR-TIMEZONE:Asia/Seoul"]
    for 일정 in 일정들:
        줄들 += 일정_줄들(일정)
    줄들.append("END:VCALENDAR")
    with open(파일이름, "w", encoding="utf-8", newline="") as f:
        f.write("\r\n".join(줄들) + "\r\n")
    return 줄들

줄들 = ics_만들기(일정들)
본문 = "\n".join(줄들)

확인("일정 개수", 본문.count("BEGIN:VEVENT"), len(일정들))
확인("끝 시각 줄(DTEND) 개수", 본문.count("DTEND;") or None, len(일정들))
확인("제목 줄(SUMMARY) 개수", 본문.count("SUMMARY:") or None, len(일정들))
확인("반복 규칙(RRULE) 개수", 본문.count("RRULE:") or None, sum(1 for 일정 in 일정들 if 일정["반복요일"]))
시작_끝_정상 = all(일정["시작"] < 일정["끝"] for 일정 in 일정들)
print("✅ 모든 일정의 끝 시각이 시작보다 늦습니다" if 시작_끝_정상 else "❌ 끝 시각이 시작보다 빠른 일정이 있습니다")` },
      { code: String.raw`
# 내려받기 — Colab에서는 브라우저 다운로드가 시작됩니다
try:
    from google.colab import files
    files.download("내_루틴.ics")
except ImportError:
    print("Colab이 아닌 환경입니다. 이 노트북과 같은 폴더에 내_루틴.ics 가 저장되었습니다.")` },
      { md: `### A-4. 구글 캘린더로 가져오기 (PC)
1. 구글 캘린더 → ⚙️ 설정 → **캘린더 추가 → 새 캘린더** → 이름 \`루틴 연습\` → 만들기
2. 설정 → **가져오기/내보내기** → 컴퓨터에서 파일 선택 → \`내_루틴.ics\`
3. **캘린더에 추가**: \`루틴 연습\` 선택 → **가져오기**
4. 휴대폰 캘린더 앱에서 반복 일정으로 보이는지 확인

> 메뉴 이름은 업데이트로 달라질 수 있습니다. 잘못 들어갔다면 **루틴 연습 캘린더만 삭제**하면 됩니다.

🤖 **도전**: "위 \`일정_줄들\` 함수에 **격주 반복**(2주마다)을 넣으려면 RRULE을 어떻게 바꿔야 해?" → 받은 답을 코드에 넣고 캘린더로 확인` },

      { md: `---
## B. 습관 기록 분석 → 루틴북 보고서

### B-1. 기록 파일 준비
2주(14일) 동안 습관 4개를 체크한 **예시 기록**입니다. O = 달성, X = 미달성
내 기록을 쓸 때는 구글 시트에서 같은 모양(첫 줄 \`날짜,습관1,습관2,...\`)으로 만들어 **CSV로 내려받은 뒤** 왼쪽 📁에 올리고 \`파일이름\`만 바꾸세요.` },
      { code: String.raw`
예시_기록 = """날짜,운동,물 8잔,독서 20분,11시 전 취침
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
    f.write(예시_기록)

import csv
파일이름 = "습관기록.csv"   # 내 기록이면 이 이름을 바꾸세요

with open(파일이름, encoding="utf-8-sig") as f:
    읽기 = csv.reader(f)
    머리줄 = next(읽기)
    행들 = [행 for 행 in 읽기 if 행]

습관들 = 머리줄[1:]
날짜들 = [행[0] for 행 in 행들]
기록 = {습관: [행[i + 1].strip().upper() == "O" for 행 in 행들] for i, 습관 in enumerate(습관들)}

print(f"{len(날짜들)}일 · 습관 {len(습관들)}개: {습관들}")
print("운동:", ["O" if x else "X" for x in 기록["운동"]] if "운동" in 기록 else "")` },

      { md: `### B-2. ✏️ 달성률
\`True\`는 1, \`False\`는 0처럼 더할 수 있습니다. 달성률(%) = 달성한 날 ÷ 전체 날 × 100 (소수 첫째 자리)` },
      { code: String.raw`
def 달성률(체크들):
    # ✏️ TODO: 체크들(True/False 리스트)의 달성률(%)을 소수 첫째 자리까지 돌려주세요
    return None

for 습관, 체크들 in 기록.items():
    print(f"{습관:<10} {달성률(체크들)}%")`,
        answer: String.raw`
def 달성률(체크들):
    if not 체크들:
        return 0.0
    return round(sum(체크들) / len(체크들) * 100, 1)

for 습관, 체크들 in 기록.items():
    print(f"{습관:<10} {달성률(체크들)}%")` },
      { code: String.raw`
확인("운동 달성률", 달성률(기록["운동"]), 71.4)
확인("물 8잔 달성률", 달성률(기록["물 8잔"]), 42.9)` },

      { md: `### B-3. ✏️ 가장 긴 연속 달성일
O가 이어지면 \`지금_연속\`을 1 늘리고, X를 만나면 0으로 되돌립니다. 그동안 가장 컸던 값을 \`최장\`에 기억합니다.` },
      { code: String.raw`
def 최장_연속(체크들):
    최장 = 0
    지금_연속 = 0
    for 달성 in 체크들:
        # ✏️ TODO: 달성이면 지금_연속 +1 하고 최장과 비교, 아니면 지금_연속 = 0
        pass
    return 최장

for 습관, 체크들 in 기록.items():
    print(f"{습관:<10} 최장 {최장_연속(체크들)}일 연속")`,
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

for 습관, 체크들 in 기록.items():
    print(f"{습관:<10} 최장 {최장_연속(체크들)}일 연속")` },
      { code: String.raw`
확인("독서 최장 연속", 최장_연속(기록["독서 20분"]) or None, 5)
확인("취침 최장 연속", 최장_연속(기록["11시 전 취침"]) or None, 4)` },

      { md: `### B-4. 1주차 vs 2주차` },
      { code: String.raw`
print(f"{'습관':<10} {'1주차':>6} {'2주차':>6}  변화")
for 습관, 체크들 in 기록.items():
    주1, 주2 = sum(체크들[:7]), sum(체크들[7:14])
    화살표 = "▲" if 주2 > 주1 else ("▼" if 주2 < 주1 else "=")
    print(f"{습관:<10} {주1:>4}/7 {주2:>4}/7   {화살표} {주2 - 주1:+d}  " + "■" * 주2 + "□" * (7 - 주2))` },

      { md: `### B-5. 루틴북용 보고서 만들기` },
      { code: String.raw`
줄 = []
줄.append(f"[나의 습관 기록 보고서] {날짜들[0]} ~ {날짜들[-1]} ({len(날짜들)}일)")
줄.append("")
for 습관, 체크들 in sorted(기록.items(), key=lambda x: -sum(x[1])):
    막대 = "■" * round((달성률(체크들) or 0) / 10)
    줄.append(f"- {습관}: 달성률 {달성률(체크들)}% {막대} / 최장 {최장_연속(체크들)}일 연속 / 1주차 {sum(체크들[:7])}회 → 2주차 {sum(체크들[7:14])}회")
가장_낮은 = min(기록, key=lambda h: sum(기록[h]))
가장_오른 = max(기록, key=lambda h: sum(기록[h][7:14]) - sum(기록[h][:7]))
줄.append("")
줄.append(f"잘한 점: '{가장_오른}' 습관이 2주차에 가장 많이 늘었다.")
줄.append(f"다음 목표: 달성률이 가장 낮은 '{가장_낮은}' 습관을 지키기 쉽게 바꾼다.")
줄.append("내가 고른 방법(직접 적기): ____________________")
보고서 = "\n".join(줄)
print(보고서)

with open("루틴_보고서.txt", "w", encoding="utf-8") as f:
    f.write(보고서)
try:
    from google.colab import files
    files.download("루틴_보고서.txt")
except ImportError:
    print("\n(루틴_보고서.txt 저장 완료)")` },
      { md: `### B-6. 🤖 AI에게 조언 받기 → 내가 고르기
보고서를 복사해 AI에게 보내고, **작은 방법 3가지** 중 **내가 실제로 할 1가지**를 골라 보고서 마지막 줄에 적습니다.

\`\`\`
나 ▶ 아래는 내 2주 습관 기록 분석 결과야. 잘한 점 1가지와, 달성률이 가장 낮은 습관을
     지키기 쉽게 만드는 작은 방법 3가지를 알려 줘. (보고서 붙여 넣기)
\`\`\`

#### (선택) 그래프로 루틴북 꾸미기` },
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

이름들 = list(기록)
x = range(len(이름들))
plt.figure(figsize=(7, 3.5))
plt.bar([i - 0.2 for i in x], [sum(기록[h][:7]) for h in 이름들], width=0.4, label="1주차", color="#9FB3AA")
plt.bar([i + 0.2 for i in x], [sum(기록[h][7:14]) for h in 이름들], width=0.4, label="2주차", color="#10684A")
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
