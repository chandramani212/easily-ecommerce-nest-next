import { Avatar } from "@repo/ui/avatar";

interface TestimonialCardProps {
  name: string;
  role: string;
  initials: string;
  quote: string;
  rating: number;
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i < count ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          className={i < count ? "text-amber-400" : "text-neutral-300"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialCard({
  name,
  role,
  initials,
  quote,
  rating,
}: TestimonialCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
      <Stars count={rating} />
      <p className="flex-1 text-sm leading-relaxed text-[var(--foreground)]/70">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3 border-t border-[var(--border)] pt-4">
        <Avatar initials={initials} size="sm" />
        <div>
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-[var(--foreground)]/50">{role}</p>
        </div>
      </div>
    </div>
  );
}
