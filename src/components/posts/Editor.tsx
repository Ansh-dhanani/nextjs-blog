"use client";

import { Button } from "@heroui/react";

import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";

import axios from "axios";
import { useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";

import TextareaAutosize from "react-textarea-autosize";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Icon from "../Icon";
import EditorJS from "@editorjs/editorjs";
import { convertImageToBase64 } from "@/utils/convertImageTobase64";
import { TPost } from "@/lib/types";
import ImagePreviewModal from "@/components/ImagePreviewModal";

type TForm = {
  title: string;
  image: Blob | MediaSource;
  postType: "DRAFT" | "PUBLISHED";
};

const Editor = ({ post }: { post: TPost | null }) => {
  const router = useRouter();
  const params = useParams();

  const {
    register,
    handleSubmit,
    reset,
    resetField,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<TForm>({ defaultValues: { title: post?.title } });
  const postType = watch("postType");

  const [imageFile, setImageFile] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState<string>("");
  const [previewImageCaption, setPreviewImageCaption] = useState<string>("");

  // tags UI state
  const [tagInput, setTagInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<
    Array<{ id?: string; label: string; value: string }>
  >(
    post?.tags
      ? post.tags.map((t: any) => ({
          id: t.id,
          label: t.label,
          value: t.value,
        }))
      : []
  );
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const suggestionTimeout = useRef<number | null>(null);

  const ref = useRef<EditorJS | undefined>(undefined);

  useEffect(() => {
    if (errors.title) {
      toast.error("Title can't be empty!");
    }
  }, [errors.title]);

  const onSubmitHandler: SubmitHandler<TForm> = async (data) => {
    try {
      const blocks = await ref.current?.save();

      const tagsToSend = selectedTags.map((t) => t.value);

      if (params.postId) {
        const res = await axios.patch(`/api/posts/${post?.path}`, {
          title: data.title,
          content: blocks,
          image: imageFile !== null ? imageFile : post?.image,
          type: data.postType,
          postId: post?.id,
          userId: post?.author.id,
          tags: tagsToSend,
        });
        toast.success(res.data.message);
        router.push(`/dashboard`);
      } else {
        const res = await axios.post("/api/posts", {
          title: data.title,
          content: blocks,
          image: imageFile,
          type: data.postType,
          tags: tagsToSend,
        });
        toast.success(res.data.message);
        if (data.postType === "DRAFT") {
          router.push(`/dashboard`);
        } else {
          router.push(
            `/${res.data.newPost.author.username}/${res.data.newPost.path}`
          );
        }
      }
      reset();
      setImageFile(null);
      ref?.current?.clear();
    } catch (error: any) {
      if (error.response) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message);
      }
      console.log(error);
    }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    const convertedImage = await convertImageToBase64(file);
    setImageFile(convertedImage);
  };

  const handleImagePreview = (src: string, caption?: string) => {
    setPreviewImageSrc(src);
    setPreviewImageCaption(caption || "Cover Image");
    setIsImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setIsImagePreviewOpen(false);
    setPreviewImageSrc("");
    setPreviewImageCaption("");
  };

  // Tag helpers
  const fetchSuggestions = async (q: string) => {
    try {
      setIsFetchingSuggestions(true);
      const { data } = await axios.get(
        `/api/tags/addTagInPost?q=${encodeURIComponent(q)}`
      );
      setSuggestions(data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const onTagInputChange = (v: string) => {
    setTagInput(v);
    if (suggestionTimeout.current)
      window.clearTimeout(suggestionTimeout.current);
    suggestionTimeout.current = window.setTimeout(() => {
      if (v.trim().length > 0) fetchSuggestions(v.trim());
      else setSuggestions([]);
    }, 250) as unknown as number;
  };

  const addTag = async (val: string) => {
    if (!val || selectedTags.some((t) => t.value === val)) return;
    // check existing suggestion
    const existing = suggestions.find(
      (s) => s.value.toLowerCase() === val.toLowerCase()
    );
    if (existing) {
      setSelectedTags((s) => [
        ...s,
        { id: existing.id, label: existing.label, value: existing.value },
      ]);
    } else {
      // create tag via API
      try {
        const { data } = await axios.post(`/api/tags`, {
          label: val,
          value: val,
        });
        if (data.tag)
          setSelectedTags((s) => [
            ...s,
            { id: data.tag.id, label: data.tag.label, value: data.tag.value },
          ]);
      } catch (error) {
        console.log(error);
      }
    }
    setTagInput("");
    setSuggestions([]);
  };

  const removeTag = (value: string) => {
    setSelectedTags((s) => s.filter((t) => t.value !== value));
  };

  const onTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (tagInput.trim().length > 0) addTag(tagInput.trim());
    } else if (e.key === "Backspace" && tagInput === "") {
      // remove last tag
      setSelectedTags((s) => s.slice(0, -1));
    }
  };

  const initEditor = useCallback(async () => {
    const EditorJS = (await import("@editorjs/editorjs")).default;
    const Header = (await import("@editorjs/header")).default;
    const Table = (await import("@editorjs/table")).default;
    const Embed = (await import("@editorjs/embed")).default;
    const List = (await import("@editorjs/list")).default;
    const Code = (await import("@editorjs/code")).default;
    const LinkTool = (await import("@editorjs/link")).default;
    const InlineCode = (await import("@editorjs/inline-code")).default;
    const Quote = (await import("@editorjs/quote")).default;
    const Raw = (await import("@editorjs/raw")).default;
    const CheckList = (await import("@editorjs/checklist")).default;

    if (!ref.current) {
      const editor = new EditorJS({
        holder: "editor",
        placeholder: "Write your post content here...",
        inlineToolbar: true,
        data: post?.content,
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              placeholder: "Enter a header",
              levels: [2, 3, 4, 5, 6],
              defaultLevel: 2,
            },
          },
          list: List,
          checkList: CheckList,
          embed: Embed,
          linkTool: LinkTool,
          inlineCode: InlineCode,
          table: Table,
          quote: Quote,
          code: Code,
          raw: Raw,
        },
        onReady: () => {
          ref.current = editor;
        },
      });
    }
  }, [post]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMounted(true);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      initEditor();

      return () => {
        ref.current && ref.current.destroy;
        ref.current === undefined;
      };
    }
  }, [isMounted, initEditor]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmitHandler)} className="h-full">
      <nav className="bg-transparent flex justify-between md:px-6 px-2 py-2 items-center">
        <Button
          radius="sm"
          variant="light"
          aria-label="Back button"
          onPress={() => router.back()}
        >
          <Icon name="chevron-left" /> back
        </Button>

        {post && post.type === "PUBLISHED" ? (
          <div>
            <Button
              variant="light"
              color="primary"
              radius="sm"
              type="submit"
              isDisabled={
                postType === "PUBLISHED" && isSubmitting ? true : false
              }
              isLoading={
                postType === "PUBLISHED" && isSubmitting ? true : false
              }
              onClick={() => setValue("postType", "PUBLISHED")}
            >
              {postType === "PUBLISHED" && isSubmitting
                ? "Saving..."
                : "Save changes"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button
              variant="light"
              color="primary"
              radius="sm"
              type="submit"
              isDisabled={postType === "DRAFT" && isSubmitting ? true : false}
              isLoading={postType === "DRAFT" && isSubmitting ? true : false}
              onClick={() => setValue("postType", "DRAFT")}
            >
              {postType === "DRAFT" && isSubmitting
                ? "Saving..."
                : "Save Draft"}
            </Button>
            <Button
              color="primary"
              radius="sm"
              type="submit"
              isDisabled={
                postType === "PUBLISHED" && isSubmitting ? true : false
              }
              isLoading={
                postType === "PUBLISHED" && isSubmitting ? true : false
              }
              onClick={() => setValue("postType", "PUBLISHED")}
            >
              {postType === "PUBLISHED" && isSubmitting
                ? "publishing..."
                : "Publish"}
            </Button>
          </div>
        )}
      </nav>

      <div className="max-md:px-4 h-full overflow-y-auto">
        <div className="max-w-[650px] m-auto">
          <div className="flex flex-col gap-8 ">
            {!imageFile && !post?.image && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-500 mb-4">
                  <svg
                    className="mx-auto mb-2"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  <p className="text-sm">Upload a cover image</p>
                  <p className="text-xs">Recommended size: 1200x600px</p>
                </div>
                <Button
                  color="primary"
                  variant="ghost"
                  onPress={() =>
                    document.getElementById("image-upload")?.click()
                  }
                >
                  Choose Image
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  {...register("image")}
                  onChange={handleImage}
                  className="hidden"
                />
              </div>
            )}
            {imageFile && (
              <figure className="relative w-full h-[300px] pt-2">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="absolute -top-2 -right-4 text-red-500 "
                  onClick={() => {
                    setImageFile(null), resetField("image");
                  }}
                >
                  <Icon name="x" />
                </Button>
                <Image
                  src={imageFile}
                  width={100}
                  height={100}
                  alt="post image"
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImagePreview(imageFile, "Cover Image")}
                />
              </figure>
            )}
            {post && post.image !== null && !imageFile && (
              <Image
                src={post.image}
                alt={post.title}
                width={100}
                height={100}
                className="cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleImagePreview(post.image!, post.title)}
              />
            )}
            <div className="flex-1">
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Tags</label>
                <div className="flex items-center flex-wrap gap-2">
                  {selectedTags.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className="px-2 py-1 rounded bg-gray-100 text-sm flex items-center gap-2"
                      onClick={() => removeTag(t.value)}
                    >
                      <span>{t.label}</span>
                      <span className="text-xs text-gray-500">×</span>
                    </button>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => onTagInputChange(e.target.value)}
                    onKeyDown={onTagKeyDown}
                    placeholder="Add a tag and press Enter"
                    className="outline-none text-sm flex-1 min-w-[120px]"
                  />
                </div>
                {suggestions.length > 0 && tagInput.length > 0 && (
                  <div className="mt-2 border rounded bg-white shadow-sm p-2 max-h-40 overflow-auto">
                    {suggestions.map((s) => (
                      <div
                        key={s.id}
                        className="py-1 px-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => addTag(s.value)}
                      >
                        {s.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <TextareaAutosize
            {...register("title", { required: true })}
            aria-label="Post Title"
            placeholder="New post title here..."
            className="lg:text-5xl md:text-4xl text-3xl leading-tight resize-none w-full md:font-extrabold font-bold outline-none text-[rgb(68, 64, 60)]"
          />
        </div>
        <div id="editor" className="prose max-w-full" />
      </div>
    </form>

    {/* Image Preview Modal */}
    <ImagePreviewModal
      isOpen={isImagePreviewOpen}
      onClose={closeImagePreview}
      imageSrc={previewImageSrc}
      caption={previewImageCaption}
    />
    </>
  );
};

export default Editor;
