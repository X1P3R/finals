import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const demoName = "admin";
  const demoPassword = "ABCabc123";
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const user = await prisma.user.upsert({
    where: { name: demoName },
    update: {
      password: passwordHash,
    },
    create: {
      name: demoName,
      password: passwordHash,
    },
  });

  await prisma.note.deleteMany({ where: { userId: user.id } });

  await prisma.note.createMany({
    data: [
      {
        userId: user.id,
        title: "Vítejte v aplikaci",
        content: "Toto je demo poznámka vytvořená seed skriptem.",
      },
      {
        userId: user.id,
        title: "Co je připraveno",
        content: "Autentizace, CRUD, export/import JSON a ochrana dat podle uživatele.",
      },
      {
        userId: user.id,
        title: "Demo účet",
        content: "Přihlašovací jméno: admin, heslo: ABCabc123",
      },
    ],
  });

  console.log("Seed completed.");
  console.log("Demo user:", demoName);
  console.log("Demo password:", demoPassword);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
