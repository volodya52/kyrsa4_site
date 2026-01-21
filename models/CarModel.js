class CarModel {
    async getAllCars() {
        try {
            const response = await fetch('/api/cars');
            const data = await response.json();
            return data.success ? data.cars : [];
        } catch (error) {
            console.error('Error loading cars:', error);
            return [];
        }
    }

    async getCarById(carId) {
        try {
            const response = await fetch(`/api/cars/${carId}`);
            const data = await response.json();
            return data.success ? data.car : null;
        } catch (error) {
            console.error('Error loading car details:', error);
            return null;
        }
    }

    async getAdminCars() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/admin/cars', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            return data.success ? data.cars : [];
        } catch (error) {
            console.error('Error loading admin cars:', error);
            return [];
        }
    }

    async saveCar(carData, carId = null) {
        try {
            const token = localStorage.getItem('auth_token');
            const url = carId ? `/api/admin/cars/${carId}` : '/api/admin/cars';
            const method = carId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(carData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error saving car:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async deleteCar(carId) {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/admin/cars/${carId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting car:', error);
            return { success: false, error: 'Network error' };
        }
    }
}