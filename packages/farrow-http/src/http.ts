import { createServer, IncomingMessage, Server, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'
import { Stream } from 'stream'

import type { Options as BodyOptions } from 'co-body'
import { parse as parseCookies, CookieParseOptions as CookieOptions } from 'cookie'
import { parse as parseQuery, IParseOptions as QueryOptions } from 'qs'
import CookiesClass from 'cookies'
import statuses from 'statuses'
import accepts from 'accepts'
import encodeurl from 'encodeurl'
import escapeHtml from 'escape-html'
import vary from 'vary'
import onfinish from 'on-finished'
import destroy from 'destroy'
import mime from 'mime-types'

import { createContainer, runWithContainer, Container, ContextStorage } from 'farrow-pipeline'

import { JsonType } from 'farrow-schema'

import { RequestCookies, RequestHeaders, RequestQuery, RequestInfo } from './requestInfo'

import { ResponseInfo, Status, Headers, Cookies, RedirectBody, FileBodyOptions } from './responseInfo'

import { Response } from './response'

import { BasenamesContext, handleBasenames } from './basenames'

import { Router, RouterPipeline } from './router'

import { createLogger, LoggerEvent, LoggerOptions } from './logger'

import { access, getBody, getContentLength } from './util'

import { RequestContext, RequestInfoContext, ResponseContext } from './context'

export type HttpPipelineOptions = {
  basenames?: string[]
  body?: BodyOptions
  cookie?: CookieOptions
  query?: QueryOptions
  contexts?: (params: {
    req: IncomingMessage
    requestInfo: RequestInfo
    basename: string
  }) => ContextStorage | Promise<ContextStorage>
  logger?: boolean | LoggerOptions
  errorStack?: boolean
}

export type HttpPipeline = RouterPipeline & {
  handle: (req: IncomingMessage, res: ServerResponse) => Promise<void>
  listen: (...args: Parameters<Server['listen']>) => Server
  server: () => Server
}

export const createHttpPipeline = (options?: HttpPipelineOptions): HttpPipeline => {
  const isNotProduction = process.env.NODE_ENV !== 'production'
  const config: HttpPipelineOptions = {
    logger: isNotProduction,
    errorStack: isNotProduction,
    ...options,
  }

  const loggerOptions: LoggerOptions = !config.logger || typeof config.logger === 'boolean' ? {} : config.logger

  const logger = config.logger ? createLogger(loggerOptions) : null

  const router = Router()

  const handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
    if (typeof req.url !== 'string') {
      throw new Error(`req.url is not existed`)
    }

    const { url } = req

    const [pathname = '/', search = ''] = url.split('?')

    const method = req.method ?? 'GET'

    const query = (req as any).query ?? (parseQuery(search, config.query) as RequestQuery)

    const body = (req as any).body ?? (await getBody(req, config.body))

    const headers = req.headers as RequestHeaders

    const cookies = parseCookies(req.headers['cookie'] ?? '', config.cookie) as RequestCookies

    const { basename, requestInfo } = handleBasenames(config.basenames ?? [], {
      pathname,
      method,
      query,
      body,
      headers,
      cookies,
    })

    const storages = await config.contexts?.({
      req,
      requestInfo,
      basename,
    })

    const container = createContainer({
      ...storages,
      request: RequestContext.create(req),
      response: ResponseContext.create(res),
      basenames: BasenamesContext.create([basename]),
      requestInfo: RequestInfoContext.create(requestInfo),
    })

    const responser = await router.run(requestInfo, {
      container,
      onLast: () => Response.status(404).text('404 Not Found'),
    })

    await handleResponse({
      req,
      res,
      requestInfo,
      responseInfo: responser.info,
      container,
    })
  }

  const handle: HttpPipeline['handle'] = async (req, res) => {
    if (logger) {
      const startTime = Date.now()
      const method = req.method ?? 'GET'
      const url = req.url ?? ''

      let contentLength = 0

      let hasLogOut = false
      const logOutput = (event: LoggerEvent) => {
        if (hasLogOut) return
        hasLogOut = true
        logger?.logOutput(method, url, res.statusCode, startTime, contentLength || getContentLength(res), event)
      }

      logger.logInput(method, url)
      // log close
      res.once('close', () => {
        logOutput('close')
      })

      // log error
      res.once('error', () => {
        logOutput('error')
      })

      // log finish
      res.once('finish', () => {
        logOutput('finish')
      })

      // log stream pipe response
      res.once('pipe', (readable) => {
        readable.on('data', (chunk) => {
          contentLength += chunk.length
        })
      })
    }

    try {
      return await handleRequest(req, res)
    } catch (error) {
      const message = (config.errorStack ? error?.stack || error?.message : error?.message) ?? ''

      if (!res.headersSent) {
        res.statusCode = error.statusCode ?? 500
        res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Content-Length', Buffer.byteLength(message))
      }

      if (!res.writableEnded) {
        res.end(Buffer.from(message))
      }
    }
  }

  const server: HttpPipeline['server'] = () => {
    return createServer(handle)
  }

  const listen: HttpPipeline['listen'] = (...args) => {
    return server().listen(...args)
  }

  return {
    ...router,
    handle,
    listen,
    server,
  }
}

