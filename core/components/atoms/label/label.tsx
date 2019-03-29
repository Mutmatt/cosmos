import * as React from 'react'
import styled from '@auth0/cosmos/styled'
import { StyledTextAllCaps } from '@auth0/cosmos/atoms/text'
import { colors, misc } from '@auth0/cosmos-tokens'
import Automation from '../../_helpers/automation-attribute'

export interface ILabelProps {
  /** HTML ID of the component */
  id?: string
  appearance?: 'default' | 'information' | 'success' | 'warning' | 'danger'
  children?: React.ReactNode
  onClick?: Function
}

const Label = (props: ILabelProps) => (
  <Label.Element {...Automation('label')} {...props}>
    {props.children}
  </Label.Element>
)

Label.Element = styled(StyledTextAllCaps)`
  font-size: 11px;
  color: ${props => colors.status[props.appearance]};
  padding: 2px 6px;
  border: 1px solid ${props => colors.status[props.appearance]};
  border-radius: ${misc.radius};
  line-height: 1.2;
`

const StyledLabel = Label.Element

Label.defaultProps = {
  appearance: 'default'
}

export default Label
export { StyledLabel }
