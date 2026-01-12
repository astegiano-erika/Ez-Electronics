import { describe, test, expect, jest } from '@jest/globals'
import ProductController from '../../src/controllers/productController'
import ProductDAO from '../../src/dao/productDAO'
import { Category, Product } from '../../src/components/product'
import { LowProductStockError, ProductNotFoundError } from '../../src/errors/productError'
import { DateError } from '../../src/utilities'

jest.mock('../../src/dao/productDAO')

const testProduct = {
    model: 'Microsoft Surface Pro 9',
    category: Category.LAPTOP,
    quantity: 10,
    sellingPrice: 1199,
    details: 'Best portable laptop',    
    arrivalDate: '2023-06-11'
}

const testProducts = [
    new Product(999, 'iPhone 13', Category.SMARTPHONE, '2024-06-01', '', 8),
    new Product(1200, 'Sony Bravia', Category.APPLIANCE, '2024-06-03', '', 15),
    new Product(1199, 'Microsoft Surface Pro 9', Category.LAPTOP, '2024-03-12', 'Best portable laptop', 3),
    new Product(300, 'Xiamo Redmi Note 9 Pro', Category.SMARTPHONE, '2020-01-01', 'Not the latest phone', 0)    
]

const testSmartphoneProducts = [
    new Product(999, 'iPhone 13', Category.SMARTPHONE, '2024-06-01', '', 8),
    new Product(300, 'Xiamo Redmi Note 9 Pro', Category.SMARTPHONE, '2020-01-01', 'Not the latest phone', 0)    
]

const testModelProducts = [
    new Product(1200, 'Sony Bravia', Category.APPLIANCE, '2024-06-03', '', 15)
]

const testAvailableProducts = [
    new Product(999, 'iPhone 13', Category.SMARTPHONE, '2024-06-01', '', 8),
    new Product(1200, 'Sony Bravia', Category.APPLIANCE, '2024-06-03', '', 15),
    new Product(1199, 'Microsoft Surface Pro 9', Category.LAPTOP, '2024-03-12', 'Best portable laptop', 3)  
]

const testAvailableSmartphoneProducts = [
    new Product(999, 'iPhone 13', Category.SMARTPHONE, '2024-06-01', '', 8)
]

const testAvailableModelProducts = [
    new Product(1199, 'Microsoft Surface Pro 9', Category.LAPTOP, '2024-03-12', 'Best portable laptop', 3)
]

