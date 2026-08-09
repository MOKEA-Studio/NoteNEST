# 03. 조직·워크스페이스·팀스페이스·권한

## 1. 공간 계층

```text
Organization [Enterprise]
└── Workspace
    ├── Workspace roles and groups
    ├── Teamspaces
    │   ├── owners and members
    │   ├── access mode
    │   ├── security settings
    │   └── page tree
    ├── Shared pages
    ├── Private pages per user
    └── Guests on explicit pages
```

### Organization

- 여러 Enterprise 워크스페이스를 하나의 관리 단위로 묶는다.
- Organization owner가 멤버, 도메인, 보안, 데이터, 분석, 크레딧 정책을 관리한다.
- 조직 정책을 잠그면 개별 워크스페이스 소유자가 변경하지 못한다.
- Workspace를 managed/enabled/disabled 상태로 관리하고 공통 정책을 일괄 적용할 수 있다.

### Workspace

- 콘텐츠, 플랜, 좌석, 멤버, 그룹, 연결의 기본 경계다.
- 한 계정은 여러 워크스페이스를 전환한다.
- 워크스페이스는 자체 Settings, Teamspaces, Private 영역과 Trash를 가진다.

### Teamspace

- 팀·부서·프로젝트 단위의 공유 페이지 트리와 멤버십 경계다.
- 접근 모드, 소유자, 멤버, 기본 팀스페이스 여부, 보안 정책을 가진다.
- Teamspace는 삭제보다 archive/restore 생명주기를 사용한다.

## 2. 사용자 역할

| 역할 | 유료 좌석 | 기본 범위 | 주요 권한 |
| --- | --- | --- | --- |
| Member | O | 워크스페이스 | 공개/가입 Teamspace 탐색, Private pages, 그룹·AI |
| Restricted member | O | 명시 공유 범위 | Private pages와 AI 사용, 초대된 Teamspace/Page만 |
| Guest | X | 페이지별 | 공유된 페이지와 허용된 하위 페이지 |
| Temporary member | X | 일반 멤버 수준 | 승인된 컨설턴트, 만료일 있는 임시 참여 |
| Workspace owner | O | 워크스페이스 전체 관리 | 설정, 결제, 보안, 팀스페이스 감독 |
| Membership admin | O | Enterprise 멤버 관리 | 사용자·그룹 관리, 전체 Workspace 설정은 아님 |
| Organization owner | O | 조직의 모든 Workspace | 조직 정책, managed users, 보안·데이터·분석 |

### 2.1 Member

- 워크스페이스의 일반 협업자다.
- 허용된 Teamspace 가입·탐색, 페이지 생성, 그룹 소속, AI 사용이 가능하다.
- 실제 편집 가능 범위는 페이지/팀스페이스 권한에 따라 달라진다.

### 2.2 Restricted member

- 청구상 정식 멤버지만 콘텐츠 탐색 범위를 제한한 역할이다.
- Private pages와 AI 같은 멤버 기능을 사용한다.
- 명시적으로 추가된 Teamspace/Page에만 접근한다.
- Teamspace를 만들 수 없다.
- 보지 못하는 사람·그룹·페이지를 전역 멘션하거나 공유할 수 없다.
- 외부 계약자에게 Guest보다 넓은 기능이 필요하지만 전체 워크스페이스 노출은 피하고 싶을 때 사용한다.

### 2.3 Guest

- 워크스페이스 전체 구성원이 아니다.
- 특정 페이지에 이메일로 초대한다.
- Teamspace 탐색, 멤버 디렉터리, 그룹, 워크스페이스 설정, Connections 관리가 불가능하다.
- 공유 페이지의 하위 페이지는 상속 설정에 따라 볼 수 있다.
- 외부 고객, 파트너, 프리랜서와 제한된 산출물만 협업할 때 적합하다.

### 2.4 Temporary member

