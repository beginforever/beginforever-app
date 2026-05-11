#!/bin/bash
# Begin Forever — One-time Repo Setup
# Run this ONCE in each repo (beginforever-app and beginforever)
# Usage: ./setup-repo.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE} Begin Forever — One-time Repo Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Ensure we are on main and up to date
echo -e "${BLUE}→ Syncing main branch...${NC}"
git checkout main
git pull origin main

# Create staging branch if missing
if git show-ref --verify --quiet refs/heads/staging; then
  echo -e "${GREEN}  ✓ staging branch already exists${NC}"
else
  echo -e "${BLUE}→ Creating staging branch...${NC}"
  git checkout -b staging
  git push -u origin staging
  git checkout main
  echo -e "${GREEN}  ✓ staging branch created${NC}"
fi

# Tag current production state as a baseline
BASELINE="v-baseline-$(date +%Y%m%d)"
if git rev-parse "$BASELINE" >/dev/null 2>&1; then
  echo -e "${GREEN}  ✓ baseline tag already exists${NC}"
else
  echo -e "${BLUE}→ Tagging current state as $BASELINE (your safe rollback point)...${NC}"
  git tag "$BASELINE"
  git push origin "$BASELINE"
fi

# Create .gitignore additions
if ! grep -q "\.bak" .gitignore 2>/dev/null; then
  echo -e "${BLUE}→ Updating .gitignore...${NC}"
  cat >> .gitignore <<EOF

# Deploy script artifacts
*.bak
.DS_Store
node_modules/
.env
.env.local
EOF
  echo -e "${GREEN}  ✓ .gitignore updated${NC}"
fi

# Create CHANGELOG if missing
if [ ! -f CHANGELOG.md ]; then
  echo -e "${BLUE}→ Creating CHANGELOG.md...${NC}"
  cat > CHANGELOG.md <<EOF
# Changelog

All notable changes to Begin Forever.

## [Unreleased]

### Setup
- Branching workflow introduced: main / staging / feature/*
- Baseline tag: $BASELINE
EOF
  echo -e "${GREEN}  ✓ CHANGELOG.md created${NC}"
fi

# Commit setup files
git add .gitignore CHANGELOG.md 2>/dev/null || true
git commit -m "chore: add deploy workflow scaffolding" 2>/dev/null || echo "Nothing new to commit"
git push origin main 2>/dev/null || true

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN} ✅ Setup complete${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Your safe rollback point: ${YELLOW}$BASELINE${NC}"
echo ""
echo -e "From now on, every change:"
echo -e "  1. ${YELLOW}git checkout main && git pull${NC}"
echo -e "  2. ${YELLOW}git checkout -b feature/your-change${NC}"
echo -e "  3. Make changes"
echo -e "  4. ${YELLOW}./deploy.sh \"description\"${NC}"
echo ""
echo -e "If anything ever breaks production, restore baseline:"
echo -e "  ${YELLOW}git checkout main${NC}"
echo -e "  ${YELLOW}git reset --hard $BASELINE${NC}"
echo -e "  ${YELLOW}git push --force origin main${NC}"
