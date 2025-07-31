import React from 'react'
import {v4 as uuidvd} from 'uuid';
import {useNavigate} from 'react-router-dom';
import { useState } from 'react';
const Home = () => {
    const Navigate=useNavigate();
    const [userName,setUserName]=useState('')

    const onsubmit=()=>{
        const roomId=uuidvd().slice(0,6);
        Navigate(`/room/${roomId}`,{state:{userName}})
    }


  return (
    <div className="flex justify-center items-center h-screen border-2 border-gray-100">
      {console.log(userName)}
      <input placeholder='Entere name' className='py-3 text-center mr-4 border-2 border-gray-300 rounded' onChange={(e)=>{setUserName(e.target.value)}}></input>


        <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ' onClick={onsubmit}> On Click</button>



    </div>
  )
}

export default Home