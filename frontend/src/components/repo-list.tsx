import { RepoCard } from "@/components/repo-card.tsx";
// import {
//   Pagination,
//   PaginationContent,
//   PaginationEllipsis,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// } from "@/components/ui/pagination";

export function RepoList() {
  const repoData = [
    {
      name: "STORM",
      description:
        "Synthesis of Topic Outlines through Retrieval and Multi-perspective Question Asking - A collaborative AI system for Wikipedia-style article generation.",
      summary:
        "Generates detailed articles by simulating expert discussions and integrating web research.",
      stars: 12.5e3,
      forks: 1.2e3,
    },
    {
      name: "Open R1",
      description:
        "Open-source reproduction of DeepSeek-R1 pipeline for reasoning, math, and coding tasks.",
      summary: "Democratizes access to advanced AI model development.",
      stars: 8.7e3,
      forks: 950,
    },
    {
      name: "AutoGen",
      description:
        "Microsoft's framework for building multi-agent AI systems that collaborate or operate autonomously.",
      summary: "Enables complex AI workflows through conversational agents.",
      stars: 22.3e3,
      forks: 2.8e3,
    },
    {
      name: "MiniCPM-o",
      description:
        "OpenBMB's compact language model optimized for edge devices with performance rivaling larger models.",
      summary: "Efficient LLM deployment on resource-constrained hardware.",
      stars: 6.5e3,
      forks: 780,
    },
    {
      name: "Btop",
      description:
        "Beautiful, resource-efficient system monitor for Linux/macOS/FreeBSD with interactive UI.",
      summary: "Real-time system resource visualization.",
      stars: 14.2e3,
      forks: 1.1e3,
    },
    {
      name: "Augini",
      description:
        "AI-powered tabular data assistant with RAG capabilities for CSV/Excel analysis via chat interface.",
      summary:
        "Transforms spreadsheet workflows with natural language processing.",
      stars: 3.8e3,
      forks: 420,
    },
    {
      name: "RCMP",
      description:
        "Memory disaggregation solution using CXL technology for efficient resource utilization.",
      summary: "Advances in memory pooling architectures.",
      stars: 2.9e3,
      forks: 310,
    },
    {
      name: "Co-STORM",
      description:
        "Extension of STORM enabling human-AI collaboration through interactive mind maps during knowledge exploration.",
      summary: "Reduces cognitive load in complex research tasks.",
      stars: 5.1e3,
      forks: 680,
    },
  ];
  return (
    <>
      <div>
        {repoData.map((repo, index) => (
          <RepoCard
            key={index}
            rank={index + 1}
            name={repo.name}
            description={repo.description}
            summary={repo.summary}
            stars={repo.stars}
            forks={repo.forks}
          />
        ))}
      </div>
    </>
  );
}
