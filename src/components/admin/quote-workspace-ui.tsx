"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text-strong">{label}</p>
      {children}
    </div>
  );
}

export function CollapsibleSection({
  id,
  title,
  description,
  open,
  onToggle,
  children
}: {
  id?: string;
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="p-6 scroll-mt-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="ui-section-title">{title}</h3>
          <p className="mt-2 text-sm text-text-muted">{description}</p>
        </div>
        <Button variant="secondary" onClick={onToggle}>
          {open ? "접기" : "펼쳐서 보기"}
        </Button>
      </div>
      {open ? <div className="mt-5">{children}</div> : null}
    </Card>
  );
}

export function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <Card muted className="p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-sm font-medium text-text-strong">{value}</p>
    </Card>
  );
}

export function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text">
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}

export function DocumentBlock({
  title,
  content,
  compact = false
}: {
  title: string;
  content: string;
  compact?: boolean;
}) {
  return (
    <Card muted className={compact ? "p-4" : "p-5"}>
      <p className="ui-kicker">{title}</p>
      <pre className="mt-3 whitespace-pre-wrap text-sm text-text">{content}</pre>
    </Card>
  );
}

export function MessageCard({ title, message, onCopy }: { title: string; message: string; onCopy: () => void }) {
  return (
    <Card muted className="p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-text-strong">{title}</p>
        <Button size="sm" variant="secondary" onClick={onCopy}>
          복사
        </Button>
      </div>
      <pre className="mt-3 whitespace-pre-wrap text-sm text-text">{message}</pre>
    </Card>
  );
}