- Notion Marketplace에서 승인된 솔루션/서비스 컨설턴트용 역할이다.
- 일반 멤버와 유사하게 협업하지만 별도 유료 좌석 없이 기간 제한이 있다.
- 최대 1년의 만료일을 가진다.
- 소유자가 명시적으로 추가하고 접근 범위를 정리해야 한다.

### 2.5 관리자 역할

- Workspace owner는 결제, 보안, export, Teamspace 관리와 Workspace 삭제까지 담당한다.
- Membership admin은 Enterprise에서 사용자와 그룹 관리를 분리 위임한다.
- Group owner는 특정 그룹 구성원을 관리한다.
- Teamspace owner는 해당 Teamspace 멤버, 보안, 아카이브, 기본 페이지를 관리한다.
- Organization owner는 다중 Workspace와 managed user를 통제한다.

## 3. 그룹과 People 시스템

### 3.1 People profiles

`[전체]`, 멤버 대상이며 현재 모바일에서는 제한된다.

- `@mention`, 댓글, Inbox, Person property의 이름에 hover하면 profile card
- 연락 수단과 일정 잡기
- 이름을 눌러 full profile
- top collaborators
- 소속 Teamspaces
- 최근 Workspace activity
- profile cover
- Enterprise SCIM role을 hover card에 표시 가능
- Guest는 profile/hover card 대상이 아님
- Workspace owner가 Profiles/Hover cards를 전체 비활성화 가능

### 3.2 People Directory

모든 Workspace에 존재하는 built-in database로 현재와 과거 멤버의 profile을 모은다.

- Guest 제외
- Member는 전체 directory를 보고 자기 profile page 편집
- Workspace owner는 전체 directory와 custom properties 편집
- 이름·이메일 같은 core property는 삭제 제한
- Search, Settings → People/Members, profile breadcrumb로 접근
- Favorite로 sidebar 고정
- office, role, team 같은 custom property
- Enterprise + SCIM에서 HRIS/IdP property를 자동 sync
- 개별 profile의 property visibility와 directory 열 순서는 별도

### 3.3 Group 기능

- 멤버를 이름 있는 집합으로 묶는다.
- 그룹 아이콘과 소유자를 지정한다.
- 페이지와 Teamspace를 그룹 단위로 공유한다.
- `@group` 멘션과 Person 속성에서 그룹을 선택할 수 있다.
- 기존 그룹을 바탕으로 Teamspace를 만들 수 있다.

### 3.4 Group 제한

- Guest는 그룹에 넣을 수 없다.
- 그룹 생성·수정 권한은 Workspace/Membership/Group owner 정책에 따른다.
- SCIM 동기화 그룹은 IdP가 원본이므로 Notion에서 직접 수정이 제한될 수 있다.
- 큰 그룹 멘션은 알림 폭주를 만들 수 있어 멘션 가능 범위와 확인 UI가 필요하다.

## 4. Teamspace 시스템

### 4.1 접근 모드

| 모드 | 탐색 가능 | 가입 방식 | 대표 용도 |
| --- | --- | --- | --- |
| Open | 모든 멤버 | 누구나 직접 가입 | 회사 공용, 관심 기반 |
| Closed | 목록에서 보임 | 초대/승인 필요 | 부서, 프로젝트 |
| Private | 멤버 외에는 존재도 숨김 | owner가 초대 | 인사, 법무, 경영 |

Private Teamspace는 `[Business+]`다.

### 4.2 기본 Teamspace

- 새 멤버를 자동으로 참가시킨다.
- 전사 공지, 사내 위키, 공용 프로젝트에 사용한다.
- 공식 가이드는 탐색 복잡도를 줄이기 위해 기본 Teamspace를 약 3개 이하로 유지할 것을 권장한다.

### 4.3 생성

