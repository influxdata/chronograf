import {Source, Kapacitor} from 'src/types'

const ActiveKapacitorFromSources = (
  source: Source,
  sources: Source[]
): Kapacitor => {
  if (!source || !sources) {
    return null
  }

  const ActiveSource = sources.find(s => s.id === source.id)
  if (!ActiveSource || !ActiveSource.kapacitors) {
    return null
  }

  return ActiveSource.kapacitors.find(k => k.active)
}

export default ActiveKapacitorFromSources
