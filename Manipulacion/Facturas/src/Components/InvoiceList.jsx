import React from 'react';

const InvoiceList = ({ 
  invoices, 
  onSelectInvoice, 
  onNewInvoice, 
  onEditInvoice, 
  onDeleteInvoice,
  searchQuery,
  onSearch 
}) => {
  return (
    <div className="list-container">
      {/* Top Bar with Title and Actions */}
      <div className="list-top-bar">
        <div>
          <h2>Facturas Registradas</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Listado completo de comprobantes emitidos y gestionados mediante el servicio
          </p>
        </div>
        <button onClick={onNewInvoice} className="btn-primary">
          Nueva Factura
        </button>
      </div>

      {/* Real-Time Search Bar Component */}
      <div className="search-bar-container" style={{
        background: 'var(--surface-card)',
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Buscar por número de factura (ej. 4185, FAC-4185)..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '0.9rem',
              color: 'var(--secondary-900)',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => onSearch('')}
            className="btn-secondary"
            style={{ padding: '9px 14px', fontSize: '0.85rem' }}
          >
            Limpiar Búsqueda
          </button>
        )}
      </div>

      {/* Empty State */}
      {invoices.length === 0 ? (
        <div className="empty-state">
          <h3>
            {searchQuery 
              ? `No se encontraron resultados para "${searchQuery}"` 
              : 'No hay facturas registradas todavía'}
          </h3>
          <p>
            {searchQuery 
              ? 'Intenta con otro nombre de cliente o número de comprobante.'
              : 'Crea tu primera factura para verla reflejada aquí y guardarla en la base de datos.'}
          </p>
          {searchQuery ? (
            <button onClick={() => onSearch('')} className="btn-secondary">
              Ver todas las facturas
            </button>
          ) : (
            <button onClick={onNewInvoice} className="btn-primary">
              Crear Primera Factura
            </button>
          )}
        </div>
      ) : (
        /* Invoice Cards Grid */
        <div className="invoice-grid">
          {invoices.map((inv) => {
            // Cálculo dinámico del subtotal y total con IVA según la tasa guardada
            const subtotal = (inv.items || []).reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price) || 0), 0);
            const taxRate = inv.taxRate !== undefined ? Number(inv.taxRate) : 0.13;
            const total = subtotal * (1 + taxRate);
            const itemCount = inv.items?.length || 0;
            
            return (
              <div key={inv.id || inv.invoiceNumber} className="invoice-card">
                <div>
                  <div className="card-top">
                    <span className="invoice-badge">
                      {inv.invoiceNumber}
                    </span>
                    <span className="invoice-date">
                      {inv.date}
                    </span>
                  </div>

                  <div className="card-client">
                    <div className="client-name">{inv.clientName}</div>
                    <div className="client-addr">{inv.clientAddress || 'Sin dirección'}</div>
                  </div>
                </div>

                <div>
                  <div className="card-bottom">
                    <div>
                      <div className="total-label">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IVA: {(taxRate * 100).toFixed(0)}%</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="total-label">Total c/IVA</div>
                      <div className="total-amount">₡{total.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  {/* Acciones: Ver, Editar, Eliminar */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', marginTop: '6px' }}>
                    <button 
                      onClick={() => onSelectInvoice(inv)} 
                      className="btn-secondary"
                      style={{ justifyContent: 'center' }}
                    >
                      Ver Detalle
                    </button>
                    <button 
                      onClick={() => onEditInvoice(inv)} 
                      className="btn-secondary"
                      style={{ padding: '8px 12px' }}
                      title="Editar factura"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => onDeleteInvoice(inv.id)} 
                      className="btn-danger"
                      title="Eliminar factura"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvoiceList;