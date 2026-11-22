import { Resend } from 'resend';
import { generateStyledQRCode } from './qrcode';


export const getRecruitmentEmailFooter = (themeColor: string = '#2dd4bf') => {
    const year = new Date().getFullYear();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rmccbit.in';
    const whatsappLink = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_LINK;

    return `
        <!-- Footer -->
        <tr>
            <td style="padding: 30px 40px; text-align: center; border-top: 1px solid rgba(45, 212, 191, 0.1); background: #000000;">
                
                ${whatsappLink ? `
                <div style="margin: 0 auto 30px; padding: 20px; border: 1px dashed rgba(255,255,255,0.15); border-radius: 8px; background: rgba(255,255,255,0.02); max-width: 400px;">
                    <p style="margin: 0 0 15px; color: #a1a1aa; font-size: 13px; font-family: monospace;">
                        If you haven't joined yet, please join our official WhatsApp group for updates.
                    </p>
                    <a href="${whatsappLink}" target="_blank" style="display: inline-block; padding: 12px 24px; background: #ffffff; color: #25D366; text-decoration: none; font-family: sans-serif; font-weight: bold; border-radius: 4px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                        Join WhatsApp Group
                    </a>
                </div>
                ` : ''}

                <!-- Social Links -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 25px;">
                    <tr>
                        <td style="padding: 0 15px;">
                            <a href="${siteUrl}" target="_blank" style="text-decoration: none; color: #a1a1aa; font-family: monospace; font-size: 14px;">
                                Website
                            </a>
                        </td>
                        <td style="padding: 0 15px;">
                            <a href="https://www.linkedin.com/company/ramanujan-maths-club/" target="_blank" style="text-decoration: none; color: #a1a1aa; font-family: monospace; font-size: 14px;">
                                LinkedIn
                            </a>
                        </td>
                        <td style="padding: 0 15px;">
                            <a href="https://instagram.com/rmc.cbit" target="_blank" style="text-decoration: none; color: #a1a1aa; font-family: monospace; font-size: 14px;">
                                Instagram
                            </a>
                        </td>
                    </tr>
                </table>

                <p style="margin: 0; color: #52525b; font-size: 12px; letter-spacing: 1px;">
                    CALCULATING... SUCCESS.
                </p>
                <p style="margin: 10px 0 0; color: #3f3f46; font-size: 11px;">
                    Ramanujan Mathematical Club &copy; ${year} | CBIT
                </p>
                <p style="margin: 15px 0 0; color: ${themeColor}; font-size: 14px; text-decoration: none;">
                    &nabla; &Delta; &Pi; &Phi;
                </p>
            </td>
        </tr>
    `;
};
export const getEmailFooter = (themeColor: string = '#2dd4bf') => {
    const year = new Date().getFullYear();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rmccbit.in';

    return `
        <!-- Footer -->
        <tr>
            <td style="padding: 30px 40px; text-align: center; border-top: 1px solid rgba(45, 212, 191, 0.1); background: #000000;">
                
                <!-- Social Links -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 25px;">
                    <tr>
                        <td style="padding: 0 15px;">
                            <a href="${siteUrl}" target="_blank" style="text-decoration: none; color: #a1a1aa; font-family: monospace; font-size: 14px;">
                                Website
                            </a>
                        </td>
                        <td style="padding: 0 15px;">
                            <a href="https://www.linkedin.com/company/ramanujan-maths-club/" target="_blank" style="text-decoration: none; color: #a1a1aa; font-family: monospace; font-size: 14px;">
                                LinkedIn
                            </a>
                        </td>
                        <td style="padding: 0 15px;">
                            <a href="https://instagram.com/rmc.cbit" target="_blank" style="text-decoration: none; color: #a1a1aa; font-family: monospace; font-size: 14px;">
                                Instagram
                            </a>
                        </td>
                    </tr>
                </table>

                <p style="margin: 0; color: #52525b; font-size: 12px; letter-spacing: 1px;">
                    CALCULATING... SUCCESS.
                </p>
                <p style="margin: 10px 0 0; color: #3f3f46; font-size: 11px;">
                    Ramanujan Mathematical Club &copy; ${year} | CBIT
                </p>
                <p style="margin: 15px 0 0; color: ${themeColor}; font-size: 14px; text-decoration: none;">
                    &nabla; &Delta; &Pi; &Phi;
                </p>
            </td>
        </tr>
    `;
};

