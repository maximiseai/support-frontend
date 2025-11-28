import Image from 'next/image';

export function AuthHeader() {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Image
          src="/logo.svg"
          alt="Enrich"
          width={120}
          height={40}
          priority
        />
      </div>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-medium tracking-tight text-neutral-950">
          Support Dashboard
        </h1>
        <p className="text-sm text-neutral-600">
          Enter your email to receive a one-time login code
        </p>
      </div>
    </div>
  );
}
