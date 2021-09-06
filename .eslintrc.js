module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "rules": {
        "no-console": "warn",
        "no-var": "error",
        "indent": "error",
        "no-multi-spaces": "error",
        "space-in-parens": "error",
        "no-multiple-empty-lines": "error",
        "prefer-const": "error",
        "no-use-before-define": "error",
        "sonarjs/no-duplicate-string":"off",
        "sonarjs/cognitive-complexity":"off",
        "sonarjs/no-identical-functions":"off"
    
    },
    "plugins": ["sonarjs"],
    "extends": ["plugin:sonarjs/recommended"]

};
