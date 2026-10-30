// 저장/불러오기: 브라우저 localStorage에 기록을 보관한다.
const SAVE_KEY = "rootDefense.v1";
const AVATARS = ["🥚", "🐣", "🐥", "🦊", "🐺", "🦁", "🐉", "🦄", "🧙", "👑"]; // 레벨 구간별 캐릭터

function defaultSave() {
  return { xp: 0, coins: 0, streak: 0, lastDay: "", bestScore: 0, battles: 0,
           todayDate: "", todayCount: 0, todayRewarded: false, mute: false, words: {} };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? Object.assign(defaultSave(), JSON.parse(raw)) : defaultSave();
  } catch (e) { return defaultSave(); }
}

function writeSave(s) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* 저장 실패는 무시 */ }
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// 레벨 n → n+1 에 필요한 경험치는 50 * n
function levelInfo(xp) {
  let level = 1, need = 50;
  while (xp >= need) { xp -= need; level++; need = 50 * level; }
  return { level, into: xp, need };
}

function avatarFor(level) { return AVATARS[Math.min(AVATARS.length - 1, Math.floor((level - 1) / 2))]; }

// 하루 첫 학습 시 연속 학습일 갱신. 하루 놓쳐도 0으로 초기화하지 않고 절반만 줄인다.
function touchStreak(s) {
  const today = todayStr();
  if (s.lastDay === today) return;
  if (s.todayDate !== today) { s.todayDate = today; s.todayCount = 0; s.todayRewarded = false; }
  if (!s.lastDay) s.streak = 1;
  else {
    const gap = Math.round((new Date(today) - new Date(s.lastDay)) / 86400000);
    if (gap === 1) s.streak += 1;
    else if (gap === 2) s.streak = Math.max(1, s.streak); // 하루 쉬어도 유지
    else s.streak = Math.max(1, Math.floor(s.streak / 2));
  }
  s.lastDay = today;
}
