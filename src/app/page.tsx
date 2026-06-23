import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  if (session.user.onboardingPending) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
