// 미니게임: 어근 분류 달리기. 위에서 떨어지는 단어가 땅에 닿기 전에 맞는 어근 바구니를 누른다.
// 틀리거나 놓치면 하트가 줄고, 뒤로 갈수록 빨리 떨어진다. 전투 기록(오답 수)은 건드리지 않는다.
const BASKET_SIZE = 10, BASKET_LIVES = 3, BASKET_COIN = 1, BASKET_BONUS = 5;

let basket = null;

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function startBasket() {
  touchStreak(save);
  basket = { queue: pickQuestions(save, BASKET_SIZE), index: 0, lives: BASKET_LIVES, right: 0, missed: [],
             timer: null, locked: true, token: Date.now() };
  show("basket");
  nextBasket();
}

function renderBasketHearts() {
  document.getElementById("basketLives").textContent = "❤️".repeat(basket.lives) + "🖤".repeat(BASKET_LIVES - basket.lives);
}

function nextBasket() {
  if (!basket) return;
  if (basket.lives <= 0 || basket.index >= basket.queue.length) return finishBasket();
  const w = basket.queue[basket.index];
  const correct = ROOTS.find(r => r.root === w.root);
  // 오답 바구니: 뜻이 같은 어근, 단어 철자에 들어 있는 어근(예: transfusion의 trans)은 빼서 정답이 둘이 되지 않게 한다
  const others = shuffled(ROOTS.filter(r => r.root !== correct.root && r.meaning !== correct.meaning && !wordHasRoot(w.w, r.root))).slice(0, 2);
  document.getElementById("basketNum").textContent = basket.index + 1;
  document.getElementById("basketTotal").textContent = basket.queue.length;
  renderBasketHearts();
  const word = document.getElementById("basketWord");
  word.textContent = w.w;
  word.style.top = "0%";
  document.getElementById("basketFeedback").textContent = "";
  const box = document.getElementById("basketChoices");
  box.innerHTML = "";
  shuffled([correct].concat(others)).forEach(r => {
    const b = document.createElement("button");
    b.className = "bbtn";
    b.dataset.root = r.root;
    b.innerHTML = `<b>${r.root}</b><br><small>${r.meaning}</small>`;
    b.onclick = () => resolveBasket(r.root);
    box.appendChild(b);
  });
  if (!save.mute) speak(w.w);

  const duration = Math.max(3500, 7500 - basket.index * 400); // 문제마다 조금씩 빨라진다
  const start = Date.now(), token = basket.token, index = basket.index;
  basket.locked = false;
  basket.timer = setInterval(() => {
    if (!basket || basket.token !== token || basket.index !== index) return;
    const p = (Date.now() - start) / duration;
    word.style.top = Math.min(p, 1) * 68 + "%";
    if (p >= 1) resolveBasket(null);
  }, 40);
}

function resolveBasket(choice) {
  if (!basket || basket.locked) return;
  basket.locked = true;
  clearInterval(basket.timer);
  const w = basket.queue[basket.index];
  const ok = choice === w.root;
  document.querySelectorAll("#basketChoices button").forEach(b => {
    if (b.dataset.root === w.root) b.classList.add("right");
    else if (b.dataset.root === choice) b.classList.add("wrong");
  });
  const fb = document.getElementById("basketFeedback");
  if (ok) {
    basket.right += 1;
    save.coins += BASKET_COIN;
    fb.innerHTML = `✅ 정답!<br>` + miniWordInfo(w);
  } else {
    basket.lives -= 1;
    basket.missed.push(w);
    fb.innerHTML = `${choice === null ? "⏰ 시간 초과!" : "❌ 아쉬워요!"}<br>` + miniWordInfo(w);
  }
  writeSave(save);
  renderTopbar();
  renderBasketHearts();
  const token = basket.token;
  basket.index += 1;
  const last = basket.lives <= 0 || basket.index >= basket.queue.length;
  addMiniNext(fb, last ? "결과 보기 ▶" : "다음 ▶", () => { if (basket && basket.token === token) nextBasket(); });
}

function finishBasket() {
  const won = basket.lives > 0;
  const bonus = won ? BASKET_BONUS : 0;
  const record = basket.right > (save.bestBasket || 0);
  if (record) save.bestBasket = basket.right;
  save.coins += bonus;
  writeSave(save);
  renderTopbar();
  let html = `정답 ${basket.right} / ${basket.queue.length}개 · 🪙 +${basket.right * BASKET_COIN}` +
    (bonus ? ` · 끝까지 버텨서 보너스 +${bonus}🪙` : "");
  if (record) html += `<br><span class="level-up">🏆 최고 기록 경신! (${save.bestBasket}개)</span>`;
  if (basket.missed.length)
    html += `<hr>놓친 단어<br>` + basket.missed.map(m => `<div class="wordRow"><b>${m.w}</b> = ${m.ko} <span class="chip">${m.root}</span>${m.rootMeaning}</div>`).join("");
  showMiniResult(won ? "🎉 끝까지 해냈어요!" : "💥 하트가 다 떨어졌어요", html, startBasket);
  basket = null;
}

function quitBasket() {
  if (basket) { clearInterval(basket.timer); basket = null; }
  show("home");
}
