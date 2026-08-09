# 02. 계정·인증·설정·결제

## 1. 계정 모델

Notion의 로그인 주체는 **Account**, 작업과 결제 단위는 **Workspace**다.

```text
Account
├── primary email
├── secondary emails (최대 5개)
├── login methods
├── profile and global preferences
└── workspace memberships
    ├── Workspace A / Free
    ├── Workspace B / Business
    └── Workspace C / Enterprise organization
```

- 한 사람이 여러 이메일 주소를 같은 계정에 검증해 연결할 수 있다.
- 어떤 검증 이메일로 로그인해도 같은 계정으로 들어간다.
- 계정의 이름·사진·언어·테마 같은 일부 설정은 여러 워크스페이스에 공통이다.
- 플랜, 청구, 멤버·게스트, 보안 정책, 콘텐츠는 워크스페이스별이다.
- Enterprise에서는 이메일 도메인과 조직 정책으로 계정을 **managed user**로 관리할 수 있다.

## 2. 가입과 로그인

### 2.1 로그인 수단

| 수단 | 동작 | 조건 |
| --- | --- | --- |
| 이메일 일회용 코드 | 메일로 받은 임시 코드를 입력 | `[전체]` |
| 이메일 + 비밀번호 | 설정한 비밀번호로 로그인 | `[전체]` |
| Continue with Google | Google OAuth | `[전체]` |
| Continue with Apple | Apple 로그인 | `[전체]` |
| Passkey | 생체 인식·기기 PIN·보안 키 | `[전체]`, 일부 조직 정책 제외 |
| SAML SSO | 회사 IdP로 인증 | `[Business+]` |

로그인 후 계정에 속한 워크스페이스 목록을 전환할 수 있다. 관리자가 SAML을 강제한 조직은 IdP를 통해 진입하고, 조직/워크스페이스 소유자에게는 비상 접근용 SSO 우회 규칙이 적용될 수 있다.

### 2.2 가입·초대 흐름

1. 사용자가 이메일 또는 소셜 계정으로 Account를 만든다.
2. 새 개인 워크스페이스를 만들거나 초대 링크를 연다.
3. 초대된 이메일과 계정의 검증 이메일이 일치하면 해당 역할로 참가한다.
4. 워크스페이스별 온보딩에서 이름, 용도, 팀 규모, 템플릿 등을 선택할 수 있다.
5. Enterprise에서는 verified domain, SAML, SCIM, 가입 요청 정책이 자동 참가 여부를 결정한다.

### 2.3 세션

- 개별 기기에서 로그아웃할 수 있다.
- 계정 설정에서 모든 기기 세션을 종료할 수 있다.
- Enterprise managed user는 관리자가 전체 로그아웃, 비밀번호 재설정, 세션 길이 제한을 수행할 수 있다.
- 세션 길이는 조직 정책에서 1시간부터 180일까지 설정할 수 있다.

## 3. 이메일 주소

### 3.1 Primary email

- 계정의 대표 주소다.
- 계정 관련 메일과 중요 알림을 수신한다.
- 설정에서 새 주소를 검증한 뒤 변경한다.
- 회사 도메인이 관리되는 경우 변경이 제한되거나 관리자 이벤트로 기록될 수 있다.

### 3.2 Secondary emails

- 한 계정에 최대 5개를 추가할 수 있다.
- 각 주소는 검증 절차를 거친다.
- 보조 주소로도 로그인, 공유 대상 지정, 멘션 매칭이 가능하다.
- 같은 사람이 회사·개인 이메일로 중복 계정을 만드는 문제를 줄인다.
- SCIM/managed domain 조직에서는 관리자가 보조 이메일 사용을 제한하거나 감사할 수 있다.

### 3.3 이메일 변경 예외

- 이미 다른 Notion 계정에 연결된 이메일은 바로 합칠 수 없다.
- SSO 강제 조직의 관리 이메일은 임의 변경이 제한될 수 있다.
- 이메일 접근 권한을 잃은 경우 일반 설정 흐름 대신 계정 복구/지원 절차가 필요하다.

## 4. 계정 보안

### 4.1 Passkeys

- 최대 5개까지 등록할 수 있다.
- iCloud Keychain, Chrome/Google Password Manager, 일반 password manager, FIDO2 보안 키, 휴대전화 등을 사용할 수 있다.
- 비밀번호 피싱 위험을 줄이고 기기 생체 인증을 활용한다.
- IdP 로그인을 의무화한 조직에서는 Passkey가 주 로그인 수단으로 제공되지 않을 수 있다.
- 현재 관리자가 전 사용자에게 Passkey 등록 자체를 강제하는 기능은 없다.

### 4.2 2-step verification

- 인증 앱의 TOTP 또는 SMS를 사용할 수 있다.
- 활성화할 때 복구용 backup code 6개가 생성된다.
- 기기 분실 시 backup code로 접근을 복구한다.
- 계정 소유자가 직접 켜는 기능이며, 워크스페이스 소유자가 일반 2FA를 전원에게 직접 강제하는 방식은 아니다.
- 조직 단위 MFA 강제는 SAML IdP 정책에서 구현하는 것이 일반적이다.

