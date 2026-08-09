import { FileText } from "lucide-react";

export default function PageGlyph({ page, size = 18 }) {
  const icon = page?.icon ?? "";
  const isImage = /^(https?:)?\/\//.test(icon) || icon.startsWith("/");

  return (
    <span className="page-glyph" style={{ "--glyph-size": `${size}px` }} aria-hidden="true">
      {isImage ? <img src={icon} alt="" /> : icon || <FileText size={size} strokeWidth={1.7} />}
    </span>
  );
}
