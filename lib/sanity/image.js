import createImageUrlBuilder from "@sanity/image-url";
import { dataset, projectId } from "@/lib/sanity/config";

const imageBuilder = createImageUrlBuilder({ projectId, dataset });

export const urlForImage = source => {
  if (!source || !source.asset) return;
  const dimensions = source?.asset?._ref.split("-")[2];

  const [width, height] = dimensions
    ?.split("x")
    .map(num => parseInt(num, 10));

  const url = imageBuilder
    .image(source)
    .auto("format")
    .width(Math.min(width, "2000"))
    .url();

  return {
    src: url,
    width: width,
    height: height
  };
};

/** Small, cropped image URL (e.g. the sidebar thumbnails). */
export const urlForThumbnail = (source, width, height) => {
  if (!source?.asset) return null;
  return imageBuilder
    .image(source)
    .width(width)
    .height(height)
    .fit("crop")
    .auto("format")
    .url();
};
