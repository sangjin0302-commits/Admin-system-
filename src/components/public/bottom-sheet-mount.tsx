"use client";

import { usePathname } from "next/navigation";

import {
  BottomSheetConsultProvider,
} from "@/components/public/bottom-sheet-consult";
import { BottomSheetTrigger } from "@/components/public/bottom-sheet-trigger";

/**
 * Site-wide mount for the mobile consult bottom sheet + trigger.
 * Excluded on /admin and /portal paths.
 */
export function BottomSheetMount() {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) {
    return null;
  }
  return (
    <BottomSheetConsultProvider>
      <BottomSheetTrigger />
    </BottomSheetConsultProvider>
  );
}
