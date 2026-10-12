import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

interface TiltedWrapperProps {
  children: React.ReactNode;
  scaleOnHover?: number;
  rotateAmplitude?: number;
}

export const TiltedWrapper = ({
  children,
  scaleOnHover = 1.05,
  rotateAmplitude = 2,
}: TiltedWrapperProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), {
    damping: 30,
    stiffness: 100,
    mass: 2,
  });
  const rotateY = useSpring(useMotionValue(0), {
    damping: 30,
    stiffness: 100,
    mass: 2,
  });
  const scale = useSpring(1, { damping: 30, stiffness: 100, mass: 2 });

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
  }

  function handleMouseLeave() {
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className="[perspective:800px]"
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        scale,
      }}
    >
      {children}
    </motion.div>
  );
};