import { LanguagesContainer } from "@/components/highlights/top-languages";
import { PageContainer } from "@/components/page-container.tsx";
import { SidebarLayout } from "@/components/app-sidebar.tsx";
import { KeywordsContainer } from "@/components/highlights/keywords";

export function DailyHighlight() {
  return (
    <PageContainer>
      <SidebarLayout>
        <div className="w-full flex flex-col justify-center items-center mx-auto">
          <h1 className="text-3xl font-bold mb-2">Daily Highlights</h1>
          <p className="text-gray-400">
            Discover trending topics and programming languages
          </p>
          <KeywordsContainer />
          <div className="space-y-8 w-full ">
            <LanguagesContainer />
          </div>
        </div>
      </SidebarLayout>
    </PageContainer>
  );
}
