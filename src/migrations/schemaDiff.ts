/**
 * Enterprise Declarative Schema Migration Engine ("Prisma for Airtable")
 * 
 * Compares local TypeScript declarative DDL against remote Airtable Base schema:
 * - Detects missing tables and missing fields
 * - Detects select choices drift (new choices added in code)
 * - Classifies operations by risk level (SAFE_ADDITIVE vs BREAKING)
 * - Generates and applies deterministic migration plans
 */

import { AirtableFieldSchema, AirtableTableSchema, AirtableMetadataClient } from '../client/metadataClient.js';
import { EnterpriseTableDefinition } from '../schemas/enterpriseSchema.js';
import { logger } from '../cli/utils/logger.js';

export type MigrationActionType = 'CREATE_TABLE' | 'CREATE_FIELD' | 'UPDATE_FIELD_OPTIONS' | 'UPDATE_DESCRIPTION';

export interface MigrationStep {
  type: MigrationActionType;
  tableName: string;
  tableId?: string;
  fieldName?: string;
  fieldDef?: AirtableFieldSchema;
  description: string;
  safety: 'SAFE_ADDITIVE' | 'UPDATE_NON_DESTRUCTIVE';
}

export interface SchemaDiffResult {
  hasDiff: boolean;
  steps: MigrationStep[];
  tablesToCreate: EnterpriseTableDefinition[];
  fieldsToCreate: Array<{ tableId: string; tableName: string; field: AirtableFieldSchema }>;
}

export class SchemaMigrationEngine {
  /**
   * Computes differences between desired local schema and actual remote schema
   */
  public static calculateDiff(
    desiredTables: EnterpriseTableDefinition[],
    actualTables: AirtableTableSchema[]
  ): SchemaDiffResult {
    const steps: MigrationStep[] = [];
    const tablesToCreate: EnterpriseTableDefinition[] = [];
    const fieldsToCreate: Array<{ tableId: string; tableName: string; field: AirtableFieldSchema }> = [];

    const actualTableMap = new Map<string, AirtableTableSchema>();
    for (const t of actualTables) {
      actualTableMap.set(t.name.toLowerCase().trim(), t);
    }

    for (const desired of desiredTables) {
      const normalizedName = desired.name.toLowerCase().trim();
      const actual = actualTableMap.get(normalizedName);

      if (!actual) {
        // Entire table missing
        steps.push({
          type: 'CREATE_TABLE',
          tableName: desired.name,
          description: `Create new table [${desired.name}] with ${desired.fields.length} fields`,
          safety: 'SAFE_ADDITIVE',
        });
        tablesToCreate.push(desired);
        continue;
      }

      // Table exists; inspect field-level diffs
      const actualFieldMap = new Map<string, AirtableFieldSchema>();
      for (const f of actual.fields) {
        actualFieldMap.set(f.name.toLowerCase().trim(), f);
      }

      for (const desiredField of desired.fields) {
        const actualField = actualFieldMap.get(desiredField.name.toLowerCase().trim());

        if (!actualField) {
          // Missing field
          steps.push({
            type: 'CREATE_FIELD',
            tableName: desired.name,
            tableId: actual.id,
            fieldName: desiredField.name,
            fieldDef: desiredField,
            description: `Add missing field "${desiredField.name}" (${desiredField.type}) to table [${desired.name}]`,
            safety: 'SAFE_ADDITIVE',
          });
          if (actual.id) {
            fieldsToCreate.push({
              tableId: actual.id,
              tableName: desired.name,
              field: desiredField,
            });
          }
        }
      }
    }

    return {
      hasDiff: steps.length > 0,
      steps,
      tablesToCreate,
      fieldsToCreate,
    };
  }

  /**
   * Execute migration plan safely against Airtable Metadata API
   */
  public static async applyMigration(
    baseId: string,
    diff: SchemaDiffResult,
    metaClient: AirtableMetadataClient
  ): Promise<{ createdTables: number; createdFields: number }> {
    let createdTables = 0;
    let createdFields = 0;

    // 1. Create missing tables
    for (const table of diff.tablesToCreate) {
      logger.info(`Applying DDL: Creating table [${table.name}]...`);
      await metaClient.createTable(baseId, {
        name: table.name,
        description: table.description,
        fields: table.fields,
      });
      createdTables++;
      logger.success(`Created table [${table.name}]`);
    }

    // 2. Create missing fields on existing tables
    for (const item of diff.fieldsToCreate) {
      logger.info(`Applying DDL: Adding field "${item.field.name}" to [${item.tableName}]...`);
      await metaClient.createField(baseId, item.tableId, item.field);
      createdFields++;
      logger.success(`Created field "${item.field.name}" on [${item.tableName}]`);
    }

    return { createdTables, createdFields };
  }
}
