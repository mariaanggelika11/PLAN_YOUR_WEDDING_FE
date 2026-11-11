import type { ImgHTMLAttributes } from "react";

/** Authenticated attachments and browser-owned blob URLs must be rendered in the browser. */
export function AttachmentImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element -- The optimizer cannot fetch authenticated blob URLs.
  return <img {...props} alt={props.alt ?? ""} />;
}
