// Server Component: the logos are static markup and the loop is pure CSS (the "Logo marquee" block in app/globals.css).
import { TechLogo } from "@/components/ui/tech-logo";

const TECHNOLOGIES = [
  { slug: "react", name: "React" },
  { slug: "nextdotjs", name: "Next.js" },
  { slug: "typescript", name: "TypeScript" },
  { slug: "javascript", name: "JavaScript" },
  { slug: "nodedotjs", name: "Node.js" },
  { slug: "python", name: "Python" },
  { slug: "go", name: "Go" },
  { slug: "rust", name: "Rust" },
  { slug: "php", name: "PHP" },
  { slug: "laravel", name: "Laravel" },
  { slug: "tailwindcss", name: "Tailwind CSS" },
  { slug: "vuedotjs", name: "Vue.js" },
  { slug: "svelte", name: "Svelte" },
  { slug: "angular", name: "Angular" },
  { slug: "astro", name: "Astro" },
  { slug: "graphql", name: "GraphQL" },
  { slug: "postgresql", name: "PostgreSQL" },
  { slug: "mongodb", name: "MongoDB" },
  { slug: "redis", name: "Redis" },
  { slug: "docker", name: "Docker" },
  { slug: "kubernetes", name: "Kubernetes" },
  { slug: "vercel", name: "Vercel" },
  { slug: "git", name: "Git" },
  { slug: "github", name: "GitHub" },
];

/**
 * One copy of the row. The logo is hidden from assistive tech because the name is printed beside it.
 * The duplicate copy is hidden from assistive tech as a whole.
 */
function LogoSet({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <ul className="tech-marquee-set" aria-hidden={duplicate || undefined}>
      {TECHNOLOGIES.map((tech) => (
        <li key={tech.slug} className="flex items-center gap-2.5 whitespace-nowrap">
          <span aria-hidden="true" className="flex">
            <TechLogo slug={tech.slug} className="size-6" />
          </span>
          <span className="font-mono text-sm text-muted">{tech.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function TechMarquee() {
  return (
    <section aria-labelledby="tech-marquee-label" className="flex flex-col gap-5">
      <p id="tech-marquee-label" className="eyebrow">
        Built for the stack you ship with
      </p>
      {/* Paused while hovered or focused inside, so a reader can stop on a logo. */}
      <div className="tech-marquee">
        <div className="tech-marquee-track">
          <LogoSet />
          <LogoSet duplicate />
        </div>
      </div>
    </section>
  );
}
