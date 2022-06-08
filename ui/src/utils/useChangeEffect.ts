import React, {useEffect, useRef} from 'react'

/**
 * Acts like React.useEffect, but it does not call the effect
 * for the first time, but only opon any change after initialization.
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
    return effect()
  }, deps)
}

export default useChangeEffect
