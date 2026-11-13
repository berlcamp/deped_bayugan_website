export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] font-extrabold leading-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
