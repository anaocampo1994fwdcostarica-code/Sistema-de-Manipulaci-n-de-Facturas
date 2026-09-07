import React from 'react';

const InvoiceDetail = ({ invoice, onBack, onEditInvoice, onDeleteInvoice }) => {
  // Cálculos derivados dinámicos con la tasa de impuesto guardada
  const items = invoice.items || [];
  const subtotal = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);
  const taxRate = invoice.taxRate !== undefined ? Number(invoice.taxRate) : 0.13;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const handlePrint = () => {
    window.print();
  };

  // Generación de URL para código QR de verificación fiscal
  const qrData = encodeURIComponent(`FACTURA-CR:${invoice.invoiceNumber}|EMISOR:${invoice.issuerId}|TOTAL:CRC${total.toFixed(2)}|FECHA:${invoice.date}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrData}&margin=4`;

  return (
    <div className="detail-view">
      {/* Action buttons */}
      <div className="detail-actions">
        <button onClick={onBack} className="btn-secondary">
          Volver al Listado
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => onEditInvoice(invoice)} 
            className="btn-secondary"
            style={{ padding: '10px 18px' }}
          >
            Editar Factura
          </button>
          <button 
            onClick={() => onDeleteInvoice(invoice.id)} 
            className="btn-danger"
            style={{ padding: '10px 18px' }}
          >
            Eliminar Factura
          </button>
          <button onClick={handlePrint} className="btn-primary">
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>
      
      {/* Diseño elegante de Factura */}
      <div className="invoice-paper">
        <header className="paper-header">
          <div className="paper-title">
            <h1>FACTURA ELECTRÓNICA</h1>
            <div className="paper-invoice-meta">
              <p><strong>N° Comprobante:</strong> {invoice.invoiceNumber}</p>
              <p><strong>Fecha de Emisión:</strong> {invoice.date}</p>
              {invoice.createdAt && (
                <p style={{ fontSize: '0.75rem' }}><strong>Registrado:</strong> {new Date(invoice.createdAt).toLocaleString()}</p>
              )}
              {invoice.updatedAt && (
                <p style={{ fontSize: '0.75rem', color: '#6366f1' }}><strong>Última actualización:</strong> {new Date(invoice.updatedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
          <div className="paper-issuer">
            <h3>{invoice.issuerName}</h3>
            <p>ID Fiscal: {invoice.issuerId}</p>
            <p>San José, Costa Rica</p>
          </div>
        </header>

        {/* Datos del Cliente */}
        <section className="paper-client-card">
          <h4>Facturado a:</h4>
          <div className="name">{invoice.clientName}</div>
          <div className="address">{invoice.clientAddress || 'Sin dirección especificada'}</div>
        </section>

        {/* Tabla de Productos */}
        <table className="paper-table">
          <thead>
            <tr>
              <th style={{ width: '45%' }}>Descripción</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Cant.</th>
              <th style={{ width: '20%', textAlign: 'right' }}>Precio Unit. (₡)</th>
              <th style={{ width: '20%' }} className="text-right">Total (₡)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const itemTotal = (Number(item.quantity) || 0) * (Number(item.price) || 0);
              return (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₡{Number(item.price).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-right"><strong>₡{itemTotal.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totales, QR y Notas */}
        <footer className="paper-footer-section">
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Código QR Fiscal */}
            <div style={{ 
              background: '#ffffff', 
              padding: '8px', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center'
            }}>
              <img 
                src={qrUrl} 
                alt="Código QR de Verificación Fiscal" 
                width="100" 
                height="100" 
                style={{ display: 'block', margin: '0 auto' }} 
              />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px', fontWeight: '600' }}>
                Verificación Fiscal
              </span>
            </div>

            <div className="paper-notes">
              <h5>Condiciones y Notas</h5>
              <p>Gracias por su preferencia. Esta factura electrónica tiene validez fiscal. Tasa de impuesto aplicada conforme a la normativa vigente.</p>
            </div>
          </div>

          <div className="paper-totals-box">
            <div className="totals-row">
              <span>Subtotal:</span>
              <span>₡{subtotal.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="totals-row">
              <span>IVA ({(taxRate * 100).toFixed(0)}%):</span>
              <span>₡{taxAmount.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="totals-row grand-total">
              <span>Total a Pagar:</span>
              <span className="amount">₡{total.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default InvoiceDetail;