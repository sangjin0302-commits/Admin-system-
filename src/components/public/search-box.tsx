"use client";

import { Search } from "lucide-react";
import { useState } from "react";

type Props = {
  placeholder?: string;
  onSearch: (q: string) => void;
};

export function SearchBox({ placeholder = "검색", onSearch }: Props) {
  const [q, setQ] = useState("");

  return (
    <div className="relative mx-auto max-w-md">
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          onSearch(e.target.value);
        }}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-gold/40 bg-surface pl-11 pr-4 text-sm focus:border-gold focus:outline-none"
      />
      <Search className="absolute left-4 top-3 h-5 w-5 text-text-muted" />
    </div>
  );
}
