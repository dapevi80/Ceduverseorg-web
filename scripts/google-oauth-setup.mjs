/**
 * One-time helper to obtain a Google OAuth refresh token for CRM meeting links.
 *
 * Prereqs (in Google Cloud Console):
 *   1. Create a project, enable the "Google Calendar API".
 *   2. OAuth consent screen: External, Publishing status = "In production"
 *      (so the refresh token does NOT expire after 7 days).
 *   3. Credentials -> Create OAuth client ID -> type "Web application".
 *      Add redirect URI:  http://localhost:4321/oauth2callback
 *      Note the Client ID and Client Secret.
 *
 * Run:
 *   GOOGLE_OAUTH_CLIENT_ID=xxx GOOGLE_OAUTH_CLIENT_SECRET=yyy node scripts/google-oauth-setup.mjs
 *
 * It opens a consent URL — approve with the meetings Gmail account — then prints
 * the refresh token. Put these in Render env vars:
 *   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN
 */
import http from "node:http";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const PORT = 4321;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/calendar.events";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET env vars first.");
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent", // force a refresh_token every time
  }).toString();

console.log("\n1) Open this URL in your browser and approve with the MEETINGS Gmail account:\n");
console.log(authUrl + "\n");

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/oauth2callback")) {
    res.writeHead(404).end();
    return;
  }
  const code = new URL(req.url, REDIRECT).searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("No code");
    return;
  }
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT,
        grant_type: "authorization_code",
      }),
    });
    const data = await tokenRes.json();
    if (!data.refresh_token) {
      res.writeHead(200).end("No refresh_token returned. Revoke prior access and retry (prompt=consent).");
      console.error("\nNo refresh_token in response:", JSON.stringify(data, null, 2));
      console.error("Tip: remove the app at https://myaccount.google.com/permissions then re-run.");
    } else {
      res.writeHead(200).end("Success! You can close this tab and return to the terminal.");
      console.log("\n✅ Refresh token (add to Render as GOOGLE_OAUTH_REFRESH_TOKEN):\n");
      console.log(data.refresh_token + "\n");
    }
  } catch (e) {
    res.writeHead(500).end("Error: " + e.message);
    console.error(e);
  } finally {
    setTimeout(() => { server.close(); process.exit(0); }, 500);
  }
});

server.listen(PORT, () => console.log(`2) Waiting for the redirect on ${REDIRECT} ...`));
