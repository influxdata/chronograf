interface Named {
  name: string
}
type NamedChanges = Record<string, boolean>

/**
 * ComputeNamedChanges computes differences between arrays of named instances
 * as a Record with instance name as a key and values indicating addition (true)
 * or removal (false) of the instance. Undefined is returned if there are no
 * changes detected, instances that were not added/removed ar enot returned.
 */
export function computeNamedChanges<T extends Named>(
  prev: T[],
  next: T[]
): NamedChanges | undefined {
  const retVal = {}
  // indicate all prev values as removed
  prev.forEach(({name}) => (retVal[name] = false))
  // indicate all new values as added, existing as undefined
  next.forEach(
    ({name}) => (retVal[name] = retVal[name] === false ? undefined : true)
  )
  // filter all undefined values
  let changed = false
  const onlyChanges = Object.entries(retVal).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      changed = true
      acc[key] = value
    }
    return acc
  }, {})
  return changed ? onlyChanges : undefined
}

/**
 * ChangeNamedCollection inserts/removes the supplied
 * element to the supplied named collection according to the
 * changeType. True changeType inserts an element in a sorted way,
 * false removes all elements of the same name, undefined does nothing
 * and returns the supplied collection. The supplied values never
 * change after calling this fn.
 */
export function changeNamedCollection<T extends Named>(
  values: T[],
  element: T,
  changeType: boolean | undefined
): T[] {
  if (changeType === undefined) {
    // no changes requested, do nothing
    return values
  }
  if (changeType) {
    // insert to the existing collection
    let i = 0
    for (; i < values.length; i++) {
      if (values[i].name.localeCompare(element.name) >= 0) {
        break
      }
    }
    const retVal = [...values]
    retVal.splice(i, 0, element)
    return retVal
  }
  // remove from existing collection
  return values.filter(({name}) => name !== element.name)
}
