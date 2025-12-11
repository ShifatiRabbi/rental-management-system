const Unit = require('../models/Unit');
const Tenant = require('../models/Tenant');
const RentLog = require('../models/RentLog');

class UnitController {
  /**
   * Get unit details with tenant and rent logs
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUnitDetails(req, res) {
    try {
      const { id } = req.params;
      const unit = await Unit.findById(id, req.user.id);
      
      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }
      
      res.json({
        success: true,
        data: { unit }
      });
      
    } catch (error) {
      console.error('Get unit details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unit details'
      });
    }
  }
  
  /**
   * Assign tenant to unit
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async assignTenant(req, res) {
    try {
      const { id } = req.params;
      const tenantData = req.body;
      
      // Validate required fields
      if (!tenantData.name || !tenantData.phone || !tenantData.move_in_date || !tenantData.monthly_rent) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, phone, move_in_date, monthly_rent'
        });
      }
      
      const tenant = await Unit.assignTenant(id, tenantData, req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Tenant assigned successfully',
        data: { tenant }
      });
      
    } catch (error) {
      console.error('Assign tenant error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('already occupied')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to assign tenant'
      });
    }
  }
  
  /**
   * Move out tenant from unit
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async moveOutTenant(req, res) {
    try {
      const { id } = req.params;
      const { move_out_date } = req.body;
      
      if (!move_out_date) {
        return res.status(400).json({
          success: false,
          message: 'Move out date is required'
        });
      }
      
      // Get unit to find current tenant
      const unit = await Unit.findById(id, req.user.id);
      
      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }
      
      if (!unit.tenant || !unit.tenant.active) {
        return res.status(400).json({
          success: false,
          message: 'No active tenant found for this unit'
        });
      }
      
      const tenant = await Tenant.moveOut(unit.tenant.id, move_out_date, req.user.id);
      
      res.json({
        success: true,
        message: 'Tenant moved out successfully',
        data: { tenant }
      });
      
    } catch (error) {
      console.error('Move out tenant error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to move out tenant'
      });
    }
  }
  
  /**
   * Update unit rent
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateRent(req, res) {
    try {
      const { id } = req.params;
      const { monthly_rent } = req.body;
      
      if (!monthly_rent || monthly_rent < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid monthly rent is required'
        });
      }
      
      const unit = await Unit.updateRent(id, monthly_rent, req.user.id);
      
      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }
      
      // If unit has active tenant, update tenant's monthly rent too
      if (unit.current_tenant_id) {
        await Tenant.update(unit.current_tenant_id, { monthly_rent }, req.user.id);
      }
      
      res.json({
        success: true,
        message: 'Rent updated successfully',
        data: { unit }
      });
      
    } catch (error) {
      console.error('Update rent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update rent'
      });
    }
  }
  
  /**
   * Make payment for rent log
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async makePayment(req, res) {
    try {
      const { rentLogId } = req.params;
      const paymentData = req.body;
      
      if (!paymentData.amount || paymentData.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid payment amount is required'
        });
      }
      
      const payment = await RentLog.makePayment(rentLogId, paymentData, req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: { payment }
      });
      
    } catch (error) {
      console.error('Make payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record payment'
      });
    }
  }
  
  /**
   * Get unit payment history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getPaymentHistory(req, res) {
    try {
      const { id } = req.params;
      const { month, status, limit = 12 } = req.query;
      
      const filters = { month, status, limit: parseInt(limit) };
      const rentLogs = await RentLog.findByUnitId(id, filters);
      
      res.json({
        success: true,
        data: { rentLogs },
        count: rentLogs.length
      });
      
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment history'
      });
    }
  }
}

module.exports = UnitController;