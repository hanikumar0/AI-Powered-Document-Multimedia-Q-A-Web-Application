'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth, isLoading, setLoading } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      setAuth(response.user, response.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500" />

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Sign in to continue your AI journey</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                {...register('email')}
                className={`w-full bg-[#111827] border ${errors.email ? 'border-red-500' : 'border-[#1F2937]'} rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner`}
                placeholder="name@example.com"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
              <Link href="/forgot-password" className="text-xs text-purple-500 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`w-full bg-[#111827] border ${errors.password ? 'border-red-500' : 'border-[#1F2937]'} rounded-xl pl-12 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner`}
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-[#1F2937]">
          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-purple-500 hover:text-purple-400 font-semibold transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