/**
 * Resend Client
 */
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'RMC <noreply@rmccbit.in>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'mathsclub.cbit@gmail.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rmccbit.in';
const logoUrl = `${SITE_URL}/full%20logo.png`;

/**
 * Ticket Email Data Interface
 */
interface TicketEmailData {
    toEmail: string;
    participantName: string;
    eventName: string;
    eventDate: string;
    eventTime: string;
    eventVenue: string;
    registrationId: string;
    department?: string;
    rollNo?: string;
    phone?: string;
    timeSlot?: string;
}

/**
 * Generate beautiful HTML email template for ticket
 */
const generateTicketEmailHTML = (data: TicketEmailData, qrCodeDataUrl: string): string => {

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

</head>
<body style="margin: 0; padding: 0; font-family: 'Cormorant Garamond', serif; background-color: #000000; color: #ffffff;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
        <tr>
            <td style="padding: 60px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; border: 1px solid rgba(45, 212, 191, 0.2); background: #050505; border-radius: 4px; box-shadow: 0 0 50px rgba(45, 212, 191, 0.1);">
                    
                    <!-- Top Symbol Decor -->
                    <tr>
                        <td style="padding: 30px 0 0; text-align: center;">
                            <img src="${logoUrl}" alt="RMC Logo" style="height: 50px; width: auto; display: inline-block;" />
                        </td>
                    </tr>

                    <!-- Logo / Header -->
                    <tr>
                        <td style="padding: 20px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #2dd4bf; font-size: 38px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase;">
                                RMC <span style="font-weight: 600;">Events</span>
                            </h1>
                            <div style="width: 60px; height: 1px; background: #2dd4bf; margin: 15px auto;"></div>
                        </td>
                    </tr>

                    <!-- Hero Message -->
                    <tr>
                        <td style="padding: 20px 40px; text-align: center;">
                            <p style="margin: 0; color: #a1a1aa; font-size: 16px; font-style: italic; letter-spacing: 1px;">
                                "Journey to Infinity."
                            </p>
                            <h2 style="margin: 20px 0 0; color: #ffffff; font-size: 24px; font-weight: 400; letter-spacing: 1px;">
                                Your Registration is Confirmed, ${data.participantName}!
                            </h2>
                        </td>
                    </tr>

                    <!-- Ticket Card (Glassmorphism Simulation) -->
                    <tr>
                        <td style="padding: 30px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid rgba(45, 212, 191, 0.4); background: linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(0, 0, 0, 0.8) 100%); border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 0;">
                                        <!-- QR Section -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 40px; text-align: center;">
                                                    <div style="display: inline-block; padding: 10px; border: 1px solid #2dd4bf; box-shadow: 0 0 20px rgba(45, 212, 191, 0.4); background: #ffffff;">
                                                        <img src="${qrCodeDataUrl}" alt="Access QR" style="display: block; width: 180px; height: 180px;" />
                                                    </div>
                                                    <p style="margin: 20px 0 0; color: #2dd4bf; font-size: 12px; letter-spacing: 3px; font-weight: 600;">
                                                        ACCESS CODE: <span style="color: #ffffff;">${data.registrationId}</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Event Details -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top: 1px solid rgba(45, 212, 191, 0.2);">
                                            <tr>
                                                <td style="padding: 30px; background: rgba(0,0,0,0.5);">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                        <tr>
                                                            <td style="padding-bottom: 20px;">
                                                                <span style="color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Event</span><br>
                                                                <span style="color: #ffffff; font-size: 18px;">${data.eventName}</span>
                                                            </td>
                                                        </tr>
                                                        ${data.timeSlot ? `
                                                        <tr>
                                                            <td style="padding-bottom: 20px;">
                                                                <span style="color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Selected Slot</span><br>
                                                                <span style="color: #2dd4bf; font-size: 16px;">${data.timeSlot}</span>
                                                            </td>
                                                        </tr>` : ''}
                                                        <tr>
                                                            <td width="50%" style="padding-bottom: 20px;">
                                                                <span style="color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Date & Time</span><br>
                                                                <span style="color: #2dd4bf; font-size: 16px;">${data.eventDate} | ${data.eventTime}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <span style="color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Venue</span><br>
                                                                <span style="color: #ffffff; font-size: 15px;">${data.eventVenue}</span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Mathematical Notes -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-left: 2px solid #2dd4bf; padding-left: 20px;">
                                <tr>
                                    <td>
                                        <h3 style="margin: 0 0 10px; color: #2dd4bf; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Protocol</h3>
                                        <ul style="margin: 0; padding: 0; list-style: none; color: #71717a; font-size: 13px; line-height: 1.8;">
                                            <li>• Present this fractal signature at the gate for entry.</li>
                                            <li>• Arrival timestamp: T-15 minutes prior to commencement.</li>
                                            <li>• This sequence is unique and allows singular admission.</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    ${getEmailFooter()}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

/**
 * Send ticket email with QR code to participant
 */
export const sendTicketEmail = async (data: TicketEmailData): Promise<boolean> => {
    if (!process.env.RESEND_API_KEY) {
        console.warn("Skipping ticket email: RESEND_API_KEY not set.");
        return false;
    }

    try {
        // For Resend, embed QR as base64 data URL directly in the img src
        const qrCodeDataUrl = await generateStyledQRCode(data.registrationId, {
            darkColor: '#000000',
            lightColor: '#FFFFFF'
        });

        const htmlContent = generateTicketEmailHTML(data, qrCodeDataUrl);

        await resend.emails.send({
            from: EMAIL_FROM,
            to: data.toEmail,
            subject: `[SECRET SEQUENCE] Your Entrance for ${data.eventName}`,
            text: `Your Registration is Confirmed, ${data.participantName}!\n\nEvent: ${data.eventName}\nDate: ${data.eventDate}\nTime: ${data.eventTime}\nVenue: ${data.eventVenue}\nAccess Code: ${data.registrationId}\n\nPresent this code at the gate for entry.`,
            html: htmlContent,
        });

        return true;
    } catch (error) {
        console.error("Error sending ticket email:", error);
        return false;
    }
};

/**
 * Send a verification email to the participant (original function)
 */
export const sendVerificationEmail = async (
    toEmail: string,
    name: string,
    eventName: string,
    registrationId: string
) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn("Skipping email: RESEND_API_KEY not set.");
        return;
    }

    const mailOptions = {
        to: toEmail,
        subject: `Verification Pending: ${eventName}`,
        text: `Greetings, ${name}. Your request to join ${eventName} has been logged.\nRegistration ID: ${registrationId}\nStatus: PENDING VERIFICATION\n\nOur team is currently verifying your details.`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

</head>
<body style="margin: 0; padding: 0; font-family: 'Cormorant Garamond', serif; background-color: #000000; color: #ffffff;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
        <tr>
            <td style="padding: 60px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; border: 1px solid rgba(45, 212, 191, 0.2); background: #050505; border-radius: 4px; box-shadow: 0 0 50px rgba(45, 212, 191, 0.05);">
                    <tr>
                        <td style="padding: 40px; text-align: center;">
                            <img src="${logoUrl}" alt="RMC Logo" style="height: 50px; width: auto; display: inline-block; margin-bottom: 20px;" />
                            <h1 style="margin: 0; color: #2dd4bf; font-size: 32px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase;">
                                Verification <span style="font-weight: 600;">Initiated</span>
                            </h1>
                            <div style="width: 40px; height: 1px; background: #2dd4bf; margin: 20px auto;"></div>
                            <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                                Greetings, ${name}. Your request to join <strong>${eventName}</strong> has been logged in our systems.
                            </p>
                            
                            <div style="margin: 30px 0; padding: 20px; background: rgba(45, 212, 191, 0.05); border: 1px solid rgba(45, 212, 191, 0.2); border-radius: 8px;">
                                <p style="margin: 0; color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Registration ID</p>
                                <p style="margin: 5px 0 0; color: #2dd4bf; font-size: 20px; font-family: monospace;">${registrationId}</p>
                                <p style="margin: 15px 0 0; color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Status</p>
                                <p style="margin: 5px 0 0; color: #ffffff; font-size: 16px;">PENDING VERIFICATION</p>
                            </div>

                            <p style="color: #71717a; font-size: 14px; font-style: italic;">
                                Our team is currently verifying your details. You will receive the final confirmation shortly.
                            </p>
                        </td>
                    </tr>
                    ${getEmailFooter()}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
    };

    try {
        await resend.emails.send({
            from: EMAIL_FROM,
            to: toEmail,
            subject: `Verification Pending: ${eventName}`,
            text: `Greetings, ${name}. Your request to join ${eventName} has been logged.\nRegistration ID: ${registrationId}\nStatus: PENDING VERIFICATION\n\nOur team is currently verifying your details.`,
            html: mailOptions.html as string,
        });
    } catch (error) {
        console.error("Error sending email:", error);
    }
};



