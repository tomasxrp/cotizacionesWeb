import React, { useState } from 'react'

function ProductosModal({ isOpen, onClose, productos, onSelectProductos }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductos, setSelectedProductos] = useState([])

  if (!isOpen) return null

  const filteredProductos = productos.filter(producto =>
    producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.id.toString().includes(searchTerm.toLowerCase()) ||
    producto.und.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectProducto = (producto) => {
    const isSelected = selectedProductos.find(p => p.id === producto.id)
    if (isSelected) {
      setSelectedProductos(selectedProductos.filter(p => p.id !== producto.id))
    } else {
      setSelectedProductos([...selectedProductos, { ...producto, cantidadCotizada: 1 }])
    }
  }

  const updateCantidad = (productoId, nuevaCantidad) => {
    setSelectedProductos(selectedProductos.map(p => 
      p.id === productoId 
        ? { ...p, cantidadCotizada: parseFloat(nuevaCantidad) || 0 }
        : p
    ))
  }

  const handleConfirm = () => {
    onSelectProductos(selectedProductos)
    setSelectedProductos([])
    setSearchTerm('')
    onClose()
  }

  const isValidImageUrl = (url) => {
    return url && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp'))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-100">
            Seleccionar Productos ({selectedProductos.length} seleccionados)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por descripción, ID o unidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-md"
            autoFocus
          />
        </div>

        {/* Lista de productos */}
        <div className="overflow-y-auto max-h-96 mb-4">
          {filteredProductos.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {searchTerm ? 'No se encontraron productos que coincidan con la búsqueda' : 'No hay productos disponibles'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProductos.map((producto) => {
                const isSelected = selectedProductos.find(p => p.id === producto.id)
                const selectedProducto = selectedProductos.find(p => p.id === producto.id)
                
                return (
                  <div
                    key={producto.id}
                    className={`border rounded-md p-4 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-900 border-blue-600' 
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                    onClick={() => handleSelectProducto(producto)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div className="md:col-span-2">
                        <div className="font-bold text-gray-100">ID: {producto.id}</div>
                        <div className="text-sm text-gray-300">{producto.descripcion}</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isValidImageUrl(producto.marca) ? (
                          <img 
                            src={producto.marca} 
                            alt="Marca" 
                            className="w-12 h-12 object-cover rounded-md"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        ) : (
                          <div className="text-xs text-gray-400">Sin imagen</div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-300">
                        <div>UND: {producto.und}</div>
                        <div>Stock: {producto.cantidad}</div>
                      </div>
                      
                      <div className="text-sm text-gray-300">
                        <div>Unitario: ${producto.unitario.toLocaleString()}</div>
                        <div>Total Stock: ${producto.total.toLocaleString()}</div>
                      </div>
                      
                      {isSelected && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <label className="block text-xs text-gray-300 mb-1">Cantidad a cotizar:</label>
                          <input
                            type="number"
                            value={selectedProducto.cantidadCotizada}
                            onChange={(e) => updateCantidad(producto.id, e.target.value)}
                            min="0"
                            max={producto.cantidad}
                            step="0.01"
                            className="w-20 px-2 py-1 bg-gray-600 text-gray-100 rounded text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-300">
            {selectedProductos.length > 0 && (
              <div>
                Total seleccionados: ${selectedProductos.reduce((sum, p) => 
                  sum + (p.unitario * p.cantidadCotizada), 0
                ).toLocaleString()}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedProductos([])
                setSearchTerm('')
                onClose()
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedProductos.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Confirmar Selección ({selectedProductos.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductosModal