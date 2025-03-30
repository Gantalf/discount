import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Stack,
  Box,
  Spinner,
} from "@chakra-ui/react"
import { ChevronDownIcon } from "@chakra-ui/icons"
import { useEffect, useState } from "react"

export default function WalletFilter({ onSelect }) {

  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/wallets")
      .then((res) => res.json())
      .then((data) => {
        setWallets(data || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching wallets:", err)
        setLoading(false)
      })
  }, [])

  return (
    <Box mb={6} w="100%">
      <Box maxW="1000px" mx="auto" pt={4}>
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={4}
          mt={4}
          wrap="wrap"
        >
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} bg="gray.700">
              {loading ? <Spinner size="sm" /> : "Filtrar billetera"}
            </MenuButton>

            <MenuList bg="gray.800" maxH="250px" overflowY="auto">
              {wallets.map((w, i) => (
                <MenuItem
                  key={i}
                  bg="gray.800"
                  _hover={{ bg: "gray.600" }}
                  onClick={() => onSelect(w)}
                >
                  {w}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <Button
            onClick={() => onSelect(null)}
            bg="red.500"
            _hover={{ bg: "red.600" }}
          >
            Limpiar filtros
          </Button>
        </Stack>
      </Box>
    </Box>
  )
  
}