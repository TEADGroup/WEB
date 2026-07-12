/* =====================================================================
   dashboard.js — RIÊNG trang giám sát (dashboard/index.html)
   ---------------------------------------------------------------------
   Mô phỏng giám sát nhà máy real-time: KPI, biểu đồ canvas, lưới thiết bị,
   cảnh báo. Phần theme/i18n gọi TEA.* từ theme.js / i18n.js (nạp trước).
   ===================================================================== */
"use strict";

/* ===== AUTH GATE (Supabase) =====
   Dashboard bắt buộc đăng nhập. <main class="auth-pending"> ẩn nội dung cho đến
   khi auth xác nhận → tránh flash dữ liệu bảo vệ. IIFE bất đồng bộ, không block
   phần còn lại của script (chạy song song; nếu không session thì redirect đi). */
(async function () {
  try {
    var s = await TEA.Auth.requireAuth('dashboard', '../login.html');
    if (!s) return;                       /* đang redirect → giữ main ẩn */
    await TEA.Auth.renderUserChip({
      imgEl: document.getElementById('userAvatar'),
      nameEl: document.getElementById('userName')
    });
    var m = document.querySelector('main.auth-pending');
    if (m) m.classList.remove('auth-pending');
  } catch (e) { console.warn('[auth] gate error', e); }
})();
var signoutBtn = document.getElementById('signoutBtn');
if (signoutBtn) signoutBtn.addEventListener('click', function () { TEA.Auth.signOut('../login.html'); });

/* nhấn avatar → dropdown Thông tin / Đăng xuất (mọi viewport) */
var userChip = document.getElementById('userChip');
var userMenu = document.getElementById('userMenu');
var userMenuSignout = document.getElementById('userMenuSignout');
if (userChip && userMenu) {
  userChip.addEventListener('click', function (e) {
    e.preventDefault();
    userMenu.classList.toggle('open');
  });
  document.addEventListener('click', function (e) {   /* click ngoài → đóng menu */
    if (userMenu.classList.contains('open') &&
        !userMenu.contains(e.target) && !userChip.contains(e.target)) {
      userMenu.classList.remove('open');
    }
  });
}
if (userMenuSignout) userMenuSignout.addEventListener('click', function () { TEA.Auth.signOut('../login.html'); });

/* ===== palette / status ===== */
const COLORS = { accent:'#2563eb', accent2:'#8b5cf6', neon:'#22d3ee', amber:'#f59e0b', green:'#22c55e', red:'#ef4444', gray:'#94a3b8' };
/* icon SVG (theme toggle — thay emoji) */
const ICON_MOON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const ICON_SUN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
/* icon SVG cho KPI report (thay emoji) */
const ICO_THERMO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>';
const ICO_FLAME = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
const ICO_WARN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
const ICO_BAN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
const ICO_ZAP = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
const ICO_TREND = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>';
const STATUS = {
  running:{ vi:'Đang chạy', en:'Running' },
  idle:   { vi:'Chờ',       en:'Idle'    },
  warning:{ vi:'Cảnh báo',  en:'Warning' },
  fault:  { vi:'Sự cố',     en:'Fault'   },
  off:    { vi:'Tắt',       en:'Off'     },
};
const STATUS_COLOR = { running:COLORS.green, idle:COLORS.gray, warning:COLORS.amber, fault:COLORS.red, off:COLORS.gray };
const AMBIENT = 28, HIST = 60;
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const debounce = (fn,ms)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };

/* ===== model ===== */
const DEVICES = [
  { id:'INJ-01', vi:'Máy ép nhựa 1',   en:'Injection Molder 1', zone:'A', base:62 },
  { id:'INJ-02', vi:'Máy ép nhựa 2',   en:'Injection Molder 2', zone:'A', base:58 },
  { id:'CNC-01', vi:'Trung tâm CNC 1', en:'CNC Machining 1',    zone:'B', base:48 },
  { id:'CNC-02', vi:'Trung tâm CNC 2', en:'CNC Machining 2',    zone:'B', base:52 },
  { id:'ROB-01', vi:'Robot hàn',       en:'Welding Robot',      zone:'C', base:44 },
  { id:'ASM-01', vi:'Trạm lắp ráp',    en:'Assembly Station',   zone:'C', base:40 },
  { id:'CHL-01', vi:'Máy làm lạnh',    en:'Chiller Unit',       zone:'D', base:34 },
  { id:'AIR-01', vi:'Máy nén khí',     en:'Air Compressor',     zone:'D', base:38 },
];
DEVICES.forEach(d=>{
  d.on=true; d.temp=d.base; d.target=d.base; d.load=55+Math.random()*30; d.status='running';
  d.hist=Array.from({length:30},()=>d.base);
});
const ZONES = [
  { id:'A', vi:'Khu ép nhựa',  en:'Injection Zone', color:COLORS.accent },
  { id:'B', vi:'Khu gia công', en:'Machining Zone', color:COLORS.accent2 },
  { id:'C', vi:'Khu lắp ráp',  en:'Assembly Zone',  color:COLORS.neon },
  { id:'D', vi:'Khu tiện ích', en:'Utilities Zone', color:COLORS.amber },
];
const zoneHist = ZONES.map(()=>[]);
const powerHist = [];
let powerNow = 200, WARN = 76, FAULT = 86, paused = false, seeding = false;
const hiddenZones = new Set();

/* ===== i18n ===== */
let lang = TEA.getLang();
const I = {
  vi:{ live:'TRỰC TUYẾN', paused:'TẠM DỪNG', pause:'Tạm dừng', resume:'Tiếp tục', ack:'Xác nhận', noAlerts:'Chưa có sự kiện nào.' },
  en:{ live:'LIVE',       paused:'PAUSED',    pause:'Pause',     resume:'Resume',   ack:'Acknowledge', noAlerts:'No events yet.' }
};
const L = k => I[lang][k];
const Lname = d => lang==='vi' ? d.vi : d.en;
const Lstatus = s => lang==='vi' ? STATUS[s].vi : STATUS[s].en;

function setLang(l){
  lang = l;
  document.getElementById('langBtn').textContent = l==='vi' ? 'EN' : 'VI';
  TEA.applyTranslations(l);          // phần text/placeholder chung (từ i18n.js)
  TEA.setLangPref(l);
  updatePauseLabel();
  renderLegend();
  updateDeviceCards();
  renderAlerts();
  drawAll();
  if (reportOverlay && reportOverlay.open) renderReport();
}

/* ===== theme (dùng TEA.initTheme chung) ===== */
const themeBtn = document.getElementById('themeBtn');
// onTheme chạy cả khi TỰ CHUYỂN (theo giờ) lẫn bấm nút → vẽ lại chart + report theo màu mới
TEA.initTheme({ btn: themeBtn, onTheme: t => {
  themeBtn.innerHTML = t==='dark' ? ICON_MOON : ICON_SUN;
  if (typeof drawAll === 'function') drawAll();
  const ov = document.getElementById('reportOverlay');        // dùng getElementById (tránh TDZ với const reportOverlay)
  if (ov && ov.open && typeof renderReport === 'function') renderReport();
}});

/* ===== canvas helpers ===== */
function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function hexA(hex,a){ const h=hex.replace('#',''); const r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16); return `rgba(${r},${g},${b},${a})`; }
function prep(canvas){
  const dpr = window.devicePixelRatio||1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if(!w||!h) return null;
  if(canvas.width!==Math.round(w*dpr) || canvas.height!==Math.round(h*dpr)){ canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); }
  const ctx = canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
  return { ctx, w, h };
}
const TIP = document.getElementById('chartTip');

/* vẽ đường mượt qua các điểm (nối bằng quadratic curve qua điểm giữa) */
function smoothTrace(ctx, pts, skipMove){
  const n = pts.length;
  if(!skipMove) ctx.moveTo(pts[0][0], pts[0][1]);
  if(n < 3){ for(let i = skipMove ? 0 : 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]); return; }
  for(let i = 1; i < n - 1; i++){
    const xc = (pts[i][0] + pts[i+1][0]) / 2, yc = (pts[i][1] + pts[i+1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
  }
  ctx.quadraticCurveTo(pts[n-1][0], pts[n-1][1], pts[n-1][0], pts[n-1][1]);
}

function drawLine(canvas, series, opts){
  const c = prep(canvas); if(!c) return;
  const { ctx, w, h } = c;
  ctx.clearRect(0,0,w,h);
  const padL=38, padR=12, padT=10, padB=22, cw=w-padL-padR, ch=h-padT-padB;
  const cBorder = opts.gridColor || cssVar('--border')||'rgba(255,255,255,.1)', cMuted = opts.axisColor || cssVar('--text-muted')||'#9aa3b8';
  const min=opts.min, max=opts.max, N=opts.points, rows=4;
  ctx.strokeStyle=cBorder; ctx.fillStyle=cMuted; ctx.lineWidth=1; ctx.font='11px Inter,sans-serif';
  ctx.textAlign='right'; ctx.textBaseline='middle';
  for(let i=0;i<=rows;i++){ const y=padT+ch*i/rows; ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke(); const val=max-(max-min)*i/rows; ctx.fillText(opts.fmt?opts.fmt(val):Math.round(val), padL-6, y); }
  ctx.textAlign='center'; ctx.textBaseline='top';
  const xl=opts.xLabels, xlen=xl&&xl.length;
  for(let i=0;i<=6;i++){ const x=padL+cw*i/6; let label; if(xlen){ const li=Math.round(i*(xlen-1)/6); label=xl[li]||''; } else { const sec=Math.round(-N+N*i/6); label=sec===0?'now':sec+'s'; } ctx.fillText(label, x, h-padB+4); }
  const X=i=>padL+cw*(N<=1?0:i/(N-1));
  const Y=v=>padT+ch*(1-(v-min)/(max-min));
  series.forEach(s=>{
    if(s.show===false || s.data.length<1) return;
    const pts = s.data.map((v,i)=>[X(i),Y(v)]);
    if(opts.fill){
      const g=ctx.createLinearGradient(0,padT,0,h-padB);
      g.addColorStop(0, hexA(s.color,.35)); g.addColorStop(1, hexA(s.color,0));
      ctx.beginPath(); ctx.moveTo(pts[0][0],h-padB); ctx.lineTo(pts[0][0],pts[0][1]); smoothTrace(ctx,pts,true); ctx.lineTo(pts[pts.length-1][0],h-padB); ctx.closePath(); ctx.fillStyle=g; ctx.fill();
    }
    ctx.beginPath(); smoothTrace(ctx,pts,false); ctx.strokeStyle=s.color; ctx.lineWidth=2; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.stroke();
    const last=s.data[s.data.length-1];
    ctx.beginPath(); ctx.fillStyle=s.color; ctx.arc(X(s.data.length-1),Y(last),3,0,Math.PI*2); ctx.fill();
  });
  canvas._plot = { padL, cw, N };
  /* hover: đường dọc + tooltip giá trị tại thời điểm con trỏ */
  if(canvas._hover){
    const hv = canvas._hover;
    const vis = series.filter(s=>s.show!==false);
    const minLen = vis.length ? Math.min(...vis.map(s=>s.data.length)) : 0;
    if(minLen > 0){
      let idx = Math.round(((hv.x - padL) / cw) * (N - 1)); idx = clamp(idx, 0, minLen - 1);
      const xv = X(idx);
      ctx.save(); ctx.strokeStyle = cMuted; ctx.setLineDash([3,3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xv, padT); ctx.lineTo(xv, h-padB); ctx.stroke(); ctx.restore();
      const tipRows = [];
      vis.forEach(s=>{
        if(idx >= s.data.length) return;
        const v = s.data[idx];
        ctx.beginPath(); ctx.fillStyle = s.color; ctx.arc(xv, Y(v), 3.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.arc(xv, Y(v), 3.5, 0, Math.PI*2); ctx.stroke();
        tipRows.push('<span class="tip-row"><span class="tip-dot" style="background:'+s.color+'"></span><span class="tip-name">'+(s.name||'')+'</span><b>'+(opts.fmt?opts.fmt(v):Math.round(v))+' '+opts.unit+'</b></span>');
      });
      if(TIP && tipRows.length){
        const tlabel = opts.tipTime ? opts.tipTime(idx) : (function(){ const sec=N-1-idx; return sec<=0?(lang==='vi'?'Hiện tại':'Now'):'-'+sec+'s'; })();
        TIP.innerHTML = '<div class="tip-title">'+(opts.tipTitle||'')+' · '+tlabel+'</div>' + tipRows.join('');
        TIP.style.display = 'block';
        const tw = TIP.offsetWidth, th = TIP.offsetHeight;
        let lx = hv.cx + 14, ly = hv.cy + 14;
        if(lx + tw > window.innerWidth - 8) lx = hv.cx - tw - 14;
        if(ly + th > window.innerHeight - 8) ly = hv.cy - th - 14;
        TIP.style.left = lx + 'px'; TIP.style.top = ly + 'px';
      }
    }
  }
}
function drawSpark(canvas, data, color){
  const c = prep(canvas); if(!c) return;
  const { ctx, w, h } = c; ctx.clearRect(0,0,w,h);
  if(data.length<2) return;
  let mn=Math.min(...data), mx=Math.max(...data); if(mx-mn<1){ mn-=1; mx+=1; } const pad=(mx-mn)*.15; mn-=pad; mx+=pad;
  const X=i=>w*i/(data.length-1), Y=v=>h-2-(h-4)*(v-mn)/(mx-mn);
  const pts = data.map((v,i)=>[X(i),Y(v)]);
  const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,hexA(color,.4)); g.addColorStop(1,hexA(color,0));
  ctx.beginPath(); ctx.moveTo(0,h); ctx.lineTo(pts[0][0],pts[0][1]); smoothTrace(ctx,pts,true); ctx.lineTo(w,h); ctx.closePath(); ctx.fillStyle=g; ctx.fill();
  ctx.beginPath(); smoothTrace(ctx,pts,false); ctx.strokeStyle=color; ctx.lineWidth=1.6; ctx.lineJoin='round'; ctx.stroke();
}
function drawAll(){
  const cT = document.getElementById('chartTemp');
  cT._redraw = ()=>{
    const series = ZONES.map((z,i)=>({ color:z.color, show:!hiddenZones.has(z.id), data:zoneHist[i], name: lang==='vi'?z.vi:z.en }));
    drawLine(cT, series, { min:20, max:100, points:HIST, fill:false, unit:'°C', tipTitle: lang==='vi'?'Nhiệt độ':'Temperature' });
  };
  const cP = document.getElementById('chartPower');
  cP._redraw = ()=>{
    const pmin=Math.min(...powerHist), pmax=Math.max(...powerHist), pad=Math.max(8,(pmax-pmin)*.2);
    drawLine(cP, [{ color:COLORS.neon, data:powerHist, name: lang==='vi'?'Công suất':'Power' }], { min:Math.floor(pmin-pad), max:Math.ceil(pmax+pad), points:HIST, fill:true, fmt:v=>Math.round(v), unit:'kW', tipTitle: lang==='vi'?'Công suất':'Power' });
  };
  cT._redraw(); cP._redraw();
  const pn = document.getElementById('powNow'); if(pn) pn.textContent = Math.round(powerNow)+' kW';
  DEVICES.forEach(d=>{ if(d._els && d._els.spark) drawSpark(d._els.spark, d.hist, STATUS_COLOR[d.status]); });
}

/* hover tooltip cho chart: khi rê con trỏ, vẽ đường dọc + hiện bảng giá trị tại thời điểm đó */
function setupHover(canvas){
  canvas.addEventListener('mousemove', e=>{
    const r = canvas.getBoundingClientRect();
    canvas._hover = { x: e.clientX - r.left, cx: e.clientX, cy: e.clientY };
    if(canvas._redraw) canvas._redraw();
  });
  canvas.addEventListener('mouseleave', ()=>{ canvas._hover = null; if(TIP) TIP.style.display='none'; if(canvas._redraw) canvas._redraw(); });
}

/* ===== device grid ===== */
function buildDeviceGrid(){
  const wrap = document.getElementById('deviceGrid'); wrap.innerHTML='';
  DEVICES.forEach(d=>{
    const card = document.createElement('div'); card.className='dev glass';
    card.innerHTML =
      '<div class="dev-top"><div><div class="dev-id">'+d.id+'</div><div class="dev-name" data-name></div></div>'+
      '<span class="pill" data-pill><span data-stx></span></span></div>'+
      '<canvas class="spark" data-spark></canvas>'+
      '<div class="dev-bot"><div class="dev-metric"><b data-temp>--</b><small>°C</small></div>'+
      '<div class="dev-metric"><b data-load>--</b><small data-vi="Tải" data-en="Load">Tải</small></div>'+
      '<div class="dev-metric spacer"><button class="switch on" data-sw role="switch" aria-checked="true" aria-label="On/Off"></button></div></div>';
    wrap.appendChild(card);
    d._els = {
      card, name:card.querySelector('[data-name]'), temp:card.querySelector('[data-temp]'),
      load:card.querySelector('[data-load]'), stx:card.querySelector('[data-stx]'),
      pill:card.querySelector('[data-pill]'), sw:card.querySelector('[data-sw]'), spark:card.querySelector('[data-spark]')
    };
    d._els.sw.addEventListener('click', ()=>{ d.on=!d.on; if(d.on){ d.target=d.base; } updateDeviceCards(); });
  });
}
function updateDeviceCards(){
  DEVICES.forEach(d=>{
    const e=d._els; if(!e) return;
    e.name.textContent = Lname(d);
    e.temp.textContent = Math.round(d.temp);
    e.load.textContent = Math.round(d.load);
    e.stx.textContent = Lstatus(d.status);
    e.pill.setAttribute('data-status', d.status);
    e.sw.classList.toggle('on', d.on);
    e.sw.setAttribute('aria-checked', d.on?'true':'false');
    e.card.classList.toggle('is-off', !d.on);
  });
}

/* ===== legend ===== */
function renderLegend(){
  const wrap = document.getElementById('legend'); wrap.innerHTML='';
  ZONES.forEach(z=>{
    const chip = document.createElement('button');
    chip.className = 'lg-chip' + (hiddenZones.has(z.id)?' off':'');
    chip.innerHTML = '<span class="lg-dot" style="background:'+z.color+'"></span>'+(lang==='vi'?z.vi:z.en);
    chip.addEventListener('click', ()=>{ hiddenZones.has(z.id) ? hiddenZones.delete(z.id) : hiddenZones.add(z.id); renderLegend(); drawAll(); });
    wrap.appendChild(chip);
  });
}

/* ===== alerts ===== */
const alerts = [];
let alertsDirty = false, alertFilter = 'all';
function pushAlert(d, prev){
  if(seeding) return;
  const name = Lname(d);
  let vi, en, level;
  if(d.status==='fault'){ vi=name+' — sự cố, dừng khẩn cấp ('+Math.round(d.temp)+'°C)'; en=name+' — fault, emergency stop ('+Math.round(d.temp)+'°C)'; level='fault'; }
  else if(d.status==='warning'){ vi=name+' — vượt ngưỡng nhiệt ('+Math.round(d.temp)+'°C)'; en=name+' — over temperature ('+Math.round(d.temp)+'°C)'; level='warn'; }
  else if(d.status==='running' && prev!=='running' && prev!=='off'){ vi=name+' — đã phục hồi'; en=name+' — recovered'; level='ok'; }
  else return;
  alerts.unshift({ t:new Date(), vi, en, level, ack:false });
  if(alerts.length>40) alerts.pop();
  alertsDirty = true;
}
function renderAlerts(){
  alertsDirty = false;
  const list = document.getElementById('alertList');
  const shown = alerts.filter(a=> alertFilter==='unacked' ? !a.ack : true);
  if(!shown.length){ list.innerHTML = '<p class="no-alerts">'+L('noAlerts')+'</p>'; return; }
  list.innerHTML='';
  const pad = n=>String(n).padStart(2,'0');
  shown.forEach(a=>{
    const row = document.createElement('div');
    row.className = 'alert-row level-'+a.level + (a.ack?' acked':'');
    const ts = pad(a.t.getHours())+':'+pad(a.t.getMinutes())+':'+pad(a.t.getSeconds());
    const msg = lang==='vi' ? a.vi : a.en;
    row.innerHTML = '<span class="alert-time">'+ts+'</span><span class="alert-msg">'+msg+'</span>' + (a.ack ? '<span class="alert-ack">'+L('ack')+' ✓</span>' : '<button class="ack-btn">'+L('ack')+'</button>');
    if(!a.ack){ row.querySelector('.ack-btn').addEventListener('click', ()=>{ a.ack=true; alertsDirty=true; renderAlerts(); updateKPIs(); }); }
    list.appendChild(row);
  });
}

/* ===== sim ===== */
function zoneTempOf(z){ const ds=DEVICES.filter(d=>d.zone===z.id && d.on); if(!ds.length) return AMBIENT; return ds.reduce((s,d)=>s+d.temp,0)/ds.length; }
function computePower(){ const on=DEVICES.filter(d=>d.on); const loadSum=on.reduce((s,d)=>s+d.load,0); return 60 + loadSum*0.35; }
function advance(){
  DEVICES.forEach(d=>{
    if(!d.on){
      d.status='off'; d.temp += (AMBIENT-d.temp)*0.06; d.load*=0.82; if(d.load<0.5) d.load=0;
    } else {
      if(Math.random()<0.05) d.target = d.base + (Math.random()-0.5)*22;
      d.temp += (d.target-d.temp)*0.10 + (Math.random()-0.5)*2.2; d.temp = clamp(d.temp,15,115);
      d.load += (Math.random()-0.5)*9; d.load = clamp(d.load,4,100);
      const prev = d.status;
      if(d.temp>FAULT) d.status='fault';
      else if(d.temp>WARN) d.status='warning';
      else if(d.load<14) d.status='idle';
      else d.status='running';
      if(d.status!==prev) pushAlert(d, prev);
    }
    d.hist.push(d.temp); if(d.hist.length>30) d.hist.shift();
  });
  ZONES.forEach((z,i)=>{ zoneHist[i].push(zoneTempOf(z)); if(zoneHist[i].length>HIST) zoneHist[i].shift(); });
  const tgt = computePower();
  powerNow += (tgt-powerNow)*0.2 + (Math.random()-0.5)*5; powerNow = clamp(powerNow,80,420);
  powerHist.push(powerNow); if(powerHist.length>HIST) powerHist.shift();
}

/* ===== KPI ===== */
function setKpi(id, val){
  const el = document.getElementById(id);
  const s = String(val);
  if(el.textContent!==s){ el.textContent=s; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
}
function updateKPIs(){
  const on = DEVICES.filter(d=>d.on);
  const run = on.filter(d=>d.status==='running').length;
  const avg = on.length ? on.reduce((s,d)=>s+d.temp,0)/on.length : 0;
  const oee = on.length ? (run/on.length)*100*0.92 : 0;
  const unack = alerts.filter(a=>!a.ack).length;
  setKpi('kTemp', avg.toFixed(0));
  setKpi('kDev', run+'/'+DEVICES.length);
  setKpi('kPow', Math.round(powerNow));
  setKpi('kOee', oee.toFixed(0));
  setKpi('kAlert', unack);
}

/* ===== clock / pause ===== */
const clockEl = document.getElementById('clock');
function updateClock(now){ const p=n=>String(n).padStart(2,'0'); clockEl.textContent = p(now.getHours())+':'+p(now.getMinutes())+':'+p(now.getSeconds()); }
const pauseBtn = document.getElementById('pauseBtn'), pauseLbl = document.getElementById('pauseLbl'), liveWrap = document.getElementById('liveWrap'), liveText = document.getElementById('liveText');
function updatePauseLabel(){
  pauseLbl.textContent = paused ? L('resume') : L('pause');
  liveText.textContent = paused ? L('paused') : L('live');
  liveWrap.classList.toggle('paused', paused);
}
pauseBtn.addEventListener('click', ()=>{ paused=!paused; updatePauseLabel(); });

/* ===== controls ===== */
document.getElementById('warnIn').addEventListener('input', e=>{ const v=+e.target.value; if(!isNaN(v)) WARN=clamp(v,30,FAULT-1); });
document.getElementById('faultIn').addEventListener('input', e=>{ const v=+e.target.value; if(!isNaN(v)) FAULT=clamp(v,WARN+1,120); });
document.getElementById('startAll').addEventListener('click', ()=>{ DEVICES.forEach(d=>{ d.on=true; d.target=d.base; }); updateDeviceCards(); });
document.getElementById('stopAll').addEventListener('click', ()=>{ DEVICES.forEach(d=>{ d.on=false; }); updateDeviceCards(); });
document.getElementById('langBtn').addEventListener('click', ()=> setLang(lang==='vi'?'en':'vi'));
document.getElementById('fAll').addEventListener('click', ()=>{ alertFilter='all'; syncFilters(); renderAlerts(); });
document.getElementById('fUnack').addEventListener('click', ()=>{ alertFilter='unacked'; syncFilters(); renderAlerts(); });
function syncFilters(){ document.getElementById('fAll').classList.toggle('active', alertFilter==='all'); document.getElementById('fUnack').classList.toggle('active', alertFilter==='unacked'); }

/* ===== reveal ===== */
const revealObs = new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); revealObs.unobserve(e.target); } }); }, { threshold:0.12 });
document.querySelectorAll('.reveal').forEach(el=>revealObs.observe(el));

/* ===== main loop ===== */
function tick(){
  const now = new Date();
  updateClock(now);
  if(paused) return;
  advance();
  persistDevices();   // ghi 8 rows vào Supabase mỗi giây (fire-and-forget)
  updateKPIs();
  updateDeviceCards();
  if(alertsDirty) renderAlerts();
  drawAll();
}

/* ===== init ===== */

/* ===== REPORT (xuất báo cáo theo ngày / khoảng tuỳ chỉnh) ===== */
/* Dữ liệu dashboard là mô phỏng, không có lịch sử ngày → sinh lịch sử giả định
   DETERMINISTIC theo mỗi timestamp (cùng thời điểm → cùng giá trị dù xem ở preset nào).
   Cùng khoảng → cùng báo cáo. Xem mandatory-workflow / animation-system cho rule. */
const reportOverlay = document.getElementById('reportOverlay');
const toastEl = document.getElementById('toast');
const reportCache = { start:null, end:null, data:null, preset:'today' };
let printMode = false;

const IR = {
  vi:{ close:'Đóng', avgTemp:'Nhiệt độ TB', maxTemp:'Nhiệt độ cao nhất', totWarn:'Cảnh báo', faults:'Sự cố', avgPow:'Công suất TB', oee:'Hiệu suất (OEE)',
       thDevice:'Thiết bị', thZone:'Khu vực', thTime:'Thời điểm', thPeak:'Đỉnh (°C)', thLevel:'Mức', thDur:'Thời lượng',
       thAvg:'TB (°C)', thMax:'Max (°C)', thWarn:'Cảnh báo', thFault:'Sự cố', thStatus:'Trạng thái',
       lvlWarn:'Cảnh báo', lvlFault:'Sự cố', noWarn:'Không có cảnh báo nhiệt độ trong kỳ này.',
       invalidRange:'Khoảng ngày không hợp lệ.', csvDone:'✓ Đã tải file CSV.', printStart:'Đang chuẩn bị báo cáo in…',
       colTime:'Thời gian', colPower:'Công suất (kW)', plantAvg:'TB nhà máy',
       csvTitle:'Báo cáo nhiệt độ nhà máy', periodLbl:'Kỳ báo cáo', genLbl:'Sinh lúc',
       warnTh:'Ngưỡng cảnh báo (°C)', faultTh:'Ngưỡng sự cố (°C)', metric:'Chỉ số', value:'Giá trị',
       secSummary:'TÓM TẮT', secTempTrend:'XU HƯỚNG NHIỆT ĐỘ (°C)', secPowerTrend:'XU HƯỚNG CÔNG SUẤT (kW)',
       secWarn:'CẢNH BÁO NHIỆT ĐỘ', secDev:'TÓM TẮT THEO THIẾT BỊ', xlsxDone:'✓ Đã tải file Excel.' },
  en:{ close:'Close', avgTemp:'Avg temp', maxTemp:'Max temp', totWarn:'Warnings', faults:'Faults', avgPow:'Avg power', oee:'Efficiency (OEE)',
       thDevice:'Device', thZone:'Zone', thTime:'Time', thPeak:'Peak (°C)', thLevel:'Level', thDur:'Duration',
       thAvg:'Avg (°C)', thMax:'Max (°C)', thWarn:'Warn', thFault:'Fault', thStatus:'Status',
       lvlWarn:'Warning', lvlFault:'Fault', noWarn:'No temperature warnings in this period.',
       invalidRange:'Invalid date range.', csvDone:'✓ CSV downloaded.', printStart:'Preparing print…',
       colTime:'Time', colPower:'Power (kW)', plantAvg:'Plant avg',
       csvTitle:'Plant temperature report', periodLbl:'Period', genLbl:'Generated',
       warnTh:'Warning threshold (°C)', faultTh:'Fault threshold (°C)', metric:'Metric', value:'Value',
       secSummary:'SUMMARY', secTempTrend:'TEMPERATURE TREND (°C)', secPowerTrend:'POWER TREND (kW)',
       secWarn:'TEMPERATURE WARNINGS', secDev:'PER-DEVICE SUMMARY', xlsxDone:'✓ Excel downloaded.' }
};
const LR = k => IR[lang][k];

