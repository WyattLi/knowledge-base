"use client";

import { useRef } from "react";

interface Props {
  onInsert: (text: string) => void;
  onImageUploading?: (uploading: boolean) => void;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
}

function ToolBtn({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="px-2 py-1 text-xs text-text-muted hover:text-text-primary hover:bg-white/5 rounded transition-colors"
    >
      {label}
    </button>
  );
}

export function EditorToolbar({ onInsert, onImageUploading, editorRef }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const getEditor = () => editorRef.current;

  const insertAtCursor = (text: string) => {
    const ta = getEditor();
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newText = ta.value.slice(0, start) + text + ta.value.slice(end);
    onInsert(newText);
    setTimeout(() => {
      const el = getEditor();
      if (el) {
        el.focus();
        const newPos = start + text.length;
        el.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  const wrapSelection = (before: string, after: string, placeholder: string) => {
    const ta = getEditor();
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end) || placeholder;
    const newText = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
    onInsert(newText);
    setTimeout(() => {
      const el = getEditor();
      if (el) {
        el.focus();
        const newPos = start + before.length + selected.length + after.length;
        el.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageUploading?.(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        insertAtCursor(`\n![图片](${data.url})\n`);
      }
    } catch { /* ignore */ }
    onImageUploading?.(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-white/5">
      <ToolBtn label="B" title="粗体 (Ctrl+B)" onClick={() => wrapSelection("**", "**", "粗体")} />
      <ToolBtn label="I" title="斜体 (Ctrl+I)" onClick={() => wrapSelection("*", "*", "斜体")} />
      <ToolBtn label="H" title="标题" onClick={() => {
        const ta = getEditor();
        if (!ta) return;
        const lineStart = ta.value.lastIndexOf("\n", ta.selectionStart - 1) + 1;
        const newVal = ta.value.slice(0, lineStart) + "## " + ta.value.slice(lineStart);
        onInsert(newVal);
      }} />
      <span className="w-px h-4 bg-white/10 mx-1" />
      <ToolBtn label="🔗" title="链接" onClick={() => wrapSelection("[", "](url)", "链接文本")} />
      <ToolBtn
        label="🖼"
        title="插入图片"
        onClick={() => fileRef.current?.click()}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <ToolBtn label="&lt;/&gt;" title="行内代码" onClick={() => wrapSelection("`", "`", "code")} />
    </div>
  );
}
