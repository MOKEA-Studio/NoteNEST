# 07. 캘린더·회의·메일

## 1. 세 가지 “캘린더” 구분

| 이름 | 위치 | 데이터 원본 | 목적 |
| --- | --- | --- | --- |
| Database Calendar view | Notion 페이지/DB | Date property | DB 항목을 달력으로 보기 |
| Notion Calendar | 별도 웹/데스크톱/모바일 앱 | Google, Apple, Microsoft + Notion DB | 실제 일정 통합 관리 |
| Meetings | Notion 상단 탭/Home | Calendar event + Meeting note | 다가오는 회의와 AI 노트 |

추가로 Calendar AI Connector는 일정 내용을 Notion AI 검색 문맥으로 제공하며, Calendar tool은 Agent가 일정을 조회·생성·수정하는 기능이다.

## 2. Database Calendar view

### 2.1 요구 조건

- Data source에 Date property가 하나 이상 있어야 한다.
- 여러 Date가 있으면 어떤 속성을 달력 기준으로 쓸지 선택한다.
- 날짜가 없는 항목은 달력 바깥에서 관리하거나 새 날짜로 drag한다.

### 2.2 기능

- Month view
- Week view
- 날짜 셀에서 item 생성
- 카드 drag로 날짜 이동
- Date range stretch
- 표시 property 선택
- filter, sort, group, conditional color
- 카드 클릭 시 side/center/full page
- 월요일/일요일 시작 설정

### 2.3 모바일

- 좁은 화면에서 월 전체 카드보다 선택한 날의 일별 목록을 강조한다.
- drag보다 날짜 picker 편집이 중심이다.
- 데스크톱의 다중 속성 카드가 축약된다.

### 2.4 용도

- 콘텐츠 발행일
- 프로젝트 마감
- 출장/행사
- 학습 계획
- CRM follow-up

Database Calendar는 외부 캘린더의 참석자, RSVP, 화상회의, availability를 완전히 대체하지 않는다.

## 3. Notion Calendar 제품

`[전체]` 별도 앱이며 Notion 계정과 외부 캘린더 계정을 연결한다.

### 3.1 지원 계정

- Google Calendar / Google Workspace
- Apple iCloud Calendar
- Microsoft Outlook / Microsoft 365

여러 계정을 연결할 수 있다. 공식 도움말은 성능을 위해 약 5개 계정/캘린더 연결을 실용적 상한으로 안내하는 부분이 있으므로 많은 계정은 표시 범위를 조절해야 한다.

### 3.2 플랫폼

- Web
- macOS
- Windows
- iOS
- Android

데스크톱은 메뉴 바, 전역 단축키, 회의 참여, 일정 컨텍스트가 강하고 모바일은 빠른 확인·생성·RSVP에 집중한다.

## 4. Calendar 정보 구조

```text
Notion Calendar
├── Accounts
│   └── Calendars
├── Calendar grid
├── Events
├── Notion database items
├── Scheduling links
├── Availability
├── Time zones
└── Settings / conferencing
```

### 4.1 왼쪽 사이드바

- Calendar account
- account 안의 calendar 목록
- show/hide checkbox
- color
- drag reorder
- default calendar
- teammate calendars
- Notion database calendars
- scheduling/availability 진입점

### 4.2 중앙 그리드

- Day/Week/Month 또는 앱이 제공하는 기간 전환
- 현재 시각 indicator
- all-day 영역
- 시간 grid
- event 겹침 layout
- drag create
- drag move
- resize duration
- zoom/day count
- 여러 시간대 축

### 4.3 이벤트 상세 패널

- Title
- Calendar/account
- Start/end
- All day
- Repeat
- Participants
- RSVP
- Location
- Conferencing
- Description
- Attached Notion page/meeting note
- Visibility
- Notifications
- Delete/duplicate/copy link

## 5. 일정 생성과 편집

### 5.1 생성

