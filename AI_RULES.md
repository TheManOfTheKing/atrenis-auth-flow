# AI Rules for Atrenis Application Development

This document outlines the technical stack and guidelines for developing the Atrenis application. Adhering to these rules ensures consistency, maintainability, and efficient development.

## Tech Stack Overview

The Atrenis application is built using a modern and robust set of technologies:

*   **React**: A JavaScript library for building user interfaces.
*   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript, enhancing code quality and developer experience.
*   **Vite**: A fast build tool that provides an instant development server and optimized build process.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
*   **shadcn/ui**: A collection of reusable components built with Radix UI and styled with Tailwind CSS, providing a consistent and accessible UI.
*   **React Router DOM**: For declarative client-side routing within the application.
*   **Supabase**: An open-source Firebase alternative used for authentication, database management, and real-time subscriptions.
*   **React Hook Form & Zod**: For efficient form management and robust schema-based validation.
*   **Tanstack Query (React Query)**: For managing server state, data fetching, caching, and synchronization.
*   **Lucide React**: A library of beautiful and consistent open-source icons.
*   **Sonner**: A modern toast library for displaying non-blocking notifications.

## Library Usage Guidelines

To maintain consistency and leverage the strengths of each library, please follow these guidelines:

*   **UI Components**: Always prioritize using components from `shadcn/ui` (found in `src/components/ui/`). If a specific component is not available or requires significant customization, create a new component in `src/components/` and style it using Tailwind CSS. **Do not modify existing files within `src/components/ui/`**.
*   **Styling**: All styling should be done using **Tailwind CSS** classes. Avoid writing custom CSS in separate files or using inline styles unless absolutely necessary for dynamic, component-specific properties.
*   **Routing**: Use `react-router-dom` for all navigation and route management within the application. Define routes in `src/App.tsx`.
*   **Forms & Validation**: For all forms, use `react-hook-form` for state management and `zod` for schema validation. This ensures consistent validation logic and a streamlined form experience.
*   **Data Fetching & Server State**: Utilize `@tanstack/react-query` for fetching, caching, and updating server data. This helps manage complex asynchronous operations and keeps the UI synchronized with the backend.
*   **Authentication & Database**: All authentication flows (login, signup, password reset) and database interactions should be handled via the `supabase` client, as configured in `src/integrations/supabase/client.ts`.
*   **Icons**: Use icons from the `lucide-react` library.
*   **Notifications**: For simple, non-blocking notifications (e.g., "Login successful", "Item added"), use `sonner`. The `shadcn/ui` `toast` component (with `useToast` hook) is also available for more interactive or persistent notifications if a specific use case demands it.
*   **Utility Functions**: For combining Tailwind CSS classes conditionally, use the `cn` utility function from `src/lib/utils.ts`.