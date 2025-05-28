import "./App.css";
import { RepoList } from "./components/repo-list.tsx";
export default function App() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-10 pl-10 pt-5">Repo Trends</h1>
      <RepoList></RepoList>
    </>
  );
}