1. Teamspaces 영역에서 새 Teamspace를 선택한다.
2. 이름, 설명, 아이콘을 지정한다.
3. Open/Closed/Private 접근 모드를 고른다.
4. 소유자와 초기 멤버/그룹을 추가한다.
5. 필요하면 기본 Teamspace로 설정한다.
6. 시작 페이지나 템플릿을 구성한다.

Workspace owner는 Teamspace 생성 권한을 owner에게만 제한할 수 있다.

### 4.4 관리

Teamspace 관리 목록은 일반적으로 다음 열과 필터를 제공한다.

- Teamspace 이름
- Owners
- Members
- Access
- Updated
- Active/Archived
- Owner/Access 조건 필터

Teamspace owner는 이름·아이콘·설명, 멤버, 접근 모드, 보안, 기본 페이지, 아카이브를 관리한다.

### 4.5 Archive

- Teamspace는 영구 삭제 대신 archive한다.
- Archived 목록에서 restore할 수 있다.
- 페이지와 접근 문맥을 보존하면서 사이드바 노출을 제거한다.
- 소유자 없는 Teamspace에는 새 owner를 지정할 수 있다.
- Enterprise Workspace owner는 필요한 경우 Teamspace에 참가하거나 소유권을 가져와 관리할 수 있다.

## 5. 페이지 공유 권한

### 5.1 권한 레벨

| 권한 | 페이지 본문 | 댓글 | 공유/권한 | DB 스키마·보기 | DB 항목 |
| --- | --- | --- | --- | --- | --- |
| Full access | 편집 | O | O | 편집 | 편집 |
| Can edit | 편집 | O | 제한 | 편집 | 편집 |
| Can edit content | 편집 | O | X | X | 속성/항목 편집 |
| Can create | 새 항목 제출 | 조건부 | X | X | 타인 항목은 보지 않고 생성 |
| Can comment | 읽기 | O | X | X | 읽기 |
| Can view | 읽기 | X | X | X | 읽기 |

- `Can create`는 `[Business+]`이며 데이터베이스에 새 행을 제출하되 기존 행은 보지 못하게 하는 접수형 권한이다.
- `Can edit content`는 데이터베이스 구조와 보기를 잠그고 실제 데이터만 편집하게 할 때 중요하다.
- Full access는 다른 사람의 접근을 바꿀 수 있으므로 최소화한다.

### 5.2 공유 대상

- 특정 Person
- Group
- Teamspace
- Workspace 전체
- Guest 이메일
- 링크를 가진 웹 사용자
- 공개 웹 전체
- API/Agent connection

### 5.3 공유 UI 흐름

1. 페이지 상단 `Share`를 연다.
2. 사람·그룹·이메일을 검색한다.
3. 권한을 선택하고 초대를 보낸다.
4. 기존 접근자 목록에서 권한을 바꾸거나 제거한다.
5. 필요하면 공개 링크, 검색 노출, 복제 허용, 만료일을 조정한다.

공유 패널은 현재 권한의 출처가 직접 공유인지, Teamspace/상위 페이지 상속인지 보여줘야 한다.

## 6. 권한 상속과 예외

### 6.1 기본 규칙

- 하위 페이지는 상위 페이지의 접근을 기본 상속한다.
- Teamspace의 기본 접근이 그 안의 페이지에 전파된다.
- 그룹 공유는 그룹 구성원 변화에 따라 자동 갱신된다.
- 연결된 데이터베이스 보기는 원본 데이터 소스 권한을 우회하지 않는다.
- 링크를 아는 것과 접근 권한을 가진 것은 다르다.

### 6.2 상속된 권한 표시

권한 UI는 다음을 구분해야 한다.

- Direct access
- Inherited from parent page
- Inherited from Teamspace
- Inherited through group
- Workspace default
- Public web access
- Agent/API access

상속 권한을 현재 페이지에서 직접 낮출 수 없는 경우 상위 위치로 이동해 변경하도록 안내한다.

### 6.3 하위 페이지

