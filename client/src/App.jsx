
import './App.css'
import {Route,Routes,BrowserRouter} from 'react-router-dom';
import Header from './components/Header';
import { Layout } from './components/Layout';
import Room from './components/Room';
// import Body from './components/Body';
import Home from './components/Home';
function App() {
  

  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Layout></Layout>}>
        <Route index element={<Home></Home>}></Route>
      </Route>
      <Route path='/room/:roomId' element={<Room></Room>}></Route>
    </Routes>
    </BrowserRouter>
      {/* <p className='text-4xl bg-gray-500 text-center'>Hello</p> */}
      
    </>
  )
}

export default App
