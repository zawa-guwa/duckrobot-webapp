import { useRef, useState, useEffect } from 'react';
import * as ROSLIB from "roslib";
import { Joystick } from './components/Joystick/Joystick';
import { CameraView } from './components/CameraView/CameraView';
import { Button } from './components/Button/Button';
import { RosConnection } from './components/RosConnection';
import './App.css';

function App() {
  const [ros, setRos] = useState(null);

  const controlRef = useRef<InstanceType<typeof ROSLIB.Topic> | null>(null);

  useEffect(() => {
    if (!ros) {
      return;
    }

    controlRef.current = new ROSLIB.Topic({
      ros : ros,
      name : '/audio_state',
      messageType : 'std_msgs/msg/Bool'
    });
  }, [ros]);

  /**
   * @brief rosbridgeにスピーカー出力状態を送信する
   * @param state スピーカー出力状態
   * @return なし
   */
  const sendDataToRos = (state: boolean) => {
    if (!controlRef.current) {
      return;
    }

    console.log("state = ", state);
    controlRef.current.publish({data: state});
  
  };

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
            <Joystick
              ros={ros}
            />
            <Button
              label="ぐわっ"
              onMouseDown={() => {sendDataToRos(true)}}
              onMouseUp={() => {sendDataToRos(false)}}
            />
         </div>
        </div>
      </div>
    </>
  )
}

export default App
