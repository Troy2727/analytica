import Image from "next/image";

/** Full-screen spinner with a status message. */
export default function Loading({ text }: { text: string }) {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center gap-3 bg-navy-900/10 p-4">
      <Image src="/spinner.svg" alt="" width={24} height={24} className="animate-spin" />
      <p className="text-lg text-neutral-400">{text}</p>
    </div>
  );
}
