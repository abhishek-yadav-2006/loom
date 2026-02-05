interface RoomProps {
  params: {
    roomId: string;
  };
}

export default async function Room({ params }: RoomProps) {
  const { roomId } =  await params;
  console.log(roomId)

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Room ID: {roomId}</h1>
      <p>This is your room page. Here you'll integrate video and chat.</p>
    </div>
  );
}
