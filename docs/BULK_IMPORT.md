# Bulk Import System

The bulk import system allows sellers to import products from CSV files, perfect for migrating from platforms like Etsy, Shopify, WooCommerce, or Squarespace.

## Features

- **CSV Upload & Preview**: Upload CSV files and preview the data before importing
- **Automatic Header Mapping**: Uses Fuse.js to automatically map CSV headers to product fields
- **Platform-Specific Mapping**: Pre-configured mappings for Etsy, Shopify, WooCommerce, Squarespace
- **Save Mappings**: Save mappings for future imports from the same platform
- **Background Processing**: Uses BullMQ and Redis for background job processing
- **Batch Processing**: Processes 50 rows at a time to avoid overwhelming the system
- **Image Ingestion**: Automatically fetches images from URLs and uploads them to your storage
- **Error Handling**: Continues processing even if some rows fail, exports failed rows as CSV
- **Storage Abstraction**: Easy to switch storage providers (currently UploadThing)

## Setup

### 1. Database Migration

Run Prisma migrations to add the new models:

```bash
npx prisma migrate dev --name add_bulk_import
```

### 2. Redis Setup

**Redis is required for the bulk import system to work.** The system uses Redis with BullMQ to process import jobs in the background.

#### Option A: Local Redis (Development)

**Windows:**
1. Download Redis for Windows from [Memurai](https://www.memurai.com/get-memurai) (Redis-compatible) or use [WSL2](https://docs.microsoft.com/en-us/windows/wsl/install) to run Linux Redis
2. Install and start Redis/Memurai
3. Redis should be running on `localhost:6379` by default

**macOS:**
```bash
# Using Homebrew
brew install redis
brew services start redis
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:latest
```

#### Option B: Cloud Redis (Production)

Use a cloud Redis service like:
- **Redis Cloud** (https://redis.com/cloud)
- **AWS ElastiCache**
- **Azure Cache for Redis**
- **Upstash** (serverless Redis)

Set the `REDIS_URL` environment variable:
```bash
REDIS_URL=redis://username:password@host:port
```

#### Environment Variables

Add to your `.env` file:

```bash
# Option 1: Use REDIS_URL (recommended for cloud Redis)
REDIS_URL=redis://localhost:6379

# Option 2: Use individual settings (for local Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # Optional, only if Redis has a password
```

**Note:** If Redis is not available, the bulk import will show an error message. The application will continue to work, but bulk imports will fail until Redis is configured.

### 3. Start Worker Process

The bulk import worker processes jobs in the background. Start it separately:

```bash
# Development
ts-node -r tsconfig-paths/register scripts/bulk-import-worker.ts

# Production (use PM2 or similar)
pm2 start scripts/bulk-import-worker.ts --name bulk-import-worker
```

Or integrate it into your server.js if you prefer.

## Usage

### For Sellers

1. Navigate to `/seller/bulk-import`
2. Upload a CSV file (max 500 rows)
3. Select your source platform (Etsy, Shopify, etc.)
4. Review and adjust the automatic header mapping
5. Save the mapping (optional, for future imports)
6. Start the import
7. Monitor progress and download failed rows if needed

### CSV Format

Your CSV should include columns that can be mapped to product fields:

**Required Fields:**
- Product Name (name)
- Description (description)
- Images (images[] or IMAGE1, IMAGE2, etc.)

**Optional Fields:**
- Price (price)
- Currency (currency)
- Stock/Quantity (stock)
- SKU (sku)
- Tags (tags[])
- Materials (materialTags[])
- Categories (primaryCategory, secondaryCategory, tertiaryCategory)
- And more...

### Mapping Examples

**Etsy Export:**
- `TITLE` → `name`
- `DESCRIPTION` → `description`
- `PRICE` → `price`
- `CURRENCY_CODE` → `currency`
- `QUANTITY` → `stock`
- `TAGS` → `tags[]`
- `MATERIALS` → `materialTags[]`
- `IMAGE1`, `IMAGE2`, etc. → `images[]`
- `SKU` → `sku`

**Shopify Export:**
- `title` → `name`
- `body_html` → `description`
- `price` → `price`
- `inventory_quantity` → `stock`
- `tags` → `tags[]`
- `image_src` → `images[]`

## Architecture

### Components

1. **Storage Abstraction** (`lib/storage/`)
   - Interface for storage providers
   - UploadThing adapter implementation
   - Easy to add S3, Cloudinary, etc.

2. **Queue System** (`lib/queues/`)
   - BullMQ queue for job management
   - Redis connection management
   - Job status tracking

3. **Worker** (`lib/workers/`)
   - Background job processor
   - Batch processing (50 rows at a time)
   - Error handling and retry logic

4. **Processor** (`lib/bulk-import/`)
   - CSV row normalization
   - Zod schema validation
   - Image ingestion
   - Product creation

5. **Mapping** (`lib/bulk-import/mapping.ts`)
   - Automatic header mapping with Fuse.js
   - Platform-specific patterns
   - Mapping validation

### API Endpoints

- `POST /api/bulk-import/upload` - Upload and preview CSV
- `GET /api/bulk-import/mapping` - Get or generate mapping
- `POST /api/bulk-import/mapping` - Save mapping
- `POST /api/bulk-import/start` - Start import job
- `GET /api/bulk-import/status/[jobId]` - Get job status
- `GET /api/bulk-import/failed-rows/[jobId]` - Download failed rows CSV

### Database Models

- `BulkImportJob` - Tracks import jobs
- `CSVMapping` - Stores saved mappings per seller/platform

## Configuration

### Limits

- **Max rows per import**: 500
- **Batch size**: 50 rows
- **Max file size**: 10MB
- **Max images per product**: 10

### Environment Variables

```env
REDIS_URL=redis://localhost:6379
# Or
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

## Troubleshooting

### Worker Not Processing Jobs

1. Check Redis connection
2. Verify worker is running
3. Check job status in database
4. Review worker logs

### Images Not Uploading

1. Check storage adapter configuration
2. Verify image URLs are accessible
3. Check UploadThing API keys
4. Review error logs

### Mapping Issues

1. Check CSV headers match expected format
2. Try selecting the correct platform
3. Manually adjust mappings if needed
4. Save mapping for future use

## Future Enhancements

- Support for more platforms
- Custom field mappings
- Import templates
- Scheduled imports
- Import history and analytics
- Support for product variations/options



