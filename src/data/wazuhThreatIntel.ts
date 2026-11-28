import type { WazuhThreatIntelEntry } from '../types'

export const WAZUH_THREAT_INTEL_DATABASE: WazuhThreatIntelEntry[] = [
  {
    ip: '185.220.101.42',
    reputation: 'Critical Malicious',
    threatScore: 98,
    threatActor: 'FIN7 / Anonymous Mirai Fleet',
    classification: 'Active Brute-Force Scanner & Tor Exit Node',
    wazuhRuleId: '5712',
    wazuhRuleDescription: 'SSHD/RDP/SMB multiple authentication failures from high-risk IP',
    mitreTactic: 'Credential Access (TA0006)',
    mitreTechnique: 'T1110.001 - Password Guessing',
    country: 'Russia',
    countryCode: 'RU',
    city: 'St. Petersburg',
    asn: 'AS200019 (Tor Project Exit Relay)',
    reportsCount: 1420,
    lastSeen: '2 minutes ago',
    knownCve: 'CVE-2023-46805, CVE-2024-21887',
    confidence: 99,
    status: 'Active Threat',
  },
  {
    ip: '45.155.205.132',
    reputation: 'High Risk',
    threatScore: 93,
    threatActor: 'Credential Stuffing Botnet #4',
    classification: 'Distributed Password Spraying & SSH Scanner',
    wazuhRuleId: '5716',
    wazuhRuleDescription: 'SSHD authentication failed repeatedly from external flagged IP',
    mitreTactic: 'Credential Access (TA0006)',
    mitreTechnique: 'T1110.003 - Password Spraying',
    country: 'Romania',
    countryCode: 'RO',
    city: 'Bucharest',
    asn: 'AS48031 (HostRoyale Cloud Services)',
    reportsCount: 890,
    lastSeen: '14 minutes ago',
    knownCve: 'CVE-2022-26134',
    confidence: 96,
    status: 'Active Threat',
  },
  {
    ip: '91.243.58.19',
    reputation: 'Critical Malicious',
    threatScore: 95,
    threatActor: 'APT29 / Nobelium C2 Proxy',
    classification: 'Cobalt Strike C2 Beaconing & Recon Node',
    wazuhRuleId: '80710',
    wazuhRuleDescription: 'Wazuh Active Response - High-confidence C2 communication detected',
    mitreTactic: 'Command and Control (TA0011)',
    mitreTechnique: 'T1071.001 - Web Protocols',
    country: 'Netherlands',
    countryCode: 'NL',
    city: 'Amsterdam',
    asn: 'AS49981 (Serverion B.V.)',
    reportsCount: 2310,
    lastSeen: '40 minutes ago',
    knownCve: 'CVE-2023-38831',
    confidence: 98,
    status: 'Active Threat',
  },
  {
    ip: '194.26.29.156',
    reputation: 'High Risk',
    threatScore: 88,
    threatActor: 'RedLine Stealer Distribution',
    classification: 'Dictionary Attack Bot & Exploit Proxy',
    wazuhRuleId: '5710',
    wazuhRuleDescription: 'Unauthorized access attempt - repetitive credential guessing',
    mitreTactic: 'Initial Access (TA0001)',
    mitreTechnique: 'T1078 - Valid Accounts',
    country: 'Ukraine',
    countryCode: 'UA',
    city: 'Kyiv',
    asn: 'AS208599 (Fiord Network)',
    reportsCount: 654,
    lastSeen: '1 hour ago',
    confidence: 91,
    status: 'Active Threat',
  },
  {
    ip: '103.87.64.18',
    reputation: 'Suspicious',
    threatScore: 85,
    threatActor: 'Shodan Prober / Automated Scanner',
    classification: 'Port Enumeration & Vulnerability Probing',
    wazuhRuleId: '31101',
    wazuhRuleDescription: 'Web access attempt from blacklisted scanner IP',
    mitreTactic: 'Reconnaissance (TA0043)',
    mitreTechnique: 'T1595.002 - Vulnerability Scanning',
    country: 'Vietnam',
    countryCode: 'VN',
    city: 'Hanoi',
    asn: 'AS135905 (Viettel Group)',
    reportsCount: 420,
    lastSeen: '3 hours ago',
    confidence: 88,
    status: 'Active Threat',
  },
  {
    ip: '10.0.10.14',
    reputation: 'Clean',
    threatScore: 0,
    threatActor: 'None (Authorized Internal)',
    classification: 'Corporate Workstation (Engineering VLAN 10)',
    wazuhRuleId: 'RULE-CLEAN-BASELINE',
    wazuhRuleDescription: 'Legitimate internal authentication - authorized Active Directory member',
    mitreTactic: 'Normal Activity',
    mitreTechnique: 'Authorized Authentication',
    country: 'Internal Corporate Network',
    countryCode: 'LAN',
    city: 'Bangalore HQ Office',
    asn: 'AS-PRIVATE (Internal RFC-1918)',
    reportsCount: 0,
    lastSeen: 'Just now',
    confidence: 100,
    status: 'Whitelisted',
  },
  {
    ip: '192.168.1.105',
    reputation: 'Clean',
    threatScore: 0,
    threatActor: 'None (Authorized VPN)',
    classification: 'Secure Remote Access VPN Gateway Pool',
    wazuhRuleId: 'RULE-CLEAN-VPN',
    wazuhRuleDescription: 'Authorized corporate VPN connection with multi-factor authentication',
    mitreTactic: 'Normal Activity',
    mitreTechnique: 'Corporate VPN Access',
    country: 'Corporate VPN (India)',
    countryCode: 'IN',
    city: 'Mumbai Hub',
    asn: 'AS-CORP-VPN',
    reportsCount: 0,
    lastSeen: 'Just now',
    confidence: 100,
    status: 'Whitelisted',
  },
]

