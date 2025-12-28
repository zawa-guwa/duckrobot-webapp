import { useState } from 'react'
import Joystick from './components/Joystick/Joystick'
import CameraView from './components/CameraView/CameraView'
import RosConnection from './components/RosConnection'
import './App.css'

function App() {
  const [ros, setRos] = useState(null);
  const [vec, setVec] = useState({ x: 0, y: 0 });

  return (
    <>
      <RosConnection rosUrl="ws://192.168.3.43:9090" rosDomainId="89" setRos={setRos} />
      <div className="app">
        <div className="header">
         <a>Duck Robot</a>
        </div>
        <div className="main">
          <CameraView ros={ros}  />
         <div className="control-area">   
          <div className='joystick'>
            <Joystick 
              // onChange={(v) => {
              //   setVec(v);
              //   // 例：API送信やWebSocketでモータへ指令
              //   // ws.send(JSON.stringify({ throttle: v.y, steer: v.x }));
              // }}
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
