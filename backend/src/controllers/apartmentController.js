const Apartment = require('../models/Apartment');
const { validationResult } = require('express-validator');

class ApartmentController {
  /**
   * Create new apartment with floors and units
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const apartmentData = {
        owner_id: req.user.id,
        ...req.body
      };
      
      const apartment = await Apartment.create(apartmentData);
      
      res.status(201).json({
        success: true,
        message: 'Apartment created successfully',
        data: { apartment }
      });
      
    } catch (error) {
      console.error('Create apartment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create apartment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Get all apartments for owner
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAll(req, res) {
    try {
      const apartments = await Apartment.findByOwner(req.user.id);
      
      res.json({
        success: true,
        data: { apartments },
        count: apartments.length
      });
      
    } catch (error) {
      console.error('Get apartments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get apartments'
      });
    }
  }
  
  /**
   * Get single apartment with structure
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const apartment = await Apartment.findById(id, req.user.id);
      
      if (!apartment) {
        return res.status(404).json({
          success: false,
          message: 'Apartment not found'
        });
      }
      
      res.json({
        success: true,
        data: { apartment }
      });
      
    } catch (error) {
      console.error('Get apartment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get apartment'
      });
    }
  }
  
  /**
   * Update apartment details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const apartment = await Apartment.update(id, req.user.id, updateData);
      
      if (!apartment) {
        return res.status(404).json({
          success: false,
          message: 'Apartment not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Apartment updated successfully',
        data: { apartment }
      });
      
    } catch (error) {
      console.error('Update apartment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update apartment'
      });
    }
  }
  
  /**
   * Delete apartment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const apartment = await Apartment.delete(id, req.user.id);
      
      if (!apartment) {
        return res.status(404).json({
          success: false,
          message: 'Apartment not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Apartment deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete apartment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete apartment'
      });
    }
  }
  
  /**
   * Get apartment summary statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getStats(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          a.id,
          a.name,
          COUNT(DISTINCT f.id) as total_floors,
          COUNT(DISTINCT u.id) as total_units,
          COUNT(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END) as occupied_units,
          COUNT(DISTINCT CASE WHEN u.status = 'vacant' THEN u.id END) as vacant_units,
          COALESCE(SUM(CASE WHEN u.status = 'occupied' THEN u.monthly_rent ELSE 0 END), 0) as expected_rent,
          COALESCE(SUM(
            CASE WHEN rl.month = TO_CHAR(CURRENT_DATE, 'YYYY-MM') 
            THEN rl.amount_paid ELSE 0 END
          ), 0) as collected_rent,
          COALESCE(SUM(
            CASE WHEN rl.month = TO_CHAR(CURRENT_DATE, 'YYYY-MM') 
            AND rl.status IN ('unpaid', 'partial', 'overdue')
            THEN rl.amount_due - rl.amount_paid ELSE 0 END
          ), 0) as outstanding_rent,
          COUNT(DISTINCT CASE WHEN rl.status = 'overdue' THEN rl.id END) as overdue_count
        FROM apartments a
        LEFT JOIN floors f ON a.id = f.apartment_id
        LEFT JOIN units u ON f.id = u.floor_id
        LEFT JOIN tenants t ON u.current_tenant_id = t.id AND t.active = true
        LEFT JOIN rent_logs rl ON t.id = rl.tenant_id
        WHERE a.id = $1 AND a.owner_id = $2
        GROUP BY a.id
      `;
      
      const result = await db.query(query, [id, req.user.id]);
      
      if (!result.rows[0]) {
        return res.status(404).json({
          success: false,
          message: 'Apartment not found'
        });
      }
      
      const stats = result.rows[0];
      stats.occupancy_rate = stats.total_units > 0 
        ? Math.round((stats.occupied_units / stats.total_units) * 100)
        : 0;
      
      res.json({
        success: true,
        data: { stats }
      });
      
    } catch (error) {
      console.error('Get apartment stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get apartment statistics'
      });
    }
  }
}

module.exports = ApartmentController;