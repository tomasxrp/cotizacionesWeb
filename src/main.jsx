import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App'
import CotizacionPage from './pages/CotizacionPage'
import GestionClientesPage from './pages/GestionClientesPage'
import GestionPoductos from './pages/GestionPoductos'
import HistorialCotizaciones from './pages/HistorialCotizaciones'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router basename="/cotizacionesWeb">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/cotizacion" element={<CotizacionPage />} />
        <Route path="/clientes" element={<GestionClientesPage />} />
        <Route path="/productos" element={<GestionPoductos />} />
        <Route path="/historial" element={<HistorialCotizaciones />} />
      </Routes>
    </Router>
  </StrictMode>,
)
