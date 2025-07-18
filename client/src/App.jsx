
import './App.css'
import {Route,Routes,BrowserRouter} from 'react-router-dom';

import Header from './components/Header';
import { Layout } from './components/Layout';
import Body from './components/Body';
function App() {
  

  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Layout></Layout>}>
        <Route index element={<Body></Body>}></Route>
      </Route>
    </Routes>
    </BrowserRouter>
      {/* <p className='text-4xl bg-gray-500 text-center'>Hello</p> */}
      
    </>
  )
}

export default App
