import { createClient } from "@sanity/client";

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
    `*[_type == "commentEmail" && unsubscribeToken == $token][0]{ email, threadId }`,
    { token }
  );
  if (!sub) return false;

  // Unsubscribe this address from the whole thread (all of its comments there).
  const ids = await client.fetch(
    `*[_type == "commentEmail" && email == $email && threadId == $threadId]._id`,
    { email: sub.email, threadId: sub.threadId }
  );
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
