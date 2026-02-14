@echo off
REM Design Duck CLI wrapper — run from your project root: .\desgin-duck\duck <command>
node "%~dp0node_modules\design-duck\dist\cli.js" %*
