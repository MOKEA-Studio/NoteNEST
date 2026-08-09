# Notion 전체 기능·시스템 조사

> 기준일: 2026-08-10  
> 목적: NoteNest의 제품·정보 구조·기능·UI 설계를 위한 Notion 레퍼런스  
> 조사 범위: Notion 웹/데스크톱/모바일, Notion Calendar, Meetings, AI, Agents, Sites, API 및 Enterprise 관리 기능

## 1. 이 문서의 의미

이 디렉터리는 Notion을 화면 모사 대상으로만 보지 않고, 다음 층을 하나의 제품 시스템으로 해체한 조사 문서다.

- 계정과 로그인
- 조직, 워크스페이스, 팀스페이스, 멤버십
- 페이지, 블록, 파일, 공동 편집
- 데이터베이스, 보기, 자동화
- 프로젝트, 태스크, 스프린트, 요청 트래커
- 데이터베이스 캘린더와 별도 Notion Calendar 앱
- 회의 기록과 AI Meeting Notes
- Notion Agent, Custom Agents, External Agents
- 검색, Enterprise Search, Research Mode, AI Connectors
- Sites, 템플릿, Marketplace, 가져오기/내보내기
- API, MCP, Webhooks, Workers
- 보안, 감사, 분석, 데이터 거버넌스
- 시각 디자인, 내비게이션, 상호작용, 상태와 모션

Notion은 실험과 단계적 배포가 잦다. 여기서 “전체”는 **기준일에 공개된 공식 도움말·개발자 문서·릴리스 노트와 실제 데스크톱 UI에서 확인할 수 있는 기능 전체**를 뜻한다. 계정, 지역, 플랜, 관리자 정책, 베타 참여 여부에 따라 실제 노출은 달라질 수 있다.

## 2. 사실 표기

| 표기 | 뜻 |
| --- | --- |
| **공식** | Notion 도움말, 가격표, 개발자 문서 또는 릴리스 노트에서 확인 |
| **UI 관찰** | 2026-08-10 Notion macOS 데스크톱 앱에서 읽기 전용으로 확인 |
| **해석** | 여러 공식 기능을 제품·데이터 모델 관점에서 재구성한 결론 |
| **NoteNest 제안** | Notion의 동작을 참고해 NoteNest에 적용할 설계안 |
| **변동 가능** | 모델명, 가격, 한도, 베타 상태처럼 자주 바뀌는 항목 |

플랜 표기는 다음과 같다.

- `[전체]`: 모든 플랜에서 사용 가능
- `[Free]`, `[Plus+]`, `[Business+]`, `[Enterprise]`: 최소 요구 플랜
- `[조건부]`: 앱, 운영체제, 연결 계정, 관리자 설정 또는 지역 조건 존재
- `[Beta]`: 공개/비공개 베타 또는 단계적 배포
- `[종료 예정]`: 폐기 일정이 공식 발표됨

## 3. 문서 지도

| 문서 | 다루는 내용 |
| --- | --- |
| [01-product-map.md](./01-product-map.md) | 제품군, 핵심 엔터티, 화면 표면, 전체 기능 지도 |
| [02-account-identity-billing.md](./02-account-identity-billing.md) | 계정, 로그인, 보안, 알림, 플랜, 결제, 좌석 |
| [03-workspace-teamspace-permissions.md](./03-workspace-teamspace-permissions.md) | 조직, 워크스페이스, 팀스페이스, 역할, 공유, 권한 |
| [04-pages-blocks-collaboration.md](./04-pages-blocks-collaboration.md) | 페이지, 블록, 미디어, 협업, 오프라인, 버전, 템플릿, 위키 |
| [05-databases-views-automation.md](./05-databases-views-automation.md) | 데이터 소스, 속성, 보기, 폼, 차트, 버튼, 자동화 |
| [06-projects-trackers.md](./06-projects-trackers.md) | Projects, Tasks, My Tasks, Sprints, 의존성, 각종 트래커 |
| [07-calendar-meetings-mail.md](./07-calendar-meetings-mail.md) | DB 캘린더, Notion Calendar, 회의 기록, Mail 전환 |
| [08-ai-agents-search.md](./08-ai-agents-search.md) | AI, 검색, Connectors, Agent 계층, MCP, Workers |
| [09-design-ui-interactions.md](./09-design-ui-interactions.md) | IA, UI 구조, 메뉴, 편집 상호작용, 디자인과 모션 |
| [10-integrations-sites-security-admin.md](./10-integrations-sites-security-admin.md) | 연결, API, Sites, 분석, 보안, Enterprise 운영 |
| [11-notenest-gap-roadmap.md](./11-notenest-gap-roadmap.md) | NoteNest 현황 비교, 우선순위, 구현 순서와 데이터 모델 |
| [SOURCES.md](./SOURCES.md) | 주제별 공식 출처와 조사 기준 |

## 4. 가장 중요한 제품 구조

```text
Account
└── Organization
    └── Workspace
        ├── Members / Guests / Groups
        ├── Teamspaces
        │   └── Pages
        │       └── Blocks
        ├── Databases
        │   ├── Data sources
        │   ├── Properties
        │   ├── Views
        │   └── Items = Pages
        ├── Agents
        ├── Connections
        └── Admin policies
```

핵심 원칙은 다음과 같다.