- 상위 페이지를 Guest에게 공유하면 하위 페이지도 보일 수 있으므로 공유 시 범위를 확인해야 한다.
- 민감한 하위 페이지는 별도 Private Teamspace나 비상속 구조로 이동하는 편이 안전하다.
- 공개 사이트도 하위 페이지가 기본 게시될 수 있어 개별 공개 상태를 점검해야 한다.

## 7. 데이터베이스 세분화 권한

### 7.1 구조와 콘텐츠 분리

- DB owner/editor는 속성, 보기, 필터, 템플릿을 관리한다.
- 일반 협업자는 `Can edit content`로 행과 속성값만 바꾼다.
- 접수자는 `Can create`로 새 행만 만든다.
- Form 응답자는 DB를 직접 보지 않고 새 항목을 생성한다.

### 7.2 Page-level access

`[Business+]`의 세분화 데이터베이스 권한은 Person/Created by 같은 속성 규칙으로 각 행의 접근을 제한한다.

예:

- `Assignee contains current user`: 담당자만 태스크 확인
- `Created by is current user`: 요청자가 본인 제출 건만 확인
- `Manager property contains current user`: 관리자별 팀 기록 접근

주의:

- 보기 필터는 보안 경계가 아니다. 숨겨진 행도 원본 권한이 있으면 다른 보기/검색/API에서 보일 수 있다.
- 보안이 필요하면 반드시 page-level access 또는 별도 데이터베이스/공간을 사용한다.
- Relation/Rollup은 접근할 수 없는 대상 값을 완전히 노출하지 않아야 한다.

## 8. 공개 공유와 Sites

### 8.1 Share to web

- 웹 게시 켜기/끄기
- 검색 엔진 색인 허용
- 복제 허용
- 링크 만료
- 공개 페이지의 댓글/상호작용 조건
- 하위 페이지 공개 범위

### 8.2 위험

- 공개 페이지의 작성자·기여자 메타데이터가 의도보다 많이 드러날 수 있다.
- DB 공개 보기는 각 항목 페이지와 연결될 수 있다.
- 공유 링크를 나중에 private로 바꾸면 외부 북마크/임베드가 깨진다.
- Enterprise 관리자는 웹 게시, 공개 링크, Forms, 내보내기를 조직 정책으로 차단할 수 있다.

## 9. 멤버 수명주기

### 9.1 초대

- 이메일로 Member/Guest 초대
- 가입 요청 승인
- verified domain 자동 가입 정책
- SCIM 자동 프로비저닝
- 그룹/Teamspace 초기 할당

### 9.2 역할 변경

- Guest ↔ Member
- Member ↔ Restricted member
- Member → Workspace owner
- Enterprise에서 Membership admin 지정
- Temporary member의 만료일 연장/종료

역할 변경 전 좌석 비용과 새 접근 범위를 보여줘야 한다.

### 9.3 제거와 재가입

- 멤버 제거 시 Private pages의 소유권/보관 처리
- 중요한 페이지는 다른 멤버에게 이전
- 그룹과 Teamspace에서 제거
- 세션 종료와 연결 토큰 취소
- Enterprise managed user suspend/delete
- 공식 동작상 30일 안에 같은 사용자가 재가입하면 Private/shared/group/teamspace 접근이 복원될 수 있으므로 보안 사고 대응에서는 별도 검증이 필요하다.

### 9.4 Deprovisioned user 콘텐츠

- SCIM 삭제/중지와 Notion 콘텐츠 삭제는 동일하지 않다.
- 관리자는 퇴사자의 Private pages를 지정 사용자에게 전송할 수 있다.
- 감사 로그와 legal hold/retention 정책이 삭제보다 우선할 수 있다.

## 10. 조직·관리자 통제

### 10.1 Organization settings

