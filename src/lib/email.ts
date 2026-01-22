import nodemailer from 'nodemailer';

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
 * Send a verification email to the participant
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
        console.log(`Email sent to ${toEmail}`);
    } catch (error) {
        console.error("Error sending email:", error);
        // Don't throw error to prevent failing the entire registration if email fails
    }
};
