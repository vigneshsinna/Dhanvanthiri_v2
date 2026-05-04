# Hybrid Sync for Hostinger (Individual Backend + Zipped Frontend)
# Backend -> core/ (Individual)
# Frontend -> app/ (Zipped for speed)

$sshHost = "217.21.74.44"
$sshPort = 65002
$sshUser = "u362580417"
$remoteRoot = "/home/u362580417/domains/dhanvanthrifoods.com/public_html"
$sshArgs = @("-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=15")

Write-Host "--- Starting Hybrid Backend & Frontend Sync ---" -ForegroundColor Cyan

# --- 1. BACKEND SYNC (Individual files from Git) ---
$backendFiles = git status --porcelain | ForEach-Object { 
    $line = $_.Trim()
    if ($line -notmatch '^D ') { 
        $parts = $line -split '\s+', 2
        if ($parts.Count -eq 2) {
            $file = $parts[1]
            # Exclude utility files and frontend folder (we handle frontend separately)
            $patterns = @("\.ps1$", "\.bat$", "\.tar\.gz$", "\.zip$", "^node_modules/", "^scratch/", "^temp/", "^\.git/", "^frontend/")
            $exclude = $false
            foreach ($p in $patterns) { if ($file -match $p) { $exclude = $true; break } }
            if (-not $exclude) { $file }
        }
    }
}

# Always include the licensing fix
$licensingFix = "vendor/mehedi-iitdu/core-component-repository/src/CoreComponentRepository.php"
if ($backendFiles -notcontains $licensingFix) {
    if ($null -eq $backendFiles) { $backendFiles = @($licensingFix) }
    else { $backendFiles += $licensingFix }
}

if ($backendFiles.Count -gt 0) {
    Write-Host "Syncing $($backendFiles.Count) Backend files individually..." -ForegroundColor Yellow
    foreach ($relativePath in $backendFiles) {
        $localPath = Join-Path (Get-Location) ($relativePath.Replace('/', '\'))
        if (Test-Path $localPath -PathType Leaf) {
            if ($relativePath.StartsWith("public/")) {
                $cleanRelative = $relativePath -replace '^public/', ''
                $remoteFile = "$remoteRoot/$cleanRelative"
            } else {
                $remoteFile = "$remoteRoot/core/$relativePath"
            }
            $remoteDir = (Split-Path $remoteFile -Parent).Replace('\', '/')
            $remoteFile = $remoteFile.Replace('\', '/')
            
            Write-Host "  $relativePath -> Done." -ForegroundColor Gray
            ssh -p $sshPort @sshArgs "${sshUser}@${sshHost}" "mkdir -p '$remoteDir'"
            scp -P $sshPort @sshArgs "$localPath" "${sshUser}@${sshHost}:${remoteFile}"
            Start-Sleep -Milliseconds 500
        }
    }
}

# --- 2. FRONTEND SYNC (Zipped for Speed) ---
if (Test-Path "frontend/dist") {
    Write-Host "Syncing Frontend (Zipped Mode)..." -ForegroundColor Yellow
    
    # Bundle frontend/dist into a tar.gz (Tar is better for Linux)
    if (Test-Path "frontend.tar.gz") { Remove-Item "frontend.tar.gz" }
    
    # We use tar.exe to ensure forward slashes and Linux compatibility
    Set-Location "frontend/dist"
    tar.exe -czf ../../frontend.tar.gz .
    Set-Location ../..
    
    Write-Host "  Uploading frontend.tar.gz ..." -ForegroundColor Gray
    scp -P $sshPort @sshArgs "frontend.tar.gz" "${sshUser}@${sshHost}:${remoteRoot}/app/frontend.tar.gz"
    
    Write-Host "  Extracting on server ..." -ForegroundColor Gray
    $extractCmd = "cd ${remoteRoot}/app && tar -xzf frontend.tar.gz --overwrite && rm frontend.tar.gz"
    ssh -p $sshPort @sshArgs "${sshUser}@${sshHost}" $extractCmd
    
    Remove-Item "frontend.tar.gz"
    Write-Host "  Frontend sync complete!" -ForegroundColor Green
}

# --- 3. CACHE CLEAR ---
Write-Host "Clearing server cache..."
ssh -p $sshPort @sshArgs "${sshUser}@${sshHost}" "cd $remoteRoot/core && php artisan optimize:clear"

Write-Host "--- Hybrid Sync Complete! ---" -ForegroundColor Green
