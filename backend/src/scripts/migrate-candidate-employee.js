const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

console.log('Starting migration...');

db.serialize(() => {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Employee'", (err, row) => {
    if (err) {
      console.error('Error checking Employee table:', err);
      process.exit(1);
    }

    if (!row) {
      console.log('Creating Employee table...');
      db.run(`
        CREATE TABLE Employee (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100),
          phone VARCHAR(20),
          gender VARCHAR(10),
          id_card VARCHAR(20),
          last_operator_id INTEGER,
          current_stage VARCHAR(50) DEFAULT 'pending_onboarding',
          entry_date DATETIME,
          entry_remark TEXT,
          leave_date DATETIME,
          leave_type VARCHAR(20),
          leave_remark TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (last_operator_id) REFERENCES User(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating Employee table:', err);
          process.exit(1);
        }
        console.log('Employee table created successfully');
        modifyCandidateTable();
      });
    } else {
      console.log('Employee table already exists');
      modifyCandidateTable();
    }
  });
});

function modifyCandidateTable() {
  console.log('\nModifying Candidate table...');

  db.all("PRAGMA table_info(Candidate)", (err, columns) => {
    if (err) {
      console.error('Error getting Candidate table info:', err);
      process.exit(1);
    }

    const columnNames = columns.map(col => col.name);
    console.log('Current Candidate columns:', columnNames);

    const columnsToDrop = ['entry_date', 'entry_remark', 'leave_date', 'leave_reason', 'leave_remark'];
    const existingColumnsToDrop = columnsToDrop.filter(col => columnNames.includes(col));

    if (existingColumnsToDrop.length === 0) {
      console.log('No columns to drop from Candidate table');
      verifyAndFinish();
      return;
    }

    console.log('Dropping columns:', existingColumnsToDrop);

    db.run('DROP TABLE IF EXISTS Candidate_new', (err) => {
      if (err) {
        console.error('Error dropping Candidate_new table:', err);
        process.exit(1);
      }

      db.run(`
        CREATE TABLE Candidate_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100),
          phone VARCHAR(20),
          gender VARCHAR(10),
          id_card VARCHAR(20),
          last_operator_id INTEGER,
          current_stage VARCHAR(50) DEFAULT 'candidate_entry',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (last_operator_id) REFERENCES User(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating Candidate_new table:', err);
          process.exit(1);
        }

        db.run(`
          INSERT INTO Candidate_new (id, name, email, phone, gender, id_card, last_operator_id, current_stage, created_at, updated_at)
          SELECT id, name, email, phone, gender, id_card, last_operator_id, COALESCE(current_stage, 'candidate_entry'), created_at, updated_at
          FROM Candidate
        `, (err) => {
          if (err) {
            console.error('Error copying data to Candidate_new:', err);
            process.exit(1);
          }

          db.run('DROP TABLE Candidate', (err) => {
            if (err) {
              console.error('Error dropping old Candidate table:', err);
              process.exit(1);
            }

            db.run('ALTER TABLE Candidate_new RENAME TO Candidate', (err) => {
              if (err) {
                console.error('Error renaming Candidate_new to Candidate:', err);
                process.exit(1);
              }

              console.log('Candidate table modified successfully');
              verifyAndFinish();
            });
          });
        });
      });
    });
  });
}

function verifyAndFinish() {
  console.log('\nVerifying changes...');

  db.all("PRAGMA table_info(Candidate)", (err, columns) => {
    if (err) {
      console.error('Error getting Candidate columns:', err);
      process.exit(1);
    }
    console.log('Candidate columns:', columns.map(c => c.name));

    db.all("PRAGMA table_info(Employee)", (err, columns) => {
      if (err) {
        console.error('Error getting Employee columns:', err);
        process.exit(1);
      }
      console.log('Employee columns:', columns.map(c => c.name));

      console.log('\nMigration completed successfully!');
      db.close();
    });
  });
}