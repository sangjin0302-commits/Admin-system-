import type { ImgHTMLAttributes } from "react";

// Storybook stub for next/image — renders a plain img.
type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string };
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
};

export default function Image({ src, fill, priority, unoptimized, style, ...props }: ImageProps) {
  const resolved = typeof src === "string" ? src : src?.src ?? "";
  const fillStyle = fill
    ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: "cover" as const }
    : undefined;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={resolved} style={{ ...fillStyle, ...style }} {...props} />;
}
