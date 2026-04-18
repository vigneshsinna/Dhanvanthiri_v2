import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  downloadAdminOrderInvoice,
  useAdminCreateShipmentMutation,
  useAdminOrderQuery,
  useAdminOrderTrackingQuery,
  useAdminUpdateOrderStatusMutation,
  useAdminMarkCollectedMutation,
} from '@/features/admin/api';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/Spinner';

const statusVariant = (status: string) => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending_payment: 'warning',
    paid: 'success',
    placed: 'info',
    confirmed: 'info',
    processing: 'info',
    packed: 'info',
    shipped: 'info',
    out_for_delivery: 'info',
    delivered: 'success',
    completed: 'success',
    cancel_requested: 'warning',
    cancelled: 'danger',
    return_requested: 'warning',
    return_approved: 'warning',
    return_rejected: 'danger',
    returned: 'default',
    refund_pending: 'warning',
    refunded: 'danger',
    partially_refunded: 'warning',
    failed: 'danger',
    on_hold: 'default',
  };

  return map[status] ?? 'default';
};

/** Fallback transition map used only when backend meta is unavailable. */
const fallbackNextStatuses: Record<string, string[]> = {
  pending_payment: ['confirmed', 'cancelled', 'failed'],
  paid: ['processing', 'cancelled', 'refunded'],
  placed: ['confirmed', 'cancelled', 'failed', 'on_hold'],
  confirmed: ['processing', 'cancel_requested', 'cancelled', 'on_hold'],
  processing: ['packed', 'cancel_requested', 'cancelled', 'on_hold'],
  packed: ['shipped', 'cancel_requested', 'cancelled', 'on_hold'],
  shipped: ['out_for_delivery', 'delivered', 'on_hold'],
  out_for_delivery: ['delivered', 'on_hold'],
  delivered: ['completed', 'return_requested', 'refund_pending'],
  completed: ['return_requested', 'refund_pending', 'refunded', 'partially_refunded'],
  cancel_requested: ['cancelled', 'processing', 'on_hold'],
  cancelled: ['refund_pending'],
  return_requested: ['return_approved', 'return_rejected', 'on_hold'],
  return_approved: ['returned', 'on_hold'],
  return_rejected: [],
  returned: ['refund_pending'],
  refund_pending: ['refunded', 'partially_refunded'],
  refunded: [],
  partially_refunded: ['refund_pending', 'refunded'],
  failed: ['placed', 'cancelled'],
  on_hold: ['confirmed', 'processing', 'packed', 'shipped', 'cancelled'],
};

/** Status labels for transition buttons */
const transitionLabels: Record<string, string> = {
  confirmed: 'Confirm',
  processing: 'Start Processing',
  packed: 'Mark Packed',
  shipped: 'Mark Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Mark Delivered',
  completed: 'Complete',
  cancelled: 'Cancel',
  cancel_requested: 'Cancel Requested',
  on_hold: 'Put on Hold',
  return_requested: 'Return Requested',
  return_approved: 'Approve Return',
  return_rejected: 'Reject Return',
  returned: 'Mark Returned',
  refund_pending: 'Initiate Refund',
  refunded: 'Mark Refunded',
  partially_refunded: 'Partial Refund',
  failed: 'Mark Failed',
  placed: 'Re-place',
};

/** Variant for each transition type */
const transitionVariant = (status: string): 'danger' | 'outline' | 'primary' | 'ghost' => {
  if (['cancelled', 'failed'].includes(status)) return 'danger';
  if (['on_hold', 'cancel_requested', 'return_rejected'].includes(status)) return 'ghost';
  return 'outline';
};

