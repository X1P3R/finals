import type { NextApiRequest, NextApiResponse } from "next";

import { requireApiUserId } from "@/lib/auth";
import { normalizeImportPayload } from "@/lib/notes";
import { prisma } from "@/lib/prisma";

const MAX_NOTES_PER_IMPORT = 100;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = await requireApiUserId(req, res);
  if (!userId) {
    return;
  }

  try {
    const items = normalizeImportPayload(req.body, MAX_NOTES_PER_IMPORT);

    const created = await prisma.$transaction(
      items.map((item) =>
        prisma.note.create({
          data: {
            userId,
            title: item.title,
            content: item.content,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
          select: { id: true },
        }),
      ),
    );

    return res.status(201).json({ created: created.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    return res.status(400).json({ error: message });
  }
}