- 시간 grid drag
- 날짜/시간 클릭
- New event 단축키
- Notion Agent
- Scheduling link booking
- 외부 Google/Apple/Microsoft Calendar
- Notion DB item

### 5.2 일정 타입

- Event
- Focus
- Out of office
- Birthday 등 연결 공급자가 지원하는 특수 유형

### 5.3 반복 일정

- daily/weekly/monthly/yearly
- custom interval
- 특정 요일
- 종료 없음/날짜/횟수
- 이번 일정만/이후 일정/전체 시리즈 편집

공급자별 반복 규칙과 모바일 편집 범위가 다를 수 있다.

### 5.4 참석자

- 이메일 검색·추가
- required/optional 성격은 공급자에 따라 표시
- RSVP: Yes/No/Maybe
- 참석자 상태
- 메모와 변경 알림
- 공개/비공개 일정

### 5.5 회의 링크

- Google Meet
- Zoom connection
- Microsoft Teams
- Webex 등 stable custom conferencing URL
- 기본 conferencing provider 지정

## 6. 여러 계정과 캘린더

- 개인·회사 계정을 한 화면에 겹쳐 본다.
- 각 Calendar를 색으로 구분한다.
- 계정/Calendar를 숨기거나 다시 표시한다.
- 생성 기본 Calendar를 정한다.
- Outlook delegated calendar를 조건부 지원한다.
- 이벤트 이동 시 다른 Calendar/Account로 바꿀 수 있다.
- 권한이 read-only인 공유 Calendar는 편집할 수 없다.

색만으로 계정을 구분하지 않고 제목·계정 이름·아이콘도 함께 보여줘야 한다.

## 7. Notion 데이터베이스 연결

### 7.1 연결 방식

- Date property가 있는 Notion Data source를 Calendar에 추가
- 사용자 단위 연결
- 관리자가 모든 멤버에게 일괄 연결하는 방식은 아님
- 최소 Can view 필요
- 생성·편집에는 Can edit content 이상 필요

### 7.2 동작

- DB item을 Calendar event처럼 표시
- drag/resize로 Date 수정
- item page 열기
- 새 DB item 생성
- 연결된 property 표시
- 특정 DB를 기본 Calendar처럼 사용할 수 있음

### 7.3 권한

- Calendar 앱이 원본 Notion 권한을 우회하지 않는다.
- 접근을 잃으면 일정도 사라지거나 읽을 수 없다.
- DB의 page-level access가 있으면 행별 노출도 달라진다.

### 7.4 Embed 제한

Notion Calendar 전체를 Notion 페이지에 live embed하는 기능은 없다. Google Calendar의 view-only embed 등은 일반 Embed로 가능하지만 Notion Calendar 앱과 동일한 편집 경험은 아니다.

## 8. Home과 Upcoming

Notion Home에는 다가오는 일정을 표시하는 Upcoming 영역이 있다.

- 여러 Calendar account 선택
- 오늘/다가오는 회의
- 이벤트에서 Meeting note 열기/생성
- `New AI note`
- 일정 링크/참여
- 개인 설정

Home은 Calendar 전체 대체가 아니라 작업 시작 전 오늘의 일정과 문서를 연결하는 요약 표면이다.

## 9. Availability와 Scheduling

### 9.1 Availability

- 주간 반복 가능 시간
- 특정 날짜 예외
- 여러 Calendar의 busy 충돌 반영
- 시간대
- 회의 전후 buffer
- 최소 사전 예약 시간
- 최대 예약 가능 범위

### 9.2 Scheduling link

- One-off 또는 reusable
- 회의 제목과 설명
- duration
- 여러 가능한 시간
- location/conferencing/phone
- expiration
- 참석자 질문
- single/multiple booking
- cancel/reschedule

### 9.3 흐름

