# 08. AI·검색·에이전트

## 1. AI 제품 지도

```text
Notion AI
├── Notion Agent
│   ├── Chat
│   ├── Instructions / Memory
│   ├── Skills
│   └── User-scoped tools
├── Enterprise Search
│   ├── Workspace search
│   ├── AI Connectors
│   └── Web search
├── Research Mode
├── Writing / translation / summary
├── Database AI
│   ├── Build with AI
│   ├── Autofill
│   └── Formula assistance
├── AI Meeting Notes
├── AI image generation/editing
├── Custom Agents
├── External Agents
└── Developer platform
    ├── Notion MCP
    ├── External Agent API
    ├── Agent SDK
    └── Workers
```

핵심은 AI가 별도 채팅 페이지에만 있지 않고 페이지 편집, 검색, 데이터베이스, 회의, 캘린더, 메일, 외부 연결에 공통으로 삽입된다는 점이다.

## 2. 플랜과 노출

- Free/Plus: 제한된 AI 체험
- Business/Enterprise: Notion Agent, AI Meeting Notes, Enterprise Search 계열
- Custom Agents: Business/Enterprise + 크레딧
- External Agents: Business/Enterprise, 공급자·베타 조건
- Enterprise: zero LLM data retention, 상세 관리자 통제, 감사·분석

기능은 Workspace owner가 전체 또는 사용자 그룹별로 끌 수 있고, web search, connector, external agent, model 사용도 정책 대상이다.

## 3. AI 진입점

- 상단 Chat/Chats with AI 탭
- 화면 floating AI 버튼
- `Shift+Cmd/Ctrl+J` 전역 AI
- 페이지에서 `Ask AI`
- 텍스트 선택 툴바
- 블록 `•••`
- `/AI`
- Database 생성/속성/Formula
- Search 결과
- Meetings
- Home
- Agent mention
- iOS의 Siri/Share sheet/Notion Agents 앱

진입점이 달라도 현재 페이지, 선택 텍스트, 첨부 파일, 검색 source 같은 문맥이 채팅으로 전달된다.

## 4. Notion Agent

Notion Agent는 **현재 사용자 권한으로 즉시 작업하는 개인 인터랙티브 AI**다.

### 4.1 권한

- 사용자가 볼 수 있는 페이지만 본다.
- 사용자가 편집할 수 있는 범위만 편집한다.
- 연결된 외부 source도 사용자 본인의 연결 권한을 따른다.
- 요청을 공유해도 수신자가 원본 source 권한을 자동 획득하지 않는다.

Custom Agent처럼 독립적인 서비스 계정 권한을 갖지 않는다.

### 4.2 할 수 있는 일

- Workspace 질문에 출처 인용 답변
- 웹 검색
- 여러 source 비교
- 페이지 생성·수정
- 문서 초안, 요약, 번역, 재작성
- Task/Project/Database 항목 생성·수정
- 기존 DB query/filter/sort와 분석
- 간단한 Database 생성
- 파일 읽기
- 스프레드시트, PDF, 슬라이드 등 다운로드 가능한 파일 생성
- Office 파일 읽기/쓰기 `[신규/조건부]`
- Calendar 일정 조회·생성·수정 `[연결 조건]`
- Gmail/Outlook 검색·초안·발송 `[연결/확인 조건]`
- 이미지 생성·편집
- Skills 실행

### 4.3 Chat

- 새 chat
- 이전 chat history
- chat pin
- 제목
- source 표시
- model 선택
- 첨부 파일
- 페이지/사람/DB mention
- 답변 citation
- 결과를 page로 저장
- 읽기 전용 공유 링크
- 후속 질문
- stop/regenerate

2026-04 릴리스는 AI 대화를 링크로 공유하는 기능을 추가했다. 공유된 chat과 실제 source 접근은 별개다.

### 4.4 Source 설정

- Current page
- 특정 page/DB
- Workspace 전체
- 연결 앱
- Web
- 첨부 파일

