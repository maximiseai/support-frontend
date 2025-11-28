"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { OTPInput } from "@/app/components/auth/otp-input";

export function AuthForm() {
  const router = useRouter();
  const [step, setStep] = useState<string>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/auth/otp', {
        email: email.trim(),
      });

      setSuccess(response.data.message || 'Code sent! Check your email.');
      setStep("code");
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await axios.post('/api/auth/login', {
        email: email.trim(),
        otp: code.trim(),
      });

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep("email");
    setCode("");
    setError(null);
    setSuccess(null);
  };

  if (step === "code") {
    return (
      <form onSubmit={handleCodeSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="p-3 text-sm bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span>{email}</span>
            <button
              type="button"
              onClick={handleBack}
              className="text-neutral-950 hover:underline underline-offset-4"
            >
              Change
            </button>
          </div>
          <OTPInput
            value={code}
            onChange={setCode}
            length={6}
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full h-12 text-base font-medium bg-neutral-950 hover:bg-neutral-800 text-white"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Verifying...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 text-sm bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-1">
        <Input
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 px-4 text-base bg-white border-neutral-200 focus:border-neutral-950 focus:ring-neutral-950 focus:ring-1"
          required
          autoComplete="email"
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 text-base font-medium bg-neutral-950 hover:bg-neutral-800 text-white"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Sending code...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>Continue</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        )}
      </Button>
    </form>
  );
}
