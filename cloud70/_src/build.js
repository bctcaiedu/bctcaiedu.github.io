#!/usr/bin/env node
/* ------------------------------------------------------------------
   cloud70 실습 가이드 빌더
   사용법:  node _src/build.js          (전체 일차 빌드)
            node _src/build.js 3 5      (3·5 일차만 빌드)

   내용은 _src/dayN.js 만 고치고 다시 빌드합니다.
   디자인은 _src/css/lab.css, 목차 사이드바는 ../nav.js 에 있습니다.
   ------------------------------------------------------------------ */
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const ROOT = path.resolve(SRC, '..');
const TOTAL_DAYS = 10;
const COURSE = '클라우드 기초';
const ORG = '한국폴리텍대학 분당융합기술교육원 · AI응용소프트웨어과';
const CSS = fs.readFileSync(path.join(SRC, 'css/lab.css'), 'utf8');
const pad = n => String(n).padStart(2, '0');

function buildLab(D) {
  const L = D.lab;

  const parts = L.parts.map(p => `
  <section>
    <div class="part"><span class="pn">${p.pn}</span><h2>${p.h}</h2>${p.time ? `<span class="pt">${p.time}</span>` : ''}</div>
    ${p.lede ? `<p class="lede">${p.lede}</p>` : ''}
    ${(p.missions || []).map(m => `
    <div class="mission">
      <div class="mhead"><span class="mn">MISSION ${pad(m.n)}</span><h3>${m.h}</h3></div>
      ${m.body}
    </div>`).join('\n')}
  </section>`).join('\n');

  const errs = `
  <section>
    <div class="part"><span class="pn">부록 A</span><h2>이런 오류가 나면</h2></div>
    <p class="lede">오늘 가장 많이 나오는 것들입니다. 여기 없는 오류는 메시지 전체를 캡처해서 손을 드세요.</p>
    <div class="tablewrap">
      <table>
        <thead><tr><th>증상 · 메시지</th><th>원인</th><th>대응</th></tr></thead>
        <tbody>
          ${L.errors.map(e => `<tr><td>${e[0]}</td><td>${e[1]}</td><td>${e[2]}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </div>
  </section>`;

  const check = `
  <section>
    <div class="part"><span class="pn">부록 B</span><h2>오늘 마치기 전 자가 점검</h2></div>
    <p class="lede">전부 체크되면 오늘 목표를 달성한 것입니다. 안 되는 항목이 있으면 퇴실 전에 손을 드세요.</p>
    <div class="selfcheck">
      <h3>Day ${D.day} 체크리스트</h3>
      <ul>
        ${L.checklist.map(c => `<li>${c}</li>`).join('\n        ')}
      </ul>
    </div>
  </section>`;

  const A = D.assignment;
  const asg = `
  <section>
    <div class="part"><span class="pn">산출물 ${pad(D.day)}</span><h2>${A.title}</h2><span class="pt">${A.due || '제출: 당일 17:00'}</span></div>
    <p class="lede">${A.lede}</p>
    <div class="stepc">
      <div class="shead"><span class="sn">제출 항목</span><h3>각 항목마다 결과 화면과 사용한 명령을 함께 붙일 것</h3></div>
      <div class="sbody">
        <ol>${A.items.map(t => `<li>${t}</li>`).join('')}</ol>
        ${A.sample ? `<span class="prelbl">제출 양식 예시</span><pre>${A.sample}</pre>` : ''}
        <div class="box check"><span class="lbl">채점 기준 · 7점</span><p>동작 3점 · 기록 2점 · 보안·비용 2점. ${A.note || ''}</p></div>
      </div>
    </div>
  </section>`;

  const prevNext = `
  <nav class="pn-nav">
    ${D.day > 1 ? `<a href="../day${D.day - 1}/lab.html">← Day ${D.day - 1}</a>` : '<a href="../">← 과정 홈</a>'}
    ${D.day < TOTAL_DAYS ? `<a href="../day${D.day + 1}/lab.html">Day ${D.day + 1} →</a>` : '<a href="../">과정 홈 →</a>'}
  </nav>`;

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Day ${D.day} 실습 가이드 · ${COURSE}</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>☁️</text></svg>">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap">
<script>try{var t=localStorage.getItem('bctc-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}</script>
<style>
${CSS}
  body{margin:0}
  .goals{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;margin-top:6px}
  .goals div{font-size:14px;color:var(--ink-2);background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:10px 14px}
  .goals b{font-family:var(--mono);font-size:11px;color:var(--accent);margin-right:6px}
  .sched{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
  .sched span{font-family:var(--mono);font-size:11.5px;color:var(--muted);border:1px solid var(--line);border-radius:4px;padding:4px 9px;background:var(--surface)}
  .pn-nav{display:flex;justify-content:space-between;gap:12px;padding:8px 0 40px}
  .pn-nav a{font-size:14px}
  .mission ol,.mission ul{margin:8px 0 0;padding-left:20px}
  .mission li{font-size:14px;color:var(--ink-2);margin-top:4px;line-height:1.65}
  .mission table{min-width:0}
  .mission .tablewrap{margin-top:10px}
</style>
</head>
<body>
<header class="top">
  <div class="wrap masthead">
    <div class="rule-tag">
      <span class="eyebrow">${ORG}</span>
      <span class="dash"></span>
      <span class="eyebrow">${COURSE} · 실습 가이드</span>
    </div>
    <h1>Day ${D.day} · <em>${L.h1}</em></h1>
    <p class="standfirst">${L.standfirst}</p>
    <div class="sched">${L.schedule.map(s => `<span>${s}</span>`).join('')}</div>
    <div class="goals">${D.goals.map((g, i) => `<div><b>${pad(i + 1)}</b>${g}</div>`).join('')}</div>
    <div class="rules">
      ${L.rules.map((r, i) => `<div class="rule"><div class="n">RULE ${i + 1}</div><h3>${r[0]}</h3><p>${r[1]}</p></div>`).join('\n      ')}
    </div>
  </div>
</header>

<div class="wrap">
${parts}
${errs}
${check}
${asg}
${prevNext}
</div>

<footer>
  <div class="wrap">
    <p>Day ${D.day} / ${TOTAL_DAYS} · 실습 가이드 · ${COURSE} 70시간 과정</p>
  </div>
</footer>
<script src="../nav.js"></script>
</body>
</html>
`;
}

const only = process.argv.slice(2).map(Number).filter(Boolean);
let built = 0;
for (let n = 1; n <= TOTAL_DAYS; n++) {
  const f = path.join(SRC, `day${n}.js`);
  if (!fs.existsSync(f) || (only.length && !only.includes(n))) continue;
  const D = require(f);
  const dir = path.join(ROOT, `day${D.day}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'lab.html'), buildLab(D));
  const m = D.lab.parts.reduce((s, p) => s + (p.missions || []).length, 0);
  console.log(`day${D.day}  미션 ${m}개 · ${D.lab.h1}`);
  built++;
}
console.log(`\n완료 — ${built}개 일차`);
