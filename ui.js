'use strict';
/* ============ Битва Призывателей Душ — арена (CSS 3D) ============ */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let ME = 0, FOE = 1;
const FN = () => Game.st ? Game.st.players[FOE].name : 'Соперник';
const ON = () => !!Net.role;
const A = (f, ...a) => { if (Net.role === 'guest') Net.send({ t: 'act', f, a }); else window[f](...a); };
const ry = p => SY[p === ME ? 0 : 1], sg = p => SIG[p === ME ? 0 : 1];
const stars = n => '★'.repeat(n);
const IMG = { c: id => `c/${id}.webp`, t: gid => GATES[gid].home ? `t/${GATES[gid].home}.webp` : null, f: o => o === 'U' ? null : `f/${o}.webp` };
const FLY = new Set(['valt', 'narm', 'helio', 'vald', 'aur', 'noct', 'karna', 'malg']);
const THEME = { water: '#5cc8ff', fire: '#ff8a2a', nature: '#7dff9a', dark: '#b18cff', light: '#ffe27a', blood: '#ff3a5c', plague: '#b5e04a', plain: '#e6e0d0', void: '#9b6bff', storm: '#d6e4ff' };
const NEUTRAL_ICON = { n_plain: '◇', n_field: '⚔', n_wall: '🛡', n_cross: '✶', n_altar: '✟' };
const TYPE_ICON = { boost: '▲', weak: '▼', swap: '⇄', def: '⛨', cancel: '⊘', poison: '☠', special: '✦' };

const EL = c => `<span title="${CH[c].el}">${ELICON[CH[c].el] || ''}</span>`;
const ui = { screen: 'select', sel: { h: [], b: null, n: null }, pick: null, tab: 'info', cardView: null, heroView: null, rules: false, menu: false,
  bObj: null, bReady: false, anim: { b: null, done: false, timers: [] }, bpick: undefined, sac: false, lastTeam: null, overHidden: false };

Game.hooks.render = () => render();
Game.hooks.delay = (fn, ms) => setTimeout(fn, ms * 1.4);
Game.hooks.sfx = k => Sound.play(k);

/* ---------- геометрия ---------- */
const TW = 1320, TH = 900, SX = [400, 660, 920], SY = [650, 250], SIG = [{ x: 1110, y: 560 }, { x: 210, y: 340 }];
const sideY = p => (p === ME ? TH + 180 : -180);
const hpCls = (h, m) => h / m < .3 ? 'low' : h / m < .6 ? 'mid' : '';
const hpBar = (h, m) => `<div class="hpbar ${hpCls(h, m)}"><i style="width:${Math.max(0, h / m * 100)}%"></i></div>`;
function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
function anim(node, frames, o) { let a = null; try { a = node.animate(frames, Object.assign({ fill: 'forwards' }, o)); } catch (e) { } const d = (o && o.duration || 0) + (o && o.delay || 0) + 40; return { finished: { then: fn => setTimeout(fn, d) } }; }

