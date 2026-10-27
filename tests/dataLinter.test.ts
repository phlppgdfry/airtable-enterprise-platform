import { describe, it, expect } from 'vitest';
import { EnterpriseDataLinter } from '../src/quality/dataLinter.js';

describe('EnterpriseDataLinter', () => {
  it('detects inverted date ranges (Start Date > Target Date)', () => {
    const data = {
      projects: [
        {
          id: 'rec1',
          fields: {
            'Project Code': 'PRJ-ERR',
            'Project Name': 'Erroneous Dates',
            'Start Date': '2027-01-01',
            'Target Go-Live': '2026-01-01',
          },
        },
      ],
      teamMembers: [],
      tasks: [],
      risks: [],
    };

    const report = EnterpriseDataLinter.lint(data);
    expect(report.summary.criticalCount).toBeGreaterThanOrEqual(1);
    expect(report.findings.some((f) => f.ruleId === 'PRJ_DATE_INVERSION')).toBe(true);
    expect(report.grade).not.toBe('A+');
  });

  it('detects unmitigated critical risks', () => {
    const data = {
      projects: [],
      teamMembers: [],
      tasks: [],
      risks: [
        {
          id: 'recRisk',
          fields: {
            'Risk ID': 'RSK-999',
            'Severity': 'Critical',
            'Mitigation Strategy': '',
          },
        },
      ],
    };

    const report = EnterpriseDataLinter.lint(data);
    expect(report.findings.some((f) => f.ruleId === 'RISK_UNMITIGATED_CRITICAL')).toBe(true);
  });

  it('awards grade A+ when data has zero violations', () => {
    const cleanData = {
      projects: [
        {
          id: 'rec1',
          fields: {
            'Project Code': 'PRJ-101',
            'Project Name': 'Clean Project',
            'Start Date': '2026-01-01',
            'Target Go-Live': '2026-06-01',
            'Budget Allocated (€)': 100000,
            'Budget Spent (€)': 50000,
          },
        },
      ],
      teamMembers: [
        {
          id: 'recM1',
          fields: {
            'Full Name': 'Alice Dev',
            'Corporate Email': 'alice@enterprise-hub.com',
            'Weekly Capacity (Hours)': 40,
            'Is Active': true,
          },
        },
      ],
      tasks: [
        {
          id: 'recT1',
          fields: {
            'Task Key': 'TSK-101',
            'Project': ['rec1'],
            'Assignee': ['recM1'],
          },
        },
      ],
      risks: [
        {
          id: 'recR1',
          fields: {
            'Risk ID': 'RSK-101',
            'Severity': 'Critical',
            'Mitigation Strategy': 'Multi-region failover cluster with automated load balancer rerouting',
          },
        },
      ],
    };

    const report = EnterpriseDataLinter.lint(cleanData);
    expect(report.findings).toHaveLength(0);
    expect(report.grade).toBe('A+');
    expect(report.score).toBe(100);
  });
});
