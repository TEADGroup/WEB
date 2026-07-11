/* =====================================================================
   auth.js — CHUNG: helper auth Supabase (session / profile / avatar)
   ---------------------------------------------------------------------
   Nạp SAU: theme.js, i18n.js, supabase UMD, supabase-config.js.
   Phơi window.TEA.Auth.* cho login.js / profile.js / dashboard.js.
   Không chứa DOM riêng của trang — chỉ helper + chip renderer.
   ===================================================================== */
(function () {
  "use strict";
  var T = window.TEA = window.TEA || {};
  var Auth = T.Auth = T.Auth || {};

  /* SVG icon (theme toggle — dùng chung cho login/profile) */
  Auth.ICON_MOON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  Auth.ICON_SUN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

  /* avatar placeholder (user silhouette) — data URI, dùng khi chưa upload */
  var AVATAR_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 4-6 8-6s8 2 8 6'/%3E%3C/svg%3E";

  function configured() {
    return !!(window.supa && window.SUPABASE_URL && window.SUPABASE_ANON_KEY);
  }
  Auth.configured = configured;

  /* Hiện banner "chưa cấu hình" nếu cần. Trả true nếu CHƯA cấu hình. */
  Auth.showConfigBanner = function (el) {
    if (configured() || !el) return false;
    el.innerHTML = '<div class="auth-config-warn">Chưa cấu hình Supabase — xem <b>SETUP-AUTH.md</b> để bật đăng nhập.</div>';
    return true;
  };

  Auth.getSession = async function () {
    if (!configured()) return null;
    try {
      var r = await window.supa.auth.getSession();
      return r.data && r.data.session ? r.data.session : null;
    } catch (e) { return null; }
  };

  Auth.getCurrentUser = async function () {
    if (!configured()) return null;
    try {
      var r = await window.supa.auth.getUser();
      return r.data && r.data.user ? r.data.user : null;
    } catch (e) { return null; }
  };

  /* Lấy profile row (name, avatar_url) của user hiện tại. Trả object (có thể rỗng). */
  Auth.getProfile = async function () {
    var u = await Auth.getCurrentUser();
    if (!u) return { id: null, name: '', avatar_url: '' };
    try {
      var r = await window.supa.from('profiles').select('name, avatar_url').eq('id', u.id).maybeSingle();
      if (r.error || !r.data) return { id: u.id, name: '', avatar_url: '' };
      return r.data;
    } catch (e) { return { id: u.id, name: '', avatar_url: '' }; }
  };

  /*
     requireAuth(nextKey, loginUrl) — nếu không có session → redirect về loginUrl?next=<nextKey>.
     - dashboard gọi: requireAuth('dashboard', '../login.html')
     - profile gọi:   requireAuth('profile',   'login.html')
     Trả session nếu đã đăng nhập, hoặc null (đã redirect).
  */
  Auth.requireAuth = async function (nextKey, loginUrl) {
    var s = await Auth.getSession();
    if (!s) {
      var q = nextKey ? ('?next=' + encodeURIComponent(nextKey)) : '';
      window.location.replace((loginUrl || '../login.html') + q);
      return null;
    }
    return s;
  };

  Auth.signOut = async function (redirectUrl) {
    if (configured()) { try { await window.supa.auth.signOut(); } catch (e) {} }
    window.location.replace(redirectUrl || '../login.html');
  };

  /*
     uploadAvatar(file) — upsert avatars/{uid}/avatar, lấy public URL, cập nhật profiles.avatar_url.
     Trả URL (có cache-bust ?t= để trình duyệt tải lại ảnh mới).
  */
  Auth.uploadAvatar = async function (file) {
    var u = await Auth.getCurrentUser();
    if (!u) throw new Error('no-user');
    var path = u.id + '/avatar';
    var up = await window.supa.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (up.error) throw up.error;
    var url = window.supa.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    url = url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
    var upd = await window.supa.from('profiles').update({ avatar_url: url }).eq('id', u.id);
    if (upd.error) throw upd.error;
    return url;
  };

  /* updateProfile({name, ...}) — update row của user hiện tại. */
  Auth.updateProfile = async function (patch) {
    var u = await Auth.getCurrentUser();
    if (!u) throw new Error('no-user');
    var r = await window.supa.from('profiles').update(patch).eq('id', u.id);
    if (r.error) throw r.error;
    return r.data;
  };

  /*
     renderUserChip({imgEl, nameEl}) — điền avatar + tên vào chip ở header.
     - imgEl: <img> (luôn có src — placeholder nếu chưa có avatar)
     - nameEl: optional <span> (ẩn trên mobile, truyền null nếu không có)
     Trả { profile, user }.
  */
  Auth.renderUserChip = async function (opts) {
    opts = opts || {};
    var u = await Auth.getCurrentUser();
    var p = await Auth.getProfile();
    if (opts.imgEl) {
      opts.imgEl.src = (p && p.avatar_url) ? p.avatar_url : AVATAR_PLACEHOLDER;
    }
    if (opts.nameEl) {
      var name = (p && p.name) ? p.name : (u && u.email ? u.email : '');
      opts.nameEl.textContent = name;
    }
    return { profile: p, user: u };
  };

  /* Dịch lỗi Supabase Auth → text (gọi từ login.js/profile.js với lang hiện tại) */
  Auth.trError = function (err, L) {
    if (!err) return '';
    var m = (err.message || String(err)).toLowerCase();
    if (m.indexOf('invalid login credentials') >= 0) return L('errInvalidCreds');
    if (m.indexOf('already registered') >= 0) return L('errExists');
    if (m.indexOf('at least 6') >= 0 || m.indexOf('password should be') >= 0) return L('errPwShort');
    if (m.indexOf('email not confirmed') >= 0) return L('errNotConfirmed');
    if (m.indexOf('unable to validate') >= 0 || m.indexOf('invalid email') >= 0) return L('errEmail');
    if (m.indexOf('fetch') >= 0 || m.indexOf('network') >= 0) return L('errNetwork');
    return err.message || String(err);
  };
})();
