import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import api from '@/lib/api';

/**
 * Export data to Excel
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column definitions { key, label }
 * @param {String} filename - Name of the file (without extension)
 */
export const exportToExcel = (data, columns, filename = 'export') => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Prepare data for Excel
  const excelData = [
    // Header row
    columns.map(col => col.label)
  ];

  // Data rows
  data.forEach(item => {
    const row = columns.map(col => {
      const value = col.key.split('.').reduce((obj, key) => obj?.[key], item);
      // Format dates
      if (value instanceof Date) {
        return format(value, 'yyyy-MM-dd HH:mm:ss');
      }
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      // Handle objects/arrays
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return value;
    });
    excelData.push(row);
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelData);

  // Set column widths
  const colWidths = columns.map(() => ({ wch: 20 }));
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // Save file
  const fileName = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Export data to PDF
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column definitions { key, label }
 * @param {String} title - Title for the PDF
 * @param {String} filename - Name of the file (without extension)
 */
export const exportToPDF = async (data, columns, title = 'Export', filename = 'export') => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Dynamically import jspdf-autotable to ensure it's loaded
  // This extends the jsPDF prototype with autoTable method
  await import('jspdf-autotable');
  
  const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation for tables

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 22);

  // Prepare table data
  const tableData = data.map(item => {
    return columns.map(col => {
      const value = col.key.split('.').reduce((obj, key) => obj?.[key], item);
      // Format dates
      if (value instanceof Date) {
        return format(value, 'yyyy-MM-dd HH:mm');
      }
      // Handle null/undefined
      if (value === null || value === undefined) {
        return 'N/A';
      }
      // Handle objects/arrays
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      // Truncate long strings
      if (typeof value === 'string' && value.length > 50) {
        return value.substring(0, 47) + '...';
      }
      return value;
    });
  });

  const tableHeaders = columns.map(col => col.label);

  // Add table - autoTable should be available after importing jspdf-autotable
  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
      startY: 30,
      head: [tableHeaders],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [98, 39, 95], // Brand primary color
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      margin: { top: 30, left: 14, right: 14 },
      columnStyles: columns.map(() => ({ cellWidth: 'auto' })),
    });
  } else {
    throw new Error('jspdf-autotable plugin not loaded. autoTable method is not available on jsPDF instance.');
  }

  // Save PDF
  const fileName = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};

/**
 * Fetch all data for export (with export=true parameter)
 * @param {String} endpoint - API endpoint
 * @param {Object} filters - Current filters to apply
 * @returns {Promise<Array>} - Array of data items
 */
export const fetchAllDataForExport = async (endpoint, filters = {}) => {
  const queryParams = new URLSearchParams();
  
  // Add all filters
  Object.keys(filters).forEach(key => {
    if (filters[key] && filters[key] !== 'all' && filters[key] !== null && filters[key] !== undefined) {
      queryParams.append(key, filters[key]);
    }
  });
  
  // Add export flag
  queryParams.append('export', 'true');
  
  const queryString = queryParams.toString();
  const url = `${endpoint}${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    const data = response.data;
    
    // Handle different response structures
    if (data.data) {
      return Array.isArray(data.data) ? data.data : data.data.items || data.data.orders || data.data.users || data.data.riders || data.data.bikes || [];
    }
    
    if (data.orders) return data.orders;
    if (data.users) return data.users;
    if (data.riders) return data.riders;
    if (data.bikes) return data.bikes;
    if (data.items) return data.items;
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Export fetch error:', error);
    throw new Error('Failed to fetch data for export');
  }
};
