import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Project from './models/Project.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sampleOpportunities = [
  // 1. Web Development
  {
    title: '[DEMO Opportunity] High-Performance Real-Time Analytics Dashboard UI',
    description:
      'We require a senior frontend architect to build a high-throughput monitoring dashboard using React 18, Vite, TailwindCSS, and WebSocket streaming. Must support dark mode, responsive chart widgets, and real-time metric cards. (This is a verified demonstration marketplace listing for testing).',
    category: 'Web Development',
    skillsRequired: ['React', 'TypeScript', 'TailwindCSS', 'WebSockets', 'Chart.js'],
    budget: 1850,
    minBudget: 1500,
    maxBudget: 2200,
    deadlineDays: 21,
    status: 'Open',
    isDemo: true,
  },
  {
    title: '[DEMO Opportunity] Headless Shopify E-Commerce Storefront with Next.js',
    description:
      'Looking for an expert React/Next.js developer to construct a high-converting, lightning-fast headless e-commerce store with Shopify Storefront GraphQL API, Algolia InstantSearch, and Stripe test checkout. (Demonstration project).',
    category: 'Web Development',
    skillsRequired: ['Next.js', 'React', 'GraphQL', 'Shopify Storefront API', 'Stripe'],
    budget: 2400,
    minBudget: 2000,
    maxBudget: 3000,
    deadlineDays: 30,
    status: 'Open',
    isDemo: true,
  },

  // 2. Mobile App Development
  {
    title: '[DEMO Opportunity] Cross-Platform React Native Fitness & Habit Tracking App',
    description:
      'Seeking a skilled React Native / Expo developer to develop iOS and Android builds for a modern fitness tracker. Features include step count sync with Apple Health / Google Fit, streak calendar, offline storage, and push notifications. (Demo listing).',
    category: 'Mobile App Development',
    skillsRequired: ['React Native', 'Expo', 'iOS', 'Android', 'Redux Toolkit', 'Mobile UI'],
    budget: 2800,
    minBudget: 2500,
    maxBudget: 3500,
    deadlineDays: 35,
    status: 'Open',
    isDemo: true,
  },
  {
    title: '[DEMO Opportunity] Flutter On-Demand Courier & Delivery Tracking App',
    description:
      'Develop a crisp mobile application in Flutter for riders and customers. Includes real-time geolocation tracking with Google Maps SDK, push alerts, and order milestone tracking. (Demo listing).',
    category: 'Mobile App Development',
    skillsRequired: ['Flutter', 'Dart', 'Google Maps API', 'Firebase', 'State Management'],
    budget: 1950,
    minBudget: 1800,
    maxBudget: 2500,
    deadlineDays: 25,
    status: 'Open',
    isDemo: true,
  },

  // 3. UI/UX Design
  {
    title: '[DEMO Opportunity] Enterprise SaaS Design System & Figma Component Library',
    description:
      'Need an elite product designer to audit and re-architect our multi-brand Figma design system. Deliverables include tokenized color palettes, typography scales, accessibility (WCAG AA) compliance, and responsive auto-layout components. (Demo listing).',
    category: 'UI/UX Design',
    skillsRequired: ['Figma', 'UI/UX Design', 'Design Systems', 'Prototyping', 'User Research'],
    budget: 1600,
    minBudget: 1400,
    maxBudget: 2000,
    deadlineDays: 18,
    status: 'Open',
    isDemo: true,
  },
  {
    title: '[DEMO Opportunity] Mobile Neobank Wallet UX Wireframes & User Journey Flow',
    description:
      'Create high-fidelity interactive Figma prototypes for an intuitive mobile banking app. Focus on seamless peer-to-peer transfers, biometric authorization flows, and card security controls. (Demo listing).',
    category: 'UI/UX Design',
    skillsRequired: ['UI/UX Design', 'Figma', 'Wireframing', 'Mobile UX', 'Interaction Design'],
    budget: 1350,
    minBudget: 1200,
    maxBudget: 1800,
    deadlineDays: 14,
    status: 'Open',
    isDemo: true,
  },

  // 4. Graphic Design
  {
    title: '[DEMO Opportunity] Complete Brand Identity & Vector Asset Kit for Tech Startup',
    description:
      'We are rebranding our B2B tech startup and need an exceptional visual identity. Package includes vector logo variations, brand guideline book, business cards, pitch deck template, and social media banners. (Demo listing).',
    category: 'Graphic Design',
    skillsRequired: ['Adobe Illustrator', 'Graphic Design', 'Brand Identity', 'Logo Design', 'Photoshop'],
    budget: 1100,
    minBudget: 900,
    maxBudget: 1500,
    deadlineDays: 14,
    status: 'Open',
    isDemo: true,
  },
  {
    title: '[DEMO Opportunity] Custom 3D Isometric Illustrations for SaaS Landing Page',
    description:
      'Design 5 bespoke 3D isometric scenes in Blender or Illustrator for our hero banner and solution pillars. Must reflect our modern dark navy and vibrant accent aesthetic. (Demo listing).',
    category: 'Graphic Design',
    skillsRequired: ['Graphic Design', 'Illustration', 'Blender', 'Vector Art', 'Visual Design'],
    budget: 950,
    minBudget: 800,
    maxBudget: 1300,
    deadlineDays: 12,
    status: 'Open',
    isDemo: true,
  },

  // 5. Data Analytics
  {
    title: '[DEMO Opportunity] Automated BigQuery & Looker Studio Executive KPI Dashboard',
    description:
      'Connect multiple data pipelines (Google Analytics 4, Stripe, and PostgreSQL) into Google BigQuery, build automated transformation views in dbt or SQL, and produce live Looker Studio executive dashboards. (Demo listing).',
    category: 'Data Analytics',
    skillsRequired: ['SQL', 'Data Analytics', 'Google BigQuery', 'Looker Studio', 'Python', 'ETL'],
    budget: 1750,
    minBudget: 1500,
    maxBudget: 2400,
    deadlineDays: 20,
    status: 'Open',
    isDemo: true,
  },
  {
    title: '[DEMO Opportunity] Customer Churn Prediction Model & PowerBI Visualization',
    description:
      'Analyze historical subscriber event logs using Python (Pandas, Scikit-Learn) to identify key churn drivers and build interactive PowerBI reports with cohort retention curves. (Demo listing).',
    category: 'Data Analytics',
    skillsRequired: ['Python', 'Data Analytics', 'PowerBI', 'Pandas', 'Predictive Modeling'],
    budget: 1400,
    minBudget: 1200,
    maxBudget: 1900,
    deadlineDays: 16,
    status: 'Open',
    isDemo: true,
  },

  // 6. Artificial Intelligence & Machine Learning
  {
    title: '[DEMO Opportunity] Multi-Document RAG Knowledge Base with LangChain & OpenAI',
    description:
      'Build a robust Retrieval-Augmented Generation (RAG) backend utilizing LangChain, Pinecone / Chroma vector database, and OpenAI embeddings to enable natural-language Q&A across thousands of enterprise technical PDF manuals. (Demo listing).',
    category: 'Artificial Intelligence & Machine Learning',
    skillsRequired: ['Python', 'LangChain', 'OpenAI API', 'Vector Databases', 'FastAPI', 'RAG'],
    budget: 2600,
    minBudget: 2200,
    maxBudget: 3400,
    deadlineDays: 28,
    status: 'Open',
    isDemo: true,
  },
  {
    title: '[DEMO Opportunity] Computer Vision Object Detection & Inventory Tallying Model',
    description:
      'Train and optimize a lightweight YOLOv8 / PyTorch model to detect retail warehouse stock boxes from camera feeds, running on edge Raspberry Pi / Jetson devices with ONNX runtime. (Demo listing).',
    category: 'Artificial Intelligence & Machine Learning',
    skillsRequired: ['Computer Vision', 'PyTorch', 'YOLOv8', 'OpenCV', 'Deep Learning'],
    budget: 2200,
    minBudget: 1900,
    maxBudget: 2900,
    deadlineDays: 24,
    status: 'Open',
    isDemo: true,
  },

  // 7. Content Writing
  {
    title: '[DEMO Opportunity] Comprehensive Technical Blog Series & API Developer Guides',
    description:
      'Looking for a seasoned developer advocate or technical writer to produce 6 in-depth developer tutorials (1,500 words each) covering microservices architecture, JWT authentication best practices, and MongoDB aggregation pipelines. (Demo listing).',
    category: 'Content Writing',
    skillsRequired: ['Technical Writing', 'Content Writing', 'API Documentation', 'Developer Guides', 'SEO'],
    budget: 900,
    minBudget: 750,
    maxBudget: 1200,
    deadlineDays: 15,
    status: 'Open',
    isDemo: true,
  },
  {
    title: '[DEMO Opportunity] SEO-Optimized Product Comparison & Case Study Articles',
    description:
      'Write 4 high-converting enterprise SaaS case studies and 4 competitor comparison teardowns targeting high-intent organic search queries. (Demo listing).',
    category: 'Content Writing',
    skillsRequired: ['Content Writing', 'SEO Copywriting', 'SaaS Marketing', 'Case Studies'],
    budget: 850,
    minBudget: 700,
    maxBudget: 1100,
    deadlineDays: 14,
    status: 'Open',
    isDemo: true,
  },

  // 8. Digital Marketing
  {
    title: '[DEMO Opportunity] Full-Funnel Google Search & LinkedIn Paid Acquisition Campaign',
    description:
      'Develop, configure, and manage high-intent B2B lead generation campaigns on Google Ads and LinkedIn Campaign Manager. Includes conversion tracking setup, keyword clustering, ad copy A/B tests, and weekly ROAS optimization. (Demo listing).',
    category: 'Digital Marketing',
    skillsRequired: ['Google Ads', 'LinkedIn Ads', 'Digital Marketing', 'PPC', 'Analytics', 'Conversion Optimization'],
    budget: 1500,
    minBudget: 1200,
    maxBudget: 2000,
    deadlineDays: 30,
    status: 'Open',
    isDemo: true,
  },
  {
    title: '[DEMO Opportunity] Technical SEO Audit & Core Web Vitals Remediation Plan',
    description:
      'Perform an exhaustive technical SEO crawl on an enterprise e-commerce platform. Diagnose canonical loops, indexation bloat, structured schema markup, and LCP/INP performance bottlenecks with a prioritized engineering backlog. (Demo listing).',
    category: 'Digital Marketing',
    skillsRequired: ['Technical SEO', 'Digital Marketing', 'Core Web Vitals', 'Google Search Console', 'Ahrefs'],
    budget: 1100,
    minBudget: 900,
    maxBudget: 1500,
    deadlineDays: 14,
    status: 'Open',
    isDemo: true,
  },

  // 9. DevOps & Cloud
  {
    title: '[DEMO Opportunity] Automated CI/CD Pipeline & Kubernetes Deployment on AWS EKS',
    description:
      'Architect and provision an automated GitOps deployment workflow using GitHub Actions, Terraform, AWS EKS, and ArgoCD. Deliverables include zero-downtime rolling deploys, Helm charts, and Prometheus/Grafana monitoring clusters. (Demo listing).',
    category: 'DevOps & Cloud',
    skillsRequired: ['AWS', 'Kubernetes', 'Terraform', 'GitHub Actions', 'Docker', 'DevOps & Cloud'],
    budget: 2700,
    minBudget: 2300,
    maxBudget: 3500,
    deadlineDays: 25,
    status: 'Open',
    isDemo: true,
  },
  {
    title: '[DEMO Opportunity] Secure Dockerization & Multi-Region Cloudflare CDN Setup',
    description:
      'Containerize existing Node.js microservices with multi-stage Alpine Docker builds, set up Cloudflare SSL/WAF rules, automated database backups to S3, and SSL termination. (Demo listing).',
    category: 'DevOps & Cloud',
    skillsRequired: ['Docker', 'DevOps & Cloud', 'Cloudflare', 'Linux', 'Bash', 'Security'],
    budget: 1300,
    minBudget: 1000,
    maxBudget: 1800,
    deadlineDays: 14,
    status: 'Open',
    isDemo: true,
  },

  // 10. Video Editing
  {
    title: '[DEMO Opportunity] High-Energy Product Explainer Video & Motion Graphics',
    description:
      'Produce a polished 60-second animated SaaS explainer video with custom 2D kinetic typography, animated UI mockups, and professional voiceover sync. Final deliverable formatted for landing page hero and YouTube. (Demo listing).',
    category: 'Video Editing',
    skillsRequired: ['Adobe Premiere Pro', 'After Effects', 'Motion Graphics', 'Video Editing', 'Sound Design'],
    budget: 1250,
    minBudget: 1000,
    maxBudget: 1700,
    deadlineDays: 14,
    status: 'Open',
    isDemo: true,
  },
  {
    title: '[DEMO Opportunity] Social Media Short-Form Video Campaign (Reels / TikTok / Shorts)',
    description:
      'Edit 15 engaging, viral short-form clips from our podcast and developer conference footage. Includes dynamic captions, sound effects, B-roll overlays, and color grading. (Demo listing).',
    category: 'Video Editing',
    skillsRequired: ['Video Editing', 'Short-Form Content', 'CapCut Pro', 'After Effects', 'Color Grading'],
    budget: 950,
    minBudget: 800,
    maxBudget: 1400,
    deadlineDays: 12,
    status: 'Open',
    isDemo: true,
  },
];

