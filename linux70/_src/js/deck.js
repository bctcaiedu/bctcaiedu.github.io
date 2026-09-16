(function(){
  const slides = Array.from(document.querySelectorAll('.slide'));
  const synth  = window.speechSynthesis;
  const $ = id => document.getElementById(id);
  let idx = 0, playing = false, auto = true, chunks = [], ci = 0, voices = [], voice = null;

  $('count').textContent = '1 / ' + slides.length;

  function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 3800); }

  function narration(i){ const n = slides[i].querySelector('.nar'); return n ? n.textContent.trim() : ''; }
  function splitSentences(t){
    return t.split(/(?<=[.?!])\s+/).map(s=>s.trim()).filter(Boolean);
  }

  function show(i){
    slides[idx].classList.remove('show');
    idx = Math.max(0, Math.min(slides.length-1, i));
    slides[idx].classList.add('show');
    $('count').textContent = (idx+1) + ' / ' + slides.length;
    $('prog').style.width = ((idx+1)/slides.length*100) + '%';
  }

  function setCap(text, idle){
    const p = $('capText');
    p.textContent = text;
    p.classList.toggle('idle', !!idle);
  }

  function stop(){
    playing = false; chunks = []; ci = 0;
    try { synth.cancel(); } catch(e){}
    $('play').textContent = '▶ 재생';
    $('play').classList.remove('playing');
    setCap('▶ 재생을 누르면 나레이션이 시작됩니다 · ← → 슬라이드 이동 · Space 재생/정지 · F 전체화면', true);
  }

  function speakNext(){
    if (!playing) return;
    if (ci >= chunks.length){
      if (auto && idx < slides.length-1){ show(idx+1); startSpeaking(); }
      else { stop(); }
      return;
    }
    const u = new SpeechSynthesisUtterance(chunks[ci]);
    u.lang = 'ko-KR';
    if (voice) u.voice = voice;
    u.rate = parseFloat($('rate').value);
    u.onend = () => { ci++; speakNext(); };
    u.onerror = () => { ci++; speakNext(); };
    setCap(chunks[ci]);
    synth.speak(u);
  }

  function startSpeaking(){
    try { synth.cancel(); } catch(e){}
    chunks = splitSentences(narration(idx)); ci = 0;
    if (!chunks.length){ if (auto && idx < slides.length-1){ show(idx+1); setTimeout(startSpeaking,120); } else stop(); return; }
    playing = true;
    $('play').textContent = '❚❚ 정지';
    $('play').classList.add('playing');
    setTimeout(speakNext, 120);
  }

  function toggle(){ playing ? stop() : startSpeaking(); }
  function go(d){ const was = playing; stop(); show(idx+d); if (was) setTimeout(startSpeaking, 150); }

  /* voices */
  function loadVoices(){
    voices = synth.getVoices();
    const ko = voices.filter(v => /^ko/i.test(v.lang));
    const sel = $('voice');
    sel.innerHTML = '';
    const list = ko.length ? ko : voices;
    if (!list.length){ sel.innerHTML = '<option>음성 없음</option>'; return; }
    list.forEach((v,i) => {
      const o = document.createElement('option');
      o.value = voices.indexOf(v); o.textContent = v.name.replace(/Microsoft |Google /,'');
      sel.appendChild(o);
    });
    voice = list[0];
    sel.value = voices.indexOf(voice);
    if (!ko.length) toast('한국어 음성이 없습니다 — Chrome 또는 Edge에서 열어 보세요');
  }
  loadVoices();
  if (typeof synth.onvoiceschanged !== 'undefined') synth.onvoiceschanged = loadVoices;

  /* controls */
  $('play').onclick = toggle;
  $('prev').onclick = () => go(-1);
  $('next').onclick = () => go(1);
  $('voice').onchange = e => { voice = voices[e.target.value]; if (playing){ const w=idx; stop(); show(w); startSpeaking(); } };
  $('rate').onchange  = () => { if (playing){ const w=idx; stop(); show(w); startSpeaking(); } };
  $('auto').onclick   = e => { auto = !auto; e.target.classList.toggle('on', auto); };
  $('cap').onclick    = e => { document.body.classList.toggle('nocap'); e.target.classList.toggle('on', !document.body.classList.contains('nocap')); };
  $('full').onclick   = () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); };

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown'){ e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp'){ e.preventDefault(); go(-1); }
    else if (e.key === ' '){ e.preventDefault(); toggle(); }
    else if (e.key === 'f' || e.key === 'F'){ $('full').click(); }
    else if (e.key === 'Home'){ go(-idx); }
    else if (e.key === 'End'){ go(slides.length-1-idx); }
  });
  $('stage').addEventListener('click', e => { if (e.clientX > window.innerWidth/2) go(1); else go(-1); });
  window.addEventListener('beforeunload', () => { try{ synth.cancel(); }catch(e){} });
  window.deckGo = n => { const was = playing; stop(); show(n); if (was) setTimeout(startSpeaking, 150); };
})();
