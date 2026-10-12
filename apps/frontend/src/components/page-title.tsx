interface PageTitleProps {
  title: string;
  description: string;
}

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-2 text-center sm:text-left major-mono text-foreground">
        {title.toUpperCase()}
      </h1>
      <p className="text-description mb-8 text-center sm:text-left major-mono text-lg">
        {description}
      </p>
    </div>
  );
}
