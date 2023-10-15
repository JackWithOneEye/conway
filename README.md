# Conway's Game of Life

## TODOs

- CSS
- configurable rules
- object catalogue
- random colour mutations
- ...?

## Editor

### VS Code settings

```json
{
  "tailwindCSS.includeLanguages": {
    "ocaml": "html",
    "*.ml": "html",
    "reason": "html",
    "*.re": "html"
  },
  "tailwindCSS.experimental.classRegex": [
    ["a_class\\s+\\[ ((?:.|\n)+)\\s+\\]", "\"([^\"]+)\""],
    ["a_class\\(\\[\\s+\"([^\"]+)\",\\s+\\]\\)", "([^\\s]+)"],
    ["class_=\"([^\"]+)\"", "([^\\s]+)"]
  ],
  "css.validate": false
}
```
