import express, { Router } from "express"
import ErrorHandler from "../helper"
import { check } from "express-validator"
import ProductController from "../controllers/productController"
import Authenticator from "./auth"
import seedController from "../controllers/seeder"
import { Category } from "../components/product"


/**
 * Represents a class that defines the routes for handling proposals.
 */
class ProductRoutes {
    private controller: ProductController
    private router: Router
    private errorHandler: ErrorHandler
    private authenticator: Authenticator
    private seed: seedController
    

    /**
     * Constructs a new instance of the ProductRoutes class.
     * @param {Authenticator} authenticator - The authenticator object used for authentication.
     */
    constructor(authenticator: Authenticator) {
        this.authenticator = authenticator
        this.controller = new ProductController()
        this.router = express.Router()
        this.errorHandler = new ErrorHandler()
        this.seed= new seedController()
        this.initRoutes()
    }

    /**
     * Returns the router instance.
     * @returns The router instance.
     */
    getRouter(): Router {
        return this.router
    }

    /**
     * Initializes the routes for the product router.
     * 
     * @remarks
     * This method sets up the HTTP routes for handling product-related operations such as registering products, registering arrivals, selling products, retrieving products, and deleting products.
     * It can (and should!) apply authentication, authorization, and validation middlewares to protect the routes.
     * 
     */
    initRoutes() {

        const checkModel = check("model").isString().isLength({min : 1}).withMessage("model must be a non-empty string")
        const checkCategory = check("category").isIn(["Smartphone", "Laptop", "Appliance"]).withMessage("Category must be one of *Smartphone*, *Laptop* or *Category*")
        const checkQuantity = check("quantity").isInt({min: 1}).withMessage("quantity must be an ineger greater than 0")
        const checkDetails = check("details").isString().withMessage("details must be a string")
        const checkSellingPrice = check("sellingPrice").isFloat({min : 0.01}).withMessage("quantity must be a number grater than 0")
        const dateFormat = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
        const checkDate = check("arrivalDate").custom((value: any)=>{
            if (value == null) return Promise.resolve();
            if (!dateFormat.test(value)) return Promise.reject("date format must be YYYY-MM-DD")
            const now = new Date();
            if (now < new Date(value)) return Promise.reject("date must be before the current date")
            if( isNaN(new Date(value).getTime())) return Promise.reject("date must be valid")
            return Promise.resolve();
        })
        const checkSellingDate = check("sellingDate").custom((value: any)=>{
            if (value == null) return Promise.resolve();
            if (!dateFormat.test(value)) return Promise.reject("date format must be YYYY-MM-DD")
            const now = new Date();
            if (now < new Date(value)) return Promise.reject("date must be before the current date")
            if( isNaN(new Date(value).getTime())) return Promise.reject("date must be valid")
            return Promise.resolve();
        })
        const checkChangeDate = check("changeDate").custom((value: any)=>{
            if (value == null) return Promise.resolve();
            if (!dateFormat.test(value)) return Promise.reject("date format must be YYYY-MM-DD")
            const now = new Date();
            if (now < new Date(value)) return Promise.reject("date must be before the current date")
            if( isNaN(new Date(value).getTime())) return Promise.reject("date must be valid")
            return Promise.resolve();
        })
        const checkGrouping = check("grouping").custom((grouping, {req, path})=>{
            const category = req.query.category;
            const model = req.query.model;
            if ((grouping == undefined)){
                if(category == undefined && model == undefined){return Promise.resolve()}
                else return Promise.reject("if grouping is empty, so should be category and model")
            }
            if (grouping=="category"){
                if((category==Category.SMARTPHONE || category==Category.APPLIANCE || category == Category.LAPTOP)&&model==undefined)return Promise.resolve()
                else return Promise.reject("if grouping is = category, category should be specified and model should not")
            }
            if (grouping=="model"){
                if(model!=""&&model!=null&&model!=undefined&&category==undefined)return Promise.resolve()
                else return Promise.reject("if grouping is = model, model should be specified and category should not")
            }
            return Promise.reject("grouping should be one among empty, category or model");
        })
        const handleValidation = (req: any, res: any, next: any) => this.errorHandler.validateRequest(req, res, next);

        /**
         * Route for registering the arrival of a set of products.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It requires the following parameters:
         * - model: string. It cannot be empty and it cannot be repeated in the database.
         * - category: string (one of "Smartphone", "Laptop", "Appliance")
         * - quantity: number. It must be greater than 0.
         * - details: string. It can be empty.
         * - sellingPrice: number. It must be greater than 0.
         * - arrivalDate: string. It can be omitted. If present, it must be a valid date in the format YYYY-MM-DD that is not after the current date
         * It returns a 200 status code if the arrival was registered successfully.
         */
        this.router.post(
            "/",
            [
                this.authenticator.isLoggedIn,
                this.authenticator.isAdminOrManager,
                checkModel,
                checkCategory,
                checkQuantity,
                checkDetails,
                checkSellingPrice,
                checkDate,
                handleValidation
            ],
            (req: any, res: any, next: any) => this.controller.registerProducts(req.body.model, req.body.category, req.body.quantity, req.body.details, req.body.sellingPrice, req.body.arrivalDate? req.body.arrivalDate : new Date().toISOString().split("T")[0])
                .then(() => res.status(200).end())
                .catch((err) => next(err))
        )

        /**
         * Route for registering the increase in quantity of a product.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It requires the product model as a request parameter. The model must be a string and cannot be empty, and it must represent an existing product.
         * It requires the following body parameters:
         * - quantity: number. It must be greater than 0. This number represents the increase in quantity, to be added to the existing quantity.
         * - changeDate: string. It can be omitted. If present, it must be a valid date in the format YYYY-MM-DD that is not after the current date and is after the arrival date of the product.
         * It returns the new quantity of the product.
         */
        this.router.patch(
            "/:model",
            [
                this.authenticator.isLoggedIn,
                this.authenticator.isAdminOrManager,
                checkQuantity,
                checkChangeDate,
                handleValidation
            ],
            (req: any, res: any, next: any) => this.controller.changeProductQuantity(req.params.model, req.body.quantity, req.body.changeDate)
                .then((quantity: any /**number */) => res.status(200).json({ quantity: quantity }))
                .catch((err) =>{ 
                    console.log(err)
                    res.status(err.status? err.status : 500)
                    next(err)
                })
        )

/*         this.router.get(
            "/seed",
            (req: any, res: any, next: any) => this.seed.seedProducts()
                .then(()=> res.status(200).end()) 
                .catch((err => console.log(err)))
        ) */

        /**
         * Route for selling a product.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It requires the product model as a request parameter. The model must be a string and cannot be empty, and it must represent an existing product.
         * It requires the following body parameters:
         * - quantity: number. It must be greater than 0. This number represents the quantity of units sold. It must be less than or equal to the available quantity of the product.
         * It returns the new quantity of the product.
         */
        this.router.patch(
            "/:model/sell",
            [
                this.authenticator.isLoggedIn,
                this.authenticator.isAdminOrManager,
                checkQuantity,
                checkSellingDate,
                handleValidation
            ],
            (req: any, res: any, next: any) => this.controller.sellProduct(req.params.model, req.body.quantity, req.body.sellingDate)
                .then((quantity: any /**number */) => res.status(200).json({ quantity: quantity }))
                .catch((err) => {
                    next(err)
                })
        )

        /**
         * Route for retrieving all products.
         * It requires the user to be logged in and to be either an admin or a manager
         * It can have the following optional query parameters:
         * - grouping: string. It can be either "category" or "model". If absent, then all products are returned and the other query parameters must also be absent.
         * - category: string. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
         * - model: string. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
         * It returns an array of Product objects.
         */
        this.router.get(
            "/",
            [
                this.authenticator.isLoggedIn,
                this.authenticator.isAdminOrManager,
                checkGrouping,
                handleValidation
            ],
            (req: any, res: any, next: any) => this.controller.getProducts(req.query.grouping, req.query.category, req.query.model)
                .then((products: any /*Product[]*/) => res.status(200).json(products))
                .catch((err) => {
                    next(err)
                })
        )

        /**
         * Route for retrieving all available products.
         * It requires the user to be logged in.
         * It can have the following optional query parameters:
         * - grouping: string. It can be either "category" or "model". If absent, then all products are returned and the other query parameters must also be absent.
         * - category: string. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
         * - model: string. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
         * It returns an array of Product objects.
         */
        this.router.get(
            "/available",
            [
                this.authenticator.isLoggedIn,
                checkGrouping,
                handleValidation
            ],
            (req: any, res: any, next: any) => this.controller.getAvailableProducts(req.query.grouping, req.query.category, req.query.model)
                .then((products: any/*Product[]*/) => res.status(200).json(products))
                .catch((err) => next(err))
        )

        /**
         * Route for deleting all products.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/",
            [
                this.authenticator.isLoggedIn,
                this.authenticator.isAdminOrManager,
            ],
            (req: any, res: any, next: any) => this.controller.deleteAllProducts()
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )

        /**
         * Route for deleting a product.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It requires the product model as a request parameter. The model must be a string and cannot be empty, and it must represent an existing product.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/:model",
            [
                this.authenticator.isLoggedIn,
                this.authenticator.isAdminOrManager,
            ],
            (req: any, res: any, next: any) => this.controller.deleteProduct(req.params.model)
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )


    }
}

export default ProductRoutes