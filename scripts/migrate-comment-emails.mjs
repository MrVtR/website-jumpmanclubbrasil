#!/usr/bin/env node
// One-off migration: encrypt the plaintext `email` of existing "commentEmail"
// docs into `emailEncrypted` + `emailHash`, and remove `email`.
//
// Usage (from the project root):
//   node --env-file=.env.local scripts/migrate-comment-emails.mjs           # dry run
//   node --env-file=.env.local scripts/migrate-comment-emails.mjs --apply   # write
//
// Needs SANITY_API_TOKEN (write access), SANITY_STUDIO_PROJECT_ID (or
// NEXT_PUBLIC_SANITY_PROJECT_ID), NEXT_PUBLIC_SANITY_DATASET, and the SAME
// EMAIL_ENCRYPTION_KEY / EMAIL_HASH_KEY that production uses.
// Never prints email addresses. Safe to re-run (only touches docs that still
// have `email`).
import { createClient } from "@sanity/client";

// lib/emailCrypto.js is ESM in a package without "type": "module"; Node 22+
// loads it fine but prints MODULE_TYPELESS_PACKAGE_JSON. Silence only that.
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...rest) => {
  const code = typeof rest[0] === "object" ? rest[0]?.code : rest[1];
  if (code === "MODULE_TYPELESS_PACKAGE_JSON") return;
  return originalEmitWarning.call(process, warning, ...rest);
};
const { assertEmailCryptoConfigured, decryptEmail, encryptEmail, hashEmail } =
  await import("../lib/emailCrypto.js");
process.emitWarning = originalEmitWarning;

const BATCH_SIZE = 100;

const HELP = `Encrypts plaintext commenter emails stored in Sanity "commentEmail" docs.

  node --env-file=.env.local scripts/migrate-comment-emails.mjs [--apply]

  (no flag)  dry run: only prints how many docs would be migrated
  --apply    sets emailEncrypted + emailHash and unsets email, in transactions
  --help     show this message

Required env: SANITY_API_TOKEN, SANITY_STUDIO_PROJECT_ID (or
NEXT_PUBLIC_SANITY_PROJECT_ID), NEXT_PUBLIC_SANITY_DATASET,
EMAIL_ENCRYPTION_KEY, EMAIL_HASH_KEY (same values as production).`;

async function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP);
    return 0;
  }
  const apply = argv.includes("--apply");

  const projectId =
    process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_TOKEN;
  const missing = [
    !projectId && "SANITY_STUDIO_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID)",
    !dataset && "NEXT_PUBLIC_SANITY_DATASET",
    !token && "SANITY_API_TOKEN"
  ].filter(Boolean);
  if (missing.length) {
    console.error(`Missing env: ${missing.join(", ")}\n\n${HELP}`);
    return 1;
  }
  try {
    assertEmailCryptoConfigured();
  } catch (error) {
    console.error(error.message);
    return 1;
  }

  const client = createClient({
    projectId,
    dataset,
    token,
    useCdn: false,
    apiVersion: "2023-01-01"
  });

  const docs = await client.fetch(
    `*[_type == "commentEmail" && defined(email)]{ _id, _rev, email }`
  );
  console.log(
    `${docs.length} commentEmail doc(s) with a plaintext email in ${projectId}/${dataset}.`
  );
  if (!apply) {
    if (docs.length) console.log("Dry run — nothing written. Re-run with --apply to migrate.");
    return 0;
  }
  if (!docs.length) return 0;

  let migrated = 0;
  let skipped = 0;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const tx = client.transaction();
    let inTx = 0;
    for (const doc of docs.slice(i, i + BATCH_SIZE)) {
      const normalized = typeof doc.email === "string" ? doc.email.trim().toLowerCase() : "";
      if (!normalized) {
        skipped++;
        console.warn(`Skipping ${doc._id}: email is empty or not a string.`);
        continue;
      }
      const emailEncrypted = encryptEmail(normalized);
      // Round-trip check before the plaintext is removed for good.
      if (decryptEmail(emailEncrypted) !== normalized) {
        throw new Error(`Encryption round-trip failed for ${doc._id}; aborting.`);
      }
      const emailHash = hashEmail(normalized);
      tx.patch(doc._id, p =>
        p.ifRevisionId(doc._rev).set({ emailEncrypted, emailHash }).unset(["email"])
      );
      inTx++;
    }
    if (inTx) {
      await tx.commit();
      migrated += inTx;
      console.log(`Migrated ${migrated}/${docs.length}...`);
    }
  }

  const remaining = await client.fetch(
    `count(*[_type == "commentEmail" && defined(email)])`
  );
  console.log(
    `Done. Migrated ${migrated}, skipped ${skipped}, still with plaintext email: ${remaining}.`
  );
  return remaining > skipped ? 1 : 0;
}

main(process.argv.slice(2)).then(
  code => {
    process.exitCode = code;
  },
  error => {
    // Sanity errors don't contain document bodies, but keep the output short.
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  }
);
