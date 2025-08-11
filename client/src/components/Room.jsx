// import React, { useRef } from "react";
import socket from "../Socket";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import WhiteBoard from "./WhiteBoard";
// import { useRef } from "react";

//react icons
//mute
import { BsMicMute } from "react-icons/bs";
import { MdOutlineKeyboardVoice } from "react-icons/md";

//create new
import { VscNewFile } from "react-icons/vsc";

//deelete
import { TiDocumentDelete } from "react-icons/ti";

//users
import { LuUsers } from "react-icons/lu";
import { TbUsersPlus } from "react-icons/tb";

// WebRTC Audio
import WebRTCAudio from "./WebRTCAudio";


//chat
import { MdChatBubbleOutline } from "react-icons/md";
import { MdOutlineMarkChatUnread } from "react-icons/md";



import React, { useRef } from "react";

const Room = () => {
  const [showCopiedRoomId, setShowCopiedRoomId] = useState(false);
  const [showCopiedUrl, setShowCopiedUrl] = useState(false);
  const whiteboardRef = useRef(null);
  const { roomId } = useParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const chatNotifSoundRef = useRef(null);
  const [micMuted, setMicMuted] = useState(true);
  const chatEndRef = useRef(null);
  const location = useLocation();
  const [currrentuser, setCurrentUser] = useState("");

  const [usersDisplay,setUserDisplay] = useState("hidden");
  const userRef = useRef("");

  // location.state.userName?():('');
  useEffect(() => {
    if (location.state?.userName) {
      setCurrentUser(location.state.userName);
    }
  }, [location.state]);

  useEffect(() => {
    if (!currrentuser) {
      return;
    }
    if (!isAdmin) setWaitingForApproval(true);
    socket.emit("join_room_request", { roomId, currrentuser });
    socket.emit("get_users", { roomId }); // Request user list on join

    // Chat: listen for messages
    socket.on("chat_message", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      if (!chatOpen && msg.userName !== currrentuser) {
        setUnreadCount((c) => c + 1);
        if (chatNotifSoundRef.current) {
          chatNotifSoundRef.current.currentTime = 0;
          chatNotifSoundRef.current.play();
        }
      }
    });

    //If user is admin it will identify
    socket.on("identifiedAdmin", () => {
      setIsAdmin(true);
      setWaitingForApproval(false);
    });
    //it will intimate who was joining
    socket.on("join_approval", ({ socketId, userName }) => {
      setJoinRequests((prev) => [...prev, {id:socketId,userName:userName}]);
      // If this user is waiting for approval, show waiting screen
      if (userName === currrentuser && !isAdmin) {
        setWaitingForApproval(true);
      }
    });

    socket.on("aproved_user", ({ socketId }) => {
      // handle if needed
    });

    socket.on("approved", ({username}) => {
      setWaitingForApproval(false);
      socket.emit("final_join", { roomId ,username});
    });

    socket.on("user_joined", ({ socketId, username }) => {
      // No-op; full user list will be updated by 'user_list'
    });

    socket.on("user_list", ({ users }) => {
      setUsers(users || []);
    });

    if (location.state?.userName) {
      setCurrentUser(location.state.userName);
    }

    // Cleanup listeners on unmount
    return () => {
      socket.off("identifiedAdmin");
      socket.off("join_approval");
      socket.off("aproved_user");
      socket.off("approved");
      socket.off("user_joined");
      socket.off("user_list");
      socket.off("chat_message");
    };
  }, [currrentuser, roomId]);

  // Reset unread chat count when chat is opened
  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

  const onAdmit = (username,socketId) => {
    console.log(username,socketId);
    socket.emit("aprove_user", { roomId, socketId ,username});
    setJoinRequests(joinRequests.filter((d) => d.id !== socketId));
  };

  return (
    <div className="font-main">
      {currrentuser === "" ? (
        <>
          <div className="text-center mt-6">
            {/* <p>Please Enter your name</p> */}
            <input
              type="text"
              ref={userRef}
              placeholder="please enter your name"
              className="border py-2 px-2 text-center"
            ></input>

            <button
              className="py-2   bg-blue-300 pr-4 text-center  rounded-full-xl"
              onClick={() => setCurrentUser(userRef.current.value)}
            >
              Submit
            </button>
          </div>
        </>
      ) : (!isAdmin && waitingForApproval) ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-pink-50 to-yellow-100">
          <div className="flex-1 flex flex-col justify-center items-center w-full">
            <div className="backdrop-blur bg-white/60 rounded-2xl shadow-xl px-8 py-10 flex flex-col items-center border border-blue-200 min-h-[40vh] max-w-md w-full">
              {/* Friendly waiting illustration */}
              <svg width="80" height="80" fill="none" viewBox="0 0 80 80" className="mb-6">
                <circle cx="40" cy="40" r="36" fill="#E0F2FE" />
                <ellipse cx="40" cy="52" rx="18" ry="4" fill="#bae6fd" />
                <rect x="28" y="25" width="24" height="18" rx="9" fill="#60a5fa" />
                <circle cx="40" cy="34" r="6" fill="#fff" />
                <circle cx="37.5" cy="33.5" r="1.5" fill="#60a5fa" />
                <circle cx="42.5" cy="33.5" r="1.5" fill="#60a5fa" />
                <rect x="36" y="38" width="8" height="2" rx="1" fill="#60a5fa" />
              </svg>
              {/* Animated spinner */}
              <div className="relative flex items-center justify-center mb-5">
                <div className="absolute animate-spin rounded-full h-12 w-12 border-t-4 border-blue-400 border-solid opacity-70"></div>
                <div className="h-8 w-8 rounded-full bg-blue-200/60"></div>
              </div>
              <div className="text-2xl font-bold text-blue-700 mb-2 drop-shadow-sm">Waiting for admin approval...</div>
              <div className="text-gray-600 text-base mb-2 text-center max-w-xs">Hang tight! The admin will let you in soon. Feel free to grab a coffee or review your notes while you wait.</div>
              <div className="text-xs text-gray-400 mt-2">If you think this is taking too long, check with the room admin or try rejoining.</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Chat Panel */}
          {chatOpen && (
            <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[95vw] bg-white/95 rounded-2xl shadow-2xl border border-blue-200 flex flex-col overflow-hidden animate-fadeIn">
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-200 to-pink-100 border-b border-blue-100">
                <span className="font-bold text-blue-800 text-base">Room Chat</span>
                <button className="text-xl text-gray-400 hover:text-blue-500 font-bold px-2" onClick={()=>setChatOpen(false)} aria-label="Close chat">&times;</button>
              </div>
              <div className="flex-1 flex flex-col px-4 py-2 overflow-y-auto max-h-60" style={{minHeight: '180px'}}>
                {chatMessages.length === 0 ? (
                  <div className="text-gray-400 text-sm mt-6 text-center">No messages yet. Start the conversation!</div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className="mb-2 flex flex-col">
                      <span className="text-xs text-blue-600 font-semibold">{msg.userName} <span className="text-gray-400 font-normal">{msg.time}</span></span>
                      <span className="text-gray-800 text-sm bg-blue-50 rounded-lg px-2 py-1 w-fit max-w-full break-words shadow-sm">{msg.text}</span>
                    </div>
                  ))
                )}
                <div ref={chatEndRef}></div>
              </div>
              <form className="flex items-center gap-2 border-t border-blue-100 px-4 py-2 bg-white" onSubmit={e => {
                e.preventDefault();
                if (chatInput.trim() === "") return;
                const msg = {
                  userName: currrentuser,
                  text: chatInput,
                  time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                };
                socket.emit("chat_message", { roomId, ...msg });
                setChatInput("");
                setTimeout(() => chatEndRef.current?.scrollIntoView({behavior: 'smooth'}), 100);
              }}>
                <input
                  className="flex-1 px-3 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm bg-gray-50"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  autoComplete="off"
                />
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-full font-semibold shadow transition-all">Send</button>
              </form>
            </div>
          )}

          {/* WebRTC Audio Panel */}
          <WebRTCAudio roomId={roomId} userName={currrentuser} socket={socket} isMuted={micMuted} />

          {/* {console.log(location.state)}; */}
          <div className="w-full flex items-center gap-2 p-2">
            <span className="text-base font-bold text-blue-900">{currrentuser}</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${isAdmin ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{isAdmin ? 'Admin' : 'Not admin'}</span>
            <span className="ml-2">
              <WebRTCAudio roomId={roomId} userName={currrentuser} socket={socket} isMuted={micMuted} />
            </span>

            <div className="flex-1"></div>
            {/* Copy Room ID */}
            <button
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-blue-100 border-2 border-gray-400 hover:border-blue-500 text-gray-700 transition"
              title="Copy Room ID"
              onClick={() => {
                navigator.clipboard.writeText(roomId);
                setShowCopiedRoomId(true);
                setTimeout(() => setShowCopiedRoomId(false), 1500);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16h8a2 2 0 002-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 16v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2" />
              </svg>
              <span>Room ID</span>
            </button>
            {showCopiedRoomId && <span className="ml-1 text-green-600 text-xs font-semibold animate-pulse">Copied!</span>}
            {/* Copy URL */}
            <button
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-blue-100 border-2 border-gray-400 hover:border-blue-500 text-gray-700 transition"
              title="Copy URL"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setShowCopiedUrl(true);
                setTimeout(() => setShowCopiedUrl(false), 1500);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16h8a2 2 0 002-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 16v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2" />
              </svg>
              <span>URL</span>
            </button>
            {showCopiedUrl && <span className="ml-1 text-green-600 text-xs font-semibold animate-pulse">Copied!</span>}
          </div>
           {/* Whiteboard and Toolbar Container */}
           <div className="w-full flex flex-col items-center">
             <div className="w-full flex flex-col items-center">
               {roomId && <WhiteBoard ref={whiteboardRef} state={roomId} userName={currrentuser} />}
               <div className="flex justify-center mt-2">
                 <div className="flex items-center py-3 px-2 bg-gray-100 rounded-full-xl shadow-sm">
                   {/* Center group: Main tools */}
                   <div className="flex gap-4">


                    <button
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-blue-100 border-2 border-gray-400 hover:border-blue-500 transition ${micMuted ? 'text-red-500' : 'text-green-600'}`}
                      title={micMuted ? 'Unmute Mic' : 'Mute Mic'}
                      onClick={() => setMicMuted(m => !m)}
                    >
                      {micMuted ? (
                        <BsMicMute className="text-red-500" size={20} />
                      ) : (
                        <MdOutlineKeyboardVoice className="text-green-600" size={20} />
                      )}
                    </button>
                  <button className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-blue-100 border-2 border-gray-400 hover:border-blue-500 text-gray-700 transition">
                    <VscNewFile className="text-gray-700" size={20} />
                  </button>
                  <button className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-blue-100 border-2 border-gray-400 hover:border-blue-500 text-gray-700 transition" onClick={() => whiteboardRef.current?.clearBoard()}>
                    <TiDocumentDelete className="text-gray-700" size={20} />
                  </button>
                    {/* Right group: Users & Chat */}
                    {joinRequests.length > 0 ? (
                      <button className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-blue-100 border-2 border-gray-400 hover:border-blue-500 text-gray-700 transition"
                        onClick={()=>{
                          (usersDisplay==="hidden"?setUserDisplay("flex"):setUserDisplay("hidden"))
                        }}
                        title="View join requests and users"
                      >
                        <TbUsersPlus className="text-gray-700" size={20} />
                        {/* Optionally, add a badge for joinRequests.length */}
                        {joinRequests.length > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold bg-red-400 text-white rounded-full">{joinRequests.length}</span>
                        )}
                      </button>
                    ) : (
                      <button className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-blue-100 border-2 border-gray-400 hover:border-blue-500 text-gray-700 transition"
                        onClick={()=>{
                          (usersDisplay==="hidden"?setUserDisplay("flex"):setUserDisplay("hidden"))
                        }}
                        title="View users in room"
                      >
                        <LuUsers className="text-gray-700" size={20} />
                      </button>
                    )}
                    {console.log(usersDisplay)}
                    <button className="relative flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-blue-100 border-2 border-gray-400 hover:border-blue-500 text-gray-700 transition"
            onClick={() => setChatOpen((v)=>!v)}
            title="Open chat"
          >
            <MdChatBubbleOutline className="text-gray-700" size={20} />
            {unreadCount > 0 && !chatOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce z-10">{unreadCount}</span>
            )}
          </button>
          <audio ref={chatNotifSoundRef} src="https://cdn.pixabay.com/audio/2022/03/15/audio_115b9c7b44.mp3" preload="auto" />
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Floating panel for users/join requests */}
          {usersDisplay === "flex" && (
            <div className="absolute right-4 top-20 z-50 bg-white shadow-xl rounded-2xl p-4 w-80 max-h-[80vh] border border-gray-200 transition-all duration-300 flex flex-col gap-4" style={{minWidth:'260px'}}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-lg font-semibold text-gray-700">Users & Requests</p>
                <button
                  className="text-gray-400 hover:text-gray-700 text-xl font-bold px-2"
                  onClick={() => setUserDisplay("hidden")}
                  aria-label="Close users panel"
                >
                  &times;
                </button>
              </div>

              {/* Admin: show join requests if any */}
              {isAdmin && joinRequests.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1 text-base font-semibold text-gray-700">Join Requests:</div>
                  <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
                    {joinRequests.map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-4 p-3 bg-gradient-to-r from-gray-100 to-blue-50 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-200 text-blue-700 font-bold text-lg shadow-sm">
                            {d.userName?.[0]?.toUpperCase() || 'U'}
                          </span>
                          <span className="font-semibold text-base text-gray-900 tracking-wide">{d.userName}</span>
                        </div>
                        <button
                          className="bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 focus:ring-2 focus:ring-blue-300 text-white px-4 py-1.5 rounded-full shadow transition-all font-bold text-sm"
                          onClick={() => onAdmit(d.userName, d.id)}
                        >
                          Admit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Always show joined users for both admin and non-admin */}
              <div>
                <div className="mb-1 text-base font-semibold text-gray-700">Joined Users:</div>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {users.length === 0 ? (
                    <div className="text-gray-400 text-sm italic px-2 py-3">No users yet.</div>
                  ) : (
                    users.map((user, idx) => (
                      <div key={user.id || idx} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-200 text-blue-700 font-bold text-sm">
                          {user.userName?.[0]?.toUpperCase() || 'U'}
                        </span>
                        <span className="font-medium text-gray-900 text-sm">{user.userName}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Room;
