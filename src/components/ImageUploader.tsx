import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2 } from 'lucide-react';
import { removeBackground, loadImage } from '@/lib/backgroundRemoval';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  maxSize?: number; // in MB
  accept?: string;
  currentImage?: string;
  onRemove?: () => void;
  className?: string;
  label?: string;
  enableBackgroundRemoval?: boolean;
}

export function ImageUploader({
  onImageUpload,
  maxSize = 5,
  accept = "image/*",
  currentImage,
  onRemove,
  className = "",
  label = "Upload Image",
  enableBackgroundRemoval = false
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max width 1024px)
        const maxWidth = 1024;
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          0.7 // 70% quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please select an image smaller than ${maxSize}MB`,
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCompressing(true);
      
      // Compress image
      const compressedFile = await compressImage(file);
      
      // Create preview
      const previewUrl = URL.createObjectURL(compressedFile);
      setPreview(previewUrl);
      
      // Call the upload handler with compressed file
      onImageUpload(compressedFile);
      
      toast({
        title: "Image uploaded successfully",
        description: `Compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
      });
      
    } catch (error) {
      console.error('Error compressing image:', error);
      toast({
        title: "Error compressing image",
        description: "Please try again with a different image",
        variant: "destructive"
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!preview) return;
    
    try {
      setIsRemovingBg(true);
      
      // Convert preview URL to image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = preview;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Remove background
      const processedBlob = await removeBackground(img);
      
      // Create new file and preview
      const processedFile = new File([processedBlob], 'image_no_bg.png', {
        type: 'image/png'
      });
      
      const newPreviewUrl = URL.createObjectURL(processedFile);
      setPreview(newPreviewUrl);
      
      onImageUpload(processedFile);
      
      toast({
        title: "Background removed successfully",
        description: "Image background has been removed"
      });
      
    } catch (error) {
      console.error('Error removing background:', error);
      toast({
        title: "Error removing background",
        description: "Please try again or upload a different image",
        variant: "destructive"
      });
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove?.();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-40 object-cover rounded-lg border border-border"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            {enableBackgroundRemoval && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleRemoveBackground}
                disabled={isRemovingBg}
              >
                {isRemovingBg ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Remove BG"
                )}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">{label}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
          >
            {isCompressing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Compressing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </>
            )}
          </Button>
        </div>
      )}
      
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground">
        Max size: {maxSize}MB. Images will be automatically compressed to WebP format.
      </p>
    </div>
  );
}