/* =====================================================================
   theme.js — CHUNG: bật/tắt theme sáng/tối
   ---------------------------------------------------------------------
   Dùng cho mọi trang. Lưu trong localStorage key "tea-theme" (mặc định dark).
   Mỗi trang tự quyết định CÁCH vẽ icon qua callback onTheme(theme):
     - index.html    → onTheme đổi innerHTML của <svg> (ICON_MOON / ICON_SUN)
     - admin/dash    → onTheme đổi textContent ('🌙' / '☀️')
   Dùng script thường (không phải ES module) để chạy được trên file://.
   ===================================================================== */
(function () {
  "use strict";
  var KEY = 'tea-theme';

  function current() {
    return document.documentElement.getAttribute('data-theme') || localStorage.getItem(KEY) || 'dark';
  }

  window.TEA = window.TEA || {};
  window.TEA.initTheme = function (opts) {
    opts = opts || {};
    var btn = opts.btn;
    var onTheme = opts.onTheme;

    function apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(KEY, theme);
      if (typeof onTheme === 'function') onTheme(theme);
    }

    apply(current());                       // áp dụng ngay khi load
    if (btn) {
      btn.addEventListener('click', function () {
        apply(current() === 'dark' ? 'light' : 'dark');
      });
    }
  };

  // Cho phép trang khác đọc theme hiện tại (vd. dashboard cần vẽ lại chart)
  window.TEA.theme = current;
})();
