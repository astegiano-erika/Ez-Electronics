import { Category } from '../../src/components/product'
import ProductController from '../../src/controllers/productController'
import Authenticator from '../../src/routers/auth'
import request from 'supertest'
import { app } from "../../index"
import { EmptyProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from '../../src/errors/productError'
import { DateError } from '../../src/utilities'

jest.mock("../../src/controllers/productController")
jest.mock("../../src/routers/auth")

const newProduct = {
    model: 'Microsoft Surface Pro 9',
    category: Category.LAPTOP,
    sellingPrice: 1199,
    details: 'Windows 11',
    quantity: 5,
    arrivalDate: '2024-06-01'
}

const products = [
    {
        model: 'Microsoft Surface Pro 9',
        category: Category.LAPTOP,
        sellingPrice: 1199,
        details: 'Windows 11',
        quantity: 0,
        arrivalDate: '2024-06-01'
    },
    {
        model: 'Xiaomi Redmi Note 9 Pro',
        category: Category.SMARTPHONE,
        sellingPrice: 220,
        details: '2020 smartphone',
        quantity: 7,
        arrivalDate: '2024-06-05'
    }
]

const smartphoneProducts = [
    {
        model: 'Xiaomi Redmi Note 9 Pro',
        category: Category.SMARTPHONE,
        sellingPrice: 220,
        details: '2020 smartphone',
        quantity: 7,
        arrivalDate: '2024-06-05'
    }
]

const laptopProducts = [
    {
        model: 'Microsoft Surface Pro 9',
        category: Category.LAPTOP,
        sellingPrice: 1199,
        details: 'Windows 11',
        quantity: 0,
        arrivalDate: '2024-06-01'
    }
]

const availableProducts = [
    {
        model: 'Xiaomi Redmi Note 9 Pro',
        category: Category.SMARTPHONE,
        sellingPrice: 220,
        details: '2020 smartphone',
        quantity: 7,
        arrivalDate: '2024-06-05'
    }
]

describe('ProductRoutes unit test', () => {

    describe('POST /products', () => {

        test("It should register a new product", async()=>{
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
    
            const response = await request(app)
                .post("/ezelectronics/products")
                .send(newProduct)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({})
        })

        test('It should return 401 for a user trying to register a product', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not logged in", status: 401 })
            })
    
            const response = await request(app)
                .post(`/ezelectronics/products`)
                .send(newProduct)
            
            expect(response.status).toBe(401)
        })

        test('It should return 409 if model already exists', async () => {
            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new ProductAlreadyExistsError())
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
    
            const response = await request(app)
                .post(`/ezelectronics/products`)
                .send(newProduct)
    
            expect(response.status).toBe(409)
        })

        test('It should return 422 for an invalid category', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const invalidProduct = { ...newProduct, category: 'InvalidCategory' }
    
            const response = await request(app)
                .post(`/ezelectronics/products`)
                .send(invalidProduct)
            
            expect(response.status).toBe(422)
        })

        test('It should return 422 for an empty model', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const invalidProduct = { ...newProduct, model: '' }
    
            const response = await request(app)
                .post(`/ezelectronics/products`)
                .send(invalidProduct)
            
            expect(response.status).toBe(422)
        })

        test('It should return 422 for a quantity less than or equal to 0', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const invalidProduct = { ...newProduct, quantity: 0 }
    
            const response = await request(app)
                .post(`/ezelectronics/products`)
                .send(invalidProduct)
            
            expect(response.status).toBe(422)
        })

        test('It should return 422 for a selling price less than or equal to 0', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const invalidProduct = { ...newProduct, sellingPrice: 0 };
    
            const response = await request(app)
                .post(`/ezelectronics/products`)
                .send(invalidProduct)
            
            expect(response.status).toBe(422)
        })

        test('It should return 422 for an empty arrivalDate', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const invalidProduct = { ...newProduct, arrivalDate: '' };
    
            const response = await request(app)
                .post(`/ezelectronics/products`)
                .send(invalidProduct)
            
            expect(response.status).toBe(422)
        })

        test('It should return 422 if arrivalDate is after the current date', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const invalidProduct = { ...newProduct, arrivalDate: '2025-01-01' };
    
            const response = await request(app)
                .post(`/ezelectronics/products`)
                .send(invalidProduct)
            
            expect(response.status).toBe(422);
        })

        test('It should return 422 for an invalid arrivalDate format', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const invalidProduct = { ...newProduct, arrivalDate: '01-01-2024' };
    
            const response = await request(app)
                .post(`/ezelectronics/products`)
                .send(invalidProduct)

            expect(response.status).toBe(422)
        })

    })

    describe('PATCH /products/:model', () => {

        test('It should increase product quantity', async()=>{
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(9)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
    
            const response = await request(app).patch(`/ezelectronics/products/${newProduct.model}`).send({quantity: 4})
            expect(response.status).toBe(200)
            expect(response.body).toEqual({quantity: 9})
        })

        test('It should return 401 for customer trying to increase product quantity', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not logged in", status: 401 })
            })

            const update = { quantity: 3 }
    
            const response = await request(app).patch(`/ezelectronics/products/${newProduct.model}`).send(update);
    
            expect(response.status).toBe(401)
        })

        test('It should return 400 error if changeDate is before the product\'s arrivalDate', async () => {
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new DateError())
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())

            const update = { quantity: 3, changeDate: '2024-01-01' }
    
            const response = await request(app).patch(`/ezelectronics/products/${newProduct.model}`).send(update)

            expect(response.status).toBe(400)
        })

        test('It should return 422 if changeDate is after the current date', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())

            const update = { quantity: 3, changeDate: '2025-01-01' }
    
            const response = await request(app).patch(`/ezelectronics/products/${newProduct.model}`).send(update)
    
            expect(response.status).toBe(422);
        });

    })

    describe('PATCH /products/:model/sell', () => {

        test('It should reduce product quantity', async()=>{
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(1)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
    
            const response = await request(app).patch(`/ezelectronics/products/${newProduct.model}/sell`).send({quantity: 4})
            expect(response.status).toBe(200)
            expect(response.body).toEqual({quantity: 1})
        })

        test('It should return 404 if product model does not exist', async () => {
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new ProductNotFoundError())
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
      
            const response = await request(app).patch(`/ezelectronics/products/NonExistentProduct/sell`).send({quantity: 4})
      
            expect(response.status).toBe(404)
          })
      
          test('It should return 409 if available quantity is 0', async () => {
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new EmptyProductStockError())
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
      
            const response = await request(app).patch(`/ezelectronics/products/ProductNotAvailable/sell`).send({quantity: 4})
      
            expect(response.status).toBe(409)
          })

    })

    describe('GET /products', () => {

        test('It should return all products', async()=>{
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(products)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
    
            const response = await request(app).get(`/ezelectronics/products`)
            expect(response.status).toBe(200)
            expect(response.body).toEqual(products)
        })

        test('It should return products filtered by category', async () => {
            jest.spyOn(ProductController.prototype, "getProducts")
                .mockResolvedValueOnce(smartphoneProducts)
                .mockResolvedValueOnce(laptopProducts)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
    
            let response = await request(app).get(`/ezelectronics/products`).query({ grouping: 'category', category: Category.SMARTPHONE })
      
            expect(response.status).toBe(200)
            expect(response.body.length).toBe(1)
            expect(response.body).toEqual(smartphoneProducts)
    
            response = await request(app).get(`/ezelectronics/products`).query({ grouping: 'category', category: Category.LAPTOP })
      
            expect(response.status).toBe(200)
            expect(response.body.length).toBe(1)
            expect(response.body).toEqual(laptopProducts)
        })

        test('It should return 422 if grouping is null and any of category or model is not null', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
    
            let response = await request(app).get(`/ezelectronics/products`).query({ grouping: null, category: Category.SMARTPHONE })
      
            expect(response.status).toBe(422)
    
            response = await request(app).get(`/ezelectronics/products`).query({ grouping: null, model: 'Microsoft Surface Pro 9' })
      
            expect(response.status).toBe(422)
        })

        test('It should return 422 if grouping is category and category is null', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(`/ezelectronics/products`).query({ grouping: 'category', category: null })
      
            expect(response.status).toBe(422)
        })
    
        test('It should return 422 if grouping is category and model is not null', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(`/ezelectronics/products`).query({ grouping: 'category', category: Category.SMARTPHONE, model: 'Xiaomi Redmi Note 9 Pro' })
      
            expect(response.status).toBe(422)
        })


        test('It should return 422 if grouping is model and model is null', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(`/ezelectronics/products`).query({ grouping: 'model', model: null })
    
            expect(response.status).toBe(422)
        })

        test('It should return 422 if grouping is model and category is not null', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(`/ezelectronics/products`).query({ grouping: 'model', model: 'Xiaomi Redmi Note 9 Pro', category: Category.SMARTPHONE })
    
            expect(response.status).toBe(422)
        })

        test('It should return 422 if grouping is not among null, category or model', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(`/ezelectronics/products`).query({ grouping: 'price'})
    
            expect(response.status).toBe(422)
        })

        test('It should return 422 if grouping is undefined while category or model are not', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
            
            let response = await request(app).get(`/ezelectronics/products`).query({ category: Category.SMARTPHONE })
            
            expect(response.status).toBe(422)
      
            response = await request(app).get(`/ezelectronics/products`).query({ model: 'Xiaomi Redmi Note 9 Pro' })
        
            expect(response.status).toBe(422)
          })

        test('It should return 404 if product model does not exist', async () => {
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new ProductNotFoundError())
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
      
            const response = await request(app).get(`/ezelectronics/products`)
                .query({ grouping: 'model', model: 'NonExistentModel' })
      
            expect(response.status).toBe(404)
        })

    })

    describe('GET /products/available', () => {

        test('It should return all available products', async()=>{
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(availableProducts)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
    
            const response = await request(app).get(`/ezelectronics/products/available`)
            expect(response.status).toBe(200)
            expect(response.body).toEqual(availableProducts)
        })

        test('It should return 404 if product model does not exist', async () => {
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new ProductNotFoundError())
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
      
            const response = await request(app).get(`/ezelectronics/products/available`)
                .query({ grouping: 'model', model: 'NonExistentModel' })
      
            expect(response.status).toBe(404)
        })

    })

    describe('DELETE /products/:model', () => {

        test('It should delete a product if the request is made by a Manager', async () => {
            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(`/ezelectronics/products/${newProduct.model}`)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({})
        })

        test('It should return 404 if product model does not exist', async () => {
            jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(new ProductNotFoundError())
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
      
            const response = await request(app).delete(`/ezelectronics/products/NonExistentProduct`)
      
            expect(response.status).toBe(404)
        })

    })

    describe('DELETE /products', () => {

        test('It should delete all products', async () => {
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(`/ezelectronics/products`)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({})

        })

    })

})