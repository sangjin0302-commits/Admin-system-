"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export function NewInquiryBadge({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);
  const [prevCount, setPrevCount] = useState(initialCount);

  useEffect(() => {
    if (count > prevCount && prevCount > 0) {
      toast(`새 문의 ${count - prevCount}건 접수`, { icon: "📩", duration: 5000 });
    }
    setPrevCount(count);
  }, [count, prevCount]);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  if (count === 0) return null;

  return (
    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white animate-pulse">
      {count > 99 ? "99+" : count}
    </span>
  );
}
