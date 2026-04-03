type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "ui:h-8 ui:w-8 ui:text-xs",
  md: "ui:h-10 ui:w-10 ui:text-sm",
  lg: "ui:h-12 ui:w-12 ui:text-base",
};

export function Avatar({
  src,
  alt = "",
  initials,
  size = "md",
  className = "",
}: AvatarProps) {
  const base = `ui:inline-flex ui:items-center ui:justify-center ui:rounded-full ui:overflow-hidden ui:shrink-0 ${sizeClasses[size]} ${className}`;

  if (src) {
    return <img src={src} alt={alt} className={base} />;
  }

  return (
    <span
      className={`${base} ui:bg-indigo-100 ui:font-medium ui:text-indigo-600 dark:ui:bg-indigo-900/40 dark:ui:text-indigo-400`}
    >
      {initials || "?"}
    </span>
  );
}
