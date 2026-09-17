#!/usr/bin/env node
/* ------------------------------------------------------------------
   digital36 정적 사이트 빌더 — 「디지털리터러시」 36시간 과정
   사용법:  node _src/build.js            (전체 단원 빌드)
            node _src/build.js 2 4        (2·4 단원만 빌드)

   내용을 고치려면 _src/unitN.js 만 수정하고 다시 빌드하면 됩니다.
   과정 정보(교과명·교수명·평가 등)는 아래 COURSE_INFO 에 있습니다.
   디자인(CSS)은 _src/css/*.css, 동작(JS)은 _src/js/*.js 에 있습니다.
   ------------------------------------------------------------------ */
const fs = require('fs');
const path = require('path');

const SRC  = __dirname;
const ROOT = path.resolve(SRC, '..');
const read = p => fs.readFileSync(path.join(SRC, p), 'utf8');

/* ====== 과정 정보 (운영계획서 표에 그대로 들어갑니다) ====== */
const TOTAL_UNITS = 5;
const COURSE = '디지털리터러시';
const COURSE_LONG = '「디지털리터러시」 36시간 과정';
const ORG = '한국폴리텍대학 분당융합기술교육원';
const COURSE_INFO = {
  name: '디지털리터러시',
  job: '정보통신IT',
  kind: 'AX교과(실습)',
  hours: 36,
  prof: '김남호',
  room: '401호',
  goal: '생성형 인공지능을 활용하여 교육생이 디지털 사회에서 실생활 문제를 스스로 해결할 수 있는 역량을 기른다.',
  book: '자체교재 (본 강의 사이트: 강의 슬라이드 · 차시별 교안 · 실습지 · 퀴즈)',
  period: '1차시 = 50분 수업 + 10분 휴식 · 설명 15~20분 / 실습 30~35분 (실습 비중 약 70%)',
  env: 'PC실(인터넷) · 개인 스마트폰 · 구글 계정 · 모든 실습은 무료 서비스로 진행',
  evals: [
    ['실습 결과물 (포트폴리오)', 40, '단원별 실습지·과제 제출물. 5단원 「나만의 디지털 루틴북」으로 묶어 제출'],
    ['최종 프로젝트 발표', 30, '5단원 7차시. 루틴북 발표 3분 — 문제 인식 · 도구 활용 · 검증 · 실천 가능성'],
    ['수업 참여 · 단원 퀴즈', 20, '단원별 퀴즈 15문항(80% 이상 통과) · 실습 참여 관찰 체크리스트'],
    ['사전·사후 역량 향상도', 10, '1단원 1차시 사전 자가진단 ↔ 5단원 7차시 사후 자가진단 비교']
  ]
};
/* 파이썬 확장 노트북 — Colab '깃허브에서 열기' 주소에 쓰입니다 (저장소·브랜치가 다르면 고치세요) */
const GITHUB = { repo: 'bctcaiedu/bctcaiedu.github.io', branch: 'main', dir: 'digital36' };
const colabUrl = file => `https://colab.research.google.com/github/${GITHUB.repo}/blob/${GITHUB.branch}/${GITHUB.dir}/python/${file}`;
/* ============================================================ */

const CSS = {
  deck: read('css/deck.css'),
  lab:  read('css/lab.css'),
  quiz: read('css/quiz.css')
};
const JS = {
  deck: read('js/deck.js'),
  quiz: read('js/quiz.js'),
  nav:  read('js/nav.tpl.js')
};

const META =
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">';

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&display=swap">';

const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* 단원 앞까지 누적 차시 → 과정 전체 차시 번호 (1~36) */
function offsetOf(all, unit) {
  return all.filter(u => u.unit < unit).reduce((s, u) => s + u.hours, 0);
}

/* 문서형 페이지 공통 스타일 (교안 · 운영계획서) */
const DOC_EXTRA = `
  .form{width:100%;border-collapse:collapse;min-width:0;background:var(--surface);font-size:14px}
  .form th,.form td{border:1px solid var(--line-strong);padding:10px 12px;vertical-align:middle;text-align:left}
  .form th{background:var(--surface-2);font-family:var(--sans);font-size:13.5px;letter-spacing:0;text-transform:none;
           color:var(--ink);font-weight:700;text-align:center;white-space:nowrap}
  .form td.c{text-align:center}
  .form td ul{margin:0;padding-left:17px}
  .form td li{margin:2px 0;font-size:13.5px;line-height:1.6;color:var(--ink-2)}
  .form .stage{font-weight:700;text-align:center;white-space:nowrap}
  .form .min{font-family:var(--mono);font-size:12px;text-align:center;white-space:nowrap;color:var(--muted)}
  .form .ttl{font-size:17px;font-weight:700;text-align:center;padding:14px}
  .form .sec{background:var(--surface-2);font-weight:700;text-align:left;font-size:14.5px}
  .form tr.u td{background:var(--accent-soft);font-weight:600}
  .formwrap{overflow-x:auto;margin-top:14px}
  .lesson{margin-bottom:30px;break-inside:avoid;page-break-inside:avoid}
  .lesson .form{min-width:620px}
  .lnk{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
  .lnk a{font-family:var(--mono);font-size:11.5px;letter-spacing:.05em;border:1px solid var(--line-strong);border-radius:4px;padding:6px 11px;background:var(--surface)}
  .printbtn{font-family:var(--sans);font-size:13px;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink);border-radius:4px;padding:7px 13px;cursor:pointer}
  @media print{
    :root{--bg:#fff;--surface:#fff;--surface-2:#EEE;--ink:#000;--ink-2:#111;--muted:#444;--line:#999;--line-strong:#777;--accent:#000;--accent-soft:#F2F2F2}
    header.top{border:0} .masthead{padding-block:0 12px} section{padding-block:14px}
    .printbtn,.lnk,footer{display:none!important}
    .form th,.form td{padding:6px 8px;font-size:11.5px} .form td li{font-size:11.5px}
  }`;

