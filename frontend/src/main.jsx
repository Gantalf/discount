import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import App from './App'

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      html: {
        overflowX: "hidden",     // ✅ bloquea scroll horizontal globalmente
        width: "100%",           // ✅ asegura que el html no se expanda más
      },
      body: {
        bg: 'gray.900',
        color: 'white',
        overflowX: "hidden",     // ✅ lo dejamos por seguridad
        width: "100%",           // ✅ igual que html
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
)