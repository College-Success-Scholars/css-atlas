import { redirect } from "next/navigation";
import { backendGet } from "@/lib/server/api-client";

export const metadata = {
  title: "Dev Tools | CSS Atlas",
  description: "Developer-only tools for testing server functions",
};

/**
 * Developer-only layout. Protects all routes under /dev from non-developer users.
 * Redirects to /dashboard if the user doesn't have developer access.
 */
export default async function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Backend checks developer role — returns 403 if not developer
  const result = await backendGet("/api/dev/test").catch(() => null);
  if (!result) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
