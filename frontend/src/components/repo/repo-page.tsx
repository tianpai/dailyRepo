import { RepoList } from "@/components/repo/repo-list.tsx";
import { useRepoDataContext } from "@/components/repo/repo-data-provider";
import { LoadingSkeleton } from "@/components/skeleton.tsx";
import { PageContainer } from "@/components/page-container.tsx";
import { SidebarLayout } from "@/components/app-sidebar.tsx";
import { RepoStarGraph } from "./repo-star-graph";

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
    return <LoadingSkeleton />;
  }
  return (
    <div className="flex flex-col gap-1 m-5">
      <RepoStarGraph />
      <RepoList></RepoList>
    </div>
  );
}