/* ---------- сцена ---------- */
const scene = { souls: {}, slots: [[null, null, null], [null, null, null]], sig: [null, null] };
function buildStage() {
  $('#stage').innerHTML = `<div id="table"><div class="surface"><div class="ring"></div><div class="mid"></div><div class="zone-lbl zone-foe">${esc((Game.st ? Game.st.players[FOE].name : "СОПЕРНИК").toUpperCase())}</div><div class="zone-lbl zone-me">ТЫ</div></div>
    ${[0, 1].map(p => SX.map(x => `<div class="aslot" style="left:${x}px;top:${SY[p]}px"></div>`).join('')).join('')}</div>`;
  scene.souls = {}; scene.slots = [[null, null, null], [null, null, null]]; scene.sig = [null, null];
}
const T = () => $('#table');
function addSoul(p, cid) {
  const i = scene.slots[p].indexOf(null); scene.slots[p][i] = cid;
  const C = CH[cid], x = SX[i], y = ry(p);
  const orb = el(`<div class="orb" style="--c:${C.col};left:${x}px;top:${sideY(p)}px"></div>`); T().appendChild(orb);
  anim(orb, [{ transform: 'translate3d(0,0,60px) rotateX(-55deg) scale(.6)' }, { transform: `translate3d(0,${(y - sideY(p)) * .55}px,320px) rotateX(-55deg) scale(1.1)`, offset: .55 }, { transform: `translate3d(0,${y - sideY(p)}px,20px) rotateX(-55deg) scale(.9)` }], { duration: 800, easing: 'ease-in' });
  const card = el(`<div class="ccard" data-a="soul" data-v="${p}:${cid}" style="--c:${C.col};left:${x}px;top:${y}px;opacity:0"><div class="cimg" style="background-image:url(${IMG.c(cid)})"></div>
     <div class="holo ${FLY.has(cid) ? 'fly' : ''} ${p === ME ? 'mine' : ''}" style="--c:${C.col}"><div class="beam"></div><div class="hi" style="background-image:url(${IMG.c(cid)})"></div></div>
     <div class="info"></div></div>`);
  T().appendChild(card);
  const ch = Game.st.players[p].chars[cid];
  scene.souls[p + ':' + cid] = { p, cid, card, i, hp: ch.hp };
  setTimeout(() => {
    orb.remove();
    const fl = el(`<div class="flash" style="--c:${C.col};left:${x}px;top:${y}px"></div>`); T().appendChild(fl);
    anim(fl, [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(6)', opacity: 0 }], { duration: 600, easing: 'ease-out' }).finished.then(() => fl.remove());
    card.style.opacity = 1;
    anim(card, [{ transform: 'scale(.2)', filter: 'brightness(3)' }, { transform: 'scale(1.08)', offset: .6 }, { transform: 'none', filter: 'none' }], { duration: 500, fill: 'none' });
    anim(card.querySelector('.holo'), [{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }, { opacity: 1, clipPath: 'inset(0 0 0 0)' }], { duration: 800, delay: 200, easing: 'ease-out', fill: 'none' });
  }, 780);
}
function removeSoul(key, dead) {
  const s = scene.souls[key]; if (!s) return;
  scene.slots[s.p][s.i] = null; delete scene.souls[key];
  anim(s.card, dead ? [{ opacity: 1, filter: 'none' }, { opacity: 1, filter: 'brightness(2.5)', transform: 'scale(1.1)', offset: .2 }, { opacity: 0, filter: 'grayscale(1) blur(8px)', transform: 'scale(1.4)' }] : [{ opacity: 1 }, { opacity: 0, transform: 'translate3d(0,0,200px) scale(.4)' }], { duration: dead ? 1100 : 600, easing: 'ease-in' }).finished.then(() => s.card.remove());
}
function floatOn(card, txt, heal) {
  const f = el(`<div class="float ${heal ? 'heal' : ''}">${txt}</div>`); card.appendChild(f);
  anim(f, [{ opacity: 0, marginTop: '20px' }, { opacity: 1, offset: .15 }, { opacity: 0, marginTop: '-90px' }], { duration: 1600, easing: 'ease-out' }).finished.then(() => f.remove());
}
function sigilHTML(p, gid) {
  const st = Game.st, known = p === ME || st.players[ME].foeKnown, t = IMG.t(gid), G = GATES[gid];
  const c = known ? (THEME[G.theme] || '#ccc') : (p === ME ? '#5fb4ff' : '#ff6b78');
  return `<div class="sigil" style="left:${sg(p).x}px;top:${sg(p).y}px;--c:${c}"><div class="sc" style="background-image:url(${known && t ? t : `x/back${p}.webp`})"></div>
    <div class="sl">${known ? esc(G.n) : 'Закопанные ворота'}</div></div>`;
}
function syncScene() {
  const st = Game.st; if (!st) return;
  const b = st.battle;
  // души
  [0, 1].forEach(p => {
    st.arena[p].forEach(cid => { if (!scene.souls[p + ':' + cid]) addSoul(p, cid); });
  });
  Object.keys(scene.souls).forEach(k => { const s = scene.souls[k]; if (!st.arena[s.p].includes(s.cid)) removeSoul(k, !st.players[s.p].chars[s.cid].alive); });
  const myAtt = ui.pick && ui.pick.p === ME && st.turn === ME && st.phase === 'act' && !b && st.mustPlace === null && st.arena[ME].includes(ui.pick.cid);
  Object.values(scene.souls).forEach(s => {
    const ch = st.players[s.p].chars[s.cid];
    s.card.querySelector('.info').innerHTML = `<b>${EL(s.cid)} ${estBase(s.p, s.cid)}</b>${hpBar(ch.hp, ch.maxhp)}<div class="hpn">${ch.hp} HP</div>`;
    if (ch.hp !== s.hp) { floatOn(s.card, ch.hp < s.hp ? `−${s.hp - ch.hp}` : `+${ch.hp - s.hp}`, ch.hp > s.hp); s.hp = ch.hp; }
    s.card.classList.toggle('sel', !!(ui.pick && ui.pick.p === s.p && ui.pick.cid === s.cid));
    s.card.classList.toggle('target', !!(myAtt && s.p === FOE));
  });
  // закопанные ворота
  [0, 1].forEach(p => {
    const gid = (st.buried.find(g => g.owner === p) || {}).gid, cur = scene.sig[p];
    const key = gid ? gid + (p === FOE && st.players[ME].foeKnown ? '!' : '') : null;
    if (cur && cur.key !== key) {
      const e = cur.el; scene.sig[p] = null;
      if (!gid) anim(e, [{ transform: 'none', opacity: 1 }, { transform: 'translate3d(0,0,220px) rotateY(180deg) scale(1.6)', opacity: 1, offset: .5 }, { transform: 'translate3d(0,0,320px) rotateY(360deg) scale(.5)', opacity: 0 }], { duration: 1400 }).finished.then(() => e.remove());
      else e.remove();
    }
    if (gid && !scene.sig[p]) {
      const e = el(sigilHTML(p, gid)); T().appendChild(e); scene.sig[p] = { el: e, key };
      if (!cur) anim(e, [{ transform: `translate3d(0,${p === ME ? 500 : -500}px,300px) rotateZ(400deg) scale(.6)`, opacity: 1 }, { transform: 'translate3d(0,0,40px) scale(1.1)', offset: .7 }, { transform: 'translate3d(0,0,-6px) scale(.95)', opacity: 1 }], { duration: 1000, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'none' });
    }
  });
  // поле открытых ворот в центре
  const fk = st.field ? st.field.gid + ':' + st.field.owner : null;
  if (scene.field && scene.field.key !== fk) { const e = scene.field.el; scene.field = null; anim(e, [{ opacity: 1 }, { opacity: 0, transform: 'translate3d(0,0,120px) scale(.6)' }], { duration: 700 }).finished.then(() => e.remove()); }
  if (fk && !scene.field) {
    const G = GATES[st.field.gid], t = IMG.t(st.field.gid), c = THEME[G.theme] || '#fff';
    let pts = ''; const smoky = ['dark', 'void', 'plague'].includes(G.theme);
    for (let k = 0; k < 20; k++) { const sz = smoky ? 16 + Math.random() * 22 : 3 + Math.random() * 6; pts += `<span class="pt ${smoky ? 'smoke' : ''}" style="left:${Math.random() * 100}%;width:${sz}px;height:${sz}px;--dx:${(Math.random() - .5) * 120}px;--d:${(1.8 + Math.random() * 2.4).toFixed(2)}s;--dl:${(Math.random() * 2.5).toFixed(2)}s"></span>`; }
    const e = el(`<div class="fieldc" style="--fc:${c}"><div class="fglow"></div><div class="fimg ${t ? '' : 'neutral-art'}" style="${t ? `background-image:url(${t})` : ''}">${t ? '' : NEUTRAL_ICON[st.field.gid] || '◇'}</div>
      <div class="flab">${G.el ? ELICON[G.el] + ' ' : ''}${esc(G.n)}<br><span>${st.field.owner === ME ? 'твоё поле' : 'поле соперника'}</span></div><div class="fxbox">${pts}</div></div>`);
    T().appendChild(e); scene.field = { el: e, key: fk };
    anim(e, [{ transform: 'translate3d(0,0,400px) rotateY(540deg) scale(.4)', opacity: 0 }, { transform: 'translate3d(0,0,60px) rotateY(0) scale(1.2)', opacity: 1, offset: .7 }, { transform: 'none', opacity: 1 }], { duration: 1300, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'none' });
  }
  // выпад атакующего
  if (b && ui.lunge !== b.id) {
    ui.lunge = b.id;
    const A = scene.souls[b.sides[0].pid + ':' + b.sides[0].cid], D = scene.souls[b.sides[1].pid + ':' + b.sides[1].cid];
    if (A && D) {
      const dx = (SX[D.i] - SX[A.i]) * .7, dy = (ry(D.p) - ry(A.p)) * .7;
      setTimeout(() => {
        anim(A.card, [{ transform: 'none' }, { transform: `translate3d(${dx}px,${dy}px,60px)`, offset: .45 }, { transform: 'none' }], { duration: 750, easing: 'ease-in-out', fill: 'none' });
        setTimeout(() => { const fl = el(`<div class="flash" style="--c:#fff;left:${SX[D.i]}px;top:${ry(b.sides[1].pid)}px"></div>`); T().appendChild(fl); anim(fl, [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(5)', opacity: 0 }], { duration: 450 }).finished.then(() => fl.remove()); anim(D.card, [{ transform: 'none' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 300, fill: 'none' }); }, 340);
      }, 50);
    }
  }
}

/* ---------- карты ---------- */
function acard(id, cls = '', attrs = '') {
  const c = CARDS[id], own = c.owner === 'U' ? 'Универсальная' : CH[c.owner].n, f = IMG.f(c.owner);
  return `<div class="acard t-${c.t} ${c.owner === 'U' ? 'univ' : ''} ${cls}" ${attrs} style="${f ? `background-image:url(${f})` : ''}"><div class="in"><div class="an">${esc(c.n)}</div><div class="as">${stars(c.s)}</div>
    <div class="at">${TYPE_ICON[c.t]} ${TYPE[c.t]}</div><div class="ax">${esc(c.x)}</div></div><div class="ow">${esc(own)}</div></div>`;
}
function cardViewModal() {
  return `<div class="modal" data-a="cvX"><div class="cardview">${acard(ui.cardView)}<div class="flex" style="justify-content:center;margin-top:12px"><button data-a="cvX">Закрыть</button></div></div></div>`;
}

/* ---------- экран выбора ---------- */
function renderSelect() {
  const s = ui.sel;
  const hero = c => { const C = CH[c]; return `<div class="pc ${s.h.includes(c) ? 'on' : ''}" data-a="selH" data-v="${c}" style="--c:${C.col};background-image:url(${IMG.c(c)})">
    <div class="info"><span class="pw">${C.base}</span><b>${EL(c)} ${C.n}</b><div class="ro">${C.role} · ${C.el}</div><div>${C.desc}</div></div><button class="ib" data-a="hv" data-v="${c}">ⓘ</button></div>`; };
  const base = c => { const C = CH[c]; return `<div class="pc ${s.b === c ? 'on' : ''}" data-a="selB" data-v="${c}" style="--c:${C.col};background-image:url(${IMG.c(c)})">
    <div class="info"><span class="pw">${C.base}</span><b>${EL(c)} ${C.n}</b><div class="ro">${C.role} · ${C.el}</div><div>${C.desc}</div></div><button class="ib" data-a="hv" data-v="${c}">ⓘ</button></div>`; };
  const gate = g => { const G = GATES[g]; return `<div class="ng ${s.n === g ? 'on' : ''}" data-a="selN" data-v="${g}"><b>${NEUTRAL_ICON[g]} ${G.n}</b><div class="small mut">${G.x}</div><div class="small" style="color:#e6c77a">Открытие: ${G.ox}</div></div>`; };
  const chip = c => `<span class="chip"><i style="background-image:url(${IMG.c(c)})"></i>${CH[c].n}</span>`;
  const ready = s.h.length === 3 && s.b && s.n;
  return `<div class="sel"><div class="wrap">
  <div class="logo"><h1>Битва Призывателей Душ</h1><div class="mut">3 героя + 1 базовый · раунд идёт, пока не падут все 4 души · матч до 2 побед</div></div>
  <div class="bar"><span class="mut">Команда:</span>${s.h.map(chip).join('') || '<span class="mut">выбери 3 героев</span>'}${s.b ? chip(s.b) : ''}${s.n ? `<span class="chip">⛩ ${GATES[s.n].n}</span>` : ''}
   <span style="flex:1"></span><input id="nick" class="nick" maxlength="16" placeholder="Твоё имя" value="${esc(ui.nick || '')}"><button data-a="rand">Случайная команда</button><button data-a="rules">Правила</button>
   ${ui.joinCode ? `<button class="pri" data-a="join" ${ready ? '' : 'disabled'}>Присоединиться к комнате ${ui.joinCode}</button>` : `<button class="pri" data-a="go" ${ready ? '' : 'disabled'}>Против бота</button><button class="pri" data-a="host" ${ready ? '' : 'disabled'}>Играть с другом</button>`}</div>
  ${ui.joinCode ? `<div class="invite">Тебя позвали в комнату <b>${ui.joinCode}</b>. Выбери команду и нажми «Присоединиться». <a href="#" data-a="nojoin">Играть одному</a></div>` : ''}
  <h2>Герои <span class="mut small">${s.h.length}/3 · нажми, чтобы выбрать; ⓘ — посмотреть героя и все его способности</span></h2><div class="pgrid">${HEROES.map(hero).join('')}</div>
  <h2>Базовый персонаж <span class="mut small">${s.b ? 1 : 0}/1 · его можно принести в Подношение ради героя</span></h2><div class="pgrid">${BASES.map(base).join('')}</div>
  <h2>Нейтральные ворота <span class="mut small">${s.n ? 1 : 0}/1</span></h2><div class="ngrid">${NEUTRAL.map(gate).join('')}</div>
  <div style="height:40px"></div></div></div>`;
}
function heroModal(c) {
  const C = CH[c], G = C.home ? GATES[C.home] : null;
  return `<div class="modal" data-a="hvX"><div class="mbox" style="max-width:980px"><div class="hdet"><div class="por" style="background-image:url(${IMG.c(c)});box-shadow:0 0 0 2px ${C.col}"></div>
  <div><h2 style="margin:0">${EL(c)} ${C.n}</h2><div class="mut">${C.t} · ${C.role} · стихия ${C.el}</div><p>${C.desc}${C.aura ? `<br><b>Аура:</b> ${C.aura.el === 'all' ? 'все твои души' : `твои души стихии ${ELICON[C.aura.el]} ${C.aura.el}`} на арене ${C.aura.def ? 'в защите ' : ''}+${C.aura.v}.` : ''}</p><div class="stat"><span>Сила</span><b>${C.base}</b></div><div class="stat"><span>HP</span><b>${C.kind === 'base' ? HP_BASE : HP_HERO}</b></div>
  ${G ? `<div class="ibox"><span class="k">⛩ ${G.n}</span><br>${gateText(C.home)}<br><span class="mut">При открытии: ${G.ox}</span></div>` : ''}<div class="cgrid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">${cardsOf(c).map(id => acard(id)).join('')}</div>
  <div class="flex" style="margin-top:12px"><button data-a="hvX">Закрыть</button></div></div></div></div></div>`;
}
function rulesModal() {
  return `<div class="modal"><div class="mbox"><h2>Как играть</h2><ol>
  <li><b>Матч до 2 побед.</b> Раунд идёт, пока у кого-то не падут все 4 души. В новом раунде все снова живы, HP полное, карты раздаются заново.</li>
  <li><b>HP.</b> Герой 500, базовый 300. Проигравший бой теряет HP: разница в силе + 80. На нуле душа повержена до конца раунда.</li>
  <li><b>Ход.</b> По очереди: призвать душу на арену (до 3), атаковать своей душой любую душу врага или закопать запасные ворота.</li>
  <li><b>Ворота.</b> В начале раунда выбираешь 2 из 4 своих ворот: одни закапываешь в арену, вторые держишь в запасе. Открыть свои закопанные ворота можно в любом своём бою.</li>
  <li><b>Поле.</b> Открытые ворота сразу дают разовый эффект (урон, лечение, сброс карт…) и становятся полем всей арены, пока не откроют другие. Поле стихии даёт +60 своей стихии и −60 слабой к ней — всем, и твоим, и чужим.</li>
  <li><b>Стихии:</b> 💧 Вода бьёт 🔥 Пламя, Пламя бьёт 🌿 Природу, Природа бьёт Воду; ☀ Свет и 🌑 Тьма бьют друг друга; 🌀 Пустота нейтральна.</li>
  <li><b>Минимум одни ворота.</b> Если на арене не осталось закопанных ворот, тот, кто открыл последние, обязан закопать запасные.</li>
  <li><b>Ауры.</b> Некоторые герои усиливают союзников на арене — обычно своей стихии.</li>
  <li><b>Бой:</b> Отмена → Защита → остальные → поле → родные ворота +50. Ничья — побеждает защитник. Способности одноразовые; Подношение базового даёт герою +100 (Карна +150).</li>
  </ol><div class="flex"><button class="pri" data-a="rulesX">Понятно</button></div></div></div>`;
}
/* ---------- HUD ---------- */
function benchSoul(p, c, big) {
  const st = Game.st, P = st.players[p], ch = P.chars[c], C = CH[c];
  const sel = ui.pick && ui.pick.p === p && ui.pick.cid === c;
  return `<div class="bsoul ${ch.alive ? '' : 'dead'} ${sel ? 'sel' : ''}" data-a="soul" data-v="${p}:${c}" style="--c:${C.col};background-image:url(${IMG.c(c)})">
   ${ch.alive ? '' : '<span class="tg">Повержен</span>'}<div class="nm">${EL(c)} ${C.n}<br><b>${estBase(p, c)}</b> · ${ch.hp} HP${ch.alive ? hpBar(ch.hp, ch.maxhp) : ''}</div></div>`;
}
const allSoulsAll = P => [...P.team, P.base];
function hint() {
  const st = Game.st;
  if (st.over || st.battle) return '';
  if (st.phase !== 'act' || st.mustPlace !== null) return '';
  if (st.turn !== ME) return `Ходит ${FN()}…`;
  if (ui.pick && ui.pick.p === ME && st.arena[ME].includes(ui.pick.cid) && st.arena[FOE].length) return `${CH[ui.pick.cid].n} готов. Нажми на душу соперника, подсвеченную красным, чтобы атаковать.`;
  if (!st.arena[ME].length) return 'Твой ход. Нажми на свою душу внизу слева и призови её на арену.';
  if (!st.arena[FOE].length) return 'На арене соперника пусто. Призови ещё душу или закопай запасные ворота.';
  return 'Твой ход: выбери свою душу на арене и атакуй, или призови новую из запаса.';
}
function inspector() {
  const st = Game.st, me = st.players[ME], bt = st.players[FOE];
  const marks = P => [P.poison ? `☠ Яд ${P.poison}` : '', P.spores ? `🍄 Споры ${P.spores}` : '', P.cheer ? `📯 Клич ${P.cheer}` : '', P.tide ? `🌊 Прилив ${P.tide}` : ''].filter(Boolean).join(' · ') || 'нет';
  let body = '';
  if (ui.tab === 'log') body = `<div class="log">${st.log.slice(0, 120).map(l => `<div class="${l.startsWith('Итог') ? 'hl' : l.startsWith('—') ? 'rd' : l.includes('повержен') ? 'ko' : ''}">${esc(l)}</div>`).join('')}</div>`;
  else if (ui.pick) {
    const { p, cid } = ui.pick, P = st.players[p], ch = P.chars[cid], C = CH[cid], G = C.home ? GATES[C.home] : null;
    const onA = st.arena[p].includes(cid);
    const status = !ch.alive ? 'Повержен' : onA ? 'На арене' : 'В запасе';
    const mk = [ch.crystals ? `💎 Кристаллы ${ch.crystals}` : '', ch.roots ? `🌿 Корни ${ch.roots}` : '', ch.gears ? `⚙ Шестерни ${ch.gears}/3` : '', ch.nextBonus ? `${ch.nextBonus > 0 ? '+' : ''}${ch.nextBonus} в следующем бою` : '', ch.warm ? '🔥 Разминка' : ''].filter(Boolean).join(' · ');
    let act = '';
    if (p === ME && st.phase === 'act' && st.turn === ME && !st.battle && st.mustPlace === null && ch.alive) {
      if (!onA && canSummon(ME)) act = `<button class="pri big" data-a="summon" data-v="${cid}">Призвать на арену</button>`;
      else if (!onA) act = '<span class="mut small">На арене уже 3 души.</span>';
      else if (st.arena[FOE].length) act = '<span class="small" style="color:#ff9aa3">Выбери цель — душу соперника на арене.</span>';
    }
    body = `<div class="ihead" style="--c:${C.col}"><div class="por" style="background-image:url(${IMG.c(cid)})"></div><div style="flex:1">
      <h3>${C.n}</h3><div class="tt">${C.t} · ${ELICON[C.el]} ${C.el}</div><div class="stat"><span>Сила</span><b>${estBase(p, cid)}</b></div><div class="stat"><span>HP</span><b>${ch.hp} / ${ch.maxhp}</b></div>${hpBar(ch.hp, ch.maxhp)}
      <div class="small mut" style="margin-top:6px">${p === ME ? 'Твой' : FN()} · ${status}</div></div></div>
      <div class="ibox"><span class="k">${C.role}.</span> ${C.desc}${C.aura ? `<br><span class="k">Аура:</span> ${C.aura.el === 'all' ? 'все твои души' : `твои души стихии ${ELICON[C.aura.el]} ${C.aura.el}`} на арене ${C.aura.def ? 'в защите ' : ''}+${C.aura.v}.` : ''}${mk ? `<br>${mk}` : ''}</div>
      ${G ? `<div class="ibox"><span class="k">⛩ ${G.n}</span><br>${gateText(C.home)}<br><span class="mut">При открытии: ${G.ox}</span></div>` : ''}
      ${act ? `<div class="iact">${act}</div>` : ''}
      ${p === ME ? `<div style="margin-top:12px;font-weight:700">Способности в руке <span class="mut small">· нажми, чтобы прочитать крупно</span></div><div class="cgrid">${usable(me, cid).map(id => acard(id, '', `data-a="card" data-v="${id}"`)).join('') || '<span class="mut small">Карт нет.</span>'}</div>`
        : `<div class="ibox mut">Карты соперника скрыты. В руке: ${bt.hand.length}.</div>`}`;
  } else {
    body = `<div style="font-weight:700;margin-bottom:6px">Нажми на любую душу</div><div class="mut small">Свою — чтобы увидеть её способности и призвать или атаковать. Чужую — чтобы посмотреть на неё.</div>
      <div class="ibox"><span class="k">Поле арены:</span> ${st.field ? `<b>${GATES[st.field.gid].n}</b> (${st.field.owner === ME ? 'твоё' : 'соперника'})<br>${gateText(st.field.gid)}` : 'нет — ворота ещё не открывали'}</div>
      <div class="ibox"><span class="k">Твои закопанные ворота:</span> ${ownBuried(ME).map(g => `<b>${GATES[g.gid].n}</b><br>${gateText(g.gid)}<br><span class="mut">При открытии: ${GATES[g.gid].ox}</span>`).join('') || 'нет'}
        <br><span class="k">Запасные:</span> ${me.reserve ? GATES[me.reserve].n : 'нет'}${canPlace(ME) && st.turn === ME && st.phase === 'act' && !st.battle ? '<div class="iact"><button class="pri" data-a="place">Закопать запасные ворота</button></div>' : ''}</div>
      <div class="ibox"><span class="k">Ворота соперника:</span> ${ownBuried(FOE).length ? (me.foeKnown ? GATES[ownBuried(FOE)[0].gid].n : 'закопаны, неизвестно какие') : 'не закопаны'} · запасные: ${bt.reserve ? 'есть' : 'нет'}</div>
      <div class="ibox"><span class="k">Метки.</span> Ты: ${marks(me)}<br>${esc(FN())}: ${marks(bt)}</div>
      <div class="ibox"><span class="k">Универсальные карты.</span><div class="cgrid">${me.hand.filter(id => CARDS[id].owner === 'U').map(id => acard(id, '', `data-a="card" data-v="${id}"`)).join('') || '<span class="mut small">нет</span>'}</div></div>`;
  }
  return `<aside class="insp"><div class="tabs"><div class="${ui.tab === 'info' ? 'on' : ''}" data-a="tab" data-v="info">Душа</div><div class="${ui.tab === 'log' ? 'on' : ''}" data-a="tab" data-v="log">Журнал</div></div><div class="scroll">${body}</div></aside>`;
}
function renderHUD() {
  const st = Game.st, me = st.players[ME], bt = st.players[FOE];
  const maxT = P => allSoulsAll(P).reduce((a, c) => a + P.chars[c].maxhp, 0);
  const thp = (P, cls, nm) => `<div class="thp"><span class="${cls}">${nm}</span>${hpBar(totalHP(P), maxT(P))}<b>${totalHP(P)}</b></div>`;
  const my = st.phase === 'act' && st.turn === ME && !st.battle;
  const benchOf = p => allSoulsAll(st.players[p]).filter(c => !st.arena[p].includes(c));
  return `<div class="top"><span class="title">Битва Призывателей Душ</span><span class="turnc">${String(st.turnNo).padStart(2, '0')} T</span><span>Раунд <b>${st.round}</b></span><span class="wins"><span class="who-me">${me.wins}</span> : <span class="who-foe">${bt.wins}</span> <span class="mut small">до 2 побед</span></span>
   ${thp(me, 'who-me', 'Ты')}${thp(bt, 'who-foe', esc(FN()))}${ON() ? `<span class="net ${Net.status}">${Net.status === 'connected' ? '🟢' : '🔴'} ${Net.STATUS[Net.status] || ''}</span>` : ''}<span style="flex:1"></span>${my && canPlace(ME) ? '<button data-a="place">Закопать запасные ворота</button>' : ''}<button data-a="snd" title="Звуки">${Sound.sfx ? '🔊' : '🔇'}</button><button data-a="mus" title="Музыка">${Sound.music ? '🎵' : '🎵̸'}</button><button data-a="rules">Правила</button><button data-a="menu">☰ Меню</button></div>
  ${benchOf(FOE).length ? `<div class="benchbox foe"><span class="lb">Запас соперника</span>${benchOf(FOE).map(c => benchSoul(FOE, c)).join('')}</div>` : ''}
  ${benchOf(ME).length ? `<div class="benchbox me"><span class="lb">Твой запас</span>${benchOf(ME).map(c => benchSoul(ME, c)).join('')}</div>` : ''}
  ${hint() ? `<div class="hint">${hint()}</div>` : ''}${inspector()}`;
}
function buryPanel() {
  const st = Game.st, me = st.players[ME];
  if (st.phase !== 'gatepick' || me.picked) return '';
  const first = ui.gp1;
  return `<div class="bury"><b style="font-size:17px">Раунд ${st.round}: ${first ? 'теперь выбери запасные ворота' : 'выбери ворота, которые закопаешь в арену'}</b>
   <div class="small mut">${first ? `Закапываешь «${GATES[first].n}». Запасные понадобятся, когда арена останется без ворот.` : 'Открыть их можно в любом своём бою. Открытые ворота становятся полем всей арены, пока их не сменят другие.'}</div>
   <div class="row">${me.gates.map(g => { const t = IMG.t(g), G = GATES[g]; return `<div class="gpick ${first === g ? 'on' : ''}" data-a="gp" data-v="${g}"><div class="gi ${t ? '' : 'neutral-art'}" style="${t ? `background-image:url(${t})` : ''}">${t ? '' : NEUTRAL_ICON[g]}</div><div class="gn">${G.el ? ELICON[G.el] + ' ' : ''}${G.n}</div><div class="gx">${gateText(g)}</div><div class="gx" style="color:#e6c77a">Открытие: ${G.ox}</div></div>`; }).join('')}</div>
   ${first ? '<div style="margin-top:8px"><button data-a="gpX">Назад</button></div>' : ''}</div>`;
}
function placeModal() {
  const st = Game.st; if (st.mustPlace !== ME || st.battle) return '';
  const g = st.players[ME].reserve, t = IMG.t(g);
  return `<div class="modal"><div class="mbox center"><h2>Арена осталась без ворот</h2><p>Нужно закопать запасные ворота.</p>
   <div style="width:140px;margin:0 auto;aspect-ratio:2/3;border-radius:10px;${t ? `background:url(${t}) center/cover` : 'background:#2a2238'}"></div><p><b>${GATES[g].n}</b><br><span class="small mut">${gateText(g)}</span></p>
   <button class="pri big" data-a="placeF">Закопать</button></div></div>`;
}
function roundModal() {
  const st = Game.st; if (st.phase !== 'roundEnd') return '';
  const w = st.roundWinner;
  return `<div class="modal"><div class="mbox center"><div class="bigt ${w === ME ? 'win' : 'lose'}">${w === ME ? 'Раунд твой!' : 'Раунд за соперником'}</div>
   <p style="font-size:20px">Счёт <b class="who-me">${st.players[ME].wins}</b> : <b class="who-foe">${st.players[FOE].wins}</b> · до 2 побед</p><p class="small mut">В новом раунде все души снова живы, HP полное, карты раздаются заново.</p>
   ${st.roundOk && st.roundOk[ME] ? '<p class="mut">Ждём соперника…</p>' : '<button class="pri big" data-a="nextRound">Следующий раунд</button>'}</div></div>`;
}

/* ---------- Бой ---------- */
function fighter(b, i, final) {
  const st = Game.st, s = b.sides[i], C = CH[s.cid], P = st.players[s.pid], ch = P.chars[s.cid], R = b.R;
  const pw = R ? (final ? R.pw[i] : R.bases[i]) : estBase(s.pid, s.cid);
  const lose = R && R.winner !== i, hpAfter = lose && final ? Math.max(0, ch.hp - R.dmg) : ch.hp;
  const cls = final && R ? (R.winner === i ? 'win' : 'lose') + (lose && hpAfter <= 0 ? ' ko' : '') : '';
  return `<div class="fighter ${i ? 'r' : ''} ${cls}" id="f${i}" style="--c:${C.col}"><div class="side">${P.name} · ${i === 0 ? 'атака' : 'защита'}</div>
   <div class="por" id="por${i}" style="background-image:url(${IMG.c(s.cid)})">${final && lose && hpAfter <= 0 ? '<div class="kotag">ПОВЕРЖЕН</div>' : ''}</div><div class="nm">${C.n}</div><div class="tt">${C.t}</div>
   <div class="hpw"><div class="hpt"><span>HP</span><b id="hpt${i}">${hpAfter} / ${ch.maxhp}</b></div><div id="hpb${i}">${hpBar(hpAfter, ch.maxhp)}</div></div>
   <div class="pow" id="pw${i}">${pw}</div></div>`;
}
function battleOverlay() {
  const st = Game.st, b = st.battle; if (!b || !b.human) return '';
  const hs = b.sides.findIndex(x => x.pid === ME); if (hs < 0) return '';
  if (ui.bObj !== b.id) { const id = b.id; ui.bObj = id; ui.bReady = false; ui.bpick = undefined; ui.sac = false; setTimeout(() => { if (Game.st && Game.st.battle && Game.st.battle.id === id) { ui.bReady = true; render(); } }, 1300); }
  if (!ui.bReady) return '';
  const s = b.sides[hs], P = st.players[s.pid], my = b.ss ? b.ss[hs] : 'done';
  const foeIsBot = st.players[FOE].isBot;
  let body = '', final = false;
  if (b.stage === 'choose' && my === 'done') {
    body = `<div style="text-align:center;padding:30px"><div class="spin"></div><b style="font-size:18px">Ждём, пока ${esc(FN())} выберет карту…</b><div class="small mut">Твой выбор принят и спрятан.</div></div>`;
  } else if (b.stage === 'choose' && my === 'choose') {
    const cards = usable(P, s.cid), pick = ui.bpick === undefined ? null : ui.bpick;
    body = `<div style="text-align:center"><b style="font-size:18px">Способность для ${CH[s.cid].n}</b><div class="small mut">${foeIsBot ? 'Бот уже выбрал карту и держит её закрытой.' : `${esc(FN())} тоже выбирает — тайно.`}</div></div>
    <div class="handrow"><div class="acard none ${pick === null ? 'pick' : ''}" data-a="bpick" data-v="none"><div class="in"><div class="an" style="margin-top:40%">Без способности</div><div class="ax">Сберечь карты</div></div></div>
    ${cards.map(id => acard(id, pick === id ? 'pick' : '', `data-a="bpick" data-v="${id}"`)).join('')}</div>
    ${canSac(s.pid, s.cid) ? `<label class="sac ${ui.sac ? 'on' : ''}" data-a="sac">${ui.sac ? '☑' : '☐'} Подношение: навсегда убрать ${CH[P.base].n} ради +${P.base === 'karna' ? 150 : 100} в этом бою</label>` : ''}
    <button class="pri big" data-a="ready">Готово</button>`;
  } else if (b.stage === 'choose' && my === 'gate') {
    const g = ownBuried(s.pid)[0].gid, t = IMG.t(g);
    body = `<div style="text-align:center"><div class="small mut">Твои закопанные ворота</div><h2 style="margin:4px 0">Открыть карту ворот?</h2></div>
    <div style="display:flex;gap:14px;align-items:center"><div style="width:120px;flex:none;aspect-ratio:2/3;border-radius:10px;${t ? `background:url(${t}) center/cover` : 'background:#2a2238'};box-shadow:0 0 24px ${THEME[GATES[g].theme] || '#fff'}"></div>
    <div><b style="font-size:19px">${GATES[g].el ? ELICON[GATES[g].el] + ' ' : ''}${GATES[g].n}</b><p>${gateText(g)}</p><p style="color:#e6c77a">При открытии: ${GATES[g].ox}</p><p class="mut small">Поле будет действовать на всю арену, пока не откроют другие ворота.${st.field ? ` Сейчас поле: «${GATES[st.field.gid].n}».` : ''}</p></div></div>
    <div class="flex"><button class="pri big" data-a="gyes">Открыть</button><button class="big" data-a="gno">Приберечь</button></div>`;
  } else if (b.stage === 'result') {
    if (ui.anim.id !== b.id) { ui.anim.timers.forEach(clearTimeout); ui.anim = { b, id: b.id, done: false, timers: [] }; ui.anim.start = true; } else ui.anim.b = b;
    final = ui.anim.done;
    const R = b.R, w = b.sides[R.winner].pid, Ls = b.sides[1 - R.winner];
    const lch = st.players[Ls.pid].chars[Ls.cid], ko = lch.hp - R.dmg <= 0;
    const pc = i => { const S = R.S[i]; return S.card ? acard(S.card.id, `flipin ${final && S.canceled ? 'canceled' : ''}`, `id="pc${i}"`) : `<div class="acard none flipin" id="pc${i}"><div class="in"><div class="an" style="margin-top:40%">Без способности</div></div></div>`; };
    const gb = (b.opened.length ? b.opened : b.gates).map(go => { const g = go.gid, t = IMG.t(g), c = THEME[GATES[g].theme] || '#fff'; return `<div class="gban" style="--gc:${c};${final ? '' : 'display:none'}" data-gb><div class="gi ${t ? '' : 'neutral-art'}" style="${t ? `background-image:url(${t})` : 'font-size:26px'}">${t ? '' : NEUTRAL_ICON[g] || '◇'}</div><div><b>${b.opened.length ? (go.owner === ME ? 'Ты открываешь' : 'Бот открывает') + ` «${GATES[g].n}»` : `Поле: «${GATES[g].n}»`}</b><div class="small mut">${gateText(g)}</div></div></div>`; }).join('');
    body = `<div class="played">${pc(0)}${pc(1)}</div>${gb}
    <div id="resbox" style="${final ? '' : 'display:none'};width:100%;text-align:center"><div class="res ${w === ME ? 'win' : 'lose'}">${w === ME ? 'Победа в бою!' : 'Бой проигран'}</div>
    <div class="mut">${CH[Ls.cid].n} теряет <b style="color:#ff6b78">${R.dmg} HP</b>${ko ? ' и повержен' : ''}</div>
    <details style="margin-top:8px"><summary>Как считалось</summary><div class="log" style="text-align:left">${R.L.map(l => `<div>${esc(l)}</div>`).join('')}</div></details>
    <div style="margin-top:10px">${b.ok && b.ok[ME] ? `<span class="mut">Ждём ${esc(FN())}…</span>` : '<button class="pri big" data-a="next">Дальше</button>'}</div></div>`;
  }
  const ca = CH[b.sides[0].cid].col, cd = CH[b.sides[1].cid].col;
  return `<div class="battle" style="--ca:${ca};--cd:${cd}"><div class="bgl"></div><div class="ttl"><span class="turnc">${String(st.turnNo).padStart(2, '0')} T</span></div>
   ${fighter(b, 0, final)}<div class="center"><div class="vs">VS</div>${body}</div>${fighter(b, 1, final)}
   ${b.stage === 'result' && !final ? '<button class="skip" data-a="skip">Пропустить ▸▸</button>' : ''}</div>`;
}
/* последовательная анимация вскрытия */
function runBattleAnim() {
  const b = ui.anim.b, R = b.R, st = Game.st; ui.anim.start = false;
  const aid = ui.anim.id; const at = (ms, fn) => ui.anim.timers.push(setTimeout(() => { if (ui.anim.id === aid && !ui.anim.done) fn(); }, ms));
  const pv = [R.bases[0], R.bases[1]];
  const setPw = (i, v, up) => { const e = $('#pw' + i); if (!e) return; const from = pv[i]; pv[i] = v; const t0 = performance.now();
    e.classList.remove('up', 'dn'); e.classList.add(up ? 'up' : 'dn');
    const step = t => { const k = Math.min(1, (t - t0) / 420); e.textContent = Math.round(from + (v - from) * k); if (k < 1) requestAnimationFrame(step); else setTimeout(() => e.classList.remove('up', 'dn'), 150); }; requestAnimationFrame(step); };
  const pop = (i, txt, src, plus) => { const p = $('#por' + i); if (!p) return; const f = el(`<div class="ftxt ${plus ? 'p' : 'm'}">${txt}<small>${esc(src)}</small></div>`); p.appendChild(f); setTimeout(() => f.remove(), 1300);
    p.classList.remove('hit', 'buff'); void p.offsetWidth; p.classList.add(plus ? 'buff' : 'hit'); Sound.play(plus ? 'buff' : 'hit'); if (!plus) { const sl = el('<div class="slash"></div>'); p.appendChild(sl); setTimeout(() => sl.remove(), 400); } };
  let t = 650;
  if ((b.gates || []).length) { at(t, () => { document.querySelectorAll('[data-gb]').forEach(e => (e.style.display = '')); if (b.opened.length) Sound.play('gate'); }); t += b.opened.length ? 1300 : 600; }
  R.S.forEach((S, i) => { if (S.canceled) at(t, () => { const c = $('#pc' + i); if (c) c.classList.add('canceled'); }); });
  if (R.S.some(S => S.canceled)) t += 700;
  const ev = [];
  [0, 1].forEach(i => R.S[i].boosts.filter(x => x.v > 0).forEach(x => ev.push({ i, v: x.v, src: x.src })));
  [1, 0].forEach(i => { R.S[i].weakIn.filter(x => x.v > 0).forEach(x => ev.push({ i, v: -x.v, src: x.src })); if (R.S[i].selfLoss) ev.push({ i, v: -R.S[i].selfLoss, src: 'Жертва' }); });
  ev.forEach(e => { at(t, () => { setPw(e.i, Math.max(0, pv[e.i] + e.v), e.v > 0); pop(e.i, (e.v > 0 ? '+' : '−') + Math.abs(e.v), e.src, e.v > 0); }); t += 620; });
  at(t, () => { [0, 1].forEach(i => { if (pv[i] !== R.pw[i]) setPw(i, R.pw[i], R.pw[i] > pv[i]); }); });
  t += 600;
  const li = 1 - R.winner, Ls = b.sides[li], ch = st.players[Ls.pid].chars[Ls.cid], after = Math.max(0, ch.hp - R.dmg);
  at(t, () => { $('#f' + R.winner)?.classList.add('win'); $('#f' + li)?.classList.add('lose'); pop(li, `−${R.dmg} HP`, 'урон', false);
    const hb = $('#hpb' + li); if (hb) hb.innerHTML = hpBar(ch.hp, ch.maxhp); setTimeout(() => { const hb2 = $('#hpb' + li); if (hb2) { hb2.querySelector('.hpbar').className = 'hpbar ' + hpCls(after, ch.maxhp); hb2.querySelector('i').style.width = (after / ch.maxhp * 100) + '%'; } const tx = $('#hpt' + li); if (tx) tx.textContent = `${after} / ${ch.maxhp}`; }, 30); });
  t += 1000;
  if (after <= 0) { at(t, () => { Sound.play('ko'); const f = $('#f' + li); f?.classList.add('ko'); $('#por' + li)?.appendChild(el('<div class="kotag">ПОВЕРЖЕН</div>')); }); t += 900; }
  at(t, () => { ui.anim.done = true; Sound.play(b.sides[R.winner].pid === ME ? 'win' : 'lose'); const r = $('#resbox'); if (r) r.style.display = ''; const sk = $('.skip'); if (sk) sk.remove(); });
}
function overModal() {
  const st = Game.st; if (!st.over || ui.overHidden) return '';
  const w = st.over.w;
  return `<div class="modal"><div class="mbox center"><div class="bigt ${w === ME ? 'win' : w < 0 ? '' : 'lose'}">${w === ME ? 'Победа!' : w < 0 ? 'Ничья' : 'Поражение'}</div>
  <p style="font-size:20px">Раунды: <b class="who-me">${st.players[ME].wins}</b> : <b class="who-foe">${st.players[FOE].wins}</b></p><div class="flex" style="justify-content:center">${Net.role === 'guest' ? '<span class="mut">Реванш запускает хозяин комнаты.</span>' : '<button class="pri" data-a="again">Реванш теми же командами</button>'}<button data-a="tomenu">${ON() ? 'Выйти из комнаты' : 'Выбрать команду'}</button><button data-a="close">Посмотреть арену</button></div></div></div>`;
}
function menuModal() {
  return `<div class="modal"><div class="mbox center"><h2>Меню</h2><div style="display:flex;flex-direction:column;gap:8px">
   <button class="pri" data-a="menuX">Продолжить</button><button data-a="rules">Правила</button>${ON() ? '' : '<button data-a="again">Начать заново той же командой</button>'}<button data-a="tomenu">${ON() ? 'Выйти из комнаты' : 'Выйти в главное меню'}</button></div>
   ${ON() ? `<p class="small mut">Комната ${Net.code}. Ссылка для друга:<br><code>${esc(Net.link(Net.code))}</code></p>` : ''}</div></div>`;
}

/* ---------- отрисовка ---------- */
function render() {
  const modals = () => (ui.cardView ? cardViewModal() : '') + (ui.heroView ? heroModal(ui.heroView) : '') + (ui.menu ? menuModal() : '') + (ui.rules ? rulesModal() : '');
  if (ui.screen === 'lobby') { $('#sel').innerHTML = lobbyScreen(); $('#hud').innerHTML = ''; $('#bt').innerHTML = modals(); return; }
  if (ui.screen === 'select' || !Game.st) { $('#sel').innerHTML = renderSelect(); $('#hud').innerHTML = ''; $('#bt').innerHTML = modals(); return; }
  $('#sel').innerHTML = '';
  syncScene();
  const bo = battleOverlay();
  $('#hud').style.visibility = bo ? 'hidden' : '';
  $('#hud').innerHTML = renderHUD() + buryPanel();
  ui.prevPhase = Game.st.phase;
  $('#bt').innerHTML = bo + overModal() + roundModal() + placeModal() + modals();
  if (bo && ui.anim.start && Game.st.battle && ui.anim.id === Game.st.battle.id) runBattleAnim();
}
function lobbyScreen() {
  const link = Net.code ? Net.link(Net.code) : '';
  const host = Net.role === 'host';
  return `<div class="sel"><div class="wrap" style="max-width:640px;text-align:center;padding-top:60px">
   <div class="logo"><h1>Битва Призывателей Душ</h1></div>
   ${host ? `<h2>Комната ${Net.code} создана</h2><p>Отправь другу эту ссылку. Когда он откроет её и выберет команду, матч начнётся сам.</p>
     <div class="linkbox"><input id="lnk" readonly value="${esc(link)}"><button class="pri" data-a="copy">${ui.copied ? 'Скопировано ✓' : 'Копировать'}</button></div>`
    : `<h2>Комната ${Net.code}</h2><p>Подключаемся к хозяину комнаты…</p>`}
   <p class="netline"><span class="spin"></span> ${Net.STATUS[Net.status] || ''}</p>
   <button data-a="tomenu" style="margin-top:20px">Отмена</button></div></div>`;
}
function startGame(team) {
  ui.screen = 'game'; ui.gp1 = null; ui.pick = null; ui.overHidden = false; ui.menu = false; ui.tab = 'info'; ui.lastTeam = JSON.parse(JSON.stringify(team));
  buildStage();
  let bot; do { bot = randomTeam(); } while (bot.h.some(h => team.h.includes(h)) && Math.random() < .8);
  newMatch(team, bot, [false, true]);
}

document.addEventListener('contextmenu', ev => { const t = ev.target.closest('[data-a=selH],[data-a=selB]'); if (t) { ev.preventDefault(); ui.heroView = t.dataset.v; render(); } });
document.addEventListener('click', ev => {
  Sound.init();
  const t = ev.target.closest('[data-a]'); if (!t) return;
  if (['bpick', 'card', 'soul', 'gp', 'selH', 'selB', 'selN'].includes(t.dataset.a)) Sound.play('card'); else Sound.play('click');
  const a = t.dataset.a, v = t.dataset.v, st = Game.st;
  if ((a === 'cvX' || a === 'hvX') && ev.target !== t && a === t.dataset.a && t.classList.contains('modal')) { /* клик по фону */ }
  switch (a) {
    case 'selH': { const h = ui.sel.h; if (h.includes(v)) h.splice(h.indexOf(v), 1); else if (h.length < 3) h.push(v); break; }
    case 'selB': ui.sel.b = v; break;
    case 'selN': ui.sel.n = v; break;
    case 'rand': { const r = randomTeam(); ui.sel = { h: r.h, b: r.b, n: r.n }; break; }
    case 'rules': ui.rules = true; ui.menu = false; break;
    case 'rulesX': ui.rules = false; break;
    case 'go': startGame(ui.sel); return;
    case 'host': Online.create(); return;
    case 'nojoin': ev.preventDefault(); ui.joinCode = null; history.replaceState(null, '', location.pathname + location.search); break;
    case 'join': Online.join(); return;
    case 'copy': try { navigator.clipboard.writeText(Net.link(Net.code)); ui.copied = true; } catch (e) { const i = $('#lnk'); if (i) { i.select(); } } break;
    case 'again': if (Net.role === 'host') { Online.rematch(); return; } if (ui.lastTeam && !ON()) { startGame(ui.lastTeam); return; } break;
    case 'tomenu': Online.leave(); ui.screen = 'select'; ui.menu = false; Game.st = null; $('#stage').innerHTML = ''; break;
    case 'menu': ui.menu = true; break;
    case 'menuX': ui.menu = false; break;
    case 'close': ui.overHidden = true; break;
    case 'tab': ui.tab = v; break;
    case 'card': ui.cardView = v; break;
    case 'cvX': ui.cardView = null; break;
    case 'hvX': ui.heroView = null; break;
    case 'hv': ui.heroView = v; break;
    case 'gp': if (!ui.gp1) ui.gp1 = v; else if (ui.gp1 !== v) { const a1 = ui.gp1; ui.gp1 = null; A('pickGates', ME, a1, v); return; } break;
    case 'gpX': ui.gp1 = null; break;
    case 'place': A('placeGate', ME); return;
    case 'placeF': A('placeGate', ME, true); return;
    case 'nextRound': ui.pick = null; Sound.play('round'); A('nextRound', ON() ? ME : undefined); if (ON()) render(); return;
    case 'snd': Sound.toggleSfx(); break;
    case 'mus': Sound.toggleMusic(); break;
    case 'soul': {
      if (!st) break;
      const [ps, cid] = v.split(':'), p = +ps;
      if (p === FOE && ui.pick && ui.pick.p === ME && st.phase === 'act' && st.turn === ME && !st.battle && attackers(ME).includes(ui.pick.cid) && st.arena[FOE].includes(cid)) { const a2 = ui.pick.cid; A('attack', ME, a2, cid); return; }
      ui.pick = ui.pick && ui.pick.p === p && ui.pick.cid === cid ? null : { p, cid }; ui.tab = 'info';
      break;
    }
    case 'summon': A('summon', ME, v); return;
    case 'bpick': ui.bpick = v === 'none' ? null : v; break;
    case 'sac': ui.sac = !ui.sac; break;
    case 'ready': { const p = ui.bpick === undefined ? null : ui.bpick, s = ui.sac; A('humanChoose', ME, p, s); return; }
    case 'gyes': A('humanGate', ME, true); return;
    case 'gno': A('humanGate', ME, false); return;
    case 'skip': ui.anim.timers.forEach(clearTimeout); ui.anim.done = true; break;
    case 'next': ui.anim.timers.forEach(clearTimeout); A('finishBattle', ON() ? ME : undefined); if (ON()) render(); return;
  }
  render();
});
/* ---------- онлайн ---------- */
const SS = () => (k => k === 'bpd_nick' ? localStorage : sessionStorage);
const store = { get: k => { try { return JSON.parse(SS()(k).getItem(k) || 'null'); } catch (e) { return null; } }, set: (k, v) => { try { SS()(k).setItem(k, JSON.stringify(v)); } catch (e) { } }, del: k => { try { SS()(k).removeItem(k); } catch (e) { } } };
const clone = o => JSON.parse(JSON.stringify(o));
const ACTS = ['pickGates', 'summon', 'attack', 'placeGate', 'humanChoose', 'humanGate', 'finishBattle', 'nextRound'];
const Online = {
  nick() { const i = $('#nick'); const v = ((i && i.value.trim()) || ui.nick || 'Игрок').slice(0, 16); ui.nick = v; store.set('bpd_nick', v); return v; },
  create() {
    const name = this.nick(), code = Net.genCode();
    ui.hostInfo = { code, name, team: clone(ui.sel), guest: null }; store.set('bpd_host', ui.hostInfo); store.del('bpd_state');
    history.replaceState(null, '', location.pathname + location.search + '#room-' + code);
    ME = 0; FOE = 1; Net.onData = Online.onHost; Net.onStatus = s => { render(); if (s === 'connected') Online.sync(); }; Net.host(code);
    ui.screen = 'lobby'; ui.copied = false; render();
  },
  startMatch(guest) {
    ui.hostInfo.guest = guest; store.set('bpd_host', ui.hostInfo);
    ui.screen = 'game'; ui.gp1 = null; ui.pick = null; ui.overHidden = false; ui.menu = false; ui.tab = 'info';
    buildStage(); newMatch(ui.hostInfo.team, guest.team, [false, false], [ui.hostInfo.name, guest.name]);
  },
  rematch() { if (ui.hostInfo && ui.hostInfo.guest) this.startMatch(ui.hostInfo.guest); },
  onHost(m) {
    if (!m) return;
    if (m.t === 'hello') { if (!Game.st && m.team && m.team.h && m.team.h.length === 3) Online.startMatch({ name: String(m.name || 'Гость').slice(0, 16), team: m.team }); else Online.sync(); }
    else if (m.t === 'act') { if (!Game.st || !ACTS.includes(m.f) || !Array.isArray(m.a) || m.a[0] !== 1) return; try { window[m.f](...m.a); } catch (e) { console.warn(e); } }
  },
  sync() {
    if (Net.role !== 'host' || !Game.st) return;
    const j = JSON.stringify(Object.assign({}, Game.st, { log: Game.st.log.slice(0, 80) }));
    Net.send({ t: 'state', j }); try { sessionStorage.setItem('bpd_state', j); } catch (e) { }
  },
  join() {
    const name = this.nick(), code = ui.joinCode, team = clone(ui.sel);
    store.set('bpd_guest', { code, name, team });
    this.connectGuest(code, name, team);
  },
  connectGuest(code, name, team) {
    ME = 1; FOE = 0; Net.onData = Online.onGuest; Net.onStatus = () => render();
    Net.join(code, { t: 'hello', name, team }); ui.screen = 'lobby'; render();
  },
  onGuest(m) {
    if (!m || m.t !== 'state') return;
    const s = JSON.parse(m.j), first = ui.screen !== 'game' || !Game.st;
    const prevN = Game.st ? Game.st.logN || 0 : s.logN || 0;
    Game.st = s;
    if (first) { ui.screen = 'game'; ui.gp1 = null; ui.pick = null; ui.overHidden = false; buildStage(); }
    const fresh = s.log.slice(0, Math.max(0, Math.min(10, (s.logN || 0) - prevN))).join(' ');
    if (/закапывает/.test(fresh)) Sound.play('bury'); if (/призывает/.test(fresh)) Sound.play('summon'); if (/атакует/.test(fresh)) Sound.play('attack');
    render();
  },
  leave() {
    if (!Net.role) return;
    Net.leave(); store.del('bpd_host'); store.del('bpd_state'); store.del('bpd_guest');
    history.replaceState(null, '', location.pathname + location.search); ui.joinCode = null; ME = 0; FOE = 1;
  },
  boot() {
    ui.nick = store.get('bpd_nick') || '';
    const m = location.hash.match(/room-([A-Z0-9]{6})/); if (!m) return;
    const code = m[1], h = store.get('bpd_host'), g = store.get('bpd_guest');
    if (h && h.code === code) {
      ui.hostInfo = h; ME = 0; FOE = 1; Net.onData = Online.onHost; Net.onStatus = s => { render(); if (s === 'connected') Online.sync(); }; Net.host(code);
      let j = null; try { j = sessionStorage.getItem('bpd_state'); } catch (e) { }
      if (j) { setTimeout(() => Online.sync(), 600); try { Game.st = JSON.parse(j); const b = Game.st.battle; if (b && b.stage === 'result') b.R = resolve(Game.st, b); ui.screen = 'game'; buildStage(); } catch (e) { Game.st = null; ui.screen = 'lobby'; } }
      else ui.screen = 'lobby';
      return;
    }
    ui.joinCode = code;
    if (g && g.code === code) this.connectGuest(code, g.name, g.team);
  },
};
Game.hooks.render = () => { render(); Online.sync(); };
document.addEventListener('input', e => { if (e.target.id === 'nick') ui.nick = e.target.value; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (ui.cardView || ui.heroView) { ui.cardView = ui.heroView = null; } else if (Game.st) { ui.menu = !ui.menu; ui.rules = false; } render(); } });
Online.boot();
render();
