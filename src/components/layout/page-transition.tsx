import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { pageTransition, pageVariants } from "@/lib/motion";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <motion.div
      key={location}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className="flex-1 flex flex-col min-h-0"
    >
      {children}
    </motion.div>
  );
}
