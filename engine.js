/* 網頁簡報引擎：把「=== 版面」格式的文字變成一份可以獨立播放的 HTML 簡報 */
(function () {
  'use strict';

  const TYPES = [
    { k: 'cover',   n: '封面', alias: ['封面', 'cover', '首頁'], tip: '簡報第一頁：主標題、副標題、講者與日期' },
    { k: 'agenda',  n: '目錄', alias: ['目錄', 'agenda', '大綱'], tip: '列出今天要講的段落，會自動編號' },
    { k: 'section', n: '章節', alias: ['章節', 'section', '段落'], tip: '大段落的開頭頁，會自動編號 01、02…' },
    { k: 'bullets', n: '重點', alias: ['重點', '內容', 'bullets', '條列'], tip: '標題＋3～5 個重點' },
    { k: 'two',     n: '左右', alias: ['左右', '對比', '比較', 'two', '兩欄'], tip: '左右兩欄對照，例如「以前／現在」' },
    { k: 'stats',   n: '數字', alias: ['數字', '數據', 'stats'], tip: '用大大的數字強調重點' },
    { k: 'quote',   n: '引言', alias: ['引言', '金句', 'quote'], tip: '一句話＋出處' },
    { k: 'steps',   n: '步驟', alias: ['步驟', '流程', 'steps'], tip: '依順序排列的 3～5 個步驟' },
    { k: 'image',   n: '圖文', alias: ['圖文', '圖片', 'image', '照片'], tip: '左邊一張圖，右邊說明' },
    { k: 'quiz',    n: '問答', alias: ['問答', '測驗', '小測驗', 'quiz', '投票'], tip: '可以點的選擇題，點了會顯示對錯和解答' },
    { k: 'end',     n: '結尾', alias: ['結尾', '謝謝', 'end', '結語'], tip: '最後一頁：感謝、聯絡方式' },
  ];
  const BY = {};
  TYPES.forEach(t => t.alias.forEach(a => { BY[a.toLowerCase()] = t.k; }));
  const NAME = Object.fromEntries(TYPES.map(t => [t.k, t.n]));

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 行內：**粗體** 變成強調
  const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  /* ---------- 解析 ---------- */
  function parse(src) {
    const lines = String(src || '').replace(/\r/g, '').split('\n');
    const blocks = [];
    let cur = null;
    lines.forEach((raw, ln) => {
      if (/^\s*```/.test(raw)) return;                       // AI 回覆常包在程式碼區塊裡
      const m = raw.match(/^\s*={3,}\s*(.*?)\s*=*\s*$/);
      if (m) {
        const name = m[1].trim();
        const k = BY[name.toLowerCase()];
        cur = { type: k || 'bullets', raw: name, unknown: !k && !!name, missing: !name, line: ln, lines: [] };
        blocks.push(cur); return;
      }
      if (!cur) {
        if (!raw.trim()) return;
        cur = { type: 'bullets', raw: '', unknown: false, noHead: true, line: ln, lines: [] };
        blocks.push(cur);
      }
      cur.lines.push(raw);
    });
    return blocks.map(toSlide);
  }

  function toSlide(b) {
    const s = { type: b.type, raw: b.raw, unknown: b.unknown, missing: b.missing, noHead: b.noHead, line: b.line,
      title: '', sub: '', items: [], paras: [], cols: [], quote: [], by: '', img: null, note: [], answer: '' };
    let col = null;
    for (const raw of b.lines) {
      const t = raw.trim();
      if (!t) continue;
      let m;
      if ((m = t.match(/^#\s+(.*)$/))) { if (!s.title) s.title = m[1]; else s.paras.push(m[1]); continue; }
      if ((m = t.match(/^#{2,}\s+(.*)$/))) {
        if (s.type === 'two') { col = { h: m[1], items: [] }; s.cols.push(col); }
        else if (!s.sub) s.sub = m[1]; else s.paras.push(m[1]);
        continue;
      }
      if ((m = t.match(/^!\[(.*?)\]\((.*?)\)/))) { s.img = { alt: m[1], src: m[2].trim() }; continue; }
      if ((m = t.match(/^(?:備註|講者備註|note)\s*[：:]\s*(.*)$/i))) { s.note.push(m[1]); continue; }
      if (s.type === 'quiz' && (m = t.match(/^(?:解答|答案|說明)\s*[：:]\s*(.*)$/))) { s.answer = m[1]; continue; }
      if ((m = t.match(/^>\s?(.*)$/))) { s.quote.push(m[1]); continue; }
      if ((m = t.match(/^(?:—|──|--|－－|——)\s*(.*)$/))) { s.by = m[1]; continue; }
      if ((m = t.match(/^(?:[-*•・]|\d+[.、)）])\s+(.*)$/))) {
        if (col) col.items.push(m[1]); else s.items.push(m[1]);
        continue;
      }
      if (col) col.items.push(t); else s.paras.push(t);
    }
    // 左右版面沒有寫 ## 欄位標題：把重點平分到兩欄
    if (s.type === 'two' && !s.cols.length && s.items.length) {
      const h = Math.ceil(s.items.length / 2);
      s.cols = [{ h: '', items: s.items.slice(0, h) }, { h: '', items: s.items.slice(h) }];
      s.items = [];
    }
    return s;
  }

  // 給編輯器的提醒
  function warnings(slides) {
    const w = [];
    slides.forEach((s, i) => {
      const p = `第 ${i + 1} 頁`;
      if (s.unknown) w.push(`${p}的版面「${s.raw}」看不懂，先用「重點」版面顯示。可用：${TYPES.map(t => t.n).join('、')}`);
      if (s.missing) w.push(`${p}的「===」後面沒寫版面名稱，先用「重點」版面顯示`);
      if (s.noHead) w.push(`${p}前面少了一行「=== 版面名稱」，先用「重點」版面顯示`);
      if (!s.title && !['quote', 'image'].includes(s.type) && !(s.type === 'two' && s.cols.length)) w.push(`${p}（${NAME[s.type]}）沒有標題，用「# 標題」加一行`);
      if (s.type === 'bullets' && s.items.length > 6) w.push(`${p}有 ${s.items.length} 個重點，超過 6 個會太擠，建議拆成兩頁`);
      if (s.type === 'stats' && !s.items.length) w.push(`${p}（數字）沒有數字，用「- 25 分 | 說明」的格式`);
      if (s.type === 'quiz' && s.items.length < 2) w.push(`${p}（問答）至少要 2 個選項，用「- [x] 正確」「- [ ] 錯誤」`);
      if (s.type === 'quote' && !s.quote.length) w.push(`${p}（引言）沒有引言，用「> 一句話」`);
    });
    return w;
  }

  /* ---------- 版面 ---------- */
  const PH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/></svg>';
  const pad2 = n => String(n).padStart(2, '0');

  function render(s, ctx) {
    let i = 0;
    const r = () => ` class="r" style="--i:${i++}"`;
    const rc = c => ` class="${c} r" style="--i:${i++}"`;
    const h2 = s.title ? `<h2${r()}>${inl(s.title)}</h2>` : '';
    const sub = (c = 'sub') => s.sub ? `<p${rc(c)}>${inl(s.sub)}</p>` : '';
    const paras = (c = 'p') => s.paras.map(p => `<p${rc(c)}>${inl(p)}</p>`).join('');
    const ul = (items, c = 'bl') => items.length ? `<ul class="${c}">${items.map(x => `<li${r()}>${inl(x)}</li>`).join('')}</ul>` : '';
    let body = '';
    switch (s.type) {
      case 'cover':
        body = `<span${rc('bar')}></span>${s.title ? `<h1${rc(s.title.replace(/\*\*/g, '').length > 9 ? 'long' : '')}>${inl(s.title)}</h1>` : ''}${sub()}${s.paras.length ? `<p${rc('meta')}>${s.paras.map(inl).join('<br>')}</p>` : ''}${ul(s.items)}`;
        break;
      case 'agenda': {
        const many = s.items.length > 5;
        body = `${h2}${sub()}<ol class="ag${many ? ' many' : ''}">${s.items.map((x, k) => `<li${r()}><span class="n">${pad2(k + 1)}</span><span>${inl(x)}</span></li>`).join('')}</ol>${paras()}`;
        break;
      }
      case 'section':
        ctx.sec++;
        body = `<div${rc('num')}>${pad2(ctx.sec)}</div>${s.title ? `<h1${r()}>${inl(s.title)}</h1>` : ''}${sub()}${paras()}${ul(s.items)}`;
        break;
      case 'two': {
        const cols = s.cols.slice(0, 3);
        body = `${h2}${sub()}<div class="cols c${cols.length}">${cols.map(c => `<div${rc('col')}>${c.h ? `<h3>${inl(c.h)}</h3>` : ''}<ul>${c.items.map(x => `<li>${inl(x)}</li>`).join('')}</ul></div>`).join('')}</div>${paras()}`;
        break;
      }
      case 'stats': {
        const st = s.items.slice(0, 4).map(x => {
          let m = x.match(/^(.*?)\s*[|｜]\s*(.*)$/);
          if (!m) m = x.match(/^([\d,.]+\s*[%％]?\S{0,2})\s+(.*)$/) || [x, x, ''];
          return `<div${rc('st')}><b${m[1].length > 4 ? ' class="lg"' : ''}>${inl(m[1])}</b><span>${inl(m[2])}</span></div>`;
        }).join('');
        body = `${h2}${sub()}<div class="stats" style="--c:${Math.max(1, Math.min(4, s.items.length))}">${st}</div>${paras('src')}`;
        break;
      }
      case 'quote':
        body = `<div${rc('qm')}>“</div><blockquote${r()}>${s.quote.map(inl).join('<br>') || inl(s.title)}</blockquote>${s.by ? `<p${rc('by')}>— ${inl(s.by)}</p>` : ''}${paras()}`;
        break;
      case 'steps': {
        const its = s.items.slice(0, 6);
        body = `${h2}${sub()}<ol class="steps" style="--c:${Math.max(1, its.length)}">${its.map((x, k) => {
          const m = x.match(/^(.*?)\s*[：:]\s*(.*)$/);
          return `<li${r()}><span class="dot">${k + 1}</span><span class="stt">${inl(m ? m[1] : x)}</span>${m && m[2] ? `<span class="sd">${inl(m[2])}</span>` : ''}</li>`;
        }).join('')}</ol>${paras()}`;
        break;
      }
      case 'image': {
        const im = s.img || { alt: '', src: '' };
        const okSrc = /^(https?:|data:image\/)/i.test(im.src);
        const fig = okSrc
          ? `<img src="${esc(im.src)}" alt="${esc(im.alt)}">`
          : `<div class="ph">${PH_SVG}<span>${esc(im.alt || '圖片位置')}</span><small>在「![說明](圖片網址)」的括號裡貼上圖片網址</small></div>`;
        body = `${h2}<div class="im"><figure${rc('frame')}>${fig}</figure><div class="im-t">${sub()}${ul(s.items)}${paras()}</div></div>`;
        break;
      }
      case 'quiz': {
        const opts = s.items.slice(0, 6).map((x, k) => {
          let ok = 0, m;
          if ((m = x.match(/^\[(x|X|v|V|✓|✔|o|O)\]\s*(.*)$/))) { ok = 1; x = m[2]; }
          else if ((m = x.match(/^\[\s?\]\s*(.*)$/))) { x = m[1]; }
          else if ((m = x.match(/^[*＊]\s*(.*)$/))) { ok = 1; x = m[1]; }
          return { x, ok };
        });
        const hasAns = opts.some(o => o.ok);
        const long = opts.some(o => o.x.length > 14) || opts.length < 3;
        body = `<p${rc('kick')}>${hasAns ? '隨堂小問答' : '大家來投票'}</p>${s.title ? `<h2${r()}>${inl(s.title)}</h2>` : ''}<div class="opts${long ? ' one' : ''}" data-ans="${hasAns ? 1 : 0}">${opts.map((o, k) => `<button type="button" class="opt r" style="--i:${i++}" data-ok="${o.ok}"><span class="k">${'ABCDEF'[k]}</span><span>${inl(o.x)}</span></button>`).join('')}</div>${s.answer ? `<p class="ans">${inl(s.answer)}</p>` : ''}${paras('qhint')}`;
        break;
      }
      case 'end':
        body = `${s.title ? `<h1${r()}>${inl(s.title)}</h1>` : ''}${sub()}${s.paras.length ? `<p${rc('meta')}>${s.paras.map(inl).join('<br>')}</p>` : ''}${ul(s.items)}`;
        break;
      default: // bullets
        body = `${h2}${sub()}${ul(s.items)}${paras()}`;
    }
    return `<section class="slide t-${s.type}" data-note="${esc(s.note.join('\n'))}"><div class="deco"></div>${body}</section>`;
  }

  function cells(slides) {
    const ctx = { sec: 0 };
    return slides.map((s, j) => `<div class="cell" data-n="${j + 1}">${render(s, ctx)}</div>`).join('');
  }

  /* ---------- 共用樣式 ---------- */
  const BASE = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%}
body{background:var(--edge);overflow:hidden;font-family:var(--bf);color:var(--fg);-webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.stage{position:absolute;left:50%;top:50%;width:1280px;height:720px;margin:-360px 0 0 -640px;transform:scale(var(--k,1))}
.cell{display:contents}
.slide{position:absolute;inset:0;background:var(--bg);color:var(--fg);padding:80px 104px;display:flex;flex-direction:column;justify-content:center;overflow:hidden;opacity:0;visibility:hidden;transition:opacity .55s ease,transform .6s cubic-bezier(.2,.7,.2,1),visibility 0s linear .6s}
.slide.on{opacity:1;visibility:visible;transition:opacity .55s ease,transform .6s cubic-bezier(.2,.7,.2,1),visibility 0s}
[data-tr=rise] .slide{transform:translateY(34px)}
[data-tr=slide] .slide{transform:translateX(70px)}
[data-tr=slide] .slide.past{transform:translateX(-70px)}
[data-tr=zoom] .slide{transform:scale(.95)}
.slide.on{transform:none!important}
.slide>*:not(.deco){position:relative;z-index:1}
.deco{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.r{opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .7s cubic-bezier(.2,.7,.2,1);transition-delay:calc(var(--i,0)*85ms + 140ms)}
.on .r{opacity:1;transform:none}
h1,h2{text-wrap:balance}blockquote,.sub,.p,li{text-wrap:pretty}
h1,h2,h3{font-family:var(--hf);font-weight:var(--hw,700);letter-spacing:var(--ls,0);line-height:1.22}
strong{color:var(--hl,var(--ac));font-weight:700}
.kick{font-size:20px;letter-spacing:.16em;color:var(--ac);font-weight:700;margin-bottom:16px}
.sub{font-size:30px;color:var(--muted);margin-top:16px;line-height:1.5;max-width:1000px}
h2+.sub{margin-top:-24px;margin-bottom:36px}
.meta{font-size:22px;color:var(--muted);margin-top:44px;line-height:1.7}
h2{font-size:52px;margin-bottom:44px;max-width:1080px}
.p{font-size:27px;line-height:1.7;margin-top:22px;max-width:1040px;color:var(--fg)}
.bl{list-style:none;display:grid;gap:26px}
.bl li{font-size:32px;line-height:1.5;padding-left:44px;position:relative}
.bl li::before{content:'';position:absolute;left:4px;top:.56em;width:14px;height:14px;border-radius:50%;background:var(--ac)}
.t-cover h1{font-size:86px;max-width:1040px}
.t-cover h1.long{font-size:72px}
.t-cover .bar{display:block;width:96px;height:8px;border-radius:8px;background:var(--ac);margin-bottom:40px}
.t-cover .bl{margin-top:36px}
.ag{list-style:none;display:grid;gap:20px 64px}
.ag.many{grid-template-columns:1fr 1fr}
.ag li{display:flex;align-items:baseline;gap:26px;font-size:32px;line-height:1.4;padding-bottom:20px;border-bottom:2px solid var(--line)}
.ag .n{font-family:var(--nf,var(--hf));font-size:30px;color:var(--ac);font-weight:700;min-width:46px}
.t-section{background:var(--sec-bg);color:var(--sec-fg)}
.t-section .num{font-family:var(--nf,var(--hf));font-size:140px;line-height:1;font-weight:800;color:var(--sec-ac,var(--ac));margin-bottom:22px}
.t-section h1{font-size:84px}
.t-section .sub,.t-section .p{color:inherit;opacity:.78}
.cols{display:grid;grid-template-columns:repeat(2,1fr);gap:40px}
.cols.c3{grid-template-columns:repeat(3,1fr)}
.cols.c1{grid-template-columns:1fr}
.col{background:var(--card);border-radius:var(--rad);padding:40px 44px;border:var(--cb,0px) solid var(--line)}
.col h3{font-size:34px;margin-bottom:22px;color:var(--ac)}
.col:nth-child(2) h3{color:var(--ac2,var(--ac))}
.col ul{list-style:none;display:grid;gap:16px}
.col li{font-size:27px;line-height:1.5;padding-left:28px;position:relative}
.col li::before{content:'';position:absolute;left:0;top:.62em;width:10px;height:10px;border-radius:50%;background:currentColor;opacity:.38}
.stats{display:grid;grid-template-columns:repeat(var(--c),1fr);gap:32px}
.st{background:var(--card);border-radius:var(--rad);padding:40px 36px;border:var(--cb,0px) solid var(--line)}
.st b{display:block;font-family:var(--nf,var(--hf));font-size:72px;line-height:1.08;color:var(--ac);font-weight:800;margin-bottom:16px;letter-spacing:-.01em}
.st b.lg{font-size:54px;white-space:nowrap}
.st span{display:block;font-size:24px;line-height:1.5;color:var(--muted)}
.src{font-size:18px;color:var(--muted);margin-top:30px}
.qm{font-family:Georgia,'Times New Roman',serif;font-size:190px;line-height:.62;height:88px;color:var(--ac)}
.t-quote blockquote{font-family:var(--hf);font-size:50px;line-height:1.5;max-width:1040px;font-weight:var(--qw,var(--hw,700))}
.by{font-size:26px;color:var(--muted);margin-top:36px}
.steps{list-style:none;display:grid;grid-template-columns:repeat(var(--c),1fr);gap:30px;position:relative}
.steps::before{content:'';position:absolute;left:36px;right:36px;top:35px;height:3px;background:var(--line)}
.steps li{position:relative;display:flex;flex-direction:column;gap:12px}
.steps .dot{width:72px;height:72px;border-radius:50%;background:var(--ac);color:var(--on-ac,#fff);display:grid;place-items:center;font-family:var(--nf,var(--hf));font-size:30px;font-weight:800;margin-bottom:12px;box-shadow:0 0 0 10px var(--bg)}
.steps .stt{font-family:var(--hf);font-weight:var(--hw,700);font-size:30px;line-height:1.3}
.steps .sd{font-size:22px;line-height:1.6;color:var(--muted)}
.im{display:grid;grid-template-columns:1.08fr 1fr;gap:56px;align-items:center}
.frame{aspect-ratio:4/3;border-radius:var(--rad);overflow:hidden;background:var(--card);border:var(--cb,0px) solid var(--line);display:grid;place-items:center}
.frame img{width:100%;height:100%;object-fit:cover;display:block}
.ph{display:flex;flex-direction:column;align-items:center;gap:14px;color:var(--muted);font-size:24px;text-align:center;padding:28px;line-height:1.5}
.ph svg{width:80px;height:80px;opacity:.55}
.ph small{font-size:16px;opacity:.75}
.im .bl{gap:20px}.im .bl li{font-size:28px}
.im .sub{margin:0 0 26px}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:1080px}
.opts.one{grid-template-columns:1fr}
.opt{font:inherit;font-size:28px;line-height:1.4;text-align:left;padding:22px 30px;border-radius:var(--rad);border:3px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer;display:flex;gap:20px;align-items:center;transition:border-color .2s,background-color .2s,opacity .6s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
.opt:hover{border-color:var(--ac)}
.opt .k{font-family:var(--nf,var(--hf));font-weight:800;color:var(--ac);min-width:28px}
.opt::after{margin-left:auto;font-size:20px;font-weight:700;white-space:nowrap}
.opt.right{border-color:#2E9D5B;background:color-mix(in srgb,#2E9D5B 16%,var(--card))}
.opt.right::after{content:'正確';color:#2E9D5B}
.opt.wrong{border-color:#D64545;background:color-mix(in srgb,#D64545 14%,var(--card))}
.opt.wrong::after{content:'再想想';color:#D64545}
.opt.pick{border-color:var(--ac);background:color-mix(in srgb,var(--ac) 14%,var(--card))}
.opt.pick::after{content:'已選';color:var(--ac)}
.ans{font-size:25px;line-height:1.6;margin-top:28px;padding:20px 28px;border-left:6px solid var(--ac);background:var(--card);border-radius:0 var(--rad) var(--rad) 0;max-width:1080px;opacity:0;transform:translateY(10px);transition:opacity .4s,transform .4s}
.ans.show{opacity:1;transform:none}
.qhint{font-size:20px;color:var(--muted);margin-top:22px}
.t-end{align-items:center;text-align:center}
.t-end h1{font-size:96px}
.t-end .sub{margin-left:auto;margin-right:auto}
.t-end .bl{text-align:left;margin-top:30px}
.hud{position:fixed;left:0;right:0;bottom:0;height:4px;background:rgba(127,127,127,.18);z-index:9}
.hud i{display:block;height:100%;width:0;background:var(--ac);transition:width .4s}
.ctrl{position:fixed;right:14px;bottom:16px;display:flex;gap:2px;align-items:center;background:rgba(18,18,22,.78);color:#fff;border-radius:99px;padding:4px 6px;font:13px/1 system-ui,-apple-system,sans-serif;z-index:10;opacity:0;transition:opacity .3s;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
body.ui .ctrl,.ctrl:focus-within{opacity:1}
.ctrl button{all:unset;cursor:pointer;width:32px;height:32px;display:grid;place-items:center;border-radius:50%}
.ctrl button:hover,.ctrl button:focus-visible{background:rgba(255,255,255,.16)}
.ctrl svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ctrl .pg{padding:0 8px;font-variant-numeric:tabular-nums;white-space:nowrap}
.notes{position:fixed;left:16px;right:16px;bottom:60px;max-width:760px;margin:auto;background:rgba(18,18,22,.92);color:#fff;font:18px/1.6 system-ui,-apple-system,sans-serif;padding:14px 20px;border-radius:12px;display:none;z-index:10;white-space:pre-line}
body.shownotes .notes:not(:empty){display:block}
body.thumb .hud,body.thumb .ctrl,body.thumb .notes,body.ov .hud,body.ov .ctrl,body.ov .notes{display:none}
body.thumb .slide,body.thumb .r{transition:none!important}
body.thumb .r{opacity:1;transform:none}
body.ov{overflow:auto}
body.ov .stage{position:static;margin:0;transform:none;width:auto;height:auto;display:grid;grid-template-columns:repeat(var(--oc,3),1fr);gap:16px;padding:16px}
body.ov .cell{display:block;position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:10px;cursor:pointer;box-shadow:0 0 0 3px transparent;transition:box-shadow .2s}
body.ov .cell:hover,body.ov .cell.cur{box-shadow:0 0 0 3px var(--ac)}
body.ov .cell::after{content:attr(data-n);position:absolute;left:8px;top:8px;background:rgba(0,0,0,.62);color:#fff;font:600 12px/1 system-ui,sans-serif;padding:5px 7px;border-radius:6px;z-index:5}
body.ov .slide{left:0;top:0;right:auto;bottom:auto;width:1280px;height:720px;transform:scale(var(--ck,.2))!important;transform-origin:0 0;opacity:1;visibility:visible;transition:none;pointer-events:none}
body.ov .r{opacity:1;transform:none;transition:none}
@media print{
  @page{size:1280px 720px;margin:0}
  html,body{width:1280px;height:auto;overflow:visible;background:none}
  .stage{position:static;margin:0;transform:none;width:1280px;height:auto}
  .cell{display:block}
  .slide{position:relative;inset:auto;width:1280px;height:720px;opacity:1;visibility:visible;transform:none!important;transition:none;break-after:page;page-break-after:always}
  .r,.ans{opacity:1!important;transform:none!important;transition:none!important}
  .hud,.ctrl,.notes{display:none!important}
}`;

  const ICON = {
    prev: '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
  };

  /* ---------- 播放程式（會原封不動放進匯出的檔案） ---------- */
  function runtime() {
    var B = document.body, stage = document.querySelector('.stage');
    var mode = B.getAttribute('data-mode') || 'play';
    var slides = [], N = 0, cur = 0, idle = 0;
    var bar = document.querySelector('.hud i'), pg = document.querySelector('.ctrl .pg'), notes = document.querySelector('.notes');
    function tell(m) { try { if (parent !== window) parent.postMessage(Object.assign({ wst: 1 }, m), '*'); } catch (e) {} }
    function init() {
      slides = [].slice.call(document.querySelectorAll('.slide')); N = slides.length;
      [].forEach.call(document.querySelectorAll('.cell'), function (c, j) {
        c.onclick = function () { if (B.classList.contains('ov')) { if (mode === 'ov') { tell({ pick: j }); mark(j); } else { B.classList.remove('ov'); go(j); fit(); } } };
      });
      [].forEach.call(document.querySelectorAll('.opts'), function (box) {
        var opts = box.querySelectorAll('.opt'), ans = box.parentNode.querySelector('.ans'), graded = box.getAttribute('data-ans') === '1';
        [].forEach.call(opts, function (o) {
          o.onclick = function (e) {
            e.stopPropagation();
            if (graded) {
              [].forEach.call(opts, function (x) { x.classList.remove('right', 'wrong'); });
              if (o.getAttribute('data-ok') === '1') o.classList.add('right');
              else { o.classList.add('wrong'); [].forEach.call(opts, function (x) { if (x.getAttribute('data-ok') === '1') x.classList.add('right'); }); }
            } else { [].forEach.call(opts, function (x) { x.classList.remove('pick'); }); o.classList.add('pick'); }
            if (ans) ans.classList.add('show');
            o.blur();
          };
        });
      });
    }
    function mark(j) { [].forEach.call(document.querySelectorAll('.cell'), function (c, k) { c.classList.toggle('cur', k === j); }); }
    function go(n) {
      if (!N) return;
      n = Math.max(0, Math.min(N - 1, n | 0)); cur = n;
      slides.forEach(function (s, j) { s.classList.toggle('on', j === n); s.classList.toggle('past', j < n); });
      if (bar) bar.style.width = (N > 1 ? n / (N - 1) * 100 : 100) + '%';
      if (pg) pg.textContent = (n + 1) + ' / ' + N;
      if (notes) notes.textContent = slides[n].getAttribute('data-note') || '';
      mark(n);
      if (mode === 'play' && location.protocol !== 'about:') { try { history.replaceState(null, '', '#' + (n + 1)); } catch (e) {} }
      tell({ slide: n, total: N });
    }
    function fit() {
      if (B.classList.contains('ov')) {
        var w = innerWidth, oc = w < 560 ? 2 : w < 1100 ? 3 : 4;
        B.style.setProperty('--oc', oc);
        var cell = document.querySelector('.cell');
        if (cell) B.style.setProperty('--ck', cell.clientWidth / 1280);
        tell({ h: document.documentElement.scrollHeight });
      } else {
        document.documentElement.style.setProperty('--k', Math.min(innerWidth / 1280, innerHeight / 720));
      }
    }
    function full() {
      var d = document;
      if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else { var el = d.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen; if (f) { var p = f.call(el); if (p && p.catch) p.catch(function () {}); } }
    }
    function ov(on) { if (mode !== 'play') return; B.classList.toggle('ov', on); fit(); if (on) { var c = document.querySelectorAll('.cell')[cur]; if (c) c.scrollIntoView({ block: 'center' }); } }
    function key(k, e) {
      if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter') go(cur + 1);
      else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') go(cur - 1);
      else if (k === 'Home') go(0);
      else if (k === 'End') go(N - 1);
      else if (k === 'f' || k === 'F') full();
      else if (k === 'o' || k === 'O' || k === 'g' || k === 'G') ov(!B.classList.contains('ov'));
      else if (k === 'Escape') ov(false);
      else if (k === 'n' || k === 'N') B.classList.toggle('shownotes');
      else return false;
      if (e) e.preventDefault();
      return true;
    }
    init();
    if (mode === 'ov') B.classList.add('ov');
    var h = parseInt((location.hash || '').slice(1), 10);
    go(isNaN(h) ? +(B.getAttribute('data-start') || 0) : h - 1);
    fit();
    addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    if (mode === 'thumb') return;
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && t.closest && t.closest('input,textarea,select,[contenteditable]')) return;
      if (t && t.closest && t.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
      if (B.classList.contains('ov') && /^Arrow/.test(e.key)) return;
      key(e.key, e);
    });
    stage.addEventListener('click', function (e) {
      if (B.classList.contains('ov') || mode !== 'play') return;
      if (e.target.closest('button,a,input,textarea,select,.ans')) return;
      var x = e.clientX / innerWidth;
      go(x < .3 ? cur - 1 : cur + 1);
    });
    var tx = null, ty = 0;
    addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    addEventListener('touchend', function (e) {
      if (tx == null || B.classList.contains('ov')) return;
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? cur + 1 : cur - 1);
    }, { passive: true });
    var ctrl = document.querySelector('.ctrl');
    if (ctrl) ctrl.addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest('button'); if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'prev') go(cur - 1); else if (a === 'next') go(cur + 1); else if (a === 'grid') ov(!B.classList.contains('ov')); else if (a === 'full') full();
    });
    addEventListener('mousemove', function () { B.classList.add('ui'); clearTimeout(idle); idle = setTimeout(function () { B.classList.remove('ui'); }, 2200); });
    addEventListener('message', function (e) {
      var d = e.data; if (!d || !d.wst) return;
      if (typeof d.go === 'number') go(d.go);
      if (d.key) key(d.key);
      if (typeof d.swap === 'string') { stage.innerHTML = d.swap; init(); go(typeof d.at === 'number' ? d.at : cur); fit(); }
    });
    if (/print/.test(location.hash)) {
      var p = function () { setTimeout(function () { print(); }, 300); };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(p); else p();
    }
  }

  function fontLink(theme) {
    const fams = (theme.fonts || []).map(f => 'family=' + f.replace(/ /g, '+')).join('&');
    if (!fams) return '';
    return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fams}&display=swap">`;
  }

  function varsOf(theme) {
    const v = theme.vars || {};
    const map = { bg: 'bg', fg: 'fg', muted: 'muted', ac: 'ac', ac2: 'ac2', card: 'card', line: 'line', edge: 'edge', secBg: 'sec-bg', secFg: 'sec-fg', secAc: 'sec-ac', onAc: 'on-ac', hl: 'hl', hf: 'hf', bf: 'bf', nf: 'nf', hw: 'hw', qw: 'qw', ls: 'ls', rad: 'rad', cb: 'cb' };
    return Object.keys(v).filter(k => map[k]).map(k => `--${map[k]}:${v[k]}`).join(';');
  }

  function titleOf(slides, fallback) {
    const s = slides.find(x => x.type === 'cover' && x.title) || slides.find(x => x.title);
    return (s && s.title.replace(/\*\*/g, '')) || fallback || '網頁簡報';
  }

  /* opt.mode: play（播放，預設）| thumb（只畫第一頁、不動）| ov（一覽，點一頁會通知外層）；opt.start：從第幾頁開始（0 起算） */
  function build(theme, src, opt) {
    opt = opt || {};
    let slides = parse(src);
    if (!slides.length) slides = parse('=== 封面\n# 還沒有內容\n## 在左邊的框框寫下你的簡報');
    if (opt.mode === 'thumb') slides = slides.slice(0, 1);
    const title = titleOf(slides, theme.name);
    const ctrl = opt.mode === 'thumb' ? '' : `<div class="hud"><i></i></div><div class="ctrl"><button data-a="prev" aria-label="上一頁" title="上一頁（←）">${ICON.prev}</button><span class="pg"></span><button data-a="next" aria-label="下一頁" title="下一頁（→）">${ICON.next}</button><button data-a="grid" aria-label="全部頁面" title="全部頁面（O）">${ICON.grid}</button><button data-a="full" aria-label="全螢幕" title="全螢幕（F）">${ICON.full}</button></div><div class="notes"></div>`;
    return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="generator" content="網頁簡報範本庫 · ${esc(theme.name)}">${fontLink(theme)}<style>:root{${varsOf(theme)}}${BASE}${theme.css || ''}</style></head><body data-tr="${esc(theme.tr || 'fade')}" data-mode="${esc(opt.mode || 'play')}" data-start="${opt.start | 0}" class="${opt.mode === 'thumb' ? 'thumb' : ''}"><div class="stage">${cells(slides)}</div>${ctrl}<script>(${runtime.toString()})()<\/script></body></html>`;
  }

  window.WST = { TYPES, NAME, parse, warnings, build, cells, titleOf, esc };
})();
