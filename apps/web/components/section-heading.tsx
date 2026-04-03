interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className="mb-10 text-center">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {subtitle && (
        <p className="mt-2 text-sm text-[var(--foreground)]/50 sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}
