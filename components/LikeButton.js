"use client";
import { useState } from "react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

const LikeButton = ({ postId, initialLikes }) => {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    if (liked) return;

    setLiked(true);
    setLikes(likes + 1);

    await fetch("/api/post/updateLikes", {
      method: "POST",
      body: JSON.stringify({ postId }),
      headers: { "Content-Type": "application/json" },
    });
  };

  return (
    <button onClick={handleLike} className="group relative flex items-center">
      <div className="relative h-[22px] w-[22px]">
        {/* Outline Heart (default) */}
        <AiOutlineHeart
          className={`
            absolute h-[22px] w-[22px] transition-all duration-200
            ${liked ? "opacity-0" : "opacity-100 group-hover:opacity-0"}
          `}
        />

        {/* Filled Heart */}
        <AiFillHeart
          className={`
            absolute h-[22px] w-[22px] text-red-500 transition-all duration-200
            ${liked ? "scale-110 opacity-100" : "opacity-0 group-hover:scale-110 group-hover:opacity-100"}
          `}
        />
      </div>

      <p className="ml-2">{likes}</p>
    </button>
  );
};

export default LikeButton;
