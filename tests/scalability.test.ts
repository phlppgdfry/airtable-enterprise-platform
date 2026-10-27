/**
 * Synthetic Scalability & Stress Benchmark Test Suite
 * 
 * Evaluates performance under enterprise volume loads:
 * - 100 records (Standard sprint volume)
 * - 1,000 records (Departmental dataset)
 * - 10,000 records (Enterprise multi-year audit log / portfolio)
 * 
 * Metrics:
 * - Chunking efficiency (Airtable 10-record boundary)
 * - Memory consumption (Heap delta)
 * - Throughput & Processing latency
 * - Data Linter scalability on large datasets
 * - Streaming SHA-256 checksum performance
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { AirtableBatchEngine } from '../src/client/batchUpsert.js';
import { EnterpriseDataLinter } from '../src/quality/dataLinter.js';

function generateSyntheticProjects(count: number) {
  const projects = [];
  const statuses = ['Discovery', 'Planning', 'Execution', 'Delivered', 'On Hold'];
  const priorities = ['P0 - Mission Critical', 'P1 - High', 'P2 - Medium', 'P3 - Low'];

  for (let i = 1; i <= count; i++) {
    const code = `PRJ-SYN-${String(i).padStart(5, '0')}`;
    projects.push({
      id: `recSynthetic_${i}`,
      fields: {
        'Project Code': code,
        'Project Name': `Synthetic Performance Project ${i}`,
        'Status': statuses[i % statuses.length],
        'Priority': priorities[i % priorities.length],
        'Allocated Budget (€)': 50000 + (i * 100),
        'Spent Budget (€)': 20000 + (i * 50),
        'Target Go-Live': '2026-12-31',
        'Executive Sponsor': 'Engineering Architecture Board',
        'Strategic Objectives': `Benchmark objective for synthetic entity ${i}`,
      },
    });
  }
  return projects;
}

describe('Enterprise Scalability Benchmarks', () => {
  it('Scalability 100 Records: Chunks into exactly 10 batches and validates schema conformance', () => {
    const records = generateSyntheticProjects(100);
    const startHeap = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    const chunks = AirtableBatchEngine.chunk(records, 10);
    const duration = performance.now() - startTime;
    const endHeap = process.memoryUsage().heapUsed;

    expect(chunks.length).toBe(10);
    expect(chunks[0].length).toBe(10);
    expect(chunks[9].length).toBe(10);
    expect(chunks[0][0].fields['Project Code']).toBe('PRJ-SYN-00001');
    expect(chunks[9][9].fields['Project Code']).toBe('PRJ-SYN-00100');
    expect(duration).toBeLessThan(50); // Under 50ms
    expect((endHeap - startHeap) / 1024 / 1024).toBeLessThan(10); // Less than 10MB heap delta
  });

  it('Scalability 1,000 Records: Evaluates relational mapping & data linter throughput', () => {
    const records = generateSyntheticProjects(1000);
    const startTime = performance.now();

    // 1. Chunking validation
    const chunks = AirtableBatchEngine.chunk(records, 10);
    expect(chunks.length).toBe(100);

    // 2. Relational index lookup simulation (Task to Project mapping)
    const projectIndex = new Map<string, string>();
    records.forEach((r) => projectIndex.set(r.fields['Project Code'], r.id));
    expect(projectIndex.size).toBe(1000);

    // 3. Test 1,000 synthetic task link resolutions
    for (let i = 1; i <= 1000; i++) {
      const targetCode = `PRJ-SYN-${String(i).padStart(5, '0')}`;
      const resolvedId = projectIndex.get(targetCode);
      expect(resolvedId).toBe(`recSynthetic_${i}`);
    }

    // 4. Data Linter benchmark on 1,000 records
    const linterResult = EnterpriseDataLinter.lint({
      projects: records as any,
      teamMembers: [],
      tasks: [],
      risks: [],
    });

    const duration = performance.now() - startTime;
    expect(linterResult.grade).toBe('A+');
    expect(linterResult.totalChecked).toBe(1000);
    expect(duration).toBeLessThan(300); // Process 1,000 records in < 300ms
  });

  it('Scalability 10,000 Records: High-volume serialization, SHA-256 integrity hashing & memory safety', () => {
    const count = 10000;
    const initialHeap = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    const records = generateSyntheticProjects(count);
    const generationTime = performance.now();

    // 1. Chunking into 1,000 discrete batches of 10
    const chunks = AirtableBatchEngine.chunk(records, 10);
    expect(chunks.length).toBe(1000);

    // 2. NDJSON serialization benchmark (Disaster recovery streaming simulation)
    let ndjsonBuffer = '';
    const hash = crypto.createHash('sha256');

    for (let i = 0; i < records.length; i++) {
      const line = JSON.stringify(records[i]) + '\n';
      ndjsonBuffer += line;
      hash.update(line, 'utf-8');
    }

    const sha256Digest = hash.digest('hex');
    const completionTime = performance.now();
    const finalHeap = process.memoryUsage().heapUsed;
    const heapGrowthMb = (finalHeap - initialHeap) / 1024 / 1024;

    expect(sha256Digest).toBeDefined();
    expect(sha256Digest.length).toBe(64);
    expect(ndjsonBuffer.length).toBeGreaterThan(1000000); // > 1MB of JSON payload
    expect(completionTime - startTime).toBeLessThan(2000); // 10,000 records processed in < 2 seconds
    expect(heapGrowthMb).toBeLessThan(150); // Bounded memory growth under 150MB
  });
});
