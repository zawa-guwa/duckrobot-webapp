import { useEffect, useState } from 'react';
import * as ROSLIB from "roslib";

interface CameraViewProps {
  ros: ROSLIB.Ros | null;
};

export const CameraView = ({
  ros
}: CameraViewProps) => {
  const [imgData, setImgData] = useState('');

  useEffect(() => {
    if (!ros) {
        return;
      }

    const image = new ROSLIB.Topic({
      ros : ros,
      name : '/image_base64',
      messageType : 'std_msgs/msg/String'
    });
  
    image.subscribe(function(message) {
      const data = "data:image/png;base64," + message.data;
      setImgData(data);
    });
  
  }, [ros]);
  
  return (
    <>
    {imgData && (
      <img src={imgData} alt="Camera Data" />
    )}
    </>
  );
}