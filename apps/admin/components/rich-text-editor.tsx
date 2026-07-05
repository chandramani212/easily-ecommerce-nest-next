"use client";

import { useEffect, useRef } from "react";

/**
 * Minimal, dependency-free rich text editor built on `contentEditable` +
 * `document.execCommand`. Emits an HTML string. Good enough for basic CMS
 * content (headings, bold/italic, lists, links); not a full WYSIWYG.
 */
export function RichTextEditor({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Seed the editor once on mount. After that the DOM is the source of truth so
  // we don't fight the cursor by re-writing innerHTML on every keystroke.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    ref.current?.focus();
    sync();
  };

  const addLink = () => {
    const url = window.prompt("Link URL (e.g. /#shop or https://…)");
    if (url) exec("createLink", url);
  };

  const Btn = ({
    onClick,
    children,
    title,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      title={title}
      // Keep the editor's selection alive when clicking a toolbar button.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="min-w-7 rounded px-2 py-1 text-xs font-medium text-[var(--admin-fg)]/80 hover:bg-[var(--admin-muted)]"
    >
      {children}
    </button>
  );

  return (
    <div>
      {label && (
        <label className="mb-1 block text-xs font-medium text-[var(--admin-fg)]/70">
          {label}
        </label>
      )}
      <div className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] focus-within:border-[var(--admin-accent)]">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--admin-border)] bg-[var(--admin-muted)]/40 px-1.5 py-1">
          <Btn title="Heading" onClick={() => exec("formatBlock", "H2")}>
            H2
          </Btn>
          <Btn title="Subheading" onClick={() => exec("formatBlock", "H3")}>
            H3
          </Btn>
          <Btn title="Paragraph" onClick={() => exec("formatBlock", "P")}>
            ¶
          </Btn>
          <span className="mx-1 h-4 w-px bg-[var(--admin-border)]" />
          <Btn title="Bold" onClick={() => exec("bold")}>
            <strong>B</strong>
          </Btn>
          <Btn title="Italic" onClick={() => exec("italic")}>
            <em>I</em>
          </Btn>
          <Btn title="Underline" onClick={() => exec("underline")}>
            <span className="underline">U</span>
          </Btn>
          <span className="mx-1 h-4 w-px bg-[var(--admin-border)]" />
          <Btn title="Bulleted list" onClick={() => exec("insertUnorderedList")}>
            • List
          </Btn>
          <Btn title="Numbered list" onClick={() => exec("insertOrderedList")}>
            1. List
          </Btn>
          <Btn title="Link" onClick={addLink}>
            Link
          </Btn>
          <Btn title="Clear formatting" onClick={() => exec("removeFormat")}>
            Clear
          </Btn>
        </div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          className="min-h-[140px] px-3 py-2 text-sm outline-none [&_a]:text-[var(--admin-accent)] [&_a]:underline [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5"
        />
      </div>
    </div>
  );
}
