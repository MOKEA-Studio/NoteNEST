import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  Check,
  CheckSquare,
  Code2,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  X,
} from "lucide-react";
import { uploadsApi } from "../api";

function pageDocument(page) {
  if (page.blocks?.type === "doc") return page.blocks;
  if (!page.content) return { type: "doc", content: [{ type: "paragraph" }] };
  return {
    type: "doc",
    content: page.content.split(/\n+/).map((text) => ({
      type: "paragraph",
      content: text ? [{ type: "text", text }] : undefined,
    })),
  };
}

function ToolButton({ active, disabled = false, label, onClick, children }) {
  return (
    <button
      className={`format-button ${active ? "is-active" : ""}`}
      type="button"
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function FormatToolbar({ editor, uploading, onImage }) {
  const imageInputRef = useRef(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  if (!editor) return <div className="format-toolbar" aria-hidden="true" />;

  function openLinkEditor() {
    setLinkValue(editor.getAttributes("link").href ?? "");
    setLinkOpen(true);
  }

  function applyLink(event) {
    event.preventDefault();
    const url = linkValue.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkOpen(false);
  }

  return (
    <div className="format-toolbar" role="toolbar" aria-label="블록 및 Markdown 도구">
      <div className="format-group">
        <ToolButton label="실행 취소" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={16} />
        </ToolButton>
        <ToolButton label="다시 실행" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={16} />
        </ToolButton>
      </div>

      <div className="format-group">
        <ToolButton label="왼쪽 정렬" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft size={16} />
        </ToolButton>
        <ToolButton label="가운데 정렬" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter size={16} />
        </ToolButton>
        <ToolButton label="오른쪽 정렬" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight size={16} />
        </ToolButton>
        <ToolButton label="양쪽 정렬" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <AlignJustify size={16} />
        </ToolButton>
      </div>

      <div className="format-group">
        <ToolButton label="본문" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          <Pilcrow size={16} />
        </ToolButton>
        <ToolButton label="제목 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={17} />
        </ToolButton>
        <ToolButton label="제목 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={17} />
        </ToolButton>
        <ToolButton label="글머리 목록" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={17} />
        </ToolButton>
        <ToolButton label="번호 목록" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={17} />
        </ToolButton>
        <ToolButton label="할 일" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <CheckSquare size={16} />
        </ToolButton>
        <ToolButton label="인용" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </ToolButton>
        <ToolButton label="코드 블록" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Braces size={16} />
        </ToolButton>
      </div>

      <div className="format-group">
        <ToolButton label="굵게" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolButton>
        <ToolButton label="기울임" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolButton>
        <ToolButton label="밑줄" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </ToolButton>
        <ToolButton label="취소선" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={16} />
        </ToolButton>
        <ToolButton label="인라인 코드" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code2 size={16} />
        </ToolButton>
        <ToolButton label="링크" active={editor.isActive("link")} onClick={openLinkEditor}>
          <Link2 size={16} />
        </ToolButton>
        {linkOpen && (
          <form className="toolbar-link-form" aria-label="링크 주소 입력" onSubmit={applyLink}>
            <label><span className="sr-only">링크 주소</span><input autoFocus value={linkValue} placeholder="https://" onChange={(event) => setLinkValue(event.target.value)} /></label>
            <button type="submit" aria-label="링크 적용" title="링크 적용"><Check size={14} /></button>
            <button type="button" aria-label="링크 입력 취소" title="취소" onClick={() => setLinkOpen(false)}><X size={14} /></button>
          </form>
        )}
      </div>

      <div className="format-group">
        <ToolButton label="구분선" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={17} />
        </ToolButton>
        <ToolButton label="이미지 업로드" disabled={uploading} onClick={() => imageInputRef.current?.click()}>
          <ImagePlus size={17} />
        </ToolButton>
        <input
          ref={imageInputRef}
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImage(file);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

export default function BlockEditor({ page, onChange }) {
  const onChangeRef = useRef(onChange);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  async function uploadIntoEditor(editor, file) {
    setUploading(true);
    setUploadError("");
    try {
      const asset = await uploadsApi.upload(file, "image");
      editor.chain().focus().setImage({ src: asset.url, alt: asset.name }).run();
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "생각을 자유롭게 적어보세요..." }),
    ],
    content: pageDocument(page),
    editorProps: {
      attributes: {
        class: "block-editor-content",
        "aria-label": "페이지 블록 편집기",
      },
      handleDrop(view, event) {
        const file = Array.from(event.dataTransfer?.files ?? []).find((item) => item.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        setUploading(true);
        setUploadError("");
        uploadsApi.upload(file, "image")
          .then((asset) => {
            const node = view.state.schema.nodes.image.create({ src: asset.url, alt: asset.name });
            view.dispatch(view.state.tr.replaceSelectionWith(node));
          })
          .catch((error) => setUploadError(error.message))
          .finally(() => setUploading(false));
        return true;
      },
      handlePaste(view, event) {
        const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        setUploading(true);
        setUploadError("");
        uploadsApi.upload(file, "image")
          .then((asset) => {
            const node = view.state.schema.nodes.image.create({ src: asset.url, alt: asset.name });
            view.dispatch(view.state.tr.replaceSelectionWith(node));
          })
          .catch((error) => setUploadError(error.message))
          .finally(() => setUploading(false));
        return true;
      },
    },
    onUpdate({ editor: currentEditor }) {
      onChangeRef.current({
        blocks: currentEditor.getJSON(),
        content: currentEditor.getText({ blockSeparator: "\n" }),
      });
    },
  }, [page.id]);

  return (
    <>
      <FormatToolbar
        editor={editor}
        uploading={uploading}
        onImage={(file) => uploadIntoEditor(editor, file)}
      />
      {uploadError && <div className="asset-error" role="alert">{uploadError}</div>}
      <EditorContent editor={editor} />
    </>
  );
}
