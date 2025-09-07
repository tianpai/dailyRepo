import { LanguagesContainer } from "@/components/highlights/top-languages";
import { PageContainer } from "@/components/page-container.tsx";
import { SidebarLayout } from "@/components/app-sidebar.tsx";
import { KeywordsContainer } from "@/components/highlights/keywords";
import { TopicsByLanguageContainer } from "@/components/highlights/topics-by-language";
import { TopDevelopersContainer } from "@/components/highlights/top-developers";
import { PageTitle } from "@/components/page-title";
import { TimeTo300StarsSummaryCard } from "@/components/highlights/time-to-300-stars";

export function DailyHighlight() {
  return (
    <PageContainer>
      <SidebarLayout>
        <div className="w-full flex flex-col justify-center items-center mx-auto p-4 sm:p-6 md:p-8">
          <PageTitle
            title="highlights"
            description="Discover trending topics and programming languages"
          />
          <div className="w-full max-w-4xl">
            <div className="space-y-3">
              <TimeTo300StarsSummaryCard />
              <KeywordsContainer />
              <TopDevelopersContainer />
              <LanguagesContainer />
              <TopicsByLanguageContainer />
            </div>
          </div>
        </div>
      </SidebarLayout>
    </PageContainer>
  );
}
