import React, {PureComponent, ReactNode} from 'react'
import {connect} from 'react-redux'
import {getAST} from 'src/flux/apis'
import {Links, BinaryExpressionNode, MemberExpressionNode} from 'src/types/flux'
import Walker from 'src/flux/ast/walker'
import FilterPreview from 'src/flux/components/FilterPreview'

interface Props {
  value: string
  links: Links
  render: (nodes: FilterNode[]) => ReactNode
}

type FilterNode = BinaryExpressionNode | MemberExpressionNode

interface State {
  filterString: string
  nodes: FilterNode[]
}

export class Filter extends PureComponent<Props, State> {
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
    return <FilterPreview nodes={this.state.nodes} />
  }
}

const mapStateToProps = ({links}) => {
  return {links: links.flux}
}

export default connect(mapStateToProps, null)(Filter)
