// 음성: 브라우저 내장 음성 합성(Web Speech API)으로 영어 단어/문장을 읽어 준다. 별도 설치나 서버가 필요 없다.
const speechOK = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
const inKakao = /KAKAOTALK/i.test(navigator.userAgent);
let voices = [];

function loadVoices() { voices = speechSynthesis.getVoices(); }
if (speechOK) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices; // 음성 목록은 늦게 로드되는 브라우저가 많다
}

// 안드로이드는 "en_US", 다른 기기는 "en-US"로 표기하므로 맞춰서 찾는다.
function pickVoice() {
  const lang = v => v.lang.replace("_", "-").toLowerCase();
  return voices.find(v => lang(v) === "en-us") || voices.find(v => lang(v).startsWith("en"));
}

function speak(text) {
  if (!speechOK || !text) return;
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9;
  const voice = pickVoice();
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

function stopSpeech() { if (speechOK) speechSynthesis.cancel(); }

// 카카오톡 안의 브라우저는 음성이 막혀 있는 경우가 많아서 안내를 띄우고 외부 브라우저로 열 수 있게 한다.
function showSpeechNotice() {
  const box = document.getElementById("speechNotice");
  if (!box || !(inKakao || !speechOK)) return;
  const url = encodeURIComponent(location.href);
  box.innerHTML = inKakao
    ? `🔇 카카오톡 안에서는 음성이 나오지 않을 수 있어요.<br><a href="kakaotalk://web/openExternal?url=${url}">크롬/사파리로 열기</a>`
    : "🔇 이 브라우저는 음성을 지원하지 않아요. 크롬이나 사파리로 열어 주세요.";
  box.classList.remove("hidden");
}
