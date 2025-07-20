import React, { useState, useRef } from 'react'

function GestionPoductos() {
  const [descripcion, setDescripcion] = useState('')
  const [marca, setMarca] = useState('')
  const [und, setUnd] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unitario, setUnitario] = useState('')
  const [productos, setProductos] = useState([])
  const [editingIndex, setEditingIndex] = useState(-1)
  const [nextId, setNextId] = useState(1) // Contador para IDs secuenciales
  const fileInputRef = useRef(null) // Referencia para el input de archivo

  // Calcular total automáticamente
  const calcularTotal = (cantidad, unitario) => {
    return (parseFloat(cantidad) || 0) * (parseFloat(unitario) || 0)
  }

  const addProducto = () => {
    if (descripcion.trim() && marca.trim() && und.trim() && cantidad.trim() && unitario.trim()) {
      const total = calcularTotal(cantidad, unitario)
      
      if (editingIndex >= 0) {
        // Actualizar producto existente
        const updatedProductos = [...productos]
        updatedProductos[editingIndex] = {
          ...updatedProductos[editingIndex],
          descripcion,
          marca,
          und,
          cantidad: parseFloat(cantidad),
          unitario: parseFloat(unitario),
          total
        }
        setProductos(updatedProductos)
        setEditingIndex(-1)
      } else {
        // Agregar nuevo producto con ID secuencial
        setProductos([
          ...productos,
          {
            id: nextId,
            descripcion,
            marca,
            und,
            cantidad: parseFloat(cantidad),
            unitario: parseFloat(unitario),
            total
          }
        ])
        setNextId(nextId + 1) // Incrementar el contador
      }
      clearForm()
    }
  }

  const clearForm = () => {
    setDescripcion('')
    setMarca('')
    setUnd('')
    setCantidad('')
    setUnitario('')
  }

  const deleteProducto = (index) => {
    setProductos(productos.filter((_, i) => i !== index))
    if (editingIndex === index) {
      setEditingIndex(-1)
      clearForm()
    }
    // No resetear nextId al eliminar para mantener la secuencia
  }

  const editProducto = (index) => {
    const producto = productos[index]
    setDescripcion(producto.descripcion)
    setMarca(producto.marca)
    setUnd(producto.und)
    setCantidad(producto.cantidad.toString())
    setUnitario(producto.unitario.toString())
    setEditingIndex(index)
  }

  const cancelEdit = () => {
    setEditingIndex(-1)
    clearForm()
  }

  const exportToJSON = () => {
    const dataStr = JSON.stringify(productos, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'productos.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importFromJSON = () => {
    fileInputRef.current.click()
  }

  const handleFileImport = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          
          // Validar que sea un array
          if (!Array.isArray(importedData)) {
            alert('Error: El archivo JSON debe contener un array de productos')
            return
          }

          // Validar estructura de cada producto
          const validProducts = importedData.filter(producto => {
            return (
              producto.hasOwnProperty('id') &&
              producto.hasOwnProperty('descripcion') &&
              producto.hasOwnProperty('marca') &&
              producto.hasOwnProperty('und') &&
              producto.hasOwnProperty('cantidad') &&
              producto.hasOwnProperty('unitario') &&
              producto.hasOwnProperty('total')
            )
          })

          if (validProducts.length === 0) {
            alert('Error: No se encontraron productos válidos en el archivo')
            return
          }

          // Encontrar el ID más alto para continuar la secuencia
          const maxId = Math.max(...validProducts.map(p => parseInt(p.id) || 0), 0)
          setNextId(maxId + 1)

          // Recalcular totales por si acaso
          const processedProducts = validProducts.map(producto => ({
            ...producto,
            total: (parseFloat(producto.cantidad) || 0) * (parseFloat(producto.unitario) || 0)
          }))

          setProductos(processedProducts)
          
          if (validProducts.length !== importedData.length) {
            alert(`Se importaron ${validProducts.length} de ${importedData.length} productos. Algunos productos tenían formato incorrecto.`)
          } else {
            alert(`Se importaron ${validProducts.length} productos correctamente`)
          }
          
        } catch (error) {
          alert('Error al leer el archivo JSON: ' + error.message)
        }
      }
      reader.readAsText(file)
    } else {
      alert('Por favor selecciona un archivo JSON válido')
    }
    
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    event.target.value = ''
  }

  // Verificar si la URL es una imagen válida
  const isValidImageUrl = (url) => {
    return url && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp'))
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Gestión de Productos</h1>

        {/* Input oculto para importar archivos */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileImport}
          accept=".json"
          style={{ display: 'none' }}
        />

        {/* Formulario de productos */}
        <div className="mb-6 bg-gray-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            {editingIndex >= 0 ? 'Editar Producto' : `Agregar Nuevo Producto (ID: ${nextId})`}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-gray-100">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción del producto"
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-gray-100">Marca (URL de imagen)</label>
              <input
                type="url"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md"
              />
              {marca && isValidImageUrl(marca) && (
                <div className="mt-2">
                  <img 
                    src={marca} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-md"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="block mb-2 text-gray-100">Unidad</label>
              <select
                value={und}
                onChange={(e) => setUnd(e.target.value)}
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md"
              >
                <option value="">Seleccionar unidad</option>
                <option value="UND">UND (Unidades)</option>
                <option value="KG">KG (Kilogramos)</option>
                <option value="M">M (Metros)</option>
                <option value="LT">LT (Litros)</option>
                <option value="M2">M² (Metros cuadrados)</option>
                <option value="M3">M³ (Metros cúbicos)</option>
                <option value="PAR">PAR (Pares)</option>
                <option value="SET">SET (Conjuntos)</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-gray-100">Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-gray-100">Precio Unitario</label>
              <input
                type="number"
                value={unitario}
                onChange={(e) => setUnitario(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-gray-100">Total (Calculado)</label>
              <input
                type="text"
                value={`$${calcularTotal(cantidad, unitario).toLocaleString()}`}
                readOnly
                className="w-full px-4 py-2 bg-gray-500 text-gray-300 rounded-md cursor-not-allowed"
              />
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={addProducto}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              {editingIndex >= 0 ? 'Actualizar Producto' : 'Agregar Producto'}
            </button>
            
            {editingIndex >= 0 && (
              <button
                onClick={cancelEdit}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Productos Registrados ({productos.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={importFromJSON}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                Importar JSON
              </button>
              <button
                onClick={exportToJSON}
                disabled={productos.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Exportar JSON
              </button>
            </div>
          </div>
          
          {productos.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No hay productos registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-700 bg-gray-800 rounded-md">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="border border-gray-600 px-4 py-2 text-left">ID</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Descripción</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Marca</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">UND</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Cantidad</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Unitario</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Total</th>
                    <th className="border border-gray-600 px-4 py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto, index) => (
                    <tr 
                      key={producto.id} 
                      className={`hover:bg-gray-700 ${editingIndex === index ? 'bg-blue-900' : ''}`}
                    >
                      <td className="border border-gray-600 px-4 py-2 font-bold">{producto.id}</td>
                      <td className="border border-gray-600 px-4 py-2">{producto.descripcion}</td>
                      <td className="border border-gray-600 px-4 py-2">
                        {isValidImageUrl(producto.marca) ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={producto.marca} 
                              alt="Marca" 
                              className="w-12 h-12 object-cover rounded-md"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'block'
                              }}
                            />
                            <span className="text-xs text-gray-400 hidden">Imagen no disponible</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No es una imagen válida</span>
                        )}
                      </td>
                      <td className="border border-gray-600 px-4 py-2">{producto.und}</td>
                      <td className="border border-gray-600 px-4 py-2">{producto.cantidad}</td>
                      <td className="border border-gray-600 px-4 py-2">${producto.unitario.toLocaleString()}</td>
                      <td className="border border-gray-600 px-4 py-2 font-bold">${producto.total.toLocaleString()}</td>
                      <td className="border border-gray-600 px-4 py-2">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => editProducto(index)}
                            className="bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteProducto(index)}
                            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GestionPoductos