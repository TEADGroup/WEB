/* =====================================================================
   dashboard.js — RIÊNG trang giám sát (dashboard/index.html)
   ---------------------------------------------------------------------
   Mô phỏng giám sát nhà máy real-time: KPI, biểu đồ canvas, lưới thiết bị,
   cảnh báo. Phần theme/i18n gọi TEA.* từ theme.js / i18n.js (nạp trước).
   ===================================================================== */
"use strict";
/* ===== palette / status ===== */
const COLORS = { accent:'#7c3aed', accent2:'#2563eb', neon:'#22d3ee', amber:'#f59e0b', green:'#22c55e', red:'#ef4444', gray:'#94a3b8' };
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
  vi:{ live:'TRỰC TUYẾN', paused:'TẠM DỪNG', pause:'⏸ Tạm dừng', resume:'▶ Tiếp tục', ack:'Xác nhận', noAlerts:'Chưa có sự kiện nào.' },
  en:{ live:'LIVE',       paused:'PAUSED',    pause:'⏸ Pause',     resume:'▶ Resume',   ack:'Acknowledge', noAlerts:'No events yet.' }
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
TEA.initTheme({ btn: themeBtn, onTheme: t => { themeBtn.textContent = t==='dark' ? '🌙' : '☀️'; } });
// đổi theme → vẽ lại chart theo màu mới (drawAll định nghĩa sau; chỉ chạy khi click)
themeBtn.addEventListener('click', () => { if (typeof drawAll === 'function') drawAll(); if (reportOverlay && reportOverlay.open) renderReport(); });

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
  if(d.status==='fault'){ vi='⛔ '+name+' — sự cố, dừng khẩn cấp ('+Math.round(d.temp)+'°C)'; en='⛔ '+name+' — fault, emergency stop ('+Math.round(d.temp)+'°C)'; level='fault'; }
  else if(d.status==='warning'){ vi='⚠ '+name+' — vượt ngưỡng nhiệt ('+Math.round(d.temp)+'°C)'; en='⚠ '+name+' — over temperature ('+Math.round(d.temp)+'°C)'; level='warn'; }
  else if(d.status==='running' && prev!=='running' && prev!=='off'){ vi='✓ '+name+' — đã phục hồi'; en='✓ '+name+' — recovered'; level='ok'; }
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
const pauseBtn = document.getElementById('pauseBtn'), liveWrap = document.getElementById('liveWrap'), liveText = document.getElementById('liveText');
function updatePauseLabel(){
  pauseBtn.textContent = paused ? L('resume') : L('pause');
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
       invalidRange:'⚠ Khoảng ngày không hợp lệ.', csvDone:'✓ Đã tải file CSV.', printStart:'🖨 Đang chuẩn bị báo cáo in…',
       colTime:'Thời gian', colPower:'Công suất (kW)', plantAvg:'TB nhà máy',
       csvTitle:'Báo cáo nhiệt độ nhà máy', periodLbl:'Kỳ báo cáo', genLbl:'Sinh lúc',
       warnTh:'Ngưỡng cảnh báo (°C)', faultTh:'Ngưỡng sự cố (°C)', metric:'Chỉ số', value:'Giá trị',
       secSummary:'TÓM TẮT', secTempTrend:'XU HƯỚNG NHIỆT ĐỘ (°C)', secPowerTrend:'XU HƯỚNG CÔNG SUẤT (kW)',
       secWarn:'CẢNH BÁO NHIỆT ĐỘ', secDev:'TÓM TẮT THEO THIẾT BỊ' },
  en:{ close:'Close', avgTemp:'Avg temp', maxTemp:'Max temp', totWarn:'Warnings', faults:'Faults', avgPow:'Avg power', oee:'Efficiency (OEE)',
       thDevice:'Device', thZone:'Zone', thTime:'Time', thPeak:'Peak (°C)', thLevel:'Level', thDur:'Duration',
       thAvg:'Avg (°C)', thMax:'Max (°C)', thWarn:'Warn', thFault:'Fault', thStatus:'Status',
       lvlWarn:'Warning', lvlFault:'Fault', noWarn:'No temperature warnings in this period.',
       invalidRange:'⚠ Invalid date range.', csvDone:'✓ CSV downloaded.', printStart:'🖨 Preparing print…',
       colTime:'Time', colPower:'Power (kW)', plantAvg:'Plant avg',
       csvTitle:'Plant temperature report', periodLbl:'Period', genLbl:'Generated',
       warnTh:'Warning threshold (°C)', faultTh:'Fault threshold (°C)', metric:'Metric', value:'Value',
       secSummary:'SUMMARY', secTempTrend:'TEMPERATURE TREND (°C)', secPowerTrend:'POWER TREND (kW)',
       secWarn:'TEMPERATURE WARNINGS', secDev:'PER-DEVICE SUMMARY' }
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
    kpiTile('🌡', k.avgTemp.toFixed(0), '°C', 'avgTemp') +
    kpiTile('🔥', k.maxTemp.toFixed(0), '°C · '+Lname(k.peakDev), 'maxTemp') +
    kpiTile('⚠', k.totWarn, '', 'totWarn') +
    kpiTile('⛔', k.faults, '', 'faults') +
    kpiTile('⚡', Math.round(k.avgPow), 'kW', 'avgPow') +
    kpiTile('📈', k.oee.toFixed(0), '%', 'oee');
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
/* CSV đầy đủ = FORM (tiêu đề + kỳ + KPI + ngưỡng + 2 bảng) + CHART (dữ liệu trend nhiệt & công suất).
   Mỗi section cách 1 dòng trắng → mở trong Excel trông như báo cáo trên màn hình. */
