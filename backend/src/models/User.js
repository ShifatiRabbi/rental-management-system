const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create new user (owner registration)
  static async create(userData) {
    const { name, username, email, phone, password } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const query = `
      INSERT INTO users (name, username, email, phone, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, username, email, phone, role, created_at
    `;
    
    const values = [name, username, email, phone, passwordHash];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Find user by email or username
  static async findByEmailOrUsername(identifier) {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 OR username = $1
    `;
    const result = await db.query(query, [identifier]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Verify password
  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  // Update user
  static async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = fields.map((field, index) => 
      `${field} = $${index + 1}`
    ).join(', ');
    
    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;
    
    const result = await db.query(query, [...values, id]);
    return result.rows[0];
  }
}

module.exports = User;