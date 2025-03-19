# MT4 Mock API

This component provides a mock implementation of the MT4 Manager API for development and testing purposes.

## Overview

The MT4 Mock API simulates the behavior of the MT4 Manager API without requiring a real MT4 terminal. It's intended for development and testing on macOS, following the Mac-first development approach outlined in the project guidelines.

## Features

- Simulates trade execution (buy/sell orders)
- Tracks open orders
- Supports order modification (SL/TP)
- Provides order status updates
- Exposes a RESTful API interface

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Get server status |
| `/api/trade` | POST | Execute a trade |
| `/api/orders` | GET | Get all open orders |
| `/api/orders/{ticket}` | GET | Get order details |
| `/api/orders/{ticket}/close` | POST | Close an order |
| `/api/orders/{ticket}/modify` | POST | Modify an order |

## Usage

### Running the Server

```bash
# From project root
./scripts/start_mt4_mock_api.sh

# Or with custom options
./scripts/start_mt4_mock_api.sh --port 5004 --debug
```

### Example API Calls

#### Execute a Trade

```bash
curl -X POST http://localhost:5003/api/trade \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "EURUSD",
    "type": "BUY",
    "volume": 0.1,
    "price": 1.2345,
    "sl": 1.2300,
    "tp": 1.2400
  }'
```

#### Get Order Status

```bash
curl -X GET http://localhost:5003/api/orders/10001
```

#### Close an Order

```bash
curl -X POST http://localhost:5003/api/orders/10001/close
```

## Integration with Other Components

The MT4 Mock API is designed to be used by the Telegram Bot for trade execution and by the Webhook API for signal processing. It provides the same interface as the real MT4 Manager API, allowing seamless transition to the real API in the Windows deployment phase.