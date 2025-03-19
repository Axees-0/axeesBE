#!/usr/bin/env python3
"""
CloudTrader DX Admin Reporting API Sample
This script demonstrates how to connect to a CloudTrader DX API endpoint
"""

import requests
import json
import sys
from datetime import datetime

# API Endpoints
BASE_URL = "https://dx.cloudtrader.app/dxweb"
DX_SCA_URL = "https://dx.cloudtrader.app/dxsca-web"

# Authentication credentials
USERNAME = "your_username"
PASSWORD = "your_password"

def login():
    """Authenticate with the DX Admin API and return the session token"""
    login_url = f"{BASE_URL}/api/auth/login"
    
    payload = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(login_url, json=payload)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        # Extract and return the token
        data = response.json()
        if "token" in data:
            return data["token"]
        else:
            print(f"Login failed: {data.get('message', 'Unknown error')}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Error during login: {e}")
        return None

def get_accounts(token):
    """Retrieve trading accounts from the DX Admin API"""
    accounts_url = f"{BASE_URL}/api/accounts"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(accounts_url, headers=headers)
        response.raise_for_status()
        
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"Error retrieving accounts: {e}")
        return None

def get_trades(token, account_id, start_date=None, end_date=None):
    """Retrieve trades for a specific account"""
    # Set default date range to current day if not provided
    if not start_date:
        start_date = datetime.now().strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
        
    trades_url = f"{BASE_URL}/api/trades"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    params = {
        "accountId": account_id,
        "startDate": start_date,
        "endDate": end_date
    }
    
    try:
        response = requests.get(trades_url, headers=headers, params=params)
        response.raise_for_status()
        
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"Error retrieving trades: {e}")
        return None

def get_reports(token, report_type, start_date=None, end_date=None):
    """Generate and retrieve reports from the DX Admin API"""
    if not start_date:
        start_date = datetime.now().strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
        
    reports_url = f"{BASE_URL}/api/reports/{report_type}"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    params = {
        "startDate": start_date,
        "endDate": end_date,
        "format": "json"  # or "csv" for CSV format
    }
    
    try:
        response = requests.get(reports_url, headers=headers, params=params)
        response.raise_for_status()
        
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"Error retrieving report: {e}")
        return None

def main():
    print("CloudTrader DX Admin API Sample")
    print("===============================\n")
    
    # Step 1: Login to get authentication token
    print("Logging in...")
    token = login()
    if not token:
        print("Login failed. Please check your credentials.")
        sys.exit(1)
    
    print("Login successful!")
    
    # Step 2: Retrieve accounts
    print("\nRetrieving accounts...")
    accounts = get_accounts(token)
    if accounts:
        print(f"Found {len(accounts)} accounts")
        for i, account in enumerate(accounts[:5]):  # Show first 5 accounts
            print(f"  {i+1}. Account {account.get('login')}: {account.get('name')} - Balance: {account.get('balance')}")
        if len(accounts) > 5:
            print(f"  ... and {len(accounts) - 5} more")
    
    # Step 3: Get trades for the first account (if any accounts are found)
    if accounts and len(accounts) > 0:
        account_id = accounts[0].get('login')
        print(f"\nRetrieving trades for account {account_id}...")
        trades = get_trades(token, account_id)
        if trades:
            print(f"Found {len(trades)} trades")
            for i, trade in enumerate(trades[:5]):  # Show first 5 trades
                print(f"  {i+1}. Order #{trade.get('ticket')}: {trade.get('symbol')} {trade.get('type')} - Profit: {trade.get('profit')}")
            if len(trades) > 5:
                print(f"  ... and {len(trades) - 5} more")
    
    # Step 4: Generate a summary report
    print("\nGenerating daily summary report...")
    report = get_reports(token, "daily_summary")
    if report:
        print("Report generated successfully")
        print("Summary:")
        for key, value in report.get('summary', {}).items():
            print(f"  {key}: {value}")
    
    print("\nAPI sample completed")

if __name__ == "__main__":
    main()