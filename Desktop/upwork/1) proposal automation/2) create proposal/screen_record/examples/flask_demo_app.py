#!/usr/bin/env python3
"""
Flask-based demo application with clear completion signaling.
This serves the demo HTML page and provides endpoints for signaling completion.
"""

import os
import sys
import time
import signal
import threading
from flask import Flask, send_from_directory, jsonify, request, render_template_string

# Configure paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
COMPLETION_SIGNAL_FILE = os.path.join(PROJECT_DIR, ".demo_complete")

# Create Flask app
app = Flask(__name__)

# Store demo state
demo_state = {
    "start_time": None,
    "is_completed": False,
    "completion_time": None
}

# HTML template for the demo page
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graph Visualization Platform - Automated Demo</title>
    <!-- Material UI Icons -->
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <!-- Roboto Font -->
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #3f51b5;
            --secondary-color: #f50057;
            --background-color: #fafafa;
            --surface-color: #ffffff;
            --text-primary: rgba(0, 0, 0, 0.87);
            --text-secondary: rgba(0, 0, 0, 0.6);
            --border-color: rgba(0, 0, 0, 0.12);
            --success-color: #4caf50;
            --error-color: #f44336;
            --warning-color: #ff9800;
        }

        body {
            font-family: 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--background-color);
            color: var(--text-primary);
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }

        /* App Bar */
        .app-bar {
            background-color: var(--primary-color);
            color: white;
            display: flex;
            align-items: center;
            padding: 0 16px;
            height: 64px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .app-bar h1 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 500;
        }

        .spacer {
            flex-grow: 1;
        }

        /* Main Content */
        .main-content {
            flex: 1;
            padding: 24px;
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;
        }

        /* Card */
        .card {
            background-color: var(--surface-color);
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 24px;
            margin-bottom: 24px;
        }

        .card h2 {
            margin-top: 0;
            color: var(--primary-color);
            font-size: 1.5rem;
            font-weight: 500;
        }

        /* Dashboard */
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 24px;
            margin-top: 24px;
        }

        .dashboard-card {
            background-color: var(--surface-color);
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 20px;
            display: flex;
            flex-direction: column;
        }

        .dashboard-card h3 {
            margin-top: 0;
            font-size: 1.25rem;
            font-weight: 500;
        }

        /* Chart placeholder */
        .chart {
            height: 200px;
            background-color: rgba(0,0,0,0.05);
            border-radius: 4px;
            margin-top: 16px;
            position: relative;
            overflow: hidden;
        }

        .chart-line {
            position: absolute;
            height: 2px;
            background-color: var(--primary-color);
            bottom: 40px;
            left: 0;
            width: 0%;
            animation: chartAnimation 3s ease-in-out infinite;
        }

        .chart-bars {
            display: flex;
            align-items: flex-end;
            height: 100%;
            padding: 16px;
            box-sizing: border-box;
            justify-content: space-around;
        }

        .chart-bar {
            width: 30px;
            background-color: var(--primary-color);
            margin: 0 4px;
            border-radius: 4px 4px 0 0;
            animation: barAnimation 3s ease-in-out infinite;
        }

        .chart-bar:nth-child(2) {
            background-color: var(--secondary-color);
            animation-delay: 0.5s;
        }

        .chart-bar:nth-child(3) {
            background-color: var(--success-color);
            animation-delay: 1s;
        }

        .chart-bar:nth-child(4) {
            background-color: var(--warning-color);
            animation-delay: 1.5s;
        }

        @keyframes chartAnimation {
            0% { width: 0%; }
            50% { width: 90%; }
            100% { width: 100%; }
        }

        @keyframes barAnimation {
            0% { height: 30%; }
            50% { height: 70%; }
            100% { height: 50%; }
        }

        /* Button */
        .button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 16px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
            display: inline-flex;
            align-items: center;
            margin-right: 8px;
        }

        .button:hover {
            background-color: #303f9f;
        }

        .button i {
            margin-right: 8px;
        }

        /* Demo steps */
        .steps {
            counter-reset: step;
            margin: 0;
            padding: 0;
        }

        .step {
            position: relative;
            padding-left: 32px;
            margin-bottom: 16px;
            counter-increment: step;
        }

        .step:before {
            content: counter(step);
            position: absolute;
            left: 0;
            top: 0;
            width: 24px;
            height: 24px;
            background-color: var(--primary-color);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 500;
        }

        /* Progress bar */
        .progress-container {
            width: 100%;
            height: 8px;
            background-color: rgba(0,0,0,0.05);
            border-radius: 4px;
            overflow: hidden;
            margin: 24px 0;
        }

        .progress-bar {
            height: 100%;
            background-color: var(--primary-color);
            width: 0%;
            transition: width 0.3s;
        }

        /* Animation container */
        .demo-animation {
            position: relative;
            height: 300px;
            background-color: rgba(0,0,0,0.03);
            border-radius: 8px;
            overflow: hidden;
        }

        .cursor {
            position: absolute;
            width: 24px;
            height: 24px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%233f51b5' d='M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.47,2.09 7.64,2.23L7.65,2.22L19.14,11.86C19.57,12.22 19.62,12.85 19.27,13.27C19.12,13.45 18.91,13.57 18.7,13.61L15.54,14.23L17.74,18.96C18,19.46 17.76,20.05 17.26,20.28L13.64,21.97Z' /%3E%3C/svg%3E");
            background-size: contain;
            background-repeat: no-repeat;
            transform: translate(-50%, -50%);
            z-index: 10;
            pointer-events: none;
            transition: opacity 0.3s;
        }

        .feature-icon {
            position: absolute;
            width: 48px;
            height: 48px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            color: var(--primary-color);
        }

        .feature-icon i {
            font-size: 24px;
        }

        /* Demo completion modal */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
            z-index: 100;
        }

        .modal.show {
            opacity: 1;
            pointer-events: auto;
        }

        .modal-content {
            background-color: white;
            border-radius: 8px;
            padding: 24px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            text-align: center;
        }

        .modal-content h3 {
            margin-top: 0;
            color: var(--success-color);
        }
    </style>
