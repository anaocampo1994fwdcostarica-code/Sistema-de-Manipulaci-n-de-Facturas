import React, { useState, useEffect } from 'react';

// Generador de estado inicial por defecto
const getInitialState = () => ({
  formData: {
    issuerName: 'TechStore S.A.',
    issuerId: '101010101',
    clientName: '',
    clientAddress: '',
    invoiceNumber: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    taxRate: 0.13 // 13% IVA General por defecto
  },
  items: [
    { id: Date.now(), description: '', quantity: 1, price: 0 }
  ]
});

const InvoiceForm = ({ onSaveInvoice, invoiceToEdit, onCancelEdit }) => {
  const [formData, setFormData] = useState(getInitialState().formData);
  const [items, setItems] = useState(getInitialState().items);

  // useEffect para detectar modo Edición vs Modo Creación y poblar/reiniciar el estado
  useEffect(() => {
    if (invoiceToEdit) {
      // Modo Edición: Cargar datos existentes
      setFormData({
        issuerName: invoiceToEdit.issuerName || '',
        issuerId: invoiceToEdit.issuerId || '',
        clientName: invoiceToEdit.clientName || '',
        clientAddress: invoiceToEdit.clientAddress || '',
        invoiceNumber: invoiceToEdit.invoiceNumber || '',
        date: invoiceToEdit.date || new Date().toISOString().split('T')[0],
        taxRate: invoiceToEdit.taxRate !== undefined ? Number(invoiceToEdit.taxRate) : 0.13
      });

      // Asegurar que items sea un arreglo válido con IDs
      if (invoiceToEdit.items && invoiceToEdit.items.length > 0) {
        setItems(invoiceToEdit.items.map((item, idx) => ({
          id: item.id || Date.now() + idx,
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0
        })));
      } else {
        setItems([{ id: Date.now(), description: '', quantity: 1, price: 0 }]);
      }
    } else {
      // Modo Creación: Reiniciar formulario a valores limpios por defecto
      const initial = getInitialState();
      setFormData(initial.formData);
      setItems(initial.items);
    }
  }, [invoiceToEdit]);

  // Manejar cambios en campos simples
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'taxRate' ? Number(value) : value
    }));
  };

  // Manejar cambios en los ítems
  const handleItemChange = (id, field, value) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          [field]: field === 'description' ? value : Number(value)
        };
      }
      return item;
    }));
  };

  // Agregar nueva fila de ítem
  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  };

  // Eliminar fila de ítem
  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Cálculos dinámicos en vivo
  const subtotal = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);
  const currentTaxRate = Number(formData.taxRate) || 0;
  const iva = subtotal * currentTaxRate;
  const total = subtotal + iva;

  // Validar y Guardar (POST o PUT)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.clientName.trim() || !formData.invoiceNumber.trim() || !formData.date) {
      alert('Por favor complete los datos obligatorios del cliente, número de comprobante y fecha.');
      return;
    }
    
    const validItems = items.filter(i => i.description.trim() && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      alert('Agregue al menos un producto con descripción y cantidad válida.');
      return;
    }

    // Enviar datos al padre
    onSaveInvoice({ 
      ...formData, 
      taxRate: currentTaxRate,
      items: validItems 
    });

    // Limpieza / Reset del formulario tras guardar
    const cleanState = getInitialState();
    setFormData(cleanState.formData);
    setItems(cleanState.items);
  };

  const isEditing = Boolean(invoiceToEdit);

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{isEditing ? 'Editar Factura Existente' : 'Crear Nueva Factura'}</h2>
        <p>
          {isEditing 
            ? `Modificando el comprobante ${formData.invoiceNumber}. Los cambios se sincronizarán en la base de datos vía PUT.`
            : 'Complete los datos del emisor, cliente y detalle de productos para generar la factura electrónica.'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Datos Emisor y Cliente */}
        <div className="form-section">
          <div className="form-section-title">Datos de la Empresa Emisora</div>
          <div className="form-row">
            <div className="form-group">
              <label>Empresa Emisora</label>
              <input 
                type="text" 
                name="issuerName" 
                value={formData.issuerName} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>ID Fiscal (RUC / NIT / Cédula Jurídica)</label>
              <input 
                type="text" 
                name="issuerId" 
                value={formData.issuerId} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Datos del Cliente y Comprobante</div>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre del Cliente</label>
              <input 
                type="text" 
                name="clientName" 
                placeholder="Ej: Juan Pérez o Corporación ABC" 
                value={formData.clientName} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Dirección / Contacto</label>
              <input 
                type="text" 
                name="clientAddress" 
                placeholder="Ej: San José, Costa Rica / cliente@email.com" 
                value={formData.clientAddress} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>N° de Factura</label>
              <input 
                type="text" 
                name="invoiceNumber" 
                placeholder="FAC-001" 
                value={formData.invoiceNumber} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Fecha de Emisión</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Tasa de Impuesto (IVA)</label>
              <select 
                name="taxRate" 
                value={formData.taxRate} 
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  color: 'var(--secondary-900)',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value={0.13}>13% - Tarifa General (CR)</option>
                <option value={0.04}>4% - Servicios de Salud / Boletos</option>
                <option value={0.02}>2% - Medicamentos / Educación</option>
                <option value={0.01}>1% - Canasta Básica</option>
                <option value={0.00}>0% - Exento de Impuesto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ítems Dinámicos */}
        <div className="form-section">
          <div className="form-section-title">Detalle de Ítems / Productos</div>
          <div className="items-table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Descripción del Producto/Servicio</th>
                  <th style={{ width: '15%' }}>Cantidad</th>
                  <th style={{ width: '20%' }}>Precio Unitario (₡)</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Subtotal</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Ej: Laptop Pro 16 pulg." 
                        value={item.description} 
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} 
                        required 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.quantity} 
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} 
                        required 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00"
                        value={item.price} 
                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)} 
                        required 
                      />
                    </td>
                    <td className="item-subtotal">
                      ₡{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => removeItem(item.id)} 
                        className="btn-danger"
                        title="Eliminar fila"
                        disabled={items.length === 1}
                        style={{ opacity: items.length === 1 ? 0.4 : 1, cursor: items.length === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <button type="button" onClick={addItem} className="btn-secondary">
              Agregar Producto
            </button>

            {/* Resumen dinámico en vivo */}
            <div style={{ textAlign: 'right', background: 'var(--secondary-50)', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Subtotal: <strong>₡{subtotal.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> | IVA ({(currentTaxRate * 100).toFixed(0)}%): <strong>₡{iva.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-600)', marginTop: '2px' }}>
                Total Estimado: ₡{total.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          {isEditing && (
            <button 
              type="button" 
              onClick={onCancelEdit} 
              className="btn-secondary"
            >
              Cancelar Edición
            </button>
          )}
          <button type="submit" className="btn-primary" style={{ minWidth: '220px' }}>
            {isEditing ? 'Actualizar Factura' : 'Guardar y Emitir Factura'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;