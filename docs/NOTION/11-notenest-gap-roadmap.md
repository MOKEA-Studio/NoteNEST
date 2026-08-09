# 11. NoteNest 적용 격차와 로드맵

## 1. 제품 방향

NoteNest는 현재 README가 정의한 대로 **Electron 기반 개인 로컬 워크스페이스**다. Notion의 모든 기능을 그대로 한 번에 복제하면 제품 정체성과 구현 안정성을 모두 잃기 쉽다.

권장 방향:

> 가볍고 로컬 우선인 개인 지식·프로젝트 도구를 유지하면서, Notion의 페이지/블록/데이터베이스 원리를 단계적으로 도입한다.

### 유지할 차별점

- 로컬 SQLite
- 빠른 개인 메모
- 서버 연결이 끊겨도 임시 저장
- 사용자 폰트 업로드
- 실제 폴더 객체/경험
- 단순한 백업과 파일 소유
- 팀 기능 없이도 완전한 개인 앱

### 배울 핵심

- 페이지 트리와 블록
- 데이터와 보기 분리
- 구조화 속성과 자유 본문의 결합
- 문맥 안에서 생성
- dropdown/peek/context menu 중심 UI
- 명확한 save/sync/offline 상태
- 권한 주체가 분명한 AI

## 2. 현재 구현 스냅샷

기준: 2026-08-10 저장소.

### 기술

- Electron 43
- React 19 + Vite 8
- Tiptap 3
- Go HTTP server
- SQLite
- Lucide icons

### 현재 Page 모델

```go
Page {
  ID
  Title
  Content
  Blocks
  Icon
  CoverURL
  Folder
  Tags[]
  CreatedAt
  UpdatedAt
  DeletedAt
  Favorite
}
```

### 현재 Settings

- font family
- font size
- editor width
- theme
- line spacing
- reduce motion
- uploaded custom fonts
- tag color map

### 현재 화면

- 홈
- 모든 노트/Library
- 즐겨찾기
- 태그
- 검색
- 템플릿
- 설정
- 휴지통
- 페이지 에디터
- 버전 기록
- 모바일 하단 탐색

### 현재 API

- pages CRUD
- search
- trash/restore/permanent delete
- versions/restore
- settings
- storage
- backup
- uploads

## 3. 기능 비교

| 영역 | NoteNest 현재 | Notion 수준 | 격차 |
| --- | --- | --- | --- |
| 계정 | 없음, 로컬 단일 사용자 | 다중 계정, SSO, 2FA, managed user | 큼, 클라우드 전까지 불필요 |
| Workspace | 사실상 singleton | 다중 Workspace/Organization | 데이터 모델 준비 필요 |
| 폴더/페이지 트리 | folder 문자열 + 펼침 | 중첩 page tree/Teamspace | 실제 folder ID와 parent 필요 |
| 블록 | Tiptap JSON 문서 | 안정 ID를 가진 block tree | 부분 구현 |
| 아이콘/커버 | 업로드 지원 | emoji/icon/gallery/AI | 핵심 완료, picker 확장 |
| 폰트 | 사용자 업로드 | 3개 preset | NoteNest 우위 |
| 태그 | string + 전역 color map | 속성별 option/color | tag entity 필요 |
| 검색 | title/body/tag/date 범위 | 전역 필터/command/AI | 인덱스·필터 확장 |
| 버전/Trash | 구현 | 플랜별 기록/Trash | 로컬 retention 설정 보강 |
| Database | 없음 | data source/properties/views | 가장 큰 제품 격차 |
| Tracker | 없음 | Projects/Tasks/Sprints | DB 이후 구현 |
| Calendar | 없음 | DB calendar + 별도 앱 | 우선 DB view부터 |
| 협업 | 없음 | 실시간 편집, 댓글, 멘션 | cloud sync 이후 |
| Settings | 구현 | 개인/Workspace/Org 설정 | 개인 설정 양호 |
| Import/export | Markdown/JSON 등 일부 | 다형식/importer | 점진 확대 |
| Offline | local draft + SQLite | 선택 다운로드/sync | 로컬 앱 특성상 우위 |
| Sites | 없음 | 공개 사이트 | 후순위 |
| AI | 없음 | Agent/Search/Meeting/Custom Agent | 명확한 단계 필요 |
| API/integrations | 로컬 REST | OAuth/Public API/MCP | 후순위 |
| Enterprise admin | 없음 | SAML/SCIM/audit/DLP | 고객 수요 전까지 제외 |

