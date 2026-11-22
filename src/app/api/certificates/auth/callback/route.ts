import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const origin = new URL(request.url).origin;

  if (error) {
    return NextResponse.redirect(`${origin}/admin/certificates?oauth_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/certificates?oauth_error=no_code_provided`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/certificates/auth/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/admin/certificates?oauth_error=missing_credentials`);
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      // In-memory update for current running server process
      process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;

      // Persist to .env.local
      const envPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
          envContent = envContent.replace(
            /GOOGLE_REFRESH_TOKEN=.*/,
            `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`
          );
        } else {
          envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`;
        }
        fs.writeFileSync(envPath, envContent);
      }
    }

    return NextResponse.redirect(`${origin}/admin/certificates?oauth=success`);
  } catch (err: any) {
    console.error('[OAuth Callback] Token exchange failed:', err);
    return NextResponse.redirect(
      `${origin}/admin/certificates?oauth_error=${encodeURIComponent(err.message || 'token_exchange_failed')}`
    );
  }
}

