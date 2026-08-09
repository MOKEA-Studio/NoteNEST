# 04. 페이지·블록·미디어·협업

## 1. 페이지 모델

Notion의 모든 콘텐츠는 페이지 트리에서 시작한다.

```text
Page
├── identity: id, title
├── presentation: icon, cover, font, width
├── hierarchy: parent page / teamspace / database
├── access: direct + inherited permissions
├── metadata: created/edited by/time
├── body: ordered block tree
└── optional database properties
```

페이지는 다음 역할을 모두 수행할 수 있다.

- 일반 문서
- 다른 페이지를 담는 폴더형 컨테이너
- 데이터베이스 자체
- 데이터베이스의 행/카드
- 위키 홈
- 프로젝트·태스크·회의 노트
- 대시보드
- 공개 웹사이트
- Agent의 instruction/skill 문서

Notion에는 별도 “폴더” 객체가 없다. 사이드바에서 하위 페이지를 가진 페이지가 폴더처럼 접히고 펼쳐진다. 폴더형 UX를 구현할 때도 클릭은 기본 페이지 열기, chevron은 하위 트리 펼치기로 분리하는 것이 Notion의 정신 모델에 가깝다.

## 2. 페이지 생성

### 2.1 진입점

- 사이드바 하단 `New page`
- Teamspace/Private 섹션의 `+`
- 현재 페이지 안의 `/page`
- 데이터베이스의 `New`
- 템플릿 선택
- `Cmd/Ctrl+N` 또는 새 탭 흐름
- Calendar에서 일정/DB 항목 생성
- Form 제출
- Button/Automation/Agent/API
- Import

### 2.2 생성 문맥

어디서 만들었는지가 초기 부모와 속성을 결정한다.

- Teamspace의 `+`: 해당 Teamspace 아래
- 페이지 안의 `/page`: 현재 페이지의 자식
- DB 보기의 `New`: 해당 데이터 소스의 항목, 보기 필터값을 기본값으로 적용 가능
- Board 열의 `+`: 열의 그룹 속성값 자동 지정
- Calendar 날짜 셀: Date 자동 지정
- Sprint backlog/current sprint: Sprint Relation 자동 지정
- Template: 속성 기본값과 블록 본문 적용

### 2.3 페이지 초기 상태

- Untitled 제목
- 빈 아이콘/커버
- 부모 권한 상속
- `Press Enter to continue with an empty page` 또는 템플릿/AI 선택
- 자동 저장

## 3. 페이지 표시와 스타일

### 3.1 Icon

- Emoji
- Notion 아이콘 라이브러리
- 파일 업로드
- 이미지 URL
- 사용자 정의 emoji

권장 업로드 크기는 약 280×280이며 정사각형·투명 배경이 안정적이다. 아이콘은 사이드바, breadcrumb, 링크 멘션, DB 카드, 브라우저 탭에서 페이지 식별자로 사용된다.

### 3.2 Cover

- Notion Gallery
- 파일 업로드
- 이미지 URL
- Unsplash 검색
- AI 생성 이미지 `[Business+]`
- Reposition
- Change/Remove

Cover는 페이지 상단 전체 폭 밴드로 표시된다. 썸네일용 이미지와 별개이며, 데이터베이스 Gallery/Card preview에 page cover를 사용할 수 있다.

### 3.3 Typography and width

- Default
- Serif
- Mono
- Small text
- Full width

글꼴은 페이지 단위의 제한된 세 가지 프리셋이다. 사용자 폰트 업로드는 Notion 기본 기능이 아니며 NoteNest의 차별 기능으로 유지할 수 있다.

### 3.4 기타 페이지 옵션

- Lock page: 실수 편집 방지
- Page table of contents: heading이 2개 이상이면 측면 floating TOC 노출 가능
- Customize page: 속성/댓글/백링크/목차 표시 조정
- Favorite
- Move to
- Duplicate
- Export
- Version history
- Analytics
- Open in new tab/window
- Delete

## 4. 블록 모델

블록은 순서와 부모를 가진 트리 노드다.

```text
Block
├── id
├── type
├── content / attributes
├── parent
├── ordered children
├── color
├── annotations
└── created/edited metadata
```

- 각 블록은 drag handle과 컨텍스트 메뉴를 가진다.
- 중첩 목록, 토글, 열, 동기화 블록은 자식 블록을 담는다.
- 블록 단위 링크를 복사할 수 있다.
- 여러 블록을 선택해 이동·복제·삭제·변환할 수 있다.
- 텍스트 선택 서식과 블록 전체 스타일은 별도 층이다.

## 5. 블록 전체 카탈로그