## 4. 우선순위 원칙

1. **데이터 무결성**이 시각 기능보다 먼저다.
2. 기존 `pages` 데이터가 손실되지 않는 migration을 만든다.
3. UI만 만든 빈 기능보다 end-to-end 작은 기능을 완성한다.
4. 개인 로컬 앱의 빠른 시작을 로그인으로 막지 않는다.
5. Database 이전에 Page/Folder/Tag 식별자를 안정화한다.
6. Calendar는 Date property가 생긴 뒤 만든다.
7. Tracker는 Projects/Tasks/Sprints를 따로 하드코딩하지 않고 DB 템플릿으로 만든다.
8. AI는 권한·로그·실행 취소가 준비된 뒤 쓰기 기능을 연다.
9. 팀/Enterprise 기능은 실제 사용자 요구가 생길 때 확장한다.

## 5. P0: 현재 프레임 완성

목표: 지금 있는 개인 노트 기능을 “데모”가 아니라 신뢰할 수 있는 앱으로 만든다.

### 데이터

- schema migration version table
- upload asset metadata
- orphan upload 정리
- backup restore
- version retention 설정
- autosave queue와 종료 시 flush
- SQLite transaction/foreign key

### Folder

- `folders` table
- stable folder ID
- rename/delete
- nested folder
- drag-and-drop move
- sort order
- collapsed state persistence
- 미분류는 가상 section

현재 `Page.Folder string`은 migration으로 `folder_id`에 매핑한다.

### Tag

- `tags(id, workspace_id, name, color, sort_order)`
- `page_tags(page_id, tag_id)`
- rename이 모든 page에 반영
- merge
- delete
- color swatch
- 중복 이름/대소문자 정책

현재 `Tags []string`과 `settings.tagColors`를 entity로 옮긴다.

### Page menu

- rename
- duplicate
- favorite
- copy link/deep link
- move to folder
- export
- delete
- keyboard ContextMenu/Shift+F10
- viewport collision
- focus return

### Editor

- slash command
- 선택 툴바 완성
- block handle
- image progress/retry/alt/caption
- undo/redo
- keyboard navigation
- pasted HTML sanitization
- reduce motion

### 품질 기준

- app 강제 종료 후 최신 저장 복구
- 폴더 1,000개/페이지 10,000개 성능 시험
- upload 실패가 editor를 막지 않음
- 모든 menu keyboard 사용
- mobile 320px에서 겹침 없음
- light/dark visual regression

## 6. P1: 페이지 그래프와 블록 기반

목표: Database와 협업을 올릴 수 있는 안정된 콘텐츠 모델.

### 6.1 Workspace singleton부터

```sql
workspaces(
  id, name, icon, created_at, updated_at
)

workspace_settings(
  workspace_id, key, value_json
)
```

- 기존 데이터에 `local-default` Workspace를 자동 생성한다.
- UI에 Workspace switcher를 당장 노출하지 않아도 모든 row에 `workspace_id`를 둔다.

### 6.2 Page

```sql
pages(
  id,
  workspace_id,
  parent_page_id,
  folder_id,
  title,
  icon,
  cover_asset_id,
  favorite,
  sort_order,
  created_at,
  updated_at,
  deleted_at
)
```

