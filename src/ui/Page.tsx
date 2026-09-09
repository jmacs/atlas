type PageHeaderProps = {
  description?: string;
  title: string;
};

export function PageHeader({description, title}: PageHeaderProps) {
  return (
    <header class="mb-10 max-w-2xl">
      <h1 class="type-heading-1 sm:type-display">{title}</h1>
      {description ? <p class="type-body mt-3 text-muted">{description}</p> : null}
    </header>
  );
}
