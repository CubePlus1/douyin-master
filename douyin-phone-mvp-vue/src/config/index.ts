export default {
  baseUrl: 'https://dy.ttentau.top/imgs/',
  imgPath: '/imgs/',
  filePreview: 'http://192.168.0.103/static/uploads/'
}

const currentBaseUrl =
  import.meta.env.BASE_URL === './'
    ? window.location.pathname.replace(/\/$/, '')
    : (import.meta.env.BASE_URL || '').replace(/\/$/, '')

const BASE_URL_MAP = {
  DEV: '',
  PROD: '',
  // GP_PAGES: '/dist',
  GP_PAGES: currentBaseUrl,
  GITEE_PAGES: '/douyin',
  UNI: 'https://dy.ttentau.top'
}

export const IS_SUB_DOMAIN = ['GITEE_PAGES', 'GP_PAGES'].includes(import.meta.env.VITE_ENV)
export const IS_GITEE_PAGES = ['GITEE_PAGES'].includes(import.meta.env.VITE_ENV)
export const BASE_URL = BASE_URL_MAP[import.meta.env.VITE_ENV] || ''
export const IMG_URL = BASE_URL + '/images/'
export const FILE_URL = BASE_URL + '/data/'
export const IS_DEV = process.env.NODE_ENV !== 'production'

export function getChovyUrl(path = '') {
  const normalizedPath = path.replace(/^\/+/, '')
  const configuredUrl = import.meta.env.VITE_CHOVY_ENTRY_URL

  if (configuredUrl) {
    return new URL(normalizedPath, configuredUrl.endsWith('/') ? configuredUrl : `${configuredUrl}/`).href
  }

  if (IS_DEV) {
    return new URL(normalizedPath, 'http://localhost:5000/').href
  }

  const basePath = `${BASE_URL || currentBaseUrl || ''}/chovy/`
  return new URL(normalizedPath, new URL(basePath, window.location.origin)).href
}
