class FavoriteController {
    constructor() {
        this.favoriteModel = new FavoriteModel();
    }

    async getFavorites() {
        return await this.favoriteModel.getUserFavorites();
    }

    async addFavorite(carId) {
        return await this.favoriteModel.addFavorite(carId);
    }

    async removeFavorite(carId) {
        return await this.favoriteModel.removeFavorite(carId);
    }

    async checkFavorite(carId) {
        return await this.favoriteModel.checkIfFavorite(carId);
    }
}