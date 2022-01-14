import React from 'react'

interface Props {
  text: string
  className?: string
}

const WaitingText = ({text, className}: Props) => {
  return <div className={`waiting-text ${className || ''}`}>{text}</div>
}

export default WaitingText
