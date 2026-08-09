# 05. 데이터베이스·보기·자동화

## 1. 데이터베이스 정신 모델

Notion 데이터베이스는 스프레드시트처럼 보이지만 각 행이 완전한 페이지인 콘텐츠 시스템이다.

```text
Database page
├── title / icon / description
├── data source A
│   ├── schema = properties
│   ├── records = page items
│   └── templates
├── data source B (optional)
└── views
    ├── layout
    ├── source
    ├── visible properties
    ├── filter
    ├── sort
    ├── group / subgroup
    └── conditional color
```

핵심 구분:

- **Database**: 페이지 위에 놓이는 컨테이너와 보기 집합
- **Data source**: 실제 스키마와 항목을 가진 데이터 집합
- **Item**: 데이터 소스의 한 레코드이면서 동시에 Page
- **Property**: 항목의 구조화된 필드
- **View**: 같은 항목을 보는 표현·질의 설정

2026년 Public API도 Database, Data source, View를 독립 객체로 다룬다.

## 2. 생성 형태

### 2.1 Full-page database

- 사이드바에 독립 페이지로 존재
- 제목, 아이콘, 커버, 공유 권한을 가짐
- 큰 업무 시스템의 원본 데이터 소스로 적합

### 2.2 Inline database

- 일반 페이지 본문 안의 블록
- 위아래에 설명, 문서, 다른 DB를 함께 배치
- 필요하면 full page로 열 수 있음

### 2.3 Linked view

- 기존 Data source를 다른 페이지에 보여주는 보기
- 원본 항목과 스키마는 동일
- filter/sort/group/visible properties는 연결된 보기마다 다르게 구성 가능
- 원본 권한을 우회하지 않음

### 2.4 Multiple data sources

- 하나의 Database 컨테이너에 여러 Data source를 연결할 수 있다.
- 서로 다른 스키마의 데이터를 한 표면에서 탐색할 수 있다.
- Data source별 원래 권한이 유지된다.
- 같은 컨테이너에 넣었다고 접근 권한이 합쳐지지 않는다.
- Data source 단위로 개별 접근 권한을 새로 설정하는 것이 아니라 원본 권한을 따른다.

## 3. 데이터베이스 항목

각 항목은 다음 두 층을 동시에 가진다.

```text
Item page
├── properties panel
│   ├── Status
│   ├── Assignee
│   ├── Date
│   └── ...
└── free-form block body
    ├── text
    ├── images/files
    ├── comments
    ├── subpages
    └── embedded databases
```

### 3.1 항목 열기

- Side peek: 목록을 유지하며 오른쪽 패널
- Center peek: 화면 중앙 modal-like peek
- Full page: 완전한 페이지

View별 기본 열기 방식을 설정할 수 있다. 사용자는 peek에서 full page나 새 탭으로 확장할 수 있다.

### 3.2 항목 명령

- Rename
- Duplicate
- Copy link
- Move to
- Edit properties
- Change icon/cover
- Open in side/center/full page
- Add comment
- View history
- Delete

### 3.3 빠른 편집

- Table cell에서 직접 값 편집
- Board card를 열 사이로 drag해 그룹 속성 변경
- Calendar/Timeline에서 drag해 Date 변경
- Person/Select/Status popover로 값 선택
- Multi-select에서 여러 tag 추가
- 파일을 Files & media cell에 drop

## 4. 속성 전체 카탈로그

데이터 소스당 속성은 최대 500개다.

| 속성 | 값과 동작 | 대표 용도 |
| --- | --- | --- |
| Title | 모든 DB에 하나, 페이지 제목 | 식별자 |
| Text | rich text | 설명, 주소, 메모 |
| Number | 숫자와 표시 형식 | 비용, 점수, 퍼센트, 진행률 |
| Select | 단일 옵션 | 유형, 우선순위 |
| Status | To-do/In progress/Complete 그룹의 단일 상태 | 워크플로 상태 |
| Multi-select | 여러 옵션 | 태그, 기술, 카테고리 |
| Date | 날짜/시간/범위/시간대/리마인더 | 기한, 일정 |
| Person | 사용자 또는 그룹 | 담당자, 검토자 |
| Files & media | 여러 파일/이미지 | 첨부, 썸네일 |
| Checkbox | boolean | 승인, 완료 플래그 |
| URL | URL | 외부 링크 |
| Email | 이메일 | 연락처 |
| Phone | 전화번호 | 연락처 |
| Formula | 다른 속성으로 계산 | 파생 값 |
| Relation | 다른/같은 Data source 항목 연결 | 프로젝트-태스크 |
| Rollup | Relation 대상 값을 집계 | 진행률, 합계 |
| Created time | 자동 생성 시각 | 감사/정렬 |
| Created by | 자동 생성자 | 제출자 |
| Last edited time | 자동 변경 시각 | 신선도 |
| Last edited by | 자동 편집자 | 책임 추적 |
| Button | 행 문맥의 액션 실행 | 완료, 승인, 알림 |
| Unique ID | 자동 증가 ID + prefix | TASK-123 |
| Place | 장소 이름/주소/좌표 | Map view |

