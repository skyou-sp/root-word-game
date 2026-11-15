// 미니게임: 짝 맞추기. 영어 단어 카드와 뜻 카드를 뒤집어 짝을 찾는다.
// 취약 단어가 먼저 뽑히도록 pickQuestions를 그대로 쓴다. 기록(오답 수)은 건드리지 않는 가벼운 게임이다.
const MATCH_PAIRS = 6, MATCH_COIN_PER_PAIR = 1, MATCH_BONUS = 5;

let match = null;

function startMatch() {
  touchStreak(save);
  const words = pickQuestions(save, MATCH_PAIRS * 3);
  const used = new Set(), pick = [];
  for (const w of words) { // 뜻이 같은 단어가 섞이지 않게 한다
    if (used.has(w.ko)) continue;
    used.add(w.ko);
    pick.push(w);
    if (pick.length === MATCH_PAIRS) break;
  }
  const cards = [];
  pick.forEach(w => {
    cards.push({ id: w.w, text: w.w, kind: "en", word: w });
    cards.push({ id: w.w, text: w.ko, kind: "ko", word: w });
  });
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  match = { cards, open: [], found: 0, moves: 0, locked: false, token: Date.now() };
  show("match");
  renderMatch();
}

function renderMatch() {
  document.getElementById("matchMoves").textContent = match.moves;
  document.getElementById("matchFound").textContent = match.found;
  document.getElementById("matchTotal").textContent = MATCH_PAIRS;
  const box = document.getElementById("matchBoard");
  box.innerHTML = "";
  match.cards.forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "mcard " + c.kind;
    b.textContent = c.text;
    b.onclick = () => flipCard(i, b);
    c.el = b;
    box.appendChild(b);
  });
}

function flipCard(i, btn) {
  if (!match || match.locked) return;
  const c = match.cards[i];
  if (c.done || match.open.includes(i)) return;
  btn.classList.add("open");
  if (c.kind === "en" && !save.mute) speak(c.text);
  match.open.push(i);
  if (match.open.length < 2) return;

  match.moves += 1;
  document.getElementById("matchMoves").textContent = match.moves;
  const [a, b] = match.open.map(k => match.cards[k]);
  if (a.id === b.id && a.kind !== b.kind) {
    [a, b].forEach(x => { x.done = true; x.el.classList.add("done"); });
    match.open = [];
    match.found += 1;
    save.coins += MATCH_COIN_PER_PAIR;
    writeSave(save);
    renderTopbar();
    document.getElementById("matchFound").textContent = match.found;
    if (match.found === MATCH_PAIRS) setTimeout(finishMatch, 500);
  } else {
    match.locked = true;
    const token = match.token;
    setTimeout(() => {
      if (!match || match.token !== token) return; // 그 사이 나갔거나 새 판이면 무시
      [a, b].forEach(x => x.el.classList.remove("open"));
      match.open = [];
      match.locked = false;
    }, 800);
  }
}

function finishMatch() {
  if (!match) return;
  const perfect = match.moves <= MATCH_PAIRS + 2; // 실수 2번 이하
  const bonus = perfect ? MATCH_BONUS : 0;
  const record = !save.bestMatch || match.moves < save.bestMatch;
  if (record) save.bestMatch = match.moves;
  save.coins += bonus;
  writeSave(save);
  renderTopbar();
  const words = match.cards.filter(c => c.kind === "en").map(c => `<div class="wordRow"><b>${c.word.w}</b> = ${c.word.ko} <small>(${c.word.root})</small></div>`).join("");
  document.getElementById("matchResultBody").innerHTML =
    `🃏 ${match.moves}번 만에 모두 맞혔어요!<br>🪙 +${MATCH_PAIRS * MATCH_COIN_PER_PAIR}` +
    (bonus ? ` · 실수가 적어서 보너스 +${bonus}🪙` : "") +
    (record ? `<br><span class="level-up">🏆 최소 횟수 기록 경신! (${save.bestMatch}번)</span>` : `<br>최소 기록: ${save.bestMatch}번`) +
    `<hr>${words}`;
  match = null;
  show("matchResult");
}

function quitMatch() {
  if (match && match.found > 0 && !confirm("게임을 그만하고 홈으로 갈까요?")) return;
  match = null;
  show("home");
}
