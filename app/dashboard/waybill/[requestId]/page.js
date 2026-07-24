'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Calculator, Truck, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Can from '@/components/Can';
import { useAuth } from '@/contexts/AuthContext';
import {
  formatNaira,
  formatWaybillStatus,
  getWaybillStatusColor,
  getPaymentStatusColor,
  formatShipmentType,
  formatContentsType,
  WAYBILL_STATUSES,
} from '@/utils/waybillHelpers';

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value || '—'}</p>
    </div>
  );
}

export default function WaybillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { can } = useAuth();
  const canEdit = can('waybill', 'edit');
  const id = params.requestId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [request, setRequest] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    status: '',
    finalQuotedCost: '',
    adminNotes: '',
    rejectionReason: '',
    trackingNumber: '',
    carrierName: '',
    trackingUrl: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/waybill/admin/requests/${id}`);
      const data = res.data?.request || res.data;
      setRequest(data);
      setQuoteForm({
        status: data.status || '',
        finalQuotedCost: data.finalQuotedCost ?? data.estimatedCost ?? '',
        adminNotes: data.adminNotes || '',
        rejectionReason: data.rejectionReason || '',
        trackingNumber: data.trackingNumber || '',
        carrierName: data.carrierName || '',
        trackingUrl: data.trackingUrl || '',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to load request.',
      });
      router.push('/dashboard/waybill');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const patchRequest = async (payload) => {
    try {
      setSaving(true);
      await api.patch(`/api/waybill/admin/requests/${id}`, payload);
      toast({ description: 'Request updated.' });
      load();
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Update failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setSaving(true);
      const res = await api.post(`/api/waybill/admin/requests/${id}/recalculate`);
      const updated = res.data?.request || res.data;
      toast({ description: 'Estimate recalculated.' });
      if (updated) {
        setRequest(updated);
        setQuoteForm((f) => ({
          ...f,
          finalQuotedCost: updated.finalQuotedCost ?? updated.estimatedCost ?? f.finalQuotedCost,
        }));
      } else {
        load();
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Recalculate failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuote = () => {
    const payload = {
      status: quoteForm.status,
      adminNotes: quoteForm.adminNotes || undefined,
    };
    if (quoteForm.finalQuotedCost !== '') {
      payload.finalQuotedCost = Number(quoteForm.finalQuotedCost);
    }
    if (quoteForm.status === 'rejected') {
      payload.rejectionReason = quoteForm.rejectionReason;
    }
    if (quoteForm.status === 'shipped') {
      payload.trackingNumber = quoteForm.trackingNumber;
      payload.carrierName = quoteForm.carrierName;
      payload.trackingUrl = quoteForm.trackingUrl;
    }
    patchRequest(payload);
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading request...</div>;
  }

  if (!request) return null;

  const photos = request.photoUrls || [];
  const customs = request.customsDeclaration || {};
  const breakdown = request.estimateBreakdown || request.adminQuoteBreakdown;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/waybill">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            {request.requestNumber || `Waybill ${id?.slice(0, 8)}`}
          </h1>
          <p className="text-sm text-gray-500">{formatShipmentType(request.shipmentType)}</p>
        </div>
        <Badge className={getWaybillStatusColor(request.status)}>{formatWaybillStatus(request.status)}</Badge>
        <Badge className={getPaymentStatusColor(request.paymentStatus)}>
          {formatWaybillStatus(request.paymentStatus)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Item */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Item details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailRow label="Category" value={request.itemCategory} />
              <DetailRow label="Size" value={request.sizeLabel || request.sizeKey} />
              <DetailRow label="Weight" value={request.weightLabel || request.weightKey} />
              <DetailRow label="Exact weight (kg)" value={request.itemWeightKg} />
              <DetailRow label="Fragile" value={request.isFragile ? 'Yes' : 'No'} />
              <DetailRow label="Insurance" value={request.wantsInsurance ? 'Yes' : 'No'} />
              <DetailRow
                label="Declared value"
                value={
                  request.declaredValue
                    ? formatNaira(request.declaredValue, request.declaredValueCurrency || request.currency)
                    : null
                }
              />
              <DetailRow label="Description" value={request.itemDescription} />
            </div>
            {request.specialInstructions && (
              <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded p-3">{request.specialInstructions}</p>
            )}
          </section>

          {/* Photos */}
          {photos.length > 0 && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Item photos ({photos.length})</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Item ${i + 1}`} className="w-full h-32 object-cover rounded-lg border" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Sender & Receiver */}
          <section className="bg-white rounded-lg shadow p-6 grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Sender</h2>
              <div className="space-y-3">
                <DetailRow label="Name" value={request.senderName} />
                <DetailRow label="Email" value={request.senderEmail} />
                <DetailRow label="Phone" value={request.senderPhone} />
                <DetailRow label="Alt phone" value={request.senderAltPhone} />
                <DetailRow label="Address" value={request.senderAddress} />
                <DetailRow
                  label="Origin"
                  value={[request.originCity, request.originState, request.originCountry].filter(Boolean).join(', ')}
                />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4">Receiver</h2>
              <div className="space-y-3">
                <DetailRow label="Name" value={request.receiverName} />
                <DetailRow label="Email" value={request.receiverEmail} />
                <DetailRow label="Phone" value={request.receiverPhone} />
                <DetailRow label="Alt phone" value={request.receiverAltPhone} />
                <DetailRow label="Address" value={request.receiverAddress} />
                <DetailRow
                  label="Destination"
                  value={[request.destinationCity, request.destinationState, request.destinationCountry]
                    .filter(Boolean)
                    .join(', ')}
                />
              </div>
            </div>
          </section>

          {/* Customs */}
          {(request.shipmentType === 'inbound' || request.shipmentType === 'outbound' || customs.contentsType) && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Customs declaration</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailRow label="Contents type" value={formatContentsType(customs.contentsType)} />
                <DetailRow label="Description" value={customs.contentsDescription} />
                <DetailRow
                  label="Declared value"
                  value={customs.declaredValue ? `${customs.currency || 'USD'} ${customs.declaredValue}` : null}
                />
                <DetailRow label="HS code" value={customs.hsCode} />
              </div>
            </section>
          )}

          {/* Tracking */}
          {request.trackingNumber && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Tracking
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Carrier" value={request.carrierName} />
                <DetailRow label="Tracking number" value={request.trackingNumber} />
                {request.trackingUrl && (
                  <div className="col-span-2">
                    <a href={request.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-[#62275F] hover:underline text-sm">
                      Open tracking link
                    </a>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Ops panel */}
        <div className="space-y-6">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Pricing</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Auto estimate</span>
                <span className="font-medium">{formatNaira(request.estimatedCost, request.currency)}</span>
              </div>
              {request.finalQuotedCost != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Final quote</span>
                  <span className="font-bold text-[#62275F]">
                    {formatNaira(request.finalQuotedCost, request.currency)}
                  </span>
                </div>
              )}
              {request.amountDue != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount due</span>
                  <span>{formatNaira(request.amountDue, request.currency)}</span>
                </div>
              )}
            </div>
            {breakdown && (
              <pre className="text-xs bg-gray-50 rounded p-3 overflow-x-auto mb-4">
                {JSON.stringify(breakdown, null, 2)}
              </pre>
            )}
            <Can module="waybill" action="edit">
              <Button variant="outline" className="w-full" onClick={handleRecalculate} disabled={saving}>
                <Calculator className="h-4 w-4 mr-2" />
                Recalculate estimate
              </Button>
            </Can>
          </section>

          <Can module="waybill" action="edit">
            <section className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold">Ops actions</h2>

              <div>
                <Label>Status</Label>
                <Select value={quoteForm.status} onValueChange={(v) => setQuoteForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WAYBILL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {formatWaybillStatus(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Final quoted cost ({request.currency || 'NGN'})</Label>
                <Input
                  type="number"
                  value={quoteForm.finalQuotedCost}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, finalQuotedCost: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Admin notes (visible internally)</Label>
                <textarea
                  value={quoteForm.adminNotes}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, adminNotes: e.target.value }))}
                  className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              {quoteForm.status === 'rejected' && (
                <div>
                  <Label>Rejection reason (sent to user)</Label>
                  <textarea
                    value={quoteForm.rejectionReason}
                    onChange={(e) => setQuoteForm((f) => ({ ...f, rejectionReason: e.target.value }))}
                    className="mt-1 w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}

              {quoteForm.status === 'shipped' && (
                <>
                  <div>
                    <Label>Carrier name</Label>
                    <Input
                      value={quoteForm.carrierName}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, carrierName: e.target.value }))}
                      placeholder="DHL, FedEx..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Tracking number</Label>
                    <Input
                      value={quoteForm.trackingNumber}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Tracking URL</Label>
                    <Input
                      value={quoteForm.trackingUrl}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, trackingUrl: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              <Button
                className="w-full bg-[#62275F] hover:bg-[#733E70]"
                onClick={handleSaveQuote}
                disabled={saving}
              >
                Save changes
              </Button>

              {quoteForm.status === 'under_review' && request.status === 'submitted' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => patchRequest({ status: 'under_review' })}
                  disabled={saving}
                >
                  Mark under review
                </Button>
              )}
            </section>
          </Can>

          {!canEdit && (
            <section className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              You have view-only access. Contact an admin with waybill edit permission to quote or update status.
            </section>
          )}

          {request.rejectionReason && (
            <section className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rejection reason
              </p>
              <p className="text-sm text-red-700 mt-1">{request.rejectionReason}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
