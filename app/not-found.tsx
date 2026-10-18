import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <p className="text-sm font-semibold tracking-wide text-brand uppercase">Error 404</p>
      <h1 className="text-3xl font-semibold tracking-tight text-fg">Page not found</h1>
      <p className="text-muted">
        The page you are looking for may have moved, or it never existed.
      </p>
      <Link href="/" className={buttonClasses("primary", "md", "mt-2")}>
        Back to home
      </Link>
    </div>
  );
}
