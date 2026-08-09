# NoteNest 프로젝트 개요

## 1. 프로젝트 소개

**NoteNest**는 노트, 아이디어, 할 일, 프로젝트 계획을 한곳에 정리할 수 있는 Electron 기반 개인 워크스페이스 앱이다.  
Notion처럼 페이지 단위로 내용을 관리하되, 첫 버전은 복잡한 협업 기능보다 **개인 기록과 정리 경험**에 집중한다.

## 2. 프로젝트 목표

- 사용자가 여러 개의 페이지를 만들고 관리할 수 있다.
- 각 페이지에 제목과 본문을 작성할 수 있다.
- 작성한 내용은 Go 백엔드 서버 API를 통해 자동으로 저장된다.
- 사이드바에서 페이지 목록을 확인하고 빠르게 이동할 수 있다.
- 검색 기능으로 원하는 페이지를 쉽게 찾을 수 있다.
- 폴더와 태그로 페이지를 분류하고 탐색할 수 있다.
- Electron 데스크톱 앱으로 실행할 수 있다.

## 3. 핵심 콘셉트

> 생각이 모이는 작은 둥지

NoteNest는 흩어진 생각을 차곡차곡 모아두는 앱이다.  
메모 앱처럼 가볍게 시작할 수 있고, 나중에는 프로젝트 관리 도구처럼 확장할 수 있다.

## 4. 주요 기능

### MVP 기능

- 페이지 생성
- 페이지 삭제
- 페이지 제목 수정
- 본문 작성 및 수정
- 자동 저장
- 페이지 검색
- 최근 수정한 페이지 표시
- 빈 페이지 안내 화면
- Go 백엔드 API 연동
- 앱 재실행 후 데이터 유지

### 추가 기능 후보

- OAuth 로그인
- 클라우드 동기화
- 팀 단위 실시간 공동 편집

## 5. 화면 구성

### 사이드바

- 앱 이름 표시
- 새 페이지 버튼
- 검색창
- 페이지 목록
- 즐겨찾기 영역
- 홈, 모든 노트, 태그 탐색
- 폴더별 페이지 분류

### 에디터 화면

- 페이지 제목 입력
- 본문 에디터
- 자동 저장 상태 표시
- 삭제 버튼
- 마지막 수정 시간 표시

### 빈 상태 화면

- 아직 선택된 페이지가 없을 때 표시
- 새 페이지를 만들도록 유도

## 6. 추천 기술 스택

### 데스크톱 앱

- **Runtime:** Electron
- **Frontend:** React
- **Build Tool:** Vite
- **Editor:** 기본 textarea 또는 Tiptap
- **Styling:** CSS Modules 또는 Tailwind CSS

### 백엔드 서버

- **Language:** Go
- **HTTP Router:** Chi, Echo, Gin 중 선택
- **Database:** SQLite 또는 PostgreSQL
- **API Style:** REST API
- **Storage Logic:** 페이지, 블록, 검색, 설정 저장 처리

### 인증

- **OAuth:** Electron 앱 또는 별도 인증 흐름에서 처리
- **Backend:** OAuth를 제외한 페이지 관리, 저장, 검색, 동기화 로직 담당

## 7. 시스템 구조

```text
Electron App
  - React UI
  - Editor
  - Sidebar
  - OAuth 처리
        |
        | HTTP API
        v
Go Backend Server
  - Page API
  - Search API
  - Auto-save API
  - User Settings API
        |
        v
Database
  - pages
  - blocks
  - settings
```

## 8. 데이터 구조 예시

```json
{
  "id": "page_001",
  "title": "첫 번째 노트",
  "content": "오늘 떠오른 아이디어...",
  "folder": "프로젝트",
  "tags": ["아이디어", "기획"],
  "createdAt": "2026-08-09T10:00:00.000Z",
  "updatedAt": "2026-08-09T10:30:00.000Z",
  "favorite": false
}
```

## 9. API 예시

