// File: controllers/FilesController.js

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const base64 = require('base-64');
const dbClient = require('../utils/db');

class FilesController {
  static async postUpload(req, res) {
    const { name, type, parentId, isPublic, data } = req.body;
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    try {
      const usersCollection = dbClient.db.collection('users');
      const user = await usersCollection.findOne({ token });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let parentIdValue = 0;
      if (parentId) {
        const filesCollection = dbClient.db.collection('files');
        const parentFile = await filesCollection.findOne({ _id: parentId });

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }

        parentIdValue = parentId;
      }

      if (type === 'folder') {
        const newFile = {
          userId: user._id,
          name,
          type,
          isPublic: isPublic || false,
          parentId: parentIdValue,
        };

        const filesCollection = dbClient.db.collection('files');
        const { insertedId } = await filesCollection.insertOne(newFile);

        newFile._id = insertedId;
        return res.status(201).json(newFile);
      }

      const storingFolderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileUUID = uuidv4();
      const localPath = path.join(storingFolderPath, fileUUID);
      const clearData = base64.decode(data);

      fs.mkdirSync(storingFolderPath, { recursive: true });
      fs.writeFileSync(localPath, clearData);

      const newFile = {
        userId: user._id,
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentIdValue,
        localPath,
      };

      const filesCollection = dbClient.db.collection('files');
      const { insertedId } = await filesCollection.insertOne(newFile);

      newFile._id = insertedId;
      return res.status(201).json(newFile);
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
