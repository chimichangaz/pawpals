// src/pages/Login.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Failed to sign in. Please check your credentials.');
      }
      console.error('Login error:', error);
    }
    
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visual panel */}
        <section className="relative overflow-hidden rounded-xl bg-card shadow-lg border border-border min-h-[340px] lg:min-h-[520px]">
          <img
            src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1600&q=80"
            alt="Happy dogs playing together"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <p className="absolute left-4 bottom-4 text-xs sm:text-sm text-white/90 tracking-wide">
            Connect with Pet Lovers, Build Lasting Bonds
          </p>
        </section>

        {/* Form panel */}
        <section className="flex items-center">
          <div className="w-full max-w-sm ml-auto">
            <h1 className="text-3xl sm:text-4xl font-semibold">Welcome back</h1>

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md bg-secondary/50 text-foreground placeholder:text-muted-foreground/70 border border-border px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md bg-secondary/50 text-foreground placeholder:text-muted-foreground/70 border border-border px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-primary hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <button
                type="button"
                onClick={() => alert('Google sign-in coming soon!')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary/90 px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <GoogleIcon className="h-4 w-4" /> Sign in with Google
              </button>

              <button
                type="button"
                onClick={() => alert('Facebook sign-in coming soon!')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-muted px-4 py-2.5 text-sm font-medium text-foreground shadow hover:bg-muted/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <FacebookIcon className="h-4 w-4" /> Sign in with Facebook
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function GoogleIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 11.9999v3.84h5.41c-.24 1.38-.98 2.55-2.09 3.33l3.38 2.62c1.98-1.83 3.12-4.52 3.12-7.92 0-.76-.07-1.49-.2-2.18H12z" className="fill-white/90"/>
      <path d="M12 4.8c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.54 1.2 14.98 0 12 0 7.31 0 3.26 2.69 1.27 6.6l3.9 3.03C6.1 6.68 8.8 4.8 12 4.8z" className="fill-white/70"/>
      <path d="M1.27 6.6C.46 8.19 0 9.99 0 12c0 2 .46 3.8 1.27 5.4l3.9-3.03C4.83 13.31 4.6 12.68 4.6 12s.23-1.31.57-2.37z" className="fill-white/60"/>
      <path d="M12 24c2.98 0 5.54-1 7.38-2.86l-3.38-2.62c-.93.63-2.12 1-3.99 1-3.2 0-5.9-1.88-6.83-4.63l-3.9 3.03C3.26 21.31 7.31 24 12 24z" className="fill-white/50"/>
    </svg>
  );
}

function FacebookIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.6 9.87v-6.98H7.9V12h2.5V9.8c0-2.46 1.47-3.83 3.72-3.83 1.08 0 2.21.19 2.21.19v2.43h-1.25c-1.23 0-1.62.77-1.62 1.56V12h2.76l-.44 2.89h-2.32v6.98A10 10 0 0 0 22 12z" className="fill-foreground/80" />
    </svg>
  );
}