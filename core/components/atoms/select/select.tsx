import * as React from "react";
import ReactSelect, { components, defaultTheme } from "react-select";
import AsyncSelect from "react-select/lib/Async";

import Automation from "../../_helpers/automation-attribute";
import Form from "../../molecules/form";
import styled from "../../styled";
import { colors, misc, spacing } from "../../tokens";
import SimpleSelect from "../_simple-select";
import {
  ClearIndicator,
  DropdownIndicator,
  Group,
  GroupHeading,
  LoadingIndicator,
  Menu,
  MenuList,
  MultiValue,
  Option,
  optionRenderer,
  valueRenderer
} from "./components";
import { ISelectOptions } from "./interfaces";

const defaultGetOptionValue = (option) => option.value

const selectTheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    danger: colors.input.borderError,
    primary: colors.input.borderFocus
  },
  borderRadius: misc.radius,
  spacing: {
    menuGutter: 0,
    baseUnit: spacing.unit,
    controlHeight: misc.input.default.height
  }
}

const cosmosToReactSelect = {
  options: (cosmosOptions) =>
    cosmosOptions.map(({ items, groupName, disabled, label, text, ...otherProperties }) => ({
      isDisabled: disabled,
      label: groupName || label || text,
      options: items ? cosmosToReactSelect.options(items) : undefined,
      ...otherProperties
    })),
  value: (valueProp, options, getOptionValue = defaultGetOptionValue) => {
    if (valueProp === null || typeof valueProp === 'undefined') {
      return null
    }

    if (valueProp.constructor.name === 'Array') {
      return valueProp.map((item) => cosmosToReactSelect.value(item, options, getOptionValue))
    }

    const matchValue = (option) => getOptionValue(option) === valueProp

    let valueFound = null

    options.forEach((option) => {
      if (option.options && option.options.constructor.name === 'Array') {
        option.options.forEach((subOption) => {
          if (matchValue(subOption)) {
            valueFound = subOption
          }
        })
      }
    })

    if (valueFound !== null) {
      return valueFound
    }

    return options.find(matchValue)
  },
  styles: (props) => ({
    menuPortal: Menu.portalTheme,
    menu: Menu.theme,
    groupHeading: GroupHeading.theme,
    group: Group.theme,
    menuList: MenuList.theme,
    control: (provided, state) =>
      props.hasError
        ? {
            ...provided,
            borderColor: colors.input.borderError,
            boxShadow: `0 0 0 ${state.isFocused ? 1 : 0}px ${colors.input.borderError}`,
            '&:hover': {
              borderColor: colors.input.borderError
            },
            '&:focus': {
              borderColor: colors.input.borderError,
              boxShadow: `0 0 0 2px ${colors.input.borderError}`
            }
          }
        : provided
  })
}

const oneOrMore = (options, getOptionValue = defaultGetOptionValue) => {
  if (options === null) {
    return null
  }

  if (options.constructor.name === 'Array') {
    return options.map(getOptionValue)
  }
  return getOptionValue(options)
}

export interface ISelectProps {
  /** HTML name for the select */
  id?: string
  /** HTML name for the select */
  name?: string
  /** Options to render inside select */
  options?: ISelectOptions
  /** Value selected by default */
  value?: any
  /** Value selected by default */
  defaultValue?: any
  /** Pass hasError to show error state */
  hasError?: boolean
  /** onChange transparently passed to select */
  onChange?: Function
  /** String to show when the first empty choice is selected */
  placeholder?: string
  /** Determines if the select is asynchronous */
  async?: boolean
  /** Determines if the select should be disabled */
  disabled?: boolean
  /** Determines if the user can type to search for items */
  searchable?: boolean
  /** Determines if the user can select more than one item */
  multiple?: boolean
  /** Shows a spinner inside the select control */
  loading?: boolean
  /** Lets you define a custom component to render each option */
  customOptionRenderer?: Function
  /** Lets you define a custom component to render the selected value */
  customValueRenderer?: Function
  /** If you want an async select you can pass a function which can return a Promise here */
  loadOptions?: Function
  /** Lets you specify a different key from where the select should take the value from a selected option */
  getOptionValue?: (option: any) => any
  /** Used to specify a message for when there's no options */
  noOptionsMessage?: Function | string
  /** Used to provide default options for the select (as object) or tell the select to search with '' (as boolean) */
  defaultOptions?: Object[] | boolean
  /** Used to provide custom styled to the Select wrapper */
  style?: Object
  /** Used to focus the control when it mounts */
  autoFocus?: boolean
  /** If cacheOptions is truthy, then the loaded data will be cached. The cache will remain until cacheOptions changes value. */
  cacheOptions?: boolean
  /** @internal */
  defaultMenuOpen?: boolean
  inputValue?: string
}

