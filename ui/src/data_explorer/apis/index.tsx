import AJAX from 'utils/ajax'

export const writeLineProtocol = async (source, db, data) =>
  await AJAX({
    url: `${source.links.write}?db=${db}`,
    method: 'POST',
    data,
  })
