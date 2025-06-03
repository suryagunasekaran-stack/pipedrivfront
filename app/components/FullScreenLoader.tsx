// app/components/FullScreenLoader.tsx
import React from 'react';
import Lottie from "lottie-react";
import lottie from '../../public/lottie.json'; // Adjust path as needed

const FullScreenLoader: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000000', // Black background
      zIndex: 9999,
      flexDirection: 'column',
    }}>
      <Lottie animationData={lottie} loop={true} style={{ width: 200, height: 200 }} />
      <p style={{ marginTop: '20px', fontSize: '18px', color: 'white' }}>Loading</p>
    </div>
  );
};

export default FullScreenLoader;
