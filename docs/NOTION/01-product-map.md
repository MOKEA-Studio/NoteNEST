# 01. 제품 전체 지도

> 상태 표시는 [README](./README.md)의 표기 규칙을 따른다.

## 1. Notion이 제공하는 제품군

Notion은 “문서 앱” 하나가 아니라, 공통 계정·워크스페이스·권한·페이지 모델 위에 여러 업무 표면을 얹은 제품군이다.

| 제품 표면 | 핵심 목적 | 주 엔터티 |
| --- | --- | --- |
| Docs / Wiki | 문서 작성, 지식 베이스, 정책과 가이드 | Page, Block, Verification |
| Databases | 구조화 데이터, 사용자 정의 업무 앱 | Data source, Property, View, Item |
| Projects | 프로젝트·태스크·스프린트 관리 | Project, Task, Sprint, Dependency |
| Forms | 외부/내부 입력 수집 | Question, Response, Database item |
| Sites | 페이지의 웹 공개와 사이트 구성 | Domain, Site, Page, Navigation |
| Home | 개인 업무 시작점 | Upcoming, Recents, My Tasks |
| Inbox | 협업 알림과 처리 큐 | Mention, Comment, Reminder, Invite |
| Search | 워크스페이스 탐색 | Page index, Filter, Command Search |
| Notion AI | 작성, 분석, 검색, 파일 생성 | Chat, Prompt, Source, Citation |
| Notion Agent | 사용자의 인터랙티브 AI 작업자 | Chat, Skill, Instruction, Memory |
| Custom Agents | 공유·예약·이벤트 기반 자동 AI | Trigger, Tool, Access, Activity |
| Meetings | 회의 일정, 노트, 녹취와 요약 | Calendar event, Meeting note, Transcript |
| Notion Calendar | 외부 일정과 Notion DB를 한 화면에서 관리 | Account, Calendar, Event, DB item |
| Notion Mail | Gmail 기반 받은편지함 | Mail, View, Label, Snippet |
| Marketplace | 템플릿, 연결, 솔루션 탐색 | Template, Connection, Creator |
| Developer Platform | API, Webhooks, MCP, Workers, Agent SDK | Integration, Token, Event, Worker |
| Enterprise Admin | 조직 통제, 감사, 보안, 분석 | Organization, Policy, Audit event |

Notion Mail 독립 앱은 `[종료 예정]`이다. 2026-09-22에 종료되지만 Gmail/Outlook용 AI Connector, Mail block, Agent 메일 도구는 별도 기능으로 유지된다.

## 2. 정보 구조

### 2.1 계정에서 콘텐츠까지

```text
사람
└── Account: 이메일, 로그인 수단, 프로필, 개인 환경 설정
    ├── Workspace A: 플랜·결제·멤버십·콘텐츠가 독립
    ├── Workspace B
    └── Organization: Enterprise에서 여러 워크스페이스를 묶어 통제

Workspace
├── Home / Inbox / Search / Library
├── Private pages
├── Shared pages
├── Teamspaces
│   └── Page tree
├── Databases and data sources
├── Agents and connections
└── Settings / Security / Billing
```

- 한 계정은 여러 워크스페이스에 참가할 수 있다.
- 플랜과 결제는 계정 전체가 아니라 워크스페이스별이다.
- Enterprise의 Organization은 여러 워크스페이스에 공통 보안·멤버 정책을 적용하는 상위 관리 단위다.
- Private는 “계정 전역 개인 공간”이 아니라 해당 워크스페이스 안에서 본인만 보는 페이지 영역이다.

### 2.2 페이지와 데이터베이스

```text
Page
├── metadata: title, icon, cover, parent, permissions
├── properties: database item일 때 구조화 필드
└── children: ordered blocks

Database
├── page shell
├── one or more data sources
│   ├── schema / properties
│   └── items, each item is a Page
└── views
    ├── layout
    ├── visible properties
    ├── filter / sort / group
    └── per-view presentation
```

공식 API도 2026년 기준 Database와 Data source를 구분한다. Database는 컨테이너, Data source는 실제 스키마와 항목 집합이며, 보기(View)가 독립 API 엔터티로 확장됐다.

## 3. 전역 내비게이션

### 3.1 데스크톱/웹 사이드바

공식 도움말과 실제 데스크톱 UI를 합치면 다음 순서가 기본 골격이다.

1. 워크스페이스 전환, 계정/설정 진입
2. Home
3. Chat 또는 Chats with AI
4. Meetings
5. Inbox
6. Search
7. Favorites / Recents
8. Agents
9. Teamspaces
10. Shared
11. Private
12. Library
13. My tasks
14. Marketplace
15. Notion Calendar
16. Help
17. Trash
18. New chat / New page 같은 빠른 생성

