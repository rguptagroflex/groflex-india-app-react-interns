(Get-Content invoiz-web-deployment-dev.yaml) | Foreach-Object {
    $_ -replace '__TFS_BUILD_NUMBER__', $env:BUILD_BUILDNUMBER `
    } | Set-Content invoiz-web-deployment-dev.yaml

(Get-Content invoiz-web-deployment-qa.yaml) | Foreach-Object {
    $_ -replace '__TFS_BUILD_NUMBER__', $env:BUILD_BUILDNUMBER `
    } | Set-Content invoiz-web-deployment-qa.yaml

(Get-Content invoiz-web-deployment-staging.yaml) | Foreach-Object {
    $_ -replace '__TFS_BUILD_NUMBER__', $env:BUILD_BUILDNUMBER `
	} | Set-Content invoiz-web-deployment-staging.yaml

(Get-Content invoiz-web-deployment-integration.yaml) | Foreach-Object {
	$_ -replace '__TFS_BUILD_NUMBER__', $env:BUILD_BUILDNUMBER `
	} | Set-Content invoiz-web-deployment-integration.yaml

(Get-Content invoiz-web-deployment-production.yaml) | Foreach-Object {
    $_ -replace '__TFS_BUILD_NUMBER__', $env:BUILD_BUILDNUMBER `
	} | Set-Content invoiz-web-deployment-production.yaml

(Get-Content invoiz-web-deployment-production.yaml) | Foreach-Object {
	$_ -replace '__TFS_BUILD_NUMBER__', $env:BUILD_BUILDNUMBER `
	} | Set-Content invoiz-web-deployment-admin-panel.yaml
