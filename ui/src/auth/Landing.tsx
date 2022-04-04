import {useRedirectPath} from './Login'

// landing page is used after successful OAuth2 authentication
const Landing = ({router}) => {
  const redirectPage = useRedirectPath() || '/'
  return router.push(redirectPage)
}

export default Landing
