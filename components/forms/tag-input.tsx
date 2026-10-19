// Imported only by client forms (post and profile), so it inherits their client boundary and needs no directive.
import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { XIcon } from "@/components/ui/icons";

export interface TagInputProps {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  /** Maximum number of chips. The input is disabled once it is reached. */
  max: number;
  placeholder?: string;
  /** Applied to each entry before it is added, e.g. lowercasing for post tags. */
  normalize?: (raw: string) => string;
  /** Drawn before each chip, e.g. "#" for post tags. Display only; the stored value has no prefix. */
  chipPrefix?: string;
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
  chipPrefix,
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
      className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-2 py-1.5 transition-colors hover:border-line-strong focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/40 has-[[aria-invalid=true]]:border-danger"
    >
      {value.map((tag, index) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 rounded-md border border-line bg-surface-3 py-0.5 pr-0.5 pl-2 font-mono text-xs text-fg"
        >
          {chipPrefix ? (
            <span aria-hidden="true" className="text-accent">
              {chipPrefix}
            </span>
          ) : null}
          {tag}
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label={`Remove ${tag}`}
            className="inline-flex size-8 items-center justify-center rounded text-muted transition-colors hover:bg-surface hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:size-6"
          >
            <XIcon className="size-3.5" />
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
        className="h-8 min-w-24 flex-1 bg-transparent px-1 text-sm text-fg outline-none placeholder:text-subtle disabled:cursor-not-allowed"
      />
    </div>
  );
}
