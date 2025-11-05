#!/bin/bash

###############################################################################
# Phase 10 Day 5.7 Stage 2 Phase 2: Manual Testing Orchestration Script
# Comprehensive Manual Testing Guide
#
# Purpose: Guide tester through manual testing process with automation support
# Duration: 4 hours
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Phase 10 Day 5.7 Stage 2 Phase 2: Manual Testing       ║${NC}"
echo -e "${BLUE}║  Comprehensive Human Validation Suite                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking Prerequisites...${NC}"
echo ""

# Check if frontend is running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Frontend is not running on port 3000${NC}"
    echo "   Please start the frontend with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Frontend is running on port 3000${NC}"

# Check if backend is running
if ! lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Backend is not running on port 4000${NC}"
    echo "   Please start the backend with: cd backend && npm run start:dev"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running on port 4000${NC}"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}MANUAL TESTING WORKFLOW${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

PS3="Select testing phase to execute: "
options=(
    "Part 1: Real Research Topic Validation (2 hours)"
    "Part 2: Theme Quality Validation (1 hour)"
    "Part 3: Accessibility Audit (45 minutes)"
    "Part 4: Mobile Responsive Testing (45 minutes)"
    "Run Automated Accessibility Audit"
    "Calculate Cohen's Kappa (Theme Quality)"
    "View Full Testing Guide"
    "Exit"
)

