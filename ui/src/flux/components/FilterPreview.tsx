import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {getAST} from 'src/flux/apis'
import {Links, FilterNode} from 'src/types/flux'
import Walker from 'src/flux/ast/walker'
import FilterConditions from 'src/flux/components/FilterConditions'

interface Props {
  value: string
  links: Links
}

interface State {
  filterString: string
  nodes: FilterNode[]
}

export class FilterPreview extends PureComponent<Props, State> {
  public static getDerivedStateFromProps(nextProps, __) {
    return {
      filterString: nextProps.value,
      nodes: [],
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      filterString: '',
      nodes: [],
    }
  }

  public async componentDidMount() {
    this.convertStringToNodes()
  }

  // https://github.com/reactjs/rfcs/issues/26
  public async componentDidUpdate(__, prevState) {
    if (this.state.filterString !== prevState.filterString) {
      this.convertStringToNodes()
    }
  }

  public async convertStringToNodes() {
    const {links, value} = this.props

    const ast = await getAST({url: links.ast, body: value})
    const nodes = new Walker(ast).inOrderExpression
    this.setState({nodes})
  }

  public render() {
    return <FilterConditions nodes={this.state.nodes} />
  }
}

const mapStateToProps = ({links}) => {
  return {links: links.flux}
}

export default connect(mapStateToProps, null)(FilterPreview)
