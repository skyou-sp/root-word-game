# 어근 디펜스 (root-word-game)

영어 어근으로 중고등 수준 단어를 외우는 웹 게임. 어근 101개 / 단어 635개.
주소: https://skyou-sp.github.io/root-word-game/ (GitHub Pages)

## 기술 스택
- HTML + CSS + 순수 JavaScript (빌드 도구·서버·라이브러리 없음)
- 기록 저장: 브라우저 localStorage (서버·가입 없음)
- 음성: 브라우저 내장 Web Speech API
- 설치형 앱(PWA): manifest.webmanifest + sw.js (오프라인 저장)

## 폴더 구조
- `index.html` 화면 뼈대 / `style.css` 디자인
- `data/words.js`, `data/words2.js` 어근과 단어 (`ROOTS` 배열)
- `data/trans.js` 예문 한글 번역 (`TRANS`, 단어를 키로 사용)
- `js/storage.js` 저장·레벨·연속 학습 / `js/srs.js` 문제 출제(틀린 단어 우선)
- `js/game.js` 전투 / `js/app.js` 화면 전환·학습·기록
- `js/speech.js` 음성 / `js/install.js` 설치 안내
- `sw.js`, `manifest.webmanifest`, `icons/` 설치(PWA)용
- `docs/BUILD-LOG.md` 만든 과정과 체크리스트

## 지킨 규칙
- 단어 한 개 = `{ w, ko, ex }`. 어근당 5~10단어, 같은 단어를 두 번 넣지 않기
- 예문은 대문자로 시작해 마침표로 끝내고, 그 단어를 문장 안에 쓰기
- 새 단어를 넣으면 `data/trans.js`에도 번역 추가 (개수가 항상 같아야 함)
- 어근에서 실제로 나온 단어만 넣기 (예: captain은 cap(잡다)이 아니라 머리에서 유래해 뺌)
- 틀린 단어는 즉시 정답·어근·예문을 보여 주고 한 번 더 출제
- 연속 학습은 하루 놓쳐도 0으로 초기화하지 않음
- 화면은 휴대폰 기준(모바일 우선), 색은 `style.css` 맨 위 변수로 관리
- 코드를 고치면 `node --check 파일.js`로 문법 확인

## 하지 말아야 할 것
- API 키, 비밀번호, 개인 이메일을 파일이나 커밋에 넣지 않기
- 커밋 이메일은 회사 메일 대신 GitHub noreply 주소 사용 (저장소가 공개라서)
- 허락 없이 push 하지 않기 (밖에 공개되는 작업)
- 어근 학습 단어를 검수 없이 대량 추가하지 않기 (뜻·문법·어원 오류 주의)
- 카톡 안의 브라우저에서는 음성이 안 나오므로 "크롬으로 열기"를 안내하기

## 배포 방법 (GitHub Pages)
1. 수정 후 문법 확인: `node --check js/app.js` (바꾼 파일마다)
2. `git add -A`
3. `git commit -m "무엇을 바꿨는지"`
4. `git push origin main`
5. 1~2분 뒤 위 주소에서 확인 (처음 한 번만 Settings → Pages → Branch `main` / root 설정)
6. 새 파일을 만들었다면 `sw.js`의 `FILES` 목록에도 추가
