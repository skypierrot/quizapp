import { useRef } from "react";

export function useImageUpload(onUpload: (file: File, url: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpload(file, url);
    }
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return { inputRef, handleFileChange, openFileDialog };
} 