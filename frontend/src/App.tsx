import "./App.css";
import { Header } from "./components/header.tsx";
import { RepoList } from "./components/repo-list.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import {
  RepoDataProvider,
  useRepoDataContext,
} from "./context/repo-data-provider.tsx";
import { LoadingSkeleton } from "./components/skeleton.tsx";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Header></Header>
      <RepoDataProvider>
        <RepoDataConsumer />
      </RepoDataProvider>
    </ThemeProvider>
  );
}

function RepoDataConsumer() {
  const { loading } = useRepoDataContext();

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="pt-25 px-4">
      <RepoList></RepoList>
    </div>
  );
}
