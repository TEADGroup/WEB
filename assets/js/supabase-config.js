/* =====================================================================
   supabase-config.js — CHUNG: cấu hình Supabase
   ---------------------------------------------------------------------
   Điền URL + anon key của project Supabase của bạn (xem SETUP-AUTH.md).
   Anon key AN TOÀN để lộ client-side — bảo mật do RLS đảm nhiệm, KHÔNG phải
   bí mật key. File này nạp SAU script UMD Supabase (window.supabase) và
   phơi window.supa (client instance) cho auth.js / login.js / profile.js.
   ===================================================================== */
(function () {
  "use strict";

  // ⚠ ĐIỀN 2 GIÁ TRỊ NÀY (Supabase Dashboard → Project Settings → API):
  window.SUPABASE_URL = "https://xlokmskkjqgceytlvsfd.supabase.co";
  window.SUPABASE_ANON_KEY = "sb_publishable_tPO1MbkrHewYUt8hmSKtqA_INE4PbTb";

  window.TEA = window.TEA || {};
  window.TEA.supaReady = !!(window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY);

  if (window.TEA.supaReady) {
    // window.supabase = namespace UMD; window.supa = client instance
    window.supa = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  } else {
    console.warn(
      "[TEA] Supabase chưa cấu hình. Xem SETUP-AUTH.md — điền SUPABASE_URL + SUPABASE_ANON_KEY " +
      "vào assets/js/supabase-config.js, chạy supabase/schema.sql, tạo bucket 'avatars'."
    );
  }
})();
