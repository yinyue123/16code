/**
 * 16code Worker entry.
 *
 * 两层路由:
 *   1) Cloudflare 先匹配 dist/ 里的静态文件 —— 命中就直接吐文件,不会进这里(免费)。
 *   2) 没命中的请求才进这个 fetch,由下面按路径分发;非 /api/* 的再交还给静态资源。
 *
 * 防刷:
 *   - 所有 /api/* 的 GET 响应走「边缘缓存」(caches.default),相同查询直接命中缓存,
 *     不再执行后续逻辑 —— 这是扛刷 + 省额度最有效的一招。
 *   - 可选的「按 IP 限流」:只有在仪表盘里创建并绑定了 KV(binding 名 RL)才生效;
 *     没绑定就自动跳过,靠仪表盘的 Rate Limiting 规则兜底(见 README/对话说明)。
 */

interface Env {
  ASSETS: Fetcher          // 静态资源把手(wrangler.jsonc 里 assets.binding=ASSETS)
  RL?: KVNamespace         // 可选:按 IP 限流用的 KV;不绑定则关闭代码级限流
}

// 每个 IP 在 WINDOW 秒内最多 LIMIT 次 /api 请求(仅 RL 绑定时生效)。
const RL_LIMIT = 60
const RL_WINDOW = 60

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
  })

// best-effort 限流:KV 计数 + TTL 窗口。KV 是最终一致、近似计数,
// 够挡脚本狂刷;要严格保证请用 Durable Object 或仪表盘 Rate Limiting 规则。
async function rateLimited(env: Env, ip: string): Promise<boolean> {
  if (!env.RL) return false
  const key = `rl:${ip}`
  const n = parseInt((await env.RL.get(key)) ?? '0', 10)
  if (n >= RL_LIMIT) return true
  await env.RL.put(key, String(n + 1), { expirationTtl: RL_WINDOW })
  return false
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'

  // 1) 限流(可选)
  if (await rateLimited(env, ip)) {
    return json({ error: 'rate_limited' }, { status: 429, headers: { 'retry-after': String(RL_WINDOW) } })
  }

  // 2) 边缘缓存:只缓存 GET。命中直接返回,不跑下面的逻辑。
  const cache = caches.default
  const canCache = request.method === 'GET'
  if (canCache) {
    const hit = await cache.match(request)
    if (hit) return hit
  }

  // 3) 路由 —— 把下面这些换成你真正的查询即可
  let res: Response
  switch (url.pathname) {
    case '/api/ping':
      res = json({ ok: true, time: Date.now() })
      break
    case '/api/echo': {
      const name = url.searchParams.get('name') ?? 'world'
      res = json({ msg: `hello, ${name}` })
      break
    }
    // 示例:返回最新版本号(可改成查 D1/KV)
    case '/api/version':
      res = json({ latest: 'v0.1.0' })
      break
    default:
      res = json({ error: 'not_found' }, { status: 404 })
  }

  // 4) 写入边缘缓存(只缓存成功的 GET,缓存 60s)
  if (canCache && res.ok) {
    res = new Response(res.body, res)
    res.headers.set('cache-control', 'public, s-maxage=60')
    await cache.put(request, res.clone())
  }
  return res
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env)
    }
    // 非 api:交还给静态站(命中文件返回文件,否则 404 页)
    return env.ASSETS.fetch(request)
  },
}
