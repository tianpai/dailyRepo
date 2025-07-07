import { RepoList } from "@/components/repo-list.tsx";
import { useRepoDataContext } from "@/context/repo-data-provider.tsx";
import { LoadingSkeleton } from "@/components/skeleton.tsx";
import { PageContainer } from "@/components/page-container.tsx";
import { SidebarLayout } from "@/components/app-sidebar.tsx";

export function Homepage() {
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
    return <LoadingSkeleton />;
  }
  return <RepoList></RepoList>;
}
