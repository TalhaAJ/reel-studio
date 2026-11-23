// Instagram scout helpers: read-only readers the scout injects into its own tab.
// After injecting, call (all return plain JSON):
//   __igs.reel()      -> the reel on screen: code, author, caption, likes/comments/reposts/shares, audio, duration
//   __igs.comments()  -> the open comments dialog: [{user, age, text}] + how many are one-word CTA replies
//   __igs.profile()   -> on /<name>/reels/: header (followers, bio), every grid reel's views, the median
//                        (pinned excluded) and each reel's multiple of that median (outliers >= 3x)
// Never clicks or types; the scout opens comments / profiles itself, at human pace.
(() => {
  const AUTHOR = /^\/([\w.]+)\/(?:reels\/)?$/;
  const isAuthor = (h) => AUTHOR.test(h || '') && !/^\/(reels|explore|direct|accounts)\//.test(h);
  const num = (s) => { s = (s || '').toLowerCase().replace(/,/g, ''); const m = s.match(/([\d.]+)\s*([km]?)/);
    return m ? +m[1] * (m[2] === 'k' ? 1e3 : m[2] === 'm' ? 1e6 : 1) : 0; };
  const visibleVideo = () => { let best = null, ba = 0;
    for (const v of document.querySelectorAll('video')) { const r = v.getBoundingClientRect();
      const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
      if (w * h > ba) { ba = w * h; best = v; } } return best; };
  // Smallest container around the playing video that holds its author + counters but not the next reel.
  const cardOf = (v) => { let el = v, best = null;
    for (let i = 0; i < 20 && el; i++) { el = el.parentElement; if (!el) break;
      const authors = new Set([...el.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter(isAuthor).map((h) => h.match(AUTHOR)[1]));
      if (authors.size > 1 || (el.innerText || '').length > 1500) break;
      if (authors.size === 1) best = el; }
    return best || v?.parentElement; };

  const reel = () => {
    const v = visibleVideo(); const c = cardOf(v);
    const lines = (c?.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const a = [...(c?.querySelectorAll('a[href]') || [])].map((x) => x.getAttribute('href')).find(isAuthor);
    const author = a ? a.match(AUTHOR)[1] : '';
    const audio = [...(c?.querySelectorAll('a[href*="/reels/audio/"]') || [])].map((x) => x.innerText.trim()).find(Boolean) || '';
    const nums = lines.filter((s) => /^[\d.,]+\s?[KkMm]?$/.test(s));
    const code = (location.pathname.match(/\/(?:reels?|p)\/([\w-]+)/) || [])[1] || '';
    const time = document.querySelector('time[datetime]')?.getAttribute('datetime') || '';
    return { code, url: code ? `https://www.instagram.com/reel/${code}/` : location.href, author,
      caption: lines.filter((s) => s !== author && s !== 'Follow' && s !== audio && !nums.includes(s)).join(' ').slice(0, 500),
      likes: num(nums[0]), comments: num(nums[1]), reposts: num(nums[2]), shares: num(nums[3]), audio,
      duration: v ? +(v.duration || 0).toFixed(1) : null, posted: time };
  };

  const comments = () => {
    const d = [...document.querySelectorAll('[role="dialog"], article')].find((x) => x.getBoundingClientRect().height > 200 && /Reply/.test(x.innerText));
    if (!d) return { open: false, items: [] };
    const L = d.innerText.split('\n').map((s) => s.trim()).filter((s) => s && s !== 'Reply' && !/^View (all )?\d+ repl/.test(s) && s !== 'Comments');
    const items = [];
    for (let i = 0; i < L.length - 2; i++) {
      if (/^[\w.]+$/.test(L[i]) && /^\d+\s?[smhdw]$/.test(L[i + 1])) { items.push({ user: L[i], age: L[i + 1], text: L[i + 2] }); i += 2; }
    }
    const cta = items.filter((x) => /^[A-Za-z]+[!.]?\s*\W*$/.test(x.text) && x.text.length <= 12).length;
    return { open: true, items: items.slice(0, 40), oneWordCtaReplies: cta };
  };

  const profile = () => {
    const name = (location.pathname.match(/^\/([\w.]+)\//) || [])[1] || '';
    const head = (document.querySelector('header')?.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const followers = num((head.find((s) => /followers/i.test(s)) || '').replace(/followers/i, ''));
    const tiles = [...document.querySelectorAll('a[href*="/reel/"]')].map((a) => ({
      code: (a.getAttribute('href').match(/\/reel\/([\w-]+)/) || [])[1], views: num(a.innerText),
      pinned: !!a.querySelector('svg[aria-label*="pin" i]') }));
    const uniq = [...new Map(tiles.map((t) => [t.code, t])).values()];
    const vs = uniq.filter((t) => !t.pinned && t.views).map((t) => t.views).sort((a, b) => a - b);
    const median = vs.length ? vs[Math.floor(vs.length / 2)] : 0;
    return { name, followers, bio: head.slice(0, 12).join(' | ').slice(0, 400), median, reels: uniq.length,
      grid: uniq.map((t) => ({ ...t, x: median ? +(t.views / median).toFixed(1) : null })),
      outliers: uniq.filter((t) => median && t.views >= 3 * median).sort((a, b) => b.views - a.views) };
  };

  window.__igs = { reel, comments, profile };
  return 'igs ready';
})();
