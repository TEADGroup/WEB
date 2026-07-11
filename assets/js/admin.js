/* =====================================================================
   admin.js — RIÊNG trang quản trị (admin.html)
   ---------------------------------------------------------------------
   Cổng mật khẩu (client-side, KHÔNG bảo mật tuyệt đối) + editor sửa cây
   dự án. Đọc window.PROJECTS_DATA (data/projects-data.js), xuất lại file
   qua File System Access API hoặc tải về.
   Cần nạp SAU: theme.js, data/projects-data.js.
   ===================================================================== */
"use strict";

/* ===== MẬT KHẨU (đổi tại đây) — client-side, không bảo mật tuyệt đối ===== */
var PASSWORD = 'tea-admin';

/* ---------- theme (dùng TEA.initTheme chung) ---------- */
var ICON_MOON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
var ICON_SUN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
TEA.initTheme({
  btn: document.getElementById('themeBtn'),
  onTheme: function (t) { document.getElementById('themeBtn').innerHTML = t === 'dark' ? ICON_MOON : ICON_SUN; }
});

/* ---------- toast ---------- */
var toastEl = document.getElementById('toast');
var toastTimer;
function showToast(msg){ toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 3400); }

/* ---------- login ---------- */
var loginForm = document.getElementById('loginForm');
var loginErr = document.getElementById('loginErr');
function openEditor(){ document.getElementById('login').style.display = 'none'; document.getElementById('editor').style.display = 'block'; renderEditor(); }
if (sessionStorage.getItem('tea-admin-auth') === '1') openEditor();
loginForm.addEventListener('submit', function (e) {
  e.preventDefault();
  if (document.getElementById('pw').value === PASSWORD) { sessionStorage.setItem('tea-admin-auth', '1'); openEditor(); }
  else { loginErr.textContent = 'Sai mật khẩu.'; document.getElementById('pw').select(); }
});
document.getElementById('logout').addEventListener('click', function () {
  if (!confirm('Bạn có chắc muốn đăng xuất? Các thay đổi chưa lưu sẽ bị mất.')) return;
  sessionStorage.removeItem('tea-admin-auth'); // xoá phiên đăng nhập → vào lại bắt buộc nhập mật khẩu
  location.reload();
});

/* ---------- data ---------- */
var DEFAULT_ICO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20M4 20V8l5-4 5 4v12M14 20v-6h6v6M9 12h0"/></svg>';
var data = JSON.parse(JSON.stringify(window.PROJECTS_DATA || []));
var catListEl = document.getElementById('catList');
var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