1. 주최자가 가능한 시간을 만든다.
2. Calendar conflict를 자동 제외한다.
3. 링크를 공유한다.
4. 상대가 시간대에 맞춰 slot을 선택한다.
5. 양쪽 Calendar에 event를 만든다.
6. conferencing와 참석자 알림을 붙인다.
7. 필요하면 reschedule/cancel한다.

## 10. Time zones

- 여러 시간대를 동시에 표시
- label 지정
- 순서 변경
- primary time zone
- 여행 중 임시 time zone
- event 원본 time zone 유지
- 키보드로 시간 계산/탐색

시간대를 바꿀 때 “절대 시각 유지”와 “벽시계 시간 유지”가 다르므로 반복 일정·Date property 편집에서 명시해야 한다.

## 11. 팀 일정

- Google Workspace 등 조직 디렉터리에서 teammate calendar 찾기
- teammate schedule 표시/고정
- 사람을 grid로 drag해 1:1 일정 생성
- 공통 빈 시간 탐색
- 팀별 Calendar visibility

공유 Calendar 권한과 개인 event visibility를 존중한다. private event는 시간만 busy로 보일 수 있다.

## 12. Calendar 설정

### General

- weekends
- declined events
- week numbers
- week start
- navigation
- meeting context
- language
- time format
- time zone
- location
- theme
- launch at startup

### Layout

- 표시 일 수
- grid zoom
- all-day 영역
- sidebar

### Notifications

- desktop/mobile
- event별 reminder
- Calendar별 알림
- 메뉴 바

### Conferencing

- default provider
- Zoom 연결
- custom conferencing link
- 회의 참여 동작

### Accounts/Workspaces

- 연결·해제
- 기본 account/calendar
- Notion Workspace 연결
- 기본 Meeting notes database

## 13. Calendar AI Connector

`[Beta/조건부]`

- 사용자의 Calendar 일정을 Notion AI 검색 문맥에 연결한다.
- 사용자별 연결이며 원본 일정 권한을 따른다.
- 일반적으로 Notion 계정 primary email과 Calendar 계정 매칭 조건이 있다.
- 이벤트 제목, 시간, 설명, 참석자 등 검색 가능한 내용을 질문에 사용한다.
- 새/수정 event가 색인되기까지 즉시에서 약 30분 정도 걸릴 수 있다.
- 첨부 파일은 지원 범위 밖일 수 있다.
- 연결 해제 후 동기화 데이터 삭제에는 최대 약 24시간이 걸릴 수 있다.

AI Connector는 Calendar 편집 도구가 아니다. 읽기/검색 문맥과 Agent의 Calendar tool을 분리해야 한다.

## 14. Meetings 탭

2026 데스크톱 UI의 상단 전역 탭 중 하나다.

- Upcoming meetings
- 과거 Meeting notes
- Calendar 연결
- 검색/필터
- 새 AI Meeting Note
- 회의 note database
- 녹취 상태와 결과

Home의 Upcoming은 요약, Meetings는 회의 기록 업무의 전체 표면이다.

## 15. AI Meeting Notes

`[Business+]`, 일부 클라이언트·기기·베타 조건이 있다.

### 15.1 생성 진입점

- 페이지에서 `/meet`
- Home의 Upcoming event
- Meetings 탭
- Notion Calendar event
- 새 AI note 버튼
- Meeting notes template

### 15.2 페이지 구조

```text
Meeting note
├── linked Calendar event
├── attendees / date metadata
├── Notes / agenda written before meeting
├── transcript
├── AI summary
├── action items
├── speaker labels
└── source audio (recorder-local conditions)
```

### 15.3 녹취 시작

1. 회의 노트를 연다.
2. format/template을 선택한다.
3. 참석자 동의를 확보한다.
4. `Start transcription`을 누른다.
5. 시스템 오디오/마이크 권한을 허용한다.
6. 진행 중 상태와 시간을 표시한다.
7. `Stop` 후 transcript와 summary를 처리한다.
8. 중단 후 resume할 수 있다.

