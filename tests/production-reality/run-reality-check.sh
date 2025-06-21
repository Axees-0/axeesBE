#!/bin/bash

# Production Reality Check Runner
# Systematically validates real-world edge cases

echo "🔥 PRODUCTION REALITY CHECK"
echo "Testing where 'works on paper' breaks in reality..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if MongoDB is running
echo "📋 Pre-flight checks..."
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${RED}❌ MongoDB not running. Starting...${NC}"
    sudo systemctl start mongod
    sleep 3
fi

# Check if server dependencies are installed
if [ ! -f "../../../node_modules/.bin/jest" ]; then
    echo -e "${YELLOW}⚠️ Installing test dependencies...${NC}"
    cd ../../..
    npm install
    cd tests/production-reality
fi

# Set test environment
export NODE_ENV=test
export MONGO_URI="mongodb://localhost:27017/"

# Parse command line arguments
QUICK_MODE=false
COMPREHENSIVE=false
SPECIFIC_CATEGORY=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --quick)
      QUICK_MODE=true
      shift
      ;;
    --comprehensive)
      COMPREHENSIVE=true
      shift
      ;;
    --category)
      SPECIFIC_CATEGORY="$2"
      shift
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

if [ "$QUICK_MODE" = true ]; then
    echo -e "${BLUE}🚀 Running QUICK reality check (critical issues only)...${NC}"
    
    # Run only the most critical tests
    echo -e "${YELLOW}Testing authentication session expiry...${NC}"
    npm test -- authentication-torture/session-expiry-mid-action.test.js --silent
    
    echo -e "${YELLOW}Testing WebSocket connection drops...${NC}"
    npm test -- realtime-chaos/connection-drops-during-upload.test.js --silent
    
    echo -e "${YELLOW}Testing payment webhook timing...${NC}"
    npm test -- payment-nightmares/webhook-timing-issues.test.js --silent
    
    echo -e "${GREEN}✅ Quick reality check complete${NC}"
    
elif [ "$COMPREHENSIVE" = true ]; then
    echo -e "${BLUE}🔬 Running COMPREHENSIVE reality check (all scenarios)...${NC}"
    
    # Run the full orchestrator
    node test-orchestrator.js
    
elif [ ! -z "$SPECIFIC_CATEGORY" ]; then
    echo -e "${BLUE}🎯 Testing specific category: $SPECIFIC_CATEGORY${NC}"
    
    case $SPECIFIC_CATEGORY in
        auth)
            npm test -- authentication-torture/
            ;;
        realtime)
            npm test -- realtime-chaos/
            ;;
        data)
            npm test -- data-consistency/
            ;;
        payments)
            npm test -- payment-nightmares/
            ;;
        mobile)
            npm test -- mobile-reality/
            ;;
        *)
            echo -e "${RED}❌ Unknown category: $SPECIFIC_CATEGORY${NC}"
            echo "Available categories: auth, realtime, data, payments, mobile"
            exit 1
            ;;
    esac
else
    echo -e "${BLUE}🔄 Running STANDARD reality check...${NC}"
    
    # Run critical tests from each category
    echo ""
    echo -e "${YELLOW}1/5 Authentication Torture Tests${NC}"
    npm test -- authentication-torture/ --silent
    
    echo ""
    echo -e "${YELLOW}2/5 Real-time Chaos Tests${NC}"
    npm test -- realtime-chaos/ --silent
    
    echo ""
    echo -e "${YELLOW}3/5 Data Consistency Tests${NC}"
    npm test -- data-consistency/ --silent
    
    echo ""
    echo -e "${YELLOW}4/5 Payment Nightmare Tests${NC}"
    npm test -- payment-nightmares/ --silent
    
    echo ""
    echo -e "${YELLOW}5/5 Mobile Reality Tests${NC}"
    npm test -- mobile-reality/ --silent
fi

echo ""
echo "=============================================="
echo -e "${GREEN}🏁 PRODUCTION REALITY CHECK COMPLETE${NC}"
echo "=============================================="
echo ""
echo "📊 Summary:"
echo "• Check the detailed report above for specific issues"
echo "• Critical issues must be fixed before production"
echo "• High-risk issues should be monitored closely"
echo ""
echo "💡 Next steps:"
echo "• Review any failed tests carefully"
echo "• Test the specific user journeys that failed"
echo "• Add monitoring for identified edge cases"
echo ""

# Exit with error code if any tests failed
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Some reality checks failed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All reality checks passed${NC}"
    exit 0
fi