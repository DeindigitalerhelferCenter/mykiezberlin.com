@echo off
chcp 65001 >nul
setlocal
rem Sends the stories exported from the phone to the admin queue on mykiezberlin.com.
cd /d "%~dp0.."
echo Telefondan kopyalanan hikayeler admin onayina gonderilecek.
set /p ADMIN_PASSWORD=Admin sifresi:
node tools\import_stories.mjs "%USERPROFILE%\MyKiezStoryExport"
echo.
echo Sonra https://mykiezberlin.com/admin adresinde Bekleyen sekmesine bak.
endlocal
pause
