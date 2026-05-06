# Reliable Git-Aware Sync for Hostinger (Single Bundle Method)
# This is the ONLY method that prevents the server from hanging/rate-limiting.

$sshHost = "217.21.74.44"
$sshPort = 65002
$sshUser = "u362580417"
$remoteRoot = "/home/u362580417/domains/dhanvanthrifoods.com/public_html"
$sshArgs = @("-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=15")

Write-Host "--- Starting Reliable Combined Sync ---" -ForegroundColor Cyan

# 1. Get changed files from Git
$gitFiles = git status --porcelain | ForEach-Object { 
    $line = $_.Trim()
    if ($line -notmatch '^D ') { 
        $parts = $line -split '\s+', 2
        if ($parts.Count -eq 2) {
            $file = $parts[1]
            $exclude = $false
            $patterns = @("\.ps1$", "\.bat$", "\.tar\.gz$", "\.zip$", "^node_modules/", "^scratch/", "^temp/", "^\.git/", "^frontend/")
            foreach ($p in $patterns) { if ($file -match $p) { $exclude = $true; break } }
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

Write-Host "1. Bundling all changes..." -ForegroundColor Yellow

$staging = "temp_sync_staging"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

# Copy Backend files to staging
foreach ($f in $gitFiles) {
    Write-Host "  - $f" -ForegroundColor Gray
    if ($f.StartsWith("public/")) {
        $relDest = $f -replace '^public/', ''
    } else {
        $relDest = "core/$f"
    }
    $localDest = Join-Path $staging ($relDest.Replace('/', '\'))
    $parent = Split-Path $localDest -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent | Out-Null }
    Copy-Item $f $localDest -Force
}

# Copy Frontend files to staging
if (Test-Path "frontend/dist") {
    Write-Host "  - Entire frontend/dist folder" -ForegroundColor Gray
    $frontendStaging = Join-Path $staging "app"
    New-Item -ItemType Directory -Path $frontendStaging | Out-Null
    Copy-Item "frontend/dist/*" $frontendStaging -Recurse -Force
}

# Create the TAR bundle (Linux-friendly)
if (Test-Path "sync.tar.gz") { Remove-Item "sync.tar.gz" }
Set-Location $staging
tar.exe -czf ../sync.tar.gz .
Set-Location ..

Remove-Item $staging -Recurse -Force

Write-Host "2. Uploading 'sync.tar.gz' (Single Connection)..." -ForegroundColor Yellow
scp -P $sshPort @sshArgs "sync.tar.gz" "${sshUser}@${sshHost}:${remoteRoot}/sync.tar.gz"

Write-Host "3. Extracting, clearing cache, and running migrations..." -ForegroundColor Yellow
$remoteCmd = "cd ${remoteRoot} && tar -xzf sync.tar.gz --overwrite && rm sync.tar.gz && cd core && php artisan optimize:clear && php artisan migrate --force"
ssh -p $sshPort @sshArgs "${sshUser}@${sshHost}" $remoteCmd

if (Test-Path "sync.tar.gz") { Remove-Item "sync.tar.gz" }

Write-Host "--- Sync Complete! No more hangs. ---" -ForegroundColor Green
