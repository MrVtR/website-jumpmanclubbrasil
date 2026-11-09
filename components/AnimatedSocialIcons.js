"use client";
import { motion, useAnimation } from "framer-motion";
import { SocialIcon } from "react-social-icons";
import { useEffect } from "react";

// One component per icon, so each one owns its animation controller
// (hooks can't be called inside a .map() callback).
function AnimatedIcon({ item, iconSize, pulseSpeed, hoverScale }) {
  const controls = useAnimation();

  const pulse = () =>
    controls.start({
      scale: [1, 1.15, 1],
      transition: {
        duration: pulseSpeed,
        ease: "easeInOut",
        repeat: Infinity,
      },
    });

  // Start the pulse animation when the icon mounts.
  useEffect(() => {
    pulse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulseSpeed]);

  return (
    <motion.div
      animate={controls}
      whileHover={{
        scale: hoverScale,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 10,
        },
      }}
      // Restart the pulse for the icon that was hovered.
      onHoverEnd={pulse}
      className="flex items-center justify-center"
    >
      <SocialIcon
        network={item.name}
        url={item.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          height: iconSize,
          width: iconSize,
          transformOrigin: "center",
          cursor: "pointer",
        }}
      />
    </motion.div>
  );
}

const AnimatedSocialIcons = ({
  icons_list_url,
  iconSize = 50,
  pulseSpeed = 2,
  hoverScale = 1.2,
  className = "",
  gridColumns = 3,
}) => {
  return (
    <div
      className={`grid gap-5 ${className}`}
      style={{
        marginTop: "20px",
        gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
      }}
    >
      {icons_list_url.map((item, index) => (
        <AnimatedIcon
          key={`${item.url}-${index}`}
          item={item}
          iconSize={iconSize}
          pulseSpeed={pulseSpeed}
          hoverScale={hoverScale}
        />
      ))}
    </div>
  );
};

export default AnimatedSocialIcons;
