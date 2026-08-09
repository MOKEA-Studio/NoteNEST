# 10. 연결·Sites·보안·관리자

## 1. 연결 기능 분류

Notion의 “연결”은 하나의 기술이 아니다.

| 유형 | 데이터 방향 | 사용 표면 |
| --- | --- | --- |
| Embed | 외부 → 페이지 표시 | 블록 |
| Bookmark/link preview | 외부 URL 메타데이터 → 페이지 | 링크 |
| Link mention | 외부 객체의 짧은 rich link | 본문 |
| Native connection | 서비스별 기능 | Settings/페이지 |
| Synced database | 외부 객체 → Notion DB, 일부 양방향 | DB |
| AI Connector | 외부 source → AI index | Search/Agent |
| Importer | 일회성 외부 데이터 → Notion | Settings/Import |
| API connection | 외부 앱 ↔ Notion API | 개발자 통합 |
| Automation webhook | Notion action → 외부 HTTP | Button/Automation |
| API webhook | Notion event → 외부 subscriber | Developer API |
| Notion MCP | 외부 AI client ↔ Notion | AI client |
| Custom Agent connection | Agent ↔ Slack/Mail/Calendar/MCP | Agent tools |

기능 이름보다 방향, 동기화 지속성, 쓰기 가능 여부, 권한 주체를 확인해야 한다.

## 2. Embeds·Bookmarks·Link previews

### Embed

- URL을 페이지 안의 인터랙티브 block으로 표시
- 서비스의 로그인·공개 설정을 따름
- Notion 권한과 외부 서비스 권한이 모두 필요할 수 있음
- offline에서 내용이 로드되지 않음

### Bookmark

- 제목
- 설명
- favicon
- thumbnail
- 원본 URL

### Link preview/mention

- 연결한 Jira/GitHub/Drive 등의 객체를 rich preview로 표시
- 사용자별 OAuth가 필요할 수 있음
- 원본 권한이 없으면 세부 내용이 보이지 않음

지원 서비스는 Marketplace/Connections에서 계속 변한다.

## 3. Native connections

대표 범주:

- Slack
- GitHub
- Jira
- Google Drive
- Figma
- Asana
- Trello
- Microsoft Teams
- Zoom
- 기타 Marketplace integrations

기능 예:

- Slack page 알림, link unfurl, search/Agent source
- GitHub pull request/issue link preview와 synced database
- Jira project/work item sync
- Drive file picker/preview와 AI Connector
- Figma embed/preview
- Calendar conferencing

하나의 서비스가 link preview, synced database, AI Connector를 모두 제공할 수 있으며 각각 별도 설치·권한이다.

## 4. 연결 관리

### 4.1 사용자

- Settings → Connections
- 계정 연결/해제
- OAuth 재인증
- page에 connection 추가
- 연결된 workspace/account 선택
- 개인 연결 상태 확인

### 4.2 Workspace owner

- 허용된 connection
- 설치 요청 승인
- public integration 제한
- 전체 사용자 연결 끊기
- AI Connector 구성
- synced database 초기 관리자 연결
- webhook/MCP 정책

### 4.3 Enterprise

- connection allowlist/deny
- workspace별 정책
- 외부 계정 연결 감사
- MCP client allowlist
- 보안·컴플라이언스 연결
- 조직 정책 잠금

## 5. Synced databases

### 5.1 일반 모델

```text
External system
     │ webhook + resync
     ▼
Notion synced data source
├── mapped properties
├── Notion-only properties
├── views
├── relations/rollups
└── AI/search
```

### 5.2 기능

- 외부 프로젝트/issue/PR 등을 row로 가져옴
- 기본 view 생성
- property mapping
- Notion filter/sort/group/chart
- Relation/Rollup/AI
- identity mapping
- sync status
- reconnect

### 5.3 Jira 예

두 계층이 있다.

- Jira connection: link preview, mention, legacy sync, 사용자 token
- Jira Sync: 관리자 API token, 여러 project, 더 안정적인 sync

Jira Sync:

- Workspace owner + Jira admin 초기 설정
- projects와 work items DB
- webhook 실시간 업데이트
- 놓친 이벤트를 active view에서 일일 resync
- comments/attachments 일부 sync
- Enterprise two-way sync
- 편집자는 개인 Jira 인증 필요
- Notion과 Jira 권한 모두 존중

중요 위험:

