"use client";

import { useAppSelector } from "@/hooks/reduxHooks";

import { Avatar, Button, useDisclosure } from "@heroui/react";

import Link from "next/link";
import React, { useState } from "react";
import axios from "axios";

import { TComment, TPost } from "@/lib/types";

import { useQuery } from "@tanstack/react-query";

import Icon from "../Icon";
import AddComment from "./AddComment";
import AddReply from "./AddReply";
import CommentThread from "./CommentThread";
import AuthModal from "../AuthModal";

const Comments = ({ post }: { post: TPost }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const { user } = useAppSelector((state) => state.auth);

  const [openReplyInput, setOpenReplyInput] = useState("");
  const [extentReplies, setExtendReplies] = useState("");

  const comments = useQuery({
    queryKey: ["comments", post.path],
    queryFn: async (): Promise<TComment[]> => {
      try {
        const { data } = await axios.get(`/api/comment?postId=${post.id}`);
        // Build tree from flat list
        const commentMap = new Map<string, TComment>();
        const rootComments: TComment[] = [];

        data.forEach((comment: any) => {
          comment.replies = [];
          commentMap.set(comment.id, comment);
        });

        data.forEach((comment: any) => {
          if (comment.parentId) {
            const parent = commentMap.get(comment.parentId);
            if (parent) {
              parent.replies.push(comment);
            }
          } else {
            rootComments.push(comment);
          }
        });

        return rootComments;
      } catch (error: any) {
        return [];
      }
    },
    enabled: !!post.id,
  });

  if (comments.isLoading) {
    return <>Loading...</>;
  }

  const handleReplyInput = (commentId: string) => {
    if (user === null) {
      onOpen();
    } else {
      setOpenReplyInput((prev) => (prev === commentId ? "" : commentId));
      setExtendReplies((prev) => (prev === commentId ? "" : ""));
    }
  };

  return (
    <section className="" id="comments">
      {/* ===COMMENT INPUT BOX=== */}
      <h4 className="text-2xl font-bold pb-6">
        Top Comments: {post._count.comments}
      </h4>
      <AddComment post={post} />
      {/* ===ALL COMMENTS=== */}
      <div className="pt-8">
        {comments.data && comments.data.length > 0
          ? comments.data.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                post={post}
              />
            ))
          : null}
      </div>

      <AuthModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </section>
  );
};

export default Comments;
