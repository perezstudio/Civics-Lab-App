// app/routes/login.tsx
import { json, redirect, ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AuthService } from "~/services/supabase";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return json({ error: "Email and password are required" });
  }

  const { error, success, headers, user } = await AuthService.signIn({
    email,
    password,
  });

  if (error) {
    return json({ error });
  }

  if (success && headers) {
    // Redirect to the app route after successful login
    return redirect("/app", {
      headers,
    });
  }

  return json({ error: "An unexpected error occurred" });
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            {actionData?.error && (
              <Alert variant="destructive">
                <AlertDescription>{actionData.error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                name="password"
                placeholder="Password"
                required
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}