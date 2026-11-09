import { useState, useEffect, useRef } from "react";

export default function CommentSection({ postId, comments, onCommentPosted }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [allComments, setAllComments] = useState(comments);
  const [replyingTo, setReplyingTo] = useState(null); // ✅ Track reply target
  const [nestedComments, setNestedComments] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null); // Track success message
  const [errorMessage, setErrorMessage] = useState(null); // Track error message

  // Create a reference for the username input field
  const usernameInputRef = useRef(null);

  useEffect(() => {
    setAllComments(comments);
    setNestedComments(buildNestedComments(comments));
  }, [comments]);

  const handleSubmit = async (e, parentId) => {
    e.preventDefault();
    if (!newComment.trim() || !username.trim()) return;

    setLoading(true);

    const res = await fetch("/api/submitComment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        author: username,
        email: email.trim() || null, // Stored privately, never shown publicly
        text: newComment,
        parent: parentId || null, // Use parentId passed as argument
      }),
    });

    if (res.ok) {
      setReplyingTo(null);
      setNewComment("");
      setUsername("");
      setEmail("");

      // Reload the comments from the live API so the list always matches the
      // database (including replies to comments posted in this same session).
      // The `comments` prop changes and the effect above rebuilds the tree.
      if (onCommentPosted) {
        await onCommentPosted();
      }

      // Set the success message
      setSuccessMessage("Comentário publicado com sucesso!");
      setErrorMessage(null);

      // Hide the success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } else {
      const errorData = await res.json();
      setErrorMessage(errorData.message || "Erro ao enviar comentário.");
      setSuccessMessage(null);
      
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }

    setLoading(false);
  };

  const buildNestedComments = (comments) => {
    const commentMap = new Map();
    comments.forEach((comment) =>
      commentMap.set(comment._id, { ...comment, replies: comment.replies || [] }) // Ensure replies is always an array
    );

    const nestedComments = [];
    comments.forEach((comment) => {
      if (comment.parent) {
        const parent = commentMap.get(comment.parent);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentMap.get(comment._id));
        }
      } else {
        nestedComments.push(commentMap.get(comment._id));
      }
    });

    return nestedComments;
  };

  const renderComments = (comments) => {
    return comments.map((comment) => (
      <div key={comment._id} className="rounded border p-4">
        <h4 className="font-semibold">{comment.author}</h4>
        <p className="mt-2">{comment.text}</p>
        <span className="text-xs text-gray-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={() => {
            setReplyingTo(comment._id); 
            // Focus on the username input field when replying
            if (usernameInputRef.current) {
              usernameInputRef.current.focus();
            }
          }} // Set the parent ID when replying
          className="ml-4 text-blue-500"
        >
          Responder
        </button>

        {/* Recursively render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-6 mt-2 border-l pl-4">
            {renderComments(comment.replies)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold">
        Comentários ({allComments.length}{" "}
        {allComments.length === 1 ? "comentário" : "comentários"})
      </h3>

      <form onSubmit={(e) => handleSubmit(e, replyingTo)} className="mt-4">
        <input
          ref={usernameInputRef} // Assign the ref to the input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-2 w-full rounded border p-2"
          placeholder="Digite seu nome"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-2"
          placeholder="Seu e-mail (opcional)"
          autoComplete="email"
          maxLength={254}
        />
        <p className="mb-2 mt-1 text-xs text-gray-500">
          Seu e-mail não será publicado. Ele é usado apenas para avisar você quando alguém responder o seu comentário.
        </p>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full rounded border p-2"
          placeholder={replyingTo ? "Responda ao comentário..." : "Escreva um comentário..."}
          required
        />
        <button type="submit" disabled={loading} className="mt-2 rounded bg-green-500 px-4 py-2 text-white">
          {loading ? "Enviando..." : replyingTo ? "Responder" : "Enviar Comentário"}
        </button>
        {replyingTo && (
          <button type="button" onClick={() => setReplyingTo(null)} className="ml-2 rounded bg-gray-300 px-4 py-2 text-black">
            Cancelar
          </button>
        )}
      </form>

      {/* Display success message */}
      {successMessage && (
        <div className="mt-4 text-green-500 font-semibold">
          {successMessage}
        </div>
      )}

      {/* Display error message */}
      {errorMessage && (
        <div className="mt-4 text-red-500 font-semibold">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {renderComments(nestedComments)}
      </div>
    </div>
  );
}