</head>
<body>
    <!-- App Bar -->
    <div class="app-bar">
        <h1>Graph Visualization Platform</h1>
        <div class="spacer"></div>
        <div>Demo Version</div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <div class="card">
            <h2>Interactive Demonstration</h2>
            <p>This is an automated demo of the Graph Visualization Platform. You'll see key features being demonstrated automatically.</p>
            
            <div class="progress-container">
                <div class="progress-bar" id="demo-progress"></div>
            </div>
            
            <h3 id="current-step">Welcome to the demonstration</h3>
            
            <div class="demo-animation">
                <div class="cursor" id="cursor"></div>
                
                <!-- Feature icons -->
                <div class="feature-icon" style="top: 40px; left: 100px;">
                    <i class="material-icons">analytics</i>
                </div>
                <div class="feature-icon" style="top: 70px; left: 220px;">
                    <i class="material-icons">share</i>
                </div>
                <div class="feature-icon" style="top: 160px; left: 350px;">
                    <i class="material-icons">search</i>
                </div>
                <div class="feature-icon" style="top: 180px; left: 150px;">
                    <i class="material-icons">dashboard</i>
                </div>
                <div class="feature-icon" style="top: 80px; left: 450px;">
                    <i class="material-icons">settings</i>
                </div>
            </div>
            
            <div style="margin-top: 24px;">
                <p id="feature-description">The demonstration will show key features including data visualization, community detection algorithms, and interactive exploration.</p>
            </div>
        </div>

        <div class="dashboard">
            <div class="dashboard-card">
                <h3>Network Overview</h3>
                <div class="chart">
                    <div class="chart-line"></div>
                </div>
            </div>
            
            <div class="dashboard-card">
                <h3>Community Analysis</h3>
                <div class="chart">
                    <div class="chart-bars">
                        <div class="chart-bar" style="height: 40%;"></div>
                        <div class="chart-bar" style="height: 65%;"></div>
                        <div class="chart-bar" style="height: 30%;"></div>
                        <div class="chart-bar" style="height: 70%;"></div>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-card">
                <h3>Feature Status</h3>
                <ul class="steps" id="feature-list">
                    <li class="step">Data Loading</li>
                    <li class="step">Graph Rendering</li>
                    <li class="step">Community Detection</li>
                    <li class="step">Interactive Exploration</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Demo Complete Modal -->
    <div class="modal" id="demo-complete-modal">
        <div class="modal-content">
            <h3>Demo Complete</h3>
            <p>The automated demonstration has finished. Thank you for watching!</p>
            <button class="button" id="close-demo-btn">Close Demo</button>
        </div>
    </div>

    <script>
        // Demo configuration
        const demoConfig = {
            durationSeconds: 60,  // Total demo duration
            steps: [
                "Welcome to the Graph Visualization Platform demo",
                "Loading graph data and initializing visualization",
                "Rendering network connections and node relationships",
                "Applying community detection algorithms",
                "Demonstrating interactive exploration features",
                "Analyzing network patterns and insights",
                "Demo completed successfully!"
            ],
            featureDescriptions: [
                "The demonstration will show key features including data visualization, community detection algorithms, and interactive exploration.",
                "Loading and parsing complex network data from multiple sources.",
                "Visualizing connections between entities with dynamic force-directed layouts.",
                "Applying state-of-the-art algorithms to identify communities within the network.",
                "Exploring the graph through zooming, panning, and selecting nodes to see relationships.",
                "Uncovering hidden patterns and extracting actionable insights from network data.",
                "You've seen all the key features of our Graph Visualization Platform!"
            ]
        };
        
        // Get DOM elements
        const cursor = document.getElementById('cursor');
        const progressBar = document.getElementById('demo-progress');
        const currentStepElem = document.getElementById('current-step');
        const featureDescription = document.getElementById('feature-description');
        const demoCompleteModal = document.getElementById('demo-complete-modal');
        const closeDemoBtn = document.getElementById('close-demo-btn');
        
        // Animation state
        let startTime = Date.now();
        let currentStep = 0;
        let demoCompleted = false;
        
        // Function to move cursor to an element
        function moveCursorTo(x, y, duration = 1000) {
            return new Promise(resolve => {
                cursor.style.opacity = '1';
                
                const startX = parseInt(cursor.style.left) || 100;
                const startY = parseInt(cursor.style.top) || 100;
                const startTime = performance.now();
                
                function animate(time) {
                    const elapsed = time - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing function
                    const easeOutQuad = t => t * (2 - t);
                    const easedProgress = easeOutQuad(progress);
                    
                    const currentX = startX + (x - startX) * easedProgress;
                    const currentY = startY + (y - startY) * easedProgress;
                    
                    cursor.style.left = currentX + 'px';
                    cursor.style.top = currentY + 'px';
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        resolve();
                    }
                }
                
                requestAnimationFrame(animate);
            });
        }
        
        // Function to simulate clicking
        function simulateClick() {
            cursor.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 200);
            return new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Function to update progress
        function updateProgress(percent) {
            progressBar.style.width = `${percent}%`;
        }
        
        // Function to update current step
        function updateStep(stepIndex) {
            currentStepElem.textContent = demoConfig.steps[stepIndex];
            featureDescription.textContent = demoConfig.featureDescriptions[stepIndex];
            
            // Update feature list
            const featureList = document.getElementById('feature-list');
            const features = featureList.querySelectorAll('.step');
            
            // Reset all features
            features.forEach((feature, i) => {
                if (i <= stepIndex) {
                    feature.style.color = 'var(--success-color)';
                } else {
                    feature.style.color = 'var(--text-primary)';
                }
            });
        }
        
        // Function to complete the demo
        function completeDemoAndSignal() {
            if (demoCompleted) return;
            demoCompleted = true;
            
            // Show completion modal
            demoCompleteModal.classList.add('show');
            
            // Signal to the server that the demo is complete
            fetch('/api/demo-complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    completed: true,
                    timestamp: new Date().toISOString()
                })
            }).then(response => response.json())
              .then(data => {
                  console.log('Demo completion signal sent:', data);
              })
              .catch(error => {
                  console.error('Error sending completion signal:', error);
              });
        }
        
        // Run the demo
        async function runDemo() {
            // Set initial position
            cursor.style.left = '100px';
            cursor.style.top = '100px';
            cursor.style.opacity = '1';
            
            // Initial progress
            updateProgress(5);
            updateStep(0);
            
            // Step 1: Move cursor to first feature
            await moveCursorTo(100, 40);
            await simulateClick();
            updateProgress(15);
            updateStep(1);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Step 2: Move cursor to second feature
            await moveCursorTo(220, 70);
            await simulateClick();
            updateProgress(30);
            updateStep(2);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Step 3: Move cursor to third feature
            await moveCursorTo(350, 160);
            await simulateClick();
            updateProgress(45);
            updateStep(3);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Step 4: Move cursor to fourth feature
            await moveCursorTo(150, 180);
            await simulateClick();
            updateProgress(60);
            updateStep(4);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Step 5: Move cursor to fifth feature
            await moveCursorTo(450, 80);
            await simulateClick();
            updateProgress(75);
            updateStep(5);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Final step
            updateProgress(100);
            updateStep(6);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Complete demo
            completeDemoAndSignal();
        }
        
        // Close demo button event
        closeDemoBtn.addEventListener('click', () => {
            demoCompleteModal.classList.remove('show');
            window.close();
        });
        
        // Start the demo when the page loads
        window.addEventListener('load', () => {
            // Wait a moment before starting
            setTimeout(() => {
                runDemo();
                
                // Set a backup timer to ensure completion signal is sent
                setTimeout(() => {
                    completeDemoAndSignal();
                }, demoConfig.durationSeconds * 1000);
            }, 1000);
        });
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Serve the demo page."""
    # Record start time if not already set
    if demo_state["start_time"] is None:
        demo_state["start_time"] = time.time()
    
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/demo-complete', methods=['POST'])
def demo_complete():
    """Handle demo completion signal from frontend."""
    # Mark demo as completed
    demo_state["is_completed"] = True
    demo_state["completion_time"] = time.time()
    
    # Create completion signal file
    with open(COMPLETION_SIGNAL_FILE, 'w') as f:
        f.write(f"Demo completed at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Schedule server shutdown after a short delay
    threading.Thread(target=shutdown_server_after_delay, args=(3,)).start()
    
    return jsonify({"status": "success", "message": "Demo completion signal received"})

@app.route('/demo-complete')
def demo_complete_get():
    """Alternative endpoint for demo completion (GET method)."""
    # Mark demo as completed
    demo_state["is_completed"] = True
    demo_state["completion_time"] = time.time()
    
    # Create completion signal file
    with open(COMPLETION_SIGNAL_FILE, 'w') as f:
        f.write(f"Demo completed at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Schedule server shutdown after a short delay
    threading.Thread(target=shutdown_server_after_delay, args=(3,)).start()
    
    return "Demo completion signal received"

@app.route('/api/status')
def status():
    """Return current demo status."""
    return jsonify({
        "running": True,
        "started_at": demo_state["start_time"],
        "is_completed": demo_state["is_completed"],
        "completed_at": demo_state["completion_time"]
    })

def shutdown_server_after_delay(delay_seconds):
    """Shutdown the Flask server after a short delay."""
    time.sleep(delay_seconds)
    print(f"Demo completed. Shutting down server...")
    # Get the werkzeug server and stop it
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        # Alternative method to shutdown - send SIGINT to our own process
        os.kill(os.getpid(), signal.SIGINT)
    else:
        func()

def start_auto_completion_timer(max_duration=120):
    """Start a background timer to complete the demo automatically if needed."""
    def _auto_complete():
        time.sleep(max_duration)
        # Check if demo is already completed
        if not demo_state["is_completed"]:
            print(f"Auto-completion timer triggered after {max_duration} seconds")
            # Create completion signal file
            with open(COMPLETION_SIGNAL_FILE, 'w') as f:
                f.write(f"Demo auto-completed at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            # Exit the process (which will be detected by the monitoring script)
            os._exit(0)
    
    # Start timer in background thread
    timer_thread = threading.Thread(target=_auto_complete)
    timer_thread.daemon = True
    timer_thread.start()
    print(f"Auto-completion timer started ({max_duration} seconds)")

def find_available_port(start_port=5000, max_tries=10):
    """Find an available port starting from start_port."""
    import socket
    
    for port in range(start_port, start_port + max_tries):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        try:
            sock.bind(('0.0.0.0', port))
            sock.close()
            return port
        except socket.error:
            print(f"Port {port} is already in use, trying next port...")
            continue
    
    # If we get here, we couldn't find an available port
    print(f"WARNING: Could not find an available port after {max_tries} tries.")
    return start_port  # Return the starting port and hope for the best

if __name__ == '__main__':
    # Check if completion signal file already exists and remove it
    if os.path.exists(COMPLETION_SIGNAL_FILE):
        os.remove(COMPLETION_SIGNAL_FILE)
    
    # Start auto-completion timer
    start_auto_completion_timer(120)  # 2 minutes max
    
    # Find an available port
    port = find_available_port(5000, 10)
    
    # Run Flask app
    print(f"Starting demo server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port)