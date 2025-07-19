import React from 'react'
import { Link } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-100">
      <div className="max-w-md bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-100">Gestión de Cotizaciones</h1>
        <img 
          src="https://static.vecteezy.com/system/resources/previews/008/214/517/non_2x/abstract-geometric-logo-or-infinity-line-logo-for-your-company-free-vector.jpg" 
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
          <button
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            Agregar Producto a Base de Datos
          </button>
          <button
            className="w-full bg-yellow-600 text-white py-2 rounded-md hover:bg-yellow-700 transition"
          >
            Agregar Cliente a Base de Datos
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
