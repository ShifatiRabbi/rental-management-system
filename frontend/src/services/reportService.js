import api from './api';

class ReportService {
  // Get monthly report
  static async getMonthlyReport(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    return api.get(`/reports/monthly?${params}`);
  }
  
  // Get occupancy report
  static async getOccupancyReport(months = 6) {
    return api.get(`/reports/occupancy?months=${months}`);
  }
  
  // Get overdue report
  static async getOverdueReport() {
    return api.get('/reports/overdue');
  }
  
  // Export data
  static async exportData(type, filters = {}) {
    const params = new URLSearchParams({ type, ...filters });
    return api.get(`/reports/export?${params}`, {
      responseType: 'blob'
    });
  }
  
  // Download blob file
  static downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export default ReportService;