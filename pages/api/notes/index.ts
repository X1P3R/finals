import type { NextApiRequest, NextApiResponse } from "next";

import { requireApiUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function validateNotePayload(body: unknown): { title: string; content: string } {
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

  if (req.method === "GET") {
    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ notes });
  }

  if (req.method === "POST") {
    try {
      const { title, content } = validateNotePayload(req.body);
      const note = await prisma.note.create({
        data: {
          userId,
          title,
          content,
        },
      });
      return res.status(201).json({ note });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid note payload.";
      return res.status(400).json({ error: message });
    }
  }

  res.setHeader("Allow", "GET,POST");
  return res.status(405).json({ error: "Method not allowed" });
}
