{
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "node": "18"
      },
      "modules": "commonjs"
    }],
    "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/plugin-proposal-decorators",
    "@babel/plugin-proposal-class-properties"
  ]
}

