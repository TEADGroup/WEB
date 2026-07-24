/* =====================================================================
   i18n.js — CHUNG: song ngữ Việt/Anh qua data-vi / data-en
   ---------------------------------------------------------------------
   Quy ước: mỗi phần tử dịch mang data-vi="…" và data-en="…". Phần tử
   input/textarea dùng cặp data-ph-vi / data-ph-en cho placeholder.
   applyTranslations(lang) chỉ lo việc quét + gán text/placeholder.
   Mỗi trang có setLang() RIÊNG — gọi applyTranslations() trước, rồi làm
   phần re-render đặc thù (cây dự án / biểu đồ). Ngôn ngữ lưu "tea-lang".
   ===================================================================== */
(function () {
  "use strict";
  var KEY = 'tea-lang';

  window.TEA = window.TEA || {};

  // Quét toàn bộ phần tử có data-vi+data-en và gán textContent theo ngôn ngữ.
  // Quét placeholder cho các input/textarea có data-ph-vi.
  window.TEA.applyTranslations = function (lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-vi][data-en]').forEach(function (el) {
      var txt = el.getAttribute('data-' + lang);
      if (txt !== null) el.textContent = txt;
    });
    document.querySelectorAll('[data-ph-vi]').forEach(function (el) {
      el.placeholder = el.getAttribute('data-ph-' + lang) || '';
    });
  };

  window.TEA.getLang     = function () { return localStorage.getItem(KEY) || 'vi'; };
  window.TEA.setLangPref = function (lang) { localStorage.setItem(KEY, lang); };
})();
