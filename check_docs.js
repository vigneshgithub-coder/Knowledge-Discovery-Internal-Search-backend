const mongoose = require('mongoose');

async function checkDocs() {
  try {
    // Connect using the same connection string as server.js
    await mongoose.connect('mongodb://localhost:27017/knowledge-discovery');
    
    const Document = require('./models/Document');
    
    // Check documents for this user
    const docs = await Document.find({uploadedBy: '691873ee5912d58409a39c6d'})
      .select('fileName project category content')
      .limit(5);
    
    console.log(`Documents for user 691873ee5912d58409a39c6d:`, docs.length);
    docs.forEach(doc => {
      console.log(`- ${doc.fileName} (project: ${doc.project || 'none'})`);
      if (doc.content && doc.content.toLowerCase().includes('socia')) {
        console.log(`  Contains 'socia' in content`);
      }
    });
    
    // Also check all documents that match 'socia'
    const matchingDocs = await Document.find({
      $or: [
        { content: { $regex: 'socia', $options: 'i' } },
        { fileName: { $regex: 'socia', $options: 'i' } }
      ]
    }).select('fileName uploadedBy');
    
    console.log(`\nAll documents matching 'socia':`, matchingDocs.length);
    matchingDocs.forEach(doc => {
      console.log(`- ${doc.fileName} (uploadedBy: ${doc.uploadedBy})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkDocs();
