import { Alert, AlertIcon, AlertDescription } from "@chakra-ui/react"

export default  function DisclaimerAlert() {
  return (
    <Alert
      status="warning"
      variant="subtle"
      bg="orange.100"
      color="gray.800"
      borderRadius="md"
      mt={4}
      pb={4}
    >
      <AlertIcon />
      <AlertDescription fontSize="sm">
      Hacemos todo lo posible por mantener la información actualizada, pero te recomendamos verificar las promociones en la web oficial del supermercado para evitar diferencias.
      </AlertDescription>
    </Alert>
  )
}