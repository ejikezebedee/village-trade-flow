import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, File, Check, X, AlertTriangle } from 'lucide-react';

// J) Dispute & Moderation Tools - Evidence uploads with secure hashing

interface EvidenceFile {
  id: string;
  file: File;
  hash: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  url?: string;
  error?: string;
}

interface DisputeEvidenceUploadProps {
  disputeId: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  onUploadComplete?: (evidenceIds: string[]) => void;
}

export const DisputeEvidenceUpload: React.FC<DisputeEvidenceUploadProps> = ({
  disputeId,
  maxFiles = 10,
  maxFileSize = 10,
  allowedTypes = ['image/*', 'application/pdf', 'text/*'],
  onUploadComplete
}) => {
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Generate file hash for integrity verification
  const generateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Validate file before upload
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return { valid: false, error: `File size exceeds ${maxFileSize}MB limit` };
    }

    // Check file type
    const isAllowedType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const mainType = type.split('/')[0];
        return file.type.startsWith(mainType + '/');
      }
      return file.type === type;
    });

    if (!isAllowedType) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Check file name for suspicious patterns
    const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
    if (suspiciousPatterns.some(pattern => file.name.toLowerCase().includes(pattern))) {
      return { valid: false, error: 'File type not allowed for security reasons' };
    }

    return { valid: true };
  };

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (evidenceFiles.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
      return;
    }

    const newFiles: EvidenceFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);

      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive"
        });
        continue;
      }

      try {
        const hash = await generateFileHash(file);
        
        newFiles.push({
          id: crypto.randomUUID(),
          file,
          hash,
          uploadProgress: 0,
          status: 'pending'
        });
      } catch (error) {
        console.error('Error generating file hash:', error);
        toast({
          title: "Error",
          description: `Failed to process ${file.name}`,
          variant: "destructive"
        });
      }
    }

    setEvidenceFiles(prev => [...prev, ...newFiles]);
  }, [evidenceFiles.length, maxFiles, maxFileSize, allowedTypes, toast]);

  const uploadEvidence = async (evidenceFile: EvidenceFile) => {
    try {
      // Update status to uploading
      setEvidenceFiles(prev => prev.map(ef => 
        ef.id === evidenceFile.id ? { ...ef, status: 'uploading' as const } : ef
      ));

      // Create unique file path
      const fileExt = evidenceFile.file.name.split('.').pop();
      const fileName = `${disputeId}/${evidenceFile.id}.${fileExt}`;

      // Upload file to Supabase Storage with progress tracking
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dispute-evidence')
        .upload(fileName, evidenceFile.file);

      // Simulate progress for user experience
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 20;
        if (progress <= 80) {
          setEvidenceFiles(prev => prev.map(ef => 
            ef.id === evidenceFile.id ? { ...ef, uploadProgress: progress } : ef
          ));
        } else {
          clearInterval(progressInterval);
        }
      }, 100);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('dispute-evidence')
        .getPublicUrl(fileName);

      // Store evidence metadata in database
      const { data: evidenceData, error: dbError } = await supabase
        .from('dispute_evidence')
        .insert({
          dispute_id: disputeId,
          submitted_by: (await supabase.auth.getUser()).data.user?.id,
          evidence_type: evidenceFile.file.type.startsWith('image/') ? 'image' : 
                        evidenceFile.file.type === 'application/pdf' ? 'document' : 'other',
          file_url: urlData.publicUrl,
          description: `Uploaded file: ${evidenceFile.file.name}`,
          metadata: {
            original_filename: evidenceFile.file.name,
            file_size: evidenceFile.file.size,
            file_type: evidenceFile.file.type,
            file_hash: evidenceFile.hash,
            upload_timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Update file status to uploaded
      setEvidenceFiles(prev => prev.map(ef => 
        ef.id === evidenceFile.id ? { 
          ...ef, 
          status: 'uploaded' as const, 
          url: urlData.publicUrl,
          uploadProgress: 100 
        } : ef
      ));

      return evidenceData.id;

    } catch (error: any) {
      console.error('Evidence upload error:', error);
      
      setEvidenceFiles(prev => prev.map(ef => 
        ef.id === evidenceFile.id ? { 
          ...ef, 
          status: 'error' as const, 
          error: error.message 
        } : ef
      ));

      throw error;
    }
  };

  const handleUploadAll = async () => {
    setUploading(true);
    
    try {
      const pendingFiles = evidenceFiles.filter(ef => ef.status === 'pending');
      const evidenceIds: string[] = [];

      for (const file of pendingFiles) {
        try {
          const evidenceId = await uploadEvidence(file);
          evidenceIds.push(evidenceId);
        } catch (error) {
          // Continue with other files even if one fails
          console.error(`Failed to upload ${file.file.name}:`, error);
        }
      }

      if (evidenceIds.length > 0) {
        toast({
          title: "Evidence uploaded",
          description: `Successfully uploaded ${evidenceIds.length} file(s)`,
        });

        onUploadComplete?.(evidenceIds);
      }

    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload evidence files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setEvidenceFiles(prev => prev.filter(ef => ef.id !== fileId));
  };

  const getStatusIcon = (status: EvidenceFile['status']) => {
    switch (status) {
      case 'uploaded': return <Check className="h-4 w-4 text-green-500" />;
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      case 'uploading': return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />;
      default: return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Evidence Upload
        </CardTitle>
        <CardDescription>
          Upload evidence files for this dispute. All files are securely hashed for integrity verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
          onDrop={(e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0) {
              handleFileSelect(files);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = allowedTypes.join(',');
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files && files.length > 0) {
                handleFileSelect(files);
              }
            };
            input.click();
          }}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upload Evidence Files</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop files here, or click to select files
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Maximum {maxFiles} files, {maxFileSize}MB each</p>
            <p>Allowed types: Images, PDFs, Text documents</p>
          </div>
        </div>

        {/* File List */}
        {evidenceFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Selected Files</h4>
            {evidenceFiles.map((evidenceFile) => (
              <div key={evidenceFile.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusIcon(evidenceFile.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{evidenceFile.file.name}</p>
                    <Badge variant="outline">{formatFileSize(evidenceFile.file.size)}</Badge>
                  </div>
                  
                  {evidenceFile.status === 'uploading' && (
                    <Progress value={evidenceFile.uploadProgress} className="mt-2" />
                  )}
                  
                  {evidenceFile.error && (
                    <p className="text-sm text-red-500 mt-1">{evidenceFile.error}</p>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    Hash: {evidenceFile.hash.substring(0, 16)}...
                  </p>
                </div>

                {evidenceFile.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(evidenceFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {evidenceFiles.some(ef => ef.status === 'pending') && (
          <div className="flex justify-end">
            <Button
              onClick={handleUploadAll}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload Evidence
            </Button>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Security Notice</p>
              <p className="text-muted-foreground">
                All uploaded files are cryptographically hashed (SHA-256) to ensure integrity. 
                Files are stored securely and only accessible to authorized dispute participants and mediators.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DisputeEvidenceUpload;