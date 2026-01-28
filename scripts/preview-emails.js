const fs = require('fs');
const path = require('path');

// Mock data
const mockTicketData = {
    participantName: "Alan Turing",
    eventName: "The Imitation Game",
    eventDate: "March 14, 2026",
    eventTime: "18:00 IST",
    eventVenue: "Enigma Hall, Bletchley Park",
    registrationId: "982741"
};

const mockQRUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=982741";

// Template generators (copied from src/lib/email.ts)
const generateTicketEmailHTML = (data, qrCodeDataUrl) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Cormorant Garamond', serif; background-color: #000000; color: #ffffff;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
        <tr>
            <td style="padding: 60px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; border: 1px solid rgba(45, 212, 191, 0.2); background: #050505; border-radius: 4px; box-shadow: 0 0 50px rgba(45, 212, 191, 0.1);">
                    
                    <tr>
                        <td style="padding: 20px 0 0; text-align: center; color: rgba(45, 212, 191, 0.3); font-size: 24px; letter-spacing: 15px;">
                            ∫ ∞ ∑
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #2dd4bf; font-size: 38px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase;">
                                RMC <span style="font-weight: 600;">Events</span>
                            </h1>
                            <div style="width: 60px; height: 1px; background: #2dd4bf; margin: 15px auto;"></div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px 40px; text-align: center;">
                            <p style="margin: 0; color: #a1a1aa; font-size: 16px; font-style: italic; letter-spacing: 1px;">
                                "The Art of the Infinite."
                            </p>
                            <h2 style="margin: 20px 0 0; color: #ffffff; font-size: 24px; font-weight: 400; letter-spacing: 1px;">
                                Welcome to the Enigma, ${data.participantName}
                            </h2>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid rgba(45, 212, 191, 0.4); background: linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(0, 0, 0, 0.8) 100%); border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 0;">
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

                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top: 1px solid rgba(45, 212, 191, 0.2);">
                                            <tr>
                                                <td style="padding: 30px; background: rgba(0,0,0,0.5);">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                        <tr>
                                                            <td width="50%" style="padding-bottom: 20px;">
                                                                <span style="color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Event</span><br>
                                                                <span style="color: #ffffff; font-size: 18px;">${data.eventName}</span>
                                                            </td>
                                                            <td width="50%" style="padding-bottom: 20px; text-align: right;">
                                                                <span style="color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Row / Seat</span><br>
                                                                <span style="color: #2dd4bf; font-size: 18px;">π / e</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td width="50%">
                                                                <span style="color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Date & Time</span><br>
                                                                <span style="color: #ffffff; font-size: 15px;">${data.eventDate} | ${data.eventTime}</span>
                                                            </td>
                                                            <td width="50%" style="text-align: right;">
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

                    <tr>
                        <td style="padding: 40px; text-align: center; border-top: 1px solid rgba(45, 212, 191, 0.1); background: #000000;">
                            <p style="margin: 0; color: #52525b; font-size: 12px; letter-spacing: 1px;">
                                CALCULATING... SUCCESS.
                            </p>
                            <p style="margin: 10px 0 0; color: #3f3f46; font-size: 11px;">
                                Ramanujan Mathematical Club &copy; 2026
                            </p>
                            <p style="margin: 15px 0 0; color: #2dd4bf; font-size: 14px; text-decoration: none;">
                                ∇ &Delta; &Pi; &Phi;
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

const generateVerificationEmailHTML = (name, eventName, registrationId) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Cormorant Garamond', serif; background-color: #000000; color: #ffffff;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
        <tr>
            <td style="padding: 60px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; border: 1px solid rgba(245, 158, 11, 0.2); background: #050505; border-radius: 4px;">
                    <tr>
                        <td style="padding: 40px; text-align: center;">
                            <h1 style="margin: 0; color: #f59e0b; font-size: 32px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase;">
                                Verification <span style="font-weight: 600;">Initiated</span>
                            </h1>
                            <div style="width: 40px; height: 1px; background: #f59e0b; margin: 20px auto;"></div>
                            <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                                Greetings, ${name}. Your request to join <strong>${eventName}</strong> has been logged in our systems.
                            </p>
                            
                            <div style="margin: 30px 0; padding: 20px; background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px;">
                                <p style="margin: 0; color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Sequence ID</p>
                                <p style="margin: 5px 0 0; color: #f59e0b; font-size: 20px; font-family: monospace;">${registrationId}</p>
                                <p style="margin: 15px 0 0; color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Status</p>
                                <p style="margin: 5px 0 0; color: #ffffff; font-size: 16px;">PENDING_CALCULATION</p>
                            </div>

                            <p style="color: #71717a; font-size: 14px; font-style: italic;">
                                Our architects are currently verifying your credentials. You will receive the final fractal sequence shortly.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; text-align: center; border-top: 1px solid rgba(245, 158, 11, 0.1);">
                            <p style="margin: 0; color: #3f3f46; font-size: 11px;">
                                Ramanujan Mathematical Club &copy; 2026
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

const ticketHtml = generateTicketEmailHTML(mockTicketData, mockQRUrl);
const verificationHtml = generateVerificationEmailHTML("Alan Turing", "The Imitation Game", "982741");

const outputDir = path.join(__dirname, 'previews');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

fs.writeFileSync(path.join(outputDir, 'ticket.html'), ticketHtml);
fs.writeFileSync(path.join(outputDir, 'verification.html'), verificationHtml);

console.log(`Previews generated in: ${outputDir}`);
