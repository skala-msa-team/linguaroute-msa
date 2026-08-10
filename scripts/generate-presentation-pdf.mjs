import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')
const sourcePath = path.join(repoRoot, 'docs', 'team6-presentation-plan.md')
const outputDir = path.join(repoRoot, 'output', 'pdf')
const tempDir = path.join(repoRoot, 'tmp', 'pdfs')
const htmlPath = path.join(tempDir, 'team6-presentation-plan.html')

const source = await fs.readFile(sourcePath, 'utf8')

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function inlineMarkdown(value) {
  let result = escapeHtml(value)
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>')
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  return result
}

function architectureHtml() {
  return `
    <div class="architecture">
      <div class="arch-row arch-main">
        <div class="arch-lane client-lane"><span>사용자 채널</span><b>Vue Frontend</b><small>직원 · 기업 관리자 · 플랫폼 관리자</small></div>
        <div class="arch-arrow">REST /api<br>Bearer Token</div>
        <div class="arch-lane gateway-lane"><span>진입 계층</span><b>API Gateway</b><small>JWT 검증 · 단일 진입점 · 라우팅</small></div>
        <div class="arch-arrow">Eureka 탐색<br>서비스 호출</div>
        <div class="arch-services">
          <span>LinguaRoute 핵심 서비스</span>
          <b>Auth Server<br><small>Email Login · JWT</small></b><b>user-service</b><b>course-service</b>
          <b>enrollment-service</b><b>payment-service</b><b>recommend-service</b>
        </div>
        <div class="arch-arrow">서비스별<br>읽기 · 쓰기</div>
        <div class="arch-lane data-lane"><span>데이터</span><b>MariaDB</b><small>lecture_db<br>서비스별 소유 테이블</small></div>
      </div>
      <div class="arch-control"><b>Eureka</b><span>각 서비스 등록 · 하트비트 · API Gateway의 위치 탐색</span></div>
      <div class="arch-events"><b>payment-service</b><i>PaymentCompleted · Failed · Canceled · Expired · Renewed</i><b>Kafka</b><i>권한 · 좌석 · 기간 반영</i><b>user-service</b></div>
      <div class="arch-calls">
        <div><b>enrollment-service → user-service</b><span>사용자 역할과 기업 구독 권한 확인</span></div>
        <div><b>enrollment-service → course-service</b><span>수강신청 대상 ACTIVE 강의 확인</span></div>
        <div><b>recommend-service → course-service</b><span>실제 ACTIVE 강의와 요청 언어 일치 검증</span></div>
      </div>
    </div>`
}

