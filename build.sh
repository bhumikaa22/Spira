#!/bin/bash
set -e
pip install -r requirements.txt
python -c "import language_tool_python; tool = language_tool_python.LanguageTool('en-US')"