// ============================================================================
// AdaptiveSOC — Core domain types
// Mirrors the data contracts a real SIEM backend would expose, so mock data
// can later be swapped for live API responses without touching UI code.
// ============================================================================

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'

export type EventStatus = 'Open' | 'Investigating' | 'Contained' | 'Resolved' | 'False Positive'

export interface SecurityEvent {
  id: string
  timestamp: string // ISO
  severity: Severity
  source: string // e.g. "Windows Security", "Wazuh Agent", "Firewall"
  eventType: string
  sourceIp: string
  destination: string
  user: string
  host: string
  rule: string // rule id
  status: EventStatus
  eventId?: string // windows event id / linux facility
  description?: string
  raw?: string
}

export type AlertStatus = 'Open' | 'Investigating' | 'Contained' | 'Suppressed' | 'Closed'

export interface Alert {
  id: string
  severity: Severity
  rule: string
  ruleId: string
  sourceIp: string
  target: string
  firstSeen: string
  lastSeen: string
  occurrences: number
  riskScore: number
  status: AlertStatus
  mitreId?: string
  host?: string
  user?: string
  assignee?: string
  description: string
}

export type IncidentStatus = 'New' | 'Investigating' | 'Contained' | 'Resolved' | 'Closed'

export interface TimelineEntry {
  time: string
  label: string
  detail?: string
  actor?: string // "System", "Analyst", "AI Analyst"
}

export interface Incident {
  id: string
  title: string
  severity: Severity
  riskScore: number
  status: IncidentStatus
  mitreId: string
  mitreName: string
  createdAt: string
  updatedAt: string
  owner: string
  sourceIp: string
  targetHost: string
  targetIp: string
  affectedAssets: string[]
  indicators: { type: string; value: string }[]
  evidence: { label: string; detail: string }[]
  timeline: TimelineEntry[]
  relatedAlertIds: string[]
  summary: string
  aiAnalyzed: boolean
}

export interface DetectionRule {
  id: string
  name: string
  severity: Severity
  mitreId: string
  mitreName: string
  triggerCondition: string
  eventsMatched: number
  lastTriggered: string
  status: 'Enabled' | 'Disabled'
  category: string
  description: string
}

export interface MitreTechnique {
  id: string
  name: string
  tactic: string
  detections: number
  risk: number
  confidence: number
  description: string
  evidence: string[]
  relatedAlertIds: string[]
  affectedHosts: string[]
  detectionRuleIds: string[]
  recommendedResponse: string[]
}

export type HostStatus = 'Critical' | 'High' | 'Monitoring' | 'Low' | 'Healthy'
export type AgentStatus = 'Online' | 'Offline' | 'Degraded'

export interface Host {
  id: string
  hostname: string
  os: string
  ip: string
  status: HostStatus
  risk: number
  cpu: number
  memory: number
  network: number // Mbps
  lastSeen: string
  agentStatus: AgentStatus
  openAlerts: number
  role: string
}

export interface AuthEvent {
  id: string
  timestamp: string
  user: string
  sourceIp: string
  host: string
  result: 'Success' | 'Failure'
  method: string
  country?: string
  privileged: boolean
}

export interface NetworkConnection {
  id: string
  timestamp: string
  sourceIp: string
  destIp: string
  destPort: number
  protocol: string
  bytesIn: number
  bytesOut: number
  blocked: boolean
  country: string
}

export interface SuspiciousIp {
  ip: string
  country: string
  reputation: 'Malicious' | 'Suspicious' | 'Unknown' | 'Clean'
  connections: number
  blocked: number
  risk: number
  asn?: string
  tags: string[]
}

export type ResponseActionType =
  | 'Block IP'
  | 'Isolate Host'
  | 'Disable Account'
  | 'Kill Process'
  | 'Collect Evidence'
  | 'Create Incident'
  | 'Send Alert'
  | 'Force Password Reset'

export type ResponseStatus = 'Pending' | 'Executing' | 'Completed' | 'Failed'

export interface ResponseAction {
  id: string
  action: ResponseActionType
  target: string
  triggeredBy: string
  timestamp: string
  status: ResponseStatus
  incidentId?: string
  detail?: string
}

export interface NotificationItem {
  id: string
  severity: Severity
  title: string
  detail: string
  timestamp: string
  read: boolean
  link?: { page: string; id?: string }
}

export interface AIAnalysisResult {
  incidentId: string
  narrative: string
  threatType: string
  attackPattern: string
  confidence: number
  risk: number
  mitreId: string
  mitreName: string
  affectedAsset: string
  affectedAssetIp: string
  source: string
  recommendedActions: string[]
  generatedAt: string
}

export interface ChatMessage {
  id: string
  role: 'analyst' | 'ai'
  content: string
  timestamp: string
  structured?: boolean
}

export type TimeRange = '15m' | '1h' | '24h' | '7d'
