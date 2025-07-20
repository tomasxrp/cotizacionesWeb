import React from 'react'
import { Link } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-100">
      <div className="max-w-md bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-100">Gestión de Cotizaciones</h1>
        <img 
          src="https://via.placeholder.com/150" 
          alt="Cotizaciones" 
          className="mx-auto mb-6 rounded-md shadow-md"
        />
        <div className="space-y-4">
          <Link
            to="/cotizacion"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition text-center block"
          >
            Nueva Cotización
          </Link>
          <Link
            to="/productos"
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition text-center block"
          >
            Gestionar Productos
          </Link>
          <Link
            to="/clientes"
            className="w-full bg-yellow-600 text-white py-2 rounded-md hover:bg-yellow-700 transition text-center block"
          >
            Gestionar Clientes
          </Link>
        </div>
      </div>
    </div>
  )
}

export default App
