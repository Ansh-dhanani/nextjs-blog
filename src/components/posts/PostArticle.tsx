"use client";

import { TPost } from "@/lib/types";

import { Button, ButtonGroup, User, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";

import Link from "next/link";

import Image from "next/image";
import React, { useState, useCallback, useEffect } from "react";

import Comments from "../comments/Comments";

import Blocks from "editorjs-blocks-react-renderer";
import moment from "moment";
import { useAppSelector } from "@/hooks/reduxHooks";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import DeletePostModal from "./DeletePostModal";
import { useRouter } from "next/navigation";
import LikeButton from "./LikeButton";

// Custom image renderer for responsive images
const ImageRenderer = ({ data, onImageClick }: any) => {
  const { file, caption, withBorder, withBackground, stretched } = data;

  return (
    <div className={`mb-4 ${stretched ? 'w-full' : 'max-w-full'}`}>
      <div
        className={`relative w-full h-auto cursor-pointer hover:opacity-90 transition-opacity ${withBorder ? 'border border-gray-300 rounded' : ''} ${withBackground ? 'bg-gray-100 p-2' : ''}`}
        style={{
          minHeight: '200px',
          display: 'block'
        }}
        onClick={() => onImageClick && onImageClick(file.url, caption)}
      >
        <Image
          src={file.url}
          alt={caption || 'Article image'}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      {caption && (
        <p className="text-sm text-gray-600 mt-2 text-center italic">
          {caption}
        </p>
      )}
    </div>
  );
};

const PostArticle = ({ post }: { post: TPost }) => {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<{ src: string; caption?: string } | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();

  const handleImageClick = (src: string, caption?: string) => {
    setSelectedImage({ src, caption });
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  };

  const { user } = useAppSelector((state) => state.auth);

  return (
    <>
      <article className="pb-4">
        <header>
          {post.image !== null && (
            <figure className="w-full max-h-[350px] mb-4">
              <Image
                src={post.image}
                width={400}
                height={200}
                className="w-full h-full object-scale-down max-h-[350px] md:aspect-[5/2] aspect-[4/2] cursor-pointer hover:opacity-90 transition-opacity"
                alt={post.title}
                onClick={() => handleImageClick(post.image!, post.title)}
              />
            </figure>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-gray-200 text-gray-600"
                >
                  #{tag.label}
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center">
            <User
              name={post.author.name}
              as={Link}
              href={`/${post.author.username}`}
              description={
                <div className="text-default-500">
                  Posted on: (
                  {moment(post.createdAt, moment.ISO_8601).format("DD MMM")} ){" "}
                  {moment(
                    post.createdAt,
                    moment.ISO_8601,
                    "DDMMMYYYY"
                  ).fromNow()}
                </div>
              }
              avatarProps={{
                src: `${post.author.avatar}`,
                name: post.author.name,
              }}
              className=""
            />
            {user && user.id === post.author.id ? (
              <ButtonGroup radius="sm">
                <Button
                  className=""
                  size="sm"
                  onPress={() =>
                    router.push(`/${post.author.username}/${post.path}/edit`)
                  }
                >
                  Edit
                </Button>
                <Button color="danger" size="sm" onClick={onOpen}>
                  Delete
                </Button>
              </ButtonGroup>
            ) : null}
          </div>
          <h1 className="mb-6 mt-4 scroll-m-20 lg:text-5xl md:text-4xl text-3xl sm:font-extrabold font-bold tracking-tight">
            {post.title}
          </h1>
        </header>
        <div className="prose">
          {/* Support both Editor.js format ({ blocks: [...] }) and legacy Quill format ({ ops: [...] }).
              If it's Quill delta, convert ops -> Editor.js paragraph blocks so the renderer won't break. */}
          {post.content ? (
            (() => {
              const content = post.content as any;
              let editorData = content;

              if (!content.blocks && content.ops) {
                editorData = {
                  time: Date.now(),
                  version: "2.0",
                  blocks: (content.ops || []).map((op: any) => ({
                    type: "paragraph",
                    data: { text: typeof op.insert === "string" ? op.insert : "" },
                  })),
                };
              }

              // Defensive check: ensure blocks is an array
              if (!editorData.blocks || !Array.isArray(editorData.blocks)) {
                return <div>No content available.</div>;
              }

              return (
                <Blocks
                  data={editorData}
                  renderers={{
                    checkList: Checklist,
                    image: (props: any) => <ImageRenderer {...props} onImageClick={handleImageClick} />,
                  }}
                />
              );
            })()
          ) : (
            <div>No content available.</div>
          )}
        </div>
      </article>

      {/* Like Button Section */}
      <div className="flex justify-center py-6">
        <LikeButton post={post} />
      </div>

      <hr className="pb-8" />
      <Comments post={post} />

      {/* ===IMAGE PREVIEW MODAL=== */}
      <ImagePreviewModal
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        imageSrc={selectedImage?.src || ""}
        caption={selectedImage?.caption}
      />

      {/* ===DELETE MODAL=== */}
      <DeletePostModal
        isOpen={isOpen}
        onClose={onClose}
        onOpenChange={onOpenChange}
        post={post}
        type="single post"
      />
    </>
  );
};

export default PostArticle;

const Checklist = ({ data, className = "my-2" }: any) => {
  return (
    <>
      {data?.items.map((item: any, i: any) => (
        <p key={i} className={className}>
          <label>
            <input type="checkbox" checked={item.checked} /> {item.text}
          </label>
        </p>
      ))}
    </>
  );
};
