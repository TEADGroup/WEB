/* =====================================================================
   main.js — RIÊNG trang chủ marketing (index.html)
   ---------------------------------------------------------------------
   9 module: theme · ngôn ngữ · menu mobile · nav-scroll · cây dự án ·
            reveal+counter · gallery tilt · form · khởi tạo.
   Phần chung (theme/i18n) gọi qua TEA.* từ theme.js / i18n.js.
   Cần nạp SAU: base.css/main.css, theme.js, i18n.js, data/projects-data.js.
   ===================================================================== */
"use strict";

/* ---------- 1. THEME (sáng / tối) — dùng TEA.initTheme chung ---------- */
var themeBtn   = document.getElementById('themeBtn');
var themeIcon  = document.getElementById('themeIcon');
var ICON_MOON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
var ICON_SUN  = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
TEA.initTheme({
  btn: themeBtn,
  onTheme: function (t) { themeIcon.innerHTML = t === 'dark' ? ICON_MOON : ICON_SUN; }
});

/* ---------- 2. NGÔN NGỮ (VI / EN) ---------- */
var currentLang = TEA.getLang();
var langLabel   = document.getElementById('langLabel');
function setLang(lang) {
  currentLang = lang;
  langLabel.textContent = lang === 'vi' ? 'EN' : 'VI';
  TEA.applyTranslations(lang);   // phần text/placeholder chung
  TEA.setLangPref(lang);
  renderTree();                  // re-render đặc thù trang chủ
}
document.getElementById('langBtn').addEventListener('click', function () { setLang(currentLang === 'vi' ? 'en' : 'vi'); });

/* ---------- 3. MOBILE MENU (có UX: đóng khi click ngoài / Escape / khoá scroll) ---------- */
var hamburger = document.getElementById('hamburger');
var navLinks  = document.getElementById('navLinks');
function openMenu()  { navLinks.classList.add('open');    hamburger.setAttribute('aria-expanded', 'true');  document.body.style.overflow = 'hidden'; }
function closeMenu() { navLinks.classList.remove('open'); hamburger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
function toggleMenu() { navLinks.classList.contains('open') ? closeMenu() : openMenu(); }
hamburger.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); });
// Bấm link → đóng (giữ behavior cũ)
navLinks.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
// Bấm ra ngoài menu/nav-actions → đóng
document.addEventListener('click', function (e) {
  if (!navLinks.classList.contains('open')) return;
  if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) closeMenu();
});
// Phím Escape → đóng
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

/* ---------- 4. NAV scroll + active + progress bar ---------- */
var nav        = document.getElementById('nav');
var sp         = document.getElementById('scrollProgress');
var sections   = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
var navAnchors = Array.prototype.slice.call(navLinks.querySelectorAll('a'));
var orbs       = document.querySelectorAll('.bg-orbs .orb');
var canHover   = window.matchMedia('(hover: hover)').matches;
function onScroll() {
  nav.classList.toggle('scrolled', window.scrollY > 30);
  var cur = '';
  sections.forEach(function (s) { if (window.scrollY >= s.offsetTop - 120) cur = s.id; });
  navAnchors.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + cur); });
  var h = document.documentElement;
  var pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  sp.style.width = pct + '%';
  // Parallax orbs (chỉ thiết bị có chuột) — --py được @keyframes float* dùng
  if (canHover && orbs.length >= 3) {
    var y = window.scrollY;
    orbs[0].style.setProperty('--py', (y * 0.12) + 'px');
    orbs[1].style.setProperty('--py', (y * -0.08) + 'px');
    orbs[2].style.setProperty('--py', (y * 0.05) + 'px');
  }
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- 5. DỰ ÁN (tree + hover-ảnh) — data từ data/projects-data.js ---------- */
var projects     = window.PROJECTS_DATA || [];
var treeEl       = document.getElementById('projectTree');
var treeImgTip   = document.getElementById('treeImgTip');
var canHoverTree = window.matchMedia('(hover: hover)').matches;
var expandedCats  = new Set();
var expandedProjs = new Set();
var CARET16 = '<span class="caret"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>';
var CARET14 = '<span class="caret"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>';

