import React, { use } from "react";
import socket from "../Socket";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import WhiteBoard from "./WhiteBoard";
import { useRef } from "react";
const Room = () => {
  const { roomId } = useParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const location = useLocation();
  const [currrentuser, setCurrentUser] = useState("");
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
    socket.emit("join_room_request", { roomId, currrentuser });
    //If user is admin it will identify
    socket.on("identifiedAdmin", () => {
      setIsAdmin(true);
    });
    //it will intimate who was joining
    socket.on("join_approval", ({ socketId, userName }) => {

      console.log(currrentuser, "is waiting for approval");

      
      setJoinRequests((prev) => [...prev, {id:socketId,userName:userName}]);
    });

    socket.on("aproved_user", ({ socketId }) => {
      console.log("hello you are approved");
    });

    socket.on("approved", ({username}) => {

      console.log("you are approved Bro!",username,socket.id);
      socket.emit("final_join", { roomId ,username});
    });

    socket.on("user_joined", ({ socketId }) => {
      console.log(socketId, "joined");
    });

    if (location.state?.userName) {
      setCurrentUser(location.state.userName);
    }
  }, [currrentuser, roomId]);

  const onAdmit = (username,socketId) => {
    console.log(username,socketId);
    socket.emit("aprove_user", { roomId, socketId ,username});
    setJoinRequests(joinRequests.filter((d) => d.id !== socketId));
  };

  return (
    <div>
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
              className="py-2   bg-blue-300 pr-4 text-center  rounded-xl"
              onClick={() => setCurrentUser(userRef.current.value)}
            >
              Submit
            </button>
          </div>
        </>
      ) : (
        <>
          {/* {console.log(location.state)}; */}
          <div className="flex justify-around">
            <p className="text-2xl">Room</p>
            <p className="text-2xl">{currrentuser}</p>
          </div>
          <p>{isAdmin ? <>this is admin</> : <>This is not admin</>}</p>
          <div className="flex justify-center">
            <div className=" w-1/3  border-2 ">
            {console.log(joinRequests)}
              {joinRequests.map((d) => {
                return (
                  <div key={d.id}>
                    <div className="flex gap-4 mt-3 text-center">
                      {console.log(d)}
                      <p>{d.userName}</p>
                      <button
                        className="bg-gray-400 rounded py-2 px-3  "
                        onClick={(e) => onAdmit(d.userName,d.id)}
                      >
                        Admit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {roomId && <WhiteBoard state={roomId}></WhiteBoard>}
        </>
      )}
    </div>
  );
};

export default Room;
