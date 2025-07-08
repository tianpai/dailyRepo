# 📦 DAILY REPO (Frontend)

More on [frontend structure](../docs/frontend-structure.md)

## ✨ Features

- View trending repositories and their star history
- Interactive charts (pie, line, etc.)
- Dark/light mode toggle
- Responsive design
- Built with React, TypeScript, Vite, and Tailwind CSS

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (utility-first styling)
- **Chart.js** & **Recharts** (data visualization)
- **Radix UI** (accessible UI components)
- **React Query** (data fetching/caching)

## 📁 Project Structure

- `src/` — Main source code
  - `components/` — Reusable UI components including charts, repository lists,
    and theme toggle
  - `context/` — React context providers for global state management
  - `hooks/` — Custom React hooks for data fetching and API integration
  - `lib/` — Utility functions for data processing and chart configuration
  - `interface/` — TypeScript type definitions and API response interfaces

## Frontend Structure

- **App.tsx**: Main application component with routing and global state
- **Components**: Modular UI components for repository display, charts, and interactions
- **Context**: Global state management for theme, data, and user preferences
- **Hooks**: Custom hooks for API calls, data fetching, and state management
- **Utilities**: Helper functions for data transformation and chart rendering