/* =================================================================
   1. 나레이션 슬라이드  (unitN/index.html)
   ================================================================= */
function buildDeck(D) {
  const S = [];
  const U = `UNIT ${pad(D.unit)}`;

  S.push(slide('dk', `
    <div class="fill">
      <div class="eb">${ORG} · ${COURSE_LONG}</div>
      <h1>${D.title.replace(/ · /g, '<br>').replace(/: /, ':<br>')}</h1>
      <div class="lead">${D.theme}</div>
      <div class="sub" style="margin-top:3cqh">${U} / ${pad(TOTAL_UNITS)} · ${D.hours}시간 · 교수 ${COURSE_INFO.prof}</div>
    </div>`, D.openingNar));

  S.push(slide('', `
    <div class="eb">Learning Objectives</div>
    <h2>이 단원이 끝나면 할 수 있는 것</h2>
    <div class="fill"><div class="grid g2" style="margin-top:2cqh">
      ${D.goals.map((g, i) => `<div class="card"><span class="n">${pad(i + 1)}</span><span class="t">${g[0]}</span><span class="d">${g[1]}</span></div>`).join('\n      ')}
    </div></div>`, D.goalsNar));

  S.push(slide('', `
    <div class="eb">Lesson Plan · ${D.hours} Hours</div>
    <h2>${D.hours}개의 차시로 진행합니다</h2>
    <div class="fill"><div class="grid g4" style="margin-top:2cqh">
      ${D.blocks.map(b => `<div class="card"><span class="n">${b.time}</span><span class="t">${b.title}</span><span class="d">${b.desc}</span></div>`).join('\n      ')}
    </div></div>
    <div class="foot">1차시 = 50분 수업 + 10분 휴식 · 설명 15~20분, 실습 30~35분</div>`, D.blocksNar));

  D.slides.forEach(s => {
    if (s.section) {
      S.push(slide('dk', `
    <div class="fill">
      <div class="eb">${s.eb || ''}</div>
      <h2>${s.h}</h2>
      <div class="sub">${s.sub || ''}</div>
    </div>`, s.nar));
    } else {
      S.push(slide(s.dark ? 'dk' : '', `
    ${s.eb ? `<div class="eb">${s.eb}</div>` : ''}
    <h2>${s.h}</h2>
    ${s.sub ? `<div class="sub">${s.sub}</div>` : ''}
    ${s.lead ? `<div class="lead">${s.lead}</div>` : ''}
    <div class="fill">${s.body || ''}</div>
    ${s.foot ? `<div class="foot">${s.foot}</div>` : ''}`, s.nar));
    }
  });

  S.push(slide('dk', `
    <div class="eb">Assignment ${pad(D.unit)} · ${D.assignment.due || '다음 수업 시작 전'}</div>
    <h2>${D.assignment.title}</h2>
    <div class="sub">${D.assignment.lede}</div>
    <div class="fill"><div class="grid g3" style="margin-top:2cqh">
      ${D.assignment.items.map((t, i) => `<div class="card"><span class="n">${pad(i + 1)}</span><span class="t">${t}</span></div>`).join('\n      ')}
    </div></div>
    <div class="foot">${D.assignment.note}</div>`, D.assignment.nar));

  S.push(slide('dk', `
    <div class="fill">
      <div class="eb">Wrap-up</div>
      <h2>이번 단원에서 한 일</h2>
      <div class="sub" style="font-size:3.4cqh;color:#D7E2DC;margin-top:2cqh">${D.wrap.done}</div>
      <div class="lead" style="margin-top:4cqh">${D.wrap.next}</div>
      <div class="sub">${D.wrap.nextDesc}</div>
    </div>`, D.wrap.nar));

  S[0] = S[0].replace(/^<section class="slide([^"]*)"/, '<section class="slide$1 show"');

  const n = S.length;
  return `<!doctype html>
<html lang="ko">
${META}
<title>${D.unit}단원 강의 슬라이드 · ${COURSE}</title>
${FONTS}
<style>
${CSS.deck}
</style>

<div class="bar">
  <span class="brand">${U} · ${D.title} · 강의 슬라이드</span>
  <button id="prev" title="이전 (←)">◀</button>
  <span class="count" id="count">1 / ${n}</span>
  <button id="next" title="다음 (→)">▶</button>
  <button class="play" id="play" title="재생 / 정지 (Space)">▶ 재생</button>
  <button id="auto" class="on" title="나레이션이 끝나면 자동으로 다음 장">자동 진행</button>
  <select id="rate" title="말하기 속도">
    <option value="0.85">0.85배</option>
    <option value="1" selected>1.0배</option>
    <option value="1.15">1.15배</option>
    <option value="1.3">1.3배</option>
    <option value="1.5">1.5배</option>
  </select>
  <button id="vf" class="on" title="여성 목소리">여성</button>
  <button id="vm" title="남성 목소리">남성</button>
  <select id="voice" title="목소리"></select>
  <button id="cap" class="on" title="자막">자막</button>
  <button id="full" title="전체화면 (F)">전체화면</button>
</div>
<div class="prog"><i id="prog"></i></div>

<div class="wrap"><div class="stage" id="stage">
${S.join('\n')}
</div></div>

<div class="cap"><p id="capText" class="idle">▶ 재생을 누르면 나레이션이 시작됩니다 · ← → 슬라이드 이동 · Space 재생/정지 · F 전체화면</p></div>
<div class="toast" id="toast"></div>

<script>
${JS.deck}
</script>
<script src="../nav.js"></script>
</html>
`;
}

