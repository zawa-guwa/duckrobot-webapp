import styles from './button.module.css';

interface ButtonProps {
  label: string;    // ボタンに表示する文字
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onClick?: () => void;
};

export const Button = ({ 
  label,
  onMouseDown,
  onMouseUp,
  onClick
}: ButtonProps) => {

  return (
    <button 
      className={styles.button}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onClick={onClick}
    >
      {label}
    </button>
  );
};