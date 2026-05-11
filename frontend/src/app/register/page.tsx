'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const { setAuth, isLoading, setLoading } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password
      });
      setAuth(response.user, response.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500" />
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
          <p className="text-gray-400 text-sm">Join the next generation of document intelligence</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                {...register('name')}
                className={`w-full bg-[#111827] border ${errors.name ? 'border-red-500' : 'border-[#1F2937]'} rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
                placeholder="Full Name"
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                {...register('email')}
                className={`w-full bg-[#111827] border ${errors.email ? 'border-red-500' : 'border-[#1F2937]'} rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
                placeholder="Email Address"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                {...register('password')}
                className={`w-full bg-[#111827] border ${errors.password ? 'border-red-500' : 'border-[#1F2937]'} rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
                placeholder="Password (min 8 chars)"
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                {...register('confirmPassword')}
                className={`w-full bg-[#111827] border ${errors.confirmPassword ? 'border-red-500' : 'border-[#1F2937]'} rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
                placeholder="Confirm Password"
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 ml-1">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-4 mt-6 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-500 hover:text-purple-400 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
