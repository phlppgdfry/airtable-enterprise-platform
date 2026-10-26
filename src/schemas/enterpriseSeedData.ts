/**
 * Enterprise Realistic Showcase Seed Data
 * 
 * Provides rich, production-grade records demonstrating real enterprise initiatives:
 * - AI Transformation Platform
 * - Multi-Region Cloud Migration
 * - Event-Driven ERP Synchronization
 * - Staff Allocation & Skillset Matrices
 */

export const SEED_PROJECTS = [
  {
    fields: {
      'Project Code': 'PRJ-2026-AI-01',
      'Project Name': 'Enterprise AI Agent Orchestration Hub',
      'Status': 'Execution',
      'Priority': 'P0 - Mission Critical',
      'Budget Allocated (€)': 450000.0,
      'Budget Spent (€)': 185000.0,
      'Start Date': '2026-01-15',
      'Target Go-Live': '2026-11-30',
      'Executive Sponsor': 'Chief Technology Officer (CTO)',
      'Strategic Objectives':
        'Deliver an enterprise-wide multi-agent orchestration layer connecting CRM, ERP, and customer intelligence pipelines with sub-second retrieval latency.',
    },
  },
  {
    fields: {
      'Project Code': 'PRJ-2026-DATA-02',
      'Project Name': 'Airtable-to-Snowflake Real-Time CDC Pipeline',
      'Status': 'Testing & QA',
      'Priority': 'P1 - High',
      'Budget Allocated (€)': 220000.0,
      'Budget Spent (€)': 195000.0,
      'Start Date': '2026-03-01',
      'Target Go-Live': '2026-12-15',
      'Executive Sponsor': 'Head of Enterprise Architecture',
      'Strategic Objectives':
        'Establish automated Webhook CDC streaming from Airtable into Snowflake data lakehouse with zero-loss transaction guarantees.',
    },
  },
  {
    fields: {
      'Project Code': 'PRJ-2026-OPS-03',
      'Project Name': 'Global Digital Transformation & FieldOps 360',
      'Status': 'Execution',
      'Priority': 'P1 - High',
      'Budget Allocated (€)': 680000.0,
      'Budget Spent (€)': 320000.0,
      'Start Date': '2026-02-01',
      'Target Go-Live': '2027-02-28',
      'Executive Sponsor': 'VP Global Operations',
      'Strategic Objectives':
        'Digitalize field engineer workflows, dispatch management, and asset inspection reports using Airtable custom extensions and offline-capable mobile interfaces.',
    },
  },
  {
    fields: {
      'Project Code': 'PRJ-2026-SEC-04',
      'Project Name': 'ISO 27001 & SOC 2 Type II Compliance Modernization',
      'Status': 'Planning',
      'Priority': 'P0 - Mission Critical',
      'Budget Allocated (€)': 310000.0,
      'Budget Spent (€)': 42000.0,
      'Start Date': '2026-06-01',
      'Target Go-Live': '2027-04-30',
      'Executive Sponsor': 'Chief Information Security Officer (CISO)',
      'Strategic Objectives':
        'Automate continuous audit log evidence collection, role-based field masking, and credential rotation across all SaaS and internal databases.',
    },
  },
];

export const SEED_TEAM = [
  {
    fields: {
      'Full Name': 'Philippe Godfroy',
      'Corporate Email': 'philippe.godfroy@enterprise-hub.com',
      'Department': 'Enterprise Architecture',
      'Role Level': 'Principal / Lead',
      'Weekly Capacity (Hours)': 40.0,
      'Hourly Billing Rate (€)': 185.0,
      'Primary Skillset': [
        'Enterprise Architecture',
        'TypeScript / Node.js',
        'Airtable Extensions SDK',
        'Event-Driven Webhooks',
        'AI / LLM Integration',
      ],
      'Is Active': true,
    },
  },
  {
    fields: {
      'Full Name': 'Elena Vance',
      'Corporate Email': 'elena.vance@enterprise-hub.com',
      'Department': 'Platform Engineering',
      'Role Level': 'Senior Staff',
      'Weekly Capacity (Hours)': 36.0,
      'Hourly Billing Rate (€)': 160.0,
      'Primary Skillset': [
        'TypeScript / Node.js',
        'PostgreSQL / SQL',
        'Cloud Infrastructure (AWS/GCP/Azure)',
      ],
      'Is Active': true,
    },
  },
  {
    fields: {
      'Full Name': 'Marcus Chen',
      'Corporate Email': 'marcus.chen@enterprise-hub.com',
      'Department': 'Data Architecture',
      'Role Level': 'Senior',
      'Weekly Capacity (Hours)': 40.0,
      'Hourly Billing Rate (€)': 145.0,
      'Primary Skillset': [
        'PostgreSQL / SQL',
        'Event-Driven Webhooks',
        'Cloud Infrastructure (AWS/GCP/Azure)',
      ],
      'Is Active': true,
    },
  },
  {
    fields: {
      'Full Name': 'Sophie Laurent',
      'Corporate Email': 'sophie.laurent@enterprise-hub.com',
      'Department': 'Product Management',
      'Role Level': 'Senior Staff',
      'Weekly Capacity (Hours)': 40.0,
      'Hourly Billing Rate (€)': 150.0,
      'Primary Skillset': ['Enterprise Architecture', 'React / Next.js'],
      'Is Active': true,
    },
  },
];

