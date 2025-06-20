import "./App.css";
import { Header } from "./components/header.tsx";
import { RepoList } from "./components/repo-list.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Header></Header>
      <RepoList></RepoList>
    </ThemeProvider>
  );
}
