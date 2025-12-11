const db = require('../config/database');
const moment = require('moment');

class RentLog {
  // Make payment
  static async makePayment(rentLogId, paymentData, userId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get rent log details
      const rentLogQuery = `
        SELECT rl.*, t.unit_id
        FROM rent_logs rl
        JOIN tenants t ON rl.tenant_id = t.id
        WHERE rl.id = $1
      `;
      
      const rentLogResult = await client.query(rentLogQuery, [rentLogId]);
      const rentLog = rentLogResult.rows[0];
      
      if (!rentLog) {
        throw new Error('Rent log not found');
      }
      
      // Create payment record
      const paymentQuery = `
        INSERT INTO payment_records (
          rent_log_id, amount, payment_method, note, created_by
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const paymentResult = await client.query(paymentQuery, [
        rentLogId,
        paymentData.amount,
        paymentData.payment_method || 'cash',
        paymentData.note,
        userId
      ]);
      
      const payment = paymentResult.rows[0];
      
      // Update rent log
      const newAmountPaid = parseFloat(rentLog.amount_paid) + parseFloat(paymentData.amount);
      const amountDue = parseFloat(rentLog.amount_due);
      
      let newStatus = 'partial';
      if (newAmountPaid >= amountDue) {
        newStatus = 'paid';
      }
      
      const updateRentLogQuery = `
        UPDATE rent_logs
        SET amount_paid = $1, status = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      await client.query(updateRentLogQuery, [
        newAmountPaid,
        newStatus,
        rentLogId
      ]);
      
      // Update audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          'PAYMENT_CREATED',
          'payment_records',
          payment.id,
          JSON.stringify(payment)
        ]
      );
      
      await client.query('COMMIT');
      return payment;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Generate monthly rent logs
  static async generateMonthlyLogs() {
    const query = `
      INSERT INTO rent_logs (tenant_id, unit_id, month, due_date, amount_due, status)
      SELECT 
        t.id,
        t.unit_id,
        TO_CHAR(CURRENT_DATE + INTERVAL '1 month', 'YYYY-MM'),
        DATE_TRUNC('month', CURRENT_DATE + INTERVAL '2 month') + INTERVAL '1 day' - INTERVAL '1 day',
        t.monthly_rent,
        'unpaid'
      FROM tenants t
      WHERE t.active = true
        AND NOT EXISTS (
          SELECT 1 FROM rent_logs rl
          WHERE rl.tenant_id = t.id
            AND rl.month = TO_CHAR(CURRENT_DATE + INTERVAL '1 month', 'YYYY-MM')
        )
    `;
    
    await db.query(query);
  }

  // Update overdue status
  static async updateOverdueStatus(overdueDay = 10) {
    const query = `
      UPDATE rent_logs
      SET status = 'overdue'
      WHERE status IN ('unpaid', 'partial')
        AND due_date < CURRENT_DATE - INTERVAL '${overdueDay} days'
        AND amount_paid < amount_due
    `;
    
    await db.query(query);
  }

  // Get rent logs by unit
  static async findByUnitId(unitId, filters = {}) {
    let query = `
      SELECT rl.*,
        json_agg(
          json_build_object(
            'id', pr.id,
            'amount', pr.amount,
            'paid_at', pr.paid_at,
            'payment_method', pr.payment_method,
            'note', pr.note,
            'created_by', u.name
          )
        ) as payments
      FROM rent_logs rl
      LEFT JOIN payment_records pr ON rl.id = pr.rent_log_id
      LEFT JOIN users u ON pr.created_by = u.id
      WHERE rl.unit_id = $1
    `;
    
    const values = [unitId];
    let paramIndex = 2;
    
    if (filters.month) {
      query += ` AND rl.month = $${paramIndex}`;
      values.push(filters.month);
      paramIndex++;
    }
    
    if (filters.status) {
      query += ` AND rl.status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }
    
    query += `
      GROUP BY rl.id
      ORDER BY rl.month DESC
      ${filters.limit ? `LIMIT $${paramIndex}` : ''}
    `;
    
    if (filters.limit) {
      values.push(filters.limit);
    }
    
    const result = await db.query(query, values);
    return result.rows;
  }
}

module.exports = RentLog;