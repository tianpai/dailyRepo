# Frontend Structure

## Routing

The application uses `react-router-dom` for client-side routing. The main
routing configuration is defined in `App.tsx`.

- **`BrowserRouter as Router`**: Provides the routing context.
- **`Routes`**: Renders the first child `<Route>` that matches the current URL.
- **`Route`**: Defines a single route, mapping a `path` to a `component`.

### Defined Routes

- `/`: Maps to the `Homepage` component.
- `/about`: Maps to the `About` component, wrapped in `PageContainer` and `SidebarLayout`.
- `/developers`: Maps to the `DeveloperPage` component.

## Code Splitting (Lazy Loading)

To improve initial load performance, the application utilizes React's `lazy`
and `Suspense` for code splitting. This ensures that components are only loaded
when they are needed (i.e., when their corresponding route is accessed).

While not explicitly shown in the provided `App.tsx` snippet, future additions
of new pages or complex components should leverage lazy loading.

## Future Pages and Sidebar Integration

> Just because almost every web app uses a sidebar doesn't mean I had to. Maybe
> it’s collective wisdom (sigh) to reuse open-source React components instead of
> reinventing the wheel. Good new design is rare.

New pages will be integrated into the application's routing and made accessible
via the sidebar. The `SidebarLayout` component (likely found in
`frontend/src/components/app-sidebar.tsx`) is designed to accommodate new
navigation links. When adding a new page:

1. **Create the Page Component**: Develop the new React component for the page
   (e.g., `frontend/src/components/new-page/NewPage.tsx`).
2. **Define the Route**: Add a new `<Route>` in `App.tsx` for the new page,
   ideally using `lazy` and `Suspense` for code splitting.
3. **Update Sidebar Navigation**: Add a corresponding navigation link in
   `frontend/src/components/app-sidebar.tsx` (or related sidebar component)
   that points to the new route.
