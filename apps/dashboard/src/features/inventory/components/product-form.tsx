'use client';

import { addProduct, editProduct } from '@/lib/actions/products';
import { Product, Category, DEFAULT_CATEGORIES } from '@/lib/db/products';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const productSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  categoryId: z.string().nullable().optional(),
  description: z.string().optional(),
  sku: z.string().min(1, { message: 'SKU is required.' }),
  unitPrice: z.coerce.number().min(0, { message: 'Unit price must be a positive number.' }),
  sellingPrice: z.coerce.number().min(0, { message: 'Selling price must be a positive number.' }),
  currentStock: z.coerce.number().int().min(0, { message: 'Current stock must be a non-negative integer.' }),
  reorderLevel: z.coerce.number().int().min(0, { message: 'Reorder level must be a non-negative integer.' }),
});

interface ProductFormProps {
  initialData?: Product;
  categories?: Category[];
  onSuccess?: () => void;
}

export default function ProductForm({ initialData, categories = DEFAULT_CATEGORIES, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.categoryId || 'none');

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          categoryId: initialData.categoryId ?? null,
          description: initialData.description ?? '',
          sku: initialData.sku,
          unitPrice: Number(initialData.unitPrice) || 0,
          sellingPrice: Number(initialData.sellingPrice) || 0,
          currentStock: Number(initialData.currentStock) || 0,
          reorderLevel: Number(initialData.reorderLevel) || 0,
        }
      : {
          name: '',
          categoryId: null,
          description: '',
          sku: '',
          unitPrice: 0,
          sellingPrice: 0,
          currentStock: 0,
          reorderLevel: 0,
        },
  });

  useEffect(() => {
    if (initialData) {
      setSelectedCategory(initialData.categoryId || 'none');
    }
  }, [initialData]);

  useEffect(() => {
    if (isSubmitSuccessful) {
      if (!initialData) {
        reset();
      }
      onSuccess?.();
    }
  }, [isSubmitSuccessful, reset, initialData, onSuccess]);

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    const finalCategoryId = selectedCategory === 'none' ? null : selectedCategory;
    if (initialData) {
      await editProduct(initialData.id, {
        ...data,
        categoryId: finalCategoryId,
        unitPrice: String(data.unitPrice),
        sellingPrice: String(data.sellingPrice),
      });
    } else {
      await addProduct({
        ...data,
        categoryId: finalCategoryId,
        unitPrice: String(data.unitPrice),
        sellingPrice: String(data.sellingPrice),
      });
    }
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3.5 py-2">
      <div className="space-y-1">
        <Label htmlFor="name" className="text-xs font-semibold text-slate-700">Product Name</Label>
        <Input id="name" {...register('name')} placeholder="e.g. Wireless Headphones" className="h-9 text-sm" />
        {errors.name && (
          <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="category" className="text-xs font-semibold text-slate-700">Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(val) => {
              setSelectedCategory(val);
              setValue('categoryId', val === 'none' ? null : val);
            }}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Uncategorized</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="sku" className="text-xs font-semibold text-slate-700">SKU</Label>
          <Input id="sku" {...register('sku')} placeholder="e.g. WH-001" className="h-9 text-sm font-mono" />
          {errors.sku && (
            <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description" className="text-xs font-semibold text-slate-700">Description</Label>
        <Textarea id="description" {...register('description')} rows={2} placeholder="Optional item details" className="text-sm resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="unitPrice" className="text-xs font-semibold text-slate-700">Unit Cost ($)</Label>
          <Input id="unitPrice" type="number" {...register('unitPrice')} step="0.01" className="h-9 text-sm font-mono" />
          {errors.unitPrice && (
            <p className="text-xs text-red-500 mt-1">{errors.unitPrice.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="sellingPrice" className="text-xs font-semibold text-slate-700">Selling Price ($)</Label>
          <Input id="sellingPrice" type="number" {...register('sellingPrice')} step="0.01" className="h-9 text-sm font-mono font-semibold" />
          {errors.sellingPrice && (
            <p className="text-xs text-red-500 mt-1">{errors.sellingPrice.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="currentStock" className="text-xs font-semibold text-slate-700">Current Stock</Label>
          <Input id="currentStock" type="number" {...register('currentStock')} className="h-9 text-sm font-mono" />
          {errors.currentStock && (
            <p className="text-xs text-red-500 mt-1">{errors.currentStock.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="reorderLevel" className="text-xs font-semibold text-slate-700">Reorder Alert Level</Label>
          <Input id="reorderLevel" type="number" {...register('reorderLevel')} className="h-9 text-sm font-mono" />
          {errors.reorderLevel && (
            <p className="text-xs text-red-500 mt-1">{errors.reorderLevel.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full mt-2 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
        {isSubmitting ? 'Processing...' : (initialData ? 'Update Product' : 'Add Product')}
      </Button>
    </form>
  );
}

