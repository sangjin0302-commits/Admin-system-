"use client";
import { useState, useEffect } from "react";

interface Props { onInsert: (content: string) => void; }

interface Template { id: string; title: string; content: string; }

export function MemoTemplatePicker({ onInsert }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/memo-templates").then(r => r.json()).then(d => setTemplates(d.templates || []));
  }, []);

  if (templates.length === 0) return null;

  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen(!open)} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
        📋 템플릿
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-52 rounded-lg border bg-white shadow-lg">
          {templates.map((t) => (
            <button key={t.id} type="button" onClick={() => { onInsert(t.content); setOpen(false); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
              {t.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
