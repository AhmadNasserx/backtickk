// Static: the content is stable and needs no request-time data, so this page is prerendered at build time.
// Keep it free of cookies(), headers() and searchParams so it stays static.

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "About",
  description: "What DevCommunity is for and the guidelines everyone on the platform follows.",
};

const HOW_IT_WORKS = [
  "Communities group posts around a technology, such as React, Laravel or DevOps.",
  "You must join a community before you can publish a post in it. Joining is free.",
  "Posts are written in Markdown. Raw HTML is not rendered, so write content with Markdown syntax only.",
  "Bookmark posts to read them later from your bookmarks page.",
];

const GUIDELINES = [
  "Be respectful. Critique ideas and code, never the people who wrote them.",
  "Credit the sources you rely on, and only publish code you have the right to share.",
  "No spam, self-promotion disguised as tutorials, or unsolicited advertising.",
  "No harassment, hate speech, malware, or content that breaks the law.",
  "Keep comments on topic so that threads stay useful to the next reader.",
];

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid grid-cols-1 gap-4 border-t border-line pt-8 sm:grid-cols-[4rem_1fr] sm:gap-6"
    >
      <p className="font-mono text-sm text-subtle">{number}</p>
      <div className="flex min-w-0 max-w-2xl flex-col gap-5">
        <h2 id={id} className="font-display text-3xl tracking-tight text-balance text-fg">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Rules({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-3 text-[17px] leading-relaxed text-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-3 h-px w-3 shrink-0 bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AboutPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-12">
      <header className="flex flex-col gap-5">
        <p className="eyebrow">About &amp; guidelines</p>
        <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-balance text-fg sm:text-6xl">
          A home for developers who <em className="italic text-accent">build</em> in the open.
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted">
          DevCommunity brings developers together around shared interests. Join a community, read
          technical posts written by people who build software, and share what you have learned.
        </p>
      </header>

      <Section id="how-it-works" number="01" title="How it works">
        <Rules items={HOW_IT_WORKS} />
      </Section>

      <Section id="guidelines" number="02" title="Community guidelines">
        <Rules items={GUIDELINES} />
      </Section>

      <Section id="reporting" number="03" title="Reporting a problem">
        <p className="text-[17px] leading-relaxed text-muted">
          If you see content that breaks these guidelines, contact the site administrators. Include
          a link to the post or comment so they can review it quickly.
        </p>
      </Section>
    </article>
  );
}
