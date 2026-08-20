import { motion } from 'framer-motion';

export default function ScrollReveal({ children, direction = 'up', delay = 0, style = {}, className = '' }) {
  const directions = {
    up: { y: 60, opacity: 0 },
    down: { y: -60, opacity: 0 },
    left: { x: -60, opacity: 0 },
    right: { x: 60, opacity: 0 }
  };

  const initial = directions[direction] || directions.up;

  return (
    <motion.div
      initial={initial}
      whileInView={{ x: 0, y: 0, opacity: 1 }}
      viewport={{ once: false, amount: 0.15 }}
      transition={{
        duration: 0.8,
        delay: delay,
        ease: [0.25, 0.8, 0.25, 1] // cubic-bezier smooth ease
      }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}