- private Jira project를 접근 넓은 Notion page에 sync하면 Notion page 권한자에게 보일 수 있다.
- sync source 권한과 Notion page 권한을 모두 검토해야 한다.

## 6. Public API

### 6.1 객체

- Block
- Page
- Database
- Data source
- View
- Comment
- File/File upload
- User
- Parent
- Emoji/icon
- Link preview unfurl attributes

### 6.2 Endpoint 범주

- Authentication
- Blocks
- Pages
- Databases
- Data sources
- Views
- Comments
- File uploads
- Search
- Users
- Custom emojis

### 6.3 인증

- Internal connection token
- Public OAuth access token
- Personal access token, 정책 허용 시

Bearer token과 HTTPS를 사용한다. Base URL은 `https://api.notion.com`이다.

### 6.4 Capability

- read content
- update content
- insert content
- read comments
- insert comments
- user information
- 기타 endpoint별 범위

Capability가 있어도 대상 page/data source가 connection에 공유되지 않으면 접근할 수 없다.

### 6.5 API 규칙

- REST/JSON
- resource UUID
- snake_case
- ISO 8601 date
- version header
- cursor pagination
- rate limits
- archived/in_trash 상태
- nullable value 처리

2026 API는 Data source와 View endpoint를 제공하며 오래된 Database schema endpoint 일부는 deprecated 경로로 남아 있다. integration은 명시한 API version에 맞춰 migration해야 한다.

### 6.6 Pagination

- `start_cursor`
- `page_size`, 최대 100
- `has_more`
- `next_cursor`

큰 DB는 page 단위 반복과 rate-limit backoff가 필요하다.

### 6.7 File uploads

- upload 생성
- binary part 전송
- page/block/property에 연결
- 상태 조회
- 크기·형식·만료 URL 처리

### 6.8 Webhooks

지원 이벤트 범주:

- Pages
- Databases
- Data sources
- Comments
- File uploads
- Views

흐름:

1. connection 설정에서 HTTPS webhook URL과 event type 등록
2. verification token 수신
3. 설정 UI에서 token으로 구독 검증
4. event POST 수신
5. `X-Notion-Signature` HMAC-SHA256 검증
6. event의 entity ID로 최신 객체 조회

일부 `page.content_updated` 이벤트는 중복 감소를 위해 약간 지연·집계된다. consumer는 중복과 순서 역전을 견디고 idempotent해야 한다.

## 7. Automation webhook과 API webhook

| 기능 | 방향 | 구성자 | 용도 |
| --- | --- | --- | --- |
| Send webhook action | Notion → 지정 URL | Button/Automation 사용자 | 한 workflow의 POST |
| Integration webhook | Notion → subscriber | 개발자 | Workspace 객체 이벤트 |

Send webhook은 범용 API client가 아니며 인증·재시도·관찰성에 한계가 있다. 중요한 시스템은 API connection과 서명 검증 webhook을 사용한다.

## 8. Import

지원 파일:

- TXT
- Markdown
- DOCX
- CSV
- HTML
- PDF
- ZIP

지원 앱 importer 대표:

- Confluence
- Asana
- Evernote
- Trello
- Monday.com 등

기능:

- Settings → Import
- slash command
- 여러 파일
- In progress/Complete
- 대상 Private/Teamspace/기존 DB
- property mapping

제약:

- desktop/web만
- 복잡한 CSS/script/embed/comments/history 손실
- 앱별 크기·개수·rate limit
- 큰 import 분할
- 실패 재시도와 mapping 검증

## 9. Export와 백업

### 9.1 페이지/Workspace export

- HTML
- Markdown + CSV
- PDF `[플랜/범위 조건]`
- files 포함
- subpages 포함
- folders for subpages
- current/default DB view

### 9.2 제약

- 모든 DB views를 한 번에 export하지 못함
- Relation/Formula/permissions/comments/history가 완전 왕복되지 않음
- 큰 export는 이메일 download link
- Windows의 긴 path 문제
- Enterprise/Teamspace policy가 export 차단 가능

### 9.3 복구 층

- automatic cloud backup
- Trash
- Page history
- support snapshot
- export archive
- API backup
- Enterprise retention/legal hold

## 10. Notion Sites

Sites는 Page를 공개 웹사이트로 배포하는 층이다.

```text
Workspace page
├── Publish
├── Site domain / slug
├── navigation
├── appearance
├── SEO/share preview
├── analytics
└── subpage visibility
```

