import { useState } from 'react';
import { Joystick } from './components/Joystick/Joystick';
import { CameraView } from './components/CameraView/CameraView';
import { RosConnection } from './components/RosConnection';
import './App.css';

function App() {
  const [ros, setRos] = useState(null);

  return (
    <>
      <RosConnection rosUrl="ws://192.168.3.43:9090" setRos={setRos} />
      <div className="app">
        <div className="header">
         <a>Duck Robot</a>
        </div>
        <div className="main">
          <CameraView ros={ros}  />
         <div className="control-area">   
          <div className='joystick'>
            <Joystick
              ros={ros}
            />
          </div>
         </div>
        </div>
      </div>
    </>
  )
}

export default App
