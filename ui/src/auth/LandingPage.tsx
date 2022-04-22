import {useEffect} from 'react'
import {useRedirectPath} from './Login'

// landing page is used after successful OAuth2 authentication
const LandingPage = ({router}) => {
  const redirectPage = useRedirectPath() || '/'
  useEffect(() => router.push(redirectPage), [])
  return null
}

export default LandingPage
