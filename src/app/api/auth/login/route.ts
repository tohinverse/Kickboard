import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!process.env.ADMIN_PASSWORD) {
    return Response.json(
      { error: "ADMIN_PASSWORD is not configured on the server." },
      { status: 500 },
    );
  }

  if (!verifyPassword(password)) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  await createSession();
  return Response.json({ ok: true });
}
