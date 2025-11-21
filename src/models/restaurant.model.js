import { pool } from "../config/db.js";

export const Restaurant = {
  findAll: async () => {
    try {
      const query = "SELECT * FROM restaurants";
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error("Error finding all restaurants:", error);
      throw error;
    }
  },

  findById: async (id) => {
    try {
      const query = "SELECT * FROM restaurants WHERE restaurants_id = $1";
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error finding restaurant with id ${id}:`, error);
      throw error;
    }
  },

  findByName: async (name) => {
    try {
      const query = "SELECT * FROM restaurants WHERE name = $1";
      const { rows } = await pool.query(query, [name]);
      return rows[0];
    } catch (error) {
      console.error(`Error finding restaurant with name "${name}": `, error);
      throw error;
    }
  },

  findByCampus: async (campusName) => {
    try {
      const query = "SELECT * FROM restaurants WHERE $1 = ANY(campus)";
      const { rows } = await pool.query(query, [campusName]);
      return rows;
    } catch (error) {
      console.error(
        `Error finding restaurants in campus "${campusName}":`,
        error
      );
      throw error;
    }
  },
};
