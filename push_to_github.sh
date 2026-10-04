#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "🚀 Pushing THE PENGUIN: BEYOND THE DOOR to GitHub..."
echo "=========================================================="

git push -u origin main
STATUS=$?

if [ $STATUS -eq 0 ]; then
  # Also push gh-pages branch as a direct fallback
  git branch -M gh-pages 2>/dev/null
  git push -u origin gh-pages 2>/dev/null
  git checkout main 2>/dev/null

  echo ""
  echo "✅ Push successful!"
  echo "🌐 Repository: https://github.com/saltymother/penguin-beyond-the-door"
  echo "📄 GitHub Pages: https://saltymother.github.io/penguin-beyond-the-door/"
else
  echo ""
  echo "⚠️ Push was not completed. If the repository does not exist yet:"
  echo "  1. Create it at: https://github.com/new"
  echo "     Repository name: penguin-beyond-the-door"
  echo "     Make it Public."
  echo "  2. Run this script again: ./push_to_github.sh"
fi
