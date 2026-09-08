import { useState, useEffect, useCallback } from 'react'
import InvoiceForm from './Components/InvoiceForm'
import InvoiceList from './Components/InvoiceList'
import InvoiceDetail from './Components/InvoiceDetail'
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  searchInvoiceByNumber
} from './services/invoiceService'
import './App.css'


function App() {
  const [invoices, setInvoices] = useState([]);
  const [currentView, setCurrentView] = useState('form');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Cargar facturas iniciales mediante el servicio (GET)
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Error cargando facturas desde el servicio:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

// 2. Búsqueda en tiempo real con el servicio (searchInvoiceByNumber)
const handleSearch = async (query) => {
  setSearchQuery(query);
  
// Si el campo está vacío, volvemos a cargar todas las facturas
  if (query.trim() === '') {
    fetchInvoices(); 
    return;
  }

  try {
    const results = await searchInvoiceByNumber(query);
    setInvoices(results);
  } catch (error) {
    console.error("Error al buscar facturas:", error);
  }
};

  // 3. Guardar (POST) o Actualizar (PUT) Factura usando el servicio
  const handleSaveInvoice = async (invoiceData) => {
    try {
      if (editingInvoice) {
        // MODO EDICIÓN (PUT)
        const updatedInvoice = await updateInvoice(editingInvoice.id, invoiceData);
        setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
        setEditingInvoice(null);
        setCurrentView('list');
      } else {
        // MODO CREACIÓN (POST)
        const savedInvoice = await createInvoice(invoiceData);
        setInvoices(prev => [...prev, savedInvoice]);
        setCurrentView('list');
      }
      setSearchQuery('');
    } catch (error) {
      console.error('Error al guardar factura:', error);
      alert('Hubo un error al procesar la factura con el servicio.');
    }
  };

  // 4. Eliminar factura usando el servicio (DELETE)
  const handleDeleteInvoice = async (invoiceId) => {
    const confirmDelete = window.confirm("¿Está seguro de que desea eliminar esta factura?");
    if (!confirmDelete) return;

    try {
      await deleteInvoice(invoiceId);
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      
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
      alert('Hubo un error al eliminar la factura mediante el servicio');
    }
  };

  // 5. Ver detalle (consultando con getInvoiceById para consistencia de datos)
  const handleSelectInvoice = async (invoice) => {
    try {
      if (invoice.id) {
        const freshInvoice = await getInvoiceById(invoice.id);
        setSelectedInvoice(freshInvoice);
      } else {
        setSelectedInvoice(invoice);
      }
      setCurrentView('detail');
    } catch (error) {
      console.warn("No se pudo obtener el detalle fresco, usando local:", error);
      setSelectedInvoice(invoice);
      setCurrentView('detail');
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

  const handleGoToNewForm = () => {
    setEditingInvoice(null);
    setSelectedInvoice(null);
    setCurrentView('form');
  };

  const handleBackToList = () => {
    setEditingInvoice(null);
    setSelectedInvoice(null);
    setCurrentView('list');
    fetchInvoices();
  };

  // Calculos generales de métricas dinámicas
  const totalFacturado = invoices.reduce((sum, inv) => {
    const invSubtotal = (inv.items || []).reduce((s, i) => s + (Number(i.quantity) * Number(i.price) || 0), 0);
    const taxRate = Number(inv.taxRate ?? 0.13);
    const invTotal = invSubtotal * (1 + taxRate);
    return sum + invTotal;
  }, 0);

  const totalItemsCount = invoices.reduce((sum, inv) => sum + (inv.items?.length || 0), 0);

  if (loading && invoices.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: '#64748b', fontWeight: '500' }}>Cargando facturas desde el servicio...</p>
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
            <p>Control y Emisión de Comprobantes Electrónicos (Clean Architecture)</p>
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
            <h4>Total Facturas</h4>
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
            searchQuery={searchQuery}
            onSearch={handleSearch}
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