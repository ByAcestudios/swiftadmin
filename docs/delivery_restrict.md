# Delivery Type Time Restrictions - Admin Guide

## Overview

This feature allows admins to control when different delivery types (Instant, Same Day, Next Day) are available to users. You can:
- **Pause deliveries temporarily** (e.g., pause instant deliveries for 2 hours)
- **Set daily cutoffs** (e.g., stop accepting same-day deliveries after 12:00 PM)
- **Set daily start times** (e.g., start accepting orders from 8:00 AM)
- **Completely disable** a delivery type

---

## Settings Configuration

### Setting Keys

The following settings control delivery type availability:

1. **`instantDeliveryRestrictions`** - Controls instant delivery availability
2. **`sameDayDeliveryRestrictions`** - Controls same-day delivery availability
3. **`nextDayDeliveryRestrictions`** - Controls next-day delivery availability

### Setting Structure

Each restriction setting is an object with the following structure:

```json
{
  "enabled": true,
  "pauseUntil": null,
  "dailyCutoff": null,
  "dailyStart": null
}
```

#### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `enabled` | boolean | Enable/disable the delivery type completely | `true` or `false` |
| `pauseUntil` | string (ISO timestamp) | Temporarily pause until this time | `"2025-10-30T16:00:00Z"` |
| `dailyCutoff` | string (HH:mm) | Stop accepting orders after this time each day | `"12:00"` |
| `dailyStart` | string (HH:mm) | Start accepting orders from this time each day | `"08:00"` |

**Note**: All time fields are optional. Set to `null` to disable that restriction.

---

## Configuration Examples

### Example 1: Pause Instant Deliveries for 2 Hours

**Scenario**: Admin wants to pause instant deliveries for 2 hours starting now.

**Configuration**:
```json
{
  "instantDeliveryRestrictions": {
    "enabled": true,
    "pauseUntil": "2025-10-30T16:00:00Z",  // 2 hours from now (adjust to your timezone)
    "dailyCutoff": null,
    "dailyStart": null
}
```

**How to set**:
1. Calculate the pause end time (current time + 2 hours)
2. Convert to ISO 8601 format (UTC)
3. Update the setting via API

**Result**: Users will see error: *"instant deliveries are paused for 2 more hour(s)"* when trying to:
- Estimate cost for instant delivery
- Create an instant delivery order

---

### Example 2: Stop Same-Day Deliveries After 12:00 PM

**Scenario**: Admin wants to stop accepting same-day delivery orders after noon each day.

**Configuration**:
```json
{
  "sameDayDeliveryRestrictions": {
    "enabled": true,
    "pauseUntil": null,
    "dailyCutoff": "12:00",
    "dailyStart": null
  }
}
```

**How to set**:
1. Use 24-hour format (HH:mm)
2. Time is interpreted in server's local timezone
3. Cutoff applies only to the current day (resets at midnight)

**Result**: After 12:00 PM, users will see error: *"sameday deliveries are not available after 12:00. Please try again tomorrow."*

---

### Example 3: Start Next-Day Deliveries from 8:00 AM

**Scenario**: Admin wants next-day deliveries to only be available from 8:00 AM onwards.

**Configuration**:
```json
{
  "nextDayDeliveryRestrictions": {
    "enabled": true,
    "pauseUntil": null,
    "dailyCutoff": null,
    "dailyStart": "08:00"
  }
}
```

**Result**: Before 8:00 AM, users will see error: *"nextday deliveries are available from 08:00"*

---

### Example 4: Combine Multiple Restrictions

**Scenario**: Same-day deliveries available from 8:00 AM to 6:00 PM.

**Configuration**:
```json
{
  "sameDayDeliveryRestrictions": {
    "enabled": true,
    "pauseUntil": null,
    "dailyCutoff": "18:00",
    "dailyStart": "08:00"
  }
}
```

**Result**: 
- Before 8:00 AM: *"sameday deliveries are available from 08:00"*
- After 6:00 PM: *"sameday deliveries are not available after 18:00. Please try again tomorrow."*
- Between 8:00 AM - 6:00 PM: Available ✅

---

### Example 5: Completely Disable a Delivery Type

**Scenario**: Admin wants to temporarily disable instant deliveries.

**Configuration**:
```json
{
  "instantDeliveryRestrictions": {
    "enabled": false,
    "pauseUntil": null,
    "dailyCutoff": null,
    "dailyStart": null
  }
}
```

**Result**: Users will see error: *"instant deliveries are currently disabled"*

---

## API Endpoints

### Update Delivery Type Restrictions

**Endpoint**: `PUT /api/settings/:key`

**Example Request**:
```bash
PUT /api/settings/instantDeliveryRestrictions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "value": {
    "enabled": true,
    "pauseUntil": "2025-10-30T16:00:00Z",
    "dailyCutoff": null,
    "dailyStart": null
  }
}
```

