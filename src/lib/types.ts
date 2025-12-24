export type TUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  posts: TPost[];
  follower: TUser[];
  followerIDs: string[];
  following: TUser[];
  followingIDs: string[];
  followingTags: [];
  site: string;
  createdAt: Date;
  updatedAt: Date;
  comment: [];
};

export type TTag = {
  id: string;
  label: string;
  value: string;
  description: string;
  color: string;
  userId: string[];
  postId: string[];
};

export type TPost = {
  id: string;
  title: string;
  image: string;
  content: any;
  path: string;
  author: TUser;
  tags: TTag[];
  views: number;
  type: "PUBLISHED" | "DRAFT";
  comments: TComment[];
  likes: TPostLike[];
  createdAt: Date;
  updatedAt: Date;
  saved: TSavedPost[];
  _count: {
    comments: number;
  };
};

export type TSavedPost = {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
  post: TPost;
};

export type TPostLike = {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
};

export type TCommentLike = {
  id: string;
  userId: string;
  commentId: string;
  createdAt: Date;
};

export type TNotification = {
  id: string;
  userId: string;
  fromUser: TUser;
  fromUserId: string;
  post: TPost;
  postId: string;
  comment?: TComment;
  commentId?: string;
  type: "like" | "comment" | "reply";
  isRead: boolean;
  createdAt: Date;
};

export type TComment = {
  id: string;
  content: string;
  author: TUser;
  authorId: string;
  post: TPost;
  postId: string;
  parentId?: string;
  parent?: TComment;
  replies: TComment[];
  createdAt: Date;
  updatedAt: Date;
  likes: TCommentLike[];
  _count: {
    replies: number;
    likes: number;
  };
};

export type TCommentReplyOption = {
  data: TComment;
  type: "comment" | "reply";
  postPath: string;
};

export type TResponseMessage = {
  success: boolean;
  message: string;
};

export type TError = {
  message: string;
  response: {
    data: {
      message: string;
    };
  };
};

export type PostType = "DRAFT" | "PUBLISHED";

type TReplyCountDashboard = {
  _count: {
    replies: number;
  };
};

type TPostDashboard = {
  id: string;
  path: string;
  title: string;
  views: number;
  type: PostType;
  createdAt: Date;
  comments: TReplyCountDashboard[];
  _count: {
    comments: number;
  };
};
export type TDashboard = {
  id: string;
  avatar: string;
  name: string;
  username: string;
  posts: TPostDashboard[];
  _count: {
    follower: number;
    comment: number;
    following: number;
    followingTags: number;
    posts: number;
    replies: number;
  };
};

export type TTags = {
  id: string;
  label: string;
  value: string;
  description: string;
  color: string;
  User: TUser;
  userId: string;
  Post: TPost;
  postId: string;
};