답변에는 어떤 source를 사용했는지 citation을 표시한다. source 범위를 좁히면 속도와 신뢰성이 높아질 수 있다.

### 4.5 Model

- Auto/Recommended
- 여러 공급자의 고급 모델

정확한 모델명은 자주 바뀐다. 2026년 공식 페이지에는 OpenAI, Anthropic, Google, xAI 등의 최신 모델이 수시로 교체되어 표시되므로 제품 요구사항에는 provider capability를 저장하고 모델명을 상수로 고정하지 않는다.

### 4.6 Personalization

- Agent 이름
- 외형/accessory
- 기본 instructions
- 개인 문맥용 pages
- memory

Instructions는 매번 적용되는 지속 규칙이고 Skills는 필요할 때 호출하는 재사용 작업 절차다.

### 4.7 대표 제한

공식 도움말이 현재 제한으로 명시하는 범주:

- PDF 외 Embed 내부 전체 읽기
- 고급 DB properties 일부
- Database automations
- Database templates
- Database layouts
- comments 작성/관리 일부
- sharing/permissions 변경
- AI Meeting Notes 녹취 시작
- reminders
- Workspace settings
- 다른 사람 일정 취소/일부 Calendar 작업
- 모바일에서 일부 일정 예약·취소

Agent 기능은 빠르게 확장되므로 UI가 실제 수행 가능 도구를 런타임에 표시해야 한다.

## 5. Skills

Skill은 Notion Agent가 반복 업무를 같은 절차로 수행하도록 만든 페이지 기반 명령이다.

### 5.1 기본 Skill

- Improve writing
- Proofread
- Explain
- Reformat

### 5.2 사용자 Skill

Skill 페이지에 다음을 기록한다.

- 목적
- 입력
- 단계
- 출력 형식
- 사용할 source
- 금지 사항
- 예시

### 5.3 실행

- Agent chat에서 `@skill`
- 텍스트 선택 후 Skill
- `/skill`
- 블록 메뉴
- Settings/Editor menu

Skill 페이지 자체를 공유하면 팀이 같은 절차를 재사용한다. 실행은 호출자의 권한을 따른다.

### 5.4 Instructions와 Custom Agent 비교

| 기능 | 적용 방식 | 권한 |
| --- | --- | --- |
| Instructions | 개인 Agent의 모든 요청에 지속 적용 | 사용자 |
| Skill | 필요할 때 호출 | 사용자 |
| Custom Agent | trigger에 따라 자율 실행 | Agent 독립 권한 |

## 6. 쓰기·편집 AI

### 6.1 텍스트 작업

- 초안 작성
- 계속 쓰기
- improve writing
- spelling/grammar
- shorten/lengthen
- tone 변경
- simplify/explain
- summary
- action items
- translate
- custom prompt
- 표/목록/문단 등 reformat

### 6.2 결과 적용

- Replace selection
- Insert below
- Continue chat
- Try again
- Copy
- Discard

원문을 덮어쓰기 전에 diff 또는 preview가 필요하며 undo 가능해야 한다.

### 6.3 AI blocks

페이지 안에 prompt와 결과를 저장하고 필요할 때 재실행하는 블록형 경험이 있다. source 변경과 재생성 결과가 문서의 확정 사실처럼 보이지 않도록 생성 시각과 prompt를 보존하는 것이 좋다.

## 7. Database AI

### 7.1 Build with AI

자연어로 다음을 생성·변경한다.

- Data source
- properties
- select/status options
- views
- filter/sort
- sample data

고급 Relation/Automation/Layout은 Agent 제한과 기능 상태에 따라 수동 보완이 필요하다.

### 7.2 Basic Autofill

`[Business+]`

- 각 item page 내용만 사용
- Summary
- Key info
- Translate
- Select/Multi-select 분류
- 수동 실행
- 생성/편집 시 실행

### 7.3 Custom Agent Autofill

