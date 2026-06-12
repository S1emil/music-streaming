@echo off
chcp 65001 >nul
echo Building thesis...
python "%~dp0build_thesis.py"
echo Done! Check thesis_complete.docx
pause
