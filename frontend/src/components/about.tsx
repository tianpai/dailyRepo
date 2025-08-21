import React from "react";
import { FaLinkedin, FaGithub } from "react-icons/fa";

export function About(): React.JSX.Element {
  return (
    <>
      <div className="border-2 border-border bg-background text-foreground mb-8">
        <div className="p-4 border-b-2 border-border">
          <div>
            <h1 className="major-mono text-lg font-normal text-foreground">
              ABOUT DAILY REPO
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          <ProjectDescription />
          <AboutDeveloper />
          <LegalDisclaimer />
        </div>

        {/* ASCII Footer */}
        <div className="p-4 border-t-2 border-border text-center">
          <p className="major-mono text-lg text-description">
            Made for the open-source community
          </p>
        </div>
      </div>
      <div className="p-3"></div>
    </>
  );
}
function ProjectDescription() {
  return (
    <section className="border-2 border-border bg-background p-4">
      <h2 className="major-mono text-lg font-normal text-foreground mb-3">
        WHAT IS DAILY REPO?
      </h2>
      <p className="major-mono text-lg text-description leading-relaxed">
        DailyRepo is a curated platform for discovering GitHub's most trending
        repositories. We track and showcase the hottest open-source projects
        across multiple categories, helping developers stay updated with the
        latest innovations in the tech world. From AI/ML tools to productivity
        apps, security utilities to web development frameworks, find what's
        trending and what's worth your attention.
      </p>
    </section>
  );
}

function AboutDeveloper(): React.JSX.Element {
  return (
    <section className="border-2 border-border bg-background p-4">
      <h2 className="major-mono text-lg font-normal text-foreground mb-3">
        ABOUT THE DEVELOPER
      </h2>
      <p className="major-mono text-lg text-description leading-relaxed mb-4">
        Hi! I'm a passionate developer who loves exploring the open-source
        ecosystem. I built DailyRepo to solve my own problem of staying current
        with trending repositories across different technology stacks. : )
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <a
          href="https://www.linkedin.com/in/tianpai"
          target="_blank"
          rel="noopener noreferrer"
          className="major-mono text-lg text-foreground hover:text-primary transition-colors flex items-center gap-2"
        >
          <FaLinkedin /> CONNECT ON LINKEDIN
        </a>

        <span className="major-mono text-description hidden sm:inline">|</span>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
          <a
            href="https://github.com/tianpai/dailyRepo"
            target="_blank"
            rel="noopener noreferrer"
            className="major-mono text-lg text-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <FaGithub /> VIEW ON GITHUB
          </a>
          <span className="major-mono text-description">
            (consider starring!)
          </span>
        </div>
      </div>
    </section>
  );
}

function LegalDisclaimer(): React.JSX.Element {
  return (
    <section className="border-2 border-border bg-background p-4">
      <h2 className="major-mono text-lg font-normal text-foreground mb-3">
        LEGAL & DISCLAIMER
      </h2>
      <div className="major-mono text-lg text-description space-y-3">
        <p>
          <span className="text-foreground">DATA SOURCE:</span> All repository
          data is sourced from GitHub's public API. We do not claim ownership of
          any repository information displayed.
        </p>
        <p>
          <span className="text-foreground">SERVICE AVAILABILITY:</span> This
          service is provided "as-is" without warranties. We strive for accuracy
          but cannot guarantee data completeness or availability.
        </p>
        <p>
          <span className="text-foreground">PRIVACY:</span> We do not collect
          personal information beyond basic usage analytics. No user data is
          sold or shared with third parties.
        </p>
        <p>
          <span className="text-foreground">LIMITATION OF LIABILITY:</span> Use
          of this service is at your own risk. We are not liable for any damages
          arising from the use of this platform.
        </p>
      </div>
    </section>
  );
}
