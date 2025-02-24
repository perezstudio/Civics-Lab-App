// app/routes/_auth.tsx
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { AuthService } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify authentication for all nested routes
  const user = await AuthService.requireAuth(request);
  return json({ user });
}

export default function AuthLayout() {
  return <Outlet />;
}