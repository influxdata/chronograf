import * as React from 'react'
import * as PropTypes from 'prop-types'
import {withRouter, Link} from 'react-router-dom'
import {Location} from 'history'
import * as classnames from 'classnames'

export const NavListItem: React.SFC<{
  link: string
  useAnchor?: boolean
  isExternal?: boolean
  location: Location
}> = ({link, children, location, useAnchor, isExternal}) => {
  const isActive = location.pathname.startsWith(link)

  return useAnchor ? (
    <a
      className={classnames('sidebar-menu--item', {active: isActive})}
      href={link}
      target={isExternal ? '_blank' : '_self'}
    >
      {children}
    </a>
  ) : (
    <Link
      className={classnames('sidebar-menu--item', {active: isActive})}
      to={link}
    >
      {children}
    </Link>
  )
}

// Some nav items, such as Logout, need to hit an external link rather
// than simply route to an internal page. Anchor tags serve that purpose.
export const NavHeader: React.SFC<{
  link: string
  title: string
  useAnchor?: boolean
}> = ({link, title, useAnchor}) =>
  useAnchor ? (
    <a className="sidebar-menu--heading" href={link}>
      {title}
    </a>
  ) : (
    <Link className="sidebar-menu--heading" to={link}>
      {title}
    </Link>
  )

export const NavBlock: React.SFC<{
  link?: string
  icon: string
  className?: string
  location: Location
}> = ({location, className, link, icon, children}) => {
  const isActive = React.Children.toArray(children).find(child => {
    return location.pathname.startsWith(child.props.link)
  })

  const locationChildren = React.Children.map(children, child => {
    if (child && child.type === NavListItem) {
      return React.cloneElement(child, {location})
    }

    return child
  })

  return (
    <div className={classnames('sidebar--item', className, {active: isActive})}>
      {link ? (
        <div className="sidebar--square">
          <div className={`sidebar--icon icon ${icon}`} />
        </div>
      ) : (
        <Link className="sidebar--square" to={link}>
          <div className={`sidebar--icon icon ${icon}`} />
        </Link>
      )}
      <div className="sidebar-menu">
        {locationChildren}
        <div className="sidebar-menu--triangle" />
      </div>
    </div>
  )
}

export const NavBar: React.SFC<{location: Location}> = ({
  location,
  children,
}) => {
  const locationChildren = React.Children.map(children, child => {
    if (child && child.type === NavBlock) {
      return React.cloneElement(child, {
        location,
      })
    }

    return child
  })
  return <nav className="sidebar">{locationChildren}</nav>
}