- parent page와 folder를 모두 지원하되 UI에서 관계를 명확히 한다.
- 폴더는 분류 container, parent page는 콘텐츠 계층이다.
- page deep link와 breadcrumb.
- sidebar page tree.

### 6.3 Blocks

두 단계 migration이 안전하다.

#### 단계 A

- 현재 Tiptap `blocks JSON` 유지
- 모든 top-level node에 stable block ID 부여
- document schema version
- snapshot migration

#### 단계 B

```sql
blocks(
  id,
  page_id,
  parent_block_id,
  type,
  position,
  content_json,
  created_at,
  updated_at,
  deleted_at
)
```

- block 단위 comment/link/version
- 대형 문서 부분 update
- 향후 collaboration operation의 대상

초기부터 모든 inline text node까지 row로 쪼개는 것은 과도하다. 독립적으로 이동·댓글·링크되는 block 단위까지만 정규화한다.

### 6.4 Assets

```sql
assets(
  id,
  workspace_id,
  kind,
  filename,
  mime_type,
  bytes,
  sha256,
  local_path,
  width,
  height,
  created_at
)
```

- image/font/file 공통 관리
- hash dedup
- 사용 중인 page/block relation
- export/backup 포함
- soft delete + garbage collection

### 6.5 탐색

- breadcrumb
- backlinks
- page mentions
- recent history
- favorites order
- Library filter/sort
- command palette
- local full-text search, SQLite FTS5

## 7. P2: Data source와 Views

목표: NoteNest를 노트 앱에서 사용자 정의 업무 도구로 확장한다.

### 7.1 핵심 엔터티

```sql
data_sources(
  id, workspace_id, page_id, name, icon, created_at
)

properties(
  id, data_source_id, name, type, config_json, position
)

property_options(
  id, property_id, name, color, position
)

data_items(
  page_id, data_source_id
)

property_values(
  page_id, property_id, value_json
)

views(
  id, data_source_id, name, type, config_json, position
)
```

Item은 별도 문서 복제 없이 `pages` row를 참조한다.

### 7.2 첫 속성 범위

1. Title
2. Text
3. Number
4. Select
5. Multi-select
6. Status
7. Date
8. Checkbox
9. URL
10. Person은 local profile 단일 값부터
11. Files
12. Created/Edited time

Relation, Rollup, Formula, Button은 안정된 typed value 이후 추가한다.

### 7.3 첫 보기

1. Table
2. Board
3. Calendar
4. List
5. Gallery
6. Timeline
7. Chart/Form/Dashboard

각 View config:

- visible properties
- order
- filter AST
- sort list
- group/subgroup
- conditional color
- open mode

### 7.4 Filter AST

```json
{
  "operator": "and",
  "children": [
    { "propertyId": "status", "op": "not_in", "value": ["done"] },
    { "propertyId": "due", "op": "before", "value": { "relative": "next_week" } }
  ]
}
```

문자열로 SQL을 저장하지 않는다. 타입이 있는 AST를 저장하고 server에서 parameterized query로 컴파일한다.

### 7.5 성공 기준

- 같은 data source를 Table/Board/Calendar에서 동시에 편집
- Board drag가 Status를 바꿈
- Calendar drag가 Date를 바꿈
- view filter가 원본 item을 삭제하지 않음
- tag option rename/color가 모든 view에 반영
- 10,000 items에서 가상화·query pagination

## 8. P3: Tracker와 Calendar

### 8.1 Projects template

- Projects DB
- Tasks DB
- Relation
- Rollup progress
- Portfolio table
- Status board
- Timeline

### 8.2 My Tasks

- Task source 등록
- current local profile Assignee
- Today/Upcoming/Overdue
- Board/Calendar
- quick create

### 8.3 Sub-items/Dependencies

- self Relation
- timeline arrow
- date shift modes
- cycle detection
- parent progress

### 8.4 Sprints

- Sprints DB template
- Current/Planning/Backlog views
- recurring Sprint 생성
- incomplete task carry-over