export const seedDiverseProjects = async () => {
  console.log('===============================================================');
  console.log('🌱 WORKHIVE: SEEDING DIVERSE JOB MARKETPLACE OPPORTUNITIES');
  console.log('===============================================================\n');

  await connectDB();

  // 1. Fetch available Client users in MongoDB to distribute ownership
  const clients = await User.find({ role: 'Client' }).sort({ createdAt: 1 });
  if (clients.length === 0) {
    console.error('❌ No Client users found in MongoDB! Creating default demo client.');
    const demoClient = await User.create({
      name: 'Apex Cloud Innovations',
      email: 'client_demo@workhive.test',
      password: 'DemoPassword123!',
      role: 'Client',
      profileImage: 'https://api.dicebear.com/7.x/initials/svg?seed=ApexCloud',
    });
    clients.push(demoClient);
  }

  console.log(`Found ${clients.length} client account(s) in MongoDB:`);
  clients.forEach((c, idx) => console.log(`   ${idx + 1}. ${c.name} (${c.email})`));

  let insertedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < sampleOpportunities.length; i++) {
    const opp = sampleOpportunities[i];

    // Check if project with this exact title already exists (Safe idempotent strategy)
    const existing = await Project.findOne({ title: opp.title });
    if (existing) {
      skippedCount++;
      continue;
    }

    // Distribute client ownership cyclically among the available client accounts
    const assignedClient = clients[i % clients.length];

    await Project.create({
      client: assignedClient._id,
      title: opp.title,
      description: opp.description,
      category: opp.category,
      skillsRequired: opp.skillsRequired,
      budget: opp.budget,
      minBudget: opp.minBudget,
      maxBudget: opp.maxBudget,
      deadlineDays: opp.deadlineDays,
      status: opp.status,
      isDemo: true,
    });

    insertedCount++;
    console.log(`   + Added: [${opp.category}] ${opp.title.slice(0, 45)}... (Client: ${assignedClient.name})`);
  }

  console.log(`\n✅ Seeding Summary: ${insertedCount} new project(s) added, ${skippedCount} existing project(s) preserved.`);

  // Category distribution tally
  const categoriesTally = await Project.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  console.log('\n📊 Current Category Distribution in MongoDB Atlas:');
  categoriesTally.forEach((cat) => {
    console.log(`   • ${cat._id.padEnd(42)}: ${cat.count} project(s)`);
  });

  return { insertedCount, skippedCount, categoriesTally };
};

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDiverseProjects()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seeding Error:', err);
      await mongoose.disconnect();
      process.exit(1);
    });
}

