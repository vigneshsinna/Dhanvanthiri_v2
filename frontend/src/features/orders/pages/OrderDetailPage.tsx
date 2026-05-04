import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrderQuery, useOrderTrackingQuery, useCancelOrderMutation, useReturnRequestMutation, useReOrderMutation, useDownloadInvoiceMutation } from '@/features/orders/api';
import { useSubmitReviewMutation } from '@/features/catalog/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

const statusVariant = (status: string) => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending_payment: 'warning', paid: 'success', placed: 'info', confirmed: 'info',
    processing: 'info', packed: 'info', shipped: 'info', out_for_delivery: 'info',
    delivered: 'success', completed: 'success', cancel_requested: 'warning',
    cancelled: 'danger', return_requested: 'warning', return_approved: 'warning',
    return_rejected: 'danger', returned: 'default', refund_pending: 'warning',
    refunded: 'danger', partially_refunded: 'warning', failed: 'danger', on_hold: 'default',
  };
  return map[status] ?? 'default';
};

interface OrderItem {
  id: number;
  product_id?: number;
  product_name: string;
  variant_name?: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface TrackingEvent {
  id: number;
  status?: string;
  event_type?: string;
  description: string;
  location?: string;
  occurred_at?: string;
  created_at: string;
}

export function OrderDetailPage() {
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });
  const navigate = useNavigate();
  const { orderNumber } = useParams();
  const { data, isLoading } = useOrderQuery(orderNumber || '');
  const order = data?.data;
  const { data: trackingData } = useOrderTrackingQuery(order?.id ?? 0);
  const cancelMut = useCancelOrderMutation();
  const returnMut = useReturnRequestMutation();
  const reOrderMut = useReOrderMutation();
  const invoiceMut = useDownloadInvoiceMutation();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReturn, setShowReturn] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [reviewingItem, setReviewingItem] = useState<OrderItem | null>(null);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');
  const submitReview = useSubmitReviewMutation(reviewingItem?.product_id ?? 0);

  const tracking: TrackingEvent[] = trackingData?.data ?? [];

  if (isLoading) return <PageLoader />;

  if (!order) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h1 className="text-xl font-semibold">{t('Order not found', 'ஆர்டர் கிடைக்கவில்லை')}</h1>
        <Link to="/account/orders" className="mt-4 inline-block text-brand-700 hover:underline">{t('Back to Orders', 'ஆர்டர்களுக்கு திரும்பு')}</Link>
      </div>
    );
  }

  const items: OrderItem[] = order.items ?? [];
  const meta = data?.meta ?? {};
  const canCancel = meta.can_cancel ?? ['pending_payment', 'paid', 'placed', 'confirmed', 'processing', 'packed'].includes(order.status);
  const canReturn = meta.can_return ?? ['delivered', 'completed'].includes(order.status);
  const canReview = ['delivered', 'completed'].includes(order.status);

  const handleReOrder = async () => {
    try {
      await reOrderMut.mutateAsync(order.id);
      navigate('/cart');
    } catch { /* handled */ }
  };

  const handleDownloadInvoice = async () => {
    try {
      await invoiceMut.mutateAsync(order.id);
    } catch { /* handled */ }
  };

  const handleCancel = async () => {
    try {
      await cancelMut.mutateAsync({ orderId: order.id, reason: cancelReason });
      setShowCancel(false);
    } catch { /* handled */ }
  };

  const handleReturn = async () => {
    try {
      await returnMut.mutateAsync({
        orderId: order.id,
        reason: returnReason,
        description: returnDescription,
        items: items.map((item) => ({
          order_item_id: item.id,
          quantity: item.quantity,
          reason: returnReason,
        })),
      });
      setShowReturn(false);
      setReturnReason('');
      setReturnDescription('');
    } catch { /* handled */ }
  };

  const handleOpenReview = (item: OrderItem) => {
    setReviewingItem(item);
    setReviewRating('5');
    setReviewComment('');
    setReviewMessage('');
    setReviewError('');
  };

  const handleSubmitReview = async () => {
    setReviewMessage('');
    setReviewError('');

    if (!reviewingItem?.product_id) {
      setReviewError('This product is not eligible for review.');
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError('Review comment is required.');
      return;
    }

    const payload = new FormData();
    payload.append('rating', reviewRating);
    payload.append('comment', reviewComment.trim());

    try {
      const res = await submitReview.mutateAsync(payload);
      setReviewMessage(res?.data?.message || 'Review submitted successfully');
      setReviewingItem(null);
      setReviewComment('');
    } catch (err: unknown) {
      setReviewError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Review could not be submitted.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to="/account/orders" className="text-sm text-brand-700 hover:underline">← {t('Back to Orders', 'ஆர்டர்களுக்கு திரும்பு')}</Link>
          <h1 className="mt-1 text-2xl font-semibold">{t('Order', 'ஆர்டர்')} {order.order_number}</h1>
          <p className="text-sm text-slate-500">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant(order.status)}>
            {(order.status || 'placed').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </Badge>
          {canCancel && (
            <Button variant="danger" size="sm" onClick={() => setShowCancel(true)}>{t('Cancel Order', 'ஆர்டரை ரத்து செய்')}</Button>
          )}
          {canReturn && (
            <Button variant="outline" size="sm" onClick={() => setShowReturn(true)}>Request Return</Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReOrder} loading={reOrderMut.isPending}>{t('Re-Order', 'மீண்டும் ஆர்டர்')}</Button>
          <Button variant="outline" size="sm" onClick={handleDownloadInvoice} loading={invoiceMut.isPending}>{t('Download Invoice', 'பில் பதிவிறக்கம்')}</Button>
        </div>
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h3 className="font-medium text-red-800">Cancel this order?</h3>
          <textarea
            className="mt-2 w-full rounded-lg border border-red-300 px-3 py-2 text-sm"
            placeholder="Reason for cancellation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
          />
          <div className="mt-2 flex gap-2">
            <Button variant="danger" size="sm" onClick={handleCancel} loading={cancelMut.isPending}>Confirm Cancel</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCancel(false)}>Never mind</Button>
          </div>
        </div>
      )}

      {/* Return request form */}
      {showReturn && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-medium text-amber-800">Request a Return</h3>
          <p className="text-sm text-amber-600 mt-1">All items in this order will be included in the return request.</p>
          <div className="mt-3 space-y-2">
            <select
              className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            >
              <option value="">Select a reason...</option>
              <option value="defective">Defective / Damaged</option>
              <option value="wrong_item">Wrong Item Received</option>
              <option value="not_as_described">Not as Described</option>
              <option value="size_fit">Size / Fit Issue</option>
              <option value="changed_mind">Changed Mind</option>
              <option value="other">Other</option>
            </select>
            <textarea
              className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm"
              placeholder="Additional details (optional)..."
              value={returnDescription}
              onChange={(e) => setReturnDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReturn}
              loading={returnMut.isPending}
              disabled={!returnReason}
            >
              Submit Return Request
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowReturn(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Order Items */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 font-semibold">{t('Items', 'பொருட்கள்')}</h2>
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.product_name}</p>
                      {item.variant_name && <p className="text-xs text-slate-500">{item.variant_name}</p>}
                      <p className="text-xs text-slate-400">SKU: {item.sku} | Qty: {item.quantity}</p>
                      {canReview && item.product_id && (
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => handleOpenReview(item)}>
                          Review Product
                        </Button>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{item.total_price}</p>
                      <p className="text-xs text-slate-500">₹{item.unit_price} each</p>
                    </div>
                  </div>
                  {reviewingItem?.id === item.id && (
                    <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50/40 p-3">
                      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                        <label className="text-sm font-medium text-slate-700">
                          Rating
                          <select
                            aria-label="Rating"
                            value={reviewRating}
                            onChange={(event) => setReviewRating(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          >
                            <option value="5">5</option>
                            <option value="4">4</option>
                            <option value="3">3</option>
                            <option value="2">2</option>
                            <option value="1">1</option>
                          </select>
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Review Comment
                          <textarea
                            aria-label="Review Comment"
                            value={reviewComment}
                            onChange={(event) => setReviewComment(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            rows={3}
                          />
                        </label>
                      </div>
                      {reviewError && <p className="mt-2 text-sm text-red-700">{reviewError}</p>}
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={handleSubmitReview} loading={submitReview.isPending}>Submit Review</Button>
                        <Button variant="ghost" size="sm" onClick={() => setReviewingItem(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {reviewMessage && <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{reviewMessage}</p>}
          </div>

          {/* Tracking Timeline */}
          {tracking.length > 0 && (
            <div className="rounded-xl border bg-white p-4">
              <h2 className="mb-3 font-semibold">{t('Tracking', 'கண்காணிப்பு')}</h2>
              <div className="space-y-3">
                {tracking.map((event, i) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${i === 0 ? 'bg-brand-600' : 'bg-slate-300'}`} />
                      {i < tracking.length - 1 && <div className="w-0.5 flex-1 bg-slate-200" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{event.description}</p>
                      {event.location && <p className="text-xs text-slate-500">{event.location}</p>}
                      <p className="text-xs text-slate-400">
                        {new Date(event.occurred_at ?? event.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="mb-3 font-semibold">{t('Order Summary', 'ஆர்டர் சுருக்கம்')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">{t('Subtotal', 'துணை மொத்தம்')}</span>
                <span>₹{order.subtotal}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('Discount', 'தள்ளுபடி')}</span>
                  <span>-₹{order.discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">{t('Shipping', 'அனுப்புதல்')}</span>
                <span>{order.shipping_cost === 0 ? 'FREE' : `₹${order.shipping_cost}`}</span>
              </div>
              {order.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('Tax', 'வரி')}</span>
                  <span>₹{order.tax_amount}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between text-base font-bold">
                  <span>{t('Total', 'மொத்தம்')}</span>
                  <span>₹{order.grand_total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="rounded-xl border bg-white p-4">
              <h3 className="mb-2 font-semibold">{t('Shipping Address', 'அனுப்பும் முகவரி')}</h3>
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-900">{order.shipping_address.recipient_name}</p>
                <p>{order.shipping_address.line_1 ?? order.shipping_address.line1}</p>
                {(order.shipping_address.line_2 ?? order.shipping_address.line2) && (
                  <p>{order.shipping_address.line_2 ?? order.shipping_address.line2}</p>
                )}
                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                {order.shipping_address.phone && (
                  <p className="mt-1 font-medium text-slate-800">📞 {order.shipping_address.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment */}
          {order.payment && (
            <div className="rounded-xl border bg-white p-4">
              <h3 className="mb-2 font-semibold">{t('Payment', 'பணம் செலுத்துதல்')}</h3>
              <div className="text-sm text-slate-600">
                <p>{t('Gateway:', 'நுழைவாயில்:')} {order.payment.gateway}</p>
                <p>Status: <Badge variant={order.payment.status === 'captured' ? 'success' : 'warning'}>{order.payment.status}</Badge></p>
              </div>
            </div>
          )}

          {/* Invoice */}
          <div className="rounded-xl border bg-white p-4">
            <h3 className="mb-2 font-semibold">{t('Invoice', 'பில்')}</h3>
            {order.invoice ? (
              <div className="space-y-2 text-sm">
                <p className="text-slate-600">Invoice: <span className="font-medium text-slate-900">{order.invoice.invoice_number}</span></p>
                <p className="text-slate-600">Issued: {new Date(order.invoice.issued_at).toLocaleDateString('en-IN')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleDownloadInvoice}
                  loading={invoiceMut.isPending}
                >
                  {t('Download Invoice', 'பில் பதிவிறக்கம்')}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleDownloadInvoice}
                loading={invoiceMut.isPending}
              >
                {t('Download Invoice', 'பில் பதிவிறக்கம்')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
