import { Box, Text, Link, Stack } from "@chakra-ui/react"
import { Link as RouterLink } from "react-router-dom"

export default function Footer() {
    return (
      <Box
        mt={12}
        py={6}
        borderTop="1px solid"
        borderColor="gray.700"
        textAlign="left"
        w="100%"
        px={4}
      >
        <Box maxW="1000px" mx="auto" >
          <Stack spacing={2}>
            <Text fontSize="sm">Proyecto creado por Lucho.</Text>
            <Link
              href="https://www.linkedin.com/in/luciano-nicolas-pereira-dev/"
              isExternal
              fontSize="sm"
              color="blue.300"
            >
              LinkedIn
            </Link>
            <Link
              href="mailto:pereiralucianonicolas@gmail.com"
              fontSize="sm"
              color="blue.300"
            >
              email
            </Link>
            <RouterLink to="/cafecito">
              <Text
                fontSize="sm"
                color="orange.300"
                _hover={{ textDecoration: "underline" }}
              >
                Invitame un cafecito ☕
              </Text>
            </RouterLink>
          </Stack>
        </Box>
      </Box>
    )
  }