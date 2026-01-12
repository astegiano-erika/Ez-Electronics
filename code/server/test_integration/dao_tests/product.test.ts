import ProductDAO from '../../src/dao/productDAO';
import db from '../../src/db/db';
import { Category } from '../../src/components/product';
import { EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from '../../src/errors/productError';
import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"

jest.setTimeout(200000);

describe('ProductDAO Integrated Test', () => {
    
    const productDAO = new ProductDAO();

    /*
    afterEach(async () => {
            await productDAO.deleteProducts();
    })
    */

    describe('registerProduct method', () => {

        test('It should register a new product successfully', async () => {

            const result = await productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                10,
                '2024-06-01'
            )
    
            expect(result).toBe(true);
    
            const products = await productDAO.getProductsByModel('iPhone 14')
            const insertedProduct = products[0]

            expect(insertedProduct).toBeDefined()
            expect(insertedProduct.model).toBe('iPhone 14')
            expect(insertedProduct.category).toBe(Category.SMARTPHONE)
            expect(insertedProduct.sellingPrice).toBe(999)
            expect(insertedProduct.details).toBe('Latest model')
            expect(insertedProduct.quantity).toBe(10)
            expect(insertedProduct.arrivalDate).toBe('2024-06-01')

            await productDAO.deleteProducts();
        
        })

        test('It should throw an error if product already exists', async () => {
            
            await productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                10,
                '2024-06-01'
            );

            await expect(productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                10,
                '2024-06-01'
            )).rejects.toThrow(ProductAlreadyExistsError)

            await productDAO.deleteProducts();
            
        })

    })

    describe('increaseQuantity method', () => {

        test('It should increase quantity of an existing product and check the new quantity', async () => {
            
            await productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                10,
                '2024-06-01'
            )

            let result = await productDAO.getProductsByModel('iPhone 14')
            expect(result[0].quantity).toBe(10)

            await productDAO.increaseQuantity('iPhone 14', 5, '2024-06-01')

            result = await productDAO.getProductsByModel('iPhone 14')
            expect(result[0].quantity).toBe(15)

            await productDAO.deleteProducts();
        })

        test('It should throw an error if product does not exist', async () => {
            await expect(productDAO.increaseQuantity(
                'NonExistingProduct', 5, '2024-06-01'))
                .rejects.toThrow(ProductNotFoundError)

            await productDAO.deleteProducts();
        })

    })

    describe('sellProduct method', () => {

        test('It should decrease quantity of an existing product and check the decreased quantity', async () => {

            await productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                10,
                '2024-06-01'
            )
            
            let result = await productDAO.getProductsByModel('iPhone 14')
            expect(result[0].quantity).toBe(10)

            const newQuantity = await productDAO.sellProduct('iPhone 14', 5)
            expect(newQuantity).toBe(5)

            result = await productDAO.getProductsByModel('iPhone 14')
            expect(result[0].quantity).toBe(5)

            await productDAO.deleteProducts();
        })

        test('It should throw an error if product does not exist', async () => {
            await expect(productDAO.sellProduct(
                'NonExistingProduct', 5))
                .rejects.toThrow(ProductNotFoundError)

            await productDAO.deleteProducts();
        })

        test('It should throw an error if product quantity is 0', async () => {
            await productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Model with zero stock',
                3,
                '2024-06-01')

            await productDAO.sellProduct('iPhone 14', 3)

            await expect(productDAO.sellProduct(
                'iPhone 14', 1))
                .rejects.toThrow(EmptyProductStockError)

            await productDAO.deleteProducts();
        })

        test('It should throw an error if product quantity is less than purchase quantity', async () => {
            await productDAO.registerProduct(
                'LimitedStockProduct',
                Category.SMARTPHONE,
                999,
                'Model with limited stock',
                3,
                '2024-06-01')

            await expect(productDAO.sellProduct('LimitedStockProduct', 5)).rejects.toThrow(LowProductStockError)

            await productDAO.deleteProducts();
        })

    })

    describe('getProducts method', () => {

        test('It should return an empty array if no products exist', async () => {
            const products = await productDAO.getProducts()
            expect(products).toEqual([])

            await productDAO.deleteProducts();
        })

        test('It should return all registered products', async () => {
            await productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                10,
                '2024-06-01')

            await productDAO.registerProduct(
                'Acer Predator Helios 300',
                Category.LAPTOP,
                1300, 
                null,
                5,
                '2024-06-01')

            const products = await productDAO.getProducts()
            
            expect(products).toHaveLength(2)
            
            expect(products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ 
                        model: 'iPhone 14',
                        category: Category.SMARTPHONE,
                        sellingPrice: 999,
                        details: 'Latest model',
                        quantity: 10,
                        arrivalDate:'2024-06-01'
                     }),
                    expect.objectContaining({
                        model:'Acer Predator Helios 300',
                        category: Category.LAPTOP,
                        sellingPrice: 1300, 
                        details: null,
                        quantity: 5,
                        arrivalDate: '2024-06-01'
                    })
                ])
            )

            await productDAO.deleteProducts();
        })

    })

    describe('getAvailableProducts method', () => {

        test('It should return an empty array if no products are available', async () => {
            const products = await productDAO.getAvailableProducts()
            expect(products).toEqual([])

            await productDAO.deleteProducts();
        })

        // testare dopo la modifica del constraint
        test('It should return only available products among those registered', async () => {
            await productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                2,
                '2024-06-01')

            await productDAO.sellProduct('iPhone 14', 2)
            
            await productDAO.registerProduct(
                'Acer Predator Helios 300',
                Category.LAPTOP,
                1300, 
                null,
                5,
                '2024-06-01')

            const products = await productDAO.getAvailableProducts()

            expect(products).toHaveLength(1)
            
            expect(products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model:'Acer Predator Helios 300',
                        category: Category.LAPTOP,
                        sellingPrice: 1300, 
                        details: null,
                        quantity: 5,
                        arrivalDate: '2024-06-01'
                    })
                ])
            )

            await productDAO.deleteProducts();
        })

    })

    describe('getProductsByCategory method', () => {

        test('It should return an empty array if no products exist in the specified category', async () => {
            const products = await productDAO.getProductsByCategory(Category.SMARTPHONE)
            expect(products).toEqual([])

            await productDAO.deleteProducts();
        })

        test('It should return only products of the specified category', async () => {
            
            await productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                10,
                '2024-06-01')
            
            await productDAO.registerProduct(
                'Acer Predator Helios 300',
                Category.LAPTOP,
                1300, 
                null,
                5,
                '2024-06-01')
            
            const smartphoneProducts = await productDAO.getProductsByCategory(Category.SMARTPHONE)

            expect(smartphoneProducts).toHaveLength(1)
            expect(smartphoneProducts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: 'iPhone 14',
                        category: Category.SMARTPHONE,
                        sellingPrice: 999,
                        details: 'Latest model',
                        quantity: 10,
                        arrivalDate:'2024-06-01'
                    })
                ])
            )

            const laptopProducts = await productDAO.getProductsByCategory(Category.LAPTOP)
            
            expect(laptopProducts).toHaveLength(1)
            expect(laptopProducts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model:'Acer Predator Helios 300',
                        category: Category.LAPTOP,
                        sellingPrice: 1300, 
                        details: null,
                        quantity: 5,
                        arrivalDate: '2024-06-01'
                    })
                ])
            )

            await productDAO.deleteProducts();
        })

        test('It should handle invalid category and reject the promise', async () => {
            await expect(productDAO.getProductsByCategory('Vehicle')).rejects.toBeUndefined()

            await productDAO.deleteProducts();
        })

    })

    describe('getAvailableProductsByCategory method', () => {

        test('It should return an empty array if no available products exist in the specified category', async () => {
            const products = await productDAO.getAvailableProductsByCategory(Category.SMARTPHONE)
            expect(products).toEqual([])

            await productDAO.deleteProducts();
        })

        test('It should return only available products of the specified category', async () => {
            await productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                10,
                '2024-06-01')
            
            await productDAO.registerProduct(
                'Acer Predator Helios 300',
                Category.LAPTOP,
                1300, 
                null,
                2,
                '2024-06-01')

            await productDAO.sellProduct('Acer Predator Helios 300', 2)

            await productDAO.registerProduct(
                'Sony Bravia',
                Category.APPLIANCE,
                499,
                '4K UHD',
                1,
                '2024-06-01')

            await productDAO.sellProduct('Sony Bravia', 1)

            await productDAO.registerProduct(
                'Microsoft Surface Pro 9',
                Category.LAPTOP,
                1199,
                'Latest model',
                3,
                '2024-06-01')

            const smartphoneProducts = await productDAO.getAvailableProductsByCategory(Category.SMARTPHONE)
            
            expect(smartphoneProducts).toHaveLength(1)
            expect(smartphoneProducts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: 'iPhone 14',
                        category: Category.SMARTPHONE,
                        sellingPrice: 999,
                        details: 'Latest model',
                        quantity: 10,
                        arrivalDate:'2024-06-01'
                    })
                ])
            )

            const laptopProducts = await productDAO.getAvailableProductsByCategory(Category.LAPTOP)
            
            expect(laptopProducts).toHaveLength(1)
            expect(laptopProducts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: 'Microsoft Surface Pro 9',
                        category: Category.LAPTOP,
                        sellingPrice: 1199,
                        details: 'Latest model',
                        quantity: 3,
                        arrivalDate: '2024-06-01'
                    })
                ])
            )

            const applianceProducts = await productDAO.getAvailableProductsByCategory(Category.APPLIANCE)
            
            expect(applianceProducts).toEqual([])

            await productDAO.deleteProducts();
        })

        test('It should handle invalid category and reject the promise', async () => {
            await expect(productDAO.getAvailableProductsByCategory('Camera')).rejects.toBeUndefined()

            await productDAO.deleteProducts();
        })

    })


    
    describe('getProductsByModel method', () => {

        test('It should return an array containing only the registered product', async () => {
            await productDAO.registerProduct(
                'Microsoft Surface Pro 9',
                Category.LAPTOP,
                1199,
                'Latest model',
                3,
                '2024-06-01')

            let result = await productDAO.getProductsByModel('Microsoft Surface Pro 9')
            
            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: 'Microsoft Surface Pro 9',
                        category: Category.LAPTOP,
                        sellingPrice: 1199,
                        details: 'Latest model',
                        quantity: 3,
                        arrivalDate: '2024-06-01'
                    })
                ])
            )

            await productDAO.deleteProducts();

        })

        test('It should return an empty array if no products exist with the specified model', async () => {
            await expect(productDAO.getProductsByModel('NonExistentModel')).rejects.toThrow(ProductNotFoundError)

            await productDAO.deleteProducts();
        })

    })

    describe('getAvailableProductsByModel method', () => {

        test('It should throw an error if product does not exist', async () => {
            await expect(productDAO.getAvailableProductsByModel('iPhone 14')).rejects.toThrow(ProductNotFoundError)

            await productDAO.deleteProducts();
        })
    
        // the product exists but don't satisfy the available constraint(quantity>0)
        test('It should return an empty array of products for the given model', async () => {
            await productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                3,
                '2024-06-01')
            
            await productDAO.sellProduct('iPhone 14', 3)
    
            const products = await productDAO.getAvailableProductsByModel('iPhone 14');
    
            expect(products).toHaveLength(0);
    
            expect(products).toEqual(expect.arrayContaining([]));

            await productDAO.deleteProducts();
        });

        test('It should return only available products for the given model', async () => {
            await productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                1,
                '2024-06-01')
            
            await productDAO.registerProduct(
                'Microsoft Surface Pro 9',
                Category.LAPTOP,
                1199,
                'Latest model',
                3,
                '2024-06-01')
    
            const products = await productDAO.getAvailableProductsByModel('Microsoft Surface Pro 9');
    
            expect(products).toHaveLength(1);
    
            expect(products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: 'Microsoft Surface Pro 9',
                        category: Category.LAPTOP,
                        sellingPrice: 1199,
                        details: 'Latest model',
                        quantity: 3,
                        arrivalDate: '2024-06-01'
                    })
                ])
            );

            await productDAO.deleteProducts();
        });

    })

    describe('deleteProduct method', () => {

        test('It should delete an existing product successfully', async () => {
            
            await productDAO.registerProduct(
                'Microsoft Surface Pro 9',
                Category.LAPTOP,
                1199,
                'Latest model',
                3,
                '2024-06-01')

            const result = await productDAO.deleteProduct('Microsoft Surface Pro 9')
            expect(result).toBe(true)

            await expect(productDAO.getProductsByModel('Microsoft Surface Pro 9')).rejects.toThrow(ProductNotFoundError)

            await productDAO.deleteProducts();

            
        })

        test("It should throw an error if the product does not exist", async () => {
            await expect(productDAO.deleteProduct("iPhone 4000")).rejects.toThrow(ProductNotFoundError)

            await productDAO.deleteProducts();
        })

    })

    describe('deleteProducts method', () => {

        test('It should delete all products successfully', async () => {
            
            await productDAO.registerProduct(
                'iPhone 14',
                Category.SMARTPHONE,
                999,
                'Latest model',
                10,
                '2024-06-01')
            
            await productDAO.registerProduct(
                'Acer Predator Helios 300',
                Category.LAPTOP,
                1300, 
                null,
                1,
                '2024-06-01')

            await productDAO.registerProduct(
                'Sony Bravia',
                Category.APPLIANCE,
                499,
                '4K UHD',
                2,
                '2024-06-01')

            await productDAO.registerProduct(
                'Microsoft Surface Pro 9',
                Category.LAPTOP,
                1199,
                'Latest model',
                3,
                '2024-06-01')

            const result = await productDAO.deleteProducts()
            expect(result).toBe(true)

            const allProducts = await productDAO.getProducts()
            expect(allProducts).toHaveLength(0)

            await productDAO.deleteProducts();
        })

    })

})