function imageHtml(alt, relativePath) {
  const absolutePath = path.resolve(path.dirname(sourcePath), relativePath)
  const figureClass = alt.includes('아키텍처') ? 'screenshot architecture-figure' : 'screenshot'
  return `<figure class="${figureClass}"><img src="${encodeURI(`file://${absolutePath}`)}" alt="${escapeHtml(alt)}"><figcaption>${inlineMarkdown(alt)}</figcaption></figure>`
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/)
  const output = []
  let index = 0
  let sectionNumber = 0

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim()
      const codeLines = []
      index += 1
      while (index < lines.length && !lines[index].startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }
      index += 1
      output.push(language === 'mermaid' ? architectureHtml() : `<pre class="code-block"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
      continue
    }

    const imageMatch = line.match(/^!\[([^\]]+)]\(([^)]+)\)$/)
    if (imageMatch) {
      output.push(imageHtml(imageMatch[1], imageMatch[2]))
      index += 1
      continue
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      if (level === 2) sectionNumber += 1
      const exampleClass = headingMatch[2].startsWith('예시 1.') ? ' example-start' : ''
      const className = (level === 1 ? 'cover-title' : level === 2 ? `section-title section-${sectionNumber}` : 'subsection-title') + exampleClass
      output.push(`<h${level} class="${className}">${inlineMarkdown(headingMatch[2])}</h${level}>`)
      index += 1
      continue
    }

    if (line.startsWith('|') && index + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[index + 1])) {
      const rows = []
      rows.push(line)
      index += 2
      while (index < lines.length && lines[index].startsWith('|')) {
        rows.push(lines[index])
        index += 1
      }
      const cells = rows.map((row) => row.slice(1, -1).split('|').map((cell) => cell.trim()))
      output.push('<table><thead><tr>' + cells[0].map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('') + '</tr></thead><tbody>')
      for (const row of cells.slice(1)) {
        output.push('<tr>' + row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join('') + '</tr>')
      }
      output.push('</tbody></table>')
      continue
    }

    if (line.startsWith('> ')) {
      output.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`)
      index += 1
      continue
    }

    if (/^- /.test(line)) {
      const items = []
      while (index < lines.length && /^- /.test(lines[index])) {
        items.push(`<li>${inlineMarkdown(lines[index].slice(2))}</li>`)
        index += 1
      }
      output.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    if (/^\d+\. /.test(line)) {
      const items = []
      while (index < lines.length && /^\d+\. /.test(lines[index])) {
        items.push(`<li>${inlineMarkdown(lines[index].replace(/^\d+\. /, ''))}</li>`)
        index += 1
      }
      output.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    const paragraph = [line.trim()]
    index += 1
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,4})\s/.test(lines[index]) &&
      !lines[index].startsWith('```') &&
      !lines[index].startsWith('|') &&
      !lines[index].startsWith('![') &&
      !lines[index].startsWith('> ') &&
      !/^- /.test(lines[index]) &&
      !/^\d+\. /.test(lines[index])
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`)
  }

  return output.join('\n')
}

const content = markdownToHtml(source)
const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>LinguaRoute 조별 발표 기획서</title>
<style>
  @page { size: A4; margin: 16mm 14mm 18mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; color: #172019; font-family: "Apple SD Gothic Neo", "AppleGothic", sans-serif; font-size: 10.3pt; line-height: 1.58; }
  body::after { content: "광주 3반 6조  |  LinguaRoute  |  Agile & MSA 실습 팀과제"; position: fixed; left: 0; right: 0; bottom: -11mm; padding-top: 2mm; border-top: 1px solid #dce4d8; color: #6b756d; font-size: 8pt; text-align: center; }
  h1, h2, h3, h4 { margin: 0; color: #173c2c; line-height: 1.24; break-after: avoid; }
  .cover-title { margin-top: 46mm; font-size: 34pt; letter-spacing: -1.6px; text-align: center; }
  .cover-title::before { content: "LINGUAROUTE"; display: block; margin-bottom: 12px; color: #679c35; font-size: 10pt; letter-spacing: 4px; }
  .section-title { break-before: page; margin: 0 0 9mm; padding: 6mm 7mm; color: white; background: linear-gradient(135deg, #123d2c, #2f704b); border-radius: 4mm; font-size: 23pt; letter-spacing: -0.7px; }
  .section-title::before { content: "SECTION"; display: block; margin-bottom: 2mm; color: #c6f26a; font-size: 8pt; letter-spacing: 2px; }
  .subsection-title { margin: 8mm 0 3mm; color: #255d40; font-size: 15pt; }
  .example-start { break-before: page; }
  h4.subsection-title { font-size: 12pt; }
  p { margin: 0 0 4mm; }
  blockquote { margin: 9mm auto 12mm; padding: 7mm; max-width: 155mm; color: #173c2c; background: #eff7e7; border-left: 5px solid #a7d957; border-radius: 3mm; font-size: 14pt; font-weight: 700; text-align: center; }
  table { width: 100%; margin: 3mm 0 7mm; border-collapse: collapse; table-layout: fixed; font-size: 8.25pt; break-inside: auto; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th { padding: 2.4mm; color: white; background: #24533b; border: 1px solid #24533b; text-align: left; }
  td { padding: 2.25mm; border: 1px solid #d6dfd5; vertical-align: top; overflow-wrap: anywhere; }
  tbody tr:nth-child(even) td { background: #f7faf5; }
  code { padding: 0.25mm 1mm; color: #1d5f42; background: #eef6e9; border-radius: 1mm; font-family: Menlo, monospace; font-size: 0.9em; }
  .code-block { margin: 3mm 0 7mm; padding: 4mm; color: #eaf5e6; background: #17352a; border-radius: 3mm; white-space: pre-wrap; overflow-wrap: anywhere; break-inside: avoid; font-size: 8.3pt; line-height: 1.55; }
  .code-block code { padding: 0; color: inherit; background: transparent; }
  ul, ol { margin: 2mm 0 6mm; padding-left: 7mm; }
  li { margin-bottom: 1.5mm; }
  .screenshot { margin: 5mm 0 8mm; padding: 3mm; background: #f3f6f1; border: 1px solid #dbe3d8; border-radius: 3mm; break-inside: avoid; text-align: center; }
  .screenshot img { display: block; width: 100%; max-height: 172mm; object-fit: contain; border-radius: 2mm; }
  .screenshot figcaption { margin-top: 2mm; color: #536058; font-size: 8.5pt; font-weight: 700; }
  .screenshot + h3 { break-before: page; }
  .architecture-figure { margin-top: 2mm; padding: 2mm; break-after: page; }
  .architecture-figure img { max-height: none; }
  .architecture { margin: 4mm 0 8mm; padding: 5mm; background: #f5f8f2; border: 1px solid #dbe5d6; border-radius: 4mm; break-inside: avoid; font-size: 7.4pt; }
  .arch-row { display: grid; grid-template-columns: 1.05fr .72fr .9fr .72fr 2.2fr .72fr 1fr; align-items: stretch; gap: 2mm; }
  .arch-lane, .arch-services { padding: 3mm; border-radius: 2.5mm; text-align: center; }
  .arch-lane span, .arch-services>span { display: block; margin-bottom: 2mm; font-size: 6.5pt; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; }
  .arch-lane b { display: block; margin-bottom: 1mm; font-size: 9pt; }
  .client-lane { background: #e9f5da; border: 1px solid #b8d98c; }
  .gateway-lane { color: white; background: #275a40; }
  .data-lane { background: #ebe8fa; border: 1px solid #c7c0ea; }
  .arch-services { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5mm; background: #e8f1eb; border: 1px solid #b8cdbd; }
  .arch-services>span { grid-column: 1 / -1; color: #315440; }
  .arch-services b { padding: 2mm 1mm; background: white; border: 1px solid #cddbd0; border-radius: 1.5mm; font-size: 7.4pt; }
  .arch-arrow { align-self: center; position: relative; color: #526158; font-size: 6.4pt; font-weight: 700; text-align: center; }
  .arch-arrow::after { content: "→"; display: block; color: #629637; font-size: 18pt; line-height: 1; }
  .arch-control { display: flex; gap: 3mm; margin-top: 3mm; padding: 2.5mm 4mm; color: #4c4122; background: #fff4ce; border-radius: 2mm; }
  .arch-events { display: grid; grid-template-columns: .8fr 2fr .7fr 1.4fr .8fr; align-items: center; gap: 2mm; margin-top: 3mm; padding: 3mm; color: white; background: #3d355f; border-radius: 2mm; text-align: center; }
  .arch-events i { color: #e6dcff; font-style: normal; font-size: 6.5pt; }
  .arch-events i::after { content: "  →"; color: #c9f069; font-size: 11pt; }
  .arch-calls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2mm; margin-top: 3mm; }
  .arch-calls div { padding: 2.5mm; background: white; border: 1px solid #d6e0d3; border-radius: 2mm; }
  .arch-calls b, .arch-calls span { display: block; }
  .arch-calls span { margin-top: 1mm; color: #657168; }
  .section-1 + p { font-size: 12pt; }
  .section-7 { background: linear-gradient(135deg, #3d355f, #6d5cad); }
</style>
</head>
<body>${content}</body>
</html>`

await fs.mkdir(outputDir, { recursive: true })
await fs.mkdir(tempDir, { recursive: true })
await fs.writeFile(htmlPath, html)
console.log(htmlPath)
