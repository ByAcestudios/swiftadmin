'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Send, X, Smartphone, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Can from '@/components/Can';
import {
  BLAST_TYPES,
  buildBlastPayload,
  defaultBlastForm,
} from '@/utils/notificationHelpers';

function PreviewStats({ preview }) {
  if (!preview) return null;

  const { byPlatform } = preview;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Audience preview
        </CardTitle>
        <CardDescription>
          Confirm reach before sending. Counts reflect registered devices matching your filters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatBox label="Users" value={preview.users} />
          <StatBox label="Riders" value={preview.riders} />
          <StatBox label="Total devices" value={preview.devices} />
          <StatBox label="User devices" value={preview.userDevices} />
          <StatBox label="Rider devices" value={preview.riderDevices} />
        </div>

        {byPlatform && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline" className="gap-1">
              <Smartphone className="h-3 w-3" />
              Android: {byPlatform.android ?? 0}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Smartphone className="h-3 w-3" />
              iOS: {byPlatform.ios ?? 0}
            </Badge>
            {(byPlatform.web ?? 0) > 0 && (
              <Badge variant="outline">Web: {byPlatform.web}</Badge>
            )}
          </div>
        )}

        {preview.audience && (
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
            <p>
              Apps:{' '}
              {Array.isArray(preview.audience.apps)
                ? preview.audience.apps.join(', ')
                : preview.audience.apps}
            </p>
            <p>
              Platforms:{' '}
              {Array.isArray(preview.audience.platforms)
                ? preview.audience.platforms.join(', ')
                : preview.audience.platforms}
            </p>
            {preview.audience.emails?.length > 0 && (
              <p>Emails: {preview.audience.emails.join(', ')}</p>
            )}
            {preview.audience.excludeEmails?.length > 0 && (
              <p>Excluded: {preview.audience.excludeEmails.join(', ')}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value?.toLocaleString?.() ?? value ?? 0}</p>
    </div>
  );
}

function EmailChipList({ emails, onRemove }) {
  if (!emails.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {emails.map((email) => (
        <Badge key={email} variant="secondary" className="gap-1 pr-1">
          {email}
          <button
            type="button"
            onClick={() => onRemove(email)}
            className="rounded-full hover:bg-muted p-0.5"
            aria-label={`Remove ${email}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

export default function BlastForm({ onSent }) {
  const { toast } = useToast();
  const [form, setForm] = useState(defaultBlastForm);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const validate = () => {
    if (!form.title.trim()) {
      toast({ variant: 'destructive', description: 'Title is required.' });
      return false;
    }
    if (!form.message.trim()) {
      toast({ variant: 'destructive', description: 'Message is required.' });
      return false;
    }
    if (form.appsMode === 'custom' && !form.appsUser && !form.appsRider) {
      toast({ variant: 'destructive', description: 'Select at least one app audience.' });
      return false;
    }
    if (form.platformsMode === 'custom' && !form.platformAndroid && !form.platformIos) {
      toast({ variant: 'destructive', description: 'Select at least one platform.' });
      return false;
    }
    if (form.targetMode === 'include' && !form.emails.length) {
      toast({ variant: 'destructive', description: 'Add at least one email for targeted blast.' });
      return false;
    }
    return true;
  };

  const addEmail = (field, inputField) => {
    const raw = form[inputField]?.trim();
    if (!raw) return;
    const parts = raw.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
    const invalid = parts.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (invalid.length) {
      toast({ variant: 'destructive', description: `Invalid email: ${invalid[0]}` });
      return;
    }
    const existing = form[field];
    const merged = [...new Set([...existing, ...parts])];
    update({ [field]: merged, [inputField]: '' });
  };

  const handlePreview = async () => {
    if (!validate()) return;
    setPreviewLoading(true);
    setConfirmSend(false);
    try {
      const payload = buildBlastPayload(form);
      const res = await api.post('/api/admin/notifications/blast/preview', payload);
      setPreview(res.data.preview || res.data);
      toast({ description: 'Audience preview updated.' });
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Preview failed.',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async () => {
    if (!validate()) return;
    if (!preview) {
      toast({
        variant: 'destructive',
        description: 'Preview the audience first before sending.',
      });
      return;
    }
    if (!confirmSend) {
      setConfirmSend(true);
      return;
    }

    setSendLoading(true);
    try {
      const payload = buildBlastPayload(form);
      const res = await api.post('/api/admin/notifications/blast', payload);
      const blast = res.data.blast || res.data;
      toast({
        description: res.data.message || 'Notification blast queued.',
      });
      setForm(defaultBlastForm());
      setPreview(null);
      setConfirmSend(false);
      onSent?.(blast);
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to queue blast.',
      });
      setConfirmSend(false);
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blast-type">Type</Label>
              <Select value={form.type} onValueChange={(v) => update({ type: v })}>
                <SelectTrigger id="blast-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLAST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label} — {t.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blast-title">Title</Label>
              <Input
                id="blast-title"
                placeholder="Weekend promo!"
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blast-message">Message</Label>
              <Textarea
                id="blast-message"
                placeholder="Get 20% off your next delivery this weekend."
                value={form.message}
                onChange={(e) => update({ message: e.target.value })}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.message.length}/500
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Audience
            </CardTitle>
            <CardDescription>
              Target customer app users, riders, or both — by platform and email filters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label>Apps</Label>
              <Select
                value={form.appsMode}
                onValueChange={(v) => update({ appsMode: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All apps (customers + riders)</SelectItem>
                  <SelectItem value="custom">Specific apps</SelectItem>
                </SelectContent>
              </Select>
              {form.appsMode === 'custom' && (
                <div className="flex flex-wrap gap-4 pl-1">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.appsUser}
                      onCheckedChange={(c) => update({ appsUser: !!c })}
                    />
                    Customer app
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.appsRider}
                      onCheckedChange={(c) => update({ appsRider: !!c })}
                    />
                    Rider / driver app
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Platforms</Label>
              <Select
                value={form.platformsMode}
                onValueChange={(v) => update({ platformsMode: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  <SelectItem value="custom">Specific platforms</SelectItem>
                </SelectContent>
              </Select>
              {form.platformsMode === 'custom' && (
                <div className="flex flex-wrap gap-4 pl-1">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.platformAndroid}
                      onCheckedChange={(c) => update({ platformAndroid: !!c })}
                    />
                    Android
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.platformIos}
                      onCheckedChange={(c) => update({ platformIos: !!c })}
                    />
                    iOS
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Email targeting</Label>
              <Select
                value={form.targetMode}
                onValueChange={(v) => update({ targetMode: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone (no email filter)</SelectItem>
                  <SelectItem value="include">Only specific emails</SelectItem>
                  <SelectItem value="exclude">Everyone except these emails</SelectItem>
                </SelectContent>
              </Select>

              {form.targetMode === 'include' && (
                <div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="john@example.com — comma or space separated"
                      value={form.emailInput}
                      onChange={(e) => update({ emailInput: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addEmail('emails', 'emailInput');
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addEmail('emails', 'emailInput')}
                    >
                      Add
                    </Button>
                  </div>
                  <EmailChipList
                    emails={form.emails}
                    onRemove={(email) =>
                      update({ emails: form.emails.filter((e) => e !== email) })
                    }
                  />
                </div>
              )}

              {form.targetMode === 'exclude' && (
                <div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="test@swiftlogisticsng.com"
                      value={form.excludeEmailInput}
                      onChange={(e) => update({ excludeEmailInput: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addEmail('excludeEmails', 'excludeEmailInput');
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addEmail('excludeEmails', 'excludeEmailInput')}
                    >
                      Add
                    </Button>
                  </div>
                  <EmailChipList
                    emails={form.excludeEmails}
                    onRemove={(email) =>
                      update({ excludeEmails: form.excludeEmails.filter((e) => e !== email) })
                    }
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Optional metadata</CardTitle>
            <CardDescription>
              Deep links and campaign IDs are passed to push payloads and in-app notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deep-link">Deep link</Label>
              <Input
                id="deep-link"
                placeholder="swiftlogistics://promo/weekend"
                value={form.deepLink}
                onChange={(e) => update({ deepLink: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-id">Campaign ID</Label>
              <Input
                id="campaign-id"
                placeholder="optional-campaign-uuid"
                value={form.campaignId}
                onChange={(e) => update({ campaignId: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={previewLoading || sendLoading}
          >
            {previewLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Previewing…
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview audience
              </>
            )}
          </Button>

          <Can module="notifications" action="create">
            <Button
              type="button"
              onClick={handleSend}
              disabled={previewLoading || sendLoading || !preview}
              variant={confirmSend ? 'destructive' : 'default'}
            >
              {sendLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : confirmSend ? (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Confirm send blast
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send blast
                </>
              )}
            </Button>
          </Can>

          {confirmSend && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmSend(false)}
            >
              Cancel
            </Button>
          )}
        </div>

        {!preview && (
          <p className="text-sm text-muted-foreground">
            Preview the audience first to see how many users and devices will receive this blast.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <PreviewStats preview={preview} />
        {!preview && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Push blasts deliver FCM notifications and create in-app inbox entries.
              User app tokens use the User Firebase project; rider tokens use the Rider project.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function BlastFormPageHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">Compose blast</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Send promotional or system push notifications to customers and riders.
        </p>
      </div>
      <Button variant="outline" asChild>
        <Link href="/dashboard/notifications/history">View blast history</Link>
      </Button>
    </div>
  );
}
