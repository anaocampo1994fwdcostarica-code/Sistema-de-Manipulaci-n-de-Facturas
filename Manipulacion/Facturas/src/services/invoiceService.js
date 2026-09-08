/**
 * @file invoiceService.js
 * @description Servicio modular para interactuar con la API REST de Facturación (json-server).
 * Implementa separación de responsabilidades (Clean Architecture).
 */

const BASE_URL = 'http://localhost:3001/invoices';

/**
 * Obtiene todas las facturas registradas.
 * @returns {Promise<Array>} Lista de facturas.
 */
export const getAllInvoices = async () => {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} al obtener facturas`);
    }
    return await response.json();
  } catch (error) {
    console.error('[invoiceService.getAllInvoices] Error:', error);
    throw error;
  }
};

/**
 * Consulta una factura específica por su ID interno (el campo "id" de json-server,
 * ej. "-6fPPYNJWxw"). Útil para operaciones de edición/eliminación desde la UI,
 * donde ya se tiene el ID exacto del registro seleccionado.
 * @param {string|number} id ID interno de la factura.
 * @returns {Promise<Object>} Datos de la factura.
 */
export const getInvoiceById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`);
    console.log(response.status, response.ok);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} al consultar factura con ID ${id}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`[invoiceService.getInvoiceById] Error (ID: ${id}):`, error);
    throw error;
  }
};

/**
 * Consulta una factura por su NÚMERO exacto (campo "invoiceNumber",
 * ej. "FAC-4185"). Realiza la solicitud directa al endpoint con filtro.
 * @param {string} invoiceNumber Número exacto de la factura.
 * @returns {Promise<Object|null>} La factura encontrada, o null si no existe.
 */
export const getInvoiceByNumber = async (invoiceNumber) => {
  try {
    const trimmed = String(invoiceNumber).trim();
    const formatted = trimmed.toUpperCase().startsWith('FAC-') 
      ? trimmed.toUpperCase() 
      : `FAC-${trimmed}`;

    const response = await fetch(`${BASE_URL}?invoiceNumber=${encodeURIComponent(formatted)}`);
    console.log(response.status, response.ok);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} al consultar factura ${invoiceNumber}`);
    }
    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`[invoiceService.getInvoiceByNumber] Error (Numero: ${invoiceNumber}):`, error);
    throw error;
  }
};

/**
 * Consulta directa de la factura al endpoint por su número de factura.
 * Soporta ingresar "4185", "fac-4185" o "FAC-4185".
 * @param {string} query Número de factura a consultar.
 * @returns {Promise<Array>} Lista que contiene únicamente la factura consultada.
 */
export const searchInvoiceByNumber = async (query) => {
  try {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return await getAllInvoices();
    }

    // Normalizar si el usuario escribe solo los números (ej. "4185" -> "FAC-4185")
    const formattedQuery = trimmedQuery.toUpperCase().startsWith('FAC-')
      ? trimmedQuery.toUpperCase()
      : `FAC-${trimmedQuery}`;

    let response = await fetch(`${BASE_URL}?invoiceNumber=${encodeURIComponent(formattedQuery)}`);
    console.log(response.status, response.ok);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} al consultar factura ${query}`);
    }
    
    let data = await response.json();

    // Si no encontró con el formato FAC-, intenta con el valor original
    if (data.length === 0 && formattedQuery !== trimmedQuery) {
      response = await fetch(`${BASE_URL}?invoiceNumber=${encodeURIComponent(trimmedQuery)}`);
      if (response.ok) {
        data = await response.json();
      }
    }

    return data;
  } catch (error) {
    console.error(`[invoiceService.searchInvoiceByNumber] Error (Query: "${query}"):`, error);
    throw error;
  }
};

/**
 * Busca facturas por parámetro de búsqueda al endpoint.
 * @param {string} query Término de búsqueda.
 * @returns {Promise<Array>} Lista de facturas filtradas.
 */
export const searchInvoices = async (query) => {
  try {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return await getAllInvoices();
    }

    const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(trimmedQuery)}`);
    console.log(response.status, response.ok);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} al buscar facturas con término "${query}"`);
    }
    return await response.json();
  } catch (error) {
    console.error(`[invoiceService.searchInvoices] Error (Query: "${query}"):`, error);
    throw error;
  }
};

/**
 * Crea una nueva factura (POST).
 * @param {Object} invoiceData Datos de la factura a crear.
 * @returns {Promise<Object>} Factura creada con ID asignado.
 */
export const createInvoice = async (invoiceData) => {
  try {
    const payload = {
      ...invoiceData,
      createdAt: new Date().toISOString()
    };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} al crear factura`);
    }

    return await response.json();
  } catch (error) {
    console.error('[invoiceService.createInvoice] Error:', error);
    throw error;
  }
};

/**
 * Actualiza una factura existente (PUT).
 * @param {string|number} id ID de la factura a actualizar.
 * @param {Object} invoiceData Nuevos datos de la factura.
 * @returns {Promise<Object>} Factura actualizada.
 */
export const updateInvoice = async (id, invoiceData) => {
  try {
    const payload = {
      ...invoiceData,
      id,
      updatedAt: new Date().toISOString()
    };

    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} al actualizar factura con ID ${id}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[invoiceService.updateInvoice] Error (ID: ${id}):`, error);
    throw error;
  }
};

/**
 * Elimina una factura por su ID (DELETE).
 * @param {string|number} id ID de la factura a eliminar.
 * @returns {Promise<boolean>} Retorna true si fue eliminada con éxito.
 */
export const deleteInvoice = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} al eliminar factura con ID ${id}`);
    }

    return true;
  } catch (error) {
    console.error(`[invoiceService.deleteInvoice] Error (ID: ${id}):`, error);
    throw error;
  }
};

export default {
  getAllInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  searchInvoiceByNumber,
  searchInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice
};