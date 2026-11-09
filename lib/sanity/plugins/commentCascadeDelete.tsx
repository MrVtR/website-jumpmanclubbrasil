/**
 * Replaces the default "Delete" action on comments with a cascade delete:
 * the comment, every reply below it (at any depth), their drafts and the
 * private "commentEmail.<commentId>" documents holding the commenters' emails
 * are all deleted in a single transaction (all or nothing).
 *
 * The Studio runs as the logged-in user, so it can read/delete the private
 * email documents (IDs with a dot), which public visitors cannot.
 */
import { useState } from "react";
import { TrashIcon } from "@sanity/icons";
import { useToast } from "@sanity/ui";
import {
  definePlugin,
  useClient,
  type DocumentActionComponent
} from "sanity";

const EMAIL_PREFIX = "commentEmail.";
const stripDraft = (id: string) => id.replace(/^drafts\./, "");

type Plan = { commentIds: string[]; emailIds: string[] };

export const DeleteCommentWithReplies: DocumentActionComponent = props => {
  const client = useClient({ apiVersion: "2023-01-01" });
  const toast = useToast();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);

  const rootId = props.id; // published id, without "drafts."

  async function buildPlan(): Promise<Plan> {
    // Every reply in the dataset (drafts included), as child -> parent.
    const replies: { _id: string; parent: string }[] = await client.fetch(
      `*[_type == "comment" && defined(parent._ref)]{ _id, "parent": parent._ref }`
    );
    const children = new Map<string, Set<string>>();
    for (const r of replies) {
      const parent = stripDraft(r.parent);
      if (!children.has(parent)) children.set(parent, new Set());
      children.get(parent)!.add(stripDraft(r._id));
    }

    // Walk down the tree from the selected comment.
    const commentIds: string[] = [];
    const queue = [rootId];
    const seen = new Set<string>();
    while (queue.length) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      commentIds.push(id);
      children.get(id)?.forEach(child => queue.push(child));
    }

    // Private email documents of those comments.
    const emailIds: string[] = await client.fetch(
      `*[_type == "commentEmail" && (commentId in $ids || _id in $emailIds)]._id`,
      { ids: commentIds, emailIds: commentIds.map(id => EMAIL_PREFIX + id) }
    );

    return { commentIds, emailIds };
  }

  async function runDelete(current: Plan) {
    setBusy(true);
    try {
      const tx = client.transaction();
      // Delete replies first, then the root (order doesn't matter inside one
      // transaction, but it reads naturally). Deleting a missing id is a no-op.
      for (const id of [...current.commentIds].reverse()) {
        tx.delete(`drafts.${id}`);
        tx.delete(id);
      }
      current.emailIds.forEach(id => tx.delete(id));
      await tx.commit({ visibility: "async" });

      toast.push({
        status: "success",
        title: "Comment deleted",
        description: `${current.commentIds.length} comment(s) and ${current.emailIds.length} stored email(s) removed.`
      });
      setPlan(null);
      props.onComplete();
    } catch (error: any) {
      toast.push({
        status: "error",
        title: "Could not delete the comment",
        description: error?.message
      });
      setBusy(false);
    }
  }

  const replies = plan ? plan.commentIds.length - 1 : 0;

  return {
    label: busy ? "Deleting…" : "Delete with replies",
    icon: TrashIcon,
    tone: "critical",
    disabled: busy || (!props.published && !props.draft),
    onHandle: async () => {
      try {
        setPlan(await buildPlan());
      } catch (error: any) {
        toast.push({
          status: "error",
          title: "Could not load the replies",
          description: error?.message
        });
      }
    },
    dialog: plan
      ? {
          type: "confirm",
          tone: "critical",
          message: `Delete this comment${
            replies > 0
              ? ` and the ${replies} ${replies === 1 ? "reply" : "replies"} below it`
              : ""
          }, plus ${plan.emailIds.length} stored email(s)? This cannot be undone.`,
          onCancel: () => {
            setPlan(null);
            props.onComplete();
          },
          onConfirm: () => runDelete(plan)
        }
      : null
  };
};

export const commentCascadeDelete = definePlugin({
  name: "comment-cascade-delete",
  document: {
    actions: (prev, { schemaType }) => {
      if (schemaType !== "comment") return prev;
      // Swap the built-in Delete (which fails when replies reference the
      // comment, and would leave the emails behind) for the cascade version.
      return [
        ...prev.filter(({ action }) => action !== "delete"),
        DeleteCommentWithReplies
      ];
    }
  }
});
