#!/usr/bin/env node
/* ------------------------------------------------------------------
   linux70 정적 사이트 빌더
   사용법:  node _src/build.js            (전체 일차 빌드)
            node _src/build.js 3 5        (3,5 일차만 빌드)

   내용을 고치려면 _src/dayN.js 만 수정하고 다시 빌드하면 됩니다.
   디자인(CSS)은 _src/css/*.css, 동작(JS)은 _src/js/*.js 에 있습니다.
   ------------------------------------------------------------------ */
const fs = require('fs');
const path = require('path');

const SRC  = __dirname;
const ROOT = path.resolve(SRC, '..');
const read = p => fs.readFileSync(path.join(SRC, p), 'utf8');

const CSS = {
  deck: read('css/deck.css'),
  lab:  read('css/lab.css'),
  quiz: read('css/quiz.css')
};
const JS = {
  deck: read('js/deck.js'),
  quiz: read('js/quiz.js')
};

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&display=swap">';

const ORG = '한국폴리텍대학 분당융합기술교육원 · AI응용소프트웨어과';
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* =================================================================
   1. 나레이션 슬라이드  (index.html)
   ================================================================= */
function buildDeck(D) {
  const S = [];

  // 표지
  S.push(slide('dk', `
    <div class="fill">
      <div class="eb">${ORG}</div>
      <h1>${D.title.replace(/ · /g, '<br>')}</h1>
      <div class="lead">${D.theme}</div>
      <div class="sub" style="margin-top:3cqh">DAY ${pad(D.day)} / 10 · 7시간 · 「LLM 서비스를 세워가며 배우는 리눅스」 70시간 과정</div>
    </div>`, D.openingNar));

  // 오늘의 목표
  S.push(slide('', `
    <div class="eb">Learning Objectives</div>
    <h2>오늘 끝났을 때 할 수 있어야 하는 것</h2>
    <div class="fill"><div class="grid g2" style="margin-top:2cqh">
      ${D.goals.map((g, i) => `<div class="card"><span class="n">${pad(i + 1)}</span><span class="t">${g[0]}</span><span class="d">${g[1]}</span></div>`).join('\n      ')}
    </div></div>`, D.goalsNar));

  // 하루 일정
  S.push(slide('', `
    <div class="eb">Today's Schedule</div>
    <h2>오늘 하루 · 네 개의 블록</h2>
    <div class="fill"><div class="grid g4" style="margin-top:2cqh">
      ${D.blocks.map((b, i) => `<div class="card"><span class="n"${i > 1 ? ' style="color:var(--clay)"' : ''}>${b.time}</span><span class="t">${b.title}</span><span class="d">${b.desc}</span></div>`).join('\n      ')}
    </div></div>
    <div class="foot">각 블록에 휴식 10분 포함 · 점심 12:00–13:00</div>`, D.blocksNar));

  // 본문 슬라이드
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

  // 과제
  S.push(slide('dk', `
    <div class="eb">Assignment ${pad(D.day)} · 제출 익일 09:00</div>
    <h2>${D.assignment.title}</h2>
    <div class="sub">${D.assignment.lede}</div>
    <div class="fill"><div class="grid g3" style="margin-top:2cqh">
      ${D.assignment.items.map((t, i) => `<div class="card"><span class="n">${pad(i + 1)}</span><span class="t">${t}</span></div>`).join('\n      ')}
    </div></div>
    <div class="foot">${D.assignment.note}</div>`, D.assignment.nar));

  // 마무리
  S.push(slide('dk', `
    <div class="fill">
      <div class="eb">Wrap-up</div>
      <h2>오늘 한 일</h2>
      <div class="sub" style="font-size:3.4cqh;color:#D7E2DC;margin-top:2cqh">${D.wrap.done}</div>
      <div class="lead" style="margin-top:4cqh">${D.wrap.next}</div>
      <div class="sub">${D.wrap.nextDesc}</div>
    </div>`, D.wrap.nar));

  const n = S.length;
  return `<title>Day ${D.day} 나레이션 슬라이드</title>
${FONTS}
<style>
${CSS.deck}
</style>

<div class="bar">
  <span class="brand">DAY ${pad(D.day)} · ${D.title} · 나레이션 슬라이드</span>
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
    <div class="mission">
      <div class="mhead"><span class="mn">MISSION ${pad(m.n)}</span><h3>${m.h}</h3></div>
      ${m.body}
    </div>`).join('\n')}
  </section>`).join('\n');

  const errs = `
  <section>
    <div class="part"><span class="pn">부록 A</span><h2>이런 오류가 나면</h2></div>
    <p class="lede">오늘 가장 많이 나오는 것들입니다. 여기 없는 오류는 손을 드세요.</p>
    <div class="tablewrap">
      <table>
        <thead><tr><th>증상 · 메시지</th><th>원인</th><th>대응</th></tr></thead>
        <tbody>
          ${L.errors.map(e => `<tr><td>${e[0]}</td><td>${e[1]}</td><td>${e[2]}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </div>
  </section>`;

  const quizLink = `
  <section>
    <div class="part"><span class="pn">부록 B</span><h2>명령어 퀴즈</h2></div>
    <p class="lede">미션을 마쳤으면 오늘 배운 것을 퀴즈로 점검합니다. 채점은 바로 나오고, 틀린 문제는 왜 틀렸는지 설명이 붙습니다.</p>
    <div class="stepc">
      <div class="shead"><span class="sn">QUIZ</span><h3>Day ${D.day} · ${D.quiz.length}문항</h3></div>
      <div class="sbody">
        <p>객관식과 직접 입력이 섞여 있습니다. 가이드를 다시 보지 말고 먼저 풀어 보고, 틀린 부분만 해당 미션으로 돌아가 확인하세요.</p>
        <p style="margin-top:12px;font-size:16px"><a href="quiz.html">▶ 퀴즈 풀러 가기</a></p>
        <div class="box check">
          <span class="lbl">통과 기준</span>
          <p>${D.quiz.length}문항 중 <strong>${Math.ceil(D.quiz.length * 0.8)}문항 이상</strong>을 맞히면 오늘 분량을 소화한 것입니다.</p>
        </div>
      </div>
    </div>
  </section>`;

  const check = `
  <section>
    <div class="part"><span class="pn">부록 C</span><h2>오늘 마치기 전 자가 점검</h2></div>
    <p class="lede">전부 체크되면 오늘 목표를 달성한 것입니다. 안 되는 항목이 있으면 퇴실 전에 손을 드세요.</p>
    <div class="selfcheck">
      <h3>Day ${D.day} 체크리스트</h3>
      <ul>
        ${L.checklist.map(c => `<li>${c}</li>`).join('\n        ')}
      </ul>
    </div>
  </section>`;

  const asg = `
  <section>
    <div class="part"><span class="pn">과제 ${pad(D.day)}</span><h2>${D.assignment.title}</h2><span class="pt">제출: 익일 09:00</span></div>
    <p class="lede">${D.assignment.lede}</p>
    <div class="stepc">
      <div class="shead"><span class="sn">제출 항목</span><h3>${D.assignment.subtitle || '각 항목마다 값과 사용한 명령을 함께 적을 것'}</h3></div>
      <div class="sbody">
        <ol>${D.assignment.items.map(t => `<li>${t}</li>`).join('')}</ol>
        ${D.assignment.sample ? `<span class="prelbl">제출 양식 예시</span><pre>${D.assignment.sample}</pre>` : ''}
        <div class="box check"><span class="lbl">채점 기준</span><p>${D.assignment.note}</p></div>
      </div>
    </div>
  </section>`;

  return `<title>Day ${D.day} 실습 가이드</title>
${FONTS}
<style>
${CSS.lab}
  a{color:var(--accent);font-weight:600;text-decoration:none;border-bottom:1px solid currentColor}
  a:hover{background:var(--accent-soft)}
  .dl{display:flex;flex-direction:column;gap:10px;margin-top:11px}
  .dlrow{display:grid;grid-template-columns:118px 1fr;gap:6px 16px;padding:12px 0;border-top:1px solid var(--line)}
  .dlrow:first-child{border-top:0}
  .dlrow .k{font-family:var(--mono);font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--muted);padding-top:3px}
  .dlrow .v{font-size:14px;color:var(--ink-2);line-height:1.65}
  .dlrow .v small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
  @media (max-width:700px){ .dlrow{grid-template-columns:1fr;gap:3px} .dlrow .k{padding-top:0} }
</style>

<header class="top">
  <div class="wrap masthead">
    <div class="rule-tag">
      <span class="eyebrow">${ORG}</span>
      <span class="dash"></span>
      <span class="eyebrow">학생용 실습 가이드</span>
    </div>
    <h1>Day ${D.day} · <em>${L.h1}</em></h1>
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
    <p>Day ${D.day} / 10 · 실습 가이드 · 리눅스 × LLM 서빙 70시간 과정</p>
  </div>
</footer>
<script src="../nav.js"></script>
`;
}

/* =================================================================
   3. 퀴즈  (quiz.html)
   ================================================================= */
function buildQuiz(D) {
  const pass = Math.ceil(D.quiz.length * 0.8);
  return `<title>Day ${D.day} 명령어 퀴즈</title>
${FONTS}
<style>
${CSS.quiz}
</style>

<header>
  <div class="wrap mast">
    <span class="eyebrow">Day ${D.day} · 리눅스 × LLM 서빙 70시간 과정</span>
    <h1>${D.quizTitle || '오늘의 명령어 퀴즈'}</h1>
    <p>${D.quiz.length}문항 · 객관식과 직접 입력이 섞여 있습니다. 가이드를 다시 보지 말고 먼저 풀어 보세요. ${pass}문항 이상이면 통과입니다.</p>
  </div>
</header>
<div class="prog"><i id="prog"></i></div>

<main class="wrap">
  <div class="meta"><span class="qn" id="qn">Q 01 / ${D.quiz.length}</span><span class="sc" id="sc">정답 0</span></div>
  <div id="area"></div>
</main>

<footer><div class="wrap"><p>Day ${D.day} · <a href="lab.html">실습 가이드로 돌아가기</a></p></div></footer>

<script>
window.QUIZ = ${JSON.stringify(D.quiz, null, 2)};
window.PASS = ${pass};
</script>
<script>
${JS.quiz}
</script>
<script src="../nav.js"></script>
`;
}

/* =================================================================
   실행
   ================================================================= */
const only = process.argv.slice(2).map(Number).filter(Boolean);
const days = [];
for (let n = 1; n <= 10; n++) {
  const f = path.join(SRC, `day${n}.js`);
  if (!fs.existsSync(f)) continue;
  if (only.length && !only.includes(n)) continue;
  days.push(require(f));
}

days.forEach(D => {
  const dir = path.join(ROOT, `day${D.day}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), buildDeck(D));
  fs.writeFileSync(path.join(dir, 'lab.html'), buildLab(D));
  fs.writeFileSync(path.join(dir, 'quiz.html'), buildQuiz(D));
  const n = buildDeck(D).match(/<section class="slide/g).length;
  console.log(`day${D.day}  슬라이드 ${n}장 · 퀴즈 ${D.quiz.length}문항 · ${D.title}`);
});
console.log(`\n완료 — ${days.length}개 일차`);
