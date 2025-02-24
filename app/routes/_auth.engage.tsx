// app/routes/_auth.engage.tsx
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteLoaderData } from "@remix-run/react";
import { ApiService } from "~/services/api.server";
import { EngageSidebar } from "~/components/engage/sidebar";
import { AuthService } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Get the user directly from AuthService
  const user = await AuthService.requireAuth(request);
  
  const { data: workspaces, error } = await ApiService.fetchData({
    table: 'workspaces',
    query: { created_by: user.id }
  });

  if (error) {
    return json({ 
      user,  // Include user in the loader data
      workspaces: [],
      error: `Failed to load workspaces: ${error}` 
    });
  }

  return json({ 
    user,    // Include user in the loader data
    workspaces: workspaces || [],
    error: null
  });
}

export default function EngageRoute() {
  // Get data from this route's loader instead of parent
  const { user, workspaces, error } = useLoaderData<typeof loader>();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <EngageSidebar user={user} workspaces={workspaces} />
      <div className="flex-1 overflow-hidden bg-white">
        <Outlet />
      </div>
    </div>
  );
}