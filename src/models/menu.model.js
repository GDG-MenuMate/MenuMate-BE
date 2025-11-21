import { pool } from "../config/db.js";

export const Menu = {
  findByRestaurantId: async (restaurantId) => {
    try {
      const query = "SELECT * FROM menus WHERE restaurants_id = $1";
      const { rows } = await pool.query(query, [restaurantId]);
      return rows;
    } catch (error) {
      console.error(
        `Error finding menus for restaurant id ${restaurantId}:`,
        error
      );
      throw error;
    }
  },

  findOne: async (name, restaurantId) => {
    try {
      const query =
        "SELECT * FROM menus WHERE name = $1 AND restaurants_id = $2";
      const { rows } = await pool.query(query, [name, restaurantId]);
      return rows[0];
    } catch (error) {
      console.error(
        `Error finding menu "${name}" for restaurant id ${restaurantId}:`,
        error
      );
      throw error;
    }
  },

  findDetailByNames: async (restaurantName, menuName) => {
    try {
      const query = `
        SELECT 
          m.name, m.description, m.calories, m.price,
          r.name as restaurant_name, r.latitude, r.longitude, r.url as restaurant_url
        FROM menus m
        JOIN restaurants r ON m.restaurants_id = r.restaurants_id
        WHERE r.name = $1 AND m.name = $2
      `;

      const { rows } = await pool.query(query, [restaurantName, menuName]);
      return rows[0];
    } catch (error) {
      console.error(
        `Error finding detail for menu "${menuName}" at "${restaurantName}":`,
        error
      );
      throw error;
    }
  },
};
