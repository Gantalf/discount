import {
  Box, Button, Menu, MenuButton, MenuItem, MenuList, Spinner, Stack
} from "@chakra-ui/react"
import { ChevronDownIcon } from "@chakra-ui/icons"
import { useEffect, useState } from "react"

export default function GenericFilter({ title, fetchUrl, onSelect, onClear }) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(fetchUrl)
      .then((res) => res.json())
      .then((data) => {
        setOptions(data || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching options:", err)
        setLoading(false)
      })
  }, [fetchUrl])

  return (
    <Box mb={6} w="100%">
      <Box maxW="1000px" mx="auto" >
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={4}
          mt={4}
          wrap="wrap"
        >
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} bg="gray.700">
              {loading ? <Spinner size="sm" /> : title}
            </MenuButton>

            <MenuList bg="gray.800" maxH="250px" overflowY="auto">
              {options.map((opt, i) => (
                <MenuItem
                  key={i}
                  bg="gray.800"
                  _hover={{ bg: "gray.600" }}
                  onClick={() => onSelect(opt)}
                >
                  {opt}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <Button
            onClick={() => {
              onSelect(null)
              onClear?.()
            }}
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
