import { LanguagesContainer } from "@/components/highlights/top-languages";
import { PageContainer } from "@/components/page-container.tsx";
import { SidebarLayout } from "@/components/app-sidebar.tsx";
import { KeywordsContainer } from "@/components/highlights/keywords";
import { TopicsByLanguageContainer } from "@/components/highlights/topics-by-language";

export function DailyHighlight() {
  return (
    <PageContainer>
      <SidebarLayout>
        <div className="w-full flex flex-col justify-center items-center mx-auto p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold mb-2 text-center sm:text-left">
              Daily Highlights
            </h1>
            <p className="text-gray-400 mb-8 text-center sm:text-left">
              Discover trending topics and programming languages
            </p>
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
