import { AuthForm } from '@/app/components/auth/auth-form';
import { AuthHeader } from '@/app/components/auth/auth-header';
import { AuthFooter } from '@/app/components/auth/auth-footer';

export default function LoginPage() {
  return (
    <div className="w-full space-y-8">
      <AuthHeader />
      <AuthForm />
      <AuthFooter />
    </div>
  );
}
