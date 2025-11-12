'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, Edit, Trash2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  _count: {
    articles: number;
  };
}

const mockCategories: Category[] = [
  { id: 1, name: 'Technology', slug: 'technology', description: 'Tech news and updates', _count: { articles: 15 } },
  { id: 2, name: 'Business', slug: 'business', description: 'Business and finance', _count: { articles: 8 } },
  { id: 3, name: 'Sports', slug: 'sports', description: 'Sports news', _count: { articles: 12 } },
  { id: 4, name: 'Health', slug: 'health', description: 'Health and wellness', _count: { articles: 6 } },
];

export default function CategoriesPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const openCreateDialog = () => {
    setFormData({ name: '', slug: '', description: '' });
    setIsCreateOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setIsEditOpen(true);
  };

  const handleCreate = () => {
    // TODO: Implement API call
    toast({
      title: t('common.success'),
      description: 'Category created successfully',
    });
    setIsCreateOpen(false);
  };

  const handleUpdate = () => {
    // TODO: Implement API call
    if (selectedCategory) {
      // Update the category in the list
      setCategories(categories.map((c) =>
        c.id === selectedCategory.id ? { ...c, ...formData } : c
      ));
    }
    toast({
      title: t('common.success'),
      description: 'Category updated successfully',
    });
    setIsEditOpen(false);
  };

  const handleDelete = (categoryId: number) => {
    if (window.confirm(t('articles.deleteConfirm'))) {
      // TODO: Implement API call
      setCategories(categories.filter((c) => c.id !== categoryId));
      toast({
        title: t('common.success'),
        description: 'Category deleted successfully',
      });
    }
  };

  const getCategoryColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {t('nav.categories')}
                </h1>
                <p className="text-muted-foreground">
                  Manage article categories
                </p>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="me-2 h-4 w-4" />
                Create Category
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${getCategoryColor(index)} text-white`}>
                          <FolderOpen className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {category._count.articles} {t('nav.articles')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {category.description && (
                      <CardDescription className="mt-2">
                        {category.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                        className="flex-1"
                      >
                        <Edit className="me-2 h-4 w-4" />
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        className="flex-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="me-2 h-4 w-4" />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your articles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Technology, Business, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-slug">Slug</Label>
              <Input
                id="create-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="technology, business, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate}>
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdate}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
