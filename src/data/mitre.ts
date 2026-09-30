import type { MitreTechnique } from '../types'

export const MITRE_TACTICS = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact',
] as const

export type MitreTactic = typeof MITRE_TACTICS[number]

export const MITRE_TECHNIQUES: MitreTechnique[] = [
  {
    id: 'T1110',
    name: 'Brute Force',
    tactic: 'Credential Access',
    detections: 187,
    risk: 92,
    confidence: 94,
    description:
      'Adversaries use brute force techniques to gain access to accounts when passwords are unknown or when password hashes are obtained. Without knowledge of the password for an account, an adversary may systematically guess the password using a repetitive or iterative mechanism.',
    evidence: [
      '187 failed authentication attempts against WIN-DC01 within 8 minutes',
      'Single source IP (185.220.101.42) responsible for 100% of attempts',
      'Attempts targeted built-in "administrator" account',
      'Requests spaced at consistent ~2.1s intervals, indicative of automated tooling',
    ],
    relatedAlertIds: ['ALR-2026-1042'],
    affectedHosts: ['WIN-DC01'],
    detectionRuleIds: ['AUTH-BRUTE-001'],
    recommendedResponse: [
      'Block source IP at perimeter firewall',
      'Temporarily disable targeted account',
      'Force password reset on affected accounts',
      'Review Windows Security Event ID 4625 history for related sources',
      'Enable account lockout policy if not already enforced',
    ],
  },
  {
    id: 'T1059.001',
    name: 'PowerShell',
    tactic: 'Execution',
    detections: 34,
    risk: 71,
    confidence: 88,
    description:
      'Adversaries abuse PowerShell commands and scripts for execution. PowerShell is a powerful interactive command-line interface and scripting environment included in the Windows operating system, offering native access to Windows APIs and .NET.',
    evidence: [
      'Encoded command execution observed on WIN-APP02 (svc_backup context)',
      'Base64-encoded payload decoded to reveal reflective assembly load',
      'Execution occurred outside of scheduled backup maintenance window',
      'Parent process: cmd.exe → powershell.exe -enc',
    ],
    relatedAlertIds: ['ALR-2026-1038'],
    affectedHosts: ['WIN-APP02'],
    detectionRuleIds: ['PS-EXEC-004'],
    recommendedResponse: [
      'Isolate WIN-APP02 from network pending investigation',
      'Capture full PowerShell ScriptBlock logs',
      'Disable svc_backup interactive logon rights',
      'Deploy Constrained Language Mode on application tier',
    ],
  },
  {
    id: 'T1046',
    name: 'Network Service Discovery',
    tactic: 'Discovery',
    detections: 52,
    risk: 48,
    confidence: 81,
    description:
      'Adversaries attempt to get a listing of services running on remote hosts, including those that may be vulnerable to remote software exploitation. Methods include port scans and vulnerability scans using tools brought onto the system.',
    evidence: [
      'TCP SYN scan detected across 254 hosts in 10.0.10.0/24 from KALI-ATTACKER',
      'Sequential port probing pattern on ports 22, 80, 135, 445, 3389',
      'Scan completed in 47 seconds — consistent with nmap default timing template',
    ],
    relatedAlertIds: ['ALR-2026-1035'],
    affectedHosts: ['KALI-ATTACKER'],
    detectionRuleIds: ['NET-SCAN-002'],
    recommendedResponse: [
      'Contain source host on VLAN segmentation',
      'Review firewall ACLs for unnecessary exposed services',
      'Correlate with subsequent exploitation attempts against scanned hosts',
    ],
  },
  {
    id: 'T1068',
    name: 'Exploitation for Privilege Escalation',
    tactic: 'Privilege Escalation',
    detections: 9,
    risk: 76,
    confidence: 79,
    description:
      'Adversaries may exploit software vulnerabilities in an attempt to elevate privileges. Exploitation of a software vulnerability occurs when an adversary takes advantage of a programming error in a program, service, or the OS software.',
    evidence: [
      'Local service token manipulation detected on WIN-APP02',
      'Process spawned with SYSTEM integrity from a Medium-integrity parent',
      'Correlates temporally with PS-EXEC-004 detection',
    ],
    relatedAlertIds: ['ALR-2026-1038'],
    affectedHosts: ['WIN-APP02'],
    detectionRuleIds: ['PRIV-ESC-003'],
    recommendedResponse: [
      'Apply latest security patches to affected host',
      'Audit local administrator group membership',
      'Review EDR telemetry for token impersonation indicators',
    ],
  },
  {
    id: 'T1204.002',
    name: 'Malicious File',
    tactic: 'Execution',
    detections: 6,
    risk: 58,
    confidence: 83,
    description:
      'Adversaries may rely on a user opening a malicious file in order to gain execution. Users may be subjected to social engineering to get them to open a file that will lead to code execution.',
    evidence: [
      'Suspicious binary "invoice_update.exe" executed from Downloads folder on WIN-WKS07',
      'Binary unsigned, packed, and matched known-bad hash reputation feed',
      'Dropped secondary payload to %TEMP% directory',
    ],
    relatedAlertIds: ['ALR-2026-1029'],
    affectedHosts: ['WIN-WKS07'],
    detectionRuleIds: ['MALWARE-007'],
    recommendedResponse: [
      'Quarantine and collect the binary for analysis',
      'Isolate host from network',
      'Search environment for matching file hash (IOC sweep)',
    ],
  },
  {
    id: 'T1021.001',
    name: 'Remote Desktop Protocol',
    tactic: 'Lateral Movement',
    detections: 4,
    risk: 54,
    confidence: 70,
    description:
      'Adversaries may use Valid Accounts to log into a computer using the Remote Desktop Protocol (RDP). The adversary may then perform actions as the logged-on user.',
    evidence: [
      'Interactive RDP session from WIN-APP02 to WIN-FILE01 outside business hours',
      'Session used cached credentials of svc_backup account',
    ],
    relatedAlertIds: [],
    affectedHosts: ['WIN-APP02', 'WIN-FILE01'],
    detectionRuleIds: ['AUTH-BRUTE-001'],
    recommendedResponse: [
      'Restrict RDP access via network-level authentication',
      'Enforce jump-host-only RDP policy',
      'Rotate svc_backup credentials',
    ],
  },
  {
    id: 'T1071.001',
    name: 'Web Protocols (C2)',
    tactic: 'Command and Control',
    detections: 3,
    risk: 62,
    confidence: 66,
    description:
      'Adversaries may communicate using application layer protocols associated with web traffic to avoid detection by blending in with existing traffic. Commands and data are often embedded within the protocol traffic between client and server.',
    evidence: [
      'Periodic beacon-like HTTPS traffic from WIN-APP02 to unrated external IP 91.243.58.19',
      'Fixed-interval callback pattern (60s ± 2s) matching known C2 jitter profile',
    ],
    relatedAlertIds: [],
    affectedHosts: ['WIN-APP02'],
    detectionRuleIds: [],
    recommendedResponse: [
      'Block destination IP at proxy/firewall',
      'Capture full packet payload for the session',
      'Deep-dive endpoint for persistence mechanisms',
    ],
  },
  {
    id: 'T1078',
    name: 'Valid Accounts',
    tactic: 'Initial Access',
    detections: 2,
    risk: 40,
    confidence: 60,
    description:
      'Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion.',
    evidence: [
      'Successful login for "administrator" from 185.220.101.42 following brute-force window',
      'Geolocation inconsistent with prior successful logins for this account',
    ],
    relatedAlertIds: ['ALR-2026-1042'],
    affectedHosts: ['WIN-DC01'],
    detectionRuleIds: [],
    recommendedResponse: [
      'Verify whether the successful login was legitimate',
      'Force immediate credential rotation',
      'Enable MFA for privileged accounts',
    ],
  },
]

export function techniquesByTactic(tactic: string) {
  return MITRE_TECHNIQUES.filter((t) => t.tactic === tactic)
}
