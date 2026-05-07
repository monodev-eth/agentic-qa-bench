import Head from 'next/head'
import { supabase } from '@/lib/initSupabase'
import LoginForm from '@/components/LoginForm'
import TodoList from '@/components/TodoList'
import type { Session } from '@/lib/mockClient'
import { useEffect, useState } from 'react'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session)
      setHydrated(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => setSession(session))

    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      <Head>
        <title>agentic-qa-bench</title>
        <meta name="description" content="Benchmark target for the agentic-qa skill" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="w-full h-full bg-200">
        {!hydrated ? null : !session ? (
          <div className="min-w-full min-h-screen flex items-center justify-center">
            <div className="w-full h-full flex justify-center items-center p-4">
              <div className="w-full h-full sm:h-auto sm:w-2/5 max-w-sm p-5 bg-white shadow flex flex-col text-base">
                <h1 className="font-sans text-4xl text-center pb-2 mb-3 border-b mx-4">
                  Login
                </h1>
                <LoginForm />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full flex flex-col justify-center items-center p-4"
            style={{ minWidth: 250, maxWidth: 600, margin: 'auto' }}
          >
            <TodoList session={session as any} />
            <button
              className="btn-black w-full mt-12"
              onClick={async () => {
                const { error } = await supabase.auth.signOut()
                if (error) console.log('Error logging out:', error.message)
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  )
}
