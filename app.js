/* PC Ảo – plain JS, no libraries. Bot API: see bot.html */
(function () {
'use strict';
var VERSION = '1.0.0';
var $ = function (s, r) { return (r || document).querySelector(s); };
var K_FS = 'pcao-fs-v1', K_SET = 'pcao-settings-v1';
var NS = 'http://www.w3.org/2000/svg';

/* tiny DOM helper (text always via textContent) */
function h(tag, props, kids) {
  var el = document.createElement(tag);
  if (props) for (var k in props) {
    var v = props[k];
    if (k === 'text') el.textContent = v;
    else if (k === 'cls') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return el;
}
/* static, trusted SVG constants only (never user data) */
function svg(markup, cls) {
  var t = document.createElement('template');
  t.innerHTML = '<svg xmlns="' + NS + '" viewBox="0 0 48 48"' + (cls ? ' class="' + cls + '"' : '') + '>' + markup + '</svg>';
  return t.content.firstChild;
}
function rawSvg(m) { var t = document.createElement('template'); t.innerHTML = m; return t.content.firstChild; }
var FOLDER = '<path d="M4 12a4 4 0 0 1 4-4h11l4 4h17a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#e8a822"/><path d="M4 18h40v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#ffd257"/>';
var IC = {
  explorer: FOLDER, folder: FOLDER,
  file: '<path d="M12 4h16l10 10v28a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#fff" stroke="#9aa5b5" stroke-width="1.5"/><path d="M28 4v10h10z" fill="#dfe6ef"/><path d="M15 22h17M15 28h17M15 34h11" stroke="#7a8799" stroke-width="2" stroke-linecap="round"/>',
  notepad: '<rect x="9" y="5" width="30" height="38" rx="4" fill="#e9f1fb"/><rect x="9" y="5" width="30" height="9" rx="4" fill="#3d9be0"/><path d="M15 21h18M15 27h18M15 33h12" stroke="#5a6b80" stroke-width="2.5" stroke-linecap="round"/>',
  terminal: '<rect x="4" y="8" width="40" height="32" rx="5" fill="#1f2430" stroke="#5b6478"/><path d="M12 18l7 6-7 6" stroke="#7ee787" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 31h12" stroke="#e6edf3" stroke-width="3" stroke-linecap="round"/>',
  calc: '<rect x="9" y="4" width="30" height="40" rx="5" fill="#454b58"/><rect x="13" y="8" width="22" height="9" rx="2" fill="#a8d8ff"/><g fill="#e6e9ef"><rect x="13" y="21" width="6" height="5" rx="1"/><rect x="21" y="21" width="6" height="5" rx="1"/><rect x="29" y="21" width="6" height="5" rx="1" fill="#ff9f43"/><rect x="13" y="29" width="6" height="5" rx="1"/><rect x="21" y="29" width="6" height="5" rx="1"/><rect x="29" y="29" width="6" height="11" rx="1" fill="#ff9f43"/><rect x="13" y="36" width="14" height="4" rx="1"/></g>',
  browser: '<circle cx="24" cy="24" r="19" fill="#1d8bf0"/><path d="M5 24h38M24 5c7 6 7 32 0 38M24 5c-7 6-7 32 0 38M9 14h30M9 34h30" stroke="#fff" stroke-width="2.2" fill="none"/>',
  settings: '<circle cx="24" cy="24" r="15" fill="none" stroke="#8a93a6" stroke-width="7" stroke-dasharray="5.9 4"/><circle cx="24" cy="24" r="12" fill="#8a93a6"/><circle cx="24" cy="24" r="5.5" fill="#eef1f6"/>',
  reply: '<path d="M8 9h32a4 4 0 0 1 4 4v17a4 4 0 0 1-4 4H22l-9 7v-7H8a4 4 0 0 1-4-4V13a4 4 0 0 1 4-4z" fill="#ff5d8f"/><path d="M24 29c-5-3.5-8-6-8-9a3.6 3.6 0 0 1 8-1.6A3.6 3.6 0 0 1 32 20c0 3-3 5.5-8 9z" fill="#fff"/>'
};
var WBTN = {
  min: '<svg viewBox="0 0 10 10" width="10" height="10"><path d="M0 5h10" stroke="currentColor"/></svg>',
  max: '<svg viewBox="0 0 10 10" width="10" height="10"><rect x=".5" y=".5" width="9" height="9" fill="none" stroke="currentColor"/></svg>',
  cls: '<svg viewBox="0 0 10 10" width="10" height="10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor"/></svg>'
};

/* settings */
var WALLS = {
  bloom: { name: 'Bloom xanh', css: 'radial-gradient(ellipse 70% 60% at 50% 110%,#7fd3ff 0%,rgba(76,194,255,0) 70%),radial-gradient(ellipse 60% 50% at 30% 45%,#2b6fe0 0%,rgba(43,111,224,0) 70%),radial-gradient(ellipse 50% 45% at 72% 50%,#3d4fd8 0%,rgba(61,79,216,0) 70%),linear-gradient(160deg,#071436,#0d2a6b 55%,#06102b)' },
  sunset: { name: 'Hoàng hôn', css: 'radial-gradient(circle at 50% 75%,#ffd27a 0%,rgba(255,210,122,0) 35%),linear-gradient(170deg,#3a1c71 0%,#d76d77 55%,#ffaf7b 100%)' },
  ocean: { name: 'Biển', css: 'radial-gradient(ellipse 80% 40% at 50% 100%,#00e0c6 0%,rgba(0,224,198,0) 70%),linear-gradient(180deg,#89f7fe 0%,#66a6ff 45%,#1b3b8f 100%)' },
  forest: { name: 'Rừng', css: 'radial-gradient(ellipse at 20% 20%,#c6f68d 0%,rgba(198,246,141,0) 45%),linear-gradient(160deg,#0f3d2e,#1f7a54 55%,#0b261c)' },
  night: { name: 'Đêm sao', css: 'radial-gradient(1px 1px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 70% 20%,#fff,transparent),radial-gradient(1.5px 1.5px at 40% 70%,#fff,transparent),radial-gradient(1px 1px at 85% 60%,#fff,transparent),radial-gradient(1px 1px at 55% 45%,#fff,transparent),radial-gradient(ellipse at 50% 120%,#5b2a86,transparent 60%),linear-gradient(#020617,#0f172a)' },
  pastel: { name: 'Pastel', css: 'radial-gradient(circle at 20% 20%,#ffd1dc,transparent 50%),radial-gradient(circle at 80% 30%,#c3f0ff,transparent 50%),radial-gradient(circle at 50% 90%,#e0c3fc,transparent 55%),linear-gradient(#fdfbfb,#ebedee)' }
};
var ACCENTS = { xanh: '#2ea6f2', tim: '#8764b8', hong: '#e3008c', do: '#e81123', cam: '#f7630c', la: '#10893e' };
var S = { wallpaper: 'bloom', theme: 'dark', accent: '#2ea6f2' };
try { var _s = JSON.parse(localStorage.getItem(K_SET)); if (_s && typeof _s === 'object') { if (WALLS.hasOwnProperty(_s.wallpaper)) S.wallpaper = _s.wallpaper; if (_s.theme === 'light' || _s.theme === 'dark') S.theme = _s.theme; if (/^#[0-9a-f]{6}$/i.test(_s.accent)) S.accent = _s.accent; } } catch (e) {}
function saveSet() { try { localStorage.setItem(K_SET, JSON.stringify(S)); } catch (e) {} }
function applySet() {
  var r = document.documentElement;
  r.setAttribute('data-theme', S.theme);
  r.style.setProperty('--wall', WALLS[S.wallpaper].css);
  r.style.setProperty('--accent', S.accent);
  emit('settings');
}
function setWallpaper(n) { n = String(n || '').toLowerCase(); if (!WALLS.hasOwnProperty(n)) throw new Error('Hình nền không tồn tại: ' + n + ' (có: ' + Object.keys(WALLS).join(', ') + ')'); S.wallpaper = n; saveSet(); applySet(); return 'wallpaper=' + n; }
function setTheme(t) { t = String(t || '').toLowerCase(); if (t !== 'dark' && t !== 'light') throw new Error('theme phải là dark hoặc light'); S.theme = t; saveSet(); applySet(); return 'theme=' + t; }
function setAccent(c) { c = String(c || '').toLowerCase(); if (ACCENTS.hasOwnProperty(c)) c = ACCENTS[c]; if (/^[0-9a-f]{6}$/.test(c)) c = '#' + c; if (!/^#[0-9a-f]{6}$/.test(c)) throw new Error('accent không hợp lệ'); S.accent = c; saveSet(); applySet(); return 'accent=' + c; }

/* virtual file system (localStorage) */
function defFS() {
  var d = function (c) { return { t: 'd', c: c || {} }; }, f = function (s) { return { t: 'f', d: s, m: Date.now() }; };
  return d({
    'Tài liệu': d({ 'ghichu.txt': f('Chào mừng đến với PC Ảo!\nĐây là tệp văn bản lưu trong bộ nhớ trình duyệt.\n'), 'viec-can-lam.txt': f('- Uống nước\n- Học JS\n- Đi ngủ sớm\n') }),
    'Ảnh': d(), 'Tải xuống': d(),
    'Màn hình nền': d({ 'doc-toi.txt': f('Mở bot.html để xem cách điều khiển PC Ảo bằng liên kết.\n') })
  });
}
var own = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
var FS = {
  root: null,
  load: function () { try { this.root = JSON.parse(localStorage.getItem(K_FS)); } catch (e) { this.root = null; } if (!this.root || this.root.t !== 'd') { this.root = defFS(); this.save(); } },
  save: function () { try { localStorage.setItem(K_FS, JSON.stringify(this.root)); } catch (e) {} emit('fs'); },
  reset: function () { this.root = defFS(); this.save(); },
  norm: function (p, cwd) {
    p = String(p == null ? '' : p);
    if (p === '~') p = '/';
    if (p.charAt(0) !== '/') p = (cwd || '/') + '/' + p;
    var out = [];
    p.split('/').forEach(function (s) { if (!s || s === '.') return; if (s === '..') out.pop(); else out.push(s); });
    return '/' + out.join('/');
  },
  parts: function (p) { return p.split('/').filter(Boolean); },
  get: function (p) {
    var n = this.root, a = this.parts(this.norm(p));
    for (var i = 0; i < a.length; i++) { if (!n || n.t !== 'd' || !own(n.c, a[i])) return null; n = n.c[a[i]]; }
    return n;
  },
  split: function (p) { p = this.norm(p); var a = this.parts(p), name = a.pop(); return { dir: this.get('/' + a.join('/')), name: name, path: p }; },
  okName: function (n) { return typeof n === 'string' && n.length > 0 && n.length <= 120 && !/[\/\\<>:"|?*\u0000-\u001f]/.test(n) && n !== '.' && n !== '..' && n !== '__proto__'; },
  mkdir: function (p) {
    var s = this.split(p);
    if (!s.dir || s.dir.t !== 'd') throw new Error('Không tìm thấy thư mục cha: ' + s.path);
    if (!this.okName(s.name)) throw new Error('Tên không hợp lệ');
    if (own(s.dir.c, s.name)) throw new Error('Đã tồn tại: ' + s.name);
    s.dir.c[s.name] = { t: 'd', c: {} }; this.save(); return s.path;
  },
  write: function (p, data, append) {
    var s = this.split(p);
    if (!s.dir || s.dir.t !== 'd') throw new Error('Không tìm thấy thư mục: ' + s.path);
    if (!this.okName(s.name)) throw new Error('Tên tệp không hợp lệ');
    var ex = own(s.dir.c, s.name) ? s.dir.c[s.name] : null;
    if (ex && ex.t === 'd') throw new Error('Là thư mục: ' + s.path);
    var txt = String(data == null ? '' : data);
    if (append && ex) txt = ex.d + txt;
    if (txt.length > 200000) throw new Error('Tệp quá lớn (tối đa 200 000 ký tự)');
    s.dir.c[s.name] = { t: 'f', d: txt, m: Date.now() }; this.save(); return s.path;
  },
  read: function (p) { var n = this.get(p); if (!n) throw new Error('Không tìm thấy: ' + p); if (n.t === 'd') throw new Error('Là thư mục: ' + p); return n.d; },
  rm: function (p) { var s = this.split(p); if (s.path === '/') throw new Error('Không thể xóa thư mục gốc'); if (!s.dir || s.dir.t !== 'd' || !own(s.dir.c, s.name)) throw new Error('Không tìm thấy: ' + s.path); delete s.dir.c[s.name]; this.save(); return s.path; },
  move: function (a, b) {
    var s = this.split(a), n = s.dir && s.dir.t === 'd' && own(s.dir.c, s.name) ? s.dir.c[s.name] : null;
    if (!n || s.path === '/') throw new Error('Không tìm thấy: ' + a);
    var bn = this.get(b); if (bn && bn.t === 'd') b = this.norm(b) + '/' + s.name;
    var t = this.split(b);
    if (!t.dir || t.dir.t !== 'd') throw new Error('Không tìm thấy đích: ' + b);
    if (!this.okName(t.name)) throw new Error('Tên không hợp lệ');
    if (own(t.dir.c, t.name)) throw new Error('Đã tồn tại: ' + t.path);
    if ((t.path + '/').indexOf(s.path + '/') === 0) throw new Error('Không thể di chuyển vào chính nó');
    delete s.dir.c[s.name]; t.dir.c[t.name] = n; this.save(); return t.path;
  },
  list: function (p) {
    var n = this.get(p); if (!n) throw new Error('Không tìm thấy: ' + p); if (n.t !== 'd') throw new Error('Không phải thư mục: ' + p);
    return Object.keys(n.c).sort(function (a, b) { var x = n.c[a].t, y = n.c[b].t; return x === y ? a.localeCompare(b, 'vi') : (x === 'd' ? -1 : 1); })
      .map(function (k) { return { name: k, type: n.c[k].t === 'd' ? 'dir' : 'file', size: n.c[k].t === 'f' ? n.c[k].d.length : undefined }; });
  }
};

/* events / bot mirrors */
var listeners = {};
function on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); }
function emit(ev, d) { (listeners[ev] || []).forEach(function (f) { try { f(d); } catch (e) { console.warn(e); } }); scheduleState(); }
var stT = 0;
function scheduleState() { if (stT) return; stT = setTimeout(function () { stT = 0; var el = $('#bot-state'); if (el) el.textContent = JSON.stringify(state(), null, 1); }, 30); }
var lastOutput = '';
function botOut(v) {
  lastOutput = typeof v === 'string' ? v : JSON.stringify(v);
  var el = $('#bot-output'); if (el) el.textContent = lastOutput;
  document.body.setAttribute('data-last-output-at', String(Date.now()));
  scheduleState();
  return v;
}
FS.load();

/* dialogs */
function dialog(title, opts) {
  opts = opts || {};
  return new Promise(function (res) {
    var inp = opts.input != null ? h('input', { type: 'text' }) : null;
    if (inp) inp.value = opts.input;
    var bg, close = function (v) { bg.remove(); res(v); };
    var ok = h('button', { cls: 'btn pri', text: opts.ok || 'OK', onclick: function () { close(inp ? inp.value : true); } });
    bg = h('div', { cls: 'dlg-bg', onpointerdown: function (e) { if (e.target === bg) close(null); } }, [
      h('div', { cls: 'dlg' }, [h('h4', { text: title }), opts.msg ? h('div', { text: opts.msg }) : null, inp,
        h('div', { cls: 'row' }, [opts.alert ? null : h('button', { cls: 'btn', text: 'Hủy', onclick: function () { close(null); } }), ok])])]);
    if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') ok.click(); if (e.key === 'Escape') close(null); });
    $('#desktop').appendChild(bg);
    if (inp) setTimeout(function () { inp.focus(); inp.select(); }, 30);
  });
}
function toastErr(e) { dialog('Lỗi', { msg: e && e.message ? e.message : String(e), alert: true }); }

/* window manager */
var WM = { wins: [], z: 10, seq: 0 };
var narrow = function () { return window.innerWidth < 700; };
function focusWin(w) {
  WM.wins.forEach(function (x) { x.el.setAttribute('data-focused', x === w ? '1' : '0'); });
  if (w) { w.el.style.zIndex = ++WM.z; if (w.state === 'minimized') setState(w, w.prevState || 'normal'); }
  renderTaskbar(); scheduleState();
}
function topWin() { var t = null; WM.wins.forEach(function (w) { if (w.state !== 'minimized' && (!t || +w.el.style.zIndex > +t.el.style.zIndex)) t = w; }); return t; }
function setState(w, st) {
  if (st === 'minimized' && w.state !== 'minimized') w.prevState = w.state;
  w.state = st; w.el.setAttribute('data-state', st);
  if (st === 'minimized') { w.el.setAttribute('data-focused', '0'); var top = topWin(); if (top) focusWin(top); }
  renderTaskbar(); scheduleState();
}
function setTitle(w, t) { w.title = t; w.tEl.textContent = t; w.el.setAttribute('data-title', t); renderTaskbar(); scheduleState(); }
function createWin(appId, title, wd, ht) {
  var id = 'w' + (++WM.seq);
  var tEl = h('span', { cls: 'ttitle' });
  var el = h('div', { cls: 'win', id: 'win-' + id, 'data-app': appId, 'data-win-id': id, role: 'dialog' });
  var bMin = h('button', { cls: 'min', title: 'Thu nhỏ', 'aria-label': 'Thu nhỏ' }), bMax = h('button', { cls: 'max', title: 'Phóng to', 'aria-label': 'Phóng to' }), bCls = h('button', { cls: 'cls', title: 'Đóng', 'aria-label': 'Đóng' });
  bMin.appendChild(rawSvg(WBTN.min)); bMax.appendChild(rawSvg(WBTN.max)); bCls.appendChild(rawSvg(WBTN.cls));
  var tb = h('div', { cls: 'titlebar' }, [svg(IC[appId] || IC.file, 'ti'), tEl, h('div', { cls: 'tbtns' }, [bMin, bMax, bCls])]);
  var body = h('div', { cls: 'wbody' }), rsz = h('div', { cls: 'rsz' });
  el.appendChild(tb); el.appendChild(body); el.appendChild(rsz);
  var W = window.innerWidth, H = window.innerHeight - 48;
  wd = Math.min(wd || 720, W - 20); ht = Math.min(ht || 480, H - 20);
  var n = WM.wins.length % 6;
  el.style.left = Math.max(0, (W - wd) / 2 - 75 + n * 30) + 'px'; el.style.top = Math.max(0, (H - ht) / 2 - 50 + n * 30) + 'px';
  el.style.width = wd + 'px'; el.style.height = ht + 'px';
  var w = { id: id, app: appId, el: el, body: body, tEl: tEl, state: 'normal', title: '' };
  setTitle(w, title);
  $('#windows').appendChild(el);
  WM.wins.push(w);
  setState(w, narrow() ? 'maximized' : 'normal');
  el.addEventListener('pointerdown', function () { if (el.getAttribute('data-focused') !== '1') focusWin(w); }, true);
  bMin.onclick = function () { setState(w, 'minimized'); };
  bMax.onclick = function () { setState(w, w.state === 'maximized' ? 'normal' : 'maximized'); };
  bCls.onclick = function () { closeWin(w); };
  tb.addEventListener('dblclick', function (e) { if (!e.target.closest('.tbtns')) bMax.onclick(); });
  /* drag with pointer events (mouse + touch) */
  tb.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.tbtns') || e.button > 0) return;
    var sx = e.clientX, sy = e.clientY, moved = false, ox = 0, oy = 0;
    tb.setPointerCapture(e.pointerId);
    function mv(ev) {
      var dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved) {
        if (Math.abs(dx) + Math.abs(dy) < 5) return;
        if (w.state === 'maximized') {
          if (narrow()) return;
          var ww = el.offsetWidth; setState(w, 'normal');
          el.style.left = (ev.clientX - el.offsetWidth * (sx / ww)) + 'px'; el.style.top = '0px';
        }
        moved = true; ox = el.offsetLeft; oy = el.offsetTop; sx = ev.clientX; sy = ev.clientY; dx = dy = 0;
      }
      var nx = Math.max(-el.offsetWidth + 80, Math.min(ox + dx, window.innerWidth - 80));
      var ny = Math.max(0, Math.min(oy + dy, window.innerHeight - 48 - 36));
      el.style.left = nx + 'px'; el.style.top = ny + 'px';
    }
    function up(ev) { tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); tb.removeEventListener('pointercancel', up); if (moved && ev.clientY <= 2 && !narrow()) setState(w, 'maximized'); }
    tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up); tb.addEventListener('pointercancel', up);
  });
  rsz.addEventListener('pointerdown', function (e) {
    e.preventDefault(); rsz.setPointerCapture(e.pointerId);
    var sx = e.clientX, sy = e.clientY, sw = el.offsetWidth, sh = el.offsetHeight;
    function mv(ev) { el.style.width = Math.max(260, sw + ev.clientX - sx) + 'px'; el.style.height = Math.max(180, sh + ev.clientY - sy) + 'px'; }
    function up() { rsz.removeEventListener('pointermove', mv); rsz.removeEventListener('pointerup', up); rsz.removeEventListener('pointercancel', up); }
    rsz.addEventListener('pointermove', mv); rsz.addEventListener('pointerup', up); rsz.addEventListener('pointercancel', up);
  });
  focusWin(w);
  return w;
}
function closeWin(w) {
  var i = WM.wins.indexOf(w); if (i < 0) return;
  WM.wins.splice(i, 1); w.el.remove();
  focusWin(topWin());
  emit('windows');
}

/* app registry */
var APPS = {};
var ALIAS = { files: 'explorer', file: 'explorer', thumuc: 'explorer', notes: 'notepad', note: 'notepad', cmd: 'terminal', term: 'terminal', shell: 'terminal', calculator: 'calc', maytinh: 'calc', web: 'browser', edge: 'browser', caidat: 'settings', setting: 'settings', goiy: 'reply', suggest: 'reply' };
function appId(id) { id = String(id || '').toLowerCase().trim(); return own(ALIAS, id) ? ALIAS[id] : id; }
function app(id, name, opts) { opts.id = id; opts.name = name; APPS[id] = opts; }
function openApp(id, arg) {
  id = appId(id);
  if (!own(APPS, id)) throw new Error('Không có ứng dụng "' + id + '". Có: ' + Object.keys(APPS).join(', '));
  var a = APPS[id];
  hideStart();
  if (a.single) { var ex = WM.wins.filter(function (w) { return w.app === id; })[0]; if (ex) { focusWin(ex); if (arg != null && ex.onarg) ex.onarg(arg); return ex; } }
  var w = createWin(id, a.name, a.w, a.h);
  a.init(w, arg);
  emit('windows');
  return w;
}
function listApps() { return Object.keys(APPS).map(function (k) { return { id: k, name: APPS[k].name }; }); }

/* File Explorer */
app('explorer', 'Quản lý tệp', { w: 760, h: 480, init: function (w, arg) {
  var cwd = '/', sel = null;
  var path = h('input', { cls: 'ex-path', type: 'text', 'aria-label': 'Đường dẫn' });
  var main = h('div', { cls: 'ex-main' }), status = h('div', { cls: 'status' });
  var act = function (fn) { try { fn(); } catch (e) { toastErr(e); } };
  var tb = h('div', { cls: 'toolbar' }, [
    h('button', { text: '↑ Lên', title: 'Thư mục cha', onclick: function () { go(FS.norm('..', cwd)); } }),
    h('button', { text: '+ Thư mục', onclick: function () { dialog('Thư mục mới', { input: 'Thư mục mới' }).then(function (n) { if (n) act(function () { FS.mkdir(FS.norm(n, cwd)); }); }); } }),
    h('button', { text: '+ Tệp .txt', onclick: function () { dialog('Tệp văn bản mới', { input: 'moi.txt' }).then(function (n) { if (n) act(function () { if (FS.get(FS.norm(n, cwd))) throw new Error('Đã tồn tại'); FS.write(FS.norm(n, cwd), ''); }); }); } }),
    h('button', { text: 'Mở', onclick: function () { if (sel) openItem(sel); } }),
    h('button', { text: 'Đổi tên', onclick: function () { if (!sel) return; dialog('Đổi tên', { input: sel }).then(function (n) { if (n && n !== sel) act(function () { FS.move(FS.norm(sel, cwd), FS.norm(n, cwd)); sel = n; render(); }); }); } }),
    h('button', { text: 'Xóa', onclick: function () { if (!sel) return; dialog('Xóa "' + sel + '"?', { msg: 'Không thể hoàn tác.', ok: 'Xóa' }).then(function (y) { if (y) act(function () { FS.rm(FS.norm(sel, cwd)); sel = null; }); }); } }),
    path]);
  var side = h('div', { cls: 'ex-side' }, [['Ổ đĩa (/)', '/'], ['Tài liệu', '/Tài liệu'], ['Ảnh', '/Ảnh'], ['Tải xuống', '/Tải xuống'], ['Màn hình nền', '/Màn hình nền']].map(function (x) { return h('button', { text: x[0], onclick: function () { go(x[1]); } }); }));
  w.body.appendChild(tb); w.body.appendChild(h('div', { cls: 'ex' }, [side, main])); w.body.appendChild(status);
  path.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(FS.norm(path.value)); });
  function openItem(name) { var p = FS.norm(name, cwd), n = FS.get(p); if (!n) return; if (n.t === 'd') go(p); else openFile(p); }
  function go(p) { var n = FS.get(p); if (!n || n.t !== 'd') { toastErr(new Error('Không tìm thấy thư mục: ' + p)); return; } cwd = FS.norm(p); sel = null; render(); }
  function render() {
    if (!FS.get(cwd)) cwd = '/';
    path.value = cwd; main.textContent = '';
    w.el.setAttribute('data-path', cwd);
    setTitle(w, (cwd === '/' ? 'Ổ đĩa' : FS.parts(cwd).pop()) + ' – Quản lý tệp');
    var items = FS.list(cwd);
    if (!items.length) main.appendChild(h('div', { cls: 'empty', text: 'Thư mục trống' }));
    items.forEach(function (it) {
      var el = h('button', { cls: 'ex-item' + (it.name === sel ? ' sel' : ''), 'data-name': it.name, 'data-type': it.type, title: it.name }, [svg(it.type === 'dir' ? IC.folder : IC.file), h('span', { text: it.name })]);
      var pt = 'mouse';
      el.addEventListener('pointerdown', function (e) { pt = e.pointerType; });
      el.addEventListener('click', function () { if (pt !== 'mouse' && sel === it.name) return openItem(it.name); sel = it.name; render(); });
      el.addEventListener('dblclick', function () { openItem(it.name); });
      main.appendChild(el);
    });
    status.textContent = items.length + ' mục' + (sel ? ' · đã chọn: ' + sel : '') + ' · ' + (narrow() ? 'chạm lần nữa để mở' : 'nhấp đúp để mở');
  }
  w.onarg = function (p) { go(FS.norm(p)); };
  on('fs', function () { if (w.el.isConnected) render(); });
  go(typeof arg === 'string' ? FS.norm(arg) : '/');
} });

/* Notepad */
function openFile(p) {
  p = FS.norm(p);
  var ex = WM.wins.filter(function (w) { return w.app === 'notepad' && w.file === p; })[0];
  if (ex) { focusWin(ex); ex.reload(); return ex; }
  return openApp('notepad', { file: p });
}
app('notepad', 'Notepad', { w: 640, h: 440, init: function (w, arg) {
  var ta = h('textarea', { cls: 'np', spellcheck: 'false', 'aria-label': 'Nội dung' });
  var st = h('div', { cls: 'status' }), dirty = false;
  function upd() { var name = w.file ? FS.parts(w.file).pop() : 'Không tên'; setTitle(w, (dirty ? '*' : '') + name + ' – Notepad'); st.textContent = (w.file || 'Chưa lưu') + ' · ' + ta.value.length + ' ký tự · Ctrl+S để lưu'; w.el.setAttribute('data-file', w.file || ''); }
  function save(asNew) {
    var go = function (p) { if (!p) return; try { w.file = FS.write(FS.norm(p), ta.value); dirty = false; upd(); } catch (e) { toastErr(e); } };
    if (w.file && !asNew) go(w.file); else dialog('Lưu thành (đường dẫn)', { input: w.file || '/Tài liệu/ghichu-moi.txt' }).then(go);
  }
  function load(p) { p = FS.norm(p); ta.value = FS.read(p); w.file = p; dirty = false; upd(); }
  w.body.appendChild(h('div', { cls: 'toolbar' }, [
    h('button', { text: 'Mới', onclick: function () { w.file = null; ta.value = ''; dirty = false; upd(); } }),
    h('button', { text: 'Mở…', onclick: function () { dialog('Mở tệp (đường dẫn)', { input: '/Tài liệu/ghichu.txt' }).then(function (p) { if (p) try { load(p); } catch (e) { toastErr(e); } }); } }),
    h('button', { text: 'Lưu', onclick: function () { save(false); } }),
    h('button', { text: 'Lưu thành…', onclick: function () { save(true); } })]));
  w.body.appendChild(ta); w.body.appendChild(st);
  ta.addEventListener('input', function () { dirty = true; upd(); });
  ta.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(false); } });
  w.reload = function () { if (w.file && !dirty) try { load(w.file); } catch (e) {} };
  w.getText = function () { return ta.value; };
  if (arg && arg.file) { try { load(arg.file); } catch (e) { w.file = null; toastErr(e); } }
  upd();
} });

