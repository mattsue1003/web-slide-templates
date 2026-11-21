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
  const plain = s => String(s || '').replace(/\*\*/g, '');

  // .r = 進場動畫；.f = 「按一下出現一個」時，一次出現一個的項目
  function render(s, ctx) {
    let i = 0;
    const r = () => ` class="r" style="--i:${i++}"`;
    const rc = c => ` class="${c} r" style="--i:${i++}"`;
    const rf = (c = '') => ` class="${c ? c + ' ' : ''}r f" style="--i:${i++}"`;
    const h2 = s.title ? `<h2${r()}>${inl(s.title)}</h2>` : '';
    const sub = (c = 'sub') => s.sub ? `<p${rc(c)}>${inl(s.sub)}</p>` : '';
    const paras = (c = 'p') => s.paras.map(p => `<p${rc(c)}>${inl(p)}</p>`).join('');
    const ul = (items, c = 'bl', frag = true) => items.length ? `<ul class="${c}">${items.map(x => `<li${frag ? rf() : r()}>${inl(x)}</li>`).join('')}</ul>` : '';
    let body = '';
    switch (s.type) {
      case 'cover':
        body = `<span${rc('bar')}></span>${s.title ? `<h1${rc(plain(s.title).length > 9 ? 'long' : '')}>${inl(s.title)}</h1>` : ''}${sub()}${s.paras.length ? `<p${rc('meta')}>${s.paras.map(inl).join('<br>')}</p>` : ''}${ul(s.items, 'bl', false)}`;
        break;
      case 'agenda': {
        const many = s.items.length > 5;
        body = `${h2}${sub()}<ol class="ag${many ? ' many' : ''}">${s.items.map((x, k) => `<li${rf()}><span class="n">${pad2(k + 1)}</span><span>${inl(x)}</span></li>`).join('')}</ol>${paras()}`;
        break;
      }
      case 'section':
        ctx.sec++;
        body = `<div${rc('num')}>${pad2(ctx.sec)}</div>${s.title ? `<h1${r()}>${inl(s.title)}</h1>` : ''}${sub()}${paras()}${ul(s.items, 'bl', false)}`;
        break;
      case 'two': {
        const cols = s.cols.slice(0, 3);
        body = `${h2}${sub()}<div class="cols c${cols.length}">${cols.map(c => `<div${rf('col')}>${c.h ? `<h3>${inl(c.h)}</h3>` : ''}<ul>${c.items.map(x => `<li>${inl(x)}</li>`).join('')}</ul></div>`).join('')}</div>${paras()}`;
        break;
      }
      case 'stats': {
        const st = s.items.slice(0, 4).map(x => {
          let m = x.match(/^(.*?)\s*[|｜]\s*(.*)$/);
          if (!m) m = x.match(/^([\d,.]+\s*[%％]?\S{0,2})\s+(.*)$/) || [x, x, ''];
          return `<div${rf('st')}><b${m[1].length > 4 ? ' class="lg"' : ''}>${inl(m[1])}</b><span>${inl(m[2])}</span></div>`;
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
          return `<li${rf()}><span class="dot">${k + 1}</span><span class="stt">${inl(m ? m[1] : x)}</span>${m && m[2] ? `<span class="sd">${inl(m[2])}</span>` : ''}</li>`;
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
        const opts = s.items.slice(0, 6).map(x => {
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
        body = `${s.title ? `<h1${r()}>${inl(s.title)}</h1>` : ''}${sub()}${s.paras.length ? `<p${rc('meta')}>${s.paras.map(inl).join('<br>')}</p>` : ''}${ul(s.items, 'bl', false)}`;
        break;
      default: // bullets
        body = `${h2}${sub()}${ul(s.items)}${paras()}`;
    }
    const cfg = ctx.cfg || {};
    const foot = (cfg.footer || cfg.footText) && !['cover', 'section', 'end'].includes(s.type)
      ? `<div class="pf"><span>${esc(cfg.footText || '')}</span><b>${cfg.footer ? ctx.n + ' / ' + ctx.total : ''}</b></div>` : '';
    const title = plain(s.title || s.quote[0] || NAME[s.type]);
    return `<section class="slide t-${s.type}" data-title="${esc(title)}" data-kind="${NAME[s.type]}" data-note="${esc(s.note.join('\n'))}"><div class="deco"></div>${body}${foot}</section>`;
  }

  function cells(slides, cfg) {
    const ctx = { sec: 0, cfg: cfg || {}, total: slides.length };
    return slides.map((s, j) => { ctx.n = j + 1; return `<div class="cell" data-n="${j + 1}">${render(s, ctx)}</div>`; }).join('');
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

  /* ---------- 可以自己調的設定 ---------- */
  const FF = {
    sans: "'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif",
    serif: "'Noto Serif TC','Songti TC','PMingLiU',serif",
    round: "'Huninn','Noto Sans TC','PingFang TC',sans-serif",
    hand: "'LXGW WenKai TC','Noto Sans TC','PingFang TC',sans-serif",
    iansui: "'Iansui','Noto Sans TC','PingFang TC',sans-serif",
  };
  const FG = { sans: 'Noto Sans TC:wght@400;700;900', serif: 'Noto Serif TC:wght@400;700;900', round: 'Huninn', hand: 'LXGW WenKai TC:wght@400;700', iansui: 'Iansui' };
  const FONTS = {
    sans: { n: '黑體', hf: FF.sans, bf: FF.sans, hw: 900, g: [FG.sans] },
    serif: { n: '明體', hf: FF.serif, bf: FF.serif, hw: 900, g: [FG.serif] },
    mix: { n: '明體標題＋黑體內文', hf: FF.serif, bf: FF.sans, hw: 900, g: [FG.serif, FG.sans] },
    round: { n: '圓體', hf: FF.round, bf: FF.round, hw: 400, g: [FG.round, FG.sans] },
    roundmix: { n: '圓體標題＋黑體內文', hf: FF.round, bf: FF.sans, hw: 400, g: [FG.round, FG.sans] },
    hand: { n: '文楷', hf: FF.hand, bf: FF.hand, hw: 700, g: [FG.hand] },
    iansui: { n: '芫荽', hf: FF.iansui, bf: FF.iansui, hw: 400, g: [FG.iansui, FG.sans] },
  };
  const P = (n, bg, fg, muted, ac, ac2, card, line, edge, secBg, secFg, secAc, onAc, dark) => ({ n, dark: !!dark, v: { bg, fg, muted, ac, ac2, card, line, edge, secBg, secFg, secAc, onAc } });
  const PALETTES = {
    warm: P('暖杏陶土', '#FBF6EE', '#2E2A25', '#776B5F', '#C95F33', '#5F8B6B', '#FFFFFF', '#EADFCF', '#E6DBCB', '#C95F33', '#FFF8F0', '#FFE1C7', '#FFFFFF'),
    blue: P('醫療藍', '#FFFFFF', '#13283F', '#566779', '#1F6FD1', '#0F9A90', '#F1F6FC', '#DCE6F0', '#DCE5EF', '#12355E', '#FFFFFF', '#7CC0FF', '#FFFFFF'),
    green: P('森林綠', '#EEF1E8', '#1E3A2F', '#566B5F', '#2F6B4F', '#A67C1E', '#F8FAF4', '#D1DAC8', '#D6DDCD', '#1E3A2F', '#F1EEDF', '#D8B45C', '#FFFFFF'),
    teal: P('海洋青', '#F1FAFA', '#0E3A43', '#4D6F77', '#0B8794', '#E08A1E', '#FFFFFF', '#CFE7E9', '#D3EAEC', '#0B6F7A', '#FFFFFF', '#9BE7EE', '#FFFFFF'),
    pink: P('粉彩', '#FFF5F1', '#3D2F42', '#77667A', '#D9577A', '#3E918C', '#FFFFFF', '#F1D5CF', '#F4E0DA', '#D9577A', '#FFFFFF', '#FFE3EA', '#FFFFFF'),
    orange: P('活力橘', '#FFF5EB', '#2D1A10', '#77584A', '#E5521F', '#D98E00', '#FFFFFF', '#F2D7C2', '#F2DECB', '#E5521F', '#FFFFFF', '#FFE0A3', '#FFFFFF'),
    indigo: P('靛藍亮黃', '#FFFFFF', '#1C1C3A', '#66668A', '#5050CC', '#C98A00', '#F5F5FF', '#E4E4F5', '#E8E8F6', '#5050CC', '#FFFFFF', '#FFD166', '#FFFFFF'),
    mono: P('黑白極簡', '#FFFFFF', '#111111', '#767676', '#111111', '#555555', '#F4F4F4', '#E5E5E5', '#ECECEC', '#111111', '#FFFFFF', '#FFFFFF', '#FFFFFF'),
    high: P('高對比大字', '#FFFCF2', '#111111', '#333333', '#B23E08', '#1D5FA8', '#FFFFFF', '#D9CFB8', '#EDE5D0', '#1D3557', '#FFFFFF', '#FFD166', '#FFFFFF'),
    navy: P('深夜藍金', '#0E1424', '#E8ECF5', '#9CA6BE', '#E5BE73', '#8EADF7', 'rgba(255,255,255,.06)', 'rgba(255,255,255,.14)', '#070A13', '#121B33', '#E8ECF5', '#E5BE73', '#0E1424', 1),
    board: P('黑板綠', '#24382E', '#F3F0E6', '#C3CCBF', '#F5D46E', '#90D2F0', 'rgba(255,255,255,.07)', 'rgba(255,255,255,.2)', '#16221C', '#1C2C24', '#F3F0E6', '#F5D46E', '#24382E', 1),
    tech: P('科技黑綠', '#111318', '#E7E9EE', '#8E96A4', '#3DDC97', '#4CC9F0', '#1A1D24', '#2B303B', '#08090C', '#3DDC97', '#0B0D10', '#0B0D10', '#0B0D10', 1),
  };
  const opt = (pairs) => pairs.map(([v, n]) => ({ v, n }));
  const OPTS = [
    { tab: '字體', key: 'font', n: '字體', items: [{ v: '', n: '範本預設' }, ...Object.keys(FONTS).map(k => ({ v: k, n: FONTS[k].n, ff: FONTS[k].hf }))] },
    { tab: '配色', key: 'palette', n: '配色', items: [{ v: '', n: '範本預設' }, ...Object.keys(PALETTES).map(k => ({ v: k, n: PALETTES[k].n, sw: [PALETTES[k].v.bg, PALETTES[k].v.ac, PALETTES[k].v.ac2, PALETTES[k].v.fg] }))] },
    { tab: '配色', key: 'accent', n: '自訂主色', type: 'color' },
    { tab: '排版', key: 'align', n: '對齊', items: opt([['', '靠左'], ['center', '置中']]) },
    { tab: '排版', key: 'valign', n: '內容位置', items: opt([['', '垂直置中'], ['top', '靠上']]) },
    { tab: '排版', key: 'size', n: '文字大小', items: opt([['s', '小'], ['', '標準'], ['l', '大'], ['xl', '特大']]) },
    { tab: '排版', key: 'space', n: '留白', items: opt([['tight', '緊湊'], ['', '標準'], ['loose', '寬鬆']]) },
    { tab: '排版', key: 'footer', n: '每頁顯示頁碼', type: 'check' },
    { tab: '排版', key: 'footText', n: '頁尾文字', type: 'text', ph: '例如：第三組 · 期末報告' },
    { tab: '動畫', key: 'tr', n: '換頁效果', items: opt([['', '範本預設'], ['fade', '淡入淡出'], ['rise', '往上浮現'], ['slide', '左右滑動'], ['zoom', '輕微放大'], ['flip', '翻頁'], ['blur', '模糊轉清楚'], ['none', '直接切換']]) },
    { tab: '動畫', key: 'anim', n: '文字進場', items: opt([['', '往上浮現'], ['fade', '淡入'], ['left', '從左滑入'], ['pop', '彈出'], ['drop', '從上落下'], ['none', '不要動畫']]) },
    { tab: '動畫', key: 'speed', n: '動畫速度', items: opt([['fast', '快'], ['', '標準'], ['slow', '慢']]) },
    { tab: '動畫', key: 'step', n: '按一下才出現下一個重點', type: 'check', tip: '適合邊講邊揭曉；按「下一頁」會先一個一個顯示重點' },
    { tab: '元素', key: 'bullet', n: '項目符號', items: opt([['', '範本預設'], ['dot', '圓點'], ['square', '方塊'], ['num', '數字'], ['check', '打勾'], ['arrow', '箭頭'], ['dash', '短線'], ['none', '不要']]) },
    { tab: '元素', key: 'card', n: '卡片樣式', items: opt([['', '範本預設'], ['flat', '色塊'], ['shadow', '陰影'], ['outline', '外框'], ['line', '頂線']]) },
    { tab: '元素', key: 'heading', n: '標題樣式', items: opt([['', '範本預設'], ['bar', '左側色條'], ['underline', '短底線'], ['mark', '螢光筆'], ['plain', '單純文字']]) },
    { tab: '元素', key: 'decor', n: '背景裝飾', items: opt([['', '範本預設'], ['soft', '淡一點'], ['off', '不要裝飾']]) },
    { tab: '播放', key: 'nav', n: '播放方式', items: opt([['', '一頁一頁'], ['v', '上下捲動'], ['h', '左右滑動']]) },
    { tab: '播放', key: 'snap', n: '捲動時一頁一頁對齊', type: 'check', def: true, tip: '關掉就能自由、流暢地捲動' },
    { tab: '播放', key: 'auto', n: '自動換頁', items: opt([['', '不要'], ['5', '每 5 秒'], ['10', '每 10 秒'], ['20', '每 20 秒'], ['30', '每 30 秒']]) },
    { tab: '播放', key: 'toc', n: '顯示目錄按鈕', type: 'check', def: true },
    { tab: '播放', key: 'remote', n: '顯示講者模式、手機遙控按鈕', type: 'check', def: true },
  ];
  const OPT_BY = Object.fromEntries(OPTS.map(o => [o.key, o]));
  // 把存檔裡的設定清乾淨：不認得的值一律丟掉
  function cleanCfg(c) {
    const out = {};
    if (!c || typeof c !== 'object') return out;
    for (const o of OPTS) {
      const v = c[o.key];
      if (v == null) continue;
      if (o.type === 'check') { if (typeof v === 'boolean') out[o.key] = v; }
      else if (o.type === 'color') { if (/^#[0-9a-f]{6}$/i.test(v)) out[o.key] = v; }
      else if (o.type === 'text') { if (typeof v === 'string' && v.trim()) out[o.key] = v.slice(0, 40); }
      else if (o.items.some(it => it.v === v && v !== '')) out[o.key] = v;
    }
    return out;
  }
  const on = (c, k) => (c[k] == null ? !!(OPT_BY[k] && OPT_BY[k].def) : !!c[k]);

  function cfgCss(c) {
    let css = '';
    const pal = PALETTES[c.palette];
    if (pal) {
      css += `.slide{background:var(--bg)!important}.t-section{background:var(--sec-bg)!important}
.deco{filter:grayscale(1);opacity:${pal.dark ? .18 : .32}}
.t-cover h1,.t-end h1,.t-section h1{background:none!important;color:inherit!important;-webkit-text-fill-color:currentColor}
.frame{background:color-mix(in srgb,var(--fg) 6%,var(--bg))}`;
    }
    if (c.decor === 'soft') css += '.deco{opacity:.4}';
    if (c.decor === 'off') css += '.deco{display:none}.slide{background:var(--bg)!important}.t-section{background:var(--sec-bg)!important}';
    if (c.align === 'center') css += `.slide{align-items:center;text-align:center}.slide>h2{margin-left:auto;margin-right:auto}.t-cover .bar{margin-left:auto;margin-right:auto}
.bl,.ag,.col ul,.ans{text-align:left}.cols,.stats,.steps,.opts,.im{width:100%}.opt{text-align:left}`;
    if (c.valign === 'top') css += '.slide:not(.t-cover):not(.t-section):not(.t-end):not(.t-quote){justify-content:flex-start;padding-top:92px}';
    const z = { s: .88, l: 1.14, xl: 1.28 }[c.size];
    if (z) css += `h1,.slide>h2,.sub,.meta,.p,.kick,.bl li,.ag li,.col h3,.col li,.st,.t-quote blockquote,.by,.steps li,.opt,.ans,.num,.src{zoom:${z}}`;
    if (c.space === 'tight') css += '.slide{padding:56px 72px}.slide>.pf{left:72px;right:72px;bottom:22px}';
    if (c.space === 'loose') css += '.slide{padding:104px 150px}.slide>.pf{left:150px;right:150px}';
    const bl = c.bullet;
    const B = '.bl li::before{content:"";position:absolute;left:4px;transform:none;box-shadow:none;';
    if (bl === 'dot') css += B + 'top:.56em;width:14px;height:14px;border-radius:50%;background:var(--ac)}';
    if (bl === 'square') css += B + 'top:.58em;width:13px;height:13px;border-radius:2px;background:var(--ac)}';
    if (bl === 'dash') css += B + 'top:.72em;width:22px;height:4px;border-radius:2px;background:var(--ac)}';
    if (bl === 'check' || bl === 'arrow') css += B + `content:"${bl === 'check' ? '✓' : '→'}";left:0;top:0;width:auto;height:auto;border-radius:0;background:none;color:var(--ac);font-weight:900}`;
    if (bl === 'num') css += '.bl{counter-reset:bn}.bl li{counter-increment:bn;padding-left:60px}' + B + 'content:counter(bn);left:0;top:.08em;width:40px;height:40px;border-radius:50%;background:var(--ac);color:var(--on-ac,#fff);font:800 20px/40px var(--nf,var(--hf));text-align:center}';
    if (bl === 'none') css += '.bl li{padding-left:0}.bl li::before{content:none}';
    const K = '.col,.st,.frame';
    if (c.card === 'flat') css += `${K},.opt{background:color-mix(in srgb,var(--fg) 6%,var(--bg));border:0;box-shadow:none;border-radius:var(--rad)}.col{padding:40px 44px}.st{padding:40px 36px}`;
    if (c.card === 'shadow') css += `${K},.opt{background:color-mix(in srgb,var(--fg) 3%,var(--bg));border:0;box-shadow:0 16px 40px rgba(0,0,0,.14);border-radius:var(--rad)}.col{padding:40px 44px}.st{padding:40px 36px}`;
    if (c.card === 'outline') css += `${K},.opt{background:transparent;border:2px solid color-mix(in srgb,var(--fg) 24%,transparent);box-shadow:none;border-radius:var(--rad)}.col{padding:40px 44px}.st{padding:40px 36px}`;
    if (c.card === 'line') css += `.col,.st{background:none;border:0;border-top:5px solid var(--ac);border-radius:0;box-shadow:none;padding:26px 4px 0}`;
    const H = '.slide>h2{border:0;padding:0;background:none;text-decoration:none}.slide>h2::before{content:none}';
    if (c.heading === 'bar') css += H + '.slide>h2{padding-left:26px;border-left:9px solid var(--ac)}';
    if (c.heading === 'underline') css += H + '.slide>h2{padding-bottom:22px;background:linear-gradient(var(--ac),var(--ac)) left bottom/96px 6px no-repeat}' + (c.align === 'center' ? '.slide>h2{background-position:center bottom}' : '');
    if (c.heading === 'mark') css += H + '.slide>h2{text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--ac) 32%,transparent);text-decoration-thickness:.38em;text-underline-offset:-.18em;text-decoration-skip-ink:none}';
    if (c.heading === 'plain') css += H;
    return css;
  }

  const BASE2 = `
.slide{transition:opacity calc(.55s*var(--sp,1)) ease,transform calc(.6s*var(--sp,1)) cubic-bezier(.2,.7,.2,1),filter calc(.55s*var(--sp,1)) ease,visibility 0s linear calc(.6s*var(--sp,1))}
.slide.on{transition:opacity calc(.55s*var(--sp,1)) ease,transform calc(.6s*var(--sp,1)) cubic-bezier(.2,.7,.2,1),filter calc(.55s*var(--sp,1)) ease,visibility 0s}
[data-tr=flip] .stage{perspective:2400px}
[data-tr=flip] .slide{transform:rotateY(32deg);transform-origin:left center;-webkit-backface-visibility:hidden;backface-visibility:hidden}
[data-tr=flip] .slide.past{transform:rotateY(-32deg);transform-origin:right center}
[data-tr=blur] .slide{filter:blur(16px);transform:scale(1.03)}
[data-tr=blur] .slide.on{filter:none}
[data-tr=none] .slide{transition:none!important}
.r{transition:opacity calc(.6s*var(--sp,1)) ease,transform calc(.7s*var(--sp,1)) cubic-bezier(.2,.7,.2,1);transition-delay:calc((var(--i,0)*85ms + 140ms)*var(--sp,1))}
[data-anim=fade] .r{transform:none}
[data-anim=left] .r{transform:translateX(-48px)}
[data-anim=pop] .r{transform:scale(.8);transition-timing-function:ease,cubic-bezier(.34,1.56,.64,1)}
[data-anim=drop] .r{transform:translateY(-30px)}
.on .r{opacity:1;transform:none}
[data-anim=none] .r{opacity:1;transform:none;transition:none}
@media screen{body.stepping .slide.on .f:not(.vis){opacity:0;transform:translateY(14px)}
body.stepping .slide.on .f.vis{transition-delay:0s}
body.pres.stepping .slide.on .f:not(.vis){opacity:.28;transform:none}}
.slide>.pf{position:absolute;left:104px;right:104px;bottom:30px;display:flex;justify-content:space-between;align-items:center;font-size:16px;color:var(--muted);z-index:2;letter-spacing:.04em}
.pf b{font-weight:700;font-variant-numeric:tabular-nums}
body[data-nav=v],body[data-nav=h]{overflow:hidden}
body[data-nav=v] .stage,body[data-nav=h] .stage{position:fixed;inset:0;margin:0;width:auto;height:auto;transform:none;display:flex;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
body[data-nav=v] .stage{flex-direction:column;align-items:center;gap:calc(26px*var(--k));padding:calc((100vh - 720px*var(--k))/2) 0}
body[data-nav=h] .stage{flex-direction:row;align-items:center;gap:calc(34px*var(--k));padding:0 calc((100vw - 1280px*var(--k))/2)}
body[data-nav=v] .stage::after,body[data-nav=h] .stage::after{content:'';flex:none;width:1px;height:1px}
body[data-snap="1"][data-nav=v] .stage{scroll-snap-type:y mandatory}
body[data-snap="1"][data-nav=h] .stage{scroll-snap-type:x mandatory}
body[data-nav=v] .cell,body[data-nav=h] .cell{display:block;position:relative;flex:none;width:calc(1280px*var(--k));height:calc(720px*var(--k));scroll-snap-align:center;scroll-snap-stop:always;border-radius:calc(12px*var(--k));overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.28)}
body[data-nav=v] .slide,body[data-nav=h] .slide{left:0;top:0;right:auto;bottom:auto;width:1280px;height:720px;transform:scale(var(--k))!important;transform-origin:0 0;opacity:1;visibility:visible;transition:none;filter:none}
.tocp{position:fixed;top:0;left:0;bottom:0;width:min(340px,86vw);background:rgba(20,20,24,.95);color:#fff;z-index:20;transform:translateX(-102%);transition:transform .3s;overflow:auto;padding:22px 12px;font:15px/1.5 system-ui,-apple-system,'PingFang TC','Noto Sans TC',sans-serif;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
body.showtoc .tocp{transform:none}
.tocp h4{font-size:13px;letter-spacing:.12em;color:#aaa;margin:0 10px 10px;font-weight:600;font-family:inherit}
.tocp ol{list-style:none}
.tocp button{all:unset;cursor:pointer;display:flex;gap:10px;align-items:baseline;width:100%;box-sizing:border-box;padding:9px 10px;border-radius:8px}
.tocp button:hover,.tocp button:focus-visible{background:rgba(255,255,255,.1)}
.tocp li.cur button{background:rgba(255,255,255,.18)}
.tocp i{font-style:normal;color:#999;min-width:22px;font-variant-numeric:tabular-nums;font-size:13px}
.tocp li.sec button{font-weight:700;margin-top:6px}
.tocp small{color:#8d8d95;margin-left:auto;font-size:12px;white-space:nowrap}
.blk{position:fixed;inset:0;background:#000;z-index:26;display:none}
body.black .blk{display:block}
.dmsg{position:fixed;left:50%;top:18px;transform:translateX(-50%);background:rgba(18,18,22,.92);color:#fff;padding:10px 16px;border-radius:10px;font:14px/1.5 system-ui,-apple-system,'PingFang TC',sans-serif;z-index:40;opacity:0;transition:opacity .3s;pointer-events:none;max-width:90vw;text-align:center}
.dmsg.on{opacity:1}
.rbox{position:fixed;inset:0;background:rgba(10,10,14,.72);display:none;place-items:center;z-index:30;font:16px/1.6 system-ui,-apple-system,'PingFang TC','Noto Sans TC',sans-serif}
.rbox.on{display:grid}
.rcard{background:#fff;color:#1d1d1f;border-radius:18px;padding:26px 28px;width:min(400px,92vw);text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.rcard h3{font:700 20px/1.4 inherit;margin-bottom:4px;font-family:inherit}
.rcard p{font-size:14px;color:#555}
.rqr{width:228px;height:228px;margin:16px auto 10px;display:grid;place-items:center;background:#fff;border:1px solid #eee;border-radius:12px;color:#888;font-size:14px}
.rqr img,.rqr canvas{width:204px!important;height:204px!important}
.rurl{font-size:12px;color:#888;word-break:break-all}
.rst{margin-top:10px;font-weight:700;color:#2E8B57;font-size:15px}
.rst.err{color:#C0392B}
.rcard button{all:unset;cursor:pointer;margin-top:14px;padding:8px 20px;border-radius:10px;background:#1d1d1f;color:#fff;font-size:14px}
.pside{display:none}
body.pres{background:#121316}
body.pres .hud,body.pres .ctrl,body.pres .notes{display:none!important}
body.pres .pside{display:flex;position:fixed;top:0;right:0;bottom:0;width:36%;padding:18px 20px;flex-direction:column;gap:10px;color:#E9E9EC;font:16px/1.6 system-ui,-apple-system,'PingFang TC','Noto Sans TC',sans-serif;background:#1B1C21;border-left:1px solid #2A2B31}
.prow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ptime{font-size:34px;font-variant-numeric:tabular-nums;font-weight:700;margin-right:6px}
.pside button{all:unset;cursor:pointer;padding:6px 12px;border-radius:8px;background:#2C2E36;font-size:14px;text-align:center}
.pside button:hover,.pside button:focus-visible{background:#3A3C46}
.pclock{margin-left:auto;color:#9A9BA3;font-variant-numeric:tabular-nums}
.plabel{font-size:13px;color:#9A9BA3;letter-spacing:.08em;display:flex;justify-content:space-between}
.pnext{position:relative;aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:#000;flex:none;width:72%}
.pnext .slide{left:0;top:0;right:auto;bottom:auto;width:1280px;height:720px;transform:scale(var(--nk,.2))!important;transform-origin:0 0;opacity:1;visibility:visible;transition:none;filter:none}
.pnext .r,.pnext .f{opacity:1!important;transform:none!important;transition:none!important}
.pnext .pend{position:absolute;inset:0;display:grid;place-items:center;color:#888;font-size:15px}
.pnotes{flex:1;min-height:80px;overflow:auto;font-size:22px;line-height:1.75;white-space:pre-line;background:#24252B;border-radius:10px;padding:14px 18px}
.pnotes.empty{color:#7B7C84;font-size:15px}
.pbtns{display:flex;gap:10px;align-items:center}
.pbtns button{flex:1;padding:14px;font-size:16px;background:#3B3D46}
.ppg{min-width:72px;text-align:center;font-variant-numeric:tabular-nums}
.ptitle{font-size:15px;color:#C9CAD0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media print{
  body[data-nav] .stage{position:static!important;display:block!important;overflow:visible!important;padding:0!important;transform:none!important}
  .cell{display:block!important;width:1280px!important;height:720px!important;box-shadow:none!important;border-radius:0!important;position:relative!important}
  body[data-nav] .slide,.slide{transform:none!important;transition:none!important;opacity:1!important;visibility:visible!important;filter:none!important}
  .f{opacity:1!important;transform:none!important}
  .tocp,.rbox,.pside,.blk,.dmsg{display:none!important}
}`;

  const ICON = {
    prev: '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
    toc: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    pres: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M7 21h10M12 17v4M6 8h7M6 11h5"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
  };

  /* ---------- 播放程式（會原封不動放進匯出的檔案） ---------- */
  function runtime() {
    var B = document.body, D = document, stage = D.querySelector('.stage');
    var mode = B.getAttribute('data-mode') || 'play';
    if (mode === 'play' && /presenter/.test(location.hash)) mode = 'pres';
    var nav = mode === 'play' ? (B.getAttribute('data-nav') || 'page') : 'page';
    B.setAttribute('data-nav', nav);
    var stepOn = B.getAttribute('data-step') === '1' && nav === 'page' && (mode === 'play' || mode === 'pres');
    if (stepOn) B.classList.add('stepping');
    var embedded = location.protocol === 'about:';
    var slides = [], cellsEl = [], N = 0, cur = 0, fr = 0, idle = 0;
    var auto = +(B.getAttribute('data-auto') || 0), autoT = 0;
    var bar = D.querySelector('.hud i'), pg = D.querySelector('.ctrl .pg'), notes = D.querySelector('.notes');
    var other = null;          // 講者視窗 <-> 主畫面
    var conns = [], peer = null; // 手機遙控
    var obs = null, scrollLock = 0;

    function tell(m) { try { if (parent !== window) parent.postMessage(Object.assign({ wst: 1 }, m), '*'); } catch (e) {} }
    function el(tag, cls, html) { var x = D.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
    var msgEl = el('div', 'dmsg'), msgT = 0; B.appendChild(msgEl);
    function say(t, ms) { msgEl.textContent = t; msgEl.classList.add('on'); clearTimeout(msgT); msgT = setTimeout(function () { msgEl.classList.remove('on'); }, ms || 2600); }
    var blk = el('div', 'blk'); B.appendChild(blk); blk.onclick = function () { B.classList.remove('black'); };
    function frags(n) { return slides[n] ? [].slice.call(slides[n].querySelectorAll('.f')) : []; }
    function titleAt(n) { return slides[n] ? (slides[n].getAttribute('data-title') || '') : ''; }

    var toc = null;
    function buildToc() {
      if (B.getAttribute('data-toc') === '0' || mode !== 'play') return;
      if (!toc) { toc = el('nav', 'tocp'); toc.setAttribute('aria-label', '目錄'); B.appendChild(toc); }
      toc.innerHTML = '<h4>目錄</h4><ol>' + slides.map(function (s, j) {
        var k = s.getAttribute('data-kind') || '', sec = /t-section|t-cover/.test(s.className);
        return '<li class="' + (sec ? 'sec' : '') + '"><button type="button" data-j="' + j + '"><i>' + (j + 1) + '</i><span></span><small>' + k + '</small></button></li>';
      }).join('') + '</ol>';
      [].forEach.call(toc.querySelectorAll('button'), function (b, j) {
        b.querySelector('span').textContent = titleAt(j);
        b.onclick = function (e) { e.stopPropagation(); go(j, 0); B.classList.remove('showtoc'); };
      });
    }
    function init() {
      slides = [].slice.call(D.querySelectorAll('.stage .slide')); N = slides.length;
      cellsEl = [].slice.call(D.querySelectorAll('.stage .cell'));
      cellsEl.forEach(function (c, j) {
        c.onclick = function () { if (B.classList.contains('ov')) { if (mode === 'ov') { tell({ pick: j }); mark(j); } else { B.classList.remove('ov'); go(j, 0); fit(); } } };
      });
      [].forEach.call(D.querySelectorAll('.stage .opts'), function (box) {
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
      buildToc();
      if (nav !== 'page' && 'IntersectionObserver' in window) {
        if (obs) obs.disconnect();
        obs = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) e.target.querySelector('.slide').classList.add('on');
            if (e.intersectionRatio > .6 && Date.now() > scrollLock) { var j = cellsEl.indexOf(e.target); if (j >= 0 && j !== cur) apply(j, -1, 'scroll'); }
          });
        }, { root: stage, threshold: [0, .6, .9] });
        cellsEl.forEach(function (c) { obs.observe(c); });
      }
    }
    function mark(j) {
      cellsEl.forEach(function (c, k) { c.classList.toggle('cur', k === j); });
      if (toc) [].forEach.call(toc.querySelectorAll('li'), function (li, k) { li.classList.toggle('cur', k === j); });
    }
    function apply(n, f, src) {
      if (!N) return;
      n = Math.max(0, Math.min(N - 1, n | 0));
      var fs = frags(n);
      cur = n; fr = (f < 0 || !stepOn) ? fs.length : Math.min(f, fs.length);
      fs.forEach(function (x, k) { x.classList.toggle('vis', k < fr); });
      if (nav === 'page') slides.forEach(function (s, j) { s.classList.toggle('on', j === n); s.classList.toggle('past', j < n); });
      else slides[n].classList.add('on');
      if (bar) bar.style.width = (N > 1 ? n / (N - 1) * 100 : 100) + '%';
      if (pg) pg.textContent = (n + 1) + ' / ' + N;
      if (notes) notes.textContent = slides[n].getAttribute('data-note') || '';
      mark(n);
      if (mode === 'play' && !embedded) { try { history.replaceState(null, '', '#' + (n + 1)); } catch (e) {} }
      tell({ slide: n, total: N });
      if (mode === 'pres') presDraw();
      if (src !== 'sync') syncOut();
      remoteSend();
      resetAuto();
    }
    function go(n, f, src) {
      apply(n, f == null ? 0 : f, src);
      if (nav !== 'page' && src !== 'scroll' && cellsEl[cur]) {
        scrollLock = Date.now() + 700;
        cellsEl[cur].scrollIntoView({ behavior: src === 'init' ? 'auto' : 'smooth', block: 'center', inline: 'center' });
      }
    }
    function next() {
      var fs = frags(cur);
      if (stepOn && fr < fs.length) { apply(cur, fr + 1); return; }
      if (cur < N - 1) go(cur + 1, 0);
      else if (auto) go(0, 0);
    }
    function prev() { if (cur > 0) go(cur - 1, -1); }
    function resetAuto() {
      clearTimeout(autoT);
      if (auto > 0 && mode === 'play' && !embedded) autoT = setTimeout(next, auto * 1000);
    }
    function fit() {
      var w = innerWidth, h = innerHeight;
      if (B.classList.contains('ov')) {
        B.style.setProperty('--oc', w < 560 ? 2 : w < 1100 ? 3 : 4);
        var cell = D.querySelector('.cell');
        if (cell) B.style.setProperty('--ck', cell.clientWidth / 1280);
        tell({ h: D.documentElement.scrollHeight });
        return;
      }
      if (mode === 'pres') {
        var aw = w * .64, k = Math.min((aw - 40) / 1280, (h - 40) / 720);
        D.documentElement.style.setProperty('--k', k);
        stage.style.left = aw / 2 + 'px'; stage.style.top = h / 2 + 'px';
        var nb = D.querySelector('.pnext'); if (nb) nb.style.setProperty('--nk', nb.clientWidth / 1280);
        return;
      }
      var kk = Math.min(w / 1280, h / 720);
      if (nav !== 'page') kk *= .92;
      D.documentElement.style.setProperty('--k', kk);
    }
    function full() {
      if (embedded) { say('先按「全螢幕播放」開新分頁，再用全螢幕'); return; }
      if (D.fullscreenElement || D.webkitFullscreenElement) (D.exitFullscreen || D.webkitExitFullscreen).call(D);
      else { var x = D.documentElement, f = x.requestFullscreen || x.webkitRequestFullscreen; if (f) { var p = f.call(x); if (p && p.catch) p.catch(function () {}); } }
    }
    function ov(v) { if (mode !== 'play' || nav !== 'page') return; B.classList.toggle('ov', v); fit(); if (v && cellsEl[cur]) cellsEl[cur].scrollIntoView({ block: 'center' }); }

    /* 講者模式 */
    function base() { return location.href.split('#')[0]; }
    function openPres() {
      if (embedded) { say('先按「全螢幕播放」開新分頁，再開講者模式'); return; }
      other = window.open(base() + '#presenter', 'wst-presenter', 'popup,width=1280,height=800');
      if (!other) say('瀏覽器擋住了新視窗，請允許這個檔案開啟彈出視窗', 4000);
      else say('講者視窗已開啟：把它拖到你的螢幕，這個畫面投影給大家看', 4200);
    }
    function syncOut() { try { if (other && !other.closed) other.postMessage({ wst: 1, sync: [cur, fr] }, '*'); } catch (e) {} }
    var t0 = Date.now(), paused = 0, pausedAt = 0;
    function presSetup() {
      B.classList.add('pres');
      var s = el('aside', 'pside');
      s.innerHTML = '<div class="prow"><b class="ptime">00:00</b><button data-p="pause">暫停</button><button data-p="reset">重設</button><span class="pclock"></span></div>' +
        '<div class="ptitle"></div><div class="plabel"><span>下一頁</span><span class="pnn"></span></div><div class="pnext"></div>' +
        '<div class="plabel"><span>講稿</span><span>B 鍵：畫面變黑</span></div><div class="pnotes"></div>' +
        '<div class="pbtns"><button data-p="prev">← 上一步</button><span class="ppg"></span><button data-p="next">下一步 →</button></div>';
      B.appendChild(s);
      s.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return; var a = b.getAttribute('data-p');
        if (a === 'prev') prev(); else if (a === 'next') next();
        else if (a === 'reset') { t0 = Date.now(); paused = 0; if (pausedAt) pausedAt = Date.now(); }
        else if (a === 'pause') { if (pausedAt) { paused += Date.now() - pausedAt; pausedAt = 0; b.textContent = '暫停'; } else { pausedAt = Date.now(); b.textContent = '繼續'; } }
        b.blur();
      });
      setInterval(function () {
        var ms = (pausedAt || Date.now()) - t0 - paused, sec = Math.max(0, Math.floor(ms / 1000));
        s.querySelector('.ptime').textContent = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
        var d = new Date(); s.querySelector('.pclock').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
      }, 500);
      other = window.opener || null;
      if (other) try { other.postMessage({ wst: 1, hello: 1 }, '*'); } catch (e) {}
      D.title = '講者模式｜' + D.title;
    }
    function presDraw() {
      var s = D.querySelector('.pside'); if (!s) return;
      var nb = s.querySelector('.pnext'), fs = frags(cur);
      var more = stepOn && fr < fs.length;
      s.querySelector('.ppg').textContent = (cur + 1) + ' / ' + N;
      s.querySelector('.ptitle').textContent = titleAt(cur) + (stepOn && fs.length ? '　（重點 ' + fr + ' / ' + fs.length + '）' : '');
      s.querySelector('.pnn').textContent = more ? '還有重點沒出現' : (cur < N - 1 ? titleAt(cur + 1) : '');
      if (cur < N - 1) { nb.innerHTML = slides[cur + 1].outerHTML; var c = nb.firstChild; c.classList.remove('on', 'past'); c.classList.add('on'); }
      else nb.innerHTML = '<div class="pend">這是最後一頁</div>';
      nb.style.setProperty('--nk', nb.clientWidth / 1280);
      var t = slides[cur].getAttribute('data-note') || '', pn = s.querySelector('.pnotes');
      pn.textContent = t || '這一頁沒有講稿。在內容裡加一行「備註：要說的話」就會出現在這裡。';
      pn.classList.toggle('empty', !t);
    }

    /* 手機遙控：用 PeerJS 連線，掃 QR code 打開遙控頁 */
    var rbox = null;
    function loadJs(src) { return new Promise(function (ok, no) { var s = D.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; D.head.appendChild(s); }); }
    function remoteSend() {
      if (!conns.length) return;
      var st = { t: 'state', i: cur, N: N, f: fr, nf: stepOn ? frags(cur).length : 0, title: titleAt(cur), note: slides[cur] ? slides[cur].getAttribute('data-note') || '' : '', next: titleAt(cur + 1), list: slides.map(function (s, j) { return titleAt(j); }) };
      conns.forEach(function (c) { try { if (c.open) c.send(st); } catch (e) {} });
    }
    function openRemote() {
      if (embedded) { say('先按「全螢幕播放」開新分頁，再用手機遙控'); return; }
      var url = B.getAttribute('data-remote');
      if (!rbox) {
        rbox = el('div', 'rbox');
        rbox.innerHTML = '<div class="rcard" role="dialog" aria-label="手機遙控"><h3>用手機遙控簡報</h3><p>用手機相機掃描 QR code，就能在手機上換頁、看講稿</p><div class="rqr">連線中…</div><div class="rurl"></div><div class="rst"></div><button type="button">關閉</button></div>';
        B.appendChild(rbox);
        rbox.addEventListener('click', function (e) { if (e.target === rbox || e.target.tagName === 'BUTTON') rbox.classList.remove('on'); e.stopPropagation(); });
      }
      rbox.classList.add('on');
      if (peer) return;
      var st = rbox.querySelector('.rst');
      var fail = function (m) { st.textContent = m; st.classList.add('err'); peer = null; };
      if (location.protocol === 'file:' && !navigator.onLine) return fail('手機遙控需要網路，請先連上網路');
      Promise.all([loadJs('https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js'), loadJs('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js')]).then(function () {
        var id = 'wst-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
        peer = new window.Peer(id);
        peer.on('open', function () {
          var link = url + '#' + id, q = rbox.querySelector('.rqr');
          q.innerHTML = ''; new window.QRCode(q, { text: link, width: 204, height: 204, correctLevel: window.QRCode.CorrectLevel.M });
          rbox.querySelector('.rurl').textContent = link;
          st.classList.remove('err'); st.textContent = '等待手機連線…';
        });
        peer.on('connection', function (c) {
          conns.push(c);
          c.on('open', function () { st.textContent = '已連線 ' + conns.filter(function (x) { return x.open; }).length + ' 支手機，可以關掉這個視窗'; say('手機已連線'); remoteSend(); });
          c.on('data', function (d) { if (!d) return; if (d.t === 'next') next(); else if (d.t === 'prev') prev(); else if (d.t === 'go') go(+d.i || 0, 0); else if (d.t === 'black') B.classList.toggle('black'); else if (d.t === 'hi') remoteSend(); });
          c.on('close', function () { conns = conns.filter(function (x) { return x !== c; }); say('有一支手機中斷連線'); });
        });
        peer.on('error', function (e) { fail('連不上遙控伺服器（' + (e && e.type || '網路問題') + '），請確認網路後再按一次'); });
      }, function () { fail('載入遙控功能失敗，手機遙控需要網路'); });
    }

    function key(k, e) {
      if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter') next();
      else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') prev();
      else if (k === 'Home') go(0, 0);
      else if (k === 'End') go(N - 1, -1);
      else if (k === 'f' || k === 'F') full();
      else if (k === 'o' || k === 'O' || k === 'g' || k === 'G') ov(!B.classList.contains('ov'));
      else if (k === 't' || k === 'T') { if (toc) B.classList.toggle('showtoc'); }
      else if (k === 'Escape') { ov(false); B.classList.remove('showtoc', 'black'); if (rbox) rbox.classList.remove('on'); }
      else if (k === 'n' || k === 'N') B.classList.toggle('shownotes');
      else if (k === 'b' || k === 'B' || k === '.') B.classList.toggle('black');
      else if ((k === 'p' || k === 'P') && mode === 'play') openPres();
      else if ((k === 'r' || k === 'R') && mode === 'play' && B.getAttribute('data-remote')) openRemote();
      else return false;
      if (e) e.preventDefault();
      return true;
    }

    init();
    if (mode === 'ov') B.classList.add('ov');
    if (mode === 'pres') presSetup();
    var h = parseInt((location.hash || '').slice(1), 10);
    go(isNaN(h) ? +(B.getAttribute('data-start') || 0) : h - 1, -1, 'init');
    if (nav === 'page' && stepOn && isNaN(h) && !+(B.getAttribute('data-start') || 0)) apply(cur, 0);
    fit();
    addEventListener('resize', fit);
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(fit);
    if (mode === 'thumb') return;
    D.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && t.closest && t.closest('input,textarea,select,[contenteditable]')) return;
      if (t && t.closest && t.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
      if (B.classList.contains('ov') && /^Arrow/.test(e.key)) return;
      key(e.key, e);
    });
    stage.addEventListener('click', function (e) {
      if (B.classList.contains('showtoc')) { B.classList.remove('showtoc'); return; }
      if (B.classList.contains('ov') || mode !== 'play' || nav !== 'page') return;
      if (e.target.closest('button,a,input,textarea,select,.ans')) return;
      if (e.clientX / innerWidth < .3) prev(); else next();
    });
    if (nav === 'h') stage.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      if (B.getAttribute('data-snap') === '1') { if (Date.now() < scrollLock) return; if (e.deltaY > 0) next(); else prev(); }
      else stage.scrollLeft += e.deltaY;
    }, { passive: false });
    var tx = null, ty = 0;
    addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    addEventListener('touchend', function (e) {
      if (tx == null || B.classList.contains('ov') || nav !== 'page') return;
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev(); }
    }, { passive: true });
    var ctrl = D.querySelector('.ctrl');
    if (ctrl) {
      if (B.getAttribute('data-toc') === '0') { var tb = ctrl.querySelector('[data-a=toc]'); if (tb) tb.remove(); }
      if (!B.getAttribute('data-remote')) [].forEach.call(ctrl.querySelectorAll('[data-a=pres],[data-a=phone]'), function (x) { x.remove(); });
      if (nav !== 'page') { var gb = ctrl.querySelector('[data-a=grid]'); if (gb) gb.remove(); }
      ctrl.addEventListener('click', function (e) {
        e.stopPropagation();
        var b = e.target.closest('button'); if (!b) return;
        var a = b.getAttribute('data-a');
        if (a === 'prev') prev(); else if (a === 'next') next(); else if (a === 'grid') ov(!B.classList.contains('ov'));
        else if (a === 'full') full(); else if (a === 'toc') B.classList.toggle('showtoc');
        else if (a === 'pres') openPres(); else if (a === 'phone') openRemote();
      });
    }
    addEventListener('mousemove', function () { B.classList.add('ui'); clearTimeout(idle); idle = setTimeout(function () { B.classList.remove('ui'); }, 2400); });
    addEventListener('message', function (e) {
      var d = e.data; if (!d || !d.wst) return;
      if (d.hello) { other = e.source; syncOut(); return; }
      if (d.sync) { apply(d.sync[0], d.sync[1], 'sync'); if (nav !== 'page' && cellsEl[cur]) { scrollLock = Date.now() + 700; cellsEl[cur].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); } return; }
      if (typeof d.go === 'number') go(d.go, d.f == null ? 0 : d.f);
      if (d.key) key(d.key);
      if (typeof d.swap === 'string') { stage.innerHTML = d.swap; init(); go(typeof d.at === 'number' ? d.at : cur, -1, 'init'); fit(); }
    });
    if (/print/.test(location.hash)) {
      var pr = function () { setTimeout(function () { print(); }, 300); };
      if (D.fonts && D.fonts.ready) D.fonts.ready.then(pr); else pr();
    }
  }

  function fontLink(fonts) {
    const fams = [...new Set(fonts)].map(f => 'family=' + f.replace(/ /g, '+')).join('&');
    if (!fams) return '';
    return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fams}&display=swap">`;
  }

  const VMAP = { bg: 'bg', fg: 'fg', muted: 'muted', ac: 'ac', ac2: 'ac2', card: 'card', line: 'line', edge: 'edge', secBg: 'sec-bg', secFg: 'sec-fg', secAc: 'sec-ac', onAc: 'on-ac', hl: 'hl', hf: 'hf', bf: 'bf', nf: 'nf', hw: 'hw', qw: 'qw', ls: 'ls', rad: 'rad', cb: 'cb' };
  function varsOf(theme, c) {
    const v = Object.assign({}, theme.vars || {});
    const pal = PALETTES[c.palette];
    if (pal) Object.assign(v, pal.v);
    const f = FONTS[c.font];
    if (f) { v.hf = f.hf; v.bf = f.bf; v.hw = f.hw; delete v.nf; v.qw = f.hw; }
    if (c.accent) { v.ac = c.accent; }
    const sp = { fast: .6, slow: 1.6 }[c.speed];
    let s = Object.keys(v).filter(k => VMAP[k]).map(k => `--${VMAP[k]}:${v[k]}`).join(';');
    if (sp) s += `;--sp:${sp}`;
    return s;
  }

  function titleOf(slides, fallback) {
    const s = slides.find(x => x.type === 'cover' && x.title) || slides.find(x => x.title);
    return (s && plain(s.title)) || fallback || '網頁簡報';
  }

  const REMOTE_URL = 'https://mattsue1003.github.io/web-slide-templates/remote.html';
  /* opt.mode: play（播放，預設）| thumb（只畫第一頁、不動）| ov（一覽，點一頁會通知外層）
     opt.start：從第幾頁開始（0 起算）；opt.cfg：自訂設定；opt.remoteUrl：手機遙控頁的網址 */
  function build(theme, src, opt) {
    opt = opt || {};
    const c = cleanCfg(opt.cfg);
    let slides = parse(src);
    if (!slides.length) slides = parse('=== 封面\n# 還沒有內容\n## 在左邊的框框寫下你的簡報');
    if (opt.mode === 'thumb') slides = slides.slice(0, 1);
    const title = titleOf(slides, theme.name);
    const fonts = (theme.fonts || []).concat(FONTS[c.font] ? FONTS[c.font].g : []);
    const remote = on(c, 'remote') ? (opt.remoteUrl || REMOTE_URL) : '';
    const ctrl = opt.mode === 'thumb' ? '' : `<div class="hud"><i></i></div><div class="ctrl"><button data-a="prev" aria-label="上一頁" title="上一頁（←）">${ICON.prev}</button><span class="pg"></span><button data-a="next" aria-label="下一頁" title="下一頁（→）">${ICON.next}</button><button data-a="toc" aria-label="目錄" title="目錄（T）">${ICON.toc}</button><button data-a="grid" aria-label="全部頁面" title="全部頁面（O）">${ICON.grid}</button><button data-a="pres" aria-label="講者模式" title="講者模式：講稿、下一頁、計時（P）">${ICON.pres}</button><button data-a="phone" aria-label="手機遙控" title="手機掃描遙控（R）">${ICON.phone}</button><button data-a="full" aria-label="全螢幕" title="全螢幕（F）">${ICON.full}</button></div><div class="notes"></div>`;
    const attrs = [
      `data-tr="${esc(c.tr || theme.tr || 'fade')}"`, `data-anim="${esc(c.anim || '')}"`, `data-mode="${esc(opt.mode || 'play')}"`,
      `data-start="${opt.start | 0}"`, `data-nav="${esc(c.nav || 'page')}"`, `data-snap="${on(c, 'snap') ? 1 : 0}"`,
      `data-step="${c.step ? 1 : 0}"`, `data-auto="${+c.auto || 0}"`, `data-toc="${on(c, 'toc') ? 1 : 0}"`,
      remote ? `data-remote="${esc(remote)}"` : '', `class="${opt.mode === 'thumb' ? 'thumb' : ''}"`,
    ].join(' ');
    return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="generator" content="網頁簡報範本庫 · ${esc(theme.name)}">${fontLink(fonts)}<style>:root{${varsOf(theme, c)}}${BASE}${BASE2}${theme.css || ''}${cfgCss(c)}</style></head><body ${attrs}><div class="stage">${cells(slides, c)}</div>${ctrl}<script>(${runtime.toString()})()<\/script></body></html>`;
  }

  window.WST = { TYPES, NAME, OPTS, FONTS, PALETTES, cleanCfg, parse, warnings, build, cells, titleOf, esc };
})();
