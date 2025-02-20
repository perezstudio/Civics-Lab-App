// app/routes/engage.tsx
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { AuthService } from "~/services/auth.server";
import { ApiService } from "~/services/api.server";
import { EngageSidebar } from "~/components/engage/sidebar";
import { SidebarProvider } from "~/components/ui/sidebar";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await AuthService.requireAuth(request);
  
  // Fetch workspaces for the user
  const { data: workspaces, error } = await ApiService.fetchData({
    table: 'workspaces',
    query: { created_by: user.id }
  });

  if (error) {
    return json({ 
      user,
      workspaces: [],
      error: `Failed to load workspaces: ${error}` 
    });
  }

  return json({ 
    user,
    workspaces: workspaces || [],
    error: null
  });
}

export default function EngageRoute() {
  const { user, workspaces, error } = useLoaderData<typeof loader>();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <EngageSidebar user={user} workspaces={workspaces} />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}