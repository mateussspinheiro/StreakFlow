import { readFileSync } from 'node:fs'
import { webcrypto } from 'node:crypto'
import vm from 'node:vm'
import ts from 'typescript'

export function app(initial = [], clock = Date) {
  const data = new Map(initial)
  let blocked = false
  const localStorage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { if (blocked) throw new Error('quota'); data.set(key, value) },
    removeItem: key => { if (blocked) throw new Error('blocked'); data.delete(key) },
  }
  const modules = new Map()
  function load(name) {
    if (modules.has(name)) return modules.get(name)
    const source = readFileSync(new URL(`../../src/lib/${name}.ts`, import.meta.url), 'utf8')
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
    const context = { exports: {}, Date: clock, localStorage, sessionStorage: { getItem: () => null }, crypto: webcrypto, TextEncoder, require: path => load(path.slice(2)) }
    vm.runInNewContext(compiled, context)
    modules.set(name, context.exports)
    return context.exports
  }
  return { store: load('streakflow'), auth: load('auth'), dates: load('habits'), insights: load('insights'), tracking: load('tracking'), consistency: load('consistency'), data, block: () => { blocked = true } }
}

