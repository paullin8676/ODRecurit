const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const migrate = async () => {
  return new Promise((resolve, reject) => {
    db.run('PRAGMA foreign_keys = OFF', (err) => {
      if (err) {
        console.error('Error disabling foreign keys:', err);
        return reject(err);
      }

      db.run('ALTER TABLE user DROP COLUMN role', (err) => {
        if (err) {
          console.error('Error dropping role column:', err);
          return reject(err);
        }

        db.run('DROP INDEX IF EXISTS idx_user_role', (err) => {
          if (err) {
            console.error('Error dropping index:', err);
            return reject(err);
          }

          db.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) {
              console.error('Error enabling foreign keys:', err);
              return reject(err);
            }

            console.log('Migration completed successfully: removed role column from user table');
            resolve();
          });
        });
      });
    });
  });
};

migrate()
  .then(() => {
    db.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    db.close();
    process.exit(1);
  });