"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AB_COOKIE_NAME, parseAbCookie } from "@/lib/ab";

type Props = {
  experiment: string;
  variant: string;
  children: ReactNode;
};

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function AbVariant({ experiment, variant, children }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const raw = getCookie(AB_COOKIE_NAME);
    const assignments = parseAbCookie(raw);
    setShow(assignments[experiment] === variant);
  }, [experiment, variant]);

  if (!show) return null;
  return <>{children}</>;
}
