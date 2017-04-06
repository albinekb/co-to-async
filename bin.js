#!/usr/bin/env node
const path = require('path')
const args = require('args')
const execa = require('execa')
const confirm = require('positive')
const fsp = require('fs-promise')

args
  .option('save', 'Run transform for real')
  .option('npm', 'Force use npm instead of detected')
  .option('yarn', 'Force use yarn instead of detected')

const flags = args.parse(process.argv)

const hasYarnLock = () => fsp.exists(path.join(process.cwd(), 'yarn.lock'))

const getPackageManager = async () => {
  if (flags.npm) {
    console.log('Forcing npm')
    return 'npm'
  }
  if (flags.yarn) {
    console.log('Forcing yarn')
    return 'yarn'
  }

  if (await hasYarnLock()) {
    console.log('detected yarn.lock', 'using yarn')
    return 'yarn'
  }
  console.log(`Didn't find yarn.lock, using npm`)
  return 'npm'
}

const jscodeshift = (args = ['--help']) => {
  const child = execa(path.join(__dirname, 'node_modules', '.bin', 'jscodeshift'), args)
  const stream = child.stdout

  stream.pipe(process.stdout)

  return child
}

const transform = async (pwd, _opts) => {
  const opts = Object.assign({ dry: true }, _opts)
  const gitignore = path.join(pwd, '.gitignore')
  const args = [
    pwd + '/',
    '--transform', path.join(__dirname, 'codemod.js'),
    '--ignore-config', gitignore
  ]

  if (opts.dry) {
    args.push('--dry')
    args.push('--print')
    console.log('🐪 Running in dry mode (no changes will be made)')
    console.log('use --save to save the changes')
  } else {
    const sure = confirm('🚨 WARNING! This will edit your files, be sure to save any edited files [y/N]: ', false)

    if (!sure) {
      console.log('Exiting')
      process.exit(0)
    }

    console.log('Running 4 real 🎉')
  }

  console.log('') // pad
  console.log('') // pad
  return jscodeshift(args)
}

async function cli () {
  const folder = path.join(process.cwd())
  console.log('')
  const opts = {
    dry: !flags.save
  }

  await transform(folder, opts)
  console.log('') // pad
  console.log('') // pad
  console.log('Transform done! 🚡')

  if (flags.save) {
    console.log('Removing co from package.json...')
    const packageManager = await getPackageManager()

    console.log('Removing co dependencies using', packageManager)

    if (packageManager === 'yarn') {
      await execa(packageManager, ['remove', 'co'])
      console.log('package.json and yarn.lock updated!')
    } else if (packageManager === 'npm') {
      await execa(packageManager, ['uninstall', 'co'])
      console.log('package.json updated!')
    } else {
      throw new Error(`Unknown packageManager ${packageManager}`)
    }
  }
}

cli()
  .then(() => {
    console.log('Done 🎉')
  })
  .catch((error) => {
    console.error('Error 💀', error)
  })
