import React, { useState, useEffect, useRef } from "react";
import socket from "../Socket";
import { useParams, useLocation } from "react-router-dom";
import WhiteBoard from "./WhiteBoard";
import Header from "./Header";
import Footer from "./Footer";

const Room = () => {
  const { roomId } = useParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const location = useLocation();
  const [currrentuser, setCurrentUser] = useState("");
  const userRef = useRef("");

  useEffect(() => {
    if (location.state?.userName) {
      setCurrentUser(location.state.userName);
    }
  }, [location.state]);

  useEffect(() => {
    if (!currrentuser) {
      return;
    }
    socket.emit("join_room_request", { roomId, currrentuser });
    socket.on("identifiedAdmin", () => {
      setIsAdmin(true);
    });
    socket.on("join_approval", ({ socketId, userName }) => {
      setJoinRequests((prev) => [...prev, userName]);
    });

    socket.on("aproved_user", ({ socketId }) => {
      // approved user
    });

    socket.on("approved", () => {
      socket.emit("final_join", { roomId });
    });

    socket.on("user_joined", ({ socketId }) => {
      // user joined
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
    };
  }, [currrentuser, roomId, location.state]);

  const onAdmit = (userName) => {
    socket.emit("aprove_user", { roomId, socketId: userName });
    setJoinRequests(joinRequests.filter((d) => d !== userName));
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center">
        {currrentuser === "" ? (
          <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-700">
              Enter Your Name
            </h2>
            <input
              type="text"
              ref={userRef}
              placeholder="Please enter your name"
              className="border border-indigo-300 py-2 px-4 w-full rounded mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-center"
            />
            <button
              className="w-full py-2 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 transition"
              onClick={() => setCurrentUser(userRef.current.value)}
            >
              Submit
            </button>
          </div>
        ) : (
          <div className="w-full max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <p className="text-2xl font-bold text-indigo-700">
                Room:{" "}
                <span className="font-normal text-gray-700">{roomId}</span>
              </p>
              <p className="text-2xl font-bold text-indigo-700">
                User:{" "}
                <span className="font-normal text-gray-700">{currrentuser}</span>
              </p>
            </div>
            <p className="mb-4 text-center text-lg">
              {isAdmin ? (
                <span className="text-green-600 font-semibold">
                  You are the admin
                </span>
              ) : (
                <span className="text-gray-600">You are a participant</span>
              )}
            </p>
            {isAdmin && joinRequests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-indigo-600">
                  Join Requests
                </h3>
                <div className="bg-white border rounded-lg p-4">
                  {joinRequests.map((d) => (
                    <div
                      key={d}
                      className="flex items-center justify-between mb-2"
                    >
                      <p className="text-gray-800">{d}</p>
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white rounded px-4 py-1 transition"
                        onClick={() => onAdmit(d)}
                      >
                        Admit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-8">
              {roomId && <WhiteBoard roomId={roomId} userName={currrentuser} />}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Room;
