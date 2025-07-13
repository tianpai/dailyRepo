import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/header.tsx";
import { About } from "./components/about.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { DateProvider } from "./components/date-provider.tsx";
import { RepoDataProvider } from "./components/repo/repo-data-provider.tsx";
import { PageContainer } from "./components/page-container.tsx";
import { RepoPage } from "./components/repo/repo-page.tsx";
import { DeveloperPage } from "./components/developers/developer-page.tsx";
import { SidebarLayout } from "./components/app-sidebar.tsx";
import { DailyHighlight } from "./components/highlights/highlight-page.tsx";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DateProvider>
        <RepoDataProvider>
          <Router>
            <Header></Header>
            <Routes>
              <Route path="/repos" element={<RepoPage />} />
              <Route path="/" element={<DailyHighlight />} />
              <Route
                path="/about"
                element={
                  <PageContainer>
                    <SidebarLayout>
                      <About />
                    </SidebarLayout>
                  </PageContainer>
                }
              />
              <Route path="/developers" element={<DeveloperPage />} />
            </Routes>
          </Router>
        </RepoDataProvider>
      </DateProvider>
    </ThemeProvider>
  );
}
