# 06. 프로젝트·태스크·스프린트·트래커

## 1. Tracker의 정체

Notion에는 고정된 “Tracker 앱” 하나가 따로 있는 것이 아니다. 데이터베이스 원시 기능 위에 다음 구성을 표준화한 **Projects 제품 경험**이 있다.

```text
Projects DB 1 ───── N Tasks DB
                         │
                         N
                         │
                         1
                    Sprints DB

My Tasks = 여러 Tasks DB의 개인 담당 항목 집계
```

Issue tracker, bug tracker, 요청 트래커, 콘텐츠 파이프라인, CRM도 같은 구성 요소를 다른 스키마·보기·자동화로 조합한 업무 앱이다.

## 2. 시작 템플릿

대표 시작점:

- To-do list: 단일 Tasks DB
- Projects & tasks: 두 개의 Relation된 DB
- Projects, tasks & sprints: 세 개의 DB
- Product roadmap
- Issue/bug tracker
- Content calendar
- CRM/sales pipeline
- Objectives & key results
- Request form + triage board

템플릿은 DB와 속성, 보기, 필터, Relation, Rollup, 페이지 템플릿을 함께 만든다. 사용자는 이후 모든 구성을 바꿀 수 있다.

## 3. Tasks 데이터 모델

Task database로 인식되려면 핵심적으로 다음 속성이 필요하다.

- Status
- Assignee
- Due date

권장 전체 스키마:

| 속성 | 타입 | 용도 |
| --- | --- | --- |
| Task | Title | 작업 이름 |
| Status | Status | Backlog/Ready/In progress/Review/Done |
| Assignee | Person | 책임자 |
| Due | Date | 마감/기간 |
| Project | Relation → Projects | 소속 프로젝트 |
| Sprint | Relation → Sprints | 실행 주기 |
| Parent task | Self relation | 하위 작업 |
| Dependencies | Self relation | 선행/후행 |
| Priority | Select | Urgent/High/Medium/Low |
| Type | Select | Task/Bug/Story/Chore |
| Estimate | Number/Select | 크기 또는 포인트 |
| Reporter | Person/Created by | 요청자 |
| Team | Select/Relation | 담당 팀 |
| Labels | Multi-select | 분류 |
| Created/Edited | 자동 속성 | 추적 |
| ID | Unique ID | TASK-123 |

Task 본문에는 문제 설명, 수용 조건, 체크리스트, 첨부, 댓글, 관련 링크를 자유 블록으로 기록한다.

## 4. Projects 데이터 모델

권장 스키마:

| 속성 | 타입 | 용도 |
| --- | --- | --- |
| Project | Title | 프로젝트 이름 |
| Status | Status | Planned/Active/At risk/Done |
| Owner | Person | 단일 책임자 |
| Team | Select/Relation | 담당 조직 |
| Timeline | Date range | 시작/종료 |
| Tasks | Relation → Tasks | 작업 목록 |
| Progress | Rollup/Formula | 완료 task 비율 |
| Health | Select | On track/At risk/Off track |
| Priority | Select | 포트폴리오 우선순위 |
| Goal | Relation | 상위 목표/OKR |
| Last update | Date | 최신 상태 보고 |
| Dependencies | Relation | 다른 프로젝트 의존성 |

Project item 본문 템플릿:

1. Overview
2. Problem / Goal
3. Success metrics
4. Scope / Out of scope
5. Milestones
6. Linked Tasks view
7. Timeline
8. Decisions
9. Risks
10. Updates / Retrospective

구조화 속성과 서술 문서를 같은 페이지에 결합하는 것이 Notion Projects의 핵심이다.

## 5. Projects 보기

### Portfolio table

- 모든 프로젝트
- Owner, Status, Health, Timeline, Progress
- 팀/분기 filter
- Priority sort

### Board by status

- Planned, Active, Complete
- drag로 상태 변경
- Health/Priority 표시

### Timeline/Roadmap

- Project Date range
- 팀 또는 목표로 group
- 의존성 화살표
- 기간 drag/resize
- 분기/월/주 scale

### Gallery

- 프로젝트 cover/icon
- 요약과 owner
- 시각적 포트폴리오

### Dashboard

- 상태별 프로젝트 수
- 지연 작업
- 팀별 부하
- 최근 업데이트
- 리스크

## 6. Tasks 보기

### All tasks

- 조밀한 Table
- 대량 편집
- 모든 속성 검색·필터

### Board

- Status column
- Assignee/Project/Priority 카드 속성
- drag로 workflow 전환

### By assignee

- Person으로 group
- 업무량 비교
- 미할당 섹션

### Calendar

- Due date
- drag로 기한 이동
- 무기한 작업 별도 처리

### Timeline

- 기간 작업과 dependency
- 프로젝트/담당자 group

### My tasks

- 현재 사용자 담당만 filter
- Overdue, Today, Upcoming
- Board/Calendar layout

### Backlog

- Sprint가 없고 완료되지 않은 작업
- Priority/Estimate 정렬
- 다음 Sprint로 drag

