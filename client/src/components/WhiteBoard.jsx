import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import socket from "../Socket";
import { BiPencil } from "react-icons/bi";
import './WhiteBoard.css';

const WhiteBoard = forwardRef(({ state: roomId, userName }, ref) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const setCanvasSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
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

    const drawFromSocket = ({ x0, y0, x1, y1 }) => {
      ctx.save();
      ctx.strokeStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.restore();
    };
    socket.on("draw", drawFromSocket);

    // Collaborative clear-board event
    const handleClearBoard = () => {
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
    socket.emit("draw", {
      roomId,
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: x,
      y1: y,
      userName,
    });

    // Emit pointer position for collaborative cursor
    socket.emit("cursor-move", {
      roomId,
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
    socket.on("cursor-move", handleCursorMove);
    return () => socket.off("cursor-move", handleCursorMove);
  }, []);

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // Clear board method
  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear-board", { roomId });
  };

  useImperativeHandle(ref, () => ({
    clearBoard,
  }));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div className="whiteboard-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* <p className="whiteboard-title">Whiteboard</p> */}
        <canvas
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
