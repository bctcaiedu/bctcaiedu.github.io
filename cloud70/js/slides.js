
/* 교사용 PPT 슬라이드 엔진
 *  - 16:9(1280×720) 고정 무대를 화면 크기에 맞춰 축소·확대
 *  - 상단 2줄 메뉴(이동·보기 / 판서 도구), 슬라이드 위 판서와 가장자리 클릭 이동
 *  - 전체 화면 발표(메뉴 자동 숨김), 교사 노트, 발표자 창, 수업 타이머
 */
(function () {
  const { esc, highlightInline, highlightCommands, highlightLines, guessLang } = window.JU;
  const $ = (id) => document.getElementById(id);
  const LAYOUT_NAME = { title: '제목', goals: '학습 목표', bullets: '개념', code: '실습', two: '비교', table: '표', diagram: '그림', quiz: '퀴즈', practice: '실습', summary: '정리' };
  const LAYOUT_ICON = { title: '🎬', goals: '🎯', bullets: '📌', code: '💻', two: '⚖️', table: '📊', diagram: '🧭', quiz: '❓', practice: '🛠️', summary: '✅' };
  const SW = 1280, SH = 720;          // 슬라이드 좌표계
  const INK_SCALE = 2;                // 캔버스 해상도 배율 (선명하게)
  const UNDO_MAX = 50;

  function bulletsHtml(items, dense) {
    if (!Array.isArray(items)) return '';
    return `<ul class="s-bullets${dense ? ' dense' : ''}">${items.map((b) => {
      if (Array.isArray(b)) return `<li>${b[0]}${Array.isArray(b[1]) ? `<ul>${b[1].map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}</li>`;
      return `<li>${b}</li>`;
    }).join('')}</ul>`;
  }

  /** 슬라이드 안의 코드가 잘리지 않도록 글자 크기(cqw)를 계산한다 */
  function autoCodeFont(code, hasPoints, isPractice) {
    const lines = String(code || '').split('\n');
    const n = Math.max(1, lines.length);
    const cols = Math.max(24, ...lines.map((l) => l.replace(/\t/g, '    ').length));
    const boxH = 32;                                   // 코드 상자 높이 (cqw 기준 대략값)
    const boxW = hasPoints ? 55 : isPractice ? 48 : 86; // 코드 상자 폭
    const byLines = boxH / (n * 1.55);
    const byCols = boxW / (cols * 0.62);
    return Math.max(0.78, Math.min(1.9, byLines, byCols));
  }

  // ==================================================================== 판서
  /**
   * 슬라이드 위 판서. 획은 슬라이드 좌표(1280×720)로 저장하므로
   * 화면 크기가 바뀌어도 그림이 슬라이드와 함께 확대·축소된다.
   * 교시별로 브라우저(localStorage)에 저장되어 새로 고쳐도 남는다.
   *  - 도구: pen(펜) marker(형광펜) line(직선) arrow(화살표) rect(사각형) ellipse(타원) text(글자) eraser(지우개) pointer(레이저)
   *  - 획: { tool, color, width, pts: [[x,y],...], text? }
   */
  const SHAPE_TOOLS = ['line', 'arrow', 'rect', 'ellipse'];
  const INK_FONT = '"Pretendard Variable", Pretendard, "Noto Sans KR", sans-serif';
  class Ink {
    constructor(canvas) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.pages = new Map();          // key → { strokes: [], undo: [], redo: [] }
      this.loaded = new Set();         // 저장소에서 읽어 온 교시
      this.key = '';
      this.cur = null;
      this.laserPts = [];
      this.tool = Runner.store.get('jc.inkTool', 'pen');
      this.color = Runner.store.get('jc.inkColor', '#e53935');
      this.width = +Runner.store.get('jc.inkWidth', 6) || 6;
      if (!['pen', 'marker', 'line', 'arrow', 'rect', 'ellipse', 'text', 'eraser', 'pointer'].includes(this.tool)) this.tool = 'pen';
    }

    // ---------------------------------------------------------------- 저장 · 불러오기
    secOf(key) { return String(key).split('@')[0]; }
    storeKey(sec) { return 'jc.ink.' + sec; }

    loadSec(sec) {
      if (!sec || this.loaded.has(sec)) return;
      this.loaded.add(sec);
      let data = null;
      try { data = JSON.parse(Runner.store.get(this.storeKey(sec), 'null')); } catch (e) { data = null; }
      if (!data || typeof data !== 'object') return;
      Object.keys(data).forEach((rest) => {
        const strokes = Array.isArray(data[rest]) ? data[rest].filter((s) => s && Array.isArray(s.pts)) : [];
        if (strokes.length) this.pages.set(`${sec}@${rest}`, { strokes, undo: [], redo: [] });
      });
    }

    /** 현재 교시의 판서를 저장 (없으면 저장소에서 제거) */
    persist(key = this.key) {
      const sec = this.secOf(key);
      if (!sec) return;
      const data = {};
      let n = 0;
      this.pages.forEach((p, k) => {
        if (!k.startsWith(sec + '@') || !p.strokes.length) return;
        data[k.slice(sec.length + 1)] = p.strokes;
        n++;
      });
      if (n) Runner.store.set(this.storeKey(sec), JSON.stringify(data));
      else Runner.store.remove(this.storeKey(sec));
    }

    page(key = this.key) {
      this.loadSec(this.secOf(key));
      if (!this.pages.has(key)) this.pages.set(key, { strokes: [], undo: [], redo: [] });
      return this.pages.get(key);
    }

    setKey(key) {
      this.key = key;
      this.cur = null;
      this.laserPts = [];
      this.redraw();
    }

    setTool(tool) { this.tool = tool; Runner.store.set('jc.inkTool', tool); this.laserPts = []; this.redraw(); }
    setColor(color) { this.color = color; Runner.store.set('jc.inkColor', color); }
    setWidth(w) { this.width = w; Runner.store.set('jc.inkWidth', w); }

    pushUndo(op) {
      const p = this.page();
      p.undo.push(op);
      p.redo = [];
      if (p.undo.length > UNDO_MAX) p.undo.shift();
    }

    // ---------------------------------------------------------------- 그리기
    begin(x, y) {
      if (this.tool === 'eraser') { this.cur = null; this.erase(x, y); return; }
      if (SHAPE_TOOLS.includes(this.tool)) { this.cur = { tool: this.tool, color: this.color, width: this.width, pts: [[x, y], [x, y]] }; this.moved = false; return; }
      this.cur = { tool: this.tool === 'marker' ? 'marker' : 'pen', color: this.color, width: this.width, pts: [[x, y]] };
      this.moved = false;
    }

    move(x, y, shift) {
      if (this.tool === 'eraser') { this.erase(x, y); return; }
      if (!this.cur) return;
      const pts = this.cur.pts;
      if (SHAPE_TOOLS.includes(this.cur.tool)) {
        let ex = x, ey = y;
        const [sx, sy] = pts[0];
        if (shift) {
          // Shift: 정사각형 · 정원 · 수평/수직/45° 선
          if (this.cur.tool === 'rect' || this.cur.tool === 'ellipse') { const d = Math.max(Math.abs(x - sx), Math.abs(y - sy)); ex = sx + Math.sign(x - sx || 1) * d; ey = sy + Math.sign(y - sy || 1) * d; }
          else { const dx = x - sx, dy = y - sy; const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4); const len = Math.hypot(dx, dy); ex = sx + Math.cos(ang) * len; ey = sy + Math.sin(ang) * len; }
        }
        pts[1] = [ex, ey];
        this.moved = Math.hypot(ex - sx, ey - sy) > 2;
        this.redraw();
        return;
      }
      const last = pts[pts.length - 1];
      if (Math.hypot(x - last[0], y - last[1]) < 1.2) return;
      pts.push([x, y]);
      this.moved = true;
      this.redraw();
    }

    /** 끌지 않은 단순 클릭은 점을 남기지 않는다 */
    end() {
      const s = this.cur;
      this.cur = null;
      if (!s || s.pts.length < 2 || (SHAPE_TOOLS.includes(s.tool) && !this.moved)) { this.redraw(); return false; }
      const p = this.page();
      p.strokes.push(s);
      this.pushUndo({ type: 'add' });
      this.persist();
      this.redraw();
      return true;
    }

    /** 글자 넣기 (클릭한 자리가 왼쪽 위) */
    addText(x, y, text) {
      const t = String(text || '').trim();
      if (!t) return false;
      const p = this.page();
      p.strokes.push({ tool: 'text', color: this.color, width: this.width, pts: [[x, y]], text: t });
      this.pushUndo({ type: 'add' });
      this.persist();
      this.redraw();
      return true;
    }

    /** 레이저 포인터: 지나간 자리가 잠깐 빛난다 */
    laser(x, y) {
      const now = performance.now();
      this.laserPts.push([x, y, now]);
      this.laserPts = this.laserPts.filter((q) => now - q[2] < 700).slice(-40);
      this.redraw();
      clearTimeout(this._laserT);
      this._laserT = setTimeout(() => { this.laserPts = []; this.redraw(); }, 750);
    }
    laserOff() { this.laserPts = []; clearTimeout(this._laserT); this.redraw(); }

    /** 획의 외곽 점들 (지우개 · 판정용) */
    outline(s) {
      if (s.tool === 'rect') { const [a, b] = s.pts; return [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]], [a[0], a[1]]]; }
      if (s.tool === 'ellipse') { const [a, b] = s.pts; const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, rx = Math.abs(b[0] - a[0]) / 2, ry = Math.abs(b[1] - a[1]) / 2; const out = []; for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI * 2; out.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); } return out; }
      if (s.tool === 'text') { const [x, y] = s.pts[0]; const h = this.textSize(s), w = this.textWidth(s); return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]; }
      return s.pts;
    }
    textSize(s) { return 14 + (s.width || 6) * 3; }
    textWidth(s) {
      const ctx = this.ctx;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = `700 ${this.textSize(s)}px ${INK_FONT}`;
      const w = Math.max(...String(s.text).split('\n').map((l) => ctx.measureText(l).width));
      ctx.restore();
      return w;
    }

    /** 스친 획을 통째로 지운다 */
    erase(x, y) {
      const p = this.page();
      const r = Math.max(9, this.width * 1.6);
      const removed = [];
      for (let i = p.strokes.length - 1; i >= 0; i--) {
        const s = p.strokes[i];
        const pts = this.outline(s);
        const hitR = r + (s.tool === 'marker' ? s.width * 1.3 : s.width / 2);
        let hit = false;
        if (s.tool === 'text' || s.tool === 'rect') {
          // 글자 · 사각형은 안쪽을 눌러도 지워진다
          const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
          if (x >= Math.min(...xs) - hitR && x <= Math.max(...xs) + hitR && y >= Math.min(...ys) - hitR && y <= Math.max(...ys) + hitR) hit = true;
        }
        for (let k = 0; k < pts.length && !hit; k++) {
          const [px, py] = pts[k];
          if (Math.hypot(px - x, py - y) <= hitR) hit = true;
          if (!hit && k > 0) hit = segNear(pts[k - 1], pts[k], x, y, hitR);
        }
        if (hit) removed.push({ index: i, stroke: s });
      }
      if (!removed.length) return;
      removed.forEach((it) => p.strokes.splice(it.index, 1));
      this.pushUndo({ type: 'erase', items: removed });
      this.persist();
      this.redraw();
    }

    undo() {
      const p = this.page();
      // 되돌리기 기록이 없어도(새로 고친 뒤) 마지막 획은 지울 수 있게
      const op = p.undo.pop() || (p.strokes.length ? { type: 'add' } : null);
      if (!op) return false;
      if (op.type === 'add') { const s = p.strokes.pop(); p.redo.push({ type: 'add', stroke: s }); }
      else if (op.type === 'erase') { op.items.slice().reverse().forEach((it) => p.strokes.splice(it.index, 0, it.stroke)); p.redo.push({ type: 'erase', items: op.items }); }
      else if (op.type === 'clear') { p.strokes = op.strokes; p.redo.push({ type: 'clear' }); }
      this.persist();
      this.redraw();
      return true;
    }

    redo() {
      const p = this.page();
      const op = p.redo.pop();
      if (!op) return false;
      if (op.type === 'add') { p.strokes.push(op.stroke); p.undo.push({ type: 'add' }); }
      else if (op.type === 'erase') { op.items.forEach((it) => p.strokes.splice(it.index, 1)); p.undo.push({ type: 'erase', items: op.items }); }
      else if (op.type === 'clear') { p.undo.push({ type: 'clear', strokes: p.strokes }); p.strokes = []; }
      this.persist();
      this.redraw();
      return true;
    }

    clearPage() {
      const p = this.page();
      if (!p.strokes.length) return false;
      p.undo.push({ type: 'clear', strokes: p.strokes });
      p.redo = [];
      p.strokes = [];
      this.persist();
      this.redraw();
      return true;
    }

    clearAll(prefix) {
      let n = 0;
      [...this.pages.keys()].forEach((k) => {
        if (!prefix || k.startsWith(prefix)) { if (this.pages.get(k).strokes.length) n++; this.pages.delete(k); }
      });
      if (prefix) Runner.store.remove(this.storeKey(prefix.replace(/@$/, '')));
      this.redraw();
      return n;
    }

    hasInk(key) {
      const p = this.page(key || this.key);
      return !!(p && p.strokes.length);
    }

    /** 현재 슬라이드 판서를 PNG 로 (투명 배경) */
    toDataURL() { return this.cv.toDataURL('image/png'); }

    // ---------------------------------------------------------------- 그리기
    drawStroke(ctx, s) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.tool === 'marker' ? 0.35 : 1;
      ctx.lineWidth = s.tool === 'marker' ? s.width * 2.6 : s.width;
      const pts = s.pts;
      if (s.tool === 'text') {
        const size = this.textSize(s);
        ctx.font = `700 ${size}px ${INK_FONT}`;
        ctx.textBaseline = 'top';
        // 흰 테두리 (어두운 배경에서도 읽히게)
        ctx.lineWidth = Math.max(2, size / 8);
        ctx.strokeStyle = s.color === '#ffffff' ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.85)';
        String(s.text).split('\n').forEach((line, i) => { ctx.strokeText(line, pts[0][0], pts[0][1] + i * size * 1.25); ctx.fillText(line, pts[0][0], pts[0][1] + i * size * 1.25); });
        ctx.restore();
        return;
      }
      if (pts.length < 2) { ctx.restore(); return; }
      const [a, b] = pts;
      ctx.beginPath();
      if (s.tool === 'rect') ctx.rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
      else if (s.tool === 'ellipse') ctx.ellipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.abs(b[0] - a[0]) / 2, Math.abs(b[1] - a[1]) / 2, 0, 0, Math.PI * 2);
      else if (s.tool === 'line' || s.tool === 'arrow') { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      else { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); }
      ctx.stroke();
      if (s.tool === 'arrow') {
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const len = Math.max(14, s.width * 3.2);
        ctx.beginPath();
        ctx.moveTo(b[0], b[1]);
        ctx.lineTo(b[0] - len * Math.cos(ang - Math.PI / 6), b[1] - len * Math.sin(ang - Math.PI / 6));
        ctx.lineTo(b[0] - len * Math.cos(ang + Math.PI / 6), b[1] - len * Math.sin(ang + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    redraw() {
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.cv.width, this.cv.height);
      ctx.setTransform(INK_SCALE, 0, 0, INK_SCALE, 0, 0);
      const p = this.page();
      const all = this.cur ? p.strokes.concat([this.cur]) : p.strokes;
      all.forEach((s) => this.drawStroke(ctx, s));
      // 레이저 포인터
      if (this.laserPts.length) {
        const now = performance.now();
        this.laserPts.forEach((q, i) => {
          const age = (now - q[2]) / 700;
          const last = i === this.laserPts.length - 1;
          ctx.save();
          ctx.globalAlpha = Math.max(0, last ? 1 : 0.5 - age * 0.5);
          const r = last ? 9 : 5;
          const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r * 2.2);
          g.addColorStop(0, '#ff1744'); g.addColorStop(0.5, 'rgba(255,23,68,.6)'); g.addColorStop(1, 'rgba(255,23,68,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(q[0], q[1], r * 2.2, 0, Math.PI * 2); ctx.fill();
          if (last) { ctx.fillStyle = '#ff1744'; ctx.beginPath(); ctx.arc(q[0], q[1], r * 0.55, 0, Math.PI * 2); ctx.fill(); }
          ctx.restore();
        });
      }
    }
  }

  /** 선분과 점 사이 거리가 r 이내인가 */
  function segNear(a, b, x, y, r) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((x - a[0]) * dx + (y - a[1]) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(a[0] + t * dx - x, a[1] + t * dy - y) <= r;
  }

  const INTERACTIVE = 'button, a, input, textarea, select, summary, details, .opt, .CodeMirror, [data-act], [data-opt]';

  // ==================================================================== 덱
  class Deck {
    constructor(app) {
      this.app = app;
      this.console = app.console;
      this.slides = [];
      this.index = 0;
      this.edits = {};
      this.solutionOn = {};
      this.editor = null;
      this.notesOpen = Runner.store.get('jc.notesOpen', '1') === '1';
      this.stage = $('stage');
      this.slideHost = $('slideHost');
      this.view = $('slideView');
      this.wrap = $('deckWrap');
      this.host = $('stageHost');
      this.timer = { start: 0, acc: 0 };
      this.channel = 'BroadcastChannel' in window ? new BroadcastChannel('ubuntu-presenter') : null;
      this.ink = new Ink($('inkCanvas'));
      this.board = null;                // 빈 칠판: null | 'white' | 'black'
      this.slideKey = '';
      this.bind();
      this.syncDrawBar();
    }

    get active() { return !this.view.classList.contains('hidden'); }
    get key() { return `${this.sec ? this.sec.id : '?'}@${this.index}`; }

    // ---------------------------------------------------------------- 데이터
    open(ch, sec, index) {
      const sameSection = this.sec && this.sec.id === sec.id;
      this.ch = ch;
      this.sec = sec;
      this.slides = this.build(ch, sec);
      const n = this.slides.length;
      this.index = index === 'last' ? n - 1 : Math.max(0, Math.min(n - 1, (index | 0)));
      if (!sameSection) this.fsConsole = false;
      $('notesPane').classList.toggle('collapsed', !this.notesOpen);
      $('notesToggle').textContent = this.notesOpen ? '▾ 접기' : '▸ 펼치기';
      this.render();
    }

    build(ch, sec) {
      const list = (sec.slides || []).map((s) => Object.assign({}, s));
      const hasGoals = list.some((s) => s.layout === 'goals' || /학습\s*목표/.test(s.title || ''));
      if (!list.length || list[0].layout !== 'title') {
        list.unshift({ layout: 'title', title: sec.title, subtitle: ch.title, notes: '<p>이번 교시를 소개합니다.</p>', auto: true });
      }
      if (!hasGoals && sec.goals && sec.goals.length) {
        list.splice(1, 0, {
          layout: 'goals', title: '학습 목표', goals: sec.goals, flow: sec.flow, auto: true,
          notes: `<p>이번 시간에 배울 내용을 소개합니다. 목표를 소리 내어 함께 읽고, 수업이 끝날 때 다시 확인합니다.</p>${(sec.flow || []).length ? `<p class="muted">수업 흐름: ${sec.flow.map((f) => `${esc(f[0])} ${f[1]}분`).join(' → ')}</p>` : ''}`
        });
      }
      return list;
    }

    // ---------------------------------------------------------------- 렌더링
    render() {
      const s = this.slides[this.index];
      if (!s) { this.slideHost.innerHTML = ''; return; }
      const teacher = this.app.role === 'teacher';
      this.editor = null;
      const key = this.key;
      const top = `<div class="s-top"><span class="s-ch">${this.ch.extra ? "심화" : "Day " + esc(this.ch.no)}</span><span>${esc(this.ch.title)}</span><span class="spacer"></span><span>${esc(this.sec.title)}</span></div>`;
      const foot = `<div class="s-foot"><span>☁️ 클라우드 기초 70시간</span><span class="spacer"></span><span class="pg">${this.index + 1} / ${this.slides.length}</span></div>`;
      const title = `<h2 class="s-title">${s.title || ''}</h2>`;
      const lead = s.lead ? `<p class="s-lead">${s.lead}</p>` : '';
      let html = '';
      let cls = 'slide';

      switch (s.layout) {
        case 'title':
          cls += ' title-slide';
          html = `<div class="badge">${esc(s.badge || `${this.ch.extra ? "심화" : "Day " + this.ch.no} · ${this.ch.title}`)}</div>
            <h1>${s.title}</h1>
            ${s.subtitle ? `<div class="sub">${s.subtitle}</div>` : ''}
            <div class="meta"><span>⏱ ${this.sec.minutes || 50}분</span><span>🖼️ 슬라이드 ${this.slides.length}장</span></div>
            <div class="deco">☁️</div>`;
          break;
        case 'goals':
          html = top + title + `<div class="s-body"><div class="s-goals${s.goals.length > 3 ? ' dense' : ''}">${s.goals.map((g) => `<div>${g}</div>`).join('')}</div>
            ${(s.flow || []).length ? `<div class="s-flow">${s.flow.map((f) => `<div style="flex:${f[1]}"><b>${esc(f[0])}</b> ${f[1]}분</div>`).join('')}</div>` : ''}</div>` + foot;
          break;
        case 'bullets':
          html = top + title + lead + `<div class="s-body">${bulletsHtml(s.bullets, (s.bullets || []).length > 5)}</div>` + foot;
          break;
        case 'summary':
          cls += ' summary-slide';
          html = top + title + lead + `<div class="s-body">${bulletsHtml(s.bullets, (s.bullets || []).length > 5)}</div>` + foot;
          break;
        case 'code': {
          const isFile = s.path || (s.lang && !/^(bash|sh|shell)$/.test(s.lang));
          const vm = s.vm || s.run === false;
          const body = isFile ? highlightLines(s.code, s.lang || guessLang(s.path, s.code)) : highlightCommands(s.code, s.root);
          html = top + title + lead + `<div class="s-body"><div class="s-code${s.points && s.points.length ? ' has-points' : ''}">
              <div class="s-editor s-term-box${isFile ? ' is-file' : ''}${vm ? ' vm' : ''}">
                <div class="s-editor-bar"><span class="fname">${isFile ? '📄 ' + esc(s.path || '파일') : vm ? '🖥 실제 클라우드에서' : '💻 터미널'}</span>
                  <button class="btn ghost small" data-act="font-" title="글자 작게">A−</button>
                  <button class="btn ghost small" data-act="font+" title="글자 크게">A+</button>
                  <button class="btn ghost small" data-act="copy" title="복사">⧉</button>
                  ${!isFile && !vm ? '<button class="btn primary small" data-act="run" title="오른쪽 터미널에서 실행">▶ 실행</button>' : ''}</div>
                <pre class="s-pre${isFile ? '' : ' cmd'}">${body}</pre>
              </div>
              ${s.points && s.points.length ? `<ul class="s-points">${s.points.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}
            </div></div>` + foot;
          break;
        }
        case 'two': {
          const col = (c, i) => {
            if (!c) return '<div class="s-col"></div>';
            let inner = '';
            if (c.bullets) inner += bulletsHtml(c.bullets, true);
            if (c.html) inner += `<div>${JU.scoped(c.html)}</div>`;
            if (c.code) inner += `<pre class="s-static${c.lang ? '' : ' cmd'}">${c.lang ? highlightInline(c.code, c.lang) : highlightCommands(c.code)}</pre>`;
            const runBtn = c.code && c.run !== false && !c.lang && !c.vm ? `<button class="btn ghost small" data-act="run-col" data-col="${i}" style="float:right;font-size:1.1cqw">▶ 실행</button>` : '';
            return `<div class="s-col"><h3>${runBtn}${c.title || ''}</h3>${inner}</div>`;
          };
          html = top + title + lead + `<div class="s-body"><div class="s-two">${col(s.left, 'left')}${col(s.right, 'right')}</div></div>` + foot;
          break;
        }
        case 'table': {
          const rows = s.rows || [];
          const dense = rows.length > 6 || (s.head || []).length > 3;
          html = top + title + lead + `<div class="s-body"><table class="s-table${dense ? ' dense' : ''}"><thead><tr>${(s.head || []).map((h) => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` + foot;
          break;
        }
        case 'diagram':
          html = top + title + lead + `<div class="s-body"><div class="s-diagram"><div class="d-host">${JU.scoped(s.html)}</div>${s.caption ? `<div class="cap">${s.caption}</div>` : ''}</div></div>` + foot;
          break;
        case 'quiz':
          html = top + title + `<div class="s-body s-quiz"><div class="q">${s.q || ''}</div>
            <div class="opts">${(s.options || []).map((o, i) => `<button class="opt" data-opt="${i}"><span class="n">${i + 1}</span><span>${o}</span></button>`).join('')}</div>
            <div class="explain hidden">${s.explain || ''}</div>
            ${teacher ? '<div class="reveal"><button class="btn ghost small" data-act="reveal">정답 공개</button></div>' : ''}</div>` + foot;
          break;
        case 'practice': {
          const sol = !!this.solutionOn[key];
          html = top + title + `<div class="s-body"><div class="s-practice"><div class="desc">${s.desc || ''}</div>
              <div class="s-editor s-term-box">
                <div class="s-editor-bar"><span class="fname">${sol ? '🔑 정답 명령' : '🛠️ 직접 해 보기'}</span>
                  ${teacher && s.solution ? `<button class="btn ghost small${sol ? ' sol-on' : ''}" data-act="solution" title="정답 명령 보기/숨기기">${sol ? '✓ 정답' : '🔑 정답'}</button>` : ''}
                  ${sol ? '<button class="btn primary small" data-act="run-sol" title="정답 명령을 터미널에서 실행">▶ 실행</button>' : ''}</div>
                ${sol ? `<pre class="s-pre cmd">${highlightCommands(s.solution)}</pre>` : `<div class="s-try">오른쪽 <b>가상 터미널</b>에서<br>직접 명령을 입력해 보세요.${s.hint ? `<div class="s-hint">💡 ${s.hint}</div>` : ''}</div>`}
              </div></div></div>` + foot;
          break;
        }
        default:
          html = top + title + `<div class="s-body">${s.html ? JU.scoped(s.html) : bulletsHtml(s.bullets)}</div>` + foot;
      }

      this.slideHost.innerHTML = `<div class="${cls}">${html}</div>`;
      const slideEl = this.slideHost.firstElementChild;

      // 코드 글자 크기
      const pre = slideEl.querySelector('.s-editor');
      if (pre) {
        const code = s.layout === 'practice' ? (s.solution || '') : (s.code || '');
        const manual = +(Runner.store.get('jc.slideCodeFont', '0')) || 0;
        const fsz = manual || autoCodeFont(code, !!(s.points && s.points.length), s.layout === 'practice');
        pre.style.setProperty('--s-code-font', fsz.toFixed(2) + 'cqw');
      }

      slideEl.addEventListener('click', (e) => this.onSlideClick(e, s));
      this.slideKey = key;
      this.ink.setKey(this.inkKey());
      this.syncDrawBar();
      if (this.isFull()) this.showConsole(false);   // 슬라이드를 넘기면 결과 창은 닫힌 상태로 시작
      this.updateChrome();
      this.renderNotes();
      this.broadcast();
      this.app.onSlideChange(this.sec, this.index);
      this.fit();
    }

    onSlideClick(e, s) {
      const act = e.target.closest('[data-act]');
      const opt = e.target.closest('[data-opt]');
      if (opt && s.layout === 'quiz') {
        const i = +opt.dataset.opt;
        opt.classList.add(i === s.answer ? 'right' : 'wrong');
        if (i === s.answer) this.slideHost.querySelector('.explain').classList.remove('hidden');
        return;
      }
      if (!act) return;
      const a = act.dataset.act;
      if (a === 'run') this.runCode(s.code);
      else if (a === 'run-sol') this.runCode(s.solution);
      else if (a === 'copy') { try { navigator.clipboard.writeText(s.code || s.solution || ''); this.app.toast('복사했습니다'); } catch (err) { /* 무시 */ } }
      else if (a === 'font+' || a === 'font-') {
        const cur = +(Runner.store.get('jc.slideCodeFont', '0')) || 1.45;
        const next = Math.max(0.9, Math.min(2.6, cur + (a === 'font+' ? 0.15 : -0.15)));
        Runner.store.set('jc.slideCodeFont', next.toFixed(2));
        this.slideHost.querySelector('.s-editor').style.setProperty('--s-code-font', next.toFixed(2) + 'cqw');
      } else if (a === 'solution') {
        this.solutionOn[this.key] = !this.solutionOn[this.key];
        this.render();
      } else if (a === 'reveal') {
        this.slideHost.querySelectorAll('.opt').forEach((o) => { if (+o.dataset.opt === s.answer) o.classList.add('right'); });
        this.slideHost.querySelector('.explain').classList.remove('hidden');
      } else if (a === 'run-col') {
        const c = s[act.dataset.col];
        this.runCode(c.code);
      }
    }

    runCode(code) {
      if (!code) return;
      if (this.isFull()) this.showConsole(true);
      this.app.runCommands(code);
    }

    renderNotes() {
      const body = $('notesBody');
      const s = this.slides[this.index];
      $('notesMeta').textContent = `${LAYOUT_ICON[s.layout] || ''} ${LAYOUT_NAME[s.layout] || ''} · ${this.index + 1}/${this.slides.length}`;
      const nextS = this.slides[this.index + 1];
      $('notesNext').innerHTML = nextS ? `다음 ▸ ${String(nextS.title || '').replace(/<[^>]+>/g, '')}` : '마지막 슬라이드';
      if (this.app.role !== 'teacher') { body.innerHTML = ''; return; }
      let answer = '';
      if (s.layout === 'quiz' && typeof s.answer === 'number') {
        answer = `<div class="answer"><b>정답: ${s.answer + 1}번</b> — ${(s.options || [])[s.answer] || ''}${s.explain ? `<div>${s.explain}</div>` : ''}</div>`;
      }
      if (s.layout === 'practice' && s.solution) {
        answer = `<div class="answer"><b>🔑 정답 명령</b> <button class="btn small ghost" id="noteRunSol">▶ 정답 실행</button> <button class="btn small ghost" id="noteShowSol">슬라이드에 표시</button>
          <pre style="margin:6px 0 0;font-size:12.5px;overflow:auto;max-height:260px">${highlightInline(s.solution)}</pre></div>`;
      }
      const flow = (this.sec.flow || []).map((f) => `<div class="row"><span>${esc(f[0])}</span><b>${f[1]}분</b></div>`).join('');
      body.innerHTML = `<div class="n-grid"><div class="n-notes">${s.notes || '<p class="muted">노트 없음</p>'}${answer}</div>
        <div class="n-side"><h5>⏱ 수업 흐름 (${this.sec.minutes || 50}분)</h5>${flow || '<span class="muted">-</span>'}</div></div>`;
      const run = $('noteRunSol');
      if (run) run.onclick = () => this.runCode(s.solution);
      const show = $('noteShowSol');
      if (show) show.onclick = () => { this.solutionOn[this.key] = true; this.render(); };
    }

    updateChrome() {
      const n = this.slides.length;
      const txt = `${this.index + 1} / ${n}`;
      $('sCount').textContent = txt;
      $('fsCount').textContent = txt;
      const slider = $('sSlider');
      slider.max = String(n);
      slider.value = String(this.index + 1);
      $('sTitle').textContent = String(this.slides[this.index].title || '').replace(/<[^>]+>/g, '');
      $('deckProgress').style.width = (n > 1 ? (this.index) / (n - 1) * 100 : 100) + '%';
      $('sPrev').disabled = false;
      if (!$('gridOverlay').classList.contains('hidden')) this.renderGrid();
    }

    // ---------------------------------------------------------------- 이동
    go(i) {
      if (i < 0) return this.app.stepSection(-1, 'last');
      if (i >= this.slides.length) return this.app.stepSection(1, 0);
      this.index = i;
      this.render();
    }
    next() { this.go(this.index + 1); }
    prev() { this.go(this.index - 1); }

    renderGrid() {
      const g = $('gridOverlay');
      g.innerHTML = `<h4>▦ ${esc(this.sec.title)} <span class="muted" style="font-weight:500">슬라이드 ${this.slides.length}장</span><span class="spacer"></span><button class="btn small ghost" data-close>닫기 (Esc)</button></h4>
        <div class="grid-list">${this.slides.map((s, i) => `<button class="grid-item${i === this.index ? ' cur' : ''}" data-i="${i}">
          <span class="gi-n">${i + 1}${this.ink.hasInk(`${this.sec.id}@${i}`) ? ' ✏️' : ''}</span><span class="gi-l">${LAYOUT_ICON[s.layout] || ''} ${LAYOUT_NAME[s.layout] || s.layout}</span>
          <span class="gi-t">${String(s.title || '').replace(/<[^>]+>/g, '')}</span></button>`).join('')}</div>`;
    }
    toggleGrid(force) {
      const g = $('gridOverlay');
      const show = force != null ? force : g.classList.contains('hidden');
      g.classList.toggle('hidden', !show);
      if (show) this.renderGrid();
    }

    toggleNotes(force) {
      this.notesOpen = force != null ? force : !this.notesOpen;
      Runner.store.set('jc.notesOpen', this.notesOpen ? '1' : '0');
      $('notesPane').classList.toggle('collapsed', !this.notesOpen);
      $('notesToggle').textContent = this.notesOpen ? '▾ 접기' : '▸ 펼치기';
      this.fit();
    }

    // ---------------------------------------------------------------- 슬라이드 위 조작 (판서 · 가장자리 클릭)
    locate(e) {
      const r = this.stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * SW;
      const y = (e.clientY - r.top) / r.height * SH;
      const edgePx = Math.max(28, r.width * 0.06);
      const edge = edgePx / r.width * SW;
      return { x, y, zone: x < edge ? 'left' : x > SW - edge ? 'right' : 'center' };
    }

    /** 판서 키: 슬라이드 키 + (빈 칠판이면 #board) */
    inkKey() { return this.slideKey + (this.board ? '#board' : ''); }

    onStagePointerDown(e) {
      if (e.button !== 0 || !this.sec) return;
      if (e.target.closest(INTERACTIVE) && !this.board) return;
      const { x, y, zone } = this.locate(e);
      if (zone !== 'center' && !this.board) { this.edgeDown = zone; return; }
      if (this.app.role !== 'teacher' || this.ink.tool === 'pointer') return;
      if (this.ink.tool === 'text') {
        e.preventDefault();
        const t = window.prompt('넣을 글자 (여러 줄은 \\n 으로)', '');
        if (t != null) this.ink.addText(x, y, t.replace(/\\n/g, '\n'));
        return;
      }
      this.drawing = true;
      this.stage.classList.add('drawing');
      this.stage.classList.remove('edge-l', 'edge-r');
      try { this.stage.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
      this.ink.begin(x, y);
      e.preventDefault();
    }

    onStagePointerMove(e) {
      if (!this.sec) return;
      const { x, y, zone } = this.locate(e);
      if (this.drawing) { this.ink.move(x, y, e.shiftKey); return; }
      if (this.app.role === 'teacher' && this.ink.tool === 'pointer' && x >= 0 && y >= 0 && x <= SW && y <= SH) this.ink.laser(x, y);
      const overUi = !!e.target.closest(INTERACTIVE);
      this.stage.classList.toggle('edge-l', !overUi && !this.board && zone === 'left');
      this.stage.classList.toggle('edge-r', !overUi && !this.board && zone === 'right');
    }

    /** 빈 칠판 켜기/끄기 (같은 색을 다시 누르면 슬라이드로) */
    toggleBoard(color) {
      this.board = this.board === color ? null : color;
      const el = $('inkBoard');
      el.classList.toggle('hidden', !this.board);
      el.classList.toggle('black', this.board === 'black');
      this.stage.classList.toggle('on-board', !!this.board);
      if (this.board && this.ink.tool === 'pointer') this.ink.setTool('pen');
      // 흰 칠판에 흰 펜 · 검은 칠판에 검은 펜이면 보이도록 색을 바꿔 준다
      if (this.board === 'white' && this.ink.color === '#ffffff') this.ink.setColor('#111111');
      if (this.board === 'black' && this.ink.color === '#111111') this.ink.setColor('#ffffff');
      this.ink.setKey(this.inkKey());
      this.syncDrawBar();
      this.app.toast(this.board ? `빈 칠판 (${this.board === 'white' ? '흰' : '검은'} 배경) — 다시 누르거나 Esc 로 슬라이드로 돌아갑니다` : '슬라이드로 돌아왔습니다');
    }

    /** 판서를 PNG 로 내려받기 (칠판이면 배경 포함) */
    saveInkPng() {
      if (!this.ink.hasInk()) { this.app.toast('저장할 판서가 없습니다'); return; }
      const cv = document.createElement('canvas');
      cv.width = this.ink.cv.width; cv.height = this.ink.cv.height;
      const ctx = cv.getContext('2d');
      if (this.board) { ctx.fillStyle = this.board === 'black' ? '#1b1f27' : '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height); }
      ctx.drawImage(this.ink.cv, 0, 0);
      const a = document.createElement('a');
      a.href = cv.toDataURL('image/png');
      a.download = `${this.sec ? this.sec.id : 'slide'}-${this.index + 1}${this.board ? '-board' : ''}-판서.png`;
      a.click();
      this.app.toast('판서를 PNG 로 저장했습니다');
    }

    onStagePointerUp(e) {
      if (this.drawing) {
        this.drawing = false;
        this.stage.classList.remove('drawing');
        try { this.stage.releasePointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
        this.ink.end();
        this.onStagePointerMove(e);
        return;
      }
      if (!this.edgeDown) return;
      const zone = this.locate(e).zone;
      const from = this.edgeDown;
      this.edgeDown = null;
      if (zone !== from || e.target.closest(INTERACTIVE)) return;
      if (from === 'left') this.prev(); else this.next();
    }

    syncDrawBar() {
      document.querySelectorAll('.tool-btn').forEach((b) => b.classList.toggle('active', b.dataset.tool === this.ink.tool));
      document.querySelectorAll('.color-btn').forEach((b) => b.classList.toggle('active', b.dataset.color === this.ink.color));
      document.querySelectorAll('.width-btn').forEach((b) => b.classList.toggle('active', +b.dataset.width === this.ink.width));
      document.querySelectorAll('.board-btn').forEach((b) => b.classList.toggle('active', b.dataset.board === this.board));
      this.stage.classList.remove('tool-pen', 'tool-marker', 'tool-line', 'tool-arrow', 'tool-rect', 'tool-ellipse', 'tool-text', 'tool-eraser', 'tool-pointer', 'no-ink');
      // 판서는 교사용 전용 — 학생 화면에서는 보통 커서를 쓴다
      if (this.app.role !== 'teacher') this.stage.classList.add('no-ink');
      else this.stage.classList.add('tool-' + this.ink.tool);
    }

    // ---------------------------------------------------------------- 전체 화면 · 결과 패널
    isFull() { return this.view.classList.contains('is-full'); }

    async toggleFull() {
      if (this.isFull()) {
        if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch (e) { /* 무시 */ } }
        this.view.classList.remove('pfull');
        this.onFullChange();
        return;
      }
      try {
        if (!this.view.requestFullscreen) throw new Error('unsupported');
        await this.view.requestFullscreen();
      } catch (e) {
        // 전체 화면 API 를 쓸 수 없는 환경(iframe 등): 창 전체를 채우는 발표 모드
        this.view.classList.add('pfull');
        this.onFullChange();
      }
    }

    onFullChange() {
      const panel = $('consolePanel');
      const slot = $('fsConsoleSlot');
      const full = document.fullscreenElement === this.view || this.view.classList.contains('pfull');
      this.view.classList.toggle('is-full', full);
      if (full) {
        slot.appendChild(panel);
        slot.classList.toggle('off', !this.fsConsole);
        // 모달 · 토스트도 전체 화면 안에서 보이도록 옮긴다 (크게 보기 등)
        this.view.appendChild($('modal'));
        this.view.appendChild($('toast'));
      } else {
        $('output').appendChild(panel);
        document.body.appendChild($('modal'));
        document.body.appendChild($('toast'));
        this.view.classList.remove('bars-on');
      }
      this.fit();
      setTimeout(() => this.fit(), 120);
    }

    showConsole(on) {
      this.fsConsole = on;
      $('fsConsoleSlot').classList.toggle('off', !on);
      this.fit();
    }

    fit() {
      const host = this.host;
      const cs = getComputedStyle(host);
      const w = host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const h = host.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (w <= 0 || h <= 0) return;
      const width = Math.floor(Math.min(w, h * 16 / 9));
      if (this.stage.style.width !== width + 'px') {
        this.stage.style.width = width + 'px';
      }
    }

    blackout(force) {
      const b = $('blackout');
      b.classList.toggle('hidden', force != null ? !force : !b.classList.contains('hidden'));
    }

    // ---------------------------------------------------------------- 타이머
    timerToggle() {
      if (this.timer.start) { this.timer.acc += Date.now() - this.timer.start; this.timer.start = 0; }
      else this.timer.start = Date.now();
      this.timerDraw();
    }
    timerReset() { this.timer.acc = 0; if (this.timer.start) this.timer.start = Date.now(); this.timerDraw(); }
    timerDraw() {
      const ms = this.timer.acc + (this.timer.start ? Date.now() - this.timer.start : 0);
      const m = Math.floor(ms / 60000), sec = Math.floor(ms / 1000) % 60;
      $('timerText').textContent = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      $('timerBox').classList.toggle('running', !!this.timer.start);
      $('timerBox').classList.toggle('over', this.sec && m >= (this.sec.minutes || 50));
    }

    // ---------------------------------------------------------------- 발표자 창
    broadcast() {
      if (!this.channel || !this.sec) return;
      const s = this.slides[this.index];
      const n = this.slides[this.index + 1];
      let notes = s.notes || '';
      if (s.layout === 'quiz' && typeof s.answer === 'number') notes += `<p><b>정답: ${s.answer + 1}번</b> ${(s.options || [])[s.answer] || ''}</p>`;
      this.channel.postMessage({
        type: 'state', lesson: `${this.ch.extra ? "심화" : "Day " + this.ch.no} ${this.ch.title} · ${this.sec.title}`, index: this.index, total: this.slides.length,
        title: s.title, notes, next: n ? n.title : '', schedule: this.sec.flow || [], minutes: this.sec.minutes || 50
      });
    }

    // ---------------------------------------------------------------- 이벤트
    bind() {
      // 첫째 줄
      $('sFirst').onclick = () => this.go(0);
      $('sPrev').onclick = () => this.prev();
      $('sNext').onclick = () => this.next();
      $('sSlider').oninput = (e) => { const i = +e.target.value - 1; if (i !== this.index) this.go(i); };
      $('sGrid').onclick = () => this.toggleGrid();
      $('sDoc').onclick = () => this.app.setView('doc');
      $('sFull').onclick = () => this.toggleFull();
      $('sPresenter').onclick = () => { (function(){var w=window.open('', 'ubuntu-presenter', 'width=1100,height=720'); if(w && !w.document.getElementById('notes')){w.document.open(); w.document.write(window.__PRESENTER_HTML__); w.document.close();} return w;})(); setTimeout(() => this.broadcast(), 800); };
      $('timerBox').onclick = () => this.timerToggle();
      $('timerReset').onclick = () => this.timerReset();
      $('consoleHideBtn').onclick = () => this.showConsole(false);
      setInterval(() => this.timerDraw(), 500);

      // 둘째 줄: 판서 도구
      document.querySelectorAll('.tool-btn').forEach((b) => b.onclick = () => { this.ink.setTool(b.dataset.tool); this.syncDrawBar(); });
      document.querySelectorAll('.color-btn').forEach((b) => b.onclick = () => {
        this.ink.setColor(b.dataset.color);
        if (this.ink.tool === 'eraser' || this.ink.tool === 'pointer') this.ink.setTool('pen');
        this.syncDrawBar();
      });
      document.querySelectorAll('.width-btn').forEach((b) => b.onclick = () => {
        this.ink.setWidth(+b.dataset.width);
        if (this.ink.tool === 'eraser' || this.ink.tool === 'pointer') this.ink.setTool('pen');
        this.syncDrawBar();
      });
      $('inkUndo').onclick = () => { if (!this.ink.undo()) this.app.toast('되돌릴 판서가 없습니다'); };
      $('inkRedo').onclick = () => { if (!this.ink.redo()) this.app.toast('다시 실행할 판서가 없습니다'); };
      $('inkSave').onclick = () => this.saveInkPng();
      document.querySelectorAll('.board-btn').forEach((b) => b.onclick = () => this.toggleBoard(b.dataset.board));
      $('inkClear').onclick = () => { if (!this.ink.clearPage()) this.app.toast('이 슬라이드에는 판서가 없습니다'); };
      $('inkClearAll').onclick = () => {
        const n = this.ink.clearAll(this.sec ? this.sec.id + '@' : '');
        this.app.toast(n ? '이 강의의 판서를 모두 지웠습니다' : '지울 판서가 없습니다');
      };

      // 슬라이드 위 조작
      this.stage.addEventListener('pointerdown', (e) => this.onStagePointerDown(e));
      this.stage.addEventListener('pointermove', (e) => this.onStagePointerMove(e));
      this.stage.addEventListener('pointerup', (e) => this.onStagePointerUp(e));
      this.stage.addEventListener('pointercancel', () => {
        if (this.drawing) { this.drawing = false; this.stage.classList.remove('drawing'); this.ink.end(); }
      });
      this.stage.addEventListener('pointerleave', () => { this.stage.classList.remove('edge-l', 'edge-r'); if (!this.drawing) this.ink.laserOff(); });

      // 교사 노트 접기
      $('notesHead').onclick = (e) => { if (!e.target.closest('a')) this.toggleNotes(); };

      $('gridOverlay').addEventListener('click', (e) => {
        const it = e.target.closest('[data-i]');
        if (it) { this.toggleGrid(false); this.go(+it.dataset.i); }
        if (e.target.closest('[data-close]')) this.toggleGrid(false);
      });
      this.wrap.querySelector('.fs-controls').addEventListener('click', (e) => {
        const b = e.target.closest('[data-fs]');
        if (!b) return;
        const a = b.dataset.fs;
        if (a === 'prev') this.prev();
        if (a === 'next') this.next();
        if (a === 'grid') this.toggleGrid();
        if (a === 'console') this.showConsole(!this.fsConsole);
        if (a === 'black') this.blackout();
        if (a === 'exit') this.toggleFull();
      });
      document.addEventListener('fullscreenchange', () => this.onFullChange());
      new ResizeObserver(() => this.fit()).observe(this.host);

      // 전체 화면: 위쪽에 마우스를 올리면 상단 메뉴가 나타난다
      let idleT = 0;
      this.view.addEventListener('mousemove', (e) => {
        this.view.classList.remove('idle');
        clearTimeout(idleT);
        idleT = setTimeout(() => { if (this.isFull()) this.view.classList.add('idle'); }, 2500);
        if (!this.isFull()) return;
        const nearTop = e.clientY < 64 || !!e.target.closest('.deck-bars');
        this.view.classList.toggle('bars-on', nearTop);
      });

      document.addEventListener('keydown', (e) => {
        if (!this.active || !this.sec) return;
        const modalOpen = !$('modal').classList.contains('hidden');
        const t = e.target;
        const inField = t.closest && (t.closest('.CodeMirror') || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
        const teacher = this.app.role === 'teacher';
        if ((e.ctrlKey || e.metaKey) && !inField && teacher && !modalOpen) {
          const redo = (e.key === 'y' || e.key === 'Y') || (e.shiftKey && (e.key === 'z' || e.key === 'Z'));
          if (redo) { e.preventDefault(); this.ink.redo(); return; }
          if (!e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); this.ink.undo(); return; }
        }
        if (modalOpen) {
          if (e.key === 'Escape') { /* 모달 닫기는 app.js 에서 처리 — 발표 화면은 유지 */ }
          return;
        }
        if (inField) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key;
        // 판서 단축키 (교사용)
        if (teacher) {
          const TOOL_KEYS = { p: 'pen', h: 'marker', '-': 'line', a: 'arrow', s: 'rect', o: 'ellipse', i: 'text', e: 'eraser', l: 'pointer' };
          const lk = k.toLowerCase();
          if (TOOL_KEYS[lk] && !e.shiftKey) { e.preventDefault(); this.ink.setTool(TOOL_KEYS[lk]); this.syncDrawBar(); return; }
          if (/^[1-6]$/.test(k)) { const cb = document.querySelectorAll('.color-btn')[+k - 1]; if (cb) { e.preventDefault(); cb.click(); } return; }
          if (k === '[' || k === ']') { const ws = [3, 6, 12]; const i = Math.max(0, Math.min(2, ws.indexOf(this.ink.width) + (k === ']' ? 1 : -1))); e.preventDefault(); this.ink.setWidth(ws[i]); this.syncDrawBar(); return; }
          if (lk === 'w' && !e.shiftKey) { e.preventDefault(); this.toggleBoard('white'); return; }
          if (lk === 'd' && !e.shiftKey) { e.preventDefault(); this.toggleBoard('black'); return; }
          if (k === 'Delete') { e.preventDefault(); if (!this.ink.clearPage()) this.app.toast('이 슬라이드에는 판서가 없습니다'); return; }
          if (k === 'Escape' && this.board) { e.preventDefault(); this.toggleBoard(this.board); return; }
        }
        if (['ArrowRight', 'PageDown', ' '].includes(k)) { e.preventDefault(); this.next(); }
        else if (['ArrowLeft', 'PageUp'].includes(k)) { e.preventDefault(); this.prev(); }
        else if (k === 'Home') { e.preventDefault(); this.go(0); }
        else if (k === 'End') { e.preventDefault(); this.go(this.slides.length - 1); }
        else if (k === 'f' || k === 'F') { e.preventDefault(); this.toggleFull(); }
        else if (k === 'g' || k === 'G') { e.preventDefault(); this.toggleGrid(); }
        else if (k === 'r' || k === 'R') { e.preventDefault(); if (this.isFull()) this.showConsole(!this.fsConsole); }
        else if ((k === 'n' || k === 'N') && this.app.role === 'teacher') { e.preventDefault(); this.toggleNotes(); }
        else if (k === 'b' || k === 'B' || k === '.') { e.preventDefault(); this.blackout(); }
        else if ((k === 't' || k === 'T') && this.app.role === 'teacher') { e.preventDefault(); this.timerToggle(); }
        else if (k === 'Escape') {
          if (!$('gridOverlay').classList.contains('hidden')) { this.toggleGrid(false); return; }
          if (!$('blackout').classList.contains('hidden')) { this.blackout(false); return; }
          if (this.view.classList.contains('pfull')) this.toggleFull();
        }
      });

      if (this.channel) {
        this.channel.onmessage = (ev) => {
          const m = ev.data || {};
          if (m.type === 'hello') this.broadcast();
          if (m.type === 'nav' && this.active) { if (m.dir > 0) this.next(); else this.prev(); }
        };
      }
    }
  }

  window.Deck = Deck;
})();

