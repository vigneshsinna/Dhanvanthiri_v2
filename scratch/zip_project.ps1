$source = "v:\pers\Freelance\Dhanvathiri_v2"
$tempDir = "v:\pers\Freelance\Dhanvathiri_v2_temp_zip"
$zipFile = "v:\pers\Freelance\Dhanvathiri_v2_source_$(Get-Date -Format 'yyyyMMdd').zip"

# Clean up any existing temp dir
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }

# Define Robocopy exclusions
$excludedDirs = @(
    "docs",
    "vendor",
    "old",
    ".git",
    "node_modules",
    "dist",
    "coverage",
    "test-results",
    "playwright-report",
    "debugbar",
    "logs",
    "cache",
    "sessions",
    "views",
    "cgi-bin",
    "output",
    "temp",
    "public\logs"
)

$excludedFiles = @(
    "*.zip",
    ".phpunit.result.cache",
    "*.log"
)

Write-Host "Staging files for zipping..."
# Robocopy command
# /E - Copy subdirectories, including empty ones
# /XD - Exclude directories matching these names
# /XF - Exclude files matching these names/patterns
# /NFL - No File List (to keep output clean)
# /NDL - No Directory List
# /NJH - No Job Header
# /NJS - No Job Summary
robocopy $source $tempDir /E /XD $excludedDirs /XF $excludedFiles /NFL /NDL /NJH /NJS

# Re-create empty essential Laravel directories if they were excluded
# (Laravel needs these folders to exist, even if empty)
Write-Host "Ensuring essential Laravel directories exist..."
$essentialDirs = @(
    "storage/logs",
    "storage/framework/cache",
    "storage/framework/sessions",
    "storage/framework/views",
    "bootstrap/cache"
)

foreach ($dir in $essentialDirs) {
    if (-not (Test-Path "$tempDir/$dir")) {
        New-Item -ItemType Directory -Path "$tempDir/$dir" -Force | Out-Null
    }
}

Write-Host "Compressing archive..."
if (Test-Path $zipFile) { Remove-Item $zipFile }
Compress-Archive -Path "$tempDir/*" -DestinationPath $zipFile -Force

Write-Host "Cleanup..."
Remove-Item -Recurse -Force $tempDir

$zipInfo = Get-Item $zipFile
Write-Host "Created archive: $($zipInfo.FullName)"
Write-Host "Size: $([Math]::Round($zipInfo.Length / 1MB, 2)) MB"
