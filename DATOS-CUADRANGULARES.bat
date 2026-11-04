@echo off
cd /d "%~dp0"

title Cuadrangulares

echo.
echo ==========================================
echo      ACTUALIZANDO DATOS - CUANDRANGULARES
echo ==========================================
echo.

echo Ejecutando scrapers de goleadoras...
call pnpm run scrape:scorers
if %ERRORLEVEL% NEQ 0 goto :fail

echo.
echo.
echo Ejecutando scrapers de partidos de cuadrangulares...
call pnpm run scrape:cuadrangular-matches
if %ERRORLEVEL% NEQ 0 goto :fail

echo.
echo Ejecutando scrapers de posiciones de cuadrangulares...
call pnpm run scrape:stage-standings
if %ERRORLEVEL% NEQ 0 goto :fail

echo.
echo ==========================================
echo        ^✓ ACTUALIZACION EXITOSA
echo ==========================================
echo.
echo Goleadoras, posiciones de fase final y partidos de cuadrangulares terminaron correctamente.
goto :end

:fail
echo.
echo ==========================================
echo        ^X ACTUALIZACION FALLIDA
echo ==========================================
echo.
echo Uno o mas scrapers fallaron.

:end
echo.
echo ==========================================
echo      Presiona una tecla para cerrar
echo ==========================================
pause >nul
