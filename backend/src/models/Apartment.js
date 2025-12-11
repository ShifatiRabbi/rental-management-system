const db = require('../config/database');

class Apartment {
  // Create apartment with floors and units
  static async create(apartmentData) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert apartment
      const apartmentQuery = `
        INSERT INTO apartments (
          owner_id, name, address, caretaker_name, caretaker_phone,
          floors_count, units_per_floor, rent_due_day, overdue_day
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const apartmentValues = [
        apartmentData.owner_id,
        apartmentData.name,
        apartmentData.address,
        apartmentData.caretaker_name,
        apartmentData.caretaker_phone,
        apartmentData.floors_count,
        apartmentData.units_per_floor,
        apartmentData.rent_due_day || 1,
        apartmentData.overdue_day || 10
      ];
      
      const apartmentResult = await client.query(apartmentQuery, apartmentValues);
      const apartment = apartmentResult.rows[0];
      
      // Create floors and units
      for (let floorNum = 1; floorNum <= apartmentData.floors_count; floorNum++) {
        // Create floor
        const floorQuery = `
          INSERT INTO floors (apartment_id, floor_number, units_count)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        
        const floorResult = await client.query(floorQuery, [
          apartment.id,
          floorNum,
          apartmentData.units_per_floor
        ]);
        
        const floor = floorResult.rows[0];
        
        // Create units for this floor
        for (let unitNum = 1; unitNum <= apartmentData.units_per_floor; unitNum++) {
          const unitNumber = `${floorNum}${String(unitNum).padStart(2, '0')}`;
          
          const unitQuery = `
            INSERT INTO units (floor_id, unit_number, monthly_rent)
            VALUES ($1, $2, $3)
          `;
          
          await client.query(unitQuery, [
            floor.id,
            unitNumber,
            apartmentData.default_rent || 0
          ]);
        }
      }
      
      await client.query('COMMIT');
      return apartment;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get apartments by owner
  static async findByOwner(ownerId) {
    const query = `
      SELECT a.*, 
        COUNT(DISTINCT f.id) as actual_floors,
        COUNT(DISTINCT u.id) as total_units,
        COUNT(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END) as occupied_units,
        COALESCE(SUM(CASE WHEN u.status = 'occupied' THEN u.monthly_rent ELSE 0 END), 0) as expected_rent
      FROM apartments a
      LEFT JOIN floors f ON a.id = f.apartment_id
      LEFT JOIN units u ON f.id = u.floor_id
      WHERE a.owner_id = $1
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `;
    
    const result = await db.query(query, [ownerId]);
    return result.rows;
  }

  // Get apartment details with structure
  static async findById(id, ownerId = null) {
    let query = `
      SELECT a.*,
        json_agg(
          json_build_object(
            'id', f.id,
            'floor_number', f.floor_number,
            'units_count', f.units_count,
            'units', (
              SELECT json_agg(
                json_build_object(
                  'id', u.id,
                  'unit_number', u.unit_number,
                  'monthly_rent', u.monthly_rent,
                  'status', u.status,
                  'tenant', CASE 
                    WHEN t.id IS NOT NULL THEN json_build_object(
                      'id', t.id,
                      'name', t.name,
                      'phone', t.phone
                    )
                    ELSE NULL
                  END
                )
              )
              FROM units u
              LEFT JOIN tenants t ON u.current_tenant_id = t.id AND t.active = true
              WHERE u.floor_id = f.id
              ORDER BY u.unit_number
            )
          )
          ORDER BY f.floor_number
        ) as floors
      FROM apartments a
      LEFT JOIN floors f ON a.id = f.apartment_id
      WHERE a.id = $1
    `;
    
    const values = [id];
    
    if (ownerId) {
      query += ' AND a.owner_id = $2';
      values.push(ownerId);
    }
    
    query += ' GROUP BY a.id';
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Update apartment
  static async update(id, ownerId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = fields.map((field, index) => 
      `${field} = $${index + 1}`
    ).join(', ');
    
    const query = `
      UPDATE apartments 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1} 
        AND owner_id = $${fields.length + 2}
      RETURNING *
    `;
    
    const result = await db.query(query, [...values, id, ownerId]);
    return result.rows[0];
  }

  // Delete apartment
  static async delete(id, ownerId) {
    const query = `
      DELETE FROM apartments 
      WHERE id = $1 AND owner_id = $2
      RETURNING id
    `;
    
    const result = await db.query(query, [id, ownerId]);
    return result.rows[0];
  }
}

module.exports = Apartment;