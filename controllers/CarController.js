class CarController {
    constructor() {
        this.carModel = new CarModel();
        this.favoriteModel = new FavoriteModel();
        this.carView = null;
    }

    setView(view) {
        this.carView = view;
    }

    async loadCars() {
        const cars = await this.carModel.getAllCars();
        return cars;
    }
    
    // Добавлен метод getAllCars для совместимости
    async getAllCars() {
        return await this.carModel.getAllCars();
    }

    async filterCars(filters) {
        let cars = await this.carModel.getAllCars();
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            cars = cars.filter(car => {
                const brand = (car.brand || '').toLowerCase();
                const model = (car.model || '').toLowerCase();
                return brand.includes(searchTerm) || model.includes(searchTerm);
            });
        }

        if (filters.brand) {
            cars = cars.filter(car => car.brand === filters.brand);
        }

        if (filters.minPrice) {
            cars = cars.filter(car => car.price >= filters.minPrice);
        }

        if (filters.maxPrice) {
            cars = cars.filter(car => car.price <= filters.maxPrice);
        }

        if(filters.minPrice<0){
            return{
                message:`"Минимальная цена не должна быть меньше 0"`
            };
        }

        if(filters.maxPrice<0){
            return{
                message:`"Максимальная цена не должна быть меньше 0"`
            };
        }

        return cars;
    }

    async toggleFavorite(carId, carName) {
        const user = new UserModel().getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not authorized', requiresLogin: true };
        }

        const isFavorite = await this.favoriteModel.checkIfFavorite(carId);
        
        if (isFavorite) {
            const result = await this.favoriteModel.removeFavorite(carId);
            return { 
                success: result.success, 
                message: `"${carName}" удален из избранного`,
                isFavorite: false 
            };
        } else {
            const result = await this.favoriteModel.addFavorite(carId);
            return { 
                success: result.success, 
                message: `"${carName}" добавлен в избранное`,
                isFavorite: true 
            };
        }
    }

    async getCarDetails(carId) {
        return await this.carModel.getCarById(carId);
    }

    async saveCar(carData, carId = null) {
        return await this.carModel.saveCar(carData, carId);
    }

    async deleteCar(carId) {
        return await this.carModel.deleteCar(carId);
    }
    
    // Добавьте эти методы для совместимости с AdminCarsView.js
    async addCar(carData) {
        return await this.carModel.saveCar(carData);
    }
    
    async updateCar(carId, carData) {
        return await this.carModel.saveCar(carData, carId);
    }
    
    // Получение локально сохраненных автомобилей
    getLocalCars() {
        try {
            const localData = localStorage.getItem('cars');
            if (localData) {
                return JSON.parse(localData);
            }
        } catch (error) {
            console.error('Ошибка получения локальных данных:', error);
        }
        return [];
    }
}