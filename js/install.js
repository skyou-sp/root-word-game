// 홈 화면에 설치(PWA): 오프라인 저장 등록과 설치 안내 카드
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const canServe = location.protocol === "https:" || location.hostname === "localhost";
let installPrompt = null;

if ("serviceWorker" in navigator && canServe) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* 등록 실패해도 앱은 그대로 동작 */ });
}

function renderInstallCard() {
  const card = document.getElementById("installCard");
  if (!card || isStandalone || !canServe) return;
  let html = "📲 <b>홈 화면에 설치하면 앱처럼 쓸 수 있어요!</b><br>";
  if (inKakao) {
    html += "카카오톡 안에서는 설치가 안 돼요. 위 안내의 <b>크롬/사파리로 열기</b>를 먼저 눌러 주세요.";
  } else if (installPrompt) {
    html += `<button id="installBtn">📲 앱 설치</button>`;
  } else {
    html += "크롬: 오른쪽 위 <b>⋮</b> → <b>홈 화면에 추가</b> (또는 <b>앱 설치</b>)<br>" +
            "삼성 인터넷: 아래 <b>≡</b> → <b>현재 페이지 추가</b> → <b>홈 화면</b>";
  }
  card.innerHTML = html;
  card.classList.remove("hidden");
  const btn = document.getElementById("installBtn");
  if (btn) btn.onclick = async () => {
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    card.classList.add("hidden");
  };
}

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); // 브라우저 기본 설치 배너 대신 우리 버튼을 사용
  installPrompt = e;
  renderInstallCard();
});
renderInstallCard();
window.addEventListener("appinstalled", () => document.getElementById("installCard").classList.add("hidden"));
