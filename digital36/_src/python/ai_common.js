/* AI × PYTHON 노트북 공통 셀 — 모든 unitN_ai.js 가 맨 앞에 넣습니다 */
const howto = `### 이 노트북에서 AI를 부르는 방법
파이썬 함수 **\`AI("질문")\`** 한 줄로 생성형 AI에게 묻고, 답을 **문자열**로 돌려받습니다. 받은 답은 리스트에 담고, \`for\`로 돌리고, \`if\`로 검사할 수 있습니다.

| 순서 | 연결 방식 | 필요한 것 |
|---|---|---|
| ① | **Colab 내장 AI** (\`google.colab.ai\`) | 구글 계정 로그인만. 계정 · 지역에 따라 아직 열리지 않았거나 사용량 제한이 있을 수 있음 |
| ② | **Gemini API 키** | [Google AI Studio](https://aistudio.google.com/apikey)에서 무료 키 발급 → 왼쪽 🔑 **보안 비밀**에 이름 \`GOOGLE_API_KEY\`로 저장 → 노트북 액세스 켜기 |
| ③ | **연습 모드** | 아무것도 없어도 됨 — 미리 준비한 답으로 파이썬 부분을 끝까지 연습 |

①이 되면 ①, 안 되면 ②, 둘 다 안 되면 ③으로 **자동으로** 넘어갑니다. 아래 셀을 실행하면 지금 어떤 방식인지 알려 줍니다.

> ⚠️ **개인정보 금지** — 이름 · 전화번호 · 주민번호 · 계좌 · 비밀번호는 AI에 보내지 않습니다. AI의 답은 **참고용**이고, 사실은 파이썬과 공식 자료로 다시 확인합니다.`;

const helper = `
# 🤖 AI 연결 도우미 — 맨 먼저 한 번 실행하세요 (고칠 필요 없음)
import textwrap, random

제미나이_모델 = "gemini-2.5-flash"   # ② API 키 방식에서 쓸 모델 (서비스가 바뀌면 이름만 고치세요)
연습_규칙 = []                        # ③ 연습 모드에서 쓸 (키워드, 답) 목록 — 미션마다 채웁니다
_방식 = None

def _연습_답(질문):
    for 키워드, 답 in 연습_규칙:
        if 키워드 in 질문:
            return 답() if callable(답) else 답
    return random.choice([
        "(연습 모드) 좋은 질문이에요. 실제 AI에 연결되면 이 자리에 진짜 답이 나옵니다.",
        "(연습 모드) 요청하신 내용을 정리하면 다음과 같습니다. 1) 핵심 확인 2) 실행 3) 점검",
        "(연습 모드) 지금은 미리 준비한 답입니다. 결과를 꼭 다시 확인하세요.",
    ])

def AI(질문, 보여주기=False):
    """생성형 AI에게 질문하고 답(문자열)을 돌려줍니다."""
    global _방식
    질문 = str(질문)
    답 = None
    if _방식 in (None, "Colab 내장 AI"):
        try:
            from google.colab import ai as _colab_ai
            답 = str(_colab_ai.generate_text(질문)).strip()
            _방식 = "Colab 내장 AI"
        except Exception:
            답 = None
    if 답 is None and _방식 in (None, "Gemini API 키"):
        try:
            from google.colab import userdata
            from google import genai
            _client = genai.Client(api_key=userdata.get("GOOGLE_API_KEY"))
            답 = _client.models.generate_content(model=제미나이_모델, contents=질문).text.strip()
            _방식 = "Gemini API 키"
        except Exception:
            답 = None
    if 답 is None:
        _방식 = "연습 모드"
        답 = _연습_답(질문)
    if 보여주기:
        for 줄 in 답.split("\\n"):
            print(textwrap.fill(줄, 70) if 줄 else "")
    return 답

def 확인(이름, 결과, 정답):
    if 결과 is None:
        print("⏳", 이름, ": 아직 비어 있어요. ✏️ 줄을 채우고 다시 실행하세요")
    elif 결과 == 정답:
        print("✅", 이름, ": 정답입니다!")
    else:
        print("❌", 이름, ": 결과", 결과, "/ 기대", 정답)

시험 = AI("한 문장으로 인사해 줘. 이모지 하나 넣어서.")
print("연결 방식:", _방식)
print("AI ▶", 시험)
if _방식 == "연습 모드":
    print("ℹ️ 실제 AI에 연결되지 않아 연습 모드로 진행합니다. 파이썬 부분은 똑같이 연습할 수 있어요.")`;

module.exports = { howto, helper };
