import { useState, useEffect } from 'react'
import InvoiceForm from './Components/InvoiceForm'
import InvoiceList from './Components/InvoiceList'
import InvoiceDetail from './Components/InvoiceDetail'
import './App.css'

const API_URL = 'http://localhost:3001/invoices';

function App() {
  const [invoices, setInvoices] = useState([]);
  const [currentView, setCurrentView] = useState('form');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Cargar facturas desde db.json al iniciar (GET)
  useEffect(() => {
    fetch(API_URL)
      .then(response => response.json())
      .then(data => {
        setInvoices(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error cargando facturas:", error);
        setLoading(false);
      });
  }, []);

  // 2. Guardar (POST) o Actualizar (PUT) Factura
  const handleSaveInvoice = async (invoiceData) => {
    try {
      if (editingInvoice) {
        // MODO EDICIÓN (PUT)
        const response = await fetch(`${API_URL}/${editingInvoice.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...invoiceData,
            id: editingInvoice.id,
            updatedAt: new Date().toISOString()
          }),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar la factura en la base de datos');
        }

        const updatedInvoice = await response.json();
        setInvoices(invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
        setEditingInvoice(null);
        setCurrentView('list');
      } else {
        // MODO CREACIÓN (POST)
        const invoiceToSave = {
          ...invoiceData,
          createdAt: new Date().toISOString()
        };

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceToSave),
        });

        if (!response.ok) {
          throw new Error('Error al guardar la factura en la base de datos');
        }

        const savedInvoice = await response.json();
        setInvoices([...invoices, savedInvoice]);
        setCurrentView('list');
      }
    } catch (error) {
      console.error('Error al guardar factura:', error);
      alert('Hubo un error al procesar la factura.');
    }
  };

  // 3. Eliminar factura de db.json (DELETE)
  const handleDeleteInvoice = async (invoiceId) => {
    const confirmDelete = window.confirm("¿Está seguro de que desea eliminar esta factura?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la factura');
      }

      setInvoices(invoices.filter(inv => inv.id !== invoiceId));
      
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice(null);
        setCurrentView('list');
      }
      if (editingInvoice && editingInvoice.id === invoiceId) {
        setEditingInvoice(null);
        setCurrentView('list');
      }
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      alert('Hubo un error al eliminar la factura de la base de datos');
    }
  };

  // Iniciar flujo de edición
  const handleStartEdit = (invoice) => {
    setEditingInvoice(invoice);
    setSelectedInvoice(null);
    setCurrentView('form');
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingInvoice(null);
    setCurrentView('list');
  };

  const handleSelectInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setCurrentView('detail');
  };

  const handleGoToNewForm = () => {
    setEditingInvoice(null);
    setSelectedInvoice(null);
    setCurrentView('form');
  };

  const handleBackToList = () => {
    setEditingInvoice(null);
    setSelectedInvoice(null);
    setCurrentView('list');
  };

  // Calculos generales de métricas dinámicas
  const totalFacturado = invoices.reduce((sum, inv) => {
    const invSubtotal = (inv.items || []).reduce((s, i) => s + (Number(i.quantity) * Number(i.price) || 0), 0);
    const taxRate = Number(inv.taxRate ?? 0.13);
    const invTotal = invSubtotal * (1 + taxRate);
    return sum + invTotal;
  }, 0);

  const totalItemsCount = invoices.reduce((sum, inv) => sum + (inv.items?.length || 0), 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: '#64748b', fontWeight: '500' }}>Cargando base de datos...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="brand-section">
          <div className="brand-info">
            <h1>Sistema de Facturación</h1>
            <p>Control y Emisión de Comprobantes Electrónicos</p>
          </div>
        </div>

        <div className="nav-actions">
          <button 
            onClick={handleGoToNewForm}
            className={`nav-tab ${currentView === 'form' && !editingInvoice ? 'active' : ''}`}
          >
            Nueva Factura
          </button>
          <button 
            onClick={handleBackToList}
            className={`nav-tab ${currentView === 'list' || currentView === 'detail' ? 'active' : ''}`}
          >
            Facturas <span className="badge-count">{invoices.length}</span>
          </button>
        </div>
      </nav>

      {/* Stats Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-data">
            <h4>Total Emitidas</h4>
            <div className="stat-value">{invoices.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-data">
            <h4>Monto Total (c/IVA)</h4>
            <div className="stat-value">₡{totalFacturado.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-data">
            <h4>Productos Facturados</h4>
            <div className="stat-value">{totalItemsCount}</div>
          </div>
        </div>
      </section>

      {/* Main Content View Switcher */}
      <main>
        {currentView === 'form' && (
          <InvoiceForm 
            onSaveInvoice={handleSaveInvoice}
            invoiceToEdit={editingInvoice}
            onCancelEdit={handleCancelEdit}
          />
        )}

        {currentView === 'list' && (
          <InvoiceList 
            invoices={invoices} 
            onSelectInvoice={handleSelectInvoice} 
            onNewInvoice={handleGoToNewForm}
            onEditInvoice={handleStartEdit}
            onDeleteInvoice={handleDeleteInvoice}
          />
        )}

        {currentView === 'detail' && selectedInvoice && (
          <InvoiceDetail 
            invoice={selectedInvoice} 
            onBack={handleBackToList} 
            onEditInvoice={handleStartEdit}
            onDeleteInvoice={handleDeleteInvoice}
          />
        )}
      </main>
    </div>
  )
}

export default App