@echo off
echo Starting Land Price Prediction ML Backend...
echo.

REM Activate virtual environment
call venv\Scripts\activate

REM Run Flask app
python app.py
