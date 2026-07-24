import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger once — import from here in all components.
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
