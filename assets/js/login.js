/* =====================================================================
   login.js — RIÊNG trang login.html
   ---------------------------------------------------------------------
   Tab Đăng nhập / Đăng ký. signUp / signInWithPassword qua Supabase.
   Thành công → redirect về ?next (dashboard | profile). Nạp SAU auth.js.
   ===================================================================== */
"use strict";
(function () {

  var I = {
    vi: {
      titleLogin:'Đăng nhập', titleRegister:'Tạo tài khoản',
      subLogin:'Vào dashboard giám sát nhà máy', subRegister:'Tạo tài khoản để truy cập dashboard',
      submitLogin:'Đăng nhập', submitRegister:'Đăng ký',
      footLogin:'Chưa có tài khoản?', footRegister:'Đã có tài khoản?',
      switchLogin:'Đăng ký', switchRegister:'Đăng nhập',
      errInvalidCreds:'Email hoặc mật khẩu không đúng.', errExists:'Email đã được đăng ký.',
      errPwShort:'Mật khẩu cần ít nhất 6 ký tự.', errNotConfirmed:'Email chưa được xác nhận — kiểm tra hộp thư.',
      errEmail:'Email không hợp lệ.', errNetwork:'Lỗi mạng — kiểm tra kết nối.',
      notConfigured:'Chưa cấu hình Supabase — xem SETUP-AUTH.md.',
      checkEmail:'Đã gửi email xác nhận — mở hộp thư để kích hoạt tài khoản.'
    },
    en: {
      titleLogin:'Sign in', titleRegister:'Create account',
      subLogin:'Open the factory monitoring dashboard', subRegister:'Create an account to access the dashboard',
      submitLogin:'Sign in', submitRegister:'Sign up',
      footLogin:'No account yet?', footRegister:'Already have an account?',
      switchLogin:'Sign up', switchRegister:'Sign in',
      errInvalidCreds:'Invalid email or password.', errExists:'Email already registered.',
      errPwShort:'Password must be at least 6 characters.', errNotConfirmed:'Email not confirmed — check your inbox.',
      errEmail:'Invalid email address.', errNetwork:'Network error — check your connection.',
      notConfigured:'Supabase not configured — see SETUP-AUTH.md.',
      checkEmail:'Confirmation email sent — open your inbox to activate the account.'
    }
  };

  var lang = TEA.getLang();
  function L(k){ return I[lang][k] || k; }

  /* ---------- elements ---------- */
  var tabLogin = document.getElementById('tabLogin');
  var tabRegister = document.getElementById('tabRegister');
  var nameField = document.getElementById('nameField');
  var regName = document.getElementById('regName');
  var emailIn = document.getElementById('emailIn');
  var pwIn = document.getElementById('pwIn');
  var pwToggle = document.getElementById('pwToggle');
  var pwIcon = document.getElementById('pwIcon');
  var errEl = document.getElementById('authErr');
  var submitBtn = document.getElementById('authSubmit');
  var titleEl = document.getElementById('authTitle');
  var subEl = document.getElementById('authSub');
  var footLabel = document.getElementById('footLabel');
  var authSwitch = document.getElementById('authSwitch');
  var warnEl = document.getElementById('authWarn');
  var langBtn = document.getElementById('langBtn');
  var themeBtn = document.getElementById('themeBtn');
  var toastEl = document.getElementById('toast');
  var toastTimer;

  var mode = 'login';   /* 'login' | 'register' */
  var busy = false;

  /* ---------- i18n ---------- */
  function setLang(l){
    lang = l;
    TEA.applyTranslations(l);
    TEA.setLangPref(l);
    langBtn.textContent = l === 'vi' ? 'EN' : 'VI';
    render();
  }

  /* ---------- mode ---------- */
  function setMode(m){
    mode = m;
    tabLogin.classList.toggle('active', m === 'login');
    tabRegister.classList.toggle('active', m === 'register');
    nameField.hidden = (m !== 'register');
    /* autocomplete password gợi ý đúng theo mode */
    pwIn.setAttribute('autocomplete', m === 'register' ? 'new-password' : 'current-password');
    render();
  }

  /* text phụ thuộc mode + lang */
  function render(){
    var k = mode === 'register' ? 'Register' : 'Login';
    titleEl.textContent = L('title' + k);
    subEl.textContent = L('sub' + k);
    submitBtn.textContent = L('submit' + k);
    footLabel.textContent = L('foot' + k);
    authSwitch.textContent = L('switch' + k);
  }

  /* ---------- password toggle ---------- */
  var ICON_EYE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  var ICON_EYEOFF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  pwToggle.addEventListener('click', function () {
    var show = pwIn.type === 'password';
    pwIn.type = show ? 'text' : 'password';
    pwToggle.innerHTML = show ? ICON_EYEOFF : ICON_EYE;
  });

  /* ---------- toast ---------- */
  function showToast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 3200);
  }

  /* ---------- submit ---------- */
  function redirectNext(){
    var nextKey = new URLSearchParams(location.search).get('next') || 'dashboard';
    var NEXT = { dashboard: 'dashboard/index.html', profile: 'profile.html' };
    window.location.replace(NEXT[nextKey] || NEXT.dashboard);
  }

  document.getElementById('authForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (busy) return;
    errEl.textContent = '';

    if (!TEA.Auth.configured()) { errEl.textContent = L('notConfigured'); return; }

    var email = emailIn.value.trim();
    var pw = pwIn.value;
    if (!email || !pw) { errEl.textContent = L('errInvalidCreds'); return; }
    if (mode === 'register' && pw.length < 6) { errEl.textContent = L('errPwShort'); return; }

    busy = true;
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    try {
      if (mode === 'register') {
        var name = regName.value.trim();
        var r = await window.supa.auth.signUp({ email: email, password: pw, options: { data: { name: name } } });
        if (r.error) { errEl.textContent = TEA.Auth.trError(r.error, L); return; }
        /* nếu bật "Confirm email" → không có session ngay */
        if (!r.data.session) { showToast(L('checkEmail')); return; }
        redirectNext();
      } else {
        var s = await window.supa.auth.signInWithPassword({ email: email, password: pw });
        if (s.error) { errEl.textContent = TEA.Auth.trError(s.error, L); return; }
        redirectNext();
      }
    } catch (err) {
      errEl.textContent = TEA.Auth.trError(err, L);
    } finally {
      busy = false;
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
    }
  });

  /* ---------- wiring ---------- */
  tabLogin.addEventListener('click', function () { setMode('login'); });
  tabRegister.addEventListener('click', function () { setMode('register'); });
  authSwitch.addEventListener('click', function () { setMode(mode === 'login' ? 'register' : 'login'); });
  langBtn.addEventListener('click', function () { setLang(lang === 'vi' ? 'en' : 'vi'); });

  /* ---------- init ---------- */
  TEA.initTheme({ btn: themeBtn, onTheme: function (t) { themeBtn.innerHTML = t === 'dark' ? TEA.Auth.ICON_MOON : TEA.Auth.ICON_SUN; } });
  TEA.Auth.showConfigBanner(warnEl);
  setLang(lang);
  setMode('login');
})();
