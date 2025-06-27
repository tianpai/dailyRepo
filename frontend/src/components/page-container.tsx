import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <div className={`px-4 sm:px-6 lg:px-8 pt-25 ${className}`}>
      <div className="max-w-3xl mx-auto">{children}</div>
    </div>
  );
}
