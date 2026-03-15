@echo off
setlocal

call "%~dp0..\..\node_modules\.bin\lefthook.CMD" run pre-push %*
exit /b %ERRORLEVEL%
