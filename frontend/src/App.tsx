
import { useState } from 'react'
import './App.css'

type FileItem = {
  name: string
  path: string
  kind: 'folder' | 'file'
  children?: FileItem[]
  language?: string
  content?: string
}

const projectFiles: FileItem[] = [
  {
    name: 'src',
    path: 'src',
    kind: 'folder',
    children: [
      {
        name: 'components',
        path: 'src/components',
        kind: 'folder',
        children: [
          {
            name: 'ProductCard.tsx',
            path: 'src/components/ProductCard.tsx',
            kind: 'file',
            language: 'TypeScript React',
            content: `type Product = {
  id: number
  name: string
  price: number
}

type ProductCardProps = {
  product: Product
  onAddToCart: (id: number) => void
}

export function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  return (
    <article className="product-card">
      <h3>{product.name}</h3>
      <p>\${product.price.toFixed(2)}</p>
      <button
        onClick={() => onAddToCart(product.id)}
      >
        Add to cart
      </button>
    </article>
  )
}`,
          },
          {
            name: 'Header.tsx',
            path: 'src/components/Header.tsx',
            kind: 'file',
            language: 'TypeScript React',
            content: `type HeaderProps = {
  cartCount: number
}

export function Header({ cartCount }: HeaderProps) {
  return (
    <header>
      <h1>My Store</h1>
      <span>Cart ({cartCount})</span>
    </header>
  )
}`,
          },
        ],
      },
      {
        name: 'services',
        path: 'src/services',
        kind: 'folder',
        children: [
          {
            name: 'api.ts',
            path: 'src/services/api.ts',
            kind: 'file',
            language: 'TypeScript',
            content: `export async function getProducts() {
  const response = await fetch('/api/products')

  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }

  return response.json()
}`,
          },
        ],
      },
      {
        name: 'App.tsx',
        path: 'src/App.tsx',
        kind: 'file',
        language: 'TypeScript React',
        content: `import { useState } from 'react'
import { Header } from './components/Header'
import { ProductCard } from './components/ProductCard'
import { getProducts } from './services/api'

export default function App() {
  const [cart, setCart] = useState<number[]>([])

  function handleAddToCart(id: number) {
    setCart((current) => [...current, id])
  }

  return (
    <>
      <Header cartCount={cart.length} />
      {/* Product list rendered here */}
    </>
  )
}`,
      },
      {
        name: 'main.tsx',
        path: 'src/main.tsx',
        kind: 'file',
        language: 'TypeScript React',
        content: `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`,
      },
    ],
  },
  {
    name: 'package.json',
    path: 'package.json',
    kind: 'file',
    language: 'JSON',
    content: `{
  "name": "my-store",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}`,
  },
  {
    name: 'README.md',
    path: 'README.md',
    kind: 'file',
    language: 'Markdown',
    content: `# My Store

A small React storefront.

## Development

pnpm install
pnpm dev

## Features

- Product listings
- Shopping cart
- Product API integration`,
  },
]

const initialQuestions = [
  'How does adding a product to the cart work?',
  'Where does the product data come from?',
  'Explain the application architecture',
]

function flattenFiles(items: FileItem[]): FileItem[] {
  return items.flatMap((item) =>
    item.kind === 'file'
      ? [item]
      : flattenFiles(item.children ?? []),
  )
}

function FileTree({
  items,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  items: FileItem[]
  selectedPath: string
  onSelect: (file: FileItem) => void
  depth?: number
}) {
  const [collapsed, setCollapsed] = useState<string[]>([])

  return (
    <>
      {items.map((item) => {
        const isCollapsed = collapsed.includes(item.path)

        return (
          <div key={item.path}>
            <button
              className={`tree-row ${selectedPath === item.path ? 'selected' : ''}`}
              style={{ paddingLeft: `${12 + depth * 16}px` }}
              onClick={() => {
                if (item.kind === 'folder') {
                  setCollapsed((current) =>
                    isCollapsed
                      ? current.filter((path) => path !== item.path)
                      : [...current, item.path],
                  )
                } else {
                  onSelect(item)
                }
              }}
            >
              <span className="tree-icon">
                {item.kind === 'folder'
                  ? isCollapsed ? '▸' : '▾'
                  : '◦'}
              </span>
              <span className={`file-name ${item.kind}`}>
                {item.name}
              </span>
            </button>
            {item.kind === 'folder' &&
              !isCollapsed &&
              item.children && (
                <FileTree
                  items={item.children}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                  depth={depth + 1}
                />
              )}
          </div>
        )
      })}
    </>
  )
}

