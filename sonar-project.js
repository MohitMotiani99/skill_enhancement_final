const sonarqubeScanner=require('sonarqube-scanner');
sonarqubeScanner(
    {
        serverUrl:  'http://localhost:9000',
        options : {
            'sonar.sources':  '.',
            'sonar.tests':  'tests',
            'sonar.inclusions'  :  'controllers/**', // Entry point of your code
            'sonar.test.inclusions':  'tests/**',
            'sonar.javascript.lcov.reportPaths':  'coverage/lcov.info',
            'sonar.login': 'admin',
            'sonar.password': 'mohit'
        }
    }, () => {});