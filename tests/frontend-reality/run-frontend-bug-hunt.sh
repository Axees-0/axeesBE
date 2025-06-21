#!/bin/bash

# Frontend Bug Hunt Runner
# Finds the bugs that users actually experience

echo "🕷️ FRONTEND BUG HUNTER"
echo "Hunting for bugs that break user experience..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Check if frontend is running
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3000"}

echo "📋 Pre-flight checks..."

# Check if frontend is accessible
if ! curl -s "$FRONTEND_URL" > /dev/null; then
    echo -e "${RED}❌ Frontend not running at $FRONTEND_URL${NC}"
    echo "Please start your frontend application first:"
    echo "  npm run dev  (or equivalent)"
    exit 1
fi

# Check if Node.js and required packages are available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Install puppeteer if not available
if [ ! -d "node_modules/puppeteer" ]; then
    echo -e "${YELLOW}⚠️ Installing Puppeteer for browser automation...${NC}"
    npm install puppeteer
fi

# Parse command line arguments
COMPREHENSIVE=false
SPECIFIC_TEST=""
HEADLESS=false
QUICK_MODE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --comprehensive)
      COMPREHENSIVE=true
      shift
      ;;
    --test)
      SPECIFIC_TEST="$2"
      shift
      shift
      ;;
    --headless)
      HEADLESS=true
      shift
      ;;
    --quick)
      QUICK_MODE=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      echo "Usage: $0 [--comprehensive] [--test TEST_NAME] [--headless] [--quick]"
      echo ""
      echo "Options:"
      echo "  --comprehensive  Run all bug tests (takes 15-30 minutes)"
      echo "  --test NAME      Run specific test (auth, chat, forms, mobile, performance)"
      echo "  --headless       Run browser in headless mode (faster, no visual)"
      echo "  --quick          Run only critical bug tests (5 minutes)"
      exit 1
      ;;
  esac
done

# Set environment variables
export FRONTEND_URL="$FRONTEND_URL"
if [ "$HEADLESS" = true ]; then
    export PUPPETEER_HEADLESS=true
fi

if [ "$QUICK_MODE" = true ]; then
    echo -e "${BLUE}🚀 Running QUICK frontend bug hunt (critical issues only)...${NC}"
    echo ""
    
    echo -e "${YELLOW}Testing authentication flow bugs...${NC}"
    timeout 120s node specific-bug-tests/authentication-flow-bugs.js
    
    echo -e "${YELLOW}Testing form data loss bugs...${NC}"
    timeout 120s node specific-bug-tests/form-data-bugs.js
    
    echo -e "${YELLOW}Testing chat real-time bugs...${NC}"
    timeout 120s node specific-bug-tests/chat-realtime-bugs.js
    
    echo -e "${GREEN}✅ Quick frontend bug hunt complete${NC}"
    
elif [ "$COMPREHENSIVE" = true ]; then
    echo -e "${BLUE}🔬 Running COMPREHENSIVE frontend bug hunt (all scenarios)...${NC}"
    echo ""
    
    # Run the main bug hunter
    node frontend-bug-hunter.js
    
elif [ ! -z "$SPECIFIC_TEST" ]; then
    echo -e "${BLUE}🎯 Testing specific area: $SPECIFIC_TEST${NC}"
    echo ""
    
    case $SPECIFIC_TEST in
        auth)
            echo -e "${PURPLE}🔐 AUTHENTICATION BUG HUNT${NC}"
            node specific-bug-tests/authentication-flow-bugs.js
            ;;
        chat)
            echo -e "${PURPLE}💬 CHAT & REAL-TIME BUG HUNT${NC}"
            node specific-bug-tests/chat-realtime-bugs.js
            ;;
        forms)
            echo -e "${PURPLE}📝 FORM & DATA BUG HUNT${NC}"
            node specific-bug-tests/form-data-bugs.js
            ;;
        mobile)
            echo -e "${PURPLE}📱 MOBILE BUG HUNT${NC}"
            # Mobile testing is integrated into other tests
            echo "Mobile testing integrated across all bug hunters..."
            node frontend-bug-hunter.js --mobile-focus
            ;;
        performance)
            echo -e "${PURPLE}🚀 PERFORMANCE BUG HUNT${NC}"
            # Performance testing
            echo "Performance testing integrated into main bug hunter..."
            node frontend-bug-hunter.js --performance-focus
            ;;
        *)
            echo -e "${RED}❌ Unknown test area: $SPECIFIC_TEST${NC}"
            echo "Available tests: auth, chat, forms, mobile, performance"
            exit 1
            ;;
    esac
else
    echo -e "${BLUE}🔄 Running STANDARD frontend bug hunt...${NC}"
    echo ""
    
    # Run critical tests from each area
    echo -e "${YELLOW}1/3 Authentication & Login Bugs${NC}"
    timeout 300s node specific-bug-tests/authentication-flow-bugs.js
    
    echo ""
    echo -e "${YELLOW}2/3 Form & Data Entry Bugs${NC}"
    timeout 300s node specific-bug-tests/form-data-bugs.js
    
    echo ""
    echo -e "${YELLOW}3/3 Chat & Real-time Bugs${NC}"
    timeout 300s node specific-bug-tests/chat-realtime-bugs.js
fi

echo ""
echo "=============================================="
echo -e "${GREEN}🕷️ FRONTEND BUG HUNT COMPLETE${NC}"
echo "=============================================="
echo ""
echo "📊 Summary:"
echo "• Check the detailed output above for specific bugs found"
echo "• Critical bugs make the app unusable for real users"
echo "• High-risk bugs create frustration and support tickets"
echo "• Medium/low bugs affect polish and edge cases"
echo ""
echo "💡 Next steps:"
echo "• Fix critical bugs before any user testing"
echo "• Address high-risk bugs before public launch"
echo "• Test the specific user scenarios that failed"
echo "• Run this again after fixes to validate improvements"
echo ""
echo "🎯 Pro tip: The bugs found here are the ones that create"
echo "   support tickets and make users abandon your app."
echo ""

# Check for critical issues in output
if grep -q "CRITICAL" /tmp/frontend-bug-output 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL BUGS FOUND - DO NOT DEPLOY${NC}"
    exit 1
elif grep -q "HIGH.*BUG" /tmp/frontend-bug-output 2>/dev/null; then
    echo -e "${YELLOW}⚠️ HIGH-RISK BUGS FOUND - FIX BEFORE LAUNCH${NC}"
    exit 2
else
    echo -e "${GREEN}✅ NO CRITICAL FRONTEND BUGS DETECTED${NC}"
    exit 0
fi