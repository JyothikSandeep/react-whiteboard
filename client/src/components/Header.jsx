import React from 'react'

const Header = () => {
  return (
    <section>
      <header className="text-gray-600 body-font bg-indigo-100">
        <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
          <a className="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0">
            <img
              src="../../public/whiteboard-22-svgrepo-com.svg"
              alt="Whiteboard Logo"
              className="w-10 h-10 text-white p-2 bg-indigo-500 rounded-full"
            />
            <span className="ml-3 text-xl">Whiteboard</span>
          </a>
          <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center">
            <a className="mr-5 hover:text-gray-900">First Link</a>
            <a className="mr-5 hover:text-gray-900">Second Link</a>
          </nav>
        </div>
      </header>
    </section>
  )
}

export default Header