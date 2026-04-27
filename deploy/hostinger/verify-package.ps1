param(
    [string]$OutputDir
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $OutputDir = Join-Path $repoRoot '.tmp\hostinger-package-verification'
}

$OutputDir = [System.IO.Path]::GetFullPath($OutputDir)

& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'build-shared-package.ps1') -SkipFrontendBuild -OutputDir $OutputDir

if ($LASTEXITCODE -ne 0) {
    throw "Package build failed with exit code $LASTEXITCODE."
}

$installPath = Join-Path $OutputDir 'install.php'
$readmePath = Join-Path $OutputDir 'README.md'
$envPath = Join-Path $OutputDir 'core\.env'
$htaccessPath = Join-Path $OutputDir '.htaccess'

if (-not (Test-Path $installPath)) {
    throw "Expected packaged install.php at $installPath"
}

if (-not (Test-Path $readmePath)) {
    throw "Expected packaged README.md at $readmePath"
}

if (-not (Test-Path $envPath)) {
    throw "Expected packaged core/.env at $envPath"
}

if (-not (Test-Path $htaccessPath)) {
    throw "Expected packaged .htaccess at $htaccessPath"
}

$installContents = Get-Content $installPath -Raw
$readmeContents = Get-Content $readmePath -Raw
$envContents = Get-Content $envPath -Raw
$htaccessContents = Get-Content $htaccessPath -Raw

if ($installContents -notmatch 'Seed Database') {
    throw 'Packaged installer is missing a Seed Database step.'
}

if ($installContents -notmatch 'db:seed') {
    throw 'Packaged installer is missing db:seed execution.'
}

if ($installContents -notmatch 'Seed / Reset Admin Users') {
    throw 'Packaged installer is missing the admin-user recovery step.'
}

if ($installContents -notmatch 'AdminAccessSeeder') {
    throw 'Packaged installer is missing AdminAccessSeeder execution.'
}

if ($readmeContents -notmatch 'IT User') {
    throw 'Packaged README is missing the seeded IT User credentials.'
}

if ($readmeContents -notmatch 'Admin User') {
    throw 'Packaged README is missing the seeded Admin User credentials.'
}

if ($envContents -notmatch 'IT_USER_EMAIL=it@dhanvanthiri.local') {
    throw 'Packaged .env is missing the IT User reference credentials.'
}

if ($envContents -notmatch 'ADMIN_USER_EMAIL=admin@dhanvanthiri.local') {
    throw 'Packaged .env is missing the Admin User reference credentials.'
}

if ($htaccessContents -notmatch 'RewriteCond %\{REQUEST_URI\} !\^/\$') {
    throw 'Packaged .htaccess is missing the homepage rewrite guard.'
}

Write-Host 'Hostinger package verification passed.'
