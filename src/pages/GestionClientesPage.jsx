import React, { useState, useRef } from 'react'

function GestionClientesPage() {
  const [rut, setRut] = useState('')
  const [entidad, setEntidad] = useState('')
  const [comuna, setComuna] = useState('')
  const [direccion, setDireccion] = useState('')
  const [clientes, setClientes] = useState([])
  const [editingIndex, setEditingIndex] = useState(-1)
  const fileInputRef = useRef(null) // Referencia para el input de archivo

  const addCliente = () => {
    if (rut.trim() && entidad.trim() && comuna.trim() && direccion.trim()) {
      if (editingIndex >= 0) {
        // Actualizar cliente existente
        const updatedClientes = [...clientes]
        updatedClientes[editingIndex] = { rut, entidad, comuna, direccion }
        setClientes(updatedClientes)
        setEditingIndex(-1)
      } else {
        // Agregar nuevo cliente
        setClientes([
          ...clientes,
          { rut, entidad, comuna, direccion }
        ])
      }
      clearForm()
    }
  }

  const clearForm = () => {
    setRut('')
    setEntidad('')
    setComuna('')
    setDireccion('')
  }

  const deleteCliente = (index) => {
    setClientes(clientes.filter((_, i) => i !== index))
    if (editingIndex === index) {
      setEditingIndex(-1)
      clearForm()
    }
  }

  const editCliente = (index) => {
    const cliente = clientes[index]
    setRut(cliente.rut)
    setEntidad(cliente.entidad)
    setComuna(cliente.comuna)
    setDireccion(cliente.direccion)
    setEditingIndex(index)
  }

  const cancelEdit = () => {
    setEditingIndex(-1)
    clearForm()
  }

  const exportToJSON = () => {
    const dataStr = JSON.stringify(clientes, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'clientes.json'
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
            alert('Error: El archivo JSON debe contener un array de clientes')
            return
          }

          // Validar estructura de cada cliente
          const validClientes = importedData.filter(cliente => {
            return (
              cliente.hasOwnProperty('rut') &&
              cliente.hasOwnProperty('entidad') &&
              cliente.hasOwnProperty('comuna') &&
              cliente.hasOwnProperty('direccion')
            )
          })

          if (validClientes.length === 0) {
            alert('Error: No se encontraron clientes válidos en el archivo')
            return
          }

          // Verificar duplicados por RUT
          const existingRuts = clientes.map(c => c.rut.toLowerCase().trim())
          const newClientes = validClientes.filter(cliente => 
            !existingRuts.includes(cliente.rut.toLowerCase().trim())
          )

          if (newClientes.length === 0) {
            alert('Todos los clientes del archivo ya existen en la base de datos')
            return
          }

          // Agregar nuevos clientes a los existentes
          setClientes([...clientes, ...newClientes])
          
          if (newClientes.length !== validClientes.length) {
            const duplicates = validClientes.length - newClientes.length
            alert(`Se importaron ${newClientes.length} clientes nuevos. ${duplicates} clientes ya existían (RUT duplicado).`)
          } else {
            alert(`Se importaron ${newClientes.length} clientes correctamente`)
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Gestión de Clientes</h1>

        {/* Input oculto para importar archivos */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileImport}
          accept=".json"
          style={{ display: 'none' }}
        />

        {/* Formulario de clientes */}
        <div className="mb-6 bg-gray-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            {editingIndex >= 0 ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-100">RUT</label>
              <input
                type="text"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="Ej: 12.345.678-9"
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-gray-100">Entidad</label>
              <input
                type="text"
                value={entidad}
                onChange={(e) => setEntidad(e.target.value)}
                placeholder="Nombre de la empresa o entidad"
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-gray-100">Comuna</label>
              <input
                type="text"
                value={comuna}
                onChange={(e) => setComuna(e.target.value)}
                placeholder="Comuna"
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-gray-100">Dirección</label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Dirección completa"
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md"
              />
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={addCliente}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              {editingIndex >= 0 ? 'Actualizar Cliente' : 'Agregar Cliente'}
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

        {/* Tabla de clientes */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Clientes Registrados ({clientes.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={importFromJSON}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                Importar JSON
              </button>
              <button
                onClick={exportToJSON}
                disabled={clientes.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Exportar JSON
              </button>
            </div>
          </div>
          
          {clientes.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No hay clientes registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-700 bg-gray-800 rounded-md">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="border border-gray-600 px-4 py-2 text-left">RUT</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Entidad</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Comuna</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Dirección</th>
                    <th className="border border-gray-600 px-4 py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente, index) => (
                    <tr 
                      key={index} 
                      className={`hover:bg-gray-700 ${editingIndex === index ? 'bg-blue-900' : ''}`}
                    >
                      <td className="border border-gray-600 px-4 py-2">{cliente.rut}</td>
                      <td className="border border-gray-600 px-4 py-2">{cliente.entidad}</td>
                      <td className="border border-gray-600 px-4 py-2">{cliente.comuna}</td>
                      <td className="border border-gray-600 px-4 py-2">{cliente.direccion}</td>
                      <td className="border border-gray-600 px-4 py-2">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => editCliente(index)}
                            className="bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteCliente(index)}
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

export default GestionClientesPage