import { API_BASE_URL } from "../../services/api.client";
import type { NodeMaterialResponse } from "../../services/learningPath.service";

// File /uploads cũ là URL tương đối → prefix BE; URL Cloudinary đã tuyệt đối.
export function resolveAssetUrl(url?: string): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
}

// Nhận diện link video để nhúng xem trước: YouTube, Vimeo, hoặc file video trực tiếp.
function getVideoEmbed(raw: string): { kind: "youtube" | "vimeo" | "file" | "none"; src: string } {
  const url = (raw || "").trim();
  if (!url) return { kind: "none", src: "" };
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: "youtube", src: `https://www.youtube.com/embed/${yt[1]}` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "vimeo", src: `https://player.vimeo.com/video/${vm[1]}` };
  if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url)) return { kind: "file", src: url };
  return { kind: "none", src: "" };
}

export function VideoPreview({ url }: { url: string }) {
  const embed = getVideoEmbed(url);
  if (embed.kind === "none") {
    return (
      <p className="text-[11px] text-amber-600">
        Chưa xem trước được — hỗ trợ link YouTube, Vimeo hoặc file video (.mp4, .webm…).
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-black">
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        {embed.kind === "file" ? (
          <video src={embed.src} controls className="absolute inset-0 h-full w-full" />
        ) : (
          <iframe
            src={embed.src}
            title="Xem trước video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Xem trước học liệu inline (read-only):
 * - Ảnh → <img>; PDF → <iframe>; video file → <video>; video link → embed.
 * - Word/Excel/PPT → Microsoft Office Online viewer (cần URL công khai, vd Cloudinary).
 * - Còn lại / Office trên localhost → link mở/tải.
 */
export function MaterialPreview({ material }: { material: NodeMaterialResponse }) {
  if (material.video?.videoUrl) {
    return (
      <div className="mt-2">
        <VideoPreview url={material.video.videoUrl} />
      </div>
    );
  }

  const file = material.file;
  if (!file?.fileUrl) return null;

  const url = resolveAssetUrl(file.fileUrl);
  const type = (file.fileType || "").toLowerCase();
  const isImage = type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(file.fileUrl);
  const isPdf = type.includes("pdf") || /\.pdf(\?.*)?$/i.test(file.fileUrl);
  const isVideoFile = type.startsWith("video/") || /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(file.fileUrl);
  const isOffice =
    /\.(docx?|xlsx?|pptx?)(\?.*)?$/i.test(file.fileUrl) ||
    /word|excel|powerpoint|officedocument|ms-?excel|ms-?word|ms-?powerpoint/i.test(type);
  // Office Online viewer chỉ fetch được URL công khai (không phải localhost).
  const isPublicHttp = /^https?:\/\//i.test(url) && !/localhost|127\.0\.0\.1/i.test(url);

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-2 block">
        <img
          src={url}
          alt={material.title}
          loading="lazy"
          className="max-h-72 w-full rounded-md border border-slate-200 bg-white object-contain"
        />
      </a>
    );
  }

  if (isVideoFile) {
    return (
      <div className="mt-2 overflow-hidden rounded-md border border-slate-200 bg-black">
        <video src={url} controls className="w-full" />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="mt-2">
        <iframe src={url} title={material.title} className="h-96 w-full rounded-md border border-slate-200 bg-white" />
        <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-indigo-600 hover:underline">
          Mở PDF ↗
        </a>
      </div>
    );
  }

  if (isOffice && isPublicHttp) {
    const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    return (
      <div className="mt-2">
        <iframe
          src={officeSrc}
          title={material.title}
          className="h-96 w-full rounded-md border border-slate-200 bg-white"
        />
        <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-indigo-600 hover:underline">
          Mở / tải bản gốc ↗
        </a>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
    >
      Mở tài liệu ↗{file.fileType ? <span className="text-slate-400">({file.fileType})</span> : null}
    </a>
  );
}
