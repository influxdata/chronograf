import AJAX from 'src/utils/ajax'

export const writeLineProtocol = async (source, db, data) =>
  await AJAX({
    url: `${source.links.write}?db=${db}`,
    method: 'POST',
    data,
  })

export const uploadImage = async (source, db, imageBlob) => {
  let form = new FormData()
  form.append('file', new Blob([imageBlob]))

  return await AJAX({
    url: `${source.links.images}`,
    method: 'POST',
    data: form,
  })
}