- Workspace와 web source
- 여러 단계
- 여러 property를 한 번에 채움
- 조건
- 수동/생성/편집/예약 trigger
- Custom Agent credits 사용

### 7.4 Formula assistance

- 자연어에서 Formula 생성
- 오류 설명
- 기존 Formula 수정
- 속성 이름과 타입 반영

AI가 만든 Formula는 실제 sample rows와 empty/error case로 검증해야 한다.

## 8. AI 이미지

`[Business+]`

- 새 이미지 생성
- 기존 이미지 편집
- 이미지 블록에서 실행
- Agent chat에서 생성
- page cover/본문에 삽입

현재 도움말 기준 사용량 제한 예:

- 24시간에 약 10개
- 30일에 약 30개

한도는 변동 가능하다. Custom Agent가 아니라 Notion Agent에서 제공되는 기능으로 안내된다. 모바일은 chat 중심으로 범위가 제한될 수 있다.

## 9. Search 계층

### 9.1 Workspace Search

단축키: `Cmd/Ctrl+P` 또는 `Cmd/Ctrl+K`

- page/title/body
- DB item
- exact phrase with quotes
- creator
- Teamspace
- date
- in page/location
- sort: best match, last edited, created
- labels: Most viewed, Popular this week
- 최근 검색

댓글/discussion은 일반 index에 포함되지 않는다. 일부 `@mention`과 권한 없는 페이지는 검색되지 않는다.

### 9.2 Command Search

데스크톱 앱의 OS 전역 검색이다.

- 앱이 백그라운드여도 단축키
- page 검색
- 결과 열기
- link 복사
- 단축키 사용자 지정
- macOS menu bar/Windows taskbar 접근

### 9.3 Page Search

- `Cmd/Ctrl+F`
- 현재 페이지 텍스트
- 일치 수
- 다음/이전

### 9.4 Database Search

- 현재 DB의 Title과 property values
- page body 전체 검색과 다름

## 10. Enterprise Search

`[Business+ / Beta 조건]`

### 10.1 범위

- Notion pages
- Database items, properties, views, Relation
- 업로드 파일
- 연결된 외부 앱
- Web

### 10.2 질문

- 자연어 질의
- source mention
- 특정 Teamspace/page/사람 지정
- title/author/source filters
- 답변 citation
- source 열기

### 10.3 권한

- 각 source의 기존 권한을 존중한다.
- 사용자가 Slack private channel을 볼 수 없으면 검색 결과에도 나오지 않는다.
- Connector service account와 사용자 identity mapping 방식에 따라 결과 범위가 결정된다.
- 연결 해제·권한 변경 후 index 반영에 지연이 있을 수 있다.

### 10.4 색인

외부 source는 초기 sync와 증분 sync를 거친다. 공식 보안 문서는 일반적인 업데이트가 약 1시간 안에 반영될 수 있으나 큰 source는 더 오래 걸릴 수 있음을 안내한다.

## 11. AI Connectors

AI Connector는 외부 콘텐츠를 Notion에 복제하는 importer가 아니라 AI 검색·답변 source로 연결한다.

대표 공식 연결 범주:

- Slack
- Microsoft Teams
- Google Drive
- Microsoft SharePoint/OneDrive 계열
- Jira
- GitHub
- Linear
- Asana
- Zendesk
- Gmail
- Outlook
- Google/Notion Calendar

연결 목록과 플랜은 계속 확장되므로 Settings → Connections와 공식 Help의 현재 목록을 기준으로 한다.

### 11.1 일반 동작

1. Workspace owner 또는 사용자가 connection을 설치한다.
2. OAuth/admin consent를 완료한다.
3. 대상 workspace/project/channel/account를 선택한다.
4. 초기 index를 만든다.
5. 사용자 identity와 source permissions를 매핑한다.
6. Enterprise Search/Agent가 질문 때 source를 사용한다.
7. 답변 citation에서 원본으로 이동한다.

### 11.2 Connector와 synced database

