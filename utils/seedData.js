import { connectToMongoDB, disconnectFromMongoDB } from '../config/mongodb.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { generateDeterministicEmbedding } from './embedding.js';

const sampleDocuments = [
  {
    filename: 'financial-report-2024.txt',
    project_name: 'Finance',
    tags: ['finance', 'quarterly', 'report'],
    content: `
    Financial Report Q4 2024

    Executive Summary
    Our company achieved significant growth in Q4 2024 with revenue reaching $50 million,
    a 25% increase from Q3. Net profit margin improved to 18% due to operational efficiency gains.

    Revenue Analysis
    Product sales contributed $35 million, representing 70% of total revenue. Service revenue
    grew to $15 million, showing strong client retention and upselling success.

    Cost Structure
    Operating expenses were well-managed at $25 million. Personnel costs remained stable at $15 million.
    Technology infrastructure investments totaled $8 million, supporting our cloud migration strategy.

    Market Outlook
    We anticipate continued growth in 2025 with projected revenue of $65 million. Market expansion
    into Asia-Pacific region is planned for Q2. New product launches are scheduled quarterly.

    Key Metrics
    - Customer acquisition cost decreased by 15%
    - Churn rate improved to 5% from 8%
    - Customer lifetime value increased by 30%
    - Employee retention rate at 92%
    - Cash reserve position: $20 million

    Recommendations
    1. Accelerate R&D investments by 20%
    2. Expand sales team by 30 headcount
    3. Establish strategic partnerships with industry leaders
    4. Invest in customer success infrastructure
    `,
  },
  {
    filename: 'product-roadmap-2025.txt',
    project_name: 'Product',
    tags: ['product', 'roadmap', 'development'],
    content: `
    Product Roadmap 2025

    Q1 2025 - Foundation Building
    We will focus on platform stabilization and infrastructure improvements. The core focus includes
    API performance optimization and database migration to improve query speeds by 40%.

    Key Deliverables:
    - API v2 release with improved documentation
    - Mobile app performance optimization
    - Admin dashboard redesign

    Q2 2025 - Feature Expansion
    Launch AI-powered recommendation engine to improve user engagement. Integration with third-party
    services will expand platform capabilities significantly.

    Key Deliverables:
    - AI recommendation system
    - Webhook support for integrations
    - Advanced analytics dashboard
    - Multi-language support (5 languages)

    Q3 2025 - Enterprise Focus
    Target enterprise customers with advanced features and compliance certifications.
    SOC 2 Type II certification will enhance security positioning.

    Key Deliverables:
    - Enterprise SSO implementation
    - Advanced audit logging
    - Data residency options
    - Dedicated account management

    Q4 2025 - Global Expansion
    Expand to international markets with localized features and support. Establish regional hubs
    in Europe and Asia-Pacific.

    Key Deliverables:
    - Regional data centers
    - 24/7 multilingual support
    - Local compliance certifications
    - Regional marketing campaigns

    Technical Debt Reduction: Allocate 20% of engineering capacity for tech debt reduction throughout 2025.
    `,
  },
  {
    filename: 'marketing-strategy.txt',
    project_name: 'Marketing',
    tags: ['marketing', 'strategy', 'campaigns'],
    content: `
    Marketing Strategy 2025

    Brand Positioning
    Position our company as the leading innovation-driven solution provider in the industry.
    Focus messaging on reliability, scalability, and customer success stories.

    Target Segments
    1. Mid-market enterprises (100-5000 employees) - $10M annual target
    2. Startups and growth companies - $5M annual target
    3. Enterprise customers (5000+ employees) - $15M annual target

    Digital Marketing
    Increase digital presence through content marketing, SEO optimization, and social media engagement.
    Allocate $2M for paid advertising across Google, LinkedIn, and industry publications.

    Content Strategy:
    - Weekly blog posts on industry trends
    - Monthly white papers
    - Quarterly webinars
    - Case studies featuring top customers

    Event Marketing
    Participate in 15 major industry conferences. Host 3 regional customer summits.
    Sponsor 5 hackathons to build developer community.

    Partnership Strategy
    Establish strategic partnerships with complementary vendors. Co-marketing with 10 partners
    to expand reach and credibility. Revenue share model targeting $3M in partner-generated revenue.

    Customer Success
    Implement customer advocacy program with 50 power users. Create referral incentive program
    targeting 30% of new customer acquisition from referrals.

    Budget Allocation:
    - Digital marketing: $3M (40%)
    - Events: $2M (27%)
    - Content: $1M (13%)
    - Partnerships: $1M (13%)
    - Community: $0.5M (7%)
    `,
  },
];

export async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('Starting database seeding...');

    for (const doc of sampleDocuments) {
      console.log(`\nProcessing document: ${doc.filename}`);

      const document = new Document({
        filename: doc.filename,
        project_name: doc.project_name,
        tags: doc.tags,
        file_size: doc.content.length,
        upload_date: new Date(),
        processed: true,
      });

      const savedDoc = await document.save();
      console.log(`Created document with ID: ${savedDoc._id}`);

      const chunks = splitIntoChunks(doc.content, 300, 600);
      const chunkRecords = chunks.map((chunk, index) => ({
        document_id: savedDoc._id,
        chunk_index: index,
        content: chunk.trim(),
        embedding: generateDeterministicEmbedding(chunk.trim()),
        token_count: chunk.split(/\s+/).length,
      }));

      const insertedChunks = await Chunk.insertMany(chunkRecords);
      console.log(`Created ${insertedChunks.length} chunks for document`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    await disconnectFromMongoDB();
    return { success: true, message: 'All sample documents have been seeded' };
  } catch (error) {
    console.error('❌ Error during database seeding:', error.message);
    await disconnectFromMongoDB();
    throw error;
  }
}

function splitIntoChunks(text, minSize = 300, maxSize = 600) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  if (sentences.length === 0) {
    return [text];
  }

  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    if ((currentChunk + ' ' + trimmedSentence).split(/\s+/).length <= maxSize) {
      currentChunk += ' ' + trimmedSentence;
    } else {
      if (currentChunk.split(/\s+/).length >= minSize) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk.split(/\s+/).length >= minSize) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

seedDatabase()
  .then(() => {
    console.log('Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
