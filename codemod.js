export default function transformer (file, api) {
  const j = api.jscodeshift

  const yieldToAwait = p => {
    const node = p.node
    const arg = node.argument
    const n = j.awaitExpression(arg)
    return n
  }
  const replaceCoWrap = p => {
    const right = p.node.right
    const args = right.arguments
    if (args.length !== 1) throw new Error('Expected one argument')
    const body = args[0]
    return j.assignmentExpression(p.node.operator, p.node.left, body)
  }

  const removeCo = p => {
    const node = p.node
    const args = node.arguments
    if (args.length !== 1) throw new Error('Expected one argument')
    return args[0]
  }

  const generatorToAsync = p => {
    const node = p.node
    const {id, params, body, expression} = node
    const n = j.functionExpression(id, params, body, false, expression)
    n.async = true
    return n
  }

  const generatorToAsyncDec = p => {
    const node = p.node
    const {id, params, body, expression} = node
    const n = j.functionDeclaration(id, params, body, false, expression)
    n.async = true
    return n
  }

  // log filter
  // const log = id => p => { console.log(id, p.node); return true }

  const root = j(file.source)

  // yield -> await
  root.find(j.YieldExpression)
    .replaceWith(yieldToAwait)

  // a = co.wrap(function * () {}) > a = function * () {}
  root.find(j.AssignmentExpression, { right: { callee: { object: { name: 'co' }, property: { name: 'wrap' } } } })
    .replaceWith(replaceCoWrap)

  // co.wrap(...) -> ...
  root.find(j.CallExpression, { callee: { object: { name: 'co' }, property: { name: 'wrap' } } })
    .replaceWith(removeCo)

  //  co(...) -> (async ...)()
  root.find(j.CallExpression, { callee: { name: 'co' } })
   .replaceWith(removeCo)
   .replaceWith(p => j.callExpression(p.node, []))

  // a = function * () -> a = async function ()
  root.find(j.FunctionDeclaration, { generator: true })
    .replaceWith(generatorToAsyncDec)

  // function * () -> async function ()
  root.find(j.FunctionExpression, { generator: true })
    .replaceWith(generatorToAsync)

  // remove require co
  root
    .find(j.VariableDeclaration)
    .filter(p => {
      const { declarations } = p.node
      if (declarations.length !== 1) return false
      const declaration = declarations[0]
      if (declaration.id.name !== 'co') return false
      if (declaration.init.callee.name !== 'require') return false
      return true
    })
    .replaceWith(p => {
      return null
    })

  const replaced = root.toSource()

  return replaced
    .replace(/async function\(/g, 'async function (')
}