최소 약 1분 또는 충분한 문자량이 있어야 유의미한 요약이 생성된다.

### 15.4 캡처 방식

- 회의 봇이 통화에 참가하는 방식이 아니다.
- 사용자의 마이크와 시스템 오디오를 로컬 클라이언트가 캡처한다.
- macOS 데스크톱은 시스템 오디오/화면 기록 권한이 필요할 수 있다.
- Desktop 앱 버전과 macOS 최소 버전 조건이 있다.
- 외부 오디오 파일 업로드도 2026-07 릴리스에서 추가됐다.

### 15.5 동의

- 기본 consent 안내 문구
- copy consent
- voice consent
- 사용자가 직접 말하기
- Workspace가 자동 음성 동의를 강제할 수 있음
- 관할 지역의 녹음 동의 법률을 사용자가 준수해야 함

제품은 녹음 시작 전에 누가, 무엇을, 어디에 저장하는지 명확히 보여줘야 한다.

### 15.6 결과

- Transcript
- Summary
- Action items
- Decisions/key points
- Speaker labels
- 시간 순서
- 원문으로 이동
- 편집/복사/공유
- Notion Agent에게 후속 질문

미팅 전 작성한 Notes/agenda도 요약 문맥에 포함될 수 있다.

### 15.7 언어

공식 도움말 기준으로 영어, 중국어, 스페인어, 프랑스어, 독일어, 일본어, 한국어, 포르투갈어, 러시아어, 태국어, 베트남어, 덴마크어, 핀란드어, 노르웨이어, 네덜란드어, 스웨덴어 등 다국어를 지원한다. Speaker labeling과 세부 정확도는 언어별로 다르며 최신 도움말을 확인해야 한다.

### 15.8 권한과 데이터

- Meeting note는 일반 Page 권한을 상속한다.
- Calendar 내부 참석자에게 자동 공유하도록 구성할 수 있다.
- Transcript와 summary는 페이지 접근자가 볼 수 있다.
- 원본 audio는 녹음한 로컬 기기에서만 접근되는 조건이 있다.
- 앱·처리 공급자·관리자 정책에 따른 데이터 처리 안내가 있다.
- Enterprise는 transcript retention과 기능 허용을 더 세밀하게 통제한다.

### 15.9 한도

- 공식 도움말은 사용자당 하루 약 10시간의 녹취 한도를 안내한다.
- Offline에서는 사용할 수 없다.
- 너무 짧거나 음질이 낮은 회의는 summary/speaker label이 실패할 수 있다.
- 동시에 여러 회의를 녹음하는 흐름은 지원 대상으로 가정하면 안 된다.

### 15.10 관리자

- Workspace 기능 켜기/끄기
- 사용자 범위
- audio 저장 정책
- transcript retention `[Enterprise]`
- 자동 consent voice
- meeting detection notification
- 연결된 Calendar/Meeting notes DB 정책

## 16. Calendar Agent tools

2026-07 기준 Notion Agent/Custom Agent는 연결된 Calendar로 다음 작업을 수행할 수 있다.

- 일정 조회
- 빈 시간 찾기
- 참석자와 가능한 시간 제안
- event 생성
- event 수정
- invitation/RSVP 관련 작업
- meeting link/일정 참여 정보 찾기
- scheduling link 생성/공유

쓰기 권한과 확인 요구를 연결별로 설정한다. 다른 사람이 만든 일정을 임의 취소하는 등 일부 작업은 Notion Agent 제한에 포함될 수 있다.

## 17. Notion Mail 상태

### 17.1 종료 일정

Notion Mail 독립 받은편지함은 `[종료 예정]`이다.

- 종료일: **2026-09-22**
- 사용자 export 마감 안내: **2026-09-21**
- Gmail 원본 메일은 Gmail에 남는다.
- Notion Mail에만 있던 상태·draft·snippet 등은 별도 이전이 필요할 수 있다.