| 영역 | 기능 |
| --- | --- |
| General | 조직 정보, Workspace 관리, 정책 잠금 |
| People | 멤버·게스트 중복 제거, 그룹, 역할, suspend |
| Security | SAML, SCIM, 도메인, 세션, IP/네트워크 |
| Data & compliance | 감사 로그, 콘텐츠 검색, 보존, legal hold, DLP/SIEM |
| Analytics | 사용자·콘텐츠·검색·Teamspace 분석 |
| Credits | AI/Agent 크레딧, 한도, on-demand |

### 10.2 공유/데이터 정책

- Sites와 public pages 허용 여부
- Public forms 허용 여부
- 공개 링크와 만료
- Workspace 외부로 duplicate
- Export
- Guest/member 요청
- 외부 Connections
- Webhook access
- MCP client allowlist
- Agent 생성과 외부 Agent 사용

### 10.3 Managed user

- 검증 도메인 소속 계정 식별
- 이름/이메일 변경 통제
- 외부 Workspace 참가 제한
- 지원팀 접근 정책
- 세션 기간
- 전체 로그아웃·비밀번호 재설정
- suspend/reactivate/delete

## 11. 권한 판정 모델

제품 구현 관점의 권장 판정 순서다.

```text
1. 계정이 활성 상태인가?
2. Workspace/Organization 정책이 접근을 허용하는가?
3. 사용자 또는 실행 주체의 역할은 무엇인가?
4. Teamspace 접근이 있는가?
5. Page의 직접/상속 권한 중 가장 강한 허용은 무엇인가?
6. DB item에 page-level rule이 있는가?
7. 작업에 필요한 capability가 있는가?
8. 공개 링크, Agent, API 같은 별도 주체 정책이 있는가?
9. 데이터 보존/legal hold가 삭제 작업을 막는가?
```

단순히 `role === editor` 같은 한 필드로 구현할 수 없다. Subject, Resource, Action, Context, Inheritance를 분리한 권한 모델이 필요하다.

## 12. Teamspace UI와 상호작용

### 사이드바

- 섹션 제목 + 접기/펼치기 chevron
- Teamspace 아이콘과 이름
- hover 시 `+`와 `•••`
- 하위 페이지 tree
- drag-and-drop 이동
- 새 Teamspace 탐색/가입 진입점

### Teamspace 메뉴

- Open
- New page
- Add members
- Teamspace settings
- Copy link
- Leave teamspace
- Archive

### 관리 화면

- 리스트/테이블 기반의 조밀한 화면
- 이름, owner, member count, access, updated 열
- 검색, access/owner/status 필터
- 행 선택과 일괄 작업
- archive/restore 확인

Teamspace를 누를 때 별도 모달을 강제로 띄우는 것이 아니라 사이드바 트리를 펼치거나 Teamspace의 기본 페이지를 여는 동작이 자연스럽다. 설정은 `•••` 또는 Settings의 Teamspaces 관리 화면으로 분리한다.

## 13. 주요 공식 출처

- [Who’s who in a workspace](https://www.notion.com/help/whos-who-in-a-workspace)
- [Manage teamspaces](https://www.notion.com/help/manage-teamspaces)
- [Browse, join and create teamspaces](https://www.notion.com/help/browse-join-and-create-teamspaces)
- [Create and manage groups](https://www.notion.com/help/create-and-manage-groups)
- [People profiles](https://www.notion.com/help/people-profiles)
- [People Directory](https://www.notion.com/help/people-directory)
- [Sharing and permissions](https://www.notion.com/help/sharing-and-permissions)
- [Share your work](https://www.notion.com/help/share-your-work)
- [Add members, admins, guests and groups](https://www.notion.com/help/add-members-admins-guests-and-groups)
- [Organization-level controls](https://www.notion.com/help/organization-level-controls)
- [Managed users dashboard](https://www.notion.com/help/managed-users-dashboard)
- [Domain management](https://www.notion.com/help/domain-management)
- [SAML SSO](https://www.notion.com/help/saml-sso-configuration)
- [SCIM](https://www.notion.com/help/provision-users-and-groups-with-scim)
