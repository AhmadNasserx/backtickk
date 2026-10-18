// Imported only by client forms (post and profile), so it inherits their client boundary and needs no directive.
import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { CloseIcon } from "@/components/ui/icons";

export interface TagInputProps {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  /** Maximum number of chips. The input is disabled once it is reached. */
  max: number;
  placeholder?: string;
  /** Applied to each entry before it is added, e.g. lowercasing for post tags. */
  normalize?: (raw: string) => string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
}

const keepAsTyped = (raw: string) => raw;

/** Trims, normalises and de-duplicates (case-insensitively) entries, stopping at `max`. */
function mergeEntries(current: string[], raws: string[], normalize: (raw: string) => string, max: number): string[] {
  const next = [...current];
  for (const raw of raws) {
    const tag = normalize(raw.trim());
    if (!tag || next.length >= max) continue;
    if (next.some((existing) => existing.toLowerCase() === tag.toLowerCase())) continue;
    next.push(tag);
  }
  return next;
}

/** Chips typed with Enter or comma (pasted lists split too). Backspace on an empty input removes the last chip. */
export function TagInput({
  id,
  value,
  onChange,
  max,
  placeholder,
  normalize = keepAsTyped,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const full = value.length >= max;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    if (!text.includes(",")) {
      setDraft(text);
      return;
    }
    const parts = text.split(",");
    const rest = parts.pop() ?? "";
    onChange(mergeEntries(value, parts, normalize, max));
    setDraft(rest);
  }

  function commitDraft() {
    if (!draft.trim()) {
      setDraft("");
      return;
    }
    onChange(mergeEntries(value, [draft], normalize, max));
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      // Enter adds the chip instead of submitting the surrounding form.
      event.preventDefault();
      commitDraft();
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
    inputRef.current?.focus();
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2 py-1.5 transition-colors hover:border-subtle focus-within:ring-2 focus-within:ring-brand has-[[aria-invalid=true]]:border-danger"
    >
      {value.map((tag, index) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-brand/15 py-0.5 pr-1 pl-2 text-xs font-medium text-fg ring-1 ring-brand/40 ring-inset"
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label={`Remove ${tag}`}
            className="rounded p-0.5 text-muted transition-colors hover:bg-surface hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <CloseIcon className="size-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        disabled={full}
        placeholder={value.length === 0 ? placeholder : undefined}
        autoComplete="off"
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm text-fg outline-none placeholder:text-subtle disabled:cursor-not-allowed"
      />
    </div>
  );
}
