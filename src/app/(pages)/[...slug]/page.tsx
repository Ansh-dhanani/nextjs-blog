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
  params: { slug: string[] };
};

const Page = ({ params }: TPostProp) => {
  const dispatch = useAppDispatch();
  const postId = params.slug.slice(1).join("/");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["posts", postId],
    queryFn: async (): Promise<TPost> => {
      const { data } = await axios.get(`/api/posts/${postId}`);
      return data;
    },
    retry: 1,
    onSuccess: () => {
      dispatch(setProgress(100));
    },
  });

  if (isError) {
    dispatch(setProgress(100));
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return (
        <div className="flex h-[calc(100vh-80px)] items-center justify-center p-5 w-full bg-white">
          <div className="text-center">
            <div className="inline-flex rounded-full bg-yellow-100 p-4">
              <div className="rounded-full stroke-yellow-600 bg-yellow-200 p-4">
                <svg
                  className="w-16 h-16"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.0002 9.33337V14M14.0002 18.6667H14.0118M25.6668 14C25.6668 20.4434 20.4435 25.6667 14.0002 25.6667C7.55684 25.6667 2.3335 20.4434 2.3335 14C2.3335 7.55672 7.55684 2.33337 14.0002 2.33337C20.4435 2.33337 25.6668 7.55672 25.6668 14Z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </div>
            </div>
            <h1 className="mt-5 text-[36px] font-bold text-slate-800 lg:text-[50px]">
              404 - Post not found
            </h1>
            <p className="text-slate-600 mt-5 lg:text-lg">
              The post you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      );
    }
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