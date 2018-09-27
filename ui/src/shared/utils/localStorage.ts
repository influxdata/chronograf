import {GIT_SHA} from 'src/shared/constants'

export function setLocalStorage(key: string, data: any): void {
  const localStorageData = {version: GIT_SHA, data}

  window.localStorage.setItem(key, JSON.stringify(localStorageData))
}

export function getLocalStorage(key: string): any {
  try {
    const {version, data} = JSON.parse(window.localStorage.getItem(key))

    if (version !== GIT_SHA) {
      return {}
    }

    return data
  } catch {
    return {}
  }
}
