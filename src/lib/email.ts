import nodemailer from 'nodemailer';
import { generateQRCode } from './qrcode';

/**
 * Configure the SMTP Transporter
 * Using Gmail as an example
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your App Password
    },
});

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
    <title>Your Event Ticket - ${data.eventName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0f172a;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    
                    <!-- Header with Gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #f59e0b 100%); padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                🎫 Your Event Ticket
                            </h1>
                            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                                Registration Approved - You're all set!
                            </p>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 30px 40px 10px;">
                            <p style="margin: 0; color: #94a3b8; font-size: 16px;">
                                Hello <span style="color: #2dd4bf; font-weight: 600;">${data.participantName}</span>,
                            </p>
                            <p style="margin: 15px 0 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                                Great news! Your registration has been approved. Here's your digital ticket for the event.
                            </p>
                        </td>
                    </tr>

                    <!-- QR Code Section -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="background: linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%); border: 2px solid rgba(20, 184, 166, 0.3); border-radius: 16px; padding: 25px; text-align: center;">
                                        <p style="margin: 0 0 15px; color: #f59e0b; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
                                            ✨ SCAN FOR ENTRY
                                        </p>
                                        <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 200px; height: 200px; border-radius: 12px; border: 4px solid #14b8a6; box-shadow: 0 0 30px rgba(20, 184, 166, 0.3);" />
                                        <p style="margin: 15px 0 0; color: #64748b; font-size: 12px;">
                                            Present this QR code at the venue for entry
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Event Details Card -->
                    <tr>
                        <td style="padding: 10px 40px 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(30, 41, 59, 0.8); border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td style="background: linear-gradient(90deg, #14b8a6 0%, #0d9488 100%); padding: 12px 20px;">
                                        <h2 style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                                            📅 Event Details
                                        </h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
                                                    <span style="color: #64748b; font-size: 13px;">Event</span><br>
                                                    <span style="color: #f1f5f9; font-size: 16px; font-weight: 600;">${data.eventName}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
                                                    <span style="color: #64748b; font-size: 13px;">Date & Time</span><br>
                                                    <span style="color: #f1f5f9; font-size: 15px;">${data.eventDate} at ${data.eventTime}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
                                                    <span style="color: #64748b; font-size: 13px;">Venue</span><br>
                                                    <span style="color: #f1f5f9; font-size: 15px;">${data.eventVenue}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: #64748b; font-size: 13px;">Registration ID</span><br>
                                                    <span style="color: #14b8a6; font-size: 14px; font-family: 'Courier New', monospace; background: rgba(20, 184, 166, 0.1); padding: 4px 8px; border-radius: 4px;">${data.registrationId}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Participant Details -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(30, 41, 59, 0.8); border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td style="background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); padding: 12px 20px;">
                                        <h2 style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                                            👤 Participant Details
                                        </h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
                                                    <span style="color: #64748b; font-size: 13px;">Name</span><br>
                                                    <span style="color: #f1f5f9; font-size: 16px; font-weight: 600;">${data.participantName}</span>
                                                </td>
                                            </tr>
                                            ${data.rollNo ? `
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
                                                    <span style="color: #64748b; font-size: 13px;">Roll Number</span><br>
                                                    <span style="color: #f1f5f9; font-size: 15px;">${data.rollNo}</span>
                                                </td>
                                            </tr>
                                            ` : ''}
                                            ${data.department ? `
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: #64748b; font-size: 13px;">Department</span><br>
                                                    <span style="color: #f1f5f9; font-size: 15px;">${data.department}</span>
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>


                    <!-- Important Notes -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 10px; color: #f59e0b; font-size: 14px; font-weight: 600;">
                                            ⚠️ Important Notes
                                        </h3>
                                        <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 13px; line-height: 1.8;">
                                            <li>Please arrive at least 15 minutes before the event starts</li>
                                            <li>Keep this QR code ready for scanning at entry</li>
                                            <li>This ticket is valid for one-time entry only</li>
                                            <li>Carry a valid ID proof along with this ticket</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: rgba(15, 23, 42, 0.8); padding: 25px 40px; text-align: center; border-top: 1px solid rgba(148, 163, 184, 0.1);">
                            <p style="margin: 0; color: #64748b; font-size: 13px;">
                                Ramanujan Mathematical Club
                            </p>
                            <p style="margin: 8px 0 0; color: #475569; font-size: 12px;">
                                Questions? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #14b8a6; text-decoration: none;">${process.env.EMAIL_USER}</a>
                            </p>
                            <p style="margin: 15px 0 0; color: #334155; font-size: 11px;">
                                © ${new Date().getFullYear()} RMC. All rights reserved.
                            </p>
                        </td>
                    </tr>

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
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Skipping ticket email: EMAIL_USER or EMAIL_PASS not set.");
        return false;
    }

    try {
        // Generate QR code with registration ID
        const qrCodeDataUrl = await generateQRCode(data.registrationId);

        // Convert data URL to buffer for attachment
        const qrBase64 = qrCodeDataUrl.split(',')[1];
        const qrBuffer = Buffer.from(qrBase64, 'base64');

        // Use CID for embedding image in email (data URLs are blocked by most email clients)
        const htmlContent = generateTicketEmailHTML(data, 'cid:qrcode');

        const mailOptions = {
            from: `"RMC Events" <${process.env.EMAIL_USER}>`,
            to: data.toEmail,
            subject: `🎫 Your Ticket for ${data.eventName} - Registration Confirmed!`,
            html: htmlContent,
            attachments: [
                {
                    filename: 'qrcode.png',
                    content: qrBuffer,
                    cid: 'qrcode' // Content-ID for embedding in HTML
                }
            ]
        };

        await transporter.sendMail(mailOptions);

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
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Skipping email: EMAIL_USER or EMAIL_PASS not set.");
        return;
    }

    const mailOptions = {
        from: `"RMC Events" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Registration Confirmed: ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2dd4bf; text-align: center;">Registration Confirmed</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>Your registration for <strong>${eventName}</strong> has been successfully received.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Registration ID:</strong> <span style="font-family: monospace;">${registrationId}</span></p>
                    <p style="margin: 5px 0 0;"><strong>Status:</strong> Pending Verification</p>
                </div>

                <p>Our team will verify your payment details. You will receive further updates shortly.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888; text-align: center;">RMC Event Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error("Error sending email:", error);
        // Don't throw error to prevent failing the entire registration if email fails
    }
};
