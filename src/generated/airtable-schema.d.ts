/**
 * Auto-generated Airtable TypeScript Type Definitions
 * Generated: 2026-10-26T23:45:32.128Z
 */

export interface AirtableRecordProjects {
  id: string;
  fields: {
    'Project Code'?: string;
    'Project Name'?: string;
    'Status'?: string;
    'Priority'?: string;
    'Budget Allocated (€)'?: number;
    'Budget Spent (€)'?: number;
    'Start Date'?: string;
    'Target Go-Live'?: string;
    'Executive Sponsor'?: string;
    'Strategic Objectives'?: string;
  };
}

export interface AirtableRecordTeamMembers {
  id: string;
  fields: {
    'Full Name'?: string;
    'Corporate Email'?: string;
    'Department'?: string;
    'Role Level'?: string;
    'Weekly Capacity (Hours)'?: number;
    'Hourly Billing Rate (€)'?: number;
    'Primary Skillset'?: string[];
    'Is Active'?: boolean;
  };
}

export interface AirtableRecordTasksDeliverables {
  id: string;
  fields: {
    'Task Key'?: string;
    'Task Title'?: string;
    'Workflow Stage'?: string;
    'Estimated Hours'?: number;
    'Actual Hours'?: number;
    'Due Date'?: string;
    'Complexity'?: string;
    'Technical Notes'?: string;
  };
}

export interface AirtableRecordRiskGovernanceLog {
  id: string;
  fields: {
    'Risk ID'?: string;
    'Risk Statement'?: string;
    'Severity'?: string;
    'Likelihood'?: string;
    'Mitigation Strategy'?: string;
    'Status'?: string;
  };
}

export interface AirtableRecordAuditTrailCDCLogs {
  id: string;
  fields: {
    'Event ID'?: string;
    'Timestamp'?: string;
    'Source'?: string;
    'Action'?: string;
    'Target Table'?: string;
    'Record Reference'?: string;
    'Payload Snapshot'?: string;
  };
}

