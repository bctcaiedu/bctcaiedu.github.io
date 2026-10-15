
/* 공용 유틸: HTML 이스케이프, 코드 강조(CodeMirror runMode), 편집기, 그림 범위 한정 */
(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** 언어 이름 → CodeMirror 모드 */
  const MODES = {
    bash: 'text/x-sh', sh: 'text/x-sh', shell: 'text/x-sh', console: 'text/x-sh', crontab: 'text/x-sh',
    nginx: 'text/x-nginx-conf', yaml: 'text/x-yaml', yml: 'text/x-yaml',
    ini: 'text/x-properties', conf: 'text/x-properties', properties: 'text/x-properties', systemd: 'text/x-properties', apache: 'text/x-properties', env: 'text/x-properties',
    js: 'text/javascript', javascript: 'text/javascript', json: 'application/json', python: 'text/x-python', py: 'text/x-python',
    sql: 'text/x-mysql', mysql: 'text/x-mysql', html: 'text/html', xml: 'application/xml', php: 'application/x-httpd-php', css: 'text/css',
    dockerfile: 'text/x-dockerfile', c: 'text/x-csrc', text: null, plain: null, diff: 'text/x-diff'
  };
  function modeOf(lang) { if (lang == null) return null; return lang in MODES ? MODES[lang] : lang; }

  /** 파일 경로로 언어 추측 */
  function guessLang(path, text) {
    const p = String(path || '');
    const b = p.split('/').pop();
    if (/\.sh$|\/\.bashrc$|\/\.profile$|\/\.bash_aliases$/.test(p)) return 'bash';
    if (/\/etc\/nginx\//.test(p) || /\.nginx$/.test(p)) return 'nginx';
    if (/\.(ya?ml)$/.test(p)) return 'yaml';
    if (/^Dockerfile/.test(b)) return 'dockerfile';
    if (/\.(conf|ini|cnf|service|timer|socket|env|properties|cfg)$|\/sshd_config|\/ssh_config|\/etc\/default\//.test(p)) return 'ini';
    if (/\.m?js$/.test(p)) return 'js';
    if (/\.json$/.test(p)) return 'json';
    if (/\.py$/.test(p)) return 'python';
    if (/\.sql$/.test(p)) return 'sql';
    if (/\.html?$/.test(p)) return 'html';
    if (/\.php$/.test(p)) return 'php';
    if (/\.css$/.test(p)) return 'css';
    if (/\.c$/.test(p)) return 'c';
    if (/crontab/.test(p)) return 'crontab';
    if (/^#!.*\b(ba)?sh\b/.test(String(text || ''))) return 'bash';
    return 'text';
  }

  function runModeHtml(code, mode) {
    code = String(code || '');
    if (!mode || !(window.CodeMirror && CodeMirror.runMode)) return code.split('\n').map(esc);
    const lines = [];
    let cur = '';
    try {
      CodeMirror.runMode(code, mode, (text, style) => {
        if (text === '\n') { lines.push(cur); cur = ''; return; }
        cur += style ? `<span class="${style.split(' ').map((s) => 'cm-' + s).join(' ')}">${esc(text)}</span>` : esc(text);
      });
      lines.push(cur);
    } catch (e) {
      return code.split('\n').map(esc);
    }
    return lines;
  }

  /** 줄 번호가 붙은 강조 HTML (파일 · 설정) */
  function highlightLines(code, lang) {
    code = String(code || '').replace(/\r\n/g, '\n').replace(/\s+$/, '');
    return runModeHtml(code, modeOf(lang || 'bash')).map((html, i) => `<span class="ln" data-n="${i + 1}">${html || ' '}</span>`).join('');
  }

  /** 줄 번호 없이 강조만 */
  function highlightInline(code, lang) {
    code = String(code || '').replace(/\r\n/g, '\n').replace(/\s+$/, '');
    return runModeHtml(code, modeOf(lang || 'bash')).join('\n');
  }

  /**
   * 터미널 명령 블록: 줄마다 종류(cmd · cont · comment · out)를 나눈다.
   * 이어지는 줄(heredoc 본문, 여는 if/for, 끝의 \)은 프롬프트 없이 '>' 로 보인다.
   */
  function cmdLines(code) {
    const raw = String(code || '').replace(/\r\n/g, '\n').replace(/\s+$/, '').split('\n');
    const out = [];
    let buf = '';
    for (const line of raw) {
      if (!buf && /^\s*#/.test(line)) { out.push({ text: line, kind: 'comment' }); continue; }
      if (!buf && !line.trim()) { out.push({ text: '', kind: 'blank' }); continue; }
      const kind = buf ? 'cont' : 'cmd';
      const text = buf ? buf + '\n' + line : line;
      let incomplete = false;
      if (window.LX && LX.parse) {
        try { LX.parse(text); } catch (e) { incomplete = e instanceof LX.sig.Incomplete; }
      }
      out.push({ text: line, kind, heredoc: buf && /<<-?\s*['"]?\w+/.test(buf) });
      buf = incomplete ? text : '';
    }
    return out;
  }

  function highlightCommands(code, root) {
    return cmdLines(code).map((l) => {
      if (l.kind === 'comment') return `<span class="ln cmt">${esc(l.text)}</span>`;
      if (l.kind === 'blank') return '<span class="ln blank"> </span>';
      const html = l.heredoc ? esc(l.text) : runModeHtml(l.text, 'text/x-sh').join('');
      return `<span class="ln ${l.kind}${root ? ' root' : ''}">${html || ' '}</span>`;
    }).join('');
  }

  /**
   * 코드 편집기 생성 (CodeMirror 5, 없으면 textarea 로 대체)
   */
  function makeEditor(host, value, opts = {}) {
    if (window.CodeMirror) {
      const cm = CodeMirror(host, {
        value: value || '',
        mode: modeOf(opts.lang || 'text'),
        lineNumbers: true,
        indentUnit: opts.indent || 4,
        tabSize: 4,
        indentWithTabs: !!opts.tabs,
        matchBrackets: true,
        autoCloseBrackets: false,
        styleActiveLine: true,
        lineWrapping: !!opts.wrap,
        readOnly: !!opts.readOnly,
        extraKeys: {
          'Ctrl-S': () => opts.onSave && opts.onSave(),
          'Cmd-S': () => opts.onSave && opts.onSave(),
          'Ctrl-O': () => opts.onSave && opts.onSave(),
          'Ctrl-X': () => opts.onClose && opts.onClose(),
          'Ctrl-Enter': () => opts.onRun && opts.onRun(),
          'Ctrl-/': 'toggleComment',
          Tab: (c) => (c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection(c.getOption('indentWithTabs') ? '\t' : ' '.repeat(c.getOption('indentUnit')), 'end')),
          'Shift-Tab': (c) => c.indentSelection('subtract')
        }
      });
      return {
        cm,
        getValue: () => cm.getValue(),
        setValue: (v) => { cm.setValue(v || ''); cm.clearHistory(); },
        setLang: (l) => cm.setOption('mode', modeOf(l)),
        setReadOnly: (r) => cm.setOption('readOnly', !!r),
        refresh: () => cm.refresh(),
        focus: () => cm.focus(),
        on: (ev, fn) => cm.on(ev, fn),
        markClean: () => cm.markClean(),
        isClean: () => cm.isClean()
      };
    }
    const ta = document.createElement('textarea');
    ta.className = 'fallback';
    ta.spellcheck = false;
    ta.value = value || '';
    host.appendChild(ta);
    let clean = ta.value;
    ta.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'o')) { e.preventDefault(); opts.onSave && opts.onSave(); }
      if ((e.ctrlKey || e.metaKey) && k === 'x' && !ta.selectionEnd) { e.preventDefault(); opts.onClose && opts.onClose(); }
    });
    return {
      cm: null,
      getValue: () => ta.value,
      setValue: (v) => { ta.value = v || ''; },
      setLang() {}, setReadOnly: (r) => { ta.readOnly = !!r; },
      refresh() {}, focus: () => ta.focus(), on: (ev, fn) => ta.addEventListener(ev === 'change' ? 'input' : ev, fn),
      markClean: () => { clean = ta.value; }, isClean: () => ta.value === clean
    };
  }

  /**
   * 그림(SVG) 안의 <style> 규칙이 페이지 전체에 퍼지지 않도록 범위를 한정한다.
   */
  let scopeSeq = 0;
  function scoped(html) {
    html = String(html || '');
    if (!/<style/i.test(html)) return html;
    const cls = 'scope-' + (++scopeSeq);
    const out = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (m, attrs, css) => {
      const rules = css.replace(/([^{}]+)\{([^{}]*)\}/g, (mm, sel, body) => {
        if (/^\s*@/.test(sel)) return mm;
        const s = sel.split(',').map((x) => x.trim()).filter(Boolean).map((x) => `.${cls} ${x}`).join(', ');
        return `${s}{${body}}`;
      });
      return `<style${attrs}>${rules}</style>`;
    });
    return `<div class="${cls}" style="display:contents">${out}</div>`;
  }

  window.JU = { esc, highlightLines, highlightInline, highlightCommands, cmdLines, makeEditor, scoped, guessLang, modeOf };
})();

