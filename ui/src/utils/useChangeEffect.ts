import React, {useEffect, useRef} from 'react'

/**
 * Acts like React.useEffect, but it is not called for the first time, but only opon any change later.
 */
function useChangeEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    effect()
  }, deps)
}

export default useChangeEffect
