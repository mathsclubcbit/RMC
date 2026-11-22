const fs = require('fs');
const content = fs.readFileSync('src/lib/email.ts', 'utf8');
const htmlBlocks = content.match(/<!DOCTYPE html>[\s\S]*?<\/html>/g);
if (htmlBlocks) {
    let output = `<html>
    <head>
        <title>Email Previews</title>
        <style>
            body { background: #111; color: white; padding: 40px; font-family: sans-serif; }
            .email-container { margin: 0 auto 80px auto; max-width: 800px; border: 1px solid #333; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 8px; overflow: hidden; }
            .email-header { background: #2dd4bf; color: #000; padding: 15px 20px; font-weight: bold; font-size: 18px; }
            .email-body { background: #000; padding: 0; }
        </style>
    </head>
    <body>
        <div style="max-width: 800px; margin: 0 auto; text-align: center; padding-bottom: 40px;">
            <h1 style="color: #2dd4bf;">Email Templates Preview</h1>
            <p style="color: #888;">All 8 emails with the newly added RMC Logo</p>
        </div>
    `;
    
    const titles = [
        "Ticket Email", "Verification Pending", "Admin Alert", "Welcome Newsletter", 
        "Recruitment Confirmation", "Recruitment Decision", "Task Assignment", "Interview Scheduled"
    ];

    htmlBlocks.forEach((html, i) => {
        let mockedHtml = html
            .replace(/\$\{logoUrl\}/g, 'https://www.rmccbit.in/full%20logo.png')
            .replace(/\$\{name\}/g, 'John Doe')
            .replace(/\$\{eventName\}/g, 'Math Olympiad')
            .replace(/\$\{registrationId\}/g, 'RMC-123456')
            .replace(/\$\{data\.teamName\}/g, 'WebDev')
            .replace(/\$\{data\.name\}/g, 'John Doe')
            .replace(/\$\{statusColor\}/g, '#3ABCB3')
            .replace(/\$\{statusLabel\}/g, 'APPLICATION SELECTED')
            .replace(/\$\{heading\}/g, 'Welcome to the Club, John Doe!')
            .replace(/\$\{body\}/g, 'Congratulations! Your application stood out and we are thrilled to welcome you as an official member.')
            .replace(/\$\{dateStr\}/g, 'Oct 25, 2026 at 10:00 AM')
            .replace(/\$\{taskLink\}/g, '#')
            .replace(/\$\{data\.meetLink\}/g, '#')
            .replace(/\$\{getEmailFooter\(\)\}/g, '')
            .replace(/\$\{getRecruitmentEmailFooter\([^)]*\)\}/g, '')
            .replace(/\$\{data\.deadline \? `[\s\S]*?` : ''\}/g, '')
            .replace(/`\s*$/g, ''); // strip trailing backticks
            
        output += `
            <div class="email-container">
                <div class="email-header">Template ${i+1}: ${titles[i] || 'Email'}</div>
                <div class="email-body">
                    <iframe style="width: 100%; height: 600px; border: none; background: #000;" srcdoc='${mockedHtml.replace(/'/g, "&#39;")}'></iframe>
                </div>
            </div>
        `;
    });
    output += '</body></html>';
    fs.writeFileSync('public/preview-emails.html', output);
    console.log('Previews generated at public/preview-emails.html');
} else {
    console.log('No HTML blocks found');
}
