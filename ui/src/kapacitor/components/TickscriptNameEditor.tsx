// Libraries
import React, {
  KeyboardEvent,
  MutableRefObject,
  FocusEvent,
  useRef,
  useState,
} from 'react'

interface Props {
  onRename: (name: string) => void
  name: string
}

const TickscriptNameEditor = (props: Props) => {
  const [isEditing, setEditing] = useState(false)
  const inputRef: MutableRefObject<HTMLInputElement> = useRef(null)

  const {name} = props

  if (isEditing) {
    const handleInputBlur = (e: FocusEvent<HTMLInputElement>): void => {
      const {onRename} = props
      const newName = e.target.value
      if (newName !== name) {
        onRename(newName)
      }
      setEditing(false)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        inputRef.current.blur()
      }
      if (e.key === 'Escape') {
        inputRef.current.value = name
        inputRef.current.blur()
      }
    }

    const handleFocus = (e: FocusEvent<HTMLInputElement>): void =>
      e.target.select()

    return (
      <div className="rename-dashboard">
        <input
          type="text"
          className="rename-dashboard--input form-control input-sm"
          defaultValue={name}
          autoComplete="off"
          autoFocus={true}
          spellCheck={false}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder="Name this TICKscript"
          ref={inputRef}
        />
      </div>
    )
  }

  return (
    <h1 className="tickscript-controls--name" onClick={() => setEditing(true)}>
      {name}
      <span className="icon pencil" />
    </h1>
  )
}
export default TickscriptNameEditor