interface RecruitmentAdminAlertData {
    name: string;
    email: string;
    rollNumber: string;
    branch: string;
    year: string;
    applicationId: string;
}

/**
 * Alert the admin when a new application is submitted
 */
export const sendRecruitmentAdminAlert = async (data: RecruitmentAdminAlertData): Promise<boolean> => {
    if (!process.env.RESEND_API_KEY) return false;

    const shortId = data.applicationId.slice(0, 8).toUpperCase();
    const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rmc.cbit.ac.in'}/admin/recruitment`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#000;color:#fff;font-family:monospace;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#000;">
    <tr><td style="padding:40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560"
        style="margin:0 auto;border:1px solid rgba(99,102,241,0.3);background:#050510;border-radius:4px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 4px;color:#6366f1;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Admin Alert — New Application</p>
          <h2 style="margin:0 0 24px;color:#fff;font-size:20px;">📩 New Recruitment Submission</h2>

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="border:1px solid rgba(99,102,241,0.2);background:rgba(99,102,241,0.04);border-radius:6px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 8px;"><span style="color:#71717a;font-size:11px;">NAME</span><br><span style="color:#fff;font-size:15px;">${data.name}</span></p>
              <p style="margin:0 0 8px;"><span style="color:#71717a;font-size:11px;">EMAIL</span><br><span style="color:#a5b4fc;font-size:14px;">${data.email}</span></p>
              <p style="margin:0 0 8px;"><span style="color:#71717a;font-size:11px;">ROLL NO.</span><br><span style="color:#fff;font-size:14px;">${data.rollNumber}</span></p>
              <p style="margin:0 0 8px;"><span style="color:#71717a;font-size:11px;">BRANCH</span><br><span style="color:#fff;font-size:14px;">${data.branch}</span></p>
              <p style="margin:0;"><span style="color:#71717a;font-size:11px;">YEAR</span><br><span style="color:#fff;font-size:14px;">Year ${data.year}</span></p>
            </td></tr>
          </table>

          <p style="margin:0 0 16px;color:#71717a;font-size:12px;">Application ID: <span style="color:#6366f1;">#${shortId}</span></p>
          <a href="${adminUrl}" style="display:inline-block;padding:10px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-family:monospace;letter-spacing:1px;">
            Review in Admin Panel →
          </a>
        </td></tr>
        ${getRecruitmentEmailFooter('#6366f1')}
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
        await resend.emails.send({
            from: EMAIL_FROM,
            to: process.env.EMAIL_REPLY_TO || REPLY_TO,
            subject: `[RMC] New Membership Application — ${data.name} (#${shortId})`,
            text: `New Recruitment Submission\nName: ${data.name}\nEmail: ${data.email}\nRoll No: ${data.rollNumber}\nBranch: ${data.branch}\nYear: ${data.year}\nApplication ID: #${shortId}`,
            html,
        });
        return true;
    } catch (err) {
        console.error('[sendRecruitmentAdminAlert] Error:', err);
        return false;
    }
};