function renderEditor() {
  catListEl.innerHTML = '';
  if (!data.length) { catListEl.innerHTML = '<p style="color:var(--text-muted);padding:18px;">Chưa có lĩnh vực. Bấm "Thêm lĩnh vực".</p>'; return; }
  data.forEach(function (cat, ci) {
    var c = document.createElement('div');
    c.className = 'cat glass';
    var projHtml = cat.items.map(function (p, pi) {
      return '\
          <div class="proj">\
            <div class="proj-head"><span class="ptitle">Dự án #' + (pi + 1) + '</span><button class="btn btn-danger btn-sm" data-act="delproj" data-ci="' + ci + '" data-pi="' + pi + '">✕ Xóa</button></div>\
            <div class="grid2">\
              <div class="field"><label>Tên (VI)</label><input data-ci="' + ci + '" data-pi="' + pi + '" data-key="vi" value="' + esc(p.vi) + '"></div>\
              <div class="field"><label>Name (EN)</label><input data-ci="' + ci + '" data-pi="' + pi + '" data-key="en" value="' + esc(p.en) + '"></div>\
            </div>\
            <div class="grid2">\
              <div class="field"><label>Năm / Thời gian</label><input data-ci="' + ci + '" data-pi="' + pi + '" data-key="year" value="' + esc(p.year) + '" placeholder="VD: 2023"></div>\
              <div class="field"><label>PLC</label><input data-ci="' + ci + '" data-pi="' + pi + '" data-key="plc" value="' + esc(p.plc) + '" placeholder="VD: Siemens S7-1500"></div>\
            </div>\
            <div class="grid2">\
              <div class="field"><label>Giao thức</label><input data-ci="' + ci + '" data-pi="' + pi + '" data-key="protocol" value="' + esc(p.protocol) + '" placeholder="VD: Profinet, OPC UA"></div>\
              <div class="field"><label>Ảnh (URL)</label><input data-ci="' + ci + '" data-pi="' + pi + '" data-key="image" value="' + (p._file ? '' : esc(p.image)) + '" placeholder="https://... hoặc bấm Chọn ảnh bên dưới"></div>\
            </div>\
            <div class="field"><label>Mô tả (VI)</label><textarea data-ci="' + ci + '" data-pi="' + pi + '" data-key="vi_desc">' + esc(p.vi_desc) + '</textarea></div>\
            <div class="field"><label>Description (EN)</label><textarea data-ci="' + ci + '" data-pi="' + pi + '" data-key="en_desc">' + esc(p.en_desc) + '</textarea></div>\
            <div class="imgpick">\
              <img id="prev-' + ci + '-' + pi + '" src="' + (p.image ? esc(p.image) : '') + '" alt="" referrerpolicy="no-referrer" onerror="this.style.opacity=\'.25\'" style="' + (p.image ? '' : 'opacity:.25') + '">\
              <label class="btn btn-ghost btn-sm">📷 Chọn ảnh từ máy<input type="file" accept="image/*" data-act="img" data-ci="' + ci + '" data-pi="' + pi + '" style="display:none;"></label>\
              ' + (p._file ? '<span style="color:var(--neon);font-size:.78rem;">✓ ảnh tải lên (ghi vào data/images/)</span>' : '') + '\
            </div>\
          </div>';
    }).join('');
    c.innerHTML = '\
          <div class="cat-head">\
            <span class="cat-title">Lĩnh vực #' + (ci + 1) + '</span>\
            <button class="btn btn-danger btn-sm" data-act="delcat" data-ci="' + ci + '">✕ Xóa lĩnh vực</button>\
          </div>\
          <div class="grid2">\
            <div class="field"><label>Tên lĩnh vực (VI)</label><input data-ci="' + ci + '" data-key="cvi" value="' + esc(cat.vi) + '"></div>\
            <div class="field"><label>Category (EN)</label><input data-ci="' + ci + '" data-key="cen" value="' + esc(cat.en) + '"></div>\
          </div>\
          ' + (projHtml || '<p style="color:var(--text-muted);font-size:.84rem;padding:6px 2px;">(Chưa có dự án)</p>') + '\
          <button class="btn btn-ghost btn-sm" data-act="addproj" data-ci="' + ci + '" style="margin-top:8px;">＋ Thêm dự án</button>';
    catListEl.appendChild(c);
  });
}

/* ---------- delegated: text input ---------- */
catListEl.addEventListener('input', function (e) {
  var t = e.target;
  if (t.dataset.key === undefined) return;
  var ci = +t.dataset.ci, pi = t.dataset.pi, key = t.dataset.key;
  if (pi === undefined) {
    if (key === 'cvi') data[ci].vi = t.value;
    else if (key === 'cen') data[ci].en = t.value;
  } else {
    if (key === 'image') delete data[ci].items[+pi]._file; // gõ URL → bỏ ảnh tải lên
    data[ci].items[+pi][key] = t.value;
  }
});

/* ---------- delegated: buttons ---------- */
catListEl.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]'); if (!b) return;
  var act = b.dataset.act, ci = +b.dataset.ci;
  if (act === 'delcat') { if (confirm('Xóa lĩnh vực này?')) { data.splice(ci, 1); renderEditor(); } }
  else if (act === 'addproj') { data[ci].items.push({ vi: '', en: '', year: '', plc: '', protocol: '', vi_desc: '', en_desc: '', image: '' }); renderEditor(); }
  else if (act === 'delproj') { if (confirm('Xóa dự án này?')) { data[ci].items.splice(+b.dataset.pi, 1); renderEditor(); } }
});

