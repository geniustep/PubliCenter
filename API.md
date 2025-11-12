# 📡 PubliCenter API Documentation

Complete API reference for PubliCenter multi-language publishing platform.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

Currently, the API uses session-based authentication. Future versions will support API keys.

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- **General API**: 100 requests per minute
- **Translation API**: 50 requests per minute
- **Publish API**: 10 requests per minute
- **Upload API**: 20 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid request data |
| `AUTHENTICATION_ERROR` | Authentication required |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMIT_ERROR` | Too many requests |
| `EXTERNAL_SERVICE_ERROR` | External service failed |
| `DATABASE_ERROR` | Database operation failed |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

## Endpoints

### 1. Health Check

Check the health status of the application and its dependencies.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": "connected",
    "wordpress": "reachable",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "uptime": 86400,
    "environment": "production"
  }
}
```

**Status Codes:**
- `200` - All systems healthy
- `503` - Service degraded

---

### 2. Translate Text

Translate text from one language to another using Google Translate API.

**Endpoint:** `POST /api/translate`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Hello World",
  "sourceLang": "en",
  "targetLang": "ar",
  "useCache": true
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | Text to translate |
| `sourceLang` | string | Yes | Source language (`ar`, `en`, `fr`, `es`) |
| `targetLang` | string | Yes | Target language (`ar`, `en`, `fr`, `es`) |
| `useCache` | boolean | No | Use cached translations (default: `true`) |

**Response:**
```json
{
  "success": true,
  "data": {
    "translatedText": "مرحبا بالعالم",
    "detectedSourceLanguage": "en",
    "fromCache": false,
    "sourceLang": "en",
    "targetLang": "ar"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `429` - Rate limit exceeded
- `500` - Translation failed

---

### 3. Publish Article

Publish an article in multiple languages with automatic translation and WordPress integration.

**Endpoint:** `POST /api/publish`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "sourceLanguage": "ar",
  "targetLanguages": ["en", "fr", "es"],
  "title": "عنوان المقال",
  "content": "<p>محتوى المقال...</p>",
  "excerpt": "ملخص المقال",
  "templateId": 1,
  "categoryId": 1,
  "authorId": "user-123",
  "images": [
    {
      "url": "/uploads/image1.jpg",
      "alt": "Image description",
      "caption": "Image caption"
    }
  ]
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceLanguage` | string | Yes | Source language code |
| `targetLanguages` | string[] | Yes | Array of target language codes |
| `title` | string | Yes | Article title |
| `content` | string | Yes | Article content (HTML) |
| `excerpt` | string | No | Article excerpt/summary |
| `templateId` | number | Yes | Template ID (1-8) |
| `categoryId` | number | No | Category ID |
| `authorId` | string | Yes | Author user ID |
| `images` | array | No | Array of image objects |

**Response:**
```json
{
  "success": true,
  "data": {
    "articleId": 42,
    "title": "عنوان المقال",
    "sourceLanguage": "ar",
    "translations": [
      {
        "language": "en",
        "translationId": 1,
        "wordpressPostId": 123,
        "wordpressUrl": "https://site.com/article-title",
        "status": "PUBLISHED"
      },
      {
        "language": "fr",
        "translationId": 2,
        "wordpressPostId": 124,
        "wordpressUrl": "https://site.com/fr/titre-article",
        "status": "PUBLISHED"
      },
      {
        "language": "es",
        "translationId": 3,
        "status": "FAILED",
        "error": "WordPress connection timeout"
      }
    ],
    "status": "PUBLISHED"
  }
}
```

**Status Codes:**
- `200` - Success (partial or complete)
- `400` - Invalid request
- `404` - Template not found
- `429` - Rate limit exceeded
- `500` - Publish failed

---

### 4. Get Templates

Retrieve all available article templates.

**Endpoint:** `GET /api/templates`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Modern Magazine",
      "nameAr": "مجلة عصرية",
      "nameEn": "Modern Magazine",
      "nameFr": "Magazine Moderne",
      "nameEs": "Revista Moderna",
      "slug": "modern-magazine",
      "description": "A bold, image-focused layout",
      "descriptionAr": "تصميم جريء يركز على الصور",
      "layoutType": "modern-magazine",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 8
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### 5. Get Articles

Retrieve articles with pagination and filtering.

**Endpoint:** `GET /api/articles`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 10 | Items per page |
| `status` | string | No | all | Filter by status (`DRAFT`, `PUBLISHED`, `ARCHIVED`) |

**Example:**
```
GET /api/articles?page=1&limit=20&status=PUBLISHED
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Article Title",
      "content": "<p>Content...</p>",
      "excerpt": "Summary",
      "sourceLanguage": "AR",
      "status": "PUBLISHED",
      "publishedAt": "2024-01-15T10:00:00.000Z",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "author": {
        "id": "user-123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "category": {
        "id": 1,
        "name": "Technology"
      },
      "template": {
        "id": 1,
        "name": "Modern Magazine"
      },
      "images": [
        {
          "id": 1,
          "url": "/uploads/image1.jpg",
          "alt": "Image alt",
          "caption": "Caption"
        }
      ],
      "translations": [
        {
          "id": 1,
          "language": "EN",
          "title": "Article Title",
          "status": "PUBLISHED",
          "wordpressUrl": "https://site.com/article"
        }
      ],
      "_count": {
        "translations": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid parameters
- `500` - Server error

---

### 6. Upload File

Upload an image file for use in articles.

**Endpoint:** `POST /api/upload`

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body:**
```
Form data:
- file: <binary file data>
```

**Allowed File Types:**
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`
- `image/gif`

**Max File Size:** 5MB (configurable via `MAX_FILE_SIZE` env variable)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/1640000000000-image.jpg",
    "filename": "1640000000000-image.jpg",
    "originalName": "image.jpg",
    "size": 245678,
    "mimeType": "image/jpeg"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid file or validation error
- `413` - File too large
- `429` - Rate limit exceeded
- `500` - Upload failed

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// Translate text
const response = await fetch('http://localhost:3000/api/translate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Hello World',
    sourceLang: 'en',
    targetLang: 'ar',
  }),
});

const data = await response.json();
console.log(data.data.translatedText); // مرحبا بالعالم
```

### cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Translate
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello World",
    "sourceLang": "en",
    "targetLang": "ar"
  }'

# Get templates
curl http://localhost:3000/api/templates

# Get articles
curl "http://localhost:3000/api/articles?page=1&limit=10&status=PUBLISHED"

# Upload file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.jpg"
```

### Python

```python
import requests

# Translate text
response = requests.post('http://localhost:3000/api/translate', json={
    'text': 'Hello World',
    'sourceLang': 'en',
    'targetLang': 'ar'
})

data = response.json()
print(data['data']['translatedText'])  # مرحبا بالعالم
```

---

## Webhooks

_(Coming Soon)_

PubliCenter will support webhooks for:
- Article published
- Translation completed
- WordPress publish status

---

## SDK Libraries

_(Coming Soon)_

Official SDKs:
- JavaScript/TypeScript
- Python
- PHP
- Go

---

## API Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Health check endpoint
- Translation endpoint
- Publish endpoint
- Templates endpoint
- Articles endpoint
- Upload endpoint

---

## Support

For API support:
- GitHub Issues: https://github.com/yourusername/publicenter/issues
- Email: api-support@publicenter.com
- Documentation: https://docs.publicenter.com

---

**API Version:** 1.0.0
**Last Updated:** January 2024
