const db = require('../config/database');
const moment = require('moment');

class ReportController {
  /**
   * Get monthly report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getMonthlyReport(req, res) {
    try {
      const { apartmentId, from, to } = req.query;
      
      let query = `
        SELECT 
          rl.month,
          a.name as apartment_name,
          COUNT(DISTINCT rl.id) as total_rent_logs,
          SUM(rl.amount_due) as total_expected,
          SUM(rl.amount_paid) as total_collected,
          SUM(rl.amount_due - rl.amount_paid) as total_outstanding,
          COUNT(DISTINCT CASE WHEN rl.status = 'paid' THEN rl.id END) as paid_count,
          COUNT(DISTINCT CASE WHEN rl.status = 'partial' THEN rl.id END) as partial_count,
          COUNT(DISTINCT CASE WHEN rl.status = 'overdue' THEN rl.id END) as overdue_count,
          COUNT(DISTINCT CASE WHEN rl.status = 'unpaid' THEN rl.id END) as unpaid_count
        FROM rent_logs rl
        JOIN tenants t ON rl.tenant_id = t.id
        JOIN units u ON rl.unit_id = u.id
        JOIN floors f ON u.floor_id = f.id
        JOIN apartments a ON f.apartment_id = a.id
        WHERE a.owner_id = $1
      `;
      
      const values = [req.user.id];
      let paramIndex = 2;
      
      if (apartmentId) {
        query += ` AND a.id = $${paramIndex}`;
        values.push(apartmentId);
        paramIndex++;
      }
      
      if (from) {
        query += ` AND rl.month >= $${paramIndex}`;
        values.push(from);
        paramIndex++;
      }
      
      if (to) {
        query += ` AND rl.month <= $${paramIndex}`;
        values.push(to);
        paramIndex++;
      }
      
      query += `
        GROUP BY rl.month, a.name
        ORDER BY rl.month DESC
      `;
      
      const result = await db.query(query, values);
      
      res.json({
        success: true,
        data: { reports: result.rows },
        count: result.rows.length
      });
      
    } catch (error) {
      console.error('Get monthly report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate monthly report'
      });
    }
  }
  
  /**
   * Get occupancy report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getOccupancyReport(req, res) {
    try {
      const { months = 6 } = req.query;
      
      const query = `
        WITH months AS (
          SELECT 
            TO_CHAR(generate_series(
              CURRENT_DATE - INTERVAL '${months} months',
              CURRENT_DATE,
              '1 month'
            ), 'YYYY-MM') as month
        ),
        monthly_occupancy AS (
          SELECT 
            m.month,
            a.id as apartment_id,
            a.name as apartment_name,
            COUNT(DISTINCT u.id) as total_units,
            COUNT(DISTINCT CASE 
              WHEN t.move_in_date <= DATE(m.month || '-01') 
              AND (t.move_out_date IS NULL OR t.move_out_date >= DATE(m.month || '-01'))
              THEN u.id 
            END) as occupied_units
          FROM months m
          CROSS JOIN apartments a
          LEFT JOIN floors f ON a.id = f.apartment_id
          LEFT JOIN units u ON f.id = u.floor_id
          LEFT JOIN tenants t ON u.id = t.unit_id
          WHERE a.owner_id = $1
          GROUP BY m.month, a.id, a.name
        )
        SELECT 
          month,
          apartment_id,
          apartment_name,
          total_units,
          occupied_units,
          CASE 
            WHEN total_units > 0 
            THEN ROUND((occupied_units::DECIMAL / total_units) * 100, 2)
            ELSE 0 
          END as occupancy_rate
        FROM monthly_occupancy
        ORDER BY month DESC, apartment_name
      `;
      
      const result = await db.query(query, [req.user.id]);
      
      res.json({
        success: true,
        data: { occupancy: result.rows },
        count: result.rows.length
      });
      
    } catch (error) {
      console.error('Get occupancy report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate occupancy report'
      });
    }
  }
  
  /**
   * Get overdue report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getOverdueReport(req, res) {
    try {
      const query = `
        SELECT 
          rl.id,
          rl.month,
          rl.due_date,
          rl.amount_due,
          rl.amount_paid,
          rl.amount_due - rl.amount_paid as remaining,
          rl.status,
          t.name as tenant_name,
          t.phone as tenant_phone,
          u.unit_number,
          f.floor_number,
          a.name as apartment_name
        FROM rent_logs rl
        JOIN tenants t ON rl.tenant_id = t.id
        JOIN units u ON rl.unit_id = u.id
        JOIN floors f ON u.floor_id = f.id
        JOIN apartments a ON f.apartment_id = a.id
        WHERE a.owner_id = $1
          AND rl.status = 'overdue'
          AND rl.amount_paid < rl.amount_due
        ORDER BY rl.due_date, a.name, f.floor_number, u.unit_number
      `;
      
      const result = await db.query(query, [req.user.id]);
      
      res.json({
        success: true,
        data: { overdue: result.rows },
        count: result.rows.length,
        total_outstanding: result.rows.reduce((sum, row) => sum + parseFloat(row.remaining), 0)
      });
      
    } catch (error) {
      console.error('Get overdue report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate overdue report'
      });
    }
  }
  
  /**
   * Export data to CSV
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async exportData(req, res) {
    try {
      const { type, apartmentId, from, to } = req.query;
      
      let query = '';
      let filename = '';
      
      switch (type) {
        case 'tenants':
          filename = `tenants_${moment().format('YYYYMMDD')}.csv`;
          query = `
            SELECT 
              t.name as "Tenant Name",
              t.phone as "Phone",
              t.national_id as "National ID",
              t.move_in_date as "Move In Date",
              t.move_out_date as "Move Out Date",
              t.monthly_rent as "Monthly Rent",
              t.notes as "Notes",
              u.unit_number as "Unit Number",
              f.floor_number as "Floor",
              a.name as "Apartment",
              CASE WHEN t.active THEN 'Active' ELSE 'Inactive' END as "Status"
            FROM tenants t
            JOIN units u ON t.unit_id = u.id
            JOIN floors f ON u.floor_id = f.id
            JOIN apartments a ON f.apartment_id = a.id
            WHERE a.owner_id = $1
            ${apartmentId ? 'AND a.id = $2' : ''}
            ORDER BY a.name, f.floor_number, u.unit_number
          `;
          break;
          
        case 'payments':
          filename = `payments_${moment().format('YYYYMMDD')}.csv`;
          query = `
            SELECT 
              pr.paid_at as "Payment Date",
              pr.amount as "Amount",
              pr.payment_method as "Payment Method",
              pr.note as "Note",
              rl.month as "Rent Month",
              t.name as "Tenant Name",
              u.unit_number as "Unit Number",
              f.floor_number as "Floor",
              a.name as "Apartment"
            FROM payment_records pr
            JOIN rent_logs rl ON pr.rent_log_id = rl.id
            JOIN tenants t ON rl.tenant_id = t.id
            JOIN units u ON rl.unit_id = u.id
            JOIN floors f ON u.floor_id = f.id
            JOIN apartments a ON f.apartment_id = a.id
            WHERE a.owner_id = $1
            ${from ? 'AND pr.paid_at >= $2' : ''}
            ${to ? 'AND pr.paid_at <= $3' : ''}
            ${apartmentId ? `AND a.id = $${from && to ? '4' : from || to ? '3' : '2'}` : ''}
            ORDER BY pr.paid_at DESC
          `;
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid export type'
          });
      }
      
      const values = [req.user.id];
      if (apartmentId) values.push(apartmentId);
      if (from) values.push(from);
      if (to) values.push(to);
      
      const result = await db.query(query, values);
      
      // Convert to CSV
      const csv = result.rows.map(row => {
        return Object.values(row).map(value => 
          `"${value ? value.toString().replace(/"/g, '""') : ''}"`
        ).join(',');
      }).join('\n');
      
      const headers = Object.keys(result.rows[0] || {}).join(',');
      const csvData = headers + '\n' + csv;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvData);
      
    } catch (error) {
      console.error('Export data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data'
      });
    }
  }
}

module.exports = ReportController;