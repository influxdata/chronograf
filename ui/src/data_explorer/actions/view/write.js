import {
  writeLineProtocol as writeLineProtocolAJAX,
  uploadImage as uploadImageAJAX,
} from 'src/data_explorer/apis'

import {errorThrown} from 'shared/actions/errors'
import {publishAutoDismissingNotification} from 'shared/dispatchers'

export const writeLineProtocolAsync = (source, db, data) => async dispatch => {
  try {
    await writeLineProtocolAJAX(source, db, data)
    dispatch(
      publishAutoDismissingNotification(
        'success',
        'Data was written successfully'
      )
    )
  } catch (response) {
    const errorMessage = `Write failed: ${response.data.error}`
    dispatch(errorThrown(response, errorMessage))
    throw response
  }
}

export const uploadImageAsync = (source, db, imageBlob) => async dispatch => {
  try {
    await uploadImageAJAX(source, db, imageBlob)
    dispatch(
      publishAutoDismissingNotification(
        'success',
        'Image was uploaded successfully'
      )
    )
  } catch (response) {
    const errorMessage = `Upload failed: ${response.data.error}`
    dispatch(errorThrown(response, errorMessage))
    throw response
  }
}