// ============================================================
// NEWSLETTER EMAIL
// ============================================================

/**
 * Send Welcome Email to new Newsletter Subscriber
 */
export const sendWelcomeEmail = async (toEmail: string, name: string = "Member") => {
    if (!process.env.RESEND_API_KEY) {
        console.warn("Skipping welcome email: RESEND_API_KEY missing");
        return;
    }

    const mailOptions = {
        to: toEmail,
        subject: `Welcome to Ramanujan Math Club Updates`,
        text: `Welcome to the community, ${name}.\n\nYou have successfully subscribed to the Ramanujan Math Club newsletter. You will now receive updates regarding upcoming events, challenges, and club activities.\n\nThank you for joining us.`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

</head>
<body style="margin: 0; padding: 0; font-family: 'Cormorant Garamond', serif; background-color: #000000; color: #ffffff;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
        <tr>
            <td style="padding: 60px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; border: 1px solid rgba(45, 212, 191, 0.2); background: #050505; border-radius: 4px; box-shadow: 0 0 50px rgba(45, 212, 191, 0.05);">
                    <tr>
                        <td style="padding: 40px; text-align: center;">
                             <img src="${logoUrl}" alt="RMC Logo" style="height: 50px; width: auto; display: inline-block; margin-bottom: 20px;" />
                             <p style="margin: 0; color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 3px;">RMC Updates</p>
                            <h1 style="margin: 20px 0 0; color: #2dd4bf; font-size: 32px; font-weight: 300; letter-spacing: 2px;">
                                Subscription <span style="font-weight: 600;">Confirmed</span>
                            </h1>
                            <div style="width: 40px; height: 1px; background: #2dd4bf; margin: 30px auto;"></div>
                            
                            <p style="color: #d4d4d8; font-size: 18px; line-height: 1.6; font-style: italic;">
                                "Welcome to the community, ${name}."
                            </p>
                            
                            <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                                You have successfully subscribed to the Ramanujan Math Club newsletter. You will now receive updates regarding upcoming events, challenges, and club activities.
                            </p>

                            <div style="margin: 40px 0; padding: 20px; border: 1px solid rgba(45, 212, 191, 0.2); background: rgba(45, 212, 191, 0.05);">
                                <p style="margin: 0; color: #2dd4bf; font-size: 14px; letter-spacing: 2px;">STATUS: SUBSCRIBED</p>
                            </div>

                             <p style="margin: 0; color: #3f3f46; font-size: 12px;">
                                Thank you for joining us.
                            </p>
                        </td>
                    </tr>
                    ${getEmailFooter()}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    try {
        await resend.emails.send({
            from: EMAIL_FROM,
            to: toEmail,
            subject: `Welcome to Ramanujan Math Club Updates`,
            text: `Welcome to the community, ${name}.\n\nYou have successfully subscribed to the Ramanujan Math Club newsletter. You will now receive updates regarding upcoming events, challenges, and club activities.\n\nThank you for joining us.`,
            html: mailOptions.html as string,
        });
        console.log(`Welcome email sent to ${toEmail}`);
    } catch (error) {
        console.error("Error sending welcome email:", error);
    }
};

// ============================================
// Recruitment Emails
// ============================================

interface RecruitmentConfirmationData {
    toEmail: string;
    name: string;
    applicationId: string;
}

/**
 * Sent to the applicant immediately after they submit their application.
 */
export const sendRecruitmentConfirmation = async (data: RecruitmentConfirmationData): Promise<boolean> => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('Skipping recruitment confirmation email: RESEND_API_KEY missing');
        return false;
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

</head>
<body style="margin:0;padding:0;font-family:'Cormorant Garamond',serif;background:#000;color:#fff;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#000;">
        <tr><td style="padding:60px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
                style="margin:0 auto;border:1px solid rgba(58,188,179,0.2);background:#050505;border-radius:4px;box-shadow:0 0 50px rgba(58,188,179,0.08);">

                <!-- Math symbols -->
                <tr><td style="padding:30px 0 0;text-align:center;">
                    <img src="${logoUrl}" alt="RMC Logo" style="height: 50px; width: auto; display: inline-block;" />
                </td></tr>

                <!-- Header -->
                <tr><td style="padding:24px 40px;text-align:center;">
                    <h1 style="margin:0;color:#3ABCB3;font-size:36px;font-weight:300;letter-spacing:4px;text-transform:uppercase;">
                        RMC <span style="font-weight:600;">Recruitment</span>
                    </h1>
                    <div style="width:60px;height:1px;background:#3ABCB3;margin:16px auto;"></div>
                </td></tr>

                <!-- Hero -->
                <tr><td style="padding:10px 40px 30px;text-align:center;">
                    <p style="margin:0;color:#a1a1aa;font-size:15px;font-style:italic;letter-spacing:1px;">
                        "The beginning of a sequence."
                    </p>
                    <h2 style="margin:18px 0 0;color:#fff;font-size:22px;font-weight:400;">
                        Transmission received, ${data.name}.
                    </h2>
                    <p style="margin:10px 0 0;color:#71717a;font-size:14px;line-height:1.7;">
                        Your application to join the Ramanujan Math Club has been logged.
                        The council will review your submission and you will be notified of the decision.
                    </p>
                </td></tr>

                <!-- Application ID card -->
                <tr><td style="padding:0 40px 40px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                        style="border:1px solid rgba(58,188,179,0.3);background:linear-gradient(135deg,rgba(6,78,59,0.3),rgba(0,0,0,0.8));border-radius:10px;">
                        <tr><td style="padding:30px;text-align:center;">
                            <p style="margin:0;color:#52525b;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Application Reference</p>
                            <p style="margin:8px 0 0;color:#3ABCB3;font-size:16px;font-family:monospace;letter-spacing:2px;">${data.applicationId.toUpperCase().slice(0, 8)}</p>
                            <div style="width:40px;height:1px;background:rgba(58,188,179,0.2);margin:16px auto;"></div>
                            <p style="margin:0;color:#52525b;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Status</p>
                            <p style="margin:8px 0 0;color:#fff;font-size:15px;">PENDING REVIEW</p>
                        </td></tr>
                    </table>
                </td></tr>

                <!-- Next steps -->
                <tr><td style="padding:0 40px 40px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                        style="border-left:2px solid #3ABCB3;padding-left:20px;">
                        <tr><td>
                            <h3 style="margin:0 0 10px;color:#3ABCB3;font-size:13px;text-transform:uppercase;letter-spacing:2px;">What happens next?</h3>
                            <ul style="margin:0;padding:0;list-style:none;color:#71717a;font-size:13px;line-height:1.9;">
                                <li>• The council reviews your application manually.</li>
                                <li>• You will receive an email once a decision is made.</li>
                                <li>• You can track your status at <span style="color:#3ABCB3;">rmccbit.in/join/status</span></li>
                            </ul>
                        </td></tr>
                    </table>
                </td></tr>

                ${getRecruitmentEmailFooter('#3ABCB3')}

            </table>
        </td></tr>
    </table>
</body>
</html>`;

    try {
        await resend.emails.send({
            from: EMAIL_FROM,
            to: data.toEmail,
            subject: `[RMC] Application Received — Your Journey Begins`,
            text: `Transmission received, ${data.name}.\n\nYour application to join the Ramanujan Math Club has been logged.\nApplication Reference: ${data.applicationId.toUpperCase().slice(0, 8)}\nStatus: PENDING REVIEW\n\nThe council will review your submission and you will be notified of the decision.`,
            html,
        });
        return true;
    } catch (err) {
        console.error('sendRecruitmentConfirmation error:', err);
        return false;
    }
};
interface RecruitmentDecisionData {
    toEmail: string;
    name: string;
    status: 'APPROVED' | 'REJECTED';
    note?: string;
}

/**
 * Sent to the applicant when their application is approved or rejected.
 */
export const sendRecruitmentDecision = async (data: RecruitmentDecisionData): Promise<boolean> => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('Skipping recruitment decision email: RESEND_API_KEY missing');
        return false;
    }

    const isApproved = data.status === 'APPROVED';

    const statusColor = isApproved ? '#3ABCB3' : '#E36951';
    const statusLabel = isApproved ? 'APPLICATION SELECTED' : 'UPDATE ON APPLICATION';
    const heading = isApproved
        ? `Welcome to the Club, ${data.name}!`
        : `Thank you for your interest, ${data.name}.`;
    const body = isApproved
        ? 'Congratulations! Your application stood out, and we are thrilled to welcome you as an official member of the Ramanujan Math Club at CBIT. We cannot wait to see the incredible ideas you will bring to the team.'
        : 'Thank you so much for taking the time to apply. We had a remarkably talented pool of applicants this year, and unfortunately, we are unable to offer you a spot at this time. Please do not be discouraged—we deeply appreciate your enthusiasm for math and encourage you to keep exploring, learning, and applying in our future cycles!';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Cormorant Garamond',serif;background:#000;color:#fff;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#000;">
        <tr><td style="padding:60px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
                style="margin:0 auto;border:1px solid rgba(58,188,179,0.15);background:#050505;border-radius:4px;">

                <tr><td style="padding:30px 0 0;text-align:center;">
                    <img src="${logoUrl}" alt="RMC Logo" style="height: 50px; width: auto; display: inline-block;" />
                </td></tr>

                <tr><td style="padding:24px 40px;text-align:center;">
                    <h1 style="margin:0;color:#3ABCB3;font-size:34px;font-weight:300;letter-spacing:4px;text-transform:uppercase;">
                        RMC <span style="font-weight:600;">Recruitment</span>
                    </h1>
                    <div style="width:60px;height:1px;background:#3ABCB3;margin:16px auto;"></div>
                </td></tr>

                <tr><td style="padding:10px 40px 30px;text-align:center;">
                    <div style="display:inline-block;padding:8px 24px;border:1px solid ${statusColor};background:${isApproved ? 'rgba(58,188,179,0.08)' : 'rgba(227,105,81,0.08)'};border-radius:4px;margin-bottom:20px;">
                        <span style="color:${statusColor};font-size:12px;font-family:monospace;letter-spacing:3px;">${statusLabel}</span>
                    </div>
                    <h2 style="margin:0;color:#fff;font-size:22px;font-weight:400;">${heading}</h2>
                    <p style="margin:12px 0 0;color:#71717a;font-size:14px;line-height:1.7;">${body}</p>
                </td></tr>

                                ${getRecruitmentEmailFooter('#3ABCB3')}

            </table>
        </td></tr>
    </table>
</body>
</html>`;

    const subjectText = isApproved
        ? `[RMC] Welcome to the Club — Application Approved!`
        : `[RMC] Update on your Application`;

    try {
        await resend.emails.send({
            from: EMAIL_FROM,
            to: data.toEmail,
            subject: subjectText,
            text: `${heading}\n\n${body}`,
            html,
        });
        return true;
    } catch (err) {
        console.error('sendRecruitmentDecision error:', err);
        return false;
    }
};