/* ---- RNG + hashing (deterministic per timestamp) ---- */
function hashStr(s){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

const DAYMS = 86400000;
function pickStep(spanDays){ if(spanDays<=2) return 3600000; if(spanDays<=14) return 21600000; return DAYMS; }

/* Bơm sự kiện nhiệt có chủ đích (ramp/dwell/decay) cho mỗi (thiết bị, ngày) → warning run liên tục. */
function buildWindows(startMs, endMs){
  const wins = {};
  const sd = new Date(startMs); sd.setHours(0,0,0,0);
  for(let dayMs=sd.getTime(); dayMs<=endMs; dayMs+=DAYMS){
    for(const d of DEVICES){
      const r = mulberry32(hashStr(d.id+'|day|'+dayMs));
      if(r() < 0.5){
        const startHour = 7 + Math.floor(r()*13);
        const durH = 2 + Math.floor(r()*4);
        const isFault = r() < 0.4;
        const targetPeak = isFault ? FAULT + 4 + r()*6 : WARN + 4 + r()*5;
        const mag = targetPeak - (d.base + 3);
        if(mag <= 0) continue;
        const sMs = dayMs + startHour*3600000, eMs = sMs + durH*3600000;
        (wins[d.id] = wins[d.id]||[]).push({ startMs:sMs, endMs:eMs, mag });
      }
    }
  }
  return wins;
}
function tempAt(d, tMs, wins){
  const r = mulberry32(hashStr(d.id+'|'+tMs));
  const dt = new Date(tMs);
  const hour = dt.getHours() + dt.getMinutes()/60;
  const wave = Math.sin((hour-14)/24*Math.PI*2) * 3;
  const noise = (r()*2-1)*1.5;
  let bump = 0;
  const dw = wins[d.id];
  if(dw) for(const w of dw){ if(tMs>=w.startMs && tMs<=w.endMs){ const p=(tMs-w.startMs)/((w.endMs-w.startMs)||1); bump += w.mag*Math.sin(p*Math.PI); } }
  return clamp(d.base + wave + noise + bump, 15, 115);
}

function generateReportData(startMs, endMs){
  const spanDays = Math.max(0.04, (endMs-startMs)/DAYMS);
  const step = pickStep(spanDays);
  const ts=[], xLabels=[], power=[];
  const temps={}; DEVICES.forEach(d=>temps[d.id]=[]);
  const zones={}; ZONES.forEach(z=>zones[z.id]=[]);
  const wins = buildWindows(startMs, endMs);
  for(let t=startMs; t<=endMs && ts.length<140; t+=step){
    ts.push(t); xLabels.push(fmtLabel(t, step, spanDays));
    let loadSum=0;
    DEVICES.forEach(d=>{
      let temp;
      if(step>=DAYMS){ // theo ngày → lấy đỉnh trong ngày (sub-sample 3 giờ/lần)
        const dd=new Date(t); const dayStart=new Date(dd.getFullYear(),dd.getMonth(),dd.getDate()).getTime();
        temp=-Infinity; for(let h=0;h<24;h+=3){ const v=tempAt(d, dayStart+h*3600000, wins); if(v>temp) temp=v; }
        if(temp===-Infinity) temp=d.base;
      } else { temp=tempAt(d, t, wins); }
      temps[d.id].push(temp);
      loadSum += clamp(45 + (temp-d.base)*2.2, 5, 100);
    });
    ZONES.forEach(z=>{ const ds=DEVICES.filter(d=>d.zone===z.id); const zt=ds.length?ds.reduce((s,d)=>s+temps[d.id][temps[d.id].length-1],0)/ds.length:AMBIENT; zones[z.id].push(zt); });
    power.push(60 + loadSum*0.35);
  }
  const plantAvg = ts.map((_,i)=> DEVICES.reduce((s,d)=>s+temps[d.id][i],0)/DEVICES.length);
  const events = detectWarnings(ts, temps, step);
  // KPI
  const allTemps = [].concat(...DEVICES.map(d=>temps[d.id]));
  const avgTemp = allTemps.reduce((s,v)=>s+v,0)/allTemps.length;
  let maxTemp=-Infinity, peakDev=DEVICES[0];
  DEVICES.forEach(d=> temps[d.id].forEach((v,i)=>{ if(v>maxTemp){ maxTemp=v; peakDev=d; } }));
  const faults = events.filter(e=>e.level==='fault').length;
  const avgPow = power.reduce((s,v)=>s+v,0)/power.length;
  let oeeAcc=0; for(let i=0;i<ts.length;i++){ let runN=0; DEVICES.forEach(d=>{ if(temps[d.id][i]<=WARN) runN++; }); oeeAcc += runN/DEVICES.length; }
  const oee = ts.length ? (oeeAcc/ts.length)*100*0.92 : 0;
  // per-device
  const perDevice = DEVICES.map(d=>{
    const arr=temps[d.id]; const avg=arr.reduce((s,v)=>s+v,0)/arr.length; const mx=Math.max(...arr);
    const evs=events.filter(e=>e.device.id===d.id);
    const wc=evs.filter(e=>e.level==='warn').length, fc=evs.filter(e=>e.level==='fault').length;
    return { device:d, avg, max:mx, warnCount:wc, faultCount:fc, status: fc>0?'fault':(wc>0?'warning':'running') };
  });
  const pmin=Math.min(...power), pmax=Math.max(...power), ppad=Math.max(8,(pmax-pmin)*.2);
  return { ts, xLabels, temps, zones, plantAvg, power, events, perDevice,
           pmin:Math.floor(pmin-ppad), pmax:Math.ceil(pmax+ppad),
           kpis:{ avgTemp, maxTemp, peakDev, totWarn:events.length, faults, avgPow, oee } };
}

function detectWarnings(ts, temps, step){
  const events=[];
  DEVICES.forEach(d=>{
    const arr=temps[d.id]; let run=null;
    for(let i=0;i<arr.length;i++){
      const over = arr[i] > WARN;
      if(over && !run) run={ device:d, startIdx:i, peak:arr[i], anyFault:arr[i]>FAULT };
      else if(over){ if(arr[i]>run.peak) run.peak=arr[i]; if(arr[i]>FAULT) run.anyFault=true; }
      else if(run){ events.push(finishRun(run, ts, step)); run=null; }
    }
    if(run) events.push(finishRun(run, ts, step));
  });
  events.sort((a,b)=> a.start-b.start);
  return events;
}
function finishRun(run, ts, step){
  return { device:run.device, zone:run.device.zone, start:ts[run.startIdx], end:ts[run.endIdx||run.startIdx],
           peak:run.peak, level: run.anyFault?'fault':'warn', duration: (ts[run.endIdx||run.startIdx]-ts[run.startIdx]) + step };
}

/* ---- formatters ---- */
const p2 = n=>String(n).padStart(2,'0');
function fmtLabel(t, step, spanDays){ const d=new Date(t); if(step>=DAYMS) return p2(d.getDate())+'/'+p2(d.getMonth()+1); if(spanDays<=1.5) return p2(d.getHours())+':00'; return p2(d.getDate())+'/'+p2(d.getMonth()+1)+' '+p2(d.getHours())+':00'; }
function fmtDateTime(t){ const d=new Date(t); return p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+d.getFullYear()+' '+p2(d.getHours())+':'+p2(d.getMinutes()); }
function fmtDate(t){ const d=new Date(t); return p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+d.getFullYear(); }
function fmtRange(a,b){ const sa=fmtDate(a), sb=fmtDate(b); return sa===sb?sa:(sa+' – '+sb); }
function fmtTip(t){ const d=new Date(t); return p2(d.getHours())+':00 '+p2(d.getDate())+'/'+p2(d.getMonth()+1); }
function fmtDuration(ms){ const m=Math.round(ms/60000); if(m<60) return m+(lang==='vi'?'p':'m'); return Math.floor(m/60)+'h '+(m%60)+(lang==='vi'?'p':'m'); }
function toInputDate(dt){ return dt.getFullYear()+'-'+p2(dt.getMonth()+1)+'-'+p2(dt.getDate()); }
function parseInputDate(s){ const p=s.split('-').map(Number); if(!p[0]) return null; return new Date(p[0], p[1]-1, p[2]); }

/* ---- render ---- */
function kpiTile(ico, val, sub, labelKey){ return '<div class="kpi glass"><div class="kpi-ico">'+ico+'</div><div class="kpi-num">'+val+(sub?'<small>'+sub+'</small>':'')+'</div><div class="kpi-label">'+LR(labelKey)+'</div></div>'; }
function renderReportKPIs(data){
  const k=data.kpis;
  document.getElementById('rptKpi').innerHTML =
    kpiTile(ICO_THERMO, k.avgTemp.toFixed(0), '°C', 'avgTemp') +
    kpiTile(ICO_FLAME, k.maxTemp.toFixed(0), '°C · '+Lname(k.peakDev), 'maxTemp') +
    kpiTile(ICO_WARN, k.totWarn, '', 'totWarn') +
    kpiTile(ICO_BAN, k.faults, '', 'faults') +
    kpiTile(ICO_ZAP, Math.round(k.avgPow), 'kW', 'avgPow') +
    kpiTile(ICO_TREND, k.oee.toFixed(0), '%', 'oee');
}
function renderReportLegend(){
  const wrap=document.getElementById('rptLegend'); wrap.innerHTML='';
  ZONES.forEach(z=>{ const c=document.createElement('span'); c.className='lg-chip'; c.innerHTML='<span class="lg-dot" style="background:'+z.color+'"></span>'+(lang==='vi'?z.vi:z.en); wrap.appendChild(c); });
  const c=document.createElement('span'); c.className='lg-chip'; c.innerHTML='<span class="lg-dot" style="background:'+COLORS.neon+'"></span>'+LR('plantAvg'); wrap.appendChild(c);
}
function renderWarnTable(data){
  const tbl=document.getElementById('rptWarnTable');
  if(!data.events.length){ tbl.innerHTML='<tbody><tr><td class="rpt-empty">'+LR('noWarn')+'</td></tr></tbody>'; return; }
  let h='<thead><tr><th>'+LR('thDevice')+'</th><th>'+LR('thZone')+'</th><th>'+LR('thTime')+'</th><th class="num">'+LR('thPeak')+'</th><th>'+LR('thLevel')+'</th><th class="num">'+LR('thDur')+'</th></tr></thead><tbody>';
  data.events.forEach(e=>{ h+='<tr class="rpt-warn-row '+(e.level==='fault'?'fault':'')+'"><td>'+e.device.id+'</td><td>'+e.zone+'</td><td>'+fmtDateTime(e.start)+'</td><td class="num">'+e.peak.toFixed(0)+'</td><td><span class="rpt-tag '+e.level+'">'+LR(e.level==='fault'?'lvlFault':'lvlWarn')+'</span></td><td class="num">'+fmtDuration(e.duration)+'</td></tr>'; });
  tbl.innerHTML=h+'</tbody>';
}
function renderDeviceTable(data){
  const tbl=document.getElementById('rptDevTable');
  let h='<thead><tr><th>'+LR('thDevice')+'</th><th>'+LR('thZone')+'</th><th class="num">'+LR('thAvg')+'</th><th class="num">'+LR('thMax')+'</th><th class="num">'+LR('thWarn')+'</th><th class="num">'+LR('thFault')+'</th><th>'+LR('thStatus')+'</th></tr></thead><tbody>';
  data.perDevice.forEach(p=>{ h+='<tr><td>'+p.device.id+' <small style="color:var(--text-muted)">'+Lname(p.device)+'</small></td><td>'+p.device.zone+'</td><td class="num">'+p.avg.toFixed(0)+'</td><td class="num">'+p.max.toFixed(0)+'</td><td class="num">'+p.warnCount+'</td><td class="num">'+p.faultCount+'</td><td><span class="pill" data-status="'+p.status+'"><span>'+Lstatus(p.status)+'</span></span></td></tr>'; });
  tbl.innerHTML=h+'</tbody>';
}
function renderReportHeader(data){
  document.getElementById('rptPeriod').textContent = fmtRange(reportCache.start, reportCache.end);
  document.getElementById('rptGenAt').textContent = fmtDateTime(new Date());
}
function renderReport(){
  const data=reportCache.data; if(!data) return;
  const grid = printMode ? 'rgba(0,0,0,.12)' : undefined;
  const axis = printMode ? '#5b6577' : undefined;
  const rT=document.getElementById('rptTemp'), rP=document.getElementById('rptPower');
  const zSeries = ZONES.map(z=>({ color:z.color, data:data.zones[z.id], name: lang==='vi'?z.vi:z.en }));
  zSeries.push({ color:COLORS.neon, data:data.plantAvg, name: LR('plantAvg') });
  rT._redraw = ()=> drawLine(rT, zSeries, { min:20, max:100, points:data.ts.length, unit:'°C', fill:false, gridColor:grid, axisColor:axis, xLabels:data.xLabels, tipTime:i=>fmtTip(data.ts[i]), tipTitle: lang==='vi'?'Nhiệt độ':'Temperature' });
  rP._redraw = ()=> drawLine(rP, [{ color:COLORS.accent2, data:data.power, name: lang==='vi'?'Công suất':'Power' }], { min:data.pmin, max:data.pmax, points:data.ts.length, unit:'kW', fill:true, fmt:v=>Math.round(v), gridColor:grid, axisColor:axis, xLabels:data.xLabels, tipTime:i=>fmtTip(data.ts[i]), tipTitle: lang==='vi'?'Công suất':'Power' });
  rT._redraw(); rP._redraw();
  renderReportLegend(); renderReportKPIs(data); renderWarnTable(data); renderDeviceTable(data); renderReportHeader(data);
  document.getElementById('rptClose').setAttribute('aria-label', LR('close'));
}

/* ---- range / open / close ---- */
function setReportPreset(preset){
  const now=new Date(); const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  let start, end;
  if(preset==='today'){ start=today; end=now; }
  else if(preset==='yesterday'){ start=new Date(today); start.setDate(start.getDate()-1); end=new Date(today); end.setMilliseconds(-1); }
  else if(preset==='7'){ start=new Date(today); start.setDate(start.getDate()-6); end=now; }
  else if(preset==='30'){ start=new Date(today); start.setDate(start.getDate()-29); end=now; }
  else return;
  document.getElementById('rptFrom').value=toInputDate(start); document.getElementById('rptTo').value=toInputDate(end);
  document.querySelectorAll('.rpt-preset').forEach(b=> b.classList.toggle('active', b.dataset.preset===String(preset)));
  reportCache.preset=preset; reportCache.start=start; reportCache.end=end;
  reportCache.data=generateReportData(start.getTime(), end.getTime());
  renderReport();
}
function applyCustomRange(){
  const fs=document.getElementById('rptFrom').value, ts=document.getElementById('rptTo').value;
  if(!fs||!ts){ showToast(LR('invalidRange')); return; }
  const start=parseInputDate(fs), end=parseInputDate(ts);
  if(!start||!end|| end<start){ showToast(LR('invalidRange')); return; }
  end.setHours(23,59,59,999);
  document.querySelectorAll('.rpt-preset').forEach(b=> b.classList.remove('active'));
  reportCache.preset='custom'; reportCache.start=start; reportCache.end=end;
  reportCache.data=generateReportData(start.getTime(), end.getTime());
  renderReport();
}
function openReport(){
  reportOverlay.showModal();
  document.body.classList.add('report-open');
  reportOverlay.appendChild(TIP);     // tip/toast phải nằm trong dialog (top-layer) mới thấy được
  reportOverlay.appendChild(toastEl);
  if(!reportCache.data) setReportPreset('today'); else renderReport();
}
reportOverlay.addEventListener('close', ()=>{
  document.body.classList.remove('report-open');
  document.body.appendChild(TIP); document.body.appendChild(toastEl);
  const b=document.getElementById('reportBtn'); if(b) b.focus();
});

/* ---- export CSV ---- */
function escCell(v){ const s=String(v); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }
function download(filename, content, type){
  const a=document.createElement('a');
  const blob = content instanceof Blob ? content : new Blob([content], { type: type||'text/plain' });
  a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
}
/* ===== reportRows: dữ liệu báo cáo dạng mảng 2D — DÙNG CHUNG cho CSV + Excel (DRY).
   Tái dựng y hệt bố cục đang show: FORM (đầu + 6 KPI + 2 bảng) + CHART (dữ liệu trend THEO THỜI GIAN
   — nhiệt các khu vực + TB nhà máy, công suất) để vận hành theo dõi. Đổi ở đây → bump ?v= ở HTML. ===== */
function reportRows(){
  const d=reportCache.data, k=d.kpis, R=[], row=(...c)=>R.push(c);   // R = mảng dòng, mỗi dòng = mảng ô
  const sec=t=>{ R.push([]); row(t); };                              // tiêu đề section (luôn cách 1 dòng)
  // FORM — đầu báo cáo (tiêu đề / kỳ / lúc sinh / ngưỡng)
  row(LR('csvTitle'));
  row(LR('periodLbl'), fmtRange(reportCache.start, reportCache.end));
  row(LR('genLbl'), fmtDateTime(new Date()));
  row(LR('warnTh'), WARN); row(LR('faultTh'), FAULT);
  // FORM — 6 KPI (đúng như 6 ô trên màn hình)
  sec(LR('secSummary')); row(LR('metric'), LR('value'));
  row(LR('avgTemp'), k.avgTemp.toFixed(0)+' °C');
  row(LR('maxTemp'), k.maxTemp.toFixed(0)+' °C ('+Lname(k.peakDev)+')');
  row(LR('totWarn'), k.totWarn); row(LR('faults'), k.faults);
  row(LR('avgPow'), Math.round(k.avgPow)+' kW'); row(LR('oee'), k.oee.toFixed(0)+' %');
  // CHART (theo thời gian) — nhiệt các khu vực + TB nhà máy  ← để vận hành theo dõi
  sec(LR('secTempTrend')); row(LR('colTime'), ...ZONES.map(Lname), LR('plantAvg'));
  d.ts.forEach((t,i)=> row(fmtDateTime(t), ...ZONES.map(z=>d.zones[z.id][i].toFixed(1)), d.plantAvg[i].toFixed(1)));
  // CHART (theo thời gian) — công suất
  sec(LR('secPowerTrend')); row(LR('colTime'), LR('colPower'));
  d.ts.forEach((t,i)=> row(fmtDateTime(t), d.power[i].toFixed(1)));
  // FORM — bảng cảnh báo nhiệt độ
  sec(LR('secWarn')); row(LR('thDevice'),LR('thZone'),LR('thTime'),LR('thPeak'),LR('thLevel'),LR('thDur'));
  if(!d.events.length) row(LR('noWarn'));
  else d.events.forEach(e=> row(e.device.id+' '+Lname(e.device), e.zone, fmtDateTime(e.start), e.peak.toFixed(0), LR(e.level==='fault'?'lvlFault':'lvlWarn'), fmtDuration(e.duration)));
  // FORM — bảng tóm tắt theo thiết bị
  sec(LR('secDev')); row(LR('thDevice'),LR('thZone'),LR('thAvg'),LR('thMax'),LR('thWarn'),LR('thFault'),LR('thStatus'));
  d.perDevice.forEach(p=> row(p.device.id+' '+Lname(p.device), p.device.zone, p.avg.toFixed(0), p.max.toFixed(0), p.warnCount, p.faultCount, Lstatus(p.status)));
  return R;
}
/* CSV = reportRows ghép bằng dấu phẩy; ﻿ = BOM UTF-8 (Excel đọc đúng tiếng Việt) */
function buildReportCSV(){ return '﻿'+reportRows().map(r=>r.map(escCell).join(',')).join('\r\n'); }
function exportCSV(){
  if(!reportCache.data) return;
  const csv=buildReportCSV();
  download('bao-cao_TEA_'+toInputDate(reportCache.start)+'_'+toInputDate(reportCache.end)+'.csv', csv, 'text/csv;charset=utf-8;');
  showToast(LR('csvDone'));
}

/* ===== Excel .xlsx: báo cáo đầy đủ (reportRows) + 2 ẢNH chart (chụp đúng canvas đang show) → nhìn
   trend bằng mắt được, giống report ~80%. .xlsx bản chất là 1 zip XML → đóng gói bằng JSZip (vendor). ===== */
const XLSX_TYPE='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const xmlEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const colName=n=>{ let s=''; while(n>=0){ s=String.fromCharCode(65+(n%26))+s; n=Math.floor(n/26)-1; } return s; };  // 0→A, 25→Z, 26→AA
function buildXLSX(){
  const rows=reportRows();
  const body=rows.map((r,ri)=>'<row r="'+(ri+1)+'">'+r.map((v,ci)=>'<c r="'+colName(ci)+(ri+1)+'" t="inlineStr"><is><t xml:space="preserve">'+xmlEsc(v)+'</t></is></c>').join('')+'</row>').join('');
  const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetData>'+body+'</sheetData><drawing r:id="rId1"/></worksheet>';
  const img1=document.getElementById('rptTemp').toDataURL('image/png').split(',')[1];   // chụp chart đang show
  const img2=document.getElementById('rptPower').toDataURL('image/png').split(',')[1];
  const EMU=px=>Math.round(px*9525), W=720, H=260, r0=rows.length+2;                    // đặt ảnh ngay dưới data
  const anchor=(id,row)=>'<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>'+row+'</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="'+EMU(W)+'" cy="'+EMU(H)+'"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="'+id+'" name="Chart'+id+'"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId'+id+'"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>';
  const drawing='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+anchor(1,r0)+anchor(2,r0+15)+'</xdr:wsDr>';
  const rel=(id,type,target)=>'<Relationship Id="'+id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/'+type+'" Target="'+target+'"/>';
  const HDR='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const z=new JSZip();
  z.file('[Content_Types].xml',HDR+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>');
  z.file('_rels/.rels',HDR+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rel('rId1','officeDocument','xl/workbook.xml')+'</Relationships>');
  z.file('xl/workbook.xml',HDR+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+xmlEsc(LR('csvTitle'))+'" sheetId="1" r:id="rId1"/></sheets></workbook>');
  z.file('xl/_rels/workbook.xml.rels',HDR+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rel('rId1','worksheet','worksheets/sheet1.xml')+rel('rId2','styles','styles.xml')+'</Relationships>');
  z.file('xl/worksheets/sheet1.xml',sheet);
  z.file('xl/worksheets/_rels/sheet1.xml.rels',HDR+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rel('rId1','drawing','../drawings/drawing1.xml')+'</Relationships>');
  z.file('xl/styles.xml',HDR+'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>');
  z.file('xl/drawings/drawing1.xml',drawing);
  z.file('xl/drawings/_rels/drawing1.xml.rels',HDR+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rel('rId1','image','../media/image1.png')+rel('rId2','image','../media/image2.png')+'</Relationships>');
  z.file('xl/media/image1.png',img1,{base64:true});
  z.file('xl/media/image2.png',img2,{base64:true});
  return z.generateAsync({type:'blob',mimeType:XLSX_TYPE});   // Promise<Blob>
}
function exportXLSX(){
  if(!reportCache.data) return;
  buildXLSX().then(blob=>{ download('bao-cao_TEA_'+toInputDate(reportCache.start)+'_'+toInputDate(reportCache.end)+'.xlsx', blob, XLSX_TYPE); showToast(LR('xlsxDone')); });
}

/* ---- print / PDF (canvas là bitmap → phải redraw với màu sáng trước khi in) ---- */
function printReport(){ showToast(LR('printStart')); printMode=true; renderReport(); setTimeout(()=>window.print(), 80); }
window.addEventListener('beforeprint', ()=>{ if(reportOverlay.open && !printMode){ printMode=true; renderReport(); } });
window.addEventListener('afterprint', ()=>{ if(reportOverlay.open){ printMode=false; renderReport(); } });

/* ---- toast ---- */
let toastTimer;
function showToast(msg){ toastEl.textContent=msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toastEl.classList.remove('show'), 3200); }

function initReport(){
  setupHover(document.getElementById('rptTemp'));
  setupHover(document.getElementById('rptPower'));
  const ti=toInputDate(new Date());
  document.getElementById('rptFrom').value=ti; document.getElementById('rptTo').value=ti;
  document.getElementById('rptTo').max=ti; // không cho chọn tương lai
  document.getElementById('reportBtn').addEventListener('click', openReport);
  document.getElementById('rptClose').addEventListener('click', ()=> reportOverlay.close());
  reportOverlay.addEventListener('click', e=>{ if(e.target===reportOverlay) reportOverlay.close(); });
  document.querySelectorAll('.rpt-preset').forEach(b=> b.addEventListener('click', ()=> setReportPreset(b.dataset.preset)) );
  document.getElementById('rptGen').addEventListener('click', applyCustomRange);
  document.getElementById('rptCsv').addEventListener('click', exportCSV);
  document.getElementById('rptXlsx').addEventListener('click', exportXLSX);
  document.getElementById('rptPrint').addEventListener('click', printReport);
}
/* ===================== SUPABASE PERSIST (per-user device_state) =====================
   Dashboard tự ghi+đọc mỗi giây. Fallback mock nếu Supabase chưa cấu hình/chưa chạy schema.
   Không đụng render — chỉ nền phía sau mảng DEVICES. */
let dashUid = null;

async function loadDevices(uid){
  if(!window.supa) return;
  try {
    const { data, error } = await window.supa.from('device_state').select('*').eq('user_id', uid);
    if(error) throw error;
    if(data && data.length){
      const byId = {}; data.forEach(r => byId[r.device_id] = r);
      DEVICES.forEach(d => {
        const r = byId[d.id]; if(!r) return;
        d.base = r.base; d.on = !!r.is_on; d.temp = r.temp; d.target = r.target; d.load = r.load; d.status = r.status;
        d.hist = Array.from({length:30}, () => d.temp);   // dựng lại hist từ temp hiện tại
      });
    } else {
      // user mới chưa có rows → seed 8 từ identity DEVICES
      const rows = DEVICES.map(d => ({
        user_id: uid, device_id: d.id, zone: d.zone, base: d.base,
        is_on: d.on, temp: d.temp, target: d.target, load: d.load, status: d.status
      }));
      const { error: ie } = await window.supa.from('device_state').insert(rows);
      if(ie) throw ie;
    }
  } catch(e){ console.warn('[TEA] load device_state thất bại — dùng mock.', e); }
}

function persistDevices(){
  if(!window.supa || !dashUid) return;
  try {
    const rows = DEVICES.map(d => ({
      user_id: dashUid, device_id: d.id, zone: d.zone, base: d.base,
      is_on: d.on, temp: Math.round(d.temp*100)/100, target: d.target,
      load: Math.round(d.load*100)/100, status: d.status
    }));
    window.supa.from('device_state').upsert(rows, { onConflict: 'user_id,device_id' })
      .then(()=>{}, err => console.warn('[TEA] persist device_state lỗi', err));
  } catch(e){ /* silent — không phá render */ }
}

async function init(){
  buildDeviceGrid();
  renderLegend();
  try {
    const u = await TEA.Auth.getCurrentUser();
    if(u){ dashUid = u.id; await loadDevices(u.id); }   // load/seed 8 thiết bị của user
  } catch(e){ console.warn('[TEA] auth user chưa sẵn sàng — dùng mock.', e); }
  seeding = true;
  for(let i=0;i<HIST;i++) advance();
  seeding = false;
  // seed a couple of context alerts (acked)
  alerts.push({ t:new Date(Date.now()-180000), vi:'ℹ Hệ thống giám sát đã trực tuyến.', en:'ℹ Monitoring system online.', level:'info', ack:true });
  alerts.push({ t:new Date(Date.now()-60000),  vi:'ℹ Đã đồng bộ 8 thiết bị trên 4 khu vực.', en:'ℹ Synced 8 devices across 4 zones.', level:'info', ack:true });
  alertsDirty = true;

  setupHover(document.getElementById('chartTemp'));
  setupHover(document.getElementById('chartPower'));

  initReport();

  setLang(lang);          // applies language + renders dynamic + drawAll
  updatePauseLabel();
  updateClock(new Date());
  tick();
  setInterval(tick, 1000);
  window.addEventListener('resize', debounce(drawAll, 150));
}
init();
