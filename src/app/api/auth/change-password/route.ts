import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/passwords";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { currentPassword, newPassword } = (await req.json().catch(() => ({}))) as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both keys are needed — the one you hold and the one you want." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "A longer key, please — eight characters at least." }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { email: session.email } });
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "That key doesn't fit this gate." }, { status: 401 });
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) },
  });
  return NextResponse.json({ ok: true });
}
