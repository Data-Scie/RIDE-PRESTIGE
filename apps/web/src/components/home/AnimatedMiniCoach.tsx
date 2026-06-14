import Image from 'next/image';

export default function AnimatedMiniCoach() {
  return (
    <div className="fleet-motion-scene" aria-hidden="true">
      <div className="fleet-motion-road">
        <span /><span /><span />
      </div>

      <div className="fleet-motion-vehicle fleet-motion-minibus">
        <Image
          src="/images/fleet-motion/minibus.png"
          alt=""
          width={1536}
          height={1024}
          priority
        />
      </div>

      <div className="fleet-motion-vehicle fleet-motion-coach">
        <Image
          src="/images/fleet-motion/coach.png"
          alt=""
          width={1536}
          height={1024}
          priority
        />
      </div>
    </div>
  );
}
