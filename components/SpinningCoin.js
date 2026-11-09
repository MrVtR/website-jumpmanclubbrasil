// components/SpinningCoin.tsx
"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const SpinningCoin = () => {
  return (
    <div style={{ perspective: 1000 }}>
      {" "}
      {/* Add 3D perspective container */}
      <motion.div
        animate={{
          rotateY: 360, // Rotate around Y-axis for 3D effect
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          display: "inline-block",
          transformStyle: "preserve-3d", // Preserve 3D transformations
        }}
      >
        <Image
          src="/static/coin.webp"
          alt="3D Spinning Coin"
          width={100}
          height={100}
          style={{
            objectFit: "contain",
            transform: "translateZ(1px)", // Enhance 3D effect
          }}
        />
      </motion.div>
    </div>
  );
};

export default SpinningCoin;
