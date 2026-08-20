<#
.SYNOPSIS
    Deploy and verify the AGASSOCIATES WhatsApp Connect feature.
.DESCRIPTION
    Commits only real changes, pushes main, waits for the public API, then
    requests a QR session and polls it after the operator scans the QR code.

    This script never prints or stores the API key.
#>

param(
    [string]$RepoPath = "E:\DSH\AGASSOCIATES",
    [string]$ApiBaseUrl = "https://api.advadiityagade.com",
    [string]$N8nWebhookKey = $env:N8N_WEBHOOK_KEY,
    [int]$HealthWaitSeconds = 1200,
    [int]$QrPollSeconds = 120,
    [switch]$SkipPush,
    [switch]$SkipQr
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [ValidateSet("INFO", "WARN", "ERROR", "SUCCESS")][string]$Level = "INFO")
    $colors = @{ INFO = "Cyan"; WARN = "Yellow"; ERROR = "Red"; SUCCESS = "Green" }
    Write-Host ("[{0}] [{1}] {2}" -f (Get-Date -Format "HH:mm:ss"), $Level, $Message) -ForegroundColor $colors[$Level]
}

function Invoke-Git {
    param([Parameter(Mandatory)][string[]]$Arguments)
    & git -C $RepoPath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

function Commit-IfChanged {
    param([Parameter(Mandatory)][string[]]$Paths, [Parameter(Mandatory)][string]$Message)
    Invoke-Git -Arguments (@("add", "--") + $Paths)
    & git -C $RepoPath diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Log "No staged changes for: $($Paths -join ', ')" "INFO"
        return
    }
    Invoke-Git @("commit", "-m", $Message, "-m", "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>")
    Write-Log "Committed: $Message" "SUCCESS"
}

function Get-ApiHeaders {
    if ([string]::IsNullOrWhiteSpace($N8nWebhookKey)) {
        throw "N8N_WEBHOOK_KEY is required. Set it in the environment before running."
    }
    return @{ "x-api-key" = $N8nWebhookKey }
}

Set-Location $RepoPath
Write-Log "Starting AGASSOCIATES WhatsApp deployment"
Write-Log "Repository: $RepoPath"
Write-Log "API: $ApiBaseUrl"

if ((git -C $RepoPath status --porcelain) -match "deploy-whatsapp.ps1") {
    Commit-IfChanged @("deploy-whatsapp.ps1") "chore: add WhatsApp deployment verifier"
}

Write-Log "Auditing repository"
Invoke-Git @("status", "-sb")
Invoke-Git @("log", "-5", "--oneline", "--decorate")

if (-not $SkipPush) {
    Write-Log "Synchronizing and pushing main"
    Invoke-Git @("pull", "--rebase", "origin", "main")
    Invoke-Git @("push", "origin", "main")
} else {
    Write-Log "Push skipped by request" "WARN"
}

if ($SkipQr) {
    Write-Log "Deployment verification complete; QR flow skipped" "SUCCESS"
    exit 0
}

$headers = Get-ApiHeaders
$healthEndpoints = @(
    "$ApiBaseUrl/health",
    "$ApiBaseUrl/health/deep",
    "$ApiBaseUrl/api/whatsapp/directConnect/qr"
)

Write-Log "Waiting up to $HealthWaitSeconds seconds for CI/CD deployment and API health"
$deadline = (Get-Date).AddSeconds($HealthWaitSeconds)
do {
    $healthy = $true
    foreach ($endpoint in $healthEndpoints) {
        try {
            $response = Invoke-RestMethod -Uri $endpoint -Headers $headers -TimeoutSec 20
            $status = [string]$response.status
            if ($status -notin @("ok", "healthy", "awaiting_scan")) {
                $healthy = $false
                Write-Log "$endpoint returned status '$status'" "WARN"
            } else {
                Write-Log "$endpoint is healthy" "SUCCESS"
            }
        } catch {
            $healthy = $false
            Write-Log "$endpoint is not reachable yet" "WARN"
        }
    }
    if ($healthy) { break }
    Start-Sleep -Seconds 15
} while ((Get-Date) -lt $deadline)

if (-not $healthy) {
    throw "Deployment did not become healthy before the timeout. Check GitHub Actions and VPS logs."
}

Write-Log "Requesting WhatsApp QR session"
$qr = Invoke-RestMethod -Uri "$ApiBaseUrl/api/whatsapp/directConnect/qr" -Headers $headers -TimeoutSec 30
if ([string]::IsNullOrWhiteSpace([string]$qr.qr) -or [string]::IsNullOrWhiteSpace([string]$qr.session_id)) {
    throw "QR endpoint returned an invalid response."
}

$sessionId = [string]$qr.session_id
$qrData = ([string]$qr.qr) -replace "^data:image/png;base64,", ""
$qrPath = Join-Path $env:TEMP ("whatsapp_qr_{0}.png" -f $sessionId)
[IO.File]::WriteAllBytes($qrPath, [Convert]::FromBase64String($qrData))
Write-Log "QR saved to $qrPath" "SUCCESS"
Start-Process $qrPath
Write-Log "Scan the QR in WhatsApp: Linked Devices -> Link a Device"

$pollDeadline = (Get-Date).AddSeconds($QrPollSeconds)
do {
    Start-Sleep -Seconds 3
    $session = $null
    try {
        $session = Invoke-RestMethod -Uri "$ApiBaseUrl/api/whatsapp/directConnect/status/$sessionId" -Headers $headers -TimeoutSec 20
    } catch {
        if ((Get-Date) -ge $pollDeadline) { throw }
        Write-Log "Status poll failed; retrying" "WARN"
    }
    if ($null -ne $session) {
        Write-Log "WhatsApp session status: $($session.status)"
        if ($session.status -eq "connected") {
            Write-Log "WhatsApp connected successfully" "SUCCESS"
            break
        }
        if ($session.status -in @("expired", "error")) {
            throw "WhatsApp session ended with status '$($session.status)'."
        }
    }
} while ((Get-Date) -lt $pollDeadline)

if ((Get-Date) -ge $pollDeadline) {
    throw "QR polling timed out. Re-run the script to create a new session."
}

Write-Log "Verify the Office UI at https://app.advadiityagade.com/office" "SUCCESS"
