import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [subCount, session] = await Promise.all([prisma.subscriber.count(), getSession()]);
  const userName = session?.email.split("@")[0] ?? "steward";
  const envLabel = process.env.VERCEL_ENV === "production" ? "production" : process.env.VERCEL_ENV ?? "dev";

  return (
    <ToastProvider>
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          fontFamily: "var(--font-sans)",
          color: "#1C1712",
          background:
            "radial-gradient(ellipse 900px 500px at 85% -10%, rgba(74,124,89,0.10), rgba(74,124,89,0) 70%), radial-gradient(ellipse 800px 600px at -10% 110%, rgba(196,135,58,0.08), rgba(196,135,58,0) 65%), linear-gradient(165deg, #F2E6BC 0%, #EFE3B6 60%, #EADEAC 100%)",
        }}
      >
        <Sidebar subCount={subCount} envLabel={envLabel} userName={userName} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>{children}</div>
      </div>
    </ToastProvider>
  );
}
