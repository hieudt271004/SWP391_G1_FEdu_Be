import { http } from './http';


export interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

export interface UploadedFile {
  url: string; 
  publicId: string;
  format?: string;
  bytes?: number;
  originalFilename?: string;
  resourceType?: string;
}

export const uploadService = {
  getCloudinarySignature: (folder?: string) =>
    http.get<CloudinarySignature>(
      `/upload/cloudinary-signature${folder ? `?folder=${encodeURIComponent(folder)}` : ''}`
    ),

  
  

  uploadToCloudinary: async (file: File, folder?: string): Promise<UploadedFile> => {
    const sig = await uploadService.getCloudinarySignature(folder);

    const form = new FormData();
    form.append('file', file);
    form.append('api_key', sig.apiKey);
    form.append('timestamp', String(sig.timestamp));
    form.append('signature', sig.signature);
    form.append('folder', sig.folder);

    
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
      { method: 'POST', body: form }
    );

    if (!res.ok) {
      let msg = 'Tải tệp lên Cloudinary thất bại';
      try {
        const err = await res.json();
        msg = err?.error?.message || msg;
      } catch {
        
      }
      throw new Error(msg);
    }

    const data = await res.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      bytes: data.bytes,
      originalFilename: data.original_filename,
      resourceType: data.resource_type,
    };
  },
};
