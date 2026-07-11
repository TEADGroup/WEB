/* =====================================================================
   theme.js — CHUNG: theme sáng/tối TỰ ĐỘNG theo giờ thực
   ---------------------------------------------------------------------
   Dùng cho mọi trang. Quy tắc:
     - Ban ngày (DAY_START..<DAY_END>, mặc định 6:00–18:00) = light, còn lại = dark.
     - Kiểm tra lại mỗi 60s → tự chuyển khi qua mốc 6h/18h ("theo thời gian thực").
     - Nút toggle (nếu có) = override thủ công CHO BUỔI HIỆN TẠI; tự huỷ khi sang
       buổi mới (lưu trong localStorage key "tea-override").
   Mỗi trang tự vẽ icon qua callback onTheme(theme) (index: SVG; admin/dash: emoji).
   Đổi DAY_START / DAY_END bên dưới để chỉnh giờ sáng/tối. Script thường (chạy được file://).
   ===================================================================== */
(function () {
  "use strict";
  var OVR = 'tea-override';                 // override thủ công: JSON {t:theme, p:period}
  var DAY_START = 6, DAY_END = 18;          // 6:00–<18:00 = sáng (light) — chỉnh ở đây

  function period(hour){ return (hour >= DAY_START && hour < DAY_END) ? 'day' : 'night'; }
  function themeByTime(){ return period(new Date().getHours()) === 'day' ? 'light' : 'dark'; }
  function readOVR(){ try { return JSON.parse(localStorage.getItem(OVR) || 'null'); } catch (e){ return null; } }

  // theme thực tế = override (còn hợp lệ trong buổi) HOẶC theo giờ
  function resolved(){
    var ov = readOVR(), p = period(new Date().getHours());
    if (ov && ov.p === p) return ov.t;              // override còn hiệu lực trong buổi này
    if (ov) localStorage.removeItem(OVR);            // qua buổi mới → bỏ override, theo giờ
    return themeByTime();
  }

  window.TEA = window.TEA || {};
  window.TEA.initTheme = function (opts){
    opts = opts || {};
    var btn = opts.btn, onTheme = opts.onTheme, last = null;
    function apply(theme){
      document.documentElement.setAttribute('data-theme', theme);
      if (typeof onTheme === 'function') onTheme(theme);
    }
    function sync(){ var t = resolved(); if (t !== last){ last = t; apply(t); } }   // chỉ apply khi đổi → tránh vẽ thỡa
    sync();                                  // áp dụng ngay khi load (theo giờ)
    setInterval(sync, 60000);                // mỗi 60s → tự chuyển qua mốc 6h/18h
    if (btn) btn.addEventListener('click', function (){   // toggle = override buổi hiện tại
      var now = resolved() === 'light' ? 'dark' : 'light';
      localStorage.setItem(OVR, JSON.stringify({ t: now, p: period(new Date().getHours()) }));
      last = now; apply(now);
    });
  };

  // Cho trang khác đọc theme hiện tại + giờ theme (vd. dashboard vẽ lại chart, test)
  window.TEA.theme = function (){ return document.documentElement.getAttribute('data-theme') || themeByTime(); };
  window.TEA.themeByTime = themeByTime;
})();
