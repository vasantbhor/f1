import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')
const assetsDir = path.join(distDir, 'assets')
const appHtmlPath = path.join(distDir, 'app.html')

const html = fs.readFileSync(appHtmlPath, 'utf8')
const assetFiles = fs.readdirSync(assetsDir)

const cssFile = assetFiles.find((file) => file.endsWith('.css'))
const jsFile = assetFiles.find((file) => file.endsWith('.js'))

if (!jsFile) {
  throw new Error('Expected a bundled JS file in dist/assets')
}

const css = cssFile ? fs.readFileSync(path.join(assetsDir, cssFile), 'utf8') : ''
const js = fs
  .readFileSync(path.join(assetsDir, jsFile), 'utf8')
  .replace(/<\/script/gi, '<\\/script')

const strippedHtml = html
  .replace(/\s*<script\b[^>]*\bsrc=["'][^"']+["'][^>]*><\/script>/gi, '')
  .replace(/\s*<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, '')

const withCss = css
  ? strippedHtml.replace('</head>', () => `    <style>${css}</style>\n  </head>`)
  : strippedHtml

const standaloneHtml = withCss.replace(
  '</body>',
  () => `    <script>${js}</script>\n  </body>`
)

fs.writeFileSync(path.join(distDir, 'index.html'), standaloneHtml, 'utf8')
fs.writeFileSync(path.join(rootDir, 'index.html'), standaloneHtml, 'utf8')

fs.rmSync(appHtmlPath, { force: true })
fs.rmSync(assetsDir, { recursive: true, force: true })

console.log('Generated standalone index.html in dist/ and project root.')