### 10.1 게시

- Share → Publish
- 즉시 공개 URL
- page update가 site에 반영
- database view와 item page 공개
- subpages 기본 공개, 개별 제한 가능
- search engine indexing
- duplicate as template
- unpublish

### 10.2 도메인

- `notion.site` domain
- Free 1개, 유료 5개
- custom slug
- homepage 지정
- custom domain add-on
- 한 workspace에 최대 25 custom domains 범위 안내

### 10.3 디자인

- System/Light/Dark
- favicon
- header
- breadcrumbs
- search
- navigation pages
- Notion watermark 표시 조건
- share preview image/title/description
- SEO title/description

Notion Sites의 디자인 자유도는 범용 website builder보다 제한적이며 page content와 일관성을 우선한다.

### 10.4 분석

- Google Analytics 연결 `[유료]`
- page/site analytics
- search indexing

### 10.5 보안

- 공개 page의 하위 page 확인
- DB item visibility
- creator/contributor metadata
- private source와 linked DB
- public form
- Enterprise publish policy

### 10.6 한도

- site 수 자체는 폭넓게 허용
- notion.site domain 수는 플랜별
- custom domains 유료 add-on
- 고급 customization은 paid

## 11. Marketplace

### 11.1 콘텐츠

- Templates
- Connections/integrations
- Creator profiles
- Solutions/services partners
- categories
- search
- ratings/usage 정보

### 11.2 Template 흐름

- preview
- `Start with this template`
- 대상 Workspace
- Private로 duplicate
- 모든 블록/DB 편집
- creator가 공개 page와 duplicate 허용
- Marketplace 제출

### 11.3 연결 설치

- provider
- permissions/capabilities
- OAuth
- Workspace 선택
- admin approval
- install/uninstall
- support contact

## 12. 보안 기본

공식 보안 프로그램이 설명하는 원칙:

- HTTPS/TLS 전송 보호
- 저장 데이터 보호
- least privilege
- 정기 access review
- 내부 MFA
- logging/SIEM
- IDS/IPS
- 보안 평가와 독립 감사
- incident response
- 직원의 고객 데이터 접근 제한

지원·복구 목적의 고객 데이터 접근에는 승인과 추적이 필요하다.

## 13. 인증·프로비저닝

### 13.1 Domain management

- 이메일 domain verification
- domain claim
- managed users 식별
- 다른 Workspace ownership transfer 요청
- 외부 Workspace 참가/계정 변경 정책

### 13.2 SAML SSO

`[Business+]`

- IdP metadata
- test mode
- enforce
- verified domain
- owner bypass
- Enterprise Workspace 접근에 SAML authorization 요구 가능

### 13.3 SCIM

`[Enterprise]`

- user create/update/deactivate
- group sync
- role mapping
- owner/membership_admin/member/restricted_member
- Guest는 SCIM provisioning 대상 아님

### 13.4 Session

- 모든 기기 로그아웃
- session duration
- password reset
- suspend/reactivate
- managed user deletion

## 14. 데이터·컴플라이언스 통제

### 14.1 Audit log

이벤트 범주:

- Page
- Data source
- Workspace
- Account
- Teamspace
- Form
- Connection
- Agent/AI 관련 이벤트

필터:

- actor
- event
- date
- page/audience
- IP/device 등 제공 필드

기능:

- 검색
- export
- 조사
- SIEM stream

Page audience는 Private/Internal/External/Public로 분류될 수 있다.

### 14.2 Content search

Workspace owner가 public/private를 포함한 Workspace content를 조사한다.

- title/content
- creator
- page
- export
- 감사 이벤트

일반 사용자 Search와 다르며 법무·보안·관리 목적이다.

### 14.3 Data retention

- Trash 보존
- page/version 보존
- custom retention rule
- 최소/최대 기간
- 삭제 스케줄
- 정책 우선순위

Custom retention은 `[Enterprise]`이며 일반 사용자의 삭제가 즉시 물리 삭제를 의미하지 않게 할 수 있다.

### 14.4 Legal holds

- 특정 사용자/콘텐츠를 삭제 정책에서 보존
- 조사/소송 목적
- hold 대상과 custodian
- release
- 감사

### 14.5 IP restrictions

- 허용 IP/CIDR
- Workspace 접근 제한
- 예외와 잠금 위험
- 모바일/재택/VPN 고려

### 14.6 Network control

