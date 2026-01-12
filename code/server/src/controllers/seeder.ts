import UserDAO from "../dao/userDAO"
import CartDAO from "../dao/cartDAO"
import ReviewDAO from "../dao/reviewDAO"
import ProductDAO from "../dao/productDAO"
import SeederDAO from "../dao/seederDAO"

class seedController {
    private user_dao: UserDAO
    private cart_dao: CartDAO
    private review_dao: ReviewDAO
    private product_dao: ProductDAO
    private seeder_dao: SeederDAO

    constructor() {
        this.user_dao = new UserDAO
        this.cart_dao= new CartDAO
        this.review_dao= new ReviewDAO
        this.product_dao= new ProductDAO
        this.seeder_dao= new SeederDAO
    }

    async seedDatabase(){
        try {
            await this.seedUsers();
            await this.seedProducts();
            await this.seedCarts();
            await this.seedReviews();
            return;
        } catch (error) {
            console.error('Errore nel riempimento del db', error);
        }
    }

    async seedUsers(){
        try {
            await this.user_dao.createUser("erikaa", "Erika", "Giallo", "Prova", "Customer");
            await this.user_dao.createUser("agnesee", "Agnese", "Verde", "Prova", "Customer");
            await this.user_dao.createUser("riccardoo", "Riccardo", "Blu", "Prova", "Manager");
            await this.user_dao.createUser("emanuelee", "Emanuele", "Viola", "Prova", "Manager");
            await this.user_dao.createUser("lucaa", "Luca", "Rosso", "Prova", "Admin");
            await this.user_dao.createUser("lauraa", "Laura", "Arancione", "Prova", "Admin");

            await this.seeder_dao.updateUserSeeder("Erika", "Giallo", "Via 1", "1998-01-01","erikaa");
            await this.seeder_dao.updateUserSeeder("Riccardo", "Blu", "Via 2", "1999-02-02", "riccardoo");
            await this.seeder_dao.updateUserSeeder("Luca", "Rosso", "Piazza 3", "2000-03-03", "lucaa");
            return;
        }catch(error){
            console.error('Errore nel riempimento degli utenti', error);
            return;
        }
    }


    async seedProducts(){
        try {
            await this.product_dao.registerProduct("Samsung v11", "Smartphone", 100.10, null, 10, '2023-05-01');
            await this.product_dao.registerProduct("Huawei v20", "Smartphone", 200.20, "modello 2020", 20, null);
            await this.product_dao.registerProduct("Hp v10", "Laptop", 300.00, null, 50, '2023-05-01');
            await this.product_dao.registerProduct("Asus v11", "Laptop", 400.00, "modello 2020", 1, '2023-02-18');
            await this.product_dao.registerProduct("Lg v1", "Appliance", 500.50, "modello 2019", 30, '2023-06-02');
            await this.product_dao.registerProduct("Sony v2", "Appliance", 600.60, "modello 2020", 40, null);
            return;
        }catch(error){
            console.error('Errore nel riempimento dei prodotti', error);
        }
    }

    async seedCarts(){
        try {
            await this.cart_dao.addProductToCart('erikaa', 'Samsung v11'); //pagato
            await this.cart_dao.payCurrentCart("erikaa", "2022-05-28");

            await this.cart_dao.addProductToCart('erikaa', 'Hp v10'); //pagato
            await this.cart_dao.addProductToCart('erikaa', 'Huawei v20'); 
            await this.cart_dao.payCurrentCart("erikaa", "2023-05-28");

            await this.cart_dao.addProductToCart('erikaa', 'Lg v1'); //da pagare
            await this.cart_dao.addProductToCart('erikaa', 'Lg v1');

            await this.cart_dao.addProductToCart('agnesee', 'Hp v10'); //pagato
            await this.cart_dao.addProductToCart('agnesee', 'Hp v10');
            await this.cart_dao.payCurrentCart('agnesee', "2024-05-28");

            await this.cart_dao.addProductToCart('agnesee', 'Hp v10'); //da pagare
            return;
        }catch(error){
            console.error('Errore nel riempimento dei carrelli', error);
        }
    }

    async seedReviews(){
        try {
            await this.review_dao.createReview('Huawei v20', 'erikaa', 5, '2023-05-20', 'Amazing!');
            await this.review_dao.createReview('Lg v1', 'erikaa', 4, '2023-05-21', 'Good value for money');
            await this.review_dao.createReview('Hp v10', 'agnesee', 3, '2023-06-10', 'Could be better');
            await this.review_dao.createReview('Sony v2', 'agnesee', 2, '2023-06-10', 'It\'s not ok');
            return;
        }catch(error){
            console.error('Errore nel riempimento delle reviews', error);
        }
    }

    async deleteDB(){
        try{
            await this.user_dao.deleteAllUsers();
            await this.product_dao.deleteProducts();
            await this.cart_dao.deleteAllCarts();
            await this.review_dao.deleteAllReviews();
            return;
        }catch(error){
            console.error('Errore nella cancellazione del db', error);
        }
    }

}

export default seedController;