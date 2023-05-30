const { v4: uuidv4 } = require('uuid');
const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      const usersCollection = dbClient.db.collection('users');

      // Check if email already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = sha1(password);

      // Create new user document
      const newUser = {
        email,
        password: hashedPassword,
        id: uuidv4(),
      };

      // Save new user to the collection
      await usersCollection.insertOne(newUser);

      // Return the new user
      res.status(201).json({ email: newUser.email, id: newUser.id });
    } catch (error) {
      console.error('Error creating new user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
