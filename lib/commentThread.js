// Comment-thread helpers used by the notification emails.
//
// A "branch view" of a comment C is: every comment above C (its ancestors up
// to the top-level comment), C itself, and every comment below C (its whole
// sub-tree). Comments at the same level as C (siblings) and their sub-trees
// are left out. Example:
//
//   X
//   ├─ Y
//   │  └─ Z
//   └─ A
//      └─ B
//
//   view(X) = X, Y, Z, A, B     view(Y) = X, Y, Z     view(A) = X, A, B

const MAX_TEXT_IN_EMAIL = 1500; // characters per comment shown in an email
const MAX_INDENT_LEVELS = 6; // deeper replies keep the same indentation

export async function loadPostComments(client, postId) {
  return (
    (await client.fetch(
      `*[_type == "comment" && post._ref == $postId]{ _id, author, text, createdAt, "parent": parent._ref }`,
      { postId }
    )) || []
  );
}

export function indexComments(comments) {
  const byId = new Map(comments.map(c => [c._id, c]));
  const children = new Map();
  for (const c of comments) {
    if (!c.parent || !byId.has(c.parent)) continue;
    if (!children.has(c.parent)) children.set(c.parent, []);
    children.get(c.parent).push(c._id);
  }
  const byDate = (a, b) =>
    String(byId.get(a).createdAt).localeCompare(String(byId.get(b).createdAt));
  children.forEach(list => list.sort(byDate));
  return { byId, children };
}

/** Ancestors of `id`, from the top-level comment down to its parent. */
export function ancestorsOf(index, id) {
  const path = [];
  const seen = new Set([id]);
  let current = index.byId.get(id)?.parent;
  while (current && index.byId.has(current) && !seen.has(current)) {
    seen.add(current);
    path.unshift(current);
    current = index.byId.get(current).parent;
  }
  return path;
}

export function rootOf(index, id) {
  return ancestorsOf(index, id)[0] || id;
}

/** `id` and every reply below it, at any depth. */
export function subtreeOf(index, id) {
  const out = [];
  const stack = [id];
  const seen = new Set();
  while (stack.length) {
    const current = stack.pop();
    if (seen.has(current) || !index.byId.has(current)) continue;
    seen.add(current);
    out.push(current);
    (index.children.get(current) || []).forEach(child => stack.push(child));
  }
  return out;
}

/** Union of the branch views of the given comments (see top of file). */
export function branchView(index, ids) {
  const visible = new Set();
  for (const id of ids) {
    if (!index.byId.has(id)) continue;
    ancestorsOf(index, id).forEach(a => visible.add(a));
    subtreeOf(index, id).forEach(d => visible.add(d));
  }
  return visible;
}

/** Visible comments in reading order, with their depth: [{ comment, depth }]. */
export function flattenView(index, visible) {
  const out = [];
  const roots = [...visible].filter(id => {
    const parent = index.byId.get(id)?.parent;
    return !parent || !visible.has(parent);
  });
  roots.sort((a, b) =>
    String(index.byId.get(a).createdAt).localeCompare(String(index.byId.get(b).createdAt))
  );
  const walk = (id, depth) => {
    out.push({ comment: index.byId.get(id), depth });
    (index.children.get(id) || [])
      .filter(child => visible.has(child))
      .forEach(child => walk(child, depth + 1));
  };
  roots.forEach(root => walk(root, 0));
  return out;
}

// ---------------------------------------------------------------------------
// Email rendering
// ---------------------------------------------------------------------------

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shorten(text = "") {
  return text.length > MAX_TEXT_IN_EMAIL
    ? `${text.slice(0, MAX_TEXT_IN_EMAIL)}…`
    : text;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short"
    });
  } catch {
    return "";
  }
}

/**
 * Renders the visible part of the thread for an email.
 * @param {object} opts
 *   highlightId: the new comment (green), ownIds: Set of the recipient's comments
 */
export function renderThreadEmail(index, visible, { highlightId, ownIds = new Set() }) {
  const rows = flattenView(index, visible);

  const html = rows
    .map(({ comment, depth }) => {
      const isNew = comment._id === highlightId;
      const isOwn = ownIds.has(comment._id);
      const indent = Math.min(depth, MAX_INDENT_LEVELS) * 20;
      const tags = [isOwn ? "você" : null, isNew ? "nova resposta" : null]
        .filter(Boolean)
        .map(
          tag =>
            `<span style="display: inline-block; margin-left: 6px; padding: 0 6px; border-radius: 4px; font-size: 11px; background: ${
              tag === "nova resposta" ? "#22c55e" : "#e5e7eb"
            }; color: ${tag === "nova resposta" ? "#fff" : "#374151"};">${tag}</span>`
        )
        .join("");
      return `
        <div style="margin: 0 0 8px ${indent}px; padding: 8px 12px; border-left: 4px solid ${
          isNew ? "#22c55e" : "#d1d5db"
        }; background: ${isNew ? "#f0fdf4" : "#f6f6f6"};">
          <div style="font-size: 13px; color: #555;"><strong style="color: #111;">${escapeHtml(
            comment.author
          )}</strong>${tags} <span style="color: #888;">· ${escapeHtml(
            formatDate(comment.createdAt)
          )}</span></div>
          <div style="margin-top: 4px; white-space: pre-wrap;">${escapeHtml(
            shorten(comment.text)
          )}</div>
        </div>`;
    })
    .join("");

  const text = rows
    .map(({ comment, depth }) => {
      const pad = "    ".repeat(Math.min(depth, MAX_INDENT_LEVELS));
      const tags = [
        ownIds.has(comment._id) ? "você" : null,
        comment._id === highlightId ? "NOVA RESPOSTA" : null
      ]
        .filter(Boolean)
        .join(", ");
      const header = `${pad}- ${comment.author}${tags ? ` [${tags}]` : ""} (${formatDate(
        comment.createdAt
      )}):`;
      const body = shorten(comment.text)
        .split("\n")
        .map(line => `${pad}  ${line}`)
        .join("\n");
      return `${header}\n${body}`;
    })
    .join("\n\n");

  return { html, text };
}