### 5.1 기본 문서 블록

| 블록 | 동작 |
| --- | --- |
| Text | 일반 문단 |
| Heading 1/2/3 | 문서 계층과 TOC 기준 |
| Bulleted list | 글머리 기호 목록, 중첩 |
| Numbered list | 번호 목록, 중첩·연속 번호 |
| To-do | 체크 가능한 항목, 완료 스타일 |
| Toggle list | 접고 펼치는 본문 |
| Toggle heading 1/2/3 | 제목과 접기 영역 결합 |
| Quote | 인용 강조 |
| Callout | 아이콘 + 배경색 강조 컨테이너 |
| Divider | 수평 구분선 |
| Page | 하위 페이지 생성/링크 |
| Link to page | 기존 페이지를 이동 없이 링크 |
| Simple table | 비데이터베이스 표, 머리글/행·열 |

### 5.2 레이아웃·탐색 블록

| 블록/구조 | 동작 |
| --- | --- |
| Columns | 블록을 좌우 열로 배치, 모바일에서는 한 열로 접힘 |
| Table of contents | Heading 기반 자동 링크 목록 |
| Breadcrumb | 현재 페이지의 상위 경로 |
| Synced block | 원본과 모든 복사본을 동기화 |
| Button | 여러 액션을 한 번에 실행 |

Columns는 별도 slash block보다 블록을 서로 옆으로 드래그해 만드는 레이아웃 동작이다.

### 5.3 코드와 수식

| 블록 | 동작 |
| --- | --- |
| Code | 언어 선택, 구문 강조, wrap/caption/copy |
| Block equation | KaTeX/LaTeX 스타일 수식 |
| Inline equation | 문장 안 수식 |

### 5.4 미디어와 파일

| 블록 | 입력 방식 | 주요 기능 |
| --- | --- | --- |
| Image | 업로드, URL, Unsplash, 붙여넣기 | resize, crop, mask, align, caption, alt text, link |
| Video | 업로드 또는 URL | player, caption, download 조건 |
| Audio | 업로드 또는 URL | player, caption |
| File | 업로드 | 이름, caption, download |
| PDF | 업로드/링크 | embedded viewer |
| Web bookmark | URL | 제목·설명·미리보기 카드 |
| Embed | 지원 서비스 URL | iframe형 인터랙티브 콘텐츠 |

대표 임베드 대상에는 Google Drive, GitHub Gist, Maps, Figma, Loom, Typeform, CodePen, Framer, InVision, Whimsical 등 수백 개 서비스가 포함된다.

지원되는 대표 업로드 형식:

- 이미지: HEIC, ICO, JPEG/JPG, PNG, TIF/TIFF, GIF, SVG, WEBP
- 문서: PDF, Markdown 및 일반 파일
- 오디오: MP3, WAV, OGG
- 비디오: MP4 등 브라우저/앱 지원 형식

파일 한도는 플랜·업로드 경로·미리보기 형식에 따라 다르다. 2026 Pricing은 Free 5MB, 유료 플랜은 큰 파일 업로드를 제공하지만 도움말의 개별 importer/display 한도와 다를 수 있으므로 UI에서 서버 정책을 동적으로 안내해야 한다.

### 5.5 링크 표현

URL을 붙여넣을 때 다음 중 하나를 선택할 수 있다.

- URL 그대로
- Bookmark
- Embed
- Link mention
- Link preview

GitHub, Jira, Slack 등 연결된 서비스는 권한 확인 후 더 풍부한 미리보기와 synced database로 확장될 수 있다.

### 5.6 데이터·업무 블록

- Inline database
- Full-page database
- Linked view of database/data source
- Table, Board, Timeline, Calendar, List, Gallery
- Chart
- Form
- Dashboard
- Feed
- Map
- Database button

세부 내용은 [05-databases-views-automation.md](./05-databases-views-automation.md)에 있다.

### 5.7 Button

`[전체]`, 일부 action은 유료 플랜이나 외부 연결이 필요하다.

- `/button`으로 생성
- 이름과 emoji 지정
- 여러 action을 순서대로 추가
- Insert blocks: button 위/아래, page 위/아래
- Add page to database
- Edit pages in database
- Send notification, 최대 약 20명
- Send mail
- Open page 또는 URL
- 변수, Formula, `@person`/`@page`/`@date`
- confirmation
- 실행 오류와 대상 권한 안내

일반 Button block은 페이지 안에 놓이고 Full access/Can edit 사용자가 만들고 실행한다. Database button property는 각 item row의 문맥을 사용하며 실행 권한도 다르다.