**Example Response**:
```json
{
  "id": "uuid",
  "key": "instantDeliveryRestrictions",
  "value": {
    "enabled": true,
    "pauseUntil": "2025-10-30T16:00:00Z",
    "dailyCutoff": null,
    "dailyStart": null
  },
  "category": "scheduling",
  "isPublic": true,
  "description": "Time-based restrictions for instant deliveries...",
  "createdAt": "2025-10-30T12:00:00Z",
  "updatedAt": "2025-10-30T12:00:00Z"
}
```

### Get Current Restrictions

**Endpoint**: `GET /api/settings/instantDeliveryRestrictions`

**Example Response**:
```json
{
  "id": "uuid",
  "key": "instantDeliveryRestrictions",
  "value": {
    "enabled": true,
    "pauseUntil": null,
    "dailyCutoff": "12:00",
    "dailyStart": "08:00"
  },
  "category": "scheduling",
  "isPublic": true
}
```

---

## Testing Guide

### Test Case 1: Pause Instant Deliveries

**Steps**:
1. Set `instantDeliveryRestrictions.pauseUntil` to 2 hours from now
2. Try to estimate cost for instant delivery
3. Try to create an instant delivery order

**Expected Results**:
- ✅ Estimate cost returns `403` with error message
- ✅ Create order returns `403` with error message
- ✅ Error message: *"instant deliveries are paused for 2 more hour(s)"*

**Test Payload** (Estimate Cost):
```json
POST /api/orders/estimate-cost
{
  "pickup": {
    "latitude": 6.5244,
    "longitude": 3.3792
  },
  "dropOffs": [{
    "latitude": 6.4550,
    "longitude": 3.3941
  }],
  "orderType": "instant"
}
```

**Expected Error Response**:
```json
{
  "success": false,
  "error": "instant deliveries are paused for 2 more hour(s)",
  "code": "DELIVERY_TYPE_UNAVAILABLE"
}
```

---

### Test Case 2: Daily Cutoff for Same-Day Deliveries