function slide(cls, inner, nar) {
  return `<section class="slide${cls ? ' ' + cls : ''}">${inner}
  <div class="nar">${(nar || '').trim()}</div>
</section>`;
}

function pyRows(D, no) {
  const part = D.lab.parts[no - 1];
  const ms = part ? (part.missions || []).filter(m => m.py) : [];
  if (!ms.length) return '';
  return `<tr><td class="stage">확장<br>(선택)</td><td><ul>${ms.map(m => `<li><strong>파이썬 ${m.n}</strong> ${m.h} — 실습을 먼저 마친 교육생 또는 과제로 진행 · <a href="../python/${D.py.notebook.file}" download>노트북</a> · <a href="../python/answers/${answerName(D.py.notebook.file)}" download>답안</a></li>`).join('')}</ul></td><td class="min">선택</td></tr>`;
}

/* =================================================================
   2. 차시별 교안  (unitN/lesson.html)
   ================================================================= */
function buildLesson(D, all) {
  const off = offsetOf(all, D.unit);
  const li = arr => `<ul>${(arr || []).map(x => `<li>${x}</li>`).join('')}</ul>`;

  const summary = `
  <section>
    <div class="part"><span class="pn">개요</span><h2>${D.unit}단원 차시 구성</h2><span class="pt">${D.hours}시간</span></div>
    <div class="formwrap"><table class="form">
      <thead><tr><th>과정 차시</th><th>단원 차시</th><th>차시명</th><th>학습목표</th><th>교수방법</th></tr></thead>
      <tbody>
      ${D.lesson.map(L => `<tr><td class="c">${off + L.no}</td><td class="c">${L.no}</td><td>${L.title}</td><td>${L.objective}</td><td class="c">${L.method}</td></tr>`).join('\n      ')}
      </tbody>
    </table></div>
    <div class="formwrap"><table class="form">
      <tbody>
        <tr><th style="width:130px">단원 학습목표</th><td>${li(D.goals.map(g => g[0] + ' ' + g[1]))}</td></tr>
        <tr><th>단원 과제</th><td><strong>${D.assignment.title}</strong> — ${D.assignment.lede}</td></tr>
      </tbody>
    </table></div>
  </section>`;

  const each = D.lesson.map(L => `
  <section class="lesson">
    <div class="part"><span class="pn">${L.no}차시 · 과정 ${off + L.no}/${COURSE_INFO.hours}</span><h2>${L.title}</h2><span class="pt">50분</span></div>
    <div class="formwrap"><table class="form">
      <colgroup><col style="width:92px"><col><col style="width:70px"></colgroup>
      <tbody>
        <tr><th>학습목표</th><td colspan="2">${L.objective}</td></tr>
        <tr><th>단계</th><th>교수 · 학습 활동</th><th>시간</th></tr>
        <tr><td class="stage">도입</td><td>${li(L.intro)}</td><td class="min">5분</td></tr>
        <tr><td class="stage">전개</td><td>${li(L.main)}</td><td class="min">35분</td></tr>
        <tr><td class="stage">정리</td><td>${li(L.close)}</td><td class="min">10분</td></tr>
        ${pyRows(D, L.no)}
        <tr><th>교수방법</th><td colspan="2">${L.method}</td></tr>
        <tr><th>준비물·매체</th><td colspan="2">${L.material}</td></tr>
        <tr><th>평가</th><td colspan="2">${L.eval}</td></tr>
      </tbody>
    </table></div>
  </section>`).join('\n');

  return `<!doctype html>
<html lang="ko">
${META}
<title>${D.unit}단원 차시별 교안 · ${COURSE}</title>
${FONTS}
<style>
${CSS.lab}
${DOC_EXTRA}
</style>

<header class="top">
  <div class="wrap masthead">
    <div class="rule-tag">
      <span class="eyebrow">${ORG}</span>
      <span class="dash"></span>
      <span class="eyebrow">교수자용 차시별 교안</span>
    </div>
    <h1>${D.unit}단원 · <em>${D.title}</em></h1>
    <p class="standfirst">${D.theme} — 교과목 「${COURSE_INFO.name}」 · ${COURSE_INFO.kind} · 교수 ${COURSE_INFO.prof} · 훈련시설 ${COURSE_INFO.room}</p>
    <div class="lnk">
      <a href="index.html">강의 슬라이드</a><a href="lab.html">실습지</a><a href="quiz.html">퀴즈</a><a href="../plan.html">운영계획서</a>
      <button class="printbtn" onclick="window.print()">🖨 인쇄 / PDF 저장</button>
    </div>
  </div>
</header>

<div class="wrap">
${summary}
${each}
</div>

<footer><div class="wrap"><p>UNIT ${pad(D.unit)} / ${pad(TOTAL_UNITS)} · 차시별 교안 · ${COURSE_LONG}</p></div></footer>
<script src="../nav.js"></script>
</html>
`;
}

/* =================================================================
   3. 실습지  (unitN/lab.html)
   ================================================================= */
