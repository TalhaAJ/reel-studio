// X scroll watcher: passive and read-only. Injected into the X tab of the built-in
// browser while Talha scrolls. It records which posts he stops on (dwell time), and
// what he likes, bookmarks, reposts, replies to, opens, plays or expands. It never
// clicks, types or changes anything on the page.
// Read results with: window.__xwatch.dump()   (sorted by interest)
(() => {
  if (window.__xwatch) return 'already running';
  const posts = new Map();            // key -> record
  const visibleSince = new Map();     // key -> ms timestamp
  const events = [];
  let started = Date.now();
  // Reload-safe: carry on from what was saved in this browser in the last 12 h.
  const STORE = '__xwatch_v1';
  let restored = 0;
  try {
    const s = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (s && Date.now() - s.savedAt < 12 * 3600e3) {
      started = s.startedAt;
      for (const p of s.posts) posts.set(p.url.replace('https://x.com', ''), p);
      events.push(...s.events);
      restored = posts.size;
    }
  } catch (e) {}
  events.push({ t: Date.now(), type: restored ? 'watcher-resumed' : 'watcher-started' });

  const keyOf = (art) => {
    const a = art.querySelector('a[href*="/status/"] time')?.closest('a');
    return a ? a.getAttribute('href').split('?')[0] : null;
  };
  const rec = (art) => {
    const key = keyOf(art);
    if (!key) return null;
    if (!posts.has(key)) {
      const text = art.querySelector('[data-testid="tweetText"]')?.innerText || '';
      const user = art.querySelector('[data-testid="User-Name"]')?.innerText.replace(/\n/g, ' ') || '';
      const stats = art.querySelector('[role="group"][aria-label]')?.getAttribute('aria-label') || '';
      const media = art.querySelector('video') ? 'video'
        : art.querySelector('[data-testid="tweetPhoto"]') ? 'image'
        : art.querySelector('[data-testid="card.wrapper"]') ? 'link' : '';
      const promoted = /\bAd\b|Promoted/.test(art.innerText.slice(-200));
      posts.set(key, { url: 'https://x.com' + key, user, text: text.slice(0, 400), stats, media,
        promoted, dwellMs: 0, views: 0, actions: [], firstSeen: Date.now() - started });
    }
    return posts.get(key);
  };

  // "On screen" = at least 60% of the post, or 60% of the viewport for posts taller
  // than the screen. Posts the page removes are dropped (X recycles feed nodes).
  const elOf = new Map();             // url -> article element
  const io = new IntersectionObserver((entries) => {
    const now = Date.now();
    for (const e of entries) {
      const r = rec(e.target); if (!r) continue;
      const k = r.url; elOf.set(k, e.target);
      const need = 0.6 * Math.min(e.boundingClientRect.height, window.innerHeight);
      if (e.isIntersecting && e.intersectionRect.height >= need) {
        if (!visibleSince.has(k)) { visibleSince.set(k, now); r.views++; }
      } else if (visibleSince.has(k)) {
        r.dwellMs += now - visibleSince.get(k); visibleSince.delete(k);
      }
    }
  }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });
  setInterval(() => {
    const now = Date.now();
    for (const [k, t] of visibleSince) {
      if (!elOf.get(k)?.isConnected) {
        const r = posts.get(k.replace('https://x.com', '')); if (r) r.dwellMs += now - t;
        visibleSince.delete(k);
      }
    }
  }, 1000);

  const seen = new WeakSet();
  const scan = () => document.querySelectorAll('article[data-testid="tweet"]').forEach((a) => {
    if (!seen.has(a)) { seen.add(a); io.observe(a); }
  });
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();

  const ACT = { like: 'liked', unlike: 'unliked', bookmark: 'bookmarked', removeBookmark: 'unbookmarked',
    retweet: 'reposted', reply: 'replied', tweetText: 'opened', tweetPhoto: 'opened-media',
    videoPlayer: 'played-video', 'card.wrapper': 'opened-link' };
  document.addEventListener('click', (ev) => {
    const art = ev.target.closest('article[data-testid="tweet"]'); if (!art) return;
    const r = rec(art); if (!r) return;
    let el = ev.target.closest('[data-testid]');
    while (el && art.contains(el)) {
      const a = ACT[el.dataset.testid];
      if (a) { r.actions.push(a); break; }
      el = el.parentElement?.closest('[data-testid]');
    }
    if (ev.target.closest('a[href*="/status/"]')) r.actions.push('opened');
    if (/Show more/i.test(ev.target.innerText || '')) r.actions.push('expanded');
  }, true);

  // Switching to Notepad (or anywhere) blurs the page: snapshot exactly what was on
  // screen at that instant, plus the post he'd been on longest and the last one he
  // touched. Timestamps are epoch ms, same clock as notes_log.py.
  let lastTouched = null;
  document.addEventListener('click', (ev) => {
    const art = ev.target.closest('article[data-testid="tweet"]');
    const r = art && rec(art); if (r) lastTouched = r.url;
  }, true);
  const onScreen = () => {
    const now = Date.now();
    return [...visibleSince.entries()].map(([url, t]) => ({ url, forS: +((now - t) / 1000).toFixed(1),
      text: (posts.get(url.replace('https://x.com', ''))?.text || '').slice(0, 140) }))
      .sort((a, b) => b.forS - a.forS);
  };
  window.addEventListener('blur', () => events.push({ t: Date.now(), type: 'left-browser',
    page: location.pathname, onScreen: onScreen(), lastTouched }));
  window.addEventListener('focus', () => events.push({ t: Date.now(), type: 'back-to-browser' }));

  // Report dwell including the current on-screen stretch, without resetting it.
  const liveDwell = (r) => r.dwellMs + (visibleSince.has(r.url) ? Date.now() - visibleSince.get(r.url) : 0);
  const score = (r) => liveDwell(r) / 1000
    + 20 * r.actions.filter((a) => ['liked', 'bookmarked', 'reposted', 'replied'].includes(a)).length
    + 8 * r.actions.filter((a) => a.startsWith('opened') || a === 'played-video' || a === 'expanded').length;

  // Save every 5 s so a reload only pauses the session.
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify({ savedAt: Date.now(),
    startedAt: started, posts: [...posts.values()], events })); } catch (e) {} };
  const saveTimer = setInterval(save, 5000);

  // Visible badge so Talha always knows it's on. Click-through: it never blocks the page.
  const css = document.createElement('style');
  css.textContent = '@keyframes xwpulse{0%,100%{opacity:1}50%{opacity:.3}}';
  document.head.appendChild(css);
  const badge = document.createElement('div');
  badge.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;'
    + 'background:#FF6A00;color:#fff;font:700 14px/1.3 system-ui,sans-serif;padding:8px 14px;'
    + 'border-radius:999px;border:2px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4);max-width:90vw;'
    + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
  badge.innerHTML = '<span style="color:#fff;animation:xwpulse 1.4s infinite">●</span> <span></span>';
  document.body.appendChild(badge);
  const label = badge.lastChild;
  const badgeTimer = setInterval(() => {
    const top = onScreen()[0];
    const who = top ? (posts.get(top.url.replace('https://x.com', ''))?.user.match(/@\w+/) || [''])[0] : '';
    label.textContent = `Scout watching · ${posts.size} posts` + (who ? ` · on ${who} ${Math.round(top.forS)}s` : '');
  }, 1000);

  window.__xwatch = {
    count: () => posts.size,
    stop: () => { save(); clearInterval(saveTimer); clearInterval(badgeTimer); badge.remove(); return 'stopped'; },
    reset: () => { try { localStorage.removeItem(STORE); } catch (e) {} return 'cleared'; },
    dump: () => {
      return { startedAt: started, minutes: +((Date.now() - started) / 60000).toFixed(1), page: location.pathname,
        events,
        posts: [...posts.values()].filter((r) => !r.promoted)
          .map((r) => ({ ...r, dwellS: +(liveDwell(r) / 1000).toFixed(1), interest: +score(r).toFixed(1) }))
          .sort((a, b) => b.interest - a.interest) };
    },
  };
  return restored ? `watching (resumed, ${restored} posts kept)` : 'watching';
})();
