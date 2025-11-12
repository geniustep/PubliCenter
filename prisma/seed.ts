import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default categories
  console.log('📁 Creating categories...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'technology' },
      update: {},
      create: {
        name: 'Technology',
        nameAr: 'تقنية',
        nameEn: 'Technology',
        nameFr: 'Technologie',
        nameEs: 'Tecnología',
        slug: 'technology',
        description: 'Technology news and articles',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'business' },
      update: {},
      create: {
        name: 'Business',
        nameAr: 'أعمال',
        nameEn: 'Business',
        nameFr: 'Affaires',
        nameEs: 'Negocios',
        slug: 'business',
        description: 'Business and finance news',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'lifestyle' },
      update: {},
      create: {
        name: 'Lifestyle',
        nameAr: 'نمط الحياة',
        nameEn: 'Lifestyle',
        nameFr: 'Style de vie',
        nameEs: 'Estilo de vida',
        slug: 'lifestyle',
        description: 'Lifestyle and culture articles',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sports' },
      update: {},
      create: {
        name: 'Sports',
        nameAr: 'رياضة',
        nameEn: 'Sports',
        nameFr: 'Sports',
        nameEs: 'Deportes',
        slug: 'sports',
        description: 'Sports news and coverage',
      },
    }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // Create 8 default templates
  console.log('🎨 Creating templates...');
  const templates = await Promise.all([
    // 1. Modern Magazine
    prisma.template.upsert({
      where: { slug: 'modern-magazine' },
      update: {},
      create: {
        name: 'Modern Magazine',
        nameAr: 'مجلة عصرية',
        nameEn: 'Modern Magazine',
        nameFr: 'Magazine Moderne',
        nameEs: 'Revista Moderna',
        slug: 'modern-magazine',
        description: 'A bold, image-focused layout perfect for visual storytelling',
        descriptionAr: 'تصميم جريء يركز على الصور، مثالي لسرد القصص المرئية',
        descriptionEn: 'A bold, image-focused layout perfect for visual storytelling',
        descriptionFr: 'Une mise en page audacieuse axée sur l\'image, parfaite pour la narration visuelle',
        descriptionEs: 'Un diseño audaz centrado en imágenes, perfecto para la narración visual',
        layoutType: 'modern-magazine',
        isActive: true,
        sortOrder: 1,
      },
    }),

    // 2. Minimalist
    prisma.template.upsert({
      where: { slug: 'minimalist' },
      update: {},
      create: {
        name: 'Minimalist',
        nameAr: 'بسيط',
        nameEn: 'Minimalist',
        nameFr: 'Minimaliste',
        nameEs: 'Minimalista',
        slug: 'minimalist',
        description: 'Clean and simple layout with focus on content readability',
        descriptionAr: 'تصميم نظيف وبسيط مع التركيز على سهولة قراءة المحتوى',
        descriptionEn: 'Clean and simple layout with focus on content readability',
        descriptionFr: 'Mise en page épurée et simple axée sur la lisibilité du contenu',
        descriptionEs: 'Diseño limpio y simple con enfoque en la legibilidad del contenido',
        layoutType: 'minimalist',
        isActive: true,
        sortOrder: 2,
      },
    }),

    // 3. Bold Statement
    prisma.template.upsert({
      where: { slug: 'bold-statement' },
      update: {},
      create: {
        name: 'Bold Statement',
        nameAr: 'بيان جريء',
        nameEn: 'Bold Statement',
        nameFr: 'Déclaration Audacieuse',
        nameEs: 'Declaración Audaz',
        slug: 'bold-statement',
        description: 'Large typography and vibrant colors for maximum impact',
        descriptionAr: 'خطوط كبيرة وألوان نابضة بالحياة لأقصى تأثير',
        descriptionEn: 'Large typography and vibrant colors for maximum impact',
        descriptionFr: 'Typographie large et couleurs vibrantes pour un impact maximal',
        descriptionEs: 'Tipografía grande y colores vibrantes para máximo impacto',
        layoutType: 'bold-statement',
        isActive: true,
        sortOrder: 3,
      },
    }),

    // 4. Elegant Classic
    prisma.template.upsert({
      where: { slug: 'elegant-classic' },
      update: {},
      create: {
        name: 'Elegant Classic',
        nameAr: 'كلاسيكي أنيق',
        nameEn: 'Elegant Classic',
        nameFr: 'Classique Élégant',
        nameEs: 'Clásico Elegante',
        slug: 'elegant-classic',
        description: 'Timeless design with sophisticated typography',
        descriptionAr: 'تصميم خالد مع خطوط متطورة',
        descriptionEn: 'Timeless design with sophisticated typography',
        descriptionFr: 'Design intemporel avec typographie sophistiquée',
        descriptionEs: 'Diseño atemporal con tipografía sofisticada',
        layoutType: 'elegant-classic',
        isActive: true,
        sortOrder: 4,
      },
    }),

    // 5. Tech Focused
    prisma.template.upsert({
      where: { slug: 'tech-focused' },
      update: {},
      create: {
        name: 'Tech Focused',
        nameAr: 'تركيز تقني',
        nameEn: 'Tech Focused',
        nameFr: 'Axé Technologie',
        nameEs: 'Enfoque Tecnológico',
        slug: 'tech-focused',
        description: 'Modern, tech-inspired layout with code-friendly styling',
        descriptionAr: 'تصميم حديث مستوحى من التقنية مع تنسيق صديق للأكواد',
        descriptionEn: 'Modern, tech-inspired layout with code-friendly styling',
        descriptionFr: 'Mise en page moderne inspirée de la technologie avec style adapté au code',
        descriptionEs: 'Diseño moderno inspirado en tecnología con estilo amigable al código',
        layoutType: 'tech-focused',
        isActive: true,
        sortOrder: 5,
      },
    }),

    // 6. Photo Story
    prisma.template.upsert({
      where: { slug: 'photo-story' },
      update: {},
      create: {
        name: 'Photo Story',
        nameAr: 'قصة مصورة',
        nameEn: 'Photo Story',
        nameFr: 'Histoire en Photos',
        nameEs: 'Historia Fotográfica',
        slug: 'photo-story',
        description: 'Image-centric layout perfect for photojournalism',
        descriptionAr: 'تصميم يركز على الصور، مثالي للصحافة المصورة',
        descriptionEn: 'Image-centric layout perfect for photojournalism',
        descriptionFr: 'Mise en page centrée sur l\'image, parfaite pour le photojournalisme',
        descriptionEs: 'Diseño centrado en imágenes, perfecto para fotoperiodismo',
        layoutType: 'photo-story',
        isActive: true,
        sortOrder: 6,
      },
    }),

    // 7. News Bulletin
    prisma.template.upsert({
      where: { slug: 'news-bulletin' },
      update: {},
      create: {
        name: 'News Bulletin',
        nameAr: 'نشرة إخبارية',
        nameEn: 'News Bulletin',
        nameFr: 'Bulletin d\'Information',
        nameEs: 'Boletín de Noticias',
        slug: 'news-bulletin',
        description: 'Fast-paced news format with quick-read sections',
        descriptionAr: 'تنسيق إخباري سريع مع أقسام سريعة القراءة',
        descriptionEn: 'Fast-paced news format with quick-read sections',
        descriptionFr: 'Format d\'actualités rapide avec sections de lecture rapide',
        descriptionEs: 'Formato de noticias rápido con secciones de lectura rápida',
        layoutType: 'news-bulletin',
        isActive: true,
        sortOrder: 7,
      },
    }),

    // 8. Interview Format
    prisma.template.upsert({
      where: { slug: 'interview-format' },
      update: {},
      create: {
        name: 'Interview Format',
        nameAr: 'تنسيق مقابلة',
        nameEn: 'Interview Format',
        nameFr: 'Format d\'Entretien',
        nameEs: 'Formato de Entrevista',
        slug: 'interview-format',
        description: 'Q&A style layout ideal for interviews and conversations',
        descriptionAr: 'تصميم بنمط الأسئلة والأجوبة، مثالي للمقابلات والحوارات',
        descriptionEn: 'Q&A style layout ideal for interviews and conversations',
        descriptionFr: 'Mise en page style Q&R idéale pour les entretiens et conversations',
        descriptionEs: 'Diseño estilo preguntas y respuestas, ideal para entrevistas y conversaciones',
        layoutType: 'interview-format',
        isActive: true,
        sortOrder: 8,
      },
    }),
  ]);
  console.log(`✅ Created ${templates.length} templates`);

  console.log('✨ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
