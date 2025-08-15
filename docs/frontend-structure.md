# Frontend Structure

## Routing

The application uses `react-router-dom` for client-side routing. The main
routing configuration is defined in `App.tsx`.

- **`BrowserRouter as Router`**: Provides the routing context.
- **`Routes`**: Renders the first child `<Route>` that matches the current URL.
- **`Route`**: Defines a single route, mapping a `path` to a `component`.

### Defined Routes

- `/`: Maps to the `Homepage` component with trending repositories
- `/highlights`: Maps to the `DailyHighlight` component with analytics dashboard
- `/about`: Maps to the `About` component, wrapped in `PageContainer` and `SidebarLayout`
- `/developers`: Maps to the `DeveloperPage` component

## Code Splitting (Lazy Loading)

To improve initial load performance, the application utilizes React's `lazy`
and `Suspense` for code splitting. This ensures that components are only loaded
when they are needed (i.e., when their corresponding route is accessed).

While not explicitly shown in the provided `App.tsx` snippet, future additions
of new pages or complex components use lazy loading.

## Key Components

### Highlights Dashboard (`/highlights`)

- **Keywords Analysis**: Trending topics with 7-day historical tracking
- **Language Analytics**: Popular programming languages
- **Topics by Language**: Categorized trending topics
- **Interactive Visualizations**: SVG charts with responsive interactions

### SVG Components

- **SVG Vertical Bar Generator**: Reusable chart component with pattern support
- **Interactive Features**: Hover/click events optimized for mobile
- **Customizable Styling**: Alignment, colors, and special patterns (diagonal lines, dots)

### Responsive Design

- **Mobile Optimization**: Touch-friendly interactions
- **ASCII-styled Design**: Minimal, clean interface
- **Theme Support**: Dark/light mode toggle

## Adding New Pages

When adding a new page:

1. **Create the Page Component**: Develop the new React component
2. **Define the Route**: Add a new `<Route>` in `App.tsx` with lazy loading
3. **Update Sidebar Navigation**: Add navigation link in `app-sidebar.tsx`
