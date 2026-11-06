@echo off
chcp 65001 >nul
setlocal
rem Connects D1 and R2 to the Pages project. Run from the repository root.
set ACCOUNT=e4ec93f9fd61f86a603f544b6ad821c6
set PROJECT=mykiezberlin-com
set BUCKET=mykiezberlincom
set CLOUDFLARE_ACCOUNT_ID=%ACCOUNT%

echo === 1. Hesap ===
call wrangler whoami
echo Hesap listesinde %ACCOUNT% yoksa:  wrangler login  (s.bakici88@gmail.com)
pause

echo === 2. D1 veritabanlari ===
call wrangler d1 list
set /p DBNAME=Kullanilacak D1 adi:
set /p DBID=Bu D1'in uuid degeri:

echo === 3. R2 bucket ===
call wrangler r2 bucket list

echo === 4. wrangler.toml yaziliyor ===
(
echo name = "%PROJECT%"
echo pages_build_output_dir = "public"
echo compatibility_date = "2026-09-01"
echo.
echo [[d1_databases]]
echo binding = "DB"
echo database_name = "%DBNAME%"
echo database_id = "%DBID%"
echo.
echo [[r2_buckets]]
echo binding = "BUCKET"
echo bucket_name = "%BUCKET%"
) > wrangler.toml
type wrangler.toml

echo === 5. Admin sifresi ===
echo Gercek kullanicilardan once uzun bir sifre gir. Bos gecmek icin Ctrl+C degil, sonraki soruya N de.
set /p SETTOKEN=ADMIN_TOKEN simdi ayarlansin mi (J/N):
if /i "%SETTOKEN%"=="J" call wrangler pages secret put ADMIN_TOKEN --project-name %PROJECT%

echo === 6. Bitti ===
echo Simdi wrangler.toml dosyasini GitHub'a gonder. Cloudflare otomatik yayinlar.
echo Kontrol: https://mykiezberlin.com/api/health  (db:true, r2:true)
endlocal
pause
