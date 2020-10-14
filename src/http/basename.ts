import { createCell, Middleware, useCell } from '../core/pipeline'
import { HttpMiddleware, ResponseOutput } from './index'

export const BasenameCell = createCell('')

export const useBasename = () => {
  let basename = useCell(BasenameCell)
  return basename
}

export const basename = <T extends { pathname: string }>(
  ...basenames: string[]
): Middleware<T, ResponseOutput> => {
  return async (request, next) => {
    let basenameCell = useCell(BasenameCell)

    let result = handleBasenames(basenames, request)

    basenameCell.value = result.basename

    return next(result.request)
  }
}

export const handleBasenames = <T extends { pathname: string }>(
  basenames: string[],
  request: T
) => {
  let { basename, pathname } = findBasename(basenames, request.pathname)

  let newRequest = {
    ...request,
    pathname,
  }

  return {
    basename,
    request: newRequest,
  }
}

const findBasename = (basenames: string[], pathname: string) => {
  for (let i = 0; i < basenames.length; i++) {
    let basename = basenames[i]

    if (!pathname.startsWith(basename)) continue

    let newPathname = pathname.replace(basename, '')

    if (!newPathname.startsWith('/')) {
      newPathname = '/' + newPathname
    }

    return {
      basename,
      pathname: newPathname,
    }
  }

  return {
    basename: '',
    pathname,
  }
}