/* ---------- delegated: image upload (compress) ---------- */
catListEl.addEventListener('change', function (e) {
  var f = e.target; if (f.dataset.act !== 'img') return;
  var file = f.files[0]; if (!file) return;
  var ci = +f.dataset.ci, pi = +f.dataset.pi;
  var reader = new FileReader();
  reader.onload = function (ev) {
    var img = new Image();
    img.onload = function () {
      var max = 1000; var w = img.width, h = img.height;
      if (w > max) { h = Math.round(h * max / w); w = max; }
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      cv.toBlob(function (blob) {
        if (!blob) { showToast('Lỗi xử lý ảnh.'); return; }
        var fname = 'proj-' + ci + '-' + pi + '-' + Date.now() + '.jpg';
        var url = URL.createObjectURL(blob);
        var p = data[ci].items[pi];
        p._file = { blob: blob, filename: fname }; p.image = url;
        var prev = document.getElementById('prev-' + ci + '-' + pi);
        if (prev) { prev.src = url; prev.style.opacity = '1'; }
        var urlInput = catListEl.querySelector('input[data-ci="' + ci + '"][data-pi="' + pi + '"][data-key="image"]');
        if (urlInput) urlInput.value = '';
        showToast('✓ Đã thêm ảnh. Bấm "Lưu vào thư mục" để ghi file.');
      }, 'image/jpeg', 0.8);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById('addCat').addEventListener('click', function () { data.push({ ico: DEFAULT_ICO, vi: 'Lĩnh vực mới', en: 'New category', items: [] }); renderEditor(); });

/* ---------- output builders ---------- */
function buildOutput() {
  return data.map(function (cat) {
    return {
      ico: cat.ico || DEFAULT_ICO, vi: cat.vi || '', en: cat.en || '',
      items: (cat.items || []).map(function (p) {
        var image = p._file ? 'data/images/' + p._file.filename : (p.image || '');
        return { vi: p.vi || '', en: p.en || '', year: p.year || '', plc: p.plc || '', protocol: p.protocol || '', vi_desc: p.vi_desc || '', en_desc: p.en_desc || '', image: image };
      })
    };
  });
}
var fileBlobs = function () { return data.flatMap(function (cat) { return (cat.items || []).filter(function (p) { return p._file; }).map(function (p) { return p._file; }); }); };
var dataJs = function () { return 'window.PROJECTS_DATA = ' + JSON.stringify(buildOutput(), null, 2) + ';'; };

/* ---------- save to folder (File System Access API) ---------- */
document.getElementById('saveFolder').addEventListener('click', async function () {
  if (!window.showDirectoryPicker) { showToast('Trình duyệt không hỗ trợ. Dùng Chrome/Edge, hoặc bấm "Tải dữ liệu về".'); return; }
  try {
    var dir = await window.showDirectoryPicker();
    var fh = await dir.getFileHandle('projects-data.js', { create: true });
    var w = await fh.createWritable(); await w.write(dataJs()); await w.close();
    var blobs = fileBlobs();
    if (blobs.length) {
      var imgDir = await dir.getDirectoryHandle('images', { create: true });
      for (var i = 0; i < blobs.length; i++) { var b = blobs[i]; var ifh = await imgDir.getFileHandle(b.filename, { create: true }); var iw = await ifh.createWritable(); await iw.write(b.blob); await iw.close(); }
    }
    showToast('✓ Đã ghi ' + (blobs.length ? blobs.length + ' ảnh + ' : '') + 'projects-data.js. Giờ commit + push GitHub!');
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    showToast('Lỗi: ' + (err && err.message || err));
  }
});

/* ---------- download fallback ---------- */
function download(filename, content, type) {
  var a = document.createElement('a');
  var blob = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain' });
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
}
document.getElementById('saveDownload').addEventListener('click', function () {
  download('projects-data.js', dataJs(), 'text/javascript');
  var blobs = fileBlobs();
  var i = 0;
  var next = function () { if (i < blobs.length) { var b = blobs[i++]; download(b.filename, b.blob, 'image/jpeg'); setTimeout(next, 350); } };
  setTimeout(next, 400);
  showToast('✓ Đang tải ' + (blobs.length + 1) + ' file. Bỏ vào thư mục data/ rồi commit GitHub.');
});
