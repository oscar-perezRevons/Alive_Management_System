import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import streamifier from 'streamifier';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export const isCloudinaryConfigured = (): boolean => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string = 'alive_uploads',
  filename?: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const ext = filename ? path.extname(filename).toLowerCase() : '';
    const isPdf = ext === '.pdf';

    const options: any = {
      folder: `alive/${folder}`,
      resource_type: isPdf ? 'raw' : 'auto',
      use_filename: true,
      unique_filename: true
    };

    if (filename) {
      const nameWithoutExt = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      options.public_id = `${Date.now()}-${nameWithoutExt}`;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload returned empty result.'));
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const uploadFilePathToCloudinary = async (
  filePath: string,
  folder: string = 'alive_uploads'
): Promise<UploadApiResponse> => {
  const ext = path.extname(filePath).toLowerCase();
  const isPdf = ext === '.pdf';

  return cloudinary.uploader.upload(filePath, {
    folder: `alive/${folder}`,
    resource_type: isPdf ? 'raw' : 'auto',
    use_filename: true,
    unique_filename: true
  });
};

export const extractPublicIdFromUrl = (urlStr: string): string | null => {
  try {
    if (!urlStr || !urlStr.includes('cloudinary.com')) return null;
    const parts = urlStr.split('/upload/');
    if (parts.length < 2) return null;
    const afterUpload = parts[1];
    // Strip version prefix e.g. v17283912/
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    // Strip extension
    const publicId = withoutVersion.substring(0, withoutVersion.lastIndexOf('.')) || withoutVersion;
    return publicId;
  } catch (err) {
    return null;
  }
};

export const deleteFromCloudinary = async (urlOrPublicId: string): Promise<boolean> => {
  try {
    if (!urlOrPublicId) return false;
    const publicId = urlOrPublicId.includes('http')
      ? extractPublicIdFromUrl(urlOrPublicId)
      : urlOrPublicId;

    if (!publicId) return false;

    // Try deleting as image first, then raw if needed
    const res = await cloudinary.uploader.destroy(publicId);
    if (res.result === 'ok') return true;

    const rawRes = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    return rawRes.result === 'ok';
  } catch (error) {
    console.error('Error al eliminar archivo en Cloudinary:', error);
    return false;
  }
};

export default {
  cloudinary,
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  uploadFilePathToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl
};