AI Autofill은 독립 저장 타입이라기보다 기존 Text/Select/Multi-select 등의 값을 AI로 채우는 구성이다.

## 5. 옵션과 색

### 5.1 Select/Multi-select

- 옵션 이름 생성·변경
- 색상 선택
- drag로 순서 변경
- 삭제
- cell/카드에서 새 옵션 즉시 생성
- 이름 검색
- Multi-select는 여러 태그 chip을 표시

태그 색은 의미 체계로 사용한다.

예:

- Priority: red=urgent, yellow=medium, gray=low
- Area: blue=product, green=engineering, purple=design
- Status는 색만이 아니라 그룹과 텍스트를 함께 사용

같은 태그 이름의 색은 속성 내부 옵션에 귀속된다. 다른 데이터베이스의 “Design” 태그는 별도 옵션이다.

### 5.2 Status

- To-do
- In progress
- Complete

세 상위 그룹 안에 사용자 정의 상태를 여러 개 둔다.

예:

```text
To-do: Backlog, Ready
In progress: In progress, In review, Blocked
Complete: Done, Won't do
```

상위 그룹은 보드 섹션, 완료 판정, 스프린트 미완료 처리에 사용된다.

### 5.3 Conditional color

View별로 조건에 따라 항목 전체 또는 특정 셀에 색을 적용한다.

지원되는 대표 기준:

- Select
- Multi-select
- Status
- Title/Text
- Number
- Date
- Person
- Checkbox
- Formula
- Relation/Rollup

Table은 행 전체 또는 속성 셀만 색칠할 수 있고, Calendar/Timeline/List/Board/Feed 등은 카드·항목 배경으로 사용한다. 조건부 색은 데이터 자체가 아니라 View 설정이다.

## 6. Date와 시간

- 날짜 하나
- 시작/종료 범위
- 시간 포함
- 시간대
- Reminder
- Calendar/Timeline 표시 기준
- Formula와 날짜 계산

날짜가 없는 항목은 Calendar/Timeline에서 별도 “No date” 영역이나 미표시 상태로 관리한다. 여러 Date 속성이 있으면 View가 사용할 기준 속성을 선택한다.

## 7. Relation과 Rollup

### 7.1 Relation

- 다른 Data source 연결
- 같은 Data source 자기 참조
- 한 방향 또는 양방향 관계
- 연결 항목 수 제한 가능
- 역관계 속성 이름 설정
- Relation popover에서 항목 검색/생성

예:

```text
Projects 1 ── N Tasks
Tasks    N ── 1 Sprint
People   1 ── N Objectives
Issues   N ── N Releases
```

### 7.2 Rollup

Relation을 따라 대상 속성을 가져오거나 집계한다.

일반:

- Show original
- Show unique values
- Count all/values/unique/empty/not empty
- Percent empty/not empty

Number:

- Sum
- Average
- Median
- Min
- Max
- Range

Date:

- Earliest
- Latest
- Date range

제한:

- 접근할 수 없는 Relation 대상은 권한을 넘어 노출하면 안 된다.
- Rollup의 Rollup을 다시 Rollup하는 방식은 지원되지 않는다.
- 복잡한 계산은 Formula에서 Relation list를 다루거나 별도 중간 속성을 사용한다.

## 8. Formula

Formula는 속성·상수·함수를 조합해 항목별 파생 값을 계산한다.

### 8.1 값 유형

- String
- Number
- Boolean
- Date
- Person/Page list
- Empty/null-like value

### 8.2 연산 범주

- 산술: add, subtract, multiply, divide, mod, pow
- 비교: equal, unequal, greater/less
- 논리: and, or, not, if/ifs
- 문자열: format, concat, replace, contains, split, slice, length
- 날짜: now, today, dateAdd, dateSubtract, dateBetween, formatDate
- 리스트: map, filter, find, some, every, unique, flat, sort, first, last
- 숫자: round, ceil, floor, min, max, abs, sqrt
- 스타일: style과 링크/표현 관련 함수
- Person/Page 속성 접근

### 8.3 편집기

