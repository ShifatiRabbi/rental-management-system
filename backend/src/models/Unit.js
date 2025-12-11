const db = require('../config/database');

class Unit {
  // Get unit details with tenant and rent logs
  static async findById(id, ownerId = null) {
    let query = `
      SELECT 
        u.*,
        f.floor_number,
        a.id as apartment_id,
        a.name as apartment_name,
        a.owner_id,
        json_build_object(
          'id', t.id,
          'name', t.name,
          'phone', t.phone,
          'national_id', t.national_id,
          'move_in_date', t.move_in_date,
          'move_out_date', t.move_out_date,
          'monthly_rent', t.monthly_rent,
          'notes', t.notes,
          'active', t.active,
          'created_at', t.created_at
        ) as tenant,
        (
          SELECT json_agg(
            json_build_object(
              'id', rl.id,
              'month', rl.month,
              'due_date', rl.due_date,
              'amount_due', rl.amount_due,
              'amount_paid', rl.amount_paid,
              'status', rl.status,
              'created_at', rl.created_at,
              'payments', (
                SELECT json_agg(
                  json_build_object(
                    'id', pr.id,
                    'amount', pr.amount,
                    'paid_at', pr.paid_at,
                    'payment_method', pr.payment_method,
                    'note', pr.note
                  )
                  ORDER BY pr.paid_at DESC
                )
                FROM payment_records pr
                WHERE pr.rent_log_id = rl.id
              )
            )
            ORDER BY rl.month DESC
          )
          FROM rent_logs rl
          WHERE rl.unit_id = u.id
            AND rl.tenant_id = t.id
        ) as rent_logs,
        (
          SELECT json_agg(
            json_build_object(
              'id', pt.id,
              'name', pt.name,
              'phone', pt.phone,
              'move_in_date', pt.move_in_date,
              'move_out_date', pt.move_out_date,
              'monthly_rent', pt.monthly_rent
            )
            ORDER BY pt.move_out_date DESC
          )
          FROM tenants pt
          WHERE pt.unit_id = u.id
            AND pt.active = false
        ) as previous_tenants
      FROM units u
      JOIN floors f ON u.floor_id = f.id
      JOIN apartments a ON f.apartment_id = a.id
      LEFT JOIN tenants t ON u.current_tenant_id = t.id AND t.active = true
      WHERE u.id = $1
    `;
    
    const values = [id];
    
    if (ownerId) {
      query += ' AND a.owner_id = $2';
      values.push(ownerId);
    }
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Assign tenant to unit
  static async assignTenant(unitId, tenantData, ownerId = null) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verify unit exists and belongs to owner
      let unitQuery = `
        SELECT u.* FROM units u
        JOIN floors f ON u.floor_id = f.id
        JOIN apartments a ON f.apartment_id = a.id
        WHERE u.id = $1
      `;
      
      const unitValues = [unitId];
      
      if (ownerId) {
        unitQuery += ' AND a.owner_id = $2';
        unitValues.push(ownerId);
      }
      
      const unitResult = await client.query(unitQuery, unitValues);
      const unit = unitResult.rows[0];
      
      if (!unit) {
        throw new Error('Unit not found or access denied');
      }
      
      if (unit.status === 'occupied') {
        throw new Error('Unit is already occupied');
      }
      
      // Create tenant
      const tenantQuery = `
        INSERT INTO tenants (
          unit_id, name, phone, national_id, 
          move_in_date, monthly_rent, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const tenantValues = [
        unitId,
        tenantData.name,
        tenantData.phone,
        tenantData.national_id,
        tenantData.move_in_date,
        tenantData.monthly_rent,
        tenantData.notes
      ];
      
      const tenantResult = await client.query(tenantQuery, tenantValues);
      const tenant = tenantResult.rows[0];
      
      // Update unit
      await client.query(
        'UPDATE units SET status = $1, current_tenant_id = $2 WHERE id = $3',
        ['occupied', tenant.id, unitId]
      );
      
      // Generate initial rent log for current month
      const currentMonth = new Date().toISOString().slice(0, 7);
      const dueDate = new Date();
      dueDate.setDate(unit.rent_due_day || 1);
      
      const rentLogQuery = `
        INSERT INTO rent_logs (
          tenant_id, unit_id, month, due_date, amount_due, status
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await client.query(rentLogQuery, [
        tenant.id,
        unitId,
        currentMonth,
        dueDate,
        tenantData.monthly_rent,
        'unpaid'
      ]);
      
      await client.query('COMMIT');
      return tenant;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update unit rent
  static async updateRent(unitId, monthlyRent, ownerId = null) {
    let query = `
      UPDATE units u
      SET monthly_rent = $1, updated_at = CURRENT_TIMESTAMP
      FROM floors f, apartments a
      WHERE u.id = $2
        AND u.floor_id = f.id
        AND f.apartment_id = a.id
    `;
    
    const values = [monthlyRent, unitId];
    
    if (ownerId) {
      query += ' AND a.owner_id = $3';
      values.push(ownerId);
    }
    
    query += ' RETURNING u.*';
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = Unit;