/* Terminal */
var TERM = { cwd: '/', hist: [] };
function tokenize(s) {
  var out = [], cur = '', q = null, has = false;
  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    if (q) { if (c === q) q = null; else cur += c; continue; }
    if (c === '"' || c === "'") { q = c; has = true; continue; }
    if (c === '>') { if (has) { out.push(cur); cur = ''; has = false; } if (s[i + 1] === '>') { out.push({ op: '>>' }); i++; } else out.push({ op: '>' }); continue; }
    if (/\s/.test(c)) { if (has) { out.push(cur); cur = ''; has = false; } continue; }
    cur += c; has = true;
  }
  if (has) out.push(cur);
  return out;
}
var HELP = [
  'Lệnh có sẵn / Commands:',
  '  help                 trợ giúp',
  '  ls [đường dẫn]       liệt kê thư mục',
  '  cd <thư mục>         đổi thư mục (cd .., cd /)',
  '  pwd                  thư mục hiện tại',
  '  mkdir <tên>          tạo thư mục',
  '  touch <tệp>          tạo tệp rỗng',
  '  cat <tệp>            xem nội dung tệp',
  '  echo <chữ> [> tệp]   in ra / ghi tệp (>> để nối thêm)',
  '  rm [-r] <đường dẫn>  xóa',
  '  mv <nguồn> <đích>    di chuyển / đổi tên',
  '  open <app|tệp>       mở ứng dụng hoặc tệp',
  '  apps                 danh sách ứng dụng',
  '  reply <tin nhắn>     gợi ý trả lời (JSON)',
  '  theme dark|light · wallpaper [tên]',
  '  date · whoami · neofetch · history · clear',
  'Dùng dấu nháy cho tên có dấu cách: cd "Tài liệu"'
].join('\n');
var CLEAR = '\u0000CLEAR';
function exec(line) {
  line = String(line == null ? '' : line).slice(0, 5000).trim();
  if (!line) return '';
  TERM.hist.push(line); if (TERM.hist.length > 200) TERM.hist.shift();
  var t = tokenize(line), redir = null;
  for (var i = 0; i < t.length; i++) if (typeof t[i] === 'object') { if (typeof t[i + 1] !== 'string') return 'Lỗi: thiếu tên tệp sau ' + t[i].op; redir = { op: t[i].op, file: t[i + 1] }; t.splice(i, 2); break; }
  var cmd = String(t.shift() || '').toLowerCase(), a = t, cwd = TERM.cwd, P = function (x) { return FS.norm(x, cwd); };
  var noflag = function (x) { return x.charAt(0) !== '-'; };
  var out;
  try {
    switch (cmd) {
      case 'help': case '?': out = HELP; break;
      case 'ls': case 'dir': out = FS.list(P(a.filter(noflag)[0] || '.')).map(function (x) { return x.type === 'dir' ? x.name + '/' : x.name; }).join('\n'); break;
      case 'cd': { var p2 = P(a[0] || '/'), n = FS.get(p2); if (!n) throw new Error('cd: không tìm thấy: ' + (a[0] || '')); if (n.t !== 'd') throw new Error('cd: không phải thư mục'); TERM.cwd = p2; out = ''; break; }
      case 'pwd': out = cwd; break;
      case 'mkdir': case 'md': if (!a.filter(noflag).length) throw new Error('mkdir: thiếu tên'); a.filter(noflag).forEach(function (x) { FS.mkdir(P(x)); }); out = ''; break;
      case 'touch': if (!a.length) throw new Error('touch: thiếu tên'); a.forEach(function (x) { if (!FS.get(P(x))) FS.write(P(x), ''); }); out = ''; break;
      case 'cat': case 'type': if (!a.length) throw new Error('cat: thiếu tên tệp'); out = a.map(function (x) { return FS.read(P(x)); }).join('').replace(/\n$/, ''); break;
      case 'echo': out = a.join(' '); break;
      case 'rm': case 'del': case 'rmdir': {
        var r = a.indexOf('-r') >= 0 || a.indexOf('-rf') >= 0;
        if (!a.filter(noflag).length) throw new Error('rm: thiếu đường dẫn');
        a.filter(noflag).forEach(function (x) { var n2 = FS.get(P(x)); if (n2 && n2.t === 'd' && !r && Object.keys(n2.c).length) throw new Error('rm: ' + x + ' là thư mục không rỗng (dùng rm -r)'); FS.rm(P(x)); });
        out = ''; break; }
      case 'mv': case 'move': case 'ren': if (a.length < 2) throw new Error('mv: cần nguồn và đích'); FS.move(P(a[0]), P(a[1])); out = ''; break;
      case 'open': case 'start': { if (!a[0]) throw new Error('open: thiếu tên'); var fp = P(a[0]), fn = FS.get(fp); if (fn) { if (fn.t === 'd') openApp('explorer', fp); else openFile(fp); } else openApp(a[0]); out = 'Đã mở ' + a[0]; break; }
      case 'apps': out = listApps().map(function (x) { return x.id + '\t' + x.name; }).join('\n'); break;
      case 'theme': out = setTheme(a[0]); break;
      case 'wallpaper': out = a[0] ? setWallpaper(a[0]) : Object.keys(WALLS).join(', '); break;
      case 'date': out = new Date().toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'medium' }); break;
      case 'whoami': out = 'khach'; break;
      case 'history': out = TERM.hist.map(function (x, i) { return (i + 1) + '  ' + x; }).join('\n'); break;
      case 'clear': case 'cls': out = CLEAR; break;
      case 'neofetch': case 'ver': case 'systeminfo': out = neofetch(); break;
      case 'reply': out = JSON.stringify(suggest(a.join(' '))); break;
      default: throw new Error(cmd + ': không tìm thấy lệnh. Gõ "help".');
    }
    if (redir) { FS.write(P(redir.file), (out === CLEAR ? '' : out) + '\n', redir.op === '>>'); out = ''; }
  } catch (e) { out = 'Lỗi: ' + (e.message || e); }
  emit('term');
  return out;
}
var bootAt = Date.now();
function neofetch() {
  var up = Math.round((Date.now() - bootAt) / 1000), ua = navigator.userAgent;
  var br = /Edg\/[\d]+/.exec(ua) || /CriOS\/[\d]+/.exec(ua) || /Chrome\/[\d]+/.exec(ua) || /Firefox\/[\d]+/.exec(ua) || /Version\/[\d.]+/.exec(ua) || ['?'];
  var L = ['  ███████ ███████', '  ███████ ███████', '  ███████ ███████', '', '  ███████ ███████', '  ███████ ███████', '  ███████ ███████'];
  var R = ['khach@pc-ao', '-----------', 'OS: PC Ảo 11 (web) v' + VERSION, 'Kernel: JavaScript', 'Uptime: ' + Math.floor(up / 60) + ' phút ' + (up % 60) + ' giây', 'Shell: pcsh', 'Màn hình: ' + screen.width + 'x' + screen.height, 'Chủ đề: ' + S.theme + ' · ' + WALLS[S.wallpaper].name, 'CPU: ' + (navigator.hardwareConcurrency || '?') + ' luồng', 'RAM: ' + (navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'không rõ'), 'Trình duyệt: ' + br[0]];
  var o = []; for (var i = 0; i < Math.max(L.length, R.length); i++) o.push((L[i] || '').padEnd(20) + (R[i] || ''));
  return o.join('\n');
}
app('terminal', 'Terminal', { w: 680, h: 420, single: true, init: function (w) {
  var out = h('div', { cls: 'term', role: 'log' }), inp = h('input', { type: 'text', autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Lệnh' });
  var pr = h('span', { cls: 'p' }), line = h('div', { cls: 'term-in' }, [pr, inp]), hi = -1;
  function prompt() { pr.textContent = 'khach@pc-ao:' + TERM.cwd + '$'; }
  function print(txt, cls) { out.insertBefore(h('div', { cls: cls || '', text: txt }), line); out.scrollTop = out.scrollHeight; }
  w.run = function (cmd) {
    print(pr.textContent + ' ' + cmd, 'p');
    var r = exec(cmd);
    if (r === CLEAR) { while (out.firstChild !== line) out.removeChild(out.firstChild); r = ''; }
    else if (r) print(r, /^Lỗi:/.test(r) ? 'e' : '');
    prompt(); hi = -1;
    w.el.setAttribute('data-cwd', TERM.cwd);
    return r;
  };
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { var v = inp.value; inp.value = ''; botOut(w.run(v)); }
    else if (e.key === 'ArrowUp') { if (TERM.hist.length) { hi = hi < 0 ? TERM.hist.length - 1 : Math.max(0, hi - 1); inp.value = TERM.hist[hi]; } e.preventDefault(); }
    else if (e.key === 'ArrowDown') { if (hi >= 0) { hi++; inp.value = TERM.hist[hi] || ''; if (hi >= TERM.hist.length) hi = -1; } e.preventDefault(); }
  });
  out.addEventListener('click', function () { if (!String(getSelection())) inp.focus(); });
  out.appendChild(h('div', { text: 'PC Ảo Terminal ' + VERSION + ' – gõ "help" để xem lệnh.' }));
  out.appendChild(line); w.body.appendChild(out); prompt();
  if (!narrow()) setTimeout(function () { inp.focus(); }, 50);
} });