| 연결 | 목적 |
| --- | --- |
| AI Connector | 검색과 답변, 원본 source citation |
| Synced database | 외부 객체를 Notion DB 행으로 표시·일부 양방향 편집 |
| Link preview | URL 하나를 rich preview |
| API connection | 앱이 Notion 객체를 읽고 씀 |

## 12. Research Mode

`[Business+]`

복잡하고 열린 질문에 여러 source를 탐색해 장문의 결과를 만든다.

- Notion workspace
- uploaded files
- AI Connectors
- Web
- DB query/filter/sort
- source citation
- 진행 상태
- 최대 약 10분 수준의 조사
- 결과를 page로 저장
- copy/export

적합:

- 시장/경쟁 조사
- 프로젝트 회고 종합
- 고객 피드백 패턴
- 정책 비교
- 분기 계획
- 회의와 문서에서 결정 추출

사용자는 source 범위, 최신성, 민감 정보, 사실과 추론을 검토해야 한다.

## 13. Custom Agents

Custom Agent는 **별도 권한, instructions, tools, triggers를 가진 공유형 자율 실행자**다.

```text
Custom Agent
├── identity
├── model
├── instructions
├── explicit Notion access
├── connections/tools
├── triggers
├── chat
├── activity logs
├── versions
├── sharing
└── credit limits
```

### 13.1 Notion Agent와 차이

| 항목 | Notion Agent | Custom Agent |
| --- | --- | --- |
| 실행 | 사용자가 chat으로 요청 | chat + schedule + event trigger |
| 권한 | 사용자 권한 | Agent에 명시된 독립 권한 |
| 공유 | 개인 중심, chat 공유 | 팀이 Agent 자체를 공유 |
| 백그라운드 | 제한적 | 핵심 기능 |
| 로그 | chat history | Activity와 Insights |
| 과금 | 플랜 AI | 별도 credits |

### 13.2 생성

- AI chat에서 목적 설명
- 공식 template
- Blank agent

설정 단계:

1. 이름과 설명
2. instructions
3. model
4. Notion page/DB access
5. web access
6. Slack/Mail/Calendar/MCP/Worker tools
7. triggers
8. confirmation와 write permissions
9. 공유
10. credit limit
11. test

### 13.3 Notion triggers

- Comment added
- Page added
- Property updated
- Page removed
- AI Meeting Note finished
- 대상 page/DB/view
- filter 조건

### 13.4 Schedule triggers

- daily
- weekly
- monthly
- yearly
- custom time/time zone

### 13.5 Slack triggers

- new message
- reaction
- `@mention`
- thread
- keyword/filter
- selected channels

### 13.6 Calendar triggers

- event created
- event updated
- event 시작 전/후 조건
- selected calendar

### 13.7 Mail triggers

- new mail
- sender/subject/label/category 조건
- selected account

### 13.8 Tools

- read/search Notion
- create/edit page
- create/edit DB item
- web search
- Slack read/write
- Mail read/modify/draft/send
- Calendar read/write
- MCP servers
- Workers

Instructions 안에 page URL을 쓰는 것만으로 접근 권한이 생기지 않는다. Access 설정에서 명시적으로 공유해야 한다.

### 13.9 Notion access

- specific pages
- specific databases
- all content shared with everyone
- explicit Teamspace/page scope

Agent는 실행을 유발한 사람의 권한이 아니라 자기 권한으로 동작한다. Slack channel의 제한 사용자가 Agent를 trigger해도 Agent가 넓은 page access를 가지고 있다면 결과를 통해 정보가 노출될 수 있다.

### 13.10 Connections 권한

연결마다:

- Read
- Modify
- Draft
- Send/Create/Update
- Require confirmation
- selected account/channel/calendar

최소 권한을 부여하고, 외부 발송·삭제·공개 작업에는 확인을 둔다.

### 13.11 Model

- Auto recommended
- 여러 공급자 모델