**Steps**:
1. Set `sameDayDeliveryRestrictions.dailyCutoff` to current time + 1 hour (e.g., if it's 11:00 AM, set to "12:00")
2. Wait until after the cutoff time
3. Try to estimate cost for same-day delivery
4. Try to create a same-day delivery order

**Expected Results**:
- ✅ After cutoff time: Returns `403` with error
- ✅ Before cutoff time: Works normally
- ✅ Error message: *"sameday deliveries are not available after 12:00. Please try again tomorrow."*

**Note**: Cutoff resets at midnight (new day starts)

---

### Test Case 3: Daily Start Time

**Steps**:
1. Set `nextDayDeliveryRestrictions.dailyStart` to current time + 1 hour
2. Try to estimate cost for next-day delivery (before start time)
3. Wait until after start time
4. Try again

**Expected Results**:
- ✅ Before start time: Returns `403` with error
- ✅ After start time: Works normally
- ✅ Error message: *"nextday deliveries are available from 08:00"*

---

### Test Case 4: Disable Delivery Type

**Steps**:
1. Set `instantDeliveryRestrictions.enabled` to `false`
2. Try to estimate cost for instant delivery
3. Try to create an instant delivery order

**Expected Results**:
- ✅ Both requests return `403`
- ✅ Error message: *"instant deliveries are currently disabled"*

---

### Test Case 5: Multiple Restrictions (Start + Cutoff)

**Steps**:
1. Set `sameDayDeliveryRestrictions.dailyStart` to "08:00"
2. Set `sameDayDeliveryRestrictions.dailyCutoff` to "18:00"
3. Test at different times:
   - 7:00 AM (before start)
   - 10:00 AM (within window)
   - 7:00 PM (after cutoff)

**Expected Results**:
- ✅ 7:00 AM: Error - *"sameday deliveries are available from 08:00"*
- ✅ 10:00 AM: Works ✅
- ✅ 7:00 PM: Error - *"sameday deliveries are not available after 18:00. Please try again tomorrow."*

---

### Test Case 6: Remove Restrictions

**Steps**:
1. Set all restriction fields to `null` and `enabled` to `true`
2. Verify delivery type works normally

**Configuration**:
```json
{
  "instantDeliveryRestrictions": {
    "enabled": true,
    "pauseUntil": null,
    "dailyCutoff": null,
    "dailyStart": null
  }
}
```

**Expected Results**:
- ✅ Delivery type works normally
- ✅ No restrictions applied

---

## Error Response Format

All restriction errors follow this format:

```json
{
  "success": false,
  "error": "Error message describing why delivery type is unavailable",
  "code": "DELIVERY_TYPE_UNAVAILABLE"
}
```

**HTTP Status Code**: `403 Forbidden`

---

## User-Facing Error Messages

The following error messages are returned to users:

| Scenario | Error Message |
|----------|---------------|
| Delivery type disabled | `"{orderType} deliveries are currently disabled"` |
| Temporary pause active | `"{orderType} deliveries are paused for {X} more hour(s)"` |
| After daily cutoff | `"{orderType} deliveries are not available after {HH:mm}. Please try again tomorrow."` |
| Before daily start | `"{orderType} deliveries are available from {HH:mm}"` |

---

## Time Format Guidelines

### ISO Timestamp (for `pauseUntil`)
- Format: `YYYY-MM-DDTHH:mm:ssZ` (UTC)
- Example: `"2025-10-30T16:00:00Z"`
- Always use UTC timezone (Z suffix)
- Convert local time to UTC before setting

**JavaScript Example**:
```javascript
// Pause for 2 hours from now
const pauseUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
const isoString = pauseUntil.toISOString(); // "2025-10-30T16:00:00Z"
```

### Time String (for `dailyCutoff` and `dailyStart`)
- Format: `HH:mm` (24-hour format)
- Example: `"12:00"`, `"18:30"`, `"08:00"`
- Uses server's local timezone
- No AM/PM, always 24-hour format

---

## Important Notes

1. **Timezone**: 
   - `pauseUntil` uses UTC (ISO format)
   - `dailyCutoff` and `dailyStart` use server's local timezone

2. **Daily Reset**: 
   - `dailyCutoff` and `dailyStart` reset at midnight
   - `pauseUntil` is absolute (doesn't reset daily)

3. **Priority**: 
   - If `enabled: false`, all other restrictions are ignored
   - `pauseUntil` takes precedence over daily restrictions
   - Daily restrictions (`dailyCutoff`, `dailyStart`) are checked after pause

4. **Order of Checks**:
   1. Check if `enabled === false` → Block
   2. Check if `pauseUntil` is in future → Block
   3. Check if current time is after `dailyCutoff` → Block
   4. Check if current time is before `dailyStart` → Block
   5. Otherwise → Allow

5. **Fail-Safe**: 
   - If settings are missing or invalid, delivery type is **allowed** (fail-open)
   - This prevents accidental blocking if settings are misconfigured

---

## Frontend Integration Points

### 1. Estimate Cost Endpoint

**Endpoint**: `POST /api/orders/estimate-cost`

**Error Handling**:
```javascript
try {
  const response = await fetch('/api/orders/estimate-cost', {
    method: 'POST',
    body: JSON.stringify({ pickup, dropOffs, orderType: 'instant' })
  });
  
  if (response.status === 403) {
    const error = await response.json();
    if (error.code === 'DELIVERY_TYPE_UNAVAILABLE') {
      // Show error message to user
      showError(error.error);
      // Optionally disable the delivery type option in UI
    }
  }
} catch (error) {
  // Handle other errors
}
```

### 2. Create Order Endpoint

**Endpoint**: `POST /api/orders`

**Error Handling**:
```javascript
try {
  const response = await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
  
  if (response.status === 403) {
    const error = await response.json();
    if (error.code === 'DELIVERY_TYPE_UNAVAILABLE') {
      // Show error message to user
      showError(error.error);
      // Redirect to order type selection or show alternative options
    }
  }
} catch (error) {
  // Handle other errors
}
```

### 3. UI Recommendations

- **Disable unavailable delivery types** in the order type selector
- **Show tooltips** explaining why a delivery type is unavailable
- **Display countdown** for temporary pauses (if `pauseUntil` is set)
- **Show availability window** for daily restrictions (e.g., "Available 8:00 AM - 6:00 PM")

---

## Testing Checklist

- [ ] Test pause functionality (temporary pause)
- [ ] Test daily cutoff (stop after time)
- [ ] Test daily start (start from time)
- [ ] Test complete disable (`enabled: false`)
- [ ] Test combination of restrictions
- [ ] Test removal of restrictions (set to `null`)
- [ ] Test error messages are user-friendly
- [ ] Test that restrictions apply to both estimate and create endpoints
- [ ] Test timezone handling (UTC for pauseUntil, local for daily times)
- [ ] Test daily reset at midnight

---

## Troubleshooting

### Issue: Restrictions not working

**Check**:
1. Setting key is correct (case-sensitive)
2. Setting value is valid JSON object
3. Server timezone is correct
4. `pauseUntil` is in UTC format

### Issue: Wrong timezone

**Solution**: 
- `pauseUntil` must be in UTC (ISO format with Z)
- `dailyCutoff` and `dailyStart` use server's local timezone
- Verify server timezone matches your expectations

### Issue: Restrictions persist after removal

**Solution**: 
- Set fields to `null` explicitly (not empty string)
- Verify setting was saved correctly via GET endpoint

---

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify setting values via GET endpoint
3. Test with different time values
4. Ensure server time is correct

---

## Quick Reference

| Setting Key | Controls | Example Value |
|-------------|----------|----------------|
| `instantDeliveryRestrictions` | Instant deliveries | `{"enabled": true, "pauseUntil": null, "dailyCutoff": "12:00", "dailyStart": "08:00"}` |
| `sameDayDeliveryRestrictions` | Same-day deliveries | `{"enabled": true, "pauseUntil": "2025-10-30T16:00:00Z", "dailyCutoff": null, "dailyStart": null}` |
| `nextDayDeliveryRestrictions` | Next-day deliveries | `{"enabled": false, "pauseUntil": null, "dailyCutoff": null, "dailyStart": null}` |

---

**Last Updated**: October 30, 2025