### 4.3 보안 작업

- 비밀번호 설정/변경
- Passkey 추가/이름 변경/삭제
- 2FA 켜기/끄기와 복구 코드 관리
- 모든 기기 로그아웃
- 연결 앱과 계정 점검
- managed user의 관리자 강제 로그아웃·일시 중지·삭제

## 5. 프로필과 개인 환경 설정

### 5.1 My profile

- 표시 이름
- 프로필 사진 업로드/교체/삭제
- Primary/secondary email
- 비밀번호와 계정 보안
- 계정 영구 삭제

프로필은 멘션, Person 속성, 댓글, 편집 기록, 워크스페이스 멤버 목록에 사용된다.

### 5.2 Appearance

- System, Light, Dark
- 설정은 계정이 사용하는 워크스페이스 전반에 적용될 수 있다.
- 페이지별 색은 콘텐츠 속성이고, Appearance는 앱 크롬과 기본 렌더링 환경이다.
- 페이지 본문은 별도로 Default, Serif, Mono 폰트를 선택할 수 있다.

### 5.3 Language & region

- 앱 UI 언어에 한국어를 포함한 여러 언어를 지원한다.
- 시간 형식과 지역 표시가 일정·날짜·리마인더에 반영된다.
- 주 시작 요일을 월요일로 설정할 수 있다.
- Notion Calendar에도 별도의 언어, 주 시작, 시간대, 주말 표시 설정이 있다.

### 5.4 Desktop preferences

- Notion 링크를 데스크톱 앱에서 열지 브라우저에서 열지 선택
- Global Command Search 단축키
- 시작 동작, 업데이트와 알림
- Calendar의 메뉴 바 표시와 회의 참여 동작

### 5.5 Privacy

- 페이지 조회 기록에 자신의 방문을 포함할지 선택
- 쿠키/분석 추적 옵션
- AI 데이터 처리 정책 확인
- Enterprise에서는 개인 설정보다 조직 정책이 우선할 수 있다.

## 6. 알림 설정

### 6.1 채널

| 채널 | 대표 용도 |
| --- | --- |
| Inbox | Notion 안의 모든 협업 알림 처리 |
| Desktop push | 앱이 비활성일 때 즉시 알림 |
| Mobile push | 모바일 기기 알림 |
| Email | 놓친 알림, 항상 이메일, digest |
| Slack | 연결된 워크스페이스의 선택 알림 |

### 6.2 발생 이벤트

- `@person`, `@group`, `@page` 멘션
- 댓글, 답글, 리액션, 토론
- 리마인더와 날짜 알림
- Person 속성에 담당자로 지정
- 페이지/팀스페이스 공유 초대
- 데이터베이스 중요 업데이트
- Meeting, Calendar 이벤트 알림
- 자동화와 Agent 실행 결과

### 6.3 전달 규칙

- Notion을 현재 보고 있으면 Inbox로 먼저 처리하고 외부 push/email은 지연될 수 있다.
- “Always send email”처럼 앱 사용 여부와 관계없이 이메일을 받는 옵션이 있다.
- Workspace digest로 최근 활동 요약을 받을 수 있다.
- Inbox에서는 읽음, 보관, 필터, 스레드별 처리, 페이지 패널 고정을 지원한다.

## 7. 워크스페이스 기본 설정

워크스페이스 소유자는 일반 설정에서 다음을 관리한다.

- 워크스페이스 이름과 아이콘
- 기본 도메인/URL
- 멤버와 게스트
- 팀스페이스 생성 정책
- 공개 게시, Forms, 공유 링크
- 연결과 AI 사용
- 페이지 분석 노출
- 내보내기·복제 정책
- 플랜, 좌석, 청구
- 워크스페이스 삭제

워크스페이스를 삭제하면 그 안의 콘텐츠와 멤버십이 함께 삭제된다. 삭제 전 내보내기를 권장하며, Enterprise에서는 정책상 삭제 또는 내보내기가 제한될 수 있다.

## 8. 플랜과 결제

### 8.1 워크스페이스별 플랜

- 같은 Account라도 Workspace A는 Free, B는 Business일 수 있다.
- 한 워크스페이스의 업그레이드가 다른 워크스페이스에 적용되지 않는다.
- Free/Plus는 AI 기능이 제한 체험일 수 있고 Business/Enterprise는 핵심 AI 제품을 포함한다.
- 일부 지역이나 판매 경로에서는 Plus 제공 또는 가격이 다를 수 있다.

### 8.2 좌석

| 사용자 유형 | 유료 좌석 | 설명 |
| --- | --- | --- |
| Member | O | 일반 워크스페이스 멤버 |
| Restricted member | O | 접근 범위는 좁지만 멤버 기능과 AI 사용 가능 |
| Workspace owner | O | 멤버 좌석 + 관리자 권한 |
| Membership admin | O | Enterprise 멤버 관리 역할 |
| Guest | X | 명시적으로 공유된 페이지에만 접근 |
| Temporary member | X | 승인된 Marketplace 컨설턴트, 최대 1년 |

