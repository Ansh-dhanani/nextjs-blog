"use client";

import { useAppSelector } from "@/hooks/reduxHooks";
import { TNotification } from "@/lib/types";
import { Avatar, Button, Skeleton } from "@heroui/react";
import axios from "axios";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import Icon from "@/components/Icon";
import SideNav from "@/components/navbar/SideNav";

export default function Notifications() {
  const { user } = useAppSelector((state) => state.auth);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<TNotification[]> => {
      const { data } = await axios.get("/api/notifications");
      return data;
    },
    enabled: !!user,
  });

  const markAsRead = async (notificationId?: string) => {
    try {
      await axios.patch("/api/notifications", { notificationId });
      refetch();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="lg:p-6 md:p-4 py-2">
        <div className="grid grid-cols-sm md:grid-cols-md lg:grid-cols-lg gap-4">
          <aside className="max-md:hidden relative">
            <SideNav />
          </aside>
          <main className="lg:col-span-2">
            <h1 className="text-2xl font-bold mb-6">Notifications</h1>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border-b">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 md:p-4 py-2">
      <div className="grid grid-cols-sm md:grid-cols-md lg:grid-cols-lg gap-4">
        <aside className="max-md:hidden relative">
          <SideNav />
        </aside>
        <main className="lg:col-span-2">
          <div className="max-w-2xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Notifications</h1>
              {data && data.some((n) => !n.isRead) && (
                <Button size="sm" onClick={() => markAsRead()}>
                  Mark all as read
                </Button>
              )}
            </div>

            {!data || data.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="bell" size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex gap-4 p-4 rounded-lg border ${
                      !notification.isRead ? "bg-blue-50 border-blue-200" : "bg-white"
                    }`}
                  >
                    <Avatar
                      src={notification.fromUser.avatar}
                      name={notification.fromUser.name}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="text-sm">
                        <Link
                          href={`/${notification.fromUser.username}`}
                          className="font-semibold hover:underline"
                        >
                          {notification.fromUser.name}
                        </Link>{" "}
                        {notification.type === "like" && "liked your post"}
                        {notification.type === "comment" && "commented on your post"}
                        {notification.type === "reply" && "replied to your comment"}
                        {" "}
                        <Link
                          href={`/${user?.username}/${notification.post.path}`}
                          className="font-medium hover:underline"
                        >
                          {notification.post.title}
                        </Link>
                        {notification.comment && notification.type === "comment" && (
                          <span className="text-gray-600 block mt-1">
                            &ldquo;{notification.comment.content.slice(0, 100)}...&rdquo;
                          </span>
                        )}
                        {notification.comment && notification.type === "reply" && (
                          <span className="text-gray-600 block mt-1">
                            &ldquo;{notification.comment.content.slice(0, 100)}...&rdquo;
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="light"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
