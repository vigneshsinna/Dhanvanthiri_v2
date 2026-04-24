# PowerShell script to zip project with exclusions

$destinationZip = "Dhanvathiri_v2_Clean.zip"
$rootPath = "V:\pers\Freelance\Dhanvathiri_v2"

# Patterns to exclude
$excludePatterns = @(
    "*.zip",
    "*.jpg",
    "*.jpeg",
    "*.png",
    "*.gif",
    "*.svg",
    "*.webp",
    "*.ico",
    "vendor",
    "node_modules",
    "storage",
    ".git",
    "old",
    "temp",
    "temp_xlsx",
    "scratch",
    "tests",
    ".vscode",
    ".idea",
    ".env",
    "dist",
    "build"
)

# Get all items in the root directory
$items = Get-ChildItem -Path $rootPath -Force

# Filter items
$itemsToInclude = $items | Where-Object { 
    $itemName = $_.Name
    $shouldExclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($itemName -like $pattern) {
            $shouldExclude = $true
            break
        }
    }
    -not $shouldExclude
}

# Now for the recursive part, it's better to just zip the selected top-level items
# Compress-Archive works well on a collection of items.
if (Test-Path $destinationZip) {
    Remove-Item $destinationZip
}

Write-Host "Zipping the following top-level items:"
$itemsToInclude | ForEach-Object { Write-Host " - $($_.Name)" }

$itemsToInclude | Compress-Archive -DestinationPath $destinationZip -Force

Write-Host "Zip created successfully: $destinationZip"
