# Advanced Hybrid Sync for Hostinger (with Interactive Frontend Build)
# Corrects the "app/" folder ambiguity and provides an optional frontend build step.

$sshHost = "217.21.74.44"
$sshPort = 65002
$sshUser = "u362580417"
$remoteRoot = "/home/u362580417/domains/dhanvanthrifoods.com/public_html"
$sshArgs = @("-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=15")

Write-Host "--- Hostinger Sync Tool ---" -ForegroundColor Cyan

# --- 1. Interactive Build Step ---
$buildChoice = Read-Host "Do you want to build the frontend? (y/n)"
$syncFrontend = $false

if ($buildChoice -eq "y" -or $buildChoice -eq "yes") {
    Write-Host "Building frontend... this may take a moment." -ForegroundColor Yellow
    Set-Location frontend
    npm run build
    Set-Location ..
    $syncFrontend = $true
    Write-Host "Build Complete!" -ForegroundColor Green
} else {
    Write-Host "Skipping frontend build. Only backend files will be synced." -ForegroundColor Gray
}

Write-Host "--- Starting Sync Process ---" -ForegroundColor Cyan

# 2. Get changed files from Git
$gitFiles = @(git status --porcelain | ForEach-Object { 
    $line = $_.Trim()
    if ($line -notmatch '^D ') { 
        $parts = $line -split '\s+', 2
        if ($parts.Count -eq 2) {
            $file = $parts[1].Trim('"')
            $exclude = $false
            
            # Basic exclusions
            $patterns = @("\.ps1$", "\.bat$", "\.tar\.gz$", "\.zip$", "^node_modules/", "^scratch/", "^temp/", "^\.git/", "^frontend/")
            foreach ($p in $patterns) { if ($file -match $p) { $exclude = $true; break } }
            
            if (-not $exclude) { $file }
        }
    }
})

# Always include the licensing fix
$licensingFix = "vendor/mehedi-iitdu/core-component-repository/src/CoreComponentRepository.php"
if ($gitFiles -notcontains $licensingFix) {
    $gitFiles = @($gitFiles) + $licensingFix
}

Write-Host "1. Bundling changes..." -ForegroundColor Yellow

$staging = "temp_sync_staging"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

$backendDirs = @("Http", "Models", "Console", "Exceptions", "Providers", "Support", "Services", "Rules", "Traits", "Utility", "Notifications", "Mail")

# Mapping Logic
foreach ($f in $gitFiles) {
    $isFrontendFile = $false
    
    # Identify if it's a frontend file inside app/ or root
    if ($f.StartsWith("app/")) {
        $isBackendDir = $false
        foreach ($dir in $backendDirs) {
            if ($f.StartsWith("app/$dir/")) { $isBackendDir = $true; break }
        }
        if (-not $isBackendDir) { $isFrontendFile = $true }
    } elseif ($f -match "index\.html$" -or $f -match "robots\.txt$" -or $f -match "sitemap\.xml$") {
        $isFrontendFile = $true
    }

    # If user said "No" to frontend, skip these files
    if ($isFrontendFile -and -not $syncFrontend) {
        continue
    }

    Write-Host "  - $f" -ForegroundColor Gray
    
    $relDest = ""
    if ($f.StartsWith("public/")) {
        $relDest = $f -replace '^public/', ''
    } elseif ($f.StartsWith("app/")) {
        if ($isFrontendFile) {
            $relDest = $f # Goes to public_html/app/
        } else {
            $relDest = "core/$f" # Goes to public_html/core/app/
        }
    } else {
        $relDest = "core/$f"
    }

    $localDest = Join-Path $staging ($relDest.Replace('/', '\'))
    $parent = Split-Path $localDest -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent | Out-Null }
    Copy-Item $f $localDest -Force
}

# Optional: Add files from frontend/dist if they exist and user chose frontend
if ($syncFrontend -and (Test-Path "frontend/dist")) {
    Write-Host "  - Including frontend/dist files" -ForegroundColor Gray
    $frontendStaging = Join-Path $staging "app"
    if (-not (Test-Path $frontendStaging)) { New-Item -ItemType Directory -Path $frontendStaging | Out-Null }
    Copy-Item "frontend/dist/*" $frontendStaging -Recurse -Force
}

if (!(Get-ChildItem $staging)) {
    Write-Host "No files to sync." -ForegroundColor Yellow
    Remove-Item $staging -Recurse -Force
    exit
}

# Create the TAR bundle
if (Test-Path "sync.tar.gz") { Remove-Item "sync.tar.gz" }
Set-Location $staging
tar.exe -czf ../sync.tar.gz .
Set-Location ..

Remove-Item $staging -Recurse -Force

Write-Host "2. Uploading and deploying..." -ForegroundColor Yellow
scp -P $sshPort @sshArgs "sync.tar.gz" "${sshUser}@${sshHost}:${remoteRoot}/sync.tar.gz"

$remoteCmd = "cd ${remoteRoot} && tar -xzf sync.tar.gz --overwrite && rm sync.tar.gz && cd core && php artisan optimize:clear && php artisan migrate --force"
ssh -p $sshPort @sshArgs "${sshUser}@${sshHost}" $remoteCmd

if (Test-Path "sync.tar.gz") { Remove-Item "sync.tar.gz" }

Write-Host "--- Sync Complete! ---" -ForegroundColor Green
