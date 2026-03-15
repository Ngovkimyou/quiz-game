@echo off
setlocal

call "%~dp0..\..\node_modules\.bin\lefthook.CMD" run pre-commit %*
exit /b %ERRORLEVEL%