/* Calculator – safe recursive-descent parser (no eval) */
function calcEval(s) {
  s = String(s).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.').replace(/\s+/g, '');
  if (!/^[0-9.+\-*/%()]*$/.test(s) || s.length > 200) throw new Error('Biểu thức không hợp lệ');
  var i = 0, depth = 0;
  function num() { var m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)); if (!m) throw new Error('Lỗi cú pháp'); i += m[0].length; return parseFloat(m[0]); }
  function fac() {
    if (++depth > 100) throw new Error('Biểu thức quá sâu');
    var v;
    if (s[i] === '-') { i++; v = -fac(); } else if (s[i] === '+') { i++; v = fac(); }
    else if (s[i] === '(') { i++; v = expr(); if (s[i] !== ')') throw new Error('Thiếu )'); i++; } else v = num();
    while (s[i] === '%') { i++; v /= 100; }
    depth--; return v;
  }
  function term() { var v = fac(); while (s[i] === '*' || s[i] === '/') { var o = s[i++], r = fac(); v = o === '*' ? v * r : v / r; } return v; }
  function expr() { var v = term(); while (s[i] === '+' || s[i] === '-') { var o = s[i++], r = term(); v = o === '+' ? v + r : v - r; } return v; }
  if (!s) return 0;
  var v = expr(); if (i < s.length) throw new Error('Lỗi cú pháp');
  if (!isFinite(v)) throw new Error('Không chia được cho 0');
  return +v.toPrecision(12);
}
var fmtNum = function (n) { return String(n).replace('.', ','); };
app('calc', 'Máy tính', { w: 320, h: 470, single: true, init: function (w) {
  var expr = '', ex = h('div', { cls: 'calc-expr' }), disp = h('div', { cls: 'calc-out', text: '0' });
  function press(k) {
    if (k === 'C') { expr = ''; disp.textContent = '0'; }
    else if (k === '⌫') expr = expr.slice(0, -1);
    else if (k === '=') { try { var r = calcEval(expr); disp.textContent = fmtNum(r); ex.textContent = expr + ' ='; expr = String(r); w.el.setAttribute('data-result', String(r)); return String(r); } catch (e) { disp.textContent = e.message; return 'Lỗi: ' + e.message; } }
    else if (k === '±') expr = expr ? '-(' + expr + ')' : '-';
    else expr += k;
    if (k !== 'C') { try { disp.textContent = expr ? fmtNum(calcEval(expr)) : '0'; } catch (e) {} }
    ex.textContent = expr;
  }
  w.calc = function (e) { expr = String(e).slice(0, 200); return press('='); };
  var keys = ['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '±', '0', '.', '=', '%', '⌫'];
  var grid = h('div', { cls: 'calc-keys' }, keys.map(function (k) { return h('button', { cls: /[÷×−+%()]/.test(k) ? 'op' : k === '=' ? 'eq' : '', text: k, 'data-key': k, onclick: function () { press(k); } }); }));
  w.body.appendChild(h('div', { cls: 'calc' }, [ex, disp, grid]));
  w.el.tabIndex = -1;
  w.el.addEventListener('keydown', function (e) { var m = { '*': '×', '/': '÷', '-': '−', Enter: '=', Backspace: '⌫', Escape: 'C', ',': '.' }, k = m[e.key] || e.key; if (keys.indexOf(k) >= 0) { e.preventDefault(); press(k); } });
} });

/* Browser – iframe, only http/https */
function safeUrl(u) {
  u = String(u || '').trim(); if (!u) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = /^[^\s/]+\.[a-z]{2,}(\/|$|\?|:|#)/i.test(u) ? 'https://' + u : 'https://vi.wikipedia.org/w/index.php?search=' + encodeURIComponent(u);
  try { var x = new URL(u); if (x.protocol !== 'http:' && x.protocol !== 'https:') return null; return x.href; } catch (e) { return null; }
}
app('browser', 'Trình duyệt', { w: 900, h: 600, single: true, init: function (w, arg) {
  var hist = [], hi = -1, cur = null;
  var addr = h('input', { type: 'url', placeholder: 'Nhập địa chỉ hoặc từ khóa…', autocapitalize: 'off', 'aria-label': 'Địa chỉ' });
  var frame = h('iframe', { cls: 'br-frame hidden', title: 'Trang web', sandbox: 'allow-scripts allow-forms allow-same-origin allow-popups', referrerpolicy: 'no-referrer' });
  var note = h('div', { cls: 'br-note hidden' }, [h('span', { text: 'Nhiều trang (Google, Facebook, YouTube…) chặn hiển thị trong khung. Nếu trang trống, hãy mở trong tab mới.' }),
    h('button', { cls: 'btn pri', text: 'Mở tab mới ↗', onclick: function () { if (cur) window.open(cur, '_blank', 'noopener'); } })]);
  var links = [['Wikipedia', 'https://vi.wikipedia.org'], ['example.com', 'https://example.com'], ['Bản đồ', 'https://www.openstreetmap.org/export/embed.html?bbox=105.80,21.00,105.88,21.05&layer=mapnik'], ['Hướng dẫn bot', new URL('bot.html', location.href).href]];
  var home = h('div', { cls: 'br-home' }, [svg(IC.browser), h('h2', { text: 'Trình duyệt PC Ảo' }), h('div', { text: 'Gõ địa chỉ ở trên, hoặc thử các trang cho phép nhúng:' }),
    h('div', { cls: 'br-links' }, links.map(function (l) { return h('button', { cls: 'btn', text: l[0], onclick: function () { nav(l[1]); } }); }))]);
  var msg = h('div', { cls: 'status', text: 'Trang chủ' });
  function goHome() { cur = null; addr.value = ''; frame.removeAttribute('src'); frame.classList.add('hidden'); note.classList.add('hidden'); home.classList.remove('hidden'); setTitle(w, 'Trình duyệt'); w.el.removeAttribute('data-url'); }
  function nav(u, noHist) {
    var s = safeUrl(u);
    if (!s) { msg.textContent = 'Chỉ hỗ trợ địa chỉ http:// hoặc https://'; return null; }
    cur = s; addr.value = s; frame.src = s;
    frame.classList.remove('hidden'); note.classList.remove('hidden'); home.classList.add('hidden');
    if (!noHist) { hist = hist.slice(0, hi + 1); hist.push(s); hi = hist.length - 1; }
    msg.textContent = 'Đang tải ' + s; w.el.setAttribute('data-url', s); setTitle(w, new URL(s).hostname + ' – Trình duyệt');
    return s;
  }
  frame.addEventListener('load', function () { if (cur) msg.textContent = 'Đã tải xong (nếu trống: trang chặn nhúng) · ' + cur; });
  w.body.appendChild(h('div', { cls: 'br-bar' }, [
    h('button', { cls: 'iconbtn', text: '←', title: 'Lùi', onclick: function () { if (hi > 0) nav(hist[--hi], true); } }),
    h('button', { cls: 'iconbtn', text: '→', title: 'Tiến', onclick: function () { if (hi < hist.length - 1) nav(hist[++hi], true); } }),
    h('button', { cls: 'iconbtn', text: '⟳', title: 'Tải lại', onclick: function () { if (cur) nav(cur, true); } }),
    h('button', { cls: 'iconbtn', text: '⌂', title: 'Trang chủ', onclick: goHome }),
    addr]));
  addr.addEventListener('keydown', function (e) { if (e.key === 'Enter') { nav(addr.value); addr.blur(); } });
  w.body.appendChild(note); w.body.appendChild(home); w.body.appendChild(frame); w.body.appendChild(msg);
  w.nav = nav; w.onarg = function (u) { nav(u); };
  if (arg) nav(arg);
} });

/* Settings */
app('settings', 'Cài đặt', { w: 640, h: 560, single: true, init: function (w) {
  var root = h('div', { cls: 'set' });
  function render() {
    root.textContent = '';
    root.appendChild(h('section', {}, [h('h3', { text: 'Hình nền' }), h('div', { cls: 'swatches' }, Object.keys(WALLS).map(function (k) {
      var b = h('button', { cls: 'wp' + (S.wallpaper === k ? ' on' : ''), text: WALLS[k].name, 'data-wallpaper': k, onclick: function () { setWallpaper(k); } }); b.style.background = WALLS[k].css; return b; }))]));
    root.appendChild(h('section', {}, [h('h3', { text: 'Chủ đề' }), h('div', { cls: 'seg' }, [['light', 'Sáng'], ['dark', 'Tối']].map(function (t) { return h('button', { cls: S.theme === t[0] ? 'on' : '', text: t[1], 'data-theme-btn': t[0], onclick: function () { setTheme(t[0]); } }); }))]));
    root.appendChild(h('section', {}, [h('h3', { text: 'Màu nhấn' }), h('div', { cls: 'swatches' }, Object.keys(ACCENTS).map(function (k) { return h('button', { cls: 'acc' + (S.accent === ACCENTS[k] ? ' on' : ''), title: k, 'aria-label': 'Màu ' + k, style: 'background:' + ACCENTS[k], onclick: function () { setAccent(k); } }); }))]));
    root.appendChild(h('section', {}, [h('h3', { text: 'Giới thiệu' }), h('div', { text: 'PC Ảo ' + VERSION + ' – máy tính giả lập chạy trên web, không cần cài đặt. Dữ liệu chỉ lưu trong trình duyệt của bạn.' }),
      h('p', {}, [h('a', { href: 'bot.html', target: '_blank', rel: 'noopener', text: 'Hướng dẫn điều khiển bằng liên kết (Bot API)' })]),
      h('button', { cls: 'btn', text: 'Xóa toàn bộ tệp (khôi phục mặc định)', onclick: function () { dialog('Khôi phục hệ thống tệp?', { msg: 'Mọi tệp bạn tạo sẽ bị xóa.', ok: 'Khôi phục' }).then(function (y) { if (y) FS.reset(); }); } })]));
  }
  on('settings', function () { if (w.el.isConnected) render(); });
  render(); w.body.appendChild(root);
} });

/* Reply suggester – offline rules + templates. Never connects anywhere, never sends anything. */
function strip(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'); }
var INTENTS = [
  ['night', /(ngu ngon|di ngu|ngu chua|good ?night|\bgn\b|chuc ngu|ngu som)/],
  ['meetup', /(gap (nhau|mat|di|em|anh|ban)|cafe|ca phe|cf\b|di choi|hen ho|\bhen\b|di an|tra sua|ra ngoai|ranh khong|cuoi tuan (nay|ranh))/],
  ['compliment', /(xinh|\bdep\b|de thuong|cute|dang yeu|ngau|dep trai|duyen|cuoi tuoi|hap dan|thu hut|\bxinh\b)/],
  ['doing', /(dang lam gi|lam gi (do|day|the|vay|ha|z)|dang lam chi)/],
  ['job', /(lam nghe|cong viec|di lam|nghe gi|lam o dau|lam (gi|nghe gi) (vay|the|a)|sinh vien|hoc (gi|nganh|truong)|lam viec)/],
  ['location', /(o dau|song o|que (o|dau)|nha (o|dau)|khu nao|quan nao|tinh nao|thanh pho nao)/],
  ['hobby', /(so thich|thich (gi|lam gi|nghe|xem|an)|luc ranh|cuoi tuan|giai tri|xem phim|nghe nhac|du lich|the thao)/],
  ['eat', /(an com|an chua|an gi|doi (bung|chua)|bua (trua|toi|sang))/],
  ['howareyou', /(khoe khong|the nao|sao roi|on khong|dao nay|hom nay (ra sao|cua)|how are you|met khong|vui khong)/],
  ['thanks', /(cam on|thanks|thank|\btks\b|\bthx\b)/],
  ['greet', /(^|\s)(chao|hi+|hello|helo|alo|hey|yo|he lo|xin chao)(\s|$|!|\.|,)/]
];
var T = {
  greet: { 'vui vẻ': ['Hế lô nè 👋 Cuối cùng cũng có người chào mình trước rồi!', 'Chào chào! Hôm nay gió nào đưa bạn tới đây vậy 😄'], 'lịch sự': ['Chào bạn, rất vui được làm quen nha!', 'Chào bạn! Cảm ơn đã nhắn tin cho mình 😊'], 'thả thính': ['Chào bạn, tự nhiên thấy hôm nay đẹp trời hẳn 😌', 'Hi, tin nhắn của bạn là điều dễ thương nhất hôm nay đó ✨'], 'hỏi lại': ['Chào bạn! Hôm nay của bạn thế nào rồi?', 'Hi bạn, dạo này có gì vui không?'] },
  howareyou: { 'vui vẻ': ['Mình vẫn sống khỏe, ăn ngon, chỉ thiếu người nói chuyện thôi 😆', 'Ổn áp lắm, pin còn 80% 🔋 còn bạn?'], 'lịch sự': ['Mình ổn, cảm ơn bạn đã hỏi nha. Bạn thì sao?', 'Mình khỏe, hôm nay hơi bận chút nhưng vẫn ổn.'], 'thả thính': ['Đang ổn, mà nhận được tin nhắn của bạn thì còn ổn hơn 😌', 'Khỏe hơn hẳn từ lúc bạn hỏi thăm đó ✨'], 'hỏi lại': ['Mình ổn nè, còn bạn hôm nay thế nào?', 'Cũng ổn, hôm nay có chuyện gì vui với bạn không?'] },
  doing: { 'vui vẻ': ['Đang ngồi nghĩ xem nên trả lời bạn sao cho ngầu 😎', 'Đang làm nhiệm vụ quan trọng: nằm lướt điện thoại 📱'], 'lịch sự': ['Mình vừa xong việc, đang nghỉ ngơi chút. Bạn đang làm gì đó?', 'Mình đang thư giãn sau một ngày dài nè.'], 'thả thính': ['Đang chờ tin nhắn của bạn, và nó tới rồi nè 😌', 'Vừa định nhắn cho bạn thì bạn nhắn trước, trùng hợp ghê ✨'], 'hỏi lại': ['Mình đang rảnh nè, còn bạn đang làm gì vậy?', 'Đang nghỉ ngơi thôi. Bạn thì sao, bận không?'] },
  job: { 'vui vẻ': ['Mình làm nghề "cố gắng mỗi ngày", lương trả bằng trà sữa 😆', 'Công việc của mình bí mật lắm, đoán thử 3 lần xem 😄'], 'lịch sự': ['Mình làm văn phòng, công việc cũng khá ổn. Còn bạn làm lĩnh vực gì?', 'Mình đi làm bình thường thôi, có dịp kể bạn nghe kỹ hơn nhé.'], 'thả thính': ['Mình làm nhiều việc lắm, nhưng việc mình muốn làm nhất bây giờ là nói chuyện với bạn 😌', 'Công việc ổn, chỉ thiếu một người hỏi han như bạn thôi ✨'], 'hỏi lại': ['Mình làm bình thường thôi, còn bạn làm nghề gì vậy?', 'Bạn hỏi vậy chắc bạn làm nghề thú vị lắm, kể mình nghe với?'] },
  location: { 'vui vẻ': ['Mình ở trên bản đồ, tọa độ cụ thể thì phải thân hơn mới tiết lộ 😆', 'Mình ở gần đây thôi, gần hơn bạn nghĩ đó 😄'], 'lịch sự': ['Mình sống ở trong thành phố, còn bạn ở khu nào vậy?', 'Mình ở nội thành thôi, bạn ở đâu nè?'], 'thả thính': ['Mình ở đâu không quan trọng, quan trọng là có gặp được bạn không 😌', 'Ở đâu cũng được, miễn gần quán cà phê bạn thích ✨'], 'hỏi lại': ['Mình ở nội thành, còn bạn ở quận nào vậy?', 'Bạn nói trước đi, rồi mình xem có gần nhau không 😄'] },
  hobby: { 'vui vẻ': ['Sở thích của mình là ăn, ngủ và tám chuyện với người dễ thương 😆', 'Mình thích cà phê, xem phim và… sưu tầm tin nhắn của bạn 😄'], 'lịch sự': ['Mình thích đọc sách, nghe nhạc và thỉnh thoảng đi du lịch. Còn bạn?', 'Lúc rảnh mình hay xem phim hoặc đi dạo. Bạn thích gì?'], 'thả thính': ['Sở thích mới của mình là nói chuyện với bạn đó 😌', 'Mình thích những buổi chiều chill, có thêm bạn thì càng tuyệt ✨'], 'hỏi lại': ['Mình thích nghe nhạc, còn bạn hay làm gì lúc rảnh?', 'Bạn thích phim thể loại gì? Mình đang cần gợi ý nè.'] },
  meetup: { 'vui vẻ': ['Đi luôn! Nhưng bạn bao trà sữa nha 😆', 'Nghe hấp dẫn đó, mình sẽ tới đúng giờ… chắc vậy 😄'], 'lịch sự': ['Nghe hay đó, mình sắp xếp được. Bạn rảnh hôm nào?', 'Cảm ơn bạn đã rủ, mình gặp ở quán cà phê đông người nhé?'], 'thả thính': ['Mình cũng đang muốn gặp bạn đó, hẹn cuối tuần nha 😌', 'Đồng ý liền, đi đâu cũng được miễn là đi với bạn ✨'], 'hỏi lại': ['Được nè, bạn muốn đi đâu và mấy giờ?', 'Bạn thích quán yên tĩnh hay chỗ nhộn nhịp hơn?'] },
  compliment: { 'vui vẻ': ['Ui khen vậy mình ngại quá, nói thêm vài câu nữa đi 😆', 'Cảm ơn nha, mình biết mà 😎 đùa thôi hihi'], 'lịch sự': ['Cảm ơn bạn nhiều nha, bạn cũng rất dễ mến đó 😊', 'Bạn khen làm mình vui cả ngày luôn, cảm ơn bạn!'], 'thả thính': ['Bạn khen vậy, mình phải xem lại ai dễ thương hơn đây 😌', 'Lời khen của bạn làm tim mình lỡ một nhịp đó ✨'], 'hỏi lại': ['Thật hả? Bạn thấy ấn tượng nhất ở điểm nào?', 'Cảm ơn nha! Còn bạn, mọi người hay khen bạn điều gì?'] },
  eat: { 'vui vẻ': ['Ăn rồi, mà nghe nhắc tới đồ ăn là đói lại liền 😆', 'Chưa ăn nè, bạn định bao mình hả 😄'], 'lịch sự': ['Mình ăn rồi, cảm ơn bạn đã hỏi. Bạn ăn chưa?', 'Mình vừa ăn xong, bạn nhớ ăn uống đầy đủ nha.'], 'thả thính': ['Ăn rồi, mà nếu bạn rủ thì ăn thêm bữa nữa cũng được 😌', 'Chưa, đang chờ ai đó rủ đi ăn chung ✨'], 'hỏi lại': ['Mình ăn rồi, bạn ăn món gì vậy?', 'Bạn thích món gì nhất? Mình đang tìm quán mới.'] },
  night: { 'vui vẻ': ['Ngủ ngon nha, nhớ đừng mơ thấy deadline 😆', 'Chúc ngủ ngon, mai lại tám tiếp nha 😄'], 'lịch sự': ['Chúc bạn ngủ ngon, hẹn nói chuyện sau nhé!', 'Ngủ ngon nha, cảm ơn bạn vì cuộc trò chuyện hôm nay.'], 'thả thính': ['Ngủ ngon, nếu mơ thấy mình thì nhớ kể lại nha 😌', 'Chúc bạn ngủ ngon, mai dậy nhớ nhắn mình đầu tiên đó ✨'], 'hỏi lại': ['Ngủ ngon nha! Mai bạn có kế hoạch gì không?', 'Chúc ngủ ngon, mai mấy giờ bạn dậy?'] },
  thanks: { 'vui vẻ': ['Không có gì, lần sau trả công bằng một ly trà sữa nha 😆', 'Chuyện nhỏ như con thỏ 🐰'], 'lịch sự': ['Không có gì đâu bạn, rất vui được giúp!', 'Không có chi, có gì cứ nhắn mình nhé.'], 'thả thính': ['Không cần cảm ơn đâu, cho mình thêm thời gian nói chuyện là được 😌', 'Vì là bạn nên mình sẵn lòng thôi ✨'], 'hỏi lại': ['Không có gì! Mọi chuyện ổn hết rồi chứ?', 'Còn gì cần mình giúp nữa không nè?'] },
  short: { 'vui vẻ': ['Trả lời ngắn vậy, bạn đang tiết kiệm chữ hả 😆', 'Ừm… cuộc trò chuyện này cần thêm gia vị nè 😄'], 'lịch sự': ['Mình hiểu rồi. Bạn đang bận phải không?', 'Ok bạn, khi nào rảnh mình nói chuyện tiếp nhé.'], 'thả thính': ['Ngắn vậy thôi mà mình vẫn thấy dễ thương 😌', 'Một chữ của bạn cũng đủ làm mình cười rồi ✨'], 'hỏi lại': ['Hôm nay bạn có chuyện gì vui kể mình nghe không?', 'Nếu được đi đâu ngay bây giờ, bạn sẽ chọn đi đâu?'] },
  question: { 'vui vẻ': ['Câu hỏi hay đó, để mình suy nghĩ… xong rồi, bí mật 😆', 'Hỏi khó vậy, mình xin quyền trợ giúp gọi điện cho người thân 😄'], 'lịch sự': ['Câu hỏi hay đó, để mình trả lời thật lòng nha…', 'Mình nghĩ là có, nhưng mình muốn nghe ý bạn trước.'], 'thả thính': ['Muốn biết thì phải hẹn mình đi cà phê mới kể 😌', 'Trả lời thì được, nhưng bạn phải hỏi thêm một câu nữa ✨'], 'hỏi lại': ['Sao bạn lại hỏi vậy nè?', 'Còn bạn, nếu là bạn thì bạn trả lời sao?'] },
  fallback: { 'vui vẻ': ['Haha nghe thú vị ghê, kể tiếp đi 😄', 'Ủa hay vậy, mình hóng phần tiếp theo nè 😆'], 'lịch sự': ['Mình hiểu rồi, cảm ơn bạn đã chia sẻ nha.', 'Nghe hay đó, mình rất thích nói chuyện với bạn.'], 'thả thính': ['Bạn nói gì mình cũng thấy dễ thương hết 😌', 'Nói chuyện với bạn làm ngày của mình vui hẳn ✨'], 'hỏi lại': ['Thật hả? Rồi sau đó sao nữa?', 'Bạn nghĩ sao về chuyện đó?'] }
};
var TONES = ['vui vẻ', 'lịch sự', 'thả thính', 'hỏi lại'];
var INTENT_VI = { greet: 'chào hỏi', howareyou: 'hỏi thăm', doing: 'đang làm gì', job: 'công việc', location: 'nơi ở', hobby: 'sở thích', meetup: 'rủ gặp', compliment: 'khen', eat: 'ăn uống', night: 'chúc ngủ ngon', thanks: 'cảm ơn', short: 'trả lời ngắn', question: 'câu hỏi', fallback: 'chung' };
function fnv(s) { var x = 2166136261; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
function detect(msg) {
  var n = strip(msg).trim(), found = [];
  INTENTS.forEach(function (it) { if (it[1].test(n)) found.push(it[0]); });
  if (!found.length) {
    var core = n.replace(/[^a-z0-9]/g, '');
    if (core.length <= 4 || /^(u+|uh+|um+|ok+|oke|okay|(ha)+|(hi)+|(he)+|k+|vang|da|uhm|hm+|ukm|uk)$/.test(core)) found.push('short');
    else if (/\?/.test(n) || /\b(khong|chua|sao|gi|nao|ha)\s*$/.test(n)) found.push('question');
    else found.push('fallback');
  }
  return found;
}
function suggest(msg) {
  msg = String(msg || '').slice(0, 1000);
  if (!msg.trim()) return [];
  var intents = detect(msg), main = intents.filter(function (x) { return x !== 'greet'; })[0] || intents[0], seed = fnv(strip(msg));
  var res = TONES.map(function (tone, i) { var arr = T[main][tone]; return { tone: tone, intent: main, text: arr[(seed >>> i) % arr.length] }; });
  if (intents.length > 1) { var sec = intents.indexOf('greet') >= 0 && main !== 'greet' ? 'greet' : intents.filter(function (x) { return x !== main; })[0]; res.push({ tone: 'kết hợp', intent: sec + '+' + main, text: T[sec]['lịch sự'][seed % 2] + ' ' + T[main]['hỏi lại'][(seed >>> 3) % 2] }); }
  return res;
}
function copyText(t) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).catch(function () { legacyCopy(t); });
  legacyCopy(t); return Promise.resolve();
}
function legacyCopy(t) { var ta = h('textarea', { style: 'position:fixed;opacity:0;top:0' }); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); }
app('reply', 'Gợi ý trả lời', { w: 560, h: 620, single: true, init: function (w, arg) {
  var ta = h('textarea', { placeholder: 'Dán tin nhắn bạn nhận được vào đây… (vd: "Chào em, cuối tuần rảnh đi cà phê không?")', 'aria-label': 'Tin nhắn nhận được' });
  var list = h('div', { style: 'display:flex;flex-direction:column;gap:8px' }), info = h('div', { cls: 'note' });
  function run(m) {
    if (m != null) ta.value = String(m).slice(0, 1000);
    var r = suggest(ta.value); list.textContent = '';
    info.textContent = r.length ? 'Nhận diện: ' + detect(ta.value).map(function (x) { return INTENT_VI[x]; }).join(', ') : 'Hãy dán một tin nhắn trước.';
    r.forEach(function (s) {
      var b = h('button', { cls: 'btn', text: 'Sao chép' });
      b.onclick = function () { copyText(s.text).then(function () { b.textContent = 'Đã chép ✓'; setTimeout(function () { b.textContent = 'Sao chép'; }, 1500); }); };
      list.appendChild(h('div', { cls: 'sug', 'data-tone': s.tone }, [h('div', { style: 'flex:1' }, [h('span', { cls: 'tone', text: s.tone }), h('p', { text: s.text })]), b]));
    });
    w.el.setAttribute('data-suggestions', String(r.length));
    botOut(JSON.stringify(r));
    return r;
  }
  w.suggest = run; w.onarg = function (m) { run(m); };
  w.body.appendChild(h('div', { cls: 'rp' }, [ta,
    h('div', { style: 'display:flex;gap:8px' }, [h('button', { cls: 'btn pri', text: 'Gợi ý trả lời', onclick: function () { run(); } }), h('button', { cls: 'btn', text: 'Xóa', onclick: function () { ta.value = ''; list.textContent = ''; info.textContent = ''; } })]),
    info, list,
    h('div', { cls: 'note', text: '🔒 Chạy hoàn toàn trên máy bạn. Không kết nối Tinder hay bất kỳ ứng dụng hẹn hò/nhắn tin nào, không tự gửi gì. Bạn tự sao chép và tự gửi.' })]));
  if (arg != null) run(arg);
} });

/* desktop, taskbar, start menu */
var PINNED = ['explorer', 'browser', 'terminal', 'notepad', 'reply', 'settings'];
function renderTaskbar() {
  var box = $('#tb-apps'); if (!box) return; box.textContent = '';
  var ids = PINNED.slice(); WM.wins.forEach(function (w) { if (ids.indexOf(w.app) < 0) ids.push(w.app); });
  var foc = WM.wins.filter(function (w) { return w.el.getAttribute('data-focused') === '1'; })[0];
  ids.forEach(function (id) {
    var ws = WM.wins.filter(function (w) { return w.app === id; });
    var b = h('button', { cls: 'tb-btn' + (ws.length ? ' open' : '') + (foc && foc.app === id && foc.state !== 'minimized' ? ' active' : ''), title: APPS[id].name, 'aria-label': APPS[id].name, 'data-app': id }, [svg(IC[id])]);
    b.onclick = function () {
      hideStart();
      if (!ws.length) return openApp(id);
      if (foc && foc.app === id && foc.state !== 'minimized') setState(foc, 'minimized'); else focusWin(ws[ws.length - 1]);
    };
    box.appendChild(b);
  });
}
function renderIcons() {
  var box = $('#icons'); box.textContent = '';
  var add = function (label, ic, open, attr) {
    var b = h('button', { cls: 'dicon', title: label }, [svg(ic), h('span', { text: label })]);
    for (var k in attr) b.setAttribute(k, attr[k]);
    var pt = 'mouse';
    b.addEventListener('pointerdown', function (e) { pt = e.pointerType; });
    b.addEventListener('click', function () { document.querySelectorAll('.dicon.sel').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); if (pt !== 'mouse') open(); });
    b.addEventListener('dblclick', open);
    box.appendChild(b);
  };
  ['explorer', 'browser', 'terminal', 'notepad', 'calc', 'reply', 'settings'].forEach(function (id) { add(APPS[id].name, IC[id], function () { openApp(id); }, { 'data-app': id }); });
  try { FS.list('/Màn hình nền').forEach(function (it) { var p = '/Màn hình nền/' + it.name; add(it.name, it.type === 'dir' ? IC.folder : IC.file, function () { if (it.type === 'dir') openApp('explorer', p); else openFile(p); }, { 'data-path': p }); }); } catch (e) {}
}
on('fs', renderIcons);
function renderStart(q) {
  var g = $('#startgrid'); g.textContent = ''; var nq = strip(q || '').trim();
  listApps().filter(function (a) { return !nq || strip(a.name).indexOf(nq) >= 0 || a.id.indexOf(nq) >= 0; }).forEach(function (a) {
    g.appendChild(h('button', { cls: 'sm-app', 'data-app': a.id, onclick: function () { openApp(a.id); } }, [svg(IC[a.id]), h('span', { text: a.name })]));
  });
  if (!g.firstChild) g.appendChild(h('div', { cls: 'empty', text: 'Không tìm thấy ứng dụng' }));
}
function hideStart() { $('#startmenu').classList.add('hidden'); $('#powermenu').classList.add('hidden'); }
function toggleStart() {
  var sm = $('#startmenu');
  if (sm.classList.contains('hidden')) { $('#startsearch').value = ''; renderStart(''); sm.classList.remove('hidden'); if (!narrow()) setTimeout(function () { $('#startsearch').focus(); }, 30); }
  else hideStart();
}
function tick() {
  var d = new Date();
  var t = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  $('#clock-t').textContent = t; $('#clock-d').textContent = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  $('#lock-t').textContent = t; $('#lock-d').textContent = d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
}
function showCtx(x, y) {
  var m = $('#ctxmenu'); m.textContent = '';
  var item = function (t, fn) { m.appendChild(h('button', { text: t, onclick: function () { m.classList.add('hidden'); fn(); } })); };
  item('Làm mới', function () { var i = $('#icons'); i.classList.add('flash'); renderIcons(); setTimeout(function () { i.classList.remove('flash'); }, 80); });
  item('Thư mục mới', function () { dialog('Thư mục mới trên màn hình nền', { input: 'Thư mục mới' }).then(function (n) { if (n) try { FS.mkdir('/Màn hình nền/' + n); } catch (e) { toastErr(e); } }); });
  item('Tệp văn bản mới', function () { dialog('Tệp mới trên màn hình nền', { input: 'moi.txt' }).then(function (n) { if (n) try { if (FS.get('/Màn hình nền/' + n)) throw new Error('Đã tồn tại'); FS.write('/Màn hình nền/' + n, ''); } catch (e) { toastErr(e); } }); });
  m.appendChild(h('hr'));
  item('Đổi hình nền', function () { var k = Object.keys(WALLS); setWallpaper(k[(k.indexOf(S.wallpaper) + 1) % k.length]); });
  item('Cá nhân hóa…', function () { openApp('settings'); });
  item('Mở Terminal', function () { openApp('terminal'); });
  m.classList.remove('hidden');
  var r = m.getBoundingClientRect();
  m.style.left = Math.max(4, Math.min(x, window.innerWidth - r.width - 4)) + 'px'; m.style.top = Math.max(4, Math.min(y, window.innerHeight - r.height - 52)) + 'px';
}
function isDesk(t) { return t === $('#desktop') || t === $('#icons') || t === $('#windows'); }

