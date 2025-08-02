import React, { useState, useEffect, useRef } from "react";
import socket from "../Socket";
import './WhiteBoard.css';

const WhiteBoard = ({ state: roomId }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
  // Get the actual display size of the canvas in pixels
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  // canvas.style.background = "#f0f0f0";

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

    socket.on("draw", drawFromSocket);

    return () => {
      socket.off("draw", drawFromSocket);
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

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;

    const { x, y } = getCoordinates(e);
    const ctx = ctxRef.current;

    // Draw on local canvas
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Emit draw to others
    socket.emit("draw", {
      roomId,
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: x,
      y1: y,
    });

    // Update last position
    lastPos.current = { x, y };
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <div>

      <div className="whiteboard-container">
      {/* <p className="whiteboard-title">Whiteboard</p> */}
      <canvas
        ref={canvasRef}
        className="whiteboard-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        />
        </div>
        
    </div>
  );
};

export default WhiteBoard;
