import type {
  SecurityEvent, Alert, Incident, AuthEvent, NetworkConnection,
  SuspiciousIp, ResponseAction, NotificationItem, Severity,
} from '../types'
import { makeRng, pick, pickWeighted, randInt } from '../lib/random'
import { HOSTS } from './hosts'

// Fixed "now" anchor for demo determinism — all relative timestamps derive
// from this so the story (brute force at 10:34-10:42) stays consistent.
export const DEMO_NOW = new Date('2026-09-30T10:43:21Z')

const rng = makeRng(88421)

const USERS = ['administrator', 'svc_backup', 'jsmith', 'k.taylor', 'm.chen', 'r.patel', 'svc_sql', 'helpdesk', 'guest', 'a.williams']
const EXTERNAL_IPS = ['185.220.101.42', '91.243.58.19', '45.155.205.132', '103.87.64.18', '194.26.29.156', '80.94.95.116']
const INTERNAL_SUBNET = '10.0.10.'
const COUNTRIES: Record<string, string> = {
  '185.220.101.42': 'Russia',
  '91.243.58.19': 'Netherlands',
  '45.155.205.132': 'Romania',
  '103.87.64.18': 'Vietnam',
  '194.26.29.156': 'Ukraine',
  '80.94.95.116': 'Bulgaria',
}

function internalIp(host: string): string {
  const h = HOSTS.find((x) => x.hostname === host)
  return h?.ip ?? INTERNAL_SUBNET + randInt(rng, 2, 250)
}

function minutesAgo(m: number, jitterSec = 0): string {
  const t = new Date(DEMO_NOW.getTime() - m * 60_000 - jitterSec * 1000)
  return t.toISOString()
}

function secondsAgo(s: number): string {
  return new Date(DEMO_NOW.getTime() - s * 1000).toISOString()
}

// ---------------------------------------------------------------------------
// SECURITY EVENTS — the raw telemetry feed
// ---------------------------------------------------------------------------

interface EventTemplate {
  severity: Severity
  source: string
  eventType: string
  rule: string
  status: SecurityEvent['status']
  eventId?: string
  makeDesc: () => string
}

function buildBruteForceEvents(): SecurityEvent[] {
  const events: SecurityEvent[] = []
  const totalAttempts = 187
  const startMin = 8.8 // ~10:34:12 relative to 10:43
  for (let i = 0; i < totalAttempts; i++) {
    const t = startMin - (i / totalAttempts) * 8.2 - rng() * 0.02
    events.push({
      id: `evt-brute-${i}`,
      timestamp: minutesAgo(t, randInt(rng, 0, 40)),
      severity: 'CRITICAL',
      source: 'Windows Security',
      eventType: 'Brute Force Detected',
      sourceIp: '185.220.101.42',
      destination: '10.0.10.25',
      user: 'administrator',
      host: 'WIN-DC01',
      rule: 'AUTH-BRUTE-001',
      status: i < 5 ? 'Investigating' : 'Open',
      eventId: '4625',
      description: 'An account failed to log on. Logon Type: 3 (Network). Failure Reason: Unknown user name or bad password.',
    })
  }
  return events
}

