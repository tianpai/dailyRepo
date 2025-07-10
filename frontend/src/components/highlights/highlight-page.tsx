import { type ReactNode } from "react";
import { LanguagesContainer } from "@/components/repo/top-languages";
import { PageContainer } from "@/components/page-container.tsx";
import { SidebarLayout } from "@/components/app-sidebar.tsx";
import { KeywordsContainer } from "@/components/highlights/keywords";

export function DailyHighlightContainer({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      {children}
    </div>
  );
}

export function DailyHighlight() {
  return (
    <PageContainer>
      <SidebarLayout>
        <DailyHighlightContainer className="w-full">
          <KeywordsContainer />
          <LanguagesContainer />
        </DailyHighlightContainer>
      </SidebarLayout>
    </PageContainer>
  );
}
