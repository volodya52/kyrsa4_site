const Database = require('sqlite3');

class DatabaseCreate {
    constructor() {
        this.db = new Database.Database('autosalon.db');
        this.initDatabase();
    }

    initDatabase() {
        const createRolesTable = `
            CREATE TABLE IF NOT EXISTS Roles (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL
            )
        `;

        const createFavoritesTable = `
            CREATE TABLE IF NOT EXISTS Favorites (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            User_ID INTEGER NOT NULL,
            Car_ID INTEGER NOT NULL,
            FOREIGN KEY (User_ID) REFERENCES Users (ID) ON DELETE CASCADE,
            FOREIGN KEY (Car_ID) REFERENCES Cars (ID) ON DELETE CASCADE,
            UNIQUE(User_ID, Car_ID)
        )
        `;

        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS Users (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                Email TEXT UNIQUE NOT NULL,
                Password TEXT NOT NULL,
                Phone TEXT,
                Role_ID INTEGER DEFAULT 2,
                FOREIGN KEY (Role_ID) REFERENCES Roles (ID)
            )
        `;

        const createCarsTable = `
            CREATE TABLE IF NOT EXISTS Cars (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                Brand TEXT NOT NULL,
                Model TEXT NOT NULL,
                Year INTEGER NOT NULL,
                Price INTEGER NOT NULL,
                Mileage INTEGER NOT NULL DEFAULT 0,
                EngineSize REAL NOT NULL,
                Horsepower INTEGER NOT NULL,
                Transmission TEXT NOT NULL,
                Fuel TEXT NOT NULL,
                Body TEXT NOT NULL,
                Color TEXT NOT NULL,
                Description TEXT,
                Status TEXT DEFAULT 'В наличии',
                Image_url TEXT
            )
        `;

        const createTradeInTable = `
            CREATE TABLE IF NOT EXISTS TradeIn (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                User_ID INTEGER NOT NULL,
                Car_ID INTEGER,
                Brand TEXT NOT NULL,
                Model TEXT NOT NULL,
                Year INTEGER NOT NULL,
                Mileage INTEGER NOT NULL,
                Estimated_price INTEGER,
                Condition TEXT NOT NULL,
                Phone TEXT NOT NULL,
                Status TEXT DEFAULT 'В ожидании',
                FOREIGN KEY (User_ID) REFERENCES Users (ID) ON DELETE CASCADE,
                FOREIGN KEY (Car_ID) REFERENCES Cars(ID) ON DELETE SET NULL
            )
        `;

        const createNewsTable = `
            CREATE TABLE IF NOT EXISTS News (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                Title TEXT NOT NULL,
                Description TEXT NOT NULL,
                Type TEXT NOT NULL,
                User_ID INTEGER,
                Car_ID INTEGER,
                Image_url TEXT
            )
        `;

        const tables = [
            createRolesTable,
            createUsersTable,
            createCarsTable,
            createTradeInTable,
            createNewsTable,
            createFavoritesTable
        ];

        tables.forEach((sql, index) => {
            this.db.run(sql, (err) => {
                if (err) {
                    console.error(`Ошибка при создании таблицы ${index + 1}:`, err.message);
                }
            });
        });

        this.addRoles();
        this.addAdminUser();
        console.log('База данных инициализирована');
    }

    addRoles() {
        const roles = [
            { name: 'Администратор' },
            { name: 'Клиент' }
        ];

        roles.forEach(role => {
            this.db.run(
                'INSERT OR IGNORE INTO Roles (Name) VALUES (?)',
                [role.name],
                (err) => {
                    if (err) {
                        console.error(`Ошибка при добавлении роли ${role.name}:`, err.message);
                    }
                }
            );
        });
    }

    addAdminUser() {
        this.db.get(
            'SELECT COUNT(*) as count FROM Users WHERE Email = ?',
            ['admin@autosalon.ru'],
            (err, row) => {
                if (err) {
                    console.error('Ошибка при проверке админа:', err.message);
                    return;
                }

                if (row.count === 0) {
                    this.db.run(
                        `INSERT INTO Users (Name, Email, Password, Phone, Role_ID) VALUES (?, ?, ?, ?, ?)`,
                        ['Администратор', 'admin@autosalon.ru', 'admin123', '79126865144', 1],
                        (err) => {
                            if (err) {
                                console.error('Ошибка при создании администратора:', err.message);
                            } else {
                                console.log('Администратор создан: admin@autosalon.ru/admin123');
                            }
                        }
                    );
                }
            }
        );
    }

    addToFavorites(userId, carId) {
    return new Promise((resolve, reject) => {
        this.db.run(
            'INSERT OR IGNORE INTO Favorites (User_ID, Car_ID) VALUES (?, ?)',
            [userId, carId],
            function(err) {
                if (err) {
                    reject({ success: false, error: err.message });
                } else {
                    resolve({ 
                        success: true, 
                        id: this.lastID,
                        changes: this.changes 
                    });
                }
            }
        );
    });
}

    removeFromFavorites(userId, carId) {
    return new Promise((resolve, reject) => {
        this.db.run(
            'DELETE FROM Favorites WHERE User_ID = ? AND Car_ID = ?',
            [userId, carId],
            function(err) {
                if (err) {
                    reject({ success: false, error: err.message });
                } else {
                    resolve({ 
                        success: true, 
                        changes: this.changes 
                    });
                }
            }
        );
    });
}


isCarInFavorites(userId, carId) {
    return new Promise((resolve, reject) => {
        this.db.get(
            'SELECT 1 FROM Favorites WHERE User_ID = ? AND Car_ID = ?',
            [userId, carId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(!!row);
                }
            }
        );
    });
}

    getUserFavorites(userId) {
    return new Promise((resolve, reject) => {
        this.db.all(
            `SELECT c.* 
             FROM Cars c
             INNER JOIN Favorites f ON c.ID = f.Car_ID
             WHERE f.User_ID = ?
             ORDER BY c.ID DESC`,
            [userId],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            }
        );
    });
}

    addUser(name, email, password, phone = null, roleId = 2) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO Users (Name, Email, Password, Phone, Role_ID) VALUES (?, ?, ?, ?, ?)`,
                [name, email, password, phone, roleId],
                function(err) {
                    if (err) {
                        if (err.code === 'SQLITE_CONSTRAINT') {
                            reject({ success: false, error: 'Пользователь с таким email уже существует' });
                        } else {
                            reject({ success: false, error: err.message });
                        }
                    } else {
                        resolve({ success: true, id: this.lastID });
                    }
                }
            );
        });
    }

    findUserByEmail(email) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT u.*, r.Name as Role_Name 
                 FROM Users u 
                 LEFT JOIN Roles r ON u.Role_ID = r.ID 
                 WHERE u.Email = ?`,
                [email],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row || null);
                    }
                }
            );
        });
    }

    findUserById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT u.*, r.Name as Role_Name 
                 FROM Users u 
                 LEFT JOIN Roles r ON u.Role_ID = r.ID 
                 WHERE u.ID = ?`,
                [id],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row || null);
                    }
                }
            );
        });
    }

    getAllUsers() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT u.*, r.Name as Role_Name 
                 FROM Users u 
                 LEFT JOIN Roles r ON u.Role_ID = r.ID 
                 ORDER BY u.ID`,
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    updateUser(id, userData) {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];
            
            if (userData.name) {
                fields.push('Name = ?');
                values.push(userData.name);
            }
            
            if (userData.email) {
                fields.push('Email = ?');
                values.push(userData.email);
            }
            
            if (userData.phone !== undefined) {
                fields.push('Phone = ?');
                values.push(userData.phone);
            }
            
            if (userData.password) {
                fields.push('Password = ?');
                values.push(userData.password);
            }
            
            if (userData.role_id) {
                fields.push('Role_ID = ?');
                values.push(userData.role_id);
            }
            
            values.push(id);
            
            if (fields.length === 0) {
                resolve({ success: true, changes: 0 });
                return;
            }
            
            const query = `UPDATE Users SET ${fields.join(', ')} WHERE ID = ?`;
            
            this.db.run(query, values, function(err) {
                if (err) {
                    reject({ success: false, error: err.message });
                } else {
                    resolve({ success: true, changes: this.changes });
                }
            });
        });
    }

    deleteUser(id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM Users WHERE ID = ?', [id], function(err) {
                if (err) {
                    reject({ success: false, error: err.message });
                } else {
                    resolve({ success: true, changes: this.changes });
                }
            });
        });
    }

    getAllRoles() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM Roles ORDER BY ID', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    addCar(carData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO Cars (
                    Brand, Model, Year, Price, Mileage, EngineSize, Horsepower,
                    Transmission, Fuel, Body, Color, Description, Status, Image_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    carData.brand, carData.model, carData.year, carData.price,
                    carData.mileage || 0, carData.engineSize, carData.horsepower,
                    carData.transmission, carData.fuel, carData.body, carData.color,
                    carData.description || '', carData.status || 'В наличии',
                    carData.image_url || ''
                ],
                function(err) {
                    if (err) {
                        reject({ success: false, error: err.message });
                    } else {
                        resolve({ success: true, id: this.lastID });
                    }
                }
            );
        });
    }

    getAllCars() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM Cars ORDER BY ID DESC',
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    getCarById(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM Cars WHERE ID = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    createCar(carData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO Cars (
                    Brand, Model, Year, Price, Mileage, EngineSize, Horsepower,
                    Transmission, Fuel, Body, Color, Description, Status, Image_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    carData.brand, carData.model, carData.year, carData.price,
                    carData.mileage || 0, carData.engineSize || 0, carData.horsepower || 0,
                    carData.transmission || 'Автомат', carData.fuel || 'Бензин', 
                    carData.body || 'Седан', carData.color || 'Черный',
                    carData.description || '', carData.status || 'В наличии',
                    carData.image_url || ''
                ],
                function(err) {
                    if (err) {
                        reject({ success: false, error: err.message });
                    } else {
                        resolve({ success: true, id: this.lastID });
                    }
                }
            );
        });
    }

    updateCar(carId, carData) {
        return new Promise((resolve, reject) => {
            // Получаем текущие данные автомобиля
            this.getCarById(carId).then(existingCar => {
                if (!existingCar) {
                    reject({ success: false, error: 'Автомобиль не найден' });
                    return;
                }

                // Подготавливаем данные для обновления
                const updateData = {
                    brand: carData.brand || existingCar.Brand,
                    model: carData.model || existingCar.Model,
                    year: carData.year || existingCar.Year,
                    price: carData.price || existingCar.Price,
                    mileage: carData.mileage !== undefined ? carData.mileage : existingCar.Mileage,
                    engineSize: carData.engineSize || existingCar.EngineSize,
                    horsepower: carData.horsepower || existingCar.Horsepower,
                    transmission: carData.transmission || existingCar.Transmission,
                    fuel: carData.fuel || existingCar.Fuel,
                    body: carData.body || existingCar.Body,
                    color: carData.color || existingCar.Color,
                    description: carData.description || existingCar.Description,
                    status: carData.status || existingCar.Status,
                    image_url: carData.image_url || existingCar.Image_url
                };

                // Выполняем обновление
                this.db.run(
                    `UPDATE Cars SET 
                        Brand = ?, Model = ?, Year = ?, Price = ?, Mileage = ?,
                        EngineSize = ?, Horsepower = ?, Transmission = ?, Fuel = ?,
                        Body = ?, Color = ?, Description = ?, Status = ?, Image_url = ?
                    WHERE ID = ?`,
                    [
                        updateData.brand, updateData.model, updateData.year, updateData.price,
                        updateData.mileage, updateData.engineSize, updateData.horsepower,
                        updateData.transmission, updateData.fuel, updateData.body,
                        updateData.color, updateData.description, updateData.status,
                        updateData.image_url, carId
                    ],
                    function(err) {
                        if (err) {
                            reject({ success: false, error: err.message });
                        } else {
                            resolve({ success: true, changes: this.changes });
                        }
                    }
                );
            }).catch(err => {
                reject({ success: false, error: err.message });
            });
        });
    }

    deleteCar(carId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM Cars WHERE ID = ?',
                [carId],
                function(err) {
                    if (err) {
                        reject({ success: false, error: err.message });
                    } else {
                        resolve({ success: true, changes: this.changes });
                    }
                }
            );
        });
    }

    searchCars(filters) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM Cars WHERE 1=1';
            const params = [];

            if (filters.brand) {
                query += ' AND Brand LIKE ?';
                params.push(`%${filters.brand}%`);
            }

            if (filters.model) {
                query += ' AND Model LIKE ?';
                params.push(`%${filters.model}%`);
            }

            if (filters.minYear) {
                query += ' AND Year >= ?';
                params.push(filters.minYear);
            }

            if (filters.maxYear) {
                query += ' AND Year <= ?';
                params.push(filters.maxYear);
            }

            if (filters.minPrice) {
                query += ' AND Price >= ?';
                params.push(filters.minPrice);
            }

            if (filters.maxPrice) {
                query += ' AND Price <= ?';
                params.push(filters.maxPrice);
            }

            if (filters.body) {
                query += ' AND Body = ?';
                params.push(filters.body);
            }

            //query += ' AND Status = "В наличии" ORDER BY ID DESC';

             query += ' ORDER BY ID DESC';

            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    createTradeIn(tradeInData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO TradeIn (
                    User_ID, Car_ID, Brand, Model, Year, Mileage,
                    Estimated_price, Condition, Phone
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    tradeInData.userId, tradeInData.carId || null, tradeInData.brand,
                    tradeInData.model, tradeInData.year, tradeInData.mileage,
                    tradeInData.estimated_price || null, tradeInData.condition,
                    tradeInData.phone
                ],
                function(err) {
                    if (err) {
                        reject({ success: false, error: err.message });
                    } else {
                        resolve({ success: true, id: this.lastID });
                    }
                }
            );
        });
    }

    getUserTradeIns(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT t.*, c.Brand as Car_Brand, c.Model as Car_Model
                 FROM TradeIn t
                 LEFT JOIN Cars c ON t.Car_ID = c.ID
                 WHERE t.User_ID = ?
                 ORDER BY t.ID DESC`,
                [userId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    getAllTradeIns() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT t.*, u.Name as User_Name, u.Email as User_Email,
                        c.Brand as Car_Brand, c.Model as Car_Model
                 FROM TradeIn t
                 LEFT JOIN Users u ON t.User_ID = u.ID
                 LEFT JOIN Cars c ON t.Car_ID = c.ID
                 ORDER BY t.ID DESC`,
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    updateTradeInStatus(id, status) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE TradeIn SET Status = ? WHERE ID = ?',
                [status, id],
                function(err) {
                    if (err) {
                        reject({ success: false, error: err.message });
                    } else {
                        resolve({ success: true, changes: this.changes });
                    }
                }
            );
        });
    }

    addNews(newsData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO News (Title, Description, Type, User_ID, Car_ID, Image_url)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    newsData.title, newsData.description, newsData.type,
                    newsData.userId || null, newsData.carId || null,
                    newsData.image_url || ''
                ],
                function(err) {
                    if (err) {
                        reject({ success: false, error: err.message });
                    } else {
                        resolve({ success: true, id: this.lastID });
                    }
                }
            );
        });
    }

    getAllNews() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT n.*, u.Name as Author_Name, c.Brand as Car_Brand, c.Model as Car_Model
                 FROM News n
                 LEFT JOIN Users u ON n.User_ID = u.ID
                 LEFT JOIN Cars c ON n.Car_ID = c.ID
                 ORDER BY n.ID DESC`,
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    getNewsByType(type) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT n.*, u.Name as Author_Name
                 FROM News n
                 LEFT JOIN Users u ON n.User_ID = u.ID
                 WHERE n.Type = ?
                 ORDER BY n.ID DESC`,
                [type],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    execute(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getOne(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = new DatabaseCreate();