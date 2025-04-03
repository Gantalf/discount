import {
  Box, Text, Heading, Collapse, Button, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  useDisclosure, Spinner
} from "@chakra-ui/react"
import { motion } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { Sparkles, Brain } from "lucide-react"

const MotionBox = motion(Box)

export default function DiscountCard({ data, market }) {
  const [showDetails, setShowDetails] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [summary, setSummary] = useState(null)
  const detallesRef = useRef()
  const [isOverflowing, setIsOverflowing] = useState(false)

  const handleIASummary = async () => {
    setIsLoadingSummary(true)
    setSummary(null)
    try {
      const res = await fetch("/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.legales }),
      })
      const json = await res.json()
      setSummary(json.summary || "No se pudo generar resumen")
    } catch (err) {
      setSummary("⚠️ Error al generar el resumen")
    } finally {
      setIsLoadingSummary(false)
    }
  }

  const isUrl = typeof data.legales === "string" && data.legales.startsWith("http")

  useEffect(() => {
    const el = detallesRef.current
    if (el) {
      setIsOverflowing(el.scrollHeight > 40)
    }
  }, [data.detalles])

  return (
    <>
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
        position="relative"
      >
        <Button
          size="sm"
          position="absolute"
          top={3}
          right={3}
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
          bg="gray.700"
          _hover={{ bg: "gray.600" }}
        >
          Legales
        </Button>

        <Heading size="md" mb={2}>{market.toUpperCase()}</Heading>
        <Text fontWeight="bold" color="green.300">{data.medio_pago}</Text>
        <Text>{data.descuento}</Text>

        {typeof data.aplica_en === 'string' ? (
          <Text fontSize="sm" color="gray.400">{data.aplica_en}</Text>
        ) : Array.isArray(data.aplica_en) ? (
          <Box mt={1}>
            <Text fontSize="sm" color="gray.400" mb={1}>Aplica en:</Text>
            <Box display="flex" gap={2}>
              {data.aplica_en.map((logo, idx) => (
                <img
                  key={idx}
                  src={logo}
                  alt="Aplica en"
                  style={{
                    height: '24px',
                    width: 'auto',
                    maxWidth: '80px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    marginTop: '4px',
                    marginBottom: '4px'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = '/fallback-logo.svg'
                  }}
                />
              ))}
            </Box>
          </Box>
        ) : null}

        {data.tope && (
          <Text fontSize="sm" color="gray.500">
            {/^tope/i.test(data.tope) ? data.tope : <>Tope: {data.tope}</>}
          </Text>
        )}

        <Collapse startingHeight={40} in={showDetails}>
          <Text ref={detallesRef} fontSize="sm" color="gray.300" mt={2}>
            {data.detalles}
          </Text>
        </Collapse>

        {!showDetails && isOverflowing && (
          <Text mt={2} fontSize="sm" color="blue.300">
            Ver más
          </Text>
        )}
      </MotionBox>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.900" color="white" mx={{ base: 4, md: 0 }} maxW={{ base: "95%", md: "xl" }}>
          <ModalHeader>
            <Box display="flex" alignItems="center" gap={3}>
              <Text>Legales</Text>
              {data.legales && !isUrl && (
                <Button
                  size="xs"
                  leftIcon={<Sparkles size={14} />}
                  onClick={handleIASummary}
                  isLoading={isLoadingSummary}
                  colorScheme="purple"
                  variant="ghost"
                >
                  IA resumen
                </Button>
              )}
            </Box>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {summary && (
              <Box mb={4} p={3} bg="gray.700" borderRadius="md">
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Brain size={16} color="#ECC94B" />
                  <Text fontSize="sm" color="yellow.300" fontWeight="bold">
                    Resumen IA
                  </Text>
                </Box>
                <Text fontSize="sm" color="gray.200">{summary}</Text>
              </Box>
            )}

            <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap">
              {data.legales || "No se encontraron términos legales."}
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
