import type { AnchorHTMLAttributes, PropsWithChildren } from "react";

// Storybook stub for next/link — renders a plain anchor.
type LinkProps = PropsWithChildren<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string | { pathname?: string } }
>;

export default function Link({ href, children, ...props }: LinkProps) {
  const resolved = typeof href === "string" ? href : href?.pathname ?? "#";
  return (
    <a href={resolved} {...props}>
      {children}
    </a>
  );
}
