import { LanguagesContainer } from "@/components/highlights/top-languages";
import { PageContainer } from "@/components/page-container.tsx";
import { SidebarLayout } from "@/components/app-sidebar.tsx";
import { KeywordsContainer } from "@/components/highlights/keywords";
import { TopicsByLanguageContainer } from "@/components/highlights/topics-by-language";
import { PageTitle } from "@/components/page-title";

export function DailyHighlight() {
  return (
    <PageContainer>
      <SidebarLayout>
        <div className="w-full flex flex-col justify-center items-center mx-auto p-4 sm:p-6 md:p-8">
          <PageTitle 
            title="Daily Highlights"
            description="Discover trending topics and programming languages"
          />
          <div className="w-full max-w-4xl">
            <div className="space-y-3">
              <KeywordsContainer />
              <LanguagesContainer />
              <TopicsByLanguageContainer />
            </div>
          </div>
        </div>
      </SidebarLayout>
    </PageContainer>
  );
}