function buildPowerShellEvents(): SecurityEvent[] {
  return [
    {
      id: 'evt-ps-1',
      timestamp: minutesAgo(1.5),
      severity: 'HIGH',
      source: 'Wazuh Agent',
      eventType: 'Suspicious PowerShell',
      sourceIp: '10.0.10.32',
      destination: '10.0.10.15',
      user: 'svc_backup',
      host: 'WIN-APP02',
      rule: 'PS-EXEC-004',
      status: 'Open',
      eventId: '4104',
      description: 'ScriptBlock logging captured EncodedCommand execution with reflective .NET assembly load.',
    },
    {
      id: 'evt-ps-2',
      timestamp: minutesAgo(2.1),
      severity: 'HIGH',
      source: 'Wazuh Agent',
      eventType: 'Suspicious PowerShell',
      sourceIp: '10.0.10.32',
      destination: '10.0.10.15',
      user: 'svc_backup',
      host: 'WIN-APP02',
      rule: 'PS-EXEC-004',
      status: 'Open',
      eventId: '4104',
      description: 'PowerShell launched with -nop -w hidden -enc flags from cmd.exe parent process.',
    },
    {
      id: 'evt-priv-1',
      timestamp: minutesAgo(1.8),
      severity: 'HIGH',
      source: 'Sysmon',
      eventType: 'Privilege Escalation Attempt',
      sourceIp: '10.0.10.32',
      destination: '10.0.10.32',
      user: 'svc_backup',
      host: 'WIN-APP02',
      rule: 'PRIV-ESC-003',
      status: 'Investigating',
      eventId: '1',
      description: 'Process token integrity elevated to SYSTEM without corresponding service start event.',
    },
  ]
}

function buildScanEvents(): SecurityEvent[] {
  const events: SecurityEvent[] = []
  for (let i = 0; i < 52; i++) {
    events.push({
      id: `evt-scan-${i}`,
      timestamp: minutesAgo(3 + rng() * 0.8),
      severity: 'MEDIUM',
      source: 'Firewall',
      eventType: 'Port Scan Detected',
      sourceIp: '10.0.10.50',
      destination: `192.168.1.${randInt(rng, 1, 254)}`,
      user: '-',
      host: 'KALI-ATTACKER',
      rule: 'NET-SCAN-002',
      status: 'Contained',
      description: `TCP SYN probe to port ${pick(rng, [22, 80, 135, 139, 443, 445, 3389, 8080])}`,
    })
  }
  return events.slice(0, 52)
}

function buildMalwareEvent(): SecurityEvent[] {
  return [
    {
      id: 'evt-malware-1',
      timestamp: minutesAgo(87),
      severity: 'HIGH',
      source: 'Wazuh Agent',
      eventType: 'Suspicious File Execution',
      sourceIp: '10.0.10.71',
      destination: '10.0.10.71',
      user: 'k.taylor',
      host: 'WIN-WKS07',
      rule: 'MALWARE-007',
      status: 'Contained',
      eventId: '1',
      description: 'Unsigned executable "invoice_update.exe" launched from Downloads, matched threat-intel hash feed.',
    },
  ]
}

function buildBackgroundNoise(): SecurityEvent[] {
  const sources = ['Windows Security', 'Linux Auditd', 'Firewall', 'Wazuh Agent', 'Sysmon', 'IIS', 'DNS Server']
  const types: [string, Severity, string][] = [
    ['Successful Logon', 'INFO', 'AUTH-BRUTE-001'],
    ['Scheduled Task Executed', 'INFO', 'PS-EXEC-004'],
    ['File Access', 'INFO', 'MALWARE-007'],
    ['DNS Query Logged', 'INFO', 'NET-SCAN-002'],
    ['Service Started', 'LOW', 'PRIV-ESC-003'],
    ['Configuration Change', 'LOW', 'PRIV-ESC-003'],
    ['Outbound Connection', 'INFO', 'NET-SCAN-002'],
  ]
  const events: SecurityEvent[] = []
  for (let i = 0; i < 140; i++) {
    const [eventType, severity, rule] = pick(rng, types)
    const host = pick(rng, HOSTS).hostname
    events.push({
      id: `evt-noise-${i}`,
      timestamp: minutesAgo(rng() * 90),
      severity,
      source: pick(rng, sources),
      eventType,
      sourceIp: internalIp(host),
      destination: internalIp(pick(rng, HOSTS).hostname),
      user: pick(rng, USERS),
      host,
      rule,
      status: 'Resolved',
      description: 'Routine activity consistent with established baseline.',
    })
  }
  return events
}

export const SECURITY_EVENTS: SecurityEvent[] = [
  ...buildBruteForceEvents(),
  ...buildPowerShellEvents(),
  ...buildScanEvents(),
  ...buildMalwareEvent(),
  ...buildBackgroundNoise(),
].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

