// Static: the content is stable and needs no request-time data, so this page is prerendered at build time.
// Keep it free of cookies(), headers() and searchParams so it stays static.

import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description: "What DevCommunity is for and the guidelines everyone on the platform follows.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">About DevCommunity</h1>
        <p className="text-muted">
          DevCommunity brings developers together around shared interests. Join a community, read
          technical posts written by people who build software, and share what you have learned.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="prose-dev">
          <ul>
            <li>Communities group posts around a technology, such as React, Laravel or DevOps.</li>
            <li>
              You must join a community before you can publish a post in it. Joining is free.
            </li>
            <li>
              Posts are written in Markdown. Raw HTML is not rendered, so write content with
              Markdown syntax only.
            </li>
            <li>Bookmark posts to read them later from your bookmarks page.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Community guidelines</CardTitle>
        </CardHeader>
        <CardContent className="prose-dev">
          <ul>
            <li>Be respectful. Critique ideas and code, never the people who wrote them.</li>
            <li>Credit the sources you rely on, and only publish code you have the right to share.</li>
            <li>No spam, self-promotion disguised as tutorials, or unsolicited advertising.</li>
            <li>No harassment, hate speech, malware, or content that breaks the law.</li>
            <li>Keep comments on topic so that threads stay useful to the next reader.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reporting a problem</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            If you see content that breaks these guidelines, contact the site administrators. Include
            a link to the post or comment so they can review it quickly.
          </p>
        </CardContent>
      </Card>
    </article>
  );
}
