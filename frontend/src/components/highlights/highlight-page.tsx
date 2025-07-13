import { LanguagesContainer } from "@/components/highlights/top-languages";
import { PageContainer } from "@/components/page-container.tsx";
import { SidebarLayout } from "@/components/app-sidebar.tsx";
import { KeywordsContainer } from "@/components/highlights/keywords";

export function DailyHighlight() {
  return (
    <PageContainer>
      <SidebarLayout>
        <div className="w-full">
          <div className="mb-6 flex flex-col justify-center items-start">
            <h1 className="text-3xl font-bold mb-2">Daily Highlights</h1>
            <p className="text-gray-400">
              Discover trending topics and programming languages
            </p>
          </div>
          <div className="w-full">
            <div className="space-y-8">
              <KeywordsContainer />
              <LanguagesContainer />
            </div>
          </div>
        </div>
      </SidebarLayout>
    </PageContainer>
  );
}
