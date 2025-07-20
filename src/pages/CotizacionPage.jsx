// CotizacionPage.jsx
import React, { useState, useRef, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import ClientesModal from '../components/ClientesModal'
import ProductosModal from '../components/ProductosModal'

function CotizacionPage() {
  // Estados para cliente seleccionado
  const [selectedCliente, setSelectedCliente] = useState(null)
  
  // Estados para productos
  const [productos, setProductos] = useState([])
  
  // Estados para los modales
  const [showClientesModal, setShowClientesModal] = useState(false)
  const [showProductosModal, setShowProductosModal] = useState(false)
  
  // Estados para datos importados
  const [clientesData, setClientesData] = useState([])
  const [productosData, setProductosData] = useState([])
  
  // Estados para número de cotización
  const [cotizacionNumber, setCotizacionNumber] = useState('')
  
  // NUEVO: Estados para ganancia
  const [porcentajeGananciaGlobal, setPorcentajeGananciaGlobal] = useState(20) // 20% por defecto
  const [aplicarGananciaGlobal, setAplicarGananciaGlobal] = useState(true)
  
  // NUEVO: Constante para IVA
  const IVA_PORCENTAJE = 19
  
  // Referencias para los inputs de archivo
  const clientesFileRef = useRef(null)
  const productosFileRef = useRef(null)

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedClientes = localStorage.getItem('cotizacion-clientes')
    const savedProductos = localStorage.getItem('cotizacion-productos')
    
    if (savedClientes) {
      try {
        setClientesData(JSON.parse(savedClientes))
      } catch (error) {
        console.error('Error cargando clientes guardados:', error)
      }
    }
    
    if (savedProductos) {
      try {
        setProductosData(JSON.parse(savedProductos))
      } catch (error) {
        console.error('Error cargando productos guardados:', error)
      }
    }
  }, [])

  // Generar número de cotización automático
  useEffect(() => {
    const savedCounter = localStorage.getItem('cotizacion-counter')
    const counter = savedCounter ? parseInt(savedCounter) + 1 : 1
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const newNumber = `${counter.toString().padStart(6, '0')}-${month}-COT${year}`
    
    setCotizacionNumber(newNumber)
    localStorage.setItem('cotizacion-counter', counter.toString())
  }, [])

  // Guardar automáticamente cuando cambien los datos
  useEffect(() => {
    if (clientesData.length > 0) {
      localStorage.setItem('cotizacion-clientes', JSON.stringify(clientesData))
    }
  }, [clientesData])

  useEffect(() => {
    if (productosData.length > 0) {
      localStorage.setItem('cotizacion-productos', JSON.stringify(productosData))
    }
  }, [productosData])

  // Funciones para importar datos
  const importClientes = () => {
    clientesFileRef.current.click()
  }

  const importProductos = () => {
    productosFileRef.current.click()
  }

  const handleClientesImport = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          if (Array.isArray(importedData)) {
            setClientesData(importedData)
            alert(`Se importaron ${importedData.length} clientes correctamente`)
          } else {
            alert('Error: El archivo debe contener un array de clientes')
          }
        } catch (error) {
          alert('Error al leer el archivo: ' + error.message)
        }
      }
      reader.readAsText(file)
    } else {
      alert('Por favor selecciona un archivo JSON válido')
    }
    event.target.value = ''
  }

  const handleProductosImport = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          if (Array.isArray(importedData)) {
            setProductosData(importedData)
            alert(`Se importaron ${importedData.length} productos correctamente`)
          } else {
            alert('Error: El archivo debe contener un array de productos')
          }
        } catch (error) {
          alert('Error al leer el archivo: ' + error.message)
        }
      }
      reader.readAsText(file)
    } else {
      alert('Por favor selecciona un archivo JSON válido')
    }
    event.target.value = ''
  }

  // Función para seleccionar cliente
  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente)
  }

  // NUEVO: Función para calcular precio con IVA
  const calcularPrecioConIVA = (precioSinIVA) => {
    return precioSinIVA * (1 + IVA_PORCENTAJE / 100)
  }

  // MODIFICADO: Función para calcular precio con ganancia
  const calcularPrecioConGanancia = (precioBase, porcentaje) => {
    return precioBase * (1 + porcentaje / 100)
  }

  // MODIFICADO: Función para actualizar ganancia individual de un producto
  const updateGananciaProducto = (index, nuevaGanancia) => {
    const updatedProductos = [...productos]
    updatedProductos[index].porcentajeGanancia = parseFloat(nuevaGanancia) || 0
    updatedProductos[index].precioVenta = calcularPrecioConGanancia(
      updatedProductos[index].unitario, 
      updatedProductos[index].porcentajeGanancia
    )
    updatedProductos[index].precioVentaConIVA = calcularPrecioConIVA(updatedProductos[index].precioVenta)
    setProductos(updatedProductos)
  }

  // MODIFICADO: Función para aplicar ganancia global a todos los productos
  const aplicarGananciaATodos = () => {
    const updatedProductos = productos.map(producto => {
      const precioVenta = calcularPrecioConGanancia(producto.unitario, porcentajeGananciaGlobal)
      return {
        ...producto,
        porcentajeGanancia: porcentajeGananciaGlobal,
        precioVenta: precioVenta,
        precioVentaConIVA: calcularPrecioConIVA(precioVenta)
      }
    })
    setProductos(updatedProductos)
  }

  // MODIFICADO: Función para seleccionar productos (agregar IVA)
  const handleSelectProductos = (productosSeleccionados) => {
    const productosConGanancia = productosSeleccionados.map(producto => {
      const precioVenta = aplicarGananciaGlobal 
        ? calcularPrecioConGanancia(producto.unitario, porcentajeGananciaGlobal)
        : producto.unitario
      return {
        ...producto,
        porcentajeGanancia: aplicarGananciaGlobal ? porcentajeGananciaGlobal : 0,
        precioVenta: precioVenta,
        precioVentaConIVA: calcularPrecioConIVA(precioVenta)
      }
    })
    setProductos(productosConGanancia)
  }

  // Función para eliminar producto
  const deleteProduct = (index) => {
    setProductos(productos.filter((_, i) => i !== index))
  }

  // MODIFICADO: Función para actualizar cantidad de un producto
  const updateCantidadProducto = (index, nuevaCantidad) => {
    const updatedProductos = [...productos]
    updatedProductos[index].cantidadCotizada = parseFloat(nuevaCantidad) || 0
    setProductos(updatedProductos)
  }

  // MODIFICADO: Función para exportar PDF (incluir IVA)
  const exportToPDF = () => {
    if (!selectedCliente) {
      alert('Por favor selecciona un cliente primero')
      return
    }

    if (productos.length === 0) {
      alert('Por favor agrega al menos un producto')
      return
    }

    const doc = new jsPDF()

    // ENCABEZADO
    doc.setFontSize(16)
    doc.text('FERREXPERT SpA.', 10, 15)
    doc.setFontSize(10)
    doc.text('Giro: Venta al por menor por internet y vía telefónica', 10, 21)
    doc.text('Dirección: Av. Nueva Einstein 290, oficina 808', 10, 26)
    doc.text('Ciudad: Rancagua', 10, 31)
    doc.text('Contacto: Diego Gorigoitía R.', 10, 36)
    doc.text('Dgorigoitia@ferrexpert.cl', 10, 41)
    doc.text('Fono: +569 53214349', 10, 46)

    // CUADRO DE RUT Y COTIZACIÓN
    doc.rect(150, 10, 50, 25)
    doc.setFontSize(10)
    doc.text('RUT: 77.834.695-8', 155, 18)
    doc.text('COTIZACIÓN', 155, 24)
    doc.text(`N°${cotizacionNumber}`, 155, 30)

    // CLIENTE
    doc.setFillColor(90)
    doc.rect(10, 52, 190, 8, 'F')
    doc.setTextColor(255)
    doc.text('CLIENTE', 12, 58)
    doc.setTextColor(0)

    doc.setFontSize(10)
    doc.text(`ENTIDAD: ${selectedCliente.entidad}`, 10, 66)
    doc.text(`RUT: ${selectedCliente.rut}`, 10, 72)
    doc.text(`DIRECCIÓN: ${selectedCliente.direccion}`, 10, 78)
    doc.text(`COMUNA: ${selectedCliente.comuna}`, 10, 84)

    // FECHA Y CONDICIONES
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 160, 66)
    doc.text('VALIDEZ: 30 DÍAS', 160, 72)
    doc.text('COND. PAGO: CRÉDITO', 160, 78)

    // TABLA DE PRODUCTOS - MODIFICADA para incluir IVA
    autoTable(doc, {
      startY: 90,
      head: [['ITEM', 'DESCRIPCIÓN', 'UND', 'CANT', 'UNITARIO', 'TOTAL SIN IVA', 'TOTAL CON IVA']],
      body: productos.map((prod, i) => [
        i + 1,
        prod.descripcion,
        prod.und,
        prod.cantidadCotizada,
        `$${Math.round(prod.precioVenta || prod.unitario).toLocaleString()}`,
        `$${Math.round((prod.precioVenta || prod.unitario) * prod.cantidadCotizada).toLocaleString()}`,
        `$${Math.round((prod.precioVentaConIVA || calcularPrecioConIVA(prod.unitario)) * prod.cantidadCotizada).toLocaleString()}`
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [100, 100, 100], textColor: 255 },
    })

    // TOTALES - MODIFICADO para incluir IVA
    const subtotal = productos.reduce((sum, p) => sum + ((p.precioVenta || p.unitario) * p.cantidadCotizada), 0)
    const iva = subtotal * (IVA_PORCENTAJE / 100)
    const total = subtotal + iva

    const finalY = doc.lastAutoTable.finalY + 10

    doc.setFontSize(10)
    doc.text(`SUBTOTAL: $${Math.round(subtotal).toLocaleString()}`, 160, finalY)
    doc.text(`IVA (${IVA_PORCENTAJE}%): $${Math.round(iva).toLocaleString()}`, 160, finalY + 5)
    
    doc.setFontSize(12)
    doc.text(`TOTAL: $${Math.round(total).toLocaleString()}`, 160, finalY + 12)

    doc.save('cotizacion.pdf')
  }

  // Función para limpiar datos guardados
  const clearStoredData = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos guardados?')) {
      localStorage.removeItem('cotizacion-clientes')
      localStorage.removeItem('cotizacion-productos')
      setClientesData([])
      setProductosData([])
      alert('Datos limpiados correctamente')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Nueva Cotización</h1>

        {/* Inputs ocultos para importar archivos */}
        <input
          type="file"
          ref={clientesFileRef}
          onChange={handleClientesImport}
          accept=".json"
          style={{ display: 'none' }}
        />
        <input
          type="file"
          ref={productosFileRef}
          onChange={handleProductosImport}
          accept=".json"
          style={{ display: 'none' }}
        />

        {/* Sección de importación de datos */}
        <div className="mb-6 bg-gray-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Gestión de Datos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <button
                onClick={importClientes}
                className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 mb-2"
              >
                Importar/Actualizar Clientes
              </button>
              <div className="text-sm text-gray-300">
                Clientes cargados: {clientesData.length}
              </div>
            </div>
            <div>
              <button
                onClick={importProductos}
                className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 mb-2"
              >
                Importar/Actualizar Productos
              </button>
              <div className="text-sm text-gray-300">
                Productos cargados: {productosData.length}
              </div>
            </div>
            <div>
              <button
                onClick={clearStoredData}
                className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 mb-2"
              >
                Limpiar Datos Guardados
              </button>
              <div className="text-sm text-gray-400">
                Elimina datos del navegador
              </div>
            </div>
          </div>
        </div>

        {/* NUEVA SECCIÓN: Configuración de Ganancia */}
        <div className="mb-6 bg-gray-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Configuración de Ganancia</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-gray-100">Porcentaje de Ganancia Global (%)</label>
              <input
                type="number"
                value={porcentajeGananciaGlobal}
                onChange={(e) => setPorcentajeGananciaGlobal(parseFloat(e.target.value) || 0)}
                min="0"
                max="1000"
                step="0.1"
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={aplicarGananciaGlobal}
                  onChange={(e) => setAplicarGananciaGlobal(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-100">Aplicar automáticamente a productos nuevos</span>
              </label>
            </div>
            <div className="flex items-end">
              <button
                onClick={aplicarGananciaATodos}
                disabled={productos.length === 0}
                className="w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Aplicar a Todos los Productos
              </button>
            </div>
          </div>
        </div>

        {/* Selección de cliente */}
        <div className="mb-6 bg-gray-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Cliente</h2>
          {selectedCliente ? (
            <div className="bg-gray-600 p-4 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-lg">{selectedCliente.entidad}</div>
                  <div className="text-sm text-gray-300">RUT: {selectedCliente.rut}</div>
                  <div className="text-sm text-gray-300">Comuna: {selectedCliente.comuna}</div>
                  <div className="text-sm text-gray-300">Dirección: {selectedCliente.direccion}</div>
                </div>
                <button
                  onClick={() => setSelectedCliente(null)}
                  className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                >
                  Cambiar Cliente
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowClientesModal(true)}
              disabled={clientesData.length === 0}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {clientesData.length === 0 ? 'Importa clientes primero' : 'Seleccionar Cliente'}
            </button>
          )}
        </div>

        {/* Selección de productos - TABLA MODIFICADA para incluir IVA */}
        <div className="mb-6 bg-gray-700 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Productos ({productos.length})</h2>
            <button
              onClick={() => setShowProductosModal(true)}
              disabled={productosData.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {productosData.length === 0 ? 'Importa productos primero' : 'Agregar Productos'}
            </button>
          </div>

          {productos.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No hay productos agregados a la cotización
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-600 bg-gray-800 rounded-md">
                <thead>
                  <tr className="bg-gray-600">
                    <th className="border border-gray-500 px-2 py-2 text-left text-xs">ID</th>
                    <th className="border border-gray-500 px-2 py-2 text-left text-xs">Descripción</th>
                    <th className="border border-gray-500 px-2 py-2 text-left text-xs">UND</th>
                    <th className="border border-gray-500 px-2 py-2 text-left text-xs">Cant.</th>
                    <th className="border border-gray-500 px-2 py-2 text-left text-xs">Precio Base</th>
                    <th className="border border-gray-500 px-2 py-2 text-left text-xs">Ganancia %</th>
                    <th className="border border-gray-500 px-2 py-2 text-left text-xs">Precio Venta</th>
                    <th className="border border-gray-500 px-2 py-2 text-left text-xs">Precio + IVA</th>
                    <th className="border border-gray-500 px-2 py-2 text-left text-xs">Total sin IVA</th>
                    <th className="border border-gray-500 px-2 py-2 text-left text-xs">Total con IVA</th>
                    <th className="border border-gray-500 px-2 py-2 text-center text-xs">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto, index) => (
                    <tr key={producto.id} className="hover:bg-gray-700">
                      <td className="border border-gray-500 px-1 py-2 text-xs">{producto.id}</td>
                      <td className="border border-gray-500 px-1 py-2 text-xs">{producto.descripcion}</td>
                      <td className="border border-gray-500 px-1 py-2 text-xs">{producto.und}</td>
                      <td className="border border-gray-500 px-1 py-2">
                        <input
                          type="number"
                          value={producto.cantidadCotizada}
                          onChange={(e) => updateCantidadProducto(index, e.target.value)}
                          min="0"
                          max={producto.cantidad}
                          step="0.01"
                          className="w-14 px-1 py-1 bg-gray-600 text-gray-100 rounded text-xs"
                        />
                      </td>
                      <td className="border border-gray-500 px-1 py-2 text-xs">
                        ${producto.unitario.toLocaleString()}
                      </td>
                      <td className="border border-gray-500 px-1 py-2">
                        <input
                          type="number"
                          value={producto.porcentajeGanancia || 0}
                          onChange={(e) => updateGananciaProducto(index, e.target.value)}
                          min="0"
                          max="1000"
                          step="0.1"
                          className="w-14 px-1 py-1 bg-gray-600 text-gray-100 rounded text-xs"
                        />
                      </td>
                      <td className="border border-gray-500 px-1 py-2 font-bold text-xs text-green-400">
                        ${Math.round(producto.precioVenta || producto.unitario).toLocaleString()}
                      </td>
                      <td className="border border-gray-500 px-1 py-2 font-bold text-xs text-blue-400">
                        ${Math.round(producto.precioVentaConIVA || calcularPrecioConIVA(producto.unitario)).toLocaleString()}
                      </td>
                      <td className="border border-gray-500 px-1 py-2 font-bold text-xs">
                        ${Math.round((producto.precioVenta || producto.unitario) * producto.cantidadCotizada).toLocaleString()}
                      </td>
                      <td className="border border-gray-500 px-1 py-2 font-bold text-xs text-blue-400">
                        ${Math.round((producto.precioVentaConIVA || calcularPrecioConIVA(producto.unitario)) * producto.cantidadCotizada).toLocaleString()}
                      </td>
                      <td className="border border-gray-500 px-1 py-2">
                        <button
                          onClick={() => deleteProduct(index)}
                          className="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 text-xs"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Total general y resumen de ganancia - MODIFICADO para incluir IVA */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-right">
                <div className="bg-gray-600 p-3 rounded">
                  <div className="text-sm text-gray-300">Costo Total (sin ganancia)</div>
                  <div className="text-lg font-bold text-red-400">
                    ${productos.reduce((sum, p) => sum + (p.unitario * p.cantidadCotizada), 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-600 p-3 rounded">
                  <div className="text-sm text-gray-300">Subtotal (con ganancia)</div>
                  <div className="text-lg font-bold text-green-400">
                    ${productos.reduce((sum, p) => sum + ((p.precioVenta || p.unitario) * p.cantidadCotizada), 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-600 p-3 rounded">
                  <div className="text-sm text-gray-300">IVA ({IVA_PORCENTAJE}%)</div>
                  <div className="text-lg font-bold text-yellow-400">
                    ${Math.round(productos.reduce((sum, p) => sum + ((p.precioVenta || p.unitario) * p.cantidadCotizada), 0) * (IVA_PORCENTAJE / 100)).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-600 p-3 rounded">
                  <div className="text-sm text-gray-300">Total Final (con IVA)</div>
                  <div className="text-xl font-bold text-blue-400">
                    ${Math.round(productos.reduce((sum, p) => sum + ((p.precioVentaConIVA || calcularPrecioConIVA(p.unitario)) * p.cantidadCotizada), 0)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón para exportar PDF */}
        <button
          onClick={exportToPDF}
          disabled={!selectedCliente || productos.length === 0}
          className="w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-lg font-bold"
        >
          {!selectedCliente ? 'Selecciona un cliente primero' : 
           productos.length === 0 ? 'Agrega productos primero' : 
           'Generar Cotización PDF'}
        </button>

        {/* Modales */}
        <ClientesModal
          isOpen={showClientesModal}
          onClose={() => setShowClientesModal(false)}
          clientes={clientesData}
          onSelectCliente={handleSelectCliente}
        />

        <ProductosModal
          isOpen={showProductosModal}
          onClose={() => setShowProductosModal(false)}
          productos={productosData}
          onSelectProductos={handleSelectProductos}
        />
      </div>
    </div>
  )
}

export default CotizacionPage