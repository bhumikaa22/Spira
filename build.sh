#!/bin/bash
set -e
pip install -r requirements.txt
python -c "import language_tool_python; language_tool_python.download_lt()"