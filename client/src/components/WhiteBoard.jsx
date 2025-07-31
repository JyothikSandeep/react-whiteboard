import React, { useEffect, useRef } from "react";
import socket from "../Socket";

const WhiteBoard = ({ roomId, userName }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Responsive canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const setCanvasSize = () => {
      // Set width to parent width, height fixed for demo
      const parent = canvas.parentElement;
      canvas.width = parent.offsetWidth;
      canvas.height = 500;
      canvas.style.background = "#f0f0f0";
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctxRef.current = ctx;

    const drawFromSocket = ({ x0, y0, x1, y1 }) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    };

    const clearFromSocket = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    socket.on("draw", drawFromSocket);
    socket.on("clear", clearFromSocket);

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      socket.off("draw", drawFromSocket);
      socket.off("clear", clearFromSocket);
    };
  }, [roomId]);

  // Mouse events
  const getCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const { x, y } = getCoordinates(e);
    lastPos.current = { x, y };
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const { x, y } = getCoordinates(e);
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    socket.emit("draw", {
      roomId,
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: x,
      y1: y,
    });
    lastPos.current = { x, y };
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // Touch events for mobile
  const getTouchCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const handleTouchStart = (e) => {
    isDrawing.current = true;
    const { x, y } = getTouchCoordinates(e);
    lastPos.current = { x, y };
  };

  const handleTouchMove = (e) => {
    if (!isDrawing.current) return;
    const { x, y } = getTouchCoordinates(e);
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    socket.emit("draw", {
      roomId,
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: x,
      y1: y,
    });
    lastPos.current = { x, y };
  };

  const handleTouchEnd = () => {
    isDrawing.current = false;
  };

  // Clear board
  const handleClear = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear", { roomId });
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-2">
        <p className="font-bold text-xl text-indigo-700">Whiteboard</p>
        <button
          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
          onClick={handleClear}
        >
          Clear Board
        </button>
      </div>
      <div className="w-full border-2 border-indigo-200 rounded-lg shadow-lg bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-[500px] bg-white cursor-crosshair touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Collaborative whiteboard canvas"
        />
      </div>
    </div>
  );
};

export default WhiteBoard;
