import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import {
  useAdminProductQuery,
  useAdminCreateProductMutation,
  useAdminUpdateProductMutation,
  useAdminCategoriesQuery,
  useAdminBrandsQuery,
} from '@/features/admin/api';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ProductForm {
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  price: string;
  compare_price: string;
  cost_price: string;
  short_description: string;
  description: string;
  brand_id: string;
  custom_labels: string; // Comma separated for now
  status: string;
  weight: string;
  stock_quantity: string;
  low_stock_threshold: string;
  meta_title: string;
  meta_description: string;
}

const emptyForm: ProductForm = {
  name: '',
  slug: '',
  sku: '',
  category_id: '',
  price: '',
  compare_price: '',
  cost_price: '',
  short_description: '',
  description: '',
  brand_id: '',
  custom_labels: '',
  status: 'draft',
  weight: '',
  stock_quantity: '',
  low_stock_threshold: '5',
  meta_title: '',
  meta_description: '',
};

export function AdminProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const productId = isNew ? 0 : Number(id);

  const { data: productData, isLoading: productLoading } = useAdminProductQuery(productId, !isNew && productId > 0);
  const { data: catData } = useAdminCategoriesQuery({});
  const { data: brandData } = useAdminBrandsQuery({});
  const createMut = useAdminCreateProductMutation();
  const updateMut = useAdminUpdateProductMutation();

  const categories = catData?.data?.data ?? catData?.data ?? [];
  const brands = brandData?.data ?? [];

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(isNew);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isNew && productData?.data?.data) {
      const p = productData.data.data;
      setForm({
        name: p.name ?? '',
        slug: p.slug ?? '',
        sku: p.sku ?? '',
        category_id: String(p.category_id ?? ''),
        price: String(p.price ?? ''),
        compare_price: String(p.compare_price ?? ''),
        cost_price: String(p.cost_price ?? ''),
        short_description: p.short_description ?? '',
        description: p.description ?? '',
        brand_id: String(p.brand_id ?? ''),
        custom_labels: p.custom_labels ? Object.values(p.custom_labels).join(', ') : '',
        status: p.status ?? 'draft',
        weight: String(p.weight ?? ''),
        stock_quantity: String(p.stock_quantity ?? ''),
        low_stock_threshold: String(p.low_stock_threshold ?? '5'),
        meta_title: p.meta_title ?? '',
        meta_description: p.meta_description ?? '',
      });
      setLoaded(true);
    }
  }, [isNew, productData]);

  useEffect(() => {
    if (!thumbnailFile) return;
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setThumbnailFile(file);
  };

  const set = (key: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fd = new FormData();
    fd.append('name', form.name);
    if (form.slug) fd.append('slug', form.slug);
    if (form.sku) fd.append('sku', form.sku);
    if (form.category_id) fd.append('category_id', form.category_id);
    fd.append('price', form.price);
    if (form.compare_price) fd.append('compare_price', form.compare_price);
    if (form.cost_price) fd.append('cost_price', form.cost_price);
    if (form.short_description) fd.append('short_description', form.short_description);
    if (form.description) fd.append('description', form.description);
    if (form.brand_id) fd.append('brand_id', form.brand_id);
    if (form.custom_labels) {
      const labelsArray = form.custom_labels.split(',').map(l => l.trim()).filter(Boolean);
      const labelsObj = Object.fromEntries(labelsArray.map((l, i) => [i, l])); // Simplistic keying
      fd.append('custom_labels', JSON.stringify(labelsObj));
    }
    fd.append('status', form.status);
    if (form.weight) fd.append('weight', form.weight);
    if (form.stock_quantity) fd.append('stock_quantity', form.stock_quantity);
    if (form.low_stock_threshold) fd.append('low_stock_threshold', form.low_stock_threshold);
    if (form.meta_title) fd.append('meta_title', form.meta_title);
    if (form.meta_description) fd.append('meta_description', form.meta_description);
    if (thumbnailFile) fd.append('thumbnail', thumbnailFile);

    try {
      if (isNew) {
        await createMut.mutateAsync(fd);
      } else {
        await updateMut.mutateAsync({ id: productId, formData: fd });
      }
      navigate('/admin/products');
    } catch {
      setError('Failed to save product. Please check required fields.');
    }
  };

  if (!isNew && (productLoading || !loaded)) return <PageLoader />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog"
        title={isNew ? 'Add New Product' : `Edit: ${form.name}`}
        description={isNew ? 'Create a new product listing.' : 'Update product details.'}
        actions={
          <div className="flex items-center gap-2">
            {!isNew && form.slug && (
              <a href={`/products/${form.slug}`} target="_blank" rel="noreferrer">
                <Button variant="outline"><ExternalLink className="mr-1.5 h-4 w-4" />View on Storefront</Button>
              </a>
            )}
            <Link to="/admin/products">
              <Button variant="outline">&larr; Back to Products</Button>
            </Link>
          </div>
        }
      />

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Product Name" value={form.name} onChange={set('name')} required />
          <Input label="Slug" value={form.slug} onChange={set('slug')} placeholder="auto-generated-from-name" />
          <Input label="SKU" value={form.sku} onChange={set('sku')} required />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            Category
            <select
              value={form.category_id}
              onChange={set('category_id')}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((c: { id: number; name: string }) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Brand
            <select
              value={form.brand_id}
              onChange={set('brand_id')}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select brand</option>
              {brands.map((b: { id: number; name: string }) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              value={form.status}
              onChange={set('status')}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <Input label="Weight (kg)" type="number" step="0.01" value={form.weight} onChange={set('weight')} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Price (₹)" type="number" step="0.01" value={form.price} onChange={set('price')} required />
          <Input label="Compare Price (₹)" type="number" step="0.01" value={form.compare_price} onChange={set('compare_price')} />
          <Input label="Cost Price (₹)" type="number" step="0.01" value={form.cost_price} onChange={set('cost_price')} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Stock Quantity" type="number" value={form.stock_quantity} onChange={set('stock_quantity')} />
          <Input label="Low Stock Threshold" type="number" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Short Description</label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
            value={form.short_description}
            onChange={set('short_description')}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Full Description</label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[160px]"
            value={form.description}
            onChange={set('description')}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Meta Title" value={form.meta_title} onChange={set('meta_title')} />
          <Input label="Meta Description" value={form.meta_description} onChange={set('meta_description')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Custom Labels (comma separated)</label>
          <Input value={form.custom_labels} onChange={set('custom_labels')} placeholder="New, Best Seller, Seasonal" />
        </div>

        {/* Product image */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Product Image</label>
          <div className="flex items-start gap-4">
            {(thumbnailPreview || (!isNew && productData?.data?.data?.primary_image_url)) && (
              <img
                src={thumbnailPreview || productData?.data?.data?.primary_image_url}
                alt="Product thumbnail"
                className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
              />
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailChange}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => thumbnailInputRef.current?.click()}
              >
                {thumbnailFile ? 'Change Image' : ((!isNew && productData?.data?.data?.primary_image_url) ? 'Replace Image' : 'Upload Image')}
              </Button>
              {thumbnailFile && (
                <span className="text-xs text-slate-500">{thumbnailFile.name}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={createMut.isPending || updateMut.isPending}>
            {isNew ? 'Create Product' : 'Update Product'}
          </Button>
          <Link to="/admin/products">
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
