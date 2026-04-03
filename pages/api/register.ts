import type { NextApiRequest, NextApiResponse } from "next";

import { hashPassword } from "@/lib/hash";
import { prisma } from "@/lib/prisma";

function validateRegisterInput(body: unknown): { name: string; password: string } {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid request body.");
  }

  const payload = body as { name?: unknown; password?: unknown };
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!name) {
    throw new Error("Name is required.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  return { name, password };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, password } = validateRegisterInput(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists." });
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        name,
        password: passwordHash,
      },
    });

    return res.status(201).json({ message: "User created." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    return res.status(400).json({ error: message });
  }
}
