import {useRedirectPath} from './Login'

// landing page is used after successful OAuth2 authentication
const LandingPage = ({router}) => {
  const redirectPage = useRedirectPath() || '/'
  return router.push(redirectPage)
}

export default LandingPage
