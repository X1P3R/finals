import Head from "next/head";
import NextLink from "next/link";
import { getServerSession } from "next-auth/next";
import { signOut } from "next-auth/react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import type { Note } from "@prisma/client";
import { Box, Button, Container, Heading, Input, Link, Stack, Text, Textarea, HStack } from "@chakra-ui/react";

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

      const data = (await response.json().catch(() => ({}))) as { error?: string; created?: number };
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
      <Box className="page-wrap">
      <Container maxW="4xl" py={10}>
        <Stack spacing={6}>
          <HStack justify="space-between" align="flex-start">
            <Stack spacing={1}>
              <Heading size="md" className="plain-title">Moje poznámky</Heading>
              <Text className="muted">Přihlášen: {userName}</Text>
            </Stack>
            <HStack>
              <Button as="a" href="/api/notes/export" borderRadius="2px" borderWidth="1px" borderColor="#4fd1c5" color="#4fd1c5" variant="outline">Export všeho</Button>
              <Button onClick={() => signOut({ callbackUrl: "/login" })} borderRadius="2px" bg="#2b364d" color="white" _hover={{ bg: "#34415b" }}>Odhlásit</Button>
            </HStack>
          </HStack>

          <Box className="paper-card" p={5}>
            <Heading size="sm" mb={4}>Nová poznámka</Heading>
            <form onSubmit={createNote}>
              <Stack spacing={3}>
                <Box>
                  <Text mb={1} className="muted">Titulek</Text>
                  <Input borderRadius="2px" borderWidth="1px" borderColor="#3a4e70" bg="#0f1729" color="#e5ecf6" value={title} onChange={(e) => setTitle(e.target.value)} />
                </Box>
                <Box>
                  <Text mb={1} className="muted">Obsah</Text>
                  <Textarea borderRadius="2px" borderWidth="1px" borderColor="#3a4e70" bg="#0f1729" color="#e5ecf6" value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
                </Box>
                <Button type="submit" borderRadius="2px" bg="#4fd1c5" color="#10202f" _hover={{ bg: "#36b8ab" }} isLoading={saving} alignSelf="flex-start">Uložit poznámku</Button>
              </Stack>
            </form>
          </Box>

          <Box className="paper-card" p={5}>
            <Heading size="sm" mb={4}>Import JSON</Heading>
            <form onSubmit={importNotes}>
              <HStack align="end" spacing={3} flexWrap="wrap">
                <Box maxW="md">
                  <Text mb={1} className="muted">Soubor .json</Text>
                  <Input borderRadius="2px" borderWidth="1px" borderColor="#3a4e70" bg="#0f1729" color="#e5ecf6" name="json" type="file" accept="application/json,.json" />
                </Box>
                <Button type="submit" borderRadius="2px" bg="#ff8f6b" color="#1a1a1a" _hover={{ bg: "#e67a56" }} isLoading={importing}>Importovat</Button>
              </HStack>
            </form>
            <Text mt={3} className="muted" fontSize="sm">Limit importu: max 1 MB a max 100 položek na požadavek.</Text>
          </Box>

          {error ? <Text color="red.600">{error}</Text> : null}
          {info ? <Text color="green.700">{info}</Text> : null}

          <Box className="paper-card" p={5}>
            <Heading size="sm" mb={4}>Seznam poznámek</Heading>
            <Stack spacing={3}>
              {notes.length === 0 ? <Text>Nemáte zatím žádné poznámky.</Text> : null}
              {notes.map((note) => (
                <Box key={note.id} borderWidth="1px" borderColor="#395078" borderRadius="2px" p={4} bg="#121a2b">
                  <Stack spacing={2}>
                    <Link as={NextLink} href={`/notes/${note.id}`} color="#9ae9df" fontWeight="semibold">{note.title}</Link>
                    <Text noOfLines={2} color="#d7e4f7">{note.content || "(prázdný obsah)"}</Text>
                    <Text fontSize="sm" color="#9fb0c9">Aktualizováno: {new Date(note.updatedAt).toLocaleString("cs-CZ")}</Text>
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
