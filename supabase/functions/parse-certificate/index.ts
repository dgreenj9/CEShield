// Edge Function: parse-certificate
//
// Receives a base64-encoded certificate image, runs it through Google Vision
// (server-side, keyed by the GOOGLE_VISION_KEY secret which never touches the
// browser), and returns parsed CE-course fields.
//
// Deploy:
//   supabase secrets set GOOGLE_VISION_KEY=<key>
//   supabase functions deploy parse-certificate
//
// Auth: JWT verification is on by default. The client must invoke via
// `supabase.functions.invoke(...)` while authenticated.

// deno-lint-ignore-file
// @ts-nocheck — Deno globals (Deno.env, Deno.serve) aren't in Node's TS lib.

// Restrict browser callers to the production origins (plus localhost for
// dev). The function still requires a valid JWT regardless — CORS is
// defense-in-depth, not the auth boundary.
const ALLOWED_ORIGINS = new Set([
  "https://ceshield.com",
  "https://www.ceshield.com",
  "http://localhost:3000",
]);

const corsHeadersFor = (origin: string | null): Record<string, string> => ({
  "Access-Control-Allow-Origin":
    origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://ceshield.com",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

// Default headers used by the json() helper; per-request handlers override
// with corsHeadersFor(req.headers.get("origin")).
let CORS_HEADERS: Record<string, string> = corsHeadersFor(null);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

interface ParseRequest {
  imageBase64?: string;
  mimeType?: string;
}

interface ParsedFields {
  title: string;
  provider: string;
  date: string;
  hours: string;
  category: string;
  raw?: string;
}

const parseExtractedText = (text: string): ParsedFields => {
  const out: ParsedFields = {
    title: "",
    provider: "",
    date: "",
    hours: "",
    category: "general",
  };

  // Title — match common "completed: <title>" patterns
  const titleMatch = text.match(
    /(?:has\s+)?(?:successfully\s+)?completed:?\s*(?:the\s+)?(?:course\s+)?(?:entitled\s+)?["']?([^"'\n]{5,100})["']?/i,
  );
  if (titleMatch) out.title = titleMatch[1].trim();

  // Hours — N or N.5 followed by "hour", "hours", "CEU", "CE hours"
  const hoursMatch = text.match(
    /(\d+\.?\d*)\s*(?:hours?|ceus?|ce\s*hours?|contact\s*hours?)/i,
  );
  if (hoursMatch) out.hours = hoursMatch[1];

  // Date — any of: 03/24/2026, March 24 2026, 24 Mar 2026
  const mmddyyyy = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (mmddyyyy) {
    const [, mm, dd, yyyy] = mmddyyyy;
    out.date = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  } else {
    const monthName = text.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i,
    );
    if (monthName) {
      const months: Record<string, string> = {
        january: "01", february: "02", march: "03", april: "04",
        may: "05", june: "06", july: "07", august: "08",
        september: "09", october: "10", november: "11", december: "12",
      };
      const [, m, d, y] = monthName;
      out.date = `${y}-${months[m.toLowerCase()]}-${d.padStart(2, "0")}`;
    }
  }

  // Provider — first reasonable line that mentions "presented by", "provider",
  // or an org-like suffix
  const providerMatch = text.match(
    /(?:presented\s+by|provider|sponsored\s+by|offered\s+by)[:\s]+([^\n]{3,80})/i,
  );
  if (providerMatch) out.provider = providerMatch[1].trim();

  // Mandatory-category sniffing — keywords that show up in IL CE titles
  const lower = text.toLowerCase();
  if (/ethic/i.test(lower)) out.category = "ethics";
  else if (/sexual\s+harassment/i.test(lower)) out.category = "sexualHarassment";
  else if (/cultural\s+competen/i.test(lower)) out.category = "culturalCompetency";
  else if (/implicit\s+bias/i.test(lower)) out.category = "implicitBias";
  else if (/(alzheimer|dementia)/i.test(lower)) out.category = "dementia";

  return out;
};

Deno.serve(async (req: Request) => {
  // Resolve CORS headers for this request's origin once, used by all
  // responses below (json() reads the module-level CORS_HEADERS).
  CORS_HEADERS = corsHeadersFor(req.headers.get("origin"));

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const visionKey = Deno.env.get("GOOGLE_VISION_KEY");
  if (!visionKey) {
    return json({ error: "Server misconfigured: GOOGLE_VISION_KEY not set" }, 500);
  }

  let body: ParseRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { imageBase64 } = body;
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return json({ error: "imageBase64 required" }, 400);
  }
  // Strip any data: prefix the client forgot to remove
  const content = imageBase64.includes(",")
    ? imageBase64.split(",")[1]
    : imageBase64;

  // Soft size cap to avoid runaway payloads (~10MB base64 = ~7.5MB binary).
  if (content.length > 14_000_000) {
    return json({ error: "Image too large (10MB max)" }, 413);
  }

  let visionResponse: Response;
  try {
    visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content },
              features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      },
    );
  } catch (err) {
    return json({ error: `Vision API request failed: ${err.message}` }, 502);
  }

  if (!visionResponse.ok) {
    const errText = await visionResponse.text();
    return json(
      { error: `Vision API error (${visionResponse.status}): ${errText.slice(0, 300)}` },
      502,
    );
  }

  const result = await visionResponse.json();
  const extractedText: string =
    result.responses?.[0]?.fullTextAnnotation?.text || "";

  if (!extractedText) {
    return json({ error: "No text found in image" }, 422);
  }

  const parsed = parseExtractedText(extractedText);
  return json({ ...parsed, raw: extractedText });
});
