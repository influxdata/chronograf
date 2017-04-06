import {connect} from 'redux'


const Authenticator = ({
  sources,
  children,
}) => authenticated || noAuth ? (
  {children}
) : (
  <Route path="/" component={CreateSource} />
)

const mapStateToProps = ({sources}) => ({
  sources,
})

const mapDispatchToProps = (dispatch) => ({
  getSources: bindActionCreators(getSources, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Authenticator)