따라서 새 제품 설계에서 Notion Mail UI를 장기 핵심으로 모사하면 안 된다.

### 17.2 기존 제품 기능 기록

Notion Mail은 주로 Gmail/Google Workspace 계정을 연결한 이메일 클라이언트였다.

- Inbox와 custom views
- properties, labels, groups, filters
- side/center/full email open
- compose/reply/forward
- rich text
- attachments
- send later
- drafts
- snippets
- signatures
- reminders
- auto advance
- per-view/sender notifications
- Gmail filters
- AI auto-label
- AI writing/search
- meeting scheduling
- keyboard shortcuts
- mobile apps

Gmail과 양방향 동기화했지만 일부 Notion 전용 상태는 Gmail에 직접 대응하지 않았다.

### 17.3 종료 시 이전되지 않는 대표 데이터

- Notion-only drafts
- scheduled messages
- snippets
- AI auto-label instructions
- reminders
- custom views

Synced email database/view는 기존 데이터가 남을 수 있지만 새 메일 동기화는 중단된다.

## 18. 종료 후 유지되는 메일 기능

Mail 앱 종료와 별개로 다음은 유지 방향이 명시됐다.

- Gmail AI Connector
- Outlook AI Connector
- Mail blocks
- Notion Agent/Custom Agent의 mail tools

### 18.1 Custom Agent Mail connection

지원 연결:

- Gmail
- Notion Mail 계정의 전환 기간 연결
- Outlook

도구:

- search/read
- archive
- star/flag
- trash
- label/category
- unsubscribe
- block/unblock sender
- draft
- send
- filter

권한:

- Modify
- Draft
- Send
- 쓰기 전 confirmation

여러 메일 계정을 연결할 수 있으며 Agent별로 접근 계정과 권한을 제한한다.

### 18.2 메일 트리거

- 새 메일
- sender/subject/label 조건
- 예약 주기

예:

- VIP 고객 메일을 요약해 CRM item 생성
- invoice 첨부를 비용 DB에 기록
- 요청 메일을 분류해 draft 답장 생성
- 승인 후 발송

## 19. Inbox와 Mail 구분

| 이름 | 내용 |
| --- | --- |
| Notion Inbox | 댓글, 멘션, 공유, 리마인더 등 앱 알림 |
| Notion Mail inbox | 외부 이메일 받은편지함, 종료 예정 |
| Agent Mail tool | 외부 메일을 읽고 조작하는 도구 |

NoteNest가 “Inbox”를 만들 때도 앱 알림과 이메일을 같은 객체로 합치지 않는 편이 안전하다.

## 20. 주요 공식 출처

- [Calendars](https://www.notion.com/help/calendars)
- [Notion Calendar Help](https://www.notion.com/help/category/notion-calendar)
- [Manage calendars and events](https://www.notion.com/help/manage-your-calendars-and-events)
- [Use Notion Calendar with Notion](https://www.notion.com/help/use-notion-calendar-with-notion)
- [Availability, blocking and time zones](https://www.notion.com/help/availability-blocking-and-time-zones)
- [Time zones](https://www.notion.com/help/time-zones)
- [Notion Calendar settings](https://www.notion.com/help/notion-calendar-settings)
- [Notion Calendar for teams](https://www.notion.com/help/notion-calendar-for-teams)
- [Calendar connections & API](https://www.notion.com/help/notion-calendar-connections)
- [Calendar AI Connector](https://www.notion.com/help/notion-calendar-ai-connector)
- [AI Meeting Notes](https://www.notion.com/help/ai-meeting-notes)
- [Calendar tools release](https://www.notion.com/releases/2026-07-16)
- [Notion Mail shutdown](https://www.notion.com/help/notion-mail-inbox-is-going-away-what-to-do-next)
- [Notion Mail settings](https://www.notion.com/help/notion-mail-settings)
- [Connect Mail to Custom Agents](https://www.notion.com/help/connect-mail-to-custom-agents)
