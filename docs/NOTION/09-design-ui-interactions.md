# 09. 디자인·UI·상호작용

## 1. 문서 성격

Notion은 공식 디자인 토큰 전체를 공개하지 않는다. 이 문서는 다음을 구분한다.

- **공식 동작**: Help Center에서 확인되는 메뉴와 기능
- **UI 관찰**: 2026-08-10 macOS 데스크톱 앱의 공개 구조
- **구현 기준**: NoteNest가 같은 품질을 내기 위한 권장 수치와 패턴

구현 기준 수치는 Notion의 내부 토큰을 주장하는 값이 아니다.

## 2. 디자인 성격

Notion UI의 중심 인상:

- 콘텐츠가 주인공인 중립적 canvas
- 조밀하지만 답답하지 않은 업무 도구
- 대부분의 고급 명령을 hover와 context에 숨김
- 페이지, 목록, 데이터베이스가 같은 시각 언어 사용
- 색은 장식보다 상태·분류·강조에 사용
- emoji, icon, cover로 콘텐츠별 개성 허용
- modal보다 popover, dropdown, peek를 자주 사용
- 큰 마케팅형 카드보다 평면적인 작업 표면
- 빠른 키보드 작업과 마우스 drag를 함께 지원
- 동작은 짧고 조용하며 레이아웃을 방해하지 않음

## 3. 데스크톱 앱 골격

```text
┌─────────────────────────────────────────────────────────────┐
│ Native tab bar: workspace, back/forward, tabs, new tab      │
├───────────────┬─────────────────────────────────────────────┤
│ Sidebar       │ Page top bar                                │
│               ├─────────────────────────────────────────────┤
│ Global nav    │                                             │
│ Recents       │ Page cover / icon / title                   │
│ Agents        │                                             │
│ Teamspaces    │ Properties / document blocks / database     │
│ Private       │                                             │
│               │                                             │
│ Library       │                                   AI button │
│ My tasks      │                                             │
│ Calendar      │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

### 3.1 Native tab bar

UI 관찰:

- 여러 Notion tab
- 현재 tab title/icon
- workspace switcher
- sidebar toggle
- back/forward
- new tab

Tab은 page, database item, settings 같은 서로 다른 작업 문맥을 유지한다.

### 3.2 Sidebar

기본 폭은 구현상 약 220-260px 범위가 자연스럽고 resize/collapse를 지원한다.

영역:

1. Workspace/account
2. Home, Chat, Meetings, Inbox
3. Search
4. Favorites/Recents
5. Agents
6. Teamspaces
7. Shared/Private
8. Library, My Tasks, Marketplace, Calendar
9. Help, Trash
10. New chat/New page

### 3.3 Content canvas

- 기본 페이지는 읽기 좋은 제한 폭
- Full width 선택 시 업무 표/대시보드에 맞게 확장
- 양옆 여백은 창 크기에 따라 늘지만 글자 크기는 viewport에 비례해 커지지 않음
- 긴 페이지는 canvas 자체가 scroll
- sidebar/header와 독립 scroll

## 4. 사이드바 상세

### 4.1 행 구조

```text
[chevron] [icon] Page title                  [＋] [•••]
```

- chevron 공간은 하위 항목이 없더라도 정렬을 위해 안정적으로 확보
- 한 줄 높이는 조밀하고 일정
- 긴 제목은 ellipsis
- 선택된 행은 은은한 배경
- hover에서만 action 노출
- focus 상태는 hover와 구분

### 4.2 폴더형 페이지

Notion에는 폴더 객체가 없지만 하위 페이지를 가진 페이지가 폴더 역할을 한다.

권장 작동:

- chevron 클릭: inline tree 펼침/접힘
- 제목 클릭: 페이지 열기
- double click을 필수 동작으로 만들지 않음
- `+`: 그 부모 아래 새 페이지
- `•••`/우클릭: 문맥 메뉴
- drag: 부모 변경/순서 이동
- 펼침 상태 저장

금지:

- 폴더 제목을 누를 때마다 중앙 modal을 띄움
- 펼침과 열기를 같은 작은 hit target에 섞음
- 행 높이가 자식 로딩 중 변함

### 4.3 펼침 애니메이션

- chevron rotate: 약 120-180ms
- 자식 영역: opacity + height/clip의 짧은 transition
- 입력 직후 레이아웃 점프 방지
- 대량 tree는 실제 높이 animation보다 transform/opacity 또는 virtualized reveal
- `prefers-reduced-motion`에서는 즉시 상태 변경

### 4.4 섹션

- 섹션 label은 본문보다 작고 muted
- section 전체 접기
- hover `+`/menu
- 빈 섹션은 짧은 create action
- Teamspace와 Private는 아이콘/indent로 구분

## 5. 페이지 화면

### 5.1 Top bar

- breadcrumb
- current page title/icon
- edited time/status
- comments/updates
- Share
- Copy link
- Favorite
- `•••` actions

명령이 많아도 텍스트 버튼을 모두 나열하지 않는다. 자주 쓰는 Share는 텍스트, 익숙한 기능은 icon + tooltip, 나머지는 `•••`에 둔다.

### 5.2 Page header

```text
Cover image, optional
      [page icon]
