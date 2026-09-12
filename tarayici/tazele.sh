#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")"
if (( $# != 2 )); then
  print -u2 'Usage: ./tazele.sh <ethereum|sepolia|arbitrum|arc> <highest-id-to-scan>'
  exit 2
fi
case "$1" in ethereum|sepolia|arbitrum|arc) ;; *) exit 2;; esac
export NOMEN_SCAN_DIR="$PWD/snapshots/$(date -u +%Y%m%dT%H%M%SZ)-$1"
mkdir -p "$NOMEN_SCAN_DIR"
python3 adim1_uri.py "$1" "$2"
python3 adim2_metadata.py "$1"
python3 adim3_kurallar.py "$1"
python3 adim4_kategori.py "$1"
python3 adim7_merkle.py "$1"
print "Snapshot ready for review: $NOMEN_SCAN_DIR"
print 'Inspect unresolved_ids and compare eligibility before publishing. Existing site data is preserved.'
