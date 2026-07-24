/* =====================================================================
   profile.js — RIÊNG trang profile.html
   ---------------------------------------------------------------------
   Hiển thị + sửa thông tin tài khoản: avatar (upload), tên, đổi mật khẩu.
   Nạp SAU auth.js. Gate: requireAuth('profile', 'login.html').
   ===================================================================== */
"use strict";
(function () {

  var I = {
    vi: {
      avatarOk:'Đã cập nhật ảnh đại diện.', avatarErr:'Lỗi tải ảnh lên.',
      saved:'Đã lưu tên.', saveErr:'Lỗi lưu tên.',
      pwShort:'Mật khẩu cần ít nhất 6 ký tự.', pwOk:'Đã đổi mật khẩu.', pwErr:'Lỗi đổi mật khẩu.'
    },
    en: {
      avatarOk:'Avatar updated.', avatarErr:'Upload failed.',
      saved:'Name saved.', saveErr:'Failed to save name.',
      pwShort:'Password must be at least 6 characters.', pwOk:'Password updated.', pwErr:'Failed to update password.'
    }
  };

  var lang = TEA.getLang();
  function L(k){ return I[lang][k] || k; }

  var avatarImg = document.getElementById('avatarImg');
  var avatarInput = document.getElementById('avatarInput');
  var nameIn = document.getElementById('nameIn');
  var emailDisplay = document.getElementById('emailDisplay');
  var saveBtn = document.getElementById('saveBtn');
  var signoutBtn = document.getElementById('signoutBtn');
  var pwIn = document.getElementById('pwIn');
  var updatePwBtn = document.getElementById('updatePwBtn');
  var warnEl = document.getElementById('profileWarn');
  var langBtn = document.getElementById('langBtn');
  var themeBtn = document.getElementById('themeBtn');
  var toastEl = document.getElementById('toast');
  var toastTimer;

  function setLang(l){
    lang = l;
    TEA.applyTranslations(l);
    TEA.setLangPref(l);
    langBtn.textContent = l === 'vi' ? 'EN' : 'VI';
  }

  function showToast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 3200);
  }

  /* ---------- init ---------- */
  TEA.initTheme({ btn: themeBtn, onTheme: function (t) { themeBtn.innerHTML = t === 'dark' ? TEA.Auth.ICON_MOON : TEA.Auth.ICON_SUN; } });
  TEA.Auth.showConfigBanner(warnEl);
  setLang(lang);

  (async function loadProfile(){
    var s = await TEA.Auth.requireAuth('profile', 'login.html');
    if (!s) return;             /* đã redirect về login */
    try {
      var r = await TEA.Auth.renderUserChip({ imgEl: avatarImg });
      nameIn.value = (r.profile && r.profile.name) || '';
      emailDisplay.textContent = (r.user && r.user.email) || '';
    } catch (e) { /* bỏ qua — để trang vẫn dùng được */ }
  })();

  /* ---------- avatar upload ---------- */
  avatarInput.addEventListener('change', async function () {
    var f = avatarInput.files[0];
    if (!f) return;
    try {
      var url = await TEA.Auth.uploadAvatar(f);
      avatarImg.src = url;
      showToast(L('avatarOk'));
    } catch (e) { showToast(L('avatarErr')); }
    avatarInput.value = '';     /* cho phép chọn lại cùng file */
  });

  /* ---------- save name ---------- */
  saveBtn.addEventListener('click', async function () {
    try {
      await TEA.Auth.updateProfile({ name: nameIn.value.trim() });
      showToast(L('saved'));
    } catch (e) { showToast(L('saveErr')); }
  });

  /* ---------- change password ---------- */
  updatePwBtn.addEventListener('click', async function () {
    var pw = pwIn.value;
    if (!pw) return;
    if (pw.length < 6) { showToast(L('pwShort')); return; }
    try {
      var r = await window.supa.auth.updateUser({ password: pw });
      if (r.error) throw r.error;
      pwIn.value = '';
      showToast(L('pwOk'));
    } catch (e) { showToast(L('pwErr')); }
  });

  /* ---------- sign out ---------- */
  signoutBtn.addEventListener('click', function () { TEA.Auth.signOut('login.html'); });

  langBtn.addEventListener('click', function () { setLang(lang === 'vi' ? 'en' : 'vi'); });
})();
