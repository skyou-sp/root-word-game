// 화면 전환과 홈/학습/성장 기록 화면
let save = loadSave();

function esc(t) { return t.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }

function renderMute() { document.getElementById("muteBtn").textContent = save.mute ? "🔇" : "🔊"; }

function show(id) {
  stopSpeech();
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  window.scrollTo(0, 0);
  if (id === "home") renderHome();
  if (id === "learn") renderRootList();
  if (id === "stats") renderStats();
  renderTopbar();
}

function renderTopbar() {
  const li = levelInfo(save.xp);
  document.getElementById("level").textContent = li.level;
  document.getElementById("avatar").textContent = avatarFor(li.level);
  document.getElementById("xpbar").style.width = (li.into / li.need * 100) + "%";
  document.getElementById("coinCount").textContent = save.coins;
}

function learnedCount() { return Object.values(save.words).filter(r => r.right > 0).length; }

function renderHome() {
  const done = save.todayDate === todayStr() ? save.todayCount : 0;
  const goal = Math.min(done, DAILY_GOAL);
  document.getElementById("dailyCard").innerHTML =
    `🔥 연속 학습 <b>${save.streak}</b>일<br>🎯 오늘의 목표: ${goal} / ${DAILY_GOAL} 문제` +
    (done >= DAILY_GOAL ? " ✅" : "") + `<br>📚 익힌 단어: ${learnedCount()} / ${allWords().length}`;
}

function renderRootList() {
  const box = document.getElementById("rootList");
  box.innerHTML = "";
  ROOTS.forEach((r, i) => {
    const b = document.createElement("button");
    b.className = "rootItem";
    b.innerHTML = `<span><b>${r.root}</b> · ${r.meaning}</span><span>${r.words.length}단어 ›</span>`;
    b.onclick = () => openRoot(i);
    box.appendChild(b);
  });
}

function openRoot(i) {
  const r = ROOTS[i];
  const rows = r.words.map(w =>
    `<div class="wordRow"><div class="w">${w.w} <button class="spk" data-speak="${esc(w.w)}">🔊</button> <small>${w.ko}</small></div>` +
    `<div class="ex">${w.ex} <button class="spk" data-speak="${esc(w.ex)}">🔊</button></div>` +
    `<div class="kr">${TRANS[w.w] || ""}</div></div>`).join("");
  document.getElementById("rootDetail").innerHTML =
    `<h2><span class="chip">${r.root}</span> = ${r.meaning}</h2><div class="card">${rows}</div>`;
  show("rootCard");
}

function renderStats() {
  const li = levelInfo(save.xp);
  document.getElementById("statsBody").innerHTML =
    `${avatarFor(li.level)} 레벨 <b>${li.level}</b> (다음 레벨까지 ${li.need - li.into} XP)<br>` +
    `🔥 연속 학습 ${save.streak}일<br>📚 익힌 단어 ${learnedCount()} / ${allWords().length}<br>` +
    `⚔️ 전투 ${save.battles}회 · 🏆 최고 점수 ${save.bestScore}점`;
  const weak = Object.entries(save.words).filter(([, r]) => r.wrong > 0 && !r.overcome);
  const overcame = Object.values(save.words).filter(r => r.overcome).length;
  const lookup = {};
  allWords().forEach(w => lookup[w.w] = w);
  document.getElementById("weakList").innerHTML = (weak.length
    ? weak.sort((a, b) => b[1].wrong - a[1].wrong).map(([w, r]) => `<div class="wordRow"><b>${w}</b> ${lookup[w] ? lookup[w].ko : ""} <small>(오답 ${r.wrong}회)</small></div>`).join("")
    : "취약 단어가 없어요 👍") + `<hr>🏅 극복한 단어: ${overcame}개`;
}

document.addEventListener("click", e => {
  const sp = e.target.closest("[data-speak]");
  if (sp) { speak(sp.dataset.speak); return; }
  const go = e.target.closest("[data-go]");
  if (!go) return;
  if (go.dataset.go === "battle") startBattle(); else show(go.dataset.go);
});
document.getElementById("nextBtn").onclick = nextQuestion;
document.getElementById("quitBtn").onclick = quitBattle;
document.getElementById("speakBtn").onclick = () => { if (battle) speak(battle.queue[battle.index].w); };
document.getElementById("muteBtn").onclick = () => { save.mute = !save.mute; writeSave(save); renderMute(); if (save.mute) stopSpeech(); };
renderMute();
showSpeechNotice();
document.getElementById("resetBtn").onclick = () => {
  if (confirm("모든 기록이 사라져요. 정말 초기화할까요?")) { save = defaultSave(); writeSave(save); show("home"); }
};

show("home");
