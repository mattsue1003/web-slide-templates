/* 網頁簡報範本庫：範本列表、範本頁、編輯器、說明 */
(function () {
  'use strict';
  const { THEMES, SAMPLES, TAGS } = window.WST_DATA;
  const E = window.WST;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = E.esc;
  const view = $('#view');
  const byId = id => THEMES.find(t => t.id === id);

  /* ---------- 存檔（壞掉或不能用時回到預設） ---------- */
  const store = {
    get(k, ok) { try { const v = JSON.parse(localStorage.getItem(k)); return ok(v) ? v : null; } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const isDraft = v => v && typeof v === 'object' && typeof v.src === 'string' && typeof v.theme === 'string';
  const isAi = v => v && typeof v === 'object';
  const SAMPLE_SET = new Set(Object.values(SAMPLES).map(s => s.trim()));
  const isSample = src => SAMPLE_SET.has(String(src).trim());

  /* ---------- 小工具 ---------- */
  let toastT = 0;
  function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
  // 先同步複製（不會被新分頁打斷），再用 Clipboard API 補一次
  function copyNow(text) {
    let ok = false;
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => {}, () => {});
    return ok || !!(navigator.clipboard && navigator.clipboard.writeText);
  }
  const safeName = s => (String(s || '網頁簡報').replace(/[\\/:*?"<>|\n\r]+/g, ' ').trim().slice(0, 60) || '網頁簡報');
  function blobOf(html) { return new Blob([html], { type: 'text/html;charset=utf-8' }); }
  const REMOTE = new URL('remote.html', location.href.split('#')[0]).href;
  /* 上傳的圖片存在這台電腦的 IndexedDB（localStorage 放不下），內容裡只寫 img:代號 */
  const IMGS = {};
  const IDB = (() => {
    let dbp = null;
    const db = () => dbp || (dbp = new Promise((ok, no) => {
      if (!window.indexedDB) return no(new Error('no idb'));
      const r = indexedDB.open('wst', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('imgs');
      r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
    }));
    const tx = (m, f) => db().then(d => new Promise((ok, no) => { const t = d.transaction('imgs', m), st = t.objectStore('imgs'), out = f(st); t.oncomplete = () => ok(out && out.result); t.onerror = () => no(t.error); }));
    return {
      all: () => db().then(d => new Promise(ok => {
        const m = {}, c = d.transaction('imgs').objectStore('imgs').openCursor();
        c.onsuccess = () => { const k = c.result; if (k) { m[k.key] = k.value; k.continue(); } else ok(m); };
        c.onerror = () => ok(m);
      })).catch(() => ({})),
      put: (k, v) => tx('readwrite', st => st.put(v, k)).catch(() => null),
    };
  })();
  let imgsLoaded = null;
  const loadImgs = () => imgsLoaded || (imgsLoaded = IDB.all().then(m => Object.assign(IMGS, m)));
  // 圖片縮到最長邊 1600px、轉成 JPEG，存起來，回傳代號
  async function addImage(file) {
    if (!file || !/^image\//.test(file.type)) throw new Error('不是圖片檔');
    const url = URL.createObjectURL(file);
    try {
      const im = await new Promise((ok, no) => { const x = new Image(); x.onload = () => ok(x); x.onerror = () => no(new Error('讀不到這張圖片')); x.src = url; });
      const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/jpeg', .86);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      IMGS[id] = data; await IDB.put(id, data);
      return id;
    } finally { URL.revokeObjectURL(url); }
  }
  const deckOpt = cfg => ({ cfg: cfg || {}, remoteUrl: REMOTE, images: IMGS });
  function download(theme, src, cfg) {
    const html = E.build(theme, src, deckOpt(cfg));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blobOf(html));
    a.download = safeName(E.titleOf(E.parse(src), theme.name)) + '.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('已下載 HTML 檔，用瀏覽器打開就能播放');
  }
  function openDeck(theme, src, hash, cfg) {
    const url = URL.createObjectURL(blobOf(E.build(theme, src, deckOpt(cfg))));
    const w = window.open(url + (hash || ''), '_blank');
    if (!w) toast('瀏覽器擋住了新分頁。請允許這個網站開新視窗，或改用「下載 HTML」', 4200);
    else if (hash === '#print') toast('新分頁會跳出列印視窗，目的地選「儲存為 PDF」', 4200);
  }
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/></svg>',
    pdf: '<svg viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M6 14h12v7H6z"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
    reset: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  };
  const swatches = t => [t.vars.bg, t.vars.ac, t.vars.ac2, t.vars.fg].filter(c => /^#/.test(c));

  // 跟 iframe 裡的簡報溝通
  const frames = new Map(); // iframe -> handler（簡報一載入就會回報，所以用 contentWindow 比對，不等 load）
  addEventListener('message', e => { const d = e.data; if (!d || !d.wst) return; frames.forEach((h, f) => { if (f.contentWindow === e.source) h(d); }); });
  function hookFrame(iframe, handler) { frames.set(iframe, handler); }
  const send = (iframe, msg) => { if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage(Object.assign({ wst: 1 }, msg), '*'); };

  /* ---------- 路由 ---------- */
  let cleanup = null, openAI = false;
  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    frames.clear();
    let h = '';
    try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) { h = ''; }
    const [a, b] = h.replace(/^\//, '').split('/');
    let r = 'gallery';
    if (a === 't' && byId(b)) { r = 'tpl'; viewTpl(byId(b)); }
    else if (a === 'edit') { r = 'edit'; viewEdit(byId(b)); }
    else if (a === 'guide') { r = 'guide'; viewGuide(); }
    else viewGallery();
    $$('.nav a').forEach(x => x.classList.toggle('on', x.dataset.r === r || (r === 'tpl' && x.dataset.r === 'gallery')));
    window.scrollTo(0, 0);
  }
  addEventListener('hashchange', route);

  /* ---------- 首頁：範本列表 ---------- */
  let filt = { tag: '', q: '' };
  function viewGallery() {
    document.title = '網頁簡報範本庫';
    const count = tag => THEMES.filter(t => t.tags.includes(tag)).length;
    view.innerHTML = `
<section class="hero">
  <div>
    <h1>挑一套範本，換成你的內容</h1>
    <p>${THEMES.length} 套完整的網頁簡報範本，每套都有 ${E.TYPES.length} 種版面。內容用簡單的文字寫，換範本不用重打；做好可以直接在瀏覽器播放、下載成一個 HTML 檔，或存成 PDF。</p>
  </div>
  <ol class="how">
    <li><b>1</b><span><strong>挑範本</strong>點卡片看完整的 ${E.TYPES.length} 頁示範</span></li>
    <li><b>2</b><span><strong>寫內容</strong>自己打，或請 ChatGPT、Gemini 照格式幫你寫</span></li>
    <li><b>3</b><span><strong>播放或下載</strong>全螢幕播放、下載 HTML、存成 PDF</span></li>
  </ol>
</section>
<div class="bar">
  <div class="chips" role="group" aria-label="用途">
    <button class="chip" data-tag="" aria-pressed="${!filt.tag}">全部<small>${THEMES.length}</small></button>
    ${TAGS.map(t => `<button class="chip" data-tag="${t}" aria-pressed="${filt.tag === t}">${t}<small>${count(t)}</small></button>`).join('')}
  </div>
  <label class="search">${ICON.search}<input id="q" type="search" placeholder="搜尋範本，例如：黑板、長輩" value="${esc(filt.q)}" aria-label="搜尋範本"></label>
</div>
<div class="grid" id="grid"></div>`;
    const grid = $('#grid');
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(ents => ents.forEach(en => {
      if (!en.isIntersecting) return; const f = en.target; io.unobserve(f); f.srcdoc = thumbDoc(byId(f.dataset.id));
    }), { rootMargin: '300px' }) : null;
    function draw() {
      const q = filt.q.trim().toLowerCase();
      const list = THEMES.filter(t => (!filt.tag || t.tags.includes(filt.tag)) && (!q || (t.name + t.desc + t.tags.join('')).toLowerCase().includes(q)));
      grid.innerHTML = list.length ? list.map(t => `
<a class="card" href="#t/${t.id}" data-id="${t.id}">
  <div class="thumb"><iframe title="${esc(t.name)} 封面預覽" data-id="${t.id}" tabindex="-1" aria-hidden="true"></iframe></div>
  <div class="cb">
    <h3>${esc(t.name)}<span class="sw">${swatches(t).map(c => `<i style="background:${c}"></i>`).join('')}</span></h3>
    <p>${esc(t.desc)}</p>
    <div class="tags">${t.tags.map(x => `<span class="tag">${x}</span>`).join('')}</div>
  </div>
</a>`).join('') : `<p class="empty">找不到符合的範本，換個關鍵字試試</p>`;
      $$('iframe', grid).forEach(f => io ? io.observe(f) : (f.srcdoc = thumbDoc(byId(f.dataset.id))));
    }
    draw();
    $$('.chip').forEach(c => c.addEventListener('click', () => { filt.tag = c.dataset.tag; $$('.chip').forEach(x => x.setAttribute('aria-pressed', x === c)); draw(); }));
    $('#q').addEventListener('input', e => { filt.q = e.target.value; draw(); });
    cleanup = () => io && io.disconnect();
  }
  const thumbDoc = t => E.build(t, SAMPLES[t.sample], { mode: 'thumb' });

  /* ---------- 範本頁 ---------- */
  function viewTpl(t) {
    document.title = `${t.name}｜網頁簡報範本庫`;
    const i = THEMES.indexOf(t), prev = THEMES[(i - 1 + THEMES.length) % THEMES.length], next = THEMES[(i + 1) % THEMES.length];
    const src = SAMPLES[t.sample];
    const fontNames = [...new Set((t.fonts || []).map(f => f.split(':')[0]))].join('、');
    view.innerHTML = `
<a class="crumb" href="#/">${ICON.back}全部範本</a>
<div class="tpl">
  <div>
    <div class="player"><iframe id="player" title="${esc(t.name)} 範本播放" allow="fullscreen" allowfullscreen></iframe></div>
    <div class="pbar">
      <button class="btn sm" id="pPrev" aria-label="上一頁">‹ 上一頁</button>
      <span class="pg" id="pPg">1 / ${E.parse(src).length}</span>
      <button class="btn sm" id="pNext" aria-label="下一頁">下一頁 ›</button>
      <span style="margin-left:auto">點一下簡報後，可以用 <span class="kbd">←</span> <span class="kbd">→</span> 換頁</span>
    </div>
  </div>
  <aside class="side">
    <h1>${esc(t.name)}</h1>
    <p>${esc(t.desc)}</p>
    <div class="tags">${t.tags.map(x => `<span class="tag">${x}</span>`).join('')}</div>
    <div class="acts">
      <a class="btn pri" href="#edit/${t.id}">${ICON.edit}用這個範本做簡報</a>
      <a class="btn" href="#edit/${t.id}" id="tAI">${ICON.copy}請 AI 幫我寫內容</a>
      <button class="btn" id="tPlay">${ICON.play}全螢幕播放示範</button>
      <div class="row">
        <button class="btn" id="tDl">${ICON.dl}下載示範</button>
        <button class="btn" id="tPdf">${ICON.pdf}存成 PDF</button>
      </div>
    </div>
    <p class="hint" style="margin:-6px 0 4px">進到編輯器後，還可以換字體、配色、排版、轉場動畫，以及上下或左右捲動的播放方式。</p>
    <div class="meta-l">配色</div>
    <div class="pal">${swatches(t).map(c => `<i style="background:${c}" title="${c}"></i>`).join('')}</div>
    <div class="meta-l">字型</div>
    <div class="fontl">${esc(fontNames)}</div>
    <div class="meta-l">換頁效果</div>
    <div class="fontl">${{ fade: '淡入淡出', rise: '往上浮現', slide: '左右滑動', zoom: '輕微放大' }[t.tr] || '淡入淡出'}</div>
  </aside>
</div>
<div class="sec-h"><h2>全部 ${E.parse(src).length} 頁</h2><span>點一頁，上面的簡報就跳過去</span></div>
<iframe class="ovf" id="ovf" title="${esc(t.name)} 全部頁面"></iframe>
<nav class="pn" aria-label="其他範本"><a href="#t/${prev.id}"><small>上一套</small>${esc(prev.name)}</a><a href="#t/${next.id}"><small>下一套</small>${esc(next.name)}</a></nav>`;
    const player = $('#player'), ovf = $('#ovf');
    hookFrame(player, d => { if (typeof d.slide === 'number') { $('#pPg').textContent = `${d.slide + 1} / ${d.total}`; send(ovf, { go: d.slide }); } });
    hookFrame(ovf, d => { if (d.h) ovf.style.height = d.h + 'px'; if (typeof d.pick === 'number') send(player, { go: d.pick }); });
    player.srcdoc = E.build(t, src);
    ovf.srcdoc = E.build(t, src, { mode: 'ov' });
    $('#pPrev').onclick = () => send(player, { key: 'ArrowLeft' });
    $('#pNext').onclick = () => send(player, { key: 'ArrowRight' });
    $('#tAI').onclick = () => { openAI = true; };
    $('#tPlay').onclick = () => openDeck(t, src);
    $('#tDl').onclick = () => download(t, src);
    $('#tPdf').onclick = () => openDeck(t, src, '#print');
  }

  /* ---------- 編輯器 ---------- */
  const SNIP = {
    cover: '=== 封面\n# 主標題\n## 副標題\n講者 · 日期',
    agenda: '=== 目錄\n# 今天的內容\n- 第一段\n- 第二段\n- 第三段',
    section: '=== 章節\n# 段落標題\n## 一句話說明',
    bullets: '=== 重點\n# 標題\n- 第一個重點\n- 第二個重點\n- 第三個重點',
    two: '=== 左右\n# 標題\n## 左欄標題\n- 重點\n- 重點\n## 右欄標題\n- 重點\n- 重點',
    stats: '=== 數字\n# 標題\n- 25 分 | 說明\n- 80% | 說明\n- 3 倍 | 說明\n資料來源：',
    quote: '=== 引言\n> 一句讓人記住的話\n— 出處',
    steps: '=== 步驟\n# 標題\n- 第一步：說明\n- 第二步：說明\n- 第三步：說明',
    image: '=== 圖文\n# 標題\n![圖片說明](圖片網址)\n- 重點\n- 重點',
    quiz: '=== 問答\n# 題目？\n- [x] 正確答案\n- [ ] 錯誤選項\n- [ ] 錯誤選項\n解答：說明為什麼',
    end: '=== 結尾\n# 謝謝聆聽\n## 歡迎提問',
  };

  // 範例內容的頁面順序：[{n:'封面'}, ...]
  const seqOf = src => E.parse(src).map(s => E.NAME[s.type]);
  const seqText = seq => seq.map((n, k) => `第 ${k + 1} 頁 ${n}`).join('、');
  const RULES = notes => [
    `- 每一頁用一行「=== 版面名稱」開頭。可用的版面：${E.TYPES.map(t => t.n).join('、')}。第一頁用封面，最後一頁用結尾。`,
    '- 「# 」是這一頁的標題，「## 」是副標題（「左右」版面裡，「## 」是左欄和右欄的標題）。',
    '- 「- 」是一個重點，一頁 3～5 點，每點 20 字以內。想強調的字用 **兩個星號** 包起來。',
    '- 「數字」版面：「- 數字 | 說明」，例如「- 25 分 | 專心做一件事」，最多 4 個。數字要有可靠來源，不確定就寫「（請查證）」，並在最後一行寫「資料來源：…」。',
    '- 「步驟」版面：「- 步驟名稱：一句說明」，3～5 步。',
    '- 「引言」版面：「> 引言內容」，下一行「— 出處」。不要編造名人名言。',
    '- 「圖文」版面：「![畫面描述]()」，中括號裡寫一句具體的畫面描述（例如「長輩坐在床邊、腳踩止滑墊，旁邊有小夜燈」），我會拿它去生成圖片；小括號留空。',
    '- 「問答」版面：「# 題目」，選項用「- [x] 正確答案」和「- [ ] 錯誤選項」，最後一行「解答：說明」。如果是投票、沒有標準答案，全部用「- [ ]」。',
    notes ? '- 每一頁都加一行「備註：…」，寫講者在這一頁要說的話（2～3 句口語、像在跟台下聊天）。這是講稿，播放時只有講者看得到。' : '- 給講者看的提醒寫「備註：…」，播放時只有講者看得到。',
    '- 不要用表格、不要用其他 Markdown 語法，程式碼區塊外面不要放簡報內容。',
  ];
  const SHORT_EX = notes => ['=== 封面', '# 番茄鐘工作法', '## 用 25 分鐘，找回專注力', '學習策略工作坊 · 第 3 週', '=== 重點', '# 分心的三個常見原因', '- 手機通知一直跳出來', '- 任務太大，不知道從哪開始', '- 沒有休息，**越讀越累**', '=== 問答', '# 經典番茄鐘的專注時間是多久？', '- [ ] 10 分鐘', '- [x] 25 分鐘', '- [ ] 60 分鐘', '解答：專注 25 分鐘、休息 5 分鐘。', notes ? '備註：先請大家猜猜看，再公布答案。' : '', '=== 結尾', '# 謝謝聆聽'];

  const TONES = ['溫暖親切', '專業嚴謹', '活潑有趣', '簡單直白'];
  // 讓簡報有自己的想法：有寫就當主軸；沒寫就請 AI 先問
  const ideaLines = o => o.must && o.must.trim()
    ? [`我的想法和一定要講的重點：${o.must.trim()}`, '請以我的想法為主軸安排內容，用我的觀點和例子，不要寫成一般性的資料整理。']
    : ['我還沒寫自己的想法。開始之前，請先問我 2～3 個問題（例如：為什麼選這個主題、最想讓聽眾記住什麼、有沒有自己的經驗或例子），再依我的回答來做。'];
  // o: 表單值；ctx: { theme }
  function aiPrompt(o, ctx) {
    const theme = ctx && ctx.theme, n = Number(o.pages) || 10;
    const lines = [
      '請幫我寫一份網頁簡報的內容。',
      `主題：${o.topic.trim()}`,
      `對象：${o.aud.trim() || '（還沒決定）'}`,
      `長度：${n} 頁${o.min ? `，報告時間約 ${o.min} 分鐘` : ''}`,
      TONES.includes(o.tone) ? `語氣：${o.tone}` : '',
    ].concat(ideaLines(o), [
      theme ? `簡報風格：${theme.name}（${theme.desc}）用字請配合這個風格和對象。` : '',
      '如果有不清楚或缺少的資訊（例如對象、報告時間、資料來源），請先問我，確認後再寫。',
      '',
      '請完全照下面的格式輸出，整份放在一個程式碼區塊裡，我會把它貼回「網頁簡報範本庫」直接變成簡報：',
    ], RULES(o.notes), ['', '格式範例：'], SHORT_EX(o.notes));
    return lines.filter((l, k) => l !== '' || lines[k - 1] !== '').join('\n');
  }

  // 請 AI 直接做成一個完整的網頁簡報（設計交給 AI）
  function htmlPrompt(o, ctx) {
    const t = ctx.theme, st = ctx.style || {}, v = st.v || t.vars || {}, content = String(ctx.content || '').trim();
    const n = content && o.pages === 'same' ? seqOf(content).length : (Number(o.pages) || 10);
    const fonts = [...new Set((st.fonts || t.fonts || []).map(f => f.split(':')[0]))].join('、') || 'Noto Sans TC';
    const lines = [
      '請幫我做一份「網頁簡報」：一個完整、用瀏覽器打開就能播放的 HTML 檔。',
      `主題：${o.topic.trim()}`,
      `對象：${o.aud.trim() || '（還沒決定）'}`,
      `長度：${n} 頁${o.min ? `，報告時間約 ${o.min} 分鐘` : ''}`,
      TONES.includes(o.tone) ? `語氣：${o.tone}` : '',
      ...ideaLines(o),
      content ? (seqOf(content).length === n ? '簡報內容請照下面這份來做，一頁對一頁；' : `簡報內容請照下面這份來做。這份有 ${seqOf(content).length} 頁，請調整成 ${n} 頁（${n > seqOf(content).length ? '依主題補充內容' : '合併或刪減比較次要的頁'}）；`) + '文字可以潤飾，但不要改掉重點、數字和資料來源。「=== 」開頭是每一頁的版面，「備註：」是講稿：' :'內容請你依主題規劃，數字和資料要有可靠來源，不確定就標「（請查證）」。',
      content ? '```\n' + content.replace(/^(\s*!\[.*?\]\().*?(\))/gm, '$1$2') + '\n```' : '',
      '',
      '設計：',
      `- 風格參考「${t.name}」：${t.desc}${st.pal ? `配色用「${st.pal}」：` : ''}主色 ${v.ac || ''}、背景 ${v.bg || ''}、文字 ${v.fg || ''}；字型用 Google Fonts 的 ${fonts}。這是我自己挑的風格，請照這個方向設計。`,
      '- 每頁是 16:9 的畫布（1280×720），等比例縮放、置中填滿視窗。',
      '- 每一頁的字都要完整放得下，不能被裁掉或超出畫面；字多就自動縮小，或拆成兩頁。',
      '- 版面要有變化：封面、目錄、重點、左右對照、大數字、步驟、引言、圖文、問答（點選項會顯示對錯和解答）、結尾。換頁和文字出現要有簡單動畫。',
      '- 需要圖片的地方，用 inline SVG 畫簡單、好看的插圖；不要連到外部圖片網址。',
      '',
      '操作：',
      '- ← → 鍵、空白鍵、點畫面、手機左右滑都能換頁；右下角顯示頁碼。',
      '- F 鍵全螢幕。' + (o.notes ? '每一頁都寫 2～3 句口語講稿，平常隱藏，按 N 鍵顯示在畫面下方。' : ''),
      '- 列印時一頁一張投影片（用 @media print 和 @page）。',
      '',
      '技術：',
      '- 全部寫在同一個 HTML 檔裡（CSS、JavaScript 都寫在裡面），除了 Google Fonts，不要用其他外部檔案或套件。',
      '- 用繁體中文（台灣用語）。資料來源放在相關頁面的下方或最後一頁，字小一點。不要編造數據和名人名言。',
      '',
      '如果有不清楚或缺少的資訊（例如對象、報告時間、一定要講的重點），請先問我，確認後再做。',
      '做好後，把整個 HTML 放在一個程式碼區塊裡輸出，不要省略任何部分。',
    ];
    return lines.filter((l, k) => l !== '' || lines[k - 1] !== '').join('\n');
  }

  // 生圖提示詞：給 ChatGPT / Gemini 畫圖文頁的圖
  const IMG_STYLE = { 衛教: '清爽、親切的衛教扁平插畫', 長者: '溫暖柔和的扁平插畫，人物是台灣的長輩', 課堂: '活潑、乾淨的扁平插畫', 報告: '乾淨寫實的照片風格', 提案: '乾淨寫實的照片風格', 活動: '明亮活潑的插畫' };
  function imgPrompt(slot, theme, deck) {
    const v = theme.vars || {};
    return [
      `請幫我畫一張圖，要放在簡報「${deck}」第 ${slot.n} 頁「${slot.title || '圖文'}」。`,
      `畫面內容：${slot.alt || slot.title || '（請依頁面標題設計）'}`,
      `風格：${IMG_STYLE[theme.tags[0]] || '乾淨的扁平插畫'}；配色以 ${v.ac || ''} 和柔和的淺色為主，畫面簡單、留白多。`,
      '圖裡不要放任何文字、字母或數字。比例 4:3 橫式。',
      '如果畫面內容不夠清楚，先問我再畫。',
    ].join('\n');
  }

  // 貼回後格式有問題：請 AI 修正
  function fixPrompt(w, want) {
    return ['剛才的簡報內容貼回「網頁簡報範本庫」後，有這些地方要修正：']
      .concat(w.map(x => '- ' + x), want ? [`- 頁數要是 ${want} 頁，照原本指令的頁面安排補上或刪減`] : [], [want ? '其他已經寫好的內容盡量保留。' : '其他內容不要改。', '請把修正後的完整內容，整份重新放在一個程式碼區塊裡輸出。']).join('\n');
  }

  /* 風格面板：選項盡量畫出樣子，不用猜 */
  let chipFonts = false;
  function loadChipFonts() {
    if (chipFonts) return; chipFonts = true;
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@900&family=Huninn&family=LXGW+WenKai+TC:wght@700&family=Iansui&display=swap&text=' + encodeURIComponent('簡報Aa');
    document.head.appendChild(l);
  }
  const SECS = ['配色', '字體', '排版', '元素', '動畫', '播放'];
  const SEC_TIP = { 配色: '只換顏色，版面和裝飾不變', 字體: '標題和內文用的字', 排版: '對齊、字的大小、留白、頁碼', 元素: '項目符號、卡片、標題的樣子', 動畫: '點一個，右邊的預覽會示範一次', 播放: '播放時怎麼操作' };
  const BUL = { dot: '●', square: '■', check: '✓', arrow: '→', dash: '–', none: '' };
  // 一個選項的小示意圖；沒有就回傳空字串（只顯示文字）
  function vis(o, it, theme) {
    const k = o.key, v = it.v, tv = theme.vars || {};
    if (k === 'palette') { const c = it.sw || [tv.bg, tv.ac, tv.ac2 || tv.ac, tv.fg]; return `<span class="mini pal" style="background:${esc(c[0])};color:${esc(c[3])}"><b>標題</b><i style="background:${esc(c[1])}"></i><i style="background:${esc(c[2])}"></i></span>`; }
    if (k === 'font') return `<span class="mini fnt" style="font-family:${esc(it.ff || tv.hf || 'inherit')}">簡報 Aa</span>`;
    if (k === 'bullet') return v ? `<span class="mini bul">${[1, 2].map(j => `<i>${v === 'num' ? j + '.' : BUL[v]}</i><s></s>`).join('')}</span>` : '';
    if (k === 'heading') return v ? `<span class="mini hd hd-${v}"><b>標題</b></span>` : '';
    if (k === 'card') return v ? `<span class="mini cd cd-${v}"><i></i><i></i></span>` : '';
    if (k === 'align') return `<span class="mini al al-${v || 'left'}"><s></s><s></s><s></s></span>`;
    if (k === 'valign') return `<span class="mini va va-${v || 'mid'}"><s></s><s></s></span>`;
    if (k === 'size') return `<span class="mini sz" style="font-size:${{ s: 12, '': 15, l: 19, xl: 24 }[v]}px">字</span>`;
    if (k === 'space') return `<span class="mini spc spc-${v || 'std'}"><s></s><s></s><s></s></span>`;
    return '';
  }
  function optHtml(o, cfg, theme) {
    if (o.type === 'check') {
      const v = cfg[o.key] == null ? !!o.def : cfg[o.key];
      return `<label class="ck"><input type="checkbox" data-k="${o.key}"${v ? ' checked' : ''}> ${o.n}${o.tip ? `<small>${o.tip}</small>` : ''}</label>`;
    }
    if (o.type === 'color') {
      const base = /^#[0-9a-f]{6}$/i.test(theme.vars.ac) ? theme.vars.ac : '#C95F33';
      return `<div class="orow"><span class="ol">${o.n}</span><div class="ochips"><input type="color" data-k="${o.key}" value="${cfg.accent || base}" aria-label="自訂主色"><button type="button" class="och" data-clear="accent" aria-pressed="${!cfg.accent}">不用自訂</button></div></div>`;
    }
    if (o.type === 'text') return `<label class="orow"><span class="ol">${o.n}</span><input type="text" class="otext" data-k="${o.key}" maxlength="40" value="${esc(cfg[o.key] || '')}" placeholder="${esc(o.ph || '')}"></label>`;
    const ms = o.items.map(it => vis(o, it, theme)), any = ms.some(Boolean);
    return `<div class="orow${any ? ' visrow' : ''}"><span class="ol">${o.n}</span><div class="ochips">${o.items.map((it, j) => `<button type="button" class="och${any ? ' vis' : ''}" data-k="${o.key}" data-v="${it.v}" aria-pressed="${(cfg[o.key] || '') === it.v}">${ms[j]}<span class="onm">${esc(it.n)}</span></button>`).join('')}</div></div>`;
  }
  function setPanel(cfg, theme) {
    loadChipFonts();
    const v = theme.vars || {};
    return `<section class="setp" id="setp" aria-label="風格設定" style="--pa:${esc(cfg.accent || v.ac || '#C95F33')}">
  ${SECS.map(t => `<div class="pane ssec" data-sec="${t}"><h2>${t} <small>${SEC_TIP[t]}</small></h2><div class="olist">${E.OPTS.filter(o => o.tab === t).map(o => optHtml(o, cfg, theme)).join('')}${t === '播放' ? '<p class="hint">講者模式：播放時按右下角的講台圖示（或 P 鍵），另開一個有講稿、下一頁和計時的視窗。手機遙控：按手機圖示（或 R 鍵），用手機掃 QR code。</p>' : ''}</div></div>`).join('')}
  <div class="set-f"><button type="button" class="btn sm ghost" id="sReset">${ICON.reset}全部恢復範本預設</button><span class="hint">配色、字體和上面所有調整都會回到這套範本原本的樣子</span></div>
</section>`;
  }
  function bindSet(box, get, set, getTheme) {
    let tt = 0;
    const redraw = () => { const c = get(); $$('.och[data-k]', box).forEach(b => b.setAttribute('aria-pressed', (c[b.dataset.k] || '') === b.dataset.v)); const cl = $('[data-clear=accent]', box); if (cl) cl.setAttribute('aria-pressed', !c.accent); };
    box.addEventListener('click', e => {
      const b = e.target.closest('.och'); if (!b) return;
      const c = Object.assign({}, get());
      if (b.dataset.clear) delete c[b.dataset.clear]; else if (b.dataset.v) c[b.dataset.k] = b.dataset.v; else delete c[b.dataset.k];
      set(c); redraw();
    });
    box.addEventListener('change', e => { const x = e.target; if (x.type === 'checkbox' && x.dataset.k) { const c = Object.assign({}, get()); c[x.dataset.k] = x.checked; set(c); } });
    box.addEventListener('input', e => {
      const x = e.target; if (!x.dataset.k || x.type === 'checkbox') return;
      clearTimeout(tt); tt = setTimeout(() => { const c = Object.assign({}, get()); if (x.value.trim()) c[x.dataset.k] = x.value; else delete c[x.dataset.k]; set(c); redraw(); }, x.type === 'color' ? 120 : 400);
    });
    $('#sReset', box).onclick = () => {
      set({});
      const tmp = document.createElement('div'); tmp.innerHTML = setPanel({}, getTheme());
      box.replaceWith(tmp.firstElementChild);
      bindSet($('#setp'), get, set, getTheme);
      toast('已恢復範本預設的樣式');
    };
  }

  // 「加一頁」按鈕上的版面小圖
  const W = (inner) => `<svg viewBox="0 0 32 20" aria-hidden="true">${inner}</svg>`;
  const WIRE = {
    cover: W('<rect x="6" y="6" width="20" height="4" rx="1"/><rect x="10" y="12" width="12" height="2" rx="1" opacity=".5"/>'),
    agenda: W('<circle cx="7" cy="5" r="1.6"/><rect x="11" y="4" width="15" height="2" rx="1" opacity=".5"/><circle cx="7" cy="10" r="1.6"/><rect x="11" y="9" width="15" height="2" rx="1" opacity=".5"/><circle cx="7" cy="15" r="1.6"/><rect x="11" y="14" width="15" height="2" rx="1" opacity=".5"/>'),
    section: W('<rect x="5" y="4" width="6" height="7" rx="1"/><rect x="5" y="13" width="18" height="3" rx="1" opacity=".5"/>'),
    bullets: W('<rect x="5" y="3" width="14" height="3" rx="1"/><rect x="5" y="9" width="2" height="2"/><rect x="9" y="9" width="17" height="2" rx="1" opacity=".5"/><rect x="5" y="14" width="2" height="2"/><rect x="9" y="14" width="17" height="2" rx="1" opacity=".5"/>'),
    two: W('<rect x="5" y="3" width="14" height="3" rx="1"/><rect x="5" y="8" width="10" height="9" rx="1" opacity=".5"/><rect x="17" y="8" width="10" height="9" rx="1" opacity=".5"/>'),
    stats: W('<rect x="4" y="5" width="7" height="7" rx="1"/><rect x="12.5" y="5" width="7" height="7" rx="1"/><rect x="21" y="5" width="7" height="7" rx="1"/><rect x="4" y="14" width="24" height="2" rx="1" opacity=".4"/>'),
    quote: W('<path d="M5 5h4v4H7.5L6.5 12H5z"/><rect x="12" y="6" width="15" height="2" rx="1" opacity=".5"/><rect x="12" y="10" width="11" height="2" rx="1" opacity=".5"/><rect x="18" y="15" width="9" height="1.6" rx=".8" opacity=".35"/>'),
    steps: W('<rect x="6" y="9.2" width="20" height="1.6" opacity=".35"/><circle cx="6" cy="10" r="2.6"/><circle cx="16" cy="10" r="2.6"/><circle cx="26" cy="10" r="2.6"/>'),
    image: W('<rect x="4" y="4" width="11" height="12" rx="1"/><rect x="18" y="5" width="10" height="2.6" rx="1"/><rect x="18" y="10" width="10" height="2" rx="1" opacity=".5"/><rect x="18" y="14" width="7" height="2" rx="1" opacity=".5"/>'),
    quiz: W('<rect x="5" y="3" width="16" height="3" rx="1"/><rect x="5" y="8" width="10" height="4" rx="1" opacity=".5"/><rect x="17" y="8" width="10" height="4" rx="1"/><rect x="5" y="13.5" width="10" height="4" rx="1" opacity=".5"/><rect x="17" y="13.5" width="10" height="4" rx="1" opacity=".5"/>'),
    end: W('<rect x="8" y="7" width="16" height="4" rx="1"/><rect x="12" y="13" width="8" height="2" rx="1" opacity=".5"/>'),
  };

  function viewEdit(want) {
    document.title = '編輯器｜網頁簡報範本庫';
    let d = store.get('wst-draft', isDraft);
    let note = '';
    if (!d) {
      const t = want || THEMES[0];
      d = { theme: t.id, src: SAMPLES[t.sample] };
    } else if (!byId(d.theme)) {
      d.theme = (want || THEMES[0]).id;   // 範本不見了：換一套，但保留內容
    } else if (want && want.id !== d.theme) {
      if (isSample(d.src)) d.src = SAMPLES[want.sample];
      else note = `沿用你上次寫的內容，換成「${want.name}」的樣子。想重來可以按「換回範例內容」。`;
      d.theme = want.id;
      if (d.cfg && typeof d.cfg === 'object') { delete d.cfg.palette; delete d.cfg.accent; delete d.cfg.font; }   // 挑了新範本：配色、字體回到範本原樣
    }
    let cfg = E.cleanCfg(d.cfg);
    d.cfg = cfg;
    store.set('wst-draft', d);
    let theme = byId(d.theme);
    const ai = Object.assign({ topic: '', aud: '', pages: '10', min: '', must: '', tone: '', notes: true, mode: 'free' }, store.get('wst-ai', isAi) || {});
    if (!['free', 'html'].includes(ai.mode)) ai.mode = 'free';
    const PAGE_OPTS = [6, 8, 10, 12, 15, 20, 25, 30];

    view.innerHTML = `
<div class="ed-top">
  <h1>編輯器</h1>
  <button type="button" class="stylechip" id="eStyle" title="換範本、配色、字體">風格：<b></b><span>換風格</span></button>
  <span class="sp"></span>
  <button class="btn dark" id="ePlay">${ICON.play}全螢幕播放</button>
  <button class="btn" id="eDl">${ICON.dl}下載 HTML</button>
  <button class="btn" id="ePdf">${ICON.pdf}存成 PDF</button>
</div>
<div class="ed">
  <div class="ed-l">
    <div class="steps" role="tablist" aria-label="製作步驟">
      <button type="button" role="tab" data-step="content" aria-selected="true"><b>1</b><span>內容<small>要講什麼</small></span></button>
      <button type="button" role="tab" data-step="style" aria-selected="false"><b>2</b><span>風格<small>長什麼樣子</small></span></button>
      <span class="steps-end"><b>3</b><span>播放或下載<small>用右上角的按鈕</small></span></span>
    </div>
    <div class="stepp" data-step="content">
    <details class="ai" id="aiBox"${isSample(d.src) ? ' open' : ''}>
      <summary>請 AI 幫你做 <small>ChatGPT、Gemini 都可以</small></summary>
      <div class="in">
        <div class="amode" role="group" aria-label="要 AI 做到哪裡">
          <button type="button" class="acard" data-mode="free"><svg viewBox="0 0 56 32" aria-hidden="true"><rect x="2" y="5" width="18" height="22" rx="2" class="a1"/><path d="M6 11h10M6 15h10M6 19h6" class="a2"/><path d="M24 16h7m-3-3 3 3-3 3" class="a3"/><rect x="35" y="7" width="19" height="13" rx="2" class="a4"/><path d="M39 12h8M39 15.5h5" class="a5"/><path d="M41 24h7" class="a3"/></svg><span><b>AI 寫內容，風格我自己挑</b><small>AI 寫好文字後貼回這裡，再到「風格」換範本、配色、字體。可以用講者模式和手機遙控。</small></span><em class="badge">建議</em></button>
          <button type="button" class="acard" data-mode="html"><svg viewBox="0 0 56 32" aria-hidden="true"><path d="M10 6l1.6 4.4L16 12l-4.4 1.6L10 18l-1.6-4.4L4 12l4.4-1.6z" class="a4"/><path d="M22 16h7m-3-3 3 3-3 3" class="a3"/><rect x="33" y="5" width="21" height="22" rx="2" class="a1"/><path d="M33 10h21" class="a2"/><rect x="37" y="14" width="13" height="4" rx="1" class="a4"/><path d="M37 22h9" class="a2"/></svg><span><b>AI 連設計一起做成網頁</b><small>AI 直接給你一個完整的網頁簡報，設計由它發揮，會參考你挑的風格。拿到後不能在這裡再調整。</small></span></button>
        </div>
        <p class="hint aseq" id="aSeq"></p>
        <label class="fld">主題（必填）<input id="aTopic" value="${esc(ai.topic)}" placeholder="例如：高血壓的居家量測"></label>
        <label class="fld">我的想法 <small>最想讓大家記住什麼？有沒有自己的經驗、例子、一定要講的重點？寫了，簡報才會是你的</small><textarea id="aMust" rows="3" placeholder="例如：我阿嬤每天早上量血壓但常量錯，我想教大家三個最容易忽略的步驟。沒想法也沒關係，AI 會先問你幾個問題。">${esc(ai.must)}</textarea></label>
        <div class="f2">
          <label class="fld">對象<input id="aAud" value="${esc(ai.aud)}" placeholder="例如：社區長輩、國中生"></label>
          <label class="fld">語氣<select id="aTone"><option value="">不指定</option>${TONES.map(t => `<option${ai.tone === t ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        </div>
        <div class="f2">
          <div class="fld">頁數<div class="pgs"><select id="aPages" aria-label="頁數"><option value="same">跟我的內容一樣</option>${PAGE_OPTS.map(n => `<option>${n}</option>`).join('')}<option value="custom">自訂…</option></select><input id="aPagesN" type="number" min="3" max="60" inputmode="numeric" aria-label="自訂頁數" placeholder="頁" hidden></div></div>
          <label class="fld">報告時間（分鐘）<input id="aMin" inputmode="numeric" value="${esc(ai.min)}" placeholder="可以不填"></label>
        </div>
        <label class="ck"><input type="checkbox" id="aNotes"${ai.notes !== false ? ' checked' : ''}> 也請 AI 寫每一頁的講稿 <small>講者模式和手機遙控上看得到，台下看不到</small></label>
        <div class="acts">
          <button class="btn pri" id="aGPT">${ICON.copy}複製並打開 ChatGPT</button>
          <button class="btn" id="aGem">${ICON.copy}複製並打開 Gemini</button>
          <button class="btn ghost" id="aCopy">只複製</button>
        </div>
        <p class="hint" id="aBack">AI 寫好後，按它程式碼區塊右上角的「複製」，再到下面按「清空並貼上」。AI 若先問你問題，回答完它才會開始寫。貼回來如果頁數不對或格式有問題，下面會出現「複製修正指令給 AI」。</p>
        <div class="hbox" id="aHtmlBox" hidden>
          <p class="hint">AI 做好後，複製它的整段 HTML，按下面的按鈕貼上，就能預覽和下載。ChatGPT 和 Gemini 的 Canvas 也能直接預覽。這種網頁由 AI 自己設計，跟右邊的預覽不會一模一樣，也不能用這裡的風格設定、講者模式和手機遙控。</p>
          <button class="btn" id="aHtmlOpen">${ICON.play}預覽 AI 做好的網頁</button>
        </div>
      </div>
    </details>
    <div class="pane">
      <h2>簡報內容 <small>一行「=== 版面」就是新的一頁</small><span style="margin-left:auto;display:flex;gap:6px"><button class="btn sm" id="ePaste">清空並貼上</button><button class="btn sm ghost" id="eReset" title="換回這個範本的範例內容">${ICON.reset}換回範例內容</button></span></h2>
      <textarea id="src" spellcheck="false" aria-label="簡報內容">${esc(d.src)}</textarea>
      <div class="ins"><span>加一頁（會加在游標所在那一頁的後面）：</span>${E.TYPES.map(t => `<button type="button" data-k="${t.k}" title="${esc(t.tip)}">${WIRE[t.k] || ''}${t.n}</button>`).join('')}</div>
      <div class="warn" id="eWarn"></div>
      <div class="afix" id="eFix" hidden><span id="eFixMsg"></span><button type="button" class="btn sm" id="eFixBtn">${ICON.copy}複製修正指令給 AI</button></div>
      <div class="okline" id="eOk"></div>
    </div>
    <div class="pane imgp" id="imgp">
      <h2>圖片 <small>圖文頁的圖；也可以在內容框直接貼上圖片</small><span class="iha" id="imgHead"></span></h2>
      <div id="imgList"></div>
      <input type="file" id="imgFile" accept="image/*" hidden>
    </div>
    <button type="button" class="btn nextstep" data-go="style">內容寫好了，下一步：挑風格 →</button>
    </div>
    <div class="stepp" data-step="style" hidden>
      <div class="mysty" id="mySty" aria-live="polite"></div>
      <div class="pane tsec" id="tplSec">
        <h2>範本 <small>整套設計一起換：版面、裝飾、配色、字體。縮圖是你的封面</small></h2>
        <div class="chips tfil" role="group" aria-label="用途"><button type="button" class="chip" data-tag="" aria-pressed="true">全部</button>${TAGS.map(t => `<button type="button" class="chip" data-tag="${t}" aria-pressed="false">${t}</button>`).join('')}</div>
        <div class="tgrid" id="tGrid"></div>
      </div>
      ${setPanel(cfg, theme)}
    </div>
  </div>
  <div class="prev-wrap">
    <div class="player"><iframe id="prev" title="簡報預覽" allow="fullscreen" allowfullscreen></iframe></div>
    <div class="pbar">
      <button class="btn sm" id="pPrev" aria-label="上一頁">‹</button>
      <span class="pg" id="pPg">1 / 1</span>
      <button class="btn sm" id="pNext" aria-label="下一頁">›</button>
      <span class="pdemo" id="pDemo">游標在哪一頁，預覽就跳到哪一頁</span>
    </div>
    <p class="hint phint">格式不熟？看 <a href="#guide">使用說明</a>。內容和設定會自動存在這台電腦的瀏覽器裡。</p>
  </div>
</div>`;
    const ta = $('#src'), prev = $('#prev');
    let ready = false, at = 0, t1 = 0, fromAI = false, wantN = 0, fixList = [], fixPage = 0, fitW = [], onReady = null;
    if (note) toast(note, 4800);

    const slideAt = () => {
      const caretLine = ta.value.slice(0, ta.selectionStart).split('\n').length - 1;
      const sl = E.parse(ta.value); let k = 0;
      sl.forEach((s, j) => { if (s.line <= caretLine) k = j; });
      return k;
    };
    const check = () => {
      const sl = E.parse(ta.value), w = E.warnings(sl).concat(fitW);
      $('#eWarn').innerHTML = w.length ? `<ul>${w.slice(0, 6).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
      $('#eOk').textContent = !w.length && sl.length ? `共 ${sl.length} 頁，格式都正確` : '';
      const pm = fromAI && wantN && sl.length && sl.length !== wantN ? `AI 寫了 ${sl.length} 頁，你要的是 ${wantN} 頁。` : '';
      const show = !!(fromAI && sl.length && (w.length || pm));
      fixList = w.slice(); fixPage = pm ? wantN : 0;
      $('#eFix').hidden = !show;
      $('#eFixMsg').textContent = show ? (pm || '貼回的內容有格式問題。') + '可以請 AI 修正：' : '';
      drawMode(); drawImgs();
    };
    const full = (start) => { ready = false; prev.srcdoc = E.build(theme, ta.value, Object.assign(deckOpt(cfg), { start: start == null ? at : start })); };
    const swap = () => {
      const sl = E.parse(ta.value);
      if (!ready || !sl.length) return full();
      send(prev, { swap: E.cells(sl, cfg, IMGS), at });
    };
    hookFrame(prev, m => {
      if (typeof m.slide === 'number') { $('#pPg').textContent = `${m.slide + 1} / ${m.total}`; if (!ready) { ready = true; if (onReady) { const f = onReady; onReady = null; setTimeout(f, 250); } } }
      if (Array.isArray(m.fit)) {
        const nw = m.fit.map(([j, z]) => `第 ${j + 1} 頁字太多，已自動縮小到 ${Math.round(z * 100)}%，建議刪減或拆成兩頁`);
        if (nw.join() !== fitW.join()) { fitW = nw; check(); }
      }
    });
    const save = () => store.set('wst-draft', { theme: theme.id, src: ta.value, cfg });

    // 改一個設定：預覽跳到看得出差別的那一頁，並示範效果
    const optName = (k, val) => { const o = E.OPTS.find(x => x.key === k); if (!o) return ''; const it = (o.items || []).find(x => x.v === (val == null ? '' : String(val))); return o.n + (it ? `「${it.n}」` : o.type === 'check' ? (val ? '：開' : '：關') : ''); };
    const DEMO = {
      bullet: ['bullets', 'image', 'agenda'], heading: ['bullets', 'two', 'stats'], card: ['two', 'stats', 'quiz'],
      align: ['bullets', 'two'], valign: ['bullets', 'image'], size: ['bullets', 'two'], space: ['bullets', 'two'],
      footer: ['bullets', 'two', 'stats'], footText: ['bullets', 'two', 'stats'], anim: ['bullets', 'steps', 'stats'], step: ['bullets', 'agenda', 'steps'],
    };
    const findType = types => { const sl = E.parse(ta.value); const cur = sl[at]; if (cur && types.includes(cur.type)) return at; for (const t of types) { const j = sl.findIndex(x => x.type === t); if (j >= 0) return j; } return at; };
    const demo = (k, val) => {
      const N = E.parse(ta.value).length, name = optName(k, val);
      let start = at, then = null, msg = name ? `預覽：${name}` : '預覽已更新';
      if (k === 'tr' || k === 'speed') {
        const j = Math.min(at, Math.max(0, N - 2)); start = j;
        then = () => send(prev, { go: j + 1 }); msg += `（第 ${j + 1} → ${j + 2} 頁）`;
      } else if (k === 'anim' || k === 'step') {
        const j = findType(DEMO[k]); start = j > 0 ? j - 1 : Math.min(1, N - 1);
        then = () => { send(prev, { go: j, f: 0 }); if (cfg.step) { setTimeout(() => send(prev, { key: 'ArrowRight' }), 700); setTimeout(() => send(prev, { key: 'ArrowRight' }), 1400); } };
        msg += k === 'step' && cfg.step ? `（第 ${j + 1} 頁，按 → 一個一個出現）` : `（第 ${j + 1} 頁）`;
      } else if (DEMO[k]) { start = findType(DEMO[k]); msg += `（第 ${start + 1} 頁）`; }
      else if (k === 'toc') { if (on(cfg, 'toc')) { then = () => send(prev, { key: 't' }); msg += '（按 T 或右下角圖示打開）'; } }
      else if (k === 'nav') msg += cfg.nav ? '（在預覽裡捲動看看）' : '';
      else if (['snap', 'auto', 'remote'].includes(k)) msg += '：播放時才看得出來';
      at = start; full(start); onReady = then;
      $('#pDemo').textContent = msg; $('#pDemo').classList.add('on');
      const r = prev.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) prev.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    const on = (c, k) => { const o = E.OPTS.find(x => x.key === k); return c[k] == null ? !!(o && o.def) : !!c[k]; };
    const applyCfg = v => {
      const old = cfg; cfg = E.cleanCfg(v); save();
      const ks = [...new Set(Object.keys(old).concat(Object.keys(cfg)))].filter(k => JSON.stringify(old[k]) !== JSON.stringify(cfg[k]));
      if (ks.length === 1) demo(ks[0], cfg[ks[0]]); else { full(); $('#pDemo').textContent = ks.length ? '預覽：已恢復範本預設' : '游標在哪一頁，預覽就跳到哪一頁'; }
      drawSty(); drawMode();
    };
    const redrawSet = () => { const tmp = document.createElement('div'); tmp.innerHTML = setPanel(cfg, theme); $('#setp').replaceWith(tmp.firstElementChild); bindSet($('#setp'), () => cfg, applyCfg, () => theme); };
    bindSet($('#setp'), () => cfg, applyCfg, () => theme);

    // 我的風格：範本＋配色＋字體一眼看到，改過的可以一鍵改回範本原樣
    const palOf = () => (cfg.palette && E.PALETTES[cfg.palette]) || null, fontOf = () => (cfg.font && E.FONTS[cfg.font]) || null;
    const styleName = () => theme.name + (palOf() ? `＋${palOf().n}配色` : '');
    function drawSty() {
      const pal = palOf(), f = fontOf(), others = Object.keys(cfg).filter(k => !['palette', 'font', 'accent'].includes(k)).length;
      const un = (k, t) => `<button type="button" data-un="${k}" aria-label="${t}" title="${t}">✕</button>`;
      $('#mySty').innerHTML = `<span class="ms-l">我的風格</span><span class="ms"><small>範本</small><b>${esc(theme.name)}</b></span>` +
        `<span class="ms${pal ? ' chg' : ''}"><small>配色</small><b>${pal ? esc(pal.n) : '範本原色'}</b>${pal ? un('palette', '配色改回範本原色') : ''}</span>` +
        (cfg.accent ? `<span class="ms chg"><small>主色</small><i style="background:${esc(cfg.accent)}"></i>${un('accent', '不用自訂主色')}</span>` : '') +
        `<span class="ms${f ? ' chg' : ''}"><small>字體</small><b>${f ? esc(f.n) : '範本原樣'}</b>${f ? un('font', '字體改回範本原樣') : ''}</span>` +
        (others ? `<span class="ms chg"><small>其他調整</small><b>${others} 項</b></span>` : '');
      const es = $('#eStyle'); es.dataset.theme = theme.id; es.querySelector('b').textContent = styleName();
      $$('#tGrid .tcard').forEach(b => b.setAttribute('aria-pressed', b.dataset.theme === theme.id));
    }
    $('#mySty').addEventListener('click', e => { const b = e.target.closest('[data-un]'); if (!b) return; const c = Object.assign({}, cfg); delete c[b.dataset.un]; applyCfg(c); redrawSet(); });

    // 範本卡片：用你的封面畫出每一套的樣子
    const coverSrc = () => { const first = ta.value.split(/\n(?=[ \t]*={3,})/)[0]; return /\S/.test(first) ? first : SAMPLES[theme.sample]; };
    let thumbSig = null, tfil = '';
    const tio = 'IntersectionObserver' in window ? new IntersectionObserver(ents => ents.forEach(en => {
      if (!en.isIntersecting) return; const f = en.target; tio.unobserve(f); f.srcdoc = E.build(byId(f.dataset.id), f._src, { mode: 'thumb', images: IMGS });
    }), { rootMargin: '200px' }) : null;
    cleanup = () => tio && tio.disconnect();
    function drawThumbs() {
      const src = coverSrc(), sig = src + '|' + tfil; if (sig === thumbSig) return; thumbSig = sig;
      const list = THEMES.filter(t => !tfil || t.tags.includes(tfil));
      $('#tGrid').innerHTML = list.map(t => `<button type="button" class="tcard" data-theme="${t.id}" aria-pressed="${t.id === theme.id}" title="${esc(t.desc)}"><span class="thumb"><iframe title="${esc(t.name)}" data-id="${t.id}" tabindex="-1" aria-hidden="true"></iframe></span><b>${esc(t.name)}</b></button>`).join('');
      $$('#tGrid iframe').forEach(f => { f._src = src; if (tio) tio.observe(f); else f.srcdoc = E.build(byId(f.dataset.id), src, { mode: 'thumb', images: IMGS }); });
    }
    const setTheme = nt => {
      if (!nt || nt.id === theme.id) return;
      if (isSample(ta.value)) { ta.value = SAMPLES[nt.sample]; at = 0; }
      const had = cfg.palette || cfg.accent || cfg.font, c = Object.assign({}, cfg);
      delete c.palette; delete c.accent; delete c.font;
      theme = nt; cfg = E.cleanCfg(c); save(); full(); check(); redrawSet(); drawSty(); drawMode(); drawThumbs();
      history.replaceState(null, '', '#edit/' + nt.id);
      $('#pDemo').textContent = `預覽：範本「${nt.name}」`;
      toast(had ? `已換成「${nt.name}」，配色和字體也回到這套範本的原樣。內容沒有變` : `已換成「${nt.name}」，內容沒有變`, 3600);
    };
    $('#tGrid').addEventListener('click', e => { const b = e.target.closest('.tcard'); if (b) setTheme(byId(b.dataset.theme)); });
    $('.tfil').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; tfil = b.dataset.tag; $$('.tfil .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); drawThumbs(); });

    // 步驟：內容／風格
    let stepNow = 'content';
    const showStep = (k, scroll) => {
      stepNow = k === 'style' ? 'style' : 'content';
      $$('.steps [data-step]').forEach(b => b.setAttribute('aria-selected', b.dataset.step === stepNow));
      $$('.stepp').forEach(x => { x.hidden = x.dataset.step !== stepNow; });
      if (stepNow === 'style') drawThumbs();
      if (scroll) { const r = $('.steps').getBoundingClientRect(); if (r.top < 0 || r.top > innerHeight * .6) $('.steps').scrollIntoView({ block: 'start' }); }
    };
    $('.steps').addEventListener('click', e => { const b = e.target.closest('[data-step]'); if (b) showStep(b.dataset.step); });
    $('#eStyle').onclick = () => showStep('style', true);
    $('.nextstep').onclick = () => showStep('style', true);
    ta.addEventListener('input', () => { save(); clearTimeout(t1); t1 = setTimeout(() => { at = slideAt(); swap(); check(); }, 350); });
    const follow = () => { const k = slideAt(); if (k !== at) { at = k; send(prev, { go: k }); } };
    ta.addEventListener('click', follow); ta.addEventListener('keyup', e => { if (/Arrow|Page|Home|End/.test(e.key)) follow(); });
    $$('.ins button').forEach(b => b.addEventListener('click', () => {
      const v = ta.value, pos = ta.selectionEnd;
      const rest = v.slice(pos), nx = rest.search(/\n\s*={3,}/);
      const cut = nx < 0 ? v.length : pos + nx;
      const before = v.slice(0, cut).replace(/\s*$/, ''), after = v.slice(cut).replace(/^\s*\n/, '');
      const snip = SNIP[b.dataset.k];
      ta.value = (before ? before + '\n\n' : '') + snip + (after ? '\n\n' + after.replace(/^\n+/, '') : '');
      const caret = (before ? before.length + 2 : 0) + snip.indexOf('\n') + 1;
      ta.focus(); ta.setSelectionRange(caret, caret);
      save(); at = slideAt(); swap(); check();
    }));
    $('#eReset').onclick = () => {
      if (!isSample(ta.value) && !confirm('換回範例內容後，你現在寫的內容會被取代。確定嗎？')) return;
      ta.value = SAMPLES[theme.sample]; at = 0; save(); full(); check();
    };
    $('#ePaste').onclick = async () => {
      let txt = '';
      try { txt = navigator.clipboard && navigator.clipboard.readText ? await navigator.clipboard.readText() : ''; } catch (e) { txt = ''; }
      if (txt && /={3,}/.test(txt)) {
        ta.value = txt.replace(/^\s*```[^\n]*\n?/gm, '').trim(); at = 0; fromAI = true; save(); full(); check();
        toast($('#eFix').hidden ? `已貼上 AI 寫的內容，共 ${E.parse(ta.value).length} 頁` : '已貼上，有幾個地方要修正，看編輯區下面的提示', 4000);
      } else {
        if (!isSample(ta.value) && ta.value.trim() && !confirm('要清空現在的內容，再自己貼上嗎？')) return;
        ta.value = ''; ta.focus(); fromAI = true; save(); check();
        toast(txt ? '剪貼簿裡的內容不是簡報格式，請手動貼上（⌘V 或 Ctrl+V）' : '已清空，請按 ⌘V 或 Ctrl+V 貼上 AI 寫的內容', 4000);
      }
    };
    // 圖片：列出每一個圖文頁，可以上傳、換圖、複製生圖提示詞
    const slots = () => E.parse(ta.value).map((s, j) => ({ s, j })).filter(x => x.s.type === 'image').map(({ s, j }) => ({ j, n: j + 1, title: s.title.replace(/\*\*/g, ''), alt: s.img ? s.img.alt : '', src: s.img ? s.img.src : '', real: E.imgSrc(s.img ? s.img.src : '', IMGS) }));
    let imgSig = '', upJ = -1;
    const drawImgs = () => {
      const ss = slots(), sig = JSON.stringify(ss.map(x => [x.j, x.title, x.alt, x.src, !!x.real]));
      if (sig === imgSig) return; imgSig = sig;
      $('#imgHead').innerHTML = ss.length ? `<button class="btn sm ghost" id="imgAll">${ICON.copy}複製全部生圖提示詞</button>` : '';
      $('#imgList').innerHTML = ss.length ? ss.map(x => `<div class="irow" data-j="${x.j}">
        <div class="ith">${x.real ? `<img src="${esc(x.real)}" alt="">` : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/></svg>'}</div>
        <div class="iinfo"><b>第 ${x.n} 頁　${esc(x.title || '圖文')}</b><span>${esc(x.alt || '還沒寫畫面描述：在「![ ]」的中括號裡寫要畫什麼')}</span></div>
        <div class="iacts"><button type="button" class="btn sm${x.real ? '' : ' pri'}" data-a="up">${x.real ? '換一張' : '上傳圖片'}</button><button type="button" class="btn sm" data-a="pr">${ICON.copy}生圖提示詞</button>${x.real ? '<button type="button" class="btn sm ghost" data-a="rm">移除</button>' : ''}</div>
      </div>`).join('') + '<p class="hint">提示詞貼到 ChatGPT 或 Gemini 畫圖，下載後按「上傳圖片」。也可以把圖片直接拖到那一行。圖片只存在這台電腦，下載 HTML 時會一起放進檔案。</p>'
        : '<p class="hint">還沒有圖文頁。按上面「加一頁：圖文」，或在任何一頁加一行「![畫面描述]()」。</p>';
    };
    const setSrc = (j, src) => {
      const sl = E.parse(ta.value), s0 = sl[j]; if (!s0) return;
      const lines = ta.value.split('\n'), end = sl[j + 1] ? sl[j + 1].line : lines.length;
      let k = -1; for (let i = s0.line + 1; i < end; i++) if (/^\s*!\[/.test(lines[i])) { k = i; break; }
      if (k >= 0) lines[k] = lines[k].replace(/^(\s*!\[.*?\]\().*?(\).*)$/, (m0, a, b) => a + src + b);
      else { let ti = s0.line + 1; while (ti < end && !/^\s*#\s/.test(lines[ti])) ti++; lines.splice(ti < end ? ti + 1 : s0.line + 1, 0, `![圖片](${src})`); }
      ta.value = lines.join('\n'); at = j; save(); full(j); check();
    };
    const useFile = async (file, j) => {
      try { toast('處理圖片中…'); const id = await addImage(file); setSrc(j, 'img:' + id); toast('已放上圖片'); }
      catch (e) { toast(e.message || '圖片放不上去，請換一張試試', 3600); }
    };
    $('#imgList').addEventListener('click', e => {
      const b = e.target.closest('[data-a]'), row = e.target.closest('.irow'); if (!b || !row) return;
      const j = +row.dataset.j, x = slots().find(y => y.j === j); if (!x) return;
      if (b.dataset.a === 'up') { upJ = j; $('#imgFile').value = ''; $('#imgFile').click(); }
      else if (b.dataset.a === 'rm') setSrc(j, '');
      else if (b.dataset.a === 'pr') toast(copyNow(imgPrompt(x, theme, E.titleOf(E.parse(ta.value), theme.name))) ? '已複製提示詞，到 ChatGPT 或 Gemini 貼上，畫好後下載，再回來上傳' : '沒複製成功，請再試一次', 4200);
    });
    $('#imgHead').addEventListener('click', e => {
      if (!e.target.closest('#imgAll')) return;
      const deck = E.titleOf(E.parse(ta.value), theme.name), ss = slots();
      const all = `下面有 ${ss.length} 張簡報用的圖，請一張一張畫，每畫完一張就停下來，等我說「下一張」再畫下一張。\n\n` + ss.map((x, k) => `【第 ${k + 1} 張】\n` + imgPrompt(x, theme, deck)).join('\n\n');
      toast(copyNow(all) ? `已複製 ${ss.length} 張圖的提示詞` : '沒複製成功，請再試一次');
    });
    $('#imgFile').addEventListener('change', e => { const f = e.target.files[0]; if (f && upJ >= 0) useFile(f, upJ); });
    $('#imgList').addEventListener('dragover', e => { const row = e.target.closest('.irow'); if (row) { e.preventDefault(); row.classList.add('drop'); } });
    $('#imgList').addEventListener('dragleave', e => { const row = e.target.closest('.irow'); if (row) row.classList.remove('drop'); });
    $('#imgList').addEventListener('drop', e => { const row = e.target.closest('.irow'); if (!row) return; e.preventDefault(); row.classList.remove('drop'); const f = e.dataTransfer.files[0]; if (f) useFile(f, +row.dataset.j); });
    ta.addEventListener('paste', e => {
      const f = [...(e.clipboardData ? e.clipboardData.files : [])].find(x => /^image\//.test(x.type)); if (!f) return;
      e.preventDefault();
      const j = slideAt(), sl = E.parse(ta.value);
      if (sl[j] && sl[j].type === 'image') { useFile(f, j); return; }
      addImage(f).then(id => {
        const pos = ta.selectionStart, v = ta.value, eol = v.indexOf('\n', pos);
        const cut = eol < 0 ? v.length : eol, ins = `\n![圖片](img:${id})`;
        ta.value = v.slice(0, cut) + ins + v.slice(cut); ta.setSelectionRange(cut + ins.length, cut + ins.length);
        at = slideAt(); save(); full(); check(); toast('已放上圖片，這一頁會用圖文版面');
      }, er => toast(er.message || '圖片放不上去', 3600));
    });
    loadImgs().then(() => { if (/!\[[^\]]*\]\(img:/.test(ta.value)) full(); imgSig = ''; drawImgs(); });

    $('#pPrev').onclick = () => send(prev, { key: 'ArrowLeft' });
    $('#pNext').onclick = () => send(prev, { key: 'ArrowRight' });
    $('#ePlay').onclick = () => openDeck(theme, ta.value, '', cfg);
    $('#eDl').onclick = () => download(theme, ta.value, cfg);
    $('#ePdf').onclick = () => openDeck(theme, ta.value, '#print', cfg);

    // AI 小幫手：AI 寫內容（貼回來套風格）／AI 連設計一起做成網頁
    let mode = ai.mode;
    const mineOk = () => !isSample(ta.value) && E.parse(ta.value).length >= 2;
    const pagesVal = () => { const v = $('#aPages').value; if (v === 'same') return String(E.parse(ta.value).length || 10); if (v !== 'custom') return v; const n = Math.round(+$('#aPagesN').value); return n >= 3 ? String(Math.min(60, n)) : '10'; };
    const aiVals = () => ({ topic: $('#aTopic').value, aud: $('#aAud').value, pages: pagesVal(), psel: $('#aPages').value, min: $('#aMin').value.replace(/\D/g, ''), must: $('#aMust').value, tone: $('#aTone').value, notes: $('#aNotes').checked, mode });
    const effStyle = () => { const v = Object.assign({}, theme.vars, palOf() ? palOf().v : {}); if (cfg.accent) v.ac = cfg.accent; return { v, pal: palOf() ? palOf().n : '', fonts: fontOf() ? fontOf().g : null }; };
    const aiCtx = () => ({ theme, style: effStyle(), content: mode === 'html' && mineOk() ? ta.value : '' });
    function drawMode() {
      if (!$('#aPages')) return;
      $$('.amode [data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === mode));
      const ps = $('#aPages'), so = ps.querySelector('[value=same]');
      const has = mode === 'html' && mineOk(), n = has ? E.parse(ta.value).length : 0;
      so.hidden = so.disabled = !has; if (!has && ps.value === 'same') ps.value = '10';
      so.textContent = `跟我的內容一樣（${n} 頁）`;
      $('#aPagesN').hidden = ps.value !== 'custom';
      $('#aHtmlBox').hidden = mode !== 'html'; $('#aBack').hidden = mode === 'html';
      $('#aSeq').textContent = mode === 'html'
        ? (has ? `會把你下面寫的內容（${n} 頁）交給 AI，請它設計成完整的網頁，風格參考「${styleName()}」。` : `AI 會依你的主題和想法規劃內容，風格參考「${styleName()}」。想照自己的內容做，先把內容寫進下面的框。`)
        : `AI 寫好後貼回下面的框，就會套上你的風格「${styleName()}」；之後隨時可以換。`;
    }
    if (ai.psel === 'same') $('#aPages').value = 'same';
    else if ([...$('#aPages').options].some(x => x.value === String(ai.pages) && x.value !== 'same')) $('#aPages').value = String(ai.pages);
    else if (+ai.pages >= 3) { $('#aPages').value = 'custom'; $('#aPagesN').value = ai.pages; }
    else $('#aPages').value = '10';
    drawMode(); drawSty();

    $('.amode').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (!b) return; mode = b.dataset.mode; drawMode(); store.set('wst-ai', aiVals()); });
    $('#aPages').addEventListener('change', () => { drawMode(); if ($('#aPages').value === 'custom') { $('#aPagesN').focus(); } });
    ['aTopic', 'aAud', 'aTone', 'aPages', 'aPagesN', 'aMin', 'aMust', 'aNotes'].forEach(id => { const x = $('#' + id); x.addEventListener('input', () => store.set('wst-ai', aiVals())); x.addEventListener('change', () => store.set('wst-ai', aiVals())); });
    const goAI = url => {
      const o = aiVals();
      if (!o.topic.trim()) { toast('先寫上簡報主題'); $('#aTopic').focus(); return; }
      store.set('wst-ai', o);
      if ($('#aPages').value === 'custom' && !(+$('#aPagesN').value >= 3)) { toast('自訂頁數請填 3～60'); $('#aPagesN').focus(); return; }
      wantN = o.mode === 'html' ? 0 : Number(o.pages) || 10;
      const ok = copyNow(o.mode === 'html' ? htmlPrompt(o, aiCtx()) : aiPrompt(o, aiCtx()));
      if (url) {
        window.open(url, '_blank', 'noopener');
        toast(ok ? '已複製指令，到新分頁的對話框貼上（⌘V 或 Ctrl+V）送出' : '沒複製成功，請按「只複製」再試一次', 4200);
      } else toast(ok ? '已複製給 AI 的指令' : '沒複製成功，請再試一次');
    };
    $('#aGPT').onclick = () => goAI('https://chatgpt.com/');
    $('#aGem').onclick = () => goAI('https://gemini.google.com/app');
    $('#aCopy').onclick = () => goAI('');
    $('#eFixBtn').onclick = () => toast(copyNow(fixPrompt(fixList, fixPage)) ? '已複製修正指令，回到 AI 的對話貼上送出' : '沒複製成功，請再試一次', 4200);
    if (openAI) { openAI = false; showStep('content'); $('#aiBox').open = true; mode = 'free'; drawMode(); store.set('wst-ai', aiVals()); setTimeout(() => $('#aTopic').focus(), 60); }
    $('#aHtmlOpen').onclick = () => htmlViewer();
    window.WST_APP = { step: () => stepNow, theme: () => theme.id, aiPrompt: () => mode === 'html' ? htmlPrompt(aiVals(), aiCtx()) : aiPrompt(aiVals(), aiCtx()), fixPrompt: () => fixPrompt(fixList, fixPage), wantN: () => wantN, imgPrompt: j => { const x = slots().find(y => y.j === j); return x ? imgPrompt(x, theme, E.titleOf(E.parse(ta.value), theme.name)) : ''; }, setImage: (j, f) => useFile(f, j) };

    full(); check();
  }

  /* ---------- AI 做的網頁：貼上 → 預覽（隔離執行）→ 下載 ---------- */
  function htmlViewer() {
    let box = $('#hv');
    if (!box) {
      box = document.createElement('div'); box.id = 'hv'; box.className = 'hv';
      box.innerHTML = `<div class="hv-card" role="dialog" aria-modal="true" aria-label="預覽 AI 做好的網頁">
        <div class="hv-h"><h2>預覽 AI 做好的網頁</h2><button type="button" class="btn sm ghost" data-a="x">關閉</button></div>
        <textarea id="hvSrc" spellcheck="false" placeholder="把 AI 給你的整段 HTML 貼在這裡（從 <!doctype html> 到 </html>）"></textarea>
        <div class="hv-p"><iframe id="hvFrame" title="AI 做的網頁預覽" sandbox="allow-scripts allow-popups allow-modals" allow="fullscreen"></iframe><div class="hv-empty" id="hvEmpty">貼上 HTML 後會在這裡預覽。點一下預覽，就能用 ← → 換頁。</div></div>
        <div class="hv-a"><button type="button" class="btn dark" data-a="fs">${ICON.play}全螢幕預覽</button><button type="button" class="btn" data-a="dl">${ICON.dl}下載 HTML</button><span class="hint" id="hvMsg"></span></div>
      </div>`;
      document.body.appendChild(box);
      const src = $('#hvSrc', box), fr = $('#hvFrame', box);
      const clean = v => { v = String(v || '').trim(); const m = v.match(/```(?:html)?\s*\n([\s\S]*?)```/i); return (m ? m[1] : v).trim(); };
      const show = () => {
        const h = clean(src.value), ok = /<html|<!doctype|<body/i.test(h);
        $('#hvEmpty', box).hidden = ok; fr.srcdoc = ok ? h : '';
        $('#hvMsg', box).textContent = h && !ok ? '看起來不是完整的 HTML，請複製 AI 給的整段程式碼' : (ok && !/<\/html>/i.test(h) ? '最後好像少了 </html>，可能沒複製完整，請 AI「把整份 HTML 完整輸出」' : '');
      };
      let tt = 0;
      src.addEventListener('input', () => { clearTimeout(tt); tt = setTimeout(show, 300); });
      box.addEventListener('click', e => {
        const a = e.target.closest('[data-a]'); if (e.target === box) box.hidden = true; if (!a) return;
        const h = clean(src.value);
        if (a.dataset.a === 'x') box.hidden = true;
        else if (!/<html|<!doctype|<body/i.test(h)) toast('先貼上 AI 做好的 HTML');
        else if (a.dataset.a === 'fs') { const p = $('.hv-p', box); (p.requestFullscreen || p.webkitRequestFullscreen || (() => {})).call(p); fr.focus(); }
        else if (a.dataset.a === 'dl') {
          const t = (h.match(/<title>([^<]*)<\/title>/i) || [])[1];
          const l = document.createElement('a'); l.href = URL.createObjectURL(blobOf(h)); l.download = safeName(t || 'AI 網頁簡報') + '.html';
          document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000);
          toast('已下載，用瀏覽器打開就能播放');
        }
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden && !document.fullscreenElement) box.hidden = true; });
      box._show = show;
    }
    box.hidden = false;
    const src = $('#hvSrc', box);
    const fill = t => { if (t && /<html|<!doctype|<body/i.test(t)) { src.value = t; box._show(); toast('已貼上剪貼簿裡的網頁'); } };
    try { if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(fill, () => {}); } catch (e) {}
    setTimeout(() => src.focus(), 50);
  }

  /* ---------- 使用說明 ---------- */
  function viewGuide() {
    document.title = '使用說明｜網頁簡報範本庫';
    const ex = {
      cover: SNIP.cover, agenda: SNIP.agenda, section: SNIP.section, bullets: SNIP.bullets, two: SNIP.two, stats: SNIP.stats,
      quote: SNIP.quote, steps: SNIP.steps, image: SNIP.image.replace('圖片網址', 'https://…/photo.jpg'), quiz: SNIP.quiz, end: SNIP.end,
    };
    view.innerHTML = `
<article class="guide">
  <h1>使用說明</h1>
  <p>這裡的簡報是「網頁」：一個 HTML 檔就是一整份簡報，用任何瀏覽器打開就能播放，不用安裝 PowerPoint。</p>
  <h2>三個步驟</h2>
  <div class="gsteps">
    <div><b>步驟 1</b>在<a href="#/">範本</a>挑一套喜歡的樣子，按「用這個範本做簡報」。</div>
    <div><b>步驟 2</b>在編輯器的「1 內容」寫你要講的。也可以填主題和自己的想法，請 ChatGPT 或 Gemini 幫你寫，再貼回來。接著到「2 風格」挑範本、配色、字體，每個選項都畫出樣子，點了右邊預覽馬上變。</div>
    <div><b>步驟 3</b>按「全螢幕播放」直接報告，或「下載 HTML」帶著走、「存成 PDF」交作業。</div>
  </div>
  <h2>請 AI 幫你寫</h2>
  <p style="color:var(--mute);margin:0 0 10px">在編輯器「1 內容」最上面的「請 AI 幫你做」，填主題和「我的想法」，按「複製並打開 ChatGPT」或 Gemini，到對話框貼上送出。「我的想法」寫你最想讓大家記住的事、自己的經驗或例子，AI 會以它為主軸；沒寫的話，AI 會先問你幾個問題。</p>
  <table class="tbl">
    <thead><tr><th>要 AI 做到哪裡</th><th>AI 會怎麼做</th><th>適合</th></tr></thead>
    <tbody>
      <tr><td>AI 寫內容，風格我自己挑</td><td>AI 依主題和你的想法寫好每一頁的文字。貼回編輯器後，到「2 風格」換範本、配色、字體。頁數可以選，或按「自訂…」填 3～60 頁。</td><td>大部分的情況。之後還能自己改字、換樣子，也能用講者模式和手機遙控</td></tr>
      <tr><td>AI 連設計一起做成網頁</td><td>把你的內容（或只有主題）交給 AI，請它寫出一個完整的 HTML 網頁簡報，設計會參考你在「2 風格」挑的範本和配色。做好後按「預覽 AI 做好的網頁」貼上，可以預覽、全螢幕和下載。</td><td>想看看 AI 自由發揮的設計。拿到後不能在這裡再調整，也不能用講者模式和手機遙控</td></tr>
    </tbody>
  </table>
  <p class="hint" style="margin-top:10px">AI 寫好後，複製它的程式碼區塊，回來按「清空並貼上」。如果頁數不對或格式有問題，編輯區下面會出現「複製修正指令給 AI」，貼回同一個對話就能請它改好。</p>
  <h2>放圖片</h2>
  <ul class="glist">
    <li>在「圖文」頁（或任何一頁）寫一行 <code>![畫面描述]()</code>，編輯器下方的「圖片」區就會出現這一頁。</li>
    <li>按「上傳圖片」選電腦或手機裡的圖，或把圖片拖到那一行；也可以複製圖片後，直接在內容框貼上。</li>
    <li>沒有圖？按「生圖提示詞」複製，貼到 ChatGPT 或 Gemini 請它畫，下載後再上傳。「複製全部生圖提示詞」會一次給 AI 全部的圖，讓它一張一張畫。</li>
    <li>上傳的圖片存在這台電腦的瀏覽器裡，內容框只會寫一個代號（例如 <code>img:abc123</code>）。下載 HTML 時，圖片會一起放進檔案，傳給別人也看得到。</li>
  </ul>
  <h2>字太多怎麼辦？</h2>
  <p style="color:var(--mute);margin:0 0 12px">放不下的頁面會自動縮小字體，不會被裁掉；縮太多時，編輯區下面會提醒你哪一頁該刪減或拆成兩頁。寫在「資料來源：」後面的文獻會用小字靠左排，網址可以直接點開。</p>
  <h2>內容怎麼寫</h2>
  <p style="color:var(--mute);margin:0 0 12px">每一頁用一行 <code>=== 版面名稱</code> 開頭。<code>#</code> 是標題、<code>##</code> 是副標題、<code>-</code> 是一個重點，<code>**字**</code> 會變成強調色。</p>
  <table class="tbl">
    <thead><tr><th>版面</th><th>適合用在</th><th>怎麼寫</th></tr></thead>
    <tbody>${E.TYPES.map(t => `<tr><td>${t.n}</td><td>${esc(t.tip)}</td><td><pre>${esc(ex[t.k])}</pre></td></tr>`).join('')}</tbody>
  </table>
  <p class="hint" style="margin-top:10px">每一頁都可以加一行「備註：要說的話」，這就是講稿，只有講者模式、手機遙控和按 N 時看得到。</p>
  <h2>風格可以自己調</h2>
  <p style="color:var(--mute);margin:0 0 12px">在編輯器的「2 風格」。最上面的「我的風格」會列出你現在用的範本、配色和字體，改過的可以按 ✕ 改回範本原樣。</p>
  <ul class="glist">
    <li><b>範本</b>是整套設計：版面、裝飾、配色、字體一起換。卡片上的縮圖是用你自己的封面畫的。</li>
    <li><b>配色、字體</b>只換那一項，其他不變。例如用「晨光暖杏」的版面，配上「深夜藍金」的顏色。</li>
    <li>換一套範本時，配色和字體會回到那套範本原本的樣子；排版、動畫、播放的設定會保留。</li>
  </ul>
  <table class="tbl">
    <tbody>${[...new Set(E.OPTS.map(o => o.tab))].map(t => `<tr><td>${t}</td><td>${E.OPTS.filter(o => o.tab === t).map(o => esc(o.n) + (o.items ? '：' + o.items.map(i => esc(i.n)).join('、') : '')).join('<br>')}</td></tr>`).join('')}</tbody>
  </table>
  <h2>三種播放方式</h2>
  <div class="gsteps">
    <div><b>一頁一頁</b>像投影片一樣，一次一頁，按鍵或點畫面換頁。可以搭配「按一下才出現下一個重點」。</div>
    <div><b>上下捲動</b>所有頁面由上往下排，用滑鼠滾輪或手指往上滑，像看網頁一樣。</div>
    <div><b>左右滑動</b>所有頁面排成一排，手機、平板左右滑最順手。</div>
  </div>
  <p class="hint" style="margin-top:10px">捲動的兩種方式，預設會「一頁一頁對齊」。在設定裡關掉，就能自由、流暢地捲動。</p>
  <h2>講者模式（講稿提示）</h2>
  <p>在內容的每一頁加一行 <code>備註：這一頁要說的話</code>。播放時按 <span class="kbd">P</span>，或右下角的講台圖示，會另開一個「講者視窗」。視窗裡有<strong>講稿、下一頁預覽、計時器、時鐘</strong>，在講者視窗按下一步，投影的畫面也會跟著換頁。把講者視窗留在你的筆電，投影的視窗拖到投影機或延伸螢幕上就可以了。</p>
  <h2>用手機遙控</h2>
  <p>播放時按 <span class="kbd">R</span>，或右下角的手機圖示，畫面會出現 QR code。用手機相機掃描，就能用手機<strong>換頁、看講稿、看下一頁是什麼、跳到任何一頁、讓畫面變黑</strong>，可以不用站在電腦旁邊。電腦和手機都要連上網路，不需要安裝 App。</p>
  <h2>播放時的按鍵</h2>
  <table class="tbl">
    <tbody>
      <tr><td><span class="kbd">→</span> <span class="kbd">空白鍵</span> 或點畫面右邊</td><td>下一頁</td></tr>
      <tr><td><span class="kbd">←</span> 或點畫面左邊</td><td>上一頁</td></tr>
      <tr><td><span class="kbd">F</span></td><td>全螢幕／離開全螢幕</td></tr>
      <tr><td><span class="kbd">O</span></td><td>看全部頁面，點一頁就跳過去</td></tr>
      <tr><td><span class="kbd">N</span></td><td>在畫面下方顯示／隱藏講稿（自己練習時用）</td></tr>
      <tr><td><span class="kbd">T</span></td><td>打開目錄，點一頁就跳過去</td></tr>
      <tr><td><span class="kbd">P</span></td><td>講者模式：講稿、下一頁、計時</td></tr>
      <tr><td><span class="kbd">R</span></td><td>手機遙控：出現 QR code 給手機掃</td></tr>
      <tr><td><span class="kbd">B</span></td><td>畫面變黑／恢復（想讓大家看你的時候）</td></tr>
      <tr><td>手機、平板</td><td>左右滑動換頁</td></tr>
    </tbody>
  </table>
  <h2>常見問題</h2>
  <dl class="faq">
    <dt>圖片怎麼放？</dt>
    <dd>在編輯器下方的「圖片」區上傳，或在括號裡貼 https:// 開頭的圖片網址。詳見上面的「放圖片」。</dd>
    <dt>換範本，內容會不見嗎？</dt>
    <dd>不會。內容和樣子是分開的，在編輯器的「2 風格」換範本，內容完全不變。</dd>
    <dt>內容存在哪裡？</dt>
    <dd>只存在你這台電腦的瀏覽器裡，不會上傳。換電腦或清除瀏覽資料就會不見，做好記得「下載 HTML」留一份。</dd>
    <dt>怎麼給別人看？</dt>
    <dd>把下載的 HTML 檔用 LINE、Email 傳給對方，對方用電腦或手機的瀏覽器打開就能播放。要交紙本或上傳到不支援 HTML 的地方，就用「存成 PDF」。</dd>
    <dt>沒有網路可以播嗎？</dt>
    <dd>可以，只是字型會換成電腦內建的字，版面一樣。</dd>
  </dl>
</article>`;
  }

  route();
})();