// ---------------------------------------------------------------------------
// ALERTS
// ---------------------------------------------------------------------------

export const ALERTS: Alert[] = [
  {
    id: 'ALR-2026-1042',
    severity: 'CRITICAL',
    rule: 'SSH/RDP & SMB Brute Force',
    ruleId: 'AUTH-BRUTE-001',
    sourceIp: '185.220.101.42',
    target: '10.0.10.25 (WIN-DC01)',
    firstSeen: minutesAgo(8.8),
    lastSeen: minutesAgo(0.6),
    occurrences: 187,
    riskScore: 92,
    status: 'Investigating',
    mitreId: 'T1110',
    host: 'WIN-DC01',
    user: 'administrator',
    assignee: 'AI Analyst (auto-triaged)',
    description: 'Sustained authentication brute force against domain controller targeting built-in administrator account.',
  },
  {
    id: 'ALR-2026-1038',
    severity: 'HIGH',
    rule: 'Suspicious PowerShell Execution',
    ruleId: 'PS-EXEC-004',
    sourceIp: '10.0.10.32',
    target: '10.0.10.15 (WIN-APP02)',
    firstSeen: minutesAgo(2.1),
    lastSeen: minutesAgo(1.5),
    occurrences: 3,
    riskScore: 78,
    status: 'Open',
    mitreId: 'T1059.001',
    host: 'WIN-APP02',
    user: 'svc_backup',
    assignee: 'Unassigned',
    description: 'Encoded PowerShell execution observed from service account context outside maintenance window.',
  },
  {
    id: 'ALR-2026-1037',
    severity: 'HIGH',
    rule: 'Privilege Escalation Attempt',
    ruleId: 'PRIV-ESC-003',
    sourceIp: '10.0.10.32',
    target: '10.0.10.32 (WIN-APP02)',
    firstSeen: minutesAgo(1.8),
    lastSeen: minutesAgo(1.8),
    occurrences: 1,
    riskScore: 76,
    status: 'Investigating',
    mitreId: 'T1068',
    host: 'WIN-APP02',
    user: 'svc_backup',
    assignee: 'S.Okafor',
    description: 'Process token elevated to SYSTEM integrity without corresponding authorized service start.',
  },
  {
    id: 'ALR-2026-1035',
    severity: 'MEDIUM',
    rule: 'Network Port Scan',
    ruleId: 'NET-SCAN-002',
    sourceIp: '10.0.10.50',
    target: '192.168.1.0/24',
    firstSeen: minutesAgo(3.8),
    lastSeen: minutesAgo(3.0),
    occurrences: 52,
    riskScore: 48,
    status: 'Contained',
    mitreId: 'T1046',
    host: 'KALI-ATTACKER',
    user: '-',
    assignee: 'Auto-contained',
    description: 'Sequential TCP SYN scan across internal subnet from unmanaged range host.',
  },
  {
    id: 'ALR-2026-1029',
    severity: 'HIGH',
    rule: 'Suspicious File Execution',
    ruleId: 'MALWARE-007',
    sourceIp: '10.0.10.71',
    target: '10.0.10.71 (WIN-WKS07)',
    firstSeen: minutesAgo(87),
    lastSeen: minutesAgo(87),
    occurrences: 1,
    riskScore: 64,
    status: 'Contained',
    mitreId: 'T1204.002',
    host: 'WIN-WKS07',
    user: 'k.taylor',
    assignee: 'S.Okafor',
    description: 'Unsigned binary matching known-bad hash executed from user Downloads folder.',
  },
  {
    id: 'ALR-2026-1021',
    severity: 'MEDIUM',
    rule: 'Periodic Beaconing Pattern',
    ruleId: 'C2-BEACON-006',
    sourceIp: '10.0.10.32',
    target: '91.243.58.19',
    firstSeen: minutesAgo(192),
    lastSeen: minutesAgo(41),
    occurrences: 18,
    riskScore: 62,
    status: 'Open',
    mitreId: 'T1071.001',
    host: 'WIN-APP02',
    user: 'svc_backup',
    assignee: 'Unassigned',
    description: 'Fixed-interval HTTPS callback pattern to unrated external destination.',
  },
  {
    id: 'ALR-2026-1014',
    severity: 'LOW',
    rule: 'Impossible Travel Login',
    ruleId: 'AUTH-IMPOSSIBLE-008',
    sourceIp: '194.26.29.156',
    target: 'r.patel@corp.local',
    firstSeen: minutesAgo(410),
    lastSeen: minutesAgo(410),
    occurrences: 1,
    riskScore: 38,
    status: 'Closed',
    mitreId: 'T1078',
    host: '-',
    user: 'r.patel',
    assignee: 'S.Okafor',
    description: 'Successful login geo-velocity inconsistent with prior session location; confirmed false positive (VPN).',
  },
  {
    id: 'ALR-2026-1009',
    severity: 'LOW',
    rule: 'Large Outbound Data Transfer',
    ruleId: 'NET-EXFIL-005',
    sourceIp: '10.0.10.40',
    target: '45.155.205.132',
    firstSeen: minutesAgo(690),
    lastSeen: minutesAgo(690),
    occurrences: 1,
    riskScore: 44,
    status: 'Suppressed',
    mitreId: 'T1041',
    host: 'LINUX-SRV01',
    user: 'svc_sql',
    assignee: 'Auto-suppressed',
    description: 'Scheduled backup sync to offsite storage; matched known maintenance window, suppressed by policy.',
  },
]

