import React, { useRef, useState, useEffect } from 'react';
// import { Topic } from 'roslib';
import * as ROSLIB from "roslib";




type JoystickProps = {
  size?: number;           // 大きな円の直径(px)
  handleSize?: number;       // 小さな円（ノブ）の直径(px)
  deadzone?: number;       // 中央のデッドゾーン（0〜1）
  // onChange?: (vec: { x: number; y: number }) => void;
  onRelease?: () => void;
  ros: any;
};

const Joystick: React.FC<JoystickProps> = ({
  size = 200,
  handleSize = 60,
  deadzone = 0.05,
  // onChange = () => {},
  onRelease = () => {},
  ros
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [handlePos, setHandlePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const radius = size / 2;
  const handleRadius = handleSize / 2;

  const sendDataToRos = (x: number, y: number) => {
    if (!ros) {
      return;
    }
    console.log('sendDataToRos is called');

    var image = new ROSLIB.Topic({
      ros : ros,
      name : '/motor_data',
      messageType : 'motor_control/msg/Joystick'
    });
  
    let twist = ({
      x: Number(x),
      y: Number(y)
    });

    console.log("twist = ", twist);
    // image.publish(function(twist) {
    //   console.log('Send motor data');
    // });
    image.publish(twist);
  };

  const emitChange = (handle_x: number, handle_y: number) => {
    // console.log("dx = ", dx, ", dy = ", dy);
    let x = handle_x / radius; // 正規化された、Joystic中心を原点としたJoysticのハンドルのx座標
    let y = -1 * handle_y / radius; // 正規化された、Joystic中心を原点としたJoysticのハンドルのy座標(上向きが正)

    x = Math.max(-1, Math.min(1, x));
    y = Math.max(-1, Math.min(1, y));

    const rss = Math.hypot(x, y);
    if (rss > 1) {
      x /= rss;
      y /= rss;
    }

    const dz = Math.max(0, Math.min(0.5, deadzone));
    if (rss < dz) {
      sendDataToRos(0, 0);
    } else {
      const scale = (rss - dz) / (1 - dz);
      sendDataToRos((x / rss) * scale, (y / rss) * scale);
    }
  };

  const setHandlePosByPointer = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const center_x = rect.left + rect.width / 2; // Joystic原点の、Viewport左上からの水平方向位置
    const center_y = rect.top + rect.height / 2; // Joystic原点の、Viewport左上からの垂直方向位置
    const handle_x = clientX - center_x; // Joystic中心を原点とした、Joysticのハンドルのx座標
    const handle_y = clientY - center_y; // Joystic中心を原点とした、Joysticのハンドルのy座標(下向きが正)

    // console.log("handle_x = ", handle_x, ", handle_y = ", handle_y);

    const dist = Math.hypot(handle_x, handle_y);
    const max = radius - handleRadius;
    let actual_handle_x = handle_x;
    let actual_handle_y = handle_y;
    if (dist > max) {
      const s = max / dist;
      actual_handle_x *= s;
      actual_handle_y *= s;
    }

    setHandlePos({ x: actual_handle_x, y: actual_handle_y });
    emitChange(actual_handle_x, actual_handle_y);
  };

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    containerRef.current?.setPointerCapture(e.pointerId);
    setHandlePosByPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    e.preventDefault();
    setHandlePosByPointer(e.clientX, e.clientY);
  };

  const endDrag = (e: PointerEvent) => {
    if (!dragging) return;
    e.preventDefault();
    setDragging(false);
    setHandlePos({ x: 0, y: 0 });
    sendDataToRos({ x: 0, y: 0 });
    onRelease();
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const opts: AddEventListenerOptions = { passive: false };

    el.addEventListener('pointerdown', handlePointerDown, opts);
    window.addEventListener('pointermove', handlePointerMove, opts);
    window.addEventListener('pointerup', endDrag, opts);
    window.addEventListener('pointercancel', endDrag, opts);

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown, opts);
      window.removeEventListener('pointermove', handlePointerMove, opts);
      window.removeEventListener('pointerup', endDrag, opts);
      window.removeEventListener('pointercancel', endDrag, opts);
    };
  }, [dragging]);

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 50%, #f7f7f7, #e4e4e4)',
        boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.15)',
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: radius - handleRadius + handlePos.x,
          top: radius - handleRadius + handlePos.y,
          width: handleSize,
          height: handleSize,
          borderRadius: '50%',
          background: dragging ? '#4c8bf5' : '#6fa8ff',
          boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
          border: '2px solid rgba(255,255,255,0.9)',
          transition: dragging ? 'none' : 'left 120ms ease, top 120ms ease',
        }}
      />
    </div>
  );
};

export default Joystick;