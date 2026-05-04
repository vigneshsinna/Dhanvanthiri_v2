# Git-Aware Sync for Hostinger (Backend + Frontend)
# Maps Backend to 'core/' and Frontend to 'app/'

$sshHost = "217.21.74.44"
$sshPort = 65002
$sshUser = "u362580417"
$remoteRoot = "/home/u362580417/domains/dhanvanthrifoods.com/public_html"
$sshArgs = @("-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=15")

Write-Host "--- Starting Backend & Frontend Sync ---" -ForegroundColor Cyan

# 1. Get changed files from Git
$gitFiles = git status --porcelain | ForEach-Object { 
    $line = $_.Trim()
    if ($line -notmatch '^D ') { 
        $parts = $line -split '\s+', 2
        if ($parts.Count -eq 2) {
            $file = $parts[1]
            $exclude = $false
            # Exclude unwanted patterns (But ALLOW frontend/dist)
            $patterns = @("\.ps1$", "\.bat$", "\.tar\.gz$", "\.zip$", "^node_modules/", "^scratch/", "^temp/", "^\.git/")
            foreach ($p in $patterns) { if ($file -match $p) { $exclude = $true; break } }
            
            # Special case for frontend: only allow 'dist' files
            if ($file.StartsWith("frontend/")) {
                if ($file -notmatch "^frontend/dist/") { $exclude = $true }
            }
            
            if (-not $exclude) { $file }
        }
    }
}

# Always include the licensing fix
$licensingFix = "vendor/mehedi-iitdu/core-component-repository/src/CoreComponentRepository.php"
if ($gitFiles -notcontains $licensingFix) {
    if ($null -eq $gitFiles) { $gitFiles = @($licensingFix) }
    else { $gitFiles += $licensingFix }
}

if ($null -eq $gitFiles -or $gitFiles.Count -eq 0) {
    Write-Host "No changes detected." -ForegroundColor Yellow
    exit
}

Write-Host "Detected $($gitFiles.Count) files to sync."

foreach ($relativePath in $gitFiles) {
    $localPath = Join-Path (Get-Location) ($relativePath.Replace('/', '\'))
    
    if (Test-Path $localPath -PathType Leaf) {
        # --- MAPPING LOGIC ---
        if ($relativePath.StartsWith("public/")) {
            # public/favicon.png -> public_html/favicon.png
            $cleanRelative = $relativePath -replace '^public/', ''
            $remoteFile = "$remoteRoot/$cleanRelative"
        } elseif ($relativePath.StartsWith("frontend/dist/")) {
            # frontend/dist/index.html -> public_html/app/index.html
            $cleanRelative = $relativePath -replace '^frontend/dist/', ''
            $remoteFile = "$remoteRoot/app/$cleanRelative"
        } else {
            # app/Controllers/... -> public_html/core/app/Controllers/...
            $remoteFile = "$remoteRoot/core/$relativePath"
        }
        
        $remoteDir = Split-Path $remoteFile -Parent
        $remoteFile = $remoteFile.Replace('\', '/')
        $remoteDir = $remoteDir.Replace('\', '/')
        
        Write-Host "Syncing: $relativePath -> $remoteFile" -ForegroundColor Gray
        
        try {
            ssh -p $sshPort @sshArgs "${sshUser}@${sshHost}" "mkdir -p '$remoteDir'"
            scp -P $sshPort @sshArgs "$localPath" "${sshUser}@${sshHost}:${remoteFile}"
            Start-Sleep -Milliseconds 800
        } catch {
            Write-Host "  Error syncing $relativePath: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "Clearing server cache..."
ssh -p $sshPort @sshArgs "${sshUser}@${sshHost}" "cd $remoteRoot/core && php artisan optimize:clear"

Write-Host "--- Sync Complete! ---" -ForegroundColor Green