// ---------------------------------------------------------------------------
// INCIDENTS
// ---------------------------------------------------------------------------

export const INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-0042',
    title: 'Repeated Authentication Failures Against Domain Controller',
    severity: 'CRITICAL',
    riskScore: 92,
    status: 'Investigating',
    mitreId: 'T1110',
    mitreName: 'Brute Force',
    createdAt: minutesAgo(3),
    updatedAt: minutesAgo(0.3),
    owner: 'AI Analyst / S.Okafor',
    sourceIp: '185.220.101.42',
    targetHost: 'WIN-DC01',
    targetIp: '10.0.10.25',
    affectedAssets: ['WIN-DC01', 'Domain: CORP.LOCAL'],
    indicators: [
      { type: 'Source IP', value: '185.220.101.42' },
      { type: 'Target Account', value: 'administrator' },
      { type: 'Detection Rule', value: 'AUTH-BRUTE-001' },
      { type: 'MITRE Technique', value: 'T1110 - Brute Force' },
      { type: 'Windows Event ID', value: '4625 (x187)' },
    ],
    evidence: [
      { label: 'Failed Logon Volume', detail: '187 failed logon attempts (Event ID 4625) within an 8-minute window' },
      { label: 'Source Consistency', detail: 'All attempts originated from a single external IP: 185.220.101.42 (RU)' },
      { label: 'Timing Pattern', detail: 'Attempts spaced at ~2.1s intervals — consistent with automated credential stuffing tooling' },
      { label: 'Target Scope', detail: 'Single account targeted: built-in "administrator" on domain controller WIN-DC01' },
      { label: 'Post-Attempt Activity', detail: 'No successful authentication observed from the source IP following the attack window' },
    ],
    timeline: [
      { time: minutesAgo(8.8), label: 'First failed login', detail: 'Event ID 4625 from 185.220.101.42 targeting administrator', actor: 'System' },
      { time: minutesAgo(8.2), label: '20 failed attempts', detail: 'Threshold monitor engaged, tracking source IP', actor: 'Detection Engine' },
      { time: minutesAgo(5.9), label: 'Detection threshold exceeded', detail: '>= 15 failures / 5 min rule condition met', actor: 'Detection Engine' },
      { time: minutesAgo(5.6), label: 'Alert generated', detail: 'ALR-2026-1042 created with risk score 92/100', actor: 'Correlation Engine' },
      { time: minutesAgo(3.0), label: 'Incident created', detail: 'INC-2026-0042 opened and assigned CRITICAL severity', actor: 'System' },
      { time: minutesAgo(1.9), label: 'Source IP blocked', detail: '185.220.101.42 blocked at perimeter firewall (automated response)', actor: 'Response Engine' },
      { time: minutesAgo(0.8), label: 'AI investigation completed', detail: 'Threat classification, MITRE mapping, and response plan generated', actor: 'AI Analyst' },
    ],
    relatedAlertIds: ['ALR-2026-1042'],
    summary:
      'Multiple failed authentication attempts were detected against the domain controller from a single external source IP. The activity exceeded the configured brute-force threshold and occurred within a short time window, indicating automated credential guessing consistent with MITRE ATT&CK technique T1110.',
    aiAnalyzed: true,
  },
  {
    id: 'INC-2026-0041',
    title: 'Anomalous PowerShell Activity Preceding Privilege Escalation',
    severity: 'HIGH',
    riskScore: 78,
    status: 'Investigating',
    mitreId: 'T1059.001',
    mitreName: 'PowerShell',
    createdAt: minutesAgo(2),
    updatedAt: minutesAgo(1),
    owner: 'S.Okafor',
    sourceIp: '10.0.10.32',
    targetHost: 'WIN-APP02',
    targetIp: '10.0.10.32',
    affectedAssets: ['WIN-APP02'],
    indicators: [
      { type: 'Host', value: 'WIN-APP02' },
      { type: 'Account', value: 'svc_backup' },
      { type: 'Detection Rules', value: 'PS-EXEC-004, PRIV-ESC-003' },
      { type: 'MITRE Techniques', value: 'T1059.001, T1068' },
    ],
    evidence: [
      { label: 'Encoded Execution', detail: 'PowerShell launched with -enc flag decoding to reflective assembly loader' },
      { label: 'Execution Window', detail: 'Activity occurred at 02:41 local time, outside the 01:00-01:30 scheduled backup window' },
      { label: 'Privilege Anomaly', detail: 'Process token elevated to SYSTEM without matching service start event' },
    ],
    timeline: [
      { time: minutesAgo(2.1), label: 'Encoded PowerShell detected', detail: 'PS-EXEC-004 triggered on WIN-APP02', actor: 'Detection Engine' },
      { time: minutesAgo(1.8), label: 'Privilege escalation observed', detail: 'PRIV-ESC-003 triggered, token elevated to SYSTEM', actor: 'Detection Engine' },
      { time: minutesAgo(1.5), label: 'Alert correlated', detail: 'Alerts ALR-2026-1038 and ALR-2026-1037 linked to single incident', actor: 'Correlation Engine' },
      { time: minutesAgo(1.0), label: 'Analyst assigned', detail: 'Incident assigned to S.Okafor for manual investigation', actor: 'System' },
    ],
    relatedAlertIds: ['ALR-2026-1038', 'ALR-2026-1037'],
    summary:
      'A service account executed obfuscated PowerShell outside its expected maintenance window, followed immediately by unexplained privilege escalation to SYSTEM integrity. Pattern is consistent with post-exploitation tooling.',
    aiAnalyzed: false,
  },
  {
    id: 'INC-2026-0039',
    title: 'Internal Network Reconnaissance from Unmanaged Host',
    severity: 'MEDIUM',
    riskScore: 48,
    status: 'Contained',
    mitreId: 'T1046',
    mitreName: 'Network Service Discovery',
    createdAt: minutesAgo(3.5),
    updatedAt: minutesAgo(2.9),
    owner: 'Auto-contained',
    sourceIp: '10.0.10.50',
    targetHost: 'Multiple (192.168.1.0/24)',
    targetIp: '192.168.1.0/24',
    affectedAssets: ['192.168.1.0/24 subnet'],
    indicators: [
      { type: 'Source Host', value: 'KALI-ATTACKER (10.0.10.50)' },
      { type: 'Detection Rule', value: 'NET-SCAN-002' },
      { type: 'MITRE Technique', value: 'T1046' },
    ],
    evidence: [
      { label: 'Scan Volume', detail: '52 probe events across 254 destination hosts in 47 seconds' },
      { label: 'Scan Signature', detail: 'Sequential SYN probing on ports 22, 80, 135, 445, 3389 matches nmap default template' },
    ],
    timeline: [
      { time: minutesAgo(3.8), label: 'Port scan detected', detail: 'NET-SCAN-002 triggered from KALI-ATTACKER', actor: 'Detection Engine' },
      { time: minutesAgo(3.2), label: 'Auto-containment policy applied', detail: 'Source host placed into quarantine VLAN', actor: 'Response Engine' },
      { time: minutesAgo(2.9), label: 'Incident marked contained', detail: 'No further scanning activity observed post-containment', actor: 'System' },
    ],
    relatedAlertIds: ['ALR-2026-1035'],
    summary:
      'An unmanaged host on the internal range conducted a rapid, sequential port scan across the internal subnet, consistent with active reconnaissance. Automated containment isolated the host before further activity occurred.',
    aiAnalyzed: false,
  },
  {
    id: 'INC-2026-0033',
    title: 'Malicious Binary Executed on Workstation',
    severity: 'HIGH',
    riskScore: 64,
    status: 'Resolved',
    mitreId: 'T1204.002',
    mitreName: 'Malicious File',
    createdAt: minutesAgo(86),
    updatedAt: minutesAgo(70),
    owner: 'S.Okafor',
    sourceIp: '10.0.10.71',
    targetHost: 'WIN-WKS07',
    targetIp: '10.0.10.71',
    affectedAssets: ['WIN-WKS07'],
    indicators: [
      { type: 'Host', value: 'WIN-WKS07' },
      { type: 'User', value: 'k.taylor' },
      { type: 'File Hash', value: 'a3f9...c21e (SHA-256)' },
      { type: 'MITRE Technique', value: 'T1204.002' },
    ],
    evidence: [
      { label: 'File Origin', detail: '"invoice_update.exe" downloaded via email attachment' },
      { label: 'Reputation Match', detail: 'Hash matched known-bad indicator in threat intelligence feed' },
      { label: 'Behavior', detail: 'Dropped secondary payload to %TEMP% before being quarantined' },
    ],
    timeline: [
      { time: minutesAgo(87), label: 'Malicious execution detected', detail: 'MALWARE-007 triggered on WIN-WKS07', actor: 'Detection Engine' },
      { time: minutesAgo(85), label: 'Host isolated', detail: 'Automated isolation policy applied', actor: 'Response Engine' },
      { time: minutesAgo(80), label: 'Binary quarantined', detail: 'File removed and submitted for analysis', actor: 'Analyst' },
      { time: minutesAgo(70), label: 'Incident resolved', detail: 'No lateral spread detected; host cleared for reconnection', actor: 'S.Okafor' },
    ],
    relatedAlertIds: ['ALR-2026-1029'],
    summary:
      'A user executed an unsigned, reputation-flagged binary delivered via email. The host was isolated and the binary quarantined before any observed lateral movement or data staging occurred.',
    aiAnalyzed: true,
  },
]

