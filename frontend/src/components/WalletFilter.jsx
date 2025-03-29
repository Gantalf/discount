import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  HStack,
  Box,
  Spinner,
} from "@chakra-ui/react"
import { ChevronDownIcon } from "@chakra-ui/icons"
import { useEffect, useState } from "react"

export default function WalletFilter({ onSelect }) {

  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:8000/wallets")
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
    <Box mb={6}> 
     <HStack spacing={4} mt={4} justify="center" wrap="wrap" w="100%">
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
    </HStack>
    </Box>
  )
}