"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback } from "react";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichMemoEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[120px] p-3 focus:outline-none",
      },
    },
  });

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]);
  const toggleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-gray-300 bg-white overflow-hidden">
      <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <button type="button" onClick={toggleBold} className={`rounded px-2 py-1 text-xs font-bold hover:bg-gray-200 ${editor.isActive("bold") ? "bg-gray-200" : ""}`}>B</button>
        <button type="button" onClick={toggleItalic} className={`rounded px-2 py-1 text-xs italic hover:bg-gray-200 ${editor.isActive("italic") ? "bg-gray-200" : ""}`}>I</button>
        <div className="mx-1 h-4 w-px bg-gray-300" />
        <button type="button" onClick={toggleBulletList} className={`rounded px-2 py-1 text-xs hover:bg-gray-200 ${editor.isActive("bulletList") ? "bg-gray-200" : ""}`}>• 목록</button>
        <button type="button" onClick={toggleOrderedList} className={`rounded px-2 py-1 text-xs hover:bg-gray-200 ${editor.isActive("orderedList") ? "bg-gray-200" : ""}`}>1. 번호</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
