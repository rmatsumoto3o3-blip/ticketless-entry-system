# GAS Deployment Guide

## 1. Google Sheets Setup

### Create the Spreadsheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: **"Ticketless Entry System"**

### Add Sample Data (Optional)
The script will auto-create the "Attendees" sheet with headers when first run. You can add sample data:

| ID | Name | Email | Token | CheckInTime | EmailSent |
|----|------|-------|-------|-------------|-----------|
| M001 | 山田太郎 | yamada@example.com | | | |
| M002 | 佐藤花子 | sato@example.com | | | |

> [!NOTE]
> Leave `Token`, `CheckInTime`, and `EmailSent` columns empty. They will be populated automatically.

---

## 2. Google Apps Script Setup

### Open Apps Script Editor
1. In your Google Sheet, click **Extensions** > **Apps Script**
2. Delete any default code in `Code.gs`
3. Copy the entire contents of [`Code.gs`](file:///Users/nexpure/Desktop/member-qr-system/gas/Code.gs)
4. Paste into the Apps Script editor
5. Click **Save** (💾 icon)
6. Name the project: **"Ticketless Entry Backend"**

---

## 3. Deploy as Web App

### Deploy Steps
1. Click **Deploy** > **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: `v1.0 - Initial deployment`
   - **Execute as**: **Me** (your account)
   - **Who has access**: **Anyone** (required for Next.js to call the API)
5. Click **Deploy**

### Authorization
1. Click **Authorize access**
2. Choose your Google account
3. Click **Advanced** > **Go to Ticketless Entry Backend (unsafe)**
4. Click **Allow**

> [!WARNING]
> The "unsafe" warning is normal for personal scripts. This is your own script.

### Copy the Web App URL
After deployment, you'll see a URL like:
```
https://script.google.com/macros/s/AKfycbz.../exec
```

**Copy this URL** - you'll need it for the Next.js app configuration.

---

## 4. Test the Backend

### Test QR Generation and Email Sending

1. In the Apps Script editor, select the function dropdown (next to Debug)
2. Choose `sendTickets`
3. Click **Run** (▶️ icon)
4. Check the **Execution log** (View > Logs)
5. Verify:
   - Tokens are generated in the `Token` column
   - `EmailSent` is set to `TRUE`
   - Check your email inbox for the QR code

> [!TIP]
> For testing, use your own email address in the sample data to avoid sending emails to others.

### Test Check-in API

1. Open the Web App URL in your browser:
   ```
   https://script.google.com/macros/s/YOUR_ID/exec?action=dashboard
   ```
2. You should see JSON response:
   ```json
   {
     "total": 2,
     "checkedIn": 0,
     "notCheckedIn": 2
   }
   ```

3. Test check-in with a token:
   ```
   https://script.google.com/macros/s/YOUR_ID/exec?action=checkIn&token=YOUR_TOKEN
   ```

---

## 5. Update Next.js Configuration

1. In your Next.js project, create `.env.local`:
   ```bash
   NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

2. Replace `YOUR_DEPLOYMENT_ID` with your actual deployment ID

---

## 6. Redeploy After Changes

If you modify the GAS code:

1. Click **Deploy** > **Manage deployments**
2. Click the edit icon (✏️) next to your deployment
3. Update the version description
4. Click **Deploy**

> [!IMPORTANT]
> The Web App URL remains the same, so you don't need to update Next.js config.

---

## Troubleshooting

### Emails Not Sending
- Check Gmail quota: Free accounts can send ~100 emails/day
- Verify email addresses are valid
- Check spam folder

### "Authorization Required" Error
- Re-run the authorization flow in Apps Script
- Ensure you granted all permissions

### API Returns Empty Response
- Check the Web App deployment settings
- Ensure "Who has access" is set to "Anyone"
- Try accessing the URL directly in a browser

### Token Not Found
- Verify the token was generated (check the `Token` column)
- Ensure you're using the exact token string (case-sensitive)
