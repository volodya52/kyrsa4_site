const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('../database.js'); // Импортируем нашу базу данных

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '.'))); 
app.use('/view', express.static(path.join(__dirname, '../view')));

// Простое хранилище сессий (в памяти)
const sessions = {};

// Генерация токена
function generateToken(userId) {
    return 'token_' + userId + '_' + Date.now();
}

// Middleware для проверки авторизации
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token || !sessions[token]) {
        return res.status(401).json({ 
            success: false, 
            error: 'Требуется авторизация' 
        });
    }
    
    req.user = sessions[token].user;
    req.token = token;
    next();
}

// Middleware для проверки администратора
function requireAdmin(req, res, next) {
    if (!req.user || req.user.Role_Name !== 'Администратор') {
        return res.status(403).json({ 
            success: false, 
            error: 'Требуются права администратора' 
        });
    }
    next();
}

// ==================== API ЭНДПОИНТЫ ====================

// 1. РЕГИСТРАЦИЯ И АВТОРИЗАЦИЯ
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Валидация
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Имя, email и пароль обязательны' 
            });
        }

        // Проверка существования пользователя
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                error: 'Пользователь с таким email уже существует' 
            });
        }

        // Создание пользователя (по умолчанию роль "Клиент" - ID=2)
        const result = await db.addUser(name, email, password, phone, 2);
        
        if (!result.success) {
            return res.status(400).json({ 
                success: false, 
                error: result.error 
            });
        }

        // Получаем созданного пользователя
        const user = await db.findUserById(result.id);
        
        // Создаем сессию
        const token = generateToken(user.ID);
        sessions[token] = { user, createdAt: new Date() };

        res.status(201).json({
            success: true,
            message: 'Регистрация успешна',
            user: {
                id: user.ID,
                name: user.Name,
                email: user.Email,
                phone: user.Phone,
                role: user.Role_Name
            },
            token
        });

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Валидация
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email и пароль обязательны' 
            });
        }

        // Поиск пользователя
        const user = await db.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Неверный email или пароль' 
            });
        }

        // Проверка пароля (в реальном проекте нужно хешировать!)
        if (user.Password !== password) {
            return res.status(401).json({ 
                success: false, 
                error: 'Неверный email или пароль' 
            });
        }

        // Создаем сессию
        const token = generateToken(user.ID);
        sessions[token] = { user, createdAt: new Date() };

        res.json({
            success: true,
            message: 'Авторизация успешна',
            user: {
                id: user.ID,
                name: user.Name,
                email: user.Email,
                phone: user.Phone,
                role: user.Role_Name
            },
            token
        });

    } catch (error) {
        console.error('Ошибка авторизации:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
});

