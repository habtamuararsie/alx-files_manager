const { v4: uuidv4 } = require('uuid');
const base64 = require('base-64');
const sha1 = require('sha1');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const credentials = base64.decode(authHeader.slice('Basic '.length)).split(':');
    const email = credentials[0];
    const password = credentials[1];

    try {
      const usersCollection = dbClient.db.collection('users');
      const user = await usersCollection.findOne({ email, password: sha1(password) });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      const key = `auth_${token}`;

      await redisClient.set(key, user._id.toString(), 'EX', 24 * 60 * 60);

      return res.status(200).json({ token });
    } catch (error) {
      console.error('Error authenticating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const key = `auth_${token}`;
      const response = await redisClient.del(key);

      if (response === 0) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.status(204).end();
    } catch (error) {
      console.error('Error disconnecting user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = AuthController;
