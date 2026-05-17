# OD-Recruit 部署指南
> 版本: 1.1  
> 日期: 2026-05-17

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.1 | 2026-05-17 | 与项目 v3.2 版本同步更新<br>确认前后端启动命令与 package.json 配置一致 |
| 1.0 | 2026-05-01 | 初始部署指南版本 |

## 1. 系统要求

### 1.1 硬件要求

- CPU：至少 2 核
- 内存：至少 4GB
- 存储空间：至少 20GB

### 1.2 软件要求

- Node.js：v14.0 或更高版本
- npm：v6.0 或更高版本
- 浏览器：Chrome 80+、Firefox 75+、Safari 13+、Edge 80+

## 2. 部署步骤

### 2.1 克隆代码库

```bash
git clone https://github.com/your-repo/recruitment-system.git
cd recruitment-system
```

### 2.2 后端部署

1. 进入后端目录
   ```bash
   cd backend
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置环境变量
   - 复制 `.env.example` 文件为 `.env`
   - 编辑 `.env` 文件，设置以下环境变量：
     ```
     PORT=3000
     SECRET_KEY=your_secret_key_here
     ```

4. 启动后端服务
   - 开发环境：
     ```bash
     npm run dev
     ```
   - 生产环境：
     ```bash
     npm start
     ```

### 2.3 前端部署

1. 进入前端目录
   ```bash
   cd frontend
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置 API 地址
   - 创建 `.env` 文件，设置后端 API 地址：
     ```
     VITE_API_URL=http://localhost:3000/api
     ```
   - 或者在构建命令中设置：
     ```bash
     VITE_API_URL=http://your-backend-server/api npm run build
     ```

4. 构建前端项目
   ```bash
   npm run build
   ```

5. 部署前端静态文件
   - 将 `dist` 目录下的文件部署到静态文件服务器
   - 可以使用 Nginx、Apache 等服务器

### 2.4 数据库配置

本系统使用 SQLite 数据库，无需额外配置。数据库文件会在系统启动时自动创建。

## 3. 生产环境部署

### 3.1 使用 PM2 管理后端服务

1. 安装 PM2
   ```bash
   npm install -g pm2
   ```

2. 启动后端服务
   ```bash
   cd backend
   pm2 start src/app.js --name recruitment-backend
   ```

3. 查看服务状态
   ```bash
   pm2 status
   ```

4. 配置 PM2 开机自启
   ```bash
   pm2 startup
   pm2 save
   ```

### 3.2 使用 Nginx 作为反向代理

1. 安装 Nginx
   ```bash
   # Ubuntu/Debian
   apt-get install nginx
   
   # CentOS/RHEL
   yum install nginx
   ```

2. 配置 Nginx
   - 创建配置文件 `/etc/nginx/sites-available/recruitment-system`
   - 内容如下：
     ```nginx
     server {
         listen 80;
         server_name example.com;
         
         # 前端静态文件
         location / {
             root /path/to/frontend/dist;
             index index.html;
             try_files $uri $uri/ /index.html;
         }
         
         # 后端 API
         location /api {
             proxy_pass http://localhost:3000;
             proxy_http_version 1.1;
             proxy_set_header Upgrade $http_upgrade;
             proxy_set_header Connection 'upgrade';
             proxy_set_header Host $host;
             proxy_cache_bypass $http_upgrade;
         }
     }
     ```

3. 启用配置
   ```bash
   ln -s /etc/nginx/sites-available/recruitment-system /etc/nginx/sites-enabled/
   ```

4. 重启 Nginx
   ```bash
   systemctl restart nginx
   ```

## 4. 系统维护

### 4.1 数据库备份

定期备份 SQLite 数据库文件：

```bash
cp /path/to/backend/database.sqlite /path/to/backup/database_$(date +%Y%m%d).sqlite
```

### 4.2 日志管理

- 后端日志：PM2 会自动管理日志
  ```bash
  pm2 logs recruitment-backend
  ```

- Nginx 日志：位于 `/var/log/nginx/` 目录

### 4.3 系统更新

1. 拉取最新代码
   ```bash
   git pull
   ```

2. 更新后端
   ```bash
   cd backend
   npm install
   pm2 restart recruitment-backend
   ```

3. 更新前端
   ```bash
   cd frontend
   npm install
   npm run build
   # 部署新的构建文件
   ```

## 5. 故障排除

### 5.1 后端服务无法启动

- 检查端口是否被占用
  ```bash
  netstat -tulpn | grep 3000
  ```

- 检查环境变量配置
  ```bash
  cat .env
  ```

- 查看日志
  ```bash
  pm2 logs recruitment-backend
  ```

### 5.2 前端无法访问后端 API

- 检查后端服务是否运行
  ```bash
  pm2 status
  ```

- 检查 Nginx 配置
  ```bash
  nginx -t
  ```

- 检查 CORS 配置
  确保后端启用了 CORS 中间件

### 5.3 数据库连接问题

- 检查数据库文件权限
  ```bash
  ls -l database.sqlite
  ```

- 检查数据库文件是否损坏
  尝试使用 SQLite 命令行工具打开数据库
  ```bash
  sqlite3 database.sqlite
  ```

## 6. 性能优化

### 6.1 后端优化

- 使用 PM2 集群模式
  ```bash
  pm2 start src/app.js --name recruitment-backend -i max
  ```

- 启用缓存
  对于频繁访问的数据，可以使用 Redis 缓存

### 6.2 前端优化

- 启用 CDN 加速静态文件
- 优化图片资源
- 使用代码分割

### 6.3 数据库优化

- 定期清理过期数据
- 对于大型系统，考虑迁移到 MySQL 或 PostgreSQL

## 7. 安全配置

### 7.1 后端安全

- 设置强密码策略
- 启用 HTTPS
- 定期更新依赖包
- 实施访问控制

### 7.2 前端安全

- 防止 XSS 攻击
- 防止 CSRF 攻击
- 验证用户输入

### 7.3 服务器安全

- 配置防火墙
- 禁用不必要的服务
- 定期更新系统

## 8. 监控与告警

### 8.1 系统监控

- 使用 PM2 监控后端服务
- 使用 Nginx 监控前端访问
- 使用系统监控工具监控服务器状态

### 8.2 告警配置

- 配置邮件告警
- 配置短信告警
- 配置监控面板

## 9. 部署检查清单

- [ ] 系统要求满足
- [ ] 代码库克隆完成
- [ ] 后端依赖安装完成
- [ ] 前端依赖安装完成
- [ ] 环境变量配置完成
- [ ] 后端服务启动成功
- [ ] 前端构建完成
- [ ] 静态文件部署完成
- [ ] Nginx 配置完成
- [ ] 系统测试通过
- [ ] 数据库备份配置完成
- [ ] 监控与告警配置完成

## 10. 常见问题

### 10.1 端口被占用

- 检查并停止占用端口的进程
  ```bash
  lsof -i :3000
  kill -9 <PID>
  ```

### 10.2 权限问题

- 确保文件和目录权限正确
  ```bash
  chmod -R 755 /path/to/project
  ```

### 10.3 依赖安装失败

- 检查网络连接
- 清理 npm 缓存
  ```bash
  npm cache clean --force
  ```

### 10.4 构建失败

- 检查 Node.js 版本
  ```bash
  node -v
  ```
- 检查依赖版本兼容性