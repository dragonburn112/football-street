import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImage?: string;
  className?: string;
}

export default function ImageUploader({ onImageUploaded, currentImage, className }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Get upload URL from backend
      const uploadResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL } = await uploadResponse.json();

      // Upload file directly to object storage
      const uploadFileResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadFileResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Set ACL policy for the uploaded image
      const aclResponse = await fetch('/api/profile-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageURL: uploadURL.split('?')[0], // Remove query params
        }),
      });

      if (!aclResponse.ok) {
        throw new Error('Failed to set image permissions');
      }

      const { objectPath } = await aclResponse.json();
      onImageUploaded(objectPath);

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {currentImage && currentImage.startsWith('/objects/') && (
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-muted border-2 border-border">
            <img 
              src={currentImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="flex flex-col items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="cursor-pointer"
              asChild
            >
              <span className="flex items-center gap-2">
                {uploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-camera"></i>
                    Upload Photo
                  </>
                )}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground text-center">
            Upload a custom profile photo (max 5MB)
          </p>
        </div>
      </div>
    </div>
  );
}