const currency = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.id ?? 0);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipmentMessage, setShipmentMessage] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const { data, isLoading, refetch } = useAdminOrderQuery(orderId, Number.isFinite(orderId) && orderId > 0);
  const { data: trackingData, isLoading: isTrackingLoading } = useAdminOrderTrackingQuery(orderId, Number.isFinite(orderId) && orderId > 0);
  const updateStatus = useAdminUpdateOrderStatusMutation();
  const createShipment = useAdminCreateShipmentMutation();
  const markCollected = useAdminMarkCollectedMutation();

  const order = useMemo(() => data?.data?.data ?? data?.data ?? null, [data]);
  const orderMeta = useMemo(() => data?.data?.meta ?? data?.meta ?? {}, [data]);
  const trackingEvents = useMemo(() => {
    const payload = trackingData?.data?.data ?? trackingData?.data ?? trackingData ?? [];
    return Array.isArray(payload) ? payload : [];
  }, [trackingData]);

  if (isLoading) return <PageLoader />;
  if (!order) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">Order not found.</div>;

  const items = Array.isArray(order.items) ? order.items : [];
  const shipments = Array.isArray(order.shipments) ? order.shipments : [];
  const payments = Array.isArray(order.payments) ? order.payments : [];
  const returnRequests = Array.isArray(order.returnRequests ?? order.return_requests) ? (order.returnRequests ?? order.return_requests) : [];
  const addresses = Array.isArray(order.addresses) ? order.addresses : [];
  const statusHistory = Array.isArray(order.statusHistory ?? order.status_history) ? (order.statusHistory ?? order.status_history) : [];
  const invoiceData = order.invoice;

  // Use API-returned allowed transitions, fall back to local map
  const allowedTransitions: string[] = Array.isArray(orderMeta.allowed_transitions)
    ? orderMeta.allowed_transitions
    : (fallbackNextStatuses[order.status] ?? []);

  const isCoD = payments.some((p: any) => p.gateway === 'cod');
  const isCoDPending = isCoD && payments.some((p: any) => p.status === 'pending');

  // Shipping address from the addresses array
  const shippingAddress = addresses.find((a: any) => a.type === 'shipping');
  const billingAddress = addresses.find((a: any) => a.type === 'billing');

  async function handleDownloadInvoice() {
    await downloadAdminOrderInvoice(order.id, `${order.order_number}.pdf`);
  }

  async function handleCreateShipment() {
    if (!carrier.trim() || !trackingNumber.trim()) {
      setShipmentMessage('Carrier and tracking number are required.');
      return;
    }

    await createShipment.mutateAsync({
      id: order.id,
      carrier: carrier.trim(),
      tracking_number: trackingNumber.trim(),
    });
    setShipmentMessage('Shipment created successfully.');
    refetch();
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="OMS Detail"
        title={
          <div className="flex items-center gap-2">
            {order.order_number}
            {isCoD && <Badge variant="warning" className="text-sm">COD</Badge>}
          </div>
        }
        description="Track invoice, shipping, status transitions, and return activity from one order workspace."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            {isCoDPending && (
              <Button
                variant="outline"
                className="border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800"
                loading={markCollected.isPending}
                onClick={async () => {
                  try {
                    await markCollected.mutateAsync({ id: order.id });
                    refetch();
                  } catch (e) {
                    // console.error(e)
                  }
                }}
              >
                Mark Payment as Collected
              </Button>
            )}
            {invoiceData ? (
              <Button variant="outline" onClick={handleDownloadInvoice}>Download Invoice</Button>
            ) : (
              <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-400">
                Invoice not yet generated
              </span>
            )}
            <Link to="/store-admin/returns" className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Returns Queue
            </Link>
          </div>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          {/* Customer & Order Summary */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Customer</p>
                <h2 className="text-lg font-semibold text-slate-950">{order.user?.name ?? 'Guest'}</h2>
                <p className="text-sm text-slate-500">{order.user?.email ?? '-'}</p>
                {order.user?.phone && (
                  <p className="text-sm text-slate-500">{order.user.phone}</p>
                )}
              </div>
              <Badge variant={statusVariant(order.status)}>{order.status.replace(/_/g, ' ')}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Order Total" value={`Rs. ${currency.format(order.grand_total ?? order.total ?? 0)}`} />
              <Metric label="Payments" value={String(payments.length)} />
              <Metric label="Return Requests" value={String(returnRequests.length)} />
            </div>
            {isCoD && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Payment Status (COD)</span>
                <Badge variant={isCoDPending ? 'warning' : 'success'}>
                  {isCoDPending ? 'Pending Collection' : 'Paid & Collected'}
                </Badge>
              </div>
            )}
          </div>

          {/* Contact & Address */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">Contact & Address</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {shippingAddress && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Shipping Address</p>
                  <p className="font-medium text-slate-950">{shippingAddress.recipient_name}</p>
                  <p className="text-sm text-slate-600">{shippingAddress.line1 ?? shippingAddress.address_line_1}</p>
                  {(shippingAddress.line2 ?? shippingAddress.address_line_2) && (
                    <p className="text-sm text-slate-600">{shippingAddress.line2 ?? shippingAddress.address_line_2}</p>
                  )}
                  <p className="text-sm text-slate-600">
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
                  </p>
                  {shippingAddress.phone && (
                    <p className="mt-1 text-sm font-medium text-slate-700">📞 {shippingAddress.phone}</p>
                  )}
                </div>
              )}
              {billingAddress && billingAddress.id !== shippingAddress?.id && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Billing Address</p>
                  <p className="font-medium text-slate-950">{billingAddress.recipient_name}</p>
                  <p className="text-sm text-slate-600">{billingAddress.line1 ?? billingAddress.address_line_1}</p>
                  {(billingAddress.line2 ?? billingAddress.address_line_2) && (
                    <p className="text-sm text-slate-600">{billingAddress.line2 ?? billingAddress.address_line_2}</p>
                  )}
                  <p className="text-sm text-slate-600">
                    {billingAddress.city}, {billingAddress.state} {billingAddress.postal_code}
                  </p>
                  {billingAddress.phone && (
                    <p className="mt-1 text-sm font-medium text-slate-700">📞 {billingAddress.phone}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Order Items</h2>
              <span className="text-sm text-slate-500">{items.length} line items</span>
            </div>
            <div className="space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-950">{item.product_name ?? item.product?.name ?? 'Item'}</p>
                    <p className="text-xs text-slate-500">{item.variant_name ?? item.variant?.sku ?? ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-950">x{item.quantity}</p>
                    <p className="text-xs text-slate-500">Rs. {currency.format(item.total_price ?? item.line_total ?? 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Tracking</h2>
              <span className="text-sm text-slate-500">{isTrackingLoading ? 'Refreshing...' : `${trackingEvents.length} events`}</span>
            </div>
            <div className="space-y-3">
              {trackingEvents.map((event: any, index: number) => (
                <div key={`${event.id ?? index}-${event.created_at ?? event.occurred_at ?? index}`} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-950">{event.event_type ?? event.status ?? 'Update'}</p>
                    <p className="text-xs text-slate-400">{new Date(event.created_at ?? event.occurred_at ?? Date.now()).toLocaleString('en-IN')}</p>
                  </div>
                  <p className="mt-1 text-slate-600">{event.description}</p>
                  {event.location ? <p className="mt-1 text-xs text-slate-400">{event.location}</p> : null}
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          {statusHistory.length > 0 && (
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-950">Status History</h2>
              <div className="space-y-3">
                {statusHistory.map((entry: any, idx: number) => (
                  <div key={entry.id ?? idx} className="flex items-start gap-3 rounded-2xl border border-slate-100 px-4 py-3 text-sm">
                    <div className="flex flex-col items-center pt-0.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${idx === 0 ? 'bg-sky-500' : 'bg-slate-300'}`} />
                      {idx < statusHistory.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-slate-200" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">{entry.from_status}</Badge>
                        <span className="text-slate-400">→</span>
                        <Badge variant={statusVariant(entry.to_status)} className="text-xs">{entry.to_status}</Badge>
                      </div>
                      {entry.note && <p className="mt-1 text-slate-600">{entry.note}</p>}
                      <p className="mt-0.5 text-xs text-slate-400">
                        {entry.changed_by?.name ?? 'System'} · {new Date(entry.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* State Transitions */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-950">State Transitions</h2>
            <p className="mb-3 text-xs text-slate-400">
              Current: <Badge variant={statusVariant(order.status)}>{order.status.replace(/_/g, ' ')}</Badge>
            </p>
            {allowedTransitions.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No transitions available from current status.</p>
            ) : (
              <>
                <div className="mb-3">
                  <Input
                    label="Note (optional)"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Reason for status change..."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {allowedTransitions.map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      variant={transitionVariant(nextStatus)}
                      size="sm"
                      loading={updateStatus.isPending}
                      onClick={async () => {
                        await updateStatus.mutateAsync({
                          id: order.id,
                          status: nextStatus,
                          notes: statusNote || undefined,
                        });
                        setStatusNote('');
                        refetch();
                      }}
                    >
                      {transitionLabels[nextStatus] ?? nextStatus.replace(/_/g, ' ')}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Invoice */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-950">Invoice</h2>
            {invoiceData ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Invoice Number</span>
                  <span className="font-medium text-slate-950">{invoiceData.invoice_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Issued</span>
                  <span className="text-slate-700">{new Date(invoiceData.issued_at).toLocaleDateString('en-IN')}</span>
                </div>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={handleDownloadInvoice}>
                  View / Download Invoice
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">
                Invoice will be generated when the order is confirmed.
              </p>
            )}
          </div>

          {/* Create Shipment */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">Create Shipment</h2>
            <div className="space-y-3">
              <Input label="Carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. BlueDart, DTDC, India Post" />
              <Input label="Tracking Number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. BD123456789" />
              <Button onClick={handleCreateShipment} loading={createShipment.isPending}>Create Shipment</Button>
              {shipmentMessage ? <p className="text-sm text-slate-500">{shipmentMessage}</p> : null}
            </div>
          </div>

          {/* Shipment Summary */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">Shipment Summary</h2>
            <div className="space-y-3">
              {shipments.length === 0 ? (
                <p className="text-sm text-slate-500">No shipments created yet.</p>
              ) : shipments.map((shipment: any) => (
                <div key={shipment.id} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  <p className="font-medium text-slate-950">{shipment.carrier}</p>
                  <p className="text-slate-600">{shipment.tracking_number}</p>
                  <p className="text-xs text-slate-400">{shipment.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">Returns</h2>
            <div className="space-y-3">
              {returnRequests.length === 0 ? (
                <p className="text-sm text-slate-500">No return requests logged for this order.</p>
              ) : returnRequests.map((request: any) => (
                <div key={request.id} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-950">Return #{request.id}</p>
                    <Badge variant={request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}>
                      {request.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-slate-600">{request.reason ?? request.refund_type ?? 'Return request'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
