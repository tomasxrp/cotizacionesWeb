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
  
  // Estados para número de cotización y plazo
  const [cotizacionNumber, setCotizacionNumber] = useState('')
  const [customCotizacionNumber, setCustomCotizacionNumber] = useState('')
  const [plazoEntrega, setPlazoEntrega] = useState(3) // 3 días por defecto
  
  // Estados para ganancia
  const [porcentajeGananciaGlobal, setPorcentajeGananciaGlobal] = useState(20)
  const [aplicarGananciaGlobal, setAplicarGananciaGlobal] = useState(true)
  
  // Estado para indicador de carga
  const [generatingPDF, setGeneratingPDF] = useState(false)
  
  // Constante para IVA
  const IVA_PORCENTAJE = 19
  
  // Referencias para los inputs de archivo
  const clientesFileRef = useRef(null)
  const productosFileRef = useRef(null)

  // Función de validación para clientes
  const validateClientesData = (clientes) => {
    const requiredFields = ['rut', 'entidad', 'comuna', 'direccion']
    return clientes.filter(cliente => 
      requiredFields.every(field => 
        cliente.hasOwnProperty(field) && 
        typeof cliente[field] === 'string' && 
        cliente[field].trim().length > 0
      )
    )
  }

  // Función de validación para productos
  const validateProductosData = (productos) => {
    const requiredFields = ['id', 'descripcion', 'marca', 'und', 'cantidad', 'unitario', 'total']
    return productos.filter(producto => 
      requiredFields.every(field => producto.hasOwnProperty(field)) &&
      typeof producto.descripcion === 'string' && producto.descripcion.trim().length > 0 &&
      typeof producto.marca === 'string' &&
      typeof producto.und === 'string' && producto.und.trim().length > 0 &&
      typeof producto.cantidad === 'number' && producto.cantidad >= 0 &&
      typeof producto.unitario === 'number' && producto.unitario >= 0 &&
      typeof producto.total === 'number' && producto.total >= 0
    )
  }

  // Cargar datos del localStorage al iniciar con validación
  useEffect(() => {
    const savedClientes = localStorage.getItem('cotizacion-clientes')
    const savedProductos = localStorage.getItem('cotizacion-productos')
    
    if (savedClientes) {
      try {
        const parsedClientes = JSON.parse(savedClientes)
        const validClientes = validateClientesData(parsedClientes)
        setClientesData(validClientes)
        
        if (validClientes.length !== parsedClientes.length) {
          console.warn(`Se filtraron ${parsedClientes.length - validClientes.length} clientes inválidos del localStorage`)
        }
      } catch (error) {
        console.error('Error cargando clientes guardados:', error)
        localStorage.removeItem('cotizacion-clientes')
      }
    }
    
    if (savedProductos) {
      try {
        const parsedProductos = JSON.parse(savedProductos)
        const validProductos = validateProductosData(parsedProductos)
        setProductosData(validProductos)
        
        if (validProductos.length !== parsedProductos.length) {
          console.warn(`Se filtraron ${parsedProductos.length - validProductos.length} productos inválidos del localStorage`)
        }
      } catch (error) {
        console.error('Error cargando productos guardados:', error)
        localStorage.removeItem('cotizacion-productos')
      }
    }
  }, [])

  // Generar número de cotización automático
  useEffect(() => {
    const savedCounter = localStorage.getItem('cotizacion-counter')
    const counter = savedCounter ? parseInt(savedCounter) + 1 : 1
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const autoNumber = `${counter.toString().padStart(6, '0')}-${month}-COT${year}`
    
    setCotizacionNumber(autoNumber)
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

  // Función mejorada para importar clientes con validación
  const handleClientesImport = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          
          if (!Array.isArray(importedData)) {
            alert('❌ Error: El archivo debe contener un array de clientes')
            return
          }

          if (importedData.length === 0) {
            alert('❌ Error: El archivo está vacío')
            return
          }

          const requiredFields = ['rut', 'entidad', 'comuna', 'direccion']
          const invalidClientes = []
          
          const validClientes = importedData.filter((cliente, index) => {
            const missingFields = requiredFields.filter(field => !cliente.hasOwnProperty(field) || !cliente[field])
            
            if (missingFields.length > 0) {
              invalidClientes.push({
                index: index + 1,
                cliente: cliente,
                missingFields
              })
              return false
            }
            
            if (typeof cliente.rut !== 'string' || 
                typeof cliente.entidad !== 'string' || 
                typeof cliente.comuna !== 'string' || 
                typeof cliente.direccion !== 'string') {
              invalidClientes.push({
                index: index + 1,
                cliente: cliente,
                missingFields: ['Tipos de datos incorrectos']
              })
              return false
            }
            
            return true
          })

          if (invalidClientes.length > 0) {
            let errorMessage = `❌ Se encontraron ${invalidClientes.length} clientes con errores:\n\n`
            invalidClientes.slice(0, 5).forEach(error => {
              errorMessage += `Cliente ${error.index}: Faltan o son inválidos: ${error.missingFields.join(', ')}\n`
            })
            
            if (invalidClientes.length > 5) {
              errorMessage += `\n... y ${invalidClientes.length - 5} errores más.`
            }
            
            errorMessage += `\n\nEstructura requerida para clientes:\n`
            errorMessage += `{\n  "rut": "12.345.678-9",\n  "entidad": "Empresa S.A.",\n  "comuna": "Santiago",\n  "direccion": "Calle 123"\n}`
            
            alert(errorMessage)
            
            if (validClientes.length === 0) {
              return
            }
          }

          if (validClientes.length > 0) {
            setClientesData(validClientes)
            
            let successMessage = `✅ Importación exitosa:\n`
            successMessage += `• ${validClientes.length} clientes importados correctamente`
            
            if (invalidClientes.length > 0) {
              successMessage += `\n• ${invalidClientes.length} clientes ignorados por errores`
            }
            
            alert(successMessage)
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

  // Función mejorada para importar productos con validación
  const handleProductosImport = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          
          if (!Array.isArray(importedData)) {
            alert('❌ Error: El archivo debe contener un array de productos')
            return
          }

          if (importedData.length === 0) {
            alert('❌ Error: El archivo está vacío')
            return
          }

          const requiredFields = ['id', 'descripcion', 'marca', 'und', 'cantidad', 'unitario', 'total'
          ]
          const invalidProductos = []
          
          const validProductos = importedData.filter((producto, index) => {
            const missingFields = requiredFields.filter(field => !producto.hasOwnProperty(field))
            
            if (missingFields.length > 0) {
              invalidProductos.push({
                index: index + 1,
                producto: producto,
                missingFields
              })
              return false
            }
            
            const errors = []
            
            if (typeof producto.descripcion !== 'string' || !producto.descripcion.trim()) {
              errors.push('descripción inválida')
            }
            
            if (typeof producto.marca !== 'string') {
              errors.push('marca inválida')
            }
            
            if (typeof producto.und !== 'string' || !producto.und.trim()) {
              errors.push('unidad inválida')
            }
            
            if (typeof producto.cantidad !== 'number' || producto.cantidad < 0 || isNaN(producto.cantidad)) {
              errors.push('cantidad inválida')
            }
            
            if (typeof producto.unitario !== 'number' || producto.unitario < 0 || isNaN(producto.unitario)) {
              errors.push('precio unitario inválido')
            }
            
            if (typeof producto.total !== 'number' || producto.total < 0 || isNaN(producto.total)) {
              errors.push('total inválido')
            }
            
            if (errors.length > 0) {
              invalidProductos.push({
                index: index + 1,
                producto: producto,
                missingFields: errors
              })
              return false
            }
            
            return true
          })

          if (invalidProductos.length > 0) {
            let errorMessage = `❌ Se encontraron ${invalidProductos.length} productos con errores:\n\n`
            invalidProductos.slice(0, 5).forEach(error => {
              errorMessage += `Producto ${error.index}: ${error.missingFields.join(', ')}\n`
            })
            
            if (invalidProductos.length > 5) {
              errorMessage += `\n... y ${invalidProductos.length - 5} errores más.`
            }
            
            errorMessage += `\n\nEstructura requerida para productos:\n`
            errorMessage += `{\n  "id": 1,\n  "descripcion": "Producto ejemplo",\n  "marca": "https://ejemplo.com/imagen.jpg",\n  "und": "UND",\n  "cantidad": 10,\n  "unitario": 1000,\n  "total": 10000\n}`
            
            alert(errorMessage)
            
            if (validProductos.length === 0) {
              return
            }
          }

          if (validProductos.length > 0) {
            const processedProductos = validProductos.map(producto => ({
              ...producto,
              total: (parseFloat(producto.cantidad) || 0) * (parseFloat(producto.unitario) || 0)
            }))

            setProductosData(processedProductos)
            
            let successMessage = `✅ Importación exitosa:\n`
            successMessage += `• ${validProductos.length} productos importados correctamente`
            
            if (invalidProductos.length > 0) {
              successMessage += `\n• ${invalidProductos.length} productos ignorados por errores`
            }
            
            alert(successMessage)
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

  // Función para seleccionar cliente
  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente)
  }

  // Función para calcular precio con IVA
  const calcularPrecioConIVA = (precioSinIVA) => {
    return precioSinIVA * (1 + IVA_PORCENTAJE / 100)
  }

  // Función para calcular precio con ganancia
  const calcularPrecioConGanancia = (precioBase, porcentaje) => {
    return precioBase * (1 + porcentaje / 100)
  }

  // Función para actualizar ganancia individual de un producto
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

  // Función para aplicar ganancia global a todos los productos
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

  // Función para seleccionar productos (agregar IVA)
  const handleSelectProductos = (productosSeleccionados) => {
    const productosConGanancia = productosSeleccionados.map(producto => {
      const precioVenta = aplicarGananciaGlobal 
        ? calcularPrecioConGanancia(producto.unitario, porcentajeGananciaGlobal)
        : producto.unitario
      return {
        ...producto,
        porcentajeGanancia: aplicarGananciaGlobal ? porcentajeGananciaGlobal : 0,
        precioVenta: precioVenta,
        precioVentaConIVA: calcularPrecioConIVA(precioVenta),
        cantidadCotizada: 1 // Cantidad inicial
      }
    })
    setProductos(productosConGanancia)
  }

  // Función para eliminar producto
  const deleteProduct = (index) => {
    setProductos(productos.filter((_, i) => i !== index))
  }

  // Función para actualizar cantidad de un producto
  const updateCantidadProducto = (index, nuevaCantidad) => {
    const updatedProductos = [...productos]
    updatedProductos[index].cantidadCotizada = parseFloat(nuevaCantidad) || 0
    setProductos(updatedProductos)
  }

  // Función para exportar PDF con imágenes
  const exportToPDF = async () => {
    if (!selectedCliente) {
      alert('Por favor selecciona un cliente primero')
      return
    }

    if (productos.length === 0) {
      alert('Por favor agrega al menos un producto')
      return
    }

    setGeneratingPDF(true)

    const doc = new jsPDF()

    // Función para convertir imagen a base64 con múltiples proxies
    const imageToBase64 = (url) => {
      return new Promise((resolve) => {
        console.log('Intentando cargar imagen:', url)
        
        // Lista de proxies gratuitos para imágenes
        const proxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
          `https://corsproxy.io/?${encodeURIComponent(url)}`,
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
        ]
        
        let proxyIndex = 0
        
        const tryNextProxy = () => {
          if (proxyIndex >= proxies.length) {
            console.warn('No se pudo cargar la imagen:', url)
            resolve(null)
            return
          }
          
          const img = new Image()
          img.crossOrigin = 'anonymous'
          
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              
              // Redimensionar la imagen para optimizar el PDF
              const maxWidth = 150
              const maxHeight = 150
              
              let { width, height } = img
              
              if (width > height) {
                if (width > maxWidth) {
                  height = (height * maxWidth) / width
                  width = maxWidth
                }
              } else {
                if (height > maxHeight) {
                  width = (width * maxHeight) / height
                  height = maxHeight
                }
              }
              
              canvas.width = width
              canvas.height = height
              
              // Fondo blanco para PNGs con transparencia
              ctx.fillStyle = '#FFFFFF'
              ctx.fillRect(0, 0, width, height)
              
              ctx.drawImage(img, 0, 0, width, height)
              
              const dataURL = canvas.toDataURL('image/jpeg', 0.8)
              console.log('✅ Imagen convertida exitosamente:', url)
              resolve(dataURL)
            } catch (error) {
              console.warn('Error al convertir imagen:', error)
              proxyIndex++
              tryNextProxy()
            }
          }
          
          img.onerror = () => {
            console.warn(`Proxy ${proxyIndex + 1} falló para:`, url)
            proxyIndex++
            tryNextProxy()
          }
          
          // Timeout de 8 segundos por proxy
          setTimeout(() => {
            if (!img.complete) {
              console.warn(`Timeout en proxy ${proxyIndex + 1}:`, url)
              proxyIndex++
              tryNextProxy()
            }
          }, 8000)
          
          // Usar el proxy actual
          img.src = proxies[proxyIndex]
        }
        
        // Primero intentar cargar directamente
        const directImg = new Image()
        directImg.crossOrigin = 'anonymous'
        
        directImg.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            // Redimensionar
            const maxWidth = 150
            const maxHeight = 150
            let { width, height } = directImg
            
            if (width > height) {
              if (width > maxWidth) {
                height = (height * maxWidth) / width
                width = maxWidth
              }
            } else {
              if (height > maxHeight) {
                width = (width * maxHeight) / height
                height = maxHeight
              }
            }
            
            canvas.width = width
            canvas.height = height
            
            // Fondo blanco
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, width, height)
            
            ctx.drawImage(directImg, 0, 0, width, height)
            
            const dataURL = canvas.toDataURL('image/jpeg', 0.8)
            console.log('✅ Imagen cargada directamente:', url)
            resolve(dataURL)
          } catch (error) {
            console.warn('Error en carga directa, intentando proxies:', error)
            tryNextProxy()
          }
        }
        
        directImg.onerror = () => {
          console.warn('Carga directa falló, intentando proxies:', url)
          tryNextProxy()
        }
        
        // Timeout para carga directa
        setTimeout(() => {
          if (!directImg.complete) {
            console.warn('Timeout en carga directa:', url)
            tryNextProxy()
          }
        }, 5000)
        
        directImg.src = url
      })
    }

    // Función para verificar si es una imagen válida
    const isValidImageUrl = (url) => {
      if (!url || typeof url !== 'string') return false
      
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
      const urlLower = url.toLowerCase()
      
      return imageExtensions.some(ext => urlLower.includes(ext))
    }

    try {
      // Cargar todas las imágenes con timeout global
      const imagePromises = productos.map(async (producto) => {
        if (isValidImageUrl(producto.marca)) {
          const timeoutPromise = new Promise(resolve => 
            setTimeout(() => resolve(null), 15000) // 15 segundos timeout por imagen
          )
          
          const imagePromise = imageToBase64(producto.marca)
          const base64 = await Promise.race([imagePromise, timeoutPromise])
          
          return { ...producto, imagenBase64: base64 }
        }
        return { ...producto, imagenBase64: null }
      })

      const productosConImagenes = await Promise.all(imagePromises)

      // ENCABEZADO
      try {
        // Intentar cargar el logo
        const logoImg = new Image()
        logoImg.src = '/cotizacionesWeb/img/logo.png'
        
        await new Promise((resolve, reject) => {
          logoImg.onload = () => {
            // Calcular dimensiones manteniendo la proporción
            const maxWidth = 60  // Ancho máximo deseado
            const maxHeight = 20 // Alto máximo deseado
            
            let { width, height } = logoImg
            
            // Calcular la escala para mantener proporciones
            const scaleX = maxWidth / width
            const scaleY = maxHeight / height
            const scale = Math.min(scaleX, scaleY) // Usar la escala menor para que quepa completamente
            
            // Calcular nuevas dimensiones
            const newWidth = width * scale
            const newHeight = height * scale
            
            // Centrar horizontalmente en el espacio disponible
            const logoX = 10 + (maxWidth - newWidth) / 2
            const logoY = 10
            
            // Agregar logo al PDF con proporciones correctas
            doc.addImage(logoImg, 'PNG', logoX, logoY, newWidth, newHeight)
            console.log(`Logo agregado: ${newWidth}x${newHeight} en posición (${logoX}, ${logoY})`)
            resolve()
          }
          logoImg.onerror = () => {
            console.warn('No se pudo cargar el logo desde /cotizacionesWeb/img/logo.png')
            resolve() // Continuar sin logo
          }
          // Timeout de 3 segundos
          setTimeout(() => {
            console.warn('Timeout cargando logo')
            resolve()
          }, 3000)
        })
      } catch (error) {
        console.warn('Error cargando logo:', error)
      }

      // Texto del encabezado (ajustar posición según el logo)
      const headerStartY = 35 // Dar más espacio al logo
      doc.setFontSize(10)
      doc.text('FERREXPERT SpA.', 10, headerStartY)
      doc.setFontSize(10)
      doc.text('Giro: Venta al por menor por internet y vía telefónica', 10, headerStartY + 6)
      doc.text('Dirección: Av. Nueva Einstein 290, oficina 808', 10, headerStartY + 11)
      doc.text('Ciudad: Rancagua', 10, headerStartY + 16)
      doc.text('Contacto: Diego Gorigoitía R.', 10, headerStartY + 21)
      doc.text('Dgorigoitia@ferrexpert.cl', 10, headerStartY + 26)
      doc.text('Fono: +569 53214349', 10, headerStartY + 31)

      // CUADRO DE RUT Y COTIZACIÓN (ajustar posición)
      const boxY = headerStartY - 5
      doc.rect(150, boxY, 50, 25)
      doc.setFontSize(10)
      doc.text('RUT: 77.834.695-8', 155, boxY + 8)
      doc.text('COTIZACIÓN', 155, boxY + 14)

      const numeroFinal = customCotizacionNumber || cotizacionNumber
      doc.text(`N°${numeroFinal}`, 155, boxY + 20)

      // CLIENTE (ajustar posición)
      const clienteY = headerStartY + 37
      doc.setFillColor(90)
      doc.rect(10, clienteY, 190, 8, 'F')
      doc.setTextColor(255)
      doc.text('CLIENTE', 12, clienteY + 6)
      doc.setTextColor(0)

      doc.setFontSize(10)
      doc.text(`ENTIDAD: ${selectedCliente.entidad}`, 10, clienteY + 14)
      doc.text(`RUT: ${selectedCliente.rut}`, 10, clienteY + 20)
      doc.text(`DIRECCIÓN: ${selectedCliente.direccion}`, 10, clienteY + 26)
      doc.text(`COMUNA: ${selectedCliente.comuna}`, 10, clienteY + 32)

      // FECHA Y CONDICIONES (ajustar posición)
      doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 160, clienteY + 14)
      doc.text('VALIDEZ: 30 DÍAS', 160, clienteY + 20)
      doc.text(`PLAZO: ${plazoEntrega} DÍAS HÁBILES`, 160, clienteY + 26)
      doc.text('CRÉDITO 30 DÍAS', 160, clienteY + 32)

      // TABLA DE PRODUCTOS CON IMÁGENES (ajustar posición inicial)
      let currentY = clienteY + 38 // Ajustar según el nuevo layout
      const rowHeight = 25 // Definir altura de fila

      // Encabezados de la tabla
      doc.setFillColor(100, 100, 100)
      doc.rect(10, currentY, 190, 8, 'F')
      doc.setTextColor(255)
      doc.setFontSize(9)
      doc.text('ITEM', 12, currentY + 5)
      doc.text('IMAGEN', 30, currentY + 5)
      doc.text('DESCRIPCIÓN', 55, currentY + 5)
      doc.text('UND', 110, currentY + 5)
      doc.text('CANT', 125, currentY + 5)
      doc.text('UNITARIO', 145, currentY + 5)
      doc.text('TOTAL', 175, currentY + 5)
      
      doc.setTextColor(0)
      currentY += 8

      // Filas de productos
      productosConImagenes.forEach((producto, index) => {
        if (currentY + rowHeight > 240) { // Dejamos más espacio para el footer
          doc.addPage()
          currentY = 20
        }

        // Fondo alternado para las filas
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245)
          doc.rect(10, currentY, 190, rowHeight, 'F')
        }

        doc.setFontSize(8)
        doc.text((index + 1).toString(), 12, currentY + 12)
        
        // Agregar imagen si está disponible
        if (producto.imagenBase64) {
          try {
            doc.addImage(producto.imagenBase64, 'JPEG', 32, currentY + 2, 20, 20)
          } catch (error) {
            console.error('Error al agregar imagen al PDF:', error)
            doc.text('Error img', 35, currentY + 12)
          }
        } else {
          doc.text('Sin img', 35, currentY + 12)
        }

        // Descripción con salto de línea automático
        const maxWidth = 50 // Ancho máximo en unidades PDF
        const descripcionLines = doc.splitTextToSize(producto.descripcion, maxWidth)
        
        // Si hay múltiples líneas, ajustar la altura de la fila
        const lineHeight = 3
        const extraHeight = (descripcionLines.length - 1) * lineHeight
        
        // Verificar si necesitamos más espacio para las líneas adicionales
        if (currentY + rowHeight + extraHeight > 240) {
          doc.addPage()
          currentY = 20
        }
        
        // Dibujar cada línea de la descripción
        descripcionLines.forEach((line, lineIndex) => {
          doc.text(line, 55, currentY + 12 + (lineIndex * lineHeight))
        })
        
        // Ajustar otros elementos si la descripción es muy larga
        const textY = descripcionLines.length > 1 ? currentY + 12 + Math.floor(descripcionLines.length / 2) * lineHeight : currentY + 12
        
        doc.text(producto.und, 110, textY)
        doc.text(producto.cantidadCotizada.toString(), 125, textY)
        doc.text(`$${Math.round(producto.precioVenta || producto.unitario).toLocaleString()}`, 145, textY)
        
        const totalSinIVA = Math.round((producto.precioVenta || producto.unitario) * producto.cantidadCotizada)
        doc.text(`$${totalSinIVA.toLocaleString()}`, 175, textY)

        // Ajustar la altura de la fila si hay líneas extra
        const finalRowHeight = rowHeight + extraHeight
        
        // Línea separadora ajustada
        doc.setDrawColor(200, 200, 200)
        doc.line(10, currentY + finalRowHeight, 200, currentY + finalRowHeight)

        currentY += finalRowHeight
      })

      // TOTALES (lado derecho)
      const subtotal = productos.reduce((sum, p) => sum + ((p.precioVenta || p.unitario) * p.cantidadCotizada), 0)
      const iva = subtotal * (IVA_PORCENTAJE / 100)
      const total = subtotal + iva

      currentY += 10

      if (currentY + 60 > 280) {
        doc.addPage()
        currentY = 20
      }

      // Caja para totales (lado derecho)
      doc.setFillColor(240, 240, 240)
      doc.rect(140, currentY, 60, 30, 'F')
      doc.rect(140, currentY, 60, 30)

      doc.setFontSize(8)
      doc.text('NETO', 142, currentY + 6)
      doc.text('FLETE', 142, currentY + 12)
      doc.text('SUB TOTAL', 142, currentY + 18)
      doc.text(`IVA (${IVA_PORCENTAJE}%)`, 142, currentY + 24)

      doc.setFontSize(8)
      doc.text('$', 165, currentY + 6)
      doc.text('$', 165, currentY + 12)
      doc.text('$', 165, currentY + 18)
      doc.text('$', 165, currentY + 24)

      doc.text(`${Math.round(subtotal).toLocaleString()}`, 170, currentY + 6)
      doc.text('-', 170, currentY + 12)
      doc.text(`${Math.round(subtotal).toLocaleString()}`, 170, currentY + 18)
      doc.text(`${Math.round(iva).toLocaleString()}`, 170, currentY + 24)

      // TOTAL final
      doc.setFillColor(0)
      doc.rect(140, currentY + 30, 60, 8, 'F')
      doc.setTextColor(255)
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('TOTAL', 142, currentY + 36)
      doc.text('$', 165, currentY + 36)
      doc.text(`${Math.round(total).toLocaleString()}`, 170, currentY + 36)

      // FOOTER - Descripción (lado izquierdo)
      doc.setTextColor(0)
      doc.setFont(undefined, 'normal')
      doc.setFillColor(240, 240, 240)
      doc.rect(10, currentY, 125, 38, 'F')
      doc.rect(10, currentY, 125, 38)

      doc.setFontSize(8)
      doc.setFont(undefined, 'bold')
      doc.text('DESCRIPCIÓN', 12, currentY + 6)
      doc.setFont(undefined, 'normal')
      doc.text('1. Despacho gratuito', 12, currentY + 12)
      doc.text(`2. Plazo máximo de entrega: ${plazoEntrega} días hábiles`, 12, currentY + 18)
      doc.text('3. Crédito 30 días', 12, currentY + 24)

      // Logo y datos de la empresa en el footer
      doc.setFontSize(7)
      doc.text('FERREXPERT SPA', 95, currentY + 12)
      doc.text('77.834.695-8', 95, currentY + 16)
      doc.text('BANCO BCI', 95, currentY + 20)
      doc.text('CUENTA CORRIENTE', 95, currentY + 24)
      doc.text('N° CTA: 25082661', 95, currentY + 28)
      doc.text('CONTABILIDAD@FERREXPERT.CL', 95, currentY + 32)

      // Nota final
      currentY += 45
      if (currentY + 10 > 280) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(8)
      doc.text('Si usted tiene alguna consulta sobre esta cotización, por favor, póngase en contacto con nosotros', 10, currentY + 5)

      // Footer final
      currentY += 15
      if (currentY + 10 > 280) {
        doc.addPage()
        currentY = 20
      }

      doc.setFillColor(128, 128, 128)
      doc.rect(10, currentY, 190, 8, 'F')
      doc.setTextColor(255)
      doc.setFontSize(8)
      doc.text('- FERREXPERT SPA    CONTACTO@FERREXPERT.CL    +569 53214349', 12, currentY + 5)

      const nombreArchivo = customCotizacionNumber ? 
        `cotizacion-N${customCotizacionNumber}.pdf` : 
        `cotizacion-${cotizacionNumber}.pdf`
      
      doc.save(nombreArchivo)
      
    } catch (error) {
      console.error('Error al generar PDF:', error)
      alert('Error al generar el PDF con imágenes. Se generará sin imágenes.')
      generatePDFWithoutImages()
    } finally {
      setGeneratingPDF(false)
    }
  }

  // Función de respaldo sin imágenes
  const generatePDFWithoutImages = () => {
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
    
    const numeroFinal = customCotizacionNumber ? `N°${customCotizacionNumber}` : `N°${cotizacionNumber}`
    doc.text(numeroFinal, 155, 30)

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
    doc.text(`PLAZO: ${plazoEntrega} DÍAS HÁBILES`, 160, 78)
    doc.text('CRÉDITO 30 DÍAS', 160, 84)

    // TABLA DE PRODUCTOS SIN IMÁGENES
    autoTable(doc, {
      startY: 90,
      head: [['ITEM', 'DESCRIPCIÓN', 'UND', 'CANT', 'UNITARIO', 'TOTAL SIN IVA']],
      body: productos.map((prod, i) => [
        i + 1,
        prod.descripcion,
        prod.und,
        prod.cantidadCotizada,
        `$${Math.round(prod.precioVenta || prod.unitario).toLocaleString()}`,
        `$${Math.round((prod.precioVenta || prod.unitario) * prod.cantidadCotizada).toLocaleString()}`
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [100, 100, 100], textColor: 255 },
    })

    const subtotal = productos.reduce((sum, p) => sum + ((p.precioVenta || p.unitario) * p.cantidadCotizada), 0)
    const iva = subtotal * (IVA_PORCENTAJE / 100)
    const total = subtotal + iva

    const finalY = doc.lastAutoTable.finalY + 10

    // Footer similar al con imágenes
    doc.setFillColor(240, 240, 240)
    doc.rect(140, finalY, 60, 30, 'F')
    doc.rect(140, finalY, 60, 30)

    doc.setFontSize(8)
    doc.text('NETO', 142, finalY + 6)
    doc.text('FLETE', 142, finalY + 12)
    doc.text('SUB TOTAL', 142, finalY + 18)
    doc.text(`IVA (${IVA_PORCENTAJE}%)`, 142, finalY + 24)

    doc.text('$', 165, finalY + 6)
    doc.text('$', 165, finalY + 12)
    doc.text('$', 165, finalY + 18)
    doc.text('$', 165, finalY + 24)

    doc.text(`${Math.round(subtotal).toLocaleString()}`, 170, finalY + 6)
    doc.text('-', 170, finalY + 12)
    doc.text(`${Math.round(subtotal).toLocaleString()}`, 170, finalY + 18)
    doc.text(`${Math.round(iva).toLocaleString()}`, 170, finalY + 24)

    doc.setFillColor(0)
    doc.rect(140, finalY + 30, 60, 8, 'F')
    doc.setTextColor(255)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('TOTAL', 142, finalY + 36)
    doc.text('$', 165, finalY + 36)
    doc.text(`${Math.round(total).toLocaleString()}`, 170, finalY + 36)

    const nombreArchivo = customCotizacionNumber ? 
      `cotizacion-N${customCotizacionNumber}.pdf` : 
      `cotizacion-${cotizacionNumber}.pdf`
    
    doc.save(nombreArchivo)
  }

  // Función para limpiar datos guardados
  const clearStoredData = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos guardados?')) {
      localStorage.removeItem('cotizacion-clientes')
      localStorage.removeItem('cotizacion-productos')
      localStorage.removeItem('cotizacion-counter')
      setClientesData([])
      setProductosData([])
      setSelectedCliente(null)
      setProductos([])
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

        {/* Nueva sección: Configuración de Cotización */}
        <div className="mb-6 bg-gray-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Configuración de Cotización</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-100">Número de Cotización Personalizado</label>
              <input
                type="text"
                value={customCotizacionNumber}
                onChange={(e) => setCustomCotizacionNumber(e.target.value)}
                placeholder={`Automático: ${cotizacionNumber}`}
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md placeholder-gray-400"
              />
              <div className="text-xs text-gray-400 mt-1">
                Formato final: N°{customCotizacionNumber || cotizacionNumber}
              </div>
            </div>
            <div>
              <label className="block mb-2 text-gray-100">Plazo de Entrega (días hábiles)</label>
              <select
                value={plazoEntrega}
                onChange={(e) => setPlazoEntrega(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-600 text-gray-100 rounded-md"
              >
                {[...Array(15)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} día{i === 0 ? '' : 's'} hábil{i === 0 ? '' : 'es'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sección de importación de datos */}
        <div className="mb-6 bg-gray-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Gestión de Datos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <button
                onClick={importClientes}
                className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 mb-2"
              >
                📋 Importar/Actualizar Clientes
              </button>
              <div className="text-sm text-gray-300">
                Clientes cargados: <span className="font-bold text-green-400">{clientesData.length}</span>
              </div>
              <div className="text-xs text-gray-400">
                Formato: RUT, Entidad, Comuna, Dirección
              </div>
            </div>
            <div>
              <button
                onClick={importProductos}
                className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 mb-2"
              >
                📦 Importar/Actualizar Productos
              </button>
              <div className="text-sm text-gray-300">
                Productos cargados: <span className="font-bold text-green-400">{productosData.length}</span>
              </div>
              <div className="text-xs text-gray-400">
                Formato: ID, Descripción, Marca, UND, etc.
              </div>
            </div>
            <div>
              <button
                onClick={clearStoredData}
                className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 mb-2"
              >
                🗑️ Limpiar Datos Guardados
              </button>
              <div className="text-sm text-gray-400">
                Elimina datos del navegador
              </div>
            </div>
          </div>
        </div>

        {/* Sección de configuración de ganancia */}
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

        {/* Selección de productos */}
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
                          value={producto.cantidadCotizada || 0}
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
                        ${Math.round((producto.precioVenta || producto.unitario) * (producto.cantidadCotizada || 0)).toLocaleString()}
                      </td>
                      <td className="border border-gray-500 px-1 py-2 font-bold text-xs text-blue-400">
                        ${Math.round((producto.precioVentaConIVA || calcularPrecioConIVA(producto.unitario)) * (producto.cantidadCotizada || 0)).toLocaleString()}
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
              
              {/* Total general y resumen de ganancia */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-right">
                <div className="bg-gray-600 p-3 rounded">
                  <div className="text-sm text-gray-300">Costo Total (sin ganancia)</div>
                  <div className="text-lg font-bold text-red-400">
                    ${productos.reduce((sum, p) => sum + (p.unitario * (p.cantidadCotizada || 0)), 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-600 p-3 rounded">
                  <div className="text-sm text-gray-300">Subtotal (con ganancia)</div>
                  <div className="text-lg font-bold text-green-400">
                    ${productos.reduce((sum, p) => sum + ((p.precioVenta || p.unitario) * (p.cantidadCotizada || 0)), 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-600 p-3 rounded">
                  <div className="text-sm text-gray-300">IVA ({IVA_PORCENTAJE}%)</div>
                  <div className="text-lg font-bold text-yellow-400">
                    ${Math.round(productos.reduce((sum, p) => sum + ((p.precioVenta || p.unitario) * (p.cantidadCotizada || 0)), 0) * (IVA_PORCENTAJE / 100)).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-600 p-3 rounded">
                  <div className="text-sm text-gray-300">Total Final (con IVA)</div>
                  <div className="text-xl font-bold text-blue-400">
                    ${Math.round(productos.reduce((sum, p) => sum + ((p.precioVentaConIVA || calcularPrecioConIVA(p.unitario)) * (p.cantidadCotizada || 0)), 0)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón para exportar PDF */}
        <button
          onClick={exportToPDF}
          disabled={!selectedCliente || productos.length === 0 || generatingPDF}
          className="w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-lg font-bold"
        >
          {generatingPDF ? 'Generando PDF... Por favor espere' :
           !selectedCliente ? 'Selecciona un cliente primero' : 
           productos.length === 0 ? 'Agrega productos primero' : 
           `Generar Cotización PDF - N°${customCotizacionNumber || cotizacionNumber}`}
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