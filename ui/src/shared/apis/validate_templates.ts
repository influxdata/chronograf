import AJAX from 'src/utils/ajax'

export const validateTextTemplate = async (
  url: string,
  template: string
): Promise<string> => {
  const {data: validation} = await AJAX({
    url,
    method: 'POST',
    data: {
      template,
    },
  })

  return validation
}
