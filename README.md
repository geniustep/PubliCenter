# 🌍 PubliCenter

**Multi-language content publishing platform with WordPress integration**

PubliCenter is a powerful Next.js application that enables publishing articles in multiple languages (Arabic, English, French, Spanish) with automatic translation and WordPress integration.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

---

## ✨ Features

### Core Features
- 🌐 **Multi-language Support**: Publish in 4 languages (Arabic, English, French, Spanish)
- 🤖 **Automatic Translation**: Powered by Google Translate API
- 📝 **8 Professional Templates**: Ready-to-use article templates
- 🔗 **WordPress Integration**: Direct publishing to WordPress sites
- 🎨 **Theme Support**: Light and Dark modes
- 🔄 **RTL Support**: Full support for Arabic and RTL languages
- 📱 **Responsive Design**: Works on all devices
- 🔒 **Secure**: Built with security best practices
- ⚡ **Fast**: Optimized performance with caching
- 📊 **Analytics**: Track article performance

### Technical Features
- Next.js 14 with App Router
- TypeScript for type safety
- Prisma ORM with PostgreSQL
- Docker containerization
- Rate limiting and caching
- Image optimization
- SEO-friendly
- API-first architecture

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL 16+ (or use Docker)
- WordPress site with Application Password
- Google Translate API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/publicenter.git
cd publicenter
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/publicenter"
WORDPRESS_URL="https://your-wordpress-site.com"
WORDPRESS_USERNAME="your_username"
WORDPRESS_APP_PASSWORD="your_app_password"
GOOGLE_TRANSLATE_API_KEY="your_api_key"
NEXTAUTH_SECRET="your_secret_key"
```

4. **Start PostgreSQL with Docker** (optional)
```bash
docker-compose -f docker-compose.dev.yml up -d
```

5. **Run database migrations**
```bash
npm run prisma:migrate
npm run prisma:seed
```

6. **Start development server**
```bash
npm run dev
```

7. **Open your browser**
```
http://localhost:3000
```

---

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [API Documentation](./API.md) - API endpoints reference
- [Templates Guide](./docs/TEMPLATES.md) - Template customization
- [Translation Guide](./docs/TRANSLATION.md) - i18n setup

---

## 🏗️ Project Structure

```
publicenter/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data (8 templates)
├── scripts/
│   ├── setup.sh             # Initial server setup
│   ├── deploy.sh            # Deployment script
│   └── backup.sh            # Backup automation
├── src/
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   ├── health/      # Health check
│   │   │   ├── translate/   # Translation API
│   │   │   ├── publish/     # Publishing API
│   │   │   ├── templates/   # Templates API
│   │   │   ├── articles/    # Articles API
│   │   │   └── upload/      # File upload API
│   │   └── globals.css      # Global styles
│   └── lib/
│       ├── prisma.ts        # Database client
│       ├── translator.ts    # Translation service
│       ├── wordpress.ts     # WordPress integration
│       ├── cache.ts         # Caching system
│       ├── logger.ts        # Logging service
│       ├── rate-limiter.ts  # Rate limiting
│       ├── error-handler.ts # Error handling
│       ├── sanitize.ts      # Input sanitization
│       └── utils.ts         # Utility functions
├── docker-compose.yml       # Production setup
├── docker-compose.dev.yml   # Development setup
├── Dockerfile               # App container
├── nginx.conf               # Nginx configuration
└── package.json             # Dependencies

```

---

## 🎨 Templates

PubliCenter includes 8 professional templates:

1. **Modern Magazine** - Bold, image-focused layout
2. **Minimalist** - Clean and simple design
3. **Bold Statement** - Large typography with vibrant colors
4. **Elegant Classic** - Timeless, sophisticated design
5. **Tech Focused** - Modern, code-friendly layout
6. **Photo Story** - Image-centric for photojournalism
7. **News Bulletin** - Fast-paced news format
8. **Interview Format** - Q&A style layout

---

## 🔌 API Endpoints

### Health Check
```bash
GET /api/health
```

### Translation
```bash
POST /api/translate
Content-Type: application/json

{
  "text": "Hello World",
  "sourceLang": "en",
  "targetLang": "ar"
}
```

### Publish Article
```bash
POST /api/publish
Content-Type: application/json

{
  "sourceLanguage": "ar",
  "targetLanguages": ["en", "fr", "es"],
  "title": "Article Title",
  "content": "Article content...",
  "templateId": 1,
  "authorId": "user-id"
}
```

See [API.md](./API.md) for complete API documentation.

---

## 🐳 Docker Deployment

### Production Deployment

1. **Run setup script** (first time only)
```bash
sudo ./scripts/setup.sh
```

2. **Build and start services**
```bash
docker-compose build
docker-compose up -d
```

3. **Run migrations**
```bash
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
```

4. **Check status**
```bash
docker-compose ps
curl http://localhost:3000/api/health
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

### Prisma Scripts

```bash
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Create and apply migration
npm run prisma:deploy    # Deploy migrations (production)
npm run prisma:seed      # Seed database with templates
npm run prisma:studio    # Open Prisma Studio
```

---

## 🔒 Security

- Environment variables for sensitive data
- Rate limiting on all APIs
- Input sanitization and validation
- HTTPS enforcement
- CORS configuration
- SQL injection prevention
- XSS protection
- Secure password hashing

---

## 🌍 Internationalization (i18n)

Supported languages:
- **العربية** (Arabic) - ar
- **English** - en
- **Français** (French) - fr
- **Español** (Spanish) - es

RTL (Right-to-Left) support for Arabic is built-in.

---

## 📊 Performance

- Server-side rendering with Next.js
- Image optimization with Next/Image
- API response caching
- Database query optimization
- CDN-ready static assets
- Lazy loading components

---

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Google Translate API](https://cloud.google.com/translate) - Translation service
- [WordPress REST API](https://developer.wordpress.org/rest-api/) - Content management

---

## 📧 Contact

For questions or support, please open an issue on GitHub or contact:
- Email: support@publicenter.com
- Website: https://publicenter.com

---

## 🗺️ Roadmap

- [ ] Add more templates
- [ ] Support for more languages
- [ ] AI-powered content suggestions
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Markdown editor
- [ ] Collaborative editing
- [ ] Version control for articles
- [ ] Scheduled publishing

---

**Made with ❤️ by the PubliCenter Team**
