import api from './api';

class ApartmentService {
  // Create new apartment
  static async createApartment(apartmentData) {
    return api.post('/apartments', apartmentData);
  }
  
  // Get all apartments for owner
  static async getApartments() {
    return api.get('/apartments');
  }
  
  // Get apartment by ID
  static async getApartmentById(id) {
    return api.get(`/apartments/${id}`);
  }
  
  // Update apartment
  static async updateApartment(id, updateData) {
    return api.put(`/apartments/${id}`, updateData);
  }
  
  // Delete apartment
  static async deleteApartment(id) {
    return api.delete(`/apartments/${id}`);
  }
  
  // Get apartment statistics
  static async getApartmentStats(id) {
    return api.get(`/apartments/${id}/stats`);
  }
  
  // Get unit details
  static async getUnitDetails(id) {
    return api.get(`/units/${id}`);
  }
  
  // Assign tenant to unit
  static async assignTenant(unitId, tenantData) {
    return api.post(`/units/${unitId}/tenant`, tenantData);
  }
  
  // Move out tenant
  static async moveOutTenant(unitId, moveOutDate) {
    return api.post(`/units/${unitId}/move-out`, { move_out_date: moveOutDate });
  }
  
  // Update unit rent
  static async updateUnitRent(unitId, monthlyRent) {
    return api.put(`/units/${unitId}/rent`, { monthly_rent: monthlyRent });
  }
  
  // Make payment
  static async makePayment(rentLogId, paymentData) {
    return api.post(`/units/rent-logs/${rentLogId}/pay`, paymentData);
  }
  
  // Get payment history
  static async getPaymentHistory(unitId, filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    return api.get(`/units/${unitId}/payments?${params}`);
  }
}

export default ApartmentService;