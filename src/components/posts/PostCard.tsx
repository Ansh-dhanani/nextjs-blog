"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  User,
} from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import Icon from "../Icon";
import { TPost } from "@/lib/types";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { setProgress } from "@/redux/commonSlice";
import { useQueryClient } from "@tanstack/react-query";

const PostCard = ({ post }: { post: TPost }) => {
  const dispatch = useAppDispatch();
  const [isSaving, setIsSaving] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const { authStatus, user } = useAppSelector((state) => state.auth);

  const queryClient = useQueryClient();

  const isLiked = post.likes?.some((like) => like.userId === user?.id);

  const handleCardClick = () => {
    window.location.href = `/${post.author.username}/${post.path}`;
  };

  async function handleSaveLetterPost(postID: string) {
    setIsSaving(true);
    try {
      dispatch(setProgress(70));
      const { data } = await axios.post("/api/posts/saved", { postID }, { withCredentials: true });
      queryClient.invalidateQueries(["posts", "saved"]);
      queryClient.invalidateQueries(["posts"]);
      dispatch(setProgress(100));
      toast.success(data.message);
    } catch (error: any) {
      dispatch(setProgress(100));
      if (error.response) {
        toast.error(error.response.data.message || "Failed to save post");
      } else {
        toast.error("Network error. Please try again.");
      }
      console.log(error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLike(postID: string) {
    if (!user) return;
    setIsLiking(true);
    try {
      dispatch(setProgress(70));
      await axios.post("/api/posts/like", { postId: postID }, { withCredentials: true });
      queryClient.invalidateQueries(["posts"]);
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
    <article className="mb-2 w-full">
      <Card 
        shadow="none" 
        radius="sm" 
        className="border cursor-pointer hover:shadow-md transition-shadow w-full"
        isPressable
        onPress={handleCardClick}
      >
        <CardHeader>
          <User
            name={post.author.name}
            description={"@" + post.author.username}
            avatarProps={{
              src: `${post.author.avatar}`,
              name: post.author.name,
            }}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to user profile
              window.location.href = `/${post.author.username}`;
            }}
          />
        </CardHeader>
        <CardBody className="py-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0">
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold hover:text-primary cursor-pointer">
                {post.title}
              </h3>
              <div className="pt-2 flex flex-wrap gap-2">
                {post.tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-600"
                  >
                    #{tag.label}
                  </span>
                ))}
              </div>
            </div>
            {post.image !== null && (
              <figure className="hidden md:block flex-1 w-full h-full max-w-[200px]">
                <Image
                  src={post.image}
                  width={200}
                  height={200}
                  alt="about image"
                  className="rounded-md object-cover w-full h-full aspect-[4/2]"
                />
              </figure>
            )}
          </div>
        </CardBody>
        <CardFooter className="justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="text-sm">{post.views} Views</div>
            <Button
              size="sm"
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3"
              variant="light"
              onClick={(e) => {
                e.stopPropagation();
                handleLike(post.id);
              }}
              isDisabled={!authStatus}
              isLoading={isLiking}
            >
              <Icon name={isLiked ? "heart-fill" : "heart"} strokeWidth={1.25} />
              <span className="text-sm">{post.likes?.length || 0}</span>
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3"
              variant="light"
              as={Link}
              href={`/${post.author.username}/${post.path}#comments`}
              onClick={(e) => e.stopPropagation()}
            >
              <Icon name="message-circle" strokeWidth={1.25} />
              <span className="text-sm">
                {post._count.comments}{" "}
                <span className="hidden sm:inline">Comments</span>
              </span>
            </Button>
          </div>
          <div>
            <Button
              size="sm"
              variant="light"
              isIconOnly
              onPress={() => handleSaveLetterPost(post.id)}
              onClick={(e) => e.stopPropagation()}
              isDisabled={!authStatus ? true : false}
              isLoading={isSaving}
            >
              <Icon
                name={
                  post.saved.some((saved) => saved.userId === user?.id)
                    ? "bookmark-fill"
                    : "bookmark"
                }
                strokeWidth={1.25}
              />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </article>
  );
};

export default PostCard;
