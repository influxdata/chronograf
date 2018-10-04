import {GIT_SHA} from 'src/shared/constants'

export function setLocalStorage(key: string, data: object): void {
  const localStorageData = {version: GIT_SHA, data}

  window.localStorage.setItem(key, JSON.stringify(localStorageData))
}

export function getLocalStorage(key: string): object | null {
  try {
    const {version, data} = JSON.parse(window.localStorage.getItem(key))

    if (version !== GIT_SHA) {
      return null
    }

    return data
  } catch {
    return null
  }
}