섹션은 접고 펼칠 수 있고, 사이드바 전체를 숨길 수 있다. Library는 팀스페이스, 최근 항목, 즐겨찾기, 공유, 개인, 회의 노트, 에이전트를 검색·필터·일괄 관리하는 확장 탐색 화면이다.

### 3.2 페이지 상단 바

- breadcrumb 또는 현재 위치
- 페이지 제목/아이콘
- 최근 편집 상태
- 댓글/업데이트
- Share
- Copy link
- Favorite
- Actions(`•••`)

상단 바는 페이지 스크롤과 별개로 문맥을 유지한다. 실제 편집 명령은 본문 블록 핸들, 선택 툴바, 슬래시 메뉴, 우클릭 메뉴에 분산된다.

### 3.3 모바일

- 데스크톱의 다열 레이아웃은 한 열로 접힌다.
- hover 전용 기능은 탭·길게 누르기·`•••` 메뉴로 이동한다.
- 페이지 읽기, 편집, 댓글, 검색, 알림, Calendar를 지원한다.
- 워크스페이스 삭제, 보안/결제 일부, 가져오기, 다중 블록 선택 등은 데스크톱/웹 한정이다.
- Notion Agents 전용 iOS 앱이 2026-07 공개되어 모바일 AI 작업과 대화를 별도 표면으로 제공한다.

## 4. 기능 체계

### 4.1 만들기

- 빈 페이지, 템플릿 페이지, 데이터베이스 항목 생성
- `+`, `/`, Markdown 단축키, 붙여넣기, 드래그 앤 드롭
- 텍스트, 목록, 할 일, 인용, 코드, 수식, 표
- 이미지, 파일, 오디오, 비디오, PDF, 북마크, 임베드
- 데이터베이스, 연결된 보기, 폼, 차트, 대시보드
- 버튼, 동기화 블록, 목차, breadcrumb
- AI 작성, 요약, 번역, 이미지 생성, 파일 생성
- 반복 데이터베이스 템플릿과 예약 에이전트

### 4.2 정리

- 중첩 페이지 트리, Teamspace, Private, Shared
- 즐겨찾기, 최근 항목, Library
- 데이터베이스 속성, 보기, 필터, 정렬, 그룹, 하위 그룹
- 태그 색, 조건부 색, 아이콘, 커버
- 관계, 롤업, 수식, 고유 ID
- 템플릿, 위키, 검증된 페이지
- 검색과 명령 검색

### 4.3 협업

- 멤버, 제한 멤버, 게스트, 임시 멤버, 그룹
- 댓글, 토론, 멘션, 리액션, 리마인더
- 실시간 공동 편집과 사용자 아바타
- Suggested edits
- 공유 링크와 웹 게시
- 세분화된 페이지/데이터베이스 권한
- Inbox 알림과 Slack 알림
- 페이지 분석, 편집·조회 기록

### 4.4 실행

- 태스크, 하위 태스크, 담당자, 상태, 기한
- 프로젝트, 롤업 진행률, 타임라인과 로드맵
- 의존성, 날짜 자동 이동, 스프린트
- Forms로 요청/버그/리드 수집
- Buttons와 Database automations
- Slack/Gmail/Webhook 알림·작업
- Calendar 일정과 예약 링크
- Custom Agent의 이벤트·예약 실행

### 4.5 발견과 이해

- 워크스페이스 검색, 페이지 내 검색, DB 검색
- Enterprise Search와 외부 AI Connectors
- Research Mode
- Notion Agent의 출처 인용 답변
- AI autofill, 요약, 핵심 정보, 태깅
- 회의 녹취, 요약, 액션 아이템
- 분석, 대시보드, 차트

### 4.6 공개와 확장

- Notion Sites, 커스텀 도메인, 검색 노출, 분석
- Marketplace 템플릿과 연결
- 가져오기/내보내기
- Public API, OAuth, 내부 연결, Webhooks
- Notion MCP
- Developer Platform CLI, Workers, External Agent API/SDK

## 5. 권한과 실행 주체

같은 작업도 누가 실행하느냐에 따라 권한 평가가 다르다.

| 실행 주체 | 권한 기준 |
| --- | --- |
| 사람 | 본인의 워크스페이스·팀스페이스·페이지 권한 |
| Notion Agent | 요청한 사용자의 권한을 그대로 사용 |
| Custom Agent | 에이전트에 명시적으로 부여된 독립 권한 |
| External Agent | 연결 시 부여된 에이전트 권한과 공급자 조건 |
| API connection | 연결에 부여된 capability와 공유된 페이지 범위 |
| 공개 사이트 방문자 | 게시 설정과 공개 범위 |
| 게스트 | 명시적으로 공유된 페이지와 하위 범위 |

이 차이는 보안 설계에서 매우 중요하다. 특히 Custom Agent는 실행을 누가 유발했는지와 무관하게 자체 권한으로 데이터를 읽고 결과를 만들 수 있다.

