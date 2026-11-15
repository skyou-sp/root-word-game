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

// 지금 데이터에 있는 단어만 센다 (검수로 빠진 단어의 옛 기록은 제외)
function learnedCount() {
  const now = new Set(allWords().map(w => w.w));
  return Object.entries(save.words).filter(([w, r]) => now.has(w) && r.right > 0).length;
}

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
    `⚔️ 전투 ${save.battles}회 · 🏆 최고 점수 ${save.bestScore}점` +
    (save.bestMatch ? `<br>🃏 짝 맞추기 최소 ${save.bestMatch}번` : "") +
    (save.bestOx ? `<br>⭕ ○× 퀴즈 최고 ${save.bestOx}점` : "") +
    (save.bestBasket ? `<br>🧺 어근 분류 달리기 최고 ${save.bestBasket}개` : "") +
    (save.bestHunt ? `<br>🎯 어근 단어 사냥 완벽 ${save.bestHunt}라운드` : "");
  const lookup = {};
  allWords().forEach(w => lookup[w.w] = w);
  // 검수로 빠진 단어의 옛 기록은 목록과 개수에서 뺀다
  const weak = Object.entries(save.words).filter(([w, r]) => lookup[w] && r.wrong > 0 && !r.overcome);
  const overcame = Object.entries(save.words).filter(([w, r]) => lookup[w] && r.overcome).length;
  document.getElementById("weakList").innerHTML = (weak.length
    ? weak.sort((a, b) => b[1].wrong - a[1].wrong).map(([w, r]) => `<div class="wordRow"><b>${w}</b> ${lookup[w] ? lookup[w].ko : ""} <small>(오답 ${r.wrong}회)</small></div>`).join("")
    : "취약 단어가 없어요 👍") + `<hr>🏅 극복한 단어: ${overcame}개`;
}

document.addEventListener("click", e => {
  const sp = e.target.closest("[data-speak]");
  if (sp) { speak(sp.dataset.speak); return; }
  const go = e.target.closest("[data-go]");
  if (!go) return;
  if (go.dataset.go === "battle") startBattle();
  else if (go.dataset.go === "match") startMatch();
  else if (go.dataset.go === "ox") startOx();
  else if (go.dataset.go === "basket") startBasket();
  else if (go.dataset.go === "hunt") startHunt();
  else show(go.dataset.go);
});
document.getElementById("matchQuitBtn").onclick = quitMatch;
document.getElementById("basketQuitBtn").onclick = quitBasket;
document.getElementById("oxQuitBtn").onclick = quitOx;
document.querySelectorAll("#oxButtons button").forEach(b => b.onclick = () => answerOx(b.dataset.ox === "o"));
document.getElementById("huntQuitBtn").onclick = quitHunt;
document.getElementById("huntCheck").onclick = checkHunt;
document.getElementById("huntNext").onclick = nextHunt;

// 미니게임 공통 결과 화면. again은 "다시 하기"를 눌렀을 때 실행할 함수.
// 미니게임 정답·오답 직후에 보여 주는 단어 설명 (뜻, 어근, 예문, 번역)
function miniWordInfo(w) {
  return `<b>${w.w}</b> = ${w.ko}<br>어근 <span class="chip">${w.root}</span> (${w.rootMeaning})` +
    `<br><small>${w.ex}<br>${TRANS[w.w] || ""}</small>`;
}

// 피드백 아래에 "다음 ▶" 버튼을 붙인다. 누를 때까지 자동으로 넘어가지 않는다.
function addMiniNext(fb, label, onClick) {
  const b = document.createElement("button");
  b.className = "big";
  b.textContent = label;
  b.onclick = () => { b.disabled = true; onClick(); };
  fb.appendChild(b);
}

function showMiniResult(title, html, again) {
  document.getElementById("miniResultTitle").textContent = title;
  document.getElementById("miniResultBody").innerHTML = html;
  document.getElementById("miniAgain").onclick = again;
  show("miniResult");
}
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
