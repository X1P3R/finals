import Head from "next/head";
import NextLink from "next/link";
import { getServerSession } from "next-auth/next";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type NoteDetailProps = {
  note: {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  };
};

function renderNoteContent(content: string) {
  const normalized = content.trim();
  if (!normalized) {
    return <p>(prázdný obsah)</p>;
  }

  return normalized.split(/\n\s*\n/).map((block, index) => {
    const text = block.trim();
    const lines = text.split("\n");
    const codeLike =
      lines.length > 2 &&
      /(^\s*(import|export|const|let|await|model|return|if|for)\b)|([{}();]|=>)/m.test(text);

    if (codeLike) {
      return <pre key={index}>{text}</pre>;
    }

    return <p key={index}>{text}</p>;
  });
}

export default function NoteDetailPage({ note }: NoteDetailProps) {
  const router = useRouter();

  async function onDelete() {
    const confirmDelete = window.confirm("Opravdu smazat poznámku?");
    if (!confirmDelete) {
      return;
    }

    const response = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    if (!response.ok) {
      window.alert("Mazání selhalo.");
      return;
    }

    await router.push("/notes");
  }

  return (
    <>
      <Head>
        <title>{note.title}</title>
      </Head>
      <Box minH="100vh" bg="#121416">
        <Container maxW="3xl" py={10}>
          <Box bg="#1b1f23" borderRadius="2xl" borderWidth="1px" borderColor="#313843" shadow="2xl" p={7}>
            <Stack spacing={5}>
              <HStack justify="space-between" align="flex-start" flexWrap="wrap" spacing={4}>
                <Heading size="lg" color="#f3f5f8" letterSpacing="-0.02em" maxW="2xl">{note.title}</Heading>
                <HStack>
                  <Button as="a" href={`/api/notes/export?id=${note.id}`} colorScheme="cyan" variant="outline" borderColor="#4b6278" color="#b8e7ff">Export JSON</Button>
                  <Button as={NextLink} href={`/notes/${note.id}/edit`} colorScheme="blue" bg="#2d6fbf" _hover={{ bg: "#235c9f" }}>Upravit</Button>
                  <Button onClick={onDelete} colorScheme="red" variant="outline" borderColor="#8f4b55" color="#ffb4c0">Smazat</Button>
                </HStack>
              </HStack>

              <Box className="note-content" minH="120px">{renderNoteContent(note.content)}</Box>

              <Text color="#8f9baa" fontSize="sm">Vytvořeno: {new Date(note.createdAt).toLocaleString("cs-CZ")}</Text>
              <Text color="#8f9baa" fontSize="sm">Upraveno: {new Date(note.updatedAt).toLocaleString("cs-CZ")}</Text>

              <Link as={NextLink} href="/notes" color="#8bc8ff" fontWeight="semibold">Zpět na seznam</Link>
            </Stack>
          </Box>
        </Container>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<NoteDetailProps> = async (context) => {
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
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      },
    },
  };
};
