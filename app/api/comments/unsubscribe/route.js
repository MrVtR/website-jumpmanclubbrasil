import { createClient } from "@sanity/client";
import { storedEmailHash } from "@/lib/emailCrypto";

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2023-01-01"
});

function page(message, status = 200) {
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Avisos de comentários</title></head>
<body style="font-family: Arial, sans-serif; max-width: 480px; margin: 64px auto; padding: 0 16px; text-align: center;">
<p>${message}</p><p><a href="/">Voltar ao site</a></p></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

async function unsubscribe(token) {
  if (!token) return false;

  const sub = await client.fetch(
    `*[_type == "commentEmail" && unsubscribeToken == $token][0]{ _id, emailHash, email, threadId }`,
    { token }
  );
  if (!sub) return false;

  // Unsubscribe this person from the whole thread (all of their comments
  // there). Matching is done by emailHash; legacy docs that still hold a
  // plaintext `email` get their hash computed on the fly, so legacy and new
  // docs of the same person are all covered. Nothing is decrypted here.
  const threadDocs = await client.fetch(
    `*[_type == "commentEmail" && threadId == $threadId]{ _id, emailHash, email }`,
    { threadId: sub.threadId }
  );

  let ids;
  try {
    const hash = storedEmailHash(sub);
    ids = threadDocs
      .filter(d => d._id === sub._id || (hash && storedEmailHash(d) === hash))
      .map(d => d._id);
  } catch (hashError) {
    // Keys missing/invalid: still honour the request as best we can.
    console.error(`Unsubscribe without email hash: ${hashError.message}`);
    const plain = sub.email?.trim().toLowerCase();
    ids = threadDocs
      .filter(
        d => d._id === sub._id || (plain && d.email?.trim().toLowerCase() === plain)
      )
      .map(d => d._id);
  }

  const tx = client.transaction();
  ids.forEach(id => tx.patch(id, p => p.set({ subscribed: false })));
  await tx.commit();
  return true;
}

// Link clicked in the email.
export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  try {
    const ok = await unsubscribe(token);
    return ok
      ? page("Pronto! Você não receberá mais avisos desta conversa.")
      : page("Link inválido ou expirado.", 400);
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return page("Não foi possível concluir. Tente novamente mais tarde.", 500);
  }
}

// One-click unsubscribe from email clients (List-Unsubscribe header).
export async function POST(req) {
  const token = new URL(req.url).searchParams.get("token");
  try {
    await unsubscribe(token);
  } catch (error) {
    console.error("Error unsubscribing:", error);
  }
  return new Response(null, { status: 200 });
}
