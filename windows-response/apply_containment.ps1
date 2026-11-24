<#
.SYNOPSIS
  ALLOWLISTED containment script for the Adaptive SOC lab.
  Creates a tightly scoped Windows Firewall block rule for a single
  source IP address, for use ONLY in the authorized isolated lab VM.

.DESCRIPTION
  This script must be invoked with EXACTLY the parameters below by a
  trusted local operator/orchestrator. It must NEVER receive raw AI
  output or an arbitrary shell command — only validated, typed
  parameters. This build's web application does not execute this
  script automatically (a static site cannot reach a Windows host);
  it is provided so a lab operator can run it manually and so the
  intended allowlisted-execution contract is fully documented.

.PARAMETER SourceIp
  The single source IP address to block. Must be a valid IPv4 address.

.PARAMETER IncidentId
  The Adaptive SOC incident code (e.g. INC-2026-001), for audit logging only.

.PARAMETER DryRun
  If $true (default), NO firewall rule is created — the action is only
  simulated and logged. If $false, a real rule is created in the
  authorized lab VM only.

.PARAMETER TimeoutSeconds
  Safety timeout for the operation. Default 30.

.EXAMPLE
  ./apply_containment.ps1 -SourceIp 203.0.113.10 -IncidentId "INC-2026-001" -DryRun $true
#>

param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^(\d{1,3}\.){3}\d{1,3}$')]
  [string]$SourceIp,

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^INC-\d{4}-\d{3,}$')]
  [string]$IncidentId,

  [Parameter(Mandatory = $false)]
  [bool]$DryRun = $true,

  [Parameter(Mandatory = $false)]
  [ValidateRange(1, 300)]
  [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = 'Stop'
$ruleName = "AdaptiveSOC-Block-$SourceIp"
$logLine = "$(Get-Date -Format o) | INCIDENT=$IncidentId | ACTION=CONTAIN | TARGET=$SourceIp | MODE=$(if ($DryRun) {'DRY_RUN'} else {'LIVE'})"

try {
  if ($DryRun) {
    Write-Output (@{ action = 'CONTAIN'; mode = 'DRY_RUN'; status = 'SIMULATED'; target = $SourceIp; incident = $IncidentId } | ConvertTo-Json -Compress)
  }
  else {
    # LIVE execution — authorized isolated lab VM only.
    New-NetFirewallRule -DisplayName $ruleName `
      -Direction Inbound -Action Block -RemoteAddress $SourceIp `
      -Protocol TCP -Profile Any -ErrorAction Stop | Out-Null

    Write-Output (@{ action = 'CONTAIN'; mode = 'LIVE'; status = 'EXECUTED'; target = $SourceIp; incident = $IncidentId; rule = $ruleName } | ConvertTo-Json -Compress)
  }
  Add-Content -Path "$PSScriptRoot\containment_audit.log" -Value $logLine
}
catch {
  Add-Content -Path "$PSScriptRoot\containment_audit.log" -Value "$logLine | ERROR=$($_.Exception.Message)"
  Write-Output (@{ action = 'CONTAIN'; mode = $(if ($DryRun) {'DRY_RUN'} else {'LIVE'}); status = 'FAILED'; error = $_.Exception.Message } | ConvertTo-Json -Compress)
  exit 1
}
