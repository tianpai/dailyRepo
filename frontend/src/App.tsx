import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/header.tsx";
import { About } from "./components/about.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { RepoDataProvider } from "./context/repo-data-provider.tsx";
import { PageContainer } from "./components/page-container.tsx";
import { Homepage } from "./components/home/homepage.tsx";
import { DeveloperPage } from "./components/developers/developer-page.tsx";
import { SidebarLayout } from "./components/app-sidebar.tsx";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RepoDataProvider>
        <Router>
          <Header></Header>
          <Routes>
            <Route path="/" element={<Homepage />} />
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
    </ThemeProvider>
  );
}
