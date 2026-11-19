const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const parseImagePayload = (rawImage) => {
  if (typeof rawImage !== "string" || !rawImage.trim()) {
    return { error: "Image data is required." };
  }

  const dataUrlMatch = rawImage.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
  );

  const mimeType = dataUrlMatch
    ? dataUrlMatch[1].toLowerCase()
    : null;

  const base64 = dataUrlMatch
    ? dataUrlMatch[2]
    : rawImage.replace(/\s/g, "");

  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      error: "Unsupported image type. Use PNG, JPG, WEBP or GIF.",
    };
  }

  if (!base64 || !/^[A-Za-z0-9+/=]+$/.test(base64)) {
    return { error: "Invalid image data." };
  }

  const buffer = Buffer.from(base64, "base64");

  if (!buffer.length) {
    return { error: "Invalid image data." };
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    return { error: "Image is too large. Maximum size is 5 MB." };
  }

  return { base64, buffer };
};

// Upload an image to ImgBB (Authenticated users)
export const uploadImage = async (req, res) => {
  try {
    const { error, base64 } = parseImagePayload(req.body?.image);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Image upload is not configured on the server.",
      });
    }

    const form = new URLSearchParams();
    form.set("key", apiKey);
    form.set("image", base64);

    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: "POST",
      body: form,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success || !result?.data?.url) {
      console.error(
        "ImgBB upload failed:",
        result?.error?.message || response.status
      );

      return res.status(502).json({
        success: false,
        message: "Image upload failed. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      data: {
        url: result.data.url,
        displayUrl: result.data.display_url || result.data.url,
      },
    });
  } catch (error) {
    console.error("Image upload error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Image upload failed. Please try again.",
    });
  }
};