1. **페이지가 기본 컨테이너다.** 문서, 데이터베이스, 대시보드, 위키, 공개 사이트까지 페이지 트리 위에 놓인다.
2. **블록이 편집 단위다.** 텍스트, 목록, 미디어, 임베드, 데이터베이스, 버튼 등 대부분의 콘텐츠가 블록이다.
3. **데이터베이스의 각 항목도 페이지다.** 행의 구조화 속성과 페이지 본문의 자유 블록을 동시에 가진다.
4. **보기는 데이터가 아니라 표현 설정이다.** 같은 데이터 소스를 테이블, 보드, 타임라인, 캘린더, 차트 등으로 다르게 본다.
5. **권한은 계층적으로 상속된다.** 워크스페이스, 팀스페이스, 페이지, 데이터베이스 및 일부 행 수준에서 상속과 예외가 겹친다.
6. **프로젝트 관리도 데이터베이스 조합이다.** Projects, Tasks, Sprints가 Relation, Rollup, Status, Date로 연결된다.
7. **AI는 독립 챗봇이 아니라 전 제품 표면에 삽입된다.** 검색, 쓰기, 데이터베이스 속성, 회의, 캘린더, 메일, 자동 실행 에이전트가 같은 권한 모델을 사용한다.

## 5. 혼동하기 쉬운 기능

| 이름 | 실제 구분 |
| --- | --- |
| Calendar view | Notion 데이터베이스의 날짜 기반 보기 |
| Notion Calendar | Google/Apple/Microsoft 일정과 Notion DB를 연결하는 별도 앱 |
| Meetings | 다가오는 회의, 회의 노트, AI Meeting Notes를 모은 Notion 상단 탭 |
| Inbox | 댓글, 멘션, 리마인더, 공유 초대 등 Notion 알림함 |
| Notion Mail | Gmail 기반 별도 받은편지함 제품. 2026-09-22 종료 예정 |
| Mail connection/tool | Agent가 Gmail/Outlook을 검색·초안·발송하는 연결. Mail 앱 종료와 별개 |
| Notion Agent | 사용자가 그때그때 요청하며 사용자의 권한으로 작동하는 개인 AI |
| Custom Agent | 별도 권한과 트리거를 가지고 백그라운드에서 반복 실행되는 공유 AI |
| External Agent | Claude/Cursor 같은 외부 에이전트를 Notion 작업 표면에 연결하는 기능 |
| AI Connector | Slack, Drive, Jira, Calendar 등 외부 내용을 Enterprise Search/AI 문맥으로 읽는 연결 |
| API connection | 토큰/OAuth로 페이지·블록·데이터 소스를 읽고 쓰는 개발자 연결 |

## 6. 실제 UI 관찰 범위

2026-08-10 macOS Notion 데스크톱 앱에서 다음 공개 구조를 확인했다. 개인 페이지 제목, 워크스페이스 이름, 회의 내용 등 사적인 데이터는 기록하지 않았다.

- 네이티브 탭 바, 뒤로/앞으로, 새 탭, 워크스페이스 전환
- 사이드바 상단의 Home, Chat, Meetings, Inbox, Search
- Recents, Agents, Private, Teamspaces의 계층형 섹션
- 하단 Library, My tasks, Marketplace, Notion Calendar, Help, Trash
- 페이지 상단 breadcrumb, 최종 편집 시각, Share, Copy link, Favorite, Actions
- 아이콘·커버·댓글 진입점과 블록 편집기
- 회의 노트의 Notes, 형식 선택, Start transcription, 동의 안내
- 화면 위에 항상 접근 가능한 AI 실행 버튼

## 7. 조사와 갱신 규칙

1. 기능 존재 여부는 공식 도움말을 우선한다.
2. 가격·한도는 공식 Pricing을 우선하고 기준일을 붙인다.
3. 최신 기능은 릴리스 노트와 Help Center가 충돌할 수 있으므로 두 출처를 병기한다.
4. 오래된 제품 소개 페이지보다 현재 Help Center를 우선한다.
5. 실제 계정 UI는 내비게이션과 작동 방식 확인에만 사용하고 사용자 콘텐츠는 수집하지 않는다.
6. NoteNest 제안은 사실과 분리해 [11-notenest-gap-roadmap.md](./11-notenest-gap-roadmap.md)에 모은다.

## 8. 완전성 체크리스트

- [x] 계정, 인증, 프로필, 알림, 플랜, 결제
- [x] 조직, 워크스페이스, 팀스페이스, 사용자 역할
- [x] 페이지, 블록, 편집기, 미디어, 공동 작업
- [x] 데이터베이스, 속성, 보기, 폼, 차트, 자동화
- [x] Projects, Tasks, My Tasks, Sprints, Dependencies
- [x] Calendar view, Notion Calendar, Meetings, AI Meeting Notes
- [x] Notion AI, Enterprise Search, Research Mode, Connectors
- [x] Notion Agent, Custom Agents, External Agents
- [x] Sites, Marketplace, 가져오기, 내보내기, API, MCP
- [x] 관리자, 감사, 분석, 보안, 보존, 컴플라이언스
- [x] 데스크톱/모바일 내비게이션, UI 패턴, 디자인, 모션
- [x] NoteNest 기능 격차와 단계별 적용 제안

