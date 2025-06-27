import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/header.tsx";
import { RepoList } from "./components/repo-list.tsx";
import About from "./components/about.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import {
  RepoDataProvider,
  useRepoDataContext,
} from "./context/repo-data-provider.tsx";
import { LoadingSkeleton } from "./components/skeleton.tsx";
import { PageContainer } from "./components/page-container.tsx";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RepoDataProvider>
        <Router>
          <Header></Header>
          <Routes>
            <Route path="/" element={<RepoDataConsumer />} />
            <Route
              path="/about"
              element={
                <PageContainer>
                  <About />
                </PageContainer>
              }
            />
          </Routes>
        </Router>
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
    <PageContainer>
      <RepoList></RepoList>
    </PageContainer>
  );
}
