# Git-Aware Sync for Hostinger (Mapping to 'core' folder)
# This script maps project files to 'core/' and public files to root.

$sshHost = "217.21.74.44"
$sshPort = 65002
$sshUser = "u362580417"
$remoteRoot = "/home/u362580417/domains/dhanvanthrifoods.com/public_html"

# SSH arguments for bypassing prompts
$sshArgs = @("-o", "StrictHostKeyChecking=no")

Write-Host "--- Starting Clean Git-Aware Sync (with Core Mapping) ---" -ForegroundColor Cyan

# 1. Get changed files from Git and filter out utility/frontend files
$gitFiles = git status --porcelain | ForEach-Object { 
    $line = $_.Trim()
    if ($line -notmatch '^D ') { # Skip deleted files
        $parts = $line -split '\s+', 2
        if ($parts.Count -eq 2) {
            $file = $parts[1]
            $exclude = $false
            $patterns = @("\.ps1$", "\.bat$", "\.tar\.gz$", "\.zip$", "^node_modules/", "^vendor/", "^scratch/", "^temp/", "^\.git/", "^frontend/")
            foreach ($p in $patterns) {
                if ($file -match $p) { $exclude = $true; break }
            }

            # EXCEPTION: Always allow this specific vendor fix
            if ($file -match "CoreComponentRepository\.php$") { $exclude = $false }

            if (-not $exclude) { $file }
        }
    }
}

# FORCE: Always include the neutralized licensing fix in the sync list
$licensingFix = "vendor/mehedi-iitdu/core-component-repository/src/CoreComponentRepository.php"
if ($gitFiles -notcontains $licensingFix) {
    if ($null -eq $gitFiles) { $gitFiles = @($licensingFix) }
    else { $gitFiles += $licensingFix }
}

if ($null -eq $gitFiles -or $gitFiles.Count -eq 0) {
    Write-Host "No project changes detected to sync." -ForegroundColor Yellow
    exit
}

Write-Host "Detected $($gitFiles.Count) project files to sync:"
foreach ($f in $gitFiles) { Write-Host "  $f" -ForegroundColor Gray }

foreach ($relativePath in $gitFiles) {
    $localRelativePath = $relativePath.Replace('/', '\')
    $localPath = Join-Path (Get-Location) $localRelativePath
    
    if (Test-Path $localPath -PathType Leaf) {
        # --- MAPPING LOGIC ---
        if ($relativePath.StartsWith("public/")) {
            # Files in 'public/' go to the root (e.g. public/favicon.png -> public_html/favicon.png)
            $cleanRelative = $relativePath -replace '^public/', ''
            $remoteFile = "$remoteRoot/$cleanRelative"
        } else {
            # Everything else goes into 'core/' (e.g. app/Admin.php -> public_html/core/app/Admin.php)
            $remoteFile = "$remoteRoot/core/$relativePath"
        }
        
        $remoteDir = Split-Path $remoteFile -Parent
        
        Write-Host "Updating: $relativePath -> $remoteFile ..." -NoNewline
        
        try {
            # Ensure remote directory exists
            ssh -p $sshPort @sshArgs "${sshUser}@${sshHost}" "mkdir -p '$remoteDir'"
            
            # Upload file directly to its folder
            scp -P $sshPort @sshArgs "$localPath" "${sshUser}@${sshHost}:${remoteFile}"
            
            Write-Host " Done." -ForegroundColor Green
        } catch {
            Write-Host " Failed!" -ForegroundColor Red
            Write-Host " Error: $($_.Exception.Message)" -ForegroundColor Gray
        }
    }
}

Write-Host "Clearing server cache (in core)..."
ssh -p $sshPort @sshArgs "${sshUser}@${sshHost}" "cd $remoteRoot/core && php artisan optimize:clear"

Write-Host "--- Sync Complete! ---" -ForegroundColor Green
