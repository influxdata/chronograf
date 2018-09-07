import AJAX from 'src/utils/ajax'
import {Protoboard} from 'src/types'

export const getSourceHealth = async (url: string) => {
  try {
    await AJAX({url})
  } catch (error) {
    console.error(`Unable to contact source ${url}`, error)
    throw error
  }
}

export const getProtoboards = async (): Promise<Protoboard[]> => {
  try {
    const {
      data: {protoboards},
    } = await AJAX({
      method: 'GET',
      resource: 'protoboards',
    })
    return protoboards
  } catch (error) {
    console.error(`Error fetching dashboard prototypes`, error)
    throw error
  }
}
