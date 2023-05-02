import React, { useCallback, useState } from "react";

export const useDragAndDrop = () => {
  const [dragging, setDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, onDrop: (file: File) => void) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);

      const files = e.dataTransfer.files;

      if (files.length > 0) {
        onDrop(files[0]);
      }
    },
    []
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragging(false);
  }, []);

  return {
    dragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
};
