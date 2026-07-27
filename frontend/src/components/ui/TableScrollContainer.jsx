import React, { useRef, useEffect } from 'react';

/**
 * TableScrollContainer
 * Wraps tables with full-width screen stretch layout and synced top + bottom horizontal scrollbars.
 */
const TableScrollContainer = ({ children, className = "" }) => {
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const dummyContentRef = useRef(null);

  // Sync scrollbar widths and positions
  useEffect(() => {
    const updateWidth = () => {
      if (tableWrapperRef.current && dummyContentRef.current) {
        const scrollWidth = bottomScrollRef.current ? bottomScrollRef.current.scrollWidth : tableWrapperRef.current.scrollWidth;
        dummyContentRef.current.style.width = `${scrollWidth}px`;
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => updateWidth());
    if (bottomScrollRef.current) {
      resizeObserver.observe(bottomScrollRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [children]);

  const handleTopScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  return (
    <div className={`w-full max-w-full space-y-1 ${className}`}>
      {/* Top Horizontal Scrollbar - 100% Transparent track */}
      <div
        ref={topScrollRef}
        onScroll={handleTopScroll}
        className="w-full overflow-x-auto overflow-y-hidden bg-transparent border-0 mb-1"
        style={{ height: '10px' }}
      >
        <div ref={dummyContentRef} style={{ height: '1px' }} />
      </div>

      {/* Main Table Scroll Container */}
      <div
        ref={bottomScrollRef}
        onScroll={handleBottomScroll}
        className="w-full overflow-x-auto border border-slate-200/80 rounded-2xl shadow-xs bg-white"
      >
        <div ref={tableWrapperRef} className="w-full min-w-max">
          {children}
        </div>
      </div>
    </div>
  );
};

export default TableScrollContainer;
