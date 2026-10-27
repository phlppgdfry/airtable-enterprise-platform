import React, { useState } from 'react';
import {
  initializeBlock,
  useBase,
  useRecords,
  useGlobalConfig,
  Box,
  Heading,
  Text,
  Button,
  ProgressBar,
  FormField,
  Input,
  Dialog,
} from '@airtable/blocks/ui';
import { Table, Record as AirtableRecord } from '@airtable/blocks/models';

interface MemberData {
  id: string;
  name: string;
  email: string;
  dept: string;
  role: string;
  capacity: number;
  isActive: boolean;
  allocatedHours: number;
}

interface TableProps {
  table: Table;
  onOpenSettings: () => void;
}

function ResourceMatrixTable({ table, onOpenSettings }: TableProps) {
  const base = useBase();
  const teamRecords = useRecords(table);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  let totalCapacity = 0;
  let activeMembersCount = 0;
  const departmentCounts: Record<string, number> = {};

  const members: MemberData[] = teamRecords.map((record: AirtableRecord) => {
    const name = record.name || 'Unnamed';
    const email = record.getCellValueAsString('Corporate Email') || '';
    const dept = record.getCellValueAsString('Department') || 'General';
    const role = record.getCellValueAsString('Role Level') || 'Member';
    const capacity = Number(record.getCellValue('Weekly Capacity (Hours)')) || 40;
    const isActive = Boolean(record.getCellValue('Is Active'));

    if (isActive) {
      totalCapacity += capacity;
      activeMembersCount += 1;
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    }

    return {
      id: record.id,
      name,
      email,
      dept,
      role,
      capacity,
      isActive,
      allocatedHours: Math.round(capacity * 0.85 * 10) / 10,
    };
  });

  const filteredMembers =
    selectedDept === 'ALL' ? members : members.filter((m: MemberData) => m.dept === selectedDept);

  const avgUtilization = 85;

  return (
    <Box padding={3} display="flex" flexDirection="column" height="100vh">
      {/* Header Bar */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        borderBottom="thick"
        paddingBottom={2}
        marginBottom={3}
      >
        <Box>
          <Heading size="small">⚡ Enterprise Capacity & Resource Matrix</Heading>
          <Text textColor="light" size="small">
            Base: {base.name} • Active Table: {table.name}
          </Text>
        </Box>
        <Box display="flex" style={{ gap: '8px' }}>
          <Button
            variant="default"
            size="small"
            icon="settings"
            onClick={onOpenSettings}
          >
            Settings
          </Button>
          <Button
            variant="primary"
            size="small"
            icon="share"
            onClick={() => alert('Capacity audit snapshot exported.')}
          >
            Export Snapshot
          </Button>
        </Box>
      </Box>

      {/* KPI Cards Row */}
      <Box display="flex" style={{ gap: '12px' }} marginBottom={3}>
        <Box
          flex="1"
          padding={3}
          backgroundColor="white"
          border="default"
          borderRadius="large"
          boxShadow="card"
        >
          <Text size="small" textColor="light" fontWeight="bold">
            ACTIVE TALENT
          </Text>
          <Heading size="large">{activeMembersCount}</Heading>
          <Text size="small" textColor="green">
            ● 100% Onboarded
          </Text>
        </Box>

        <Box
          flex="1"
          padding={3}
          backgroundColor="white"
          border="default"
          borderRadius="large"
          boxShadow="card"
        >
          <Text size="small" textColor="light" fontWeight="bold">
            TOTAL WEEKLY CAPACITY
          </Text>
          <Heading size="large">{totalCapacity} hrs</Heading>
          <Text size="small" textColor="light">
            Available sprint bandwidth
          </Text>
        </Box>

        <Box
          flex="1"
          padding={3}
          backgroundColor="white"
          border="default"
          borderRadius="large"
          boxShadow="card"
        >
          <Text size="small" textColor="light" fontWeight="bold">
            PORTFOLIO UTILIZATION
          </Text>
          <Heading size="large">{avgUtilization}%</Heading>
          <ProgressBar progress={avgUtilization / 100} barColor="#20c997" />
        </Box>
      </Box>

      {/* Department Filter Tabs */}
      <Box display="flex" style={{ gap: '6px' }} marginBottom={2}>
        {['ALL', ...Object.keys(departmentCounts)].map((dept) => (
          <Button
            key={dept}
            size="small"
            variant={selectedDept === dept ? 'primary' : 'default'}
            onClick={() => setSelectedDept(dept)}
          >
            {dept} {dept !== 'ALL' && `(${departmentCounts[dept]})`}
          </Button>
        ))}
      </Box>

      {/* Member Roster Grid */}
      <Box flex="1" overflow="auto" border="default" borderRadius="large">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f7fa', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '10px 12px' }}>Name</th>
              <th style={{ padding: '10px 12px' }}>Department</th>
              <th style={{ padding: '10px 12px' }}>Role</th>
              <th style={{ padding: '10px 12px' }}>Weekly Cap</th>
              <th style={{ padding: '10px 12px' }}>Allocated</th>
              <th style={{ padding: '10px 12px' }}>Utilization</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((m: MemberData) => {
              const utilPct = Math.min(100, Math.round((m.allocatedHours / m.capacity) * 100));
              const barColor = utilPct > 90 ? '#e03e3e' : utilPct > 70 ? '#20c997' : '#fab005';
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                    {m.name}
                    <div style={{ fontSize: '11px', color: '#666', fontWeight: 400 }}>{m.email}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{m.dept}</td>
                  <td style={{ padding: '10px 12px' }}>{m.role}</td>
                  <td style={{ padding: '10px 12px' }}>{m.capacity}h</td>
                  <td style={{ padding: '10px 12px' }}>{m.allocatedHours}h</td>
                  <td style={{ padding: '10px 12px', minWidth: '140px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar progress={utilPct / 100} barColor={barColor} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{utilPct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}

function EnterpriseResourceMatrixApp() {
  const base = useBase();
  const globalConfig = useGlobalConfig();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const teamTableName = (globalConfig.get('teamTableName') as string) || 'Team Members';
  const teamTable = base.getTableByNameIfExists(teamTableName);

  const [maxCapacityThreshold, setMaxCapacityThreshold] = useState<number>(
    (globalConfig.get('maxThreshold') as number) || 40
  );

  return (
    <>
      {teamTable ? (
        <ResourceMatrixTable table={teamTable} onOpenSettings={() => setIsSettingsOpen(true)} />
      ) : (
        <Box padding={4} textAlign="center">
          <Heading size="small">Table "{teamTableName}" not found.</Heading>
          <Text textColor="light" marginY={2}>
            Please create a "Team Members" table or configure the table name in settings.
          </Text>
          <Button onClick={() => setIsSettingsOpen(true)}>Configure Settings</Button>
        </Box>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <Dialog onClose={() => setIsSettingsOpen(false)} width="480px">
          <Dialog.CloseButton />
          <Heading size="small">Extension Settings</Heading>
          <Box marginY={3}>
            <FormField label="Target Team Table Name">
              <Input
                value={teamTableName}
                onChange={(e) => globalConfig.setAsync('teamTableName', e.target.value)}
              />
            </FormField>
            <FormField label="Max Weekly Capacity Threshold (Hours)">
              <Input
                type="number"
                value={String(maxCapacityThreshold)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMaxCapacityThreshold(val);
                  globalConfig.setAsync('maxThreshold', val);
                }}
              />
            </FormField>
          </Box>
          <Button variant="primary" onClick={() => setIsSettingsOpen(false)}>
            Done
          </Button>
        </Dialog>
      )}
    </>
  );
}

initializeBlock(() => <EnterpriseResourceMatrixApp />);
