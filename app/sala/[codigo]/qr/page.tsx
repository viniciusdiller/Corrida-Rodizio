import { RoomQrPage } from "@/components/room/room-qr-page";

interface RoomQrRouteProps {
  params: Promise<{ codigo?: string }>;
}

export default async function RoomQrRoute({ params }: RoomQrRouteProps) {
  const resolvedParams = await params;
  const roomCode = resolvedParams?.codigo ? String(resolvedParams.codigo) : "";

  return <RoomQrPage roomCode={roomCode} />;
}