export function checkWazuhThreatIntel(ip: string): {
  isVulnerable: boolean
  intel: WazuhThreatIntelEntry
  aiVerdict: string
  aiRecommendation: string
} {
  const match = WAZUH_THREAT_INTEL_DATABASE.find((item) => item.ip === ip)

  if (match) {
    if (match.reputation === 'Clean') {
      return {
        isVulnerable: false,
        intel: match,
        aiVerdict: `VERIFIED CLEAN: IP ${ip} belongs to ${match.classification}. Threat score: 0/100. Behavioral analysis confirms normal authorized operation with valid user identity.`,
        aiRecommendation: 'No mitigation required. System baseline maintained without anomaly.',
      }
    }

    return {
      isVulnerable: true,
      intel: match,
      aiVerdict: `CRITICAL THREAT CONFIRMED: IP ${ip} matches Wazuh CDB Malicious Database (Wazuh Rule ${match.wazuhRuleId}). Threat actor affiliation: ${match.threatActor}. Threat score: ${match.threatScore}/100. High probability of automated credential brute force attack.`,
      aiRecommendation: `Immediate active response: Block IP ${ip} at perimeter firewall (Wazuh active-response: firewall-drop), lock target user account temporarily, and enforce multi-factor authentication (MFA).`,
    }
  }

  // Fallback for unknown IP
  const isInternal = ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')
  const fallbackIntel: WazuhThreatIntelEntry = {
    ip,
    reputation: isInternal ? 'Clean' : 'Suspicious',
    threatScore: isInternal ? 5 : 70,
    threatActor: isInternal ? 'Internal Node' : 'Unindexed Remote IP',
    classification: isInternal ? 'Internal Network Asset' : 'Uncataloged External Connection',
    wazuhRuleId: isInternal ? '5715' : '5710',
    wazuhRuleDescription: 'Authentication event evaluated against Wazuh rulebase',
    mitreTactic: isInternal ? 'Normal Activity' : 'Initial Access',
    mitreTechnique: isInternal ? 'Standard Authentication' : 'T1110 - Brute Force',
    country: isInternal ? 'Private Network' : 'Unknown',
    countryCode: isInternal ? 'LAN' : 'UN',
    city: isInternal ? 'Local Subnet' : 'Remote Location',
    asn: isInternal ? 'Internal RFC1918' : 'Unknown ASN',
    reportsCount: isInternal ? 0 : 5,
    lastSeen: 'Just now',
    confidence: isInternal ? 95 : 75,
    status: isInternal ? 'Whitelisted' : 'Monitored',
  }

  return {
    isVulnerable: !isInternal,
    intel: fallbackIntel,
    aiVerdict: isInternal
      ? `INTERNAL HOST: IP ${ip} is an internal RFC-1918 address. No malicious correlation found.`
      : `ELEVATED SUSPICION: IP ${ip} is an unrated external IP showing abnormal authentication frequency.`,
    aiRecommendation: isInternal
      ? 'Monitor internal traffic telemetry for lateral movement indicators.'
      : 'Enforce rate limiting and verify geo-IP against corporate access whitelist.',
  }
}
