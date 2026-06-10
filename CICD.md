## Github Pages sem Actions

```yml
npm run build
npx gh-pages -d dist
```

## Github Pages com Actions

```yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:
  ...resto do arquivo...
```
