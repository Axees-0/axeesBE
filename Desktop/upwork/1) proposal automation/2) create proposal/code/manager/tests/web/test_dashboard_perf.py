#!/usr/bin/env python3
"""
Performance test script for the dashboard optimizations.
This script measures:
1. Initial page load time
2. API response time with and without sync
3. Multiple consecutive requests to simulate real usage
"""

import time
import requests
import statistics
import subprocess
import signal
import os
import sys
from datetime import datetime


def run_test(url, description, repeat=5):
    """Run a performance test on the given URL."""
    print(f"\n--- Testing: {description} ---")
    times = []
    
    for i in range(repeat):
        start_time = time.time()
        response = requests.get(url)
        end_time = time.time()
        
        elapsed_ms = (end_time - start_time) * 1000
        times.append(elapsed_ms)
        
        status = "✓" if response.status_code == 200 else "✗"
        print(f"  Request {i+1}: {elapsed_ms:.2f}ms ({status})")
        
        # Small delay between requests
        time.sleep(0.2)
    
    # Calculate statistics
    avg_time = statistics.mean(times)
    median_time = statistics.median(times)
    max_time = max(times)
    min_time = min(times)
    
    print(f"  Results:")
    print(f"    Average: {avg_time:.2f}ms")
    print(f"    Median:  {median_time:.2f}ms")
    print(f"    Fastest: {min_time:.2f}ms")
    print(f"    Slowest: {max_time:.2f}ms")
    
    return {
        "description": description,
        "average": avg_time,
        "median": median_time,
        "min": min_time,
        "max": max_time,
        "all_times": times
    }


def start_server():
    """Start the dashboard server as a subprocess."""
    print("Starting dashboard server...")
    
    # Use Popen to start the server as a background process
    process = subprocess.Popen(
        ["python", "launcher.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True
    )
    
    # Wait for server to start
    time.sleep(3)
    
    # Check if server is running
    try:
        response = requests.get("http://localhost:5001/")
        if response.status_code == 200:
            print("Server started successfully!")
            return process
        else:
            print(f"Server started but returned status code {response.status_code}")
            return process
    except Exception as e:
        print(f"Failed to connect to server: {e}")
        process.terminate()
        sys.exit(1)


def stop_server(process):
    """Stop the dashboard server."""
    print("\nStopping server...")
    process.terminate()
    
    # Wait for process to terminate
    try:
        process.wait(timeout=5)
        print("Server stopped")
    except subprocess.TimeoutExpired:
        print("Server didn't stop gracefully, forcing termination")
        process.kill()


def main():
    """Run the performance tests."""
    # Define test parameters
    base_url = "http://localhost:5001"
    
    # Log test session
    print(f"Starting performance tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Start server
    server_process = start_server()
    
    try:
        # Run tests
        results = []
        
        # Test 1: Main dashboard page (measures initial load time)
        results.append(run_test(f"{base_url}/", "Main Dashboard Page"))
        
        # Test 2: API without sync (fast path)
        results.append(run_test(f"{base_url}/api/instances", "API Instances (No Sync)"))
        
        # Test 3: API with sync (slow path)
        results.append(run_test(f"{base_url}/api/instances?sync=true", "API Instances (With Sync)"))
        
        # Test 4: Simulated user session (10 rapid requests)
        results.append(run_test(f"{base_url}/api/instances", "Simulated User Session", repeat=10))
        
        # Print summary
        print("\n" + "=" * 60)
        print("PERFORMANCE TEST SUMMARY")
        print("=" * 60)
        
        for result in results:
            print(f"{result['description']}: {result['average']:.2f}ms avg, {result['median']:.2f}ms median")
        
        # Calculate relative performance gain
        if len(results) >= 3:
            no_sync = results[1]["average"]
            with_sync = results[2]["average"]
            perf_gain = ((with_sync - no_sync) / with_sync) * 100
            print(f"\nPerformance gain (no-sync vs sync): {perf_gain:.1f}%")
        
    finally:
        # Stop server
        stop_server(server_process)


if __name__ == "__main__":
    main()