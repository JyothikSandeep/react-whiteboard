import React from 'react'
import Header from './Header';
import { Outlet } from 'react-router-dom';
import Footer from './Footer';
export const Layout = () => {
  return (
    <div>
        <Header></Header>
        <Outlet></Outlet>
        <Footer></Footer>
            
    </div>
  )
}
