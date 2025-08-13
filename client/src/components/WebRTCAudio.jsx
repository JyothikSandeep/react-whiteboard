import React, { useState, useEffect, useRef } from "react";

// Minimal WebRTC audio for all users in the room
import { useNavigate } from "react-router-dom";

function WebRTCAudio({ roomId, userName, socket, isMuted, onEndCall }) {
  const [peerStreams, setPeerStreams] = useState({}); // { peerId: MediaStream }
  const peerConnections = useRef({}); // { peerId: RTCPeerConnection }
  const localStreamRef = useRef(null);
  const [myId, setMyId] = useState(socket.id);

  // Get local audio (mic) and handle peer connections
  // Maintain peer connections regardless of mute state
  useEffect(() => {
    let stopped = false;
    // Always connect to peers, but only add audio track if unmuted
    const setupMic = async () => {
      if (!isMuted) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log("[WebRTC] Got local mic stream");
          localStreamRef.current = stream;
          // Add track to all existing peer connections and trigger negotiation
          Object.values(peerConnections.current).forEach(pc => {
            stream.getTracks().forEach(track => {
              pc.addTrack(track, stream);
              console.log(`[WebRTC] Added local audio track to peer connection`);
            });
            // Always trigger negotiation after adding track
            if (pc.signalingState === "stable") {
              pc.onnegotiationneeded && pc.onnegotiationneeded();
            } else {
              // If not stable, manually create and send offer
              pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                // Find the peerId by reverse lookup
                const peerId = Object.keys(peerConnections.current).find(id => peerConnections.current[id] === pc);
                if (peerId) {
                  console.log(`[WebRTC] Sending offer to peer ${peerId} after track add`);
                  socket.emit("webrtc-offer", { roomId, to: peerId, from: myId, offer: pc.localDescription });
                }
              });
            }
          });
        } catch (err) {
          console.error("Could not get microphone:", err);
        }
      } else {
        // Remove local audio track from all peer connections
        Object.values(peerConnections.current).forEach(pc => {
          pc.getSenders().forEach(sender => {
            if (sender.track && sender.track.kind === "audio") {
              sender.track.stop();
              pc.removeTrack(sender);
              console.log(`[WebRTC] Removed local audio track from peer connection`);
            }
          });
          // Always trigger negotiation after removing track
          if (pc.signalingState === "stable") {
            pc.onnegotiationneeded && pc.onnegotiationneeded();
          } else {
            // If not stable, manually create and send offer
            pc.createOffer().then(offer => {
              pc.setLocalDescription(offer);
              const peerId = Object.keys(peerConnections.current).find(id => peerConnections.current[id] === pc);
              if (peerId) {
                console.log(`[WebRTC] Sending offer to peer ${peerId} after track removal`);
                socket.emit("webrtc-offer", { roomId, to: peerId, from: myId, offer: pc.localDescription });
              }
            });
          }
        });
        // Stop and clear local stream
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
        }
      }
    };
    setupMic();
    // Cleanup only on component unmount
    return () => {
      stopped = true;
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

    // Helper: create and manage a peer connection with polite/impolite logic
    const createPeer = (peerId) => {
      if (peerConnections.current[peerId]) return peerConnections.current[peerId];
      // Polite peer: the one with higher socket id
      const polite = myId > peerId;
      let makingOffer = false;
      let ignoreOffer = false;
      let isSettingRemoteAnswerPending = false;
      // Only STUN, no TURN: will not work for most users behind NAT/firewall
      // This is not recommended for production, but is what the user requested
      const pc = new window.RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" }
        ]
      });
      // Debug ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE state for peer ${peerId}: ${pc.iceConnectionState}`);
      };

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
      // Negotiationneeded
      pc.onnegotiationneeded = async () => {
        try {
          makingOffer = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log(`[WebRTC] Sending offer to peer ${peerId}`);
          socket.emit("webrtc-offer", { roomId, to: peerId, from: myId, offer: pc.localDescription });
        } catch (err) {
          console.warn("[WebRTC] Negotiation error", err);
        } finally {
          makingOffer = false;
        }
      };
      // Store polite/negotiation state for this peer
      pc.__polite = polite;
      pc.__makingOffer = () => makingOffer;
      pc.__ignoreOffer = () => ignoreOffer;
      pc.__setIgnoreOffer = v => { ignoreOffer = v; };
      pc.__isSettingRemoteAnswerPending = () => isSettingRemoteAnswerPending;
      pc.__setSettingRemoteAnswerPending = v => { isSettingRemoteAnswerPending = v; };
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

    // Handle offer (perfect negotiation pattern)
    socket.on("webrtc-offer", async ({ from, offer }) => {
      console.log(`[WebRTC] Received offer from peer ${from}`);
      const pc = createPeer(from);
      const polite = pc.__polite;
      let makingOffer = pc.__makingOffer();
      let ignoreOffer = pc.__ignoreOffer();
      let isSettingRemoteAnswerPending = pc.__isSettingRemoteAnswerPending();
      try {
        const offerCollision = makingOffer || pc.signalingState !== "stable";
        ignoreOffer = !polite && offerCollision;
        pc.__setIgnoreOffer(ignoreOffer);
        if (ignoreOffer) {
          console.log(`[WebRTC] Ignoring offer from peer ${from} due to collision`);
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { roomId, to: from, from: myId, answer });
      } catch (e) {
        console.warn("[WebRTC] Offer handling error", e);
      }
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

  const navigate = useNavigate();
  const [showCallEnded, setShowCallEnded] = useState(false);
  // End call handler
  const handleEndCall = () => {
    if (onEndCall) onEndCall();
    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    // Stop and clear local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    // Remove all peer streams
    setPeerStreams({});
    // Show 'Call Ended' popup, then redirect
    setShowCallEnded(true);
    setTimeout(() => {
      setShowCallEnded(false);
      navigate("/");
    }, 1500);
  };



  return (
    <>
      <div className="flex gap-2 items-center">
        {Object.entries(peerStreams).map(([peerId, stream]) => (
          <audio key={peerId} ref={el => { if (el) el.srcObject = stream; }} autoPlay />
        ))}
        {/* Show connected peer count */}
        {Object.keys(peerStreams).length > 0 && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">{Object.keys(peerStreams).length} peer(s) connected</span>
        )}
      </div>

      {/* Call Ended popup */}
      {showCallEnded && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="bg-black bg-opacity-80 px-8 py-5 rounded-2xl shadow-xl text-white text-2xl font-bold animate-fadeIn">
            Call Ended
          </div>
        </div>
      )}
    </>
  );
}

export default WebRTCAudio;
