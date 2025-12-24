"use client";

import React from "react";
import Image from "next/image";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  User,
} from "@heroui/react";
import Icon from "@/components/Icon";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { TSavedPost } from "@/lib/types";
import Link from "next/link";
import { useAppSelector } from "@/hooks/reduxHooks";
import SideNav from "@/components/navbar/SideNav";

export default function ReadingListPage() {
  const { authStatus } = useAppSelector((state) => state.auth);

  const { data, isLoading, isError } = useQuery(["posts", "saved"], {
    queryFn: async (): Promise<TSavedPost[]> => {
      const { data } = await axios.get("/api/posts/saved", { withCredentials: true });
      return data;
    },
    enabled: authStatus,
    // keep previous data if any
    refetchOnWindowFocus: false,
  });

  return (
    <div className="lg:p-6 md:p-4 py-2">
      <div className="grid grid-cols-sm md:grid-cols-md lg:grid-cols-lg gap-4">
        <aside className="max-md:hidden relative">
          <SideNav />
        </aside>
        <main className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-4">Reading List</h1>

          {!authStatus ? (
            <Card shadow="none" radius="sm" className="border">
              <CardHeader className="text-xl font-semibold">Sign in to view your reading list</CardHeader>
              <CardBody>
                Saved posts are associated with a user. Please sign in to access or manage your reading list.
              </CardBody>
              <CardFooter className="flex gap-2">
                <Button as={Link} href="/signin" variant="ghost" color="primary" radius="sm">Sign in</Button>
                <Button as={Link} href="/signup" variant="light" radius="sm">Create account</Button>
              </CardFooter>
            </Card>
          ) : isLoading ? (
            <div>Loading…</div>
          ) : isError ? (
            <div>Failed to load saved posts.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data && data.length > 0 ? (
                data.map((saved) => (
                  <Card key={saved.id} radius="sm" shadow="none" className="border p-3">
                    <CardBody className="p-3 pb-0">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <Link
                            className="font-semibold break-all hover:text-primary-600 block truncate"
                            href={`/${saved.post.author.username}/${saved.post.path}`}
                          >
                            {saved.post.title}
                          </Link>
                        </div>
                        <div className="w-20 h-16 md:w-28 md:h-20 overflow-hidden rounded-md flex-shrink-0">
                          <Image
                            src={saved.post.image ?? saved.post.author.avatar}
                            alt={saved.post.title}
                            width={112}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                    </CardBody>
                    <CardFooter className="p-3 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <User
                          name={saved.post.author.name}
                          description={"@" + saved.post.author.username}
                          avatarProps={{ src: saved.post.author.avatar, name: saved.post.author.name }}
                          as={Link}
                          href={`/${saved.post.author.username}`}
                        />
                      </div>
                      <div className="ml-2">
                        <Button isIconOnly variant="light" size="sm">
                          {/* Saved/bookmarked icon */}
                          <Icon name="bookmark-fill" strokeWidth={1.25} className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card shadow="none" className="border">
                  <CardBody>
                    <div className="text-center py-8">No saved posts yet. Start saving posts to build your reading list.</div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
