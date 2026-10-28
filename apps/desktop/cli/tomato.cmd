@echo off
setlocal DisableDelayedExpansion
set "ELECTRON_RUN_AS_NODE=1"
"%~dp0..\..\..\..\Tomato Harness.exe" --expose-internals "%~dp0..\..\..\app.asar\tomato\node_modules\@tomato\@tomato/desktop-host\lib\cli.js" %*
exit /b %errorlevel%
