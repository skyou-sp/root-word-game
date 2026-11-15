// 미니게임: ○× 퀴즈. 단어와 뜻이 맞으면 ○, 틀리면 ×. 연속으로 맞히면 점수 배율이 올라간다.
// 틀린 뜻은 같은 어근의 다른 단어 뜻을 섞어서 헷갈리게 만든다. 전투 기록(오답 수)은 건드리지 않는다.
const OX_SIZE = 15, OX_POINT = 10, OX_COIN = 1, OX_BONUS = 5, OX_BONUS_MIN = 13;

let ox = null;

function oxMultiplier(combo) { return Math.min(4, 1 + Math.floor(combo / 3)); } // 3연속마다 +1배, 최대 4배

function startOx() { // koOverlap(뜻 겹침 검사)은 srs.js에 있다
  touchStreak(save);
  const all = allWords();
  const queue = pickQuestions(save, OX_SIZE).map(w => {
    const isTrue = Math.random() < 0.5;
    let shown = w.ko, pickedOwner = null;
    if (!isTrue) {
      const valid = all.filter(x => x.w !== w.w && !koOverlap(x.ko, w.ko)); // 정답과 뜻이 겹치는 후보는 제외
      const same = valid.filter(x => x.root === w.root);
      const pool = same.length && Math.random() < 0.6 ? same : valid;
      pickedOwner = pool[Math.floor(Math.random() * pool.length)];
      shown = pickedOwner.ko;
    }
    const owner = isTrue ? null : pickedOwner;
    return { word: w, shown, isTrue, owner };
  });
  ox = { queue, index: 0, right: 0, combo: 0, bestCombo: 0, score: 0, missed: [], locked: false, token: Date.now() };
  show("ox");
  renderOx();
}

function renderOx() {
  const q = ox.queue[ox.index];
  ox.locked = false;
  document.getElementById("oxNum").textContent = ox.index + 1;
  document.getElementById("oxTotal").textContent = ox.queue.length;
  document.getElementById("oxScore").textContent = ox.score;
  document.getElementById("oxCombo").textContent = ox.combo >= 3 ? `🔥 ${ox.combo}연속 · x${oxMultiplier(ox.combo)}` : "";
  document.getElementById("oxWord").textContent = q.word.w;
  document.getElementById("oxMeaning").textContent = q.shown;
  document.getElementById("oxFeedback").innerHTML = "";
  document.getElementById("oxCard").className = "";
  document.querySelectorAll("#oxButtons button").forEach(b => b.className = "oxbtn");
  if (!save.mute) speak(q.word.w);
}

function answerOx(sayTrue) {
  if (!ox || ox.locked) return;
  ox.locked = true;
  const q = ox.queue[ox.index];
  const ok = sayTrue === q.isTrue;
  const fb = document.getElementById("oxFeedback");
  if (ok) {
    const mult = oxMultiplier(ox.combo);
    ox.combo += 1;
    ox.bestCombo = Math.max(ox.bestCombo, ox.combo);
    ox.right += 1;
    ox.score += OX_POINT * mult;
    save.coins += OX_COIN;
    fb.innerHTML = `✅ 정답! +${OX_POINT * mult}점` + (mult > 1 ? ` (x${mult})` : "") +
      (q.isTrue ? ` (맞는 뜻 ⭕)` : ` ("${q.shown}"은 <b>${q.owner.w}</b>의 뜻 ❌)`) + `<br>` + miniWordInfo(q.word);
    document.getElementById("oxCard").className = "ok";
  } else {
    ox.combo = 0;
    ox.missed.push(q.word);
    fb.innerHTML = `❌ 아쉬워요!` + (q.isTrue ? ` (맞는 뜻이었어요 ⭕)` : ` ("${q.shown}"은 <b>${q.owner.w}</b>의 뜻이에요 ❌)`) +
      `<br>` + miniWordInfo(q.word);
    document.getElementById("oxCard").className = "no";
  }
  document.querySelectorAll("#oxButtons button").forEach(b => {
    if ((b.dataset.ox === "o") === q.isTrue) b.classList.add("right");
    else if ((b.dataset.ox === "o") === sayTrue) b.classList.add("wrong");
  });
  document.getElementById("oxScore").textContent = ox.score;
  writeSave(save);
  renderTopbar();
  const token = ox.token;
  ox.index += 1;
  const last = ox.index >= ox.queue.length;
  addMiniNext(fb, last ? "결과 보기 ▶" : "다음 ▶", () => {
    if (!ox || ox.token !== token) return;
    if (last) finishOx(); else renderOx();
  });
}

function finishOx() {
  const bonus = ox.right >= OX_BONUS_MIN ? OX_BONUS : 0;
  const record = ox.score > (save.bestOx || 0);
  if (record) save.bestOx = ox.score;
  save.coins += bonus;
  writeSave(save);
  renderTopbar();
  let html = `정답 ${ox.right} / ${ox.queue.length}개 · 점수 ${ox.score}점<br>🔥 최고 연속 ${ox.bestCombo}개 · 🪙 +${ox.right * OX_COIN}` +
    (bonus ? ` · 높은 정답률 보너스 +${bonus}🪙` : "");
  if (record) html += `<br><span class="level-up">🏆 최고 점수 경신!</span>`;
  if (ox.missed.length)
    html += `<hr>틀린 단어<br>` + ox.missed.map(m => `<div class="wordRow"><b>${m.w}</b> = ${m.ko} <span class="chip">${m.root}</span>${m.rootMeaning}</div>`).join("");
  showMiniResult(ox.right >= OX_BONUS_MIN ? "🎉 대단해요!" : "⭕ 퀴즈 끝!", html, startOx);
  ox = null;
}

function quitOx() {
  ox = null;
  show("home");
}