정확한 모델명은 릴리스마다 변한다. Agent 설정에는 model capability, cost, latency와 버전을 기록하고, 제거된 모델의 fallback을 정의해야 한다.

### 13.12 공유 권한

| 권한 | 동작 |
| --- | --- |
| Full access | 설정, access, trigger, 공유까지 관리 |
| Can edit | instructions/tool/일부 설정 편집 |
| Can view & interact | chat과 허용된 실행 |

채널 trigger는 Agent 자체를 직접 공유받지 않은 사용자가 유발할 수도 있으므로 출력 채널과 데이터 권한을 별도로 검토한다.

### 13.13 주요 탭

- Chat
- Activity
- Insights
- Settings

Activity:

- trigger
- 시작/종료 시각
- 실행 단계
- 사용 tools
- 생성/수정한 page
- errors
- credits

Insights:

- runs
- status
- trigger distribution
- model
- credits
- 성공/실패
- chat 목록
- CSV export, 최대 약 300 chats 범위 안내

### 13.14 Version과 duplicate

- 설정 version history
- 이전 version restore
- Agent duplicate
- 복제 시 이름, model, instructions, access, triggers 일부 유지
- connection credentials, Worker, activity, credit limit 등은 다시 설정될 수 있음

### 13.15 크레딧

- Workspace 공유 잔액
- 월간 reset
- add-on purchase
- on-demand
- Agent별 limit
- 복잡도·모델·도구에 따라 소비
- 부족하면 Agent pause
- Admin credit dashboard

2026-08-10 표시 가격은 $10/1,000 credits이나 변동 가능하다.

## 14. Custom Agent 보안

### 14.1 주요 위험

- Agent 권한이 호출자보다 넓음
- prompt injection이 외부 웹/메일/Slack에 포함
- 민감 page를 공개 channel에 요약
- 잘못된 대량 편집
- 외부 메일 발송/일정 생성
- 예상하지 못한 URL 접근
- 무한/과다 실행과 credit 소모

### 14.2 보호 기능

- 명시적 page access
- 연결별 read/write/confirmation
- settings transparency
- page share panel에 Agent 표시
- Activity log
- version restore
- Agent owner/editor 접근 확인
- 예상 밖 URL confirmation
- per-Agent credits
- Enterprise agent directory
- audit log/content search/AI analytics
- 생성/외부 Agent 관리자 정책

### 14.3 운영 원칙

1. 처음에는 read-only.
2. 특정 DB/Page만 공유.
3. 외부 발송은 draft + 사람 승인.
4. destructive action은 금지하거나 확인.
5. 결과를 private log DB에 먼저 기록.
6. 실패·중복 실행 idempotency.
7. 정기 권한 검토.
8. owner 퇴사 시 소유권 이전.

## 15. External Agents

`[Business+ / Beta]`

Notion 외부의 전문 agent를 Notion 작업 표면에 연결한다.

2026 공개 예:

- Claude Agents
- Cursor agent integration

동작:

- Notion task board에서 Agent에 업무 할당
- `@mention`
- 진행 상태 표시
- 결과를 Notion page/task에 기록
- 별도 Agent access
- credits/공급자 정책

Claude Agents는 Anthropic 인프라를 통해 호스팅되며 사용자가 별도 Anthropic API key를 넣는 방식이 아닐 수 있다. 웹 접근, 다른 Agent 호출 등은 제품 제한이 있다. Enterprise/HIPAA 환경은 관리자 활성화와 데이터 조건을 확인해야 한다.

## 16. Notion MCP

Notion MCP는 Claude, ChatGPT, Cursor 같은 외부 AI client가 실시간으로 Notion을 읽고 쓰도록 연결하는 표준 인터페이스다.

- user authorization
- 실제 사용자 권한
- pages/DB search, read, create, update
- 외부 client가 실행 주체
- Enterprise allowlist
- client별 차단/연결 해제
- audit event

