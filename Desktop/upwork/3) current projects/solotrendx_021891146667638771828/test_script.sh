#!/bin/bash
# Test script for sending a trading signal

echo "Sending test signal to SoloTrend X system..."
echo ""

# Define the webhook API port
WEBHOOK_API_PORT=5003

echo "Sending test trading signal to port $WEBHOOK_API_PORT..."
curl -X POST http://localhost:$WEBHOOK_API_PORT/webhook/tradingview \
     -H "Content-Type: application/json" \
     -d "{\"symbol\":\"EURUSD\",\"side\":\"BUY\",\"price\":1.1234,\"sl\":1.1200,\"tp1\":1.1300,\"strategy\":\"SoloTrend X Test\"}"
echo ""
echo ""

echo "Test signal sent. Check your Telegram for notification."
echo ""
echo "If you received a Telegram notification, all services are working correctly!"