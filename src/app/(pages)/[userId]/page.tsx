"use client";

import Icon from "@/components/Icon";
import PostCard from "@/components/posts/PostCard";
import ProfileDetails from "@/components/profile/ProfileDetails";
import { useAppSelector } from "@/hooks/reduxHooks";
import { TUser } from "@/lib/types";
import axios from "axios";
import clsx from "clsx";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

const Page = ({ params }: { params: { userId: string } }): JSX.Element => {
  const { moreInfo } = useAppSelector((state) => state.user);

  const { data, isLoading, isError } = useQuery(["user", params.userId], {
    queryFn: async (): Promise<TUser | null> => {
      try {
        const { data } = await axios.get(`/api/users/${params.userId}`);
        return data;
      } catch (error: any) {
        console.log(error);
        return null;
      }
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center sm:h-[calc(100vh_-_100px)] h-[calc(100dvh_-_100px)]">
        Loading...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center sm:h-[calc(100vh_-_100px)] h-[calc(100dvh_-_100px)]">
        User not found
      </div>
    );
  }

  return (
    <>
      {data && (
        <main className="bg-neutral-100">
          <ProfileDetails user={data} />
          <section className="py-3 grid grid-cols-1 md:grid-cols-[250px_1fr] md:w-[80%] m-auto gap-4">
            <aside>
              <div
                className={clsx(
                  moreInfo ? "max-md:grid" : "max-md:hidden",
                  "bg-white rounded-md p-4 md:grid gap-4 text-neutral-600"
                )}
              >
                <div className="flex items-center gap-4">
                  <span>
                    <Icon strokeWidth={1.25} name="newspaper" />
                  </span>
                  <span>{data.posts.length} posts published</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>
                    <Icon strokeWidth={1.25} name="message-circle" />
                  </span>
                  <span>{data.comment.length} comments written </span>
                </div>
                <div className="flex items-center gap-4">
                  <span>
                    <Icon strokeWidth={1.25} name="users" />
                  </span>
                  <span>{data.follower.length} followers</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>
                    <Icon strokeWidth={1.25} name="user-plus" />
                  </span>
                  <span>{data.following.length} following</span>
                </div>
              </div>
            </aside>
            <div>
              <Tabs aria-label="User content" className="mb-4">
                <Tab key="posts" title="Posts">
                  {data.posts.length > 0 ? (
                    data.posts.map((post) => <PostCard post={post} key={post.id} />)
                  ) : (
                    <div className="p-4 rounded-md bg-white">
                      @{data.username} has not published any post yet!
                    </div>
                  )}
                </Tab>
                <Tab key="followers" title={`Followers (${data.follower.length})`}>
                  <Card>
                    <CardBody>
                      {data.follower.length > 0 ? (
                        <div className="grid gap-4">
                          {data.follower.map((user) => (
                            <Link key={user.id} href={`/${user.username}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50">
                              <Image
                                src={user.avatar || "https://res.cloudinary.com/dayo1mpv0/image/upload/v1683686792/default/profile.jpg"}
                                alt={user.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full"
                              />
                              <div>
                                <h3 className="font-semibold">{user.name}</h3>
                                <p className="text-sm text-gray-600">@{user.username}</p>
                                {user.bio && <p className="text-sm text-gray-500">{user.bio}</p>}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500">No followers yet</p>
                      )}
                    </CardBody>
                  </Card>
                </Tab>
                <Tab key="following" title={`Following (${data.following.length})`}>
                  <Card>
                    <CardBody>
                      {data.following.length > 0 ? (
                        <div className="grid gap-4">
                          {data.following.map((user) => (
                            <Link key={user.id} href={`/${user.username}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50">
                              <Image
                                src={user.avatar || "https://res.cloudinary.com/dayo1mpv0/image/upload/v1683686792/default/profile.jpg"}
                                alt={user.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full"
                              />
                              <div>
                                <h3 className="font-semibold">{user.name}</h3>
                                <p className="text-sm text-gray-600">@{user.username}</p>
                                {user.bio && <p className="text-sm text-gray-500">{user.bio}</p>}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500">Not following anyone yet</p>
                      )}
                    </CardBody>
                  </Card>
                </Tab>
              </Tabs>
            </div>
          </section>
        </main>
      )}
    </>
  );
};

export default Page;
