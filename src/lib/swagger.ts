import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PubliCenter API Documentation',
      version: '1.0.0',
      description: 'Multi-language content publishing platform with WordPress integration',
      contact: {
        name: 'PubliCenter Support',
        email: 'support@publicenter.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Article: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            content: { type: 'string' },
            excerpt: { type: 'string' },
            sourceLanguage: { type: 'string', enum: ['AR', 'EN', 'FR', 'ES'] },
            status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
            authorId: { type: 'string' },
            categoryId: { type: 'integer' },
            templateId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Translation: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            articleId: { type: 'integer' },
            language: { type: 'string', enum: ['AR', 'EN', 'FR', 'ES'] },
            title: { type: 'string' },
            content: { type: 'string' },
            excerpt: { type: 'string' },
            slug: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'TRANSLATING', 'TRANSLATED', 'PUBLISHED', 'FAILED'] },
          },
        },
        WordPressSite: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            url: { type: 'string' },
            language: { type: 'string' },
            translationPlugin: { type: 'string', enum: ['NONE', 'WPML', 'POLYLANG', 'TRANSLATEPRESS', 'WEGLOT', 'LOCO_TRANSLATE', 'QTRANSLATE_XT'] },
            isActive: { type: 'boolean' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/app/api/**/*.ts'], // Path to API routes
};

export const swaggerSpec = swaggerJsdoc(options);
