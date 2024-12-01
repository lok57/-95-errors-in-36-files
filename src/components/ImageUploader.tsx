import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Film } from 'lucide-react';
import toast from 'react-hot-toast';
import { MediaFile } from '../types'; // Adjust the path to your types file

// API2Cart API integration setup (Example)
const api2CartBaseUrl = 'https://api.api2cart.com/v1.0/';
const api2CartToken = 'your-api2cart-token'; // Replace with your API2Cart token

interface ImageUploaderProps {
  currentMedia?: string[];
  onMediaChange: (urls: string[]) => void;
  maxFiles?: number;
}

async function uploadFileToAPI2Cart(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${api2CartBaseUrl}products/upload_image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${api2CartToken}`,
      },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload to API2Cart');
    }
    return result.url; // Return the URL of the uploaded file on API2Cart
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Error uploading file to API2Cart: ' + error.message);
    } else {
      throw new Error('Unknown error occurred during file upload');
    }
  }
}

export default function ImageUploader({
  currentMedia = [],
  onMediaChange,
  maxFiles = 5,
}: ImageUploaderProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check if adding new files would exceed the limit
    if (mediaFiles.length + files.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files`);
      return;
    }

    setIsUploading(true);

    try {
      const newMediaFiles = await Promise.all(
        files.map(async (file) => {
          if (
            !file.type.startsWith('image/') &&
            !file.type.startsWith('video/')
          ) {
            throw new Error(
              'Invalid file type. Please upload images or videos only.'
            );
          }

          // Upload the file to API2Cart and get the URL
          const uploadedUrl = await uploadFileToAPI2Cart(file);

          // Return the MediaFile with the uploaded URL
          return {
            id: crypto.randomUUID(),
            type: file.type.startsWith('image/') ? 'image' : 'video',
            file,
            preview: uploadedUrl, // Directly use the uploaded URL here
          } as MediaFile; // Explicitly cast the object to MediaFile
        })
      );

      setMediaFiles((current) => [...current, ...newMediaFiles]);

      const mediaUrls = newMediaFiles.map((media) => media.preview);
      onMediaChange([...currentMedia, ...mediaUrls]);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to process files'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeMedia = (id: string) => {
    setMediaFiles((current) => {
      return current.filter((media) => media.id !== id);
    });

    const updatedPreviews = mediaFiles
      .filter((media) => media.id !== id)
      .map((media) => media.preview);
    onMediaChange(updatedPreviews);
  };

  const reorderMedia = (fromIndex: number, toIndex: number) => {
    setMediaFiles((current) => {
      const reorderedFiles = [...current];
      const [movedItem] = reorderedFiles.splice(fromIndex, 1);
      reorderedFiles.splice(toIndex, 0, movedItem);

      return reorderedFiles;
    });

    const reorderedPreviews = mediaFiles.map((media) => media.preview);
    onMediaChange(reorderedPreviews);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Media ({mediaFiles.length}/{maxFiles})
        </label>

        {mediaFiles.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            {mediaFiles.map((media, index) => (
              <div
                key={media.id}
                className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData('text/plain', index.toString())
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIndex = parseInt(
                    e.dataTransfer.getData('text/plain')
                  );
                  reorderMedia(fromIndex, index);
                }}
              >
                {media.type === 'image' ? (
                  <img
                    src={media.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={media.preview}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => removeMedia(media.id)}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                      Main Image
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {mediaFiles.length < maxFiles && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
              id="media-upload"
              multiple
            />
            <label
              htmlFor="media-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <div className="flex space-x-2">
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <Film className="w-8 h-8 text-gray-400" />
              </div>
              <span className="text-sm text-gray-600">
                {isUploading
                  ? 'Processing...'
                  : 'Click to upload or drag and drop'}
              </span>
              <span className="text-xs text-gray-500">
                Images (PNG, JPG, GIF) or Videos (MP4, WebM)
              </span>
            </label>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
            <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
          </div>
        </div>
      )}
    </div>
  );
}
