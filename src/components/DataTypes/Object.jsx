import React from 'react'

import { toType } from '../../helpers/util'
// icons
import { CollapsedIcon, ExpandedIcon } from '../ToggleIcons'
// attribute store
import AttributeStore from './../../stores/ObjectAttributes'
// theme
import Theme from './../../themes/getStyle'
import ArrayGroup from './../ArrayGroup'
import ObjectName from './../ObjectName'
import VariableEditor from './../VariableEditor'
import VariableMeta from './../VariableMeta'
// data type components
import { JsonObject } from './DataTypes'

const createJsonVariable = (name, value) => ({
  name,
  value,
  type: toType(value)
})

// increment 1 with each nested object & array
const DEPTH_INCREMENT = 1
// single indent is 5px
const SINGLE_INDENT = 5

class RjvObject extends React.PureComponent {
  constructor (props) {
    super(props)
    const state = RjvObject.getState(props)
    this.state = {
      ...state,
      prevProps: {}
    }
  }

  static getState = props => {
    const size = Object.keys(props.src).length
    const expanded =
            (props.collapsed === false ||
                (props.collapsed !== true && props.collapsed > props.depth)) &&
            (!props.shouldCollapse ||
                props.shouldCollapse({
                  name: props.name,
                  src: props.src,
                  type: toType(props.src),
                  namespace: props.namespace
                }) === false) &&
            // initialize closed if object has no items
            size !== 0
    const state = {
      expanded: AttributeStore.get(
        props.rjvId,
        props.namespace,
        'expanded',
        expanded
      ),
      object_type: props.type === 'array' ? 'array' : 'object',
      parent_type: props.type === 'array' ? 'array' : 'object',
      size,
      hovered: false
    }
    return state
  }

  static getDerivedStateFromProps (nextProps, prevState) {
    const { prevProps } = prevState
    if (
      nextProps.src !== prevProps.src ||
            nextProps.collapsed !== prevProps.collapsed ||
            nextProps.name !== prevProps.name ||
            nextProps.namespace !== prevProps.namespace ||
            nextProps.rjvId !== prevProps.rjvId
    ) {
      const newState = RjvObject.getState(nextProps)
      return {
        ...newState,
        prevProps: nextProps
      }
    }
    return null
  }

  toggleCollapsed = () => {
    this.setState(
      {
        expanded: !this.state.expanded
      },
      () => {
        AttributeStore.set(
          this.props.rjvId,
          this.props.namespace,
          'expanded',
          this.state.expanded
        )
      }
    )
  }

  getObjectContent = (depth, src, props) => {
    return (
            <div className='pushed-content object-container'>
                <div
                    className='object-content'
                    {...Theme(this.props.theme, 'pushed-content')}
                >
                    {this.renderObjectContents(src, props)}
                </div>
            </div>
    )
  }

  getEllipsis = () => {
    const { size } = this.state

    if (size === 0) {
      // don't render an ellipsis when an object has no items
      return null
    } else {
      return (
                <div
                    {...Theme(this.props.theme, 'ellipsis')}
                    className='node-ellipsis'
                    onClick={this.toggleCollapsed}
                >
                    ...
                </div>
      )
    }
  }

  getObjectMetaData = () => {
    const { size, hovered } = this.state
    return (
            <VariableMeta rowHovered={hovered} size={size} {...this.props} />
    )
  }

  getBraceStart (object_type, expanded) {
    const { src, theme, iconStyle, parent_type } = this.props

    if (parent_type === 'array_group') {
      return (
                <span>
                    <span {...Theme(theme, 'brace')}>
                        {object_type === 'array' ? '[' : '{'}
                    </span>
                    {expanded ? this.getObjectMetaData() : null}
                </span>
      )
    }

    const IconComponent = expanded ? ExpandedIcon : CollapsedIcon

    return (
            <span>
                <span
                    onClick={e => {
                      this.toggleCollapsed()
                    }}
                    {...Theme(theme, 'brace-row')}
                >
                    <div
                        className='icon-container'
                        {...Theme(theme, 'icon-container')}
                    >
                        <IconComponent {...{ theme, iconStyle }} />
                    </div>
                    <ObjectName {...this.props} />
                    <span {...Theme(theme, 'brace')}>
                        {object_type === 'array' ? '[' : '{'}
                    </span>
                </span>
                {expanded ? this.getObjectMetaData() : null}
            </span>
    )
  }

