import { describe, it, expect } from 'vitest';
import { SchemaMigrationEngine } from '../src/migrations/schemaDiff.js';
import { EnterpriseTableDefinition } from '../src/schemas/enterpriseSchema.js';

describe('SchemaMigrationEngine', () => {
  it('detects missing tables between local DDL and remote schema', () => {
    const desired: EnterpriseTableDefinition[] = [
      { name: 'Projects', description: 'desc', fields: [] },
      { name: 'Sprints', description: 'agile sprints', fields: [] },
    ];
    const actual = [{ id: 'tbl1', name: 'Projects', fields: [] }];

    const diff = SchemaMigrationEngine.calculateDiff(desired, actual as any);
    expect(diff.hasDiff).toBe(true);
    expect(diff.tablesToCreate).toHaveLength(1);
    expect(diff.tablesToCreate[0].name).toBe('Sprints');
  });

  it('detects missing fields within an existing table', () => {
    const desired: EnterpriseTableDefinition[] = [
      {
        name: 'Projects',
        description: 'desc',
        fields: [
          { name: 'Project Code', type: 'singleLineText' },
          { name: 'Target Go-Live', type: 'date' },
        ],
      },
    ];
    const actual = [
      {
        id: 'tblProjects',
        name: 'Projects',
        fields: [{ id: 'fld1', name: 'Project Code', type: 'singleLineText' }],
      },
    ];

    const diff = SchemaMigrationEngine.calculateDiff(desired, actual as any);
    expect(diff.hasDiff).toBe(true);
    expect(diff.fieldsToCreate).toHaveLength(1);
    expect(diff.fieldsToCreate[0].field.name).toBe('Target Go-Live');
  });

  it('returns hasDiff: false when schemas are identical', () => {
    const desired: EnterpriseTableDefinition[] = [
      {
        name: 'Projects',
        description: 'desc',
        fields: [{ name: 'Project Code', type: 'singleLineText' }],
      },
    ];
    const actual = [
      {
        id: 'tblProjects',
        name: 'Projects',
        fields: [{ id: 'fld1', name: 'Project Code', type: 'singleLineText' }],
      },
    ];

    const diff = SchemaMigrationEngine.calculateDiff(desired, actual as any);
    expect(diff.hasDiff).toBe(false);
    expect(diff.steps).toHaveLength(0);
  });
});
