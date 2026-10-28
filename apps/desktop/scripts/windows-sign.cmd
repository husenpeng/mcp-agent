@echo off
setlocal DisableDelayedExpansion
set "signTool=%TOMATO_DESKTOP_WINDOWS_SIGNTOOL%"
set "certificateFile=%TOMATO_DESKTOP_WINDOWS_CER_FILE%"
set "tokenPin=%TOMATO_DESKTOP_WINDOWS_TOKEN_PIN%"
set "keyContainer=%TOMATO_DESKTOP_WINDOWS_KEY_CONTAINER%"
set "targetFile=%TOMATO_DESKTOP_WINDOWS_SIGN_TARGET%"
set "appendSignature="
if "%TOMATO_DESKTOP_WINDOWS_SIGN_APPEND%"=="1" set "appendSignature=/as"
set "TOMATO_DESKTOP_WINDOWS_SIGNTOOL="
set "TOMATO_DESKTOP_WINDOWS_CER_FILE="
set "TOMATO_DESKTOP_WINDOWS_TOKEN_PIN="
set "TOMATO_DESKTOP_WINDOWS_KEY_CONTAINER="
set "TOMATO_DESKTOP_WINDOWS_SIGN_TARGET="
set "TOMATO_DESKTOP_WINDOWS_SIGN_APPEND="
set "signTool=" & set "certificateFile=" & set "tokenPin=" & set "keyContainer=" & set "targetFile=" & set "appendSignature=" & "%signTool%" sign /v /fd sha256 /f "%certificateFile%" /kc "[{{%tokenPin%}}]=%keyContainer%" /csp "eToken Base Cryptographic Provider" %appendSignature% "%targetFile%"
exit /b %errorlevel%
