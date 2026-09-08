import Image from "next/image";

export function ShorepinMark({ className }: { className?: string }) {
  return (
    <Image
      src="/icon.png"
      alt=""
      width={32}
      height={32}
      className={className}
      unoptimized
    />
  );
}
