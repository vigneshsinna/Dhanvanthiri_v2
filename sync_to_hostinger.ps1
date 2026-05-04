# Hostinger Auto-Sync Watcher
# Watches for local file changes and pushes them to the Hostinger server via SCP.

$sshHost = "217.21.74.44"
$sshPort = 65002
$sshUser = "u362580417"
$remoteRoot = "/home/u362580417/domains/dhanvanthrifoods.com/public_html"

$sshArgs = @("-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=NUL")

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = Get-Location
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$onChange = Register-ObjectEvent $watcher "Changed" -Action {
    $path = $Event.SourceEventArgs.FullPath
    $relativePath = Resolve-Path $path -Relative
    Sync-File $path $relativePath "Changed"
}

$onCreate = Register-ObjectEvent $watcher "Created" -Action {
    $path = $Event.SourceEventArgs.FullPath
    $relativePath = Resolve-Path $path -Relative
    Sync-File $path $relativePath "Created"
}

$onRename = Register-ObjectEvent $watcher "Renamed" -Action {
    $path = $Event.SourceEventArgs.FullPath
    $relativePath = Resolve-Path $path -Relative
    Sync-File $path $relativePath "Renamed"
}

function Sync-File($path, $relativePath, $changeType) {
    # Skip ignored directories and utility scripts
    $ignoredPatterns = @("node_modules", "vendor", ".git", "storage/logs", "storage/framework", "\.ps1", "\.bat", "\.tar\.gz", "\.zip", "scratch/", "temp/", "frontend/")
    $shouldIgnore = $false
    foreach ($pattern in $ignoredPatterns) {
        if ($relativePath -like "*$pattern*") {
            $shouldIgnore = $true
            break
        }
    }

    # EXCEPTION: Always allow this specific vendor fix
    if ($relativePath -like "*CoreComponentRepository.php*") { $shouldIgnore = $false }

    if (-not $shouldIgnore -and (Test-Path $path -PathType Leaf)) {
        # --- MAPPING LOGIC ---
        if ($relativePath.StartsWith("public/")) {
            $cleanRelative = $relativePath -replace '^public/', ''
            $remoteFile = "$remoteRoot/$cleanRelative"
        } else {
            $remoteFile = "$remoteRoot/core/$relativePath"
        }
        $remoteDir = Split-Path $remoteFile -Parent
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ${changeType}: $relativePath -> $remoteFile" -ForegroundColor Gray
        
        try {
            ssh -p $sshPort @sshArgs "$sshUser@$sshHost" "mkdir -p '$remoteDir'"
            scp -P $sshPort @sshArgs "$path" "$sshUser@$sshHost`:$remoteFile"
            ssh -p $sshPort @sshArgs "$sshUser@$sshHost" "cd $remoteRoot/core && php artisan optimize:clear"
            Write-Host "  Successfully synced!" -ForegroundColor Green
        } catch {
            Write-Host "  Sync failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Hostinger Auto-Sync Started" -ForegroundColor Green
Write-Host "   Watching: $(Get-Location)"
Write-Host "   Target: $sshUser@$sshHost`:$remoteRoot"
Write-Host "   Port: $sshPort"
Write-Host "   Press Ctrl+C to stop"
Write-Host "==========================================" -ForegroundColor Cyan

# Keep the script running
while ($true) { Start-Sleep -Seconds 1 }
