# MySQL Migration Guide

## When to Migrate

When you're ready to switch from SQLite to MySQL for production:

## Steps

### 1. Install MySQL Dependencies

```bash
npm install mysql2
```

### 2. Update Environment Variables

Create or update your `.env` file:

```env
PORT=3000
NODE_ENV=production
DB_DIALECT=mysql
DB_HOST=your-mysql-host
DB_PORT=3306
DB_NAME=recruit_db
DB_USER=your-username
DB_PASSWORD=your-password
MYSQL_ENABLED=true
```

### 3. Update database.js (Optional - already configured)

The `src/config/database.js` is already configured to use `dbConfig.js` which supports both SQLite and MySQL.

### 4. Run the Application

```bash
npm start
```

The Sequelize ORM will automatically create tables in MySQL based on your models.

### 5. Data Migration (Existing Data)

For existing SQLite data, you can:

1. Export data from SQLite using a tool like `sqlite3`
2. Import into MySQL using `mysql` CLI or a migration tool
3. Or use Sequelize's migration feature for more complex scenarios

## Notes

- Ensure MySQL is running before starting the application
- Create an empty database `recruit_db` in MySQL before first run
- All timestamps will be automatically managed by Sequelize
