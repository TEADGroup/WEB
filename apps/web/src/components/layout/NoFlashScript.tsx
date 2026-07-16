import { DEFAULT_THEME_CONFIG } from '@tea/shared';

/**
 * Inline script rendered before hydration. Computes the effective phase
 * (respecting the persisted override: Light→day, Dark→night, else clock) and
 * sets the gradient variables on <html> so the first paint is correct — no flash
 * of the SSR `day` default.
 *
 * Mirrors `@/lib/theme` (computePhase + resolvePhase) as raw JS because it runs
 * before modules load. Keep them in sync.
 */
export function NoFlashScript() {
  const phases = JSON.stringify(DEFAULT_THEME_CONFIG.phases);
  const code = [
    '(function(){try{',
    `var p=${phases};`,
    "var h=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Ho_Chi_Minh',hour:'numeric',hour12:false}).format(new Date());",
    'var hr=Number(h)%24;',
    "var tph=(hr>=5&&hr<8)?'dawn':(hr>=8&&hr<17)?'day':(hr>=17&&hr<19)?'dusk':'night';",
    "var s=localStorage.getItem('tea-theme');",
    "var eff=(s==='light')?'day':(s==='dark')?'night':tph;",
    'var c=p[eff];var r=document.documentElement.style;',
    "r.setProperty('--tea-bg-from',c.from);if(c.via)r.setProperty('--tea-bg-via',c.via);",
    "r.setProperty('--tea-bg-to',c.to);r.setProperty('--tea-accent',c.accent);",
    "if(c.mode==='dark')document.documentElement.classList.add('dark');",
    '}catch(e){}})();',
  ].join('');

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
