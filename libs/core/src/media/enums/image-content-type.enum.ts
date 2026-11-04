/** Image formats accepted for product media. SVG is excluded: it can carry scripts. */
export enum ImageContentType {
  Jpeg = 'image/jpeg',
  Png = 'image/png',
  Webp = 'image/webp',
  Gif = 'image/gif',
}

export const IMAGE_FILE_EXTENSIONS: Record<ImageContentType, string> = {
  [ImageContentType.Jpeg]: 'jpg',
  [ImageContentType.Png]: 'png',
  [ImageContentType.Webp]: 'webp',
  [ImageContentType.Gif]: 'gif',
};
