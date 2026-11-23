#!/usr/bin/env node
/* ------------------------------------------------------------------
   vibe70 정적 사이트 빌더
   사용법:  node _src/build.js            (전체 일차 빌드)
            node _src/build.js 3 5        (3,5 일차만 빌드)

   내용은 _src/dayN.js, 디자인은 _src/css/*.css (공통 테마는 theme.css),
   동작은 _src/js/*.js 에 있습니다. 사이드바(nav.js)도 여기서 자동으로 만듭니다.
   ------------------------------------------------------------------ */
const fs = require('fs');
const path = require('path');

const SRC  = __dirname;
const ROOT = path.resolve(SRC, '..');
const read = p => fs.readFileSync(path.join(SRC, p), 'utf8');

const TOTAL_DAYS = 10;
const COURSE = '바이브 코딩 × 하네스 엔지니어링';
const COURSE_SHORT = '바이브 코딩 × 하네스';
const COURSE_LONG = '「Claude Code · Gemini CLI · Codex CLI로 배우는 AI 에이전트 개발」 70시간 과정';
const GROUPS = [
  { label: '바이브 코딩', from: 1, to: 5 },
  { label: '하네스 엔지니어링', from: 6, to: 8 },
  { label: '종합 프로젝트', from: 9, to: 10 }
];

const CSS = {
  theme: read('css/theme.css'),
  deck: read('css/deck.css'),
  lab:  read('css/lab.css'),
  quiz: read('css/quiz.css')
};
const JS = {
  deck: read('js/deck.js'),
  quiz: read('js/quiz.js'),
  nav:  read('js/nav.js')
};

const ORG = '한국폴리텍대학 분당융합기술교육원 · AI응용소프트웨어과';
const pad = n => String(n).padStart(2, '0');
const periodNo = p => +String(p.pn).replace(/\D/g, '');

