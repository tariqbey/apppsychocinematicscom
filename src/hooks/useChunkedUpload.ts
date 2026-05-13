import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ChunkedUploadOptions {
  bucket: string;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  chunkSize?: number; // in bytes, default 5MB
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

export const useChunkedUpload = () => {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const uploadFile = useCallback(
    async (
      file: File,
      filePath: string,
      options: ChunkedUploadOptions
    ): Promise<string | null> => {
      const { bucket, onProgress, onError, chunkSize = 5 * 1024 * 1024 } = options;

      // Always use XHR-based upload so we get real upload progress events.
      // fetch() does not emit progress, which made large uploads look frozen.
      if (file.size < 50 * 1024 * 1024) {
        return uploadWithProgress(file, filePath, bucket, onProgress, onError);
      }
      return uploadWithRetry(file, filePath, bucket, onProgress, onError);
    },
    []
  );

  const uploadWithProgress = async (
    file: File,
    filePath: string,
    bucket: string,
    onProgress?: (progress: number) => void,
    onError?: (error: Error) => void
  ): Promise<string | null> => {
    setState({ isUploading: true, progress: 0, error: null });
    abortControllerRef.current = new AbortController();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setState((prev) => ({ ...prev, progress }));
            onProgress?.(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setState({ isUploading: false, progress: 100, error: null });
            onProgress?.(100);
            
            // Get public URL
            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);
            
            resolve(urlData.publicUrl);
          } else {
            const error = new Error(`Upload failed with status ${xhr.status}`);
            setState({ isUploading: false, progress: 0, error });
            onError?.(error);
            reject(error);
          }
        });

        xhr.addEventListener("error", () => {
          const error = new Error("Network error during upload");
          setState({ isUploading: false, progress: 0, error });
          onError?.(error);
          reject(error);
        });

        xhr.addEventListener("abort", () => {
          const error = new Error("Upload cancelled");
          setState({ isUploading: false, progress: 0, error });
          reject(error);
        });

        xhr.open("POST", url);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("x-upsert", "true");
        xhr.send(file);

        // Store xhr for potential cancellation
        abortControllerRef.current!.signal.addEventListener("abort", () => {
          xhr.abort();
        });
      });
    } catch (error: any) {
      setState({ isUploading: false, progress: 0, error });
      onError?.(error);
      return null;
    }
  };

  const uploadResumable = async (
    file: File,
    filePath: string,
    bucket: string,
    chunkSize: number,
    onProgress?: (progress: number) => void,
    onError?: (error: Error) => void
  ): Promise<string | null> => {
    setState({ isUploading: true, progress: 0, error: null });
    abortControllerRef.current = new AbortController();

    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedBytes = 0;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      // Create resumable upload session
      const createResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-upsert": "true",
            "Content-Type": file.type || "application/octet-stream",
            "Content-Length": file.size.toString(),
          },
          body: file,
          signal: abortControllerRef.current.signal,
        }
      );

      if (!createResponse.ok) {
        // If direct upload fails, try chunked approach with retries
        return await uploadWithRetry(file, filePath, bucket, onProgress, onError);
      }

      setState({ isUploading: false, progress: 100, error: null });
      onProgress?.(100);

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      if (error.name === "AbortError") {
        setState({ isUploading: false, progress: 0, error: new Error("Upload cancelled") });
        return null;
      }
      
      // Retry with smaller chunks on failure
      console.log("Large upload failed, retrying with chunked approach...");
      return await uploadWithRetry(file, filePath, bucket, onProgress, onError);
    }
  };

  const uploadWithRetry = async (
    file: File,
    filePath: string,
    bucket: string,
    onProgress?: (progress: number) => void,
    onError?: (error: Error) => void,
    maxRetries = 3
  ): Promise<string | null> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Upload attempt ${attempt}/${maxRetries}`);
        
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          throw new Error("Not authenticated");
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const url = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;

        const result = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          // Set longer timeout for large files (30 minutes)
          xhr.timeout = 30 * 60 * 1000;
          
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setState((prev) => ({ ...prev, progress }));
              onProgress?.(progress);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);
              resolve(urlData.publicUrl);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.addEventListener("timeout", () => {
            reject(new Error("Upload timed out"));
          });

          xhr.addEventListener("abort", () => {
            reject(new Error("Upload cancelled"));
          });

          xhr.open("POST", url);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.setRequestHeader("x-upsert", "true");
          xhr.send(file);

          abortControllerRef.current?.signal.addEventListener("abort", () => {
            xhr.abort();
          });
        });

        setState({ isUploading: false, progress: 100, error: null });
        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`Upload attempt ${attempt} failed:`, error.message);
        
        if (error.message === "Upload cancelled") {
          break;
        }
        
        // Exponential backoff before retry
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay / 1000} seconds...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    const finalError = lastError || new Error("Upload failed after all retries");
    setState({ isUploading: false, progress: 0, error: finalError });
    onError?.(finalError);
    return null;
  };

  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    ...state,
    uploadFile,
    cancelUpload,
  };
};
