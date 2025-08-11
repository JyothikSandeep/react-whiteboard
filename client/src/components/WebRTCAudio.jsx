import React, { useState, useEffect, useRef } from "react";

/**
 * WebRTCAudio: Real-time voice chat (scaffold)
 * Props:
 * - roomId: string (required)
 * - userName: string (required)
 * - socket: socket.io client instance (required)
 * - isMuted: boolean (optional)
 */
function WebRTCAudio({ roomId, userName, socket, isMuted }) {
  const [peers, setPeers] = useState([]); // [{peerId, stream}]
  const localStreamRef = useRef(null);
  const audioRefs = useRef({});

  // Get local audio (mic)
  useEffect(() => {
    if (!isMuted) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          localStreamRef.current = stream;
          // TODO: send stream to peers via WebRTC
        })
        .catch(err => {
          console.error("Could not get microphone:", err);
        });
    } else {
      // Stop all tracks if muted
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    }
    // Cleanup on unmount
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isMuted]);

  // TODO: WebRTC peer connection setup and signaling via socket.io
  // - Listen for 'webrtc-offer', 'webrtc-answer', 'webrtc-ice' events
  // - Create RTCPeerConnection for each peer
  // - Add localStreamRef.current to connection
  // - Play remote streams using <audio>

  // UI: Mute/unmute button, show connected peers
  return null;
}

export default WebRTCAudio;
