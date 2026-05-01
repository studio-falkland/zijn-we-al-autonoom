#!/bin/bash

set -e

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

SKIP_EXTRACTION=false

for arg in "$@"; do
  case $arg in
    --no-extraction)
      SKIP_EXTRACTION=true
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

echo "🚀 Starting deployment..."

echo ""
if [ "$SKIP_EXTRACTION" = true ]; then
  echo "📦 Step 1/4: Skipping extraction (--no-extraction)"
else
  echo "📦 Step 1/4: Running extraction..."
  pnpm extract
fi

echo ""
echo "🔨 Step 2/4: Building app..."
pnpm app:build

echo ""
echo "🔍 Step 3/4: Generating search JSON..."
(cd app && node scripts/generate-search-json.mts)

echo ""
echo "☁️  Step 4/4: Syncing to Bunny storage..."
(cd app && node scripts/bunny-storage.mts \
  --storage-zone "$BUNNY_STORAGE_ZONE" \
  --access-key "$BUNNY_ACCESS_KEY" \
  --directory ./out)

echo ""
echo "✅ Deployment complete!"
