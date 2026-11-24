<#
.SYNOPSIS
  ALLOWLISTED script to verify whether a containment firewall rule is
  currently active for a given source IP, for the Verification Engine.

.PARAMETER SourceIp
  The source IP to check.

.PARAMETER IncidentId
  Incident code for audit logging.
#>

param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^(\d{1,3}\.){3}\d{1,3}$')]
  [string]$SourceIp,

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^INC-\d{4}-\d{3,}$')]
  [string]$IncidentId
)

$ErrorActionPreference = 'Stop'
$ruleName = "AdaptiveSOC-Block-$SourceIp"

try {
  $rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
  $active = $null -ne $rule
  Write-Output (@{ action = 'VERIFY_CONTAINMENT'; target = $SourceIp; incident = $IncidentId; active = $active } | ConvertTo-Json -Compress)
  Add-Content -Path "$PSScriptRoot\containment_audit.log" -Value "$(Get-Date -Format o) | INCIDENT=$IncidentId | ACTION=VERIFY | TARGET=$SourceIp | ACTIVE=$active"
}
catch {
  Write-Output (@{ action = 'VERIFY_CONTAINMENT'; status = 'FAILED'; error = $_.Exception.Message } | ConvertTo-Json -Compress)
  exit 1
}
