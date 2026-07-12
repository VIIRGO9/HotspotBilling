// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "senetebilling-api",
      script: "./src/server.js",
      // Runs in cluster mode across all CPU cores
      instances: "max",
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
      },
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
    },
  ],
};
