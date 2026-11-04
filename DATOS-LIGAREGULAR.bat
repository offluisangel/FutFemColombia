@echo off
cd /d "%~dp0"

title Actualizador de datos

echo.
echo ==========================================
echo        ACTUALIZANDO DATOS
echo ==========================================
echo.

call npm run scrape:all

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo        ^✓ ACTUALIZACION EXITOSA
    echo ==========================================
    echo.
    echo Todos los scrapers terminaron correctamente.
) else (
    echo.
    echo ==========================================
    echo        ^X ACTUALIZACION FALLIDA
    echo ==========================================
    echo.
    echo Uno o mas scrapers fallaron.
    echo Revisa los mensajes anteriores para ver el error.
)

echo.
echo ==========================================
echo      Presiona una tecla para cerrar
echo ==========================================
pause >nul
