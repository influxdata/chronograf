import {useEffect, useRef, useState} from 'react'

const DEFAULT_DELAY = 500
function useDebounce<T>(value: T, delay = DEFAULT_DELAY): T {
  const [debounced, setDebounced] = useState(value)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      setDebounced(value)
      first.current = false
      return
    }
    const handler = setTimeout(() => {
      setDebounced(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debounced
}

export default useDebounce