- 속성 이름 자동 완성
- 함수 도움말과 인자 표시
- 구문 강조
- 결과 preview
- 오류 메시지
- AI에게 수식 작성/수정 요청

Formula는 보안 경계가 아니다. 결과에 접근 제한 데이터가 섞이지 않도록 원본 Relation 권한을 존중해야 한다.

## 9. 보기 공통 설정

각 View는 다음 설정을 가진다.

- Name
- Layout
- Data source
- Property visibility/order
- Filter
- Sort
- Group
- Sub-group
- Conditional color
- Open pages in
- Load limit/표시 밀도 관련 옵션
- Copy link to view
- Duplicate/Rename/Delete

### 9.1 Filter

- AND/OR 중첩 조건
- 속성 타입별 연산자
- Relative date
- Current user
- Empty/not empty
- Relation 포함 여부
- 사용자용 임시 필터와 `Save for everyone`

### 9.2 Sort

- 여러 기준 우선순위
- Ascending/Descending
- drag로 정렬 우선순위 변경
- 수동 순서와 속성 정렬의 관계

### 9.3 Group/Sub-group

- 속성 값별 섹션/열
- 빈 그룹 숨기기
- 그룹 순서 변경
- 그룹 접기
- Board에서 column, Table/List에서 section
- 하위 그룹으로 2차 축 구성

### 9.4 Properties

- 보기마다 표시/숨김
- 순서 변경
- 카드/행에서 노출 방식
- Gallery/Board 카드 미리보기
- Table의 열 너비와 wrap

## 10. 보기 전체 카탈로그

### 10.1 Table

행과 열 중심의 가장 조밀한 보기다.

- inline cell editing
- 열 추가·이름 변경·타입 변경
- 열 drag/reorder/resize
- 행 drag/reorder
- row height/wrap 관련 표시 설정
- property별 filter/sort
- group과 sub-group
- 하단 calculate
- conditional color를 행 또는 셀에 적용
- 여러 행 선택과 일괄 작업

적합: 원본 데이터 관리, 대량 입력, 속성 비교.

### 10.2 Board

속성 그룹을 열로 보여주는 Kanban 보기다.

- Status/Select/Person 등으로 group
- 카드 drag로 속성 변경
- 열 안 새 카드 생성
- 열 접기/숨기기/순서
- sub-group으로 swimlane
- 카드 preview: none/page cover/page content/files
- 카드 속성 표시
- 완료 그룹 숨기기

적합: 작업 상태, 영업 단계, 콘텐츠 파이프라인.

### 10.3 Timeline

Date 범위를 가로축에 표시한다.

- 시간부터 연 단위까지 scale
- Today로 이동
- 항목 막대를 drag/resize해 날짜 변경
- 왼쪽 table과 타임라인 동시 표시
- 기준 Date 속성 선택
- Relation 기반 dependency arrow
- group
- alternate date plot
- 계산과 속성 표시

적합: 프로젝트 로드맵, 캠페인, 출시 계획, 리소스 일정.

### 10.4 Calendar

Date 속성을 월/주 달력에 표시한다.

- Month/Week
- 날짜 셀에서 생성
- drag로 날짜 변경
- 범위 항목 stretch
- 표시 Date 속성 전환
- 카드 속성 표시
- 월요일 시작 설정
- 모바일은 일별 목록 중심으로 축소

적합: 콘텐츠 캘린더, 마감 일정. 별도 Notion Calendar 앱과 다르다.

### 10.5 List

페이지 제목 중심의 가벼운 세로 목록이다.

- 최소한의 속성
- section group
- 빠른 스캔
- 페이지 트리보다 구조화된 필터/정렬

적합: 문서 인덱스, 간단한 목록, 위키.

### 10.6 Gallery

이미지 미리보기 중심의 카드 격자다.

- Card preview: cover/content/files/none
- 카드 크기
- image fit
- 표시 속성
- 카드 재정렬

적합: 디자인 자산, 레시피, 포트폴리오, 인물 디렉터리.

### 10.7 Chart

`[Free 1개, 유료 무제한]`

지원 표현:

- Vertical bar
- Horizontal bar
- Line
- Donut
- Number

설정:

- X/Y 축 또는 group 기준
- Count, Sum, Average 등 aggregation
- 색과 데이터 색 기준
- label, legend
- line smooth/gradient
- data point 클릭으로 원본 항목 탐색
- PNG export

차트는 원본 데이터를 편집하는 표면이 아니라 분석 보기다. 일부 property/aggregation 조합은 지원되지 않는다.

### 10.8 Form

모든 플랜에서 데이터베이스에 연결된 입력 화면을 만든다.

### Builder

- title, description
- icon, cover
- 질문 = DB property
- 질문 표시 label을 property 이름과 분리
- required
- helper description
- short/long answer
- select를 list/dropdown으로 표시
- max selection
- 질문 순서
- conditional logic `[Business+]`

### Submission settings

- 워크스페이스 내부 공유
- 공개 웹 링크
- 응답 받기/닫기
- 익명 응답
- 제출 후 confirmation text
- 버튼 색/텍스트
- 응답자에게 사본 이메일
- Notion branding 제거 `[유료]`

### Responses

- 각 제출이 DB item
- Table에서 응답 확인
- filter/sort/chart
- automation으로 담당/알림/상태 지정
- 응답 권한과 원본 DB 권한 분리
- Form view 자체 export는 지원되지 않음

적합: 버그 신고, 요청 접수, 설문, 채용, 리드.

### 10.9 Dashboard

`[Business+]`

- 하나 이상의 Data source View를 widget으로 배치
- 기존 View 또는 새 View
- 한 행 최대 4 widget
- 전체 최대 12 widget
- 크기 조절, 재배치, 복제, 삭제
- Edit/View mode
- 로컬 filter 후 `Save for everybody`
- Notion Agent로 초안 생성·개선

적합: 임원 현황, 팀 운영, 프로젝트 포트폴리오. 중첩 card UI보다 큰 작업 표면 안에 독립 widget을 배치하는 구조다.

### 10.10 Feed

- 카드가 세로로 이어지는 소셜/뉴스 피드형 보기
- 본문/미디어 중심 preview
- 댓글
- post view
- 속성 표시와 필터/정렬

적합: 회사 공지, 업데이트, 블로그형 내부 소통.

### 10.11 Map

Place 속성을 지도 pin으로 표시한다.

- Place: 이름, 주소, 현재 위치
- pan/zoom
- pin 선택 시 item 열기
- 기준 Place 속성 전환
- filter/sort
- 한 번에 최대 100개 항목 표시

적합: 지점, 출장, 행사, 부동산, 고객 위치.

## 11. Database layout

Layout은 DB 항목 페이지의 속성 배치를 정의하며 모든 항목에 공통 적용된다.

- 상단에 중요한 property pin
- Details panel
- property group/section
- 섹션 이름
- 속성 순서와 가시성
- 댓글/본문 주변 배치

View별 카드 설정과 다르게 Layout은 해당 Database의 모든 item page에 적용된다. 개별 항목마다 다른 layout을 갖는 방식이 아니다.

## 12. Database templates

### 12.1 포함 내용

- property 기본값
- icon/cover
- 본문 블록
- 하위 페이지
- 관련 DB/체크리스트/설명

### 12.2 사용

- `New` 옆 template menu
- 기본 template 지정
- 새 항목에 선택 적용
- template 편집/복제/삭제

### 12.3 Repeating template

- Daily
- Weekly
- Monthly
- Yearly
- 지정 시각/요일

중첩 반복 템플릿은 제한이 있으며 일반적으로 최대 3단계 수준과 일간 템플릿 안의 추가 반복 제한을 고려해야 한다.

## 13. Sub-items

- 항목 안에 자식 항목
- 부모/하위 항목 relation을 자동 생성
- table/list/timeline에서 Parents only, Parents and sub-items, Sub-items only
- board/calendar/gallery는 부모 중심 표시 제약
- 부모를 이동/복제/삭제할 때 하위 트리 처리
- rollup으로 하위 진행률 계산

프로젝트의 phase/task 또는 task/subtask에 사용한다.

## 14. Dependencies

- 같은 Tasks DB의 self-relation
- Blocking/Blocked by 양방향 의미
- Timeline에 화살표
- 선행 작업 날짜 이동 시 후속 작업 조정

날짜 이동 모드:

- Shift only when dates overlap
- Maintain time between items
- Do not automatically shift

주말을 피하도록 설정할 수 있다. 순환 의존성, 날짜 없는 항목, 다중 선행 작업은 별도 오류/경고가 필요하다.

## 15. Database buttons

`[전체]`, 일부 액션은 유료 또는 연결 조건이 있다.

### 15.1 실행 권한

- 생성/편집: 일반적으로 Can edit 이상
- 클릭: Can edit content 이상
- 액션 대상 페이지에 대한 실제 권한도 필요

### 15.2 액션

- Edit properties
- Add page to
- Edit pages in
- Open page/URL
- Show confirmation
- Show notification
- Send Gmail
- Send Slack notification
- Send webhook
- Define variables

여러 액션을 순서대로 묶을 수 있다. 행의 현재 속성, 클릭한 사용자, 날짜 같은 문맥 변수를 사용한다.

## 16. Database automations

`[Plus+]`. Free는 템플릿 사용이나 제한된 Slack 알림 등 일부만 가능하며 편집은 제한된다.

### 16.1 Trigger

- Page added
- Property edited
- 값 조건
- Every day/week/month 등 recurring schedule
- 여러 조건의 Any/All

짧은 시간 안의 여러 변경은 약 3초 수준의 평가 창에서 묶일 수 있다. Recurring trigger는 다른 이벤트 trigger와 조합 제약이 있다.

### 16.2 Action

- Edit property
- Add page
- Edit pages
- Send notification, 한 실행에서 최대 20명 수준
- Send Gmail
- Send Slack
- Send webhook

Formula, mention, trigger page, person/date 변수로 동적 값을 만든다.

### 16.3 중요 규칙

- Automation이 만든 변경은 다른 Automation을 연쇄 trigger하지 않는다.
- 사용자가 누른 Button의 변경은 Automation을 trigger할 수 있다.
- 반복 template 생성은 Automation trigger 동작에 제한이 있다.
- Guest는 Automation을 만들 수 없다.
- Full access가 필요한 구성 변경과 Can edit content 실행을 구분한다.
- 실패 상태, 마지막 실행, 재시도, 권한 오류를 로그로 보여줘야 한다.

## 17. Webhook actions

Button/Database button/Automation이 외부 HTTPS endpoint로 POST를 전송한다.

- `[유료]`
- URL
- JSON-like body와 변수
- 실행 확인
- 성공/실패 상태
- 인증 헤더를 임의로 구성하는 범용 통합 API와는 다름

개발자 API Webhooks는 반대 방향이다. Notion의 페이지/DB 변화 이벤트를 외부 앱이 구독한다. 두 기능을 혼동하지 않아야 한다.

## 18. 검색

### Database search

- 주로 Title과 property 값
- 현재 DB 범위
- 빠른 item 찾기
- 페이지 본문의 전체 블록 텍스트는 Workspace Search가 담당

### Workspace search

- DB item의 본문과 제목까지 전역 검색
- Creator, Teamspace, Date 등 필터

댓글과 discussion은 일반 Workspace index 대상이 아니다.

## 19. 권한

- Full access: schema, view, permissions
- Can edit: schema/view와 content
- Can edit content: item/property 값, schema/view는 잠김
- Can create: 타인 항목 없이 새 item 제출
- Can comment/view
- Business+ page-level access
- Linked view는 원본 권한 준수
- Filter는 보안이 아님
- API/Agent도 원본 Data source 접근 권한 필요

## 20. 성능·한도·상태

| 항목 | 기준일 한도/주의 |
| --- | --- |
| Properties | Data source당 최대 500 |
| Dashboard widgets | 전체 12, 행당 4 |
| Map items | 한 번에 100 |
| My Tasks sources | 최대 10 |
| Offline DB | 첫 View의 첫 50 rows |
| Chart | Free 1, 유료 무제한 |
| Automation notifications | 한 액션 최대 약 20명 |

필요한 상태:

- Loading/skeleton
- Empty database
- No filter results
- No permission
- Syncing/Sync failed
- Automation running/failed
- Offline partial data
- Archived/deleted source
- Schema changed while editing

## 21. 주요 공식 출처

- [Intro to databases](https://www.notion.com/help/intro-to-databases)
- [Database properties](https://www.notion.com/help/database-properties)
- [Relations & rollups](https://www.notion.com/help/relations-and-rollups)
- [Formula syntax](https://www.notion.com/help/formula-syntax)
- [Views, filters & sorts](https://www.notion.com/help/views-filters-and-sorts)
- [Data sources & linked databases](https://www.notion.com/help/data-sources-and-linked-databases)
- [Database templates](https://www.notion.com/help/database-templates)
- [Layouts](https://www.notion.com/help/layouts)
- [Charts](https://www.notion.com/help/charts)
- [Forms](https://www.notion.com/help/forms)
- [Dashboards](https://www.notion.com/help/dashboards)
- [Feeds](https://www.notion.com/help/feeds)
- [Maps](https://www.notion.com/help/maps)
- [Database buttons](https://www.notion.com/help/database-buttons)
- [Database automations](https://www.notion.com/help/database-automations)
- [Webhook actions](https://www.notion.com/help/webhook-actions)
- [Notion API](https://developers.notion.com/reference/intro)