### 5.8 AI·회의·새 블록

- AI block/Ask AI 결과
- AI Meeting Notes
- agent-created HTML block `[신규/단계적 배포]`

2026-07 릴리스의 HTML block은 Agent가 ROI 계산기, 퀴즈, 조직도 같은 인터랙티브 HTML을 페이지 안에 만들어 넣는 기능이다. 일반 임의 HTML/JavaScript 업로드와 동일한 권한으로 가정해서는 안 되며 샌드박싱된 제품 기능으로 취급해야 한다.

## 6. 인라인 콘텐츠와 서식

### 6.1 Text annotations

- Bold
- Italic
- Underline
- Strikethrough
- Inline code
- Link
- Text color
- Background color
- Comment
- Suggested edit
- Ask AI

### 6.2 Mentions

- `@person`
- `@group`
- `@page`
- `@date`
- `@today`, `@tomorrow` 같은 상대 날짜
- `@remind`

Person/Group 멘션은 접근 권한과 알림을 동반한다. Page 멘션은 링크이며 대상 권한을 자동 부여하지 않는다.

### 6.3 Emoji

- 시스템 emoji
- 워크스페이스 custom emoji
- 페이지 아이콘, Callout 아이콘, 본문 문자, 리액션에 사용

## 7. 편집 상호작용

### 7.1 Slash command

`/`를 입력하면 블록 종류, 데이터베이스, 미디어, 임베드, 고급 블록을 검색한다.

- 입력 중 fuzzy search
- 최근/추천 항목
- 키보드 위·아래 이동과 Enter 선택
- 카테고리 구분
- 플랜 제한 항목 표시

### 7.2 Markdown shortcuts

- `#`, `##`, `###` + Space: heading
- `-`, `*`, `+` + Space: bullet
- `1.` + Space: numbered list
- `[]` + Space: to-do
- `>` + Space: quote
- ```` + 언어: code
- `---`: divider
- `**bold**`, `*italic*`, `~strike~`, ``code``

### 7.3 블록 핸들

블록 왼쪽 hover 영역에 `+`와 `⋮⋮`가 나타난다.

- `+`: 바로 아래 새 블록/메뉴
- drag: 위치 변경, 중첩, 열 만들기
- click: 블록 메뉴
- shift/select: 다중 선택

### 7.4 블록 메뉴

- Delete
- Duplicate
- Turn into
- Color
- Copy link to block
- Move to
- Comment
- Suggest edits
- Ask AI

블록 종류에 따라 caption, language, fit image, wrap code, align, open original 같은 명령이 추가된다.

### 7.5 선택 툴바

텍스트를 선택하면 근처에 작은 floating toolbar를 표시한다.

- text style
- bold/italic/underline/strike/code
- link
- color
- comment
- Ask AI
- more

이 툴바는 선택 영역을 가리지 않도록 위/아래 위치를 전환하고, Escape로 닫히며, 키보드 포커스를 복귀시켜야 한다.

### 7.6 우클릭

페이지 트리와 블록 모두 우클릭 문맥 메뉴를 제공한다. 페이지 메뉴의 대표 항목은 다음과 같다.

- Open
- Open in new tab/window
- Rename
- Add/change icon
- Favorite/Remove from favorites
- Duplicate
- Copy link
- Move to
- Move to private/teamspace
- View page history
- Export
- Open offline/Download 관련 명령
- Delete

표면과 권한에 따라 항목은 달라지며, 삭제·이동처럼 영향이 큰 명령은 구분선 아래에 배치한다.

## 8. 페이지 트리와 이동

### 8.1 사이드바 트리

- 하위 페이지가 있는 항목에 disclosure chevron
- chevron 클릭: 펼침/접힘
- 제목 클릭: 페이지 열기
- hover: `+`, `•••`
- drag: 순서 변경과 부모 이동
- 깊은 중첩은 indentation
- 현재 페이지 선택 강조
- 새/업데이트 상태 dot 가능

### 8.2 Move to

- 대상 Workspace 내부 검색
- Private, Teamspace, Page를 목적지로 선택
- 이동 후 권한이 달라질 수 있음을 경고
- 하위 페이지 전체가 함께 이동
- DB item을 다른 DB로 옮길 때 속성 매핑/손실 가능성 처리

### 8.3 열기 방식

- Full page
- Side peek
- Center peek
- New tab
- New window

데이터베이스 항목은 목록 문맥을 유지하기 위해 peek가 특히 중요하다.

## 9. 공동 편집

### 9.1 실시간 편집

