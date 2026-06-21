# Build a fully static export for GitHub Pages (served at sumanthkm.com/aria).
# Server API routes can't exist in an `output: export` build, so we move them
# aside for the build and restore them afterwards.

$Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$ApiDir = Join-Path $Root "src" "app" "api"
$Stash = Join-Path ([System.IO.Path]::GetTempPath()) "api-stash"

try {
  if (Test-Path $ApiDir) {
    if (Test-Path $Stash) { Remove-Item -Recurse -Force $Stash }
    Move-Item -LiteralPath $ApiDir -Destination $Stash
  }

  Write-Host "▸ Building static export (STATIC_EXPORT=1, basePath=/aria)…"
  $env:STATIC_EXPORT = "1"
  npx next build
  Remove-Item Env:\STATIC_EXPORT -ErrorAction SilentlyContinue

  # GitHub Pages runs Jekyll, which ignores folders starting with "_" (like _next).
  New-Item -ItemType File -Path (Join-Path $Root "out" ".nojekyll") -Force | Out-Null

  Write-Host "✓ Static site ready in ./out  (deploy to sumanthkm.com/aria)"
}
finally {
  if (Test-Path $Stash) {
    if (Test-Path $ApiDir) { Remove-Item -Recurse -Force $ApiDir }
    Move-Item -LiteralPath $Stash -Destination $ApiDir
  }
}
