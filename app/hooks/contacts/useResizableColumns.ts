// app/hooks/contacts/useResizableColumns.ts
import { useState, useRef } from 'react';

interface ResizableColumnsOptions {
  minWidth?: number;
}

/**
 * Hook to manage resizable table columns
 * 
 * @param initialWidths - Initial column widths object with column IDs as keys
 * @param options - Additional options for column resizing
 * @returns Column widths and handlers for resizing
 */
export function useResizableColumns(
  initialWidths: Record<string, number> = {}, 
  options: ResizableColumnsOptions = {}
) {
  const { minWidth = 100 } = options;
  
  // State to track column widths
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(initialWidths);
  
  // Track which column is being resized
  const [resizing, setResizing] = useState<string | null>(null);
  
  // Refs to track starting position and width during resize
  const startPositionRef = useRef<number>(0);
  const columnWidthRef = useRef<number>(0);

  /**
   * Start column resizing on mouse down
   */
  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    setResizing(columnId);
    startPositionRef.current = e.clientX;
    columnWidthRef.current = columnWidths[columnId] || 200; // Default width
    
    // Set up listeners for mouse movement and release
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startPositionRef.current;
      const newWidth = Math.max(minWidth, columnWidthRef.current + delta);
      
      setColumnWidths(prev => ({
        ...prev,
        [columnId]: newWidth
      }));
    };
    
    const handleMouseUp = () => {
      setResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  /**
   * Set width for a specific column
   */
  const setColumnWidth = (columnId: string, width: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnId]: Math.max(minWidth, width)
    }));
  };

  /**
   * Reset all column widths to initial values
   */
  const resetColumnWidths = () => {
    setColumnWidths(initialWidths);
  };

  return { 
    columnWidths, 
    resizing, 
    handleResizeStart,
    setColumnWidth,
    resetColumnWidths
  };
}