'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Trash2, Save, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { PRICING_FORMULA_STEPS } from '@/utils/waybillHelpers';

const emptySizeOption = () => ({ key: '', label: '', multiplier: 1, maxDimensionCm: '' });
const emptyWeightOption = () => ({ key: '', label: '', minKg: '', maxKg: '', flatFee: '' });

export default function WaybillSettingsPage() {
  const { toast } = useToast();
  const { can } = useAuth();
  const canEdit = can('waybill', 'edit');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [newState, setNewState] = useState('');
  const [newLagosArea, setNewLagosArea] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/waybill/admin/config');
      setConfig(res.data?.config || res.data);
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to load waybill config.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const update = (path, value) => {
    setConfig((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let ref = next;
      for (let i = 0; i < keys.length - 1; i++) {
        ref[keys[i]] = { ...ref[keys[i]] };
        ref = ref[keys[i]];
      }
      ref[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/api/waybill/admin/config', config);
      toast({ description: 'Waybill config saved.' });
      fetchConfig();
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to save config.',
      });
    } finally {
      setSaving(false);
    }
  };

  const addToList = (field, value, reset) => {
    if (!value.trim()) return;
    const list = [...(config[field] || []), value.trim()];
    update(field, list);
    reset('');
  };

  const removeFromList = (field, index) => {
    update(field, (config[field] || []).filter((_, i) => i !== index));
  };

  const updateRateMap = (mapKey, entryKey, entryValue, remove = false) => {
    const map = { ...(config.pricing?.[mapKey] || {}) };
    if (remove) {
      delete map[entryKey];
    } else {
      map[entryKey] = Number(entryValue) || 0;
    }
    update(`pricing.${mapKey}`, map);
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading config...</div>;
  }

  if (!config) {
    return <div className="py-12 text-center text-gray-500">Config unavailable.</div>;
  }

  const pricing = config.pricing || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/waybill">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Waybill Pricing & Areas</h1>
            <p className="text-sm text-gray-500">Control service areas, item options, and pricing formula inputs.</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={saving} className="bg-[#62275F] hover:bg-[#733E70]">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save config'}
          </Button>
        )}
      </div>

      {/* General */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">General</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={!!config.enabled}
              onCheckedChange={(v) => update('enabled', v)}
              disabled={!canEdit}
            />
            <Label>Waybill service enabled</Label>
          </div>
          <div>
            <Label>Currency</Label>
            <Input value={config.currency || 'NGN'} onChange={(e) => update('currency', e.target.value)} disabled={!canEdit} className="mt-1" />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={!!config.photoRequired}
              onCheckedChange={(v) => update('photoRequired', v)}
              disabled={!canEdit}
            />
            <Label>Photo required on submit</Label>
          </div>
          <div>
            <Label>Max photos</Label>
            <Input type="number" value={config.maxPhotos ?? 5} onChange={(e) => update('maxPhotos', Number(e.target.value))} disabled={!canEdit} className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Terms text (shown to users before submit)</Label>
          <textarea
            value={config.termsText || ''}
            onChange={(e) => update('termsText', e.target.value)}
            disabled={!canEdit}
            className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </section>

      {/* Quoting & Payment Routing */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">Quoting & Payment Mode</h2>
        <p className="text-sm text-gray-500">
          Control whether users can pay immediately or wait for admin review.
        </p>
        <div className="space-y-4">
          <div>
            <Label className="font-medium mb-2 block">Quoting mode</Label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="quoting-mode"
                  value="automatic"
                  checked={(config.quoting?.mode || 'hybrid') === 'automatic'}
                  onChange={() => update('quoting.mode', 'automatic')}
                  disabled={!canEdit}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">Automatic</p>
                  <p className="text-xs text-gray-600">Every request is quoted instantly on submit — user can pay immediately</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="quoting-mode"
                  value="manual_review"
                  checked={(config.quoting?.mode || 'hybrid') === 'manual_review'}
                  onChange={() => update('quoting.mode', 'manual_review')}
                  disabled={!canEdit}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">Manual Review</p>
                  <p className="text-xs text-gray-600">All requests go to admin for review — ops must quote before user can pay</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50 bg-[#f7f3f6]">
                <input
                  type="radio"
                  name="quoting-mode"
                  value="hybrid"
                  checked={(config.quoting?.mode || 'hybrid') === 'hybrid'}
                  onChange={() => update('quoting.mode', 'hybrid')}
                  disabled={!canEdit}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">Hybrid (Recommended)</p>
                  <p className="text-xs text-gray-600">Domestic auto-quotes if under max amount; international & heavy items need review</p>
                </div>
              </label>
            </div>
          </div>

          {(config.quoting?.mode === 'hybrid' || config.quoting?.mode === 'automatic') && (
            <div className="bg-gray-50 rounded p-4 space-y-4">
              <h3 className="font-medium text-sm">Auto-quote rules (when automatic/hybrid)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.quoting?.autoRules?.autoQuoteDomestic ?? true}
                    onCheckedChange={(v) => update('quoting.autoRules.autoQuoteDomestic', v)}
                    disabled={!canEdit}
                  />
                  <Label className="text-sm">Auto-quote domestic (NG → NG)</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.quoting?.autoRules?.autoQuoteInternational ?? false}
                    onCheckedChange={(v) => update('quoting.autoRules.autoQuoteInternational', v)}
                    disabled={!canEdit}
                  />
                  <Label className="text-sm">Auto-quote international</Label>
                </div>
                <div>
                  <Label className="text-sm">Max auto-quote amount (NGN)</Label>
                  <Input
                    type="number"
                    value={config.quoting?.autoRules?.maxAutoQuoteAmount ?? 200000}
                    onChange={(e) => update('quoting.autoRules.maxAutoQuoteAmount', Number(e.target.value))}
                    disabled={!canEdit}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Above this amount → manual review required</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Weight bands requiring manual review</Label>
                <div className="flex flex-wrap gap-2">
                  {(config.quoting?.autoRules?.manualReviewWeightKeys || []).map((key, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white border rounded px-2 py-1 text-xs">
                      {key}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...(config.quoting?.autoRules?.manualReviewWeightKeys || [])];
                            list.splice(i, 1);
                            update('quoting.autoRules.manualReviewWeightKeys', list);
                          }}
                          className="text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {canEdit && (
                  <div className="flex gap-2 mt-2">
                    <select
                      className="text-sm border rounded px-2 py-1"
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const list = [...(config.quoting?.autoRules?.manualReviewWeightKeys || [])];
                        if (!list.includes(e.target.value)) {
                          list.push(e.target.value);
                          update('quoting.autoRules.manualReviewWeightKeys', list);
                        }
                        e.target.value = '';
                      }}
                    >
                      <option value="">Add weight band...</option>
                      {(config.weightOptions || []).map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label || opt.key}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">e.g., over_20kg → always reviewed by ops</p>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Item categories requiring manual review</Label>
                <div className="flex flex-wrap gap-2">
                  {(config.quoting?.autoRules?.manualReviewCategories || []).map((cat, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white border rounded px-2 py-1 text-xs">
                      {cat}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...(config.quoting?.autoRules?.manualReviewCategories || [])];
                            list.splice(i, 1);
                            update('quoting.autoRules.manualReviewCategories', list);
                          }}
                          className="text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {canEdit && (
                  <div className="flex gap-2 mt-2">
                    <select
                      className="text-sm border rounded px-2 py-1"
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const list = [...(config.quoting?.autoRules?.manualReviewCategories || [])];
                        if (!list.includes(e.target.value)) {
                          list.push(e.target.value);
                          update('quoting.autoRules.manualReviewCategories', list);
                        }
                        e.target.value = '';
                      }}
                    >
                      <option value="">Add category...</option>
                      {(config.itemCategories || []).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">e.g., Electronics → ops must review photos before quoting</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Formula reference */}
      <section className="bg-[#f7f3f6] border border-[#62275F]/20 rounded-lg p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Info className="h-5 w-5 text-[#62275F]" />
          Pricing formula (for ops)
        </h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          {PRICING_FORMULA_STEPS.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      {/* Pricing core */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">Core pricing</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['baseFee', 'Base fee'],
            ['perKgRate', 'Per kg rate'],
            ['minEstimate', 'Min estimate'],
            ['maxEstimate', 'Max estimate'],
            ['fragileSurchargePercent', 'Fragile surcharge %'],
            ['insurancePercent', 'Insurance %'],
          ].map(([key, label]) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                type="number"
                value={pricing[key] ?? ''}
                onChange={(e) => update(`pricing.${key}`, Number(e.target.value))}
                disabled={!canEdit}
                className="mt-1"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Size & weight options */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">Size options</h2>
        {(config.sizeOptions || []).map((opt, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end border-b pb-3">
            <Input placeholder="key" value={opt.key} onChange={(e) => {
              const list = [...config.sizeOptions]; list[i] = { ...list[i], key: e.target.value }; update('sizeOptions', list);
            }} disabled={!canEdit} />
            <Input placeholder="label" value={opt.label} onChange={(e) => {
              const list = [...config.sizeOptions]; list[i] = { ...list[i], label: e.target.value }; update('sizeOptions', list);
            }} disabled={!canEdit} />
            <Input type="number" placeholder="multiplier" value={opt.multiplier} onChange={(e) => {
              const list = [...config.sizeOptions]; list[i] = { ...list[i], multiplier: Number(e.target.value) }; update('sizeOptions', list);
            }} disabled={!canEdit} />
            <Input type="number" placeholder="max cm" value={opt.maxDimensionCm} onChange={(e) => {
              const list = [...config.sizeOptions]; list[i] = { ...list[i], maxDimensionCm: Number(e.target.value) }; update('sizeOptions', list);
            }} disabled={!canEdit} />
            {canEdit && (
              <Button variant="outline" size="icon" onClick={() => update('sizeOptions', config.sizeOptions.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
        ))}
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => update('sizeOptions', [...(config.sizeOptions || []), emptySizeOption()])}>
            <Plus className="h-4 w-4 mr-1" /> Add size
          </Button>
        )}

        <h2 className="text-lg font-semibold pt-4">Weight options</h2>
        {(config.weightOptions || []).map((opt, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end border-b pb-3">
            <Input placeholder="key" value={opt.key} onChange={(e) => {
              const list = [...config.weightOptions]; list[i] = { ...list[i], key: e.target.value }; update('weightOptions', list);
            }} disabled={!canEdit} />
            <Input placeholder="label" value={opt.label} onChange={(e) => {
              const list = [...config.weightOptions]; list[i] = { ...list[i], label: e.target.value }; update('weightOptions', list);
            }} disabled={!canEdit} />
            <Input type="number" placeholder="min kg" value={opt.minKg} onChange={(e) => {
              const list = [...config.weightOptions]; list[i] = { ...list[i], minKg: Number(e.target.value) }; update('weightOptions', list);
            }} disabled={!canEdit} />
            <Input type="number" placeholder="max kg" value={opt.maxKg} onChange={(e) => {
              const list = [...config.weightOptions]; list[i] = { ...list[i], maxKg: Number(e.target.value) }; update('weightOptions', list);
            }} disabled={!canEdit} />
            <Input type="number" placeholder="flat fee" value={opt.flatFee} onChange={(e) => {
              const list = [...config.weightOptions]; list[i] = { ...list[i], flatFee: Number(e.target.value) }; update('weightOptions', list);
            }} disabled={!canEdit} />
            {canEdit && (
              <Button variant="outline" size="icon" onClick={() => update('weightOptions', config.weightOptions.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
        ))}
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => update('weightOptions', [...(config.weightOptions || []), emptyWeightOption()])}>
            <Plus className="h-4 w-4 mr-1" /> Add weight band
          </Button>
        )}

        <h2 className="text-lg font-semibold pt-4">Item categories</h2>
        <div className="flex flex-wrap gap-2">
          {(config.itemCategories || []).map((cat, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm">
              {cat}
              {canEdit && (
                <button type="button" onClick={() => removeFromList('itemCategories', i)} className="text-red-500">
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Input placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <Button variant="outline" onClick={() => addToList('itemCategories', newCategory, setNewCategory)}>Add</Button>
          </div>
        )}
      </section>

      {/* Service areas */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">Nigeria states (domestic service)</h2>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {(config.nigeriaStates || []).map((state, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-xs">
              {state}
              {canEdit && <button type="button" onClick={() => removeFromList('nigeriaStates', i)} className="text-red-500">×</button>}
            </span>
          ))}
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Input placeholder="Add state" value={newState} onChange={(e) => setNewState(e.target.value)} />
            <Button variant="outline" onClick={() => addToList('nigeriaStates', newState, setNewState)}>Add</Button>
          </div>
        )}

        <h2 className="text-lg font-semibold pt-4">Lagos areas (LGAs)</h2>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {(config.lagosAreas || []).map((area, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-xs">
              {area}
              {canEdit && <button type="button" onClick={() => removeFromList('lagosAreas', i)} className="text-red-500">×</button>}
            </span>
          ))}
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Input placeholder="Add Lagos area" value={newLagosArea} onChange={(e) => setNewLagosArea(e.target.value)} />
            <Button variant="outline" onClick={() => addToList('lagosAreas', newLagosArea, setNewLagosArea)}>Add</Button>
          </div>
        )}

        <h2 className="text-lg font-semibold pt-4">Countries</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Enabled</th>
                <th className="py-2">Domestic</th>
              </tr>
            </thead>
            <tbody>
              {(config.countries || []).map((c, i) => (
                <tr key={c.code || i} className="border-t">
                  <td className="py-2 pr-4 font-mono">{c.code}</td>
                  <td className="py-2 pr-4">{c.name}</td>
                  <td className="py-2 pr-4">
                    <Switch
                      checked={!!c.enabled}
                      onCheckedChange={(v) => {
                        const list = [...config.countries];
                        list[i] = { ...list[i], enabled: v };
                        update('countries', list);
                      }}
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="py-2">{c.isDomestic ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rate maps */}
      <section className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Domestic state rates (NGN)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(pricing.domesticStateRates || {}).map(([key, val]) => (
              <div key={key} className="flex gap-1 items-center">
                <Input value={key} disabled className="text-xs" />
                <Input
                  type="number"
                  value={val}
                  onChange={(e) => updateRateMap('domesticStateRates', key, e.target.value)}
                  disabled={!canEdit}
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3">International country rates (NGN)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(pricing.internationalCountryRates || {}).map(([key, val]) => (
              <div key={key} className="flex gap-1 items-center">
                <Input value={key} disabled className="text-xs font-mono" />
                <Input
                  type="number"
                  value={val}
                  onChange={(e) => updateRateMap('internationalCountryRates', key, e.target.value)}
                  disabled={!canEdit}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-lg shadow p-6 space-y-3">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="flex items-center gap-3">
          <Switch
            checked={!!config.notifications?.emailOnStatusChange}
            onCheckedChange={(v) => update('notifications.emailOnStatusChange', v)}
            disabled={!canEdit}
          />
          <Label>Email user on status change</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={!!config.notifications?.pushOnStatusChange}
            onCheckedChange={(v) => update('notifications.pushOnStatusChange', v)}
            disabled={!canEdit}
          />
          <Label>Push notification on status change</Label>
        </div>
      </section>
    </div>
  );
}
