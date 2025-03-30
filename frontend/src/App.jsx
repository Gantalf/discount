import { useEffect, useState } from "react"
import { Box, VStack, Text } from "@chakra-ui/react"
import Header from "./components/Header"
import WalletFilter from "./components/WalletFilter"
import DiscountCard from "./components/DiscountCard"
import Footer from "./components/Footer"
import DisclaimerAlert from "./components/DisclaimerAlert"

function App() {
  const [discounts, setDiscounts] = useState([])
  const [walletFilter, setWalletFilter] = useState(null)
  const [loadingDiscounts, setLoadingDiscounts] = useState(true)

  useEffect(() => {
    setLoadingDiscounts(true)
  
    const url = walletFilter
      ? "/promotions/user"
      : "/promotions/top"
  
    const options = walletFilter
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: `Tengo ${walletFilter}. ¿Qué descuentos tengo disponibles?` }),
        }
      : {}
  
    fetch(url, options)
      .then((res) => res.json())
      .then((data) => {
        const results = walletFilter ? data.result : data.top_discounts
        setDiscounts(results || [])
      })
      .catch((err) => {
        console.error("Error fetching discounts:", err)
        setDiscounts([])
      })
      .finally(() => {
        setLoadingDiscounts(false)
      })
  }, [walletFilter])

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <Box
        p={6}
        w="100%"
        maxW="100vw"
        flex="1"
      >
        <Box w="100%" maxW="1000px" mx="auto">
          <Header />
          <WalletFilter onSelect={setWalletFilter} />
  
          {!walletFilter && (
            <Text
              fontSize="xl"
              color="orange.300"
              fontWeight="bold"
              mt={8}
              mb={4}
              textAlign="left"
            >
              🔥 Top 5
            </Text>
          )}
  
          {loadingDiscounts && (
            <Box mt={10} textAlign="center">
              <Text fontSize="md" color="gray.400">
                🛒 Buscando los mejores descuentos para vos...
              </Text>
            </Box>
          )}
  
          {!loadingDiscounts && (
          <>
            <VStack spacing={6} align="stretch" mt={6}>
              {discounts.map((s) => {
                const items = s.descuentos || s.discounts || []
                const market = s.supermercado || s.supermarket || "N/A"

                return items.map((d, idx) => (
                  <Box
                    key={`${market}-${idx}`}
                    display="flex"
                    justifyContent="center"
                    w="100%"
                  >
                    <DiscountCard data={d} market={market} />
                  </Box>
                ))
              })}
            </VStack>
            <DisclaimerAlert />
          </>
        )}
        </Box>
      </Box>
  
      <Footer />
    </Box>
  )
}

export default App