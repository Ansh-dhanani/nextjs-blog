"use client";

import React, { useState } from "react";
import Icon from "../Icon";
import { TPost } from "@/lib/types";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { setProgress } from "@/redux/commonSlice";
import { useQueryClient } from "@tanstack/react-query";

const LikeButton = ({ post }: { post: TPost }) => {
  const dispatch = useAppDispatch();
  const [isLiking, setIsLiking] = useState(false);

  const { authStatus, user } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();

  const isLiked = post.likes?.some((like) => like.userId === user?.id);

  async function handleLike(postID: string) {
    if (!user) return;
    setIsLiking(true);
    try {
      dispatch(setProgress(70));
      await axios.post("/api/posts/like", { postId: postID }, { withCredentials: true });
      queryClient.invalidateQueries(["posts"]);
      queryClient.invalidateQueries(["posts", postID]);
      dispatch(setProgress(100));
    } catch (error: any) {
      dispatch(setProgress(100));
      if (error.response) {
        toast.error(error.response.data.message || "Failed to like post");
      } else {
        toast.error("Network error. Please try again.");
      }
      console.log(error);
    } finally {
      setIsLiking(false);
    }
  }

  return (
    <button
      className={`flex items-center gap-3 px-6 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200 ${
        isLiked ? "text-red-500 border-red-300" : "text-gray-700"
      } ${!authStatus ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      onClick={() => handleLike(post.id)}
      disabled={!authStatus || isLiking}
    >
      {isLiking ? (
        <div className="w-6 h-6 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
      ) : (
        <Icon
          name="heart"
          strokeWidth={1.25}
          fill={isLiked ? "currentColor" : "none"}
          size={24}
          className="flex-shrink-0"
        />
      )}
      <span>{isLiked ? "Liked" : "Like"} ({post.likes?.length || 0})</span>
    </button>
  );
};

export default LikeButton;