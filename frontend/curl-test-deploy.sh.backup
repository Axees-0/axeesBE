#!/bin/bash

echo "Testing deployed site: https://polite-ganache-3a4e1b.netlify.app"
echo "=================================================="

# Test 1: Basic connectivity
echo -e "\n1. Testing basic connectivity..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://polite-ganache-3a4e1b.netlify.app)
if [ "$response" = "200" ]; then
    echo "✅ Site is accessible (HTTP 200)"
else
    echo "❌ Site returned HTTP $response"
fi

# Test 2: Check HTML content
echo -e "\n2. Checking HTML content..."
html_content=$(curl -s https://polite-ganache-3a4e1b.netlify.app)

# Check for key elements
if echo "$html_content" | grep -q "root"; then
    echo "✅ Found root element"
else
    echo "❌ Root element not found"
fi

if echo "$html_content" | grep -q "bundle.js"; then
    echo "✅ Found JavaScript bundle reference"
else
    echo "❌ JavaScript bundle reference not found"
fi

# Test 3: Check for debug panel markers
echo -e "\n3. Checking for debug features..."
if echo "$html_content" | grep -q "debug"; then
    echo "✅ Found debug references in HTML"
else
    echo "⚠️  No debug references found in initial HTML"
fi

# Test 4: Check JavaScript bundle
echo -e "\n4. Checking JavaScript bundle..."
js_urls=$(echo "$html_content" | grep -oE 'src="[^"]*\.js"' | cut -d'"' -f2)

for js_url in $js_urls; do
    if [[ ! "$js_url" =~ ^https?:// ]]; then
        js_url="https://polite-ganache-3a4e1b.netlify.app$js_url"
    fi
    
    echo "Checking: $js_url"
    js_response=$(curl -s -o /dev/null -w "%{http_code}" "$js_url")
    if [ "$js_response" = "200" ]; then
        echo "✅ JavaScript file accessible"
        
        # Check for our inline provider code
        js_content=$(curl -s "$js_url")
        if echo "$js_content" | grep -q "INLINE PROVIDER"; then
            echo "✅ Found INLINE PROVIDER code in bundle"
        fi
        if echo "$js_content" | grep -q "INLINE HOOK"; then
            echo "✅ Found INLINE HOOK code in bundle"
        fi
    else
        echo "❌ JavaScript file returned HTTP $js_response"
    fi
done

# Test 5: Check for manifest
echo -e "\n5. Checking manifest.json..."
manifest_response=$(curl -s -o /dev/null -w "%{http_code}" https://polite-ganache-3a4e1b.netlify.app/manifest.json)
if [ "$manifest_response" = "200" ]; then
    echo "✅ Manifest accessible"
else
    echo "❌ Manifest returned HTTP $manifest_response"
fi

echo -e "\n=================================================="
echo "Test completed at $(date)"