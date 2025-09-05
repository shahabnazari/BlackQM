import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | VQMethod Auth',
    default: 'Authentication | VQMethod',
  },
  description:
    'Sign in or create an account for VQMethod Q-methodology research platform',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