// ---------------------------------------------------------------------------
// AUTHENTICATION EVENTS
// ---------------------------------------------------------------------------

export function buildAuthEvents(): AuthEvent[] {
  const events: AuthEvent[] = []
  // brute force failures
  for (let i = 0; i < 187; i++) {
    events.push({
      id: `auth-fail-${i}`,
      timestamp: minutesAgo(8.8 - (i / 187) * 8.2 - rng() * 0.02),
      user: 'administrator',
      sourceIp: '185.220.101.42',
      host: 'WIN-DC01',
      result: 'Failure',
      method: 'NTLM',
      country: 'Russia',
      privileged: true,
    })
  }
  // normal traffic
  for (let i = 0; i < 260; i++) {
    const success = rng() > 0.06
    const host = pick(rng, HOSTS).hostname
    events.push({
      id: `auth-norm-${i}`,
      timestamp: minutesAgo(rng() * 480),
      user: pick(rng, USERS),
      sourceIp: internalIp(host),
      host,
      result: success ? 'Success' : 'Failure',
      method: pick(rng, ['Kerberos', 'NTLM', 'Password', 'SSH Key']),
      country: 'United States',
      privileged: pick(rng, [true, false, false, false]),
    })
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const AUTH_EVENTS = buildAuthEvents()

// ---------------------------------------------------------------------------
// NETWORK CONNECTIONS + SUSPICIOUS IPS
// ---------------------------------------------------------------------------

export function buildNetworkConnections(): NetworkConnection[] {
  const conns: NetworkConnection[] = []
  for (let i = 0; i < 300; i++) {
    const isExternal = rng() > 0.7
    const blocked = isExternal && rng() > 0.5
    conns.push({
      id: `net-${i}`,
      timestamp: minutesAgo(rng() * 60),
      sourceIp: isExternal ? pick(rng, EXTERNAL_IPS) : internalIp(pick(rng, HOSTS).hostname),
      destIp: isExternal ? internalIp(pick(rng, HOSTS).hostname) : internalIp(pick(rng, HOSTS).hostname),
      destPort: pick(rng, [22, 80, 443, 445, 3389, 8080, 3306, 5432, 53]),
      protocol: pick(rng, ['TCP', 'UDP']),
      bytesIn: randInt(rng, 200, 900000),
      bytesOut: randInt(rng, 200, 400000),
      blocked,
      country: isExternal ? COUNTRIES[pick(rng, EXTERNAL_IPS)] ?? 'Unknown' : 'Internal',
    })
  }
  return conns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const NETWORK_CONNECTIONS = buildNetworkConnections()

export const SUSPICIOUS_IPS: SuspiciousIp[] = [
  { ip: '185.220.101.42', country: 'Russia', reputation: 'Malicious', connections: 187, blocked: 187, risk: 96, asn: 'AS200651 (Tor Exit)', tags: ['Brute Force', 'Tor Exit Node'] },
  { ip: '91.243.58.19', country: 'Netherlands', reputation: 'Suspicious', connections: 34, blocked: 12, risk: 68, asn: 'AS60781', tags: ['C2 Beaconing', 'Bulletproof Hosting'] },
  { ip: '45.155.205.132', country: 'Romania', reputation: 'Suspicious', connections: 9, blocked: 4, risk: 54, asn: 'AS9009', tags: ['Scanning'] },
  { ip: '103.87.64.18', country: 'Vietnam', reputation: 'Unknown', connections: 6, blocked: 2, risk: 31, asn: 'AS45899', tags: [] },
  { ip: '194.26.29.156', country: 'Ukraine', reputation: 'Unknown', connections: 3, blocked: 0, risk: 22, asn: 'AS62282', tags: ['VPN Exit'] },
  { ip: '80.94.95.116', country: 'Bulgaria', reputation: 'Malicious', connections: 15, blocked: 15, risk: 79, asn: 'AS197226', tags: ['Scanning', 'Known Botnet'] },
]

// ---------------------------------------------------------------------------
// RESPONSE ACTIONS
// ---------------------------------------------------------------------------

export const INITIAL_RESPONSE_ACTIONS: ResponseAction[] = [
  {
    id: 'RSP-0091',
    action: 'Block IP',
    target: '185.220.101.42',
    triggeredBy: 'Detection Rule: AUTH-BRUTE-001',
    timestamp: minutesAgo(1.9),
    status: 'Completed',
    incidentId: 'INC-2026-0042',
    detail: 'Source IP added to perimeter firewall deny list (auto-response policy).',
  },
  {
    id: 'RSP-0090',
    action: 'Create Incident',
    target: 'WIN-DC01',
    triggeredBy: 'Correlation Engine',
    timestamp: minutesAgo(3.0),
    status: 'Completed',
    incidentId: 'INC-2026-0042',
    detail: 'INC-2026-0042 created from alert ALR-2026-1042.',
  },
  {
    id: 'RSP-0089',
    action: 'Send Alert',
    target: 'SOC On-Call (PagerDuty)',
    triggeredBy: 'Detection Rule: AUTH-BRUTE-001',
    timestamp: minutesAgo(5.6),
    status: 'Completed',
    incidentId: 'INC-2026-0042',
    detail: 'Critical severity page sent to on-call analyst rotation.',
  },
  {
    id: 'RSP-0088',
    action: 'Isolate Host',
    target: 'KALI-ATTACKER (10.0.10.50)',
    triggeredBy: 'Detection Rule: NET-SCAN-002',
    timestamp: minutesAgo(3.2),
    status: 'Completed',
    incidentId: 'INC-2026-0039',
    detail: 'Host moved to quarantine VLAN 999 pending investigation.',
  },
  {
    id: 'RSP-0087',
    action: 'Collect Evidence',
    target: 'WIN-WKS07',
    triggeredBy: 'S.Okafor',
    timestamp: minutesAgo(80),
    status: 'Completed',
    incidentId: 'INC-2026-0033',
    detail: 'Memory dump and disk artifact collection completed for forensic review.',
  },
  {
    id: 'RSP-0086',
    action: 'Kill Process',
    target: 'invoice_update.exe (PID 4821)',
    triggeredBy: 'S.Okafor',
    timestamp: minutesAgo(85),
    status: 'Completed',
    incidentId: 'INC-2026-0033',
    detail: 'Malicious process terminated on WIN-WKS07 via EDR console.',
  },
  {
    id: 'RSP-0085',
    action: 'Disable Account',
    target: 'svc_backup',
    triggeredBy: 'Pending Analyst Approval',
    timestamp: minutesAgo(1.0),
    status: 'Pending',
    incidentId: 'INC-2026-0041',
    detail: 'Recommended by AI Analyst pending manual confirmation.',
  },
  {
    id: 'RSP-0084',
    action: 'Force Password Reset',
    target: 'administrator',
    triggeredBy: 'AI Analyst Recommendation',
    timestamp: minutesAgo(0.8),
    status: 'Pending',
    incidentId: 'INC-2026-0042',
    detail: 'Recommended following successful brute-force block; awaiting approval.',
  },
]

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'ntf-1',
    severity: 'CRITICAL',
    title: 'Critical Incident: Brute Force on WIN-DC01',
    detail: '187 failed login attempts from 185.220.101.42. Risk score 92/100.',
    timestamp: minutesAgo(0.8),
    read: false,
    link: { page: 'incidents', id: 'INC-2026-0042' },
  },
  {
    id: 'ntf-2',
    severity: 'HIGH',
    title: 'Suspicious PowerShell on WIN-APP02',
    detail: 'Encoded command execution detected from svc_backup context.',
    timestamp: minutesAgo(2.1),
    read: false,
    link: { page: 'alerts', id: 'ALR-2026-1038' },
  },
  {
    id: 'ntf-3',
    severity: 'HIGH',
    title: 'Privilege Escalation Detected',
    detail: 'Token elevated to SYSTEM on WIN-APP02 without service start event.',
    timestamp: minutesAgo(1.8),
    read: false,
    link: { page: 'alerts', id: 'ALR-2026-1037' },
  },
  {
    id: 'ntf-4',
    severity: 'MEDIUM',
    title: 'Port Scan Contained',
    detail: 'Automated containment applied to KALI-ATTACKER (10.0.10.50).',
    timestamp: minutesAgo(3.2),
    read: true,
    link: { page: 'incidents', id: 'INC-2026-0039' },
  },
  {
    id: 'ntf-5',
    severity: 'INFO',
    title: 'Response Action Completed',
    detail: 'Source IP 185.220.101.42 blocked at perimeter firewall.',
    timestamp: minutesAgo(1.9),
    read: true,
    link: { page: 'response' },
  },
]