- 여러 사용자가 같은 페이지를 동시에 편집
- 현재 접속자 아바타
- 선택/커서 또는 편집 위치 표시
- 자동 저장
- 최신 변경 동기화
- 충돌 시 블록 단위 병합과 복구

공식 도움말은 실시간 협업자 수에 별도 고정 제한을 두지 않지만 대규모 페이지와 복잡한 DB는 성능 설계가 필요하다.

### 9.2 Page discussion

- 페이지 상단에서 전체 문서 토론
- 새 comment와 reply
- `@mention`
- emoji reaction
- resolve/reopen
- Comments pane에서 전체 스레드 탐색

### 9.3 Inline comments

- 텍스트 범위 또는 블록에 붙는다.
- 본문에 highlight/말풍선으로 존재를 표시한다.
- 원문이 삭제·변경될 때 anchor 상태를 관리한다.
- 데이터베이스 속성 값에도 일부 property comments를 지원한다.

### 9.4 Suggested edits

`Can comment` 이상에서 지원되는 제한적 제안 모드다.

- 텍스트 추가/삭제
- To-do, heading, bullet, numbered text 제안
- 작성자·시간 표시
- Accept/Reject
- Reply/Reaction

인라인 데이터베이스, 속성, peek 같은 모든 UI에서 동작하지는 않는다.

### 9.5 Mentions and reminders

- 사람/그룹 멘션은 Inbox 알림 생성
- 날짜 멘션에 reminder 지정
- DB Date 속성에도 reminder
- Remind 메뉴에서 시각 선택
- 알림 클릭 시 해당 블록/댓글로 deep link

## 10. Inbox와 업데이트

Inbox는 단순 알림 목록보다 “협업 작업 큐”에 가깝다.

- 페이지/스레드별 그룹
- All, Unread, Archived, Mentions 등 필터
- 읽음/안 읽음
- Archive
- 페이지 미리보기 패널 고정
- 댓글 바로 답장
- 관련 페이지 열기
- 알림 설정으로 이동

데이터베이스 항목의 담당자 변경, 중요한 속성 변경, 자동화 결과도 알림 이벤트가 될 수 있다.

## 11. 저장, 기록, 삭제

### 11.1 자동 저장

- 입력 중 지속적으로 클라우드 저장
- 상단에 저장/동기화 상태를 간결하게 표시
- 사용자가 수동 Save를 누르는 문서 모델이 아니다.
- API/오프라인/동시 편집 충돌은 별도 상태를 보여준다.

### 11.2 Page history

- 과거 시점 선택
- 작성자와 변경 시각 확인
- 이전 버전 미리보기
- Restore

보존 기간은 Free 7일, Plus 30일, Business 90일, Enterprise 무제한이다.

### 11.3 Trash

- 삭제 페이지는 Workspace Trash로 이동
- 기본적으로 30일 보관
- Restore 또는 Delete permanently
- 검색과 필터
- 하위 페이지 함께 복원
- Enterprise는 custom retention이 Trash 보존과 삭제에 영향을 줄 수 있다.
- 지원팀은 통상 30일 이내 스냅샷 복구를 도울 수 있지만 사용자 기능으로 보장되지 않는다.

### 11.4 백업

- Notion 내부의 지속적 백업
- 페이지/Workspace export
- API 기반 외부 백업
- Enterprise 보존·legal hold

내보내기는 실시간 복원 시스템이 아니며, Relation, 모든 보기, 댓글, 기록 등이 완전 왕복되지 않을 수 있다.

## 12. Offline

### 12.1 지원

- 데스크톱과 모바일 앱에서 페이지를 오프라인 사용 가능
- 모든 플랜에서 수동으로 페이지를 내려받을 수 있다.
- 유료 플랜은 Recents/Favorites의 자동 오프라인 범위를 제공한다.
- 오프라인 편집 후 연결 시 동기화한다.

### 12.2 제한

- 데이터베이스는 첫 번째 보기의 첫 50개 행만 오프라인 저장될 수 있다.
- Embed는 외부 네트워크가 필요하다.
- AI, Forms, Buttons, sharing/permissions는 오프라인에서 사용할 수 없다.
- 새로 접근하지 않은 페이지는 내려받지 않았으면 열리지 않는다.
- 여러 기기에서 같은 블록을 오프라인 편집하면 충돌이 발생할 수 있다.

### 12.3 상태 UI

- Downloaded / Downloading / Available offline
- 최근 동기화 시각
- 오프라인 배너
- 충돌·재시도
- 저장 공간 사용량
- 페이지별 다운로드 제거

## 13. 가져오기와 내보내기

### 13.1 Import

데스크톱/웹에서 지원한다.

