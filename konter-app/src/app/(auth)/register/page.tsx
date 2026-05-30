import { signup } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function RegisterPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-zinc-950">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-bl from-indigo-500/20 to-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-tr from-blue-500/20 to-teal-500/20 blur-[100px] rounded-full pointer-events-none"></div>

      <Card className="w-full max-w-sm glass-card border-white/20 relative z-10 shadow-2xl">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight text-gradient">Create Account</CardTitle>
          <CardDescription>Join our platform to start transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="register-form" action={signup} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            {searchParams?.error && (
              <p className="text-sm text-red-500 font-medium">
                {searchParams.error}
              </p>
            )}
            <Button type="submit" className="w-full font-bold shadow-md hover:shadow-lg transition-all rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 py-6 mt-4">
              Sign Up
            </Button>
          </form>
        </CardContent>
        <div className="p-6 pt-0 text-center text-sm text-muted-foreground border-t border-border/50 bg-white/30 dark:bg-black/10 mt-6 rounded-b-xl">
          Already have an account?{' '}
          <Link href="/login" className="underline underline-offset-4 hover:text-primary font-medium transition-colors">
            Log in
          </Link>
        </div>
      </Card>
    </div>
  )
}
