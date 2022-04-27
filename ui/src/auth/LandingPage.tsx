import {useEffect} from 'react'
import {useRedirectPath} from './Login'

// landing page is used after successful OAuth2 authentication
const LandingPage = ({router}) => {
  useEffect(() => router.push(useRedirectPath()), [])
  return null
}

export default LandingPage
