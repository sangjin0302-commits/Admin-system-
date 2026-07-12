"use client";
import { useState, useEffect, useRef } from "react";

export function SmartSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
      setOpen(true);
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="이름, 전화, 이메일로 검색..."
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border bg-white shadow-lg">
          {results.map((r: any) => (
            <a key={r.id} href={`/admin/inquiries/${r.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50">
              <div>
                <span className="font-semibold">{r.name}</span>
                <span className="ml-2 text-text-muted">{r.phone || r.email}</span>
              </div>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{r.status}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
