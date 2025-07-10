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
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="space-y-8">{children}</div>
    </div>
  );
}

export function DailyHighlight() {
  return (
    <PageContainer>
      <SidebarLayout>
        <div className="min-h-screen ">
          <div className="pt-8 pb-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Daily Highlights</h1>
              <p className="text-gray-400">
                Discover trending topics and programming languages
              </p>
            </div>
            <DailyHighlightContainer>
              <KeywordsContainer />
              <LanguagesContainer />
            </DailyHighlightContainer>
          </div>
        </div>
      </SidebarLayout>
    </PageContainer>
  );
}
