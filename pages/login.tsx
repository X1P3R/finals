import Head from "next/head";
import NextLink from "next/link";
import { signIn, getSession } from "next-auth/react";
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
} from "@chakra-ui/react";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      name,
      password,
    });

    setLoading(false);

    if (!result || result.error) {
      setError("Neplatné přihlašovací údaje.");
      return;
    }

    await router.push("/notes");
  }

  return (
    <>
      <Head>
        <title>Přihlášení</title>
      </Head>
      <Box minH="100vh" bg="#121416">
        <Container maxW="md" py={16}>
          <Box bg="#1b1f23" borderWidth="1px" borderColor="#313843" shadow="2xl" borderRadius="2xl" p={8}>
            <Stack spacing={6}>
              <Heading size="lg" color="#f3f5f8" letterSpacing="-0.02em">Přihlášení</Heading>
              <form onSubmit={onSubmit}>
                <Stack spacing={4}>
                  <Box>
                    <Text mb={1} fontWeight="medium" color="#c7d0db">Jméno</Text>
                    <Input bg="#15191d" borderColor="#3a434f" color="#edf1f5" value={name} onChange={(e) => setName(e.target.value)} />
                  </Box>
                  <Box>
                    <Text mb={1} fontWeight="medium" color="#c7d0db">Heslo</Text>
                    <Input type="password" bg="#15191d" borderColor="#3a434f" color="#edf1f5" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </Box>
                  {error ? <Text color="#ff9eaa">{error}</Text> : null}
                  <Button type="submit" colorScheme="blue" bg="#2d6fbf" _hover={{ bg: "#235c9f" }} isLoading={loading}>Přihlásit</Button>
                </Stack>
              </form>
              <Text color="#a8b3c1">
                Nemáte účet? <Link as={NextLink} href="/register" color="#8bc8ff">Registrujte se</Link>
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