function buildReportCSV(){
  const d=reportCache.data, k=d.kpis, rows=[];
  // --- form: header ---
  rows.push([LR('csvTitle')]);
  rows.push([LR('periodLbl'), fmtRange(reportCache.start, reportCache.end)]);
  rows.push([LR('genLbl'), fmtDateTime(new Date())]);
  rows.push([LR('warnTh'), WARN]);
  rows.push([LR('faultTh'), FAULT]);
  rows.push([]);
  // --- form: KPI summary ---
  rows.push([LR('secSummary')]);
  rows.push([LR('metric'), LR('value')]);
  rows.push([LR('avgTemp'), k.avgTemp.toFixed(0)+' °C']);
  rows.push([LR('maxTemp'), k.maxTemp.toFixed(0)+' °C ('+Lname(k.peakDev)+')']);
  rows.push([LR('totWarn'), k.totWarn]);
  rows.push([LR('faults'), k.faults]);
  rows.push([LR('avgPow'), Math.round(k.avgPow)+' kW']);
  rows.push([LR('oee'), k.oee.toFixed(0)+' %']);
  rows.push([]);
  // --- chart: temperature trend (theo khu vực + TB nhà máy) ---
  rows.push([LR('secTempTrend')]);
  rows.push([LR('colTime')].concat(ZONES.map(z=> lang==='vi'?z.vi:z.en)).concat([LR('plantAvg')]));
  d.ts.forEach((t,i)=>{ const c=[fmtDateTime(t)]; ZONES.forEach(z=>c.push(d.zones[z.id][i].toFixed(1))); c.push(d.plantAvg[i].toFixed(1)); rows.push(c); });
  rows.push([]);
  // --- chart: power trend ---
  rows.push([LR('secPowerTrend')]);
  rows.push([LR('colTime'), LR('colPower')]);
  d.ts.forEach((t,i)=> rows.push([fmtDateTime(t), d.power[i].toFixed(1)]) );
  rows.push([]);
  // --- form: warnings table ---
  rows.push([LR('secWarn')]);
  rows.push([LR('thDevice'), LR('thZone'), LR('thTime'), LR('thPeak'), LR('thLevel'), LR('thDur')]);
  if(!d.events.length) rows.push([LR('noWarn')]);
  else d.events.forEach(e=> rows.push([e.device.id+' '+Lname(e.device), e.zone, fmtDateTime(e.start), e.peak.toFixed(0), LR(e.level==='fault'?'lvlFault':'lvlWarn'), fmtDuration(e.duration)]) );
  rows.push([]);
  // --- form: per-device table ---
  rows.push([LR('secDev')]);
  rows.push([LR('thDevice'), LR('thZone'), LR('thAvg'), LR('thMax'), LR('thWarn'), LR('thFault'), LR('thStatus')]);
  d.perDevice.forEach(p=> rows.push([p.device.id+' '+Lname(p.device), p.device.zone, p.avg.toFixed(0), p.max.toFixed(0), p.warnCount, p.faultCount, Lstatus(p.status)]) );
  return '﻿' + rows.map(r=>r.map(escCell).join(',')).join('\r\n');
}
function exportCSV(){
  if(!reportCache.data) return;
  const csv=buildReportCSV();
  download('bao-cao_TEA_'+toInputDate(reportCache.start)+'_'+toInputDate(reportCache.end)+'.csv', csv, 'text/csv;charset=utf-8;');
  showToast(LR('csvDone'));
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
  document.getElementById('rptPrint').addEventListener('click', printReport);
}
buildDeviceGrid();
renderLegend();
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
