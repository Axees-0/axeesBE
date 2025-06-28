#!/bin/bash

echo "=== BACK BUTTON AUDIT FOR AXEES APP ==="
echo ""
echo "Pages WITH back button implementation:"
echo "======================================="

# Check for pages with back button implementations
for file in $(find ./app -name "*.tsx" -type f | grep -v "_layout" | grep -v "test" | sort); do
    if grep -q -E "(arrow-back|router\.back|UniversalBackButton|goBack|navigation\.goBack|ChevronLeft.*onPress)" "$file" 2>/dev/null; then
        echo "✓ $file"
        # Show what type of back button it uses
        if grep -q "UniversalBackButton" "$file" 2>/dev/null; then
            echo "  → Uses UniversalBackButton"
        elif grep -q "router\.back" "$file" 2>/dev/null; then
            echo "  → Uses router.back()"
        elif grep -q "arrow-back" "$file" 2>/dev/null; then
            echo "  → Uses arrow-back icon"
        fi
    fi
done

echo ""
echo "Pages WITHOUT back button (might need one):"
echo "==========================================="

# Check for pages without back button but might need one
for file in $(find ./app -name "*.tsx" -type f | grep -v "_layout" | grep -v "test" | grep -v "(tabs)" | sort); do
    if ! grep -q -E "(arrow-back|router\.back|UniversalBackButton|goBack|navigation\.goBack|ChevronLeft.*onPress)" "$file" 2>/dev/null; then
        # Check if it has a header (which might indicate it needs a back button)
        if grep -q -E "(headerTitle|Header|<View.*header)" "$file" 2>/dev/null; then
            echo "⚠ $file - Has header but no back button"
        else
            echo "○ $file - No header/back button"
        fi
    fi
done

echo ""
echo "Tab pages (usually don't need back buttons):"
echo "==========================================="
find ./app -path "*/(tabs)/*.tsx" -type f | grep -v "_layout" | sort