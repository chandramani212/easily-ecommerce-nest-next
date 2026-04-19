interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className="mb-10 text-center">
      <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
        {title}
      </h2>
      <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-[var(--accent)]" />
      {subtitle && (
        <p className="mt-3 text-sm text-[var(--foreground)]/50 sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}
