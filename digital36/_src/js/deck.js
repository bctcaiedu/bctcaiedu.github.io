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
    u.pitch = pitch;
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

  /* voices — 기본: 여성(Google 한국의) · 남성: 실제 남성 음성, 없으면 기본 음성을 낮은 톤으로 */
  const FEMALE = /한국의|SunHi|Heami|JiMin|SeoHyeon|SoonBok|YuJin|Yuna|female|여성/i;
  const MALE   = /InJoon|Hyunsu|BongJin|GookMin|Minsu|male|남성/i;
  const PREFER_F = [/Google 한국의/i, /SunHi/i, /Heami/i, /Yuna/i];
  const PREFER_M = [/InJoon/i, /Hyunsu/i, /BongJin/i, /GookMin/i];
  let options = [], pitch = 1, gender = 'f';
  const store = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
                  set(k,v){ try { localStorage.setItem(k,v); } catch(e){} } };
  const pick = (list, prefs) => { for (const r of prefs){ const v = list.find(x => r.test(x.name)); if (v) return v; } return null; };
  const label = v => v.name.replace(/^(Microsoft|Google) /,'').replace(/ Online \(Natural\)/,'').replace(/\s*-\s*Korean.*$/,'').trim();

  function loadVoices(){
    voices = synth.getVoices();
    const ko = voices.filter(v => /^ko/i.test(v.lang) || /한국의/.test(v.name));
    const sel = $('voice');
    sel.innerHTML = '';
    options = [];
    if (!voices.length){ sel.innerHTML = '<option>음성 불러오는 중…</option>'; return; }
    const list = ko.length ? ko : voices;
    const females = list.filter(v => FEMALE.test(v.name) && !MALE.test(v.name.replace(/female/i,'')));
    const males   = list.filter(v => MALE.test(v.name.replace(/female/i,'')));
    const others  = list.filter(v => !females.includes(v) && !males.includes(v));
    const baseF   = pick(list, PREFER_F) || females[0] || list[0];

    // 여성 (기본 음성을 맨 앞에)
    [baseF, ...females.filter(v => v !== baseF)].forEach(v =>
      options.push({ v, pitch: 1, g: 'f', text: '여성 · ' + label(v) + (v === baseF ? ' (기본)' : '') }));
    // 남성: 실제 음성 우선, 없으면 기본 음성 낮은 톤
    const bestM = pick(males, PREFER_M) || males[0];
    if (bestM) [bestM, ...males.filter(v => v !== bestM)].forEach(v =>
      options.push({ v, pitch: 1, g: 'm', text: '남성 · ' + label(v) }));
    else options.push({ v: baseF, pitch: 0.62, g: 'm', text: '남성 · ' + label(baseF) + ' 낮은 톤' });
    others.forEach(v => options.push({ v, pitch: 1, g: 'x', text: label(v) }));

    options.forEach((o,i) => { const el = document.createElement('option'); el.value = i; el.textContent = o.text; sel.appendChild(el); });

    const saved = store.get('deckVoice');
    let i = options.findIndex(o => o.text === saved);
    if (i < 0) i = options.findIndex(o => o.g === (store.get('deckGender') || 'f'));
    choose(i < 0 ? 0 : i);
    if (!ko.length) toast('한국어 음성이 없습니다 — Chrome 또는 Edge에서 열어 보세요');
  }
  function choose(i){
    const o = options[i]; if (!o) return;
    voice = o.v; pitch = o.pitch; gender = o.g;
    $('voice').value = i;
    $('vf').classList.toggle('on', gender === 'f');
    $('vm').classList.toggle('on', gender === 'm');
    store.set('deckVoice', o.text); if (gender !== 'x') store.set('deckGender', gender);
  }
  function restart(){ if (playing){ const w=idx; stop(); show(w); startSpeaking(); } }
  function setGender(g){ const i = options.findIndex(o => o.g === g); if (i >= 0){ choose(i); restart(); } }
  loadVoices();
  if (typeof synth.onvoiceschanged !== 'undefined') synth.onvoiceschanged = loadVoices;

  /* controls */
  $('play').onclick = toggle;
  $('prev').onclick = () => go(-1);
  $('next').onclick = () => go(1);
  $('voice').onchange = e => { choose(+e.target.value); restart(); };
  $('vf').onclick = () => setGender('f');
  $('vm').onclick = () => setGender('m');
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