### 8.5 Intake

- 내부 Form부터
- public form은 cloud hosting 이후
- response → DB item
- required/conditional
- simple automation

### 8.6 Calendar 순서

1. DB Calendar view
2. local reminder
3. ICS import/export
4. OS calendar deep link
5. Google/Microsoft OAuth sync
6. scheduling/availability

별도 Notion Calendar 수준 앱을 초기에 만들 필요는 없다.

## 9. P4: 계정·동기화·협업

실제 다기기/팀 요구가 확인된 뒤 진행한다.

### 9.1 Account

- local profile은 로그인 없이 생성
- cloud sync 활성화 때 Account link
- OAuth
- session/device
- account recovery
- optional 2FA

### 9.2 Workspace/Membership

```sql
accounts
profiles
workspace_memberships
groups
group_members
teamspaces
teamspace_members
acl_entries
```

초기 역할:

- owner
- member
- guest

Restricted/member admin/org owner는 Enterprise 수요 전까지 보류한다.

### 9.3 Sync

- client-generated UUID
- operation log/outbox
- server revision
- idempotency key
- tombstone
- retry/backoff
- attachment multipart/resume
- conflict UI

```text
Local SQLite
├── materialized state
├── outbox operations
└── sync cursor
          ↕
Cloud API / event stream
```

### 9.4 실시간 협업

- block stable ID
- presence
- comments
- mentions
- notifications
- CRDT 또는 proven collaboration engine
- page history

텍스트 협업 엔진은 직접 발명하지 말고 Tiptap/Yjs 계열의 검증된 조합을 우선 검토한다.

### 9.5 권한

- Subject, Resource, Action
- inherited ACL
- Teamspace
- Page
- DB item rule
- public link

Filter는 절대 권한으로 사용하지 않는다.

## 10. P5: AI

### 10.1 1단계, 개인 보조

- selection rewrite/summarize/translate
- current page Q&A
- explicit insert/replace preview
- local setting에 provider/model
- prompt history
- 취소
- 비용/usage

### 10.2 2단계, Workspace search

- FTS + embedding hybrid search
- source citations
- page/DB filters
- local-only mode
- private index

### 10.3 3단계, Tracker AI

- task 요약
- tag/status 추천
- duplicate issue 후보
- meeting text에서 action items
- Formula 생성 보조

### 10.4 4단계, Agent

```sql
agents
agent_versions
agent_access
agent_triggers
agent_connections
agent_runs
agent_run_steps
agent_credit_usage
```

첫 범위:

- 수동 trigger
- read-only selected pages
- 결과를 draft page에 생성
- Activity log
- cancel

그 다음:

- schedule
- DB event trigger
- write selected DB
- external tools

외부 메일 발송과 공개 작업은 항상 사람 승인을 기본값으로 한다.

### 10.5 AI Meeting Notes

녹취는 법률·오디오·OS 권한·보존 문제가 크므로 마지막에 독립 프로젝트로 다룬다.

- consent UX
- system/mic capture
- local encrypted temp audio
- transcript
- summary/action items
- retention
- delete
- speaker labels
- admin policy

## 11. 명시적으로 후순위/제외할 것

### 당장 만들지 않음

- Notion Mail clone: 원 제품도 2026-09 종료
- SAML/SCIM
- Organization-level controls
- DLP/SIEM
- legal holds
- full public API marketplace
- External Agent platform
- custom domain Sites
- 10종 이상의 DB view를 한 번에 구현

### 요구가 확인되면

- public Sites
- multi-workspace
- enterprise admin
- synced Jira/GitHub DB
- MCP server
- Calendar account full sync

## 12. 화면 IA 제안

```text
Sidebar
├── Home
├── Search
├── Inbox (협업 이후)
├── Favorites
├── Folders
├── Databases
├── Projects
├── Calendar
├── Private pages
├── Templates
├── Trash
└── Settings

Global actions
├── New page
├── New database item
├── Command palette
└── AI, 도입 이후
```