/* power / boot / lock */
var unlocked = false, unlockWaiters = [];
function whenUnlocked() { return unlocked ? Promise.resolve() : new Promise(function (r) { unlockWaiters.push(r); }); }
function unlock() { if (unlocked) return; unlocked = true; $('#lock').classList.add('hidden'); $('#boot').classList.add('hidden'); document.body.setAttribute('data-unlocked', '1'); unlockWaiters.splice(0).forEach(function (f) { f(); }); scheduleState(); }
function showLock() { unlocked = false; document.body.removeAttribute('data-unlocked'); tick(); $('#lock').classList.remove('hidden'); }
function boot(skip, autoUnlock) {
  var b = $('#boot');
  if (skip) { b.classList.add('hidden'); unlock(); return; }
  unlocked = false; document.body.removeAttribute('data-unlocked');
  b.classList.remove('hidden'); var bar = b.querySelector('i'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
  var done = function () { if (b.classList.contains('hidden')) return; b.classList.add('hidden'); if (autoUnlock) unlock(); else showLock(); };
  b.onclick = done; setTimeout(done, 750);
}
function blackout(text, after) {
  var d = h('div', { cls: 'blackout', text: text }); document.body.appendChild(d);
  setTimeout(function () { d.onclick = function () { d.remove(); after(); }; }, 400);
}
function power(kind) {
  hideStart();
  if (kind === 'restart') { WM.wins.slice().forEach(closeWin); boot(false, false); }
  else if (kind === 'shutdown') { WM.wins.slice().forEach(closeWin); unlocked = false; blackout('Đã tắt máy. Chạm để bật lại.', function () { boot(false, false); }); }
  else if (kind === 'sleep') { unlocked = false; blackout('Đang ngủ… Chạm để đánh thức.', showLock); }
  return 'power=' + kind;
}

/* state + screenshot */
function state() {
  return { app: 'PC Ảo', version: VERSION, ready: document.body.getAttribute('data-ready') === '1', unlocked: unlocked, theme: S.theme, wallpaper: S.wallpaper, accent: S.accent, cwd: TERM.cwd,
    windows: WM.wins.map(function (w) { return { id: w.id, app: w.app, title: w.title, state: w.state, focused: w.el.getAttribute('data-focused') === '1', file: w.file || undefined, url: w.el.getAttribute('data-url') || undefined }; }),
    apps: Object.keys(APPS), lastOutput: lastOutput };
}
var cssCache = null;
function screenshot() {
  var W = window.innerWidth, H = window.innerHeight;
  var getCss = cssCache ? Promise.resolve(cssCache) : fetch('style.css').then(function (r) { return r.text(); }).then(function (t) { cssCache = t; return t; });
  return getCss.then(function (css) {
    var live = $('#desktop'), clone = live.cloneNode(true);
    var src = live.querySelectorAll('textarea,input'), dst = clone.querySelectorAll('textarea,input');
    for (var i = 0; i < src.length; i++) { if (src[i].tagName === 'TEXTAREA') dst[i].textContent = src[i].value; else dst[i].setAttribute('value', src[i].value); }
    clone.querySelectorAll('iframe').forEach(function (f) { var d = document.createElement('div'); d.className = 'br-frame'; d.style.cssText = 'display:grid;place-items:center;color:#666;background:#fff'; d.textContent = '(nội dung trang web)'; f.replaceWith(d); });
    var root = document.createElement('div');
    root.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    root.setAttribute('style', document.documentElement.style.cssText + ';width:' + W + 'px;height:' + H + 'px;position:relative;overflow:hidden');
    root.className = 'shot'; root.setAttribute('data-theme', S.theme);
    var st = document.createElement('style');
    st.textContent = css.replace(/\[data-theme=light\]/g, '.shot[data-theme=light]').replace(/:root/g, '.shot') + '.shot{font:14px/1.4 system-ui,sans-serif;color:var(--fg)}.shot #desktop{position:absolute}.shot *,.shot *::before,.shot *::after{animation:none!important;transition:none!important}';
    root.appendChild(st); root.appendChild(clone);
    var svgStr = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><foreignObject width="100%" height="100%">' + new XMLSerializer().serializeToString(root) + '</foreignObject></svg>';
    var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () { try { var c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(img, 0, 0); res(c.toDataURL('image/png')); } catch (e) { res(url); } };
      img.onerror = function () { res(url); };
      img.src = url;
    });
  });
}