select opt in "${options[@]}"
do
    case $opt in
        "Part 1: Real Research Topic Validation (2 hours)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}PART 1: REAL RESEARCH TOPIC VALIDATION${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📖 Test 10 diverse research topics for relevance and quality"
            echo ""
            echo "Test Scenarios Available:"
            echo "  1. Medical Research - Diabetes Management"
            echo "  2. Climate Science - Ocean Acidification"
            echo "  3. Computer Science - Quantum Computing"
            echo "  4. Social Sciences - Remote Work Productivity"
            echo "  5. Education - Active Learning Strategies"
            echo "  6. Environmental Science - Renewable Energy Policy"
            echo "  7. Psychology - Cognitive Behavioral Therapy"
            echo "  8. Economics - Universal Basic Income"
            echo "  9. Neuroscience - Neuroplasticity"
            echo "  10. Artificial Intelligence - Explainable AI"
            echo ""
            echo "📄 Full test scenarios: backend/test/manual/test-scenarios.json"
            echo "📝 Testing guide: backend/test/manual/STAGE2_PHASE2_MANUAL_TESTING_GUIDE.md"
            echo ""
            echo -e "${YELLOW}Action: Open the guide and test each topic manually${NC}"
            echo "Target: ≥80% relevance for each topic"
            echo ""
            read -p "Press Enter to continue..."
            ;;
        "Part 2: Theme Quality Validation (1 hour)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}PART 2: THEME QUALITY VALIDATION${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📊 Validate AI-extracted themes using Cohen's Kappa"
            echo ""
            echo "Process:"
            echo "  1. Select 3 paper sets from Part 1 results"
            echo "  2. Extract themes using unified theme extraction"
            echo "  3. Have 2 independent raters classify themes (1-4 scale)"
            echo "  4. Calculate Cohen's kappa coefficient"
            echo "  5. Target: κ ≥ 0.6 (substantial agreement)"
            echo ""
            echo "📄 Rating scale:"
            echo "  1 = Highly Relevant"
            echo "  2 = Somewhat Relevant"
            echo "  3 = Not Relevant"
            echo "  4 = Incorrect"
            echo ""
            echo -e "${YELLOW}Action: Complete theme ratings and run kappa calculator${NC}"
            echo ""
            read -p "Press Enter to continue..."
            ;;
        "Part 3: Accessibility Audit (45 minutes)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}PART 3: ACCESSIBILITY AUDIT${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "♿ Test accessibility compliance (WCAG AA)"
            echo ""
            echo "Tests to Perform:"
            echo "  1. Automated Lighthouse audits (use option 5)"
            echo "  2. Keyboard navigation testing"
            echo "  3. Screen reader testing (NVDA/VoiceOver)"
            echo "  4. Color contrast validation"
            echo ""
            echo "Pages to Test:"
            echo "  - Literature search page"
            echo "  - Search results view"
            echo "  - Theme extraction results"
            echo "  - Paper library view"
            echo ""
            echo "Target: ≥90/100 Lighthouse accessibility score"
            echo ""
            echo -e "${YELLOW}Action: Run automated audit (option 5) then manual checks${NC}"
            echo ""
            read -p "Press Enter to continue..."
            ;;
        "Part 4: Mobile Responsive Testing (45 minutes)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}PART 4: MOBILE RESPONSIVE TESTING${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📱 Test responsiveness across 3 breakpoints"
            echo ""
            echo "Breakpoints:"
            echo "  1. Mobile (375px) - iPhone SE"
            echo "  2. Tablet (768px) - iPad"
            echo "  3. Desktop (1920px) - Full HD"
            echo ""
            echo "Testing Areas:"
            echo "  - Layout and spacing"
            echo "  - Touch target sizes (≥44px)"
            echo "  - Navigation behavior"
            echo "  - Typography and readability"
            echo "  - Forms and interactions"
            echo ""
            echo "📄 Full checklist: backend/test/manual/mobile-responsive-checklist.md"
            echo ""
            echo -e "${YELLOW}Action: Use Chrome DevTools Device Mode to test${NC}"
            echo "Target: 100% functionality on all 3 breakpoints"
            echo ""
            read -p "Press Enter to continue..."
            ;;
        "Run Automated Accessibility Audit")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}AUTOMATED ACCESSIBILITY AUDIT${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "Running Lighthouse accessibility audits..."
            echo ""

            if [ -f "./scripts/run-accessibility-audit.sh" ]; then
                ./scripts/run-accessibility-audit.sh
            else
                echo -e "${RED}❌ Accessibility audit script not found${NC}"
                echo "   Expected: ./scripts/run-accessibility-audit.sh"
            fi

            echo ""
            read -p "Press Enter to continue..."
            ;;
        "Calculate Cohen's Kappa (Theme Quality)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}COHEN'S KAPPA CALCULATOR${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "Calculating inter-rater reliability..."
            echo ""

            if [ -f "./backend/test/manual/cohens-kappa-calculator.js" ]; then
                cd backend/test/manual
                node cohens-kappa-calculator.js
                cd ../../..
            else
                echo -e "${RED}❌ Cohen's Kappa calculator not found${NC}"
                echo "   Expected: backend/test/manual/cohens-kappa-calculator.js"
            fi

            echo ""
            echo "📝 To use with your own ratings:"
            echo "   1. Edit backend/test/manual/cohens-kappa-calculator.js"
            echo "   2. Replace example ratings with your actual ratings"
            echo "   3. Run: node backend/test/manual/cohens-kappa-calculator.js"
            echo ""
            read -p "Press Enter to continue..."
            ;;
        "View Full Testing Guide")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}FULL MANUAL TESTING GUIDE${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📚 Documentation Files:"
            echo ""
            echo "Main Guide:"
            echo "  📄 backend/test/manual/STAGE2_PHASE2_MANUAL_TESTING_GUIDE.md"
            echo "     Complete testing procedures and checklists"
            echo ""
            echo "Test Data:"
            echo "  📄 backend/test/manual/test-scenarios.json"
            echo "     10 diverse research topic scenarios"
            echo ""
            echo "Calculators & Tools:"
            echo "  📄 backend/test/manual/cohens-kappa-calculator.js"
            echo "     Theme quality validation tool"
            echo ""
            echo "Checklists:"
            echo "  📄 backend/test/manual/mobile-responsive-checklist.md"
            echo "     Mobile testing checklist"
            echo ""
            echo "Scripts:"
            echo "  📄 scripts/run-accessibility-audit.sh"
            echo "     Automated accessibility testing"
            echo ""
            echo -e "${YELLOW}Opening main guide...${NC}"

            if command -v code &> /dev/null; then
                code backend/test/manual/STAGE2_PHASE2_MANUAL_TESTING_GUIDE.md
            elif command -v open &> /dev/null; then
                open backend/test/manual/STAGE2_PHASE2_MANUAL_TESTING_GUIDE.md
            else
                cat backend/test/manual/STAGE2_PHASE2_MANUAL_TESTING_GUIDE.md | less
            fi

            echo ""
            read -p "Press Enter to continue..."
            ;;
        "Exit")
            echo ""
            echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${GREEN}MANUAL TESTING SESSION COMPLETE${NC}"
            echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📋 Remember to:"
            echo "  1. Document all findings in test report"
            echo "  2. Calculate overall success rate"
            echo "  3. Log issues for resolution"
            echo "  4. Update Phase Tracker with results"
            echo ""
            echo "Success Criteria:"
            echo "  ✅ Research topics: ≥80% relevance (8/10 topics)"
            echo "  ✅ Theme quality: κ ≥ 0.6"
            echo "  ✅ Accessibility: ≥90/100 score"
            echo "  ✅ Mobile responsive: 3/3 breakpoints"
            echo ""
            echo "Next Step: Stage 2 Phase 3 (Expert Review)"
            echo ""
            break
            ;;
        *)
            echo -e "${RED}Invalid option $REPLY${NC}"
            ;;
    esac
done