Folders는 실제 폴더처럼 tree dropdown으로 유지한다. Projects/Calendar는 DB 기반 기능이 생긴 뒤 같은 sidebar 언어로 추가한다.

## 13. 현재 파일별 다음 책임

| 파일 | 다음 단계 |
| --- | --- |
| `src/App.jsx` | view state를 router/store로 분리, autosave service |
| `src/components/Sidebar.jsx` | folder ID/tree/drag, page parent tree |
| `src/components/PageContextMenu.jsx` | duplicate/move/export/focus 완성 |
| `src/components/BlockEditor.jsx` | stable block ID, slash/handle |
| `src/components/Editor.jsx` | page header/property 영역 분리 |
| `src/components/SettingsPage.jsx` | 개인/Workspace 설정 section |
| `src/api.js` | typed resources, error/status, pagination |
| `server/store.go` | migrations와 repository 분리 |
| `server/model.go` | Page entity 정규화, tag/folder/assets |
| `server/main.go` | router/resource별 handler 분리 |

P2가 시작되면 `data_sources`, `properties`, `views`를 별도 Go package와 React feature module로 나누는 것이 좋다.

## 14. 마이그레이션 순서

1. 현재 DB 백업
2. `schema_migrations`
3. default Workspace 생성
4. folders 생성, 기존 Folder 문자열 매핑
5. tags/page_tags 생성, Tags 배열과 colors 매핑
6. assets 생성, 기존 upload URL 등록
7. pages에 workspace/folder/parent/sort columns
8. blocks document schema version
9. dual read 검증
10. 새 schema write 전환
11. round-trip tests
12. 구 legacy column 제거는 최소 한 릴리스 후

SQLite migration은 transaction으로 실행하고 실패 시 기존 앱이 읽을 수 있는 상태를 보존한다.

## 15. 테스트 전략

### Unit

- folder/tag migration
- filter AST
- sort/group
- Relation cycle
- dependency date shift
- permission evaluation

### API

- CRUD
- concurrency/revision
- pagination
- upload
- backup/restore
- automation idempotency

### UI

- context menu keyboard
- tree expansion
- drag/drop
- autosave/offline
- DB cell edit
- Board/Calendar drag
- responsive

### Visual

- 1440×900
- 1280×720
- 768×1024
- 390×844
- light/dark
- Korean/English long text
- reduced motion

### Data

- 10,000 pages
- 10,000 DB items
- 500 properties stress case
- 100MB+ assets
- interrupted migration
- crash during save

## 16. 릴리스 제안

| 릴리스 | 핵심 결과 |
| --- | --- |
| 0.2 | Folder/Tag entity, context UI, backup restore |
| 0.3 | Page tree, stable blocks, FTS search |
| 0.4 | Data source, properties, Table/Board |
| 0.5 | Calendar/Timeline, Projects/Tasks |
| 0.6 | Forms, Relation/Rollup/Formula, Sprints |
| 0.7 | Optional account/cloud sync |
| 0.8 | Comments, mentions, real-time collaboration |
| 0.9 | Search AI and personal assistant |
| 1.0 | 검증된 개인 Workspace 제품 |
| 2.x | Teamspace, Agents, integrations, Sites |

버전 번호보다 각 단계의 데이터 호환성과 end-to-end 완성도가 중요하다.

## 17. 가장 먼저 구현할 10개

1. DB schema migration 기반
2. Folder ID와 nested tree
3. Tag entity와 색상 picker
4. Page duplicate/move/deep link
5. Backup restore
6. Stable block ID
7. SQLite FTS5 검색
8. Workspace singleton
9. Data source + Title/Text/Status/Date
10. Table과 Board view

이 순서가 끝나면 Tracker와 Calendar가 별도 임시 기능이 아니라 같은 데이터 모델 위에 자연스럽게 올라간다.
