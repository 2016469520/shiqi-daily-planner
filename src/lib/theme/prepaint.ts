// ============================================================
// 首帧前脚本（embed 到 <head>）
//
// 目的：在 React 挂载之前就把主题属性、明暗类、缩放、强调色等写到 <html>，
// 避免"先看到默认主题再跳变"的闪烁。逻辑必须与 apply.ts 保持一致，
// 但不引入任何依赖（直接字符串注入）。
// ============================================================

export const PREPAINT_SCRIPT = `
(function(){
  try {
    var KEY = 'timegrid:appearance:v1';
    var raw = localStorage.getItem(KEY);
    var root = document.documentElement;
    var s = raw ? JSON.parse(raw) : null;
    var themeId = (s && typeof s.themeId === 'string') ? s.themeId : 'fluent';
    var modes = {
      fluent: ['light','dark'], anime: ['light','dark'], cyber: ['dark'],
      minimal: ['light','dark'], pixel: ['light','dark'], bento: ['dark']
    };
    var defaults = { fluent: 'light', anime: 'light', cyber: 'dark', minimal: 'light', pixel: 'light', bento: 'dark' };
    if (!modes[themeId]) themeId = 'fluent';
    var supported = modes[themeId];
    var wantsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var mode = (s && (s.mode === 'dark' || s.mode === 'light')) ? s.mode : (wantsDark ? 'dark' : 'light');
    if (s && s.followSystem) mode = wantsDark ? 'dark' : 'light';
    if (supported.length === 1) mode = supported[0];
    else if (supported.indexOf(mode) === -1) mode = defaults[themeId];
    root.dataset.theme = themeId;
    root.dataset.mode = mode;
    if (mode === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    root.style.colorScheme = mode;

    var p = (s && s.perTheme && s.perTheme[themeId]) ? s.perTheme[themeId] : null;
    var scale = (p && typeof p.scale === 'number' && p.scale >= 0.5 && p.scale <= 2) ? p.scale : 1;
    root.style.fontSize = (16 * scale).toFixed(2) + 'px';

    var motionMap = { off: ['0ms','0ms','0ms'], low: ['90ms','120ms','160ms'], standard: ['140ms','200ms','280ms'], high: ['180ms','260ms','380ms'] };
    var motion = (p && p.motion && motionMap[p.motion]) ? p.motion : 'standard';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.dataset.motion = reduced ? 'off' : motion;
    var d = motionMap[motion];
    root.style.setProperty('--motion-fast', d[0]);
    root.style.setProperty('--motion-base', d[1]);
    root.style.setProperty('--motion-slow', d[2]);

    if (p) {
      if (typeof p.accent === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(p.accent)) {
        var hex = p.accent.replace('#','');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        var r = parseInt(hex.slice(0,2),16)/255, g = parseInt(hex.slice(2,4),16)/255, b = parseInt(hex.slice(4,6),16)/255;
        var lin = function(c){ return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
        var lum = 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
        root.style.setProperty('--primary', p.accent);
        root.style.setProperty('--primary-foreground', lum > 0.55 ? '#101014' : '#ffffff');
        root.style.setProperty('--ring', p.accent);
        root.style.setProperty('--sidebar-primary', p.accent);
        root.style.setProperty('--chart-1', p.accent);
        root.style.setProperty('--accent-strong', p.accent);
      }
      if (p.radius) {
        var bt = Number(p.radius.button) || 0, cd = Number(p.radius.card) || 0, ip = Number(p.radius.input) || 0, dg = Number(p.radius.dialog) || 0;
        root.style.setProperty('--radius', cd + 'px');
        root.style.setProperty('--radius-sm', Math.max(0, Math.round(bt*0.6)) + 'px');
        root.style.setProperty('--radius-md', bt + 'px');
        root.style.setProperty('--radius-lg', cd + 'px');
        root.style.setProperty('--radius-xl', dg + 'px');
        root.style.setProperty('--radius-2xl', Math.round(cd*1.35) + 'px');
        root.style.setProperty('--radius-3xl', Math.round(cd*1.7) + 'px');
        root.style.setProperty('--radius-4xl', Math.round(cd*2.1) + 'px');
        root.style.setProperty('--radius-input', ip + 'px');
      }
      if (typeof p.typeScale === 'number') root.style.setProperty('--type-scale', String(p.typeScale));
      if (typeof p.titleScale === 'number') root.style.setProperty('--title-scale', String(p.titleScale));
      var stacks = {
        system: 'ui-sans-serif, "Segoe UI", system-ui, "Microsoft YaHei", sans-serif',
        rounded: '"Segoe UI Rounded", "Hiragino Maru Gothic ProN", "Yu Gothic UI", "Microsoft YaHei UI", system-ui, sans-serif',
        mono: '"Cascadia Mono", Consolas, "Sarasa Mono SC", ui-monospace, monospace',
        serif: 'Georgia, "Songti SC", "SimSun", "Noto Serif SC", ui-serif, serif'
      };
      if (p.fontId && stacks[p.fontId]) {
        root.style.setProperty('--font-sans', stacks[p.fontId]);
        root.style.setProperty('--font-heading', stacks[p.fontId]);
      }
    }
  } catch (e) { /* 坏配置一律走默认主题 */ }
})();
`