## 7. My Tasks

My Tasks는 사이드바와 Home에서 개인의 업무를 집계하는 전용 표면이다.

### 7.1 데이터 소스

- 최대 10개의 Task database를 연결한다.
- 각 DB에 Status, Assignee, Due date 매핑이 필요하다.
- 여러 Teamspace의 작업을 한 화면에 모은다.
- 중앙 집중형 Task DB를 쓰면 관리가 단순해진다.

### 7.2 화면

- 전체 My Tasks page
- Home widget
- Sidebar entry
- Board/Calendar 등 layout
- filter/sort
- 속성 inline edit
- quick create

### 7.3 기본 섹션

- Overdue
- Today
- Upcoming
- No due date
- Completed 또는 숨김

필터를 바꾸면 팀원의 task도 볼 수 있지만 원본 DB 권한을 넘어가지는 않는다.

## 8. Sub-items

하위 작업은 Tasks DB의 자기 Relation을 제품 UI로 감싼 기능이다.

- Parent 아래 child task tree
- child도 독립 상태·담당자·기한·페이지
- Table/List/Timeline에서 계층 펼침
- Parents only / Parents and sub-items / Sub-items only
- Board/Calendar/Gallery는 부모 중심 표시 제약
- 부모 drag/move 시 subtree 동작
- 부모 duplicate 시 하위 복제 선택
- 부모 delete 시 child 처리 확인
- Rollup으로 child 완료율 계산

완료 규칙은 팀이 결정해야 한다. 자식이 모두 완료되면 부모를 자동 완료할지, 부모 상태를 독립 유지할지 Automation/Formula로 구성한다.

## 9. Dependencies

### 9.1 의미

- Blocking: 이 Task가 먼저 끝나야 하는 대상
- Blocked by: 이 Task가 의존하는 선행 작업
- Timeline arrow로 방향 표시

### 9.2 날짜 자동 이동

| 모드 | 동작 |
| --- | --- |
| Shift only when dates overlap | 선후 일정이 충돌할 때만 후속 이동 |
| Maintain time between items | 기존 간격을 유지하며 연쇄 이동 |
| Do not automatically shift | 경고만 하고 날짜를 바꾸지 않음 |

주말 제외 옵션을 사용할 수 있다.

### 9.3 예외

- 순환 dependency
- 여러 선행 작업의 충돌
- 날짜 없는 Task
- 완료된 Task 이동
- parent/sub-item와 dependency 혼합
- 다른 프로젝트/스프린트 간 dependency

UI는 자동 이동 전 영향받는 작업 수와 새 날짜를 보여주는 것이 안전하다.

## 10. Sprints

### 10.1 활성화

Task DB에서 Sprints를 켜면 다음이 만들어진다.

- Sprints database
- Task ↔ Sprint Relation
- Current Sprint board
- Sprint planning view
- Backlog view

### 10.2 Sprint 데이터

| 속성 | 용도 |
| --- | --- |
| Name/Number | Sprint 식별 |
| Date range | 시작/종료 |
| Status | Current/Next/Past |
| Tasks | Relation |
| Completed | Rollup |
| Velocity | Formula/Rollup |
| Goal | Sprint 목표 |

### 10.3 계획 흐름

1. Backlog에서 후보 task를 정리한다.
2. Priority와 Estimate를 검토한다.
3. 다음 Sprint로 task를 배정한다.
4. Sprint goal과 기간을 정한다.
5. 시작하면 Current Sprint 보기로 전환한다.
6. 상태를 업데이트하고 blocker를 관리한다.
7. 종료 시 완료율과 미완료 항목을 검토한다.
8. 미완료 항목을 다음 Sprint나 Backlog로 이동한다.

### 10.4 자동 Sprint

- 일정한 주기로 새 Sprint 생성
- 이름/번호 자동 증가
- 기간 자동 계산
- 현재/다음/과거 상태 이동
- 미완료 Task 처리 규칙

팀 휴일, 비정상적으로 짧은 Sprint, 일정 변경은 수동 보정이 필요하다.

## 11. Roadmap

Roadmap은 별도 엔터티가 아니라 Projects 또는 Features DB의 Timeline view다.

일반 구성:

- Item/Project
- Status
- Owner/Team
- Date range
- Priority
- Product area
- Release
- Dependencies
- Progress

보기:

- Now / Next / Later board
- Quarter timeline
- Team swimlane
- Release calendar
- Detail table

공개 로드맵은 Sites로 게시할 수 있으나 내부 코멘트, 민감 속성, 하위 페이지 공개를 검토해야 한다.

## 12. Issue·Bug tracker

권장 스키마:

- ID
- Title
- Type
- Status
- Severity
- Priority
- Assignee
- Reporter
- Component
- Environment
- Steps to reproduce
- Expected/Actual
- Attachments
- Related project/release
- Created/resolved dates

흐름:

```text
New → Triage → Planned → In progress → In review → Done
                └──────────────→ Duplicate / Won't fix
```

Form으로 외부/내부 버그를 받고, Automation으로 ID·담당 팀·초기 상태·알림을 지정한다.