export const Http = createHttpPipeline

export type ResponseParams = {
  requestInfo: RequestInfo
  responseInfo: ResponseInfo
  req: IncomingMessage
  res: ServerResponse
  container: Container
}

export const handleResponse = (params: ResponseParams) => {
  const { req, res, requestInfo, responseInfo, container } = params
  const basenames = container.read(BasenamesContext)
  const prefix = basenames.join('')
  const accept = accepts(req)

  // handle response status
  const handleStatus = (status: Status = { code: 200 }) => {
    const { code, message } = status

    res.statusCode = code
    res.statusMessage = message || (statuses.message[code] ?? '')
  }

  // handle response headers
  const handleHeaders = (headers: Headers) => {
    Object.entries(headers).forEach(([name, value]) => {
      if (value) {
        res.setHeader(name, value)
      }
    })
  }

  // handle response cookies
  const handleCookies = (cookies: Cookies) => {
    const cookiesInstance = new CookiesClass(req, res)

    Object.entries(cookies).forEach(([name, cookie]) => {
      if (cookie.value !== null) {
        cookiesInstance.set(name, `${cookie.value}`, cookie.options)
      } else {
        cookiesInstance.set(name, '', cookie.options)
      }
    })
  }

  const handleEmpty = () => {
    const code = responseInfo.status?.code ?? 204

    handleStatus({ code })

    res.removeHeader('Content-Type')
    res.removeHeader('Transfer-Encoding')

    res.end()
  }

  const handleString = (content: string) => {
    const length = Buffer.byteLength(content)

    res.setHeader('Content-Length', length)
    res.end(content)
  }

  const handleJson = (json: JsonType) => {
    const content = JSON.stringify(json)
    const length = Buffer.byteLength(content)
    res.setHeader('Content-Length', length)
    res.end(content)
  }

  const handleRedirect = (body: RedirectBody) => {
    let url = body.value

    if (url === 'back') {
      const referrer = `${req.headers['referer']}` || '/'
      url = referrer
    }

    // handle routename and basename
    if (body.usePrefix && !url.startsWith('//') && url.startsWith('/')) {
      url = prefix + url
    }

    const code = responseInfo.status?.code ?? 302

    handleStatus({
      code: statuses.redirect[code] ? code : 302,
    })

    handleHeaders({
      Location: encodeurl(url),
    })

    if (accept.types('html')) {
      handleHeaders({
        'Content-Type': 'text/html; charset=utf-8',
      })
      handleString(`Redirecting to ${escapeHtml(url)}`)
    } else {
      handleString(`Redirecting to ${url}`)
    }
  }

  const handleBuffer = (buffer: Buffer) => {
    res.setHeader('Content-Length', buffer.length)
    res.end(buffer)
  }

  const handleFile = async (filename: string, options?: FileBodyOptions) => {
    try {
      await access(filename, fs.constants.F_OK | fs.constants.R_OK)
    } catch (error) {
      await handleResponse({
        ...params,
        responseInfo: Response.status(404).text(error.message).info,
      })
      return
    }

    const stream = fs.createReadStream(filename, options)

    if (!res.getHeader('Content-Type')) {
      const ext = path.extname(filename)
      const contentType = mime.contentType(ext)

      if (contentType) {
        res.setHeader('Content-Type', contentType)
      }
    }

    return handleStream(res, stream)
  }

  const { body } = responseInfo

  handleStatus(responseInfo.status)

  if (responseInfo.cookies) {
    handleCookies(responseInfo.cookies)
  }

  if (responseInfo.headers) {
    handleHeaders(responseInfo.headers)
  }

  if (responseInfo.vary) {
    vary(res, responseInfo.vary)
  }

  if (!body || body.type === 'empty') {
    return handleEmpty()
  }

  if (body.type === 'string') {
    return handleString(body.value)
  }

  if (body.type === 'json') {
    return handleJson(body.value)
  }

  if (body.type === 'redirect') {
    return handleRedirect(body)
  }

  if (body.type === 'stream') {
    return handleStream(res, body.value)
  }

  if (body.type === 'buffer') {
    return handleBuffer(body.value)
  }

  if (body.type === 'file') {
    return handleFile(body.value)
  }

  if (body.type === 'custom') {
    const { handler } = body
    const handleResponse = () => {
      return handler({
        req,
        res,
        requestInfo,
        responseInfo: omitBody(responseInfo),
      })
    }
    return runWithContainer(handleResponse, container)
  }

  throw new Error(`Unsupported response body: ${JSON.stringify(body, null, 2)}`)
}

const omitBody = <T extends { body?: any }>(obj: T): Omit<T, 'body'> => {
  const { body, ...rest } = obj
  return rest
}

const handleStream = (res: ServerResponse, stream: Stream) => {
  return new Promise<boolean>((resolve, reject) => {
    stream.once('error', reject)
    stream.pipe(res)
    onfinish(res, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve(true)
      }
      destroy(stream)
    })
  })
}
