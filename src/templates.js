const paragraph = (text = "") => ({
  type: "paragraph",
  content: text ? [{ type: "text", text }] : undefined,
});

const heading = (text, level = 2) => ({
  type: "heading",
  attrs: { level },
  content: [{ type: "text", text }],
});

const tasks = (items) => ({
  type: "taskList",
  content: items.map((text) => ({
    type: "taskItem",
    attrs: { checked: false },
    content: [paragraph(text)],
  })),
});

const bullets = (items) => ({
  type: "bulletList",
  content: items.map((text) => ({ type: "listItem", content: [paragraph(text)] })),
});

const doc = (...content) => ({ type: "doc", content });

export const pageTemplates = [
  {
    id: "blank",
    category: "personal",
    title: "빈 페이지",
    description: "자유롭게 시작할 수 있는 빈 페이지입니다.",
    pageTitle: "제목 없는 페이지",
    folder: "개인",
    tags: [],
    blocks: doc(paragraph()),
  },
  {
    id: "meeting",
    category: "work",
    title: "회의 노트",
    description: "안건과 결정 사항, 후속 작업을 정리합니다.",
    pageTitle: "회의 노트",
    folder: "업무",
    tags: ["회의"],
    blocks: doc(heading("회의 정보"), paragraph("일시 · 참석자 · 목적"), heading("안건"), bullets(["첫 번째 안건", "두 번째 안건"]), heading("다음 할 일"), tasks(["담당자와 기한 정하기"])),
  },
  {
    id: "project",
    category: "work",
    title: "프로젝트 계획",
    description: "목표, 일정, 할 일을 체계적으로 계획합니다.",
    pageTitle: "새 프로젝트",
    folder: "프로젝트",
    tags: ["기획"],
    blocks: doc(heading("프로젝트 목표"), paragraph("이 프로젝트로 해결할 문제와 성공 기준을 적어보세요."), heading("주요 일정"), bullets(["준비", "실행", "검토"]), heading("다음 행동"), tasks(["첫 번째 할 일", "두 번째 할 일"])),
  },
  {
    id: "weekly",
    category: "work",
    title: "주간 회고",
    description: "한 주를 돌아보고 다음 주를 준비합니다.",
    pageTitle: "이번 주 회고",
    folder: "업무",
    tags: ["회고"],
    blocks: doc(heading("잘한 일"), paragraph(""), heading("배운 점"), paragraph(""), heading("다음 주 집중할 일"), tasks(["가장 중요한 한 가지"])),
  },
  {
    id: "reading",
    category: "study",
    title: "독서 메모",
    description: "책의 핵심 내용과 생각을 기록합니다.",
    pageTitle: "독서 메모",
    folder: "자료",
    tags: ["독서"],
    blocks: doc(heading("책 정보"), paragraph("제목 · 저자 · 읽은 날짜"), heading("핵심 내용"), bullets(["기억하고 싶은 문장", "새롭게 알게 된 점"]), heading("나의 생각"), paragraph("")),
  },
  {
    id: "tasks",
    category: "personal",
    title: "할 일 목록",
    description: "우선순위를 정하고 할 일을 관리합니다.",
    pageTitle: "할 일 목록",
    folder: "개인",
    tags: ["할 일"],
    blocks: doc(heading("오늘"), tasks(["가장 중요한 일", "짧게 끝낼 일"]), heading("이번 주"), tasks(["미리 준비할 일"])),
  },
  {
    id: "travel",
    category: "personal",
    title: "여행 계획",
    description: "일정과 준비 사항을 한곳에 정리합니다.",
    pageTitle: "새 여행 계획",
    folder: "개인",
    tags: ["여행"],
    blocks: doc(heading("여행 정보"), paragraph("장소 · 기간 · 동행"), heading("일정"), bullets(["첫째 날", "둘째 날"]), heading("준비물"), tasks(["예약 확인", "짐 챙기기"])),
  },
  {
    id: "ideas",
    category: "personal",
    title: "아이디어 보드",
    description: "아이디어를 빠르게 기록하고 발전시킵니다.",
    pageTitle: "아이디어 보드",
    folder: "개인",
    tags: ["아이디어"],
    blocks: doc(heading("떠오른 생각"), bullets(["아이디어 1", "아이디어 2"]), heading("더 알아볼 것"), tasks(["관련 자료 찾아보기"])),
  },
];

export function templatePlainText(template) {
  const text = [];
  const visit = (node) => {
    if (node.type === "text") text.push(node.text);
    node.content?.forEach(visit);
    if (["paragraph", "heading", "listItem", "taskItem"].includes(node.type)) text.push("\n");
  };
  visit(template.blocks);
  return text.join(" ").replace(/\s*\n\s*/g, "\n").trim();
}
