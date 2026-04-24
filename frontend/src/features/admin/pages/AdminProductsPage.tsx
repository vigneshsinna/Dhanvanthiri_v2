import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminProductsQuery, useAdminDeleteProductMutation, useAdminDuplicateProductMutation, useAdminImportProductsMutation } from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { resolveProductImageUrl } from '@/lib/productImage';
import { Search, Copy, Eye, Pencil, Trash2, Upload, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  status: string;
  primary_image_url?: string;
  variants?: { id: number; stock_quantity: number; sku: string }[];
  category?: { name: string };
  created_at: string;
}

export function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { data, isLoading } = useAdminProductsQuery({ page, per_page: 15, search: search || undefined });
  const deleteMut = useAdminDeleteProductMutation();
  const dupMut = useAdminDuplicateProductMutation();
  const importMut = useAdminImportProductsMutation();

  const products: Product[] = data?.data?.data ?? data?.data ?? [];
  const pagination = data?.data?.meta ?? data?.meta ?? null;

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}><Upload className="mr-1.5 h-4 w-4" />Import CSV</Button>
          <Link to="/admin/products/new">
            <Button><Plus className="mr-1.5 h-4 w-4" />Add Product</Button>
          </Link>
        </div>
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Import Products</h2>
            <input
              type="file"
              accept=".csv"
              className="mb-4 block w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  importMut.mutate(file, {
                    onSuccess: () => setIsImportModalOpen(false)
                  });
                }
              }}
            />
            {importMut.isPending && <p className="text-sm text-brand-600 font-medium my-2">Importing... Please wait.</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Product</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Category</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Price</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Stock</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => {
              const totalStock = product.variants?.reduce((s, v) => s + v.stock_quantity, 0) ?? 0;
              const imageUrl = resolveProductImageUrl({
                primaryImageUrl: product.primary_image_url,
                productName: product.name,
                productSlug: product.slug,
                productId: product.id,
              });
              return (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded bg-slate-100">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <span className="font-medium text-slate-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.category?.name ?? '-'}</td>
                  <td className="px-4 py-3 font-medium">₹{product.price}</td>
                  <td className="px-4 py-3">
                    <Badge variant={totalStock === 0 ? 'danger' : totalStock <= 10 ? 'warning' : 'success'}>
                      {totalStock}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={product.status === 'active' ? 'success' : 'default'}>
                      {product.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <a
                        href={`/products/${product.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-600"
                        title="View on Storefront"
                      ><Eye className="h-4 w-4" /></a>
                      <button
                        onClick={() => { if (confirm('Duplicate this product?')) dupMut.mutate(product.id); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                        title="Duplicate"
                      ><Copy className="h-4 w-4" /></button>
                      <Link to={`/admin/products/${product.id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => { if (confirm('Delete this product?')) deleteMut.mutate(product.id); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      ><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Prev</button>
          <span className="px-3 py-1.5 text-sm text-slate-600">Page {page} of {pagination.last_page}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= pagination.last_page} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Next <ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
