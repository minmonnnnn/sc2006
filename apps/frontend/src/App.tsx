import { useState } from 'react'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { ProfilePage } from './pages/ProfilePage'
import { FavouritesPage } from './pages/FavouritesPage'
import './App.css'

type Page = 'sign-in' | 'sign-up' | 'profile' | 'favourites'

function AppShell() {
  const { session, logout } = useAuth()
  const [page, setPage] = useState<Page>('sign-in')
  const [handoff, setHandoff] = useState('')
  const activePage: Page = session
    ? page === 'favourites' ? 'favourites' : 'profile'
    : page === 'sign-up' ? 'sign-up' : 'sign-in'

  function navigate(next: Page) {
    setHandoff('')
    setPage(next)
  }

  // Min can replace this local switch with the project router, preserving page props.
  // Favourites onSelect receives the complete destination, including coordinates.
  const content = (() => {
    switch (activePage) {
      case 'sign-in':
        return <SignInPage onSignedIn={() => navigate('profile')} onSwitchMode={() => navigate('sign-up')} />
      case 'sign-up':
        return <SignUpPage onSwitchMode={() => navigate('sign-in')} />
      case 'profile':
        return <ProfilePage onAccountDeleted={() => navigate('sign-in')} />
      case 'favourites':
        return <FavouritesPage
          onSelect={(favourite) => setHandoff(`Selected ${favourite.locationName} (${favourite.address}). Search integration is coming soon.`)}
          onSearch={() => setHandoff('Destination search is coming soon.')}
        />
    }
  })()

  return <div className="app-shell">
    {session && <nav className="app-navigation" aria-label="Account navigation">
      <button type="button" aria-current={activePage === 'profile' ? 'page' : undefined} onClick={() => navigate('profile')}>Profile</button>
      <button type="button" aria-current={activePage === 'favourites' ? 'page' : undefined} onClick={() => navigate('favourites')}>Favourites</button>
      <button type="button" onClick={() => { logout(); navigate('sign-in') }}>Log out</button>
    </nav>}
    {session && handoff && <p className="app-handoff" role="status">{handoff}</p>}
    {content}
  </div>
}

export default function App() {
  return <AuthProvider><AppShell /></AuthProvider>
}
