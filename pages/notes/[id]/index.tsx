import Head from "next/head";
import NextLink from "next/link";
import { getServerSession } from "next-auth/next";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { Box, Button, Container, Heading, HStack, Link, Stack, Text } from "@chakra-ui/react";

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
      <Box className="page-wrap">
      <Container maxW="3xl" py={10}>
        <Box className="paper-card" p={6}>
          <Stack spacing={5}>
            <HStack justify="space-between" align="center" flexWrap="wrap">
              <Heading size="md" className="plain-title">{note.title}</Heading>
              <HStack>
                <Button as="a" href={`/api/notes/export?id=${note.id}`} borderRadius="2px" borderWidth="1px" borderColor="#4fd1c5" color="#4fd1c5" variant="outline">Export JSON</Button>
                <Button as={NextLink} href={`/notes/${note.id}/edit`} borderRadius="2px" bg="#4fd1c5" color="#10202f" _hover={{ bg: "#36b8ab" }}>Upravit</Button>
                <Button onClick={onDelete} borderRadius="2px" borderWidth="1px" borderColor="#ff8f6b" color="#ff8f6b" variant="outline">Smazat</Button>
              </HStack>
            </HStack>

            <Text className="note-content" color="#d7e4f7">{note.content || "(prázdný obsah)"}</Text>

            <Text color="#9fb0c9" fontSize="sm">Vytvořeno: {new Date(note.createdAt).toLocaleString("cs-CZ")}</Text>
            <Text color="#9fb0c9" fontSize="sm">Upraveno: {new Date(note.updatedAt).toLocaleString("cs-CZ")}</Text>

            <Link as={NextLink} href="/notes" color="#ff8f6b" fontWeight="semibold">Zpět na seznam</Link>
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
