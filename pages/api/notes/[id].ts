import type { NextApiRequest, NextApiResponse } from "next";

import { requireApiUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseNoteId(idParam: string | string[] | undefined): number {
  if (typeof idParam !== "string") {
    return Number.NaN;
  }

  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : Number.NaN;
}

function validateUpdatePayload(body: unknown): { title: string; content: string } {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid request body.");
  }

  const payload = body as { title?: unknown; content?: unknown };
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const content = typeof payload.content === "string" ? payload.content : "";

  if (!title) {
    throw new Error("Title is required.");
  }

  return { title, content };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await requireApiUserId(req, res);
  if (!userId) {
    return;
  }

  const id = parseNoteId(req.query.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid note id." });
  }

  const note = await prisma.note.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!note) {
    return res.status(404).json({ error: "Note not found." });
  }

  if (req.method === "GET") {
    return res.status(200).json({ note });
  }

  if (req.method === "PUT") {
    try {
      const { title, content } = validateUpdatePayload(req.body);
      const updated = await prisma.note.update({
        where: { id: note.id },
        data: { title, content },
      });
      return res.status(200).json({ note: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid note payload.";
      return res.status(400).json({ error: message });
    }
  }

  if (req.method === "DELETE") {
    await prisma.note.delete({ where: { id: note.id } });
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET,PUT,DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
