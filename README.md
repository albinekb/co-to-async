# co-to-async

# ⚠️⚠️⚠️ ARCHIVED - This tool is no longer useful, native promises have been around for a while now ;) ⚠️⚠️⚠️

## Are you using [co](github.com/tj/co)?

This CLI utility will help you convert your code to use native **async/await**

### example
Before:

```js
const fn = co.wrap(function* (val) {
  return yield Promise.resolve(val);
})

fn(true).then(function (val) {

})
```

After:
```js
const fn = async function (val) {
  return await Promise.resolve(val);
}

fn(true).then(function (val) {

})
```

## install

```sh
npm install --global co-to-async
```

## usage

Run `co-to-async` in a project folder, **this will not change any files**

When you're ready to make the changes, run `co-to-async --save`

*Get more help via `co-to-async --help`*

🎉
