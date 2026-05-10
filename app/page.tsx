import { getUser } from "@/lib/get-user";
import { HomeActions } from "./HomeActions";

export default async function Home() {
  const user = await getUser();
  return (
    <div className="relative z-10 min-h-screen text-foreground flex flex-col">
      <HomeActions user={user} />
    </div>
  );
}
