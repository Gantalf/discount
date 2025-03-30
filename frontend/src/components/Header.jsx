import { Heading, Text, VStack, Box } from "@chakra-ui/react"

export default function Header() {
  return (
    <Box w="100%" borderBottom={"1px solid"} borderColor="gray.700">
      <Box maxW="1000px" mx="auto" textAlign="left">
        <VStack spacing={2} align="start" pb={4}>
          <Heading
            size="xl"
            pt={4} // solo padding arriba
            bgGradient="linear(to-r, gray.200, white)"
            bgClip="text"
          >
            Con Descuento
          </Heading>
          <Text color="gray.400" fontSize="lg">
            Buscá el mejor descuento para tus medios de pago
          </Text>
        </VStack>
      </Box>
    </Box>
  )
}