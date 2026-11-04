@echo off
cd /d "%~dp0"

title Actualizador de goleadoras

echo.
echo ==========================================
echo       ACTUALIZANDO GOLEADORAS
echo ==========================================
echo.

echo Ejecutando scraper de goleadoras...
call pnpm run scrape:scorers
if %ERRORLEVEL% NEQ 0 goto :fail

echo.
echo ==========================================
echo       ACTUALIZACION EXITOSA
echo ==========================================
echo.
echo Las goleadoras se actualizaron correctamente.
goto :end

:fail
echo.
echo ==========================================
echo       ACTUALIZACION FALLIDA
echo ==========================================
echo.
echo El scraper de goleadoras fallo.
echo Revisa los mensajes anteriores para ver el error.

:end
echo.
echo Presiona una tecla para cerrar
pause >nul
