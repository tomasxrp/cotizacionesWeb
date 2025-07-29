import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function HistorialCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  
  // Agregar referencia para el input de archivo
  const fileInputRef = useRef(null)

  // Cargar cotizaciones guardadas al montar el componente
  useEffect(() => {
    const saved = localStorage.getItem('historial-cotizaciones')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCotizaciones(parsed)
      } catch (error) {
        console.error('Error cargando historial:', error)
        localStorage.removeItem('historial-cotizaciones')
      }
    }
  }, [])

  // Filtrar cotizaciones por término de búsqueda
  const filteredCotizaciones = cotizaciones.filter(cotizacion =>
    cotizacion.numeroCotizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.cliente.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.cliente.rut.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Función para eliminar cotización
  const eliminarCotizacion = (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta cotización del historial?')) {
      const nuevasCotizaciones = cotizaciones.filter(c => c.id !== id)
      setCotizaciones(nuevasCotizaciones)
      localStorage.setItem('historial-cotizaciones', JSON.stringify(nuevasCotizaciones))
    }
  }

  // Función para editar cotización
  const editarCotizacion = (cotizacion) => {
    // Guardar datos de la cotización a editar en localStorage
    localStorage.setItem('cotizacion-en-edicion', JSON.stringify(cotizacion))
    // Navegar a la página de cotización
    navigate('/cotizacion')
  }

  // Función para limpiar todo el historial
  const limpiarHistorial = () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las cotizaciones del historial?')) {
      setCotizaciones([])
      localStorage.removeItem('historial-cotizaciones')
    }
  }

  // Función para importar historial desde JSON
  const importarHistorial = () => {
    fileInputRef.current.click()
  }

  // Función para manejar la importación de archivo
  const handleFileImport = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          
          // Validar que sea un array
          if (!Array.isArray(importedData)) {
            alert('❌ Error: El archivo debe contener un array de cotizaciones')
            return
          }

          if (importedData.length === 0) {
            alert('❌ Error: El archivo está vacío')
            return
          }

          // Validar estructura de cada cotización
          const requiredFields = ['id', 'numeroCotizacion', 'fecha', 'cliente', 'productos', 'totalFinal']
          const invalidCotizaciones = []
          
          const validCotizaciones = importedData.filter((cotizacion, index) => {
            const missingFields = requiredFields.filter(field => !cotizacion.hasOwnProperty(field))
            
            if (missingFields.length > 0) {
              invalidCotizaciones.push({
                index: index + 1,
                cotizacion: cotizacion,
                missingFields
              })
              return false
            }
            
            // Validar estructura del cliente
            if (!cotizacion.cliente.rut || !cotizacion.cliente.entidad || 
                !cotizacion.cliente.comuna || !cotizacion.cliente.direccion) {
              invalidCotizaciones.push({
                index: index + 1,
                cotizacion: cotizacion,
                missingFields: ['Datos de cliente incompletos']
              })
              return false
            }
            
            // Validar que tenga productos
            if (!Array.isArray(cotizacion.productos) || cotizacion.productos.length === 0) {
              invalidCotizaciones.push({
                index: index + 1,
                cotizacion: cotizacion,
                missingFields: ['No tiene productos válidos']
              })
              return false
            }
            
            return true
          })

          // Mostrar errores si los hay
          if (invalidCotizaciones.length > 0) {
            let errorMessage = `⚠️ Se encontraron ${invalidCotizaciones.length} cotizaciones con errores:\n\n`
            invalidCotizaciones.slice(0, 3).forEach(error => {
              errorMessage += `Cotización ${error.index}: ${error.missingFields.join(', ')}\n`
            })
            
            if (invalidCotizaciones.length > 3) {
              errorMessage += `\n... y ${invalidCotizaciones.length - 3} errores más.`
            }
            
            if (validCotizaciones.length === 0) {
              alert(errorMessage + '\n\nNo se encontraron cotizaciones válidas para importar.')
              return
            } else {
              errorMessage += `\n\n¿Continuar importando ${validCotizaciones.length} cotizaciones válidas?`
              if (!confirm(errorMessage)) {
                return
              }
            }
          }

          // Procesar cotizaciones válidas
          if (validCotizaciones.length > 0) {
            // Verificar duplicados por ID
            const existingIds = cotizaciones.map(c => c.id)
            const newCotizaciones = validCotizaciones.filter(cotizacion => 
              !existingIds.includes(cotizacion.id)
            )
            
            if (newCotizaciones.length === 0) {
              alert('ℹ️ Todas las cotizaciones del archivo ya existen en el historial')
              return
            }
            
            // Confirmar importación
            const duplicates = validCotizaciones.length - newCotizaciones.length
            let confirmMessage = `📊 Resumen de importación:\n\n`
            confirmMessage += `• ${newCotizaciones.length} cotizaciones nuevas para importar\n`
            
            if (duplicates > 0) {
              confirmMessage += `• ${duplicates} cotizaciones ya existían (se omitirán)\n`
            }
            
            if (invalidCotizaciones.length > 0) {
              confirmMessage += `• ${invalidCotizaciones.length} cotizaciones con errores (se omitirán)\n`
            }
            
            confirmMessage += `\n¿Proceder con la importación?`
            
            if (confirm(confirmMessage)) {
              // Combinar cotizaciones existentes con las nuevas
              const combinedCotizaciones = [...cotizaciones, ...newCotizaciones]
              
              // Ordenar por fecha más reciente
              const sortedCotizaciones = combinedCotizaciones.sort((a, b) => 
                new Date(b.fecha) - new Date(a.fecha)
              )
              
              // Mantener solo las últimas 200 cotizaciones
              const limitedCotizaciones = sortedCotizaciones.slice(0, 200)
              
              setCotizaciones(limitedCotizaciones)
              localStorage.setItem('historial-cotizaciones', JSON.stringify(limitedCotizaciones))
              
              alert(`✅ Importación completada exitosamente!\n\n${newCotizaciones.length} cotizaciones importadas`)
            }
          }
          
        } catch (error) {
          alert(`❌ Error al leer el archivo JSON:\n${error.message}\n\nVerifica que el archivo tenga formato JSON válido.`)
        }
      }
      reader.readAsText(file)
    } else {
      alert('❌ Por favor selecciona un archivo JSON válido')
    }
    event.target.value = ''
  }

  // Función mejorada para exportar historial con información adicional
  const exportarHistorial = () => {
    if (cotizaciones.length === 0) {
      alert('No hay cotizaciones para exportar')
      return
    }

    // Agregar metadatos al export
    const exportData = {
      exportInfo: {
        fecha: new Date().toISOString(),
        totalCotizaciones: cotizaciones.length,
        valorTotal: cotizaciones.reduce((sum, c) => sum + c.totalFinal, 0),
        version: "1.0"
      },
      cotizaciones: cotizaciones
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historial-cotizaciones-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Calcular estadísticas
  const totalCotizaciones = cotizaciones.length
  const totalValor = cotizaciones.reduce((sum, c) => sum + c.totalFinal, 0)
  const promedioValor = totalCotizaciones > 0 ? totalValor / totalCotizaciones : 0

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Historial de Cotizaciones</h1>

        {/* Input oculto para importar archivos */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileImport}
          accept=".json"
          style={{ display: 'none' }}
        />

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">{totalCotizaciones}</div>
            <div className="text-sm text-gray-300">Total Cotizaciones</div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">${totalValor.toLocaleString()}</div>
            <div className="text-sm text-gray-300">Valor Total Cotizado</div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">${Math.round(promedioValor).toLocaleString()}</div>
            <div className="text-sm text-gray-300">Promedio por Cotización</div>
          </div>
        </div>

        {/* Barra de búsqueda y controles actualizada */}
        <div className="mb-6 bg-gray-700 p-4 rounded-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-grow">
              <input
                type="text"
                placeholder="Buscar por número de cotización, cliente o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate('/cotizacion')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                📝 Nueva Cotización
              </button>
              <button
                onClick={importarHistorial}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                📥 Importar Historial
              </button>
              <button
                onClick={exportarHistorial}
                disabled={cotizaciones.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-600"
              >
                📤 Exportar Historial
              </button>
              <button
                onClick={limpiarHistorial}
                disabled={cotizaciones.length === 0}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-600"
              >
                🗑️ Limpiar Todo
              </button>
            </div>
          </div>
        </div>

        {/* Lista de cotizaciones */}
        <div className="mb-6">
          {filteredCotizaciones.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {searchTerm ? 
                'No se encontraron cotizaciones que coincidan con la búsqueda' : 
                'No hay cotizaciones guardadas'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-700 bg-gray-800 rounded-md">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="border border-gray-600 px-4 py-2 text-left">N° Cotización</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Fecha</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Cliente</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">RUT</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Productos</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Total</th>
                    <th className="border border-gray-600 px-4 py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCotizaciones
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) // Ordenar por fecha más reciente
                    .map((cotizacion) => (
                    <tr key={cotizacion.id} className="hover:bg-gray-700">
                      <td className="border border-gray-600 px-4 py-2 font-bold text-blue-400">
                        N°{cotizacion.numeroCotizacion}
                      </td>
                      <td className="border border-gray-600 px-4 py-2">
                        {new Date(cotizacion.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="border border-gray-600 px-4 py-2">
                        <div className="font-semibold">{cotizacion.cliente.entidad}</div>
                        <div className="text-sm text-gray-400">{cotizacion.cliente.comuna}</div>
                      </td>
                      <td className="border border-gray-600 px-4 py-2 text-sm">
                        {cotizacion.cliente.rut}
                      </td>
                      <td className="border border-gray-600 px-4 py-2 text-center">
                        <span className="bg-gray-600 text-gray-100 px-2 py-1 rounded-full text-sm">
                          {cotizacion.productos.length}
                        </span>
                      </td>
                      <td className="border border-gray-600 px-4 py-2 font-bold text-green-400">
                        ${cotizacion.totalFinal.toLocaleString()}
                      </td>
                      <td className="border border-gray-600 px-4 py-2">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => editarCotizacion(cotizacion)}
                            className="bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 text-sm"
                            title="Editar cotización"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => eliminarCotizacion(cotizacion.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                            title="Eliminar del historial"
                          >
                            🗑️ Eliminar
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

        {/* Información adicional */}
        {searchTerm && filteredCotizaciones.length > 0 && (
          <div className="text-sm text-gray-400 text-center">
            Mostrando {filteredCotizaciones.length} de {cotizaciones.length} cotizaciones
          </div>
        )}
      </div>
    </div>
  )
}

export default HistorialCotizaciones