## 13. Request tracker

### 13.1 입력

- 공개/워크스페이스 Form
- Button
- 이메일/Slack 연결
- API
- Agent

### 13.2 스키마

- Request
- Requester
- Category
- Priority
- Status
- Owner
- Due/SLA
- Related customer/team
- Attachments
- Decision/reason

### 13.3 권한

- Form 응답자는 원본 DB를 보지 않는다.
- `Can create` 사용자는 타인의 요청 없이 새 행만 추가한다.
- Page-level access로 요청자 본인 건만 보여줄 수 있다.
- 운영팀은 Can edit content, 관리자만 schema/full access를 갖는다.

## 14. 다른 Tracker 패턴

| 유형 | 핵심 DB/속성 |
| --- | --- |
| Content pipeline | Content, Channel, Stage, Publish date, Owner |
| CRM | Companies, Contacts, Deals, Stage, Value |
| Recruiting | Candidates, Roles, Interview stage, Score |
| Asset tracker | Asset, Owner, Location, Condition, Files |
| OKR | Objectives, Key results, Owner, Progress |
| Decision log | Decision, Status, Date, Decider, Context |
| Risk register | Risk, Likelihood, Impact, Mitigation, Owner |
| Learning tracker | Course/Book, Status, Rating, Notes |
| Expense tracker | Amount, Category, Date, Receipt, Approval |
| Incident tracker | Severity, Commander, Timeline, Root cause |

모두 Page + Property + Relation + View + Automation 조합이다.

## 15. Intake와 Triage

```text
Form / Email / Slack / API
        ↓
New request
        ↓ automation
ID + default status + route + notify
        ↓
Triage view
        ↓
Accept / Need info / Reject / Duplicate
        ↓
Project, Sprint, Assignee
```

Triage 화면은 다음을 우선한다.

- 새 항목 수
- 미할당
- SLA 초과
- 중복 가능성
- 필수 정보 누락
- 긴급도

Agent는 분류·요약·중복 후보·담당 추천을 도울 수 있지만 권한·승인 규칙 없이 자동 폐기하면 안 된다.

## 16. 자동화 예시

### Task 생성

- Page added → Status=Backlog
- Priority=Urgent → 팀 리드에게 알림
- Assignee set → 담당자 Inbox 알림

### 상태

- Status=Done → Completed date=Now
- Status=Blocked → Project owner에게 Slack
- 모든 sub-item 완료 → 부모 상태 제안

### 기한

- Due가 오늘이고 미완료 → 담당자 알림
- Overdue → Priority/Health 변경
- Dependency 이동 → 후속 날짜 조정

### Sprint

- Sprint 시작 → Current로 변경
- Sprint 종료 → 미완료를 다음 Sprint/Backlog로 이동
- 회고 페이지 생성

### Request

- Form response → Unique ID + owner routing
- Category별 Team 지정
- 승인 버튼 → Task/Project 생성
- 거절 버튼 → 상태·사유·요청자 알림

## 17. 보고와 분석

- 완료율: Rollup + Formula
- Project progress: 완료 Tasks / 전체 Tasks
- Velocity: Sprint별 완료 estimate
- Cycle time: 시작부터 완료까지
- Lead time: 생성부터 완료까지
- Overdue count
- Workload by assignee
- Health distribution
- Burndown은 Formula/Chart 또는 외부 도구로 구성
- Dashboard widget으로 Projects/Tasks/Requests 통합

Chart는 스냅샷 분석에 적합하지만 고급 시계열·누적 흐름·정교한 애자일 보고는 외부 BI/API가 필요할 수 있다.

## 18. Tracker UI 원칙

- 작업명보다 Status, Assignee, Due가 빠르게 보인다.
- 상세 페이지를 열지 않고 핵심 속성을 수정한다.
- card drag 결과가 즉시 속성 변화로 보인다.
- 생성 위치가 기본 상태·Sprint·Date를 채운다.
- 필터가 보안처럼 오해되지 않게 권한과 분리한다.
- empty state는 “새 Task” 같은 직접 행동을 제공한다.
- loading, sync, automation, offline 상태가 데이터와 겹치지 않는다.
- board column과 timeline row는 안정된 크기로 레이아웃 점프를 막는다.
- 아이콘 버튼에는 tooltip을 제공한다.
- 대량 이동/완료/삭제는 undo 또는 확인을 제공한다.

## 19. 주요 공식 출처

- [Getting started with projects and tasks](https://www.notion.com/help/guides/getting-started-with-projects-and-tasks)
- [Task databases and My Tasks](https://www.notion.com/help/guides/give-your-to-dos-a-home-with-task-databases)
- [Sprints](https://www.notion.com/help/sprints)
- [Tasks and dependencies](https://www.notion.com/help/tasks-and-dependencies)
- [Timelines](https://www.notion.com/help/timelines)
- [Forms](https://www.notion.com/help/forms)
- [Dashboards](https://www.notion.com/help/dashboards)
- [Database automations](https://www.notion.com/help/database-automations)
