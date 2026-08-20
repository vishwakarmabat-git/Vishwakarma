$ftpHost = "145.79.212.201"
$ftpPort = 65002
$username = "u276796116"
$password = "Qubnix123@"
$remoteRoot = "/public_html"

$localFiles = @(
    @{Local = "D:\sports\dist\index.html"; Remote = "$remoteRoot/index.html" },
    @{Local = "D:\sports\dist\assets\index-CvyElDm1.js"; Remote = "$remoteRoot/assets/index-CvyElDm1.js" },
    @{Local = "D:\sports\dist\assets\index-CsZk4ho5.css"; Remote = "$remoteRoot/assets/index-CsZk4ho5.css" }
)

$filesToDelete = @(
    "$remoteRoot/assets/index-7rrZAzU3.js",
    "$remoteRoot/assets/index-BSf-4Cc3.js"
)

function Upload-File($localPath, $remotePath) {
    $uri = "ftp://${ftpHost}:${ftpPort}$remotePath"
    $webClient = New-Object System.Net.WebClient
    $webClient.Credentials = New-Object System.Net.NetworkCredential($username, $password)
    try {
        $webClient.UploadFile($uri, 'STOR', $localPath)
        Write-Host "Uploaded: $remotePath" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Failed to upload $remotePath : $_" -ForegroundColor Red
        return $false
    } finally {
        $webClient.Dispose()
    }
}

function Delete-File($remotePath) {
    try {
        $uri = "ftp://${ftpHost}:${ftpPort}$remotePath"
        $request = [System.Net.FtpWebRequest]::Create($uri)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
        $request.Credentials = New-Object System.Net.NetworkCredential($username, $password)
        $response = $request.GetResponse()
        $response.Close()
        Write-Host "Deleted: $remotePath" -ForegroundColor Yellow
    } catch {
        Write-Host "Could not delete $remotePath (may not exist): $_" -ForegroundColor DarkYellow
    }
}

Write-Host "=== Uploading new build ===" -ForegroundColor Cyan
$allOk = $true
foreach ($file in $localFiles) {
    if (-not (Test-Path $file.Local)) {
        Write-Host "Local file not found: $($file.Local)" -ForegroundColor Red
        $allOk = $false
        continue
    }
    if (-not (Upload-File $file.Local $file.Remote)) {
        $allOk = $false
    }
}

Write-Host ""
Write-Host "=== Removing old bundles ===" -ForegroundColor Cyan
foreach ($file in $filesToDelete) {
    Delete-File $file
}

if ($allOk) {
    Write-Host ""
    Write-Host "=== Deploy complete! ===" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=== Deploy completed with errors ===" -ForegroundColor Red
}