- 기업 네트워크에서 허용 Workspace 제한
- 개인 Workspace 사용 차단
- 도메인/조직 경계 강화

### 14.7 DLP/SIEM

- audit event 실시간 webhook stream
- 외부 SIEM 경보·대시보드
- DLP policy와 탐지
- page audience와 export/public share 감시
- Drata 등 compliance connection

## 15. Workspace Analytics

### 15.1 Users

- active users
- member/guest
- page creation/edit/view
- adoption

### 15.2 Content

- pages created
- views
- active content
- stale content
- public/shared content
- export

### 15.3 Teamspaces

- members
- activity
- content volume
- owner/access

### 15.4 Search

- query volume
- successful/unsuccessful searches
- popular terms
- knowledge gaps

### 15.5 AI/Agents

- usage
- runs
- credits
- Agent status
- model/tool distribution
- export

Analytics는 개인 평가가 아니라 제품 채택·지식 건강·보안 운영 목적을 명확히 해야 한다.

## 16. 관리자 설정 IA

```text
Organization
├── General
│   ├── organization info
│   ├── workspaces
│   └── policy locks
├── People
│   ├── members
│   ├── guests
│   ├── groups
│   └── managed users
├── Security
│   ├── domains
│   ├── SAML
│   ├── SCIM
│   ├── sessions
│   ├── IP/network
│   └── connections/MCP/AI
├── Data & compliance
│   ├── audit log
│   ├── content search
│   ├── retention
│   ├── legal holds
│   └── DLP/SIEM
├── Analytics
└── Credits
```

관리 화면은 카드 갤러리보다 table, filter, tabs, bulk action 중심의 운영 도구여야 한다.

## 17. 기기 배포

Enterprise 운영 기능:

- macOS package 배포
- Windows installer/deployment
- Microsoft Intune iOS/Android
- 자동 업데이트 정책
- desktop app version 요구
- Calendar/Meeting의 OS permission 가이드

## 18. 컴플라이언스

공식 Security/Trust 자료에서 확인되는 대표 인증·프로그램:

- SOC 2 Type II
- ISO 27001
- ISO 27701
- ISO 27017
- ISO 27018
- GDPR 관련 개인정보 보호 체계
- HIPAA 대상 플랜/계약 조건

인증 보유가 고객의 규정 준수를 자동 보장하지 않는다. 데이터 분류, 권한, retention, BAA/계약과 지역 조건을 조직이 별도로 구성해야 한다.

## 19. 연결·보안 상태

필요한 UI:

- Connected
- Syncing
- Re-authentication required
- Permission changed
- Sync failed
- Paused
- Disconnected
- Admin blocked
- Token expiring/expired
- Webhook verified/unverified
- Last successful sync
- Source count

관리자는 누가 설치했고, 어떤 data access가 있으며, 마지막 사용이 언제인지 확인할 수 있어야 한다.

## 20. 주요 공식 출처

- [Connections](https://www.notion.com/help/category/connections)
- [Add & manage connections](https://www.notion.com/help/add-and-manage-connections-with-the-api)
- [Embeds, bookmarks & link mentions](https://www.notion.com/help/embed-and-connect-other-apps)
- [Connect Jira](https://www.notion.com/help/jira)
- [Import & export](https://www.notion.com/help/category/import-export-and-integrate)
- [Import data](https://www.notion.com/help/import-data-into-notion)
- [Back up your data](https://www.notion.com/help/back-up-your-data)
- [Public API reference](https://developers.notion.com/reference/intro)
- [API webhooks](https://developers.notion.com/reference/webhooks)
- [Public pages & publishing](https://www.notion.com/help/public-pages-and-web-publishing)
- [Customize Notion Sites](https://www.notion.com/help/edit-and-customize-your-notion-sites)
- [Manage Notion Sites](https://www.notion.com/help/manage-your-notion-sites)
- [Sites pricing](https://www.notion.com/help/notion-sites-availability-and-pricing)
- [Enterprise admin](https://www.notion.com/help/category/enterprise-admin/all)
- [Security practices](https://www.notion.com/help/security-and-privacy)
- [Audit log](https://www.notion.com/help/audit-log)
- [Workspace analytics](https://www.notion.com/help/workspace-analytics)
- [Custom data retention](https://www.notion.com/help/custom-data-retention-settings)
- [Security & compliance integrations](https://www.notion.com/help/add-security-and-compliance-integrations)
