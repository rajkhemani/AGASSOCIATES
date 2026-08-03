# One-Click SMS Forwarder Setup

## Step 1 — Install the app

On the dedicated phone, install **SMS Forwarder**:
- [Play Store](https://play.google.com/store/apps/details?id=com.iam.smsforwarder)
- Or search "SMS Forwarder" by Kelp Apps

## Step 2 — Add forwarding rule

Open the app → **Add Rule** → configure:

| Setting | Value |
|---------|-------|
| **Action** | POST |
| **URL** | `https://api.advadiityagade.com/api/sms/ingest` |
| **Format** | `{{fromNumber}}%%{{messageBody}}` |
| **Content-Type** | `application/json` |
| **Sender filter** | *(leave blank — forward all SMS)* |

Click **Save** and enable the rule.

## Step 3 — Test it

Send an SMS to the SIM in the phone. Within seconds it will appear in the NOI Telegram group.

## Step 4 — NOI group activation

1. Add `@ag_associates_bot` to the NOI Telegram group
2. Make the bot an **admin** (so it can read messages)
3. Send `/autootp` in the group — bot replies "✅ Auto-OTP on! All OTPs forwarded to this group."

Done. Every SMS from that SIM will now auto-forward to the NOI Telegram group.
