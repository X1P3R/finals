import Head from "next/head";
import NextLink from "next/link";
import { getServerSession } from "next-auth/next";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
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
} from "@chakra-ui/react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type EditNoteProps = {
  note: {
    id: number;
    title: string;
    content: string;
  };
};

export default function EditNotePage({ note }: EditNoteProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const response = await fetch(`/api/notes/${note.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    setSaving(false);

    if (!response.ok) {
      setError(data.error || "Uložení se nezdařilo.");
      return;
    }

    await router.push(`/notes/${note.id}`);
  }

  return (
    <>
      <Head>
        <title>Upravit poznámku</title>
      </Head>
      <Box minH="100vh" bg="#121416">
        <Container maxW="3xl" py={10}>
          <Box bg="#1b1f23" borderRadius="2xl" borderWidth="1px" borderColor="#313843" shadow="2xl" p={7}>
            <Stack spacing={5}>
              <Heading size="lg" color="#f3f5f8" letterSpacing="-0.02em">Upravit poznámku</Heading>
              <form onSubmit={onSubmit}>
                <Stack spacing={4}>
                  <Box>
                    <Text mb={1} fontWeight="medium" color="#c7d0db">Titulek</Text>
                    <Input bg="#15191d" borderColor="#3a434f" color="#edf1f5" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </Box>
                  <Box>
                    <Text mb={1} fontWeight="medium" color="#c7d0db">Obsah</Text>
                    <Textarea bg="#15191d" borderColor="#3a434f" color="#edf1f5" fontFamily="IBM Plex Mono, Consolas, monospace" value={content} onChange={(e) => setContent(e.target.value)} rows={12} />
                  </Box>
                  {error ? <Text color="#ff9eaa">{error}</Text> : null}
                  <Button type="submit" colorScheme="blue" bg="#2d6fbf" _hover={{ bg: "#235c9f" }} isLoading={saving} alignSelf="flex-start">Uložit změny</Button>
                </Stack>
              </form>
              <Link as={NextLink} href={`/notes/${note.id}`} color="#8bc8ff" fontWeight="semibold">Zpět na detail</Link>
            </Stack>
          </Box>
        </Container>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<EditNoteProps> = async (context) => {
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

  const idParam = context.params?.id;
  const noteId = typeof idParam === "string" ? Number(idParam) : Number.NaN;

  if (!Number.isInteger(noteId) || noteId <= 0) {
    return { notFound: true };
  }

  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      userId,
    },
  });

  if (!note) {
    return { notFound: true };
  }

  return {
    props: {
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
      },
    },
  };
};