function renderTree() {
  treeEl.innerHTML = '';
  projects.forEach(function (cat, ci) {
    var node = document.createElement('div');
    node.className = 'tree-node' + (expandedCats.has(ci) ? ' expanded' : '');

    var toggle = document.createElement('button');
    toggle.className = 'tree-toggle';
    toggle.innerHTML =
      CARET16 +
      '<span class="cat-ico">' + cat.ico + '</span>' +
      '<span>' + cat[currentLang] + '</span>' +
      '<span class="count">' + cat.items.length + ' ' + (currentLang === 'vi' ? 'dự án' : 'projects') + '</span>';
    toggle.addEventListener('click', function () { node.classList.toggle('expanded'); node.classList.contains('expanded') ? expandedCats.add(ci) : expandedCats.delete(ci); });
    node.appendChild(toggle);

    var children = document.createElement('div');
    children.className = 'tree-children';
    cat.items.forEach(function (p, pi) {
      var key = ci + '-' + pi;
      var pNode = document.createElement('div');
      pNode.className = 'proj-node' + (expandedProjs.has(key) ? ' expanded' : '');

      var pToggle = document.createElement('button');
      pToggle.className = 'proj-toggle';
      var thumb = p.image ? '<img class="proj-thumb" src="' + p.image + '" alt="" referrerpolicy="no-referrer" onerror="this.remove()">' : '';
      pToggle.innerHTML =
        CARET14 + thumb +
        '<span>' + p[currentLang] + '</span>' +
        '<span class="year">' + p.year + '</span>';
      // Hover → ảnh nổi theo con trỏ (chỉ desktop)
      if (canHoverTree && p.image && treeImgTip) {
        pToggle.addEventListener('mouseenter', function () { treeImgTip.style.backgroundImage = "url('" + p.image + "')"; treeImgTip.classList.add('show'); });
        pToggle.addEventListener('mousemove', function (e) { treeImgTip.style.left = (e.clientX + 18) + 'px'; treeImgTip.style.top = (e.clientY + 18) + 'px'; });
        pToggle.addEventListener('mouseleave', function () { treeImgTip.classList.remove('show'); });
      }
      pToggle.addEventListener('click', function () { pNode.classList.toggle('expanded'); pNode.classList.contains('expanded') ? expandedProjs.add(key) : expandedProjs.delete(key); });
      pNode.appendChild(pToggle);

      var detail = document.createElement('div');
      detail.className = 'proj-detail';
      var lblProto = currentLang === 'vi' ? 'Giao thức' : 'Protocol';
      detail.innerHTML =
        '<div class="proj-detail-inner"><p>' + p[currentLang + '_desc'] + '</p>' +
        '<div class="tag-row"><span class="tag">PLC: <b>' + p.plc + '</b></span>' +
        '<span class="tag">' + lblProto + ': <b>' + p.protocol + '</b></span></div></div>';
      pNode.appendChild(detail);
      children.appendChild(pNode);
    });
    node.appendChild(children);
    treeEl.appendChild(node);
  });
}

document.getElementById('expandAll').addEventListener('click', function () {
  projects.forEach(function (cat, ci) { expandedCats.add(ci); cat.items.forEach(function (_, pi) { expandedProjs.add(ci + '-' + pi); }); });
  renderTree();
});
document.getElementById('collapseAll').addEventListener('click', function () { expandedCats.clear(); expandedProjs.clear(); renderTree(); });
renderTree();

/* ---------- 6. REVEAL + COUNTER ---------- */
var revealObs = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (!e.isIntersecting) return;
    var el = e.target;
    // Stagger: delay theo vị trí giữa các .reveal anh em → grid cascade
    if (el.parentElement) {
      var sibs = el.parentElement.querySelectorAll(':scope > .reveal');
      var idx = Array.prototype.indexOf.call(sibs, el);
      if (idx > 0) el.style.transitionDelay = Math.min(idx * 90, 540) + 'ms';
    }
    el.classList.add('visible');
    revealObs.unobserve(el);
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });

var counterObs = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (!e.isIntersecting) return;
    var el = e.target, target = +el.dataset.target, dur = 1600, start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      el.textContent = Math.floor(p * target).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(tick); else el.textContent = target.toLocaleString('en-US');
    }
    requestAnimationFrame(tick);
    counterObs.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.counter').forEach(function (el) { counterObs.observe(el); });

/* ---------- 7. GALLERY: hiệu ứng TILT 3D (chỉ thiết bị có chuột) ---------- */
if (window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.tilt').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(800px) rotateY(' + (x * 9) + 'deg) rotateX(' + (-y * 9) + 'deg) translateY(-6px)';
    });
    card.addEventListener('mouseleave', function () { card.style.transform = ''; });
  });
}

/* ---------- 8. FORM (client-side) ---------- */
var form    = document.getElementById('contactForm');
var formMsg = document.getElementById('formMsg');
var toast   = document.getElementById('toast');
form.addEventListener('submit', function (ev) {
  ev.preventDefault();
  var name = form.name.value.trim(), email = form.email.value.trim(), msg = form.msg.value.trim();
  var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !email || !msg) {
    formMsg.style.color = '#fb7185';
    formMsg.textContent = currentLang === 'vi' ? 'Vui lòng điền đầy đủ thông tin.' : 'Please fill in all fields.';
    return;
  }
  if (!emailOk) {
    formMsg.style.color = '#fb7185';
    formMsg.textContent = currentLang === 'vi' ? 'Email không hợp lệ.' : 'Invalid email address.';
    return;
  }
  formMsg.style.color = '';
  form.reset();
  showToast(currentLang === 'vi' ? '✓ Đã gửi! Chúng tôi sẽ liên hệ sớm.' : '✓ Sent! We will contact you soon.');
});
function showToast(text) {
  toast.textContent = text; toast.classList.add('show');
  setTimeout(function () { toast.classList.remove('show'); }, 3200);
}

/* ---------- 9. KHỞI TẠO NGÔN NGỮ ---------- */
setLang(currentLang);