// ==========================================
// Recruitment Workflow Phase 2 Emails
// ==========================================

export const sendTaskEmail = async (data: {
    toEmail: string;
    name: string;
    applicationId: string;
    teamName: string;
    priority?: string | number;
    deadline?: string;
}) => {
    if (!process.env.RESEND_API_KEY) return false;

    const taskLink = `https://rmccbit.in/join/task/${data.applicationId}?team=${encodeURIComponent(data.teamName)}`;

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Cormorant Garamond',serif;background:#000;color:#fff;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#000;">
        <tr><td style="padding:60px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
                style="margin:0 auto;border:1px solid rgba(58,188,179,0.15);background:#050505;border-radius:4px;">
                <tr><td style="padding:30px 0 0;text-align:center;">
                    <img src="${logoUrl}" alt="RMC Logo" style="height: 50px; width: auto; display: inline-block;" />
                </td></tr>
                <tr><td style="padding:24px 40px;text-align:center;">
                    <h1 style="margin:0;color:#3ABCB3;font-size:30px;font-weight:300;letter-spacing:4px;text-transform:uppercase;">
                        RMC <span style="font-weight:600;">Recruitment</span>
                    </h1>
                    <div style="width:60px;height:1px;background:#3ABCB3;margin:16px auto;"></div>
                </td></tr>
                <tr><td style="padding:10px 40px 30px;text-align:center;">
                    <h2 style="margin:0;color:#fff;font-size:22px;font-weight:400;">Your Task Assignment: ${data.teamName}</h2>
                    <p style="margin:16px 0 0;color:#71717a;font-size:15px;line-height:1.7;">
                        Dear ${data.name},<br><br>
                        Congratulations on making it to the next phase of the recruitment process for the <strong>${data.teamName}</strong> team. 
                        We noticed you selected this team as your <strong>Priority ${data.priority || '1'}</strong> choice!<br><br>
                        Please click the button below to view and submit your task assignment.
                    </p>
                    ${data.deadline ? `
                    <div style="margin:24px 0 0;padding:16px;border-left:3px solid #E36951;background:rgba(227,105,81,0.1);text-align:left;">
                        <p style="margin:0;color:#E36951;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">Deadline</p>
                        <p style="margin:6px 0 0;color:#fff;font-size:15px;">
                            ${new Date(data.deadline).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p style="margin:6px 0 0;color:#a1a1aa;font-size:13px;">Submissions strictly close after this time.</p>
                    </div>
                    ` : ''}
                    <a href="${taskLink}" style="display:inline-block;margin-top:30px;padding:12px 30px;background:#3ABCB3;color:#000;text-decoration:none;font-family:monospace;font-weight:bold;text-transform:uppercase;letter-spacing:2px;border-radius:4px;">View & Submit Task</a>
                </td></tr>
                                ${getRecruitmentEmailFooter('#3ABCB3')}
            </table>
        </td></tr>
    </table>
</body>
</html>`;

    try {
        const res = await resend.emails.send({
            from: EMAIL_FROM,
            to: data.toEmail,
            replyTo: REPLY_TO,
            subject: `[RMC] Task Assignment: ${data.teamName} - Action Required`,
            headers: {
                'X-Entity-Ref-ID': `${data.applicationId}-${data.teamName}`
            },
            text: `Your Task Assignment: ${data.teamName}\n\nDear ${data.name},\nCongratulations on making it to the next phase of the recruitment process for the ${data.teamName} team.\nPlease view and submit your task assignment here: ${taskLink}`,
            html,
        });
        if (res.error) {
            console.error('Resend API Error:', res.error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('sendTaskEmail error:', err);
        return false;
    }
};

export const sendInterviewEmail = async (data: {
    toEmail: string;
    name: string;
    teamName: string;
    meetLink: string;
    meetTime: string;
}) => {
    if (!process.env.RESEND_API_KEY) return false;

    const dateStr = new Date(data.meetTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' });

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Cormorant Garamond',serif;background:#000;color:#fff;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#000;">
        <tr><td style="padding:60px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
                style="margin:0 auto;border:1px solid rgba(58,188,179,0.15);background:#050505;border-radius:4px;">
                <tr><td style="padding:30px 0 0;text-align:center;">
                    <img src="${logoUrl}" alt="RMC Logo" style="height: 50px; width: auto; display: inline-block;" />
                </td></tr>
                <tr><td style="padding:24px 40px;text-align:center;">
                    <h1 style="margin:0;color:#3ABCB3;font-size:30px;font-weight:300;letter-spacing:4px;text-transform:uppercase;">
                        RMC <span style="font-weight:600;">Recruitment</span>
                    </h1>
                    <div style="width:60px;height:1px;background:#3ABCB3;margin:16px auto;"></div>
                </td></tr>
                <tr><td style="padding:10px 40px 30px;text-align:center;">
                    <h2 style="margin:0;color:#fff;font-size:22px;font-weight:400;">Interview Scheduled: ${data.teamName}</h2>
                    <p style="margin:16px 0 0;color:#71717a;font-size:15px;line-height:1.7;">
                        Dear ${data.name},<br><br>
                        Your interview for the <strong>${data.teamName}</strong> team has been scheduled.<br>
                        <strong>Time:</strong> ${dateStr} IST
                    </p>
                    <a href="${data.meetLink}" style="display:inline-block;margin-top:30px;padding:12px 30px;background:#3ABCB3;color:#000;text-decoration:none;font-family:monospace;font-weight:bold;text-transform:uppercase;letter-spacing:2px;border-radius:4px;">Join Google Meet</a>
                </td></tr>
                                ${getRecruitmentEmailFooter('#3ABCB3')}
            </table>
        </td></tr>
    </table>
</body>
</html>`;

    try {
        await resend.emails.send({
            from: EMAIL_FROM,
            to: data.toEmail,
            replyTo: REPLY_TO,
            subject: `[RMC] Interview Scheduled: ${data.teamName}`,
            text: `Interview Scheduled: ${data.teamName}\n\nDear ${data.name},\nYour interview for the ${data.teamName} team has been scheduled.\nTime: ${dateStr} IST\nJoin Google Meet: ${data.meetLink}`,
            html,
        });
        return true;
    } catch (err) {
        console.error('sendInterviewEmail error:', err);
        return false;
    }
};
