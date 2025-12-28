import React, { useEffect, useState } from 'react';
// import { Topic } from 'roslib';
import * as ROSLIB from "roslib";



const CameraView = ({ros}) => {
  const [imgData, setImgData] = useState('');

  useEffect(() => {
    if (!ros) {
        return;
      }

    var image = new ROSLIB.Topic({
      ros : ros,
      name : '/image_base64',
      messageType : 'std_msgs/msg/String'
    });
  
    image.subscribe(function(message) {
      const data = "data:image/png;base64," + message.data;
    //   const imgData = setAttribute('src', data);
      setImgData(data);
    });
  
  }, [ros]);
  
  return (
    <>
      <img src={imgData} alt="Camera Data" />
    </>
  );
}

export default CameraView