- 결제 주기 중 멤버를 추가하면 남은 기간만큼 일할 계산될 수 있다.
- 멤버를 제거해도 이미 결제한 좌석은 주기 종료까지 다시 배정할 수 있는 형태로 남을 수 있다.
- 게스트를 멤버로 바꾸면 좌석 과금이 발생한다.
- 그룹에 속한 사용자를 삭제할 때 콘텐츠 소유권과 접근을 함께 검토해야 한다.

### 8.3 청구 관리

- 월간/연간 주기 선택
- 결제 수단과 청구 이메일
- 인보이스·영수증 다운로드
- 세금 정보와 VAT
- 좌석 수와 다음 청구 예상액
- 업그레이드/다운그레이드
- 취소, 환불, 교육·스타트업·크리에이터 프로그램

다운그레이드할 때는 파일 크기, 블록 수, 기록 보존, 게스트, 차트, 자동화, 보안 기능이 새 한도를 초과하는지 먼저 확인한다.

### 8.4 AI와 Custom Agent 크레딧

- Business/Enterprise의 일반 Notion AI와 Custom Agent 사용량은 동일한 과금 단위가 아니다.
- Custom Agents는 워크스페이스 공유 월간 크레딧 잔액을 사용한다.
- 2026-08-10 기준 추가 크레딧은 $10당 1,000 크레딧으로 안내되지만 `[변동 가능]`이다.
- 실행 복잡도, 사용 도구, 모델, 처리량에 따라 소비량이 달라진다.
- 잔액이 없으면 Agent가 일시 중지될 수 있다.
- 관리자는 on-demand 구매, 워크스페이스 한도, Agent별 한도와 사용량을 관리한다.
- Workers는 베타 기간 정책과 향후 크레딧 적용 일정이 별도로 안내되고 있어 릴리스 시점마다 재확인이 필요하다.

## 9. 계정 삭제와 복구

### 9.1 계정 삭제 효과

- 본인이 유일한 멤버/소유자인 개인 워크스페이스가 삭제될 수 있다.
- 공유 워크스페이스에서는 본인 계정과 멤버십이 제거된다.
- 유일한 관리자라면 먼저 다른 소유자를 지정해야 할 수 있다.
- 삭제는 계정 설정에서 명시적 확인 후 실행한다.

### 9.2 복구

- 삭제 후 일정 기간에는 지원팀이 스냅샷을 이용해 복구할 수 있는 경우가 있다.
- 공식 도움말은 통상 30일 안의 지원 요청 가능성을 안내하지만 보장된 사용자 직접 복원 기능은 아니다.
- 페이지 Trash, 페이지 기록, 계정/워크스페이스 복구는 서로 다른 계층이다.

## 10. UI 설계 포인트

### 10.1 설정 IA

```text
Settings
├── My profile
├── My settings
├── Notifications
├── Connections
├── Workspace
│   ├── General
│   ├── People / Groups
│   ├── Teamspaces
│   ├── Security
│   └── Import
├── Plans / Billing
├── AI / Agents / Credits
└── Organization (Enterprise)
    ├── People
    ├── Security
    ├── Data & compliance
    └── Analytics
```

### 10.2 작동 원칙

- 개인 설정과 관리자 설정을 시각적으로 구분한다.
- 위험한 작업은 화면 하단의 danger zone과 확인 대화상자에 둔다.
- 플랜 제한 기능은 숨기기보다 잠금/업그레이드 설명으로 맥락을 유지한다.
- SSO/SCIM/도메인처럼 선후 관계가 있는 설정은 상태와 다음 조치를 함께 표시한다.
- 좌석 변화는 실행 전에 금액과 적용 시점을 보여준다.

## 11. 예외와 주의

- 외부 OAuth와 SAML 계정의 이메일이 달라 중복 계정이 생길 수 있다.
- 계정 삭제와 워크스페이스 삭제의 범위가 다르다.
- Restricted member는 접근이 좁아도 과금상 멤버다.
- Guest를 그룹에 넣거나 워크스페이스 전체 탐색 권한을 줄 수 없다.
- Passkey와 Notion 2FA는 IdP MFA를 대체하지 않는다.
- 플랜 이름, 가격, AI 크레딧은 고정 설계 상수로 하드코딩하면 안 된다.

## 12. 주요 공식 출처

- [Log in and out](https://www.notion.com/help/log-in-and-out)
- [Passkeys](https://www.notion.com/help/passkeys)
- [Two-step verification](https://www.notion.com/help/two-step-verification)
- [Secondary emails](https://www.notion.com/help/secondary-emails)
- [Account settings](https://www.notion.com/help/account-settings)
- [Notification settings](https://www.notion.com/help/notification-settings)
- [Delete your account](https://www.notion.com/help/delete-your-account)
- [Pricing](https://www.notion.com/pricing)
- [Upgrade or downgrade your plan](https://www.notion.com/help/upgrade-or-downgrade-your-plan)
