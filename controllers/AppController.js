// File: controllers/AppController.js

const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AppController {
  static async getStatus(req, res) {
    const redisAlive = redisClient.isAlive();
    const dbAlive = dbClient.isAlive();

    const status = {
      redis: redisAlive,
      db: dbAlive,
    };

    res.status(200).json(status);
  }

  static async getStats(req, res) {
    try {
      const usersCount = await dbClient.nbUsers();
      const filesCount = await dbClient.nbFiles();

      const stats = {
        users: usersCount,
        files: filesCount,
      };

      res.status(200).json(stats);
    } catch (error) {
      console.error('Error retrieving stats:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = AppController;
