const db = require('../config/database');

class Tenant {
  // Move out tenant
  static async moveOut(tenantId, moveOutDate, ownerId = null) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verify tenant exists and belongs to owner
      let tenantQuery = `
        SELECT t.* FROM tenants t
        JOIN units u ON t.unit_id = u.id
        JOIN floors f ON u.floor_id = f.id
        JOIN apartments a ON f.apartment_id = a.id
        WHERE t.id = $1 AND t.active = true
      `;
      
      const tenantValues = [tenantId];
      
      if (ownerId) {
        tenantQuery += ' AND a.owner_id = $2';
        tenantValues.push(ownerId);
      }
      
      const tenantResult = await client.query(tenantQuery, tenantValues);
      const tenant = tenantResult.rows[0];
      
      if (!tenant) {
        throw new Error('Tenant not found or access denied');
      }
      
      // Update tenant
      await client.query(
        'UPDATE tenants SET active = false, move_out_date = $1 WHERE id = $2',
        [moveOutDate, tenantId]
      );
      
      // Update unit
      await client.query(
        'UPDATE units SET status = $1, current_tenant_id = NULL WHERE id = $2',
        ['vacant', tenant.unit_id]
      );
      
      // Mark all unpaid rent logs as void
      await client.query(
        'UPDATE rent_logs SET status = $1 WHERE tenant_id = $2 AND status = $3',
        ['void', tenantId, 'unpaid']
      );
      
      await client.query('COMMIT');
      return tenant;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update tenant
  static async update(tenantId, updateData, ownerId = null) {
    let whereClause = 'WHERE id = $1';
    const values = Object.values(updateData);
    const fields = Object.keys(updateData);
    
    if (ownerId) {
      whereClause = `
        WHERE t.id = $${fields.length + 1}
        AND EXISTS (
          SELECT 1 FROM tenants t2
          JOIN units u ON t2.unit_id = u.id
          JOIN floors f ON u.floor_id = f.id
          JOIN apartments a ON f.apartment_id = a.id
          WHERE t2.id = t.id AND a.owner_id = $${fields.length + 2}
        )
      `;
      values.push(tenantId, ownerId);
    } else {
      values.push(tenantId);
    }
    
    const setClause = fields.map((field, index) => 
      `${field} = $${index + 1}`
    ).join(', ');
    
    const query = `
      UPDATE tenants t
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      ${whereClause}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = Tenant;