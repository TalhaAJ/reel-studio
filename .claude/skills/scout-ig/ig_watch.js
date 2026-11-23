// Instagram routine watcher: passive and read-only. Injected into an Instagram tab
// in Talha's Chrome while he browses. It logs his routine as a timeline:
// which reel he's on, how long he watches, replays/loops, likes and saves, opening
// the comments (how long, how far he scrolls), profile visits (and which of their
// posts he opens). It never clicks, types or changes the page, except for the
// click-through status pill so he always knows it's on.
// Read with: window.__igwatch.dump()   Stop: __igwatch.stop()   Clear: __igwatch.reset()
(() => {
  if (window.__igwatch) return 'already running';
  const STORE = '__igwatch_v1';
  let started = Date.now();
  const events = [];        // the timeline, in order
  const reels = new Map();  // reel code -> summary
  let restored = 0;
  try {
    const s = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (s && Date.now() - s.savedAt < 12 * 3600e3) {
      started = s.startedAt; events.push(...s.events);
      for (const r of s.reels) reels.set(r.code, r);
      restored = reels.size;
    }
  } catch (e) {}
  const log = (type, data = {}) => events.push({ t: Date.now(), type, page: location.pathname, ...data });
  log(restored ? 'watcher-resumed' : 'watcher-started');

  // ---- what is on screen right now -------------------------------------------
  const visibleVideo = () => {
    let best = null, bestArea = 0;
    for (const v of document.querySelectorAll('video')) {
      const r = v.getBoundingClientRect();
      const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
      if (w * h > bestArea) { bestArea = w * h; best = v; }
    }
    return bestArea > innerWidth * innerHeight * 0.15 ? best : null;
  };
  const reelCode = () => (location.pathname.match(/\/(?:reels?|p)\/([\w-]+)/) || [])[1] || null;
  const profileName = () => {
    const m = location.pathname.match(/^\/([\w.]+)\/(?:reels\/?|tagged\/?)?$/);
    return m && !['reels', 'explore', 'direct', 'accounts', 'stories'].includes(m[1]) ? m[1] : null;
  };
  // The card around a video: the smallest ancestor holding the author link or the
  // audio link (on /reels/ they sit ~13 levels up, beside the video, not around it).
  const AUTHOR = /^\/([\w.]+)\/(?:reels\/)?$/;
  const isAuthor = (h) => AUTHOR.test(h) && !/^\/(reels|explore|direct|accounts)\//.test(h);
  // Climb to the LARGEST ancestor that still holds just this one reel (text ≤ 900
  // chars), so the counters beside the caption are included too.
  const cardOf = (v) => {
    let el = v, best = null;
    for (let i = 0; i < 20 && el; i++) {
      el = el.parentElement;
      if (!el || (el.innerText || '').length > 900) break;
      if ([...el.querySelectorAll('a[href]')].some((a) => isAuthor(a.getAttribute('href')) || /\/reels\/audio\//.test(a.getAttribute('href')))) best = el;
    }
    return best || v.parentElement;
  };
  const meta = (v) => {
    const c = cardOf(v); const lines = (c?.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const a = [...(c?.querySelectorAll('a[href]') || [])].map((x) => x.getAttribute('href')).find(isAuthor);
    const author = a ? a.match(AUTHOR)[1] : '';
    const audio = [...(c?.querySelectorAll('a[href*="/reels/audio/"]') || [])].map((x) => x.innerText.trim()).find(Boolean) || '';
    // Counters are the bare-number lines, in Instagram's order: likes, comments, reposts, shares.
    const nums = lines.filter((s) => /^[\d.,]+\s?[KkMm]?$/.test(s));
    const caption = lines.filter((s) => s !== author && s !== 'Follow' && !nums.includes(s) && s !== audio).join(' ').slice(0, 400);
    return { author, text: caption, audio, likes: nums[0] || '', comments: nums[1] || '', reposts: nums[2] || '', shares: nums[3] || '' };
  };
  const dialogOpen = () => [...document.querySelectorAll('[role="dialog"]')]
    .some((d) => d.getBoundingClientRect().height > 200);

  // ---- sample once a second, log changes -------------------------------------
  let cur = null;          // {code, video, since, lastTime, loops, maxTime}
  let inComments = null;   // {since, code, maxScroll}
  let onProfile = null;    // {name, since}
  const reelRec = (code, v) => {
    if (!reels.has(code)) {
      const m = meta(v);
      reels.set(code, { code, url: `https://www.instagram.com/reel/${code}/`, ...m,
        duration: +(v.duration || 0).toFixed(1), watchedS: 0, loops: 0, views: 0, actions: [] });
    }
    return reels.get(code);
  };
  const closeReel = () => {
    if (!cur) return;
    const r = reels.get(cur.code); const s = (Date.now() - cur.since) / 1000;
    if (r) { r.watchedS = +(r.watchedS + s).toFixed(1); r.loops += cur.loops; }
    log('reel-left', { code: cur.code, watchedS: +s.toFixed(1), loops: cur.loops,
      pctOfFirstPlay: cur.dur ? Math.min(100, Math.round(100 * cur.maxTime / cur.dur)) : null });
    cur = null;
  };
  const tick = () => {
    const v = visibleVideo();
    // Reel feed: the code comes from the URL when it has one, else from the video's card link.
    let code = reelCode();
    if (!code && v) {
      const a = cardOf(v)?.querySelector('a[href*="/reel/"], a[href*="/p/"]');
      code = a ? (a.getAttribute('href').match(/\/(?:reel|p)\/([\w-]+)/) || [])[1] : null;
    }
    if (v && code) {
      if (!cur || cur.code !== code) {
        closeReel();
        const r = reelRec(code, v); r.views++;
        cur = { code, since: Date.now(), lastTime: v.currentTime, loops: 0, maxTime: v.currentTime, dur: v.duration || 0 };
        log('reel-on', { code, author: r.author });
      } else {
        if (v.currentTime + 1 < cur.lastTime && cur.lastTime > (cur.dur || 10) * 0.8) {
          cur.loops++; log('reel-looped', { code, loop: cur.loops });
        }
        if (cur.loops === 0) cur.maxTime = Math.max(cur.maxTime, v.currentTime);
        cur.lastTime = v.currentTime; cur.dur = v.duration || cur.dur;
      }
    } else if (cur && !v) closeReel();

    const d = dialogOpen();
    if (d && !inComments) { inComments = { since: Date.now(), code: cur?.code || reelCode(), maxScroll: 0 };
      log('comments-open', { code: inComments.code }); }
    if (d && inComments) {
      const sc = [...document.querySelectorAll('[role="dialog"] *')].reduce((m, el) =>
        el.scrollHeight > el.clientHeight + 50 ? Math.max(m, el.scrollTop) : m, 0);
      inComments.maxScroll = Math.max(inComments.maxScroll, sc);
    }
    if (!d && inComments) { log('comments-closed', { code: inComments.code,
      seconds: +((Date.now() - inComments.since) / 1000).toFixed(1), scrolledPx: Math.round(inComments.maxScroll) });
      const r = reels.get(inComments.code); if (r) r.actions.push('read-comments'); inComments = null; }

    const p = profileName();
    if (p && (!onProfile || onProfile.name !== p)) {
      if (onProfile) log('profile-left', { name: onProfile.name, seconds: +((Date.now() - onProfile.since) / 1000).toFixed(1) });
      const grid = document.body.innerText.match(/([\d.,]+[KM]?)\s+followers/i);
      onProfile = { name: p, since: Date.now() };
      log('profile-on', { name: p, fromReel: cur?.code || null, followers: grid ? grid[1] : null });
    } else if (!p && onProfile) {
      log('profile-left', { name: onProfile.name, seconds: +((Date.now() - onProfile.since) / 1000).toFixed(1) });
      onProfile = null;
    }
  };
  const tickTimer = setInterval(tick, 1000);

  // ---- clicks: like, save, share, comment box, author, audio, profile grid ----
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[aria-label], a[href]'); if (!el) return;
    const label = (el.getAttribute('aria-label') || el.querySelector('svg[aria-label]')?.getAttribute('aria-label') || '').toLowerCase();
    const href = el.getAttribute('href') || '';
    const code = cur?.code || reelCode();
    let act = null;
    if (/^like$/.test(label)) act = 'liked'; else if (/^unlike$/.test(label)) act = 'unliked';
    else if (/^save$/.test(label)) act = 'saved'; else if (/remove/.test(label)) act = 'unsaved';
    else if (/share/.test(label)) act = 'opened-share';
    else if (/comment/.test(label)) act = 'opened-comments';
    else if (/\/reels\/audio\//.test(href)) act = 'opened-audio';
    else if (isAuthor(href)) act = 'opened-profile';
    else if (/\/(reel|p)\//.test(href) && profileName()) act = 'opened-from-profile-grid';
    if (!act && /^\s*(\.\.\.\s*)?more\s*$/i.test(ev.target.innerText || '')) act = 'expanded-caption';
    if (!act) return;
    log('click', { act, code, href: href || null });
    const r = code && reels.get(code); if (r) r.actions.push(act);
  }, true);

  // Leaving the browser (e.g. to Notepad): snapshot for note matching.
  window.addEventListener('blur', () => log('left-browser', { code: cur?.code || reelCode(), profile: profileName() }));
  window.addEventListener('focus', () => log('back-to-browser'));

  // ---- persistence + badge ---------------------------------------------------
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify({ savedAt: Date.now(),
    startedAt: started, events, reels: [...reels.values()] })); } catch (e) {} };
  const saveTimer = setInterval(save, 5000);
  const css = document.createElement('style');
  css.textContent = '@keyframes igwpulse{0%,100%{opacity:1}50%{opacity:.3}}';
  document.head.appendChild(css);
  const badge = document.createElement('div');
  badge.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;'
    + 'background:#FF6A00;color:#fff;font:700 14px/1.3 system-ui,sans-serif;padding:8px 14px;border-radius:999px;'
    + 'border:2px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4);max-width:90vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
  badge.innerHTML = '<span style="animation:igwpulse 1.4s infinite">●</span> <span></span>';
  document.body.appendChild(badge);
  const label = badge.lastChild;
  const badgeTimer = setInterval(() => {
    const what = inComments ? 'reading comments' : onProfile ? `on @${onProfile.name}` :
      cur ? `reel ${Math.round((Date.now() - cur.since) / 1000)}s${cur.loops ? ` · replay ${cur.loops}` : ''}` : 'waiting';
    label.textContent = `Scout watching · ${reels.size} reels · ${what}`;
  }, 1000);

  window.__igwatch = {
    count: () => reels.size,
    stop: () => { closeReel(); save(); [tickTimer, saveTimer, badgeTimer].forEach(clearInterval); badge.remove(); return 'stopped'; },
    reset: () => { try { localStorage.removeItem(STORE); } catch (e) {} return 'cleared'; },
    dump: () => ({ startedAt: started, minutes: +((Date.now() - started) / 60000).toFixed(1), events,
      reels: [...reels.values()].sort((a, b) => b.watchedS - a.watchedS) }),
  };
  return restored ? `watching (resumed, ${restored} reels kept)` : 'watching';
})();
