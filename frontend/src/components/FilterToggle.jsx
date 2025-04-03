import { Box, Button, Flex } from "@chakra-ui/react"
import GenericFilter from "./GenericFilter"

export default function FilterToggle({ filterType, setFilterType, setFilterValue }) {
  const isWallet = filterType === "wallet"

  return (
    <Box mb={6} w="100%">
      <Box maxW="1000px" mx="auto" pt={4}>
        <Flex
          justify="flex-start"
          bg="gray.700"
          borderRadius="full"
          p="2px"
          w="fit-content"
          mb={4}
        >
          <Button
            size="sm"
            borderRadius="full"
            bg={isWallet ? "blue.500" : "gray.600"}
            _hover={{ bg: isWallet ? "blue.400" : "gray.500" }}
            color="white"
            onClick={() => {
              setFilterType("wallet")
              setFilterValue(null)
            }}
          >
            Billetera
          </Button>
          <Button
            size="sm"
            borderRadius="full"
            bg={!isWallet ? "blue.500" : "gray.600"}
            _hover={{ bg: !isWallet ? "blue.400" : "gray.500" }}
            color="white"
            onClick={() => {
              setFilterType("supermarket")
              setFilterValue(null)
            }}
          >
            Supermercado
          </Button>
        </Flex>

        <GenericFilter
          title={isWallet ? "billeteras" : "supermercados"}
          fetchUrl={isWallet ? "/wallets" : "/supermarkets"}
          onSelect={setFilterValue}
        />
      </Box>
    </Box>
  )
}
