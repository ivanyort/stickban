process.argv = process.argv.filter((argument) => argument !== '--run-as-node' && argument !== '--no-sandbox')

await import('../../node_modules/vitest/vitest.mjs')