## 6. 플랜 구조 스냅샷

2026-08-10 공식 Pricing의 월 환산 표시 기준이며 가격은 지역·통화·연간 결제에 따라 달라질 수 있다.

| 플랜 | 표시 가격 | 대표 기능 |
| --- | ---: | --- |
| Free | $0 | 개인 페이지/DB, 기본 Forms/Sites, Calendar, 제한 AI 체험, 1개 차트 |
| Plus | $10/멤버/월 | 무제한 블록·파일, 커스텀 Forms/Sites, 기본 연결, 30일 기록 |
| Business | $20/멤버/월 | Notion Agent, AI Meeting Notes, Enterprise Search beta, SAML SSO, private teamspace, 세분화 DB 권한, 대시보드 |
| Enterprise | 문의 | SCIM, 감사 로그, 고급 보안/분석, DLP/SIEM, 무제한 기록, 조직 통제, zero LLM data retention |

주요 수량 차이:

- 페이지 기록: Free 7일, Plus 30일, Business 90일, Enterprise 무제한
- 외부 게스트: Free 10명, 유료 플랜은 공식 가격표상 무제한
- 차트: Free 1개, 유료 무제한
- Forms: Free 기본, Plus 커스텀, Business+ 조건부 로직
- 데이터베이스 자동화: Plus+
- 대시보드: Business+
- Custom Agents와 공유 크레딧: Business+

## 7. 플랫폼별 표면

| 기능 | 웹 | 데스크톱 | 모바일 |
| --- | --- | --- | --- |
| 페이지/DB 편집 | O | O | O, 일부 제약 |
| 다중 탭 | 브라우저 탭 | 앱 네이티브 탭 | 제한적 |
| Global Command Search | 브라우저 내 | OS 전역 단축키 | 앱 검색 |
| 가져오기 | O | O | X |
| 오프라인 | 제한 | O | O |
| AI Meeting Notes 녹음 | 조건부 | 주력 | 지원 기기/버전 조건 |
| Calendar | 웹 앱 | 전용 앱 | 전용 앱 |
| 관리자/결제 전체 설정 | O | O | 일부 X |
| 블록 다중 선택/열 편집 | O | O | X 또는 축소 |

추가 앱 표면:

- Web Clipper: 데스크톱 브라우저 extension과 모바일 share sheet에서 웹 페이지 저장
- Mobile widgets: 최근/즐겨찾기 페이지와 빠른 작업 진입
- Notion Agents iOS app: AI chat과 Agent 작업을 모바일 중심으로 실행

## 8. 제품 전반의 공통 작동 원리

1. **Progressive disclosure**: 기본 화면은 조용하게 유지하고 hover, `•••`, 우클릭, 슬래시 메뉴에서 고급 명령을 연다.
2. **한 데이터, 여러 보기**: DB 원본은 유지하고 각 사용 목적에 맞는 보기만 바꾼다.
3. **자유 형식과 구조의 공존**: 페이지 본문은 자유 블록, 상단 속성은 정형 데이터다.
4. **문맥 안에서 생성**: 폴더/팀스페이스/DB/캘린더/프로젝트 화면에서 만들면 부모와 기본 속성이 자동 지정된다.
5. **링크가 관계가 된다**: 페이지 멘션, Relation, link preview, synced database가 외부·내부 문맥을 연결한다.
6. **권한 상속 후 예외**: 상위 공유가 기본이고, 민감 범위나 특정 DB 행에서 제한한다.
7. **작은 명령의 조합**: 버튼, 자동화, 수식, Relation, Rollup을 조합해 사용자 정의 업무 앱을 만든다.
8. **AI의 표면 내장**: 별도 AI 화면뿐 아니라 선택 메뉴, 속성, 회의, 검색, 데이터베이스, 캘린더에 AI 진입점을 둔다.
9. **안전한 파괴 작업**: 삭제는 Trash와 기록을 거치고, 공개/권한/연결 변경은 확인과 관리자 정책을 사용한다.
10. **동일 객체의 다양한 열기 방식**: full page, side peek, center peek, 새 탭/창으로 작업 문맥을 보존한다.

## 9. 제품 생명주기 상태

| 상태 | 예시 |
| --- | --- |
| 안정 | 페이지/블록, 데이터베이스, 공유, Calendar, Projects |
| 확장 중 | Dashboard, Feed, Map view, Data sources/View API |
| Beta | Enterprise Search 일부, AI Meeting Notes 일부, Workers, External Agents |
| Private beta/alpha | External Agents API, Agent SDK 일부 |
| 종료 예정 | Notion Mail 독립 받은편지함, 2026-09-22 |
| 변동 가능 | 지원 AI 모델, Agent 크레딧 과금, 새 MCP/Connector 목록 |

세부 기능과 한도는 각 분야 문서와 [SOURCES.md](./SOURCES.md)를 기준으로 확인한다.