function buildLab(D) {
  const L = D.lab;

  const parts = L.parts.map(p => `
  <section>
    <div class="part"><span class="pn">${p.pn}</span><h2>${p.h}</h2>${p.time ? `<span class="pt">${p.time}</span>` : ''}</div>
    ${p.lede ? `<p class="lede">${p.lede}</p>` : ''}
    ${(p.steps || []).map(s => `
    <div class="stepc">
      <div class="shead"><span class="sn">${s.sn}</span><h3>${s.h}</h3></div>
      <div class="sbody">${s.body}</div>
    </div>`).join('\n')}
    ${(p.missions || []).map(m => `
    <div class="mission${m.py ? ' py' : ''}">
      <div class="mhead"><span class="mn">${m.py ? `PYTHON ${m.n} · 선택` : `MISSION ${pad(m.n)}`}</span><h3>${m.h}</h3></div>
      ${m.body}
    </div>`).join('\n')}
  </section>`).join('\n');

  const errs = `
  <section>
    <div class="part"><span class="pn">부록 A</span><h2>이럴 땐 이렇게</h2></div>
    <p class="lede">수업 중에 자주 막히는 상황입니다. 여기 없는 문제는 손을 들어 주세요.</p>
    <div class="tablewrap">
      <table>
        <thead><tr><th>이런 일이 생기면</th><th>원인</th><th>해결 방법</th></tr></thead>
        <tbody>
          ${L.errors.map(e => `<tr><td>${e[0]}</td><td>${e[1]}</td><td>${e[2]}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </div>
  </section>`;

  const quizLink = `
  <section>
    <div class="part"><span class="pn">부록 B</span><h2>단원 퀴즈</h2></div>
    <p class="lede">미션을 마쳤으면 퀴즈로 점검합니다. 채점은 바로 나오고, 틀린 문제에는 해설이 붙습니다.</p>
    <div class="stepc">
      <div class="shead"><span class="sn">QUIZ</span><h3>${D.unit}단원 · ${D.quiz.length}문항</h3></div>
      <div class="sbody">
        <p>객관식과 직접 입력이 섞여 있습니다. 실습지를 다시 보지 말고 먼저 풀어 본 뒤, 틀린 부분만 해당 미션으로 돌아가 확인하세요.</p>
        <p style="margin-top:12px;font-size:16px"><a href="quiz.html">▶ 퀴즈 풀러 가기</a></p>
        <div class="box check">
          <span class="lbl">통과 기준</span>
          <p>${D.quiz.length}문항 중 <strong>${Math.ceil(D.quiz.length * 0.8)}문항 이상</strong>을 맞히면 이 단원을 소화한 것입니다.</p>
        </div>
      </div>
    </div>
  </section>`;

  const check = `
  <section>
    <div class="part"><span class="pn">부록 C</span><h2>단원 마치기 전 자가 점검</h2></div>
    <p class="lede">모두 체크되면 이 단원의 목표를 달성한 것입니다. 안 되는 항목은 수업이 끝나기 전에 질문하세요.</p>
    <div class="selfcheck">
      <h3>${D.unit}단원 체크리스트</h3>
      <ul>
        ${L.checklist.map(c => `<li>${c}</li>`).join('\n        ')}
      </ul>
    </div>
  </section>`;

  const asg = `
  <section>
    <div class="part"><span class="pn">과제 ${pad(D.unit)}</span><h2>${D.assignment.title}</h2><span class="pt">제출: ${D.assignment.due || '다음 수업 시작 전'}</span></div>
    <p class="lede">${D.assignment.lede}</p>
    <div class="stepc">
      <div class="shead"><span class="sn">제출 항목</span><h3>${D.assignment.subtitle || '각 항목마다 결과 화면 캡처와 사용한 질문(프롬프트)을 함께 붙일 것'}</h3></div>
      <div class="sbody">
        <ol>${D.assignment.items.map(t => `<li>${t}</li>`).join('')}</ol>
        ${D.assignment.sample ? `<span class="prelbl">제출 양식 예시</span><pre>${D.assignment.sample}</pre>` : ''}
        <div class="box check"><span class="lbl">채점 기준</span><p>${D.assignment.note}</p></div>
      </div>
    </div>
  </section>`;

  return `<!doctype html>
<html lang="ko">
${META}
<title>${D.unit}단원 실습지 · ${COURSE}</title>
${FONTS}
<style>
${CSS.lab}
  pre{white-space:pre-wrap;word-break:keep-all;font-family:var(--sans);font-size:13.5px}
  .mission.py{border-left-color:var(--ask)}
  .mission.py .mn{color:var(--ask)}
  .nb{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0 4px;padding:10px 12px;background:var(--ask-soft);border-radius:4px}
  .nb b{font-size:13px;color:var(--ink-2);margin-right:4px}
  .nb a{font-family:var(--mono);font-size:11.5px;border:1px solid var(--ask);color:var(--ask);border-radius:4px;padding:5px 10px;background:var(--surface)}
  .nb a:hover{background:var(--ask);color:#fff}
  .nb small{flex-basis:100%;font-size:12px;color:var(--muted)}
  @media print{ .l70nav{display:none} pre{background:#F2F2F2;color:#000} pre .p,pre .o,pre .c{color:#000} }
</style>

<header class="top">
  <div class="wrap masthead">
    <div class="rule-tag">
      <span class="eyebrow">${ORG}</span>
      <span class="dash"></span>
      <span class="eyebrow">학생용 실습지</span>
    </div>
    <h1>${D.unit}단원 · <em>${L.h1}</em></h1>
    <p class="standfirst">${L.standfirst}</p>
    <div class="rules">
      ${L.rules.map((r, i) => `<div class="rule"><div class="n">RULE ${i + 1}</div><h3>${r[0]}</h3><p>${r[1]}</p></div>`).join('\n      ')}
    </div>
  </div>
</header>

<div class="wrap">
${parts}
${errs}
${quizLink}
${check}
${asg}
</div>

<footer>
  <div class="wrap">
    <p>UNIT ${pad(D.unit)} / ${pad(TOTAL_UNITS)} · 실습지 · ${COURSE_LONG}</p>
  </div>
</footer>
<script src="../nav.js"></script>
</html>
`;
}

/* =================================================================
   4. 퀴즈  (unitN/quiz.html)
   ================================================================= */
function buildQuiz(D) {
  const pass = Math.ceil(D.quiz.length * 0.8);
  return `<!doctype html>
<html lang="ko">
${META}
<title>${D.unit}단원 퀴즈 · ${COURSE}</title>
${FONTS}
<style>
${CSS.quiz}
</style>

<header>
  <div class="wrap mast">
    <span class="eyebrow">${D.unit}단원 · ${COURSE_LONG}</span>
    <h1>${D.quizTitle || '단원 퀴즈'}</h1>
    <p>${D.quiz.length}문항 · 객관식과 직접 입력이 섞여 있습니다. 실습지를 다시 보지 말고 먼저 풀어 보세요. ${pass}문항 이상이면 통과입니다.</p>
  </div>
</header>
<div class="prog"><i id="prog"></i></div>

<main class="wrap">
  <div class="meta"><span class="qn" id="qn">Q 01 / ${D.quiz.length}</span><span class="sc" id="sc">정답 0</span></div>
  <div id="area"></div>
</main>

<footer><div class="wrap"><p>${D.unit}단원 · <a href="lab.html">실습지로 돌아가기</a></p></div></footer>

<script>
window.QUIZ = ${JSON.stringify(D.quiz, null, 2).replace(/<\/script/gi, '<\\/script')};
window.PASS = ${pass};
</script>
<script>
${JS.quiz}
</script>
<script src="../nav.js"></script>
</html>
`;
}

/* =================================================================
   5. 교과 운영계획서  (plan.html)
   ================================================================= */
function buildPlan(all) {
  const I = COURSE_INFO;
  const total = all.reduce((s, u) => s + u.hours, 0);

  const major = all.map(U => `
        <tr><td class="c">${U.unit}</td><td>${U.title}</td><td class="c">${U.hours}</td><td class="c">${I.room}</td><td class="c"><a href="unit${U.unit}/lesson.html">교안</a></td></tr>`).join('');

  let rows = '';
  all.forEach(U => {
    const off = offsetOf(all, U.unit);
    rows += `\n        <tr class="u"><td colspan="5">${U.unit}단원 · ${U.title} (${U.hours}시간)</td></tr>`;
    U.lesson.forEach(L => {
      const lab = U.lab.parts[L.no - 1];
      const missions = lab ? (lab.missions || []).map(m => m.py ? `<em>(선택) 파이썬 ${m.n}: ${m.h}</em>` : m.h.replace(/ ★$/, '')).join(' / ') : '';
      rows += `\n        <tr><td class="c">${off + L.no}</td><td>${L.title}</td><td>${L.objective}</td><td>${missions}</td><td class="c">${L.method}</td></tr>`;
    });
  });

  return `<!doctype html>
<html lang="ko">
${META}
<title>교과 운영계획서 · ${COURSE}</title>
${FONTS}
<style>
${CSS.lab}
${DOC_EXTRA}
</style>

<header class="top">
  <div class="wrap masthead">
    <div class="rule-tag">
      <span class="eyebrow">${ORG}</span>
      <span class="dash"></span>
      <span class="eyebrow">교과 운영계획서</span>
    </div>
    <h1>${I.name} · <em>교과 운영계획서</em></h1>
    <p class="standfirst">운영계획서 표 양식에 맞춘 교과 개요와 36차시 세부 교수계획입니다. 차시별 도입·전개·정리 활동은 각 단원의 교안에 있습니다.</p>
    <div class="lnk"><a href="index.html">과정 표지</a><button class="printbtn" onclick="window.print()">🖨 인쇄 / PDF 저장</button></div>
  </div>
</header>

<div class="wrap">
  <section>
    <div class="formwrap"><table class="form">
      <colgroup><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"></colgroup>
      <tbody>
        <tr><th colspan="4" class="ttl">교과목명</th></tr>
        <tr><td colspan="4" class="c" style="font-size:16px">${I.name}</td></tr>
        <tr><th>대상직종</th><th>교과 구분</th><th>교육훈련시간</th><th>교수명</th></tr>
        <tr><td class="c">${I.job}</td><td class="c">${I.kind}</td><td class="c">${total}</td><td class="c">${I.prof}</td></tr>
        <tr><th colspan="2" class="sec">1. 지도목표</th><th colspan="2" class="sec">2. 교재</th></tr>
        <tr><td colspan="2"><ul><li>${I.goal}</li></ul></td><td colspan="2"><ul><li>${I.book}</li></ul></td></tr>
        <tr><th colspan="4" class="sec">3. 주요 교수계획</th></tr>
      </tbody>
    </table>
    <table class="form" style="border-top:0">
      <colgroup><col style="width:9%"><col><col style="width:13%"><col style="width:16%"><col style="width:14%"></colgroup>
      <thead><tr><th>연번</th><th>주요구성내용</th><th>교육훈련<br>시간</th><th>훈련시설</th><th>비고</th></tr></thead>
      <tbody>${major}
        <tr><td colspan="2" class="c"><strong>합계</strong></td><td class="c"><strong>${total}</strong></td><td></td><td></td></tr>
      </tbody>
    </table></div>
  </section>

  <section>
    <div class="part"><span class="pn">4</span><h2>차시별 세부 교수계획</h2><span class="pt">${total}차시</span></div>
    <p class="lede">${I.period}</p>
    <div class="formwrap"><table class="form" style="min-width:760px">
      <colgroup><col style="width:56px"><col style="width:22%"><col><col style="width:27%"><col style="width:110px"></colgroup>
      <thead><tr><th>차시</th><th>학습내용</th><th>학습목표</th><th>실습 활동</th><th>교수방법</th></tr></thead>
      <tbody>${rows}
      </tbody>
    </table></div>
  </section>

  <section>
    <div class="part"><span class="pn">5</span><h2>평가 계획</h2></div>
    <div class="formwrap"><table class="form">
      <colgroup><col style="width:30%"><col style="width:90px"><col></colgroup>
      <thead><tr><th>평가 항목</th><th>배점</th><th>평가 방법</th></tr></thead>
      <tbody>
        ${I.evals.map(e => `<tr><td>${e[0]}</td><td class="c">${e[1]}%</td><td>${e[2]}</td></tr>`).join('\n        ')}
        <tr><td class="c"><strong>합계</strong></td><td class="c"><strong>${I.evals.reduce((s, e) => s + e[1], 0)}%</strong></td><td></td></tr>
      </tbody>
    </table></div>
  </section>

  <section>
    <div class="part"><span class="pn">6</span><h2>훈련 운영 안내</h2></div>
    <div class="formwrap"><table class="form">
      <colgroup><col style="width:150px"><col></colgroup>
      <tbody>
        <tr><th>수업 운영</th><td>${I.period}</td></tr>
        <tr><th>실습 환경</th><td>${I.env}</td></tr>
        <tr><th>교수 자료</th><td>단원마다 <strong>강의 슬라이드</strong>(TTS 나레이션·자막) · <strong>차시별 교안</strong> · <strong>학생용 실습지</strong> · <strong>퀴즈 15문항</strong></td></tr>
        <tr><th>안전·윤리</th><td>개인정보(주민등록번호·계좌·비밀번호·타인 사진)는 AI에 입력하지 않음 · 건강·금융·법률 정보는 공식기관·전문가 확인 원칙 · AI 생성물 사용 시 출처와 AI 사용 여부 표기</td></tr>
      </tbody>
    </table></div>
  </section>
</div>

<footer><div class="wrap"><p>${COURSE_LONG} · 교과 운영계획서</p></div></footer>
<script src="nav.js"></script>
</html>
`;
}

function pySection(all) {
  const U = all.filter(D => D.py);
  if (!U.length) return '';
  const rows = U.map(D => `
      <tr><td>${D.unit}단원</td><td>${D.py.missions.map(m => `<b>${m.n}</b> ${m.h} <span class="mut">(${m.part}차시)</span>`).join('<br>')}</td>
        <td class="act"><a href="${colabUrl(D.py.notebook.file)}" target="_blank" rel="noopener">Colab</a><a href="python/${D.py.notebook.file}" download>.ipynb</a></td></tr>`).join('');
  return `<h2 class="sec">파이썬 확장 실습 · 선택</h2>
  <p class="pyintro">앞 교과에서 배운 파이썬 기초(자료형 · 조건문 · 반복문 · 자료구조 · 함수 · 파일 입출력)로 <b>AI에게 코드를 받고 → 실행하고 → 검증</b>합니다. 각 단원 실습지에 <b>PYTHON 미션</b>으로 들어 있으며, Google Colab에서 설치 없이 실행합니다.</p>
  <div class="pytable"><table>
    <thead><tr><th>단원</th><th>미션</th><th>노트북</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

/* =================================================================
   6. 과정 표지  (index.html)
   ================================================================= */
function buildIndex(all) {
  const total = all.reduce((s, u) => s + u.hours, 0);
  const cards = all.map(D => `
    <div class="daycard">
      <span class="dn">UNIT ${pad(D.unit)} · ${D.hours}시간</span>
      <h3><a class="h" href="unit${D.unit}/index.html">${D.title}</a></h3>
      <p>${D.theme}</p>
      <span class="links">
        <a class="b" href="unit${D.unit}/index.html">강의 슬라이드</a>
        <a href="unit${D.unit}/lesson.html">차시별 교안</a>
        <a href="unit${D.unit}/lab.html">실습지</a>
        <a href="unit${D.unit}/quiz.html">퀴즈 ${D.quiz.length}문항</a>
      </span>
    </div>`).join('\n');

  return `<!doctype html>
<html lang="ko">
${META}
<title>${COURSE} ${total}시간 과정</title>
${FONTS}
<style>
  :root{--ink:#0E1A15;--ink2:#18271F;--pine:#10684A;--pine-l:#3E9C74;--mint:#7FD1A8;
        --light:#F4F7F4;--card:#fff;--title:#0E1A15;--body:#3A453E;--muted:#6C7A72;--line:#DBE2DC;--chip:#EDF1EC;--clay:#B85434;
        --mono:"IBM Plex Mono",ui-monospace,monospace;--sans:"IBM Plex Sans KR","Malgun Gothic",system-ui,sans-serif}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--light:#0F1311;--card:#161C19;--title:#E7ECE8;--body:#C2CCC6;
        --muted:#94A29A;--line:#27302B;--chip:#1C2320;--pine:#57C294}}
  :root[data-theme="dark"]{--light:#0F1311;--card:#161C19;--title:#E7ECE8;--body:#C2CCC6;--muted:#94A29A;--line:#27302B;--chip:#1C2320;--pine:#57C294}
  *{box-sizing:border-box}
  body{margin:0;background:var(--light);color:var(--body);font-family:var(--sans);line-height:1.6}
  .wrap{max-width:1000px;margin:0 auto;padding:0 24px}
  header{background:var(--ink);color:#fff;padding:64px 0 56px;margin-bottom:48px}
  .eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--pine-l)}
  header h1{font-size:clamp(30px,5vw,50px);line-height:1.15;letter-spacing:-.03em;margin:14px 0 10px;font-weight:700}
  header p{color:#9FB3AA;font-size:16px;max-width:62ch;margin:0}
  header .meta{margin-top:26px;display:flex;flex-wrap:wrap;gap:10px}
  header .meta span,header .meta a{font-family:var(--mono);font-size:11.5px;letter-spacing:.08em;color:#CFE4DA;
        border:1px solid #2A3A32;border-radius:4px;padding:6px 11px;text-decoration:none}
  header .meta a{background:#10684A;border-color:#10684A;color:#fff}
  h2.sec{font-size:13px;font-family:var(--mono);letter-spacing:.14em;text-transform:uppercase;
        color:var(--muted);border-top:1px solid var(--line);padding-top:14px;margin:0 0 20px}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
  .daycard{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:22px 22px 18px;transition:.15s}
  .daycard:hover{border-color:var(--pine);box-shadow:0 4px 18px rgba(16,104,74,.09)}
  .dn{font-family:var(--mono);font-size:11px;letter-spacing:.14em;color:var(--pine)}
  .daycard h3{font-size:20px;margin:8px 0 6px;letter-spacing:-.02em;line-height:1.3}
  .daycard h3 a{color:var(--title);text-decoration:none}
  .daycard p{font-size:14px;color:var(--muted);margin:0 0 14px;line-height:1.55}
  .links{display:flex;flex-wrap:wrap;gap:8px}
  .links a{font-family:var(--mono);font-size:11px;letter-spacing:.06em;padding:5px 9px;border-radius:4px;
        text-decoration:none;background:var(--chip);color:var(--body);border:1px solid var(--line)}
  .links a.b{background:#10684A;color:#fff;border-color:#10684A}
  .links a:hover{background:#10684A;color:#fff;border-color:#10684A}
  .flow{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:48px}
  .fl{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--pine);border-radius:6px;padding:16px 18px}
  .fl b{display:block;font-size:15px;margin-bottom:4px}
  .fl span{font-size:13.5px;color:var(--muted)}
  footer{margin-top:56px;border-top:1px solid var(--line);padding:26px 0 50px;font-size:13px;color:var(--muted)}
  .pyintro{font-size:14.5px;margin:0 0 14px;max-width:75ch}
  .pytable{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-left:3px solid #1F5E86;border-radius:6px;margin-bottom:48px}
  .pytable table{border-collapse:collapse;width:100%;min-width:560px;font-size:14px}
  .pytable th,.pytable td{padding:10px 14px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
  .pytable th{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--muted);font-weight:500}
  .pytable tr:last-child td{border-bottom:0}
  .pytable td:first-child{white-space:nowrap;font-weight:600}
  .pytable .mut{color:var(--muted);font-size:12.5px}
  .pytable .act{white-space:nowrap}
  .pytable .act a{display:inline-block;font-family:var(--mono);font-size:11px;padding:4px 9px;margin:0 4px 4px 0;border-radius:4px;text-decoration:none;border:1px solid #1F5E86;color:#1F5E86}
  .pytable .act a:first-child{background:#1F5E86;color:#fff}
  @media (max-width:760px){ .grid,.flow{grid-template-columns:1fr} header{padding:44px 0 38px} .wrap{padding:0 16px} }
</style>

<header>
  <div class="wrap">
    <div class="eyebrow">${ORG} · ${COURSE_INFO.job} · ${COURSE_INFO.kind}</div>
    <h1>디지털리터러시<br>생성형 AI로 생활 문제 해결하기</h1>
    <p>${COURSE_INFO.goal}</p>
    <div class="meta"><span>${total}시간 · ${all.length}단원</span><span>1차시 50분 + 휴식 10분</span><span>설명 30% : 실습 70%</span><span>무료 서비스 · PC + 스마트폰</span><span>교수 ${COURSE_INFO.prof}</span><a href="plan.html">교과 운영계획서 →</a></div>
  </div>
</header>

<div class="wrap">
  <h2 class="sec">전체 흐름</h2>
  <div class="flow">
    <div class="fl"><b>1–2단원 · 기초를 다진다</b><span>디지털 기본기 · AI 원리 · 보안과 윤리 → 좋은 질문 만들기 · 답 검증</span></div>
    <div class="fl"><b>3–4단원 · 생활에 쓴다</b><span>글쓰기 · 번역 · 생활정보 · 공공서비스 → 허위정보 판별 · 요약 · 리포트</span></div>
    <div class="fl"><b>5단원 · 습관으로 만든다</b><span>일정 · 기록 · 맞춤 AI 비서 → 나만의 디지털 루틴북 발표</span></div>
  </div>

  ${pySection(all)}

  <h2 class="sec">단원별 자료</h2>
  <div class="grid">
${cards}
  </div>
</div>

<footer>
  <div class="wrap">
    <p>${COURSE_LONG} · 각 단원은 <b>강의 슬라이드(나레이션)</b> · <b>차시별 교안</b> · <b>실습지</b> · <b>퀴즈</b>로 구성됩니다.</p>
  </div>
</footer>
<script src="nav.js"></script>
</html>
`;
}

/* =================================================================
   7. 공통 목차  (nav.js)
   ================================================================= */
function buildNav(all) {
  const total = all.reduce((s, u) => s + u.hours, 0);
  const units = all.map(U => ({
    n: U.unit, dir: 'unit' + U.unit, title: U.title,
    items: [
      { f: 'index.html',  label: '강의 슬라이드', tag: '나레이션' },
      { f: 'lesson.html', label: '차시별 교안', tag: U.hours + '차시' },
      { f: 'lab.html',    label: '실습지' },
      { f: 'quiz.html',   label: '퀴즈', tag: U.quiz.length + '문항' }
    ]
  }));
  return JS.nav
    .replace('__COURSE__', JSON.stringify(COURSE))
    .replace('__SUB__', JSON.stringify(`${total}시간 · ${all.length}단원 과정`))
    .replace('__ORG__', JSON.stringify(ORG))
    .replace('__UNITS__', JSON.stringify(units, null, 2).replace(/\n/g, '\n  '));
}

/* =================================================================
   8. 파이썬 확장 — 미션 병합 · Colab 노트북 (python/*.ipynb)
   ================================================================= */
const answerName = f => f.replace(/\.ipynb$/, '_answers.ipynb');

function dedent(src) {
  const lines = src.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  const ind = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  return lines.map(l => l.slice(ind)).join('\n');
}

function mergePython(D) {
  const f = path.join(SRC, 'python', `unit${D.unit}.js`);
  if (!fs.existsSync(f)) return;
  const P = require(f);
  D.py = P;
  const file = P.notebook.file;
  const nb = `<div class="nb"><b>📓 Colab 노트북</b>
        <a href="${colabUrl(file)}" target="_blank" rel="noopener">Colab에서 열기</a>
        <a href="../python/${file}" download>노트북 내려받기 (.ipynb)</a>
        <small>Colab에서 열기가 안 되면: 내려받기 → colab.research.google.com → 파일 → 노트북 업로드. 구글 계정으로 로그인합니다.</small></div>`;
  P.missions.forEach(m => {
    const part = D.lab.parts[m.part - 1];
    if (!part) { console.warn(`  ⚠ unit${D.unit} 파이썬 미션 ${m.n}: ${m.part}차시가 없습니다`); return; }
    part.missions = (part.missions || []).filter(x => x.n !== m.n);
    part.missions.push({ n: m.n, h: m.h, py: true, body: m.body.replace('__NB__', nb) });
  });
}

function buildNotebook(P, answer) {
  const lines = t => t.split('\n').map((l, i, a) => i < a.length - 1 ? l + '\n' : l);
  const file = P.notebook.file;
  const head = answer
    ? `> 🔑 **교수자용 답안 노트북** — 학생용 파일: \`${file}\``
    : `<a href="${colabUrl(file)}" target="_blank"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/></a>`;
  const cells = [{ cell_type: 'markdown', metadata: {}, source: lines(head) }];
  P.notebook.cells.forEach(c => {
    if (c.md !== undefined) {
      cells.push({ cell_type: 'markdown', metadata: {}, source: lines(c.md.replace(/^\n/, '').replace(/\s+$/, '')) });
    } else {
      const src = dedent(answer && c.answer ? c.answer : c.code);
      cells.push({ cell_type: 'code', execution_count: null, metadata: c.error ? { tags: ['raises-exception'] } : {}, outputs: [], source: lines(src) });
    }
  });
  return JSON.stringify({
    cells,
    metadata: {
      colab: { provenance: [], toc_visible: true },
      kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
      language_info: { name: 'python' }
    },
    nbformat: 4, nbformat_minor: 0
  }, null, 1) + '\n';
}

function writeNotebooks(all) {
  const dir = path.join(ROOT, 'python');
  fs.mkdirSync(path.join(dir, 'answers'), { recursive: true });
  all.filter(D => D.py).forEach(D => {
    const file = D.py.notebook.file;
    fs.writeFileSync(path.join(dir, file), buildNotebook(D.py, false));
    fs.writeFileSync(path.join(dir, 'answers', answerName(file)), buildNotebook(D.py, true));
  });
}

/* =================================================================
   실행
   ================================================================= */
function check(D) {
  const errs = [];
  const n = D.hours;
  if (D.blocks.length !== n) errs.push(`blocks ${D.blocks.length} ≠ hours ${n}`);
  if (D.lesson.length !== n) errs.push(`lesson ${D.lesson.length} ≠ hours ${n}`);
  if (D.lab.parts.length !== n) errs.push(`lab.parts ${D.lab.parts.length} ≠ hours ${n}`);
  D.quiz.forEach((q, i) => {
    const ok = q.t ? (Array.isArray(q.acc) && q.ans) : (Array.isArray(q.o) && Number.isInteger(q.a));
    if (!ok || !q.e) errs.push(`quiz ${i + 1} 형식 오류`);
  });
  if (errs.length) console.warn(`  ⚠ unit${D.unit}: ` + errs.join(' · '));
}

const all = [];
for (let n = 1; n <= TOTAL_UNITS; n++) {
  const f = path.join(SRC, `unit${n}.js`);
  if (fs.existsSync(f)) all.push(require(f));
}
if (!all.length) { console.error('unitN.js 파일이 없습니다.'); process.exit(1); }
all.forEach(mergePython);

const only = process.argv.slice(2).map(Number).filter(Boolean);
const targets = only.length ? all.filter(D => only.includes(D.unit)) : all;

targets.forEach(D => {
  check(D);
  const dir = path.join(ROOT, `unit${D.unit}`);
  fs.mkdirSync(dir, { recursive: true });
  const deck = buildDeck(D);
  fs.writeFileSync(path.join(dir, 'index.html'), deck);
  fs.writeFileSync(path.join(dir, 'lesson.html'), buildLesson(D, all));
  fs.writeFileSync(path.join(dir, 'lab.html'), buildLab(D));
  fs.writeFileSync(path.join(dir, 'quiz.html'), buildQuiz(D));
  const n = deck.match(/<section class="slide/g).length;
  console.log(`unit${D.unit}  ${D.hours}시간 · 슬라이드 ${n}장 · 퀴즈 ${D.quiz.length}문항 · ${D.title}`);
});

// 표지 · 운영계획서 · 목차는 항상 전체 단원 기준으로 다시 만듭니다.
fs.writeFileSync(path.join(ROOT, 'index.html'), buildIndex(all));
fs.writeFileSync(path.join(ROOT, 'plan.html'), buildPlan(all));
fs.writeFileSync(path.join(ROOT, 'nav.js'), buildNav(all));
writeNotebooks(all);
console.log(`python/  노트북 ${all.filter(D => D.py).length}개 (+ answers/ 답안)`);
const total = all.reduce((s, u) => s + u.hours, 0);
console.log(`index.html · plan.html · nav.js  (${all.length}개 단원 · ${total}시간)`);
if (all.length === TOTAL_UNITS && total !== COURSE_INFO.hours) console.warn(`  ⚠ 단원 시수 합계 ${total} ≠ 과정 시수 ${COURSE_INFO.hours}`);

console.log(`\n완료 — ${targets.length}개 단원`);
