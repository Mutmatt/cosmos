import * as React from 'react'
import styled, { css } from '../../styled'
import { fonts, colors, spacing } from '../../tokens'
import Link, { StyledLink } from '../link'
import Text from '../text'
import Button from '../button'
import FreeText from '../../_helpers/free-text'
import Automation from '../../_helpers/automation-attribute'
import Icon, { __ICONNAMES__ } from '../icon'
import containerStyles from '../../_helpers/container-styles'
import { rootProps } from '../../_helpers/root-props'

export type IAlertElementProps = Partial<IAlertProps>
export type IAlertAppearance = 'default' | 'information' | 'success' | 'warning' | 'danger'

export interface IAlertProps {
  /** HTML ID of the component */
  id?: string
  type?: IAlertAppearance // deprecated: use appearance
  appearance?: IAlertAppearance
  icon?: string
  title?: string | React.ReactNode
  /** @deprecated:children  */
  text?: string
  /** @deprecated:children  */
  link?: string
  dismissible?: boolean
  onDismiss?: () => void
  dismissAfterSeconds?: number
}

export interface IAlertState {
  visible: boolean
}

const ReadMoreLink = styled(Link)`
  color: ${props => colors.alert[props.appearance].text};
  text-decoration: underline;
  &:hover {
    text-decoration: none;
  }
  margin-left: ${spacing.xxsmall};
`

class Alert extends React.Component<IAlertProps, IAlertState> {
  static defaultProps = {
    type: 'default',
    dismissible: true
    /*
    default appearance is commented out on purpose,
    so that it doesn't break old API.
    TODO: Make this work when type is removed.
  */
    // appearance: 'default',
  }

  static Element: any
  timer: any

  constructor(props) {
    super(props)
    this.state = { visible: true }
  }

  componentDidMount() {
    if (this.props.dismissAfterSeconds) {
      /* timer to auto dismiss the component */
      this.timer = window.setTimeout(this.dismiss, this.props.dismissAfterSeconds * 1000)
    }
  }

  componentWillUnmount() {
    /*
      clear timer on unmount
      we need to do this in case the user dismisses
      the alert before the timer gets to it
      otherwise we would try to setState on an unmounted
      component
    */
    if (this.timer) window.clearTimeout(this.timer)
  }

  dismiss = () => {
    this.setState({ visible: false })
    if (typeof this.props.onDismiss === 'function') this.props.onDismiss()
  }

  render() {
    /* new: appearance, old: type*/
    const appearance = this.props.appearance || this.props.type

    if (this.state.visible) {
      return (
        <Alert.Element
          appearance={appearance}
          dismissible={this.props.dismissible}
          {...Automation('alert')}
          {...rootProps(this.props)}
          role="alert"
        >
          {this.props.icon && (
            <AlertIcon>
              <Icon name={this.props.icon} color={iconColorMap[appearance]} />
            </AlertIcon>
          )}

          <AlertContent>
            <Text type="strong">{this.props.title}</Text> <FreeText {...this.props} />
            {this.props.link && (
              <ReadMoreLink appearance="default" href={this.props.link} target="_blank">
                Read more
              </ReadMoreLink>
            )}
          </AlertContent>

          {this.props.dismissible && (
            <Button
              aria-label="Close"
              size="default"
              appearance="link"
              icon="close"
              onClick={this.dismiss}
              {...Automation('alert.dismiss')}
            />
          )}
        </Alert.Element>
      )
    } else return null
  }
}

Alert.Element = styled.div<IAlertElementProps>`
  ${containerStyles};

  padding: ${spacing.small} ${props => (props.dismissible === true ? '40px' : 'spacing.small')}
    ${spacing.small} ${spacing.small};
  background-color: ${props => colors.alert[props.appearance].background};
  color: ${props => colors.alert[props.appearance].text};
  border-radius: 3px;
  position: relative;
  display: flex;

  ${Icon.Element} {
    display: block;
    position: relative;
    top: 1px;
    path {
      fill: ${props => colors.alert[props.appearance].text};
    }
  }

  ${StyledLink} {
    color: ${props => colors.alert[props.appearance].text};
    text-decoration: underline;
    &:hover {
      text-decoration: none;
    }
  }
  ${Button.Element} {
    position: absolute;
    right: 0;
    top: 2px;
    opacity: 0.5;
    padding: ${spacing.small} ${spacing.small};
    &:hover,
    &:focus {
      opacity: 1;
    }
  }
`

const AlertIcon = styled.div`
  margin-right: 12px;
`

const AlertContent = styled.div``

/*
  Icon only accepts colors from colors.base
  This is a map between alert types and base colors
*/
const iconColorMap = {
  default: 'default',
  information: 'blueDarker',
  success: 'greenDarker',
  warning: 'yellow',
  danger: 'redDarker'
}

export default Alert
