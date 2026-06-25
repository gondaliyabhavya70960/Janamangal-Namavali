"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpload } from "@/hooks/use-upload";
import { ACCEPTED_AUDIO_EXTENSIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ACCEPT = ACCEPTED_AUDIO_EXTENSIONS.join(",");

/** Big drag-and-drop target used on the empty library + an upload page. */
export function UploadDropzone({ className }: { className?: string }) {
  const { uploading, progress, uploadFiles } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        void uploadFiles(e.dataTransfer.files);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border/70 px-6 py-16 text-center transition-colors",
        dragOver && "border-primary bg-primary/5",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        className={cn(
          "grid size-16 place-items-center rounded-2xl bg-muted text-muted-foreground transition-colors",
          dragOver && "bg-primary/15 text-primary",
        )}
      >
        {uploading ? <Loader2 className="size-7 animate-spin" /> : <UploadCloud className="size-7" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">
          {uploading ? `Importing ${progress.done}/${progress.total}…` : "Drop your tracks here"}
        </h3>
        <p className="text-sm text-muted-foreground">
          mp3 · wav · m4a · flac · ogg · aac — stored privately on your device.
        </p>
      </div>
      <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
        <UploadCloud className="size-4" /> Choose files
      </Button>
    </div>
  );
}

/** Compact upload button for toolbars/headers. */
export function UploadButton({ className }: { className?: string }) {
  const { uploading, uploadFiles } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button className={className} onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
        Upload
      </Button>
    </>
  );
}
