import React, { useState, useEffect, useRef } from "react";

// Minimal WebRTC audio for all users in the room
function WebRTCAudio({ roomId, userName, socket, isMuted }) {
  const [peerStreams, setPeerStreams] = useState({}); // { peerId: MediaStream }
  const peerConnections = useRef({}); // { peerId: RTCPeerConnection }
  const localStreamRef = useRef(null);
  const [myId, setMyId] = useState(socket.id);

  // Get local audio (mic) and handle peer connections
  useEffect(() => {
    if (!isMuted) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          console.log("[WebRTC] Got local mic stream");
          localStreamRef.current = stream;
          socket.emit("get_users", { roomId });
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
      // Close all peer connections
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      setPeerStreams({});
    }
    return () => {
      // Cleanup
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setPeerStreams({});
    };
    // eslint-disable-next-line
  }, [isMuted, roomId]);

  // Handle signaling and peer setup
  useEffect(() => {
    if (!socket || !roomId || isMuted) return;

    // Helper: create and manage a peer connection
    const createPeer = (peerId) => {
      if (peerConnections.current[peerId]) return peerConnections.current[peerId];
      const pc = new window.RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      // Send local audio
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
      }
      // Handle remote audio
      pc.ontrack = (event) => {
        console.log(`[WebRTC] Received remote stream from peer ${peerId}`);
        setPeerStreams(prev => ({ ...prev, [peerId]: event.streams[0] }));
      };
      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`[WebRTC] Sending ICE candidate to ${peerId}`);
          socket.emit("webrtc-ice", { roomId, to: peerId, from: myId, candidate: event.candidate });
        }
      };
      peerConnections.current[peerId] = pc;
      return pc;
    };

    // When user list updates, connect to all peers
    const handleUserList = ({ users }) => {
      users.forEach((user) => {
        if (user.id !== myId) {
          const pc = createPeer(user.id);
          // Always renegotiate on userlist update
          pc.createOffer().then(offer => {
            pc.setLocalDescription(offer);
            console.log(`[WebRTC] Sending offer to peer ${user.id}`);
            socket.emit("webrtc-offer", { roomId, to: user.id, from: myId, offer });
          });
        }
      });
    };
    socket.on("user_list", handleUserList);

    // Handle offer
    socket.on("webrtc-offer", async ({ from, offer }) => {
      console.log(`[WebRTC] Received offer from peer ${from}`);
      const pc = createPeer(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { roomId, to: from, from: myId, answer });
    });
    // Handle answer
    socket.on("webrtc-answer", async ({ from, answer }) => {
      console.log(`[WebRTC] Received answer from peer ${from}`);
      const pc = createPeer(from);
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });
    // Handle ICE
    socket.on("webrtc-ice", async ({ from, candidate }) => {
      console.log(`[WebRTC] Received ICE candidate from peer ${from}`);
      const pc = createPeer(from);
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) { console.warn("[WebRTC] ICE error", e); }
    });

    // Cleanup on unmount
    return () => {
      socket.off("user_list", handleUserList);
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice");
    };
    // eslint-disable-next-line
  }, [socket, roomId, isMuted, myId]);

  // Get my socket id on mount
  useEffect(() => {
    setMyId(socket.id);
  }, [socket]);

  return (
    <div className="flex gap-2 items-center">
      {Object.entries(peerStreams).map(([peerId, stream]) => (
        <audio key={peerId} ref={el => { if (el) el.srcObject = stream; }} autoPlay />
      ))}
      {/* Show connected peer count */}
      {Object.keys(peerStreams).length > 0 && (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">{Object.keys(peerStreams).length} peer(s) connected</span>
      )}
    </div>
  );
}

export default WebRTCAudio;
