import { useState } from 'react';
import { useAdminInventoryQuery, useAdminUpdateStockMutation } from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { resolveProductImageUrl } from '@/lib/productImage';

interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  variant_label?: string;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  image_url?: string;
}

export function AdminInventoryPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editThreshold, setEditThreshold] = useState('');

  const { data, isLoading } = useAdminInventoryQuery({ page, per_page: 20, filter: filter === 'all' ? undefined : filter });
  const updateStock = useAdminUpdateStockMutation();

  const items: InventoryItem[] = data?.data?.data ?? data?.data ?? [];
  const pagination = data?.data?.meta ?? data?.meta ?? null;

  const handleSave = (id: number) => {
    const payload: { id: number; stock_quantity: number; low_stock_threshold?: number } = { id, stock_quantity: parseInt(editQty, 10) };
    if (editThreshold !== '') payload.low_stock_threshold = parseInt(editThreshold, 10);
    updateStock.mutate(
      payload,
      { onSuccess: () => { setEditingId(null); setEditQty(''); setEditThreshold(''); } },
    );
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditQty(String(item.stock_quantity));
    setEditThreshold(String(item.low_stock_threshold));
  };

  if (isLoading) return <PageLoader />;

  const stockBadge = (qty: number, threshold: number) => {
    if (qty <= 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (qty <= threshold) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-500">Track stock levels and manage replenishment</p>
      </div>

      <div className="flex gap-2">
        {(['all', 'low', 'out'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${filter === f ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
          >
            {f === 'out' ? 'Out of Stock' : f === 'low' ? 'Low Stock' : 'All'}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Product</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">SKU</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Variant</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Stock</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Low Threshold</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Reserved</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const imageUrl = resolveProductImageUrl({
                primaryImageUrl: item.image_url,
                productName: item.product_name,
                productId: item.product_id,
              });

              return (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {imageUrl && <img src={imageUrl} alt="" className="h-8 w-8 rounded object-cover" />}
                    <span className="font-medium text-slate-900">{item.product_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.sku}</td>
                <td className="px-4 py-3 text-slate-600">{item.variant_label ?? '-'}</td>
                <td className="px-4 py-3">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      min="0"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      className="w-20 rounded border px-2 py-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="font-semibold">{item.stock_quantity}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      min="0"
                      value={editThreshold}
                      onChange={(e) => setEditThreshold(e.target.value)}
                      className="w-20 rounded border px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className="text-slate-600">{item.low_stock_threshold}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{item.reserved_quantity}</td>
                <td className="px-4 py-3">{stockBadge(item.stock_quantity, item.low_stock_threshold)}</td>
                <td className="px-4 py-3 text-right">
                  {editingId === item.id ? (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" onClick={() => handleSave(item.id)} loading={updateStock.isPending}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </Button>
                  )}
                </td>
              </tr>
            )})}
            {items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No inventory items</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Prev</button>
          <span className="px-3 py-1.5 text-sm text-slate-600">Page {page} of {pagination.last_page}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= pagination.last_page} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