describe('ProductController Unit Test', () => {

    const controller = new ProductController()

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('registerProducts method', () => {
        test('Correct registration of a product', async () => {
            jest.spyOn(ProductDAO.prototype, 'registerProduct').mockResolvedValueOnce(true)

            const response = await controller.registerProducts(
                testProduct.model,
                testProduct.category,
                testProduct.quantity,
                testProduct.details,
                testProduct.sellingPrice,
                testProduct.arrivalDate
            )

            expect(response).toBe(true)
    
            expect(ProductDAO.prototype.registerProduct).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.registerProduct).toHaveBeenCalledWith(
                testProduct.model,
                testProduct.category,
                testProduct.sellingPrice,
                testProduct.details,
                testProduct.quantity,
                testProduct.arrivalDate
            )
        })
    })

    describe('updateProductQuantity method', () => {
        test('correct update of product quantity', async () => {
            jest.spyOn(ProductDAO.prototype, 'increaseQuantity').mockResolvedValueOnce(13)
    
            
            const newQuantity = await controller.changeProductQuantity(testProduct.model, 3, '2024-06-13')
        
            expect(ProductDAO.prototype.increaseQuantity).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.increaseQuantity).toHaveBeenCalledWith(
                testProduct.model,
                3,
                '2024-06-13'
            )
            expect(newQuantity).toBe(13)
        })
    
        test('returns 404 if product model does not exist', async () => {
            jest.spyOn(ProductDAO.prototype, 'increaseQuantity').mockRejectedValueOnce(ProductNotFoundError)
        
            const model = 'NonExistentModel'
            const quantity = 3
            const changeDate = '2024-01-02'
            
            await expect(controller.changeProductQuantity(model, quantity, changeDate)).rejects.toEqual(ProductNotFoundError)
        
            expect(ProductDAO.prototype.increaseQuantity).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.increaseQuantity).toHaveBeenCalledWith(
                model,
                quantity,
                changeDate
            )
        })
    
        test('returns 400 if changeDate is after current date', async () => {
            jest.spyOn(ProductDAO.prototype, 'increaseQuantity').mockRejectedValueOnce(DateError)
        
            const controller = new ProductController()
            const model = 'Microsoft Surface Pro 9'
            const quantity = 3
            const changeDate = '2025-06-02'
            
            await expect(controller.changeProductQuantity(model, quantity, changeDate)).rejects.toEqual(DateError)
        
            expect(ProductDAO.prototype.increaseQuantity).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.increaseQuantity).toHaveBeenCalledWith(
                model,
                quantity,
                changeDate
            )
        })
    })
    
    describe('sellProduct method', () => {
        test('correct registration of a product sale', async () => {
            jest.spyOn(ProductDAO.prototype, 'sellProduct').mockResolvedValueOnce(8)
        
            const quantity = 2
            
            const newQuantity = await controller.sellProduct(testProduct.model, quantity)
        
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(
                testProduct.model,
                quantity
            )
            expect(newQuantity).toBe(8)

        })
    
        test('returns 404 if product model does not exist', async () => {
            jest.spyOn(ProductDAO.prototype, 'sellProduct').mockRejectedValueOnce(ProductNotFoundError)
        
            const model = 'NonExistentModel'
            const quantity = 2
            
            await expect(controller.sellProduct(model, quantity)).rejects.toEqual(ProductNotFoundError)
        
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(
                model,
                quantity
            )
        })
    
        test('returns 409 if available quantity is less than requested quantity', async () => {
            jest.spyOn(ProductDAO.prototype, 'sellProduct').mockRejectedValueOnce(LowProductStockError)
        
            const controller = new ProductController()
            const quantity = 20
            
            await expect(controller.sellProduct(testProduct.model, quantity)).rejects.toEqual(LowProductStockError)
        
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(
                testProduct.model,
                quantity
            )
        })
    })

    describe('getAllProducts method', () => {
        test('returns all products when grouping is null', async () => {
            jest.spyOn(ProductDAO.prototype, 'getProducts').mockResolvedValueOnce(testProducts)
            
            const products = await controller.getProducts(null, null, null)
        
            expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1)
            expect(products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ 
                        model: 'iPhone 13',
                        category: Category.SMARTPHONE,
                        sellingPrice: 999,
                        details: '',
                        quantity: 8,
                        arrivalDate: '2024-06-01'
                    }),
                    expect.objectContaining({ 
                        model: 'Sony Bravia',
                        category: Category.APPLIANCE,
                        sellingPrice: 1200,
                        details: '',
                        quantity: 15,
                        arrivalDate: '2024-06-03'
                    }),
                    expect.objectContaining({ 
                        model: 'Microsoft Surface Pro 9',
                        category: Category.LAPTOP,
                        sellingPrice: 1199,
                        details: 'Best portable laptop',
                        quantity: 3,
                        arrivalDate: '2024-03-12'
                    }),
                    expect.objectContaining({ 
                        model: 'Xiamo Redmi Note 9 Pro',
                        category: Category.SMARTPHONE,
                        sellingPrice: 300,
                        details: 'Not the latest phone',
                        quantity: 0,
                        arrivalDate: '2020-01-01'
                    })
                ])
            )
        })
    
        test('returns products by category', async () => {
            jest.spyOn(ProductDAO.prototype, 'getProductsByCategory').mockResolvedValueOnce(testSmartphoneProducts)
            
            const products = await controller.getProducts('category', Category.SMARTPHONE, null)
        
            expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalledWith(Category.SMARTPHONE)
            expect(products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ 
                        model: 'iPhone 13',
                        category: Category.SMARTPHONE,
                        sellingPrice: 999,
                        details: '',
                        quantity: 8,
                        arrivalDate: '2024-06-01'
                    }),
                    expect.objectContaining({ 
                        model: 'Xiamo Redmi Note 9 Pro',
                        category: Category.SMARTPHONE,
                        sellingPrice: 300,
                        details: 'Not the latest phone',
                        quantity: 0,
                        arrivalDate: '2020-01-01'
                    })
                ])
            )
        })
    
        test('returns products by model', async () => {
            jest.spyOn(ProductDAO.prototype, 'getProductsByModel').mockResolvedValueOnce(testModelProducts)

            const model = 'Sony Bravia'
            
            const products = await controller.getProducts('model', null, model)
        
            expect(ProductDAO.prototype.getProductsByModel).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getProductsByModel).toHaveBeenCalledWith(model)
            expect(products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ 
                        model: 'Sony Bravia',
                        category: Category.APPLIANCE,
                        sellingPrice: 1200,
                        details: '',
                        quantity: 15,
                        arrivalDate: '2024-06-03'
                    })
                ])
            )
        })
    
    })    
    
    describe('getAvailableProducts method', () => {
        test('returns all available products when grouping is null', async () => {

            jest.spyOn(ProductDAO.prototype, 'getAvailableProducts').mockResolvedValueOnce(testAvailableProducts)
            
            const products = await controller.getAvailableProducts(null, null, null)
        
            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
            expect(products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ 
                        model: 'iPhone 13',
                        category: Category.SMARTPHONE,
                        sellingPrice: 999,
                        details: '',
                        quantity: 8,
                        arrivalDate: '2024-06-01'
                    }),
                    expect.objectContaining({ 
                        model: 'Sony Bravia',
                        category: Category.APPLIANCE,
                        sellingPrice: 1200,
                        details: '',
                        quantity: 15,
                        arrivalDate: '2024-06-03'
                    }),
                    expect.objectContaining({ 
                        model: 'Microsoft Surface Pro 9',
                        category: Category.LAPTOP,
                        sellingPrice: 1199,
                        details: 'Best portable laptop',
                        quantity: 3,
                        arrivalDate: '2024-03-12'
                    })
                ])
            )
            
        })

        test('returns all available products by category', async () => {

            jest.spyOn(ProductDAO.prototype, 'getAvailableProductsByCategory').mockResolvedValueOnce(testAvailableSmartphoneProducts)
            
            const products = await controller.getAvailableProducts('category', Category.SMARTPHONE, null)
        
            expect(ProductDAO.prototype.getAvailableProductsByCategory).toHaveBeenCalledTimes(1)
            expect(products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ 
                        model: 'iPhone 13',
                        category: Category.SMARTPHONE,
                        sellingPrice: 999,
                        details: '',
                        quantity: 8,
                        arrivalDate: '2024-06-01'
                    })
                ])
            )
            
        })

        test('returns all available products by model', async () => {
            
            jest.spyOn(ProductDAO.prototype, 'getAvailableProductsByModel').mockResolvedValueOnce(testAvailableModelProducts)
            
            const model = 'Microsoft Surface Pro 9'

            const products = await controller.getAvailableProducts('model', null, model)
        
            expect(ProductDAO.prototype.getAvailableProductsByModel).toHaveBeenCalledTimes(1)
            expect(products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ 
                        model: 'Microsoft Surface Pro 9',
                        category: Category.LAPTOP,
                        sellingPrice: 1199,
                        details: 'Best portable laptop',
                        quantity: 3,
                        arrivalDate: '2024-03-12'
                    })
                ])
            )
            
        })
    })
    

    describe('deleteProduct method', () => {
        test('Deletes a product by model', async () => {
            jest.spyOn(ProductDAO.prototype, 'deleteProduct').mockResolvedValueOnce(true)
            
            const controller = new ProductController()

            const response = await controller.deleteProduct(testProduct.model)

            expect(response).toBe(true)
        
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith(testProduct.model)
        })
    
        test('Returns 404 if product model does not exist', async () => {
            jest.spyOn(ProductDAO.prototype, 'deleteProduct').mockRejectedValueOnce(ProductNotFoundError)
            
            const controller = new ProductController()

            await expect(controller.deleteProduct('NonExistentModel')).rejects.toEqual(ProductNotFoundError)
        
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith('NonExistentModel')
        })
    })
    

    describe('ProductController Test: deleteAllProducts', () => {
        test('deletes all products', async () => {
            jest.spyOn(ProductDAO.prototype, 'deleteProducts').mockResolvedValueOnce(true)
            
            const controller = new ProductController()

            const response = await controller.deleteAllProducts()

            expect(response).toBe(true)
        
            expect(ProductDAO.prototype.deleteProducts).toHaveBeenCalledTimes(1)
        })
    })

})