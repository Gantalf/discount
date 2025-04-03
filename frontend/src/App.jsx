import { useEffect, useState } from "react"
import { Box, VStack, Text } from "@chakra-ui/react"
import Header from "./components/Header"
import FilterToggle from "./components/FilterToggle"
import DiscountCard from "./components/DiscountCard"
import Footer from "./components/Footer"
import DisclaimerAlert from "./components/DisclaimerAlert"
import { Flame, ShoppingCart } from "lucide-react"

function App() {
  const [discounts, setDiscounts] = useState([])
  const [filterType, setFilterType] = useState("wallet"); // "wallet" o "supermarket"
  const [filterValue, setFilterValue] = useState(null);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true)

  useEffect(() => {
    
    if (!filterValue) {
      if (filterType === null) return 
      setLoadingDiscounts(true)
      fetch("/promotions/top")
        .then((res) => res.json())
        .then((data) => {
          setDiscounts(data.top_discounts || [])
        })
        .catch((err) => {
          console.error("Error fetching top discounts:", err)
          setDiscounts([])
        })
        .finally(() => {
          setLoadingDiscounts(false)
        })
      return
    }
  
    
    setLoadingDiscounts(true)
  
    let prompt = ""
    if (filterType === "wallet") {
      prompt = `Tengo ${filterValue}. ¿Qué descuentos tengo disponibles?`
    } else if (filterType === "supermarket") {
      prompt = `¿Qué descuentos hay para el supermercado ${filterValue}?`
    }
  
    fetch("/promotions/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    })
      .then((res) => res.json())
      .then((data) => {
        setDiscounts(data.result || [])
      })
      .catch((err) => {
        console.error("Error fetching filtered discounts:", err)
        setDiscounts([])
      })
      .finally(() => {
        setLoadingDiscounts(false)
      })
  
  }, [filterValue])
  

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <Box p={6} w="100%" maxW="100vw" flex="1">
        <Box w="100%" maxW="1000px" mx="auto">
          <Header />
          <FilterToggle
            filterType={filterType}
            setFilterType={setFilterType}
            setFilterValue={setFilterValue}
          />

          {!filterValue && (
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              mt={8}
              mb={4}
            >
              <Flame size={20} color="#F6AD55" /> {/* naranja.300 en Chakra */}
              <Text fontSize="xl" color="orange.300" fontWeight="bold">
                Top 5
              </Text>
            </Box>
          )}

          {loadingDiscounts && (
            <Box mt={10} display="flex" alignItems="center" justifyContent="center">
              <Box
                display="flex"
                alignItems="center"
                gap={2}
                flexDirection={{ base: "column", md: "row" }}
                textAlign="center"
              >
                <ShoppingCart size={24} color="#A0AEC0" />
                <Text fontSize="md" color="gray.400">
                  Buscando los mejores descuentos para vos...
                </Text>
              </Box>
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
