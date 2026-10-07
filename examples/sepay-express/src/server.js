import { loadConfig } from './config.js';
import { createApp } from './app.js';

try {
  const config = loadConfig();
  createApp(config).listen(config.port, config.host, () => {
    console.log(`Demo API: http://${config.host}:${config.port}`);
    console.log('Mock DB chỉ dùng test local; dữ liệu sẽ mất khi khởi động lại.');
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
