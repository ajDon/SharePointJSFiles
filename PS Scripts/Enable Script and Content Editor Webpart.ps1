$adminUPN=”ajays3370@ajaysahu.onmicrosoft.com”
$userCredential = Get-Credential -UserName $adminUPN -Message “Enter password”
Connect-SPOService -Url https://ajaysahu-admin.sharepoint.com -Credential $userCredential
Set-SPOsite https://ajaysahu.sharepoint.com -DenyAddAndCustomizePages 0