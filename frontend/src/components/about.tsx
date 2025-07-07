import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card";
import { FaLinkedin, FaGithub } from "react-icons/fa";

export function About(): React.JSX.Element {
  return (
    <div className="min-h-screen p-0 m-0">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center mb-8">
            <h1>About DailyRepo</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <ProjectDescription />
          <AboutDeveloper />
          <FuturePlans />
          <CurrentChallenges />
          <LegalDisclaimer />
        </CardContent>
        <CardFooter className="justify-center border-t dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Made with ❤️ for the open-source community
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
function ProjectDescription() {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        What is DailyRepo?
      </h2>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
        DailyRepo is a curated platform for discovering GitHub's most trending
        repositories. We track and showcase the hottest open-source projects
        across multiple categories, helping developers stay updated with the
        latest innovations in the tech world. From AI/ML tools to productivity
        apps, security utilities to web development frameworks - find what's
        trending and what's worth your attention.
      </p>
    </section>
  );
}

function AboutDeveloper(): React.JSX.Element {
  return (
    <section className="border-t dark:border-gray-700 pt-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        About the Developer
      </h2>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Hi! I'm a passionate developer who loves exploring the open-source
        ecosystem. I built DailyRepo to solve my own problem of staying current
        with trending repositories across different technology stacks. : )
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <a
          href="https://www.linkedin.com/in/tianpai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
        >
          <FaLinkedin /> Connect on LinkedIn
        </a>

        <span className="text-gray-400 hidden sm:inline">•</span>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
          <a
            href="https://github.com/tianpai/dailyRepo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 dark:text-gray-400 hover:underline flex items-center gap-2"
          >
            <FaGithub /> View on GitHub
          </a>
          <span className="text-gray-500 dark:text-gray-500 text-sm">
            (consider starring! ⭐)
          </span>
        </div>
      </div>
    </section>
  );
}

function FuturePlans(): React.JSX.Element {
  return (
    <section className="border-t dark:border-gray-700 pt-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Future Plans
      </h2>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
          Coming Soon: Personal Dashboard
        </h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
          We're working on user authentication that will allow you to track your
          own private repositories, create custom watchlists, and get
          personalized trending recommendations. Best of all? It will remain{" "}
          <strong>free forever</strong> for individual developers.
        </p>
      </div>
    </section>
  );
}

function CurrentChallenges(): React.JSX.Element {
  return (
    <section className="border-t dark:border-gray-700 pt-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Current Challenges
      </h2>
      <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg">
        <ul className="text-amber-800 dark:text-amber-200 text-sm space-y-2">
          <li className="flex items-start">
            <span className="text-amber-600 dark:text-amber-400 mr-2">•</span>
            GitHub API rate limits occasionally affect data freshness
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 dark:text-amber-400 mr-2">•</span>
            Data updates may not always reflect the most recent changes
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 dark:text-amber-400 mr-2">•</span>
            Solo development means slower feature rollouts
          </li>
        </ul>
        <p className="text-amber-700 dark:text-amber-300 text-xs mt-3">
          Working on solutions to improve data reliability and update frequency.
        </p>
      </div>
    </section>
  );
}

function LegalDisclaimer(): React.JSX.Element {
  return (
    <section className="border-t dark:border-gray-700 pt-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Legal & Disclaimer
      </h2>
      <div className="text-gray-600 dark:text-gray-400 text-sm space-y-3">
        <p>
          <strong>Data Source:</strong> All repository data is sourced from
          GitHub's public API. We do not claim ownership of any repository
          information displayed.
        </p>
        <p>
          <strong>Service Availability:</strong> This service is provided
          "as-is" without warranties. We strive for accuracy but cannot
          guarantee data completeness or availability.
        </p>
        <p>
          <strong>Privacy:</strong> We do not collect personal information
          beyond basic usage analytics. No user data is sold or shared with
          third parties.
        </p>
        <p>
          <strong>Limitation of Liability:</strong> Use of this service is at
          your own risk. We are not liable for any damages arising from the use
          of this platform.
        </p>
      </div>
    </section>
  );
}
