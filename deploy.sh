#!/bin/bash
# Begin Forever — Safe Deploy Script
# Usage: ./deploy.sh "short description of change"

set -e  # Exit on any error

# ---------- Colours ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ---------- Pre-flight ----------
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Commit message required${NC}"
  echo "Usage: ./deploy.sh \"fixed login button on iOS\""
  exit 1
fi

COMMIT_MSG="$1"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
VERSION=$(date +%Y%m%d%H%M%S)

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE} Begin Forever Deploy${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Branch:  ${YELLOW}$BRANCH${NC}"
echo -e "Version: ${YELLOW}$VERSION${NC}"
echo -e "Message: ${YELLOW}$COMMIT_MSG${NC}"
echo ""

# ---------- Block direct deploy to main ----------
if [ "$BRANCH" = "main" ]; then
  echo -e "${RED}❌ STOP: You are on 'main'. Never deploy directly.${NC}"
  echo -e "${YELLOW}Run: git checkout -b feature/your-change-name${NC}"
  exit 1
fi

# ---------- Confirm staging tested ----------
echo -e "${YELLOW}Have you tested this on staging in an incognito window? (y/N)${NC}"
read -r CONFIRMED
if [ "$CONFIRMED" != "y" ] && [ "$CONFIRMED" != "Y" ]; then
  echo -e "${RED}❌ Aborted. Test on staging first.${NC}"
  exit 1
fi

# ---------- Cache-bust app.js references ----------
echo -e "${BLUE}→ Bumping cache-bust version to $VERSION...${NC}"
if [ -f "index.html" ]; then
  # Handles both existing ?v=xxx and bare app.js
  sed -i.bak -E "s|app\.js(\?v=[0-9]+)?|app.js?v=$VERSION|g" index.html
  rm -f index.html.bak
  echo -e "${GREEN}  ✓ index.html updated${NC}"
else
  echo -e "${RED}  ⚠ index.html not found in this directory${NC}"
fi

# ---------- Show what changed ----------
echo -e "${BLUE}→ Changes to be committed:${NC}"
git status --short

# ---------- Final confirmation ----------
echo ""
echo -e "${YELLOW}Proceed with commit, merge to main, and push? (y/N)${NC}"
read -r FINAL
if [ "$FINAL" != "y" ] && [ "$FINAL" != "Y" ]; then
  echo -e "${RED}❌ Aborted.${NC}"
  exit 1
fi

# ---------- Commit on feature branch ----------
echo -e "${BLUE}→ Committing on $BRANCH...${NC}"
git add -A
git commit -m "$COMMIT_MSG (v$VERSION)" || echo "Nothing to commit"
git push origin "$BRANCH"

# ---------- Merge to staging first ----------
echo -e "${BLUE}→ Merging to staging...${NC}"
git checkout staging 2>/dev/null || git checkout -b staging
git pull origin staging 2>/dev/null || true
git merge "$BRANCH" --no-edit
git push origin staging

echo ""
echo -e "${YELLOW}⏸  Test on staging URL now. Press ENTER when verified, or Ctrl+C to abort.${NC}"
read -r

# ---------- Merge to main ----------
echo -e "${BLUE}→ Merging to main...${NC}"
git checkout main
git pull origin main
git merge "$BRANCH" --no-edit
git push origin main

# ---------- Tag release ----------
TAG="v$VERSION"
echo -e "${BLUE}→ Tagging release as $TAG...${NC}"
git tag "$TAG"
git push origin "$TAG"

# ---------- Done ----------
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN} ✅ Deployed: $TAG${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Next steps:"
echo -e "  1. Wait 60 seconds for host rebuild"
echo -e "  2. Open production URL in ${YELLOW}incognito window${NC}"
echo -e "  3. Verify change is live"
echo ""
echo -e "Rollback if needed:"
echo -e "  ${YELLOW}git reset --hard $(git tag --sort=-creatordate | sed -n '2p')${NC}"
echo -e "  ${YELLOW}git push --force origin main${NC}"
