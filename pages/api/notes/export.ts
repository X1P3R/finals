import type { NextApiRequest, NextApiResponse } from "next";

import { requireApiUserId } from "@/lib/auth";
import { dateStamp, toExportPayload } from "@/lib/notes";
import { prisma } from "@/lib/prisma";

function parseOptionalId(value: string | string[] | undefined): number | null {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return Number.NaN;
  }

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : Number.NaN;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = await requireApiUserId(req, res);
  if (!userId) {
    return;
  }

  const singleId = parseOptionalId(req.query.id);
  if (Number.isNaN(singleId)) {
    return res.status(400).json({ error: "Invalid id query parameter." });
  }

  const stamp = dateStamp();
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (singleId) {
    const note = await prisma.note.findFirst({
      where: { id: singleId, userId },
      select: {
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    const payload = toExportPayload(note);
    res.setHeader("Content-Disposition", `attachment; filename=note-${singleId}-${stamp}.json`);
    return res.status(200).send(JSON.stringify(payload, null, 2));
  }

  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const payload = notes.map(toExportPayload);
  res.setHeader("Content-Disposition", `attachment; filename=notes-export-${stamp}.json`);
  return res.status(200).send(JSON.stringify(payload, null, 2));
}
