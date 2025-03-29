import { Heading, Text, VStack } from "@chakra-ui/react"

export default function Header() {
  return (
    <VStack spacing={2} textAlign="center" pb={4}>
      <Heading size="xl" p={4} bgGradient="linear(to-r, gray.200, white)" bgClip="text">
        Con Descuento
      </Heading>
      <Text color="gray.400" fontSize="lg" >
        Buscá el mejor descuento para tu medios de pago
      </Text>
    </VStack>
  )
}