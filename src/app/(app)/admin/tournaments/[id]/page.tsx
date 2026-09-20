import { notFound } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "../../LoginForm";
import { ManageClient } from "./ManageClient";

export const dynamic = "force-dynamic";

export default async function ManageTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAuthenticated())) return <LoginForm />;

  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, status: true },
  });

  if (!tournament) notFound();

  return <ManageClient tournament={tournament} />;
}
