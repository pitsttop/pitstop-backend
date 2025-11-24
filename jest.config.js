module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/**/*.spec.ts'], // Procura por arquivos que terminem em .spec.ts
  testPathIgnorePatterns: ['\\.e2e-spec\\.ts$'],
};
