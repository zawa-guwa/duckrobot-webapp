import { useEffect } from 'react';
import { Ros } from 'roslib';

interface RosConnectionProps {
  rosUrl: string;
  setRos: any;
};

export const RosConnection = ({ 
  rosUrl,
  setRos
}: RosConnectionProps) => {

  useEffect(() => {
    // Create ros object to communicate over your Rosbridge connection
    const ros = new Ros({
      url: rosUrl
    });

    ros.on("connection", () => {
      setRos(ros);
      // When the Rosbridge server connects
      console.log('Connected to ROSBridge WebSocket server.');
    });
  
    ros.on('error', function(error) {
      // When the Rosbridge server experiences an error
			console.log('Error connecting to ROSBridge WebSocket server: ', error);
    });
  
    ros.on('close', function() {
			// When the Rosbridge server shuts down
      console.log('Connection to ROSBridge WebSocket server closed.');
    });

    return () => {
      ros.close();
    };
  }, [rosUrl, setRos]);

  return (
    <>
    </>
  );
}