- TXT
- Markdown
- DOCX
- CSV
- HTML
- PDF
- ZIP
- Confluence
- Asana
- Evernote
- Trello
- 기타 공식 importer

Import 화면은 In progress/Complete 상태, 업로드 시간, 크기와 오류를 보여준다. 앱별 importer는 페이지·DB·속성으로 매핑하지만 댓글, 기록, 복잡한 스타일과 임베드는 손실될 수 있다.

### 13.2 Export

- 현재 페이지 또는 하위 페이지 포함
- HTML
- Markdown + CSV
- PDF `[플랜/범위 조건부]`
- 파일 포함
- 데이터베이스는 현재 보기 또는 기본 보기
- Workspace 전체 export

Enterprise 정책이나 Teamspace 보안이 export를 차단할 수 있다. Guest는 Full access가 있어야 export 항목을 볼 수 있다.

### 13.3 Web Clipper

Web Clipper는 브라우저 또는 모바일 share sheet에서 웹 페이지를 Notion으로 저장한다.

- 데스크톱 브라우저 extension
- 모바일 Notion 앱의 share extension
- 로그인 Account/Workspace 선택
- 대상 page 또는 database 선택
- 제목과 URL
- 파싱된 본문·이미지
- 저장 뒤 tag, assignee, note 추가
- reading list/research DB 구성

웹사이트마다 markup이 달라 일부 본문·서식이 빠질 수 있다. 현재 Help는 Chrome/Safari extension을 중심으로 설명하고 제품 페이지에는 Firefox도 안내되므로 설치 가능 브라우저는 현재 다운로드 페이지에서 확인한다.

## 14. 템플릿과 위키

### 14.1 일반 템플릿

- Marketplace 탐색
- 카테고리, 검색, 미리보기
- `Start with this template`로 Private에 복제
- 완전히 편집 가능
- 공개 페이지에서 `Allow duplicate as template`
- 제작자 제출과 유료/무료 배포

### 14.2 Database templates

- 속성 기본값
- 본문 블록
- 하위 페이지
- 일/주/월/연 반복 생성

세부 내용은 DB 문서에 있다.

### 14.3 Wiki

Wiki는 별도 콘텐츠 엔진이 아니라 데이터베이스 기반 지식 베이스 구성이다.

- Owner
- Last edited
- Tags
- Verification
- 검증 만료일 또는 무기한
- 만료 전 알림
- 페이지 상태와 검색 가능성
- 일반 DB 속성 추가

정책/가이드 문서의 최신성 책임자를 명확히 만드는 것이 핵심이다.

## 15. 분석

페이지 소유자/편집자는 조건에 따라 다음을 확인한다.

- Views
- Unique viewers
- 생성자/편집자
- 최근 편집
- viewer activity

사용자는 계정 설정 또는 페이지에서 자신의 조회 기록 표시를 제한할 수 있다. Workspace Analytics와 Page Analytics는 범위가 다르다.

## 16. 접근성과 반응형

- 모든 아이콘 버튼에 tooltip과 접근 가능한 이름
- 키보드만으로 slash/menu/toolbar/drag 대체 동작
- focus ring과 Escape 복귀
- 이미지 alt text
- Light/Dark/System 테마
- 모바일에서 열을 한 열로 변환
- 작은 화면에서 선택 툴바와 메뉴가 viewport를 벗어나지 않음
- 모션 줄이기 설정
- 색만으로 상태를 구분하지 않고 텍스트/아이콘 병행

## 17. 주요 공식 출처

- [Writing & editing basics](https://www.notion.com/help/writing-and-editing-basics)
- [Images, files & media](https://www.notion.com/help/images-files-and-media)
- [Customize & style your content](https://www.notion.com/help/customize-and-style-your-content)
- [Columns, headings & dividers](https://www.notion.com/help/columns-headings-and-dividers)
- [Comments, mentions & reminders](https://www.notion.com/help/comments-mentions-and-reminders)
- [Suggested edits](https://www.notion.com/help/suggested-edits)
- [Updates & notifications](https://www.notion.com/help/updates-and-notifications)
- [Synced blocks](https://www.notion.com/help/synced-blocks)
- [Buttons](https://www.notion.com/help/buttons)
- [Web Clipper](https://www.notion.com/help/web-clipper)
- [Use pages offline](https://www.notion.com/help/use-pages-offline)
- [Import data](https://www.notion.com/help/import-data-into-notion)
- [Back up your data](https://www.notion.com/help/back-up-your-data)
- [Page analytics](https://www.notion.com/help/page-analytics)
- [July 1, 2026 release](https://www.notion.com/releases/2026-07-01)
