/**
 * One-command Resend activation for the Throughline Administrator.
 *
 *   RESEND_API_KEY=re_xxx pnpm setup:resend
 *
 * From the repo root (must be `vercel link`ed to throughline-admin), this:
 *   1. adds throughline-admin.com as a Resend sending domain (reuses it if present)
 *   2. creates the DKIM/SPF/MX records on Vercel DNS
 *   3. triggers verification and polls until Resend confirms
 *   4. sets RESEND_API_KEY + EMAIL_FROM on the Vercel project (production)
 *   5. redeploys production
 *   6. sends a test letter to TEST_TO (default mykemiller@gmail.com)
 *
 * Optional env: EMAIL_FROM (default 'Throughline <steward@throughline-admin.com>'),
 * TEST_TO, SKIP_TEST=1, SKIP_DEPLOY=1.
 */
import { execFileSync } from "child_process";

const DOMAIN = "throughline-admin.com";
const SCOPE = "project-foundry";
const API = "https://api.resend.com";
const KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Throughline <steward@throughline-admin.com>";
const TEST_TO = process.env.TEST_TO || "mykemiller@gmail.com";

if (!KEY) {
  console.error("RESEND_API_KEY is required: RESEND_API_KEY=re_xxx pnpm setup:resend");
  process.exit(1);
}

type ResendRecord = { record: string; name: string; type: string; value: string; priority?: number; status?: string };
type ResendDomain = { id: string; name: string; status: string; records?: ResendRecord[] };

async function resend<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) throw new Error(`Resend ${path}: ${res.status} ${body?.message ?? JSON.stringify(body)}`);
  return body;
}

function vercel(...args: string[]): string {
  return execFileSync("vercel", [...args, "--scope", SCOPE], { encoding: "utf8" });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  // 1. find or create the domain
  const existing = await resend<{ data: ResendDomain[] }>("/domains");
  let domain = existing.data.find((d) => d.name === DOMAIN);
  if (domain) {
    console.log(`Domain ${DOMAIN} already on Resend (status: ${domain.status})`);
  } else {
    domain = await resend<ResendDomain>("/domains", {
      method: "POST",
      body: JSON.stringify({ name: DOMAIN, region: "us-east-1" }),
    });
    console.log(`Created Resend domain ${DOMAIN} (${domain.id})`);
  }
  const detail = await resend<ResendDomain>(`/domains/${domain.id}`);
  const records = detail.records ?? [];
  if (!records.length) throw new Error("Resend returned no DNS records for the domain");

  // 2. ensure DNS records on Vercel DNS
  const zone = vercel("dns", "ls", DOMAIN);
  for (const r of records) {
    // record names arrive relative to the zone (e.g. "send", "resend._domainkey")
    const name = r.name.replace(`.${DOMAIN}`, "").replace(DOMAIN, "") || "@";
    const already = zone.includes(r.value.slice(0, 30));
    if (already) {
      console.log(`  dns ok: ${r.type} ${name} (already present)`);
      continue;
    }
    const args = ["dns", "add", DOMAIN, name, r.type.toUpperCase(), r.value];
    if (r.type.toUpperCase() === "MX") args.push(String(r.priority ?? 10));
    vercel(...args);
    console.log(`  dns added: ${r.type} ${name}`);
  }

  // 3. verify + poll
  await resend(`/domains/${domain.id}/verify`, { method: "POST" });
  process.stdout.write("Verifying");
  let status = "pending";
  for (let i = 0; i < 40; i++) {
    await sleep(15_000);
    const d = await resend<ResendDomain>(`/domains/${domain.id}`);
    status = d.status;
    process.stdout.write(".");
    if (status === "verified") break;
    if (status === "failed") break;
  }
  console.log(` ${status}`);
  if (status !== "verified") {
    throw new Error(`Domain did not verify (status: ${status}). DNS may still be propagating — re-run this script to resume; it is idempotent.`);
  }

  // 4. project env vars
  for (const [name, value] of [
    ["RESEND_API_KEY", KEY!],
    ["EMAIL_FROM", EMAIL_FROM],
  ] as const) {
    try {
      execFileSync("vercel", ["env", "rm", name, "production", "--yes", "--scope", SCOPE], { encoding: "utf8" });
    } catch {
      /* not set yet */
    }
    execFileSync("vercel", ["env", "add", name, "production", "--scope", SCOPE], { input: value, encoding: "utf8" });
    console.log(`env set: ${name}`);
  }

  // 5. redeploy production
  if (!process.env.SKIP_DEPLOY) {
    const ls = vercel("ls");
    const latest = ls.match(/https:\/\/throughline-admin-[a-z0-9]+-project-foundry\.vercel\.app/)?.[0];
    if (latest) {
      console.log("Redeploying production…");
      vercel("redeploy", latest);
    } else {
      console.log("Could not find latest deployment — push to main or run `vercel redeploy` manually.");
    }
  }

  // 6. test letter
  if (!process.env.SKIP_TEST) {
    await resend("/emails", {
      method: "POST",
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [TEST_TO],
        subject: "The steward's post is open",
        text: "Throughline letters now travel by Resend. This one found its way — the path is clear.\n\n— the Throughline Administrator",
      }),
    });
    console.log(`Test letter sent to ${TEST_TO} from ${EMAIL_FROM}`);
  }

  console.log("\nDone. Invitation letters from the console now deliver for real.");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
