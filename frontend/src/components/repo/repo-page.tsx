import { RepoList } from "@/components/repo/repo-list.tsx";
import { useRepoDataContext } from "@/components/repo/repo-data-provider";
import { PageContainer } from "@/components/page-container.tsx";
import { SidebarLayout } from "@/components/app-sidebar.tsx";
import { PageTitle } from "@/components/page-title";

export function RepoPage() {
  return (
    <PageContainer>
      <SidebarLayout>
        <RepoDataConsumer />
      </SidebarLayout>
    </PageContainer>
  );
}

function RepoDataConsumer() {
  const { loading } = useRepoDataContext();

  if (loading) {
    return <div>REPO LIST IS LOADING</div>;
  }
  return (
    <div className="w-full flex flex-col justify-center items-center mx-auto p-4 sm:p-6 md:p-8">
      <PageTitle
        title="Daily Trending"
        description="Discover the most trending repositories of the day"
      />
      <div className="w-full max-w-4xl">
        <RepoList />
      </div>
    </div>
  );
}
