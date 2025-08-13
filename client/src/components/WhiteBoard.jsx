import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import socket from "../Socket";
import { BiPencil } from "react-icons/bi";
import './WhiteBoard.css';

const WhiteBoard = forwardRef(({ state: roomId, userName, pageId, pinnedPageId }, ref) => {
  // Store drawing actions per page
  const [drawingActions, setDrawingActions] = useState({}); // { [pageId]: [{x0,y0,x1,y1,userName}] }

  // Fetch drawing actions for this page from server on mount or page change
  useEffect(() => {
    socket.emit('get_page_drawing', { pageId: roomId });
    const handlePageDrawing = ({ pageId: pid, actions }) => {
      setDrawingActions(prev => ({ ...prev, [pid]: actions }));
    };
    socket.on('page_drawing', handlePageDrawing);
    return () => {
      socket.off('page_drawing', handlePageDrawing);
    };
  }, [roomId]);

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const setCanvasSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Set both attributes and style for correct export
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Setup drawing context after resize
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctxRef.current = ctx;

    const drawFromSocket = ({ x0, y0, x1, y1, pageId, userName }) => {
      if (pageId !== roomId) return;
      ctx.save();
      ctx.strokeStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.restore();
      // Store action for this page
      setDrawingActions(prev => {
        const arr = prev[pageId] ? [...prev[pageId]] : [];
        arr.push({ x0, y0, x1, y1, userName });
        return { ...prev, [pageId]: arr };
      });
    };
    socket.on("draw", drawFromSocket);

    // Collaborative clear-board event
    const handleClearBoard = ({ pageId }) => {
      if (pageId !== roomId) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    socket.on("clear-board", handleClearBoard);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      socket.off("draw", drawFromSocket);
      socket.off("clear-board", handleClearBoard);
    };
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };
  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const { x, y } = getCoordinates(e);
    lastPos.current = { x, y };
  };

  const [remoteCursors, setRemoteCursors] = useState({});

  const getUserColor = (userName) => {
    const colors = ["#3498db", "#f1c40f", "#2ecc71", "#e74c3c", "#9b59b6"];
    const hash = userName.split("").reduce((a, b) => {
      a = (a + b.charCodeAt(0));
      return a;
    }, 0);
    return colors[hash % colors.length];
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;

    const { x, y } = getCoordinates(e);
    const ctx = ctxRef.current;

    // Draw on local canvas
    ctx.save();
    ctx.strokeStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    // Emit draw to others
    // Store action locally for this page
    setDrawingActions(prev => {
      const arr = prev[roomId] ? [...prev[roomId]] : [];
      arr.push({ x0: lastPos.current.x, y0: lastPos.current.y, x1: x, y1: y, userName });
      return { ...prev, [roomId]: arr };
    });
    socket.emit("draw", {
      pageId: roomId,
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: x,
      y1: y,
      userName,
    });

    // Emit pointer position for collaborative cursor
    socket.emit("cursor-move", {
      pageId: roomId,
      x,
      y,
      userName,
      userId: socket.id,
    });

    // Update last position
    lastPos.current = { x, y };
  };

  // Listen for remote cursor-move events
  useEffect(() => {
    const handleCursorMove = ({ userId, x, y, userName }) => {
      if (userId === socket.id) return; // Don't show own cursor as remote
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { x, y, userName }
      }));
    };
    socket.on("cursor-move", ({ pageId, ...rest }) => {
      if (pageId !== roomId) return;
      handleCursorMove(rest);
    });
    return () => socket.off("cursor-move", handleCursorMove);
  }, [roomId]);

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // Always restore drawing for the current page when drawingActions or roomId changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const actions = drawingActions[roomId] || [];
    actions.forEach(({ x0, y0, x1, y1 }) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    });
  }, [roomId, drawingActions]);

  // Clear board method
  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Clear drawingActions for this page locally
    setDrawingActions(prev => {
      const newActions = { ...prev };
      newActions[roomId] = [];
      return newActions;
    });
    socket.emit("clear-board", { pageId: roomId });
  };

  useImperativeHandle(ref, () => ({
    clearBoard,
  }));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div className="whiteboard-container" style={{ position: 'relative', width: '100%', height: '100%' }}>


        {/* Pin Page overlay button in the whiteboard, top right */}
        <button
          style={{ position: 'absolute', top: 16, right: 24, zIndex: 20 }}
          className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full border-2 transition font-semibold shadow ${
            pinnedPageId === roomId
              ? 'bg-green-200 border-green-500 text-green-900' // pinned
              : 'bg-yellow-100 border-yellow-400 text-yellow-700 hover:bg-yellow-200' // not pinned
          }`}
          title="Pin this page as current"
          onClick={() => {
            socket.emit('pin_page', { pageId: roomId });
          }}
        >
          📌 Pin Page
        </button>
        <canvas
          id={`whiteboard-canvas-${pageId}`}
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        {/* Render remote user cursors */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
          {Object.entries(remoteCursors).map(([userId, { x, y, userName }]) => (
            <div
              key={userId}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'none',
                zIndex: 10
              }}
            >
              <div style={{
                background: '#fff',
                color: '#333',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 12,
                marginBottom: 2,
                textAlign: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
              }}>{userName}</div>
              <BiPencil style={{
                color: getUserColor(userName),
                fontSize: 22,
                filter: 'drop-shadow(0 2px 6px rgba(80,80,130,0.18))',
                transform: 'rotate(-18deg)',
                marginTop: 2
              }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default WhiteBoard;
