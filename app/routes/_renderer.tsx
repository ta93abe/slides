import { createMiddleware } from 'hono/factory'
import { html, raw } from 'hono/html'
import slideStyle from '../slide.css?raw'
import slideScript from '../slide.js?raw'

export const rendererMiddleware = createMiddleware(async (c, next) => {
  c.setRenderer((content, { frontmatter }) => {
    const head = frontmatter ?? ({ title: '' } as typeof frontmatter)
    const isSlide = !!head.slide
    const theme = head.theme ?? 'dark'

    const meta = (
      <>
        <meta charset='utf-8' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0'
        />
        <link rel='shortcut icon' href='/favicon.png' />
        <link rel='stylesheet' href='https://fonts.xz.style/serve/inter.css' />
        <link
          rel='stylesheet'
          href='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-dark.min.css'
        />
        <title>{head.title}</title>
        <meta property='og:title' content={head.title} />
        {head.url ? <meta property='og:url' content={head.url} /> : <></>}
        {head.imageUrl ? (
          <meta property='og:image' content={head.imageUrl} />
        ) : (
          <></>
        )}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:creator' content='@ta93abe' />
        {head.imageUrl ? (
          <meta name='twitter:image:src' content={head.imageUrl} />
        ) : (
          <></>
        )}
      </>
    )

    if (isSlide) {
      return c.html(
        <html color-mode='dark'>
          <head>
            {meta}
            {html`<style>${raw(slideStyle)}</style>`}
          </head>
          <body data-theme={theme}>
            <div id='deck'>
              <div id='slides'>{content}</div>
            </div>
            <div id='progress'></div>
            <div id='counter'></div>
            <div id='hint'>← → / space ・ f: fullscreen</div>
            <script src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js'></script>
            <script>{raw(slideScript)}</script>
          </body>
        </html>
      )
    }

    return c.html(
      <html color-mode='dark'>
        <head>
          {meta}
          <link
            rel='stylesheet'
            href='https://cdn.jsdelivr.net/npm/@exampledev/new.css@1.1.2/new.min.css'
          />
          <link rel='stylesheet' href='https://newcss.net/theme/night.css' />
        </head>
        <body>
          <main>
            <div>{content}</div>
          </main>
          <br />
          <hr />
          <footer>
            <address>
              &copy; ta93abe{' '}
              <a href='https://github.com/ta93abe'>
                https://github.com/ta93abe
              </a>
            </address>
          </footer>
        </body>
        <script src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js'></script>
        <script>{raw('hljs.highlightAll()')}</script>
      </html>
    )
  })
  await next()
})

export default rendererMiddleware
