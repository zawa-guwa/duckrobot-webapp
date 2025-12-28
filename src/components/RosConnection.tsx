import React, { useEffect } from 'react';
import { Ros } from 'roslib';

const RosConnection = ({ rosUrl, rosDomainId, setRos}) => {

  useEffect(() => {
    // Create ros object to communicate over your Rosbridge connection
    const ros = new Ros({
      url: rosUrl,
      options: {
        ros_domain_id: rosDomainId
      }
    });

    ros.on("connection", () => {
      setRos(ros);
      // When the Rosbridge server connects, fill the span with id "status" with "successful"
      document.getElementById("status").innerHTML = "successful";
      console.log('Connected to ROSBridge WebSocket server.');
    });
  
    ros.on('error', function(error) {
      // When the Rosbridge server experiences an error, fill the "status" span with the returned error  
      document.getElementById("status").innerHTML = `errored out (${error})`;;
			console.log('Error connecting to ROSBridge WebSocket server: ', error);
    });
  
    ros.on('close', function() {
			// When the Rosbridge server shuts down, fill the "status" span with "closed"
			document.getElementById("status").innerHTML = "closed";
      console.log('Connection to ROSBridge WebSocket server closed.');
    });

    return () => {
      ros.close();
    };
  }, [rosUrl, rosDomainId, setRos]);

  return (
    <>
    </>
  );
}
export default RosConnection;