Custom Agent가 외부 MCP server를 tool로 쓰는 것과, 외부 AI client가 Notion MCP로 Notion에 들어오는 것은 방향이 반대다.

## 17. Developer Platform

2026년 공개 상태:

| 기능 | 상태 | 목적 |
| --- | --- | --- |
| `ntn` CLI | Public beta | Notion 개발 작업과 배포 |
| Workers | Public beta | Agent가 호출하는 서버 측 코드/도구 |
| External Agents API | Private beta | 외부 Agent를 Notion에 통합 |
| Agent SDK | Private alpha | Agent 개발 프레임워크 |

Workers는 크레딧 대시보드에 사용량이 나타나며 베타 무료 기간과 향후 크레딧 과금 일정이 별도 안내되고 있다.

## 18. AI Meeting Notes

회의 녹취·요약·액션 아이템은 AI 제품군의 핵심이지만 캘린더/오디오/동의/보존 규칙이 중요하므로 [07-calendar-meetings-mail.md](./07-calendar-meetings-mail.md)에 상세히 정리했다.

## 19. 데이터·개인정보

공식 FAQ의 기본 원칙:

- 고객 데이터를 모델 학습에 사용하지 않으며 명시적 opt-in 예외를 둔다.
- source permissions를 존중한다.
- Enterprise는 zero data retention 조건을 제공한다.
- AI 공급자와 subprocessors 정보 공개
- feedback 데이터와 training 사용을 구분
- Connector index는 연결 해제 후 삭제 지연이 있을 수 있음
- Agent Activity/Audit로 실행 추적

AI 응답이 citation을 갖더라도 정확성을 보장하지 않는다. 중요한 법률·재무·인사·보안 결정은 사람이 원문을 확인해야 한다.

## 20. 상태와 UX

필요한 상태:

- Thinking
- Searching workspace/web/connector
- Reading sources
- Using tool
- Waiting for confirmation
- Editing page
- Completed
- Partial result
- Permission denied
- Connection expired
- Rate/credit limit
- Cancelled
- Failed with retry

UI 원칙:

- 사용 source와 tool을 숨기지 않는다.
- 쓰기 전 변경 대상을 preview한다.
- 여러 페이지 변경은 목록으로 요약한다.
- citation을 결과 문장 가까이에 둔다.
- 중단/취소가 가능해야 한다.
- 장기 실행은 background로 보내고 완료 알림을 준다.
- chat과 확정 문서를 시각적으로 구분한다.
- Agent 독립 권한을 사람처럼 share panel에 표시한다.

## 21. 주요 공식 출처

- [Notion AI FAQs](https://www.notion.com/help/notion-ai-faqs)
- [Notion Agent](https://www.notion.com/help/notion-agent)
- [Skills for Notion Agent](https://www.notion.com/help/skills-for-notion-agent)
- [Enterprise Search](https://www.notion.com/help/enterprise-search)
- [Research Mode](https://www.notion.com/help/research-mode)
- [Enterprise Search security](https://www.notion.com/help/enterprise-search-security-and-privacy-practices)
- [Autofill](https://www.notion.com/help/autofill)
- [Create and edit images with Notion AI](https://www.notion.com/help/create-and-edit-images-with-notion-ai)
- [Custom Agents](https://www.notion.com/help/custom-agents)
- [Custom Agent security](https://www.notion.com/help/custom-agents-security-features)
- [Custom Agent pricing](https://www.notion.com/help/custom-agent-pricing)
- [Connect Calendar to Custom Agents](https://www.notion.com/help/connect-calendar-to-custom-agents)
- [Connect Mail to Custom Agents](https://www.notion.com/help/connect-mail-to-custom-agents)
- [Notion MCP](https://www.notion.com/help/notion-mcp)
- [Developer Platform](https://www.notion.com/help/what-is-the-notion-developer-platform)
- [Claude Agents in Notion](https://www.notion.com/help/use-claude-agents-in-notion)
- [July 2026 release](https://www.notion.com/releases/2026-07-01)