function App() {
  const allFiles = flattenFiles(projectFiles)
  const [selectedFile, setSelectedFile] = useState(
    allFiles.find((file) => file.path === 'src/App.tsx')!,
  )
  const [activeView, setActiveView] = useState('Overview')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [search, setSearch] = useState('')

  function askQuestion(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return

    setQuestion(trimmed)
    setAnswer(
      'This is a preview response using sample project data. Once we connect the analysis backend, Codebase Guide will inspect the actual repository and provide a grounded explanation with file references.',
    )
  }

  const visibleFiles = allFiles.filter((file) =>
    file.path.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark">C</span>
          <span>codebase<span className="brand-light">guide</span></span>
        </a>

        <div className="topbar-project">
          <span className="status-dot" />
          <span>my-store</span>
          <span className="topbar-branch">main</span>
        </div>

        <div className="topbar-right">
          <span className="demo-badge">DEMO PROJECT</span>
          <button
            className="avatar"
            aria-label="User profile"
            title="User profile"
          >
            K
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading">WORKSPACE</div>

          <button
            className={`nav-item ${activeView === 'Overview' ? 'active' : ''}`}
            onClick={() => setActiveView('Overview')}
          >
            <span>▦</span> Overview
          </button>
          <button
            className={`nav-item ${activeView === 'Architecture' ? 'active' : ''}`}
            onClick={() => setActiveView('Architecture')}
          >
            <span>⌘</span> Architecture
          </button>
          <button
            className={`nav-item ${activeView === 'Ask your codebase' ? 'active' : ''}`}
            onClick={() => setActiveView('Ask your codebase')}
          >
            <span>✳</span> Ask your codebase
          </button>

          <div className="sidebar-divider" />

          <div className="section-title">
            <span>EXPLORER</span>
            <span className="muted-count">{allFiles.length}</span>
          </div>

          <div className="project-root">
            <span>▾</span>
            <strong>MY-STORE</strong>
          </div>

          <div className="tree">
            <FileTree
              items={projectFiles}
              selectedPath={selectedFile.path}
              onSelect={(file) => {
                setSelectedFile(file)
                setActiveView('Overview')
              }}
            />
          </div>

          <div className="sidebar-footer">
            <div className="footer-icon">i</div>
            <div>
              <strong>Sample repository</strong>
              <p>Illustration only</p>
            </div>
          </div>
        </aside>

        <section className="main-panel">
          <div className="breadcrumb">
            <span>my-store</span>
            <span>/</span>
            <span>{activeView === 'Overview' ? selectedFile.path : activeView}</span>
          </div>

          {activeView === 'Overview' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">CODEBASE EXPLORER</div>
                  <h1>Understand your code.</h1>
                  <p className="subtitle">
                    Explore how your project works, one connection at a time.
                  </p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">SOURCE FILES</span>
                  <strong>{allFiles.length}</strong>
                  <span className="stat-note">In this sample</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">TECHNOLOGY</span>
                  <strong className="stat-tech">React + TS</strong>
                  <span className="stat-note">Frontend stack</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">PROJECT STATUS</span>
                  <strong className="stat-tech">Sample</strong>
                  <span className="stat-note">
                    <span className="status-dot" /> Not yet indexed
                  </span>
                </div>
              </div>

              <div className="content-grid">
                <section className="panel code-panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">FILE PREVIEW</span>
                      <h2>{selectedFile.name}</h2>
                    </div>
                    <span className="language-badge">
                      {selectedFile.language}
                    </span>
                  </div>

                  <div className="code-breadcrumb">{selectedFile.path}</div>
                  <pre className="code-block">
                    <code>
                      {selectedFile.content
                        ?.split('\n')
                        .map((line, index) => (
                          <span className="code-line" key={index}>
                            <span className="line-number">{index + 1}</span>
                            <span>{line || ' '}</span>
                          </span>
                        ))}
                    </code>
                  </pre>

                  <div className="code-footer">
                    <span>Read-only preview</span>
                    <span>{selectedFile.content?.split('\n').length ?? 0} lines</span>
                  </div>
                </section>

                <section className="panel insights-panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">PROJECT INSIGHTS</span>
                      <h2>How it connects</h2>
                    </div>
                    <span className="sparkle">✳</span>
                  </div>

                  <p className="insights-description">
                    Explore the main building blocks of this sample application.
                  </p>

                  <div className="connection-list">
                    <button
                      className="connection-card"
                      onClick={() => {
                        const file = allFiles.find((item) => item.path === 'src/main.tsx')
                        if (file) setSelectedFile(file)
                      }}
                    >
                      <span className="connection-icon purple">UI</span>
                      <span className="connection-copy">
                        <strong>Application entry</strong>
                        <small>src/main.tsx</small>
                      </span>
                      <span className="connection-arrow">↗</span>
                    </button>
                    <div className="connector-line" />
                    <button
                      className="connection-card"
                      onClick={() => {
                        const file = allFiles.find((item) => item.path === 'src/App.tsx')
                        if (file) setSelectedFile(file)
                      }}
                    >
                      <span className="connection-icon blue">AP</span>
                      <span className="connection-copy">
                        <strong>App component</strong>
                        <small>src/App.tsx</small>
                      </span>
                      <span className="connection-arrow">↗</span>
                    </button>
                    <div className="connector-line" />
                    <button
                      className="connection-card"
                      onClick={() => {
                        const file = allFiles.find((item) => item.path === 'src/components/ProductCard.tsx')
                        if (file) setSelectedFile(file)
                      }}
                    >
                      <span className="connection-icon green">PC</span>
                      <span className="connection-copy">
                        <strong>Product card</strong>
                        <small>src/components/ProductCard.tsx</small>
                      </span>
                      <span className="connection-arrow">↗</span>
                    </button>
                  </div>

                  <div className="insight-note">
                    <span>✦</span>
                    <p>
                      <strong>Coming next</strong>
                      <br />
                      Automatically detect real imports, dependencies, and data flow.
                    </p>
                  </div>
                </section>
              </div>

              <section className="panel ask-panel">
                <div className="ask-title">
                  <span className="ask-icon">✳</span>
                  <div>
                    <h2>Ask your codebase</h2>
                    <p>Explore the sample with a question.</p>
                  </div>
                </div>

                <form
                  className="question-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    askQuestion(question)
                  }}
                >
                  <input
                    value={question}
                    onChange={(event) => {
                      setQuestion(event.target.value)
                      setAnswer('')
                    }}
                    placeholder="How does data flow through this application?"
                    aria-label="Ask a question about the codebase"
                  />
                  <button type="submit" disabled={!question.trim()}>
                    Ask <span>↗</span>
                  </button>
                </form>

                <div className="suggestion-list">
                  {initialQuestions.map((item) => (
                    <button key={item} onClick={() => askQuestion(item)}>
                      {item} <span>↗</span>
                    </button>
                  ))}
                </div>

                {answer && (
                  <div className="answer-preview">
                    <span className="answer-label">PREVIEW ANSWER</span>
                    <p>{answer}</p>
                    <small>
                      No repository analysis or AI model is connected yet.
                    </small>
                  </div>
                )}
              </section>
            </>
          )}

          {activeView === 'Architecture' && (
            <div className="alternate-view">
              <div className="eyebrow">PROJECT STRUCTURE</div>
              <h1>Architecture</h1>
              <p className="subtitle">
                A preliminary view of the sample application's components.
              </p>
              <div className="architecture-grid">
                {[
                  ['Entry point', 'src/main.tsx', 'Bootstraps the React application.'],
                  ['Application', 'src/App.tsx', 'Manages cart state and composes the UI.'],
                  ['Components', 'src/components/', 'Contains reusable interface components.'],
                  ['Services', 'src/services/api.ts', 'Fetches product data from an API.'],
                ].map(([title, path, description]) => (
                  <button
                    className="architecture-card"
                    key={path}
                    onClick={() => {
                      const file = allFiles.find((item) => item.path === path)
                      if (file) {
                        setSelectedFile(file)
                        setActiveView('Overview')
                      }
                    }}
                  >
                    <span className="architecture-symbol">◇</span>
                    <strong>{title}</strong>
                    <code>{path}</code>
                    <p>{description}</p>
                  </button>
                ))}
              </div>
              <p className="demo-disclaimer">
                This is a hand-written illustration, not an automatically generated dependency graph.
              </p>
            </div>
          )}

          {activeView === 'Ask your codebase' && (
            <div className="alternate-view question-view">
              <div className="eyebrow">CODEBASE ASSISTANT</div>
              <h1>Ask better questions.</h1>
              <p className="subtitle">
                Learn how a codebase works without searching every file manually.
              </p>
              <form
                className="question-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  askQuestion(question)
                }}
              >
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask about a function, component, or data flow..."
                  aria-label="Ask the codebase"
                />
                <button type="submit" disabled={!question.trim()}>
                  Ask <span>↗</span>
                </button>
              </form>
              <div className="suggestion-list">
                {initialQuestions.map((item) => (
                  <button key={item} onClick={() => askQuestion(item)}>
                    {item} <span>↗</span>
                  </button>
                ))}
              </div>
              {answer && (
                <div className="answer-preview">
                  <span className="answer-label">PREVIEW ANSWER</span>
                  <p>{answer}</p>
                  <small>Connect the backend to enable real codebase answers.</small>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="right-sidebar">
          <div className="right-heading">
            <span className="sparkle">✳</span>
            <strong>Workspace details</strong>
          </div>
          <div className="right-section">
            <span className="panel-kicker">PROJECT</span>
            <div className="detail-row">
              <span>Name</span><strong>my-store</strong>
            </div>
            <div className="detail-row">
              <span>Language</span><strong>TypeScript</strong>
            </div>
            <div className="detail-row">
              <span>Framework</span><strong>React</strong>
            </div>
          </div>
          <div className="right-section">
            <span className="panel-kicker">QUICK ACTIONS</span>
            <button className="quick-action" onClick={() => setSearch('components')}>
              <span>⌕</span>
              Search components
              <span className="action-arrow">↗</span>
            </button>
            <button className="quick-action" onClick={() => setActiveView('Architecture')}>
              <span>⌘</span>
              View architecture
              <span className="action-arrow">↗</span>
            </button>
            <button className="quick-action" onClick={() => setActiveView('Ask your codebase')}>
              <span>✳</span>
              Ask a question
              <span className="action-arrow">↗</span>
            </button>
          </div>
          <div className="right-section">
            <label className="panel-kicker" htmlFor="file-search">FIND A FILE</label>
            <input
              id="file-search"
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search file paths..."
            />
            {search && (
              <div className="search-results">
                {visibleFiles.length ? visibleFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => {
                      setSelectedFile(file)
                      setActiveView('Overview')
                    }}
                  >
                    {file.path}
                  </button>
                )) : <span>No matching files</span>}
              </div>
            )}
          </div>
          <div className="right-tip">
            <span>✦</span>
            <strong>Built for understanding</strong>
            <p>Our goal is to help you understand the relationships behind the code, not just the individual lines.</p>
          </div>
        </aside>
      </div>

      <footer className="app-footer">
        <span><span className="status-dot" /> Codebase Guide <span className="footer-muted">· Early prototype</span></span>
        <span>Explore. Understand. Build.</span>
      </footer>
    </main>
  )
}

export default App