  render () {
    // `indentWidth` and `collapsed` props will
    // perpetuate to children via `...rest`
    const {
      depth,
      src,
      namespace,
      name,
      type,
      parent_type,
      theme,
      jsvRoot,
      iconStyle,
      ...rest
    } = this.props

    const { object_type, expanded } = this.state

    const styles = {}
    if (!jsvRoot && parent_type !== 'array_group') {
      styles.paddingLeft = this.props.indentWidth * SINGLE_INDENT
    } else if (parent_type === 'array_group') {
      styles.borderLeft = 0
      styles.display = 'inline'
    }

    return (
            <div
                className='object-key-val'
                onMouseEnter={() =>
                  this.setState({ ...this.state, hovered: true })
                }
                onMouseLeave={() =>
                  this.setState({ ...this.state, hovered: false })
                }
                {...Theme(theme, jsvRoot ? 'jsv-root' : 'objectKeyVal', styles)}
            >
                {this.getBraceStart(object_type, expanded)}
                {expanded
                  ? this.getObjectContent(depth, src, {
                    theme,
                    iconStyle,
                    ...rest
                  })
                  : this.getEllipsis()}
                <span className='brace-row'>
                    <span
                        style={{
                          ...Theme(theme, 'brace').style,
                          paddingLeft: expanded ? '3px' : '0px'
                        }}
                    >
                        {object_type === 'array' ? ']' : '}'}
                    </span>
                    {expanded ? null : this.getObjectMetaData()}
                </span>
            </div>
    )
  }

  renderObjectContents = (variables, props) => {
    const {
      depth,
      parent_type,
      index_offset,
      groupArraysAfterLength,
      namespace
    } = this.props
    const { object_type } = this.state
    const elements = []
    let variable
    let keys = Object.keys(variables || {})
    if (this.props.sortKeys && object_type !== 'array') {
      keys = keys.sort()
    }

    keys.forEach(name => {
      variable = createJsonVariable(name, variables[name])

      if (parent_type === 'array_group' && index_offset) {
        variable.name = parseInt(variable.name) + index_offset
      }
      if (!Object.prototype.hasOwnProperty.call(variables, name)) {
        // do nothing
      } else if (variable.type === 'object') {
        elements.push(
                    <JsonObject
                        key={variable.name}
                        depth={depth + DEPTH_INCREMENT}
                        name={variable.name}
                        src={variable.value}
                        namespace={namespace.concat(variable.name)}
                        parent_type={object_type}
                        {...props}
                    />
        )
      } else if (variable.type === 'array') {
        let ObjectComponent = JsonObject

        if (
          groupArraysAfterLength &&
                    variable.value.length > groupArraysAfterLength
        ) {
          ObjectComponent = ArrayGroup
        }

        elements.push(
                    <ObjectComponent
                        key={variable.name}
                        depth={depth + DEPTH_INCREMENT}
                        name={variable.name}
                        src={variable.value}
                        namespace={namespace.concat(variable.name)}
                        type='array'
                        parent_type={object_type}
                        {...props}
                    />
        )
      } else {
        elements.push(
                    <VariableEditor
                        key={variable.name + '_' + namespace}
                        variable={variable}
                        singleIndent={SINGLE_INDENT}
                        namespace={namespace}
                        type={this.props.type}
                        {...props}
                    />
        )
      }
    })
    return elements
  }
}

// export component
export default RjvObject
