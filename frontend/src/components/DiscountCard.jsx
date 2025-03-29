import { Box, Text, Heading, Collapse } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { useState } from "react"

const MotionBox = motion(Box)

export default function DiscountCard({ data, market }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <MotionBox
      p={5}
      w="full"             
      width="100%"
      overflowWrap="break-word"
      wordBreak="break-word"
      whiteSpace="normal"
      borderRadius="xl"
      transformOrigin="center"
      bg="gray.800"
      whileHover={{ scale: 1.03 }}
      onClick={() => setShowDetails(!showDetails)}
      cursor="pointer"
    >
      <Heading size="md" mb={2}>{market.toUpperCase()}</Heading>
      <Text fontWeight="bold" color="green.300">{data.medio_pago}</Text>
      <Text>{data.descuento}</Text>
      <Text fontSize="sm" color="gray.400">{data.aplica_en}</Text>
      <Text fontSize="sm" color="gray.500">{data.tope}</Text>

      <Collapse startingHeight={40} in={showDetails}>
        <Text fontSize="sm" color="gray.300" mt={2}>
          {data.detalles}
        </Text>
      </Collapse>

      {!showDetails && data.detalles.length > 80 && (
        <Text mt={2} fontSize="sm" color="blue.300">
          Ver más
        </Text>
      )}
    </MotionBox>
  )
}