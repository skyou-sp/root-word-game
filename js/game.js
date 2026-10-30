// 디펜스 전투: 단어(적)가 다가오면 뜻을 맞혀 물리친다. 틀리면 성 체력이 줄고, 그 단어는 곧바로 다시 나온다.
const BATTLE_SIZE = 10, MAX_HP = 5;
const XP_RIGHT = 10, COINS_RIGHT = 2, OVERCOME_BONUS = 5, DAILY_GOAL = 10, DAILY_REWARD = 20;
const ENEMIES = ["👾", "👹", "🐛", "🦂", "🦇", "👻"];

let battle = null;

function startBattle() {
  touchStreak(save);
  battle = { queue: pickQuestions(save, BATTLE_SIZE), index: 0, hp: MAX_HP, right: 0, wrong: 0,
             overcome: [], requeued: {}, xpBefore: save.xp, locked: false };
  show("battle");
  renderQuestion();
}

function renderHearts() {
  document.getElementById("hearts").textContent = "❤️".repeat(battle.hp) + "🖤".repeat(MAX_HP - battle.hp);
}

function renderQuestion() {
  const q = battle.queue[battle.index];
  battle.locked = false;
  document.getElementById("qNum").textContent = battle.index + 1;
  document.getElementById("qTotal").textContent = battle.queue.length;
  document.getElementById("enemy").textContent = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
  document.getElementById("field").className = "";
  document.getElementById("question").textContent = q.w;
  const rec = save.words[q.w];
  document.getElementById("hint").textContent = rec && rec.wrong > 0 && !rec.overcome ? "💪 취약 단어!" : "";
  document.getElementById("feedback").classList.add("hidden");
  document.getElementById("nextBtn").classList.add("hidden");
  renderHearts();
  if (!save.mute) speak(q.w);
  const box = document.getElementById("choices");
  box.innerHTML = "";
  makeChoices(q).forEach(c => {
    const b = document.createElement("button");
    b.textContent = c;
    b.onclick = () => answer(b, c);
    box.appendChild(b);
  });
}

function answer(btn, choice) {
  if (battle.locked) return;
  battle.locked = true;
  const q = battle.queue[battle.index];
  const ok = choice === q.ko;
  const rec = save.words[q.w] || (save.words[q.w] = { right: 0, wrong: 0, last: 0, overcome: false });
  rec.last = Date.now();
  const fb = document.getElementById("feedback");
  const info = `<b>${q.w}</b> = ${q.ko}<br>어근 <span class="chip">${q.root}</span> (${q.rootMeaning})<br><small>${q.ex}<br>${TRANS[q.w] || ""}</small>`;

  touchStreak(save);
  save.todayCount += 1;

  if (ok) {
    rec.right += 1;
    battle.right += 1;
    save.xp += XP_RIGHT;
    save.coins += COINS_RIGHT;
    btn.classList.add("right");
    document.getElementById("field").classList.add("attack");
    let extra = "";
    if (rec.wrong > 0 && !rec.overcome) {
      rec.overcome = true;
      save.coins += OVERCOME_BONUS;
      battle.overcome.push(q.w);
      extra = `<br>🏅 취약 단어 극복! (+${OVERCOME_BONUS}🪙)`;
    }
    fb.innerHTML = "✅ 정답! +" + XP_RIGHT + " XP<br>" + info + extra;
  } else {
    rec.wrong += 1;
    rec.overcome = false;
    battle.wrong += 1;
    battle.hp -= 1;
    btn.classList.add("wrong");
    [...document.querySelectorAll("#choices button")].forEach(b => { if (b.textContent === q.ko) b.classList.add("right"); });
    document.getElementById("field").classList.add("hit");
    fb.innerHTML = "❌ 아쉬워요! 정답을 기억해요.<br>" + info;
    if (!battle.requeued[q.w]) { battle.requeued[q.w] = true; battle.queue.push(q); } // 틀린 단어는 이번 판 끝에 한 번 더
  }
  if (save.todayCount >= DAILY_GOAL && !save.todayRewarded) {
    save.todayRewarded = true;
    save.coins += DAILY_REWARD;
    fb.innerHTML += `<br>🎯 오늘의 목표 달성! +${DAILY_REWARD}🪙`;
  }
  writeSave(save);
  renderTopbar();
  renderHearts();
  fb.classList.remove("hidden");
  const next = document.getElementById("nextBtn");
  next.textContent = battle.hp <= 0 || battle.index + 1 >= battle.queue.length ? "결과 보기 ▶" : "다음 ▶";
  next.classList.remove("hidden");
}

// 전투 중간에 그만두고 홈으로. 지금까지 푼 문제의 기록은 이미 저장되어 있다.
function quitBattle() {
  if (!confirm("전투를 그만하고 홈으로 갈까요?\n지금까지 푼 문제의 기록은 저장돼요.")) return;
  battle = null;
  show("home");
}

function nextQuestion() {
  if (battle.hp <= 0 || battle.index + 1 >= battle.queue.length) return finishBattle();
  battle.index += 1;
  renderQuestion();
}

function finishBattle() {
  const won = battle.hp > 0;
  const score = battle.right * 10;
  const record = score > save.bestScore;
  if (record) save.bestScore = score;
  save.battles += 1;
  writeSave(save);
  const before = levelInfo(battle.xpBefore).level, after = levelInfo(save.xp).level;
  document.getElementById("resultTitle").textContent = won ? "🎉 성을 지켰어요!" : "💥 성이 무너졌어요";
  let html = `정답 ${battle.right}개 / 오답 ${battle.wrong}개<br>획득 XP: ${battle.right * XP_RIGHT}<br>점수: ${score}점`;
  if (record) html += ` <span class="level-up">🏆 최고 기록 경신!</span>`;
  if (after > before) html += `<br><span class="level-up">⬆️ 레벨 업! Lv.${after} ${avatarFor(after)}</span>`;
  if (battle.overcome.length) html += `<br>🏅 극복한 단어: ${battle.overcome.join(", ")}`;
  if (!won) html += `<br>틀린 단어는 다음 전투에 더 자주 나와요. 다시 도전!`;
  document.getElementById("resultBody").innerHTML = html;
  show("result");
}
