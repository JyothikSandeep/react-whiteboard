import React from 'react'
import Header from './Header';
import { Outlet } from 'react-router-dom';
export const Layout = () => {
  return (
    <div>
        {/* <Header></Header> */}
        <Outlet></Outlet>
            
    </div>
  )
}
