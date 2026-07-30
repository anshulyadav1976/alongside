import { AppShell } from "@/components/app-shell";
import { SessionExperience } from "@/components/session-experience";

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <AppShell><SessionExperience sessionId={sessionId} /></AppShell>;
}
