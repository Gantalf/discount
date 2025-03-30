import { Box, Heading, Text, VStack, Divider, Link, Button } from "@chakra-ui/react"
import { Link as RouterLink } from 'react-router-dom'

export default function Cafecito() {
  return (
    <Box py={10} px={4} maxW="600px" mx="auto">
      <Heading size="lg" mb={4} textAlign="center">
        Invitame un cafecito ☕
      </Heading>

      <Text textAlign="center" mb={8} color="gray.300">
        Si querés apoyar el proyecto, podés invitarme un cafecito :)
      </Text>

      <VStack align="start" spacing={6}>
        <Box w="100%">
          <Heading size="sm" mb={2}>💵 Pesos Argentinos</Heading>
          <Text color="gray.200">CVU:</Text>
          <Text fontWeight="bold" color="gray.400">0000003100085635847374</Text>
          <Text color="gray.200" mt={2}>Alias:</Text>
          <Text fontWeight="bold" color="gray.400">lucho.np.mp</Text>
        </Box>

        <Divider borderColor="gray.600" />

        <Box w="100%">
          <Heading size="sm" mb={2}>💸 Cripto</Heading>
          <Text color="gray.200">Bitcoin (BEP20):</Text>
          <Text fontWeight="bold" color="gray.400">0x85ca35e7cb7da10eaffa10ce0fe7b9e5907d0241</Text>

          <Text color="gray.200" mt={4}>USDT (TRON):</Text>
          <Text fontWeight="bold" color="gray.400">TAHPE5yM212JG8Qga9HSphXYS1sXyLzMaY</Text>

        </Box>
      </VStack>

      <Box textAlign="center" mt={10}>
        <Button as={RouterLink} to="/" variant="outline" colorScheme="gray">
          Volver al inicio
        </Button>
      </Box>
    </Box>
  )
}