import { CallExperience } from "@/components/call-experience";
import type { SupportMode } from "@/lib/client/types";

export default async function CallPage({ searchParams }: { searchParams: Promise<{ mode?: SupportMode }> }) {
  const { mode } = await searchParams;
  return <CallExperience initialMode={mode ?? "open"} />;
}
