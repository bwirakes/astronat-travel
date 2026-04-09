#!/bin/bash
# download_ephe.sh — Download Swiss Ephemeris DE431 .se1 files
# These are required by pyswisseph for high-precision calculations.
# Source: https://www.astro.com/ftp/swisseph/ephe/
#
# Usage: ./download_ephe.sh [target_dir]
# Default target: ./data/ephemeris_files/

set -euo pipefail

TARGET_DIR="${1:-$(dirname "$0")/../data/ephemeris_files}"
mkdir -p "$TARGET_DIR"

BASE_URL="https://www.astro.com/ftp/swisseph/ephe"

# Required files for 1800-2400 CE range:
# seas_18.se1  — 1800-1899
# semo_18.se1  — Moon 1800-1899
# sepl_18.se1  — Planets 1800-1899 (and so on for each century)
FILES=(
    "seas_18.se1"
    "seas_24.se1"
    "semo_18.se1"
    "semo_24.se1"
    "sepl_18.se1"
    "sepl_24.se1"
)

echo "📡 Downloading Swiss Ephemeris files to $TARGET_DIR ..."

for f in "${FILES[@]}"; do
    if [ -f "$TARGET_DIR/$f" ]; then
        echo "  ✓ $f (already exists, skipping)"
    else
        echo "  ⬇ Downloading $f ..."
        curl -sSfL "$BASE_URL/$f" -o "$TARGET_DIR/$f" || {
            echo "  ⚠️  Failed to download $f — will fall back to built-in Moshier ephemeris"
            continue
        }
        echo "  ✓ $f downloaded"
    fi
done

echo "✅ Ephemeris files ready in $TARGET_DIR"
echo ""
echo "Note: pyswisseph will use built-in Moshier ephemeris as fallback if .se1 files"
echo "are not found. Moshier is good to ~1 arcsecond; DE431 is good to ~0.001 arcsecond."
