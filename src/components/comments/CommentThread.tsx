"use client";

import { Avatar, Button, useDisclosure } from "@heroui/react";
import Link from "next/link";
import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import { TComment, TPost } from "@/lib/types";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useQueryClient } from "@tanstack/react-query";

import Icon from "../Icon";
import AddReply from "./AddReply";
import CommentCard from "./CommentCard";
import AuthModal from "../AuthModal";

interface CommentThreadProps {
  comment: TComment;
  post: TPost;
  depth?: number;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  post,
  depth = 0,
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { user } = useAppSelector((state) => state.auth);
  const [openReplyInput, setOpenReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const queryClient = useQueryClient();

  const isLiked = comment.likes?.some((like) => like.userId === user?.id);

  const handleLike = async (commentId: string) => {
    if (!user) {
      onOpen();
      return;
    }
    setIsLiking(true);
    try {
      await axios.post("/api/comment/like", { commentId }, { withCredentials: true });
      queryClient.invalidateQueries(["comments", post.path]);
    } catch (error: any) {
      if (error.response) {
        toast.error(error.response.data.message || "Failed to like comment");
      } else {
        toast.error("Network error. Please try again.");
      }
      console.log(error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleReplyInput = () => {
    if (user === null) {
      onOpen();
    } else {
      setOpenReplyInput(!openReplyInput);
    }
  };

  const indentClass = depth > 0 ? "ml-8 border-l-2 border-gray-200 pl-4" : "";

  return (
    <div className={`flex md:gap-4 gap-2 pb-6 ${indentClass}`}>
      <Avatar
        fallback={comment.author.name}
        src={comment.author.avatar}
        as={Link}
        href={`/${comment.author.username}`}
        className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
      />
      <div className="flex-1">
        <CommentCard data={comment} type="comment" postPath={post.path} />
        <div className="flex items-center pt-2 gap-2">
          <button
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-200 ${
              isLiked ? "text-red-500" : "text-gray-600"
            } ${isLiking ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            onClick={() => handleLike(comment.id)}
            disabled={isLiking}
          >
            {isLiking ? (
              <div className="w-4 h-4 border border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
            ) : (
              <Icon
                name="heart"
                strokeWidth={1.25}
                fill={isLiked ? "currentColor" : "none"}
                size={16}
                className="flex-shrink-0"
              />
            )}
            <span>{comment.likes?.length || 0}</span>
          </button>
          <Button variant="light" size="sm" onClick={handleReplyInput}>
            <span>Reply</span>
          </Button>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="pt-2">
            {!showReplies ? (
              <Button
                variant="light"
                size="sm"
                className="text-primary hover:underline"
                onClick={() => setShowReplies(true)}
              >
                {comment._count.replies} Replies
              </Button>
            ) : (
              <div>
                <Button
                  variant="light"
                  size="sm"
                  className="text-primary hover:underline"
                  onClick={() => setShowReplies(false)}
                >
                  Hide Replies
                </Button>
                {comment.replies.map((reply) => (
                  <CommentThread
                    key={reply.id}
                    comment={reply}
                    post={post}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {openReplyInput && (
          <AddReply
            user={user}
            commentId={comment.id}
            postPath={post.path}
          />
        )}
      </div>
      <AuthModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </div>
  );
};

export default CommentThread;