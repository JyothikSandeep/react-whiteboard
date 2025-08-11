import React from 'react'
import {v4 as uuidvd} from 'uuid';
import {useNavigate, useLocation} from 'react-router-dom';
import { useState } from 'react';
import './Home.css'
// import {Logo} from '../assets/logo.svg';
const Home = () => {
    const Navigate=useNavigate();
    const [userName, setUserName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [mode, setMode] = useState('create'); // 'create' or 'join'

    const onsubmit = () => {
        const newRoomId = uuidvd().slice(0, 6);
        Navigate(`/room/${newRoomId}`, { state: { userName } });
    };

    const onJoinRoom = () => {
        if (roomId && userName) {
            Navigate(`/room/${roomId}`, { state: { userName } });
        } else {
            alert('Please enter both your name and a room ID to join.');
        }
    };

  return (
    <div className='min-h-screen bg-[#F6F8FC] flex flex-col'>

      <div className='pt-5'>
        {/* <p>{Logo}</p> */}
      <p className='text-4xl font-bold text-[#222B45] text-center pt-12 font-main tracking-wide'>Sribble Link</p>
      </div>
      <div className="mt-8 flex justify-center gap-6 text-2xl font-semibold font-main text-[#222B45]">
  <span className="border-b-4 border-[#4F8CFF] pb-1">Collaborate</span>
  <span className="border-b-4 border-[#43D9A3] pb-1">Draw</span>
  <span className="border-b-4 border-[#FFA726] pb-1">Chat</span>
  <span className="border-b-4 border-[#A259FF] pb-1">Create</span>
</div>
      <div className='mt-3'>
      <p className="text-sm text-center text-gray-500 mt-2 font-main">
  The live whiteboard for teams and creators.
</p>
      </div>
      <p></p>
    <div className="flex flex-col items-center mt-10 gap-6 w-full">
      {/* Toggle Tabs */}
      <div className="flex gap-0 bg-[#F6F8FC] rounded-lg shadow-inner p-1 w-fit border border-[#E3E8F0]">
        <button
          className={`px-7 py-2 rounded-l-lg font-semibold transition-all duration-150 text-base font-main tracking-wide border-r border-[#E3E8F0] focus:outline-none 
            ${mode === 'create' ? 'bg-[#A259FF] text-white shadow-md scale-105 z-10' : 'bg-white text-[#A259FF] hover:bg-[#f5f0ff]'}
          `}
          style={{minWidth:'130px'}}
          onClick={() => setMode('create')}
        >
          Create Room
        </button>
        <button
          className={`px-7 py-2 rounded-r-lg font-semibold transition-all duration-150 text-base font-main tracking-wide focus:outline-none 
            ${mode === 'join' ? 'bg-[#43D9A3] text-white shadow-md scale-105 z-10' : 'bg-white text-[#43D9A3] hover:bg-[#f0fcf8]'}
          `}
          style={{minWidth:'130px'}}
          onClick={() => setMode('join')}
        >
          Join Room
        </button>
      </div>
      {/* Form Section */}
      <div className={`flex flex-col items-center gap-4 w-full mt-4`}>
        <div className={`flex ${mode === 'join' ? 'flex-row' : 'flex-col'} justify-center gap-4 items-center w-full`}>
          <input
            placeholder="Enter your name..."
            className="px-5 py-3 rounded-lg shadow-sm border border-[#E3E8F0] bg-white text-[#222B45] font-main focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] transition placeholder-gray-400 w-64 text-small"
            onChange={(e) => setUserName(e.target.value)}
          />
          {mode === 'join' && (
            <input
              placeholder="Room ID"
              className="px-5 py-3 rounded-lg shadow-sm border border-[#E3E8F0] bg-white text-[#222B45] font-main focus:outline-none focus:ring-2 focus:ring-[#43D9A3] transition placeholder-gray-400 w-48 text-small"
              onChange={(e) => setRoomId(e.target.value)}
            />
          )}
        </div>
        <button
          className="w-48 py-3 rounded-lg font-bold font-main shadow-md transition-all duration-200 text-base tracking-wide mt-2 bg-gradient-to-r from-[#4F8CFF] to-[#FF6B6B] hover:from-[#FF6B6B] hover:to-[#4F8CFF] text-white border-0"
          onClick={mode === 'create' ? onsubmit : onJoinRoom}
        >
          Get Started
        </button>
      </div>
    </div>
    </div>
  )
}

export default Home