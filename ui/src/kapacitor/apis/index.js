import AJAX from 'src/utils/ajax'
export * from './rules'

export const createTask = async (kapacitor, {id, dbrps, tickscript, type}) => {
  try {
    return await AJAX({
      method: 'POST',
      url: kapacitor.links.rules,
      data: {
        id,
        type,
        dbrps,
        tickscript,
      },
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const updateTask = async (
  kapacitor,
  {id, dbrps, tickscript, type},
  ruleID
) => {
  try {
    return await AJAX({
      method: 'PUT',
      url: `${kapacitor.links.rules}/${ruleID}`,
      data: {
        id,
        type,
        dbrps,
        tickscript,
      },
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}
