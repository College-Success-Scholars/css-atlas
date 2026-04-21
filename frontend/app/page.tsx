import { redirect } from "next/navigation";
import { backendGet } from "@/lib/server/api-client";
import { LandingHeader } from "@/components/marketing/landing-header";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingFeatureCards } from "@/components/marketing/landing-feature-cards";

export default async function Home() {
  const user = await backendGet("/api/auth/me").catch(() => null);

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 sm:py-10 md:px-5 md:py-8">

        <LandingHero />
        <LandingFeatureCards />
      </div>
    </div>
  );
}
