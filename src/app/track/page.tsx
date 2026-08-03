import { TrackClient } from "@/components/client/TrackClient";

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  return <TrackClient initialCode={code ?? ""} />;
}