export const SEED_TASKS = [
  {
    fields: {
      'Task Key': 'TSK-AI-001',
      'Task Title': 'Design Event-Driven Webhook Ingestion Buffer',
      'Workflow Stage': 'Done',
      'Estimated Hours': 32.0,
      'Actual Hours': 28.5,
      'Due Date': '2026-04-10',
      'Complexity': 'L (3-5d)',
      'Technical Notes':
        'Implemented HMAC signature verification, idempotent transaction deduplication, and cursor-based payload polling.',
    },
  },
  {
    fields: {
      'Task Key': 'TSK-AI-002',
      'Task Title': 'Develop Custom React Extensions Resource Matrix',
      'Workflow Stage': 'In Progress',
      'Estimated Hours': 45.0,
      'Actual Hours': 38.0,
      'Due Date': '2026-11-15',
      'Complexity': 'XL (> 1w)',
      'Technical Notes':
        'Utilizing @airtable/blocks SDK, useWatchable hooks, globalConfig settings, and interactive Gantt-style capacity matrix.',
    },
  },
  {
    fields: {
      'Task Key': 'TSK-DATA-003',
      'Task Title': 'Metadata API Schema Migration Script',
      'Workflow Stage': 'Done',
      'Estimated Hours': 24.0,
      'Actual Hours': 21.0,
      'Due Date': '2026-05-18',
      'Complexity': 'M (1-2d)',
      'Technical Notes':
        'Automated declarative table and field DDL sync with token bucket rate-limiter.',
    },
  },
  {
    fields: {
      'Task Key': 'TSK-SEC-004',
      'Task Title': 'Audit Trail & Immutable Change Log Engine',
      'Workflow Stage': 'In Progress',
      'Estimated Hours': 36.0,
      'Actual Hours': 22.0,
      'Due Date': '2026-11-20',
      'Complexity': 'L (3-5d)',
      'Technical Notes':
        'Automatic CDC diffing capturing previous vs current cell values for regulatory compliance.',
    },
  },
];

export const SEED_RISKS = [
  {
    fields: {
      'Risk ID': 'RSK-001',
      'Risk Statement': 'Airtable 5 req/sec API rate limit breach during peak batch synchronization',
      'Severity': 'Major',
      'Likelihood': 'Low',
      'Mitigation Strategy':
        'Engineered token-bucket leaky queue with exponential backoff and jitter; batching mutations into 10-record chunks.',
      'Status': 'Resolved',
    },
  },
  {
    fields: {
      'Risk ID': 'RSK-002',
      'Risk Statement': 'Webhook 7-day expiration causing dropped event notifications',
      'Severity': 'Critical',
      'Likelihood': 'Medium',
      'Mitigation Strategy':
        'Scheduled automatic heartbeat cron job calling /refresh endpoint every 3 days.',
      'Status': 'Resolved',
    },
  },
];

export const SEED_AUDIT = [
  {
    fields: {
      'Event ID': 'EVT-INIT-001',
      'Timestamp': new Date().toISOString(),
      'Source': 'CLI Migration',
      'Action': 'INSERT',
      'Target Table': 'Projects',
      'Record Reference': 'PRJ-2026-AI-01',
      'Payload Snapshot': JSON.stringify({
        action: 'Initial Schema & Seed provisioning',
        workspace: 'wsp3p16CPCotJVZdX',
        author: 'Philippe Godfroy',
      }),
    },
  },
];
