import mongoose from 'mongoose';
import UserInfo from './models/UserInfo.js';

// Use the same MongoDB URI as in config/mongodb.js (pointing to knowledge-discovery database)
const mongoUri = 'mongodb+srv://travel-agency:Vignesh%4022@cluster0.ialfq.mongodb.net/knowledge-discovery?retryWrites=true&w=majority&appName=Cluster0';

const checkUserData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== Collections in Database ===');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Get all user info entries
    const userInfos = await UserInfo.find({});
    
    console.log(`\n=== User Information Stored in Database ===`);
    console.log(`Total users: ${userInfos.length}\n`);
    
    if (userInfos.length === 0) {
      console.log('No user information found in the database.');
    } else {
      userInfos.forEach((user, index) => {
        console.log(`\n--- User ${index + 1} ---`);
        console.log(`ID: ${user._id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Mobile: ${user.mobile}`);
        console.log(`Created: ${user.createdAt}`);
      });
    }
    
    console.log('\n=== Search History ===');
    const SearchHistory = await import('./models/SearchHistory.js');
    const searchHistories = await SearchHistory.default.find({});
    
    console.log(`Total search history entries: ${searchHistories.length}`);
    
    if (searchHistories.length > 0) {
      searchHistories.slice(0, 5).forEach((search, index) => {
        console.log(`\n--- Search ${index + 1} ---`);
        console.log(`User ID: ${search.userId}`);
        console.log(`User Name: ${search.userName || 'N/A'}`);
        console.log(`User Email: ${search.userEmail || 'N/A'}`);
        console.log(`Query: ${search.query}`);
        console.log(`Project: ${search.projectName || 'N/A'}`);
        console.log(`Results: ${search.resultsCount}`);
        console.log(`Created: ${search.createdAt}`);
      });
    }
    
    console.log('\n=== Chunks ===');
    const Chunk = await import('./models/Chunk.js');
    const chunks = await Chunk.default.find({});
    
    console.log(`Total chunks: ${chunks.length}`);
    
    if (chunks.length > 0) {
      chunks.slice(0, 3).forEach((chunk, index) => {
        console.log(`\n--- Chunk ${index + 1} ---`);
        console.log(`ID: ${chunk._id}`);
        console.log(`Document ID: ${chunk.document_id}`);
        console.log(`Content: ${chunk.content?.substring(0, 100)}...`);
        console.log(`Created: ${chunk.createdAt}`);
      });
    }
    
    console.log('\n=== Documents ===');
    const Document = await import('./models/Document.js');
    const documents = await Document.default.find({});
    
    console.log(`Total documents: ${documents.length}`);
    
    if (documents.length > 0) {
      const docsWithUserId = documents.filter(doc => doc.userId);
      console.log(`Documents with userId: ${docsWithUserId.length}`);
      
      docsWithUserId.slice(0, 3).forEach((doc, index) => {
        console.log(`\n--- Document ${index + 1} ---`);
        console.log(`Filename: ${doc.filename}`);
        console.log(`Project: ${doc.project_name}`);
        console.log(`User ID: ${doc.userId}`);
        console.log(`Created: ${doc.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkUserData();
