// CotizacionPage.jsx
import React, { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function CotizacionPage() {
  const [selectedCompany, setSelectedCompany] = useState('')
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [products, setProducts] = useState([])

  const companies = ['Corporación de Desarrollo de la Comuna', 'Empresa B', 'Empresa C']

  const addProduct = () => {
    if (productName.trim() && productPrice.trim()) {
      setProducts([
        ...products,
        { name: productName, price: parseFloat(productPrice) }
      ])
      setProductName('')
      setProductPrice('')
    }
  }

  const deleteProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const exportToPDF = () => {
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
    doc.text('N°1256505-141-COT25', 155, 30)

    // CLIENTE
    doc.setFillColor(90)
    doc.rect(10, 52, 190, 8, 'F')
    doc.setTextColor(255)
    doc.text('CLIENTE', 12, 58)
    doc.setTextColor(0)

    doc.setFontSize(10)
    doc.text(`ENTIDAD: ${selectedCompany}`, 10, 66)
    doc.text('RUT: 71.015.300-0', 10, 72)
    doc.text('DIRECCIÓN: CAMINO PÚBLICO S/N, IDAHUE', 10, 78)
    doc.text('COMUNA: San Vicente', 10, 84)

    // FECHA Y CONDICIONES
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 160, 66)
    doc.text('VALIDEZ: 30 DÍAS', 160, 72)
    doc.text('COND. PAGO: CRÉDITO', 160, 78)

    // TABLA DE PRODUCTOS
    autoTable(doc, {
      startY: 90,
      head: [['ITEM', 'DESCRIPCIÓN', 'MARCA', 'UND', 'CANT', 'UNITARIO', 'TOTAL']],
      body: products.map((prod, i) => [
        i + 1,
        prod.name,
        '-', // marca
        'UND',
        1,
        `$${prod.price.toLocaleString()}`,
        `$${prod.price.toLocaleString()}`
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [100, 100, 100], textColor: 255 },
    })

    // TOTAL GENERAL
    const total = products.reduce((sum, p) => sum + p.price, 0)
    doc.setFontSize(12)
    doc.text(`TOTAL: $${total.toLocaleString()}`, 160, doc.lastAutoTable.finalY + 10)

    doc.save('cotizacion.pdf')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Dashboard de Cotización</h1>

        {/* Selección de empresa */}
        <div className="mb-6">
          <label className="block mb-2 text-gray-100">Seleccionar Empresa</label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-md"
          >
            <option value="" disabled>Seleccione una empresa</option>
            {companies.map((company, index) => (
              <option key={index} value={company}>{company}</option>
            ))}
          </select>
        </div>

        {/* Formulario de productos */}
        <div className="mb-6">
          <label className="block mb-2 text-gray-100">Nombre del Producto</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-md mb-4"
          />
          <label className="block mb-2 text-gray-100">Precio del Producto</label>
          <input
            type="number"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-md mb-4"
          />
          <button
            onClick={addProduct}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Agregar Producto
          </button>
        </div>

        {/* Tabla de productos */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Productos Agregados</h2>
          <table className="w-full border border-gray-700 bg-gray-800 rounded-md">
            <thead>
              <tr className="bg-gray-700">
                <th className="border px-4 py-2 text-left">Producto</th>
                <th className="border px-4 py-2 text-left">Precio</th>
                <th className="border px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index} className="hover:bg-gray-700">
                  <td className="border px-4 py-2">{product.name}</td>
                  <td className="border px-4 py-2">${product.price.toLocaleString()}</td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => deleteProduct(index)}
                      className="bg-red-600 text-white px-4 py-1 rounded-md hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={exportToPDF}
          className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
        >
          Exportar a PDF
        </button>
      </div>
    </div>
  )
}

export default CotizacionPage