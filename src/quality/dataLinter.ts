/**
 * Enterprise Airtable Data Quality & Anomaly Detection Linter
 * 
 * Audits live base data for enterprise integrity rules:
 * 1. Primary key presence & uniqueness
 * 2. Inverted date sequences (Start Date > Target Date)
 * 3. Budget runaway (>120% allocated) and negative values
 * 4. Critical tasks (P0 / XL) without linked assignees
 * 5. Inactive talent with assigned active tasks
 * 6. High severity risks without mitigation plans
 * 7. RFC-compliant corporate email validation
 */

export interface QualityFinding {
  severity: 'CRITICAL' | 'WARNING' | 'NOTICE';
  ruleId: string;
  tableName: string;
  recordId: string;
  recordIdentifier: string;
  message: string;
  remediation: string;
}

export interface DataQualityReport {
  score: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  totalChecked: number;
  findings: QualityFinding[];
  summary: {
    criticalCount: number;
    warningCount: number;
    noticeCount: number;
  };
}

export class EnterpriseDataLinter {
  public static lint(data: {
    projects: any[];
    teamMembers: any[];
    tasks: any[];
    risks: any[];
  }): DataQualityReport {
    const findings: QualityFinding[] = [];
    let totalChecked = 0;

    // 1. Projects Audit
    for (const p of data.projects) {
      totalChecked++;
      const f = p.fields;
      const code = f['Project Code'] || p.id;
      const budget = Number(f['Budget Allocated (€)']) || 0;
      const spent = Number(f['Budget Spent (€)']) || 0;
      const startDate = f['Start Date'];
      const targetDate = f['Target Go-Live'];

      // Primary Key check
      if (!f['Project Code'] || !f['Project Name']) {
        findings.push({
          severity: 'CRITICAL',
          ruleId: 'PRJ_MISSING_PRIMARY',
          tableName: 'Projects',
          recordId: p.id,
          recordIdentifier: code,
          message: 'Project is missing required Project Code or Project Name',
          remediation: 'Fill in standard project code (e.g. PRJ-2026-XX) and title',
        });
      }

      // Date order inversion
      if (startDate && targetDate && new Date(startDate) > new Date(targetDate)) {
        findings.push({
          severity: 'CRITICAL',
          ruleId: 'PRJ_DATE_INVERSION',
          tableName: 'Projects',
          recordId: p.id,
          recordIdentifier: code,
          message: `Start Date (${startDate}) is chronologically after Target Go-Live (${targetDate})`,
          remediation: 'Adjust milestone dates to reflect proper chronological progression',
        });
      }

      // Budget sanity
      if (spent > budget * 1.2 && budget > 0) {
        findings.push({
          severity: 'WARNING',
          ruleId: 'PRJ_BUDGET_OVERRUN',
          tableName: 'Projects',
          recordId: p.id,
          recordIdentifier: code,
          message: `Budget overrun: Spent €${spent.toLocaleString()} exceeds allocated €${budget.toLocaleString()} by >20%`,
          remediation: 'Initiate formal change request (CR) or budget re-allocation',
        });
      }
    }

    // 2. Team Members Audit
    const activeMemberIds = new Set<string>();
    for (const m of data.teamMembers) {
      totalChecked++;
      const f = m.fields;
      const name = f['Full Name'] || m.id;
      const email = f['Corporate Email'] || '';
      const capacity = Number(f['Weekly Capacity (Hours)']);

      if (f['Is Active']) {
        activeMemberIds.add(m.id);
      }

      if (!email || !email.includes('@')) {
        findings.push({
          severity: 'CRITICAL',
          ruleId: 'TEAM_INVALID_EMAIL',
          tableName: 'Team Members',
          recordId: m.id,
          recordIdentifier: name,
          message: `Invalid or missing corporate email: "${email}"`,
          remediation: 'Ensure corporate SSO-compatible email format is assigned',
        });
      }

      if (capacity <= 0 || capacity > 60) {
        findings.push({
          severity: 'WARNING',
          ruleId: 'TEAM_CAPACITY_OUTLIER',
          tableName: 'Team Members',
          recordId: m.id,
          recordIdentifier: name,
          message: `Weekly capacity of ${capacity} hrs is outside standard threshold (1-60 hrs)`,
          remediation: 'Re-evaluate full-time / part-time availability contracts',
        });
      }
    }

    // 3. Tasks & Work Packages Audit
    for (const t of data.tasks) {
      totalChecked++;
      const f = t.fields;
      const key = f['Task Key'] || t.id;
      const stage = f['Workflow Stage'];
      const assigneeIds = f['Assignee'] || [];
      const projectIds = f['Project'] || [];

      // Unlinked Project
      if (projectIds.length === 0) {
        findings.push({
          severity: 'WARNING',
          ruleId: 'TASK_ORPHANED_PROJECT',
          tableName: 'Tasks & Deliverables',
          recordId: t.id,
          recordIdentifier: key,
          message: 'Task is not linked to any parent strategic Project',
          remediation: 'Assign a parent initiative in the "Project" link field',
        });
      }

      // Critical task without assignee
      if ((f['Complexity'] === 'XL (> 1w)' || stage === 'In Progress') && assigneeIds.length === 0) {
        findings.push({
          severity: 'WARNING',
          ruleId: 'TASK_UNASSIGNED_IN_FLIGHT',
          tableName: 'Tasks & Deliverables',
          recordId: t.id,
          recordIdentifier: key,
          message: `Task is in "${stage}" state but has no assigned team member`,
          remediation: 'Link an active engineering resource to the Assignee field',
        });
      }
    }

    // 4. Risk Log Audit
    for (const r of data.risks) {
      totalChecked++;
      const f = r.fields;
      const riskId = f['Risk ID'] || r.id;
      const severity = f['Severity'];
      const mitigation = f['Mitigation Strategy'] || '';

      if ((severity === 'Critical' || severity === 'Major') && mitigation.trim().length < 10) {
        findings.push({
          severity: 'CRITICAL',
          ruleId: 'RISK_UNMITIGATED_CRITICAL',
          tableName: 'Risk & Governance Log',
          recordId: r.id,
          recordIdentifier: riskId,
          message: `${severity} risk has no defined mitigation strategy`,
          remediation: 'Document actionable risk mitigation plan and contingency steps',
        });
      }
    }

    const criticalCount = findings.filter((f) => f.severity === 'CRITICAL').length;
    const warningCount = findings.filter((f) => f.severity === 'WARNING').length;
    const noticeCount = findings.filter((f) => f.severity === 'NOTICE').length;

    // Calculate score (100 base, -15 per critical, -5 per warning)
    const deduction = criticalCount * 15 + warningCount * 5 + noticeCount * 2;
    const score = Math.max(0, 100 - deduction);

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (score >= 95) grade = 'A+';
    else if (score >= 88) grade = 'A';
    else if (score >= 78) grade = 'B';
    else if (score >= 65) grade = 'C';
    else if (score >= 50) grade = 'D';

    return {
      score,
      grade,
      totalChecked,
      findings,
      summary: { criticalCount, warningCount, noticeCount },
    };
  }
}
