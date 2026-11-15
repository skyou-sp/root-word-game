// 미니게임: 어근 단어 사냥. 어근 하나가 주어지면, 8개 단어 중 그 어근으로 만든 단어 4개를 고른다.
const HUNT_ROUNDS = 3, HUNT_GOOD = 4, HUNT_BAD = 4, HUNT_PERFECT_BONUS = 2;

let hunt = null;

function startHunt() {
  touchStreak(save);
  const roots = [];
  pickQuestions(save, 30).forEach(w => { // 취약 단어가 있는 어근을 먼저 뽑는다
    const r = ROOTS.find(x => x.root === w.root);
    if (r && r.words.length >= HUNT_GOOD && !roots.includes(r) && roots.length < HUNT_ROUNDS) roots.push(r);
  });
  hunt = { roots, round: 0, coins: 0, perfect: 0, selected: [], checked: false, items: [] };
  show("hunt");
  renderHunt();
}

function renderHunt() {
  const r = hunt.roots[hunt.round];
  hunt.selected = [];
  hunt.checked = false;
  const good = shuffled(r.words).slice(0, HUNT_GOOD).map(x => ({ w: x.w, ko: x.ko, good: true }));
  const rootLow = r.root.toLowerCase();
  const pool = shuffled(ROOTS.filter(x => x.root !== r.root && x.meaning !== r.meaning));
  const bad = [];
  for (const x of pool) { // 서로 다른 어근에서 하나씩, 어근 철자가 들어간 단어는 제외
    const c = shuffled(x.words).find(y => !y.w.toLowerCase().includes(rootLow));
    if (c) bad.push({ w: c.w, ko: c.ko, good: false });
    if (bad.length === HUNT_BAD) break;
  }
  hunt.items = shuffled(good.concat(bad));

  document.getElementById("huntRound").textContent = hunt.round + 1;
  document.getElementById("huntTotal").textContent = hunt.roots.length;
  document.getElementById("huntRoot").innerHTML = `<span class="chip">${r.root}</span> = ${r.meaning}`;
  document.getElementById("huntFeedback").textContent = "";
  const box = document.getElementById("huntBoard");
  box.innerHTML = "";
  hunt.items.forEach((it, i) => {
    const b = document.createElement("button");
    b.className = "hcard";
    b.textContent = it.w;
    b.onclick = () => toggleHunt(i);
    it.el = b;
    box.appendChild(b);
  });
  const ok = document.getElementById("huntCheck");
  ok.textContent = `확인 (0 / ${HUNT_GOOD})`;
  ok.disabled = true;
  ok.classList.remove("hidden");
  document.getElementById("huntNext").classList.add("hidden");
}

function toggleHunt(i) {
  if (!hunt || hunt.checked) return;
  const it = hunt.items[i], pos = hunt.selected.indexOf(i);
  if (pos >= 0) { hunt.selected.splice(pos, 1); it.el.classList.remove("pick"); }
  else {
    if (hunt.selected.length >= HUNT_GOOD) return;
    hunt.selected.push(i);
    it.el.classList.add("pick");
    if (!save.mute) speak(it.w);
  }
  const ok = document.getElementById("huntCheck");
  ok.textContent = `확인 (${hunt.selected.length} / ${HUNT_GOOD})`;
  ok.disabled = hunt.selected.length !== HUNT_GOOD;
}

function checkHunt() {
  if (!hunt || hunt.checked || hunt.selected.length !== HUNT_GOOD) return;
  hunt.checked = true;
  let right = 0;
  hunt.items.forEach((it, i) => {
    const picked = hunt.selected.includes(i);
    it.el.classList.remove("pick");
    it.el.innerHTML = `${it.w}<br><small>${it.ko}</small>`;
    if (picked && it.good) { right += 1; it.el.classList.add("right"); }
    else if (picked) it.el.classList.add("wrong");
    else if (it.good) it.el.classList.add("missed");
  });
  const perfect = right === HUNT_GOOD;
  const coins = right + (perfect ? HUNT_PERFECT_BONUS : 0);
  hunt.coins += coins;
  if (perfect) hunt.perfect += 1;
  save.coins += coins;
  writeSave(save);
  renderTopbar();
  document.getElementById("huntFeedback").innerHTML =
    (perfect ? "🎯 완벽해요!" : `👍 ${right} / ${HUNT_GOOD}개 맞혔어요.`) + ` 🪙 +${coins}` +
    (perfect ? "" : "<br><small>초록=정답, 빨강=어근이 다른 단어, 노랑 테두리=놓친 정답</small>");
  document.getElementById("huntCheck").classList.add("hidden");
  const next = document.getElementById("huntNext");
  next.textContent = hunt.round + 1 >= hunt.roots.length ? "결과 보기 ▶" : "다음 ▶";
  next.classList.remove("hidden");
}

function nextHunt() {
  if (!hunt || !hunt.checked) return;
  hunt.round += 1;
  if (hunt.round >= hunt.roots.length) return finishHunt();
  renderHunt();
}

function finishHunt() {
  const total = hunt.roots.length;
  const record = hunt.perfect > (save.bestHunt || 0);
  if (record) { save.bestHunt = hunt.perfect; writeSave(save); }
  let html = `완벽한 라운드 ${hunt.perfect} / ${total} · 🪙 +${hunt.coins}`;
  if (record) html += `<br><span class="level-up">🏆 최고 기록 경신!</span>`;
  html += `<hr>오늘 사냥한 어근<br>` + hunt.roots.map(r => `<div class="wordRow"><span class="chip">${r.root}</span>${r.meaning}: ${r.words.map(w => w.w).join(", ")}</div>`).join("");
  showMiniResult(hunt.perfect === total ? "🎯 사냥 대성공!" : "🏹 사냥 끝!", html, startHunt);
  hunt = null;
}

function quitHunt() {
  hunt = null;
  show("home");
}
