import React, { useState, useEffect } from 'react'

function ClientesModal({ isOpen, onClose, clientes, onSelectCliente }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [clientesFrecuentes, setClientesFrecuentes] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('clientes-frecuentes')
    if (saved) {
      setClientesFrecuentes(JSON.parse(saved))
    }
  }, [])

  if (!isOpen) return null

  const filteredClientes = clientes.filter(cliente =>
    cliente.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.comuna.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectCliente = (cliente) => {
    onSelectCliente(cliente)
    onClose()
    setSearchTerm('')
  }

  const marcarComoFrecuente = (cliente) => {
    const frecuentes = [...clientesFrecuentes]
    const exists = frecuentes.find(c => c.rut === cliente.rut)
    
    if (!exists) {
      frecuentes.push({ ...cliente, usos: 1 })
    } else {
      exists.usos += 1
    }
    
    // Mantener solo los 10 más usados
    frecuentes.sort((a, b) => b.usos - a.usos)
    const top10 = frecuentes.slice(0, 10)
    
    setClientesFrecuentes(top10)
    localStorage.setItem('clientes-frecuentes', JSON.stringify(top10))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-100">Seleccionar Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Clientes frecuentes */}
        {clientesFrecuentes.length > 0 && !searchTerm && (
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-300 mb-2">Clientes Frecuentes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {clientesFrecuentes.slice(0, 6).map((cliente, index) => (
                <button
                  key={index}
                  onClick={() => {
                    marcarComoFrecuente(cliente)
                    handleSelectCliente(cliente)
                  }}
                  className="bg-blue-700 hover:bg-blue-600 p-2 rounded text-xs text-left"
                >
                  <div className="font-bold">{cliente.entidad}</div>
                  <div className="text-gray-300">{cliente.rut}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por entidad, RUT o comuna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-md"
            autoFocus
          />
        </div>

        {/* Lista de clientes */}
        <div className="overflow-y-auto max-h-96">
          {filteredClientes.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'No hay clientes disponibles'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClientes.map((cliente, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectCliente(cliente)}
                  className="bg-gray-700 hover:bg-gray-600 p-4 rounded-md cursor-pointer transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <div className="font-bold text-gray-100">{cliente.entidad}</div>
                      <div className="text-sm text-gray-300">RUT: {cliente.rut}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">Comuna: {cliente.comuna}</div>
                      <div className="text-sm text-gray-400">{cliente.direccion}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientesModal