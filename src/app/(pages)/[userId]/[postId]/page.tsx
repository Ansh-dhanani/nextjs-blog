"use client";
import PostArticle from "@/components/posts/PostArticle";
import UserProfileCard from "@/components/posts/UserProfileCard";
import { TPost } from "@/lib/types";
import axios from "axios";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Avatar,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
} from "@heroui/react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { setProgress } from "@/redux/commonSlice";

type TPostProp = {
  params: { postId: string };
};

const Page = ({ params }: TPostProp) => {
  const dispatch = useAppDispatch();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["posts", params.postId],
    queryFn: async (): Promise<TPost> => {
      const { data } = await axios.get(`/api/posts/${params.postId}`);
      return data;
    },
    retry: 1,
    onSuccess: () => {
      dispatch(setProgress(100));
    },
  });

  if (isError) {
    dispatch(setProgress(100));
    throw new Error("Oops something went wrong.");
  }

  if (isLoading) {
    dispatch(setProgress(70));
    return (
      <div className="sm:h-[calc(100vh_-_100px)] h-[calc(100dvh_-_100px)] text-xl flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <main className="flex flex-col items-center justify-center w-full px-5 lg:px-20 py-10 bg-slate-50">
        <section className="w-full">
          {data && Object.entries(data).length > 0 && (
            <PostArticle post={data} />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Page;
