import Image from "next/image";

type Props = {
  size?: number;
  className?: string;
};

export function EthosLogo({ size = 64, className }: Props) {
  return (
    <Image
      src="/logo.png"
      alt="ETHOS 행정사사무소 로고"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

export function EthosWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <h1 className="font-serif text-4xl font-bold tracking-[0.25em] text-primary sm:text-5xl">
        ETHOS
      </h1>
      <p className="mt-1 font-serif text-sm font-semibold tracking-wide text-text-strong sm:text-base">
        Administrative Attorney Office
      </p>
      <p className="mt-2 font-serif text-xs italic text-gold-deep sm:text-sm">
        Reason in Process · Empathy for People · Trust in Every Step
      </p>
    </div>
  );
}
