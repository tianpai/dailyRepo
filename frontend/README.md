# DAILY REPO (Frontend)

More on [frontend structure](../docs/frontend-structure.md)

## Features

### Repository Tracking

- View trending repositories and their star history
- Interactive repository cards with detailed information
- _Almost_ Real-time data updates and caching

### Data Visualization

- Interactive charts (pie, line, bar charts)
- Custom SVG vertical bar charts with patterns
- Keyword trend visualization with 7-day history
- Language popularity analytics
- Topics by programming language breakdown

### Highlights Dashboard

- **Keywords Analysis**: Trending topics extracted from repositories
  - Interactive 7-day history with SVG bar charts
  - Click to view historical keyword data
  - Hover/click interactions (responsive for mobile)
  - Special styling for selected dates (diagonal line patterns)
- **Top Languages**: Most popular programming languages
- **Topics by Language**: Categorized trending topics

### User Experience

- Dark/light mode toggle
- Responsive design (desktop, tablet, mobile)
- Mobile-optimized interactions (tooltip or click)
- ASCII-styled minimal design
- Real-time loading states and error handling

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (utility-first styling)
- ~~**Chart.js** & **Recharts** (data visualization)~~ Custom style for graphs and charts
- **Radix UI** (accessible UI components)
- **React Query** (data fetching/caching)

## Project Structure

- `src/` — Main source code
  - `components/` — Reusable UI components including charts, repository lists, SVG generators, and highlights
  - `context/` — React context providers for global state management
  - `hooks/` — Custom React hooks for data fetching, API integration, and mobile detection
  - `lib/` — Utility functions for data processing, URL building, and chart configuration
  - `interface/` — TypeScript type definitions and API response interfaces

## Key Components

### SVG Vertical Bar Generator

- Reusable SVG bar chart component with customizable styling
- Support for special patterns (diagonal lines, dots) for highlighting
- Responsive interactions (hover/click) with mobile optimization
- Configurable alignment, spacing, and colors

### Keywords Component

- Historical keyword tracking with 7-day visualization
- Date-based filtering and selection
- Integration with backend caching for optimal performance
- Real-time date display and interaction feedback

### Highlights Dashboard

- Centralized view of trending data analytics
- Multiple data visualization components
- Real-time updates and error handling

## Frontend Architecture

- **App.tsx**: Main application component with routing and global state
- **Components**: Modular UI components for repository display, charts, SVG generators, and data visualization
- **Context**: Global state management for theme, data, and user preferences
- **Hooks**: Custom hooks for API calls, data fetching, mobile detection, and state management
- **Utilities**: Helper functions for data transformation, URL building, and chart rendering
