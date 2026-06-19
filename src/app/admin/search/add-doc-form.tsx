"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddDocForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vector-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          metadata: {
            title: title || "Untitled",
            tags: tags || "",
            createdAt: new Date().toISOString(),
          },
        }),
      });
      if (!res.ok) throw new Error("failed");
      setContent("");
      setTitle("");
      setTags("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-text-strong">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="ui-input mt-1 w-full"
          placeholder="Document title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-strong">Tags</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="ui-input mt-1 w-full"
          placeholder="comma,separated,tags"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-strong">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="ui-input mt-1 w-full"
          placeholder="Document content to embed and index"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !content.trim()}
        className="ui-button-primary"
      >
        {submitting ? "Adding..." : "Add Document"}
      </button>
    </form>
  );
}
