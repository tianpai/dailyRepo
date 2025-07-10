import { type ReactNode } from "react";
import { LanguagesContainer } from "@/components/highlights/top-languages";
import { PageContainer } from "@/components/page-container.tsx";
import { SidebarLayout } from "@/components/app-sidebar.tsx";
import { KeywordsContainer } from "@/components/highlights/keywords";

export function DailyHighlightContainer({
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full flex flex-col gap-2 items-center h-full">
      {children}
    </div>
  );
}

export function DailyHighlight() {
  return (
    <PageContainer>
      <SidebarLayout>
        <DailyHighlightContainer>
          <KeywordsContainer />
          <LanguagesContainer />
        </DailyHighlightContainer>
      </SidebarLayout>
    </PageContainer>
  );
}
