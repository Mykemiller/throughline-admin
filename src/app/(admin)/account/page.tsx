import { PageFrame } from "@/components/PageFrame";
import { getSession } from "@/lib/auth";
import { AccountView } from "./AccountView";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  return (
    <PageFrame title="Account" sub="the steward's key">
      <AccountView email={session?.email ?? ""} />
    </PageFrame>
  );
}