```text
GET    /api/pages
POST   /api/pages
GET    /api/pages/{id}
PUT    /api/pages/{id}
DELETE /api/pages/{id}
GET    /api/search?q=keyword
GET    /api/trash
POST   /api/trash/{id}/restore
DELETE /api/trash/{id}
GET    /api/pages/{id}/versions
POST   /api/pages/{id}/versions/{versionId}/restore
GET    /api/settings
PUT    /api/settings
GET    /api/storage
POST   /api/backups
POST   /api/uploads
```

## 10. 개발 순서

1. Electron + React 프로젝트 생성
2. Go 백엔드 서버 프로젝트 생성
3. 기본 레이아웃과 사이드바 UI 만들기
4. 페이지 목록 API 구현
5. 페이지 생성 API 구현
6. 페이지 선택 및 조회 기능 구현
7. 제목과 본문 수정 API 구현
8. 자동 저장 기능 구현
9. 페이지 삭제 기능 구현
10. 검색 API 구현
11. Electron 앱과 Go 서버 실행 방식 정리
12. 디자인 다듬기
13. 데스크톱 앱 빌드 준비

## 11. MVP 완료 기준

- 새 페이지를 만들 수 있다.
- 만든 페이지가 사이드바에 표시된다.
- 페이지를 선택하면 내용을 편집할 수 있다.
- 앱을 종료했다가 다시 실행해도 데이터가 유지된다.
- 검색어를 입력하면 관련 페이지만 보인다.
- Electron 앱으로 실행할 수 있다.
- Go 백엔드 서버와 API 통신이 정상 동작한다.

## 12. 향후 확장 방향

NoteNest는 첫 버전에서 개인 메모 앱으로 시작하고, 이후 다음 방향으로 확장할 수 있다.

- 프로젝트 관리 앱
- 공부 정리 앱
- 개발자용 문서 정리 도구
- AI 기반 아이디어 정리 도구
- 팀 협업 워크스페이스

## 13. 현재 프레임 실행

현재 저장소에는 Electron + React/Vite 프론트엔드와 Go + SQLite API로 구성된 개인 워크스페이스 프레임이 구현되어 있다.

- Tiptap 기반 블록 편집기와 Markdown 서식 툴바
- 제목, 목록, 할 일, 인용, 코드, 구분선, 링크, 이미지 블록과 문단 정렬
- 페이지 아이콘과 배너 이미지 업로드
- 이미지 붙여넣기 및 드래그 앤 드롭 업로드
- TTF, OTF, WOFF, WOFF2 사용자 폰트 업로드
- 글자 크기, 페이지 너비, 줄 간격, 테마와 동작을 관리하는 설정 화면
- 전체 노트 목록·격자 보기와 선택 노트 상세 패널
- 제목·본문·태그 범위를 선택할 수 있는 전역 검색과 날짜 필터
- 페이지 폴더 이동, 태그 추가·이름 변경·삭제
- 회의, 프로젝트, 회고, 독서 등 8종 페이지 템플릿
- 30일 휴지통, 페이지 복원·영구 삭제와 자동 저장 버전 기록
- 저장 공간 확인, SQLite 수동 백업, Markdown·JSON 가져오기/내보내기
- API 연결이 끊겨도 유지되는 브라우저 임시 저장과 재연결 복구
- 모바일 하단 탐색과 화면 하단 고정 편집 툴바
- 라이트·다크 모드 공통 모션 토큰, 페이지·패널·목록 전환과 동작 줄이기 대응
- 긴 설정·라이브러리 화면에서도 앱 프레임을 유지하는 내부 스크롤 레이아웃

```bash
npm install
cd server && go mod download && cd ..
npm run dev
```

- 웹 UI: `http://127.0.0.1:5173`
- Go API: `http://127.0.0.1:8787`
- 프로덕션 빌드: `npm run build`
- 빌드 결과 실행: `npm start`
- 전체 테스트: `npm test`

SQLite 데이터는 운영체제의 사용자 설정 폴더 아래 `NoteNest/notenest.db`에 저장된다. 테스트나 별도 환경에서는 `NOTENEST_DB_PATH`로 경로를 지정할 수 있다.
업로드한 이미지와 폰트는 같은 폴더의 `uploads` 디렉터리에 저장되며 파일당 최대 크기는 20MB이다.