/* bot actions: whitelist only, never eval anything from the URL */
var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
function clip(v, n) { return String(v == null ? '' : v).slice(0, n); }
function runCmds(cmds) {
  var w = openApp('terminal'), outs = [];
  clip(cmds, 5000).split(';').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 50).forEach(function (c) { outs.push(w.run(c)); });
  return outs.filter(function (x) { return x !== ''; }).join('\n');
}
var STEP_KEYS = ['run', 'open', 'close', 'cmd', 'file', 'text', 'url', 'theme', 'wallpaper', 'accent', 'msg', 'calc', 'wait', 'power', 'maximize', 'minimize', 'focus'];
function findWin(x) { x = String(x); var id = appId(x); return WM.wins.filter(function (w) { return w.id === x || w.app === id; }).pop(); }
function doStep(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) throw new Error('Mỗi bước phải là một object, vd {"run":"calc"}');
  var keys = Object.keys(s), bad = keys.filter(function (k) { return STEP_KEYS.indexOf(k) < 0; });
  if (bad.length) throw new Error('Khóa không hỗ trợ: ' + bad.join(', ') + '. Hỗ trợ: ' + STEP_KEYS.join(', '));
  if (own(s, 'wait')) return sleep(Math.max(0, Math.min(10000, +s.wait || 0))).then(function () { return 'waited ' + s.wait + 'ms'; });
  if (own(s, 'theme')) return setTheme(s.theme);
  if (own(s, 'wallpaper')) return setWallpaper(s.wallpaper);
  if (own(s, 'accent')) return setAccent(s.accent);
  if (own(s, 'power')) { if (['sleep', 'shutdown', 'restart'].indexOf(s.power) < 0) throw new Error('power: sleep|shutdown|restart'); return power(s.power); }
  if (own(s, 'text')) { var p = FS.write(FS.norm(own(s, 'file') ? clip(s.file, 500) : '/Tài liệu/bot.txt'), clip(s.text, 200000)); openFile(p); return 'wrote ' + p; }
  if (own(s, 'file') || own(s, 'open')) {
    var target = clip(own(s, 'file') ? s.file : s.open, 500), fp = FS.norm(target), n = FS.get(fp);
    if (!n) { if (own(s, 'open') && own(APPS, appId(target))) { openApp(target); return 'opened ' + appId(target); } throw new Error('Không tìm thấy: ' + fp); }
    if (n.t === 'd') openApp('explorer', fp); else openFile(fp); return 'opened ' + fp;
  }
  if (own(s, 'url')) { var u = safeUrl(clip(s.url, 2000)); if (!u) throw new Error('Chỉ cho phép địa chỉ http/https'); openApp('browser', u); return 'browser ' + u; }
  if (own(s, 'msg')) return openApp('reply').suggest(clip(s.msg, 1000));
  if (own(s, 'calc')) return openApp('calc').calc(clip(s.calc, 200));
  if (own(s, 'cmd')) return runCmds(s.cmd);
  if (own(s, 'run')) { var list = Array.isArray(s.run) ? s.run : String(s.run).split(','); return list.slice(0, 20).map(function (id) { id = String(id).trim(); return id ? 'opened ' + openApp(id).app : ''; }).filter(Boolean).join('\n'); }
  if (own(s, 'close')) { if (s.close === 'all') { WM.wins.slice().forEach(closeWin); return 'closed all'; } var cw = findWin(s.close); if (!cw) throw new Error('Không có cửa sổ: ' + s.close); closeWin(cw); return 'closed ' + cw.app; }
  var k = own(s, 'maximize') ? 'maximize' : own(s, 'minimize') ? 'minimize' : 'focus', mw = findWin(s[k]);
  if (!mw) throw new Error('Không có cửa sổ: ' + s[k]);
  if (k === 'focus') focusWin(mw); else setState(mw, k === 'maximize' ? 'maximized' : 'minimized');
  return k + ' ' + mw.app;
}
var botBusy = Promise.resolve();
function runSteps(steps) {
  if (!Array.isArray(steps)) steps = [steps];
  steps = steps.slice(0, 50);
  var results = [];
  var job = botBusy.then(function () {
    return steps.reduce(function (p, s) {
      return p.then(function () {
        var r; try { r = Promise.resolve(doStep(s)); } catch (e) { r = Promise.reject(e); }
        return r.then(function (v) { results.push({ step: s, ok: true, result: v }); if (!(s && own(s, 'wait'))) botOut(v); },
          function (e) { var m = 'Lỗi: ' + (e && e.message || e); results.push({ step: s, ok: false, error: m }); botOut(m); }).then(function () { return sleep(20); });
      });
    }, Promise.resolve());
  }).then(function () { $('#bot-log').textContent = JSON.stringify(results, null, 1); return results; });
  botBusy = job.catch(function () {});
  return job;
}
function getParams() {
  var q = new URLSearchParams(location.search), hq = new URLSearchParams(location.hash.replace(/^#\??/, ''));
  hq.forEach(function (v, k) { q.set(k, v); });
  return q;
}
function paramsToSteps(q) {
  var steps = [], g = function (k) { return q.get(k); }, msg = g('msg');
  ['theme', 'wallpaper', 'accent'].forEach(function (k) { if (g(k)) { var o = {}; o[k] = g(k); steps.push(o); } });
  if (g('run')) g('run').split(',').forEach(function (id) { id = id.trim(); if (!id) return; if (appId(id) === 'reply' && msg != null) { steps.push({ msg: msg }); msg = null; } else steps.push({ run: id }); });
  if (g('text') != null) { var t = { text: g('text') }; if (g('file')) t.file = g('file'); steps.push(t); }
  else if (g('file')) steps.push({ file: g('file') });
  if (g('url')) steps.push({ url: g('url') });
  if (g('calc')) steps.push({ calc: g('calc') });
  if (msg != null) steps.push({ msg: msg });
  if (g('script')) { var sc; try { sc = JSON.parse(g('script')); } catch (e) { sc = [{ invalid: 'script không phải JSON hợp lệ' }]; } (Array.isArray(sc) ? sc : [sc]).forEach(function (x) { steps.push(x); }); }
  if (g('cmd')) steps.push({ cmd: g('cmd') });
  if (g('close')) steps.push({ close: g('close') });
  return steps;
}

/* public JS API for Puppeteer / Playwright bots */
var readyResolve, readyP = new Promise(function (r) { readyResolve = r; });
window.pcAo = Object.freeze({
  version: VERSION,
  ready: readyP,
  listApps: listApps,
  open: function (id, arg) { return openApp(id, arg).id; },
  close: function (x) { return doStep({ close: x == null ? 'all' : String(x) }); },
  exec: function (cmd) { var r = exec(cmd); return botOut(r === CLEAR ? '' : r); },
  terminal: function (cmds) { return botOut(runCmds(cmds)); },
  writeFile: function (p, t) { return FS.write(FS.norm(p), clip(t, 200000)); },
  readFile: function (p) { return FS.read(FS.norm(p)); },
  ls: function (p) { return FS.list(FS.norm(p || '/')); },
  mkdir: function (p) { return FS.mkdir(FS.norm(p)); },
  rm: function (p) { return FS.rm(FS.norm(p)); },
  openFile: function (p) { return openFile(p).id; },
  browse: function (u) { return doStep({ url: u }); },
  reply: function (m) { var r = suggest(m); botOut(JSON.stringify(r)); return r; },
  calc: function (e) { return calcEval(e); },
  setTheme: setTheme, setWallpaper: setWallpaper, setAccent: setAccent,
  wallpapers: function () { return Object.keys(WALLS); },
  run: runSteps,
  state: state,
  screenshot: screenshot,
  unlock: unlock
});

/* init */
function init() {
  applySet(); tick(); setInterval(tick, 10000);
  renderIcons(); renderTaskbar();
  $('#startbtn').onclick = function (e) { e.stopPropagation(); toggleStart(); };
  $('#startsearch').addEventListener('input', function (e) { renderStart(e.target.value); });
  $('#startsearch').addEventListener('keydown', function (e) { if (e.key === 'Enter') { var f = $('#startgrid .sm-app'); if (f) f.click(); } });
  $('#powerbtn').onclick = function (e) { e.stopPropagation(); $('#powermenu').classList.toggle('hidden'); };
  document.querySelectorAll('[data-power]').forEach(function (b) { b.onclick = function () { power(b.getAttribute('data-power')); }; });
  $('#lock').addEventListener('click', unlock);
  document.addEventListener('keydown', function (e) {
    if (!$('#lock').classList.contains('hidden')) { unlock(); return; }
    if (e.key === 'Escape') { hideStart(); $('#ctxmenu').classList.add('hidden'); }
  });
  document.addEventListener('pointerdown', function (e) {
    if (!e.target.closest('#startmenu') && !e.target.closest('#startbtn')) hideStart();
    if (!e.target.closest('#ctxmenu')) $('#ctxmenu').classList.add('hidden');
    if (isDesk(e.target)) document.querySelectorAll('.dicon.sel').forEach(function (x) { x.classList.remove('sel'); });
  });
  var desk = $('#desktop');
  desk.addEventListener('contextmenu', function (e) {
    if (isDesk(e.target) || e.target.closest('.dicon')) { e.preventDefault(); showCtx(e.clientX, e.clientY); }
    else if (!e.target.closest('input,textarea,.term,.np')) e.preventDefault();
  });
  /* long press for touch (iOS Safari has no contextmenu event) */
  var lp = 0, lx = 0, ly = 0;
  desk.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' || !isDesk(e.target)) return; lx = e.clientX; ly = e.clientY; clearTimeout(lp); lp = setTimeout(function () { lp = 0; showCtx(lx, ly); }, 550); });
  desk.addEventListener('pointermove', function (e) { if (lp && Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly) > 10) { clearTimeout(lp); lp = 0; } });
  ['pointerup', 'pointercancel'].forEach(function (ev) { desk.addEventListener(ev, function () { clearTimeout(lp); lp = 0; }); });
  window.addEventListener('resize', function () { if (narrow()) WM.wins.forEach(function (w) { if (w.state === 'normal') setState(w, 'maximized'); }); });

  var q = getParams(), steps = paramsToSteps(q);
  boot(/^(1|true|yes)$/i.test(q.get('skipboot') || ''), steps.length > 0);
  whenUnlocked().then(function () { return steps.length ? runSteps(steps) : []; }).then(function (res) {
    document.body.setAttribute('data-ready', '1');
    scheduleState();
    readyResolve(res);
    window.dispatchEvent(new CustomEvent('pcao:ready', { detail: res }));
  });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});
}
init();
})();
