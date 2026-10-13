export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
