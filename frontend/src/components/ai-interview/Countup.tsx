'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export default function CountUp({ value }: { value: number }) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    useEffect(() => {
        const animation = animate(count, value, { duration: 1.5, ease: "easeOut" });
        return animation.stop;
    }, [value, count]);

    return <motion.span>{rounded}</motion.span>;
}