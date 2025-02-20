// app/routes/app.tsx
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { AuthService } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify authentication
  await AuthService.requireAuth(request);
  return json({});
}

export default function AppRoute() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Button asChild className="px-6 py-3">
        <Link to="/engage">Go to Engage</Link>
      </Button>
    </div>
  );
}