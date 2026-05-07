import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Landing() {
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    if (user) navigate('/home', { replace: true })
  }, [user, navigate])

  async function handleGoogleSignIn() {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch {
      setError('Sign-in failed. Please try again.')
      setSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center" style={{ paddingBottom: '15vh' }}>
        <div className="flex flex-col items-center text-center px-6" style={{ maxWidth: 520 }}>

          <h1 className="font-bold text-gray-900" style={{ fontSize: 48, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Sketch, diagram,{' '}
            <span className="text-violet-600">create.</span>
          </h1>

          <p className="mt-4 text-gray-500 text-lg leading-relaxed">
            A personal workspace for diagrams and ideas.
            <br />Organized, synced, always accessible.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="mt-14 flex items-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              padding: '11px 20px',
              borderRadius: 8,
              border: '1px solid #dadce0',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              fontSize: 15,
              fontWeight: 500,
              color: '#3c4043',
              letterSpacing: '0.01em',
              transition: 'box-shadow 0.15s, background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)')}
          >
            {signingIn ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" className="shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {signingIn ? 'Redirecting…' : 'Continue with Google'}
          </button>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        </div>
      </div>
    </div>
  )
}