Add icon  Add cover  Add comment
Page title
Properties, if database item
```

- Cover는 장식 카드가 아니라 full-width header band
- Icon은 cover 하단과 겹칠 수 있지만 제목을 가리지 않음
- cover가 없으면 icon/title 위 공간을 줄임
- `Add icon`, `Add cover`, `Add comment`는 빈 상태/hover에서 노출

### 5.3 Editor body

- caret 주변 집중
- block 왼쪽에 handle 영역
- 빈 block placeholder
- slash menu
- selection toolbar
- block hover menu
- page 끝 새 block 공간

### 5.4 Database item

- 제목 아래 pinned properties
- Details section 접기
- 본문
- 댓글
- side/center peek에서는 주변 목록 문맥 유지

## 6. 데이터베이스 화면

### 6.1 Header

- database title/icon
- view tabs 또는 view selector
- filter
- sort
- search
- group
- automation
- `•••`
- `New` + template dropdown

좁은 폭에서는 낮은 빈도의 controls를 overflow menu로 접는다.

### 6.2 Table

- 고정된 row height 옵션
- title column 우선
- inline cell popover
- column header menu
- drag resize/reorder
- selection checkbox/hover control
- add property 끝 열
- add row 끝 행

### 6.3 Board

- 일정한 column width
- header에 label, count, `+`, menu
- 카드가 hover 때문에 커지지 않음
- drag placeholder가 원래 크기 유지
- empty column에도 drop target

### 6.4 Calendar/Timeline

- grid와 item layer 분리
- drag/resize handle이 날짜를 가리지 않음
- today와 selection을 다른 시각 상태로 표현
- 겹치는 item은 읽을 수 있게 stack
- zoom/scale 변화가 제목을 지나치게 자르지 않음

## 7. 핵심 메뉴 유형

### 7.1 Dropdown

옵션 선택에 사용:

- font
- page width
- view type
- property type
- status/select
- sort direction

선택 즉시 적용되며 화면 문맥을 보존한다.

### 7.2 Popover

짧은 편집:

- Date picker
- Person picker
- tag picker
- link editor
- icon/emoji picker
- color palette

anchor 주변에 열고 viewport 경계에 맞춰 flip한다.

### 7.3 Context menu

페이지/블록/행에 대한 명령:

- 좌클릭과 다른 우클릭
- 항목 그룹 사이 divider
- icon + label
- shortcut 오른쪽 정렬
- 위험 작업은 아래쪽
- nested submenu는 짧은 delay와 안전한 pointer path

### 7.4 Modal

집중·확인이 필요한 작업:

- settings
- share의 복잡한 권한
- import/export
- destructive confirmation
- Agent configuration 일부

단순 폴더 펼침, tag 선택, 이름 변경에는 modal을 쓰지 않는다.

### 7.5 Peek panel

- 목록 문맥을 유지한 상세 편집
- side peek는 resize 가능
- center peek는 modal처럼 보이지만 full page 확장 제공
- Escape/back으로 닫기
- browser/tab history와 일관된 동작

## 8. 우클릭 페이지 메뉴

권장 순서:

1. Open
2. Open in new tab
3. Open in new window
4. Rename
5. Favorite
6. Add/change icon
7. Duplicate
8. Copy link
9. Move to
10. Page history
11. Export
12. Delete

설계 규칙:

- pointer 위치 근처에 열되 화면 밖으로 나가지 않음
- 메뉴를 연 page를 선택 상태로 유지
- Rename은 가능하면 sidebar inline input
- Move to는 검색 가능한 destination picker
- Delete는 Trash 이동이면 toast + Undo
- 영구 삭제는 confirm dialog
- 권한 없는 명령은 숨김 또는 이유를 설명하는 disabled 상태

## 9. 태그 색 UI

### 9.1 옵션 편집

- tag chip 왼쪽에 color swatch
- 이름 inline edit
- palette popover
- drag reorder
- delete
- 새 옵션 생성

### 9.2 팔레트 역할

중립:

- gray
- brown

범주/정보:

- blue
- purple
- pink
- green

주의/상태:

- red
- orange
- yellow

색은 배경 tint + 읽기 쉬운 text 조합으로 제공한다. light/dark mode에서 같은 이름의 색이 각각 다른 실제 값으로 매핑된다.

### 9.3 접근성

- 색상만으로 상태를 나타내지 않음
- tag label 항상 표시
- 선택 check
- focus ring
- 충분한 contrast
- color name tooltip 또는 accessible label

## 10. 이미지·파일 UI

### 10.1 업로드

- 파일 picker
- drag-and-drop
- clipboard paste
- URL
- 외부 image service

### 10.2 상태

- upload progress
- preview
- failed/retry
- file size/type error
- replace
- remove

### 10.3 이미지 도구

- resize handle
- align left/center/right
- crop
- mask/shape
- fit/full
- caption
- alt text
- link
- comment
- download/open original

이미지 hover toolbar가 본문을 재배치하지 않도록 overlay로 표시한다.

### 10.4 Cover

- 안정된 aspect band
- reposition
- change/remove
- mobile crop preview
- 이미지 위에서 제목 contrast를 강제로 계산할 필요가 없도록 제목은 cover 아래에 둠

## 11. Settings UI

### 11.1 구조

- 왼쪽 category navigation
- 오른쪽 설정 form
- 개인/Workspace/Organization section 구분
- 검색 또는 직접 링크
- 긴 화면 내부 scroll
- 저장이 즉시인지 명시적 버튼인지 일관되게 처리

### 11.2 컨트롤 선택

- binary: switch/checkbox
- 하나 선택: radio/segmented/dropdown
- 숫자: input/stepper/slider
- color: swatch
- 위험 작업: text button + confirm
- 익숙한 명령: icon button + tooltip

### 11.3 플랜 제한

- disabled control
- 최소 플랜 badge
- 짧은 이유
- 업그레이드 action
- 기존 설정 값을 숨기지 않음

## 12. AI UI

### 12.1 Chat

- 사용자/Agent turn
- source chips
- citation
- tool activity
- stop
- retry
- copy
- insert/apply
- feedback
- share

### 12.2 Tool execution

- “검색 중”, “페이지 읽는 중”, “수정 준비” 같은 현재 단계
- 쓰기 대상 preview
- confirmation
- 성공 결과의 생성/수정 page links
- 실패 원인과 재시도

### 12.3 Agent identity

- 일반 사용자와 구분되는 icon/avatar
- Agent name
- trigger badge
- independent access 안내
- Activity link
- credits

### 12.4 장기 작업

- UI를 잠그지 않고 background 실행
- progress
- 닫아도 계속 실행
- 완료 Inbox 알림
- 취소
- partial result

## 13. 시각 시스템

### 13.1 색

역할 기반 토큰을 사용한다.

```text
canvas
sidebar
surface-hover
surface-selected
surface-elevated
border-subtle
text-primary
text-secondary
text-muted
accent
danger
warning
success
focus
tag-*
```

화면 전체를 한 가지 hue로 물들이지 않는다. 중립 canvas 위에 tag, icon, cover, 상태 색을 선택적으로 사용한다.

### 13.2 Typography

권장 구현 범위:

- sidebar/control: 13-14px
- body: 15-16px
- compact panel heading: 14-18px
- page title: 34-44px, 작은 화면에서 고정 breakpoint로 축소
- line height: 본문 1.5-1.7
- letter-spacing: 0

viewport 너비에 따라 글자 크기를 연속 확대하지 않는다. 긴 제목과 한국어/영어 혼합을 실제 컨테이너에서 검증한다.

### 13.3 Spacing

- 4px 기반 작은 간격
- 행 높이 28-36px 범위
- icon button 28-32px
- touch target는 모바일에서 최소 40-44px
- page content gap은 블록 종류에 따라 일정
- 안정된 grid track과 min/max width

### 13.4 Radius

- input/menu/item: 4-6px
- popover/dialog: 6-8px
- card: 6-8px
- tag: pill 가능

페이지 섹션 자체를 floating rounded card로 만들지 않는다.

### 13.5 Border and shadow

- 구분은 배경 차와 1px subtle border 우선
- shadow는 menu/popover/drag/peek의 elevation에만 사용
- 여러 겹 그림자나 광택은 피함

### 13.6 Iconography

- 단색 outline/filled icon을 크기 일관되게 사용
- emoji/page icon은 콘텐츠 정체성
- 기능 아이콘은 의미 고정
- 직접 그린 SVG보다 기존 icon library 사용
- 모르는 아이콘은 tooltip

## 14. Motion

### 14.1 목적

- 공간 관계 설명
- 상태 전환 확인
- drag 대상과 결과 표시
- 비동기 작업 피드백

### 14.2 권장 값

- hover/focus: 80-140ms
- menu/popover: 120-180ms
- sidebar/tree/peek: 160-220ms
- easing: ease-out 중심
- 큰 spring/overshoot 금지

### 14.3 패턴

- menu: opacity + 2-4px translate
- sidebar: width/transform
- tree: chevron rotate + reveal
- card reorder: transform
- toast: short slide/fade
- page transition: 미세한 fade, scroll 위치 보존
- loading: skeleton 또는 spinner, layout 크기 고정

### 14.4 Reduced motion

- 이동/scale 제거
- 짧은 opacity 또는 즉시 전환
- 기능적 progress는 유지

## 15. 키보드

대표 명령:

- `Cmd/Ctrl+P/K`: Search
- `Shift+Cmd/Ctrl+J`: AI
- `Cmd/Ctrl+N`: New page
- `Cmd/Ctrl+F`: Page search
- `Cmd/Ctrl+Z`: Undo
- `Cmd/Ctrl+Shift+Z`: Redo
- `Cmd/Ctrl+B/I/U`: text style
- `Cmd/Ctrl+Enter`: page/full open 문맥
- `Esc`: menu/peek/selection 종료
- `/`: block command
- `@`: mention
- `[[`: page link
- arrows/Enter: menu navigation

화면에 단축키 설명 문단을 상시 노출하지 않고 menu 우측과 tooltip에서 발견 가능하게 한다.

## 16. 상태 디자인

### 16.1 저장

- Saving
- Saved
- Offline
- Syncing
- Conflict
- Failed / Retry

### 16.2 데이터

- Loading
- Empty
- No search result
- Filtered empty
- Permission denied
- Deleted/archived
- Partial offline
- Sync failed

### 16.3 행동 피드백

- toast
- Undo
- inline validation
- progress
- destructive confirm
- optimistic update + rollback

Empty state는 기능 설명을 길게 쓰기보다 icon, 한 줄 문맥, 직접 create/import action을 제공한다.

## 17. 반응형

### Desktop

- sidebar + canvas + optional side peek
- hover controls
- drag
- columns
- dense DB

### Tablet

- sidebar overlay/collapsible
- side peek가 full-height panel
- controls overflow
- DB horizontal scroll

### Mobile

- 한 화면 한 문맥
- columns → vertical
- bottom sheet menu
- long press context
- 44px touch target
- editor toolbar bottom
- database properties stacked
- page cover와 title이 첫 화면을 독점하지 않게 높이 제한
- bottom navigation

텍스트·버튼·chip이 겹치지 않도록 가장 긴 한국어 label과 dynamic type을 확인한다.

## 18. 접근성

- semantic heading
- keyboard focus order
- visible focus ring
- icon accessible name
- tooltip
- menu role와 arrow navigation
- dialog focus trap/return
- drag keyboard 대안
- alt text
- color contrast
- color 외 상태 label
- screen reader live region for save/upload/Agent
- reduced motion
- zoom 200%에서 reflow
- form error를 field와 연결

## 19. UX 안티패턴

- 모든 section을 card로 둘러싸기
- card 안에 card 중첩
- 폴더 클릭마다 modal
- hover 시 행/카드 크기 변동
- tag를 색만으로 구분
- toolbar가 선택 텍스트를 가림
- sidebar와 content가 함께 잘못 scroll
- 제목이 상단 actions와 겹침
- viewport 기반 연속 font scaling
- AI가 바꿀 범위를 preview하지 않음
- filter를 permission처럼 사용
- destructive action에 undo/confirm 없음
- 좁은 화면에서 desktop controls를 축소만 함
- 장식적 gradient/orb로 작업 정보를 흐림

## 20. 화면별 품질 체크

### Sidebar

- 깊은 tree, 긴 제목, 0/100+ pages
- folder animation
- drag target
- context menu viewport collision

### Editor

- 빈 제목, 매우 긴 제목
- image upload/progress/failure
- selection toolbar
- 3-level lists/toggles
- offline conflict

### Database

- 500 properties
- 긴 tag
- empty/no permission
- board drag
- timeline overlap
- mobile horizontal overflow

### Settings

- 긴 category
- disabled plan features
- destructive section
- internal scroll

### Agent

- long running
- permission denied
- expired connection
- many citations
- partial failure
- confirmation cancel

## 21. 공식·관찰 근거

- [Navigate with the sidebar](https://www.notion.com/help/navigate-with-the-sidebar)
- [Manage your library](https://www.notion.com/help/manage-your-library)
- [Writing & editing basics](https://www.notion.com/help/writing-and-editing-basics)
- [Customize & style content](https://www.notion.com/help/customize-and-style-your-content)
- [Views, filters & sorts](https://www.notion.com/help/views-filters-and-sorts)
- [Notion for desktop](https://www.notion.com/help/notion-for-desktop)
- [Notion for mobile](https://www.notion.com/help/notion-for-mobile)
- 2026-08-10 macOS Notion desktop read-only UI observation
