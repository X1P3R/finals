import Head from "next/head";
import NextLink from "next/link";
import { getServerSession } from "next-auth/next";
import { signOut } from "next-auth/react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import type { Note } from "@prisma/client";
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  Textarea,
  HStack,
} from "@chakra-ui/react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type NoteListItem = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type NotesPageProps = {
  notes: NoteListItem[];
  userName: string;
};

export default function NotesPage({ notes, userName }: NotesPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  async function createNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");
    setSaving(true);

    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    setSaving(false);

    if (!response.ok) {
      setError(data.error || "Nepodařilo se vytvořit poznámku.");
      return;
    }

    setTitle("");
    setContent("");
    await router.replace(router.asPath);
  }

  async function importNotes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");

    const input = (event.currentTarget.elements.namedItem("json") as HTMLInputElement) || null;
    const file = input?.files?.[0];

    if (!file) {
      setError("Vyberte JSON soubor.");
      return;
    }

    try {
      setImporting(true);
      const text = await file.text();
      const parsed = JSON.parse(text);

      const response = await fetch("/api/notes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        created?: number;
      };

      setImporting(false);

      if (!response.ok) {
        setError(data.error || "Import se nezdařil.");
        return;
      }

      setInfo(`Import hotov, vytvořeno ${data.created ?? 0} poznámek.`);
      if (input) {
        input.value = "";
      }
      await router.replace(router.asPath);
    } catch {
      setImporting(false);
      setError("Soubor neobsahuje validní JSON.");
    }
  }

  return (
    <>
      <Head>
        <title>Poznámky</title>
      </Head>
      <Box minH="100vh" bg="#121416">
        <Container maxW="4xl" py={10}>
          <Stack spacing={6}>
            <HStack justify="space-between" align="flex-start">
              <Stack spacing={1}>
                <Heading size="lg" color="#f3f5f8" letterSpacing="-0.02em">Moje poznámky</Heading>
                <Text color="#a8b3c1">Přihlášen: {userName}</Text>
              </Stack>
              <HStack>
                <Button as="a" href="/api/notes/export" colorScheme="cyan" variant="outline" borderColor="#4b6278" color="#b8e7ff">Export všeho</Button>
                <Button onClick={() => signOut({ callbackUrl: "/login" })} bg="#2b3139" color="#dae1ea" _hover={{ bg: "#343c46" }}>Odhlásit</Button>
              </HStack>
            </HStack>

            <Box bg="#1b1f23" borderRadius="2xl" borderWidth="1px" borderColor="#313843" shadow="2xl" p={6}>
              <Heading size="md" mb={4}>Nová poznámka</Heading>
              <form onSubmit={createNote}>
                <Stack spacing={3}>
                  <Box>
                    <Text mb={1} fontWeight="medium" color="#c7d0db">Titulek</Text>
                    <Input bg="#15191d" borderColor="#3a434f" color="#edf1f5" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </Box>
                  <Box>
                    <Text mb={1} fontWeight="medium" color="#c7d0db">Obsah</Text>
                    <Textarea bg="#15191d" borderColor="#3a434f" color="#edf1f5" fontFamily="IBM Plex Mono, Consolas, monospace" value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
                  </Box>
                  <Button type="submit" colorScheme="blue" bg="#2d6fbf" _hover={{ bg: "#235c9f" }} isLoading={saving} alignSelf="flex-start">Uložit poznámku</Button>
                </Stack>
              </form>
            </Box>

            <Box bg="#1b1f23" borderRadius="2xl" borderWidth="1px" borderColor="#313843" shadow="2xl" p={6}>
              <Heading size="md" mb={4}>Import JSON</Heading>
              <form onSubmit={importNotes}>
                <HStack align="end" spacing={3} flexWrap="wrap">
                  <Box maxW="md">
                    <Text mb={1} fontWeight="medium" color="#c7d0db">Soubor .json</Text>
                    <Input name="json" type="file" accept="application/json,.json" bg="#15191d" borderColor="#3a434f" color="#edf1f5" />
                  </Box>
                  <Button type="submit" colorScheme="cyan" bg="#0b6c73" _hover={{ bg: "#0f7f87" }} isLoading={importing}>Importovat</Button>
                </HStack>
              </form>
              <Text mt={3} color="#98a6b6" fontSize="sm">Limit importu: max 1 MB a max 100 položek na požadavek.</Text>
            </Box>

            {error ? <Text color="#ff9eaa">{error}</Text> : null}
            {info ? <Text color="#8fdfa9">{info}</Text> : null}

            <Box bg="#1b1f23" borderRadius="2xl" borderWidth="1px" borderColor="#313843" shadow="2xl" p={6}>
              <Heading size="md" mb={4}>Seznam poznámek</Heading>
              <Stack spacing={3}>
                {notes.length === 0 ? <Text color="#b4beca">Nemáte zatím žádné poznámky.</Text> : null}
                {notes.map((note) => (
                  <Box key={note.id} borderWidth="1px" borderColor="#323a45" borderRadius="lg" p={4} bg="#171b20" transition="all 0.18s" _hover={{ borderColor: "#4a5665", transform: "translateY(-1px)" }}>
                    <Stack spacing={2}>
                      <Link as={NextLink} href={`/notes/${note.id}`} color="#9ed2ff" fontWeight="bold">{note.title}</Link>
                      <Text noOfLines={2} color="#c4ced9">{note.content || "(prázdný obsah)"}</Text>
                      <Text fontSize="sm" color="#8f9baa">Aktualizováno: {new Date(note.updatedAt).toLocaleString("cs-CZ")}</Text>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<NotesPageProps> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : Number.NaN;

  if (!Number.isInteger(userId) || userId <= 0) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return {
    props: {
      userName: session?.user?.name || "uživatel",
      notes: notes.map((note: Note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      })),
    },
  };
};