// 2. АВТОМОБИЛИ
app.get('/api/cars', async (req, res) => {
    try {
        const filters = {
            brand: req.query.brand,
            model: req.query.model,
            minYear: req.query.minYear,
            maxYear: req.query.maxYear,
            minPrice: req.query.minPrice,
            maxPrice: req.query.maxPrice,
            body: req.query.body
        };

        const cars = await db.searchCars(filters);
        
        res.json({
            success: true,
            cars: cars.map(car => ({
                id: car.ID,
                brand: car.Brand,
                model: car.Model,
                year: car.Year,
                price: car.Price,
                mileage: car.Mileage,
                engineSize: car.EngineSize,
                horsepower: car.Horsepower,
                transmission: car.Transmission,
                fuel: car.Fuel,
                body: car.Body,
                color: car.Color,
                description: car.Description,
                status: car.Status,
                image_url: car.Image_url,
            }))
        });
    } catch (error) {
        console.error('Ошибка получения автомобилей:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
});

app.get('/api/cars/:id', async (req, res) => {
    try {
        const car = await db.getCarById(parseInt(req.params.id));
        
        if (!car) {
            return res.status(404).json({ 
                success: false, 
                error: 'Автомобиль не найден' 
            });
        }
        
        res.json({
            success: true,
            car: {
                id: car.ID,
                brand: car.Brand,
                model: car.Model,
                year: car.Year,
                price: car.Price,
                mileage: car.Mileage,
                engineSize: car.EngineSize,
                horsepower: car.Horsepower,
                transmission: car.Transmission,
                fuel: car.Fuel,
                body: car.Body,
                color: car.Color,
                description: car.Description,
                status: car.Status,
                image_url: car.Image_url,
            }
        });
    } catch (error) {
        console.error('Ошибка получения автомобиля:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
});

// 3. TRADE-IN ЗАЯВКИ
app.post('/api/trade-in', requireAuth, async (req, res) => {
    try {
        const { car_id, brand, model, year, mileage, estimated_price, condition, phone } = req.body;

        if (!brand || !model || !year || !mileage || !condition || !phone) {
            return res.status(400).json({ 
                success: false, 
                error: 'Заполните обязательные поля' 
            });
        }

        const tradeInData = {
            userId: req.user.ID,
            carId: car_id || null,
            brand,
            model,
            year: parseInt(year),
            mileage: parseInt(mileage),
            estimated_price: estimated_price ? parseInt(estimated_price) : null,
            condition,
            phone
        };

        const result = await db.createTradeIn(tradeInData);

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Заявка на Trade-In создана',
                id: result.id
            });
        } else {
            res.status(400).json({ 
                success: false, 
                error: result.error 
            });
        }

    } catch (error) {
        console.error('Ошибка создания заявки Trade-In:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
});

app.get('/api/trade-in/my', requireAuth, async (req, res) => {
    try {
        const tradeIns = await db.getUserTradeIns(req.user.ID);
        
        res.json({
            success: true,
            tradeIns: tradeIns.map(t => ({
                id: t.ID,
                brand: t.Brand,
                model: t.Model,
                year: t.Year,
                mileage: t.Mileage,
                estimated_price: t.Estimated_price,
                condition: t.Condition,
                phone: t.Phone,
                status: t.Status,
                car_brand: t.Car_Brand,
                car_model: t.Car_Model
            }))
        });
    } catch (error) {
        console.error('Ошибка получения заявок:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
});

// 4. НОВОСТИ И АКЦИИ
app.get('/api/news', async (req, res) => {
    try {
        const news = await db.getAllNews();
        
        res.json({
            success: true,
            news: news.map(n => ({
                id: n.ID,
                title: n.Title,
                description: n.Description,
                type: n.Type,
                author_name: n.Author_Name,
                car_brand: n.Car_Brand,
                car_model: n.Car_Model,
                image_url: n.Image_url,
            }))
        });
    } catch (error) {
        console.error('Ошибка получения новостей:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
});

app.get('/api/news/:type', async (req, res) => {
    try {
        const type = req.params.type;
        const news = await db.getNewsByType(type);
        
        res.json({
            success: true,
            news: news.map(n => ({
                id: n.ID,
                title: n.Title,
                description: n.Description,
                type: n.Type,
                author_name: n.Author_Name,
                image_url: n.Image_url,
            }))
        });
    } catch (error) {
        console.error('Ошибка получения новостей по типу:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
});

// 5. ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
app.get('/api/user', requireAuth, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user.ID,
                name: req.user.Name,
                email: req.user.Email,
                phone: req.user.Phone,
                role: req.user.Role_Name
            }
        });
    } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
});

app.post('/api/logout', requireAuth, (req, res) => {
    delete sessions[req.token];
    res.json({ success: true, message: 'Выход выполнен' });
});

// 6. АДМИНИСТРАТИВНЫЕ ФУНКЦИИ (только для администраторов)
app.get('/api/admin/trade-ins', requireAuth, requireAdmin, async (req, res) => {
    try {
        const tradeIns = await db.getAllTradeIns();
        
        res.json({
            success: true,
            tradeIns: tradeIns.map(t => ({
                id: t.ID,
                user_name: t.User_Name,
                user_email: t.User_Email,
                brand: t.Brand,
                model: t.Model,
                year: t.Year,
                mileage: t.Mileage,
                estimated_price: t.Estimated_price,
                condition: t.Condition,
                phone: t.Phone,
                status: t.Status,
                created_at: t.Created_At,
                car_brand: t.Car_Brand,
                car_model: t.Car_Model
            }))
        });
    } catch (error) {
        console.error('Ошибка получения всех заявок:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
});

app.put('/api/admin/trade-ins/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const id = parseInt(req.params.id);
        
        if (!['В ожидании', 'Одобрено', 'Отклонено', 'Завершено'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Некорректный статус' 
            });
        }
        
        const result = await db.updateTradeInStatus(id, status);
        
        res.json({
            success: true,
            message: `Статус заявки обновлен на "${status}"`
        });
    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера' 
        });
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log('=======================================');
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('=======================================');

});