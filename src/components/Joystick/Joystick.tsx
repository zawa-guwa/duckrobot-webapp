import { useRef, useState, useEffect } from 'react';
import * as ROSLIB from "roslib";


interface JoystickProps {
  baseDiameter?: number;    // ジョイスティックの大きな円（ベース）の直径(px)
  handleDiameter?: number;  // ジョイスティックの小さな円（ハンドル）の直径(px)
  deadzone?: number;        // 中央のデッドゾーン（0〜1）
  ros: ROSLIB.Ros | null;
};

export const Joystick = ({ 
  baseDiameter = 200,
  handleDiameter = 100,
  deadzone = 0.05,
  ros
}: JoystickProps) => {
  const containerRef = useRef<HTMLDivElement>(null); // ジョイスティックのdiv要素への参照
  const [handlePos, setHandlePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // ハンドルの位置

  const draggingRef = useRef(false); // 最新のdraggingへの参照
  const [dragging, setDragging] = useState(false); // ハンドルをドラッグ中である: true

  const prevPubX = useRef(0);
  const prevPubY = useRef(0);

  const baseRadius = baseDiameter / 2; // ジョイスティックの大きな円（ベース）の半径(px)
  const handleRadius = handleDiameter / 2; // ジョイスティックの小さな円（ハンドル）の半径(px)

  const controlRef = useRef<InstanceType<typeof ROSLIB.Topic> | null>(null);

  useEffect(() => {
    if (!ros) {
      return;
    }

    controlRef.current = new ROSLIB.Topic({
      ros : ros,
      name : '/motor_data',
      messageType : 'motor_control/msg/Joystick'
    });
  }, [ros]);


  /**
   * @brief 小数点以下を指定した桁数で丸める
   * @param num 丸めたい数値
   * @param places 桁数
   * @return 指定した桁数で丸められた数値
   */
  const roundTo = function(num: number, places: number) {
    const factor = 10 ** places;
    return Math.round(num * factor) / factor;
  };

  /**
   * @brief rosbridgeにモーターへの指令を送信する
   * @param x 正規化された、Joystic中心を原点としたJoysticのハンドルのx座標
   * @param y 正規化された、Joystic中心を原点としたJoysticのハンドルのy座標
   * @return なし
   */
  const sendDataToRos = (x: number, y: number) => {
    if (!controlRef.current) {
      return;
    }

    const pubX = roundTo(Number(x), 2);
    const pubY = roundTo(Number(y), 2);

    if ((prevPubX.current === pubX) && (prevPubY.current === pubY)) {
      return;
    }

    const twist = ({
      x: pubX,
      y: pubY
    });

    console.log("twist = ", twist);
    controlRef.current.publish(twist);

    prevPubX.current = pubX;
    prevPubY.current = pubY;
    
  };

  /**
   * @brief ROSに送信すべき指令値を算出し、送信を指示する
   * @param handle_x Joystic中心を原点としたJoysticのハンドルのx座標
   * @param handle_y Joystic中心を原点としたJoysticのハンドルのy座標
   * @return なし
   */
  const calcAndSendCommandData = (handle_x: number, handle_y: number) => {
    const range = baseRadius - handleRadius;
    let x = handle_x / range; // 正規化された、Joystic中心を原点としたJoysticのハンドルのx座標
    let y = -1 * handle_y / range; // 正規化された、Joystic中心を原点としたJoysticのハンドルのy座標(上向きが正)

    // 範囲外の場合は範囲内に丸める
    x = Math.max(-1, Math.min(1, x));
    y = Math.max(-1, Math.min(1, y));

    const rss = Math.hypot(x, y);
    if (rss > 1) {
      x /= rss;
      y /= rss;
    }

    const dz = Math.max(0, Math.min(0.5, deadzone));
    if (rss < dz) {
      // ハンドルがデッドゾーン内である場合
      sendDataToRos(0, 0);
    } else {
      const scale = (rss - dz) / (1 - dz);
      sendDataToRos((x / rss) * scale, (y / rss) * scale);
    }
  };

  /**
   * @brief ハンドル位置を算出して設定し、ROSへのコマンド送信指示を行う
   * @param clientX ポインターの、Viewport左上からの水平方向位置
   * @param clientY ポインターの、Viewport左上からの垂直方向位置
   * @return なし
   */
  const setHandlePosByPointer = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const center_x = rect.left + rect.width / 2; // Joystic原点の、Viewport左上からの水平方向位置
    const center_y = rect.top + rect.height / 2; // Joystic原点の、Viewport左上からの垂直方向位置
    const actual_handle_x = clientX - center_x; // Joystic中心を原点とした、Joysticのハンドルのx座標
    const actual_handle_y = clientY - center_y; // Joystic中心を原点とした、Joysticのハンドルのy座標(下向きが正)

    const dist = Math.hypot(actual_handle_x, actual_handle_y); // Joystic中心からの、ポインターの移動距離
    const max = baseRadius - handleRadius; // Joystic中心からのポインターの移動距離の上限値
    let handle_x = actual_handle_x;
    let handle_y = actual_handle_y;
    if (dist > max) {
      // 上限値超過の場合は丸める
      const s = max / dist;
      handle_x *= s;
      handle_y *= s;
    }

    setHandlePos({ x: handle_x, y: handle_y });
    calcAndSendCommandData(handle_x, handle_y);
  };

  /**
   * @brief ハンドルに対し、ポインターがアクティブになった場合のイベント処理
   * @param e ポインターイベント
   * @return なし
   */
  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    containerRef.current?.setPointerCapture(e.pointerId);
    setHandlePosByPointer(e.clientX, e.clientY);
  };

  /**
   * @brief ハンドル操作中のポインターの座標が変化し、かつポインターがキャンセルされていない場合のイベント処理
   * @param e ポインターイベント
   * @return なし
   */
  const handlePointerMove = (e: PointerEvent) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    setHandlePosByPointer(e.clientX, e.clientY);
  };

  /**
   * @brief ハンドル操作が終了した場合のイベント処理
   * @param e ポインターイベント
   * @return なし
   */
  const endDrag = (e: PointerEvent) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    setDragging(false);
    setHandlePos({ x: 0, y: 0 });
    sendDataToRos(0, 0);
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    draggingRef.current = dragging;
  }, [dragging]);

  useEffect(() => {
    // セットアップ処理
    const el = containerRef.current;
    if (!el) {
      return;
    }

    // イベント処理内でのe.preventDefault()を有効にして、ブラウザのスクロール等を無効にする
    const option: AddEventListenerOptions = { passive: false };  

    el.addEventListener('pointerdown', handlePointerDown, option);
    window.addEventListener('pointermove', handlePointerMove, option);
    window.addEventListener('pointerup', endDrag, option);
    window.addEventListener('pointercancel', endDrag, option);

    return () => {
      // クリーンアップ処理
      el.removeEventListener('pointerdown', handlePointerDown, option);
      window.removeEventListener('pointermove', handlePointerMove, option);
      window.removeEventListener('pointerup', endDrag, option);
      window.removeEventListener('pointercancel', endDrag, option);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: baseDiameter,
        height: baseDiameter,
        borderRadius: '50%',
        backgroundColor: '#e4e4e4',
        border: `2px solid #cec8c8`,
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: baseRadius - handleRadius + handlePos.x,
          top: baseRadius - handleRadius + handlePos.y,
          width: handleDiameter,
          height: handleDiameter,
          borderRadius: '50%',
          background: dragging ? '#f8a43d' : '#f8c63d',
          transition: dragging ? 'none' : 'left 120ms ease, top 120ms ease',
        }}
      />
    </div>
  );
};