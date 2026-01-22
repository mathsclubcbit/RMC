# Vercel Deployment & Setup

Your backend implementation is now fully integrated into Next.js. You can deploy to Vercel without a separate server.

## 1. Environment Variables

In your Vercel Project Settings > Environment Variables, add the following:

| Variable Name | Value |
| :--- | :--- |
| `GOOGLE_SHEET_ID` | Your Google Sheet ID |
| `GOOGLE_DRIVE_FOLDER_ID` | Your Google Drive Folder ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | **Paste the entire content** of your `service-account.json` file here. |
| `EMAIL_USER` | Your Gmail Address (e.g., `you@gmail.com`) |
| `EMAIL_PASS` | Your Gmail App Password (NOT your login password) |

> [!TIP]
> **Locally**, you can add these to a `.env.local` file in your root directory to test before deploying.

## 2. Google & Email Setup

### Google Cloud (Sheets & Drive)
1.  Share your Sheet and Drive Folder with the service account email.
2.  **Add Headers to your Sheet:**
    Open `Sheet1` and paste these headers in the first row (A1 to N1):
    `Timestamp`, `Registration ID`, `Event ID`, `Event Name`, `Name`, `Email`, `Roll No`, `Department`, `UTR ID`, `Amount`, `Drive File ID`, `View Link`, `Download Link`, `Status`

### Gmail SMTP (Email Verification)
1.  Go to your **Google Account Settings**.
2.  Search for **"App Passwords"** (You must have 2-Factor Authentication enabled).
3.  Create a new App Password named "RMC Website".
4.  Copy the 16-character password and use it as `EMAIL_PASS`.

## 3. Testing Locally

1.  Create `.env.local` in `d:\RMC\Main\` with the variables above.
2.  Run `npm run dev`.
3.  Send a POST request to `http://localhost:3000/api/register`.

## 3. Example Fetch Code

Use this function in your frontend to submit data:

```javascript
const registerForEvent = async (formDataObject, fileObject) => {
  const formData = new FormData();

  // New Fields
  formData.append('eventId', formDataObject.eventId);     // Hidden field
  formData.append('eventName', formDataObject.eventName); // Hidden field
  formData.append('amount', formDataObject.amount);       // Hidden field
  
  formData.append('name', formDataObject.name);
  formData.append('email', formDataObject.email);
  formData.append('rollNo', formDataObject.rollNo);
  formData.append('department', formDataObject.department);
  formData.append('utrId', formDataObject.utrId);
  
  // Attach file
  formData.append('screenshot', fileObject);

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
        if (response.status === 409) {
            alert("Duplicate UTR! This ID has already been used.");
        } else {
            alert(`Error: ${result.error}`);
        }
        return;
    }

    console.log('Success:', result);
    return result;
  } catch (error) {
    console.error('Submission error:', error);
  }
};
  }
};
```

## 4. Troubleshooting

### Error: "Google Sheets API has not been used in project..."
This means you haven't enabled the APIs in your Google Cloud Console yet.
1.  **Enable Sheets API**: [Click here](https://console.developers.google.com/apis/api/sheets.googleapis.com/overview) -> Select your project -> Click **Enable**.
2.  **Enable Drive API**: [Click here](https://console.developers.google.com/apis/api/drive.googleapis.com/overview) -> Select your project -> Click **Enable**.
3.  Wait 1-2 minutes for changes to propagate.

### Error: "Access blocked: App has not completed the Google verification process"
This happens because your app is in **Testing** mode.
1.  Go to [Google Cloud Console > OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent).
2.  Scroll down to **Test users**.
3.  Click **+ ADD USERS**.
4.  Enter your email address (e.g., `vishnuvardhan2431s@gmail.com`).
5.  Click **Save**.

