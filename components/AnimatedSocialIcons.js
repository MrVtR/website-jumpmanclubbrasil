"use client";
import { motion, useAnimation } from "framer-motion";
import { SocialIcon } from "react-social-icons";
import { useEffect } from "react";

const AnimatedSocialIcons = ({
  icons_list_url,
  iconSize = 50,
  pulseSpeed = 2,
  hoverScale = 1.2,
  className = "",
  gridColumns = 3,
}) => {
  // Create an individual animation controller for each icon.
  const controllers = icons_list_url.map(() => useAnimation());

  // Start the pulse animation for each icon when the component mounts.
  useEffect(() => {
    controllers.forEach((controls) => {
      controls.start({
        scale: [1, 1.15, 1],
        transition: {
          duration: pulseSpeed,
          ease: "easeInOut",
          repeat: Infinity,
        },
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulseSpeed]);

  return (
    <div
      className={`grid gap-5 ${className}`}
      style={{
        marginTop: "20px",
        gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
      }}
    >
      {icons_list_url.map((item, index) => (
        <motion.div
          key={`${item.url}-${index}`}
          animate={controllers[index]}
          whileHover={{
            scale: hoverScale,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 10,
            },
          }}
          onHoverEnd={() => {
            // Only restart the pulse animation for the hovered icon.
            controllers[index].start({
              scale: [1, 1.15, 1],
              transition: {
                duration: pulseSpeed,
                ease: "easeInOut",
                repeat: Infinity,
              },
            });
          }}
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
      ))}
    </div>
  );
};

export default AnimatedSocialIcons;
