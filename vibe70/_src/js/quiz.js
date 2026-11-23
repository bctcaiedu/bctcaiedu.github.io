(function(){
  const Q = window.QUIZ || [];

  const $ = id => document.getElementById(id);
  let i = 0, score = 0, missed = [], answered = false;

  const norm = s => s.trim().toLowerCase().replace(/\s+/g,' ');

  function render(){
    answered = false;
    const q = Q[i];
    $('qn').textContent = 'Q ' + String(i+1).padStart(2,'0') + ' / ' + Q.length;
    $('sc').textContent = '정답 ' + score;
    $('prog').style.width = (i / Q.length * 100) + '%';

    const card = document.createElement('div');
    card.className = 'qcard';
    card.innerHTML = '<div class="qtext">' + q.q + '</div>' + (q.pre ? '<pre>' + q.pre + '</pre>' : '');

    if (q.t){
      const wrap = document.createElement('div');
      wrap.className = 'typed';
      wrap.innerHTML = '<input type="text" id="inp" autocomplete="off" autocapitalize="off" ' +
                       'spellcheck="false" placeholder="명령을 그대로 입력하세요">' +
                       '<button class="go" id="chk">확인</button>';
      card.appendChild(wrap);
      card.appendChild(mkFoot());
      $('area').replaceChildren(card);
      $('inp').focus();
      $('chk').onclick = () => judgeTyped(q);
      $('inp').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); answered ? nextQ() : judgeTyped(q); } });
    } else {
      const order = q.o.map((t,n) => n);
      for (let k = order.length - 1; k > 0; k--){ const j = Math.floor(Math.random()*(k+1)); [order[k],order[j]] = [order[j],order[k]]; }
      const box = document.createElement('div');
      box.className = 'opts';
      order.forEach((oi, pos) => {
        const b = document.createElement('button');
        b.className = 'opt'; b.type = 'button'; b.dataset.i = oi;
        b.innerHTML = '<span class="mk">' + 'ABCD'[pos] + '</span><span>' + q.o[oi] + '</span>';
        b.onclick = () => judgeChoice(q, b, box);
        box.appendChild(b);
      });
      card.appendChild(box);
      card.appendChild(mkFoot());
      $('area').replaceChildren(card);
    }
  }

  function mkFoot(){
    const d = document.createElement('div');
    d.id = 'foot';
    return d;
  }

  function feedback(ok, q, extra){
    answered = true;
    score += ok ? 1 : 0;
    if (!ok) missed.push(i);
    $('sc').textContent = '정답 ' + score;
    const f = document.createElement('div');
    f.className = 'fb' + (ok ? '' : ' no');
    f.innerHTML = '<span class="v">' + (ok ? '정답' : '오답') + '</span><p>' + (extra || '') + q.e + '</p>';
    const act = document.createElement('div');
    act.className = 'actions';
    const b = document.createElement('button');
    b.className = 'go';
    b.textContent = (i === Q.length - 1) ? '결과 보기' : '다음 문제';
    b.onclick = nextQ;
    act.appendChild(b);
    const foot = $('foot');
    foot.replaceChildren(f, act);
    b.focus();
  }

  function judgeChoice(q, btn, box){
    if (answered) return;
    const pick = +btn.dataset.i, ok = pick === q.a;
    Array.from(box.children).forEach(el => {
      el.disabled = true;
      const n = +el.dataset.i;
      if (n === q.a) el.classList.add('right');
      else if (n === pick) el.classList.add('wrong');
    });
    feedback(ok, q, ok ? '' : '정답은 <code>' + q.o[q.a] + '</code> 입니다. ');
  }

  function judgeTyped(q){
    if (answered) return;
    const inp = $('inp');
    const v = norm(inp.value);
    if (!v){ inp.focus(); return; }
    const ok = q.acc.some(a => norm(a) === v);
    inp.disabled = true;
    $('chk').disabled = true;
    feedback(ok, q, ok ? '' : '정답은 <code>' + q.ans + '</code> 입니다. ');
  }

  function nextQ(){
    i++;
    if (i >= Q.length) result(); else render();
  }

  function result(){
    $('prog').style.width = '100%';
    $('qn').textContent = '완료';
    $('sc').textContent = '정답 ' + score;
    const pass = window.PASS || Math.ceil(Q.length*0.8);
    const cls = score >= pass ? "" : (score >= pass - 3 ? " mid" : " low");
    const msg = score >= pass
      ? '통과입니다. 오늘 분량을 충분히 소화했습니다.'
      : (score >= pass - 3
        ? '조금 아쉽습니다. 틀린 항목의 미션으로 돌아가 한 번만 더 확인하고 다시 풀어 보세요.'
        : '아직 손에 붙지 않았습니다. 실습 가이드의 미션 1번부터 다시 따라 해 보는 편이 빠릅니다.');

    const d = document.createElement('div');
    d.className = 'res';
    d.innerHTML =
      '<div class="big' + cls + '">' + score + ' / ' + Q.length + '</div>' +
      '<h2>' + (score >= pass ? "통과" : "한 번 더") + '</h2>' +
      '<p>' + msg + '</p>';

    if (missed.length){
      const m = document.createElement('div');
      m.className = 'missed';
      m.innerHTML = '<h3>다시 볼 문항</h3><ul>' +
        missed.map(n => '<li><b>Q' + String(n+1).padStart(2,'0') + '</b> — ' +
          Q[n].q.replace(/<[^>]+>/g,'') + '</li>').join('') + '</ul>';
      d.appendChild(m);
    }

    const act = document.createElement('div');
    act.className = 'actions';
    const again = document.createElement('button');
    again.className = 'go'; again.textContent = '처음부터 다시 풀기';
    again.onclick = () => { i = 0; score = 0; missed = []; render(); window.scrollTo(0,0); };
    act.appendChild(again);
    const back = document.createElement('a');
    back.href = 'lab.html'; back.className = 'ghost';
    back.style.cssText = 'text-decoration:none;display:inline-flex;align-items:center;padding:12px 20px;border:1px solid var(--line-strong);border-radius:5px;color:var(--ink-2);font-weight:600;font-size:15px';
    back.textContent = '실습 가이드로';
    act.appendChild(back);
    d.appendChild(act);

    $('area').replaceChildren(d);
  }

  render();
})();
