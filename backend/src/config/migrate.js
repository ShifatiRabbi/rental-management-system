const { pool } = require('./database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'owner',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Apartments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS apartments (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        caretaker_name VARCHAR(100),
        caretaker_phone VARCHAR(20),
        floors_count INTEGER NOT NULL,
        units_per_floor INTEGER NOT NULL,
        rent_due_day INTEGER DEFAULT 1,
        overdue_day INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Floors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS floors (
        id SERIAL PRIMARY KEY,
        apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE,
        floor_number INTEGER NOT NULL,
        units_count INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(apartment_id, floor_number)
      )
    `);

    // Units table
    await client.query(`
      CREATE TABLE IF NOT EXISTS units (
        id SERIAL PRIMARY KEY,
        floor_id INTEGER REFERENCES floors(id) ON DELETE CASCADE,
        unit_number VARCHAR(20) NOT NULL,
        monthly_rent DECIMAL(10,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'vacant',
        current_tenant_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tenants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        national_id VARCHAR(50),
        move_in_date DATE NOT NULL,
        move_out_date DATE,
        monthly_rent DECIMAL(10,2) NOT NULL,
        notes TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Rent logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rent_logs (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        unit_id INTEGER REFERENCES units(id) ON DELETE CASCADE,
        month VARCHAR(7) NOT NULL, -- YYYY-MM format
        due_date DATE NOT NULL,
        amount_due DECIMAL(10,2) NOT NULL,
        amount_paid DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'unpaid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, month)
      )
    `);

    // Payment records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_records (
        id SERIAL PRIMARY KEY,
        rent_log_id INTEGER REFERENCES rent_logs(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method VARCHAR(50) DEFAULT 'cash',
        note TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(50) NOT NULL,
        record_id INTEGER,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('Tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
};

createTables();