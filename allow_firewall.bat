@echo off
title Trinetra-AI Firewall Fix
echo ===================================================
echo    Checking Administrative Privileges...
echo ===================================================

net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo.
    echo [!] Requesting Administrator privileges...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo.
echo ===================================================
echo   Adding Inbound Allow Rule for Port 4000...
echo ===================================================
netsh advfirewall firewall delete rule name="Trinetra Backend Port 4000" >nul 2>&1
netsh advfirewall firewall add rule name="Trinetra Backend Port 4000" dir=in action=allow protocol=TCP localport=4000

echo.
echo ===================================================
echo   Unblocking Node.js JavaScript Runtime...
echo ===================================================
powershell -Command "Set-NetFirewallRule -DisplayName 'Node.js JavaScript Runtime' -Action Allow -ErrorAction SilentlyContinue"

echo.
echo ===================================================
echo   [SUCCESS] Firewall has been successfully unblocked!
echo   ESP32 can now send telemetry directly to Port 4000.
echo ===================================================
echo.
pause
