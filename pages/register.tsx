import Head from "next/head";
import NextLink from "next/link";
import { signIn, getSession } from "next-auth/react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { Box, Button, Container, Heading, HStack, Input, Link, Stack, Text } from "@chakra-ui/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setLoading(false);
      setError(data.error || "Registrace se nezdařila.");
      return;
    }

    const loginResult = await signIn("credentials", {
      redirect: false,
      name,
      password,
    });

    setLoading(false);

    if (!loginResult || loginResult.error) {
      setError("Účet vytvořen, ale automatické přihlášení selhalo.");
      return;
    }

    await router.push("/notes");
  }

  return (
    <>
      <Head>
        <title>Registrace</title>
      </Head>
      <Box className="page-wrap">
      <Container maxW="md" py={14}>
        <Box className="paper-card" p={6}>
          <Stack spacing={5}>
            <HStack justify="space-between" align="center">
              <Heading size="md" className="plain-title">Registrace</Heading>
              <Text className="chip">New User</Text>
            </HStack>
            <form onSubmit={onSubmit}>
              <Stack spacing={3}>
                <Box>
                  <Text mb={1} className="muted">Jméno</Text>
                  <Input borderRadius="2px" borderWidth="1px" borderColor="#3a4e70" bg="#0f1729" color="#e5ecf6" value={name} onChange={(e) => setName(e.target.value)} _hover={{ borderColor: "#4fd1c5" }} _focusVisible={{ borderColor: "#4fd1c5", boxShadow: "0 0 0 1px #4fd1c5" }} />
                </Box>
                <Box>
                  <Text mb={1} className="muted">Heslo (min. 8 znaků)</Text>
                  <Input type="password" borderRadius="2px" borderWidth="1px" borderColor="#3a4e70" bg="#0f1729" color="#e5ecf6" value={password} onChange={(e) => setPassword(e.target.value)} _hover={{ borderColor: "#4fd1c5" }} _focusVisible={{ borderColor: "#4fd1c5", boxShadow: "0 0 0 1px #4fd1c5" }} />
                </Box>
                {error ? <Text color="red.600">{error}</Text> : null}
                <Button type="submit" borderRadius="2px" bg="#ff8f6b" color="#1a1a1a" _hover={{ bg: "#e67a56" }} isLoading={loading}>Vytvořit účet</Button>
              </Stack>
            </form>
            <Text className="muted">
              Už účet máte? <Link as={NextLink} href="/login" color="#4fd1c5">Přihlásit se</Link>
            </Text>
          </Stack>
        </Box>
      </Container>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  if (session?.user?.id) {
    return {
      redirect: {
        destination: "/notes",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
