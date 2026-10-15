
/* 가상 리눅스 — 파일 시스템 (디렉터리 트리 · 권한 · 심볼릭 링크)
 * 노드 모양: { t: 'd'|'f'|'l'|'c'|'b', m: 권한 비트, u: uid, g: gid, mt: 수정 시각(ms),
 *             c: 파일 내용, k: { 이름: 노드 } (디렉터리), l: 링크 대상, gen: 동적 파일 이름 }
 */
(function (G) {
  const LX = G.LX = G.LX || {};

  const MSG = {
    ENOENT: 'No such file or directory',
    EACCES: 'Permission denied',
    ENOTDIR: 'Not a directory',
    EISDIR: 'Is a directory',
    EEXIST: 'File exists',
    ENOTEMPTY: 'Directory not empty',
    ELOOP: 'Too many levels of symbolic links',
    EPERM: 'Operation not permitted',
    EINVAL: 'Invalid argument',
    EBUSY: 'Device or resource busy',
    EROFS: 'Read-only file system'
  };

  class FSError extends Error {
    constructor(code, path) {
      super(MSG[code] || code);
      this.code = code;
      this.path = path;
    }
  }

  function byteLen(s) {
    s = String(s || '');
    let n = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c < 0x80) n += 1;
      else if (c < 0x800) n += 2;
      else if (c >= 0xd800 && c < 0xdc00) { n += 4; i++; }
      else n += 3;
    }
    return n;
  }

  function splitPath(p) { return String(p).split('/').filter((x) => x && x !== '.'); }

  /** cwd 기준으로 경로를 절대 경로로 정규화 (심볼릭 링크는 풀지 않는다 — bash 의 논리 경로) */
  function normalize(cwd, p) {
    p = String(p == null ? '' : p);
    const parts = p.startsWith('/') ? [] : splitPath(cwd);
    for (const seg of splitPath(p)) {
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    return '/' + parts.join('/');
  }

  function dirname(p) {
    const parts = splitPath(p);
    parts.pop();
    return '/' + parts.join('/');
  }
  function basename(p) {
    const parts = splitPath(p);
    return parts.length ? parts[parts.length - 1] : '/';
  }

  class VFS {
    constructor(root) {
      this.root = root || this.mk('d', 0o755, 0, 0);
      this.gen = {};          // 동적 파일 생성기 (/proc 등)
      this.genWrite = {};     // 동적 파일 쓰기 (/proc/sys 등)
      this.now = () => Date.now();
      this.onWrite = null;    // 변경 알림 (저장용)
    }

    mk(t, m, u, g, extra) {
      const n = { t, m, u: u | 0, g: g | 0, mt: this.now ? this.now() : Date.now() };
      if (t === 'd') n.k = {};
      if (t === 'f') n.c = '';
      return Object.assign(n, extra || {});
    }

    touchChanged() { if (this.onWrite) this.onWrite(); }

    // ------------------------------------------------------------ 권한
    perm(node, cred, bit) {   // bit: 4 r, 2 w, 1 x
      if (!cred || cred.uid === 0) {
        if (bit === 1 && node.t === 'f') return (node.m & 0o111) !== 0;
        return true;
      }
      let shift;
      if (cred.uid === node.u) shift = 6;
      else if ((cred.gids || [cred.gid]).includes(node.g)) shift = 3;
      else shift = 0;
      return ((node.m >> shift) & bit) !== 0;
    }

    // ------------------------------------------------------------ 경로 찾기
    /**
     * 절대 경로의 노드를 찾는다.
     * @returns {{node, parent, name, real}} node 는 없으면 null
     */
    walk(abs, cred, follow = true, depth = 0) {
      if (depth > 40) throw new FSError('ELOOP', abs);
      const parts = splitPath(abs);
      let cur = this.root;
      let real = [];
      let parent = null;
      for (let i = 0; i < parts.length; i++) {
        const seg = parts[i];
        if (cur.t !== 'd') throw new FSError('ENOTDIR', abs);
        if (!this.perm(cur, cred, 1)) throw new FSError('EACCES', abs);
        if (seg === '..') {
          real.pop();
          const r = this.walk('/' + real.join('/'), null, true, depth + 1);
          cur = r.node;
          continue;
        }
        const next = cur.k[seg];
        const last = i === parts.length - 1;
        if (!next) {
          if (last) return { node: null, parent: cur, name: seg, real: '/' + real.concat(seg).join('/') };
          throw new FSError('ENOENT', abs);
        }
        if (next.t === 'l' && (!last || follow)) {
          const target = next.l.startsWith('/') ? next.l : '/' + real.join('/') + '/' + next.l;
          const rest = parts.slice(i + 1).join('/');
          return this.walk(normalize('/', target + (rest ? '/' + rest : '')), cred, follow, depth + 1);
        }
        parent = cur;
        cur = next;
        real.push(seg);
      }
      return { node: cur, parent, name: real[real.length - 1] || '/', real: '/' + real.join('/') };
    }

    exists(abs, follow = true) {
      try { return !!this.walk(abs, null, follow).node; } catch (e) { return false; }
    }

    lookup(abs, follow = true) {
      try { return this.walk(abs, null, follow).node; } catch (e) { return null; }
    }

    stat(abs, cred, follow = true) {
      const r = this.walk(abs, cred, follow);
      if (!r.node) throw new FSError('ENOENT', abs);
      return r.node;
    }

    realpath(abs) {
      const r = this.walk(abs, null, true);
      if (!r.node) throw new FSError('ENOENT', abs);
      return r.real;
    }

    size(node) {
      if (node.t === 'd') return 4096;
      if (node.t === 'l') return node.l.length;
      if (node.sz != null) return node.sz;
      if (node.gen) return 0;
      return byteLen(node.c);
    }

    // ------------------------------------------------------------ 읽기
    readFile(abs, cred) {
      const node = this.stat(abs, cred);
      if (node.t === 'd') throw new FSError('EISDIR', abs);
      if (!this.perm(node, cred, 4)) throw new FSError('EACCES', abs);
      if (node.gen && this.gen[node.gen]) return this.gen[node.gen]();
      if (node.t === 'c' || node.t === 'b') return node.c || '';
      return node.c || '';
    }

    readdir(abs, cred) {
      const node = this.stat(abs, cred);
      if (node.t !== 'd') throw new FSError('ENOTDIR', abs);
      if (!this.perm(node, cred, 4)) throw new FSError('EACCES', abs);
      return Object.keys(node.k).sort();
    }

    // ------------------------------------------------------------ 쓰기
    writeFile(abs, data, cred, opts = {}) {
      const r = this.walk(abs, cred, true);
      if (r.node) {
        if (r.node.t === 'd') throw new FSError('EISDIR', abs);
        if (!this.perm(r.node, cred, 2)) throw new FSError('EACCES', abs);
        if (r.node.gen) {
          if (this.genWrite && this.genWrite[r.node.gen]) this.genWrite[r.node.gen](String(data), !!opts.append);
          return;
        }
        if (r.node.t === 'c') { r.node.mt = this.now(); return; }   // /dev/null 등
        r.node.c = opts.append ? (r.node.c || '') + data : String(data);
        delete r.node.sz;
        r.node.mt = this.now();
      } else {
        if (!r.parent) throw new FSError('ENOENT', abs);
        if (!this.perm(r.parent, cred, 2) || !this.perm(r.parent, cred, 1)) throw new FSError('EACCES', abs);
        const mode = opts.mode != null ? opts.mode : 0o644;
        const n = this.mk('f', mode, cred ? cred.uid : 0, cred ? cred.gid : 0);
        n.c = String(data);
        r.parent.k[r.name] = n;
        r.parent.mt = this.now();
      }
      this.touchChanged();
    }

    mkdir(abs, cred, opts = {}) {
      const mode = opts.mode != null ? opts.mode : 0o755;
      if (opts.parents) {
        const parts = splitPath(abs);
        let p = '';
        let made = [];
        for (const seg of parts) {
          p += '/' + seg;
          const r = this.walk(p, cred, true);
          if (r.node) {
            if (r.node.t !== 'd') throw new FSError('ENOTDIR', p);
            continue;
          }
          if (!this.perm(r.parent, cred, 2)) throw new FSError('EACCES', p);
          r.parent.k[r.name] = this.mk('d', mode, cred ? cred.uid : 0, cred ? cred.gid : 0);
          made.push(p);
        }
        this.touchChanged();
        return made;
      }
      const r = this.walk(abs, cred, false);
      if (r.node) throw new FSError('EEXIST', abs);
      if (!r.parent) throw new FSError('ENOENT', abs);
      if (!this.perm(r.parent, cred, 2)) throw new FSError('EACCES', abs);
      r.parent.k[r.name] = this.mk('d', mode, cred ? cred.uid : 0, cred ? cred.gid : 0);
      r.parent.mt = this.now();
      this.touchChanged();
      return [abs];
    }

    /** 파일 · 링크 삭제 (디렉터리는 rmdir / 재귀는 remove) */
    unlink(abs, cred) {
      const r = this.walk(abs, cred, false);
      if (!r.node) throw new FSError('ENOENT', abs);
      if (r.node.t === 'd') throw new FSError('EISDIR', abs);
      this.checkDelete(r, cred, abs);
      delete r.parent.k[r.name];
      r.parent.mt = this.now();
      this.touchChanged();
    }

    checkDelete(r, cred, abs) {
      if (!r.parent) throw new FSError('EBUSY', abs);
      if (!this.perm(r.parent, cred, 2) || !this.perm(r.parent, cred, 1)) throw new FSError('EACCES', abs);
      // sticky bit (/tmp): 소유자만 지울 수 있다
      if (cred && cred.uid !== 0 && (r.parent.m & 0o1000) && r.node.u !== cred.uid && r.parent.u !== cred.uid) throw new FSError('EPERM', abs);
    }

    rmdir(abs, cred) {
      const r = this.walk(abs, cred, false);
      if (!r.node) throw new FSError('ENOENT', abs);
      if (r.node.t !== 'd') throw new FSError('ENOTDIR', abs);
      if (Object.keys(r.node.k).length) throw new FSError('ENOTEMPTY', abs);
      this.checkDelete(r, cred, abs);
      delete r.parent.k[r.name];
      this.touchChanged();
    }

    /** 재귀 삭제. 오류는 onError 로 알리고 계속 진행 */
    remove(abs, cred, onError) {
      const r = this.walk(abs, cred, false);
      if (!r.node) throw new FSError('ENOENT', abs);
      if (r.node.t === 'd') {
        let failed = false;
        if (!this.perm(r.node, cred, 2) || !this.perm(r.node, cred, 1)) {
          if (Object.keys(r.node.k).length) {
            onError && onError(new FSError('EACCES', abs));
            return false;
          }
        } else {
          for (const name of Object.keys(r.node.k)) {
            try { if (!this.remove(abs.replace(/\/$/, '') + '/' + name, cred, onError)) failed = true; } catch (e) { failed = true; onError && onError(e); }
          }
        }
        if (failed) return false;
        this.checkDelete(r, cred, abs);
        delete r.parent.k[r.name];
      } else {
        this.checkDelete(r, cred, abs);
        delete r.parent.k[r.name];
      }
      this.touchChanged();
      return true;
    }

    rename(src, dst, cred) {
      const a = this.walk(src, cred, false);
      if (!a.node) throw new FSError('ENOENT', src);
      this.checkDelete(a, cred, src);
      const b = this.walk(dst, cred, false);
      if (!b.parent) throw new FSError('ENOENT', dst);
      if (!this.perm(b.parent, cred, 2)) throw new FSError('EACCES', dst);
      if (b.node && b.node.t === 'd' && a.node.t !== 'd') throw new FSError('EISDIR', dst);
      if (b.node && b.node.t === 'd' && Object.keys(b.node.k).length) throw new FSError('ENOTEMPTY', dst);
      // 자기 안으로 옮기기 금지
      if (a.node.t === 'd' && (dst + '/').startsWith(src.replace(/\/$/, '') + '/')) throw new FSError('EINVAL', dst);
      delete a.parent.k[a.name];
      b.parent.k[b.name] = a.node;
      a.parent.mt = b.parent.mt = this.now();
      this.touchChanged();
    }

    symlink(target, abs, cred) {
      const r = this.walk(abs, cred, false);
      if (r.node) throw new FSError('EEXIST', abs);
      if (!r.parent) throw new FSError('ENOENT', abs);
      if (!this.perm(r.parent, cred, 2)) throw new FSError('EACCES', abs);
      r.parent.k[r.name] = this.mk('l', 0o777, cred ? cred.uid : 0, cred ? cred.gid : 0, { l: target });
      this.touchChanged();
    }

    link(src, abs, cred) {   // 하드 링크: 같은 노드 객체를 공유 (저장 후에는 분리됨)
      const n = this.stat(src, cred, true);
      if (n.t === 'd') throw new FSError('EPERM', src);
      const r = this.walk(abs, cred, false);
      if (r.node) throw new FSError('EEXIST', abs);
      if (!this.perm(r.parent, cred, 2)) throw new FSError('EACCES', abs);
      n.nl = (n.nl || 1) + 1;
      if (!n.ino && LX.inode) n.ino = LX.inode(LX.path.normalize('/', src));
      r.parent.k[r.name] = n;
      this.touchChanged();
    }

    chmod(abs, mode, cred) {
      const n = this.stat(abs, cred, true);
      if (cred && cred.uid !== 0 && cred.uid !== n.u) throw new FSError('EPERM', abs);
      n.m = mode & 0o7777;
      this.touchChanged();
    }

    chown(abs, uid, gid, cred, follow = true) {
      const n = this.stat(abs, cred, follow);
      if (cred && cred.uid !== 0) {
        if (uid != null && uid !== n.u) throw new FSError('EPERM', abs);
        if (gid != null && !(cred.gids || []).includes(gid)) throw new FSError('EPERM', abs);
      }
      if (uid != null) n.u = uid;
      if (gid != null) n.g = gid;
      this.touchChanged();
    }

    /** 노드 깊은 복사 (cp -r) */
    clone(node) { return JSON.parse(JSON.stringify(node)); }

    /** 재귀 순회: fn(path, node, depth) 가 false 를 돌려주면 하위로 내려가지 않는다 */
    each(abs, cred, fn, depth = 0, seen) {
      let node;
      try { node = this.walk(abs, null, false).node; } catch (e) { return; }
      if (!node) return;
      if (fn(abs, node, depth) === false) return;
      if (node.t === 'd') {
        if (!this.perm(node, cred, 4) || !this.perm(node, cred, 1)) { fn(abs, node, depth, 'EACCES'); return; }
        for (const name of Object.keys(node.k).sort()) this.each((abs === '/' ? '' : abs) + '/' + name, cred, fn, depth + 1);
      }
    }

    duSize(node) {
      if (node.t === 'd') return 4096 + Object.values(node.k).reduce((a, n) => a + this.duSize(n), 0);
      if (node.t === 'f') return Math.ceil(this.size(node) / 4096) * 4096;
      return 0;
    }

    toJSON() { return this.root; }
  }

  LX.VFS = VFS;
  LX.FSError = FSError;
  LX.path = { normalize, dirname, basename, split: splitPath };
  LX.byteLen = byteLen;
})(typeof window !== 'undefined' ? window : globalThis);