function head(title, icon, css) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${icon}</text></svg>">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap">
<script>try{var t=JSON.parse(localStorage.getItem('vibe70-theme'));if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<style>
${CSS.theme}
${css}
</style>
</head>
<body>`;
}

function viewSwitch(D, cur) {
  const it = [['index.html', '📺 슬라이드'], ['lab.html', '🛠️ 실습'], ['quiz.html', '✅ 퀴즈']];
  return `<div class="view-switch">${it.map(([f, l]) => `<a href="${f}"${f === cur ? ' class="active"' : ''}>${l}</a>`).join('')}</div>`;
}
function range(D) {
  const nos = D.lab.parts.map(periodNo);
  return `${Math.min(...nos)}–${Math.max(...nos)}차시`;
}

/* =================================================================
   1. 나레이션 슬라이드  (index.html)
   ================================================================= */
function buildDeck(D) {
  const S = [];

  S.push(slide('dk', `
    <div class="fill">
      <div class="eb">DAY ${pad(D.day)} / ${TOTAL_DAYS} · ${range(D)} · 7시간</div>
      <h1>${D.title.replace(/ · /g, '<br>')}</h1>
      <div class="lead">${D.theme}</div>
      <div class="sub" style="margin-top:3cqh">${COURSE_LONG}</div>
    </div>`, D.openingNar));

  S.push(slide('', `
    <div class="eb">Learning Objectives</div>
    <h2>오늘 끝났을 때 할 수 있어야 하는 것</h2>
    <div class="fill"><div class="grid g2" style="margin-top:2cqh">
      ${D.goals.map((g, i) => `<div class="card"><span class="n">${pad(i + 1)}</span><span class="t">${g[0]}</span><span class="d">${g[1]}</span></div>`).join('\n      ')}
    </div></div>`, D.goalsNar));

  S.push(slide('', `
    <div class="eb">Today's Schedule</div>
    <h2>오늘 하루 · 일곱 차시</h2>
    <div class="fill"><div class="grid g4" style="margin-top:2cqh">
      ${D.blocks.map((b, i) => `<div class="card"><span class="n"${i > 3 ? ' style="color:var(--s-accent2)"' : ''}>${b.no}차시 · ${b.time}</span><span class="t">${b.title}</span><span class="d">${b.desc}</span></div>`).join('\n      ')}
    </div></div>
    <div class="foot">차시마다 50분 수업 + 10분 휴식 · 점심 12:50–13:50</div>`, D.blocksNar));

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

  S.push(slide('', `
    <div class="eb">Assignment ${pad(D.day)} · ${D.assignment.due || '제출 익일 09:00'}</div>
    <h2>${D.assignment.title}</h2>
    <div class="sub">${D.assignment.lede}</div>
    <div class="fill"><div class="grid g2" style="margin-top:2cqh">
      ${D.assignment.items.map((t, i) => `<div class="card"><span class="n">${pad(i + 1)}</span><span class="t">${t}</span></div>`).join('\n      ')}
    </div></div>
    <div class="foot">${D.assignment.note}</div>`, D.assignment.nar));

  S.push(slide('dk', `
    <div class="fill">
      <div class="eb">Wrap-up</div>
      <h2>오늘 한 일</h2>
      <div class="sub" style="font-size:3.4cqh;margin-top:2cqh">${D.wrap.done}</div>
      <div class="lead" style="margin-top:4cqh">${D.wrap.next}</div>
      <div class="sub">${D.wrap.nextDesc}</div>
    </div>`, D.wrap.nar));

  S[0] = S[0].replace(/^<section class="slide([^"]*)"/, '<section class="slide$1 show"');

  const n = S.length;
  return `${head(`Day ${D.day} 강의 슬라이드 · ${COURSE_SHORT}`, '📺', CSS.deck)}
<div class="bar">
  <span class="brand">Day ${D.day} › <b>${D.title}</b></span>
  ${viewSwitch(D, 'index.html')}
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
  <select id="voice" title="목소리"></select>
  <button id="cap" class="on" title="자막">자막</button>
  <button id="full" title="전체화면 (F)">⛶</button>
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
</body>
</html>
`;
}

function slide(cls, inner, nar) {
  return `<section class="slide${cls ? ' ' + cls : ''}">${inner}
  <div class="nar">${(nar || '').trim()}</div>
</section>`;
}

/* =================================================================
   2. 실습 가이드  (lab.html)
   ================================================================= */
function buildLab(D) {
  const L = D.lab;
  const tools = [...new Set(D.blocks.map(b => b.desc))].join(' · ');

  const parts = L.parts.map(p => {
    const no = periodNo(p);
    return `
  <section class="part-sec" id="p${no}">
    <div class="part"><span class="pn">${p.pn}</span><h2>${p.h}</h2>${p.time ? `<span class="pt">${p.time}</span>` : ''}</div>
    ${p.lede ? `<p class="lede">${p.lede}</p>` : ''}
    ${(p.steps || []).map(s => `
    <div class="stepc">
      <div class="shead"><span class="sn">${s.sn}</span><h3>${s.h}</h3></div>
      <div class="sbody">${s.body}</div>
    </div>`).join('\n')}
    ${(p.missions || []).map(m => `
    <div class="mission">
      <div class="mhead"><span class="mn">MISSION ${pad(m.n)}</span><h3>${m.h}</h3></div>
      ${m.body}
    </div>`).join('\n')}
    <div class="section-end"><span>${no}차시를 마쳤나요? 표시해 두면 왼쪽 학습 진도에 반영됩니다.</span><button class="btn done-btn" type="button" data-no="${no}">✓ 완료로 표시</button></div>
  </section>`;
  }).join('\n');

  return `${head(`Day ${D.day} 실습 가이드 · ${COURSE_SHORT}`, '🛠️', CSS.lab)}
<div class="topbar">
  <span class="crumb">Day ${D.day} › <b>${D.title}</b> › 실습 가이드</span>
  ${viewSwitch(D, 'lab.html')}
</div>

<main class="doc">
  <div class="hero">
    <span class="badge">DAY ${pad(D.day)} · ${range(D)} · 실습 가이드</span>
    <h1>${L.h1}</h1>
    <p>${L.standfirst}</p>
    <div class="meta-row"><span class="chip">⏱ 7시간 · 7차시</span><span class="chip">🧰 ${tools}</span><span class="chip">✅ 퀴즈 ${D.quiz.length}문항</span></div>
    <span class="emo">🛠️</span>
  </div>

  <div class="rules">
    ${L.rules.map((r, i) => `<div class="rule"><div class="n">RULE ${i + 1}</div><h3>${r[0]}</h3><p>${r[1]}</p></div>`).join('\n    ')}
  </div>
${parts}

  <section class="part-sec" id="errors">
    <div class="part"><span class="pn">부록 A</span><h2>이런 오류가 나면</h2></div>
    <p class="lede">오늘 가장 많이 나오는 것들입니다. 여기 없는 오류는 손을 드세요.</p>
    <div class="tablewrap"><table>
      <thead><tr><th>증상 · 메시지</th><th>원인</th><th>대응</th></tr></thead>
      <tbody>
        ${L.errors.map(e => `<tr><td>${e[0]}</td><td>${e[1]}</td><td>${e[2]}</td></tr>`).join('\n        ')}
      </tbody>
    </table></div>
  </section>

  <section class="part-sec" id="quiz">
    <div class="part"><span class="pn">부록 B</span><h2>오늘의 퀴즈</h2></div>
    <div class="callout info"><div class="ct">✅ Day ${D.day} · ${D.quiz.length}문항</div>
      <p>객관식과 직접 입력이 섞여 있습니다. 가이드를 다시 보지 말고 먼저 풀어 보세요. <strong>${Math.ceil(D.quiz.length * 0.8)}문항 이상</strong>이면 통과입니다.</p>
      <p><a class="btn primary" href="quiz.html" style="color:#fff">▶ 퀴즈 풀러 가기</a></p></div>
  </section>

  <section class="part-sec" id="check">
    <div class="part"><span class="pn">부록 C</span><h2>오늘 마치기 전 자가 점검</h2></div>
    <p class="lede">전부 체크되면 오늘 목표를 달성한 것입니다. 체크 상태는 이 브라우저에 저장됩니다.</p>
    <div class="selfcheck">
      <h3>☑ Day ${D.day} 체크리스트</h3>
      <ul>
        ${L.checklist.map(c => `<li><label><input type="checkbox"><span>${c}</span></label></li>`).join('\n        ')}
      </ul>
    </div>
  </section>

  <section class="part-sec" id="assignment">
    <div class="part"><span class="pn">과제 ${pad(D.day)}</span><h2>${D.assignment.title}</h2><span class="pt">${D.assignment.due || '제출: 익일 09:00'}</span></div>
    <p class="lede">${D.assignment.lede}</p>
    <div class="stepc">
      <div class="shead"><span class="sn">제출 항목</span><h3>${D.assignment.subtitle || '각 항목마다 결과 화면을 함께 붙일 것'}</h3></div>
      <div class="sbody">
        <ol>${D.assignment.items.map(t => `<li>${t}</li>`).join('')}</ol>
        ${D.assignment.sample ? `<span class="prelbl">제출 양식 예시</span><pre>${D.assignment.sample}</pre>` : ''}
        <div class="box check"><span class="lbl">채점 기준</span><p>${D.assignment.note}</p></div>
      </div>
    </div>
  </section>
</main>

<footer class="docfoot">Day ${D.day} / ${TOTAL_DAYS} · 실습 가이드 · ${COURSE} 70시간 과정 · ${ORG}</footer>
<script src="../nav.js"></script>
</body>
</html>
`;
}

/* =================================================================
   3. 퀴즈  (quiz.html)
   ================================================================= */
function buildQuiz(D) {
  const pass = Math.ceil(D.quiz.length * 0.8);
  return `${head(`Day ${D.day} 퀴즈 · ${COURSE_SHORT}`, '✅', CSS.quiz)}
<div class="topbar">
  <span class="crumb">Day ${D.day} › <b>${D.title}</b> › 퀴즈</span>
  ${viewSwitch(D, 'quiz.html')}
</div>

<main class="doc narrow">
  <div class="hero">
    <span class="badge">DAY ${pad(D.day)} · 퀴즈</span>
    <h1>${D.quizTitle || '오늘의 퀴즈'}</h1>
    <p>${D.quiz.length}문항 · 객관식과 직접 입력이 섞여 있습니다. ${pass}문항 이상이면 통과입니다.</p>
    <span class="emo">✅</span>
  </div>
  <div class="meta"><span class="qn" id="qn">Q 01 / ${D.quiz.length}</span><span class="sc" id="sc">정답 0</span></div>
  <div class="qprog"><i id="prog"></i></div>
  <div id="area"></div>
</main>

<footer class="docfoot">Day ${D.day} · <a href="lab.html">실습 가이드로 돌아가기</a></footer>

<script>
window.QUIZ = ${JSON.stringify(D.quiz, null, 2)};
window.PASS = ${pass};
</script>
<script>
${JS.quiz}
</script>
<script src="../nav.js"></script>
</body>
</html>
`;
}

/* =================================================================
   4. 과정 표지  (index.html)
   ================================================================= */
function buildIndex(all) {
  const groups = GROUPS.map(g => {
    const cards = all.filter(D => D.day >= g.from && D.day <= g.to).map(D => `
      <a class="dcard" href="day${D.day}/index.html">
        <span class="cn">DAY ${pad(D.day)} · ${range(D)}</span>
        <span class="ct">${D.title}</span>
        <span class="cs">${D.theme}</span>
        <span class="cl">
          <b onclick="event.preventDefault();location.href='day${D.day}/index.html'">📺 슬라이드</b>
          <b onclick="event.preventDefault();location.href='day${D.day}/lab.html'">🛠️ 실습</b>
          <b onclick="event.preventDefault();location.href='day${D.day}/quiz.html'">✅ 퀴즈</b>
        </span>
        <span class="cp" data-day-progress="${D.day}"><i></i></span>
        <span class="cc" data-day-count>0 / 7 차시 완료</span>
      </a>`).join('');
    return `
  <h2><span class="gl">${g.label}</span> <small>Day ${g.from}–${g.to}</small></h2>
  <div class="cards">${cards}
  </div>`;
  }).join('\n');

  return `${head(`${COURSE} · 70시간 과정`, '🎛️', `
  .doc h2 { font-size: 21px; margin: 34px 0 10px; padding-bottom: 6px; border-bottom: 2px solid var(--line); display: flex; align-items: baseline; gap: 10px; }
  .doc h2 small { font-size: 13px; color: var(--muted); font-weight: 600; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .dcard { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; text-decoration: none; color: inherit;
    box-shadow: var(--shadow); transition: transform .12s, border-color .12s; display: flex; flex-direction: column; gap: 4px; }
  .dcard:hover { transform: translateY(-2px); border-color: var(--accent); }
  .dcard .cn { font: 700 12px var(--mono); color: var(--accent); }
  .dcard .ct { font-weight: 800; font-size: 16.5px; line-height: 1.35; }
  .dcard .cs { font-size: 13px; color: var(--muted); flex: 1; }
  .dcard .cl { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
  .dcard .cl b { font-size: 12px; font-weight: 700; padding: 2px 9px; border-radius: 20px; background: var(--card2); border: 1px solid var(--line); }
  .dcard .cl b:hover { border-color: var(--accent); color: var(--accent); }
  .dcard .cp { height: 4px; background: var(--card2); border-radius: 4px; overflow: hidden; margin-top: 8px; }
  .dcard .cp i { display: block; height: 100%; width: 0; background: var(--ok); }
  .dcard .cc { font-size: 11.5px; color: var(--muted); }
  .flow3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 4px 0 8px; }
  .flow3 div { background: var(--card); border: 1px solid var(--line); border-left: 5px solid var(--accent2); border-radius: var(--radius); padding: 12px 16px; box-shadow: var(--shadow); }
  .flow3 b { display: block; color: var(--accent2); }
  .flow3 span { font-size: 13.5px; color: var(--muted); }
  .tbl { overflow-x: auto; border-radius: 8px; box-shadow: var(--shadow); }
  .tbl table { border-collapse: collapse; width: 100%; min-width: 560px; font-size: 14px; background: var(--card); }
  .tbl th, .tbl td { border: 1px solid var(--line); padding: 8px 11px; text-align: left; vertical-align: top; }
  .tbl th { background: var(--card2); }
  .tbl code { font-size: .88em; color: var(--accent2); }
  footer.docfoot { max-width: 920px; margin: 0 auto; padding: 0 34px 40px; font-size: 12.5px; color: var(--muted); }
  @media (max-width: 860px) { .flow3 { grid-template-columns: 1fr; } footer.docfoot { padding: 0 16px 40px; } }
`)}
<div class="topbar"><span class="crumb"><b>강좌 소개</b></span></div>
<main class="doc">
  <div class="hero">
    <span class="badge">${ORG}</span>
    <h1>🎛️ ${COURSE}</h1>
    <p>말로 만들고, 틀로 지킨다. <b>Claude Code · Gemini CLI · Codex CLI</b> 세 에이전트로 같은 실습을 번갈아 하며 공통 원리를 익히고, AI가 매번 같은 품질로 일하도록 규칙 · 도구 · 검증 장치를 설계합니다.</p>
    <p>10일 연속 · 70차시 · 일차마다 강의 슬라이드 · 실습 가이드 · 퀴즈</p>
    <div class="hero-actions">
      <a class="btn" href="day1/index.html">▶ 처음부터 시작</a>
      <a class="btn outline" href="day1/lab.html">🛠️ 1일차 실습 가이드</a>
    </div>
    <span class="emo">🎛️</span>
  </div>

  <div class="flow3">
    <div><b>Day 1–5 · 바이브 코딩</b><span>세 도구 설치 → 말로 만들기 → 누적 프로젝트 → 서버 · LLM API → 한계와 검증</span></div>
    <div><b>Day 6–8 · 하네스 엔지니어링</b><span>규칙 파일 → 권한 → 명령 · 스킬 · 훅 → MCP → 다중 에이전트 → CI</span></div>
    <div><b>Day 9–10 · 종합 프로젝트</b><span>팀 하네스 설계 → 도구별 역할 배치 → 구현 → 발표 · 회고</span></div>
  </div>
${groups}

  <h2>🧰 세 도구 한눈에 비교</h2>
  <div class="tbl"><table>
    <thead><tr><th>항목</th><th>Claude Code</th><th>Gemini CLI</th><th>Codex CLI</th></tr></thead>
    <tbody>
      <tr><td>회사</td><td>Anthropic</td><td>Google</td><td>OpenAI</td></tr>
      <tr><td>계정</td><td>Claude 유료 구독 또는 API</td><td>Google 계정 (무료 사용량 있음)</td><td>ChatGPT 구독 또는 API</td></tr>
      <tr><td>프로젝트 규칙 파일</td><td><code>CLAUDE.md</code></td><td><code>GEMINI.md</code></td><td><code>AGENTS.md</code></td></tr>
      <tr><td>MCP 연결</td><td>지원</td><td>지원</td><td>지원</td></tr>
      <tr><td>수업에서 보는 강점</td><td>훅 · 스킬 · 서브에이전트 등 하네스 기능이 풍부</td><td>무료로 시작 · 긴 맥락 · 구글 검색 연동</td><td>ChatGPT 연계 · 샌드박스 실행</td></tr>
    </tbody>
  </table></div>
  <div class="callout info"><div class="ct">ℹ️ 개강 전 확인</div><p>요금제와 일부 기능(훅 · 스킬 등)은 자주 바뀝니다. 개강 직전에 각 도구의 공식 문서로 다시 확인하세요.</p></div>
</main>
<footer class="docfoot">${COURSE_LONG} · ${ORG}</footer>
<script src="nav.js"></script>
</body>
</html>
`;
}

/* =================================================================
   5. 사이드바 (nav.js)
   ================================================================= */
function buildNav(all) {
  const data = {
    course: '바이브 코딩',
    sub: '학생용 · 70시간',
    groups: GROUPS,
    days: all.map(D => ({
      n: D.day, title: D.title,
      periods: D.lab.parts.map(p => ({ no: periodNo(p), title: p.h, desc: p.lede || '' }))
    }))
  };
  return JS.nav.replace('/*__DATA__*/null', JSON.stringify(data));
}

/* =================================================================
   실행
   ================================================================= */
const only = process.argv.slice(2).map(Number).filter(Boolean);
const allDays = [];
for (let n = 1; n <= TOTAL_DAYS; n++) {
  const f = path.join(SRC, `day${n}.js`);
  if (fs.existsSync(f)) allDays.push(require(f));
}

allDays.filter(D => !only.length || only.includes(D.day)).forEach(D => {
  const dir = path.join(ROOT, `day${D.day}`);
  fs.mkdirSync(dir, { recursive: true });
  const deck = buildDeck(D);
  fs.writeFileSync(path.join(dir, 'index.html'), deck);
  fs.writeFileSync(path.join(dir, 'lab.html'), buildLab(D));
  fs.writeFileSync(path.join(dir, 'quiz.html'), buildQuiz(D));
  const n = deck.match(/<section class="slide/g).length;
  console.log(`day${D.day}  슬라이드 ${n}장 · 퀴즈 ${D.quiz.length}문항 · ${D.title}`);
});

if (allDays.length) {
  fs.writeFileSync(path.join(ROOT, 'index.html'), buildIndex(allDays));
  fs.writeFileSync(path.join(ROOT, 'nav.js'), buildNav(allDays));
  console.log(`index.html · nav.js  ${allDays.length}개 일차`);
}
console.log('\n완료');
