<#
.SYNOPSIS
  ALLOWLISTED script to remove a previously applied containment rule.

.PARAMETER SourceIp
  The source IP whose block rule should be removed.

.PARAMETER IncidentId
  Incident code for audit logging.

.PARAMETER DryRun
  If $true (default), no rule is removed — action is simulated only.
#>

param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^(\d{1,3}\.){3}\d{1,3}$')]
  [string]$SourceIp,

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^INC-\d{4}-\d{3,}$')]
  [string]$IncidentId,

  [Parameter(Mandatory = $false)]
  [bool]$DryRun = $true
)

$ErrorActionPreference = 'Stop'
$ruleName = "AdaptiveSOC-Block-$SourceIp"
$logLine = "$(Get-Date -Format o) | INCIDENT=$IncidentId | ACTION=REMOVE_CONTAINMENT | TARGET=$SourceIp | MODE=$(if ($DryRun) {'DRY_RUN'} else {'LIVE'})"

try {
  if ($DryRun) {
    Write-Output (@{ action = 'REMOVE_CONTAINMENT'; mode = 'DRY_RUN'; status = 'SIMULATED'; target = $SourceIp } | ConvertTo-Json -Compress)
  }
  else {
    Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    Write-Output (@{ action = 'REMOVE_CONTAINMENT'; mode = 'LIVE'; status = 'EXECUTED'; target = $SourceIp } | ConvertTo-Json -Compress)
  }
  Add-Content -Path "$PSScriptRoot\containment_audit.log" -Value $logLine
}
catch {
  Add-Content -Path "$PSScriptRoot\containment_audit.log" -Value "$logLine | ERROR=$($_.Exception.Message)"
  Write-Output (@{ action = 'REMOVE_CONTAINMENT'; status = 'FAILED'; error = $_.Exception.Message } | ConvertTo-Json -Compress)
  exit 1
}