interface ISelectState {
  menuIsOpen: boolean
}

class Select extends React.Component<ISelectProps, ISelectState> {
  public static Wrapper = styled.div``

  public static defaultProps = {
    options: [],
    placeholder: '',
    searchable: false
  }

  public componentOverrides = {
    SingleValue: components.SingleValue,
    MultiValue,
    DropdownIndicator,
    LoadingIndicator,
    ClearIndicator,
    GroupHeading,
    Menu,
    MenuList,
    Option,
    Group,
    IndicatorSeparator: () => null
  }

  constructor(props) {
    super(props)
    this.state = { menuIsOpen: props.defaultMenuOpen || false }
    this.handleScroll = this.handleScroll.bind(this)
  }

  public componentDidMount() {
    document.addEventListener('scroll', this.handleScroll, true)

    if (this.props.defaultMenuOpen) {
      // If `defaultMenuOpen` is passed (only for testing)
      // force react-select to render portal for dropdown
      this.forceUpdate()
    }
  }

  public componentWillUnmount() {
    document.removeEventListener('scroll', this.handleScroll, true)
  }

  public handleScroll() {
    if (this.state.menuIsOpen) {
      // Force update for react-select to
      // re-compute portal dropdown position
      this.forceUpdate()
    }
  }

  public updateMenuState(newState) {
    return () => this.setState({ menuIsOpen: newState })
  }

  public render() {
    const props = this.props

    if (
      !(
        props.async ||
        props.searchable ||
        props.multiple ||
        props.customOptionRenderer ||
        props.customValueRenderer ||
        props.getOptionValue
      )
    ) {
      return <SimpleSelect {...props} />
    }

    /*
      select boxes do not support readonly like input boxes,
      but they do have disabled. we need the style of readOnly input
      and functionality of select disabled
    */

    const options = cosmosToReactSelect.options(props.options)
    const defaultOptions = props.defaultOptions
      ? cosmosToReactSelect.options(props.defaultOptions)
      : null

    if (props.customOptionRenderer) {
      this.componentOverrides.Option = optionRenderer(props.customOptionRenderer)
    }

    if (props.customValueRenderer) {
      this.componentOverrides.SingleValue = valueRenderer(props.customValueRenderer)
    }

    /**
     * If the Select is async we need to get the complete object value from the user,
     * while if it's a sync select, we can just get the value and match it from the options.
     */
    const value = props.async
      ? props.value
      : cosmosToReactSelect.value(props.value, options, props.getOptionValue)
    const styles = cosmosToReactSelect.styles(props)
    const searchable = props.async || props.searchable

    // React Select requires `noOptionsMessage` to be a function
    const noOptionsMessage = props.noOptionsMessage
      ? typeof props.noOptionsMessage === 'function'
        ? props.noOptionsMessage
        : () => props.noOptionsMessage
      : () => 'No options'

    const SelectProvider = props.async ? AsyncSelect : ReactSelect

    const onChange = (options) => {
      const newValue = props.async ? options : oneOrMore(options, props.getOptionValue)
      if (props.onChange) {
        props.onChange({ target: { name: props.name, value: newValue } })
      }
    }

    return (
      <Select.Wrapper {...Automation('select.wrapper')} style={props.style}>
        <Form.Field.ContextConsumer>
          {(context) => (
            <SelectProvider
              onChange={onChange}
              isClearable={true}
              isDisabled={props.disabled}
              isMulti={props.multiple}
              isSearchable={searchable}
              isLoading={props.loading}
              onMenuOpen={this.updateMenuState(true)}
              onMenuClose={this.updateMenuState(false)}
              menuPortalTarget={document.body}
              menuIsOpen={props.defaultMenuOpen}
              defaultValue={props.defaultValue}
              getOptionValue={props.getOptionValue}
              placeholder={props.placeholder}
              options={options}
              loadOptions={props.loadOptions}
              components={this.componentOverrides}
              noOptionsMessage={noOptionsMessage}
              defaultOptions={defaultOptions}
              theme={selectTheme}
              autoFocus={props.autoFocus}
              name={props.name}
              value={value}
              styles={styles}
              key={value ? value.length : 0}
              id={props.id || context.formFieldId}
            />
          )}
        </Form.Field.ContextConsumer>
      </Select.Wrapper>
    )
  }
}

export default Select
