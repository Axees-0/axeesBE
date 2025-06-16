const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Connect to the in-memory database
 */
const connect = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.info('Test database connected');
  } catch (error) {
    console.error('Error connecting to test database:', error);
    throw error;
  }
};

/**
 * Drop database, close connection and stop mongod
 */
const closeDatabase = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Error closing test database:', error);
    throw error;
  }
};

/**
 * Remove all data from all db collections
 */
const clearDatabase = async () => {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing test database:', error);
    throw error;
  }
};

module.exports = {
  connect,
  closeDatabase,
  clearDatabase,
};