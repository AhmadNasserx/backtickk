// Server component: markdown is parsed on the server. Raw HTML is skipped (no rehype-raw), so authors cannot inject markup.
import Image from "next/image";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import Markdown, { type Components } from "react-markdown";
import { cn } from "@/lib/utils";

export type MarkdownContentProps = {
  content: string;
  className?: string;
};

const EXTERNAL_URL = /^(https?:)?\/\//i;

function MarkdownLink({ href, children }: ComponentPropsWithoutRef<"a">) {
  if (!href) return <>{children}</>;
  if (EXTERNAL_URL.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow">
        {children}
      </a>
    );
  }
  if (href.startsWith("/")) {
    return <Link href={href}>{children}</Link>;
  }
  return <a href={href}>{children}</a>;
}

function MarkdownImage({ src, alt }: ComponentPropsWithoutRef<"img">) {
  if (typeof src !== "string" || !src) return null;
  // Remote images are not in a configured loader, so they are served as-is, as with avatars.
  return (
    <Image
      src={src}
      alt={alt ?? ""}
      width={1200}
      height={675}
      unoptimized
      className="h-auto w-full rounded-lg border border-line"
    />
  );
}

const components: Components = {
  a: MarkdownLink,
  img: MarkdownImage,
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("prose-dev", className)}>
      <Markdown skipHtml components={components}>
        {content}
      </Markdown>
    </div>
  );
}
